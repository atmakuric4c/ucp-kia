const msDevopsService = require('../services/msDevops.service');
const base64 = require('base-64');
const ucpEncryptDecrypt = require('../../config/ucpEncryptDecrypt');
const {  errorResponse } = require('../../common/error-response');
const checkToken = require("../../config/secureRoute");
let express = require("express");
let router = express.Router();


router.get("/repo", checkToken, getMSRepoList);
router.get("/repo/:id", checkToken, getMSRepoDetails);
router.get("/repo/:id/files", checkToken, getMSRepoFiles);
router.post("/repo", checkToken, addMSRepo);
router.delete("/repo/:id", checkToken, deleteMSRepo);

router.get("/pipeline", checkToken, getMSPipelineList);
router.get("/pipeline/:id", checkToken, getMSPipelineDetails);
router.get("/pipeline/:id/run", checkToken, getMSPipelineRuns);startMSPipeline
router.get("/pipeline/:id/run/:run_id", checkToken, getMSPipelineRunDetails);
router.post("/pipeline/:id/start", checkToken, startMSPipeline);

router.get("/organization", checkToken, getMSOrganizationList);
router.get("/organization/:id/project", checkToken, getMSProjectList);


async function getMSRepoList(req, res) {
    try{
    
      let result = await msDevopsService.getMSRepoList(req);
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
  
}

async function getMSRepoDetails(req, res) {
    try{
    
      let result = await msDevopsService.getMSRepoDetails(req);
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
  
}

async function getMSRepoFiles(req, res) {
    try{
    
      let result = await msDevopsService.getMSRepoFiles(req);
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
  
}

async function addMSRepo(req, res) {
  try{
  
    let result = await msDevopsService.addMSRepo(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function deleteMSRepo(req, res) {
  try{
  
    let result = await msDevopsService.deleteMSRepo(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function getMSPipelineList(req, res) {
  try{
  
    let result = await msDevopsService.getMSPipelineList(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function getMSPipelineDetails(req, res) {
  try{
  
    let result = await msDevopsService.getMSPipelineDetails(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function getMSPipelineRuns(req, res) {
  try{
  
    let result = await msDevopsService.getMSPipelineRuns(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function getMSPipelineRunDetails(req, res) {
  try{
  
    let result = await msDevopsService.getMSPipelineRunDetails(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function startMSPipeline(req, res) {
  try{
  
    let result = await msDevopsService.startMSPipeline(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function getMSOrganizationList(req, res) {
  try{
  
    let result = await msDevopsService.getMSOrganizationList(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function getMSProjectList(req, res) {
  try{
  
    let result = await msDevopsService.getMSProjectList(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

module.exports = router;