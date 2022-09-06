var gcpModel = require("../models/gcp.model.js");
const moment = require('moment');

var gcpService = {
	getGcpProjectDetails,
	getGcpImagesList,
	getVMDetails,
	getGcpZonesList,
    getGcpRegionsList,
    getGcpMachineTypesList,
    getAllVmlist,
    vmOperations,
    vmLogs,
    validateVmName,
    getGCPBillingReport
}
function validateVmName(req,callback) {
    return new Promise((resolve,reject) => {
        gcpModel.validateVmName(req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function vmLogs(clientid,vmid) {
    return new Promise((resolve,reject) => {
        gcpModel.vmLogs(clientid,vmid).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function vmOperations(reqObj,callback) {
    gcpModel.vmOperations(reqObj,function(err,result){
        return callback(null,result);
    })
}
function getAllVmlist(req,callback) {
    return new Promise((resolve,reject) => {
    	gcpModel.getAllVmlist(req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getGcpMachineTypesList(req,callback) {
    return new Promise((resolve,reject) => {
    	gcpModel.getGcpMachineTypesList(req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getGcpProjectDetails(req,callback) {
    return new Promise((resolve,reject) => {
    	gcpModel.getGcpProjectDetails(req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getVMDetails(encId,callback) {
    return new Promise((resolve,reject) => {
    	gcpModel.getVMDetails(encId,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getGcpImagesList(req,callback) {
    return new Promise((resolve,reject) => {
    	gcpModel.getGcpImagesList(req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getGcpZonesList(req,callback) {
    return new Promise((resolve,reject) => {
    	gcpModel.getGcpZonesList(req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getGcpRegionsList(req,callback) {
    return new Promise((resolve,reject) => {
    	gcpModel.getGcpRegionsList(req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

async function getGCPBillingReport(req) {

    let { start_date, end_date } = req.query;
    if (moment(end_date) < moment(start_date)) throw ({ type: "custom", message: 'End date cannot be less than start date', status: 400 });

    let response = await gcpModel.getGCPBillingReport(req);
    return response;
}

module.exports = gcpService;

