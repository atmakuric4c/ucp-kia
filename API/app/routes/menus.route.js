const menusService = require('../services/menus.service');
const mail = require('./../../common/mailer.js');
const { errorResponse } = require('../../common/error-response');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');

function init(router) {
    router.route('/menu').get(getAllMenus);
    router.route('/menu').post(saveMenu);
    router.route('/menu/:id').put(updateMenu);
    router.route('/menu/:id').delete(deleteMenu);
    router.route('/profile').get(getAllProfiles);
    router.route('/profile').post(addProfile);
    router.route('/profile/user').get(getUserProfile);
    router.route('/profile/user').put(updateUserProfile);
    router.route('/profile/user').delete(deleteUserProfile);
    router.route('/profile/:id').put(updateProfile);
    router.route('/profile/:id').delete(deleteProfile);
    router.route('/profile/user').post(addUserProfile);
    router.route('/profile/:id/menu').get(getProfileMenu);
    router.route('/menus/deleteMenu/:id').delete(deleteMenu);
    router.route('/vmoperation').get(getAllVMOperations);
    router.route('/vmoperation').post(saveVMOperation);
    router.route('/vmoperation/:id').put(updateVMOperation);
    router.route('/vmoperation/:id').delete(deleteVMOperation);
    router.route('/menus/saveUserProfile').post(saveUserProfile)
    router.route('/menus/userProfileMapping').post(userProfileMapping)
    router.route('/menus/vmOperationMenus').get(vmOperationMenus)
}
function vmOperationMenus(req,res) {
  menusService.vmOperationMenus().then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}

async function getAllMenus(req,res) {
    try{
    
      let result = await menusService.getAllMenus(req);
      res.status(200).send(result);
  
    }
    catch(error){
      errorResponse(res, error);
    }
}

async function saveMenu(req,res){
  try{
    
    let result = await menusService.saveMenu(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
}

async function updateMenu(req,res){
  try{
    
    let result = await menusService.updateMenu(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
}

async function deleteMenu(req,res){
  try{
    
    let result = await menusService.deleteMenu(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
}

async function getAllProfiles(req,res) {
  try{
  
    let result = await menusService.getAllProfiles(req);
//    res.status(200).send(result);
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))

  }
  catch(error){
    errorResponse(res, error);
  }
}

async function addProfile(req,res){
  try{
    
    let result = await menusService.addProfile(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
}

async function updateProfile(req,res){
  try{
    
    let result = await menusService.updateProfile(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
}

async function deleteProfile(req,res){
  try{
    let result = await menusService.deleteProfile(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
}

async function addUserProfile(req,res){
  try{
    
    let result = await menusService.addUserProfile(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
}

async function updateUserProfile(req,res){
  try{
    
    let result = await menusService.updateUserProfile(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
}

async function deleteUserProfile(req,res){
  try{
    
    let result = await menusService.deleteUserProfile(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
}

async function getProfileMenu(req,res){
  try{
    
    let result = await menusService.getProfileMenu(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
}

async function getUserProfile(req,res){
  try{
    
    let result = await menusService.getUserProfile(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
}

async function getAllVMOperations(req,res) {
  try{
  
    let result = await menusService.getAllVMOperations(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
}

async function saveVMOperation(req,res){
  try{
    
    let result = await menusService.saveVMOperation(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
}

async function updateVMOperation(req,res){
  try{
    
    let result = await menusService.updateVMOperation(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
}

async function deleteVMOperation(req,res){
  try{
    
    let result = await menusService.deleteVMOperation(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
}

function saveUserProfile(req,res){
  menusService.saveUserProfile(req,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}

function userProfileMapping(req,res){
  menusService.userProfileMapping(req,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}

module.exports.init = init;