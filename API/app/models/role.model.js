var db = require("../../config/database");
var dbFunc = require("../../config/db-function");
var config = require("../../config/constants");
const dbHandler= require('../../config/api_db_handler');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');
const { promises } = require("nodemailer/lib/xoauth2");
var jenkinsModel = require("../models/jenkins.model.js");

/**
 * Get the list of all roles
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let getAllRole = async (reqObj,callback)=>{
    record_status = reqObj.record_status;
    role_name = reqObj.role_name;
    role_id = reqObj.role_id;
    is_role = reqObj.is_role;
    return new Promise(async function(resolve,reject) {
        let sql = `SELECT c.*
        FROM roles as c
        WHERE is_deleted=0 AND id !=1`;
        if(typeof(record_status) !='undefined' && record_status !=''){
        	sql +=` and c.record_status = '${record_status}'`;
        }
        if(typeof(role_name) !='undefined' && role_name !=''){
        	sql +=` and c.name = '${role_name}'`;
        }
        if(typeof(role_id) !='undefined' && role_id !=''){
        	sql +=` and c.id = '${role_id}'`;
        }
        if(typeof(is_role) !='undefined' && is_role !=''){
        	sql +=` and c.is_role = '${is_role}'`;
        }
        sql +=` order by c.name asc`;
        db.query(sql,async function(error,items,fields){
        	dbFunc.connectionRelease;
            if(!!error) {
                callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                if(items.length == 0) {
                    callback(1,{status:"error",message:"No data found."});
                    resolve(error);
                } else {
                    callback(null,{status:"success",message:"Roles List.",data:items});
                    resolve(items);
                }
            }
       });
    });
}

/**
 * Get the list of all roles
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
 let listRoleAssigned = async (reqObj,callback)=>{
    record_status = reqObj.record_status;
    role_name = reqObj.role_name;
    role_id = reqObj.role_id;
    is_role = reqObj.is_role;
    isSuperAdmin = reqObj.isSuperAdmin;
    console.log('reqObj=======',reqObj)
    return new Promise(async function(resolve,reject) {
        let sql = `SELECT c.*
        FROM roles as c
        WHERE is_deleted=0 AND id !=1`;
        if(typeof(record_status) !='undefined' && record_status !=''){
        	sql +=` and c.record_status = '${record_status}'`;
        }
        if(typeof(role_name) !='undefined' && role_name !=''){
        	sql +=` and c.name = '${role_name}'`;
        }
        if(typeof(role_id) !='undefined' && role_id !=''){
        	sql +=` and c.id = '${role_id}'`;
        }
        // if(typeof(is_role) !='undefined' && isSuperAdmin == '1'){           
        //     sql +=` and c.is_role != '1'`;
        // } else{
        //     if(typeof(is_role) !='undefined' && is_role !=''){
        //         sql +=` and c.is_role = '${is_role}'`;
        //     }
        // }
        
        sql +=` order by c.name asc`;
        console.log('===========',sql);
        db.query(sql,async function(error,items,fields){
        	dbFunc.connectionRelease;
            if(!!error) {
                callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                if(items.length == 0) {
                    callback(1,{status:"error",message:"No data found."});
                    resolve(error);
                } else {
                    callback(null,{status:"success",message:"Roles List.",data:items});
                    resolve(items);
                }
            }
       });
    });
}

/**
 * Create a new role
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let saveRole = async (reqObj,callback)=>{
	let formData = reqObj;
    let cts = (new Date().getTime() / 1000);
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user_id."});
    if(!formData.role_name) return callback(1,{status:"error",message:"Please provide the role_name."});
    if(!formData.assign_permissions || formData.assign_permissions.length == 0) return callback(1,{status:"error",message:"Please provide the assign_permissions."});
    if(typeof formData.record_status == 'undefined') return callback(1,{status:"error",message:"Please provide the record_status."});
    
    let report_id = 0;
    if(typeof formData.report_id !='undefined' && formData.report_id !='' && formData.report_id != 0){
        report_id = formData.report_id;
    }

    var saveValues = {
		name: formData.role_name,
        report_id: report_id,
        record_status: formData.record_status,
      };
    
    return new Promise((resolve,reject) => {
    	let sql = `SELECT * FROM roles 
    	WHERE name='${formData.role_name}' and is_deleted=0`;
    	if(typeof formData.id !='undefined' && formData.id !='' && formData.id != 0){
    		sql +=` and id <> '${formData.id}'`;
    	}
        db.query(sql,async function(error, rows, fields) {
        	dbFunc.connectionRelease;
            if (error) { 
                console.log(error);
                return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                //resolve(error);
            } else if (rows.length > 0) {
                return callback(1,{status:"error",message:"Role Name already exist ! try with different Role Name."});
                //resolve(rows);
            } else {
                if(typeof formData.id !='undefined' && formData.id !='' && formData.id != 0){

                    let delete_old_users_query = 'delete from role_permission where role_id = :id';
                    let delete_old_user = await dbHandler.executeQueryv2(delete_old_users_query, { id: formData.id } );

                    saveValues.updated_date = cts;
                	saveValues.updated_by = formData.user_id;
                    dbHandler.updateTableData('roles',{id:formData.id},saveValues,async function(error,result){
                        if(error) {
                            return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                        } else {
                            let sql = `insert into role_permission(role_id, module_id,read_permission,write_permission,delete_permission, created_date, created_by) values 
                            (:role_id, :module_id, :read_permission, :write_permission, :delete_permission, :created_date, :created_by)`;

                        for(let assign_permission of formData.assign_permissions){
                            let new_element = {};
                            new_element.role_id = formData.id; 
                            new_element.module_id = assign_permission.module_id; 
                            new_element.read_permission = assign_permission.read_permission; 
                            new_element.write_permission = assign_permission.write_permission; 
                            new_element.delete_permission = assign_permission.delete_permission; 
                            new_element.created_date = cts;
                            new_element.created_by = formData.user_id;
                            await dbHandler.executeQueryv2(sql, new_element );
                        }
                    	    
                            return callback(null,{status:"success",message:"User permission updated successfully.",id:formData.id});
                        }
                    });
                }else{
                    saveValues.created_date = cts;
                	saveValues.created_by = formData.user_id;
                    db.query("INSERT INTO roles SET ?", saveValues ,async (error,orderRows,fields)=>{
                    	dbFunc.connectionRelease;
                        if(error) {
                            return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                        } else {
                        	let sql = `insert into role_permission(role_id, module_id,read_permission,write_permission,delete_permission, created_date, created_by) values 
                        	    (:role_id, :module_id, :read_permission, :write_permission, :delete_permission, :created_date, :created_by)`;

                    	    for(let assign_permission of formData.assign_permissions){
                    	        let new_element = {};
                    	        new_element.role_id = orderRows.insertId; 
                    	        new_element.module_id = assign_permission.module_id; 
                                new_element.read_permission = assign_permission.read_permission; 
                                new_element.write_permission = assign_permission.write_permission; 
                                new_element.delete_permission = assign_permission.delete_permission; 
                    	        new_element.created_date = cts;
                    	        new_element.created_by = formData.user_id;
                    	        await dbHandler.executeQueryv2(sql, new_element );
                    	    }
                    	    
                            return callback(null,{status:"success","message":"Role permissions added successfully.",id:orderRows.insertId});
                        }
                    });
                }
            }
        });
    });
}

/**
 * Delete the roles from database
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let deleteRole = async (reqObj,callback)=>{
	let formData = reqObj; 
    let cts = (new Date().getTime() / 1000);
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user ID."});
    if(!formData.role_id) return callback(1,{status:"error",message:"Please provide the role ID."});
    var saveValues = {
		is_deleted: 1,
        deleted_date: cts,
        deleted_by: formData.user_id,
      };
    return new Promise((resolve,reject) => {
    	let sql = `SELECT * FROM roles 
    	WHERE id='${formData.role_id}'`;

        db.query(sql,async function(error, rows, fields) {
        	dbFunc.connectionRelease;
            if (error) { 
                console.log(error);
                return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                //resolve(error);
            } else if (rows.length > 0) {
                //return callback(1,{status:"error",message:"Role Name already exist ! try with different Role Name."});
                //resolve(rows);
                let sql2 = `SELECT * FROM user_role 
                WHERE role_id='${formData.role_id}' AND is_deleted = 0`;
                db.query(sql2,async function(error2, rows2, fields) {
                    dbFunc.connectionRelease;
                    if (error2) { 
                        console.log(error2);
                        return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                        //resolve(error);
                    } else if (rows2.length > 0) {
                        //return callback(1,{status:"error",message:"Role Name already exist ! try with different Role Name."});
                        //resolve(rows);
                        return callback(1,{status:"error",message:"Role can't be delete. Role is already assigned to another user"});
                    } else {
                        dbHandler.updateTableData('roles',{id:formData.role_id},saveValues,async function(error,result){
                            if(error) {
                                return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                            } else {
                                return callback(null,{status:"success",message:"Roles deleted successfully.",id:formData.d});
                            }
                        });
                    }
                });  
            } else {
                return callback(1,{status:"error",message:"Role ID does not exist."});
            }
        });  
    });
}
/**
 * Get all the user assigned in a role
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let getUserRoleList = async (reqObj,callback)=>{
    record_status = reqObj.record_status;
    role_id = reqObj.role_id;
    // id = reqObj.id;
    return new Promise(async function(resolve,reject) {
        let sql = `SELECT ar.id,ar.role_id,ar.user_id,
        r.name as role_name,ar.record_status FROM user_role ar 
        inner join roles r on r.id = ar.role_id 
        WHERE r.is_deleted = 0 and ar.is_deleted=0 
        `;
        if(typeof(record_status) !='undefined' && record_status !=''){
        	sql +=` and ar.record_status = '${record_status}' and r.record_status = '${record_status}'`;
        }
        if(typeof(role_id) !='undefined' && role_id !=''){
        	sql +=` and ar.id = '${role_id}'`;
        }
        sql +=` group by ar.role_id order by ar.id desc `;
        db.query(sql,async function(error,items,fields){
        	dbFunc.connectionRelease;
            if(!!error) {
                callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                if(items.length == 0) {
                    callback(1,{status:"error",message:"No data found."});
                    resolve(error);
                } else {
                	i= 0;
                	for await (const item of items) {
                		items[i].user_assignd = [];
	            		items[i].mapped_user_assignd_ids = [];
                		await new Promise(async function(innerResolve,innerReject) {
                	        let inner_sql = `SELECT u.id, u.email as user_email FROM user_role ar 
                            inner join c4_client_users u on u.id = ar.user_id 
                            WHERE ar.is_deleted=0 and ar.role_id = ${item.role_id}`;
                	        await db.query(inner_sql,async function(error,inerItems,innerFields){
                	        	dbFunc.connectionRelease;
                	            if(!!error) {
                	                console.log(error);
                	                innerResolve(error);
                	            } else {
                	            	items[i].user_assignd = inerItems;
                	            	
                	            	let user_p_ids = [];
    	    		                for await (const inerItem of inerItems) {
    	    		                	user_p_ids.push(inerItem.id);
    	    		                }
    	    		                
    	    		                items[i].mapped_user_assignd_ids = user_p_ids;
                	            	innerResolve([]);
                	            }
                	        });
                		});
                		i++;
                	}
                    callback(null,{status:"success",message:"User Roles List.",data:items});
                    resolve(items);
                }
            }
       });
    });
}
/**
 * Assign a user to a role
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let saveUserRole = async (reqObj,callback)=>{
	let formData = reqObj;
    let cts = (new Date().getTime() / 1000); 
    if(!formData.role_id) return callback(1,{status:"error",message:"Please provide the role_id."});
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user_id."});
    if(!formData.assign_roles || formData.assign_roles.length == 0) return callback(1,{status:"error",message:"Please provide the assign_roles."});
    if(typeof formData.record_status == 'undefined') return callback(1,{status:"error",message:"Please provide the record_status."});
    
    // var saveValues = {
    //     user_id: formData.resource_user_id,
	// 	role_id: formData.role_id,
    //     subscription_id: formData.subscription_id,
    //     record_status: formData.record_status,
    //   };

     return new Promise(async function(resolve,reject) {
    	if(typeof formData.id !='undefined' && formData.id !='' && formData.id != 0){

            let delete_old_users_query = 'DELETE FROM user_role WHERE role_id = :id';
            let delete_old_user = await dbHandler.executeQueryv2(delete_old_users_query, { id: formData.id } );

            let sql = `insert into user_role(user_id, role_id,record_status, created_date, created_by) values 
                    (:user_id, :role_id, :record_status, :created_date, :created_by)`;
                    for(let assign_role of formData.assign_roles){
                        let new_element = {};
                        new_element.user_id = assign_role.client_user_id; 
                        new_element.role_id = formData.role_id; 
                        new_element.record_status = formData.record_status;
                        new_element.created_date = cts;
                        new_element.created_by = formData.user_id;
                        await dbHandler.executeQueryv2(sql, new_element );
                    }
                    
                    return callback(null,{status:"success","message":"Assigned User Update Successfully."});
        }else{
           
            let sql = `SELECT * FROM user_role 
            WHERE is_deleted=0 and role_id='${formData.role_id}'`;
            db.query(sql,async function(error, rows, fields) {
                dbFunc.connectionRelease;
                if (error) { 
                    console.log(error);
                    return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                    //resolve(error);
                } else if (rows.length > 0) {
                    return callback(1,{status:"error",message:"Role is already mapped. Try with different role name."});
                    //resolve(rows);
                } else {
                    let sql = `insert into user_role(user_id, role_id,record_status, created_date, created_by) values 
                    (:user_id, :role_id, :record_status, :created_date, :created_by)`;
                    for(let assign_role of formData.assign_roles){
                        let new_element = {};
                        new_element.user_id = assign_role.client_user_id; 
                        new_element.role_id = formData.role_id; 
                        new_element.record_status = formData.record_status;
                        new_element.created_date = cts;
                        new_element.created_by = formData.user_id;
                        await dbHandler.executeQueryv2(sql, new_element );
                    }
                    
                    return callback(null,{status:"success","message":"User assigned successfully."});
                }
                
            });
               
        }
    });
}

/**
 * Create READ, WRITE, DELETE permission on role
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let saveRolePermission = async (reqObj,callback)=>{
	let formData = reqObj;
    let cts = (new Date().getTime() / 1000);
    if(!formData.role_id) return callback(1,{status:"error",message:"Please provide the role_id."});
    if(!formData.read_permission) return callback(1,{status:"error",message:"Please provide the read_permission."});
    if(!formData.write_permission) return callback(1,{status:"error",message:"Please provide the write_permission."});
    if(!formData.delete_permission) return callback(1,{status:"error",message:"Please provide the delete_permission."});
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user_id."});
    if(typeof formData.record_status == 'undefined') return callback(1,{status:"error",message:"Please provide the record_status."});
    
    var saveValues = {
		role_id: formData.role_id,
        record_status: formData.record_status,
        read_permission: formData.read_permission,
        write_permission: formData.write_permission,
        delete_permission: formData.delete_permission,
      };
    
    return new Promise((resolve,reject) => {
                if(typeof formData.id !='undefined' && formData.id !='' && formData.id != 0){
                	saveValues.updated_date = cts;
                	saveValues.updated_by = formData.user_id;
                    dbHandler.updateTableData('role_permission',{id:formData.id},saveValues,async function(error,result){
                        if(error) {
                            return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                        } else {
                            return callback(null,{status:"success",message:"Role permission updated successfully.",id:formData.d});
                        }
                    });
                }else{
                	saveValues.created_date = cts;
                	saveValues.created_by = formData.user_id;
                    db.query("INSERT INTO role_permission SET ?", saveValues ,(error,orderRows,fields)=>{
                    	dbFunc.connectionRelease;
                        if(error) {
                            return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                        } else {
                            return callback(null,{status:"success","message":"Role permission added successfully.",id:orderRows.insertId});
                        }
                    }); 
                }
    });
}

/**
 * Assign/unassigned a user from the role 
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let updateUserRole = async (reqObj,callback)=>{
	let formData = reqObj; 
    let cts = (new Date().getTime() / 1000);
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user_id."});
    if(!formData.role_id) return callback(1,{status:"error",message:"Please provide the role_id."});
    if(!formData.id) return callback(1,{status:"error",message:"Please provide the id."});
    var saveValues = {
		role_id: formData.role_id,
        deleted_date: cts,
        deleted_by: formData.user_id,
      };
    return new Promise((resolve,reject) => {
    	let sql = `SELECT * FROM user_role 
    	WHERE id='${formData.id}'`;
        db.query(sql,async function(error, rows, fields) {
        	dbFunc.connectionRelease;
            if (error) { 
                console.log(error);
                return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                //resolve(error);
            } else if (rows.length > 0) {
                //return callback(1,{status:"error",message:"Role Name already exist ! try with different Role Name."});
                //resolve(rows);
                dbHandler.updateTableData('user_role',{id:formData.id},saveValues,async function(error,result){
                    if(error) {
                        return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                    } else {
                        return callback(null,{status:"success",message:"Assigned User updated successfully.",id:formData.d});
                    }
                });
            } else {
                return callback(1,{status:"error",message:"Assigned User id does not exist."});
            }
        });  
    });
}

/**
 * Remove the user from the role
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let deleteUserRole = async (reqObj,callback)=>{
	let formData = reqObj; 
    let cts = (new Date().getTime() / 1000);
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user ID."});
    if(!formData.user_role_id) return callback(1,{status:"error",message:"Please provide the user role ID."});
    var saveValues = {
		is_deleted: 1,
        deleted_date: cts,
        deleted_by: formData.user_id,
      };
    return new Promise((resolve,reject) => {
    	let sql = `SELECT * FROM user_role 
    	WHERE role_id='${formData.user_role_id}'`;

        db.query(sql,async function(error, rows, fields) {
        	dbFunc.connectionRelease;
            if (error) { 
                console.log(error);
                return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                //resolve(error);
            } else if (rows.length > 0) {
                //return callback(1,{status:"error",message:"Role Name already exist ! try with different Role Name."});
                //resolve(rows);
                dbHandler.updateTableData('user_role',{role_id:formData.user_role_id},saveValues,async function(error,result){
                    if(error) {
                        return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                    } else {
                        return callback(null,{status:"success",message:"Assigned user deleted successfully.",id:formData.d});
                    }
                });
            } else {
                return callback(1,{status:"error",message:"Assigned user ID does not exist."});
            }
        });  
    });
}

/**
 * Remove the READ, WRITE, DELETE permission from the role
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let deleteRolePermission = async (reqObj,callback)=>{
	let formData = reqObj; 
    let cts = (new Date().getTime() / 1000);
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user."});
    if(!formData.user_permission_id) return callback(1,{status:"error",message:"Please provide the user permission."});
    var saveValues = {
		is_deleted: 1,
        deleted_date: cts,
        deleted_by: formData.user_id,
      };
    return new Promise((resolve,reject) => {
    	let sql = `SELECT * FROM role_permission 
    	WHERE id='${formData.user_permission_id}'`;

        db.query(sql,async function(error, rows, fields) {
        	dbFunc.connectionRelease;
            if (error) { 
                console.log(error);
                return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                //resolve(error);
            } else if (rows.length > 0) {
                //return callback(1,{status:"error",message:"Role Name already exist ! try with different Role Name."});
                //resolve(rows);
                dbHandler.updateTableData('role_permission',{id:formData.user_permission_id},saveValues,async function(error,result){
                    if(error) {
                        return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                    } else {
                        return callback(null,{status:"success",message:"Role Permission deleted successfully.",id:formData.d});
                    }
                });
            } else {
                return callback(1,{status:"error",message:"Role Permission id does not exist."});
            }
        });  
    });
}

/**
 * Get the list of all the modules
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let getAllModule = async (reqObj,callback)=>{
    record_status = reqObj.record_status;
    id = reqObj.id;
    return new Promise(async function(resolve,reject) {
        let sql = `SELECT c.*
        FROM modules as c
        WHERE is_deleted=0`;
        if(typeof(record_status) !='undefined' && record_status !=''){
        	sql +=` AND c.record_status = '${record_status}'`;
        }
        if(typeof(id) !='undefined' && id !=''){
        	sql +=` AND c.id = '${id}'`;
        }
        sql +=` ORDER BY c.sort_order ASC`;
        db.query(sql,async function(error,items,fields){
        	dbFunc.connectionRelease;
            if(!!error) {
                callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                if(items.length == 0) {
                    callback(1,{status:"error",message:"No data found."});
                    resolve(error);
                } else {
                    callback(null,{status:"success",message:"Module List.",data:items});
                    resolve(items);
                }
            }
       });
    });
}

/**
 * Save the module in database
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let saveModule = async (reqObj,callback)=>{
	let formData = reqObj;
    let cts = (new Date().getTime() / 1000);
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user_id."});
    if(!formData.module_name) return callback(1,{status:"error",message:"Please provide the module name."});
    //if(!formData.report_id) return callback(1,{status:"error",message:"Please provide the report_id."});
    if(typeof formData.record_status == 'undefined') return callback(1,{status:"error",message:"Please provide the record status."});
    
    var saveValues = {
		name: formData.module_name,
        record_status: formData.record_status,
      };
    
    return new Promise((resolve,reject) => {
    	let sql = `SELECT * FROM modules 
    	WHERE name='${formData.module_name}'`;
    	if(typeof formData.id !='undefined' && formData.id !='' && formData.id != 0){
    		sql +=` and id <> '${formData.id}'`;
    	}
        db.query(sql,async function(error, rows, fields) {
        	dbFunc.connectionRelease;
            if (error) { 
                console.log(error);
                return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                //resolve(error);
            } else if (rows.length > 0) {
                return callback(1,{status:"error",message:"Modules name already exist ! try with different role name."});
                //resolve(rows);
            } else {
                if(typeof formData.id !='undefined' && formData.id !='' && formData.id != 0){
                	saveValues.updated_date = cts;
                	saveValues.updated_by = formData.user_id;
                    dbHandler.updateTableData('modules',{id:formData.id},saveValues,async function(error,result){
                        if(error) {
                            return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                        } else {
                            return callback(null,{status:"success",message:"Modules updated successfully.",id:formData.d});
                        }
                    });
                }else{
                	saveValues.created_date = cts;
                	saveValues.created_by = formData.user_id;
                    db.query("INSERT INTO modules SET ?", saveValues ,(error,orderRows,fields)=>{
                    	dbFunc.connectionRelease;
                        if(error) {
                            return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                        } else {
                            return callback(null,{status:"success","message":"Modules added successfully.",id:orderRows.insertId});
                        }
                    });
                }
            }
        });
    });
}
/**
 * Delete the module
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let deleteModule = async (reqObj,callback)=>{
	let formData = reqObj; 
    let cts = (new Date().getTime() / 1000);
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user ID."});
    if(!formData.module_id) return callback(1,{status:"error",message:"Please provide the module ID."});
    var saveValues = {
		is_deleted: 1,
        deleted_date: cts,
        deleted_by: formData.user_id,
      };
    return new Promise((resolve,reject) => {
    	let sql = `SELECT * FROM modules 
    	WHERE id='${formData.module_id}'`;
        db.query(sql,async function(error, rows, fields) {
        	dbFunc.connectionRelease;
            if (error) { 
                console.log(error);
                return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                //resolve(error);
            } else if (rows.length > 0) {
                //return callback(1,{status:"error",message:"Role Name already exist ! try with different Role Name."});
                //resolve(rows);
                dbHandler.updateTableData('modules',{id:formData.role_id},saveValues,async function(error,result){
                    if(error) {
                        return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                    } else {
                        return callback(null,{status:"success",message:"Module deleted successfully.",id:formData.d});
                    }
                });
            } else {
                return callback(1,{status:"error",message:"Module ID does not exist."});
            }
        });  
    });
}

let getModulePermissionList = async (reqObj,callback)=>{
    record_status = reqObj.record_status;
    module_id = reqObj.module_id;
    return new Promise(async function(resolve,reject) {
        let sql = `SELECT m.id as module_id,m.name as module_name,r.name as role_name,
        rp.read_permission,rp.write_permission,rp.delete_permission
        from modules m
        inner join role_permission rp on m.id=rp.module_id 
        inner join roles r on r.id=rp.role_id 
        WHERE m.is_deleted = 0 and r.is_deleted = 0 and rp.is_deleted=0`;
        if(typeof(record_status) !='undefined' && record_status !=''){
        	sql +=` and m.record_status = '${record_status}'`;
        }
        if(typeof(module_id) !='undefined' && module_id !=''){
        	sql +=` and rp.module_id = '${module_id}'`;
        }
        if(typeof(role_id) !='undefined' && role_id !=''){
        	sql +=` and rp.role_id = '${role_id}'`;
        }
        sql +=` order by m.sort_order asc`;
        db.query(sql,async function(error,items,fields){
        	dbFunc.connectionRelease;
            if(!!error) {
                callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                if(items.length == 0) {
                    callback(1,{status:"error",message:"No data found."});
                    resolve(error);
                } else {
                    callback(null,{status:"success",message:"Roles Permission List.",data:items});
                    resolve(items);
                }
            }
       });
    });
}
/**
 * Get the list of users under a client
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let getAllClientUsers = async (reqObj,callback)=>{
    user_id = reqObj.user_id;
    return new Promise(async function(resolve,reject) {
        let sql = `select c.id,c.email,display_name, c.azure_account_id
        from c4_client_users as c
        left join c4_client_user_groups as cug on cug.user_id = c.id
		left join azure_ad_groups as aag on aag.group_id = cug.group_id
        where c.status = 1 `;
        // and aag.is_rbac_ad =1 and c.azure_account_id is not NULL
        
        if(typeof(user_id) !='undefined' && user_id !=''){
        	sql +=` and c.id = '${user_id}'`;
        }
        sql +=` group by c.id order by c.email asc`;
        console.log("sql ---- ", sql);
        db.query(sql,async function(error,items,fields){
        	dbFunc.connectionRelease;
            if(!!error) {
                console.log("error ---- ", error);
                callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                if(items.length == 0) {
                    callback(1,{status:"error",message:"No data found."});
                    resolve(error);
                } else {
                    callback(null,{status:"success",message:"Users List.",data:items});
                    resolve(items);
                }
            }
       });
    });
}

/**
 * Assign a user to role & resource group
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let saveResourceGroup_backup = async (reqObj,callback)=>{
//	console.log("reqObj --- ", reqObj);
	let formData = reqObj;
    let cts = (new Date().getTime() / 1000); 
    if(!formData.resource_user_id) return callback(1,{status:"error",message:"Please provide the resource_user_id."});
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user_id."});
    if(!formData.role_id) return callback(1,{status:"error",message:"Please provide the role_id."});
    //if(!formData.userRoleSelected) return callback(1,{status:"error",message:"Please Select Role."});
    if(!formData.subscription_id) return callback(1,{status:"error",message:"Please provide the subscription_id."});
    if(!formData.assign_resources || formData.assign_resources.length == 0) return callback(1,{status:"error",message:"Please provide the assign_resources."});
    if(typeof formData.record_status == 'undefined') return callback(1,{status:"error",message:"Please provide the record_status."});
    let report_to = 0;
    if(typeof formData.report_to !='undefined' && formData.report_to !='' && formData.report_to != 0){
        report_to = formData.report_to;
    }
    var saveValues = {
        user_id: formData.resource_user_id,
		role_id: formData.role_id,
        subscription_id: formData.subscription_id,
        report_to: report_to,
        record_status: formData.record_status,
      };

      console.log('assign_resources----',formData.assign_resources);
      var assigned_resource_group = formData.assign_resources.map(function(val) {
        return val.resource_group;
      }).join(',');
      console.log('--------assigned_resource_group',assigned_resource_group);

     return new Promise(async function(resolve,reject) {

    	if(typeof formData.id !='undefined' && formData.id !='' && formData.id != 0){
            //Delete resouce group
            let delete_resource_group_query = 'delete from resource_group where id = :id';
            let delete_resource_group = await dbHandler.executeQueryv2(delete_resource_group_query, { id: formData.id } );
             //Delete resouce group Mapping
            let delete_resource_group_mapping_query = 'delete from resource_group_mapping where resource_group_id = :id';
            let delete_resource_group_mapping = await dbHandler.executeQueryv2(delete_resource_group_mapping_query, { id: formData.id } );

            
            //Delete resouce group
            // let delete_resource_group_query1 = 'update resource_group set is_deleted=1 where user_id = :user_id and role_id:role_id';
            // let delete_resource_group1 = await dbHandler.executeQueryv2(delete_resource_group_query1, { user_id: formData.resource_user_id,role_id:formData.role_id } );
            //  //Delete resouce group Mapping
            // let delete_resource_group_mapping_query1 = 'delete from resource_group_mapping where resource_group_id = :id';
            // let delete_resource_group_mapping1 = await dbHandler.executeQueryv2(delete_resource_group_mapping_query1, { id: formData.id } );
 
            saveValues.created_date = cts;
            saveValues.created_by = formData.user_id;
            db.query("INSERT INTO resource_group SET ?", saveValues ,async (error,orderRows,fields)=>{
                dbFunc.connectionRelease;
                if(error) {
                    return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                } else {
                    for(let assign_resource of formData.assign_resources){

                        let sql = `SELECT * FROM resource_group rg 
                        inner join resource_group_mapping rgm on rg.id = rgm.resource_group_id 
                        where rgm.resource_group ='${assign_resource.resource_group}' and rg.is_deleted=0 and rg.user_id='${formData.resource_user_id}' and rg.role_id='${formData.role_id}'`;
                        console.log('----Update check resourece group sql query',sql)
                        db.query(sql,async function(error, rows, fields) {
                            dbFunc.connectionRelease;
                            if (error) { 
                                console.log(error);
                                return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                                //resolve(error);
                            } else if (rows.length > 0) {
                               // return callback(1,{status:"error",message:"Resource group user is already exist ! try with different resource group."});
                                //resolve(rows);
                                console.log('rows----data',rows);
                                let delete_resource_group_query1 = 'update resource_group set is_deleted=1 where user_id = :user_id and role_id:role_id';
                                let delete_resource_group1 = await dbHandler.executeQueryv2(delete_resource_group_query1, { user_id: formData.resource_user_id,role_id:formData.role_id } );
                                
                                let sql = `insert into resource_group_mapping(resource_group_id, resource_group, created_date, created_by) values 
                                (:resource_group_id, :resource_group, :created_date, :created_by)`;
                                let new_element = {};
                                new_element.resource_group_id = orderRows.insertId; 
                                new_element.resource_group = assign_resource.resource_group; 
                                new_element.created_date = cts;
                                new_element.created_by = formData.user_id;
                                await dbHandler.executeQueryv2(sql, new_element );
                                console.log('inserted new record for edit====',sql);
                            } else {
                                let sql = `insert into resource_group_mapping(resource_group_id, resource_group, created_date, created_by) values 
                                (:resource_group_id, :resource_group, :created_date, :created_by)`;
                                let new_element = {};
                                new_element.resource_group_id = orderRows.insertId; 
                                new_element.resource_group = assign_resource.resource_group; 
                                new_element.created_date = cts;
                                new_element.created_by = formData.user_id;
                                await dbHandler.executeQueryv2(sql, new_element );
                                console.log('inserted new record for edit====',sql);
                            }
                            
                        });
                    }
                }
            });

            return callback(null,{status:"success","message":"User added to resource group successfully."});
         
           
        }else{
            // let sql = `SELECT * FROM resource_group 
            // WHERE is_deleted=0 and user_id='${formData.resource_user_id}' and role_id='${formData.role_id}' and subscription_id='${formData.subscription_id}'`;
            let sql = `SELECT * FROM resource_group rg 
            inner join resource_group_mapping rgm on rg.id = rgm.resource_group_id 
            where rgm.resource_group in (${assigned_resource_group}) and rg.is_deleted=0 and rg.user_id='${formData.resource_user_id}'`;
            console.log('----check resourece group sql query',sql)
            db.query(sql,async function(error, rows, fields) {
                dbFunc.connectionRelease;
                if (error) { 
                    console.log(error);
                    return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                    //resolve(error);
                } else if (rows.length > 0) {
                    return callback(1,{status:"error",message:"Resource group user is already exist ! try with different resource group."});
                    //resolve(rows);
                } else {
                    saveValues.created_date = cts;
                    saveValues.created_by = formData.user_id;
                    db.query("INSERT INTO resource_group SET ?", saveValues ,async (error,orderRows,fields)=>{
                        dbFunc.connectionRelease;
                        if(error) {
                            return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                        } else {
                            let sql = `insert into resource_group_mapping(resource_group_id, resource_group, created_date, created_by) values 
                            (:resource_group_id, :resource_group, :created_date, :created_by)`;
        
                            for(let assign_resource of formData.assign_resources){
                                let new_element = {};
                                new_element.resource_group_id = orderRows.insertId; 
                                new_element.resource_group = assign_resource.resource_group; 
                                new_element.created_date = cts;
                                new_element.created_by = formData.user_id;
                                await dbHandler.executeQueryv2(sql, new_element );
                            }
                            
                            return callback(null,{status:"success","message":"User added to resource group successfully.",id:orderRows.insertId});
                        }
                    });
                }
                
            });
        }
    });
}

let saveResourceGroup = async (reqObj,callback) => {
	console.log("reqObj --- ", reqObj);
    let formData = reqObj,
      cts = (new Date().getTime() / 1000),
      report_to = 0, saveValues,
      errors = [],
      successMsg = [], LastInsertId;

    formData.user_id = parseInt(formData.user_id)
    formData.resource_user_id = parseInt(formData.resource_user_id)

    if(!formData.resource_user_id) return callback(1,{status:"error",message:"Please provide the resource_user_id."});
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user_id."});
    if(!formData.role_id) return callback(1,{status:"error",message:"Please provide the role_id."});
    if(!formData.subscription_id) return callback(1,{status:"error",message:"Please provide the subscription_id."});
    if(!formData.assign_resources || formData.assign_resources.length == 0) return callback(1,{status:"error",message:"Please provide the assign_resources."});
    if(typeof formData.record_status == 'undefined') return callback(1,{status:"error",message:"Please provide the record_status."});
    if(typeof formData.report_to !='undefined' && formData.report_to !='' && formData.report_to != 0){
        report_to = formData.report_to;
    }
    
    let userSql = `select id, azure_account_id from c4_client_users where id = '${formData.resource_user_id}' limit 1 `;
	console.log("userSql --- ", userSql);
	let userRows = await dbHandler.executeQueryv2(userSql);
	console.log("userRows ---- ", userRows);
	if(userRows.length == 0){
		return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
	}
	let rgRows = [];
	if (!formData.edit_mode) {
		let rgIds = [];
		for await (rg of formData.assign_resources){
			rgIds.push(rg.resource_group);
		}
		console.log("rgIds --- ",rgIds);
		let rgSql = `select group_concat(name) as rg_names from c4_azure_resourcegroups where id in (${rgIds.join(",")}) `;
		console.log("rgSql --- ", rgSql);
		rgRows = await dbHandler.executeQueryv2(rgSql);
		console.log("rgRows ---- ", rgRows);
		if(rgRows.length == 0){
			return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
		}
	}
//	return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});

    const manageResourceGrp = async () => {
       let assign_resources = formData.assign_resources.map(async resource_group => {
           let resorce_grp =  {
            resource_group_id: LastInsertId,
            subscription_id: formData.subscription_id,
            resource_group: resource_group.resource_group,
            role_id: formData.role_id,
            created_date: cts,
            created_by: formData.user_id,
            updated_date: cts,
            updated_by: formData.user_id
           },
           qry = '',
           getData = await dbHandler.executeQueryv2(`SELECT * FROM resource_group_mapping WHERE subscription_id='${resorce_grp.subscription_id}' AND resource_group='${resorce_grp.resource_group}' AND resource_group_id='${LastInsertId}'`);

           if (getData[0]?.id && formData.edit_mode) {
               Object.assign(resorce_grp, {
                id: getData[0]?.id
               })
               qry = `UPDATE resource_group_mapping SET resource_group_id=:resource_group_id, subscription_id=:subscription_id, resource_group=:resource_group, role_id=:role_id, record_status=1, is_deleted=0, updated_by=:updated_by, updated_date=:updated_date WHERE id=:id`;
           }
           else {
               qry = `INSERT INTO resource_group_mapping (resource_group_id, subscription_id, resource_group, role_id) VALUES (:resource_group_id, :subscription_id, :resource_group, :role_id)`;
           }

           try {
            resp = await dbHandler.executeQueryv2(qry, resorce_grp, true);
            successMsg.push({})
           }
           catch(e) {
            errors.push(e?.response?.data);
           }
           return resp.data;
        });

        assign_resources = await Promise.all(assign_resources);
        if (errors.length) {
            return callback(1,{status:"error",message: 'Failed to add/update resource group(s) to user'});
        } else {
        	if (!formData.edit_mode && rgRows.length > 0) {
        		let reqValues = {
    				jenkins_job_type : 9,
    				created_date: cts,
    				user_id : formData.user_id
    			};
    			db.query("INSERT INTO other_jenkins_requests SET ?", reqValues ,async (error,rows,fields)=>{
    		    	dbFunc.connectionRelease;
    		        if(error) {
    		            console.log(error);
//    		            return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", reqBody});
    		        } else {
    		    		let params = {};
    		    		params.request_ref_id = rows.insertId;
    		    		params.jenkins_job_type = reqValues.jenkins_job_type;
    		    		params.Subscription = formData.subscription_id;
    		    		params.objectid = userRows[0].azure_account_id;
    		    		params.Resource_group = "["+rgRows[0].rg_names+"]";
    		    		params.Request_type = "create";
    		    		params.requested_domain = config.API_URL;
    		    		params.username = '';
    		    		params.password = '';
    		    		let subSql = `select rbac_username, rbac_password from c4_azure_subscriptions where subscription_id = '${params.Subscription}' limit 1 `;
	        			console.log("subSql --- ", subSql);
	        			let subRows = await dbHandler.executeQueryv2(subSql);
	        	    	console.log("subRows ---- ", subRows);
	        	    	if(subRows.length > 0){
	        	    		params.username = subRows[0].rbac_username;
	    		    		params.password = subRows[0].rbac_password;
	        	    	}
    		    		jenkinsModel.triggerJenkinsJob(params,async function(err,result){
    			    		console.log("Reader-access-Azure-portal-RG result ---- ",result);
    			    		await dbHandler.updateTableData('other_jenkins_requests',{id:params.request_ref_id},
    		    				{
    		    					jenkins_response_obj:JSON.stringify(result),
    		    	    		},async function(err,result){
    		    	            console.log("other_jenkins_requests data updated");
    		    	        });
//    			    		return callback(err,result);
    			    	});
    		        }
    			});
        	}
            return callback(1,{status:"success",message:"Addition/Updation of user to resource group(s) is Successful"});
        }
    }

    saveValues = {
        user_id: formData.resource_user_id,
		role_id: formData.role_id,
        subscription_id: formData.subscription_id,
        report_to: report_to,
        record_status: 1,
        created_date: cts,
        created_by: formData.user_id,
        updated_date: cts,
        updated_by: formData.user_id
    };    

    db.query(`SELECT * FROM resource_group WHERE subscription_id='${formData.subscription_id}' AND user_id=${formData.resource_user_id}`, async (error, recordRec, fields) => {
        LastInsertId = (recordRec[0] || {}).id;
        if (LastInsertId) {
            db.query(`UPDATE resource_group SET updated_by='${saveValues.updated_by}',updated_date='${saveValues.updated_date}', report_to='${saveValues.report_to}', role_id='${saveValues.role_id}', is_deleted=0, record_status=1 WHERE id=${LastInsertId}`, () => {});
            manageResourceGrp();
        }
        else {
            db.query("INSERT INTO resource_group SET ?", saveValues, async (error,orderRows,fields) => {
                dbFunc.connectionRelease;
                if(error) {
                    return callback(1, {status: "error", message: "The operation did not execute as expected. Please raise a ticket to support"});
                } else {
                    console.log('New Subscription insertion success')
                    LastInsertId =  orderRows.insertId;
                    manageResourceGrp();
                }
            });
        }
     });
}

let saveResourceGroup_bkp3 = async (reqObj,callback)=>{
	let formData = reqObj;
    let cts = (new Date().getTime() / 1000); 
    if(!formData.resource_user_id) return callback(1,{status:"error",message:"Please provide the resource_user_id."});
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user_id."});
    if(!formData.role_id) return callback(1,{status:"error",message:"Please provide the role_id."});
    if(!formData.subscription_id) return callback(1,{status:"error",message:"Please provide the subscription_id."});
    if(!formData.assign_resources || formData.assign_resources.length == 0) return callback(1,{status:"error",message:"Please provide the assign_resources."});
    if(typeof formData.record_status == 'undefined') return callback(1,{status:"error",message:"Please provide the record_status."});
    let report_to = 0;
    if(typeof formData.report_to !='undefined' && formData.report_to !='' && formData.report_to != 0){
        report_to = formData.report_to;
    }
    var saveValues = {
        user_id: formData.resource_user_id,
		role_id: formData.role_id,
        subscription_id: formData.subscription_id,
        report_to: report_to,
        record_status: formData.record_status,
      };


    console.log('postdata------------------->',saveValues, formData.id);
    return new Promise(async function(resolve,reject) {
        // Edit role assingment
    	if(typeof formData.id !='undefined' && formData.id !='' && formData.id != 0){
            var errMsg = [];
            let successMsg = '';

            // New role assignment
            let roleCheckSQL = `SELECT RGM.role_id FROM resource_group RG
            INNER JOIN resource_group_mapping RGM ON RGM.resource_group_id = RG.id 
            WHERE RGM.role_id = '${formData.role_id}' 
            AND RG.user_id = '${formData.resource_user_id}' 
            AND RG.is_deleted = '0'`;
            console.log('roleCheckSQL',roleCheckSQL)
            db.query(roleCheckSQL,async function(error, rows, fields) {
                dbFunc.connectionRelease;
                if (error) {
                    console.log(error);
                } else if (rows.length > 0) {
                    console.log('====different new role Update ELSE IF----');
                    //update resource group in mappping table
                    let AssignedResourceGroup = formData.assign_resources.map(async function(val) {
                        try{
                        let checkAssignmentSql = `SELECT RGM.id as RGMappingId,RG.id, ARG.name, RGM.role_id FROM resource_group RG 
                        INNER JOIN resource_group_mapping RGM ON RGM.resource_group_id = RG.id 
                        INNER JOIN c4_azure_resourcegroups ARG ON ARG.id = RGM.resource_group
                        WHERE RG.user_id = '${formData.resource_user_id}' 
                        AND RGM.resource_group = '${val.resource_group}'
                        AND RG.is_deleted = '0'`;  
                        console.log('checkAssignmentSql----------------->',checkAssignmentSql);
                        checkAssignmentRes = await dbHandler.executeQueryv2(checkAssignmentSql)
                        
                        if (checkAssignmentRes.length > 0) {
                            if(checkAssignmentRes[0].RGMappingId == formData.resource_group_mapping_id
                                && checkAssignmentRes[0].role_id != formData.role_id){
                                
                                successMsg = 'Success';
                                let updateRgSQL = 'UPDATE resource_group_mapping SET role_id=:role_id,subscription_id=:subscription_id,resource_group=:resource_group WHERE id = :id';
                                let updateRgRes = await dbHandler.executeQueryv2(updateRgSQL, { id: formData.resource_group_mapping_id,subscription_id:formData.subscription_id,role_id:formData.role_id, resource_group:val.resource_group } );
                                console.log('updateRgMapptingRes PK value----------------->',updateRgRes);

                            }else{ 
                                console.log('======99999999999999',"User already assigned to resource group: "+checkAssignmentRes[0].name+".")
                                // errMsg +="User already assigned to resource group: "+rows[0].name+". \n";
                                errMsg.push(checkAssignmentRes[0].name);
                            }
                                
                        } else {
                            successMsg = 'Success';
                            let updateRgSQL = 'UPDATE resource_group_mapping SET role_id=:role_id,subscription_id=:subscription_id,resource_group=:resource_group WHERE id = :id';
                            let updateRgRes = await dbHandler.executeQueryv2(updateRgSQL, { id: formData.resource_group_mapping_id,role_id:formData.role_id,subscription_id:formData.subscription_id, resource_group:val.resource_group } );
                            console.log('updateRgRes----------------->',updateRgRes);
                        }   
                    }catch(e){
                        console.log('catch block>>',e);
                    }    
                    // }
                    });  
                    await Promise.all(AssignedResourceGroup);

                    let errRgMsgData = '';
                    let sucRgMsgData = '';
                    if(errMsg.length >0){
                        var errRgMsg = errMsg.map(function(val) {
                            return "-<b>"+val+"</b><br>";
                        }).join('');
                        errRgMsgData = " User already assigned to resource group: <br> "+errRgMsg;
                    }
                    if(successMsg){
                        // var succRgMsg = successMsg.map(function(val) {
                        //     return val;
                        // }).join(',');
                        sucRgMsgData = "\n  User assigned to resource group successfully: \n ";
                    }
                    return callback(null,{status:"success",message:errRgMsgData + sucRgMsgData});
                } else {
                    console.log('====same role Update ELSE ----');
                    // check role_id + user_id + reource_group < 1
                    // for (let assign_resource of formData.assign_resources){
                    let AssignedResourceGroup = formData.assign_resources.map(async function(val) {
                        try{
                        let checkAssignmentSql = `SELECT RGM.id as RGMappingId, RG.id, ARG.name, RGM.role_id FROM resource_group RG 
                        INNER JOIN resource_group_mapping RGM ON RGM.resource_group_id = RG.id 
                        INNER JOIN c4_azure_resourcegroups ARG ON ARG.id = RGM.resource_group
                        WHERE RG.user_id = '${formData.resource_user_id}' 
                        AND RGM.resource_group = '${val.resource_group}' 
                        AND RG.is_deleted = '0'`;  
                        console.log('checkAssignmentSql----------------->',checkAssignmentSql); 
                        checkAssignmentRes = await dbHandler.executeQueryv2(checkAssignmentSql)
                        
                            if (checkAssignmentRes.length > 0) {
                                if(checkAssignmentRes[0].RGMappingId == formData.resource_group_mapping_id &&
                                    checkAssignmentRes[0].role_id != formData.role_id){
                                    successMsg = 'Success';
                                    
                                    //Update resource group mapping
                                    let updateRgSQL = 'UPDATE resource_group_mapping SET role_id=:role_id,subscription_id=:subscription_id,resource_group=:resource_group WHERE id = :id';
                                    let updateRgRes = await dbHandler.executeQueryv2(updateRgSQL, { id: formData.resource_group_mapping_id,role_id:formData.role_id,subscription_id:formData.subscription_id, resource_group:val.resource_group } );
                                    console.log('updateRg Mapping Res----------------->',updateRgRes); 
                                }else{
                                    console.log('======99999999999999',"User already assigned to resource group: "+checkAssignmentRes[0].name+".")
                                    // errMsg +="User already assigned to resource group: "+rows[0].name+". \n";
                                    errMsg.push(checkAssignmentRes[0].name);
                                }
                            } else {
                                // successMsg.push(checkAssignmentRes[0].name);
                                successMsg = 'Success';
                                //Update resource group mapping
                                let updateRgSQL = 'UPDATE resource_group_mapping SET role_id=:role_id,subscription_id=:subscription_id,resource_group=:resource_group WHERE id = :id';
                                let updateRgRes = await dbHandler.executeQueryv2(updateRgSQL, { id: formData.resource_group_mapping_id,subscription_id:formData.subscription_id,role_id:formData.role_id, resource_group:val.resource_group } );
                                console.log('updateRg Mapping Res----------------->',updateRgRes);
                            }   
                        }catch(e){
                            console.log('catch block>>',e);
                        }    
                    // }
                    });  
                    await Promise.all(AssignedResourceGroup);

                    let errRgMsgData = '';
                    let sucRgMsgData = '';
                    if(errMsg.length >0){
                        var errRgMsg = errMsg.map(function(val) {
                            return "-<b>"+val+"</b><br>";
                        }).join('');
                        errRgMsgData = " User already assigned to resource group: <br> "+errRgMsg;
                    }
                    if(successMsg){
                        // var succRgMsg = successMsg.map(function(val) {
                        //     return val;
                        // }).join(',');
                        sucRgMsgData = "\n  User assigned to resource group successfully: \n ";
                    }
                    return callback(null,{status:"success",message:errRgMsgData + sucRgMsgData});
                }
            });
            // console.log('errMsg===',errMsg);       
            // // return callback(1,{status:"error",message:errMsg});
            // if(errMsg !=''){
            //     return callback(1,{status:"error",message:errMsg});
            // }else{
            //     return callback(null,{status:"success","message":"Updated successfully."});
            // }
            
        }else{
            var errMsg = [];
            var successMsg = '';
           // Addition New role assignment
           let roleCheckSQL = `SELECT RG.id,RGM.role_id FROM resource_group RG 
           INNER JOIN resource_group_mapping RGM ON RGM.resource_group_id = RG.id 
           WHERE RGM.role_id = '${formData.role_id}' 
           AND RG.user_id = '${formData.resource_user_id}' 
           AND RGM.subscription_id = '${formData.subscription_id}' 
           AND RG.is_deleted = '0'`;
           db.query(roleCheckSQL,async function(error, rows, fields) {
               dbFunc.connectionRelease;
               if (error) {
                   console.log(error);
               } else if (rows.length > 0) {
                   console.log('====different new role====Else IF');
                   var errMsgData ='';
                  // for (let assign_resource of formData.assign_resources){
                let AssignedResourceGroup = formData.assign_resources.map(async function(val) {
                    try{
                        let checkAssignmentSql = `SELECT RG.id, ARG.name FROM resource_group RG 
                        INNER JOIN resource_group_mapping RGM ON RGM.resource_group_id = RG.id 
                        INNER JOIN c4_azure_resourcegroups ARG ON ARG.id = RGM.resource_group
                        WHERE RG.user_id = '${formData.resource_user_id}' 
                        AND RGM.resource_group = '${val.resource_group}' 
                        AND RGM.subscription_id = '${formData.subscription_id}' 
                        AND RG.is_deleted = '0'`;  
                        console.log('checkAssignmentSql----------------->',checkAssignmentSql);
                        checkAssignmentRes = await dbHandler.executeQueryv2(checkAssignmentSql)
                        console.log('length----',checkAssignmentRes);
                        if (checkAssignmentRes.length > 0) {
                            errMsg.push(checkAssignmentRes[0].name);
                        }else{
                            // successMsg.push(checkAssignmentRes[0].name);
                            successMsg = 'Success';
                            let insertSQL = `INSERT INTO resource_group_mapping(resource_group_id, subscription_id,resource_group, role_id, created_date, created_by) VALUES
                            (:resource_group_id, :subscription_id, :resource_group, :role_id, :created_date, :created_by)`;
                            let new_element = {};
                            new_element.resource_group_id = rows[0].id;
                            new_element.subscription_id = formData.subscription_id;
                            new_element.resource_group = val.resource_group;
                            new_element.role_id = formData.role_id;
                            new_element.created_date = cts;
                            new_element.created_by = formData.user_id;
                            await dbHandler.executeQueryv2(insertSQL, new_element );
                            console.log('inserted new record for edit====>>>>>>>>>>>>>>>>',insertSQL);
                        }
                    }catch(e) {
                        console.log('try catch block>>>',e);
                    }
                });
                await Promise.all(AssignedResourceGroup);
                // AssignedResourceGroup = await Promise.All(AssignedResourceGroup);
                // let finalErrorMsg = getAssignedResourcegroupInsert(formData,cts,rows)
                console.log('******Error messages****',errMsg);
                let errRgMsgData = '';
                let sucRgMsgData = '';
                if(errMsg.length >0){
                    var errRgMsg = errMsg.map(function(val) {
                        return "- <b>"+val+"</b><br>  ";
                    }).join('');
                    errRgMsgData = " User already assigned to resource group: <br> "+errRgMsg;
                }
                if(successMsg){
                    // var succRgMsg = successMsg.map(function(val) {
                    //     return val;
                    // }).join(',');
                    sucRgMsgData = "\n User assigned to resource group successfully: \n ";
                }
                return callback(null,{status:"success",message:errRgMsgData + sucRgMsgData});
                   
               } else {
                        console.log('====same role=========Else==');
                        //delete with resoruce_group_id in mapaping delete
                        let deleteRgSQL = 'DELETE FROM resource_group WHERE user_id = :user_id and subscription_id = :subscription_id and role_id = :role_id';
                        let deleteRgRes = await dbHandler.executeQueryv2(deleteRgSQL, { user_id: formData.resource_user_id,subscription_id: formData.subscription_id ,role_id: formData.role_id} );
                        console.log('deleteRgRes----------------->',deleteRgRes);

                        var LastInsertId = '';
                        saveValues.created_date = cts;
                        saveValues.created_by = formData.user_id;
                        saveValues.created_date = cts;
                        saveValues.created_by = formData.user_id;

                        db.query("INSERT INTO resource_group SET ?", saveValues ,async (error,orderRows,fields)=>{
                        dbFunc.connectionRelease;
                        if(error) {
                            return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                        } else {
                            let errMsg = [];
                            let successMsg = '';
                            LastInsertId =  orderRows.insertId
                            console.log('################lastInsertGroupId===',orderRows.insertId);
                            let haveRg = false;
                            // check role_id + user_id + reource_group < 1
                            // for (let assign_resource of formData.assign_resources){
                            let AssignedResourceGroup = formData.assign_resources.map(async function(val) {
                                let checkAssignmentSql = `SELECT RG.id, ARG.name FROM resource_group RG 
                                INNER JOIN resource_group_mapping RGM ON RGM.resource_group_id = RG.id 
                                INNER JOIN c4_azure_resourcegroups ARG ON ARG.id = RGM.resource_group
                                WHERE RG.user_id = '${formData.resource_user_id}' 
                                AND RGM.resource_group = '${val.resource_group}' 
                                AND RGM.subscription_id = '${formData.subscription_id}' 
                                AND RG.is_deleted = '0'`;  
                                console.log('checkAssignmentSql----------------->',checkAssignmentSql);
                                checkAssignmentRes = await dbHandler.executeQueryv2(checkAssignmentSql)
                                try{
                                    if (checkAssignmentRes.length > 0) {
                                        console.log('======99999999999999',"User already assigned to resource group: "+checkAssignmentRes[0].name+".")
                                        // errMsg +="User already assigned to resource group: "+rows[0].name+". \n";
                                        errMsg.push(checkAssignmentRes[0].name);
                                        //Delete RG record if not found 
                                        let deleteRgSQL = 'DELETE FROM resource_group WHERE id = :id';
                                        let deleteRgRes = await dbHandler.executeQueryv2(deleteRgSQL, { id: LastInsertId} );
                                        console.log('deleteRgRes+++ Delete RG record if not found----------------->',deleteRgRes);
                                    } else {
                                        // successMsg.push(checkAssignmentRes[0].name);
                                        successMsg = 'Success';
                                        let insertSQL = `INSERT INTO resource_group_mapping(resource_group_id, subscription_id, resource_group,role_id, created_date, created_by) VALUES
                                        (:resource_group_id, :subscription_id, :resource_group, :role_id, :created_date, :created_by)`;
                                        let new_element = {};
                                        new_element.resource_group_id = LastInsertId;
                                        new_element.subscription_id = formData.subscription_id;
                                        new_element.resource_group = val.resource_group;
                                        new_element.role_id = formData.role_id;
                                        new_element.created_date = cts;
                                        new_element.created_by = formData.user_id;
                                        await dbHandler.executeQueryv2(insertSQL, new_element );
                                        console.log('inserted new record for edit====>>>>>>>>>>>>>>>>',insertSQL);
                                    }  
                                }catch(e){
                                    console.log('catch block',e);
                                }   
                            // }
                            });
                            await Promise.all(AssignedResourceGroup);
                            console.log('******Error messages****',errMsg);
                            console.log('******Success messages****',successMsg);
                            let errRgMsgData = '';
                            let sucRgMsgData = '';
                            if(errMsg.length >0){
                                var errRgMsg = errMsg.map(function(val) {
                                    return "-<b>"+val+"</b><br>";
                                }).join('');
                                errRgMsgData = " User already assigned to resource group: <br> "+errRgMsg;
                            }
                            if(successMsg){
                                // var succRgMsg = successMsg.map(function(val) {
                                //     return val;
                                // }).join(',');
                                sucRgMsgData = "\n User assigned to resource group successfully: \n ";
                            }
                            return callback(null,{status:"success",message:errRgMsgData + sucRgMsgData});
                        }
                    });   
                
                }
           });
           
        // if(errMsg !=''){
        //     return callback(1,{status:"error",message:errMsg});
        // }else{
        //     return callback(null,{status:"success","message":"Updated successfully."});
        // }

        }
    });
}


/**
 * Get the list of resource group
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let getAllResourceGroupList = async (reqObj,callback)=>{
    record_status = reqObj.record_status;
    resource_group_id = reqObj.resource_group_id;
    assigned_resource_groups = reqObj.assigned_resource_groups;
    subscription_selected = reqObj.subscription_selected;
    role_id = reqObj.role_id;
    resource_group_id = reqObj.resource_group_id;
    subscription_resource_group_combo = reqObj.subscription_resource_group_combo;
    
    // id = reqObj.id;
    return new Promise(async function(resolve,reject) {
        let sql = `SELECT RG.id AS resource_group_id,
        ARG.name as RGname,RGM.id as resource_group_mapping_id,
        S.subscription_id,
        S.display_name AS subscription_name,
        R.name AS role_name,U.email,RGM.role_id,RG.user_id,
        R.id AS role_id,
        RU.email AS report_email,
        RG.report_to,
        RG.created_by,CU.email AS created_by_email,
        U.azure_account_id 
        FROM resource_group RG 
        INNER JOIN resource_group_mapping RGM ON RG.id = RGM.resource_group_id
        INNER JOIN c4_azure_resourcegroups ARG ON RGM.resource_group = ARG.id
        INNER JOIN roles R ON R.id = RGM.role_id
        INNER JOIN c4_client_users U ON U.id = RG.user_id
        INNER JOIN c4_azure_subscriptions S ON S.subscription_id = RGM.subscription_id
        LEFT JOIN c4_client_users RU ON RU.id = RG.report_to
        LEFT JOIN c4_client_users CU ON CU.id = RG.created_by
        WHERE RG.is_deleted = 0 AND RGM.is_deleted=0`;

        if(typeof(role_id) !='undefined' && role_id !=''){
            sql +=` and RGM.role_id = ${role_id}`;
        }
        if(reqObj.superAdmin == "1"){ 
        	if(subscription_selected){
        		sql += ` and S.subscription_id = '${subscription_selected}'`;
        	}
        	if(resource_group_id){
        		sql += ` and ARG.id = '${resource_group_id}'`;
        	}
        }else{
            let cond = [];
        
            subscription_resource_group_combo = subscription_resource_group_combo.filter(rec => {
                rec = rec.split('@$')
                    
                if (resource_group_id && subscription_selected) {
                    return rec[0] === subscription_selected && parseInt(rec[2]) === resource_group_id;
                }
                else {
                    if (subscription_selected) {
                        return rec[0] === subscription_selected;
                    }
                   else {
                            return true
                        }
                }
            })
    
                for await (const item of subscription_resource_group_combo){
                    cond.push(` (S.subscription_id = '${item.split("@$")[0]}' and ARG.name = '${item.split("@$")[1]}')`);
                }
                if(cond.length > 0){
                    sql += ` and (${cond.join(" or ")})`;
                }
                else {
                    callback(1,{status:"error",message:"No data found."});
                    return
                }
            }
        sql +=` order by RG.id desc`;
        console.log("sql ---- ", sql);

        db.query(sql,async function(error,items,fields){
        	dbFunc.connectionRelease;
            if(!!error) {
                callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                if(items.length == 0) {
                    callback(1,{status:"error",message:"No data found."});
                    resolve(error);
                } else {
                    i= 0;
                    let inner_sql = `select rgm.resource_group,ar.name 
                    from resource_group_mapping as rgm
                    inner join c4_azure_resourcegroups ar on ar.id = rgm.resource_group 
                    where ar.record_status=1 and rgm.resource_group_id = :resource_group_id`;
                    items = items.map(async item => {
                        let inerItems, group_ids;
                        item.resource_groups = [];
                        item.mapped_resource_group_ids = [];

                        inerItems = await dbHandler.executeQueryv2(inner_sql, {
                            resource_group_id: item.resource_group_id
                        });
                        item.resource_groups = inerItems;
                        group_ids = inerItems.map(inerItem => inerItem.resource_group);
                        item.mapped_resource_group_ids = group_ids;
                        return item;
                    })
                    items = await Promise.all(items);
                    callback(null,{status:"success",message:"Resource Group List.",data:items});
                    resolve(items);
                }
            }
       });
    });
}

/**
 * Get the list of resource group
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
 let getAllUserResourceGroupList = async (reqObj,callback)=>{
    record_status = reqObj.record_status;
    resource_group_id = reqObj.resource_group_id;
    subscription_selected = reqObj.subscription_selected;
    // console.log('reqObj==========',reqObj);
    console.log('resource group id:::',reqObj.resource_group_id);
    console.log('subscription_selected:::',reqObj.subscription_selected);
    // id = reqObj.id;
    return new Promise(async function(resolve,reject) {
        let sql = `SELECT rg.id as resource_group_id,sub.subscription_id,sub.display_name as subscription_name,
        r.name as role_name,u.email,rgm.role_id,rg.user_id , r.id as role_id,ru.email as report_email,rg.report_to 
        FROM resource_group rg 
        inner join resource_group_mapping rgm on rgm.resource_group_id = rg.id
        inner join roles r on r.id = rgm.role_id
        inner join c4_client_users u on u.id = rg.user_id
        inner join c4_azure_subscriptions sub on sub.subscription_id = rgm.subscription_id 
        left join c4_client_users ru on ru.id = rg.report_to 
        WHERE rg.is_deleted=0 and r.is_deleted=0`;

        if(typeof(record_status) !='undefined' && record_status !=''){
        	sql +=` and rg.record_status = '${record_status}' and r.record_status = '${record_status}'`;
        }
        if(typeof(subscription_selected) !='undefined' && subscription_selected !=''){
        	sql +=` and rgm.subscription_id = '${subscription_selected}'`;
        }
        if(typeof(resource_group_id) !='undefined' && resource_group_id !=''){
        	sql +=` and rgm.resource_group = '${resource_group_id}'`;
        }
        sql +=` order by rg.id desc`;
        console.log('All User resource list: SQL',sql);
        db.query(sql,async function(error,items,fields){
        	dbFunc.connectionRelease;
            if(!!error) {
                callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                if(items.length == 0) {
                    callback(1,{status:"error",message:"No data found."});
                    resolve(error);
                } else {
                	i= 0;
                	for await (const item of items) {
                		items[i].resource_groups = [];
	            		items[i].mapped_resource_group_ids = [];
                		await new Promise(async function(innerResolve,innerReject) {
                            let condition = '';
                            if(typeof(resource_group_id) !='undefined' && resource_group_id !=''){
                                //condition +=` and (rgm.resource_group = '${resource_group_id}' OR rgm.resource_group_id = ${item.resource_group_id})`;
                                condition +=` and rgm.resource_group_id = ${item.resource_group_id} and rgm.resource_group = '${resource_group_id}'`;
                            }else{
                                condition +=` and rgm.resource_group_id = ${item.resource_group_id}`;
                            }

                	        let inner_sql = `select rgm.resource_group,ar.name 
                            from resource_group_mapping as rgm
                            inner join c4_azure_resourcegroups ar on ar.id = rgm.resource_group 
                	        where ar.record_status=1 ${condition}`;
 
                	        await db.query(inner_sql,async function(error,inerItems,innerFields){
                	        	dbFunc.connectionRelease;
                	            if(!!error) {
                	                console.log(error);
                	                innerResolve(error);
                	            } else {
                	            	items[i].resource_groups = inerItems;
                	            	
                	            	let group_ids = [];
    	    		                for await (const inerItem of inerItems) {
    	    		                	group_ids.push(inerItem.resource_group);
    	    		                }
    	    		                
    	    		                items[i].mapped_resource_group_ids = group_ids;
                	            	innerResolve([]);
                	            }
                	        });
                		});
                		i++;
                	}
                    callback(null,{status:"success",message:"Resource Group List.",data:items});
                    resolve(items);
                }
            }
       });
    });
}

/**
 * List of permission under a role
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let getRolePermissionList = async (reqObj,callback)=>{
    record_status = reqObj.record_status;
    role_id = reqObj.role_id;
    // id = reqObj.id;
    return new Promise(async function(resolve,reject) {
        let sql = `select r.id,r.name,re.name as report_name,r.report_id as report_id from 
        roles r left join roles re on r.report_id=re.id where r.is_deleted=0`;
        if(typeof(record_status) !='undefined' && record_status !=''){
        	sql +=` and rg.record_status = '${record_status}' and r.record_status = '${record_status}'`;
        }
        if(typeof(role_id) !='undefined' && role_id !=''){
        	sql +=` and r.id = '${role_id}'`;
        }
        sql +=` order by r.id desc`;
        db.query(sql,async function(error,items,fields){
        	dbFunc.connectionRelease;
            if(!!error) {
                callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                if(items.length == 0) {
                    callback(1,{status:"error",message:"No data found."});
                    resolve(error);
                } else {

                	i= 0;
                	for await (const item of items) {
                		items[i].user_permissions = [];
	            		items[i].mapped_user_permission_ids = [];
                		await new Promise(async function(innerResolve,innerReject) {
                	        let inner_sql = `SELECT rp.module_id as id,m.name as module_name,rp.read_permission,rp.write_permission,
                            rp.delete_permission 
                            FROM role_permission rp
                            inner join modules m on m.id = rp.module_id
                            where m.is_deleted=0 and rp.is_deleted=0 and rp.role_id = ${item.id}`;
                	        await db.query(inner_sql,async function(error,inerItems,innerFields){
                	        	dbFunc.connectionRelease;
                	            if(!!error) {
                	                console.log(error);
                	                innerResolve(error);
                	            } else {
                	            	items[i].user_permissions = inerItems;
                	            	
                	            	let user_p_ids = [];
    	    		                for await (const inerItem of inerItems) {
    	    		                	user_p_ids.push(inerItem.id);
    	    		                }
    	    		                
    	    		                items[i].mapped_user_permission_ids = user_p_ids;
                	            	innerResolve([]);
                	            }
                	        });
                		});
                		i++;
                	}
                    callback(null,{status:"success",message:"Roles permissions list.",data:items});
                    resolve(items);
                }
            }
       });
    });
}

/**
 * Remove the resource group
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
let deleteResourceGroup = async (reqObj,callback)=>{
	let formData = reqObj; 
    let cts = (new Date().getTime() / 1000);
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user ID."});
    if(!formData.resoure_group_id) return callback(1,{status:"error",message:"Please provide the resoure group ID."});
    if(!formData.resource_group_mapping_id) return callback(1,{status:"error",message:"Please provide the resoure group Mapping ID."});
    if(!formData.azure_account_id) return callback(1,{status:"error",message:"Please provide the azure_account_id."});
    if(!formData.RGname) return callback(1,{status:"error",message:"Please provide the RGname."});
    var saveValues = {
		is_deleted: 1,
        deleted_date: cts,
        deleted_by: formData.user_id,
      };
    return new Promise((resolve,reject) => {
    	let sql = `SELECT * FROM resource_group 
    	WHERE id='${formData.resoure_group_id}'`;

        db.query(sql,async function(error, rows, fields) {
        	dbFunc.connectionRelease;
            if (error) { 
                console.log(error);
                return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                //resolve(error);
            } else if (rows.length > 0) {
                //return callback(1,{status:"error",message:"Role Name already exist ! try with different Role Name."});
                //resolve(rows);
                //delete with resoruce_group_id in mapaping delete
                let deleteRgSQL = 'DELETE FROM resource_group_mapping WHERE resource_group_id = :resoure_group_id and id = :resource_group_mapping_id';
                let deleteRgRes = await dbHandler.executeQueryv2(deleteRgSQL, { resoure_group_id: formData.resoure_group_id,resource_group_mapping_id: formData.resource_group_mapping_id} );
                console.log('deleteRgRes Mapping----------------->',deleteRgRes);
                
                let reqValues = {
    				jenkins_job_type : 9,
    				created_date: cts,
    				user_id : formData.user_id
    			};
    			db.query("INSERT INTO other_jenkins_requests SET ?", reqValues ,async (error,rows,fields)=>{
    		    	dbFunc.connectionRelease;
    		        if(error) {
    		            console.log(error);
//        		            return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", reqBody});
    		        } else {
    		    		let params = {};
    		    		params.request_ref_id = rows.insertId;
    		    		params.jenkins_job_type = reqValues.jenkins_job_type;
    		    		params.Subscription = formData.subscription_id;
    		    		params.objectid = formData.azure_account_id;
    		    		params.Resource_group = "["+formData.RGname+"]";
    		    		params.Request_type = "delete";
    		    		params.requested_domain = config.API_URL;
    		    		params.username = '';
    		    		params.password = '';
    		    		let subSql = `select rbac_username, rbac_password from c4_azure_subscriptions where subscription_id = '${params.Subscription}' limit 1 `;
	        			console.log("subSql --- ", subSql);
	        			let subRows = await dbHandler.executeQueryv2(subSql);
	        	    	console.log("subRows ---- ", subRows);
	        	    	if(subRows.length > 0){
	        	    		params.username = subRows[0].rbac_username;
	    		    		params.password = subRows[0].rbac_password;
	        	    	}
    		    		jenkinsModel.triggerJenkinsJob(params,async function(err,result){
    			    		console.log("Reader-access-Azure-portal-RG result ---- ",result);
    			    		await dbHandler.updateTableData('other_jenkins_requests',{id:params.request_ref_id},
    		    				{
    		    					jenkins_response_obj:JSON.stringify(result),
    		    	    		},async function(err,result){
    		    	            console.log("other_jenkins_requests data updated");
    		    	        });
//        			    		return callback(err,result);
    			    	});
    		        }
    			});
                
                return callback(null,{status:"success",message:"Resource group deleted successfully.",id:formData.resoure_group_id});
                // dbHandler.updateTableData('resource_group',{id:formData.resoure_group_id},saveValues,async function(error,result){
                //     if(error) {
                //         return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                //     } else {
                //         return callback(null,{status:"success",message:"Resource group deleted successfully.",id:formData.resoure_group_id});
                //     }
                // });
            } else {
                return callback(1,{status:"error",message:"Resource group does not exist."});
            }
        });  
    });
}

/**
 * Get the list of all roles
 * @param {*} reqObj 
 * @param {*} callback 
 * @returns 
 */
 let listRGAssigned = async (reqObj,callback)=>{
    record_status = reqObj.record_status;
    isSuperAdmin = reqObj.isSuperAdmin;
    user_id = reqObj.user_id;
    console.log('reqObj=======',reqObj)
    return new Promise(async function(resolve,reject) {
        let sql = `SELECT
        RG.id,
        RG.is_deleted,
        ARG.name,
        RGM.resource_group,
        RGM.role_id,
        RG.subscription_id,
        RG.user_id
        FROM
            resource_group RG
        INNER JOIN resource_group_mapping RGM ON
            RGM.resource_group_id = RG.id
        INNER JOIN c4_azure_resourcegroups ARG ON
            ARG.id = RGM.resource_group
        WHERE RG.is_deleted = '0'`;
        if(isSuperAdmin != '1'){
            if(typeof(user_id) !='undefined' && user_id !=''){
                sql +=` and RG.user_id = '${user_id}'`;
            }
        }
        // if(typeof(is_role) !='undefined' && isSuperAdmin == '1'){           
        //     sql +=` and c.is_role != '1'`;
        // } else{
        //     if(typeof(is_role) !='undefined' && is_role !=''){
        //         sql +=` and c.is_role = '${is_role}'`;
        //     }
        // }
        
        sql +=` order by RG.id asc`;
        console.log('===========',sql);
        db.query(sql,async function(error,items,fields){
        	dbFunc.connectionRelease;
            if(!!error) {
                callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                if(items.length == 0) {
                    callback(1,{status:"error",message:"No data found."});
                    resolve(error);
                } else {
                    callback(null,{status:"success",message:"RG Assinged List.",data:items});
                    resolve(items);
                }
            }
       });
    });
}

module.exports = {
	getAllRole,
    listRoleAssigned,
	saveRole,
    deleteRole,
    getUserRoleList,
    getRolePermissionList,
    saveUserRole,
    saveRolePermission,
    deleteUserRole,
    deleteRolePermission,
    getAllModule,
    saveModule,
    deleteModule,
    getModulePermissionList,
    getAllClientUsers,
    saveResourceGroup,
    getAllResourceGroupList,
    getAllUserResourceGroupList,
    deleteResourceGroup,
    updateUserRole,
    listRGAssigned
};