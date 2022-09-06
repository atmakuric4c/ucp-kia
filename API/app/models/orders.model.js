var db = require('../../config/database');
var dbFunc = require('../../config/db-function');
const dbHandler= require('../../config/api_db_handler');
const helper=require('../../helpers/common_helper');
var md5 = require('md5');
const dateFormat = require("dateformat");
var base64 = require('base-64');
const config=require('../../config/constants');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');
const axios = require('axios');
const querystring = require('querystring');
var mail = require("./../../common/mailer.js");
const azureModel = require('../../models/azure_model');
const userModel = require('./user-model');
const commonModel = require('./common.model');

let CreateOrUpdateAddonInfo = async (reqObj,callback)=>{
	return new Promise(function(resolve,reject){
		if(reqObj.vmid && reqObj.vmid!= ''){
			db.query(`SELECT * FROM c4_order_details where vmid =  '${reqObj.vmid}' limit 1`,(error,order_details,fields)=>{
				console.log("order_details");
                console.log(order_details);
				if(!!error) {
	                dbFunc.connectionRelease;
	                console.log(error);
	                var response={status:"error", message:'The operation did not execute as expected. Please raise a ticket to support', actual_error : error}
	                resolve(response);
	                return callback(1,response);
	            } else {
	                dbFunc.connectionRelease;
	                if(order_details.length == 0){
	                	var response={status:"error", message:'The operation did not execute as expected. Please raise a ticket to support', actual_error : "Invalid VmId"}
		                resolve(response);
	                	return callback(1,response);
	                }else{
	                	let addon_sql = `SELECT * FROM c4_order_details where order_type = '${reqObj.order_type}' and reference_id = '${reqObj.reference_id}' limit 1`;
	                	console.log("addon_sql");
                        console.log(addon_sql);
	                	db.query(addon_sql,async (error,addon_details,fields)=>{
	                		console.log("addon_details");
	                        console.log(addon_details);
	                		if(!!error) {
	        	                dbFunc.connectionRelease;
	        	                console.log(error);
	        	                var response={status:"error", message:'The operation did not execute as expected. Please raise a ticket to support', actual_error : error}
	        	                resolve(response);
	        	                return callback(1,response);
	        	                
	        	            } else {
	        	                dbFunc.connectionRelease;
	        	                if(addon_details.length > 0){
	        	                	updaterefdata = {
                                        'vmid' : reqObj.vmid,
                                        'updateddate' : (new Date().getTime() / 1000)
                                    };
                                    console.log("updaterefdata");
                                    console.log(updaterefdata);
                                    await dbHandler.updateTableData('c4_order_details',{id:addon_details[0].id},updaterefdata,async function(err,result){
                                    	resolve('order updated');
                                    	return callback(null,'order updated')
                                    });
	        	                }else{
				                	var odrDetailsValues = {
						              'order_id' : order_details[0].order_id,
						              'order_type' : reqObj.order_type,
						              description : reqObj.description,
						              plan_id : reqObj.plan_id,
						              mrc_price : reqObj.mrc_price,
						              billing_location : reqObj.billing_location,
						              'vmid' : reqObj.vmid,
						              'clientid': reqObj.clientid,
						              'reference_id' : reqObj.reference_id,
						              'status':1,
						              'createddate' : (new Date().getTime() / 1000),
						              'billing_frequency':"FREE",
						              'quantity' : 1
						            };
						            
						            response = await dbHandler.insertIntoTable('c4_order_details',odrDetailsValues,async function(error,orderDetailsId){
						                if(error) {
						                    dbFunc.connectionRelease;
						                    resolve(error);
						                    return callback(1,'The operation did not execute as expected. Please raise a ticket to support')
						                } else {
						                    dbFunc.connectionRelease;
						                    console.log("orderDetailsId");
						                    console.log(orderDetailsId);
					
						                    resolve('order created');
						                    return callback(null,'order created')
						                }
						            });
	        	                }
	        	            }
	                	});
	                }
	            }
			});
		}else{
		    var odrValues = {
		      'order_number' : helper.getRandomNumber(),
		      'clientid': reqObj.clientid,
		      'createddate' : (new Date().getTime() / 1000),
		    };
		    db.query("INSERT INTO c4_orders SET ?", odrValues ,async function(error,orderRows,fields){
		        if(error) {
		            dbFunc.connectionRelease;
		            resolve(error);
		            return callback(1,'The operation did not execute as expected. Please raise a ticket to support')
		        } else {
		            dbFunc.connectionRelease;
		            console.log(orderRows);
		            let orderId = orderRows.insertId
	
		            var odrDetailsValues = {
		              'order_id' : orderId,
		              'order_type' : reqObj.order_type,
		              description : reqObj.description,
		              plan_id : reqObj.plan_id,
		              mrc_price : reqObj.mrc_price,
		              billing_location : reqObj.billing_location,
		              'clientid': reqObj.clientid,
		              'reference_id' : reqObj.reference_id,
		              'status':1,
		              'createddate' : (new Date().getTime() / 1000),
		              'billing_frequency':"FREE",
		              'quantity' : 1
		            };
		            
		            response = await dbHandler.insertIntoTable('c4_order_details',odrDetailsValues,async function(error,orderDetailsId){
		                if(error) {
		                    dbFunc.connectionRelease;
		                    resolve(error);
		                    return callback(1,'The operation did not execute as expected. Please raise a ticket to support')
		                } else {
		                    dbFunc.connectionRelease;
		                    console.log("orderDetailsId");
		                    console.log(orderDetailsId);
	
		                    resolve('order created');
		                    return callback(null,'order created')
		                }
		            });
		            
		        }
		    });
		}
	});
}

function getAddonPrice(reqObj,callback) {
	let formData = reqObj;
    ////console.log(formData);
    ////console.log(JSON.stringify(formData));
    if(!formData.cloud_type)
        callback(1,{status:"error",message:'cloud_type is missing'});
    if(!formData.addon_name)
        callback(1,{status:"error",message:'addon_name is missing'});
    if(!formData.currency_id)
        callback(1,{status:"error",message:'currency_id is missing'});

    var frmValues = {
        'cloud_type' : formData.cloud_type,
        'addon_name': formData.addon_name,
        'currency_id': formData.currency_id,
      };
    
    return new Promise((resolve,reject) => {
        db.query(`SELECT * FROM c4_addons where record_status = 1 
        and order_type = '${frmValues.cloud_type}'
        and name = '${frmValues.addon_name}'
        and currency_id = '${frmValues.currency_id}' 
        limit 1`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                console.log(error);
                var response={status:"error", message:'The operation did not execute as expected. Please raise a ticket to support', actual_error : error, data:[]}
                resolve(response);
                callback(1,response);
                
            } else {
                dbFunc.connectionRelease;
                var response={status:"success", message:'Price Details', data:rows}
                resolve(response);
                callback(null,response);
            }
       });
    });
}

function getAllCloudNames() {
    return new Promise((resolve,reject) => {
        db.query(`SELECT * FROM c4_cloud_names where record_status = 1 and is_visible = 1 order by cloud_name asc`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });
    });
}

function getBillingPrice(reqObj,callback) {
    let formData = reqObj.body;
    // console.log(formData);
    var frmValues = {
        copy_type: formData.plancloud,
        billing_type: "MONTHLY",
        os_template_id : formData.os_template_id,
        vdc_tech_disk_id: formData.dc_location,
        currency_id: formData.currency_id
      };
    
    return new Promise((resolve,reject) => {
        if(typeof formData.plancloud != "undefined" && 
            typeof formData.billing_type != "undefined" && 
            typeof formData.dc_location != "undefined"){
            let sql =`SELECT bp.* FROM c4_billing_pricemaster as bp 
            inner join c4_vdc_tech_disk as vtd on vtd.tech_id = bp.tech_id and vtd.vdc_id = bp.vdc_id 
            where vtd.id = '${frmValues.vdc_tech_disk_id}' and bp.type = '${frmValues.billing_type}' and bp.copy_type = '${frmValues.copy_type}' and bp.currency_id = '${frmValues.currency_id}' and bp.record_status = '1' `;
             console.log(sql);
            db.query(sql,(error, rows, fields) => {
                if (error) {
                    dbFunc.connectionRelease;
                    callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                    resolve(error);
                } else if (rows.length > 0) {
                    dbFunc.connectionRelease;
                    if(typeof formData.os_template_id != "undefined"){
                        let sql =`SELECT otp.*, cur.id as currency_id, cur.currency_code FROM c4_os_templates_prices as otp 
                        inner join c4_currencies as cur on cur.id = otp.currency_id
                        where otp.os_template_id = '${frmValues.os_template_id}' and otp.billing_frequency = '${frmValues.billing_type}' and otp.currency_id = '${frmValues.currency_id}' and otp.record_status = '1' `;
                         console.log(sql);
                        db.query(sql,(osError, osRows, osFields) => {
                            if (osError) {
                                dbFunc.connectionRelease;
                                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                                resolve(osError);
                            } else if (osRows.length > 0) {
                                dbFunc.connectionRelease;
                                callback(null,{billingRows:rows,osRows:osRows});
                                resolve(rows);
                            } else {
                                dbFunc.connectionRelease;
                                callback(null,{billingRows:rows});
                                resolve(rows);
                            }
                        });
                    }else{
                        callback(null,{billingRows:rows});
                        resolve(rows);
                    }
                } else {
                    dbFunc.connectionRelease;
                    callback(2,"Price Data not found");
                    resolve([]);
                }
            });
        }else{
            callback(2,"Some of the required fields are empty");
            resolve([]);
        }
    });
}

function getAllDCLocations(cloudName) {
    return new Promise((resolve,reject) => {
        db.query(`SELECT vtd.id, vtd.tech_id, vtd.vdc_id,st.slurname as location,st.cloudid FROM c4_server_technologies as st
        inner join c4_vdc_tech_disk as vtd on vtd.tech_id = st.id
        INNER join c4_vdc as vdc on vdc.id = vtd.vdc_id
        where st.cloudid in (${cloudName}) and st.status = 1 and vtd.status = 1 and vdc.status = 1
        order by st.slurname ASC`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });
    });
}

function getCopyTypes(vdc_tech_disk_id) {
    return new Promise((resolve,reject) => {
        db.query(`SELECT 1C,2C,3C,4C FROM c4_vdc_tech_disk
        where id = ${vdc_tech_disk_id} and status = 1`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });
    });
}

function getTxnDetails(txnId) {
    txnId = parseInt(base64.decode (txnId));
    return new Promise((resolve,reject) => {
        let sql = `SELECT 
        c4_transaction_requests.uid,
        c4_transaction_requests.clientid,
        c4_transaction_requests.transaction_type,
        c4_transaction_requests.txn_status,
        c4_transaction_requests.txn_msg,
        c4_transaction_requests.ref_id,
        c4_transaction_requests.request_type,
        c4_transaction_requests.requested_amount,
        c4_transaction_requests.conversion_rate,
        c4_transaction_requests.gateway,
        c4_clients.company_name,
        c4_clients.address,
        c4_clients.city,
        c4_clients.state,
        c4_clients.country,
        c4_clients.phone,
        c4_clients.email,
        c4_clients.postalcode,
        c4_clients.mobile,c4_clients.currency_code,
        c4_client_users.mobile as phonestring,
        c4_client_users.id as userid
        FROM c4_transaction_requests
        INNER JOIN c4_clients ON c4_transaction_requests.clientid = c4_clients.id
        INNER JOIN c4_client_users ON c4_transaction_requests.created_by = c4_client_users.id
        where uid = '${txnId}'`;
        db.query(sql,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                if (rows.length > 0) {
                    resolve(rows);
                }else{
                    resolve("Invalid Request");
                }
            }
       });
    });
}

function getOsTemplates(vdc_tech_disk_id) {
    return new Promise((resolve,reject) => {
        db.query(`SELECT os.id, os.template_name FROM c4_os_templates as os 
        inner join c4_vdc_tech_disk as vtd on vtd.tech_id = os.tech_id and vtd.vdc_id = os.vdc_id 
        where vtd.id = ${vdc_tech_disk_id} and os.status = 1 order by template_name asc`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });
    });
}

function saveOrderInfo(reqObj,callback) {
    let formData = reqObj.body;
    // console.log(formData);
    // return;
    let cart_items = {"config":{
                            "cpus":formData.cpu,
                            "ram":parseInt(formData.ram) * 1024,
                            "bandwidth":null,
                            "storage":formData.disk,
                            "osid":formData.os_template_id
                        },
                        "plan_type":"CUSTOM",
                        "plan_frequency":"CUSTOMMONTH",
                        "techid":formData.techid,
                        "group_id":"0",
                        "vdcid":formData.vdcid,
                        "networkid":"0",
                        "disk_type":formData.disk_type,
                        "ipaddress":[],
                        "pricing":{
                            "cpu_cost":null,
                            "ram_cost":null,
                            "disk_on_cost":null,
                            "disk_off_cost":null,
                            "bandwidth_in_cost":null,
                            "bandwidth_out_cost":null,
                            "base_price":null,
                            "hourly_price":0,
                            "copy_type":formData.plancloud,
                            "mrc_price":formData.price,
                            "bandwidth_mrc_price":0,
                            "monthly_price":formData.price,
                            "cpu_monthlycost":formData.cpu_monthlycost,
                            "ram_monthlycost":formData.ram_monthlycost,
                            "disk_on_monthlycost":formData.disk_on_monthlycost,
                            "bandwidth_in_price":formData.bandwidth_in_price,
                            "base_monthlycost":formData.base_monthlycost,
                            "osprice":formData.osprice,
                        },
                        "cloud_type":formData.cloud_type,
                        "dc_location":formData.dc_location,
                        "network":formData.network
                    };

    var frmValues = {
        cartid: md5(helper.getRandomString()),
        cloudid: formData.cloud_type,
        cart_items: JSON.stringify(cart_items),
        createddate : new Date().getTime() / 1000,
        clientid: formData.clientid,
        userid: formData.user_id,
        billing_type: formData.billing_type,
        os_template_id: formData.os_template_id,
        record_status: 1,
        product_type: 'CLOUD',
        items_count:1,
        item_value : formData.price,
        service_tax : helper.calculateTax({amount:formData.price,currency_id:'1',get_tax:'amount'}),
        copy_type : formData.plancloud
      };

    return new Promise((resolve,reject) => {
        frmValues.cart_total = parseInt(frmValues.item_value) + parseInt(frmValues.service_tax);
        db.query(`SELECT ci.* FROM c4_cart_items as ci
        where ci.userid = ${formData.user_id} and ci.record_status = 1 order by id asc`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                resolve(error);
            } else {
                dbFunc.connectionRelease;
//                if (rows.length > 0) {
//                    frmValues.cartid = rows[0].cartid;
//                }
                db.query("INSERT INTO c4_cart_items SET ?", frmValues ,(error,orderRows,fields)=>{
                    if(error) {
                        dbFunc.connectionRelease;
                        callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                        resolve(error);
                    } else {
                        dbFunc.connectionRelease;
                        callback(null,{"message":"Order Added to Cart Successfully."});
                        resolve(orderRows);
                    }
                });
            }
       });
        
        
    });
}

function updatePgiSelection(reqObj,callback) {
    let formData = reqObj.body;
//     console.log(formData);
//     return;

    let uid = parseInt(base64.decode (formData.txnId));
    var frmValues = {
        gateway: formData.paymentGateway,
        updateddate : new Date().getTime() / 1000,
      };

    return new Promise((resolve,reject) => {
    	console.log("frmValues");
        console.log(frmValues);
        dbHandler.updateTableData('c4_transaction_requests',{uid:uid},frmValues,async function(err,result){
        	if(!!err) {
                dbFunc.connectionRelease;
                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                callback(null,{"message":"Payment Gateway updated successfully."});
                resolve(result);
            }
        });
    });
}

let saveOtherCloudOrderInfo= async (reqObj,callback)=>{
//	reqObj.body = {"cloud_id":3,"cart_items":{"location":"eastus","clientid":222,"diskName":"","cpus":4,"ram":14336,"disksize":64,"virtual_machine_size":"Standard_DS3_v2","os_disk_size":64,"os_disk_storage_account_type":"Standard_LRS","os_type":"Linux","deployment_resource_group_name":"Devopsautomation","gallery_name":"automationsig","shared_image_name":"rhel81-sap-abap-image","shared_image_version":"1.0.0","network_resource_group_name":"Devopsautomation","virtual_network_name":"devopsautomation_vnet","subnet_name":"default","image_name":"rhel81-sap-abap-image","admin_username":"rajesh","admin_password":"Ctrls@123456","environment":"Production","system_name":"ABAP","system_type":"APP","subscription_id":"d41d3b88-e148-4bc1-b2b2-1c0893e1feba","client_id":"a1ab43c0-5e41-4609-bd5f-733aa988ef02","client_secret":"1GTehW6r81~-Yz4EGemG-s_~.4Z9k65us1","tenant_id":"e59c84a4-af3c-4b74-8a18-02eee8993bfb","storage_account_name":"devopsautomationstorage1","backup_resource_group_name":"Devopsautomation","recovery_vault_name":"backupvault","backup_policy":"DefaultPolicy","region":"2_EA","network_identify":"0","VmListUpdated":[{"virtual_machine_name":"XA120HN200008","nic_name":"XA120HN200008a-NIC","zone":"1","managed_disk_name":"[\"XA120HN200008-disk1\",\"XA120HN200008-disk2\"]","managed_disk_host_caching":"[\"None\",\"ReadOnly\"]","managed_disk_size":"[150,150]","managed_disk_size_storage_account_type":"[\"Standard_LRS\",\"Standard_LRS\"]"},{"virtual_machine_name":"XA120HN200009","nic_name":"XA120HN200009-NIC","zone":"2","managed_disk_name":"[\"XA120HN200009-disk1\"]","managed_disk_host_caching":"[\"None\"]","managed_disk_size":"[100]","managed_disk_size_storage_account_type":"[\"Standard_LRS\"]"}]},"clientid":222,"user_id":2,"billing_type":"MONTHLY","os_template_id":"","cloud_type":"AZURE","price":100};
    let formData = reqObj.body;
    console.log("formData --- ", JSON.stringify(formData));
    var fs = require('fs');
//    return callback(1,formData);
    
    let orderRG = "";
    let orderSubscription = "";
    let orderVmInfo = []
    let cts = Math.round(new Date().getTime() / 1000);
    var frmValues = {
        cartid: md5(helper.getRandomString()),
        cloudid: formData.cloud_id,
        cart_items: JSON.stringify(formData.cart_items),
        createddate : cts,
        clientid: formData.clientid,
        userid: formData.user_id,
        billing_type: formData.billing_type,
        os_template_id: formData.os_template_id,
        record_status: 1,
        product_type: formData.cloud_type,
        items_count:1,
        item_value : "0.00",//formData.price,
        service_tax : "0.00",//helper.calculateTax({amount:formData.price,currency_id:'1',get_tax:'amount'}),
        copy_type : '1C'
      };
    let weblogicMiddlewares = ["WebLogic", "WebLogic Server"];
    

    return new Promise(async (resolve,reject) => {
    	let VmListUpdated = formData.cart_items.VmListUpdated;
    	delete formData.cart_items.VmListUpdated;
    	
    	let i = 0;
    	for await (const val of VmListUpdated) {
    		i++;
    		await new Promise(async function(innerResolve, innerReject){
    			let log_file_name = "saveOtherCloudOrderInfo_"+val.virtual_machine_name+".txt";
    			helper.logDataToFile(log_file_name,"formData -- "+((typeof formData=='object')?JSON.stringify(formData):formData));
    			helper.logDataToFile(log_file_name,"val -- "+((typeof val=='object')?JSON.stringify(val):val));
    			
	    		let frmValueItem = frmValues;
	    		frmValueItem.cart_items = Object.assign({},formData.cart_items,{
    				"virtual_machine_name": val.virtual_machine_name,
    	            "nic_name": val.nic_name,
    	            "managed_disk_name": val.managed_disk_name,
    	            "managed_disk_host_caching": val.managed_disk_host_caching,
    	            "managed_disk_storage_size": val.managed_disk_storage_size,
    	            "managed_disk_size": val.managed_disk_size,
    	            "managed_disk_size_storage_account_type": val.managed_disk_size_storage_account_type
    			});
	    		if(formData.cart_items.availability_set_or_zone == 'Zone'){
	    			frmValueItem.cart_items.zone = val.zone;
	    		}else{
	    			frmValueItem.cart_items.availability_set_name = val.availability_set_name;
	    		}
	    		if(formData.cart_items.shared_image_tags 
                		&& formData.cart_items.shared_image_tags["UCP-MW"] 
                		&& weblogicMiddlewares.indexOf(formData.cart_items.shared_image_tags["UCP-MW"]) >= 0){
            		frmValueItem.cart_items.weblogicServiceName = val.weblogicServiceName;
//            		frmValueItem.cart_items.weblogicManagedServers = val.weblogicManagedServers;
            		frmValueItem.cart_items.weblogicUsername = val.weblogicUsername;
            		frmValueItem.cart_items.weblogicPassword = val.weblogicPassword;
	    		}

	    		if(formData.cart_items.shared_image_tags 
                		&& formData.cart_items.shared_image_tags["UCP-DB-Type"] 
                		&& formData.cart_items.shared_image_tags["UCP-DB-Type"] == 'Oracle'){
            		frmValueItem.cart_items.dbName = val.dbName;
            		frmValueItem.cart_items.dbUsername = val.dbUsername;
            		frmValueItem.cart_items.dbPassword = val.dbPassword;
            		frmValueItem.cart_items.dbCharacterSet = val.dbCharacterSet;
	    		}

	    		if(formData.cart_items.shared_image_tags 
                		&& formData.cart_items.shared_image_tags["UCP-DB-Type"] 
                		&& formData.cart_items.shared_image_tags["UCP-DB-Type"] == 'Informix'){
            		frmValueItem.cart_items.dbName = val.dbName;
            		frmValueItem.cart_items.informixLog = val.informixLog;
	    		}
	    		
	    		if(formData.cart_items.shared_image_tags 
                		&& formData.cart_items.shared_image_tags["UCP-DB-Type"] 
                		&& formData.cart_items.shared_image_tags["UCP-DB-Type"] == 'MSSQL'){
            		frmValueItem.cart_items.msDbName = val.msDbName;
            		frmValueItem.cart_items.Data_File_Size = val.Data_File_Size;
            		frmValueItem.cart_items.Log_File_Size = val.Log_File_Size;
            		frmValueItem.cart_items.Temp_DB_Size = val.Temp_DB_Size;
	    		}
	    		frmValueItem.resourceGroup = frmValueItem.cart_items.deployment_resource_group_name;
	    		frmValueItem.subscription = frmValueItem.cart_items.subscription_id;
	    		orderRG = ""+frmValueItem.cart_items.deployment_resource_group_name;
	    		orderSubscription = ""+frmValueItem.cart_items.subscription_id
	    		
	    		let cyberark_usernames ={};
	    	    if(frmValueItem.cart_items.os_type == 'Linux'){
	    	    		if(frmValueItem.cart_items.shared_image_tags 
	    		        		&& frmValueItem.cart_items.shared_image_tags['UCP-CyberArkSafe-Global-Prod']){
	    		    		cyberark_usernames['UCP-CyberArkSafe-Global-Prod'] = frmValueItem.cart_items.shared_image_tags['UCP-CyberArkSafe-Global-Prod'];
	    		    	}
	    	    		if(frmValueItem.cart_items.shared_image_tags 
	    		        		&& frmValueItem.cart_items.shared_image_tags['UCP-CyberArkSafe-App-Prod']){
	    		    		cyberark_usernames['UCP-CyberArkSafe-App-Prod'] = frmValueItem.cart_items.shared_image_tags['UCP-CyberArkSafe-App-Prod'];
	    		    	}
	    	    		if(frmValueItem.cart_items.shared_image_tags && frmValueItem.cart_items.shared_image_tags['UCP-CyberArkSafe-TEMP'] 
	    	    			&& frmValueItem.cart_items.cyberark_region){
	    	    			let tempCyberarkUsers = frmValueItem.cart_items.shared_image_tags['UCP-CyberArkSafe-TEMP'].split("::");
	    	    			let tempCyberarkUserArr = [];
	    	    			for await (const tempCyberarkUser of tempCyberarkUsers){
	    	    				tempCyberarkUserArr.push(tempCyberarkUser +"_"+ frmValueItem.cart_items.cyberark_region + "_" + frmValueItem.cart_items.deployment_resource_group_name.substr(-12))
	    	    			}
	    		    		cyberark_usernames['UCP-CyberArkSafe-TEMP'] = tempCyberarkUserArr.join("::");
	    		    	}
//	    		    	if(frmValueItem.cart_items.shared_image_tags 
//	    		        		&& frmValueItem.cart_items.shared_image_tags['UCP-CyberArkSafe-RTP-Prod']){
//	    		    		cyberark_usernames['UCP-CyberArkSafe-RTP-Prod'] = frmValueItem.cart_items.shared_image_tags['UCP-CyberArkSafe-RTP-Prod'];
//	    		    	}
//	    	    	}else{
//	    		    	if(frmValueItem.cart_items.shared_image_tags 
//	    		        		&& frmValueItem.cart_items.shared_image_tags['UCP-CyberArkSafe-Admin']){
//	    		    		cyberark_usernames['UCP-CyberArkSafe-Admin'] = frmValueItem.cart_items.shared_image_tags['UCP-CyberArkSafe-Admin'];
//	    		    	}
//	    		    	if(frmValueItem.cart_items.shared_image_tags 
//	    		        		&& frmValueItem.cart_items.shared_image_tags['UCP-CyberArkSafe-App']){
//	    		    		cyberark_usernames['UCP-CyberArkSafe-App'] = frmValueItem.cart_items.shared_image_tags['UCP-CyberArkSafe-App'];
//	    		    	}
//	    	    	}
	    	    }
	    	    frmValueItem.cart_items.requested_domain = config.API_URL;
	    	    frmValueItem.cart_items.cyberark_usernames = JSON.stringify(cyberark_usernames);
//	    	    console.log("frmValueItem.cart_items.cyberark_usernames --- ", frmValueItem.cart_items.cyberark_usernames);
	    	    
	    	    frmValueItem.cart_items.disk_encryption_name = '';
	    	    frmValueItem.cart_items.disk_encryption_resource_group_name = "";
	    	    if(frmValueItem.cart_items.cmdbBuUnit && frmValueItem.cart_items.cmdbBuUnit != ''){
	    	    	let sql =`select resource_group, disk_encryption_set_name from azure_disks_encryption 
	    	    	where subscription_id = '${frmValueItem.cart_items.subscription_id}' 
	    	    	and location = '${frmValueItem.cart_items.selected_network_location_name}'
	    	    	and business_unit = '${frmValueItem.cart_items.cmdbBuUnit}'
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
	    		            		frmValueItem.cart_items.disk_encryption_resource_group_name = rows[0].resource_group;
	    		            		frmValueItem.cart_items.disk_encryption_name = rows[0].disk_encryption_set_name;
	    		            		resolve1("");
	    		            	}else{
	    		            		resolve1("");
	    		            	}
	    		            }
	    		        });
	    	        });
	    	    }

//	    	    console.log("frmValueItem --- ", frmValueItem);
	    		
	//        frmValues.cart_total = parseInt(frmValues.item_value) + parseInt(frmValues.service_tax);
	    		frmValueItem.cart_total = 0;
	    		let sql = `SELECT ci.* FROM c4_cart_items as ci
    		        where ci.userid = '${formData.user_id}' and ci.record_status = 1 order by id asc`;
		        await db.query(sql,async (error,rows,fields)=>{
		            if(!!error) {
		                dbFunc.connectionRelease;
		                return callback(1,"The operation did not execute as expected. Please raise a ticket to support");
		                innerResolve(error);
		            } else {
		                dbFunc.connectionRelease;
//		                if (rows.length > 0) {
//		                    frmValueItem.cartid = rows[0].cartid;
//		                }
		                
		                console.log("frmValueItem --- ", JSON.stringify(frmValueItem));
//		                return callback(null,frmValueItem);
		                
		                let updateSql = "update azure_reusing_hostnames set " +
		            			" provision_status= 0, provision_date= '', is_vm_added_to_cart = 1, " +
		            			" updated_date= '"+cts+"'" +
		            			" WHERE host_name = '"+val.virtual_machine_name+"'";
				    	console.log("updateSql --- ", updateSql);
				    	await db.query(updateSql, (error,rows,fields)=>{
				    		dbFunc.connectionRelease;
				            if(!!error) {
				            	console.log(error);
				            } else {
				                console.log(`Updated is_vm_added_to_cart to 1`);
				                console.log(rows);
				            }
				    	});
		            	
				    	helper.logDataToFile(log_file_name,"formData.cart_items.mountPointJson -- "+((typeof formData.cart_items.mountPointJson=='object')?JSON.stringify(formData.cart_items.mountPointJson):formData.cart_items.mountPointJson));
		            	if(formData.cart_items.mountPointJson && formData.cart_items.mountPointJson[val.virtual_machine_name]){
		            		fs.writeFile(config.REPORTS_PATH+val.virtual_machine_name+'.json', JSON.stringify(formData.cart_items.mountPointJson[val.virtual_machine_name], null, 4), function(err) {
		                        if(err) {
		                            console.log(err);
		                            helper.logDataToFile(log_file_name,"formData.cart_items.mountPointJson err -- "+((typeof err=='object')?JSON.stringify(err):err));
		                          } else {
		                        	  helper.logDataToFile(log_file_name,"formData.cart_items.mountPointJson JSON saved");
		                            console.log("JSON saved ");
		                          }
		                    });
		            	}
		            	if(formData.cart_items.shared_image_tags 
		                		&& formData.cart_items.shared_image_tags["UCP-DB-Type"] 
		                		&& formData.cart_items.shared_image_tags["UCP-DB-Type"] == 'Oracle'){
		            		let oracleListenerOraFileData = "LISTENER =\n" +
		            				"  (DESCRIPTION_LIST =\n" +
		            				"    (DESCRIPTION =\n" +
		            				"      (ADDRESS = (PROTOCOL = IPC)(KEY = EXTPROC1))\n" +
		            				"      (ADDRESS = (PROTOCOL = TCP)(HOST = "+val.virtual_machine_name +"."+frmValueItem.cart_items.domain_extension+")(PORT = 1527))\n" +
		            				"    )\n" +
		            				"  )\n\n" +
		            				"SID_LIST_LISTENER =\n" +
		            				"  (SID_LIST =\n" +
		            				"    (SID_DESC =\n" +
		            				"      (GLOBAL_DBNAME = "+val.dbName+")\n" +
		            				"      (ORACLE_HOME = "+formData.cart_items.shared_image_version_tags["UCP-ORACLE-HOME"]+")\n" +
		            				"      (SID_NAME = "+val.dbName+")\n" +
		            				"    )\n" +
		            				"  )\n\n";
		            		
		            		fs.writeFile(config.REPORTS_PATH+val.virtual_machine_name+'_listener.ora', oracleListenerOraFileData, function(err) {
		                        if(err) {
		                            console.log(err);
		                          } else {
		                            console.log("oracle listener.ora file saved ");
		                          }
		                    });
		            		
		            		let oracleTnsNamesOraFileData = "LISTENER = (ADDRESS = (PROTOCOL = TCP)(HOST = "+val.virtual_machine_name +"."+frmValueItem.cart_items.domain_extension+")(PORT = 1527))\n" +
		            				""+val.dbName+" =\n" +
		            				"  (DESCRIPTION =\n" +
		            				"    (ADDRESS_LIST =\n" +
		            				"      (ADDRESS = (PROTOCOL = TCP)(HOST = "+val.virtual_machine_name +"."+frmValueItem.cart_items.domain_extension+")(PORT = 1527))\n" +
		            				"    )\n" +
		            				"    (CONNECT_DATA =\n" +
		            				"      (SERVICE_NAME = "+val.dbName+")\n" +
		            				"    )\n" +
		            				"  )\n\n";
		            		
		            		fs.writeFile(config.REPORTS_PATH+val.virtual_machine_name+'_tnsnames.ora', oracleTnsNamesOraFileData, function(err) {
		                        if(err) {
		                            console.log(err);
		                          } else {
		                            console.log("oracle tnsnames.ora file saved ");
		                          }
		                    });
		            		
		            		let oracleDbcaFileData = " gdbName="+val.dbName+"\n" +
		            				" sid="+val.dbName+"\n" +
		            				" databaseConfigType=SI\n" +
		            				" createAsContainerDatabase=false\n" +
		            				" templateName="+formData.cart_items.shared_image_version_tags["UCP-ORACLE-HOME"]+"/assistants/dbca/templates/iaasdhldb.dbt\n" +
		            				" sysPassword=qxu6mZCTNb\n" +
		            				" systemPassword=qxu6mZCTNb\n" +
		            				" dbsnmpPassword=qxu6mZCTNb\n" +
		            				" datafileDestination=/oracle/oradata/"+val.dbName+"\n" +
		            				" recoveryAreaDestination=/oracle/arclog/"+val.dbName+"\n" +
		            				" storageType=FS\n" +
		            				" characterSet="+val.dbCharacterSet+"\n" +
		            				" nationalCharacterSet=AL16UTF16\n" +
		            				" sampleSchema=TRUE\n" +
		            				" databaseType=MULTIPURPOSE\n" +
		            				" automaticMemoryManagement=FALSE\n" +
		            				" totalMemory="+Math.floor(parseInt(frmValueItem.cart_items.ram)*55/100)+"\n\n";
		            		
		            		fs.writeFile(config.REPORTS_PATH+val.virtual_machine_name+'_dbca.rsp', oracleDbcaFileData, function(err) {
		                        if(err) {
		                            console.log(err);
		                          } else {
		                            console.log("oracle dbca.rsp file saved ");
		                          }
		                    });
		            		
		            		let oraclePostDbCreationFileData = "export ORACLE_SID="+val.dbName+";\n" +
		            				"sqlplus -s '/ as sysdba' <<EOF\n" +
		            				"alter system set max_dump_file_size='500M' scope=both;\n" +
		            				"alter system set db_cache_size="+Math.floor(0.3*(parseInt(frmValueItem.cart_items.ram)*55/100)*75/100)+"M scope=both;\n\n\n" +
		            				"#####altering default profile###########\n\n" +
		            				"ALTER PROFILE DEFAULT LIMIT PASSWORD_LIFE_TIME 60;\n" +
		            				"ALTER PROFILE DEFAULT LIMIT PASSWORD_REUSE_MAX 13;\n" +
		            				"ALTER PROFILE DEFAULT LIMIT FAILED_LOGIN_ATTEMPTS 10;\n" +
		            				"ALTER PROFILE DEFAULT LIMIT PASSWORD_REUSE_TIME 780;\n" +
		            				"ALTER PROFILE DEFAULT LIMIT PASSWORD_LOCK_TIME 5/1440;\n" +
		            				"ALTER PROFILE DEFAULT LIMIT PASSWORD_GRACE_TIME 0;\n" +
		            				"ALTER PROFILE DEFAULT LIMIT INACTIVE_ACCOUNT_TIME 60;\n\n\n" +
		            				"##role creation####\n" +
		            				"CREATE ROLE appl_role;\n\n" +
		            				"grant ALTER SESSION to appl_role;\n" +
		            				"grant CREATE TYPE to appl_role;\n" +
		            				"grant CREATE SYNONYM to appl_role;\n" +
		            				"grant CREATE SESSION to appl_role;\n" +
		            				"grant CREATE TRIGGER to appl_role;\n" +
		            				"grant CREATE MATERIALIZED VIEW to appl_role;\n" +
		            				"grant CREATE TABLE to appl_role;\n" +
		            				"grant CREATE VIEW to appl_role;\n" +
		            				"grant CREATE PROCEDURE to appl_role;\n" +
		            				"grant CREATE JOB to appl_role;\n" +
		            				"grant CREATE SEQUENCE to appl_role;\n\n" +
		            				"###creating custom user###\n" +
		            				"CREATE USER "+val.dbUsername+' IDENTIFIED BY "'+val.dbPassword+'";\n' +
																		"alter user "+val.dbUsername+' profile svc_noage;\n' +
		            				"grant appl_role to "+val.dbUsername+" ;\n\n" +
		            				"EOF\n\n";
		            		
		            		fs.writeFile(config.REPORTS_PATH+val.virtual_machine_name+'_postdbcreation.sh', oraclePostDbCreationFileData, function(err) {
		                        if(err) {
		                            console.log(err);
		                          } else {
		                            console.log("oracle postdbcreation.sh file saved ");
		                          }
		                    });
		            		
		            		if(formData.cart_items.mountPointJson && formData.cart_items.mountPointJson[val.virtual_machine_name]
		            			&& formData.cart_items.mountPointJson[val.virtual_machine_name].physical_volume
		            			&& formData.cart_items.mountPointJson[val.virtual_machine_name].physical_volume[0]
		            			&& formData.cart_items.mountPointJson[val.virtual_machine_name].physical_volume[0].dgoracldb01
		            			){
		            			let pendingDiskSize = Math.floor((parseInt(formData.cart_items.mountPointJson[val.virtual_machine_name].physical_volume[0].dgoracldb01) - 149-40)*70/100);
			            		if(pendingDiskSize > 0){
			            			let oracleDataFilesFileData = "export ORACLE_SID="+val.dbName+";\n" +
				            				"sqlplus -s '/ as sysdba' <<EOF\n";
				            		let noOfOracleDatafiles = Math.floor(pendingDiskSize/30);
				            		let remainingOracleDatafileSize = (pendingDiskSize%30);
				            		let dfSize = 1;
				            		if(noOfOracleDatafiles > 0){
				            			for(let ms = 1; ms<= noOfOracleDatafiles; ms++){
					            			if(ms == 1){
					            				oracleDataFilesFileData += "CREATE TABLESPACE DATA DATAFILE SIZE 30720m;\n";
					            			}else{
					            				oracleDataFilesFileData += "ALTER TABLESPACE DATA ADD DATAFILE SIZE 30720m;\n";
					            			}
					            			dfSize++;
					            		}
				            		}
				            		if(remainingOracleDatafileSize > 0){
				            			if(dfSize == 1){
				            				oracleDataFilesFileData += "CREATE TABLESPACE DATA DATAFILE SIZE "+(remainingOracleDatafileSize*1024)+"m;\n";
				            			}else{
				            				oracleDataFilesFileData += "ALTER TABLESPACE DATA ADD DATAFILE SIZE "+(remainingOracleDatafileSize*1024)+"m;\n";
				            			}
				            		}
				            		oracleDataFilesFileData += "EOF\n\n";
				            		
				            		fs.writeFile(config.REPORTS_PATH+val.virtual_machine_name+'_datafiles.sh', oracleDataFilesFileData, function(err) {
				                        if(err) {
				                            console.log(err);
				                          } else {
				                            console.log("oracle datafiles.sh file saved ");
				                          }
				                    });
			            		}
		            		}
		            	}
//		            	return callback(1,"The operation did not execute as expected. Please raise a ticket to support");
		            	
		            	/*if(formData.cart_items.shared_image_tags && ormData.cart_items.shared_image_version_tags
		                		&& formData.cart_items.shared_image_tags["UCP-MW"] 
		                		&& weblogicMiddlewares.indexOf(formData.cart_items.shared_image_tags["UCP-MW"]) >= 0){
		            		let weblogicFileData = "# Paths\n" +
		            				"mwhome=/web/wls"+formData.cart_items.shared_image_version_tags["UCP-Weblogic-Version"]+"\n" +
		            				"wlshome=/web/wls"+formData.cart_items.shared_image_version_tags["UCP-Weblogic-Version"]+"/wlserver\n" +
		            				"domainroot=/appl\n" +
		            				"approot=/appl/"+val.weblogicServiceName+"/applications\n\n\n" +
		    						"# Credentials\n" +
		    						"domain_name="+val.weblogicServiceName+"\n" +
		    						"domain_username="+val.weblogicUsername+"\n" +
		    						"domain_password="+val.weblogicPassword+"\n\n\n" +
									"# Admin Server\n" +
									"admin.port=8001\n" +
									"admin.address="+val.virtual_machine_name +"\n"+
									"admin.port.ssl=8002\n\n\n" +
									"#Managed Server Definition\n" +
									"# Add more ms based on your need\n" +
									"# for every ms(server) you are adding you should also specify the properties like ms[n].port etc\n";
		            		weblogicFileData +="managedservers=";
		            		for(let ms = 1; ms<= val.weblogicManagedServers; ms++){
		            			if(ms == val.weblogicManagedServers){
		            				weblogicFileData +="ms"+ms;
		            			}else{
		            				weblogicFileData +="ms"+ms+",";
		            			}
		            		}
		            		weblogicFileData +="\n\n";
		            		
		            		let portNo = 8003;
		            		for(let ms = 1; ms<= val.weblogicManagedServers; ms++){
		        				weblogicFileData +="ms"+ms+".Name="+val.weblogicServiceName+"_managed_"+((ms+'').padStart(2,'0'))+"\n" +
		        						"ms"+ms+".port="+(portNo++)+"\n" +
		        						"ms"+ms+".port.ssl="+(portNo++)+"\n" +
		        						"ms"+ms+".address="+val.virtual_machine_name +"\n\n";
		            		}
		            		weblogicFileData +="\n";
		            		weblogicFileData +="# Cluster Definition\n" +
		            				"clusters=c1\n\n" +
		            				"c1.Name="+val.weblogicServiceName+"Cluster\n\n";
		            		weblogicFileData +="c1.members=";
		            		for(let ms = 1; ms<= val.weblogicManagedServers; ms++){
		            			if(ms == val.weblogicManagedServers){
		            				weblogicFileData +="ms"+ms;
		            			}else{
		            				weblogicFileData +="ms"+ms+",";
		            			}
		            		}
		            		weblogicFileData +="\n\n\n" +
		            				"# Define Machines\n" +
		            				"machines=m1\n\n" +
		            				"m1.Name="+val.weblogicServiceName+"_m01\n";
		            		weblogicFileData +="m1.instances=admin,";
		            		for(let ms = 1; ms<= val.weblogicManagedServers; ms++){
		            			if(ms == val.weblogicManagedServers){
		            				weblogicFileData +="ms"+ms;
		            			}else{
		            				weblogicFileData +="ms"+ms+",";
		            			}
		            		}
		            		weblogicFileData +="\n\n"
		            		
		                	fs.writeFile(config.REPORTS_PATH+val.virtual_machine_name+'.txt', weblogicFileData, function(err) {
		                        if(err) {
		                            console.log(err);
		                          } else {
		                            console.log("weblogic file saved ");
		                          }
		                    });
		            		
		            		
		            		//Read the weblogicEnvFile and update the weblogicEnvFileData as per Managed servers selection
		            		let weblogicEnvFileData = await new Promise((weblogicEnvFileDataResolve, weblogicEnvFileDataReject) => {
		            			fs.readFile(config.SAMPLE_FILES_PATH+"weblogic-environment.sh", 'utf8', function (err, data) {
		        		          if (err) {
		        		        	  console.log("weblogicEnvFileData error ",err);
		        		        	  weblogicEnvFileDataResolve("");
		        		          }
		        		          weblogicEnvFileDataResolve(data);
		        		        });
		        		    });
		//            		console.log("weblogicEnvFileData ---- ", weblogicEnvFileData);
		            		weblogicEnvFileData = weblogicEnvFileData.replace(/{{service_name}}/gi, val.weblogicServiceName);
		            		weblogicEnvFileData = weblogicEnvFileData.replace(/{{weblogic_version}}/gi, formData.cart_items.shared_image_version_tags["UCP-Weblogic-Version"]);
		            		weblogicEnvFileData = weblogicEnvFileData.replace(/{{JAVA_HOME}}/gi, ((formData.cart_items.shared_image_version_tags && formData.cart_items.shared_image_version_tags["UCP-JAVA_HOME"])?formData.cart_items.shared_image_version_tags["UCP-JAVA_HOME"]:""));
		            		
		            		weblogicEnvFileData +="#In case of "+val.weblogicManagedServers+" managed servers\n\n";
		            		for(let ms = 1; ms<= val.weblogicManagedServers; ms++){
		            			weblogicEnvFileData +='if [ "${SERVER_NAME}" == "'+val.weblogicServiceName+'_managed_'+((ms+'').padStart(2,'0'))+'" ] ; then\n' +
		        						'USER_MEM_ARGS="-Xms1024m -Xmx1024m -XX:MaxPermSize=1024m"\n' +
		        						"export USER_MEM_ARGS\n" +
		        						"fi\n\n";
		            		}
		            		weblogicEnvFileData +="\n";
		            		
		            		fs.writeFile(config.REPORTS_PATH+val.virtual_machine_name+'.sh', weblogicEnvFileData, function(err) {
		                        if(err) {
		                            console.log(err);
		                          } else {
		                            console.log("weblogic Env file saved ");
		                          }
		                    });
		            	}*/
		                
		            	if(formData.is_cluster == 0 || (formData.is_cluster == 1 && i == 1)){
		            		let private_ip_address = '';
		            		if(private_ip_address == ''){
		            	    	sql =`select ip_address from azure_reusing_hostnames 
		            	    	where host_name = '${val.virtual_machine_name}' 
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
		            		            		console.log("rows -- ", rows)
		            		            		private_ip_address = rows[0].ip_address;
		            		            		resolve1("");
		            		            	}else{
		            		            		resolve1("");
		            		            	}
		            		            }
		            		        });
		            	        });
		            		}
		            	    console.log("private_ip_address ------------------------------------------ ", private_ip_address);
		            	    frmValueItem.cart_items.private_ip_address = private_ip_address;
		            	    
		            		if(formData.is_cluster == 1 && VmListUpdated[1]){
		            			frmValueItem.cart_items = Object.assign({},frmValueItem.cart_items,{
		            				"nic_name2": val.nic_name2,
		            				"virtual_machine_name2": VmListUpdated[1].virtual_machine_name,
		            	            "nic_name3": VmListUpdated[1].nic_name,
		            	            "nic_name4" : VmListUpdated[1].nic_name2,
		            	            "managed_disk_name2": VmListUpdated[1].managed_disk_name,
		            	            "managed_disk_host_caching2": VmListUpdated[1].managed_disk_host_caching,
		            	            "managed_disk_storage_size2": VmListUpdated[1].managed_disk_storage_size,
		            	            "managed_disk_size2": VmListUpdated[1].managed_disk_size,
		            	            "managed_disk_size_storage_account_type2": VmListUpdated[1].managed_disk_size_storage_account_type,
		            			});
		        	    		if(formData.cart_items.availability_set_or_zone == 'Zone'){
		        	    			frmValueItem.cart_items.zone2 = VmListUpdated[1].zone;
		        	    		}else{
		        	    			frmValueItem.cart_items.availability_set_name2 = VmListUpdated[1].availability_set_name;
		        	    		}
		        	    		frmValueItem.is_cluster = formData.is_cluster;
		        	    		let private_ip_address2 = '';
		        	    		if(private_ip_address2 == ''){
		        	            	sql =`select ip_address from azure_reusing_hostnames 
		        	            	where host_name = '${VmListUpdated[1].virtual_machine_name}' 
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
		        	        	            		console.log("rows -- ", rows)
		        	        	            		private_ip_address2 = rows[0].ip_address;
		        	        	            		resolve1("");
		        	        	            	}else{
		        	        	            		resolve1("");
		        	        	            	}
		        	        	            }
		        	        	        });
		        	                });
		        	        	}
		        	    		console.log("private_ip_address2 ------------------------------------------ ", private_ip_address2);
			            	    frmValueItem.cart_items.private_ip_address2 = private_ip_address2;
		        	    		console.log("frmValueItem cluster ========================= ", frmValueItem);
		            		}
		            		
		            		orderVmInfo.push(frmValueItem.cart_items);
		            		frmValueItem.cart_items = JSON.stringify(frmValueItem.cart_items);
		    	    		console.log("frmValueItem before insert ---- ", frmValueItem);
//		            		return callback(null,formData);
		            		
			                db.query("INSERT INTO c4_cart_items SET ?", frmValueItem ,async (error,orderRows,fields)=>{
			                	dbFunc.connectionRelease;
			                	console.log("orderRows --- ", orderRows);
			                    if(error) {
			                        return callback(1,"The operation did not execute as expected. Please raise a ticket to support");
			                        resolve(error);
			                    } else {
			                        let sql = `SELECT am.id, am.approval_matrix_level FROM azure_approval_matrix as am
			            		        where am.record_status = 1 order by am.approval_matrix_level asc`;
		            		        await db.query(sql,async (error,levelRows,fields)=>{
		            		            if(!!error) {
		            		                dbFunc.connectionRelease;
		            		                return callback(1,"The operation did not execute as expected. Please raise a ticket to support");
		            		                innerResolve(error);
		            		            } else {
		            		                dbFunc.connectionRelease;
	//	            		                console.log("levelRows --- ", JSON.stringify(levelRows));
		            		                if (levelRows.length > 0) {
						                        //insert into log table
						                        let logData = {
						                        		cart_id : orderRows.insertId,
						                        		approval_status : 0,
						                        		approval_matrix_level : levelRows[0].approval_matrix_level,
						                        		created_by : formData.user_id,
						                        		created_date : cts
						                        };
	//					                        console.log("logData --- ", JSON.stringify(logData));
						                        await db.query("INSERT INTO azure_approval_logs SET ?", logData, async (error,logRows,fields)=>{
						                        	dbFunc.connectionRelease;
								                    if(error) {
								                        return callback(1,"The operation did not execute as expected. Please raise a ticket to support");
								                        resolve(error);
								                    } else {
								                        await dbHandler.updateTableData('c4_cart_items',{id:orderRows.insertId},{approval_status:0, pending_at : levelRows[0].approval_matrix_level},async function(err,result){
				                                            console.log(err);
				                                        });
								                        innerResolve(logRows);
								                    }
								                });
		            		                }else{
		            		                	innerResolve([]);
		            		                }
		            		            }
		            		        });
			                    }
			                });
		            	}else{
		            		console.log("else ==================================================================================== ");
		            		innerResolve("");
		            	}
		            }
		       });
    		});
    	}
    	commonModel.getEmailTemplate({template_key:"VM_ADD_TO_CART"},async function(error,emailTempRow){
    		console.log("emailTempRow --- ",JSON.stringify(emailTempRow));
    		console.log("orderRG --- ",orderRG);
    		console.log("orderVmInfo --- ",JSON.stringify(orderVmInfo));
    		console.log("orderSubscription --- ",orderSubscription);
    		console.log("reqObj.userDetails --- ",JSON.stringify(reqObj.userDetails));
    		if(orderRG 
    				&& orderVmInfo
    				&& orderVmInfo.length > 0
    				&& orderSubscription
    				&& reqObj.userDetails
    				&& emailTempRow.data){
	    		db.query(`SELECT cu.email FROM c4_azure_subscription_locations as asl 
	                    inner join c4_azure_resourcegroups as arg on (asl.id = arg.location_id )
	                    inner join resource_group_mapping as rgm on ( rgm.role_id = 3 and arg.id = rgm.resource_group)
                        inner join resource_group as rg on rgm.resource_group_id = rg.id
	                    inner join c4_client_users as cu on rg.user_id = cu.id
	            		where cu.status = 1 and asl.subscription_id = '${orderSubscription}' and arg.name ='${orderRG}' order by cu.email asc`,async function(error,emailRows,fields){
	                if(!!error) {
	                    dbFunc.connectionRelease;
	                    callback(1,{"message":"The operation did not execute as expected. Please raise a ticket to support"});
	                    resolve(error);
	                } else {
	                    dbFunc.connectionRelease;
	                    console.log("emailRows --- ",JSON.stringify(emailRows));
	                    let subject = emailTempRow.data.email_subject+ ((orderVmInfo.length == 1 && orderVmInfo[0].is_cluster == 0)?" - "+orderVmInfo[0].virtual_machine_name:"");
                        let mailbody = emailTempRow.data.email_body;

                        let vmTable = "";
                        let i= 1;
                        for await ( const vm of orderVmInfo ) {
                        	vmTable+=`<h3>#${i} : VM Information</h3>`;
                        	vmTable+=`<table border='1'>`;
                        	vmTable+=`<tr><td>Order Raised By</td><td>${reqObj.userDetails.email}</td></tr>`;
                        	vmTable+=`<tr><td>VM Name</td><td>${vm.virtual_machine_name}</td></tr>`;
//		              		vmTable+=`<tr><td>Subscription Provision Type</td><td>${vm.subscription_provision_type}</td></tr>`;
		              		vmTable+=`<tr><td>vCPUS</td><td>${vm.cpus}</td></tr>`;
		              		vmTable+=`<tr><td>Memory</td><td>${(vm.ram/1024)} GB</td></tr>`;
		              		vmTable+=`<tr><td>OS Storage</td><td>${vm.disksize} GB</td></tr>`;
		              		vmTable+=`<tr><td>Subscription</td><td>${((vm.selectedSubscriptionLabel)?vm.selectedSubscriptionLabel:"")}</td></tr>`;
		              		vmTable+=`<tr><td>VM Resource Group</td><td>${vm.deployment_resource_group_name}</td></tr>`;
		              		vmTable+=`<tr><td>Region</td><td>${((vm.selected_network_location_name)?vm.selected_network_location_name:"")}</td></tr>`;
//		              		vmTable+=`<tr><td>Network Resource Group Name</td><td>${vm.network_resource_group_name}</td></tr>`;
		              		vmTable+=`<tr><td>Network Identify</td><td>${config.network_identify_arr[vm.network_identify]}</td></tr>`;
		              		vmTable+=`<tr><td>Virtual Network Name</td><td>${vm.virtual_network_name}</td></tr>`;
//		              		vmTable+=`<tr><td>Subnet Name</td><td>${vm.subnet_name}</td></tr>`;
//		              		vmTable+=`<tr><td>NIC Name</td><td>${vm.nic_name}</td></tr>`;
		              		vmTable+=`<tr><td>Private IP Address</td><td>${((vm.private_ip_address)?vm.private_ip_address:"")}</td></tr>`;
		              		vmTable+=`<tr><td>Managed Disk Name</td><td>${vm.managed_disk_name}</td></tr>`;
	                    	vmTable+=`<tr><td>Managed Disk Host Caching</td><td>${vm.managed_disk_host_caching}</td></tr>`;
	                    	vmTable+=`<tr><td>Managed Disk SKU</td><td>${vm.managed_disk_storage_size}</td></tr>`;
	                    	vmTable+=`<tr><td>Managed Disk Size</td><td>${vm.managed_disk_size}</td></tr>`;
	                    	vmTable+=`<tr><td>Managed Disk Size Storage Account Type</td><td>${vm.managed_disk_size_storage_account_type}</td></tr>`;
		                    vmTable+=`<tr><td>Zone</td><td>${((vm.zone)?vm.zone:"")}</td></tr>`;
		                    vmTable+=`<tr><td>Availability Set Name</td><td>${((vm.availability_set_name)?vm.availability_set_name:"")}</td></tr>`;
			                vmTable+=`<tr><td>Environment</td><td>${vm.environment}</td></tr>`;
//			                vmTable+=`<tr><td>System Type</td><td>${vm.system_type}</td></tr>`;
//			                vmTable+=`<tr><td>Storage Account Name</td><td>${vm.storage_account_name}</td></tr>`;
//			                vmTable+=`<tr><td>Ansible IP</td><td>${vm.selected_ansible_server}</td></tr>`;
			                vmTable+=`<tr><td>Is Cluster</td><td>${(vm.is_cluster?"Yes":"No")}</td></tr>`;
		                    if(vm.is_cluster == 1){ 
	                    		vmTable+=`<tr><td>VM 1 NIC Name 2</td><td>${vm.nic_name2}</td></tr>`;
		                    	vmTable+=`<tr><td>VM 2 Name</td><td>${vm.virtual_machine_name2}</td></tr>`;
//		                    	vmTable+=`<tr><td>VM 2 Subnet Name</td><td>${vm.subnet1_name}</td></tr>`;
//		                    	vmTable+=`<tr><td>VM 2 NIC Name 1</td><td>${vm.nic_name3}</td></tr>`;
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
//		                      	vmTable+=`<tr><td>Gallery Name</td><td>${vm.gallery_name}</td></tr>`;
		                    }  
		                    if(vm.managed_infra_subscription_id){
//		                      	vmTable+=`<tr><td>Managed Infra Subscription ID</td><td>${vm.managed_infra_subscription_id}</td></tr>`;
		                    }
		                    if(vm.shared_image_name){
		                      	vmTable+=`<tr><td>Template Name</td><td>${vm.shared_image_name}</td></tr>`;
		                    }
		                    if(vm.shared_image_version){
//		                      	vmTable+=`<tr><td>Template Version</td><td>${vm.shared_image_version}</td></tr>`;
		                    }
		                    if(vm.backup_resource_group_name){
//		                      	vmTable+=`<tr><td>Backup Resource group</td><td>${vm.backup_resource_group_name}</td></tr>`;
		                    }
		                    if(vm.recovery_vault_name){
//		                      	vmTable+=`<tr><td>Backup Vault Name</td><td>${vm.recovery_vault_name}</td></tr>`;
		                    }
		                    if(vm.backup_policy){
//		                      	vmTable+=`<tr><td>Backup Policy</td><td>${((vm.backup_policy.toLowerCase().indexOf("gold") >= 0)?"GOLD":((vm.backup_policy.toLowerCase().indexOf("silver") >= 0)?"SILVER":((vm.backup_policy.toLowerCase().indexOf("bronze") >= 0)?"BRONZE":vm.backup_policy)))}</td></tr>`;
		                    }
		                    if(vm.db_full_backup){
//		                      	vmTable+=`<tr><td>DB Full Backup Policy</td><td>${vm.db_full_backup}</td></tr>`;
		                    }
		                    if(vm.db_log_backup){
//		                      	vmTable+=`<tr><td>DB Log Backup Policy</td><td>${vm.db_log_backup}</td></tr>`;
		                    }
		                    if(vm.db_backup){
//		                      	vmTable+=`<tr><td>DB Backup Policy</td><td>${vm.db_backup}</td></tr>`;
		                    }
//		                    if(vm.cyberark_usernames){
//		                      	vmTable+=`<tr><td>Cyberark Usernames</td><td>${vm.cyberark_usernames}</td></tr>`;
//		                    }
		                    if(vm.disk_encryption_name){
//		                      	vmTable+=`<tr><td>Disk Encryption Name</td><td>${vm.disk_encryption_name}</td></tr>`;
		                    }
		                    if(vm.disk_encryption_resource_group_name){
//		                      	vmTable+=`<tr><td>Disk Encryption Resource Group Name</td><td>${vm.disk_encryption_resource_group_name}</td></tr>`;
		                    }
		                    vmTable+=`</table>`;
		                    i++;
                    	}
                        
                        mailbody = mailbody.replace("{{HOST_INFO}}", vmTable);
                        mailbody = mailbody.replace("{{REQUESTED_DOMAIN}}", config.FRONTEND_URL.replace("#/",""));
                        
	                    if (emailRows.length > 0) {
	                        let emailsList = [];
	                        for ( var index in emailRows ) {
	                    		  emailsList.push(emailRows[index].email); 
	                    	}
	                        console.log("emailsList --- ",JSON.stringify(emailsList));
	                        mail.mail({subject : subject, messageBody : mailbody,tomail : emailsList.join(","), ccmails : reqObj.userDetails.email});
	                    }else{
	                    	mail.mail({subject : subject, messageBody : mailbody,tomail : reqObj.userDetails.email});
	                    }
	                    callback(null,{"message":"Order Added to Cart Successfully."});
	                	resolve("Done");
	                }
	            });
    		}else{
    			callback(null,{"message":"Order Added to Cart Successfully."});
    		}
    	});
    });
}

function ebsResponse(reqObj,callback) {
    var crypto = require('crypto');
    console.log("reqObj");
    console.log(reqObj);
    console.log("reqObj.query");
    console.log(reqObj.query);
    console.log("reqObj.body");
    console.log(reqObj.body);
    
//    For Failed transaction response
//    {
//      	  BANKTXNID: '',
//      	  CHECKSUMHASH: '0nuR5GgYtcqzbKGLUoWDsojwd59RW622g7ZNldv4QYZrSJPYHEE8im4cBV+BR2BPu+bet9L+s77slr9aaaqryo7VzWQulrzyY1uHRozOTOQ=',
//      	  CURRENCY: 'INR',
//      	  MID: 'Cloud466268762360428',
//      	  ORDERID: '140202_1602071109',
//      	  RESPCODE: '141',
//      	  RESPMSG: 'User has not completed transaction.',
//      	  STATUS: 'TXN_FAILURE',
//      	  TXNAMOUNT: '1.00'
//      	}
//    
//    For Failed transaction response
//    {
//    	  CURRENCY: 'INR',
//    	  GATEWAYNAME: 'WALLET',
//    	  RESPMSG: 'Txn Success',
//    	  BANKNAME: 'WALLET',
//    	  PAYMENTMODE: 'PPI',
//    	  MID: 'Cloud466268762360428',
//    	  RESPCODE: '01',
//    	  TXNID: '20201007111212800110168114151644065',
//    	  TXNAMOUNT: '1.00',
//    	  ORDERID: 140202_1602071109,
//    	  STATUS: 'TXN_SUCCESS',
//    	  BANKTXNID: '145697355524',
//    	  TXNDATE: '2020-10-07 18:57:37.0',
//    	  CHECKSUMHASH: 'kkfkqIbqNzyxwSOKmbEuv8ApdGgyTruw6KwjI2md5or/kBa0cXRJ/onCk4FEy8nPdJAgKSfpFBNQ4rmOwhafgJaCOaj34G5v3mBla+gBkJU='
//    	}
      
    if(typeof reqObj.body != 'undefined' && typeof reqObj.body.MID != 'undefined'){
  		return new Promise(async function(resolve,reject) {
  			let response = reqObj.body;
  			
  			// verify the checksum
  		  	var checksumhash = response.CHECKSUMHASH;
  		  	// delete post_data.CHECKSUMHASH;
  		    var isValidChecksum = helper.paytm_verifychecksum(response, config.PAYTM_MERCHANT_KEY, checksumhash);
  		  	console.log("Checksum Result => ", isValidChecksum, "\n");
  		  	if (isValidChecksum == true) {
//  		  	response = reqObj.body = {
//    		    	  CURRENCY: 'INR',
//    		    	  GATEWAYNAME: 'WALLET',
//    		    	  RESPMSG: 'Txn Success',
//    		    	  BANKNAME: 'WALLET',
//    		    	  PAYMENTMODE: 'PPI',
//    		    	  MID: 'Cloud466268762360428',
//    		    	  RESPCODE: '01',
//    		    	  TXNID: '20201007111212800110168114151644065',
//    		    	  TXNAMOUNT: '1.00',
//    		    	  ORDERID: reqObj.body.ORDERID,
//    		    	  STATUS: 'TXN_SUCCESS',
//    		    	  BANKTXNID: '145697355524',
//    		    	  TXNDATE: '2020-10-07 18:57:37.0',
//    		    	  CHECKSUMHASH: 'kkfkqIbqNzyxwSOKmbEuv8ApdGgyTruw6KwjI2md5or/kBa0cXRJ/onCk4FEy8nPdJAgKSfpFBNQ4rmOwhafgJaCOaj34G5v3mBla+gBkJU='
//    		    	}
//    			
//    			console.log("response");
//    		    console.log(response);
    		    
	            if (response.STATUS == "TXN_SUCCESS") {
	                txn_status = 'success';
	            } else {
	                txn_status = response.RESPMSG;
	            }
	            db.query(`select tr.uid,tr.request_type,c.client_entity_id from c4_transaction_requests as tr
	            inner join c4_clients as c on c.id = tr.clientid
	            where  tr.uid = '${response.ORDERID}' order by tr.uid desc limit 1`,
	            async (error,lasttransaction,fields)=>{
	                if(!!error) {
	                    dbFunc.connectionRelease;
	                    callback(1,{"message":"The operation did not execute as expected. Please raise a ticket to support"});
	                    resolve(error);
	                } else {
	                    dbFunc.connectionRelease;
	                    console.log("lasttransaction");
	                    console.log(lasttransaction);
	                    if (lasttransaction.length > 0) {
                            updaterefdata = {
                                'txn_status' : response.RESPCODE,
                                'txn_msg' : txn_status,
                                'txn_err_msg' : 'NA',
                                'clnt_txn_ref' : response.ORDERID,
                                'tpsl_txn_id' : response.TXNID,
                                'tpsl_bank_cd' : response.STATUS,
                                'txn_amt' : response.TXNAMOUNT,
                                'clnt_rqst_meta' : response.ORDERID,
                                'tpsl_txn_time' : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss"),
                                'tpsl_rfnd_id' : response.TXNID,
                                'bal_amt' : 0,
                                'rqst_token' : '',
                                'hash' : checksumhash,
                                'tp_txn_log' : JSON.stringify(response),
                                'updateddate' : (new Date().getTime() / 1000)
                            };
                            if (response.STATUS == "TXN_SUCCESS") {
                                updaterefdata.tpsl_txn_time = response.TXNDATE;
                                updaterefdata.tpsl_rfnd_id = response.GATEWAYNAME + '-' + response.BANKTXNID;
                                updaterefdata.tpsl_bank_cd = response.BANKTXNID;
                            }
                            console.log("updaterefdata");
                            console.log(updaterefdata);
                            await dbHandler.updateTableData('c4_transaction_requests',{uid:response.ORDERID},updaterefdata,async function(err,result){
                                return PgiResponse(decodeURI(base64.encode(response.ORDERID)),callback);
                            });
	                    }else{
	                        callback(1,{"message":"Invalid transaction."});
	                        resolve({"message":"Invalid transaction."});
	                    }
	                }
	            });
	            // callback(null,{"message":"Payment Successfully."});
	            // resolve({"message":"Payment Successfully."});
	        } else {
	            callback(1,{"message":"Invalid transaction."});
	            resolve({"message":"Invalid transaction."});
	        }
	    });
    }else{
    
	    let key = config.EBS_SKEY;
	    text = reqObj.query.DR;
	    console.log(text);
	    let requestSegments = text.split('/');
	    console.log(requestSegments);
	    let uriseg ='';
	    for (j = 0; j < 20; j ++) {
	        if(typeof requestSegments[j] != 'undefined')
	        uriseg += decodeURI(requestSegments[j]) + '/';
	    }
	    console.log(uriseg);
	    if(uriseg != ''){
	        uriseg = uriseg.substring(0, uriseg.length - 1);
	    }
	    let DR = uriseg.replace(/\s+/g, '+');
	    QueryString = base64.decode (DR);
	    console.log("base64.decode   "+QueryString);
	    decipher = crypto.createDecipheriv("rc4", key, '');
	    QueryString = decipher.update(QueryString, "binary", "utf8");
	    console.log("decrypted "+QueryString);
	    QueryString += decipher.final("utf8");
	    console.log("decrypted final "+QueryString);
	
	    return new Promise(async function(resolve,reject) {
	        QueryString = QueryString.split('&');
	        console.log(QueryString);
	        response = {};
	        for (var val of QueryString) {
	            // console.log(val);
	            val = val.split('=');
	            // console.log(val);
	            response[val[0]] = decodeURI(val[1]);
	        }
	        console.log(response);
	
	        if (response.ResponseCode) {
	        //     // print_r($response);
	        //     // die();
	            if (response.ResponseCode == 0) {
	                txn_status = 'success';
	            } else {
	                txn_status = response.ResponseMessage;
	            }
	            db.query(`select tr.uid,tr.request_type,c.client_entity_id from c4_transaction_requests as tr
	            inner join c4_clients as c on c.id = tr.clientid
	            where  tr.clientid = '${reqObj.query.clientid}' order by tr.uid desc limit 1`,
	            async (error,lasttransaction,fields)=>{
	                if(!!error) {
	                    dbFunc.connectionRelease;
	                    callback(1,{"message":"The operation did not execute as expected. Please raise a ticket to support"});
	                    resolve(error);
	                } else {
	                    dbFunc.connectionRelease;
	                    console.log("lasttransaction");
	                    console.log(lasttransaction);
	                    if (lasttransaction.length > 0) {
	                        if (lasttransaction[0].request_type == 'INVOICE') {
	                            let txnSql = `select uid from c4_transaction_requests 
	                            where request_type='INVOICE' and uid='${response.MerchantRefNo}' and txn_status='' order by uid desc limit 1`;
	                            console.log("txnSql  --- "+txnSql);
	                            db.query(txnSql,
	                            async (error,txninfo,fields)=>{
	                                if(!!error) {
	                                    dbFunc.connectionRelease;
	                                    callback(1,{"message":"The operation did not execute as expected. Please raise a ticket to support",client_entity_id:lasttransaction[0].client_entity_id});
	                                    resolve(error);
	                                } else {
	                                    dbFunc.connectionRelease;
	                                    if (txninfo.length > 0) {
	                                        txn_id = txninfo[0].uid;
	                                        updaterefdata = {
	                                            'txn_status' : response.TransactionID,
	                                            'txn_msg' : txn_status,
	                                            'txn_err_msg' : 'NA',
	                                            'clnt_txn_ref' : response.MerchantRefNo,
	                                            'tpsl_txn_id' : response.PaymentID,
	                                            'tpsl_bank_cd' : response.RequestID,
	                                            'txn_amt' : response.Amount,
	                                            'clnt_rqst_meta' : response.Description,
	                                            'tpsl_txn_time' : response.DateCreated,
	                                            'tpsl_rfnd_id' : response.TransactionID,
	                                            'bal_amt' : 0,
	                                            'hash' : DR,
	                                            'tp_txn_log' : JSON.stringify(response),
	                                            'updateddate' : (new Date().getTime() / 1000)
	                                        };
	                                        console.log("updaterefdata");
	                                        console.log(updaterefdata);
	                                        await dbHandler.updateTableData('c4_transaction_requests',{uid:txn_id},updaterefdata,async function(err,result){
	                                            return PgiResponse(decodeURI(base64.encode(txn_id)),callback);
	                                        });
	                                    }else{
	                                        callback(1,{"message":"Invalid transaction.",client_entity_id:lasttransaction[0].client_entity_id});
	                                        resolve({"message":"Invalid transaction."});
	                                    }
	                                }
	                            });
	                        } else {
	                            updaterefdata = {
	                                'txn_status' : response.TransactionID,
	                                'txn_msg' : txn_status,
	                                'txn_err_msg' : 'NA',
	                                'clnt_txn_ref' : response.MerchantRefNo,
	                                'tpsl_txn_id' : response.PaymentID,
	                                'tpsl_bank_cd' : response.RequestID,
	                                'txn_amt' : response.Amount,
	                                'clnt_rqst_meta' : response.Description,
	                                'tpsl_txn_time' : response.DateCreated,
	                                'tpsl_rfnd_id' : response.TransactionID,
	                                'bal_amt' : 0,
	                                'rqst_token' : '',
	                                'hash' : DR,
	                                'tp_txn_log' : JSON.stringify(response),
	                                'updateddate' : (new Date().getTime() / 1000)
	                            };
	                            console.log("updaterefdata");
	                            console.log(updaterefdata);
	                            await dbHandler.updateTableData('c4_transaction_requests',{uid:response.MerchantRefNo},updaterefdata,async function(err,result){
	                                return PgiResponse(decodeURI(base64.encode(response.MerchantRefNo)),callback);
	                            });
	                        }
	                    }else{
	                        callback(1,{"message":"Invalid transaction."});
	                        resolve({"message":"Invalid transaction."});
	                    }
	                }
	            });
	            // callback(null,{"message":"Payment Successfully."});
	            // resolve({"message":"Payment Successfully."});
	        } else {
	            callback(1,{"message":"Invalid transaction."});
	            resolve({"message":"Invalid transaction."});
	        }
	    });
    }
}

let PgiResponse= async (ebstxnid,callback) => {
    let currentdate = dateFormat(new Date(),"yyyy-mm-dd");

    refid = base64.decode(decodeURI(ebstxnid));
    request_type = '';
    planid = '';
    vmdid = '';
    clientid = '';
    c4transactionid = refid;
    tpid = '';
    tsplTxn_status = '';
    extra = '';
    gateway_ref_id = '';
    gatewaytype = '';
    return new Promise((resolve,reject) => {
        db.query(`select tr.*,c.client_entity_id from c4_transaction_requests as tr
            inner join c4_clients as c on c.id = tr.clientid
        where tr.uid = '${refid}' order by tr.uid desc limit 1`,
        async (error,transactioninfo,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                callback(1,{"message":"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                console.log("transactioninfo");
        	    console.log(transactioninfo);
                if (transactioninfo.length > 0) {
                    request_type = transactioninfo[0].request_type;
                    planid = transactioninfo[0].planid;
                    ref_id = transactioninfo[0].ref_id;
                    clientid = transactioninfo[0].clientid;
                    tsplTxn_status = transactioninfo[0].txn_msg;
                    extra = transactioninfo[0].extra;
                    sub_req_type = transactioninfo[0].request_sub_type;
                    requested_amount = transactioninfo[0].requested_amount;
                    conversion_rate = transactioninfo[0].conversion_rate;
                    currency = transactioninfo[0].currency_code;
                    txn_msg = transactioninfo[0].txn_msg;
                    txn_amt = transactioninfo[0].txn_amt;
                    clnt_txn_ref = transactioninfo[0].clnt_txn_ref;
                    gateway_ref_id = transactioninfo[0].tpsl_txn_id;
                    gatewaytype = transactioninfo[0].gateway;
                    created_by = transactioninfo[0].created_by;
                    
                    
                    
					
                    userInfo = {};
                    if(created_by != 0){
                    	
                    	let user_sql = `SELECT * from c4_client_users
    						where id = '${created_by}'`;
    					console.log('user_sql');
    					console.log(user_sql);
    					userInfo=await new Promise(async function(userResolve, userReject){
    						dbHandler.executeQuery(user_sql,async function(result){
							  userResolve(result[0])
						  })
						})
                    }
//                    console.log('userInfo');
//					console.log(userInfo);
					
					clientSql = `SELECT c.company_name, c.tax_id,c.currency_id,c.address, c.city, c.state, c.country, c.phone, c.email, c.mobile, c4_client_users.clientid, c4_client_users.email as useremail,c4_client_users.mobile as usermobile 
					FROM c4_clients as c 
					INNER JOIN c4_client_users ON c.id = c4_client_users.clientid 
					where c.id= '${clientid}' and c4_client_users.user_role=1 limit 1`;
					clientinfo=await new Promise(async function(clientResolve, clientReject){
						dbHandler.executeQuery(clientSql,async function(result){
							clientResolve(result[0])
					  })
					})
//	                console.log('clientinfo');
//					console.log(clientinfo);

                    subject = 'Cloud4C :: Transaction  Information #'+clnt_txn_ref;
//                    
                    mailbody = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    				<html xmlns="http://www.w3.org/1999/xhtml">
    				<head>
    				<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
    				<title>Cloud4C :: Transaction Information</title>
    				</head>
                        
    				<body>
    				<div style="background-color:#FFFFFF">
    				<table width="80%" >
    				  <tr>
    				    <td><p><img src="${config.OLDAPP_PORTAL_URL}images/pdf_images/cloud4c_logo.png" alt="Ctrl4C Logo" width="193" height="73" /></p>
    				      <p>Dear Customer,</p>
    				    <p>Thank you for using  Cloud4C Services.  </p></td>
    				  </tr>
    				  <tr>
    				    <td><p>Your payment request has been successfully recorded. Please quote your transaction reference number for any
    				      queries relating to this request</p>
    					 <div style=" background-color:#CCCCFF">
    				      <table width="100%" height="77"  style="text-align:right;border: 1px solid black;;">
    				        <tr >
    				          <td width="50%" style="border-bottom: 1px solid;" ><strong>Transaction Reference Number :</strong></td>
    				          <td width="50%" style="border-bottom: 1px solid;">&nbsp;${clnt_txn_ref}</td>
    				        </tr>
    						 <tr >
    				          <td width="50%" style="border-bottom: 1px solid;" ><strong>Gateway Reference Number :</strong></td>
    				          <td width="50%" style="border-bottom: 1px solid;">&nbsp;${gateway_ref_id}</td>
    				        </tr>
    						 <tr >
    				          <td width="50%" style="border-bottom: 1px solid;" ><strong>Payment Gateway  :</strong></td>
    				          <td width="50%" style="border-bottom: 1px solid;">&nbsp;${gatewaytype}</td>
    				        </tr>
    				        <tr>
    				          <td style="border-bottom: 1px solid;"><strong>Transaction Date and Time :</strong></td>
    				          <td style="border-bottom: 1px solid;">&nbsp;${dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")}</td>
    				        </tr>
    				        <tr>
    				          <td style="border-bottom: 1px solid;"><strong>Transaction Type : </strong></td>
    				          <td style="border-bottom: 1px solid;">&nbsp;${request_type} Payment</td>
    				        </tr>
    				        <tr>
    				          <td style="border-bottom: 1px solid;"><strong>Billing Address : </strong></td>
    				          <td style="border-bottom: 1px solid;">&nbsp;${clientinfo.company_name}<br/>${clientinfo.email}<br/>${clientinfo.address}<br/>${clientinfo.city}<br/>${clientinfo.state}<br/>${clientinfo.country}<br/>${ucpEncryptDecrypt.ucpDecryptForDb(clientinfo.usermobile)}</td>
    				        </tr>
    				        <tr>
    				          <td style="border-bottom: 1px solid;"><strong>Amount : </strong></td>
    				          <td style="border-bottom: 1px solid;">&nbsp;${txn_amt}</td>
    				        </tr>
    				        <tr>
    				          <td style="border-bottom: 1px solid;"><strong>Transaction Status : </strong></td>
    				          <td style="border-bottom: 1px solid;">&nbsp;${txn_msg}</td>
    				        </tr>
    				      </table>
    					  </div>
    				    <p>&nbsp;</p></td>
    				  </tr>
    				  <tr>
    				    <td>&nbsp;<br/>
    					Thank You,<br/>
    					<strong>Cloud4C Services Pvt Ltd.</strong><br/>
    					<a href="${config.FRONTEND_URL}" target="_blank">${config.FRONTEND_URL}</a>
    					<br/>This is an auto generated Email. For any quires related to payment contact <a  href="mailto:billing@cloud4c.com">billing@cloud4c.com</a>
    					<br/>
    					Please add noreply@cloud4c.com to your safe sender list to receive all communications from us including invoices. <br/>This email was sent on behalf of <span style="color:green;"><a href="https://www.cloud4c.com" target="_blank"> Cloud4C Services Pvt Ltd.</a></span>
    					</td>
    				  </tr>
    				</table>
    				</div>
    				</body>
    				</html>`;
                    
//                    console.log("mailbody");
//                    console.log(mailbody);
                    mail.mail(subject, mailbody, clientinfo.email);
                    if(clientinfo.email != userInfo.email){
                    	mail.mail(subject, mailbody, userInfo.email);
                    }
                    
                    subject += ' Transaction Type : '+request_type;
                    mailbody += '   Transaction Type : '+ request_type;
                    if(extra != '' && (request_type == 'INVOICE' || request_type == 'DUEINVOICES')){
                    	
                    	invSql = `SELECT group_concat(inv_display_id) as inv_display_ids 
	                    	FROM c4_client_invoices 
	                    	where inv_id in (${extra})`;
                    	inv_result=await new Promise(async function(invResolve, invReject){
    						dbHandler.executeQuery(invSql,async function(result){
    							invResolve(result[0])
    					  })
    					})
//    	                console.log('inv_result');
//    					console.log(inv_result);
        					
                        mailbody += ' Reference ID  : ' + inv_result.inv_display_ids;
                    }else{
                        mailbody += ' Reference ID  : ' + extra;
                    }
                    
//                    console.log("mailbody");
//                    console.log(mailbody);
                	mail.mail(subject, mailbody, config.BILLING_EMAIL_ADDRESS);
                    
                    if (tsplTxn_status != '') {
                        if (txn_msg.toLowerCase() == 'success') {
                            switch (request_type) {
                                case 'CART':
                                    paymentinfo = {
                                        'clientid' : clientid,
                                        'amount' : requested_amount,
                                        'createddate' : (new Date().getTime() / 1000),
                                        'reference_id' : refid,
                                        'desc' : 'Online Payment for Cart',
                                        'trans_type' : 'CART'
                                    };
                                    await dbHandler.insertIntoTable('c4_client_payments',paymentinfo,async function(err,result){})
                                    updateclientfunds({clientid, fund_type:'CLOUD',amount: requested_amount},async function(availblefunds){
                                        console.log("availblefunds - "+availblefunds);
                                        return payFromFunds({body:{clientid,grand_total:requested_amount,cartid:extra}},callback);
                                    });
                                    // redirect('billing/processcart/' . $refid . '/' . $extra);
                                    
                                    break;
                                case 'INVOICE':
                                    updatedata = {
                                        'inv_status' : 'PAID',
                                        'updateddate' : (new Date().getTime() / 1000)
                                    };
                                    await dbHandler.updateTableData('c4_client_invoices',{clientid:clientid,inv_id:extra},updatedata,async function(err,result){
                                        paymentinfo = {
                                            'clientid' : clientid,
                                            'amount' : requested_amount,
                                            'createddate' : (new Date().getTime() / 1000),
                                            'reference_id' : refid,
                                            'userid' : created_by,
                                            'debit_amount' : requested_amount,
                                            'trans_type' : 'INVOICEPAYMENT'
                                        };
                                        await dbHandler.insertIntoTable('c4_client_payments',paymentinfo,async function(err,result){
                                            invtxninfo = {
                                                'invoice_id' : extra,
                                                'paid_amount' : requested_amount,
                                                'txn_id' : gatewaytype + ':' + gateway_ref_id,
                                                'txn_status' : 'Success',
                                                'createddate' : (new Date().getTime() / 1000),
                                                'pay_type' : 'ONLINE',
                                                'comments' : gatewaytype + ':' + gateway_ref_id,
                                                'payment_date' : dateFormat(new Date(),"dd-mm-yyyy"),//date('d-m-Y', (new Date().getTime() / 1000)),
                                                'inv_status' : 'PAID'
                                            };
                                            await dbHandler.insertIntoTable('c4_client_invoice_transactions',invtxninfo,async function(err,result){
                                            	let curlpath = config.OLDAPP_PORTAL_URL+'cronjobs/Invoice/autoreganrateinvoice/'+extra;
                                            	console.log("curlpath");
                                                console.log(curlpath);
                                            	await axios
                                                .get(curlpath)
                                                .then(async body => {
                                                // curl.get(curlpath)
                                                // .then(async ({statusCode, body, headers}) => {
                                                    console.log("curl inv regen data");
                                                    console.log(body.data);
                                                });
                                            	data = {request_type,uid:"","message":"Payment Successfully.",client_entity_id: transactioninfo[0].client_entity_id}
                                                callback(null,data);
                                                resolve(data);
                                            });
                                        })
                                    });

                                    // $invoiceDetails = $this->common->getRow('c4_client_invoices', array(
                                    //     'inv_id' => $extra
                                    // ));
                                    // if ($invoiceDetails) {
                                    //     if ($invoiceDetails->invoice_type == "2C") {
                                    //         $this->ctrl4c->callrestapi('http://2c.ctrl4c.com/ctrl4c/', 'test.php', array(
                                    //             'apicall' => true,
                                    //             'type' => 'INVOICE',
                                    //             'invoice_id' => $invoiceDetails->twoc_invoice_id,
                                    //             'amount' => $requested_amount
                                    //         ), 'GET');
                                    //     }
                                    // }

                                    // need to regenerate invoice
                                    // redirect('billing/myinvoices');
                                    break;
                            }
                        } else {
                            data = {
                                'TXNID' : clnt_txn_ref,
                                'request_type' : request_type
                            };
                            callback(1,Object.assign(data,{"message":"Invalid transaction.",client_entity_id: transactioninfo[0].client_entity_id}));
                            resolve(Object.assign(data,{"message":"Invalid transaction."}));
                        }
                    }else{
                        callback(1,{"message":"Invalid transaction.",client_entity_id: transactioninfo[0].client_entity_id});
                        resolve({"message":"Invalid transaction."});
                    }
                }else{
                    callback(1,{"message":"Invalid transaction."});
                    resolve({"message":"Invalid transaction."});
                }
            }
        });
    });
}

let updateclientfunds= async (reqData,callback) => {
    console.log(reqData);
    let currentdate = dateFormat(new Date(),"yyyy-mm-dd");
    let sql = `select * from c4_client_funds where clientid > ${reqData.clientid} AND fund_type = '${reqData.fund_type}' order by id DESC LIMIT 1`;
    console.log(sql);
    await new Promise(function(resolve, reject) {
        dbHandler.executeQuery(sql,async function(clientcloudfunds){
            console.log("clientcloudfunds");
            console.log(clientcloudfunds);
            if (clientcloudfunds.length > 0) {
                availblefunds = 0;
                availblefunds = clientcloudfunds[0].amount;
                availblefunds = availblefunds + reqData.amount;

                $sql = "UPDATE `c4_client_funds` set `amount`="+availblefunds+", updateddate = "+(new Date().getTime() / 1000)+" where `clientid`=" + reqData.clientid+" and `fund_type`='" + reqData.fund_type+"'";
                dbHandler.executeQuery(sql,async function(result){
                    resolve(availblefunds);
                });
            } else {
                fundsdata = {
                    'clientid' : reqData.clientid,
                    'createddate' : (new Date().getTime() / 1000),
                    'fund_type' : reqData.fund_type,
                    'amount' : reqData.amount
                };
                await dbHandler.insertIntoTable('c4_client_funds',fundsdata,function(err,result){
                    resolve(reqData.amount);
                })
            }
        });
    }).then(function(returnVal){
        callback(returnVal)
    });
};

function saveTxnInfo(reqObj,callback) {
    let formData = reqObj.body;
    console.log(formData);
    console.log(JSON.stringify(formData));
    var frmValues = {
        'clientid': formData.clientid,
        'transaction_type' : "PAYMENT",
        'createddate' : (new Date().getTime() / 1000),
        'ref_id' : 0,
        'requested_amount' : helper.financial( formData.grand_total, 2 ),
        'request_type' : 'CART',
        'planid' : 0,
        'extra' : formData.cartid,
        'request_sub_type' : 'CART',
        'currency_code' : formData.currency,
        created_by : formData.user_id,
        requested_domain : config.API_URL,
        gateway: 'EBS'
      };

    return new Promise((resolve,reject) => {
        db.query(`SELECT ci.* FROM c4_cart_items as ci
        where ci.cartid = '${formData.cartid}' and ci.record_status = 1 order by id asc`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                if (rows.length > 0) {
                    // let ts = {'REQTYPE':'CART',
                    //     'AMOUNT': frmValues.total,
                    //     'CLIENTID': frmValues.clientid,
                    //     'CARTID': frmValues.cartid,
                    //     'CURRENCY': frmValues.currency
                    // };
                    // str = helper.arrayencode(ts);

                    db.query("INSERT INTO c4_transaction_requests SET ?", frmValues ,(error,orderRows,fields)=>{
                        if(error) {
                            dbFunc.connectionRelease;
                            callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                            resolve(error);
                        } else {
                            dbFunc.connectionRelease;
                            console.log(orderRows);
                            let lastInsId = orderRows.insertId;
                            callback(null,{uid: base64.encode (lastInsId.toString().padStart(10, '0')),"message":"Redirecting to Payment Gateway..."});
                            resolve(orderRows);
                        }
                    });
                }else{
                    callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                    resolve({"message":"The operation did not execute as expected. Please raise a ticket to support"});
                }
            }
       });
        
        
    });
}

let payFromFunds= async (reqObj,callback)=>{
    let formData = reqObj.body;
    let cts = (new Date().getTime() / 1000);

    console.log('formData --------' + JSON.stringify(formData));
//    return callback(null,{status:"error", message: "The operation did not execute as expected. Please raise a ticket to support",reqObj});
    
	if(typeof formData.cart_id =='undefined' || formData.cart_id==''){
	      var response={status:"error",message:'Invalid request'}
	      return response;
    }else{
    	formData.cart_id = formData.cart_id; //parseInt(base64.decode (formData.cart_id));
    }
	
    var frmValues = {
        'clientid': formData.clientid,
        'transaction_type' : "PAYMENT",
        'createddate' : (new Date().getTime() / 1000),
        'ref_id' : 0,
        'requested_amount' : helper.financial( formData.grand_total, 2 ),
        'request_type' : 'CART',
        'planid' : 0,
        'extra' : formData.cartid,
        'request_sub_type' : 'CART',
        // 'currency_code' : formData.currency
      };

    return new Promise(async function(resolve,reject) {
    	let cartSql = `SELECT ci.*,c.client_entity_id FROM c4_cart_items as ci 
            inner join c4_clients as c on c.id = ci.clientid
            where ci.approval_status = 1 and ci.record_status = 1 `;
    	// ci.cartid = '${formData.cartid}' and
    	if(typeof formData.cart_id != 'undefined' && formData.cart_id != ''){
    		cartSql +=` and ci.cartid = '${formData.cart_id}' `;
    	}
    	cartSql +=` order by id asc `;
    	console.log("cartSql --- ", cartSql);
//    	return resolve(cartSql);
        db.query(cartSql, async function(error,cartRows,fields){
            if(!!error) {
                dbFunc.connectionRelease;
                callback(1,{"message":"The operation did not execute as expected. Please raise a ticket to support"});
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                if (cartRows.length > 0) {
                    db.query(`SELECT cf.*,c.company_name FROM c4_client_funds as cf
                    inner join c4_clients as c on c.id = cf.clientid
                    where cf.clientid = '${formData.clientid}' order by id asc`,async function(error,fundsRows,fields){
                        if(!!error) {
                            dbFunc.connectionRelease;
                            callback(1,{"message":"The operation did not execute as expected. Please raise a ticket to support",client_entity_id: cartRows[0].client_entity_id});
                            resolve(error);
                        } else {
                            dbFunc.connectionRelease;
                            if (1 || fundsRows.length > 0) {
                                if(1 || fundsRows[0].amount >= frmValues.requested_amount){
                                    
                                    var odrValues = {
                                        'order_number' : helper.getRandomNumber(),
                                        'clientid': formData.clientid,
                                        'payment_type' : "FUNDS",
                                        'order_amount' : frmValues.requested_amount,
                                        'cartid' : formData.cartid,
                                        'createddate' : (new Date().getTime() / 1000),
                                        'paid_by':formData.user_id
                                      };
                                    odrValues.transaction_number = odrValues.order_number;
                                    
                                    db.query("INSERT INTO c4_orders SET ?", odrValues ,async function(error,orderRows,fields){
                                        if(error) {
                                            dbFunc.connectionRelease;
                                            callback(1,{"message":"The operation did not execute as expected. Please raise a ticket to support",client_entity_id: cartRows[0].client_entity_id});
                                            resolve(error);
                                        } else {
                                            dbFunc.connectionRelease;
                                            console.log(orderRows);
                                            let orderId = orderRows.insertId;

                                            let vmCreationResponse = [];
                                            for await (const val of cartRows) {
                                            //await cartRows.forEach(async function(val,key) {
                                                let cart_config = JSON.parse(val.cart_items);
                                                var odrDetailsValues = {
                                                    'order_id' : orderId,
                                                    'copy_type': val.copy_type,
                                                    'order_type' : val.product_type,
                                                    'clientid': formData.clientid,
                                                    'reference_id' : val.id,
                                                    'status':2,
                                                    'createddate' : (new Date().getTime() / 1000),
                                                    'billing_frequency':val.billing_type,
                                                    'mrc_price':val.item_value,
                                                };

                                                let vmCreationValues = {
                                                    'osid' : val.os_template_id,
                                                    'clientid' : formData.clientid,
                                                    'userid' : formData.user_id,
                                                };

                                                if(val.cloudid == 3){
                                                    Object.assign(vmCreationValues, {
                                                        'tech_id' : config.AZURE.tech_id,
                                                        'vdc_id' : config.AZURE.vdc_id,
                                                        'ram' : cart_config.ram,
                                                        'disk' : cart_config.disksize,
                                                        'cpus' : cart_config.cpus
                                                    })
                                                }else if(val.cloudid == 4){
                                                    Object.assign(vmCreationValues, {
                                                        'tech_id' : config.AWS.tech_id,
                                                        'vdc_id' : config.AWS.vdc_id,
                                                        'ram' : cart_config.ram,
                                                        'disk' : cart_config.disksize,
                                                        'cpus' : cart_config.cpus
                                                    })
                                                }else if(val.cloudid == 5){
                                                    Object.assign(vmCreationValues, {
                                                        'tech_id' : config.GCP.tech_id,
                                                        'vdc_id' : config.GCP.vdc_id,
                                                        'ram' : cart_config.ram,
                                                        'disk' : cart_config.disksize,
                                                        'cpus' : cart_config.cpus
                                                    })
                                                }else{
                                                    Object.assign(odrDetailsValues, {
                                                        cartid: formData.cart_id,
                                                        cpu_cost: cart_config.pricing.cpu_cost,
                                                        ram_cost: cart_config.pricing.ram_cost,
                                                        disk_on_cost: cart_config.pricing.disk_on_cost,
                                                        os_cost: cart_config.pricing.osprice,
                                                        base_price: cart_config.pricing.base_price,
                                                        bandwidth_in_cost: cart_config.pricing.bandwidth_in_cost,
                                                        disk_off_cost: cart_config.pricing.disk_off_cost,
                                                        bandwidth_out_cost: cart_config.pricing.bandwidth_out_cost,
                                                        upfront_cost: cart_config.pricing.upfornt_cost,
                                                    });

                                                    Object.assign(vmCreationValues, {
                                                        'tech_id' : cart_config.techid,
                                                        'vdc_id' : cart_config.vdcid,
                                                        'ram' : cart_config.config.ram,
                                                        'disk' : cart_config.config.storage,
                                                        'cpus' : cart_config.config.cpus
                                                    })
                                                }
                                                
                                                odrDetailsValues.configuration = JSON.stringify(vmCreationValues);
                                                delete vmCreationValues.userid;

                                                //   console.log("odrDetailsValues");
                                                //   console.log(odrDetailsValues);
                                                let cntArr = await helper.getArrFromNo(val.items_count);
                                                console.log(cntArr);
                                                for await (const cnt of cntArr) {
                                                    console.log("second for loop................"+cnt);
                                                    odrDetailsValues.quantity = 1;
                                                    vmCreationResponse = await new Promise(async function(innerResolve, innerReject){
                                                        response = await dbHandler.insertIntoTable('c4_order_details',odrDetailsValues,async function(error,orderDetailsId){
                                                        //await db.query("INSERT INTO c4_order_details SET ?", odrDetailsValues ,async(error,orderDetailRow,fields)=>{
                                                            if(error) {
                                                                dbFunc.connectionRelease;
                                                                callback(1,{"message":"The operation did not execute as expected. Please raise a ticket to support",client_entity_id: cartRows[0].client_entity_id});
                                                                innerResolve(error);
                                                                resolve(error);
                                                            } else {
                                                                dbFunc.connectionRelease;
                                                                console.log("orderDetailsId");
                                                                console.log(orderDetailsId);

                                                                vmCreationValues.order_details_id = orderDetailsId;
                                                                vmCreationValues.is_cluster = val.is_cluster;
                                                                vmCreationValues.createddate = (new Date().getTime() / 1000);
                                                                if(val.cloudid == 3){
                                                                    vmCreationValues.host_name = cart_config.virtual_machine_name;
                                                                    vmCreationValues.label_name = cart_config.virtual_machine_name;
                                                                    if(val.is_cluster == 1){
                                                                    	vmCreationValues.cluster_name = cart_config.virtual_machine_name2;
                                                                    }
                                                                }else if(val.cloudid == 4){
                                                                    vmCreationValues.host_name = cart_config.vmName;
                                                                    vmCreationValues.label_name = cart_config.vmName;
                                                                }else if(val.cloudid == 5){
                                                                    vmCreationValues.host_name = cart_config.instanceName;
                                                                    vmCreationValues.label_name = cart_config.instanceName;
                                                                }else{
                                                                    company_name = fundsRows[0].company_name;
                                                                    string = company_name.replace(' ', '');
                                                                    str = string.replace(/[^a-z0-9]/gi,'');
                                                                    str = str.substring(0, 8);
                                                                    vmCreationValues.host_name = str +'_' + orderDetailsId;
                                                                    vmCreationValues.label_name = str +'_' + orderDetailsId;
                                                                }
                                                                vmCreationValues.network_id = val.network_id;
                                                                vmCreationValues.group_id = val.group_id;
                                                                vmCreationValues.cloudid = val.cloudid;
                                                                vmCreationValues.request_obj = val.cart_items;
                                                                console.log("val.cart_items ------------------------- ", val.cart_items);
                                                                vmCreationValues.deployment_template = 'teraform';
                                                                vmCreationValues.created_by = val.userid;
                                                                console.log("vmCreationValues --- ", JSON.stringify(vmCreationValues));
                                                                await db.query("INSERT INTO c4_vm_creation SET ?", vmCreationValues ,async(error,vmCreationRows,fields)=>{
                                                                	dbFunc.connectionRelease;
                                                                	console.log("error ----------------- ");
                                                                	console.log(error);
                                                                    if(error) {
                                                                        callback(1,{"message":"The operation did not execute as expected. Please raise a ticket to support",client_entity_id: cartRows[0].client_entity_id});
                                                                        innerResolve(error);
                                                                        resolve(error);
                                                                    } else {
//                                                                        innerResolve(vmCreationRows);
                                                                        console.log("vmCreationRows");
                                                                        console.log(vmCreationRows);
                                                                        
                                                                        //Update the hosts which are provisioned
                                                                        let updateSql = "update azure_reusing_hostnames set " +
		                                		                    			" provision_status= 1, provision_date= '"+cts+"', " +
		                                		                    			" updated_date= '"+cts+"'" +
		                                		                    			" WHERE host_name = '"+vmCreationValues.host_name+"'";
		                                		        		    	console.log("updateSql --- ", updateSql);
		                                		        		    	await db.query(updateSql, (error,rows,fields)=>{
		                                		        		    		dbFunc.connectionRelease;
		                                		        		            if(!!error) {
		                                		        		            	console.log(error);
		                                		        		            } else {
		                                		        		                console.log(`Updated provision_status to 1`);
		                                		        		                console.log(rows);
		                                		        		            }
		                                		        		    	});
		                                		        		    	vmCreationValues.request_obj = JSON.parse(vmCreationValues.request_obj);
		                                		        		    	vmCreationValues.request_obj.request_ref__id = vmCreationRows.insertId;
                                                                        azureModel.createVmTemplate(vmCreationValues.request_obj,async function(err,vmCreationResult){
                                                                        	console.log(vmCreationResult);
                                                                        	innerResolve(vmCreationResult);
                                                                        	vmCreationUpdateResponse = await dbHandler.updateTableData('c4_vm_creation',{id:vmCreationRows.insertId},{response_obj:JSON.stringify(vmCreationResult),status:((vmCreationResult.success && vmCreationResult.success == 1)?"1":"2")},async function(err,result){
                                                                                console.log("c4_vm_creation data updated");
                                                                            });
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    });
                                                }
                                                dataArr = {
                                            		'isfulfilled':'YES',
                                            		updateddate:(new Date().getTime() / 1000),
                                            		record_status:2,
                                            		paymentid :odrValues.transaction_number
                                        		};
                                                cartUpdateResponse = await dbHandler.updateTableData('c4_cart_items',{id:val.id},dataArr,async function(err,result){
                                                    console.log("c4_cart_items data updateddddddddddddddddddddddddddddddddddddddddddddddddddddddd");
                                                });
                                            }
                                            console.log("Doneeeeee============================================================================");
                                            commonModel.getEmailTemplate({template_key:"VM_SENT_FOR_PROVISION"},async function(error,emailTempRow){
                    		    	    		console.log("emailTempRow --- ",JSON.stringify(emailTempRow));
                    		    	    		console.log("formData.cartList.items --- ", ((formData.cartList && formData.cartList.items)?formData.cartList.items:{}));
                    		    	    		console.log("formData.userDetails --- ",JSON.stringify(formData.userDetails));
                    		    	    		if(formData.cartList.items 
                    		    	    				&& formData.cartList
                    				    				&& formData.cartList.items.length > 0
                    				    				&& formData.userDetails
                    				    				&& emailTempRow.data){
                    			                    let subject = emailTempRow.data.email_subject+ ((formData.cartList.items[0].is_cluster == 0 && formData.cartList.items[0].virtual_machine_name && formData.cartList.items[0].virtual_machine_name.length == 1)?" - "+formData.cartList.items[0].virtual_machine_name[0]:"");
                    		                        let mailbody = emailTempRow.data.email_body;
                    		
                    		                        let vmTable = "";
                    		                        let i= 1;
                    		                        for await (const val of cartRows) {
                                                        let vm = JSON.parse(val.cart_items);
                    		                        	vmTable+=`<h3>#${i} : VM Information</h3>`;
                    		                        	vmTable+=`<table border='1'><tr><td>VM Name</td><td>${vm.virtual_machine_name}</td></tr>`;
//                    				              		vmTable+=`<tr><td>Subscription Provision Type</td><td>${vm.subscription_provision_type}</td></tr>`;
                    				              		vmTable+=`<tr><td>vCPUS</td><td>${vm.cpus}</td></tr>`;
                    				              		vmTable+=`<tr><td>Memory</td><td>${(vm.ram/1024)} GB</td></tr>`;
                    				              		vmTable+=`<tr><td>OS Storage</td><td>${vm.disksize} GB</td></tr>`;
                    				              		vmTable+=`<tr><td>Subscription</td><td>${((vm.selectedSubscriptionLabel)?vm.selectedSubscriptionLabel:"")}</td></tr>`;
                    				              		vmTable+=`<tr><td>VM Resource Group</td><td>${vm.deployment_resource_group_name}</td></tr>`;
                    				              		vmTable+=`<tr><td>Region</td><td>${((vm.selected_network_location_name)?vm.selected_network_location_name:"")}</td></tr>`;
//                    				              		vmTable+=`<tr><td>Network Resource Group Name</td><td>${vm.network_resource_group_name}</td></tr>`;
                    				              		vmTable+=`<tr><td>Network Identify</td><td>${config.network_identify_arr[vm.network_identify]}</td></tr>`;
                    				              		vmTable+=`<tr><td>Virtual Network Name</td><td>${vm.virtual_network_name}</td></tr>`;
//                    				              		vmTable+=`<tr><td>Subnet Name</td><td>${vm.subnet_name}</td></tr>`;
//                    				              		vmTable+=`<tr><td>NIC Name</td><td>${vm.nic_name}</td></tr>`;
                    				              		vmTable+=`<tr><td>Private IP Address</td><td>${((vm.private_ip_address)?vm.private_ip_address:"")}</td></tr>`;
                    				              		vmTable+=`<tr><td>Managed Disk Name</td><td>${vm.managed_disk_name}</td></tr>`;
                    			                    	vmTable+=`<tr><td>Managed Disk Host Caching</td><td>${vm.managed_disk_host_caching}</td></tr>`;
                    			                    	vmTable+=`<tr><td>Managed Disk SKU</td><td>${vm.managed_disk_storage_size}</td></tr>`;
                    			                    	vmTable+=`<tr><td>Managed Disk Size</td><td>${vm.managed_disk_size}</td></tr>`;
                    			                    	vmTable+=`<tr><td>Managed Disk Size Storage Account Type</td><td>${vm.managed_disk_size_storage_account_type}</td></tr>`;
                    				                    vmTable+=`<tr><td>Zone</td><td>${((vm.zone)?vm.zone:"")}</td></tr>`;
                    				                    vmTable+=`<tr><td>Availability Set Name</td><td>${((vm.availability_set_name)?vm.availability_set_name:"")}</td></tr>`;
                    					                vmTable+=`<tr><td>Environment</td><td>${vm.environment}</td></tr>`;
//                    					                vmTable+=`<tr><td>System Type</td><td>${vm.system_type}</td></tr>`;
//                    					                vmTable+=`<tr><td>Storage Account Name</td><td>${vm.storage_account_name}</td></tr>`;
//                    					                vmTable+=`<tr><td>Ansible IP</td><td>${vm.selected_ansible_server}</td></tr>`;
                    					                vmTable+=`<tr><td>Is Cluster</td><td>${(vm.is_cluster?"Yes":"No")}</td></tr>`;
                    				                    if(vm.is_cluster == 1){ 
                    			                    		vmTable+=`<tr><td>VM 1 NIC Name 2</td><td>${vm.nic_name2}</td></tr>`;
                    				                    	vmTable+=`<tr><td>VM 2 Name</td><td>${vm.virtual_machine_name2}</td></tr>`;
//                    				                    	vmTable+=`<tr><td>VM 2 Subnet Name</td><td>${vm.subnet1_name}</td></tr>`;
//                    				                    	vmTable+=`<tr><td>VM 2 NIC Name 1</td><td>${vm.nic_name3}</td></tr>`;
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
//                    				                      	vmTable+=`<tr><td>Gallery Name</td><td>${vm.gallery_name}</td></tr>`;
                    				                    }  
                    				                    if(vm.managed_infra_subscription_id){
//                    				                      	vmTable+=`<tr><td>Managed Infra Subscription ID</td><td>${vm.managed_infra_subscription_id}</td></tr>`;
                    				                    }
                    				                    if(vm.shared_image_name){
                    				                      	vmTable+=`<tr><td>Template Name</td><td>${vm.shared_image_name}</td></tr>`;
                    				                    }
                    				                    if(vm.shared_image_version){
//                    				                      	vmTable+=`<tr><td>Template Version</td><td>${vm.shared_image_version}</td></tr>`;
                    				                    }
                    				                    if(vm.backup_resource_group_name){
//                    				                      	vmTable+=`<tr><td>Backup Resource group</td><td>${vm.backup_resource_group_name}</td></tr>`;
                    				                    }
                    				                    if(vm.recovery_vault_name){
//                    				                      	vmTable+=`<tr><td>Backup Vault Name</td><td>${vm.recovery_vault_name}</td></tr>`;
                    				                    }
                    				                    if(vm.backup_policy){
//                    				                      	vmTable+=`<tr><td>Backup Policy</td><td>${((vm.backup_policy.toLowerCase().indexOf("gold") >= 0)?"GOLD":((vm.backup_policy.toLowerCase().indexOf("silver") >= 0)?"SILVER":((vm.backup_policy.toLowerCase().indexOf("bronze") >= 0)?"BRONZE":vm.backup_policy)))}</td></tr>`;
                    				                    }
                    				                    if(vm.db_full_backup){
//                    				                      	vmTable+=`<tr><td>DB Full Backup Policy</td><td>${vm.db_full_backup}</td></tr>`;
                    				                    }
                    				                    if(vm.db_log_backup){
//                    				                      	vmTable+=`<tr><td>DB Log Backup Policy</td><td>${vm.db_log_backup}</td></tr>`;
                    				                    }
                    				                    if(vm.db_backup){
//                    				                      	vmTable+=`<tr><td>DB Backup Policy</td><td>${vm.db_backup}</td></tr>`;
                    				                    }
//                    				                    if(vm.cyberark_usernames){
//                    				                      	vmTable+=`<tr><td>Cyberark Usernames</td><td>${vm.cyberark_usernames}</td></tr>`;
//                    				                    }
                    				                    if(vm.disk_encryption_name){
//                    				                      	vmTable+=`<tr><td>Disk Encryption Name</td><td>${vm.disk_encryption_name}</td></tr>`;
                    				                    }
                    				                    if(vm.disk_encryption_resource_group_name){
//                    				                      	vmTable+=`<tr><td>Disk Encryption Resource Group Name</td><td>${vm.disk_encryption_resource_group_name}</td></tr>`;
                    				                    }
                    				                    vmTable+=`</table>`;
                    				                    i++;
                    		                    	}
                    		                        mailbody = mailbody.replace("{{HOST_INFO}}", vmTable);
                    		                        
                    		                        mail.mail({subject : subject, messageBody : mailbody,tomail : formData.cartList.items[0].order_raised_by, ccmails : formData.userDetails.email});
                    		                        callback(null,{request_type:"CART",uid: odrValues.order_number,"message":"Order created successfully",client_entity_id: cartRows[0].client_entity_id, vmCreationResponse});
                                                    resolve(orderRows);
                    		    	    		}else{
                    		    	    			callback(null,{request_type:"CART",uid: odrValues.order_number,"message":"Order created successfully",client_entity_id: cartRows[0].client_entity_id, vmCreationResponse});
                                                    resolve(orderRows);
                    		    	    		}
                    		    	    	});
                                        }
                                    });
                                }else{
                                    callback(1,{"message":"Low funds, kindly add before proceeeding further.",client_entity_id: cartRows[0].client_entity_id});
                                    resolve({"message":"Low funds, kindly add before proceeeding further."});
                                }
                            }else{
                                callback(1,{"message":"The operation did not execute as expected. Please raise a ticket to support",client_entity_id: cartRows[0].client_entity_id});
                                resolve({"message":"The operation did not execute as expected. Please raise a ticket to support"});
                            }
                        }
                    });
                }else{
                    callback(1,{"message":"The operation did not execute as expected. Please raise a ticket to support"});
                    resolve({"message":"The operation did not execute as expected. Please raise a ticket to support"});
                }
            }
       });
    });
}

async function getApprovalPendingCartList(reqBody) {
	console.log("reqBody ---- ", reqBody);
	let {my_reportees, manager_resource_groups, resource_groups, is_super_admin, subscription_resource_group_combo} = reqBody,
    conditions = [], total_records,
     conditions_resource = '',
    page_num = reqBody.page_num || 1;
	
     page_num = `${(page_num-1) * 20}`;
    console.log('manager_resource_groups---------------', manager_resource_groups);
    console.log('my_reportees---------------', my_reportees);
    console.log("resource_groups --- ", resource_groups);
    // if (typeof manager_resource_groups !== 'undefined') {
    //     console.log('if---');
    //     conditions.push(`ci.resourceGroup IN (${manager_resource_groups})`)
    // }

//    if (typeof my_reportees !== 'undefined' && typeof manager_resource_groups !== 'undefined') {
//        // conditions.push(`ci.userid IN (${my_reportees})`);
//      conditions_resource +=` and (ci.userid IN (${my_reportees}) OR  ci.resourceGroup IN (${manager_resource_groups}))`;
//    }
//    if (typeof resource_groups !== 'undefined') {
//        conditions.push(`ci.resourceGroup IN (${resource_groups})`)
//    }
    if(typeof reqBody.approval_status != 'undefined' && reqBody.approval_status != '' && reqBody.approval_status != 'ALL'){
    	if(reqBody.approval_status == 1){
    		conditions.push(`ci.record_status = 1`);
    		conditions.push(`ci.approval_status = 0`);
    	}else if(reqBody.approval_status == 0){
    		conditions.push(`ci.record_status = 0`);
    	}else if(reqBody.approval_status == 3){
    		conditions.push(`ci.record_status = 1`);
    		conditions.push(`ci.approval_status = 1`);
    	}else if(reqBody.approval_status == 2){
    		conditions.push(`ci.record_status = 2`);
    	}
    }else{
    	conditions.push(`ci.record_status in (0,1,2)`);
    }
    if(typeof reqBody.searchSubscription != 'undefined' && reqBody.searchSubscription != ''){
    	conditions.push(`ci.subscription = '${reqBody.searchSubscription}'`);
    }
    if(typeof reqBody.searchResourceGroupName != 'undefined' && reqBody.searchResourceGroupName != ''){
    	conditions.push(`ci.resourceGroup = '${reqBody.searchResourceGroupName}'`);
    }else if (is_super_admin != '1' && typeof subscription_resource_group_combo !== 'undefined' && subscription_resource_group_combo.length > 0 ) {
    	let cond = [];
    	for await (const item of subscription_resource_group_combo){
    		cond.push(` (ci.subscription = '${item.split("@$")[0]}' and ci.resourceGroup = '${item.split("@$")[1]}')`);
    	} 
    	if(cond.length > 0){
    		conditions.push("("+cond.join(" or ")+")")
    	}
    }
    if(typeof reqBody.usersList != 'undefined' && reqBody.usersList.length > 0 && reqBody.usersList[0].value.split("@$")[0] != ''){
    	conditions.push(`ci.userid = '${reqBody.usersList[0].value.split("@$")[0]}' `);
	}
    
    try {

    total_records = await dbHandler.executeQueryv2(`SELECT COUNT(ci.id) as total_records
    FROM c4_cart_items as ci 
    inner join c4_clients as c on c.id = ci.clientid
    left join c4_client_users as cu on cu.id = ci.userid
    left join c4_os_templates as os on (os.id = ci.os_template_id and ci.cloudid in (1,2))
    left join other_cloud_os_templates as oos on (oos.id = ci.os_template_id and ci.cloudid = '${config.AZURE.cloudid}')
    left join aws_images as ai on (ai.id = ci.os_template_id and ci.cloudid = '${config.AWS.cloudid}')
    left join c4_gcp_images as gi on (gi.id = ci.os_template_id and ci.cloudid = '${config.GCP.cloudid}')
    where ${conditions.join(' AND ')}  ${conditions_resource}`);//ci.record_status in (0,1,2)
    total_records = total_records[0].total_records;
    console.log(total_records, 'total_records -----------------')
    }
    catch(e) {
        total_records = 0;
    }

    return new Promise((resolve,reject) => {
        let sql = `SELECT ci.*,
        case 
            when os.template_name <> '' 
            then os.template_name 
            when ai.name <> '' 
            then ai.name 
            when gi.image_name <> '' 
            then gi.image_name 
            else oos.name 
        end as 'template_name',
        cu.email as order_raised_by,
        c.currency_id, c.currency_code
        FROM c4_cart_items as ci 
        inner join c4_clients as c on c.id = ci.clientid
		left join c4_client_users as cu on cu.id = ci.userid
        left join c4_os_templates as os on (os.id = ci.os_template_id and ci.cloudid in (1,2))
        left join other_cloud_os_templates as oos on (oos.id = ci.os_template_id and ci.cloudid = '${config.AZURE.cloudid}')
        left join aws_images as ai on (ai.id = ci.os_template_id and ci.cloudid = '${config.AWS.cloudid}')
        left join c4_gcp_images as gi on (gi.id = ci.os_template_id and ci.cloudid = '${config.GCP.cloudid}')
        where ${conditions.join(' AND ')} ${conditions_resource} order by id desc limit ${page_num},20`;// ci.record_status in (0,1,2)
        console.log('-----------------=',sql);
        dbHandler.executeQuery(sql,async function(data){
            //console.log("data");
            //console.log(data);
            let cart_json = {}, taxData;
            taxData = {currency:((data[0] && data[0].currency_code)?data[0].currency_code:""),total:0,tax_percent:0,tax_amount:0,grand_total:0};

             data = data.map(rec => {
                let cart_config = JSON.parse(rec.cart_items);

                if(rec['cloudid'] == 1 ||rec['cloudid'] == 2){
                    cart_config.config.ram = (cart_config.config.ram / 1024);
                }else{
                   cart_config.ram = (cart_config.ram / 1024);
                }

                if (!cart_json[rec.cartid]) {
                    cart_json[rec.cartid] = rec;
                    cart_json[rec.cartid].cartids = [];
                    cart_json[rec.cartid].virtual_machine_name = [];
                    cart_json[rec.cartid].virtual_machine_name2 = [];
                    cart_json[rec.cartid].cart_config = [];
                }

                cart_json[rec.cartid].cartids.push(rec.id)
                cart_json[rec.cartid].virtual_machine_name.push(cart_config.virtual_machine_name);
                if (cart_json[rec.cartid].virtual_machine_name2) {
                    cart_json[rec.cartid].virtual_machine_name2.push(cart_config.virtual_machine_name2)
                }
                cart_json[rec.cartid].cart_config.push(cart_config)
                    
                return rec;
            })
            data = Object.values(cart_json);
            
            let levelwise_users_list = {};
            let levelwise_users_ids = {};
            let levels = [];
            let i =0;
            for await (const val of data) {
        		await new Promise(async function(innerResolve, innerReject){
    	    		let sql = `SELECT al.id, al.cart_id, al.approval_status, al.approval_matrix_level, cu.email as requested_email, cu1.email as updated_email, 
    	    			from_unixtime(al.created_date, '%Y-%m-%d %H:%i:%s' ) as requested_date, from_unixtime(al.updated_date, '%Y-%m-%d %H:%i:%s' ) as updated_date,
    	    			bu.bu_name, am.bu_id
    	    			FROM azure_approval_logs as al
    	    			inner join azure_approval_matrix as am on (am.approval_matrix_level = al.approval_matrix_level and am.record_status = 1)
    	    			inner join bu_info as bu on bu.id = am.bu_id
    	    			inner join c4_client_users as cu on cu.id = al.created_by
    	    			left join c4_client_users as cu1 on cu1.id = al.updated_by
        		        where al.cart_id = '${val.id}' order by al.id asc`;
    	    		//console.log(sql);
    		        await db.query(sql,async (error,logRows,fields)=>{
//    		        	console.log("logRows --- ", logRows);
    		            if(!!error) {
    		                dbFunc.connectionRelease;
    		                console.log(error);
    		                i++;
    		                innerResolve(error);
    		            } else {
    		                dbFunc.connectionRelease;
    		                data[i].logs = logRows;
    		                
    		                let logIndex = 0;
    		                /*for await (const logVal of logRows) {
    		            		await new Promise(async function(levelUsersResolve, levelUsersReject){
    		            			if(levels.indexOf(logVal.approval_matrix_level) < 0){
//    		            				console.log("levelUsersResolve ifff");
		    		    	    		let sql = `SELECT am.approval_matrix_level, amu.user_id, cu.email
		    		    	    			FROM azure_approval_matrix as am
		    		    	    			inner join azure_approval_matrix_users as amu on amu.approval_matrix_id = am.id
		    		    	    			inner join c4_client_users as cu on cu.id = amu.user_id
		    		        		        where am.approval_matrix_level = '${logVal.approval_matrix_level}' order by cu.email asc`;
		    		    	    		// console.log(sql);
		    		    		        await db.query(sql,async (error,levelUsersRows,fields)=>{
//		    		    		        	console.log("levelUsersRows --- ", levelUsersRows);
		    		    		            if(!!error) {
		    		    		                dbFunc.connectionRelease;
		    		    		                //console.log(error);
		    		    		                logIndex++;
		    		    		                levelUsersResolve(error);
		    		    		            } else {
		    		    		                dbFunc.connectionRelease;
		    		    		                
		    		    		                data[i].logs[logIndex].levelwise_users_list = levelUsersRows;
		    		    		                levelwise_users_list[logVal.approval_matrix_level] = levelUsersRows;
		    		    		                let users_ids = [];
		    		    		                for await (const levelUsersRow of levelUsersRows) {
		    		    		                	users_ids.push(levelUsersRow.user_id);
		    		    		                }
		    		    		                
		    		    		                data[i].logs[logIndex].levelwise_users_ids = users_ids;
		    		    		                levelwise_users_ids[logVal.approval_matrix_level] = users_ids;
		    		    		                
		    		    		                levels.push(logVal.approval_matrix_level);
		    		    		                
		    		    		                logIndex++;
		    		    		                levelUsersResolve(levelUsersRows);
		    		    		            }
		    		    		        });
    		            			}else{
//    		            				console.log("levelUsersResolve elseeee");
    		            				data[i].logs[logIndex].levelwise_users_list = levelwise_users_list[logVal.approval_matrix_level];
    		            				data[i].logs[logIndex].levelwise_users_ids = levelwise_users_ids[logVal.approval_matrix_level];
    		            				
    		            				logIndex++;
    		            				levelUsersResolve([]);
    		            			}
	    		        		});
    		                }*/
    		                i++;
    		                innerResolve(logRows);
    		            }
    		        });
        		});
            }
            
            if(data.length > 0){
                taxData.total = helper.financial( taxData.total, 2)
                taxData.tax_percent = helper.calculateTax({amount:0,currency_id:data[0].currency_id,get_tax:'percent'});
                taxData.tax_amount = helper.calculateTax({amount:taxData.total,currency_id:data[0].currency_id,get_tax:'amount'});
                taxData.grand_total = helper.financial( parseFloat(taxData.total) + parseFloat(taxData.tax_amount), 2);
            }
            let returnData = {items:data,taxData:taxData, total_records}
            resolve(returnData);
        });
    });
}

async function getApprovalPendingVmOpsList(reqBody) {
	let {my_reportees, resource_groups, user_id, page_num = 1, is_super_admin, subscription_resource_group_combo} = reqBody,
    conditions = [];

   page_num = `${((page_num-1) * 20)-(page_num-1)}`;

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
    
    console.log('subscription_resource_group_combo ---- ', subscription_resource_group_combo);
    if (is_super_admin != '1' && typeof subscription_resource_group_combo !== 'undefined' && subscription_resource_group_combo.length > 0 ) {
    	let cond = [];
    	for await (const item of subscription_resource_group_combo){
    		cond.push(` (vms.subscriptionId = '${item.split("@$")[0]}' and vms.resourceGroup = '${item.split("@$")[1]}')`);
    	} 
    	if(cond.length > 0){
    		conditions.push("("+cond.join(" or ")+")")
    	}
    }
    console.log('conditions ---- ', conditions);

    // if (typeof my_reportees !== 'undefined') {
    //     conditions.push(`vor.created_by IN (${my_reportees})`);
    // }
    
    if (!conditions.length) {
        conditions.push('1');
    }
    
    return new Promise(async (resolve,reject) => {

    	let total_records = `SELECT COUNT(vor.id) as total_records
            FROM azure_vm_ops_requests as vor 
            inner join azure_vms as vms on vms.vm_detail_id=vor.vm_id
    		inner join c4_vm_details as vm on vm.id = vor.vm_id
    		inner join c4_client_users as cu on cu.id = vor.created_by
            where ${conditions.join(' AND ')}`,
            sql = `SELECT vor.*,
            vm.host_name,
            cu.email as order_raised_by,
            LOWER(vms.resourceGroup) as resourceGroup, vms.subscriptionId
            FROM azure_vm_ops_requests as vor 
            inner join azure_vms as vms on vms.vm_detail_id=vor.vm_id
    		inner join c4_vm_details as vm on vm.id = vor.vm_id
    		inner join c4_client_users as cu on cu.id = vor.created_by
            where ${conditions.join(' AND ')}`;
            
        if(typeof reqBody.approval_status !='undefined' && reqBody.approval_status !=''
          && reqBody.approval_status !='ALL'){
            sql +=` and approval_status = '${reqBody.approval_status}' `;
            total_records += ` and approval_status = '${reqBody.approval_status}' `;
        }
        if(typeof reqBody.vm_name !='undefined' && reqBody.vm_name !=''){
        	reqBody.vm_name = encodeURIComponent(reqBody.vm_name);
            sql +=` and vm.host_name like '%${reqBody.vm_name}%' `;
            total_records += ` and vm.host_name like '%${reqBody.vm_name}%' `;
        }
        sql +=` group by vor.id order by vor.id desc`;
       
        total_records = await dbHandler.executeQueryv2(total_records);
        total_records = ((total_records || [])[0] || {}).total_records || 0;

        sql += ` limit ${page_num}, 20`;
        console.log('SQL =====getApprovalPendingVmOpsList',sql);
        dbHandler.executeQuery(sql,async function(data){
            //console.log("data");
            //console.log(data);
            let levelwise_users_list = {};
            let levelwise_users_ids = {};
            let levels = [];
            let i =0;
            for await (const val of data) {
            	if(data[i].response_obj){
            		data[i].response_obj = JSON.parse(data[i].response_obj);
            	}
        		await new Promise(async function(innerResolve, innerReject){
    	    		let sql = `SELECT al.id, al.request_id, al.approval_status, al.approval_matrix_level, cu.email as requested_email, cu1.email as updated_email, 
    	    			from_unixtime(al.created_date, '%Y-%m-%d %H:%i:%s' ) as requested_date, from_unixtime(al.updated_date, '%Y-%m-%d %H:%i:%s' ) as updated_date,
    	    			bu.bu_name, am.bu_id
    	    			FROM azure_vm_ops_approval_logs as al
    	    			inner join azure_approval_matrix as am on (am.approval_matrix_level = al.approval_matrix_level and am.record_status = 1)
    	    			inner join bu_info as bu on bu.id = am.bu_id
    	    			inner join c4_client_users as cu on cu.id = al.created_by
    	    			left join c4_client_users as cu1 on cu1.id = al.updated_by
        		        where al.request_id = '${val.id}' order by al.id asc`;
    	    		
    		        await db.query(sql,async (error,logRows,fields)=>{
//    		        	console.log("logRows --- ", logRows);
    		            if(!!error) {
    		                dbFunc.connectionRelease;
    		                console.log(error);
    		                i++;
    		                innerResolve(error);
    		            } else {
    		                dbFunc.connectionRelease;
    		                data[i].logs = logRows;
    		                
    		                let logIndex = 0;
    		                for await (const logVal of logRows) {
    		            		await new Promise(async function(levelUsersResolve, levelUsersReject){
    		            			if(levels.indexOf(logVal.approval_matrix_level) < 0){
//    		            				console.log("levelUsersResolve ifff");
		    		    	    		let sql = `SELECT am.approval_matrix_level, amu.user_id, cu.email
		    		    	    			FROM azure_approval_matrix as am
		    		    	    			inner join azure_approval_matrix_users as amu on amu.approval_matrix_id = am.id
		    		    	    			inner join c4_client_users as cu on cu.id = amu.user_id
		    		        		        where am.approval_matrix_level = '${logVal.approval_matrix_level}' order by cu.email asc`;
		    		    	    		
		    		    		        await db.query(sql,async (error,levelUsersRows,fields)=>{
//		    		    		        	console.log("levelUsersRows --- ", levelUsersRows);
		    		    		            if(!!error) {
		    		    		                dbFunc.connectionRelease;
		    		    		                console.log(error);
		    		    		                logIndex++;
		    		    		                levelUsersResolve(error);
		    		    		            } else {
		    		    		                dbFunc.connectionRelease;
		    		    		                
		    		    		                data[i].logs[logIndex].levelwise_users_list = levelUsersRows;
		    		    		                levelwise_users_list[logVal.approval_matrix_level] = levelUsersRows;
		    		    		                let users_ids = [];
		    		    		                for await (const levelUsersRow of levelUsersRows) {
		    		    		                	users_ids.push(levelUsersRow.user_id);
		    		    		                }
		    		    		                
		    		    		                data[i].logs[logIndex].levelwise_users_ids = users_ids;
		    		    		                levelwise_users_ids[logVal.approval_matrix_level] = users_ids;
		    		    		                
		    		    		                levels.push(logVal.approval_matrix_level);
		    		    		                
		    		    		                logIndex++;
		    		    		                levelUsersResolve(levelUsersRows);
		    		    		            }
		    		    		        });
    		            			}else{
//    		            				console.log("levelUsersResolve elseeee");
    		            				data[i].logs[logIndex].levelwise_users_list = levelwise_users_list[logVal.approval_matrix_level];
    		            				data[i].logs[logIndex].levelwise_users_ids = levelwise_users_ids[logVal.approval_matrix_level];
    		            				
    		            				logIndex++;
    		            				levelUsersResolve([]);
    		            			}
	    		        		});
    		                }
    		                i++;
    		                innerResolve(logRows);
    		            }
    		        });
        		});
            }
            
            let returnData = {items:data, total_records}
            resolve(returnData);
        });
    });
}

async function getJenkinsBuildInformation(reqBody) {
	console.log("reqBody --- ", reqBody);
 let {job_name, page_num = 1, is_super_admin, skip_resource_grp, rbac_matches} = reqBody,
		start, promises,	resource_group_condition;
	
	rbac_matches = Object.entries(rbac_matches).map(([subscription_id,resource_group]) => {
   return `(subscription_id=${subscription_id} AND resource_group IN (${resource_group.join(',')}))`
	})
	resource_group_condition	= is_super_admin ||  skip_resource_grp  ? '': ` AND (${rbac_matches.join(' OR ')})`;
	console.log("resource_group_condition --- ", resource_group_condition);

 job_name = (job_name || '').toLowerCase();
 start = ((page_num-1) * 20);
	
 promises = await Promise.all([
  dbHandler.executeQueryv2(`SELECT count(id) as total_records FROM c4_azure_jenkin_build_info where LOWER(job_name)=:job_name${resource_group_condition}`, {job_name}),
  dbHandler.executeQueryv2(`SELECT * FROM c4_azure_jenkin_build_info where LOWER(job_name)=:job_name${resource_group_condition} ORDER BY build_id desc LIMIT ${start}, 20`, {job_name})
 ]);

 return {data: promises[1], lastIndex: ((promises[0] || [])[0] || {}).total_records || 0}  
}

function getCartList(reqBody) {
	console.log("reqBody --- ", reqBody);
	if(typeof reqBody.cart_id =='undefined' || reqBody.cart_id==''){
	      var response={status:"error",message:'Invalid request'}
	      return response;
    }else{
    	reqBody.cart_id = reqBody.cart_id;//parseInt(base64.decode (reqBody.cart_id));
    }
	console.log("reqBody --- ", reqBody);
    return new Promise((resolve,reject) => {
        let sql = `SELECT ci.*,
        case 
            when os.template_name <> '' 
            then os.template_name 
            when ai.name <> '' 
            then ai.name 
            when gi.image_name <> '' 
            then gi.image_name 
            else oos.name 
        end as 'template_name',
        c.currency_id, c.currency_code,
        cu.email as order_raised_by
        FROM c4_cart_items as ci 
        inner join c4_client_users as cu on cu.id = ci.userid
        inner join c4_clients as c on c.id = ci.clientid
        left join c4_os_templates as os on (os.id = ci.os_template_id and ci.cloudid in (1,2))
        left join other_cloud_os_templates as oos on (oos.id = ci.os_template_id and ci.cloudid = '${config.AZURE.cloudid}')
        left join aws_images as ai on (ai.id = ci.os_template_id and ci.cloudid = '${config.AWS.cloudid}')
        left join c4_gcp_images as gi on (gi.id = ci.os_template_id and ci.cloudid = '${config.GCP.cloudid}')
        where ci.record_status = 1 and ci.approval_status = 1 `;
        sql +=` and ci.cartid = '${reqBody.cart_id}' `;
        sql +=` order by id asc `;
        console.log(sql);
        dbHandler.executeQuery(sql,async function(data){
//            console.log("data");
//            console.log(data);
            let cart_json = {}, 
              taxData = {currency:((data[0] && data[0].currency_code)?data[0].currency_code:""),total:0,tax_percent:0,tax_amount:0,grand_total:0};

            data = data.map(rec => {
                let cart_config = JSON.parse(rec.cart_items);

                if(rec['cloudid'] == 1 ||rec['cloudid'] == 2){
                    cart_config.config.ram = (cart_config.config.ram / 1024);
                }else{
                cart_config.ram = (cart_config.ram / 1024);
                }

                if (!cart_json[rec.cartid]) {
                    cart_json[rec.cartid] = rec;
                    cart_json[rec.cartid].cartids = [];
                    cart_json[rec.cartid].virtual_machine_name = [];
                    cart_json[rec.cartid].virtual_machine_name2 = [];
                    cart_json[rec.cartid].cart_config = [];
                }
                cart_json[rec.cartid].order_raised_by = rec.order_raised_by;
                cart_json[rec.cartid].cartids.push(rec.id)
                cart_json[rec.cartid].virtual_machine_name.push(cart_config.virtual_machine_name);
                if (cart_json[rec.cartid].virtual_machine_name2) {
                    cart_json[rec.cartid].virtual_machine_name2.push(cart_config.virtual_machine_name2)
                }
                cart_json[rec.cartid].cart_config.push(cart_config)
                    
                return rec;
            })
            data = Object.values(cart_json);

            let returnData = {items:data}
//            console.log("returnData --- ",returnData);
            resolve(returnData);
        });
    });
}

function getTxnSuccessData(txnId) {
    return new Promise((resolve,reject) => {
//        let sql = `SELECT o.cartid FROM c4_orders as o
//        where o.transaction_number = '${txnId}' and o.status = 1 order by id asc`;
        let sql = `SELECT ci.paymentid FROM c4_cart_items as ci 
            where ci.paymentid = '${txnId}' and ci.record_status = 2 and ci.approval_status = 1 order by id asc`;
        console.log(sql);
        db.query(sql,(error,orderRows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                console.log("orderRows");
                console.log(orderRows);
                if(orderRows.length > 0){
                    let datasql = `SELECT ci.*,
                    c.currency_id, c.currency_code,
                    case 
			            when os.template_name <> '' 
			            then os.template_name 
			            when ai.name <> '' 
			            then ai.name 
			            when gi.image_name <> '' 
			            then gi.image_name 
			            else oos.name 
			        end as 'template_name'
                    FROM c4_cart_items as ci 
                    inner join c4_clients as c on c.id = ci.clientid
                    left join c4_os_templates as os on (os.id = ci.os_template_id and ci.cloudid in (1,2))
			        left join other_cloud_os_templates as oos on (oos.id = ci.os_template_id and ci.cloudid = '${config.AZURE.cloudid}')
			        left join aws_images as ai on (ai.id = ci.os_template_id and ci.cloudid = '${config.AWS.cloudid}')
			        left join c4_gcp_images as gi on (gi.id = ci.os_template_id and ci.cloudid = '${config.GCP.cloudid}')
                    where ci.paymentid = '${txnId}' and ci.record_status = 2 and ci.approval_status = 1 order by id asc`;
                    console.log(datasql);
                    dbHandler.executeQuery(datasql,async function(data){
//                         console.log("data");
//                         console.log(data);

                        let taxData = {currency:data[0].currency_code,total:0,tax_percent:0,tax_amount:0,grand_total:0};
                        await data.forEach(async function(val,key) {
                            data[key].cart_config = JSON.parse(val.cart_items);
                            if(data[key]['cloudid'] == 1 ||data[key]['cloudid'] == 2){
                            	data[key].cart_config.config.ram = (data[key].cart_config.config.ram / 1024);
                            }else{
                            	data[key].cart_config.ram = (data[key].cart_config.ram / 1024);
                            }
                            data[key].item_value = helper.financial(val.item_value);
                            data[key].total_charge = helper.financial(helper.financial(val.item_value) * val.items_count);
                            taxData.total = taxData.total + (parseFloat(val.item_value) * parseFloat(val.items_count));
                        });
                        taxData.total = helper.financial( taxData.total, 2)
                        taxData.tax_percent = helper.calculateTax({amount:0,currency_id:data[0].currency_id,get_tax:'percent'});
                        taxData.tax_amount = helper.calculateTax({amount:taxData.total,currency_id:data[0].currency_id,get_tax:'amount'});
                        taxData.grand_total = helper.financial( parseFloat(taxData.total) + parseFloat(taxData.tax_amount), 2);
                        let returnData = {items:data,taxData:taxData,orderDetails:{orderid:txnId}}
                        resolve(returnData);
                    });
                }else{
                    resolve({"failedInfo":{"status":"failed","message":"Invalid Request."}});
                }
            }
       });
    });
}

function updateCartItemCount(id,count) {
    return new Promise((resolve,reject) => {
        db.query("update c4_cart_items set items_count='"+count+"' WHERE id='"+id+"'",(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                // callback(1,{"message":"The operation did not execute as expected. Please raise a ticket to support Please try again"});
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                // callback(null,{"message":"Cart Item Updated Successfully."});
                resolve(rows);
            }
       });    
        // dbHandler.updateTableData('c4_cart_items',{id:id},{items_count:count},function(err,result){
        //     // callback(null,{"message":"Cart Item Updated Successfully."});
        //     resolve({"message":"Cart Item Updated Successfully."});
        // });
    });
}

function deleteCartItem(id) {
    return new Promise((resolve,reject) => {
        db.query("update c4_cart_items set record_status='0' WHERE id='"+id+"'",(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                // callback(1,{"message":"The operation did not execute as expected. Please raise a ticket to support Please try again"});
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                // callback(null,{"message":"Cart Item Updated Successfully."});
                resolve(rows);
            }
       });
        // dbHandler.updateTableData('c4_cart_items',{id:id},{record_status:0},function(err,result){
        //     // callback(null,{"message":"Cart Item Deleted Successfully."});
        //     resolve({"message":"Cart Item Deleted Successfully."});
        // });
    });
}

let updateCartItemStatus= async (reqObj,callback)=>{
    console.log("reqObj --- ", JSON.stringify(reqObj));
//    return callback(null,{status:"error", message: "The operation did not execute as expected. Please raise a ticket to support",reqObj});

    let cts = Math.round(new Date().getTime() / 1000),
      {cartids = [], cart_id} = reqObj.item;

    return new Promise(async (resolve,reject) => {
    	let logUpdateData = {
			approval_status : reqObj.status,
			updated_by : reqObj.user_id,
			updated_date : cts
    	};
    	if(reqObj.status == 2){
    		logUpdateData.rejected_comments = reqObj.rejectResonse;
    	}
    	await dbHandler.updateTableData('azure_approval_logs',{cart_id: cartids},logUpdateData,async function(err,result){
    		dbFunc.connectionRelease;
    		if(err){
    			console.log('err 2287', err);
    			return callback(1,{status:"error", message: "The operation did not execute as expected. Please raise a ticket to support"});
    			resolve(err);
    		}else{
    			if(logUpdateData.approval_status == 2){
    				let cartUpdateData = {
    						record_status : 0,
    						approval_status : logUpdateData.approval_status,
        		    		rejected_comments : reqObj.rejectResonse
    				};
    				await dbHandler.updateTableData('c4_cart_items',{cartid:cart_id},cartUpdateData,async function(err,result){
    					dbFunc.connectionRelease;
    					if(err){
    		    			console.log(2300, err);
    		    			return callback(1,{status:"error", message: "The operation did not execute as expected. Please raise a ticket to support"});
    		    			resolve(err);
    		    		}else{
    		    			let sql = `SELECT cart_items FROM c4_cart_items
    	        		        where cartid = '${reqObj.item.cart_id}'`;
    	    				console.log(2307, '----', sql);
    	    				await db.query(sql,async (error,cartRow,fields)=>{
    	    		        	dbFunc.connectionRelease;
    	    		            if(!!error) {
    	    		            	console.log(error);
    	    		    			return callback(1,{status:"error", message: "The operation did not execute as expected. Please raise a ticket to support"});
    	    		    			resolve(error);
    	    		            } else {
    	    		            	if(cartRow.length > 0){
                                        cartRow = cartRow.map(async (cart, indx) => {
                                            let cart_items = JSON.parse(cart.cart_items),
			    		    			    //Update the hosts which are provisioned
			                                    updateSql = "update azure_reusing_hostnames set " +
				                    			" record_status = 0, is_vm_added_to_cart= 0, provision_status = 0, provision_date= '', " +
				                    			" updated_date= '"+cts+"'" +
				                    			" WHERE host_name = '"+cart_items.virtual_machine_name+"'";
					        		    	console.log("updateSql --- ",indx, updateSql);
					        		    	
	                                        return db.query(updateSql, (error,rows,fields)=>{
					        		    		dbFunc.connectionRelease;
					        		            if(!!error) {
					        		            	console.log('error', error);
					        		            } else {
					        		                console.log(`Updated provision_status to 1'`);
					        		                console.log(rows);
					        		            }
	                                        });
                                        });
    	    		            		await Promise.all(cartRow)
    	    		            	}
    	    		            }
    	    				});
    	    				commonModel.getEmailTemplate({template_key:"VM_CART_STATUS_CHANGED"},async function(error,emailTempRow){
    		    	    		console.log("emailTempRow --- ",JSON.stringify(emailTempRow));
    		    	    		console.log("reqObj.itemData.cart_config --- ", reqObj.itemData.cart_config);
    		    	    		console.log("reqObj.userDetails --- ",JSON.stringify(reqObj.userDetails));
    		    	    		if(reqObj.itemData.cart_config
    				    				&& reqObj.itemData.cart_config.length > 0
    				    				&& reqObj.userDetails
    				    				&& emailTempRow.data){
    			                    let subject = emailTempRow.data.email_subject+ ((reqObj.itemData.cart_config.length == 1)?" - "+reqObj.itemData.cart_config[0].virtual_machine_name:"");
    		                        let mailbody = emailTempRow.data.email_body;
    		
    		                        let vmTable = "";
    		                        let i= 1;
    		                        for await ( const vm of reqObj.itemData.cart_config ) {
    		                        	vmTable+=`<h3>#${i} : VM Information</h3>`;
    		                        	vmTable+=`<table border='1'><tr><td>VM Name</td><td>${vm.virtual_machine_name}</td></tr>`;
//    				              		vmTable+=`<tr><td>Subscription Provision Type</td><td>${vm.subscription_provision_type}</td></tr>`;
    				              		vmTable+=`<tr><td>vCPUS</td><td>${vm.cpus}</td></tr>`;
    				              		vmTable+=`<tr><td>Memory</td><td>${vm.ram} GB</td></tr>`;
    				              		vmTable+=`<tr><td>OS Storage</td><td>${vm.disksize} GB</td></tr>`;
    				              		vmTable+=`<tr><td>Subscription</td><td>${((vm.selectedSubscriptionLabel)?vm.selectedSubscriptionLabel:"")}</td></tr>`;
    				              		vmTable+=`<tr><td>VM Resource Group</td><td>${vm.deployment_resource_group_name}</td></tr>`;
    				              		vmTable+=`<tr><td>Region</td><td>${((vm.selected_network_location_name)?vm.selected_network_location_name:"")}</td></tr>`;
//    				              		vmTable+=`<tr><td>Network Resource Group Name</td><td>${vm.network_resource_group_name}</td></tr>`;
    				              		vmTable+=`<tr><td>Network Identify</td><td>${config.network_identify_arr[vm.network_identify]}</td></tr>`;
    				              		vmTable+=`<tr><td>Virtual Network Name</td><td>${vm.virtual_network_name}</td></tr>`;
//    				              		vmTable+=`<tr><td>Subnet Name</td><td>${vm.subnet_name}</td></tr>`;
//    				              		vmTable+=`<tr><td>NIC Name</td><td>${vm.nic_name}</td></tr>`;
    				              		vmTable+=`<tr><td>Private IP Address</td><td>${((vm.private_ip_address)?vm.private_ip_address:"")}</td></tr>`;
    				              		vmTable+=`<tr><td>Managed Disk Name</td><td>${vm.managed_disk_name}</td></tr>`;
    			                    	vmTable+=`<tr><td>Managed Disk Host Caching</td><td>${vm.managed_disk_host_caching}</td></tr>`;
    			                    	vmTable+=`<tr><td>Managed Disk SKU</td><td>${vm.managed_disk_storage_size}</td></tr>`;
    			                    	vmTable+=`<tr><td>Managed Disk Size</td><td>${vm.managed_disk_size}</td></tr>`;
    			                    	vmTable+=`<tr><td>Managed Disk Size Storage Account Type</td><td>${vm.managed_disk_size_storage_account_type}</td></tr>`;
    				                    vmTable+=`<tr><td>Zone</td><td>${((vm.zone)?vm.zone:"")}</td></tr>`;
    				                    vmTable+=`<tr><td>Availability Set Name</td><td>${((vm.availability_set_name)?vm.availability_set_name:"")}</td></tr>`;
    					                vmTable+=`<tr><td>Environment</td><td>${vm.environment}</td></tr>`;
//    					                vmTable+=`<tr><td>System Type</td><td>${vm.system_type}</td></tr>`;
//    					                vmTable+=`<tr><td>Storage Account Name</td><td>${vm.storage_account_name}</td></tr>`;
//    					                vmTable+=`<tr><td>Ansible IP</td><td>${vm.selected_ansible_server}</td></tr>`;
    					                vmTable+=`<tr><td>Is Cluster</td><td>${(vm.is_cluster?"Yes":"No")}</td></tr>`;
    				                    if(vm.is_cluster == 1){ 
    			                    		vmTable+=`<tr><td>VM 1 NIC Name 2</td><td>${vm.nic_name2}</td></tr>`;
    				                    	vmTable+=`<tr><td>VM 2 Name</td><td>${vm.virtual_machine_name2}</td></tr>`;
//    				                    	vmTable+=`<tr><td>VM 2 Subnet Name</td><td>${vm.subnet1_name}</td></tr>`;
//    				                    	vmTable+=`<tr><td>VM 2 NIC Name 1</td><td>${vm.nic_name3}</td></tr>`;
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
//    				                      	vmTable+=`<tr><td>Gallery Name</td><td>${vm.gallery_name}</td></tr>`;
    				                    }  
    				                    if(vm.managed_infra_subscription_id){
//    				                      	vmTable+=`<tr><td>Managed Infra Subscription ID</td><td>${vm.managed_infra_subscription_id}</td></tr>`;
    				                    }
    				                    if(vm.shared_image_name){
    				                      	vmTable+=`<tr><td>Template Name</td><td>${vm.shared_image_name}</td></tr>`;
    				                    }
    				                    if(vm.shared_image_version){
//    				                      	vmTable+=`<tr><td>Template Version</td><td>${vm.shared_image_version}</td></tr>`;
    				                    }
    				                    if(vm.backup_resource_group_name){
//    				                      	vmTable+=`<tr><td>Backup Resource group</td><td>${vm.backup_resource_group_name}</td></tr>`;
    				                    }
    				                    if(vm.recovery_vault_name){
//    				                      	vmTable+=`<tr><td>Backup Vault Name</td><td>${vm.recovery_vault_name}</td></tr>`;
    				                    }
    				                    if(vm.backup_policy){
//    				                      	vmTable+=`<tr><td>Backup Policy</td><td>${((vm.backup_policy.toLowerCase().indexOf("gold") >= 0)?"GOLD":((vm.backup_policy.toLowerCase().indexOf("silver") >= 0)?"SILVER":((vm.backup_policy.toLowerCase().indexOf("bronze") >= 0)?"BRONZE":vm.backup_policy)))}</td></tr>`;
    				                    }
    				                    if(vm.db_full_backup){
//    				                      	vmTable+=`<tr><td>DB Full Backup Policy</td><td>${vm.db_full_backup}</td></tr>`;
    				                    }
    				                    if(vm.db_log_backup){
//    				                      	vmTable+=`<tr><td>DB Log Backup Policy</td><td>${vm.db_log_backup}</td></tr>`;
    				                    }
    				                    if(vm.db_backup){
//    				                      	vmTable+=`<tr><td>DB Backup Policy</td><td>${vm.db_backup}</td></tr>`;
    				                    }
//    				                    if(vm.cyberark_usernames){
//    				                      	vmTable+=`<tr><td>Cyberark Usernames</td><td>${vm.cyberark_usernames}</td></tr>`;
//    				                    }
    				                    if(vm.disk_encryption_name){
//    				                      	vmTable+=`<tr><td>Disk Encryption Name</td><td>${vm.disk_encryption_name}</td></tr>`;
    				                    }
    				                    if(vm.disk_encryption_resource_group_name){
//    				                      	vmTable+=`<tr><td>Disk Encryption Resource Group Name</td><td>${vm.disk_encryption_resource_group_name}</td></tr>`;
    				                    }
    				                    vmTable+=`</table>`;
    				                    i++;
    		                    	}
    		                        
    		                        mailbody = mailbody.replace("{{HOST_INFO}}", vmTable);
    		                        mailbody = mailbody.replace("{{ORDER_STATUS}}", "Rejected");
    		                        mailbody = mailbody.replace("{{REQUESTED_DOMAIN}}", config.FRONTEND_URL.replace("#/",""));
    		                        
    		                        mail.mail({subject : subject, messageBody : mailbody,tomail : reqObj.item.requested_email, ccmails : reqObj.userDetails.email});
    		                        return callback(1,{status:"success", message: "Cart item updated successfully."});
    		    	    		}else{
    		    	    			return callback(1,{status:"success", message: "Cart item updated successfully."});
    		    	    		}
    		    	    	});
    		    			
    		    			resolve([]);
    		    		}
    		        });
    			}else{
    				let sql = `SELECT am.approval_matrix_level FROM azure_approval_matrix as am
        		        where am.approval_matrix_level > '${reqObj.item.approval_matrix_level}' and am.record_status = 1 order by am.approval_matrix_level asc limit 1`;
    				console.log(sql);
    				await db.query(sql,async (error,levelRows,fields)=>{
    		        	dbFunc.connectionRelease;
    		            if(!!error) {
    		            	console.log(error);
    		    			return callback(1,{status:"error", message: "The operation did not execute as expected. Please raise a ticket to support"});
    		    			resolve(error);
    		            } else {
    		            	console.log("levelRows --- ", JSON.stringify(levelRows));
    		                if (levelRows.length == 0) {
    		                	let cartUpdateData = {
    		    						approval_status : logUpdateData.approval_status
    		    				};
    		    				await dbHandler.updateTableData('c4_cart_items',{cartid:cart_id},cartUpdateData,async function(err,result){
    		    					dbFunc.connectionRelease;
    		    					if(err){
    		    		    			console.log(err);
    		    		    			return callback(1,{status:"error", message: "The operation did not execute as expected. Please raise a ticket to support"});
    		    		    			resolve(err);
    		    		    		}else{
    		    		    			commonModel.getEmailTemplate({template_key:"VM_CART_STATUS_CHANGED"},async function(error,emailTempRow){
    		    		    	    		console.log("emailTempRow --- ",JSON.stringify(emailTempRow));
    		    		    	    		console.log("reqObj.itemData.cart_config --- ", reqObj.itemData.cart_config);
    		    		    	    		console.log("reqObj.userDetails --- ",JSON.stringify(reqObj.userDetails));
    		    		    	    		if(reqObj.itemData.cart_config
    		    				    				&& reqObj.itemData.cart_config.length > 0
    		    				    				&& reqObj.userDetails
    		    				    				&& emailTempRow.data){
    		    			                    let subject = emailTempRow.data.email_subject+ ((reqObj.itemData.cart_config.length == 1)?" - "+reqObj.itemData.cart_config[0].virtual_machine_name:"");
    		    		                        let mailbody = emailTempRow.data.email_body;
    		    		
    		    		                        let vmTable = "";
    		    		                        let i= 1;
    		    		                        for await ( const vm of reqObj.itemData.cart_config ) {
    		    		                        	vmTable+=`<h3>#${i} : VM Information</h3>`;
    		    		                        	vmTable+=`<table border='1'><tr><td>VM Name</td><td>${vm.virtual_machine_name}</td></tr>`;
//    		    				              		vmTable+=`<tr><td>Subscription Provision Type</td><td>${vm.subscription_provision_type}</td></tr>`;
    		    				              		vmTable+=`<tr><td>vCPUS</td><td>${vm.cpus}</td></tr>`;
    		    				              		vmTable+=`<tr><td>Memory</td><td>${vm.ram} GB</td></tr>`;
    		    				              		vmTable+=`<tr><td>OS Storage</td><td>${vm.disksize} GB</td></tr>`;
    		    				              		vmTable+=`<tr><td>Subscription</td><td>${((vm.selectedSubscriptionLabel)?vm.selectedSubscriptionLabel:"")}</td></tr>`;
    		    				              		vmTable+=`<tr><td>VM Resource Group</td><td>${vm.deployment_resource_group_name}</td></tr>`;
    		    				              		vmTable+=`<tr><td>Region</td><td>${((vm.selected_network_location_name)?vm.selected_network_location_name:"")}</td></tr>`;
//    		    				              		vmTable+=`<tr><td>Network Resource Group Name</td><td>${vm.network_resource_group_name}</td></tr>`;
    		    				              		vmTable+=`<tr><td>Network Identify</td><td>${config.network_identify_arr[vm.network_identify]}</td></tr>`;
    		    				              		vmTable+=`<tr><td>Virtual Network Name</td><td>${vm.virtual_network_name}</td></tr>`;
//    		    				              		vmTable+=`<tr><td>Subnet Name</td><td>${vm.subnet_name}</td></tr>`;
//    		    				              		vmTable+=`<tr><td>NIC Name</td><td>${vm.nic_name}</td></tr>`;
    		    				              		vmTable+=`<tr><td>Private IP Address</td><td>${((vm.private_ip_address)?vm.private_ip_address:"")}</td></tr>`;
    		    				              		vmTable+=`<tr><td>Managed Disk Name</td><td>${vm.managed_disk_name}</td></tr>`;
    		    			                    	vmTable+=`<tr><td>Managed Disk Host Caching</td><td>${vm.managed_disk_host_caching}</td></tr>`;
    		    			                    	vmTable+=`<tr><td>Managed Disk SKU</td><td>${vm.managed_disk_storage_size}</td></tr>`;
    		    			                    	vmTable+=`<tr><td>Managed Disk Size</td><td>${vm.managed_disk_size}</td></tr>`;
    		    			                    	vmTable+=`<tr><td>Managed Disk Size Storage Account Type</td><td>${vm.managed_disk_size_storage_account_type}</td></tr>`;
    		    				                    vmTable+=`<tr><td>Zone</td><td>${((vm.zone)?vm.zone:"")}</td></tr>`;
    		    				                    vmTable+=`<tr><td>Availability Set Name</td><td>${((vm.availability_set_name)?vm.availability_set_name:"")}</td></tr>`;
    		    					                vmTable+=`<tr><td>Environment</td><td>${vm.environment}</td></tr>`;
//    		    					                vmTable+=`<tr><td>System Type</td><td>${vm.system_type}</td></tr>`;
//    		    					                vmTable+=`<tr><td>Storage Account Name</td><td>${vm.storage_account_name}</td></tr>`;
//    		    					                vmTable+=`<tr><td>Ansible IP</td><td>${vm.selected_ansible_server}</td></tr>`;
    		    					                vmTable+=`<tr><td>Is Cluster</td><td>${(vm.is_cluster?"Yes":"No")}</td></tr>`;
    		    				                    if(vm.is_cluster == 1){ 
    		    			                    		vmTable+=`<tr><td>VM 1 NIC Name 2</td><td>${vm.nic_name2}</td></tr>`;
    		    				                    	vmTable+=`<tr><td>VM 2 Name</td><td>${vm.virtual_machine_name2}</td></tr>`;
//    		    				                    	vmTable+=`<tr><td>VM 2 Subnet Name</td><td>${vm.subnet1_name}</td></tr>`;
//    		    				                    	vmTable+=`<tr><td>VM 2 NIC Name 1</td><td>${vm.nic_name3}</td></tr>`;
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
//    		    				                      	vmTable+=`<tr><td>Gallery Name</td><td>${vm.gallery_name}</td></tr>`;
    		    				                    }  
    		    				                    if(vm.managed_infra_subscription_id){
//    		    				                      	vmTable+=`<tr><td>Managed Infra Subscription ID</td><td>${vm.managed_infra_subscription_id}</td></tr>`;
    		    				                    }
    		    				                    if(vm.shared_image_name){
    		    				                      	vmTable+=`<tr><td>Template Name</td><td>${vm.shared_image_name}</td></tr>`;
    		    				                    }
    		    				                    if(vm.shared_image_version){
//    		    				                      	vmTable+=`<tr><td>Template Version</td><td>${vm.shared_image_version}</td></tr>`;
    		    				                    }
    		    				                    if(vm.backup_resource_group_name){
//    		    				                      	vmTable+=`<tr><td>Backup Resource group</td><td>${vm.backup_resource_group_name}</td></tr>`;
    		    				                    }
    		    				                    if(vm.recovery_vault_name){
//    		    				                      	vmTable+=`<tr><td>Backup Vault Name</td><td>${vm.recovery_vault_name}</td></tr>`;
    		    				                    }
    		    				                    if(vm.backup_policy){
//    		    				                      	vmTable+=`<tr><td>Backup Policy</td><td>${((vm.backup_policy.toLowerCase().indexOf("gold") >= 0)?"GOLD":((vm.backup_policy.toLowerCase().indexOf("silver") >= 0)?"SILVER":((vm.backup_policy.toLowerCase().indexOf("bronze") >= 0)?"BRONZE":vm.backup_policy)))}</td></tr>`;
    		    				                    }
    		    				                    if(vm.db_full_backup){
//    		    				                      	vmTable+=`<tr><td>DB Full Backup Policy</td><td>${vm.db_full_backup}</td></tr>`;
    		    				                    }
    		    				                    if(vm.db_log_backup){
//    		    				                      	vmTable+=`<tr><td>DB Log Backup Policy</td><td>${vm.db_log_backup}</td></tr>`;
    		    				                    }
    		    				                    if(vm.db_backup){
//    		    				                      	vmTable+=`<tr><td>DB Backup Policy</td><td>${vm.db_backup}</td></tr>`;
    		    				                    }
//    		    				                    if(vm.cyberark_usernames){
//    		    				                      	vmTable+=`<tr><td>Cyberark Usernames</td><td>${vm.cyberark_usernames}</td></tr>`;
//    		    				                    }
    		    				                    if(vm.disk_encryption_name){
//    		    				                      	vmTable+=`<tr><td>Disk Encryption Name</td><td>${vm.disk_encryption_name}</td></tr>`;
    		    				                    }
    		    				                    if(vm.disk_encryption_resource_group_name){
//    		    				                      	vmTable+=`<tr><td>Disk Encryption Resource Group Name</td><td>${vm.disk_encryption_resource_group_name}</td></tr>`;
    		    				                    }
    		    				                    vmTable+=`</table>`;
    		    				                    i++;
    		    		                    	}
    		    		                        mailbody = mailbody.replace("{{HOST_INFO}}", vmTable);
    		    		                        mailbody = mailbody.replace("{{ORDER_STATUS}}", "Approved");
    		    		                        mailbody = mailbody.replace("{{REQUESTED_DOMAIN}}", config.FRONTEND_URL.replace("#/",""));
    		    		                        
    		    		                        mail.mail({subject : subject, messageBody : mailbody,tomail : reqObj.item.requested_email, ccmails : reqObj.userDetails.email});
    		    		                        return callback(1,{status:"success", message: "Cart item updated successfully."});
    		    		    	    		}else{
    		    		    	    			return callback(1,{status:"success", message: "Cart item updated successfully."});
    		    		    	    		}
    		    		    	    	});
    		    		    			resolve([]);
    		    		    		}
    		    		        });
    		                }else{
    		                	let logNewRecord = cartids.map(cart_id => {
                                    return {
    		                    		cart_id : cart_id,
    		                    		approval_status : 0,
    		                    		approval_matrix_level : levelRows[0].approval_matrix_level,
    		                    		created_by : reqObj.user_id,
    		                    		created_date : cts
    		                        }
                                });
    		                    console.log("logNewRecord --- ", JSON.stringify(logNewRecord));
    		    				await dbHandler.insertIntoTable('azure_approval_logs',logNewRecord,async function(error,logId){
    		    					dbFunc.connectionRelease;
    		    					if(error) {
    		    						console.log(error);
    		    		    			return callback(1,{status:"error", message: "The operation did not execute as expected. Please raise a ticket to support"});
    		    		    			resolve(error);
    				                } else {
    				                	await dbHandler.updateTableData('c4_cart_items',{cartid: cart_id},{pending_at : levelRows[0].approval_matrix_level},async function(err,result){
                                            console.log(err);
                                        });
    				                	commonModel.getEmailTemplate({template_key:"VM_CART_STATUS_CHANGED"},async function(error,emailTempRow){
    		    		    	    		console.log("emailTempRow --- ",JSON.stringify(emailTempRow));
    		    		    	    		console.log("reqObj.itemData.cart_config --- ", reqObj.itemData.cart_config);
    		    		    	    		console.log("reqObj.userDetails --- ",JSON.stringify(reqObj.userDetails));
    		    		    	    		if(reqObj.itemData.cart_config
    		    				    				&& reqObj.itemData.cart_config.length > 0
    		    				    				&& reqObj.userDetails
    		    				    				&& emailTempRow.data){
    		    			                    let subject = emailTempRow.data.email_subject+ ((reqObj.itemData.cart_config.length == 1)?" - "+reqObj.itemData.cart_config[0].virtual_machine_name:"");
    		    		                        let mailbody = emailTempRow.data.email_body;
    		    		
    		    		                        let vmTable = "";
    		    		                        let i= 1;
    		    		                        for await ( const vm of reqObj.itemData.cart_config ) {
    		    		                        	vmTable+=`<h3>#${i} : VM Information</h3>`;
    		    		                        	vmTable+=`<table border='1'><tr><td>VM Name</td><td>${vm.virtual_machine_name}</td></tr>`;
//    		    				              		vmTable+=`<tr><td>Subscription Provision Type</td><td>${vm.subscription_provision_type}</td></tr>`;
    		    				              		vmTable+=`<tr><td>vCPUS</td><td>${vm.cpus}</td></tr>`;
    		    				              		vmTable+=`<tr><td>Memory</td><td>${vm.ram} GB</td></tr>`;
    		    				              		vmTable+=`<tr><td>OS Storage</td><td>${vm.disksize} GB</td></tr>`;
    		    				              		vmTable+=`<tr><td>Subscription</td><td>${((vm.selectedSubscriptionLabel)?vm.selectedSubscriptionLabel:"")}</td></tr>`;
    		    				              		vmTable+=`<tr><td>VM Resource Group</td><td>${vm.deployment_resource_group_name}</td></tr>`;
    		    				              		vmTable+=`<tr><td>Region</td><td>${((vm.selected_network_location_name)?vm.selected_network_location_name:"")}</td></tr>`;
//    		    				              		vmTable+=`<tr><td>Network Resource Group Name</td><td>${vm.network_resource_group_name}</td></tr>`;
    		    				              		vmTable+=`<tr><td>Network Identify</td><td>${config.network_identify_arr[vm.network_identify]}</td></tr>`;
    		    				              		vmTable+=`<tr><td>Virtual Network Name</td><td>${vm.virtual_network_name}</td></tr>`;
//    		    				              		vmTable+=`<tr><td>Subnet Name</td><td>${vm.subnet_name}</td></tr>`;
//    		    				              		vmTable+=`<tr><td>NIC Name</td><td>${vm.nic_name}</td></tr>`;
    		    				              		vmTable+=`<tr><td>Private IP Address</td><td>${((vm.private_ip_address)?vm.private_ip_address:"")}</td></tr>`;
    		    				              		vmTable+=`<tr><td>Managed Disk Name</td><td>${vm.managed_disk_name}</td></tr>`;
    		    			                    	vmTable+=`<tr><td>Managed Disk Host Caching</td><td>${vm.managed_disk_host_caching}</td></tr>`;
    		    			                    	vmTable+=`<tr><td>Managed Disk SKU</td><td>${vm.managed_disk_storage_size}</td></tr>`;
    		    			                    	vmTable+=`<tr><td>Managed Disk Size</td><td>${vm.managed_disk_size}</td></tr>`;
    		    			                    	vmTable+=`<tr><td>Managed Disk Size Storage Account Type</td><td>${vm.managed_disk_size_storage_account_type}</td></tr>`;
    		    				                    vmTable+=`<tr><td>Zone</td><td>${((vm.zone)?vm.zone:"")}</td></tr>`;
    		    				                    vmTable+=`<tr><td>Availability Set Name</td><td>${((vm.availability_set_name)?vm.availability_set_name:"")}</td></tr>`;
    		    					                vmTable+=`<tr><td>Environment</td><td>${vm.environment}</td></tr>`;
//    		    					                vmTable+=`<tr><td>System Type</td><td>${vm.system_type}</td></tr>`;
//    		    					                vmTable+=`<tr><td>Storage Account Name</td><td>${vm.storage_account_name}</td></tr>`;
//    		    					                vmTable+=`<tr><td>Ansible IP</td><td>${vm.selected_ansible_server}</td></tr>`;
    		    					                vmTable+=`<tr><td>Is Cluster</td><td>${(vm.is_cluster?"Yes":"No")}</td></tr>`;
    		    				                    if(vm.is_cluster == 1){ 
    		    			                    		vmTable+=`<tr><td>VM 1 NIC Name 2</td><td>${vm.nic_name2}</td></tr>`;
    		    				                    	vmTable+=`<tr><td>VM 2 Name</td><td>${vm.virtual_machine_name2}</td></tr>`;
//    		    				                    	vmTable+=`<tr><td>VM 2 Subnet Name</td><td>${vm.subnet1_name}</td></tr>`;
//    		    				                    	vmTable+=`<tr><td>VM 2 NIC Name 1</td><td>${vm.nic_name3}</td></tr>`;
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
//    		    				                      	vmTable+=`<tr><td>Gallery Name</td><td>${vm.gallery_name}</td></tr>`;
    		    				                    }  
    		    				                    if(vm.managed_infra_subscription_id){
//    		    				                      	vmTable+=`<tr><td>Managed Infra Subscription ID</td><td>${vm.managed_infra_subscription_id}</td></tr>`;
    		    				                    }
    		    				                    if(vm.shared_image_name){
    		    				                      	vmTable+=`<tr><td>Template Name</td><td>${vm.shared_image_name}</td></tr>`;
    		    				                    }
    		    				                    if(vm.shared_image_version){
//    		    				                      	vmTable+=`<tr><td>Template Version</td><td>${vm.shared_image_version}</td></tr>`;
    		    				                    }
    		    				                    if(vm.backup_resource_group_name){
//    		    				                      	vmTable+=`<tr><td>Backup Resource group</td><td>${vm.backup_resource_group_name}</td></tr>`;
    		    				                    }
    		    				                    if(vm.recovery_vault_name){
//    		    				                      	vmTable+=`<tr><td>Backup Vault Name</td><td>${vm.recovery_vault_name}</td></tr>`;
    		    				                    }
    		    				                    if(vm.backup_policy){
//    		    				                      	vmTable+=`<tr><td>Backup Policy</td><td>${((vm.backup_policy.toLowerCase().indexOf("gold") >= 0)?"GOLD":((vm.backup_policy.toLowerCase().indexOf("silver") >= 0)?"SILVER":((vm.backup_policy.toLowerCase().indexOf("bronze") >= 0)?"BRONZE":vm.backup_policy)))}</td></tr>`;
    		    				                    }
    		    				                    if(vm.db_full_backup){
//    		    				                      	vmTable+=`<tr><td>DB Full Backup Policy</td><td>${vm.db_full_backup}</td></tr>`;
    		    				                    }
    		    				                    if(vm.db_log_backup){
//    		    				                      	vmTable+=`<tr><td>DB Log Backup Policy</td><td>${vm.db_log_backup}</td></tr>`;
    		    				                    }
    		    				                    if(vm.db_backup){
//    		    				                      	vmTable+=`<tr><td>DB Backup Policy</td><td>${vm.db_backup}</td></tr>`;
    		    				                    }
//    		    				                    if(vm.cyberark_usernames){
//    		    				                      	vmTable+=`<tr><td>Cyberark Usernames</td><td>${vm.cyberark_usernames}</td></tr>`;
//    		    				                    }
    		    				                    if(vm.disk_encryption_name){
//    		    				                      	vmTable+=`<tr><td>Disk Encryption Name</td><td>${vm.disk_encryption_name}</td></tr>`;
    		    				                    }
    		    				                    if(vm.disk_encryption_resource_group_name){
//    		    				                      	vmTable+=`<tr><td>Disk Encryption Resource Group Name</td><td>${vm.disk_encryption_resource_group_name}</td></tr>`;
    		    				                    }
    		    				                    vmTable+=`</table>`;
    		    				                    i++;
    		    		                    	}
    		    		                        mailbody = mailbody.replace("{{HOST_INFO}}", vmTable);
    		    		                        mailbody = mailbody.replace("{{ORDER_STATUS}}", "Approved");
    		    		                        mailbody = mailbody.replace("{{REQUESTED_DOMAIN}}", config.FRONTEND_URL.replace("#/",""));
    		    		                        
    		    		                        mail.mail({subject : subject, messageBody : mailbody,tomail : reqObj.item.requested_email, ccmails : reqObj.userDetails.email});
    		    		                        return callback(1,{status:"success", message: "Cart item updated successfully."});
    		    		    	    		}else{
    		    		    	    			return callback(1,{status:"success", message: "Cart item updated successfully."});
    		    		    	    		}
    		    		    	    	});
    		    		    			resolve([]);
    				                }
    				            });
    		                }
	    				}
    		        });
    			}
    		}
        });
    });
}

let updateVmOpsStatus= async (reqObj,callback)=>{
    console.log("reqObj --- ", JSON.stringify(reqObj));
//    return callback(null,{status:"error", message: "The operation did not execute as expected. Please raise a ticket to support",reqObj});

    let cts = Math.round(new Date().getTime() / 1000),
        approval_status = reqObj.status,
        is_approved = approval_status == 2 ? false : true;

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
    	await dbHandler.updateTableData('azure_vm_ops_approval_logs',{id:reqObj.item.id},logUpdateData,async function(err,result){
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
    				await dbHandler.updateTableData('azure_vm_ops_requests',{id:reqObj.item.request_id},cartUpdateData,async function(err,result){
    					dbFunc.connectionRelease;
    					if(err){
    		    			console.log(err);
    		    			return callback(1,{status:"error", message: "The operation did not execute as expected. Please raise a ticket to support"});
    		    			resolve(err);
    		    		}else{
    		    			let vmSql = `select *, s.display_name as subscriptionLabel from c4_vm_details as vd
	                        	inner join azure_vms as av on av.vm_detail_id = vd.id
	                        	inner join c4_azure_subscriptions as s on s.subscription_id = av.subscriptionId
	                        	where vd.id = '${reqObj.item.vm_id}'
	                        	`;
	                        let vmDetails = await dbHandler.executeQueryv2(vmSql);
    		    			commonModel.getEmailTemplate({template_key:"VM_OPERATIONS_REQUEST_STATUS_CHANGED"},async function(error,emailTempRow){
//    		    	    		console.log("emailTempRow --- ",JSON.stringify(emailTempRow));
//    		    	    		console.log("vmDetails --- ", vmDetails);
//    		    	    		console.log("reqObj.userDetails --- ",JSON.stringify(reqObj.userDetails));
    		    	    		if(vmDetails
    				    				&& vmDetails.length > 0
    				    				&& reqObj.userDetails
    				    				&& emailTempRow.data){
    			                    let subject = emailTempRow.data.email_subject+ ((vmDetails[0].host_name)?" - "+vmDetails[0].host_name:"");
    		                        let mailbody = emailTempRow.data.email_body;
    		
    		                        let vmTable = "";
                                    for await ( const vmItem of vmDetails ) {
                                    	if(vmItem.vm_creation_request_obj && vmItem.search_code){
                                            let vm = JSON.parse(vmItem.vm_creation_request_obj);
                                        	vmTable+=`<h3>#1 : VM Information</h3>`;
                                        	vmTable+=`<table border='1'><tr><td>VM Name</td><td>${vm.virtual_machine_name}</td></tr>`;
//                                      		vmTable+=`<tr><td>Subscription Provision Type</td><td>${vm.subscription_provision_type}</td></tr>`;
                                      		vmTable+=`<tr><td>vCPUS</td><td>${vm.cpus}</td></tr>`;
                                      		vmTable+=`<tr><td>Memory</td><td>${(vm.ram/1024)} GB</td></tr>`;
                                      		vmTable+=`<tr><td>OS Storage</td><td>${vm.disksize} GB</td></tr>`;
                                      		vmTable+=`<tr><td>Subscription</td><td>${((vm.selectedSubscriptionLabel)?vm.selectedSubscriptionLabel:"")}</td></tr>`;
                                      		vmTable+=`<tr><td>VM Resource Group</td><td>${vm.deployment_resource_group_name}</td></tr>`;
                                      		vmTable+=`<tr><td>Region</td><td>${((vm.selected_network_location_name)?vm.selected_network_location_name:"")}</td></tr>`;
//                                      		vmTable+=`<tr><td>Network Resource Group Name</td><td>${vm.network_resource_group_name}</td></tr>`;
                                      		vmTable+=`<tr><td>Network Identify</td><td>${config.network_identify_arr[vm.network_identify]}</td></tr>`;
                                      		vmTable+=`<tr><td>Virtual Network Name</td><td>${vm.virtual_network_name}</td></tr>`;
//                                      		vmTable+=`<tr><td>Subnet Name</td><td>${vm.subnet_name}</td></tr>`;
//                                      		vmTable+=`<tr><td>NIC Name</td><td>${vm.nic_name}</td></tr>`;
                                      		vmTable+=`<tr><td>Private IP Address</td><td>${((vm.private_ip_address)?vm.private_ip_address:"")}</td></tr>`;
                                      		vmTable+=`<tr><td>Managed Disk Name</td><td>${vm.managed_disk_name}</td></tr>`;
                                        	vmTable+=`<tr><td>Managed Disk Host Caching</td><td>${vm.managed_disk_host_caching}</td></tr>`;
                                        	vmTable+=`<tr><td>Managed Disk SKU</td><td>${vm.managed_disk_storage_size}</td></tr>`;
                                        	vmTable+=`<tr><td>Managed Disk Size</td><td>${vm.managed_disk_size}</td></tr>`;
                                        	vmTable+=`<tr><td>Managed Disk Size Storage Account Type</td><td>${vm.managed_disk_size_storage_account_type}</td></tr>`;
                                            vmTable+=`<tr><td>Zone</td><td>${((vm.zone)?vm.zone:"")}</td></tr>`;
                                            vmTable+=`<tr><td>Availability Set Name</td><td>${((vm.availability_set_name)?vm.availability_set_name:"")}</td></tr>`;
                        	                vmTable+=`<tr><td>Environment</td><td>${vm.environment}</td></tr>`;
//                        	                vmTable+=`<tr><td>System Type</td><td>${vm.system_type}</td></tr>`;
//                        	                vmTable+=`<tr><td>Storage Account Name</td><td>${vm.storage_account_name}</td></tr>`;
//                        	                vmTable+=`<tr><td>Ansible IP</td><td>${vm.selected_ansible_server}</td></tr>`;
                        	                vmTable+=`<tr><td>Is Cluster</td><td>${(vm.is_cluster?"Yes":"No")}</td></tr>`;
                                            if(vm.is_cluster == 1){ 
                                        		vmTable+=`<tr><td>VM 1 NIC Name 2</td><td>${vm.nic_name2}</td></tr>`;
                                            	vmTable+=`<tr><td>VM 2 Name</td><td>${vm.virtual_machine_name2}</td></tr>`;
//                                            	vmTable+=`<tr><td>VM 2 Subnet Name</td><td>${vm.subnet1_name}</td></tr>`;
//                                            	vmTable+=`<tr><td>VM 2 NIC Name 1</td><td>${vm.nic_name3}</td></tr>`;
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
//                                              	vmTable+=`<tr><td>Gallery Name</td><td>${vm.gallery_name}</td></tr>`;
                                            }  
                                            if(vm.managed_infra_subscription_id){
//                                              	vmTable+=`<tr><td>Managed Infra Subscription ID</td><td>${vm.managed_infra_subscription_id}</td></tr>`;
                                            }
                                            if(vm.shared_image_name){
                                              	vmTable+=`<tr><td>Template Name</td><td>${vm.shared_image_name}</td></tr>`;
                                            }
                                            if(vm.shared_image_version){
//                                              	vmTable+=`<tr><td>Template Version</td><td>${vm.shared_image_version}</td></tr>`;
                                            }
                                            if(vm.backup_resource_group_name){
//                                              	vmTable+=`<tr><td>Backup Resource group</td><td>${vm.backup_resource_group_name}</td></tr>`;
                                            }
                                            if(vm.recovery_vault_name){
//                                              	vmTable+=`<tr><td>Backup Vault Name</td><td>${vm.recovery_vault_name}</td></tr>`;
                                            }
                                            if(vm.backup_policy){
//                                              	vmTable+=`<tr><td>Backup Policy</td><td>${((vm.backup_policy.toLowerCase().indexOf("gold") >= 0)?"GOLD":((vm.backup_policy.toLowerCase().indexOf("silver") >= 0)?"SILVER":((vm.backup_policy.toLowerCase().indexOf("bronze") >= 0)?"BRONZE":vm.backup_policy)))}</td></tr>`;
                                            }
                                            if(vm.db_full_backup){
//                                              	vmTable+=`<tr><td>DB Full Backup Policy</td><td>${vm.db_full_backup}</td></tr>`;
                                            }
                                            if(vm.db_log_backup){
//                                              	vmTable+=`<tr><td>DB Log Backup Policy</td><td>${vm.db_log_backup}</td></tr>`;
                                            }
                                            if(vm.db_backup){
//                                              	vmTable+=`<tr><td>DB Backup Policy</td><td>${vm.db_backup}</td></tr>`;
                                            }
//                                            if(vm.cyberark_usernames){
//                                              	vmTable+=`<tr><td>Cyberark Usernames</td><td>${vm.cyberark_usernames}</td></tr>`;
//                                            }
                                            if(vm.disk_encryption_name){
//                                              	vmTable+=`<tr><td>Disk Encryption Name</td><td>${vm.disk_encryption_name}</td></tr>`;
                                            }
                                            if(vm.disk_encryption_resource_group_name){
//                                              	vmTable+=`<tr><td>Disk Encryption Resource Group Name</td><td>${vm.disk_encryption_resource_group_name}</td></tr>`;
                                            }
                                            vmTable+=`</table>`;
                                    	}else{
                                    		vmTable+=`<h3>#1 : VM Information</h3>`;
                                        	vmTable+=`<table border='1'><tr><td>VM Name</td><td>${vmItem.host_name}</td></tr>`;
//                                      		vmTable+=`<tr><td>Subscription Provision Type</td><td>${vmItem.subscription_provision_type}</td></tr>`;
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
    		                        mailbody = mailbody.replace("{{ORDER_STATUS}}", "Rejected");
    		                        mailbody = mailbody.replace("{{REQUEST_TYPE}}", reqObj.item.request_type);
                                    subject = subject.replace("{{REQUEST_TYPE}}", reqObj.item.request_type);
    		                        
    		                        mail.mail({subject : subject, messageBody : mailbody,tomail : reqObj.item.requested_email, ccmails : reqObj.userDetails.email});
    		                        return callback(1,{status:"success", message: "Request updated successfully."});
    		    	    		}else{
    		    	    			return callback(1,{status:"success", message: "Request updated successfully."});
    		    	    		}
    		    	    	});
//    		    			return callback(1,{status:"success", message: "Request updated successfully."});
    		    			resolve([]);
    		    		}
    		        });
    			}else{
                	let cartUpdateData = {
    						approval_status : logUpdateData.approval_status
    				};
    				await dbHandler.updateTableData('azure_vm_ops_requests',{id:reqObj.item.request_id},cartUpdateData,async function(err,result){
    					dbFunc.connectionRelease;
    					if(err){
    		    			console.log(err);
    		    			return callback(1,{status:"error", message: "The operation did not execute as expected. Please raise a ticket to support"});
    		    			resolve(err);
    		    		}else{
    		    			let vmSql = `select *, s.display_name as subscriptionLabel from c4_vm_details as vd
	                        	inner join azure_vms as av on av.vm_detail_id = vd.id
	                        	inner join c4_azure_subscriptions as s on s.subscription_id = av.subscriptionId
	                        	where vd.id = '${reqObj.item.vm_id}'
	                        	`;
	                        let vmDetails = await dbHandler.executeQueryv2(vmSql);
    		    			commonModel.getEmailTemplate({template_key:"VM_OPERATIONS_REQUEST_STATUS_CHANGED"},async function(error,emailTempRow){
//    		    	    		console.log("emailTempRow --- ",JSON.stringify(emailTempRow));
//    		    	    		console.log("vmDetails --- ", vmDetails);
//    		    	    		console.log("reqObj.userDetails --- ",JSON.stringify(reqObj.userDetails));
    		    	    		if(vmDetails
    				    				&& vmDetails.length > 0
    				    				&& reqObj.userDetails
    				    				&& emailTempRow.data){
    			                    let subject = emailTempRow.data.email_subject+ ((vmDetails[0].host_name)?" - "+vmDetails[0].host_name:"");
    		                        let mailbody = emailTempRow.data.email_body;
    		
    		                        let vmTable = "";
                                    for await ( const vmItem of vmDetails ) {
                                    	if(vmItem.vm_creation_request_obj && vmItem.search_code){
                                            let vm = JSON.parse(vmItem.vm_creation_request_obj);
                                        	vmTable+=`<h3>#1 : VM Information</h3>`;
                                        	vmTable+=`<table border='1'><tr><td>VM Name</td><td>${vm.virtual_machine_name}</td></tr>`;
//                                      		vmTable+=`<tr><td>Subscription Provision Type</td><td>${vm.subscription_provision_type}</td></tr>`;
                                      		vmTable+=`<tr><td>vCPUS</td><td>${vm.cpus}</td></tr>`;
                                      		vmTable+=`<tr><td>Memory</td><td>${(vm.ram/1024)} GB</td></tr>`;
                                      		vmTable+=`<tr><td>OS Storage</td><td>${vm.disksize} GB</td></tr>`;
                                      		vmTable+=`<tr><td>Subscription</td><td>${((vm.selectedSubscriptionLabel)?vm.selectedSubscriptionLabel:"")}</td></tr>`;
                                      		vmTable+=`<tr><td>VM Resource Group</td><td>${vm.deployment_resource_group_name}</td></tr>`;
                                      		vmTable+=`<tr><td>Region</td><td>${((vm.selected_network_location_name)?vm.selected_network_location_name:"")}</td></tr>`;
//                                      		vmTable+=`<tr><td>Network Resource Group Name</td><td>${vm.network_resource_group_name}</td></tr>`;
                                      		vmTable+=`<tr><td>Network Identify</td><td>${config.network_identify_arr[vm.network_identify]}</td></tr>`;
                                      		vmTable+=`<tr><td>Virtual Network Name</td><td>${vm.virtual_network_name}</td></tr>`;
//                                      		vmTable+=`<tr><td>Subnet Name</td><td>${vm.subnet_name}</td></tr>`;
//                                      		vmTable+=`<tr><td>NIC Name</td><td>${vm.nic_name}</td></tr>`;
                                      		vmTable+=`<tr><td>Private IP Address</td><td>${((vm.private_ip_address)?vm.private_ip_address:"")}</td></tr>`;
                                      		vmTable+=`<tr><td>Managed Disk Name</td><td>${vm.managed_disk_name}</td></tr>`;
                                        	vmTable+=`<tr><td>Managed Disk Host Caching</td><td>${vm.managed_disk_host_caching}</td></tr>`;
                                        	vmTable+=`<tr><td>Managed Disk SKU</td><td>${vm.managed_disk_storage_size}</td></tr>`;
                                        	vmTable+=`<tr><td>Managed Disk Size</td><td>${vm.managed_disk_size}</td></tr>`;
                                        	vmTable+=`<tr><td>Managed Disk Size Storage Account Type</td><td>${vm.managed_disk_size_storage_account_type}</td></tr>`;
                                            vmTable+=`<tr><td>Zone</td><td>${((vm.zone)?vm.zone:"")}</td></tr>`;
                                            vmTable+=`<tr><td>Availability Set Name</td><td>${((vm.availability_set_name)?vm.availability_set_name:"")}</td></tr>`;
                        	                vmTable+=`<tr><td>Environment</td><td>${vm.environment}</td></tr>`;
//                        	                vmTable+=`<tr><td>System Type</td><td>${vm.system_type}</td></tr>`;
//                        	                vmTable+=`<tr><td>Storage Account Name</td><td>${vm.storage_account_name}</td></tr>`;
//                        	                vmTable+=`<tr><td>Ansible IP</td><td>${vm.selected_ansible_server}</td></tr>`;
                        	                vmTable+=`<tr><td>Is Cluster</td><td>${(vm.is_cluster?"Yes":"No")}</td></tr>`;
                                            if(vm.is_cluster == 1){ 
                                        		vmTable+=`<tr><td>VM 1 NIC Name 2</td><td>${vm.nic_name2}</td></tr>`;
                                            	vmTable+=`<tr><td>VM 2 Name</td><td>${vm.virtual_machine_name2}</td></tr>`;
//                                            	vmTable+=`<tr><td>VM 2 Subnet Name</td><td>${vm.subnet1_name}</td></tr>`;
//                                            	vmTable+=`<tr><td>VM 2 NIC Name 1</td><td>${vm.nic_name3}</td></tr>`;
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
//                                              	vmTable+=`<tr><td>Gallery Name</td><td>${vm.gallery_name}</td></tr>`;
                                            }  
                                            if(vm.managed_infra_subscription_id){
//                                              	vmTable+=`<tr><td>Managed Infra Subscription ID</td><td>${vm.managed_infra_subscription_id}</td></tr>`;
                                            }
                                            if(vm.shared_image_name){
                                              	vmTable+=`<tr><td>Template Name</td><td>${vm.shared_image_name}</td></tr>`;
                                            }
                                            if(vm.shared_image_version){
//                                              	vmTable+=`<tr><td>Template Version</td><td>${vm.shared_image_version}</td></tr>`;
                                            }
                                            if(vm.backup_resource_group_name){
//                                              	vmTable+=`<tr><td>Backup Resource group</td><td>${vm.backup_resource_group_name}</td></tr>`;
                                            }
                                            if(vm.recovery_vault_name){
//                                              	vmTable+=`<tr><td>Backup Vault Name</td><td>${vm.recovery_vault_name}</td></tr>`;
                                            }
                                            if(vm.backup_policy){
//                                              	vmTable+=`<tr><td>Backup Policy</td><td>${((vm.backup_policy.toLowerCase().indexOf("gold") >= 0)?"GOLD":((vm.backup_policy.toLowerCase().indexOf("silver") >= 0)?"SILVER":((vm.backup_policy.toLowerCase().indexOf("bronze") >= 0)?"BRONZE":vm.backup_policy)))}</td></tr>`;
                                            }
                                            if(vm.db_full_backup){
//                                              	vmTable+=`<tr><td>DB Full Backup Policy</td><td>${vm.db_full_backup}</td></tr>`;
                                            }
                                            if(vm.db_log_backup){
//                                              	vmTable+=`<tr><td>DB Log Backup Policy</td><td>${vm.db_log_backup}</td></tr>`;
                                            }
                                            if(vm.db_backup){
//                                              	vmTable+=`<tr><td>DB Backup Policy</td><td>${vm.db_backup}</td></tr>`;
                                            }
//                                            if(vm.cyberark_usernames){
//                                              	vmTable+=`<tr><td>Cyberark Usernames</td><td>${vm.cyberark_usernames}</td></tr>`;
//                                            }
                                            if(vm.disk_encryption_name){
//                                              	vmTable+=`<tr><td>Disk Encryption Name</td><td>${vm.disk_encryption_name}</td></tr>`;
                                            }
                                            if(vm.disk_encryption_resource_group_name){
//                                              	vmTable+=`<tr><td>Disk Encryption Resource Group Name</td><td>${vm.disk_encryption_resource_group_name}</td></tr>`;
                                            }
                                            vmTable+=`</table>`;
                                    	}else{
                                    		vmTable+=`<h3>#1 : VM Information</h3>`;
                                        	vmTable+=`<table border='1'><tr><td>VM Name</td><td>${vmItem.host_name}</td></tr>`;
//                                      		vmTable+=`<tr><td>Subscription Provision Type</td><td>${vmItem.subscription_provision_type}</td></tr>`;
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
    		                        mailbody = mailbody.replace("{{ORDER_STATUS}}", "Approved");
    		                        mailbody = mailbody.replace("{{REQUEST_TYPE}}", reqObj.item.request_type);
                                    subject = subject.replace("{{REQUEST_TYPE}}", reqObj.item.request_type);
    		                        
    		                        mail.mail({subject : subject, messageBody : mailbody,tomail : reqObj.item.requested_email, ccmails : reqObj.userDetails.email});
    		                        return callback(1,{status:"success", message: "Request updated successfully."});
    		    	    		}else{
    		    	    			return callback(1,{status:"success", message: "Request updated successfully."});
    		    	    		}
    		    	    	});
//    		    			return callback(1,{status:"success", message: "Request updated successfully."});
    		    			resolve([]);
    		    		}
    		        });
    			}
    		}
        });
    });
}

module.exports = {
    getAllCloudNames,
    getAllDCLocations,
    getCopyTypes,
    getTxnDetails,
    getOsTemplates,
    getBillingPrice,
    saveOrderInfo,
    saveOtherCloudOrderInfo,
    ebsResponse,
    saveTxnInfo,
    payFromFunds,
    getCartList,
    getApprovalPendingVmOpsList,
    getJenkinsBuildInformation,
    getTxnSuccessData,
    updateCartItemCount,
    deleteCartItem,
    PgiResponse,
    updateclientfunds,
    getAddonPrice,
    CreateOrUpdateAddonInfo,
    updatePgiSelection,
    getApprovalPendingCartList,
    updateCartItemStatus,
    updateVmOpsStatus
};

