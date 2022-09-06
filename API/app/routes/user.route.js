const userService = require('../services/user.service');
var schema = require('../schema/userValidationSchema.json')
var iValidator = require('../../common/iValidator');
var errorCode = require('../../common/error-code');
var errorMessage = require('../../common/error-methods');
var mail = require('./../../common/mailer.js');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');


function init(router) {
    router.route('/users').post(addUser);
    router.route('/resendOtp').post(resendOtp);
    router.route('/userOtpVerify').post(userOtpVerify);
    router.route('/users/resetPassword').post(resetPassword);
    router.route('/users/changePassword').post(changePassword);
    router.route('/users/updateLoggedinUserData').post(updateLoggedinUserData);
    router.route('/users/getMenuListVMOperations').post(getMenuListVMOperations);
    router.route('/users/:id')
        .get(getAllUsers)
        .get(getUserById)
        .delete(deleteUser)
        .put(updateUser); 
}
function getMenuListVMOperations(req,res) {
  var user_id=req.body.user_id;
    userService.getMenuListVMOperations(user_id).then((data)=>{
      res.status(200).send(data)
    }).catch((err) => {
      res.status(400).send(err)
    });
}
function userOtpVerify(req,res) {
  userService.userOtpVerify(req.body, function(err,result){
    if (err) {
        res.status(200).send(result)
    } else {
        res.status(200).send(result)
    }
  });
}

function resendOtp(req,res) {
	const requestIp = require('request-ip');
	const clientIp = requestIp.getClientIp(req); 
	req.body.clientIp = clientIp;
  userService.resendOtp(req.body, function(err,result){
    if (err) {
        res.status(200).send(result)
    } else {
        res.status(200).send(result)
    }
  });
}

function getAllUsers(req,res) {
  let clientId = req.params;
  userService.getAllUsers(clientId).then((data) => {
      res.json(ucpEncryptDecrypt.ucpEncrypt(data));
    }).catch((err) => {
      //mail.mail(err);
      res.json(ucpEncryptDecrypt.ucpEncrypt(err));
    });
}

function getUserById(req,res) {
  let userId = req.params;
  var json_format = iValidator.json_schema(schema.getSchema,userId,"user");
  if (json_format.valid == false) {
    return res.status(422).send(json_format.errorMessage);
  }

  userService.getUserById(userId).then((data) => {
      res.send(data);
    }).catch((err) => {
      //mail.mail(err);
      res.send(err);
    });
}

let addUser = async (req,res)=>{
	try{
		ucpEncryptDecryptParser = await JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	}catch{
		return res.status(500).json(ucpEncryptDecrypt.ucpEncrypt({status:"error", success:0, message:"Invalid request"}, req.query));
    }
	var userData = ucpEncryptDecryptParser;
//  var userData=req.body;
  
  //Validating the input entity
  /* var json_format = iValidator.json_schema(schema.postSchema, userData, "user");
   if (json_format.valid == false) {
     return res.status(422).send(json_format.errorMessage);
   }*/

  userService.addUser(userData, req.userid).then((data) => {
    res.json(ucpEncryptDecrypt.ucpEncrypt(data));
  }).catch((err) => {
    //mail.mail(err);
    res.json(ucpEncryptDecrypt.ucpEncrypt(err));
  });

}

let updateUser = async (req,res)=>{
	try{
		ucpEncryptDecryptParser = await JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	}catch{
		return res.status(500).json(ucpEncryptDecrypt.ucpEncrypt({status:"error", success:0, message:"Invalid request"}, req.query));
    }
	var userData = ucpEncryptDecryptParser;
//   var userData=req.body;
   
   var id = req.params.id;
   userService.updateUser(id,userData, req.userid).then((data)=>{
      res.json(ucpEncryptDecrypt.ucpEncrypt(data));
  }).catch((err)=>{
      // mail.mail(err);
      res.json(ucpEncryptDecrypt.ucpEncrypt(err));
   });
}

let updateLoggedinUserData = async (req,res)=>{
	try{
		ucpEncryptDecryptParser = await JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	}catch{
		return res.status(500).json(ucpEncryptDecrypt.ucpEncrypt({status:"error", success:0, message:"Invalid request"}, req.query));
    }
	var userData = ucpEncryptDecryptParser;
//   var userData=req.body;
   
   userService.updateLoggedinUserData(userData,function(err,result){
	    if (err) {
	        res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
        } else {
	        res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
        }
  });
}

function resetPassword(req,res) {
  userService.resetPassword(req,function(err,result){
    if (err) {
    res.status(200).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}

function changePassword(req,res) {
  userService.changePassword(req,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}


function deleteUser(req,res) {
  var delId = req.params.id;
  userService.deleteUser(delId).then((data)=>{
    res.json(data);
  }).catch((err)=>{
     //mail.mail(err);
      res.json(err);
  });
}


module.exports.init = init;



