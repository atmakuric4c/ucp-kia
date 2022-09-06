const dbHandler= require('../config/api_db_handler')
var db = require('../config/database');
var dbFunc = require('../config/db-function');
const helper = require('../helpers/common_helper');
const axios = require('axios');
const in_array = require('in_array');
const dateFormat = require('dateformat');
const request=require('request');
const querystring = require('querystring');
const config=require('../config/constants');
var base64 = require('base-64');
const jenkinsapi = require('node-jenkins-api');
const fetch = require('node-fetch');
const ucpEncryptDecrypt=require('../config/ucpEncryptDecrypt');
const { password } = require('../config/constants');
const qs = require('qs');
const fs = require('fs');
const cmdbModel=require('./cmdb_model');
const env = require('../config/env');
const moment = require('moment');
const commonModel = require('../app/models/common.model');
const azureService = require('../app/services/azure.service');
var appAzureModel = require("../app/models/azure.model.js");
var azureModel = require("./azure_model.js");
const https = require('https');
const agent = new https.Agent({    rejectUnauthorized: false});


let revokeVMAccessCron = async (reqObj, callback)=>{
	console.log("reqObj ---- ", reqObj);
	let sql = `Select *
		    from azure_user_vm_access_requests as ar
		    where ar.approval_status = 3 
		    and is_revoked = 0 
		    and ar.osType = 'Linux' 
		    `;
	if(typeof reqObj.id != 'undefined'){
	      sql += ` and ar.id = '${reqObj.id}' `;
	}
	if(typeof reqObj.safeName != 'undefined' && typeof reqObj.userId != 'undefined'){
	      sql += ` and ar.safeName like '%${reqObj.safeName}%' `;
	      sql += ` and ar.cyberArkUserId = '${reqObj.userId}' `;
	}else{
		sql += ` and ar.duration is NOT NULL 
		    and ar.duration <= ${Math.round(new Date().getTime() / 1000)} 
		    `;
	}
    sql += ` order by ar.id desc`;
	// sql += ' limit 1';
	console.log("revokeVMAccessCron sql ----- ", sql);
	  
	await dbHandler.executeQuery(sql,async function(revokeAccessList){
		console.log("revokeAccessList ----- ", revokeAccessList);
		for await (var revokeAccess of revokeAccessList){
			await new Promise(async function(innerResolve, innerReject){
				let reqParams = {
			        	request_id : revokeAccess.id,
			        	request_obj : JSON.parse(revokeAccess.request_obj),
			        }
				azureService.revokeUserVmAccessRequest(reqParams, async function(err,result){
//							console.log("err 111111111 ---- ", err);
					let updateData = {
						revoke_response_obj : JSON.stringify(result),
					};
					if(!err){
						updateData.is_revoked = 1;
					}
					await dbHandler.updateTableData('azure_user_vm_access_requests',{id:reqParams.request_id},updateData,async function(err,result){
//								console.log("err 22222 --- ", err);
						innerResolve("");
					});
			    });
			});
	  	}
		console.log("revokeVMAccessCron final log");
		if(callback){
			return callback(null,{status : "success", message:"revoke triggered"});
		}
	});
}

let saveUserVmAccessRequests = async (reqBody,callback)=> {
	let cts = (new Date().getTime() / 1000);
	console.log("reqBody ---- ", JSON.stringify(reqBody));
//    return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", reqBody});
	if(!reqBody || !reqBody.request_obj || !reqBody.request_obj.body){
        return callback(1,{status:"error", message : "Invalid request, please try again", reqBody});
	}else if(!reqBody.request_obj.body.subscription){
        return callback(1,{status:"error", message : "Please select Subscription", reqBody});
	}else if(!reqBody.request_obj.body.resourceGroupName){
        return callback(1,{status:"error", message : "Please select Resource Group", reqBody});
	}else if(reqBody.request_obj.body.osType == 'Windows' && !reqBody.request_obj.body.region){
        return callback(1,{status:"error", message : "Please select Region", reqBody});
	}else if(!reqBody.request_obj.body.osType){
        return callback(1,{status:"error", message : "Please select OS Type", reqBody});
	}else if(reqBody.request_obj.body.osType == 'Linux' && !reqBody.request_obj.body.accountType){
        return callback(1,{status:"error", message : "Please select Account Type", reqBody});
	}else if(!reqBody.request_obj.body.appType 
			&& ((reqBody.request_obj.body.osType == 'Linux' && reqBody.request_obj.body.accountType == 'onlyApps') 
					|| reqBody.request_obj.body.osType == 'Windows')){
        return callback(1,{status:"error", message : "Please select Application Type", reqBody});
	}else if(reqBody.request_obj.body.osType == 'Windows' && !reqBody.request_obj.body.accessType){
        return callback(1,{status:"error", message : "Please select Access Type", reqBody});
	}else if(reqBody.request_obj.body.osType == 'Windows' && !reqBody.request_obj.body.role){
        return callback(1,{status:"error", message : "Please select Role", reqBody});
	}else if(reqBody.request_obj.body.osType == 'Linux' && !reqBody.request_obj.body.cyberArkUser){
        return callback(1,{status:"error", message : "Please select Provide Access To", reqBody});
	}else if(reqBody.request_obj.body.osType == 'Windows' && !reqBody.request_obj.body.cyberArkUserEmail){
		return callback(1,{status:"error", message : "Please enter User Email", reqBody});
	}else if(reqBody.request_obj.body.osType == 'Windows' && (!reqBody.request_obj.body.hostNames || reqBody.request_obj.body.hostNames.length == 0)){
        return callback(1,{status:"error", message : "Please select Virtual Machines", reqBody});
	}else if(reqBody.request_obj.body.osType == 'Linux' && reqBody.request_obj.body.durationDays == 0 && reqBody.request_obj.body.durationHours == 0){
        return callback(1,{status:"error", message : "Please enter Duration", reqBody});
	}else if(reqBody.request_obj.body.osType == 'Windows' && reqBody.request_obj.body.accessType == 'serviceAccount' && !reqBody.request_obj.body.service_account_name){
        return callback(1,{status:"error", message : "Please enter Service Account Name", reqBody});
	}else if(reqBody.request_obj.body.osType == 'Windows' && reqBody.request_obj.body.accessType == 'serviceAccount' && reqBody.request_obj.body.service_account_name && reqBody.request_obj.body.service_account_name.indexOf("a1d_") != 0){
        return callback(1,{status:"error", message : "Service Account Name should start with 'a1d_'", reqBody});
	} else if(reqBody.request_obj.body.osType == 'Windows' && reqBody.request_obj.body.accessType == 'serviceAccount' && reqBody.request_obj.body.service_account_name && /[^a-zA-Z0-9_]/.test(reqBody.request_obj.body.service_account_name)){
        return callback(1,{status:"error", message : "Please enter alphabets or numbers or underscore( _ ) for Service Account Name", reqBody});
    } else if(reqBody.request_obj.body.osType == 'Windows' && reqBody.request_obj.body.appType == 'SQL' && reqBody.request_obj.body.accessType == 'userAccount' && !reqBody.request_obj.body.Sql_Role){
        return callback(1,{status:"error", message : "Please select SQL Role", reqBody});
    }
	
	if(reqBody.request_obj.body.osType == 'Linux' && reqBody.request_obj.body.appType.split('@$').length != 3){
        return callback(1,{status:"error", message : "Invalid Application Type, please refresh the page and try again.", reqBody});
    }
//	return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", reqBody});
	
	return new Promise(async (resolve,reject) => {
		if(reqBody.request_obj.body.cyberArkUserEmail){
			reqBody.request_obj.body.cyberArkUserEmail = reqBody.request_obj.body.cyberArkUserEmail.toLowerCase().trim()
			let userSql = `select id, email from c4_client_users where email = '${reqBody.request_obj.body.cyberArkUserEmail}' limit 1 `;
			console.log("userSql --- ", userSql);
			let userRows = await dbHandler.executeQueryv2(userSql);
	    	console.log("userRows ---- ", userRows);
	    	if(userRows.length == 0){
	    		ad_config = await appAzureModel.getADConfig(),
	            auth = await appAzureModel.getAzureADToken(ad_config);
	        	let search = reqBody.request_obj.body.cyberArkUserEmail;

	        	let userSearchUrl = `${ad_config.ad_azure_url}users?$filter=startswith(mail,'${search}')&$orderby=displayName&$count=true`;
	        	console.log('userSearchUrl ---- ', userSearchUrl);
	        	let userSearchResponse = await axios.get(userSearchUrl, {
	    	      headers: {
	    	        Authorization: 'Bearer ' + auth,
	    	        ConsistencyLevel: 'eventual'
	    	      }
	    	    }).catch(e => {
	    	      console.log('errrorrrrrrrrrrrrrrrrrrr ---- ', e.message);
	    	    });
	        	userSearchResponse = ((userSearchResponse || {}).data || {}).value;
	        	console.log("userSearchResponse --- ", userSearchResponse);
	        	
	        	if(userSearchResponse.length == 0){
	        		return callback(1,{status:"error", message : "Please enter valid email, it doesn't exists in AD mails.", reqBody});
	        	}else{
		    		var insertArr={
		    				clientid : config.DEMO_CLIENT_ID,
		    				client_master_id : config.DEMO_CLIENT_ID,
		    				email: reqBody.request_obj.body.cyberArkUserEmail,
		    				display_name: userSearchResponse[0].displayName,
		    				password : "Ctrls@123",
		    				createddate : cts,
		    				azure_account_id :  userSearchResponse[0].id,
		    			    azure_ad_response : JSON.stringify(userSearchResponse),
		            }
		    		
		    		if(config.enable_user_encryption == 1){
	            	  insertArr.display_name = ((insertArr.display_name)?(await ucpEncryptDecrypt.ucpEncryptForDb(insertArr.display_name)):"");
	            	  insertArr.password = ((insertArr.password)?(await ucpEncryptDecrypt.ucpEncryptForDb(insertArr.password)):"");
		    		}else{
	            	  insertArr.password = md5(insertArr.password);
		    		}
//		    		console.log("11111111111");
		    		console.log("insertArr ---- ", insertArr);
		            await new Promise(function (innerResolve, innerReject) {
		                dbHandler.insertIntoTable('c4_client_users',insertArr,function(err,result){
		                	console.log("result ---- ", result);
		                	if(!err){
		                		reqBody.request_obj.body.cyberArkUser = result+"@$"+reqBody.request_obj.body.cyberArkUserEmail;
		                		innerResolve("");
		                	}else{
		                		console.log(err);
		                		return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support",error});
		                		innerResolve("");
		                		resolve("");
		                	}
		                })
		            });
	        	}
	    	}else{
	    		reqBody.request_obj.body.cyberArkUser = userRows[0].id+"@$"+userRows[0].email;
	    	}
		}
//		console.log("22222222");
//		console.log("reqBody.request_obj.body ---- ", reqBody.request_obj.body);
//		return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support"});
    	
		vmOpsSql = `select id, request_type, approval_status from azure_user_vm_access_requests where 1 `;
		if(reqBody.vm_id){
			vmOpsSql += ` and vm_id = '${reqBody.vm_id}' `;
		}
		vmOpsSql += ` and approval_status in (0,1) limit 1`;
		console.log("vmOpsSql --- ", vmOpsSql);
		await db.query(vmOpsSql,async (error,vmOpsRows,fields)=>{
            dbFunc.connectionRelease;
            if(!!error) {
                console.log("error ---- ", error);
                return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support",error});
                resolve("");
            } else {
            	console.log("UserVmAccessRows ---- ", vmOpsRows);
            	if(vmOpsRows.length > 0 && reqBody.vm_id){
                    return callback(1,{status:"error", message : "One of the request "+vmOpsRows[0].request_type+" is waiting for "+((vmOpsRows[0].approval_status == 0)?"approval":"provision")+" at manager side to this VM, You can't raise new request till this completion.",error});
                    resolve("");
            	}else{
	            	
	            	let frmValueItem = {
	            			subscription : reqBody.request_obj.body.subscription,
	            			resourceGroup : reqBody.request_obj.body.resourceGroupName,
	            			osType : reqBody.request_obj.body.osType,
	            			cyberArkUserId : reqBody.request_obj.body.cyberArkUser.split("@$")[0],
	            			request_type : reqBody.request_type,
	            			ref_type : reqBody.ref_type,
//	            			vm_id : ((reqBody.vm_id)?reqBody.vm_id:""),
	            			request_url : reqBody.request_url,
//	            			request_obj : JSON.stringify(reqBody.request_obj),
	            			created_by : reqBody.user_id,
	            			created_date : cts
	            	};
	            	if(reqBody.request_obj.body.osType == 'Linux'){
	            		frmValueItem.appType = reqBody.request_obj.body.appType.split("@$")[0];
	            		
//	            		frmValueItem.safeName = ((reqBody.request_obj.body.appType.split('@$').length == 3)?reqBody.request_obj.body.appType.split('@$')[2]:"");
//	            	    let region = reqBody.request_obj.body.region.split('@$')[0];
//	            	    frmValueItem.safeName += region + '_' + reqBody.request_obj.body.resourceGroupName.substr(-12);
	            		let finalSafeName = [];
	            		let azure_regions = [];
	            		let regions = await appAzureModel.azureRegions();
	            		let appType = ((reqBody.request_obj.body.appType.split('@$').length == 3)?reqBody.request_obj.body.appType.split('@$')[2]:"");
	            		for await (const reg of regions) {
	            			await new Promise(async (regionResolve, regionReject) => {
//	            		regions = regions.map(async reg => {
	            				appAzureModel.getHostNames({...reqBody.request_obj.body,region: reg.cyberarkKey+"@$"+reg.location},function(err,result){
		            				console.log("getHostNames result --- ",result);
		            				if(!err && result.status && result.status == 'success' && result.data && result.data.length > 0){
		            					let safeName = appType +  reg.cyberarkKey + '_' + reqBody.request_obj.body.resourceGroupName.substr(-12);
		            					revokeVMAccessCron({safeName, userId : reqBody.user_id},function(err,result){
		            						console.log(result);
		            					    finalSafeName.push(safeName);
				    	            		console.log("finalSafeName inner --- ",finalSafeName);
				    	            		azure_regions.push(reg);
				    	            		regionResolve("");
		            					});
		            				}else{
		            					regionResolve("");
		            				}
		            			});
		            	    });
	            		}
//	            		regions = await Promise.all(regions);
	            		frmValueItem.safeName = finalSafeName.join(", ");
	            		reqBody.request_obj.body.safeName = finalSafeName.join(", ");
	            		reqBody.request_obj.body.azure_regions = azure_regions;
	            		console.log("finalSafeName --- ",finalSafeName);
	            	}else{
	            		frmValueItem.location = reqBody.request_obj.body.region.split("@$")[1];
	            		frmValueItem.appType = reqBody.request_obj.body.appType;
	            		frmValueItem.accessType = reqBody.request_obj.body.accessType;
	            		frmValueItem.role = reqBody.request_obj.body.role;
	            		frmValueItem.service_account_name = reqBody.request_obj.body.service_account_name;
	            		if(reqBody.request_obj.body.osType == 'Windows' && reqBody.request_obj.body.appType == 'SQL' && reqBody.request_obj.body.accessType == 'userAccount'){
	            			frmValueItem.Sql_Role = reqBody.request_obj.body.Sql_Role;
	            		}
	            	}
	            	frmValueItem.request_obj = JSON.stringify(reqBody.request_obj);
	            	db.query("INSERT INTO azure_user_vm_access_requests SET ?", frmValueItem ,async (error,orderRows,fields)=>{
	                	console.log("azure_user_vm_access_requests Rows --- ", orderRows);
	                	dbFunc.connectionRelease;
	                    if(error) {
	                    	console.log("error ---- ", error);
	                        return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", error});
	                        resolve(error);
	                    } else {
	                    	if(reqBody.request_obj.body.hostNames && reqBody.request_obj.body.hostNames.length > 0){
		                    	for await (const item of reqBody.request_obj.body.hostNames) {
		                    		itemArr = item.split("@$");
		                    		console.log("itemArr --- ", itemArr);
		                    		let vmMapData = {
	    	                        		request_id : orderRows.insertId,
	    	                        		vm_id : itemArr[0]
	    	                        };
		                    		console.log("vmMapData --- ", vmMapData);
		                    		await db.query("INSERT INTO azure_user_vm_access_vm_mapping SET ?", vmMapData, async (error,vmMapRows,fields)=>{
	    	                        	dbFunc.connectionRelease;
	    			                    if(error) {
	    					                console.log("error ---- ", error);
	    			                    }
		                    		});
		                    	}
	                    	}
	                        let sql = `SELECT am.id, am.approval_matrix_level FROM azure_approval_matrix as am
	            		        where am.record_status = 1 order by am.approval_matrix_level asc`;
	        		        await db.query(sql,async (error,levelRows,fields)=>{
	        	                dbFunc.connectionRelease;
	        		            if(!!error) {
	        		                console.log("error ---- ", error);
	        		                return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support",error});
	        		                innerResolve(error);
	        		            } else {
	//        		                console.log("levelRows --- ", JSON.stringify(levelRows));
	        		                if (levelRows.length > 0) {
	        	                        //insert into log table
	        	                        let logData = {
	        	                        		request_id : orderRows.insertId,
	        	                        		approval_status : 0,
	        	                        		approval_matrix_level : levelRows[0].approval_matrix_level,
	        	                        		created_by : reqBody.user_id,
	        	                        		created_date : cts
	        	                        };
	//        	                        console.log("logData --- ", JSON.stringify(logData));
	        	                        await db.query("INSERT INTO azure_user_vm_access_approval_logs SET ?", logData, async (error,logRows,fields)=>{
	        	                        	dbFunc.connectionRelease;
	        			                    if(error) {
	        					                console.log("error ---- ", error);
	        					                return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support",error});
	        			                        resolve(error);
	        			                    } else {
	        			                        await dbHandler.updateTableData('azure_user_vm_access_requests',{id:orderRows.insertId},{approval_status:0, pending_at : levelRows[0].approval_matrix_level},async function(err,result){
	                                                console.log(err);
	                                            });
	        			                        resolve(logRows);
	        					                return callback(1,{status:"success", message : "Request Submitted Successfully."});
	        			                    }
	        			                });
	        		                }else{
	        		                	resolve([]);
	        			                return callback(1,{status:"success", message : "Request Submitted Successfully."});
	        		                }
	        		            }
	        		        });
	                    }
	                });
            	}
            }
        });
    });
}

let syncCyberarkUserIdsInDb= async (reqObj)=>{
	let cts = Math.round(new Date().getTime() / 1000),
	  cyber = await azureModel.getCyberArkConfig(),
	  url = cyber.api + `Users/`,
	  token, headers, response;
	token = await azureModel.getCyberarkToken(cyber);
	headers = {
	      headers: {
	          Authorization: token || 'na'
	     },
		 httpsAgent: agent
	};

	console.log("url --- ", url);
	await new Promise(async function(innerResolve, innerReject){
		 request.get({url: url, headers: headers},
	        async function optionalCallback(err, httpResponse, searchResult) {
	    	  console.log("searchResult --- ", searchResult);
	          if (0 && err) {//0 && 
	              console.log("err --- ", err)
	              innerResolve(err);
	          }else{
//	        	  searchResult = '{"Users":[{"id":198,"username":"rajesh.ponyaboina@cloud4c.com","source":"CyberArk","userType":"EPVUser","componentUser":false,"vaultAuthorization":[],"location":"","personalDetails":{"firstName":"","middleName":"","lastName":""}}],"Total":1}';
	            var searchBody=JSON.parse(searchResult);
	            console.log("searchBody --- ", searchBody);
	            if(searchBody && searchBody.Users && searchBody.Users.length > 0){
	            	for await (const item of searchBody.Users) {
	            		await new Promise(async function(count_resolve, count_reject) {
		            		let userSql = `select id, email from c4_client_users where email = '${item.username}' limit 1 `;
		        			console.log("userSql --- ", userSql);
		        			let userRows = await dbHandler.executeQueryv2(userSql);
		        	    	console.log("userRows ---- ", userRows, userRows[0].id);
		        	    	if(userRows.length > 0){
		        	    		await dbHandler.updateTableData('c4_client_users',{id:userRows[0].id}, {cyberark_user_id: item.id}, async function(err,result){
//									console.log("err 22222 --- ", err);
		        	    			count_resolve("");
								});
		        	    	}else{
		        	    		count_resolve("");
		        	    	}
	            		});
	            	}
	            	innerResolve("Done");
	            }else{
					 innerResolve("");
	            }
	          }
		 });
	});
}

let getVmInitialPwd = async (reqObj, callback)=>{
	console.log("reqObj ---- ", reqObj);
	if(!reqObj.host_name){
		callback(1, {status: "error", message : "Missing host_name"});
	}
	let sql = `Select *
		    from azure_reusing_hostnames
		    where 1
		    `;
	reqObj.host_name = encodeURIComponent(reqObj.host_name).replace("%40","@")
	sql += ` and host_name = '${reqObj.host_name}' `;
	// sql += ` and host_password <> '' and host_password is not NULL `;
	sql += ' limit 1';
	console.log("hostInfo sql ----- ", sql);
	
	await dbHandler.executeQuery(sql,async function(hostInfo){
		console.log("hostInfo ----- ", hostInfo);
		if(hostInfo && hostInfo.length > 0){
			if(hostInfo[0].host_password){
				host_password = await ucpEncryptDecrypt.ucpDecryptForDb(hostInfo[0].host_password);
				callback(1, {status: "success", message : "VM intial password", value: host_password});
			}else{
				let host_password_plain = await helper.fnGenerateString({passwordPolicy:[
					{characters:"abcdefghijklmnopqrstuvwxyz",minLength:1},
					{characters:"ABCDEFGHIJKLMNOPQRSTUVWXYZ",minLength:1},
					{characters:"0123456789",minLength:1},
					{characters:"@^$_",minLength:1},
					{characters:"0123456789",minLength:1},
					{characters:"@^$_",minLength:1}
				], passwordMinLength: 14});
				host_password = await ucpEncryptDecrypt.ucpEncryptForDb(host_password_plain);
				let updateSql = "update azure_reusing_hostnames set host_password= '"+host_password+"'" +
						" WHERE id = '"+hostInfo[0].id+"'";
				console.log("updateSql --- ", updateSql);
				await db.query(updateSql, (error,rows,fields)=>{
					dbFunc.connectionRelease;
					if(!!error) {
						console.log(error);
					} else {
						callback(1, {status: "success", message : "VM intial password", value: host_password_plain});
					}
				});
			}
		}else{
			callback(1, {status: "error", message : "Host not found"});
		}
	});
}

module.exports={
	revokeVMAccessCron,
	saveUserVmAccessRequests,
	syncCyberarkUserIdsInDb,
	getVmInitialPwd
}
