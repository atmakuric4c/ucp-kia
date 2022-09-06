var schema = require("../schema/userValidationSchema.json");
var iValidator = require("../../common/iValidator");
var errorCode = require("../../common/error-code");
var errorMessage = require("../../common/error-methods");
var mail = require("./../../common/mailer.js");
const commonService = require("../services/common.service");
const commonModel = require("../models/common.model");
const supportService = require("../services/support.service");
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');
const {  errorResponse } = require('../../common/error-response');

function init(router) {
  router.route("/getAllVdcLocations").get(getAllVdcLocations);
  router.route("/getDashboardCounts").post(getDashboardCounts);
  router.route("/getAllMenus").get(getAllMenus);
  router.route("/getAllHostDetails").get(getAllHostDetails);
  router.route("/getHostDetail/:id").get(getHostDetail);
  router.route("/datastoreUnderHost/:id").get(datastoreUnderHost);
  router.route("/hostUnderDatastore/:id").get(hostUnderDatastore);
  router.route("/setEnableDisable").post(setEnableDisable);
  router.route("/getDashboard").get(getDashboard);
  router.route("/getUserMenus").get(getUserMenus);
  router.route("/getVmListArr").post(getVmListArr);
  router.route("/getAzureSubscriptions").post(getAzureSubscriptions);
  router.route("/getAzureSubscriptionLocations").post(getAzureSubscriptionLocations);
  router.route("/getRamList").get(getRamList);
  router.route("/getCpuList").get(getCpuList);
  router.route("/getDiskList").get(getDiskList);
  router.route("/getClientDocuments").post(getClientDocuments);

  router.route("/budgetAlertList/:cloudName").get(getBudgetAlertList);
  router.route("/budgetAlertList/:cloudName").put(updateBudgetAlertList);
  
  router.route("/getOptionConfigJsonData").post(getOptionConfigJsonData);
  router.route("/getfaqs").get(getFaqList);
  router.route("/searchfaqs").get(getFaqSearchList);

}
function getOptionConfigJsonData(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  commonModel.getOptionConfigJsonData(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function getRamList(req,res) {
  let option_type = 'RAM_SIZE'; 
  commonService.getOptionConfigData(option_type).then((data) => {
    res.send(ucpEncryptDecrypt.ucpEncrypt(data));
  }).catch((err) => {      
    res.send(ucpEncryptDecrypt.ucpEncrypt(err));
  });
}
function getCpuList(req,res) {
  let option_type = 'CPU_NUMBER'; 
  commonService.getOptionConfigData(option_type).then((data) => {
    res.send(ucpEncryptDecrypt.ucpEncrypt(data));
  }).catch((err) => {      
    res.send(ucpEncryptDecrypt.ucpEncrypt(err));
  });
}
function getDiskList(req,res) {
  let option_type = 'DISK_SIZE'; 
  commonService.getOptionConfigData(option_type).then((data) => {
    res.send(ucpEncryptDecrypt.ucpEncrypt(data));
  }).catch((err) => {      
    res.send(ucpEncryptDecrypt.ucpEncrypt(err));
  });
}
function getHostDetail(req,res) {
  let id = req.params.id; 
  commonService.getHostDetail(id).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}
function datastoreUnderHost(req,res) {
  let id = req.params.id; 
  commonService.datastoreUnderHost(id).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}
function hostUnderDatastore(req,res) {
  let id = req.params.id; 
  commonService.hostUnderDatastore(id).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}

function getAllVdcLocations(req, res) {
  commonService
    .getAllVdcLocations()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      mail.mail(err);
      res.send(err);
    });
}

function getDashboardCounts(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  Object.assign(reqBody, {
    subscriptions: req.subscriptions,
    resource_groups: req.resource_groups
  });
  commonService
    .getDashboardCounts(reqBody) //req.body
    .then(data => {
//      res.send(data);
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(data, req.query))
    })
    .catch(err => {
//      mail.mail(err);
//      res.send(err);
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(err, req.query))
    });
}

function getAllMenus(req, res) {
  commonService
    .getAllMenus()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      mail.mail(err);
      res.send(err);
    });
}

function getAllHostDetails(req, res) {
  commonService
    .getAllHostDetails()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      mail.mail(err);
      res.send(err);
    });
}
function setEnableDisable(req, res) {
  //console.log(JSON.stringify(req.body));
  var action = req.body.action;
  var id = req.body.id;
  var value = req.body.value;
  commonService
    .setEnableDisable(action, id, value)
    .then(data => {
      res.json(data);
    })
    .catch(err => {
      res.json(err);
    });
}
function getVmListArr(req, res) {
  commonService.getVmListArr(req.body).then(data => {
    res.send(data);
  });
}

function getAzureSubscriptions(req, res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  Object.assign(reqBody, {
    subscriptions: req.subscriptions,
    resource_groups: req.resource_groups
    });
  commonService.getAzureSubscriptions(reqBody).then(data => {
    res.send(ucpEncryptDecrypt.ucpEncrypt(data));
  });
}

function getClientDocuments(req, res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  commonService.getClientDocuments(reqBody,function(err,result){
    if (err) {
        res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
        res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}

function getAzureSubscriptionLocations(req, res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  commonService.getAzureSubscriptionLocations(reqBody).then(data => {
    res.send(ucpEncryptDecrypt.ucpEncrypt(data));
  });
}

function getDashboard(req, res) {
  commonService.getDashboard().then(data => {
    res.send({
      vcenters: data.vcenters,
      ipcount: data.ipcount,
      privateips: data.privateips,
      vmcount: data.vmcount,
      nwcount: data.nwcount,
      datastorecount: data.datastores,
      esxicount: data.esxicount
    });
  });
}

function getUserMenus(req, res) {
  var token = req.headers["authorization"];
  if (token) {
    token = token.slice(7, token.length);
    supportService.getUserInfobyToken(token).then(userinfo => {
      if (userinfo && userinfo.id && userinfo.id > 0) {
        commonService.getUserMenus(userinfo.id).then(data => {
          res.send(data);
        });
      }
    });
  }
}

async function getBudgetAlertList(req,res) {
  try{
  
    let result = await commonService.getBudgetAlertList(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function updateBudgetAlertList(req,res) {
  try{
  
    let result = await commonService.updateBudgetAlertList(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

const getFaqSearchList = async (req, res) => {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));

  commonService.getFaqSearchList(reqBody, function(err,result){
    if (err) {
        res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
        res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}

const getFaqList = async (req, res) => {
  commonService.getFaqList(req.body,function(err,result){
    if (err) {
        res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
        res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}

module.exports.init = init;
