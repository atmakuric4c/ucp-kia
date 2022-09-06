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
const commonModel = require('../app/models/common.model');

let deleteCmdbRecords= async (req,callback)=>{
	console.log("req ----", req);
	let current_date = dateFormat(new Date(),"yyyy-mm-dd");
	let cts = Math.floor(Date.now() / 1000);
	if(typeof(req.vmId)=='undefined' || req.vmId==''){
	    var response={status:"error", message:'Please provide vmId'}
	    return callback(1,response);
	}
	
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
	
	let log_file_name = "deleteCmdbRecords_"+req.vmId+".txt";
	helper.logDataToFile(log_file_name,"req -- "+((typeof req=='object')?JSON.stringify(req):req));
	
	let sql = `select vd.*, av.subscriptionId, av.resourceGroup, 
		  av.virtualNetwork, av.networkInterface, av.location,
		  av.vmSize, 
		  av.privateIpAddress, av.publicIpAddress, av.osType, 
		  av.search_code, av.extra_info, av.osName, av.osVersion
		  from c4_vm_details as vd
		  inner join azure_vms as av on av.vm_detail_id = vd.id
		  where vd.id = ${req.vmId} `;
	  // sql += ' limit 1';
	console.log(sql);
	helper.logDataToFile(log_file_name,"sql -- "+sql);
	  
  await dbHandler.executeQuery(sql,async function(vmList){
  	Azure_Regions = await new Promise(async function(innerResolve, innerReject){
  		let sql = `select option_key, option_value
  	        from c4_option_config
  	        where  option_type = 'Azure_Region' and status = 1`;
        console.log(sql);
        db.query(sql,async function(error,items,fields){
        	dbFunc.connectionRelease;
            if(!!error) {
            	console.log(error);
            	innerResolve([]);
            } else {
//		  	            	console.log(items);
//		  	            	console.log(JSON.parse(items[0].option_value));
            	innerResolve(JSON.parse(items[0].option_value));
            }
        });
  	});
//		  	  console.log("Azure_Regions -- ", JSON.stringify(Azure_Regions));
  	console.log("vmList -- ", JSON.stringify(vmList));
  	helper.logDataToFile(log_file_name,"vmList -- "+ JSON.stringify(vmList));
  	for await (var vm of vmList){
      	await new Promise(async function(resolve,reject){
      		await new Promise(async function(innerResolve,innerReject){
      			commonModel.azure_authtoken(vm.clientid,function(error,result){
	      	        if(error){
	      	          return innerResolve([])
	      	        }else{
	      	          return innerResolve(result)
	      	        }
      			})
      	    }).then(function(token){
      	      if(token && token.tokendata)
      	      {
      	        var url='https://management.azure.com/subscriptions/'+vm.subscriptionId+'/resourceGroups/'+vm.resourceGroup+'/providers/Microsoft.Compute/virtualMachines/'+vm.label_name+'/instanceView?api-version=2022-03-01';
      	        console.log("url -- "+url);
      	        request.get({url:url, headers : {
      	          "Authorization" :'Bearer '+token.tokendata.access_token
      	          }},
      	        async function optionalCallback(err, httpResponse, result) {
      	//	        	  console.log("result");
      	//					console.log(result);
      	//					console.log(JSON.stringify(result));
      	          if (err) {
      	              console.log(err)
      	              resolve(err);
      	          }else{
      	            var body=JSON.parse(result);
      	            console.log("body");
      				console.log(body);
      	            if(body && body.error && body.error.code && body.error.code=='ResourceNotFound'){// 0 && 
      	            	console.log("body");
      					console.log(body);
      					console.log(JSON.stringify(body));
			      		let upd_sql = `UPDATE azure_reusing_hostnames SET record_status=4, reserved_date=${cts} WHERE host_name=:host_name`;
			      		let upd_sql_status = await dbHandler.executeQueryv2(upd_sql, {host_name: vm.label_name});
			      		console.log("upd_sql_status --- ", upd_sql_status);
			      		helper.logDataToFile(log_file_name,upd_sql_status);
			      		
			      		dbHandler.updateTableData('c4_vm_details',{id:req.vmId},
				        		{
				        	vm_status:'Deleted',
				        	status:0, 
				        	host_name : vm.label_name+"-"+vm.cmdb_ci_number,
				        	},function(err,result){
				          console.log('updated')
				        })
				        
				        let azureVmUpdate = {powerState:'Deleted',status:0,
				        	name : vm.label_name+"-"+vm.cmdb_ci_number};
				        if(vm.search_code){
				        	let regex = new RegExp( '(-' + vm.cmdb_ci_number + ')', 'gi' );
				        	azureVmUpdate.search_code = (vm.search_code.replace( regex, "" ))+"-"+vm.cmdb_ci_number;
				        }
				        
				        dbHandler.updateTableData('azure_vms',{vm_detail_id:req.vmId},azureVmUpdate,function(err,result){
				        	console.log('updated')
				        });
				        
			      		if(!vm.search_code){
			      			console.log("empty search code");
			      			resolve("empty search code");
			      			return;
			      		}
			            
			      		vm.vm_creation_request_obj = ((vm.vm_creation_request_obj)?JSON.parse(vm.vm_creation_request_obj):{});
			      		
			      		decommissionReqBody = {
			    			"clientId" : vm.clientid,
			    			"subscriptionId" : vm.subscriptionId,
			    			"resourceGroup" : vm.resourceGroup,
			    			"virtualMachineName" : vm.host_name
			        	};
			      		 console.log("decommissionReqBody -- ", decommissionReqBody);
			//	        	syncSingleVmDetails(decommissionReqBody,function(err,result){
			////	        		console.log("syncSingleVmDetails result -- ", result);
			//	        		console.log("host_name -- ", vm.host_name);
			//	        		console.log('jobData.job_type 2 updated')
			//	        	})
			        	
			      		let selected_region = '';
			      		for await (var region of Azure_Regions){
			      			if(region.key == vm.vm_creation_request_obj.region){
			      				selected_region = region.value;
			      			}
			      		}
				        
				        let basicAuth=base64.encode(`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME}:${UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD}`);
				        
				        let db_search_code = '';
				        let db_sys_id = '';
				        let db_rel_sys_id = '';
				        let bs_rel_sys_id = '';
				        let mw_search_code = '';
				        let mw_sys_id = '';
						let rg_rel_sys_id = '';
						let url= '';
						
						if(vm.cmdb_db_ci_number != "" && vm.cmdb_db_search_code != '' && vm.cmdb_db_sys_id != ''){
					        url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/cmdb_rel_ci?sysparm_query=child=${vm.cmdb_ci_sys_id}`;
					  		console.log("url --- ", url);
					  		helper.logDataToFile(log_file_name,"url -- "+url);
					  		console.log(`Basic ${basicAuth}`);
					  		var promise_Get_Check_for_parent_relations = await new Promise(function(resolve6,reject6){
					  			request.get({url:url, headers : {
					  			  'Authorization': `Basic ${basicAuth}`,
					  	          'Content-Type': 'application/json',
					  	          }},
						  	        async function optionalCallback(err, httpResponse, result) {
						  	          if (err) {//0 && 
						  	        	  console.log("err -- ", JSON.stringify(err));
						  	        	helper.logDataToFile(log_file_name,"err -- "+((typeof err=='object')?JSON.stringify(err):err));
						  	        	  console.log("cmdb_rel_ci?sysparm_query=child resolve -- "+vm.host_name);
						            		  console.log("----------------------------------------------------------------------------------");
						            		  resolve6('Continue');
						  	          }else{
						  	          	console.log("result -- ", JSON.stringify(result));
						  	            if(typeof result !='undefined'){
						  	              var searchSysbody=JSON.parse(result);
						  	            }else{ 
						  	              var searchSysbody=[];
						  	            }
						  	            console.log("searchSysbody -- ", JSON.stringify(searchSysbody));
						  	            if(searchSysbody.result && searchSysbody.result.length > 0){
						  	            	db_search_code = vm.cmdb_db_search_code;
						  	            	db_sys_id = vm.cmdb_db_sys_id;
						  	            	db_rel_sys_id = searchSysbody.result[0].sys_id;
						  	            		
						  	            	//Get relation to BS
						  	            	var promise_Get_relation_to_BS = await new Promise(function(resolve1,reject1){
							  	            	let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/cmdb_ci_service?sysparm_query=sys_id=${searchSysbody.result[0].parent.value}&sysparm_fields=u_search_code,sys_id`;
							  	  		  		console.log("url --- ", url);
							  	  		  		helper.logDataToFile(log_file_name,"url -- "+url);
							  	  		  		request.get({url:url, headers : {
							  	  		  			  'Authorization': `Basic ${basicAuth}`,
							  	  		  	          'Content-Type': 'application/json',
							  	  		  	          }},
							  	  		  	        async function optionalCallback(err, httpResponse, result) {
							  	  		  	          if (err) {//0 && 
							  	  		  	        	  console.log("err -- ", JSON.stringify(err));
							  	  		  	        	helper.logDataToFile(log_file_name,"err -- "+((typeof err=='object')?JSON.stringify(err):err));
							  	  		  	        	  console.log("cmdb_ci_service?sysparm_query=sys_id=${searchSysbody.result[0].parent.value} resolve -- "+vm.host_name);
							  	  		            		  console.log("----------------------------------------------------------------------------------");
							  	  		            		resolve1('Continue');
							  	  		  	          }else{
							  	  		  	          	console.log("result -- ", JSON.stringify(result));
							  	  		  	            if(typeof result !='undefined'){
							  	  		  	              var body=JSON.parse(result);
							  	  		  	            }else{ 
							  	  		  	              var body=[];
							  	  		  	            }
							  	  		  	            console.log("body -- ", JSON.stringify(body));
							  	  		  	            if(body.result && body.result.length > 0){
							  	  		  	            	bs_rel_sys_id = searchSysbody.result[0].sys_id;
							  	  		  	            	resolve1('Continue');
							  	  		  	            }else{
							  	  		  	            	console.log("cmdb_ci_service?sysparm_query=sys_id=${searchSysbody.result[0].parent.value} resolve -- "+vm.host_name);
							  	  		              		console.log("----------------------------------------------------------------------------------");
							  	  		              		resolve1('Continue');
							  	  		  	            }
							  	  		  	          }
							  	  	  	        });
						  	            	});
						  	  		  		
						  	  		  		//Get relation to resource group
						  	            	var promise_Get_relation_to_resource_group = await new Promise(function(resolve1,reject1){
							  	            	let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_dhl_ci_container?sysparm_query=sys_id=${searchSysbody.result[0].parent.value}&sysparm_fields=u_search_code,sys_id`;
							  	            	console.log("url --- ", url);
							  	  		  		helper.logDataToFile(log_file_name,"url -- "+url);
							  	  		  		request.get({url:url, headers : {
							  	  		  			  'Authorization': `Basic ${basicAuth}`,
							  	  		  	          'Content-Type': 'application/json',
							  	  		  	          }},
							  	  		  	        async function optionalCallback(err, httpResponse, result) {
							  	  		  	          if (err) {//0 && 
							  	  		  	        	  console.log("err -- ", JSON.stringify(err));
							  	  		  	        	helper.logDataToFile(log_file_name,"err -- "+((typeof err=='object')?JSON.stringify(err):err));
							  	  		  	        	  console.log("cmdb_ci_service?sysparm_query=sys_id=${searchSysbody.result[0].parent.value} resolve -- "+vm.host_name);
							  	  		            		  console.log("----------------------------------------------------------------------------------");
							  	  		            		resolve1('Continue');
							  	  		  	          }else{
							  	  		  	          	console.log("result -- ", JSON.stringify(result));
							  	  		  	            if(typeof result !='undefined'){
							  	  		  	              var body=JSON.parse(result);
							  	  		  	            }else{ 
							  	  		  	              var body=[];
							  	  		  	            }
							  	  		  	            console.log("body -- ", JSON.stringify(body));
							  	  		  	            if(body.result && body.result.length > 0){
							  	  		  	            	rg_rel_sys_id = searchSysbody.result[0].sys_id;
							  	  		  	            	resolve1('Continue');
							  	  		  	            }else{
							  	  		  	            	console.log("cmdb_ci_service?sysparm_query=sys_id=${searchSysbody.result[0].parent.value} resolve -- "+vm.host_name);
							  	  		              		console.log("----------------------------------------------------------------------------------");
							  	  		              		resolve1('Continue');
							  	  		  	            }
							  	  		  	          }
							  	  	  	        });
						  	            	});
						  	            	
						  	            	//Remove relation to DB
						  	            	for await (var sRel of searchSysbody.result){
						  	            		db_rel_sys_id = sRel.sys_id;
							  	            	var promise_cmdb_rel_ci_child_delete = await new Promise(function(resolve1,reject1){
							  	            		let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/cmdb_rel_ci/${db_rel_sys_id}`;
							  	          		  	console.log("url --- ", url);
							  	            		request.delete({
							  	            		    url:url, 
							  	            		    headers:{
							  	            		    'Accept': 'application/json', 
							  	            		    'Authorization': `Basic ${basicAuth}`
							  	            		    }},
							  	            		    function optionalCallback(err, httpResponse, result) {
							  	            		      console.log(result);
							  	            		    helper.logDataToFile(log_file_name,"result -- "+((typeof result=='object')?JSON.stringify(result):result));
							  	            		      if(err){
							  	            		    	  console.log("err -- ", JSON.stringify(err));
							  	            		    	helper.logDataToFile(log_file_name,"err -- "+((typeof err=='object')?JSON.stringify(err):err));
							  	            		    	  resolve1("The operation did not execute as expected. Please raise a ticket to support");
							  	            		      }else{
					//		  	            		        result = JSON.parse(result);
							  	            		        if(result){
							  	            		        	resolve1(result);
							  	            		        }else{
							  	            		        	resolve1("The operation did not execute as expected. Please raise a ticket to support");
							  	            		        }
							  	            		      }
							  	            		    }
							  	            		  );
							  	                });
						  	            	}
						  	            	
						  	            	//Get relation between DB and BS
						  	            	var promise_Get_relation_between_DB_and_BS = await new Promise(function(resolve1,reject1){
							  	            	let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/cmdb_rel_ci?sysparm_query=child.u_search_code=${db_search_code}`;
							  	            	console.log("url --- ", url);
							  	  		  		helper.logDataToFile(log_file_name,"url -- "+url);
							  	  		  		request.get({url:url, headers : {
							  	  		  			  'Authorization': `Basic ${basicAuth}`,
							  	  		  	          'Content-Type': 'application/json',
							  	  		  	          }},
							  	  		  	        async function optionalCallback(err, httpResponse, result) {
							  	  		  	          if (err) {//0 && 
							  	  		  	        	  console.log("err -- ", JSON.stringify(err));
							  	  		  	        	helper.logDataToFile(log_file_name,"err -- "+((typeof err=='object')?JSON.stringify(err):err));
							  	  		  	        	  console.log("cmdb_rel_ci?sysparm_query=child.u_search_code=${db_search_code} resolve -- "+vm.host_name);
							  	  		            		  console.log("----------------------------------------------------------------------------------");
							  	  		            		resolve1('Continue');
							  	  		  	          }else{
							  	  		  	          	console.log("result -- ", JSON.stringify(result));
							  	  		  	            if(typeof result !='undefined'){
							  	  		  	              var dbSearchBody=JSON.parse(result);
							  	  		  	            }else{ 
							  	  		  	              var dbSearchBody=[];
							  	  		  	            }
							  	  		  	            console.log("dbSearchBody -- ", JSON.stringify(dbSearchBody));
							  	  		  	            if(dbSearchBody.result && dbSearchBody.result.length > 0){
							  	  		  	            	//Remove releation between DB CI and BS
							  	  		  	            	var promise_Remove_releation_between_DB_CI_and_BS = await new Promise(function(resolve2,reject2){
										  	            		let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/cmdb_rel_ci/${dbSearchBody.result[0].sys_id}`;
										  	          		  	console.log("url --- ", url);
										  	            		request.delete({
										  	            		    url:url, 
										  	            		    headers:{
										  	            		    'Accept': 'application/json', 
										  	            		    'Authorization': `Basic ${basicAuth}`
										  	            		    }},
										  	            		    function optionalCallback(err, httpResponse, result) {
										  	            		      console.log(result);
										  	            		    helper.logDataToFile(log_file_name,"result -- "+((typeof result=='object')?JSON.stringify(result):result));
										  	            		      if(err){
										  	            		    	  console.log("err -- ", JSON.stringify(err));
										  	            		    	helper.logDataToFile(log_file_name,"err -- "+((typeof err=='object')?JSON.stringify(err):err));
										  	            		    	  resolve2("The operation did not execute as expected. Please raise a ticket to support");
										  	            		      }else{
					//					  	            		        result = JSON.parse(result);
										  	            		        if(result){
										  	            		        	resolve2(result);
										  	            		        }else{
										  	            		        	resolve2("The operation did not execute as expected. Please raise a ticket to support");
										  	            		        }
										  	            		      }
										  	            		    }
										  	            		  );
										  	                });
							  	  		  	            	resolve1('Continue');
							  	  		  	            }else{
							  	  		  	            	console.log("cmdb_rel_ci?sysparm_query=child.u_search_code=${db_search_code} resolve -- "+vm.host_name);
							  	  		              		console.log("----------------------------------------------------------------------------------");
							  	  		              		resolve1('Continue');
							  	  		  	            }
							  	  		  	          }
							  	  	  	        });
						  	            	});
						  	            	
						  	            	//Decommission DB CI
						  	            	var promise_u_excel_dhl_hw_upload = await new Promise(function(resolve1,reject1){
						  	            		let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_excel_dhl_hw_upload`;
						  	          		  	console.log("url --- ", url);
						  	          		  	let options = {
							  	          		   "u_decommission_date":current_date,
							  	          		   "u_decom_date":current_date,
							  	          		   "u_decommissiondate":current_date,
							  	          		   "u_decommissioned_date":current_date,
							  	          		   "u_status":"Decommissioned",
							  	          		   "u_search_code":vm.cmdb_db_search_code
							  	          		};
						  	          		  	console.log("u_excel_dhl_hw_upload request", JSON.stringify(options));
						  	            		
						  	            		let request_options = {
						          				  'method': 'POST',
						          				  'url': url,
						          				  'headers': {
						          				    'Content-Type': 'application/json',
						          				    'Authorization':  `Basic ${basicAuth}`,
						          				  },
						          				  body: JSON.stringify(options)
				
						          				};
							          		  	
							          		  	console.log("u_excel_dhl_hw_upload request_options -- ", JSON.stringify(request_options));
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
						  	            	
						  	            	//Deactivate DB CI
						  	            	var promise_u_excel_dhl_hw_upload2 = await new Promise(function(resolve1,reject1){
						  	            		let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_excel_dhl_hw_upload`;
						  	          		  	console.log("url --- ", url);
						  	          		  	let options = {
							  	          		   "u_active":false,
							  	          		   "u_search_code":vm.cmdb_db_search_code
							  	          		};
						  	          		  	console.log("u_excel_dhl_hw_upload2 request", JSON.stringify(options));
						  	            		
						  	            		let request_options = {
						          				  'method': 'POST',
						          				  'url': url,
						          				  'headers': {
						          				    'Content-Type': 'application/json',
						          				    'Authorization':  `Basic ${basicAuth}`,
						          				  },
						          				  body: JSON.stringify(options)
				
						          				};
							          		  	
							          		  	console.log("u_excel_dhl_hw_upload2 request_options -- ", JSON.stringify(request_options));
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
						  	            	
						  	            	//Remove relation to business service
						  	            	if (bs_rel_sys_id)
						  	            	{
						  	            		var promise_Remove_relation_to_business_service = await new Promise(function(resolve1,reject1){
							  	            		let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/cmdb_rel_ci/${bs_rel_sys_id}`;
							  	          		  	console.log("url --- ", url);
							  	            		request.delete({
							  	            		    url:url, 
							  	            		    headers:{
							  	            		    'Accept': 'application/json', 
							  	            		    'Authorization': `Basic ${basicAuth}`
							  	            		    }},
							  	            		    function optionalCallback(err, httpResponse, result) {
							  	            		      console.log(result);
							  	            		    helper.logDataToFile(log_file_name,"result -- "+((typeof result=='object')?JSON.stringify(result):result));
							  	            		      if(err){
							  	            		    	  console.log("err -- ", JSON.stringify(err));
							  	            		    	helper.logDataToFile(log_file_name,"err -- "+((typeof err=='object')?JSON.stringify(err):err));
							  	            		    	  resolve1("The operation did not execute as expected. Please raise a ticket to support");
							  	            		      }else{
				//			  	            		        result = JSON.parse(result);
							  	            		        if(result){
							  	            		        	resolve1(result);
							  	            		        }else{
							  	            		        	resolve1("The operation did not execute as expected. Please raise a ticket to support");
							  	            		        }
							  	            		      }
							  	            		    }
							  	            		  );
							  	                });
						  	            	}
						  	            	
						  	            	//Remove releation to resource group
						  	            	if (rg_rel_sys_id)
						  	            	{
						  	            		var promise_Remove_relation_to_resource_group = await new Promise(function(resolve1,reject1){
							  	            		let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/cmdb_rel_ci/${rg_rel_sys_id}`;
							  	          		  	console.log("url --- ", url);
							  	            		request.delete({
							  	            		    url:url, 
							  	            		    headers:{
							  	            		    'Accept': 'application/json', 
							  	            		    'Authorization': `Basic ${basicAuth}`
							  	            		    }},
							  	            		    function optionalCallback(err, httpResponse, result) {
							  	            		      console.log(result);
							  	            		    helper.logDataToFile(log_file_name,"result -- "+((typeof result=='object')?JSON.stringify(result):result));
							  	            		      if(err){
							  	            		    	  console.log("err -- ", JSON.stringify(err));
							  	            		    	helper.logDataToFile(log_file_name,"err -- "+((typeof err=='object')?JSON.stringify(err):err));
							  	            		    	  resolve1("The operation did not execute as expected. Please raise a ticket to support");
							  	            		      }else{
				//			  	            		        result = JSON.parse(result);
							  	            		        if(result){
							  	            		        	resolve1(result);
							  	            		        }else{
							  	            		        	resolve1("The operation did not execute as expected. Please raise a ticket to support");
							  	            		        }
							  	            		      }
							  	            		    }
							  	            		  );
							  	                });
						  	            	}
						  	            	resolve6('Continue');
						  	            }else{
						  	            	console.log("cmdb_rel_ci?sysparm_query=child resolve -- "+vm.host_name);
						              		console.log("----------------------------------------------------------------------------------");
						              		resolve6('Continue');
						  	            }
					  	        	}
					  	        });
					  		});
						}
				  		
				  		if(vm.cmdb_ci_instance_name != ''
			          		&& vm.cmdb_ci_model_reference != ''
			      			&& vm.cmdb_ci_mw_sys_id != ''
							&& vm.cmdb_ci_mw_sys_id != ''){
					  		//Check for MW relations
				          	var promise_Check_for_MW_relations = await new Promise(function(resolve1,reject1){
				            	let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/cmdb_rel_ci?sysparm_query=parent=${vm.cmdb_ci_sys_id}`;
				            	console.log("url --- ", url);
				  		  		helper.logDataToFile(log_file_name,"url -- "+url);
				  		  		request.get({url:url, headers : {
				  		  			  'Authorization': `Basic ${basicAuth}`,
				  		  	          'Content-Type': 'application/json',
				  		  	          }},
				  		  	        async function optionalCallback(err, httpResponse, result) {
				  		  	          if (err) {//0 && 
				  		  	        	  console.log("err -- ", JSON.stringify(err));
				  		  	        	helper.logDataToFile(log_file_name,"err -- "+((typeof err=='object')?JSON.stringify(err):err));
				  		  	        	  console.log("cmdb_rel_ci?sysparm_query=parent=${vm.cmdb_ci_sys_id} resolve -- "+vm.host_name);
				  		            		  console.log("----------------------------------------------------------------------------------");
				  		            		resolve1('Continue');
				  		  	          }else{
				  		  	          	console.log("result -- ", JSON.stringify(result));
				  		  	            if(typeof result !='undefined'){
				  		  	              var MWRelationsBody=JSON.parse(result);
				  		  	            }else{ 
				  		  	              var MWRelationsBody=[];
				  		  	            }
				  		  	            console.log("MWRelationsBody -- ", JSON.stringify(MWRelationsBody));
				  		  	            if(MWRelationsBody.result && MWRelationsBody.result.length > 0){
					  		  	            for await (var mwRel of MWRelationsBody.result){
					  		  	            	await new Promise(async function(resolve2, reject2){
						  		  	            	let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_dhl_ci_sw?sysparm_query=sys_id=${mwRel.child.value}&sysparm_fields=u_search_code,sys_id`;
						  		  	            	console.log("url --- ", url);
						  		  	  		  		helper.logDataToFile(log_file_name,"url -- "+url);
						  		  	  		  		request.get({url:url, headers : {
						  		  	  		  			  'Authorization': `Basic ${basicAuth}`,
						  		  	  		  	          'Content-Type': 'application/json',
						  		  	  		  	          }},
						  		  	  		  	        async function optionalCallback(err, httpResponse, result) {
						  		  	  		  	          if (err) {//0 && 
						  		  	  		  	        	  console.log("err -- ", JSON.stringify(err));
						  		  	  		  	        	  helper.logDataToFile(log_file_name,"err -- "+((typeof err=='object')?JSON.stringify(err):err));
						  		  	  		  	        	  console.log("cmdb_rel_ci?sysparm_query=parent=${vm.cmdb_ci_sys_id} resolve -- "+vm.host_name);
						  		  	  		  	        	  console.log("----------------------------------------------------------------------------------");
						  		  	  		  	        	  resolve2('Continue');
						  		  	  		  	          }else{
						  		  	  		  	          	console.log("result -- ", JSON.stringify(result));
						  		  	  		  	            if(typeof result !='undefined'){
						  		  	  		  	              var mwRelSearchBody=JSON.parse(result);
						  		  	  		  	            }else{ 
						  		  	  		  	              var mwRelSearchBody=[];
						  		  	  		  	            }
						  		  	  		  	            console.log("mwRelSearchBody -- ", JSON.stringify(mwRelSearchBody));
						  		  	  		  	            if(mwRelSearchBody.result && mwRelSearchBody.result.length > 0){
						  		  	  		  	            	//Remove MW relation
								  		  	  		  	        var promise_Remove_MW_relation = await new Promise(function(resolve3, reject3){
											  	            		let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/cmdb_rel_ci/${mwRel.sys_id}`;
											  	          		  	console.log("url --- ", url);
											  	            		request.delete({
											  	            		    url:url, 
											  	            		    headers:{
											  	            		    'Accept': 'application/json', 
											  	            		    'Authorization': `Basic ${basicAuth}`
											  	            		    }},
											  	            		    function optionalCallback(err, httpResponse, result) {
											  	            		      console.log(result);
											  	            		    helper.logDataToFile(log_file_name,"result -- "+((typeof result=='object')?JSON.stringify(result):result));
											  	            		      if(err){
											  	            		    	  console.log("err -- ", JSON.stringify(err));
											  	            		    	helper.logDataToFile(log_file_name,"err -- "+((typeof err=='object')?JSON.stringify(err):err));
											  	            		    	  resolve3("The operation did not execute as expected. Please raise a ticket to support");
											  	            		      }else{
					//						  	            		        result = JSON.parse(result);
											  	            		        if(result){
											  	            		        	resolve3(result);
											  	            		        }else{
											  	            		        	resolve3("The operation did not execute as expected. Please raise a ticket to support");
											  	            		        }
											  	            		      }
											  	            		    }
											  	            		  );
											  	                });
						  		  	  		  	            	resolve2('Continue');
						  		  	  		  	            }else{
						  		  	  		  	            	console.log("cmdb_rel_ci?sysparm_query=parent=${vm.cmdb_ci_sys_id} resolve -- "+vm.host_name);
						  		  	  		              		console.log("----------------------------------------------------------------------------------");
						  		  	  		              		resolve2('Continue');
						  		  	  		  	            }
						  		  	  		  	          }
						  		  	  	  	        });
					  		  	            	});
					  		  	            }
				  		  	            	resolve1('Continue');
				  		  	            }else{
				  		  	            	console.log("cmdb_rel_ci?sysparm_query=parent=${vm.cmdb_ci_sys_id} resolve -- "+vm.host_name);
				  		              		console.log("----------------------------------------------------------------------------------");
				  		              		resolve1('Continue');
				  		  	            }
				  		  	          }
				  	  	        });
				      		});
				  		}
					        
			        	try{
			            	if(vm.cmdb_ci_instance_name != ''
			            		&& vm.cmdb_ci_model_reference != ''
			        			&& vm.cmdb_ci_mw_sys_id != ''
			    				&& vm.cmdb_ci_mw_sys_id != ''){
			            		url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}MIA_Middleware_WS.do?WSDL`;
			            	    console.log(url);
			            	    var promise_MIA_Middleware_WS_inner = new Promise(function(resolve2,reject2){
			            	    let options = {
			            	    		"instanceName": vm.cmdb_ci_instance_name,
			            	    		"serverReference": vm.cmdb_ci_sys_id,
			            	            "modelReference": vm.cmdb_ci_model_reference,
			            	            "status" : 8
			            	    };
			            	    console.log(url);
			            	    console.log("options --- ", options);
			            	    
			            	    const soap = require('soap');
				          		  	var auth = "Basic " + new Buffer(UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME + ":" + UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD).toString("base64");
				          		  	const httpOptions = {
				          	           wsdl_headers: {Authorization: auth} 
				          		  	};
				          		  	
			            	    soap.createClient(url, httpOptions, function(err, client) {
			            	         // client.setSecurity(new soap.ClientSSLSecurity({strictSSL: false}));
			            	             if (err) {
			            	                  console.error("MIA_Middleware_WS_inner_result soap error:",err);
			            	                  resolve2(err);
			            	             } else {
			            	            	  console.log(client);
			            	            	  client.addHttpHeader('Authorization', auth);
			            	            	  client.ServiceNow_MIA_Middleware_WS.ServiceNowSoap.execute(options, httpOptions, function(err, MIA_Middleware_WS_inner_result) {
			            	                //console.log(client.ServiceNow_MIA_Middleware_WS.ServiceNowSoap.execute.soapAction);
			            	            		  if (err) {
			            	            			  console.log("MIA_Middleware_WS_inner_result err",err);
			            	            			  resolve2(err);
			            	            		  } else { 
			            	            			  console.log(MIA_Middleware_WS_inner_result);
			            	            			  resolve2(MIA_Middleware_WS_inner_result);
			        	            			  }
			            	            	  });
			            	             }
			            	        });
			            	    });
				        	console.log(promise_MIA_Middleware_WS_inner);
			            	}
			        	}catch(e){
			        		console.log(e);
			        	}
					        	
			        	if(vm.cmdb_ci_sys_id){
				        	var promise_u_excel_dhl_hw_server_upload = await new Promise(function(resolve1,reject1){
				        		let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_excel_dhl_hw_server_upload`;
				      		  	console.log("url --- ", url);
				      		  	let options = {
				      		  	   "u_ip_address_2":"empty",
				          		   "u_decommission_date":current_date,
				          		   "u_decom_date":current_date,
				          		   "u_decommissiondate":current_date,
				          		   "u_decommissioned_date":current_date,
				          		   "u_ip_address_3":"empty",
				          		   "u_ip_address_1":"empty",
				          		   "ip_address":"empty",
				          		   "u_status":"Decommissioned",
				          		   "u_owner_person": "empty",
				          		   "owner_by": "empty",
				          		   "u_network_name": "empty",
				          		   "u_search_code": vm.search_code
				          		};
				      		  	console.log("u_excel_dhl_hw_server_upload request", JSON.stringify(options));
				      		  	helper.logDataToFile(log_file_name,"u_excel_dhl_hw_server_upload request -- "+ JSON.stringify(options));
				        		
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
				      		  	helper.logDataToFile(log_file_name,"u_excel_dhl_hw_server_upload request_options -- "+JSON.stringify(request_options));
				  				request(request_options, function (error, response) {
				  					console.log("error -- ", JSON.stringify(error));
				  					helper.logDataToFile(log_file_name,"error -- "+((typeof error=='object')?JSON.stringify(error):error));
				  					console.log("response.body -- ", JSON.stringify(response));
				  					helper.logDataToFile(log_file_name,"response -- "+((typeof response=='object')?JSON.stringify(response):response));
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
				        	
				        	var promise_u_excel_dhl_hw_server_upload2 = await new Promise(function(resolve1,reject1){
				        		let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_excel_dhl_hw_server_upload`;
				      		  	console.log("url --- ", url);
				      		  	let options = {
				          		   "u_active":false,
				          		   "u_search_code": vm.search_code
				          		};
				      		  	console.log("u_excel_dhl_hw_server_upload2 request", JSON.stringify(options));
				      		  	helper.logDataToFile(log_file_name,"u_excel_dhl_hw_server_upload2 request -- "+ JSON.stringify(options));
				        		
				        		let request_options = {
				  				  'method': 'POST',
				  				  'url': url,
				  				  'headers': {
				  				    'Content-Type': 'application/json',
				  				    'Authorization':  `Basic ${basicAuth}`,
				  				  },
				  				  body: JSON.stringify(options)
				
				  				};
				      		  	
				      		  	console.log("u_excel_dhl_hw_server_upload2 request_options -- ", JSON.stringify(request_options));
				      		  	helper.logDataToFile(log_file_name,"u_excel_dhl_hw_server_upload2 request_options -- "+JSON.stringify(request_options));
				  				request(request_options, function (error, response) {
				  					console.log("error -- ", JSON.stringify(error));
				  					helper.logDataToFile(log_file_name,"error -- "+((typeof error=='object')?JSON.stringify(error):error));
				  					console.log("response.body -- ", JSON.stringify(response));
				  					helper.logDataToFile(log_file_name,"response -- "+((typeof response=='object')?JSON.stringify(response):response));
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
						        	
				        	var promise_u_dhl_ci_hw_server_cloud_update = await new Promise(function(resolve1,reject1){
				        		let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_dhl_ci_hw_server_cloud_update`;
				        		let regex1 = new RegExp( '(-' + vm.cmdb_ci_number + ')', 'gi' );
				      		  	console.log("url --- ", url);
				      		  	let options = {
				      		  	   "u_number":vm.cmdb_ci_number,
				          		   "u_search_code":(vm.search_code.replace( regex1, "" ))+"-"+vm.cmdb_ci_number
				          		};
				      		  	console.log("u_dhl_ci_hw_server_cloud_update request", JSON.stringify(options));
				      		helper.logDataToFile(log_file_name,"u_dhl_ci_hw_server_cloud_update request -- "+JSON.stringify(options));
				        		
				        		let request_options = {
				  				  'method': 'POST',
				  				  'url': url,
				  				  'headers': {
				  				    'Content-Type': 'application/json',
				  				    'Authorization':  `Basic ${basicAuth}`,
				  				  },
				  				  body: JSON.stringify(options)
				
				  				};
				      		  	
				      		  	console.log("u_dhl_ci_hw_server_cloud_update request_options -- ", JSON.stringify(request_options));
				      		  helper.logDataToFile(log_file_name,"u_dhl_ci_hw_server_cloud_update request_options -- "+JSON.stringify(request_options));
				  				request(request_options, function (error, response) {
				  					console.log("error -- ", JSON.stringify(error));
				  					helper.logDataToFile(log_file_name,"error -- "+((typeof error=='object')?JSON.stringify(error):error));
				  					console.log("response.body -- ", JSON.stringify(response));
				  					helper.logDataToFile(log_file_name,"response -- "+((typeof response=='object')?JSON.stringify(response):response));
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
						        	
				        	await Promise.all([promise_u_excel_dhl_hw_server_upload, promise_u_dhl_ci_hw_server_cloud_update]).then(async function(values) {
				        		console.log("final values", JSON.stringify(values));
				        		console.log("final vm delete resolve -- "+vm.host_name);
				        		console.log("----------------------------------------------------------------------------------");
				        		if(typeof(req.decommissionListId)=='undefined' && req.decommissionListId!=''){
				            		dbHandler.updateTableData('c4_vm_decommission_requests',{id:req.decommissionListId},{is_updated_in_cmdb:1},function(err,result){
				            			console.log('updated')
				            		});
				        		}
				        		resolve("");
				        	});
				        }else{
				        	console.log("final vm delete resolve -- "+vm.host_name);
				      		console.log("----------------------------------------------------------------------------------");
				      		resolve('Continue');
				        }
      	            }else{
      	            	console.log("final vm delete resolve -- "+vm.host_name);
			      		console.log("----------------------------------------------------------------------------------");
			      		resolve('Continue');
      	            }
      	          }
      	        });
      	      }else{
      	    	console.log("final vm delete resolve -- "+vm.host_name);
	      		console.log("----------------------------------------------------------------------------------");
	      		resolve('Continue');
      	      }
      	  });
		});
  	}
  	console.log("vm delete complete ==============");
  	return callback(null,{status:"success", success:1,message:'VM Deletion Request Has Been Raised Successfully.', data: req});
  });
}

module.exports={
	deleteCmdbRecords
}
