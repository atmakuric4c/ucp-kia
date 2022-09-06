const dbHandler= require('../config/api_db_handler')
var db = require('../config/database');
var dbFunc = require('../config/db-function');
const helper = require('../helpers/common_helper')
const axios = require('axios')
const in_array = require('in_array');
const dateFormat = require('dateformat');
const request=require('request')
const querystring = require('querystring');
const config=require('../config/constants');
var base64 = require('base-64');
const ordersModel=require('../app/models/orders.model');
var {LocalStorage} = require('node-localstorage');
const {google} = require('googleapis');
const { promises } = require('dns');
const { response } = require('express');
const { networkInterfaces } = require('os');

let gcpOauth=(req,res)=>{
	if(!req.query.clientid)
		res.redirect(config.GCP.gcp_error_url);
	if(!req.query.gcp_client_id)
		res.redirect(config.GCP.gcp_error_url);
	if(!req.query.gcp_client_secret_key)
		res.redirect(config.GCP.gcp_error_url);
	
	localStorage = new LocalStorage('./scratch')

	localStorage.setItem('ucp-gcp', JSON.stringify(req.query));
	console.log(localStorage.getItem('ucp-gcp'))
	
	/**
	 * Create a new OAuth2 client with the configured keys.
	 */
	const oauth2Client = new google.auth.OAuth2(
	//  keys.client_id,
	//  keys.client_secret,
	//  keys.redirect_uris[0]
//		'534932766114-ncnt9t8g43cnogumvek67bk0marhm3k7.apps.googleusercontent.com',
//		'LmOQaUXmZrenu1fdO5rGS2Cp',
		req.query.gcp_client_id,
		req.query.gcp_client_secret_key,
		config.API_URL+'gcp/gcpReturnUrl'
	);
	/**
	 * This is one of the many ways you can configure googleapis to use authentication credentials.  In this method, we're setting a global reference for all APIs.  Any other API you use here, like google.drive('v3'), will now use this auth client. You can also override the auth client at the service and method call levels.
	 */
	google.options({auth: oauth2Client});
	
	const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/cloud-platform',
    });
		
//		open(authorizeUrl, {wait: false}).then(cp => cp.unref());
	res.redirect(authorizeUrl);
}

let gcpReturnUrl=(req,callback)=>{
	localStorage = new LocalStorage('./scratch')
	
//	localStorage.setItem('ucp-gcp', JSON.stringify({"gcp_client_id":"534932766114-ilq5oend23vb5rbdd19e9fl4vbn12lb3.apps.googleusercontent.com","gcp_client_secret_key":"GYqFU6gJECNoRNXd88e1NPI0","clientid":"222"}));
	
	console.log("gcpReturnUrl "+localStorage.getItem('ucp-gcp'))
	let ucp_gcp = JSON.parse(localStorage.getItem('ucp-gcp'));
	
	localStorage._deleteLocation()
	console.log("gcpReturnUrl "+localStorage.getItem('ucp-gcp'));
	console.log("ucp_gcp.gcp_client_id "+((ucp_gcp && ucp_gcp.gcp_client_id)?ucp_gcp.gcp_client_id:""));
	
	let res = {status:"error","message":"Invalid Credentials."};
	if(!ucp_gcp || !ucp_gcp.clientid)
		return callback(1,res);
	if(!ucp_gcp || !ucp_gcp.gcp_client_id)
		return callback(1,res);
	if(!ucp_gcp || !ucp_gcp.gcp_client_secret_key)
		return callback(1,res);
	
	let redirectUrl = '';
	if(ucp_gcp && ucp_gcp.redirectUrl){
		redirectUrl = ucp_gcp.redirectUrl;
	}
	
	var client_sql=`select * from c4_clients where id='${ucp_gcp.clientid}' limit 1`;
    // console.log("client_sql");
    // console.log(client_sql);
    dbHandler.executeQuery(client_sql,function(client_results){
    	if(client_results.length > 0){
    		let res = {status:"error","message":"Invalid Credentials.",client_entity_id:client_results[0].client_entity_id,redirectUrl:redirectUrl};
			/**
			 * Create a new OAuth2 client with the configured keys.
			 */
			const oauth2Client = new google.auth.OAuth2(
			//  keys.client_id,
			//  keys.client_secret,
			//  keys.redirect_uris[0]
		//			'534932766114-ncnt9t8g43cnogumvek67bk0marhm3k7.apps.googleusercontent.com',
		//			'LmOQaUXmZrenu1fdO5rGS2Cp',
					ucp_gcp.gcp_client_id,
					ucp_gcp.gcp_client_secret_key,
					config.API_URL+'gcp/gcpReturnUrl'
			)
	        console.log('entered in then block!');
	        console.log("req.query.code");
			console.log(req.query.code);
			if(req.query.code){
				new Promise(async (resolve, reject) => {
					try{
						const {tokens} = await oauth2Client.getToken(req.query.code);
						 console.log(tokens);
				        if(tokens.access_token){
				        	let clientUpdateData = {
			      			  gcp_client_id : ucp_gcp.gcp_client_id,
			      			  gcp_client_secret_key : ucp_gcp.gcp_client_secret_key,
			                    updateddate : (new Date().getTime() / 1000),
			                    is_gcp_enabled : 1
			                };
			                console.log("clientUpdateData");
			                console.log(clientUpdateData);
			                
			                await dbHandler.updateTableData('c4_clients',{'id':ucp_gcp.clientid},clientUpdateData,function(err,result){
					            var sql=`select * from c4_gcp_client_tokens where clientid='${ucp_gcp.clientid}' limit 1`;
					            // console.log("sql");
					            // console.log(sql);
					            dbHandler.executeQuery(sql,function(results){
						            // console.log("results");
						            // console.log(results);
						            if(results.length > 0){
						            	var tokendata={
						            			access_token:tokens.access_token,
						            			refresh_token : tokens.refresh_token,
						            			token_type:tokens.token_type,
						            			expiry_date:0,
						            			response_obj : JSON.stringify(tokens),
						            			updated_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
					    	              }
						            	dbHandler.updateTableData('c4_gcp_client_tokens',{clientid:ucp_gcp.clientid},tokendata,function(err,result){
							            	  let res = {status:"success","message":"Valid Credentials.",client_entity_id:client_results[0].client_entity_id,redirectUrl:redirectUrl};
							                  return callback(null,res);
							              });
						            }else{
						              var tokendata={
						            		clientid:ucp_gcp.clientid,
					            			access_token:tokens.access_token,
					            			refresh_token : tokens.refresh_token,
					            			token_type:tokens.token_type,
					            			expiry_date:0,
					            			response_obj : JSON.stringify(tokens),
					            			created_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
						              }
						              dbHandler.insertIntoTable('c4_gcp_client_tokens',tokendata,function(err,result){
					                    	  let res = {status:"success","message":"Valid Credentials.",client_entity_id:client_results[0].client_entity_id,redirectUrl:redirectUrl};
					    	                  return callback(null,res);
						              });
						            }
					            });
			                });
				            	
				        }else{
				        	let res = {status:"error","message":"Invalid Credentials.",client_entity_id:client_results[0].client_entity_id,redirectUrl:redirectUrl};
			                return callback(1,res);
				        }
		    		}
		            catch{
		            	let res = {status:"error","message":"Invalid Credentials.",client_entity_id:client_results[0].client_entity_id,redirectUrl:redirectUrl};
		                return callback(1,res);
		            }
			       
				});
			}
    	}else{
    		let res = {status:"error","message":"Invalid request.",redirectUrl:redirectUrl};
            return callback(1,res);
    	}
    });
}

let gcp_authtoken=(clientid,callback)=>{
  if(typeof clientid == 'undefined'){
      return callback(null,[]);
  }else{
      new Promise(function(resolve,reject){
          dbHandler.getOneRecord('c4_clients',{id:clientid},function(result){
              resolve(result)
          })
      }).then(function(config){
        var crypto = require('crypto');
        config.mdclientid = crypto.createHash('md5').update(""+config.id).digest("hex");
        config.base64_clientid = base64.encode (config.id);
        // console.log("config");
        // console.log(config);
        var currentTime=Math.floor(Date.now() / 1000);
//      console.log("currentTime");
//         console.log(currentTime);
        var sql=`select * from c4_gcp_client_tokens where clientid='${config.id}' order by id desc limit 1`;
//         console.log("sql");
//         console.log(sql);
        dbHandler.executeQuery(sql,function(results){
//         console.log("results");
//         console.log(results);
        if(results.length == 0){
        	return callback(null,[]);
        }else if(results.length > 0 && results[0].expiry_date > currentTime){
            var response={data:results[0].id,tokendata:results[0],message:'Token Exists',clientdata:config};
            // console.log("ifff response");
            // console.log(response);
            return callback(null,response)
        }else{
          var request = require('request');
          var options = {
            'method': 'POST',
            'url': 'https://www.googleapis.com/oauth2/v4/token',
            'headers': {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
              'client_id': config.gcp_client_id,
              'client_secret': config.gcp_client_secret_key,
              'refresh_token': results[0].refresh_token,
              'grant_type': 'refresh_token'
            }
          };
          request(options, function (error, response) {
            if (error) {
            	//throw new Error(error);
            	return callback(null,[]);
            }else{
//            	console.log(response.body);
            	response.body = JSON.parse(response.body);
//            	console.log(response.body);
//            	console.log(response.body.access_token);
            	var tokendata={
            			access_token: response.body.access_token,
            			token_type:response.body.token_type,
            			expiry_date: (parseInt(currentTime) + parseInt(response.body.expires_in)),
            			response_obj : JSON.stringify(response.body),
            			updated_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
	              }
//            	console.log("tokendata");
//            	console.log(tokendata);
            	dbHandler.updateTableData('c4_gcp_client_tokens',{clientid:config.id},tokendata,function(err,result){
            		var response={data:results[0].id,tokendata:tokendata,message:'Token Exists',clientdata:config};
            		return callback(null,response)
            	});
            }
          });
        }
      });
    }); 
  }
}

/*
Author: Rajesh
Descri: sync project list
Date  : 07-07-2020
*/
let syncGcpProjectList= async (reqObj,callback)=>{
  // console.log(reqObj);
  let sql = `Select c.* from c4_clients as c 
  where c.status = 1 and c.is_gcp_enabled = 1`;
  if(typeof reqObj.id != 'undefined'){
      sql += ` and c.id = ${reqObj.id} order by id desc limit 1`;
  }else{
      sql += ` order by id asc`;
  }
  // sql += ' limit 1';
  //console.log(sql);
  await new Promise(function(resolve, reject) {
      dbHandler.executeQuery(sql,async function(GcpClients){
          // console.log("GcpClients");
          // console.log(GcpClients);
          try{
              if (GcpClients.length > 0) {
                  for await (const item of GcpClients) {
                      await new Promise(async function(itemResolve, itemReject){
                        await new Promise(function(resolve,reject){
                          gcp_authtoken(item.id, function(error, result){
                            // console.log("result");
                            // console.log(result);
                            // if(error){
                            //     resolve([])
                            // }else{
                                resolve(result)
                            // }
                          })
                        }).then(async function(token){
                          // console.log("token");
                          // console.log(token);
                          if(token.tokendata.length == 0){
                            var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
                            itemResolve(response);
                          }else{
                        	  var options = {
                        	    'method': 'GET',
                        	    'url': 'https://cloudresourcemanager.googleapis.com/v1/projects',
                        	    'headers': {
                        	      'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
                        	    },
                        	    'data' : ""
                        	  };
//                        	  console.log("options");
//                              console.log(options);
                        	  
                              await axios(options)
                              .then(async response => {
//                        		  console.log("response.data");
//                        		  console.log(response.data);
                        	    	if (response.data.projects.length == 0) {
                        	    		console.log("No projects found for client id "+item.id);
                        	    	}else{
	                        	    	for await (const project of response.data.projects) {
	                                        await new Promise(async function(projectResolve, projectReject){
	                                            let projectSql = `SELECT * from c4_gcp_projects
	                                            where clientid = '${item.id}' and projectNumber = '${project.projectNumber}'`;
//	                                             console.log("projectSql");
//	                                             console.log(projectSql);
	                                            await dbHandler.executeQuery(projectSql,async function(projectInfo){
//	                                                 console.log("projectInfo");
//	                                                 console.log(projectInfo);
	                                                if(projectInfo.length > 0){
	                                                    let updateData = {
                                                    		projectNumber : project.projectNumber,
                                                    		projectId : project.projectId,
                                                    		lifecycleState : project.lifecycleState,
                                                    		name : project.name,
                                                    		response_obj : JSON.stringify(project),
                                                    		updated_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
	                                                    };
//	                                                     console.log("updateData");
//	                                                     console.log(updateData);
	                                                    await dbHandler.updateTableData('c4_gcp_projects',{'id':projectInfo[0].id},updateData,async function(err,result){
	                                                    	var options = {
                                                        	    'method': 'GET',
                                                        	    'url': 'https://compute.googleapis.com/compute/v1/projects/'+project.projectId,
                                                        	    'headers': {
                                                        	      'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
                                                        	    },
                                                        	    'data' : ""
                                                        	  };
	                                                        	  console.log("options");
	                                                              console.log(options);
	                                                    	
	                                                    	await axios(options)
	                                                        .then(async projectDetailResponse => {
	                                                  		  console.log("projectDetailResponse.data");
	                                                  		  console.log(projectDetailResponse.data);
	                                                  	    	if (!projectDetailResponse.data.name) {
	                                                  	    		console.log("No projects found for client id "+item.id);
	                                                  	    	}else{
	                                                  	    		await new Promise(async function(projectDetailResolve, projectDetailReject){
	                    	                                            let projectDetailSql = `SELECT * from c4_gcp_project_details
	                    	                                            where clientid = '${item.id}' and name = '${projectDetailResponse.data.name}'`;
//	                    	                                             console.log("projectDetailSql");
//	                    	                                             console.log(projectDetailSql);
	                    	                                            await dbHandler.executeQuery(projectDetailSql,async function(projectDetailInfo){
//	                    	                                                 console.log("projectDetailInfo");
//	                    	                                                 console.log(projectDetailInfo);
	                    	                                                if(projectDetailInfo.length > 0){
	                    	                                                    let updateProjectDetailData = {
	                    	                                                    		defaultNetworkTier : projectDetailResponse.data.defaultNetworkTier,
		                                                                        		response_obj : JSON.stringify(projectDetailResponse.data),
		                                                                        		updated_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
	                    	                                                    };
//	                    	                                                     console.log("updateData");
//	                    	                                                     console.log(updateData);
	                    	                                                    await dbHandler.updateTableData('c4_gcp_project_details',{'id':projectDetailInfo[0].id},updateProjectDetailData, async function(err,result){
	                    	                                                    	console.log("updated the updateProjectDetailData with id "+projectDetailInfo[0].id);
	                    	                                                    	projectDetailResolve("updated the updateProjectDetailData with id "+projectDetailInfo[0].id);
	                    	                                                    });
	                    	                                                }else{
	                    	                                                    let insProjectDetailData = {
	                                                                        		clientid : item.id,
	                    	                                                  		name : projectDetailResponse.data.name,
                    	                                                    		defaultNetworkTier : projectDetailResponse.data.defaultNetworkTier,
	                    	                                                  		response_obj : JSON.stringify(projectDetailResponse.data),
	                    	                                                  		created_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
	                    	                                                    };
//	                    	                                                     console.log("insProjectDetailData");
//	                    	                                                     console.log(insProjectDetailData);
	                    	                                                    await dbHandler.insertIntoTable('c4_gcp_project_details',insProjectDetailData,async function(error,projectDetailId){
	                    	                                                        console.log("inserted the updateProjectDetailData with id "+projectDetailId);
	                    	                                                        projectDetailResolve("inserted the updateProjectDetailData with id "+projectDetailId);
	                    	                                                    });
	                    	                                                }
	                    	                                            });
	                                                  	    		});
	                                                  	    	}
	                                                        }).catch(error => {
	                                                            console.log("error");
	                                                            let res = {status:"error",message:error};
	                                                            if(error && error.response && error.response.data
	                                                          		  && error.response.data.error 
	                                                          		  && error.response.data.error.message){
	                                                          	  res.message = error.response.data.error.message
	                                                            }
	                                                            console.log(res);
	                                                            projectResolve(res);
	                                                        });
	                                                    	console.log("updated the projectInfo with id "+projectInfo[0].id);
	                                                        projectResolve("updated the projectInfo with id "+projectInfo[0].id);
	                                                    });
	                                                }else{
	                                                    let insData = {
                                                    		clientid : item.id,
                                                    		projectNumber : project.projectNumber,
	                                                  		projectId : project.projectId,
	                                                  		lifecycleState : project.lifecycleState,
	                                                  		name : project.name,
	                                                  		response_obj : JSON.stringify(project),
	                                                  		created_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
	                                                    };
//	                                                     console.log("insData");
//	                                                     console.log(insData);
	                                                    await dbHandler.insertIntoTable('c4_gcp_projects',insData,async function(error,projectId){
	                                                    	var options = {
                                                        	    'method': 'GET',
                                                        	    'url': 'https://compute.googleapis.com/compute/v1/projects/'+project.projectId,
                                                        	    'headers': {
                                                        	      'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
                                                        	    },
                                                        	    'data' : ""
                                                        	  };
//		                                                        	  console.log("options");
//		                                                              console.log(options);
	                                                    	
	                                                    	await axios(options)
	                                                        .then(async projectDetailResponse => {
//		                                                  		  console.log("response.data");
//		                                                  		  console.log(response.data);
	                                                  	    	if (!projectDetailResponse.data.name) {
	                                                  	    		console.log("No projects found for client id "+item.id);
	                                                  	    	}else{
	                                                  	    		await new Promise(async function(projectDetailResolve, projectDetailReject){
	                    	                                            let projectDetailSql = `SELECT * from c4_gcp_project_details
	                    	                                            where clientid = '${item.id}' and name = '${projectDetailResponse.data.name}'`;
//		                    	                                             console.log("projectDetailSql");
//		                    	                                             console.log(projectDetailSql);
	                    	                                            await dbHandler.executeQuery(projectDetailSql,async function(projectDetailInfo){
//		                    	                                                 console.log("projectDetailInfo");
//		                    	                                                 console.log(projectDetailInfo);
	                    	                                                if(projectDetailInfo.length > 0){
	                    	                                                    let updateProjectDetailData = {
	                    	                                                    		defaultNetworkTier : projectDetailResponse.data.defaultNetworkTier,
		                                                                        		response_obj : JSON.stringify(projectDetailResponse.data),
		                                                                        		updated_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
	                    	                                                    };
//		                    	                                                     console.log("updateData");
//		                    	                                                     console.log(updateData);
	                    	                                                    await dbHandler.updateTableData('c4_gcp_project_details',{'id':projectDetailInfo[0].id},updateProjectDetailData, async function(err,result){
	                    	                                                    	console.log("updated the updateProjectDetailData with id "+projectDetailInfo[0].id);
	                    	                                                    	projectDetailResolve("updated the updateProjectDetailData with id "+projectDetailInfo[0].id);
	                    	                                                    });
	                    	                                                }else{
	                    	                                                    let insProjectDetailData = {
	                                                                        		clientid : item.id,
	                    	                                                  		name : projectDetailResponse.data.name,
                    	                                                    		defaultNetworkTier : projectDetailResponse.data.defaultNetworkTier,
	                    	                                                  		response_obj : JSON.stringify(project),
	                    	                                                  		created_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
	                    	                                                    };
//		                    	                                                     console.log("insProjectDetailData");
//		                    	                                                     console.log(insProjectDetailData);
	                    	                                                    await dbHandler.insertIntoTable('c4_gcp_project_details',insProjectDetailData,async function(error,projectDetailId){
	                    	                                                        console.log("inserted the updateProjectDetailData with id "+projectDetailId);
	                    	                                                        projectDetailResolve("inserted the updateProjectDetailData with id "+projectDetailId);
	                    	                                                    });
	                    	                                                }
	                    	                                            });
	                                                  	    		});
	                                                  	    	}
	                                                        }).catch(error => {
	                                                            console.log("error");
	                                                            let res = {status:"error",message:error};
	                                                            if(error && error.response && error.response.data
	                                                          		  && error.response.data.error 
	                                                          		  && error.response.data.error.message){
	                                                          	  res.message = error.response.data.error.message
	                                                            }
	                                                            console.log(res);
	                                                            projectResolve(res);
	                                                        });
	                                                        console.log("inserted the projectInfo with id "+projectId);
	                                                        projectResolve("inserted the projectInfo with id "+projectId);
	                                                    });
	                                                }
	                                            });
	                                        });
	                                    }
	                        	    }
                        	  }).catch(error => {
                                  console.log("error");
                                  let res = {status:"error",message:error};
                                  if(error && error.response && error.response.data
                                		  && error.response.data.error 
                                		  && error.response.data.error.message){
                                	  res.message = error.response.data.error.message
                                  }
                                  console.log(res);
                                  itemResolve(res);
                              });
                          }
                        });
                        console.log("updated for client id "+item.id);
                        itemResolve("updated for client id "+item.id);
                      });
                  };
                  let res = {status:"success","message":"Updated GCP projects"};
                  console.log(res);
                  return callback(null,res);
                  resolve(res);
              }else{
            	  let res = {status:"success","message":"No clients available to update the GCP projects"};
                  console.log(res);
                  return callback(1,res);
                  reject(res);
              }
          }
          catch{
              resolve(0);
          }
      });
  });
}

/*
Author: Rajesh
Descriprion: sync services and services.skus list
Date  : 05-11-2020
*/
let syncGcpServicesAndServicesSkusList= async (reqObj,callback)=>{
	let current_date = dateFormat(new Date(),"yyyy-mm-dd");
	let cts = Math.round(new Date().getTime() / 1000);  
  // console.log(reqObj);
  let sql = `Select c.* from c4_clients as c 
  where c.status = 1 and c.is_gcp_enabled = 1`;
  if(typeof reqObj.clientid != 'undefined'){
      sql += ` and c.id = ${reqObj.clientid} order by id desc limit 1`;
  }else{
      sql += ` order by id asc`;
  }
// sql += ' limit 1';
  console.log(sql);
  await new Promise(function(resolve, reject) {
      dbHandler.executeQuery(sql,async function(GcpClients){
           console.log("GcpClients");
           console.log(GcpClients);
          try{
              if (GcpClients.length > 0) {
                  for await (const item of GcpClients) {
                      await new Promise(async function(itemResolve, itemReject){
                        await new Promise(function(resolve,reject){
                          gcp_authtoken(item.id, function(error, result){
                            // console.log("result");
                            // console.log(result);
                            // if(error){
                            // resolve([])
                            // }else{
                                resolve(result)
                            // }
                          })
                        }).then(async function(token){
                          // console.log("token");
                          // console.log(token);
                          if(token.tokendata.length == 0){
                            var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
                            itemResolve(response);
                          }else{
                        	  var options = {
                        	    'method': 'GET',
                        	    'url': 'https://cloudbilling.googleapis.com/v1/services',
                        	    'headers': {
                        	      'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
                        	    },
                        	    'data' : ""
                        	  };
							// console.log("options");
							// console.log(options);
                        	  
                              await axios(options)
                              .then(async response => {
									// console.log("response.data");
									// console.log(response.data);
                        	    	if (response.data.services.length == 0) {
                        	    		console.log("No services found for client id "+item.id);
                        	    	}else{
	                        	    	for await (const service of response.data.services) {
	                                        await new Promise(async function(serviceResolve, serviceReject){
	                                            let serviceSql = `SELECT * from c4_gcp_services
	                                            where clientid=${item.id} and serviceId = '${service.serviceId}'`;
												// console.log("serviceSql");
												// console.log(serviceSql);
	                                            await dbHandler.executeQuery(serviceSql,async function(serviceInfo){
													// console.log("serviceInfo");
													// console.log(serviceInfo);
	                                                if(serviceInfo.length > 0){
	                                                    let updateData = {
	                                                    		name : service.name,
	                                                    		displayName : service.displayName,
	                                                    		businessEntityName : service.businessEntityName,
	                                                    		response_obj : JSON.stringify(service),
	                                                    		updated_date : cts
	                                                    };
														// console.log("updateData");
														// console.log(updateData);
	                                                    await dbHandler.updateTableData('c4_gcp_services',{'id':serviceInfo[0].id},updateData,async function(err,result){
//	                                                    	if(service.serviceId != '6F81-5844-456A'){
//                                                      		  console.log("updated the serviceInfo with id "+serviceInfo[0].id);
//		                                                        serviceResolve("updated the serviceInfo with id "+serviceInfo[0].id);
//                                                      	  }else{
                                                      		  let stopped = false;
                                                      		  let pageToken = '';

                                                      		    // infinite loop
                                                      		    while(!stopped) {
                                                      		    	await new Promise(function(resolve,reject){
			                                                            gcp_authtoken(item.id, function(error, result){
			                                                              // console.log("result");
			                                                              // console.log(result);
			                                                              // if(error){
			                                                              // resolve([])
			                                                              // }else{
			                                                                  resolve(result)
			                                                              // }
			                                                            })
			                                                          }).then(async function(token){
			                                                        	  // console.log("token");
			                                                              // console.log(token);
			                                                              if(token.tokendata.length == 0){
			                                                                var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
			                                                                serviceResolve(response);
			                                                              }else{
	                                                            	  
						                                                    	var options = {
					                                                        	    'method': 'GET',
					                                                        	    'url': 'https://cloudbilling.googleapis.com/v1/services/'+service.serviceId+'/skus?endTime=2020-10-31T15%3A01%3A23.045123456Z&startTime=2020-10-01T15%3A01%3A23Z',
					                                                        	    'headers': {
					                                                        	      'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
					                                                        	    },
					                                                        	    'data' : ""
					                                                        	  };
						                                                    	if(pageToken){
						                                                    		options.url += "&pageToken="+pageToken;
						                                                    	}
						                                                        	  console.log("options");
						                                                              console.log(options);
						                                                    	
						                                                    	await axios(options)
						                                                        .then(async serviceDetailResponse => {
						                                                  		  console.log("serviceDetailResponse.data");
						                                                  		  console.log(serviceDetailResponse.data);
						                                                  	    	if (!serviceDetailResponse.data.skus || serviceDetailResponse.data.skus.length == 0) {
						                                                  	    		console.log("No services found for client id "+item.id+" and serviceId "+service.serviceId);
						                                                  	    		stopped = true // stop when you want
						                                                  	    	}else{
						                                                  	    		try{
					                                                  	                  for await (const serviceSku of serviceDetailResponse.data.skus) {
					                                                  	                	console.log("serviceSku");
					                                                  	              		console.log(JSON.stringify(serviceSku));
							                                                  	    		await new Promise(async function(serviceDetailResolve, serviceDetailReject){
							                    	                                            let serviceDetailSql = `SELECT * from c4_gcp_service_skus
							                    	                                            where serviceId = '${service.serviceId}' and skuId = '${serviceSku.skuId}'`;
																								// console.log("serviceDetailSql");
																								// console.log(serviceDetailSql);
							                    	                                            await dbHandler.executeQuery(serviceDetailSql,async function(serviceDetailInfo){
							                    	                                                 console.log("serviceDetailInfo");
							                    	                                                 console.log(serviceDetailInfo);
							                    	                                                if(serviceDetailInfo.length > 0){
							                    	                                                    let updateserviceDetailData = {
								                                                                        		response_obj : JSON.stringify(serviceSku),
								                                                                        		updated_date : cts
							                    	                                                    };
							                    	                                                     console.log("updateData");
							                    	                                                     console.log(updateData);
							                    	                                                    await dbHandler.updateTableData('c4_gcp_service_skus',{'id':serviceDetailInfo[0].id},updateserviceDetailData, async function(err,result){
							                    	                                                    	console.log("updated the updateserviceDetailData with id "+serviceDetailInfo[0].id);
							                    	                                                    	serviceDetailResolve("updated the updateserviceDetailData with id "+serviceDetailInfo[0].id);
							                    	                                                    });
							                    	                                                }else{
							                    	                                                    let insserviceDetailData = {
						                    	                                                    		clientid : item.id,
						                    	                                                    		serviceId : service.serviceId,
						                    	                                                    		name : serviceSku.name,
						                    	                                                    		skuId : serviceSku.skuId,
						                    	                                                    		description : serviceSku.description,
						                    	                                                    		category_resourceFamily : serviceSku.category.resourceFamily,
						                    	                                                    		category_resourceGroup : serviceSku.category.resourceGroup,
						                    	                                                    		category_usageType : serviceSku.category.usageType,
						                    	                                                    		pricingInfo_usageUnit : serviceSku.pricingInfo[0].pricingExpression.usageUnit,
							                    	                                                  		response_obj : JSON.stringify(serviceSku),
							                    	                                                  		created_date : cts
							                    	                                                    };
							                    	                                                     console.log("insserviceDetailData");
							                    	                                                     console.log(insserviceDetailData);
							                    	                                                    await dbHandler.insertIntoTable('c4_gcp_service_skus',insserviceDetailData,async function(error,serviceDetailId){
							                    	                                                        console.log("inserted the updateserviceDetailData with id "+serviceDetailId);
							                    	                                                        serviceDetailResolve("inserted the updateserviceDetailData with id "+serviceDetailId);
							                    	                                                    });
							                    	                                                }
							                    	                                            });
							                                                  	    		});
					                                                  	                  }
						                                                  	    		}catch{
						                                                  	    			console.log("entered in catch block");
						                                                  	    			// resolve(0);
							                                                  	        }
						                                                  	    		if(!serviceDetailResponse.data.nextPageToken || (serviceDetailResponse.data.nextPageToken && serviceDetailResponse.data.nextPageToken == '')){
						                                                  	    			stopped = true // stop
																											// when
																											// you
																											// want
						                                                  	    		}else{
						                                                  	    			pageToken = serviceDetailResponse.data.nextPageToken;
						                                                  	    			console.log("pageToken");
						                                                  	    			console.log(pageToken);
						                                                  	    		}
						                                                  	    	}
						                                                        }).catch(error => {
						                                                        	stopped = true // stop when you want
						                                                            console.log("error");
						                                                            let res = {status:"error",message:error};
						                                                            if(error && error.response && error.response.data
						                                                          		  && error.response.data.error 
						                                                          		  && error.response.data.error.message){
						                                                          	  res.message = error.response.data.error.message
						                                                            }
						                                                            console.log(res);
						                                                            serviceResolve(res);
						                                                        });
			                                                    	
	                                                              }
	                                                          });
                                                      		    }
                                                      		  console.log("updated the serviceInfo with id "+serviceInfo[0].id);
		                                                        serviceResolve("updated the serviceInfo with id "+serviceInfo[0].id);
//                                                      	  }
	                                                    });
	                                                }else{
	                                                    let insData = {
                                                    		clientid : item.id,
                                                    		serviceId : service.serviceId,
                                                    		name : service.name,
                                                    		displayName : service.displayName,
                                                    		businessEntityName : service.businessEntityName,
	                                                  		response_obj : JSON.stringify(service),
	                                                  		created_date : cts
	                                                    };
														// console.log("insData");
														// console.log(insData);
	                                                    await dbHandler.insertIntoTable('c4_gcp_services',insData,async function(error,serviceId){
	                                                    	let stopped = false;
	                                                    	let pageToken = '';

                                                		    // infinite loop
                                                		    while(!stopped) {
		                                                    	await new Promise(function(resolve,reject){
		                                                            gcp_authtoken(item.id, function(error, result){
		                                                              // console.log("result");
		                                                              // console.log(result);
		                                                              // if(error){
		                                                              // resolve([])
		                                                              // }else{
		                                                                  resolve(result)
		                                                              // }
		                                                            })
		                                                          }).then(async function(token){
		                                                        	  // console.log("token");
		                                                              // console.log(token);
		                                                              if(token.tokendata.length == 0){
		                                                                var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
		                                                                serviceResolve(response);
		                                                              }else{
				                                                    	var options = {
			                                                        	    'method': 'GET',
			                                                        	    'url': 'https://cloudbilling.googleapis.com/v1/services/'+service.serviceId+'/skus',
			                                                        	    'headers': {
			                                                        	      'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
			                                                        	    },
			                                                        	    'data' : ""
			                                                        	  };
																		// console.log("options");
																		// console.log(options);
				                                                    	
				                                                    	await axios(options)
				                                                        .then(async serviceDetailResponse => {
					                                                  		  console.log("serviceDetailResponse.data");
					                                                  		  console.log(serviceDetailResponse.data);
					                                                  		if (!serviceDetailResponse.data.skus || serviceDetailResponse.data.skus.length == 0) {
				                                                  	    		console.log("No services found for client id "+item.id+" and serviceId "+service.serviceId);
				                                                  	    		stopped = true // stop when you want
				                                                  	    	}else{
				                                                  	    		try{
			                                                  	                  for await (const serviceSku of serviceDetailResponse.data.skus) {
			                                                  	                	console.log("serviceSku");
			                                                  	              		console.log(JSON.stringify(serviceSku));
					                                                  	    		await new Promise(async function(serviceDetailResolve, serviceDetailReject){
			                    	                                                    let insserviceDetailData = {
		                    	                                                    		clientid : item.id,
			                	                                                    		serviceId : service.serviceId,
			                	                                                    		name : serviceSku.name,
			                	                                                    		skuId : serviceSku.skuId,
			                	                                                    		description : serviceSku.description,
			                	                                                    		category_resourceFamily : serviceSku.category.resourceFamily,
			                	                                                    		category_resourceGroup : serviceSku.category.resourceGroup,
			                	                                                    		category_usageType : serviceSku.category.usageType,
			                	                                                    		pricingInfo_usageUnit : serviceSku.pricingInfo[0].pricingExpression.usageUnit,
			                    	                                                  		response_obj : JSON.stringify(serviceSku),
			                    	                                                  		created_date : cts
			                    	                                                    };
			                    	                                                     console.log("insserviceDetailData");
			                    	                                                     console.log(insserviceDetailData);
			                    	                                                    await dbHandler.insertIntoTable('c4_gcp_service_skus',insserviceDetailData,async function(error,serviceDetailId){
			                    	                                                        console.log("inserted the updateserviceDetailData with id "+serviceDetailId);
			                    	                                                        serviceDetailResolve("inserted the updateserviceDetailData with id "+serviceDetailId);
			                    	                                                    });
					                                                  	    		});
			                                                  	                  }
				                                                  	    		}catch{
				                                                  	    			console.log("entered in catch block");
				                                                  	    			// resolve(0);
					                                                  	        }
				                                                  	    		if(!serviceDetailResponse.data.nextPageToken || (serviceDetailResponse.data.nextPageToken && serviceDetailResponse.data.nextPageToken == '')){
				                                                  	    			stopped = true // stop when you want
				                                                  	    		}else{
				                                                  	    			pageToken = serviceDetailResponse.data.nextPageToken;
				                                                  	    			console.log("pageToken");
				                                                  	    			console.log(pageToken);
				                                                  	    		}
				                                                  	    	}
				                                                        }).catch(error => {
				                                                            console.log("error");
				                                                            let res = {status:"error",message:error};
				                                                            if(error && error.response && error.response.data
				                                                          		  && error.response.data.error 
				                                                          		  && error.response.data.error.message){
				                                                          	  res.message = error.response.data.error.message
				                                                            }
				                                                            console.log(res);
				                                                            serviceResolve(res);
				                                                        });
		                                                              }
		                                                          });
		                                                    }
                                                		    console.log("inserted the serviceInfo with id "+serviceId);
	                                                        serviceResolve("inserted the serviceInfo with id "+serviceId);
	                                                    });
	                                                }
	                                            });
	                                        });
	                                    }
	                        	    }
                        	  }).catch(error => {
                                  console.log("error");
                                  let res = {status:"error",message:error};
                                  if(error && error.response && error.response.data
                                		  && error.response.data.error 
                                		  && error.response.data.error.message){
                                	  res.message = error.response.data.error.message
                                  }
                                  console.log(res);
                                  itemResolve(res);
                              });
                          }
                        });
                        console.log("updated for client id "+item.id);
                        itemResolve("updated for client id "+item.id);
                      });
                  };
                  let res = {status:"success","message":"Updated GCP services"};
                  console.log(res);
                  return callback(null,res);
                  resolve(res);
              }else{
            	  let res = {status:"success","message":"No clients available to update the GCP services"};
                  console.log(res);
                  return callback(1,res);
                  reject(res);
              }
          }
          catch{
              resolve(0);
          }
      });
  });
}

/*
Author: Rajesh
Descriprion: sync datasets and tables list
Date  : 13-11-2020
*/
let syncGcpDatasetsAndTablesList= async (reqObj,callback)=>{
	let current_date = dateFormat(new Date(),"yyyy-mm-dd");
	let cts = Math.round(new Date().getTime() / 1000);  
  // console.log(reqObj);
  let sql = `Select c.*,p.projectId from c4_gcp_projects as p
  inner join c4_clients as c on p.clientid = c.id 
  where c.status = 1 and c.is_gcp_enabled = 1 and p.lifecycleState = 'ACTIVE' and record_status = 1`;
  if(typeof reqObj.clientid != 'undefined'){
      sql += ` and c.id = ${reqObj.clientid} `;
  }else{
      sql += ` order by id asc`;
  }
// sql += ' limit 1';
  console.log(sql);
  await new Promise(function(resolve, reject) {
      dbHandler.executeQuery(sql,async function(GcpClients){
           //console.log("GcpClients");
           //console.log(GcpClients);
          try{
              if (GcpClients.length > 0) {
                  for await (const item of GcpClients) {
                	  //console.log("item");
                      //console.log(item);
                      await new Promise(async function(itemResolve, itemReject){
                        await new Promise(function(resolve,reject){
                          gcp_authtoken(item.id, function(error, result){
                            // console.log("result");
                            // console.log(result);
                            // if(error){
                            // resolve([])
                            // }else{
                                resolve(result)
                            // }
                          })
                        }).then(async function(token){
                          // console.log("token");
                          // console.log(token);
                          if(token.tokendata.length == 0){
                            var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
                            itemResolve(response);
                          }else{
                        	  var options = {
                        	    'method': 'GET',
                        	    'url': `https://bigquery.googleapis.com/bigquery/v2/projects/${item.projectId}/datasets`,
                        	    'headers': {
                        	      'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
                        	    },
                        	    'data' : ""
                        	  };
							 //console.log("options");
							 //console.log(options);
                        	  
                              await axios(options)
                              .then(async response => {
									 //console.log("dataset response.data");
									 //console.log(response.data);
                        	    	if (!response.data.datasets || response.data.datasets.length == 0) {
                        	    		console.log("No datasets found for client id "+item.id+" and projectId "+item.projectId);
                        	    	}else{
	                        	    	for await (const service of response.data.datasets) {
	                                        await new Promise(async function(serviceResolve, serviceReject){
	                                        	 //console.log("dataset -----------");
												 //console.log(service);
	                                            let serviceSql = `SELECT * from c4_gcp_project_datasets
	                                            where clientid='${item.id}' and projectId='${item.projectId}' and datasetId = '${service.datasetReference.datasetId}'`;
												// console.log("serviceSql");
												// console.log(serviceSql);
	                                            await dbHandler.executeQuery(serviceSql,async function(serviceInfo){
													// console.log("serviceInfo");
													// console.log(serviceInfo);
	                                                if(serviceInfo.length > 0){
	                                                    let updateData = {
	                                                    		location : service.location,
	                                                    		response_obj : JSON.stringify(service),
	                                                    		updated_date : cts
	                                                    };
														// console.log("updateData");
														// console.log(updateData);
	                                                    await dbHandler.updateTableData('c4_gcp_project_datasets',{'id':serviceInfo[0].id},updateData,async function(err,result){
                                                      		  let stopped = false;
                                                      		  let pageToken = '';

                                                      		    // infinite loop
                                                      		    while(!stopped) {
                                                      		    	await new Promise(function(resolve,reject){
			                                                            gcp_authtoken(item.id, function(error, result){
			                                                              // console.log("result");
			                                                              // console.log(result);
			                                                              // if(error){
			                                                              // resolve([])
			                                                              // }else{
			                                                                  resolve(result)
			                                                              // }
			                                                            })
			                                                          }).then(async function(token){
			                                                        	  // console.log("token");
			                                                              // console.log(token);
			                                                              if(token.tokendata.length == 0){
			                                                                var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
			                                                                serviceResolve(response);
			                                                              }else{
	                                                            	  
						                                                    	var options = {
					                                                        	    'method': 'GET',
					                                                        	    'url': `https://bigquery.googleapis.com/bigquery/v2/projects/${item.projectId}/datasets/${service.datasetReference.datasetId}/tables`,
					                                                        	    'headers': {
					                                                        	      'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
					                                                        	    },
					                                                        	    'data' : ""
					                                                        	  };
						                                                    	if(pageToken){
						                                                    		options.url += "&pageToken="+pageToken;
						                                                    	}
						                                                        	  //console.log("options");
						                                                              //console.log(options);
						                                                    	
						                                                    	await axios(options)
						                                                        .then(async serviceDetailResponse => {
						                                                  		  //console.log("tables serviceDetailResponse.data");
						                                                  		  //console.log(serviceDetailResponse.data);
						                                                  	    	if (!serviceDetailResponse.data.tables || serviceDetailResponse.data.tables.length == 0) {
						                                                  	    		console.log("No tables found for client id "+item.id+" and projectId "+item.projectId+" and datasetId "+service.datasetReference.datasetId);
						                                                  	    		stopped = true // stop when you want
						                                                  	    	}else{
						                                                  	    		try{
					                                                  	                  for await (const serviceSku of serviceDetailResponse.data.tables) {
					                                                  	                	//console.log("serviceSku");
					                                                  	              		//console.log(JSON.stringify(serviceSku));
							                                                  	    		await new Promise(async function(serviceDetailResolve, serviceDetailReject){
							                    	                                            let serviceDetailSql = `SELECT * from c4_gcp_project_dataset_tables
							                    	                                            where clientid='${item.id}' and projectId='${item.projectId}' and datasetId = '${service.datasetReference.datasetId}' and tableId = '${serviceSku.tableReference.tableId}' `;
																								// console.log("serviceDetailSql");
																								// console.log(serviceDetailSql);
							                    	                                            await dbHandler.executeQuery(serviceDetailSql,async function(serviceDetailInfo){
							                    	                                                 //console.log("serviceDetailInfo");
							                    	                                                 //console.log(serviceDetailInfo);
							                    	                                                if(serviceDetailInfo.length > 0){
							                    	                                                    let updateserviceDetailData = {
								                                                                        		response_obj : JSON.stringify(serviceSku),
								                                                                        		updated_date : cts
							                    	                                                    };
							                    	                                                     //console.log("updateData");
							                    	                                                     //console.log(updateData);
							                    	                                                    await dbHandler.updateTableData('c4_gcp_project_dataset_tables',{'id':serviceDetailInfo[0].id},updateserviceDetailData, async function(err,result){
							                    	                                                    	console.log("updated the updateserviceDetailData with id "+serviceDetailInfo[0].id);
							                    	                                                    	serviceDetailResolve("updated the updateserviceDetailData with id "+serviceDetailInfo[0].id);
							                    	                                                    });
							                    	                                                }else{
							                    	                                                    let insserviceDetailData = {
						                    	                                                    		clientid : item.id,
						                    	                                                    		projectId : item.projectId,
						                    	                                                    		datasetId : service.datasetReference.datasetId,
						                    	                                                    		tableId : serviceSku.tableReference.tableId,
						                    	                                                    		type : serviceSku.type,
							                    	                                                  		response_obj : JSON.stringify(serviceSku),
							                    	                                                  		created_date : cts
							                    	                                                    };
							                    	                                                     //console.log("insserviceDetailData");
							                    	                                                     //console.log(insserviceDetailData);
							                    	                                                    await dbHandler.insertIntoTable('c4_gcp_project_dataset_tables',insserviceDetailData,async function(error,serviceDetailId){
							                    	                                                        console.log("inserted the updateserviceDetailData with id "+serviceDetailId);
							                    	                                                        serviceDetailResolve("inserted the updateserviceDetailData with id "+serviceDetailId);
							                    	                                                    });
							                    	                                                }
							                    	                                            });
							                                                  	    		});
					                                                  	                  }
						                                                  	    		}catch{
						                                                  	    			console.log("entered in catch block");
						                                                  	    			// resolve(0);
							                                                  	        }
						                                                  	    		if(!serviceDetailResponse.data.nextPageToken || (serviceDetailResponse.data.nextPageToken && serviceDetailResponse.data.nextPageToken == '')){
						                                                  	    			stopped = true // stop
																											// when
																											// you
																											// want
						                                                  	    		}else{
						                                                  	    			pageToken = serviceDetailResponse.data.nextPageToken;
						                                                  	    			console.log("pageToken");
						                                                  	    			console.log(pageToken);
						                                                  	    		}
						                                                  	    	}
						                                                        }).catch(error => {
						                                                        	stopped = true // stop when you want
						                                                            console.log("error");
						                                                            let res = {status:"error",message:error};
						                                                            if(error && error.response && error.response.data
						                                                          		  && error.response.data.error 
						                                                          		  && error.response.data.error.message){
						                                                          	  res.message = error.response.data.error.message
						                                                            }
						                                                            console.log(res);
						                                                            serviceResolve(res);
						                                                        });
			                                                    	
	                                                              }
	                                                          });
                                                      		    }
                                                      		  console.log("updated the dataset with id "+serviceInfo[0].id);
		                                                        serviceResolve("updated the dataset with id "+serviceInfo[0].id);
//                                                      	  }
	                                                    });
	                                                }else{
	                                                    let insData = {
                                                    		clientid : item.id,
                                                    		projectId : item.projectId,
                                                    		datasetId : service.datasetReference.datasetId,
                                                    		location : service.location,
	                                                  		response_obj : JSON.stringify(service),
	                                                  		created_date : cts
	                                                    };
														// console.log("insData");
														// console.log(insData);
	                                                    await dbHandler.insertIntoTable('c4_gcp_project_datasets',insData,async function(error,serviceId){
	                                                    	let stopped = false;
	                                                    	let pageToken = '';

                                                		    // infinite loop
                                                		    while(!stopped) {
		                                                    	await new Promise(function(resolve,reject){
		                                                            gcp_authtoken(item.id, function(error, result){
		                                                              // console.log("result");
		                                                              // console.log(result);
		                                                              // if(error){
		                                                              // resolve([])
		                                                              // }else{
		                                                                  resolve(result)
		                                                              // }
		                                                            })
		                                                          }).then(async function(token){
		                                                        	  // console.log("token");
		                                                              // console.log(token);
		                                                              if(token.tokendata.length == 0){
		                                                                var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
		                                                                serviceResolve(response);
		                                                              }else{
				                                                    	var options = {
			                                                        	    'method': 'GET',
			                                                        	    'url': `https://bigquery.googleapis.com/bigquery/v2/projects/${item.projectId}/datasets/${service.datasetReference.datasetId}/tables`,
			                                                        	    'headers': {
			                                                        	      'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
			                                                        	    },
			                                                        	    'data' : ""
			                                                        	  };
				                                                    	if(pageToken){
				                                                    		options.url += "&pageToken="+pageToken;
				                                                    	}
																		// console.log("options");
																		// console.log(options);
				                                                    	
				                                                    	await axios(options)
				                                                        .then(async serviceDetailResponse => {
					                                                  		  //console.log("tables serviceDetailResponse.data");
					                                                  		  //console.log(serviceDetailResponse.data);
					                                                  		if (!serviceDetailResponse.data.tables || serviceDetailResponse.data.tables.length == 0) {
					                                                  			console.log("No tables found for client id "+item.id+" and projectId "+item.projectId+" and datasetId "+service.datasetReference.datasetId);
					                                                  			stopped = true // stop when you want
				                                                  	    	}else{
				                                                  	    		try{
			                                                  	                  for await (const serviceSku of serviceDetailResponse.data.tables) {
			                                                  	                	//console.log("serviceSku");
			                                                  	              		//console.log(JSON.stringify(serviceSku));
					                                                  	    		await new Promise(async function(serviceDetailResolve, serviceDetailReject){
			                    	                                                    let insserviceDetailData = {
		                    	                                                    		clientid : item.id,
		                    	                                                    		projectId : item.projectId,
		                    	                                                    		datasetId : service.datasetReference.datasetId,
		                    	                                                    		tableId : serviceSku.tableReference.tableId,
		                    	                                                    		type : serviceSku.type,
			                    	                                                  		response_obj : JSON.stringify(serviceSku),
			                    	                                                  		created_date : cts
			                    	                                                    };
			                    	                                                     //console.log("insserviceDetailData");
			                    	                                                     //console.log(insserviceDetailData);
			                    	                                                    await dbHandler.insertIntoTable('c4_gcp_project_dataset_tables',insserviceDetailData,async function(error,serviceDetailId){
			                    	                                                        console.log("inserted the updateserviceDetailData with id "+serviceDetailId);
			                    	                                                        serviceDetailResolve("inserted the updateserviceDetailData with id "+serviceDetailId);
			                    	                                                    });
					                                                  	    		});
			                                                  	                  }
				                                                  	    		}catch{
				                                                  	    			console.log("entered in catch block");
				                                                  	    			// resolve(0);
					                                                  	        }
				                                                  	    		if(!serviceDetailResponse.data.nextPageToken || (serviceDetailResponse.data.nextPageToken && serviceDetailResponse.data.nextPageToken == '')){
				                                                  	    			stopped = true // stop
																									// when
																									// you
																									// want
				                                                  	    		}else{
				                                                  	    			pageToken = serviceDetailResponse.data.nextPageToken;
				                                                  	    			console.log("pageToken");
				                                                  	    			console.log(pageToken);
				                                                  	    		}
				                                                  	    	}
				                                                        }).catch(error => {
				                                                            console.log("error");
				                                                            let res = {status:"error",message:error};
				                                                            if(error && error.response && error.response.data
				                                                          		  && error.response.data.error 
				                                                          		  && error.response.data.error.message){
				                                                          	  res.message = error.response.data.error.message
				                                                            }
				                                                            console.log(res);
				                                                            serviceResolve(res);
				                                                        });
		                                                              }
		                                                          });
		                                                    }
                                                		    console.log("inserted the serviceInfo with id "+serviceId);
	                                                        serviceResolve("inserted the serviceInfo with id "+serviceId);
	                                                    });
	                                                }
	                                            });
	                                        });
	                                    }
	                        	    }
                        	  }).catch(error => {
                                  console.log("error");
                                  let res = {status:"error",message:error};
                                  if(error && error.response && error.response.data
                                		  && error.response.data.error 
                                		  && error.response.data.error.message){
                                	  res.message = error.response.data.error.message
                                  }
                                  console.log(res);
                                  itemResolve(res);
                              });
                          }
                        });
                        console.log("updated for client id "+item.id+" and projectId "+item.projectId);
                        itemResolve("updated for client id "+item.id+" and projectId "+item.projectId);
                      });
                  };
                  let res = {status:"success","message":"Updated GCP datasets and tables"};
                  console.log(res);
                  return callback(null,res);
                  resolve(res);
              }else{
            	  let res = {status:"success","message":"No clients available to update the GCP datasets and tables"};
                  console.log(res);
                  return callback(1,res);
                  reject(res);
              }
          }
          catch{
              resolve(0);
          }
      });
  });
}

/*
Author: Rajesh
Descriprion: sync gcp services usage data
Date  : 16-11-2020
*/
let syncGcpServicesUsageData= async (reqObj,callback)=>{
	let current_date = dateFormat(new Date(),"yyyy-mm-dd");
	let cts = Math.round(new Date().getTime() / 1000);  
  // console.log(reqObj);
  let sql = `Select dt.*,ocb.projectId as bigquery_project_id from c4_gcp_projects as p
  inner join c4_gcp_project_dataset_tables as dt on dt.clientid = p.clientid and dt.projectId = p.projectId
  inner join c4_clients as c on p.clientid = c.id 
  inner join c4_other_cloud_budgets as ocb on (ocb.clientid = c.id and ocb.cloud_id = ${config.GCP.cloudid})
  where c.status = 1 and c.is_gcp_enabled = 1 and p.lifecycleState = 'ACTIVE' 
  and p.record_status = 1 and dt.record_status = 1 and dt.type = 'TABLE'`;
  if(typeof reqObj.clientid != 'undefined'){
      sql += ` and c.id = ${reqObj.clientid} `;
  }else{
      sql += ` order by id asc`;
  }
// sql += ' limit 1';
  console.log(sql);
  await new Promise(function(resolve, reject) {
      dbHandler.executeQuery(sql,async function(GcpClients){
           console.log("GcpClients");
           console.log(GcpClients);
          try{
              if (GcpClients.length > 0) {
                  for await (const item of GcpClients) {
                	  //console.log("item");
                      //console.log(item);
                      await new Promise(async function(itemResolve, itemReject){
                    	let stopped = false;
                      	let pageToken = '';

              		    // infinite loop
              		    while(!stopped) {
                        await new Promise(function(resolve1,reject1){
                          gcp_authtoken(item.clientid, function(error, result){
                            // console.log("result");
                            // console.log(result);
                            // if(error){
                            // resolve([])
                            // }else{
                                resolve1(result)
                            // }
                          })
                        }).then(async function(token){
                          // console.log("token");
                          // console.log(token);
                          if(token.tokendata.length == 0){
                            var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
                            itemResolve(response);
                          }else{
                        	  var options = {
                        	    'method': 'GET',
                        	    'url': `https://bigquery.googleapis.com/bigquery/v2/projects/${item.projectId}/datasets/${item.datasetId}/tables/${item.tableId}/data?selectedFields=billing_account_id,service.id,service.description,sku.id,sku.description,usage_start_time,usage_end_time,project.id,cost,currency,currency_conversion_rate,usage.amount_in_pricing_units,usage.pricing_unit&startIndex=${item.startIndex}`,
                        	    'headers': {
                        	      'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
                        	    },
                        	    'data' : ""
                        	  };
                        	  if(pageToken){
                          		options.url += "&pageToken="+pageToken;
                        	 }
							 console.log("options");
							 console.log(options);
                        	  
                              await axios(options)
                              .then(async response => {
									 console.log("rows response.data");
									 console.log(response.data);
									 
                        	    	if (!response.data.rows || response.data.rows.length == 0) {
                        	    		console.log("No rows found for client id "+item.clientid+" and projectId "+item.projectId+" and datasetId "+item.datasetId+" and tableId "+item.tableId);
                        	    		stopped = true // stop when you want
                        	    	}else{
	                        	    	for await (const service of response.data.rows) {
	                                        await new Promise(async function(serviceResolve, serviceReject){
	                                        	 //console.log("row -----------");
												 //console.log(service);
                                                let insData = {
                                            		clientid : item.clientid,
                                            		projectId : item.projectId,
                                            		datasetId : item.datasetId,
                                            		tableId : item.tableId,
                                            		billing_account_id : service.f[0].v,
                                            		service_id : service.f[1].v.f[0].v,
                                            		service_description : service.f[1].v.f[1].v,
                                            		sku_id : service.f[2].v.f[0].v,
                                            		sku_description : service.f[2].v.f[1].v,
                                            		usage_start_time : service.f[3].v,
                                            		usage_end_time : service.f[4].v,
                                            		bigquery_project_id : service.f[5].v.f[0].v,
                                            		usage_cost : service.f[6].v,
                                            		currency : service.f[7].v,
                                            		currency_conversion_rate : service.f[8].v,
                                            		usage_amount_in_pricing_units : ((service.f[9].v && service.f[9].v.f && service.f[9].v.f[0])?service.f[9].v.f[0].v:""),
                                            		usage_pricing_unit : ((service.f[9].v && service.f[9].v.f && service.f[9].v.f[1])?service.f[9].v.f[1].v:""),
                                              		created_date : cts
                                                };
                                                
												 //console.log("insData");
												 //console.log(insData);
//												 return callback(null,"enterrrrr");
//                                                if(insData.bigquery_project_id == item.bigquery_project_id){
	                                                await dbHandler.insertIntoTable('c4_gcp_budget_usage',insData,async function(error,serviceId){
	                                                	if(error){
	                                                		console.log("row -----------");
	       												 	console.log(service);
	                                                		console.log("insData");
	       												 	console.log(insData);
	                                                	}
	                                        		    console.log("inserted the usageInfo with id "+serviceId);
	                                                    serviceResolve("inserted the usageInfo with id "+serviceId);
	                                                });
//                                                }else{
//                                                	console.log("It is not bigquery_project_id");
//                                                	serviceResolve("It is not bigquery_project_id");
//                                                }
	                                        });
	                                    }
	                        	    	if(response.data.totalRows && response.data.totalRows != ''){
	                        	    		let updateData = {
	                        	    				startIndex : response.data.totalRows,
                                            		updated_date : cts
                                            };
											 console.log("updateData");
											 console.log(updateData);
                                            await dbHandler.updateTableData('c4_gcp_project_dataset_tables',{'id':item.id},updateData,async function(err,result){
                                            	console.log(`Updated the c4_gcp_project_dataset_tables with startIndex ${updateData.startIndex} for id ${item.id}`);
                                            });
                          	    		}
	                        	    	if(!response.data.pageToken || (response.data.pageToken && response.data.pageToken == '')){
                          	    			stopped = true // stop when you want
                          	    		}else{
                          	    			pageToken = response.data.pageToken;
                          	    			console.log("pageToken");
                          	    			console.log(pageToken);
                          	    		}
	                        	    }
                        	  }).catch(error => {
                                  console.log("error");
                                  let res = {status:"error",message:error};
                                  if(error && error.response && error.response.data
                                		  && error.response.data.error 
                                		  && error.response.data.error.message){
                                	  res.message = error.response.data.error.message
                                  }
                                  console.log(res);
                                  itemResolve(res);
                              });
                          }
                        });
              		    }
                        console.log("updated for client id "+item.id+" and projectId "+item.projectId+" and datasetId "+item.datasetId+" and tableId "+item.tableId);
                        itemResolve("updated for client id "+item.id+" and projectId "+item.projectId+" and datasetId "+item.datasetId+" and tableId "+item.tableId);
                      });
                  };
                  let res = {status:"success","message":"Updated GCP Usage"};
                  console.log(res);
                  return callback(null,res);
                  resolve(res);
              }else{
            	  let res = {status:"success","message":"No clients available to update the GCP Usage"};
                  console.log(res);
                  return callback(1,res);
                  reject(res);
              }
          }
          catch{
              resolve(0);
          }
      });
  });
}

let getGcpProjectList = async (reqBody,callback)=>{
  var clientid=reqBody.clientid;
  if(typeof(clientid)=='undefined' || clientid==''){
    var response={status:"error",message:'Please provide clientid.',data:[]}
    return callback(1,response);
  }

  let sql = `SELECT c.* from c4_gcp_projects as c
   where clientid = '${clientid}' `;

  if(reqBody.status && reqBody.status != 'all'){
	  sql += ` and c.record_status = '${reqBody.status}' `;
  }else if(!reqBody.status){
	  sql += ` and c.record_status = 1 `;
  }
  sql += ` order by c.name asc`;
  console.log("sql");
  console.log(sql);
  await dbHandler.executeQuery(sql,async function(data){
    return callback(null,{status:"success",message:'GCP Project List.',data:data});
  });
}

/*
Author: Rajesh
Descriprion : sync zones list
Date  : 07-07-2020
*/
let syncGcpZonesList= async (reqObj,callback)=>{
  // console.log(reqObj);
  let sql = `Select p.* from c4_gcp_projects as p
  inner join c4_clients as c on c.id = p.clientid
  where c.status = 1 and c.is_gcp_enabled = 1 and p.record_status = 1 `;
  if(typeof reqObj.id != 'undefined'){
      sql += ` and c.id = ${reqObj.id} order by id desc limit 1`;
  }else{
      sql += ` order by id asc`;
  }
  // sql += ' limit 1';
  //console.log(sql);
  await new Promise(function(resolve, reject) {
      dbHandler.executeQuery(sql,async function(items){
          // console.log("items");
          // console.log(items);
          try{
              if (items.length > 0) {
                  for await (const item of items) {
                      await new Promise(async function(itemResolve, itemReject){
                        await new Promise(function(resolve1,reject1){
                          gcp_authtoken(item.clientid, function(error, result){
                            // console.log("result");
                            // console.log(result);
                            // if(error){
                            //     resolve([])
                            // }else{
                                resolve1(result)
                            // }
                          })
                        }).then(async function(token){
                          // console.log("token");
                          // console.log(token);
                          if(token.tokendata.length == 0){
                            var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
                            itemResolve(response);
                          }else{
                        	  var options = {
                        	    'method': 'GET',
                        	    'url': 'https://compute.googleapis.com/compute/v1/projects/'+item.projectId+'/zones',
                        	    'headers': {
                        	      'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
                        	    },
                        	    'data' : ""
                        	  };
//                        	  console.log("options");
//                              console.log(options);
                        	  
                              await axios(options)
                              .then(async response => {
//                        		  console.log("response.data");
//                        		  console.log(response.data);
                        	    	if (response.data.items.length == 0) {
                        	    		console.log("No zones found for project id "+item.id);
                        	    	}else{
	                        	    	for await (const zone of response.data.items) {
	                                        await new Promise(async function(zoneResolve, zoneReject){
	                                        	var string = zone.region.split('/');
	                                            var region=string[(string.length - 1)];
	                                        	let zoneSql = `SELECT * from c4_gcp_zones
		                                            where project_id = '${item.id}' and gcp_zone_id = '${zone.id}' and region = '${region}'`;
//	                                             console.log("zoneSql");
//	                                             console.log(zoneSql);
	                                            await dbHandler.executeQuery(zoneSql,async function(zoneInfo){
//	                                                 console.log("zoneInfo");
//	                                                 console.log(zoneInfo);
	                                                if(zoneInfo.length > 0){
	                                                    let updateData = {
                                                    		name : zone.name,
                                                    		description : zone.description,
                                                    		gcp_status : zone.status,
                                                    		response_obj : JSON.stringify(zone),
                                                    		updated_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
	                                                    };
//	                                                     console.log("updateData");
//	                                                     console.log(updateData);
	                                                    await dbHandler.updateTableData('c4_gcp_zones',{'id':zoneInfo[0].id},updateData,async function(err,result){
	                                                    	console.log("updated the zoneInfo with id "+zoneInfo[0].id);
	                                                    	zoneResolve("updated the zoneInfo with id "+zoneInfo[0].id);
	                                                    });
	                                                }else{
	                                                    let insData = {
                                                    		project_id : item.id,
                                                    		gcp_zone_id : zone.id,
                                                    		region : region,
                                                    		name : zone.name,
                                                    		description : zone.description,
                                                    		gcp_status : zone.status,
                                                    		response_obj : JSON.stringify(zone),
	                                                  		created_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
	                                                    };
//	                                                     console.log("insData");
//	                                                     console.log(insData);
	                                                    await dbHandler.insertIntoTable('c4_gcp_zones',insData,async function(error,zoneId){
	                                                        console.log("inserted the zoneInfo with id "+zoneId);
	                                                        zoneResolve("inserted the zoneInfo with id "+zoneId);
	                                                    });
	                                                }
	                                            });
	                                        });
	                                    }
	                        	    }
                        	  }).catch(error => {
                                  console.log("error");
                                  let res = {status:"error",message:error};
                                  if(error && error.response && error.response.data
                                		  && error.response.data.error 
                                		  && error.response.data.error.message){
                                	  res.message = error.response.data.error.message
                                  }
                                  console.log(res);
                                  itemResolve(res);
                              });
                          }
                        });
                        console.log("updated for project id "+item.id);
                        itemResolve("updated for project id "+item.id);
                      });
                  };
                  let res = {status:"success","message":"Updated GCP project Zones"};
                  console.log(res);
                  callback(null,res);
                  resolve(res);
              }else{
            	  let res = {status:"success","message":"No projects available to update the GCP zones"};
                  console.log(res);
                  callback(1,res);
                  reject(res);
              }
          }
          catch{
              resolve(0);
          }
      });
  });
}

/*
Author: Rajesh
Descriprion : sync regions list
Date  : 07-07-2020
*/
let syncGcpRegionsList= async (reqObj,callback)=>{
  // console.log(reqObj);
  let sql = `Select p.* from c4_gcp_projects as p
  inner join c4_clients as c on c.id = p.clientid
  where c.status = 1 and c.is_gcp_enabled = 1 and p.record_status = 1 `;
  if(typeof reqObj.id != 'undefined'){
      sql += ` and c.id = ${reqObj.id} order by id desc limit 1`;
  }else{
      sql += ` order by id asc`;
  }
  // sql += ' limit 1';
  //console.log(sql);
  await new Promise(function(resolve, reject) {
      dbHandler.executeQuery(sql,async function(items){
          // console.log("items");
          // console.log(items);
          try{
              if (items.length > 0) {
                  for await (const item of items) {
                      await new Promise(async function(itemResolve, itemReject){
                        await new Promise(function(resolve1,reject1){
                          gcp_authtoken(item.clientid, function(error, result){
                            // console.log("result");
                            // console.log(result);
                            // if(error){
                            //     resolve([])
                            // }else{
                                resolve1(result)
                            // }
                          })
                        }).then(async function(token){
                          // console.log("token");
                          // console.log(token);
                          if(token.tokendata.length == 0){
                            var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
                            itemResolve(response);
                          }else{
                        	  var options = {
                        	    'method': 'GET',
                        	    'url': 'https://compute.googleapis.com/compute/v1/projects/'+item.projectId+'/regions',
                        	    'headers': {
                        	      'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
                        	    },
                        	    'data' : ""
                        	  };
//                        	  console.log("options");
//                              console.log(options);
                        	  
                              await axios(options)
                              .then(async response => {
//                        		  console.log("response.data");
//                        		  console.log(response.data);
                        	    	if (response.data.items.length == 0) {
                        	    		console.log("No regions found for project id "+item.id);
                        	    	}else{
	                        	    	for await (const region of response.data.items) {
	                                        await new Promise(async function(regionResolve, regionReject){
	                                        	let regionSql = `SELECT * from c4_gcp_regions
		                                            where project_id = '${item.id}' and gcp_region_id = '${region.id}'`;
//	                                             console.log("regionSql");
//	                                             console.log(regionSql);
	                                            await dbHandler.executeQuery(regionSql,async function(regionInfo){
//	                                                 console.log("regionInfo");
//	                                                 console.log(regionInfo);
	                                                if(regionInfo.length > 0){
	                                                    let updateData = {
                                                    		name : region.name,
                                                    		description : region.description,
                                                    		gcp_status : region.status,
                                                    		response_obj : JSON.stringify(region),
                                                    		updated_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
	                                                    };
//	                                                     console.log("updateData");
//	                                                     console.log(updateData);
	                                                    await dbHandler.updateTableData('c4_gcp_regions',{'id':regionInfo[0].id},updateData,async function(err,result){
	                                                    	console.log("updated the regionInfo with id "+regionInfo[0].id);
	                                                    	regionResolve("updated the regionInfo with id "+regionInfo[0].id);
	                                                    });
	                                                }else{
	                                                    let insData = {
                                                    		project_id : item.id,
                                                    		gcp_region_id : region.id,
                                                    		name : region.name,
                                                    		description : region.description,
                                                    		gcp_status : region.status,
                                                    		response_obj : JSON.stringify(region),
	                                                  		created_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
	                                                    };
//	                                                     console.log("insData");
//	                                                     console.log(insData);
	                                                    await dbHandler.insertIntoTable('c4_gcp_regions',insData,async function(error,regionId){
	                                                        console.log("inserted the regionInfo with id "+regionId);
	                                                        regionResolve("inserted the regionInfo with id "+regionId);
	                                                    });
	                                                }
	                                            });
	                                        });
	                                    }
	                        	    }
                        	  }).catch(error => {
                                  console.log("error");
                                  let res = {status:"error",message:error};
                                  if(error && error.response && error.response.data
                                		  && error.response.data.error 
                                		  && error.response.data.error.message){
                                	  res.message = error.response.data.error.message
                                  }
                                  console.log(res);
                                  itemResolve(res);
                              });
                          }
                        });
                        console.log("updated for project id "+item.id);
                        itemResolve("updated for project id "+item.id);
                      });
                  };
                  let res = {status:"success","message":"Updated GCP project regions"};
                  console.log(res);
                  callback(null,res);
                  resolve(res);
              }else{
            	  let res = {status:"success","message":"No projects available to update the GCP regions"};
                  console.log(res);
                  callback(1,res);
                  reject(res);
              }
          }
          catch{
              resolve(0);
          }
      });
  });
}

/*
Author: Rajesh
Descriprion: sync images list
Date  : 09-07-2020
*/
let syncGcpImagesList= async (reqObj,callback)=>{
  // console.log(reqObj);
  let sql = `Select p.* from c4_gcp_projects as p
  inner join c4_clients as c on c.id = p.clientid
  where c.status = 1 and c.is_gcp_enabled = 1 and p.record_status = 1 `;
  if(typeof reqObj.id != 'undefined'){
      sql += ` and c.id = ${reqObj.id} order by id desc limit 1`;
  }else{
      sql += ` order by id asc`;
  }
//   sql += ' limit 1';
  //console.log(sql);
  await new Promise(function(resolve, reject) {
      dbHandler.executeQuery(sql,async function(items){
          // console.log("items");
          // console.log(items);
          try{
              if (items.length > 0) {
                  for await (const item of items) {
                      await new Promise(async function(itemResolve, itemReject){
                        await new Promise(function(resolve1,reject1){
                          gcp_authtoken(item.clientid, function(error, result){
                                resolve1(result)
                          })
                        }).then(async function(token){
                          // console.log("token");
                          // console.log(token);
                          if(token.tokendata.length == 0){
                            var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
                            itemResolve(response);
                          }else{
                        	  //syncing the global images first and only for first iteration
                        	  if(typeof reqObj.id == 'undefined' && item.id == items[0].id){
                        			await new Promise(async function(globalResolve, globalReject) {
                        		      let globalImageTypes = ['ubuntu-os-cloud', 'windows-cloud', 'suse-cloud', 'rhel-cloud', 'centos-cloud', 'debian-cloud'];
                        		           console.log("globalImageTypes");
                        		           console.log(globalImageTypes);
                        		          try{
                        		              if (globalImageTypes.length > 0) {
                        		                  for await (const globalImageType of globalImageTypes) {
                        		                	  console.log("globalImageType");
                        		        	           console.log(globalImageType);
                        		                      await new Promise(async function(globalImageTypeResolve, globalImageTypeReject){
                    		                        	  var options = {
                    		                        	    'method': 'GET',
                    		                        	    'url': 'https://compute.googleapis.com/compute/v1/projects/'+globalImageType+'/global/images',
                    		                        	    'headers': {
                    		                        	      'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
                    		                        	    },
                    		                        	    'data' : ""
                    		                        	  };
//                        		                        	  console.log("options");
//                        		                              console.log(options);
                    		                        	  
                    		                              await axios(options)
                    		                              .then(async response => {
//                        		                        		  console.log("response.data");
//                        		                        		  console.log(response.data);
                    		                        	    	if (response.data.items.length == 0) {
                    		                        	    		console.log("No images found for globalImageType "+globalImageType);
                    		                        	    	}else{
                    			                        	    	for await (const globalImage of response.data.items) {
                    			                                        await new Promise(async function(globalImageResolve, globalImageReject){
                    			                                        	let globalImageSql = `SELECT * from c4_gcp_images
                    				                                            where image_type = 'public' and image_id = '${globalImage.id}' and imagecloudtype = '${globalImageType}' `;
//                        			                                             console.log("globalImageSql");
//                        			                                             console.log(globalImageSql);
                    			                                            await dbHandler.executeQuery(globalImageSql,async function(globalImageInfo){
//                        			                                                 console.log("globalImageInfo");
//                        			                                                 console.log(globalImageInfo);
                    			                                                if(globalImageInfo.length > 0){
                    			                                                    let globalImageUpdateData = {
                			                                                    		image_name : globalImage.name,
                			                                                    		image_description : globalImage.description,
                			                                                    		diskSizeGb : globalImage.diskSizeGb,
                    		                                                    		response_obj : JSON.stringify(globalImage),
                    		                                                    		updated_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
                    			                                                    };
//                        			                                                     console.log("globalImageUpdateData");
//                        			                                                     console.log(globalImageUpdateData);
                    			                                                    await dbHandler.updateTableData('c4_gcp_images',{'id':globalImageInfo[0].id},globalImageUpdateData,async function(err,result){
                    			                                                    	console.log("updated the globalImageInfo with id "+globalImageInfo[0].id);
                    			                                                    	globalImageResolve("updated the globalImageInfo with id "+globalImageInfo[0].id);
                    			                                                    });
                    			                                                }else{
                    			                                                    let globalImageInsData = {
                			                                                    		image_type : 'public',
                			                                                    		image_id : globalImage.id,
                    		                                                    		image_name : globalImage.name,
                			                                                    		image_description : globalImage.description,
                			                                                    		diskSizeGb : globalImage.diskSizeGb,
                			                                                    		os_type : ((globalImageType == 'windows-cloud')?'windows':'linux'),
                			                                                    		imagecloudtype : globalImageType,
                    		                                                    		response_obj : JSON.stringify(globalImage),
                    			                                                  		created_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
                    			                                                    };
//                        			                                                     console.log("globalImageInsData");
//                        			                                                     console.log(globalImageInsData);
                    			                                                    await dbHandler.insertIntoTable('c4_gcp_images',globalImageInsData,async function(error,globalImageId){
                    			                                                        console.log("inserted the globalImageInfo with id "+globalImageId);
                    			                                                        globalImageResolve("inserted the globalImageInfo with id "+globalImageId);
                    			                                                    });
                    			                                                }
                    			                                            });
                    			                                        });
                    			                                    }
                    			                        	    }
                    		                        	  }).catch(error => {
                    		                                  console.log("error");
                    		                                  let res = {status:"error",message:error};
                    		                                  if(error && error.response && error.response.data
                    		                                		  && error.response.data.error 
                    		                                		  && error.response.data.error.message){
                    		                                	  res.message = error.response.data.error.message
                    		                                  }
                    		                                  console.log(res);
                    		                                  globalImageTypeResolve(res);
                    		                              });
                        		                        console.log("updated for globalImageType "+globalImageType);
                        		                        globalImageTypeResolve("updated for globalImageType "+globalImageType);
                        		                      });
                        		                  };
                        		                  let res = {status:"success","message":"Updated GCP globalImages"};
                        		                  console.log(res);
                        		                  globalResolve(res);
                        		              }else{
                        		            	  let res = {status:"success","message":"No projects available to update the GCP globalImages"};
                        		                  console.log(res);
                        		                  globalResolve(res);
                        		              }
                        		          }
                        		          catch{
                        		        	  globalResolve(0);
                        		          }
                        		  });
                        		}
                        	  var options = {
                        	    'method': 'GET',
                        	    'url': 'https://compute.googleapis.com/compute/v1/projects/'+item.projectId+'/global/images',
                        	    'headers': {
                        	      'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
                        	    },
                        	    'data' : ""
                        	  };
//                        	  console.log("options");
//                              console.log(options);
                        	  
                              await axios(options)
                              .then(async response => {
//                        		  console.log("response.data");
//                        		  console.log(response.data);
                        	    	if (!response.data.items || response.data.items.length == 0) {
                        	    		console.log("No images found for project id "+item.projectId);
                        	    	}else{
                        	    		for await (const image of response.data.items) {
	                                        await new Promise(async function(imageResolve, imageReject){
	                                        	let imageSql = `SELECT * from c4_gcp_images
		                                            where image_type = 'private' and image_id = '${image.id}' and imagecloudtype = '${item.projectId}' and clientid = '${item.clientid}' `;
//		                                             console.log("imageSql");
//		                                             console.log(imageSql);
	                                            await dbHandler.executeQuery(imageSql,async function(imageInfo){
//		                                                 console.log("imageInfo");
//		                                                 console.log(imageInfo);
	                                                if(imageInfo.length > 0){
	                                                    let imageUpdateData = {
                                                    		image_name : image.name,
                                                    		image_description : image.description,
                                                    		diskSizeGb : image.diskSizeGb,
                                                    		response_obj : JSON.stringify(image),
                                                    		updated_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
	                                                    };
//		                                                     console.log("imageUpdateData");
//		                                                     console.log(imageUpdateData);
	                                                    await dbHandler.updateTableData('c4_gcp_images',{'id':imageInfo[0].id},imageUpdateData,async function(err,result){
	                                                    	console.log("updated the imageInfo with id "+imageInfo[0].id);
	                                                    	imageResolve("updated the imageInfo with id "+imageInfo[0].id);
	                                                    });
	                                                }else{
	                                                    let imageInsData = {
                                                    		clientid : item.clientid,
                                                    		image_type : 'public',
                                                    		image_id : image.id,
                                                    		image_name : image.name,
                                                    		image_description : image.description,
                                                    		diskSizeGb : image.diskSizeGb,
                                                    		os_type : ((image.name.indexOf('windows') != -1)?'windows':'linux'),
                                                    		imagecloudtype : item.projectId,
                                                    		response_obj : JSON.stringify(image),
	                                                  		created_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
	                                                    };
//		                                                     console.log("imageInsData");
//		                                                     console.log(imageInsData);
	                                                    await dbHandler.insertIntoTable('c4_gcp_images',imageInsData,async function(error,imageId){
	                                                        console.log("inserted the imageInfo with id "+imageId);
	                                                        imageResolve("inserted the imageInfo with id "+imageId);
	                                                    });
	                                                }
	                                            });
	                                        });
	                                    }
	                        	    }
                        	  }).catch(error => {
                                  console.log("error");
                                  let res = {status:"error",message:error};
                                  if(error && error.response && error.response.data
                                		  && error.response.data.error 
                                		  && error.response.data.error.message){
                                	  res.message = error.response.data.error.message
                                  }
                                  console.log(res);
                                  itemResolve(res);
                              });
                          }
                        });
                        console.log("updated for project id "+item.projectId);
                        itemResolve("updated for project id "+item.projectId);
                      });
                  };
                  let res = {status:"success","message":"Updated GCP project images"};
                  console.log(res);
                  callback(null,res);
                  resolve(res);
              }else{
            	  let res = {status:"success","message":"No projects available to update the GCP images"};
                  console.log(res);
                  callback(1,res);
                  reject(res);
              }
          }
          catch{
              resolve(0);
          }
      });
  });
}
/*
Author: Pradeep
Descri: sync vms
Date  : 09-07-2020
*/
let syncGcpVms= async (reqObj)=>{
//	reqObj.zoneName = 'asia-east1-a';
	//console.log(reqObj);
	let sql = `Select c.id,prj.projectId,z.name from c4_clients as c 
	inner join c4_gcp_projects as prj on prj.clientid=c.id 
	inner join c4_gcp_zones as z on z.project_id=prj.id 
	where c.status = 1 and c.is_gcp_enabled = 1 and prj.record_status=1 and 
	z.record_status=1 `;
	if(typeof reqObj.clientid != 'undefined'){
	    sql += ` and c.id = '${reqObj.clientid}'`;
	}
	if(typeof reqObj.projectId != 'undefined'){
	    sql += ` and prj.projectId = '${reqObj.projectId}'`;
	}
	if(typeof reqObj.zoneName != 'undefined'){
	    sql += ` and z.name = '${reqObj.zoneName}'`;
	}
	
    sql += ` group by z.project_id,z.name order by z.id desc`;
	// sql += ' limit 1';
	console.log(sql);
	await dbHandler.executeQuery(sql,async function(GcpClients){
		try{
			if (GcpClients.length > 0) {
				for await (const item of GcpClients) {
					await new Promise(async function(resolve, reject){
						await new Promise(async function(itemResolve, itemReject){
							gcp_authtoken(item.id, function(error, result){
								itemResolve(result)
							})
						}).then(async function(token){
							// console.log("token");
							//console.log(token);
							if(token.length == 0){
								var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
								resolve(response)
							}else{
								var options = {
									'method': 'GET',
									'url': `https://compute.googleapis.com/compute/v1/projects/${item.projectId}/zones/${item.name}/instances`,
									'headers': {
									'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
									},
									'data' : ""
								};
								console.log(`https://compute.googleapis.com/compute/v1/projects/${item.projectId}/zones/${item.name}/instances`)
								await axios(options)
								.then(async response => {
									//console.log("response.data");
									//console.log(response.data);
									//resolve(response)
									//return callback(1,response.data)
									if(response && response.data && response.data.items){
										for await(var vm of response.data.items){
											await new Promise(async function(resolve1,reject1){
												var vmDetail=await new Promise(function(resolve2,reject2){
													var sql=`select * from gcp_vms where instanceId='${vm.id}' and status!='Deleted'`
													dbHandler.executeQuery(sql,function(result){
														if(result)
														resolve2(result[0])
														else resolve1('')
													})
												})
												var vm_status='poweredOff';
												if(vm.status=='RUNNING')
												vm_status='poweredOn'
												var str = vm.machineType;
												var index = str.lastIndexOf('/');
												var machineType = str.substring(index +1);
												var str = vm.zone;
												var index = str.lastIndexOf('/');
												var zone = str.substring(index +1);
												var primary_ip=''
												var public_ip=''
												if(vm.networkInterfaces && vm.networkInterfaces[0].networkIP)
													primary_ip=vm.networkInterfaces[0].networkIP
												if(vm.networkInterfaces && vm.networkInterfaces[0].accessConfigs && vm.networkInterfaces[0].accessConfigs[0].natIP)
													public_ip=vm.networkInterfaces[0].accessConfigs[0].natIP
												var diskSizeGb=0;
												if(vm.disks && vm.disks[0].diskSizeGb)
													diskSizeGb=vm.disks[0].diskSizeGb
													
												let sql2 = `SELECT m.* from gcp_machinetypes as m
													inner join c4_gcp_projects as p on p.projectId = m.projectId
                                                    where p.clientid = '${item.id}' and m.name='${machineType}' and m.zone = '${zone}'`;
												console.log('size sql2')
												console.log(sql2)
                                                var instanceType=await new Promise(async function(machinetypeResolve, machinetypeReject){
                                                  dbHandler.executeQuery(sql2,async function(result){
                                                	  machinetypeResolve(result[0])
                                                  })
                                                })
                                                if(!instanceType){
                                                  instanceType={guestCpus:0,memoryMb:0}
                                                }

												var updateData={
													instanceId:vm.id,
													clientid:item.id,
													name:vm.name,
													status:vm_status,
													machineType:machineType,
													projectId:item.projectId,
													zone:zone,
													primary_ip:primary_ip,
													public_ip:public_ip,
													memoryMb:instanceType.memoryMb,
													guestCpus:instanceType.guestCpus,
													diskSizeGb:diskSizeGb,
													creationTimestamp:dateFormat(vm.creationTimestamp, "yyyy-mm-dd HH:MM:ss")
												}
												if(vmDetail){
													console.log('update data')
													console.log(updateData)
													dbHandler.updateTableData('gcp_vms',{id:vmDetail.id},updateData,function(err,result){
														vmUpdate={
	                                                        host_name: updateData.name,
	                                                        label_name: updateData.name,
	                                                        ref_id: updateData.instanceId,
	                                                        ram_units_gb: (instanceType.memoryMb / 1024),
	                                                        cpu_units: instanceType.guestCpus,
	                                                        disk_units_gb: updateData.diskSizeGb,
	                                                        multiple_ip: JSON.stringify({"ip_address":updateData.primary_ip}),
	                                                        primary_ip: updateData.public_ip,
	                                                        username: "",
	                                                        power_status: updateData.status,
	                                                        vm_status: vm.status.charAt(0).toUpperCase() + vm.status.toLowerCase().slice(1),
	                                                        vdc_id : config.GCP.vdc_id,
	                                                        tech_id : config.GCP.tech_id,
	                                                        updateddate : new Date().getTime() / 1000
														}
                                                     // console.log(vmUpdate);
														dbHandler.updateTableData('c4_vm_details',{id:vmDetail.vm_detail_id},vmUpdate,function(err,result){
															console.log("updated the vms data with id "+vmDetail.id);
															resolve1("updated the vms data with id "+vmDetail.id);
														})  
//														resolve1('')
													})
												}else{
													//console.log('insert data')
													//console.log(updateData)
													dbHandler.insertIntoTable('gcp_vms',updateData, async function(err,gcp_vm_id){
														if(err){
															resolve1([]);
                                                        }else{
                                                            var vc_sql=`select c.* from c4_vm_creation as c
                                                            where c.host_name='${updateData.name}' and c.label_name='${updateData.name}' 
                                                            and c.cloudid='${config.GCP.cloudid}' and c.clientid='${token.clientdata.id}' and c.order_details_id <> 0`
                                                            
                                                            //console.log("vc_sql");
                                                            //console.log(vc_sql);
                                                            await dbHandler.executeQuery(vc_sql,async function(vm_creation_result){
                                                            // await dbHandler.getOneRecord('c4_vm_creation',whereQry,async function(vm_creation_result){
                                                              //console.log("c4_vm_creation result");
                                                              //console.log(vm_creation_result);
                                                              if(vm_creation_result.length > 0){
                                                                orderDetailsId = vm_creation_result[0].order_details_id;
                                                                //console.log("orderDetailsId");
                                                                //console.log(orderDetailsId);

                                                                vm_details_insertdata={
                                                                	cloudid : vm_creation_result[0].cloudid,
                                                                	order_details_id : orderDetailsId,
                                                                	clientid : token.clientdata.id,
                                                                	host_name: updateData.name,
        	                                                        label_name: updateData.name,
        	                                                        ref_id: updateData.instanceId,
        	                                                        ram_units_gb: (instanceType.memoryMb / 1024),
        	                                                        cpu_units: instanceType.guestCpus,
        	                                                        disk_units_gb: updateData.diskSizeGb,
        	                                                        multiple_ip: JSON.stringify({"ip_address":updateData.primary_ip}),
        	                                                        primary_ip: updateData.public_ip,
        	                                                        username: "",
        	                                                        os_id : vm_creation_result[0].osid,
        	                                                        power_status: updateData.status,
        	                                                        vm_status: vm.status.charAt(0).toUpperCase() + vm.status.toLowerCase().slice(1),
        	                                                        vdc_id : config.GCP.vdc_id,
        	                                                        tech_id : config.GCP.tech_id,
        	                                                        createddate : new Date().getTime() / 1000
                                                                }
                                                                await dbHandler.insertIntoTable('c4_vm_details',vm_details_insertdata,async function(err,vmDetailsId){
                                                                  if(err){
                                                                    imageResolve([]);
                                                                  }else{
                                                                    await dbHandler.updateTableData('c4_order_details',{id:orderDetailsId},{'status':'1',vmid:vmDetailsId,'updateddate':(new Date().getTime() / 1000)},function(err,result){ });
                                                                    await dbHandler.updateTableData('gcp_vms',{id:gcp_vm_id},{vm_detail_id:vmDetailsId},function(err,result){ });
                                                                    //console.log("gcp_vm_id");
                                                                    console.log("inserted the vms data with id "+gcp_vm_id);
                                                                    resolve1("inserted the vms data with id "+gcp_vm_id);
                                                                  }
                                                                })
                                                              }else{
                                                            	  //console.log("updateData");
                                                                  //console.log(updateData);
                                                                vm_details_insertdata={
                                                                		host_name: updateData.name,
            	                                                        label_name: updateData.name,
            	                                                        ref_id: updateData.instanceId,
            	                                                        ram_units_gb: (instanceType.memoryMb / 1024),
            	                                                        cpu_units: instanceType.guestCpus,
            	                                                        disk_units_gb: updateData.diskSizeGb,
            	                                                        multiple_ip: JSON.stringify({"ip_address":updateData.primary_ip}),
            	                                                        primary_ip: updateData.public_ip,
            	                                                        username: "",
            	                                                        power_status: updateData.status,
            	                                                        vm_status: vm.status.charAt(0).toUpperCase() + vm.status.toLowerCase().slice(1),
            	                                                        vdc_id : config.GCP.vdc_id,
            	                                                        tech_id : config.GCP.tech_id
                                                                }
                                                                vm_details_insertdata.order_type = config.GCP.cloud_name;
                                                                vm_details_insertdata.cloudid = config.GCP.cloudid;
                                                                vm_details_insertdata.othercloud_vm_id = gcp_vm_id;
                                                                vm_details_insertdata.othercloud_vm_table = "gcp_vms";
                                                                token.vmdata = vm_details_insertdata;
                                                                return createNewOrder(token,async function(err,response){
                                                                  //console.log("response");
                                                                  //console.log(response);
                                                                  //console.log("gcp_vm_id");
                                                                  console.log("inserted the vms data with id "+gcp_vm_id);
                                                                  resolve1("inserted the vms data with id "+gcp_vm_id);
                                                                });
                                                              }
                                                            });
                                                        }
//														resolve1('')
													})
												}
												
											})
											
										}
										console.log("Entered else block1")
										resolve('')
									}else{
										console.log("Entered else block2")
										resolve('')
									}
								})
								.catch(error => {
									console.log(error.response)
									resolve('')
								 })
							}
						})
					})
				}
				
			}
		}catch(e){
			console.log("Catch:"+e)
		}
	})
  }
/*
Author: Pradeep
Descri: sync vm status
Date  : 09-07-2020
*/
let syncGcpVmStatus= async (reqObj)=>{
	//	reqObj.zoneName = 'asia-east1-a';
		//console.log(reqObj);
		let sql = `select * from gcp_vms where status!='Deleted'`;
		if(reqObj.clientid){
			sql += ` and clientid = ${reqObj.clientid}`;
		}
		await dbHandler.executeQuery(sql,async function(GcpClients){
			try{
				if (GcpClients.length > 0) {
					for await (const item of GcpClients) {
						await new Promise(async function(resolve, reject){
							await new Promise(async function(itemResolve, itemReject){
								gcp_authtoken(item.clientid, function(error, result){
									itemResolve(result)
								})
							}).then(async function(token){
								// console.log("token");
								// console.log(token);
								if(token.length == 0){
									var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
									resolve(response)
								}else{
									var options = {
										'method': 'GET',
										'url': `https://compute.googleapis.com/compute/v1/projects/${item.projectId}/zones/${item.zone}/instances/${item.name}`,
										'headers': {
										'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
										},
										'data' : ""
									};
									await axios(options)
									.then(async response => {
										console.log("response.data");
										console.log(response.data);
										console.log(JSON.stringify(response.data));
										//return 1;
										if(response && response.data && response.data.items){
											for await(var vm of response.data.items){
												await new Promise(async function(resolve1,reject1){
													var vmDetail=await new Promise(function(resolve2,reject2){
														var sql=`select * from gcp_vms where instanceId='${vm.id}' and status!='Deleted'`
														dbHandler.executeQuery(sql,function(result){
															if(result)
															resolve2(result[0])
															else resolve1('')
														})
													})
													var vm_status='poweredOff';
													if(vm.status=='RUNNING')
													vm_status='poweredOn'
													var str = vm.machineType;
													var index = str.lastIndexOf('/');
													var machineType = str.substring(index +1);
													var str = vm.zone;
													var index = str.lastIndexOf('/');
													var zone = str.substring(index +1);
													var primary_ip=''
													var public_ip=''
													if(vm.networkInterfaces && vm.networkInterfaces[0].networkIP)
														primary_ip=vm.networkInterfaces[0].networkIP
													if(vm.networkInterfaces && vm.networkInterfaces[0].accessConfigs && vm.networkInterfaces[0].accessConfigs[0].natIP)
														public_ip=vm.networkInterfaces[0].accessConfigs[0].natIP
													var diskSizeGb=0;
													if(vm.disks && vm.disks[0].diskSizeGb)
														diskSizeGb=vm.disks[0].diskSizeGb
														
													let sql2 = `SELECT m.* from gcp_machinetypes as m
														inner join c4_gcp_projects as p on p.projectId = m.projectId
														where p.clientid = '${item.id}' and m.name='${machineType}' and m.zone = '${zone}'`;
													console.log('size sql2')
													console.log(sql2)
													var instanceType=await new Promise(async function(machinetypeResolve, machinetypeReject){
													  dbHandler.executeQuery(sql2,async function(result){
														  machinetypeResolve(result[0])
													  })
													})
													if(!instanceType){
													  instanceType={guestCpus:0,memoryMb:0}
													}
	
													var updateData={
														instanceId:vm.id,
														clientid:item.id,
														name:vm.name,
														status:vm_status,
														machineType:machineType,
														projectId:item.projectId,
														zone:zone,
														primary_ip:primary_ip,
														public_ip:public_ip,
														memoryMb:instanceType.memoryMb,
														guestCpus:instanceType.guestCpus,
														diskSizeGb:diskSizeGb,
														creationTimestamp:dateFormat(vm.creationTimestamp, "yyyy-mm-dd HH:MM:ss")
													}
													if(vmDetail){
														console.log('update data')
														//console.log(updateData)
														dbHandler.updateTableData('gcp_vms',{id:vmDetail.id},updateData,function(err,result){
															vmUpdate={
																host_name: updateData.name,
																label_name: updateData.name,
																ref_id: updateData.instanceId,
																ram_units_gb: (instanceType.memoryMb / 1024),
																cpu_units: instanceType.guestCpus,
																disk_units_gb: updateData.diskSizeGb,
																multiple_ip: JSON.stringify({"ip_address":updateData.primary_ip}),
																primary_ip: updateData.public_ip,
																username: "",
																power_status: updateData.status,
																vm_status: vm.status.charAt(0).toUpperCase() + vm.status.toLowerCase().slice(1),
																vdc_id : config.GCP.vdc_id,
																tech_id : config.GCP.tech_id,
																updateddate : new Date().getTime() / 1000
															}
														 // console.log(vmUpdate);
															dbHandler.updateTableData('c4_vm_details',{id:vmDetail.vm_detail_id},vmUpdate,function(err,result){
																console.log("updated the vms data with id "+vmDetail.id);
																resolve1("updated the vms data with id "+vmDetail.id);
															})  
	//														resolve1('')
														})
													}else{
														//console.log('insert data')
														//console.log(updateData)
														dbHandler.insertIntoTable('gcp_vms',updateData, async function(err,gcp_vm_id){
															if(err){
																resolve1([]);
															}else{
																var vc_sql=`select c.* from c4_vm_creation as c
																where c.host_name='${updateData.name}' and c.label_name='${updateData.name}' 
																and c.cloudid='${config.GCP.cloudid}' and c.clientid='${token.clientdata.id}' and c.order_details_id <> 0`
																
																//console.log("vc_sql");
																//console.log(vc_sql);
																await dbHandler.executeQuery(vc_sql,async function(vm_creation_result){
																// await dbHandler.getOneRecord('c4_vm_creation',whereQry,async function(vm_creation_result){
																  //console.log("c4_vm_creation result");
																  //console.log(vm_creation_result);
																  if(vm_creation_result.length > 0){
																	orderDetailsId = vm_creation_result[0].order_details_id;
																	//console.log("orderDetailsId");
																	//console.log(orderDetailsId);
	
																	vm_details_insertdata={
																		cloudid : vm_creation_result[0].cloudid,
																		order_details_id : orderDetailsId,
																		clientid : token.clientdata.id,
																		host_name: updateData.name,
																		label_name: updateData.name,
																		ref_id: updateData.instanceId,
																		ram_units_gb: (instanceType.memoryMb / 1024),
																		cpu_units: instanceType.guestCpus,
																		disk_units_gb: updateData.diskSizeGb,
																		multiple_ip: JSON.stringify({"ip_address":updateData.primary_ip}),
																		primary_ip: updateData.public_ip,
																		username: "",
																		power_status: updateData.status,
																		vm_status: vm.status.charAt(0).toUpperCase() + vm.status.toLowerCase().slice(1),
																		vdc_id : config.GCP.vdc_id,
																		tech_id : config.GCP.tech_id,
																		createddate : new Date().getTime() / 1000
																	}
																	await dbHandler.insertIntoTable('c4_vm_details',vm_details_insertdata,async function(err,vmDetailsId){
																	  if(err){
																		imageResolve([]);
																	  }else{
																		await dbHandler.updateTableData('c4_order_details',{id:orderDetailsId},{'status':'1',vmid:vmDetailsId,'updateddate':(new Date().getTime() / 1000)},function(err,result){ });
																		await dbHandler.updateTableData('gcp_vms',{id:gcp_vm_id},{vm_detail_id:vmDetailsId},function(err,result){ });
																		//console.log("gcp_vm_id");
																		console.log("inserted the vms data with id "+gcp_vm_id);
																		resolve1("inserted the vms data with id "+gcp_vm_id);
																	  }
																	})
																  }else{
																	  //console.log("updateData");
																	  //console.log(updateData);
																	vm_details_insertdata={
																			host_name: updateData.name,
																			label_name: updateData.name,
																			ref_id: updateData.instanceId,
																			ram_units_gb: (instanceType.memoryMb / 1024),
																			cpu_units: instanceType.guestCpus,
																			disk_units_gb: updateData.diskSizeGb,
																			multiple_ip: JSON.stringify({"ip_address":updateData.primary_ip}),
																			primary_ip: updateData.public_ip,
																			username: "",
																			power_status: updateData.status,
																			vm_status: vm.status.charAt(0).toUpperCase() + vm.status.toLowerCase().slice(1),
																			vdc_id : config.GCP.vdc_id,
																			tech_id : config.GCP.tech_id
																	}
																	vm_details_insertdata.order_type = config.GCP.cloud_name;
																	vm_details_insertdata.cloudid = config.GCP.cloudid;
																	vm_details_insertdata.othercloud_vm_id = gcp_vm_id;
																	vm_details_insertdata.othercloud_vm_table = "gcp_vms";
																	token.vmdata = vm_details_insertdata;
																	return createNewOrder(token,async function(err,response){
																	  //console.log("response");
																	  //console.log(response);
																	  //console.log("gcp_vm_id");
																	  console.log("inserted the vms data with id "+gcp_vm_id);
																	  resolve1("inserted the vms data with id "+gcp_vm_id);
																	});
																  }
																});
															}
	//														resolve1('')
														})
													}
													
												})
												
											}
											console.log("Entered else block1")
											resolve('')
										}else{
											console.log("Entered else block3")
											resolve('')
										}
									})
									.catch(error => {
										if(error && error.response && error.response.data.error && error.response.data.error.code==404){
											console.log("Entered else block2")
											dbHandler.updateTableData('c4_vm_details',{id:item.vm_detail_id,clientid:item.clientid},{'status':'0',vm_status:'Deleted'},function(err,result){ 
												dbHandler.updateTableData('c4_order_details',{vmid:item.vm_detail_id},{status:0},function(err,result){
												})
											});
											dbHandler.updateTableData('gcp_vms',{vm_detail_id:item.vm_detail_id,clientid:item.clientid},{status:'Deleted'},function(err,result){ });
											resolve('')
										}
										resolve('')
									 })
								}
							})
						})
					}
					
				}
			}catch(e){
				console.log("Catch:"+e)
			}
		})
	  }
let createNewOrder=(data,callback)=>{
	//console.log("data");
    //console.log(data);
  new Promise(function(resolve,reject){
    var odrValues = {
      'order_number' : helper.getRandomNumber(),
      'clientid': data.clientdata.id,
      'createddate' : (new Date().getTime() / 1000),
    };
    db.query("INSERT INTO c4_orders SET ?", odrValues ,async function(error,orderRows,fields){
        if(error) {
            dbFunc.connectionRelease;
            callback(1,'The operation did not execute as expected. Please raise a ticket to support')
            reject(error);
        } else {
            dbFunc.connectionRelease;
            //console.log(orderRows);
            let orderId = orderRows.insertId

            var odrDetailsValues = {
              'order_id' : orderId,
              'order_type' : data.vmdata.order_type,
              'clientid': data.clientdata.id,
              'reference_id' : data.vmdata.ref_id,
              'status':1,
              'createddate' : (new Date().getTime() / 1000),
              'billing_frequency':"FREE",
              'quantity' : 1
            };

            
            return await dbHandler.insertIntoTable('c4_order_details',odrDetailsValues,async function(error,orderDetailsId){
                if(error) {
                    dbFunc.connectionRelease;
                    callback(1,'The operation did not execute as expected. Please raise a ticket to support')
                    reject(error);
                } else {
                    dbFunc.connectionRelease;
                    //console.log("orderDetailsId");
                    //console.log(orderDetailsId);

                    insertdata={
                      cloudid : data.vmdata.cloudid,
                      order_details_id : orderDetailsId,
                      clientid : data.clientdata.id,
                      host_name:data.vmdata.host_name,
                      label_name:data.vmdata.label_name,
                      ref_id:data.vmdata.ref_id,
                      multiple_ip:JSON.stringify({"ip_address":data.vmdata.private_ip}),
                      primary_ip:data.vmdata.public_ip,
                      username:data.vmdata.username,
                      ram_units_gb: data.vmdata.ram_units_gb,
                      cpu_units: data.vmdata.cpu_units,
                      disk_units_gb: data.vmdata.disk_units_gb,
                      power_status:data.vmdata.power_status,
                      vm_status:data.vmdata.vm_status,
                      vdc_id : data.vmdata.vdc_id,
                      tech_id : data.vmdata.tech_id,
                      createddate : new Date().getTime() / 1000
                    }
                    await dbHandler.insertIntoTable('c4_vm_details',insertdata,async function(err,vmDetailsId){
                      if(err){
                        callback(1,'The operation did not execute as expected. Please raise a ticket to support')
                        reject(error);
                      }else{
                        await dbHandler.updateTableData('c4_order_details',{id:orderDetailsId},{vmid:vmDetailsId},function(err,result){ });
                        await dbHandler.updateTableData(data.vmdata.othercloud_vm_table,{id:data.vmdata.othercloud_vm_id},{vm_detail_id:vmDetailsId},function(err,result){ });
                        //console.log("vmDetailsId");
                        //console.log(vmDetailsId);
                        callback(null,'order created')
                        resolve(response);
                      }
                    })
                }
            });
            
        }
    });
  });
};

/*
Author: Pradeep
Descri: sync vm details
Date  : 09-07-2020
*/
let syncGcpVmDetail= async (reqObj,callback)=>{
	// console.log(reqObj);
	let sql = `Select * from gcp_vms where status!='Deleted'`;
	if(typeof reqObj.instanceId != 'undefined'){
		sql += ` and instanceId = '${reqObj.instanceId}'`;
	}
	// sql += ' limit 1';
	//console.log(sql);
	await dbHandler.executeQuery(sql,async function(GcpClients){
		try{
			if (GcpClients.length > 0) {
				for await (const item of GcpClients) {
					await new Promise(async function(resolve, reject){
						await new Promise(function(itemResolve, itemReject){
							gcp_authtoken(item.clientid, function(error, result){
								itemResolve(result)
							})
						}).then(async function(token){
							// console.log("token");
							// console.log(token);
							if(token.length == 0){
								var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
								resolve(response)
							}else{
								var url=`https://compute.googleapis.com/compute/v1/projects/${item.projectId}/zones/${item.zone}/instances/${item.instanceId}`
								var options = {
									'method': 'GET',
									'url': url,
									'headers': {
									'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
									},
									'data' : ""
								};
								console.log(url)
								await axios(options)
								.then(async response => {
									//console.log("response.data");
									//console.log(response.data);
									//resolve(response)
									//return callback(1,response.data)
									if(response && response.data){
										var vm=response.data
										var vm_status='poweredOff';
										if(vm.status=='RUNNING')
										vm_status='poweredOn'
										var str = vm.machineType;
										var index = str.lastIndexOf('/');
										var machineType = str.substring(index +1);
										var str = vm.zone;
										var index = str.lastIndexOf('/');
										var zone = str.substring(index +1);
										var primary_ip=''
										var public_ip=''
										if(vm.networkInterfaces && vm.networkInterfaces[0].networkIP)
											primary_ip=vm.networkInterfaces[0].networkIP
										if(vm.networkInterfaces && vm.networkInterfaces[0].accessConfigs && vm.networkInterfaces[0].accessConfigs[0].natIP)
											public_ip=vm.networkInterfaces[0].accessConfigs[0].natIP
										var diskSizeGb=0;
										if(vm.disks && vm.disks[0].diskSizeGb)
											diskSizeGb=vm.disks[0].diskSizeGb

										let sql2 = `SELECT m.* from gcp_machinetypes as m
											inner join c4_gcp_projects as p on p.projectId = m.projectId
                                            where p.clientid = '${item.clientid}' and m.name='${machineType}'`; // and m.zone = '${zone}'
										//console.log('size sql2')
										//console.log(sql2)
                                        var instanceType=await new Promise(async function(machinetypeResolve, machinetypeReject){
                                          dbHandler.executeQuery(sql2,async function(result){
                                        	  machinetypeResolve(result[0])
                                          })
                                        })
                                        if(!instanceType){
                                          instanceType={guestCpus:0,memoryMb:0}
                                        }
                                        
										var updateData={
											instanceId:vm.id,
											name:vm.name,
											status:vm_status,
											machineType:machineType,
											projectId:item.projectId,
											zone:zone,
											primary_ip:primary_ip,
											public_ip:public_ip,
											diskSizeGb:diskSizeGb,
											creationTimestamp:dateFormat(vm.creationTimestamp, "yyyy-mm-dd HH:MM:ss")
										}
										console.log('update data')
										console.log(updateData)
										dbHandler.updateTableData('gcp_vms',{id:item.id},updateData,function(err,result){
											var vmUpdate={
												host_name: updateData.name,
			                                    label_name: updateData.name,
			                                    ram_units_gb: (instanceType.memoryMb / 1024),
                                                cpu_units: instanceType.guestCpus,
			                                    disk_units_gb: updateData.diskSizeGb,
			                                    multiple_ip: JSON.stringify({"ip_address":updateData.primary_ip}),
			                                    primary_ip: updateData.public_ip,
			                                    power_status: updateData.status,
			                                    vm_status: vm.status.charAt(0).toUpperCase() + vm.status.toLowerCase().slice(1),
			                                    updateddate : new Date().getTime() / 1000
											}
		                                  //console.log(vmUpdate)
											dbHandler.updateTableData('c4_vm_details',{clientid:item.clientid,ref_id:item.instanceId},vmUpdate,function(err,result){
												resolve('');
												if(typeof reqObj.returnData != 'undefined'){
													var obj={
						                                    vm_detail:vm
						                                  }
													return callback(null,obj);
												}
											})
											
										})											
									}else{
										console.log("Entered else block2")
										resolve('')
									}
								})
								.catch(error => {
									console.log("error.response")
									console.log(error.response.data)
									if(error && error.response && error.response.data && error.response.data.error && error.response.data.error.code=='404'){
										dbHandler.updateTableData('gcp_vms',{id:item.id},{status:'Deleted'},function(err,result){
											dbHandler.updateTableData('c4_vm_details',{clientid:item.clientid,ref_id:item.instanceId},{power_status:'poweredOff',vm_status:'Deleted'},function(err,result){
												resolve('');
												if(typeof reqObj.returnData != 'undefined'){
													var obj={
						                                    vm_detail:[]
						                                  }
													return callback(null,obj)
												}
											});
										})
									}else{
										resolve('')
									}
									//return callback(1,error.response.data)
								 })
							}
						})
					})
				}
				if(typeof reqObj.returnData == 'undefined'){
					return callback(null,{success:1,message:'VM detail updated successfully'})
				}
			}else{
				return callback(400,{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'})
			}

		}catch(e){
			console.log("Catch:"+e)
			return callback(400,{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'})
		}
	})
}
/*
Author: Pradeep
Descri: get vm details
Date  : 14-07-2020
*/
let getVmDetailbyId= (clientid,vmId,callback)=>{
	let sql = `Select vm.*,gcp.projectId,p.name as project_name,gcp.zone,gcp.instanceId from c4_vm_details as vm inner join gcp_vms as gcp on 
	gcp.instanceId=vm.ref_id inner join c4_gcp_projects as p on p.projectId=gcp.projectId where vm.id=${vmId} and vm.clientid=${clientid} and vm.cloudid=5`;
	//console.log(sql)
	dbHandler.executeQuery(sql,async function(result){
		if(!result)return callback(400,{success:0,message:'Invalid vm id',vm:[],vm_detail:[]})
		var item=result[0];
		//vm detial api
		var vm_detail=await new Promise(function(resolve, reject){
			new Promise(function(itemResolve, itemReject){
				gcp_authtoken(item.clientid, function(error, result){
					itemResolve(result)
				})
			}).then(async function(token){
				// console.log("token");
				// console.log(token);
				if(token.length == 0){
					resolve([])
				}else{
					var url=`https://compute.googleapis.com/compute/v1/projects/${item.projectId}/zones/${item.zone}/instances/${item.instanceId}`
					var options = {
						'method': 'GET',
						'url': url,
						'headers': {
						'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
						},
						'data' : ""
					};
					await axios(options)
					.then(response => {
						resolve(response.data)
					})
					.catch(error => {
						console.log(error.response)
						resolve([])
					})
				}
			})
		})
		return callback(null,{success:1,vm:item,vm_detail:vm_detail})
	})
}

/*
Author: Pradeep
Descri: sync Machine Types
Date  : 09-07-2020
*/
let syncMachineTypes= async (reqObj,callback)=>{
	// console.log(reqObj);
	let sql = `Select c.id,prj.projectId,z.name from c4_clients as c inner join c4_gcp_projects as prj on prj.clientid=c.id inner join
	c4_gcp_zones as z on z.project_id=prj.id where c.status = 1 and c.is_gcp_enabled = 1 and prj.record_status=1 and 
	z.record_status=1 group by z.project_id,z.name order by z.id desc`;
	console.log(sql);
	await dbHandler.executeQuery(sql,async function(GcpClients){
		try{
			if (GcpClients.length > 0) {
				for await (const item of GcpClients) {
					await new Promise(async function(resolve, reject){
						await new Promise(function(itemResolve, itemReject){
							gcp_authtoken(item.id, function(error, result){
								itemResolve(result)
							})
						}).then(async function(token){
							// console.log("token");
							// console.log(token);
							if(token.length == 0){
								var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
								resolve(response)
							}else{
								var url=`https://compute.googleapis.com/compute/v1/projects/${item.projectId}/zones/${item.name}/machineTypes`
								var options = {
									'method': 'GET',
									'url': url,
									'headers': {
									'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
									},
									'data' : ""
								};
								console.log(url)
								await axios(options)
								.then(async response => {
									//console.log("response.data");
									//console.log(response.data);
									//resolve(response)
									//return callback(1,response.data)
									if(response && response.data && response.data.items){
										for await(var data of response.data.items){
											await new Promise(async function(resolve1,reject1){
												var machine=await new Promise(function(resolve2,reject2){
													var sql=`select * from gcp_machinetypes where name='${data.name}' and projectId='${item.projectId}' and zone='${item.name}'`
													dbHandler.executeQuery(sql,function(result){
														if(result)
														resolve2(result[0])
														else resolve1('')
													})
												})
												var updateData={
													machineId:data.id,
													projectId:item.projectId,
													zone:data.zone,
													name:data.name,
													description:data.description,
													guestCpus:data.guestCpus,
													memoryMb:data.memoryMb,
													imageSpaceGb:data.imageSpaceGb,
													maximumPersistentDisks:data.maximumPersistentDisks,
													maximumPersistentDisksSizeGb:data.maximumPersistentDisksSizeGb,
													isSharedCpu:data.isSharedCpu
												}
												if(machine){
													console.log('update data')
													console.log(updateData)
													dbHandler.updateTableData('gcp_machinetypes',{id:machine.id},updateData,function(err,result){
														resolve1('')
													})
												}else{
													console.log('insert data')
													console.log(updateData)
													dbHandler.insertIntoTable('gcp_machinetypes',updateData,function(err,result){
														resolve1('')
													})
												}
												
											})
											
										}
										console.log("Entered else block1")
										resolve('')										
									}else{
										console.log("Entered else block2")
										resolve('')
									}
								})
								.catch(error => {
									console.log(error.response)
									//resolve('')
									return callback(1,error.response.data)
								 })
							}
						})
					})
				}
				return callback(null,{success:1,message:'VM detail updated successfully'})
			}else{
				return callback(400,{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'})
			}

		}catch(e){
			console.log("Catch:"+e)
			return callback(400,{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'})
		}
	})
}
/*
Author: Pradeep
Descri: get network list
Date  : 13-07-2020
*/
let syncNetworkList= (reqObj)=>{
	let sql = `Select c.id,prj.projectId from c4_clients as c inner join c4_gcp_projects as prj on prj.clientid=c.id 
	where c.status = 1 and c.is_gcp_enabled = 1 and prj.record_status=1 `;
	if(typeof reqObj.clientid != 'undefined' && reqObj.clientid != ''){
		sql += ` and c.id = '${reqObj.clientid}'`;
	}
	if(typeof reqObj.projectId != 'undefined' && reqObj.projectId != ''){
		sql += ` and prj.projectId = '${reqObj.projectId}'`;
	}
	sql += ` order by prj.id desc`;
	dbHandler.executeQuery(sql,async function(GcpClients){
		try{
			if (GcpClients.length > 0) {
				for await (const item of GcpClients) {
					await new Promise(async function(resolve, reject){
						await new Promise(async function(itemResolve, itemReject){
							gcp_authtoken(item.id, function(error, result){
								itemResolve(result)
							})
						}).then(async function(token){
							// console.log("token");
							// console.log(token);
							if(token.length == 0){
								var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
								resolve(response)
							}else{
								var options = {
									'method': 'GET',
									'url': `https://compute.googleapis.com/compute/v1/projects/${item.projectId}/global/networks`,///automation-net
									'headers': {
									'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
									},
									'data' : ""
								};
								//console.log(options)
								await axios(options)
								.then(async response => {
									var idlist=[];
									if(response && response.data && response.data.items){
										for await(var vm of response.data.items){
											//console.log(vm)
											await new Promise(async function(resolve1,reject1){
												var gcpNetwork=await new Promise(function(resolve2,reject2){
													var sql=`select * from gcp_networks where networkId='${vm.id}' and projectId = '${item.projectId}'`
													dbHandler.executeQuery(sql,function(result){
														if(result)
														resolve2(result[0])
														else resolve1('')
													})
												})
												var updateData={
													networkId:vm.id,
													projectId:item.projectId,
													name:vm.name,
													status:1,
													description:vm.description,
													autoCreateSubnetworks:vm.autoCreateSubnetworks,
													creationTimestamp:dateFormat(vm.creationTimestamp, "yyyy-mm-dd HH:MM:ss")
												}
												console.log(updateData.name)
												if(gcpNetwork){
													await idlist.push(gcpNetwork.id)
													console.log('update data')
													//console.log(updateData)
													await dbHandler.updateTableData('gcp_networks',{id:gcpNetwork.id},updateData,function(err,result){
														resolve1('')
													})
												}else{
													console.log('insert data')
													//console.log(updateData)
													var recordId=await new Promise(function(res1,rej1){
														dbHandler.insertIntoTable('gcp_networks',updateData,function(err,recordId){
															res1(recordId)
														})
													})
													await idlist.push(recordId);
													resolve1('')
												}
												
											})
											
										}
										//console.log(item.projectId)
										if(idlist && idlist.length > 0){
											console.log(idlist.join())
											var sql2=`update gcp_networks set status=0 where id not in(${idlist.join()}) and projectId='${item.projectId}'`
											await dbHandler.executeQuery(sql2,function(result){})
										}								
										console.log("Entered else block1")
										resolve('')
									}else{
										console.log("Entered else block2")
										resolve('')
									}
								})
								.catch(error => {
									console.log(error.response)
									resolve('')
								 })
							}
						})
					})
				}
			}
		}catch(e){
			console.log("Catch:"+e)
		}
	})
  }
/*
Author: Pradeep
Descri: sync subnet list
Date  : 13-07-2020
*/
let syncSubnetList= (reqObj)=>{
	let sql = `Select c.id,prj.projectId,reg.name from c4_clients as c inner join c4_gcp_projects as prj on prj.clientid=c.id 
	inner join c4_gcp_regions as reg on reg.project_id=prj.id where c.status = 1 and c.is_gcp_enabled = 1 and prj.record_status=1 and
	 reg.record_status=1`;
	 if(typeof reqObj.clientid != 'undefined' && reqObj.clientid != ''){
		sql += ` and c.id = '${reqObj.clientid}'`;
	}
	if(typeof reqObj.projectId != 'undefined' && reqObj.projectId != ''){
		sql += ` and prj.projectId = '${reqObj.projectId}'`;
	}
	sql += ` order by reg.id desc`;
	dbHandler.executeQuery(sql,async function(GcpClients){
		try{
			if (GcpClients.length > 0) {
				for await (const item of GcpClients) {
					await new Promise(async function(resolve, reject){
						await new Promise(async function(itemResolve, itemReject){
							gcp_authtoken(item.id, function(error, result){
								itemResolve(result)
							})
						}).then(async function(token){
							if(token.length == 0){
								var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
								resolve(response)
							}else{
								var options = {
									'method': 'GET',
									'url': `https://compute.googleapis.com/compute/v1/projects/${item.projectId}/regions/${item.name}/subnetworks`,
									'headers': {
									'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
									},
									'data' : ""
								};
								await axios(options)
								.then(async response => {
									//console.log(response.data)
									var idlist=[];
									if(response && response.data && response.data.items){
										for await(var vm of response.data.items){
											//console.log("vm");
											//console.log(vm);
											await new Promise(async function(resolve1,reject1){
												var subnet=await new Promise(function(resolve2,reject2){
													var sql=`select * from gcp_subnetworks where subnetId='${vm.id}' and projectId='${item.projectId}' and regionName='${item.name}'`
													dbHandler.executeQuery(sql,function(result){
														if(result)
														resolve2(result[0])
														else resolve1('')
													})
												})
												var str = vm.network;
												var index = str.lastIndexOf('/');
												var networkName = str.substring(index +1);
												var updateData={
													subnetId:vm.id,
													projectId:item.projectId,
													regionName:item.name,
													subnetName:vm.name,
													networkName:networkName,
													ipCidrRange:vm.ipCidrRange,
													gatewayAddress:vm.gatewayAddress,
													creationTimestamp:dateFormat(vm.creationTimestamp, "yyyy-mm-dd HH:MM:ss")
												}
												console.log(updateData.subnetName)
												if(subnet){
													console.log('update data')
													//console.log(updateData)
													await idlist.push(subnet.id)
													await dbHandler.updateTableData('gcp_subnetworks',{id:subnet.id},updateData,function(err,result){
														resolve1('')
													})
												}else{
													console.log('insert data')
													//console.log(updateData)
													var recordId=await new Promise(function(res1,rej1){
														dbHandler.insertIntoTable('gcp_subnetworks',updateData,function(err,recordId){
															res1(recordId)
														})
													})
													await idlist.push(recordId);
													resolve1('')
												}
												
											})
											
										}
										if(idlist && idlist.length > 0){
											console.log(idlist.join())
											var sql2=`update gcp_subnetworks set status=0 where id not in(${idlist.join()}) and projectId='${item.projectId}' and regionName='${item.name}'`
											await dbHandler.executeQuery(sql2,function(result){})
										}	
										console.log("Entered else block1")
										resolve('')
									}else{
										console.log("Entered else block2")
										resolve('')
									}
								})
								.catch(error => {
									console.log(error.response)
									resolve('')
								 })
							}
						})
					})
				}
			}
		}catch(e){
			console.log("Catch:"+e)
		}
	})
}
/*
Author: Pradeep
Descri: create network
Date  : 13-07-2020
*/
let createNetwork= async (reqBody,callback)=>{
	var projectId=reqBody.projectId
	if(typeof(projectId)=='undefined' || projectId==''){
		var response={success:0,message:'Please provide projectId.'}
		return callback([],response);
	}
	var clientid=reqBody.clientid
	if(typeof(clientid)=='undefined' || clientid==''){
		var response={success:0,message:'Please provide clientid.'}
		return callback([],response);
	}
	var networkName=reqBody.networkName
	if(typeof(networkName)=='undefined' || networkName==''){
		var response={success:0,message:'Please provide networkName.'}
		return callback([],response);
	}
	var autoCreateSubnetworks=reqBody.autoCreateSubnetworks
	if(typeof(autoCreateSubnetworks)=='undefined'){
		var response={success:0,message:'Please provide flag for auto create subnet.'}
		return callback([],response);
	}
	var description=networkName
	if(typeof(reqBody.description)!='undefined'){
		description=reqBody.description;
	}
	let sql = `Select c.id,prj.projectId from c4_clients as c inner join c4_gcp_projects as prj on prj.clientid=c.id 
	where c.status = 1 and c.is_gcp_enabled = 1 and prj.record_status=1 and prj.projectId='${projectId}' and c.id='${clientid}'`;
	await dbHandler.executeQuery(sql,async function(GcpClients){
		try{
			if (GcpClients.length > 0) {
				for await (const item of GcpClients) {
					await new Promise(async function(resolve, reject){
						await new Promise(async function(itemResolve, itemReject){
							gcp_authtoken(item.id, function(error, result){
								itemResolve(result)
							})
						}).then(async function(token){
							// console.log("token");
							// console.log(token);
							if(token.length == 0){
								var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
								resolve(response)
							}else{
								var options = {
									'method': 'POST',
									'url': `https://compute.googleapis.com/compute/v1/projects/${projectId}/global/networks`,
									'headers': {
										'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
									},
									"data" : {
										"name": `${networkName}`,
										//"IPv4Range": "192.168.0.0/16",
										"autoCreateSubnetworks": `${autoCreateSubnetworks}`,
										"description": `${description}`,
										"routingConfig": {
										  "routingMode": "GLOBAL"
										},
										"kind":"compute#network"
									  }
								};
								await axios(options)
								.then(async response => {
									syncNetworkList({clientid:clientid,projectId:projectId});
									return callback(1,{success:1,data:response.data})
								})
								.catch(error => {
									console.log(error.response.data)
									return callback(null,{success:0,message:error.response.data.error.message})
								 })
							}
						})
					})
				}
			}else{
				return callback(400,{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'})
			}

		}catch(e){
			console.log("Catch:"+e)
			return callback(400,{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'})
		}
	})
}
/*
Author: Pradeep
Descri: network detail
Date  : 13-07-2020
*/
let networkDetail= (reqBody,callback)=>{
	var projectId=reqBody.projectId
	if(typeof(projectId)=='undefined' || projectId==''){
		var response={success:0,message:'Please provide projectId.'}
		return callback([],response);
	}
	var clientid=reqBody.clientid
	if(typeof(clientid)=='undefined' || clientid==''){
		var response={success:0,message:'Please provide clientid.'}
		return callback([],response);
	}
	var networkName=reqBody.networkName
	if(typeof(networkName)=='undefined' || networkName==''){
		var response={success:0,message:'Please provide networkId.'}
		return callback([],response);
	}
	new Promise(async function(itemResolve, itemReject){
		gcp_authtoken(clientid, function(error, result){
			itemResolve(result)
		})
	}).then(async function(token){
		// console.log("token");
		// console.log(token);
		if(token.length == 0){
			var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
			resolve(response)
		}else{
			var options = {
				'method': 'GET',
				'url': `https://compute.googleapis.com/compute/v1/projects/${projectId}/global/networks/${networkName}`,
				'headers': {
					'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				"data" : ""
			};
			await axios(options)
			.then(async response => {
				return callback(1,{success:1,data:response.data})
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(null,{success:0,message:error.response.data.error.message})
			})
		}
	})
}
/*
Author: Pradeep
Descri: delete network
Date  : 28-07-2020
*/
let deleteNetwork= (reqBody,callback)=>{
	var projectId=reqBody.projectId
	if(typeof(projectId)=='undefined' || projectId==''){
		var response={success:0,message:'Please provide projectId.'}
		return callback([],response);
	}
	var clientid=reqBody.clientid
	if(typeof(clientid)=='undefined' || clientid==''){
		var response={success:0,message:'Please provide clientid.'}
		return callback([],response);
	}
	var networkName=reqBody.networkName
	if(typeof(networkName)=='undefined' || networkName==''){
		var response={success:0,message:'Please provide networkId.'}
		return callback([],response);
	}
	new Promise(async function(itemResolve, itemReject){
		gcp_authtoken(clientid, function(error, result){
			itemResolve(result)
		})
	}).then(async function(token){
		// console.log("token");
		// console.log(token);
		if(token.length == 0){
			var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
			resolve(response)
		}else{
			var options = {
				'method': 'DELETE',
				'url': `https://compute.googleapis.com/compute/v1/projects/${projectId}/global/networks/${networkName}`,
				'headers': {
					'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				"data" : ""
			};
			await axios(options)
			.then(async response => {
				return callback(1,{success:1,data:response.data})
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(null,{success:0,message:error.response.data.error.message})
			})
		}
	})
}
/*
Author: Pradeep
Descri: delete sub network
Date  : 28-07-2020
*/
let deleteSubnet= (reqBody,callback)=>{
	var projectId=reqBody.projectId
	if(typeof(projectId)=='undefined' || projectId==''){
		var response={success:0,message:'Please provide projectId.'}
		return callback([],response);
	}
	var clientid=reqBody.clientid
	if(typeof(clientid)=='undefined' || clientid==''){
		var response={success:0,message:'Please provide clientid.'}
		return callback([],response);
	}
	var regionName=reqBody.regionName
	if(typeof(regionName)=='undefined' || regionName==''){
		var response={success:0,message:'Please provide region name.'}
		return callback([],response);
	}
	var subnetName=reqBody.subnetName
	if(typeof(subnetName)=='undefined' || subnetName==''){
		var response={success:0,message:'Please provide subnet name.'}
		return callback([],response);
	}
	new Promise(async function(itemResolve, itemReject){
		gcp_authtoken(clientid, function(error, result){
			itemResolve(result)
		})
	}).then(async function(token){
		// console.log("token");
		// console.log(token);
		if(token.length == 0){
			var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
			resolve(response)
		}else{
			var options = {
				'method': 'DELETE',
				'url': `https://compute.googleapis.com/compute/v1/projects/${projectId}/regions/${regionName}/subnetworks/${subnetName}`,
				'headers': {
					'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				"data" : ""
			};
			await axios(options)
			.then(async response => {
				return callback(1,{success:1,data:response.data})
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(null,{success:0,message:error.response.data.error.message})
			})
		}
	})
}

/*
Author: Pradeep
Descri: subnet detail
Date  : 13-07-2020
*/
let subnetDetail= (reqBody,callback)=>{
	var projectId=reqBody.projectId
	if(typeof(projectId)=='undefined' || projectId==''){
		var response={success:0,message:'Please provide projectId.'}
		return callback([],response);
	}
	var clientid=reqBody.clientid
	if(typeof(clientid)=='undefined' || clientid==''){
		var response={success:0,message:'Please provide clientid.'}
		return callback([],response);
	}
	var regionName=reqBody.regionName
	if(typeof(regionName)=='undefined' || regionName==''){
		var response={success:0,message:'Please provide regionName.'}
		return callback([],response);
	}
	var subnetId=reqBody.subnetId
	if(typeof(subnetId)=='undefined' || subnetId==''){
		var response={success:0,message:'Please provide subnetId.'}
		return callback([],response);
	}
	new Promise(async function(itemResolve, itemReject){
		gcp_authtoken(clientid, function(error, result){
			itemResolve(result)
		})
	}).then(async function(token){
		// console.log("token");
		// console.log(token);
		if(token.length == 0){
			var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
			resolve(response)
		}else{
			var options = {
				'method': 'GET',
				'url': `https://compute.googleapis.com/compute/v1/projects/${projectId}/regions/${regionName}/subnetworks/${subnetId}`,
				'headers': {
					'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				"data" : ""
			};
			await axios(options)
			.then(async response => {
				return callback(1,{success:1,data:response.data})
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(null,{success:0,message:error.response.data.error.message})
			})
		}
	})
}
/*
Author: Pradeep
Descri: create subnet
Date  : 13-07-2020
*/
let createSubnet= async (reqBody,callback)=>{
	var projectId=reqBody.projectId
	if(typeof(projectId)=='undefined' || projectId==''){
		var response={success:0,message:'Please provide projectId.'}
		return callback([],response);
	}
	var regionName=reqBody.regionName
	if(typeof(regionName)=='undefined' || regionName==''){
		var response={success:0,message:'Please provide regionName.'}
		return callback([],response);
	}
	var ipCidrRange=reqBody.ipCidrRange
	if(typeof(ipCidrRange)=='undefined' || ipCidrRange==''){
		var response={success:0,message:'Please provide ipCidrRange.'}
		return callback([],response);
	}
	var networkName=reqBody.networkName
	if(typeof(networkName)=='undefined' || networkName==''){
		var response={success:0,message:'Please provide networkName.'}
		return callback([],response);
	}
	var subnetName=reqBody.subnetName
	if(typeof(subnetName)=='undefined' || subnetName==''){
		var response={success:0,message:'Please provide subnetName.'}
		return callback([],response);
	}
	var clientid=reqBody.clientid
	if(typeof(clientid)=='undefined' || clientid==''){
		var response={success:0,message:'Please provide clientid.'}
		return callback([],response);
	}
	let sql = `Select c.id,prj.projectId from c4_clients as c inner join c4_gcp_projects as prj on prj.clientid=c.id 
	inner join c4_gcp_regions as reg on reg.project_id=prj.id where c.status = 1 and c.is_gcp_enabled = 1 and
	 prj.record_status=1 and prj.projectId='${projectId}' and reg.name='${regionName}' and c.id='${clientid}'`;
	await dbHandler.executeQuery(sql,async function(GcpClients){
		try{
			if (GcpClients.length > 0) {
				for await (const item of GcpClients) {
					await new Promise(async function(resolve, reject){
						await new Promise(async function(itemResolve, itemReject){
							gcp_authtoken(item.id, function(error, result){
								itemResolve(result)
							})
						}).then(async function(token){
							// console.log("token");
							// console.log(token);
							if(token.length == 0){
								var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
								resolve(response)
							}else{
								var options = {
									'method': 'POST',
									'url': `https://compute.googleapis.com/compute/v1/projects/${projectId}/regions/${regionName}/subnetworks`,
									'headers': {
										'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
									},
									"data" : {
										"network": `https://www.googleapis.com/compute/v1/projects/${projectId}/global/networks/${networkName}`,
										"name": `${subnetName}`,
										"ipCidrRange": `${ipCidrRange}`,
										"region":`${regionName}`,
										"kind": "compute#subnetwork"
									  }
								};
								await axios(options)
								.then(async response => {
									syncSubnetList({clientid:clientid,projectId:projectId});
									return callback(null,{success:1,data:response.data})
								})
								.catch(error => {
									console.log(error.response.data)
									return callback(null,{success:0,message:error.response.data.error.message})
								 })
							}
						})
					})
				}
				
			}else{
				return callback(400,{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'})
			}

		}catch(e){
			console.log("Catch:"+e)
			return callback(400,{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'})
		}
	})
}
/*
Author: Pradeep
Descri: create vm
Date  : 14-07-2020
*/
let createVm= (reqBody,callback)=>{
	var projectId=reqBody.projectId
	if(typeof(projectId)=='undefined' || projectId==''){
		var response={success:0,message:'Please provide project name.'}
		return callback([],response);
	}
	var clientid=reqBody.clientid
	if(typeof(clientid)=='undefined' || clientid==''){
		var response={success:0,message:'Please provide clientid.'}
		return callback([],response);
	}
	var zoneName=reqBody.zoneName
	if(typeof(zoneName)=='undefined' || zoneName==''){
		var response={success:0,message:'Please provide zone name.'}
		return callback([],response);
	}
	var machineType=reqBody.machineType
	if(typeof(machineType)=='undefined' || machineType==''){
		var response={success:0,message:'Please provide machine type.'}
		return callback([],response);
	}
	var instanceName=reqBody.instanceName
	if(typeof(instanceName)=='undefined' || instanceName==''){
		var response={success:0,message:'Please provide instance name.'}
		return callback([],response);
	}
	var imageId=reqBody.imageId
	if(typeof(imageId)=='undefined' || imageId==''){
		var response={success:0,message:'Please provide image id.'}
		return callback([],response);
	}
	var regionName=reqBody.regionName
	if(typeof(regionName)=='undefined' || regionName==''){
		var response={success:0,message:'Please provide region name.'}
		return callback([],response);
	}
	var networkType=reqBody.networkType
	if(typeof(networkType)=='undefined' || networkType==''){
		var response={success:0,message:'Please provide network type.'}
		return callback([],response);
	}		
	new Promise(async function(itemResolve, itemReject){
		gcp_authtoken(clientid, function(error, result){
			itemResolve(result)
		})
	}).then(async function(token){
		if(token.length == 0){
			var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
			resolve(response)
		}else{
			var imageInfo=await new Promise(function(resolve2,reject2){
				var sql=`select * from c4_gcp_images where image_id='${imageId}'`
				dbHandler.executeQuery(sql,function(result){
					if(result)
					resolve2(result[0])
					else resolve1('')
				})
			})
			if(!imageInfo){
				var response={success:0,message:'Image information not found.'}
				return callback([],response);
			}
			var networkInterfaces=[];
			var disks=[];
			switch(networkType){
				// case 'default':{
				// 	var networkName='default';
				// 	var subnetName='default';
				// 	networkInterfaces=[
				// 		{ 
				// 			"network": `global/networks/default`, 
				// 			"subnetwork": `regions/${regionName}/subnetworks/default`
				// 		}
				// 	];
				// 	disks=[
				// 		{
				// 			"initializeParams":
				// 			{ 
				// 				"sourceImage": `projects/${imageInfo.imagecloudtype}/global/images/${imageInfo.image_name}` 
				// 			},
				// 			"boot": true
				// 		}
				// 	];
				// 	break;
				// }
				case 'withNetwork':{
					var networkName=reqBody.networkName
					if(typeof(networkName)=='undefined' || networkName==''){
						var response={success:0,message:'Please provide network name.'}
						return callback([],response);
					}
					var subnetName=reqBody.subnetName
					if(typeof(subnetName)=='undefined' || subnetName==''){
						var response={success:0,message:'Please provide subnet name.'}
						return callback([],response);
					}
					networkInterfaces=[
						{ 
							"network": `global/networks/${networkName}`, 
							"subnetwork": `regions/${regionName}/subnetworks/${subnetName}`
						}
					];
					disks=[
						{
							"initializeParams":
							{ 
								"sourceImage": `projects/${imageInfo.imagecloudtype}/global/images/${imageInfo.image_name}` 
							},
							"boot": true
						}
					];
					break;
				}
				case 'default':{
					networkInterfaces=[
						{ 
							"accessConfigs": [
								{ 
									"type": "ONE_TO_ONE_NAT", "name": "External NAT" 
								}
							],
							"network": "global/networks/default"
						}
					];
					disks=[
						{
							"type": "PERSISTENT",
							"initializeParams":
							{ 
								"sourceImage": `projects/${imageInfo.imagecloudtype}/global/images/${imageInfo.image_name}` 
							},
							"boot": true
						}
					];
					break;
				}
			}
			var options = {
				'method': 'POST',
				'url': `https://compute.googleapis.com/compute/v1/projects/${projectId}/zones/${zoneName}/instances`,
				'headers': {
					'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				"data" : {
					"machineType": `zones/${zoneName}/machineTypes/${machineType}`,
					"name": instanceName,
					"networkInterfaces": networkInterfaces,
					"disks": disks
				}
			};
			await axios(options)
			.then(async response => {
				syncGcpVms({clientid : clientid, projectId : projectId, zoneName : zoneName});
				return callback(1,{success:1,data:response.data,message:"VM creation initiated"});
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(1,{success:0,data:error.response.data,message:error.response.data.error.message})
			 })
		}
	})
}
/*
  Author : Pradeep
  Descri: vm operations
  Date  : 15-07-2020
*/
let vmOperations= (reqObj,callback)=>{
	var clientid=reqObj.clientid;
	if(typeof(clientid)=='undefined' || clientid==''){
		var response={success:0,message:'Please provide clientid.'}
		return callback([],response);
	}
	var ref_id=reqObj.ref_id;
	if(typeof(ref_id)=='undefined' || ref_id==''){
		var response={success:0,message:'Please provide ref_id.'}
		return callback([],response);
	}
	var actionName=reqObj.actionName;
	if(typeof(actionName)=='undefined' || actionName==''){
		var response={success:0,message:'Please provide action name.'}
		return callback([],response);
	}
	
	let sql = `Select vm.*,gcp.projectId,gcp.zone,gcp.instanceId from c4_vm_details as vm inner join gcp_vms as gcp on 
	gcp.instanceId=vm.ref_id where gcp.instanceId='${ref_id}' and vm.clientid=${clientid} and vm.cloudid=5`;
	dbHandler.executeQuery(sql,async function(result){
		if(!result)return callback(400,{success:0,message:'Invalid ref id'})
		var item=result[0];
		new Promise(function(itemResolve, itemReject){
			gcp_authtoken(clientid, function(error, result){
				itemResolve(result)
			})
		}).then(async function(token){
			// console.log("token");
			// console.log(token);
			if(token.length == 0){
				resolve([])
			}else{
				if(actionName=='start')
				{
					var method="POST"
					var url=`https://compute.googleapis.com/compute/v1/projects/${item.projectId}/zones/${item.zone}/instances/${item.instanceId}/start`
				}
				else if(actionName=='stop')
				{
					var method="POST"
					var url=`https://compute.googleapis.com/compute/v1/projects/${item.projectId}/zones/${item.zone}/instances/${item.instanceId}/stop`
				}
				else if(actionName=='restart')
				{
					var method="POST"
					var url=`https://compute.googleapis.com/compute/v1/projects/${item.projectId}/zones/${item.zone}/instances/${item.instanceId}/reset`
				}
				else{
					var response={success:0,message:'Action does not matched.'}
					return callback([],response);
				}
				var options = {
					'method': method,
					'url': url,
					'headers': {
					'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
					},
					'data' : ""
				};
				await axios(options)
				.then(response => {
					return callback(null,{success:1,message:'VM Operation successful.',response:response.data})
				})
				.catch(error => {
					console.log(error.response.data)
					return callback(1,{success:0,data:error.response.data,message:error.response.data.error.message})
				})
			}
		})
	})                           
 }
/*
  Author : Pradeep
  Descri: delete vm
  Date  : 15-07-2020
*/
let deleteVm= async (reqObj,callback)=>{
	var clientid=reqObj.clientid;
	if(typeof clientid =='undefined'){
	  return callback(1,{success:0,message:'Please provide clientid.'});
	}
	var vmId=reqObj.vmId;
	if(typeof vmId =='undefined'){
	  return callback(1,{success:0,message:'Please provide vm id.'});
	}
	await new Promise(function(resolve,reject){
	  gcp_authtoken(reqObj.clientid, function(error, result){
		  resolve(result)
	  })
	}).then(async function(token){
		if(token.tokendata.length == 0){
		  var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
		  return callback(1,response);
		}else{
		  let vmDetail=await new Promise(function(resolve,reject){
			var whereQry={clientid:clientid,vm_detail_id:vmId};
			  dbHandler.getOneRecord('gcp_vms',whereQry,function(result){
				resolve(result)
			  });
		  })
		  if(!vmDetail){
			var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
			return callback([],response);
		  }
			var url=`https://compute.googleapis.com/compute/v1/projects/${vmDetail.projectId}/zones/${vmDetail.zone}/instances/${vmDetail.instanceId}`;
			var options = {
				'method': "DELETE",
				'url': url,
				'headers': {
				'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				'data' : ""
			};
			await axios(options)
			.then(response => {
				return callback(null,{success:1,response:response.data})
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(null,{success:0,message:error.response.data.error.message})
			})
		}
	  });                          
  }	
/*
  Author : Pradeep
  Descri: disk listing
  Date  : 15-07-2020
*/
let diskList= async (reqObj,callback)=>{
	var clientid=reqObj.clientid;
	if(typeof clientid =='undefined'){
	  return callback(1,{success:0,message:'Please provide clientid.'});
	}
	var projectId=reqObj.projectId;
	if(typeof projectId =='undefined'){
	  return callback(1,{success:0,message:'Please provide projectId.'});
	}
	var zone=reqObj.zone;
	if(typeof zone =='undefined'){
	  return callback(1,{success:0,message:'Please provide zone.'});
	}
	await new Promise(function(resolve,reject){
	  gcp_authtoken(reqObj.clientid, function(error, result){
		  resolve(result)
	  })
	}).then(async function(token){
		if(token.tokendata.length == 0){
		  var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
		  return callback(1,response);
		}else{
			var url=`https://compute.googleapis.com/compute/v1/projects/${projectId}/zones/${zone}/disks`;
			var options = {
				'method': "GET",
				'url': url,
				'headers': {
				'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				'data' : ""
			};
			await axios(options)
			.then(response => {
				return callback(null,{success:1,data:response.data,message:"GCP Disks List"})
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(null,{success:0,message:error.response.data.error.message})
			})
		}
	  });                          
  }	
/*
  Author : Pradeep
  Descri: Add disk API
  Date  : 16-07-2020
*/
let createDisk= async (reqObj,callback)=>{
	var clientid=reqObj.clientid;
	if(typeof clientid =='undefined'){
	  return callback(1,{success:0,message:'Please provide clientid.'});
	}
	var projectId=reqObj.projectId;
	if(typeof projectId =='undefined'){
	  return callback(1,{success:0,message:'Please provide projectId.'});
	}
	var zone=reqObj.zone;
	if(typeof zone =='undefined'){
	  return callback(1,{success:0,message:'Please provide zone.'});
	}
	var diskName=reqObj.diskName;
	if(typeof diskName =='undefined'){
	  return callback(1,{success:0,message:'Please provide disk name.'});
	}
	var sizeGb=reqObj.sizeGb;
	if(typeof sizeGb =='undefined'){
	  return callback(1,{success:0,message:'Please provide disk size.'});
	}
	await new Promise(function(resolve,reject){
	  gcp_authtoken(reqObj.clientid, function(error, result){
		  resolve(result)
	  })
	}).then(async function(token){
		if(token.tokendata.length == 0){
		  var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
		  return callback(1,response);
		}else{
			var url=`https://compute.googleapis.com/compute/v1/projects/${projectId}/zones/${zone}/disks`;
			var options = {
				'method': "POST",
				'url': url,
				'headers': {
				'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				'data' : {
					"name": diskName,
					"sizeGb": sizeGb
				  }
			};
			await axios(options)
			.then(response => {
				return callback(null,{success:1,data:response.data})
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(null,{success:0,message:error.response.data.error.message})
			})
		}
	});                          
}
/*
  Author : Pradeep
  Descri: delete disk
  Date  : 15-07-2020
*/
let deleteDisk= async (reqObj,callback)=>{
	var clientid=reqObj.clientid;
	if(typeof clientid =='undefined'){
	  return callback(1,{success:0,message:'Please provide clientid.'});
	}
	var projectId=reqObj.projectId;
	if(typeof projectId =='undefined'){
	  return callback(1,{success:0,message:'Please provide projectId.'});
	}
	var zone=reqObj.zone;
	if(typeof zone =='undefined'){
	  return callback(1,{success:0,message:'Please provide zone.'});
	}
	var resourceId=reqObj.resourceId;
	if(typeof resourceId =='undefined'){
	  return callback(1,{success:0,message:'Please provide resourceId.'});
	}
	await new Promise(function(resolve,reject){
	  gcp_authtoken(reqObj.clientid, function(error, result){
		  resolve(result)
	  })
	}).then(async function(token){
		if(token.tokendata.length == 0){
		  var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
		  return callback(1,response);
		}else{
			var url=`https://compute.googleapis.com/compute/v1/projects/${projectId}/zones/${zone}/disks/${resourceId}`;
			var options = {
				'method': "DELETE",
				'url': url,
				'headers': {
				'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				'data' : ""
			};
			await axios(options)
			.then(response => {
				return callback(null,{success:1,data:response.data})
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(null,{success:0,message:error.response.data.error.message})
			})
		}
	});                          
}
/*
  Author : Pradeep
  Descri: available Disk listing
  Date  : 15-07-2020
*/
let availableDisk= async (reqObj,callback)=>{
	var clientid=reqObj.clientid;
	if(typeof clientid =='undefined'){
	  return callback(1,{success:0,message:'Please provide clientid.'});
	}
	var projectId=reqObj.projectId;
	if(typeof projectId =='undefined'){
	  return callback(1,{success:0,message:'Please provide projectId.'});
	}
	var zone=reqObj.zone;
	if(typeof zone =='undefined'){
	  return callback(1,{success:0,message:'Please provide zone.'});
	}
	await new Promise(function(resolve,reject){
	  gcp_authtoken(reqObj.clientid, function(error, result){
		  resolve(result)
	  })
	}).then(async function(token){
		if(token.tokendata.length == 0){
		  var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
		  return callback(1,response);
		}else{
			var url=`https://compute.googleapis.com/compute/v1/projects/${projectId}/zones/${zone}/disks`;
			var options = {
				'method': "GET",
				'url': url,
				'headers': {
				'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				'data' : ""
			};
			await axios(options)
			.then(async response => {
				var disklist=[];
				if(response && response.data && response.data.items)
				{
					for await(disk of response.data.items){
						if(!disk.users)disklist.push(disk)
					}
					return callback(null,{success:1,data:disklist})
				}else{
					return callback(null,{success:1,data:disklist})
				}
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(null,{success:0,message:error.response.data.error.message})
			})
		}
	  });                          
  }	
/*
  Author : Pradeep
  Descri: Attack disk API
  Date  : 17-07-2020
*/
let attachDisk= async (reqObj,callback)=>{
	var clientid=reqObj.clientid;
	if(typeof clientid =='undefined'){
	  return callback(1,{success:0,message:'Please provide clientid.'});
	}
	var projectId=reqObj.projectId;
	if(typeof projectId =='undefined'){
	  return callback(1,{success:0,message:'Please provide projectId.'});
	}
	var zone=reqObj.zone;
	if(typeof zone =='undefined'){
	  return callback(1,{success:0,message:'Please provide zone.'});
	}
	var instanceName=reqObj.instanceName;
	if(typeof instanceName =='undefined'){
	  return callback(1,{success:0,message:'Please provide instance name.'});
	}
	var deviceName=reqObj.deviceName;
	if(typeof deviceName =='undefined'){
	  return callback(1,{success:0,message:'Please provide device name.'});
	}
	await new Promise(function(resolve,reject){
	  gcp_authtoken(reqObj.clientid, function(error, result){
		  resolve(result)
	  })
	}).then(async function(token){
		if(token.tokendata.length == 0){
		  var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
		  return callback(1,response);
		}else{
			var url=`https://compute.googleapis.com/compute/v1/projects/${projectId}/zones/${zone}/instances/${instanceName}/attachDisk`;
			var options = {
				'method': "POST",
				'url': url,
				'headers': {
				'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				'data' :{
					"autoDelete": false,
					"deviceName": deviceName,
					//"diskSizeGb": 10,
					"mode": "READ_WRITE",
					"boot": false,
					"type": "PERSISTENT",
					"source": `https://www.googleapis.com/compute/v1/projects/${projectId}/zones/${zone}/disks/${deviceName}`,
					"interface": "SCSI"
				}
			};
			await axios(options)
			.then(response => {
				return callback(null,{success:1,data:response.data})
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(1,{success:0,message:error.response.data.error.message})
			})
		}
	});                          
}
/*
  Author : Pradeep
  Descri: detach disk API
  Date  : 17-07-2020
*/
let detachDisk= async (reqObj,callback)=>{
	var clientid=reqObj.clientid;
	if(typeof clientid =='undefined'){
	  return callback(1,{success:0,message:'Please provide clientid.'});
	}
	var projectId=reqObj.projectId;
	if(typeof projectId =='undefined'){
	  return callback(1,{success:0,message:'Please provide projectId.'});
	}
	var zone=reqObj.zone;
	if(typeof zone =='undefined'){
	  return callback(1,{success:0,message:'Please provide zone.'});
	}
	var instanceName=reqObj.instanceName;
	if(typeof instanceName =='undefined'){
	  return callback(1,{success:0,message:'Please provide instance name.'});
	}
	var deviceName=reqObj.deviceName;
	if(typeof deviceName =='undefined'){
	  return callback(1,{success:0,message:'Please provide device name.'});
	}
	await new Promise(function(resolve,reject){
	  gcp_authtoken(reqObj.clientid, function(error, result){
		  resolve(result)
	  })
	}).then(async function(token){
		if(token.tokendata.length == 0){
		  var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
		  return callback(1,response);
		}else{
			var url=`https://compute.googleapis.com/compute/v1/projects/${projectId}/zones/${zone}/instances/${instanceName}/detachDisk/?deviceName=${deviceName}`;
			var options = {
				'method': "POST",
				'url': url,
				'headers': {
				'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				'data' :""
			};
			await axios(options)
			.then(response => {
				return callback(null,{success:1,data:response.data})
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(1,{success:0,message:error.response.data.error.message})
			})
		}
	});                          
}
/*
Author: Pradeep
Descri: get network list
Date  : 13-07-2020
*/
let getNetworkList= (reqObj,callback)=>{
	var clientid=reqObj.clientid;
	if(typeof clientid =='undefined'){
	  return callback(1,{success:0,message:'Please provide clientid.'});
	}
	var projectId=reqObj.projectId;
	if(typeof projectId =='undefined'){
	  return callback(1,{success:0,message:'Please provide projectId.'});
	}
	new Promise(async function(itemResolve, itemReject){
		gcp_authtoken(clientid, function(error, result){
			itemResolve(result)
		})
	}).then(async function(token){
		if(token.length == 0){
			var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
			return callback(1,response)
		}else{
			var options = {
				'method': 'GET',
				'url': `https://compute.googleapis.com/compute/v1/projects/${projectId}/global/networks`,///automation-net
				'headers': {
				'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				'data' : ""
			};
			//console.log(options)
			await axios(options)
			.then(async response => {
				return callback(1,{success:1,data:response.data})
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(null,{success:0,message:error.response.data.error.message})
			})
		}
	})
}
/*
Author: Pradeep
Descri: get subnet list
Date  : 13-07-2020
*/
let getSubnetList= (reqObj,callback)=>{
	var clientid=reqObj.clientid;
	if(typeof clientid =='undefined'){
	  return callback(1,{success:0,message:'Please provide clientid.'});
	}
	var projectId=reqObj.projectId;
	if(typeof projectId =='undefined'){
	  return callback(1,{success:0,message:'Please provide projectId.'});
	}
	var networkName=reqObj.networkName;
	if(typeof networkName =='undefined'){
	  return callback(1,{success:0,message:'Please provide networkName.'});
	}
	var regionName=reqObj.regionName;
	if(typeof regionName =='undefined'){
	  return callback(1,{success:0,message:'Please provide regionName.'});
	}
	new Promise(async function(itemResolve, itemReject){
		gcp_authtoken(clientid, function(error, result){
			itemResolve(result)
		})
	}).then(async function(token){
		if(token.length == 0){
			var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
			return callback(1,response)
		}else{
			var options = {
				'method': 'GET',
				'url': `https://compute.googleapis.com/compute/v1/projects/${projectId}/regions/${regionName}/subnetworks`,
				'headers': {
				'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				'data' : ""
			};
			//console.log(options)
			await axios(options)
			.then(async response => {
				var list=await new Promise(async function(resolve,reject){ 
					var subnetList=[];
					//return callback(null,{success:1,data:response.data.items})
					for await(const sub of response.data.items){
						var str = sub.network;
						var index = await str.lastIndexOf('/');
						var network = await str.substring(index +1);
						if(network==networkName){
							await subnetList.push(sub);
						}
					}
					resolve(subnetList)
				})
				return callback(null,{success:1,data:list})
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(null,{success:0,message:error.response.data.error.message})
			})
		}
	})
}
/*
Author: Pradeep
Descri: get firewall list
Date  : 22-07-2020
*/
let getFirewallList= (reqObj,callback)=>{
	var clientid=reqObj.clientid;
	if(typeof clientid =='undefined'){
	  return callback(1,{success:0,message:'Please provide clientid.'});
	}
	var projectId=reqObj.projectId;
	if(typeof projectId =='undefined'){
	  return callback(1,{success:0,message:'Please provide projectId.'});
	}
	new Promise(function(itemResolve, itemReject){
		gcp_authtoken(clientid, function(error, result){
			itemResolve(result)
		})
	}).then(async function(token){
		if(token.length == 0){
			var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
			return callback(1,response)
		}else{
			var options = {
				'method': 'GET',
				'url': `https://compute.googleapis.com/compute/v1/projects/${projectId}/global/firewalls`,
				'headers': {
				'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				'data' : ""
			};
			await axios(options)
			.then(async response => {
				return callback(null,{success:1,data:response.data})
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(1,{success:0,message:error.response.data.error.message})
			})
		}
	})
}
/*
Author: Pradeep
Descri: create firewall
Date  : 22-07-2020
*/
let createFirewall= (reqObj,callback)=>{
	var sourceRanges=reqObj.sourceRanges
	var destinationRanges=reqObj.destinationRanges
	var clientid=reqObj.clientid;
	if(typeof clientid =='undefined'){
	  return callback(1,{success:0,message:'Please provide clientid.'});
	}
	var projectId=reqObj.projectId;
	if(typeof projectId =='undefined'){
	  return callback(1,{success:0,message:'Please provide projectId.'});
	}
	var firewallName=reqObj.firewallName;
	if(typeof firewallName =='undefined'){
	  return callback(1,{success:0,message:'Please provide firewallName.'});
	}
	var networkName=reqObj.networkName;
	if(typeof networkName =='undefined'){
	  return callback(1,{success:0,message:'Please provide networkName.'});
	}
	var ruleType=reqObj.ruleType;
	if(typeof ruleType =='undefined'){
	  return callback(1,{success:0,message:'Please provide ruleType.'});
	}
	var ports=reqObj.ports;
	if(typeof ports =='undefined'){
	  return callback(1,{success:0,message:'Please provide ports.'});
	}
	var IPProtocol=reqObj.IPProtocol;
	if(typeof IPProtocol =='undefined'){
	  return callback(1,{success:0,message:'Please provide IPProtocol.'});
	}
	new Promise(function(itemResolve, itemReject){
		gcp_authtoken(clientid, function(error, result){
			itemResolve(result)
		})
	}).then(async function(token){
		if(token.length == 0){
			var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
			return callback(1,response)
		}else{
			var jsondata={
				"name": firewallName,
				"description": firewallName,
				"network": `global/networks/${networkName}`,
				"priority": 1000,//This is an integer between 0 and 65535
			}
			if(sourceRanges){
				jsondata.sourceRanges=[sourceRanges]
			}
			if(destinationRanges){
				jsondata.destinationRanges=[destinationRanges]
			}
			if(ruleType=='allow'){
				jsondata.allowed=[
					{
						"IPProtocol": IPProtocol, //protocol strings (tcp, udp, icmp, esp, ah, ipip, sctp) 
						"ports": [//Example inputs include: ["22"], ["80","443"], and ["12345-12349"]
							ports
						]
					}
				]
			}else{
				jsondata.denied=[
					{
						"IPProtocol": IPProtocol, //protocol strings (tcp, udp, icmp, esp, ah, ipip, sctp) 
						"ports": [//Example inputs include: ["22"], ["80","443"], and ["12345-12349"]
							ports
						]
					}
				]
			}
			var options = {
				'method': 'POST',
				'url': `https://compute.googleapis.com/compute/v1/projects/${projectId}/global/firewalls`,
				'headers': {
				'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				'data' : jsondata				  
			};
			await axios(options)
			.then(async response => {
				return callback(null,{success:1,data:response.data})
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(1,{success:0,message:error.response.data.error.message})
			})
		}
	})
}
/*
Author: Pradeep
Descri: create firewall
Date  : 22-07-2020
*/
let updateFirewall= (reqObj,callback)=>{
	var sourceRanges=reqObj.sourceRanges
	var destinationRanges=reqObj.destinationRanges
	var clientid=reqObj.clientid;
	if(typeof clientid =='undefined'){
	  return callback(1,{success:0,message:'Please provide clientid.'});
	}
	var projectId=reqObj.projectId;
	if(typeof projectId =='undefined'){
	  return callback(1,{success:0,message:'Please provide projectId.'});
	}
	var firewallName=reqObj.firewallName;
	if(typeof firewallName =='undefined'){
	  return callback(1,{success:0,message:'Please provide firewallName.'});
	}
	var networkName=reqObj.networkName;
	if(typeof networkName =='undefined'){
	  return callback(1,{success:0,message:'Please provide networkName.'});
	}
	var ruleType=reqObj.ruleType;
	if(typeof ruleType =='undefined'){
	  return callback(1,{success:0,message:'Please provide ruleType.'});
	}
	var ports=reqObj.ports;
	if(typeof ports =='undefined'){
	  return callback(1,{success:0,message:'Please provide ports.'});
	}
	var IPProtocol=reqObj.IPProtocol;
	if(typeof IPProtocol =='undefined'){
	  return callback(1,{success:0,message:'Please provide IPProtocol.'});
	}
	new Promise(function(itemResolve, itemReject){
		gcp_authtoken(clientid, function(error, result){
			itemResolve(result)
		})
	}).then(async function(token){
		if(token.length == 0){
			var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
			return callback(1,response)
		}else{
			var jsondata={
				"name": firewallName,
				"description": firewallName,
				"network": `global/networks/${networkName}`,
				"priority": 1000,//This is an integer between 0 and 65535
			}
			if(sourceRanges){
				jsondata.sourceRanges=[sourceRanges]
			}
			if(destinationRanges){
				jsondata.destinationRanges=[destinationRanges]
			}
			if(ruleType=='allow'){
				jsondata.allowed=[
					{
						"IPProtocol": IPProtocol, //protocol strings (tcp, udp, icmp, esp, ah, ipip, sctp) 
						"ports": [//Example inputs include: ["22"], ["80","443"], and ["12345-12349"]
							ports
						]
					}
				]
			}else{
				jsondata.denied=[
					{
						"IPProtocol": IPProtocol, //protocol strings (tcp, udp, icmp, esp, ah, ipip, sctp) 
						"ports": [//Example inputs include: ["22"], ["80","443"], and ["12345-12349"]
							ports
						]
					}
				]
			}
			var options = {
				'method': 'PUT',
				'url': `https://compute.googleapis.com/compute/v1/projects/${projectId}/global/firewalls/${firewallName}`,
				'headers': {
				'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				'data' : jsondata				  
			};
			await axios(options)
			.then(async response => {
				return callback(null,{success:1,data:response.data})
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(1,{success:0,message:error.response.data.error.message})
			})
		}
	})
}
/*
Author: Pradeep
Descri: delete firewall
Date  : 23-07-2020
*/
let deleteFirewall= (reqObj,callback)=>{
	var clientid=reqObj.clientid;
	if(typeof clientid =='undefined'){
	  return callback(1,{success:0,message:'Please provide clientid.'});
	}
	var projectId=reqObj.projectId;
	if(typeof projectId =='undefined'){
	  return callback(1,{success:0,message:'Please provide projectId.'});
	}
	var firewallName=reqObj.firewallName;
	if(typeof firewallName =='undefined'){
	  return callback(1,{success:0,message:'Please provide firewallName.'});
	}
	new Promise(async function(itemResolve, itemReject){
		gcp_authtoken(clientid, function(error, result){
			itemResolve(result)
		})
	}).then(async function(token){
		if(token.length == 0){
			var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
			return callback(1,response)
		}else{
			var options = {
				'method': 'DELETE',
				'url': `https://compute.googleapis.com/compute/v1/projects/${projectId}/global/firewalls/${firewallName}`,///automation-net
				'headers': {
				'Authorization': token.tokendata.token_type+' '+token.tokendata.access_token
				},
				'data' : ""
			};
			//console.log(options)
			await axios(options)
			.then(async response => {
				return callback(1,{success:1,data:response.data})
			})
			.catch(error => {
				console.log(error.response.data)
				return callback(null,{success:0,message:error.response.data.error.message})
			})
		}
	})
}  
module.exports={
    gcp_authtoken,
    gcpOauth,
    gcpReturnUrl,
    syncGcpProjectList,
    getGcpProjectList,
    syncGcpZonesList,
	syncGcpRegionsList,
	syncGcpImagesList,
	syncGcpVms,
	syncGcpVmDetail,
	syncMachineTypes,
	getVmDetailbyId,
	syncNetworkList,
	syncSubnetList,
	createNetwork,
	createSubnet,
	networkDetail,
	subnetDetail,
	createVm,
	vmOperations,
	deleteVm,
	diskList,
	createDisk,
	deleteDisk,
	availableDisk,
	attachDisk,
	detachDisk,
	getNetworkList,
	getSubnetList,
	getFirewallList,
	createFirewall,
	updateFirewall,
	deleteFirewall,
	deleteNetwork,
	deleteSubnet,
	syncGcpVmStatus,
	syncGcpServicesAndServicesSkusList,
	syncGcpDatasetsAndTablesList,
	syncGcpServicesUsageData
}

