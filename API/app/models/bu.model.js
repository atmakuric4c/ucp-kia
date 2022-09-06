var db = require("../../config/database");
var dbFunc = require("../../config/db-function");
var config = require("../../config/constants");
const dbHandler= require('../../config/api_db_handler');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');

let getAllBu = async (reqObj,callback)=>{
    console.log(reqObj);
    record_status = reqObj.record_status;
    bu_name = reqObj.bu_name;
    bu_id = reqObj.bu_id;
    return new Promise(async function(resolve,reject) {
        let sql = `select c.*
        from bu_info as c
        where 1`;
        if(typeof(record_status) !='undefined' && record_status !=''){
        	sql +=` and c.record_status = '${record_status}'`;
        }
        if(typeof(bu_name) !='undefined' && bu_name !=''){
        	sql +=` and c.bu_name = '${bu_name}'`;
        }
        if(typeof(id) !='undefined' && id !=''){
        	sql +=` and c.id = '${id}'`;
        }
        sql +=` order by c.bu_name asc`;
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
                    callback(null,{status:"success",message:"BU List.",data:items});
                    resolve(items);
                }
            }
       });
    });
}

let saveBu = async (reqObj,callback)=>{
	let formData = reqObj;
	console.log(formData);
    let cts = (new Date().getTime() / 1000);
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user_id."});
    if(!formData.bu_name) return callback(1,{status:"error",message:"Please provide the bu_name."});
    if(typeof formData.record_status == 'undefined') return callback(1,{status:"error",message:"Please provide the record_status."});
    
    var saveValues = {
		bu_name: formData.bu_name,
        record_status: formData.record_status,
      };
    
    return new Promise((resolve,reject) => {
    	let sql = `SELECT * FROM bu_info 
    	WHERE bu_name='${formData.bu_name}'`;
    	if(typeof formData.id !='undefined' && formData.id !='' && formData.id != 0){
    		sql +=` and id <> '${formData.id}'`;
    	}
    	console.log(sql);
        db.query(sql,async function(error, rows, fields) {
        	dbFunc.connectionRelease;
            if (error) {
                return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                //resolve(error);
            } else if (rows.length > 0) {
                return callback(1,{status:"error",message:"Bu Name already exist ! try with different Bu Name."});
                //resolve(rows);
            } else {
                if(typeof formData.id !='undefined' && formData.id !='' && formData.id != 0){
                	saveValues.updated_date = cts;
                	saveValues.updated_by = formData.user_id;
                    dbHandler.updateTableData('bu_info',{id:formData.id},saveValues,async function(error,result){
                        if(error) {
                            return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                        } else {
                            return callback(null,{status:"success",message:"Bu Updated Successfully.",id:formData.d});
                        }
                    });
                }else{
                	saveValues.created_date = cts;
                	saveValues.created_by = formData.user_id;
                    db.query("INSERT INTO bu_info SET ?", saveValues ,(error,orderRows,fields)=>{
                    	dbFunc.connectionRelease;
                        if(error) {
                            return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                        } else {
                            return callback(null,{status:"success","message":"Bu Added Successfully.",id:orderRows.insertId});
                        }
                    });
                }
            }
        });
    });
}

let getAllBuUsers = async (reqObj,callback)=>{
    console.log(reqObj);
    
    if(!reqObj.clientid) return callback(1,{status:"error",message:"Please provide the clientid."});
    if(!reqObj.bu_id) return callback(1,{status:"error",message:"Please provide the bu_id."});
    
    record_status = reqObj.record_status;
    clientid = reqObj.clientid;
    bu_id = reqObj.bu_id;
    
    return new Promise(async function(resolve,reject) {
        let sql = `select c.id,c.email
        from c4_client_users as c
        where 1`;
        if(typeof(record_status) !='undefined' && record_status !=''){
        	sql +=` and c.status = '${record_status}'`;
        }
    	sql +=` and c.clientid = '${clientid}'`;
    	sql +=` and c.bu_id = '${bu_id}'`;
        sql +=` order by c.email asc`;
        console.log(sql);
        db.query(sql,async function(error,items,fields){
        	dbFunc.connectionRelease;
            if(!!error) {
                callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support",data:error});
                resolve(error);
            } else {
                if(items.length == 0) {
                    callback(1,{status:"error",message:"No data found."});
                    resolve(error);
                } else {
                    callback(null,{status:"success",message:"BU Users List.",data:items});
                    resolve(items);
                }
            }
       });
    });
}

module.exports = {
	getAllBu,
	saveBu,
	getAllBuUsers
};