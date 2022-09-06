var db = require("../../config/database");
var dbFunc = require("../../config/db-function");
var config = require("../../config/constants");
const dbHandler= require('../../config/api_db_handler');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');

let getAllApprovalMatrix = async (reqObj,callback)=>{
    console.log(reqObj);
    record_status = reqObj.record_status;
    approval_matrix_name = reqObj.approval_matrix_name;
    id = reqObj.id;
    return new Promise(async function(resolve,reject) {
        let sql = `select c.*, bu.bu_name
        from azure_approval_matrix as c
        inner join bu_info as bu on bu.id = c.bu_id
        where 1`;
        if(typeof(record_status) !='undefined' && record_status !=''){
        	sql +=` and c.record_status = '${record_status}' and bu.record_status = '${record_status}'`;
        }
        if(typeof(approval_matrix_name) !='undefined' && approval_matrix_name !=''){
        	sql +=` and c.approval_matrix_name = '${approval_matrix_name}'`;
        }
        if(typeof(id) !='undefined' && id !=''){
        	sql +=` and c.id = '${id}'`;
        }
        sql +=` order by c.approval_matrix_name asc`;
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
//                	console.log(items);
                	i= 0;
                	for await (const item of items) {
                		items[i].mapped_users = [];
	            		items[i].mapped_user_ids = [];
                		await new Promise(async function(innerResolve,innerReject) {
                	        let inner_sql = `select mu.user_id, u.email
                	        from azure_approval_matrix_users as mu
                	        inner join c4_client_users as u on u.id = mu.user_id
                	        where approval_matrix_id = ${item.id}`;
                	        console.log(inner_sql);
                	        await db.query(inner_sql,async function(error,inerItems,innerFields){
                	        	dbFunc.connectionRelease;
//                	        	console.log(inerItems);
                	            if(!!error) {
                	                console.log(error);
                	                innerResolve(error);
                	            } else {
//                	            	console.log("items[i] --- ", items[i]);
                	            	items[i].mapped_users = inerItems;
                	            	
                	            	let users_ids = [];
    	    		                for await (const inerItem of inerItems) {
    	    		                	users_ids.push(inerItem.user_id);
    	    		                }
    	    		                
    	    		                items[i].mapped_user_ids = users_ids;
                	            	console.log("items[i] --- ", items[i]);
                	            	innerResolve([]);
                	            }
                	        });
                		});
                		i++;
                	}
                    callback(null,{status:"success",message:"Approval Matrix List.",data:items});
                    resolve(items);
                }
            }
       });
    });
}

let saveApprovalMatrix = async (reqObj,callback)=>{
	let formData = reqObj;
	console.log(formData);
    let cts = (new Date().getTime() / 1000);
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user_id."});
    if(!formData.bu_id) return callback(1,{status:"error",message:"Please provide the bu_id."});
    if(!formData.approval_matrix_name) return callback(1,{status:"error",message:"Please provide the approval_matrix_name."});
    if(!formData.approval_matrix_level) return callback(1,{status:"error",message:"Please provide the approval_matrix_level."});
    if(typeof formData.record_status == 'undefined') return callback(1,{status:"error",message:"Please provide the record_status."});
    if(!formData.mapped_users || formData.mapped_users.length == 0) return callback(1,{status:"error",message:"Please provide the mapped_users."});
    
    var saveValues = {
		bu_id: formData.bu_id,
		approval_matrix_name: formData.approval_matrix_name,
		approval_matrix_level: formData.approval_matrix_level,
        record_status: formData.record_status,
      };
    
    return new Promise((resolve,reject) => {
    	let sql = `SELECT * FROM azure_approval_matrix 
    	WHERE (approval_matrix_name='${formData.approval_matrix_name}' or approval_matrix_level='${formData.approval_matrix_level}') and record_status = 1 `;
    	if(typeof formData.id !='undefined' && formData.id !='' && formData.id != 0){
    		sql +=` and id <> '${formData.id}'`;
    	}
    	console.log(sql);
        db.query(sql,async function(error, rows, fields) {
        	dbFunc.connectionRelease;
            if (error) {
                return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                //reject(error);
            } else if (rows.length > 0) {
                return callback(1,{status:"error",message:"Approval Matrix/Level already exist! try with different data."});
                //resolve(rows);
            } else {
                if(typeof formData.id !='undefined' && formData.id !='' && formData.id != 0){
                	let delete_old_users_query = 'delete from azure_approval_matrix_users where approval_matrix_id = :id';
                    let delete_old_user = await dbHandler.executeQueryv2(delete_old_users_query, { id: formData.id } );
                    
                	saveValues.updated_date = cts;
                	saveValues.updated_by = formData.user_id;
                    dbHandler.updateTableData('azure_approval_matrix',{id:formData.id},saveValues,async function(error,result){
                        if(error) {
                            return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                        } else {
                        	let sql = `insert into azure_approval_matrix_users(approval_matrix_id, user_id, created_date, created_by) values 
                        	    (:approval_matrix_id, :user_id, :created_date, :created_by)`;

                    	    for(let mapped_user of formData.mapped_users){
                    	        let new_element = {};
                    	        new_element.approval_matrix_id = formData.id; 
                    	        new_element.user_id = mapped_user.user_id; 
                    	        new_element.created_date = cts;
                    	        new_element.created_by = formData.user_id;

                    	        await dbHandler.executeQueryv2(sql, new_element );
                    	    }
                    	    
                            return callback(null,{status:"success",message:"Approval Matrix Updated Successfully.",id:formData.id});
                        }
                    });
                }else{
                	saveValues.created_date = cts;
                	saveValues.created_by = formData.user_id;
                    db.query("INSERT INTO azure_approval_matrix SET ?", saveValues ,async (error,orderRows,fields)=>{
                    	dbFunc.connectionRelease;
                        if(error) {
                            return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                        } else {
                        	let sql = `insert into azure_approval_matrix_users(approval_matrix_id, user_id, created_date, created_by) values 
                        	    (:approval_matrix_id, :user_id, :created_date, :created_by)`;

                    	    for(let mapped_user of formData.mapped_users){
                    	        let new_element = {};
                    	        new_element.approval_matrix_id = orderRows.insertId; 
                    	        new_element.user_id = mapped_user.user_id; 
                    	        new_element.created_date = cts;
                    	        new_element.created_by = formData.user_id;

                    	        await dbHandler.executeQueryv2(sql, new_element );
                    	    }
                    	    
                            return callback(null,{status:"success","message":"Approval Matrix Added Successfully.",id:orderRows.insertId});
                        }
                    });
                }
            }
        });
    });
}

module.exports = {
	getAllApprovalMatrix,
	saveApprovalMatrix
};