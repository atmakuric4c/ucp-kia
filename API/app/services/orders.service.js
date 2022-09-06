var ordersModel = require("../models/orders.model.js");


var ordersService = {
    getAllCloudNames: getAllCloudNames,
    getAllDCLocations : getAllDCLocations,
    getCopyTypes : getCopyTypes,
    getTxnDetails : getTxnDetails,
    getOsTemplates : getOsTemplates,
    getBillingPrice : getBillingPrice,
    saveOrderInfo : saveOrderInfo,
    saveOtherCloudOrderInfo : saveOtherCloudOrderInfo,
    ebsResponse : ebsResponse,
    saveTxnInfo : saveTxnInfo,
    payFromFunds : payFromFunds,
    getCartList : getCartList, 
    getApprovalPendingVmOpsList : getApprovalPendingVmOpsList,
    getJenkinsBuildInformation,
    getTxnSuccessData : getTxnSuccessData,
    updateCartItemCount : updateCartItemCount,
    deleteCartItem : deleteCartItem,
    getAddonPrice : getAddonPrice,
    updatePgiSelection
}

function getAllCloudNames() {
    return new Promise((resolve,reject) => {
        ordersModel.getAllCloudNames().then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getAddonPrice(reqObj,callback) {
    return new Promise((resolve,reject) => {
        ordersModel.getAddonPrice(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function updateCartItemCount(id,count) {
    return new Promise((resolve,reject) => {
        ordersModel.updateCartItemCount(id,count).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getCartList(userid) {
    return new Promise((resolve,reject) => {
        ordersModel.getCartList(userid).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getApprovalPendingVmOpsList(userid) {
    return new Promise((resolve,reject) => {
        ordersModel.getApprovalPendingVmOpsList(userid).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getJenkinsBuildInformation(reqBody) {
    return new Promise((resolve,reject) => {
        ordersModel.getJenkinsBuildInformation(reqBody).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getTxnSuccessData(txnId) {
    return new Promise((resolve,reject) => {
        ordersModel.getTxnSuccessData(txnId).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function deleteCartItem(id) {
    return new Promise((resolve,reject) => {
        ordersModel.deleteCartItem(id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getBillingPrice(reqObj,callback) {
    return new Promise((resolve,reject) => {
        ordersModel.getBillingPrice(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function saveOrderInfo(reqObj,callback) {
    return new Promise((resolve,reject) => {
        ordersModel.saveOrderInfo(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function updatePgiSelection(reqObj,callback) {
    return new Promise((resolve,reject) => {
        ordersModel.updatePgiSelection(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function saveOtherCloudOrderInfo(reqObj,callback) {
    return new Promise((resolve,reject) => {
        ordersModel.saveOtherCloudOrderInfo(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function ebsResponse(reqObj,callback) {
    return new Promise((resolve,reject) => {
        ordersModel.ebsResponse(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function saveTxnInfo(reqObj,callback) {
    return new Promise((resolve,reject) => {
        ordersModel.saveTxnInfo(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function payFromFunds(reqObj,callback) {
    return new Promise((resolve,reject) => {
        ordersModel.payFromFunds(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getAllDCLocations(cloudName) {
    return new Promise((resolve,reject) => {
        ordersModel.getAllDCLocations(cloudName).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getCopyTypes(vdc_tech_disk_id) {
    return new Promise((resolve,reject) => {
        ordersModel.getCopyTypes(vdc_tech_disk_id).then((data)=>{
            // console.log(data);
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getTxnDetails(txnId) {
    return new Promise((resolve,reject) => {
        ordersModel.getTxnDetails(txnId).then((data)=>{
            // console.log(data);
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getOsTemplates(vdc_tech_disk_id) {
    return new Promise((resolve,reject) => {
        ordersModel.getOsTemplates(vdc_tech_disk_id).then((data)=>{
            // console.log(data);
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}


module.exports = ordersService;

