var billingModel = require("../models/billing.model.js");


var billingService = {
    getOrderList : getOrderList,
    getInvoiceList : getInvoiceList,
    getTransactionsList : getTransactionsList,
    getPaymentsList : getPaymentsList,
    payInvoice:payInvoice,
    getOrderDetails: getOrderDetails,
    viewHourlyReport: viewHourlyReport,
    downloadHourlyReport : downloadHourlyReport
}

function getOrderList(reqObj,callback) {
    return new Promise((resolve,reject) => {
        billingModel.getOrderList(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getTransactionsList(reqObj,callback) {
    return new Promise((resolve,reject) => {
        billingModel.getTransactionsList(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getPaymentsList(reqObj,callback) {
    return new Promise((resolve,reject) => {
        billingModel.getPaymentsList(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getInvoiceList(reqObj,callback) {
    return new Promise((resolve,reject) => {
        billingModel.getInvoiceList(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function payInvoice(reqObj,callback) {
    return new Promise((resolve,reject) => {
        billingModel.payInvoice(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getOrderDetails(reqObj,callback) {
    return new Promise((resolve,reject) => {
        billingModel.getOrderDetails(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function viewHourlyReport(reqObj,callback) {
    return new Promise((resolve,reject) => {
        billingModel.viewHourlyReport(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function downloadHourlyReport(reqObj,callback) {
    return new Promise((resolve,reject) => {
        billingModel.downloadHourlyReport(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

module.exports = billingService;

