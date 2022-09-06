var ipamModel = require("../models/ipam-model.js");

var ipamService = {
  getAllIP: getAllIP,
  addIpAddressipIpam: addIpAddressipIpam,
  getIPHistory: getIPHistory,
  getIpamPageData: getIpamPageData,
  getAllPrivateIP: getAllPrivateIP,
  addPrivateIpAddressipIpam: addPrivateIpAddressipIpam,
  getPrivateIPHistory: getPrivateIPHistory,
  getPrivateIpamPageData: getPrivateIpamPageData
};

//Public IPAM
function getAllIP() {
  return new Promise((resolve, reject) => {
    ipamModel
      .getAllIP()
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function addIpAddressipIpam(ipData) {
  console.log("In Service" + ipData);
  return new Promise((resolve, reject) => {
    ipamModel
      .addIpAddressipIpam(ipData)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function getIPHistory(ipid) {
  return new Promise((resolve, reject) => {
    ipamModel
      .getIPHistory(ipid)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function getIpamPageData(page, pageSize, filtered, sort) {
  return new Promise((resolve, reject) => {
    ipamModel
      .getIpamPageData(page, pageSize, filtered, sort)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

//Private
function getAllPrivateIP() {
  return new Promise((resolve, reject) => {
    ipamModel
      .getAllPrivateIP()
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function addPrivateIpAddressipIpam(ipData) {
  console.log("In Service" + ipData);
  return new Promise(async (resolve, reject) => {
    await ipamModel
      .addPrivateIpAddressipIpam(ipData)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function getPrivateIPHistory(ipid) {
  return new Promise((resolve, reject) => {
    ipamModel
      .getPrivateIPHistory(ipid)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function getPrivateIpamPageData(page, pageSize, filtered, sort) {
  return new Promise((resolve, reject) => {
    ipamModel
      .getPrivateIpamPageData(page, pageSize, filtered, sort)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

module.exports = ipamService;
