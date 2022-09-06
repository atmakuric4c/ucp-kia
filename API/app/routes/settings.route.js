var schema = require("../schema/userValidationSchema.json");
var iValidator = require("../../common/iValidator");
var errorCode = require("../../common/error-code");
var errorMessage = require("../../common/error-methods");
var mail = require("./../../common/mailer.js");
const settingsService = require("../services/settings.service");

function init(router) {
  router.route("/getEmailSettings").get(getEmailSettings);
  router.route("/enableDisableEmail").post(enableDisableEmail);
  router.route("/addEmailConfig").post(addEmailConfig);
  router.route("/getAllNetworks").get(getAllNetworks);
  router.route("/addNetwork").post(addNetwork);
  router.route("/getAllServers").get(getAllServers);
  router.route("/addServer").post(addServer);
}
function getEmailSettings(req, res) {
  settingsService
    .getEmailSettings()
    .then(data => {
      console.log(data);
      res.send(data);
    })
    .catch(err => {
      mail.mail(err);
      console.log("In error");
      res.send(err);
    });
}
function enableDisableEmail(req, res) {
  const id = req.body.id;
  const status = req.body.status;
  let tostatus = "";
  status == "InActive" ? (tostatus = 0) : (tostatus = 1);
  settingsService
    .enableDisableEmail(id, tostatus)
    .then(resp => {
      mail.mail("Test email");
      res.send({ message: "Email status Updated successfully" });
    })
    .catch(err => {
      mail.mail(err);
      res.send({ message: err });
    });
}

function addEmailConfig(req, res) {
  let emailconf = {};
  emailconf["hostname"] = req.body.hostname;
  emailconf["email"] = req.body.email;
  emailconf["port"] = req.body.port;
  emailconf["password"] = req.body.password;
  emailconf["sender_name"] = req.body.sender_name;
  var date = new Date();
  var timestamp = date.getTime();
  emailconf["createddate"] = timestamp;
  // console.log(emailconf);
  settingsService
    .addEmailConfig(emailconf)
    .then(resp => {
      res.send({ message: "Email status Added successfully" });
    })
    .catch(err => {
      mail.mail(err);
      res.send({ message: err });
    });
}
function getAllNetworks(req, res) {
  settingsService
    .getAllNetworks()
    .then(data => {
      //console.log(data);
      res.send(data);
    })
    .catch(err => {
      mail.mail(err);
      console.log("In error");
      res.send(err);
    });
}
function addNetwork(req, res) {
  settingsService
    .addNetwork(req.body)
    .then(resp => {
      res.send({ message: "Network Added successfully" });
    })
    .catch(err => {
      res.send(err);
    });
}
function getAllServers(req, res) {
  settingsService
    .getAllServers()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("In error");
      res.send(err);
    });
}
function addServer(req, res) {
  settingsService
    .addServer(req.body)
    .then(resp => {
      res.send({ message: "Server Added successfully" });
    })
    .catch(err => {
      res.send(err);
    });
}
module.exports.init = init;
