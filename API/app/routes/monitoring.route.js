const monitoringService = require('../services/monitoring.service');
var schema = require('../schema/userValidationSchema.json')
var iValidator = require('../../common/iValidator');
var errorCode = require('../../common/error-code');
var errorMessage = require('../../common/error-methods');
var mail = require('./../../common/mailer.js');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');
var base64 = require('base-64');

function init(router) {
    router.route('/monitoring/metrics').get(getAllGroups)
    router.route('/monitoring/addgroup').post(addGroup)
    router.route('/monitoring/editgroup').post(editGroup)
    router.route('/monitoring/getAllMonitoringVms').post(getAllMonitoringVms)
    router.route('/monitoring/getHostItemsFromZabbix/:id').get(getHostItemsFromZabbix)
    router.route('/monitoring/get_advanced_services_graph').post(get_advanced_services_graph)
    router.route('/monitoring/advanced_serverMonitoring').post(advanced_serverMonitoring)
    router.route('/monitoring/vmItemsSave').post(vmItemsSave)
    router.route('/monitoring/usageMetrics/:id').get(usageMetrics)
    router.route('/monitoring/usageMetricFromApi').post(usageMetricFromApi)
    router.route('/monitoring/getUsageAlerts').post(getUsageAlerts)
    router.route('/monitoring/uptimeReport').post(uptimeReport)
    router.route('/monitoring/addUptimeReport').post(addUptimeReport)
    router.route('/monitoring/usageReport/:id').get(usageReport)
    router.route('/monitoring/addUsageReport').post(addUsageReport)
    router.route('/monitoring/utilizationReport').post(utilizationReport)
    router.route('/monitoring/addUtilizationReport').post(addUtilizationReport)
    router.route('/monitoring/alerts').get(getAllAlerts)
    router.route('/monitoring/getAllMonitoringServers').get(getAllMonitoringServers);
    router.route('/monitoring/saveMonitoringServer').post(saveMonitoringServer)
}
function getAllMonitoringServers(req,res) {
  monitoringService.getAllMonitoringServers().then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}
function saveMonitoringServer(req,res){
  monitoringService.saveMonitoringServer(req,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function getAllMonitoringVms(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body)); 
  var clientid=reqBody.clientid;
  monitoringService.getAllMonitoringVms(clientid).then((data) => {
      res.send(ucpEncryptDecrypt.ucpEncrypt(data));
    }).catch((err) => {
      res.send(ucpEncryptDecrypt.ucpEncrypt(data));
    });
}
function getHostItemsFromZabbix(req,res) {
  monitoringService.getHostItemsFromZabbix(req.params,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function get_advanced_services_graph(req,res) {
  monitoringService.get_advanced_services_graph(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function advanced_serverMonitoring(req,res) {
  monitoringService.advanced_serverMonitoring(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function vmItemsSave(req,res){
  monitoringService.vmItemsSave(req.body).then((data) => {
    res.send(data);
  }).catch((err) => {
    res.send(err);
  });
}
function usageMetrics(req,res){
  monitoringService.usageMetrics(req.params,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function usageMetricFromApi(req,res){
  monitoringService.usageMetricFromApi(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function getUsageAlerts(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body)); 
  monitoringService.getUsageAlerts(reqBody,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}

function uptimeReport(req,res){
  monitoringService.uptimeReport(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function addUptimeReport(req,res){
  // console.log(req.body);
  monitoringService.addUptimeReport(req.body).then((data) => {
    //console.log("route === "+JSON.stringify(data));
    res.send(data);
  }).catch((err) => {
    res.send(err);
  });
}
function usageReport(req,res){
  monitoringService.usageReport(req.params,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function addUsageReport(req,res){
  // console.log(req.body);
  monitoringService.addUsageReport(req.body).then((data) => {
    //console.log("route === "+JSON.stringify(data));
    res.send(data);
  }).catch((err) => {
    res.send(err);
  });
}
function utilizationReport(req,res){
  monitoringService.utilizationReport(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function addUtilizationReport(req,res){
  monitoringService.addUtilizationReport(req.body).then((data) => {
    res.send(data);
  }).catch((err) => {
    res.send(err);
  });
}

function getAllGroups(req,res) {
  monitoringService.getAllGroups().then((data) => {
      res.send(data);
    }).catch((err) => {
      res.send(err);
    });
}
function addGroup(req,res){
  monitoringService.addGroup(req.body).then((data) => {
    res.send(data);
  }).catch((err) => {
    res.send(err);
  });
}
function editGroup(req,res){
  monitoringService.editGroup(req.body).then((data) => {
    res.send(data);
  }).catch((err) => {
    res.send(err);
  });
}
function getAllAlerts(req,res) {
  monitoringService.getAllAlerts().then((data) => {
      res.send(data);
    }).catch((err) => {
      res.send(err);
    });
}
module.exports.init = init;
