var express = require('express');
var router = express.Router();
const crayonModel = require('../models/crayon_model')
const helper  = require('../helpers/common_helper')
/*
  @desc: get client list
  @author: Pradeep
  @date  : 02-12-2020
*/
router.get('/get_client_list', function(req, res, next) {
  crayonModel.getClientList(function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  @desc: get organization list
  @author: Pradeep
  @date  : 02-12-2020
*/
router.get('/get_organization_list', function(req, res, next) {
  crayonModel.getOrganizationList(function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  @desc: get tenant list
  @author: Pradeep
  @date  : 02-12-2020
*/
router.get('/get_tenant_list', function(req, res, next) {
  crayonModel.getTenantList(function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  @desc: get subscription list
  @author: Pradeep
  @date  : 02-12-2020
*/
router.get('/get_subscription_list', function(req, res, next) {
  crayonModel.getSubscriptionList(function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});

/*
@desc: sync Crayon Usage data
@author: Rajesh
@date  : 07-12-2020
*/
router.get('/sync_crayon_usage_data', function(req, res, next) {
crayonModel.syncCrayonUsageData(req.query, function(err,result){
  if (err) {
    res.status(200).send(result)
  } else {
    res.status(200).send(result)
  }
});
});

module.exports = router;
/*netstat -ano | findstr :9890
tskill pinumber  */
//for linux
//pkill -f node