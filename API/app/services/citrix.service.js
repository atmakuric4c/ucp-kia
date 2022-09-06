var vmlistModel = require("../models/citrix.model.js");

var vmlistService = {
    getAllVmlist,
    getVmDetailbyId,
    addVm,vmResize,
    vmOperations,
    vmLogs,
    veeamOperations
    
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

function addVm(reqObj,callback) {
    return new Promise((resolve,reject) => {
        vmlistModel.addVm(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getVmDetailbyId(clientid,vm_id) {
    return new Promise((resolve,reject) => {
        vmlistModel.getVmDetailbyId(clientid,vm_id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
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

function veeamOperations(reqObj,callback) {
    vmlistModel.veeamOperations(reqObj,function(err,result){
        callback(null,result);
    })
}
function vmOperations(reqObj,callback) {
    vmlistModel.vmOperations(reqObj,function(err,result){
        callback(null,result);
    })
}
function vmResize(reqObj,callback) {
    vmlistModel.vmResize(reqObj,function(err,result){
        callback(null,result);
    })
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

function getVmDiskInfobyId(id) {
    return new Promise((resolve,reject) => {
        vmlistModel.getVmDiskInfobyId(id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function addVmGroup(reqObj,callback) {
    return new Promise((resolve,reject) => {
        vmlistModel.addVmGroup(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function editVmGroup(reqObj,callback) {
    return new Promise((resolve,reject) => {
        vmlistModel.editVmGroup(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function editVmGroupMapping(reqObj,callback) {
    return new Promise((resolve,reject) => {
        vmlistModel.editVmGroupMapping(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

module.exports = vmlistService;

