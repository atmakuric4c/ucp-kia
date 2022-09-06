const db = require("../../config/database");
const dbHandler = require('../../config/api_db_handler');
const awsExternalServices = require('../external_services/aws.service');
const AWS = require('aws-sdk');

const awsDevopsModel = {
    getAWSRepoList: getAWSRepoList,
    getAWSRepoDetails: getAWSRepoDetails,
    getAWSRepoFiles: getAWSRepoFiles,
    getAWSRepoFileContent: getAWSRepoFileContent,
    getAWSRepoBranches: getAWSRepoBranches,
    addAWSRepo: addAWSRepo,
    deleteAWSRepo: deleteAWSRepo,
    getAWSPipelineList: getAWSPipelineList,
    getAWSPipelineDetails: getAWSPipelineDetails,
    getAWSPipelineStatus: getAWSPipelineStatus,
    getAWSPipelineExecutionHistory: getAWSPipelineExecutionHistory,
    startAWSPipeline: startAWSPipeline,
    stopAWSPipeline: stopAWSPipeline,
    deleteAWSPipeline: deleteAWSPipeline,
    getAWSRegionList: getAWSRegionList
}

async function getAWSRepoList(req) {
  
    let { set, limit } = req.query;
    let { clientid } = req;
    let offset = '';
    let clientInp = { client_id: clientid };
    let values = {...clientInp};

    let checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `AWS is not enabled`, status: 400 });
    

    if(set && limit){
        offset = ` limit :offset, :limit`;
        values = { ...clientInp, offset: parseInt((set - 1) * limit), limit: parseInt(limit) }
    }

    let sql = `select repo_id, aws_repo_id, name, region_id from c4_aws_client_repos where client_id = :client_id and status = 1 ${offset}`
    let sql_count = `select count(*) as count from c4_aws_client_repos where client_id = :client_id and status = 1`;

    let list = await dbHandler.executeQueryv2(sql, values );
    let count = await dbHandler.executeQueryv2(sql_count, clientInp );

    let response = { output : list, count: count.length ? count[0]['count'] : 0 };
    return response;
  
}

async function getAWSRepoDetails(req) {

    let { clientid } = req;
    let { id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `AWS is not enabled`, status: 400 });

    let sql = `select * from c4_aws_client_tokens where clientid= :clientid and 
    record_status = 1 order by id asc limit 1`;
    let list = await dbHandler.executeQueryv2(sql, { clientid: clientid } );

    let awsRepo = `select * from c4_aws_client_repos where client_id = :client_id and repo_id = :repo_id and status = 1`
    let awsRepoRes = await dbHandler.executeQueryv2(awsRepo, { client_id: clientid, repo_id: id } );

    if(!awsRepoRes.length) throw ({ type: "custom", message: `repo not found`, status: 400 });

    let awsRepoExternal = new AWS.CodeCommit({ region: awsRepoRes[0]['region_id'], accessKeyId: list[0]['accesstoken'], secretAccessKey: list[0]['secretekey'] });

    let awsRepoDetails = await awsExternalServices.getAWSRepoDetails(awsRepoExternal, awsRepoRes[0]);

    let response = { output : awsRepoDetails['repositoryMetadata'], count: 1 };
    return response;
}


async function getAWSRepoFiles(req) {

    let { clientid } = req;
    let { id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `AWS is not enabled`, status: 400 });

    let sql = `select * from c4_aws_client_tokens where clientid= :clientid and 
    record_status = 1 order by id asc limit 1`;
    let list = await dbHandler.executeQueryv2(sql, { clientid: clientid } );

    let awsRepo = `select * from c4_aws_client_repos where client_id = :client_id and repo_id = :repo_id and status = 1`
    let awsRepoRes = await dbHandler.executeQueryv2(awsRepo, { client_id: clientid, repo_id: id } );

    if(!awsRepoRes.length) throw ({ type: "custom", message: `repo not found`, status: 400 });

    let awsRepoExternal = new AWS.CodeCommit({ region: awsRepoRes[0]['region_id'], accessKeyId: list[0]['accesstoken'], secretAccessKey: list[0]['secretekey'] });

    let awsRepoFolder = await awsExternalServices.getAWSRepoFolder(awsRepoExternal, awsRepoRes[0]);

    let response = { output : awsRepoFolder, count: 1 };
    return response;
}

async function getAWSRepoFileContent(req) {

    let { clientid } = req;
    let { id, file_id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `AWS is not enabled`, status: 400 });

    let sql = `select * from c4_aws_client_tokens where clientid= :clientid and 
    record_status = 1 order by id asc limit 1`;
    let list = await dbHandler.executeQueryv2(sql, { clientid: clientid } );

    let awsRepo = `select * from c4_aws_client_repos where client_id = :client_id and repo_id = :repo_id and status = 1`
    let awsRepoRes = await dbHandler.executeQueryv2(awsRepo, { client_id: clientid, repo_id: id } );

    if(!awsRepoRes.length) throw ({ type: "custom", message: `repo not found`, status: 400 });

    let awsRepoExternal = new AWS.CodeCommit({ region: awsRepoRes[0]['region_id'], accessKeyId: list[0]['accesstoken'], secretAccessKey: list[0]['secretekey'] });

    let awsRepoFileContent = await awsExternalServices.getAWSRepoFileContent(awsRepoExternal, {
        ...awsRepoRes[0],
        file_id: file_id
    });

    let response = { output : awsRepoFileContent['content'], count: 1 };
    return response;
}

async function getAWSRepoBranches(req) {

    let { clientid } = req;
    let { id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `AWS is not enabled`, status: 400 });

    let sql = `select * from c4_aws_client_tokens where clientid= :clientid and 
    record_status = 1 order by id asc limit 1`;
    let list = await dbHandler.executeQueryv2(sql, { clientid: clientid } );

    let awsRepo = `select * from c4_aws_client_repos where client_id = :client_id and repo_id = :repo_id and status = 1`
    let awsRepoRes = await dbHandler.executeQueryv2(awsRepo, { client_id: clientid, repo_id: id } );

    if(!awsRepoRes.length) throw ({ type: "custom", message: `repo not found`, status: 400 });

    let awsRepoExternal = new AWS.CodeCommit({ region: awsRepoRes[0]['region_id'], accessKeyId: list[0]['accesstoken'], secretAccessKey: list[0]['secretekey'] });

    let awsRepoBranches = await awsExternalServices.getAWSRepoBranches(awsRepoExternal, awsRepoRes[0]);

    let response = { output : awsRepoBranches['branches'], count: awsRepoBranches['branches'] ? awsRepoBranches['branches'].length : 0 };
    return response;
}

async function addAWSRepo(req) {

    let { clientid } = req;
    let { id } = req.params;
    let { region } = req.body;
    let awsRepo;

    let checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `AWS is not enabled`, status: 400 });

    let sql = `select * from c4_aws_client_tokens where clientid= :clientid and 
    record_status = 1 order by id asc limit 1`;
    let list = await dbHandler.executeQueryv2(sql, { clientid: clientid } );

    let awsRepoExternal = new AWS.CodeCommit({ region: region, accessKeyId: list[0]['accesstoken'], secretAccessKey: list[0]['secretekey'] });

    try{
        awsRepo = await awsExternalServices.addAWSRepo(awsRepoExternal, req.body);
        let addBranchAndFile = await awsExternalServices.addAWSBranchAndFile(awsRepoExternal, req.body);
    }
    catch(ex){
        throw ({ type: "custom", message: ex.message, status: 400 });
    }

    let response = { output : awsRepo['repositoryMetadata'], count: 1 };
    return response;
}

async function deleteAWSRepo(req) {

    let { clientid } = req;
    let { id } = req.params;
    let { region } = req.body;
    let awsRepo;

    let checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `AWS is not enabled`, status: 400 });

    let sql = `select * from c4_aws_client_tokens where clientid= :clientid and 
    record_status = 1 order by id asc limit 1`;
    let list = await dbHandler.executeQueryv2(sql, { clientid: clientid } );

    let awsRepoQuery = `select * from c4_aws_client_repos where client_id = :client_id and repo_id = :repo_id and status = 1`
    let awsRepoRes = await dbHandler.executeQueryv2(awsRepoQuery, { client_id: clientid, repo_id: id } );

    if(!awsRepoRes.length) throw ({ type: "custom", message: `repo not found`, status: 400 });

    let awsRepoExternal = new AWS.CodeCommit({ region: awsRepoRes[0]['region_id'], accessKeyId: list[0]['accesstoken'], secretAccessKey: list[0]['secretekey'] });

    try{
        awsRepo = await awsExternalServices.deleteAWSRepo(awsRepoExternal, { name: awsRepoRes[0]['name'] });
    }
    catch(ex){
        throw ({ type: "custom", message: ex.message, status: 400 });
    }

    let response = { output : awsRepo, count: 1 };
    return response;
}

async function getAWSPipelineList(req) {
  
    let { set, limit } = req.query;
    let { clientid } = req;
    let offset = '';
    let clientInp = { client_id: clientid };
    let values = {...clientInp};

    let checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `AWS is not enabled`, status: 400 });
    

    if(set && limit){
        offset = ` limit :offset, :limit`;
        values = { ...clientInp, offset: parseInt((set - 1) * limit), limit: parseInt(limit) }
    }

    let sql = `select pipeline_id, version, name, region_id from c4_aws_client_pipelines where client_id = :client_id and status = 1 ${offset}`
    let sql_count = `select count(*) as count from c4_aws_client_pipelines where client_id = :client_id and status = 1`;

    let list = await dbHandler.executeQueryv2(sql, values );
    let count = await dbHandler.executeQueryv2(sql_count, clientInp );

    let response = { output : list, count: count.length ? count[0]['count'] : 0 };
    return response;
  
}

async function getAWSPipelineDetails(req) {

    let { clientid } = req;
    let { id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `AWS is not enabled`, status: 400 });

    let sql = `select * from c4_aws_client_tokens where clientid= :clientid and 
    record_status = 1 order by id asc limit 1`;
    let list = await dbHandler.executeQueryv2(sql, { clientid: clientid } );

    let awsPipeline = `select * from c4_aws_client_pipelines where client_id = :client_id and pipeline_id = :pipeline_id and status = 1`
    let awsPipelineRes = await dbHandler.executeQueryv2(awsPipeline, { client_id: clientid, pipeline_id: id } );

    if(!awsPipelineRes.length) throw ({ type: "custom", message: `pipeline not found`, status: 400 });

    let awsPipelineExternal = new AWS.CodePipeline({ region: awsPipelineRes[0]['region_id'], accessKeyId: list[0]['accesstoken'], secretAccessKey: list[0]['secretekey'] });

    let awsPipelineDetails = await awsExternalServices.getAWSPipelineDetails(awsPipelineExternal, awsPipelineRes[0]);

    let response = { output : awsPipelineDetails['pipeline'], count: 1 };
    return response;
}

async function getAWSPipelineStatus(req) {

    let { clientid } = req;
    let { id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `AWS is not enabled`, status: 400 });

    let sql = `select * from c4_aws_client_tokens where clientid= :clientid and 
    record_status = 1 order by id asc limit 1`;
    let list = await dbHandler.executeQueryv2(sql, { clientid: clientid } );

    let awsPipeline = `select * from c4_aws_client_pipelines where client_id = :client_id and pipeline_id = :pipeline_id and status = 1`
    let awsPipelineRes = await dbHandler.executeQueryv2(awsPipeline, { client_id: clientid, pipeline_id: id } );

    if(!awsPipelineRes.length) throw ({ type: "custom", message: `pipeline not found`, status: 400 });

    let awsPipelineExternal = new AWS.CodePipeline({ region: awsPipelineRes[0]['region_id'], accessKeyId: list[0]['accesstoken'], secretAccessKey: list[0]['secretekey'] });

    let awsPipelineStatus = await awsExternalServices.getAWSPipelineStatus(awsPipelineExternal, awsPipelineRes[0]);

    let response = { output : awsPipelineStatus, count: 1 };
    return response;
}


async function getAWSPipelineExecutionHistory(req) {

    let { clientid } = req;
    let { id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `AWS is not enabled`, status: 400 });

    let sql = `select * from c4_aws_client_tokens where clientid= :clientid and 
    record_status = 1 order by id asc limit 1`;
    let list = await dbHandler.executeQueryv2(sql, { clientid: clientid } );

    let awsPipeline = `select * from c4_aws_client_pipelines where client_id = :client_id and pipeline_id = :pipeline_id and status = 1`
    let awsPipelineRes = await dbHandler.executeQueryv2(awsPipeline, { client_id: clientid, pipeline_id: id } );

    if(!awsPipelineRes.length) throw ({ type: "custom", message: `pipeline not found`, status: 400 });

    let awsPipelineExternal = new AWS.CodePipeline({ region: awsPipelineRes[0]['region_id'], accessKeyId: list[0]['accesstoken'], secretAccessKey: list[0]['secretekey'] });

    let awsPipelineExecutionHistory = await awsExternalServices.getAWSPipelineExecutionHistory(awsPipelineExternal, awsPipelineRes[0]);

    let response = { output : awsPipelineExecutionHistory['pipelineExecutionSummaries'], count: 1 };
    return response;
}

async function startAWSPipeline(req) {

    let { clientid } = req;
    let { id } = req.params;
    let startAwsPipeline;

    let checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `AWS is not enabled`, status: 400 });

    let sql = `select * from c4_aws_client_tokens where clientid= :clientid and 
    record_status = 1 order by id asc limit 1`;
    let list = await dbHandler.executeQueryv2(sql, { clientid: clientid } );

    let awsPipeline = `select * from c4_aws_client_pipelines where client_id = :client_id and pipeline_id = :pipeline_id and status = 1`
    let awsPipelineRes = await dbHandler.executeQueryv2(awsPipeline, { client_id: clientid, pipeline_id: id } );

    if(!awsPipelineRes.length) throw ({ type: "custom", message: `pipeline not found`, status: 400 });

    let awsPipelineExternal = new AWS.CodePipeline({ region: awsPipelineRes[0]['region_id'], accessKeyId: list[0]['accesstoken'], secretAccessKey: list[0]['secretekey'] });

    let status = await awsExternalServices.getAWSPipelineExecutionHistory(awsPipelineExternal, {
        ...awsPipelineRes[0],
        limit: 1
    });
    
    if(status['pipelineExecutionSummaries'].length && status['pipelineExecutionSummaries'][0]['status'] == 'InProgress') 
        throw ({ type: "custom", message: `pipeline is already under execution`, status: 400 });

    try{
        startAwsPipeline = await awsExternalServices.startAWSPipeline(awsPipelineExternal, awsPipelineRes[0]);
    }
    catch(ex){
        throw ({ type: "custom", message: ex.message, status: 400 });
    }

    let response = { output : startAwsPipeline, count: 1 };
    return response;
}

async function stopAWSPipeline(req) {

    let { clientid } = req;
    let { id, execution_id } = req.params;
    let stopAwsPipeline;

    let checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `AWS is not enabled`, status: 400 });

    let sql = `select * from c4_aws_client_tokens where clientid= :clientid and 
    record_status = 1 order by id asc limit 1`;
    let list = await dbHandler.executeQueryv2(sql, { clientid: clientid } );

    let awsPipeline = `select * from c4_aws_client_pipelines where client_id = :client_id and pipeline_id = :pipeline_id and status = 1`
    let awsPipelineRes = await dbHandler.executeQueryv2(awsPipeline, { client_id: clientid, pipeline_id: id } );

    if(!awsPipelineRes.length) throw ({ type: "custom", message: `pipeline not found`, status: 400 });

    let awsPipelineExternal = new AWS.CodePipeline({ region: awsPipelineRes[0]['region_id'], accessKeyId: list[0]['accesstoken'], secretAccessKey: list[0]['secretekey'] });

    try{

        stopAwsPipeline = await awsExternalServices.stopAWSPipeline(awsPipelineExternal, {
            ...awsPipelineRes[0], 
            pipelineExecutionId: execution_id
        });
    }
    catch(ex){
        throw ({ type: "custom", message: ex.message, status: 400 });
    }

    let response = { output : stopAwsPipeline, count: 1 };
    return response;
}


async function deleteAWSPipeline(req) {

    let { clientid } = req;
    let { id } = req.params;
    let deleteAwsPipeline;

    let checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `AWS is not enabled`, status: 400 });

    let sql = `select * from c4_aws_client_tokens where clientid= :clientid and 
    record_status = 1 order by id asc limit 1`;
    let list = await dbHandler.executeQueryv2(sql, { clientid: clientid } );

    let awsPipeline = `select * from c4_aws_client_pipelines where client_id = :client_id and pipeline_id = :pipeline_id and status = 1`
    let awsPipelineRes = await dbHandler.executeQueryv2(awsPipeline, { client_id: clientid, pipeline_id: id } );

    if(!awsPipelineRes.length) throw ({ type: "custom", message: `pipeline not found`, status: 400 });

    let awsPipelineExternal = new AWS.CodePipeline({ region: awsPipelineRes[0]['region_id'], accessKeyId: list[0]['accesstoken'], secretAccessKey: list[0]['secretekey'] });

    try{
        deleteAwsPipeline = await awsExternalServices.deleteAWSPipeline(awsPipelineExternal, awsPipelineRes[0]);
    }
    catch(ex){
        throw ({ type: "custom", message: ex.message, status: 400 });
    }

    let response = { output : deleteAwsPipeline, count: 1 };
    return response;
}

async function getAWSRegionList(req) {
  
    let { set, limit } = req.query;
    let { clientid } = req;
    let offset = '';
    let values = {};

    let checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `AWS is not enabled`, status: 400 });
    

    if(set && limit){
        offset = ` limit :offset, :limit`;
        values = { offset: parseInt((set - 1) * limit), limit: parseInt(limit) }
    }

    let sql = `SELECT * from c4_aws_client_regions order by regionname asc ${offset}`
    let sql_count = `select count(*) as count from c4_aws_client_regions`;

    let list = await dbHandler.executeQueryv2(sql, values );
    let count = await dbHandler.executeQueryv2(sql_count, {} );

    let response = { output : list, count: count.length ? count[0]['count'] : 0 };
    return response;
  
}


module.exports = awsDevopsModel;

