var db = require("../../config/database");
var dbFunc = require("../../config/db-function");
var config = require("../../config/constants");
const dbHandler= require('../../config/api_db_handler');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');

let getAllGroup = async (reqObj,callback)=>{
    console.log(reqObj);
    record_status = reqObj.record_status;
    group_name = reqObj.group_name;
    group_id = reqObj.group_id;
    return new Promise(async function(resolve,reject) {
        let sql = `select c.*
        from roles as c
        where 1`;
        if(typeof(record_status) !='undefined' && record_status !=''){
        	sql +=` and c.record_status = '${record_status}'`;
        }
        if(typeof(group_name) !='undefined' && group_name !=''){
        	sql +=` and c.name = '${group_name}'`;
        }
        if(typeof(group_id) !='undefined' && group_id !=''){
        	sql +=` and c.id = '${group_id}'`;
        }
        sql +=` order by c.name asc`;
        console.log(sql);
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

let saveGroup = async (reqObj,callback)=>{
	let formData = reqObj;
	console.log(formData);
    let cts = (new Date().getTime() / 1000);
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user_id."});
    if(!formData.group_name) return callback(1,{status:"error",message:"Please provide the group_name."});
    if(typeof formData.record_status == 'undefined') return callback(1,{status:"error",message:"Please provide the record_status."});
    
    var saveValues = {
		name: formData.group_name,
        record_status: formData.record_status,
      };
    
    return new Promise((resolve,reject) => {
    	let sql = `SELECT * FROM roles 
    	WHERE name='${formData.group_name}'`;
    	if(typeof formData.id !='undefined' && formData.id !='' && formData.id != 0){
    		sql +=` and id <> '${formData.id}'`;
    	}
    	console.log(sql);
        db.query(sql,async function(error, rows, fields) {
        	dbFunc.connectionRelease;
            if (error) {
                console.log(error);
                return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                //resolve(error);
            } else if (rows.length > 0) {
                return callback(1,{status:"error",message:"Group Name already exist ! try with different Group Name."});
                //resolve(rows);
            } else {
                if(typeof formData.id !='undefined' && formData.id !='' && formData.id != 0){
                	saveValues.updated_date = cts;
                	saveValues.updated_by = formData.user_id;
                    dbHandler.updateTableData('roles',{id:formData.id},saveValues,async function(error,result){
                        if(error) {
                            return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                        } else {
                            return callback(null,{status:"success",message:"Roles Updated Successfully.",id:formData.d});
                        }
                    });
                }else{
                	saveValues.created_date = cts;
                	saveValues.created_by = formData.user_id;
                    db.query("INSERT INTO roles SET ?", saveValues ,(error,orderRows,fields)=>{
                    	dbFunc.connectionRelease;
                        if(error) {
                            return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                        } else {
                            return callback(null,{status:"success","message":"Roles Added Successfully.",id:orderRows.insertId});
                        }
                    });
                }
            }
        });
    });
}


module.exports = {
	getAllGroup,
	saveGroup
};