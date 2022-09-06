var profileModel = require("../models/profile-model.js");


var profileService = {
    getAllProfiles: getAllProfiles,
    getProfileById:getProfileById,
    addProfile: addProfile,
    updateProfile:updateProfile,
    deleteProfile:deleteProfile
}

function addProfile(profileData) {
    return new Promise((resolve,reject) => {
        profileModel.addProfile(profileData).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
   
}


function updateProfile(id,profileData,callback) {
    return new Promise((resolve,reject) => {
        profileModel.updateProfile(id,profileData).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
     
}

function deleteProfile(id) {
    return new Promise((resolve,reject) => {
        profileModel.deleteProfile(id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
}

function getAllProfiles() {
    return new Promise((resolve,reject) => {
        profileModel.getAllProfiles().then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getProfileById(id) {
    return new Promise((resolve,reject) => {
        profileModel.getProfileById(id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}


module.exports = profileService;

