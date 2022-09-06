var authenticModel = require("../models/authentic.model");


var authenticService = {
    authentic,
    adAuthentic,
    signup:signup
}


function authentic(authenticData) {
    return new Promise((resolve,reject) => {
        authenticModel.authentic(authenticData).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
   
}

function adAuthentic(authenticData) {
    return new Promise((resolve,reject) => {
        authenticModel.adAuthentic(authenticData).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
   
}

function signup(signUpData) {
    
    return new Promise((resolve,reject) => {
        authenticModel.signup(signUpData).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
   
}



module.exports = authenticService;

