const dbHandler= require('../config/api_db_handler')
var db = require('../config/database');
var dbFunc = require('../config/db-function');
const helper = require('../helpers/common_helper')
const axios = require('axios')
const in_array = require('in_array');
const dateFormat = require('dateformat');
const request=require('request')
const querystring = require('querystring');
const config=require('../config/constants');
var base64 = require('base-64');
const ordersModel=require('../app/models/orders.model');
const { urlencoded } = require('body-parser');
let mail = require("../common/mailer.js");
const AWS = require('aws-sdk');
const moment = require('moment');
const awsExternalServices = require('../app/external_services/aws.service');


async function syncClientAWSRepos(syncClientId = null) {

    let sqlAwsClient, sqlAwsClientRes;
  
    if(!syncClientId){
        sqlAwsClient = `select id, email, is_aws_enabled from c4_clients where is_aws_enabled = 1`;
        sqlAwsClientRes = await dbHandler.executeQueryv2(sqlAwsClient, { } );
    }
    else{
        sqlAwsClient = `select id, email, is_aws_enabled from c4_clients where id = :client_id and is_aws_enabled = 1`;
        sqlAwsClientRes = await dbHandler.executeQueryv2(sqlAwsClient, { client_id: syncClientId } );
    }
  
    let credentialPromise = sqlAwsClientRes.map(single_client => {
        let sql = `select * from c4_aws_client_tokens where clientid = :clientid and 
        record_status = 1 order by id asc limit 1`;
        return dbHandler.executeQueryv2(sql, { clientid: single_client.id } );
    });
  
    let crendentials = await Promise.all(credentialPromise);
    let credentialsList = crendentials.map((element, index) => {
      return {
        ...element[0],
        ...sqlAwsClientRes[index]
      };
    });

    let getRegions = `select * from c4_aws_client_regions`;
    let getRegionsRes = await dbHandler.executeQueryv2(getRegions, { } );

    let finalOutput = [];

    //console.log(credentialsList);

    for(let single_client of credentialsList){

        //console.log(single_client, getRegionsRes);

        let codecommitList = getRegionsRes.map(ele => {
            return new AWS.CodeCommit({ region: ele['regionid'], accessKeyId: single_client['accesstoken'], secretAccessKey: single_client['secretekey'] })
        });

        //console.log(codecommitList);

        let codeCommitPromises = codecommitList.map(codecommit => awsExternalServices.getAWSRepoList(codecommit, {}));
        let codeCommitRes = (await Promise.all(codeCommitPromises.map(p => p.catch(e => {return { repositories: []}}))));
        codeCommitRes = codeCommitRes.map((ele, index) => {
            let out = [];
            ele['repositories'].forEach(element => {
                out.push({...element,'region_id': getRegionsRes[index]['regionid']});
            });

            return out;
        });

        
        codeCommitRes = Array.prototype.concat.apply([], codeCommitRes);

        //finalOutput.push(codeCommitRes);
        //continue;


        let getDBRepo = `select * from c4_aws_client_repos where client_id = :client_id and status = 1`;
        let getDBRepoRes = await dbHandler.executeQueryv2(getDBRepo, { client_id: single_client['clientid'] } );

        let updationList = getDBRepoRes.filter(singleBDRepo => codeCommitRes.some( singleCodeCommit => singleCodeCommit['repositoryId'] ===  singleBDRepo['aws_repo_id']));
        updationList = updationList.map(ele => codeCommitRes.filter(element => element['repositoryId'] == ele['aws_repo_id']))
        let deletionList = getDBRepoRes.filter(singleBDRepo => !codeCommitRes.some( singleCodeCommit => singleCodeCommit['repositoryId'] ===  singleBDRepo['aws_repo_id']));
        let insertionList = codeCommitRes.filter(singleCodeCommit => !getDBRepoRes.some( singleBDRepo => singleBDRepo['aws_repo_id'] ===  singleCodeCommit['repositoryId']));

        //console.log(insertionList, deletionList, updationList);
        //continue;

        let dbSync = async function (records, type){

            let sql = '';
            let dbPromise = [];

            if(type == 'add'){
                sql = `insert into c4_aws_client_repos(client_id, region_id, aws_repo_id, name, status, created_at, updated_at) 
                        values (:client_id, :region_id, :aws_repo_id, :name, :status, :created_at, :updated_at)`;
                for(let record of records){
                    let obj = { 
                        client_id: single_client['clientid'], 
                        region_id: record['region_id'], 
                        aws_repo_id: record['repositoryId'], 
                        name: record['repositoryName'], 
                        status: 1,
                        created_at: Date.now(),
                        updated_at: Date.now()
                    }
                    dbPromise.push(dbHandler.executeQueryv2(sql,obj));
                }

                
            } 

            if(type == 'delete'){
                sql = `update c4_aws_client_repos set status = 0, updated_at = :updated_at where aws_repo_id = :aws_repo_id and client_id = :client_id`;
                for(let record of records){
                    let obj = { 
                        client_id: single_client['clientid'], 
                        aws_repo_id: record['aws_repo_id'],
                        updated_at: Date.now()
                    }
                    dbPromise.push(dbHandler.executeQueryv2(sql,obj));
                }
                
            }

            if(type == 'update'){
                sql = `update c4_aws_client_repos set name = :name, updated_at = :updated_at, status = 1 where aws_repo_id = :aws_repo_id and client_id = :client_id`;
                for(let record of records){
                    let obj = { 
                        client_id: single_client['clientid'], 
                        name: record[0]['repositoryName'],
                        aws_repo_id: record[0]['repositoryId'],
                        updated_at: Date.now()
                    }


                    dbPromise.push(dbHandler.executeQueryv2(sql,obj));
                }
                
            }

            return Promise.all(dbPromise);

        }

        let insert = await dbSync(insertionList, 'add');
        let delete1 = await dbSync(deletionList, 'delete');
        let update = await dbSync(updationList, 'update');

        //let output = await Promise.all(dbSync(insertionList, 'add'),dbSync(deletionList, 'delete'),dbSync(updationList, 'update'));
        finalOutput.push(insert);
        finalOutput.push(delete1);
        finalOutput.push(update);
    }

    return { message:'success', data : finalOutput, count: finalOutput.length, status: 200 };

}

async function syncClientAWSPipelines() {
  
    let sqlAwsClient = `select id, email, is_aws_enabled from c4_clients where is_aws_enabled = 1`;
    let sqlAwsClientRes = await dbHandler.executeQueryv2(sqlAwsClient, { } );
  
    let credentialPromise = sqlAwsClientRes.map(single_client => {
        let sql = `select * from c4_aws_client_tokens where clientid = :clientid and 
        record_status = 1 order by id asc limit 1`;
        return dbHandler.executeQueryv2(sql, { clientid: single_client.id } );
    });
  
    let crendentials = await Promise.all(credentialPromise);
    let credentialsList = crendentials.map((element, index) => {
      return {
        ...element[0],
        ...sqlAwsClientRes[index]
      };
    });

    let getRegions = `select * from c4_aws_client_regions`;
    let getRegionsRes = await dbHandler.executeQueryv2(getRegions, { } );

    let finalOutput = [];

    //console.log(credentialsList);

    for(let single_client of credentialsList){

        //console.log(single_client, getRegionsRes);

        let codepipelineList = getRegionsRes.map(ele => {
            return new AWS.CodePipeline({ region: ele['regionid'], accessKeyId: single_client['accesstoken'], secretAccessKey: single_client['secretekey'] })
        });

        //console.log(codecommitList);

        let codePipelinePromises = codepipelineList.map(codepipeline => awsExternalServices.getAWSPipelineList(codepipeline, {}));
        let codePipelineRes = (await Promise.all(codePipelinePromises.map(p => p.catch(e => {return { pipelines: []}}))));
        codePipelineRes = codePipelineRes.map((ele, index) => {
            let out = [];
            ele['pipelines'].forEach(element => {
                out.push({...element,'region_id': getRegionsRes[index]['regionid']});
            });

            return out;
        });

        
        codePipelineRes = Array.prototype.concat.apply([], codePipelineRes);

        //finalOutput.push(codeCommitRes);
        //continue;


        let getDBRepo = `select * from c4_aws_client_pipelines where client_id = :client_id and status = 1`;
        let getDBRepoRes = await dbHandler.executeQueryv2(getDBRepo, { client_id: single_client['clientid'] } );

        let updationList = getDBRepoRes.filter(singleBDRepo => codePipelineRes.some( singleCodeCommit => singleCodeCommit['name'] ===  singleBDRepo['name'] 
            && singleCodeCommit['region_id'] ===  singleBDRepo['region_id']
        ));
        updationList = updationList.map(ele => codePipelineRes.filter(element => element['name'] == ele['name'] && element['region_id'] == ele['region_id']))
        let deletionList = getDBRepoRes.filter(singleBDRepo => !codePipelineRes.some( singleCodeCommit => singleCodeCommit['name'] ===  singleBDRepo['name']
            && singleCodeCommit['region_id'] ===  singleBDRepo['region_id']
        ));
        let insertionList = codePipelineRes.filter(singleCodeCommit => !getDBRepoRes.some( singleBDRepo => singleBDRepo['name'] ===  singleCodeCommit['name'] 
            && singleBDRepo['region_id'] ===  singleCodeCommit['region_id']
        ));

        console.log(insertionList, deletionList, updationList);
        //continue;

        let dbSync = async function (records, type){

            let sql = '';
            let dbPromise = [];

            if(type == 'add'){
                sql = `insert into c4_aws_client_pipelines(client_id, region_id, version, name, status, created_at, updated_at) 
                        values (:client_id, :region_id, :version, :name, :status, :created_at, :updated_at)`;
                for(let record of records){
                    let obj = { 
                        client_id: single_client['clientid'], 
                        region_id: record['region_id'], 
                        version: record['version'], 
                        name: record['name'], 
                        status: 1,
                        created_at: Date.now(),
                        updated_at: Date.now()
                    }
                    dbPromise.push(dbHandler.executeQueryv2(sql,obj));
                }

                
            } 

            if(type == 'delete'){
                sql = `update c4_aws_client_pipelines set status = 0, updated_at = :updated_at where name = :name and client_id = :client_id and region_id = :region_id`;
                for(let record of records){
                    let obj = { 
                        client_id: single_client['clientid'], 
                        name: record['name'],
                        region_id: record['region_id'],
                        updated_at: Date.now()
                    }
                    dbPromise.push(dbHandler.executeQueryv2(sql,obj));
                }
                
            }

            if(type == 'update'){
                sql = `update c4_aws_client_pipelines set version = :version, updated_at = :updated_at, status = 1 where name = :name and client_id = :client_id and region_id = :region_id`;
                for(let record of records){
                    let obj = { 
                        client_id: single_client['clientid'], 
                        name: record[0]['name'],
                        region_id: record[0]['region_id'],
                        version: record[0]['version'],
                        updated_at: Date.now()
                    }


                    dbPromise.push(dbHandler.executeQueryv2(sql,obj));
                }
                
            }

            return Promise.all(dbPromise);

        }

        let insert = await dbSync(insertionList, 'add');
        let delete1 = await dbSync(deletionList, 'delete');
        let update = await dbSync(updationList, 'update');

        //let output = await Promise.all(dbSync(insertionList, 'add'),dbSync(deletionList, 'delete'),dbSync(updationList, 'update'));
        finalOutput.push(insert);
        finalOutput.push(delete1);
        finalOutput.push(update);
    }

    return { message:'success', data : finalOutput, count: finalOutput.length, status: 200 };

}


module.exports={
    syncClientAWSRepos,
    syncClientAWSPipelines
}


  
