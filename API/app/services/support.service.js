var supportModel = require("../models/support-model.js");

var supportService = {
  getUsersbyToken: getUsersbyToken,
  getUserInfobyToken: getUserInfobyToken
};

function getUsersbyToken(token) {
  return new Promise((resolves, rejects) => {
    supportModel.getUsersbyToken(token).then(data => {
      resolves(data);
    });
  });
}

function getUserInfobyToken(token) {
  return new Promise((resolves, rejects) => {
    supportModel.getUserInfobyToken(token).then(data => {
      resolves(data);
    });
  });
}

module.exports = supportService;
