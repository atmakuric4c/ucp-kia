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
const { urlencoded } = require('body-parser');
let mail = require("../common/mailer.js");
//const { getDiskList } = require('../app/models/aws.model');
const AWS = require('aws-sdk');
const moment = require('moment');
const awsExternalServices = require('../app/external_services/aws.service');

let aws_authtoken=(clientid,callback)=>{
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
          var sql=`select * from c4_aws_client_tokens where clientid='${clientid}' and 
          record_status = 1 order by id asc limit 1`;
          // console.log("sql");
          // console.log(sql);
          dbHandler.executeQuery(sql,function(results){
          // console.log("results");
          // console.log(results);
          if(results.length > 0){
              var response={data:results[0].id,tokendata:results[0],message:'Token Exists',clientdata:config};
              // console.log("ifff response");
              // console.log(response);
              return callback(null,response)
          }
          // else{
          //     var options={
          //         tenant_id:config.azure_tenantid,
          //         grant_type:config.azure_granttype,
          //         client_id:config.azure_clientid,
          //         client_secret:config.azure_clientsecretkey,
          //         resource:config.azure_resource,
          //     }
          //     var url='https://login.microsoftonline.com/cloud4c.onmicrosoft.com/oauth2/token';
          //     request.post({url:url, body:querystring.stringify(options)},
          //     function optionalCallback(err, httpResponse, result) {
          //     if (err) {
          //         return callback(null,{data:err,tokendata:[],message:'The operation did not execute as expected. Please raise a ticket to support',clientdata:config})
          //     }else{
          //         var body=JSON.parse(result);
          //         //console.log(body)
          //         var tokendata={
          //         token_type:body.token_type,
          //         expires_in:body.expires_in,
          //         expires_on:body.expires_on,
          //         resource:body.resource,
          //         tenant_id:config.azure_tenantid,
          //         client_id:config.azure_clientid,
          //         access_token:body.access_token
          //         }
          //         dbHandler.insertIntoTable('azure_auth_tokens',tokendata,function(err,result){
          //         if(err)return callback(null,{data:result,tokendata:tokendata,message:'The operation did not execute as expected. Please raise a ticket to support',clientdata:config})
          //         var response={data:result,tokendata:tokendata,message:'Token Created Successfully',clientdata:config}
          //         return callback(null,response)
          //         })
          //     }
          //     });
          // }
      });
    }); 
  }
}

/*
Author : Rajesh
Descri: sync AwsServicesUsage
Date  : 04-06-2020
*/
let syncAwsServicesUsage= async (reqObj,callback)=>{
  // console.log(reqObj);
	let current_date = dateFormat(new Date(),"yyyy-mm-dd");
	let cts = Math.round(new Date().getTime() / 1000);    
  let sql = `Select b.* from c4_clients as c 
  inner join c4_other_cloud_budgets as b on (b.clientid = c.id and b.cloud_id = ${config.AWS.cloudid})
  where c.status = 1 and c.is_aws_enabled = 1`;
  if(typeof reqObj.clientid != 'undefined'){
      sql += ` and c.id = ${reqObj.clientid} order by id desc limit 1`;
  }else{
      sql += ` order by id asc`;
  }
  // sql += ' limit 1';
  //console.log(sql);
  await new Promise(function(resolve, reject) {
      dbHandler.executeQuery(sql,async function(AwsClients){
//           console.log("AwsClients");
//           console.log(AwsClients);
          try{
              if (AwsClients.length > 0) {
                  for await (const item of AwsClients) {
                      await new Promise(async function(itemResolve, itemReject){
                        await new Promise(function(resolve,reject){
                          aws_authtoken(item.clientid, function(error, result){
                            // console.log("result");
                            // console.log(result);
                            // if(error){
                            //     resolve([])
                            // }else{
                                resolve(result)
                            // }
                          })
                        }).then(async function(token){
//                           console.log("token");
//                           console.log(token);
                          if(token.tokendata.length == 0){
                            var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
                            itemResolve(response);
                          }else{
                            await new Promise(async function(regionItemResolve, regionItemReject) {
                              let accessKey = token.tokendata.accesstoken;
                              let secretKey = token.tokendata.secretekey;
                              let regionName = "us-east-1"; //'ap-southeast-2'; //regionItem.regionid;
                              let serviceName = 'ce';
                              let myMethod = 'POST';

                              params = {
                                access_key : accessKey,
                                secret_key : secretKey,
                                region : regionName,
                                myService : serviceName,
                                myMethod : myMethod,
                                myPath : '/'
                              }
                              params.queryParams = {"Version":"2012-10-17"};
                              params.additionalHeaderParams = {"Content-Type":"application/x-amz-json-1.1","X-Amz-Target":"AWSInsightsIndexService.GetDimensionValues"};
                              params.dontConvertResponse = true;
                              params.url = params.myService+'.'+params.region+'.amazonaws.com';
                              
                              let Dimension = "SERVICE";
                              params.reqBody = JSON.stringify({
	                            	  "TimePeriod": {
	                            		  "Start": item.service_start_date,
	                            		  "End": dateFormat(new Date(),"yyyy-mm-dd")
                            		  },
                            		  "SearchString": "Elastic",
                            		  "Dimension": Dimension
                    			  });
                              await helper.awsProcessRequest(params,async function(err, responseBody){
                                 //console.log("responseBody GetDimensionValues");
                                   //console.log(responseBody);
                                if(responseBody && !responseBody.DimensionValues && responseBody.__type){
                                  //console.log(responseBody);
                                  regionItemResolve([]);
                                }else{
                                	let DimensionValues = [];
                                	await responseBody.DimensionValues.forEach(async function(val,key) {
                                		DimensionValues.push(val.Value);
                            	    });
                                	//console.log("DimensionValues");
                                    //console.log(DimensionValues);
                                	let start_date ='';
                                    let end_date = '';
                                	let count_sql = `Select count(DISTINCT(bu.usage_date)) as cnt from c4_aws_budget_usage as bu
                                  	  where bu.clientid = ${item.clientid} and bu.usage_date >= '${item.service_start_date}' and bu.usage_date <= '${current_date}'`;
                                  	  //console.log(count_sql);
	                              	await new Promise(async function(count_resolve, count_reject) {
	                                    dbHandler.executeQuery(count_sql,async function(count_data){
	                          	           //console.log("count_data");
	                          	           //console.log(count_data);
	                          	           var date1 = new Date(item.service_start_date); 
	                          	           var date2 = new Date(current_date); 
	                          	             
	                          	           // To calculate the time difference of two dates 
	                          	           var Difference_In_Time = date2.getTime() - date1.getTime(); 
	                          	             
	                          	           // To calculate the no. of days between two dates 
	                          	           var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24); 
	                          	           if(count_data[0].cnt == (Difference_In_Days - 1)){
	//	                              	           if(1){
	                          	        	 start_date = dateFormat(new Date(new Date().setDate(new Date().getDate()-1)),"yyyy-mm-dd");
	                                         end_date = current_date;
	                                         
	                          	        	 let accessKey = token.tokendata.accesstoken;
	                                         let secretKey = token.tokendata.secretekey;
	                                         let regionName = "us-east-1"; //'ap-southeast-2'; //regionItem.regionid;
	                                         let serviceName = 'ce';
	                                         let myMethod = 'POST';
	
	                                         params = {
	                                           access_key : accessKey,
	                                           secret_key : secretKey,
	                                           region : regionName,
	                                           myService : serviceName,
	                                           myMethod : myMethod,
	                                           myPath : '/'
	                                         }
	                                         params.queryParams = {"Version":"2012-10-17"};
	                                         params.additionalHeaderParams = {"Content-Type":"application/x-amz-json-1.1","X-Amz-Target":"AWSInsightsIndexService.GetCostAndUsage"};
	                                         params.dontConvertResponse = true;
	                                         params.url = params.myService+'.'+params.region+'.amazonaws.com';
	                                         
	                                         params.reqBody = JSON.stringify({
	                                        	    "TimePeriod": {
	                                        	        "Start": start_date,
	                                        	        "End": end_date
	                                        	    },
	                                        	    "Granularity": "DAILY",
	                                        	    "Filter": {
	                                        	        "Dimensions": {
	                                        	            "Key": "SERVICE",
	                                        	            "Values": DimensionValues
	                                        	        }
	                                        	    },
	                                        	    "GroupBy": [
	                                        	        {
	                                        	            "Type": "DIMENSION",
	                                        	            "Key": "SERVICE"
	                                        	        },
	                                        	        {
	                                        	            "Type": "TAG",
	                                        	            "Key": "Environment"
	                                        	        }
	                                        	    ],
	                                        	    "Metrics": [
	                                        	        "BlendedCost",
	                                        	        "UnblendedCost",
	                                        	        "UsageQuantity"
	                                        	    ]
	                                        	});
	                                             await helper.awsProcessRequest(params,async function(err, responseBody){
	                                            	 //console.log("responseBody GetCostAndUsage");
	                                            	 //console.log(responseBody);
	                                            	 if(responseBody && !responseBody.ResultsByTime && responseBody.__type){
	                                            		 //console.log(responseBody);
	                                            		 //console.log("count resolve");
	         	                          	           	count_resolve("count resolve");
	         	                          	           	regionItemResolve([]);
	                                            	 }else{
	                                            		 if(responseBody.ResultsByTime[0].Groups.length > 0){
	                                            			 for await (const val of responseBody.ResultsByTime[0].Groups) {
		                                            			 await new Promise(async function(GetCostAndUsage_resolve,GetCostAndUsage_reject){
			                                                 		let insertData = {};
			                                                 		insertData.clientid = item.clientid;
			                                                 		insertData.item_key = Dimension;
			                                                 		insertData.item_value = val.Keys[0];
			                                                 		insertData.blended_cost = val.Metrics.BlendedCost.Amount;
			                                                 		insertData.unblended_cost = val.Metrics.UnblendedCost.Amount;
			                                                 		insertData.usage_quantity = val.Metrics.UsageQuantity.Amount;
			                                                 		insertData.granularity = "DAILY";
			                                                 		insertData.usage_date = responseBody.ResultsByTime[0].TimePeriod.Start;
			                                                 		insertData.created_date = cts;
			                                                 		
			                                                 		await dbHandler.insertIntoTable('c4_aws_budget_usage',insertData,async function(error,aws_budget_usageId){
			                                                 			if(error){
			    			                                                 console.log("insertData");
		    			                                                     console.log(insertData);
    			                                                    	}
		                                                                console.log("inserted the aws_budget_usage with id "+aws_budget_usageId);
		                                                                GetCostAndUsage_resolve("inserted the aws_budget_usage with id "+aws_budget_usageId);
		                                                            });
		                                            			 });
		                                             	     }
		                                            		 //console.log("count resolve");
		         	                          	           	 count_resolve("count resolve");
	                                            		 }else{
		                                                 		let insertData = {};
		                                                 		insertData.clientid = item.clientid;
		                                                 		insertData.item_key = Dimension;
		                                                 		insertData.item_value = "";
		                                                 		insertData.blended_cost = responseBody.ResultsByTime[0].Total.BlendedCost.Amount;
		                                                 		insertData.unblended_cost = responseBody.ResultsByTime[0].Total.UnblendedCost.Amount;
		                                                 		insertData.usage_quantity = responseBody.ResultsByTime[0].Total.UsageQuantity.Amount;
		                                                 		insertData.granularity = "DAILY";
		                                                 		insertData.usage_date = responseBody.ResultsByTime[0].TimePeriod.Start;
		                                                 		insertData.created_date = cts;
		                                                 		
		                                                 		await dbHandler.insertIntoTable('c4_aws_budget_usage',insertData,async function(error,aws_budget_usageId){
		                                                 			if(error){
		    			                                                 console.log("insertData");
	    			                                                     console.log(insertData);
			                                                    	}
	                                                                console.log("inserted the aws_budget_usage with id "+aws_budget_usageId);
	                                                                console.log("count resolve");
	                    	                          	           	count_resolve("count resolve");
	                                                            });
	                                            		 }
	                                            		 regionItemResolve([]);
	                                            	 }
	                                             });
	                              	           }else{
	                              	        	 start_date = item.service_start_date;
	                                             end_date = current_date;
	                                             
	                              	        	 let accessKey = token.tokendata.accesstoken;
	                                             let secretKey = token.tokendata.secretekey;
	                                             let regionName = "us-east-1"; //'ap-southeast-2'; //regionItem.regionid;
	                                             let serviceName = 'ce';
	                                             let myMethod = 'POST';
	
	                                             params = {
	                                               access_key : accessKey,
	                                               secret_key : secretKey,
	                                               region : regionName,
	                                               myService : serviceName,
	                                               myMethod : myMethod,
	                                               myPath : '/'
	                                             }
	                                             params.queryParams = {"Version":"2012-10-17"};
	                                             params.additionalHeaderParams = {"Content-Type":"application/x-amz-json-1.1","X-Amz-Target":"AWSInsightsIndexService.GetCostAndUsage"};
	                                             params.dontConvertResponse = true;
	                                             params.url = params.myService+'.'+params.region+'.amazonaws.com';
	                                             
	                                             params.reqBody = JSON.stringify({
	                                            	    "TimePeriod": {
	                                            	        "Start": start_date,
	                                            	        "End": end_date
	                                            	    },
	                                            	    "Granularity": "DAILY",
	                                            	    "Filter": {
	                                            	        "Dimensions": {
	                                            	            "Key": "SERVICE",
	                                            	            "Values": DimensionValues
	                                            	        }
	                                            	    },
	                                            	    "GroupBy": [
	                                            	        {
	                                            	            "Type": "DIMENSION",
	                                            	            "Key": "SERVICE"
	                                            	        },
	                                            	        {
	                                            	            "Type": "TAG",
	                                            	            "Key": "Environment"
	                                            	        }
	                                            	    ],
	                                            	    "Metrics": [
	                                            	        "BlendedCost",
	                                            	        "UnblendedCost",
	                                            	        "UsageQuantity"
	                                            	    ]
	                                            	});
	                                             await helper.awsProcessRequest(params,async function(err, responseBody){
	                                            	 //console.log("responseBody GetCostAndUsage whole data");
	                                            	 //console.log(responseBody);
	                                            	 if(responseBody && !responseBody.ResultsByTime && responseBody.__type){
	                                            		 //console.log(responseBody);
	                                            		 //console.log("count resolve");
	         	                          	           	 count_resolve("count resolve");
	                                            		 regionItemResolve([]);
	                                            	 }else{
	                                            		 let dates_sql = `Select bu.usage_date from c4_aws_budget_usage as bu
	                                                     	  where bu.clientid = ${item.clientid}`;
	                                            		 dates_sql += ` group by bu.usage_date`;
	                                                     	  //console.log(dates_sql);
	                   	                              	await new Promise(async function(dates_resolve, dates_reject) {
	                	                                    dbHandler.executeQuery(dates_sql,async function(dates_data){
		                   	                              		dates_list = [];
			                   	                              	await dates_data.forEach(async function(val,key) {
			                   	                              		dates_list.push(val.usage_date);
			                   	                              	});
				                   	                             //console.log("dates_list");
			                                            		 //console.log(dates_list);
			                   	                              	for await (const results_val of responseBody.ResultsByTime) {
			                   	                              		await new Promise(async function(results_resolve, results_reject){
				                   	                              		if(dates_list.indexOf(results_val.TimePeriod.Start) < 0){
					                                            		 if(results_val.Groups.length > 0){
					                                            			 for await (const val of results_val.Groups) {
						                                            			 await new Promise(async function(GetCostAndUsage_resolve,GetCostAndUsage_reject){
							                                                 		let insertData = {};
							                                                 		insertData.clientid = item.clientid;
							                                                 		insertData.item_key = Dimension;
							                                                 		insertData.item_value = val.Keys[0];
							                                                 		insertData.blended_cost = val.Metrics.BlendedCost.Amount;
							                                                 		insertData.unblended_cost = val.Metrics.UnblendedCost.Amount;
							                                                 		insertData.usage_quantity = val.Metrics.UsageQuantity.Amount;
							                                                 		insertData.granularity = "DAILY";
							                                                 		insertData.usage_date = results_val.TimePeriod.Start;
							                                                 		insertData.created_date = cts;
							                                                 		
							                                                 		await dbHandler.insertIntoTable('c4_aws_budget_usage',insertData,async function(error,aws_budget_usageId){
							                                                 			if(error){
							    			                                                 console.log("insertData");
						    			                                                     console.log(insertData);
				    			                                                    	}
						                                                                //console.log("inserted the aws_budget_usage with id "+aws_budget_usageId);
						                                                                GetCostAndUsage_resolve("inserted the aws_budget_usage with id "+aws_budget_usageId);
						                                                            });
						                                            			 });
						                                             	     }
						                                            		 //console.log("inserted loop completed for "+results_val.TimePeriod.Start);
						                                            		 results_resolve("inserted loop completed for "+results_val.TimePeriod.Start);
					                                            		 }else{
						                                                 		let insertData = {};
						                                                 		insertData.clientid = item.clientid;
						                                                 		insertData.item_key = Dimension;
						                                                 		insertData.item_value = "";
						                                                 		insertData.blended_cost = results_val.Total.BlendedCost.Amount;
						                                                 		insertData.unblended_cost = results_val.Total.UnblendedCost.Amount;
						                                                 		insertData.usage_quantity = results_val.Total.UsageQuantity.Amount;
						                                                 		insertData.granularity = "DAILY";
						                                                 		insertData.usage_date = results_val.TimePeriod.Start;
						                                                 		insertData.created_date = cts;
						                                                 		
						                                                 		await dbHandler.insertIntoTable('c4_aws_budget_usage',insertData,async function(error,aws_budget_usageId){
						                                                 			if(error){
						    			                                                 console.log("insertData");
					    			                                                     console.log(insertData);
			    			                                                    	}
					                                                                //console.log("inserted the aws_budget_usage with id "+aws_budget_usageId);
					                                                            });
						                                                 		//console.log("inserted loop completed for "+results_val.TimePeriod.Start);
						                                                 		results_resolve("inserted loop completed for "+results_val.TimePeriod.Start);
					                                            		 }
				                   	                              		}else{
				                   	                              		 //console.log("data already exists for "+results_val.TimePeriod.Start);
					                                            		 results_resolve("data already exists for "+results_val.TimePeriod.Start);
				                   	                              		}
			                   	                              		});
			                   	                              	}
				                   	                             //console.log("dates resolve");
			                                            		 dates_resolve("dates resolve");
		                   	                              	});
	                   	                              	});
	                   	                              	//console.log("count resolve");
	         	                          	           	count_resolve("count resolve");
	                                            		regionItemResolve([]);
	                                            	 }
	                                             });
	                              	           }
	                              	      });
	                              	});
                                	regionItemResolve([]);
                                }
                              });
                            });
                          }
                        });
                        console.log("updated for client id "+item.clientid);
                        itemResolve("updated for client id "+item.clientid);
                      });
                  };
                  console.log("Updated Aws Services Usage");
                  callback(null,"Updated Aws Services Usage");
                  resolve("Updated Aws Services Usage");
              }else{
                  console.log("No clients available to update the Aws Services Usage");
                  callback(1,"No clients available to update the Aws Services Usage");
                  reject("No clients available to update the Aws Services Usage");
              }
          }
          catch{
              resolve(0);
          }
      });
  });
}

/*
  Author : Rajesh
  Descri: sync availability zones
  Date  : 04-06-2020
*/
let syncAwsAvailabilityZones= async (reqObj,callback)=>{
    // console.log(reqObj);
    let sql = `Select c.* from c4_clients as c 
    where c.status = 1 and c.is_aws_enabled = 1`;
    if(typeof reqObj.id != 'undefined'){
        sql += ` and c.id = ${reqObj.id} order by id desc limit 1`;
    }else{
        sql += ` order by id asc`;
    }
    // sql += ' limit 1';
    //console.log(sql);
    await new Promise(function(resolve, reject) {
        dbHandler.executeQuery(sql,async function(AwsClients){
            // console.log("AwsClients");
            // console.log(AwsClients);
            try{
                if (AwsClients.length > 0) {
                    for await (const item of AwsClients) {
                        await new Promise(async function(itemResolve, itemReject){
                          await new Promise(function(resolve,reject){
                            aws_authtoken(item.id, function(error, result){
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
                              var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
                              itemResolve(response);
                            }else{
                              let regionSql = `Select r.* from c4_aws_client_regions as r
                              where r.record_status = 1`;
                              // regionSql += ' limit 2';
                              console.log(regionSql);
                              await new Promise(async function(regionResolve, regionReject) {
                                await dbHandler.executeQuery(regionSql,async function(regionList){
                                  // console.log("regionList");
                                  // console.log(regionList);
                                  if (regionList.length > 0) {
                                    for await (const regionItem of regionList) {
                                      await new Promise(async function(regionItemResolve, regionItemReject) {
                                        let accessKey = token.tokendata.accesstoken;
                                        let secretKey = token.tokendata.secretekey;
                                        let regionName = regionItem.regionid; //'ap-southeast-2'; //regionItem.regionid;
                                        let serviceName = 'ec2';
                                        let myMethod = 'GET';
          
                                        params = {
                                          access_key : accessKey,
                                          secret_key : secretKey,
                                          region : regionName,
                                          myService : serviceName,
                                          myMethod : myMethod,
                                          myPath : '/'
                                        }
                                        params.queryParams = {"Action": "DescribeAvailabilityZones","Version":"2016-11-15"};
                                        params.url = params.myService+'.'+params.region+'.amazonaws.com';
                                        await helper.awsProcessRequest(params,async function(err, responseBody){
                                          // console.log("responseBody");
                                          //   console.log(responseBody);
                                          if(responseBody && responseBody.Response && responseBody.Response.Errors){
                                            console.log(responseBody.Response.Errors);
                                            regionItemResolve([]);
                                          }else{
                                            if (responseBody && responseBody.DescribeAvailabilityZonesResponse && 
                                              responseBody.DescribeAvailabilityZonesResponse.availabilityZoneInfo && 
                                              responseBody.DescribeAvailabilityZonesResponse.availabilityZoneInfo[0] && 
                                              responseBody.DescribeAvailabilityZonesResponse.availabilityZoneInfo[0].item &&
                                              responseBody.DescribeAvailabilityZonesResponse.availabilityZoneInfo[0].item.length > 0) {
                                              for await (const availabilityZoneData of responseBody.DescribeAvailabilityZonesResponse.availabilityZoneInfo[0].item) {
                                                  await new Promise(async function(availabilityZoneResolve, availabilityZoneReject){
                                                      let availabilityZoneSql = `SELECT * from c4_aws_availability_zones
                                                      where clientid = '${item.id}' and zoneName = '${availabilityZoneData.zoneName[0]}'
                                                      and zoneId = '${availabilityZoneData.zoneId[0]}'`;
                                                      // console.log("availabilityZoneSql");
                                                      // console.log(availabilityZoneSql);
                                                      await dbHandler.executeQuery(availabilityZoneSql,async function(availabilityZoneInfo){
                                                          // console.log("availabilityZoneInfo");
                                                          // console.log(availabilityZoneInfo);
                                                          if(availabilityZoneInfo.length > 0){
                                                              let updateData = {
                                                                zoneState : availabilityZoneData.zoneState[0],
                                                                regionName : availabilityZoneData.regionName[0],
                                                                groupName : availabilityZoneData.groupName[0],
                                                                optInStatus : availabilityZoneData.optInStatus[0],
                                                                networkBorderGroup : availabilityZoneData.networkBorderGroup[0],
                                                                messageSet : availabilityZoneData.messageSet[0],
                                                                response_obj : JSON.stringify(availabilityZoneData),
                                                                updated_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
                                                              };
                                                              // console.log("updateData");
                                                              // console.log(updateData);
                                                              await dbHandler.updateTableData('c4_aws_availability_zones',{'id':availabilityZoneInfo[0].id},updateData,function(err,result){
                                                                  console.log("updated the availabilityZoneInfo with id "+availabilityZoneInfo[0].id);
                                                                  availabilityZoneResolve("updated the availabilityZoneInfo with id "+availabilityZoneInfo[0].id);
                                                              });
                                                          }else{
                                                              let insData = {
                                                                clientid : item.id,
                                                                zoneName : availabilityZoneData.zoneName[0],
                                                                zoneId : availabilityZoneData.zoneId[0],
                                                                zoneState : availabilityZoneData.zoneState[0],
                                                                regionName : availabilityZoneData.regionName[0],
                                                                groupName : availabilityZoneData.groupName[0],
                                                                optInStatus : availabilityZoneData.optInStatus[0],
                                                                networkBorderGroup : availabilityZoneData.networkBorderGroup[0],
                                                                messageSet : availabilityZoneData.messageSet[0],
                                                                response_obj : JSON.stringify(availabilityZoneData),
                                                                created_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
                                                              };
                                                              // console.log("insData");
                                                              // console.log(insData);
                                                              await dbHandler.insertIntoTable('c4_aws_availability_zones',insData,async function(error,availabilityZoneId){
                                                                  console.log("inserted the availabilityZoneInfo with id "+availabilityZoneId);
                                                                  availabilityZoneResolve("inserted the availabilityZoneInfo with id "+availabilityZoneId);
                                                              });
                                                          }
                                                      });
                                                  });
                                              }
                                              console.log("availabilityZone data updated client id "+item.id+" and region id "+regionName);
                                              regionItemResolve("availabilityZone data updated client id "+item.id+" and region id "+regionName);
                                            }else{
                                              console.log("Failed for client id "+item.id+" and region id "+regionName);
                                              regionItemResolve("Failed for client id "+item.id+" and region id "+regionName);
                                            }
                                          }
                                        });
                                      });
                                    }
                                    console.log("availabilityZone data updated client id "+item.id);
                                    regionResolve("availabilityZone data updated client id "+item.id);
                                  }else{
                                    console.log("No data available for client id "+item.id);
                                    regionResolve("No data available for client id "+item.id);
                                  }
                                });
                              });
                            }
                          });
                          console.log("updated for client id "+item.id);
                          itemResolve("updated for client id "+item.id);
                        });
                    };
                    console.log("Updated Aws availability zones");
                    callback(null,"Updated Aws availability zones");
                    resolve("Updated Aws availability zones");
                }else{
                    console.log("No clients available to update the Aws availability zones");
                    callback(1,"No clients available to update the Aws availability zones");
                    reject("No clients available to update the Aws availability zones");
                }
            }
            catch{
                resolve(0);
            }
        });
    });
}

let getAwsAvailabilityZones = async (reqBody,callback)=>{
  var clientid=reqBody.clientid;
  if(typeof(clientid)=='undefined' || clientid==''){
    var response={status:"error",message:'Please provide clientid.',data:[]}
    return callback([],response);
  }
  
  var regionName=reqBody.regionName;
  if(typeof(regionName)=='undefined' || regionName==''){
    var response={status:"error",message:'Please provide regionName.',data:[]}
    return callback([],response);
  }

  let catalogSql = `SELECT c.* from c4_aws_availability_zones as c
   where regionName = '${regionName}' and clientid = '${clientid}' `;

  if(reqBody.status && reqBody.status != 'all'){
    catalogSql += ` and c.record_status = '${reqBody.status}' `;
  }else if(!reqBody.status){
    catalogSql += ` and c.record_status = 1 `;
  }
  catalogSql += ` order by c.regionname asc`;
  console.log("catalogSql");
  console.log(catalogSql);
  await dbHandler.executeQuery(catalogSql,async function(catalogInfo){
    return callback(null,{status:"success",message:'Aws Availability Zones List.',data:catalogInfo});
  });
}

/*
  Author : Rajesh
  Descri: get AwsListAccessToken
  Date  : 05-06-2020
*/
let syncAwsListAccessToken= async (reqObj,callback)=>{
  // console.log(reqObj);
  let sql = `Select c.* from c4_clients as c 
  where c.status = 1 and c.is_aws_enabled = 1`;
  if(typeof reqObj.id != 'undefined'){
      sql += ` and c.id = ${reqObj.id} order by id desc limit 1`;
  }else{
      sql += ` order by id asc`;
  }
  // sql += ' limit 1';
  console.log(sql);
  await new Promise(function(resolve, reject) {
      dbHandler.executeQuery(sql,async function(AwsClients){
          // console.log("AwsClients");
          // console.log(AwsClients);
          try{
              if (AwsClients.length > 0) {
                  for await (const item of AwsClients) {
                      await new Promise(async function(itemResolve, itemReject){
                        await new Promise(function(resolve,reject){
                          aws_authtoken(item.id, function(error, result){
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
                            var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
                            itemResolve(response);
                          }else{
                            await new Promise(async function(accessKeyResolve, accessKeyReject) {
                              let accessKey = token.tokendata.accesstoken;
                              let secretKey = token.tokendata.secretekey;
                              let regionName = ""; //'ap-southeast-2'; //regionItem.regionid;
                              let serviceName = 'iam';
                              let myMethod = 'GET';

                              params = {
                                access_key : accessKey,
                                secret_key : secretKey,
                                region : regionName,
                                myService : serviceName,
                                myMethod : myMethod,
                                myPath : '/'
                              }
                              params.queryParams = {
                                "Action": "ListAccessKeys",
                                "UserName" : item.aws_username,
                                "Version":"2010-05-08"
                              };
                              params.url = params.myService+'.'+((params.region != '')?(params.region+'.'):'')+'amazonaws.com';
                              await helper.awsProcessRequest(params,async function(err, responseBody){
                                // console.log("responseBody");
                                //   console.log(responseBody);
                                if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
                                  console.log(responseBody.ErrorResponse.Error);
                                  accessKeyResolve([]);
                                }else{
                                  // console.log("responseBody.ListAccessKeysResponse.ListAccessKeysResult[0].AccessKeyMetadata[0].member");
                                  // console.log(responseBody.ListAccessKeysResponse.ListAccessKeysResult[0].AccessKeyMetadata[0].member);

                                  if (responseBody && responseBody.ListAccessKeysResponse && 
                                    responseBody.ListAccessKeysResponse.ListAccessKeysResult && 
                                    responseBody.ListAccessKeysResponse.ListAccessKeysResult[0] && 
                                    responseBody.ListAccessKeysResponse.ListAccessKeysResult[0].AccessKeyMetadata &&
                                    responseBody.ListAccessKeysResponse.ListAccessKeysResult[0].AccessKeyMetadata[0] &&
                                    responseBody.ListAccessKeysResponse.ListAccessKeysResult[0].AccessKeyMetadata[0].member &&
                                    responseBody.ListAccessKeysResponse.ListAccessKeysResult[0].AccessKeyMetadata[0].member.length > 0) {
                                    for await (const clientTokensData of responseBody.ListAccessKeysResponse.ListAccessKeysResult[0].AccessKeyMetadata[0].member) {
                                        await new Promise(async function(clientTokensResolve, clientTokensReject){
                                            let clientTokensSql = `SELECT * from c4_aws_client_tokens
                                            where clientid = '${item.id}' and accesstoken = '${clientTokensData.AccessKeyId[0]}'`;
                                            // console.log("clientTokensSql");
                                            // console.log(clientTokensSql);
                                            await dbHandler.executeQuery(clientTokensSql,async function(clientTokensInfo){
                                                // console.log("clientTokensInfo");
                                                // console.log(clientTokensInfo);
                                                if(clientTokensInfo.length > 0){
                                                    let updateData = {
                                                      record_status : ((clientTokensData.Status && clientTokensData.Status[0] == 'Active')?1:0),
                                                      response_obj : JSON.stringify(clientTokensData),
                                                      updated_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
                                                    };
                                                    // console.log("updateData");
                                                    // console.log(updateData);
                                                    await dbHandler.updateTableData('c4_aws_client_tokens',{'id':clientTokensInfo[0].id},updateData,function(err,result){
                                                        console.log("updated the clientTokensInfo with id "+clientTokensInfo[0].id);
                                                        clientTokensResolve("updated the clientTokensInfo with id "+clientTokensInfo[0].id);
                                                    });
                                                }
                                            });
                                        });
                                    }
                                    console.log("clientTokens data updated client id "+item.id+" and region id "+regionName);
                                    accessKeyResolve("clientTokens data updated client id "+item.id+" and region id "+regionName);
                                  }else{
                                    console.log("Failed for client id "+item.id+" and region id "+regionName);
                                    accessKeyResolve("Failed for client id "+item.id+" and region id "+regionName);
                                  }
                                }
                              });
                            });
                          }
                        });
                        console.log("updated for client id "+item.id);
                        itemResolve("updated for client id "+item.id);
                      });
                  };
                  console.log("Updated Aws client access tokens");
                  callback(null,"Updated Aws client access tokens");
                  resolve("Updated Aws client access tokens");
              }else{
                  console.log("No clients available to update the Aws client access tokens");
                  callback(1,"No clients available to update the Aws client access tokens");
                  reject("No clients available to update the Aws client access tokens");
              }
          }
          catch{
              resolve(0);
          }
      });
  });
}

/*
  Author : Rajesh
  Descri: AwsCreateAccessToken
  Date  : 05-06-2020
*/
let AwsCreateAccessToken= async (reqObj,callback)=>{
  console.log(reqObj.body);
  if(!reqObj.body.clientid)
    callback(1,{status:"error",message:'clientid is missing'});

  let clientid = reqObj.body.clientid;
  await new Promise(async function(itemResolve, itemReject){
    await new Promise(function(resolve,reject){
      aws_authtoken(clientid, function(error, result){
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
        var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
        itemResolve(response);
        callback(1,response);
      }else{
        await new Promise(async function(accessKeyResolve, accessKeyReject) {
          let accessKey = token.tokendata.accesstoken;
          let secretKey = token.tokendata.secretekey;
          let regionName = ""; //'ap-southeast-2'; //regionItem.regionid;
          let serviceName = 'iam';
          let myMethod = 'GET';

          params = {
            access_key : accessKey,
            secret_key : secretKey,
            region : regionName,
            myService : serviceName,
            myMethod : myMethod,
            myPath : '/'
          }
          params.queryParams = {
            "Action": "CreateAccessKey",
            "UserName" : token.clientdata.aws_username,
            "Version":"2010-05-08"
          };
          params.url = params.myService+'.'+((params.region != '')?(params.region+'.'):'')+'amazonaws.com';
          await helper.awsProcessRequest(params,async function(err, responseBody){
            // console.log("responseBody");
            //   console.log(responseBody);
            if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
              console.log(responseBody.ErrorResponse.Error);
              var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
              accessKeyResolve(response);
              itemResolve(response);
              callback(1,response);
            }else{
              console.log("responseBody.CreateAccessKeyResponse.CreateAccessKeyResult[0].AccessKey");
              console.log(responseBody.CreateAccessKeyResponse.CreateAccessKeyResult[0].AccessKey);

              if (responseBody && responseBody.CreateAccessKeyResponse && 
                responseBody.CreateAccessKeyResponse.CreateAccessKeyResult && 
                responseBody.CreateAccessKeyResponse.CreateAccessKeyResult[0] && 
                responseBody.CreateAccessKeyResponse.CreateAccessKeyResult[0].AccessKey &&
                responseBody.CreateAccessKeyResponse.CreateAccessKeyResult[0].AccessKey.length > 0) {
                  clientTokensData = responseBody.CreateAccessKeyResponse.CreateAccessKeyResult[0].AccessKey[0];
                  let insData = {
                    clientid : clientid,
                    accesstoken : clientTokensData.AccessKeyId[0],
                    secretekey : clientTokensData.SecretAccessKey[0],
                    record_status : ((clientTokensData.Status && clientTokensData.Status[0] == 'Active')?1:0),
                    response_obj : JSON.stringify(clientTokensData),
                    created_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
                  };
                  console.log("insData");
                  console.log(insData);
                  await dbHandler.insertIntoTable('c4_aws_client_tokens',insData,async function(error,vmdid){
                      console.log("inserted the clientTokensInfo for clientid "+clientid);
                      var response={status:"success",message:"inserted the clientTokensInfo for clientid "+clientid}
                      accessKeyResolve(response);
                      itemResolve(response);
                      callback(1,response);
                  });
              }else{
                console.log("Failed for client id "+clientid);
                var response={status:"error",message:"Failed for client id "+clientid}
                accessKeyResolve(response);
                itemResolve(response);
                callback(1,response);
              }
            }
          });
        });
      }
    });
  });
}

/*
  Author : Rajesh
  Descri: AwsUpdateAccessToken
  Date  : 05-06-2020
*/
let AwsUpdateAccessToken= async (reqObj,callback)=>{
  console.log(reqObj.body);
  if(!reqObj.body.clientid)
    callback(1,{status:"error",message:'clientid is missing'});
  if(!reqObj.body.access_token)
    callback(1,{status:"error",message:'access_token is missing'});
  if(!reqObj.body.Status)
    callback(1,{status:"error",message:'Status is missing'});

  let clientid = reqObj.body.clientid;
  let sql = `Select c.* from c4_clients as c 
    where c.status = 1 and c.is_aws_enabled = 1`;
  sql += ` and c.id = ${clientid} order by id desc limit 1`;
  // sql += ' limit 1';
  console.log(sql);
  await new Promise(function(resolve, reject) {
    dbHandler.executeQuery(sql,async function(AwsClients){
      if(AwsClients.length == 0){
        var response={status:"error",message:'Invalid request.'}
        callback(1,response);
      }else{
        await new Promise(async function(itemResolve, itemReject){
          await new Promise(function(resolve,reject){
            aws_authtoken(clientid, function(error, result){
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
              var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
              itemResolve(response);
              callback(1,response);
            }else{
              await new Promise(async function(accessKeyResolve, accessKeyReject) {
                let accessKey = token.tokendata.accesstoken;
                let secretKey = token.tokendata.secretekey;
                let regionName = ""; //'ap-southeast-2'; //regionItem.regionid;
                let serviceName = 'iam';
                let myMethod = 'GET';
      
                params = {
                  access_key : accessKey,
                  secret_key : secretKey,
                  region : regionName,
                  myService : serviceName,
                  myMethod : myMethod,
                  myPath : '/'
                }
                params.queryParams = {
                  "AccessKeyId" : reqObj.body.access_token,
                  "Action": "UpdateAccessKey",
                  "Status" : reqObj.body.Status,
                  "UserName" : token.clientdata.aws_username,
                  "Version":"2010-05-08"
                };
                params.url = params.myService+'.'+((params.region != '')?(params.region+'.'):'')+'amazonaws.com';
                await helper.awsProcessRequest(params,async function(err, responseBody){
                  // console.log("responseBody");
                  //   console.log(responseBody);
                  if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
                    console.log(responseBody.ErrorResponse.Error);
                    var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
                    accessKeyResolve(response);
                    itemResolve(response);
                    callback(1,response);
                  }else{
                    console.log("responseBody.UpdateAccessKeyResponse.ResponseMetadata[0].RequestId");
                    console.log(responseBody.UpdateAccessKeyResponse.ResponseMetadata[0].RequestId);
      
                    if (responseBody && responseBody.UpdateAccessKeyResponse && 
                      responseBody.UpdateAccessKeyResponse.ResponseMetadata && 
                      responseBody.UpdateAccessKeyResponse.ResponseMetadata[0] && 
                      responseBody.UpdateAccessKeyResponse.ResponseMetadata[0].RequestId.length > 0) {
                        let updateData = {
                          record_status : ((reqObj.body.Status == 'Active')?1:0),
                          created_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
                        };
                        console.log("updateData");
                        console.log(updateData);
                        await dbHandler.updateTableData('c4_aws_client_tokens',{'clientid':clientid,'accesstoken':reqObj.body.access_token},updateData,function(err,result){
                          var response={status:"success",message:"Updated the clientTokensInfo"}
                          console.log(response);
                          accessKeyResolve(response);
                          itemResolve(response);
                          callback(1,response);
                        });
                    }else{
                      var response={status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"}
                      console.log(response);
                      accessKeyResolve(response);
                      itemResolve(response);
                      callback(1,response);
                    }
                  }
                });
              });
            }
          });
        });
      }
    });
  });
}

/*
  Author : Rajesh
  Descri: AwsDeleteAccessToken
  Date  : 08-06-2020
*/
let AwsDeleteAccessToken= async (reqObj,callback)=>{
  console.log(reqObj.body);
  if(!reqObj.body.clientid){
    callback(1,{status:"error",message:'clientid is missing'});
  }
  if(!reqObj.body.access_token){
    callback(1,{status:"error",message:'access_token is missing'});
  }

  let clientid = reqObj.body.clientid;
  let sql = `Select c.* from c4_clients as c 
    where c.status = 1 and c.is_aws_enabled = 1`;
  sql += ` and c.id = ${clientid} order by id desc limit 1`;
  // sql += ' limit 1';
  console.log(sql);
  await new Promise(function(resolve, reject) {
    dbHandler.executeQuery(sql,async function(AwsClients){
      if(AwsClients.length == 0){
        var response={status:"error",message:'Invalid request.'}
        callback(1,response);
      }else{
        await new Promise(async function(itemResolve, itemReject){
          await new Promise(function(resolve,reject){
            aws_authtoken(clientid, function(error, result){
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
              var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
              itemResolve(response);
              callback(1,response);
            }else{
              await new Promise(async function(accessKeyResolve, accessKeyReject) {
                let accessKey = token.tokendata.accesstoken;
                let secretKey = token.tokendata.secretekey;
                let regionName = ""; //'ap-southeast-2'; //regionItem.regionid;
                let serviceName = 'iam';
                let myMethod = 'GET';
      
                params = {
                  access_key : accessKey,
                  secret_key : secretKey,
                  region : regionName,
                  myService : serviceName,
                  myMethod : myMethod,
                  myPath : '/'
                }
                params.queryParams = {
                  "AccessKeyId" : reqObj.body.access_token,
                  "Action": "DeleteAccessKey",
                  "UserName" : token.clientdata.aws_username,
                  "Version":"2010-05-08"
                };
                params.url = params.myService+'.'+((params.region != '')?(params.region+'.'):'')+'amazonaws.com';
                await helper.awsProcessRequest(params,async function(err, responseBody){
                  // console.log("responseBody");
                  //   console.log(responseBody);
                  if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
                    console.log(responseBody.ErrorResponse.Error);
                    var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
                    accessKeyResolve(response);
                    itemResolve(response);
                    callback(1,response);
                  }else{
                    console.log("responseBody.DeleteAccessKeyResponse.ResponseMetadata[0].RequestId");
                    console.log(responseBody.DeleteAccessKeyResponse.ResponseMetadata[0].RequestId);
      
                    if (responseBody && responseBody.DeleteAccessKeyResponse && 
                      responseBody.DeleteAccessKeyResponse.ResponseMetadata && 
                      responseBody.DeleteAccessKeyResponse.ResponseMetadata[0] && 
                      responseBody.DeleteAccessKeyResponse.ResponseMetadata[0].RequestId.length > 0) {
                        let updateData = {
                          record_status : 0,
                          created_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
                        };
                        console.log("updateData");
                        console.log(updateData);
                        await dbHandler.updateTableData('c4_aws_client_tokens',{'clientid':clientid,'accesstoken':reqObj.body.access_token},updateData,function(err,result){
                          var response={status:"success",message:"Deleted the clientTokensInfo"}
                          console.log(response);
                          accessKeyResolve(response);
                          itemResolve(response);
                          callback(1,response);
                        });
                    }else{
                      var response={status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"}
                      console.log(response);
                      accessKeyResolve(response);
                      itemResolve(response);
                      callback(1,response);
                    }
                  }
                });
              });
            }
          });
        });
      }
    });
  });
}  

/*
  Author : Rajesh
  Descri: getAwsAccessTokenLastUse
  Date  : 08-06-2020
*/
let getAwsAccessTokenLastUse= async (reqObj,callback)=>{
  console.log(reqObj.body);
  if(!reqObj.body.clientid){
    callback(1,{status:"error",message:'clientid is missing'});
  }
  if(!reqObj.body.access_token){
    callback(1,{status:"error",message:'access_token is missing'});
  }

  let clientid = reqObj.body.clientid;
  let sql = `Select c.* from c4_clients as c 
    where c.status = 1 and c.is_aws_enabled = 1`;
  sql += ` and c.id = ${clientid} order by id desc limit 1`;
  // sql += ' limit 1';
  console.log(sql);
  await new Promise(function(resolve, reject) {
    dbHandler.executeQuery(sql,async function(AwsClients){
      if(AwsClients.length == 0){
        var response={status:"error",message:'Invalid request.'}
        callback(1,response);
      }else{
        await new Promise(async function(itemResolve, itemReject){
          await new Promise(function(resolve,reject){
            aws_authtoken(clientid, function(error, result){
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
              var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
              itemResolve(response);
              callback(1,response);
            }else{
              await new Promise(async function(accessKeyResolve, accessKeyReject) {
                let accessKey = token.tokendata.accesstoken;
                let secretKey = token.tokendata.secretekey;
                let regionName = ""; //'ap-southeast-2'; //regionItem.regionid;
                let serviceName = 'iam';
                let myMethod = 'GET';
      
                params = {
                  access_key : accessKey,
                  secret_key : secretKey,
                  region : regionName,
                  myService : serviceName,
                  myMethod : myMethod,
                  myPath : '/'
                }
                params.queryParams = {
                  "AccessKeyId" : reqObj.body.access_token,
                  "Action": "GetAccessKeyLastUsed",
                  "Version":"2010-05-08"
                };
                params.url = params.myService+'.'+((params.region != '')?(params.region+'.'):'')+'amazonaws.com';
                await helper.awsProcessRequest(params,async function(err, responseBody){
                  // console.log("responseBody");
                  //   console.log(responseBody);
                  if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
                    console.log(responseBody.ErrorResponse.Error);
                    var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
                    accessKeyResolve(response);
                    itemResolve(response);
                    callback(1,response);
                  }else{
                    // console.log("responseBody.GetAccessKeyLastUsedResponse.GetAccessKeyLastUsedResult[0].AccessKeyLastUsed[0]");
                    // console.log(responseBody.GetAccessKeyLastUsedResponse.GetAccessKeyLastUsedResult[0].AccessKeyLastUsed[0]);
      
                    if (responseBody && responseBody.GetAccessKeyLastUsedResponse && 
                      responseBody.GetAccessKeyLastUsedResponse.GetAccessKeyLastUsedResult && 
                      responseBody.GetAccessKeyLastUsedResponse.GetAccessKeyLastUsedResult[0] && 
                      responseBody.GetAccessKeyLastUsedResponse.GetAccessKeyLastUsedResult[0].AccessKeyLastUsed.length > 0) {
                        resData = responseBody.GetAccessKeyLastUsedResponse.GetAccessKeyLastUsedResult[0].AccessKeyLastUsed[0]
                        // console.log("resData");
                        // console.log(resData);
                        var response={status:"success",message:"LastUsedDate for given token",data : {LastUsedDate : resData.LastUsedDate}}
                        console.log(response);
                        accessKeyResolve(response);
                        itemResolve(response);
                        callback(1,response);
                    }else{
                      var response={status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"}
                      console.log(response);
                      accessKeyResolve(response);
                      itemResolve(response);
                      callback(1,response);
                    }
                  }
                });
              });
            }
          });
        });
      }
    });
  });
}  

/*
  Author : Pradeep
  Descri: get images list
  Date  : 05-06-2020
*/
let syncAwsImages= (reqObj,callback)=>{
  // console.log(reqObj);
  let sql = `Select c.* from c4_clients as c 
  where c.status = 1 and c.is_aws_enabled = 1`;
  if(typeof reqObj.id != 'undefined'){
      sql += ` and c.id = ${reqObj.id} order by id desc limit 1`;
  }else{
      sql += ` order by id asc limit 1`;
  }
  // sql += ' limit 1';
  //console.log(sql);
  new Promise(function(resolve, reject) {
      dbHandler.executeQuery(sql,async function(AwsClients){
          // console.log("AwsClients");
          //console.log(AwsClients);
          try{
              if (AwsClients.length > 0) {
                  for await (const item of AwsClients) {
                      await new Promise(async function(itemResolve, itemReject){
                        await new Promise(function(resolve,reject){
                          aws_authtoken(item.id, function(error, result){
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
                            var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
                            itemResolve(response);
                          }else{
                            let regionSql = `Select r.* from c4_aws_client_regions as r
                            where r.record_status = 1`;
                            // regionSql += ' limit 1';
                            //console.log(regionSql);
                            await new Promise(async function(regionResolve, regionReject) {
                              await dbHandler.executeQuery(regionSql,async function(regionList){
                                // console.log("regionList");
                                // console.log(regionList);
                                if (regionList.length > 0) {
                                  for await (const regionItem of regionList) {
                                    await new Promise(async function(regionItemResolve, regionItemReject) {
                                      let accessKey = token.tokendata.accesstoken;
                                      let secretKey = token.tokendata.secretekey;
                                      let regionName = regionItem.regionid; //'ap-southeast-2'; //regionItem.regionid;
                                      let serviceName = 'ec2';
                                      let myMethod = 'GET';
        
                                      params = {
                                        access_key : accessKey,
                                        secret_key : secretKey,
                                        region : regionName,
                                        myService : serviceName,
                                        myMethod : myMethod,
                                        myPath : '/'
                                      }
                                     //https://ec2.{{region}}.amazonaws.com/?Action=DescribeImages&Version=2016-11-15&Owner.1=
                                     //amazon&Filter.1.Name=is-public&Filter.1.Value.1=true&Filter.2.Name=architecture&Filter.2.Value.1
                                     //=x86_64
                                      params.queryParams = {
                                        "Action": "DescribeImages",
                                        "Owner.1":"amazon",
                                        "Filter.1.Name":"is-public",
                                        "Filter.1.Value.1":"true",
                                        "Filter.2.Name":"architecture",
                                        "Filter.2.Value.1":"x86_64",
                                        "Version":"2016-11-15"
                                      };
                                      params.url = params.myService+'.'+params.region+'.amazonaws.com';
                                      //console.log(params);
                                      await helper.awsProcessRequest(params,async function(err, responseBody){
                                        // console.log("responseBody");
                                        //console.log(responseBody);
                                        if(responseBody && responseBody.Response && responseBody.Response.Errors){
                                          console.log(responseBody.Response.Errors);
                                          regionItemResolve([]);
                                        }else{
                                          // callback(1,responseBody.DescribeImagesResponse);
                                          // return 1;
                                          if (responseBody && responseBody.DescribeImagesResponse && 
                                            responseBody.DescribeImagesResponse.imagesSet[0] && 
                                            responseBody.DescribeImagesResponse.imagesSet[0].item &&
                                            responseBody.DescribeImagesResponse.imagesSet[0].item.length > 0) {
                                            for await (const imageData of responseBody.DescribeImagesResponse.imagesSet[0].item) {
                                                await new Promise(async function(imageResolve, imageReject){
                                                    let sql1 = `SELECT * from aws_images
                                                    where imageId = '${imageData.imageId[0]}'`;
                                                    // console.log("availabilityZoneSql");
                                                    // console.log(availabilityZoneSql);
                                                    await dbHandler.executeQuery(sql1,async function(imageInfo){
                                                        // console.log("availabilityZoneInfo");
                                                        // console.log(availabilityZoneInfo);
                                                        if(imageInfo.length > 0){
                                                            let updateData = {
                                                              regionName : regionName,
                                                              name : ((imageData.name)?imageData.name[0]:""),
                                                              description : ((imageData.description)?imageData.description[0]:""),
                                                              platform : ((imageData.platform)?imageData.platform[0]:""),
                                                              imageLocation : imageData.imageLocation[0],
                                                              imageState : imageData.imageState[0],
                                                              imageType : imageData.imageType[0],
                                                              isPublic : imageData.isPublic[0],
                                                              architecture : imageData.architecture[0],
                                                              enaSupport:((imageData.enaSupport)?imageData.enaSupport[0]:""),
                                                              creationDate : dateFormat(imageData.creationDate[0],"yyyy-mm-dd HH:MM:ss"),
                                                              //response_obj : JSON.stringify(imageData),
                                                            };
                                                            // console.log("updateData");
                                                            console.log(updateData);
                                                            await dbHandler.updateTableData('aws_images',{'id':imageInfo[0].id},updateData,function(err,result){
                                                                console.log("updated the image dara with id "+imageInfo[0].id);
                                                                imageResolve("updated the image dara with id "+imageInfo[0].id);
                                                            });
                                                        }else{
                                                            let insData = {
                                                              clientid : 1,
                                                              regionName : regionName,
                                                              imageId:imageData.imageId[0],
                                                              name : ((imageData.name)?imageData.name[0]:""),
                                                              description : ((imageData.description)?imageData.description[0]:""),
                                                              platform : ((imageData.platform)?imageData.platform[0]:""),
                                                              imageLocation : imageData.imageLocation[0],
                                                              imageState : imageData.imageState[0],
                                                              imageType : imageData.imageType[0],
                                                              isPublic : imageData.isPublic[0],
                                                              architecture : imageData.architecture[0],
                                                              enaSupport:((imageData.enaSupport)?imageData.enaSupport[0]:""),
                                                              creationDate : dateFormat(imageData.creationDate[0],"yyyy-mm-dd HH:MM:ss"),
                                                              //response_obj : JSON.stringify(imageData),
                                                            };
                                                            // console.log("insData");
                                                            //console.log(insData);
                                                            await dbHandler.insertIntoTable('aws_images',insData,async function(error,imageId){
                                                                console.log("inserted the image data with id "+imageId);
                                                                imageResolve("inserted the image data with id "+imageId);
                                                            });
                                                        }
                                                    });
                                                });
                                            }
                                            console.log("image data updated client id "+item.id+" and region id "+regionName);
                                            regionItemResolve("image data updated client id "+item.id+" and region id "+regionName);
                                          }else{
                                            console.log("Failed for client id "+item.id+" and region id "+regionName);
                                            regionItemResolve("Failed for client id "+item.id+" and region id "+regionName);
                                          }
                                        }
                                      });
                                    });
                                  }
                                  console.log("image data updated client id "+item.id);
                                  regionResolve("image data updated client id "+item.id);
                                }else{
                                  console.log("No data available for client id "+item.id);
                                  regionResolve("No data available for client id "+item.id);
                                }
                              });
                            });
                          }
                        });
                        console.log("updated for client id "+item.id);
                        itemResolve("updated for client id "+item.id);
                      });
                  };
                  console.log("Updated Aws images");
                  callback(null,"Updated Aws images");
                  resolve("Updated Aws images");
              }else{
                  console.log("No clients available to update the Aws images");
                  callback(1,"No clients available to update the Aws images");
                  reject("No clients available to update the Aws images");
              }
          }
          catch{
              resolve(0);
          }
      });
  });
}

let getAwsRegions = async (reqBody,callback)=>{

  var clientId=reqBody.clientid;
  if(typeof(clientId)=='undefined' || clientId==''){
    var response={status:"error",message:'Please provide clientid.'}
    return callback([],response);
  }

  let catalogSql = `SELECT c.* from c4_aws_client_regions as c  `;

  if(reqBody.status && reqBody.status != 'all'){
    catalogSql += ` where c.record_status = '${reqBody.status}' `;
  }else if(!reqBody.status){
    catalogSql += ` where c.record_status = 1 `;
  }
  catalogSql += ` order by c.regionname asc`;
  console.log("catalogSql");
  console.log(catalogSql);
  await dbHandler.executeQuery(catalogSql,async function(catalogInfo){
    return callback(null,{status:"success",message:'Aws Regions List.',data:catalogInfo});
  });
}

let getAwsImages = async (reqBody,callback)=>{

  var clientid=reqBody.clientid;

  if(typeof(clientid)=='undefined' || clientid==''){
    var response={status:"error",message:'Please provide clientid.'}
    return callback([],response);
  }
  
  var currency_id=reqBody.currency_id;

  if(typeof(currency_id)=='undefined' || currency_id==''){
    var response={status:"error",message:'Please provide currency_id.'}
    return callback([],response);
  }

  //let catalogSql = `SELECT c.*, ocp.price from aws_images as c where c.clientid = '${clientid}' `;
  let catalogSql = `SELECT c.*, ocp.price from aws_images as c
  inner join c4_othercloud_prices as ocp on (ocp.ref_id = c.id and ocp.ref_type = 'OS' and ocp.cloud_type = 'AWS' and ocp.currency_id = '${currency_id}' and ocp.record_status = 1)
   where 1 `;

  if(reqBody.regionName){
    catalogSql += ` and c.regionName = '${reqBody.regionName}' `;
  }

  if(reqBody.status && reqBody.status != 'all'){
    catalogSql += ` and c.status = '${reqBody.status}' `;
  }else if(!reqBody.status){
    catalogSql += ` and c.status = 1 `;
  }
  catalogSql += ` order by c.name asc`;
  console.log("catalogSql");
  console.log(catalogSql);
  await dbHandler.executeQuery(catalogSql,async function(catalogInfo){
    return callback(null,{status:"success",message:'Aws Images List.',data:catalogInfo});
  });
}

/*
  Author : Pradeep
  Descri: get vm list
  Date  : 08-06-2020
*/
let syncAwsVms= (reqObj,callback)=>{
  // console.log(reqObj);
  let sql = `Select c.* from c4_clients as c 
  where c.status = 1 and c.is_aws_enabled = 1`;
  if(typeof reqObj.id != 'undefined'){
      sql += ` and c.id = ${reqObj.id} order by id desc limit 1`;
  }else{
      sql += ` order by id desc`;
  }
  // sql += ' limit 1';
  console.log(sql);
  new Promise(function(resolve, reject) {
      dbHandler.executeQuery(sql,async function(AwsClients){
           console.log("AwsClients");
          console.log(AwsClients);
          try{
              if (AwsClients.length > 0) {
                  for await (const item of AwsClients) {
                      await new Promise(async function(itemResolve, itemReject){
                        await new Promise(function(resolve,reject){
                          aws_authtoken(item.id, function(error, result){
                            // console.log("result");
                            // console.log(result);
                            // if(error){
                            //     resolve([])
                            // }else{
                                resolve(result)
                            // }
                          })
                        }).then(async function(token){
                           console.log("token");
                           console.log(token);
                          if(token.tokendata.length == 0){
                            var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
                            itemResolve(response);
                          }else{
                            let regionSql = `Select r.* from c4_aws_client_regions as r
                            where r.record_status = 1`;
                            // regionSql += ' limit 1';
                            //console.log(regionSql);
                            await new Promise(async function(regionResolve, regionReject) {
                              await dbHandler.executeQuery(regionSql,async function(regionList){
                                 console.log("regionList");
                                 console.log(regionList);
                                if (regionList.length > 0) {
                                  for await (const regionItem of regionList) {
                                    await new Promise(async function(regionItemResolve, regionItemReject) {
                                      let accessKey = token.tokendata.accesstoken;
                                      let secretKey = token.tokendata.secretekey;
                                      let regionName =  regionItem.regionid; //regionItem.regionid;//'ap-southeast-2'; //
                                      let serviceName = 'ec2';
                                      let myMethod = 'GET';
                                      params = {
                                        access_key : accessKey,
                                        secret_key : secretKey,
                                        region : regionName,
                                        myService : serviceName,
                                        myMethod : myMethod,
                                        myPath : '/'
                                      }
                                      params.queryParams = {
                                        "Action": "DescribeInstances",
                                        "Version":"2016-11-15"
                                      };
                                      params.url = params.myService+'.'+params.region+'.amazonaws.com';
                                      console.log(params);
                                      await helper.awsProcessRequest(params,async function(err, responseBody){
                                        console.log("responseBody");
                                        console.log(responseBody);
                                        console.log(JSON.stringify(responseBody));
                                        //return callback(null,responseBody)
                                        if(responseBody && responseBody.Response && responseBody.Response.Errors){
                                          if(responseBody.Response.Errors[0] && responseBody.Response.Errors[0].Error){
                                            console.log("responseBody.Response.Errors[0].Error");
                                            console.log(responseBody.Response.Errors[0].Error);
                                          }else{
                                            console.log("responseBody.Response.Errors");
                                            console.log(responseBody.Response.Errors);
                                          }
                                          regionItemResolve([]);
                                        }else{
                                          //return callback(null,responseBody)
                                          // callback(1,responseBody.DescribeInstancesResponse.reservationSet[0].item[0].instancesSet[0].item);
                                          // return 1;
                                          if (responseBody && responseBody.DescribeInstancesResponse && 
                                            responseBody.DescribeInstancesResponse.reservationSet[0] && 
                                            responseBody.DescribeInstancesResponse.reservationSet[0].item[0] &&
                                            responseBody.DescribeInstancesResponse.reservationSet[0].item[0].instancesSet &&
                                            responseBody.DescribeInstancesResponse.reservationSet[0].item[0].instancesSet[0] &&
                                            responseBody.DescribeInstancesResponse.reservationSet[0].item[0].instancesSet[0].item &&
                                            responseBody.DescribeInstancesResponse.reservationSet[0].item[0].instancesSet[0].item.length > 0) {
                                             console.log(responseBody.DescribeInstancesResponse.reservationSet[0].item[0].instancesSet[0].item); 
                                            for await (const vmArr of responseBody.DescribeInstancesResponse.reservationSet[0].item) {
                                              console.log(vmArr)
                                              var vmData=vmArr.instancesSet[0].item[0]
                                                await new Promise(async function(imageResolve, imageReject){
                                                    let sql1 = `SELECT * from aws_vms
                                                    where clientid = '${item.id}' and instanceId = '${vmData.instanceId[0]}'`;
                                                    let sql2 = `SELECT * from c4_aws_intancetypes
                                                    where regionName='${regionName}' and instanceType = '${vmData.instanceType[0]}'`;
                                                    var instanceType=await new Promise(async function(resolve1, reject1){
                                                      dbHandler.executeQuery(sql2,async function(result){
                                                        resolve1(result[0])
                                                      })
                                                    })
                                                    if(!instanceType){
                                                      instanceType={memoryInMB:0,totalSizeInGB:0}
                                                    }
                                                    var diskdata=await new Promise(async function(resolve5,reject5){
                                                      var diskList=[];
                                                        for await(var diskdetail of vmData.blockDeviceMapping[0].item)
                                                        {
                                                          var info=diskdetail.ebs[0]
                                                          var disk=await new Promise(function(resolve1,reject1){
                                                            params.queryParams = {
                                                                "Action": 'DescribeVolumes',
                                                                "Filter.1.Name":"volume-id",
                                                                "Filter.1.Value.1":info.volumeId[0],
                                                                "Version":"2016-11-15"
                                                            };
                                                            params.url = params.myService+'.'+params.region+'.amazonaws.com';
                                                            helper.awsProcessRequest(params,async function(err, responseBody){
                                                            	console.log("responseBody");
                                                                console.log(responseBody);
                                                                console.log(JSON.stringify(responseBody));
                                                                if(responseBody && responseBody.Response && responseBody.Response.Errors){
                                                                    resolve1(0)
                                                                }else{
                                                                  if(responseBody.DescribeVolumesResponse && responseBody.DescribeVolumesResponse.volumeSet[0].item[0] && typeof responseBody.DescribeVolumesResponse.volumeSet[0].item[0].size !='undefined')
                                                                  resolve1(responseBody.DescribeVolumesResponse.volumeSet[0].item[0].size[0])
                                                                  else
                                                                  resolve1(0)
                                                                }
                                                            })
                                                          })
                                                          await diskList.push(disk);
                                                        }
                                                        resolve5(diskList)
                                                    });
                                                    console.log("diskdata");
                                                    console.log(diskdata);
                                                    var totalSizeInGB = await diskdata.reduce(function(a, b){
                                                      return parseInt(a) + parseInt(b);
                                                    }, 0);
                                                    console.log(totalSizeInGB)
                                                    //return callback(1,totalSizeInGB);
                                                    await dbHandler.executeQuery(sql1,async function(vmInfo){
                                                    	console.log("vmInfo");
                                                        console.log(vmInfo);
                                                        console.log("vmData");
                                                        console.log(vmData);
                                                      //console.log(vm_name)
                                                      try{
                                                        if(vmInfo.length > 0){
                                                        	 if(vmData.tagSet && vmData.tagSet[0].item){
                                                                 var vm_name=(vmData.tagSet[0].item[0].key[0]=='labelname')?vmData.tagSet[0].item[0].value[0]:vmData.tagSet[0].item[0].key[0];
                                                        	 }else if(vmData.keyName && vmData.keyName[0]){
                                                        		 var vm_name=vmData.keyName[0];
                                                        	 }else{
                                                        		 var vm_name = vmData.instanceId[0];
                                                        	 }
                                                            let vm_updateData = {
                                                              regionName : regionName,
                                                              vm_name : vm_name,
                                                              instanceId : vmData.instanceId[0],
                                                              imageId : vmData.imageId[0],
                                                              availabilityZone : vmData.placement[0].availabilityZone[0],
                                                              instanceType : vmData.instanceType[0],
                                                              monitoring : vmData.monitoring[0].state[0],
                                                              public_ip : ((vmData.ipAddress && vmData.ipAddress[0])?vmData.ipAddress[0]:""),
                                                              private_ip : ((vmData.privateIpAddress && vmData.privateIpAddress[0])?vmData.privateIpAddress[0]:""),
                                                              vm_status : vmData.instanceState[0].name[0],
                                                              cpu_cores : vmData.cpuOptions[0].coreCount[0],
                                                              memory_mb : instanceType.memoryInMB,
                                                              disk_size : totalSizeInGB,//instanceType.totalSizeInGB,
                                                              creationDate : dateFormat(vmData.launchTime[0],"yyyy-mm-dd HH:MM:ss"),
                                                              //response_obj : JSON.stringify(vmData),
                                                            };
                                                            console.log("vm_updateData");
                                                            console.log(vm_updateData);
                                                            await dbHandler.updateTableData('aws_vms',{'id':vmInfo[0].id},vm_updateData,function(err,result){
                                                              vmUpdate={
                                                                host_name: vm_updateData.vm_name,
                                                                label_name: vm_updateData.vm_name,
                                                                ref_id: vm_updateData.instanceId,
                                                                ram_units_gb: (vm_updateData.memory_mb / 1024),
                                                                cpu_units: vm_updateData.cpu_cores,
                                                                disk_units_gb: vm_updateData.disk_size,
                                                                multiple_ip: JSON.stringify({"ip_address":vm_updateData.private_ip}),
                                                                primary_ip: vm_updateData.public_ip,
                                                                username: "",
                                                                power_status: (vm_updateData.vm_status == 'running')?"poweredOn":'poweredOff',
                                                                vm_status: vm_updateData.vm_status.charAt(0).toUpperCase() + vm_updateData.vm_status.slice(1),
                                                                vdc_id : config.AWS.vdc_id,
                                                                tech_id : config.AWS.tech_id,
                                                                updateddate : new Date().getTime() / 1000
                                                              }
                                                              console.log(vmUpdate);
                                                              dbHandler.updateTableData('c4_vm_details',{id:vmInfo[0].vm_detail_id},vmUpdate,function(err,result){
                                                                console.log("updated the vms dara with id "+vmInfo[0].id);
                                                                imageResolve("updated the vms dara with id "+vmInfo[0].id);
                                                              })  
                                                            });
                                                        }else{
                                                        	if(vmData.tagSet && vmData.tagSet[0].item){
                                                                var vm_name=(vmData.tagSet[0].item[0].key[0]=='labelname')?vmData.tagSet[0].item[0].value[0]:vmData.tagSet[0].item[0].key[0];
	                                                       	 }else if(vmData.keyName && vmData.keyName[0]){
	                                                       		 var vm_name=vmData.keyName[0];
	                                                       	 }else{
	                                                       		 var vm_name = vmData.instanceId[0];
	                                                       	 }
                                                            let vm_insertdata = {
                                                              clientid : item.id,
                                                              regionName : regionName,
                                                              vm_name : vm_name,
                                                              instanceId : vmData.instanceId[0],
                                                              imageId : vmData.imageId[0],
                                                              availabilityZone : vmData.placement[0].availabilityZone[0],
                                                              instanceType : vmData.instanceType[0],
                                                              monitoring : vmData.monitoring[0].state[0],
                                                              public_ip : ((vmData.ipAddress && vmData.ipAddress[0])?vmData.ipAddress[0]:""),
                                                              private_ip : ((vmData.privateIpAddress && vmData.privateIpAddress[0])?vmData.privateIpAddress[0]:""),
                                                              vm_status : vmData.instanceState[0].name[0],
                                                              cpu_cores : vmData.cpuOptions[0].coreCount[0],
                                                              memory_mb : instanceType.memoryInMB,
                                                              disk_size : totalSizeInGB,//instanceType.totalSizeInGB,
                                                              creationDate : dateFormat(vmData.launchTime[0],"yyyy-mm-dd HH:MM:ss"),
                                                              //response_obj : JSON.stringify(vmData),
                                                            };
                                                            console.log("vm_insertdata");
                                                            console.log(vm_insertdata);
                                                            await dbHandler.insertIntoTable('aws_vms',vm_insertdata,async function(error,aws_vm_id){
                                                              if(err){
                                                                imageResolve([]);
                                                              }else{
                                                                var vc_sql=`select c.* from c4_vm_creation as c
                                                                where c.host_name='${vm_name}' and c.label_name='${vm_name}' 
                                                                and c.cloudid='${config.AWS.cloudid}' and c.clientid='${token.clientdata.id}' and c.order_details_id <> 0`
                                                                
                                                               await dbHandler.executeQuery(vc_sql,async function(vm_creation_result){
                                                                // await dbHandler.getOneRecord('c4_vm_creation',whereQry,async function(vm_creation_result){
                                                                  console.log("c4_vm_creation result");
                                                                  //console.log(vm_creation_result);
                                                                  if(vm_creation_result.length > 0){
                                                                    orderDetailsId = vm_creation_result[0].order_details_id;
                                                                    console.log("orderDetailsId");
                                                                    console.log(orderDetailsId);

                                                                    vm_details_insertdata={
                                                                      cloudid : vm_creation_result[0].cloudid,
                                                                      order_details_id : orderDetailsId,
                                                                      clientid : token.clientdata.id,
                                                                      host_name: vm_insertdata.vm_name,
                                                                      label_name: vm_insertdata.vm_name,
                                                                      ref_id: vm_insertdata.instanceId,
                                                                      ram_units_gb: (vm_insertdata.memory_mb / 1024),
                                                                      cpu_units: vm_insertdata.cpu_cores,
                                                                      disk_units_gb: vm_insertdata.disk_size,
                                                                      multiple_ip: JSON.stringify({"ip_address":vm_insertdata.private_ip}),
                                                                      primary_ip: vm_insertdata.public_ip,
                                                                      username: "",
                                                                      os_id : vm_creation_result[0].osid,
                                                                      power_status: (vm_insertdata.vm_status == 'running')?"poweredOn":'poweredOff',
                                                                      vm_status: vm_insertdata.vm_status.charAt(0).toUpperCase() + vm_insertdata.vm_status.slice(1),
                                                                      vdc_id : config.AWS.vdc_id,
                                                                      tech_id : config.AWS.tech_id,
                                                                      createddate : new Date().getTime() / 1000
                                                                    }
                                                                    await dbHandler.insertIntoTable('c4_vm_details',vm_details_insertdata,async function(err,vmDetailsId){
                                                                      if(err){
                                                                        imageResolve([]);
                                                                      }else{
                                                                        await dbHandler.updateTableData('c4_order_details',{id:orderDetailsId},{'status':'1',vmid:vmDetailsId,'updateddate':(new Date().getTime() / 1000)},function(err,result){ });
                                                                        await dbHandler.updateTableData('aws_vms',{id:aws_vm_id},{vm_detail_id:vmDetailsId},function(err,result){ });
                                                                        console.log("aws_vm_id");
                                                                        console.log("inserted the vms data with id "+aws_vm_id);
                                                                        imageResolve("inserted the vms data with id "+aws_vm_id);
                                                                      }
                                                                    })
                                                                  }else{
                                                                    vm_details_insertdata={
                                                                      host_name: vm_insertdata.vm_name,
                                                                      label_name: vm_insertdata.vm_name,
                                                                      ref_id: vm_insertdata.instanceId,
                                                                      ram_units_gb: (vm_insertdata.memory_mb / 1024),
                                                                      cpu_units: vm_insertdata.cpu_cores,
                                                                      disk_units_gb: vm_insertdata.disk_size,
                                                                      private_ip: vm_insertdata.private_ip,
                                                                      public_ip: vm_insertdata.public_ip,
                                                                      username: "",
                                                                      power_status: (vm_insertdata.vm_status == 'running')?"poweredOn":'poweredOff',
                                                                      vm_status: vm_insertdata.vm_status.charAt(0).toUpperCase() + vm_insertdata.vm_status.slice(1),
                                                                      vdc_id : config.AWS.vdc_id,
                                                                      tech_id : config.AWS.tech_id
                                                                    }
                                                                    vm_details_insertdata.order_type = config.AWS.cloud_name;
                                                                    vm_details_insertdata.cloudid = config.AWS.cloudid;
                                                                    vm_details_insertdata.othercloud_vm_id = aws_vm_id;
                                                                    vm_details_insertdata.othercloud_vm_table = "aws_vms";
                                                                    token.vmdata = vm_details_insertdata;
                                                                    return createNewOrder(token,async function(err,response){
                                                                      //console.log("response");
                                                                      //console.log(response);
                                                                      console.log("aws_vm_id");
                                                                      console.log("inserted the vms data with id "+aws_vm_id);
                                                                      imageResolve("inserted the vms data with id "+aws_vm_id);
                                                                    });
                                                                  }
                                                                });
                                                              }
                                                            });
                                                        }
                                                      }catch (e) {
                                                        console.log('exception occured');
                                                        console.log(e);
                                                      }
                                                    });
                                                });
                                            }
                                            console.log("vms data updated client id "+item.id+" and region id "+regionName);
                                            regionItemResolve("vms data updated client id "+item.id+" and region id "+regionName);
                                          }else{
                                            console.log("Failed for client id "+item.id+" and region id "+regionName);
                                            regionItemResolve("Failed for client id "+item.id+" and region id "+regionName);
                                          }
                                        }
                                      });
                                    });
                                  }
                                  console.log("vms data updated client id "+item.id);
                                  regionResolve("vms data updated client id "+item.id);
                                }else{
                                  console.log("No data available for client id "+item.id);
                                  regionResolve("No data available for client id "+item.id);
                                }
                              });
                            });
                          }
                        });
                        console.log("updated for client id "+item.id);
                        itemResolve("updated for client id "+item.id);
                      });
                  };
                  console.log("Updated Aws vms");
                  callback(null,"Updated Aws vms");
                  resolve("Updated Aws vms");
              }else{
                  console.log("No clients available to update the Aws vms");
                  callback(1,"No clients available to update the Aws vms");
                  reject("No clients available to update the Aws vms");
              }
          }
          catch{
              resolve(0);
          }
      });
  });
}

let createNewOrder=(data,callback)=>{
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
            console.log(orderRows);
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

            
            response = await dbHandler.insertIntoTable('c4_order_details',odrDetailsValues,async function(error,orderDetailsId){
                if(error) {
                    dbFunc.connectionRelease;
                    callback(1,'The operation did not execute as expected. Please raise a ticket to support')
                    reject(error);
                } else {
                    dbFunc.connectionRelease;
                    console.log("orderDetailsId");
                    console.log(orderDetailsId);

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
                        console.log("vmDetailsId");
                        console.log(vmDetailsId);
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
  Author : Pradeep
  Descri: get vm list
  Date  : 08-06-2020
*/
let syncInstanceTypes= (reqObj,callback)=>{
  // console.log(reqObj);
  let sql = `Select c.* from c4_clients as c 
  where c.status = 1 and c.is_aws_enabled = 1`;
  if(typeof reqObj.id != 'undefined'){
      sql += ` and c.id = ${reqObj.id} order by id desc limit 1`;
  }else{
      sql += ` order by id asc limit 1`;
  }
  // sql += ' limit 1';
  //console.log(sql);
  new Promise(function(resolve, reject) {
      dbHandler.executeQuery(sql,async function(AwsClients){
          // console.log("AwsClients");
          //console.log(AwsClients);
          try{
              if (AwsClients.length > 0) {
                  for await (const item of AwsClients) {
                      await new Promise(async function(itemResolve, itemReject){
                        await new Promise(function(resolve,reject){
                          aws_authtoken(item.id, function(error, result){
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
                            var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
                            itemResolve(response);
                          }else{
                            let regionSql = `Select r.* from c4_aws_client_regions as r
                            where r.record_status = 1`;
                            // regionSql += ' limit 1';
                            //console.log(regionSql);
                            await new Promise(async function(regionResolve, regionReject) {
                              await dbHandler.executeQuery(regionSql,async function(regionList){
                                // console.log("regionList");
                                // console.log(regionList);
                                if (regionList.length > 0) {
                                  for await (const regionItem of regionList) {
                                    await new Promise(async function(regionItemResolve, regionItemReject) {
                                      let accessKey = token.tokendata.accesstoken;
                                      let secretKey = token.tokendata.secretekey;
                                      let regionName =  regionItem.regionid; //regionItem.regionid;//'ap-southeast-2'; //
                                      let serviceName = 'ec2';
                                      let myMethod = 'GET';
                                      params = {
                                        access_key : accessKey,
                                        secret_key : secretKey,
                                        region : regionName,
                                        myService : serviceName,
                                        myMethod : myMethod,
                                        myPath : '/'
                                      }
                                     
                                      params.queryParams = {
                                        "Action": "DescribeInstanceTypes",
                                        "Version":"2016-11-15"
                                      };
                                      params.url = params.myService+'.'+params.region+'.amazonaws.com';
                                      //console.log(params);
                                      await helper.awsProcessRequest(params,async function(err, responseBody){
                                        // console.log("responseBody");
                                        //console.log(responseBody);
                                        if(responseBody && responseBody.Response && responseBody.Response.Errors){
                                          console.log(responseBody.Response.Errors);
                                          regionItemResolve([]);
                                        }else{
                                          // callback(1,responseBody);
                                          // regionItemResolve([]);
                                          // return;
                                          if (responseBody && responseBody.DescribeInstanceTypesResponse && 
                                            responseBody.DescribeInstanceTypesResponse.instanceTypeSet[0] && 
                                            responseBody.DescribeInstanceTypesResponse.instanceTypeSet[0].item.length > 0) {
                                              let responseItems = responseBody.DescribeInstanceTypesResponse.instanceTypeSet[0].item
                                            for await (const data of responseItems) {
                                                await new Promise(async function(imageResolve, imageReject){
                                                    let sql1 = `SELECT * from c4_aws_intancetypes
                                                    where regionName='${regionName}' and instanceType = '${data.instanceType[0]}'`;
                                                    console.log("data");
                                                    await dbHandler.executeQuery(sql1,async function(vmInfo){
                                                      //  callback(1,data);
                                                        if(vmInfo.length > 0){
                                                            let updateData = {
                                                              regionName : regionName,
                                                              memoryInMB : ((data.memoryInfo && data.memoryInfo[0] && data.memoryInfo[0].sizeInMiB && data.memoryInfo[0].sizeInMiB[0])?data.memoryInfo[0].sizeInMiB[0]:""),
                                                              totalSizeInGB : 0,
                                                              instanceType : data.instanceType[0],
                                                              vcpus : ((data.vCpuInfo && data.vCpuInfo[0] && data.vCpuInfo[0].defaultVCpus && data.vCpuInfo[0].defaultVCpus[0])?data.vCpuInfo[0].defaultVCpus[0]:0),
                                                              cores : ((data.vCpuInfo && data.vCpuInfo[0] && data.vCpuInfo[0].defaultCores && data.vCpuInfo[0].defaultCores[0])?data.vCpuInfo[0].defaultCores[0]:0),
                                                              supportedArchitectures : data.processorInfo[0].supportedArchitectures[0].item[0],
                                                              instanceStorageSupported : data.instanceStorageSupported[0],
                                                              networkPerformance : ((data.networkInfo && data.networkInfo[0] && data.networkInfo[0].networkPerformance && data.networkInfo[0].networkPerformance[0])?data.networkInfo[0].networkPerformance[0]:""),
                                                              currentGeneration : data.currentGeneration[0],
                                                              enaSupport:data.networkInfo[0].enaSupport[0],
                                                              updated_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
                                                            };
                                                            if(data.instanceStorageInfo && data.instanceStorageInfo[0]){
                                                              if(data.instanceStorageInfo[0].totalSizeInGB && data.instanceStorageInfo[0].totalSizeInGB[0]){
                                                                updateData.totalSizeInGB=data.instanceStorageInfo[0].totalSizeInGB[0];
                                                              }
                                                              if(data.instanceStorageInfo[0].disks && data.instanceStorageInfo[0].disks[0] &&
                                                                data.instanceStorageInfo[0].disks[0].item && data.instanceStorageInfo[0].disks[0].item[0] &&
                                                                data.instanceStorageInfo[0].disks[0].item[0].type && data.instanceStorageInfo[0].disks[0].item[0].type[0]){
                                                                updateData.instanceStorageType = data.instanceStorageInfo[0].disks[0].item[0].type[0];
                                                              }
                                                              if(data.instanceStorageInfo[0].disks && data.instanceStorageInfo[0].disks[0] &&
                                                                data.instanceStorageInfo[0].disks[0].item && data.instanceStorageInfo[0].disks[0].item[0] &&
                                                                data.instanceStorageInfo[0].disks[0].item[0].count && data.instanceStorageInfo[0].disks[0].item[0].count[0]){
                                                                updateData.instanceStorageDiskCount = data.instanceStorageInfo[0].disks[0].item[0].count[0];
                                                              }
                                                            }
                                                            console.log("updateData");
                                                            console.log(updateData);
                                                            await dbHandler.updateTableData('c4_aws_intancetypes',{'id':vmInfo[0].id},updateData,function(err,result){
                                                                console.log("updated the vms dara with id "+vmInfo[0].id);
                                                                imageResolve("updated the vms dara with id "+vmInfo[0].id);
                                                            });
                                                        }else{
                                                            let insData = {
                                                              clientid : 0,
                                                              regionName : regionName,
                                                              memoryInMB : data.memoryInfo[0].sizeInMiB[0],
                                                              instanceType : data.instanceType[0],
                                                              totalSizeInGB : 0,
                                                              vcpus : ((data.vCpuInfo && data.vCpuInfo[0] && data.vCpuInfo[0].defaultVCpus && data.vCpuInfo[0].defaultVCpus[0])?data.vCpuInfo[0].defaultVCpus[0]:0),
                                                              cores : ((data.vCpuInfo && data.vCpuInfo[0] && data.vCpuInfo[0].defaultCores && data.vCpuInfo[0].defaultCores[0])?data.vCpuInfo[0].defaultCores[0]:0),
                                                              supportedArchitectures : data.processorInfo[0].supportedArchitectures[0].item[0],
                                                              instanceStorageSupported : data.instanceStorageSupported[0],
                                                              networkPerformance : ((data.networkInfo && data.networkInfo[0] && data.networkInfo[0].networkPerformance && data.networkInfo[0].networkPerformance[0])?data.networkInfo[0].networkPerformance[0]:""),
                                                              currentGeneration : data.currentGeneration[0],
                                                              enaSupport:data.networkInfo[0].enaSupport[0],
                                                              created_date : dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
                                                            };
                                                            if(data.instanceStorageInfo && data.instanceStorageInfo[0]){
                                                              if(data.instanceStorageInfo[0].totalSizeInGB && data.instanceStorageInfo[0].totalSizeInGB[0]){
                                                                insData.totalSizeInGB=data.instanceStorageInfo[0].totalSizeInGB[0];
                                                              }
                                                              if(data.instanceStorageInfo[0].disks && data.instanceStorageInfo[0].disks[0] &&
                                                                data.instanceStorageInfo[0].disks[0].item && data.instanceStorageInfo[0].disks[0].item[0] &&
                                                                data.instanceStorageInfo[0].disks[0].item[0].type && data.instanceStorageInfo[0].disks[0].item[0].type[0]){
                                                                  insData.instanceStorageType = data.instanceStorageInfo[0].disks[0].item[0].type[0];
                                                              }
                                                              if(data.instanceStorageInfo[0].disks && data.instanceStorageInfo[0].disks[0] &&
                                                                data.instanceStorageInfo[0].disks[0].item && data.instanceStorageInfo[0].disks[0].item[0] &&
                                                                data.instanceStorageInfo[0].disks[0].item[0].count && data.instanceStorageInfo[0].disks[0].item[0].count[0]){
                                                                  insData.instanceStorageDiskCount = data.instanceStorageInfo[0].disks[0].item[0].count[0];
                                                              }
                                                            }
                                                            console.log("insData");
                                                            console.log(insData);
                                                            await dbHandler.insertIntoTable('c4_aws_intancetypes',insData,async function(error,vmId){
                                                                console.log("inserted the instance type data with id "+vmId);
                                                                imageResolve("inserted the instance type data with id "+vmId);
                                                            });
                                                        }
                                                    });
                                                });
                                            }
                                            console.log("instance type data updated client id "+item.id+" and region id "+regionName);
                                            regionItemResolve("instance type data updated client id "+item.id+" and region id "+regionName);
                                          }else{
                                            console.log("Failed for client id "+item.id+" and region id "+regionName);
                                            regionItemResolve("Failed for client id "+item.id+" and region id "+regionName);
                                          }
                                        }
                                      });
                                    });
                                  }
                                  console.log("instance type data updated client id "+item.id);
                                  regionResolve("instance type data updated client id "+item.id);
                                }else{
                                  console.log("No data available for client id "+item.id);
                                  regionResolve("No data available for client id "+item.id);
                                }
                              });
                            });
                          }
                        });
                        console.log("updated for client id "+item.id);
                        itemResolve("updated for client id "+item.id);
                      });
                  };
                  console.log("Updated Aws instance type");
                  callback(null,"Updated Aws instance type");
                  resolve("Updated Aws instance type");
              }else{
                  console.log("No clients available to update the Aws instance type");
                  callback(1,"No clients available to update the Aws instance type");
                  reject("No clients available to update the Aws instance type");
              }
          }
          catch{
              resolve(0);
          }
      });
  });
}

let getAwsInstanceTypes = async (reqBody,callback)=>{

  var clientId=reqBody.clientid;
  var currency_id=reqBody.currency_id;
  var enaSupport=reqBody.enaSupport;

  if(typeof(clientId)=='undefined' || clientId==''){
    var response={status:"error",message:'Please provide clientid.'}
    return callback([],response);
  }
  if(typeof(currency_id)=='undefined' || currency_id==''){
    var response={status:"error",message:'Please provide currency_id.'}
    return callback([],response);
  }

  let catalogSql = `SELECT c.*,cur.currency_code, ocp.windows_price, ocp.linux_price  from c4_aws_intancetypes as c
  inner join c4_othercloud_prices as ocp on (ocp.ref_id = c.id and ocp.ref_type = 'SIZES' and ocp.cloud_type = 'AWS' and ocp.currency_id = '${currency_id}' and ocp.record_status = 1)
  left join c4_currencies as cur on cur.id = ocp.currency_id
  where 1`;

  if(reqBody.enaSupport=="true"){
    catalogSql += ` and c.enaSupport = 'required' `;
  }
  if(reqBody.regionName){
    catalogSql += ` and c.regionName = '${reqBody.regionName}' `;
  }
  if(reqBody.architecture){
    catalogSql += ` and c.supportedArchitectures = '${reqBody.architecture}' `;
  }

  if(reqBody.status && reqBody.status != 'all'){
    catalogSql += ` and c.status = ${reqBody.status} `;
  }else if(!reqBody.status){
    catalogSql += ` and c.status = 1 `;
  }
  catalogSql += ` order by c.instanceType asc`;
  console.log("catalogSql");
  console.log(catalogSql);
  await dbHandler.executeQuery(catalogSql,async function(catalogInfo){
    return callback(null,{status:"success",message:'Aws Intance Types List.',data:catalogInfo});
  });
}

let getAwsVms = async (reqBody,callback)=>{

  var clientId=reqBody.clientid;

  if(typeof(clientId)=='undefined' || clientId==''){
    var response={status:"error",message:'Please provide clientid.'}
    return callback([],response);
  }

  let vmSql = `SELECT vm.*, 
  av.*,
  md5(vm.id) as mdvmid
  FROM c4_vm_details as vm
  inner join aws_vms as av on av.vm_detail_id = vm.id
  where vm.clientid = '${clientId}' and vm.cloudid = ${config.AWS.cloudid} and vm.vm_status not in('Deleted','CreationFailed') `;

  if(reqBody.status && reqBody.status != 'all'){
    vmSql += ` and vm.status = ${reqBody.status} `;
  }else if(!reqBody.status){
    vmSql += ` and vm.status = 1 `;
  }
  vmSql += ` order by vm.label_name asc`;
  console.log("vmSql");
  console.log(vmSql);
  await dbHandler.executeQuery(vmSql,async function(vmInfo){
    await vmInfo.forEach(async function(val,key) {
      vmInfo[key].base64_vm_detail_id = base64.encode(val.vm_detail_id);
    });
    return callback(null,{status:"success",message:'Aws VMs List.',data:vmInfo});
  });
}
/*
  Author : Pradeep
  Descri: vm operation
  Date  : 09-06-2020
*/
let vmOperations= (reqObj,callback)=>{
  let sql = `Select c.*,vm.instanceId,vm.vm_name,vm.regionName from c4_clients as c inner join aws_vms as vm on c.id=vm.clientid
  where c.status = 1 and c.is_aws_enabled = 1 and vm.clientid = '${reqObj.clientid}' and vm.instanceId='${reqObj.ref_id}'`;
  dbHandler.executeQuery(sql,async function(vmdata){
  var item=vmdata[0];
  if (item) {
    await new Promise(function(resolve,reject){
      aws_authtoken(item.id, function(error, result){
          resolve(result)
      })
    }).then(async function(token){
        if(token.tokendata.length == 0){
          var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
          return callback(1,response);
        }else{
          //console.log(token)
          let accessKey = token.tokendata.accesstoken;
          let secretKey = token.tokendata.secretekey;
          let regionName =  item.regionName;//'ap-southeast-2'; //
          let serviceName = 'ec2';
          let myMethod = 'GET';
          params = {
            access_key : accessKey,
            secret_key : secretKey,
            region : regionName,
            myService : serviceName,
            myMethod : myMethod,
            myPath : '/'
          }
          if(reqObj.actionName=='start')
          var actionName='StartInstances';
          if(reqObj.actionName=='stop')
          var actionName='StopInstances';
          if(reqObj.actionName=='restart')
          var actionName='RebootInstances';
          if(reqObj.actionName=='delete')
          var actionName='TerminateInstances';
          if(reqObj.actionName=='status')
          var actionName='DescribeInstanceStatus';
                    
          params.queryParams = {
            "Action": actionName,
            "InstanceId":item.instanceId,
            "Version":"2016-11-15"
          };
          params.url = params.myService+'.'+params.region+'.amazonaws.com';
          //console.log(params);
          await helper.awsProcessRequest(params,async function(err, responseBody){
            // console.log("responseBody");
            //console.log(responseBody);
            if(responseBody && responseBody.Response && responseBody.Response.Errors){
              console.log('VM Operation failed.')
              return callback(null,{success:0,message:'VM Operation failed.',data:responseBody});
            }else{
              console.log('VM Operation successful')
              return callback(null,{success:1,message:'VM Operation successful.',data:responseBody});
            }
          });
        }
      }); 
    }
  });                            
}
/*
  Author : Pradeep
  Descri: get Vpc list
  Date  : 11-06-2020
*/
let getVpcList= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    return callback(1,{success:0,message:'Please provide region name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'DescribeVpcs',
          "Version":"2016-11-15"
        };
        params.url = params.myService+'.'+params.region+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.Response && responseBody.Response.Errors){
            return callback(null,{success:0,data:responseBody.Response.Errors});
          }else{
            if(responseBody && responseBody.DescribeVpcsResponse && responseBody.DescribeVpcsResponse.vpcSet[0] && responseBody.DescribeVpcsResponse.vpcSet[0].item)
            return callback(null,{success:1,data:responseBody.DescribeVpcsResponse.vpcSet[0].item});
            else return callback(null,[])
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: get Subnet list
  Date  : 11-06-2020
*/
let getSubnetList= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    return callback(1,{success:0,message:'Please provide region name.'});
  }
  var ipCount=reqObj.ipCount;
  if(typeof ipCount =='undefined'){
    return callback(1,{success:0,message:'Please provide ip count.'});
  }
  var vpcId=reqObj.vpcId;
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
        callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'DescribeSubnets',
          "Version":"2016-11-15"
        };
        params.url = params.myService+'.'+params.region+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.Response && responseBody.Response.Errors){
            callback(1,{status:"error",data:responseBody.Response.Errors});
          }else{
            if(responseBody && responseBody.DescribeSubnetsResponse && responseBody.DescribeSubnetsResponse.subnetSet[0] && responseBody.DescribeSubnetsResponse.subnetSet[0].item)
            {
              for (const item of responseBody.DescribeSubnetsResponse.subnetSet[0].item) {
                if(!subnet)var subnet=[];
                await new Promise(async function(resolve, reject) {
                    if(item.availableIpAddressCount && item.availableIpAddressCount[0] >= ipCount)
                    {
                      if(vpcId){
                        if(vpcId==item.vpcId[0])
                          await subnet.push(item)
                      }
                      else
                      await subnet.push(item)
                    }
                    resolve('')
                })
              }
              callback(null,{status:"success",data:subnet, message:'Aws Subnet List'});
            }
            else {
              var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
              callback(1,response)
            }
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: get network interface list
  Date  : 11-06-2020
*/
let getNetworkInterfaceList= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    return callback(1,{success:0,message:'Please provide region name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'DescribeNetworkInterfaces',
          "Version":"2016-11-15"
        };
        params.url = params.myService+'.'+params.region+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.Response && responseBody.Response.Errors){
            return callback(null,{success:0,data:responseBody.Response.Errors});
          }else{
            //console.log(JSON.stringify(responseBody.DescribeNetworkInterfacesResponse.networkInterfaceSet[0].item))
            if(responseBody && responseBody.DescribeNetworkInterfacesResponse && responseBody.DescribeNetworkInterfacesResponse.networkInterfaceSet && responseBody.DescribeNetworkInterfacesResponse.networkInterfaceSet[0].item)
            return callback(null,{success:1,data:responseBody.DescribeNetworkInterfacesResponse.networkInterfaceSet[0].item});
            else return callback(null,[])
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: create Vpc
  Date  : 11-06-2020
*/
let createVpc= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    callback(1,{success:0,message:'Please provide region name.'});
  }
  var cidrBlock=reqObj.cidrBlock;
  if(typeof cidrBlock =='undefined'){
    callback(1,{success:0,message:'Please provide ip block.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action":"CreateVpc",
          "CidrBlock":cidrBlock,
          "Version":"2016-11-15"
        };
        params.url = params.myService+'.'+params.region+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.Response && responseBody.Response.Errors){
            callback(null,{success:0,data:responseBody.Response.Errors});
          }else{
            if(responseBody && responseBody.CreateVpcResponse && responseBody.CreateVpcResponse.vpc)
            callback(null,{success:1,data:responseBody.CreateVpcResponse.vpc});
            else callback(null,responseBody)
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: create Subnet
  Date  : 11-06-2020
*/
let createSubnet= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    callback(1,{success:0,message:'Please provide region name.'});
  }
  var cidrBlock=reqObj.cidrBlock;
  if(typeof cidrBlock =='undefined'){
    callback(1,{success:0,message:'Please provide ip block.'});
  }
  var availabilityZone=reqObj.availabilityZone;
  if(typeof availabilityZone =='undefined'){
    callback(1,{success:0,message:'Please provide availability zone.'});
  }
  var vpcId=reqObj.vpcId;
  if(typeof vpcId =='undefined'){
    callback(1,{success:0,message:'Please provide vpc id.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }  
        await new Promise(function(resolve,reject){  
            //console.log(params)           
          params.queryParams = {
              "Action": 'CreateSubnet',
              "AvailabilityZone":availabilityZone,
              "CidrBlock":cidrBlock,
              "Version":"2016-11-15",
              "VpcId":vpcId
            };
            params.url = params.myService+'.'+params.region+'.amazonaws.com';
            resolve(params)
          }).then(async function(params){
            //console.log(params)
              await helper.awsProcessRequest(params,async function(err, responseBody){
                if(responseBody && responseBody.Response && responseBody.Response.Errors){
                  callback(1,{success:0,data:responseBody.Response.Errors});
                }else{
                  if(responseBody && responseBody.CreateVpcResponse && responseBody.CreateVpcResponse.vpc)
                  callback(null,{success:1,data:responseBody.CreateVpcResponse.vpc});
                  else callback(null,responseBody)
                }
              });
          })
      }
    });                          
}
/*
  Author : Pradeep
  Descri: create Network Interface
  Date  : 11-06-2020
*/
let createNetworkInterface= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    callback(1,{success:0,message:'Please provide region name.'});
  }
  var subnetId=reqObj.subnetId;
  if(typeof subnetId =='undefined'){
    callback(1,{success:0,message:'Please provide subnet id.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }  
        await new Promise(function(resolve,reject){  
            //console.log(params)           
          params.queryParams = {
              "Action": 'CreateNetworkInterface',
              "SubnetId":subnetId,
              "Version":"2016-11-15",
            };
            params.url = params.myService+'.'+params.region+'.amazonaws.com';
            resolve(params)
          }).then(async function(params){
              //console.log(params)
              await helper.awsProcessRequest(params,async function(err, responseBody){
                if(responseBody && responseBody.Response && responseBody.Response.Errors){
                  callback(1,{success:0,data:responseBody.Response.Errors});
                }else{
                  if(responseBody && responseBody.CreateNetworkInterfaceResponse && responseBody.CreateNetworkInterfaceResponse.networkInterface)
                  callback(null,{success:1,data:responseBody.CreateNetworkInterfaceResponse.networkInterface});
                  else callback(null,responseBody)
                }
              });
          })
      }
    });                          
}
////deletion apis/////
/*
  Author : Pradeep
  Descri: delete Vpc
  Date  : 12-06-2020
*/
let deleteVpc= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    callback(1,{success:0,message:'Please provide region name.'});
  }
  var vpcId=reqObj.vpcId;
  if(typeof vpcId =='undefined'){
    callback(1,{success:0,message:'Please provide vpc id.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action":"DeleteVpc",
          "VpcId":vpcId,
          "Version":"2016-11-15"
        };
        params.url = params.myService+'.'+params.region+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.Response && responseBody.Response.Errors){
            callback(null,{success:0,data:responseBody.Response.Errors});
          }else{
            callback(null,responseBody)
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: delete Subnet
  Date  : 11-06-2020
*/
let deleteSubnet= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    callback(1,{success:0,message:'Please provide region name.'});
  }
  var subnetId=reqObj.subnetId;
  if(typeof subnetId =='undefined'){
    callback(1,{success:0,message:'Please provide subnet id.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }  
        await new Promise(function(resolve,reject){  
            //console.log(params)           
          params.queryParams = {
              "Action": 'DeleteSubnet',
              "SubnetId":subnetId,
              "Version":"2016-11-15"
            };
            params.url = params.myService+'.'+params.region+'.amazonaws.com';
            resolve(params)
          }).then(async function(params){
            //console.log(params)
              await helper.awsProcessRequest(params,async function(err, responseBody){
                if(responseBody && responseBody.Response && responseBody.Response.Errors){
                  callback(1,{success:0,data:responseBody.Response.Errors});
                }else{
                  callback(null,responseBody)
                }
              });
          })
      }
    });                          
}
/*
  Author : Pradeep
  Descri: delete Network Interface
  Date  : 11-06-2020
*/
let deleteNetworkInterface= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    return callback(1,{success:0,message:'Please provide region name.'});
  }
  var networkInterfaceId=reqObj.networkInterfaceId;
  if(typeof networkInterfaceId =='undefined'){
    return callback(1,{success:0,message:'Please provide networkInterface id.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }  
        await new Promise(function(resolve,reject){  
            //console.log(params)           
          params.queryParams = {
              "Action": 'DeleteNetworkInterface',
              "NetworkInterfaceId":networkInterfaceId,
              "Version":"2016-11-15",
            };
            params.url = params.myService+'.'+params.region+'.amazonaws.com';
            resolve(params)
          }).then(async function(params){
              //console.log(params)
              await helper.awsProcessRequest(params,async function(err, responseBody){
                if(responseBody && responseBody.Response && responseBody.Response.Errors){
                  return callback(1,{success:0,data:responseBody.Response.Errors});
                }else{
                  return callback(null,responseBody)
                }
              });
          })
      }
    });                          
}
/*
  Author : Pradeep
  Descri: attach Network Interface
  Date  : 12-06-2020
*/
let attachNetworkInterface= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    callback(1,{success:0,message:'Please provide region name.'});
  }
  var instanceId=reqObj.instanceId;
  if(typeof instanceId =='undefined'){
    callback(1,{success:0,message:'Please provide instance id.'});
  }
  var networkInterfaceId=reqObj.networkInterfaceId;
  if(typeof networkInterfaceId =='undefined'){
    callback(1,{success:0,message:'Please provide networkInterface id.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }  
        await new Promise(function(resolve,reject){  
            //console.log(params)           
          params.queryParams = {
              "Action": 'AttachNetworkInterface',
              "DeviceIndex":1,
              "InstanceId":instanceId,
              "NetworkInterfaceId":networkInterfaceId,
              "Version":"2016-11-15",
            };
            params.url = params.myService+'.'+params.region+'.amazonaws.com';
            resolve(params)
          }).then(async function(params){
              //console.log(params)
              await helper.awsProcessRequest(params,async function(err, responseBody){
                if(responseBody && responseBody.Response && responseBody.Response.Errors){
                  callback(1,{success:0,data:responseBody.Response.Errors});
                }else{
                  callback(null,responseBody)
                }
              });
          })
      }
    });                          
}
/*
  Author : Pradeep
  Descri: create key pair
  Date  : 15-06-2020
*/
let createKeyPair= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    return callback(1,{success:0,message:'Please provide region name.'});
  }
  var KeyName=reqObj.keyName;
  if(typeof KeyName =='undefined'){
    return callback(1,{success:0,message:'Please provide key name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }  
        await new Promise(function(resolve,reject){  
        //https://ec2.amazonaws.com/?Action=CreateKeyPair&Version=2016-11-15&KeyName=harithakey&
        //TagSpecification.1.ResourceType=key-pair&TagSpecification.1.Tag.1.Key=purpose&TagSpecification.1.Tag.1.Value=production   
        params.queryParams = {
              "Action": 'CreateKeyPair',
              "KeyName":KeyName,
              "TagSpecification.1.ResourceType":"key-pair",
              "TagSpecification.1.Tag.1.Key":"purpose",
              "TagSpecification.1.Tag.1.Value":"production",
              "Version":"2016-11-15"
            };
            params.url = params.myService+'.'+params.region+'.amazonaws.com';
            resolve(params)
          }).then(async function(params){
              //console.log(params)
              await helper.awsProcessRequest(params,async function(err, responseBody){
                if(responseBody && responseBody.Response && responseBody.Response.Errors){
                  return callback(1,{success:0,data:responseBody.Response.Errors});
                }else{
                  return callback(null,responseBody)
                }
              });
          })
      }
    });                          
}
/*
  Author : Pradeep
  Descri: get key pair
  Date  : 15-06-2020
*/
let getKeyPair= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    return callback(1,{success:0,message:'Please provide region name.'});
  }
  var KeyName=reqObj.keyName;
  if(typeof KeyName =='undefined'){
    return callback(1,{success:0,message:'Please provide key name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }  
        await new Promise(function(resolve,reject){  
        params.queryParams = {
              "Action": 'DescribeKeyPairs',
              "KeyName":KeyName,
              "Version":"2016-11-15"
            };
            params.url = params.myService+'.'+params.region+'.amazonaws.com';
            resolve(params)
          }).then(async function(params){
              //console.log(params)
              await helper.awsProcessRequest(params,async function(err, responseBody){
                if(responseBody && responseBody.Response && responseBody.Response.Errors){
                  return callback(1,{success:0,data:responseBody.Response.Errors});
                }else{
                  return callback(null,responseBody)
                }
              });
          })
      }
    });                          
}
/*
  Author : Pradeep
  Descri: create vm
  Date  : 15-06-2020
*/
let createVm= (reqObj,callback)=>{
    var clientid=reqObj.clientid;
    if(typeof clientid =='undefined'){
      return callback(1,{success:0,message:'Please provide clientid.'});
    }
    var regionName=reqObj.regionName;
    if(typeof regionName =='undefined'){
      return callback(1,{success:0,message:'Please provide region name.'});
    }
    var ImageId=reqObj.imageId;
    if(typeof ImageId =='undefined'){
      return callback(1,{success:0,message:'Please provide image id.'});
    }
    var InstanceType=reqObj.instanceType;
    if(typeof InstanceType =='undefined'){
      return callback(1,{success:0,message:'Please provide instance type.'});
    }
    var MaxCount=reqObj.maxCount;
    if(typeof MaxCount =='undefined'){
      return callback(1,{success:0,message:'Please provide max count.'});
    }
    var SubnetId=reqObj.subnetId;
    if(typeof SubnetId =='undefined'){
      return callback(1,{success:0,message:'Please provide subnet id.'});
    }
    var vmName=reqObj.vmName;
    if(typeof vmName =='undefined'){
      return callback(1,{success:0,message:'Please provide vm name.'});
    }
    
   new Promise(async function(resolve,reject){
    await aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }  
        await new Promise(async function(resolve,reject){  
         /*
         https://ec2.region.amazonaws.com/?Action=RunInstances&Version=2016-11-15
         &ImageId=ami-088ff0e3bde7b3fdf&InstanceType=t2.large&MaxCount=1&MinCount=1
         &SubnetId=subnet-05f2fa839b02079ea&TagSpecification.1.ResourceType=instance
         &TagSpecification.1.Tag.1.Key=automationtest3&TagSpecification.1.Tag.1.Value=production
         &TagSpecification.1.Tag.2.Key=labelname&TagSpecification.1.Tag.2.Value=automationtest3
         */       
        //https://ec2.amazonaws.com/?Action=CreateKeyPair&Version=2016-11-15&KeyName=harithakey&
        //TagSpecification.1.ResourceType=key-pair&TagSpecification.1.Tag.1.Key=purpose&TagSpecification.1.Tag.1.Value=production   
        //https://ec2.amazonaws.com/?Action=DescribeKeyPairs&Version=2016-11-15&KeyName.1=harithakey  
           var MyKeyPair = await new Promise(async function(resolve1,reject1){  
                var params1=params;
                params1.queryParams = {
                    "Action": 'CreateKeyPair',
                    "KeyName":vmName+'key',
                    "TagSpecification.1.ResourceType":"key-pair",
                    "TagSpecification.1.Tag.1.Key":"purpose",
                    "TagSpecification.1.Tag.1.Value":"production",
                    "Version":"2016-11-15"
                  };
                  params1.url = params.myService+'.'+params.region+'.amazonaws.com';
                  await helper.awsProcessRequest(params1,async function(err, responseBody){
                    if(responseBody && responseBody.Response && responseBody.Response.Errors){
                      return callback(1,{success:0,message:responseBody.Response.Errors[0].Error[0].Message[0]});
                    }else{
                      if(responseBody.CreateKeyPairResponse && responseBody.CreateKeyPairResponse.keyName)
                      resolve1(responseBody.CreateKeyPairResponse.keyName[0]);
                      else{
                        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
                        return callback(1,response);
                      }
                    }
                  });
              })
              //var MyKeyPair='pkptestingkey';
              if(!MyKeyPair){
                var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
                return callback(1,response);
              }
              params.queryParams = {
                "Action": 'RunInstances',
                "ImageId":ImageId,
                "InstanceType":InstanceType,
                "MaxCount":MaxCount,
                "MinCount":1,
                "KeyName":MyKeyPair,
                "SubnetId":SubnetId,
                "TagSpecification.1.ResourceType":"instance",
                "TagSpecification.1.Tag.1.Key":vmName,
                "TagSpecification.1.Tag.1.Value":"production",
                "TagSpecification.1.Tag.2.Key":"labelname",
                "TagSpecification.1.Tag.2.Value":vmName,
                "Version":"2016-11-15"
              };
              params.url = params.myService+'.'+params.region+'.amazonaws.com';
              resolve(params)
          }).then(async function(params){
              console.log(params)
              await helper.awsProcessRequest(params,async function(err, responseBody){
                if(responseBody && responseBody.Response && responseBody.Response.Errors){
                  callback(1,{success:0,message:responseBody.Response.Errors[0].Error[0].Message[0]});
                }else{
                  callback(null,responseBody)
                }
              });
          })
      }
    });                          
}
/*
  Author : Pradeep
  Descri: get vm detail
  Date  : 15-06-2020
*/
let getAwsVmDetail= (reqObj,callback)=>{
  if(!reqObj.ref_id){
    var response={success:0,message:'Please provide ref id.'}
    return callback(1,response);
  }
  if(!reqObj.clientid){
    var response={success:0,message:'Please provide client id.'}
    return callback(1,response);
  }
  let sql = `Select vm.* from aws_vms as vm where vm.instanceId ='${reqObj.ref_id}' and vm.clientid='${reqObj.clientid}'`;
  new Promise(function(resolve, reject) {
      dbHandler.executeQuery(sql,async function(AwsClients){
        try{
            if (AwsClients.length > 0) {
               var vminfo= AwsClients[0]
               await new Promise(function(resolve,reject){
                aws_authtoken(vminfo.clientid, function(error, result){
                    resolve(result)
                })
              }).then(async function(token){
                  if(token.tokendata.length == 0){
                    var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
                    return callback(1,response);
                  }else{
                    //console.log(token)
                    let accessKey = token.tokendata.accesstoken;
                    let secretKey = token.tokendata.secretekey;
                    let regionName =  vminfo.regionName;//'ap-southeast-2'; //
                    let serviceName = 'ec2';
                    let myMethod = 'GET';
                    params = {
                      access_key : accessKey,
                      secret_key : secretKey,
                      region : regionName,
                      myService : serviceName,
                      myMethod : myMethod,
                      myPath : '/'
                    }  
                    await new Promise(function(resolve,reject){  
                    params.queryParams = {
                          "Action": 'DescribeInstances',
                          "InstanceId.1":vminfo.instanceId,
                          "Version":"2016-11-15"
                        };
                        params.url = params.myService+'.'+params.region+'.amazonaws.com';
                        resolve(params)
                      }).then(async function(params){
                          //console.log(params)
                          await helper.awsProcessRequest(params,async function(err, responseBody){
                            if(responseBody && responseBody.Response && responseBody.Response.Errors){
                              return callback(1,{success:0,data:responseBody.Response.Errors});
                            }else{
                              if(responseBody.DescribeInstancesResponse && responseBody.DescribeInstancesResponse.reservationSet &&
                                 responseBody.DescribeInstancesResponse.reservationSet[0].item && responseBody.DescribeInstancesResponse.reservationSet[0].item[0].instancesSet && 
                                 responseBody.DescribeInstancesResponse.reservationSet[0].item[0].instancesSet[0].item)
                              {
                                var vm=responseBody.DescribeInstancesResponse.reservationSet[0].item[0].instancesSet[0].item[0];
                                let sql2 = `SELECT * from c4_aws_intancetypes
                                where clientid = '${reqObj.clientid}' and regionName='${regionName}' and instanceType = '${vm.instanceType[0]}'`;
                                var instanceType=await new Promise(function(resolve1, reject1){
                                  dbHandler.executeQuery(sql2,function(result){
                                    resolve1(result[0])
                                  })
                                })
                                if(!instanceType){
                                  instanceType={memoryInMB:0,totalSizeInGB:0}
                                }
                                try{
                                  var obj={
                                    vm_status:vm.instanceState[0].name[0],
                                    vm_name:vm.tagSet[0].item[0].value[0],
                                    memoryInMB:instanceType.memoryInMB,
                                    cpu_cores:vm.cpuOptions[0].coreCount[0],
                                    totalSizeInGB:instanceType.totalSizeInGB,
                                    ipAddress:vm.ipAddress[0],
                                    privateIpAddress:vm.privateIpAddress[0],
                                    vm_detail:vm
                                  }
                                  var vmUpdate={
                                    host_name: obj.vm_name,
                                    label_name: obj.vm_name,
                                    ram_units_gb: (obj.memoryInMB / 1024),
                                    cpu_units: obj.cpu_cores,
                                    disk_units_gb: obj.totalSizeInGB,
                                    multiple_ip: JSON.stringify({"ip_address":obj.privateIpAddress}),
                                    primary_ip: obj.ipAddress,
                                    power_status: (obj.vm_status == 'running')?"poweredOn":'poweredOff',
                                    vm_status: obj.vm_status.charAt(0).toUpperCase() + obj.vm_status.slice(1),
                                    updateddate : new Date().getTime() / 1000
                                  }
                                  //console.log(vmUpdate)
                                  dbHandler.updateTableData('c4_vm_details',{clientid:reqObj.clientid,ref_id:reqObj.ref_id},vmUpdate,function(err,result){
                                  })
                                  return callback(null,obj)
                                }catch(e){
                                  var obj={
                                    vm_detail:vm
                                  }
                                  return callback(null,obj)
                                }
                                
                              }else return callback(null,[])
                            }
                          });
                      })
                  }
                }); 
            }else{
              return callback(1,{success:0,data:[],message:'VM detail not found with provided ref id'});
            }
          }
          catch(e){
            return callback(1,{success:0,data:[]});
          }
      });
  })
}
/*
  Author : Pradeep
  Descri: get volume list
  Date  : 16-06-2020
*/
let getVolumeList= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    return callback(1,{success:0,message:'Please provide region name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'DescribeVolumes',
          "Version":"2016-11-15"
        };
        params.url = params.myService+'.'+params.region+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.Response && responseBody.Response.Errors){
            return callback(1,{success:0,data:responseBody.Response.Errors,message:'The operation did not execute as expected. Please raise a ticket to support'});
          }else{
            if(responseBody && responseBody.DescribeVolumesResponse && responseBody.DescribeVolumesResponse.volumeSet[0] && responseBody.DescribeVolumesResponse.volumeSet[0].item)
            {
              var volumeList=[];
              for await(const vol of responseBody.DescribeVolumesResponse.volumeSet[0].item){
                var arr={};
                Object.assign(arr,vol)  
                  //volumeList.vm_name='tset'
                  await new Promise(function(resolve,reject){
                    if(vol && vol.attachmentSet && vol.attachmentSet[0].item && vol.attachmentSet[0].item[0].instanceId)
                    {
                        dbHandler.getOneRecord('aws_vms',{instanceId:vol.attachmentSet[0].item[0].instanceId[0]},function(result){
                          if(result){
                            arr.vm_name=result.vm_name;
                            resolve(result.vm_name);
                          }
                          else {
                            arr.vm_name='';
                            resolve('')
                          }
                        })
                    }else{
                      arr.vm_name='';
                      resolve('')
                    } 
                }) 
                await volumeList.push(arr);
              }
              return callback(null,{success:1,data:volumeList,message:'Aws Volume Management'});
            }
            else 
            return callback(1,{success:0,data:responseBody,message:'The operation did not execute as expected. Please raise a ticket to support'});
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: create volume
  Date  : 16-06-2020
*/
let createVolume= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    return callback(1,{success:0,message:'Please provide region name.'});
  }
  var availabilityZone=reqObj.availabilityZone;
  if(typeof availabilityZone =='undefined'){
    return callback(1,{success:0,message:'Please provide availability zone.'});
  }
  var iops=reqObj.iops;
  if(typeof iops =='undefined'){
    return callback(1,{success:0,message:'Please provide iops.'});
  }
  var volumeType=reqObj.volumeType;
  if(typeof volumeType =='undefined'){
    return callback(1,{success:0,message:'Please provide volume type.'});
  }
  var size=reqObj.size;
  if(typeof size =='undefined'){
    return callback(1,{success:0,message:'Please provide size.'});
  }
  var currency_id=reqObj.currency_id;
  if(typeof currency_id =='undefined'){
    return callback(1,{success:0,message:'Please provide currency_id.'});
  }
  
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }   
        //https://ec2.region.amazonaws.com/?Action=CreateVolume&Version=2016-11-15&VolumeType=io1&
        //Size=50&Iops=100&AvailabilityZone=ap-southeast-2b&MultiAttachEnabled=false            
        params.queryParams = {
          "Action": 'CreateVolume',
          "AvailabilityZone":availabilityZone,
          "Iops":iops,
          "MultiAttachEnabled":false,
          "Size":size,
          "Version":"2016-11-15",
          "VolumeType":volumeType
        };
        params.url = params.myService+'.'+params.region+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
        	if(responseBody && responseBody.Response && responseBody.Response.Errors && responseBody.Response.Errors[0]
            && responseBody.Response.Errors[0].Error && responseBody.Response.Errors[0].Error[0]
            && responseBody.Response.Errors[0].Error[0].Message && responseBody.Response.Errors[0].Error[0].Message[0]){
        	  callback(null,{success:0,data:responseBody.Response.Errors,message:responseBody.Response.Errors[0].Error[0].Message[0]});
          }else{
        	  let addonRegData = {
              		cloud_type: 'AWS',
              		addon_name : "Storage",
              		currency_id : currency_id
              };
              console.log("addonRegData");
              console.log(addonRegData);
              return ordersModel.getAddonPrice(addonRegData,function(err,AddonResult){
                  if (err) {
                  	return callback(err,{success:0,data:AddonResult,message:'The operation did not execute as expected. Please raise a ticket to support'});
                  } else {
                  	let orderRegData = {
                  			order_type: 'AWS_ADDON',
                  			description : "AWS Storage",
                      		clientid : clientid,
                      		reference_id : responseBody.CreateVolumeResponse.volumeId[0],
                      		plan_id : AddonResult.data[0].id,
                      		mrc_price : (AddonResult.data[0].price * size),
                      		vmid : "",
                      		billing_location : 'AWS'
                      };
                  	console.log("orderRegData");
                      console.log(orderRegData);
                  	return ordersModel.CreateOrUpdateAddonInfo(orderRegData,function(err,result){
                          if (err) {
                          	return callback(err,{success:0,data:result,message:'The operation did not execute as expected. Please raise a ticket to support'});
                          } else {
                          	return callback(null,{success:1,data:responseBody,message:'Aws Volume created successfully.'})
                          }
                        });
                  }
              });
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: modify volume
  Date  : 18-06-2020
*/
let modifyVolume= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    return callback(1,{success:0,message:'Please provide region name.'});
  }
  var volumeId=reqObj.volumeId;
  if(typeof volumeId =='undefined'){
    return callback(1,{success:0,message:'Please provide volume id.'});
  }
  var size=reqObj.size;
  if(typeof size =='undefined'){
    return callback(1,{success:0,message:'Please provide size.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }   
        // https://ec2.region.amazonaws.com/?Action=ModifyVolume&Version=2016-11-15&VolumeId=vol-0201ddc9d5438b23a&Size=100           
        params.queryParams = {
          "Action": 'ModifyVolume',
          "Size":size,
          "Version":"2016-11-15",
          "VolumeId":volumeId
        };
        params.url = params.myService+'.'+params.region+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.Response && responseBody.Response.Errors && responseBody.Response.Errors[0]
          && responseBody.Response.Errors[0].Error && responseBody.Response.Errors[0].Error[0]
          && responseBody.Response.Errors[0].Error[0].Message && responseBody.Response.Errors[0].Error[0].Message[0]){
        	  return callback(null,{success:0,data:responseBody.Response.Errors,message:responseBody.Response.Errors[0].Error[0].Message[0]});
          }else{
			return callback(null,{success:1,data:responseBody,message:'Aws Volume modified successfully.'})
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: Detach volume
  Date  : 18-06-2020
*/
let detachVolume= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    return callback(1,{success:0,message:'Please provide region name.'});
  }
  var volumeId=reqObj.volumeId;
  if(typeof volumeId =='undefined'){
    return callback(1,{success:0,message:'Please provide volume id.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }   
        // https://ec2.region.amazonaws.com/?Action=DetachVolume&Version=2016-11-15&VolumeId=vol-0201ddc9d5438b23a
        params.queryParams = {
          "Action": 'DetachVolume',
          "Version":"2016-11-15",
          "VolumeId":volumeId
        };
        params.url = params.myService+'.'+params.region+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
        	if(responseBody && responseBody.Response && responseBody.Response.Errors && responseBody.Response.Errors[0]
            && responseBody.Response.Errors[0].Error && responseBody.Response.Errors[0].Error[0]
            && responseBody.Response.Errors[0].Error[0].Message && responseBody.Response.Errors[0].Error[0].Message[0]){
        		return callback(null,{success:0,data:responseBody.Response.Errors,message:responseBody.Response.Errors[0].Error[0].Message[0]});
          }else{
        	  return callback(null,{success:1,data:responseBody,message:'Aws Volume detached successfully.'});
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: Delete volume
  Date  : 18-06-2020
*/
let deleteVolume= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    return callback(1,{success:0,message:'Please provide region name.'});
  }
  var volumeId=reqObj.volumeId;
  if(typeof volumeId =='undefined'){
    return callback(1,{success:0,message:'Please provide volume id.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }   
        //https://ec2.region.amazonaws.com/?Action=DeleteVolume&Version=2016-11-15&VolumeId=vol-0201ddc9d5438b23a
        params.queryParams = {
          "Action": 'DeleteVolume',
          "Version":"2016-11-15",
          "VolumeId":volumeId
        };
        params.url = params.myService+'.'+params.region+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.Response && responseBody.Response.Errors && responseBody.Response.Errors[0]
            && responseBody.Response.Errors[0].Error && responseBody.Response.Errors[0].Error[0]
            && responseBody.Response.Errors[0].Error[0].Message && responseBody.Response.Errors[0].Error[0].Message[0]){
        	  return callback(null,{success:0,data:responseBody.Response.Errors,message:responseBody.Response.Errors[0].Error[0].Message[0]});
          }else{
        	  return callback(null,{success:1,data:responseBody,message:"AWS volume deleted successfully"})
          }
        });
      }
    });                          
}

/*
  Author : Pradeep
  Descri: attach volume
  Date  : 18-06-2020
*/
let attachVolume= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    return callback(1,{success:0,message:'Please provide region name.'});
  }
  var volumeId=reqObj.volumeId;
  if(typeof volumeId =='undefined'){
    return callback(1,{success:0,message:'Please provide volume id.'});
  }
  var instanceId=reqObj.instanceId;
  if(typeof instanceId =='undefined'){
    return callback(1,{success:0,message:'Please provide instance id.'});
  }
  // var device=reqObj.device;
  // if(typeof device =='undefined'){
  //   return callback(1,{success:0,message:'Please provide device name.'});
  // }
  var currency_id=reqObj.currency_id;
  if(typeof currency_id =='undefined'){
    return callback(1,{success:0,message:'Please provide currency_id.'});
  }
  var vmIdFromDB=reqObj.vmIdFromDB;
  if(typeof vmIdFromDB =='undefined'){
    return callback(1,{success:0,message:'Please provide vmIdFromDB.'});
  }
  // var size=reqObj.size;
  // if(typeof size =='undefined'){
  //   return callback(1,{success:0,message:'Please provide size.'});
  // }

  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }
        var volumeInfo=await new Promise(async function(resolve,reject){   
          params.queryParams = {
            "Action": 'DescribeVolumes',
            "Version":"2016-11-15",
            "VolumeId":volumeId
          };
          params.url = params.myService+'.'+params.region+'.amazonaws.com';
          //console.log(params);
          await helper.awsProcessRequest(params,async function(err, responseBody){
            //console.log(responseBody)
            if(responseBody && responseBody.DescribeVolumesResponse && responseBody.DescribeVolumesResponse.volumeSet[0] && 
              responseBody.DescribeVolumesResponse.volumeSet[0].item){
                resolve(responseBody.DescribeVolumesResponse.volumeSet[0].item[0])
              }else{
                var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
                return callback(1,response);
              }
          });
          
        })
        if(volumeInfo && volumeInfo.size)
          var size=volumeInfo.size[0]
        else{
          var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
           return callback(1,response);
        }
        var vmdetail=await new Promise(function(resolve,reject){
          params.queryParams = {}
          params.queryParams = {
              "Action": 'DescribeInstances',
              "InstanceId.1":instanceId,
              "Version":"2016-11-15"
          };
          params.url = params.myService+'.'+params.region+'.amazonaws.com';
          helper.awsProcessRequest(params,async function(err, responseBody){
              if(responseBody && responseBody.Response && responseBody.Response.Errors){
                  resolve([])
              }else{
                  resolve(responseBody.DescribeInstancesResponse.reservationSet[0].item[0].instancesSet[0].item[0])
              }
          })
      })
      if(vmdetail.platform[0]=='windows')
      var devices=config.WINDOWS_DEVICES
      else
      var devices=config.LINUX_DEVICES
      if(vmdetail && vmdetail.blockDeviceMapping && vmdetail.blockDeviceMapping[0].item){
          var deviceList=await new Promise(async function(resolve,reject){
              var dvlist=[];
              for await(var dv of vmdetail.blockDeviceMapping[0].item){
                  await dvlist.push(dv.deviceName[0])
              }
              resolve(dvlist)
          })
      }
     var finalDeviceArr=await devices.filter(d => !deviceList.includes(d)) 
      params.queryParams = {}
        //console.log(token)
        // let accessKey = token.tokendata.accesstoken;
        // let secretKey = token.tokendata.secretekey;
        // let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        // let serviceName = 'ec2';
        // let myMethod = 'GET';
        // params = {
        //   access_key : accessKey,
        //   secret_key : secretKey,
        //   region : regionName,
        //   myService : serviceName,
        //   myMethod : myMethod,
        //   myPath : '/'
        // }   
        // https://ec2.region.amazonaws.com/?Action=AttachVolume&Version=2016-11-15&VolumeId=vol-0201ddc9d5438b23a&
        //InstanceId=i-095afcd1e30a1cc3e&Device=/dev/sdh
        params.queryParams = {
          "Action": 'AttachVolume',
          "Device":finalDeviceArr[0],
          "InstanceId":instanceId,
          "Version":"2016-11-15",
          "VolumeId":volumeId
        };
        params.url = params.myService+'.'+params.region+'.amazonaws.com';
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.Response && responseBody.Response.Errors && responseBody.Response.Errors[0]
            && responseBody.Response.Errors[0].Error && responseBody.Response.Errors[0].Error[0]
            && responseBody.Response.Errors[0].Error[0].Message && responseBody.Response.Errors[0].Error[0].Message[0]){
        	  return callback(null,{success:0,data:responseBody.Response.Errors,message:responseBody.Response.Errors[0].Error[0].Message[0]});
          }else{
        	  let addonRegData = {
            		cloud_type: 'AWS',
            		addon_name : "Storage",
            		currency_id : currency_id
        	  };
            console.log("addonRegData");
            console.log(addonRegData);
            return ordersModel.getAddonPrice(addonRegData,function(err,AddonResult){
                if (err) {
                	return callback(err,{success:0,data:AddonResult,message:'The operation did not execute as expected. Please raise a ticket to support'});
                } else {
                	let orderRegData = {
                			order_type: 'AWS_ADDON',
                			description : "AWS Storage",
                    		clientid : clientid,
                    		reference_id : volumeId,
                    		plan_id : AddonResult.data[0].id,
                    		mrc_price : (AddonResult.data[0].price * size),
                    		vmid : vmIdFromDB,
                    		billing_location : 'AWS'
                    };
                	console.log("orderRegData");
                    console.log(orderRegData);
                	return ordersModel.CreateOrUpdateAddonInfo(orderRegData,function(err,result){
                        if (err) {
                        	return callback(err,{success:0,data:result,message:'The operation did not execute as expected. Please raise a ticket to support'});
                        } else {
                        	return callback(null,{success:1,data:responseBody,message:"AWS volume attached successfully"})
                        }
                      });
                }
            });
        	  
          }
        });
      }
    });                          
}
function getVmDetailbyId(clientid,vm_id,callback) {
  var sql=`SELECT vm.*,aws.instanceId as label_name,aws.regionName,aws.instanceId,'NA' as location from c4_vm_details as vm inner join aws_vms as aws on vm.ref_id=aws.instanceId
      WHERE vm.id=${vm_id} and vm.clientid=${clientid}`;
  //console.log(sql)
  db.query(sql,(error,rows,fields)=>{
      if(!!error) {
          dbFunc.connectionRelease;
          reject(error);
      } else {
          dbFunc.connectionRelease;
          var vminfo=rows[0]
          if(!vminfo)return callback(null,{vm:[],vm_detail:[],
            vpc_detail:[],subnet_detail:[],disk_detail:[]})
          new Promise(function(resolve,reject){
              aws_authtoken(clientid, function(error, result){
                  resolve(result)
              })
          }).then(async function(token){
              if(token.tokendata.length == 0){
                  resolve([])
              }else{
                  //console.log(token)
                  let accessKey = token.tokendata.accesstoken;
                  let secretKey = token.tokendata.secretekey;
                  let regionName =  vminfo.regionName;//'ap-southeast-2'; //
                  let serviceName = 'ec2';
                  let myMethod = 'GET';
                  params = {
                      access_key : accessKey,
                      secret_key : secretKey,
                      region : regionName,
                      myService : serviceName,
                      myMethod : myMethod,
                      myPath : '/'
                  }  
                  var vmdetail=await new Promise(function(resolve,reject){
                      params.queryParams = {
                          "Action": 'DescribeInstances',
                          "InstanceId.1":vminfo.instanceId,
                          "Version":"2016-11-15"
                      };
                      params.url = params.myService+'.'+params.region+'.amazonaws.com';
                      helper.awsProcessRequest(params,async function(err, responseBody){
                          if(responseBody && responseBody.Response && responseBody.Response.Errors){
                              resolve([])
                          }else{
                              resolve(responseBody.DescribeInstancesResponse.reservationSet[0].item[0].instancesSet[0].item[0])
                          }
                      })
                  })
                  var p1=new Promise(function(resolve,reject){
                      params.queryParams = {
                          "Action": 'DescribeVpcs',
                          "Filter.1.Name":"vpc-id",
                          "Filter.1.Value.1":vmdetail.vpcId[0],
                          "Version":"2016-11-15"
                      };
                      params.url = params.myService+'.'+params.region+'.amazonaws.com';
                      helper.awsProcessRequest(params,async function(err, responseBody){
                          if(responseBody && responseBody.Response && responseBody.Response.Errors){
                              resolve([])
                          }else{
                              resolve(responseBody.DescribeVpcsResponse.vpcSet[0].item[0])
                          }
                      })
                  })
                  var p2=new Promise(function(resolve,reject){
                      params.queryParams = {
                          "Action": 'DescribeSubnets',
                          "Filter.1.Name":"subnet-id",
                          "Filter.1.Value.1":vmdetail.subnetId[0],
                          "Version":"2016-11-15"
                      };
                      params.url = params.myService+'.'+params.region+'.amazonaws.com';
                      helper.awsProcessRequest(params,async function(err, responseBody){
                          if(responseBody && responseBody.Response && responseBody.Response.Errors){
                              resolve([])
                          }else{
                              resolve(responseBody.DescribeSubnetsResponse.subnetSet[0].item[0])
                          }
                      })
                  })
                  var p3=new Promise(async function(resolve,reject){
                    var diskList=[];
                      for await(var diskdetail of vmdetail.blockDeviceMapping[0].item)
                      {
                        var info=diskdetail.ebs[0]
                        var disk=await new Promise(function(resolve1,reject1){
                          params.queryParams = {
                              "Action": 'DescribeVolumes',
                              "Filter.1.Name":"volume-id",
                              "Filter.1.Value.1":info.volumeId[0],
                              "Version":"2016-11-15"
                          };
                          params.url = params.myService+'.'+params.region+'.amazonaws.com';
                          helper.awsProcessRequest(params,async function(err, responseBody){
                              if(responseBody && responseBody.Response && responseBody.Response.Errors){
                                  resolve1([])
                              }else{
                                  resolve1(responseBody.DescribeVolumesResponse.volumeSet[0].item[0])
                              }
                          })
                        })
                        await diskList.push(disk);
                      }
                      resolve(diskList)
                  })
                  await Promise.all([p1,p2,p3]).then(function(values) {
                      var vpc=values[0]
                      var subnet=values[1]
                      var disklist=values[2]
                      return callback(null,{vm:vminfo,vm_detail:vmdetail,
                          vpc_detail:vpc,subnet_detail:subnet,disk_detail:disklist})
                  })
              }
          })           
      }
  });
}

/*
Author: Rajesh
Descri: checkValidAwsAccessToken
Date  : 29-06-2020
*/
let checkValidAwsAccessToken= async (regData,callback)=>{
	var options={
		'clientid' : regData.clientid,
	    'aws_username': regData.aws_username,
	    'aws_ref_id': regData.aws_ref_id,
	    'aws_accesskey' : regData.aws_accesskey,
	    'aws_secretekey' : regData.aws_secretekey
	}
	await new Promise(async function(accessKeyResolve, accessKeyReject) {
		let accessKey = options.aws_accesskey;
	    let secretKey = options.aws_secretekey;
	    let regionName = ""; //'ap-southeast-2'; //regionItem.regionid;
	    let serviceName = 'iam';
	    let myMethod = 'GET';
	
	    params = {
	      access_key : accessKey,
	      secret_key : secretKey,
	      region : regionName,
	      myService : serviceName,
	      myMethod : myMethod,
	      myPath : '/'
	    }
	    params.queryParams = {
	      "Action": "ListAccessKeys",
	      "UserName" : options.aws_username,
	      "Version":"2010-05-08"
	    };
	    params.url = params.myService+'.'+((params.region != '')?(params.region+'.'):'')+'amazonaws.com';
	    await helper.awsProcessRequest(params,async function(err, responseBody){
	      // console.log("responseBody");
	      //   console.log(responseBody);
	      if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
	        console.log(responseBody.ErrorResponse.Error);
	        accessKeyResolve("Invalid token request");
	        callback(1,"Invalid token request");
	      }else{
	        // console.log("responseBody.ListAccessKeysResponse.ListAccessKeysResult[0].AccessKeyMetadata[0].member");
	        // console.log(responseBody.ListAccessKeysResponse.ListAccessKeysResult[0].AccessKeyMetadata[0].member);
	
	        if (responseBody && responseBody.ListAccessKeysResponse && 
	          responseBody.ListAccessKeysResponse.ListAccessKeysResult && 
	          responseBody.ListAccessKeysResponse.ListAccessKeysResult[0] && 
	          responseBody.ListAccessKeysResponse.ListAccessKeysResult[0].AccessKeyMetadata &&
	          responseBody.ListAccessKeysResponse.ListAccessKeysResult[0].AccessKeyMetadata[0] &&
	          responseBody.ListAccessKeysResponse.ListAccessKeysResult[0].AccessKeyMetadata[0].member &&
	          responseBody.ListAccessKeysResponse.ListAccessKeysResult[0].AccessKeyMetadata[0].member.length > 0) {
		          console.log(responseBody.ListAccessKeysResponse.ListAccessKeysResult[0].AccessKeyMetadata[0].member);
		          accessKeyResolve(responseBody.ListAccessKeysResponse.ListAccessKeysResult[0].AccessKeyMetadata[0].member);
		          callback(null,responseBody.ListAccessKeysResponse.ListAccessKeysResult[0].AccessKeyMetadata[0].member);
	        }else{
	          console.log("Invalid token request");
	          accessKeyResolve("Invalid token request");
	          callback(1,"Invalid token request");
	        }
	      }
	    });
	});
}
/*
  Author : Pradeep
  Descri: delete Vpc
  Date  : 12-06-2020
*/
let deleteVm= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    callback(1,{success:0,message:'Please provide clientid.'});
  }
  var vmId=reqObj.vmId;
  if(typeof vmId =='undefined'){
    callback(1,{success:0,message:'Please provide vm id.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
        callback(1,response);
      }else{
        let vmDetail=await new Promise(function(resolve,reject){
          var whereQry={clientid:clientid,vm_detail_id:vmId};
            dbHandler.getOneRecord('aws_vms',whereQry,function(result){
              resolve(result)
            });
        })
        if(!vmDetail){
          var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
          return callback([],response);
        }
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  vmDetail.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action":"TerminateInstances",
          "InstanceId.1":vmDetail.instanceId,
          "Version":"2016-11-15"
        };
        params.url = params.myService+'.'+params.region+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.Response && responseBody.Response.Errors){
            return callback(null,{success:0,data:responseBody.Response.Errors});
          }else{
            dbHandler.updateTableData('c4_vm_details',{id:vmId},{vm_status:'Deleted',status:0},function(err,result){
              resolve('updated')
            })
            dbHandler.updateTableData('aws_vms',{id:vmDetail.id},{vm_status:'Deleted'},function(err,result){
              resolve('updated')
            })
            return callback(null,{success:1,message:"VM Deletion request has been raised successfully."})
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: get list of user groups
  Date  : 06-07-2020
*/
let userGroups= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName = "";// reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'iam';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'ListGroups',
          "PathPrefix":'/',
          "Version":"2010-05-08"
        };
        params.url = params.myService+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.Response && responseBody.Response.Errors){
            return callback(1,{success:0,data:responseBody.Response.Errors,message:'The operation did not execute as expected. Please raise a ticket to support'});
          }else{
            if(responseBody && responseBody.ListGroupsResponse && responseBody.ListGroupsResponse.ListGroupsResult[0] && responseBody.ListGroupsResponse.ListGroupsResult[0].Groups[0])
            return callback(null,{success:1,data:responseBody.ListGroupsResponse.ListGroupsResult[0].Groups[0].member});
            else return callback(1,{success:0,data:[]})
          }
        });
      }
    });                          
}

/*
  Author : Pradeep
  Descri: create group
  Date  : 06-07-2020
*/
let createGroup= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var groupName=reqObj.groupName;
  if(typeof groupName =='undefined'){
    return callback(1,{success:0,message:'Please provide group name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName = "";// reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'iam';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'CreateGroup',
          "GroupName":groupName,
          "Version":"2010-05-08"
        };
        params.url = params.myService+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
            return callback(1,{success:0,data:[],message:responseBody.ErrorResponse.Error[0].Message[0]});
          }else{
            if(responseBody && responseBody.CreateGroupResponse && responseBody.CreateGroupResponse.CreateGroupResult && responseBody.CreateGroupResponse.CreateGroupResult[0].Group)
            return callback(null,{success:1,data:responseBody.CreateGroupResponse.CreateGroupResult[0].Group[0]});
            else return callback(1,{success:0,data:responseBody})
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: delete Group
  Date  : 06-07-2020
*/
let deleteGroup= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var groupName=reqObj.groupName;
  if(typeof groupName =='undefined'){
    return callback(1,{success:0,message:'Please provide group name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName = "";// reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'iam';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'DeleteGroup',
          "GroupName":groupName,
          "Version":"2010-05-08"
        };
        params.url = params.myService+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
            return callback(1,{success:0,data:[],message:responseBody.ErrorResponse.Error[0].Message[0]});
          }else{
            return callback(1,{success:0,data:responseBody})
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: update group
  Date  : 06-07-2020
*/
let updateGroup= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var groupName=reqObj.groupName;
  if(typeof groupName =='undefined'){
    return callback(1,{success:0,message:'Please provide group name.'});
  }
  var newGroupName=reqObj.newGroupName;
  if(typeof newGroupName =='undefined'){
    return callback(1,{success:0,message:'Please provide new group name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName = "";// reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'iam';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'UpdateGroup',
          "GroupName":groupName,
          "NewGroupName":newGroupName,
          "Version":"2010-05-08"
        };
        params.url = params.myService+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
            return callback(1,{success:0,data:[],message:responseBody.ErrorResponse.Error[0].Message[0]});
          }else{
            if(responseBody && responseBody.UpdateGroupResponse && responseBody.UpdateGroupResponse.ResponseMetadata[0])
            return callback(null,{success:1,message:'User Group Updated Successfully.'});
            else return callback(1,{success:0,data:responseBody})
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: list of users
  Date  : 06-07-2020
*/
let userList= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName = "";// reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'iam';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'ListUsers',
          "PathPrefix":'/',
          "Version":"2010-05-08"
        };
        params.url = params.myService+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
            return callback(1,{success:0,data:[],message:responseBody.ErrorResponse.Error[0].Message[0]});
          }else{
            if(responseBody && responseBody.ListUsersResponse && responseBody.ListUsersResponse.ListUsersResult[0] && responseBody.ListUsersResponse.ListUsersResult[0].Users[0]){
              var Userlist=[];
              var userArr=await new Promise(async function(Res,Rej){
                  for await(var user of responseBody.ListUsersResponse.ListUsersResult[0].Users[0].member){
                    var userGroups=await new Promise(async function(Resolve,Reject){
                      params.queryParams = {
                        "Action": "ListGroupsForUser",
                        "UserName":user.UserName[0],
                        "Version":"2010-05-08"
                      };
                      params.url = params.myService+'.amazonaws.com';
                      helper.awsProcessRequest(params,function(err, responseBody){
                        if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
                          Resolve("Not Available")
                        }else{
                          if(responseBody && responseBody.ListGroupsForUserResponse && responseBody.ListGroupsForUserResponse.ListGroupsForUserResult[0] &&
                             responseBody.ListGroupsForUserResponse.ListGroupsForUserResult[0].Groups[0].member){
                            Resolve(responseBody.ListGroupsForUserResponse.ListGroupsForUserResult[0].Groups[0].member)
                          }else{
                            Resolve("Not Available")
                          }
                        }
                      })
                    })
                    await Object.assign(user,{userGroup:userGroups})
                    await Userlist.push(user)
                  }
                  Res(Userlist)
              })
              return callback(null,{success:1,data:userArr});
            }
            else return callback(1,{success:0,data:responseBody})
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: create user
  Date  : 06-07-2020
*/
let createUser= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var userName=reqObj.userName;
  if(typeof userName =='undefined'){
    return callback(1,{success:0,message:'Please provide user name.'});
  }
  var groupName=reqObj.groupName;
  if(typeof groupName =='undefined'){
    return callback(1,{success:0,message:'Please provide group name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName = "";// reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'iam';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'CreateUser',
          "UserName":userName,
          "Version":"2010-05-08"
        };
        params.url = params.myService+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
            return callback(1,{success:0,data:[],message:responseBody.ErrorResponse.Error[0].Message[0]});
          }else{
            if(reqObj.groupName)
            {
              params.queryParams = {
                "Action": 'AddUserToGroup',
                "GroupName":groupName,
                "UserName":userName,
                "Version":"2010-05-08"
              };
              params.url = params.myService+'.amazonaws.com';
              //console.log(params);
              await helper.awsProcessRequest(params,async function(err, responseBody){
                
              });
            }
            if(responseBody && responseBody.CreateUserResponse && responseBody.CreateUserResponse.CreateUserResult[0] && responseBody.CreateUserResponse.CreateUserResult[0].User[0])
            return callback(null,{success:1,data:responseBody.CreateUserResponse.CreateUserResult[0].User[0]});
            else return callback(1,{success:0,data:responseBody})
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: add user to group
  Date  : 06-07-2020
*/
let addUserToGroup= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var userName=reqObj.userName;
  if(typeof userName =='undefined'){
    return callback(1,{success:0,message:'Please provide user name.'});
  }
  var groupName=reqObj.groupName;
  if(typeof groupName =='undefined'){
    return callback(1,{success:0,message:'Please provide group name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName = "";// reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'iam';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'AddUserToGroup',
          "GroupName":groupName,
          "UserName":userName,
          "Version":"2010-05-08"
        };
        params.url = params.myService+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
            return callback(1,{success:0,data:[],message:responseBody.ErrorResponse.Error[0].Message[0]});
          }else{
            if(responseBody && responseBody.AddUserToGroupResponse)
            return callback(null,{success:1,data:responseBody.AddUserToGroupResponse});
            else return callback(1,{success:0,data:responseBody})
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: update user
  Date  : 06-07-2020
*/
let updateUser= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var userName=reqObj.userName;
  if(typeof userName =='undefined'){
    return callback(1,{success:0,message:'Please provide user name.'});
  }
  var newUserName=reqObj.newUserName;
  if(typeof newUserName =='undefined'){
    return callback(1,{success:0,message:'Please provide new user name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName = "";// reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'iam';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'UpdateUser',
          "UserName":userName,
          "NewUserName":newUserName,
          "Version":"2010-05-08"
        };
        params.url = params.myService+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
            return callback(1,{success:0,data:[],message:responseBody.ErrorResponse.Error[0].Message[0]});
          }else{
            if(responseBody && responseBody.UpdateUserResponse && responseBody.UpdateUserResponse.ResponseMetadata[0])
            return callback(null,{success:1,message:'User Updated Successfully.'});
            else return callback(1,{success:0,data:responseBody})
          }
        });
      }
    });                          
}
let syncVmStatus=async ()=>{
  var vms=await new Promise(function(resolve,reject){
    var sql=`select * from aws_vms where vm_status not in('terminated','Deleted')`;
    
    //comment below line in live
//    sql += ` and id in (98,99)`;
    dbHandler.executeQuery(sql,function(result){
        resolve(result)
    })
  })
  for await(var vm of vms){
    await new Promise(function(resolve,reject){
      aws_authtoken(vm.clientid, function(error, result){
          resolve(result)
      })
    }).then(async function(token){
        if(token.tokendata.length == 0){
          console.log('error')
        }else{
            let accessKey = token.tokendata.accesstoken;
            let secretKey = token.tokendata.secretekey;
            let regionName =  vm.regionName;//'ap-southeast-2'; //
            let serviceName = 'ec2';
            let myMethod = 'GET';
            params = {
              access_key : accessKey,
              secret_key : secretKey,
              region : regionName,
              myService : serviceName,
              myMethod : myMethod,
              myPath : '/'
            }               
            params.queryParams = {
              "Action": 'DescribeInstanceStatus',
              "InstanceId":vm.instanceId,
              "Version":"2016-11-15"
            };
            params.url = params.myService+'.'+params.region+'.amazonaws.com';
            //console.log(params);
            await helper.awsProcessRequest(params,async function(err, responseBody){
            	console.log("responseBody");
            	console.log(responseBody);
            	console.log(JSON.stringify(responseBody));
              if(responseBody && responseBody.Response && responseBody.Response.Errors && responseBody.Response.Errors[0].Error[0] && 
                responseBody.Response.Errors[0].Error[0].Code[0]=='InvalidInstanceID.NotFound'){
                //return callback(null,{success:0,data:responseBody.Response.Errors});
                var vm_status='Deleted';
                console.log(vm.vm_name+'--'+vm_status)
                dbHandler.updateTableData('c4_vm_details',{id:vm.vm_detail_id},{vm_status:vm_status,status:0},function(err,result){
                  dbHandler.updateTableData('c4_order_details',{vmid:vm.vm_detail_id},{status:0},function(err,result){
                  })
                })
                dbHandler.updateTableData('aws_vms',{vm_detail_id:vm.vm_detail_id},{vm_status:vm_status},function(err,result){
                  
                })
              }else{
                if(responseBody && responseBody.DescribeInstanceStatusResponse && responseBody.DescribeInstanceStatusResponse.instanceStatusSet
                  && responseBody.DescribeInstanceStatusResponse.instanceStatusSet[0].item && responseBody.DescribeInstanceStatusResponse.instanceStatusSet[0].item[0].instanceState)
                {
                  var vm_status=responseBody.DescribeInstanceStatusResponse.instanceStatusSet[0].item[0].instanceState[0].name[0]
                  console.log(vm.vm_name+'--'+vm_status)
                  dbHandler.updateTableData('c4_vm_details',{id:vm.vm_detail_id},{vm_status:vm_status},function(err,result){
                    
                  })
                  dbHandler.updateTableData('aws_vms',{vm_detail_id:vm.vm_detail_id},{vm_status:vm_status},function(err,result){
                    
                  })
                }
              }
            });
          }
      }); 
    }
}
/*
  Author : Pradeep
  Descri: get available volume list
  Date  : 16-06-2020
*/
let availableVolumeList= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var regionName=reqObj.regionName;
  if(typeof regionName =='undefined'){
    return callback(1,{success:0,message:'Please provide region name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName =  reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'DescribeVolumes',
          "Version":"2016-11-15"
        };
        params.url = params.myService+'.'+params.region+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.Response && responseBody.Response.Errors){
            return callback(1,{success:0,data:responseBody.Response.Errors,message:'The operation did not execute as expected. Please raise a ticket to support'});
          }else{
            var volumeList=[]
            for await(const vol of responseBody.DescribeVolumesResponse.volumeSet[0].item){
              var arr=await new Promise(async function(resolve,reject){
                if(vol.status[0]=='available')
                {
                    resolve(vol)
                }else{
                  resolve('')
                }
              })
              if(arr)
              await volumeList.push(arr)
            }
            return callback(null,{success:1,data:volumeList});
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: policy list
  Date  : 24-07-2020
*/
let policyList= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName = "";// reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'iam';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'ListPolicies',
          "Version":"2010-05-08"
        };
        params.url = params.myService+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
            return callback(1,{success:0,data:[],message:responseBody.ErrorResponse.Error[0].Message[0]});
          }else{
            if(responseBody && responseBody.ListPoliciesResponse && responseBody.ListPoliciesResponse.ListPoliciesResult[0] && responseBody.ListPoliciesResponse.ListPoliciesResult[0].Policies[0])
            return callback(null,{success:1,data:responseBody.ListPoliciesResponse.ListPoliciesResult[0].Policies[0]});
            else return callback(1,{success:0,data:responseBody})
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: create policy
  Date  : 24-07-2020
*/
let createPolicy= async (reqObj,callback)=>{
  
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  /*var policyDocument=reqObj.policyDocument;
  if(typeof policyDocument =='undefined'){
    return callback(1,{success:0,message:'Please provide policy document.'});
  }*/
  var policyName=reqObj.policyName;
  if(typeof policyName =='undefined'){
    return callback(1,{success:0,message:'Please provide policy name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName = "";// reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'iam';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }              
        params.queryParams = {
          'Action': 'CreatePolicy',
          'PolicyDocument':{'Version':'2012-10-17','Statement':[{'Effect':'Allow','Action':'*','Resource':'*'}]},
          //'PolicyDocument':{'Version':'2012-10-17','Statement':[{'Effect':'Allow','Action':'*','Resource':'*'}]},
          'PolicyName':policyName,
          'Version':'2010-05-08'
        };
        params.url = params.myService+'.amazonaws.com';
        console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
            return callback(1,{success:0,data:[],message:responseBody.ErrorResponse.Error[0]});
            //return callback(1,{success:0,data:[],message:responseBody.ErrorResponse.Error[0].Message[0]});
          }else{
            if(responseBody && responseBody.CreatePolicyResponse && responseBody.CreatePolicyResponse.CreatePolicyResult[0] && responseBody.CreatePolicyResponse.CreatePolicyResult[0].Policy[0])
            return callback(null,{success:1,data:responseBody.CreatePolicyResponse.CreatePolicyResult[0].Policy[0]});
            else return callback(1,{success:0,data:responseBody})
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: attach user policy
  Date  : 27-07-2020
*/
let attachUserPolicy= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var userName=reqObj.userName;
  if(typeof userName =='undefined'){
    return callback(1,{success:0,message:'Please provide user name.'});
  }
  var policyName=reqObj.policyName;
  if(typeof policyName =='undefined'){
    return callback(1,{success:0,message:'Please provide policy name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName = "";// reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'iam';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }            
        params.queryParams = {
          "Action": 'AttachUserPolicy',
          "PolicyArn":`arn:aws:iam::aws:policy/${policyName}`,
          "UserName":userName,
          "Version":"2010-05-08"
        };
        params.url = params.myService+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
            return callback(1,{success:0,data:[],message:responseBody.ErrorResponse.Error[0].Message[0]});
          }else{
            if(responseBody && responseBody.AttachUserPolicyResponse && responseBody.AttachUserPolicyResponse.ResponseMetadata[0])
            return callback(null,{success:1,data:responseBody.AttachUserPolicyResponse.ResponseMetadata[0]});
            else return callback(1,{success:0,data:responseBody})
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: detach user policy
  Date  : 27-07-2020
*/
let detachUserPolicy= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var userName=reqObj.userName;
  if(typeof userName =='undefined'){
    return callback(1,{success:0,message:'Please provide user name.'});
  }
  var policyName=reqObj.policyName;
  if(typeof policyName =='undefined'){
    return callback(1,{success:0,message:'Please provide policy name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName = "";// reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'iam';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }            
        params.queryParams = {
          "Action": 'DetachUserPolicy',
          "PolicyArn":`arn:aws:iam::aws:policy/${policyName}`,
          "UserName":userName,
          "Version":"2010-05-08"
        };
        params.url = params.myService+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
            return callback(1,{success:0,data:[],message:responseBody.ErrorResponse.Error[0].Message[0]});
          }else{
            if(responseBody && responseBody.DetachUserPolicyResponse && responseBody.DetachUserPolicyResponse.ResponseMetadata[0])
            return callback(null,{success:1,data:responseBody.DetachUserPolicyResponse.ResponseMetadata[0]});
            else return callback(1,{success:0,data:responseBody})
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: get list of user groups policy
  Date  : 27-07-2020
*/
let listGroupPolicies= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var groupName=reqObj.groupName;
  if(typeof groupName =='undefined'){
    return callback(1,{success:0,message:'Please provide group name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName = "";// reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'iam';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'ListGroupPolicies',
          "GroupName":groupName,
          "Version":"2010-05-08"
        };
        params.url = params.myService+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
            return callback(1,{success:0,data:[],message:responseBody.ErrorResponse.Error[0].Message[0]});
          }else{
            if(responseBody && responseBody.ListGroupPoliciesResponse && responseBody.ListGroupPoliciesResponse.ListGroupPoliciesResult[0])
            return callback(null,{success:1,data:responseBody.ListGroupPoliciesResponse.ListGroupPoliciesResult});
            else return callback(1,{success:0,data:responseBody})
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: delete groups policy
  Date  : 27-07-2020
*/
let deleteGroupPolicy= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var groupName=reqObj.groupName;
  if(typeof groupName =='undefined'){
    return callback(1,{success:0,message:'Please provide group name.'});
  }
  var policyName=reqObj.policyName;
  if(typeof policyName =='undefined'){
    return callback(1,{success:0,message:'Please provide policy name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName = "";// reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'iam';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'DeleteGroupPolicy',
          "GroupName":groupName,
          "PolicyName":policyName,
          "Version":"2010-05-08"
        };
        params.url = params.myService+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
            return callback(1,{success:0,data:[],message:responseBody.ErrorResponse.Error[0].Message[0]});
          }else{
            if(responseBody && responseBody.ListGroupPoliciesResponse && responseBody.ListGroupPoliciesResponse.ListGroupPoliciesResult[0])
            return callback(null,{success:1,data:responseBody.ListGroupPoliciesResponse.ListGroupPoliciesResult});
            else return callback(1,{success:0,data:[]})
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: delete policy
  Date  : 27-07-2020
*/
let deletePolicy= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  var policyName=reqObj.policyName;
  if(typeof policyName =='undefined'){
    return callback(1,{success:0,message:'Please provide policy name.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName = "";// reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'iam';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'DeletePolicy',
          "PolicyArn":`arn:aws:iam::123456789012:policy/${policyName}`,
          "Version":"2010-05-08"
        };
        params.url = params.myService+'.amazonaws.com';
        //console.log(params);
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
            return callback(1,{success:0,data:[],message:responseBody.ErrorResponse.Error[0].Message[0]});
          }else{
            if(responseBody && responseBody.ListGroupPoliciesResponse && responseBody.ListGroupPoliciesResponse.ListGroupPoliciesResult[0])
            return callback(null,{success:1,data:responseBody.ListGroupPoliciesResponse.ListGroupPoliciesResult});
            else return callback(1,{success:0,data:[]})
          }
        });
      }
    });                          
}
/*
  Author : Pradeep
  Descri: getTags
  Date  : 18-01-2021
*/
let getTags= async (reqObj,callback)=>{
  var clientid=reqObj.clientid;
  if(typeof clientid =='undefined'){
    return callback(1,{success:0,message:'Please provide clientid.'});
  }
  await new Promise(function(resolve,reject){
    aws_authtoken(reqObj.clientid, function(error, result){
        resolve(result)
    })
  }).then(async function(token){
      if(token.tokendata.length == 0){
        var response={success:0,data:[],message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
      }else{
        //console.log(token)
        let accessKey = token.tokendata.accesstoken;
        let secretKey = token.tokendata.secretekey;
        let regionName = "ap-south-1";// reqObj.regionName;//'ap-southeast-2'; //
        let serviceName = 'ec2';
        let myMethod = 'GET';
        params = {
          access_key : accessKey,
          secret_key : secretKey,
          region : regionName,
          myService : serviceName,
          myMethod : myMethod,
          myPath : '/'
        }               
        params.queryParams = {
          "Action": 'DescribeTags',
          "Version":"2016-11-15"
        };
        params.url = params.myService+'.'+params.region+'.amazonaws.com';
        await helper.awsProcessRequest(params,async function(err, responseBody){
          if(responseBody && responseBody.ErrorResponse && responseBody.ErrorResponse.Error){
            return callback(1,{success:0,message:responseBody.ErrorResponse.Error[0].Message[0]});
          }else{
            let result = []
            try{
              result = await responseBody.DescribeTagsResponse.tagSet[0].item.filter(arr => arr.resourceType[0] == 'instance');
              return callback(1,{success:1,data:result})
            }catch{
              return callback(1,{success:1,data:result})
            }
          }
        });
      }
    });                          
}


async function sendAWSCostForecastMail() {

  let next_month_start = moment().clone().add(1, 'M').startOf('month').format('YYYY-MM-DD');
  let next_month_end = moment().clone().add(1, 'M').endOf('month').format('YYYY-MM-DD');
  let next_month_str = moment().clone().add(1, 'M').format('MMM');

  let sqlAwsClient = `select id, email, is_aws_enabled from c4_clients where is_aws_enabled = 1`;
  let sqlAwsClientRes = await dbHandler.executeQueryv2(sqlAwsClient, { } );

  let credentialPromise = sqlAwsClientRes.map(single_client => {
      let sql = `select * from c4_aws_client_tokens where clientid = :clientid and 
      record_status = 1 order by id asc limit 1`;
      return dbHandler.executeQueryv2(sql, { clientid: single_client.id } );
  });

  let crendentials = await Promise.all(credentialPromise);
  let credentialsList = crendentials.map((element, index) => {
    return {
      ...element[0],
      ...sqlAwsClientRes[index]
    };
  });

  let forecastPromise = credentialsList.map(single_client => {
    let costexplorer = new AWS.CostExplorer({ region: "us-east-1", accessKeyId: single_client['accesstoken'], secretAccessKey: single_client['secretekey'] });
    return awsExternalServices.getCostForecastDetails(costexplorer, next_month_start, next_month_end, {});
  });
  let forecasts = await Promise.all(forecastPromise.map(p => p.catch(e => e)));

  let output = [];

  forecasts.forEach((element, index) => { 
  
    let single_obj = {};
    single_obj['email'] = credentialsList[index]['email'];
    single_obj['total'] = '';
    single_obj['month'] = '';
    single_obj['message'] = 'mail not sent';

    if(!element['message'] && !element['code']){
        let total = `${parseFloat(element['Total']['Amount']).toFixed(2)} ${element['Total']['Unit']}`;
        let body = `<p>AWS Cost Forecast Information for ${next_month_str}:</p>
                    <br>
                    <style>
                    table, td, th {
                      border: 1px solid black;
                      padding: 5px 10px 5px 10px;
                    }
                    table {
                      border-collapse: collapse;
                    }
                    </style>
                    <table>
                      <tr>
                        <th>Service Name</th>
                        <th>${next_month_str} Cost Forecast</th>
                      </tr>
                      <tr>
                        <td style="text-align: center;">AWS Services</td>
                        <td style="text-align: center;">${total}</td>
                      </tr>
                    </table><br>
                    <p>Regards,</p>
                    <p>Cloud4c</p>`;


        single_obj['email'] = credentialsList[index]['email'];
        single_obj['total'] = total;
        single_obj['month'] = next_month_str;
        single_obj['message'] = 'sent';

        mail.mail(`AWS Cost Forecast - ${next_month_str}`, body, credentialsList[index]['email']);
      }

      output.push(single_obj);

  });
  
  return { message:'success', data : output, count: output.length, status: 200 };
}


async function sendAWSUsageForecastMail() {

  let next_month_start = moment().clone().add(1, 'M').startOf('month').format('YYYY-MM-DD');
  let next_month_end = moment().clone().add(1, 'M').endOf('month').format('YYYY-MM-DD');
  let next_month_str = moment().clone().add(1, 'M').format('MMM');

  let sqlAwsClient = `select id, email, is_aws_enabled from c4_clients where is_aws_enabled = 1`;
  let sqlAwsClientRes = await dbHandler.executeQueryv2(sqlAwsClient, { } );

  let credentialPromise = sqlAwsClientRes.map(single_client => {
      let sql = `select * from c4_aws_client_tokens where clientid = :clientid and 
      record_status = 1 order by id asc limit 1`;
      return dbHandler.executeQueryv2(sql, { clientid: single_client.id } );
  });

  let crendentials = await Promise.all(credentialPromise);
  let credentialsList = crendentials.map((element, index) => {
    return {
      ...element[0],
      ...sqlAwsClientRes[index]
    };
  });

  let forecastPromise = credentialsList.map(single_client => {
    let costexplorer = new AWS.CostExplorer({ region: "us-east-1", accessKeyId: single_client['accesstoken'], secretAccessKey: single_client['secretekey'] });
    return awsExternalServices.getUsageForecastDetails(costexplorer, next_month_start, next_month_end, {});
  });
   
  let forecasts = await Promise.all(forecastPromise.map(p => p.catch(e => e)));

  let output = [];

  forecasts.forEach((element, index) => {

    let single_obj = {};
    single_obj['email'] = credentialsList[index]['email'];
    single_obj['total'] = '';
    single_obj['month'] = '';
    single_obj['message'] = 'mail not sent';

    if(!element['message'] && !element['code']){
    let total = `${parseFloat(element['Total']['Amount']).toFixed(2)} ${element['Total']['Unit']}`;
  
    let body = `<p>AWS Usage Forecast Information for ${next_month_str}:</p>
                <br>
                <style>
                table, td, th {
                  border: 1px solid black;
                  padding: 5px 10px 5px 10px;
                }
                table {
                  border-collapse: collapse;
                }
                </style>
                <table>
                  <tr>
                    <th>Service Name</th>
                    <th>${next_month_str} Usage Forecast</th>
                  </tr>
                  <tr>
                    <td style="text-align: center;">AWS Services</td>
                    <td style="text-align: center;">${total}</td>
                  </tr>
                </table><br>
                <p>Regards,</p>
                <p>Cloud4c</p>`;

      single_obj['email'] = credentialsList[index]['email'];
      single_obj['total'] = total;
      single_obj['month'] = next_month_str;
      single_obj['message'] = 'sent';
      
      mail.mail(`AWS Usage Forecast - ${next_month_str}`, body, credentialsList[index]['email']);
    }

    output.push(single_obj);

  });
  
  return { message:'success', data : output, count: output.length, status: 200 };
}

module.exports={
    aws_authtoken,
    getVmDetailbyId,
    syncAwsServicesUsage,
    syncAwsAvailabilityZones,
    getAwsAvailabilityZones,
    syncAwsListAccessToken,
    AwsCreateAccessToken,
    AwsUpdateAccessToken,
    AwsDeleteAccessToken,
    getAwsAccessTokenLastUse,
    checkValidAwsAccessToken,
    syncAwsImages,
    syncAwsVms,
    syncInstanceTypes,
    vmOperations,
    getVpcList,
    createVpc,
    getSubnetList,
    createSubnet,
    getNetworkInterfaceList,
    createNetworkInterface,
    deleteVpc,
    deleteSubnet,
    deleteNetworkInterface,
    attachNetworkInterface,
    createVm,
    createKeyPair,
    getKeyPair,
    getAwsInstanceTypes,
    getAwsImages,
    getAwsRegions,
    getAwsVms,
    getAwsVmDetail,
    getVolumeList,
    createVolume,
    modifyVolume,
    detachVolume,
    deleteVolume,
    attachVolume,
    deleteVm,
    userGroups,
    createGroup,
    deleteGroup,
    updateGroup,
    userList,
    createUser,
    updateUser,
    addUserToGroup,
    syncVmStatus,
    availableVolumeList,
    policyList,
    createPolicy,
    deletePolicy,
    attachUserPolicy,
    detachUserPolicy,
    listGroupPolicies,
    deleteGroupPolicy,
    getTags,
    sendAWSCostForecastMail,
    sendAWSUsageForecastMail
}

