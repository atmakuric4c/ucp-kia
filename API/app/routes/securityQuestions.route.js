const securityQuestionsService = require('../services/securityQuestions.service');
const base64 = require('base-64');
const ucpEncryptDecrypt = require('../../config/ucpEncryptDecrypt');
const {  errorResponse } = require('../../common/error-response');
const checkToken = require("../../config/secureRoute");
let express = require("express");
let router = express.Router();


router.get("/", checkToken, getSecurityQuestions);
router.get("/user", checkToken, getUserSecurityQuestions);
router.post("/user", checkToken, addUserSecurityQuestions);
router.put("/user", checkToken, updateUserSecurityQuestions);
router.get("/random/user/:hash_key", getRandomUserSecurityQuestions);
router.post("/verify/user/:hash_key", verifyUserSecurityQuestions);


async function getSecurityQuestions(req, res) {
    try{
    
      let result = await securityQuestionsService.getSecurityQuestions(req);
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
  
}

async function getUserSecurityQuestions(req, res) {
    try{
    
      let result = await securityQuestionsService.getUserSecurityQuestions(req);
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
  
}


async function addUserSecurityQuestions(req, res) {
  try{
  
    let result = await securityQuestionsService.addUserSecurityQuestions(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error); 
  }

}

async function updateUserSecurityQuestions(req, res) {
  try{
  
    let result = await securityQuestionsService.updateUserSecurityQuestions(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function getRandomUserSecurityQuestions(req, res) {
  try{
  
    let result = await securityQuestionsService.getRandomUserSecurityQuestions(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

async function verifyUserSecurityQuestions(req, res) {
  try{
  
    let result = await securityQuestionsService.verifyUserSecurityQuestions(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}
  
module.exports = router;