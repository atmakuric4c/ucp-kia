const profileService = require('../services/profile.service');
var schema = require('../schema/profileValidationSchema.json')
var iValidator = require('../../common/iValidator');
var errorCode = require('../../common/error-code');
var errorMessage = require('../../common/error-methods');
var mail = require('./../../common/mailer.js');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');

function init(router) {
    /*router.route('/profiles')
        .get(getAllProfiles)
        .post(addProfile);
    router.route('/profiles/:id')
        .get(getProfileById)
        .delete(deleteProfile)
        .put(updateProfile); */
}

function getAllProfiles(req,res) {
  profileService.getAllProfiles().then((data) => {
      res.send(data);
    }).catch((err) => {
      //mail.mail(err);
      res.send(err);
    });
}

function getProfileById(req,res) {

  let profileId = req.params;

  var json_format = iValidator.json_schema(schema.getSchema,profileId,"profile");
  if (json_format.valid == false) {
    return res.status(422).send(json_format.errorMessage);
  }

  profileService.getProfileById(profileId).then((data) => {
      res.send(data);
    }).catch((err) => {
      //mail.mail(err);
      res.send(err);
    });
}

function addProfile(req,res) {
  var profileData=req.body;
  
  //Validating the input entity
   /*var json_format = iValidator.json_schema(schema.postSchema, profileData, "profile");
   if (json_format.valid == false) {
     return res.status(422).send(json_format.errorMessage);
   }*/

  profileService.addProfile(profileData).then((data) => {
    res.json(data);
  }).catch((err) => {
    mail.mail(err);
    res.json(err);
  });

}


function updateProfile(req,res) {
   var profileData=req.body;
   var id = req.params.id;
   profileService.updateProfile(id,profileData).then((data)=>{
      res.json(data);
  }).catch((err)=>{
      mail.mail(err);
      res.json(err);
   });
}


function deleteProfile(req,res) {
  var delId = req.params.id;
  profileService.deleteProfile(delId).then((data)=>{
    res.json(data);
  }).catch((err)=>{
     mail.mail(err);
      res.json(err);
  });
}


module.exports.init = init;



