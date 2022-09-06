const gcpDevopsModel = require('../models/gcpDevops.model');
//const awsDevopsValidations = require('../validations/securityQuestions.validator');

let gcpDevopsService = {
    getGCPProjectList: getGCPProjectList,
    getGCPTriggerList: getGCPTriggerList,
    getGCPTriggerDetails: getGCPTriggerDetails,
    getGCPBuildList: getGCPBuildList,
    getGCPBuildDetails: getGCPBuildDetails,
}

async function getGCPProjectList(req) {
    let { output, count } = await gcpDevopsModel.getGCPProjectList(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getGCPTriggerList(req) {
    let { output, count } = await gcpDevopsModel.getGCPTriggerList(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getGCPTriggerDetails(req) {
    let { output, count } = await gcpDevopsModel.getGCPTriggerDetails(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getGCPBuildList(req) {
    let { output, count } = await gcpDevopsModel.getGCPBuildList(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getGCPBuildDetails(req) {
    let { output, count } = await gcpDevopsModel.getGCPBuildDetails(req);
    return { message:'success', data : output, count: count, status: 200 };
}

module.exports = gcpDevopsService;