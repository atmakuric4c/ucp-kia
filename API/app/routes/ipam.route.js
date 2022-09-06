var schema = require("../schema/userValidationSchema.json");
var iValidator = require("../../common/iValidator");
var errorCode = require("../../common/error-code");
var errorMessage = require("../../common/error-methods");
var mail = require("./../../common/mailer.js");
const ipamService = require("../services/ipam.service");

function init(router) {
  console.log("Logged");
  router.route("/getAllIps").get(getAllIps);
  router.route("/addIPamData").post(addIPamData);
  router.route("/getIPHistory").post(getIPHistory);
  router.route("/getIpamPageData").post(getIpamPageData);
  router.route("/getAllPrivateIps").get(getAllPrivateIps);
  router.route("/addPrivateIPamData").post(addPrivateIPamData);
  router.route("/getPrivateIPHistory").post(getPrivateIPHistory);
  router.route("/getPrivateIpamPageData").post(getPrivateIpamPageData);
}
function getAllIps(req, res) {
  ipamService
    .getAllIP()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      mail.mail(err);
      res.send(err);
    });
}
function addIPamData(req, res) {
  console.log("CoNNEcted");
  console.log(req.body);
  const startIpAddress = req.body.startIpAddress;
  const endIpAddress = req.body.endIpAddress;
  const subnetmask = req.body.subnetmask;
  const vdc_id = req.body.vdc_location;
  const gateway = req.body.gateway;
  const network_type = req.body.network_type;
  let endIp = endIpAddress;
  let x = endIp.split(".")[3];
  let startIp = startIpAddress;
  let y = startIp.split(".")[3];
  let ipInfo = [];
  for (i = y; i <= x; i++) {
    let ipData = {};
    ipData["ip_address"] =
      startIp.split(".")[0] +
      "." +
      startIp.split(".")[1] +
      "." +
      startIp.split(".")[2] +
      "." +
      i;
    ipData["subnetmask"] = subnetmask;
    ipData["gateway"] = gateway;
    ipData["vdc_id"] = vdc_id;
    ipData["netwok_type"] = network_type;
    ipInfo.push(ipData);
    console.log(ipInfo);
    ipamService.addIpAddressipIpam(ipData);
    //  if (i == x)
  }
  res.send({ message: "IPAM Added successfully" });
}
function getIPHistory(req, res) {
  const ipid = req.body.ipid;
  ipamService.getIPHistory(ipid).then(data => {
    res.send(data);
  });
}

function getIpamPageData(req, res) {
  let page = req.body.page;
  let pageSize = req.body.pageSize;
  let filtered = req.body.filtered;
  let sorted = req.body.sorted;
  ipamService.getIpamPageData(page, pageSize, filtered, sorted).then(data => {
    res.send({ rows: data.rows, pages: data.pages });
  });
}

/* PRAVEEN GET PRIVATE IP*/
function getAllPrivateIps(req, res) {
  ipamService
    .getAllIP()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      mail.mail(err);
      res.send(err);
    });
}
function addPrivateIPamData(req, res) {
  console.log("CoNNEcted");
  console.log(req.body);
  const startIpAddress = req.body.startIpAddress;
  const endIpAddress = req.body.endIpAddress;
  const subnetmask = req.body.subnetmask;
  const network_id = req.body.network_id;
  const gateway = req.body.gateway;
  // const network_type = req.body.network_type;
  let endIp = endIpAddress;
  let x = endIp.split(".")[3];
  let startIp = startIpAddress;
  let y = startIp.split(".")[3];
  let ipInfo = [];
  for (i = y; i <= x; i++) {
    let ipData = {};
    ipData["ip_address"] =
      startIp.split(".")[0] +
      "." +
      startIp.split(".")[1] +
      "." +
      startIp.split(".")[2] +
      "." +
      i;
    ipData["subnetmask"] = subnetmask;
    ipData["gateway"] = gateway;
    ipData["network_id"] = network_id;
    ipData["status"] = 'A';
    // ipData["netwok_type"] = network_type;
    ipInfo.push(ipData);
    console.log(ipInfo);
    ipamService.addPrivateIpAddressipIpam(ipData);
    //  if (i == x)
  }
  res.send({ message: "IPAM Added successfully" });
}
function getPrivateIPHistory(req, res) {
  const ipid = req.body.ipid;
  ipamService.getPrivateIPHistory(ipid).then(data => {
    res.send(data);
  });
}

function getPrivateIpamPageData(req, res) {
  let page = req.body.page;
  let pageSize = req.body.pageSize;
  let filtered = req.body.filtered;
  let sorted = req.body.sorted;
  ipamService
    .getPrivateIpamPageData(page, pageSize, filtered, sorted)
    .then(data => {
      res.send({ rows: data.rows, pages: data.pages });
    });
}

module.exports.init = init;