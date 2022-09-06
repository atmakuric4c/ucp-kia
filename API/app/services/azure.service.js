var azureModel = require("../models/azure.model.js");
var jenkinsModel = require("../models/jenkins.model.js");
var azure_model = require("../../models/azure_model.js");
const moment = require('moment');
const axios = require('axios');
const config=require('../../config/constants');
const strtotime = require('locutus/php/datetime/strtotime');
const php_date = require('locutus/php/datetime/date');
const php_time = require('locutus/php/datetime/time');
const dbHandler= require('../../config/api_db_handler');
const commonModel = require('../models/common.model');
var mail = require("./../../common/mailer.js");
const https = require('https');
const agent = new https.Agent({    rejectUnauthorized: false});

var azureService = {
    getAllVmlist,
    getStorageSkus,
    saveVmOpsRequests,
    saveUserOnboarding,
    removeAdUser,
    getVmSupportedSizes,
    rerunVmOatChecklist,
    getAzureResourceGroups,
    decommissionVm,
    updateVmRequestThroughJenkins,
    getAllAzureResourceGroups,
    getAzureDropdownData,
    checkStorageAndSizeCompatability,
    generateUniqueVmName,
    addAzureResourceGroups,
    getDiskList,
    addDisk,
    attachDisk,
    detachDisk,
    getVMDetails,
    syncSingleVmDetails,
    getVMDetailByName,
    getVmDetailbyId,
    cyberarkSafeDeletion, cyberarkMemberDelete,
    cyberarkMemberAddition, cyberarkSafeCreation,
    cyberarkAccountAddition,
    cyberArkApplication,
    cyberArkPermissions, getCyberArkUsers,
    getAllUsersList,
    getAdGroups,
    addVm,vmResize, vmOatData,
    vmOatList, vmOatListData,
    vmOperations,createAvailabilitySet,
    addAzureDetailsToClient,
    vmLogs,getAllNetwork, addAzureNetwork,
    get_resrouce_group_list,
    azureResourceGroupBySubscription,
    getAzureBillingReport,
    galleryList,
    galleryImagesList,
    galleryImageVersionList,
    getVmBackupVaultNames,
    getVmBackupVaultPolicies,
    getStorageAccountNames,
    extendDisk,
    getCmdbCountries,
    getCmdbRegions,
    getCmdbImpacts,
    getCmdbServices,
    getUserVmAccessRequests,
    updateUserVmAccessRequests,
    revokeUserVmAccessRequest,
    cyberarkMemberUpdation,
    grantVmAccessToUser,
    vmCyberarkList,
    vmCyberarkUsersList,
    manageVMLock,
    getWindowsVmUserAccessList,
    cyberarkUserAddition
}

function getWindowsVmUserAccessList(userid) {
    return new Promise((resolve,reject) => {
    	azureModel.getWindowsVmUserAccessList(userid).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getUserVmAccessRequests(userid) {
    return new Promise((resolve,reject) => {
    	azureModel.getUserVmAccessRequests(userid).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function updateUserVmAccessRequests(reqObj,callback) {
	console.log("reqObj --- ", reqObj);
	if(reqObj.request_obj.body.osType == 'Linux' && reqObj.request_obj.body.durationDays == 0 && reqObj.request_obj.body.durationHours == 0){
        return callback(1,{status:"error", message : "Please enter Duration", reqObj});
	}
	let self = this;
    return new Promise((resolve,reject) => {
        azureModel.updateUserVmAccessRequests(reqObj, async function(err, mainResult){
    		console.log("updateUserVmAccessRequests mainResult ---- ",mainResult);
    		if(reqObj.request_obj.body.osType == 'Linux'){
    			self.cyberarkMemberUpdation(reqObj.request_obj.body,async function(err,result){
    	    		console.log("cyberarkMemberUpdation result ---- ",result);
    	    		if(result.status == "success"){
    	    	    	//send the email notification
    	    			let reqSql = `select * from azure_user_vm_access_requests
    	    	        	where id = '${reqObj.request_id} limit 1'
    	    	        	`;
    	    	        let reqDetails = await dbHandler.executeQueryv2(reqSql);
    	    	        commonModel.getEmailTemplate({template_key:"USER_ADDED_TO_SAFE_UPDATE"},async function(error,emailTempRow){
    	    	    		console.log("emailTempRow --- ",JSON.stringify(emailTempRow));
    	    	    		console.log("reqDetails --- ",reqDetails);
    	    	    		if(reqDetails.length > 0
    	    	    				&& emailTempRow.data){
    	    	                let subject = emailTempRow.data.email_subject+ " - "+reqDetails[0].safeName;
    	    	                let mailbody = emailTempRow.data.email_body;

    	    	                let vmTable = `<table border='1'>`;
    	    	                vmTable+= `<tr><th>Email</th><td>${reqObj.request_obj.body.cyberArkUser.split("@$")[1]}</td></tr>`;
    	    	                vmTable+= `<tr><th>Safe Name</th><td>${reqDetails[0].safeName}</td></tr>`;
//    	    	                vmTable+= `<tr><th>Subscription</th><td>${reqDetails[0].subscription}</td></tr>`;
    	    	                vmTable+= `<tr><th>Resource Group</th><td>${reqDetails[0].resourceGroup}</td></tr>`;
//    	    	                vmTable+= `<tr><th>Region</th><td>${reqDetails[0].location}</td></tr>`;
    	    	                vmTable+= `<tr><th>Server Type</th><td>${reqDetails[0].appType}</td></tr>`;
    	    	                vmTable+= `<tr><th>Duration</th><td>${reqObj.request_obj.body.durationDays} Day(s) and ${reqObj.request_obj.body.durationHours} Hour(s)</td></tr>`;
    	    	                vmTable+=`</table>`;
    	    	                mailbody = mailbody.replace("{{USER_INFO}}", vmTable);
    	    	                
    	    	                mail.mail({subject : subject, messageBody : mailbody, tomail : reqObj.request_obj.body.cyberArkUser.split("@$")[1]});
    	    	                resolve("Done");
    	    	    		}else{
    	    	    			resolve("Done");
    	    	    		}
    	    	    	});
    	    	        let duration = Math.round(new Date().getTime() / 1000)+((parseInt(reqObj.request_obj.body.durationDays)*24+parseInt(reqObj.request_obj.body.durationHours))*60*60);
    	    	        dbHandler.updateTableData('azure_user_vm_access_requests',{id:reqObj.request_id},{is_edit_email_sent:1, duration},function(err,result){
    	    	    		console.log(err)
    	    	        });
    	    	    }
    	    		resolve(result);
    	    		return callback(((result.status == "success")?null:1),result);
    	    	});
        	}else{
        		let params = {};
        		params.request_ref_id = reqObj.request_id;
        		params.jenkins_job_type = 3;
        		params.os_type = reqObj.request_obj.body.osType;
        		params.mw_type = ((reqObj.request_obj.body.appType != 'Plain')?reqObj.request_obj.body.appType:"");
        		params.accessType = reqObj.request_obj.body.accessType;
        		params.UserPrincipalName = reqObj.request_obj.body.cyberArkUser.split("@$")[1];
        		params.mail_id = reqObj.request_obj.body.cyberArkUser.split("@$")[1];
        		params.Roles = reqObj.request_obj.body.role;
        		params.role = reqObj.request_obj.body.role;
        		params.Sql_Role = reqObj.request_obj.body.Sql_Role;
        		params.DomainName = reqObj.request_obj.body.region.split("@$")[4];
        		params.dc = reqObj.request_obj.body.region.split("@$")[4];
        		params.subscription_id = reqObj.request_obj.body.subscription;
        		params.deployment_resource_group_name = reqObj.request_obj.body.resourceGroupName;
        		params.virtual_machine_name = reqObj.request_obj.body.hostNames[0].split("@$")[1];
        		params.service_account = reqObj.request_obj.body.service_account_name;
        		params.requested_domain = config.API_URL;
        		jenkinsModel.triggerJenkinsJob(params,async function(err,result){
    	    		console.log("updateUserVmAccessRequests result ---- ",result);
    	    		if(!err){
	    	    		dbHandler.updateTableData('azure_user_vm_access_requests',{id:reqObj.request_id},{is_edit_email_sent:0},function(err,result){
		    	    		console.log(err)
		    	        });
    	    		}
    	    		resolve(result);
    	    		return callback(err,result);
    	    	});
        	}
    	});
    });
}

function revokeUserVmAccessRequest(reqObj,callback) {
	console.log("reqObj --- ", reqObj);
//	return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", reqObj});
	let self = this;
    return new Promise((resolve,reject) => {
		if(reqObj.request_obj.body.osType == 'Linux'){
			let {resourceGroupName, appType, region, cyberArkUser, azure_regions} = reqObj.request_obj.body,
	        resourceGroupNameLen = resourceGroupName.length,
			safeName = appType.split('@$')[2];
			resourceGroupName = resourceGroupName.substr(-12);
//		    region = region.split('@$')[0];
//		    safeName += region + '_' + resourceGroupName;
		    MemberName = cyberArkUser.split('@$')[1];
		    
			self.cyberarkMemberDelete({appType: appType.split('@$')[2],
            resourceGroupName, MemberName, azure_regions},async function(err,result){
	    		console.log("cyberarkMemberDelete result ---- ",result);
	    		if(result.status == "success"){
	    	    	//send the email notification
	    			let reqSql = `select * from azure_user_vm_access_requests
	    	        	where id = '${reqObj.request_id} limit 1'
	    	        	`;
	    	        let reqDetails = await dbHandler.executeQueryv2(reqSql);
	    	        commonModel.getEmailTemplate({template_key:"USER_ADDED_TO_SAFE_REVOKED"},async function(error,emailTempRow){
	    	    		console.log("emailTempRow --- ",JSON.stringify(emailTempRow));
	    	    		console.log("reqDetails --- ",reqDetails);
	    	    		if(reqDetails.length > 0
	    	    				&& emailTempRow.data){
	    	                let subject = emailTempRow.data.email_subject+ " - "+reqDetails[0].safeName;
	    	                let mailbody = emailTempRow.data.email_body;

	    	                let vmTable = `<table border='1'>`;
	    	                vmTable+= `<tr><th>Email</th><td>${reqObj.request_obj.body.cyberArkUser.split("@$")[1]}</td></tr>`;
	    	                vmTable+= `<tr><th>Safe Name</th><td>${reqDetails[0].safeName}</td></tr>`;
//	    	                vmTable+= `<tr><th>Subscription</th><td>${reqDetails[0].subscription}</td></tr>`;
	    	                vmTable+= `<tr><th>Resource Group</th><td>${reqDetails[0].resourceGroup}</td></tr>`;
//	    	                vmTable+= `<tr><th>Region</th><td>${reqDetails[0].location}</td></tr>`;
	    	                vmTable+= `<tr><th>Server Type</th><td>${reqDetails[0].appType}</td></tr>`;
//	    	                vmTable+= `<tr><th>Duration</th><td>${reqObj.request_obj.body.durationDays} Day(s) and ${reqObj.request_obj.body.durationHours} Hour(s)</td></tr>`;
	    	                vmTable+=`</table>`;
	    	                mailbody = mailbody.replace("{{USER_INFO}}", vmTable);
	    	                
	    	                mail.mail({subject : subject, messageBody : mailbody, tomail : reqObj.request_obj.body.cyberArkUser.split("@$")[1]});
	    	                resolve("Done");
	    	    		}else{
	    	    			resolve("Done");
	    	    		}
	    	    	});
	    	        dbHandler.updateTableData('azure_user_vm_access_requests',{id:reqObj.request_id},{is_revoke_email_sent:1},function(err,result){
	    	    		console.log(err)
	    	        });
	    	    }
	    		resolve(result);
	    		return callback(((result.status == "success")?null:1),result);
	    	});
    	}else{
    		let params = {};
    		params.request_ref_id = reqObj.request_id;
    		params.jenkins_job_type = 4;
    		params.UserPrincipalName = reqObj.request_obj.body.cyberArkUser.split("@$")[1];
//        		params.Roles = reqObj.request_obj.body.role;
    		params.DomainName = reqObj.request_obj.body.region.split("@$")[4];
    		params.subscription_id = reqObj.request_obj.body.subscription;
    		params.deployment_resource_group_name = reqObj.request_obj.body.resourceGroupName;
    		params.virtual_machine_name = reqObj.request_obj.body.hostNames[0].split("@$")[1];
    		params.requested_domain = config.API_URL;
    		jenkinsModel.triggerJenkinsJob(params,async function(err,result){
	    		console.log("revokeUserVmAccessRequest result ---- ",result);
	    		if(!err){
    	    		dbHandler.updateTableData('azure_user_vm_access_requests',{id:reqObj.request_id},{is_revoke_email_sent:0},function(err,result){
	    	    		console.log(err)
	    	        });
	    		}
	    		resolve(result);
	    		return callback(err,result);
	    	});
    	}
    });
}

function grantVmAccessToUser(reqObj,callback) {
    return new Promise((resolve,reject) => {
    	if(reqObj.osType == 'Linux'){
	    	this.cyberarkMemberAddition(reqObj,async function(err,result){
	    		console.log("grantVmAccessToUser result ---- ",result);
	    		if(result.status == "success"){
	    	    	//send the email notification
	    			let reqSql = `select * from azure_user_vm_access_requests
	    	        	where id = '${reqObj.user_vm_access_request_id} limit 1'
	    	        	`;
	    	        let reqDetails = await dbHandler.executeQueryv2(reqSql);
	    	        commonModel.getEmailTemplate({template_key:"USER_ADDED_TO_SAFE"},async function(error,emailTempRow){
	    	    		console.log("emailTempRow --- ",JSON.stringify(emailTempRow));
	    	    		console.log("reqDetails --- ",reqDetails);
	    	    		if(reqDetails.length > 0
	    	    				&& emailTempRow.data){
	    	                let subject = emailTempRow.data.email_subject+ " - "+reqDetails[0].safeName;
	    	                let mailbody = emailTempRow.data.email_body;

	    	                let vmTable = `<table border='1'>`;
	    	                vmTable+= `<tr><th>Email</th><td>${reqObj.cyberArkUser.split("@$")[1]}</td></tr>`;
	    	                vmTable+= `<tr><th>Safe Name</th><td>${reqDetails[0].safeName}</td></tr>`;
//	    	                vmTable+= `<tr><th>Subscription</th><td>${reqDetails[0].subscription}</td></tr>`;
	    	                vmTable+= `<tr><th>Resource Group</th><td>${reqDetails[0].resourceGroup}</td></tr>`;
//	    	                vmTable+= `<tr><th>Region</th><td>${reqDetails[0].location}</td></tr>`;
	    	                vmTable+= `<tr><th>Server Type</th><td>${reqDetails[0].appType}</td></tr>`;
	    	                vmTable+= `<tr><th>Duration</th><td>${reqObj.durationDays} Day(s) and ${reqObj.durationHours} Hour(s)</td></tr>`;
	    	                vmTable+=`</table>`;
	    	                mailbody = mailbody.replace("{{USER_INFO}}", vmTable);
	    	                
	    	                mail.mail({subject : subject, messageBody : mailbody, tomail : reqObj.cyberArkUser.split("@$")[1]});
	    	                resolve("Done");
	    	    		}else{
	    	    			resolve("Done");
	    	    		}
	    	    	});
	    	        let duration = Math.round(new Date().getTime() / 1000)+((parseInt(reqObj.durationDays)*24+parseInt(reqObj.durationHours))*60*60);
	    	        dbHandler.updateTableData('azure_user_vm_access_requests',{id:reqObj.user_vm_access_request_id},{is_email_sent:1, duration},function(err,result){
	    	    		console.log(err)
	    	        });
	    	    }
	    		resolve(result);
	    		return callback(((result.status == "success")?null:1),result);
	    	});
    	}else{
    		let params = {};
    		params.request_ref_id = reqObj.user_vm_access_request_id;
    		params.jenkins_job_type = 3;
    		params.os_type = reqObj.osType;
    		params.mw_type = ((reqObj.appType != 'Plain')?reqObj.appType:"");
    		params.accessType = reqObj.accessType;
    		params.UserPrincipalName = reqObj.cyberArkUser.split("@$")[1];
    		params.mail_id = reqObj.cyberArkUser.split("@$")[1];
    		params.Roles = reqObj.role;
    		params.role = reqObj.role;
    		params.Sql_Role = reqObj.Sql_Role;
    		params.DomainName = reqObj.region.split("@$")[4];
    		params.dc = reqObj.region.split("@$")[4];
    		params.deployment_resource_group_name = reqObj.resourceGroupName;
    		params.subscription_id = reqObj.subscription;
    		params.virtual_machine_name = reqObj.hostNames[0].split("@$")[1];
    		params.service_account = reqObj.service_account_name;
    		params.requested_domain = config.API_URL;
    		jenkinsModel.triggerJenkinsJob(params,async function(err,result){
	    		console.log("grantVmAccessToUser result ---- ",result);
	    		resolve(result);
	    		return callback(err,result);
	    	});
    	}
    });
}

function saveVmOpsRequests(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.saveVmOpsRequests(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function saveUserOnboarding(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.saveUserOnboarding(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function removeAdUser(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.removeAdUser(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getVmSupportedSizes(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.getVmSupportedSizes(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function rerunVmOatChecklist(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.rerunVmOatChecklist(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function azureResourceGroupBySubscription(reqbody,callback) {
    return new Promise((resolve,reject) => {
        azureModel.azureResourceGroupBySubscription(reqbody,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getDiskList(req,callback) {
    return new Promise((resolve,reject) => {
        azureModel.getDiskList(req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function addDisk(req,callback) {
    return new Promise((resolve,reject) => {
        azureModel.addDisk(req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function attachDisk(req,callback) {
    return new Promise((resolve,reject) => {
        azureModel.attachDisk(req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function detachDisk(req,callback) {
    return new Promise((resolve,reject) => {
        azureModel.detachDisk(req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getVMDetails(encId,callback) {
    return new Promise((resolve,reject) => {
        azureModel.getVMDetails(encId,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function syncSingleVmDetails(encId,callback) {
    return new Promise((resolve,reject) => {
        azureModel.syncSingleVmDetails(encId,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getVMDetailByName(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.getVMDetailByName(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getAllVmlist(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.getAllVmlist(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getStorageSkus(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.getStorageSkus(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getAllNetwork(vdc_id) {
    return new Promise((resolve,reject) => {
        azureModel.getAllNetwork(vdc_id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function addAzureNetwork(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.addAzureNetwork(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getCmdbCountries(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.getCmdbCountries(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getCmdbRegions(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.getCmdbRegions(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getCmdbServices(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.getCmdbServices(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getCmdbImpacts(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.getCmdbImpacts(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function addAzureDetailsToClient(reqObj,req,callback) {
    return new Promise((resolve,reject) => {
        azureModel.addAzureDetailsToClient(reqObj,req,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function createAvailabilitySet(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.createAvailabilitySet(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function get_resrouce_group_list(body,callback) {
    return new Promise((resolve,reject) => {
        azureModel.get_resrouce_group_list(body,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getAzureResourceGroups(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.getAzureResourceGroups(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function decommissionVm(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.decommissionVm(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function updateVmRequestThroughJenkins(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.updateVmRequestThroughJenkins(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function getAllAzureResourceGroups(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.getAllAzureResourceGroups(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getAzureDropdownData(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.getAzureDropdownData(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function generateUniqueVmName(clientid,callback) {
    return new Promise((resolve,reject) => {
        azureModel.generateUniqueVmName(clientid,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function checkStorageAndSizeCompatability(clientid,callback) {
    return new Promise((resolve,reject) => {
        azureModel.checkStorageAndSizeCompatability(clientid,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function addAzureResourceGroups(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.addAzureResourceGroups(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function addVm(reqObj,callback) {
    return new Promise((resolve,reject) => {
        azureModel.addVm(reqObj,callback).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function getVmDetailbyId(clientid,vm_id) {
    return new Promise((resolve,reject) => {
        azureModel.getVmDetailbyId(clientid,vm_id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function vmLogs(clientid,vmid) {
    return new Promise((resolve,reject) => {
        azureModel.vmLogs(clientid,vmid).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function vmOperations(reqObj,callback) {
    azureModel.vmOperations(reqObj,function(err,result){
        callback(null,result);
    })
}
function vmResize(reqObj,callback) {
    azureModel.vmResize(reqObj,function(err,result){
        callback(err,result);
    })
}

async function cyberarkUserAddition () {
    let {userName} = reqObj,
    cts = Math.round(new Date().getTime() / 1000),
    cyber = await azure_model.getCyberArkConfig(),
    url = cyber.api + `Users/`,
    token, headers, response, payload = {
        userName,
        "userType": "EPVUser",
        "initialPassword": "randompass" + cts,
        "authenticationMethod": ["CyberArk"]
    };

    token = await azure_model.getCyberarkToken(cyber);
    headers = {
        headers: {
            Authorization: token
       },
       httpsAgent: agent
   };

    response = await axios.post(url, payload, headers).catch(async e => {
        if (e.response?.status === 401 || e.response?.status === 409) {
            token = await azure_model.getCyberarkToken(cyber, true);
            headers = {
                headers: {
                    Authorization: token
                },
                httpsAgent: agent
           };

            setTimeout(async () => {
                await axios.post(url, payload, headers);
            }, 500);
        }
    });
    return response
}

async function cyberarkSafeDeletion (reqObj) {
    let safeName = reqObj.safeName,
        cyber = await azure_model.getCyberArkConfig(),
        token,
        url = cyber.api + `Safes/${safeName}/`,
        headers, errors = [];
        
    token = await azure_model.getCyberarkToken(cyber);
    headers = {
        headers: {
           Authorization: token
        },
        httpsAgent: agent
    }
 
    await axios.delete(url, headers).then(res => {
      return true;
    }).catch(async e => {
        if (e.response?.status === 401 || e.response?.status === 409) {
            token = await azure_model.getCyberarkToken(cyber, true);
            headers = {
              headers: {
                Authorization: token
              },
              httpsAgent: agent
            }
            setTimeout(async () => {
                await axios.delete(url, headers).then(res => {
                    return true;
                })
            }, 5000)
          }
    });
}

async function cyberarkMemberDelete (reqObj, cb) {
    let {appType, resourceGroupName, MemberName, azure_regions} = reqObj,
        cyber = await azure_model.getCyberArkConfig(),
        regions = await azureModel.azureRegions(),
        token, headers, is_error,
        deleteSafeMember = async (region) => {
            let safeName = appType + region + '_' + resourceGroupName,
            url = cyber.api + `Safes/${safeName}/Members/${MemberName}/`;
            token = await azure_model.getCyberarkToken(cyber);

            console.log(url, '-----------763--------------')
            headers = {
                   headers: {
                    Authorization: token
                },
                httpsAgent: agent
            }
            try {
                await axios.delete(url, headers);
                return JSON.stringify({
                    url,
                    is_deleted: true
                })
            }
            catch(e) {
            	if(e.response?.data?.ErrorCode === 'ITATS034E' || e.response?.data?.ErrorCode === 'ITATS020E') {
            		return JSON.stringify({
                        url,
                        is_deleted: true
                    })
                }else if (e.response?.status === 401 || e.response?.status === 409) {
                    token = await azure_model.getCyberarkToken(cyber, true);
                    headers = {
                      headers: {
                        Authorization: token
                      },
                      httpsAgent: agent
                    }
                    
                    try {
                        await axios.delete(url, headers)
                        return JSON.stringify({
                            url,
                            is_deleted: true
                        })
                    }
                    catch(err) {
                    	if(err.response?.data?.ErrorCode === 'ITATS034E' || err.response?.data?.ErrorCode === 'ITATS020E') {
                    		return JSON.stringify({
                                url,
                                is_deleted: true
                            })
                        }else{
	                        is_error = true;
	                        return JSON.stringify(err?.response?.data)
                        }
                    }  
                }
                else {
                    is_error = true;
                    return JSON.stringify(e?.response?.data)
                }
            }   
        }
    resourceGroupName = resourceGroupName.substr(-12);
    if(azure_regions){
    	regions = azure_regions.map(reg => {
	        return deleteSafeMember(reg.cyberarkKey)
	    });
    }else{
	    regions = regions.map(reg => {
	        return deleteSafeMember(reg.cyberarkKey)
	    });
    }

    regions = await Promise.all(regions)

    if (is_error) {
        cb(null, {status:"failure",message:"CyberArk Member deletion failed.", data: regions});
    }
    else {
        cb(null, {status:"success",message:"CyberArk Member deleted successfully.", data: regions});
    }
}

async function cyberarkReqMembersAddition(safeName, cyber) {
    let permissions = await cyberArkPermissions(),
      adminPermission = {}, url = cyber.api + `Safes/`, token,
      usernames = cyber.username || [],
      headers, response,
      sendRequest = async (memberName) => {
        let outpt;
        try {
          console.log('--------------------------9537---------------------------')
          console.log(url + safeName + '/Members', memberName)
          token = await getCyberarkToken(cyber);
          headers = {
            headers: {
              Authorization: token
            },
            httpsAgent: agent
          };
          outpt = await axios.post(url + safeName + '/Members/', {
              memberName,
              permissions: adminPermission
          },headers)
          return outpt?.response?.data;
       }
       catch(eer) {
          if (eer.response?.status === 401 || eer.response?.status === 409) {
              token = await getCyberarkToken(cyber, true);
              headers = {
                headers: {
                  Authorization: token
                },
                httpsAgent: agent
              }
  
            try {
              outpt = await axios.post(url + safeName + '/Members/', {
                memberName,
                permissions: adminPermission
              },headers);
              return outpt?.response?.data;
            }
            catch(er2) {
              return er2?.response?.data;
            }
          }
          else {
            return eer?.response?.data;
          }
      }
    };
  
    permissions = permissions.map((permission, index) => {
      adminPermission[permission.name] = true;
      return permission;
    });
  
   usernames.push('administrator');
    response = (usernames || []).filter(u => u).map(async user => {
      return sendRequest(user)
    });
  
    response = await Promise.all(response)
    return response;
  }
  
  //Code to create the safe
  async function cyberarkSafeCreation(reqObj, itr) {
    let {safeName, managingCPM, hostname, auth_token} = reqObj,
        cyber = await getCyberArkConfig(),
        url = cyber.api + `Safes/`, token,
        headers, response, safeObj,
        createSafe = async () => {
          let is_error;
          token = auth_token || await azure_model.getCyberarkToken(cyber);
          headers = {
            headers: {
              Authorization: token || 'na'
            },
            httpsAgent: agent
          };
  
        try {
          safeObj = await axios.post(url, {
            safeName,
            managingCPM,
            olacEnabled: true
        }, headers);
        }
        catch(e) {
          is_error = true;
          safeObj = e.response
        }
  
        let status = safeObj?.status,
        data = safeObj?.data;
        if (is_error) {
          if (data?.ErrorCode === 'SFWS0002') {
            return {
              safeName,
              token,
              url,
              status,
              is_created: true,
              data
            }
          }
          else {
            if ((status === 401 || status === 409) && itr === 1) {
              token = await azure_model.getCyberarkToken(cyber, true);
              itr++;
              return await createSafe();
            }
            else {
              await cyberarkLog({hostname, response: JSON.stringify(data),
                payload: JSON.stringify({safeName,
                  managingCPM}),
                statusid: status, title: 'Safe Creation'});
                return {
                  safeName,
                  status,
                  token,
                  url,
                  is_created: false,
                  data
                }
            }
          }
        }
        else {
          return {
            safeName,
            status,
            token,
            url,
            is_created: true,
            data
          }
        }
    };
    response = await createSafe();

    if (response.is_created) {
      await cyberarkLog({hostname, response: JSON.stringify(response.data),
        payload: JSON.stringify({safeName,
          managingCPM}),
        statusid: 201, title: 'Safe Creation'});
    }

    response.addMember = await cyberarkReqMembersAddition(safeName, cyber);
    return response;
  }

async function cyberarkAccountAddition(aObj) {
    let cyber = await azure_model.getCyberArkConfig(),
      url = cyber.api + 'Accounts',
      { appType, hostNames, region, safeName } = aObj,
        comment = [],
      reqObj = {
        secret: cyber.secret,
        secretType: "password",
        secretManagement: {
          automaticManagementEnabled: true,
          manualManagementReason: ''
        },
        remoteMachinesAccess: {
          remoteMachines: '',
          accessRestrictedToRemoteMachines: true
        }
      },
      token, headers,
      is_error = false, cyberark_usernames = [];
  
    region = region.split('@$')[0];
    appType = appType.split('@$')[1];
 
    hostNames.map(rec => {
        rec = rec.split('@$') 
        cyberark_usernames.push({
            ipaddress: rec[2],
            hostname: rec[1]
        });
    });  
  
    
    Object.assign(reqObj, {
        safeName: safeName,
        userName: appType,
        platformId: cyber.platformId[region]
    });
    let promises = cyberark_usernames.map(async rec => {
    Object.assign(reqObj, {
        name: rec.ipaddress, address: rec.ipaddress,
        platformAccountProperties: {
        hostname: rec.hostname
        }
    });
    token = await azure_model.getCyberarkToken(cyber)
    headers = {
        headers: {
          Authorization: token
        },
        httpsAgent: agent
      }
    return axios.post(url, reqObj, headers).then(async res => {
        let data = res.data;
        await azure_model.updateVMDetails({...data, ipaddress: rec.ipaddress, comment: "Cyberark Account inserted", status: 1});
    }).catch(async e => {
        if (e.response?.status === 401) {
            token = await azure_model.getCyberarkToken(cyber, true)
            headers = {
                headers: {
                    Authorization: token
                },
                httpsAgent: agent
            }
            return axios.post(url, reqObj, headers).then(async res => {
                let data = res.data;
                await azure_model.updateVMDetails({...data, ipaddress: rec.ipaddress, comment: "Cyberark Account inserted", status: 1});
            }).catch(async er => {
                is_error =  true;
                await azure_model.updateVMDetails({...data, ipaddress: rec.ipaddress, comment: "Cyberark Account failed" + er.response?.data, status: -2});
            })
        }
    })
    });
  
    promises = await Promise.all(promises);
  
    return {
        accounts_added: !is_error,
        errmsg: comment,
        accounts: {
            ...reqObj,
            accounts: cyberark_usernames
        }
    }
}

async function cyberarkMemberAddition (reqObj,cb) {
//	let regions = await azureModel.azureRegions();
    let {appType, resourceGroupName, cyberArkUser,
        durationDays, durationHours, azure_regions} = reqObj,
        cts = moment(),
        cyber = await azure_model.getCyberArkConfig(),
        permissions = await azureModel.cyberArkPermissions(),
        headers, memberPermission = {}, adminPermission = {},
        resObj = {member: {},finalSafeName:[]},
        resourceGroupNameLen = resourceGroupName.length,
        is_error = false, errors = [],
        addMemberToSafe = async (region) => {
            let safeName = appType +  region + '_' + resourceGroupName, member, token,
                managingCPM = region === 'EU' ? 'CPM_EU' : (
                    region === 'AP' ? 'CPM_AP' : 'PasswordManager'
                ),
                url = cyber.api +  `Safes/${safeName}/Members/`;

            resObj.finalSafeName.push(safeName);
            try {
                await cyberarkSafeCreation({
                    safeName, hostname: cyberArkUser, managingCPM
                }, 1)
            }
            catch(sce) {//safe creation error

            }

            console.log('-----------addMemberToSafe---------------')
            console.log(url)
            resObj.member = {
                memberName: cyberArkUser,
                MembershipExpirationDate: cts,
                permissions: memberPermission
            }
            try {
                token = await azure_model.getCyberarkToken(cyber);
                headers = {
                    headers: {
                        Authorization: token
                    },
                    httpsAgent: agent
                }

                member = await axios.post(url, {
                    memberName: cyberArkUser,
                    MembershipExpirationDate: cts,
                    permissions: memberPermission
                },headers);
                member = member?.data;
                errors.push(`${cyberArkUser} added to safe ${safeName} of resource group ${reqObj.resourceGroupName} in ${region}`);
            }
            catch(eitr1) {
            	console.log("eitr1 --- ", eitr1);
                if (eitr1.response?.data?.ErrorCode === 'SFWS0012') {
                	member = eitr1.response?.data;
                    errors.push(`${cyberArkUser} added to safe ${safeName} of resource group ${reqObj.resourceGroupName} in ${region}`);
                }else if (eitr1.response?.status === 401 || eitr1.response?.status === 409) {
                    token = await azure_model.getCyberarkToken(cyber, true);
                    headers = {
                        headers: {
                            Authorization: token
                        },
                        httpsAgent: agent
                    }

                    try {
                        member = await axios.post(url, {
                            memberName: cyberArkUser,
                            MembershipExpirationDate: cts,
                            permissions: memberPermission
                        },headers);
                        member = member?.data;
                        errors.push(`${cyberArkUser} added to safe ${safeName} of resource group ${reqObj.resourceGroupName} in ${region}`);
                    }catch(eitr2) {
                    	console.log("eitr2 --- ", eitr2);
                    	if (eitr2.response?.data?.ErrorCode === 'SFWS0012') {
                        	member = eitr2.response?.data;
                            errors.push(`${cyberArkUser} added to safe ${safeName} of resource group ${reqObj.resourceGroupName} in ${region}`);
                        }else {
	                        member = eitr2.response?.data;
	                        is_error = true;
	                        errors.push(member?.ErrorMessage);
                        }
                    }
                }
                else {
                    member = eitr1.response?.data;
                    errors.push(member?.ErrorMessage);
                    is_error = true;
                }
           }
           return JSON.stringify({region, member})
        }

    appType = ((appType.split('@$').length == 3)?appType.split('@$')[2]:"");
    resourceGroupName = resourceGroupName.substr(-12);

    cts = cts.add(durationDays, 'days').add(durationHours, 'hours').format('YYYY-MM-DD H:m:s');
    cts = strtotime(cts);

    permissions = permissions.map((permission, index) => {
        if (permission.is_member) {
            memberPermission[permission.name] = true;
        }
        adminPermission[permission.name] = true;
        return permission;
    });    
    cyberArkUser = cyberArkUser.split('@$')[1];
    
    await new Promise(async function(innerResolve, innerReject){
    	axios.post(config.API_URL + 'azure/add-cyber-user', {
	        userName: cyberArkUser
    	}).then(cyberres => {
	        console.log('---------------Adding user to cyberark----------')
	        console.log(cyberres.data);
	        innerResolve("");
	    }).catch(cybere => {
	        console.log(cyberArkUser, '---------------Error in adding user to cyberark----------')
	        console.log(cybere?.response?.data)
	        innerResolve("");
	    });
    });

//    regions = regions.map(async reg => {
//        return addMemberToSafe(reg.cyberarkKey)
//    });
    if(azure_regions){
	    regions = azure_regions.map(async reg => {
	    	console.log("reg --- ", reg);
	        return addMemberToSafe(reg.cyberarkKey)
	    });
	
	    regions = await Promise.all(regions)
	
	    Object.assign(resObj.member, regions);
	
	    resObj.finalSafeName = resObj.finalSafeName.join(", ");
    }else{
    	is_error = true;
    	resObj.finalSafeName = "";
    }
    if(typeof cb != 'undefined'){
//    	cb(null, {status:((is_error)?"error":"success"),message:errors.join('\n'),data:resObj});
    	cb(null, {status:((is_error)?"error":"success"),message:((is_error)?"CyberArk Safe Member Addition Failed.":"CyberArk Safe Member Added successfully."),data:resObj});
    }else{
    	return resObj;
    }
}

async function cyberarkMemberUpdation (reqObj,cb) {
	let cts = moment(),
        {appType, resourceGroupName, cyberArkUser, 
            durationDays, durationHours, azure_regions} = reqObj,
        cyber = await azure_model.getCyberArkConfig(),
        token,
        permissions = await azureModel.cyberArkPermissions(),
        regions = await azureModel.azureRegions(),
        headers, errors = [], memberPermission = {}, adminPermission = {},
        resourceGroupNameLen = resourceGroupName.length,
        is_error = false,
        updateSafeMember = async (region) => {
            let safeName = appType + region + '_' + resourceGroupName,
              member,
              url = cyber.api + `Safes/${safeName}/Members/`+cyberArkUser + '/';

            console.log('------------updateSafeMember----------------')
            console.log(url)
            try {
                token = await azure_model.getCyberarkToken(cyber);
                headers = {
                    headers: {
                        Authorization: token
                    },
                    httpsAgent: agent
                }
                
                member = await axios.put(url, {
                    MembershipExpirationDate : cts,
                    permissions: memberPermission
                },headers)
               member = member?.data;
            }
            catch(e) {
                if (e.response?.status === 401 || e.response?.status === 409) {
                    token = await azure_model.getCyberarkToken(cyber, true);
                    headers = {
                      headers: {
                        Authorization: token
                      },
                      httpsAgent: agent
                    }
                    try {
                        member = await axios.put(url, {
                            MembershipExpirationDate : cts,
                            permissions: memberPermission
                        },headers);
                        member = member?.data;
                    }
                    catch(er1) {
                        member = er1?.response?.data;
                        is_error = true;
                    }
                }
                else {
                    member = e?.response?.data;
                    is_error = true;
                }
            }
            return JSON.stringify({region: {
                    member,
                    is_error
                }
            });
        };

    resourceGroupName = resourceGroupName.substr(-12);
    appType = appType.split('@$')[2]

    permissions = permissions.map((permission, index) => {
        if (permission.is_member) {
            memberPermission[permission.name] = true;
        }
        adminPermission[permission.name] = true;
        return permission;
    })

    cyberArkUser = cyberArkUser.split('@$')[1];
    cts = cts.add(durationDays, 'days').add(durationHours, 'hours').format('YYYY-MM-DD H:m:s');
    cts = strtotime(cts);

    console.log("azure_regions --- ", azure_regions);
    if(azure_regions){
	    regions = azure_regions.map(async reg => {
	    	console.log("reg --- ", reg);
	        return updateSafeMember(reg.cyberarkKey)
	    });
    }else{
	    regions = regions.map(reg => {
	        return updateSafeMember(reg.cyberarkKey)
	    });
    }
    regions = await Promise.all(regions);

    if(typeof cb != 'undefined'){
    	cb(null, {status:((is_error)?"error":"success"),message:((is_error)?"CyberArk Safe Member Updation Failed.":"CyberArk Safe Member Updated successfully."),data: regions});
    }else{
    	return regions;
    }
}

async function cyberArkApplication() {
    return azureModel.cyberArkApplication();
}

async function cyberArkPermissions() {
    return azureModel.cyberArkPermissions();
}

async function getCyberArkUsers(req) {
    return azureModel.getCyberArkUsers(req);
}

async function getAllUsersList(req) {
    return azureModel.getAllUsersList(req);
}

async function getAdGroups(req) {
    return azureModel.getAdGroups(req);
}

async function vmOatData (reqObj) {
 return azureModel.vmOatData(reqObj);
}

async function manageVMLock (reqObj) {
  return azureModel.manageVMLock(reqObj)
}

async function vmCyberarkUsersList (reqObj) {
    let cyber = await azure_model.getCyberArkConfig(),
      application = await azureModel.cyberArkApplication(),
      regions = await azureModel.azureRegions(),
      {osType, location, os_template_name, resourceGroup} = reqObj,
      token, url, headers, safeName,
      cyberarkList = [], defaultapp;

    if (osType.toLowerCase() === 'windows') {
     return cyberarkList;
    }

      application = application.filter(app => {
       
        if (app.name.toLowerCase() === 'plain') {
            defaultapp = app;
        }

        return (os_template_name || '').toLowerCase().includes(
            app.name.toLowerCase()
        ) && parseInt(app.status);
      })
      regions = regions.filter(reg => {
          return reg.location.toLowerCase() === location.toLowerCase()
      })


      console.log(osType, location, os_template_name, resourceGroup);
      console.log(application)
      console.log(regions)
      resourceGroup = resourceGroup.toLowerCase();
      application = application[0]?.value?.split('@$')[1] || '';

      application = application && application !== '' &&
        application !== 'undefined' ? application: defaultapp?.value?.split('@$')[1];

      safeName = application + regions[0]?.cyberarkKey +
        '_' + resourceGroup?.substr(-12)

   url = cyber.api + `Safes/${safeName}/Members`;
    console.log(url);
    token = await azure_model.getCyberarkToken(cyber);
    headers = {
      headers: {
        Authorization: token || 'na'
      },
      httpsAgent: agent
    }

    try {
      cyberarkList = await axios.get(url, headers);
      cyberarkList = cyberarkList?.data?.value;
    }
    catch(e) {
      let status = e.response?.status;

      console.log('==========cyberark safe users list werror=====')

      if (status === 401 || status === 409) {
         token = await azure_model.getCyberarkToken(cyber, true);
         console.log(1082,1082)
        console.log(e.response?.data);
         try {
          cyberarkList = await axios.get(url, headers);
          cyberarkList = cyberarkList?.data?.value;
         }
         catch(e) {
          cyberarkList = [];
         }
      }
      else {
          console.log(1093,1093)
          console.log(e.response?.data);
          cyberarkList = [];
      }
    }

    cyberarkList = cyberarkList.filter(rec => {
        let membershipExpirationDate=rec?.membershipExpirationDate;

        if (membershipExpirationDate && membershipExpirationDate!== 'null') {
            rec.status = php_time() - membershipExpirationDate > 0 ? 'Inactive': 'Active'
            rec.membershipExpirationDate =  php_date('d-m-Y H:i:s', membershipExpirationDate);
        }
        else {
            rec.membershipExpirationDate = 'NA';
            rec.status = 'Active';
        }
        
        return rec?.memberName?.includes('@dhl');
    })
  
    return cyberarkList || [];
}

async function vmCyberarkList (reqObj) {
  let cyber = await azure_model.getCyberArkConfig(),
    token,
    url = cyber.api + `Accounts?search=${reqObj.hostname}&searchtype=contains`,
    headers, cyberarkList = [];


    if (reqObj.osType.toLowerCase() === 'windows') {
        return cyberarkList;
       }

  console.log('----------Accounts List------')
  console.log('url', url)
  token = await azure_model.getCyberarkToken(cyber);
  headers = {
    headers: {
      Authorization: token || 'na'
    },
    httpsAgent: agent
  }

  console.log('token', token)

  try {
    cyberarkList = await axios.get(url, headers);
    cyberarkList = cyberarkList?.data?.value;
  }
  catch(e) {
    let status = e.response?.status;
    console.log("====Cyberark account list error=====")
    console.log(status)
    console.log(e.response?.data)

    if (status === 401 || status === 409) {
       token = await azure_model.getCyberarkToken(cyber, true);

       try {
        cyberarkList = await axios.get(url, headers);
        cyberarkList = cyberarkList?.data?.value;
        console.log("====1147=====")
        console.log(status)
        console.log(e.response?.data)
       }
       catch(e) {
        cyberarkList = [];
       }
    }
    else {
        cyberarkList = [];
    }
  }

  return cyberarkList || [];
}

async function vmOatList (reqObj) {
 return azureModel.vmOatList(reqObj);
}

async function vmOatListData(reqObj) {
 return azureModel.vmOatListData(reqObj);
}

function galleryList(reqObj,callback) {
    azureModel.galleryList(reqObj,function(err,result){
        callback(null,result);
    })
}

function galleryImagesList(reqObj,callback) {
    azureModel.galleryImagesList(reqObj,function(err,result){
        callback(null,result);
    })
}

function galleryImageVersionList(reqObj,callback) {
    azureModel.galleryImageVersionList(reqObj,function(err,result){
        callback(null,result);
    })
}

function getVmBackupVaultNames(reqObj,callback) {
    azureModel.getVmBackupVaultNames(reqObj,function(err,result){
        callback(null,result);
    })
}

function getVmBackupVaultPolicies(reqObj,callback) {
    azureModel.getVmBackupVaultPolicies(reqObj,function(err,result){
        callback(null,result);
    })
}
function getStorageAccountNames(reqObj,callback) {
    azureModel.getStorageAccountNames(reqObj,function(err,result){
        callback(null,result);
    })
}

function extendDisk(reqObj,callback) {
    azureModel.extendDisk(reqObj,function(err,result){
        callback(null,result);
    })
}

async function getAzureBillingReport(req) {

    let { start_date, end_date } = req.query;
    if (moment(end_date) < moment(start_date)) throw ({ type: "custom", message: 'End date cannot be less than start date', status: 400 });

    let response = await azureModel.getAzureBillingReport(req);
    return response;
}

module.exports = azureService;

