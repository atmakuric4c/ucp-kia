var express = require('express');
var router = express.Router();
const awsDevopsModel = require('../models/aws_devops_model');
const helper = require('../helpers/common_helper');
const {  errorResponse } = require('../common/error-response');


router.post('/repository-sync', async function(req, res, next) {
    try{
    
      let result = await awsDevopsModel.syncClientAWSRepos();
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
  });

  
  router.post('/pipeline-sync', async function(req, res, next) {
    try{
    
      let result = await awsDevopsModel.syncClientAWSPipelines();
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
  });

  
  module.exports = router;