var db = require('../../config/database');
var dbFunc = require('../../config/db-function');
const helper=require('../../helpers/common_helper');
const dbHandler= require('../../config/api_db_handler');
const dateFormat = require("dateformat");
const axios = require('axios');

var menusModel = {
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
        db.query(`SELECT * from c4_profile_ucpvm_operations where deleted_status=0 and status=1 order by id asc`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows)
            }
       });
    });
}

async function getAllMenus(req) {
    let menuListQuery = `SELECT * from c4_ucpcustomer_menu where deleted_status=0 and status=1 
    order by parent_id, sort_order asc`;
    let menuList = await dbHandler.executeQueryv2(menuListQuery, { });

    let response = { output : menuList, count: 0 };
    return response;
}

function sync_menus(){
    return 1
    dbHandler.executeQuery('select * from customer_menu',async function(result){
        let i=0;
        for await(let menu of result){
            let formData = menu;
            var menuValues = {
            menu_name: formData.menu_name,
            url: formData.url,
            parent_id: formData.parent_id,
            has_child: (formData.parent_id > 0)?0:1,
            status: formData.status,
            sort_order: i++,
            created_by:formData.created_by,
            created_on:formData.created_on,
            updated_by:formData.updated_by
            };
            db.query("INSERT INTO c4_ucpcustomer_menu SET ?", menuValues ,(error,orderRows,fields)=>{
                dbFunc.connectionRelease;
            })     
        }
    })
}
function sync_menuprofile(){
    return 1
    dbHandler.executeQuery('select * from c4_profile_templates',async function(result){
        let i=0;
        for await(let menu of result){
            let formData = menu;
            var menuValues = {
                client_id: formData.client_id,
                profile_name: formData.profile_name,
                profile_menu_list: formData.profile_menu_list,
                vm_operations: formData.vm_operations,
                dashboard_permissions:formData.dashboard_permissions,
                is_admin_profile:formData.is_admin_profile,
                status: formData.status,
                created_by:formData.created_by,
                created_on:formData.created_on,
                updated_by:formData.updated_by
            };
            db.query("INSERT INTO c4_ucpprofile_templates SET ?", menuValues ,(error,orderRows,fields)=>{
                dbFunc.connectionRelease;
            })     
        }
    })
}

async function saveMenu(req) {

    let { menu_name, parent_id } = req.body;
    let { clientid, userid } = req;

    let checkStatusQuery = `SELECT * FROM c4_ucpcustomer_menu WHERE deleted_status=0 and menu_name= :menu_name and parent_id= :parent_id`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { menu_name: menu_name, parent_id: parent_id });
    if(checkStatus.length) throw ({ type: "custom", message: `Menu item already exists`, status: 400 });

    if(parent_id != 0){
        let checkParentQuery = `SELECT * FROM c4_ucpcustomer_menu WHERE deleted_status=0 and id= :parent_id`;
        let checkParent = await dbHandler.executeQueryv2(checkParentQuery, { parent_id: parent_id });
        if(!checkParent.length) throw ({ type: "custom", message: `Given parent does not exist`, status: 400 });
    }

    let updateParentQuery = `update c4_ucpcustomer_menu set has_child= 1 where id= :parent_id`;
    let updateParent = await dbHandler.executeQueryv2(updateParentQuery, { parent_id: parent_id });

    let addMenuQuery = `insert into c4_ucpcustomer_menu
    (menu_name, url, classname, description, parent_id, has_child, status, sort_order, created_on, created_by, updated_by, updated_on, deleted_status, reference_table, reference_flag)
    values (:menu_name, :url, :classname, :description, :parent_id, :has_child, :status, :sort_order, :created_on, :created_by, :updated_by, :updated_on, :deleted_status, :reference_table, :reference_flag)`;
    let addMenu = await dbHandler.executeQueryv2(addMenuQuery, { 
        menu_name: req.body.menu_name,
        url: req.body.url,
        classname: req.body.classname,
        description: req.body.description,
        parent_id: req.body.parent_id ? req.body.parent_id : 0,
        has_child: 0,
        status: 1,
        sort_order: req.body.sort_order,
        created_on: new Date(),
        created_by: userid,	
        updated_by: userid,
        updated_on: new Date(),
        deleted_status: 0,
        reference_table: req.body.reference_table,
        reference_flag: req.body.reference_flag
    });

    let response = { output : req.body, count: 0 };
    return response;

}

async function updateMenu(req) {

    let { parent_id } = req.body;
    let { id } = req.params;

    let checkStatusQuery = `SELECT * FROM c4_ucpcustomer_menu WHERE deleted_status=0 and id= :id`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { id: id });
    if(!checkStatus.length) throw ({ type: "custom", message: `Menu item does not exist`, status: 400 });

    if(parent_id != 0){
        let checkParentQuery = `SELECT * FROM c4_ucpcustomer_menu WHERE deleted_status=0 and id= :parent_id`;
        let checkParent = await dbHandler.executeQueryv2(checkParentQuery, { parent_id: parent_id });
        if(!checkParent.length) throw ({ type: "custom", message: `Given parent does not exist`, status: 400 });
    }

    let updateParentQuery = `update c4_ucpcustomer_menu set has_child= 1 where id= :parent_id`;
    let updateParent = await dbHandler.executeQueryv2(updateParentQuery, { parent_id: parent_id });

    let updateMenuQuery = `update c4_ucpcustomer_menu
    set menu_name= :menu_name, url= :url, classname= :classname, description= :description, 
    parent_id= :parent_id, status= :status, sort_order= :sort_order,
    updated_by= :updated_by, updated_on= :updated_on,
    reference_table= :reference_table, reference_flag= :reference_flag where id= :id`;
    let updateMenu = await dbHandler.executeQueryv2(updateMenuQuery, { 
        menu_name: req.body.menu_name,
        url: req.body.url,
        classname: req.body.classname,
        description: req.body.description,
        parent_id: req.body.parent_id ? req.body.parent_id : 0,
        status: req.body.status,
        sort_order: req.body.sort_order,
        updated_by: req.userid,
        updated_on: new Date(),
        reference_table: req.body.reference_table,
        reference_flag: req.body.reference_flag,
        id: id
    });


    let response = { output : req.body, count: 0 };
    return response;

}

async function deleteMenu(req) {

    let { parent_id } = req.body;
    let { id } = req.params;

    let checkStatusQuery = `SELECT * FROM c4_ucpcustomer_menu WHERE deleted_status=0 and id= :id`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { id: id });
    if(!checkStatus.length) throw ({ type: "custom", message: `Menu item does not exist`, status: 400 });

    let deleteMenuQuery = `update c4_ucpcustomer_menu
    set deleted_status= :deleted_status, 
    updated_by= :updated_by, updated_on= :updated_on where id= :id`;
    let deleteMenu = await dbHandler.executeQueryv2(deleteMenuQuery, { 
        deleted_status: 1,
        updated_by: req.userid,
        updated_on: new Date(),
        id: id
    });


    let response = { output : req.body, count: 0 };
    return response;

}

async function getAllProfiles(req) {

    let { set, limit } = req.query;
    let offset = '';
    let { clientid } = req;
    let clientInp = { client_id: clientid };
    let values = {...clientInp};
    
    if(set && limit){
        offset = ` limit :offset, :limit`;
        values = { ...clientInp, offset: parseInt((set - 1) * limit), limit: parseInt(limit) }
    }

    let profileListQuery = `SELECT profile_id, profile_name, profile_menu_list, vm_operations from c4_ucpprofile_templates where deleted_status=0 and status=1 and client_id = :client_id
    order by profile_name asc ${offset}`;
    let profileCountQuery = `SELECT count(profile_name) AS count from c4_ucpprofile_templates where deleted_status=0 and status=1 and client_id = :client_id`
    let profileList = await dbHandler.executeQueryv2(profileListQuery, values );
    let count = await dbHandler.executeQueryv2(profileCountQuery, clientInp );

    let response = { output : profileList, count: count.length ? count[0]['count'] : 0 };
    return response;
}

async function addProfile(req) {

    let { profile_name, parent_id } = req.body;
    let { clientid, userid } = req;
    let menuCheckPromises = []
    let vmOperationsCheckPromises = []

    let checkStatusQuery = `SELECT * FROM c4_ucpprofile_templates WHERE 
    deleted_status=0 and profile_name= :profile_name and client_id= :client_id`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { profile_name: profile_name, client_id: clientid });
    if(checkStatus.length) throw ({ type: "custom", message: `Profile already exists`, status: 400 });

    req.body.menu_list.forEach(element => {
        menuCheckPromises.push(async function(){
            let checkMenuQuery = `SELECT * FROM c4_ucpcustomer_menu WHERE deleted_status=0 and status=1 and id= :menu_id`;
            let checkMenu = await dbHandler.executeQueryv2(checkMenuQuery, { menu_id: element });
            if(!checkMenu.length) throw ({ type: "custom", message: `Menu item ${checkMenu[0]['menu_name']} does not exist`, status: 404 });

            if(checkMenu[0]['parent_id'] != 0 && !req.body.menu_list.includes(checkMenu[0]['parent_id'])) 
            throw ({ type: "custom", message: `Menu item ${checkMenu[0]['menu_name']}'s parent needs to be added too`, status: 400 });
        })
    });

    req.body.vm_operations.forEach(element => {
        vmOperationsCheckPromises.push(async function(){
            let checkVMOperationsQuery = `SELECT * FROM c4_profile_ucpvm_operations WHERE deleted_status=0 and status=1 and id= :vm_id`;
            let checkVMOperations = await dbHandler.executeQueryv2(checkVMOperationsQuery, { vm_id: element });
            if(!checkVMOperations.length) throw ({ type: "custom", message: `VM Operations item ${element} does not exist`, status: 404 });
        })
    });

    await Promise.all(menuCheckPromises.map(f=> f()));
    await Promise.all(vmOperationsCheckPromises.map(f=> f()));

    let addMenuQuery = `insert into c4_ucpprofile_templates
    (client_id, profile_name, profile_menu_list, vm_operations, status, created_on, created_by, updated_by, updated_on, deleted_status)
    values (:client_id, :profile_name, :profile_menu_list, :vm_operations, :status, :created_on, :created_by, :updated_by, :updated_on, :deleted_status)`;
    let addProfile = await dbHandler.executeQueryv2(addMenuQuery, {
        client_id: clientid,
        profile_name: req.body.profile_name,
        profile_menu_list: JSON.stringify(req.body.menu_list),
        vm_operations: JSON.stringify(req.body.vm_operations),
        status: 1,
        created_on: new Date(),
        created_by: userid,
        updated_by: userid,
        updated_on: new Date(),
        deleted_status: 0
    });

    let response = { output : req.body, count: 0 };
    return response;

}

async function updateProfile(req) {

    let { profile_name, parent_id } = req.body;
    let { id } = req.params;
    let { clientid, userid } = req;
    let menuCheckPromises = []
    let vmOperationsCheckPromises = []

    let checkProfileQuery = `SELECT * FROM c4_ucpprofile_templates WHERE deleted_status=0 and profile_id= :profile_id and client_id= :client_id`;
    let checkProfile = await dbHandler.executeQueryv2(checkProfileQuery, { profile_id: id, client_id: clientid });
    if(!checkProfile.length) throw ({ type: "custom", message: `Profile item does not exist`, status: 404 });


    req.body.menu_list.forEach(element => {
        menuCheckPromises.push(async function(){
            let checkMenuQuery = `SELECT * FROM c4_ucpcustomer_menu WHERE deleted_status=0 and status=1 and id= :menu_id`;
            let checkMenu = await dbHandler.executeQueryv2(checkMenuQuery, { menu_id: element });
            if(!checkMenu.length) throw ({ type: "custom", message: `Menu item ${element} does not exist`, status: 404 });
        
            if(checkMenu[0]['parent_id'] != 0 && !req.body.menu_list.includes(checkMenu[0]['parent_id'])) 
            throw ({ type: "custom", message: `Menu item ${checkMenu[0]['menu_name']}'s parent needs to be added too`, status: 400 });
        })
    });

    req.body.vm_operations.forEach(element => {
        vmOperationsCheckPromises.push(async function(){
            let checkVMOperationsQuery = `SELECT * FROM c4_profile_ucpvm_operations WHERE deleted_status=0 and status=1 and id= :vm_id`;
            let checkVMOperations = await dbHandler.executeQueryv2(checkVMOperationsQuery, { vm_id: element });
            if(!checkVMOperations.length) throw ({ type: "custom", message: `VM Operations item ${element} does not exist`, status: 404 });
        })
    });

    await Promise.all(menuCheckPromises.map(f=> f()));
    await Promise.all(vmOperationsCheckPromises.map(f=> f()));

    let updateMenuQuery = `update c4_ucpprofile_templates set
    profile_name= :profile_name, profile_menu_list= :profile_menu_list, vm_operations= :vm_operations, 
    status= :status, updated_by= :updated_by, updated_on= :updated_on
    where client_id= :client_id and profile_id= :profile_id`;
    let updateProfile = await dbHandler.executeQueryv2(updateMenuQuery, {
        client_id: clientid,
        profile_id: id,
        profile_name: req.body.profile_name,
        profile_menu_list: JSON.stringify(req.body.menu_list),
        vm_operations: JSON.stringify(req.body.vm_operations),
        status: 1,
        updated_by: userid,
        updated_on: new Date()
    });

    let response = { output : req.body, count: 0 };
    return response;

}

async function deleteProfile(req) {

    let { profile_name, parent_id } = req.body;
    let { id } = req.params;
    let { clientid, userid } = req;

    let checkProfileQuery = `SELECT * FROM c4_ucpprofile_templates WHERE deleted_status=0 and profile_id= :profile_id and client_id= :client_id`;
    let checkProfileMap = await dbHandler.executeQueryv2(checkProfileQuery, { profile_id: id, client_id: clientid });
    if(!checkProfileMap.length) throw ({ type: "custom", message: `Profile item does not exist`, status: 404 });

    let checkProfileMapQuery = `SELECT * FROM c4_ucpuser_profile_mapping WHERE profile_id= :profile_id`;
    let checkProfile = await dbHandler.executeQueryv2(checkProfileMapQuery, { profile_id: id });
    if(checkProfile.length) throw ({ type: "custom", message: `Profile is assigned to some user, please remove assignment & try again`, status: 400 });

    let deleteProfileQuery = `update c4_ucpprofile_templates set
    deleted_status= :deleted_status,
    updated_by= :updated_by, updated_on= :updated_on
    where client_id= :client_id and profile_id= :profile_id`;
    let deleteProfile = await dbHandler.executeQueryv2(deleteProfileQuery, {
        client_id: clientid,
        profile_id: id,
        deleted_status: 1,
        updated_by: userid,
        updated_on: new Date()
    });

    let response = { output : req.body, count: 0 };
    return response;

}


async function addUserProfile(req) {

    let { profile_id, user_id } = req.body;
    let { clientid, userid } = req;

    let checkProfileQuery = `SELECT * FROM c4_ucpprofile_templates WHERE deleted_status=0 and profile_id= :profile_id and client_id= :client_id`;
    let checkProfile = await dbHandler.executeQueryv2(checkProfileQuery, { profile_id: profile_id, client_id: clientid });
    if(!checkProfile.length) throw ({ type: "custom", message: `Profile item does not exist`, status: 404 });

    let checkUserQuery = `SELECT * FROM c4_client_users WHERE id= :user_id`;
    let checkUser = await dbHandler.executeQueryv2(checkUserQuery, { user_id: user_id });
    if(!checkUser.length) throw ({ type: "custom", message: `User does not exist`, status: 404 });

    let checkUserProfileQuery = `SELECT * FROM c4_ucpuser_profile_mapping WHERE status=1 and user_id= :user_id`;
    let checkUserProfile = await dbHandler.executeQueryv2(checkUserProfileQuery, { user_id: user_id });
    if(checkUserProfile.length) throw ({ type: "custom", message: `User profile already exists`, status: 409 });

    let addUserProfileQuery = `insert into c4_ucpuser_profile_mapping
    (profile_id, user_id, created_on, updated_on, created_by, updated_by)
    values (:profile_id, :user_id, :created_on, :updated_on, :created_by, :updated_by)`;
    let addUserProfile = await dbHandler.executeQueryv2(addUserProfileQuery, {
        profile_id: profile_id,
        user_id: user_id,
        status: 1,
        created_on: new Date(),
        created_by: userid,
        updated_by: userid,
        updated_on: new Date()
    });

    let response = { output : req.body, count: 0 };
    return response;

}

async function updateUserProfile(req) {

    let { profile_id, user_id } = req.body;
    let { clientid, userid } = req;

    let checkProfileQuery = `SELECT * FROM c4_ucpprofile_templates WHERE deleted_status=0 and profile_id= :profile_id and client_id= :client_id`;
    let checkProfile = await dbHandler.executeQueryv2(checkProfileQuery, { profile_id: profile_id, client_id: clientid });
    if(!checkProfile.length) throw ({ type: "custom", message: `Profile item does not exist`, status: 404 });

    let checkUserQuery = `SELECT * FROM c4_client_users WHERE id= :user_id`;
    let checkUser = await dbHandler.executeQueryv2(checkUserQuery, { user_id: user_id });
    if(!checkUser.length) throw ({ type: "custom", message: `User does not exist`, status: 404 });

    let checkUserProfileQuery = `SELECT * FROM c4_ucpuser_profile_mapping WHERE status=1 and user_id= :user_id`;
    let checkUserProfile = await dbHandler.executeQueryv2(checkUserProfileQuery, { user_id: user_id });
    if(checkUserProfile.length){
        let updateUserProfileQuery = `update c4_ucpuser_profile_mapping set
        profile_id= :profile_id, updated_on= :updated_on, updated_by= :updated_by
        where user_id= :user_id`;
        let updateUserProfile = await dbHandler.executeQueryv2(updateUserProfileQuery, {
            profile_id: profile_id,
            user_id: user_id,
            status: 1,
            updated_by: userid,
            updated_on: new Date()
        });
    }
    else{
        let addUserProfileQuery = `insert into c4_ucpuser_profile_mapping
        (profile_id, user_id, created_on, updated_on, created_by, updated_by)
        values (:profile_id, :user_id, :created_on, :updated_on, :created_by, :updated_by)`;
        let addUserProfile = await dbHandler.executeQueryv2(addUserProfileQuery, {
            profile_id: profile_id,
            user_id: user_id,
            status: 1,
            created_on: new Date(),
            created_by: userid,
            updated_by: userid,
            updated_on: new Date()
        });
    }

    let response = { output : req.body, count: 0 };
    return response;

}


async function deleteUserProfile(req) {

    let { userid } = req;

    let checkUserQuery = `SELECT * FROM c4_client_users WHERE id= :user_id`;
    let checkUser = await dbHandler.executeQueryv2(checkUserQuery, { user_id: userid });
    if(!checkUser.length) throw ({ type: "custom", message: `User does not exist`, status: 404 });

    let checkUserProfileQuery = `SELECT * FROM c4_ucpuser_profile_mapping WHERE status=1 and user_id= :user_id`;
    let checkUserProfile = await dbHandler.executeQueryv2(checkUserProfileQuery, { user_id: userid });
    if(!checkUserProfile.length) throw ({ type: "custom", message: `User profile does not exist`, status: 404 });

    let deleteUserProfileQuery = `delete from c4_ucpuser_profile_mapping
    where user_id= :user_id`;
    let deleteUserProfile = await dbHandler.executeQueryv2(deleteUserProfileQuery, {
        user_id: userid
    });

    let response = { output : req.body, count: 0 };
    return response;

}

async function getProfileMenu(req) {

    let { id } = req.params;
    let { clientid } = req;
    let finaloutput = {}

    let checkProfileQuery = `SELECT * FROM c4_ucpprofile_templates WHERE deleted_status=0 and profile_id= :profile_id and client_id= :client_id`;
    let checkProfile = await dbHandler.executeQueryv2(checkProfileQuery, { profile_id: id, client_id: clientid });
    if(!checkProfile.length) throw ({ type: "custom", message: `Profile does not exist`, status: 404 });

    let getMenuQuery = `SELECT * FROM c4_ucpcustomer_menu WHERE deleted_status=0 and status=1 and id in (:id)`;
    let getMenu = await dbHandler.executeQueryv2(getMenuQuery, { 
        id: JSON.parse(checkProfile[0]['profile_menu_list'])
    });

    finaloutput['profile_id'] = checkProfile[0]['profile_id'];
    finaloutput['profile_name'] = checkProfile[0]['profile_name'];
    finaloutput['profile_menu_list'] = getMenu;

    let getVMOperationsQuery = `SELECT * FROM c4_profile_ucpvm_operations WHERE deleted_status=0 and status=1 and id in (:id)`;
    let getVMOperations = await dbHandler.executeQueryv2(getVMOperationsQuery, { 
        id: JSON.parse(checkProfile[0]['vm_operations'])
    });
    finaloutput['vm_operations'] = getVMOperations;

    let response = { output : finaloutput, count: 0 };
    return response;

}

async function getUserProfile(req) {

    let { id } = req.params;
    let { clientid, userid } = req;
    let finaloutput = {}
    let getMenu;
    let menuToUse = [];

    let getUserQuery = `SELECT * FROM c4_client_users WHERE id= :user_id`;
    let getUser = await dbHandler.executeQueryv2(getUserQuery, { user_id: userid });

    let getClientQuery = `SELECT * FROM c4_clients WHERE id= :client_id`;
    let getClient = await dbHandler.executeQueryv2(getClientQuery, { client_id: clientid });

    let getProfileQuery = `SELECT * FROM c4_ucpuser_profile_mapping WHERE user_id= :user_id`;
    let getProfile = await dbHandler.executeQueryv2(getProfileQuery, { user_id: userid });
    if(!getProfile.length) throw ({ type: "custom", message: `Profile not present against this user`, status: 404 });

    let getProfileDetailsQuery = `SELECT * FROM c4_ucpprofile_templates WHERE profile_id= :profile_id`;
    let getProfileDetails = await dbHandler.executeQueryv2(getProfileDetailsQuery, { profile_id: getProfile[0]['profile_id'] });

    if(getUser[0]['user_role'] == 1){

        let getMenuQuery = `SELECT * FROM c4_ucpcustomer_menu WHERE deleted_status=0 and status=1 ORDER BY parent_id, sort_order`;
        getMenu = await dbHandler.executeQueryv2(getMenuQuery, { }); 
    }
    else{
        let getMenuQuery = `SELECT * FROM c4_ucpcustomer_menu WHERE deleted_status=0 and status=1 and id in (:id) ORDER BY parent_id, sort_order`;
        getMenu = await dbHandler.executeQueryv2(getMenuQuery, { 
            id: JSON.parse(getProfileDetails[0]['profile_menu_list'])
        });
    }

    //code for removing non-allowed menus based on each client flags
    getMenu.forEach(element => {
        if((!element['reference_flag']) ||
        (element['reference_flag'].includes('is_aws_enabled') && getClient[0]['is_aws_enabled'] == 1) ||
        (element['reference_flag'].includes('is_msdevops_enabled') && getClient[0]['is_msdevops_enabled'] == 1) ||
        (element['reference_flag'].includes('is_gcp_enabled') && getClient[0]['is_gcp_enabled'] == 1) || 
        (element['reference_flag'].includes('azure_linked') && getClient[0]['azure_linked'] == 1)){
            menuToUse.push(element);
        }
    });

    finaloutput['profile_id'] = getProfile[0]['profile_id'];
    finaloutput['profile_name'] = getProfile[0]['profile_name'];
    finaloutput['profile_menu_list'] = menuToUse;

    finaloutput['vm_operations'] = [];

    if(JSON.parse(getProfileDetails[0]['vm_operations']).length){
        let getVMOperationsQuery = `SELECT * FROM c4_profile_ucpvm_operations WHERE deleted_status=0 and status=1 and id in (:id)`;
        let getVMOperations = await dbHandler.executeQueryv2(getVMOperationsQuery, { 
            id: JSON.parse(getProfileDetails[0]['vm_operations'])
        });
        finaloutput['vm_operations'] = getVMOperations;
    }

    let response = { output : finaloutput, count: 0 };
    return response;

}

async function getAllVMOperations(req) {
    let vmOperationsListQuery = `SELECT * from c4_profile_ucpvm_operations where deleted_status=0 and status=1 
    order by vm_action_name asc`;
    let vmOperationsList = await dbHandler.executeQueryv2(vmOperationsListQuery, { });

    let response = { output : vmOperationsList, count: 0 };
    return response;
}

async function saveVMOperation(req) {

    let { event, parent_id } = req.body;
    let { clientid, userid } = req;

    let checkStatusQuery = `SELECT * FROM c4_profile_ucpvm_operations WHERE deleted_status=0 and event= :event`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { event: event });
    if(checkStatus.length) throw ({ type: "custom", message: `VM Operations item already exists`, status: 404 });

    let addMenuQuery = `insert into c4_profile_ucpvm_operations
    (vm_action_name, event, description, status, created_on, created_by, updated_by, updated_on, deleted_status)
    values (:vm_action_name, :event, :description, :status, :created_on, :created_by, :updated_by, :updated_on, :deleted_status)`;
    let addVMOperation = await dbHandler.executeQueryv2(addMenuQuery, { 
        vm_action_name: req.body.vm_action_name,
        event: req.body.event,
        description: req.body.description,
        status: 1,
        created_on: new Date(),
        created_by: userid,
        updated_by: userid,
        updated_on: new Date(),
        deleted_status: 0
    });

    let response = { output : req.body, count: 0 };
    return response;

}

async function updateVMOperation(req) {

    let { parent_id } = req.body;
    let { id } = req.params;

    let checkStatusQuery = `SELECT * FROM c4_profile_ucpvm_operations WHERE deleted_status=0 and id= :id`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { id: id });
    if(!checkStatus.length) throw ({ type: "custom", message: `VM Operation item does not exist`, status: 404 });

    let updateMenuQuery = `update c4_profile_ucpvm_operations
    set vm_action_name= :vm_action_name, event= :event, description= :description, 
    status= :status, updated_by= :updated_by, updated_on= :updated_on where id= :id`;
    let updateVMOperation = await dbHandler.executeQueryv2(updateMenuQuery, { 
        vm_action_name: req.body.vm_action_name,
        event: req.body.event,
        description: req.body.description,
        status: req.body.status,
        updated_by: req.userid,
        updated_on: new Date(),
        id: id
    });


    let response = { output : req.body, count: 0 };
    return response;

}

async function deleteVMOperation(req) {

    let { parent_id } = req.body;
    let { id } = req.params;

    let checkStatusQuery = `SELECT * FROM c4_profile_ucpvm_operations WHERE deleted_status=0 and id= :id`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { id: id });
    if(!checkStatus.length) throw ({ type: "custom", message: `VM Operation item does not exist`, status: 400 });

    let deleteVMOperationQuery = `update c4_profile_ucpvm_operations
    set deleted_status= :deleted_status,
    updated_by= :updated_by, updated_on= :updated_on where id= :id`;
    let deleteVMOperation = await dbHandler.executeQueryv2(deleteVMOperationQuery, { 
        deleted_status: 1,
        updated_by: req.userid,
        updated_on: new Date(),
        id: id
    });

    let response = { output : req.body, count: 0 };
    return response;

}

function saveUserProfile(reqObj,callback) {
    let formData = reqObj.body;
    let datetime = dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss");
    if(!formData.client_id) return callback(1,"Please provide the client id.");
    if(!formData.profile_name) return callback(1,"Please provide the profile name.");
    if(!formData.profile_menu_list) return callback(1,"Please provide the profile_menu_list.");
    if(!formData.vm_operations) return callback(1,"Please provide the vm_operations.");
    if(!formData.dashboard_permissions) return callback(1,"Please provide the dashboard_permissions.");
    if(!formData.status) return callback(1,"Please provide the status.");
    if(!formData.is_admin_profile) return callback(1,"Please provide the is_admin_profile.");
    var values = {
        client_id: formData.client_id,
        profile_name: formData.profile_name,
        profile_menu_list: formData.profile_menu_list,
        vm_operations: formData.vm_operations,
        dashboard_permissions:formData.dashboard_permissions,
        status: formData.status,
        is_admin_profile:formData.is_admin_profile
      };

    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM c4_ucpprofile_templates WHERE profile_name='"+formData.profile_name+"' "+((typeof formData.profile_id == "undefined" || formData.profile_id == 0)?"":" and profile_id <> "+formData.profile_id),(error, rows, fields) => {
            if (error) {
                dbFunc.connectionRelease;
                return callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                //resolve(error);
            } else if (rows.length > 0) {
                dbFunc.connectionRelease;
                return callback(1,"Profile already exist ! try with different Profile.");
                //resolve(rows);
            } else {
                dbFunc.connectionRelease;
                if(typeof formData.profile_id == "undefined" || formData.profile_id == 0){
                    values.created_on = datetime;
                    values.created_by = formData.user_id;
                    db.query("INSERT INTO c4_ucpprofile_templates SET ?", values ,(error,orderRows,fields)=>{
                        dbFunc.connectionRelease;
                        if(error) {
                            return callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                            //resolve(error);
                        } else {
                            return callback(null,{"success": 1,"message":"Profile Added Successfully.",data:orderRows});
                        }
                    });
                }else{
                    values.updated_on = datetime;
                    values.updated_by = formData.user_id;
                    dbHandler.updateTableData('c4_ucpprofile_templates',{profile_id:formData.profile_id},values,async function(error,result){
                        if(error) {
                            return callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                            //resolve(error);
                        } else {
                            return callback(null,{"success": 1,"message":"Profile Updated Successfully."});
                        }
                    });
                }
            }
        });
    });
}

 function userProfileMapping(reqObj,callback) {
    let formData = reqObj.body;
    let datetime = dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss");
    if(!formData.profile_id) return callback(1,"Please provide the profile id.");
    if(!formData.user_id) return callback(1,"Please provide the user id.");
    if(!formData.status) return callback(1,"Please provide the user status.");
    var menuValues = {
        profile_id: formData.profile_id,
        user_id: formData.user_id,
        status: formData.status
    };
    return new Promise((resolve,reject) => {
        db.query(`SELECT * FROM c4_ucpuser_profile_mapping WHERE profile_id=${formData.profile_id} and user_id=${formData.user_id}`,(error, rows, fields) => {
            if (error) {
                dbFunc.connectionRelease;
                return callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                //resolve(error);
            } else if (rows.length > 0) {
                dbFunc.connectionRelease;
                return callback(1,"Menu already exist ! try with different Menu.");
                //resolve(rows);
            } else {
                dbFunc.connectionRelease;
                if(typeof formData.id == "undefined" || formData.id == 0){
                    menuValues.created_on = datetime;
                    menuValues.created_by = formData.user_id;
                    db.query("INSERT INTO c4_ucpuser_profile_mapping SET ?", menuValues ,(error,orderRows,fields)=>{
                        dbFunc.connectionRelease;
                        if(error) {
                            return callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                            //resolve(error);
                        } else {
                            return callback(null,{"message":"Profile has been added successfully."});
                        }
                    });
                }else{
                    menuValues.updated_on = datetime;
                    menuValues.updated_by = formData.user_id;
                    dbHandler.updateTableData('c4_ucpuser_profile_mapping',{id:formData.id},menuValues,function(error,result){
                        if(error) {
                            return callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                            //resolve(error);
                        } else {
                            return callback(null,{"message":"Profile mapping has been updated successfully."});
                        }
                    });
                }
            }
        })
    })
}
module.exports = menusModel;

