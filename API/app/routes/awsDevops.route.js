const awsDevopsService = require('../services/awsDevops.service');
const base64 = require('base-64');
const ucpEncryptDecrypt = require('../../config/ucpEncryptDecrypt');
const {  errorResponse } = require('../../common/error-response');
const checkToken = require("../../config/secureRoute");
let express = require("express");
let router = express.Router();


router.get("/repo", checkToken, getAWSRepoList);
router.get("/repo/:id", checkToken, getAWSRepoDetails);
router.get("/repo/:id/files", checkToken, getAWSRepoFiles);
router.get("/repo/:id/files/:file_id", checkToken, getAWSRepoFileContent);
router.get("/repo/:id/branch", checkToken, getAWSRepoBranches);
router.post("/repo", checkToken, addAWSRepo);
router.delete("/repo/:id", checkToken, deleteAWSRepo);

router.get("/pipeline", checkToken, getAWSPipelineList);
router.get("/pipeline/:id", checkToken, getAWSPipelineDetails);
router.get("/pipeline/:id/status", checkToken, getAWSPipelineStatus);
router.get("/pipeline/:id/execution/history", checkToken, getAWSPipelineExecutionHistory);
router.post("/pipeline/:id/start", checkToken, startAWSPipeline);
router.post("/pipeline/:id/stop/:execution_id", checkToken, stopAWSPipeline);
router.delete("/pipeline/:id", checkToken, deleteAWSPipeline);

router.get("/region", checkToken, getAWSRegionList);


async function getAWSRepoList(req, res) {
    try{
    
      let result = await awsDevopsService.getAWSRepoList(req);
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
  
}

async function getAWSRepoDetails(req, res) {
    try{
    
      let result = await awsDevopsService.getAWSRepoDetails(req);
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
  
}

async function getAWSRepoFiles(req, res) {
    try{
    
      let result = await awsDevopsService.getAWSRepoFiles(req);
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
  
}

async function getAWSRepoFileContent(req, res) {
  try{
  
    let result = await awsDevopsService.getAWSRepoFileContent(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function getAWSRepoBranches(req, res) {
  try{
  
    let result = await awsDevopsService.getAWSRepoBranches(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function addAWSRepo(req, res) {
  try{
  
    let result = await awsDevopsService.addAWSRepo(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function deleteAWSRepo(req, res) {
  try{
  
    let result = await awsDevopsService.deleteAWSRepo(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function getAWSPipelineList(req, res) {
    try{
    
      let result = await awsDevopsService.getAWSPipelineList(req);
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
  
}

async function getAWSPipelineDetails(req, res) {
    try{
    
      let result = await awsDevopsService.getAWSPipelineDetails(req);
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
  
}

async function getAWSPipelineStatus(req, res) {
    try{
    
      let result = await awsDevopsService.getAWSPipelineStatus(req);
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
  
}

async function getAWSPipelineExecutionHistory(req, res) {
    try{
    
      let result = await awsDevopsService.getAWSPipelineExecutionHistory(req);
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
  
}

async function getAWSPipelineExecutionHistory(req, res) {
  try{
  
    let result = await awsDevopsService.getAWSPipelineExecutionHistory(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function startAWSPipeline(req, res) {
  try{
  
    let result = await awsDevopsService.startAWSPipeline(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function stopAWSPipeline(req, res) {
  try{
  
    let result = await awsDevopsService.stopAWSPipeline(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function deleteAWSPipeline(req, res) {
  try{
  
    let result = await awsDevopsService.deleteAWSPipeline(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function getAWSRegionList(req, res) {
  try{
  
    let result = await awsDevopsService.getAWSRegionList(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

module.exports = router;