const db = require("../../config/database");
const dbHandler = require('../../config/api_db_handler');
const gcpExternalServices = require('../external_services/gcp.service');
const gcpSyncModel = require('../../models/gcp_model');


const gcpDevopsModel = {
    getGCPProjectList: getGCPProjectList,
    getGCPTriggerList: getGCPTriggerList,
    getGCPTriggerDetails: getGCPTriggerDetails,
    getGCPBuildList: getGCPBuildList,
    getGCPBuildDetails: getGCPBuildDetails
}

async function getGCPProjectList(req) {
  
    let { set, limit } = req.query;
    let { clientid } = req;
    let offset = '';
    let clientInp = { client_id: clientid };
    let values = {...clientInp};
    
    let checkStatusQuery = `select * from c4_clients where is_gcp_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `GCP is not enabled`, status: 400 });

    if(set && limit){
        offset = ` limit :offset, :limit`;
        values = { ...clientInp, offset: parseInt((set - 1) * limit), limit: parseInt(limit) }
    }

    let sql = `select * from c4_gcp_projects where clientid = :client_id and record_status = 1 ${offset}`
    let sql_count = `select count(*) as count from c4_gcp_projects where clientid = :client_id and record_status = 1`;

    let list = await dbHandler.executeQueryv2(sql, values );
    let count = await dbHandler.executeQueryv2(sql_count, clientInp );

    let response = { output : list, count: count.length ? count[0]['count'] : 0 };
    return response;
  
}

async function getGCPTriggerList(req) {
  
    let { pageSize, pageToken } = req.query;
    let { clientid } = req;
    let { project_id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_gcp_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `GCP is not enabled`, status: 400 });

    let credentialPromise = await new Promise((resolve, reject) => gcpSyncModel.gcp_authtoken(clientid,function(err,result){
        if (err) resolve({});
        resolve(result);
    }));
    if(!Object.keys(credentialPromise).length) throw ({ type: "custom", message: `credentials not available`, status: 400 });;
    let authtoken = credentialPromise['tokendata']['access_token'];

    let gcpTriggerList = await gcpExternalServices.getGCPTriggerList({'project_id': project_id, 'pageSize': pageSize, 'pageToken': pageToken}, authtoken);
    let output = gcpTriggerList.data.triggers ? gcpTriggerList.data : { triggers: [] }

    let response = { output :output , count: 0 };
    return response;
  
}

async function getGCPTriggerDetails(req) {

    let { clientid } = req;
    let { project_id, trigger_id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_gcp_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `GCP is not enabled`, status: 400 });

    let credentialPromise = await new Promise((resolve, reject) => gcpSyncModel.gcp_authtoken(clientid,function(err,result){
        if (err) resolve({});
        resolve(result);
    }));
    if(!Object.keys(credentialPromise).length) throw ({ type: "custom", message: `credentials not available`, status: 400 });;
    let authtoken = credentialPromise['tokendata']['access_token'];

    let gcpTriggerDetails = await gcpExternalServices.getGCPTriggerDetails({'project_id': project_id, 'trigger_id': trigger_id }, authtoken);

    let response = { output : gcpTriggerDetails.data, count: 1 };
    return response;
}


async function getGCPBuildList(req) {
  
    let { pageSize, pageToken } = req.query;
    let { clientid } = req;
    let { project_id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_gcp_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `GCP is not enabled`, status: 400 });

    let credentialPromise = await new Promise((resolve, reject) => gcpSyncModel.gcp_authtoken(clientid,function(err,result){
        if (err) resolve({});
        resolve(result);
    }));
    if(!Object.keys(credentialPromise).length) throw ({ type: "custom", message: `credentials not available`, status: 400 });;
    let authtoken = credentialPromise['tokendata']['access_token'];

    let gcpBuildList = await gcpExternalServices.getGCPBuildList({'project_id': project_id, 'pageSize': pageSize, 'pageToken': pageToken}, authtoken);
    let output = gcpBuildList.data.builds ? gcpBuildList.data : { builds: [] }

    let response = { output: output, count: 0 };
    return response;
  
}

async function getGCPBuildDetails(req) {

    let { clientid } = req;
    let { project_id, build_id } = req.params;

    let checkStatusQuery = `select * from c4_clients where is_gcp_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `GCP is not enabled`, status: 400 });

    let credentialPromise = await new Promise((resolve, reject) => gcpSyncModel.gcp_authtoken(clientid,function(err,result){
        if (err) resolve({});
        resolve(result);
    }));
    if(!Object.keys(credentialPromise).length) throw ({ type: "custom", message: `credentials not available`, status: 400 });;
    let authtoken = credentialPromise['tokendata']['access_token'];

    let gcpBuildDetails = await gcpExternalServices.getGCPBuildDetails({'project_id': project_id, 'build_id': build_id }, authtoken);

    let response = { output : gcpBuildDetails.data, count: 1 };
    return response;
}

module.exports = gcpDevopsModel;