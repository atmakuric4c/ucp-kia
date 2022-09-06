const db = require("../../config/database");
const dbHandler = require('../../config/api_db_handler');
const msExternalServices = require('../external_services/ms.service');
const msDevopsSyncModel = require('../../models/msdevops_model');
const AWS = require('aws-sdk');

const msDevopsModel = {
    getMSRepoList: getMSRepoList,
    getMSRepoDetails: getMSRepoDetails,
    getMSRepoFiles: getMSRepoFiles,
    addMSRepo: addMSRepo,
    deleteMSRepo: deleteMSRepo,
    getMSPipelineList: getMSPipelineList,
    getMSPipelineDetails: getMSPipelineDetails,
    getMSPipelineRuns: getMSPipelineRuns,
    getMSPipelineRunDetails: getMSPipelineRunDetails,
    startMSPipeline: startMSPipeline,
    getMSOrganizationList: getMSOrganizationList,
    getMSProjectList: getMSProjectList
}

async function getMSRepoList(req) {
  
    let { set, limit } = req.query;
    let { clientid } = req;
    let offset = '';
    let clientInp = { client_id: clientid };
    let values = {...clientInp};

    let checkStatusQuery = `select * from c4_clients where is_msdevops_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `Azure is not enabled`, status: 400 });
    

    if(set && limit){
        offset = ` limit :offset, :limit`;
        values = { ...clientInp, offset: parseInt((set - 1) * limit), limit: parseInt(limit) }
    }

    let sql = `select cmcr.*,cmcp.name AS project_name, cmco.name AS organization_name from c4_ms_client_repos AS cmcr LEFT JOIN c4_ms_client_projects AS cmcp ON cmcr.project_id = cmcp.project_id
                LEFT JOIN c4_ms_client_organizations AS cmco ON cmcr.organization_id = cmco.organization_id
                where cmcr.client_id = :client_id and cmcr.status = 1 and cmcp.status = 1 and cmco.status = 1 ${offset}`
    let sql_count = `select count(*) AS count from c4_ms_client_repos AS cmcr LEFT JOIN c4_ms_client_projects AS cmcp ON cmcr.project_id = cmcp.project_id
                    LEFT JOIN c4_ms_client_organizations AS cmco ON cmcr.organization_id = cmco.organization_id
                    where cmcr.client_id = :client_id and cmcr.status = 1 and cmcp.status = 1 and cmco.status = 1`;

    let list = await dbHandler.executeQueryv2(sql, values );
    let count = await dbHandler.executeQueryv2(sql_count, clientInp );

    let response = { output : list, count: count.length ? count[0]['count'] : 0 };
    return response;
  
}

async function getMSRepoDetails(req) {

    let { clientid } = req;
    let { id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_msdevops_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `Azure is not enabled`, status: 400 });

    let credentialPromise = await new Promise((resolve, reject) => msDevopsSyncModel.msdevops_authtoken(clientid,function(err,result){
        if (err) resolve({});
        resolve(result);
    }));
    if(!Object.keys(credentialPromise).length) throw ({ type: "custom", message: `credentials not available`, status: 400 });;

    let authtoken = credentialPromise['tokendata']['access_token'];

    let msRepo = `select cmcr.*,cmcp.name AS project_name, cmco.name AS organization_name from c4_ms_client_repos AS cmcr LEFT JOIN c4_ms_client_projects AS cmcp ON cmcr.project_id = cmcp.project_id
    LEFT JOIN c4_ms_client_organizations AS cmco ON cmcr.organization_id = cmco.organization_id
    where cmcr.client_id = :client_id and cmcr.status = 1 and repo_id = :repo_id`
    let msRepoRes = await dbHandler.executeQueryv2(msRepo, { client_id: clientid, repo_id: id } );
    if(!msRepoRes.length) throw ({ type: "custom", message: `repo not found`, status: 404 });

    let msRepoDetails = await msExternalServices.getMSRepoDetails(msRepoRes[0], authtoken);

    let response = { output : msRepoDetails.data, count: 1 };
    return response;
}

async function getMSRepoFiles(req) {

    let { clientid } = req;
    let { id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_msdevops_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `Azure is not enabled`, status: 400 });

    let credentialPromise = await new Promise((resolve, reject) => msDevopsSyncModel.msdevops_authtoken(clientid,function(err,result){
        if (err) resolve({});
        resolve(result);
    }));
    if(!Object.keys(credentialPromise).length) throw ({ type: "custom", message: `credentials not available`, status: 400 });;

    let authtoken = credentialPromise['tokendata']['access_token'];

    let msRepo = `select cmcr.*,cmcp.name AS project_name, cmco.name AS organization_name from c4_ms_client_repos AS cmcr LEFT JOIN c4_ms_client_projects AS cmcp ON cmcr.project_id = cmcp.project_id
    LEFT JOIN c4_ms_client_organizations AS cmco ON cmcr.organization_id = cmco.organization_id
    where cmcr.client_id = :client_id and cmcr.status = 1 and repo_id = :repo_id`
    let msRepoRes = await dbHandler.executeQueryv2(msRepo, { client_id: clientid, repo_id: id } );
    if(!msRepoRes.length) throw ({ type: "custom", message: `repo not found`, status: 404 });

    let msRepoDetails = await msExternalServices.getMSRepoFiles(msRepoRes[0], authtoken);

    let response = { output : msRepoDetails.data.value, count: msRepoDetails.data.count };
    return response;
}

async function addMSRepo(req) {

    let { clientid } = req;
    let { id } = req.params;
    let { organization_id, project_id } = req.body;

    let checkStatusQuery = `select * from c4_clients where is_msdevops_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `Azure is not enabled`, status: 400 });

    let credentialPromise = await new Promise((resolve, reject) => msDevopsSyncModel.msdevops_authtoken(clientid,function(err,result){
        if (err) resolve({});
        resolve(result);
    }));
    if(!Object.keys(credentialPromise).length) throw ({ type: "custom", message: `credentials not available`, status: 400 });;

    let authtoken = credentialPromise['tokendata']['access_token'];

    let organizationQuery = `select * from c4_ms_client_organizations where organization_id = :organization_id`;
    let organizationStatus = await dbHandler.executeQueryv2(organizationQuery, { organization_id: organization_id });
    if(!organizationStatus.length) throw ({ type: "custom", message: `organization not found`, status: 404 });

    let projectQuery = `select * from c4_ms_client_projects where project_id = :project_id`;
    let projectStatus = await dbHandler.executeQueryv2(projectQuery, { project_id: project_id });
    if(!projectStatus.length) throw ({ type: "custom", message: `project not found`, status: 404 });

    try{
        var msRepoDetails = await msExternalServices.addMSRepo({
            ...req.body,
            organization_name: organizationStatus[0]['name'],
            project_name: projectStatus[0]['name'] 
        }, authtoken);
    }
    catch(error){
        let errorMessage;
        if(error.response.data && typeof(error.response.data) == 'object' && 'message' in error.response.data)
            errorMessage = error.response.data.message
        else
            errorMessage = error.response.data
        throw ({ type: "custom", message: errorMessage, status: error.response.status });
    }

    let response = { output : msRepoDetails.data, count: 1 };
    return response;
}


async function deleteMSRepo(req) {

    let { clientid } = req;
    let { id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_msdevops_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `Azure is not enabled`, status: 400 });

    let credentialPromise = await new Promise((resolve, reject) => msDevopsSyncModel.msdevops_authtoken(clientid,function(err,result){
        if (err) resolve({});
        resolve(result);
    }));
    if(!Object.keys(credentialPromise).length) throw ({ type: "custom", message: `credentials not available`, status: 400 });;

    let authtoken = credentialPromise['tokendata']['access_token'];

    let msRepo = `select cmcr.*,cmcp.name AS project_name, cmco.name AS organization_name from c4_ms_client_repos AS cmcr LEFT JOIN c4_ms_client_projects AS cmcp ON cmcr.project_id = cmcp.project_id
    LEFT JOIN c4_ms_client_organizations AS cmco ON cmcr.organization_id = cmco.organization_id
    where cmcr.client_id = :client_id and cmcr.status = 1 and repo_id = :repo_id`
    let msRepoRes = await dbHandler.executeQueryv2(msRepo, { client_id: clientid, repo_id: id } );
    if(!msRepoRes.length) throw ({ type: "custom", message: `repo not found`, status: 404 });

    try{
        var msRepoDetails = await msExternalServices.deleteMSRepo(msRepoRes[0], authtoken);
    }
    catch(error){
        let errorMessage;
        if(error.response.data && typeof(error.response.data) == 'object' && 'message' in error.response.data)
            errorMessage = error.response.data.message
        else
            errorMessage = error.response.data
        throw ({ type: "custom", message: errorMessage, status: error.response.status });
    }

    let response = { output : msRepoDetails.data, count: 1 };
    return response;
}

async function getMSPipelineList(req) {
  
    let { set, limit } = req.query;
    let { clientid } = req;
    let offset = '';
    let clientInp = { client_id: clientid };
    let values = {...clientInp};

    let checkStatusQuery = `select * from c4_clients where is_msdevops_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `Azure is not enabled`, status: 400 });

    if(set && limit){
        offset = ` limit :offset, :limit`;
        values = { ...clientInp, offset: parseInt((set - 1) * limit), limit: parseInt(limit) }
    }

    let sql = `select cmcr.*,cmcp.name AS project_name, cmco.name AS organization_name from c4_ms_client_pipelines AS cmcr LEFT JOIN c4_ms_client_projects AS cmcp ON cmcr.project_id = cmcp.project_id
                LEFT JOIN c4_ms_client_organizations AS cmco ON cmcr.organization_id = cmco.organization_id
                where cmcr.client_id = :client_id and cmcr.status = 1  and cmcp.status = 1 and cmco.status = 1 ${offset}`
    let sql_count = `select count(*) AS count from c4_ms_client_pipelines AS cmcr LEFT JOIN c4_ms_client_projects AS cmcp ON cmcr.project_id = cmcp.project_id
                    LEFT JOIN c4_ms_client_organizations AS cmco ON cmcr.organization_id = cmco.organization_id
                    where cmcr.client_id = :client_id and cmcr.status = 1  and cmcp.status = 1 and cmco.status = 1`;

    let list = await dbHandler.executeQueryv2(sql, values );
    let count = await dbHandler.executeQueryv2(sql_count, clientInp );

    let response = { output : list, count: count.length ? count[0]['count'] : 0 };
    return response;
  
}

async function getMSPipelineDetails(req) {

    let { clientid } = req;
    let { id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_msdevops_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `Azure is not enabled`, status: 400 });

    let credentialPromise = await new Promise((resolve, reject) => msDevopsSyncModel.msdevops_authtoken(clientid,function(err,result){
        if (err) resolve({});
        resolve(result);
    }));
    if(!Object.keys(credentialPromise).length) throw ({ type: "custom", message: `credentials not available`, status: 400 });;

    let authtoken = credentialPromise['tokendata']['access_token'];

    let msRepo = `select cmcr.*,cmcp.name AS project_name, cmco.name AS organization_name from c4_ms_client_pipelines AS cmcr LEFT JOIN c4_ms_client_projects AS cmcp ON cmcr.project_id = cmcp.project_id
    LEFT JOIN c4_ms_client_organizations AS cmco ON cmcr.organization_id = cmco.organization_id
    where cmcr.client_id = :client_id and cmcr.status = 1 and pipeline_id = :pipeline_id`
    let msRepoRes = await dbHandler.executeQueryv2(msRepo, { client_id: clientid, pipeline_id: id } );
    if(!msRepoRes.length) throw ({ type: "custom", message: `pipeline not found`, status: 404 });

    let msRepoDetails = await msExternalServices.getMSPipelineDetails(msRepoRes[0], authtoken);

    let response = { output : msRepoDetails.data, count: 1 };
    return response;
}

async function getMSPipelineRuns(req) {

    let { clientid } = req;
    let { id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_msdevops_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `Azure is not enabled`, status: 400 });

    let credentialPromise = await new Promise((resolve, reject) => msDevopsSyncModel.msdevops_authtoken(clientid,function(err,result){
        if (err) resolve({});
        resolve(result);
    }));
    if(!Object.keys(credentialPromise).length) throw ({ type: "custom", message: `credentials not available`, status: 400 });;

    let authtoken = credentialPromise['tokendata']['access_token'];

    let msRepo = `select cmcr.*,cmcp.name AS project_name, cmco.name AS organization_name from c4_ms_client_pipelines AS cmcr LEFT JOIN c4_ms_client_projects AS cmcp ON cmcr.project_id = cmcp.project_id
    LEFT JOIN c4_ms_client_organizations AS cmco ON cmcr.organization_id = cmco.organization_id
    where cmcr.client_id = :client_id and cmcr.status = 1 and pipeline_id = :pipeline_id`
    let msRepoRes = await dbHandler.executeQueryv2(msRepo, { client_id: clientid, pipeline_id: id } );
    if(!msRepoRes.length) throw ({ type: "custom", message: `pipeline not found`, status: 404 });

    let msRepoDetails = await msExternalServices.getMSPipelineRuns(msRepoRes[0], authtoken);

    let response = { output : msRepoDetails.data, count: 1 };
    return response;
}

async function getMSPipelineRunDetails(req) {

    let { clientid } = req;
    let { id, run_id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_msdevops_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `Azure is not enabled`, status: 400 });

    let credentialPromise = await new Promise((resolve, reject) => msDevopsSyncModel.msdevops_authtoken(clientid,function(err,result){
        if (err) resolve({});
        resolve(result);
    }));
    if(!Object.keys(credentialPromise).length) throw ({ type: "custom", message: `credentials not available`, status: 400 });;

    let authtoken = credentialPromise['tokendata']['access_token'];

    let msRepo = `select cmcr.*,cmcp.name AS project_name, cmco.name AS organization_name from c4_ms_client_pipelines AS cmcr LEFT JOIN c4_ms_client_projects AS cmcp ON cmcr.project_id = cmcp.project_id
    LEFT JOIN c4_ms_client_organizations AS cmco ON cmcr.organization_id = cmco.organization_id
    where cmcr.client_id = :client_id and cmcr.status = 1 and pipeline_id = :pipeline_id`
    let msRepoRes = await dbHandler.executeQueryv2(msRepo, { client_id: clientid, pipeline_id: id } );
    if(!msRepoRes.length) throw ({ type: "custom", message: `pipeline not found`, status: 404 });

    let msRepoDetails = await msExternalServices.getMSPipelineRunDetails(msRepoRes[0], authtoken, run_id);

    let response = { output : msRepoDetails.data, count: 1 };
    return response;
}

async function startMSPipeline(req) {

    let { clientid } = req;
    let { id, run_id } = req.params;
    let startMSPipeline = {};

    let checkStatusQuery = `select * from c4_clients where is_msdevops_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `Azure is not enabled`, status: 400 });

    let credentialPromise = await new Promise((resolve, reject) => msDevopsSyncModel.msdevops_authtoken(clientid,function(err,result){
        if (err) resolve({});
        resolve(result);
    }));
    if(!Object.keys(credentialPromise).length) throw ({ type: "custom", message: `credentials not available`, status: 400 });;

    let authtoken = credentialPromise['tokendata']['access_token'];

    let msRepo = `select cmcr.*,cmcp.name AS project_name, cmco.name AS organization_name from c4_ms_client_pipelines AS cmcr LEFT JOIN c4_ms_client_projects AS cmcp ON cmcr.project_id = cmcp.project_id
    LEFT JOIN c4_ms_client_organizations AS cmco ON cmcr.organization_id = cmco.organization_id
    where cmcr.client_id = :client_id and cmcr.status = 1 and pipeline_id = :pipeline_id`
    let msRepoRes = await dbHandler.executeQueryv2(msRepo, { client_id: clientid, pipeline_id: id } );
    if(!msRepoRes.length) throw ({ type: "custom", message: `pipeline not found`, status: 404 });

    try{
        startMSPipeline = await msExternalServices.startMSPipeline(msRepoRes[0], authtoken);
    }
    catch(error){
        throw ({ type: "custom", message: 'The operation did not execute as expected. Please raise a ticket to support', status: error.response.status });
    }

    let response = { output : [], count: 1 };
    return response;
}

async function getMSOrganizationList(req) {
  
    let { set, limit } = req.query;
    let { clientid } = req;
    let offset = '';
    let clientInp = { client_id: clientid };
    let values = {...clientInp};

    let checkStatusQuery = `select * from c4_clients where is_msdevops_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `Azure is not enabled`, status: 400 });
    

    if(set && limit){
        offset = ` limit :offset, :limit`;
        values = { ...clientInp, offset: parseInt((set - 1) * limit), limit: parseInt(limit) }
    }

    let sql = `select * from c4_ms_client_organizations where client_id = :client_id and status = 1 order by name ${offset}`
    let sql_count = `select count(*) AS count from c4_ms_client_organizations where client_id = :client_id and status = 1`;

    let list = await dbHandler.executeQueryv2(sql, values );
    let count = await dbHandler.executeQueryv2(sql_count, clientInp );

    let response = { output : list, count: count.length ? count[0]['count'] : 0 };
    return response;
  
}

async function getMSProjectList(req) {
  
    let { set, limit } = req.query;
    let { clientid } = req;
    let { id } = req.params
    let offset = '';
    let clientInp = { client_id: clientid, organization_id: id };
    let values = {...clientInp};

    let checkStatusQuery = `select * from c4_clients where is_msdevops_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `Azure is not enabled`, status: 400 });
    

    if(set && limit){
        offset = ` limit :offset, :limit`;
        values = { ...clientInp, offset: parseInt((set - 1) * limit), limit: parseInt(limit) }
    }

    let sql = `select * from c4_ms_client_projects where client_id = :client_id and organization_id = :organization_id and status = 1  order by name ${offset}`
    let sql_count = `select count(*) AS count from c4_ms_client_projects where client_id = :client_id and organization_id = :organization_id and status = 1`;

    let list = await dbHandler.executeQueryv2(sql, values );
    let count = await dbHandler.executeQueryv2(sql_count, clientInp );

    let response = { output : list, count: count.length ? count[0]['count'] : 0 };
    return response;
  
}

module.exports = msDevopsModel;
