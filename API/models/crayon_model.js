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

/*
  @desc  : Get authorization token
  @author: Pradeep
  @date  : 02-12-2020
*/
let crayon_authtoken=(ClientId, callback)=>{
    let currentTime=Math.floor(Date.now() / 1000);
    let sql=`select * from crayon_auth_tokens where status=1 `;
    if(ClientId != ''){
    	sql +=` and clientId = '${ClientId}'`;
    }
    sql +=` order by id desc limit 1`;
    dbHandler.executeQuery(sql,function(results){
    if(results.length == 0)
      return callback(null,{tokendata:[],success:0,message:'Active credentials not available'});
    else if(results && results[0]['expires_on'] > currentTime)
      return callback(null,{tokendata:results[0],success:0,message:'Token Exists'});
    else{
      let options={
        grant_type:results[0].grant_type,
        username:results[0].username,
        password:results[0].password,
        scope:results[0].scope,
        clientId:results[0].clientId,
        clientSecret:results[0].clientSecret
      }
      getCrayonAccessToken(options,function(error,result){
        if (error) {
            return callback(null,{tokendata:[],success:0,message:'Error occured in token creation'})
        }else{
            let expires_on=parseInt(currentTime)+result.ExpiresIn;
            let tokendata={
              expires_on:expires_on,
              access_token:result.AccessToken
            }
            results[0].expires_on = tokendata.expires_on;
            results[0].access_token = tokendata.access_token;
            dbHandler.updateTableData('crayon_auth_tokens',{status:1},tokendata,function(err,result){
                if(err)
                  return callback(null,{tokendata:results[0],success:1,message:'The operation did not execute as expected. Please raise a ticket to support'})
                else
                return callback(null,{tokendata:results[0],success:1,message:'Token Created Successfully'})
            })
        }
      });
    }
  });
}
/*
  @desc  : Get the access token from target server
  @author: Pradeep
  @date  : 02-12-2020
*/
function getCrayonAccessToken(regData,callback){
  let options={
    grant_type:regData.grant_type,
    username:regData.username,
    password:regData.password,
    scope:regData.scope,
  }
  let basicAuth=base64.encode(`${regData.clientId}:${regData.clientSecret}`);
  let url='https://api.crayon.com/api/v1/connect/token';
  request.post({
    url:url, 
    form:options,
    headers:{'Content-Type': 'application/x-www-form-urlencoded', 
    'Accept': 'application/json', 
    'Authorization': `Basic ${basicAuth}`
    }},
    function optionalCallback(err, httpResponse, result) {
      //console.log(result);
      if(err){
        return callback(1,"Invalid token request");
      }else{
        result = JSON.parse(result);
        if(result && result.AccessToken){
          return callback(null,result);
        }else{
          return callback(1,"Invalid token request");
        }
      }
    }
  );
}
/*
  @desc  : Get client list
  @author: Pradeep
  @date  : 02-12-2020
*/
let getClientList=(callback)=>{
  new Promise(function(resolve,reject){
    crayon_authtoken('', function(error,result){
      if(error)
        return callback(400,{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'});
      else
        return resolve(result)
    })
  }).then(function(token){
    if(!token)
      return callback(400,{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'});
    var url=`${config.CRAYON.url}clients`;
    request.get({url:url, headers : {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      "Authorization" :'Bearer '+token.tokendata.access_token
      }},
      async function optionalCallback(err, httpResponse, result) {
      if (err) {
          return callback([],err);
      }else{
        let clients=JSON.parse(result);
        if(clients && clients.Items){
          for await(var val of clients.Items){
            let data={
              ClientId:val.ClientId,
              ClientName:val.ClientName
            }
            let client=await new Promise(function(resolve,reject){
              dbHandler.getOneRecord('crayon_clients',{ClientId:val.ClientId},function(result){
                resolve(result)
              })
            })
            if(client && client.ClientId){
              await dbHandler.updateTableData('crayon_clients',{id:client.id},data,function(resolve){})
            }else{
              await dbHandler.insertIntoTable('crayon_clients',data,function(resolve){})
            }
          }
        }
        return callback(null,clients);
      }
    });
  })
}
/*
  @desc  : Get organization list
  @author: Pradeep
  @date  : 02-12-2020
*/
let getOrganizationList=(callback)=>{
  new Promise(function(resolve,reject){
    crayon_authtoken('', function(error,result){
      if(error)
        return callback(400,{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'});
      else
        return resolve(result)
    })
  }).then(function(token){
    if(!token)
      return callback(400,{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'});
    var url=`${config.CRAYON.url}organizations`;
    request.get({url:url, headers : {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      "Authorization" :'Bearer '+token.tokendata.access_token
      }},
      async function optionalCallback(err, httpResponse, result) {
      if (err) {
          return callback([],err);
      }else{
        let organizations=JSON.parse(result);
        if(organizations && organizations.Items){
          for await(var val of organizations.Items){
            let data={
              clientId : token.tokendata.clientId,
              org_id:val.Id,
              Name:val.Name,
              ParentId:val.ParentId,
              CrayonCompanyName:val.CrayonCompanyName,
              AccountNumber:val.AccountNumber,
            }
            let organization=await new Promise(function(resolve,reject){
              dbHandler.getOneRecord('crayon_organizations',{org_id:val.Id},function(result){
                resolve(result)
              })
            })
            if(organization && organization.id){
              await dbHandler.updateTableData('crayon_organizations',{id:organization.id},data,function(resolve){})
            }else{
              await dbHandler.insertIntoTable('crayon_organizations',data,function(resolve){})
            }
          }
        }
        return callback(null,organizations);
      }
    });
  })
}
/*
  @desc  : Get tenant list
  @author: Pradeep
  @date  : 02-12-2020
*/
let getTenantList=(callback)=>{
  new Promise(function(resolve,reject){
    crayon_authtoken('', function(error,result){
      if(error)
        return callback(400,{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'});
      else
        return resolve(result)
    })
  }).then(async function(token){
    if(!token)
      return callback(400,{success:0,message:'Token info not found'});
    let sql=`select * from crayon_organizations`;
    let organizations=await new Promise(function(resolve,reject){
      dbHandler.executeQuery(sql,function(result){
        resolve(result)
      })
    })
    if(!organizations) return callback(400,{success:0,message:'Token info not found'});
    for await(var org of organizations)
    {
      var url=`${config.CRAYON.url}customertenants/?organizationId=${org.org_id}`;
      request.get({url:url, headers : {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        "Authorization" :'Bearer '+token.tokendata.access_token
        }},
        async function optionalCallback(err, httpResponse, result) {
        if (err) {
            return callback([],err);
        }else{
          var tenants=JSON.parse(result);
          if(tenants && tenants.Items){
            for await(var val of tenants.Items){
              var data={
                tenant_id:val.Id,
                org_id:org.org_id,
                Name:val.Name,
                PublisherCustomerId:val.PublisherCustomerId
              }
              var tenant=await new Promise(function(resolve,reject){
                dbHandler.getOneRecord('crayon_tenants',{org_id:org.org_id,tenant_id:val.Id},function(result){
                  resolve(result)
                })
              })
              if(tenant && tenant.id){
                await dbHandler.updateTableData('crayon_tenants',{id:tenant.id},data,function(resolve){})
              }else{
                await dbHandler.insertIntoTable('crayon_tenants',data,function(resolve){})
              }
            }
          }
        }
      });
    }
    return callback(200,{success:1,message:'Success'});
  })
}
/*
  @desc  : Get subscription list
  @author: Pradeep
  @date  : 02-12-2020
*/
let getSubscriptionList=(callback)=>{
  new Promise(function(resolve,reject){
    crayon_authtoken('', function(error,result){
      if(error)
        return callback(400,{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'});
      else
        return resolve(result)
    })
  }).then(async function(token){
    if(!token)
      return callback(400,{success:0,message:'Token info not found'});
    let sql=`select * from crayon_tenants`;
    let tenants=await new Promise(function(resolve,reject){
      dbHandler.executeQuery(sql,function(result){
        resolve(result)
      })
    })
    if(!tenants) return callback(400,{success:0,message:'Token info not found'});
    for await(var org of tenants)
    {
    	console.log("org");
        console.log(org);
        await new Promise(async function(count_resolve, count_reject) {
	      var url=`${config.CRAYON.url}subscriptions/?organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`;
	      await request.get({url:url, headers : {
	        'Accept': 'application/json',
	        'Content-Type': 'application/json',
	        "Authorization" :'Bearer '+token.tokendata.access_token
	        }},
	        async function optionalCallback(err, httpResponse, result) {
	        if (err) {
	        	console.log(err);
	        	console.log(`error for organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`);
	 		   count_resolve(`error for organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`);
//	            return callback([],err);
	        }else{
	        	console.log("subscriptions");
	            console.log(result);
	          var subscriptions=JSON.parse(result);
	          if(subscriptions && subscriptions.Items){
//	            await new Promise(async function(resolve,reject){
	              for await(var val of subscriptions.Items){
	                await new Promise(async function(rs,rj){
		                var data={
		                    PublisherCustomerId:org.PublisherCustomerId,
		                    tenant_id:org.tenant_id,
		                    org_id:org.org_id,
		                    subscriptionId:val.Id,
		                    PublisherSubscriptionId:val.PublisherSubscriptionId,
		                    EntitlementId:val.EntitlementId
		                }
	                    dbHandler.getOneRecord('crayon_subscriptions',{org_id:org.org_id,PublisherCustomerId:org.PublisherCustomerId,subscriptionId:val.Id},async function(subscription){
	                    	console.log("subscription");
	        	            console.log(subscription);
	                    	if(subscription && subscription.id){
	    	                    await dbHandler.updateTableData('crayon_subscriptions',{id:subscription.id},data,function(response){
	    	                    	rs(response)
    	                    	})
	    	                }else{
	    	                    await dbHandler.insertIntoTable('crayon_subscriptions',data,function(response){
	    	                    	rs(response)
    	                    	})
	    	                }
	                    })
	                });
	              }
	              
//	              resolve(response);
//	            })
	            console.log(`Updated for organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`);
	 		   	count_resolve(`Updated for organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`);
	          }
	        }
	      });
        });
    }
    return callback(200,{success:1,message:'Success'});
  })
}

/*
@desc: sync Crayon Usage data
@author: Rajesh
@date  : 07-12-2020
*/
let syncCrayonUsageData= async (reqObj,callback)=>{
	let current_date = dateFormat(new Date(),"yyyy-mm-dd");
	let cts = Math.round(new Date().getTime() / 1000);    
//  console.log(reqObj);
	let sql=`select b.*,c.currency_code as currencyCode, o.clientId as orgClientId, b.projectId as tenant_id, t.org_id from c4_other_cloud_budgets as b 
	inner join c4_currencies as c on c.id = b.currency_id
	inner join crayon_tenants as t on t.tenant_id = b.projectId
	inner join crayon_organizations as o on o.org_id = t.org_id
	where b.cloud_id = ${config.CRAYON.cloudid} `;
	if(typeof reqObj.clientid != 'undefined'){
	      sql += ` and b.clientid = ${reqObj.clientid} order by id desc limit 1`;
	}else{
	      sql += ` order by id asc`;
	}
	console.log(sql);
	await new Promise(function(resolve, reject) {
		dbHandler.executeQuery(sql,async function(CrayonsData){
         console.log("CrayonsData");
         console.log(CrayonsData);
//           return callback(null,"enteredddd");
         try{
              if (CrayonsData.length > 0) {
                  for await (const item of CrayonsData) {
                       console.log("item");
                       console.log(item);
                      var orgClientId=item.orgClientId;
                      let start_date ='';
                      let end_date = '';
                  	  let count_sql = `Select count(DISTINCT(cu.usage_date)) as cnt from crayon_usage_data as cu
                    	  where cu.org_id = '${item.org_id}' and cu.tenant_id = '${item.tenant_id}'
                    	  and cu.usage_date >= '${item.service_start_date}' and cu.usage_date <= '${current_date}'`;
                	  console.log(count_sql);
                  	  await new Promise(async function(count_resolve, count_reject) {
                          dbHandler.executeQuery(count_sql,async function(count_data){
                	           console.log("count_data");
                	           console.log(count_data);
                	           var date1 = new Date(item.service_start_date); 
                	           var date2 = new Date(current_date); 
                	             
                	           // To calculate the time difference of two dates 
                	           var Difference_In_Time = date2.getTime() - date1.getTime(); 
                	             
                	           // To calculate the no. of days between two dates 
                	           var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24); 
//                	           if(1){
                	           if(count_data[0].cnt == (Difference_In_Days - 1)){
                	           	  start_date = dateFormat(new Date(new Date().setDate(new Date().getDate()-1)),"yyyy-mm-dd");
                	           	  end_date = current_date;
                	           
//                  	        	 start_date = "2020-11-06";
//                  	        	 end_date = "2020-11-07";
                	        	 
			                      new Promise(function(resolve,reject){
			                	    crayon_authtoken('', function(error,result){
//			                	      if(error)
//			                	        return callback(400,{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'});
//			                	      else
			                	        return resolve(result)
			                	    })
			                	  }).then(async function(token){
			                	    if(!token){
			                	      return callback(400,{success:0,message:'Token info not found'});
			                	    }
			                	    let sql=`SELECT s.* FROM crayon_subscriptions as s 
			                	    WHERE s.org_id = '${item.org_id}' and s.tenant_id = '${item.tenant_id}'`;
				  	                if(typeof reqObj.PublisherSubscriptionId != 'undefined'){
				  	              	      sql += ` and s.PublisherSubscriptionId = '${reqObj.PublisherSubscriptionId}'`;
				  	                }
				  	                console.log("sql");
				  	                console.log(sql);
			                	    let subs=await new Promise(function(resolve,reject){
			                	      dbHandler.executeQuery(sql,function(result){
			                	        resolve(result)
			                	      })
			                	    })
			                	    if(!subs) return callback(400,{success:0,message:'subsriptions info not found'});
			                	    for await(var org of subs)
			                	    {
			                	    	console.log("org");
			                	        console.log(org);
			                	        await new Promise(async function(orgSubscriptionResolve, orgSubscriptionReject) {
			                		      var url=`${config.CRAYON.url}usagecost/resellerCustomer/${org.tenant_id}/subscription/${org.PublisherSubscriptionId}/currency/${item.currencyCode}/?from=${start_date}T00:00:00.8964818Z&to=${end_date}T00:00:00.8964818Z`;
			                		      let headers = {
				                		        'Accept': 'application/json',
				                		        'Content-Type': 'application/json',
				                		        "Authorization" :'Bearer '+token.tokendata.access_token
				                		        }
			                		      console.log("url");
				                	        console.log(url);
//				                	        console.log("headers");
//				                	        console.log(headers);
			                		      await request.get({url:url, headers : headers},
			                		        async function optionalCallback(err, httpResponse, result) {
			                		        if (err) {
			                		        	console.log(err);
			                		        	console.log(`error for organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`);
			                		 		   count_resolve(`error for organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`);
			//                		            return callback([],err);
			                		        }else{
			                		        	console.log("usage by categories");
			                		            console.log(result);
			                		          var categories=JSON.parse(result);
			                		          if(categories && categories.Items){
			                		        	  if(categories.Items.length == 0){
  			                		        		  var insData={
      			                		                    org_id : org.org_id,
      			                		                    tenant_id : org.tenant_id,
      			                		                    PublisherCustomerId : org.PublisherCustomerId,
      			                		                    subscriptionId : org.subscriptionId,
      			                		                    PublisherSubscriptionId : org.PublisherSubscriptionId,
      			                		                    Amount : 0,
      			                		                    Currency : item.currencyCode,
      			                		                    usage_date : start_date,
      			                		                    created_date : cts
      			                		                  }
//		  			                		                console.log("insData");
//  			                		                		console.log(insData);
		  			                		                await dbHandler.insertIntoTable('crayon_usage_data',insData,function(err, response){
		  			                		                	if(err){
		  			                		                		console.log("insData");
		  			                		                		console.log(insData);
		  			                		                	}
			  			                		              let msg= `Updated for tenant_id=${org.tenant_id}&subscription=${org.PublisherSubscriptionId}`;
	         				                		          console.log(msg);
	         				                		          orgSubscriptionResolve(msg);
	  			                		                	})
  			                		        	  }else{
				                		              for await(var categoryVal of categories.Items){
				                		                await new Promise(async function(categoryValrs,categoryValrj){
				                		                  var url=`${config.CRAYON.url}usagecost/resellerCustomer/${org.tenant_id}/subscription/${org.PublisherSubscriptionId}/category/${categoryVal.Category}/currency/${item.currencyCode}/?from=${start_date}T00:00:00.8964818Z&to=${end_date}T00:00:00.8964818Z`;
				  			                		      let headers = {
				  				                		        'Accept': 'application/json',
				  				                		        'Content-Type': 'application/json',
				  				                		        "Authorization" :'Bearer '+token.tokendata.access_token
				  				                		        }
				  			                		      console.log("url");
				  				                	        console.log(url);
	//			  				                	        console.log("headers");
	//			  				                	        console.log(headers);
				  			                		      await request.get({url:url, headers : headers},
				  			                		        async function optionalCallback(err, httpResponse, result) {
				  			                		        if (err) {
				  			                		        	console.log(err);
				  			                		        	console.log(`error for organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`);
				  			                		        	categoryValrs(`error for organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`);
				  			//                		            return callback([],err);
				  			                		        }else{
				  			                		        	console.log("usage by sub categories");
				  			                		            console.log(result);
				  			                		          var subCategories=JSON.parse(result);
				  			                		          if(subCategories && subCategories.Items){
				  			                		              for await(var subCategoryVal of subCategories.Items){
				  			                		                await new Promise(async function(subCategoryrs,subCategoryrj){
				  			                		                	if(subCategoryVal.Subcategory == 'Not specified'){
				  			                		                		var insData={
	        		        			                		                    org_id : org.org_id,
	        		        			                		                    tenant_id : org.tenant_id,
	        		        			                		                    PublisherCustomerId : org.PublisherCustomerId,
	        		        			                		                    subscriptionId : org.subscriptionId,
	        		        			                		                    PublisherSubscriptionId : org.PublisherSubscriptionId,
	        		        			                		                    Category : categoryVal.Category,
	        		        			                		                    Subcategory : subCategoryVal.Subcategory,
	        		        			                		                    Amount : subCategoryVal.Amount,
	        		        			                		                    Currency : subCategoryVal.CurrencyCode,
	        		        			                		                    usage_date : start_date,
	        		        			                		                    created_date : cts
	        		        			                		                  }
				  			  			                		                console.log("insData");
		  			  			                		                		console.log(insData);
				  			  			                		                await dbHandler.insertIntoTable('crayon_usage_data',insData,function(err, response){
				  			  			                		                	if(err){
				  			  			                		                		console.log("insData");
				  			  			                		                		console.log(insData);
				  			  			                		                	}
				  			  			                		                subCategoryrs(response)
			  			  			                		                	})
				  			                		                	}else{
				  			                		                	  var url=`${config.CRAYON.url}usagecost/resellerCustomer/${org.tenant_id}/subscription/${org.PublisherSubscriptionId}/category/${categoryVal.Category}/subcategory/${subCategoryVal.Subcategory}/currency/${item.currencyCode}/?from=${start_date}T00:00:00.8964818Z&to=${end_date}T00:00:00.8964818Z`;
					  			  			                		      let headers = {
					  			  				                		        'Accept': 'application/json',
					  			  				                		        'Content-Type': 'application/json',
					  			  				                		        "Authorization" :'Bearer '+token.tokendata.access_token
					  			  				                		        }
					  			  			                		      console.log("url");
					  			  				                	        console.log(url);
	//				  			  				                	        console.log("headers");
	//				  			  				                	        console.log(headers);
					  			  			                		      await request.get({url:url, headers : headers},
					  			  			                		        async function optionalCallback(err, httpResponse, result) {
					  			  			                		        if (err) {
					  			  			                		        	console.log(err);
					  			  			                		        	console.log(`error for organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`);
					  			  			                		        	categoryValrs(`error for organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`);
					  			  			//                		            return callback([],err);
					  			  			                		        }else{
					  			  			                		        	console.log("usage by sub category meters");
					  			  			                		            console.log(result);
						  			  			                		        if(!result){
	  				  			  			                		            	var insData={
	              		        			                		                    org_id : org.org_id,
	              		        			                		                    tenant_id : org.tenant_id,
	              		        			                		                    PublisherCustomerId : org.PublisherCustomerId,
	              		        			                		                    subscriptionId : org.subscriptionId,
	              		        			                		                    PublisherSubscriptionId : org.PublisherSubscriptionId,
	              		        			                		                    Category : categoryVal.Category,
	              		        			                		                    Subcategory : subCategoryVal.Subcategory,
	              		        			                		                    Amount : subCategoryVal.Amount,
	              		        			                		                    Currency : subCategoryVal.CurrencyCode,
	              		        			                		                    usage_date : start_date,
	              		        			                		                    created_date : cts
	              		        			                		                  }
	//      			  			  			                		                console.log("insData");
	//      	  			  			                		                		console.log(insData);
	      			  			  			                		                await dbHandler.insertIntoTable('crayon_usage_data',insData,function(err, response){
	      			  			  			                		                	if(err){
	      			  			  			                		                		console.log("insData");
	      			  			  			                		                		console.log(insData);
	      			  			  			                		                	}
	      			  			  			                		                	subCategoryrs(response)
	      		  			  			                		                	})
	  				  			  			                		            }else{
						  			  			                		          var subCategoryMeters=JSON.parse(result);
						  			  			                		          if(subCategoryMeters && subCategoryMeters.Items){
						  			  			                		              for await(var subCategoryMeterVal of subCategoryMeters.Items){
						  			  			                		                await new Promise(async function(subCategoryMeterRs,subCategoryMeterRj){
							  			  			                		                var insData={
				        		        			                		                    org_id : org.org_id,
				        		        			                		                    tenant_id : org.tenant_id,
				        		        			                		                    PublisherCustomerId : org.PublisherCustomerId,
				        		        			                		                    subscriptionId : org.subscriptionId,
				        		        			                		                    PublisherSubscriptionId : org.PublisherSubscriptionId,
				        		        			                		                    Category : categoryVal.Category,
				        		        			                		                    Subcategory : subCategoryVal.Subcategory,
				        		        			                		                    Meter : subCategoryMeterVal.Meter,
				        		        			                		                    Amount : subCategoryMeterVal.Amount,
				        		        			                		                    Currency : subCategoryMeterVal.CurrencyCode,
				        		        			                		                    usage_date : start_date,
				        		        			                		                    created_date : cts
				        		        			                		                  }
							  			  			                		                console.log("insData");
					  			  			                		                		console.log(insData);
							  			  			                		                await dbHandler.insertIntoTable('crayon_usage_data',insData,function(err, response){
							  			  			                		                	if(err){
							  			  			                		                		console.log("insData");
							  			  			                		                		console.log(insData);
							  			  			                		                	}
							  			  			                		                	subCategoryMeterRs(response)
						  			  			                		                	})
						  			  			                		                })
						  						                		              }
						  			  			                		              let msg= `Updated for tenant_id=${org.tenant_id}&subscription=${org.PublisherSubscriptionId}&category=${categoryVal.Category}&subcategory=${subCategoryVal.Subcategory}`;
						  			  			                		              console.log(msg);
						  			  			                		              subCategoryrs(msg);
						  						                		          }
	  				  			  			                		            }
					  						                		        }
					  						                		      });
				  			                		                	}
				  			                		                })
							                		              }
				  			                		              let msg= `Updated for tenant_id=${org.tenant_id}&subscription=${org.PublisherSubscriptionId}&category=${categoryVal.Category}`;
							                		            console.log(msg);
							                		            categoryValrs(msg);
							                		          }
							                		        }
							                		      });
				                		                })
				                		              }
				                		              let msg= `Updated for tenant_id=${org.tenant_id}&subscription=${org.PublisherSubscriptionId}`;
					                		          console.log(msg);
					                		          orgSubscriptionResolve(msg);
  			                		        	  }
			                		          }
			                		        }
			                		      });
			                	        });
			                	    }
			                	    let msg= `Updated for date=${start_date} tenant_id=${org.tenant_id}&subscription=${org.PublisherSubscriptionId}`;
                		            console.log(msg);
            		                count_resolve(msg);
			                	  })
                	           }else{
                	        	   let dates_sql = `Select cu.usage_date from crayon_usage_data as cu
                                   	  where cu.org_id = ${item.org_id} and cu.tenant_id = '${item.tenant_id}'
                 	        		  and cu.usage_date >= '${item.service_start_date}' and cu.usage_date <= '${current_date}'`;
                 	        	   dates_sql += ` group by cu.usage_date`;
                                   	  //console.log(dates_sql);
 	                              await new Promise(async function(dates_resolve, dates_reject) {
 	                                    dbHandler.executeQuery(dates_sql,async function(dates_data){
     	                              		dates_list = [];
         	                              	await dates_data.forEach(async function(val,key) {
         	                              		dates_list.push(val.usage_date);
         	                              	});
             	                            //console.log("dates_list");
         	                              	//console.log(dates_list);
 		                	        	   let daysList = await helper.getArrFromNo(Difference_In_Days);
 		                	        	   for await (const dayNo of daysList) {
 		                	        		   start_date = dateFormat(new Date(new Date().setDate(new Date().getDate()-(Difference_In_Days-dayNo))),"yyyy-mm-dd");
 		                    	        	   end_date = dateFormat(new Date(new Date().setDate(new Date().getDate()-(Difference_In_Days-dayNo-1))),"yyyy-mm-dd");;
 		                    	        	   console.log("start_date "+start_date+" -- end_date "+end_date);
 		                    	        	   if(dates_list.indexOf(start_date) < 0){
 		                    	        		  await new Promise(function(resolve1,reject1){
 		         			                	    crayon_authtoken('', function(error,result){
// 		         			                	      if(error)
// 		         			                	        return callback(400,{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'});
// 		         			                	      else
 		         			                	        return resolve1(result)
 		         			                	    })
 		         			                	  }).then(async function(token){
 		         			                	    if(!token){
 		         			                	      return callback(400,{success:0,message:'Token info not found'});
 		         			                	    }
 		         			                	    let sql=`SELECT s.* FROM crayon_subscriptions as s 
 		         				                	    WHERE s.org_id = '${item.org_id}' and s.tenant_id = '${item.tenant_id}'`;
 		         				  	                if(typeof reqObj.PublisherSubscriptionId != 'undefined'){
 		         				  	              	      sql += ` and s.PublisherSubscriptionId = '${reqObj.PublisherSubscriptionId}'`;
 		         				  	                }
 		         				  	                console.log("sql");
 		         				  	                console.log(sql);
 		         			                	    let subs=await new Promise(function(querySubResolve,querySubReject){
 		         			                	      dbHandler.executeQuery(sql,async function(subs){
	 		         			                	    for await(var org of subs)
	 		         			                	    {
	 		         			                	    	console.log("org");
	 		         			                	        console.log(org);
	 		         			                	        await new Promise(async function(orgSubscriptionResolve, orgSubscriptionReject) {
	 		         			                		      var url=`${config.CRAYON.url}usagecost/resellerCustomer/${org.tenant_id}/subscription/${org.PublisherSubscriptionId}/currency/${item.currencyCode}/?from=${start_date}T00:00:00.8964818Z&to=${end_date}T00:00:00.8964818Z`;
	 		         			                		      let headers = {
	 		         				                		        'Accept': 'application/json',
	 		         				                		        'Content-Type': 'application/json',
	 		         				                		        "Authorization" :'Bearer '+token.tokendata.access_token
	 		         				                		        }
	 		         			                		      console.log("url");
	 		         				                	        console.log(url);
	// 		         				                	        console.log("headers");
	// 		         				                	        console.log(headers);
	 		         			                		      await request.get({url:url, headers : headers},
	 		         			                		        async function optionalCallback(err, httpResponse, result) {
	 		         			                		        if (err) {
	 		         			                		        	console.log(err);
	 		         			                		        	console.log(`error for organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`);
	 		         			                		 		   count_resolve(`error for organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`);
	 		         			//                		            return callback([],err);
	 		         			                		        }else{
	 		         			                		        	console.log("usage by categories");
	 		         			                		            console.log(result);
	 		         			                		          var categories=JSON.parse(result);
	 		         			                		          if(categories && categories.Items){
	 		         			                		        	  if(categories.Items.length == 0){
	 		         			                		        		  var insData={
          		        			                		                    org_id : org.org_id,
          		        			                		                    tenant_id : org.tenant_id,
          		        			                		                    PublisherCustomerId : org.PublisherCustomerId,
          		        			                		                    subscriptionId : org.subscriptionId,
          		        			                		                    PublisherSubscriptionId : org.PublisherSubscriptionId,
          		        			                		                    Amount : 0,
          		        			                		                    Currency : item.currencyCode,
          		        			                		                    usage_date : start_date,
          		        			                		                    created_date : cts
          		        			                		                  }
//  			  			  			                		                console.log("insData");
//  	  			  			                		                		console.log(insData);
  			  			  			                		                await dbHandler.insertIntoTable('crayon_usage_data',insData,function(err, response){
  			  			  			                		                	if(err){
  			  			  			                		                		console.log("insData");
  			  			  			                		                		console.log(insData);
  			  			  			                		                	}
	  			  			  			                		              let msg= `Updated for tenant_id=${org.tenant_id}&subscription=${org.PublisherSubscriptionId}`;
	  		 		         				                		          console.log(msg);
	  		 		         				                		          orgSubscriptionResolve(msg);
  		  			  			                		                	})
	 		         			                		        	  }else{
		 		         			                		              for await(var categoryVal of categories.Items){
		 		         			                		                await new Promise(async function(categoryValrs,categoryValrj){
		 		         			                		                  var url=`${config.CRAYON.url}usagecost/resellerCustomer/${org.tenant_id}/subscription/${org.PublisherSubscriptionId}/category/${categoryVal.Category}/currency/${item.currencyCode}/?from=${start_date}T00:00:00.8964818Z&to=${end_date}T00:00:00.8964818Z`;
		 		         			  			                		      let headers = {
		 		         			  				                		        'Accept': 'application/json',
		 		         			  				                		        'Content-Type': 'application/json',
		 		         			  				                		        "Authorization" :'Bearer '+token.tokendata.access_token
		 		         			  				                		        }
		 		         			  			                		      console.log("url");
		 		         			  				                	        console.log(url);
		// 		         			  				                	        console.log("headers");
		// 		         			  				                	        console.log(headers);
		 		         			  			                		      await request.get({url:url, headers : headers},
		 		         			  			                		        async function optionalCallback(err, httpResponse, result) {
		 		         			  			                		        if (err) {
		 		         			  			                		        	console.log(err);
		 		         			  			                		        	console.log(`error for organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`);
		 		         			  			                		        	categoryValrs(`error for organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`);
		 		         			  			//                		            return callback([],err);
		 		         			  			                		        }else{
		 		         			  			                		        	console.log("usage by sub categories");
		 		         			  			                		            console.log(result);
		 		         			  			                		          var subCategories=JSON.parse(result);
		 		         			  			                		          if(subCategories && subCategories.Items){
		 		         			  			                		              for await(var subCategoryVal of subCategories.Items){
		 		         			  			                		                await new Promise(async function(subCategoryrs,subCategoryrj){
		 		         			  			                		                	if(subCategoryVal.Subcategory == 'Not specified'){
		 		         			  			                		                		var insData={
		 		                 		        			                		                    org_id : org.org_id,
		 		                 		        			                		                    tenant_id : org.tenant_id,
		 		                 		        			                		                    PublisherCustomerId : org.PublisherCustomerId,
		 		                 		        			                		                    subscriptionId : org.subscriptionId,
		 		                 		        			                		                    PublisherSubscriptionId : org.PublisherSubscriptionId,
		 		                 		        			                		                    Category : categoryVal.Category,
		 		                 		        			                		                    Subcategory : subCategoryVal.Subcategory,
		 		                 		        			                		                    Amount : subCategoryVal.Amount,
		 		                 		        			                		                    Currency : subCategoryVal.CurrencyCode,
		 		                 		        			                		                    usage_date : start_date,
		 		                 		        			                		                    created_date : cts
		 		                 		        			                		                  }
//		 		         			  			  			                		                console.log("insData");
//		 		         	  			  			                		                		console.log(insData);
		 		         			  			  			                		                await dbHandler.insertIntoTable('crayon_usage_data',insData,function(err, response){
		 		         			  			  			                		                	if(err){
		 		         			  			  			                		                		console.log("insData");
		 		         			  			  			                		                		console.log(insData);
		 		         			  			  			                		                	}
		 		         			  			  			                		                	subCategoryrs(response)
		 		         		  			  			                		                	})
		 		         			  			                		                	}else{
		 		         			  			                		                	  var url=`${config.CRAYON.url}usagecost/resellerCustomer/${org.tenant_id}/subscription/${org.PublisherSubscriptionId}/category/${categoryVal.Category}/subcategory/${subCategoryVal.Subcategory}/currency/${item.currencyCode}/?from=${start_date}T00:00:00.8964818Z&to=${end_date}T00:00:00.8964818Z`;
		 		         				  			  			                		      let headers = {
		 		         				  			  				                		        'Accept': 'application/json',
		 		         				  			  				                		        'Content-Type': 'application/json',
		 		         				  			  				                		        "Authorization" :'Bearer '+token.tokendata.access_token
		 		         				  			  				                		        }
		 		         				  			  			                		      console.log("url");
		 		         				  			  				                	        console.log(url);
		// 		         				  			  				                	        console.log("headers");
		// 		         				  			  				                	        console.log(headers);
		 		         				  			  			                		      await request.get({url:url, headers : headers},
		 		         				  			  			                		        async function optionalCallback(err, httpResponse, result) {
		 		         				  			  			                		        if (err) {
		 		         				  			  			                		        	console.log(err);
		 		         				  			  			                		        	console.log(`error for organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`);
		 		         				  			  			                		        	categoryValrs(`error for organizationId=${org.org_id}&publisherCustomerId=${org.PublisherCustomerId}`);
		 		         				  			  			//                		            return callback([],err);
		 		         				  			  			                		        }else{
		 		         				  			  			                		        	console.log("usage by sub category meters");
		 		         				  			  			                		            console.log(result);
		 		         				  			  			                		            if(!result){
		 		         				  			  			                		            	var insData={
			 		                 		        			                		                    org_id : org.org_id,
			 		                 		        			                		                    tenant_id : org.tenant_id,
			 		                 		        			                		                    PublisherCustomerId : org.PublisherCustomerId,
			 		                 		        			                		                    subscriptionId : org.subscriptionId,
			 		                 		        			                		                    PublisherSubscriptionId : org.PublisherSubscriptionId,
			 		                 		        			                		                    Category : categoryVal.Category,
			 		                 		        			                		                    Subcategory : subCategoryVal.Subcategory,
			 		                 		        			                		                    Amount : subCategoryVal.Amount,
			 		                 		        			                		                    Currency : subCategoryVal.CurrencyCode,
			 		                 		        			                		                    usage_date : start_date,
			 		                 		        			                		                    created_date : cts
			 		                 		        			                		                  }
//			 		         			  			  			                		                console.log("insData");
//			 		         	  			  			                		                		console.log(insData);
			 		         			  			  			                		                await dbHandler.insertIntoTable('crayon_usage_data',insData,function(err, response){
			 		         			  			  			                		                	if(err){
			 		         			  			  			                		                		console.log("insData");
			 		         			  			  			                		                		console.log(insData);
			 		         			  			  			                		                	}
			 		         			  			  			                		                	subCategoryrs(response)
			 		         		  			  			                		                	})
		 		         				  			  			                		            }else{
			 		         				  			  			                		          var subCategoryMeters=JSON.parse(result);
			 		         				  			  			                		          if(subCategoryMeters && subCategoryMeters.Items){
			 		         				  			  			                		              for await(var subCategoryMeterVal of subCategoryMeters.Items){
			 		         				  			  			                		                await new Promise(async function(subCategoryMeterRs,subCategoryMeterRj){
			 		         					  			  			                		                var insData={
			 		         		        		        			                		                    org_id : org.org_id,
			 		         		        		        			                		                    tenant_id : org.tenant_id,
			 		         		        		        			                		                    PublisherCustomerId : org.PublisherCustomerId,
			 		         		        		        			                		                    subscriptionId : org.subscriptionId,
			 		         		        		        			                		                    PublisherSubscriptionId : org.PublisherSubscriptionId,
			 		         		        		        			                		                    Category : categoryVal.Category,
			 		         		        		        			                		                    Subcategory : subCategoryVal.Subcategory,
			 		         		        		        			                		                    Meter : subCategoryMeterVal.Meter,
			 		         		        		        			                		                    Amount : subCategoryMeterVal.Amount,
			 		         		        		        			                		                    Currency : subCategoryMeterVal.CurrencyCode,
			 		         		        		        			                		                    usage_date : start_date,
			 		         		        		        			                		                    created_date : cts
			 		         		        		        			                		                  }
	//		 		         					  			  			                		                console.log("insData");
	//		 		         			  			  			                		                		console.log(insData);
			 		         					  			  			                		                await dbHandler.insertIntoTable('crayon_usage_data',insData,function(err, response){
			 		         					  			  			                		                	if(err){
			 		         					  			  			                		                		console.log("insData");
			 		         					  			  			                		                		console.log(insData);
			 		         					  			  			                		                	}
			 		         					  			  			                		                	subCategoryMeterRs(response)
			 		         				  			  			                		                	})
			 		         				  			  			                		                })
			 		         				  						                		              }
			 		         				  			  			                		              let msg= `Updated for tenant_id=${org.tenant_id}&subscription=${org.PublisherSubscriptionId}&category=${categoryVal.Category}&subcategory=${subCategoryVal.Subcategory}`;
			 		         				  			  			                		              console.log(msg);
			 		         				  			  			                		              subCategoryrs(msg);
			 		         				  						                		          }
		 		         				  			  			                		            }
		 		         				  						                		        }
		 		         				  						                		      });
		 		         			  			                		                	}
		 		         			  			                		                })
		 		         						                		              }
		 		         			  			                		              let msg= `Updated for tenant_id=${org.tenant_id}&subscription=${org.PublisherSubscriptionId}&category=${categoryVal.Category}`;
		 		         						                		            console.log(msg);
		 		         						                		            categoryValrs(msg);
		 		         						                		          }
		 		         						                		        }
		 		         						                		      });
		 		         			                		                })
		 		         			                		              }
		 		         			                		              let msg= `Updated for tenant_id=${org.tenant_id}&subscription=${org.PublisherSubscriptionId}`;
		 		         				                		          console.log(msg);
		 		         				                		          orgSubscriptionResolve(msg);
	 		         			                		        	  }
	 		         			                		          }
	 		         			                		        }
	 		         			                		      });
	 		         			                	        });
	 		         			                	    }
	 		         			                	    let msg= `Updated for orgClientId=${orgClientId}`;
	 		         			                	    console.log(msg);
	 		         			                	    querySubResolve(msg);
 		         			                	      });
 		         			                	    });
 		         			                	    let msg= `Updated for date=${start_date} org_id=${item.org_id}`;
 		                         		            console.log(msg);
 		                     		                count_resolve(msg);
 		         			                	  })
 		                    	        	   }else{
		                    	        		   
		                    	        	   }
		                	        	   }
		                	        	   console.log("dates resolve");
                                 		   dates_resolve("dates resolve");
                                 		  let msg= `Updated for org_id = ${item.org_id} `;
		                	        	   console.log(msg);
		                	        	   count_resolve(msg);
	                                    });
	                              });
                	           }
                          });
                  	  });
                  }
                  let msg= `Updated usage data for all crayon clients`;
                  console.log(msg);
                  callback(null,{message: msg});
                  resolve({message: msg});
              }else{
            	  let msg= `No clients available to update the Crayons Usage`;
            	  console.log(msg);
                  callback(null,{message: msg});
                  resolve({message: msg});
              }
         }
         catch{
             resolve(0);
         }
    });
	});
}
module.exports={
    crayon_authtoken,
    getCrayonAccessToken,
    getClientList,
    getOrganizationList,
    getTenantList,
    getSubscriptionList,
    syncCrayonUsageData
}

