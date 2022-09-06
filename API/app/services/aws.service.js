var awsModel = require("../models/aws.model.js");
var aws_Model = require("../../models/aws_model");
var mailer = require("../../common/mailer");

var awsService = {
    getAllVmlist,
    getDiskList,
    addDisk,
    attachDisk,
    detachDisk,
    getVMDetails,
    getVMDetailByName,
    getVmDetailbyId,
    addVm,vmResize,
    vmOperations,
    vmLogs,
    getAllNetwork,
    addAwsNetwork,
    getAllRegions,
    getAllRigionBasedZones,
    validateVmName,
    addAwsDetailsToClient,
    getAWSBillingReport,
    getAWSCostForecast,
    getAWSUsageForecast
}
function getAllRegions(clientid) {
    return new Promise((resolve,reject) => {
        awsModel.getAllRegions(clientid).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getAllRigionBasedZones(clientid,regionName) {
    return new Promise((resolve,reject) => {
        awsModel.getAllRigionBasedZones(clientid,regionName).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getDiskList(req,callback) {
    return new Promise((resolve,reject) => {
        awsModel.getDiskList(req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function addDisk(req,callback) {
    return new Promise((resolve,reject) => {
        awsModel.addDisk(req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function validateVmName(req,callback) {
    return new Promise((resolve,reject) => {
        awsModel.validateVmName(req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function attachDisk(req,callback) {
    return new Promise((resolve,reject) => {
        awsModel.attachDisk(req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function detachDisk(req,callback) {
    return new Promise((resolve,reject) => {
        awsModel.detachDisk(req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getVMDetails(encId,callback) {
    return new Promise((resolve,reject) => {
        awsModel.getVMDetails(encId,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getVMDetailByName(reqObj,callback) {
    return new Promise((resolve,reject) => {
        awsModel.getVMDetailByName(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getAllVmlist(vdc_id) {
    return new Promise((resolve,reject) => {
        awsModel.getAllVmlist(vdc_id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getAllNetwork(vdc_id) {
    return new Promise((resolve,reject) => {
        awsModel.getAllNetwork(vdc_id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function addAwsNetwork(reqObj,callback) {
    return new Promise((resolve,reject) => {
        awsModel.addAwsNetwork(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function addVm(reqObj,callback) {
    return new Promise((resolve,reject) => {
        awsModel.addVm(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getVmDetailbyId(clientid,vm_id,callback) {
    aws_Model.getVmDetailbyId(clientid,vm_id,function(err,result){
        return callback(null,result);
    })
}
function vmLogs(clientid,vmid) {
    return new Promise((resolve,reject) => {
        awsModel.vmLogs(clientid,vmid).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function vmOperations(reqObj,callback) {
    awsModel.vmOperations(reqObj,function(err,result){
        return callback(null,result);
    })
}
function vmResize(reqObj,callback) {
    awsModel.vmResize(reqObj,function(err,result){
        return callback(null,result);
    })
}
function addAwsDetailsToClient(reqObj,req,callback) {
    return new Promise((resolve,reject) => {
    	awsModel.addAwsDetailsToClient(reqObj,req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

async function getAWSBillingReport(req) {
    return await awsModel.getAWSBillingReport(req);
}

async function getAWSCostForecast(req) {
    let { output, count } = await awsModel.getAWSCostForecast(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getAWSUsageForecast(req) {
    let { output, count } = await awsModel.getAWSUsageForecast(req);
    return { message:'success', data : output, count: count, status: 200 };
}

module.exports = awsService;

