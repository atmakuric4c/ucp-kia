var commonModel = require("../models/common.model");
const billingValidations = require('../validations/billing.validator');

var commonService = {
  getAllVdcLocations: getAllVdcLocations,
  getDashboardCounts : getDashboardCounts,
  getAllDataStores: getAllDataStores,
  getAllMenus: getAllMenus,
  getAllHostDetails: getAllHostDetails,
  setEnableDisable: setEnableDisable,
  getDashboard: getDashboard,
  getUserMenus: getUserMenus,
  getSubmenus: getSubmenus,
  getVmListArr:getVmListArr,
  getAzureSubscriptions:getAzureSubscriptions,
  getAzureSubscriptionLocations:getAzureSubscriptionLocations,
  getDatastoreDetail:getDatastoreDetail,
  getHostDetail:getHostDetail,
  datastoreUnderHost:datastoreUnderHost,
  getOptionConfigData:getOptionConfigData,
  getClientDocuments,
  getBudgetAlertList: getBudgetAlertList,
  updateBudgetAlertList: updateBudgetAlertList,
  getFaqSearchList, getFaqList
};
function getOptionConfigData(option_type) {
  return new Promise((resolve, reject) => {
    commonModel
      .getOptionConfigData(option_type)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function getAzureSubscriptions(obj) {
  console.log('Object Data',obj);
  return new Promise((resolve, reject) => {
    commonModel
      .getAzureSubscriptions(obj)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function getClientDocuments(reqBody, callback) {
    return new Promise((resolve,reject) => {
    	commonModel.getClientDocuments(reqBody,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getAzureSubscriptionLocations(obj) {
  return new Promise((resolve, reject) => {
    commonModel
      .getAzureSubscriptionLocations(obj)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function getVmListArr(obj) {
  return new Promise((resolve, reject) => {
    commonModel
      .getVmListArr(obj)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function getDatastoreDetail(dsid) {
  return new Promise((resolve, reject) => {
    commonModel
      .getDatastoreDetail(dsid)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function getHostDetail(id) {
  return new Promise((resolve, reject) => {
    commonModel
      .getHostDetail(id)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function datastoreUnderHost(id) {
  return new Promise((resolve, reject) => {
    commonModel
      .datastoreUnderHost(id)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function hostUnderDatastore(id) {
  return new Promise((resolve, reject) => {
    commonModel
      .hostUnderDatastore(id)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function getAllVdcLocations() {
  return new Promise((resolve, reject) => {
    commonModel
      .getAllVdcLocations()
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function getDashboardCounts(reqBody) {
  return new Promise((resolve, reject) => {
    commonModel
      .getDashboardCounts(reqBody)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function getAllDataStores() {
  return new Promise((resolve, reject) => {
    commonModel
      .getAllDataStores()
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function getAllMenus() {
  return new Promise((resolve, reject) => {
    commonModel
      .getAllMenus()
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function getAllHostDetails() {
  return new Promise((resolve, reject) => {
    commonModel
      .getAllHostDetails()
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function setEnableDisable(action, id, value) {
  return new Promise((resolve, reject) => {
    commonModel
      .setEnableDisable(action, id, value)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function getDashboard() {
  return new Promise((resolve, reject) => {
    commonModel
      .getDashboard()
      .then(data => {
        console.log(data);
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function getUserMenus(userid) {
  return new Promise((resolve, reject) => {
    commonModel
      .getUserMenus(userid)
      .then(data => {
        // console.log("IN Common service " + data);
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function getSubmenus(parentid) {
  return new Promise((resolve, reject) => {
    commonModel
      .getSubmenus(parentid)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

async function getBudgetAlertList(req) {
  return commonModel.getBudgetAlertList(req);
}

async function updateBudgetAlertList(req) {

  const error = billingValidations.validateBudgetAlerts(req.body);
  if (error) throw ({ type: "custom", message: error, status: 400 });
  let order = true;

  for (let i = 0; i < req.body.alert_info.length - 1; i++)
    if (parseInt(req.body.alert_info[i + 1]['alert_percentage']) < parseInt(req.body.alert_info[i]['alert_percentage'])){
      order = false;
      break;
  } 
  if (!order) throw ({ type: "custom", message: 'Please send the values in an ascending order', status: 400 });

  let percentages = req.body.alert_info.map(ele => ele.alert_percentage);
  if(new Set(percentages).size !== percentages.length) throw ({ type: "custom", message: 'Cannot pass same value more than once', status: 400 });

  return commonModel.updateBudgetAlertList(req);
}

async function getFaqSearchList(reqBody, callback) {
  return new Promise((resolve,reject) => {
    commonModel.getFaqSearchList(reqBody, callback).then((data)=>{
          resolve(data);
      }).catch((err) => {
          reject(err);
      })
  });
}
async function getFaqList(reqBody, callback) {
  return new Promise((resolve,reject) => {
    commonModel.getFaqList(reqBody, callback).then((data)=>{
          resolve(data);
      }).catch((err) => {
          reject(err);
      })
  });
}
module.exports = commonService;
