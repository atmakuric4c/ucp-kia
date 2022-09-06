var db = require("../../config/database");
var dbFunc = require("../../config/db-function");
var md5 = require('md5');
const helper=require('../../helpers/common_helper');
const axios = require('axios');
const dbHandler= require('../../config/api_db_handler');
var mail = require("./../../common/mailer.js");
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');
const config=require('../../config/constants');
var querystring = require('querystring');
var base64 = require('base-64');

var authenticModel = {
  authentic,
  adAuthentic,
  signup: signup
};

function authentic(authenticData) {
//	console.log("authenticData");
//	console.log(authenticData);
//	authenticData.company_entity = 'cloud';
	return new Promise(async (resolve, reject) => {
		let TIME_ZONE_result = await dbHandler.executeQueryv2(`select option_value from c4_option_config where option_type = 'TIME_ZONE' and status = 1`);
		let TIME_ZONE = TIME_ZONE_result[0]?.option_value;
		
		if(typeof authenticData.company_entity == 'undefined'){authenticData.company_entity = 'cloud';}
		if(typeof config.COMPANY_ENTITIES[authenticData.company_entity] != 'undefined'){
//			  return resolve({success: false,message: `COMPANY_ENTITIES validated - ${config.COMPANY_ENTITIES[authenticData.company_entity]}`});
			let login_sql = `SELECT user.display_name, user.id, user.email, user.bu_id,
				user.provision_type, user.isSuperAdmin, user.group_id, user.clientid,
				user.password, user.user_role, com.azure_linked, user.azure_account_id,
				bu.bu_name,
				acm.empname as acm_name,
				acm.emailid as acm_email,
				acm.contactno as acm_mobile,
				ROUND(f.amount, 2) as 'available_funds',
				user.isSuperAdmin,
				user.client_master_id
				FROM c4_client_users as user 
				inner join c4_clients as com on com.id=user.clientid 
				inner join bu_info as bu on bu.id = user.bu_id
				left join staff_users as acm on acm.Id = com.acm_id 
				left join c4_aws_client_tokens as act on (act.clientid = com.id and act.record_status = 1)
				left join c4_client_funds as f on (f.clientid = user.clientid and f.fund_type = 'CLOUD')
				WHERE user.email ='${authenticData.email}' and user.status=1 and com.client_entity_id = '${config.COMPANY_ENTITIES[authenticData.company_entity]}'`;
			console.log("login_sql --- ", login_sql);
		  db.query(login_sql, async (error, rows, fields) => {
				dbFunc.connectionRelease;
			  if (error) {
				  console.log(error);
				resolve(error);
			  } else {
				console.log("rows ----- 111111111111 ", rows);
				if(rows.length >0){
					if(rows[0].clientid != 222){
						  resolve({ success: false, message: "Unauthorised login attempt." });
					}
					rows[0].GOBEAR_CLIENT_ID = config.GOBEAR_CLIENT_ID;
					rows[0].APCPDCL_CLIENT_ID = config.APCPDCL_CLIENT_ID;
					rows[0].DISPLAY_ALL_NETWORK_RESOURCES = config.DISPLAY_ALL_NETWORK_RESOURCES;
					rows[0].TIME_ZONE = TIME_ZONE;
					rows[0].TicketOnlyClients = [];
					if(rows[0].is_support_only && rows[0].is_support_only == 1){
						rows[0].TicketOnlyClients = [rows[0].clientid];
					}

					//User roles, resources appednign to user object
					/*await dbHandler.executeQuery(`SELECT r.id, r.name, m.name as module_name, m.id as module_id, rp.read_permission, rp.write_permission, rp.delete_permission FROM user_role user LEFT JOIN roles r ON user.role_id=r.id LEFT JOIN role_permission rp ON r.id=rp.role_id LEFT JOIN modules m ON (rp.module_id=m.id) WHERE user.user_id=${rows[0].id} AND r.record_status=1`, (res) => {
						rows[0].roles = res;
					});*/
					let rg_sql = `SELECT rp.id, rp.user_id, mapping.subscription_id, 
						mapping.role_id, mapping.resource_group, 
						LOWER(resource.name) as name, rp.is_deleted,
						s.display_name as subscription_display_name
						FROM resource_group rp 
						INNER JOIN resource_group_mapping mapping ON (rp.id=mapping.resource_group_id AND mapping.record_status=1) 
						INNER JOIN c4_azure_resourcegroups resource ON  (resource.id=mapping.resource_group) 
						INNER JOIN c4_azure_subscriptions s ON  (s.subscription_id=mapping.subscription_id) 
						WHERE rp.record_status=1 AND rp.user_id=${rows[0].id} AND rp.is_deleted=0`;
					console.log("rg_sql --- ", rg_sql);
					await dbHandler.executeQuery(rg_sql, (res) => {
						rows[0].resource_groups = res;
					});
					console.log("rows ----- 2222222222222 ", rows);
//					return resolve({success: false,message: `get data`});
					let mobile = '';
					var sql=`SELECT * from c4_access_log where userid='${rows[0].id}' and clientid='${rows[0].clientid}' and type='passwordexpired'`;
					await dbHandler.executeQuery(sql,async function(result){	
						try{	
							if(result && result[0] && result[0].createddate){
								var date = new Date();
								var timestamp = await parseInt(date.getTime()/1000);
								var diff=await Math.abs(result[0].createddate-timestamp);

								if(Math.floor((diff)/(60*60*24)) > 45){
									return resolve({ success: false,ispasswordexpired : 1, message: "Password is expired. Please reset your password." });
								}
							}
						}
						catch(e){
							
						}
					});
					await new Promise(async (login_attempts_resolve,login_attempts_reject) => {
						var sql=`SELECT SUM(failed_login_attempts) as failed_login_count FROM c4_login_access WHERE userid = '${rows[0].id}' and status=1`;
						dbHandler.executeQuery(sql,function(result){
							login_attempts_resolve(result)
						});
					}).then(async function(failed_login_attempts){
						await new Promise(async (azure_jobs_resolve,azure_jobs_reject) => {
							var sql=`SELECT jenkin_jobs.job_name, jenkin_jobs.display_job_name, REPLACE( jenkin_jobs.display_job_name, ' ', '-' ) as job_class_name,
							jenkin_jobs.is_resource_group, category.name as category_name
							FROM azure_jenkin_jobs jenkin_jobs INNER JOIN azure_jenkin_job_category category ON (jenkin_jobs.job_category=category.id and category.record_status=1)
							WHERE jenkin_jobs.record_status=1 
							group by jenkin_jobs.job_name
							order by jenkin_jobs.order_number asc `;
							dbHandler.executeQuery(sql,function(result){
								azure_jobs_resolve(result)
							});
						}).then(async function(azure_jobs){
							rows[0].azure_jobs = azure_jobs;
						  isPasswordMatch=0;
						  isMobileMatch=0;
						  if(config.enable_user_encryption == 1){
							  if(authenticData.password == ucpEncryptDecrypt.ucpDecryptForDb(rows[0].password)){
								isPasswordMatch=1;
							  }
							  rows[0].display_name = ((rows[0].display_name)?(await ucpEncryptDecrypt.ucpDecryptForDb(rows[0].display_name)):"");
							  rows[0].phone = ((rows[0].phone)?(await ucpEncryptDecrypt.ucpDecryptForDb(rows[0].phone)):"");
							  rows[0].mobile = ((rows[0].mobile)?(await ucpEncryptDecrypt.ucpDecryptForDb(rows[0].mobile)):"");
						  }else{
							  if(md5(authenticData.password)==rows[0].password){
								  isPasswordMatch=1;
								}
						  }
						  if(authenticData.mobile && authenticData.mobile != rows[0].mobile){
							  isMobileMatch = 0;
							  //console.log("isMobileMatch "+isMobileMatch);
						  }else if(authenticData.mobile && authenticData.mobile == rows[0].mobile){
							  isMobileMatch = 1;
							  //console.log("isMobileMatch "+isMobileMatch);
						  }else if(!authenticData.mobile){
							  isMobileMatch = 1;
						  }
						  	if(failed_login_attempts && failed_login_attempts[0] && failed_login_attempts[0].failed_login_count){
								var failed_login_count = failed_login_attempts[0].failed_login_count;
							}
							else{
								var failed_login_count = 0;
							}
							if(0 && failed_login_count >= 3 && (!authenticData.mobile || (authenticData.mobile && authenticData.mobile == ''))){
								//console.log("failed_login_count "+failed_login_count);
								mobile = "XXXXXXXX"+rows[0].mobile.slice(-2);
								resolve({ success: false,count : failed_login_count,mobile : mobile, message: "Mobile No. is missing" });
							}else{
							  rows[0].available_funds = ((rows[0].available_funds && rows[0].available_funds != '')?(helper.financial( parseFloat(rows[0].available_funds), 2)):"0.00");
							  rows[0].env = config.env;
							  
							  if(failed_login_count >= 3){
								  rows[0].is_failed_login_attempt = 1;
		  //		            	rows[0].otp_status = 1;
							  }else{
								  rows[0].is_failed_login_attempt = 0;
							  }
							  if ((isPasswordMatch && !authenticData.mobile) || (authenticData.mobile && isMobileMatch)) {
								  //update the failed login attempts if records exists in c4_login_access table
								  if(failed_login_count > 0){
									  await dbHandler.updateTableData('c4_login_access',{userid : rows[0].id, status:1},{status:0,updateddate:Math.round(new Date().getTime() / 1000)},async function(err,result){
										  console.log("login attempts updated");
									  });
								  }
								  
								delete rows[0].password;
								if(rows[0].otp_status == 1 || (authenticData.mobile && authenticData.mobile == rows[0].mobile)){
									let otp = helper.getRandomNumber(5);
									var request = require('request');
									var options = {
									  'method': 'POST',
									  'url': config.ADMIN_DOMAIN+'api/v1/index.php/getSmsTemlateDetailsApi',
									  'headers': {
									    'apikey': config.admincenter_apikey_header,
									    'Content-Type': 'application/json'
									  },
									  body: JSON.stringify({
									    "template_name": "OTPUCP"
									  })
	
									};
									request(options, function (error, response) {
									  if (error){ 
	//									  throw new Error(error);
									  	console.log(error);
									  }
	//								  console.log(response.body);
									  sms_template = JSON.parse(response.body);
									  
									  smsData = {
												message : `Your OTP for UCP Portal Login : ${otp}. Logged in IP : ${authenticData.clientIp} - Cloud4C Services`,
												mobileno : rows[0].mobile,
												staffid : rows[0].id,
												userid : rows[0].id,
												clientid : rows[0].clientid,
												template_id : ((sms_template && sms_template.data && sms_template.data.template_id)?sms_template.data.template_id:"")
										};
					  //            	  rows[0].email = "rajesh.ponyaboina@cloud4c.com";
										dbHandler.updateTableData('c4_client_users',{id:rows[0].id},{last_otp:otp},function(err,result){
											mail.mail('UCP Cloud4C :: Login OTP Alert !',smsData.message,rows[0].email);
											helper.sendsms(smsData,function(err,result){
												console.log("sms result :: ");
												
												resolve(rows[0]);
											});
										})
									});
								}else{
									//console.log(rows[0])
									return resolve(rows[0]);
								}
							  } else {
								  new Promise(async (failed_login_attempts_resolve,failed_login_attempts_reject) => {
									  let count = 0;
									  var sql=`SELECT * FROM c4_login_access WHERE userid = '${rows[0].id}' and status=1`;
									  await dbHandler.executeQuery(sql,async function(result){
										  //console.log("result");
										  //console.log(result);
										  let login_access_record = {};
										  await result.forEach(async function(val,key) {
											  if(val.ip_address == authenticData.clientIp){
												  login_access_record = val;
											  }
											  count = count+val.failed_login_attempts;
										  });
										  //console.log("login_access_record");
										  //console.log(login_access_record);
										  if(Object.keys(login_access_record).length > 0){
											  await dbHandler.updateTableData('c4_login_access',{id:login_access_record.id},{failed_login_attempts:(login_access_record.failed_login_attempts+1),updateddate:Math.round(new Date().getTime() / 1000)},async function(err,result){
												  count++;
		  //		                				console.log("5555555555 "+count);
												  failed_login_attempts_resolve(count);
											  });
										  }else{
											  let login_access_data = {userid:rows[0].id,ip_address:authenticData.clientIp,failed_login_attempts:1,createddate:Math.round(new Date().getTime() / 1000),status:1};
		  //		                			console.log("login_access_data");
		  //		                        	console.log(login_access_data);
											  await dbHandler.insertIntoTable('c4_login_access',login_access_data,function(err,result){
												  count++;
		  //		                                console.log("11111111111 "+count);
												  failed_login_attempts_resolve(count);
											  })
										  }
									  });
								  }).then(async function(count){
									  console.log("count "+count);
									  if(count >= 3){
										  mobile = "XXXXXXXX"+rows[0].mobile.slice(-2);
									  }
									  if(!isMobileMatch){
										  resolve({ success: false,count : count,mobile : mobile, message: "Mobile No. doesn't match" });
	//								  }else if(isPasswordMatch && !isMobileMatch){
	//									  resolve({ success: false,count : count,mobile : mobile, message: "Mobile No. doesn't match" });
	//								  }else if(!isPasswordMatch && !isMobileMatch){
	//									  resolve({ success: false,count : count,mobile : mobile, message: "Password and Mobile No. doesn't match" });
									  }else{
										  resolve({ success: false,count : count,mobile : mobile, message: "Password doesn't match" });
									  }
								  });
							  }
							}
						});
					});
				}else{
				  resolve({ success: false, message: "User doesn't exist" });
				}
			  }
			}
		  );
		}else{
			  resolve({success: false,message: "Invalid company_entity"});
		}
	});
}

function adAuthentic(authenticData) {
//	authenticData.company_entity = 'cloud';
	return new Promise(async (resolve, reject) => {
		let TIME_ZONE_result = await dbHandler.executeQueryv2(`select option_value from c4_option_config where option_type = 'TIME_ZONE' and status = 1`);
		let TIME_ZONE = TIME_ZONE_result[0]?.option_value;
		
		if(typeof authenticData.company_entity == 'undefined'){authenticData.company_entity = 'cloud';}
		if(typeof config.COMPANY_ENTITIES[authenticData.company_entity] != 'undefined'){
			authenticData.user = authenticData.userId
//			  return resolve({success: false,message: `COMPANY_ENTITIES validated - ${config.COMPANY_ENTITIES[authenticData.company_entity]}`});
			let login_sql = `SELECT user.display_name, user.id, user.email, user.bu_id,
				user.provision_type, user.isSuperAdmin, user.group_id, user.clientid,
				user.user_role, user.azure_account_id,
				bu.bu_name, com.azure_linked,
				acm.empname as acm_name,
				acm.emailid as acm_email,
				acm.contactno as acm_mobile,
				ROUND(f.amount, 2) as 'available_funds',
				user.isSuperAdmin,
				user.client_master_id
				FROM c4_client_users as user 
				inner join c4_clients as com on com.id=user.clientid 
				inner join bu_info as bu on bu.id = user.bu_id
				left join staff_users as acm on acm.Id = com.acm_id 
				left join c4_aws_client_tokens as act on (act.clientid = com.id and act.record_status = 1)
				left join c4_client_funds as f on (f.clientid = user.clientid and f.fund_type = 'CLOUD')
				WHERE user.id ='${authenticData.user}' and user.status=1 and com.client_entity_id = '${config.COMPANY_ENTITIES[authenticData.company_entity]}'`;
		  db.query(login_sql, async (error, rows, fields) => {

				dbFunc.connectionRelease;
			  if (error) {
				  console.log("error --- ", error);
				resolve(error);
			  } else {
				  console.log("rows --- ", rows);
				if(rows.length >0){
					if(rows[0].clientid != 222){
						  resolve({ success: false, message: "Unauthorised login attempt." });
					}
					rows[0].GOBEAR_CLIENT_ID = config.GOBEAR_CLIENT_ID;
					rows[0].APCPDCL_CLIENT_ID = config.APCPDCL_CLIENT_ID;
					rows[0].DISPLAY_ALL_NETWORK_RESOURCES = config.DISPLAY_ALL_NETWORK_RESOURCES;
					rows[0].TIME_ZONE = TIME_ZONE;
					rows[0].TicketOnlyClients = [];
					if(rows[0].is_support_only && rows[0].is_support_only == 1){
						rows[0].TicketOnlyClients = [rows[0].clientid];
					}

					//User roles, resources appednign to user object
					/*await dbHandler.executeQuery(`SELECT r.id, r.name, m.name as module_name, m.id as module_id, rp.read_permission, rp.write_permission, rp.delete_permission FROM user_role user LEFT JOIN roles r ON user.role_id=r.id LEFT JOIN role_permission rp ON r.id=rp.role_id LEFT JOIN modules m ON (rp.module_id=m.id) WHERE user.user_id=${rows[0].id} AND r.record_status=1`, (res) => {
						rows[0].roles = res;
					});*/
					let rg_sql = `SELECT rp.id, rp.user_id, mapping.subscription_id, 
						mapping.role_id, mapping.resource_group, 
						LOWER(resource.name) as name, rp.is_deleted,
						s.display_name as subscription_display_name
						FROM resource_group rp 
						INNER JOIN resource_group_mapping mapping ON (rp.id=mapping.resource_group_id AND mapping.record_status=1) 
						INNER JOIN c4_azure_resourcegroups resource ON  (resource.id=mapping.resource_group) 
						INNER JOIN c4_azure_subscriptions s ON  (s.subscription_id=mapping.subscription_id) 
						WHERE rp.record_status=1 AND rp.user_id=${rows[0].id} AND rp.is_deleted=0`;
					console.log("rg_sql --- ", rg_sql);
					await dbHandler.executeQuery(rg_sql, (res) => {
						rows[0].resource_groups = res;
					});
					

//					return resolve({success: false,message: `get data`});
					let mobile = '';
					var sql=`SELECT * from c4_access_log where userid='${rows[0].id}' and clientid='${rows[0].clientid}' and type='passwordexpired'`;
					await dbHandler.executeQuery(sql,async function(result){	
						try{	
							if(result && result[0] && result[0].createddate){
								var date = new Date();
								var timestamp = await parseInt(date.getTime()/1000);
								var diff=await Math.abs(result[0].createddate-timestamp);
								if(Math.floor((diff)/(60*60*24)) > 45){
									return resolve({ success: false,ispasswordexpired : 1, message: "Password is expired. Please reset your password." });
								}
							}
						}
						catch(e){
							
						}
					});
					await new Promise(async (login_attempts_resolve,login_attempts_reject) => {
						var sql=`SELECT SUM(failed_login_attempts) as failed_login_count FROM c4_login_access WHERE userid = '${rows[0].id}' and status=1`;
						dbHandler.executeQuery(sql,function(result){
							login_attempts_resolve(result)
						});
					}).then(async function(failed_login_attempts){
						await new Promise(async (azure_jobs_resolve,azure_jobs_reject) => {
							var sql=`SELECT jenkin_jobs.job_name, jenkin_jobs.display_job_name, REPLACE( jenkin_jobs.display_job_name, ' ', '-' ) as job_class_name,
							jenkin_jobs.is_resource_group, category.name as category_name
							FROM azure_jenkin_jobs jenkin_jobs INNER JOIN azure_jenkin_job_category category ON (jenkin_jobs.job_category=category.id and category.record_status=1)
							WHERE jenkin_jobs.record_status=1 
							group by jenkin_jobs.job_name
							order by jenkin_jobs.order_number asc`;
							dbHandler.executeQuery(sql,function(result){
								azure_jobs_resolve(result)
							});
						}).then(async function(azure_jobs){
							rows[0].azure_jobs = azure_jobs;
						  isPasswordMatch=1;
						  isMobileMatch=0;
						  if(config.enable_user_encryption == 1){
							  if(authenticData.password == ucpEncryptDecrypt.ucpDecryptForDb(rows[0].password)){
								isPasswordMatch=1;
							  }
							  rows[0].display_name = ((rows[0].display_name)?(await ucpEncryptDecrypt.ucpDecryptForDb(rows[0].display_name)):"");
							  rows[0].phone = ((rows[0].phone)?(await ucpEncryptDecrypt.ucpDecryptForDb(rows[0].phone)):"");
							  rows[0].mobile = ((rows[0].mobile)?(await ucpEncryptDecrypt.ucpDecryptForDb(rows[0].mobile)):"");
						  }else{
							  if(md5(authenticData.password)==rows[0].password){
								  isPasswordMatch=1;
								}
						  }
						  if(authenticData.mobile && authenticData.mobile != rows[0].mobile){
							  isMobileMatch = 0;
						  }else if(authenticData.mobile && authenticData.mobile == rows[0].mobile){
							  isMobileMatch = 1;
						  }else if(!authenticData.mobile){
							  isMobileMatch = 1;
						  }
						  	if(failed_login_attempts && failed_login_attempts[0] && failed_login_attempts[0].failed_login_count){
								var failed_login_count = failed_login_attempts[0].failed_login_count;
							}
							else{
								var failed_login_count = 0;
							}
							if(0 && failed_login_count >= 3 && (!authenticData.mobile || (authenticData.mobile && authenticData.mobile == ''))){
								mobile = "XXXXXXXX"+rows[0].mobile.slice(-2);
								resolve({ success: false,count : failed_login_count,mobile : mobile, message: "Mobile No. is missing" });
							}else{
							  rows[0].available_funds = ((rows[0].available_funds && rows[0].available_funds != '')?(helper.financial( parseFloat(rows[0].available_funds), 2)):"0.00");
							  rows[0].env = config.env;
							  
							  if(failed_login_count >= 3){
								  rows[0].is_failed_login_attempt = 1;
		  //		            	rows[0].otp_status = 1;
							  }else{
								  rows[0].is_failed_login_attempt = 0;
							  }
							  if ((isPasswordMatch && !authenticData.mobile) || (authenticData.mobile && isMobileMatch)) {
								  //update the failed login attempts if records exists in c4_login_access table
								  if(failed_login_count > 0){
									  await dbHandler.updateTableData('c4_login_access',{userid : rows[0].id, status:1},{status:0,updateddate:Math.round(new Date().getTime() / 1000)},async function(err,result){
										  console.log("login attempts updated");
									  });
								  }
								  
								delete rows[0].password;
								if(rows[0].otp_status == 1 || (authenticData.mobile && authenticData.mobile == rows[0].mobile)){
									let otp = helper.getRandomNumber(5);
									var request = require('request');
									var options = {
									  'method': 'POST',
									  'url': config.ADMIN_DOMAIN+'api/v1/index.php/getSmsTemlateDetailsApi',
									  'headers': {
									    'apikey': config.admincenter_apikey_header,
									    'Content-Type': 'application/json'
									  },
									  body: JSON.stringify({
									    "template_name": "OTPUCP"
									  })
	
									};
									request(options, function (error, response) {
									  if (error){ 
	//									  throw new Error(error);
									  	console.log(error);
									  }
	//								  console.log(response.body);
									  sms_template = JSON.parse(response.body);
									  
									  smsData = {
												message : `Your OTP for UCP Portal Login : ${otp}. Logged in IP : ${authenticData.clientIp} - Cloud4C Services`,
												mobileno : rows[0].mobile,
												staffid : rows[0].id,
												userid : rows[0].id,
												clientid : rows[0].clientid,
												template_id : ((sms_template && sms_template.data && sms_template.data.template_id)?sms_template.data.template_id:"")
										};
					  //            	  rows[0].email = "rajesh.ponyaboina@cloud4c.com";
										dbHandler.updateTableData('c4_client_users',{id:rows[0].id},{last_otp:otp},function(err,result){
											mail.mail('UCP Cloud4C :: Login OTP Alert !',smsData.message,rows[0].email);
											helper.sendsms(smsData,function(err,result){
												console.log("sms result :: ");
												resolve(rows[0]);
											});
										})
									});
								}else{
									//console.log(rows[0])
									return resolve(rows[0]);
								}
							  } else {
								  new Promise(async (failed_login_attempts_resolve,failed_login_attempts_reject) => {
									  let count = 0;
									  var sql=`SELECT * FROM c4_login_access WHERE userid = '${rows[0].id}' and status=1`;
									  await dbHandler.executeQuery(sql,async function(result){
										  //console.log("result");
										  //console.log(result);
										  let login_access_record = {};
										  await result.forEach(async function(val,key) {
											  if(val.ip_address == authenticData.clientIp){
												  login_access_record = val;
											  }
											  count = count+val.failed_login_attempts;
										  });
										  //console.log("login_access_record");
										  //console.log(login_access_record);
										  if(Object.keys(login_access_record).length > 0){
											  await dbHandler.updateTableData('c4_login_access',{id:login_access_record.id},{failed_login_attempts:(login_access_record.failed_login_attempts+1),updateddate:Math.round(new Date().getTime() / 1000)},async function(err,result){
												  count++;
		  //		                				console.log("5555555555 "+count);
												  failed_login_attempts_resolve(count);
											  });
										  }else{
											  let login_access_data = {userid:rows[0].id,ip_address:authenticData.clientIp,failed_login_attempts:1,createddate:Math.round(new Date().getTime() / 1000),status:1};
		  //		                			console.log("login_access_data");
		  //		                        	console.log(login_access_data);
											  await dbHandler.insertIntoTable('c4_login_access',login_access_data,function(err,result){
												  count++;
		  //		                                console.log("11111111111 "+count);
												  failed_login_attempts_resolve(count);
											  })
										  }
									  });
								  }).then(async function(count){
									  console.log("count "+count);
									  if(count >= 3){
										  mobile = "XXXXXXXX"+rows[0].mobile.slice(-2);
									  }
									  if(!isMobileMatch){
										  resolve({ success: false,count : count,mobile : mobile, message: "Mobile No. doesn't match" });
	//								  }else if(isPasswordMatch && !isMobileMatch){
	//									  resolve({ success: false,count : count,mobile : mobile, message: "Mobile No. doesn't match" });
	//								  }else if(!isPasswordMatch && !isMobileMatch){
	//									  resolve({ success: false,count : count,mobile : mobile, message: "Password and Mobile No. doesn't match" });
									  }else{
										  resolve({ success: false,count : count,mobile : mobile, message: "Password doesn't match" });
									  }
								  });
							  }
							}
						});
					});
				}else{
				  resolve({ success: false, message: "User doesn't exist" });
				}
			  }
			}
		  );
		}else{
			  resolve({success: false,message: "Invalid company_entity"});
		}
	});
}
  

function signup(user) {
//	user.company_entity = 'ctrls';
  return new Promise(async (resolve, reject) => {
	  if(typeof user.company_entity == 'undefined'){user.company_entity = 'cloud';}
	  if(typeof config.COMPANY_ENTITIES[user.company_entity] != 'undefined'){
//		  return resolve({success: false,message: `COMPANY_ENTITIES validated - ${config.COMPANY_ENTITIES[user.company_entity]}`});
//		  console.log(config.ADMIN_DOMAIN+'api/v1/index.php/checkUserPwdPolicy');
		  let pwdCheckObj = {"validateType":"only_password","user_type":"","user_id":"","password":user.password};
//		  console.log(pwdCheckObj);
		await axios.post(config.ADMIN_DOMAIN+'api/v1/index.php/checkUserPwdPolicy', pwdCheckObj).then(response => {
//			console.log("response");
//			console.log(response);
			if(response.data.status=='error'){
				return resolve({
		              success: false,message: response.data.message});
			}
		}).catch(error=>{
			return resolve({
	              success: false,message: `Password validation failed`});
		})
        db.query(
          "SELECT * FROM c4_client_users WHERE email='" +
            user.email +
            "' and status=1",
          (error, rows, fields) => {
        	  dbFunc.connectionRelease;
            if (error) {
              resolve(error);
            } else if (rows.length > 0) {
              resolve({
                success: false,
                message: "User already exist ! try with different user"
              });
            } else {
            	db.query("SELECT * FROM c4_client_users WHERE status=1", async (error, rows, fields) => {
            		dbFunc.connectionRelease;
                  if (error) {
                    resolve(error);
                  } else{
                	  let mobileExists = 0;
                	  let i = 1;
                	  for await (const item of rows) {
                		  if(item.mobile){
                			  if(config.enable_user_encryption == 1){
    	            			  existedMobileNo = await ucpEncryptDecrypt.ucpDecryptForDb(item.mobile);
    	            			  existedPhoneNo = await ucpEncryptDecrypt.ucpDecryptForDb(item.phone);
                			  }else{
                				  existedMobileNo = item.mobile;
    	            			  existedPhoneNo = item.phone;
                			  }
                			  if(parseInt(existedMobileNo) == parseInt(user.mobile) 
                					  || parseInt(existedPhoneNo) == parseInt(user.mobile)){
                				  mobileExists = true;
                				  break;
                			  }
                		  }
                		  i++;
                	  }
                	  if (mobileExists) {
    	                resolve({
    	                  success: false,
    	                  message: "user already exist with this mobile number! try with different user"
    	                });
    	              } else {
			              let cts = Math.round(new Date().getTime() / 1000);
			              var clientValues = {
			                company_name: user.company_name,
			                email: user.email,
			                mobile: user.mobile,
			                status: 1,
			                client_entity_id : config.COMPANY_ENTITIES[user.company_entity],
			                createddate: cts
			              };
			              var userValues = {
			                email: user.email,
			                mobile: user.mobile,
			                password: user.password,
			                display_name : user.email,
			                status: 1,
			                user_role: 1,
			                createddate: cts,
			                clientid: ""
			              };
//			              console.log("clientValues");
//			              console.log(clientValues);
//			              console.log("userValues");
//			              console.log(userValues);
//			              return resolve({success: false,message: `entered into before insert stmt`});
			              db.query(
			                "INSERT INTO c4_clients SET ?",
			                clientValues,
			                async (error, rows, fields) => {
			                	dbFunc.connectionRelease;
			                  if (error) {
			                    resolve(error);
			                  } else {
			                    userValues.clientid = rows.insertId;
			                    db.query(
					                "INSERT INTO c4_client_master SET ?",
					                clientValues,
					                async (error, master_rows, fields) => {
					                	dbFunc.connectionRelease;
					                  if (error) {
					                    resolve(error);
					                  } else {
					                	userValues.client_master_id = master_rows.insertId;
					                	await dbHandler.updateTableData('c4_clients',{id:userValues.clientid},{client_master_id : userValues.client_master_id},async function(err,result){
											  console.log("client_master_id in c4_clients updated");
										  });
					                    if(config.enable_user_encryption == 1){
							                userValues.display_name = ((userValues.display_name)?(await ucpEncryptDecrypt.ucpEncryptForDb(userValues.display_name)):"");
							                userValues.password = ((userValues.password)?(await ucpEncryptDecrypt.ucpEncryptForDb(userValues.password)):"");
							                userValues.mobile = ((userValues.mobile)?(await ucpEncryptDecrypt.ucpEncryptForDb(userValues.mobile)):"");
						                }else{
						                	userValues.password = md5(userValues.password);
						                }
					                    db.query(
					                      "INSERT INTO c4_client_users SET ?",
					                      userValues,
					                      (error, rows, fields) => {
					                    	  dbFunc.connectionRelease;
					                        if (error) {
					                          resolve(error);
					                        } else {
					                          resolve(rows);
					                        }
					                      }
					                    );
					                  }
					                }
					              );
			                  }
			                }
			              );
    	              }
                  }
                });
            }
          }
        );
	  }else{
		  resolve({
              success: false,
              message: "Invalid company_entity"
            });
	  }
  });
}

module.exports = authenticModel;
