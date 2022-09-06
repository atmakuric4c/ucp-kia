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
var {LocalStorage} = require('node-localstorage');
const { promises } = require('dns');
const { response } = require('express');
const { networkInterfaces } = require('os');
const msExternalServices = require('../app/external_services/ms.service');

let msdevopsOauth=(req,res)=>{
	if(!req.query.clientid)
		res.redirect(config.MS_DEVOPS.msdevops_error_url);
	
	localStorage = new LocalStorage('./scratch')

	localStorage.setItem('ucp-msdevops', JSON.stringify(req.query));
	console.log(localStorage.getItem('ucp-msdevops'))
	
//		open(authorizeUrl, {wait: false}).then(cp => cp.unref());
	authorizeUrl = `https://app.vssps.visualstudio.com/oauth2/authorize?client_id=${config.MS_DEVOPS.client_id}&response_type=Assertion&state=User1&scope=${config.MS_DEVOPS.scope}&redirect_uri=${config.MS_DEVOPS.redirect_uri}`;
	console.log(authorizeUrl);
	res.redirect(authorizeUrl);
}

let msdevopsReturnUrl=(req,callback)=>{
	localStorage = new LocalStorage('./scratch');
	let cts = Math.round(new Date().getTime() / 1000);
	
//	localStorage.setItem('ucp-msdevops', JSON.stringify({"clientid":"222"}));
	
	console.log("msdevopsReturnUrl "+localStorage.getItem('ucp-msdevops'))
	let ucp_msdevops = JSON.parse(localStorage.getItem('ucp-msdevops'));
	
	localStorage._deleteLocation()
	console.log("msdevopsReturnUrl "+localStorage.getItem('ucp-msdevops'));
	
	let res = {status:"error","message":"Invalid Credentials."};
	if(!ucp_msdevops || !ucp_msdevops.clientid){
		return callback(1,res);
	}
	if(!ucp_msdevops || !ucp_msdevops.domain){
		return callback(1,res);
	}
	
	let redirectUrl = '';
	if(ucp_msdevops && ucp_msdevops.redirectUrl){
		redirectUrl = ucp_msdevops.redirectUrl;
	}else{
		redirectUrl = ucp_msdevops.domain;
	}
	let clientid = ucp_msdevops.clientid;
	
	var client_sql=`select * from c4_clients where id='${ucp_msdevops.clientid}' limit 1`;
    // console.log("client_sql");
    // console.log(client_sql);
    dbHandler.executeQuery(client_sql,function(client_results){
    	if(client_results.length > 0){
    		let res = {status:"error","message":"Invalid Credentials.",client_entity_id:client_results[0].client_entity_id,redirectUrl:redirectUrl,clientid:clientid};
			/**
			 * Create a new OAuth2 client with the configured keys.
			 */
	        console.log('entered in then block!');
	        console.log("req.query.code");
			console.log(req.query.code);
			if(req.query.code){
				new Promise(async (resolve, reject) => {
					try{
						let reqData = `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=${encodeURI(config.MS_DEVOPS.client_secret)}&grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${encodeURI(req.query.code)}&redirect_uri=${config.MS_DEVOPS.redirect_uri}`;
						//console.log("reqData");
						//console.log(reqData);
						//console.log("reqData.length");
						//console.log(reqData.length);
						var options = {
                        	    'method': 'POST',
                        	    'url': 'https://app.vssps.visualstudio.com/oauth2/token',
                        	    'headers': {
                        	    	'Content-Type' : 'application/x-www-form-urlencoded',
                        	      'Content-Length': reqData.length
                        	    },
                        	    'data' : reqData
                        	  };
                    	//console.log("options");
                        //console.log(options);
                        	
                    	await axios(options)
                        .then(async oauth2Response => {
                        	//console.log("oauth2Response");
    						//console.log(oauth2Response);
    						//console.log(oauth2Response.data);
    						let clientUpdateData = {
			                    updateddate : (new Date().getTime() / 1000),
			                    is_msdevops_enabled : 1
			                };
			                //console.log("clientUpdateData");
			                //console.log(clientUpdateData);
			                
			                await dbHandler.updateTableData('c4_clients',{'id':ucp_msdevops.clientid},clientUpdateData,function(err,result){
	    						var sql=`select * from c4_msdevops_client_tokens where clientid='${ucp_msdevops.clientid}' limit 1`;
					             //console.log("sql");
					             //console.log(sql);
					            dbHandler.executeQuery(sql,function(results){
						            // console.log("results");
						            // console.log(results);
						            if(results.length > 0){
						            	var tokendata={
						            			access_token:oauth2Response.data.access_token,
						            			refresh_token : oauth2Response.data.refresh_token,
						            			token_type:oauth2Response.data.token_type,
						            			expiry_date: (parseInt(cts) + parseInt(oauth2Response.data.expires_in)),
						            			response_obj : JSON.stringify(oauth2Response.data),
						            			updated_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
					    	              }
						            	dbHandler.updateTableData('c4_msdevops_client_tokens',{clientid:ucp_msdevops.clientid},tokendata,function(err,result){
							            	  let res = {status:"success","message":"Valid Credentials.",redirectUrl:redirectUrl,clientid:clientid};
							                  return callback(null,res);
							              });
						            }else{
						              var tokendata={
						            		clientid:ucp_msdevops.clientid,
						            		access_token:oauth2Response.data.access_token,
					            			refresh_token : oauth2Response.data.refresh_token,
					            			token_type:oauth2Response.data.token_type,
					            			expiry_date: (parseInt(cts) + parseInt(oauth2Response.data.expires_in)),
					            			response_obj : JSON.stringify(oauth2Response.data),
					            			created_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
						              }
						              dbHandler.insertIntoTable('c4_msdevops_client_tokens',tokendata,function(err,result){
					                    	  let res = {status:"success","message":"Valid Credentials.",redirectUrl:redirectUrl,clientid:clientid};
					    	                  return callback(null,res);
						              });
						            }
					            });
			                });
                        }).catch(error => {
                            console.log("error");
                            let res = {status:"error",message:error};
                            if(error && error.response && error.response.data
                          		  && error.response.data.error 
                          		  && error.response.data.error.message){
                          	  res.message = error.response.data.error.message
                            }
                            console.log(res);
                        });
		    		}
		            catch{
		            	let res = {status:"error","message":"Invalid Credentials.",redirectUrl:redirectUrl,clientid:clientid};
		                return callback(1,res);
		            }
			       
				});
			}else{
	    		let res = {status:"error","message":"Invalid request.",redirectUrl:redirectUrl,clientid:clientid};
	            return callback(1,res);
	    	}
    	}else{
    		let res = {status:"error","message":"Invalid request.",redirectUrl:redirectUrl,clientid:clientid};
            return callback(1,res);
    	}
    });
}

let msdevops_authtoken=(clientid,callback)=>{
  if(typeof clientid == 'undefined'){
      return callback(null,[]);
  }else{
      new Promise(function(resolve,reject){
          dbHandler.getOneRecord('c4_clients',{id:clientid},function(result){
              resolve(result)
          })
      }).then(async function(clientDetails){
        var crypto = require('crypto');
        clientDetails.mdclientid = crypto.createHash('md5').update(""+clientDetails.id).digest("hex");
        clientDetails.base64_clientid = base64.encode (clientDetails.id);
        // console.log("clientDetails");
        // console.log(clientDetails);
        var cts=Math.floor(Date.now() / 1000);
//      console.log("cts");
//         console.log(cts);
        var sql=`select * from c4_msdevops_client_tokens where clientid='${clientDetails.id}' order by id desc limit 1`;
//         console.log("sql");
//         console.log(sql);
        dbHandler.executeQuery(sql,async function(results){
//         console.log("results");
//         console.log(results);
        if(results.length == 0){
        	return callback(null,[]);
        }else if(results.length > 0 && results[0].expiry_date > cts){
            var response={data:results[0].id,tokendata:results[0],message:'Token Exists',clientdata:clientDetails};
            // console.log("ifff response");
            // console.log(response);
            return callback(null,response)
        }else{
        	let reqData = `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=${encodeURI(config.MS_DEVOPS.client_secret)}&grant_type=refresh_token&assertion=${encodeURI(results[0].refresh_token)}&redirect_uri=${config.MS_DEVOPS.redirect_uri}`;
			//console.log("reqData");
			//console.log(reqData);
			//console.log("reqData.length");
			//console.log(reqData.length);
			var options = {
            	    'method': 'POST',
            	    'url': 'https://app.vssps.visualstudio.com/oauth2/token',
            	    'headers': {
            	    	'Content-Type' : 'application/x-www-form-urlencoded',
            	      'Content-Length': reqData.length
            	    },
            	    'data' : reqData
            	  };
        	//console.log("options");
            //console.log(options);
            
            await axios(options)
            .then(async oauth2Response => {
            	//console.log("oauth2Response");
				//console.log(oauth2Response);
				//console.log(oauth2Response.data);
				
				var tokendata={
            			access_token:oauth2Response.data.access_token,
            			refresh_token : oauth2Response.data.refresh_token,
            			token_type:oauth2Response.data.token_type,
            			expiry_date: (parseInt(cts) + parseInt(oauth2Response.data.expires_in)),
            			response_obj : JSON.stringify(oauth2Response.data),
            			updated_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
	              }
//            	console.log("tokendata");
//            	console.log(tokendata);
            	dbHandler.updateTableData('c4_msdevops_client_tokens',{clientid:clientDetails.id},tokendata,function(err,result){
            		var response={data:results[0].id,tokendata:tokendata,message:'Token Exists',clientdata:clientDetails};
            		return callback(null,response)
            	});
				
            }).catch(error => {
                console.log("error");
                let res = {status:"error",message:error};
                if(error && error.response && error.response.data
              		  && error.response.data.error 
              		  && error.response.data.error.message){
              	  res.message = error.response.data.error.message
                }
                console.log(res);
                return callback(null,[]);
            });
            
        }
      });
    }); 
  }
}

async function syncClientMSProjects(syncClientId = null) {

	let sqlMSDevopsClient, sqlMSDevopsClientRes;
	let finalOutput = [];

	if(!syncClientId){
		sqlMSDevopsClient = `select id, email, is_msdevops_enabled from c4_clients where is_msdevops_enabled = 1`;
		sqlMSDevopsClientRes = await dbHandler.executeQueryv2(sqlMSDevopsClient, { } );
	}
	else{
		sqlMSDevopsClient = `select id, email, is_msdevops_enabled from c4_clients where id = :client_id and is_msdevops_enabled = 1`;
		sqlMSDevopsClientRes = await dbHandler.executeQueryv2(sqlMSDevopsClient, { client_id: syncClientId } );
	}
	
	for(let singleClient of sqlMSDevopsClientRes){

		let credentialPromise = await new Promise((resolve, reject) => msdevops_authtoken(singleClient.id,function(err,result){
			if (err) resolve({});
			resolve(result);
		}));

		if(!Object.keys(credentialPromise).length) continue;

		let authtoken = credentialPromise['tokendata']['access_token'];

		let orgSql = `select * from c4_ms_client_organizations where client_id = :client_id and status = 1`;
		let orgRes = await dbHandler.executeQueryv2(orgSql, { client_id: singleClient.id } );

		let orgProjectPromises = orgRes.map(singlOrg => msExternalServices.getMSProjectList(singlOrg, authtoken));
		let orgProjectRes = (await Promise.all(orgProjectPromises.map(p => p.catch(e => { return {data: {value: []}}})))).map(a => a.data.value);
		orgProjectRes = orgProjectRes.map((ele, index) => {
            let out = [];
            ele.forEach(element => {
                out.push({...element,'organization_id': orgRes[index]['organization_id']});
            });

            return out;
        });
		orgProjectRes = Array.prototype.concat.apply([], orgProjectRes);

		let getDBProjects = `select * from c4_ms_client_projects where client_id = :client_id and status = 1`;
		let getDBProjectsRes = await dbHandler.executeQueryv2(getDBProjects, { client_id: singleClient['id'] } );
		
		let updationList = getDBProjectsRes.filter(singleBDProject => orgProjectRes.some( singleProject => singleProject['id'] ===  singleBDProject['ms_project_id'] ));
		updationList = updationList.map(ele => orgProjectRes.filter(element => element['id'] == ele['ms_project_id']))
		let deletionList = getDBProjectsRes.filter(singleBDProject => !orgProjectRes.some( singleProject => singleProject['id'] ===  singleBDProject['ms_project_id']));
		let insertionList = orgProjectRes.filter(singleProject => !getDBProjectsRes.some( singleBDProject => singleBDProject['ms_project_id'] ===  singleProject['id'] ));

		//console.log(insertionList, deletionList, updationList);

		let dbSync = async function (records, type){

            let sql = '';
            let dbPromise = [];

            if(type == 'add'){
                sql = `insert into c4_ms_client_projects(client_id, organization_id, ms_project_id, name, url, state, revision, status, created_at, updated_at) 
                        values (:client_id, :organization_id, :ms_project_id, :name, :url, :state, :revision, :status, :created_at, :updated_at)`;
                for(let record of records){
                    let obj = { 
                        client_id: singleClient['id'], 
                        organization_id: record['organization_id'], 
                        ms_project_id: record['id'], 
						name: record['name'], 
						url: record['url'], 
						state: record['state'], 
						revision: record['revision'], 
                        status: 1,
                        created_at: Date.now(),
                        updated_at: Date.now()
                    }
                    dbPromise.push(dbHandler.executeQueryv2(sql,obj));
                }

                
            } 

            if(type == 'delete'){
                sql = `update c4_ms_client_projects set status = 0, updated_at = :updated_at where ms_project_id = :ms_project_id and client_id = :client_id`;
                for(let record of records){
                    let obj = { 
						updated_at: Date.now(),
						ms_project_id: record['ms_project_id'],
                        client_id: singleClient['id']
                    }
                    dbPromise.push(dbHandler.executeQueryv2(sql,obj));
                }
                
            }

            if(type == 'update'){
				sql = `update c4_ms_client_projects set name = :name, url= :url,state = :state, revision= :revision, updated_at = :updated_at, 
						status = 1 where ms_project_id = :ms_project_id and client_id = :client_id`;
                for(let record of records){
                    let obj = {
						name: record[0]['name'], 
						url: record[0]['url'], 
						state: record[0]['state'], 
						revision: record[0]['revision'], 
						updated_at: Date.now(),
						ms_project_id: record[0]['id'],
                        client_id: singleClient['id']
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


async function syncClientMSRepos(syncClientId = null) {

	let sqlMSDevopsClient, sqlMSDevopsClientRes;
	let finalOutput = [];

	if(!syncClientId){
		sqlMSDevopsClient = `select id, email, is_msdevops_enabled from c4_clients where is_msdevops_enabled = 1`;
		sqlMSDevopsClientRes = await dbHandler.executeQueryv2(sqlMSDevopsClient, { } );
	}
	else{
		sqlMSDevopsClient = `select id, email, is_msdevops_enabled from c4_clients where id = :client_id and is_msdevops_enabled = 1`;
		sqlMSDevopsClientRes = await dbHandler.executeQueryv2(sqlMSDevopsClient, { client_id: syncClientId } );
	}
	
	for(let singleClient of sqlMSDevopsClientRes){

		let credentialPromise = await new Promise((resolve, reject) => msdevops_authtoken(singleClient.id,function(err,result){
			if (err) resolve({});
			resolve(result);
		}));

		if(!Object.keys(credentialPromise).length) continue;

		let authtoken = credentialPromise['tokendata']['access_token'];

		let orgSql = `select cmcp.*,cmco.name AS organization_name from c4_ms_client_projects AS cmcp LEFT JOIN c4_ms_client_organizations AS cmco ON cmcp.organization_id = cmco.organization_id 
		where cmcp.client_id = :client_id and cmcp.status = 1 and cmco.status = 1`;
		let orgRes = await dbHandler.executeQueryv2(orgSql, { client_id: singleClient.id } );

		let orgProjectPromises = orgRes.map(singlOrg => msExternalServices.getMSRepoList(singlOrg, authtoken));
		let orgProjectRes = (await Promise.all(orgProjectPromises.map(p => p.catch(e => { return {data: {value: []}}})))).map(a => a.data.value);
		orgProjectRes = orgProjectRes.map((ele, index) => {
            let out = [];
            ele.forEach(element => {
                out.push({...element,'organization_id': orgRes[index]['organization_id'], 'project_id': orgRes[index]['project_id']});
            });

            return out;
        });
		orgProjectRes = Array.prototype.concat.apply([], orgProjectRes);


		let getDBProjects = `select * from c4_ms_client_repos where client_id = :client_id and status = 1`;
		let getDBProjectsRes = await dbHandler.executeQueryv2(getDBProjects, { client_id: singleClient['id'] } );
		
		let updationList = getDBProjectsRes.filter(singleBDProject => orgProjectRes.some( singleProject => singleProject['id'] ===  singleBDProject['ms_repo_id'] ));
		updationList = updationList.map(ele => orgProjectRes.filter(element => element['id'] == ele['ms_repo_id']))
		let deletionList = getDBProjectsRes.filter(singleBDProject => !orgProjectRes.some( singleProject => singleProject['id'] ===  singleBDProject['ms_repo_id']));
		let insertionList = orgProjectRes.filter(singleProject => !getDBProjectsRes.some( singleBDProject => singleBDProject['ms_repo_id'] ===  singleProject['id'] ));

		//console.log(insertionList, deletionList, updationList);

		let dbSync = async function (records, type){

            let sql = '';
            let dbPromise = [];

            if(type == 'add'){
                sql = `insert into c4_ms_client_repos(client_id, organization_id, project_id, ms_repo_id, name, url, default_branch, remote_url, status, created_at, updated_at) 
                        values (:client_id, :organization_id, :project_id, :ms_repo_id, :name, :url, :default_branch, :remote_url, :status, :created_at, :updated_at)`;
                for(let record of records){
                    let obj = { 
                        client_id: singleClient['id'], 
						organization_id: record['organization_id'], 
						project_id: record['project_id'], 
                        ms_repo_id: record['id'], 
						name: record['name'], 
						url: record['url'], 
						default_branch: record['defaultBranch'], 
						remote_url: record['remoteUrl'], 
                        status: 1,
                        created_at: Date.now(),
                        updated_at: Date.now()
                    }
                    dbPromise.push(dbHandler.executeQueryv2(sql,obj));
                }

                
            } 

            if(type == 'delete'){
                sql = `update c4_ms_client_repos set status = 0, updated_at = :updated_at where ms_repo_id = :ms_repo_id and client_id = :client_id`;
                for(let record of records){
                    let obj = { 
						updated_at: Date.now(),
						ms_repo_id: record['ms_repo_id'],
                        client_id: singleClient['id']
                    }
                    dbPromise.push(dbHandler.executeQueryv2(sql,obj));
                }
                
            }

            if(type == 'update'){
				sql = `update c4_ms_client_repos set name = :name, url= :url,default_branch = :default_branch, remote_url = :remote_url, updated_at = :updated_at, 
						status = 1 where ms_repo_id = :ms_repo_id and client_id = :client_id`;
                for(let record of records){
                    let obj = {
						name: record[0]['name'], 
						url: record[0]['url'], 
						default_branch: record[0]['defaultBranch'], 
						remote_url: record[0]['remoteUrl'], 
						updated_at: Date.now(),
						ms_repo_id: record[0]['id'],
                        client_id: singleClient['id']
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


async function syncClientMSPipelines() {

	let sqlMSDevopsClient = `select id, email, is_msdevops_enabled from c4_clients where is_msdevops_enabled = 1`;
	let sqlMSDevopsClientRes = await dbHandler.executeQueryv2(sqlMSDevopsClient, { } );
	let finalOutput = [];
	
	for(let singleClient of sqlMSDevopsClientRes){

		let credentialPromise = await new Promise((resolve, reject) => msdevops_authtoken(singleClient.id,function(err,result){
			if (err) resolve({});
			resolve(result);
		}));

		if(!Object.keys(credentialPromise).length) continue;

		let authtoken = credentialPromise['tokendata']['access_token'];

		let orgSql = `select cmcp.*,cmco.name AS organization_name from c4_ms_client_projects AS cmcp LEFT JOIN c4_ms_client_organizations AS cmco ON cmcp.organization_id = cmco.organization_id 
		where cmcp.client_id = :client_id and cmcp.status = 1 and cmco.status = 1`;
		let orgRes = await dbHandler.executeQueryv2(orgSql, { client_id: singleClient.id } );

		let orgPipelinePromises = orgRes.map(singlOrg => msExternalServices.getMSPipelineList(singlOrg, authtoken));
		let orgPipelineRes = (await Promise.all(orgPipelinePromises.map(p => p.catch(e => { return {data: {value: []}}})))).map(a => a.data.value);
		orgPipelineRes = orgPipelineRes.map((ele, index) => {
            let out = [];
            ele.forEach(element => {
                out.push({...element,'organization_id': orgRes[index]['organization_id'], 'project_id': orgRes[index]['project_id']});
            });

            return out;
        });
		orgPipelineRes = Array.prototype.concat.apply([], orgPipelineRes);

		let getDBProjects = `select * from c4_ms_client_pipelines where client_id = :client_id and status = 1`;
		let getDBProjectsRes = await dbHandler.executeQueryv2(getDBProjects, { client_id: singleClient['id'] } );
		
		let updationList = getDBProjectsRes.filter(singleBDProject => orgPipelineRes.some( singleProject => singleProject['id'] ==  singleBDProject['ms_pipeline_id'] ));
		updationList = updationList.map(ele => orgPipelineRes.filter(element => element['id'] == ele['ms_pipeline_id']))
		let deletionList = getDBProjectsRes.filter(singleBDProject => !orgPipelineRes.some( singleProject => singleProject['id'] ==  singleBDProject['ms_pipeline_id']));
		let insertionList = orgPipelineRes.filter(singleProject => !getDBProjectsRes.some( singleBDProject => singleBDProject['ms_pipeline_id'] ==  singleProject['id'] ));

		//console.log(insertionList, deletionList, updationList);

		let dbSync = async function (records, type){

            let sql = '';
            let dbPromise = [];

            if(type == 'add'){
                sql = `insert into c4_ms_client_pipelines(client_id, organization_id, project_id, ms_pipeline_id, name, url, revision, status, created_at, updated_at) 
                        values (:client_id, :organization_id, :project_id, :ms_pipeline_id, :name, :url, :revision, :status, :created_at, :updated_at)`;
                for(let record of records){
                    let obj = { 
                        client_id: singleClient['id'], 
						organization_id: record['organization_id'], 
						project_id: record['project_id'], 
                        ms_pipeline_id: record['id'], 
						name: record['name'], 
						url: record['url'], 
						revision: record['revision'],  
                        status: 1,
                        created_at: Date.now(),
                        updated_at: Date.now()
                    }
                    dbPromise.push(dbHandler.executeQueryv2(sql,obj));
                }

                
            } 

            if(type == 'delete'){
                sql = `update c4_ms_client_pipelines set status = 0, updated_at = :updated_at where ms_pipeline_id = :ms_pipeline_id and client_id = :client_id`;
                for(let record of records){
                    let obj = { 
						updated_at: Date.now(),
						ms_pipeline_id: record['ms_pipeline_id'],
                        client_id: singleClient['id']
                    }
                    dbPromise.push(dbHandler.executeQueryv2(sql,obj));
                }
                
            }

            if(type == 'update'){
				sql = `update c4_ms_client_pipelines set name = :name, url= :url,revision = :revision, updated_at = :updated_at, 
						status = 1 where ms_pipeline_id = :ms_pipeline_id and client_id = :client_id`;
                for(let record of records){
                    let obj = {
						name: record[0]['name'], 
						url: record[0]['url'], 
						revision: record[0]['revision'], 
						updated_at: Date.now(),
						ms_pipeline_id: record[0]['id'],
                        client_id: singleClient['id']
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
	msdevops_authtoken,
    msdevopsOauth,
    msdevopsReturnUrl,
	syncClientMSProjects,
	syncClientMSRepos,
	syncClientMSPipelines
}

