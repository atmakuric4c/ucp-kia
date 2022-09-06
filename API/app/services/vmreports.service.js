var vmreportModel = require("../models/vmreports.model.js");

var vmreportService = {
    getHourlyReport,getHourlyHistoryReport,generateVMReport,generateVmHourlyReport
}
function generateVMReport() {
    return new Promise((resolve,reject) => {
        vmreportModel.generateVMReport().then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getHourlyReport() {
    return new Promise((resolve,reject) => {
        vmreportModel.getHourlyReport().then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getHourlyHistoryReport(reqObj) {
    return new Promise((resolve,reject) => {
        vmreportModel.getHourlyHistoryReport(reqObj).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function generateVmHourlyReport(reqObj) {
    return new Promise((resolve,reject) => {
        vmreportModel.generateVmHourlyReport(reqObj).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

module.exports = vmreportService;

