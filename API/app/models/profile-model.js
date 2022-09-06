var db = require('../../config/database');
var dbFunc = require('../../config/db-function');

var profileModel = {
    getAllProfiles:getAllProfiles,
    addProfile:addProfile,
    updateProfile:updateProfile,
    deleteProfile:deleteProfile,
    getProfileById:getProfileById
}

function getAllProfiles() {
    return new Promise((resolve,reject) => {
        db.query(`SELECT * FROM app_profile_templates where status=1`,(error,rows,fields)=>{
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

function getProfileById(id) {
    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM app_profile_templates WHERE id ="+id.id,(error,rows,fields)=>{
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

function addProfile(profileData) {
    let menuList = JSON.stringify(profileData.menuList); 
    let cts = Math.round(new Date().getTime() / 1000);    
    var profileValues = {
        profile_name: profileData.profileName,
        profile_menu_list: menuList,
        created_on: cts,        
        status: '1'        
      };     
     return new Promise((resolve,reject) => {
         db.query("INSERT INTO app_profile_templates SET ?", profileValues ,(error,rows,fields)=>{
            if(error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
          });
        });
}


function updateProfile(id,profileData) {
    let menuList = JSON.stringify(profileData.editmenuList); 
    let cts = Math.round(new Date().getTime() / 1000);
    return new Promise((resolve,reject) => {
        db.query("UPDATE app_profile_templates set profile_name='"+profileData.editprofileName+"',profile_menu_list='"+menuList+"',updated_on='"+cts+"' WHERE profile_id='"+id+"'",(error,rows,fields)=>{
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

function deleteProfile(id) {
   return new Promise((resolve,reject) => {
        db.query("DELETE FROM app_profile_templates WHERE id='"+id+"'",(error,rows,fields)=>{
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


module.exports = profileModel;

