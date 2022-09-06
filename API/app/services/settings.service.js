var settingsModel = require("../models/settings.model.js");

var settingsService = {
  getEmailSettings,
  enableDisableEmail,
  addEmailConfig,
  getAllNetworks,
  addNetwork,getAllServers,addServer
};
function getEmailSettings() {
  return new Promise((resolve, reject) => {
    settingsModel
      .getEmailSettings()
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function enableDisableEmail(id, status) {
  return new Promise((resolve, reject) => {
    settingsModel
      .enableDisableEmail(id, status)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function addEmailConfig(emailconf) {
  return new Promise((resolve, reject) => {
    settingsModel
      .addEmailConfig(emailconf)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function getAllNetworks() {
  return new Promise((resolve, reject) => {
    settingsModel
      .getAllNetworks()
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function addNetwork(data) {
  return new Promise((resolve, reject) => {
    data["added_date"] = new Date().toISOString();
    settingsModel
      .addNetwork(data)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function getAllServers() {
  return new Promise((resolve, reject) => {
    settingsModel
      .getAllServers()
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function addServer(data) {
  return new Promise((resolve, reject) => {
    settingsModel
      .addServer(data)
      .then(data => {
        resolve(data);
      })
      .catch(err => {
        reject(err);
      });
  });
}
module.exports = settingsService;
