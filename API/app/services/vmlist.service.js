var vmlistModel = require("../models/vmlist.model.js");

var vmlistService = {
    getAllVmlist,
    getAllPhysicalVmlist,
    getPhysicalVmDetails,
    getVmNotScheduleList,
    getScheduleList,
    getVmLogsbyId,
    getVmDetailbyId,
    getVmDiskInfobyId,
    addVm,vmResize,
    updateVmCreateDate,
    getAllVmGrouplist,
    addScheduler,
    veeamOperations,
    vmLogs,
    vmOpeations,
    jobStatus
}
function jobStatus(reqBody) {
    return new Promise((resolve,reject) => {
        vmlistModel.jobStatus(reqBody,function(data){
            resolve(data);
        })
    });
}
function vmLogs(clientid,vmid) {
    return new Promise((resolve,reject) => {
        vmlistModel.vmLogs(clientid,vmid).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getAllVmlist(vdc_id) {
    return new Promise((resolve,reject) => {
        vmlistModel.getAllVmlist(vdc_id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getAllPhysicalVmlist(reqObj,callback) {
    return new Promise((resolve,reject) => {
    	vmlistModel.getAllPhysicalVmlist(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getPhysicalVmDetails(vm_id) {
    return new Promise((resolve,reject) => {
        vmlistModel.getPhysicalVmDetails(vm_id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getScheduleList(vdc_id) {
    return new Promise((resolve,reject) => {
        vmlistModel.getScheduleList(vdc_id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getVmNotScheduleList(vdc_id) {
    return new Promise((resolve,reject) => {
        vmlistModel.getVmNotScheduleList(vdc_id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getAllVmGrouplist() {
    return new Promise((resolve,reject) => {
        vmlistModel.getAllVmGrouplist().then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function addVm(reqObj,callback) {
    return new Promise((resolve,reject) => {
        vmlistModel.addVm(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function vmResize(reqObj,callback) {
    return new Promise((resolve,reject) => {
        vmlistModel.vmResize(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function addScheduler(reqObj,callback) {
    vmlistModel.addScheduler(reqObj,function(err,result){
        if (err) {
            callback(400,result)
        } else {
            callback(null,result)
        }
    })
}

function updateVmCreateDate(reqObj,callback) {
    return new Promise((resolve,reject) => {
        vmlistModel.updateVmCreateDate(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getVmLogsbyId(id) {
    return new Promise((resolve,reject) => {
        vmlistModel.getVmLogsbyId(id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getVmDetailbyId(clientid,vm_id) {
    return new Promise((resolve,reject) => {
        vmlistModel.getVmDetailbyId(clientid,vm_id,function(data){
            resolve(data);
        })
    });
}

function getVmDiskInfobyId(id) {
    return new Promise((resolve,reject) => {
        vmlistModel.getVmDiskInfobyId(id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function vmOpeations(reqObj,callback) {
    vmlistModel.vmOpeations(reqObj,function(err,data){
        if(err)
        callback(null,'The operation did not execute as expected. Please raise a ticket to support');
        else callback(null,data);
    })
}
function veeamOperations(reqObj,callback) {
    vmlistModel.veeamOperations(reqObj,function(err,data){
        if(err)
        callback(null,'The operation did not execute as expected. Please raise a ticket to support');
        else callback(null,data);
    })
}

module.exports = vmlistService;

