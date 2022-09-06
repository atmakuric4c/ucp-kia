var db = require('../../config/database');
var dbFunc = require('../../config/db-function');

var ostemplatesModel = {
    getAllOStemplates:getAllOStemplates,
    updateOStemplate: updateOStemplate    
}

function getAllOStemplates() {
    return new Promise((resolve,reject) => {
        db.query(`SELECT * FROM infra_vm_templates`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });
    });
}

function updateOStemplate(id,osformData) {
    return new Promise((resolve,reject) => {
        db.query("UPDATE infra_vm_templates set status='"+osformData.ostempstatus+"' WHERE id='"+id+"'",(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });    
    })
}

module.exports = ostemplatesModel;

