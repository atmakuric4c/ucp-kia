var userModel = require("../models/user-model.js");


var userService = {
    getAllUsers: getAllUsers,
    getUserById:getUserById,
    addUser: addUser,
    updateUser:updateUser,
    deleteUser:deleteUser,
    resetPassword:resetPassword,
    changePassword:changePassword,
    userOtpVerify,
    resendOtp,getMenuListVMOperations,
    updateLoggedinUserData
}
function updateLoggedinUserData(reqObj,callback) {
    return new Promise((resolve,reject) => {
    	userModel.updateLoggedinUserData(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function userOtpVerify(reqBody,callback) {
    return new Promise((resolve,reject) => {
    	userModel.userOtpVerify(reqBody,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function resendOtp(reqBody,callback) {
    return new Promise((resolve,reject) => {
    	userModel.resendOtp(reqBody,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function addUser(userData, userid) {
    return new Promise((resolve,reject) => {
        userModel.addUser(userData, userid).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
   
}


function updateUser(id,userData, userid) {
    return new Promise((resolve,reject) => {
        userModel.updateUser(id,userData, userid).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
     
}

function resetPassword(reqObj,callback) {
    return new Promise((resolve,reject) => {
        userModel.resetPassword(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function changePassword(reqObj,callback) {
    return new Promise((resolve,reject) => {
        userModel.changePassword(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function deleteUser(id) {
    return new Promise((resolve,reject) => {
        userModel.deleteUser(id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
}
function getMenuListVMOperations(user_id){
    return new Promise((resolve,reject) => {
        userModel.getMenuListVMOperations(user_id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getAllUsers(clientId) {
    return new Promise((resolve,reject) => {
        userModel.getAllUsers(clientId).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getUserById(id) {
    return new Promise((resolve,reject) => {
        userModel.getUserById(id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}


module.exports = userService;

