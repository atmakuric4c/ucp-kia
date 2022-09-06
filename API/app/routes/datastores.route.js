var schema = require("../schema/userValidationSchema.json");
var iValidator = require("../../common/iValidator");
var errorCode = require("../../common/error-code");
var errorMessage = require("../../common/error-methods");
var mail = require("./../../common/mailer.js");
const commonService = require("../services/common.service");

function init(router) {
  console.log("Logged");
  router.route("/getAllDataStores").get(getAllDataStores);
  router.route("/getDatastoreDetail/:id").get(getDatastoreDetail);
}
function getDatastoreDetail(req,res) {
  let ds_id = req.params.id; 
  commonService.getDatastoreDetail(ds_id).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}
function getAllDataStores(req, res) {
  commonService
    .getAllDataStores()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      mail.mail(err);
      res.send(err);
    });
}

module.exports.init = init;
