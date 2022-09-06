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
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');
var md5 = require('md5');
var mail = require("./../../common/mailer.js");
var fs = require('fs');
const jenkinsapi = require('node-jenkins-api');
var jenkinsModel = require("../models/jenkins.model.js");
const env = require('../../config/env');
const commonModel = require('./common.model');

async function getWindowsVmUserAccessList(reqBody) {
	let {my_reportees, resource_groups, user_id, page_num = 1, is_super_admin} = reqBody;
    
    return new Promise(async (resolve,reject) => {

    	let sql = `SELECT vor.*,
	            cu1.email as safe_requested_for
	            FROM azure_user_vm_access_requests as vor 
	            inner join azure_user_vm_access_vm_mapping as vmm on vmm.request_id=vor.id 
	    		inner join c4_client_users as cu1 on cu1.id = vor.cyberArkUserId
	            where 1`;
        sql +=` and vor.approval_status = 3 and is_revoked = 0 `;
        
    	sql +=` and vmm.vm_id = '${reqBody.vmId}' `;
        
        sql +=` order by vor.id desc`;
       
        console.log('SQL =====getWindowsVmUserAccessList',sql);
        dbHandler.executeQuery(sql,async function(data){
            console.log("data", data);
            let returnData = {data}
            resolve(returnData);
        });
    });
}

async function getUserVmAccessRequests(reqBody) {
	let {my_reportees, resource_groups, user_id, page_num = 1, is_super_admin} = reqBody,
    conditions = [];

   page_num = `${((page_num-1) * 20)}`;

    if(typeof user_id =='undefined' || user_id=='' || 
      (!resource_groups && typeof resource_groups !== 'undefined')){
          var response={
            status:"error",
            message:'Missing user_id or no resources mapped to user as team manager'}
	      return response;
    }

//    if (typeof resource_groups !== 'undefined') {
//        conditions.push(`vms.resourceGroup IN (${resource_groups})`)
//    }

    // if (typeof my_reportees !== 'undefined') {
    //     conditions.push(`vor.created_by IN (${my_reportees})`);
    // }
    
    if (!conditions.length) {
        conditions.push('1');
    }
    
    return new Promise(async (resolve,reject) => {

    	let total_records = `SELECT vor.id
            FROM azure_user_vm_access_requests as vor 
            inner join c4_azure_subscriptions as s on s.subscription_id=vor.subscription 
            left join azure_user_vm_access_vm_mapping as vmm on vmm.request_id=vor.id 
            left join azure_vms as vms on vms.vm_detail_id=vmm.vm_id
    		left join c4_vm_details as vm on vm.id = vmm.vm_id
    		inner join c4_client_users as cu on cu.id = vor.created_by
    		inner join c4_client_users as cu1 on cu1.id = vor.cyberArkUserId
    		inner join azure_user_vm_access_approval_logs as al on al.request_id = vor.id 
			left join c4_client_users as cu2 on cu2.id = al.updated_by
            where ${conditions.join(' AND ')}`,
        sql = `SELECT vor.*,vm.status as vm_record_status,
        		s.display_name as subscription_display_name,
	            group_concat(vm.host_name) as host_name,
	            cu.email as order_raised_by,
	            cu1.email as safe_requested_for,
	            LOWER(vor.resourceGroup) as resourceGroup,
	            al.id as log_id, al.request_id, al.approval_status as log_approval_status, 
	            al.approval_matrix_level, cu.email as requested_email, cu2.email as updated_email, 
    			from_unixtime(al.created_date, '%Y-%m-%d %H:%i:%s' ) as requested_date, 
    			from_unixtime(al.updated_date, '%Y-%m-%d %H:%i:%s' ) as updated_date
            FROM azure_user_vm_access_requests as vor 
            inner join c4_azure_subscriptions as s on s.subscription_id=vor.subscription 
            left join azure_user_vm_access_vm_mapping as vmm on vmm.request_id=vor.id 
            left join azure_vms as vms on vms.vm_detail_id=vmm.vm_id
    		left join c4_vm_details as vm on vm.id = vmm.vm_id
    		inner join c4_client_users as cu on cu.id = vor.created_by
    		inner join c4_client_users as cu1 on cu1.id = vor.cyberArkUserId
    		inner join azure_user_vm_access_approval_logs as al on al.request_id = vor.id 
			left join c4_client_users as cu2 on cu2.id = al.updated_by
    	    			
            where ${conditions.join(' AND ')}`;
            
        if(typeof reqBody.approval_status !='undefined' && reqBody.approval_status !=''
          && reqBody.approval_status !='ALL'){
            sql +=` and vor.approval_status = '${reqBody.approval_status}' `;
            total_records += ` and vor.approval_status = '${reqBody.approval_status}' `;
        }
        if(typeof reqBody.searchSubscription !='undefined' && reqBody.searchSubscription !=''){
        	sql +=` and vor.subscription = '${reqBody.searchSubscription}' `;
        	total_records += ` and vor.subscription = '${reqBody.searchSubscription}' `;
        }
        
        if(typeof reqBody.searchResourceGroupName !='undefined' && reqBody.searchResourceGroupName !=''){
        	sql +=` and vor.resourceGroup = '${reqBody.searchResourceGroupName}' `;
        	total_records += ` and vor.resourceGroup = '${reqBody.searchResourceGroupName}' `;
        } else if (is_super_admin != '1' && typeof reqBody.subscription_resource_group_combo !== 'undefined' && reqBody.subscription_resource_group_combo.length > 0 ) {
	    	let cond = [];
	    	for await (const item of reqBody.subscription_resource_group_combo){
	    		cond.push(` (vor.subscription = '${item.split("@$")[0]}' and vor.resourceGroup = '${item.split("@$")[1]}')`);
	    	} 
	    	if(cond.length > 0){
	    		sql += ` and (${cond.join(" or ")}) `;
	    		total_records += ` and (${cond.join(" or ")}) `;
	    	}
        }
        
        if(typeof reqBody.searchOsType !='undefined' && reqBody.searchOsType !=''){
        	sql +=` and vor.osType = '${reqBody.searchOsType}' `;
        	total_records += ` and vor.osType = '${reqBody.searchOsType}' `;
        }
        if(typeof reqBody.searchAppType !='undefined' && reqBody.searchAppType !=''){
        	sql +=` and vor.appType = '${reqBody.searchAppType}' `;
        	total_records += ` and vor.appType = '${reqBody.searchAppType}' `;
        }
        if(typeof reqBody.searchCyberArkUser !='undefined' && reqBody.searchCyberArkUser !=''){
        	reqBody.searchCyberArkUser = encodeURIComponent(reqBody.searchCyberArkUser).replace("%40","@");
        	sql +=` and cu1.email like '%${reqBody.searchCyberArkUser}%' `;
        	total_records += ` and cu1.email like '%${reqBody.searchCyberArkUser}%' `;
        }
        if(typeof reqBody.searchRegion !='undefined' && reqBody.searchRegion !=''){
        	sql +=` and vor.location = '${reqBody.searchRegion}' `;
        	total_records += ` and vor.location = '${reqBody.searchRegion}' `;
        }
        if(typeof reqBody.search_host_name !='undefined' && reqBody.search_host_name !=''){
        	reqBody.search_host_name = encodeURIComponent(reqBody.search_host_name);
        	sql +=` and vm.host_name like '%${reqBody.search_host_name}%' `;
        	total_records += ` and vm.host_name like '%${reqBody.search_host_name}%' `;
        }
        sql +=` group by vor.id order by vor.id desc`;
        total_records +=` group by vor.id order by vor.id desc`;
       
        total_records = `SELECT COUNT(id) as total_records FROM (${total_records}) AS DerivedTableAlias`;
        console.log("total_records ---- ", total_records);
        total_records = await dbHandler.executeQueryv2(total_records);
        total_records = ((total_records || [])[0] || {}).total_records || 0;

        sql += ` limit ${page_num}, 20`;
        console.log('SQL =====getUserVmAccessRequests',sql);
        dbHandler.executeQuery(sql,async function(data){
            //console.log("data");
            //console.log(data);
            
            let returnData = {items:data, total_records}
            resolve(returnData);
        });
    });
}

let updateUserVmAccessRequests = async (reqBody,callback)=> {
	let cts = (new Date().getTime() / 1000);
	console.log("reqBody ---- ", JSON.stringify(reqBody));
    //return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", reqBody});
    return new Promise(async (resolve,reject) => {
    	vmRequestsSql = `select request_obj from azure_user_vm_access_requests where 1 `;
    	vmRequestsSql += ` and id = '${reqBody.request_id}' `;
		vmRequestsSql += ` limit 1`;
		console.log("vmRequestsSql --- ", vmRequestsSql);
		await db.query(vmRequestsSql,async (error,vmRequestsRows,fields)=>{
            dbFunc.connectionRelease;
            if(!!error) {
                console.log("error ---- ", error);
                return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support",error});
                resolve("");
            } else {
            	if(vmRequestsRows.length == 0){
                    return callback(1,{status:"error", message : "Request not found.",error});
                    resolve("");
            	}else{
			    	let frmValueItem = {
			    			request_obj : JSON.stringify(reqBody.request_obj),
			    			updated_by : reqBody.user_id,
			    			updated_date : cts
			    	};
//			    	if(reqBody.request_obj.body.osType == 'Linux'){
//			    		frmValueItem.appType = reqBody.request_obj.body.appType.split("@$")[0];
//			    	}
			    	if(reqBody.request_obj.body.osType == 'Windows'){
			    		frmValueItem.role = reqBody.request_obj.body.role;
			    	}
			    	await dbHandler.updateTableData('azure_user_vm_access_requests',{id:reqBody.request_id},frmValueItem,async function(err,result){
			            console.log(err);
			            let logData = {
                        		request_id : reqBody.request_id,
                        		before_update : JSON.stringify(JSON.parse(vmRequestsRows[0].request_obj).body),
                        		after_update : JSON.stringify(reqBody.request_obj.body),
                        		created_by : reqBody.user_id,
                        		created_date : cts
                        };
//        	                        console.log("logData --- ", JSON.stringify(logData));
                        await db.query("INSERT INTO azure_user_vm_access_request_logs SET ?", logData, async (error,logRows,fields)=>{
                        	dbFunc.connectionRelease;
		                    if(error) {
				                console.log("error ---- ", error);
				                return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support",error});
		                        resolve(error);
		                    } else {
					            resolve(result);
					            callback(err,result);
		                    }
                        });
			        });
            	}
            }
		});
    });
}

let updateUserVmAccessRequestsStatus= async (reqObj,callback)=>{
    console.log("reqObj --- ", JSON.stringify(reqObj));
//    return callback(null,{status:"error", message: "The operation did not execute as expected. Please raise a ticket to support",reqObj});

    let cts = Math.round(new Date().getTime() / 1000),
        approval_status = reqObj.status,
        is_approved = approval_status == 2 ? false : true;
//    let vmid = reqObj.item.log_id;

    try {
       //await dbHandler.insertIntoTable('c4_vm_logs', {vmid, type: is_approved ? 7: 8, description: is_approved ? 'Request approved': 'Request rejected'})
    }
    catch(e) {

    }

    return new Promise(async (resolve,reject) => {
    	let logUpdateData = {
			approval_status : reqObj.status,
			updated_by : reqObj.user_id,
			updated_date : cts
    	};
    	if(reqObj.status == 2){
    		logUpdateData.rejected_comments = reqObj.rejectResonse;
    	}
    	await dbHandler.updateTableData('azure_user_vm_access_approval_logs',{id:reqObj.item.log_id},logUpdateData,async function(err,result){
    		dbFunc.connectionRelease;
    		if(err){
    			console.log(err);
    			return callback(1,{status:"error", message: "The operation did not execute as expected. Please raise a ticket to support"});
    			resolve(err);
    		}else{
    			if(logUpdateData.approval_status == 2){
    				let cartUpdateData = {
						approval_status : logUpdateData.approval_status,
    		    		rejected_comments : reqObj.rejectResonse
    				};
    				await dbHandler.updateTableData('azure_user_vm_access_requests',{id:reqObj.item.request_id},cartUpdateData,async function(err,result){
    					dbFunc.connectionRelease;
    					if(err){
    		    			console.log(err);
    		    			return callback(1,{status:"error", message: "The operation did not execute as expected. Please raise a ticket to support"});
    		    			resolve(err);
    		    		}else{
    		    			return callback(1,{status:"success", message: "Request updated successfully."});
    		    			resolve([]);
    		    		}
    		        });
    			}else{
    				let cartUpdateData = {
    						approval_status : logUpdateData.approval_status
    				};
    				await dbHandler.updateTableData('azure_user_vm_access_requests',{id:reqObj.item.request_id},cartUpdateData,async function(err,result){
    					dbFunc.connectionRelease;
    					if(err){
    		    			console.log(err);
    		    			return callback(1,{status:"error", message: "The operation did not execute as expected. Please raise a ticket to support"});
    		    			resolve(err);
    		    		}else{
    		    			return callback(1,{status:"success", message: "Request updated successfully."});
    		    			resolve([]);
    		    		}
    		        });
    			}
    		}
        });
    });
}

let getAllVmlist = async (reqBody,callback)=> {
	console.log("reqBody --- ", reqBody);
    return new Promise(async (resolve,reject) => {
       var sql=`SELECT vm.*, av.location, av.subscriptionId, av.vmId,av.resourceGroup,
       cu.email as provisioned_by
       from c4_vm_details as vm
       inner join azure_vms as av on av.vm_detail_id = vm.id
       left join c4_azure_resourcegroups as rg on av.resourceGroup = rg.name
       left join c4_client_users as cu on cu.id = vm.createdby
       WHERE vm.clientid=${reqBody.clientid} and vm.cloudid=3 and vm.status=1 and rg.record_status=1 
       and vm.vm_status not in('Deleted','CreationFailed') `;
       
       //left join c4_azure_resourcegroups_users as ru on ru.azure_resourcegroup_id = rg.id
      /* if(typeof reqBody.subscriptions != 'undefined'){
       	sql +=` and av.subscriptionId in(${reqBody.subscriptions}) `;
       }*/
       if(typeof reqBody.searchResourceGroupName != 'undefined' && reqBody.searchResourceGroupName != ''){
           sql += ` and av.resourceGroup = '${reqBody.searchResourceGroupName}'`;
       }
       else if (reqBody.is_super_admin != '1' && typeof reqBody.subscription_resource_group_combo !== 'undefined' && reqBody.subscription_resource_group_combo.length > 0 ) {
	    	let cond = [];
	    	for await (const item of reqBody.subscription_resource_group_combo){
	    		cond.push(` (av.subscriptionId = '${item.split("@$")[0]}' and av.resourceGroup = '${item.split("@$")[1]}')`);
	    	} 
	    	if(cond.length > 0){
	    		sql += ` and (${cond.join(" or ")}) `;
	    	}
       }
//       else if(typeof reqBody.resource_groups != 'undefined'){
//        sql += ` and av.resourceGroup in (${reqBody.resource_groups})`;
//      }
	  if(typeof reqBody.subscriptionId != 'undefined' && reqBody.subscriptionId != ''){
		sql +=` and av.subscriptionId = '${reqBody.subscriptionId}' `;
	  }
//	  if(typeof reqBody.search_user_email != 'undefined'){
//		  reqBody.search_user_email = encodeURIComponent(reqBody.search_user_email);
//		  sql +=` and cu.email like '%${reqBody.search_user_email}%' `;
//	  }
	  if(typeof reqBody.usersList != 'undefined' && reqBody.usersList.length > 0 && reqBody.usersList[0].value.split("@$")[0] != ''){
		  sql +=` and vm.createdby = '${reqBody.usersList[0].value.split("@$")[0]}' `;
	  }
	  if(typeof reqBody.searchRegion != 'undefined' && reqBody.searchRegion != ''){
          sql += ` and av.location = '${reqBody.searchRegion}'`;
      }
	  if(typeof reqBody.searchOsType != 'undefined' && reqBody.searchOsType != ''){
          sql += ` and av.osType = '${reqBody.searchOsType}'`;
      }
	  if(typeof reqBody.search_host_name != 'undefined' && reqBody.search_host_name != ''){
		  reqBody.search_host_name = encodeURIComponent(reqBody.search_host_name);
          sql += ` and vm.host_name like '%${reqBody.search_host_name}%'`;
      }
       /*if(typeof reqBody.user_id != 'undefined' && reqBody.user_id != ''
     		 && (typeof reqBody.user_role == 'undefined' || (typeof reqBody.user_role != 'undefined' && reqBody.user_role != config.ADMIN_ROLE_ID))){
   	      	sql += ` and ru.user_id = '${reqBody.user_id}' `;
       }*/
       sql +=` group by vm.id order by vm.id desc`;
       console.log("sql --- ", sql);
       db.query(sql,async (error,rows,fields)=>{
            if(!!error) {
            	console.log(error);
                dbFunc.connectionRelease;
                callback(1,{message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                // let i = 0;
                // for await (const item of rows) {
                //     rows[i].encodeVal = base64.encode(item.clientid+"_"+item.subscriptionId+"_"+item.vmId);
                //     i++;
                // }
                dbFunc.connectionRelease;
                callback(null,{value:rows});
                resolve(rows)
            }
       });
    });
}

let getStorageSkus = async (reqBody,callback)=> {
    return new Promise((resolve,reject) => {
       var sql=`SELECT ass.*
       from azure_storage_skus as ass
       WHERE ass.clientid='${reqBody.clientid}' and ass.subscription_id='${reqBody.subscription_id}' 
	       and ass.record_status=1 
	       and ass.MaxSizeGiB > 10
	       and ass.name != 'UltraSSD_LRS'
	       and ass.location='${reqBody.location}' `;
//       sql +=` and ass.name='${reqBody.storagetype}' `;
       sql +=` group by ass.size order by ass.size asc `;
       console.log("sql --- ", sql);
       db.query(sql,async (error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                callback(1,{status : "error", message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                callback(null,{status: "success",value:rows});
                resolve(rows)
            }
       });
    });
}

let getVmSupportedSizes = async (reqbody,callback)=> {
	if(!reqbody.subscriptionId)return callback(400,{status: "error", message:'Subscription id is missing'});
	if(!reqbody.resourceGroup)return callback(400,{status: "error", message:'Resource group is missing'});
	if(!reqbody.host_name)return callback(400,{status: "error", message:'Host Name is missing'});
	if(!reqbody.clientid)return callback(400,{status: "error", message:'Client Id is missing'});
	var subscription_id=reqbody.subscriptionId;
	var resourceGroup=reqbody.resourceGroup;
	var host_name=reqbody.host_name;
	var clientId=reqbody.clientid;
	
	new Promise(function(resolve,reject){
	    azureModel.azure_authtoken(clientId,function(error,result){
	        if(error) return resolve([])
	        return resolve(result)
	     })
	}).then(function(token){
	  if(!token){
	    var response={status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:token}
	    return callback([],response);
	  }
	  let url=`https://management.azure.com/subscriptions/${subscription_id}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/${host_name}/vmSizes?api-version=2022-03-01`;
	  console.log("getVmSupportedSizes url --- ", url)
	  request.get({url:url,headers : {
	    "Authorization" :'Bearer '+token.tokendata.access_token,
	    'Content-type': 'application/json'
	    }},
	  async function optionalCallback(err, httpResponse, result) {
	    if (err) {
	        return callback([],{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:err});
	    }else{
	      var body=JSON.parse(result);
//	      console.log(body)
	      if(body.error){
	    	  return callback(null,{status: "error", message:((body.error.message)?body.error.message:'The operation did not execute as expected. Please raise a ticket to support'),data:body})
	      }else{
	    	  if(!body || !body.value){
	    		  body.value = [];
	    	  }
	    	  
	    	  if(body.value.length > 0){
	    		  let supportedSkus = [];
	    		  for await (const item of body.value) {
	    			  supportedSkus.push(item.name);
		    	  }
	    		  reqbody.supportedSkus = supportedSkus;
		    	  azureModel.getVmCatalogs(reqbody,function(error,response){
		    		  return callback(error,response);
		    	  });
	    	  }else{
	    		  return callback(null,{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:{message:"SKUs not found"}});
	    	  }
	      }
	    }
	   });
    })
}

let rerunVmOatChecklist = async (reqbody,callback)=> {
	let cts = Math.round(new Date().getTime() / 1000);
	console.log("reqbody ---- ", JSON.stringify(reqbody));
//	return callback(null,{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',reqbody});
	if(!reqbody.vm_data)return callback(400,{status: "error", message:'VM info is missing'});
	let reqValues = {
		jenkins_job_type : 7,
		created_date: cts,
		user_id : reqbody.requested_user_id
	};
	return db.query("INSERT INTO other_jenkins_requests SET ?", reqValues ,async (error,rows,fields)=>{
    	dbFunc.connectionRelease;
        if(error) {
            console.log(error);
            return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", reqBody});
        } else {
    		let params = {};
    		params.request_ref_id = rows.insertId;
    		params.jenkins_job_type = reqValues.jenkins_job_type;
    		params.region = reqbody.vm_data.vmdetails.dataFromDB.location;
    		params.ansibleip = reqbody.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.selected_ansible_server;
    		params.private_ip_address = reqbody.vm_data.vmdetails.dataFromDB.privateIpAddress;
    		params.virtual_machine_name = reqbody.vm_data.vmdetails.dataFromDB.host_name;
    		params.subscription_id = reqbody.vm_data.vmdetails.dataFromDB.subscriptionId;
    		params.deployment_resource_group_name = reqbody.vm_data.vmdetails.dataFromDB.resourceGroup;
    		params.provision_type = reqbody.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.subscription_provision_type;
    		params.os_type = reqbody.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.os_type;
    		params.db_type = reqbody.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.shared_image_tags["UCP-DB-Type"];
    		params.mw_type = reqbody.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.shared_image_tags["UCP-MW"];
    		params.is_cluster = reqbody.vm_data.vmdetails.dataFromDB.is_cluster;
    		params.shared_image_name = reqbody.vm_data.vmdetails.dataFromDB.os_template_name;
    		if(reqbody.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.dbName){
    			params.dbName = reqbody.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.dbName;
    		}
    		params.weblogic_servicename = ((reqbody.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.weblogicServiceName)?reqbody.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.weblogicServiceName:"");
    		params.ram = reqbody.vm_data.vmdetails.dataFromDB.ram_units_gb;
    		params.requested_domain = config.API_URL;
    		jenkinsModel.triggerJenkinsJob(params,async function(err,result){
	    		console.log("rerunVmOatChecklist result ---- ",result);
	    		await dbHandler.updateTableData('other_jenkins_requests',{id:params.request_ref_id},
    				{
    					jenkins_response_obj:JSON.stringify(result),
    	    		},async function(err,result){
    	            console.log("other_jenkins_requests data updated");
    	        });
	    		return callback(err,result);
	    	});
        }
	});
}

let saveUserOnboarding = async (reqBody,callback)=> {
	let cts = (new Date().getTime() / 1000);
	console.log("reqBody ---- ", reqBody);
//    return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", reqBody});
	if(!reqBody.UserPrincipalName)return callback(400,{status: "error", message:'Email is missing'});
	if(!reqBody.adGroup)return callback(400,{status: "error", message:'AD Group is missing'});
    return new Promise(async (resolve,reject) => {
    	ad_config = await azureModel.getADConfig(),
        auth = await azureModel.getAzureADToken(ad_config);
    	reqBody.UserPrincipalName = reqBody.UserPrincipalName.toLowerCase().trim();
    	let search = reqBody.UserPrincipalName;
    	let adGroupName = reqBody.adGroup.split("@$")[1],
    	adGroupId = reqBody.adGroup.split("@$")[0];

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
	    	let adSearchUrl = `${ad_config.ad_azure_url}groups/${adGroupId}/members/microsoft.graph.user?$count=true&$orderby=displayName&$search="mail:${search}"`;
	    	console.log('adSearchUrl ---- ', adSearchUrl);
	    	let adSearchResponse = await axios.get(adSearchUrl, {
		      headers: {
		        Authorization: 'Bearer ' + auth,
		        ConsistencyLevel: 'eventual'
		      }
		    }).catch(e => {
		      console.log('errrorrrrrrrrrrrrrrrrrrr ---- ', e.message);
		    });
	    	adSearchResponse = ((adSearchResponse || {}).data || {}).value;
	    	console.log("adSearchResponse --- ", adSearchResponse);
	    	
	    	if(adSearchResponse && adSearchResponse.length > 0){
	    		let userSql = `select id, email from c4_client_users where email = '${reqBody.UserPrincipalName}' limit 1 `;
	    		console.log("userSql --- ", userSql);
	    		let userRows = await dbHandler.executeQueryv2(userSql);
            	console.log("userRows ---- ", userRows);
            	if(userRows.length > 0){
            		let userGroupSql = `select id from c4_client_user_groups where user_id = '${userRows[0].id}' and group_id = '${adGroupId}' limit 1`;
    	    		console.log("userGroupSql --- ", userGroupSql);
    	    		let userGroupRows = await dbHandler.executeQueryv2(userGroupSql);
                	console.log("userGroupRows ---- ", userGroupRows);
                	if(userGroupRows.length > 0){
                		return callback(1,{status:"error", message : "User already exists in PVWA AD and UCP", reqBody});
                	}else{
                		db.query("INSERT INTO c4_client_user_groups SET ?", {user_id : userRows[0].id, group_id: adGroupId, created_date : cts, record_status : 1, ad_status : 1} ,async (error,rows,fields)=>{
	  	                	dbFunc.connectionRelease;
	  	                    if(error) {
	  	                        console.log(error);
	  	                      return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", reqBody});
	  	                    }else{
	  	                    	return callback(1,{status:"success", message : "User already exists in PVWA AD and added to UCP", reqBody});
	  	                    }
                    	});
                	}
            	}else{
  	                var userValues = {
  	                    email: reqBody.UserPrincipalName,
  	                    display_name: adSearchResponse[0].displayName,
  	                    mobile: adSearchResponse[0].mobilePhone,
  	                    password: "Ctrls@123",
  	                    clientid: config.DEMO_CLIENT_ID,
	                    client_master_id: config.DEMO_CLIENT_ID,
	                    group_id: adGroupId,
//  	                    user_role: userData.userRole,
//  	                    bu_id: userData.bu_id,
//  	                    otp_status: userData.otp_status,
//  	                    provision_type: userData.provision_type,
  	                    status: 1,
  	                    ad_status : 1,
  	                    createddate: cts,
																							azure_account_id: adSearchResponse?.authTokenResponse?.uniqueId,
  	                    azure_ad_response : JSON.stringify({adSearchResponse}),
	    				azure_account_id :  adSearchResponse[0].id
  	                };
  	                if(config.enable_user_encryption == 1){
  		                userValues.display_name = ((userValues.display_name)?(await ucpEncryptDecrypt.ucpEncryptForDb(userValues.display_name)):"");
  		                userValues.password = ((userValues.password)?(await ucpEncryptDecrypt.ucpEncryptForDb(userValues.password)):"");
  		                userValues.mobile = ((userValues.mobile)?(await ucpEncryptDecrypt.ucpEncryptForDb(userValues.mobile)):"");
  	                }else{
  	                	userValues.password = md5(userValues.password);
  	                }
  	                db.query("INSERT INTO c4_client_users SET ?", userValues ,async (error,rows,fields)=>{
  	                	dbFunc.connectionRelease;
  	                    if(error) {
  	                        console.log(error);
  	                        return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", reqBody});
  	                    } else {
  	                    	db.query("INSERT INTO c4_client_user_groups SET ?", {user_id : rows.insertId, group_id: adGroupId, created_date : cts, record_status : 1, ad_status : 1} ,async (error,rows,fields)=>{
		  	                	dbFunc.connectionRelease;
		  	                    if(error) {
		  	                        console.log(error);
		  	                        return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", reqBody});
		  	                    }else{
		  	                    	return callback(1,{status:"success", message : "User already exists in PVWA AD and added to UCP", reqBody});		  	                    	
		  	                    }
  	                    	});
  	                    }
  	                });
            	}
	    	}else{
	    		console.log("reqBody --- ", reqBody);
	    		
	    		let ojrSql = `select id from other_jenkins_requests 
	    			where 1
		    		and ((jenkins_job_status = 'SUCCESS' and created_date >= '${(Math.floor(Date.now() / 1000)-(1*24*60*60))}') or jenkins_job_status is NULL)
			    	and jenkins_job_type = 5
			    	and ad_group_name = '${adGroupName}'
			    	and ad_email = '${reqBody.UserPrincipalName}' 
			    	order by id desc
	    			limit 1`;
	    		console.log("ojrSql --- ", ojrSql);
	    		let ojrRows = await dbHandler.executeQueryv2(ojrSql);
            	console.log("ojrRows ---- ", ojrRows);
            	if(ojrRows.length > 0){
            		return callback(1,{status:"error", message : "User for this AD Group request already raised, please wait for some time.", reqBody});
            	}else{
		    		let reqValues = {
		    				jenkins_job_type : 5,
		    				created_date: cts,
		    				user_id : reqBody.user_id,
		    				ad_group : adGroupId,
		    				ad_email : reqBody.UserPrincipalName,
		    				ad_group_name : adGroupName,
		    		};
		    		console.log("reqValues --- ", reqValues);
		    		db.query("INSERT INTO other_jenkins_requests SET ?", reqValues ,async (error,rows,fields)=>{
	                	dbFunc.connectionRelease;
	                    if(error) {
	                        console.log(error);
	                        return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", reqBody});
	                    } else {
				    		let params = {};
			        		params.request_ref_id = rows.insertId;
			        		params.jenkins_job_type = 5;
			        		params.ou = adGroupName;
			        		params.group_id = adGroupId;
			        		params.UserPrincipalName = reqBody.UserPrincipalName;
			        		params.requested_domain = config.API_URL;
			        		jenkinsModel.triggerJenkinsJob(params,async function(err,result){
			    	    		console.log("PVWA UserOnboarding result ---- ",result);
			    	    		await dbHandler.updateTableData('other_jenkins_requests',{id:params.request_ref_id},
		    	    				{
		    	    					jenkins_response_obj:JSON.stringify(result),
		    	    	    		},async function(err,result){
		    	    	            console.log("other_jenkins_requests data updated");
		    	    	        });
			    	    		resolve(result);
			    	    		return callback(err,result);
			    	    	});
	                    }
		    		});
		    	}
	    	}
    	}
    });
}

let removeAdUser = async (reqBody,callback)=> {
	let cts = (new Date().getTime() / 1000);
	console.log("reqBody ---- ", reqBody);
//    return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", reqBody});
	if(!reqBody.email)return callback(400,{status: "error", message:'Email is missing'});
	if(!reqBody.ad_group_id)return callback(400,{status: "error", message:'AD Group Id is missing'});
	if(!reqBody.ad_group_name)return callback(400,{status: "error", message:'AD Group Name is missing'});
    return new Promise(async (resolve,reject) => {
    	ad_config = await azureModel.getADConfig(),
        auth = await azureModel.getAzureADToken(ad_config);
    	reqBody.UserPrincipalName = reqBody.email.toLowerCase().trim();
    	let search = reqBody.UserPrincipalName;
    	let adGroupId = reqBody.ad_group_id;
    	let adGroupName = reqBody.ad_group_name;

    	let adSearchUrl = `${ad_config.ad_azure_url}groups/${adGroupId}/members/microsoft.graph.user?$count=true&$orderby=displayName&$search="mail:${search}"`;
    	console.log('adSearchUrl ---- ', adSearchUrl);
    	let adSearchResponse = await axios.get(adSearchUrl, {
	      headers: {
	        Authorization: 'Bearer ' + auth,
	        ConsistencyLevel: 'eventual'
	      }
	    }).catch(e => {
	      console.log('errrorrrrrrrrrrrrrrrrrrr ---- ', e.message);
	    });
    	adSearchResponse = ((adSearchResponse || {}).data || {}).value;
    	console.log("adSearchResponse --- ", adSearchResponse);
    	
    	if(adSearchResponse && adSearchResponse.length > 0){
    		console.log("reqBody --- ", reqBody);
    		let reqValues = {
    				jenkins_job_type : 6,
    				created_date: cts,
    				user_id : reqBody.requested_user_id,
    				ad_group : adGroupId,
    				ad_email : reqBody.UserPrincipalName,
    		};
    		console.log("reqValues --- ", reqValues);
    		db.query("INSERT INTO other_jenkins_requests SET ?", reqValues ,async (error,rows,fields)=>{
            	dbFunc.connectionRelease;
                if(error) {
                    console.log(error);
                    return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", reqBody});
                } else {
		    		let params = {};
	        		params.request_ref_id = rows.insertId;
	        		params.jenkins_job_type = 6;
	        		params.ou = adGroupName;
	        		params.group_id = adGroupId;
	        		params.UserPrincipalName = reqBody.UserPrincipalName;
	        		params.requested_domain = config.API_URL;
	        		jenkinsModel.triggerJenkinsJob(params,async function(err,result){
	    	    		console.log("AD UserOffboarding result ---- ",result);
	    	    		await dbHandler.updateTableData('other_jenkins_requests',{id:params.request_ref_id},
    	    				{
    	    					jenkins_response_obj:JSON.stringify(result),
    	    	    		},async function(err,result){
    	    	            console.log("other_jenkins_requests data updated");
    	    	        });
	    	    		resolve(result);
	    	    		return callback(err,result);
	    	    	});
                }
    		});
    	}else{
    		await dbHandler.updateTableData('c4_client_user_groups',{id : reqBody.user_group_id},{record_status : 0},async function(err,result){
                console.log("err --- ", err);
            });
    		return callback(1,{status:"success", message : "User already removed from this AD group and updated in UCP", reqBody});
    	}
    });
}

let syncAdUserRequests = async (reqBody)=> {
	let cts = (new Date().getTime() / 1000);
	console.log("reqBody ---- ", reqBody);
    return new Promise(async (resolve,reject) => {
    	ad_config = await azureModel.getADConfig(),
        auth = await azureModel.getAzureADToken(ad_config);
    	
    	let reqSql = `select jenkins_request_obj, ad_group, ad_email, user_id, id 
    					from other_jenkins_requests 
				    	where jenkins_job_type = 5 and is_email_sent = 0 
				    	order by id desc limit 100`;
		console.log("reqSql --- ", reqSql);
		let reqRows = await dbHandler.executeQueryv2(reqSql);
    	console.log("reqRows ---- ", reqRows);
    	for await (const item of reqRows) {
    		await new Promise(async (innerResolve, innerReject) => {
	    		item.jenkins_request_obj = JSON.parse(item.jenkins_request_obj);
		
		    	let adSearchUrl = `${ad_config.ad_azure_url}groups/${item.jenkins_request_obj.group_id}/members/microsoft.graph.user?$count=true&$orderby=displayName&$search="mail:${item.jenkins_request_obj.UserPrincipalName}"`;
		    	console.log('adSearchUrl ---- ', adSearchUrl);
		    	let adSearchResponse = await axios.get(adSearchUrl, {
			      headers: {
			        Authorization: 'Bearer ' + auth,
			        ConsistencyLevel: 'eventual'
			      }
			    }).catch(e => {
			      console.log('errrorrrrrrrrrrrrrrrrrrr ---- ', e.message);
			    });
		    	adSearchResponse = ((adSearchResponse || {}).data || {}).value;
		    	console.log("adSearchResponse --- ", adSearchResponse);
		    	
		    	if(adSearchResponse && adSearchResponse.length > 0){
		    		
		    		//send the email notification on user on-boarding
		    		let reqUserSql = `select id, email from c4_client_users as cu
                    	where cu.id = '${item.user_id}'
                    	`;
                    let reqUserDetails = await dbHandler.executeQueryv2(reqUserSql);
                    commonModel.getEmailTemplate({template_key:"USER_ON_BOARDING"},async function(error,emailTempRow){
                		console.log("emailTempRow --- ",JSON.stringify(emailTempRow));
                		console.log("reqUserDetails --- ",reqUserDetails);
                		if(reqUserDetails.length > 0
                				&& emailTempRow.data){
    	                    let subject = emailTempRow.data.email_subject+ " - "+item.jenkins_request_obj.UserPrincipalName;
                            let mailbody = emailTempRow.data.email_body;

                            let vmTable = "<table border='1'><thead><tr><th>Email</th><th>AD Group Name</th></tr></thead>";
                        	vmTable+=`<tr><td>${item.jenkins_request_obj.UserPrincipalName}</td><td>${item.jenkins_request_obj.ou}</td></tr>`;
                            vmTable+=`</table>`;
                            mailbody = mailbody.replace("{{USER_INFO}}", vmTable);
                            subject = subject.replace("{{AD_GROUP}}", item.jenkins_request_obj.ou);
                            
	                        mail.mail({subject : subject, messageBody : mailbody, tomail : item.jenkins_request_obj.UserPrincipalName, ccmails : reqUserDetails[0].email});
    	                    resolve("Done");
                		}else{
                			resolve("Done");
                		}
                	});
                    dbHandler.updateTableData('other_jenkins_requests',{id:item.id},{is_email_sent:1},function(err,result){
                		console.log(err)
                    });
		    		
		    		let userSql = `select id, email from c4_client_users where email = '${item.jenkins_request_obj.UserPrincipalName}' limit 1 `;
		    		console.log("userSql --- ", userSql);
		    		let userRows = await dbHandler.executeQueryv2(userSql);
	            	console.log("userRows ---- ", userRows);
	            	if(userRows.length > 0){
	            		let userGroupSql = `select id from c4_client_user_groups where user_id = '${userRows[0].id}' and group_id = '${item.jenkins_request_obj.group_id}' limit 1`;
	    	    		console.log("userGroupSql --- ", userGroupSql);
	    	    		let userGroupRows = await dbHandler.executeQueryv2(userGroupSql);
	                	console.log("userGroupRows ---- ", userGroupRows);
	                	if(userGroupRows.length > 0){
	                		innerResolve({status:"error", message : "User already exists in PVWA AD and UCP"});
	                	}else{
	                		db.query("INSERT INTO c4_client_user_groups SET ?", {user_id : userRows[0].id, group_id: item.jenkins_request_obj.group_id, created_date : cts} ,async (error,rows,fields)=>{
		  	                	dbFunc.connectionRelease;
		  	                    if(error) {
		  	                        console.log(error);
		  	                      innerResolve({status:"error", message : "The operation did not execute as expected. Please raise a ticket to support"});
		  	                    }else{
		  	                    	innerResolve({status:"success", message : "User already exists in PVWA AD and added to UCP"});
		  	                    }
	                    	});
	                	}
	            	}else{
	  	                var userValues = {
	  	                    email: item.jenkins_request_obj.UserPrincipalName,
	  	                    display_name: adSearchResponse[0].displayName,
	  	                    mobile: adSearchResponse[0].mobilePhone,
	  	                    password: "Ctrls@123",
	  	                    clientid: config.DEMO_CLIENT_ID,
		                    client_master_id: config.DEMO_CLIENT_ID,
		                    group_id: item.jenkins_request_obj.group_id,
	//  	                    user_role: userData.userRole,
	//  	                    bu_id: userData.bu_id,
	//  	                    otp_status: userData.otp_status,
	//  	                    provision_type: userData.provision_type,
	  	                    status: 1,
	  	                    createddate: cts,
																								azure_account_id: adSearchResponse?.authTokenResponse?.uniqueId,
	  	                    azure_ad_response : JSON.stringify({adSearchResponse}),
		    				azure_account_id :  adSearchResponse[0].id
	  	                };
	  	                if(config.enable_user_encryption == 1){
	  		                userValues.display_name = ((userValues.display_name)?(await ucpEncryptDecrypt.ucpEncryptForDb(userValues.display_name)):"");
	  		                userValues.password = ((userValues.password)?(await ucpEncryptDecrypt.ucpEncryptForDb(userValues.password)):"");
	  		                userValues.mobile = ((userValues.mobile)?(await ucpEncryptDecrypt.ucpEncryptForDb(userValues.mobile)):"");
	  	                }else{
	  	                	userValues.password = md5(userValues.password);
	  	                }
	  	                db.query("INSERT INTO c4_client_users SET ?", userValues ,async (error,rows,fields)=>{
	  	                	dbFunc.connectionRelease;
	  	                    if(error) {
	  	                        console.log(error);
	  	                        innerResolve({status:"error", message : "The operation did not execute as expected. Please raise a ticket to support"});
	  	                    } else {
	  	                    	db.query("INSERT INTO c4_client_user_groups SET ?", {user_id : rows.insertId, group_id: item.jenkins_request_obj.group_id, created_date : cts} ,async (error,rows,fields)=>{
			  	                	dbFunc.connectionRelease;
			  	                    if(error) {
			  	                        console.log(error);
			  	                        innerResolve({status:"error", message : "The operation did not execute as expected. Please raise a ticket to support"});
			  	                    }else{
			  	                    	innerResolve({status:"success", message : "User already exists in PVWA AD and added to UCP"});		  	                    	
			  	                    }
	  	                    	});
	  	                    }
	  	                });
	            	}
		    	}else{
		    		innerResolve("");
		    	}
	    	});
    	}
    });
}

let saveVmOpsRequests = async (reqBody,callback)=> {
	let cts = (new Date().getTime() / 1000);;
	console.log("reqBody ---- ", reqBody);
	if (reqBody.request_type === 'Decommission') {
		let is_vm_locked = await dbHandler.executeQueryv2(`select * from c4_vm_details as vd where vd.id = '${reqBody.vm_id}' AND vd.is_locked=1`);

		if (is_vm_locked.length) {
			return callback(1,{status:"error", message : "Selected VM is in locked state"});
		}
	}
//    return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", reqBody});
    return new Promise(async (resolve,reject) => {
		vmOpsSql = `select id, request_type, approval_status from azure_vm_ops_requests where vm_id = '${reqBody.vm_id}' and approval_status in (0,1) `;
		console.log("vmOpsSql --- ", vmOpsSql);
		await db.query(vmOpsSql,async (error,vmOpsRows,fields)=>{
            dbFunc.connectionRelease;
            if(!!error) {
                console.log("error ---- ", error);
                return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support",error});
                resolve("");
            } else {
            	console.log("vmOpsRows ---- ", vmOpsRows);
            	if(vmOpsRows.length > 0){
                    return callback(1,{status:"error", message : "One of the request "+vmOpsRows[0].request_type+" is waiting for "+((vmOpsRows[0].approval_status == 0)?"approval":"provision")+" at manager side to this VM, You can't raise new request till this completion.",error});
                    resolve("");
            	}else{
            		switch(reqBody.request_type){
	//        	        case 'stop': vm_status='PoweredOff'; action_no=2;break;
	//        	        case 'start': vm_status='Running'; action_no=1;break;
	        	        case 'restart': vm_status='Running'; action_no=4;break;
	        	        case 'Decommission': vm_status='Deleted'; action_no=3;break;
	        	        case 'Re-Size': vm_status='Resize'; action_no=5;break;
	        	        case 'Add New Disk': vm_status='Add New Disk'; action_no=6;break;
	        	    }
            		if(action_no == 6){
	            		let vmCreationSql = `select id from c4_vm_creation where request_type = 2 and job_name is not NULL and jenkins_status is NULL and vm_id = '${reqBody.vm_id}' limit 1`;
	    	    		console.log("vmCreationSql --- ", vmCreationSql);
	    	    		let vmCreationRows = await dbHandler.executeQueryv2(vmCreationSql);
	                	console.log("vmCreationRows ---- ", vmCreationRows);
	                	if(vmCreationRows.length > 0){
	                		return callback(1,{status:"error", message : "One of the request "+reqBody.request_type+" is under provision, You can't raise new request till this completion."});
	                        resolve("");
	                	}
            		}
	            	var insertArr={
	                    vmid:reqBody.vm_id,
	                    type:action_no,
	                    description: "VM "+reqBody.request_type+" requested",
	                    createddate:parseInt(new Date()/1000),
	                    clientid:reqBody.clientid,
	                    createdby : reqBody.user_id
	                }
	                await new Promise(function (resolve, reject) {
	                    dbHandler.insertIntoTable('c4_vm_logs',insertArr,function(err,result){
	                        resolve(result)
	                    })
	                });
	            	
	            	let frmValueItem = {
	            			request_type : reqBody.request_type,
	            			ref_type : reqBody.ref_type,
	            			vm_id : reqBody.vm_id,
	            			request_url : reqBody.request_url,
	            			request_obj : JSON.stringify(reqBody.request_obj),
	            			created_by : reqBody.user_id,
	            			created_date : cts
	            	};
	            	db.query("INSERT INTO azure_vm_ops_requests SET ?", frmValueItem ,async (error,orderRows,fields)=>{
	                	console.log("orderRows --- ", orderRows);
	                	dbFunc.connectionRelease;
	                    if(error) {
	                    	console.log("error ---- ", error);
	                        return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support", error});
	                        resolve(error);
	                    } else {
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
	        	                        await db.query("INSERT INTO azure_vm_ops_approval_logs SET ?", logData, async (error,logRows,fields)=>{
	        	                        	dbFunc.connectionRelease;
	        			                    if(error) {
	        					                console.log("error ---- ", error);
	        					                return callback(1,{status:"error", message : "The operation did not execute as expected. Please raise a ticket to support",error});
	        			                        resolve(error);
	        			                    } else {
	        			                        await dbHandler.updateTableData('azure_vm_ops_requests',{id:orderRows.insertId},{approval_status:0, pending_at : levelRows[0].approval_matrix_level},async function(err,result){
	                                                console.log(err);
	                                            });
	        			                        let vmSql = `select *, s.display_name as subscriptionLabel from c4_vm_details as vd
	        			                        	inner join azure_vms as av on av.vm_detail_id = vd.id
	        			                        	inner join c4_azure_subscriptions as s on s.subscription_id = av.subscriptionId
	        			                        	where vd.id = '${reqBody.vm_id}'
	        			                        	`;
	        			                        let vmDetails = await dbHandler.executeQueryv2(vmSql);
	        			                        commonModel.getEmailTemplate({template_key:"VM_OPERATIONS_REQUEST"},async function(error,emailTempRow){
	        			                    		console.log("emailTempRow --- ",JSON.stringify(emailTempRow));
	        			                    		console.log("vmDetails --- ",vmDetails);
	        			                    		console.log("reqObj.userDetails --- ",JSON.stringify(reqBody.userDetails));
	        			                    		if(vmDetails.length > 0
	        			                    				&& reqBody.userDetails
	        			                    				&& emailTempRow.data){
	        			                	    		db.query(`SELECT cu.email FROM c4_azure_subscription_locations as asl 
	        			                	                    inner join c4_azure_resourcegroups as arg on (asl.id = arg.location_id )
	        			                	                    inner join resource_group_mapping as rgm on ( rgm.role_id = 3 and arg.id = rgm.resource_group)
	        			                                        inner join resource_group as rg on rgm.resource_group_id = rg.id
	        			                	                    inner join c4_client_users as cu on rg.user_id = cu.id
	        			                	            		where cu.status = 1 and asl.subscription_id = '${vmDetails[0].subscriptionId}' and arg.name ='${vmDetails[0].resourceGroup}' order by cu.email asc`,async function(error,emailRows,fields){
	        			                	                if(!!error) {
	        			                	                    dbFunc.connectionRelease;
	        			                	                    callback(1,{"message":"The operation did not execute as expected. Please raise a ticket to support"});
	        			                	                    resolve(error);
	        			                	                } else {
	        			                	                    dbFunc.connectionRelease;
	        			                	                    console.log("emailRows --- ",JSON.stringify(emailRows));
	        			                	                    let subject = emailTempRow.data.email_subject+ ((vmDetails[0].host_name)?" - "+vmDetails[0].host_name:"");
	        			                                        let mailbody = emailTempRow.data.email_body;

	        			                                        let vmTable = "";
	        			                                        for await ( const vmItem of vmDetails ) {
	        			                                        	if(vmItem.vm_creation_request_obj && vmItem.search_code){
	        			                                                let vm = JSON.parse(vmItem.vm_creation_request_obj);
	        			                                            	vmTable+=`<h3>#1 : VM Information</h3>`;
	        			                                            	vmTable+=`<table border='1'><tr><td>VM Name</td><td>${vm.virtual_machine_name}</td></tr>`;
//	        			                                          		vmTable+=`<tr><td>Subscription Provision Type</td><td>${vm.subscription_provision_type}</td></tr>`;
	        			                                          		vmTable+=`<tr><td>vCPUS</td><td>${vm.cpus}</td></tr>`;
	        			                                          		vmTable+=`<tr><td>Memory</td><td>${(vm.ram/1024)} GB</td></tr>`;
	        			                                          		vmTable+=`<tr><td>OS Storage</td><td>${vm.disksize} GB</td></tr>`;
	        			                                          		vmTable+=`<tr><td>Subscription</td><td>${((vm.selectedSubscriptionLabel)?vm.selectedSubscriptionLabel:"")}</td></tr>`;
	        			                                          		vmTable+=`<tr><td>VM Resource Group</td><td>${vm.deployment_resource_group_name}</td></tr>`;
	        			                                          		vmTable+=`<tr><td>Region</td><td>${((vm.selected_network_location_name)?vm.selected_network_location_name:"")}</td></tr>`;
//	        			                                          		vmTable+=`<tr><td>Network Resource Group Name</td><td>${vm.network_resource_group_name}</td></tr>`;
	        			                                          		vmTable+=`<tr><td>Network Identify</td><td>${config.network_identify_arr[vm.network_identify]}</td></tr>`;
	        			                                          		vmTable+=`<tr><td>Virtual Network Name</td><td>${vm.virtual_network_name}</td></tr>`;
//	        			                                          		vmTable+=`<tr><td>Subnet Name</td><td>${vm.subnet_name}</td></tr>`;
//	        			                                          		vmTable+=`<tr><td>NIC Name</td><td>${vm.nic_name}</td></tr>`;
	        			                                          		vmTable+=`<tr><td>Private IP Address</td><td>${((vm.private_ip_address)?vm.private_ip_address:"")}</td></tr>`;
	        			                                          		vmTable+=`<tr><td>Managed Disk Name</td><td>${vm.managed_disk_name}</td></tr>`;
	        			                                            	vmTable+=`<tr><td>Managed Disk Host Caching</td><td>${vm.managed_disk_host_caching}</td></tr>`;
	        			                                            	vmTable+=`<tr><td>Managed Disk SKU</td><td>${vm.managed_disk_storage_size}</td></tr>`;
	        			                                            	vmTable+=`<tr><td>Managed Disk Size</td><td>${vm.managed_disk_size}</td></tr>`;
	        			                                            	vmTable+=`<tr><td>Managed Disk Size Storage Account Type</td><td>${vm.managed_disk_size_storage_account_type}</td></tr>`;
	        			                                                vmTable+=`<tr><td>Zone</td><td>${((vm.zone)?vm.zone:"")}</td></tr>`;
	        			                                                vmTable+=`<tr><td>Availability Set Name</td><td>${((vm.availability_set_name)?vm.availability_set_name:"")}</td></tr>`;
	        			                            	                vmTable+=`<tr><td>Environment</td><td>${vm.environment}</td></tr>`;
//	        			                            	                vmTable+=`<tr><td>System Type</td><td>${vm.system_type}</td></tr>`;
//	        			                            	                vmTable+=`<tr><td>Storage Account Name</td><td>${vm.storage_account_name}</td></tr>`;
//	        			                            	                vmTable+=`<tr><td>Ansible IP</td><td>${vm.selected_ansible_server}</td></tr>`;
	        			                            	                vmTable+=`<tr><td>Is Cluster</td><td>${(vm.is_cluster?"Yes":"No")}</td></tr>`;
	        			                                                if(vm.is_cluster == 1){ 
	        			                                            		vmTable+=`<tr><td>VM 1 NIC Name 2</td><td>${vm.nic_name2}</td></tr>`;
	        			                                                	vmTable+=`<tr><td>VM 2 Name</td><td>${vm.virtual_machine_name2}</td></tr>`;
//	        			                                                	vmTable+=`<tr><td>VM 2 Subnet Name</td><td>${vm.subnet1_name}</td></tr>`;
//	        			                                                	vmTable+=`<tr><td>VM 2 NIC Name 1</td><td>${vm.nic_name3}</td></tr>`;
	        			                                                	vmTable+=`<tr><td>VM 2 Private IP Address</td><td>${((vm.private_ip_address2)?vm.private_ip_address2:"")}</td></tr>`;
	        			                                                	vmTable+=`<tr><td>VM 2 NIC Name 2</td><td>${vm.nic_name4}</td></tr>`;
	        			                                                	vmTable+=`<tr><td>VM 2 Managed Disk Name</td><td>${vm.managed_disk_name2}</td></tr>`;
	        			                                                	vmTable+=`<tr><td>VM 2 Managed Disk Host Caching</td><td>${vm.managed_disk_host_caching2}</td></tr>`;
	        			                                                	vmTable+=`<tr><td>VM 2 Managed Disk SKU</td><td>${vm.managed_disk_storage_size2}</td></tr>`;
	        			                                                	vmTable+=`<tr><td>VM 2 Managed Disk Size</td><td>${vm.managed_disk_size2}</td></tr>`;
	        			                                                	vmTable+=`<tr><td>VM 2 Managed Disk Size Storage Account Type</td><td>${vm.managed_disk_size_storage_account_type2}</td></tr>`;
	        			                                                	vmTable+=`<tr><td>VM 2 Zone</td><td>${((vm.zone2)?vm.zone2:"")}</td></tr>`;
	        			                                                	vmTable+=`<tr><td>VM 2 Availability Set Name</td><td>${((vm.availability_set_name2)?vm.availability_set_name2:"")}</td></tr>`;
	        			                                                }
	        			                                                if(vm.gallery_name){
//	        			                                                  	vmTable+=`<tr><td>Gallery Name</td><td>${vm.gallery_name}</td></tr>`;
	        			                                                }  
	        			                                                if(vm.managed_infra_subscription_id){
//	        			                                                  	vmTable+=`<tr><td>Managed Infra Subscription ID</td><td>${vm.managed_infra_subscription_id}</td></tr>`;
	        			                                                }
	        			                                                if(vm.shared_image_name){
	        			                                                  	vmTable+=`<tr><td>Template Name</td><td>${vm.shared_image_name}</td></tr>`;
	        			                                                }
	        			                                                if(vm.shared_image_version){
//	        			                                                  	vmTable+=`<tr><td>Template Version</td><td>${vm.shared_image_version}</td></tr>`;
	        			                                                }
	        			                                                if(vm.backup_resource_group_name){
//	        			                                                  	vmTable+=`<tr><td>Backup Resource group</td><td>${vm.backup_resource_group_name}</td></tr>`;
	        			                                                }
	        			                                                if(vm.recovery_vault_name){
//	        			                                                  	vmTable+=`<tr><td>Backup Vault Name</td><td>${vm.recovery_vault_name}</td></tr>`;
	        			                                                }
	        			                                                if(vm.backup_policy){
//	        			                                                  	vmTable+=`<tr><td>Backup Policy</td><td>${((vm.backup_policy.toLowerCase().indexOf("gold") >= 0)?"GOLD":((vm.backup_policy.toLowerCase().indexOf("silver") >= 0)?"SILVER":((vm.backup_policy.toLowerCase().indexOf("bronze") >= 0)?"BRONZE":vm.backup_policy)))}</td></tr>`;
	        			                                                }
	        			                                                if(vm.db_full_backup){
//	        			                                                  	vmTable+=`<tr><td>DB Full Backup Policy</td><td>${vm.db_full_backup}</td></tr>`;
	        			                                                }
	        			                                                if(vm.db_log_backup){
//	        			                                                  	vmTable+=`<tr><td>DB Log Backup Policy</td><td>${vm.db_log_backup}</td></tr>`;
	        			                                                }
	        			                                                if(vm.db_backup){
//	        			                                                  	vmTable+=`<tr><td>DB Backup Policy</td><td>${vm.db_backup}</td></tr>`;
	        			                                                }
//	        			                                                if(vm.cyberark_usernames){
//	        			                                                  	vmTable+=`<tr><td>Cyberark Usernames</td><td>${vm.cyberark_usernames}</td></tr>`;
//	        			                                                }
	        			                                                if(vm.disk_encryption_name){
//	        			                                                  	vmTable+=`<tr><td>Disk Encryption Name</td><td>${vm.disk_encryption_name}</td></tr>`;
	        			                                                }
	        			                                                if(vm.disk_encryption_resource_group_name){
//	        			                                                  	vmTable+=`<tr><td>Disk Encryption Resource Group Name</td><td>${vm.disk_encryption_resource_group_name}</td></tr>`;
	        			                                                }
	        			                                                vmTable+=`</table>`;
	        			                                        	}else{
	        			                                        		vmTable+=`<h3>#1 : VM Information</h3>`;
	        			                                            	vmTable+=`<table border='1'><tr><td>VM Name</td><td>${vmItem.host_name}</td></tr>`;
//	        			                                          		vmTable+=`<tr><td>Subscription Provision Type</td><td>${vmItem.subscription_provision_type}</td></tr>`;
	        			                                          		vmTable+=`<tr><td>vCPUS</td><td>${vmItem.cpu_units}</td></tr>`;
	        			                                          		vmTable+=`<tr><td>Memory</td><td>${vmItem.ram_units_gb} GB</td></tr>`;
	        			                                          		vmTable+=`<tr><td>Subscription</td><td>${((vmItem.subscriptionLabel)?vmItem.subscriptionLabel:"")}</td></tr>`;
	        			                                          		vmTable+=`<tr><td>VM Resource Group</td><td>${vmItem.resourceGroup}</td></tr>`;
	        			                                          		vmTable+=`<tr><td>Region</td><td>${((vmItem.location)?vmItem.location:"")}</td></tr>`;
	        			                                          		vmTable+=`<tr><td>Template Name</td><td>${vmItem.os_template_name}</td></tr>`;
	        			                                          		vmTable+=`</table>`;
	        			                                        	}
	        			                                    	}
	        			                                        mailbody = mailbody.replace("{{HOST_INFO}}", vmTable);
	        			                                        mailbody = mailbody.replace("{{REQUEST_TYPE}}", reqBody.request_type);
	        			                                        mailbody = mailbody.replace("{{REQUESTED_DOMAIN}}", config.FRONTEND_URL.replace("#/",""));
	        			                                        subject = subject.replace("{{REQUEST_TYPE}}", reqBody.request_type);
	        			                                        
	        			                	                    if (emailRows.length > 0) {
	        			                	                        let emailsList = [];
	        			                	                        for ( var index in emailRows ) {
	        			                	                    		  emailsList.push(emailRows[index].email); 
	        			                	                    	}
	        			                	                        console.log("emailsList --- ",JSON.stringify(emailsList));
	        			                	                        mail.mail({subject : subject, messageBody : mailbody, tomail : emailsList.join(","), ccmails : reqBody.userDetails.email});
	        			                	                    }else{
	        			                	                    	mail.mail({subject : subject, messageBody : mailbody,tomail : reqBody.userDetails.email});
	        			                	                    }
	        			                	                    resolve("Done");
	        			                	                    return callback(1,{status:"success", message : "Request Submitted Successfully."});
	        			                	                }
	        			                	            });
	        			                    		}else{
	        			                    			resolve("Done");
	        			                    			return callback(1,{status:"success", message : "Request Submitted Successfully."});
	        			                    		}
	        			                    	});
//	        			                        resolve(logRows);
//	        					                return callback(1,{status:"success", message : "Request Submitted Successfully."});
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

function getAllNetwork(clientid) {
    return new Promise((resolve,reject) => {
       var sql=`SELECT n.* from azure_networks as n
       INNER JOIN c4_azure_subscriptions as s ON (n.subscriptionId = s.subscription_id and n.clientid = s.clientid)
       WHERE n.clientid=${clientid} AND
       s.state = 'Enabled' and s.record_status = 1 and n.status=1 order by n.name asc`;
       console.log(sql);
       db.query(sql,(error,rows,fields)=>{
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

function vmLogs(clientid,vmid) {
    return new Promise((resolve,reject) => {
       var sql=`SELECT * from c4_vm_logs WHERE vmid=${vmid} and clientid=${clientid} order by createddate desc`;
       db.query(sql,(error,rows,fields)=>{
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

function getVmDetailbyId(clientid,vm_id) {
    return new Promise((resolve,reject) => {
        var sql=`SELECT vm.*,'NA' as location from c4_vm_details as vm WHERE vm.id=${vm_id} and vm.clientid=${clientid}`;
        db.query(sql,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                var result={vm:rows[0],jobdata:[]} 
                resolve(result)              
            }
       });
    });  
}

function vmOperations(reqObj,callback){
    var clientid=base64.decode(reqObj.clientid);
    var ref_id=base64.decode(reqObj.ref_id);
    var vm_id=base64.decode(reqObj.vm_id);
    new Promise((resolve,reject) => {
        var sql=`select * from c4_vm_details as vm where vm.clientid=${clientid} and vm.id=${vm_id} and vm.cloudid=3`
        dbHandler.executeQuery(sql,function(result){
            resolve(result)
        })
    }).then(async function(vmInfo){
        if(!vmInfo)return callback(null,{status :"error",success:0,message:'The operation did not execute as expected. Please raise a ticket to support'});
        let postParams = { "ref_id": ref_id, "action": reqObj.action,"user_id":clientid};
        let vm_status='';var action_no=0;
        switch(reqObj.action){
            case 'stop': vm_status='PoweredOff';action_no=2;break;
            case 'start': vm_status='Running';action_no=1;break;
            case 'restart': vm_status='Running';action_no=4;break;
            case 'delete':
            	return callback(null,{status :"error",success:0,message:'Access denied',data:[]});
//            	vm_status='Deleted';
//            	action_no=3;
            	break;
        }
        var insertArr={
            vmid:vm_id,
            type:action_no,
            description:reqObj.action+" - "+vm_status+' VM Completed',
            createddate:parseInt(new Date()/1000),
            clientid:clientid,
            createdby : reqObj.request_processed_user_id
        }
        await new Promise(function (resolve, reject) {
            dbHandler.insertIntoTable('c4_vm_logs',insertArr,function(err,result){
                resolve(result)
            })
        });
        var obj={
            actionName:reqObj.action,
            ref_id:ref_id,
            user_id:clientid,
            
        }
        await azureModel.vmOperations(obj,function(error,response){
            dbHandler.updateTableData('c4_vm_details',{id:vm_id},{vm_status:vm_status},function(err,result){
                return callback(null,response);
            })
        })
        
    })
}

let getAzureResourceGroups = async (reqObj,callback)=>{
    console.log(reqObj);
    console.log('Subscription Assigned: ',reqObj.subscriptions);
    console.log('Resource groups Assigned: ',reqObj.resource_groups);
    return new Promise(async function(resolve,reject) {
    	let rg_ids = [];
    	if(reqObj.type && reqObj.type == "User_Role_Form" && reqObj.resource_user_id){
    		rgSql =`select rgm.resource_group from resource_group as rg 
    		 left join resource_group_mapping rgm on rg.id = rgm.resource_group_id
    		 where rg.user_id = '${reqObj.resource_user_id}' AND rgm.resource_group NOT NULL`;
        	let userRGDetails = await dbHandler.executeQueryv2(rgSql);
        	if(userRGDetails.length > 0){
        		for await (const item of userRGDetails){
        			rg_ids.push(item.resource_group);
        		}
        	}
        }
        
        let sql = `select rg.*, l.name as location_name, l.display_name as location_display_name, 
        l.subscription_id, bu.bu_name, s.display_name as subscription_display_name
        from c4_azure_resourcegroups as rg
        inner join c4_azure_subscription_locations as l on l.id = rg.location_id
        inner join c4_azure_subscriptions as s on s.subscription_id = l.subscription_id
        left join bu_info as bu on bu.id = rg.bu_id`;
        sql +=` where  s.clientid = '${reqObj.clientid}' 
        	and s.state='Enabled' 
        	and s.record_status = 1 
        	and rg.record_status = 1
        	`;
        if(rg_ids.length > 0){
        	sql +=` and rg.id not in (${rg_ids.join(",")}) `;
        }
        //left join c4_azure_resourcegroups_users as ru on ru.azure_resourcegroup_id = rg.id
        if(reqObj.subscription_id){
        	reqObj.subscription_id = helper.strEscape(reqObj.subscription_id);
        	sql +=` and s.subscription_id = '${reqObj.subscription_id}' `;
        }
        /*if(typeof reqObj.user_id != 'undefined' && reqObj.user_id != ''
   		 && (typeof reqObj.user_role == 'undefined' || (typeof reqObj.user_role != 'undefined' && reqObj.user_role != config.ADMIN_ROLE_ID))){
 	      	sql += ` and ru.user_id = '${reqObj.user_id}' `;
     	}*/
//         if(typeof reqObj.resource_groups != 'undefined'){
//            sql += ` and rg.name in(${reqObj.resource_groups})`;
//          }
         if (reqObj.is_super_admin != '1' && typeof reqObj.subscription_resource_group_combo !== 'undefined' && reqObj.subscription_resource_group_combo.length > 0 ) {
         	let cond = [];
         	for await (const item of reqObj.subscription_resource_group_combo){
         		cond.push(` (s.subscription_id = '${item.split("@$")[0]}' and rg.name = '${item.split("@$")[1]}')`);
         	} 
         	if(cond.length > 0){
         		sql += ` and (${cond.join(" or ")})`;
         	}
         }
        sql +=` group by rg.id order by rg.id DESC `;
        console.log("sql ------------------------ ", sql);
        db.query(sql,async function(error,items,fields){
        	dbFunc.connectionRelease;
            if(!!error) {
                callback(1,{message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                i= 0;
            	for await (const item of items) {
            		let resourceObj = JSON.parse(items[i].response_obj);
            		if(items[i]){
	            		items[i].mapped_users = [];
	            		items[i].mapped_user_ids = [];
	            		items[i].is_backup = "No";
	            		items[i].is_storage = "No";
	            		items[i].Virtual_Machines = "No"
            		}
            		if(resourceObj.tags && resourceObj.tags.Boot_Diag_Storage){
            			items[i].is_storage = "Yes";
            		}
            		if(resourceObj.tags && resourceObj.tags.Purpose && resourceObj.tags.Purpose == 'VM Backup'){
            			items[i].is_backup = "Yes";
            		}
            		if(resourceObj.tags && resourceObj.tags.Virtual_Machines && resourceObj.tags.Virtual_Machines == 'Yes'){
            			items[i].Virtual_Machines = "Yes";
            		}
            		/*await new Promise(async function(innerResolve,innerReject) {
            	        let inner_sql = `select ru.user_id, u.email
            	        from c4_azure_resourcegroups_users as ru
            	        inner join c4_client_users as u on u.id = ru.user_id
            	        where azure_resourcegroup_id = ${item.id}`;
            	        console.log(inner_sql);
            	        await db.query(inner_sql,async function(error,inerItems,innerFields){
            	        	dbFunc.connectionRelease;
//            	        	console.log(inerItems);
            	            if(!!error) {
            	                console.log(error);
            	                innerResolve(error);
            	            } else {
//            	            	console.log("items[i] --- ", items[i]);
            	            	items[i].mapped_users = inerItems;
            	            	
            	            	let users_ids = [];
	    		                for await (const inerItem of inerItems) {
	    		                	users_ids.push(inerItem.user_id);
	    		                }
	    		                
	    		                items[i].mapped_user_ids = users_ids;
//            	            	console.log("items[i] --- ", items[i]);
            	            	innerResolve([]);
            	            }
            	        });
            		});*/
            		i++;
            	}
                callback(null,items);
                resolve(items);
            }
       });
    });
}

let getAllAzureResourceGroups = async (reqObj,callback)=>{
    console.log(reqObj);
    console.log('Subscription Assigned: ',reqObj.subscriptions);
    console.log('Resource groups Assigned: ',reqObj.resource_groups);
    return new Promise(async function(resolve,reject) {
        let sql = `select rg.*, l.name as location_name, l.display_name as location_display_name, 
        l.subscription_id, bu.bu_name, s.display_name as subscription_display_name
        from c4_azure_resourcegroups as rg
        inner join c4_azure_subscription_locations as l on l.id = rg.location_id
        inner join c4_azure_subscriptions as s on s.subscription_id = l.subscription_id
        left join bu_info as bu on bu.id = rg.bu_id
        where  s.clientid = '${reqObj.clientid}' and s.state='Enabled' and s.record_status = 1 and rg.record_status = 1
        `;
        //left join c4_azure_resourcegroups_users as ru on ru.azure_resourcegroup_id = rg.id
        if(reqObj.subscription_id){
        	reqObj.subscription_id = helper.strEscape(reqObj.subscription_id);
        	sql +=` and s.subscription_id = '${reqObj.subscription_id}' `;
        }
        /*if(typeof reqObj.user_id != 'undefined' && reqObj.user_id != ''
   		 && (typeof reqObj.user_role == 'undefined' || (typeof reqObj.user_role != 'undefined' && reqObj.user_role != config.ADMIN_ROLE_ID))){
 	      	sql += ` and ru.user_id = '${reqObj.user_id}' `;
     	}*/
        sql +=` group by rg.id order by rg.id DESC `;
        console.log(sql);
        db.query(sql,async function(error,items,fields){
        	dbFunc.connectionRelease;
            if(!!error) {
                callback(1,{message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                i= 0;
            	for await (const item of items) {
            		let resourceObj = JSON.parse(items[i].response_obj);
            		if(items[i]){
	            		items[i].mapped_users = [];
	            		items[i].mapped_user_ids = [];
	            		items[i].is_backup = "No";
	            		items[i].is_storage = "No";
	            		items[i].Virtual_Machines = "No"
            		}
            		if(resourceObj.tags && resourceObj.tags.Boot_Diag_Storage){
            			items[i].is_storage = "Yes";
            		}
            		if(resourceObj.tags && resourceObj.tags.Purpose && resourceObj.tags.Purpose == 'VM Backup'){
            			items[i].is_backup = "Yes";
            		}
            		if(resourceObj.tags && resourceObj.tags.Virtual_Machines && resourceObj.tags.Virtual_Machines == 'Yes'){
            			items[i].Virtual_Machines = "Yes";
            		}
            		/*await new Promise(async function(innerResolve,innerReject) {
            	        let inner_sql = `select ru.user_id, u.email
            	        from c4_azure_resourcegroups_users as ru
            	        inner join c4_client_users as u on u.id = ru.user_id
            	        where azure_resourcegroup_id = ${item.id}`;
            	        console.log(inner_sql);
            	        await db.query(inner_sql,async function(error,inerItems,innerFields){
            	        	dbFunc.connectionRelease;
//            	        	console.log(inerItems);
            	            if(!!error) {
            	                console.log(error);
            	                innerResolve(error);
            	            } else {
//            	            	console.log("items[i] --- ", items[i]);
            	            	items[i].mapped_users = inerItems;
            	            	
            	            	let users_ids = [];
	    		                for await (const inerItem of inerItems) {
	    		                	users_ids.push(inerItem.user_id);
	    		                }
	    		                
	    		                items[i].mapped_user_ids = users_ids;
//            	            	console.log("items[i] --- ", items[i]);
            	            	innerResolve([]);
            	            }
            	        });
            		});*/
            		i++;
            	}
                callback(null,items);
                resolve(items);
            }
       });
    });
}
let saveResourceGroupBuUsers = async (reqObj,callback)=>{
	let formData = reqObj;
	console.log(formData);
//	return callback(null,{status:"success",message:"Resource Group BU Users Updated Successfully.",formData});
    let cts = (new Date().getTime() / 1000);
    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user_id."});
    if(!formData.id) return callback(1,{status:"error",message:"Please provide the id."});
    if(!formData.bu_id) return callback(1,{status:"error",message:"Please provide the bu_id."});
    if(!formData.mapped_users || formData.mapped_users.length == 0) return callback(1,{status:"error",message:"Please provide the mapped_users."});
    
    var saveValues = {
		bu_id: formData.bu_id,
      };
    
    return new Promise(async (resolve,reject) => {
    	let delete_old_users_query = 'delete from c4_azure_resourcegroups_users where azure_resourcegroup_id = :id';
        let delete_old_user = await dbHandler.executeQueryv2(delete_old_users_query, { id: formData.id } );
        
        dbHandler.updateTableData('c4_azure_resourcegroups',{id:formData.id},saveValues,async function(error,result){
            if(error) {
                return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve([]);
            } else {
            	let sql = `insert into c4_azure_resourcegroups_users(azure_resourcegroup_id, user_id, created_date, created_by) values 
            	    (:azure_resourcegroup_id, :user_id, :created_date, :created_by)`;

        	    for(let mapped_user of formData.mapped_users){
        	        let new_element = {};
        	        new_element.azure_resourcegroup_id = formData.id; 
        	        new_element.user_id = mapped_user.user_id; 
        	        new_element.created_date = cts;
        	        new_element.created_by = formData.user_id;

        	        await dbHandler.executeQueryv2(sql, new_element );
        	    }
        	    
                return callback(null,{status:"success",message:"Resource Group BU Users Updated Successfully.",id:formData.id});
                resolve([]);
            }
        });
    });
}

let getAzureDropdownData = async (reqObj,callback)=>{
    console.log(reqObj);
    return new Promise(async function(resolve,reject) {
    	let dropdownData = {}; 
    	
    	dropdownData.Azure_Zones = [];
    	await commonModel.getOptionConfigJsonData({option_type:"Azure_Zones"},async function(err, result){
    		if(!err && result.data){
    			dropdownData.Azure_Zones = result.data;
    		}
    	});
    	dropdownData.Azure_Environment = [];
    	await commonModel.getOptionConfigJsonData({option_type:"Azure_Environment"},async function(err, result){
    		if(!err && result.data){
    			dropdownData.Azure_Environment = result.data;
    		}
    	});
    	dropdownData.Azure_System_Name = [];
    	await commonModel.getOptionConfigJsonData({option_type:"Azure_System_Name"},async function(err, result){
    		if(!err && result.data){
    			dropdownData.Azure_System_Name = result.data;
    		}
    	});
    	dropdownData.Azure_System_Type = [];
    	await commonModel.getOptionConfigJsonData({option_type:"Azure_System_Type"},async function(err, result){
    		if(!err && result.data){
    			dropdownData.Azure_System_Type = result.data;
    		}
    	});
    	dropdownData.Azure_Region = [];
    	await commonModel.getOptionConfigJsonData({option_type:"Azure_Region"},async function(err, result){
    		if(!err && result.data){
    			dropdownData.Azure_Region = result.data;
    		}
    	});
    	dropdownData.Azure_Network_Identify = [];
    	await commonModel.getOptionConfigJsonData({option_type:"Azure_Network_Identify"},async function(err, result){
    		if(!err && result.data){
    			dropdownData.Azure_Network_Identify = result.data;
    		}
    	});
    	dropdownData.Azure_Disk_Host_Caching = [];
    	await commonModel.getOptionConfigJsonData({option_type:"Azure_Disk_Host_Caching"},async function(err, result){
    		if(!err && result.data){
    			dropdownData.Azure_Disk_Host_Caching = result.data;
    		}
    	});
    	dropdownData.Azure_Disk_Mount_Buffer_Size = [];
    	await commonModel.getOptionConfigJsonData({option_type:"Azure_Disk_Mount_Buffer_Size"},async function(err, result){
    		if(!err && result.data){
    			dropdownData.Azure_Disk_Mount_Buffer_Size = result.data;
    		}
    	});
    	dropdownData.Azure_Predefined_Mount_Names = [];
    	await commonModel.getOptionConfigJsonData({option_type:"Azure_Predefined_Mount_Names"},async function(err, result){
    		if(!err && result.data){
    			dropdownData.Azure_Predefined_Mount_Names = result.data;
    		}
    	});
    	
//    	console.log("dropdownData -- ", dropdownData);
    	callback(null,dropdownData);
        resolve(dropdownData);
    });
}

let generateUniqueVmName = async (reqObj,callback)=>{
	let cts = dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss");
    let cts_num = (new Date().getTime() / 1000);
    console.log(reqObj.body);
    let vm_init = "XA120";

    if(typeof(reqObj.body.clientid)=='undefined' || reqObj.body.clientid==''){
        var response={status:"error",message:'missing clientid'}
        return callback(1,response);
    }else if(typeof(reqObj.body.subscription_id)=='undefined' || reqObj.body.subscription_id==''){
        var response={status:"error",message:'missing subscription_id'}
        return callback(1,response);
    }else if(typeof(reqObj.body.os_type)=='undefined' || reqObj.body.os_type==''){
        var response={status:"error",message:'missing os_type'}
        return callback(1,response);
    }else if(typeof(reqObj.body.region)=='undefined' || reqObj.body.region==''){
        var response={status:"error",message:'missing region'}
        return callback(1,response);
    }else if(typeof(reqObj.body.network_identify)=='undefined' || reqObj.body.network_identify==''){
        var response={status:"error",message:'missing network_identify'}
        return callback(1,response);
    }else if(typeof(reqObj.body.shared_image_name)=='undefined' || reqObj.body.shared_image_name==''){
        var response={status:"error",message:'missing shared_image_name'}
        return callback(1,response);
    }else if(typeof(reqObj.body.vm_count)=='undefined' || reqObj.body.vm_count==''){
        var response={status:"error",message:'missing vm_count'}
        return callback(1,response);
    }else if(typeof(reqObj.body.provision_type)=='undefined' || reqObj.body.provision_type==''){
        var response={status:"error",message:'missing provision_type'}
        return callback(1,response);
    }else if(typeof(reqObj.body.subnet)=='undefined' || reqObj.body.subnet==''){
        var response={status:"error",message:'missing subnet'}
        return callback(1,response);
    }
    return new Promise(async function(resolve,reject) {
    	let sql = `select vm_provision_code
            from c4_azure_subscriptions
            where clientid='${reqObj.body.clientid}' and subscription_id='${reqObj.body.subscription_id}'
            limit 1`;
        console.log(sql);
        db.query(sql,async function(error,subItem,fields){
            dbFunc.connectionRelease;
            if(!!error) {
                callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support",error});
                resolve(error);
            } else {
            	if(subItem && subItem[0] && subItem[0].vm_provision_code){
            		vm_init = subItem[0].vm_provision_code;
            	}
            	let unique_code = vm_init+((reqObj.body.shared_image_name.toLowerCase().indexOf('sap') != -1)?"HN":((reqObj.body.os_type == 'Windows')?"WS":"LS"))+(reqObj.body.region).split('_')[0]+reqObj.body.network_identify;
            	let sql1 = `select id, unique_code, vm_counter
                from c4_vm_unique_codes 
                where unique_code='${unique_code}'
                limit 1`;
                console.log(sql1);
                db.query(sql1,async function(error,vm_unique_codes,fields){
                    dbFunc.connectionRelease;
                    if(!!error) {
                        callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support",error});
                        resolve(error);
                    } else {
                    	if(vm_unique_codes.length == 0){
                    		await new Promise(async function(resolve1,reject1){
	                    		let insData = {
	                    				unique_code : unique_code,
	                    				vm_counter : 1,
	                    				created_date : cts
	            				};
	                    		await dbHandler.insertIntoTable('c4_vm_unique_codes',insData,async function(error,id){
	                    			insData.id = id;
	                    			vm_unique_codes = [];
	                    			vm_unique_codes.push(insData);
	                    			console.log("vm_unique_codes 222 ---", vm_unique_codes);
	                    			resolve1("resolve1");
	                    		});
                    		});
                    	}
                    	if(vm_unique_codes.length > 0){
	                    	console.log("vm_unique_codes 111 ---", vm_unique_codes);
			                let vm_name = [];
			                
			                //Check for existing available VMs
			                let avail_sql = `select id, host_code, host_name
			                    from azure_reusing_hostnames 
			                    where host_code='${unique_code}' and record_status = '0'
			                    `;
			                if(reqObj.body.provision_type == 'IAAS'){
			                	avail_sql +=` and subnet_name = '${reqObj.body.subnet}' `;
			                }
			                avail_sql +=` limit ${reqObj.body.vm_count} `;
		                    console.log("avail_sql ---", avail_sql);
		                    db.query(avail_sql,async function(error,host_names,fields){
		                        dbFunc.connectionRelease;
		                        if(!!error) {
		                            callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support",error});
		                            resolve(error);
		                        } else {
									let host_password = await helper.fnGenerateString({passwordPolicy:[
										{characters:"abcdefghijklmnopqrstuvwxyz",minLength:1},
										{characters:"ABCDEFGHIJKLMNOPQRSTUVWXYZ",minLength:1},
										{characters:"0123456789",minLength:1},
										{characters:"@^$_",minLength:1},
										{characters:"0123456789",minLength:1},
										{characters:"@^$_",minLength:1}
									], passwordMinLength: 14});
									host_password = await ucpEncryptDecrypt.ucpEncryptForDb(host_password);
		                        	if(reqObj.body.provision_type == 'SAP' || reqObj.body.provision_type == 'IAAS'){
			                        	if(host_names && host_names.length > 0){
			                        		let hostIds = [];
			                        		for(let i=0;i<host_names.length;i++){
							                	vm_name.push({name: host_names[i].host_name.toLowerCase()});
							                	hostIds.push(host_names[i].id);
							                }
				                        	let updateSql = "update azure_reusing_hostnames set record_status='2', " +
				                        			" provision_status= 0, provision_date= '', is_vm_added_to_cart = 0, " +
				                        			" reserved_date= '"+cts_num+"', updated_date= '"+cts_num+"', host_password= '"+host_password+"'" +
				                        			" WHERE id in ("+hostIds.join()+")";
				            		    	console.log("updateSql --- ", updateSql);
				            		    	await db.query(updateSql, (error,rows,fields)=>{
				            		    		dbFunc.connectionRelease;
				            		            if(!!error) {
				            		            	console.log(error);
				            		            } else {
				            		                console.log(`Updated Record status to 2'`);
				            		                console.log(rows);
				            		            }
				            		    	});
			                        	}
			            		    	let remaining_hosts_count = (reqObj.body.vm_count - ((host_names && host_names.length > 0)?host_names.length:0));
			            		    	if(remaining_hosts_count > 0){
				            		    	let remaining_hosts_count_arr = await helper.getArrFromNo(remaining_hosts_count);
				            		    	let i= 0;
				            		    	for await (const item of remaining_hosts_count_arr) {
				            		    		await new Promise(async function(resolve1,reject1){
				            		    			let host_name = unique_code+((parseInt(vm_unique_codes[0].vm_counter)+i)+'').padStart(4,'0');
					            		    		vm_name.push({name: host_name.toLowerCase()});
					            		    		let insData = {
				            		    				host_code : unique_code,
				            		    				host_name : host_name,
				            		    				record_status : 2,
				            		    				reserved_date : cts_num, 
				            		    				updated_date : cts_num,
														host_password :host_password
						            				};
						                    		await dbHandler.insertIntoTable('azure_reusing_hostnames',insData,async function(error,id){
						                    			console.log("host_name 3333 ---", host_name);
						                    			i++;
						                    			resolve1("resolve1");
						                    		});
				            		    		});
				            		    	}
				            		    	await dbHandler.updateTableData('c4_vm_unique_codes',{'id':vm_unique_codes[0].id},{updated_date : cts, vm_counter:(parseInt(vm_unique_codes[0].vm_counter)+parseInt(remaining_hosts_count))},async function(err,result){
							                	
							                });
			            		    	}
	//					                for(let i=0;i<remaining_hosts_count;i++){
	//					                	vm_name.push({name: unique_code+((parseInt(vm_unique_codes[0].vm_counter)+i)+'').padStart(4,'0')});
	//					                }
	//					                await dbHandler.updateTableData('c4_vm_unique_codes',{'id':vm_unique_codes[0].id},{updated_date : cts, vm_counter:(parseInt(vm_unique_codes[0].vm_counter)+parseInt(remaining_hosts_count))},async function(err,result){
	//					                	
	//					                });
						                callback(null,{status:"success",message:"valid data.",vm_name});
						                resolve(vm_unique_codes);
		                        	}else{
		                        		if(host_names && host_names.length > 0 && host_names.length == reqObj.body.vm_count){
			                        		let hostIds = [];
			                        		for(let i=0;i<host_names.length;i++){
							                	vm_name.push({name: host_names[i].host_name.toLowerCase()});
							                	hostIds.push(host_names[i].id);
							                }
				                        	let updateSql = "update azure_reusing_hostnames set record_status='2', " +
				                        			" provision_status= 0, provision_date= '', is_vm_added_to_cart = 0, " +
				                        			" reserved_date= '"+cts_num+"', updated_date= '"+cts_num+"', host_password= '"+host_password+"'" +
				                        			" WHERE id in ("+hostIds.join()+")";
				            		    	console.log("updateSql --- ", updateSql);
				            		    	await db.query(updateSql, (error,rows,fields)=>{
				            		    		dbFunc.connectionRelease;
				            		            if(!!error) {
				            		            	console.log(error);
				            		            } else {
				            		                console.log(`Updated Record status to 2'`);
				            		                console.log(rows);
				            		            }
				            		    	});
				            		    	callback(null,{status:"success",message:"valid data.",vm_name});
							                resolve(vm_unique_codes);
			                        	}else{
			                        		callback(null,{status:"error",message:"There is no available VMs in this subnet.",vm_name:[]});
							                resolve(vm_unique_codes);
			                        	}
		                        	}
		                        }
		                    });
                    	}else{
                    		callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                            resolve("error");
                    	}
                    }
                });
            }
        });
    	
    	
        /*let sql = `select azure_vm_counter
        from c4_clients
        where id='${reqObj.body.clientid}'
        limit 1`;
        console.log(sql);
        db.query(sql,async function(error,items,fields){
            dbFunc.connectionRelease;
            if(!!error) {
                callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
            	let sql1 = `select vm_provision_code
                from c4_azure_subscriptions
                where clientid='${reqObj.body.clientid}' and subscription_id='${reqObj.body.subscription_id}'
                limit 1`;
                console.log(sql1);
                db.query(sql1,async function(error,subItem,fields){
                    dbFunc.connectionRelease;
                    if(!!error) {
                        callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                        resolve(error);
                    } else {
                    	if(subItem && subItem[0] && subItem[0].vm_provision_code){
                    		vm_init = subItem[0].vm_provision_code;
                    	}
		                let vm_name = [];
		                for(i=0;i<reqObj.body.vm_count;i++){
		                	vm_name.push({name: vm_init+((reqObj.body.shared_image_name.indexOf('sap') != -1)?"HN":((reqObj.body.os_type == 'Windows')?"WS":"LS"))+(reqObj.body.region).split('_')[0]+reqObj.body.network_identify+((parseInt(items[0].azure_vm_counter)+i)+'').padStart(4,'0')});
		                }
		//                vm_name = vm_init+((reqObj.body.system_name == 'ABAP' || reqObj.body.system_name == 'HANA DB')?"HN":((reqObj.body.os_type == 'Windows')?"WS":"LS"))+(reqObj.body.region).split('_')[0]+reqObj.body.network_identify+((parseInt(items[0].azure_vm_counter))+'').padStart(4,'0');
		                await dbHandler.updateTableData('c4_clients',{'id':reqObj.body.clientid},{azure_vm_counter:(parseInt(items[0].azure_vm_counter)+parseInt(reqObj.body.vm_count))},async function(err,result){
		                	
		                });
		                callback(null,{status:"success",message:"valid data.",vm_name});
		                resolve(items);
                    }
                });
                
                
                
            }
       });*/
    });
}

let checkStorageAndSizeCompatability = async (reqObj,callback)=>{
    console.log(reqObj.body);
    storagetype = reqObj.body.storagetype;
    vmsizename = reqObj.body.vmsizename;

    if(typeof(storagetype)=='undefined' || storagetype==''){
        var response={status:"error",message:'missing storagetype'}
        return callback(1,response);
    }

    if(typeof(vmsizename)=='undefined' || vmsizename==''){
        var response={status:"error",message:'missing vmsizename'}
        return callback(1,response);
    }
    return new Promise(async function(resolve,reject) {
        let sql = `select sv.id
        from c4_azure_storagetype_vmsizes as sv
        where  sv.storagetype = '${storagetype}' and sv.vmsizename='${vmsizename}'
        limit 1`;
        console.log(sql);
        db.query(sql,async function(error,items,fields){
        	dbFunc.connectionRelease;
            if(!!error) {
                callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                if(items.length == 0) {
                    callback(1,{status:"error",message:"Invalid data."});
                    resolve(error);
                } else {
                    callback(null,{status:"success",message:"valid data."});
                    resolve(items);
                }
            }
       });
    });
}

let azureResourceGroupBySubscription = async (obj,callback)=>{
    //console.log(clientid);
    var clientid=obj.clientid;
    var subscriptionId=obj.subscriptionId;
    return new Promise(async function(resolve,reject) {
        let sql = `select rg.*, l.name as location_name, l.display_name as location_display_name, l.subscription_id
        from c4_azure_resourcegroups as rg 
        inner join c4_azure_subscription_locations as l on l.id = rg.location_id
        where  l.clientid = '${clientid}' and l.subscription_id='${subscriptionId}' and rg.record_status=1 order by rg.id DESC`;
        ////console.log(sql);
        db.query(sql,async function(error,items,fields){
            if(!!error) {
                dbFunc.connectionRelease;
                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                callback(null,items);
                resolve(items);
            }
       });
    });
}
let getOsTemplates = (reqbody,callback)=>{
    if(!reqbody.subscriptionId)return callback(400,{success:0,message:'Subscription id is missing'});
    if(!reqbody.clientid)return callback(400,{success:0,message:'Client id is missing'});
    if(!reqbody.currency_id)return callback(400,{success:0,message:'currency_id is missing'});
    new Promise(async function(resolve,reject) {
    	let sql = `select os.id, os.osType, ocp.price,os.response_obj from other_cloud_os_templates as os 
            inner join c4_othercloud_prices as ocp on (ocp.ref_id = os.id and ocp.ref_type = 'OS' and ocp.cloud_type = 'AZURE' and ocp.currency_id = '${reqbody.currency_id}' and ocp.record_status = 1)
            inner join c4_azure_subscription_locations as l on l.id = os.location_id
        where  l.clientid = '${reqbody.clientid}' and l.subscription_id='${reqbody.subscriptionId}' and ocp.currency_id='${reqbody.currency_id}' and os.record_status = 1 order by os.name asc`;
    	console.log(sql);
    	await dbHandler.executeQuery(sql,async function(items){
            dbFunc.connectionRelease;
            for(var i=0;i<items.length;i++){
                var os=items[i];
                if(!dataArr)
                var dataArr=[];
                await new Promise(async function(resolve,reject){
                    var obj=JSON.parse(os.response_obj);
                    var storageAccountType='';
                    var diskSizeGB='';
                    var location='';
                    if(typeof(obj)!='undefined'){
	                    storageAccountType=obj.properties.storageProfile.osDisk.storageAccountType;
	                    diskSizeGB=obj.properties.storageProfile.osDisk.diskSizeGB;
	                    location=obj.location
	                    var string = await obj.id.split('/');
	                    var resourceGroup=string[4];
	                    await dataArr.push({id:os.id, osType: os.osType, name:obj.name,price:os.price,storageAccountType:storageAccountType,
	                        location:location,resourceGroup:resourceGroup,diskSizeGB:diskSizeGB})
                    }
                    resolve([])
                })
            }
            return callback(null,dataArr);
            //resolve(items);
       });
    });
}

let getDiskList = async (reqObj,callback)=>{
    var frmValues ={
        clientid : reqObj.body.clientid,
        subscription_id : reqObj.body.subscription_id,
        diskState : ((reqObj.body.diskState)?reqObj.body.diskState:""),
        resourceGroup : ((reqObj.body.resourceGroup)?reqObj.body.resourceGroup:"")
    }
    ////console.log(frmValues);
    return azureModel.azure_authtoken(frmValues.clientid,async function(error, token){
        // //console.log("token");
        // //console.log(token);
        if(token.tokendata.length == 0){
            var res={message:'The operation did not execute as expected. Please raise a ticket to support'}
            return callback(1,res);
        }else{
            urlpath = 'https://management.azure.com/subscriptions/'+frmValues.subscription_id+'/providers/Microsoft.Compute/disks?api-version=2019-07-01';
            //console.log("urlpath");
            //console.log(urlpath);

            var options = { method: 'GET',
                url: urlpath,
                headers: 
                { 
                    'cache-control': 'no-cache',
                    'content-type': 'application/json',
                    authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                },
                json: true 
            };

            request(options, async function (error, response, body) {
                if (error) {
                    let res = {status:"error","message":error.error.message};
                    return callback(1,res);
                    //throw new Error(error);
                }else{
//                    console.log(body.value);
                    if (body.value) {
                        let dataRes = [];
                        if((frmValues.diskState != "" || frmValues.resourceGroup != '') && body.value.length > 0){
                            for await (const item of body.value) {
                                var string = await item.id.split('/');
                                var itemResourceGroup=string[4].toLowerCase();
                                if(frmValues.diskState != "" && item.properties.diskState.toLowerCase() == frmValues.diskState.toLowerCase()
                                    && frmValues.resourceGroup != "" && itemResourceGroup == frmValues.resourceGroup.toLowerCase()){
                                    dataRes.push(item);
                                }else if(frmValues.diskState != "" && item.properties.diskState.toLowerCase() == frmValues.diskState.toLowerCase()
                                && frmValues.resourceGroup == ""){
                                    dataRes.push(item);
                                }else if(frmValues.diskState == ""
                                && frmValues.resourceGroup != "" && itemResourceGroup == frmValues.resourceGroup.toLowerCase()){
                                    dataRes.push(item);
                                }
                            }
                        }else{
                            dataRes = body.value;
                        }
                        let res = {status:"success","message":"Disk list",data:dataRes};
                        return callback(1,res);
                    }else{
                        let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                        if(body.error && body.error.message){
                            res.message = body.error.message;
                        }
                        return callback(1,res);
                        //throw new Error(error);
                    }
                }
            });
        }
    })
}

let addAndAttachDisk = async (reqObj,callback)=>{
	console.log("reqObj --- ", reqObj);
	if(!reqObj.subscription_id)
        callback(1,{status:"error",message:'subscription_id is missing'});
	if(!reqObj.diskName)
        callback(1,{status:"error",message:'diskName is missing'});
	if(!reqObj.location)
        callback(1,{status:"error",message:'location is missing'});
	if(!reqObj.diskSizeGB)
        callback(1,{status:"error",message:'diskSizeGB is missing'});
	if(!reqObj.deployment_resource_group_name)
        callback(1,{status:"error",message:'deployment_resource_group_name is missing'});
	if(!reqObj.storageAccountType)
		return callback(1,{status:"error",message:'storageAccountType is missing'});
	if(!reqObj.virtual_machine_name)
		return callback(1,{status:"error",message:'virtual_machine_name is missing'});
	if(!reqObj.caching)
		return callback(1,{status:"error",message:'caching is missing'});
    var frmValues ={
        clientid : config.DEMO_CLIENT_ID,
        subscription_id : reqObj.subscription_id,
        diskName : reqObj.diskName,
        location : reqObj.location,
        diskSizeGB : reqObj.diskSizeGB,
        createOption : "Empty",
        resourceGroup : reqObj.deployment_resource_group_name,
        storageAccountType : reqObj.storageAccountType,
        vmName : reqObj.virtual_machine_name,
        caching : reqObj.caching,//"ReadWrite",
        disk_encryption_resource_group_name: reqObj.disk_encryption_resource_group_name,//"RG-KEYVAULT-PROD-AVIATION-SEA",
        disk_encryption_name: reqObj.disk_encryption_name,//"des-prod-aviation-sea",
    }
    console.log(frmValues);
    let diskNo = ((reqObj.diskName.split("-disk").length > 1)?parseInt(reqObj.diskName.split("-disk")[1]):0);
	  console.log("diskNo --- ",diskNo);
//	  return callback(1,{message:'The operation did not execute as expected. Please raise a ticket to support',reqObj});
    return azureModel.azure_authtoken(frmValues.clientid,async function(error, token){
        // //console.log("token");
        // //console.log(token);
        if(token.tokendata.length == 0){
            var res={message:'The operation did not execute as expected. Please raise a ticket to support'}
            return callback(1,res);
        }else{
        	frmValues.diskId = '/subscriptions/'+frmValues.subscription_id+'/resourceGroups/'+frmValues.resourceGroup+'/providers/Microsoft.Compute/disks/'+frmValues.diskName;
            urlpath = 'https://management.azure.com'+frmValues.diskId+'?api-version=2019-07-01';
            //console.log("urlpath");
            //console.log(urlpath);

            let reqBody = { 
                location: frmValues.location,
                properties: { 
                    creationData: { 
                        createOption: frmValues.createOption 
                    }, 
                    diskSizeGB: frmValues.diskSizeGB,
                } 
            };
            if(frmValues.disk_encryption_resource_group_name && frmValues.disk_encryption_resource_group_name != '-' 
            	&& frmValues.disk_encryption_name && frmValues.disk_encryption_name != '-'
            		){
            	reqBody.properties.encryption = {
                	"diskEncryptionSetId": `/subscriptions/${frmValues.subscription_id}/resourceGroups/${frmValues.disk_encryption_resource_group_name}/providers/Microsoft.Compute/diskEncryptionSets/${frmValues.disk_encryption_name}`
                }
            }
            if(reqObj.zone && reqObj.zone != '-'){
            	reqBody.zones = [];
            	reqBody.zones.push(reqObj.zone);
            }
            console.log("reqBody --- ", JSON.stringify(reqBody));

            var options = { method: 'PUT',
                url: urlpath,
                headers: 
                { 
                    'cache-control': 'no-cache',
                    'content-type': 'application/json',
                    authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                },
                body: reqBody,
                json: true 
            };

            request(options, async function (error, response, body) {
                if (error) {
                    let res = {status:"error","message":error.error.message};
                    return callback(1,res);
                    //throw new Error(error);
                }else{
                    console.log("addDisk body --- ",body);
                    if (body.name) {
                    	
                    	return azureModel.azure_authtoken(frmValues.clientid,async function(error, token){
                            // //console.log("token");
                            // //console.log(token);
                            if(token.tokendata.length == 0){
                                var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
                                return callback(1,response);
                            }else{
                                urlpath = 'https://management.azure.com/subscriptions/'+frmValues.subscription_id+'/resourceGroups/'+frmValues.resourceGroup+'/providers/Microsoft.Compute/virtualMachines/'+frmValues.vmName+'?api-version=2022-03-01';
                                var options = {
                                    method: 'GET',
                                    url: urlpath,
                                    headers: 
                                    { 
                                        'cache-control': 'no-cache',
                                        'content-type': 'application/json',
                                        authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                                    },
                                    json: true 
                                };
                                request(options, async function (error, response, vmBody) {
                                    if (error) {
                                        let res = {status:"error","message":error.error.message};
                                        return callback(1,res);
                                        //throw new Error(error);
                                    }else{
                                        //console.log(vmBody);
                                        if (vmBody.name) {
                                            urlpath = 'https://management.azure.com/subscriptions/'+frmValues.subscription_id+'/resourceGroups/'+frmValues.resourceGroup+'/providers/Microsoft.Compute/virtualMachines/'+frmValues.vmName+'?api-version=2022-03-01';
                                            console.log("urlpath ---", urlpath);

                                            let dataDisks = vmBody.properties.storageProfile.dataDisks;
                                            let dataDisksLength = dataDisks.length

                                            lunArr = [];
                                            for await (const item of dataDisks) {
                                                lunArr.push(item.lun);
                                            }
                                            //console.log(lunArr);
                                            dataDisks[dataDisksLength] = {
                                                "caching": frmValues.caching,
                                                "managedDisk":{
                                                    "id": frmValues.diskId,
                                                    "storageAccountType": frmValues.storageAccountType
                                                },
                                                "diskSizeGB": frmValues.diskSizeGB,
                                                "createOption": "Attach",
                                                "lun":(10+diskNo),//helper.getRandomNumberWithinRange(0,63,lunArr)
                                            }
                                            console.log("dataDisks --- ", dataDisks);
                                            let reqBody = { 
                                                "location": vmBody.location, 
                                                "properties": { 
                                                    "storageProfile": { 
                                                        "dataDisks": dataDisks
                                                    }
                                                }
                                            };

                                            var options = { method: 'PUT',
                                                url: urlpath,
                                                headers: 
                                                { 
                                                    'cache-control': 'no-cache',
                                                    'content-type': 'application/json',
                                                    authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                                                },
                                                body: reqBody,
                                                json: true 
                                            };

                                            request(options, async function (error, response, body) {
                                                if (error) {
                                                    let res = {status:"error","message":error.error.message};
                                                    return callback(1,res);
                                                    //throw new Error(error);
                                                }else{
                                                    //console.log(body);
                                                    if (body.name) {
                                                    	let res = {status:"success","message":"Disk attached successfully"};
                                                    	return callback(null,res);
                                                    }else{
                                                        let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                                                        if(body.error && body.error.message){
                                                            res.message = body.error.message;
                                                        }
                                                        return callback(1,res);
                                                        //throw new Error(error);
                                                    }
                                                }
                                            });
                                        }else{
                                            let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                                            if(vmBody.error && vmBody.error.message){
                                                res.message = vmBody.error.message;
                                            }
                                            return callback(1,res);
                                            //throw new Error(error);
                                        }
                                    }
                                });
                            }
                        })
//                    	let res = {status:"success","message":"Disk added successfully"};
//                    	return callback(null,res);
                    }else{
                        let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                        if(body.error && body.error.message){
                            res.message = body.error.message;
                        }
                        return callback(1,res);
                        //throw new Error(error);
                    }
                }
            });
        }
    })
}

let addDisk = async (reqObj,callback)=>{
	console.log("reqObj.body --- ", reqObj.body);
	if(!reqObj.body.clientid)
        callback(1,{status:"error",message:'clientid is missing'});
	if(!reqObj.body.subscription_id)
        callback(1,{status:"error",message:'subscription_id is missing'});
	if(!reqObj.body.name)
        callback(1,{status:"error",message:'name is missing'});
	if(!reqObj.body.location)
        callback(1,{status:"error",message:'location is missing'});
	if(!reqObj.body.diskSizeGB)
        callback(1,{status:"error",message:'diskSizeGB is missing'});
	if(!reqObj.body.resourceGroup)
        callback(1,{status:"error",message:'resourceGroup is missing'});
	if(!reqObj.body.currency_id)
        callback(1,{status:"error",message:'currency_id is missing'});
	
    var frmValues ={
        clientid : reqObj.body.clientid,
        subscription_id : reqObj.body.subscription_id,
        name : reqObj.body.name,
        location : reqObj.body.location,
        diskSizeGB : reqObj.body.diskSizeGB,
        createOption : "Empty",
        resourceGroup : reqObj.body.resourceGroup,
        currency_id : reqObj.body.currency_id
    }
    //console.log(frmValues);
    return azureModel.azure_authtoken(frmValues.clientid,async function(error, token){
        // //console.log("token");
        // //console.log(token);
        if(token.tokendata.length == 0){
            var res={message:'The operation did not execute as expected. Please raise a ticket to support'}
            return callback(1,res);
        }else{
        	frmValues.diskId = '/subscriptions/'+frmValues.subscription_id+'/resourceGroups/'+frmValues.resourceGroup+'/providers/Microsoft.Compute/disks/'+frmValues.name;
            urlpath = 'https://management.azure.com'+frmValues.diskId+'?api-version=2019-07-01';
            //console.log("urlpath");
            //console.log(urlpath);

            let reqBody = { 
                location: frmValues.location,
                properties: { 
                    creationData: { 
                        createOption: 'Empty' //frmValues.createOption 
                    }, 
                    diskSizeGB: frmValues.diskSizeGB 
                } 
            };
            if(reqObj.body.zone){
            	reqBody.zones = [];
            	reqBody.zones.push(reqObj.body.zone);
            }
            console.log("reqBody --- ", JSON.stringify(reqBody));

            var options = { method: 'PUT',
                url: urlpath,
                headers: 
                { 
                    'cache-control': 'no-cache',
                    'content-type': 'application/json',
                    authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                },
                body: reqBody,
                json: true 
            };

            request(options, async function (error, response, body) {
                if (error) {
                    let res = {status:"error","message":error.error.message};
                    return callback(1,res);
                    //throw new Error(error);
                }else{
                    //console.log(body);
                    if (body.name) {
                    	let addonRegData = {
                        		cloud_type: 'AZURE',
                        		addon_name : "Storage",
                        		currency_id : frmValues.currency_id
                        };
                        console.log("addonRegData");
                        console.log(addonRegData);
                        return ordersModel.getAddonPrice(addonRegData,function(err,AddonResult){
                            if (err) {
                            	return callback(err,AddonResult);
                            } else {
                            	let orderRegData = {
                            			order_type: 'AZURE_ADDON',
                            			description : "AZURE Storage",
                                		clientid : frmValues.clientid,
                                		reference_id : md5(frmValues.diskId),
                                		plan_id : AddonResult.data[0].id,
                                		mrc_price : (AddonResult.data[0].price * frmValues.diskSizeGB),
                                		vmid : "",
                                		billing_location : 'AZURE'
                                };
                            	console.log("orderRegData");
                                console.log(orderRegData);
                            	return ordersModel.CreateOrUpdateAddonInfo(orderRegData,function(err,result){
                                    if (err) {
                                    	return callback(err,result);
                                    } else {
                                    	let res = {status:"success","message":"Disk added successfully"};
                                    	return callback(null,res);
                                    }
                            	});
                            }
                          });
                        
//                        return callback(null,res);
                    }else{
                        let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                        if(body.error && body.error.message){
                            res.message = body.error.message;
                        }
                        return callback(1,res);
                        //throw new Error(error);
                    }
                }
            });
        }
    })
}

let attachDisk = async (reqObj,callback)=>{
	if(!reqObj.body.clientid)
		return callback(1,{status:"error",message:'clientid is missing'});
	if(!reqObj.body.subscription_id)
		return callback(1,{status:"error",message:'subscription_id is missing'});
	if(!reqObj.body.vmName)
		return callback(1,{status:"error",message:'vmName is missing'});
	if(!reqObj.body.diskId)
		return callback(1,{status:"error",message:'diskId is missing'});
	if(!reqObj.body.storageAccountType)
		return callback(1,{status:"error",message:'storageAccountType is missing'});
	if(!reqObj.body.diskSizeGB)
		return callback(1,{status:"error",message:'diskSizeGB is missing'});
	if(!reqObj.body.resourceGroup)
		return callback(1,{status:"error",message:'resourceGroup is missing'});
	if(!reqObj.body.vmIdFromDB)
		return callback(1,{status:"error",message:'vmIdFromDB is missing'});
	if(!reqObj.body.currency_id)
		return callback(1,{status:"error",message:'currency_id is missing'});
	
    var frmValues ={
        clientid : reqObj.body.clientid,
        subscription_id : reqObj.body.subscription_id,
        vmName : reqObj.body.vmName,
        caching : "ReadWrite",
        diskId : reqObj.body.diskId,
        storageAccountType : reqObj.body.storageAccountType,
        diskSizeGB : reqObj.body.diskSizeGB,
        createOption : "Empty",
        resourceGroup : reqObj.body.resourceGroup,
        vmIdFromDB : reqObj.body.vmIdFromDB,
        currency_id : reqObj.body.currency_id
    }
    //console.log(frmValues);
    return azureModel.azure_authtoken(frmValues.clientid,async function(error, token){
        // //console.log("token");
        // //console.log(token);
        if(token.tokendata.length == 0){
            var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
            return callback(1,response);
        }else{
            urlpath = 'https://management.azure.com/subscriptions/'+frmValues.subscription_id+'/resourceGroups/'+frmValues.resourceGroup+'/providers/Microsoft.Compute/virtualMachines/'+frmValues.vmName+'?api-version=2022-03-01';
            var options = {
                method: 'GET',
                url: urlpath,
                headers: 
                { 
                    'cache-control': 'no-cache',
                    'content-type': 'application/json',
                    authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                },
                json: true 
            };
            request(options, async function (error, response, vmBody) {
                if (error) {
                    let res = {status:"error","message":error.error.message};
                    return callback(1,res);
                    //throw new Error(error);
                }else{
                    //console.log(vmBody);
                    if (vmBody.name) {
                        urlpath = 'https://management.azure.com/subscriptions/'+frmValues.subscription_id+'/resourceGroups/'+frmValues.resourceGroup+'/providers/Microsoft.Compute/virtualMachines/'+frmValues.vmName+'?api-version=2022-03-01';
                        //console.log("urlpath");
                        //console.log(urlpath);

                        let dataDisks = vmBody.properties.storageProfile.dataDisks;
                        let dataDisksLength = dataDisks.length

                        lunArr = [];
                        for await (const item of dataDisks) {
                            lunArr.push(item.lun);
                        }
                        //console.log(lunArr);
                        dataDisks[dataDisksLength] = {
                            "caching": frmValues.caching,
                            "managedDisk":{
                                "id": frmValues.diskId,
                                "storageAccountType": frmValues.storageAccountType
                            },
                            "diskSizeGB": frmValues.diskSizeGB,
                            "createOption": "Attach",
                            "lun":helper.getRandomNumberWithinRange(0,63,lunArr)
                        }
                        //console.log("dataDisks");
                        //console.log(dataDisks);
                        let reqBody = { 
                            "location": vmBody.location, 
                            "properties": { 
                                "storageProfile": { 
                                    "dataDisks": dataDisks
                                }
                            }
                        };

                        var options = { method: 'PUT',
                            url: urlpath,
                            headers: 
                            { 
                                'cache-control': 'no-cache',
                                'content-type': 'application/json',
                                authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                            },
                            body: reqBody,
                            json: true 
                        };

                        request(options, async function (error, response, body) {
                            if (error) {
                                let res = {status:"error","message":error.error.message};
                                return callback(1,res);
                                //throw new Error(error);
                            }else{
                                //console.log(body);
                                if (body.name) {
                                    let addonRegData = {
                                    		cloud_type: 'AZURE',
                                    		addon_name : "Storage",
                                    		currency_id : frmValues.currency_id
                                    };
                                    console.log("addonRegData");
                                    console.log(addonRegData);
                                    return ordersModel.getAddonPrice(addonRegData,function(err,AddonResult){
                                        if (err) {
                                        	return callback(err,AddonResult);
                                        } else {
                                        	let orderRegData = {
                                        			order_type: 'AZURE_ADDON',
                                        			description : "AZURE Storage",
                                            		clientid : frmValues.clientid,
                                            		reference_id : md5(frmValues.diskId),
                                            		plan_id : AddonResult.data[0].id,
                                            		mrc_price : (AddonResult.data[0].price * frmValues.diskSizeGB),
                                            		vmid : frmValues.vmIdFromDB,
                                            		billing_location : 'AZURE'
                                            };
                                        	console.log("orderRegData");
                                            console.log(orderRegData);
                                        	return ordersModel.CreateOrUpdateAddonInfo(orderRegData,function(err,result){
                                                if (err) {
                                                	return callback(err,result);
                                                } else {
                                                	let res = {status:"success","message":"Disk attached successfully"};
                                                	return callback(null,res);
                                                }
                                              });
                                        }
                                      });
                                    
//                                    return callback(null,res);
                                }else{
                                    let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                                    if(body.error && body.error.message){
                                        res.message = body.error.message;
                                    }
                                    return callback(1,res);
                                    //throw new Error(error);
                                }
                            }
                        });
                    }else{
                        let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                        if(vmBody.error && vmBody.error.message){
                            res.message = vmBody.error.message;
                        }
                        return callback(1,res);
                        //throw new Error(error);
                    }
                }
            });
        }
    })
}

let detachDisk = async (reqObj,callback)=>{
    var frmValues ={
        clientid : reqObj.body.clientid,
        subscription_id : reqObj.body.subscription_id,
        vmName : reqObj.body.vmName,
        diskName : reqObj.body.diskName,
        resourceGroup : reqObj.body.resourceGroup
    }
    //console.log(frmValues);
    return azureModel.azure_authtoken(frmValues.clientid,async function(error, token){
        // //console.log("token");
        // //console.log(token);
        if(token.tokendata.length == 0){
            var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
        }else{
            urlpath = 'https://management.azure.com/subscriptions/'+frmValues.subscription_id+'/resourceGroups/'+frmValues.resourceGroup+'/providers/Microsoft.Compute/virtualMachines/'+frmValues.vmName+'?api-version=2022-03-01';
            //console.log("urlpath");
            //console.log(urlpath);

            var options = { method: 'GET',
                url: urlpath,
                headers: 
                { 
                    'cache-control': 'no-cache',
                    'content-type': 'application/json',
                    authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                },
                json: true 
            };

            request(options, async function (error, response, vmBody) {
                if (error) {
                    let res = {status:"error","message":error.error.message};
                    callback(1,res);
                    //throw new Error(error);
                }else{
                    //console.log(vmBody);
                    if (vmBody.name) {
                        urlpath = 'https://management.azure.com/subscriptions/'+frmValues.subscription_id+'/resourceGroups/'+frmValues.resourceGroup+'/providers/Microsoft.Compute/virtualMachines/'+frmValues.vmName+'?api-version=2022-03-01';
                        //console.log("urlpath");
                        //console.log(urlpath);

                        let dataDisks = vmBody.properties.storageProfile.dataDisks;
                        dataDisksUpdate = [];
                        if(dataDisks.length == 0){
                            let res = {status:"error","message":"Invalid request."};
                            callback(1,res);
                        }else{
                            //console.log("dataDisks");
                            //console.log(dataDisks);
                            for await (const item of dataDisks) {
                                if(item.name != frmValues.diskName){
                                    let dataDisksUpdateLength = dataDisksUpdate.length;
                                    dataDisksUpdate[dataDisksUpdateLength] = item;
                                }
                            }
                            //console.log("dataDisksUpdate");
                            //console.log(dataDisksUpdate);

                            let reqBody = { 
                                "location": vmBody.location, 
                                "properties": { 
                                    "storageProfile": { 
                                        "dataDisks": dataDisksUpdate
                                    }
                                }
                            };

                            var options = { method: 'PUT',
                                url: urlpath,
                                headers: 
                                { 
                                    'cache-control': 'no-cache',
                                    'content-type': 'application/json',
                                    authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                                },
                                body: reqBody,
                                json: true 
                            };

                            request(options, async function (error, response, body) {
                                if (error) {
                                    let res = {status:"error","message":error.error.message};
                                    callback(1,res);
                                    //throw new Error(error);
                                }else{
                                    //console.log(body);
                                    if (body.name) {
                                        let res = {status:"success","message":"Disk detached successfully"};
                                        callback(null,res);
                                    }else{
                                        let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                                        if(body.error && body.error.message){
                                            res.message = body.error.message;
                                        }
                                        callback(1,res);
                                        //throw new Error(error);
                                    }
                                }
                            });
                        }
                    }else{
                        let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                        if(vmBody.error && vmBody.error.message){
                            res.message = vmBody.error.message;
                        }
                        callback(1,res);
                        //throw new Error(error);
                    }
                }
            });
        }
    })
}

let getVMDetails = async (encId,callback)=> {
    vmId = base64.decode(encId);
    //console.log("vmId");
    //console.log(vmId);
    
    if(typeof(vmId)=='undefined' || vmId==''){
      var response={status:"error",message:'Invalid request'}
      return callback(1,response);
    }
    let vmDetail=await new Promise(function(resolve,reject){
        let sql = `select vm.*, av.name as azure_name, av.subscriptionId, av.resourceGroup,
        av.publicIpAddress,
        av.privateIpAddress,
        av.osType,
        c.number_of_cores,
        c.os_disk_size_in_mb,
        c.resource_disk_size_in_mb,
        c.memory_in_mb,
        c.max_data_disk_count
        from azure_vms as av
        inner join c4_vm_details as vm on av.vm_detail_id = vm.id
        inner join c4_azure_subscription_locations as l on (l.subscription_id = av.subscriptionId and l.name = av.location and l.clientid = av.clientid)
        inner join c4_azure_catalog as c on (c.name = av.vmSize and l.id = c.location_id)
        where vm.id = '${vmId}'`;
        ////console.log(sql);
        dbHandler.executeQuery(sql,function(result){
            ////console.log(result);
            resolve(result)
        });
    })
    if(vmDetail.length == 0){
        var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
    }else{
        return azureModel.azure_authtoken(vmDetail[0].clientid,async function(error, token){
            // //console.log("token");
            // //console.log(token);
            if(token.tokendata.length == 0){
                var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
                return callback(1,response);
            }else{
                
                var url='https://management.azure.com/subscriptions/'+vmDetail[0].subscriptionId+'/resourceGroups/'+vmDetail[0].resourceGroup+'/providers/Microsoft.Compute/virtualMachines/'+vmDetail[0].azure_name+'?api-version=2022-03-01';
                await request.get({url:url, headers : {
                    "Authorization" :'Bearer '+token.tokendata.access_token
                }},
                function optionalCallback(err, httpResponse, result) {
                    if (err) {
                        var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
                        return callback(1,response);
                    }else{
                        var body=JSON.parse(result);
                        ////console.log("body");
                        ////console.log(body);
                        let resData = {status:"success",message:'VM Details',vmdetails : {dataFromDB:vmDetail[0],dataFromAzure:body},clientdetails:token.clientdata};
                        return callback(null,resData);
                    }
                });
            }
        })
    }
}

let syncLatestVms = (reqObj)=>{
	// console.log(reqObj);
	let sql = `select id, host_name, cluster_name, is_cluster, clientid, request_obj from c4_vm_creation 
		  where status = 1`;
	if(typeof reqObj.host_name != 'undefined'){
	      sql += ` and host_name = ${reqObj.host_name} `;
	}
    sql += ` order by id desc`;
	sql += ' limit 20';
	console.log(sql);
	  
  dbHandler.executeQuery(sql,async function(vmCreationList){
    for await (var vm of vmCreationList){
    // for(var i=0;i<subscriptionList.length;i++){
        await new Promise(async function(resolve1,reject1){
        	let request_obj = JSON.parse(vm.request_obj);
        	reqBody = {
    			"clientId" : vm.clientid,
    			"subscriptionId" : request_obj.subscription_id,
    			"resourceGroup" : request_obj.deployment_resource_group_name,
    			"virtualMachineName" : vm.host_name,
    			"vm_creation_id" : vm.id
        	};
        	let vmDetail=await new Promise(function(resolve,reject){
                let sql = `select vm.*, av.name as azure_name, av.subscriptionId, av.resourceGroup,
                av.publicIpAddress,
                av.privateIpAddress,
                av.osType,
                av.networkInterface,
                av.virtualNetwork,
                av.osName,
                av.osVersion,
                av.vmSize,
                av.location,
                av.response_obj,
                c.number_of_cores,
                c.os_disk_size_in_mb,
                c.resource_disk_size_in_mb,
                c.memory_in_mb,
                c.max_data_disk_count,
                av.backup_details,
                av.search_code,
                ar.bu_id, ar.id as azure_resourcegroup_id
                from azure_vms as av
                inner join c4_vm_details as vm on av.vm_detail_id = vm.id
                left join c4_azure_subscription_locations as l on (l.subscription_id = av.subscriptionId and l.name = av.location and l.clientid = av.clientid)
                left join c4_azure_resourcegroups as ar on (ar.location_id = l.id and ar.name = av.resourceGroup)
                left join c4_azure_catalog as c on (c.name = av.vmSize and l.id = c.location_id)
                where vm.clientid = '${reqBody.clientId}' 
                and av.subscriptionId = '${reqBody.subscriptionId}' 
                and av.resourceGroup = '${reqBody.resourceGroup}' 
                and av.name = '${reqBody.virtualMachineName}' `;
                if(typeof(reqBody.vmId)!='undefined' && reqBody.vmId != ''){
                    sql +=` and vm.id = '${reqBody.vmId}' `;
                }
                console.log(sql);
                dbHandler.executeQuery(sql,function(result){
//		                                console.log("result --- ",result);
                    resolve(result)
                });
            });
        	if(vmDetail.length == 0){
	        	syncSingleVmDetails(reqBody,async function(err,result){
	        		console.log("vm.host_name -- ", vm.host_name);
	        		if(vm.is_cluster == 0){
	        			resolve1(vm.host_name);
	        		}else{
	        			request_obj = JSON.parse(vm.request_obj);
	                	reqBody = {
	            			"clientId" : vm.clientid,
	            			"subscriptionId" : request_obj.subscription_id,
	            			"resourceGroup" : request_obj.deployment_resource_group_name,
	            			"virtualMachineName" : vm.cluster_name,
	            			"vm_creation_id" : vm.id
	                	};
	                	let clusterVDetail=await new Promise(function(resolve,reject){
	                        let sql = `select vm.*, av.name as azure_name, av.subscriptionId, av.resourceGroup,
	                        av.publicIpAddress,
	                        av.privateIpAddress,
	                        av.osType,
	                        av.networkInterface,
	                        av.virtualNetwork,
	                        av.osName,
	                        av.osVersion,
	                        av.vmSize,
	                        av.location,
	                        av.response_obj,
	                        c.number_of_cores,
	                        c.os_disk_size_in_mb,
	                        c.resource_disk_size_in_mb,
	                        c.memory_in_mb,
	                        c.max_data_disk_count,
	                        av.backup_details,
	                        av.search_code,
	                        ar.bu_id, ar.id as azure_resourcegroup_id
	                        from azure_vms as av
	                        inner join c4_vm_details as vm on av.vm_detail_id = vm.id
	                        left join c4_azure_subscription_locations as l on (l.subscription_id = av.subscriptionId and l.name = av.location and l.clientid = av.clientid)
	                        left join c4_azure_resourcegroups as ar on (ar.location_id = l.id and ar.name = av.resourceGroup)
	                        left join c4_azure_catalog as c on (c.name = av.vmSize and l.id = c.location_id)
	                        where vm.clientid = '${reqBody.clientId}' 
	                        and av.subscriptionId = '${reqBody.subscriptionId}' 
	                        and av.resourceGroup = '${reqBody.resourceGroup}' 
	                        and av.name = '${reqBody.virtualMachineName}' `;
	                        if(typeof(reqBody.vmId)!='undefined' && reqBody.vmId != ''){
	                            sql +=` and vm.id = '${reqBody.vmId}' `;
	                        }
	                        console.log(sql);
	                        dbHandler.executeQuery(sql,function(result){
//	        		                                console.log("result --- ",result);
	                            resolve(result)
	                        });
	                    });
	                	if(clusterVDetail.length == 0){
	        	        	syncSingleVmDetails(reqBody,function(err,result){
	        	        		console.log("vm.cluster_name -- ", vm.cluster_name);
	        	        		resolve1(vm.cluster_name);
	        	        	})
	                	}else{
	                		console.log("vm.cluster_name already exists in DB -- ", vm.cluster_name);
	                		resolve1(vm.host_name);
	                	}
	        		}
	        	})
        	}else{
        		if(vm.is_cluster == 0){
        			console.log("vm.host_name already exists in DB -- ", vm.host_name);
            		resolve1(vm.host_name);
        		}else{
        			request_obj = JSON.parse(vm.request_obj);
                	reqBody = {
            			"clientId" : vm.clientid,
            			"subscriptionId" : request_obj.subscription_id,
            			"resourceGroup" : request_obj.deployment_resource_group_name,
            			"virtualMachineName" : vm.cluster_name,
            			"vm_creation_id" : vm.id
                	};
                	let clusterVDetail=await new Promise(function(resolve,reject){
                        let sql = `select vm.*, av.name as azure_name, av.subscriptionId, av.resourceGroup,
                        av.publicIpAddress,
                        av.privateIpAddress,
                        av.osType,
                        av.networkInterface,
                        av.virtualNetwork,
                        av.osName,
                        av.osVersion,
                        av.vmSize,
                        av.location,
                        av.response_obj,
                        c.number_of_cores,
                        c.os_disk_size_in_mb,
                        c.resource_disk_size_in_mb,
                        c.memory_in_mb,
                        c.max_data_disk_count,
                        av.backup_details,
                        av.search_code,
                        ar.bu_id, ar.id as azure_resourcegroup_id
                        from azure_vms as av
                        inner join c4_vm_details as vm on av.vm_detail_id = vm.id
                        left join c4_azure_subscription_locations as l on (l.subscription_id = av.subscriptionId and l.name = av.location and l.clientid = av.clientid)
                        left join c4_azure_resourcegroups as ar on (ar.location_id = l.id and ar.name = av.resourceGroup)
                        left join c4_azure_catalog as c on (c.name = av.vmSize and l.id = c.location_id)
                        where vm.clientid = '${reqBody.clientId}' 
                        and av.subscriptionId = '${reqBody.subscriptionId}' 
                        and av.resourceGroup = '${reqBody.resourceGroup}' 
                        and av.name = '${reqBody.virtualMachineName}' `;
                        if(typeof(reqBody.vmId)!='undefined' && reqBody.vmId != ''){
                            sql +=` and vm.id = '${reqBody.vmId}' `;
                        }
                        console.log(sql);
                        dbHandler.executeQuery(sql,function(result){
//        		                                console.log("result --- ",result);
                            resolve(result)
                        });
                    });
                	if(clusterVDetail.length == 0){
        	        	syncSingleVmDetails(reqBody,function(err,result){
        	        		console.log("vm.cluster_name -- ", vm.cluster_name);
        	        		resolve1(vm.cluster_name);
        	        	})
                	}else{
                		console.log("vm.cluster_name already exists in DB -- ", vm.cluster_name);
                		resolve1(vm.host_name +" - "+ vm.cluster_name);
                	}
        		}
        	}
        })
    }
  })
}

let syncSingleVmDetails = async (reqBody,callback)=> {
    console.log("reqBody");
    console.log(reqBody);
    
    if(typeof(reqBody.clientId)=='undefined' || reqBody.clientId==''){
      var response={status:"error",message:'Missing clientId'}
      return callback(1,response);
    }
    if(typeof(reqBody.subscriptionId)=='undefined' || reqBody.subscriptionId==''){
        var response={status:"error",message:'Missing subscriptionId'}
        return callback(1,response);
    }
    if(typeof(reqBody.resourceGroup)=='undefined' || reqBody.resourceGroup==''){
        var response={status:"error",message:'Missing resourceGroup'}
        return callback(1,response);
    }
    if(typeof(reqBody.virtualMachineName)=='undefined' || reqBody.virtualMachineName==''){
        var response={status:"error",message:'Missing virtualMachineName'}
        return callback(1,response);
    }
             
    return azureModel.azure_authtoken(reqBody.clientId,async function(error, token){
        // //console.log("token");
        // //console.log(token);
        if(token.tokendata.length == 0){
            var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
            return callback(1,response);
        }else{
		    var url='https://management.azure.com/subscriptions/'+reqBody.subscriptionId+'/resourceGroups/'+reqBody.resourceGroup+'/providers/Microsoft.Compute/virtualMachines/'+reqBody.virtualMachineName+'?api-version=2022-03-01';
		    await request.get({url:url, headers : {
		        "Authorization" :'Bearer '+token.tokendata.access_token
		    }},
		    async function optionalCallback(err, httpResponse, result) {
		        if (err) {
		            var response={status:"error",message:'Error in syncing VM Details', error : err}
		            return callback(1,response);
		        }else{
		            var body=JSON.parse(result);
//		            console.log("body");
//		            console.log(body);
		            
		            if(body && body.error && body.error.code && body.error.code=='ResourceNotFound'){
		            	console.log("error");
						console.log(body);
//						console.log(JSON.stringify(body));
						if(typeof(reqBody.vmId)!='undefined' && reqBody.vmId != ''){
			                dbHandler.updateTableData('c4_vm_details',{id:reqBody.vmId},{vm_status:'Deleted',status:0},function(err,result){
			                })
			                dbHandler.updateTableData('azure_vms',{vm_detail_id:reqBody.vmId},{powerState:'Deleted'},function(err,result){
			                })
			                cmdbModel.deleteCmdbRecords({vmId:reqBody.vmId},function(err,deleteCmdbRecordsResult){
					        	console.log("deleteCmdbRecordsResult ---- ", deleteCmdbRecordsResult);
					        })
						}
		                let resData = {status:"error",message:'Error in syncing VM Details : ResourceNotFound', error:body,clientdetails:token.clientdata};
		                  
		                return callback(null,resData);
		            }else{
		                token.tokendata.subscription_id = reqBody.subscriptionId;
		                if(typeof(reqBody.vm_creation_id) !='undefined' && reqBody.vm_creation_id !=''){
		                	body.vm_creation_id = reqBody.vm_creation_id;
		                }
		                return await azureModel.updateVMList(token, [body], async function(err,response){
//		                	console.log("response");
//		                	console.log(response);
		                	let vmDetail=await new Promise(function(resolve,reject){
		                        let sql = `select vm.*, av.name as azure_name, av.subscriptionId, av.resourceGroup,
		                        av.publicIpAddress,
		                        av.privateIpAddress,
		                        av.osType,
		                        av.networkInterface,
		                        av.virtualNetwork,
		                        av.osName,
		                        av.osVersion,
		                        av.vmSize,
		                        av.location,
		                        av.response_obj,
		                        c.number_of_cores,
		                        c.os_disk_size_in_mb,
		                        c.resource_disk_size_in_mb,
		                        c.memory_in_mb,
		                        c.max_data_disk_count,
		                        av.backup_details,
		                        av.search_code,
						        av.zone,
						        av.availabilty_set,
		                        ar.bu_id, ar.id as azure_resourcegroup_id,
		                        cvm.host_name as cluster_host_name,
		                        cvm.id as cluster_vm_id,
		                        cav.search_code as cluster_search_code,
						        cu.email as provisioned_by
						        from azure_vms as av
						        inner join c4_vm_details as vm on av.vm_detail_id = vm.id
						        left join c4_vm_details as cvm on (cvm.cluster_id = vm.cluster_id and cvm.is_cluster = 1 and cvm.id != vm.id)
						        left join azure_vms as cav on cav.vm_detail_id = cvm.id
		                        left join c4_azure_subscription_locations as l on (l.subscription_id = av.subscriptionId and l.name = av.location and l.clientid = av.clientid)
		                        left join c4_azure_resourcegroups as ar on (ar.location_id = l.id and ar.name = av.resourceGroup)
		                        left join c4_azure_catalog as c on (c.name = av.vmSize and l.id = c.location_id)
		                        left join c4_client_users as cu on cu.id = vm.createdby
		                        where vm.clientid = '${reqBody.clientId}' 
		                        and av.subscriptionId = '${reqBody.subscriptionId}' 
		                        and av.resourceGroup = '${reqBody.resourceGroup}' 
		                        and av.name = '${reqBody.virtualMachineName}' `;
		                        if(typeof(reqBody.vmId)!='undefined' && reqBody.vmId == ''){
		                            sql +=` and vm.id = '${reqBody.vmId}' `;
		                        }
		                        console.log(sql);
		                        dbHandler.executeQuery(sql,function(result){
		//		                                console.log("result --- ",result);
		                            resolve(result)
		                        });
		                    });
		                	if(vmDetail.length > 0){
			                	vmDetail[0].multiple_ip = ((vmDetail[0].multiple_ip)?JSON.parse(vmDetail[0].multiple_ip):{});
			                	let dataFromAzure = JSON.parse(vmDetail[0].response_obj);
			                	let instatnceViewData = {};
			                	if(vmDetail[0].backup_details && vmDetail[0].backup_details != '' && vmDetail[0].backup_details){
			    	              	vmDetail[0].backup_details = JSON.parse(vmDetail[0].backup_details);
			    	              	if(vmDetail[0].backup_details.length == 0){
			    	              		vmDetail[0].backup_details = "";
			    	              	}
			    	            }
			                	if(vmDetail[0].vm_creation_request_obj && vmDetail[0].vm_creation_request_obj != '' && vmDetail[0].vm_creation_request_obj){
			    	              	vmDetail[0].vm_creation_request_obj = JSON.parse(vmDetail[0].vm_creation_request_obj);
			    	              	if(vmDetail[0].vm_creation_request_obj.length == 0){
			    	              		vmDetail[0].vm_creation_request_obj = "";
			    	              	}
			    	            }
			                    let resData = {status:"success",message:'Syncing VM Details successful',vmdetails : {dataFromDB:vmDetail[0],dataFromAzure:dataFromAzure,instatnceViewData},clientdetails:token.clientdata};
				                  
			                    return callback(null,resData);
		                	}else{
		                		let resData = {status:"error",message:'Error in syncing VM Details', error:body,clientdetails:token.clientdata};
				                  
				                return callback(null,resData);
		                	}
		                });
		            }
		        }
		    });
        }
    });
}
let getVMDetailByName = async (reqObj,callback)=> {
    //console.log(reqObj)
//    return callback(1,{success:0,status:"error",message:'testing error message'});
	
    if(!reqObj.subscriptionId){
        var response={success:0,status:"error",message:'Please provide subscription id'}
        return callback(1,response);
    }
    if(!reqObj.name){
        var response={success:0,status:"error",message:'Please provide vm name'}
        return callback(1,response);
    }
    if(!reqObj.user_id){
        var response={success:0,status:"error",message:'Please provide user_id'}
        return callback(1,response);
    }
    if(!reqObj.user_role){
        var response={success:0,status:"error",message:'Please provide user_role'}
        return callback(1,response);
    }
    var vmId='';
    var subscriptionId=reqObj.subscriptionId;
    var label_name=reqObj.name;
    var user_id=reqObj.user_id;
    var user_role=reqObj.user_role;
    
    let vmDetail=await new Promise(function(resolve,reject){
        let sql = `select vm.*, av.name as azure_name, av.subscriptionId, av.resourceGroup,
        av.publicIpAddress,
        av.privateIpAddress,
        av.osType,
        av.networkInterface,
        av.virtualNetwork,
        av.osName,
        av.osVersion,
        av.vmSize,
        av.location,
        av.response_obj,
        av.vmCreationTime,
        av.zone,
        av.availabilty_set,
        c.number_of_cores,
        c.os_disk_size_in_mb,
        c.resource_disk_size_in_mb,
        c.memory_in_mb,
        c.max_data_disk_count,
        c.PremiumIO,
        av.backup_details,
        av.search_code,
        s.display_name as subscription_display_name,
        l.display_name as location_display_name,
        cvm.host_name as cluster_host_name,
        cvm.id as cluster_vm_id,
        cav.search_code as cluster_search_code,
        cu.email as provisioned_by,
        lu.email as locked_by_user_email,
        from_unixtime(vm.locked_date, '%Y-%m-%d %H:%i:%s' ) as locked_date
        from azure_vms as av
        inner join c4_vm_details as vm on av.vm_detail_id = vm.id
        left join c4_vm_details as cvm on (cvm.cluster_id = vm.cluster_id and cvm.is_cluster = 1 and cvm.id != vm.id)
        left join azure_vms as cav on cav.vm_detail_id = cvm.id
        left join c4_azure_subscriptions as s on (s.subscription_id = av.subscriptionId)
        left join c4_azure_subscription_locations as l on (l.subscription_id = av.subscriptionId and l.name = av.location and l.clientid = av.clientid)
        left join c4_azure_catalog as c on (c.name = av.vmSize and l.id = c.location_id)
        left join c4_client_users as cu on cu.id = vm.createdby
        left join c4_client_users as lu on lu.id = vm.locked_by
        where av.subscriptionId = '${subscriptionId}' and vm.label_name='${label_name}'  order by vm.id desc limit 1 `;
        
        //Removed below logic as we are spinning a VM in different regions for a single resource group
        //ar.bu_id, ar.id as azure_resourcegroup_id,
        //left join c4_azure_resourcegroups as ar on (ar.location_id = l.id and ar.name = av.resourceGroup)
        //and ar.record_status=1
        console.log('---------------------------------------')
        console.log(sql);
        dbHandler.executeQuery(sql,function(result){
//            console.log("result --- ",result);
            resolve(result)
        });
    })
    if(vmDetail.length == 0){
        var response={status:"error",message:'VM not exists.'}
        return callback(1,response);
    }else{
    	/*if(vmDetail[0].bu_id && vmDetail[0].bu_id != 0 && user_role != config.ADMIN_ROLE_ID){
    		console.log("ifffff");
    		await new Promise(async function(innerResolve,innerReject) {
    	        let inner_sql = `select ru.user_id
    	        from c4_azure_resourcegroups_users as ru
    	        where azure_resourcegroup_id = '${vmDetail[0].azure_resourcegroup_id}' and user_id = '${user_id}'`;
    	        console.log(inner_sql);
    	        await db.query(inner_sql,async function(error,inerItems,innerFields){
    	        	dbFunc.connectionRelease;
    	        	console.log(inerItems);
    	            if(!!error) {
    	                console.log(error);
    	                innerResolve(error);
    	            } else {
    	            	console.log("inerItems --- ", inerItems);
    	            	if(inerItems.length == 0){
    	            		return callback(1,{success:0,status:"error",message:'You are not authorised to access this VM.'});
    	            	}
    	            	innerResolve([]);
    	            }
    	        });
    		});
    	}*/
        return azureModel.azure_authtoken(vmDetail[0].clientid,async function(error, token){
            // //console.log("token");
            // //console.log(token);
            if(token.tokendata.length == 0){
                var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
                return callback(1,response);
            }else{
            	vmDetail[0].multiple_ip = ((vmDetail[0].multiple_ip)?JSON.parse(vmDetail[0].multiple_ip):{});
            	let dataFromAzure = JSON.parse(vmDetail[0].response_obj);
            	let instatnceViewData = {};
//            	vmDetail[0].backup_details = "";
	            if(vmDetail[0].backup_details && vmDetail[0].backup_details != '' && vmDetail[0].backup_details){
	              	vmDetail[0].backup_details = JSON.parse(vmDetail[0].backup_details);
	              	if(vmDetail[0].backup_details.length == 0){
	              		vmDetail[0].backup_details = "";
	              	}
	            }
	            if(vmDetail[0].vm_creation_request_obj && vmDetail[0].vm_creation_request_obj != '' && vmDetail[0].vm_creation_request_obj){
	              	vmDetail[0].vm_creation_request_obj = JSON.parse(vmDetail[0].vm_creation_request_obj);
	              	if(vmDetail[0].vm_creation_request_obj.length == 0){
	              		vmDetail[0].vm_creation_request_obj = "";
	              	}
	            }
            	let resData = {status:"success",message:'VM Details',vmdetails : {dataFromDB:vmDetail[0],dataFromAzure:dataFromAzure,instatnceViewData},clientdetails:token.clientdata};
                return callback(null,resData);
                /*var url='https://management.azure.com/subscriptions/'+vmDetail[0].subscriptionId+'/resourceGroups/'+vmDetail[0].resourceGroup+'/providers/Microsoft.Compute/virtualMachines/'+vmDetail[0].azure_name+'?api-version=2022-03-01';
                await request.get({url:url, headers : {
                    "Authorization" :'Bearer '+token.tokendata.access_token
                }},
                async function optionalCallback(err, httpResponse, result) {
                    if (err) {
                        var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support', error : err}
                        return callback(1,response);
                    }else{
                        var body=JSON.parse(result);
                        ////console.log("body");
                        ////console.log(body);
                        vmDetail[0].backup_details = "";
//                        if(vmDetail[0].backup_details && vmDetail[0].backup_details != '' && vmDetail[0].backup_details){
//                        	vmDetail[0].backup_details = JSON.parse(vmDetail[0].backup_details);
//                        	if(vmDetail[0].backup_details.length == 0){
//                        		vmDetail[0].backup_details = "";
//                        	}
//                        }
                        
                        let instatnceViewData = {};
                        let resData = {status:"success",message:'VM Details',vmdetails : {dataFromDB:vmDetail[0],dataFromAzure:body,instatnceViewData},clientdetails:token.clientdata};
                        return callback(null,resData);
                        var url= `https://management.azure.com/subscriptions/${vmDetail[0].subscriptionId}/resourceGroups/${vmDetail[0].resourceGroup}/providers/Microsoft.Compute/virtualMachines/${vmDetail[0].azure_name}/instanceView?api-version=2022-03-01`;
                        console.log(url);
                        await request.get({url:url, headers : {
                            "Authorization" :'Bearer '+token.tokendata.access_token
                        }},
                        async function optionalCallback(err, httpResponse, instatnceViewResult) {
                            if (err) {
                                var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support', error : err}
                                return callback(1,response);
                            }else{
                                instatnceViewData=JSON.parse(instatnceViewResult);
                                console.log("instatnceViewData");
                                console.log(instatnceViewData);
                                let resData = {status:"success",message:'VM Details',vmdetails : {dataFromDB:vmDetail[0],dataFromAzure:body,instatnceViewData},clientdetails:token.clientdata};
                                return callback(null,resData);
                            }
                        });
                    }
                });*/
            }
        })
    }
}
function get_resrouce_group_list(reqObj,callback){
    var subscription = reqObj.subscription.split("_");
    var clientid = subscription[0];
    var subscription_id = subscription[1];
    //var location = reqObj.location.split("_");
    //var location_id = location[0];
    //var location_name = location[1];
    return new Promise(async function(resolve,reject) {
        //let sql = `select id,name from c4_azure_resourcegroups  where  location_id=${location_id}  order by name asc`;
        let sql=`SELECT rg.name,rg.location_id, c4_azure_subscription_locations.name as location_name,
        c4_azure_subscription_locations.display_name 
        FROM c4_azure_resourcegroups as rg 
        INNER JOIN c4_azure_subscription_locations ON rg.location_id = c4_azure_subscription_locations.id
        INNER JOIN c4_azure_subscriptions as s ON c4_azure_subscription_locations.subscription_id = s.subscription_id
        WHERE  s.state = 'Enabled' and s.record_status = 1 and s.subscription_id='${subscription_id}' and rg.record_status=1 `
        db.query(sql,async function(error,items,fields){
            if(!!error) {
                dbFunc.connectionRelease;
                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                callback(null,items);
                resolve(items);
            }
       });
    });
}
function addAzureResourceGroups(reqObj,callback) {
    let formData = reqObj.body;
    let cts = (new Date().getTime() / 1000);
    
    console.log(formData);
    console.log(JSON.stringify(formData));
//    return callback(1,formData);
    var frmValues = {
        'subscription': formData.subscription,
        'location' : formData.location,
        'name' : formData.name
      };
    frmValues.subscription = frmValues.subscription.split("_");
    frmValues.clientid = frmValues.subscription[0];
    frmValues.subscription_id = frmValues.subscription[1];

    frmValues.location = frmValues.location.split("_");
    frmValues.location_id = frmValues.location[0];
    frmValues.location_name = frmValues.location[1];

    if(!formData.user_id) return callback(1,{status:"error",message:"Please provide the user_id."});
    if(!formData.bu_id) return callback(1,{status:"error",message:"Please provide the bu_id."});
    if(!formData.mapped_users || formData.mapped_users.length == 0) return callback(1,{status:"error",message:"Please provide the mapped_users."});
    
    ////console.log("frmValues");
    ////console.log(frmValues);

    return new Promise(async (resolve,reject) => {
        await new Promise(async function(resourcegroupsResolve, resourcegroupsReject){
            let resourcegroupsSql = `SELECT rg.*, l.id as location_id from c4_azure_resourcegroups as rg
            inner join c4_azure_subscription_locations as l on l.id = rg.location_id
            where l.clientid = '${frmValues.clientid}' and l.subscription_id = '${frmValues.subscription_id}' and l.name = '${frmValues.location_name}' and rg.name = '${frmValues.name}'`;
            // //console.log("resourcegroupsSql");
            // //console.log(resourcegroupsSql);
            await dbHandler.executeQuery(resourcegroupsSql,async function(resourcegroupsInfo){
                // //console.log("resourcegroupsInfo");
                // //console.log(resourcegroupsInfo);
                if(resourcegroupsInfo.length == 0){
                    return azureModel.azure_authtoken(frmValues.clientid,async function(error, token){
                        // //console.log("token");
                        // //console.log(token);
                        if(token.tokendata.length == 0){
                            var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
                            resourcegroupsResolve(response);
                            resolve(response);
                        }else{
                            urlpath = 'https://management.azure.com/subscriptions/'+frmValues.subscription_id+'/resourcegroups/'+frmValues.name+'?api-version=2019-10-01';

                            ////console.log("urlpath");
                            ////console.log(urlpath);
                            putParams = {
                                "location" : frmValues.location_name
                            };

                            var options = { method: 'PUT',
                                url: urlpath,
                                headers: 
                                { 
                                    'cache-control': 'no-cache',
                                    'content-type': 'application/json',
                                    authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                                },
                                body: putParams,
                                json: true 
                            };

                            request(options, async function (error, response, body) {
                                if (error) {
                                    let res = {status:"error","message":error.error.message};
                                    callback(1,res);
                                    resourcegroupsResolve(res);
                                    resolve(res);
                                    //throw new Error(error);
                                }else{
                                    //console.log(body);

                                    if (body.properties && body.properties.provisioningState == 'Succeeded') {
                                    
                                        let insData = {
                                            location_id : frmValues.location_id,
                                            name : body.name,
                                            response_obj : JSON.stringify(body),
                                            created_by : formData.user_id,
                                            bu_id: formData.bu_id,
                                            created_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
                                        };
                                        console.log("insData");
                                        console.log(insData);
                                        await dbHandler.insertIntoTable('c4_azure_resourcegroups',insData,async function(error,azure_resourcegroup_id){
                                        	console.log("azure_resourcegroup_id -- ",azure_resourcegroup_id);
                                        	
                        	            	/*let sql = `insert into c4_azure_resourcegroups_users(azure_resourcegroup_id, user_id, created_date, created_by) values 
                        	            	    (:azure_resourcegroup_id, :user_id, :created_date, :created_by)`;

                        	        	    for await (let mapped_user of formData.mapped_users){
                        	        	    	console.log("mapped_user -- ", mapped_user);
                        	        	        let new_element = {};
                        	        	        new_element.azure_resourcegroup_id = azure_resourcegroup_id; 
                        	        	        new_element.user_id = mapped_user; 
                        	        	        new_element.created_date = cts;
                        	        	        new_element.created_by = formData.user_id;

                        	        	        await dbHandler.executeQueryv2(sql, new_element );
                        	        	    }*/
                        	        	    
                                            let text = {status:"success",message:"Added resource group successfully"};
                                            //console.log(text);
                                            return callback(null,text);
                                            resourcegroupsResolve(text);
                                            resolve(text);
                                        });
                                    }else{
                                        let res = {status:"error","message":body.error.message};
                                        return callback(1,res);
                                        resourcegroupsResolve(res);
                                        resolve(res);
                                        //throw new Error(error);
                                    }
                                }
                            });
                        }
                    })
                }else{
                    let res = {status:"error",message:'Resource Group already exists! Please try another one.'};
                    callback(1,res);
                    resourcegroupsResolve(res);
                    resolve(res);
                }
            });
        });
    });
}
function addAzureNetwork(reqObj,callback) {
    let formData = reqObj.body;
    ////console.log(formData);
    ////console.log(JSON.stringify(formData));
    var frmValues = {
        'subscription': formData.subscription,
        'location' : formData.location,
        'resource_group' : formData.resource_group,
        'name' : formData.name,
        'ip_address_prefix':formData.ip_address_prefix
      };
    frmValues.subscription = frmValues.subscription.split("_");
    frmValues.clientid = frmValues.subscription[0];
    frmValues.subscription_id = frmValues.subscription[1];

    // frmValues.location = frmValues.location.split("_");
    // frmValues.location_id = frmValues.location[0];
    frmValues.location_name = frmValues.location;

    //console.log("frmValues");
    //console.log(frmValues);

    return new Promise(async (resolve,reject) => {
        await new Promise(async function(resourcegroupsResolve, resourcegroupsReject){
            let resourcegroupsSql = `SELECT * from azure_networks
            where clientid = '${frmValues.clientid}' and subscriptionId = '${frmValues.subscription_id}' and location = '${frmValues.location_name}' and name = '${frmValues.name}' and status=1`;
            // //console.log("resourcegroupsSql");
            // //console.log(resourcegroupsSql);
            await dbHandler.executeQuery(resourcegroupsSql,async function(resourcegroupsInfo){
                // //console.log("resourcegroupsInfo");
                // //console.log(resourcegroupsInfo);
                if(resourcegroupsInfo.length == 0){
                    return azureModel.azure_authtoken(frmValues.clientid,async function(error, token){
                        // //console.log("token");
                        // //console.log(token);
                        if(token.tokendata.length == 0){
                            var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
                            resourcegroupsResolve(response);
                            //resolve(response);
                        }else{
                            urlpath=`https://management.azure.com/subscriptions/${frmValues.subscription_id}/resourceGroups/${frmValues.resource_group}/providers/Microsoft.Network/virtualNetworks/${frmValues.name}?api-version=2020-04-01`;
                            //console.log("urlpath");
                            //console.log(urlpath);
                            putParams = {
                                "properties": {
                                        "addressSpace": {
                                            "addressPrefixes": [`${frmValues.ip_address_prefix}`]
                                        }
                                    },
                                "location": frmValues.location_name
                                
                            };  
                            var options = { method: 'PUT',
                                url: urlpath,
                                headers: 
                                { 
                                    'cache-control': 'no-cache',
                                    'content-type': 'application/json',
                                    authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                                },
                                body: putParams,
                                json: true 
                            };

                            request(options, async function (error, response, body) {
                                if (error) {
                                    let res = {status:"error","message":error.error.message};
                                    return callback(1,res);
                                    //resourcegroupsResolve(res);
                                    //resolve(res);
                                    //throw new Error(error);
                                }else{
                                    //console.log(body);

                                    if (body.properties && (body.properties.provisioningState == 'Updating' || body.properties.provisioningState == 'Succeeded')) {
                                    
                                        let insData = {
                                            location : frmValues.location_name,
                                            subscriptionId : frmValues.subscription_id,
                                            name : body.name,
                                            clientid:frmValues.clientid,
                                            resource_group:frmValues.resource_group
                                        };
                                        // //console.log("insData");
                                        // //console.log(insData);
                                        await dbHandler.insertIntoTable('azure_networks',insData,async function(error,vmdid){
                                            let text = {status:"success",message:"Virtual Network Created Successfully"};
                                            //console.log(text);
                                            return callback(null,text);
                                            //resourcegroupsResolve(text);
                                            //resolve(text);
                                        });
                                    }else{
                                        let res = {status:"error","message":body.error.message};
                                        return callback(1,res);
                                        //resourcegroupsResolve(res);
                                        //resolve(res);
                                        //throw new Error(error);
                                    }
                                }
                            });
                        }
                    })
                }else{
                    let res = {status:"error",message:'Resource Group already exists! Please try another one.'};
                    callback(1,res);
                    resourcegroupsResolve(res);
                    resolve(res);
                }
            });
        });
    });
}

function addAzureDetailsToClient(reqObj,req,callback) {
    let formData = reqObj;
    console.log(formData);
    console.log(JSON.stringify(formData));
    if(!formData.clientid)
        callback(1,{status:"error",message:'clientid is missing'});

    var frmValues = {
        'tenant_id': formData.azure_tenantid,
        'grant_type' : config.AZURE.grant_type,
        'client_id' : formData.azure_clientid,
        'client_secret' : formData.azure_clientsecretkey,
        'resource':config.AZURE.resource_url
      };

    console.log("frmValues");
    console.log(frmValues);
    return new Promise(async function(resolve, reject){
        azureModel.getDirectAzureAccessToken(frmValues,async function(error,result){
            if(error){
                var response={status:"error",message:'Invalid Credentials, please check.'}
                resolve(response);
                callback(1,response);
            }else{
                let updateData = {
                    azure_tenantid : frmValues.tenant_id,
                    azure_granttype : frmValues.grant_type,
                    azure_clientid : frmValues.client_id,
                    azure_clientsecretkey : frmValues.client_secret,
                    azure_resource : frmValues.resource,
                    updateddate : (new Date().getTime() / 1000),
                    azure_linked : 1
                };
                console.log("updateData");
                console.log(updateData);
                await dbHandler.updateTableData('c4_clients',{'id':formData.clientid},updateData,async function(err,result){
                    azureModel.getAzureSubscriptionList({id:formData.clientid},function(err,result){
                    	azureModel.getAzureSubscriptionWiseLocationList({id:formData.clientid},function(err,result){
                    		azureModel.getAzureResourceGroups({id:formData.clientid},function(err,result){
                            	
                            });
                    		azureModel.getAzureCatalog({id:formData.clientid},function(err,result){
                            	
                            });
                        });
                    });
                    
                    let clientSql = `select * from c4_clients where id = :client_id`;
                    let clientDetails = await dbHandler.executeQueryv2(clientSql, { client_id: formData.clientid } );
                    emailData = "Dear Team,<br/><br/>" +
                    		"Client ID "+formData.clientid+" : "+clientDetails[0].company_name+", updated the Azure details. Kindly check and update the Subscriptions.<br/><br/>" +
                    		"Regards,<br/>" +
                    		"Cloud4C UCP Team";
                    console.log(emailData);
                    mail.mail('UCP Cloud4C :: AZURE account Added/Updated!', emailData, config.Automation_Email);
                    
                    var response={status:"success",message:'Azure details updated successfully'}
                    resolve(response);
                    callback(null,response);
                });
            }
        })
    });
}

/*
  Author: Pradeep
  Descri: Create availability set
  Date  : 19-05-2020
*/
let createAvailabilitySet=(reqbody,callback)=>{
    if(!reqbody.subscription_id)return callback(400,{success:0,message:'Subscription id is missing'});
    if(!reqbody.client_id)return callback(400,{success:0,message:'Client Id is missing'});
    if(!reqbody.availability_set)return callback(400,{success:0,message:'Availability set name is missing'});
    if(!reqbody.resource_group)return callback(400,{success:0,message:'Resource group name is missing'});
    if(!reqbody.location_name)return callback(400,{success:0,message:'Location name is missing'});
    var subscription_id=reqbody.subscription_id;
    var availability_set=reqbody.availability_set;
    var resource_group=reqbody.resource_group;
    var location_name=reqbody.location_name;
    var clientId=reqbody.client_id;
    new Promise(function(resolve,reject){
        azureModel.azure_authtoken(clientId,function(error,result){
            if(error) return resolve([])
            return resolve(result)
         })
    }).then(function(token){
      if(!token){
        var response={message:'The operation did not execute as expected. Please raise a ticket to support',data:token}
        return callback([],response);
      }
      var url=`https://management.azure.com/subscriptions/${subscription_id}/resourceGroups/${resource_group}/providers/Microsoft.Compute/availabilitySets/${availability_set}?api-version=2019-12-01`;
      var bodyParams={
          "location": `${location_name}`,
          "properties": {
            "platformFaultDomainCount": 3,
            "platformUpdateDomainCount": 20
          }
        }
      ////console.log(url)
      request.put({url:url,body:JSON.stringify(bodyParams),headers : {
        "Authorization" :'Bearer '+token.tokendata.access_token,
        'Content-type': 'application/json'
        }},
      function optionalCallback(err, httpResponse, result) {
        if (err) {
            return callback([],err);
        }else{
          var body=JSON.parse(result);
          //console.log(body)
            return callback(null,body)
        }
      });
      
    })
  }


async function getAzureBillingReport(req,callback) {

    let { start_date, end_date, set, limit } = req.query;
    let { clientid } = req;

    let checkStatusQuery = `select * from c4_clients where azure_linked = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `Azure is not enabled`, status: 400 });

    let offset = '';
    let values = {client_id: clientid, start_date: start_date, end_date: end_date};

    if(set && limit){
        offset = ` limit :offset, :limit`;
        values = {client_id: clientid, start_date: start_date, end_date: end_date, offset: parseInt((set - 1) * limit), limit: parseInt(limit) }
    }

    let sql = `select subscription_id, meterId,
                meterName,
                meterCategory,
                meterSubCategory,
                sum(quantity) as total_quantity,
                round(avg(meterRates), 4) as average_meter_rates,
                sum(usage_cost) as total_usage_cost,
                unit
                from c4_azure_budget_usage as bu 
                where bu.meterId != '' and bu.clientid = :client_id and bu.usage_date >= :start_date and bu.usage_date <= :end_date group by meterId order by meterName asc ${offset}`
    let sql_count = `select count(distinct meterId) as count from c4_azure_budget_usage as bu where bu.meterId != '' and bu.clientid = :client_id and bu.usage_date >= :start_date and bu.usage_date <= :end_date`

    let list = await dbHandler.executeQueryv2(sql, values);
    let count = await dbHandler.executeQueryv2(sql_count, {client_id: clientid, start_date: start_date, end_date: end_date });

    let response = {status:"success",message:'Azure billing report', data : list, count: count[0]['count']};
    return response;

}

let azureRegions = async () => {
	let regions = await dbHandler.executeQueryv2(`select option_key, option_value from c4_option_config	where  option_type = 'Azure_Region' and status = 1`);
	return JSON.parse(regions[0]?.option_value);
}

let cyberArkApplication = async () => {
	let CYBER_ARK_APPS = await dbHandler.executeQueryv2(`SELECT * FROM c4_option_config WHERE option_type='CYBER_ARK_APPS' and status = 1`)
	return JSON.parse(CYBER_ARK_APPS[0]?.option_value);
}

let cyberArkPermissions = async () => {
	let CYBER_ARK_PERMISSIONS = await dbHandler.executeQueryv2(`SELECT * FROM c4_option_config WHERE option_type='CYBER_ARK_PERMISSIONS' and status = 1`)
	return JSON.parse(CYBER_ARK_PERMISSIONS[0]?.option_value);
}

let getCyberArkUsers = async (req) => {
	let sql = `SELECT cu.id as user_id, cu.email, cug.id as user_group_id,cug.group_id as ad_group_id, aag.group_name as ad_group_name FROM c4_client_users as cu 
		left join c4_client_user_groups as cug on cug.user_id = cu.id
		left join azure_ad_groups as aag on aag.group_id = cug.group_id
		WHERE 1  `;
	// if(req.adGroup){
	// 	sql += ` and cug.group_id='${req.adGroup}'`;
	// }else{
	// 	sql += ` and cug.group_id='${config.azureAd.pvwa_ad_group}'`;
	// }
	if(typeof req.record_status != 'undefined'){
		sql += ` and cu.status='${req.record_status}'`;
		//and cug.record_status='${req.record_status}'
	}
	sql += ` group by cu.id `;
	if(req.orderBy){
		sql += ` order by cu.id desc`;
	}else{
		sql += ` order by cu.email asc`;
	}
	console.log("getCyberArkUsers sql --- ", sql);
	return await dbHandler.executeQueryv2(sql)
}

let getAllUsersList = async (req) => {
	console.log("req --- ", req);
	let sql = `SELECT cu.id as user_id, cu.email 
		FROM c4_client_users as cu 
		WHERE 1  `;
	if(typeof req.record_status != 'undefined' && req.record_status != 'ALL'){
		sql += ` and cu.status = ${req.record_status}`;
	}
	
	if(req.orderBy){
		sql += ` order by cu.id desc`;
	}else{
		sql += ` order by cu.email asc`;
	}
	console.log("sql --- ", sql);
	return await dbHandler.executeQueryv2(sql)
}

let getAdGroups = async (req) => {
	let sql = `SELECT * FROM azure_ad_groups
		WHERE record_status = 1 and is_visible_to_frontend = 1 order by group_name desc `;
	console.log("sql --- ", sql);
	return await dbHandler.executeQueryv2(sql)
}

let manageVMLock = async (reqbody, callback) => {
	console.log("reqbody --- ", reqbody);
 let sql = `UPDATE c4_vm_details set is_locked=:is_locked, locked_by=:locked_by, locked_date=:locked_date WHERE id=:id`,
  list;

 try {
	 let updateData = {
		 id: reqbody.id
	 }
	 if(reqbody.is_locked){
		 updateData.is_locked = 1;
		 updateData.locked_by = reqbody.requested_user_id;
		 updateData.locked_date = parseInt(new Date()/1000);
	  }else{
		  updateData.is_locked = 0;
		  updateData.locked_by = "";
		  updateData.locked_date = "";
	  }
	  list = await dbHandler.executeQueryv2(sql, updateData);
	  
	  var insertArr={
	      vmid:reqbody.id,
	      type:9,
	      description: "VM "+(reqbody.is_locked ? "Locked" : "Unlocked"),
	      createddate:parseInt(new Date()/1000),
	      clientid:reqbody.client_id,
	      createdby : reqbody.requested_user_id
	  }
	  await new Promise(function (resolve, reject) {
	      dbHandler.insertIntoTable('c4_vm_logs',insertArr,function(err,result){
	          resolve(result)
	      })
	  });
	  
	  //dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
	  return {...list, locked_date:dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")};
 }
 catch(e) {
	 return {status: "error", message: e.message}
 }
}

let vmOatData = async (reqbody) => {
	let sql = `SELECT oat_checklist_data from c4_vm_details WHERE id=:id`,
	 id = reqbody.id,
		list = await dbHandler.executeQueryv2(sql, {id}),
		oat_checklist_data = unescape((list[0] || {}).oat_checklist_data);
		 	
	return oat_checklist_data;
}

//oat checklist data handling
const insertOatData = async (aObj) => {
	let {host_name, oat_checklist_data, pass, passed_checklist_data, fail,
			failed_checklist_data, vm_id} = aObj,
			get_vm_id = `SELECT azure.vm_detail_id FROM azure_vms azure inner join c4_vm_details vm ON (vm.id=azure.vm_detail_id) where vm.host_name=:host_name AND vm.vm_status!='Deleted'`,
			sql = `INSERT INTO c4c_azure_vm_oat_list (vm_id, oat_checklist_data, pass, passed_checklist_data, fail, failed_checklist_data) VALUES (:vm_id, :oat_checklist_data, :pass, :passed_checklist_data, :fail, :failed_checklist_data)`,
			list;

	get_vm_id = await dbHandler.executeQueryv2(get_vm_id, {host_name})
	if (get_vm_id.length || vm_id) {
			get_vm_id = (get_vm_id[0] || {}).vm_detail_id;
			if (get_vm_id || vm_id) {
					list = await dbHandler.executeQueryv2(sql, {vm_id: get_vm_id || vm_id, oat_checklist_data, pass, passed_checklist_data, fail, failed_checklist_data});
			}
	}

	return list;
}

let vmOatList = async (reqbody) => {
	let sql = `SELECT oat.id, oat.vm_id, oat.pass, oat.fail, 
			DATE_FORMAT(oat.created_on, '%Y-%m-%d %H:%i:%s') as created_on,
			details.cmdb_ctasks_info as ctask
			FROM c4c_azure_vm_oat_list oat 
			LEFT JOIN c4_vm_details details ON (details.id = oat.vm_id) WHERE oat.vm_id=:id`,
		list = await dbHandler.executeQueryv2(sql, {id: reqbody.id});

	list = list.map(item => {
		let change_task = (JSON.parse(item.ctask) || {}).change_task,
		 ctask = (change_task || []).filter(rec => {
				return rec.u_task_type === 'oat';
			});

		item.ctask = (ctask[0] || {}).number;
		return item;
	})

 return list || [];
}

let vmOatListData = async (reqbody) => {
	let sql = `SELECT *, DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') as created_on FROM c4c_azure_vm_oat_list WHERE id=:id`,
		list = await dbHandler.executeQueryv2(sql, {id: reqbody.id});

 return list || [];
}

let vmResize= async (reqbody,callback)=>{
	console.log("reqbody --- ", JSON.stringify(reqbody));
//	return callback(null,{status: "success", message:'VM re-size requested successfully.',data:reqbody});
	if(!reqbody.subscription_id)return callback(400,{status: "error", message:'Subscription id is missing'});
	if(!reqbody.client_id)return callback(400,{status: "error", message:'Client Id is missing'});
	if(!reqbody.resource_group)return callback(400,{status: "error", message:'Resource group name is missing'});
	if(!reqbody.vm_name)return callback(400,{status: "error", message:'vm_name is missing'});
	if(!reqbody.new_vmSize)return callback(400,{status: "error", message:'new_vmSize is missing'});
	if(!reqbody.location_name)return callback(400,{status: "error", message:'Location name is missing'});
	if(!reqbody.vm_cpus)return callback(400,{status: "error", message:'vm_cpus is missing'});
	if(!reqbody.vm_ram)return callback(400,{status: "error", message:'vm_ram is missing'});
	if(!reqbody.search_code)return callback(400,{status: "error", message:'search_code is missing'});
	var subscription_id=reqbody.subscription_id;
	var resource_group=reqbody.resource_group;
	var vm_name=reqbody.vm_name;
	var new_vmSize=reqbody.new_vmSize;
	var location_name=reqbody.location_name;
	var clientId=reqbody.client_id;
	var vm_cpus=reqbody.vm_cpus;
	var vm_ram=reqbody.vm_ram;
	var search_code=reqbody.search_code;
	
	let UCP_CONSTANTS_DATA = "";
	await commonModel.getOptionConfigJsonData({option_type:"UCP_CONSTANTS"},async function(err, result){
//		console.log("result 1111111 --- ", result);
		if(!err && result.data){
			UCP_CONSTANTS_DATA = result.data;
		}
		console.log("UCP_CONSTANTS_DATA 1111111 --- ", UCP_CONSTANTS_DATA);
	});
	if(!UCP_CONSTANTS_DATA){
		console.log("UCP_CONSTANTS not found");
		return callback(1,{status: "error",success:0,message:'The operation did not execute as expected. Please raise a ticket to support'});
	}
	
	new Promise(function(resolve,reject){
	    azureModel.azure_authtoken(clientId,function(error,result){
	        if(error) return resolve([])
	        return resolve(result)
	     })
	}).then(function(token){
	  if(!token){
	    var response={status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:token}
	    return callback(1,response);
	  }
	  let url=`https://management.azure.com/subscriptions/${subscription_id}/resourceGroups/${resource_group}/providers/Microsoft.Compute/virtualMachines/${vm_name}?api-version=2022-03-01`;
	  let bodyParams={
			    "properties": {
			        "hardwareProfile": {
			            "vmSize": new_vmSize
			        }
			    },
			    "location": location_name
			};
	  ////console.log(url)
	  request.put({url:url,body:JSON.stringify(bodyParams),headers : {
	    "Authorization" :'Bearer '+token.tokendata.access_token,
	    'Content-type': 'application/json'
	    }},
	  async function optionalCallback(err, httpResponse, result) {
	    if (err) {
	        return callback(1,{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:err});
	    }else{
	      let body=JSON.parse(result);
//	      console.log(body)
	      if(body.error){
	    	  return callback(1,{status: "error", message:((body.error.message)?body.error.message:'The operation did not execute as expected. Please raise a ticket to support'),data:body})
	      }else{
	    	  resizeReqBody = {
  	    			"clientId" : reqbody.client_id,
  	    			"subscriptionId" : reqbody.subscription_id,
  	    			"resourceGroup" : reqbody.resource_group,
  	    			"virtualMachineName" : reqbody.vm_name
  	        	};
	    	  console.log("resizeReqBody -- ", resizeReqBody);
	    	  syncSingleVmDetails(resizeReqBody,function(err,result){
//			        		console.log("syncSingleVmDetails result -- ", result);
	        		console.log("host_name -- ", reqbody.vm_name);
	    	  })
	    	  await new Promise(function(resolve1,reject1){
	    		let basicAuth=base64.encode(`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME}:${UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD}`);
          		let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_excel_dhl_hw_server_upload`;
      		  	console.log("url --- ", url);
      		  	let options = {
      		  		  "u_cpu_cores": vm_cpus,
          		      "u_memory_installed": vm_ram,
          		      "u_model": "Azure "+new_vmSize,
          		      "u_search_code": search_code,
      		  	};
      		  	console.log("u_excel_dhl_hw_server_upload request", JSON.stringify(options));
      		  	let request_options = {
      				  'method': 'POST',
      				  'url': url,
      				  'headers': {
      				    'Content-Type': 'application/json',
      				    'Authorization':  `Basic ${basicAuth}`,
      				  },
      				  body: JSON.stringify(options)

      				};
          		  	
          		  	console.log("u_excel_dhl_hw_server_upload request_options -- ", JSON.stringify(request_options));
      				request(request_options, function (error, response) {
      					console.log("error -- ", JSON.stringify(error));
      					console.log("response.body -- ", JSON.stringify(response));
      				  if (error){
      					  //throw new Error(error);
      					  console.log("error -- ", JSON.stringify(error));
      					  resolve1("The operation did not execute as expected. Please raise a ticket to support");
      				  }else{
        		    	  console.log("response.body -- ", JSON.stringify(response.body));
            		        result = JSON.parse(response.body);
            		        if(result){
            		        	resolve1(result);
            		        }else{
            		        	resolve1("The operation did not execute as expected. Please raise a ticket to support");
            		        }
        		      }
      			});
	    	  });
	    	  if(reqbody.is_cluster == 1 
	    			  && reqbody.cluster_vm_id 
	    			  && reqbody.cluster_host_name 
	    			  && reqbody.cluster_search_code 
	    	  ){
	    		  let url=`https://management.azure.com/subscriptions/${subscription_id}/resourceGroups/${resource_group}/providers/Microsoft.Compute/virtualMachines/${reqbody.cluster_host_name}?api-version=2022-03-01`;
	    		  let bodyParams={
	    				    "properties": {
	    				        "hardwareProfile": {
	    				            "vmSize": new_vmSize
	    				        }
	    				    },
	    				    "location": location_name
	    				};
	    		  console.log("cluster resize url --- ", url)
	    		  request.put({url:url,body:JSON.stringify(bodyParams),headers : {
	    		    "Authorization" :'Bearer '+token.tokendata.access_token,
	    		    'Content-type': 'application/json'
	    		    }},
	    		  async function optionalCallback(err, httpResponse, result) {
	    		    if (err) {
	    		        return callback(1,{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:err});
	    		    }else{
	    		      let body=JSON.parse(result);
//	    		      console.log(body)
	    		      if(body.error){
	    		    	  return callback(1,{status: "error", message:((body.error.message)?body.error.message:'The operation did not execute as expected. Please raise a ticket to support'),data:body})
	    		      }else{
	    		    	  resizeReqBody = {
	    	  	    			"clientId" : reqbody.client_id,
	    	  	    			"subscriptionId" : reqbody.subscription_id,
	    	  	    			"resourceGroup" : reqbody.resource_group,
	    	  	    			"virtualMachineName" : reqbody.cluster_host_name
	    	  	        	};
	    		    	  console.log("resizeReqBody -- ", resizeReqBody);
	    		    	  syncSingleVmDetails(resizeReqBody,function(err,result){
//	    				        		console.log("syncSingleVmDetails result -- ", result);
	    		        		console.log("host_name -- ", reqbody.cluster_host_name);
	    		    	  })
	    		    	  await new Promise(function(resolve1,reject1){
	    		    		let basicAuth=base64.encode(`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME}:${UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD}`);
	    	          		let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_excel_dhl_hw_server_upload`;
	    	      		  	console.log("url --- ", url);
	    	      		  	let options = {
	    	      		  		  "u_cpu_cores": vm_cpus,
	    	          		      "u_memory_installed": vm_ram,
	    	          		      "u_model": "Azure "+new_vmSize,
	    	          		      "u_search_code": reqbody.cluster_search_code,
	    	      		  	};
	    	      		  	console.log("u_excel_dhl_hw_server_upload request", JSON.stringify(options));
	    	      		  	let request_options = {
	    	      				  'method': 'POST',
	    	      				  'url': url,
	    	      				  'headers': {
	    	      				    'Content-Type': 'application/json',
	    	      				    'Authorization':  `Basic ${basicAuth}`,
	    	      				  },
	    	      				  body: JSON.stringify(options)

	    	      				};
	    	          		  	
	    	          		  	console.log("u_excel_dhl_hw_server_upload request_options -- ", JSON.stringify(request_options));
	    	      				request(request_options, function (error, response) {
	    	      					console.log("error -- ", JSON.stringify(error));
	    	      					console.log("response.body -- ", JSON.stringify(response));
	    	      				  if (error){
	    	      					  //throw new Error(error);
	    	      					  console.log("error -- ", JSON.stringify(error));
	    	      					  resolve1("The operation did not execute as expected. Please raise a ticket to support");
	    	      				  }else{
	    	        		    	  console.log("response.body -- ", JSON.stringify(response.body));
	    	            		        result = JSON.parse(response.body);
	    	            		        if(result){
	    	            		        	resolve1(result);
	    	            		        }else{
	    	            		        	resolve1("The operation did not execute as expected. Please raise a ticket to support");
	    	            		        }
	    	        		      }
	    	      			});
	    		    	  });
	    		    	  return callback(null,{status: "success", message:'VM re-size requested successfully.',data:body})
	    		      }
	    		    }
	    		   });
	    	  }else{
	    		  return callback(null,{status: "success", message:'VM re-size requested successfully.',data:body})
	    	  }
	      }
	    }
	   });
    })
}

let galleryList=(reqbody,callback)=>{
	if(!reqbody.subscription_id)return callback(400,{status: "error", message:'Subscription id is missing'});
	if(!reqbody.gallery_resource_group)return callback(400,{status: "error", message:'Gallery Resource group name is missing'});
	if(!reqbody.client_id)return callback(400,{status: "error", message:'Client Id is missing'});
	var subscription_id=reqbody.subscription_id;
	var gallery_resource_group=reqbody.gallery_resource_group;
	var clientId=reqbody.client_id;
	new Promise(function(resolve,reject){
	    azureModel.azure_authtoken(clientId,function(error,result){
	        if(error) return resolve([])
	        return resolve(result)
	     })
	}).then(function(token){
	  if(!token){
	    var response={status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:token}
	    return callback([],response);
	  }
	  var url=`https://management.azure.com/subscriptions/${subscription_id}/resourceGroups/${gallery_resource_group}/providers/Microsoft.Compute/galleries?api-version=2019-12-01`;
	  ////console.log(url)
	  request.get({url:url,headers : {
	    "Authorization" :'Bearer '+token.tokendata.access_token,
	    'Content-type': 'application/json'
	    }},
	  function optionalCallback(err, httpResponse, result) {
	    if (err) {
	        return callback([],{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:err});
	    }else{
	      var body=JSON.parse(result);
//	      console.log(body)
	      if(body.error){
	    	  return callback(null,{status: "error", message:((body.error.message)?body.error.message:'The operation did not execute as expected. Please raise a ticket to support'),data:body})
	      }else{
	    	  return callback(null,{status: "success", message:'Azure Gallery List.',data:body})
	      }
	    }
	   });
    })
}

let galleryImagesList=(reqbody,callback)=>{
	if(!reqbody.subscription_id)return callback(400,{status: "error", message:'Subscription id is missing'});
	if(!reqbody.gallery_resource_group)return callback(400,{status: "error", message:'Gallery Resource group name is missing'});
	if(!reqbody.gallery_name)return callback(400,{status: "error", message:'Gallery Name is missing'});
	if(!reqbody.client_id)return callback(400,{status: "error", message:'Client Id is missing'});
	var subscription_id=reqbody.subscription_id;
	var gallery_resource_group=reqbody.gallery_resource_group;
	var gallery_name=reqbody.gallery_name;
	var clientId=reqbody.client_id;
	new Promise(function(resolve,reject){
	    azureModel.azure_authtoken(clientId,function(error,result){
	        if(error) return resolve([])
	        return resolve(result)
	     })
	}).then(function(token){
	  if(!token){
	    var response={status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:token}
	    return callback([],response);
	  }
	  var url=`https://management.azure.com/subscriptions/${subscription_id}/resourceGroups/${gallery_resource_group}/providers/Microsoft.Compute/galleries/${gallery_name}/images?api-version=2019-12-01`;
	  ////console.log(url)
	  request.get({url:url,headers : {
	    "Authorization" :'Bearer '+token.tokendata.access_token,
	    'Content-type': 'application/json'
	    }},
	  function optionalCallback(err, httpResponse, result) {
	    if (err) {
	        return callback([],{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:err});
	    }else{
	      var body=JSON.parse(result);
//	      console.log(body)
	      if(body.error){
	    	  return callback(null,{status: "error", message:((body.error.message)?body.error.message:'The operation did not execute as expected. Please raise a ticket to support'),data:body})
	      }else{
	    	  return callback(null,{status: "success", message:'Azure Gallery Images List.',data:body})
	      }
	    }
	   });
    })
}

let galleryImageVersionList=(reqbody,callback)=>{
	if(!reqbody.subscription_id)return callback(400,{status: "error", message:'Subscription id is missing'});
	if(!reqbody.gallery_resource_group)return callback(400,{status: "error", message:'Gallery Resource group name is missing'});
	if(!reqbody.gallery_name)return callback(400,{status: "error", message:'Gallery Name is missing'});
	if(!reqbody.gallery_image_name)return callback(400,{status: "error", message:'Gallery Image Name is missing'});
	if(!reqbody.client_id)return callback(400,{status: "error", message:'Client Id is missing'});
	var subscription_id=reqbody.subscription_id;
	var gallery_resource_group=reqbody.gallery_resource_group;
	var gallery_name=reqbody.gallery_name;
	var gallery_image_name=reqbody.gallery_image_name;
	var clientId=reqbody.client_id;
	new Promise(function(resolve,reject){
	    azureModel.azure_authtoken(clientId,function(error,result){
	        if(error) return resolve([])
	        return resolve(result)
	     })
	}).then(function(token){
	  if(!token){
	    var response={status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:token}
	    return callback([],response);
	  }
	  var url=`https://management.azure.com/subscriptions/${subscription_id}/resourceGroups/${gallery_resource_group}/providers/Microsoft.Compute/galleries/${gallery_name}/images/${gallery_image_name}/versions?api-version=2019-12-01`;
	  ////console.log(url)
	  request.get({url:url,headers : {
	    "Authorization" :'Bearer '+token.tokendata.access_token,
	    'Content-type': 'application/json'
	    }},
	  function optionalCallback(err, httpResponse, result) {
	    if (err) {
	        return callback([],{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:err});
	    }else{
	      var body=JSON.parse(result);
//	      console.log(body)
	      if(body.error){
	    	  return callback(null,{status: "error", message:((body.error.message)?body.error.message:'The operation did not execute as expected. Please raise a ticket to support'),data:body})
	      }else{
	    	  return callback(null,{status: "success", message:'Azure Gallery Image Version List.',data:body})
	      }
	    }
	   });
    })
}

let getVmBackupVaultNames=(reqbody,callback)=>{
	if(!reqbody.subscription_id)return callback(400,{status: "error", message:'Subscription id is missing'});
	if(!reqbody.backup_resource_group_name)return callback(400,{status: "error", message:'Backup Resource group name is missing'});
	if(!reqbody.client_id)return callback(400,{status: "error", message:'Client Id is missing'});
	var subscription_id=reqbody.subscription_id;
	var backup_resource_group_name=reqbody.backup_resource_group_name;
	var clientId=reqbody.client_id;
	return new Promise(async function(resolve,reject) {
	      let sql = `select n.*
	      from azure_backup_vault_names as n 
	      where  n.subscriptionId='${subscription_id}' and n.resource_group='${backup_resource_group_name}' and n.record_status=1 order by n.id DESC`;
	      ////console.log(sql);
	      db.query(sql,async function(error,items,fields){
	    	  dbFunc.connectionRelease;
	          if(!!error) {
	        	  return callback([],{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:error});
	              resolve(error);
	          } else {
	        	  let body = {value:[]};
	        	  for await (const item of items) {
	        		  body.value.push(JSON.parse(item.response_obj));
	              }
	        	  return callback(null,{status: "success", message:'Azure Backup Vault Names List.',data:body})
	              resolve(items);
	          }
	     });
	  });
	/*new Promise(function(resolve,reject){
	    azureModel.azure_authtoken(clientId,function(error,result){
	        if(error) return resolve([])
	        return resolve(result)
	     })
	}).then(function(token){
	  if(!token){
	    var response={status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:token}
	    return callback([],response);
	  }
	  var url=`https://management.azure.com/subscriptions/${subscription_id}/resourceGroups/${backup_resource_group_name}/providers/Microsoft.RecoveryServices/vaults?api-version=2016-06-01`;
	  ////console.log(url)
	  request.get({url:url,headers : {
	    "Authorization" :'Bearer '+token.tokendata.access_token,
	    'Content-type': 'application/json'
	    }},
	  function optionalCallback(err, httpResponse, result) {
	    if (err) {
	        return callback([],{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:err});
	    }else{
	      var body=JSON.parse(result);
//	      console.log(body)
	      if(body.error){
	    	  return callback(null,{status: "error", message:((body.error.message)?body.error.message:'The operation did not execute as expected. Please raise a ticket to support'),data:body})
	      }else{
	    	  return callback(null,{status: "success", message:'Azure Backup Vault Names List.',data:body})
	      }
	    }
	   });
    })*/
}

let getVmBackupVaultPolicies=(reqbody,callback)=>{
	if(!reqbody.subscription_id)return callback(400,{status: "error", message:'Subscription id is missing'});
	if(!reqbody.backup_resource_group_name)return callback(400,{status: "error", message:'Backup Resource Group Name is missing'});
	if(!reqbody.recovery_vault_name)return callback(400,{status: "error", message:'Backup Vault Name is missing'});
	if(!reqbody.client_id)return callback(400,{status: "error", message:'Client Id is missing'});
	var subscription_id=reqbody.subscription_id;
	var backup_resource_group_name=reqbody.backup_resource_group_name;
	var recovery_vault_name=reqbody.recovery_vault_name;
	var clientId=reqbody.client_id;
	return new Promise(async function(resolve,reject) {
	      let sql = `select n.*
	      from azure_backup_vault_policies as n 
	      where  n.subscriptionId='${subscription_id}' and n.resource_group='${backup_resource_group_name}'  
	      and n.recovery_vault_name='${recovery_vault_name}' 
	      and n.record_status=1 and n.is_visible_to_frontend=1 order by n.id DESC`;
	      ////console.log(sql);
	      db.query(sql,async function(error,items,fields){
	    	  dbFunc.connectionRelease;
	          if(!!error) {
	        	  return callback([],{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:error});
	              resolve(error);
	          } else {
	        	  let body = {value:[]};
	        	  for await (const item of items) {
	        		  body.value.push(JSON.parse(item.response_obj));
	              }
	        	  return callback(null,{status: "success", message:'Azure Backup Vault Policies List.',data:body})
	              resolve(items);
	          }
	     });
	  });
	/*new Promise(function(resolve,reject){
	    azureModel.azure_authtoken(clientId,function(error,result){
	        if(error) return resolve([])
	        return resolve(result)
	     })
	}).then(function(token){
	  if(!token){
	    var response={status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:token}
	    return callback([],response);
	  }
	  var url=`https://management.azure.com/subscriptions/${subscription_id}/resourceGroups/${backup_resource_group_name}/providers/Microsoft.RecoveryServices/vaults/${recovery_vault_name}/backupPolicies?api-version=2021-02-10`;
	  ////console.log(url)
	  request.get({url:url,headers : {
	    "Authorization" :'Bearer '+token.tokendata.access_token,
	    'Content-type': 'application/json'
	    }},
	  function optionalCallback(err, httpResponse, result) {
	    if (err) {
	        return callback([],{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:err});
	    }else{
	      var body=JSON.parse(result);
//	      console.log(body)
	      if(body.error){
	    	  return callback(null,{status: "error", message:((body.error.message)?body.error.message:'The operation did not execute as expected. Please raise a ticket to support'),data:body})
	      }else{
	    	  return callback(null,{status: "success", message:'Azure Backup Vault Policies List.',data:body})
	      }
	    }
	   });
    })*/
}

let extendDisk=(reqbody,callback)=>{
	if(!reqbody.subscription_id)return callback(400,{status: "error", message:'Subscription id is missing'});
	if(!reqbody.resource_group_name)return callback(400,{status: "error", message:'Resource Group Name is missing'});
	if(!reqbody.disk_name)return callback(400,{status: "error", message:'Disk Name is missing'});
	if(!reqbody.disk_size)return callback(400,{status: "error", message:'Disk Size is missing'});
	if(!reqbody.client_id)return callback(400,{status: "error", message:'Client Id is missing'});
	var subscription_id=reqbody.subscription_id;
	var resource_group_name=reqbody.resource_group_name;
	var disk_name=reqbody.disk_name;
	var disk_size=reqbody.disk_size;
	var clientId=reqbody.client_id;
	new Promise(function(resolve,reject){
	    azureModel.azure_authtoken(clientId,function(error,result){
	        if(error) return resolve([])
	        return resolve(result)
	     })
	}).then(function(token){
	  if(!token){
	    var response={status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:token}
	    return callback([],response);
	  }
	  var url=`https://management.azure.com/subscriptions/${subscription_id}/resourceGroups/${resource_group_name}/providers/Microsoft.Compute/disks/${disk_name}?api-version=2020-12-01`;
	  ////console.log(url)
	  
	  var options = {
	    'method': 'PATCH',
	    'url': url,
	    'headers': {
	      'Authorization': 'Bearer '+token.tokendata.access_token,
	      'Content-Type': 'application/json'
	    },
	    body: JSON.stringify({
	      "properties": {
	        "diskSizeGB": disk_size
	      }
	    })

	  };
	  request(options, function (error, response) {
	    if (error){ 
//	    	throw new Error(error);
	    	return callback([],{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:error});
	    }else{
		      var body=JSON.parse(response.body);
//		      console.log(body)
		      if(body.error){
		    	  return callback(null,{status: "error", message:((body.error.message)?body.error.message:'The operation did not execute as expected. Please raise a ticket to support'),data:body})
		      }else{
		    	  return callback(null,{status: "success", message:'Extend Disk requested successfully.',data:body})
		      }
		    }
	  });

    })
}

let getGalleryImageVersions = async (reqObj,callback)=>{
	console.log(reqObj);
    if(!reqObj.client_id) return callback(1,{status:"error",message:"Please provide the client_id."});
    
    return new Promise(async (resolve,reject) => {
    	let sql = `Select *
		    from azure_gallery_image_versions where record_status = 1`;
	    sql += ` and clientid = '${reqObj.client_id}' `;
    	if(typeof reqObj.galleryName != 'undefined' && reqObj.galleryName != ''){
  	      	sql += ` and galleryName = '${reqObj.galleryName}' `;
      	}
    	if(typeof reqObj.galleryImageName != 'undefined' && reqObj.galleryImageName != ''){
  	      	sql += ` and galleryImageName = '${reqObj.galleryImageName}' `;
      	}
//    	if(typeof reqObj.provision_type != 'undefined' && reqObj.provision_type != ''
//    		 && (typeof reqObj.user_role == 'undefined' || (typeof reqObj.user_role != 'undefined' && reqObj.user_role != config.ADMIN_ROLE_ID))){
//  	      	sql += ` and provision_type = '${reqObj.provision_type}' `;
//      	}
    	if(typeof reqObj.osType != 'undefined' && reqObj.osType != '' && reqObj.osType != 'ALL'){
 	      	sql += ` and osType = '${reqObj.osType}' `;
     	}
    	if(typeof reqObj.osMiddleware != 'undefined' && reqObj.osMiddleware != '' && reqObj.osMiddleware != 'ALL'){
    		let osMiddleware = reqObj.osMiddleware.split("@$");
    		if(osMiddleware[0] && osMiddleware[0] != '' && osMiddleware[0] != 'null'){
    			sql += ` and dbType = '${osMiddleware[0]}' `;
    		}
    		if(osMiddleware[1] && osMiddleware[1] != '' && osMiddleware[1] != 'null'){
    			sql += ` and middleWare = '${osMiddleware[1]}' `;
    		}
     	}
    	
    	sql += ` group by subscription_id, resourceGroup, galleryName`;
    	if(typeof reqObj.galleryName != 'undefined' && reqObj.galleryName != ''){
  	      	sql += `, galleryImageName`;
      	}
    	if(typeof reqObj.galleryImageName != 'undefined' && reqObj.galleryImageName != ''){
  	      	sql += `, galleryImageVersionName`;
      	}
    	
    	sql += ` order by resourceGroup, galleryName, galleryImageName, galleryImageVersionName asc`;
    	console.log(sql);
    	db.query(sql,async (error,gallery_image_versions,fields)=>{
    		dbFunc.connectionRelease;
            if(!!error) {
            	return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve([]);
            } else {
            	let gallery_image_versions_new = [];
//            	if(typeof reqObj.galleryName == 'undefined'){
//            		gallery_image_versions_new = gallery_image_versions;
//            	}else{
            		for await (const item of gallery_image_versions) {
  	        		  let gallery_response_obj = JSON.parse(item.gallery_response_obj);
  	        		  let image_response_obj = JSON.parse(item.image_response_obj);
  	        		  let version_response_obj = JSON.parse(item.version_response_obj);
						// console.log("image_response_obj ---- ", image_response_obj);
						// console.log("version_response_obj ---- ", version_response_obj.tags);
  	        		  if(typeof reqObj.galleryName == 'undefined' 
	        			  && !(gallery_response_obj.tags && gallery_response_obj.tags.Status && gallery_response_obj.tags.Status == 'Deprecated')
	        			  && !(gallery_response_obj.tags && gallery_response_obj.tags['UCP-Status'] && gallery_response_obj.tags['UCP-Status'] == 'Deprecated')
	        		  ){
	        			gallery_image_versions_new.push(item);
	        		  }else if(typeof reqObj.galleryImageName != 'undefined' && reqObj.galleryImageName != ''
  	        			  && !(version_response_obj.tags && version_response_obj.tags.Status && version_response_obj.tags.Status == 'Deprecated')
  	        			  && !(version_response_obj.tags && version_response_obj.tags['UCP-Status'] && version_response_obj.tags['UCP-Status'] == 'Deprecated')
  	        		  ){
	        			  if(env.env == 'dhlonprem'){
		        			  if(!version_response_obj.tags['UCP-Status']  || version_response_obj.tags['UCP-Status'].toLowerCase() == 'all'){
		        				  gallery_image_versions_new.push(item);	  
		        			  }
	        			  }else{
	        				  gallery_image_versions_new.push(item);
	        			  }
  	        			
  	        		  }else if(typeof reqObj.galleryImageName == 'undefined' 
  	        			  && !(image_response_obj.tags && image_response_obj.tags.Status && image_response_obj.tags.Status == 'Deprecated')
  	        			  && !(image_response_obj.tags && image_response_obj.tags['UCP-Status'] && image_response_obj.tags['UCP-Status'] == 'Deprecated')
  	        			  ){
//  	        			  console.log("image_response_obj.tags['UCP-Provisioning-Type'] ---- ", image_response_obj.tags['UCP-Provisioning-Type']);
  	        			  if(image_response_obj.tags 
  	        					  && image_response_obj.tags['UCP-Provisioning-Type'] 
		  	        			  && (image_response_obj.tags['UCP-Provisioning-Type'].toLowerCase() == 'all'
		  	        				  || image_response_obj.tags['UCP-Provisioning-Type'].toLowerCase() == reqObj.provision_type.toLowerCase())
  	        				  ){
  	        				  gallery_image_versions_new.push(item);
  	        			  }
  	        		  }
  	            	}
//            	}
				// console.log("gallery_image_versions_new ---- ", gallery_image_versions_new);
            	return callback(null,{status:"success",message:"Resource Group BU Users Updated Successfully.",data:gallery_image_versions_new});
                resolve(gallery_image_versions)
            }
    	});
    });
}

let getGalleryOsMiddleware = async (reqObj,callback)=>{
	console.log(reqObj);
    if(!reqObj.client_id) return callback(1,{status:"error",message:"Please provide the client_id."});
    
    return new Promise(async (resolve,reject) => {
    	let sql = `Select dbType, middleWare, osType, image_response_obj
		    from azure_gallery_image_versions where record_status = 1
		    and dbType is NOT NULL and middleWare is NOT NULL
		    `;
	    sql += ` and clientid = '${reqObj.client_id}' `;
    	if(typeof reqObj.galleryName != 'undefined' && reqObj.galleryName != ''){
  	      	sql += ` and galleryName = '${reqObj.galleryName}' `;
      	}
    	if(typeof reqObj.galleryImageName != 'undefined' && reqObj.galleryImageName != ''){
  	      	sql += ` and galleryImageName = '${reqObj.galleryImageName}' `;
      	}
//    	if(typeof reqObj.provision_type != 'undefined' && reqObj.provision_type != ''
//    		 && (typeof reqObj.user_role == 'undefined' || (typeof reqObj.user_role != 'undefined' && reqObj.user_role != config.ADMIN_ROLE_ID))){
//  	      	sql += ` and provision_type = '${reqObj.provision_type}' `;
//      	}
    	if(typeof reqObj.osType != 'undefined' && reqObj.osType != '' && reqObj.osType != 'ALL'){
 	      	sql += ` and osType = '${reqObj.osType}' `;
     	}
    	
    	sql += ` group by subscription_id, resourceGroup, galleryName, galleryImageName `;
    	
    	sql += ` order by osType, dbType, middleWare asc`;
    	console.log(sql);
    	db.query(sql,async (error,gallery_image_versions,fields)=>{
    		dbFunc.connectionRelease;
            if(!!error) {
            	return callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
                resolve([]);
            } else {
            	let gallery_image_versions_new = [];
            	let osMiddlewareData = [];
            	gallery_image_versions_new.push({key:"ALL",value:"ALL"}, {key:"NA@$NA",value:"Plain Images"});
            	osMiddlewareData.push("ALL","NA@$NA");
        		for await (const item of gallery_image_versions) {
        		  let image_response_obj = JSON.parse(item.image_response_obj);
        		  if(typeof reqObj.galleryImageName == 'undefined' 
        			  && !(image_response_obj.tags && image_response_obj.tags.Status && image_response_obj.tags.Status == 'Deprecated')
        			  && !(image_response_obj.tags && image_response_obj.tags['UCP-Status'] && image_response_obj.tags['UCP-Status'] == 'Deprecated')
        			  && item.dbType != '' && item.middleWare != ''
        			  ){
        			  let lineItem = {"key":item.dbType+"@$"+item.middleWare, 
	        				"value":((item.dbType && item.middleWare && item.dbType != 'NA' && item.middleWare != 'NA')?item.dbType+"-"+item.middleWare:((item.dbType != 'NA')?item.dbType:item.middleWare))
        				};
        			  if(osMiddlewareData.indexOf(lineItem.key) < 0){
        				  if(lineItem.value == 'NA'){
        					  lineItem.value = 'Plain Images';
        				  }else{
        					  lineItem.value = item.osType+" + "+lineItem.value;
        				  }
//        				  console.log("image_response_obj.tags['UCP-Provisioning-Type'] ---- ", image_response_obj.tags['UCP-Provisioning-Type']);
        				  if(image_response_obj.tags 
  	        					  && image_response_obj.tags['UCP-Provisioning-Type'] 
		  	        			  && (image_response_obj.tags['UCP-Provisioning-Type'].toLowerCase() == 'all'
		  	        				  || image_response_obj.tags['UCP-Provisioning-Type'].toLowerCase() == reqObj.provision_type.toLowerCase())
  	        				  ){
		        			gallery_image_versions_new.push(lineItem);
		        			osMiddlewareData.push(lineItem.key);
        				  }
        			  }
//        			  console.log("osMiddlewareData --- ", osMiddlewareData);
        		  }
            	}
            	return callback(null,{status:"success",message:"Resource Group BU Users Updated Successfully.",data:gallery_image_versions_new});
                resolve(gallery_image_versions)
            }
    	});
    });
}

let getStorageAccountNames=(reqbody,callback)=>{
	if(!reqbody.subscription_id)return callback(400,{status: "error", message:'Subscription id is missing'});
	if(!reqbody.storage_resource_group_name)return callback(400,{status: "error", message:'Resource Group Name is missing'});
	if(!reqbody.client_id)return callback(400,{status: "error", message:'Client Id is missing'});
	
	var subscription_id=reqbody.subscription_id;
	var resource_group_name=reqbody.storage_resource_group_name;
	var clientId=reqbody.client_id;
	let body = {value:[]};
	
	return new Promise(async function(resolve,reject) {
	      let sql = `select n.*
	      from azure_storage_account_names as n 
	      where  n.subscriptionId='${subscription_id}' and n.resource_group='${resource_group_name}'  
	      and n.record_status=1 order by n.id DESC`;
	      ////console.log(sql);
	      db.query(sql,async function(error,items,fields){
	    	  dbFunc.connectionRelease;
	          if(!!error) {
	        	  return callback([],{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:error});
	              resolve(error);
	          } else {
	        	  for await (const item of items) {
	        		  let resourceObj = JSON.parse(item.response_obj);
	        		  if(resourceObj.tags && resourceObj.tags.Purpose && resourceObj.tags.Purpose == 'BootDiagnostics'){
	        			  body.value.push(resourceObj);
	        		  }
	              }
	        	  return callback(null,{status: "success", message:'Azure Storage Accounts List.',data:body})
	              resolve(items);
	          }
	     });
	  });
	/*new Promise(function(resolve,reject){
	    azureModel.azure_authtoken(clientId,function(error,result){
	        if(error) return resolve([])
	        return resolve(result)
	     })
	}).then(function(token){
	  if(!token){
	    var response={status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:token}
	    return callback([],response);
	  }
	  var url = `https://management.azure.com/subscriptions/${subscription_id}/resourceGroups/${resource_group_name}/providers/Microsoft.Storage/storageAccounts?api-version=2021-04-01`;
	  ////console.log(url)
	  request.get({url:url,headers : {
	    "Authorization" :'Bearer '+token.tokendata.access_token,
	    'Content-type': 'application/json'
	    }},
	  function optionalCallback(err, httpResponse, result) {
	    if (err) {
	        return callback([],{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:err});
	    }else{
	      var body=JSON.parse(result);
//	      console.log(body)
	      if(body.error){
	    	  return callback(null,{status: "error", message:((body.error.message)?body.error.message:'The operation did not execute as expected. Please raise a ticket to support'),data:body})
	      }else{
	    	  return callback(null,{status: "success", message:'Azure Storage Accounts List.',data:body})
	      }
	    }
	   });
    })*/
}
function getHostNames(reqbody,callback) {
	console.log("reqbody --- ", JSON.stringify(reqbody));
//	return callback(null,reqbody);
	if(typeof(reqbody.subscription)=='undefined' || reqbody.subscription==''){
	    var response={status:"error", message:'Please provide subscription'}
	    return callback(1,response);
	}
	if(typeof(reqbody.resourceGroupName)=='undefined' || reqbody.resourceGroupName==''){
	    var response={status:"error", message:'Please provide resourceGroup'}
	    return callback(1,response);
	}
	if(typeof(reqbody.osType)=='undefined' || reqbody.osType==''){
	    var response={status:"error", message:'Please provide OS Type'}
	    return callback(1,response);
	}
	if(reqbody.osType == 'Windows' && (typeof(reqbody.region)=='undefined' || reqbody.region=='')){
	    var response={status:"error", message:'Please provide Region'}
	    return callback(1,response);
	}
	return new Promise(async function(resolve,reject) {
		let sql = `SELECT vd.host_name,av.privateIpAddress, vd.id 
			FROM c4_vm_details as vd 
			INNER JOIN azure_vms as av ON (av.vm_detail_id = vd.id)
			where vd.status = '1' 
			and av.subscriptionId = '${reqbody.subscription}' 
			and av.resourceGroup = '${reqbody.resourceGroupName}' 
			and av.osType like '${reqbody.osType}' 
			`;
		if(typeof(reqbody.region) !='undefined' && reqbody.region!=''){
	    	let region = reqbody.region.split("@$")[1];
	    	sql +=` and av.location like '${region}' `;
	  	}
		if(typeof(reqbody.appType) !='undefined' && reqbody.appType!=''){
	    	let appType = reqbody.appType.split("@$")[0].replace(" ","");
	    	if(appType != 'Plain' && appType.toLowerCase() != 'all'){
	    		sql +=` and vd.os_template_name like '%${appType}%' `;
	    	}else{
	    		let appTypeArr = [];
	    		if(reqbody.osType == 'Linux'){
	    			if(reqbody.appTypesList && reqbody.appTypesList.length > 0){
			    		for await (var appTypeItem of reqbody.appTypesList){
			    			if(appTypeItem.name != 'Plain'){
			    				appTypeArr.push(` os_template_name not like '%${appTypeItem.name.replace(" ","")}%' `);
			    			}
			    		}
	    			}
	    		}else{
	    			if(reqbody.WINDOWS_APPLICATION_TYPES && reqbody.WINDOWS_APPLICATION_TYPES.length > 0){
		    			for await (var appTypeItem of reqbody.WINDOWS_APPLICATION_TYPES){
			    			if(appTypeItem.value != 'Plain'){
			    				appTypeArr.push(` os_template_name not like '%${appTypeItem.value.replace(" ","")}%' `);
			    			}
			    		}
	    			}
	    		}
	    		if(appTypeArr.length > 0){
		    		sql +=` and ( `;
		    		sql += appTypeArr.join(" and ");
		    		sql +=` ) `;
	    		}
	    	}
	  	}

		if(typeof(reqbody.vm_status) != 'undefined' && reqbody.vm_status != ''){
	    	sql +=` and vd.vm_status = '${reqbody.vm_status}' `;
	  	}
	    sql +=` order by vd.host_name ASC`;
	    console.log("getHostNames sql ---- ", sql);
	    db.query(sql,async function(error,items,fields){
	    	  dbFunc.connectionRelease;
	          if(!!error) {
	        	  return callback(1,{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:error});
	              resolve(error);
	          } else {
	        	  return callback(null,{status: "success", message:'Host Names List.',data:items})
	              resolve(items);
	          }
	    });
	});
}

let getCmdbCountries=(reqbody,callback)=>{
	return new Promise(async function(resolve,reject) {
	      let sql = `SELECT cou.* FROM cmdb_countries cou INNER JOIN cmdb_regions reg ON (cou.u_region = reg.sys_id) where 1`;
	      if(reqbody.record_status && reqbody.record_status !='' && reqbody.record_status !='ALL'){
	    	  sql +=` and cou.record_status = '${reqbody.record_status}' order by cou.u_name DESC`;
	      }else if(reqbody.record_status && reqbody.record_status !='' && reqbody.record_status =='ALL'){
	    	  sql +=` order by cou.id DESC`;
	      }else{
	    	  sql +=` and cou.record_status = '1' order by cou.u_name ASC`;
	      }
	      console.log(sql);
	      db.query(sql,async function(error,items,fields){
	    	  dbFunc.connectionRelease;
	          if(!!error) {
	        	  return callback([],{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:error});
	              resolve(error);
	          } else {
	        	  return callback(null,{status: "success", message:'CMDB Countries List.',data:items})
	              resolve(items);
	          }
	     });
	});
}

let getCmdbRegions=(reqbody,callback)=>{
	return new Promise(async function(resolve,reject) {
	      let sql = `SELECT reg.* FROM cmdb_regions reg INNER JOIN cmdb_countries cou ON (cou.u_region = reg.sys_id) where 1`;
	      if(reqbody.record_status && reqbody.record_status !='' && reqbody.record_status !='ALL'){
	    	  sql +=` and reg.record_status = '${reqbody.record_status}'  GROUP BY reg.sys_id order by reg.u_name DESC`;
	      }else if(reqbody.record_status && reqbody.record_status !='' && reqbody.record_status =='ALL'){
	    	  sql +=`  GROUP BY reg.sys_id order by reg.id DESC`;
	      }else{
	    	  sql +=` and reg.record_status = '1'  GROUP BY reg.sys_id order by reg.u_name ASC`;
	      }
	      console.log(sql);
	      db.query(sql,async function(error,items,fields){
	    	  dbFunc.connectionRelease;
	          if(!!error) {
	        	  return callback([],{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:error});
	              resolve(error);
	          } else {
	        	  return callback(null,{status: "success", message:'CMDB Regions List.',data:items})
	              resolve(items);
	          }
	     });
	});
}

let getCmdbImpacts=(reqbody,callback)=>{
	return new Promise(async function(resolve,reject) {
	      let sql = `select *
	      from cmdb_impacts 
	      where 1 `;
	      if(reqbody.record_status && reqbody.record_status !='' && reqbody.record_status !='ALL'){
	    	  sql +=` and record_status = '${reqbody.record_status}' order by order_number ASC`;
	      }else if(reqbody.record_status && reqbody.record_status !='' && reqbody.record_status =='ALL'){
	    	  sql +=` order by order_number ASC`;
	      }else{
	    	  sql +=` and record_status = '1' order by order_number ASC`;
	      }
	      console.log(sql);
	      db.query(sql,async function(error,items,fields){
	    	  dbFunc.connectionRelease;
	          if(!!error) {
	        	  return callback([],{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:error});
	              resolve(error);
	          } else {
	        	  return callback(null,{status: "success", message:'CMDB Impacts List.',data:items})
	              resolve(items);
	          }
	     });
	});
}

let getCmdbServices=(reqbody,callback)=>{
	return new Promise(async function(resolve,reject) {
	      let sql = `select sys_id, u_name
	      from cmdb_services 
	      where 1 `;
	      if(reqbody.record_status && reqbody.record_status !='' && reqbody.record_status !='ALL'){
	    	  sql +=` and record_status = '${reqbody.record_status}' order by u_name DESC`;
	      }else if(reqbody.record_status && reqbody.record_status !='' && reqbody.record_status =='ALL'){
	    	  sql +=` order by id DESC`;
	      }else{
	    	  sql +=` and record_status = '1' order by u_name ASC`;
	      }
	      console.log(sql);
	      db.query(sql,async function(error,items,fields){
	    	  dbFunc.connectionRelease;
	          if(!!error) {
	        	  return callback([],{status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:error});
	              resolve(error);
	          } else {
	        	  return callback(null,{status: "success", message:'CMDB Services List.',data:items})
	              resolve(items);
	          }
	     });
	});
}

let decommissionVm = async (reqObj,callback)=>{
    console.log(reqObj);
//    return;
    
    let decom_sql = `SELECT av.*,vd.vm_creation_request_obj, vd.id as vmId, vd.order_details_id, 
    	vd.is_cluster, vd.cluster_id 
    	FROM c4_vm_details as vd
        inner join azure_vms as av on av.vm_detail_id = vd.id
        where vd.id = '${reqObj.vmId}' AND vd.is_locked=0 limit 1`;
    db.query(decom_sql,async function(error,rows,fields){
    	dbFunc.connectionRelease;
        if(!!error) {
            console.log(error);
            callback(1,{status:"error", success:0,"message":"The operation did not execute as expected. Please raise a ticket to support",vmId: reqObj.vmId});
        } else {
        	console.log("rows --- ", rows);
        	if(rows.length > 0){
        		if(rows[0].is_cluster == 1){
        			let cluster_sql = `SELECT av.*,
        		    	vd.vm_creation_request_obj, vd.id as vmId, vd.order_details_id, 
        		    	vd.is_cluster, vd.cluster_id 
        		    	FROM c4_vm_details as vd
        		        inner join azure_vms as av on av.vm_detail_id = vd.id
        		        where vd.cluster_id = '${rows[0].cluster_id}' and vd.id != '${reqObj.vmId}' limit 1`;
        		    console.log("cluster_sql ---- ", cluster_sql);
        		    db.query(cluster_sql,async function(error,clusterRows,fields){
        		    	dbFunc.connectionRelease;
        		        if(!!error) {
        		            console.log(error);
        		            callback(1,{status:"error", success:0,"message":"The operation did not execute as expected. Please raise a ticket to support",vmId: reqObj.vmId});
        		        } else {
        		        	console.log("clusterRows --- ", clusterRows);
//        		        	return;
        		        	if(clusterRows.length > 0){
        		        		let decommissionValues = JSON.parse(rows[0].vm_creation_request_obj);
    						    console.log("initial decommissionValues --- ", JSON.stringify(decommissionValues));
    				        	let vm_response_obj = JSON.parse(rows[0].response_obj);
    				        	let cluster_vm_response_obj = JSON.parse(clusterRows[0].response_obj);
    				        	decommissionValues.virtual_machine_size = ((vm_response_obj.properties && vm_response_obj.properties.hardwareProfile && vm_response_obj.properties.hardwareProfile.vmSize)?vm_response_obj.properties.hardwareProfile.vmSize:"");
    				//        	if(vm_response_obj.properties 
    				//        			&& vm_response_obj.properties.networkProfile
    				//        			&& vm_response_obj.properties.networkProfile.networkInterfaces
    				//        			&& vm_response_obj.properties.networkProfile.networkInterfaces[0]
    				//        			&& vm_response_obj.properties.networkProfile.networkInterfaces[0].id
    				//        	){
    				//        		decommissionValues.nic_name = vm_response_obj.properties.networkProfile.networkInterfaces[0].id.split("/")[8];
    				//        	}
    				        	
    				        	let insDecommissionValues = {
    				        			cloudid : config.AZURE.cloudid,
//    						    		vm_id : reqObj.vmId,
    						    		is_cluster : 1,
//    						    		host_name : rows[0].name,
//    						    		cluster_name : clusterRows[0].name,
    						    		created_by : reqObj.request_processed_user_id,
    						    		createddate : (new Date().getTime() / 1000),
//    						    		request_obj : JSON.stringify(decommissionValues)
    						    };
    				        	if(decommissionValues.virtual_machine_name == rows[0].name){
    				        		insDecommissionValues.host_name = rows[0].name;
    				        		insDecommissionValues.cluster_name = clusterRows[0].name;
    				        		insDecommissionValues.vm_id = rows[0].vmId;
    				        		insDecommissionValues.cluster_vm_id = clusterRows[0].vmId;
        						    		
	    				        	decommissionValues.managed_disk_name = '';
	    							decommissionValues.managed_disk_host_caching = '';
	    							decommissionValues.managed_disk_storage_size = '';
	    							decommissionValues.managed_disk_size = '';
	    							decommissionValues.managed_disk_size_storage_account_type = '';
	    				        	if(vm_response_obj.properties
	    				        			&& vm_response_obj.properties.storageProfile
	    				        			&& vm_response_obj.properties.storageProfile.dataDisks
	    				        			&& vm_response_obj.properties.storageProfile.dataDisks.length > 0){
	    				        		for(let i =0; i < vm_response_obj.properties.storageProfile.dataDisks.length; i++){
	    				        			if(vm_response_obj.properties.storageProfile.dataDisks[i].name.indexOf(rows[0].name+"-disk") == 0){
	    						        		if(decommissionValues.managed_disk_name == ''){
	    						        			decommissionValues.managed_disk_name = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
	    						        			decommissionValues.managed_disk_host_caching = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
	    						        			decommissionValues.managed_disk_storage_size = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
	    						        			decommissionValues.managed_disk_size = '['+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
	    						        			decommissionValues.managed_disk_size_storage_account_type = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
	    						    	    	}else{
	    						    	    		decommissionValues.managed_disk_name +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
	    						    	    		decommissionValues.managed_disk_host_caching +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
	    						    	    		decommissionValues.managed_disk_storage_size +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
	    						    		    	decommissionValues.managed_disk_size +=','+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
	    						    		    	decommissionValues.managed_disk_size_storage_account_type +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
	    						    	    	}
	    				        			}
	    				        		}
	    				        	}
	    				        	
	    				        	if(decommissionValues.managed_disk_name != ''){
	    					        	decommissionValues.managed_disk_name +=']';
	    					    		decommissionValues.managed_disk_host_caching +=']';
	    					    		decommissionValues.managed_disk_storage_size +=']';
	    					    		decommissionValues.managed_disk_size +=']';
	    					    		decommissionValues.managed_disk_size_storage_account_type +=']';
	    				        	}
	    				        	decommissionValues.private_ip_address = rows[0].privateIpAddress;
	    				        	
	    				        	//For VM2
	    				        	decommissionValues.managed_disk_name2 = '';
	    							decommissionValues.managed_disk_host_caching2 = '';
	    							decommissionValues.managed_disk_storage_size2 = '';
	    							decommissionValues.managed_disk_size2 = '';
	    							decommissionValues.managed_disk_size_storage_account_type2 = '';
	    				        	if(cluster_vm_response_obj.properties
	    				        			&& cluster_vm_response_obj.properties.storageProfile
	    				        			&& cluster_vm_response_obj.properties.storageProfile.dataDisks
	    				        			&& cluster_vm_response_obj.properties.storageProfile.dataDisks.length > 0){
	    				        		for(let i =0; i < cluster_vm_response_obj.properties.storageProfile.dataDisks.length; i++){
	    				        			if(cluster_vm_response_obj.properties.storageProfile.dataDisks[i].name.indexOf(clusterRows[0].name+"-disk") == 0){
	    						        		if(decommissionValues.managed_disk_name2 == ''){
	    						        			decommissionValues.managed_disk_name2 = '[\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
	    						        			decommissionValues.managed_disk_host_caching2 = '[\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
	    						        			decommissionValues.managed_disk_storage_size2 = '[\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
	    						        			decommissionValues.managed_disk_size2 = '['+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
	    						        			decommissionValues.managed_disk_size_storage_account_type2 = '[\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
	    						    	    	}else{
	    						    	    		decommissionValues.managed_disk_name2 +=',\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
	    						    	    		decommissionValues.managed_disk_host_caching2 +=',\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
	    						    	    		decommissionValues.managed_disk_storage_size2 +=',\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
	    						    		    	decommissionValues.managed_disk_size2 +=','+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
	    						    		    	decommissionValues.managed_disk_size_storage_account_type2 +=',\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
	    						    	    	}
	    				        			}
	    				        		}
	    				        	}
	    				        	
	    				        	if(decommissionValues.managed_disk_name2 != ''){
	    					        	decommissionValues.managed_disk_name2 +=']';
	    					    		decommissionValues.managed_disk_host_caching2 +=']';
	    					    		decommissionValues.managed_disk_storage_size2 +=']';
	    					    		decommissionValues.managed_disk_size2 +=']';
	    					    		decommissionValues.managed_disk_size_storage_account_type2 +=']';
	    				        	}
	    				        	decommissionValues.private_ip_address2 = clusterRows[0].private_ip_address2;
    				        	}else{
    				        		insDecommissionValues.host_name = clusterRows[0].name;
    				        		insDecommissionValues.cluster_name = rows[0].name;
    				        		insDecommissionValues.vm_id = clusterRows[0].vmId;
    				        		insDecommissionValues.cluster_vm_id = rows[0].vmId;
    				        		
    				        		decommissionValues.managed_disk_name = '';
	    							decommissionValues.managed_disk_host_caching = '';
	    							decommissionValues.managed_disk_storage_size = '';
	    							decommissionValues.managed_disk_size = '';
	    							decommissionValues.managed_disk_size_storage_account_type = '';
	    				        	if(cluster_vm_response_obj.properties
	    				        			&& cluster_vm_response_obj.properties.storageProfile
	    				        			&& cluster_vm_response_obj.properties.storageProfile.dataDisks
	    				        			&& cluster_vm_response_obj.properties.storageProfile.dataDisks.length > 0){
	    				        		for(let i =0; i < cluster_vm_response_obj.properties.storageProfile.dataDisks.length; i++){
	    				        			if(cluster_vm_response_obj.properties.storageProfile.dataDisks[i].name.indexOf(clusterRows[0].name+"-disk") == 0){
	    						        		if(decommissionValues.managed_disk_name == ''){
	    						        			decommissionValues.managed_disk_name = '[\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
	    						        			decommissionValues.managed_disk_host_caching = '[\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
	    						        			decommissionValues.managed_disk_storage_size = '[\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
	    						        			decommissionValues.managed_disk_size = '['+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
	    						        			decommissionValues.managed_disk_size_storage_account_type = '[\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
	    						    	    	}else{
	    						    	    		decommissionValues.managed_disk_name +=',\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
	    						    	    		decommissionValues.managed_disk_host_caching +=',\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
	    						    	    		decommissionValues.managed_disk_storage_size +=',\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
	    						    		    	decommissionValues.managed_disk_size +=','+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
	    						    		    	decommissionValues.managed_disk_size_storage_account_type +=',\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
	    						    	    	}
	    				        			}
	    				        		}
	    				        	}
	    				        	
	    				        	if(decommissionValues.managed_disk_name != ''){
	    					        	decommissionValues.managed_disk_name +=']';
	    					    		decommissionValues.managed_disk_host_caching +=']';
	    					    		decommissionValues.managed_disk_storage_size +=']';
	    					    		decommissionValues.managed_disk_size +=']';
	    					    		decommissionValues.managed_disk_size_storage_account_type +=']';
	    				        	}
	    				        	decommissionValues.private_ip_address = clusterRows[0].privateIpAddress;
	    				        	
	    				        	//For VM2
	    				        	decommissionValues.managed_disk_name2 = '';
	    							decommissionValues.managed_disk_host_caching2 = '';
	    							decommissionValues.managed_disk_storage_size2 = '';
	    							decommissionValues.managed_disk_size2 = '';
	    							decommissionValues.managed_disk_size_storage_account_type2 = '';
	    				        	if(vm_response_obj.properties
	    				        			&& vm_response_obj.properties.storageProfile
	    				        			&& vm_response_obj.properties.storageProfile.dataDisks
	    				        			&& vm_response_obj.properties.storageProfile.dataDisks.length > 0){
	    				        		for(let i =0; i < vm_response_obj.properties.storageProfile.dataDisks.length; i++){
	    				        			if(vm_response_obj.properties.storageProfile.dataDisks[i].name.indexOf(rows[0].name+"-disk") == 0){
	    						        		if(decommissionValues.managed_disk_name2 == ''){
	    						        			decommissionValues.managed_disk_name2 = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
	    						        			decommissionValues.managed_disk_host_caching2 = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
	    						        			decommissionValues.managed_disk_storage_size2 = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
	    						        			decommissionValues.managed_disk_size2 = '['+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
	    						        			decommissionValues.managed_disk_size_storage_account_type2 = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
	    						    	    	}else{
	    						    	    		decommissionValues.managed_disk_name2 +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
	    						    	    		decommissionValues.managed_disk_host_caching2 +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
	    						    	    		decommissionValues.managed_disk_storage_size2 +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
	    						    		    	decommissionValues.managed_disk_size2 +=','+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
	    						    		    	decommissionValues.managed_disk_size_storage_account_type2 +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
	    						    	    	}
	    				        			}
	    				        		}
	    				        	}
	    				        	
	    				        	if(decommissionValues.managed_disk_name2 != ''){
	    					        	decommissionValues.managed_disk_name2 +=']';
	    					    		decommissionValues.managed_disk_host_caching2 +=']';
	    					    		decommissionValues.managed_disk_storage_size2 +=']';
	    					    		decommissionValues.managed_disk_size2 +=']';
	    					    		decommissionValues.managed_disk_size_storage_account_type2 +=']';
	    				        	}
	    				        	decommissionValues.private_ip_address2 = rows[0].private_ip_address2;
    				        	}
    				        	
    						    decommissionValues.jenkins_job_type = 2;
    				        	console.log("final decommissionValues --- ", JSON.stringify(decommissionValues));
    				//		    return;
    				        	
    				        	insDecommissionValues.request_obj = JSON.stringify(decommissionValues);
    						    await db.query("INSERT INTO c4_vm_decommission_requests SET ?", insDecommissionValues ,async(error,vmUpdateVmRows,fields)=>{
    						    	dbFunc.connectionRelease;
    						    	console.log("error ----------------- ");
    						    	console.log(error);
    						        if(error) {
    						        	console.log(error);
    						            callback(1,{status:"error", success:0,"message":"The operation did not execute as expected. Please raise a ticket to support",vmId: reqObj.vmId});
    						        } else {
    						            console.log("vmUpdateVmRows --- ", vmUpdateVmRows);
    						            
    						            insDecommissionValues.request_obj = JSON.parse(insDecommissionValues.request_obj);
    						            insDecommissionValues.request_obj.request_ref__id = vmUpdateVmRows.insertId;
    						            azureModel.createVmTemplate(insDecommissionValues.request_obj, async function(err,vmUpdateVmResult){
    						            	vmUpdateVmUpdateResponse = await dbHandler.updateTableData('c4_vm_decommission_requests',{id:vmUpdateVmRows.insertId},
    						            			{
    								            		response_obj:JSON.stringify(vmUpdateVmResult),
    								            		status:((vmUpdateVmResult.success && vmUpdateVmResult.success == 1)?"1":"2"),
    								            		updateddate : (new Date().getTime() / 1000)
    							            		},async function(err,result){
    						                    console.log("c4_vm_decommission_requests data updated");
    						                    callback(null,{status:"success", success:1,"message":"Decommission requested successfully.", vmId: reqObj.vmId, ref_id: vmUpdateVmRows.insertId});
    						                });
    						            });
    						        }
    						    });
        		        	}else{
        			            console.log("clusterRows not found in decommissionVm");
        			            callback(1,{status:"error", success:0,"message":"The operation did not execute as expected. Please raise a ticket to support",vmId: reqObj.vmId});
        			        }
        		        }
        		    });
        		}else{
		        	let decommissionValues = JSON.parse(rows[0].vm_creation_request_obj);
				    console.log("initial decommissionValues --- ", JSON.stringify(decommissionValues));
		        	let vm_response_obj = JSON.parse(rows[0].response_obj);
		        	decommissionValues.virtual_machine_size = ((vm_response_obj.properties && vm_response_obj.properties.hardwareProfile && vm_response_obj.properties.hardwareProfile.vmSize)?vm_response_obj.properties.hardwareProfile.vmSize:"");
		        	if(vm_response_obj.properties 
		        			&& vm_response_obj.properties.networkProfile
		        			&& vm_response_obj.properties.networkProfile.networkInterfaces
		        			&& vm_response_obj.properties.networkProfile.networkInterfaces[0]
		        			&& vm_response_obj.properties.networkProfile.networkInterfaces[0].id
		        	){
		        		decommissionValues.nic_name = vm_response_obj.properties.networkProfile.networkInterfaces[0].id.split("/")[8];
		        	}
		        	
		        	decommissionValues.managed_disk_name = '';
					decommissionValues.managed_disk_host_caching = '';
					decommissionValues.managed_disk_storage_size = '';
					decommissionValues.managed_disk_size = '';
					decommissionValues.managed_disk_size_storage_account_type = '';
		        	if(vm_response_obj.properties
		        			&& vm_response_obj.properties.storageProfile
		        			&& vm_response_obj.properties.storageProfile.dataDisks
		        			&& vm_response_obj.properties.storageProfile.dataDisks.length > 0){
		        		for(let i =0; i < vm_response_obj.properties.storageProfile.dataDisks.length; i++){
		        			if(vm_response_obj.properties.storageProfile.dataDisks[i].name.indexOf(rows[0].name+"-disk") == 0){
				        		if(decommissionValues.managed_disk_name == ''){
				        			decommissionValues.managed_disk_name = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
				        			decommissionValues.managed_disk_host_caching = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
				        			decommissionValues.managed_disk_storage_size = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
				        			decommissionValues.managed_disk_size = '['+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
				        			decommissionValues.managed_disk_size_storage_account_type = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
				    	    	}else{
				    	    		decommissionValues.managed_disk_name +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
				    	    		decommissionValues.managed_disk_host_caching +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
				    	    		decommissionValues.managed_disk_storage_size +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
				    		    	decommissionValues.managed_disk_size +=','+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
				    		    	decommissionValues.managed_disk_size_storage_account_type +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
				    	    	}
		        			}
		        		}
		        		
		        		if(decommissionValues.managed_disk_name != ''){
			        		decommissionValues.managed_disk_name +=']';
			        		decommissionValues.managed_disk_host_caching +=']';
			        		decommissionValues.managed_disk_storage_size +=']';
			        		decommissionValues.managed_disk_size +=']';
			        		decommissionValues.managed_disk_size_storage_account_type +=']';
		        		}
		        	}
		        	
		        	decommissionValues.virtual_machine_size = ((vm_response_obj.properties && vm_response_obj.properties.hardwareProfile && vm_response_obj.properties.hardwareProfile.vmSize)?vm_response_obj.properties.hardwareProfile.vmSize:"")
				    decommissionValues.jenkins_job_type = 2;
		        	
		        	console.log("final decommissionValues --- ", JSON.stringify(decommissionValues));
		//		    return;
				    let insDecommissionValues = {
				    		cloudid : config.AZURE.cloudid,
				    		vm_id : reqObj.vmId,
				    		host_name : rows[0].name,
				    		created_by : reqObj.request_processed_user_id,
				    		createddate : (new Date().getTime() / 1000),
				    		request_obj : JSON.stringify(decommissionValues)
				    };
				    await db.query("INSERT INTO c4_vm_decommission_requests SET ?", insDecommissionValues ,async(error,vmDecommissionRows,fields)=>{
				    	dbFunc.connectionRelease;
				    	console.log("error ----------------- ");
				    	console.log(error);
				        if(error) {
				        	console.log(error);
				            callback(1,{status:"error", success:0,"message":"The operation did not execute as expected. Please raise a ticket to support",vmId: reqObj.vmId});
				        } else {
				            console.log("vmDecommissionRows");
				            console.log(vmDecommissionRows);
				            
				            insDecommissionValues.request_obj = JSON.parse(insDecommissionValues.request_obj);
				            insDecommissionValues.request_obj.request_ref__id = vmDecommissionRows.insertId;
				            azureModel.createVmTemplate(insDecommissionValues.request_obj, async function(err,vmDecommissionResult){
				            	vmDecommissionUpdateResponse = await dbHandler.updateTableData('c4_vm_decommission_requests',{id:vmDecommissionRows.insertId},
				            			{
						            		response_obj:JSON.stringify(vmDecommissionResult),
						            		status:((vmDecommissionResult.success && vmDecommissionResult.success == 1)?"1":"2"),
						            		updateddate : (new Date().getTime() / 1000)
					            		},async function(err,result){
				                    console.log("c4_vm_decommission_requests data updated");
				                    callback(null,{status:"success", success:1,"message":"Decommission requested successfully.",vmId: reqObj.vmId, ref_id: vmDecommissionRows.insertId});
				                });
				            });
				        }
				    });
		        }
        	}else{
	        	console.log("rows not found in decommissionVm");
	            callback(1,{status:"error", success:0,"message":"The operation did not execute as expected. Please raise a ticket to support",vmId: reqObj.vmId});
	        }
        }
    });
}

let updateVmRequestThroughJenkins = async (reqObj,callback)=>{
    console.log(reqObj);
//    return;

	let UCP_CONSTANTS_DATA = "";
    await commonModel.getOptionConfigJsonData({ option_type: "UCP_CONSTANTS" }, async function (err, result) {
      //		console.log("result 1111111 --- ", result);
      if (!err && result.data) {
        UCP_CONSTANTS_DATA = result.data;
      }
      console.log("UCP_CONSTANTS_DATA 1111111 --- ", UCP_CONSTANTS_DATA);
    });
    if (!UCP_CONSTANTS_DATA) {
      console.log("UCP_CONSTANTS not found");
      return callback(1, { status: "error", success: 0, message: 'The operation did not execute as expected. Please raise a ticket to support' });
    }
    
    let vm_sql = `SELECT av.*,
    	vd.vm_creation_request_obj, vd.id as vmId, vd.order_details_id, 
    	vd.is_cluster, vd.cluster_id 
    	FROM c4_vm_details as vd
        inner join azure_vms as av on av.vm_detail_id = vd.id
        where vd.id = '${reqObj.vm_id}' limit 1`;
    console.log("vm_sql ---- ", vm_sql);
    db.query(vm_sql,async function(error,rows,fields){
    	dbFunc.connectionRelease;
        if(!!error) {
            console.log(error);
            callback(1,{status:"error", success:0,"message":"The operation did not execute as expected. Please raise a ticket to support",vmId: reqObj.vmId});
        } else {
        	console.log(rows);
//        	return;
        	if(rows.length > 0){
        		if(rows[0].is_cluster == 1){
        			let cluster_sql = `SELECT av.*,
        		    	vd.vm_creation_request_obj, vd.id as vmId, vd.order_details_id, 
        		    	vd.is_cluster, vd.cluster_id 
        		    	FROM c4_vm_details as vd
        		        inner join azure_vms as av on av.vm_detail_id = vd.id
        		        where vd.cluster_id = '${rows[0].cluster_id}' and vd.id != '${reqObj.vm_id}' limit 1`;
        		    console.log("cluster_sql ---- ", cluster_sql);
        		    db.query(cluster_sql,async function(error,clusterRows,fields){
        		    	dbFunc.connectionRelease;
        		        if(!!error) {
        		            console.log(error);
        		            callback(1,{status:"error", success:0,"message":"The operation did not execute as expected. Please raise a ticket to support",vmId: reqObj.vmId});
        		        } else {
        		        	console.log(rows);
//        		        	return;
        		        	if(clusterRows.length > 0){
        		        		if(1){
        		        			let updateVmValues = JSON.parse(rows[0].vm_creation_request_obj);
	    						    console.log("initial updateVmValues --- ", JSON.stringify(updateVmValues));
	    						    updateVmValues.mountPointJson = {};
	    						    if(reqObj.mountPointJson && reqObj.mountPointJson[rows[0].name]){
	    						    	reqObj.mountPointJson[clusterRows[0].name] = reqObj.mountPointJson[rows[0].name];
	    						    	updateVmValues.mountPointJson = reqObj.mountPointJson;
	    				        		fs.writeFile(config.REPORTS_PATH+rows[0].name+'.json', JSON.stringify(reqObj.mountPointJson[rows[0].name], null, 4), function(err) {
	    				                    if(err) {
	    				                        console.log(err);
	    				                      } else {
	    				                        console.log("JSON saved ");
	    				                      }
	    				                });
	    				        		fs.writeFile(config.REPORTS_PATH+clusterRows[0].name+'.json', JSON.stringify(reqObj.mountPointJson[rows[0].name], null, 4), function(err) {
	    				                    if(err) {
	    				                        console.log(err);
	    				                      } else {
	    				                        console.log("JSON saved ");
	    				                      }
	    				                });
	    				        	}
	    				        	let vm_response_obj = JSON.parse(rows[0].response_obj);
	    				        	let cluster_vm_response_obj = JSON.parse(clusterRows[0].response_obj);
//	    				        	callback(1,{status:"error", success:0,"message":"The operation did not execute as expected. Please raise a ticket to support",vmId: reqObj.vmId});
	    				        	
	    				        	let params = {
    					        		subscription_id : updateVmValues.subscription_id,
    					        		virtual_machine_name : updateVmValues.virtual_machine_name,
    					        		ansibleip : updateVmValues.selected_ansible_server,
    					        		deployment_resource_group_name : updateVmValues.deployment_resource_group_name,
    					        		managed_disk_name : reqObj.Disk_Name.replace(updateVmValues.virtual_machine_name2,updateVmValues.virtual_machine_name),
    					        		location : updateVmValues.selected_network_location_name,//updateVmValues.selected_rg_location_name,//updateVmValues.selected_network_location_name,
    					        		managed_disk_size : reqObj.Disk_Size,
    					        		managed_disk_size_storage_account_type : reqObj.Disk_Storage_Type,
    					        		attached_disk_caching : reqObj.Disk_Host_Caching,
    					        		virtual_machine_name2 : updateVmValues.virtual_machine_name2,
    					        		attached_disk_caching2 : reqObj.Disk_Host_Caching,
    					        		managed_disk_name2 : reqObj.Disk_Name.replace(updateVmValues.virtual_machine_name,updateVmValues.virtual_machine_name2),
    					        		managed_disk_size2 : reqObj.Disk_Size,
    					        		managed_disk_size_storage_account_type2 : reqObj.Disk_Storage_Type,
    					        		availability_set_name :'-',
    					        		availability_set_name2 :'-',
    					        		os_type : updateVmValues.os_type,
    					        		db_type : updateVmValues.shared_image_tags["UCP-DB-Type"],
    					        		mw_type : updateVmValues.shared_image_tags["UCP-MW"],
    					        		jenkins_job_type : 8,
    					        		is_cluster : 1,
										private_ip_address : updateVmValues.private_ip_address,
										private_ip_address2 : updateVmValues.private_ip_address2
    				        		};
    				        		
    				        		let mountpoints_file_path = "", weblogic_file_path = "", oracle_file_path = "";
    		                        if(updateVmValues.shared_image_tags && updateVmValues.shared_image_tags!=''){
    		                        	sql =`select job_name, mountpoints_file_path, weblogic_file_path, oracle_file_path from azure_jenkin_jobs 
    		                        	where provision_type = '${updateVmValues.subscription_provision_type}' 
    		                        	and os_type = '${updateVmValues.shared_image_tags["UCP-OS-Type"]}'
    		                        	and db_type = '${updateVmValues.shared_image_tags["UCP-DB-Type"]}'
    		                        	and mw_type = '${updateVmValues.shared_image_tags["UCP-MW"]}'
    		                        	and record_status = 1 and job_type= '${params.jenkins_job_type}'
    		                        	limit 1`;
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
    		                    	            		resolve1("");
    		                    	            	}else{
    		                    	            		resolve1("");
    		                    	            	}
    		                    	            }
    		                    	        });
    		                            });
    		                        }
    		                        
    		                        console.log("updateVmValues.selected_ansible_server --- ", updateVmValues.selected_ansible_server);
    		                        console.log("mountpoints_file_path --- ", mountpoints_file_path);
    		                        if(updateVmValues.selected_ansible_server 
    		                        		&& updateVmValues.selected_ansible_server != '' 
    		                    			&& updateVmValues.selected_ansible_server != 'na'
    		                    			&& reqObj.mountPointJson && reqObj.mountPointJson[rows[0].name]){
    		                    		//push file to anisible server
    		                    	    try {
    		                    		  let filepath = config.REPORTS_PATH+updateVmValues.virtual_machine_name+".json";
    		                    		  console.log("filepath --- ", filepath);
    		                    		  if (fs.existsSync(filepath)) {
    		                    		    //file exists
    		                    			const Client = require('ssh2-sftp-client');
    		                    		    let sftp = new Client();
    		                    		    try {
    		                    		    	sftp.connect({
    		                    				  host: updateVmValues.selected_ansible_server, //UCP_CONSTANTS_DATA.jsonFileSftp.host,//
    		                    				  username: UCP_CONSTANTS_DATA.jsonFileSftp.username,
    		                    				  password: UCP_CONSTANTS_DATA.jsonFileSftp.password,
    		                    				  port: UCP_CONSTANTS_DATA.jsonFileSftp.port
    		                    		    	}).then(() => {
    		                    		    		console.log("mountpoint vmmmm 1111111111 ");
    		                    		    		return sftp.put(filepath, mountpoints_file_path+updateVmValues.virtual_machine_name+".json");
    		                    		    	}).then((data) => {
    		                    		    		console.log("mountpoint vmmmm 22222 ");
    		                    		    		console.log(data);
    		                    			    }).catch((err) => {
    		                    			    	console.log("mountpoint vmmmm 33333 ");
    		                    			    	console.log(err.message, 'catch error');
    		                    			    });
    		                    		    }catch(e) {
    		                    		    	console.log("mountpoint vmmmm 44444 ");
    		                    			    console.log(e.errmsg)
    		                    			}
    		                    		  }else{
    		                    			  console.log("mountpoint vmmmm 555555 ");
    		                    			  console.log("file not found");
    		                    		  }
    		                    		} catch(err) {
    		                    			console.log("mountpoint vmmmm 666666 ");
    		                    		  console.error(err)
    		                    		}
    		                    		
    		                    		//push cluster file to anisible server
    		                    	    try {
    		                    		  let filepath = config.REPORTS_PATH+updateVmValues.virtual_machine_name2+".json";
    		                    		  console.log("filepath --- ", filepath);
    		                    		  if (fs.existsSync(filepath)) {
    		                    		    //file exists
    		                    			const Client = require('ssh2-sftp-client');
    		                    		    let sftp = new Client();
    		                    		    try {
    		                    		    	sftp.connect({
    		                    				  host: updateVmValues.selected_ansible_server, //UCP_CONSTANTS_DATA.jsonFileSftp.host,//
    		                    				  username: UCP_CONSTANTS_DATA.jsonFileSftp.username,
    		                    				  password: UCP_CONSTANTS_DATA.jsonFileSftp.password,
    		                    				  port: UCP_CONSTANTS_DATA.jsonFileSftp.port
    		                    		    	}).then(() => {
    		                    		    		console.log("mountpoint vmmmm 1111111111 ");
    		                    		    		return sftp.put(filepath, mountpoints_file_path+updateVmValues.virtual_machine_name2+".json");
    		                    		    	}).then((data) => {
    		                    		    		console.log("mountpoint vmmmm 22222 ");
    		                    		    		console.log(data);
    		                    			    }).catch((err) => {
    		                    			    	console.log("mountpoint vmmmm 33333 ");
    		                    			    	console.log(err.message, 'catch error');
    		                    			    });
    		                    		    }catch(e) {
    		                    		    	console.log("mountpoint vmmmm 44444 ");
    		                    			    console.log(e.errmsg)
    		                    			}
    		                    		  }else{
    		                    			  console.log("mountpoint vmmmm 555555 ");
    		                    			  console.log("file not found");
    		                    		  }
    		                    		} catch(err) {
    		                    			console.log("mountpoint vmmmm 666666 ");
    		                    		  console.error(err)
    		                    		}
    		                    	}
    				        		
    				        		//updateVmValues.selected_rg_location_name,//updateVmValues.selected_network_location_name,
    				        		if(updateVmValues.cmdbBuUnit && updateVmValues.cmdbBuUnit != ''){
    				        	    	sql =`select resource_group, disk_encryption_set_name from azure_disks_encryption 
    				        	    	where subscription_id = '${updateVmValues.subscription_id}' 
    				        	    	and location = '${updateVmValues.selected_network_location_name}'
    				        	    	and business_unit = '${updateVmValues.cmdbBuUnit}'
    				        	    	and azure_ucp_status != 'Deprecated'
    				        	    	and record_status = 1 
    				        	    	limit 1`;
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
    				        		            		params.disk_encryption_resource_group_name = rows[0].resource_group;
    				        		            		params.disk_encryption_name = rows[0].disk_encryption_set_name;
    				        		            		resolve1("");
    				        		            	}else{
    				        		            		resolve1("");
    				        		            	}
    				        		            }
    				        		        });
    				        	        });
    				        	    }
    			    		    	
    			    		    	if(updateVmValues.zone){
    			    		    		params.zone = updateVmValues.zone;
    			    		    	}
    			    		    	if(updateVmValues.zone2){
    			    		    		params.zone2 = updateVmValues.zone2;
    			    		    	}
    				        		params.requested_domain = config.API_URL;
    				        		
    				        		console.log("final updateVmValues --- ", JSON.stringify(updateVmValues));
    					//		    return;
    							    let insUpdateVmValues = {
    							    		cloudid : config.AZURE.cloudid,
    							    		vm_id : ((updateVmValues.virtual_machine_name == rows[0].name)?rows[0].vmId:clusterRows[0].vmId),//reqObj.vm_id,
    							    		clientid : reqObj.clientid,
    							    		order_details_id : rows[0].order_details_id,
    							    		request_type : 2,
	    						    		is_cluster : 1,
	    						    		host_name : updateVmValues.virtual_machine_name,
	    						    		label_name : updateVmValues.virtual_machine_name,
	    						    		cluster_name : updateVmValues.virtual_machine_name2,
    							    		created_by : reqObj.request_processed_user_id,
    							    		createddate : (new Date().getTime() / 1000),
    							    		request_obj : JSON.stringify(updateVmValues)
    							    };
    							    await db.query("INSERT INTO c4_vm_creation SET ?", insUpdateVmValues ,async(error,vmUpdateVmRows,fields)=>{
    							    	dbFunc.connectionRelease;
    							    	console.log("error ----------------- ");
    							    	console.log(error);
    							        if(error) {
    							        	console.log(error);
    							            callback(1,{status:"error", success:0,"message":"The operation did not execute as expected. Please raise a ticket to support",vmId: reqObj.vmId});
    							        } else {
    							            console.log("vmUpdateVmRows --- ", vmUpdateVmRows);
    							            
//	    							            insUpdateVmValues.request_obj = JSON.parse(insUpdateVmValues.request_obj);
//	    							            insUpdateVmValues.request_obj.request_ref__id = vmUpdateVmRows.insertId;
//	    							            azureModel.createVmTemplate(insUpdateVmValues.request_obj, async function(err,vmUpdateVmResult){
//	    							            	vmUpdateVmUpdateResponse = await dbHandler.updateTableData('c4_vm_creation',{id:vmUpdateVmRows.insertId},
//	    							            			{
//	    									            		response_obj:JSON.stringify(vmUpdateVmResult),
//	    									            		status:((vmUpdateVmResult.success && vmUpdateVmResult.success == 1)?"1":"2"),
//	    									            		updateddate : (new Date().getTime() / 1000)
//	    								            		},async function(err,result){
//	    							                    console.log("c4_vm_creation data updated");
//	    							                    callback(null,{status:"success", success:1,"message":"Update Vm requested successfully.", vmId: reqObj.vmId, ref_id: vmUpdateVmRows.insertId});
//	    							                });
//	    							            });
    							            
    							            params.request_ref_id = vmUpdateVmRows.insertId;
    							            jenkinsModel.triggerJenkinsJob(params,async function(err,result){
    						    	    		console.log("VM Add disk result ---- ",result);
    						    	    		await dbHandler.updateTableData('c4_vm_creation',{id:params.request_ref_id},
    					    	    				{
    					    	    					jenkins_response_obj:JSON.stringify(result),
    					    	    	    		},async function(err,result){
    					    	    	            console.log("other_jenkins_requests data updated");
    					    	    	        });
    						    	    		return callback(err,result);
    						    	    	});
    							        }
    							    });
        		        		}else{
	    				        	let updateVmValues = JSON.parse(rows[0].vm_creation_request_obj);
	    						    console.log("initial updateVmValues --- ", JSON.stringify(updateVmValues));
	    						    updateVmValues.mountPointJson = {};
	    						    if(reqObj.mountPointJson && reqObj.mountPointJson[rows[0].name]){
	    						    	updateVmValues.mountPointJson = reqObj.mountPointJson;
	    				        		fs.writeFile(config.REPORTS_PATH+rows[0].name+'.json', JSON.stringify(reqObj.mountPointJson[rows[0].name], null, 4), function(err) {
	    				                    if(err) {
	    				                        console.log(err);
	    				                      } else {
	    				                        console.log("JSON saved ");
	    				                      }
	    				                });
	    				        	}
	    				        	let vm_response_obj = JSON.parse(rows[0].response_obj);
	    				        	let cluster_vm_response_obj = JSON.parse(clusterRows[0].response_obj);
	    				        	updateVmValues.virtual_machine_size = ((vm_response_obj.properties && vm_response_obj.properties.hardwareProfile && vm_response_obj.properties.hardwareProfile.vmSize)?vm_response_obj.properties.hardwareProfile.vmSize:"");
	    				//        	if(vm_response_obj.properties 
	    				//        			&& vm_response_obj.properties.networkProfile
	    				//        			&& vm_response_obj.properties.networkProfile.networkInterfaces
	    				//        			&& vm_response_obj.properties.networkProfile.networkInterfaces[0]
	    				//        			&& vm_response_obj.properties.networkProfile.networkInterfaces[0].id
	    				//        	){
	    				//        		updateVmValues.nic_name = vm_response_obj.properties.networkProfile.networkInterfaces[0].id.split("/")[8];
	    				//        	}
	    				        	
	    				        	let insUpdateVmValues = {
	    						    		cloudid : config.AZURE.cloudid,
	    						    		vm_id : reqObj.vm_id,
	    						    		clientid : reqObj.clientid,
	    						    		order_details_id : rows[0].order_details_id,
	    						    		request_type : 2,
	    						    		is_cluster : 1,
	    						    		host_name : rows[0].name,
	    						    		label_name : rows[0].name,
	    						    		cluster_name : clusterRows[0].name,
	    						    		created_by : reqObj.request_processed_user_id,
	    						    		createddate : (new Date().getTime() / 1000),
	//    						    		request_obj : JSON.stringify(updateVmValues)
	    						    };
	    				        	if(updateVmValues.virtual_machine_name == rows[0].name){
	//    				        		insUpdateVmValues.host_name = rows[0].name;
	//    				        		insUpdateVmValues.label_name = rows[0].name;
	//    				        		insUpdateVmValues.cluster_name = clusterRows[0].name;
	        						    		
		    				        	updateVmValues.managed_disk_name = '';
		    							updateVmValues.managed_disk_host_caching = '';
		    							updateVmValues.managed_disk_storage_size = '';
		    							updateVmValues.managed_disk_size = '';
		    							updateVmValues.managed_disk_size_storage_account_type = '';
		    				        	if(vm_response_obj.properties
		    				        			&& vm_response_obj.properties.storageProfile
		    				        			&& vm_response_obj.properties.storageProfile.dataDisks
		    				        			&& vm_response_obj.properties.storageProfile.dataDisks.length > 0){
		    				        		for(let i =0; i < vm_response_obj.properties.storageProfile.dataDisks.length; i++){
		    				        			if(vm_response_obj.properties.storageProfile.dataDisks[i].name.indexOf(rows[0].name+"-disk") == 0){
		    						        		if(updateVmValues.managed_disk_name == ''){
		    						        			updateVmValues.managed_disk_name = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
		    						        			updateVmValues.managed_disk_host_caching = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
		    						        			updateVmValues.managed_disk_storage_size = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
		    						        			updateVmValues.managed_disk_size = '['+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
		    						        			updateVmValues.managed_disk_size_storage_account_type = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
		    						    	    	}else{
		    						    	    		updateVmValues.managed_disk_name +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
		    						    	    		updateVmValues.managed_disk_host_caching +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
		    						    	    		updateVmValues.managed_disk_storage_size +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
		    						    		    	updateVmValues.managed_disk_size +=','+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
		    						    		    	updateVmValues.managed_disk_size_storage_account_type +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
		    						    	    	}
		    				        			}
		    				        		}
		    				        	}
		    				        	if(reqObj.Disk_Name && reqObj.Disk_Name != ''){
		    				        		if(updateVmValues.managed_disk_name == ''){
		    				        			updateVmValues.managed_disk_name = '[\"'+reqObj.Disk_Name+'\"';
		    				        			updateVmValues.managed_disk_host_caching = '[\"'+reqObj.Disk_Host_Caching+'\"';
		    				        			updateVmValues.managed_disk_storage_size = '[\"'+reqObj.Disk_Storage_Size+'\"';
		    				        			updateVmValues.managed_disk_size = '['+reqObj.Disk_Size;
		    				        			updateVmValues.managed_disk_size_storage_account_type = '[\"'+reqObj.Disk_Storage_Type+'\"';
		    				    	    	}else{
		    				    	    		updateVmValues.managed_disk_name +=',\"'+reqObj.Disk_Name+'\"';
		    				    	    		updateVmValues.managed_disk_host_caching +=',\"'+reqObj.Disk_Host_Caching+'\"';
		    				    	    		updateVmValues.managed_disk_storage_size +=',\"'+reqObj.Disk_Storage_Size+'\"';
		    				    		    	updateVmValues.managed_disk_size +=','+reqObj.Disk_Size;
		    				    		    	updateVmValues.managed_disk_size_storage_account_type +=',\"'+reqObj.Disk_Storage_Type+'\"';
		    				    	    	}
		    				    		}
		    				        	
		    				        	if(updateVmValues.managed_disk_name != ''){
		    					        	updateVmValues.managed_disk_name +=']';
		    					    		updateVmValues.managed_disk_host_caching +=']';
		    					    		updateVmValues.managed_disk_storage_size +=']';
		    					    		updateVmValues.managed_disk_size +=']';
		    					    		updateVmValues.managed_disk_size_storage_account_type +=']';
		    				        	}
		    				        	updateVmValues.private_ip_address = rows[0].privateIpAddress;
		    				        	
		    				        	//For VM2
		    				        	updateVmValues.managed_disk_name2 = '';
		    							updateVmValues.managed_disk_host_caching2 = '';
		    							updateVmValues.managed_disk_storage_size2 = '';
		    							updateVmValues.managed_disk_size2 = '';
		    							updateVmValues.managed_disk_size_storage_account_type2 = '';
		    				        	if(cluster_vm_response_obj.properties
		    				        			&& cluster_vm_response_obj.properties.storageProfile
		    				        			&& cluster_vm_response_obj.properties.storageProfile.dataDisks
		    				        			&& cluster_vm_response_obj.properties.storageProfile.dataDisks.length > 0){
		    				        		for(let i =0; i < cluster_vm_response_obj.properties.storageProfile.dataDisks.length; i++){
		    				        			if(cluster_vm_response_obj.properties.storageProfile.dataDisks[i].name.indexOf(clusterRows[0].name+"-disk") == 0){
		    						        		if(updateVmValues.managed_disk_name2 == ''){
		    						        			updateVmValues.managed_disk_name2 = '[\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
		    						        			updateVmValues.managed_disk_host_caching2 = '[\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
		    						        			updateVmValues.managed_disk_storage_size2 = '[\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
		    						        			updateVmValues.managed_disk_size2 = '['+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
		    						        			updateVmValues.managed_disk_size_storage_account_type2 = '[\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
		    						    	    	}else{
		    						    	    		updateVmValues.managed_disk_name2 +=',\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
		    						    	    		updateVmValues.managed_disk_host_caching2 +=',\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
		    						    	    		updateVmValues.managed_disk_storage_size2 +=',\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
		    						    		    	updateVmValues.managed_disk_size2 +=','+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
		    						    		    	updateVmValues.managed_disk_size_storage_account_type2 +=',\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
		    						    	    	}
		    				        			}
		    				        		}
		    				        	}
		    				        	
		    				        	if(updateVmValues.managed_disk_name2 != ''){
		    					        	updateVmValues.managed_disk_name2 +=']';
		    					    		updateVmValues.managed_disk_host_caching2 +=']';
		    					    		updateVmValues.managed_disk_storage_size2 +=']';
		    					    		updateVmValues.managed_disk_size2 +=']';
		    					    		updateVmValues.managed_disk_size_storage_account_type2 +=']';
		    				        	}
		    				        	updateVmValues.private_ip_address2 = clusterRows[0].private_ip_address2;
	    				        	}else{
	//    				        		insUpdateVmValues.host_name = clusterRows[0].name;
	//    				        		insUpdateVmValues.label_name = clusterRows[0].name;
	//    				        		insUpdateVmValues.cluster_name = rows[0].name;
	    				        		
	    				        		updateVmValues.managed_disk_name = '';
		    							updateVmValues.managed_disk_host_caching = '';
		    							updateVmValues.managed_disk_storage_size = '';
		    							updateVmValues.managed_disk_size = '';
		    							updateVmValues.managed_disk_size_storage_account_type = '';
		    				        	if(cluster_vm_response_obj.properties
		    				        			&& cluster_vm_response_obj.properties.storageProfile
		    				        			&& cluster_vm_response_obj.properties.storageProfile.dataDisks
		    				        			&& cluster_vm_response_obj.properties.storageProfile.dataDisks.length > 0){
		    				        		for(let i =0; i < cluster_vm_response_obj.properties.storageProfile.dataDisks.length; i++){
		    				        			if(cluster_vm_response_obj.properties.storageProfile.dataDisks[i].name.indexOf(clusterRows[0].name+"-disk") == 0){
		    						        		if(updateVmValues.managed_disk_name == ''){
		    						        			updateVmValues.managed_disk_name = '[\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
		    						        			updateVmValues.managed_disk_host_caching = '[\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
		    						        			updateVmValues.managed_disk_storage_size = '[\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
		    						        			updateVmValues.managed_disk_size = '['+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
		    						        			updateVmValues.managed_disk_size_storage_account_type = '[\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
		    						    	    	}else{
		    						    	    		updateVmValues.managed_disk_name +=',\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
		    						    	    		updateVmValues.managed_disk_host_caching +=',\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
		    						    	    		updateVmValues.managed_disk_storage_size +=',\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
		    						    		    	updateVmValues.managed_disk_size +=','+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
		    						    		    	updateVmValues.managed_disk_size_storage_account_type +=',\"'+cluster_vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
		    						    	    	}
		    				        			}
		    				        		}
		    				        	}
		    				        	
		    				        	if(updateVmValues.managed_disk_name != ''){
		    					        	updateVmValues.managed_disk_name +=']';
		    					    		updateVmValues.managed_disk_host_caching +=']';
		    					    		updateVmValues.managed_disk_storage_size +=']';
		    					    		updateVmValues.managed_disk_size +=']';
		    					    		updateVmValues.managed_disk_size_storage_account_type +=']';
		    				        	}
		    				        	updateVmValues.private_ip_address = clusterRows[0].privateIpAddress;
		    				        	
		    				        	//For VM2
		    				        	updateVmValues.managed_disk_name2 = '';
		    							updateVmValues.managed_disk_host_caching2 = '';
		    							updateVmValues.managed_disk_storage_size2 = '';
		    							updateVmValues.managed_disk_size2 = '';
		    							updateVmValues.managed_disk_size_storage_account_type2 = '';
		    				        	if(vm_response_obj.properties
		    				        			&& vm_response_obj.properties.storageProfile
		    				        			&& vm_response_obj.properties.storageProfile.dataDisks
		    				        			&& vm_response_obj.properties.storageProfile.dataDisks.length > 0){
		    				        		for(let i =0; i < vm_response_obj.properties.storageProfile.dataDisks.length; i++){
		    				        			if(vm_response_obj.properties.storageProfile.dataDisks[i].name.indexOf(rows[0].name+"-disk") == 0){
		    						        		if(updateVmValues.managed_disk_name2 == ''){
		    						        			updateVmValues.managed_disk_name2 = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
		    						        			updateVmValues.managed_disk_host_caching2 = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
		    						        			updateVmValues.managed_disk_storage_size2 = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
		    						        			updateVmValues.managed_disk_size2 = '['+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
		    						        			updateVmValues.managed_disk_size_storage_account_type2 = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
		    						    	    	}else{
		    						    	    		updateVmValues.managed_disk_name2 +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
		    						    	    		updateVmValues.managed_disk_host_caching2 +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
		    						    	    		updateVmValues.managed_disk_storage_size2 +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
		    						    		    	updateVmValues.managed_disk_size2 +=','+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
		    						    		    	updateVmValues.managed_disk_size_storage_account_type2 +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
		    						    	    	}
		    				        			}
		    				        		}
		    				        	}
		    				        	if(reqObj.Disk_Name && reqObj.Disk_Name != ''){
		    				        		if(updateVmValues.managed_disk_name2 == ''){
		    				        			updateVmValues.managed_disk_name2 = '[\"'+reqObj.Disk_Name+'\"';
		    				        			updateVmValues.managed_disk_host_caching2 = '[\"'+reqObj.Disk_Host_Caching+'\"';
		    				        			updateVmValues.managed_disk_storage_size2 = '[\"'+reqObj.Disk_Storage_Size+'\"';
		    				        			updateVmValues.managed_disk_size2 = '['+reqObj.Disk_Size;
		    				        			updateVmValues.managed_disk_size_storage_account_type2 = '[\"'+reqObj.Disk_Storage_Type+'\"';
		    				    	    	}else{
		    				    	    		updateVmValues.managed_disk_name2 +=',\"'+reqObj.Disk_Name+'\"';
		    				    	    		updateVmValues.managed_disk_host_caching2 +=',\"'+reqObj.Disk_Host_Caching+'\"';
		    				    	    		updateVmValues.managed_disk_storage_size2 +=',\"'+reqObj.Disk_Storage_Size+'\"';
		    				    		    	updateVmValues.managed_disk_size2 +=','+reqObj.Disk_Size;
		    				    		    	updateVmValues.managed_disk_size_storage_account_type2 +=',\"'+reqObj.Disk_Storage_Type+'\"';
		    				    	    	}
		    				    		}
		    				        	
		    				        	if(updateVmValues.managed_disk_name2 != ''){
		    					        	updateVmValues.managed_disk_name2 +=']';
		    					    		updateVmValues.managed_disk_host_caching2 +=']';
		    					    		updateVmValues.managed_disk_storage_size2 +=']';
		    					    		updateVmValues.managed_disk_size2 +=']';
		    					    		updateVmValues.managed_disk_size_storage_account_type2 +=']';
		    				        	}
		    				        	updateVmValues.private_ip_address2 = rows[0].private_ip_address2;
	    				        	}
	    				        	
	    						    updateVmValues.jenkins_job_type = 1;
	    				        	console.log("final updateVmValues --- ", JSON.stringify(updateVmValues));
	    				//		    return;
	    				        	
	    				        	insUpdateVmValues.request_obj = JSON.stringify(updateVmValues);
	    						    await db.query("INSERT INTO c4_vm_creation SET ?", insUpdateVmValues ,async(error,vmUpdateVmRows,fields)=>{
	    						    	dbFunc.connectionRelease;
	    						    	console.log("error ----------------- ");
	    						    	console.log(error);
	    						        if(error) {
	    						        	console.log(error);
	    						            callback(1,{status:"error", success:0,"message":"The operation did not execute as expected. Please raise a ticket to support",vmId: reqObj.vmId});
	    						        } else {
	    						            console.log("vmUpdateVmRows --- ", vmUpdateVmRows);
	    						            
	    						            insUpdateVmValues.request_obj = JSON.parse(insUpdateVmValues.request_obj);
	    						            insUpdateVmValues.request_obj.request_ref__id = vmUpdateVmRows.insertId;
	    						            azureModel.createVmTemplate(insUpdateVmValues.request_obj, async function(err,vmUpdateVmResult){
	    						            	vmUpdateVmUpdateResponse = await dbHandler.updateTableData('c4_vm_creation',{id:vmUpdateVmRows.insertId},
	    						            			{
	    								            		response_obj:JSON.stringify(vmUpdateVmResult),
	    								            		status:((vmUpdateVmResult.success && vmUpdateVmResult.success == 1)?"1":"2"),
	    								            		updateddate : (new Date().getTime() / 1000)
	    							            		},async function(err,result){
	    						                    console.log("c4_vm_creation data updated");
	    						                    callback(null,{status:"success", success:1,"message":"Update Vm requested successfully.", vmId: reqObj.vmId, ref_id: vmUpdateVmRows.insertId});
	    						                });
	    						            });
	    						        }
	    						    });
        		        		}
        			        }else{
        			            console.log("clusterRows not found in updateVmRequestThroughJenkins");
        			            callback(1,{status:"error", success:0,"message":"The operation did not execute as expected. Please raise a ticket to support",vmId: reqObj.vmId});
        			        }
        		        }
        		    });
        		}else{
		        	let updateVmValues = JSON.parse(rows[0].vm_creation_request_obj);
				    console.log("initial updateVmValues --- ", JSON.stringify(updateVmValues));
				    updateVmValues.mountPointJson = {};
				    if(reqObj.mountPointJson && reqObj.mountPointJson[rows[0].name]){
				    	updateVmValues.mountPointJson = reqObj.mountPointJson;
		        		fs.writeFile(config.REPORTS_PATH+rows[0].name+'.json', JSON.stringify(reqObj.mountPointJson[rows[0].name], null, 4), function(err) {
		                    if(err) {
		                        console.log(err);
		                      } else {
		                        console.log("JSON saved ");
		                      }
		                });
		        	}
		        	let vm_response_obj = JSON.parse(rows[0].response_obj);
		        	if(1 || (updateVmValues.shared_image_tags["UCP-DB-Type"] && ["Oracle","MSSQL"].indexOf(updateVmValues.shared_image_tags["UCP-DB-Type"]) >= 0)
		        			|| (updateVmValues.shared_image_tags["UCP-MW"] && ["WebLogic Server","JBoss","Apache Tomcat"].indexOf(updateVmValues.shared_image_tags["UCP-MW"]) >= 0)
		        	){
		        		let params = {
			        		subscription_id : updateVmValues.subscription_id,
			        		virtual_machine_name : updateVmValues.virtual_machine_name,
			        		ansibleip : updateVmValues.selected_ansible_server,
			        		deployment_resource_group_name : updateVmValues.deployment_resource_group_name,
			        		diskName : reqObj.Disk_Name,
			        		location : updateVmValues.selected_network_location_name,//updateVmValues.selected_rg_location_name,//updateVmValues.selected_network_location_name,
			        		diskSizeGB : reqObj.Disk_Size,
			        		storageAccountType : reqObj.Disk_Storage_Type,
			        		caching : reqObj.Disk_Host_Caching,
			        		os_type : updateVmValues.os_type,
			        		db_type : updateVmValues.shared_image_tags["UCP-DB-Type"],
			        		mw_type : updateVmValues.shared_image_tags["UCP-MW"],
			        		jenkins_job_type : 8,
							private_ip_address : updateVmValues.private_ip_address
		        		};
		        		
		        		let mountpoints_file_path = "", weblogic_file_path = "", oracle_file_path = "";
                        if(updateVmValues.shared_image_tags && updateVmValues.shared_image_tags!=''){
                        	sql =`select job_name, mountpoints_file_path, weblogic_file_path, oracle_file_path from azure_jenkin_jobs 
                        	where provision_type = '${updateVmValues.subscription_provision_type}' 
                        	and os_type = '${updateVmValues.shared_image_tags["UCP-OS-Type"]}'
                        	and db_type = '${updateVmValues.shared_image_tags["UCP-DB-Type"]}'
                        	and mw_type = '${updateVmValues.shared_image_tags["UCP-MW"]}'
                        	and record_status = 1 and job_type= '${params.jenkins_job_type}'
                        	limit 1`;
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
                    	            		resolve1("");
                    	            	}else{
                    	            		resolve1("");
                    	            	}
                    	            }
                    	        });
                            });
                        }
                        
                        console.log("updateVmValues.selected_ansible_server --- ", updateVmValues.selected_ansible_server);
                        console.log("mountpoints_file_path --- ", mountpoints_file_path);
                        if(updateVmValues.selected_ansible_server 
                        		&& updateVmValues.selected_ansible_server != '' 
                    			&& updateVmValues.selected_ansible_server != 'na'
                    			&& reqObj.mountPointJson && reqObj.mountPointJson[rows[0].name]){
                    		//push file to anisible server
                    	    try {
                    		  let filepath = config.REPORTS_PATH+updateVmValues.virtual_machine_name+".json";
                    		  console.log("filepath --- ", filepath);
                    		  if (fs.existsSync(filepath)) {
                    		    //file exists
                    			const Client = require('ssh2-sftp-client');
                    		    let sftp = new Client();
                    		    try {
                    		    	sftp.connect({
                    				  host: updateVmValues.selected_ansible_server, //UCP_CONSTANTS_DATA.jsonFileSftp.host,//
                    				  username: UCP_CONSTANTS_DATA.jsonFileSftp.username,
                    				  password: UCP_CONSTANTS_DATA.jsonFileSftp.password,
                    				  port: UCP_CONSTANTS_DATA.jsonFileSftp.port
                    		    	}).then(() => {
                    		    		console.log("mountpoint vmmmm 1111111111 ");
                    		    		return sftp.put(filepath, mountpoints_file_path+updateVmValues.virtual_machine_name+".json");
                    		    	}).then((data) => {
                    		    		console.log("mountpoint vmmmm 22222 ");
                    		    		console.log(data);
                    			    }).catch((err) => {
                    			    	console.log("mountpoint vmmmm 33333 ");
                    			    	console.log(err.message, 'catch error');
                    			    });
                    		    }catch(e) {
                    		    	console.log("mountpoint vmmmm 44444 ");
                    			    console.log(e.errmsg)
                    			}
                    		  }else{
                    			  console.log("mountpoint vmmmm 555555 ");
                    			  console.log("file not found");
                    		  }
                    		} catch(err) {
                    			console.log("mountpoint vmmmm 666666 ");
                    		  console.error(err)
                    		}
                    	}
		        		
		        		//updateVmValues.selected_rg_location_name,//updateVmValues.selected_network_location_name,
		        		if(updateVmValues.cmdbBuUnit && updateVmValues.cmdbBuUnit != ''){
		        	    	sql =`select resource_group, disk_encryption_set_name from azure_disks_encryption 
		        	    	where subscription_id = '${updateVmValues.subscription_id}' 
		        	    	and location = '${updateVmValues.selected_network_location_name}'
		        	    	and business_unit = '${updateVmValues.cmdbBuUnit}'
		        	    	and azure_ucp_status != 'Deprecated'
		        	    	and record_status = 1 
		        	    	limit 1`;
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
		        		            		params.disk_encryption_resource_group_name = rows[0].resource_group;
		        		            		params.disk_encryption_name = rows[0].disk_encryption_set_name;
		        		            		resolve1("");
		        		            	}else{
		        		            		resolve1("");
		        		            	}
		        		            }
		        		        });
		        	        });
		        	    }
	    		    	
	    		    	if(updateVmValues.zone){
	    		    		params.zone = updateVmValues.zone
	    		    	}
		        		params.request_ref_id = rows.insertId;
		        		params.requested_domain = config.API_URL;
		        		
		        		console.log("final updateVmValues --- ", JSON.stringify(updateVmValues));
			//		    return;
					    let insUpdateVmValues = {
					    		cloudid : config.AZURE.cloudid,
					    		vm_id : reqObj.vm_id,
					    		clientid : reqObj.clientid,
					    		order_details_id : rows[0].order_details_id,
					    		request_type : 2,
					    		host_name : rows[0].name,
					    		label_name : rows[0].name,
					    		created_by : reqObj.request_processed_user_id,
					    		createddate : (new Date().getTime() / 1000),
					    		request_obj : JSON.stringify(updateVmValues)
					    };
					    await db.query("INSERT INTO c4_vm_creation SET ?", insUpdateVmValues ,async(error,vmUpdateVmRows,fields)=>{
					    	dbFunc.connectionRelease;
					    	console.log("error ----------------- ");
					    	console.log(error);
					        if(error) {
					        	console.log(error);
					            callback(1,{status:"error", success:0,"message":"The operation did not execute as expected. Please raise a ticket to support",vmId: reqObj.vmId});
					        } else {
					            console.log("vmUpdateVmRows --- ", vmUpdateVmRows);
					            
//					            insUpdateVmValues.request_obj = JSON.parse(insUpdateVmValues.request_obj);
//					            insUpdateVmValues.request_obj.request_ref__id = vmUpdateVmRows.insertId;
//					            azureModel.createVmTemplate(insUpdateVmValues.request_obj, async function(err,vmUpdateVmResult){
//					            	vmUpdateVmUpdateResponse = await dbHandler.updateTableData('c4_vm_creation',{id:vmUpdateVmRows.insertId},
//					            			{
//							            		response_obj:JSON.stringify(vmUpdateVmResult),
//							            		status:((vmUpdateVmResult.success && vmUpdateVmResult.success == 1)?"1":"2"),
//							            		updateddate : (new Date().getTime() / 1000)
//						            		},async function(err,result){
//					                    console.log("c4_vm_creation data updated");
//					                    callback(null,{status:"success", success:1,"message":"Update Vm requested successfully.", vmId: reqObj.vmId, ref_id: vmUpdateVmRows.insertId});
//					                });
//					            });
					            
					            params.request_ref_id = vmUpdateVmRows.insertId;
					            jenkinsModel.triggerJenkinsJob(params,async function(err,result){
				    	    		console.log("VM Add disk result ---- ",result);
				    	    		await dbHandler.updateTableData('c4_vm_creation',{id:params.request_ref_id},
			    	    				{
			    	    					jenkins_response_obj:JSON.stringify(result),
			    	    	    		},async function(err,result){
			    	    	            console.log("other_jenkins_requests data updated");
			    	    	        });
				    	    		return callback(err,result);
				    	    	});
					        }
					    });
		        		
		        	}else{
			        	updateVmValues.virtual_machine_size = ((vm_response_obj.properties && vm_response_obj.properties.hardwareProfile && vm_response_obj.properties.hardwareProfile.vmSize)?vm_response_obj.properties.hardwareProfile.vmSize:"");
			//        	if(vm_response_obj.properties 
			//        			&& vm_response_obj.properties.networkProfile
			//        			&& vm_response_obj.properties.networkProfile.networkInterfaces
			//        			&& vm_response_obj.properties.networkProfile.networkInterfaces[0]
			//        			&& vm_response_obj.properties.networkProfile.networkInterfaces[0].id
			//        	){
			//        		updateVmValues.nic_name = vm_response_obj.properties.networkProfile.networkInterfaces[0].id.split("/")[8];
			//        	}
			        	
			        	updateVmValues.managed_disk_name = '';
						updateVmValues.managed_disk_host_caching = '';
						updateVmValues.managed_disk_storage_size = '';
						updateVmValues.managed_disk_size = '';
						updateVmValues.managed_disk_size_storage_account_type = '';
			        	if(vm_response_obj.properties
			        			&& vm_response_obj.properties.storageProfile
			        			&& vm_response_obj.properties.storageProfile.dataDisks
			        			&& vm_response_obj.properties.storageProfile.dataDisks.length > 0){
			        		for(let i =0; i < vm_response_obj.properties.storageProfile.dataDisks.length; i++){
			        			if(vm_response_obj.properties.storageProfile.dataDisks[i].name.indexOf(rows[0].name+"-disk") == 0){
					        		if(updateVmValues.managed_disk_name == ''){
					        			updateVmValues.managed_disk_name = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
					        			updateVmValues.managed_disk_host_caching = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
					        			updateVmValues.managed_disk_storage_size = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
					        			updateVmValues.managed_disk_size = '['+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
					        			updateVmValues.managed_disk_size_storage_account_type = '[\"'+vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
					    	    	}else{
					    	    		updateVmValues.managed_disk_name +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].name+'\"';
					    	    		updateVmValues.managed_disk_host_caching +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].caching+'\"';
					    	    		updateVmValues.managed_disk_storage_size +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB+'\"';
					    		    	updateVmValues.managed_disk_size +=','+vm_response_obj.properties.storageProfile.dataDisks[i].diskSizeGB;
					    		    	updateVmValues.managed_disk_size_storage_account_type +=',\"'+vm_response_obj.properties.storageProfile.dataDisks[i].managedDisk.storageAccountType+'\"';
					    	    	}
			        			}
			        		}
			        	}
			        	if(reqObj.Disk_Name && reqObj.Disk_Name != ''){
			        		if(updateVmValues.managed_disk_name == ''){
			        			updateVmValues.managed_disk_name = '[\"'+reqObj.Disk_Name+'\"';
			        			updateVmValues.managed_disk_host_caching = '[\"'+reqObj.Disk_Host_Caching+'\"';
			        			updateVmValues.managed_disk_storage_size = '[\"'+reqObj.Disk_Storage_Size+'\"';
			        			updateVmValues.managed_disk_size = '['+reqObj.Disk_Size;
			        			updateVmValues.managed_disk_size_storage_account_type = '[\"'+reqObj.Disk_Storage_Type+'\"';
			    	    	}else{
			    	    		updateVmValues.managed_disk_name +=',\"'+reqObj.Disk_Name+'\"';
			    	    		updateVmValues.managed_disk_host_caching +=',\"'+reqObj.Disk_Host_Caching+'\"';
			    	    		updateVmValues.managed_disk_storage_size +=',\"'+reqObj.Disk_Storage_Size+'\"';
			    		    	updateVmValues.managed_disk_size +=','+reqObj.Disk_Size;
			    		    	updateVmValues.managed_disk_size_storage_account_type +=',\"'+reqObj.Disk_Storage_Type+'\"';
			    	    	}
			    		}
			        	
			        	if(updateVmValues.managed_disk_name != ''){
				        	updateVmValues.managed_disk_name +=']';
				    		updateVmValues.managed_disk_host_caching +=']';
				    		updateVmValues.managed_disk_storage_size +=']';
				    		updateVmValues.managed_disk_size +=']';
				    		updateVmValues.managed_disk_size_storage_account_type +=']';
			        	}
			        	
					    updateVmValues.jenkins_job_type = 1;
			        	updateVmValues.private_ip_address = rows[0].privateIpAddress;
			        	
			        	console.log("final updateVmValues --- ", JSON.stringify(updateVmValues));
			//		    return;
					    let insUpdateVmValues = {
					    		cloudid : config.AZURE.cloudid,
					    		vm_id : reqObj.vm_id,
					    		clientid : reqObj.clientid,
					    		order_details_id : rows[0].order_details_id,
					    		request_type : 2,
					    		host_name : rows[0].name,
					    		label_name : rows[0].name,
					    		created_by : reqObj.request_processed_user_id,
					    		createddate : (new Date().getTime() / 1000),
					    		request_obj : JSON.stringify(updateVmValues)
					    };
					    await db.query("INSERT INTO c4_vm_creation SET ?", insUpdateVmValues ,async(error,vmUpdateVmRows,fields)=>{
					    	dbFunc.connectionRelease;
					    	console.log("error ----------------- ");
					    	console.log(error);
					        if(error) {
					        	console.log(error);
					            callback(1,{status:"error", success:0,"message":"The operation did not execute as expected. Please raise a ticket to support",vmId: reqObj.vmId});
					        } else {
					            console.log("vmUpdateVmRows --- ", vmUpdateVmRows);
					            
					            insUpdateVmValues.request_obj = JSON.parse(insUpdateVmValues.request_obj);
					            insUpdateVmValues.request_obj.request_ref__id = vmUpdateVmRows.insertId;
					            azureModel.createVmTemplate(insUpdateVmValues.request_obj, async function(err,vmUpdateVmResult){
					            	vmUpdateVmUpdateResponse = await dbHandler.updateTableData('c4_vm_creation',{id:vmUpdateVmRows.insertId},
					            			{
							            		response_obj:JSON.stringify(vmUpdateVmResult),
							            		status:((vmUpdateVmResult.success && vmUpdateVmResult.success == 1)?"1":"2"),
							            		updateddate : (new Date().getTime() / 1000)
						            		},async function(err,result){
					                    console.log("c4_vm_creation data updated");
					                    callback(null,{status:"success", success:1,"message":"Update Vm requested successfully.", vmId: reqObj.vmId, ref_id: vmUpdateVmRows.insertId});
					                });
					            });
					        }
					    });
	        		}
        		}
	        }else{
	        	console.log("rows not found in updateVmRequestThroughJenkins");
	            callback(1,{status:"error", success:0,"message":"The operation did not execute as expected. Please raise a ticket to support",vmId: reqObj.vmId});
	        }
        }
    });
}

let syncJenkinJobsStatus= async (reqObj)=>{
	let cts = Math.floor(Date.now() / 1000);
	console.log(reqObj);
	 
	let job_limit = 15;
	if(typeof reqObj.job_limit != 'undefined'){
		job_limit = reqObj.job_limit;
	}
	console.log("job_limit --- ", job_limit);
	
	let jenkinsData = "";
	await commonModel.getOptionConfigJsonData({option_type:"UCP_CONSTANTS"},async function(err, result){
//		console.log("result 1111111 --- ", result);
		if(!err && result.data){
			jenkinsData = result.data;
		}
		console.log("jenkinsData 1111111 --- ", jenkinsData);
	});
	if(!jenkinsData){
		console.log("UCP_CONSTANTS not found");
		return;
	}
	
	var jenkins = jenkinsapi.init(`${jenkinsData.JENKINS.Jenkins_protocal}://${jenkinsData.JENKINS.JenkinsUSERNAME}:${jenkinsData.JENKINS.JenkinsTOKEN}@${jenkinsData.JENKINS.JenkinsURL}`);
	
	let sql = `select job_name, job_type
		  from azure_jenkin_jobs
		  where record_status = 1 `;
	if(typeof reqObj.job_name != 'undefined'){
	      sql += ` and job_name = '${reqObj.job_name}' `;
	}
	if(typeof reqObj.job_type != 'undefined'){
	      sql += ` and job_type = '${reqObj.job_type}' `;
	}
//	else{
//		console.log("job_type is missing");
//		return;
//	}
	
    sql += ` group by job_name, job_type order by id desc`;
    console.log(sql);
	  
	dbHandler.executeQuery(sql,async function(jobsList){
		console.log(jobsList);
//		return;
		for await (var jobData of jobsList){
    	  await new Promise(async function(itemResolve, itemReject){
    		  let job_name = jobData.job_name;
    		    console.log("job_name---", job_name);
    		    
    		    jenkins.all_builds(job_name, async function(err, data) {
    		        if (err){ 
    		        	console.log("job_name---", job_name, err);
    		        	itemResolve("");
		        	}
//    		        updatedData = [];
    		        $recordsUpto = 0;
    		        for await (const item of data) {
//    		        	console.log("item.id -- ",item.id);
    		        	item.result = ((!item.result || item.result == '')?"In-Progress":item.result);
    		        	buildDataRes = await new Promise(async function(innerResolve, innerReject){
    			        	jenkins.build_info(job_name, item.id, async function(err, buildData) {
    			        		console.log("buildData -- ",buildData);
    			        		let host_name = await new Promise(async function(hostnameResolve, hostnameReject){
		                			if(buildData.actions.length > 0 
			                      		&& buildData.actions[0].parameters 
			                      		&& buildData.actions[0].parameters.length > 0 
			                      		){
		                				for await (const hostitem of buildData.actions[0].parameters) {
		                					if(hostitem.name == "virtual_machine_name"){
		                						hostnameResolve(hostitem.value);
		                					}
		                				}
		                				hostnameResolve("");
	    			        		}else if(buildData.actions.length > 0 
			                      		&& buildData.actions[1].parameters 
			                      		&& buildData.actions[1].parameters.length > 0 
			                      		){
	    			        			for await (const hostitem of buildData.actions[1].parameters) {
		                					if(hostitem.name == "virtual_machine_name"){
		                						hostnameResolve(hostitem.value);
		                					}
		                				}
	    			        			hostnameResolve("");
	    			        		}else{
	    			        			hostnameResolve("");
	    			        		}
		                		});
    			        		console.log("host_name -- ",host_name);
    			        		// TODO comment below line
//    			        		host_name = 'XA122LS610025';
//    			        		return;
    			                if (err){  
    			                	console.log(err); 
    			                	innerResolve(err);
    			                }else{
    			                	if(jobData.job_type == 1 || jobData.job_type == 8){
    			                		if(host_name){
    			                			if(item.result == 'In-Progress'){
        			                			innerResolve(buildData);
        			                		}else{
	    			                			let creation_sql = `select *
	    			                				  from c4_vm_creation
	    			                				  where host_name = '${host_name}' and job_name = '${job_name}' and jenkins_status is NULL`;
	    			                			
	    			                			// TODO comment below line
//	    			                			creation_sql += ` or host_name = 'XA120WS210027' `;
	    			                			
	    			                			creation_sql += ` order by id desc limit 1`;
	    			                		    console.log("creation_sql --- ", creation_sql);
	    			                			  
	    			                			dbHandler.executeQuery(creation_sql,async function(creationList){
	    			                				if(creationList.length > 0){
				    			                		await dbHandler.updateTableData('c4_vm_creation',{id:creationList[0].id},{
				    			                			jenkins_status:item.result,
				    			                			jenkins_response_obj:JSON.stringify({item,buildData}),
				    			                			updateddate : cts
							                			},async function(err,updateResult){
							                				// TODO comment below line
//							                				item.result = 'SUCCESS';
							                				
							                				if(item.result == 'SUCCESS' && creationList[0].vm_id != ''){
								                				let creation_request_obj = JSON.parse(creationList[0].request_obj);
								                				creationReqBody = {
							                		    			"clientId" : creationList[0].clientid,
							                		    			"subscriptionId" : creation_request_obj.subscription_id,
							                		    			"resourceGroup" : creation_request_obj.deployment_resource_group_name,
							                		    			"virtualMachineName" : creationList[0].host_name
							                		        	};
							                		        	let vmDetail=await new Promise(function(resolve,reject){
							                		                let sql = `select vm.id, vm.vm_creation_request_obj, vm.is_cluster, vm.cluster_id
							                		                from azure_vms as av
							                		                inner join c4_vm_details as vm on av.vm_detail_id = vm.id
							                		                left join c4_azure_subscription_locations as l on (l.subscription_id = av.subscriptionId and l.name = av.location and l.clientid = av.clientid)
							                		                left join c4_azure_resourcegroups as ar on (ar.location_id = l.id and ar.name = av.resourceGroup)
							                		                left join c4_azure_catalog as c on (c.name = av.vmSize and l.id = c.location_id)
							                		                where vm.clientid = '${creationReqBody.clientId}' 
							                		                and av.subscriptionId = '${creationReqBody.subscriptionId}' 
							                		                and av.resourceGroup = '${creationReqBody.resourceGroup}' 
							                		                and av.name = '${creationReqBody.virtualMachineName}' `;
							                		                if(typeof(creationList[0].vm_id)!='undefined' && creationList[0].vm_id != ''){
							                		                    sql +=` and vm.id = '${creationList[0].vm_id}' `;
							                		                }
							                		                console.log(sql);
							                		                dbHandler.executeQuery(sql,function(vmResult){
				//				                				                                console.log("result --- ",result);
							                		                    resolve(vmResult)
							                		                });
							                		            });
							                		        	if(vmDetail.length > 0){
							                		        		if(creation_request_obj.mountPointJson && creation_request_obj.mountPointJson[host_name]){
								                		        		let vm_creation_request_obj = JSON.parse(vmDetail[0].vm_creation_request_obj);
								                		        		if(!vm_creation_request_obj.mountPointJson || !vm_creation_request_obj.mountPointJson[host_name]){
								                		        			vm_creation_request_obj.mountPointJson = creation_request_obj.mountPointJson;
								                		        		}else{
								                		        			let mountPointJson = JSON.parse(JSON.stringify(vm_creation_request_obj.mountPointJson));
								                		        			mountPointJson[host_name].physical_volume.push(creation_request_obj.mountPointJson[host_name].physical_volume[0]);
								                		        			for await (const storage_breakup_item of creation_request_obj.mountPointJson[host_name].storage_breakup) {
								                		        				mountPointJson[host_name].storage_breakup.push(storage_breakup_item);	
								                		        			}
								                		        			vm_creation_request_obj.mountPointJson = mountPointJson;
								                		        		}
								                		        		await dbHandler.updateTableData('c4_vm_details',{id:vmDetail[0].id},{
								                		        			vm_creation_request_obj:JSON.stringify(vm_creation_request_obj),
								    			                			updateddate : cts
											                			},async function(err,updateVmResult){
											                				console.log("err ---- ", err)
											                			});
							                		        		}
							                			        	syncSingleVmDetails(creationReqBody,async function(err,result){
							                			        		console.log("host_name -- ", creationList[0].host_name);
							                			        		if(vmDetail[0].is_cluster == 1){
							                			        			creationReqBody = {
										                		    			"clientId" : creationList[0].clientid,
										                		    			"subscriptionId" : creation_request_obj.subscription_id,
										                		    			"resourceGroup" : creation_request_obj.deployment_resource_group_name,
										                		    			"virtualMachineName" : creationList[0].cluster_name
										                		        	};
										                		        	let clusterVmDetail=await new Promise(function(resolve,reject){
										                		                let sql = `select vm.id, vm.vm_creation_request_obj, vm.is_cluster, vm.cluster_id
										                		                from azure_vms as av
										                		                inner join c4_vm_details as vm on av.vm_detail_id = vm.id
										                		                left join c4_azure_subscription_locations as l on (l.subscription_id = av.subscriptionId and l.name = av.location and l.clientid = av.clientid)
										                		                left join c4_azure_resourcegroups as ar on (ar.location_id = l.id and ar.name = av.resourceGroup)
										                		                left join c4_azure_catalog as c on (c.name = av.vmSize and l.id = c.location_id)
										                		                where vm.clientid = '${creationReqBody.clientId}' 
										                		                and av.subscriptionId = '${creationReqBody.subscriptionId}' 
										                		                and av.resourceGroup = '${creationReqBody.resourceGroup}' 
										                		                and av.name = '${creationReqBody.virtualMachineName}' 
										                		                and vm.is_cluster = 1
										                		                and vm.cluster_id = '${vmDetail[0].cluster_id}' `;
//										                		                if(typeof(creationList[0].vm_id)!='undefined' && creationList[0].vm_id != ''){
//										                		                    sql +=` and vm.id = '${creationList[0].vm_id}' `;
//										                		                }
										                		                console.log(sql);
										                		                dbHandler.executeQuery(sql,function(vmResult){
							//				                				                                console.log("result --- ",result);
										                		                    resolve(vmResult)
										                		                });
										                		            });
										                		        	if(clusterVmDetail.length > 0){
										                		        		if(creation_request_obj.mountPointJson && creation_request_obj.mountPointJson[creationList[0].cluster_name]){
											                		        		let vm_creation_request_obj = JSON.parse(clusterVmDetail[0].vm_creation_request_obj);
											                		        		if(!vm_creation_request_obj.mountPointJson || !vm_creation_request_obj.mountPointJson[creationList[0].cluster_name]){
											                		        			vm_creation_request_obj.mountPointJson = creation_request_obj.mountPointJson;
											                		        		}else{
											                		        			let mountPointJson = JSON.parse(JSON.stringify(vm_creation_request_obj.mountPointJson));
											                		        			mountPointJson[creationList[0].cluster_name].physical_volume.push(creation_request_obj.mountPointJson[host_name].physical_volume[0]);
											                		        			for await (const storage_breakup_item of creation_request_obj.mountPointJson[creationList[0].cluster_name].storage_breakup) {
											                		        				mountPointJson[creationList[0].cluster_name].storage_breakup.push(storage_breakup_item);	
											                		        			}
											                		        			vm_creation_request_obj.mountPointJson = mountPointJson;
											                		        		}
											                		        		await dbHandler.updateTableData('c4_vm_details',{id:clusterVmDetail[0].id},{
											                		        			vm_creation_request_obj:JSON.stringify(vm_creation_request_obj),
											    			                			updateddate : cts
														                			},async function(err,updateVmResult){
														                				console.log("err ---- ", err)
														                			});
										                		        		}
										                			        	syncSingleVmDetails(creationReqBody,function(err,result){
										                			        		console.log("host_name -- ", creationList[0].cluster_name);
										                			        		innerResolve(buildData);
										    			                			console.log('jobData.job_type 1 updated')
										                			        	})
										                		        	}else{
										                		        		innerResolve(buildData);
									    			                			console.log('jobData.job_type 1 updated')
										                		        	}
							                			        		}else{
								                			        		innerResolve(buildData);
								    			                			console.log('jobData.job_type 1 updated')
							                			        		}
							                			        	})
							                		        	}else{
							                		        		innerResolve(buildData);
						    			                			console.log('jobData.job_type 1 updated')
							                		        	}
							                				}else{
			    			                					innerResolve(buildData);
					    			                			console.log('jobData.job_type 1 updated')
			    			                				}
				    			                        });
							                			
	    			                				}else{
	    			                					innerResolve(buildData);
			    			                			console.log('jobData.job_type 1 updated')
	    			                				}
	    			                			});
        			                		}
    			                		}else{
    			                			innerResolve(buildData);
    			                		}
    			                		
    			                	}else if(jobData.job_type == 2){
    			                		if(item.result == 'In-Progress'){
    			                			innerResolve(buildData);
    			                		}else{
	    			                		updateDecommissionJobStatus({jobStatus:item.result,host_name, jenkins_response_obj : {item,buildData}},function(err, buildData) {
	    			                			innerResolve(buildData);
	    			                		})
    			                		}
    			                	}else{
    			                		innerResolve(buildData);
    			                	}
    			                }
    			            });
    		        	});
//    		        	updatedData.push({item,buildDataRes})
    		        	$recordsUpto++;
    		            if($recordsUpto == job_limit){
    		            	break;
    		            }
    		        }
    		        itemResolve("");
//    		         res.json(ucpEncryptDecrypt.ucpEncrypt({ data: updatedData }, req.query));
    		    });
    	  });
		}
	});
}

let updateDecommissionJobStatus=(req,callback)=>{
	console.log("req ----", req);
	//return;
	let current_date = dateFormat(new Date(),"yyyy-mm-dd");
	let cts = Math.floor(Date.now() / 1000);
	if(typeof(req.host_name)=='undefined' || req.host_name==''){
	    var response={status:"error", message:'Please provide host_name'}
	    return callback(1,response);
	}
	if(typeof(req.jobStatus)=='undefined' || req.jobStatus==''){
	    var response={status:"error", message:'Please provide jobStatus'}
	    return callback(1,response);
	}
	if(typeof(req.jenkins_response_obj)=='undefined' || req.jenkins_response_obj==''){
	    var response={status:"error", message:'Please provide jenkins_response_obj'}
	    return callback(1,response);
	}
	
	// TODO comment below line
//	req.host_name = 'XA120WS210027';
	
	let sql = `select id, vm_id, request_obj, is_cluster, cluster_name, cluster_vm_id
		  from c4_vm_decommission_requests
		  where is_updated_in_cmdb = 0 and host_name = '${req.host_name}' and jenkins_status is NULL order by id desc limit 1`;
	console.log(sql);
	  
	dbHandler.executeQuery(sql,async function(decommissionList){
		console.log("decommissionList ---- ", decommissionList);
		if(!decommissionList || decommissionList.length == 0){
			var response={status:"error", message:'No record found'}
		    return callback(1,response);
		}
		let vmId = decommissionList[0].vm_id;
		dbHandler.updateTableData('c4_vm_decommission_requests',{id:decommissionList[0].id},{
			jenkins_status:req.jobStatus,
			jenkins_response_obj:JSON.stringify(req.jenkins_response_obj),
			updateddate : cts
			},function(err,result){
			console.log('updated')
        })
        // TODO comment below line
//        req.jobStatus = 'SUCCESS';
		
		if(req.jobStatus != 'SUCCESS'){
			var response={status:"error", message:'failure job'}
		    return callback(1,response);
		}else{
			cmdbModel.deleteCmdbRecords({vmId:vmId, decommissionListId : decommissionList[0].id},function(err,deleteCmdbRecordsResult){
				if(decommissionList[0].is_cluster == 1){
					cmdbModel.deleteCmdbRecords({vmId:decommissionList[0].cluster_vm_id, decommissionListId : decommissionList[0].id},function(err,deleteCmdbRecordsResult){
			        	return callback(null,deleteCmdbRecordsResult);
			        })
				}else{
					return callback(null,deleteCmdbRecordsResult);
				}
	        })
		}
    });
}

module.exports = {
    getAllVmlist,
    getStorageSkus,
    getAzureResourceGroups,
    getAllAzureResourceGroups,
    getAzureDropdownData,
    checkStorageAndSizeCompatability,
    generateUniqueVmName,
    getDiskList,
    addDisk,
    attachDisk,
    detachDisk,
    getVMDetails,
    getVMDetailByName,
    addAzureResourceGroups,
    getVmDetailbyId,
    vmOperations,
    createAvailabilitySet,
    vmLogs,
    getAllNetwork,
    addAzureNetwork,
    addAzureDetailsToClient,
    get_resrouce_group_list,
    getOsTemplates,
    azureResourceGroupBySubscription,
				getAzureBillingReport,
				cyberArkApplication,
				cyberArkPermissions, getCyberArkUsers,
				insertOatData,
				vmResize, vmOatList,
				vmOatData,vmOatListData,
    galleryList,
    galleryImagesList,
    galleryImageVersionList,
    getVmBackupVaultNames,
    getVmBackupVaultPolicies,
    extendDisk,
    saveResourceGroupBuUsers,
    getGalleryImageVersions,
    getGalleryOsMiddleware,
    getStorageAccountNames,
    syncSingleVmDetails,
    syncLatestVms,
    saveVmOpsRequests,
    saveUserOnboarding,
    removeAdUser,
    getVmSupportedSizes,
    rerunVmOatChecklist,
    getCmdbCountries,
    getHostNames,
    getCmdbRegions,
    getCmdbImpacts,
    getCmdbServices,
    decommissionVm,
    updateVmRequestThroughJenkins,
    syncJenkinJobsStatus,
    getUserVmAccessRequests,
    updateUserVmAccessRequests,
    updateUserVmAccessRequestsStatus,
    getAdGroups,
    syncAdUserRequests,
    addAndAttachDisk,
	manageVMLock,
	azureRegions,
	getWindowsVmUserAccessList,
	getAllUsersList
};

