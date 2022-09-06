var monitoringModel = require("../models/monitoring-model.js");

var monitoringService = {
    getAllMonitoringServers,
    saveMonitoringServer,
    uptimeReport,
    addUptimeReport,
    usageReport,
    addUsageReport,
    utilizationReport,
    addUtilizationReport,
    usageMetrics,
    usageMetricFromApi,
    vmItemsSave,
    getHostItemsFromZabbix,
    get_advanced_services_graph,
    advanced_serverMonitoring,
    getAllMonitoringVms,
    getAllGroups,
    addGroup,
    editGroup,
    getAllAlerts,
    getUsageAlerts
}
function getAllMonitoringServers() {
    return new Promise((resolve,reject) => {
        monitoringModel.getAllMonitoringServers().then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function saveMonitoringServer(reqObj,callback) {
    return new Promise((resolve,reject) => {
        monitoringModel.saveMonitoringServer(reqObj,function(err,data){
            callback(null,data);
        })
        // monitoringModel.saveMonitoringServer(reqObj,callback).then((data)=>{
        //     resolve(data);
        // }).catch((err) => {
        //     reject(err);
        // })
    });
}
function getAllMonitoringVms(clientid) {
    return new Promise((resolve,reject) => {
        monitoringModel.getAllMonitoringVms(clientid).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getHostItemsFromZabbix(reqObj,callback) {
    return new Promise((resolve,reject) => {
        monitoringModel.getHostItemsFromZabbix(reqObj,function(err,data){
            callback(null,data);
        })
    });
}
function get_advanced_services_graph(reqObj,callback) {
    return new Promise((resolve,reject) => {
        monitoringModel.get_advanced_services_graph(reqObj,function(err,data){
            callback(null,data);
        })
    });
}
function advanced_serverMonitoring(reqObj,callback) {
    return new Promise((resolve,reject) => {
        monitoringModel.advanced_serverMonitoring(reqObj,function(err,data){
            callback(null,data);
        })
    });
}

function vmItemsSave(reqObj,callback) {
    return new Promise((resolve,reject) => {
        monitoringModel.vmItemsSave(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function usageMetrics(reqObj,callback) {
    return new Promise((resolve,reject) => {
        monitoringModel.usageMetrics(reqObj,function(err,data){
            callback(null,data);
        })
    });
}
function usageMetricFromApi(reqObj,callback) {
    return new Promise((resolve,reject) => {
        monitoringModel.usageMetricFromApi(reqObj,function(err,data){
            callback(null,data);
        })
    });
}
function getUsageAlerts(reqObj,callback) {
    return new Promise((resolve,reject) => {
        monitoringModel.getUsageAlerts(reqObj,function(err,data){
            callback(null,data);
        })
    });
}

function uptimeReport(reqObj,callback) {
    return new Promise((resolve,reject) => {
        monitoringModel.uptimeReport(reqObj,function(err,data){
            callback(null,data);
        })
    });
}
function addUptimeReport(reqObj) {
    return new Promise((resolve,reject) => {
        // monitoringModel.addUptimeReport(reqObj,function(err,data){
        //     resolve(data);
        // })
        monitoringModel.addUptimeReport(reqObj).then((data)=>{
            console.log("data");
            console.log(data);
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function usageReport(reqObj,callback) {
    return new Promise((resolve,reject) => {
        monitoringModel.usageReport(reqObj,function(err,data){
            callback(null,data);
        })
    });
}
function addUsageReport(reqObj) {
    return new Promise((resolve,reject) => {
        // monitoringModel.addUsageReport(reqObj,function(err,data){
        //     resolve(data);
        // })
        monitoringModel.addUsageReport(reqObj).then((data)=>{
            console.log("data");
            console.log(data);
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function utilizationReport(reqObj,callback) {
    return new Promise((resolve,reject) => {
        monitoringModel.utilizationReport(reqObj,function(err,data){
            callback(null,data);
        })
        // monitoringModel.utilizationReport(reqObj,callback).then((data)=>{
        //     resolve(data);
        // }).catch((err) => {
        //     reject(err);
        // })
    });
}
function addUtilizationReport(reqObj,callback) {
    return new Promise((resolve,reject) => {
        // monitoringModel.addUtilizationReport(reqObj,function(err,data){
        //     callback(null,data);
        // })
        monitoringModel.addUtilizationReport(reqObj).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getAllGroups() {
    return new Promise((resolve,reject) => {
        monitoringModel.getAllGroups().then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function addGroup(formdata) {
    return new Promise((resolve,reject) => {
        monitoringModel.addGroup(formdata).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function editGroup(formdata) {
    return new Promise((resolve,reject) => {
        monitoringModel.editGroup(formdata).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getAllAlerts() {
    return new Promise((resolve,reject) => {
        monitoringModel.getAllAlerts().then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}


module.exports = monitoringService;

