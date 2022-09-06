var db = require('../../config/database');
var dbFunc = require('../../config/db-function');
const helper=require('../../helpers/common_helper');
const axios = require('axios');
var dateFormat=require('dateformat');
const dbHandler= require('../../config/api_db_handler');
const azureModel=require('../../models/azure_model');
//var azureService = require("../services/azure.service.js");
const cmdbModel=require('../../models/cmdb_model');
const ordersModel=require('./orders.model');
const connpool=require('../../config/db_mssql');
var querystring = require('querystring');
var base64 = require('base-64');
const request=require('request');
const config=require('../../config/constants');
var md5 = require('md5');
var mail = require("./../../common/mailer.js");
var fs = require('fs');
const jenkinsapi = require('node-jenkins-api');
const commonModel = require('./common.model');

let triggerJenkinsJob = async (reqBody,callback)=>{
	console.log("triggerJenkinsJob reqBody --- ",reqBody);
	try {
		if(typeof(reqBody.jenkins_job_type)=='undefined' || reqBody.jenkins_job_type==''){
	        return callback([],{success:0,message:'Please provide jenkins_job_type.'});
	    }
		
		let jenkinsData = "";
		await commonModel.getOptionConfigJsonData({option_type:"UCP_CONSTANTS"},async function(err, result){
//			console.log("result 1111111 --- ", result);
			if(!err && result.data){
				jenkinsData = result.data;
			}
			console.log("jenkinsData 1111111 --- ", jenkinsData);
		});
		
		if(!jenkinsData){
			console.log("UCP_CONSTANTS not found");
			return callback(1,{status: "error",success:0,message:'The operation did not execute as expected. Please raise a ticket to support'});
		}
		let jenkins_job_type = reqBody.jenkins_job_type;
		let display_job_name = "";
		const USERNAME = jenkinsData.JENKINS.JenkinsUSERNAME;
	    const TOKEN = jenkinsData.JENKINS.JenkinsTOKEN;//"11d8ab33960b1b86aa7e78a0732631b974";
	    const URL = jenkinsData.JENKINS.JenkinsURL;//"devops03.cloud4c.com";
	    let JOBNAME = "";
	    let mountpoints_file_path = "", weblogic_file_path = "", oracle_file_path = "";
    	let sql =`select job_name, mountpoints_file_path, weblogic_file_path, oracle_file_path, display_job_name from azure_jenkin_jobs 
    	where record_status = 1 
    	`;
    	if(typeof(reqBody.jenkins_job_type) !='undefined' && reqBody.jenkins_job_type !=''){
    		sql += ` and job_type= '${reqBody.jenkins_job_type}' `;
    	}
    	if(typeof(reqBody.provision_type) !='undefined' && reqBody.provision_type !=''){
    		sql += ` and provision_type= '${reqBody.provision_type}' `;
    	}
    	if(typeof(reqBody.os_type) !='undefined' && reqBody.os_type !=''){
    		sql += ` and os_type= '${reqBody.os_type}' `;
    	}
    	if(typeof(reqBody.db_type) !='undefined' && reqBody.db_type !=''){
    		sql += ` and db_type= '${reqBody.db_type}' `;
    	}
    	if(typeof(reqBody.mw_type) !='undefined' && reqBody.mw_type !=''){
    		sql += ` and mw_type= '${reqBody.mw_type}' `;
    	}
    	if(typeof(reqBody.accessType) !='undefined' && reqBody.accessType !=''){
    		sql += ` and accessType= '${reqBody.accessType}' `;
    	}
    	if(typeof(reqBody.is_cluster) !='undefined' && reqBody.is_cluster !=''){
    		sql += ` and is_cluster= '${reqBody.is_cluster}' `;
    	}
    	sql += ` limit 1 `;
        console.log(sql);
        await new Promise(async function(resolve1,reject1){
        	db.query(sql,async function(error,rows,fields){
	        	dbFunc.connectionRelease;
	            if(!!error) {
	                console.log(error);
            		resolve1("");
	            } else {
	            	if(rows.length > 0){
	            		console.log("rows -- ", rows);
            			JOBNAME = rows[0].job_name;
	            		mountpoints_file_path = rows[0].mountpoints_file_path;
	            		weblogic_file_path = rows[0].weblogic_file_path;
	            		oracle_file_path = rows[0].oracle_file_path;
	            		display_job_name = rows[0].display_job_name;
	            		resolve1("");
	            	}else{
	            		resolve1("");
	            	}
	            }
	        });
        });
	    console.log("JOBNAME ------------------------------------------ ", JOBNAME);
	    
	    var jenkins = jenkinsapi.init(`${jenkinsData.JENKINS.Jenkins_protocal}://${USERNAME}:${TOKEN}@${URL}`);
	    console.log("jenkins url -- ", `${jenkinsData.JENKINS.Jenkins_protocal}://${USERNAME}:${TOKEN}@${URL}`);
	    
	    let params = {...reqBody};
	    
	    if(jenkins_job_type == 3){
	    	await dbHandler.updateTableData('azure_user_vm_access_requests',{id:reqBody.request_ref_id},
				{
		    		jenkins_request_obj:JSON.stringify(params),
		    		job_name:JOBNAME
	    		},async function(err,result){
	            console.log("azure_user_vm_access_requests data updated");
	        });
	    }else if(jenkins_job_type == 4){
	    	await dbHandler.updateTableData('azure_user_vm_access_requests',{id:reqBody.request_ref_id},
				{
	    		revoke_jenkins_request_obj:JSON.stringify(params),
		    		revoke_job_name:JOBNAME
	    		},async function(err,result){
	            console.log("azure_user_vm_access_requests data updated");
	        });
	    }else if(jenkins_job_type == 8){
	    	await dbHandler.updateTableData('c4_vm_creation',{id:reqBody.request_ref_id},
					{
			    		jenkins_request_obj:JSON.stringify(params),
			    		job_name:JOBNAME
		    		},async function(err,result){
		            console.log("c4_vm_creation data updated");
		        });
	    }else{
	    	await dbHandler.updateTableData('other_jenkins_requests',{id:reqBody.request_ref_id},
				{
	    			jenkins_request_obj:JSON.stringify(params),
		    		job_name:JOBNAME
	    		},async function(err,result){
	            console.log("other_jenkins_requests data updated");
	        });
	    }
	    if(JOBNAME){
		    var result = await azureModel.buildWithParams(params, USERNAME, TOKEN, URL, JOBNAME);
		    result = result ? result : {};
		    result.success = result.success ? result.success : 0;
		    result.message = result.message ? result.message : 'The operation did not execute as expected. Please raise a ticket to support';
		    if(result.success && display_job_name){
		    	result.message += ` - ${display_job_name}`;
		    }
		    console.log("result.response = ", result.response);
		    return callback(!result.success,{status: ((result.success)?"success":"error"),success:result.success,message:result.message, params_str: result.params_str});
	    }else{
	    	return callback(1,{status: "error",success:0,message:'Jenkin job not found'});
	    }
	} catch (err) {
		console.log("Caught Error - ", err);
		return callback(1,{status: "error",success:0,message:'The operation did not execute as expected. Please raise a ticket to support'});
	}
}
module.exports = {
    triggerJenkinsJob,
};

