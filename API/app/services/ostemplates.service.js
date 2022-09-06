var ostemplatesModel = require("../models/ostemplates.model.js");


var ostemplatesService = {
    getAllOStemplates: getAllOStemplates,
    updateOStemplate: updateOStemplate    
}

function getAllOStemplates() {
    return new Promise((resolve,reject) => {
        ostemplatesModel.getAllOStemplates().then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function updateOStemplate(id,osformData,callback) {
    return new Promise((resolve,reject) => {
        ostemplatesModel.updateOStemplate(id,osformData).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
     
}

module.exports = ostemplatesService;

