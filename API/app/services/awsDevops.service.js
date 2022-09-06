const awsDevopsModel = require('../models/awsDevops.model');
const awsDevopsSyncModel = require('../../models/aws_devops_model');
const awsDevopsValidations = require('../validations/awsDevops.validator');

let awsDevopsService = {
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
    let { output, count } = await awsDevopsModel.getAWSRepoList(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getAWSRepoDetails(req) {
    let { output, count } = await awsDevopsModel.getAWSRepoDetails(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getAWSRepoFiles(req) {
    let { output, count } = await awsDevopsModel.getAWSRepoFiles(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getAWSRepoFileContent(req) {
    let { output, count } = await awsDevopsModel.getAWSRepoFileContent(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getAWSRepoBranches(req) {
    let { output, count } = await awsDevopsModel.getAWSRepoBranches(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function addAWSRepo(req) {
    const error = awsDevopsValidations.validateAWSRepo(req.body);
    if (error) throw ({ type: "custom", message: error, status: 400 });

    let { output, count } = await awsDevopsModel.addAWSRepo(req);
    await awsDevopsSyncModel.syncClientAWSRepos(req.clientid);
    return { message:'success', data : output, count: count, status: 200 };
}

async function deleteAWSRepo(req) {
    let { output, count } = await awsDevopsModel.deleteAWSRepo(req);
    await awsDevopsSyncModel.syncClientAWSRepos(req.clientid);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getAWSPipelineList(req) {
    let { output, count } = await awsDevopsModel.getAWSPipelineList(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getAWSPipelineDetails(req) {
    let { output, count } = await awsDevopsModel.getAWSPipelineDetails(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getAWSPipelineStatus(req) {
    let { output, count } = await awsDevopsModel.getAWSPipelineStatus(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getAWSPipelineExecutionHistory(req) {
    let { output, count } = await awsDevopsModel.getAWSPipelineExecutionHistory(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function startAWSPipeline(req) {
    let { output, count } = await awsDevopsModel.startAWSPipeline(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function stopAWSPipeline(req) {
    let { output, count } = await awsDevopsModel.stopAWSPipeline(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function deleteAWSPipeline(req) {
    let { output, count } = await awsDevopsModel.deleteAWSPipeline(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getAWSRegionList(req) {
    let { output, count } = await awsDevopsModel.getAWSRegionList(req);
    return { message:'success', data : output, count: count, status: 200 };
}

module.exports = awsDevopsService;