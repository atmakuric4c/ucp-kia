var menusModel = require("../models/menus.model.js");
const menuValidations = require('../validations/menus.validator');

var menusService = {
    getAllMenus,
    saveMenu,
    updateMenu,
    deleteMenu,
    getAllProfiles,
    addProfile,
    updateProfile,
    deleteProfile,
    addUserProfile,
    updateUserProfile,
    deleteUserProfile,
    getProfileMenu,
    getUserProfile,
    getAllVMOperations,
    saveVMOperation,
    updateVMOperation,
    deleteVMOperation,
    saveUserProfile,
    userProfileMapping,
    vmOperationMenus
}
function vmOperationMenus() {
    return new Promise((resolve,reject) => {
        menusModel.vmOperationMenus().then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

async function getAllMenus(req) {
    let { output, count } = await menusModel.getAllMenus(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function saveMenu(req) {
    const error = menuValidations.validateMenuItem(req.body);
    if (error) throw ({ type: "custom", message: error, status: 400 });

    let { output, count } = await menusModel.saveMenu(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function updateMenu(req) {
    const error = menuValidations.validateUpdateMenuItem(req.body);
    if (error) throw ({ type: "custom", message: error, status: 400 });

    let { output, count } = await menusModel.updateMenu(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function deleteMenu(req) {
    let { output, count } = await menusModel.deleteMenu(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getAllProfiles(req) {
    let { output, count } = await menusModel.getAllProfiles(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function addProfile(req) {
    const error = menuValidations.validateProfileItem(req.body);
    if (error) throw ({ type: "custom", message: error, status: 400 });

    let { output, count } = await menusModel.addProfile(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function updateProfile(req) {
    const error = menuValidations.validateUpdateProfileItem(req.body);
    if (error) throw ({ type: "custom", message: error, status: 400 });

    let { output, count } = await menusModel.updateProfile(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function deleteProfile(req) {
    let { output, count } = await menusModel.deleteProfile(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function addUserProfile(req) {
    const error = menuValidations.validateAddUserProfile(req.body);
    if (error) throw ({ type: "custom", message: error, status: 400 });

    let { output, count } = await menusModel.addUserProfile(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function updateUserProfile(req) {
    const error = menuValidations.validateUpdateUserProfile(req.body);
    if (error) throw ({ type: "custom", message: error, status: 400 });

    let { output, count } = await menusModel.updateUserProfile(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function deleteUserProfile(req) {
    let { output, count } = await menusModel.deleteUserProfile(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getProfileMenu(req) {
    let { output, count } = await menusModel.getProfileMenu(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getUserProfile(req) {
    let { output, count } = await menusModel.getUserProfile(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getAllVMOperations(req) {
    let { output, count } = await menusModel.getAllVMOperations(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function saveVMOperation(req) {
    const error = menuValidations.validateVMOperationItem(req.body);
    if (error) throw ({ type: "custom", message: error, status: 400 });

    let { output, count } = await menusModel.saveVMOperation(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function updateVMOperation(req) {
    const error = menuValidations.validateUpdateVMOperationItem(req.body);
    if (error) throw ({ type: "custom", message: error, status: 400 });

    let { output, count } = await menusModel.updateVMOperation(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function deleteVMOperation(req) {
    let { output, count } = await menusModel.deleteVMOperation(req);
    return { message:'success', data : output, count: count, status: 200 };
}

function saveUserProfile(reqObj,callback) {
    menusModel.saveUserProfile(reqObj,function(err,result){
        return callback(err,result)
    })
}

function userProfileMapping(reqObj,callback) {
    return new Promise((resolve,reject) => {
        menusModel.userProfileMapping(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
module.exports = menusService;

