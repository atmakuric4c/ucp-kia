const msDevopsModel = require('../models/msDevops.model');
const msDevopsSyncModel = require('../../models/msdevops_model');
const msDevopsValidations = require('../validations/msDevops.validator');

let msDevopsService = {
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
    let { output, count } = await msDevopsModel.getMSRepoList(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getMSRepoDetails(req) {
    let { output, count } = await msDevopsModel.getMSRepoDetails(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getMSRepoFiles(req) {
    let { output, count } = await msDevopsModel.getMSRepoFiles(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function addMSRepo(req) {
    const error = msDevopsValidations.validateMSRepo(req.body);
    if (error) throw ({ type: "custom", message: error, status: 400 });

    let { output, count } = await msDevopsModel.addMSRepo(req);
    await msDevopsSyncModel.syncClientMSProjects(req.clientid);
    await msDevopsSyncModel.syncClientMSRepos(req.clientid);
    return { message:'success', data : output, count: count, status: 200 };
}

async function deleteMSRepo(req) {
    let { output, count } = await msDevopsModel.deleteMSRepo(req);
    await msDevopsSyncModel.syncClientMSProjects(req.clientid);
    await msDevopsSyncModel.syncClientMSRepos(req.clientid);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getMSPipelineList(req) {
    let { output, count } = await msDevopsModel.getMSPipelineList(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getMSPipelineDetails(req) {
    let { output, count } = await msDevopsModel.getMSPipelineDetails(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getMSPipelineRuns(req) {
    let { output, count } = await msDevopsModel.getMSPipelineRuns(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getMSPipelineRunDetails(req) {
    let { output, count } = await msDevopsModel.getMSPipelineRunDetails(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function startMSPipeline(req) {
    let { output, count } = await msDevopsModel.startMSPipeline(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getMSOrganizationList(req) {
    let { output, count } = await msDevopsModel.getMSOrganizationList(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getMSProjectList(req) {
    let { output, count } = await msDevopsModel.getMSProjectList(req);
    return { message:'success', data : output, count: count, status: 200 };
}

module.exports = msDevopsService;