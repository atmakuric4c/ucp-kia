const gcpDevopsService = require('../services/gcpDevops.service');
const base64 = require('base-64');
const ucpEncryptDecrypt = require('../../config/ucpEncryptDecrypt');
const {  errorResponse } = require('../../common/error-response');
const checkToken = require("../../config/secureRoute");
let express = require("express");
let router = express.Router();

router.get("/project", checkToken, getGCPProjectList);
router.get("/project/:project_id/trigger", checkToken, getGCPTriggerList);
router.get("/project/:project_id/trigger/:trigger_id", checkToken, getGCPTriggerDetails);

router.get("/project/:project_id/build", checkToken, getGCPBuildList);
router.get("/project/:project_id/build/:build_id", checkToken, getGCPBuildDetails);

async function getGCPProjectList(req, res) {
  try{
  
    let result = await gcpDevopsService.getGCPProjectList(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function getGCPTriggerList(req, res) {
    try{
    
      let result = await gcpDevopsService.getGCPTriggerList(req);
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
  
}

async function getGCPTriggerDetails(req, res) {
    try{
    
      let result = await gcpDevopsService.getGCPTriggerDetails(req);
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
  
}

async function getGCPBuildList(req, res) {
  try{
  
    let result = await gcpDevopsService.getGCPBuildList(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function getGCPBuildDetails(req, res) {
  try{
  
    let result = await gcpDevopsService.getGCPBuildDetails(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

module.exports = router;