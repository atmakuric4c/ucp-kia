const dbHandler = require('../config/api_db_handler')
var db = require('../config/database');
var dbFunc = require('../config/db-function');
const helper = require('../helpers/common_helper');
const axios = require('axios');
const in_array = require('in_array');
const dateFormat = require('dateformat');
const request = require('request');
const querystring = require('querystring');
const config = require('../config/constants');
var base64 = require('base-64');
const jenkinsapi = require('node-jenkins-api');
const fetch = require('node-fetch');
const ucpEncryptDecrypt = require('../config/ucpEncryptDecrypt');
const { password } = require('../config/constants');
const qs = require('qs');
const fs = require('fs');
const cmdbModel = require('./cmdb_model');
const env = require('../config/env');
const moment = require('moment');
const commonModel = require('../app/models/common.model');
var mail = require("../common/mailer.js");
const https = require('https');
const agent = new https.Agent({    rejectUnauthorized: false});

/*
  Author: Pradeep
  Descri: Get authorization token
  Date  : 21-10-2019
*/
let azure_authtoken = (clientid, callback) => {
  console.log("111111111 enter");
  return commonModel.azure_authtoken(clientid, callback);
}
/*
  Author: Pradeep
  Descri: update subscription list
  Date  : 22-10-2019
*/
function getDirectAzureAccessToken(regData, callback) {
  return commonModel.getDirectAzureAccessToken(regData, callback);
}

/*
Author : Rajesh
Description : sync_azure_services_usage
Date  : 28-10-2020
*/
let syncAzureServicesUsage = async (reqObj, callback) => {
  let current_date = dateFormat(new Date(), "yyyy-mm-dd");
  let cts = Math.round(new Date().getTime() / 1000);
  //  console.log(reqObj);
  let sql = `Select b.*, c.azure_tenantid, 
	  c.azure_clientid, c.azure_clientsecretkey, 
	  c.azure_resource, c.azure_granttype, c.currency_id, s.subscription_id 
	  from c4_clients as c
	  inner join c4_azure_subscriptions as s on c.id = s.clientid
	  inner join c4_other_cloud_budgets as b on (b.clientid = c.id and b.cloud_id = ${config.AZURE.cloudid})
	  where c.status = 1 and c.azure_linked = 1 and s.state='Enabled' and s.record_status = 1 `;
  if (typeof reqObj.clientid != 'undefined') {
    sql += ` and c.id = ${reqObj.clientid} order by id desc limit 1`;
  } else {
    sql += ` order by c.id asc`;
  }
  //console.loconsole.log(sql);
  await new Promise(function (resolve, reject) {
    dbHandler.executeQuery(sql, async function (ServicesData) {
      //     console.log("ServicesData");
      //       console.log(ServicesData);
      //           return callback(null,"enteredddd");
      try {
        if (ServicesData.length > 0) {
          for await (const item of ServicesData) {
            console.log("item");
            //console.log(item);
            var clientid = item.clientid;
            var subscriptionId = item.subscription_id;

            let start_date = '';
            let end_date = '';
            let count_sql = `Select count(DISTINCT(bu.usage_date)) as cnt from c4_azure_budget_usage as bu
                    	  where bu.clientid = '${clientid}' and bu.subscription_id = '${subscriptionId}' 
                    	  and bu.usage_date >= '${item.service_start_date}' and bu.usage_date <= '${current_date}'`;
            //console.log(count_sql);
            await new Promise(async function (count_resolve, count_reject) {
              dbHandler.executeQuery(count_sql, async function (count_data) {
                //console.log("count_data");
                //console.log(count_data);
                var date1 = new Date(item.service_start_date);
                var date2 = new Date(current_date);

                // To calculate the time difference of two dates 
                var Difference_In_Time = date2.getTime() - date1.getTime();

                // To calculate the no. of days between two dates 
                var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
                if (count_data[0].cnt == (Difference_In_Days - 1)) {
                  //                  	           if(1){
                  start_date = dateFormat(new Date(new Date().setDate(new Date().getDate() - 1)), "yyyy-mm-dd");
                  end_date = current_date;
                  await new Promise(function (resolve2, reject2) {
                    azure_authtoken(clientid, function (error, result) {
                      // if(error){
                      //   //return resolve2([])
                      // }
                      return resolve2(result)
                    })
                  }).then(async function (token) {
                    if (!token) {
                      resolve1('Continue');
                    }
                    var url = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Commerce/UsageAggregates?api-version=2015-06-01-preview&reportedStartTime=${start_date}T00%3a00%3a00%2b00%3a00&reportedEndTime=${end_date}T00%3a00%3a00%2b00%3a00&aggregationGranularity=Daily&showDetails=true`;
                    console.log(url);
                    await new Promise(async function (resolve4, reject4) {
                      request.get({
                        url: url, headers: {
                          "Authorization": 'Bearer ' + token.tokendata.access_token,
                          'Content-Type': 'application/json',
                        }
                      },
                        async function optionalCallback(err, httpResponse, result) {
                          if (err) {
                            resolve1('Continue');
                          } else {
                            console.log("result");
                            //			                                    console.log(result);
                            if (typeof result != 'undefined') {
                              var body = JSON.parse(result);
                            } else {
                              var body = [];
                            }
                            console.log("body.value");
                            console.log(body.value);
                            console.log("body.value.length");
                            console.log(body.value.length);
                            if (body && body.value && body.value.length > 0) {
                              for await (const meterData of body.value) {
                                await new Promise(async function (catalogResolve, catalogReject) {
                                  let catalogSql = `SELECT * from c4_azure_budget_meters
			                                            where clientid = '${clientid}' and subscription_id = '${subscriptionId}'
			                                            and MeterId = '${meterData.properties.meterId}'`;
                                  // console.log("catalogSql");
                                  // console.log(catalogSql);
                                  let insData = {
                                    clientid: item.clientid,
                                    subscription_id: item.subscription_id,
                                    meterId: meterData.properties.meterId,
                                    meterName: meterData.properties.meterName,
                                    meterCategory: meterData.properties.meterCategory,
                                    meterSubCategory: ((meterData.properties.meterSubCategory) ? meterData.properties.meterSubCategory : ""),
                                    unit: meterData.properties.unit,
                                    quantity: meterData.properties.quantity,
                                    meterRates: "",
                                    granularity: "DAILY",
                                    usage_cost: "",
                                    usage_date: start_date,
                                    created_date: cts
                                  };
                                  await dbHandler.executeQuery(catalogSql, async function (catalogInfo) {
                                    console.log("catalogInfo");
                                    console.log(catalogInfo);
                                    if (catalogInfo.length > 0) {
                                      insData.meterRates = catalogInfo[0].MeterRates;
                                      insData.usage_cost = (insData.quantity * insData.meterRates);
                                      console.log("insData");
                                      console.log(insData);
                                      await dbHandler.insertIntoTable('c4_azure_budget_usage', insData, async function (error, vmdid) {
                                        console.log("Inserted Record for client id " + item.clientid + ", subscription id " + item.subscription_id + ", meterId " + meterData.properties.meterId + " " + vmdid);
                                        catalogResolve("Inserted Record for client id " + item.clientid + ", subscription id " + item.subscription_id + ", meterId " + meterData.properties.meterId + " " + vmdid);
                                      });
                                    } else {
                                      console.log("insData");
                                      console.log(insData);
                                      await dbHandler.insertIntoTable('c4_azure_budget_usage', insData, async function (error, vmdid) {
                                        console.log("Inserted Record for client id " + item.clientid + ", subscription id " + item.subscription_id + ", meterId " + meterData.properties.meterId + " without Metered data " + vmdid);
                                        catalogResolve("Inserted Record for client id " + item.clientid + ", subscription id " + item.subscription_id + ", meterId " + meterData.properties.meterId + " without Metered data " + vmdid);
                                      });
                                    }
                                  });
                                });
                              }
                            } else {
                              await new Promise(async function (catalogResolve, catalogReject) {
                                let insData = {
                                  clientid: item.clientid,
                                  subscription_id: item.subscription_id,
                                  meterId: "",
                                  meterName: "",
                                  meterCategory: "",
                                  meterSubCategory: "",
                                  unit: "",
                                  quantity: "",
                                  meterRates: "",
                                  granularity: "DAILY",
                                  usage_cost: "",
                                  usage_date: start_date,
                                  created_date: cts
                                };
                                console.log("insData");
                                console.log(insData);
                                await dbHandler.insertIntoTable('c4_azure_budget_usage', insData, async function (error, vmdid) {
                                  console.log("Inserted Record for client id " + item.clientid + ", subscription id " + item.subscription_id + "with nulll data for date " + start_date);
                                  catalogResolve("Inserted Record for client id " + item.clientid + ", subscription id " + item.subscription_id + "with nulll data for date " + start_date);
                                });
                              });
                            }
                          }
                          console.log("request response completed")
                          resolve4("request response completed")
                        });
                    })
                    console.log("Updated Azure Services Usage for client id " + item.clientid + " subscription_id " + item.subscription_id);
                    count_resolve("Updated Azure Services Usage for client id " + item.clientid + " subscription_id " + item.subscription_id);
                  });
                } else {
                  let dates_sql = `Select bu.usage_date from c4_azure_budget_usage as bu
                                  	  where bu.clientid = ${item.clientid} and bu.subscription_id = '${subscriptionId}' 
                	        		  and bu.usage_date >= '${item.service_start_date}' and bu.usage_date <= '${current_date}'`;
                  dates_sql += ` group by bu.usage_date`;
                  //console.log(dates_sql);
                  await new Promise(async function (dates_resolve, dates_reject) {
                    dbHandler.executeQuery(dates_sql, async function (dates_data) {
                      dates_list = [];
                      await dates_data.forEach(async function (val, key) {
                        dates_list.push(val.usage_date);
                      });
                      //console.log("dates_list");
                      //console.log(dates_list);
                      let daysList = await helper.getArrFromNo(Difference_In_Days);
                      for await (const dayNo of daysList) {
                        start_date = dateFormat(new Date(new Date().setDate(new Date().getDate() - (Difference_In_Days - dayNo))), "yyyy-mm-dd");
                        end_date = dateFormat(new Date(new Date().setDate(new Date().getDate() - (Difference_In_Days - dayNo - 1))), "yyyy-mm-dd");;
                        console.log("start_date " + start_date + " -- end_date " + end_date);
                        if (dates_list.indexOf(start_date) < 0) {
                          await new Promise(function (resolve2, reject2) {
                            azure_authtoken(clientid, function (error, result) {
                              // if(error){
                              //   //return resolve2([])
                              // }
                              return resolve2(result)
                            })
                          }).then(async function (token) {
                            if (!token) {
                              resolve1('Continue');
                            }
                            var url = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Commerce/UsageAggregates?api-version=2015-06-01-preview&reportedStartTime=${start_date}T00%3a00%3a00%2b00%3a00&reportedEndTime=${end_date}T00%3a00%3a00%2b00%3a00&aggregationGranularity=Daily&showDetails=true`;
                            console.log(url);
                            await new Promise(async function (resolve4, reject4) {
                              request.get({
                                url: url, headers: {
                                  "Authorization": 'Bearer ' + token.tokendata.access_token,
                                  'Content-Type': 'application/json',
                                }
                              },
                                async function optionalCallback(err, httpResponse, result) {
                                  if (err) {
                                    resolve4('Continue');
                                  } else {
                                    console.log("result");
                                    //    			                                    console.log(result);
                                    if (typeof result != 'undefined') {
                                      var body = JSON.parse(result);
                                    } else {
                                      var body = [];
                                    }
                                    console.log("body.value");
                                    console.log(body.value);
                                    if (body && body.value && body.value.length > 0) {
                                      console.log("body.value.length");
                                      console.log(body.value.length);
                                      for await (const meterData of body.value) {
                                        await new Promise(async function (catalogResolve, catalogReject) {
                                          let catalogSql = `SELECT * from c4_azure_budget_meters
			    			                                            where clientid = '${clientid}' and subscription_id = '${subscriptionId}'
			    			                                            and MeterId = '${meterData.properties.meterId}'`;
                                          // console.log("catalogSql");
                                          // console.log(catalogSql);
                                          let insData = {
                                            clientid: item.clientid,
                                            subscription_id: item.subscription_id,
                                            meterId: meterData.properties.meterId,
                                            meterName: meterData.properties.meterName,
                                            meterCategory: meterData.properties.meterCategory,
                                            meterSubCategory: ((meterData.properties.meterSubCategory) ? meterData.properties.meterSubCategory : ""),
                                            unit: meterData.properties.unit,
                                            quantity: meterData.properties.quantity,
                                            meterRates: "",
                                            granularity: "DAILY",
                                            usage_cost: "",
                                            usage_date: start_date,
                                            created_date: cts
                                          };
                                          await dbHandler.executeQuery(catalogSql, async function (catalogInfo) {
                                            if (catalogInfo.length > 0) {
                                              insData.meterRates = catalogInfo[0].MeterRates;
                                              insData.usage_cost = (insData.quantity * insData.meterRates);
                                              await dbHandler.insertIntoTable('c4_azure_budget_usage', insData, async function (error, vmdid) {
                                                if (error) {
                                                  console.log("catalogInfo");
                                                  console.log(catalogInfo);
                                                  console.log("insData");
                                                  console.log(insData);
                                                }
                                                console.log("Inserted Record for client id " + item.clientid + ", subscription id " + item.subscription_id + ", meterId " + meterData.properties.meterId + " " + vmdid);
                                                catalogResolve("Inserted Record for client id " + item.clientid + ", subscription id " + item.subscription_id + ", meterId " + meterData.properties.meterId + " " + vmdid);
                                              });
                                            } else {
                                              await dbHandler.insertIntoTable('c4_azure_budget_usage', insData, async function (error, vmdid) {
                                                if (error) {
                                                  console.log("catalogInfo");
                                                  console.log(catalogInfo);
                                                  console.log("insData");
                                                  console.log(insData);
                                                }
                                                console.log("Inserted Record for client id " + item.clientid + ", subscription id " + item.subscription_id + ", meterId " + meterData.properties.meterId + " without Metered data " + vmdid);
                                                catalogResolve("Inserted Record for client id " + item.clientid + ", subscription id " + item.subscription_id + ", meterId " + meterData.properties.meterId + " without Metered data " + vmdid);
                                              });
                                            }
                                          });
                                        });
                                      }
                                    } else {
                                      await new Promise(async function (catalogResolve, catalogReject) {
                                        let insData = {
                                          clientid: item.clientid,
                                          subscription_id: item.subscription_id,
                                          meterId: "",
                                          meterName: "",
                                          meterCategory: "",
                                          meterSubCategory: "",
                                          unit: "",
                                          quantity: "",
                                          meterRates: "",
                                          granularity: "DAILY",
                                          usage_cost: "",
                                          usage_date: start_date,
                                          created_date: cts
                                        };
                                        await dbHandler.insertIntoTable('c4_azure_budget_usage', insData, async function (error, vmdid) {
                                          if (error) {
                                            console.log("insData");
                                            console.log(insData);
                                          }
                                          console.log("Inserted Record for client id " + item.clientid + ", subscription id " + item.subscription_id + "with nulll data for date " + start_date);
                                          catalogResolve("Inserted Record for client id " + item.clientid + ", subscription id " + item.subscription_id + "with nulll data for date " + start_date);
                                        });
                                      });
                                    }
                                  }
                                  console.log("request response completed")
                                  resolve4("request response completed")
                                });
                            })
                          });
                        } else {

                        }
                      }
                      console.log("dates resolve");
                      dates_resolve("dates resolve");
                      console.log("Updated Azure Services Usage for client id " + item.clientid + " subscription_id " + item.subscription_id);
                      count_resolve("Updated Azure Services Usage for client id " + item.clientid + " subscription_id " + item.subscription_id);
                    });
                  });
                }
              });
            });
          }
          console.log("Updated Azure Services Usage for all subscribed clients");
          callback(null, "Updated Azure Services Usage for all subscribed clients");
          resolve("Updated Azure Services Usage for all subscribed clients");
        } else {
          console.log("No clients available to update the Azure Services Usage");
          callback(null, "No clients available to update the Azure Services Usage");
          resolve("No clients available to update the Azure Services Usage");
        }
      }
      catch {
        resolve(0);
      }
    });
  });
}

/*
Author : Rajesh
Description : sync_azure_service_meters
Date  : 28-10-2020
*/
let syncAzureServiceMeters = async (reqObj, callback) => {
  let current_date = dateFormat(new Date(), "yyyy-mm-dd");
  let cts = Math.round(new Date().getTime() / 1000);
  //  console.log(reqObj);
  let sql = `Select b.*, c.azure_tenantid, 
  c.azure_clientid, c.azure_clientsecretkey, 
  c.azure_resource, c.azure_granttype, c.currency_id, s.subscription_id 
  from c4_clients as c
  inner join c4_azure_subscriptions as s on c.id = s.clientid
  inner join c4_other_cloud_budgets as b on (b.clientid = c.id and b.cloud_id = ${config.AZURE.cloudid})
  where c.status = 1 and c.azure_linked = 1 and s.state='Enabled' and s.record_status = 1 `;
  if (typeof reqObj.clientid != 'undefined') {
    sql += ` and c.id = ${reqObj.clientid} order by id desc limit 1`;
  } else {
    sql += ` order by c.id asc`;
  }
  console.log(sql);
  await new Promise(function (resolve, reject) {
    dbHandler.executeQuery(sql, async function (ServicesData) {
      console.log("ServicesData");
      console.log(ServicesData);
      //           return callback(null,"enteredddd");
      try {
        if (ServicesData.length > 0) {
          for await (const item of ServicesData) {
            // console.log("item");
            // console.log(item);
            await new Promise(async function (resolve1, reject1) {
              // var subscription=subscriptionList[i]
              var clientid = item.clientid;
              var subscriptionId = item.subscription_id;
              await new Promise(function (resolve2, reject2) {
                azure_authtoken(clientid, function (error, result) {
                  // if(error){
                  //   //return resolve2([])
                  // }
                  return resolve2(result)
                })
              }).then(async function (token) {
                if (!token) {
                  resolve1('Continue');
                }
                var url = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Commerce/RateCard?api-version=2016-08-31-preview&$filter=OfferDurableId eq 'MS-AZR-0003p' and Currency eq 'USD' and Locale eq 'en-US' and RegionInfo eq 'US'`;
                console.log(url);
                await new Promise(async function (resolve4, reject4) {
                  request.get({
                    url: url, headers: {
                      "Authorization": 'Bearer ' + token.tokendata.access_token,
                      'Content-Type': 'application/json',
                    }
                  },
                    async function optionalCallback(err, httpResponse, result) {
                      if (err) {
                        resolve1('Continue');
                      } else {
                        console.log("result");
                        console.log(result);
                        if (typeof result != 'undefined') {
                          var body = JSON.parse(result);
                        } else {
                          var body = [];
                        }
                        console.log("body.Meters");
                        console.log(body.Meters);
                        if (body && body.Meters) {
                          console.log("body.Meters.length");
                          console.log(body.Meters.length);
                          for await (const meterData of body.Meters) {
                            await new Promise(async function (catalogResolve, catalogReject) {
                              let catalogSql = `SELECT * from c4_azure_budget_meters
	                                            where clientid = '${item.clientid}' and subscription_id = '${subscriptionId}'
	                                            and MeterId = '${meterData.MeterId}'`;
                              // console.log("catalogSql");
                              // console.log(catalogSql);
                              await dbHandler.executeQuery(catalogSql, async function (catalogInfo) {
                                // console.log("catalogInfo");
                                // console.log(catalogInfo);
                                if (catalogInfo.length > 0) {
                                  console.log("Record already exists for client id " + item.clientid + ", subscription id " + item.subscription_id + ", MeterId " + meterData.MeterId + ", EffectiveDate " + meterData.EffectiveDate);
                                  catalogResolve("Record already exists for client id " + item.clientid + ", subscription id " + item.subscription_id + ", MeterId " + meterData.MeterId + ", EffectiveDate " + meterData.EffectiveDate);
                                } else {
                                  let insData = {
                                    clientid: item.clientid,
                                    subscription_id: item.subscription_id,
                                    MeterId: meterData.MeterId,
                                    MeterName: meterData.MeterName,
                                    MeterCategory: meterData.MeterCategory,
                                    MeterSubCategory: meterData.MeterSubCategory,
                                    MeterRegion: meterData.MeterRegion,
                                    MeterUnit: meterData.Unit,
                                    MeterRates: meterData.MeterRates[0],
                                    EffectiveDate: meterData.EffectiveDate,
                                    usage_date: meterData.EffectiveDate.split("T")[0],
                                    IncludedQuantity: meterData.IncludedQuantity,
                                    MeterStatus: meterData.MeterStatus,
                                    created_date: cts
                                  };
                                  // console.log("insData");
                                  // console.log(insData);
                                  await dbHandler.insertIntoTable('c4_azure_budget_meters', insData, async function (error, vmdid) {
                                    console.log("Inserted Record for client id " + item.clientid + ", subscription id " + item.subscription_id + ", MeterId " + meterData.MeterId + ", EffectiveDate " + meterData.EffectiveDate);
                                    catalogResolve("Inserted Record for client id " + item.clientid + ", subscription id " + item.subscription_id + ", MeterId " + meterData.MeterId + ", EffectiveDate " + meterData.EffectiveDate);
                                  });
                                }
                              });
                            });
                          }
                        }
                      }
                      console.log("request response completed")
                      resolve4("request response completed")
                    });
                })
                console.log("Updated Azure Services Usage for client id " + item.clientid);
                resolve1("Updated Azure Services Usage for client id " + item.clientid);
              })
            });
          }
          console.log("Updated Azure Services Usage for all subscribed clients");
          callback(null, "Updated Azure Services Usage for all subscribed clients");
          resolve("Updated Azure Services Usage for all subscribed clients");
        } else {
          console.log("No clients available to update the Azure Services Usage");
          callback(1, "No clients available to update the Azure Services Usage");
          resolve("No clients available to update the Azure Services Usage");
        }
      }
      catch {
        resolve(0);
      }
    });
  });
}
/*
  Author: Pradeep
  Descri: update subscription list
  Date  : 22-10-2019
*/
function updateSubscriptionList(token, subdata) {
  var clientid = token.client_id;
  new Promise(async function (resolve1, reject1) {
    for (var kk in subdata) {
      var data = subdata[kk];
      await new Promise(async function (resolve, reject) {
        updateNetworkInterfaces(token, data.subscriptionId);
        var whereQry = { clientid: clientid, tenantId: data.tenantId, subscriptionId: data.subscriptionId };
        await dbHandler.getOneRecord('azure_subscriptions', whereQry, function (result) {
          if (result) {
            var update = {
              state: data.state,
              displayName: data.displayName
            }
            dbHandler.updateTableData('azure_subscriptions', whereQry, update, function (err, result) {
              resolve('updated')
            })
          } else {
            var insertdata = {
              clientid: clientid,
              subscriptionId: data.subscriptionId,
              tenantId: data.tenantId,
              displayName: data.displayName,
              state: data.state
            }
            dbHandler.insertIntoTable('azure_subscriptions', insertdata, function (err, result) {
              resolve('inserted')
            })
          }
        })
      })
    }
  })
}
/*
  Author: Pradeep
  Descri: update netwrok interfaces list
  Date  : 04-11-2019
*/
function updateNetworkInterfaces(token, subscriptionId) {
  let cts = Math.floor(Date.now() / 1000);
  new Promise(async function (resolve1, reject1) {
    var url = 'https://management.azure.com/subscriptions/' + subscriptionId + '/providers/Microsoft.Network/networkInterfaces?api-version=2021-05-01';
    request.get({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.access_token
      }
    },
      async function optionalCallback(err, httpResponse, result) {
        if (err) {
          resolve1('error')
        } else {
          let imageIds = [];
          var body = ((result) ? JSON.parse(result) : []);
          if (body.value && body.value.length > 0) {
            for (var kk in body.value) {
              var data = body.value[kk];
              var string = data.id.split('/');
              var resource_group = string[4];
              console.log(resource_group)
              await new Promise(async function (resolve, reject) {
                if (data.properties
                  && data.properties.ipConfigurations
                  && data.properties.ipConfigurations.length > 0) {
                  console.log('data.properties.ipConfigurations --- ', data.properties.ipConfigurations)
                  for (const ipItem of data.properties.ipConfigurations) {
                    await new Promise(async function (ipResolve, ipReject) {
                      let ip_address = ((ipItem.properties && ipItem.properties.privateIPAddress) ? ipItem.properties.privateIPAddress : "");
                      if (ip_address != '') {
                        let updateData = {
                          record_status: 1,
                          reserved_date: 0,
                          is_vm_added_to_cart: 0,
                          provision_status: 0,
                          provision_date: 0,
                          updated_date: cts
                        };
                        console.log('updateData --- ', updateData)
                        await dbHandler.updateTableData('azure_reusing_hostnames', { 'ip_address': ip_address }, updateData, async function (err, result) {
                          console.log('ip_address updated in azure_reusing_hostnames --- ' + ip_address);
                          ipResolve("");
                        });
                      } else {
                        ipResolve("");
                      }
                    });
                  }
                }
                let ip_address = ((data.properties
                  && data.properties.ipConfigurations
                  && data.properties.ipConfigurations[0]
                  && data.properties.ipConfigurations[0].properties
                  && data.properties.ipConfigurations[0].properties.privateIPAddress) ? data.properties.ipConfigurations[0].properties.privateIPAddress : "");
                if (ip_address != '') {
                  var whereQry = { subscriptionId: subscriptionId, name: data.name, location: data.location };
                  await dbHandler.getOneRecord('azure_networkinterfaces', whereQry, function (networkResult) {
                    if (!networkResult) {
                      var insertdata = {
                        subscriptionId: subscriptionId,
                        location: data.location,
                        idurl: data.id,
                        name: data.name,
                        clientid: token.clientid,
                        ip_address: ip_address,
                        response_obj: JSON.stringify(data),
                        resource_group: resource_group
                      }
                      dbHandler.insertIntoTable('azure_networkinterfaces', insertdata, function (err, insResult) {
                        imageIds.push(insResult);
                        console.log('inserted ----------------- ', insResult);
                        resolve('inserted')
                      })
                    } else {
                      var update = {
                        idurl: data.id,
                        clientid: token.clientid,
                        resource_group: resource_group,
                        ip_address: ip_address,
                        response_obj: JSON.stringify(data),
                        status: 1
                      }
                      dbHandler.updateTableData('azure_networkinterfaces', whereQry, update, function (err, updatedResult) {
                        imageIds.push(networkResult.id);
                        resolve('updated')
                      })
                      resolve('exists')
                    }
                  })
                } else {
                  resolve('')
                }
              })
            }
          }
          console.log("imageIds -- ", imageIds);
          console.log("NICs synced for subscription - " + subscriptionId);
          //Update the not listed images record_status to 0
          if (imageIds.length > 0) {
            let updateSql = "update azure_networkinterfaces set status='0' WHERE subscriptionId = '" + subscriptionId + "' and id not in (" + imageIds.join() + ")";
            //          	console.log("imageIds --- ", imageIds);
            console.log("updateSql --- ", updateSql);
            db.query(updateSql, (error, rows, fields) => {
              dbFunc.connectionRelease;
              if (!!error) {
                console.log(error);
              } else {
                console.log(`azure_networkinterfaces Updated Record status to 0'`);
                console.log(rows);
              }
            });
          }
        }
      });
  })
}

//sync resource list
function updateResourceList(token, subscriptionId) {
  new Promise(async function (resolve1, reject1) {
    var url = `https://management.azure.com/subscriptions/${subscriptionId}/resources?api-version=2018-05-01`;
    request.get({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.access_token
      }
    },
      async function optionalCallback(err, httpResponse, result) {
        if (err) {
          resolve1('error')
        } else {
          var body = JSON.parse(result);
          for (var kk in body.value) {
            var data = body.value[kk];
            await new Promise(async function (resolve, reject) {
              var string = await data.id.split('/');
              var resource_group = string[4];

              let resourceSql = `SELECT id from c4_azure_resource_list
                  where clientid = '${token.clientid}' and name = '${data.name}'
                  and type = '${data.type}' 
                  and location = '${data.location}' 
                  `;
              console.log("resourceSql ---- ", resourceSql);
              await dbHandler.executeQuery(resourceSql, async function (resourceResult) {
                let whereQry = { clientid: token.clientid, name: data.name, type: data.type, location: data.location };
                //                await dbHandler.getOneRecord('c4_azure_resource_list',whereQry, async function(resourceResult){
                let linked_vm_name = '';
                if (data.type == 'Microsoft.Compute/disks' && data.managedBy && data.managedBy != '') {
                  linked_vm_name = data.managedBy.split('/')[8];
                } else if (data.type == 'Microsoft.Network/networkInterfaces') {
                  let networkInterfaces = '';
                  var promise2 = await new Promise(function (resolve, reject) {
                    var url = 'https://management.azure.com' + data.id + '?api-version=2018-06-01';
                    //                          console.log(url);
                    request.get({
                      url: url, headers: {
                        "Authorization": 'Bearer ' + token.access_token
                      }
                    },
                      async function optionalCallback(err, httpResponse, result) {
                        if (err) {
                          resolve([]);
                        } else {
                          networkInterfaces = JSON.parse(result);
                          //                                console.log("networkInterfaces -- ", JSON.stringify(networkInterfaces));
                          if (networkInterfaces.properties
                            && networkInterfaces.properties.virtualMachine
                            && networkInterfaces.properties.virtualMachine.id) {
                            linked_vm_name = networkInterfaces.properties.virtualMachine.id.split('/')[8];
                            //                                	console.log("linked_vm_name 111  -- ", linked_vm_name);
                          }
                          resolve(networkInterfaces);
                        }
                      });
                  });
                }
                //                	console.log("linked_vm_name 222 -- ", linked_vm_name);
                if (resourceResult.length > 0) {
                  var insertdata = {
                    resource_id: data.id,
                    subscriptionId: subscriptionId,
                    linked_vm_name: linked_vm_name,
                    location: data.location,
                    type: data.type,
                    name: data.name,
                    clientid: token.clientid,
                    resourceGroup: resource_group,
                    response_obj: JSON.stringify(data)
                  }
                  dbHandler.insertIntoTable('c4_azure_resource_list', insertdata, function (err, result) {
                    resolve('inserted')
                  })
                } else {
                  var update = {
                    resource_id: data.id,
                    linked_vm_name: linked_vm_name,
                    type: data.type,
                    resourceGroup: resource_group,
                    response_obj: JSON.stringify(data)
                  }
                  dbHandler.updateTableData('c4_azure_resource_list', whereQry, update, function (err, result) {
                    resolve('updated')
                  })
                  resolve('exists')
                }
              })
            })
          }
        }
      });
  })
}
/*
  Author: Pradeep
  Descri: Get subscription List
  Date  : 21-10-2019
*/
let getSubscriptionList = (reqBody, callback) => {
  if (!reqBody.clientid) return callback(400, { success: 0, message: 'Client Id is missing' });
  new Promise(function (resolve, reject) {
    azure_authtoken(reqBody.clientid, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    var url = 'https://management.azure.com/subscriptions?api-version=2019-06-01';
    request.get({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          var body = JSON.parse(result);
          //updateSubscriptionList(token.tokendata,body.value);
          return callback(null, body)
        }
      });

  })
}
/*
  Author: Pradeep
  Descri: update vm list
  Date  : 23-10-2019
*/
let updateVMList = async (upData, subdata, callback) => {
  let token = upData.tokendata;
  let cts = (new Date().getTime() / 1000);
  for await (var kk of subdata) {
    let data = kk;
    //    var data = subdata[0];
    //    console.log("data");
    //    console.log(data);
    if (!data.id) {
      continue;
    }
    let vm_creation_id = '';
    if (typeof data.vm_creation_id != 'undefined' && data.vm_creation_id != '') {
      vm_creation_id = data.vm_creation_id;
    }
    var string = await data.id.split('/');
    var resource_group = string[4];
    await new Promise(async function (resolve1, reject) {
      //    	if(data.name != 'XA120HN400119'){
      //    		resolve1([]);
      //    	}
      var url = 'https://management.azure.com/subscriptions/' + token.subscription_id + '/resourceGroups/' + resource_group + '/providers/Microsoft.Compute/virtualMachines/' + data.name + '/instanceView?api-version=2022-03-01';
      request.get({
        url: url, headers: {
          "Authorization": 'Bearer ' + token.access_token
        }
      },
        async function optionalCallback(err, httpResponse, result) {
          if (err) {
            resolve1([]);
          } else {
            var body = JSON.parse(result);
            //          console.log("instanceView result --- ", result);
            var dataArr = { data: data, resource_group: resource_group, vmState: body }
            //console.log("dataArr");
            //console.log(dataArr);
            data.networkInformation = {};
            var promise1 = new Promise(function (resolve, reject) {
              if (data.properties && data.properties.storageProfile
                && data.properties.storageProfile.osDisk
                && data.properties.storageProfile.osDisk.managedDisk
                && data.properties.storageProfile.osDisk.managedDisk.id) {
                var url = 'https://management.azure.com' + data.properties.storageProfile.osDisk.managedDisk.id + '?api-version=2020-12-01';
                request.get({
                  url: url, headers: {
                    "Authorization": 'Bearer ' + token.access_token
                  }
                },
                  function optionalCallback(err, httpResponse, result) {
                    if (err) {
                      resolve([]);
                    } else {
                      var body = JSON.parse(result);
                      resolve(body);
                    }
                  });
              } else {
                resolve([]);
              }
            });
            let networkInterfaces = '';
            var promise2 = new Promise(function (resolve, reject) {
              if (!data.properties
                || !data.properties.networkProfile
                || !data.properties.networkProfile.networkInterfaces
                || !data.properties.networkProfile.networkInterfaces[0]
                || !data.properties.networkProfile.networkInterfaces[0].id
              ) {
                resolve([])
              }
              var url = 'https://management.azure.com' + data.properties.networkProfile.networkInterfaces[0].id + '?api-version=2021-05-01';
              //            console.log(url);
              request.get({
                url: url, headers: {
                  "Authorization": 'Bearer ' + token.access_token
                }
              },
                async function optionalCallback(err, httpResponse, result) {
                  if (err) {
                    resolve([]);
                  } else {
                    var jsonBody = JSON.parse(result);
                    data.networkInformation = jsonBody;
                    networkInterfaces = jsonBody;
                    //                  console.log("jsonBody -- ", JSON.stringify(jsonBody));
                    var private_ip = '';
                    var public_ip = '';
                    var virtual_network = '';
                    if (jsonBody.properties &&
                      jsonBody.properties.ipConfigurations &&
                      jsonBody.properties.ipConfigurations[0] &&
                      jsonBody.properties.ipConfigurations[0].properties &&
                      typeof (jsonBody.properties.ipConfigurations[0].properties.privateIPAddress) != 'undefined') {
                      private_ip = jsonBody.properties.ipConfigurations[0].properties.privateIPAddress;
                    }
                    if (jsonBody.properties &&
                      jsonBody.properties.ipConfigurations &&
                      jsonBody.properties.ipConfigurations[0] &&
                      jsonBody.properties.ipConfigurations[0].properties &&
                      typeof (jsonBody.properties.ipConfigurations[0].properties.subnet) != 'undefined') {
                      var string1 = jsonBody.properties.ipConfigurations[0].properties.subnet.id.split('/');
                      var virtual_network = string1[8];
                    }
                    if (jsonBody.properties &&
                      jsonBody.properties.ipConfigurations &&
                      jsonBody.properties.ipConfigurations[0] &&
                      jsonBody.properties.ipConfigurations[0].properties &&
                      jsonBody.properties.ipConfigurations[0].properties.publicIPAddress) {
                      var public_ip = await new Promise(function (publicIpResolve, publicIpReject) {
                        var url = 'https://management.azure.com' + jsonBody.properties.ipConfigurations[0].properties.publicIPAddress.id + '?api-version=2018-06-01';
                        request.get({
                          url: url, headers: {
                            "Authorization": 'Bearer ' + token.access_token
                          }
                        },
                          function optionalCallback(err, httpResponse, result) {
                            if (err) {
                              publicIpResolve("");
                            } else {
                              var json_body = JSON.parse(result);
                              let public_ip_value = '';
                              if (typeof (json_body.properties.ipAddress) != 'undefined') {
                                public_ip_value = json_body.properties.ipAddress;
                              }
                              publicIpResolve(public_ip_value);
                            }
                          });
                      });
                    }
                    resolve({ private_ip: private_ip, public_ip: public_ip, virtual_network: virtual_network });
                  }
                });
            });
            // var promise3=new Promise(function(resolve,reject){
            //   var url='https://management.azure.com/subscriptions/'+token.subscription_id+'/resourceGroups/'+resource_group+'/providers/Microsoft.Network/publicIPAddresses/'+data.name+'-ip?api-version=2018-06-01';
            //   request.get({url:url, headers : {
            //     "Authorization" :'Bearer '+token.access_token
            //     }},
            //   function optionalCallback(err, httpResponse, result) {
            //     if (err) {
            //       resolve([]);
            //     }else{
            //       var body=JSON.parse(result);
            //       resolve(body);
            //     }
            //   });
            // });

            await Promise.all([promise1, promise2]).then(async function (values) {
              var vmCreationInfo = values[0];
              //            console.log("vmCreationInfo -- ",vmCreationInfo);
              var ipAddresses = values[1];
              //            console.log(ipAddresses)
              var private_ip = '';
              if (typeof (ipAddresses.private_ip) != 'undefined') {
                private_ip = ipAddresses.private_ip
              }
              //            console.log("private_ip --- "+private_ip)
              var public_ip = '';
              if (typeof (ipAddresses.public_ip) != 'undefined') {
                public_ip = ipAddresses.public_ip
              }
              var networkInterface = '';
              if (data.properties
                && data.properties.networkProfile
                && data.properties.networkProfile.networkInterfaces
                && data.properties.networkProfile.networkInterfaces[0]
                && typeof (data.properties.networkProfile.networkInterfaces[0].id) != 'undefined') {
                var string = data.properties.networkProfile.networkInterfaces[0].id.split('/');
                var networkInterface = string[8];
              }
              var virtualNetwork = '';
              if (typeof (ipAddresses.virtual_network) != 'undefined') {
                virtualNetwork = ipAddresses.virtual_network
              }
              var powerState = 'poweredOn';
              var vm_status = 'Running';
              //            console.log(dataArr.vmState.statuses[1])
              var vmStatus = (dataArr.vmState && dataArr.vmState.statuses && dataArr.vmState.statuses[1] && dataArr.vmState.statuses[1].displayStatus) ? dataArr.vmState.statuses[1].displayStatus : "";
              if (vmStatus == 'VM deallocated' || vmStatus == 'VM stopped' || vmStatus == 'VM stopping') {// or VM running
                powerState = 'poweredOff';
                vm_status = 'Stopped';
                //              if(vmStatus=='VM deallocated'){
                //                vm_status = 'Deleted';
                //              }
              }
              var whereQry = {
                azure_clientId: token.client_id,
                tenantId: token.tenant_id,
                subscriptionId: token.subscription_id,
                //              vmId: data.properties.vmId, 
                name: data.name,
                clientid: upData.clientdata.id
              };
              var sql = `select c.memory_in_mb, c.number_of_cores from c4_azure_catalog as c 
            inner join c4_azure_subscription_locations as l on l.id=c.location_id 
            where l.clientid=${upData.clientdata.id} and l.subscription_id='${token.subscription_id}'
             and l.name='${data.location}' and c.name='${data.properties.hardwareProfile.vmSize}' and c.record_status=1`

              var vmSizes = await new Promise(function (resolve, reject) {
                dbHandler.executeQuery(sql, function (result) {
                  if (result)
                    resolve(result[0])
                  else resolve([])
                })
              })
              var ram = 0;
              var cpu = 0;
              var hdd = 0;
              if (vmSizes) {
                ram = await parseInt(vmSizes.memory_in_mb / 1024);
                cpu = vmSizes.number_of_cores;
                //              var hddinfo=await parseInt(vmSizes.os_disk_size_in_mb)+parseInt(vmSizes.resource_disk_size_in_mb);
                //              hdd=await parseInt(hddinfo/1024);
              }

              //             console.log("dataArr.vmState -- ",dataArr.vmState);
              let hdd_value = 0;
              let diskListArr = [];
              data.diskInformation = [];
              var hdd = await new Promise(async function (disksResolve, disksReject) {
                //            	 console.log("dataArr.vmState.disks -- ",dataArr.vmState.disks);
                if (dataArr.vmState && dataArr.vmState.disks && dataArr.vmState.disks.length > 0) {
                  for await (var diskItem of dataArr.vmState.disks) {
                    await new Promise(function (disksInnerResolve, disksInnerReject) {
                      var url = 'https://management.azure.com/subscriptions/' + token.subscription_id + '/resourceGroups/' + resource_group + '/providers/Microsoft.Compute/disks/' + diskItem.name + '?api-version=2020-12-01';
                      request.get({
                        url: url, headers: {
                          "Authorization": 'Bearer ' + token.access_token
                        }
                      },
                        function optionalCallback(err, httpResponse, disksInnerResult) {
                          if (err) {
                            disksInnerResolve([]);
                          } else {
                            var disksInnerBody = JSON.parse(disksInnerResult);
                            diskListArr.push(disksInnerBody);
                            data.diskInformation.push(disksInnerBody);
                            //		   		                console.log("disksInnerBody",disksInnerBody);
                            hdd_value = hdd_value + ((disksInnerBody.properties && disksInnerBody.properties.diskSizeGB) ? parseInt(disksInnerBody.properties.diskSizeGB) : 0);
                            disksInnerResolve(disksInnerBody);
                          }
                        });
                    });
                  }
                  disksResolve(hdd_value);
                } else {
                  disksResolve(hdd_value);
                }
              });
              //             console.log("diskListArr -- ",diskListArr);
              //             console.log("hdd -- ",hdd);
              //             console.log("data.properties -- ",data.properties);
              //             console.log("data.properties.storageProfile.imageReference.id -- ",data.properties.storageProfile.imageReference.id);
              os_template_name = '';
              os_template_name = ((data.properties && data.properties.storageProfile && data.properties.storageProfile.imageReference && data.properties.storageProfile.imageReference.id) ? data.properties.storageProfile.imageReference.id.split('/images/')[1].split('/')[0] : "");
              //            console.log("os_template_name -- ", os_template_name);
              await dbHandler.getOneRecord('azure_vms', whereQry, async function (azure_vm_result) {
                //console.log(azure_vm_result);
                console.log(data.name);
                if (azure_vm_result) {
                  var update = {
                    name: data.name,
                    location: data.location,
                    resourceGroup: dataArr.resource_group,
                    powerState: powerState,
                    privateIpAddress: private_ip,
                    publicIpAddress: public_ip,
                    vmId: data.properties.vmId,
                    networkInterface: networkInterface,
                    virtualNetwork: virtualNetwork,
                    vmSize: ((data.properties && data.properties.hardwareProfile && data.properties.hardwareProfile.vmSize) ? data.properties.hardwareProfile.vmSize : ""),
                    osType: ((data.properties && data.properties.storageProfile && data.properties.storageProfile.osDisk && data.properties.storageProfile.osDisk.osType) ? data.properties.storageProfile.osDisk.osType : ""),
                    computerName: ((data.properties && data.properties.osProfile && data.properties.osProfile.computerName) ? data.properties.osProfile.computerName : ""),
                    adminUsername: ((data.properties && data.properties.osProfile && data.properties.osProfile.adminUsername) ? data.properties.osProfile.adminUsername : ""),
                    osName: ((dataArr.vmState && dataArr.vmState.osName) ? dataArr.vmState.osName : ""),
                    osVersion: ((dataArr.vmState && dataArr.vmState.osVersion) ? dataArr.vmState.osVersion : ""),
                    zone: ((data.zones && data.zones.length > 0) ? data.zones[0] : ""),
                    availabilty_set: ((data.properties && data.properties.availabilitySet && data.properties.availabilitySet.id && data.properties.availabilitySet.id.split("/").length > 0) ? data.properties.availabilitySet.id.split("/")[data.properties.availabilitySet.id.split("/").length - 1] : ""),
                    response_obj: JSON.stringify(data),
                    status: 1,
                    vmCreationTime: ((vmCreationInfo.properties && vmCreationInfo.properties.timeCreated) ? dateFormat(vmCreationInfo.properties.timeCreated, "yyyy-mm-dd HH:MM:ss") : "")
                  }
                  //                  console.log(update);
                  //console.log({clientId:token.client_id,tenantId:token.tenant_id,subscriptionId:token.subscription_id,vmId:data.properties.vmId});
                  await dbHandler.updateTableData('azure_vms', { azure_clientId: token.client_id, tenantId: token.tenant_id, subscriptionId: token.subscription_id, vmId: data.properties.vmId }, update, async function (err, result) {
                    var vmUpdate = {
                      host_name: data.name,
                      label_name: data.name,
                      // ref_id:data.properties.vmId,
                      ram_units_gb: ram,
                      cpu_units: cpu,
                      disk_units_gb: hdd,
                      ref_id: update.vmId,
                      multiple_ip: JSON.stringify({ "ip_address": private_ip }),
                      primary_ip: public_ip,
                      username: update.adminUsername,
                      power_status: powerState,
                      vm_status: vm_status,
                      vdc_id: config.AZURE.vdc_id,
                      tech_id: config.AZURE.tech_id,
                      os_template_name: os_template_name,
                      status: 1,
                      updateddate: new Date().getTime() / 1000
                    }
                    // console.log("vmUpdate");
                    // console.log(vmUpdate);
                    // console.log("{id:azure_vm_result.vm_detail_id}");
                    // console.log({id:azure_vm_result.vm_detail_id});
                    await dbHandler.updateTableData('c4_vm_details', { id: azure_vm_result.vm_detail_id }, vmUpdate, function (err, result) {
                      resolve1([]);
                    })
                  })
                } else {
                  //Update the hosts which are provisioned successfully
                  let updateSql = "update azure_reusing_hostnames set " +
                    " record_status= 1, provision_status= 2, " +
                    " updated_date= '" + cts + "'" +
                    " WHERE host_name = '" + data.name + "'";
                  console.log("updateSql --- ", updateSql);
                  await db.query(updateSql, (error, rows, fields) => {
                    dbFunc.connectionRelease;
                    if (!!error) {
                      console.log(error);
                    } else {
                      console.log(`Updated provision_status to 2'`);
                      console.log(rows);
                    }
                  });

                  //            	  console.log(data.properties);
                  var vm_insertdata = {
                    clientid: upData.clientdata.id,
                    azure_clientId: token.client_id,
                    tenantId: token.tenant_id,
                    subscriptionId: token.subscription_id,
                    vmId: data.properties.vmId,
                    resourceGroup: dataArr.resource_group,
                    name: data.name,
                    powerState: powerState,
                    privateIpAddress: private_ip,
                    publicIpAddress: public_ip,
                    networkInterface: networkInterface,
                    virtualNetwork: virtualNetwork,
                    location: data.location,
                    vmSize: ((data.properties && data.properties.hardwareProfile && data.properties.hardwareProfile.vmSize) ? data.properties.hardwareProfile.vmSize : ""),
                    osType: ((data.properties && data.properties.storageProfile && data.properties.storageProfile.osDisk && data.properties.storageProfile.osDisk.osType) ? data.properties.storageProfile.osDisk.osType : ""),
                    computerName: ((data.properties && data.properties.osProfile && data.properties.osProfile.computerName) ? data.properties.osProfile.computerName : ""),
                    adminUsername: ((data.properties && data.properties.osProfile && data.properties.osProfile.adminUsername) ? data.properties.osProfile.adminUsername : ""),
                    osName: ((dataArr.vmState && dataArr.vmState.osName) ? dataArr.vmState.osName : ""),
                    osVersion: ((dataArr.vmState && dataArr.vmState.osVersion) ? dataArr.vmState.osVersion : ""),
                    zone: ((data.zones && data.zones.length > 0) ? data.zones[0] : ""),
                    availabilty_set: ((data.properties && data.properties.availabilitySet && data.properties.availabilitySet.id && data.properties.availabilitySet.id.split("/").length > 0) ? data.properties.availabilitySet.id.split("/")[data.properties.availabilitySet.id.split("/").length - 1] : ""),
                    response_obj: JSON.stringify(data),
                    vmCreationTime: ((vmCreationInfo.properties && vmCreationInfo.properties.timeCreated) ? dateFormat(vmCreationInfo.properties.timeCreated, "yyyy-mm-dd HH:MM:ss") : "")
                  }
                  //console.log("vm_insertdata");
                  //                console.log(vm_insertdata);
                  await dbHandler.insertIntoTable('azure_vms', vm_insertdata, async function (err, azure_vm_id) {
                    if (err) {
                      resolve1([]);
                    } else {
                      if (networkInterfaces != '') {
                        diskListArr.push(networkInterfaces);
                      }
                      for await (var diskItem of diskListArr) {
                        if (diskItem.id) {
                          await new Promise(async function (resolve2, reject2) {
                            let string = await diskItem.id.split('/');
                            let resource_group = string[4];
                            let whereQry = { clientid: upData.clientdata.id, name: diskItem.name, type: diskItem.type, location: diskItem.location };
                            await dbHandler.getOneRecord('c4_azure_resource_list', whereQry, function (result) {
                              if (!result) {
                                var insertdata = {
                                  resource_id: diskItem.id,
                                  subscriptionId: token.subscription_id,
                                  linked_vm_name: vm_insertdata.name,
                                  location: diskItem.location,
                                  type: diskItem.type,
                                  name: diskItem.name,
                                  clientid: upData.clientdata.id,
                                  resourceGroup: resource_group,
                                  response_obj: JSON.stringify(diskItem)
                                }
                                dbHandler.insertIntoTable('c4_azure_resource_list', insertdata, function (err, result) {
                                  resolve2('inserted')
                                })
                              } else {
                                var update = {
                                  resource_id: diskItem.id,
                                  linked_vm_name: vm_insertdata.name,
                                  type: diskItem.type,
                                  resourceGroup: resource_group,
                                  response_obj: JSON.stringify(diskItem)
                                }
                                dbHandler.updateTableData('c4_azure_resource_list', whereQry, update, function (err, result) {
                                  resolve2('updated')
                                })
                                resolve2('exists')
                              }
                            })
                          })
                        }
                      }

                      var vc_sql = `select c.* from c4_vm_creation as c
	                    where c.cloudid='${config.AZURE.cloudid}' 
	                    and c.clientid='${upData.clientdata.id}' 
	                    and c.order_details_id <> 0
	                    and c.request_type = 1
	                     `;
                      //and c.is_email_sent = 0 
                      if (vm_creation_id != '') {
                        vc_sql += ` and c.id = ${vm_creation_id} and ((c.host_name='${data.name}' and c.is_synced_to_db = 0) or (c.cluster_name='${data.name}' and c.is_cluster_synced_to_db = 0)) `;
                      } else {
                        vc_sql += ` and ((c.host_name ='${data.name}' and c.is_synced_to_db = 0) or (c.cluster_name='${data.name}' and c.is_cluster_synced_to_db = 0)) `;
                      }
                      vc_sql += ` order by c.id desc limit 1 `;
                      console.log("vc_sql");
                      console.log(vc_sql);
                      await dbHandler.executeQuery(vc_sql, async function (vm_creation_result) {
                        // await dbHandler.getOneRecord('c4_vm_creation',whereQry,async function(vm_creation_result){
                        console.log("c4_vm_creation result");
                        console.log(vm_creation_result);
                        if (vm_creation_result.length > 0) {
                          let cart_config = JSON.parse(vm_creation_result[0].request_obj);
                          orderDetailsId = vm_creation_result[0].order_details_id;
                          console.log("orderDetailsId");
                          console.log(orderDetailsId);
                          let mrc_price = cart_config.price;

                          var vm_details_insertdata = {
                            cloudid: vm_creation_result[0].cloudid,
                            is_cluster: vm_creation_result[0].is_cluster,
                            order_details_id: orderDetailsId,
                            clientid: upData.clientdata.id,
                            host_name: vm_insertdata.name,
                            label_name: vm_insertdata.name,
                            ref_id: vm_insertdata.vmId,
                            multiple_ip: JSON.stringify({ "ip_address": vm_insertdata.privateIpAddress }),
                            primary_ip: vm_insertdata.publicIPAddress,
                            username: vm_insertdata.username,
                            os_id: vm_creation_result[0].osid,
                            power_status: vm_insertdata.powerState,
                            vm_status: vm_status,
                            vdc_id: config.AZURE.vdc_id,
                            tech_id: config.AZURE.tech_id,
                            os_template_name: os_template_name,
                            ram_units_gb: ram,
                            cpu_units: cpu,
                            disk_units_gb: hdd,
                            createdby: vm_creation_result[0].created_by,
                            createddate: new Date().getTime() / 1000,
                            vm_creation_request_obj: vm_creation_result[0].request_obj
                          }
                          if (vm_details_insertdata.is_cluster == 1) {
                            vm_details_insertdata.cluster_id = vm_creation_result[0].id;
                          }
                          // console.log("vm_details_insertdata");
                          // console.log(vm_details_insertdata);
                          await dbHandler.insertIntoTable('c4_vm_details', vm_details_insertdata, async function (err, vmDetailsId) {
                            if (err) {
                              resolve1([]);
                            } else {
                              await dbHandler.updateTableData('c4_order_details', { id: orderDetailsId }, { 'status': '1', vmid: vmDetailsId, 'updateddate': (new Date().getTime() / 1000) }, function (err, result) { });

                              let azureUpdateVmDet = {
                                vm_detail_id: vmDetailsId,
                                extra_info: vm_creation_result[0].request_obj,
                                search_code: cart_config.region.split("_")[1] + "-SV" + ((cart_config.os_type == "Linux") ? "LV" : "WV") + "-" + vm_insertdata.name.toUpperCase()
                              }
                              console.log("azureUpdateVmDet ", azureUpdateVmDet);
                              await dbHandler.updateTableData('azure_vms', { id: azure_vm_id }, azureUpdateVmDet, function (err, result) { });

                              let vmCreationUpdate = {};
                              if (vm_creation_result[0].host_name == vm_insertdata.name) {
                                vmCreationUpdate.is_synced_to_db = 1;
                              } else {
                                vmCreationUpdate.is_cluster_synced_to_db = 1;
                              }
                              await dbHandler.updateTableData('c4_vm_creation', { id: vm_creation_result[0].id }, vmCreationUpdate, function (err, result) {
                                console.log('updated c4_vm_creation')
                              })

                              console.log("vmDetailsId");
                              console.log(vmDetailsId);
                              resolve1(vmDetailsId);
                            }
                          })
                        } else {
                          vm_insertdata.vm_status = vm_status;
                          vm_insertdata.order_type = config.AZURE.cloud_name;
                          vm_insertdata.cloudid = config.AZURE.cloudid;
                          vm_insertdata.azure_vm_id = azure_vm_id;
                          upData.vmdata = Object.assign({}, vm_insertdata, {
                            os_template_name: os_template_name,
                            ram_units_gb: ram,
                            cpu_units: cpu,
                            disk_units_gb: hdd
                          });
                          // console.log("vm_insertdata");
                          // console.log(vm_insertdata);
                          return createNewOrder(upData, async function (err, response) {
                            //console.log("response");
                            //console.log(response);
                            resolve1(response);
                          });
                        }
                      });
                    }
                  })
                }
              })
            })//promisel all end 
          }
        });
    });
  }
  callback(null, "one client updated...")
}

let createNewOrder = (data, callback) => {
  //	console.log("data --- ",data);
  new Promise(function (resolve, reject) {
    var odrValues = {
      'order_number': helper.getRandomNumber(),
      'clientid': data.clientdata.id,
      'createddate': (new Date().getTime() / 1000),
    };
    db.query("INSERT INTO c4_orders SET ?", odrValues, async function (error, orderRows, fields) {
      if (error) {
        dbFunc.connectionRelease;
        callback(1, 'The operation did not execute as expected. Please raise a ticket to support')
        resolve(error);
      } else {
        dbFunc.connectionRelease;
        console.log(orderRows);
        let orderId = orderRows.insertId

        var odrDetailsValues = {
          'order_id': orderId,
          'order_type': data.vmdata.order_type,
          'clientid': data.clientdata.id,
          'reference_id': data.vmdata.vmId,
          'status': 1,
          'createddate': (new Date().getTime() / 1000),
          'billing_frequency': "FREE",
          'quantity': 1
        };


        response = await dbHandler.insertIntoTable('c4_order_details', odrDetailsValues, async function (error, orderDetailsId) {
          if (error) {
            dbFunc.connectionRelease;
            callback(1, 'The operation did not execute as expected. Please raise a ticket to support')
            resolve(error);
          } else {
            dbFunc.connectionRelease;
            console.log("orderDetailsId");
            console.log(orderDetailsId);

            insertdata = {
              cloudid: data.vmdata.cloudid,
              order_details_id: orderDetailsId,
              clientid: data.clientdata.id,
              host_name: data.vmdata.name,
              label_name: data.vmdata.name,
              ref_id: data.vmdata.vmId,
              multiple_ip: JSON.stringify({ "ip_address": data.vmdata.privateIpAddress }),
              primary_ip: data.vmdata.publicIPAddress,
              username: data.vmdata.username,
              power_status: data.vmdata.powerState,
              vm_status: data.vmdata.vm_status,
              vdc_id: config.AZURE.vdc_id,
              tech_id: config.AZURE.tech_id,
              os_template_name: data.vmdata.os_template_name,
              ram_units_gb: data.vmdata.ram_units_gb,
              cpu_units: data.vmdata.cpu_units,
              disk_units_gb: data.vmdata.disk_units_gb,
              updateddate: new Date().getTime() / 1000
            }
            //                    console.log("insertdata --- ",insertdata);
            await dbHandler.insertIntoTable('c4_vm_details', insertdata, async function (err, vmDetailsId) {
              if (err) {
                callback(1, 'The operation did not execute as expected. Please raise a ticket to support')
                resolve(error);
              } else {
                await dbHandler.updateTableData('c4_order_details', { id: orderDetailsId }, { vmid: vmDetailsId }, function (err, result) { });
                await dbHandler.updateTableData('azure_vms', { id: data.vmdata.azure_vm_id }, { vm_detail_id: vmDetailsId }, function (err, result) { });
                console.log("vmDetailsId");
                console.log(vmDetailsId);
                callback(null, 'order created')
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
  Descri: Get vm list
  Date  : 21-10-2019
*/
let getVMList = (reqBody, callback) => {
  if (!reqBody.subscriptionId) return callback(400, { success: 0, message: 'Subscription id is missing' });
  if (!reqBody.clientid) return callback(400, { success: 0, message: 'Client Id is missing' });
  var subscriptionId = reqBody.subscriptionId;//'301fcf16-9cc8-4d4c-a149-dbb5e1aaa718';
  var clientid = reqBody.clientid;//'22';
  new Promise(function (resolve, reject) {
    azure_authtoken(clientid, function (error, result) {
      if (error) {
        return resolve([])
      }
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    var url = 'https://management.azure.com/subscriptions/' + subscriptionId + '/providers/Microsoft.Compute/virtualMachines?api-version=2022-03-01';
    request.get({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          var body = JSON.parse(result);
          return callback(null, body);
        }
      });

  })
}
/*
  Author: Pradeep
  Descri: sync vm list
  Date  : 21-10-2019
*/
let syncVmList = (reqObj) => {
  // console.log(reqObj);
  let sql = `select clientid,subscription_id from c4_azure_subscriptions 
		  where state='Enabled' and record_status = 1 and is_visible_to_frontend = 1 `;
  if (typeof reqObj.id != 'undefined') {
    sql += ` and clientid = '${reqObj.id}' `;
  }
  if (typeof reqObj.subscription_id != 'undefined') {
    sql += ` and subscription_id = '${reqObj.subscription_id}' `;
  }
  sql += ` order by id desc`;
  // sql += ' limit 1';
  console.log(sql);

  dbHandler.executeQuery(sql, async function (subscriptionList) {
    for await (var subscription of subscriptionList) {
      // for(var i=0;i<subscriptionList.length;i++){
      await new Promise(async function (resolve1, reject1) {
        // var subscription=subscriptionList[i]
        var clientid = subscription.clientid;
        var subscriptionId = subscription.subscription_id;

        let stopped = false;
        let pageToken = '';

        // infinite loop
        while (!stopped) {
          await new Promise(async function (whileResolve, whileReject) {


            await new Promise(function (resolve2, reject2) {
              azure_authtoken(clientid, function (error, result) {
                if (error) {
                  return resolve2([])
                }
                return resolve2(result)
              })
            }).then(function (token) {
              if (!token) {
                resolve1('Continue');
              }
              //let url='https://management.azure.com/subscriptions/'+subscriptionId+'/providers/Microsoft.Compute/virtualMachines?api-version=2022-03-01';
              let url = 'https://management.azure.com/subscriptions/' + subscriptionId;
              if (typeof reqObj.resource_group != 'undefined') {
                url += `/resourceGroups/${reqObj.resource_group}`;
              }
              url += `/providers/Microsoft.Compute/virtualMachines?api-version=2022-03-01`;
              console.log("url ---- ", url);
              if (pageToken) {
                url = pageToken;
              }

              request.get({
                url: url, headers: {
                  "Authorization": 'Bearer ' + token.tokendata.access_token
                }
              },
                async function optionalCallback(err, httpResponse, result) {
                  if (err) {
                    resolve1('Continue');
                  } else {
                    if (typeof result != 'undefined')
                      var body = JSON.parse(result);
                    else
                      var body = [];
                    token.tokendata.subscription_id = subscriptionId;
                    if (!body.value || body.value.length == 0) {
                      console.log("No VMs found for client id ${clientid}");
                      stopped = true // stop when you want
                    } else {
                      //                  if(typeof body.value !='undefined'){
                      //console.log("body.value");
                      //console.log(body.value);
                      return await updateVMList(token, body.value, async function (err, response) {
                        //console.log("response");
                        //console.log(response);
                        whileResolve(response);
                        if (!body.nextLink || (body.nextLink && body.nextLink == '')) {
                          stopped = true // stop
                          // when
                          // you
                          // want
                        } else {
                          pageToken = body.nextLink;
                          console.log("pageToken");
                          console.log(pageToken);
                        }
                      });
                    }
                  }
                });
            })

          })
        }
        console.log(`VMs synced for ${clientid}`);
        resolve1(`VMs synced for ${clientid}`);


      })
    }
  })
}
/*
  Author: Pradeep
  Descri: update subscription list
  Date  : 22-10-2019
*/
let updateTenantList = (subdata) => {
  new Promise(async function (resolve1, reject1) {
    for (var kk in subdata) {
      var data = subdata[kk];
      await new Promise(async function (resolve, reject) {
        await dbHandler.getOneRecord('azure_tenants', { tenantId: data.tenantId }, function (result) {
          if (result) {
            var update = {
              tenantCategory: data.tenantCategory
            }
            dbHandler.updateTableData('azure_tenants', { tenantId: data.name }, update, function (err, result) {
              console.log('update');
              resolve('update')
            })
          } else {
            var insertdata = {
              tenantId: data.tenantId,
              tenantCategory: data.tenantCategory
            }
            dbHandler.insertIntoTable('azure_tenants', insertdata, function (err, result) {
              resolve('inserted')
            })
          }
        });

      });
    }
  });
}
/*
  Author: Pradeep
  Descri: Get subscription List
  Date  : 21-10-2019
*/
let getTenantList = (req, callback) => {
  new Promise(function (resolve, reject) {
    azure_authtoken(function (result, error) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    var url = 'https://management.azure.com/tenants?api-version=2019-06-01';
    request.get({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        var body = JSON.parse(result);
        if (err) {
          return callback([], err);
        } else {
          updateTenantList(body.value);
          return callback(null, body)
        }
      });

  })
}
/*
  Author: Pradeep
  Descri: update hardware profile
  Date  : 29-10-2019
*/
let updateHardwareProfileList = (subscriptionId, locationName, subdata) => {
  new Promise(async function (resolve1, reject1) {
    for (var kk in subdata) {
      var data = subdata[kk];
      await new Promise(async function (resolve, reject) {
        var whereQry = { subscriptionId: subscriptionId, location: locationName, name: data.name };
        await dbHandler.getOneRecord('azure_hardwareProfiles', whereQry, function (result) {
          if (result) {
            var update = {
              numberOfCores: data.numberOfCores,
              osDiskSizeInMB: data.osDiskSizeInMB,
              resourceDiskSizeInMB: data.resourceDiskSizeInMB,
              memoryInMB: data.memoryInMB,
              maxDataDiskCount: data.maxDataDiskCount
            }
            dbHandler.updateTableData('azure_hardwareProfiles', whereQry, update, function (err, result) {
              console.log('update');
              resolve('update')
            })
          } else {
            var insertdata = {
              subscriptionId: subscriptionId,
              location: locationName,
              name: data.name,
              numberOfCores: data.numberOfCores,
              osDiskSizeInMB: data.osDiskSizeInMB,
              resourceDiskSizeInMB: data.resourceDiskSizeInMB,
              memoryInMB: data.memoryInMB,
              maxDataDiskCount: data.maxDataDiskCount
            }
            dbHandler.insertIntoTable('azure_hardwareProfiles', insertdata, function (err, result) {
              resolve('inserted')
            })
          }
        });

      });
    }
  });
}
/*
  Author: Pradeep
  Descri: Get Hardware Profile List
  Date  : 29-10-2019
*/
let getHardwareProfileList = async (reqBody, callback) => {
  var subscriptionId = reqBody.subscriptionId;
  var locationName = reqBody.location;
  var clientId = reqBody.clientid;
  if (typeof (subscriptionId) == 'undefined' || subscriptionId == '') {
    var response = { message: 'Please provide subscription id.' }
    return callback([], response);
  }
  if (typeof (locationName) == 'undefined' || locationName == '') {
    var response = { message: 'Please provide location name.' }
    return callback([], response);
  }
  if (typeof (clientId) == 'undefined' || clientId == '') {
    var response = { message: 'Please provide clientid.' }
    return callback([], response);
  }

  new Promise(function (resolve, reject) {
    azure_authtoken(clientId, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(async function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    var url = 'https://management.azure.com/subscriptions/' + subscriptionId + '/providers/Microsoft.Compute/locations/' + locationName + '/vmSizes?api-version=2018-06-01';
    await request.get({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          if (typeof (result) !== 'undefined') {
            var body = JSON.parse(result);
            updateHardwareProfileList(subscriptionId, locationName, body.value);
            return callback(null, body);
          }
          return callback(null, result);
        }
      });
  })
}

let getVmCatalogs = async (reqBody, callback) => {
  console.log("getVmCatalogs reqBody --- ", reqBody);
  var subscriptionId = helper.strEscape(reqBody.subscriptionId);
  var locationName = reqBody.location;
  var currency_id = reqBody.currency_id;
  var clientId = reqBody.clientid;
  if (typeof (subscriptionId) == 'undefined' || subscriptionId == '') {
    var response = { message: 'Please provide subscription id.' }
    return callback([], response);
  }
  if (typeof (locationName) == 'undefined' || locationName == '') {
    var response = { message: 'Please provide location name.' }
    return callback([], response);
  }
  if (typeof (clientId) == 'undefined' || clientId == '') {
    var response = { message: 'Please provide clientid.' }
    return callback([], response);
  }
  if (typeof (reqBody.environment) == 'undefined' || reqBody.environment == '') {
    var response = { message: 'Please provide environment.' }
    return callback([], response);
  }

  if (typeof (reqBody.shared_image_tags) == 'undefined') {
    var response = { message: 'Invalid request' }
    return callback([], response);
  }
  let minReqSql = `select *
		from azure_skus_min_capacities 
		where os_type = '${reqBody.os_type}' 
		and db_type = '${reqBody.shared_image_tags["UCP-DB-Type"]}' 
		and mw_type = '${reqBody.shared_image_tags["UCP-MW"]}'`;
  if (typeof (reqBody.is_cluster) != 'undefined' && reqBody.is_cluster == 1) {
    minReqSql += ` and is_cluster = '${reqBody.is_cluster}' `;
  } else {
    minReqSql += ` and is_cluster = '0' `;
  }
  minReqSql += `limit 1 `;
  console.log("minReqSql --- ", minReqSql);
  let minReqRows = await dbHandler.executeQueryv2(minReqSql);
  console.log("minReqRows ---- ", minReqRows);
  if (minReqRows.length == 0) {
    return callback(1, { success: 0, message: 'Invalid request' });
  }

  let catalogSql = `SELECT c.name, c.number_of_cores as numberOfCores,
  c.os_disk_size_in_mb as osDiskSizeInMB,
  c.resource_disk_size_in_mb as resourceDiskSizeInMB,
  c.memory_in_mb as memoryInMB,
  c.max_data_disk_count as maxDataDiskCount,
  c.PremiumIO, c.LowPriorityCapable, 
  c.AcceleratedNetworkingEnabled, c.HyperVGenerations,
  c.zones,
  c.EphemeralOSDiskSupported,
  '0' as price  from c4_azure_catalog as c
  inner join c4_azure_subscription_locations as l on l.id = c.location_id
  where l.name = '${locationName}' and l.subscription_id = '${subscriptionId}' and l.clientid = '${clientId}'
  and c.record_status=1 and AcceleratedNetworkingEnabled is NOT NULL and AcceleratedNetworkingEnabled != ''
  and zones is NOT NULL and zones != '' and zones != '[]'
  `; //and c.record_status=1 and LowPriorityCapable = 'True'
  catalogSql += ` and c.number_of_cores >= ${minReqRows[0].min_cores_required} `;
  catalogSql += ` and c.memory_in_mb >= ${minReqRows[0].min_ram_required} `;
  catalogSql += ` and (c.environment = 'ANY' or c.environment = '${reqBody.environment}') `;

  if (typeof (reqBody.HyperVGenerations) != 'undefined' && reqBody.HyperVGenerations != '') {
    catalogSql += ` and FIND_IN_SET('${reqBody.HyperVGenerations}', c.HyperVGenerations) `;
  }
  if (typeof (reqBody.is_cluster) != 'undefined' && reqBody.is_cluster == 1) {
    catalogSql += ` and c.is_cluster = 1 and c.zones like '%,%' `;
  } else if (typeof (reqBody.shared_image_name) != 'undefined' && reqBody.shared_image_name.toLowerCase().indexOf('sap') >= 0) {
    catalogSql += ` and c.is_sap = 1 `;
  }
  if (typeof (reqBody.PremiumIO) != 'undefined' && reqBody.PremiumIO == 'True') {
    catalogSql += ` and c.PremiumIO = 'True' `;
  }
  if (typeof (reqBody.AcceleratedNetworkingEnabled) != 'undefined' && reqBody.AcceleratedNetworkingEnabled == true) {
    catalogSql += ` and c.AcceleratedNetworkingEnabled = '${reqBody.AcceleratedNetworkingEnabled}' `;
  }
  if (typeof (reqBody.MinimumDisks) != 'undefined' && reqBody.MinimumDisks != '') {
    catalogSql += ` and c.max_data_disk_count > ${reqBody.MinimumDisks} `;
  }
  if (typeof (reqBody.supportedSkus) != 'undefined' && reqBody.supportedSkus.length > 0) {
    let skus = reqBody.supportedSkus.join("', '");
    catalogSql += ` and c.name in ('${skus}') `;
  }
  if (typeof (reqBody.shared_image_tags) != 'undefined' && reqBody.shared_image_tags["UCP-DB-Type"]
    && (reqBody.shared_image_tags["UCP-DB-Type"] == 'MSSQL' || reqBody.shared_image_tags["UCP-DB-Type"] == 'Oracle')) {
    //	  catalogSql += ` and c.number_of_cores >= 4 `;
    catalogSql += ` and 
						(
						    c.series_name like 'D%' 
						    or c.series_name like 'E%'
						    or c.series_name like 'G%'
						    or c.series_name like 'L%'
						)  `;
  } else if (typeof (reqBody.os_type) != 'undefined' && reqBody.os_type == 'Windows') {
    //	  catalogSql += ` and c.number_of_cores >= 2 `;
  }

  if (typeof (reqBody.shared_image_tags) != 'undefined' && reqBody.shared_image_tags["UCP-DB-Type"]
    && reqBody.shared_image_tags["UCP-DB-Type"] == 'MSSQL') {
    catalogSql += ` and c.EphemeralOSDiskSupported = 'True' `;
  }
  catalogSql += ` order by c.name asc`;
  console.log("catalogSql --- ", catalogSql);
  await dbHandler.executeQuery(catalogSql, async function (catalogInfo) {
    return callback(null, catalogInfo);
  });
}
/*
  Author: Pradeep
  Descri: update location list
  Date  : 22-10-2019
*/
let updateLocationList = (reqObj, subscriptionId, subdata) => {
  new Promise(async function (resolve1, reject1) {
    for (var kk in subdata) {
      var data = subdata[kk];
      await new Promise(async function (resolve, reject) {
        var baseUrl = reqObj.protocol + '://' + reqObj.get('host');
        //getResourceGroupList
        //await axios.get(baseUrl+'/azure/get_resource_group_list?subscriptionId='+subscriptionId+'&locationName='+data.name)
        /*.then(response => {
          console.log(response.data);
        })
        .catch(error => {
          //console.log(error);
        })*/
        await dbHandler.getOneRecord('azure_locations', { subscriptionId: subscriptionId, name: data.name }, function (result) {
          if (result) {
            var update = {
              displayName: data.displayName
            }
            dbHandler.updateTableData('azure_locations', { subscriptionId: subscriptionId, name: data.name }, update, function (err, result) {
              console.log('update');
              resolve('update')
            })
          } else {
            var insertdata = {
              subscriptionId: subscriptionId,
              name: data.name,
              displayName: data.displayName
            }
            dbHandler.insertIntoTable('azure_locations', insertdata, function (err, result) {
              resolve('inserted')
            })
          }
        });

      });
    }
  });
}
/*
  Author: Pradeep
  Descri: Get location List
  Date  : 23-10-2019
*/
let getLocationList = (req, callback) => {
  var subscriptionId = req.query.subscriptionId;
  new Promise(function (resolve, reject) {
    azure_authtoken(function (result, error) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    var url = 'https://management.azure.com/subscriptions/' + subscriptionId + '/locations?api-version=2019-06-01';
    request.get({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        var body = JSON.parse(result);
        if (err) {
          return callback([], err);
        } else {
          updateLocationList(req, subscriptionId, body.value);
          return callback(null, body);
        }
      });
  })
}
/*
  Author: Pradeep
  Descri: VM Operations
  Date  : 29-10-2019
*/
let vmOperations = (req, callback) => {
  var actions = ['start', 'restart', 'stop'];
  var actionName = req.actionName;
  var ref_id = req.ref_id;
  var user_id = req.user_id;
  if (typeof (actionName) == 'undefined' || actionName == '') {
    var response = { success: 0, message: 'Please provide action name.', status: 'error' }
    return callback(400, response);
  }
  if (!in_array(actionName, actions)) {
    var response = { success: 0, message: 'Please provide valid action name.', status: 'error' }
    return callback(400, response);
  }
  if (typeof (ref_id) == 'undefined' || ref_id == '') {
    var response = { success: 0, message: 'Please provide vm ref id.', status: 'error' }
    return callback(400, response);
  }
  if (typeof (user_id) == 'undefined' || user_id == '') {
    var response = { success: 0, message: 'Please provide user_id.', status: 'error' }
    return callback(400, response);
  }
  new Promise(function (resolve, reject) {
    azure_authtoken(user_id, function (error, result) {
      resolve(result)
    })
  }).then(async function (token) {
    if (token.tokendata.length == 0) {
      var response = { success: 0, message: 'The operation did not execute as expected. Please raise a ticket to support', status: 'error' }
      return callback(400, response);
    }
    let vmDetail = await new Promise(function (resolve, reject) {
      var whereQry = { clientid: user_id, vmId: ref_id };
      dbHandler.getOneRecord('azure_vms', whereQry, function (result) {
        resolve(result)
      });
    })
    if (!vmDetail) {
      var response = { success: 0, message: 'The operation did not execute as expected. Please raise a ticket to support', status: 'error' }
      return callback(400, response);
    }
    var actionAlias = actionName;
    if (actionName == 'stop') {
      actionName = 'deallocate';
    }
    var subscriptionId = vmDetail.subscriptionId;
    var url = 'https://management.azure.com/subscriptions/' + subscriptionId + '/resourceGroups/' + vmDetail.resourceGroup + '/providers/Microsoft.Compute/virtualMachines/' + vmDetail.name + '/' + actionName + '?api-version=2022-03-01';
    await request.post({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback(null, { success: 0, message: 'The operation did not execute as expected. Please raise a ticket to support', status: 'error' });
        } else {
          return callback(null, { success: 1, status: 'success', message: 'VM ' + actionAlias + ' request has been raised successfully.' });
        }
      });
  })
}
/*
  Author: Pradeep
  Descri: Get vm details
  Date  : 22-10-2019
*/
let getVMDetails = (req, callback) => {
  var tenantId = req.query.tenantId;
  var subscriptionId = req.query.subscriptionId;
  var vmId = req.query.vmId;
  if (typeof (tenantId) == 'undefined' || tenantId == '') {
    var response = { message: 'Please provide tenant id.' }
    return callback([], response);
  }
  if (typeof (subscriptionId) == 'undefined' || subscriptionId == '') {
    var response = { message: 'Please provide subscription id.' }
    return callback([], response);
  }
  if (typeof (vmId) == 'undefined' || vmId == '') {
    var response = { message: 'Please provide vm id.' }
    return callback([], response);
  }
  new Promise(function (resolve, reject) {
    azure_authtoken(function (result, error) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(async function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    let vmDetail = await new Promise(function (resolve, reject) {
      var whereQry = { tenantId: tenantId, subscriptionId: subscriptionId, vmId: vmId };
      dbHandler.getOneRecord('azure_vms', whereQry, function (result) {
        resolve(result)
      });
    })
    if (!vmDetail) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    var url = 'https://management.azure.com/subscriptions/' + subscriptionId + '/resourceGroups/' + vmDetail.resourceGroup + '/providers/Microsoft.Compute/virtualMachines/' + vmDetail.name + '?api-version=2022-03-01';
    await request.get({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback(null, err);
        } else {
          var body = JSON.parse(result);
          return callback(null, body);
        }
      });
  })
}
/*
  Author: Pradeep
  Descri: Get Ip address profile
  Date  : 22-10-2019
*/
let getIpAddressProfile = (reqBody, callback) => {
  var resourceGroup = reqBody.resourceGroup;
  var subscriptionId = helper.strEscape(reqBody.subscriptionId);
  var clientid = reqBody.clientid;
  if (typeof (resourceGroup) == 'undefined' || resourceGroup == '') {
    var response = { message: 'Please provide resource group.' }
    return callback([], response);
  }
  if (typeof (subscriptionId) == 'undefined' || subscriptionId == '') {
    var response = { message: 'Please provide subscription id.' }
    return callback([], response);
  }
  if (typeof (clientid) == 'undefined' || clientid == '') {
    var response = { message: 'Please provide clientid.' }
    return callback([], response);
  }
  new Promise(function (resolve, reject) {
    azure_authtoken(clientid, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(async function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    var networkInterfaces = await new Promise(function (resolve, reject) {
      var sql = `select networkInterface from azure_vms where subscriptionId='${subscriptionId}' and clientid=${clientid} and 
      resourceGroup='${resourceGroup}'`;
      dbHandler.executeQuery(sql, function (result) {
        resolve(result)
      })
    })
    var networkList = [];
    for await (const net of networkInterfaces) {
      networkList.push(net.networkInterface)
    }
    //console.log(networkList)
    var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/publicIPAddresses?api-version=2020-04-01`
    await request.get({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      async function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback(null, err);
        } else {
          var body = JSON.parse(result);
          var ipaddress = [];
          for await (var ipval of body.value) {
            var network = '';
            if (ipval.properties && ipval.properties.ipConfiguration) {
              var string = await ipval.properties.ipConfiguration.id.split('/');
              var network = string[8];
            }
            if (!in_array(network, networkList)) {
              await ipaddress.push(ipval)
            }
          }
          return callback(null, { value: ipaddress });
        }
      });
  })
}
/*
  Author: Pradeep
  Descri: create Ip address profile
  Date  : 22-10-2019
*/
let createIpAddressProfile = (reqBody, callback) => {
  if (typeof (reqBody.location) == 'undefined' || reqBody.location == '') {
    return callback([], { success: 0, message: 'Please provide location name.' });
  }
  if (typeof (reqBody.clientid) == 'undefined' || reqBody.clientid == '') {
    return callback([], { success: 0, message: 'Please provide client id.' });
  }
  if (typeof (reqBody.subscriptionId) == 'undefined' || reqBody.subscriptionId == '') {
    return callback([], { success: 0, message: 'Please provide subscription id.' });
  }
  if (typeof (reqBody.resourceGroup) == 'undefined' || reqBody.resourceGroup == '') {
    return callback([], { success: 0, message: 'Please provide resource group.' });
  }
  if (typeof (reqBody.publicIpAddressName) == 'undefined' || reqBody.publicIpAddressName == '') {
    return callback([], { success: 0, message: 'Please provide public ip address name.' });
  }
  var location = reqBody.location;//'centralus';
  var clientid = reqBody.clientid;//'222';
  var subscriptionId = reqBody.subscriptionId;//'301fcf16-9cc8-4d4c-a149-dbb5e1aaa718';
  var publicIpAddressName = reqBody.publicIpAddressName;//'pkp-nic2';
  var resourceGroup = reqBody.resourceGroup;//'automation';

  var reqBody =
  {
    "properties": {
      "publicIPAllocationMethod": "Static",
      "idleTimeoutInMinutes": 10,
      "publicIPAddressVersion": "IPv4"
    },
    "sku": {
      "name": "basic"
    },
    "location": `${location}`,
  }
  new Promise(function (resolve, reject) {
    azure_authtoken(clientid, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    console.log('entered')
    var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/publicIPAddresses/${publicIpAddressName}?api-version=2020-04-01`
    request.put({
      url: url, body: JSON.stringify(reqBody), headers: {
        "Content-Type": "application/json",
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          if (typeof result != 'undefined')
            var body = JSON.parse(result);
          else var body = [];
          return callback(null, body);
        }
      });
  })
}
/*
  Author: Pradeep
  Descri: Get virtual network
  Date  : 22-10-2019
*/
let getVirtualNetwork = (reqBody, callback) => {
  var resourceGroup = reqBody.resourceGroup;
  var subscriptionId = reqBody.subscriptionId;
  var clientid = reqBody.clientid;
  if (typeof (resourceGroup) == 'undefined' || resourceGroup == '') {
    var response = { message: 'Please provide resource group.' }
    return callback([], response);
  }
  if (typeof (subscriptionId) == 'undefined' || subscriptionId == '') {
    var response = { message: 'Please provide subscription id.' }
    return callback([], response);
  }
  if (typeof (clientid) == 'undefined' || clientid == '') {
    var response = { message: 'Please provide clientid.' }
    return callback([], response);
  }
  new Promise(function (resolve, reject) {
    azure_authtoken(clientid, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(async function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/virtualNetworks?api-version=2020-04-01`
    await request.get({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback(null, err);
        } else {
          var body = JSON.parse(result);
          return callback(null, body);
        }
      });
  })
}
/*
  Author: Pradeep
  Descri: Get virtual network
  Date  : 22-10-2019
*/
let getVirtualNetworkLocationWise = (reqBody, callback) => {
  var resourceGroup = reqBody.resourceGroup;
  var subscriptionId = reqBody.subscriptionId;
  var location = reqBody.location;
  var clientid = reqBody.clientid;
  if (typeof (resourceGroup) == 'undefined' || resourceGroup == '') {
    var response = { message: 'Please provide resource group.' }
    return callback([], response);
  }
  if (typeof (subscriptionId) == 'undefined' || subscriptionId == '') {
    var response = { message: 'Please provide subscription id.' }
    return callback([], response);
  }
  if (typeof (location) == 'undefined' || location == '') {
    var response = { message: 'Please provide location name.' }
    return callback([], response);
  }
  if (typeof (clientid) == 'undefined' || clientid == '') {
    var response = { message: 'Please provide clientid.' }
    return callback([], response);
  }

  return new Promise(async function (resolve, reject) {
    let sql = `select n.*
      from azure_networks as n 
      where  n.subscriptionId='${subscriptionId}' 
      and n.resource_group='${resourceGroup}' 
      and n.status=1 
      and n.location = '${location}'
      order by n.id DESC`;
    console.log("getVirtualNetworkLocationWise sql ---", sql);
    db.query(sql, async function (error, items, fields) {
      dbFunc.connectionRelease;
      if (!!error) {
        callback(1, "The operation did not execute as expected. Please raise a ticket to support");
        resolve(error);
      } else {
        let dataArr = [];
        for await (const item of items) {
          dataArr.push(JSON.parse(item.response_obj));
        }
        return callback(null, dataArr);
        resolve(items);
      }
    });
  });

  /*new Promise(function(resolve,reject){
    azure_authtoken(clientid,function(error,result){
      if(error) return resolve([])
      return resolve(result)
    })
  }).then(async function(token){
    if(!token){
      var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
      return callback([],response);
    } 
    var url=`https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/virtualNetworks?api-version=2020-04-01`;
    console.log("getVirtualNetworkLocationWise url --- ", url);
    await request.get({url:url, headers : {
      "Authorization" :'Bearer '+token.tokendata.access_token
    }},
    async function optionalCallback(err, httpResponse, result) {
      if (err) {
        return callback(null,err);
      }else{
        var body=JSON.parse(result);
//        console.log("getVirtualNetworkLocationWise body --- ", body);
        
        if(typeof body.value !='undefined')
        {
          for(var i=0;i<body.value.length;i++){
              var network=body.value[i];
              if(!dataArr){
                var dataArr=[];
              }
              await new Promise(async function(resolve,reject){
                  //console.log(network.location+'=='+location)
//	                if(network.location==location){
                    await dataArr.push(network)
//	                }
                  resolve([])
              })
          }
       }else{
        if(!dataArr)
        var dataArr=[];
       }
        return callback(null,dataArr);
      }
    });
  })*/
}
/*
  Author: Pradeep
  Descri: create virtual network
  Date  : 22-10-2019
*/
let createVirtualNetwork = (reqBody, callback) => {
  if (typeof (reqBody.location) == 'undefined' || reqBody.location == '') {
    return callback([], { success: 0, message: 'Please provide location name.' });
  }
  if (typeof (reqBody.clientid) == 'undefined' || reqBody.clientid == '') {
    return callback([], { success: 0, message: 'Please provide client id.' });
  }
  if (typeof (reqBody.subscriptionId) == 'undefined' || reqBody.subscriptionId == '') {
    return callback([], { success: 0, message: 'Please provide subscription id.' });
  }
  if (typeof (reqBody.resourceGroup) == 'undefined' || reqBody.resourceGroup == '') {
    return callback([], { success: 0, message: 'Please provide resource group.' });
  }
  if (typeof (reqBody.virtualNetwork) == 'undefined' || reqBody.virtualNetwork == '') {
    return callback([], { success: 0, message: 'Please provide virtual network.' });
  }
  if (typeof (reqBody.subnetName) == 'undefined' || reqBody.subnetName == '') {
    return callback([], { success: 0, message: 'Please provide subnet name.' });
  }
  if (typeof (reqBody.ip_address_prefix) == 'undefined' || reqBody.ip_address_prefix == '') {
    return callback([], { success: 0, message: 'Please provide address prefix.' });
  }
  var location = reqBody.location;//'centralus';
  var clientid = reqBody.clientid;//'222';
  var subscriptionId = reqBody.subscriptionId;//'301fcf16-9cc8-4d4c-a149-dbb5e1aaa718';
  var virtualNetwork = reqBody.virtualNetwork;//'pkp-nic2';
  var resourceGroup = reqBody.resourceGroup;//'automation';
  var subnetName = reqBody.subnetName;//'automation';
  var ip_address_prefix = reqBody.ip_address_prefix;//'10.0.0.0/16';
  var string = ip_address_prefix.split('/');
  var subnetip = string[0];
  var reqBody =
  {
    "properties": {
      "addressSpace": {
        "addressPrefixes": [
          `${ip_address_prefix}`
        ]
      },
      "subnets": [
        {
          "name": `${subnetName}`,
          "properties": {
            "addressPrefix": `${subnetip}/24`
          }
        }
      ]
    },
    "location": `${location}`,
  }
  new Promise(function (resolve, reject) {
    azure_authtoken(clientid, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    console.log('entered')
    var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/virtualNetworks/${virtualNetwork}?api-version=2020-04-01`
    request.put({
      url: url, body: JSON.stringify(reqBody), headers: {
        "Content-Type": "application/json",
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          if (typeof result != 'undefined')
            var body = JSON.parse(result);
          else var body = [];
          return callback(null, body);
        }
      });
  })
}
/*
  Author: Pradeep
  Descri: Get network interface list
  Date  : 22-10-2019
*/
let getNetworkInterfaces = (reqBody, callback) => {
  var resourceGroup = reqBody.resourceGroup;
  var subscriptionId = reqBody.subscriptionId;
  var clientid = reqBody.clientid;
  if (typeof (resourceGroup) == 'undefined' || resourceGroup == '') {
    var response = { message: 'Please provide resource group.' }
    return callback([], response);
  }
  if (typeof (subscriptionId) == 'undefined' || subscriptionId == '') {
    var response = { message: 'Please provide subscription id.' }
    return callback([], response);
  }
  if (typeof (clientid) == 'undefined' || clientid == '') {
    var response = { message: 'Please provide clientid.' }
    return callback([], response);
  }
  new Promise(function (resolve, reject) {
    azure_authtoken(clientid, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(async function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/networkInterfaces?api-version=2020-04-01`
    await request.get({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback(null, err);
        } else {
          var body = JSON.parse(result);
          return callback(null, body);
        }
      });
  })
}
/*
  Author: Pradeep
  Descri: Get network interface list
  Date  : 22-10-2019
*/
let getAvailNetworkInterfaces = (reqBody, callback) => {
  var resourceGroup = reqBody.resourceGroup;
  var subscriptionId = reqBody.subscriptionId;
  var location = reqBody.location;
  var clientid = reqBody.clientid;
  if (typeof (resourceGroup) == 'undefined' || resourceGroup == '') {
    var response = { message: 'Please provide resource group.' }
    return callback([], response);
  }
  if (typeof (subscriptionId) == 'undefined' || subscriptionId == '') {
    var response = { message: 'Please provide subscription id.' }
    return callback([], response);
  }
  if (typeof (location) == 'undefined' || location == '') {
    var response = { message: 'Please provide location.' }
    return callback([], response);
  }
  if (typeof (clientid) == 'undefined' || clientid == '') {
    var response = { message: 'Please provide clientid.' }
    return callback([], response);
  }
  new Promise(function (resolve, reject) {
    azure_authtoken(clientid, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(async function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    var networks = await new Promise(function (resolve, reject) {
      var url = 'https://management.azure.com/subscriptions/' + subscriptionId + '/providers/Microsoft.Compute/virtualMachines?api-version=2022-03-01';
      request.get({
        url: url, headers: {
          "Authorization": 'Bearer ' + token.tokendata.access_token
        }
      },
        function optionalCallback(err, httpResponse, result) {
          if (err) {
            return resolve([]);
          } else {
            new Promise(async function (resolve1, reject1) {
              var body = JSON.parse(result);
              if (typeof (body.value) != 'undefined') {
                for (var key = 0; key < body.value.length; key++) {
                  var vm = body.value[key]
                  if (!networkList) var networkList = [];
                  if (await typeof (vm.properties.networkProfile) != 'undefined') {
                    var string = await vm.properties.networkProfile.networkInterfaces[0].id.split('/');
                    var network = string[8];
                    if (vm.location == location)
                      await networkList.push(network)
                  }
                }
              } else {
                if (!networkList) var networkList = [];
              }
              resolve(networkList)
            });
          }
        });
    })
    //    console.log(networks)
    var interfaces = await new Promise(function (resolve, reject) {
      var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/networkInterfaces?api-version=2020-03-01`
      request.get({
        url: url, headers: {
          "Authorization": 'Bearer ' + token.tokendata.access_token
        }
      },
        function optionalCallback(err, httpResponse, result) {
          if (err) {
            return resolve([]);
          } else {
            new Promise(async function (resolve1, reject1) {
              var body = JSON.parse(result);
              if (typeof (body.value) != 'undefined') {
                for (var key = 0; key < body.value.length; key++) {
                  var interface = body.value[key]
                  if (!interfaceList) var interfaceList = [];
                  if (!in_array(interface.name, networks)) {
                    if (interface.location == location && interface.properties.enableAcceleratedNetworking == false)
                      await interfaceList.push(interface)
                  }
                }
              } else {
                if (!interfaceList) var interfaceList = [];
              }
              resolve(interfaceList)
            });
          }
        });
    })
    return callback(null, interfaces);
  })
}
/*
  Author: Pradeep
  Descri: Get vm sizes
  Date  : 22-10-2019
*/
let getVmSizes = (reqBody, callback) => {
  var resourceGroup = reqBody.resourceGroup;
  var subscriptionId = reqBody.subscriptionId;
  var vmName = reqBody.vmName;
  var clientid = reqBody.clientid;
  if (typeof (resourceGroup) == 'undefined' || resourceGroup == '') {
    var response = { message: 'Please provide resource group.' }
    return callback([], response);
  }
  if (typeof (subscriptionId) == 'undefined' || subscriptionId == '') {
    var response = { message: 'Please provide subscription id.' }
    return callback([], response);
  }
  if (typeof (vmName) == 'undefined' || vmName == '') {
    var response = { message: 'Please provide vm name.' }
    return callback([], response);
  }
  if (typeof (clientid) == 'undefined' || clientid == '') {
    var response = { message: 'Please provide clientid.' }
    return callback([], response);
  }
  new Promise(function (resolve, reject) {
    azure_authtoken(clientid, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(async function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/${vmName}/vmSizes?api-version=2022-03-01`
    await request.get({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback(null, err);
        } else {
          var body = JSON.parse(result);
          return callback(null, body);
        }
      });
  })
}

/*
  Author: Pradeep
  Descri: create network interface list
  Date  : 22-10-2019
*/
let createNetworkInterfaces = (reqBody, callback) => {
  if (typeof (reqBody.location) == 'undefined' || reqBody.location == '') {
    return callback([], { success: 0, message: 'Please provide location name.' });
  }
  if (typeof (reqBody.clientid) == 'undefined' || reqBody.clientid == '') {
    return callback([], { success: 0, message: 'Please provide client id.' });
  }
  if (typeof (reqBody.subscriptionId) == 'undefined' || reqBody.subscriptionId == '') {
    return callback([], { success: 0, message: 'Please provide subscription id.' });
  }
  if (typeof (reqBody.networkInterface) == 'undefined' || reqBody.networkInterface == '') {
    return callback([], { success: 0, message: 'Please provide Netwrok Interface.' });
  }
  if (typeof (reqBody.resourceGroup) == 'undefined' || reqBody.resourceGroup == '') {
    return callback([], { success: 0, message: 'Please provide resource group.' });
  }
  if (typeof (reqBody.publicIpAddressName) == 'undefined' || reqBody.publicIpAddressName == '') {
    return callback([], { success: 0, message: 'Please provide public ip address name.' });
  }
  if (typeof (reqBody.virtualNetwork) == 'undefined' || reqBody.virtualNetwork == '') {
    return callback([], { success: 0, message: 'Please provide virtual network profile.' });
  }
  if (typeof (reqBody.configName) == 'undefined' || reqBody.configName == '') {
    return callback([], { success: 0, message: 'Please provide configuration name.' });
  }
  if (typeof (reqBody.subnetName) == 'undefined' || reqBody.subnetName == '') {
    return callback([], { success: 0, message: 'Please provide subnet name.' });
  }
  var location = reqBody.location;//'centralus';
  var clientid = reqBody.clientid;//'222';
  var subscriptionid = reqBody.subscriptionId;//'301fcf16-9cc8-4d4c-a149-dbb5e1aaa718';
  var networkInterface = reqBody.networkInterface;//'pkp-nic2';
  var resourceGroup = reqBody.resourceGroup;//'automation';
  var publicIpAddressName = reqBody.publicIpAddressName;//'automation';
  var virtualNetwork = reqBody.virtualNetwork;//'automation';
  var configName = reqBody.configName;//'ip_config';
  var subnetName = reqBody.subnetName;//'default';

  var reqBody =
  {
    "location": `${location}`,
    "properties": {
      "enableAcceleratedNetworking": false,
      "ipConfigurations": [
        {
          "name": `${configName}`,
          "properties": {
            "publicIPAddress": {
              "id": `/subscriptions/${subscriptionid}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/publicIPAddresses/${publicIpAddressName}`
            },
            "subnet": {
              "id": `/subscriptions/${subscriptionid}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/virtualNetworks/${virtualNetwork}/subnets/${subnetName}` //default
            }
          }
        }
      ]
    },
  }
  new Promise(function (resolve, reject) {
    azure_authtoken(clientid, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    console.log('entered')
    var url = `https://management.azure.com/subscriptions/${subscriptionid}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/networkInterfaces/${networkInterface}?api-version=2020-04-01`
    request.put({
      url: url, body: JSON.stringify(reqBody), headers: {
        "Content-Type": "application/json",
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          if (typeof result != 'undefined')
            var body = JSON.parse(result);
          else var body = [];
          return callback(null, body);
        }
      });
  })
}
/*
  Author: Pradeep
  Descri: vm creation
  Date  : 25-05-2020
*/
let createVm = (reqBody, callback) => {
  if (typeof (reqBody.location) == 'undefined' || reqBody.location == '') {
    return callback([], { success: 0, message: 'Please provide location name.' });
  }
  if (typeof (reqBody.clientid) == 'undefined' || reqBody.clientid == '') {
    return callback([], { success: 0, message: 'Please provide client id.' });
  }
  if (typeof (reqBody.subscriptionId) == 'undefined' || reqBody.subscriptionId == '') {
    return callback([], { success: 0, message: 'Please provide subscription id.' });
  }
  if (typeof (reqBody.vmSize) == 'undefined' || reqBody.vmSize == '') {
    return callback([], { success: 0, message: 'Please provide vm size.' });
  }
  if (typeof (reqBody.imageName) == 'undefined' || reqBody.imageName == '') {
    return callback([], { success: 0, message: 'Please provide image name.' });
  }
  // if(typeof(reqBody.diskName)=='undefined' || reqBody.diskName==''){
  //   return callback([],{success:0,message:'Please provide storage disk name.'});
  // }
  if (typeof (reqBody.storageAccountType) == 'undefined' || reqBody.storageAccountType == '') {
    return callback([], { success: 0, message: 'Please provide storage account type.' });
  }
  if (typeof (reqBody.networkInterface) == 'undefined' || reqBody.networkInterface == '') {
    return callback([], { success: 0, message: 'Please provide Netwrok Interface.' });
  }
  if (typeof (reqBody.adminUsername) == 'undefined' || reqBody.adminUsername == '') {
    return callback([], { success: 0, message: 'Please provide admin username.' });
  }
  if (typeof (reqBody.adminPassword) == 'undefined' || reqBody.adminPassword == '') {
    return callback([], { success: 0, message: 'Please provide admin password.' });
  }
  if (typeof (reqBody.computerName) == 'undefined' || reqBody.computerName == '') {
    return callback([], { success: 0, message: 'Please provide computer name.' });
  }
  if (typeof (reqBody.resourceGroup) == 'undefined' || reqBody.resourceGroup == '') {
    return callback([], { success: 0, message: 'Please provide resource group.' });
  }
  // if(typeof(reqBody.availabilitySets)=='undefined' || reqBody.availabilitySets==''){
  //   return callback([],{success:0,message:'Please provide availability sets.'});
  // }
  var location = reqBody.location;//'centralus';//drpdown box
  var clientid = reqBody.clientid;//'222';//in api call
  var vmSize = reqBody.vmSize;//'Standard_D3_v2';//hardware profile from dropdown
  var storageAccountType = reqBody.storageAccountType;//'Standard_LRS'; //from os disk acount type form api
  var imageName = reqBody.imageName;//'mydisk121';//dropdown name
  var customDiskName = reqBody.computerName + 'disk1';//'mydisk121';//dynamically create the disk name
  var subscriptionid = reqBody.subscriptionId;//'301fcf16-9cc8-4d4c-a149-dbb5e1aaa718';
  var networkInterface = reqBody.networkInterface;//'pkp-nic2';//dynamic creation
  var adminUsername = reqBody.adminUsername;//'pkp123';entry
  var computerName = reqBody.computerName;//'pkp123';vm name
  var adminPassword = reqBody.adminPassword;//'pkp123@123';entry
  var resourceGroup = reqBody.resourceGroup;//'automation';//dropdown filter
  //var availabilitySets=reqBody.availabilitySets;//'avail123';//optional params

  if (reqBody.vm_detail_id) {
    var vm_detail_id = reqBody.vm_detail_id;
  }


  var reqBodyCreation =
  {
    "location": `${location}`,
    "properties": {
      "hardwareProfile": {
        "vmSize": `${vmSize}`
      },
      "storageProfile": {
        // "imageReference": {
        //     "sku": "2016-Datacenter",
        //     "publisher": "MicrosoftWindowsServer",
        //     "version": "latest",
        //     "offer": "WindowsServer"
        // },
        "imageReference": {
          "id": `/subscriptions/${subscriptionid}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/images/${imageName}`
        },
        "osDisk": {
          "caching": "ReadWrite",
          "managedDisk": {
            "storageAccountType": `${storageAccountType}`
          },
          "name": `${customDiskName}`,
          "createOption": "FromImage"
        }
      },
      "osProfile": {
        "adminUsername": `${adminUsername}`,
        "computerName": `${computerName}`,
        "adminPassword": `${adminPassword}`
      },
      // "availabilitySet": {
      //   "id": `/subscriptions/${subscriptionid}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/availabilitySets/${availabilitySets}`
      // },
      "networkProfile": {
        "networkInterfaces": [
          {
            "id": `/subscriptions/${subscriptionid}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/networkInterfaces/${networkInterface}`,
            "properties": {
              "primary": true
            }
          }
        ]
      }
    }
  }
  console.log("reqBodyCreation");
  console.log(reqBodyCreation);
  console.log(JSON.stringify(reqBodyCreation));
  new Promise(function (resolve, reject) {
    azure_authtoken(clientid, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    console.log('entered')
    var url = `https://management.azure.com/subscriptions/${subscriptionid}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/${computerName}?api-version=2022-03-01`;
    request.put({
      url: url, body: JSON.stringify(reqBodyCreation), headers: {
        "Content-Type": "application/json",
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          if (typeof result != 'undefined') {
            var body = JSON.parse(result);
            ///=========================
            if (reqBody.diskId && reqBody.diskSizeGB) {
              var frmValues = {
                clientid: clientid,
                subscription_id: subscriptionid,
                vmName: computerName,
                caching: "ReadWrite",
                diskId: reqBody.diskId,
                storageAccountType: storageAccountType,
                diskSizeGB: reqBody.diskSizeGB,
                createOption: "Empty",
                resourceGroup: resourceGroup
              }
              //console.log(frmValues);
              var urlpath = 'https://management.azure.com/subscriptions/' + frmValues.subscription_id + '/resourceGroups/' + frmValues.resourceGroup + '/providers/Microsoft.Compute/virtualMachines/' + frmValues.vmName + '?api-version=2022-03-01';
              var options = {
                method: 'GET',
                url: urlpath,
                headers:
                {
                  'cache-control': 'no-cache',
                  'content-type': 'application/json',
                  authorization: token.tokendata.token_type + ' ' + token.tokendata.access_token
                },
                json: true
              };
              request(options, async function (error, response, vmBody) {
                if (error) {
                  //let res = {status:"error","message":error.error.message};
                  //return callback(1,res);
                  //throw new Error(error);
                } else {
                  //console.log(vmBody);
                  if (vmBody.name) {
                    urlpath = 'https://management.azure.com/subscriptions/' + frmValues.subscription_id + '/resourceGroups/' + frmValues.resourceGroup + '/providers/Microsoft.Compute/virtualMachines/' + frmValues.vmName + '?api-version=2022-03-01';
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
                      "managedDisk": {
                        "id": frmValues.diskId,
                        "storageAccountType": frmValues.storageAccountType
                      },
                      "diskSizeGB": frmValues.diskSizeGB,
                      "createOption": "Attach",
                      "lun": helper.getRandomNumberWithinRange(0, 63, lunArr)
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

                    var options = {
                      method: 'PUT',
                      url: urlpath,
                      headers:
                      {
                        'cache-control': 'no-cache',
                        'content-type': 'application/json',
                        authorization: token.tokendata.token_type + ' ' + token.tokendata.access_token
                      },
                      body: reqBody,
                      json: true
                    };

                    request(options, async function (error, response, body) {
                      if (error) {
                        //let res = {status:"error","message":error.error.message};
                        //return callback(1,res);
                        //throw new Error(error);
                      } else {
                        //console.log(body);
                        if (body.name) {
                          let res = { status: "success", "message": "Disk attached successfully" };
                          console.log(res)
                          //return callback(null,res);
                        } else {
                          //let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                          // if(body.error && body.error.message){
                          //     res.message = body.error.message;
                          // }
                          //return callback(1,res);
                          //throw new Error(error);
                        }
                      }
                    });
                  } else {
                    // let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                    // if(vmBody.error && vmBody.error.message){
                    //     res.message = vmBody.error.message;
                    // }
                    // return callback(1,res);
                    // //throw new Error(error);
                  }
                }
              });
            }
            ///==========================
          }
          else
            var body = {};
          return callback(null, body);
        }
      });
  })
}
/*
  Author: Pradeep
  Descri: resize vm
  Date  : 25-05-2020
*/
//let resizeVm=(reqBody,callback)=>{
//  if(typeof(reqBody.location)=='undefined' || reqBody.location==''){
//    return callback([],{success:0,message:'Please provide location name.'});
//  }
//  if(typeof(reqBody.clientid)=='undefined' || reqBody.clientid==''){
//    return callback([],{success:0,message:'Please provide client id.'});
//  }
//  if(typeof(reqBody.subscriptionId)=='undefined' || reqBody.subscriptionId==''){
//    return callback([],{success:0,message:'Please provide subscription id.'});
//  }
//  if(typeof(reqBody.vmSize)=='undefined' || reqBody.vmSize==''){
//    return callback([],{success:0,message:'Please provide vm size.'});
//  }
//  // if(typeof(reqBody.diskName)=='undefined' || reqBody.diskName==''){
//  //   return callback([],{success:0,message:'Please provide storage disk name.'});
//  // }
//  // if(typeof(reqBody.storageAccountType)=='undefined' || reqBody.storageAccountType==''){
//  //   return callback([],{success:0,message:'Please provide storage account type.'});
//  // }
//  // if(typeof(reqBody.networkInterface)=='undefined' || reqBody.networkInterface==''){
//  //   return callback([],{success:0,message:'Please provide Netwrok Interface.'});
//  // }
//  // if(typeof(reqBody.adminUsername)=='undefined' || reqBody.adminUsername==''){
//  //   return callback([],{success:0,message:'Please provide admin username.'});
//  // }
//  // if(typeof(reqBody.adminPassword)=='undefined' || reqBody.adminPassword==''){
//  //   return callback([],{success:0,message:'Please provide admin password.'});
//  // }
//  if(typeof(reqBody.computerName)=='undefined' || reqBody.computerName==''){
//    return callback([],{success:0,message:'Please provide computer name.'});
//  }
//  if(typeof(reqBody.resourceGroup)=='undefined' || reqBody.resourceGroup==''){
//    return callback([],{success:0,message:'Please provide resource group.'});
//  }
//  // if(typeof(reqBody.availabilitySets)=='undefined' || reqBody.availabilitySets==''){
//  //   return callback([],{success:0,message:'Please provide availability sets.'});
//  // }
//  var location=reqBody.location;//'centralus';//drpdown box
//  var clientid=reqBody.clientid;//'222';//in api call
//  var vmSize=reqBody.vmSize;//'Standard_D3_v2';//hardware profile from dropdown
//  var storageAccountType=reqBody.storageAccountType;//'Standard_LRS'; //from os disk acount type form api
//  var diskName=reqBody.diskName;//'mydisk121';//dropdown value form from order form
//  var subscriptionid=reqBody.subscriptionId;//'301fcf16-9cc8-4d4c-a149-dbb5e1aaa718';
//  var networkInterface=reqBody.networkInterface;//'pkp-nic2';//dynamic creation
//  var adminUsername=reqBody.adminUsername;//'pkp123';entry
//  var computerName=reqBody.computerName;//'pkp123';vm name
//  var adminPassword=reqBody.adminPassword;//'pkp123@123';entry
//  var resourceGroup=reqBody.resourceGroup;//'automation';//dropdown filter
//  //var availabilitySets=reqBody.availabilitySets;//'avail123';//optional params
//  //https://management.azure.com/subscriptions/301fcf16-9cc8-4d4c-a149-dbb5e1aaa718/resourceGroups/automation/providers/Microsoft.Compute/virtualMachines/pkptesting1/vmSizes?api-version=2022-03-01
//var reqBody=
//{
//  "location": `${location}`,
//  "properties": {
//      "hardwareProfile": {
//          "vmSize": `${vmSize}`
//      },
//      // "storageProfile": {
//      //      "imageReference": {
//      //          "sku": "2016-Datacenter",
//      //          "publisher": "MicrosoftWindowsServer",
//      //          "version": "latest",
//      //          "offer": "WindowsServer"
//      //       },
//      //      "imageReference": {
//      //         "id": `/subscriptions/${subscriptionid}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/images/${imageName}`
//      //      },
//      //     "osDisk": {
//      //         "caching": "ReadWrite",
//      //         "managedDisk": {
//      //             "storageAccountType": `${storageAccountType}`
//      //         },
//      //         "name": `${diskName}`,
//      //         "createOption": "FromImage"
//      //     }
//      // },
//      // "osProfile": {
//      //     "adminUsername": `${adminUsername}`,
//      //     "computerName": `${computerName}`,
//      //     "adminPassword": `${adminPassword}`
//      // },
//      // "availabilitySet": {
//      //   "id": `/subscriptions/${subscriptionid}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/availabilitySets/${availabilitySets}`
//      // },
//      // "networkProfile": {
//      //     "networkInterfaces": [
//      //         {
//      //             "id": `/subscriptions/${subscriptionid}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/networkInterfaces/${networkInterface}`,
//      //             "properties": {
//      //                 "primary": true
//      //             }
//      //         }
//      //     ]
//      // }
//  }
//}
//    new Promise(function(resolve,reject){
//      azure_authtoken(clientid,function(error,result){
//        if(error) return resolve([])
//        return resolve(result)
//      })
//    }).then(function(token){
//      if(!token){
//        var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
//        return callback([],response);
//      }
//      console.log('entered')
//      var url=`https://management.azure.com/subscriptions/${subscriptionid}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/${computerName}?api-version=2022-03-01`;
//      request.put({url:url,body:JSON.stringify(reqBody), headers : {
//        "Content-Type":"application/json",
//        "Authorization" :'Bearer '+token.tokendata.access_token
//        }},
//      function optionalCallback(err, httpResponse, result) {
//        if (err) {
//          let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
//          if(err && err.message){
//              res.message = body.error.message;
//          }
//          return callback(1,res);
//        }else{
//          if(typeof result !='undefined')
//            var body=JSON.parse(result);
//          else 
//            var body=[];
//
//          let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
//          if(body.error && body.error.message){
//              res.message = body.error.message;
//          }else if(body.name){
//            res.status = "success";
//            res.message = "VM Resize initiated.";
//          }
//          // token.tokendata.subscription_id=subscriptionid;
//          return callback(null,res);
//        }
//      });
//    })
//}
/*
  Author: Pradeep
  Descri: assignAvailabilityToVm
  Date  : 25-05-2020
*/
let assignAvailabilityToVm = (reqBody, callback) => {
  if (typeof (reqBody.location) == 'undefined' || reqBody.location == '') {
    return callback([], { success: 0, message: 'Please provide location name.' });
  }
  if (typeof (reqBody.clientid) == 'undefined' || reqBody.clientid == '') {
    return callback([], { success: 0, message: 'Please provide client id.' });
  }
  if (typeof (reqBody.subscriptionId) == 'undefined' || reqBody.subscriptionId == '') {
    return callback([], { success: 0, message: 'Please provide subscription id.' });
  }
  if (typeof (reqBody.availabilitySets) == 'undefined' || reqBody.availabilitySets == '') {
    return callback([], { success: 0, message: 'Please provide vm availability set.' });
  }
  // if(typeof(reqBody.diskName)=='undefined' || reqBody.diskName==''){
  //   return callback([],{success:0,message:'Please provide storage disk name.'});
  // }
  // if(typeof(reqBody.storageAccountType)=='undefined' || reqBody.storageAccountType==''){
  //   return callback([],{success:0,message:'Please provide storage account type.'});
  // }
  // if(typeof(reqBody.networkInterface)=='undefined' || reqBody.networkInterface==''){
  //   return callback([],{success:0,message:'Please provide Netwrok Interface.'});
  // }
  // if(typeof(reqBody.adminUsername)=='undefined' || reqBody.adminUsername==''){
  //   return callback([],{success:0,message:'Please provide admin username.'});
  // }
  // if(typeof(reqBody.adminPassword)=='undefined' || reqBody.adminPassword==''){
  //   return callback([],{success:0,message:'Please provide admin password.'});
  // }
  if (typeof (reqBody.computerName) == 'undefined' || reqBody.computerName == '') {
    return callback([], { success: 0, message: 'Please provide computer name.' });
  }
  if (typeof (reqBody.resourceGroup) == 'undefined' || reqBody.resourceGroup == '') {
    return callback([], { success: 0, message: 'Please provide resource group.' });
  }
  // if(typeof(reqBody.availabilitySets)=='undefined' || reqBody.availabilitySets==''){
  //   return callback([],{success:0,message:'Please provide availability sets.'});
  // }
  var location = reqBody.location;//'centralus';//drpdown box
  var clientid = reqBody.clientid;//'222';//in api call
  var vmSize = reqBody.vmSize;//'Standard_D3_v2';//hardware profile from dropdown
  var storageAccountType = reqBody.storageAccountType;//'Standard_LRS'; //from os disk acount type form api
  var diskName = reqBody.diskName;//'mydisk121';//dropdown value form from order form
  var subscriptionid = reqBody.subscriptionId;//'301fcf16-9cc8-4d4c-a149-dbb5e1aaa718';
  var networkInterface = reqBody.networkInterface;//'pkp-nic2';//dynamic creation
  var adminUsername = reqBody.adminUsername;//'pkp123';entry
  var computerName = reqBody.computerName;//'pkp123';vm name
  var adminPassword = reqBody.adminPassword;//'pkp123@123';entry
  var resourceGroup = reqBody.resourceGroup;//'automation';//dropdown filter
  var availabilitySets = reqBody.availabilitySets;//'avail123';//optional params
  //https://management.azure.com/subscriptions/301fcf16-9cc8-4d4c-a149-dbb5e1aaa718/resourceGroups/automation/providers/Microsoft.Compute/virtualMachines/pkptesting1/vmSizes?api-version=2022-03-01
  var reqBody =
  {
    "location": `${location}`,
    "properties": {
      // "hardwareProfile": {
      //     "vmSize": `${vmSize}`
      // },
      // "storageProfile": {
      //      "imageReference": {
      //          "sku": "2016-Datacenter",
      //          "publisher": "MicrosoftWindowsServer",
      //          "version": "latest",
      //          "offer": "WindowsServer"
      //       },
      //      "imageReference": {
      //         "id": `/subscriptions/${subscriptionid}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/images/${imageName}`
      //      },
      //     "osDisk": {
      //         "caching": "ReadWrite",
      //         "managedDisk": {
      //             "storageAccountType": `${storageAccountType}`
      //         },
      //         "name": `${diskName}`,
      //         "createOption": "FromImage"
      //     }
      // },
      // "osProfile": {
      //     "adminUsername": `${adminUsername}`,
      //     "computerName": `${computerName}`,
      //     "adminPassword": `${adminPassword}`
      // },
      "availabilitySet": {
        "id": `/subscriptions/${subscriptionid}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/availabilitySets/${availabilitySets}`
      },
      // "networkProfile": {
      //     "networkInterfaces": [
      //         {
      //             "id": `/subscriptions/${subscriptionid}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/networkInterfaces/${networkInterface}`,
      //             "properties": {
      //                 "primary": true
      //             }
      //         }
      //     ]
      // }
    }
  }
  new Promise(function (resolve, reject) {
    azure_authtoken(clientid, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    console.log('entered')
    var url = `https://management.azure.com/subscriptions/${subscriptionid}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/${computerName}?api-version=2022-03-01`;
    request.put({
      url: url, body: JSON.stringify(reqBody), headers: {
        "Content-Type": "application/json",
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          if (typeof result != 'undefined')
            var body = JSON.parse(result);
          else
            var body = [];
          // token.tokendata.subscription_id=subscriptionid;
          return callback(null, body);
        }
      });
  })
}
/*
  Author : Rajesh
  Description : get and update Azure Subscription list
  Date  : 08-05-2020
*/
let getAzureSubscriptionList = async (reqObj, callback) => {
  console.log(reqObj);
  let sql = `Select c.* from c4_clients as c 
    where c.status = 1 and c.azure_linked = 1`;
  if (typeof reqObj.id != 'undefined') {
    sql += ` and c.id = ${reqObj.id} order by id desc limit 1`;
  } else {
    sql += ` order by id asc`;
  }
  console.log(sql);
  await new Promise(function (resolve, reject) {
    dbHandler.executeQuery(sql, async function (SubscriptionClients) {
      // console.log("SubscriptionClients");
      // console.log(SubscriptionClients);
      try {
        if (SubscriptionClients.length > 0) {
          let subIds = [];
          for await (const item of SubscriptionClients) {
            await new Promise(async function (itemResolve, itemReject) {
              tokenData = {
                grant_type: item.azure_granttype,
                client_id: item.azure_clientid,
                client_secret: item.azure_clientsecretkey,
                resource: item.azure_resource
              };
              console.log("tokenData");
              console.log(tokenData);
              let urlpath = 'https://login.microsoftonline.com/' + item.azure_tenantid + '/oauth2/token';
              console.log(urlpath);

              axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
              await axios
                .post(urlpath, querystring.stringify(tokenData))
                .then(async tokenResponse => {
                  console.log(tokenResponse.data);
                  if (tokenResponse.data.access_token) {
                    urlpath = 'https://management.azure.com/subscriptions?api-version=2016-06-01';

                    axios.defaults.headers.get['authorization'] = tokenResponse.data.token_type + ' ' + tokenResponse.data.access_token;
                    await axios
                      .get(urlpath)
                      .then(async subscriptionResponse => {
                        console.log(subscriptionResponse.data);
                        if (subscriptionResponse.data.value.length > 0) {
                          //                                        	await dbHandler.updateTableData('c4_azure_subscriptions',{'clientid':item.id},{state:"Disabled"},function(err,result){
                          //                                        		console.log(result);
                          //                                        	});
                          for await (const subscriptionData of subscriptionResponse.data.value) {
                            await new Promise(async function (subscriptionResolve, subscriptionReject) {
                              let subscriptionSql = `SELECT id from c4_azure_subscriptions
                                                    where clientid = '${item.id}' and subscription_id = '${subscriptionData.subscriptionId}'`;
                              console.log("subscriptionSql");
                              console.log(subscriptionSql);
                              await dbHandler.executeQuery(subscriptionSql, async function (subscriptionInfo) {
                                console.log("subscriptionInfo");
                                console.log(subscriptionInfo);
                                let vm_provision_code = 'CAMPN';
                                // if (subscriptionData.displayName.indexOf('-') >= 0) {
                                //   vm_provision_code = "XA" + subscriptionData.displayName.split('-')[(subscriptionData.displayName.split('-').length - 1)];
                                // }
                                if (subscriptionInfo.length > 0) {
                                  let updateData = {
                                    display_name: subscriptionData.displayName,
                                    vm_provision_code: vm_provision_code,
                                    state: subscriptionData.state,
                                    response_obj: JSON.stringify(subscriptionData),
                                    updated_date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
                                  };
                                  console.log("updateData");
                                  console.log(updateData);
                                  await dbHandler.updateTableData('c4_azure_subscriptions', { 'id': subscriptionInfo[0].id }, updateData, function (err, result) {
                                    console.log("updated the subscriptionInfo with id " + subscriptionData.subscriptionId);
                                    subscriptionResolve("updated the subscriptionInfo with id " + subscriptionData.subscriptionId);
                                  });
                                } else {
                                  let insData = {
                                    clientid: item.id,
                                    subscription_id: subscriptionData.subscriptionId,
                                    display_name: subscriptionData.displayName,
                                    vm_provision_code: vm_provision_code,
                                    state: subscriptionData.state,
                                    response_obj: JSON.stringify(subscriptionData),
                                    created_date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
                                  };
                                  console.log("insData");
                                  console.log(insData);
                                  await dbHandler.insertIntoTable('c4_azure_subscriptions', insData, async function (error, vmdid) {
                                    console.log("inserted the subscriptionInfo with id " + subscriptionData.subscriptionId);
                                    subscriptionResolve("inserted the subscriptionInfo with id " + subscriptionData.subscriptionId);
                                  });
                                }
                              });
                              // console.log("subscription data updated client id "+item.id+" and subscription id "+subscriptionData.subscriptionId);
                              // subscriptionResolve("subscription data updated client id "+item.id+" and subscription id "+subscriptionData.subscriptionId);
                            });
                          }

                          //                                            await dbHandler.updateTableData('c4_azure_subscriptions',{'clientid':item.id},{state:"Disabled"},function(err,result){
                          //                                        		console.log(result);
                          //                                        	});
                          /*let subIds = [];
                          //Update the not listed c4_azure_subscriptions state to Disabled
                        if(subIds.length > 0){
                          let updateSql = "update c4_azure_subscriptions set state='Disabled' WHERE clientid = '"+item.id+"' and id not in ("+subIds.join()+")";
                          console.log("subIds --- ", subIds);
                          console.log("updateSql --- ", updateSql);
                          db.query(updateSql, (error,rows,fields)=>{
                            dbFunc.connectionRelease;
                                if(!!error) {
                                  console.log(error);
                                } else {
                                    console.log(`Updated Record status to 0'`);
                                    console.log(rows);
                                }
                           });
                        }*/
                        }
                      })
                      .catch(error => {
                        console.log(error);
                        itemResolve({ "message": error });
                      });
                  }
                })
                .catch(error => {
                  console.log(error);
                  itemResolve({ "message": error });
                });
              console.log("updated for client id " + item.id);
              itemResolve("updated for client id " + item.id);
            });
          };
          console.log("Updated Azure Subscription List");
          callback(null, "Updated Azure Subscription List");
          resolve("Updated Azure Subscription List");
        } else {
          console.log("No clients available to update the Azure Subscription List");
          callback(1, "No clients available to update the Azure Subscription List");
          resolve("No clients available to update the Azure Subscription List");
        }
      }
      catch {
        resolve(0);
      }
    });
  });

}

/*
  Author : Rajesh
  Description : get and update Azure Subscription wise Location list
  Date  : 08-05-2020
*/
let getAzureSubscriptionWiseLocationList = async (reqObj, callback) => {
  console.log(reqObj);
  let sql = `Select s.subscription_id, s.clientid, c.azure_tenantid, 
    c.azure_clientid, c.azure_clientsecretkey, 
    c.azure_resource, c.azure_granttype 
    from c4_azure_subscriptions as s
    inner join c4_clients as c on c.id = s.clientid
    where c.status = 1 and c.azure_linked = 1 and s.state='Enabled' and s.record_status = 1 `;
  if (typeof reqObj.id != 'undefined') {
    sql += ` and c.id = ${reqObj.id} order by c.id desc`;
  } else {
    sql += ` order by c.id asc`;
  }
  console.log(sql);
  await new Promise(function (resolve, reject) {
    dbHandler.executeQuery(sql, async function (SubscriptionData) {
      console.log("SubscriptionData");
      console.log(SubscriptionData);
      try {
        if (SubscriptionData.length > 0) {
          for await (const item of SubscriptionData) {
            await new Promise(async function (itemResolve, itemReject) {
              tokenData = {
                grant_type: item.azure_granttype,
                client_id: item.azure_clientid,
                client_secret: item.azure_clientsecretkey,
                resource: item.azure_resource
              };
              console.log("tokenData");
              console.log(tokenData);
              let urlpath = 'https://login.microsoftonline.com/' + item.azure_tenantid + '/oauth2/token';
              console.log(urlpath);

              axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
              await axios
                .post(urlpath, querystring.stringify(tokenData))
                .then(async tokenResponse => {
                  console.log(tokenResponse.data);
                  if (tokenResponse.data.access_token) {
                    urlpath = 'https://management.azure.com/subscriptions/' + item.subscription_id + '/locations?api-version=2016-06-01';

                    axios.defaults.headers.get['authorization'] = tokenResponse.data.token_type + ' ' + tokenResponse.data.access_token;
                    await axios
                      .get(urlpath)
                      .then(async locationResponse => {
                        console.log(locationResponse.data);
                        if (locationResponse.data.value.length > 0) {
                          for await (const locationData of locationResponse.data.value) {
                            await new Promise(async function (locationResolve, locationReject) {
                              let locationSql = `SELECT id from c4_azure_subscription_locations
                                                    where clientid = '${item.clientid}' and subscription_id = '${item.subscription_id}' and name = '${locationData.name}'`;
                              console.log("locationSql");
                              console.log(locationSql);
                              await dbHandler.executeQuery(locationSql, async function (locationInfo) {
                                console.log("locationInfo");
                                console.log(locationInfo);
                                if (locationInfo.length > 0) {
                                  let updateData = {
                                    display_name: locationData.displayName,
                                    longitude: locationData.longitude,
                                    latitude: locationData.latitude,
                                    response_obj: JSON.stringify(locationData),
                                    updated_date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
                                  };
                                  // console.log("updateData");
                                  // console.log(updateData);
                                  await dbHandler.updateTableData('c4_azure_subscription_locations', { 'id': locationInfo[0].id }, updateData, function (err, result) {
                                    console.log("updated the subscriptionInfo with client id " + item.clientid + ", subscription id " + item.subscription_id + ", name " + locationData.name);
                                    locationResolve("updated the subscriptionInfo with client id " + item.clientid + ", subscription id " + item.subscription_id + ", name " + locationData.name);
                                  });
                                } else {
                                  let insData = {
                                    clientid: item.clientid,
                                    subscription_id: item.subscription_id,
                                    name: locationData.name,
                                    display_name: locationData.displayName,
                                    longitude: locationData.longitude,
                                    latitude: locationData.latitude,
                                    response_obj: JSON.stringify(locationData),
                                    created_date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
                                  };
                                  // console.log("insData");
                                  // console.log(insData);
                                  await dbHandler.insertIntoTable('c4_azure_subscription_locations', insData, async function (error, vmdid) {
                                    console.log("inserted the subscriptionInfo with client id " + item.clientid + ", subscription id " + item.subscription_id + ", name " + locationData.name);
                                    locationResolve("inserted the subscriptionInfo with client id " + item.clientid + ", subscription id " + item.subscription_id + ", name " + locationData.name);
                                  });
                                }
                              });
                            });
                          }
                        }
                      })
                      .catch(error => {
                        console.log(error);
                        itemResolve({ "message": error });
                      });
                  }
                })
                .catch(error => {
                  console.log(error);
                  itemResolve({ "message": error });
                });
              console.log("updated for client id " + item.clientid + ", subscription id " + item.subscription_id);
              itemResolve("updated for client id " + item.clientid + ", subscription id " + item.subscription_id);
            });
          };
          console.log("Updated Azure Subscription Locations List");
          callback(null, "Updated Azure Subscription Locations List");
          resolve("Updated Azure Subscription Locations List");
        } else {
          console.log("No clients available to update the Azure Subscription Locations List");
          callback(1, "No clients available to update the Azure Subscription Locations List");
          resolve("No clients available to update the Azure Subscription Locations List");
        }
      }
      catch {
        resolve(0);
      }
    });
  });

}

/*
  Author : Rajesh
  Description : sync Azure StorageTypes
  Date  : 18-06-2020
*/
let syncAzureStorageTypes = async (reqQuery, callback) => {
  var sql = `select s.clientid,s.subscription_id from c4_azure_subscriptions as s 
  where s.state='Enabled' and s.record_status = 1`
  await dbHandler.executeQuery(sql, async function (subscriptionList) {
    console.log(subscriptionList)
    for await (var subscription of subscriptionList) {
      // for(var i=0;i<subscriptionList.length;i++){
      await new Promise(async function (resolve1, reject1) {
        // var subscription=subscriptionList[i]
        var clientid = subscription.clientid;
        var subscriptionId = subscription.subscription_id;
        await new Promise(function (resolve2, reject2) {
          azure_authtoken(clientid, function (error, result) {
            // if(error){
            //   //return resolve2([])
            // }
            return resolve2(result)
          })
        }).then(async function (token) {
          if (!token) {
            resolve1('Continue');
          }
          var url = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Storage/skus?api-version=2019-06-01`;
          // console.log(url);
          await new Promise(async function (resolve4, reject4) {
            request.get({
              url: url, headers: {
                "Authorization": 'Bearer ' + token.tokendata.access_token
              }
            },
              async function optionalCallback(err, httpResponse, result) {
                if (err) {
                  resolve1('Continue');
                } else {
                  if (typeof result != 'undefined')
                    var body = JSON.parse(result);
                  else
                    var body = [];
                  // console.log(body.value)
                  if (body && body.value) {
                    for await (const catalogData of body.value) {
                      // console.log('catalogData')
                      // console.log(catalogData)
                      await new Promise(async function (resolve3, reject3) {
                        let catalogSql = `SELECT id from c4_azure_storagetypes
                            where storagetype = '${catalogData.name}' limit 1`;
                        console.log('catalogSql')
                        console.log(catalogSql)
                        await dbHandler.executeQuery(catalogSql, async function (catalogInfo) {
                          console.log('catalogInfo')
                          console.log(catalogInfo)
                          if (catalogInfo.length == 0) {
                            let insData = {
                              storagetype: catalogData.name
                            };
                            console.log('insData')
                            console.log(insData)
                            await dbHandler.insertIntoTable('c4_azure_storagetypes', insData, async function (error, storageid) {
                              vmSizes = config.allowedVmSizes;
                              for await (const vmSizeVal of vmSizes) {
                                let sizeInsData = {
                                  storagetype: catalogData.name,
                                  vmsizeName: vmSizeVal
                                };
                                console.log('sizeInsData')
                                console.log(sizeInsData)
                                await dbHandler.insertIntoTable('c4_azure_storagetype_vmsizes', sizeInsData, async function (error, sizeid) {

                                });
                              }
                              // resolve1('')
                            });
                          } else {
                            // resolve1('');
                          }
                          resolve3("");
                        });

                      });
                    }
                  }
                }
                console.log("request response completed")
                resolve4("request response completed")
              });
          })
          console.log("synced the data")
          resolve1('synced the data');
        })
      })
    }
    callback(null, "Updated Azure syncAzureStorageTypes");
  })
}

/*
  Author: Pradeep
  Descri: sync virtual network list
  Date  : 21-10-2019
*/
let syncVirtualNetwork = (reqObj) => {
  let cts = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var sql = `select s.clientid,s.subscription_id,grp.name as resource_group 
	  from c4_azure_subscriptions as s 
	  inner join c4_azure_subscription_locations as l on s.subscription_id=l.subscription_id 
	  inner join c4_azure_resourcegroups as grp on l.id=grp.location_id 
	  where s.state='Enabled' and s.record_status = 1 and grp.record_status=1 `
  dbHandler.executeQuery(sql, async function (subscriptionList) {
    console.log(subscriptionList);
    let imageIds = [];
    for await (var subscription of subscriptionList) {
      // for(var i=0;i<subscriptionList.length;i++){
      await new Promise(async function (resolve1, reject1) {
        // var subscription=subscriptionList[i]
        var clientid = subscription.clientid;
        var subscriptionId = subscription.subscription_id;
        var resourceGroup = subscription.resource_group;
        await new Promise(function (resolve2, reject2) {
          azure_authtoken(clientid, function (error, result) {
            // if(error){
            //   //return resolve2([])
            // }
            return resolve2(result)
          })
        }).then(function (token) {
          if (!token) {
            resolve1('Continue');
          }
          var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/virtualNetworks?api-version=2020-04-01`
          console.log(url);
          request.get({
            url: url, headers: {
              "Authorization": 'Bearer ' + token.tokendata.access_token
            }
          },
            async function optionalCallback(err, httpResponse, result) {
              if (err) {
                console.log("syncVirtualNetwork ---- ", err);
                resolve1('Continue');
              } else {
                if (typeof result != 'undefined')
                  var body = JSON.parse(result);
                else
                  var body = [];
                //                  console.log("body")
                //                  console.log(body)
                if (body && body.value) {
                  //                    	console.log("body.value")
                  //                    	console.log(body.value)
                  if (body.value.length > 0) {
                    for await (const catalogData of body.value) {
                      let catalogSql = `SELECT id from azure_networks
	                              where clientid=${clientid} and  subscriptionId = '${subscriptionId}' and name = '${catalogData.name}'
	                              and resource_group = '${resourceGroup}' and location = '${catalogData.location}' `;
                      await new Promise(async function (innerResolve, innerReject) {
                        await dbHandler.executeQuery(catalogSql, async function (catalogInfo) {
                          if (catalogInfo.length > 0) {
                            let updateData = {
                              clientid: clientid,
                              subscriptionId: subscriptionId,
                              location: catalogData.location,
                              resource_group: resourceGroup,
                              name: catalogData.name,
                              idurl: catalogData.id,
                              status: 1,
                              response_obj: JSON.stringify(catalogData),
                              updated_date: cts
                            };
                            //	                                      console.log('updateData')
                            //	                                      console.log(updateData)
                            imageIds.push(catalogInfo[0].id);
                            await dbHandler.updateTableData('azure_networks', { 'id': catalogInfo[0].id }, updateData, function (err, result) {
                              //catalogResolve("updated the azure_networks");
                              innerResolve('')
                            });
                          } else {
                            let insData = {
                              clientid: clientid,
                              subscriptionId: subscriptionId,
                              location: catalogData.location,
                              resource_group: resourceGroup,
                              name: catalogData.name,
                              idurl: catalogData.id,
                              response_obj: JSON.stringify(catalogData),
                              updated_date: cts
                            };
                            //	                                      console.log('insData')
                            //	                                      console.log(insData)
                            await dbHandler.insertIntoTable('azure_networks', insData, async function (error, vmdid) {
                              imageIds.push(vmdid);
                              //catalogResolve("inserted the azure_networks");
                              innerResolve('')
                            });
                          }
                        });
                      });
                    }
                    resolve1('')
                  } else {
                    resolve1('Continue');
                  }
                } else {
                  resolve1('Continue');
                }
              }
            });
        })
      })
    }

    //Update the not listed images record_status to 0
    /*if(imageIds.length > 0){
      let updateSql = "update azure_networks set status='0' WHERE id not in ("+imageIds.join()+")";
      console.log("imageIds --- ", imageIds);
      console.log("updateSql --- ", updateSql);
      db.query(updateSql, (error,rows,fields)=>{
        dbFunc.connectionRelease;
            if(!!error) {
              console.log(error);
            } else {
                console.log(`Updated Record status to 0'`);
                console.log(rows);
            }
       });
    }*/
  })
}

let syncVmBackupVaultNames = (reqObj) => {
  let cts = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var sql = `select s.clientid,s.subscription_id,grp.name as resource_group 
	  from c4_azure_subscriptions as s 
	  inner join c4_azure_subscription_locations as l on s.subscription_id=l.subscription_id 
	  inner join c4_azure_resourcegroups as grp on l.id=grp.location_id 
	  where s.state='Enabled' and s.record_status = 1 and grp.record_status=1 `
  dbHandler.executeQuery(sql, async function (subscriptionList) {
    //    console.log(subscriptionList)
    let imageIds = [];
    for await (var subscription of subscriptionList) {
      // for(var i=0;i<subscriptionList.length;i++){
      await new Promise(async function (resolve1, reject1) {
        // var subscription=subscriptionList[i]
        var clientid = subscription.clientid;
        var subscriptionId = subscription.subscription_id;
        var resourceGroup = subscription.resource_group;
        await new Promise(function (resolve2, reject2) {
          azure_authtoken(clientid, function (error, result) {
            // if(error){
            //   //return resolve2([])
            // }
            return resolve2(result)
          })
        }).then(function (token) {
          if (!token) {
            resolve1('Continue');
          }
          var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.RecoveryServices/vaults?api-version=2016-06-01`;
          console.log(url);
          request.get({
            url: url, headers: {
              "Authorization": 'Bearer ' + token.tokendata.access_token
            }
          },
            async function optionalCallback(err, httpResponse, result) {
              if (err) {
                console.log("syncVmBackupVaultNames ---- ", err);
                resolve1('Continue');
              } else {
                if (typeof result != 'undefined')
                  var body = JSON.parse(result);
                else
                  var body = [];
                //                  console.log("body")
                //                  console.log(body)
                if (body && body.value) {
                  //                    	console.log("body.value")
                  //                    	console.log(body.value)
                  if (body.value.length > 0) {
                    for await (const catalogData of body.value) {
                      let catalogSql = `SELECT id from azure_backup_vault_names
	                              where clientid=${clientid} and  subscriptionId = '${subscriptionId}' and name = '${catalogData.name}'
	                              and resource_group = '${resourceGroup}' and location = '${catalogData.location}' `;
                      await dbHandler.executeQuery(catalogSql, async function (catalogInfo) {
                        if (catalogInfo.length > 0) {
                          let updateData = {
                            clientid: clientid,
                            subscriptionId: subscriptionId,
                            location: catalogData.location,
                            resource_group: resourceGroup,
                            name: catalogData.name,
                            record_status: 1,
                            response_obj: JSON.stringify(catalogData),
                            updated_date: cts
                          };
                          //	                                      console.log('updateData')
                          //	                                      console.log(updateData)
                          imageIds.push(catalogInfo[0].id);
                          await dbHandler.updateTableData('azure_backup_vault_names', { 'id': catalogInfo[0].id }, updateData, function (err, result) {
                            //catalogResolve("updated the azure_networks");
                            resolve1('')
                          });
                        } else {
                          let insData = {
                            clientid: clientid,
                            subscriptionId: subscriptionId,
                            location: catalogData.location,
                            resource_group: resourceGroup,
                            name: catalogData.name,
                            response_obj: JSON.stringify(catalogData),
                            updated_date: cts
                          };
                          //	                                      console.log('insData')
                          //	                                      console.log(insData)
                          await dbHandler.insertIntoTable('azure_backup_vault_names', insData, async function (error, vmdid) {
                            imageIds.push(vmdid);
                            //catalogResolve("inserted the azure_networks");
                            resolve1('')
                          });
                        }
                      });

                    }
                  } else {
                    resolve1('Continue');
                  }
                } else {
                  resolve1('Continue');
                }
              }
            });
        })
      })
    }
    //Update the not listed images record_status to 0
    /*if(imageIds.length > 0){
      let updateSql = "update azure_backup_vault_names set record_status='0' WHERE id not in ("+imageIds.join()+")";
      console.log("imageIds --- ", imageIds);
      console.log("updateSql --- ", updateSql);
      db.query(updateSql, (error,rows,fields)=>{
        dbFunc.connectionRelease;
            if(!!error) {
              console.log(error);
            } else {
                console.log(`Updated Record status to 0'`);
                console.log(rows);
            }
       });
    }*/
    syncVmBackupVaultPolicies([]);
  })
}

let syncVmBackupVaultPolicies = (reqObj) => {
  let cts = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var sql = `select bvn.name as recovery_vault_name, s.clientid,s.subscription_id,grp.name as resource_group 
	  from azure_backup_vault_names as bvn
	  inner join c4_azure_subscriptions as s on s.subscription_id = bvn.subscriptionId
	  inner join c4_azure_resourcegroups as grp on bvn.resource_group=grp.name 
	  where s.state='Enabled' and s.record_status = 1 and grp.record_status=1 `
  dbHandler.executeQuery(sql, async function (subscriptionList) {
    //    console.log(subscriptionList)

    let imageIds = [];
    for await (var subscription of subscriptionList) {
      // for(var i=0;i<subscriptionList.length;i++){
      await new Promise(async function (resolve1, reject1) {
        // var subscription=subscriptionList[i]
        var clientid = subscription.clientid;
        var subscriptionId = subscription.subscription_id;
        var resourceGroup = subscription.resource_group;
        var recovery_vault_name = subscription.recovery_vault_name;
        await new Promise(function (resolve2, reject2) {
          azure_authtoken(clientid, function (error, result) {
            // if(error){
            //   //return resolve2([])
            // }
            return resolve2(result)
          })
        }).then(function (token) {
          if (!token) {
            resolve1('Continue');
          }
          var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.RecoveryServices/vaults/${recovery_vault_name}/backupPolicies?api-version=2021-02-10`;
          console.log(url);
          request.get({
            url: url, headers: {
              "Authorization": 'Bearer ' + token.tokendata.access_token
            }
          },
            async function optionalCallback(err, httpResponse, result) {
              if (err) {
                console.log("syncVmBackupVaultPolicies ---- ", err);
                resolve1('Continue');
              } else {
                if (typeof result != 'undefined')
                  var body = JSON.parse(result);
                else
                  var body = [];
                //                  console.log("body")
                //                  console.log(body)
                if (body && body.value) {
                  //                    	console.log("body.value")
                  //                    	console.log(body.value)
                  if (body.value.length > 0) {
                    for await (const catalogData of body.value) {
                      let catalogSql = `SELECT id from azure_backup_vault_policies
	                              where clientid=${clientid} and  subscriptionId = '${subscriptionId}' and name = '${catalogData.name}'
	                              and resource_group = '${resourceGroup}' and recovery_vault_name = '${recovery_vault_name}'`;
                      await dbHandler.executeQuery(catalogSql, async function (catalogInfo) {
                        if (catalogInfo.length > 0) {
                          let updateData = {
                            clientid: clientid,
                            subscriptionId: subscriptionId,
                            resource_group: resourceGroup,
                            recovery_vault_name: recovery_vault_name,
                            name: catalogData.name,
                            response_obj: JSON.stringify(catalogData),
                            record_status: 1,
                            updated_date: cts
                          };
                          //	                                      console.log('updateData')
                          //	                                      console.log(updateData)
                          imageIds.push(catalogInfo[0].id);
                          await dbHandler.updateTableData('azure_backup_vault_policies', { 'id': catalogInfo[0].id }, updateData, function (err, result) {
                            //catalogResolve("updated the azure_networks");
                            resolve1('')
                          });
                        } else {
                          let insData = {
                            clientid: clientid,
                            subscriptionId: subscriptionId,
                            resource_group: resourceGroup,
                            recovery_vault_name: recovery_vault_name,
                            name: catalogData.name,
                            response_obj: JSON.stringify(catalogData),
                            updated_date: cts
                          };
                          //	                                      console.log('insData')
                          //	                                      console.log(insData)
                          await dbHandler.insertIntoTable('azure_backup_vault_policies', insData, async function (error, vmdid) {
                            imageIds.push(vmdid);
                            //catalogResolve("inserted the azure_networks");
                            resolve1('')
                          });
                        }
                      });

                    }
                  } else {
                    resolve1('Continue');
                  }
                } else {
                  resolve1('Continue');
                }
              }
            });
        })
      })
    }

    //Update the not listed images record_status to 0
    if (imageIds.length > 0) {
      let updateSql = "update azure_backup_vault_policies set record_status='0' WHERE id not in (" + imageIds.join() + ")";
      console.log("imageIds --- ", imageIds);
      console.log("updateSql --- ", updateSql);
      db.query(updateSql, (error, rows, fields) => {
        dbFunc.connectionRelease;
        if (!!error) {
          console.log(error);
        } else {
          console.log(`Updated Record status to 0'`);
          console.log(rows);
        }
      });
    }
  })
}

let syncStorageAccountNames = (reqObj) => {
  let cts = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var sql = `select s.clientid,s.subscription_id,grp.name as resource_group 
	  from c4_azure_subscriptions as s 
	  inner join c4_azure_subscription_locations as l on s.subscription_id=l.subscription_id 
	  inner join c4_azure_resourcegroups as grp on l.id=grp.location_id 
	  where s.state='Enabled' and s.record_status = 1 and grp.record_status=1 `
  dbHandler.executeQuery(sql, async function (subscriptionList) {
    //    console.log(subscriptionList)
    let imageIds = [];
    for await (var subscription of subscriptionList) {
      // for(var i=0;i<subscriptionList.length;i++){
      await new Promise(async function (resolve1, reject1) {
        // var subscription=subscriptionList[i]
        var clientid = subscription.clientid;
        var subscriptionId = subscription.subscription_id;
        var resourceGroup = subscription.resource_group;
        await new Promise(function (resolve2, reject2) {
          azure_authtoken(clientid, function (error, result) {
            // if(error){
            //   //return resolve2([])
            // }
            return resolve2(result)
          })
        }).then(function (token) {
          if (!token) {
            resolve1('Continue');
          }
          var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Storage/storageAccounts?api-version=2021-04-01`;
          console.log(url);
          request.get({
            url: url, headers: {
              "Authorization": 'Bearer ' + token.tokendata.access_token
            }
          },
            async function optionalCallback(err, httpResponse, result) {
              if (err) {
                console.log("syncStorageAccountNames ---- ", err);
                resolve1('Continue');
              } else {
                if (typeof result != 'undefined')
                  var body = JSON.parse(result);
                else
                  var body = [];
                //                  console.log("body")
                //                  console.log(body)
                if (body && body.value) {
                  //                    	console.log("body.value")
                  //                    	console.log(body.value)
                  if (body.value.length > 0) {
                    for await (const catalogData of body.value) {
                      await new Promise(async function (innerResolve, innerReject) {
                        let catalogSql = `SELECT id from azure_storage_account_names
	                              where clientid=${clientid} and  subscriptionId = '${subscriptionId}' and name = '${catalogData.name}'
	                              and resource_group = '${resourceGroup}' and location = '${catalogData.location}' `;
                        await dbHandler.executeQuery(catalogSql, async function (catalogInfo) {
                          if (catalogInfo.length > 0) {
                            let updateData = {
                              clientid: clientid,
                              subscriptionId: subscriptionId,
                              location: catalogData.location,
                              resource_group: resourceGroup,
                              name: catalogData.name,
                              record_status: 1,
                              response_obj: JSON.stringify(catalogData),
                              updated_date: cts
                            };
                            //	                                      console.log('updateData')
                            //	                                      console.log(updateData)
                            imageIds.push(catalogInfo[0].id);
                            await dbHandler.updateTableData('azure_storage_account_names', { 'id': catalogInfo[0].id }, updateData, function (err, result) {
                              //catalogResolve("updated the azure_networks");
                              innerResolve('')
                            });
                          } else {
                            let insData = {
                              clientid: clientid,
                              subscriptionId: subscriptionId,
                              location: catalogData.location,
                              resource_group: resourceGroup,
                              name: catalogData.name,
                              response_obj: JSON.stringify(catalogData),
                              updated_date: cts
                            };
                            //	                                      console.log('insData')
                            //	                                      console.log(insData)
                            await dbHandler.insertIntoTable('azure_storage_account_names', insData, async function (error, vmdid) {
                              imageIds.push(vmdid);
                              //catalogResolve("inserted the azure_networks");
                              innerResolve('')
                            });
                          }
                        });
                      });

                    }
                    resolve1('')
                  } else {
                    resolve1('Continue');
                  }
                } else {
                  resolve1('Continue');
                }
              }
            });
        })
      })
    }
    //Update the not listed images record_status to 0
    /*if(imageIds.length > 0){
      let updateSql = "update azure_storage_account_names set record_status='0' WHERE id not in ("+imageIds.join()+")";
      console.log("imageIds --- ", imageIds);
      console.log("updateSql --- ", updateSql);
      db.query(updateSql, (error,rows,fields)=>{
        dbFunc.connectionRelease;
            if(!!error) {
              console.log(error);
            } else {
                console.log(`Updated Record status to 0'`);
                console.log(rows);
            }
       });
    }*/
  })
}

let syncAvailabilitySets = (reqObj) => {
  let cts = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var sql = `select s.clientid,s.subscription_id,grp.name as resource_group 
	  from c4_azure_subscriptions as s 
	  inner join c4_azure_subscription_locations as l on s.subscription_id=l.subscription_id 
	  inner join c4_azure_resourcegroups as grp on l.id=grp.location_id 
	  where s.state='Enabled' and s.record_status = 1 and grp.record_status=1 `;
  //subscription_id,resource_group
  if (typeof reqObj.subscription_id != 'undefined' && reqObj.subscription_id != '') {
    sql += ` and s.subscription_id = '${reqObj.subscription_id}' `;
  }
  if (typeof reqObj.resource_group != 'undefined' && reqObj.resource_group != '') {
    sql += ` and grp.name = '${reqObj.resource_group}' `;
  }
  dbHandler.executeQuery(sql, async function (subscriptionList) {
    //    console.log(subscriptionList)
    let imageIds = [];
    for await (var subscription of subscriptionList) {
      // for(var i=0;i<subscriptionList.length;i++){
      await new Promise(async function (resolve1, reject1) {
        // var subscription=subscriptionList[i]
        var clientid = subscription.clientid;
        var subscriptionId = subscription.subscription_id;
        var resourceGroup = subscription.resource_group;
        await new Promise(function (resolve2, reject2) {
          azure_authtoken(clientid, function (error, result) {
            // if(error){
            //   //return resolve2([])
            // }
            return resolve2(result)
          })
        }).then(function (token) {
          if (!token) {
            resolve1('Continue');
          }
          var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/availabilitySets?api-version=2021-11-01`;
          console.log(url);
          request.get({
            url: url, headers: {
              "Authorization": 'Bearer ' + token.tokendata.access_token
            }
          },
            async function optionalCallback(err, httpResponse, result) {
              if (err) {
                resolve1('Continue');
              } else {
                if (typeof result != 'undefined')
                  var body = JSON.parse(result);
                else
                  var body = [];
                //                  console.log("body")
                //                  console.log(body)
                if (body && body.value) {
                  console.log("body.value")
                  console.log(body.value)
                  if (body.value.length > 0) {
                    for await (const catalogData of body.value) {
                      await new Promise(async function (innerResolve, innerReject) {
                        let catalogSql = `SELECT id from azure_availability_sets
	                              where clientid=${clientid} and  subscriptionId = '${subscriptionId}' and name = '${catalogData.name}'
	                              and resource_group = '${resourceGroup}' and location = '${catalogData.location}' `;
                        await dbHandler.executeQuery(catalogSql, async function (catalogInfo) {
                          if (catalogInfo.length > 0) {
                            let updateData = {
                              clientid: clientid,
                              subscriptionId: subscriptionId,
                              location: catalogData.location,
                              resource_group: resourceGroup,
                              name: catalogData.name,
                              record_status: 1,
                              response_obj: JSON.stringify(catalogData),
                              updated_date: cts
                            };
                            //	                                      console.log('updateData')
                            //	                                      console.log(updateData)
                            imageIds.push(catalogInfo[0].id);
                            await dbHandler.updateTableData('azure_availability_sets', { 'id': catalogInfo[0].id }, updateData, function (err, result) {
                              //catalogResolve("updated the azure_networks");
                              innerResolve('')
                            });
                          } else {
                            let insData = {
                              clientid: clientid,
                              subscriptionId: subscriptionId,
                              location: catalogData.location,
                              resource_group: resourceGroup,
                              name: catalogData.name,
                              response_obj: JSON.stringify(catalogData),
                              updated_date: cts
                            };
                            //	                                      console.log('insData')
                            //	                                      console.log(insData)
                            await dbHandler.insertIntoTable('azure_availability_sets', insData, async function (error, vmdid) {
                              imageIds.push(vmdid);
                              //catalogResolve("inserted the azure_networks");
                              innerResolve('')
                            });
                          }
                        });
                      });

                    }
                    resolve1('')
                  } else {
                    resolve1('Continue');
                  }
                } else {
                  resolve1('Continue');
                }
              }
            });
        })
      })
    }
    //Update the not listed images record_status to 0
    /*if(imageIds.length > 0){
      let updateSql = "update azure_availability_sets set record_status='0' WHERE id not in ("+imageIds.join()+")";
      console.log("imageIds --- ", imageIds);
      console.log("updateSql --- ", updateSql);
      db.query(updateSql, (error,rows,fields)=>{
        dbFunc.connectionRelease;
            if(!!error) {
              console.log(error);
            } else {
                console.log(`Updated Record status to 0'`);
                console.log(rows);
            }
       });
    }*/
  })
}
/*
  Author : Rajesh
  Description : get and update Azure Subscription wise Resource Groups list
  Date  : 13-05-2020
*/
let getAzureResourceGroups = async (reqObj) => {
  console.log(reqObj);
  let sql = `Select s.subscription_id, s.clientid, c.azure_tenantid, 
    c.azure_clientid, c.azure_clientsecretkey, 
    c.azure_resource, c.azure_granttype 
    from c4_azure_subscriptions as s
    inner join c4_clients as c on c.id = s.clientid
    where c.status = 1 and c.azure_linked = 1 and s.state='Enabled' and s.record_status = 1 `;
  if (typeof reqObj.subscription_id != 'undefined') {
    sql += ` and s.subscription_id = '${reqObj.subscription_id}' `;
  }
  if (typeof reqObj.id != 'undefined') {
    sql += ` and c.id = ${reqObj.id} order by c.id desc `;
  } else {
    sql += ` order by c.id asc `;
  }
  console.log(sql);
  await new Promise(function (resolve, reject) {
    dbHandler.executeQuery(sql, async function (SubscriptionData) {
      console.log("SubscriptionData");
      console.log(SubscriptionData);
      try {
        if (SubscriptionData.length > 0) {
          let rgIds = [];
          for await (const item of SubscriptionData) {
            await new Promise(async function (itemResolve, itemReject) {
              // tokenData = {
              //     grant_type:item.azure_granttype,
              //     client_id:item.azure_clientid,
              //     client_secret:item.azure_clientsecretkey,
              //     resource:item.azure_resource
              // };
              // console.log("tokenData");
              // console.log(tokenData);
              // let urlpath = 'https://login.microsoftonline.com/'+item.azure_tenantid+'/oauth2/token';
              // console.log(urlpath);

              await new Promise(function (resolve, reject) {
                azure_authtoken(item.clientid, function (error, result) {
                  // console.log("result");
                  // console.log(result);
                  // if(error){
                  //     resolve([])
                  // }else{
                  resolve(result)
                  // }
                })
              }).then(async function (token) {
                // console.log("token");
                // console.log(token);
                if (token.tokendata.length == 0) {
                  var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
                  itemResolve(response);
                } else {
                  updateNetworkInterfaces({ access_token: token.tokendata.access_token, clientid: item.clientid }, item.subscription_id);
                  //                                updateResourceList({access_token:token.tokendata.access_token,clientid:item.clientid},item.subscription_id);

                  //token.tokendata.access_token

                  // axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
                  // await axios
                  // .post(urlpath, querystring.stringify(tokenData))
                  // .then(async tokenResponse => {
                  //     console.log(tokenResponse.data);
                  // if(tokenResponse.data.access_token){
                  urlpath = 'https://management.azure.com/subscriptions/' + item.subscription_id + '/resourcegroups?api-version=2018-05-01';

                  // axios.defaults.headers.get['authorization'] = tokenResponse.data.token_type+' '+tokenResponse.data.access_token;
                  axios.defaults.headers.get['authorization'] = token.tokendata.token_type + ' ' + token.tokendata.access_token;
                  await axios
                    .get(urlpath)
                    .then(async resourcegroupsResponse => {
                      // console.log(resourcegroupsResponse.data);
                      if (resourcegroupsResponse.data.value.length > 0) {
                        for await (const resourcegroupsData of resourcegroupsResponse.data.value) {
                          await new Promise(async function (resourcegroupsResolve, resourcegroupsReject) {
                            let resourcegroupsSql = `SELECT rg.id, l.id as location_id from c4_azure_resourcegroups as rg
                                                    inner join c4_azure_subscription_locations as l on l.id = rg.location_id
                                                    where l.clientid = '${item.clientid}' and l.subscription_id = '${item.subscription_id}' and l.name = '${resourcegroupsData.location}' and rg.name = '${resourcegroupsData.name}'`;
                            // console.log("resourcegroupsSql");
                            // console.log(resourcegroupsSql);

                            await dbHandler.executeQuery(resourcegroupsSql, async function (resourcegroupsInfo) {
                              // console.log("resourcegroupsInfo");
                              // console.log(resourcegroupsInfo);
                              if (resourcegroupsInfo.length > 0) {
                                let updateData = {
                                  record_status: 1,
                                  response_obj: JSON.stringify(resourcegroupsData),
                                  updated_date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
                                };
                                // console.log("updateData");
                                // console.log(updateData);
                                rgIds.push(resourcegroupsInfo[0].id);
                                await dbHandler.updateTableData('c4_azure_resourcegroups', { 'id': resourcegroupsInfo[0].id }, updateData, function (err, result) {
                                  console.log("updated the subscriptionInfo with client id " + item.clientid + ", subscription id " + item.subscription_id + ", name " + resourcegroupsData.name);
                                  resourcegroupsResolve("updated the subscriptionInfo with client id " + item.clientid + ", subscription id " + item.subscription_id + ", name " + resourcegroupsData.name);
                                });
                              } else {
                                await new Promise(async function (locationResolve, locationReject) {
                                  let locationSql = `SELECT id from c4_azure_subscription_locations as l
                                                            where l.clientid = '${item.clientid}' and l.subscription_id = '${item.subscription_id}' and l.name = '${resourcegroupsData.location}'`;
                                  // console.log("locationSql");
                                  // console.log(locationSql);
                                  await dbHandler.executeQuery(locationSql, async function (locationInfo) {
                                    // console.log("locationInfo");
                                    // console.log(locationInfo);
                                    if (locationInfo.length > 0) {
                                      let insData = {
                                        location_id: locationInfo[0].id,
                                        name: resourcegroupsData.name,
                                        response_obj: JSON.stringify(resourcegroupsData),
                                        created_date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
                                      };
                                      // console.log("insData");
                                      // console.log(insData);
                                      await dbHandler.insertIntoTable('c4_azure_resourcegroups', insData, async function (error, rgId) {
                                        rgIds.push(rgId);
                                        let text = "inserted the resourcegroupsInfo with client id " + item.clientid + ", subscription id " + item.subscription_id + ", location name " + resourcegroupsData.location + ", resourcegroup name " + resourcegroupsData.name + ", rgId " + rgId;
                                        console.log(text);
                                        locationResolve(text);
                                        resourcegroupsResolve(text);
                                      });
                                    } else {
                                      let text = `data not found in c4_azure_subscription_locations with clientid = '${item.clientid}' and subscription_id = '${item.subscription_id}' and name = '${resourcegroupsData.location}'`
                                      console.log(text);
                                      locationResolve(text);
                                      resourcegroupsResolve(text);
                                    }
                                  });
                                });
                              }
                            });
                          });
                        }
                      }
                    })
                    .catch(error => {
                      console.log(error);
                      itemResolve({ "message": error });
                    });
                  // }
                }
              })
                .catch(error => {
                  console.log(error);
                  itemResolve({ "message": error });
                });
              console.log("updated for client id " + item.clientid + ", subscription id " + item.subscription_id);
              itemResolve("updated for client id " + item.clientid + ", subscription id " + item.subscription_id);
            });
          };

          //Update the not listed resourceGroups record_status to 0
          if (rgIds.length > 0) {
            let updateSql = "";
            if (typeof reqObj.subscription_id != 'undefined') {
              updateSql += ` and subscription_id = '${reqObj.subscription_id}' `;
              updateSql = `UPDATE c4_azure_resourcegroups as rg
        		    		inner join c4_azure_subscription_locations as l on l.id = rg.location_id
        		    		SET rg.record_status='0'
        		    		where rg.id not in (${rgIds.join()}) and l.subscription_id = '${reqObj.subscription_id}'`;
            } else {
              let updateSql = "update c4_azure_resourcegroups set record_status='0' WHERE id not in (" + rgIds.join() + ")";
            }
            console.log("rgIds --- ", rgIds);
            console.log("updateSql --- ", updateSql);
            db.query(updateSql, (error, rows, fields) => {
              dbFunc.connectionRelease;
              if (!!error) {
                console.log(error);
              } else {
                console.log(`Updated Record status to 0'`);
                console.log(rows);
              }
            });
          }
          console.log("Updated Azure Subscription resourcegroups List");
          //                    callback(null,"Updated Azure Subscription resourcegroups List");
          resolve("Updated Azure Subscription resourcegroups List");
        } else {
          console.log("No clients available to update the Azure Subscription resourcegroups List");
          //                    callback(1,"No clients available to update the Azure Subscription resourcegroups List");
          resolve("No clients available to update the Azure Subscription resourcegroups List");
        }
      }
      catch {
        resolve(0);
      }
    });
  });
}

/*
  Author : Rajesh
  Description : get and update Azure Catalog list
  Date  : 08-05-2020
*/
let getAzureCatalog = async (reqObj) => {
  console.log(reqObj);
  let sql = `Select l.subscription_id, l.clientid, l.name as location, l.id as location_id, c.azure_tenantid, 
    c.azure_clientid, c.azure_clientsecretkey, 
    c.azure_resource, c.azure_granttype, c.currency_id 
    from c4_azure_subscription_locations as l
    inner join c4_clients as c on c.id = l.clientid
    inner join c4_azure_subscriptions as s on s.subscription_id = l.subscription_id and c.id = s.clientid
    where c.status = 1 and c.azure_linked = 1 and s.state='Enabled' and s.record_status = 1 `;
  if (typeof reqObj.subscription_id != 'undefined') {
    sql += ` and s.subscription_id = '${reqObj.subscription_id}' `;
  }
  if (typeof reqObj.location != 'undefined') {
    sql += ` and l.name = '${reqObj.location}' `;
  }
  if (typeof reqObj.id != 'undefined') {
    sql += ` and c.id = '${reqObj.id}' order by c.id desc`;
  } else {
    sql += ` order by c.id asc`;
  }
  //TODO Comment below line in produciton 
  //    sql += ` limit 1 `;
  console.log(sql);
  await new Promise(function (resolve, reject) {
    dbHandler.executeQuery(sql, async function (LocationData) {
      // console.log("LocationData");
      // console.log(LocationData);
      try {
        if (LocationData.length > 0) {
          for await (const item of LocationData) {
            // console.log("item");
            // console.log(item);
            await new Promise(async function (itemResolve, itemReject) {
              tokenData = {
                grant_type: item.azure_granttype,
                client_id: item.azure_clientid,
                client_secret: item.azure_clientsecretkey,
                resource: item.azure_resource
              };
              // console.log("tokenData");
              // console.log(tokenData);
              let urlpath = 'https://login.microsoftonline.com/' + item.azure_tenantid + '/oauth2/token';
              console.log(urlpath);

              axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
              await axios
                .post(urlpath, querystring.stringify(tokenData))
                .then(async tokenResponse => {
                  // console.log(tokenResponse.data);
                  if (tokenResponse.data.access_token) {
                    urlpath = 'https://management.azure.com/subscriptions/' + item.subscription_id + '/providers/Microsoft.Compute/locations/' + item.location + '/vmSizes?api-version=2022-03-01';

                    axios.defaults.headers.get['authorization'] = tokenResponse.data.token_type + ' ' + tokenResponse.data.access_token;
                    await axios
                      .get(urlpath)
                      .then(async catalogResponse => {
                        console.log("catalogResponse.data");
                        console.log(catalogResponse.data);
                        if (catalogResponse.data.value.length > 0) {
                          for await (const catalogData of catalogResponse.data.value) {
                            await new Promise(async function (catalogResolve, catalogReject) {
                              let catalogSql = `SELECT id from c4_azure_catalog
                                                    where location_id = '${item.location_id}' and name = '${catalogData.name}'`;
                              // console.log("catalogSql");
                              // console.log(catalogSql);
                              await dbHandler.executeQuery(catalogSql, async function (catalogInfo) {
                                // console.log("catalogInfo");
                                // console.log(catalogInfo);
                                if (catalogInfo.length > 0) {
                                  let updateData = {
                                    number_of_cores: catalogData.numberOfCores,
                                    os_disk_size_in_mb: catalogData.osDiskSizeInMB,
                                    resource_disk_size_in_mb: catalogData.resourceDiskSizeInMB,
                                    memory_in_mb: catalogData.memoryInMB,
                                    max_data_disk_count: catalogData.maxDataDiskCount,
                                    //                                                                record_status : 0,
                                    response_obj: JSON.stringify(catalogData),
                                    updated_date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
                                  };
                                  //                                                            if(config.allowedVmSizes.indexOf(catalogData.name) >= 0){
                                  //                                                            	updateData.record_status = 1;
                                  //                                                            }
                                  console.log("updateData");
                                  console.log(updateData);
                                  await dbHandler.updateTableData('c4_azure_catalog', { 'id': catalogInfo[0].id }, updateData, function (err, result) {
                                    // console.log("updated the subscriptionInfo with client id "+item.clientid+", subscription id "+item.subscription_id+", location name "+item.location+", catalog name "+catalogData.name);
                                    catalogResolve("updated the subscriptionInfo with client id " + item.clientid + ", subscription id " + item.subscription_id + ", location name " + item.location + ", catalog name " + catalogData.name);
                                  });
                                } else {
                                  let insData = {
                                    location_id: item.location_id,
                                    //                                                                currency_id : item.currency_id,
                                    name: catalogData.name,
                                    number_of_cores: catalogData.numberOfCores,
                                    os_disk_size_in_mb: catalogData.osDiskSizeInMB,
                                    resource_disk_size_in_mb: catalogData.resourceDiskSizeInMB,
                                    memory_in_mb: catalogData.memoryInMB,
                                    max_data_disk_count: catalogData.maxDataDiskCount,
                                    record_status: 0,
                                    response_obj: JSON.stringify(catalogData),
                                    created_date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
                                  };
                                  //                                                            if(config.allowedVmSizes.indexOf(catalogData.name) >= 0){
                                  //                                                            	insData.record_status = 1;
                                  //                                                            }
                                  console.log("insData");
                                  console.log(insData);
                                  await dbHandler.insertIntoTable('c4_azure_catalog', insData, async function (error, vmdid) {
                                    // console.log("inserted the subscriptionInfo with client id "+item.clientid+", subscription id "+item.subscription_id+", location name "+item.location+", catalog name "+catalogData.name);
                                    catalogResolve("inserted the subscriptionInfo with client id " + item.clientid + ", subscription id " + item.subscription_id + ", location name " + item.location + ", catalog name " + catalogData.name);
                                  });
                                }
                              });
                            });
                          }
                        } else {
                          console.log("else catalog catalogResponse.data");
                          console.log(catalogResponse.data);
                          itemResolve({ "message": catalogResponse.data });
                        }
                      })
                      .catch(error => {
                        console.log("catch catalog error.response");
                        console.log(error.response);
                        itemResolve({ "message": error.response.data.error.message });
                      });
                  } else {
                    console.log(tokenResponse.data);
                    itemResolve({ "message": tokenResponse.data });
                  }
                })
                .catch(error => {
                  console.log(error.response);
                  itemResolve({ "message": error.response });
                });
              console.log("updated for client id " + item.clientid + ", subscription id " + item.subscription_id + ", location " + item.location);
              itemResolve("updated for client id " + item.clientid + ", subscription id " + item.subscription_id + ", location " + item.location);
            });
          };
          console.log("Updated Azure Catalog List");
          //                    callback(null,"Updated Azure Catalog List");
          resolve("Updated Azure Catalog List");
        } else {
          console.log("No clients available to update the Azure Catalog List");
          //                    callback(1,"No clients available to update the Azure Catalog List");
          resolve("No clients available to update the Azure Catalog List");
        }
      }
      catch {
        resolve(0);
      }
    });
  });
}

/*
  Author : Rajesh
  Description : get and update Azure Subscription wise OsTemplates list
  Date  : 12-05-2020
*/
let getAzureSubscriptionWiseOsTemplatesList = async (reqObj, callback) => {
  //console.log(reqObj);
  let sql = `Select s.subscription_id, s.clientid, c.azure_tenantid, 
    c.azure_clientid, c.azure_clientsecretkey, 
    c.azure_resource, c.azure_granttype 
    from c4_azure_subscriptions as s
    inner join c4_clients as c on c.id = s.clientid
    where c.status = 1 and c.azure_linked = 1 and s.state='Enabled' and s.record_status = 1 `;
  if (typeof reqObj.id != 'undefined') {
    sql += ` and c.id = ${reqObj.id} order by c.id desc`;
  } else {
    sql += ` order by c.id asc`;
  }
  //console.log(sql);
  await new Promise(function (resolve, reject) {
    dbHandler.executeQuery(sql, async function (SubscriptionData) {
      console.log("SubscriptionData");
      console.log(SubscriptionData);
      try {
        if (SubscriptionData.length > 0) {
          for await (const item of SubscriptionData) {
            await new Promise(async function (itemResolve, itemReject) {
              tokenData = {
                grant_type: item.azure_granttype,
                client_id: item.azure_clientid,
                client_secret: item.azure_clientsecretkey,
                resource: item.azure_resource
              };
              console.log("tokenData");
              console.log(tokenData);
              let urlpath = 'https://login.microsoftonline.com/' + item.azure_tenantid + '/oauth2/token';
              console.log(urlpath);

              axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
              await axios
                .post(urlpath, querystring.stringify(tokenData))
                .then(async tokenResponse => {
                  console.log(tokenResponse.data);
                  if (tokenResponse.data.access_token) {
                    urlpath = 'https://management.azure.com/subscriptions/' + item.subscription_id + '/providers/Microsoft.Compute/images?api-version=2018-06-01';

                    axios.defaults.headers.get['authorization'] = tokenResponse.data.token_type + ' ' + tokenResponse.data.access_token;
                    await axios
                      .get(urlpath)
                      .then(async osTemplatesResponse => {
                        console.log(osTemplatesResponse.data);
                        if (osTemplatesResponse.data.value.length > 0) {
                          for await (const osTemplatesData of osTemplatesResponse.data.value) {
                            await new Promise(async function (osTemplatesResolve, osTemplatesReject) {
                              let osTemplatesSql = `SELECT os.*, l.id as location_id from other_cloud_os_templates as os
                                                    inner join c4_azure_subscription_locations as l on l.id = os.location_id
                                                    where l.clientid = '${item.clientid}' and l.subscription_id = '${item.subscription_id}' and l.name = '${osTemplatesData.location}' and os.name = '${osTemplatesData.name}'`;
                              //console.log("osTemplatesSql");
                              //console.log(osTemplatesSql);
                              await dbHandler.executeQuery(osTemplatesSql, async function (osTemplatesInfo) {
                                console.log("osTemplatesInfo");
                                console.log(osTemplatesInfo);
                                if (osTemplatesInfo.length > 0) {
                                  let updateData = {
                                    type: osTemplatesData.type,
                                    storageAccountType: osTemplatesData.properties.storageProfile.osDisk.storageAccountType,
                                    osType: osTemplatesData.properties.storageProfile.osDisk.osType,
                                    response_obj: JSON.stringify(osTemplatesData),
                                    updated_date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
                                  };
                                  // console.log("updateData");
                                  // console.log(updateData);
                                  await dbHandler.updateTableData('other_cloud_os_templates', { 'id': osTemplatesInfo[0].id }, updateData, function (err, result) {
                                    let text = "updated the subscriptionInfo with client id " + item.clientid + ", subscription id " + item.subscription_id + ", location name " + osTemplatesData.location + ", osTemplate name " + osTemplatesData.name;
                                    //console.log(text);
                                    osTemplatesResolve(text);
                                  });
                                } else {
                                  await new Promise(async function (locationResolve, locationReject) {
                                    let locationSql = `SELECT id from c4_azure_subscription_locations as l
                                                                where l.clientid = '${item.clientid}' and l.subscription_id = '${item.subscription_id}' and l.name = '${osTemplatesData.location}'`;
                                    console.log("locationSql");
                                    console.log(locationSql);
                                    await dbHandler.executeQuery(locationSql, async function (locationInfo) {
                                      console.log("locationInfo");
                                      console.log(locationInfo);
                                      if (locationInfo.length > 0) {
                                        let insData = {
                                          cloudid: 3,
                                          location_id: locationInfo[0].id,
                                          name: osTemplatesData.name,
                                          type: osTemplatesData.type,
                                          storageAccountType: osTemplatesData.properties.storageProfile.osDisk.storageAccountType,
                                          osType: osTemplatesData.properties.storageProfile.osDisk.osType,
                                          response_obj: JSON.stringify(osTemplatesData),
                                          created_date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
                                        };
                                        // console.log("insData");
                                        // console.log(insData);
                                        await dbHandler.insertIntoTable('other_cloud_os_templates', insData, async function (error, vmdid) {
                                          let text = "inserted the subscriptionInfo with client id " + item.clientid + ", subscription id " + item.subscription_id + ", location name " + osTemplatesData.location + ", osTemplate name " + osTemplatesData.name;
                                          console.log(text);
                                          locationResolve(text);
                                          osTemplatesResolve(text);
                                        });
                                      } else {
                                        let text = `data not found in c4_azure_subscription_locations with clientid = '${item.clientid}' and subscription_id = '${item.subscription_id}' and name = '${osTemplatesData.location}'`
                                        console.log(text);
                                        locationResolve(text);
                                        osTemplatesResolve(text);
                                      }
                                    });
                                  });
                                }
                              });
                            });
                          }
                        }
                      })
                      .catch(error => {
                        console.log(error);
                        itemResolve({ "message": error });
                      });
                  }
                })
                .catch(error => {
                  console.log(error);
                  itemResolve({ "message": error });
                });
              let text = "updated for client id " + item.clientid + ", subscription id " + item.subscription_id;
              console.log(text);
              itemResolve(text);
            });
          };
          console.log("Updated Azure Subscription OsTemplates List");
          callback(null, "Updated Azure Subscription OsTemplates List");
          resolve("Updated Azure Subscription OsTemplates List");
        } else {
          console.log("No clients available to update the Azure Subscription OsTemplates List");
          callback(1, "No clients available to update the Azure Subscription OsTemplates List");
          resolve("No clients available to update the Azure Subscription OsTemplates List");
        }
      }
      catch {
        resolve(0);
      }
    });
  });

}
/*
  Author: Pradeep
  Descri: get zones list
  Date  : 19-05-2020
*/
let getZoneListLocationWise = (reqbody, callback) => {
  if (!reqbody.subscriptionId) return callback(400, { success: 0, message: 'Subscription id is missing' });
  if (!reqbody.clientid) return callback(400, { success: 0, message: 'Client Id is missing' });
  if (!reqbody.location) return callback(400, { success: 0, message: 'Location name Id is missing' });
  var subscription_id = reqbody.subscriptionId;
  var location_name = reqbody.location;
  var clientId = reqbody.clientid;
  new Promise(function (resolve, reject) {
    azure_authtoken(clientId, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support', data: token }
      return callback([], response);
    }
    var url = `https://management.azure.com/subscriptions/${subscription_id}/providers/Microsoft.Compute/skus?api-version=2019-04-01&$filter=location eq '${location_name}'`;
    //console.log(url)
    request.get({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          var body = JSON.parse(result);
          new Promise(async function (resolve, reject) {
            for (var i = 0; i < body.value.length; i++) {
              if (!zones)
                var zones = [];
              var zone = body.value[i];
              if (zone.locationInfo[0].zones.length > 0) {
                var array = zone.locationInfo[0].zones;
                await array.forEach(element => {
                  zones.push(element)
                });
              }
            }
            if (zones)
              zones = await zones.filter((val, id, arr) => arr.indexOf(val) == id);
            await zones.sort();
            //return callback(null,{zone:zones})
            return callback(null, body)
          })
        }
      });

  })
}
/*
  Author: Pradeep
  Descri: get disk list
  Date  : 19-05-2020
*/
let getDiskList = (reqbody, callback) => {
  if (!reqbody.subscriptionId) return callback(400, { success: 0, message: 'Subscription id is missing' });
  if (!reqbody.clientid) return callback(400, { success: 0, message: 'Client Id is missing' });
  var subscription_id = reqbody.subscriptionId;
  var clientId = reqbody.clientid;
  new Promise(function (resolve, reject) {
    azure_authtoken(clientId, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support', data: token }
      return callback([], response);
    }
    var url = `https://management.azure.com/subscriptions/${subscription_id}/providers/Microsoft.Compute/disks?api-version=2018-06-01`;
    //console.log(url)
    request.get({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      async function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          var body = JSON.parse(result);

          let finalBody = {};

          finalBody = await new Promise(async function (resolve1, reject1) {
            let sql = `select rg.name
		            from c4_azure_resourcegroups as rg
		            inner join c4_azure_subscription_locations as l on l.id = rg.location_id
		            inner join c4_azure_subscriptions as s on s.subscription_id = l.subscription_id
		            left join bu_info as bu on bu.id = rg.bu_id
		            where  s.clientid = '${reqbody.clientid}' and s.state='Enabled' and s.record_status = 1 and rg.record_status=1
		            `;
            //left join c4_azure_resourcegroups_users as ru on ru.azure_resourcegroup_id = rg.id
            if (subscription_id) {
              subscription_id = helper.strEscape(subscription_id);
              sql += ` and s.subscription_id = '${subscription_id}' `;
              // sql +=` and av.subscriptionId in (${reqBody.subscriptions})`;
            }
            if (reqbody.resource_groups !== undefined) {
              sql += ` and rg.name IN(${reqbody.resource_groups})`;
            }
            if (reqbody.subscription_id !== undefined) {
              sql += ` and s.subscriptionId IN(${reqbody.subscription_id})`;
            }

            /*if(typeof reqbody.user_id != 'undefined' && reqbody.user_id != ''
             && (typeof reqbody.user_role == 'undefined' || (typeof reqbody.user_role != 'undefined' && reqbody.user_role != config.ADMIN_ROLE_ID))){
                sql += ` and ru.user_id = '${reqbody.user_id}' `;
            }*/
            sql += ` group by rg.id order by rg.id DESC `;
            await db.query(sql, async function (error, rgs, fields) {
              dbFunc.connectionRelease;
              if (!!error) {
                callback(1, { message: "The operation did not execute as expected. Please raise a ticket to support" });
                resolve1(error);
              } else {
                let rg_list = [];
                for await (var rg of rgs) {
                  rg_list.push(rg.name.toLowerCase());
                }
                //		            	console.log("rg_list --- ", rg_list);

                let loopBody = { value: [] };
                for await (var disk of body.value) {
                  //		            		console.log("disk.id.split('/')[4] --- ",disk.id.split('/')[4]);
                  if (rg_list.indexOf(disk.id.split('/')[4].toLowerCase()) >= 0) {
                    loopBody.value.push(disk);
                    //		            			console.log("------------------------------------------------------------------------------------");
                    //		            			console.log("loopBody --- ", loopBody);
                  }
                }
                resolve1(loopBody);
              }
            })
          });

          //        console.log("finalBody --- ", finalBody);
          return callback(null, finalBody)
        }
      });

  })
}
/*
  Author: Pradeep
  Descri: get disk list
  Date  : 19-05-2020
*/
let getImageList = (reqbody, callback) => {
  if (!reqbody.subscriptionId) return callback(400, { success: 0, message: 'Subscription id is missing' });
  if (!reqbody.clientid) return callback(400, { success: 0, message: 'Client Id is missing' });
  var subscription_id = reqbody.subscriptionId;
  var clientId = reqbody.clientid;
  new Promise(function (resolve, reject) {
    azure_authtoken(clientId, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support', data: token }
      return callback([], response);
    }
    var url = `https://management.azure.com/subscriptions/${subscription_id}/providers/Microsoft.Compute/images?api-version=2018-06-01`;
    //console.log(url)
    request.get({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          var body = JSON.parse(result);
          return callback(null, body)
        }
      });

  })
}

/*
  Author: Pradeep
  Descri: get availability sets
  Date  : 19-05-2020
*/
let getAvailabilitySets = (reqbody, callback) => {
  if (!reqbody.subscriptionId) return callback(400, { success: 0, message: 'Subscription id is missing' });
  if (!reqbody.resourceGroup) return callback(400, { success: 0, message: 'Resource Group is missing' });
  if (!reqbody.clientid) return callback(400, { success: 0, message: 'Client Id is missing' });
  if (!reqbody.location) return callback(400, { success: 0, message: 'location is missing' });
  var subscription_id = reqbody.subscriptionId;
  var resource_group = reqbody.resourceGroup;
  var clientId = reqbody.clientid;
  var location = reqbody.location;
  return new Promise(async function (resolve, reject) {
    let sql = `select n.*
      from azure_availability_sets as n 
      where  n.subscriptionId='${subscription_id}' and n.resource_group='${resource_group}' 
      and n.location='${location}' 
      and n.record_status=1 order by n.id DESC`;
    ////console.log(sql);
    db.query(sql, async function (error, items, fields) {
      dbFunc.connectionRelease;
      if (!!error) {
        return callback([], { status: "error", message: 'The operation did not execute as expected. Please raise a ticket to support', data: error });
        resolve(error);
      } else {
        let body = { value: [] };
        for await (const item of items) {
          body.value.push(JSON.parse(item.response_obj));
        }
        return callback(null, { status: "success", message: 'Availability Sets.', data: body })
        resolve(items);
      }
    });
  });
  /*new Promise(function(resolve,reject){
    azure_authtoken(clientId,function(error,result){
      if(error) return resolve([])
      return resolve(result)
    })
  }).then(function(token){
    if(!token){
      var response={status : "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:token}
      return callback([],response);
    }
    var url=`https://management.azure.com/subscriptions/${subscription_id}/resourceGroups/${resource_group}/providers/Microsoft.Compute/availabilitySets?api-version=2018-06-01`;
    //console.log(url)
    request.get({url:url, headers : {
      "Authorization" :'Bearer '+token.tokendata.access_token
      }},
    function optionalCallback(err, httpResponse, result) {
      if (err) {
          return callback([],{status : "error", message:'The operation did not execute as expected. Please raise a ticket to support',data:err});
      }else{
        var body=JSON.parse(result);
        if(body.error){
          return callback(null,{status: "error", message:((body.error.message)?body.error.message:'The operation did not execute as expected. Please raise a ticket to support'),data:body})
      }else{
          return callback(null,{status : "success", message:'Availability Sets.',data:body})
      }
      }
    });
    
  })*/
}
/*
  Author: Pradeep
  Descri: get availability sets
  Date  : 19-05-2020
*/
let getResourceList = (reqbody, callback) => {
  if (!reqbody.subscriptionId) return callback(400, { success: 0, message: 'Subscription id is missing' });
  if (!reqbody.clientid) return callback(400, { success: 0, message: 'Client Id is missing' });
  var subscriptionId = reqbody.subscriptionId;
  var clientId = reqbody.clientid;
  new Promise(function (resolve, reject) {
    azure_authtoken(clientId, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support', data: token }
      return callback([], response);
    }
    //    var url=`https://management.azure.com/subscriptions/${subscriptionId}/resources?api-version=2018-05-01&$filter=resourceGroup eq 'Devopsautomation'`;
    var url = `https://management.azure.com/subscriptions/${subscriptionId}/resources?api-version=2018-05-01`;
    //console.log(url)
    request.get({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      async function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          var body = JSON.parse(result);

          let finalBody = {};

          finalBody = await new Promise(async function (resolve1, reject1) {
            let sql = `select rg.name
		            from c4_azure_resourcegroups as rg
		            inner join c4_azure_subscription_locations as l on l.id = rg.location_id
		            inner join c4_azure_subscriptions as s on s.subscription_id = l.subscription_id
		            left join bu_info as bu on bu.id = rg.bu_id
		            where  s.clientid = '${reqbody.clientid}' and s.state='Enabled' and s.is_visible_to_frontend = 1 and s.record_status = 1 and rg.record_status=1 
		            `;
            //left join c4_azure_resourcegroups_users as ru on ru.azure_resourcegroup_id = rg.id
            if (subscriptionId) {
              subscription_id = helper.strEscape(subscriptionId);
              sql += ` and s.subscription_id = '${subscriptionId}' `;
            }
            /*if(typeof reqbody.user_id != 'undefined' && reqbody.user_id != ''
             && (typeof reqbody.user_role == 'undefined' || (typeof reqbody.user_role != 'undefined' && reqbody.user_role != config.ADMIN_ROLE_ID))){
                sql += ` and ru.user_id = '${reqbody.user_id}' `;
            }*/
            if (reqbody.resource_groups !== undefined) {
              sql += ` and rg.name IN(${reqbody.resource_groups})`;
            }
            if (reqbody.subscription_id !== undefined) {
              sql += ` and s.subscriptionId IN(${reqbody.subscription_id})`;
            }
            sql += ` group by rg.id order by rg.id DESC `;
            await db.query(sql, async function (error, rgs, fields) {
              dbFunc.connectionRelease;
              if (!!error) {
                callback(1, { message: "The operation did not execute as expected. Please raise a ticket to support" });
                resolve1(error);
              } else {
                let rg_list = [];
                for await (var rg of rgs) {
                  rg_list.push(rg.name.toLowerCase());
                }
                //		            	console.log("rg_list --- ", rg_list);

                let loopBody = { value: [] };
                for await (var vm of body.value) {
                  //		            		console.log("vm.id.split('/')[4] --- ",vm.id.split('/')[4]);
                  if (rg_list.indexOf(vm.id.split('/')[4].toLowerCase()) >= 0) {
                    loopBody.value.push(vm);
                    //		            			console.log("------------------------------------------------------------------------------------");
                    //		            			console.log("loopBody --- ", loopBody);
                  }
                }
                resolve1(loopBody);
              }
            })
          });

          //        console.log("finalBody --- ", finalBody);
          return callback(null, finalBody)
        }
      });

  })
}

let getResourceSearchList = (reqbody, callback) => {
  if (!reqbody.filter_type) return callback(400, { success: 0, message: 'filter_type is missing' });
  if (!reqbody.filter_name) return callback(400, { success: 0, message: 'filter_name is missing' });
  if (!reqbody.clientid) return callback(400, { success: 0, message: 'Client Id is missing' });
  var filter_type = reqbody.filter_type;
  var filter_name = reqbody.filter_name;
  var clientId = reqbody.clientid;
  return new Promise((resolve, reject) => {
    var sql = `SELECT rl.* 
      from c4_azure_resource_list as rl
      left join c4_azure_resourcegroups as rg on rl.resourceGroup = rg.name
      WHERE rl.clientid= '${clientId}' and rl.type= '${filter_type}' and rl.name like '%${filter_name}%' and rg.record_status=1 `;
    //left join c4_azure_resourcegroups_users as ru on ru.azure_resourcegroup_id = rg.id
    /*if(typeof reqbody.user_id != 'undefined' && reqbody.user_id != ''
       && (typeof reqbody.user_role == 'undefined' || (typeof reqbody.user_role != 'undefined' && reqbody.user_role != config.ADMIN_ROLE_ID))){
          sql += ` and ru.user_id = '${reqbody.user_id}' `;
    }*/
    sql += ` group by rl.id order by rl.name asc`;
    console.log("sql --- ", sql);
    db.query(sql, async (error, rows, fields) => {
      dbFunc.connectionRelease;
      if (!!error) {
        callback(1, { status: 'error', message: "The operation did not execute as expected. Please raise a ticket to support" });
        resolve(error);
      } else {
        // let i = 0;
        // for await (const item of rows) {
        //     rows[i].encodeVal = base64.encode(item.clientid+"_"+item.subscriptionId+"_"+item.vmId);
        //     i++;
        // }
        if (rows.length == 0) {
          callback(1, { status: 'error', message: "No records found with your search." });
          resolve({ status: 'error', message: "No records found with your search." });
        } else {
          callback(null, { value: rows });
          resolve(rows)
        }

      }
    });
  });
}

/*
  Author: Pradeep
  Descri: Create availability set
  Date  : 19-05-2020
*/
let createAvailabilitySet = (reqbody, callback) => {
  let cts = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  if (!reqbody.subscriptionId) return callback(400, { status: "error", message: 'Subscription id is missing' });
  if (!reqbody.clientid) return callback(400, { status: "error", message: 'Client Id is missing' });
  if (!reqbody.availabilitySet) return callback(400, { status: "error", message: 'Availability set name is missing' });
  if (!reqbody.resourceGroup) return callback(400, { status: "error", message: 'Resource group name is missing' });
  if (!reqbody.location) return callback(400, { status: "error", message: 'Location name is missing' });
  var subscription_id = reqbody.subscriptionId;
  var availability_set = reqbody.availabilitySet;
  var resource_group = reqbody.resourceGroup;
  var location_name = reqbody.location;
  var clientId = reqbody.clientid;
  new Promise(function (resolve, reject) {
    azure_authtoken(clientId, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { status: "error", message: 'The operation did not execute as expected. Please raise a ticket to support', data: token }
      return callback([], response);
    }
    var url = `https://management.azure.com/subscriptions/${subscription_id}/resourceGroups/${resource_group}/providers/Microsoft.Compute/availabilitySets/${availability_set}?api-version=2019-12-01`;
    var bodyParams = {
      "location": `${location_name}`,
      "properties": {
        "platformFaultDomainCount": ((location_name == 'southeastasia') ? 2 : 3),
        "platformUpdateDomainCount": 20
      },
      "sku": {
        "name": "Aligned"
      },
    }
    //console.log(url)
    request.put({
      url: url, body: JSON.stringify(bodyParams), headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token,
        'Content-type': 'application/json'
      }
    },
      async function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], { status: "error", message: 'The operation did not execute as expected. Please raise a ticket to support', data: err });
        } else {
          var body = JSON.parse(result);
          console.log(body)
          if (body.error) {
            return callback(null, { status: "error", message: ((body.error.message) ? body.error.message : 'The operation did not execute as expected. Please raise a ticket to support'), data: body })
          } else {
            //        	  syncAvailabilitySets({subscription_id,resource_group});
            let insData = {
              clientid: clientId,
              subscriptionId: subscription_id,
              location: location_name,
              resource_group: resource_group,
              name: availability_set,
              response_obj: JSON.stringify(body),
              updated_date: cts
            };
            console.log('insData')
            console.log(insData)
            await dbHandler.insertIntoTable('azure_availability_sets', insData, async function (error, vmdid) {
              //                    imageIds.push(vmdid);
              //                    innerResolve('')
            });
            return callback(null, { status: "success", message: 'Availability Sets.', data: body })
          }
        }
      });

  })
}
/*
  Author: Pradeep
  Descri: validate Vm Name
  Date  : 21-10-2019
*/
let validateVmName = (reqBody, callback) => {
  var subscriptionId = reqBody.subscriptionId;
  var computerName = reqBody.computerName;
  var clientId = reqBody.clientid;
  var resourceGroupName = reqBody.resourceGroupName;
  if (!reqBody.subscriptionId) return callback(400, { success: 0, message: 'Subscription id is missing' });
  if (!reqBody.clientid) return callback(400, { success: 0, message: 'Client Id is missing' });
  if (!reqBody.computerName) return callback(400, { success: 0, message: 'VM name is missing' });
  if (!reqBody.resourceGroupName) return callback(400, { success: 0, message: 'Resource Group Name is missing' });
  if (reqBody.computerName.length < 5) return callback(400, { success: 0, message: 'VM name should be more than 5 chars' });
  var myRegEx = /[^a-z\d]/i;
  var isValid = !(myRegEx.test(computerName));
  if (!isValid) return callback(400, { success: 0, message: 'VM name is not valid. It will take only alphanumeric only' });

  let sql = `select av.id
      from azure_vms as av
      inner join c4_vm_details as vd on vd.id = av.vm_detail_id
      where av.clientid='${clientId}' and av.subscriptionId = '${subscriptionId}'
      and av.name='${computerName}' and vd.vm_status != 'Deleted' `;
  console.log(sql);
  db.query(sql, async function (error, items, fields) {
    dbFunc.connectionRelease;
    if (!!error) {
      console.log(error);
      var response = { success: 0, message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback(400, response);
    } else {
      if (items > 0) {
        result = { success: 0, message: 'VM already exists' };
        callback(null, result);
      } else {
        result = { success: 1, message: 'VM allowed for creation' };
        callback(null, result);
      }
    }
  });

  //  var whereQry={clientid:clientId,subscriptionId:subscriptionId,name:computerName};
  //    dbHandler.getOneRecord('azure_vms',whereQry,function(vmDetail){
  //    	if(!vmDetail){
  //        	result = {success:1,message:'VM allowed for creation'};
  //        	callback(null,result);
  //        }else{
  //        	result = {success:0,message:'VM already exists'};
  //        	callback(null,result);
  //        }
  //    });


  /*new Promise(function(resolve,reject){
    azure_authtoken(clientId,function(error,result){
      if(error){
        return resolve([])
      }
      return resolve(result)
    })
  }).then(function(token){
    if(!token){
      var response={success:0,message:'The operation did not execute as expected. Please raise a ticket to support'}
      return callback(400,response);
    }
    
  var url='https://management.azure.com/subscriptions/'+subscriptionId+'/resourceGroups/'+resourceGroupName+'/providers/Microsoft.Compute/virtualMachines/'+computerName+'/instanceView?api-version=2022-03-01';
//    var url='https://management.azure.com/subscriptions/'+subscriptionId+'/providers/Microsoft.Compute/virtualMachines?api-version=2022-03-01';
    request.get({url:url, headers : {
      "Authorization" :'Bearer '+token.tokendata.access_token
      }},
    async function optionalCallback(err, httpResponse, result) {
      if (err) {
          return callback([],err);
      }else{
        var body=JSON.parse(result);
        console.log("body ---- ", body);
        if(body && body.error && body.error.code && body.error.code=='ResourceNotFound'){
          result = {success:1,message:'VM allowed for creation'};
        }else{
          result = {success:0,message:'VM already exists'};
        }
//        var result=await new Promise(function(resolve,reject){
//          for (var key in body.value) {
//            var vm=body.value[key]
//            //console.log(vm)
//             if(vm.name==computerName){
//               resolve({success:0,message:'VM already exists'})
//             }
//          }
//          resolve({success:1,message:'VM allowed for creation'})
//        })
        callback(null,result);
      }
    });
    
  })*/
}
/*
  Author: Pradeep
  Descri: delete resource group
  Date  : 24-06-2020
*/
let deleteResourceGroup = (reqBody, callback) => {
  var subscriptionId = reqBody.subscriptionId;
  var resourceGroup = reqBody.resourceGroup;
  var clientId = reqBody.clientid;
  if (!reqBody.subscriptionId) return callback(400, { success: 0, message: 'Subscription id is missing' });
  if (!reqBody.clientid) return callback(400, { success: 0, message: 'Client id is missing' });
  if (!reqBody.resourceGroup) return callback(400, { success: 0, message: 'Resource group is missing' });
  new Promise(function (resolve, reject) {
    azure_authtoken(clientId, function (error, result) {
      if (error) {
        return resolve([])
      }
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { success: 0, message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback(400, response);
    }
    var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}?api-version=2018-05-01`;
    request.delete({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      async function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          return callback(null, { success: 1, message: 'Resource group deleted successfully.' });
        }
      });

  })
}
/*
  Author: Pradeep
  Descri: delete virtual machine
  Date  : 24-06-2020
*/
let deleteVirtualNetwork = (reqBody, callback) => {
  var subscriptionId = reqBody.subscriptionId;
  var resourceGroup = reqBody.resourceGroup;
  var clientId = reqBody.clientid;
  var virtualNetwork = reqBody.virtualNetwork;
  if (!reqBody.subscriptionId) return callback(400, { success: 0, message: 'Subscription id is missing' });
  if (!reqBody.clientid) return callback(400, { success: 0, message: 'Client id is missing' });
  if (!reqBody.resourceGroup) return callback(400, { success: 0, message: 'Resource group is missing' });
  if (!reqBody.virtualNetwork) return callback(400, { success: 0, message: 'Virtual network is missing' });
  if (!reqBody.id) return callback(400, { success: 0, message: 'Virtual network id' });
  new Promise(function (resolve, reject) {
    azure_authtoken(clientId, function (error, result) {
      if (error) {
        return resolve([])
      }
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { success: 0, message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback(400, response);
    }
    var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}/providers/Microsoft.Network/virtualNetworks/${virtualNetwork}?api-version=2020-05-01`;
    request.delete({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      async function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          var body = JSON.parse(result);
          if (body && body.error) {
            return callback(null, { success: 0, message: body.error.message });
          } else {
            var updateData = { status: 0 }
            var whereQry = { 'clientid': clientId, id: reqBody.id }
            dbHandler.updateTableData('azure_networks', whereQry, updateData, function (err, result) {
              return callback(null, { success: 1, message: 'Virtual Network deleted successfully.' });
            });
          }

        }
      });

  })
}
/*
  Author: Pradeep
  Descri: delete virtual machine
  Date  : 24-06-2020
*/
let deleteVirtualMachine = (reqBody, callback) => {
  var subscriptionId = reqBody.subscriptionId;
  var resourceGroup = reqBody.resourceGroup;
  var clientId = reqBody.clientid;
  var vmName = reqBody.vmName;
  if (!reqBody.subscriptionId) return callback(400, { success: 0, message: 'Subscription id is missing' });
  if (!reqBody.clientid) return callback(400, { success: 0, message: 'Client id is missing' });
  if (!reqBody.resourceGroup) return callback(400, { success: 0, message: 'Resource group is missing' });
  if (!reqBody.vmName) return callback(400, { success: 0, message: 'VM name is missing' });
  new Promise(function (resolve, reject) {
    azure_authtoken(clientId, function (error, result) {
      if (error) {
        return resolve([])
      }
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { success: 0, message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback(400, response);
    }
    var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/${vmName}?api-version=2022-03-01`;
    request.delete({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      async function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          return callback(null, { success: 1, message: 'Virtual Machine deleted successfully.' });
        }
      });

  })
}
/*
  Author: Pradeep
  Descri: delete disk
  Date  : 24-06-2020
*/
let deleteDisk = (reqBody, callback) => {
  var subscriptionId = reqBody.subscriptionId;
  var resourceGroup = reqBody.resourceGroup;
  var clientId = reqBody.clientid;
  var diskName = reqBody.diskName;
  if (!reqBody.subscriptionId) return callback(400, { success: 0, message: 'Subscription id is missing' });
  if (!reqBody.clientid) return callback(400, { success: 0, message: 'Client id is missing' });
  if (!reqBody.resourceGroup) return callback(400, { success: 0, message: 'Resource group is missing' });
  if (!reqBody.diskName) return callback(400, { success: 0, message: 'Disk name is missing' });
  new Promise(function (resolve, reject) {
    azure_authtoken(clientId, function (error, result) {
      if (error) {
        return resolve([])
      }
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { success: 0, message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback(400, response);
    }
    var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}/providers/Microsoft.Compute/disks/${diskName}?api-version=2019-07-01`;
    request.delete({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      async function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          return callback(null, { success: 1, message: 'Virtual Disk deleted successfully.' });
        }
      });

  })
}
/*
  Author: Pradeep
  Descri: delete network interface
  Date  : 24-06-2020
*/
let deleteNetworkInterface = (reqBody, callback) => {
  var subscriptionId = reqBody.subscriptionId;
  var resourceGroup = reqBody.resourceGroup;
  var clientId = reqBody.clientid;
  var networkInterface = reqBody.networkInterface;
  if (!reqBody.subscriptionId) return callback(400, { success: 0, message: 'Subscription id is missing' });
  if (!reqBody.clientid) return callback(400, { success: 0, message: 'Client id is missing' });
  if (!reqBody.resourceGroup) return callback(400, { success: 0, message: 'Resource group is missing' });
  if (!reqBody.networkInterface) return callback(400, { success: 0, message: 'Network Interface is missing' });
  if (!reqBody.id) return callback(400, { success: 0, message: 'Network Interface id' });
  new Promise(function (resolve, reject) {
    azure_authtoken(clientId, function (error, result) {
      if (error) {
        return resolve([])
      }
      return resolve(result)
    })
  }).then(function (token) {
    if (!token) {
      var response = { success: 0, message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback(400, response);
    }
    var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}/providers/Microsoft.Network/networkInterfaces/${networkInterface}?api-version=2020-05-01`;
    request.delete({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      async function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          var body = JSON.parse(result);
          if (body && body.error) {
            return callback(null, { success: 0, message: body.error.message });
          } else {
            var updateData = { status: 0 }
            var whereQry = { 'clientid': clientId, id: reqBody.id }
            dbHandler.updateTableData('azure_networkinterfaces', whereQry, updateData, function (err, result) {
              return callback(null, { success: 1, message: 'Network Interface deleted successfully.' });
            });
          }

        }
      });

  })
}
/*
  Author: Pradeep
  Descri: delete ip address
  Date  : 25-06-2020
*/
let deleteIpAddressProfile = (reqBody, callback) => {
  var resourceGroup = reqBody.resourceGroup;
  var subscriptionId = reqBody.subscriptionId;
  var clientid = reqBody.clientid;
  var ipAddressProfile = reqBody.ipAddressProfile;
  if (typeof (resourceGroup) == 'undefined' || resourceGroup == '') {
    var response = { message: 'Please provide resource group.' }
    return callback([], response);
  }
  if (typeof (subscriptionId) == 'undefined' || subscriptionId == '') {
    var response = { message: 'Please provide subscription id.' }
    return callback([], response);
  }
  if (typeof (clientid) == 'undefined' || clientid == '') {
    var response = { message: 'Please provide clientid.' }
    return callback([], response);
  }
  if (typeof (ipAddressProfile) == 'undefined' || ipAddressProfile == '') {
    var response = { message: 'Please provide ipAddressProfile.' }
    return callback([], response);
  }
  new Promise(function (resolve, reject) {
    azure_authtoken(clientid, function (error, result) {
      if (error) return resolve([])
      return resolve(result)
    })
  }).then(async function (token) {
    if (!token) {
      var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
      return callback([], response);
    }
    var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/publicIPAddresses/${ipAddressProfile}?api-version=2020-04-01`
    await request.delete({
      url: url, headers: {
        "Authorization": 'Bearer ' + token.tokendata.access_token
      }
    },
      async function optionalCallback(err, httpResponse, result) {
        if (err) {
          return callback([], err);
        } else {
          var body = JSON.parse(result);
          if (body && body.error) {
            return callback(null, { success: 0, message: body.error.message });
          } else {
            return callback(null, { success: 1, message: 'IP address profile deleted successfully.' });
          }
        }
      });
  })
}

/*
  Author: Pradeep
  Descri: sync vm status
  Date  : 07-07-2020
*/
let syncVmStatus = async (reqObj) => {
  console.log("reqObj --- ", reqObj);
  let current_date = dateFormat(new Date(), "yyyy-mm-dd");
  let cts = Math.floor(Date.now() / 1000);
  var vms = await new Promise(function (resolve, reject) {
    var sql = `select av.id, av.vm_detail_id, av.subscriptionId, 
    av.resourceGroup, av.name, 
    av.clientid, av.search_code, vd.cmdb_ci_number,
	vd.host_name, vd.label_name
    from azure_vms as av 
    inner join c4_vm_details as vd on vd.id = av.vm_detail_id
    where 1`;
    if (reqObj.clientid) {
      sql += ` and av.clientid = ${reqObj.clientid}`;
    }
    if (reqObj.subscriptionId) {
      sql += ` and av.subscriptionId = '${reqObj.subscriptionId}'`;
    }
    if (reqObj.vm_detail_id) {
      sql += ` and av.vm_detail_id = '${reqObj.vm_detail_id}'`;
    } else if (reqObj.host_name) {
      sql += ` and vd.host_name = '${reqObj.host_name}'`;
    } else {
      sql += ` and av.powerState !='Deleted'`;
    }
    console.log("syncVmStatus sql --- ", sql);
    dbHandler.executeQuery(sql, function (result) {
      resolve(result)
    })
  })
  //  return;
  for await (var vm of vms) {
    await new Promise(async function (resolve, reject) {
      await new Promise(async function (innerResolve, innerReject) {
        azure_authtoken(vm.clientid, function (error, result) {
          if (error) {
            return innerResolve([])
          } else {
            return innerResolve(result)
          }
        })
      }).then(function (token) {
        if (token && token.tokendata) {
          var url = 'https://management.azure.com/subscriptions/' + vm.subscriptionId + '/resourceGroups/' + vm.resourceGroup + '/providers/Microsoft.Compute/virtualMachines/' + vm.name + '/instanceView?api-version=2022-03-01';
          console.log("url -- " + url);
          request.get({
            url: url, headers: {
              "Authorization": 'Bearer ' + token.tokendata.access_token
            }
          },
            async function optionalCallback(err, httpResponse, result) {
              //	        	  console.log("result");
              //					console.log(result);
              //					console.log(JSON.stringify(result));
              if (err) {
                console.log(err)
                resolve(err);
              } else {
                var body = JSON.parse(result);
                console.log("body");
                console.log(body);
                if (body && body.error && body.error.code && body.error.code == 'ResourceNotFound') {// 0 && 
                  console.log("body");
                  console.log(body);
                  console.log(JSON.stringify(body));
                  //	              await dbHandler.updateTableData('c4_vm_details',{id:vm.vm_detail_id},{vm_status:'Deleted',status:0},function(err,result){
                  //	              })
                  //	              await dbHandler.updateTableData('azure_vms',{vm_detail_id:vm.vm_detail_id},{powerState:'Deleted'},function(err,result){
                  //	              })

                  await dbHandler.updateTableData('c4_vm_details', { id: vm.vm_detail_id }, {
                    vm_status: 'Deleted',
                    status: 0,
                    host_name: vm.label_name + "-" + vm.cmdb_ci_number,
                  }, function (err, result) {
                    console.log('updated')
                  })
                  let regex = new RegExp('(-' + vm.cmdb_ci_number + ')', 'gi');
                  await dbHandler.updateTableData('azure_vms', { vm_detail_id: vm.vm_detail_id }, {
                    powerState: 'Deleted', status: 0,
                    name: vm.label_name + "-" + vm.cmdb_ci_number,
                    search_code: ((vm.search_code) ? (vm.search_code.replace(regex, "")) + "-" + vm.cmdb_ci_number : "")
                  }, function (err, result) {
                    console.log('updated')
                  })

                  if (vm.cmdb_ci_number && vm.cmdb_ci_number != '') {
                    cmdbModel.deleteCmdbRecords({ vmId: vm.vm_detail_id }, function (err, deleteCmdbRecordsResult) {
                      //return callback(null,deleteCmdbRecordsResult);
                      console.log("ResourceNotFound...");
                      resolve("ResourceNotFound...");
                    })
                  } else {
                    let upd_sql = `UPDATE azure_reusing_hostnames SET record_status=4, reserved_date=${cts} WHERE host_name=:host_name`;
                    let upd_sql_status = await dbHandler.executeQueryv2(upd_sql, { host_name: vm.label_name });
                    console.log("upd_sql_status --- ", upd_sql_status);

                    console.log("ResourceNotFound...");
                    resolve("ResourceNotFound...");
                  }
                }
                else if (!body.error) {
                  var powerState = 'poweredOn';
                  var vm_status = 'Running';
                  var vmStatus = (body.statuses[1]) ? body.statuses[1].displayStatus : "";
                  if (vmStatus == 'VM deallocated' || vmStatus == 'VM stopped' || vmStatus == 'VM stopping') {// or VM running
                    powerState = 'poweredOff';
                    vm_status = 'Stopped';

                    console.log(vm.name + '--' + vm_status)
                    if (0 && vmStatus == 'VM deallocated') {// 0 && 
                      console.log("body.statuses");
                      console.log(body.statuses);
                      console.log(JSON.stringify(body.statuses));
                      //	    			  await dbHandler.updateTableData('c4_vm_details',{id:vm.vm_detail_id},{vm_status:'Deleted',status:0},async function(err,result){
                      //	    					await dbHandler.updateTableData('c4_order_details',{vmid:vm.vm_detail_id},{status:0},function(err,result){
                      //	                    })
                      //	                  })
                      //	                  await dbHandler.updateTableData('azure_vms',{vm_detail_id:vm.vm_detail_id},{powerState:'Deleted'},function(err,result){
                      //	                  })

                      await dbHandler.updateTableData('c4_vm_details', { id: vm.vm_detail_id }, {
                        vm_status: 'Deleted',
                        status: 0,
                        host_name: vm.host_name + "-" + vm.cmdb_ci_number,
                        label_name: vm.label_name + "-" + vm.cmdb_ci_number
                      }, async function (err, result) {
                        await dbHandler.updateTableData('c4_order_details', { vmid: vm.vm_detail_id }, { status: 0 }, function (err, result) {
                          console.log('updated')
                        })
                      })
                      let regex = new RegExp('(-' + vm.cmdb_ci_number + ')', 'gi');
                      await dbHandler.updateTableData('azure_vms', { vm_detail_id: vm.vm_detail_id }, {
                        powerState: 'Deleted', status: 0,
                        name: vm.name + "-" + vm.cmdb_ci_number,
                        search_code: (vm.search_code.replace(regex, "")) + "-" + vm.cmdb_ci_number
                      }, function (err, result) {
                        console.log('updated')
                      })


                      console.log("ifff....");
                      resolve("ifff....");
                    } else {
                      await dbHandler.updateTableData('c4_vm_details', { id: vm.vm_detail_id }, { vm_status: vm_status, power_status: powerState, status: 1 }, function (err, result) {
                      })
                      await dbHandler.updateTableData('azure_vms', { vm_detail_id: vm.vm_detail_id }, { powerState: powerState }, function (err, result) {
                      })
                      resolve("else....4");
                      console.log("else...4");
                    }
                  } else {
                    console.log("else...3");
                    resolve("else....3");
                  }
                } else {
                  console.log("else...2");
                  resolve("else....2");
                }
              }
            });
        } else {
          console.log("else...");
          resolve("else...")
        }
      })
    });
  }
}

async function buildWithParams(params, username, token, url, jobName) {
  var USERNAME = username ? username : null;
  var TOKEN = token ? token : null;
  var URL = url ? url : null;
  var params_str = '';
  var url = '';
  job_name = jobName ? jobName : null;

  if (!USERNAME || !TOKEN || !URL || !job_name) {
    return { success: 0, message: 'Input error.', response: {} };
  }

  for (let key in params) {
    params_str += '&' + key + '=' + encodeURI(params[key]);
  }
  token = `${TOKEN}${params_str}`;

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
    return { success: 0, message: 'UCP_CONSTANTS not found', response: reqBody };
	}

  url = `${UCP_CONSTANTS_DATA.JENKINS.Jenkins_protocal}://${USERNAME}:${TOKEN}@${URL}/job/${job_name}/buildWithParameters?token=${TOKEN}${params_str}`;
  console.log("jenkins url --- ", url);
  //  return {success : 1, message: 'Build is in progress.', response: {}, params_str: params_str};
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log("jenkins res - ", res)
    //const resJson = await res.json();
    //return {success : 1, message: 'Build is in progress.', response: res, params_str: params_str};
    return { success: 1, message: 'Activity has begun. Please check the tab named', response: res, params_str: params_str };
  } catch (error) {
    console.log("jenkins error --- ", error)
    return { success: 0, message: 'Failed on triggering jenkins build.', response: {}, error: error };
  }
};

/*
Author: Manish
Descri: createVmTemplate
Date  : 21-07-2021
*/
let createVmTemplate = async (reqBody, callback) => {
  console.log("createVmTemplate reqBody --- ", reqBody);
  //console.log("In azure_model function - createVmTemplate");
  //  return callback([],{success:200,message:'createVmTemplate route has been set.'}); 
  //res.send({code : 200, message : "createVmTemplate route has been set"});
  try {
    if (typeof (reqBody.virtual_machine_name) == 'undefined' || reqBody.virtual_machine_name == '') {
      return callback([], { success: 0, message: 'Please provide virtual machine name.' });
    }
    if (typeof (reqBody.ram) == 'undefined' || reqBody.ram == '') {
      return callback([], { success: 0, message: 'Please provide ram.' });
    }
    if (typeof (reqBody.subscription_provision_type) == 'undefined' || reqBody.subscription_provision_type == '') {
      return callback([], { success: 0, message: 'Please provide subscription_provision_type.' });
    }
    if (typeof (reqBody.nic_name) == 'undefined' || reqBody.nic_name == '') {
      return callback([], { success: 0, message: 'Please provide nic name.' });
    }
    if (typeof (reqBody.virtual_machine_size) == 'undefined' || reqBody.virtual_machine_size == '') {
      return callback([], { success: 0, message: 'Please provide virtual machine size.' });
    }
    //    if(typeof(reqBody.os_disk_size)=='undefined' || reqBody.os_disk_size==''){
    //      return callback([],{success:0,message:'Please provide os disk size.'});
    //    }
    if (typeof (reqBody.os_disk_storage_account_type) == 'undefined' || reqBody.os_disk_storage_account_type == '') {
      return callback([], { success: 0, message: 'Please provide os disk storage account type.' });
    }
    //    if(typeof(reqBody.managed_disk_name)=='undefined' || reqBody.managed_disk_name==''){
    //      return callback([],{success:0,message:'Please provide managed disk name.'});
    //    }
    //    if(typeof(reqBody.managed_disk_size)=='undefined' || reqBody.managed_disk_size==''){
    //      return callback([],{success:0,message:'Please provide managed disk size.'});
    //    }
    //    if(typeof(reqBody.managed_disk_size_storage_account_type)=='undefined' || reqBody.managed_disk_size_storage_account_type==''){
    //      return callback([],{success:0,message:'Please provide managed disk size storage account type.'});
    //    }
    if (typeof (reqBody.deployment_resource_group_name) == 'undefined' || reqBody.deployment_resource_group_name == '') {
      return callback([], { success: 0, message: 'Please provide deployment_resource group name.' });
    }
    if (typeof (reqBody.network_resource_group_name) == 'undefined' || reqBody.network_resource_group_name == '') {
      return callback([], { success: 0, message: 'Please provide network resource group name.' });
    }
    if (typeof (reqBody.virtual_network_name) == 'undefined' || reqBody.virtual_network_name == '') {
      return callback([], { success: 0, message: 'Please provide virtual network name.' });
    }
    if (typeof (reqBody.subnet_name) == 'undefined' || reqBody.subnet_name == '') {
      return callback([], { success: 0, message: 'Please provide subnet name.' });
    }
    if (typeof (reqBody.image_name) == 'undefined' || reqBody.image_name == '') {
      return callback([], { success: 0, message: 'Please provide image name.' });
    }
    if (typeof (reqBody.admin_username) == 'undefined' || reqBody.admin_username == '') {
      return callback([], { success: 0, message: 'Please provide admin username.' });
    }
    if (typeof (reqBody.admin_password) == 'undefined' || reqBody.admin_password == '') {
      return callback([], { success: 0, message: 'Please provide admin password.' });
    }
    if (typeof (reqBody.environment) == 'undefined' || reqBody.environment == '') {
      return callback([], { success: 0, message: 'Please provide environment.' });
    }
    if (typeof (reqBody.subscription_id) == 'undefined' || reqBody.subscription_id == '') {
      return callback([], { success: 0, message: 'Please provide subscription id.' });
    }
    if (typeof (reqBody.client_id) == 'undefined' || reqBody.client_id == '') {
      return callback([], { success: 0, message: 'Please provide client id.' });
    }
    if (typeof (reqBody.client_secret) == 'undefined' || reqBody.client_secret == '') {
      return callback([], { success: 0, message: 'Please provide client secret.' });
    }
    if (typeof (reqBody.tenant_id) == 'undefined' || reqBody.tenant_id == '') {
      return callback([], { success: 0, message: 'Please provide tenant id.' });
    }
    // if (typeof (reqBody.storage_account_name) == 'undefined' || reqBody.storage_account_name == '') {
    //   return callback([], { success: 0, message: 'Please provide storage account name.' });
    // }
    if (typeof (reqBody.os_type) == 'undefined' || reqBody.os_type == '') {
      return callback([], { success: 0, message: 'Please provide os_type.' });
    }
    //    if(typeof(reqBody.system_name)=='undefined' || reqBody.system_name==''){
    //        return callback([],{success:0,message:'Please provide system_name.'});
    //    }
    if (typeof (reqBody.system_type) == 'undefined' || reqBody.system_type == '') {
      return callback([], { success: 0, message: 'Please provide system_type.' });
    }
    if (typeof (reqBody.gallery_name) == 'undefined' || reqBody.gallery_name == '') {
      return callback([], { success: 0, message: 'Please provide gallery_name.' });
    }
    if (typeof (reqBody.shared_image_name) == 'undefined' || reqBody.shared_image_name == '') {
      return callback([], { success: 0, message: 'Please provide shared_image_name.' });
    }
    if (typeof (reqBody.shared_image_version) == 'undefined' || reqBody.shared_image_version == '') {
      return callback([], { success: 0, message: 'Please provide shared_image_version.' });
    }
    // if (typeof (reqBody.backup_resource_group_name) == 'undefined' || reqBody.backup_resource_group_name == '') {
    //   return callback([], { success: 0, message: 'Please provide backup_resource_group_name.' });
    // }
    // if (typeof (reqBody.recovery_vault_name) == 'undefined' || reqBody.recovery_vault_name == '') {
    //   return callback([], { success: 0, message: 'Please provide recovery_vault_name.' });
    // }
    // if (typeof (reqBody.backup_policy) == 'undefined' || reqBody.backup_policy == '') {
    //   return callback([], { success: 0, message: 'Please provide backup_policy.' });
    // }
    if (typeof (reqBody.availability_set_or_zone) == 'undefined' || reqBody.availability_set_or_zone == '') {
      return callback([], { success: 0, message: 'Please provide availability_set_or_zone.' });
    }
    if (reqBody.availability_set_or_zone == 'Set' && (typeof (reqBody.availability_set_name) == 'undefined' || reqBody.availability_set_name == '')) {
      return callback([], { success: 0, message: 'Please provide availability_set_name.' });
    }
    if (reqBody.availability_set_or_zone == 'Zone' && (typeof (reqBody.zone) == 'undefined' || reqBody.zone == '')) {
      return callback([], { success: 0, message: 'Please provide zone.' });
    }
    if (typeof (reqBody.managed_infra_subscription_id) == 'undefined' || reqBody.managed_infra_subscription_id == '') {
      return callback([], { success: 0, message: 'Please provide managed_infra_subscription_id.' });
    }
    // if (typeof (reqBody.storage_resource_group_name) == 'undefined' || reqBody.storage_resource_group_name == '') {
    //   return callback([], { success: 0, message: 'Please provide storage_resource_group_name.' });
    // }
    if (typeof (reqBody.sharedimage_resource_group_name) == 'undefined' || reqBody.sharedimage_resource_group_name == '') {
      return callback([], { success: 0, message: 'Please provide sharedimage_resource_group_name.' });
    }

    let jenkins_job_type = 1;
    if (typeof (reqBody.jenkins_job_type) != 'undefined' && reqBody.jenkins_job_type != '') {
      jenkins_job_type = reqBody.jenkins_job_type;
    }
    let is_cluster = 0;
    if (typeof reqBody.is_cluster != 'undefined' && reqBody.is_cluster != '') {
      is_cluster = reqBody.is_cluster;
    }

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

    const USERNAME = UCP_CONSTANTS_DATA.JENKINS.JenkinsUSERNAME;
    const TOKEN = UCP_CONSTANTS_DATA.JENKINS.JenkinsTOKEN;
    const URL = UCP_CONSTANTS_DATA.JENKINS.JenkinsURL;
    let JOBNAME = "";
    let mountpoints_file_path = "", weblogic_file_path = "", oracle_file_path = "", display_job_name = "";
    if (reqBody.shared_image_tags && reqBody.shared_image_tags != '') {
      sql = `select job_name, mountpoints_file_path, weblogic_file_path, oracle_file_path, display_job_name from azure_jenkin_jobs 
    	where provision_type = '${reqBody.subscription_provision_type}' 
    	and os_type = '${reqBody.shared_image_tags["UCP-OS-Type"]}'
    	and db_type = '${reqBody.shared_image_tags["UCP-DB-Type"]}'
    	and mw_type = '${reqBody.shared_image_tags["UCP-MW"]}'
    	and record_status = 1 and job_type= '${jenkins_job_type}'
    	and is_cluster = '${is_cluster}'
    	`;
      if (!reqBody.managed_disk_name || reqBody.managed_disk_name == '') {
        sql += ` and is_without_disk = 1 `;
      } else {
        sql += ` and is_without_disk = 0 `;
      }
      sql += ` limit 1 `;
      console.log(sql);
      await new Promise(async function (resolve1, reject1) {
        db.query(sql, async function (error, rows, fields) {
          dbFunc.connectionRelease;
          if (!!error) {
            console.log(error);
            resolve1("");
          } else {
            if (rows.length > 0) {
              console.log("rows -- ", rows);
              JOBNAME = rows[0].job_name;
              mountpoints_file_path = rows[0].mountpoints_file_path;
              weblogic_file_path = rows[0].weblogic_file_path;
              oracle_file_path = rows[0].oracle_file_path;
              display_job_name = rows[0].display_job_name;
              resolve1("");
            } else {
              resolve1("");
            }
          }
        });
      });
    }
    console.log("JOBNAME ------------------------------------------ ", JOBNAME);
    var jenkins = jenkinsapi.init(`${UCP_CONSTANTS_DATA.JENKINS.Jenkins_protocal}://${USERNAME}:${TOKEN}@${URL}`);
    console.log("jenkins url -- ", `${UCP_CONSTANTS_DATA.JENKINS.Jenkins_protocal}://${USERNAME}:${TOKEN}@${URL}`);
    console.log("JOBNAME -- ", JOBNAME);

    let private_ip_address = '';
    if (reqBody.private_ip_address && reqBody.private_ip_address != '') {
      private_ip_address = reqBody.private_ip_address;
    }
    console.log("private_ip_address -- ", private_ip_address);

    let clientSql = `select azure_clientid as client_id,
		azure_clientsecretkey as client_secret,
		azure_tenantid as tenant_id
		from c4_clients where id = '${config.DEMO_CLIENT_ID}' limit 1 `;
    console.log("clientSql --- ", clientSql);
    let clientRows = await dbHandler.executeQueryv2(clientSql);
    console.log("clientRows ---- ", clientRows);
    if (clientRows.length == 0) {
      return callback(1, { success: 0, message: 'Azure credentials not found.' });
    }

    let params = {};
    params = {
      "attached_disk_caching": reqBody.managed_disk_host_caching,
      "backup_policy": reqBody.backup_policy,
      "backup_resource_group_name": reqBody.backup_resource_group_name,
      "client_id": clientRows[0].client_id,
      "client_secret": clientRows[0].client_secret,
      "deployment_resource_group_name": reqBody.deployment_resource_group_name,
      "environment": reqBody.environment,
      "gallery_name": reqBody.gallery_name,
      "image_name": reqBody.image_name,
      "managed_disk_name": reqBody.managed_disk_name,
      "managed_disk_size": reqBody.managed_disk_size,
      "managed_disk_size_storage_account_type": reqBody.managed_disk_size_storage_account_type,
      "managed_infra_client_id": clientRows[0].client_id,
      "managed_infra_client_secret": clientRows[0].client_secret,
      "managed_infra_subscription_id": reqBody.managed_infra_subscription_id,
      "managed_infra_tenant_id": clientRows[0].tenant_id,
      "network_resource_group_name": reqBody.network_resource_group_name,
      "nic_name": reqBody.nic_name,
      "os_disk_size": ((reqBody.os_disk_size) ? reqBody.os_disk_size : '128'),
      "os_disk_storage_account_type": reqBody.os_disk_storage_account_type,
      "recovery_vault_name": reqBody.recovery_vault_name,
      "region": ((reqBody.selected_network_location_name) ? reqBody.selected_network_location_name : ""),
      "resource_group_name_image": reqBody.sharedimage_resource_group_name,
      "resource_group_name_storage": reqBody.storage_resource_group_name,
      "shared_image_name": reqBody.shared_image_name,
      "shared_image_version": reqBody.shared_image_version,
      "sharedimage_resource_group_name": reqBody.sharedimage_resource_group_name,
      "storage_account_name": reqBody.storage_account_name,
      "storage_resource_group_name": reqBody.storage_resource_group_name,
      "subnet_name": reqBody.subnet_name,
      "subscription_id": reqBody.subscription_id,
      "system-name": "",
      "system-type": reqBody.system_type,
      "system_type": reqBody.system_type,
      "tenant_id": clientRows[0].tenant_id,
      "virtual_machine_name": reqBody.virtual_machine_name,
      "virtual_machine_size": reqBody.virtual_machine_size,
      "virtual_network_name": reqBody.virtual_network_name,
      "acceleratedNetworkingEnabled": ((reqBody.acceleratedNetworkingEnabled) ? reqBody.acceleratedNetworkingEnabled.toLowerCase() : "false"),
      "ram_in_gb": ((reqBody.ram) ? Math.floor(parseInt(reqBody.ram) / 1024) : "0"),
      "ram": ((reqBody.ram) ? Math.floor(parseInt(reqBody.ram) / 1024) : "0")
    };
    if (reqBody.Netbackup_policy) {
      params.Netbackup_policy = reqBody.Netbackup_policy;
    }
    if (reqBody.informixLog) {
      params.log = reqBody.informixLog;
    }
    //private_ip_address
    if (private_ip_address == '') {
      sql = `select ip_address from azure_reusing_hostnames 
    	where host_name = '${reqBody.virtual_machine_name}' 
    	limit 1`;
      console.log(sql);
      await new Promise(async function (resolve1, reject1) {
        db.query(sql, async function (error, rows, fields) {
          dbFunc.connectionRelease;
          if (!!error) {
            console.log(error);
            resolve1("");
          } else {
            if (rows.length > 0) {
              console.log("rows -- ", rows)
              private_ip_address = rows[0].ip_address;
              resolve1("");
            } else {
              resolve1("");
            }
          }
        });
      });
    }
    console.log("private_ip_address ------------------------------------------ ", private_ip_address);
    params.private_ip_address = private_ip_address;

    //TODO comment below lines in live
    //    reqBody.selected_ansible_server = UCP_CONSTANTS_DATA.jsonFileSftp.host;
    //    mountpoints_file_path = UCP_CONSTANTS_DATA.jsonFileSftp.path;

    if (reqBody.selected_ansible_server
      && reqBody.selected_ansible_server != ''
      && reqBody.selected_ansible_server != 'na') {
      params.ansibleip = reqBody.selected_ansible_server;
    }
    console.log("reqBody.selected_ansible_server --- ", reqBody.selected_ansible_server);
    console.log("mountpoints_file_path --- ", mountpoints_file_path);
    if (reqBody.selected_ansible_server
      && reqBody.selected_ansible_server != ''
      && reqBody.selected_ansible_server != 'na'
      && reqBody.mountPointJson && reqBody.mountPointJson[reqBody.virtual_machine_name]) {
      //push file to anisible server
      try {
        let filepath = config.REPORTS_PATH + reqBody.virtual_machine_name + ".json";
        console.log("filepath --- ", filepath);
        if (fs.existsSync(filepath)) {
          //file exists
          const Client = require('ssh2-sftp-client');
          let sftp = new Client();
          try {
            sftp.connect({
              host: params.ansibleip, //UCP_CONSTANTS_DATA.jsonFileSftp.host,//
              username: UCP_CONSTANTS_DATA.jsonFileSftp.username,
              password: UCP_CONSTANTS_DATA.jsonFileSftp.password,
              port: UCP_CONSTANTS_DATA.jsonFileSftp.port
            }).then(() => {
              console.log("mountpoint vmmmm 1111111111 ");
              return sftp.put(filepath, mountpoints_file_path + reqBody.virtual_machine_name + ".json");
            }).then((data) => {
              console.log("mountpoint vmmmm 22222 ");
              console.log(data);
            }).catch((err) => {
              console.log("mountpoint vmmmm 33333 ");
              console.log(err.message, 'catch error');
            });
          } catch (e) {
            console.log("mountpoint vmmmm 44444 ");
            console.log(e.errmsg)
          }
        } else {
          console.log("mountpoint vmmmm 555555 ");
          console.log("file not found");
        }
      } catch (err) {
        console.log("mountpoint vmmmm 666666 ");
        console.error(err)
      }
    }
    if (reqBody.shared_image_tags
      && reqBody.shared_image_tags["UCP-DB-Type"]
      && reqBody.shared_image_tags["UCP-DB-Type"] == 'MSSQL' && reqBody.msDbName) {
      params.databasename = reqBody.msDbName;
      params.Data_File_Size = ((reqBody.Data_File_Size) ? reqBody.Data_File_Size : "64");
      params.Log_File_Size = ((reqBody.Log_File_Size) ? reqBody.Log_File_Size : "64");
      params.Temp_DB_Size = ((reqBody.Temp_DB_Size) ? reqBody.Temp_DB_Size : "64");
    }
    console.log("oracle_file_path --- ", oracle_file_path);
    if (reqBody.shared_image_tags
      && reqBody.shared_image_tags["UCP-DB-Type"]
      && reqBody.shared_image_tags["UCP-DB-Type"] == 'Oracle') {
      params.dbName = reqBody.dbName;
      //    	let filesArr = [
      //    		"tnsnames.ora",
      //    		"postdbcreation.sh",
      //    		"listener.ora",
      //    		"dbca.rsp",
      //    		"datafiles.sh"
      //    	];

      try {
        let file_item = "tnsnames.ora";
        let filepath = config.REPORTS_PATH + reqBody.virtual_machine_name + "_" + file_item;
        console.log("filepath --- ", filepath);
        if (fs.existsSync(filepath)) {
          //file exists
          const Client = require('ssh2-sftp-client');
          let sftp = new Client();
          try {
            sftp.connect({
              host: params.ansibleip,//params.ansibleip,//UCP_CONSTANTS_DATA.jsonFileSftp.host,//"182.18.157.23",//
              username: UCP_CONSTANTS_DATA.jsonFileSftp.username,
              password: UCP_CONSTANTS_DATA.jsonFileSftp.password,
              port: UCP_CONSTANTS_DATA.jsonFileSftp.port
            }).then(() => {
              console.log("mountpoint oracle " + file_item + " 1111111111 ");
              return sftp.put(filepath, oracle_file_path + reqBody.virtual_machine_name + "_" + file_item);
            }).then((data) => {
              console.log("mountpoint oracle " + file_item + " 22222 ");
              console.log(data);
            }).catch((err) => {
              console.log("mountpoint oracle " + file_item + " 33333 ");
              console.log(err.message, 'catch error');
            });
          } catch (e) {
            console.log("mountpoint oracle " + file_item + " 44444 ");
            console.log(e.errmsg);
          }
        } else {
          console.log("mountpoint oracle " + file_item + " 555555 ");
          console.log("file not found");
        }
      } catch (err) {
        console.log("mountpoint oracle " + file_item + " 666666 ");
        console.error(err);
      }

      try {
        let file_item = "postdbcreation.sh";
        let filepath = config.REPORTS_PATH + reqBody.virtual_machine_name + "_" + file_item;
        console.log("filepath --- ", filepath);
        if (fs.existsSync(filepath)) {
          //file exists
          const Client = require('ssh2-sftp-client');
          let sftp = new Client();
          try {
            sftp.connect({
              host: params.ansibleip,//params.ansibleip,//UCP_CONSTANTS_DATA.jsonFileSftp.host,//"182.18.157.23",//
              username: UCP_CONSTANTS_DATA.jsonFileSftp.username,
              password: UCP_CONSTANTS_DATA.jsonFileSftp.password,
              port: UCP_CONSTANTS_DATA.jsonFileSftp.port
            }).then(() => {
              console.log("mountpoint oracle " + file_item + " 1111111111 ");
              return sftp.put(filepath, oracle_file_path + reqBody.virtual_machine_name + "_" + file_item);
            }).then((data) => {
              console.log("mountpoint oracle " + file_item + " 22222 ");
              console.log(data);
            }).catch((err) => {
              console.log("mountpoint oracle " + file_item + " 33333 ");
              console.log(err.message, 'catch error');
            });
          } catch (e) {
            console.log("mountpoint oracle " + file_item + " 44444 ");
            console.log(e.errmsg);
          }
        } else {
          console.log("mountpoint oracle " + file_item + " 555555 ");
          console.log("file not found");
        }
      } catch (err) {
        console.log("mountpoint oracle " + file_item + " 666666 ");
        console.error(err);
      }

      try {
        let file_item = "listener.ora";
        let filepath = config.REPORTS_PATH + reqBody.virtual_machine_name + "_" + file_item;
        console.log("filepath --- ", filepath);
        if (fs.existsSync(filepath)) {
          //file exists
          const Client = require('ssh2-sftp-client');
          let sftp = new Client();
          try {
            sftp.connect({
              host: params.ansibleip,//params.ansibleip,//UCP_CONSTANTS_DATA.jsonFileSftp.host,//"182.18.157.23",//
              username: UCP_CONSTANTS_DATA.jsonFileSftp.username,
              password: UCP_CONSTANTS_DATA.jsonFileSftp.password,
              port: UCP_CONSTANTS_DATA.jsonFileSftp.port
            }).then(() => {
              console.log("mountpoint oracle " + file_item + " 1111111111 ");
              return sftp.put(filepath, oracle_file_path + reqBody.virtual_machine_name + "_" + file_item);
            }).then((data) => {
              console.log("mountpoint oracle " + file_item + " 22222 ");
              console.log(data);
            }).catch((err) => {
              console.log("mountpoint oracle " + file_item + " 33333 ");
              console.log(err.message, 'catch error');
            });
          } catch (e) {
            console.log("mountpoint oracle " + file_item + " 44444 ");
            console.log(e.errmsg);
          }
        } else {
          console.log("mountpoint oracle " + file_item + " 555555 ");
          console.log("file not found");
        }
      } catch (err) {
        console.log("mountpoint oracle " + file_item + " 666666 ");
        console.error(err);
      }

      try {
        let file_item = "dbca.rsp";
        let filepath = config.REPORTS_PATH + reqBody.virtual_machine_name + "_" + file_item;
        console.log("filepath --- ", filepath);
        if (fs.existsSync(filepath)) {
          //file exists
          const Client = require('ssh2-sftp-client');
          let sftp = new Client();
          try {
            sftp.connect({
              host: params.ansibleip,//params.ansibleip,//UCP_CONSTANTS_DATA.jsonFileSftp.host,//"182.18.157.23",//
              username: UCP_CONSTANTS_DATA.jsonFileSftp.username,
              password: UCP_CONSTANTS_DATA.jsonFileSftp.password,
              port: UCP_CONSTANTS_DATA.jsonFileSftp.port
            }).then(() => {
              console.log("mountpoint oracle " + file_item + " 1111111111 ");
              return sftp.put(filepath, oracle_file_path + reqBody.virtual_machine_name + "_" + file_item);
            }).then((data) => {
              console.log("mountpoint oracle " + file_item + " 22222 ");
              console.log(data);
            }).catch((err) => {
              console.log("mountpoint oracle " + file_item + " 33333 ");
              console.log(err.message, 'catch error');
            });
          } catch (e) {
            console.log("mountpoint oracle " + file_item + " 44444 ");
            console.log(e.errmsg);
          }
        } else {
          console.log("mountpoint oracle " + file_item + " 555555 ");
          console.log("file not found");
        }
      } catch (err) {
        console.log("mountpoint oracle " + file_item + " 666666 ");
        console.error(err);
      }

      try {
        let file_item = "datafiles.sh";
        let filepath = config.REPORTS_PATH + reqBody.virtual_machine_name + "_" + file_item;
        console.log("filepath --- ", filepath);
        if (fs.existsSync(filepath)) {
          //file exists
          const Client = require('ssh2-sftp-client');
          let sftp = new Client();
          try {
            sftp.connect({
              host: params.ansibleip,//params.ansibleip,//UCP_CONSTANTS_DATA.jsonFileSftp.host,//"182.18.157.23",//
              username: UCP_CONSTANTS_DATA.jsonFileSftp.username,
              password: UCP_CONSTANTS_DATA.jsonFileSftp.password,
              port: UCP_CONSTANTS_DATA.jsonFileSftp.port
            }).then(() => {
              console.log("mountpoint oracle " + file_item + " 1111111111 ");
              return sftp.put(filepath, oracle_file_path + reqBody.virtual_machine_name + "_" + file_item);
            }).then((data) => {
              console.log("mountpoint oracle " + file_item + " 22222 ");
              console.log(data);
            }).catch((err) => {
              console.log("mountpoint oracle " + file_item + " 33333 ");
              console.log(err.message, 'catch error');
            });
          } catch (e) {
            console.log("mountpoint oracle " + file_item + " 44444 ");
            console.log(e.errmsg);
          }
        } else {
          console.log("mountpoint oracle " + file_item + " 555555 ");
          console.log("file not found");
        }
      } catch (err) {
        console.log("mountpoint oracle " + file_item + " 666666 ");
        console.error(err);
      }
    }
    console.log("weblogic_file_path --- ", weblogic_file_path);
    let weblogicMiddlewares = ["WebLogic", "WebLogic Server"];
    if (reqBody.shared_image_tags
      && reqBody.shared_image_tags["UCP-MW"]
      && weblogicMiddlewares.indexOf(reqBody.shared_image_tags["UCP-MW"]) >= 0) {
      //push WebLogic file to anisible server
      try {
        let filepath = config.REPORTS_PATH + reqBody.virtual_machine_name + ".txt";
        console.log("filepath --- ", filepath);
        if (fs.existsSync(filepath)) {
          //file exists
          const Client = require('ssh2-sftp-client');
          let sftp = new Client();
          try {
            sftp.connect({
              host: params.ansibleip,//UCP_CONSTANTS_DATA.jsonFileSftp.host,//"182.18.157.23",//
              username: UCP_CONSTANTS_DATA.jsonFileSftp.username,
              password: UCP_CONSTANTS_DATA.jsonFileSftp.password,
              port: UCP_CONSTANTS_DATA.jsonFileSftp.port
            }).then(() => {
              console.log("mountpoint weblogic 1111111111 ");
              return sftp.put(filepath, weblogic_file_path + reqBody.virtual_machine_name + ".txt");
            }).then((data) => {
              console.log("mountpoint weblogic 22222 ");
              console.log(data);
            }).catch((err) => {
              console.log("mountpoint weblogic 33333 ");
              console.log(err.message, 'catch error');
            });
          } catch (e) {
            console.log("mountpoint weblogic 44444 ");
            console.log(e.errmsg)
          }
        } else {
          console.log("mountpoint weblogic 555555 ");
          console.log("file not found");
        }
      } catch (err) {
        console.log("mountpoint weblogic 666666 ");
        console.error(err)
      }

      //push WebLogic Env file to anisible server
      try {
        let filepath = config.REPORTS_PATH + reqBody.virtual_machine_name + ".sh";
        console.log("filepath --- ", filepath);
        if (fs.existsSync(filepath)) {
          //file exists
          const Client = require('ssh2-sftp-client');
          let sftp = new Client();
          try {
            sftp.connect({
              host: params.ansibleip,//UCP_CONSTANTS_DATA.jsonFileSftp.host,//"182.18.157.23",//
              username: UCP_CONSTANTS_DATA.jsonFileSftp.username,
              password: UCP_CONSTANTS_DATA.jsonFileSftp.password,
              port: UCP_CONSTANTS_DATA.jsonFileSftp.port
            }).then(() => {
              console.log("mountpoint weblogicEnv 1111111111 ");
              return sftp.put(filepath, weblogic_file_path + reqBody.virtual_machine_name + ".sh");
            }).then((data) => {
              console.log("mountpoint weblogicEnv 22222 ");
              console.log(data);
            }).catch((err) => {
              console.log("mountpoint weblogicEnv 33333 ");
              console.log(err.message, 'catch error');
            });
          } catch (e) {
            console.log("mountpoint weblogicEnv 44444 ");
            console.log(e.errmsg)
          }
        } else {
          console.log("mountpoint weblogicEnv 555555 ");
          console.log("file not found");
        }
      } catch (err) {
        console.log("mountpoint weblogicEnv 666666 ");
        console.error(err)
      }
    }

    if (reqBody.shared_image_tags && reqBody.shared_image_tags["UCP-Disk"] && reqBody.shared_image_tags["UCP-Disk"] == 'Yes') {
      params.data_disk_name = reqBody.virtual_machine_name + "-Additional-Disk";
      params.data_disk_size = ((reqBody.shared_image_tags["UCP-Additional-Disk"]) ? reqBody.shared_image_tags["UCP-Additional-Disk"] : "128");

      //    	if(reqBody.shared_image_tags && reqBody.shared_image_tags["UCP-MW"] 
      //    			&& (reqBody.shared_image_tags["UCP-MW"] == 'JBOSS-EAP'
      //    				|| reqBody.shared_image_tags["UCP-MW"] == 'Tomcat')){
      //    		params.data_disk_size = "64";
      //    	}
    }
    if (reqBody.availability_set_or_zone == 'Set') {
      params.availability_set_name = reqBody.availability_set_name;
      if (is_cluster == 1) {
        params.availability_set_name2 = reqBody.availability_set_name2;
      }
    } else if (reqBody.availability_set_or_zone == 'Zone') {
      params.zone = reqBody.zone;
      if (is_cluster == 1) {
        params.zone2 = reqBody.zone2;
      }
    }
    if (is_cluster == 1) {
      params.nic_name2 = reqBody.nic_name2;
      params.virtual_machine_name2 = reqBody.virtual_machine_name2;
      params.nic_name3 = reqBody.nic_name3;
      params.nic_name4 = reqBody.nic_name4;
      params.managed_disk_name2 = reqBody.managed_disk_name2;
      params.attached_disk_caching2 = reqBody.managed_disk_host_caching2;
      params.managed_disk_storage_size2 = reqBody.managed_disk_storage_size2;
      params.managed_disk_size2 = reqBody.managed_disk_size2;
      params.managed_disk_size_storage_account_type2 = reqBody.managed_disk_size_storage_account_type2;
      params.subnet1_name = reqBody.subnet1_name;
      params.private_ip_address2 = '';
      if (reqBody.private_ip_address2 && reqBody.private_ip_address2 != '') {
        params.private_ip_address2 = reqBody.private_ip_address2;
      }

      if (params.private_ip_address2 == '') {
        sql = `select ip_address from azure_reusing_hostnames 
        	where host_name = '${reqBody.virtual_machine_name2}' 
        	limit 1`;
        console.log(sql);
        await new Promise(async function (resolve1, reject1) {
          db.query(sql, async function (error, rows, fields) {
            dbFunc.connectionRelease;
            if (!!error) {
              console.log(error);
              resolve1("");
            } else {
              if (rows.length > 0) {
                console.log("rows -- ", rows)
                params.private_ip_address2 = rows[0].ip_address;
                resolve1("");
              } else {
                resolve1("");
              }
            }
          });
        });
      }
      console.log("private_ip_address2 ------------------------------------------ ", params.private_ip_address2);

      if (reqBody.selected_ansible_server
        && reqBody.selected_ansible_server != ''
        && reqBody.selected_ansible_server != 'na'
        && reqBody.mountPointJson && reqBody.mountPointJson[reqBody.virtual_machine_name2]) {
        //push file to anisible server
        try {
          let filepath = config.REPORTS_PATH + reqBody.virtual_machine_name2 + ".json";
          console.log("filepath --- ", filepath);
          if (fs.existsSync(filepath)) {
            //file exists
            const Client = require('ssh2-sftp-client');
            let sftp = new Client();
            try {
              sftp.connect({
                host: params.ansibleip, //UCP_CONSTANTS_DATA.jsonFileSftp.host,//
                username: UCP_CONSTANTS_DATA.jsonFileSftp.username,
                password: UCP_CONSTANTS_DATA.jsonFileSftp.password,
                port: UCP_CONSTANTS_DATA.jsonFileSftp.port
              }).then(() => {
                console.log("mountpoint cluster 11111 ");
                return sftp.put(filepath, mountpoints_file_path + reqBody.virtual_machine_name2 + ".json");
              }).then((data) => {
                console.log("mountpoint cluster 22222 ");
                console.log(data);
              }).catch((err) => {
                console.log("mountpoint cluster 33333 ");
                console.log(err.message, 'catch error');
              });
            } catch (e) {
              console.log("mountpoint cluster 44444 ");
              console.log(e.errmsg)
            }
          } else {
            console.log("mountpoint cluster 555555 ");
            console.log("file not found");
          }
        } catch (err) {
          console.log("mountpoint cluster 666666 ");
          console.error(err)
        }
      }
    }

    if (reqBody.db_full_backup) {
      params.db_full_backup = reqBody.db_full_backup;
    }
    if (reqBody.db_log_backup) {
      params.db_log_backup = reqBody.db_log_backup;
    }
    if (reqBody.db_backup) {
      params.db_backup = reqBody.db_backup;
    }
    params.db_backup2 = ((reqBody.db_backup2) ? reqBody.db_backup2 : "null");
    let azure_tags = {
      "Provisioned_By": "UCP",
      "Cloud_service": "Managed IaaS",
      "Business_service": reqBody.cmdbService.split("@$")[0],
      "Backup-Vault-Policy": reqBody.backup_policy,
      "s_Veritas_Netbackup": "200000012745",
      "s_splunk": "200000013000"
    };

    let OS_License_Type = "";
    if (reqBody.shared_image_tags
      && Object.keys(reqBody.shared_image_tags).length > 0 && reqBody.shared_image_tags["UCP-OS-License-Type"]) {
      let shared_image_tags_keys = Object.keys(reqBody.shared_image_tags);

      if (reqBody.recovery_vault_name_tags
        && Object.keys(reqBody.recovery_vault_name_tags).length > 0) {
        if (!params.db_full_backup && reqBody.shared_image_tags['UCP-DB-Type'] && reqBody.recovery_vault_name_tags["UCP-" + reqBody.shared_image_tags['UCP-DB-Type'] + "-Full-" + reqBody.backup_policy]) {
          params.db_full_backup = reqBody.recovery_vault_name_tags["UCP-" + reqBody.shared_image_tags['UCP-DB-Type'] + "-Full-" + reqBody.backup_policy];
        }
        if (!params.db_log_backup && reqBody.shared_image_tags['UCP-DB-Type'] && reqBody.recovery_vault_name_tags["UCP-" + reqBody.shared_image_tags['UCP-DB-Type'] + "-Log-" + reqBody.backup_policy]) {
          params.db_log_backup = reqBody.recovery_vault_name_tags["UCP-" + reqBody.shared_image_tags['UCP-DB-Type'] + "-Log-" + reqBody.backup_policy];
        }
        if (!params.db_backup && reqBody.shared_image_tags['UCP-DB-Type'] && reqBody.recovery_vault_name_tags["UCP-" + reqBody.shared_image_tags['UCP-DB-Type'] + "-" + reqBody.backup_policy]) {
          params.db_backup = reqBody.recovery_vault_name_tags["UCP-" + reqBody.shared_image_tags['UCP-DB-Type'] + "-" + reqBody.backup_policy];
        }
      }

      OS_License_Type = reqBody.shared_image_tags["UCP-OS-License-Type"].split("@$");
      if (reqBody.environment == 'Test') {
        for await (tag_key of shared_image_tags_keys) {
          if (tag_key.indexOf("UCP-Test-" + OS_License_Type[0]) >= 0) {
            let tagInfo = reqBody.shared_image_tags[tag_key].split("@$");
            if (tagInfo.length == 2) {
              azure_tags[tagInfo[0]] = tagInfo[1];
            }
          }
        }
      } else if (reqBody.environment == 'Production') {
        for await (tag_key of shared_image_tags_keys) {
          if (tag_key.indexOf("UCP-Prod-" + OS_License_Type[0]) >= 0) {
            let tagInfo = reqBody.shared_image_tags[tag_key].split("@$");
            if (tagInfo.length == 2) {
              azure_tags[tagInfo[0]] = tagInfo[1];
            }
          }
        }
      }
    }
    console.log("azure_tags ----- ", azure_tags);
    params.azure_tags = JSON.stringify(azure_tags);
    params.license_type = ((OS_License_Type.length > 0) ? OS_License_Type[OS_License_Type.length - 1] : "");

    let cyberark_usernames = {};
    if (reqBody.os_type == 'Linux') {
      if (reqBody.shared_image_tags
        && reqBody.shared_image_tags['UCP-CyberArkSafe-Global-Prod']) {
        cyberark_usernames['UCP-CyberArkSafe-Global-Prod'] = reqBody.shared_image_tags['UCP-CyberArkSafe-Global-Prod'];
      }
      if (reqBody.shared_image_tags
        && reqBody.shared_image_tags['UCP-CyberArkSafe-App-Prod']) {
        cyberark_usernames['UCP-CyberArkSafe-App-Prod'] = reqBody.shared_image_tags['UCP-CyberArkSafe-App-Prod'];
      }
      if (reqBody.shared_image_tags && reqBody.shared_image_tags['UCP-CyberArkSafe-TEMP']
        && reqBody.cyberark_region) {
        let tempCyberarkUsers = reqBody.shared_image_tags['UCP-CyberArkSafe-TEMP'].split("::");
        let tempCyberarkUserArr = [];
        for await (const tempCyberarkUser of tempCyberarkUsers) {
          tempCyberarkUserArr.push(tempCyberarkUser + "_" + reqBody.cyberark_region + "_" + reqBody.deployment_resource_group_name.substr(-12))
        }
        cyberark_usernames['UCP-CyberArkSafe-TEMP'] = tempCyberarkUserArr.join("::");
      }
      //	    	if(reqBody.shared_image_tags 
      //	        		&& reqBody.shared_image_tags['UCP-CyberArkSafe-RTP-Prod']){
      //	    		cyberark_usernames['UCP-CyberArkSafe-RTP-Prod'] = reqBody.shared_image_tags['UCP-CyberArkSafe-RTP-Prod'];
      //	    	}
      //    	}else{
      //	    	if(reqBody.shared_image_tags 
      //	        		&& reqBody.shared_image_tags['UCP-CyberArkSafe-Admin']){
      //	    		cyberark_usernames['UCP-CyberArkSafe-Admin'] = reqBody.shared_image_tags['UCP-CyberArkSafe-Admin'];
      //	    	}
      //	    	if(reqBody.shared_image_tags 
      //	        		&& reqBody.shared_image_tags['UCP-CyberArkSafe-App']){
      //	    		cyberark_usernames['UCP-CyberArkSafe-App'] = reqBody.shared_image_tags['UCP-CyberArkSafe-App'];
      //	    	}
      //    	}
    }
    params.requested_domain = config.API_URL;
    params.cyberark_usernames = JSON.stringify(cyberark_usernames);
    //    console.log("params.cyberark_usernames --- ", params.cyberark_usernames);
    if (typeof reqBody.weblogicServiceName != 'undefined') {
      params.weblogic_servicename = reqBody.weblogicServiceName;
    }
    if (typeof reqBody.weblogicManagedServers != 'undefined') {
      params.weblogic_managed_servers = reqBody.weblogicManagedServers;
    } else {
      params.weblogic_managed_servers = 0;
    }
    if (reqBody.shared_image_version_tags
      && reqBody.shared_image_version_tags['UCP-Weblogic-Version']) {
      params.weblogic_version = reqBody.shared_image_version_tags['UCP-Weblogic-Version'];
    } else {
      params.weblogic_version = "";
    }
    if (typeof reqBody.weblogicUsername != 'undefined') {
      params.weblogic_username = reqBody.weblogicUsername;
    }
    if (typeof reqBody.weblogicPassword != 'undefined') {
      params.weblogic_password = reqBody.weblogicPassword;
    }

    params.disk_encryption_name = '';
    params.disk_encryption_resource_group_name = "";
    if (reqBody.cmdbBuUnit && reqBody.cmdbBuUnit != '') {
      sql = `select resource_group, disk_encryption_set_name from azure_disks_encryption 
    	where subscription_id = '${reqBody.subscription_id}' 
    	and location = '${reqBody.selected_network_location_name}'
    	and business_unit = '${reqBody.cmdbBuUnit}'
    	and azure_ucp_status != 'Deprecated'
    	and record_status = 1 
    	limit 1`;
      console.log(sql);
      await new Promise(async function (resolve1, reject1) {
        db.query(sql, async function (error, rows, fields) {
          dbFunc.connectionRelease;
          if (!!error) {
            console.log(error);
            resolve1("");
          } else {
            if (rows.length > 0) {
              console.log("rows -- ", rows);
              params.disk_encryption_resource_group_name = rows[0].resource_group;
              params.disk_encryption_name = rows[0].disk_encryption_set_name;
              resolve1("");
            } else {
              resolve1("");
            }
          }
        });
      });
    }

    console.log("params --- ", params);

    if (jenkins_job_type == 1) {
      await dbHandler.updateTableData('c4_vm_creation', { id: reqBody.request_ref__id },
        {
          jenkins_request_obj: JSON.stringify(params),
          job_name: JOBNAME
        }, async function (err, result) {
          console.log("c4_vm_creation data updated");
        });
    } else if (jenkins_job_type == 2) {
      await dbHandler.updateTableData('c4_vm_decommission_requests', { id: reqBody.request_ref__id },
        {
          jenkins_request_obj: JSON.stringify(params),
          job_name: JOBNAME
        }, async function (err, result) {
          console.log("c4_vm_decommission_requests data updated");
        });
    }

    //    return callback([],{success:1,message:'Input parameters', params : params});

    var result = await buildWithParams(params, USERNAME, TOKEN, URL, JOBNAME);
    result = result ? result : {};
    result.success = result.success ? result.success : 0;
    result.message = result.message ? result.message : 'Failed on calling jenkins build.';
    console.log("result.response = ", result.response);
    if (result.success && display_job_name) {
      result.message += ` - ${display_job_name}`;
    }
    return callback([], { success: result.success, message: result.message, params_str: result.params_str });

  } catch (err) {
    console.log("Caught Error - ", err);
    return callback([], { success: 0, message: 'Failed on calling jenkins build.' });
  }
};

let syncVmBackupStatus = (reqObj) => {
  console.log("reqObj ---- ", reqObj);
  let sql = `Select s.subscription_id, s.clientid, c.azure_tenantid, 
		    c.azure_clientid, c.azure_clientsecretkey, 
		    c.azure_resource, c.azure_granttype, ar.name as recource_group_name
		    from c4_azure_subscriptions as s
		    inner join c4_clients as c on c.id = s.clientid
		    inner join c4_azure_subscription_locations as asl on (asl.clientid = s.clientid and asl.subscription_id = s.subscription_id)
		    inner join c4_azure_resourcegroups as ar on ar.location_id = asl.id
		    where c.status = 1 and c.azure_linked = 1 and s.state='Enabled' and s.record_status = 1 and s.is_visible_to_frontend = 1  and ar.record_status=1 `;
  if (typeof reqObj.recource_group_name != 'undefined') {
    sql += ` and ar.name = '${reqObj.recource_group_name}' `;
  }
  if (typeof reqObj.clientid != 'undefined') {
    sql += ` and s.clientid = '${reqObj.clientid}' order by s.id desc`;
  } else {
    sql += ` order by s.id desc`;
  }
  // sql += ' limit 1';
  console.log("syncVmBackupStatus sql ----- ", sql);

  dbHandler.executeQuery(sql, async function (resourceList) {
    for await (var resource of resourceList) {
      // for(var i=0;i<resourceList.length;i++){
      await new Promise(async function (resolve1, reject1) {
        // var resource=resourceList[i]
        var clientid = resource.clientid;
        var subscriptionId = resource.subscription_id;
        var recource_group_name = resource.recource_group_name;
        await new Promise(function (resolve2, reject2) {
          azure_authtoken(clientid, function (error, result) {
            if (error) {
              return resolve2([])
            }
            return resolve2(result)
          })
        }).then(function (token) {
          if (!token) {
            resolve1('Continue');
          }

          var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${recource_group_name}/providers/Microsoft.RecoveryServices/vaults?api-version=2016-06-01`;
          ////console.log(url)
          request.get({
            url: url, headers: {
              "Authorization": 'Bearer ' + token.tokendata.access_token,
              'Content-type': 'application/json'
            }
          },
            async function optionalCallback(err, httpResponse, result) {
              if (err) {
                console.log([], { status: "error", message: 'The operation did not execute as expected. Please raise a ticket to support', data: err });
                resolve1('Continue');
              } else {
                var backupVaults = JSON.parse(result);
                console.log(backupVaults)
                if (backupVaults.error) {
                  console.log(null, { status: "error", message: ((backupVaults.error.message) ? backupVaults.error.message : 'The operation did not execute as expected. Please raise a ticket to support'), data: backupVaults })
                  resolve1('Continue');
                } else {
                  console.log(null, { status: "success", message: 'Azure VM Backup List.', data: JSON.stringify(backupVaults) });
                  if (backupVaults && backupVaults && backupVaults.value && backupVaults.value.length > 0) {
                    for await (var backup of backupVaults.value) {
                      await new Promise(async function (backupResolve, backupReject) {
                        var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${recource_group_name}/providers/Microsoft.RecoveryServices/vaults/${backup.name}/backupProtectedItems?api-version=2021-02-10`;
                        request.get({
                          url: url, headers: {
                            "Authorization": 'Bearer ' + token.tokendata.access_token
                          }
                        },
                          async function optionalCallback(err, httpResponse, result) {
                            if (err) {
                              console.log("backupResolve Continue1");
                              backupResolve('Continue');
                            } else {
                              if (typeof result != 'undefined')
                                var backupInfo = JSON.parse(result);
                              else
                                var backupInfo = [];
                              if (typeof backupInfo.value != 'undefined') {
                                console.log("backupInfo.value");
                                console.log(backupInfo.value);
                                for await (var vmBackup of backupInfo.value) {
                                  console.log("vmBackup ---- ", JSON.stringify(vmBackup));
                                  let vm_rg_group = ((vmBackup.properties && vmBackup.properties.virtualMachineId) ? vmBackup.properties.virtualMachineId.split("/")[4] : "");
                                  if (vm_rg_group != '') {
                                    await new Promise(async function (vmBackupResolve, vmBackupReject) {
                                      dbHandler.updateTableData('azure_vms', { clientid: clientid, subscriptionId: subscriptionId, resourceGroup: vm_rg_group, name: vmBackup.properties.friendlyName }, { backup_details: JSON.stringify(vmBackup) }, function (err, result) {
                                        console.log("err ---- ", err);
                                        console.log("vmBackupResolve updated");
                                        vmBackupResolve('updated');
                                      })
                                    });
                                  } else {
                                    vmBackupResolve('vm_rg_group not found');
                                  }
                                }
                                console.log("backupResolve updated");
                                backupResolve('updated');
                              } else {
                                console.log("backupResolve Continue2");
                                backupResolve('Continue');
                              }
                            }
                          });
                      });
                    }
                    console.log("resolve1 Continue1");
                    resolve1('Continue');
                  } else {
                    console.log("resolve1 Continue2");
                    resolve1('Continue');
                  }
                }
              }
            });
        })
      })
    }
  })
}

let syncVmsInCmdb = async (reqObj) => {
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
    return;
  }

  let log_file_name = "syncVmsInCmdb_" + helper.getRandomNumber() + ".txt";
  helper.logDataToFile(log_file_name, "");

  let plannedStartDate = await new Promise(async function (dateResolve, dateReject) {
    helper.getNextBusinessDayFromGivenDate(dateFormat(new Date(), "dd-mmm-yyyy"), 9, function (err, result) {
      dateResolve(dateFormat(result, "dd-mmm-yyyy"));
    });
  });
  //	console.log("plannedStartDate --- ",plannedStartDate);

  let plannedEndDate = await new Promise(async function (dateResolve, dateReject) {
    helper.getNextBusinessDayFromGivenDate(dateFormat(plannedStartDate, "dd-mmm-yyyy"), 2, function (err, result) {
      dateResolve(dateFormat(result, "dd-mmm-yyyy"));
    });
  });
  //	console.log("plannedEndDate --- ",plannedEndDate);

  plannedStartDate = dateFormat(plannedStartDate, "yyyy-mm-dd") + " " + dateFormat(new Date(), "HH:MM:ss");
  plannedEndDate = dateFormat(plannedEndDate, "yyyy-mm-dd") + " " + dateFormat(new Date(), "HH:MM:ss");
  console.log("plannedStartDate --- ", plannedStartDate);
  helper.logDataToFile(log_file_name, "plannedStartDate --- " + plannedStartDate);
  console.log("plannedEndDate --- ", plannedEndDate);
  helper.logDataToFile(log_file_name, "plannedEndDate --- " + plannedEndDate);

  let oat_work_end = await new Promise(async function (dateResolve, dateReject) {
    helper.getNextBusinessDayFromGivenDate(dateFormat(new Date(), "dd-mmm-yyyy"), 4, function (err, result) {
      dateResolve(dateFormat(result, "dd-mmm-yyyy"));
    });
  });
  oat_work_end = dateFormat(oat_work_end, "yyyy-mm-dd") + " " + dateFormat(new Date(), "HH:MM:ss");
  console.log("oat_work_end --- ", oat_work_end);
  helper.logDataToFile(log_file_name, "oat_work_end --- " + oat_work_end);

  let impl_work_date = new Date(plannedEndDate);
  let impl_work_start = new Date(impl_work_date);
  impl_work_start.setMinutes(impl_work_date.getMinutes() - 30);
  impl_work_start = dateFormat(impl_work_start, "yyyy-mm-dd HH:MM:ss")
  console.log("impl_work_start --- ", impl_work_start);
  helper.logDataToFile(log_file_name, "impl_work_start --- " + impl_work_start);
  helper.logDataToFile(log_file_name, reqObj);

  //	return;

  // console.log(reqObj);
  let sql = `select vd.*, av.subscriptionId, av.resourceGroup, 
		  av.virtualNetwork, av.networkInterface, av.location,
		  av.vmSize, cu.email as vm_created_email, 
		  av.privateIpAddress, av.publicIpAddress, av.osType, 
		  av.search_code, av.extra_info, av.osName, av.osVersion,
		  vc.jenkins_response_obj,
		  od.order_id
		  from c4_vm_details as vd
		  inner join azure_vms as av on av.vm_detail_id = vd.id
		  inner join c4_order_details as od on od.id = vd.order_details_id
		  left join c4_vm_creation as vc on vc.order_details_id = vd.order_details_id
		  inner join c4_client_users as cu on cu.id = vd.createdby
		  where vd.status = 1 and vd.is_in_cmdb = 'no' and vd.vm_status='Running' `;
  if (typeof reqObj.recource_group_name != 'undefined') {
    sql += ` and av.resourceGroup = '${reqObj.recource_group_name}' `;
  }
  if (typeof reqObj.id != 'undefined') {
    sql += ` and vd.id = '${reqObj.id}' `;
  }
  if (typeof reqObj.order_details_id != 'undefined') {
    sql += ` and vd.order_details_id = '${reqObj.order_details_id}' `;
  }
  if (typeof reqObj.clientid != 'undefined') {
    sql += ` and vd.clientid = '${reqObj.clientid}' order by vd.id desc`;
  } else {
    sql += ` order by vd.id desc`;
  }
  // sql += ' limit 1';
  console.log(sql);
  helper.logDataToFile(log_file_name, sql);

  dbHandler.executeQuery(sql, async function (vmList) {
    Azure_Regions = await new Promise(async function (innerResolve, innerReject) {
      let sql = `select option_key, option_value
  	        from c4_option_config
  	        where  option_type = 'Azure_Region' and status = 1`;
      console.log(sql);
      helper.logDataToFile(log_file_name, sql);
      db.query(sql, async function (error, items, fields) {
        dbFunc.connectionRelease;
        if (!!error) {
          console.log(error);
          helper.logDataToFile(log_file_name, error);
          innerResolve([]);
        } else {
          console.log(items);
          helper.logDataToFile(log_file_name, items);
          console.log(JSON.parse(items[0].option_value));
          innerResolve(JSON.parse(items[0].option_value));
        }
      });
    });
    console.log("Azure_Regions -- ", JSON.stringify(Azure_Regions));
    helper.logDataToFile(log_file_name, "Azure_Regions -- " + JSON.stringify(Azure_Regions));
    console.log("vmList -- ", JSON.stringify(vmList));
    helper.logDataToFile(log_file_name, "vmList -- " + JSON.stringify(vmList));
    for await (var vm of vmList) {
      await new Promise(async function (resolve, reject) {
        vm.vm_creation_request_obj = ((vm.vm_creation_request_obj) ? JSON.parse(vm.vm_creation_request_obj) : {});
        vm.jenkins_response_obj = ((vm.jenkins_response_obj) ? JSON.parse(vm.jenkins_response_obj) : "");
        let u_comments = "Requested Approved by : " + vm.vm_created_email + "\n" +
          "Request approved date :" + dateFormat(new Date(), "yyyy-mm-dd") + "\n" +
          "URI : UCP VM URL" + config.FRONTEND_URL + "azurevmdetail?id=" + vm.subscriptionId + "&name=" + vm.host_name.toUpperCase() + "\n" +
          "Request id : Build #" + ((vm.jenkins_response_obj && vm.jenkins_response_obj.item && vm.jenkins_response_obj.item.id) ? vm.jenkins_response_obj.item.id : "") + "\n" +
          "Info - UCP - > Manage -> VM List ->Select Related Subscription";
        console.log("u_comments --- ", u_comments);
        //    		return resolve("");
        let selected_region = '';

        for await (var region of Azure_Regions) {
          if (region.key == vm.vm_creation_request_obj.region) {
            selected_region = region.value;
          }
        }

        let u_network_name = vm.host_name.toLowerCase()
        sql = `select dns_name from azure_reusing_hostnames 
        	where host_name = '${vm.host_name}' 
        	limit 1`;
        console.log(sql);
        await new Promise(async function (resolve1, reject1) {
          db.query(sql, async function (error, rows, fields) {
            dbFunc.connectionRelease;
            if (!!error) {
              console.log(error);
              resolve1("");
            } else {
              if (rows.length > 0) {
                console.log("rows -- ", rows)
                u_network_name = rows[0].dns_name;
                resolve1("");
              } else {
                resolve1("");
              }
            }
          });
        });
        console.log("u_network_name ------------------------------------------ ", u_network_name);

        let basicAuth = base64.encode(`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME}:${UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD}`);
        let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/sys_user?sysparm_query=u_upn=${vm.vm_created_email}`;

        console.log("url --- ", url);
        helper.logDataToFile(log_file_name, "url -- " + url);
        console.log(`Basic ${basicAuth}`);
        request.get({
          url: url, headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
          }
        },
          async function optionalCallback(err, httpResponse, result) {
            if (err) {//0 && 
              console.log("err -- ", JSON.stringify(err));
              helper.logDataToFile(log_file_name, "err -- " + ((typeof err == 'object') ? JSON.stringify(err) : err));
              console.log("final syncVmsInCmdb resolve -- " + vm.host_name);
              console.log("----------------------------------------------------------------------------------");
              resolve('Continue');
            } else {
              console.log("result -- ", JSON.stringify(result));
              helper.logDataToFile(log_file_name, "result -- " + JSON.stringify(result));
              if (typeof result != 'undefined') {
                var body = JSON.parse(result);
              } else {
                var body = [];
              }
              let cmdb_ci_sys_id = '';
              console.log("body -- ", JSON.stringify(body));
              helper.logDataToFile(log_file_name, "body -- " + JSON.stringify(body));
              if (body.result && body.result.length > 0) {//1 || 

                var promise_u_excel_dhl_hw_server_upload = await new Promise(function (resolve1, reject1) {
                  let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_excel_dhl_hw_server_upload`;
                  console.log("url --- ", url);
                  helper.logDataToFile(log_file_name, "url -- " + url);
                  let cost_code_arr = { "EA": "DCZISX", "AP": "DMYXIS", "AM": "DSYXXX" };
                  let options = {
                    "u_environment": vm.vm_creation_request_obj.environment,
                    "u_accountable_bu": ((vm.vm_creation_request_obj.cmdbBuUnit) ? vm.vm_creation_request_obj.cmdbBuUnit : ""),
                    "u_service": ((vm.vm_creation_request_obj.cmdbService) ? vm.vm_creation_request_obj.cmdbService.split("@$")[0] : ""),
                    "u_support_type": "Public Cloud",
                    "u_maintenance_contract": "ITS N/A",
                    "u_hw_sla": "N/A",
                    "u_backup": ((vm.vm_creation_request_obj.environment == "Test") ? "No Backup" : "Gold"),
                    "u_backup_tier_2": ((vm.vm_creation_request_obj.environment == "Test") ? "No Backup" : "Gold"),
                    "u_reboot_instruction": "S",
                    "u_folder": UCP_CONSTANTS_DATA.CMDB.CMDB_API_FOLDER,//((body.result && body.result[0])?body.result[0].u_folder:""),
                    "u_owner_person": ((body.result && body.result[0]) ? body.result[0].u_cn : ""),
                    "u_network_name": u_network_name,//vm.host_name.toLowerCase(),//vm.networkInterface, // <vmname in lowercase>.prg-dc.dhl.com
                    "u_model": "Azure " + vm.vmSize,
                    "u_description": "Managed Azure VM - " + ((env.env == 'dhluatonprem') ? "STAGING - " : "") + vm.host_name.toUpperCase(),
                    "u_synchronize_from_service": true,
                    "u_category": "Virtual Server " + vm.osType,
                    "u_location": vm.vm_creation_request_obj.region.split("_")[1] + "-" + selected_region + " Azure Cloud", // EA Europe
                    "u_ip_address_1": vm.privateIpAddress,//vm.publicIpAddress,
                    "u_memory_installed": (vm.ram_units_gb * 1024),
                    "u_cpu_cores": vm.cpu_units,
                    "u_active": true,
                    "u_synchronize_from_folder": true,
                    "u_operatred_by_3rd_party": true,
                    "u_status": ((vm.vm_creation_request_obj.environment == "Test") ? "In Test" : "In Build"),
                    "u_class": "Server",
                    "u_cost_code": cost_code_arr[vm.vm_creation_request_obj.region.split("_")[1]], //DCZISX – EA, DMYXIS – AP, DSYXXX – AM
                    "u_administrator_group": "SPCS-Cloud-Ops.IaaS",
                    "u_name": vm.host_name.toUpperCase(),
                    "u_os_build_version": ((vm.vm_creation_request_obj.shared_image_tags && vm.vm_creation_request_obj.shared_image_tags["UCP-CMDB-OS"]) ? vm.vm_creation_request_obj.shared_image_tags["UCP-CMDB-OS"] : ""),//((vm.osName && vm.osName != '')?vm.osName+" "+vm.osVersion:vm.vm_creation_request_obj.shared_image_name),
                    "u_operations_support_level": ((vm.vm_creation_request_obj.environment == "Test") ? "Bronze" : "Gold"),
                    "u_order_number": "",
                    "u_search_code": vm.search_code,
                    "comments": u_comments,
                    "u_remark": u_comments,
                    "u_charging_type": "",//"Azure Managed VM"
                  };
                  console.log("u_excel_dhl_hw_server_upload request", JSON.stringify(options));
                  helper.logDataToFile(log_file_name, "u_excel_dhl_hw_server_upload request -- " + JSON.stringify(options));

                  let request_options = {
                    'method': 'POST',
                    'url': url,
                    'headers': {
                      'Content-Type': 'application/json',
                      'Authorization': `Basic ${basicAuth}`,
                    },
                    body: JSON.stringify(options)

                  };

                  console.log("u_excel_dhl_hw_server_upload request_options -- ", JSON.stringify(request_options));
                  helper.logDataToFile(log_file_name, "u_excel_dhl_hw_server_upload request_options -- " + JSON.stringify(request_options));
                  request(request_options, function (error, response) {
                    console.log("error -- ", JSON.stringify(error));
                    helper.logDataToFile(log_file_name, "error -- " + JSON.stringify(error));
                    console.log("response.body -- ", JSON.stringify(response));
                    helper.logDataToFile(log_file_name, "response -- " + JSON.stringify(response));
                    if (error) {
                      //throw new Error(error);
                      console.log("error -- ", JSON.stringify(error));
                      helper.logDataToFile(log_file_name, "error -- " + ((typeof error == 'object') ? JSON.stringify(error) : error));
                      resolve1("The operation did not execute as expected. Please raise a ticket to support");
                    } else {
                      //            		    	  console.log("response.body -- ", JSON.stringify(response.body));
                      result = JSON.parse(response.body);
                      if (result) {
                        console.log("cchm_change_request_createSOAP result ---- ", result);
                        helper.logDataToFile(log_file_name, "cchm_change_request_createSOAP result -- " + ((typeof result == 'object') ? JSON.stringify(result) : result));

                        let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_dhl_ci_hw_server?sysparm_query=u_search_code=${vm.search_code}`;

                        console.log("url --- ", url);
                        helper.logDataToFile(log_file_name, "url -- " + url);
                        console.log(`Basic ${basicAuth}`);
                        helper.logDataToFile(log_file_name, `Basic ${basicAuth}`);
                        request.get({
                          url: url, headers: {
                            'Authorization': `Basic ${basicAuth}`,
                            'Content-Type': 'application/json',
                          }
                        },
                          async function optionalCallback(err, httpResponse, searchResult) {
                            if (err) {//0 && 
                              console.log("err -- ", JSON.stringify(err));
                              console.log("resolve searchResult -- " + vm.host_name);
                              console.log("----------------------------------------------------------------------------------");
                              resolve(result);
                            } else {
                              console.log("searchResult -- ", JSON.stringify(searchResult));
                              if (typeof searchResult != 'undefined') {
                                var searchBody = JSON.parse(searchResult);
                              } else {
                                var searchBody = [];
                              }
                              console.log("searchBody -- ", JSON.stringify(searchBody));
                              if (searchBody.result && searchBody.result.length > 0) {//1 || 

                                cmdb_ci_sys_id = ((searchBody.result[0].sys_id) ? searchBody.result[0].sys_id : "");
                                let updateData = {
                                  cmdb_ci_number: ((searchBody.result[0].u_number) ? searchBody.result[0].u_number : ""),
                                  cmdb_ci_sys_id: ((searchBody.result[0].sys_id) ? searchBody.result[0].sys_id : ""),
                                };
                                await dbHandler.updateTableData('c4_vm_details', { 'id': vm.id }, updateData, function (err, updateResult) {
                                  console.log(err);
                                });
                                resolve1(result);


                              } else {
                                resolve1(result);
                              }
                            }
                          });
                      } else {
                        console.log("response.body -- ", JSON.stringify(response.body));
                        resolve1("The operation did not execute as expected. Please raise a ticket to support");
                      }
                    }
                  });
                });

                var promise_u_excel_dhl_ci_rel_bs_upload = await new Promise(function (resolve1, reject1) {
                  let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_excel_dhl_ci_rel_bs_upload`;
                  console.log("url --- ", url);
                  let options = {
                    "u_bs_name": ((vm.vm_creation_request_obj.cmdbService) ? vm.vm_creation_request_obj.cmdbService.split("@$")[0] : ""),//"AZURE MANAGED VM",
                    "u_ci_search_code": vm.search_code,
                    "u_relation_type": "Depends on(Parent)::Used by(Child)"
                  };
                  console.log("u_excel_dhl_ci_rel_bs_upload request", JSON.stringify(options));

                  let request_options = {
                    'method': 'POST',
                    'url': url,
                    'headers': {
                      'Content-Type': 'application/json',
                      'Authorization': `Basic ${basicAuth}`,
                    },
                    body: JSON.stringify(options)
                  };
                  request(request_options, function (error, response) {
                    console.log("error -- ", JSON.stringify(error));
                    console.log("response.body -- ", JSON.stringify(response));
                    if (error) {
                      //throw new Error(error);
                      console.log("error -- ", JSON.stringify(error));
                      resolve1("The operation did not execute as expected. Please raise a ticket to support");
                    } else {
                      //            		    	  console.log("response.body -- ", JSON.stringify(response.body));
                      result = JSON.parse(response.body);
                      if (result) {
                        resolve1(result);
                      } else {
                        console.log("response.body -- ", JSON.stringify(response.body));
                        resolve1("The operation did not execute as expected. Please raise a ticket to support");
                      }
                    }
                  });
                });

                if (vm.vm_creation_request_obj.shared_image_tags && vm.vm_creation_request_obj.shared_image_version_tags
                  && vm.vm_creation_request_obj.shared_image_tags["UCP-DB-Type"]
                  && vm.vm_creation_request_obj.shared_image_tags["UCP-DB-Type"] != ''
                  && vm.vm_creation_request_obj.shared_image_tags["UCP-DB-Type"] != 'NA') {
                  let dbName = ((vm.vm_creation_request_obj.dbName) ? vm.vm_creation_request_obj.dbName : "Default");
                  let DB_Search_code = vm.vm_creation_request_obj.region.split("_")[1] + "-" + ((vm.vm_creation_request_obj.shared_image_tags["UCP-DB-Type"] == "Oracle") ? "DBOR" : "DBSQ") + "-" + vm.host_name.toUpperCase() + "-" + dbName;
                  var promise_u_excel_dhl_hw_upload = await new Promise(function (resolve1, reject1) {
                    let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_excel_dhl_hw_upload`;
                    console.log("url --- ", url);
                    let options = {
                      "u_location": vm.vm_creation_request_obj.region.split("_")[1] + "-" + selected_region + " Azure Cloud",
                      "u_status": ((vm.vm_creation_request_obj.environment == "Test") ? "In Test" : "In Build"),
                      "u_class": "Database",//vm.vm_creation_request_obj.system_type,
                      "u_model": ((vm.vm_creation_request_obj.shared_image_version_tags["UCP-CMDB-DB-MODEL"]) ? vm.vm_creation_request_obj.shared_image_version_tags["UCP-CMDB-DB-MODEL"] : ""),
                      "u_name": vm.host_name.toUpperCase() + "-" + dbName, //if DB need to get separate tag which is not yet defined
                      "u_folder": UCP_CONSTANTS_DATA.CMDB.CMDB_API_FOLDER,//((body.result && body.result[0])?body.result[0].u_folder:""),
                      "u_description": "Cloud DB " + vm.host_name.toUpperCase() + "-" + dbName,
                      "u_search_code": DB_Search_code,
                      "u_category": ((vm.vm_creation_request_obj.shared_image_tags["UCP-DB-Type"] == "Oracle") ? "Oracle DB" : "MS SQL"),
                      "u_environment": vm.vm_creation_request_obj.environment,
                      "u_active": true
                    };
                    console.log("u_excel_dhl_hw_upload request", JSON.stringify(options));

                    let request_options = {
                      'method': 'POST',
                      'url': url,
                      'headers': {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${basicAuth}`,
                      },
                      body: JSON.stringify(options)
                    };
                    request(request_options, function (error, response) {
                      console.log("error -- ", JSON.stringify(error));
                      console.log("response.body -- ", JSON.stringify(response));
                      if (error) {
                        //throw new Error(error);
                        console.log("error -- ", JSON.stringify(error));
                        resolve1("The operation did not execute as expected. Please raise a ticket to support");
                      } else {
                        //            		    	  console.log("response.body -- ", JSON.stringify(response.body));
                        result = JSON.parse(response.body);
                        if (result) {
                          let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_dhl_ci_hw?sysparm_query=u_search_code=${DB_Search_code}`;

                          console.log("url --- ", url);
                          console.log(`Basic ${basicAuth}`);
                          request.get({
                            url: url, headers: {
                              'Authorization': `Basic ${basicAuth}`,
                              'Content-Type': 'application/json',
                            }
                          },
                            async function optionalCallback(err, httpResponse, dbSearchResult) {
                              if (err) {//0 && 
                                console.log("err -- ", JSON.stringify(err));
                                console.log("resolve dbSearchResult -- " + vm.host_name);
                                console.log("----------------------------------------------------------------------------------");
                                resolve(dbSearchResult);
                              } else {
                                console.log("dbSearchResult -- ", JSON.stringify(dbSearchResult));
                                if (typeof dbSearchResult != 'undefined') {
                                  var dbSearchBody = JSON.parse(dbSearchResult);
                                } else {
                                  var dbSearchBody = [];
                                }
                                console.log("dbSearchBody -- ", JSON.stringify(dbSearchBody));
                                if (dbSearchBody.result && dbSearchBody.result.length > 0) {//1 || 
                                  let updateData = {
                                    cmdb_db_ci_number: ((dbSearchBody.result[0].u_number) ? dbSearchBody.result[0].u_number : ""),
                                    cmdb_db_sys_id: ((dbSearchBody.result[0].sys_id) ? dbSearchBody.result[0].sys_id : ""),
                                    cmdb_db_search_code: DB_Search_code,
                                  };
                                  await dbHandler.updateTableData('c4_vm_details', { 'id': vm.id }, updateData, function (err, updateResult) {
                                    console.log(err);
                                  });
                                  resolve1(dbSearchResult);
                                } else {
                                  let updateData = {
                                    cmdb_db_search_code: DB_Search_code,
                                  };
                                  await dbHandler.updateTableData('c4_vm_details', { 'id': vm.id }, updateData, function (err, updateResult) {
                                    console.log(err);
                                  });
                                  resolve1(dbSearchResult);
                                }
                              }
                            });
                        } else {
                          console.log("response.body -- ", JSON.stringify(response.body));
                          resolve1("The operation did not execute as expected. Please raise a ticket to support");
                        }
                      }
                    });
                  });

                  var promise_u_excel_dhl_ci_rel_ci_upload = await new Promise(function (resolve1, reject1) {
                    let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_excel_dhl_ci_rel_ci_upload`;
                    console.log("url --- ", url);
                    let options = {
                      "u_ci_search_code_child": vm.search_code,
                      "u_ci_search_code_parent": DB_Search_code,
                      "u_relation_type": "Belongs to(Parent)::Belongs to(Child)"
                    };
                    console.log("u_excel_dhl_ci_rel_ci_upload request", JSON.stringify(options));

                    let request_options = {
                      'method': 'POST',
                      'url': url,
                      'headers': {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${basicAuth}`,
                      },
                      body: JSON.stringify(options)
                    };
                    request(request_options, function (error, response) {
                      console.log("error -- ", JSON.stringify(error));
                      console.log("response.body -- ", JSON.stringify(response));
                      if (error) {
                        //throw new Error(error);
                        console.log("error -- ", JSON.stringify(error));
                        resolve1("The operation did not execute as expected. Please raise a ticket to support");
                      } else {
                        //            		    	  console.log("response.body -- ", JSON.stringify(response.body));
                        result = JSON.parse(response.body);
                        if (result) {
                          resolve1(result);
                        } else {
                          console.log("response.body -- ", JSON.stringify(response.body));
                          resolve1("The operation did not execute as expected. Please raise a ticket to support");
                        }
                      }
                    });
                  });

                  var promise_u_excel_dhl_ci_rel_bs_upload = await new Promise(function (resolve1, reject1) {
                    let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_excel_dhl_ci_rel_bs_upload`;
                    console.log("url --- ", url);
                    let options = {
                      "u_bs_name": ((vm.vm_creation_request_obj.cmdbService) ? vm.vm_creation_request_obj.cmdbService.split("@$")[0] : ""),//"AZURE MANAGED VM",
                      "u_ci_search_code": DB_Search_code,
                      "u_relation_type": "Depends on(Parent)::Used by(Child)"
                    };
                    console.log("u_excel_dhl_ci_rel_bs_upload request", JSON.stringify(options));

                    let request_options = {
                      'method': 'POST',
                      'url': url,
                      'headers': {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${basicAuth}`,
                      },
                      body: JSON.stringify(options)

                    };
                    request(request_options, function (error, response) {
                      console.log("error -- ", JSON.stringify(error));
                      console.log("response.body -- ", JSON.stringify(response));
                      if (error) {
                        //throw new Error(error);
                        console.log("error -- ", JSON.stringify(error));
                        resolve1("The operation did not execute as expected. Please raise a ticket to support");
                      } else {
                        //            		    	  console.log("response.body -- ", JSON.stringify(response.body));
                        result = JSON.parse(response.body);
                        if (result) {
                          resolve1(result);
                        } else {
                          console.log("response.body -- ", JSON.stringify(response.body));
                          resolve1("The operation did not execute as expected. Please raise a ticket to support");
                        }
                      }
                    });
                  });
                }

                if (vm.vm_creation_request_obj.environment != "Test") {
                  let cmdbCountries = "";//((vm.vm_creation_request_obj.cmdbCountry)?vm.vm_creation_request_obj.cmdbCountry.split("@$")[0]:"");//vm.vm_creation_request_obj.region.split("_")[1],
                  let cmdbRegions = "";//((vm.vm_creation_request_obj.cmdbRegion)?vm.vm_creation_request_obj.cmdbRegion.split("@$")[0]:"");//selected_region,
                  let cmdbCountry = vm.vm_creation_request_obj.cmdbCountry;//"AF@$Afghanistan,AL@$Albania";//vm.vm_creation_request_obj.cmdbCountry;
                  let cmdbRegion = vm.vm_creation_request_obj.cmdbRegion;//"AFRICA@$AFRICA,AM@$AM,AMIS@$AMIS";//vm.vm_creation_request_obj.cmdbRegion;
                  if (cmdbCountry) {
                    cmdbCountry = cmdbCountry.split("@^");
                    if (cmdbCountry.length > 0) {
                      for await (var c of cmdbCountry) {
                        if (c.split("@$")[0] != '') {
                          if (cmdbCountries != '') {
                            cmdbCountries += ",";
                          }
                          cmdbCountries += c.split("@$")[0];
                        }
                      }
                    }
                  }
                  if (cmdbRegion) {
                    cmdbRegion = cmdbRegion.split("@^");
                    if (cmdbRegion.length > 0) {
                      for await (var c of cmdbRegion) {
                        if (c.split("@$")[0] != '') {
                          if (cmdbRegions != '') {
                            cmdbRegions += ",";
                          }
                          cmdbRegions += c.split("@$")[0];
                        }
                      }
                    }
                  }
                  console.log("cmdbCountries ---- ", cmdbCountries);
                  console.log("cmdbRegions ---- ", cmdbRegions);

                  let existingRfcData = await new Promise(async function (existingRfcDataResolve, existingRfcDataReject) {
                    let sql = `select vd.cmdb_rfc_number, 
									  od.order_id
									  from c4_vm_details as vd
									  inner join c4_order_details as od on od.id = vd.order_details_id
									  where vd.cmdb_rfc_number is NOT NULL and od.order_id = '${vm.order_id}' and vd.order_details_id != '${vm.order_details_id}' `;
                    console.log(sql);
                    db.query(sql, async function (error, rfcItems, fields) {
                      dbFunc.connectionRelease;
                      if (!!error) {
                        console.log(error);
                        existingRfcDataResolve([]);
                      } else {
                        console.log(rfcItems);
                        if (rfcItems.length > 0) {
                          existingRfcDataResolve(rfcItems);
                        } else {
                          existingRfcDataResolve([]);
                        }
                      }
                    });
                  });
                  console.log("existingRfcData -- ", JSON.stringify(existingRfcData));

                  if (existingRfcData.length > 0) {
                    //For Multiple VMs Spinning use the same RFC number for all group of VMs creaeted
                    var promise_cchm_task_ci_create = await new Promise(function (resolve1, reject1) {
                      let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}cchm_task_ci_create.do?WSDL`;
                      console.log("url --- ", url);
                      let options = {
                        "change_request": existingRfcData[0].cmdb_rfc_number,
                        "ci_item": vm.search_code
                      };
                      console.log("cchm_task_ci_create request", JSON.stringify(options));

                      const soap = require('soap');
                      var auth = "Basic " + new Buffer(UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME + ":" + UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD).toString("base64");
                      const httpOptions = {
                        wsdl_headers: { Authorization: auth }
                      };

                      soap.createClient(url, httpOptions, function (err, client) {
                        // client.setSecurity(new soap.ClientSSLSecurity({strictSSL: false}));
                        if (err) {
                          console.error("soap error:", err);
                          resolve1("");
                        } else {
                          //console.log(JSON.stringify(options));
                          //console.log("client --- ", client.change_request_create.cchm_change_request_createSOAP.insert);

                          client.addHttpHeader('Authorization', auth);
                          client.cchm_task_ci_create.cchm_task_ci_createSOAP.insert(options, httpOptions, async function (err, result) {
                            if (err) {
                              console.log("cchm_task_ci_createSOAP err", err);
                              resolve1("");
                            } else {
                              console.log(result);
                              let updateData = { cmdb_rfc_number: existingRfcData[0].cmdb_rfc_number };
                              await dbHandler.updateTableData('c4_vm_details', { 'id': vm.id }, updateData, function (err, result) {
                                console.log(err);
                              });
                              resolve1(result);
                            }
                          });
                        }
                      });


                      //		          		  	soap.createClient(url, function (err, client) {
                      //			          			 client.setSecurity(new soap.BasicAuthSecurity(UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME, UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD));
                      //			          			 client.execute(options, function (err, result) {
                      //			          				 resolve1(result);
                      //			          			 });
                      //		          			});
                    });
                  } else {
                    var promise_cchm_change_request_create = await new Promise(function (resolve1, reject1) {
                      let options = {
                        "template": "RFC1653146",//"RFC2639220",
                        "short_description": vm.host_name.toUpperCase() + " -  created in Azure " + (vm.vm_creation_request_obj.environment) + " cloud",
                        "u_requested_by": vm.vm_created_email,
                        "assignment_group": "GLOBAL-CHANGE.MANAGEMENT",
                        "assigned_to": "",///----
                        "u_change_coordinator": "SPCS_Delivery_mng@dhl.com",///----
                        "priority": "4",
                        "start_date": plannedStartDate,//dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
                        "end_date": plannedEndDate,//dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                        "u_reason_replanned": "",///----
                        "u_customer_rtp_date": plannedEndDate,
                        "u_environment_ready": dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                        "type": ((vm.vm_creation_request_obj.environment == 'Test') ? "minor" : "significant"),
                        "category": "Hardware",//"Virtual Server "+vm.osType,
                        "u_subcategory": "Build",
                        "u_impacted_environment": "New Hardware",
                        "cmdb_ci": vm.search_code,
                        "u_impacted_service": ((vm.vm_creation_request_obj.cmdbService) ? vm.vm_creation_request_obj.cmdbService.split("@$")[0] : ""),
                        "reason": "enhancement_business_requirement",
                        "u_maintenance_window": "inside",
                        "u_justification": "",///----
                        "impact": ((vm.vm_creation_request_obj.cmdbImpact) ? vm.vm_creation_request_obj.cmdbImpact.split("@$")[0] : ""),
                        "u_countries": cmdbCountries,//((vm.vm_creation_request_obj.cmdbCountry)?vm.vm_creation_request_obj.cmdbCountry.split("@$")[0]:""),//vm.vm_creation_request_obj.region.split("_")[1],
                        "u_regions": cmdbRegions,//((vm.vm_creation_request_obj.cmdbRegion)?vm.vm_creation_request_obj.cmdbRegion.split("@$")[0]:""),//selected_region,
                        "u_impacted_business_unit": ((vm.vm_creation_request_obj.cmdbBuUnit) ? vm.vm_creation_request_obj.cmdbBuUnit : ""),
                        "u_site": "",///----
                        "description": vm.host_name.toUpperCase() + " created in Azure " + (vm.vm_creation_request_obj.environment) + " cloud",
                        "u_change_tested": "Yes",
                        "risk": "4",
                        "u_no_test_reason": (vm.vm_creation_request_obj.environment) + " server in Cloud",
                        "u_implementation_risk": "Automated solution with no risk",
                        "u_skip_risk": "Unsatisfied customer",
                        "u_known_impact": "None",
                        "u_anticipated_impact_on_the_ne": "No",
                        "u_backout_planned": "No",
                        "u_backout_authority": "",///----
                        "u_service_outage_during_backou": "No",
                        "u_trigger_for_backout": "",///----
                        "u_duration_of_backout": "0",
                        "u_no_backout_reason": (vm.vm_creation_request_obj.environment) + " server in Cloud",
                        "u_backout_groups": "",///----
                        "backout_plan": "",///----
                        "u_security_classification": "For Internal Use",
                        "u_security_description": "",///----
                        "u_security_regulation": "No",
                        "u_regulation_details": "",///----
                        "u_data_exchange": "No",
                        "u_data_exchange_details": "",///----
                        "u_requires_firewall": "No",
                        "u_firewall_details": "",///----
                        "u_security_requirements": "",///----
                        "u_security_documentation": "",///----
                        "u_security_review": "",///----
                        "u_security_risks": "",///----
                        "u_appl_interfaces_choice": "No",
                        "u_appl__interfaces_choice": "No",
                        "u_application_interfaces": "",///----
                        "u_security_standard_compliant": "",///----
                        "u_security_standard_details": "",///----
                        "u_deviations_to_global_its": "No",
                        "u_deviations_to_telecoms_infra": "No",
                        "u_sponsor": "",///----
                        "u_spot_quote_number": "Cloud TBA",
                        "u_sap_build_sales_order_number": "Cloud TBA",
                        "u_sap_run_sales_order_number": "Cloud N/A",
                        "u_internal_order_number": "",///----
                        "u_cost_center_no": "",///----
                        "u_planned_cost": "",///----
                        "u_currency": "EUR",
                        "u_build_run_activity": "BUILD",
                        "u_service_name": "",///----
                        "u_service_acronyms": "",///----
                        "u_service_short_description": "",///----
                        "u_used_by_bu": "",///----
                        "u_lead_bu": "",///----
                        "u_buit_owner": "",///----
                        "u_service_account_manager": "",///----
                        "u_service_delivery_manager": "",///----
                        "u_service_owner": "",///----
                        "u_service_type": "",///----
                        "u_support_model": "",///----
                        "u_service_location": "",///----
                        "u_service_provider_location": "",///----
                        "u_service_impact": "",///----
                        "u_application_type": "",///----
                        "u_application_name": "",///----
                        "u_application_version": "",///----
                        "u_backend_services": "",///----
                        "u_client_services": "",///----
                        "u_incident_priority_max": "",///----
                        "u_support_responsibilities": "",///----
                        "u_support_times": "",///----
                        "u_recovery_time": "",///----
                        "u_service_availability": "",///----
                        "u_authentication_ldap": "",///----
                        "u_nas_storage": "",///----
                        "u_external_links_requests": "",///----
                        "u_security_exemptions": "",///----
                        "u_rtp_coordinator": "",///----
                        "u_acceptance_criteria": "",///----
                        "u_post_implementation_support": "",///----
                        "u_escalation_path": "",///----
                        "u_notification_list": "",///----
                        "u_country_notified": "Yes",
                        "u_notification_justification": "",///----
                        "work_notes_list": ""///----
                      };
                      console.log("promise_cchm_change_request_create request", JSON.stringify(options));
                      helper.logDataToFile(log_file_name, "promise_cchm_change_request_create request -- " + JSON.stringify(options));

                      let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}cchm_change_request_create.do?WSDL`;
                      console.log("url --- ", url);
                      helper.logDataToFile(log_file_name, "url -- " + url);

                      var auth = "Basic " + new Buffer(UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME + ":" + UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD).toString("base64");
                      const httpOptions = {
                        wsdl_headers: { Authorization: auth }
                      };

                      const soap = require('soap');

                      soap.createClient(url, httpOptions, function (err, client) {
                        if (err) {
                          console.error("soap error:", err);
                          helper.logDataToFile(log_file_name, "soap error: -- " + ((typeof err == 'object') ? JSON.stringify(err) : err));
                          resolve1("");
                        } else {
                          //console.log(JSON.stringify(options));
                          //console.log("client --- ", client.change_request_create.cchm_change_request_createSOAP.insert);

                          client.addHttpHeader('Authorization', auth);
                          client.change_request_create.cchm_change_request_createSOAP.insert(options, httpOptions, async function (err, result) {
                            if (err) {
                              console.log("cchm_change_request_createSOAP err", err);
                              helper.logDataToFile(log_file_name, "cchm_change_request_createSOAP err -- " + ((typeof err == 'object') ? JSON.stringify(err) : err));
                              resolve1("");
                            } else {
                              console.log("cchm_change_request_createSOAP result ---- ", result);
                              helper.logDataToFile(log_file_name, "cchm_change_request_createSOAP result -- " + ((typeof result == 'object') ? JSON.stringify(result) : result));
                              let updateData = { cmdb_rfc_number: result.number };
                              await dbHandler.updateTableData('c4_vm_details', { 'id': vm.id }, updateData, function (err, result) {
                                console.log(err);
                              });
                              resolve1(result);
                            }
                          });
                        }
                      });


                      //	          		  	soap.createClient(url, function (err, client) {
                      //	          		  		console.log("err --- ", err);
                      //	          		  		console.log("client --- ", client);
                      //		          			 client.setSecurity(new soap.BasicAuthSecurity(UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME, UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD));
                      //		          			 client.execute(options, function (err, result) {
                      //		          				 resolve1(result);
                      //		          			 });
                      //	          			});
                    });

                    if (promise_cchm_change_request_create.number) {
                      /*var promise_cchm_change_task_create = await new Promise(function(resolve1,reject1){
                        let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}cchm_change_task_create.do?WSDL`;
                          console.log("url --- ", url);
                          let options = {
                             "change_request": promise_cchm_change_request_create.number,
                               "short_description": vm.vm_creation_request_obj.environment+" cloud - machine "+vm.host_name+" was provisioned",//"Post Implementation Review",
                               "assignment_group": "SPCS-Cloud-Ops.IaaS",
                               "order": "1",
                               "u_change_stage": "build_and_test",//"Implementation",
                               "u_task_type": "OAT",//"Post Implementation Review"
                               "description" : vm.vm_creation_request_obj.environment+" cloud - machine "+vm.host_name+" was provisioned. Please, perform pre-RTP checks.",
                          };
                          console.log("cchm_change_task_create request", JSON.stringify(options));
                        	
                          const soap = require('soap');
                          var auth = "Basic " + new Buffer(UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME + ":" + UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD).toString("base64");
                          const httpOptions = {
                               wsdl_headers: {Authorization: auth} 
                          };
                       
                          soap.createClient(url, httpOptions, function(err, client) {
                              // client.setSecurity(new soap.ClientSSLSecurity({strictSSL: false}));
                            if (err) {
                                     console.error("soap error:",err);
                                     resolve1("");
                            } else {
                                   //console.log(JSON.stringify(options));
                                   //console.log("client --- ", client.change_request_create.cchm_change_request_createSOAP.insert);
                                   
                                   client.addHttpHeader('Authorization', auth);
                                   client.cchm_change_task_create.cchm_change_task_createSOAP.insert(options, httpOptions, function(err, result) {
                                     if (err) {
                                       console.log("cchm_change_task_createSOAP err",err);
                                       resolve1("");
                                     }else { 
                                       console.log(result);
                                       resolve1(result);
                                     }
                                   });
                            }
                            });
                        });*/

                      var promise_cchm_task_cmdb_ci_service_update = await new Promise(function (resolve1, reject1) {
                        let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}cchm_task_cmdb_ci_service_update.do?WSDL`;
                        console.log("url --- ", url);
                        let cmdbService = ((vm.vm_creation_request_obj.cmdbService) ? vm.vm_creation_request_obj.cmdbService.split("@$") : []);
                        let options = {
                          "change_request": promise_cchm_change_request_create.number,
                          "cmdb_ci_service": ((cmdbService.length > 0) ? cmdbService[0] : ""),//"EXP AM US DRH HOSTING", // TODO 
                          "u_impact_status": "",
                          "u_outage_type": "None",
                          "u_outage_start": "",
                          "u_outage_end": "",
                          "u_outage_duration": "0"
                        };
                        console.log("cchm_task_cmdb_ci_service_update request", JSON.stringify(options));
                        helper.logDataToFile(log_file_name, "cchm_task_cmdb_ci_service_update request" + JSON.stringify(options));

                        const soap = require('soap');
                        var auth = "Basic " + new Buffer(UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME + ":" + UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD).toString("base64");
                        const httpOptions = {
                          wsdl_headers: { Authorization: auth }
                        };

                        soap.createClient(url, httpOptions, function (err, client) {
                          // client.setSecurity(new soap.ClientSSLSecurity({strictSSL: false}));
                          if (err) {
                            console.error("soap error:", err);
                            helper.logDataToFile(log_file_name, "soap error" + ((typeof err == 'object') ? JSON.stringify(err) : err));
                            resolve1("");
                          } else {
                            //console.log(JSON.stringify(options));
                            //console.log("client --- ", client.change_request_create.cchm_change_request_createSOAP.insert);

                            client.addHttpHeader('Authorization', auth);
                            client.cchm_task_cmdb_ci_service_update.cchm_task_cmdb_ci_service_updateSOAP.update(options, httpOptions, function (err, result) {
                              if (err) {
                                console.log("cchm_task_cmdb_ci_service_update err", err);
                                helper.logDataToFile(log_file_name, "cchm_task_cmdb_ci_service_update request" + ((typeof err == 'object') ? JSON.stringify(err) : err));
                                resolve1("");
                              } else {
                                console.log(result);
                                helper.logDataToFile(log_file_name, ((typeof result == 'object') ? JSON.stringify(result) : result));
                                resolve1(result);
                              }
                            })
                          }
                        });
                      });

                      var promise_cchm_change_task_read = await new Promise(function (resolve1, reject1) {
                        let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}cchm_change_task_read.do?WSDL`;
                        console.log("url --- ", url);
                        let options = {
                          "change_request": promise_cchm_change_request_create.number,
                        };
                        console.log("cchm_change_task_read request", JSON.stringify(options));

                        const soap = require('soap');
                        var auth = "Basic " + new Buffer(UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME + ":" + UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD).toString("base64");
                        const httpOptions = {
                          endpoint: `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}cchm_change_task_read.do?SOAP`,
                          wsdl_headers: { Authorization: auth }
                        };

                        soap.createClient(url, httpOptions, function (err, client) {
                          // client.setSecurity(new soap.ClientSSLSecurity({strictSSL: false}));
                          if (err) {
                            console.error("soap error:", err);
                            resolve1("");
                          } else {
                            //console.log(JSON.stringify(options));
                            //console.log("client --- ", client.change_request_create.cchm_change_request_createSOAP.insert);

                            client.addHttpHeader('Authorization', auth);
                            client.cchm_change_task_read.cchm_change_task_readSOAP.read(options, httpOptions, function (err, result) {
                              if (err) {
                                console.log("cchm_change_task_readSOAP err", err);
                                resolve1("");
                              } else {
                                console.log(result);
                                helper.logDataToFile(log_file_name, ((typeof result == 'object') ? JSON.stringify(result) : result));
                                resolve1(result);
                              }
                            });
                          }
                        });
                      });
                      if (promise_cchm_change_task_read.change_task && promise_cchm_change_task_read.change_task.length > 0) {
                        await dbHandler.updateTableData('c4_vm_details', { 'id': vm.id }, { cmdb_ctasks_info: JSON.stringify(promise_cchm_change_task_read) }, function (err, updateResult) {
                          console.log(err);
                        });
                        for await (var task_ci_item of promise_cchm_change_task_read.change_task) {
                          if (task_ci_item.u_task_type == 'oat') {
                            var promise_cchm_change_task_update = await new Promise(function (resolve1, reject1) {
                              let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}cchm_change_task_update.do?WSDL`;
                              console.log("url --- ", url);
                              let options = {
                                "change_request": promise_cchm_change_request_create.number,
                                "change_task": task_ci_item.number,
                                "work_start": dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                                "work_end": oat_work_end,
                              };
                              console.log("cchm_change_task_update request", JSON.stringify(options));

                              const soap = require('soap');
                              var auth = "Basic " + new Buffer(UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME + ":" + UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD).toString("base64");
                              const httpOptions = {
                                wsdl_headers: { Authorization: auth }
                              };

                              soap.createClient(url, httpOptions, function (err, client) {
                                // client.setSecurity(new soap.ClientSSLSecurity({strictSSL: false}));
                                if (err) {
                                  console.error("soap error:", err);
                                  resolve1("");
                                } else {
                                  //console.log(JSON.stringify(options));
                                  //console.log("client --- ", client.change_request_create.cchm_change_request_createSOAP.insert);

                                  client.addHttpHeader('Authorization', auth);
                                  client.cchm_change_task_update.cchm_change_task_updateSOAP.update(options, httpOptions, function (err, result) {
                                    if (err) {
                                      console.log("cchm_change_task_updateSOAP err", err);
                                      resolve1("");
                                    } else {
                                      console.log(result);
                                      helper.logDataToFile(log_file_name, ((typeof result == 'object') ? JSON.stringify(result) : result));
                                      resolve1(result);
                                    }
                                  });
                                }
                              });
                            });
                          }

                          if (task_ci_item.u_task_type == 'implementation') {
                            var promise_cchm_change_task_update_impl = await new Promise(function (resolve1, reject1) {
                              let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}cchm_change_task_update.do?WSDL`;
                              console.log("url --- ", url);
                              let options = {
                                "change_request": promise_cchm_change_request_create.number,
                                "change_task": task_ci_item.number,
                                "work_start": impl_work_start,
                                "work_end": plannedEndDate,
                              };
                              console.log("cchm_change_task_update request", JSON.stringify(options));

                              const soap = require('soap');
                              var auth = "Basic " + new Buffer(UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME + ":" + UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD).toString("base64");
                              const httpOptions = {
                                wsdl_headers: { Authorization: auth }
                              };

                              soap.createClient(url, httpOptions, function (err, client) {
                                // client.setSecurity(new soap.ClientSSLSecurity({strictSSL: false}));
                                if (err) {
                                  console.error("soap error:", err);
                                  resolve1("");
                                } else {
                                  //console.log(JSON.stringify(options));
                                  //console.log("client --- ", client.change_request_create.cchm_change_request_createSOAP.insert);

                                  client.addHttpHeader('Authorization', auth);
                                  client.cchm_change_task_update.cchm_change_task_updateSOAP.update(options, httpOptions, function (err, result) {
                                    if (err) {
                                      console.log("cchm_change_task_updateSOAP err", err);
                                      resolve1("");
                                    } else {
                                      console.log(result);
                                      helper.logDataToFile(log_file_name, ((typeof result == 'object') ? JSON.stringify(result) : result));
                                      resolve1(result);
                                    }
                                  });
                                }
                              });
                            });
                          }
                        }
                      }

                      var promise_cchm_change_request_update = await new Promise(function (resolve1, reject1) {
                        var request = require("request");
                        let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}cchm_change_request_update.do`;

                        var options = {
                          method: 'POST',
                          url: url,
                          qs: { SOAP: '' },
                          headers:
                          {
                            'content-type': 'application/xml',
                            //			            			     authorization: 'Basic c25jX3N5c19pZl9teXNoaWZ0X2NtZGI6U2ZlM2ozbWpAI21mYVtBam9tNnNqMzE=', 
                            authorization: `Basic ${basicAuth}`
                          },
                          body: '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"  xmlns:dhl="https://servicenow.dhl.com/ns/cchm_change_request_update/"><soap:Body><update><change_request>' + promise_cchm_change_request_create.number + '</change_request><state>Registered</state></update></soap:Body></soap:Envelope>'
                        };

                        request(options, function (error, response, body) {
                          if (error) {
                            console.log("cchm_change_request_updateSOAP err", error);
                          }
                          console.log(body);
                          resolve1("Done");
                        });


                        /*let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}cchm_change_request_update.do?WSDL`;
                          console.log("url --- ", url);
                          let options = {
                            "change_request" : promise_cchm_change_request_create.number,
                            "state" : "Registered",
                          };
                          console.log("cchm_change_request_update request", JSON.stringify(options));
                        	
                          const soap = require('soap');
                          var auth = "Basic " + new Buffer(UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME + ":" + UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD).toString("base64");
                          const httpOptions = {
                               wsdl_headers: {Authorization: auth} 
                          };
                       
                          soap.createClient(url, httpOptions, function(err, client) {
                              // client.setSecurity(new soap.ClientSSLSecurity({strictSSL: false}));
                            if (err) {
                                     console.error("soap error:",err);
                                     resolve1("");
                            } else {
                                   //console.log(JSON.stringify(options));
                                   //console.log("client --- ", client.change_request_create.cchm_change_request_createSOAP.insert);
                                   
                                   client.addHttpHeader('Authorization', auth);
                                   client.change_request_update.cchm_change_request_updateSOAP.update(options, httpOptions, function(err, result) {
                                     if (err) {
                                       console.log("cchm_change_request_updateSOAP err",err);
                                       resolve1("");
                                     }else { 
                                       console.log(result);
                                       helper.logDataToFile(log_file_name,((typeof result =='object')?JSON.stringify(result):result));
                                       resolve1(result);
                                     }
                                   });
                            }
                            });*/
                      });
                    }
                  }
                }

                try {
                  if (cmdb_ci_sys_id != ''
                    && vm.vm_creation_request_obj.shared_image_tags
                    && vm.vm_creation_request_obj.shared_image_version_tags
                    && vm.vm_creation_request_obj.shared_image_version_tags["UCP-MW-Name-Version"]
                    && vm.vm_creation_request_obj.shared_image_version_tags["UCP-MW-Name-Version"] != ''
                    && vm.vm_creation_request_obj.shared_image_tags["UCP-MW"]
                    && vm.vm_creation_request_obj.shared_image_version_tags["UCP-MW-Path"]) {
                    let MW_Name_Version = vm.vm_creation_request_obj.shared_image_version_tags["UCP-MW-Name-Version"].split("@$");
                    if (MW_Name_Version.length == 3) {
                      let cmdb_instanceName = vm.vm_creation_request_obj.shared_image_tags["UCP-MW"] + ":" + vm.host_name.toUpperCase() + ":" + vm.vm_creation_request_obj.shared_image_version_tags["UCP-MW-Path"];
                      var promise_MIA_Middleware_WS = await new Promise(function (resolve1, reject1) {

                        //			            			let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/cmdb_software_product_model?sysparm_query=version=${MW_Name_Version[1]}&name=${MW_Name_Version[0]}&Manufacture=${MW_Name_Version[2]}`;
                        let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/cmdb_software_product_model?sysparm_query=version=${MW_Name_Version[1]}&name=${MW_Name_Version[0]}&Manufacturer=${MW_Name_Version[2]}`;

                        console.log("url --- ", url);
                        console.log(`Basic ${basicAuth}`);
                        request.get({
                          url: url, headers: {
                            'Authorization': `Basic ${basicAuth}`,
                            'Content-Type': 'application/json',
                          }
                        },
                          async function optionalCallback(err, httpResponse, searchResult) {
                            if (err) {//0 && 
                              console.log("err -- ", JSON.stringify(err));
                              console.log("resolve cmdb_software_product_model -- " + vm.host_name);
                              console.log("----------------------------------------------------------------------------------");
                              resolve(searchResult);
                            } else {
                              console.log("cmdb_software_product_model Result -- ", JSON.stringify(searchResult));
                              if (typeof searchResult != 'undefined') {
                                var searchBody = JSON.parse(searchResult);
                              } else {
                                var searchBody = [];
                              }
                              console.log("searchBody -- ", JSON.stringify(searchBody));
                              if (searchBody.result && searchBody.result.length > 0) {//1 || 
                                let cmdb_modelReference = ((searchBody.result[0].sys_id) ? searchBody.result[0].sys_id : "");
                                if (cmdb_modelReference != '') {
                                  url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}MIA_Middleware_WS.do?WSDL`;
                                  console.log(url);
                                  var promise_MIA_Middleware_WS_inner = await new Promise(function (resolve2, reject2) {
                                    let options = {
                                      "instanceName": cmdb_instanceName,
                                      "serverReference": cmdb_ci_sys_id,
                                      "modelReference": cmdb_modelReference
                                    };
                                    console.log(url);
                                    console.log("options --- ", options);

                                    const soap = require('soap');
                                    var auth = "Basic " + new Buffer(UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME + ":" + UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD).toString("base64");
                                    const httpOptions = {
                                      wsdl_headers: { Authorization: auth }
                                    };

                                    soap.createClient(url, httpOptions, function (err, client) {
                                      // client.setSecurity(new soap.ClientSSLSecurity({strictSSL: false}));
                                      if (err) {
                                        console.error("MIA_Middleware_WS_inner_result soap error:", err);
                                        resolve2(err);
                                      } else {
                                        console.log(client);
                                        client.addHttpHeader('Authorization', auth);
                                        client.ServiceNow_MIA_Middleware_WS.ServiceNowSoap.execute(options, httpOptions, function (err, MIA_Middleware_WS_inner_result) {
                                          //console.log(client.ServiceNow_MIA_Middleware_WS.ServiceNowSoap.execute.soapAction);
                                          if (err) {
                                            console.log("MIA_Middleware_WS_inner_result err", err);
                                            resolve2(err);
                                          } else {
                                            console.log(MIA_Middleware_WS_inner_result);
                                            resolve2(MIA_Middleware_WS_inner_result);
                                          }
                                        });
                                      }
                                    });
                                  });

                                  let updateData = {
                                    cmdb_ci_instance_name: cmdb_instanceName,
                                    cmdb_ci_model_reference: cmdb_modelReference,
                                  };
                                  if (promise_MIA_Middleware_WS_inner.errorCode == '0') {
                                    updateData.cmdb_ci_mw_sys_id = promise_MIA_Middleware_WS_inner.mwInstanceId;
                                    let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_dhl_ci_sw?sysparm_query=sys_id=${updateData.cmdb_ci_mw_sys_id}`;
                                    console.log("url --- ", url);
                                    console.log(`Basic ${basicAuth}`);
                                    request.get({
                                      url: url, headers: {
                                        'Authorization': `Basic ${basicAuth}`,
                                        'Content-Type': 'application/json',
                                      }
                                    },
                                      async function optionalCallback(err, httpResponse, mwSearchResult) {
                                        if (err) {//0 && 
                                          console.log("err -- ", JSON.stringify(err));
                                          console.log("resolve u_dhl_ci_sw -- " + vm.host_name);
                                          console.log("----------------------------------------------------------------------------------");
                                          resolve(mwSearchResult);
                                        } else {
                                          console.log("u_dhl_ci_sw Result -- ", JSON.stringify(mwSearchResult));
                                          if (typeof mwSearchResult != 'undefined') {
                                            var mwSearchBody = JSON.parse(mwSearchResult);
                                          } else {
                                            var mwSearchBody = [];
                                          }
                                          console.log("mwSearchBody -- ", JSON.stringify(mwSearchBody));
                                          if (mwSearchBody.result && mwSearchBody.result.length > 0) {//1 || 
                                            updateData.cmdb_ci_mw_number = ((mwSearchBody.result[0].u_number) ? mwSearchBody.result[0].u_number : "");
                                            await dbHandler.updateTableData('c4_vm_details', { 'id': vm.id }, updateData, function (err, updateResult) {
                                              console.log(err);
                                            });
                                            resolve1({ searchResult, promise_MIA_Middleware_WS_inner });
                                          } else {
                                            await dbHandler.updateTableData('c4_vm_details', { 'id': vm.id }, updateData, function (err, updateResult) {
                                              console.log(err);
                                            });
                                            resolve1({ searchResult, promise_MIA_Middleware_WS_inner });
                                          }
                                        }
                                      }
                                    )
                                  } else {
                                    await dbHandler.updateTableData('c4_vm_details', { 'id': vm.id }, updateData, function (err, updateResult) {
                                      console.log(err);
                                    });
                                    resolve1({ searchResult, promise_MIA_Middleware_WS_inner });
                                  }
                                } else {
                                  resolve1(searchResult);
                                }
                              } else {
                                resolve1(searchResult);
                              }
                            }
                          });
                      });
                    }
                  }
                } catch (e) {
                  console.log("error --- ", e);
                }

                //, promise_u_excel_dhl_hw_upload, promise_u_excel_dhl_ci_rel_ci_upload, promise_u_excel_dhl_ci_rel_bs_upload
                await Promise.all([promise_u_excel_dhl_hw_server_upload, promise_u_excel_dhl_ci_rel_bs_upload]).then(async function (values) {
                  //	            		console.log("final values", JSON.stringify(values));
                  console.log("final syncVmsInCmdb resolve -- " + vm.host_name);
                  console.log("----------------------------------------------------------------------------------");
                  dbHandler.updateTableData('c4_vm_details', { id: vm.id }, { is_in_cmdb: 'yes' }, function (err, result) {
                    resolve('updated')
                  })
                  resolve(body);
                });
              } else {
                console.log("final syncVmsInCmdb resolve -- " + vm.host_name);
                console.log("----------------------------------------------------------------------------------");
                resolve('Continue');
              }
            }
          });
      });
    }
    console.log("syncVmsInCmdb complete ==============");
  });
}

let syncGalleryImageVersions = (reqObj) => {
  let cts = Math.round(new Date().getTime() / 1000);
  // console.log(reqObj);
  let sql = `Select s.subscription_id, s.clientid, s.provision_type, c.azure_tenantid, 
	    c.azure_clientid, c.azure_clientsecretkey, 
	    c.azure_resource, c.azure_granttype, ar.name as recource_group_name
	    from c4_azure_subscriptions as s
	    inner join c4_clients as c on c.id = s.clientid
	    inner join c4_azure_subscription_locations as asl on (asl.clientid = s.clientid and asl.subscription_id = s.subscription_id)
	    inner join c4_azure_resourcegroups as ar on ar.location_id = asl.id
	    where c.status = 1 and c.azure_linked = 1 and s.state='Enabled' and s.record_status = 1 and ar.record_status=1 `;

  if (typeof reqObj.subscription_id != 'undefined') {
    sql += ` and s.subscription_id = '${reqObj.subscription_id}' `;
  }
  if (typeof reqObj.recource_group != 'undefined') {
    sql += ` and ar.name = '${reqObj.recource_group}' `;
  }
  if (typeof reqObj.clientid != 'undefined') {
    sql += ` and s.clientid = '${reqObj.clientid}' order by s.id desc`;
  } else {
    sql += ` order by s.id desc`;
  }
  // sql += ' limit 1';
  console.log(sql);

  dbHandler.executeQuery(sql, async function (resourceList) {
    //		  osDataArr = [];
    if (resourceList.length > 0) {
      let imageIds = [];
      for await (var resource of resourceList) {
        // for(var i=0;i<resourceList.length;i++){
        await new Promise(async function (resolve1, reject1) {
          // var resource=resourceList[i]
          let clientid = resource.clientid;
          let subscriptionId = resource.subscription_id;
          let recource_group_name = resource.recource_group_name;
          let provision_type = resource.provision_type;
          await new Promise(function (resolve2, reject2) {
            azure_authtoken(clientid, function (error, result) {
              if (error) {
                console.log("azure_authtoken --- ", error);
                return resolve2([])
              }
              return resolve2(result)
            })
          }).then(function (token) {
            if (!token) {
              resolve1('Continue');
            }
            var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${recource_group_name}/providers/Microsoft.Compute/galleries?api-version=2019-12-01`;
            console.log(url)
            request.get({
              url: url, headers: {
                "Authorization": 'Bearer ' + token.tokendata.access_token,
                'Content-type': 'application/json'
              }
            },
              async function optionalCallback(err, httpResponse, result) {
                if (err) {
                  console.log([], { status: "error", message: 'The operation did not execute as expected. Please raise a ticket to support', data: err, url });
                  resolve1('Continue');
                } else {
                  var galleryNames = JSON.parse(result);
                  //		        	      console.log(galleryNames)
                  if (galleryNames.error) {
                    console.log(null, { status: "error", message: ((galleryNames.error.message) ? galleryNames.error.message : 'The operation did not execute as expected. Please raise a ticket to support'), data: galleryNames, url })
                    resolve1('Continue');
                  } else {
                    console.log(null, { status: "success", message: 'Azure gallery Names List.', data: galleryNames });
                    if (galleryNames && galleryNames && galleryNames.value && galleryNames.value.length > 0) {
                      for await (var gallery of galleryNames.value) {
                        await new Promise(async function (galleryImagesResolve, galleryImagesReject) {
                          let stopped = false;
                          let pageToken = '';

                          // infinite loop
                          while (!stopped) {
                            await new Promise(async function (whileResolve, whileReject) {
                              var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${recource_group_name}/providers/Microsoft.Compute/galleries/${gallery.name}/images?api-version=2019-12-01`;
                              console.log("url ---- ", url);
                              if (pageToken) {
                                url = pageToken;
                              }
                              request.get({
                                url: url, headers: {
                                  "Authorization": 'Bearer ' + token.tokendata.access_token
                                }
                              },
                                async function optionalCallback(err, httpResponse, result) {
                                  if (err) {
                                    console.log({ message: "galleryImagesResolve Continue1", err, url });
                                    galleryImagesResolve('Continue');
                                  } else {
                                    if (typeof result != 'undefined')
                                      var galleryImagesInfo = JSON.parse(result);
                                    else
                                      var galleryImagesInfo = [];
                                    console.log("galleryImagesInfo ---- ", galleryImagesInfo);

                                    if (!galleryImagesInfo.value || galleryImagesInfo.value.length == 0) {
                                      console.log(`No images found for subscriptions/${subscriptionId} resourceGroups/${recource_group_name} galleries/${gallery.name}`);
                                      stopped = true; // stop when you want
                                      console.log("galleryImagesResolve Continue2");
                                    } else {
                                      for await (var galleryImage of galleryImagesInfo.value) {
                                        //		                            	console.log("galleryImage ---- ", galleryImage);
                                        await new Promise(async function (galleryImageVersionResolve, galleryImageVersionReject) {
                                          var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${recource_group_name}/providers/Microsoft.Compute/galleries/${gallery.name}/images/${galleryImage.name}/versions?api-version=2019-12-01`;
                                          console.log(url)
                                          request.get({
                                            url: url, headers: {
                                              "Authorization": 'Bearer ' + token.tokendata.access_token
                                            }
                                          },
                                            async function optionalCallback(err, httpResponse, result) {
                                              if (err) {
                                                console.log({ message: "galleryImageVersionResolve Continue1", err, url });
                                                galleryImageVersionResolve('Continue');
                                              } else {
                                                if (typeof result != 'undefined')
                                                  var galleryImageVersionInfo = JSON.parse(result);
                                                else
                                                  var galleryImageVersionInfo = [];
                                                if (typeof galleryImageVersionInfo.value != 'undefined') {
                                                  //		                            console.log("galleryImageVersionInfo.value");
                                                  //		                            console.log(galleryImageVersionInfo.value);
                                                  for await (var galleryImageVersion of galleryImageVersionInfo.value) {
                                                    //							                            	console.log("galleryImageVersion");
                                                    //								                            console.log(galleryImageVersion);

                                                    await new Promise(async function (galleryImageVersionResolve, galleryImageVersionReject) {
                                                      let galleryImageVersionSql = `SELECT id from azure_gallery_image_versions
									                                            where clientid = '${resource.clientid}' and subscription_id = '${subscriptionId}'
									                                            and resourceGroup = '${recource_group_name}' 
									                                            and galleryName = '${gallery.name}' 
									                                            and galleryImageName = '${galleryImage.name}' 
									                                            and galleryImageVersionName = '${galleryImageVersion.name}' 
									                                            `;
                                                      console.log("galleryImageVersionSql");
                                                      console.log(galleryImageVersionSql);
                                                      let insData = {
                                                        clientid: resource.clientid,
                                                        subscription_id: subscriptionId,
                                                        provision_type: provision_type,
                                                        resourceGroup: recource_group_name,
                                                        galleryName: gallery.name,
                                                        galleryImageName: galleryImage.name,
                                                        galleryImageVersionName: galleryImageVersion.name,
                                                        storageAccountType: galleryImageVersion.properties.publishingProfile.storageAccountType,
                                                        diskSizeGB: galleryImageVersion.properties.storageProfile.osDiskImage.sizeInGB,
                                                        location: galleryImageVersion.location,
                                                        osType: galleryImage.properties.osType,
                                                        dbType: ((galleryImage.tags["UCP-DB-Type"]) ? galleryImage.tags["UCP-DB-Type"] : ""),
                                                        middleWare: ((galleryImage.tags["UCP-MW"]) ? galleryImage.tags["UCP-MW"] : ""),
                                                        price: 0,
                                                        gallery_response_obj: JSON.stringify(gallery),
                                                        image_response_obj: JSON.stringify(galleryImage),
                                                        version_response_obj: JSON.stringify(galleryImageVersion)
                                                      };
                                                      //					                                            osDataArr.push(insData);
                                                      await dbHandler.executeQuery(galleryImageVersionSql, async function (galleryImageVersionInfo) {
                                                        console.log("galleryImageVersionInfo");
                                                        console.log(galleryImageVersionInfo);
                                                        if (galleryImageVersionInfo.length > 0) {
                                                          insData.modified_date = cts;
                                                          insData.record_status = 1;
                                                          //					                                                     console.log("insData");
                                                          //					                                                     console.log(insData);
                                                          imageIds.push(galleryImageVersionInfo[0].id);
                                                          await dbHandler.updateTableData('azure_gallery_image_versions', { id: galleryImageVersionInfo[0].id }, insData, function (err, result) {
                                                            console.log(`Updated Record for clientid = '${resource.clientid}' and subscription_id = '${subscriptionId}' and resourceGroup = '${recource_group_name}' and galleryName = '${gallery.name}' and galleryImageName = '${galleryImage.name}' and galleryImageVersionName = '${galleryImageVersion.name}'`);
                                                            galleryImageVersionResolve([]);
                                                          })
                                                        } else {
                                                          insData.created_date = cts;
                                                          //					                                                     console.log("insData");
                                                          //					                                                     console.log(insData);
                                                          await dbHandler.insertIntoTable('azure_gallery_image_versions', insData, async function (error, imgId) {
                                                            imageIds.push(imgId);
                                                            console.log(`Inserted Record for clientid = '${resource.clientid}' and subscription_id = '${subscriptionId}' and resourceGroup = '${recource_group_name}' and galleryName = '${gallery.name}' and galleryImageName = '${galleryImage.name}' and galleryImageVersionName = '${galleryImageVersion.name}' and imgId = '${imgId}'`);
                                                            galleryImageVersionResolve([]);
                                                          });
                                                        }
                                                      });
                                                    });
                                                  }
                                                  console.log("galleryImageVersionResolve updated");
                                                  galleryImageVersionResolve('updated');
                                                } else {
                                                  console.log("galleryImageVersionResolve Continue2");
                                                  galleryImageVersionResolve('Continue');
                                                }
                                              }
                                            });
                                        });
                                      }

                                      whileResolve(galleryImagesInfo);
                                      if (!galleryImagesInfo.nextLink || (galleryImagesInfo.nextLink && galleryImagesInfo.nextLink == '')) {
                                        stopped = true; // stop when you want
                                      } else {
                                        pageToken = galleryImagesInfo.nextLink;
                                        console.log("pageToken ---------------------------------------------------------------------------------------------", pageToken);
                                      }
                                    }
                                  }
                                });
                            })
                          }
                          galleryImagesResolve('Continue');
                        });
                      }
                      console.log("resolve1 Continue1");
                      resolve1('Continue');
                    } else {
                      console.log("resolve1 Continue2");
                      resolve1('Continue');
                    }
                  }
                }
              });
          })
        })
      }

      //Update the not listed images record_status to 0
      if (imageIds.length > 0) {
        let updateSql = "update azure_gallery_image_versions set record_status='0' WHERE id not in (" + imageIds.join() + ")";
        if (typeof reqObj.subscription_id != 'undefined') {
          updateSql += ` and subscription_id = '${reqObj.subscription_id}' `;
        }
        if (typeof reqObj.recource_group != 'undefined') {
          updateSql += ` and resourceGroup = '${reqObj.recource_group}' `;
        }
        console.log("imageIds --- ", imageIds);
        console.log("updateSql --- ", updateSql);
        db.query(updateSql, (error, rows, fields) => {
          dbFunc.connectionRelease;
          if (!!error) {
            console.log(error);
          } else {
            console.log(`Updated Record status to 0`);
            console.log(rows);
          }
        });
      }
    }
    //		  console.log("final resolve --- ", JSON.stringify(osDataArr));
  })
}

let syncStorageSkus = (reqObj) => {
  let cts = Math.round(new Date().getTime() / 1000);
  let cts_str = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  // console.log(reqObj);
  let sql = `Select s.subscription_id, s.clientid, s.provision_type, c.azure_tenantid, 
	    c.azure_clientid, c.azure_clientsecretkey, 
	    c.azure_resource, c.azure_granttype
	    from c4_azure_subscriptions as s
	    inner join c4_clients as c on c.id = s.clientid
	    where c.status = 1 and c.azure_linked = 1 and s.state='Enabled' and s.record_status = 1`;
  if (typeof reqObj.subscription_id != 'undefined') {
    sql += ` and s.subscription_id = '${reqObj.subscription_id}' `;
  }
  if (typeof reqObj.clientid != 'undefined') {
    sql += ` and s.clientid = '${reqObj.clientid}' order by s.id desc`;
  } else {
    sql += ` order by s.id desc`;
  }
  // sql += ' limit 1';
  console.log(sql);

  dbHandler.executeQuery(sql, async function (resourceList) {
    console.log(resourceList);
    //		  return;
    if (resourceList.length > 0) {
      for await (var resource of resourceList) {
        // for(var i=0;i<resourceList.length;i++){
        await new Promise(async function (resolve1, reject1) {
          // var resource=resourceList[i]
          let clientid = resource.clientid;
          let subscriptionId = resource.subscription_id;
          await new Promise(function (resolve2, reject2) {
            azure_authtoken(clientid, function (error, result) {
              if (error) {
                return resolve2([])
              }
              return resolve2(result)
            })
          }).then(function (token) {
            if (!token) {
              resolve1('Continue');
            }
            var url = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Compute/skus?api-version=2019-04-01`;
            if (typeof reqObj.location != 'undefined') {
              url += `&$filter=location eq '${reqObj.location}'`;
            }
            //console.log(url)
            request.get({
              url: url, headers: {
                "Authorization": 'Bearer ' + token.tokendata.access_token,
                'Content-type': 'application/json'
              }
            },
              async function optionalCallback(err, httpResponse, result) {
                if (err) {
                  console.log([], { status: "error", message: 'The operation did not execute as expected. Please raise a ticket to support', data: err });
                  resolve1('Continue');
                } else {
                  var storageSkus = JSON.parse(result);
                  console.log(storageSkus)
                  if (storageSkus.error) {
                    console.log(null, { status: "error", message: ((storageSkus.error.message) ? storageSkus.error.message : 'The operation did not execute as expected. Please raise a ticket to support'), data: storageSkus })
                    resolve1('Continue');
                  } else {
                    console.log(null, { status: "success", message: 'Azure storageSkus List.', data: storageSkus });
                    if (storageSkus && storageSkus && storageSkus.value && storageSkus.value.length > 0) {
                      for await (var storageSku of storageSkus.value) {
                        await new Promise(async function (storageSkuResolve, storageSkuReject) {
                          //			        	    			  console.log("storageSku ----- ", JSON.stringify(storageSku));
                          if (storageSku.resourceType == 'disks') {
                            //			        	    				  return storageSkuResolve('Continue');
                            let MinSizeGiB = 0;
                            let MaxSizeGiB = 0;
                            let PremiumIO = "";
                            let LowPriorityCapable = "";
                            let location = ((storageSku.locations && storageSku.locations[0]) ? storageSku.locations[0] : "");

                            if (storageSku.capabilities && storageSku.capabilities.length > 0) {
                              await storageSku.capabilities.forEach(async function (val, key) {
                                if (val.name == 'MinSizeGiB') {
                                  MinSizeGiB = val.value;
                                } else if (val.name == 'MaxSizeGiB') {
                                  MaxSizeGiB = val.value;
                                } else if (val.name == 'PremiumIO') {
                                  PremiumIO = val.value;
                                } else if (val.name == 'LowPriorityCapable') {
                                  LowPriorityCapable = val.value;
                                }
                              });
                            }

                            let storageSkuSql = `SELECT id from azure_storage_skus
		                                          where clientid = '${resource.clientid}' and subscription_id = '${subscriptionId}' 
		                                          and name = '${storageSku.name}' 
		                                          and location = '${location}' 
		                                          and size = '${storageSku.size}' 
		                                          and tier = '${storageSku.tier}'
	                                          `;
                            //	                                          console.log("storageSkuSql");
                            //	                                          console.log(storageSkuSql);

                            let insData = {
                              clientid: resource.clientid,
                              subscription_id: subscriptionId,
                              name: storageSku.name,
                              tier: storageSku.tier,
                              location: location,
                              size: storageSku.size,
                              MinSizeGiB: MinSizeGiB,
                              MaxSizeGiB: MaxSizeGiB,
                              PremiumIO: PremiumIO,
                              LowPriorityCapable: LowPriorityCapable
                            };
                            //	                                          console.log("insData ----- ", JSON.stringify(insData));
                            await dbHandler.executeQuery(storageSkuSql, async function (storageSkuInfo) {
                              //	                                               console.log("storageSkuInfo");
                              //	                                               console.log(storageSkuInfo);
                              if (storageSkuInfo.length > 0) {
                                insData.modified_date = cts;
                                //	                                                   console.log("insData");
                                //	                                                   console.log(insData);
                                await dbHandler.updateTableData('azure_storage_skus', { id: storageSkuInfo[0].id }, insData, function (err, result) {
                                  //	                                                  	console.log(`Updated Record for clientid = '${resource.clientid}' and subscription_id = '${subscriptionId}' and storageSku.name = '${storageSku.name}'`);
                                  storageSkuResolve([]);
                                })
                              } else {
                                insData.created_date = cts;
                                //	                                                   console.log("insData");
                                //	                                                   console.log(insData);
                                await dbHandler.insertIntoTable('azure_storage_skus', insData, async function (error, vmdid) {
                                  //	                                                  	console.log(`Inserted Record for clientid = '${resource.clientid}' and subscription_id = '${subscriptionId}' and storageSku.name = '${storageSku.name}'`);
                                  storageSkuResolve([]);
                                });
                              }
                            });
                          } else if (storageSku.resourceType == 'virtualMachines') {
                            //				        	    			  console.log("virtualMachines storageSku --- ", storageSku);
                            //				        	    			  return storageSkuResolve('Continue');
                            let MinSizeGiB = 0,
                              MaxSizeGiB = 0,
                              PremiumIO = "False",
                              LowPriorityCapable = "False",
                              AcceleratedNetworkingEnabled = 'False',
                              HyperVGenerations = "",
                              EphemeralOSDiskSupported = 'False',
                              zones = ((storageSku.locationInfo && storageSku.locationInfo[0] && storageSku.locationInfo[0].zones) ? JSON.stringify(storageSku.locationInfo[0].zones) : "");
                            let location = ((storageSku.locations && storageSku.locations[0]) ? storageSku.locations[0] : "");
                            let vmSizeName = storageSku.name;

                            if (storageSku.capabilities && storageSku.capabilities.length > 0) {
                              await storageSku.capabilities.forEach(async function (val, key) {
                                if (val.name == 'PremiumIO') {
                                  PremiumIO = val.value;
                                } else if (val.name == 'LowPriorityCapable') {
                                  LowPriorityCapable = val.value;
                                } else if (val.name == 'AcceleratedNetworkingEnabled') {
                                  AcceleratedNetworkingEnabled = val.value;
                                } else if (val.name == 'HyperVGenerations') {
                                  HyperVGenerations = val.value;
                                } else if (val.name == 'EphemeralOSDiskSupported') {
                                  EphemeralOSDiskSupported = val.value;
                                }
                              });
                            }

                            let storageSkuSql = `SELECT c.id from c4_azure_catalog as c
	                                        	  inner join c4_azure_subscription_locations as asl on asl.id = c.location_id
		                                          where asl.clientid = '${resource.clientid}' and asl.subscription_id = '${subscriptionId}' 
		                                          and c.name = '${vmSizeName}' 
		                                          and asl.name = '${location}' 
	                                          `;
                            //	                                          console.log("storageSkuSql --- ", storageSkuSql);

                            let insData = {
                              PremiumIO: PremiumIO,
                              LowPriorityCapable: LowPriorityCapable,
                              AcceleratedNetworkingEnabled: AcceleratedNetworkingEnabled,
                              HyperVGenerations: HyperVGenerations,
                              zones: zones,
                              series_name: storageSku.size,
                              EphemeralOSDiskSupported: EphemeralOSDiskSupported,
                              sku_response_obj: JSON.stringify(storageSku)
                            };
                            if (storageSku.restrictions && storageSku.restrictions.length > 0) {
                              insData.record_status = 0;
                            }
                            //	                                          console.log("insData ----- ", JSON.stringify(insData));
                            await dbHandler.executeQuery(storageSkuSql, async function (storageSkuInfo) {
                              //	                                               console.log("storageSkuInfo -- ", storageSkuInfo);
                              if (storageSkuInfo.length > 0) {
                                insData.updated_date = cts_str;
                                if (LowPriorityCapable == 'True') {
                                  //	                                              		insData.record_status = 1;
                                }
                                //	                                                   console.log("insData");
                                //	                                                   console.log(insData);
                                await dbHandler.updateTableData('c4_azure_catalog', { id: storageSkuInfo[0].id }, insData, function (err, result) {
                                  console.log(`Updated Record for clientid = '${resource.clientid}' and subscription_id = '${subscriptionId}' and vmSizeName = '${storageSku.name}'`);
                                  storageSkuResolve([]);
                                })
                              } else {
                                storageSkuResolve([]);
                                /*insData.created_date = cts;
                                   console.log("insData");
                                   console.log(insData);
                                  await dbHandler.insertIntoTable('azure_storage_skus',insData,async function(error,vmdid){
                                    console.log(`Inserted Record for clientid = '${resource.clientid}' and subscription_id = '${subscriptionId}' and storageSku.name = '${storageSku.name}'`);
                                      storageSkuResolve([]);
                                  });*/
                              }
                            });
                          } else {
                            //				        	    			  console.log("else Continue");
                            storageSkuResolve('Continue');
                          }
                        });
                      }
                      console.log("resolve1 Continue1");
                      resolve1('Continue');
                    } else {
                      console.log("resolve1 Continue2");
                      resolve1('Continue');
                    }
                  }
                }
              });
          })
        })
      }
    }
  })
}

let syncAzureResources = async (reqObj) => {
  let cts = Math.round(new Date().getTime() / 1000);
  // console.log(reqObj);
  console.log(reqObj);
  let sql = `Select s.subscription_id, s.clientid, c.azure_tenantid, 
    c.azure_clientid, c.azure_clientsecretkey, 
    c.azure_resource, c.azure_granttype 
    from c4_azure_subscriptions as s
    inner join c4_clients as c on c.id = s.clientid
    where c.status = 1 and c.azure_linked = 1 and s.state='Enabled' and s.is_visible_to_frontend = 1  and s.record_status = 1 `;
  if (typeof reqObj.id != 'undefined') {
    sql += ` and c.id = ${reqObj.id} order by c.id desc`;
  } else {
    sql += ` order by c.id asc`;
  }
  console.log(sql);
  await new Promise(function (resolve, reject) {
    dbHandler.executeQuery(sql, async function (SubscriptionData) {
      console.log("SubscriptionData");
      console.log(SubscriptionData);
      try {
        if (SubscriptionData.length > 0) {
          for await (const item of SubscriptionData) {
            await new Promise(async function (itemResolve, itemReject) {
              // tokenData = {
              //     grant_type:item.azure_granttype,
              //     client_id:item.azure_clientid,
              //     client_secret:item.azure_clientsecretkey,
              //     resource:item.azure_resource
              // };
              // console.log("tokenData");
              // console.log(tokenData);
              // let urlpath = 'https://login.microsoftonline.com/'+item.azure_tenantid+'/oauth2/token';
              // console.log(urlpath);

              await new Promise(function (resolve, reject) {
                azure_authtoken(item.clientid, function (error, result) {
                  // console.log("result");
                  // console.log(result);
                  // if(error){
                  //     resolve([])
                  // }else{
                  resolve(result)
                  // }
                })
              }).then(async function (token) {
                // console.log("token");
                // console.log(token);
                if (token.tokendata.length == 0) {
                  var response = { message: 'The operation did not execute as expected. Please raise a ticket to support' }
                  itemResolve(response);
                } else {
                  updateResourceList({ access_token: token.tokendata.access_token, clientid: item.clientid }, item.subscription_id);
                  itemResolve("Done");
                }
              })
                .catch(error => {
                  console.log(error);
                  itemResolve({ "message": error });
                });
              console.log("updated for client id " + item.clientid + ", subscription id " + item.subscription_id);
              itemResolve("updated for client id " + item.clientid + ", subscription id " + item.subscription_id);
            });
          };
          console.log("Updated Azure Subscription resourcegroups List");
          callback(null, "Updated Azure Subscription resourcegroups List");
          resolve("Updated Azure Subscription resourcegroups List");
        } else {
          console.log("No clients available to update the Azure Subscription resourcegroups List");
          callback(1, "No clients available to update the Azure Subscription resourcegroups List");
          resolve("No clients available to update the Azure Subscription resourcegroups List");
        }
      }
      catch {
        resolve(0);
      }
    });
  });
}
let syncCmdbBusinessUnits = async (reqObj) => {
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
    return;
  }

  let cts = Math.round(new Date().getTime() / 1000);
  let basicAuth = base64.encode(`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME}:${UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD}`);
  //	  let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_business_unit?sysparm_fields=u_name&sysparm_query=u_active=true`;
  let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_business_unit?sysparm_query=u_applicationLIKEc73c872365321000b150af51ca6c3477&u_active=true`;

  console.log("url --- ", url);
  console.log(`Basic ${basicAuth}`);
  request.get({
    url: url, headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
    }
  },
    async function optionalCallback(err, httpResponse, result) {
      if (err) {//0 && 
        console.log("err -- ", JSON.stringify(err));
        console.log("final syncCmdbBusinessUnits resolve -- ");
        console.log("----------------------------------------------------------------------------------");
      } else {
        //        	  result = '{"result":[{"u_name":"Express"},{"u_name":"Freight"},{"u_name":"DGFF"},{"u_name":"PeP"},{"u_name":"DPDHL"},{"u_name":"DGF"},{"u_name":"Hubs & Gateways"},{"u_name":"GBS"},{"u_name":"Aviation"},{"u_name":"Freight"},{"u_name":"Express GHO"},{"u_name":"DSC"},{"u_name":"DGF"},{"u_name":"CSI"},{"u_name":"Williams Lea"},{"u_name":"Unknown"},{"u_name":"ITS"},{"u_name":"PP"},{"u_name":"DSC"},{"u_name":"GBS"},{"u_name":"eCS"},{"u_name":"Corporate Center"},{"u_name":"Express"}]}';
        console.log("result -- ", JSON.stringify(result));
        if (typeof result != 'undefined') {
          var body = JSON.parse(result);
        } else {
          var body = [];
        }
        console.log("body -- ", JSON.stringify(body));
        if (body.result && body.result.length > 0) {//1 || 
          let imageIds = [];
          for await (const catalogData of body.result) {
            await new Promise(async function (itemResolve, itemReject) {
              let catalogSql = `SELECT id from bu_info
                          where bu_name='${catalogData.u_name}' `;
              await dbHandler.executeQuery(catalogSql, async function (catalogInfo) {
                if (catalogInfo.length > 0) {
                  let updateData = {
                    bu_name: catalogData.u_name,
                    record_status: 1,
                    updated_date: cts
                  };
                  //                                      console.log('updateData')
                  //                                      console.log(updateData)
                  imageIds.push(catalogInfo[0].id);
                  await dbHandler.updateTableData('bu_info', { 'id': catalogInfo[0].id }, updateData, function (err, result) {
                    //catalogResolve("updated the azure_networks");
                    itemResolve('')
                  });
                } else {
                  let insData = {
                    bu_name: catalogData.u_name,
                    created_date: cts
                  };
                  //                                      console.log('insData')
                  //                                      console.log(insData)
                  await dbHandler.insertIntoTable('bu_info', insData, async function (error, vmdid) {
                    imageIds.push(vmdid);
                    //catalogResolve("inserted the azure_networks");
                    itemResolve('')
                  });
                }
              });
            });
          }

          //Update the not listed images record_status to 0
          if (imageIds.length > 0) {
            let updateSql = "update bu_info set record_status='0', updated_date = '" + cts + "' WHERE id not in (" + imageIds.join() + ")";
            console.log("imageIds --- ", imageIds);
            console.log("updateSql --- ", updateSql);
            db.query(updateSql, (error, rows, fields) => {
              dbFunc.connectionRelease;
              if (!!error) {
                console.log(error);
              } else {
                console.log(`Updated Record status to 0'`);
                console.log(rows);
              }
            });
          }
        }
      }
    }
  );
}

let syncCmdbCountries = async (reqObj) => {
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
    return;
  }

  let cts = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  let basicAuth = base64.encode(`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME}:${UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD}`);
  let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_country?sysparm_fields=u_name,u_code,sys_id,u_region&sysparm_query=u_active=true`;

  console.log("url --- ", url);
  console.log(`Basic ${basicAuth}`);
  request.get({
    url: url, headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
    }
  },
    async function optionalCallback(err, httpResponse, result) {
      if (err) {//0 && 
        console.log("err -- ", JSON.stringify(err));
        console.log("final syncCmdbBusinessUnits resolve -- ");
        console.log("----------------------------------------------------------------------------------");
      } else {
        console.log("result -- ", JSON.stringify(result));
        if (typeof result != 'undefined') {
          var body = JSON.parse(result);
        } else {
          var body = [];
        }
        console.log("body -- ", JSON.stringify(body));
        if (body.result && body.result.length > 0) {//1 || 
          let imageIds = [];
          for await (const catalogData of body.result) {
            await new Promise(async function (itemResolve, itemReject) {
              catalogData.u_name = catalogData.u_name.replace(/<\/?[^>]+(>|$)/g, "");
              catalogData.u_code = catalogData.u_code.replace(/<\/?[^>]+(>|$)/g, "");
              if (catalogData.u_name != '') {
                let catalogSql = `SELECT id from cmdb_countries
	                          where u_name='${catalogData.u_name}' and u_code='${catalogData.u_code}' `;
                await dbHandler.executeQuery(catalogSql, async function (catalogInfo) {
                  if (catalogInfo.length > 0) {
                    let updateData = {
                      u_name: catalogData.u_name,
                      u_code: catalogData.u_code,
                      sys_id: catalogData.sys_id,
                      u_region: catalogData.u_region,
                      record_status: 1,
                      updated_date: cts
                    };
                    //                                      console.log('updateData')
                    //                                      console.log(updateData)
                    imageIds.push(catalogInfo[0].id);
                    await dbHandler.updateTableData('cmdb_countries', { 'id': catalogInfo[0].id }, updateData, function (err, result) {
                      //catalogResolve("updated the azure_networks");
                      itemResolve('')
                    });
                  } else {
                    let insData = {
                      u_name: catalogData.u_name,
                      u_code: catalogData.u_code,
                      sys_id: catalogData.sys_id,
                      u_region: catalogData.u_region,
                      updated_date: cts
                    };
                    //                                      console.log('insData')
                    //                                      console.log(insData)
                    await dbHandler.insertIntoTable('cmdb_countries', insData, async function (error, vmdid) {
                      imageIds.push(vmdid);
                      //catalogResolve("inserted the azure_networks");
                      itemResolve('')
                    });
                  }
                });
              } else {
                itemResolve('')
              }
            });
          }

          //Update the not listed images record_status to 0
          if (imageIds.length > 0) {
            let updateSql = "update cmdb_countries set record_status='0', updated_date = '" + cts + "' WHERE id not in (" + imageIds.join() + ")";
            console.log("imageIds --- ", imageIds);
            console.log("updateSql --- ", updateSql);
            db.query(updateSql, (error, rows, fields) => {
              dbFunc.connectionRelease;
              if (!!error) {
                console.log(error);
              } else {
                console.log(`Updated Record status to 0'`);
                console.log(rows);
              }
            });
          }
        }
      }
    }
  );
}

let syncCmdbRegions = async (reqObj) => {
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
    return;
  }

  let cts = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  let basicAuth = base64.encode(`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME}:${UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD}`);
  //	  let url='https://servicenow-uat.dhl.com/api/now/table/sys_user?sysparm_query=u_upn=petr.dolezal2@dhl.com';
  let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/u_region?sysparm_fields=u_name,u_code,sys_id&sysparm_query=u_active=true`;

  console.log("url --- ", url);
  console.log(`Basic ${basicAuth}`);
  request.get({
    url: url, headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
    }
  },
    async function optionalCallback(err, httpResponse, result) {
      if (err) {//0 && 
        console.log("err -- ", JSON.stringify(err));
        console.log("final syncCmdbBusinessUnits resolve -- ");
        console.log("----------------------------------------------------------------------------------");
      } else {
        //        	  result = '{"result":[{"u_name":"ASIA","u_code":"ASIA"},{"u_name":"DATACENTER","u_code":"DATACENTER"},{"u_name":"BENELUX","u_code":"BNL"},{"u_name":"EUROPE","u_code":"EUROPE"},{"u_name":"AFRICA","u_code":"AFRICA"},{"u_name":"MYDHL+","u_code":"MYDHL+"},{"u_name":"COUNTRY","u_code":"COUNTRY"},{"u_name":"AM","u_code":"AM"},{"u_name":"OCEANIA","u_code":"OCEANIA"},{"u_name":"GLOBAL","u_code":"GLOBAL"},{"u_name":"CHINA","u_code":"CHINA"},{"u_name":"APIS","u_code":"APIS"},{"u_name":"AMERICAS","u_code":"AMERICAS"},{"u_name":"EMEA","u_code":"EMEA"},{"u_name":"MLEMEA","u_code":"MLEMEA"},{"u_name":"UK&I","u_code":"UK&I"},{"u_name":"NORAM","u_code":"NORAM"},{"u_name":"EMERGING MARKETS","u_code":"EMA"},{"u_name":"Greater China (gc)","u_code":"Greater China "},{"u_name":"LATAM","u_code":"LATAM"},{"u_name":"AMIS","u_code":"AMIS"},{"u_name":"GSC","u_code":"GSC"},{"u_name":"APEC","u_code":"APEC"},{"u_name":"MENA","u_code":"MENA"},{"u_name":"SSA","u_code":"SSA"},{"u_name":"MEA","u_code":"MEA"},{"u_name":"APEM","u_code":"APEM"},{"u_name":"NORDICS","u_code":"NORDICS"},{"u_name":"APAC","u_code":"APAC"},{"u_name":"GAIT","u_code":"GAIT"}]}';
        console.log("result -- ", JSON.stringify(result));
        if (typeof result != 'undefined') {
          var body = JSON.parse(result);
        } else {
          var body = [];
        }
        console.log("body -- ", JSON.stringify(body));
        if (body.result && body.result.length > 0) {//1 || 
          let imageIds = [];
          for await (const catalogData of body.result) {
            await new Promise(async function (itemResolve, itemReject) {
              let catalogSql = `SELECT id from cmdb_regions
                          where u_name='${catalogData.u_name}' and u_code='${catalogData.u_code}' `;
              await dbHandler.executeQuery(catalogSql, async function (catalogInfo) {
                if (catalogInfo.length > 0) {
                  let updateData = {
                    u_name: catalogData.u_name,
                    u_code: catalogData.u_code,
                    sys_id: catalogData.sys_id,
                    record_status: 1,
                    updated_date: cts
                  };
                  //                                      console.log('updateData')
                  //                                      console.log(updateData)
                  imageIds.push(catalogInfo[0].id);
                  await dbHandler.updateTableData('cmdb_regions', { 'id': catalogInfo[0].id }, updateData, function (err, result) {
                    itemResolve('')
                  });
                } else {
                  let insData = {
                    u_name: catalogData.u_name,
                    u_code: catalogData.u_code,
                    sys_id: catalogData.sys_id,
                    updated_date: cts
                  };
                  //                                      console.log('insData')
                  //                                      console.log(insData)
                  await dbHandler.insertIntoTable('cmdb_regions', insData, async function (error, vmdid) {
                    imageIds.push(vmdid);
                    itemResolve('')
                  });
                }
              });
            });
          }

          //Update the not listed images record_status to 0
          if (imageIds.length > 0) {
            let updateSql = "update cmdb_regions set record_status='0', updated_date = '" + cts + "' WHERE id not in (" + imageIds.join() + ")";
            console.log("imageIds --- ", imageIds);
            console.log("updateSql --- ", updateSql);
            db.query(updateSql, (error, rows, fields) => {
              dbFunc.connectionRelease;
              if (!!error) {
                console.log(error);
              } else {
                console.log(`Updated Record status to 0'`);
                console.log(rows);
              }
            });
          }
        }
      }
    }
  );
}

let syncCmdbServices = async (reqObj) => {
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
    return;
  }

  let cts = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  let basicAuth = base64.encode(`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_USERNAME}:${UCP_CONSTANTS_DATA.CMDB.CMDB_API_PWD}`);
  //	  let url=`${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/cmdb_ci_service?sysparm_limit=1000000&sysparm_query=u_active=true^u_bus_statusIN1,2&sysparm_fields=name,sys_id`;
  let url = `${UCP_CONSTANTS_DATA.CMDB.CMDB_API_DOMAIN}api/now/table/cmdb_ci_service?sysparm_query=owned_by.company.u_search_codeSTARTSWITHSER-ITS^u_folderSTARTSWITHEMEA^ORu_folderSTARTSWITHAP^ORu_folderSTARTSWITHGLOBAL^ORu_folderSTARTSWITHITS AM^ORu_folderSTARTSWITHDE^u_active=true&sysparm_fields=name,sys_id`;

  console.log("url --- ", url);
  console.log(`Basic ${basicAuth}`);
  request.get({
    url: url, headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
    }
  },
    async function optionalCallback(err, httpResponse, result) {
      if (err) {//0 && 
        console.log("err -- ", JSON.stringify(err));
        console.log("final syncCmdbBusinessUnits resolve -- ");
        console.log("----------------------------------------------------------------------------------");
      } else {
        //        	  result = '{"result":[{"name":"eCS BD Sa\'Fire"}]}';
        console.log("result -- ", JSON.stringify(result));
        if (typeof result != 'undefined') {
          var body = JSON.parse(result);
        } else {
          var body = [];
        }
        console.log("body -- ", JSON.stringify(body));
        if (body.result && body.result.length > 0) {//1 || 
          let imageIds = [];
          for await (const catalogData of body.result) {
            await new Promise(async function (itemResolve, itemReject) {
              catalogData.name = catalogData.name.trim();
              let catalogSql = "SELECT id from cmdb_services where u_name= " + db.escape(catalogData.name) + "";
              console.log("syncCmdbServices - catalogSql --- ", catalogSql);
              await dbHandler.executeQuery(catalogSql, async function (catalogInfo) {
                if (catalogInfo.length > 0) {
                  let updateData = {
                    sys_id: catalogData.sys_id,
                    record_status: 1,
                    updated_date: cts
                  };
                  //                                      console.log('updateData')
                  //                                      console.log(updateData)
                  imageIds.push(catalogInfo[0].id);
                  await dbHandler.updateTableData('cmdb_services', { 'id': catalogInfo[0].id }, updateData, function (err, result) {
                    itemResolve('')
                  });
                } else {
                  let insData = {
                    u_name: catalogData.name,
                    sys_id: catalogData.sys_id,
                    updated_date: cts
                  };
                  //                                      console.log('insData')
                  //                                      console.log(insData)
                  await dbHandler.insertIntoTable('cmdb_services', insData, async function (error, vmdid) {
                    imageIds.push(vmdid);
                    itemResolve('')
                  });
                }
              });
            });
          }

          //Update the not listed images record_status to 0
          if (imageIds.length > 0) {
            let updateSql = "update cmdb_services set record_status='0', updated_date = '" + cts + "' WHERE id not in (" + imageIds.join() + ")";
            console.log("imageIds --- ", imageIds);
            console.log("updateSql --- ", updateSql);
            db.query(updateSql, (error, rows, fields) => {
              dbFunc.connectionRelease;
              if (!!error) {
                console.log(error);
              } else {
                console.log(`Updated Record status to 0'`);
                console.log(rows);
              }
            });
          }
        }
      }
    }
  );
}

let updateOutdatedHostnames = async (reqObj) => {
  let cts = Math.floor(Date.now() / 1000);
  // console.log(reqObj);
  let older_date = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);

  let VM_holding_decommission_days = 10;
  await commonModel.getOptionConfigJsonData({ option_type: "UCP_CONSTANTS" }, async function (err, result) {
    //		console.log("result 1111111 --- ", result);
    if (!err && result.data && result.data.VM_holding_decommission_days) {
      VM_holding_decommission_days = result.data.VM_holding_decommission_days;
    }
    console.log("VM_holding_decommission_days 1111111 --- ", VM_holding_decommission_days);
  });
  console.log("VM_holding_decommission_days 22222 --- ", VM_holding_decommission_days);
  //	return;
  //2022-04-08 updated to 1 day earlier it is 10 days
  //2022-04-18 updated to 10 day earlier it is 1 day
  let holding_decom_date = Math.floor(Date.now() / 1000) - (parseInt(VM_holding_decommission_days) * 24 * 60 * 60); // holding Decommission VMs for 10 Days
  console.log("older_date --- ", older_date);
  console.log("holding_decom_date --- ", holding_decom_date);
  let sql = `select id,host_name,ip_address from azure_reusing_hostnames 
		  where 1 `;
  let where_sql = '';
  if (typeof reqObj.host_code != 'undefined') {
    where_sql += ` and host_code = '${reqObj.host_code}' `;
  }
  if (typeof reqObj.host_name != 'undefined') {
    let host_names = reqObj.host_name.split(',').join("', '");
    where_sql += ` and host_name in ('${host_names}') `;
  }
  if (typeof reqObj.ip_address != 'undefined') {
    let ip_addresses = reqObj.ip_address.split(',').join("', '");
    where_sql += ` and ip_address in ('${ip_addresses}') `;
  }

  if (where_sql == '') {
    sql += ` and (( record_status = 2 and reserved_date <= ${older_date} and is_vm_added_to_cart = 0 ) 
		  or (provision_status = 1 and provision_date <= ${older_date})
		  or (record_status = 4 and reserved_date <= ${holding_decom_date})
		  or (record_status in (0,1))) `;
  } else {
    sql += where_sql;
  }

  sql += ` order by id desc`;
  //    sql += ' limit 100';
  console.log(sql);

  dbHandler.executeQuery(sql, async function (hostList) {
    for await (var host of hostList) {
      await new Promise(async function (itemResolve, itemReject) {
        let hostSql = "SELECT vd.id from c4_vm_details as vd" +
          " inner join azure_vms as av on av.vm_detail_id = vd.id " +
          " where (vd.host_name= " + db.escape(host.host_name) + " or av.privateIpAddress = " + db.escape(host.ip_address) + " )" +
          " and vd.vm_status != 'Deleted' ";
        console.log("updateOutdatedHostnames - hostSql --- ", hostSql);
        await dbHandler.executeQuery(hostSql, async function (catalogInfo) {
          if (catalogInfo.length > 0) {
            let updateData = {
              record_status: 1,
              reserved_date: 0,
              is_vm_added_to_cart: 0,
              provision_status: 0,
              provision_date: 0,
              updated_date: cts
            };
            //                                      console.log('updateData')
            //                                      console.log(updateData)
            await dbHandler.updateTableData('azure_reusing_hostnames', { 'id': host.id }, updateData, function (err, result) {
              //catalogResolve("updated the azure_reusing_hostnames");
              itemResolve('')
            });
          } else {
            let updateData = {
              record_status: 0,
              reserved_date: 0,
              is_vm_added_to_cart: 0,
              provision_status: 0,
              provision_date: 0,
              updated_date: cts
            };
            //                                          console.log('updateData')
            //                                          console.log(updateData)
            await dbHandler.updateTableData('azure_reusing_hostnames', { 'id': host.id }, updateData, function (err, result) {
              //catalogResolve("updated the azure_reusing_hostnames");
              itemResolve('')
            });
          }
        });
      });
    }
  });
}

//azure Jenkin Jobs build Insert to update
const jenkinJobBuilds = async (aObj) => {
  aObj = aObj.map(async obj => {
    return dbHandler.executeQueryv2(
      `INSERT INTO c4_azure_jenkin_build_info (job_name, build_id, resource_group, subscription_id, status, host_name, build_info) VALUES (:job_name, :build_id, :resource_group, :subscription_id, :status, :host_name, '${obj.build_info}') ON DUPLICATE KEY UPDATE status=VALUES(status), build_info=VALUES(build_info)`,
      { ...obj })

  });

  await Promise.all(aObj);
}

//azure Jenkin Jobs build Insert to update
const jenkinJobBuildsUpdate = async (aObj) => {
  return await dbHandler.executeQueryv2(
    `INSERT INTO c4_azure_jenkin_build_info (job_name, build_id, resource_group, subscription_id, status, host_name, build_info) VALUES (:job_name, :build_id, :resource_group, :subscription_id, :status, :host_name, '${aObj.build_info}') ON DUPLICATE KEY UPDATE status=VALUES(status), build_info=VALUES(build_info)`,
    { ...aObj })
}

//Update oat file to the DB
const updateVMOatDetails = async (aObj) => {
  let { host_name, oat_checklist_data } = aObj,
    sql = `UPDATE c4_vm_details SET oat_checklist_data=:oat_checklist_data WHERE host_name=:host_name`,
    list = await dbHandler.executeQueryv2(sql, { oat_checklist_data, host_name });

  return list;
}

//Updated VM deatils with cyberark info
//Update oat file to the DB
const updateVMCyberarkDetails = async (aObj) => {
  let { hostname, cyberark_data, safe_data, request_data } = aObj,
    sql = `UPDATE c4_vm_details SET cyberark_data=:cyberark_data, safe_data=:safe_data, request_data=:request_data WHERE host_name=:hostname`,
    list = await dbHandler.executeQueryv2(sql, { cyberark_data, hostname, safe_data, request_data });

  return list;
}

//cyberark log
const cyberarkLog = async (aObj) => {
  let { title, hostname, response, statusid, payload } = aObj,
    insert_sql = `INSERT INTO c4_azure_cyberark_log (title, hostname, response, payload, statusid) VALUES (:title, :hostname, :response, :payload, :statusid)`,
    list;

  list = await dbHandler.executeQueryv2(insert_sql, {
    title, hostname, response, payload, statusid: statusid || 200
  })

  return list;
}

//cyberark updates
const updateVMDetails = async (aObj) => {

  let { ipaddress, comment, status, hostname, status_code, id, userName, platformId, safeName } = aObj,
    insert_sql = `INSERT INTO c4_azure_cyberak_info(account_id, address, hostname, userName, platformId, safeName, status, status_code, response) VALUES (:account_id, :address, :hostname, :userName, :platformId, :safeName, :status, :status_code, :response)`,
    list;

  list = await dbHandler.executeQueryv2(insert_sql, {
    account_id: id, address: ipaddress, userName, platformId, safeName, status, status_code, response: comment,
    hostname
  })

  return list;
}

const checkADGroup = async (email) => {
  let list = await dbHandler.executeQueryv2(
    `SELECT count(grp.id) as count from c4_client_user_groups grp
     INNER JOIN c4_client_users usr ON (usr.id=grp.user_id)
     INNER JOIN azure_ad_groups aag ON aag.group_id=grp.group_id AND aag.is_cyberark=1
     WHERE usr.email=:email`, { email });
  return list[0]?.count;
}

//Insert AD user to the ucp
const addADusertoUCP = async (user, auth, cb) => {
  let cts = Math.round(new Date().getTime() / 1000);
  var userValues = {
    email: user.mail,
    display_name: user.displayName,
    mobile: user.mobilePhone,
    password: "Ctrls@123" + cts,
    group_id: user.group_id,
    clientid: config.DEMO_CLIENT_ID,
    client_master_id: config.DEMO_CLIENT_ID,
    status: 1,
    createddate: cts,
    ad_status: 1,
    azure_ad_response: JSON.stringify({ auth, user }),
    azure_account_id: user.id
  };
  if (config.enable_user_encryption == 1) {
    userValues.display_name = ((userValues.display_name) ? (await ucpEncryptDecrypt.ucpEncryptForDb(userValues.display_name)) : "");
    userValues.password = ((userValues.password) ? (await ucpEncryptDecrypt.ucpEncryptForDb(userValues.password)) : "");
    userValues.mobile = ((userValues.mobile) ? (await ucpEncryptDecrypt.ucpEncryptForDb(userValues.mobile)) : "");
  } else {
    userValues.password = md5(userValues.password);
  }

  /*if (user.is_cyberark) {
    axios.post(config.API_URL + 'azure/add-cyber-user', {
      userName: user.mail
    }).then(cyberres => {
      console.log('---------------Adding user to cyberark----------')
      console.log(cyberres.data)
    }).catch(cybere => {
      console.log(user.mail, user.is_cyberark, user.group_name, '---------------Error in adding user to cyberark----------')
      console.log(cybere?.response?.data)
    });
  }*/

  //mysql
  db.query(`INSERT INTO c4_client_users 
  SET ? ON DUPLICATE KEY UPDATE azure_account_id=VALUES(azure_account_id), status=1, ad_status=1, mobile=VALUES(mobile), display_name=VALUES(display_name), group_id=VALUES(group_id)`, userValues, async (error, rows, fields) => {
    dbFunc.connectionRelease;
    if (error) {
      console.log(`Error: Adding/Updating ${user.mail} in ${user.group_name}`)
      console.log(error, '8607-----------------------------------');
      if (typeof cb != 'undefined') {
        cb(null, { status: "error", message: "failed" });
      }
    } else {
      console.log(`Succes: Adding/Updating ${user.mail} in ${user.group_name}`)
      db.query(`INSERT INTO c4_client_user_groups SET ? ON DUPLICATE KEY UPDATE ad_status=1, record_status=1, group_id=VALUES(group_id)`, {
        user_id: rows.insertId, group_id: user.group_id, ad_status: 1
      }, async (e, r, f) => {
      })
      if (typeof cb != 'undefined') {
        cb(null, { status: "error", message: "success" });
      }
    }
  });
}

const get_all_users = async (id) => {
  let list = await dbHandler.executeQueryv2(`SELECT email from c4_client_users`);
  return list;
}

//Deactivate id
const deleteDetails = async (id) => {
  await dbHandler.executeQueryv2(`UPDATE c4_azure_cyberak_info SET status=0, updated_on=now() WHERE id=:id`, { id });
  return id;
}

//Get account ids of cyberark ip
const getCyberAPIs = async (ip) => {
  let list = await dbHandler.executeQueryv2(`SELECT id, account_id, address, hostname FROM c4_azure_cyberak_info WHERE address=:ip AND status=1`, { ip });

  return list;
}

//Get cyber ark token info
const getCyberArkFileInfo = async () => {
  let data = fs.readFileSync('./helpers/cyberark_token.txt',
    { encoding: 'utf-8' });

  return data;
}

//Get Active cyberark data
const getActiveCyberarkData = async (status) => {
  let list = await dbHandler.executeQueryv2(`SELECT * FROM c4_azure_cyberak_info WHERE status=1 AND is_updated=${status} ORDER BY id asc`);

  return list;
}

//Sync cyber ark data
const syncCyberarkData = async () => {
  let vms = await dbHandler.executeQueryv2(`SELECT id, host_name, multiple_ip FROM c4_vm_details WHERE status=0 AND is_locked=0`);

  return vms;
}


//Get cyber ark configuration
const getCyberArkConfig = async () => {
  let config = await dbHandler.executeQueryv2(`SELECT * FROM c4_option_config WHERE option_type='CYBER_ARK_CONFIG'`);

  config = (config[0] || {}).option_value;

  return JSON.parse(config)
}
//Get AD login configuration
const getADConfig = async () => {
  let config = await dbHandler.executeQueryv2(`SELECT * FROM c4_option_config WHERE option_type='Azure_AD_Details'`);

  config = (config[0] || {}).option_value;
  return JSON.parse(config)
}


const cyberArkPermissions = async () => {
  let config = await dbHandler.executeQueryv2(`SELECT * FROM c4_option_config WHERE option_type='CYBER_ARK_PERMISSIONS' AND status=1`);

  config = (config[0] || {}).option_value;

  return JSON.parse(config)
}

async function cyberarkapiuserMemberAddition(safeName, cyber, token) {
  let permissions = await cyberArkPermissions(),
    adminPermission = {}, url = cyber.api + `Safes/`,
    usernames = cyber.username || [],
    headers, response,
    sendRequest = async (memberName) => {
      let outpt;

      try {
        console.log('--------------------------9562---------------------------')
        console.log(url + safeName + '/Members', memberName)
        headers = {
          headers: {
            Authorization: token || 'na'
          },
          httpsAgent: agent
        };
        outpt = await axios.post(url + safeName + '/Members/', {
          memberName,
          permissions: adminPermission
        }, headers)
        return {
          message: JSON.stringify(outpt?.data)
        };
      }
      catch (eer) {
        if (eer.response?.status === 401 || eer.response?.status === 409) {
          token = await axios.post(cyber.api + 'auth/Cyberark/Logon', {
            "username": "apiuser",
            "password": "NOV52hxdep6YWKNK8iDp"
          }).catch(e => { errmsg = e.response?.status })
          token = (token || {}).data;
          headers = {
            headers: {
              Authorization: token || 'na'
            },
            httpsAgent: agent
          }

          try {
            outpt = await axios.post(url + safeName + '/Members/', {
              memberName,
              permissions: adminPermission
            }, headers);
            return {
              message: JSON.stringify(outpt?.data),
              token
            }
          }
          catch (er2) {
            return {
              message: JSON.stringify(er2?.response?.data)
            }
          }
        }
        else {
          return {
            message: JSON.stringify(eer?.response?.data)
          }
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

async function cyberarkMemberAddition(safeName, cyber) {
  let permissions = await cyberArkPermissions(),
    adminPermission = {}, url = cyber.api + `Safes/`, token,
    usernames = cyber.username || [],
    headers, response,
    sendRequest = async (memberName) => {
      let outpt;

      try {
        console.log('--------------------------9562---------------------------')
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
        }, headers)
        return JSON.stringify(outpt?.data);
      }
      catch (eer) {
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
            }, headers);
            return JSON.stringify(outpt?.data);
          }
          catch (er2) {
            return JSON.stringify(er2?.response?.data);
          }
        }
        else {
          return JSON.stringify(eer?.response?.data);
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
  let { safeName, managingCPM, hostname, auth_token } = reqObj,
    cyber = await getCyberArkConfig(),
    url = cyber.api + `Safes/`, token,
    headers, response, safeObj,
    createSafe = async () => {
      let is_error;
      token = auth_token || await getCyberarkToken(cyber);
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
      catch (e) {
        is_error = true;
        safeObj = e.response
      }

      let status = safeObj?.status,
        data = safeObj?.data;
      if (is_error) {
        if (data?.ErrorCOde === 'SFWS0002') {
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
            token = await getCyberarkToken(cyber, true);
            itr++;
            return await createSafe();
          }
          else {
            await cyberarkLog({
              hostname, response: JSON.stringify(data),
              payload: JSON.stringify({
                safeName,
                managingCPM
              }),
              statusid: status, title: 'Safe Creation'
            });
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
    await cyberarkLog({
      hostname, response: JSON.stringify(response.data),
      payload: JSON.stringify({
        safeName,
        managingCPM
      }),
      statusid: 201, title: 'Safe Creation'
    });
  }

  response.addMember = await cyberarkMemberAddition(safeName, cyber)

  return response;
}

//AD token generation
const getAzureADToken = async (config) => {
  let { ad_grant_type, clientId, clientSecret, ad_resource } = config,
    errmsg = [],
    authorization = await axios.post(config.ad_azure_login, qs.stringify({
      grant_type: ad_grant_type, client_id: clientId, client_secret: clientSecret,
      resource: ad_resource
    }, { parseArrays: false }), {
      headers: {
        Authorization: 'SharedAccessSignature integration&201902170618&SQtsVDsa4LVIfS3Lv9Tf6O0uLtoVuA+81PDKapmkZz+jDfMT/S3c+WH1AwvdrMtuFcIaltSiQ0Zkgy2ERNe4KQ=='
      }
    }).catch(e => {
      errmsg.push('azure.js in modules 855 ' + e.message)
    });

  if (errmsg.length) {
    return null;
  }

  return ((authorization || {}).data || {}).access_token;
}

//
const getAzureAllowedUsersDB = async () => {
  let users = await dbHandler.executeQueryv2(`SELECT LOWER(email) as email FROM c4_client_users WHERE status=1`)

  return users.map(user => user.email);
}

//To get azure allowed users
const getAzureUsers = async (aConfig, onlyEmails) => {
  await dbHandler.executeQueryv2(`UPDATE c4_client_users SET ad_status=0 WHERE 1=1`);
  await dbHandler.executeQueryv2(`UPDATE c4_client_user_groups SET ad_status=0 WHERE 1=1`);
  let groups = await dbHandler.executeQueryv2(`SELECT * FROM azure_ad_groups where record_status = 1 `),
    users = [],
    search = aConfig.search,
    getGroupMembers = async (url) => {
      let axiosresp = await axios.get(url, {
        headers: {
          Authorization: 'Bearer ' + aConfig.auth,
          ConsistencyLevel: 'eventual'
        }
      }).catch(e => {
        console.log(e.message, 'errrorrrrrrrrrrrrrrrrrrr')
      });

      return axiosresp;
    };

  try {
    let promises = groups.map(async group => {
      let url = `${aConfig.ad_azure_url}groups/${group.group_id}/members/`,
        response = await getGroupMembers(url),
        users = [], nextlink;

      nextlink = ((response || {}).data || {})['@odata.nextLink'];
      response = ((response || {}).data || {}).value;

      //    response = response.map(u => {
      //      u = Object.assign(u, {group_id: group.group_id,
      //        group_name: group.group_name,
      //        is_cyberark: group.is_cyberark
      //      });
      //
      //      setTimeout(() => {
      //        addADusertoUCP(u, onlyEmails)
      //      }, 200);
      //      return u;
      //    });
      //    users = users.concat(response)

      for await (var u of response) {
        await new Promise(async function (innerResolve, innerReject) {
          u = Object.assign(u, { group_id: group.group_id, group_name: group.group_name, is_cyberark: group.is_cyberark })
          await addADusertoUCP(u, onlyEmails, async function (err, result) {
            users = users.concat(u);
            innerResolve("");
          });
        });
      }

      if (nextlink) {
        while (nextlink) {
          console.log('while ----------------------------------------------', nextlink)
          response = await getGroupMembers(nextlink);
          nextlink = ((response || {}).data || {})['@odata.nextLink'];
          response = ((response || {}).data || {}).value;
          for await (var u of response) {
            await new Promise(async function (innerResolve, innerReject) {
              u = Object.assign(u, { group_id: group.group_id, group_name: group.group_name, is_cyberark: group.is_cyberark })
              await addADusertoUCP(u, onlyEmails, async function (err, result) {
                users = users.concat(u);
                innerResolve("");
              });
            });
          }
          //        response = response.map(u => {
          //          u = Object.assign(u, {group_id: group.group_id, group_name: group.group_name, is_cyberark: group.is_cyberark})
          //          setTimeout(() => {
          //            await addADusertoUCP(u, onlyEmails)
          //          }, 20);
          //          return u;
          //        });
          //        responses = await Promise.all(response);
          //        users = users.concat(response)
        }
      }
      return users;
    });

    promsies = await Promise.all(promises);

    await commonModel.getEmailTemplate({ template_key: "USER_OFF_BOARDING" }, async function (error, emailTempRow) {
      console.log("emailTempRow --- ", JSON.stringify(emailTempRow));
      if (emailTempRow.data) {
        let usersSql = `select cu.id, cu.email, aag.group_name from c4_client_users as cu
					inner join c4_client_user_groups as cug on cug.user_id = cu.id
					inner join azure_ad_groups as aag on aag.group_id = cug.group_id
			    	where cug.record_status=1 and cug.ad_status=0 and aag.record_status = 1
		    	`;
        let usersDetails = await dbHandler.executeQueryv2(usersSql);
        if (usersDetails && usersDetails.length > 0) {
          for await (var u of usersDetails) {
            await new Promise(async (innerResolve, innerReject) => {
              console.log("u --- ", u);
              let subject = emailTempRow.data.email_subject + " - " + u.email;
              let mailbody = emailTempRow.data.email_body;

              let vmTable = "<table border='1'><thead><tr><th>Email</th><th>AD Group Name</th></tr></thead>";
              vmTable += `<tr><td>${u.email}</td><td>${u.group_name}</td></tr>`;
              vmTable += `</table>`;
              mailbody = mailbody.replace("{{USER_INFO}}", vmTable);
              subject = subject.replace("{{AD_GROUP}}", u.group_name);

              mail.mail({ subject: subject, messageBody: mailbody, tomail: u.email });
              innerResolve("Done");
            });
          }
        }
      }
    });
    //  setTimeout(async () => {
    await dbHandler.executeQueryv2(`UPDATE c4_client_users SET status=0 WHERE ad_status=0`);
    await dbHandler.executeQueryv2(`UPDATE c4_client_user_groups SET record_status=0 WHERE ad_status=0`);
    console.log('done----------------------------------------------')
    //  }, 80000);

    return users;
  }
  catch (e) {
    console.log('9506---------------------', e.message)
  }
}

//To get azure allowed users
const getAzureAllowedUsers = async (aConfig, onlyEmails) => {
  let groups,
    users = [],
    search = aConfig.search;

  if ((aConfig || {}).ucp_login) {
    groups = await dbHandler.executeQueryv2(`SELECT * FROM azure_ad_groups where ucp_login = 1`);
  }
  else {
    groups = await dbHandler.executeQueryv2(`SELECT * FROM azure_ad_groups where record_status = 1`);
  }
  try {
    let promises = groups.map(async group => {

      let response = await axios.get(`${aConfig.ad_azure_url}groups/${group.group_id}/members/microsoft.graph.user?$count=true&$orderby=displayName&$search="mail:${search}"`, {
        headers: {
          Authorization: 'Bearer ' + aConfig.auth,
          ConsistencyLevel: 'eventual'
        }
      }).catch(e => {
        console.log(e.message, 'errrorrrrrrrrrrrrrrrrrrr')
      });
      response = ((response || {}).data || {}).value;
      response = response.map(u => Object.assign(u, { group_id: group.group_id }))
      return response
    });

    promsies = await Promise.all(promises);

    await promsies.map(user => {
      user.map(d => {
        if (onlyEmails) {
          users.push((d.mail || '').toLowerCase())
        }
        else {
          users.push(d)
        }
      })
      return user;
    })
  }
  catch (e) {
    console.log(e.message)
  }
  return users;
}

//Method to get the cyberark session token
const getCyberarkToken = async (cyber, reset) => {
  let response, errmsg, duration,
    data = fs.readFileSync('./helpers/cyberark_token.txt',
      { encoding: 'utf-8' }),
    token, passkey,
    end = moment().format('YYYY-MM-DDHH:mm:ss');

  if (!(cyber || {}).api) {
    cyber = await getCyberArkConfig()
  }

  data = data.split('Date@$');

  if ((data || []).length) {
    duration = moment.duration(moment(end, 'YYYY-MM-DDHH:mm:ss').diff(
      moment(data[1], 'YYYY-MM-DDHH:mm:ss')
    ))
    duration = parseInt(duration.as('minutes'));
    token = data[0];
  }

  data[2] = !data[2] ? 0 : data[2];
  passkey = parseInt(data[2])

  if (duration > 4 || !data[1] || reset) {
    response = await axios.post(cyber.api + 'auth/Cyberark/Logon', {
      "username": cyber.username[passkey] || cyber.username[0],
      "password": cyber.password[passkey] || cyber.password[0],
      "concurrentSession": "true"
    },{ httpsAgent: agent }).catch(e => { errmsg = e.response?.status });
    token = (response || {}).data;
    passkey = (!passkey && passkey !== 0) || passkey >= 4 ? 0 : (passkey + 1);
    data = token + 'Date@$' + moment().format('YYYY-MM-DDHH:mm:ss') + 'Date@$' + passkey
    fs.writeFileSync('./helpers/cyberark_token.txt', data, function (err) {
      if (err) throw err;
      console.log('Saved!');
    });
  }

  return token;
}

let syncDiskEncryptions = (reqObj) => {
  let cts = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var sql = `select s.clientid,s.subscription_id
	  from c4_azure_subscriptions as s 
	  where s.state='Enabled' and s.record_status = 1 `
  dbHandler.executeQuery(sql, async function (subscriptionList) {
    //    console.log(subscriptionList)
    let imageIds = [];
    for await (var subscription of subscriptionList) {
      // for(var i=0;i<subscriptionList.length;i++){
      await new Promise(async function (resolve1, reject1) {
        // var subscription=subscriptionList[i]
        var clientid = subscription.clientid;
        var subscriptionId = subscription.subscription_id;
        await new Promise(function (resolve2, reject2) {
          azure_authtoken(clientid, function (error, result) {
            // if(error){
            //   //return resolve2([])
            // }
            return resolve2(result)
          })
        }).then(function (token) {
          if (!token) {
            resolve1('Continue');
          }
          var url = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Compute/diskEncryptionSets?api-version=2020-12-01`;
          console.log(url);
          request.get({
            url: url, headers: {
              "Authorization": 'Bearer ' + token.tokendata.access_token
            }
          },
            async function optionalCallback(err, httpResponse, result) {
              if (err) {
                console.log("syncDiskEncryptions ---- ", err);
                resolve1('Continue');
              } else {
                if (typeof result != 'undefined')
                  var body = JSON.parse(result);
                else
                  var body = [];
                //                  console.log("body")
                //                  console.log(body)
                if (body && body.value) {
                  //                    	console.log("body.value")
                  //                    	console.log(body.value)
                  if (body.value.length > 0) {
                    for await (const catalogData of body.value) {
                      await new Promise(async function (innerResolve, innerReject) {
                        let resourceGroup = catalogData.id.split("/")[4];
                        let business_unit = '';
                        let azure_ucp_status = '';
                        if (catalogData.tags && catalogData.tags['Business_Unit']) {
                          business_unit = catalogData.tags['Business_Unit'];
                        }
                        if (catalogData.tags && catalogData.tags['UCP-Status']) {
                          azure_ucp_status = catalogData.tags['UCP-Status'];
                        }

                        let catalogSql = `SELECT id from azure_disks_encryption
	                              where subscription_id = '${subscriptionId}' and disk_encryption_set_name = '${catalogData.name}'
	                              and resource_group = '${resourceGroup}' and location = '${catalogData.location}' `;
                        await dbHandler.executeQuery(catalogSql, async function (catalogInfo) {
                          if (catalogInfo.length > 0) {
                            let updateData = {
                              subscription_id: subscriptionId,
                              location: catalogData.location,
                              resource_group: resourceGroup,
                              disk_encryption_set_name: catalogData.name,
                              record_status: 1,
                              business_unit: business_unit,
                              azure_ucp_status: azure_ucp_status,
                              response_obj: JSON.stringify(catalogData),
                              updated_date: cts
                            };
                            //	                                      console.log('updateData')
                            //	                                      console.log(updateData)
                            imageIds.push(catalogInfo[0].id);
                            await dbHandler.updateTableData('azure_disks_encryption', { 'id': catalogInfo[0].id }, updateData, function (err, result) {
                              //catalogResolve("updated the azure_disks_encryption");
                              innerResolve('')
                            });
                          } else {
                            let insData = {
                              subscription_id: subscriptionId,
                              location: catalogData.location,
                              resource_group: resourceGroup,
                              disk_encryption_set_name: catalogData.name,
                              business_unit: business_unit,
                              azure_ucp_status: azure_ucp_status,
                              response_obj: JSON.stringify(catalogData),
                              updated_date: cts
                            };
                            //	                                      console.log('insData')
                            //	                                      console.log(insData)
                            await dbHandler.insertIntoTable('azure_disks_encryption', insData, async function (error, vmdid) {
                              imageIds.push(vmdid);
                              //catalogResolve("inserted the azure_disks_encryption");
                              innerResolve('')
                            });
                          }
                        });
                      });

                    }
                    resolve1('')
                  } else {
                    resolve1('Continue');
                  }
                } else {
                  resolve1('Continue');
                }
              }
            });
        })
      })
    }
    //Update the not listed images record_status to 0
    console.log("imageIds --- ", imageIds);
    if (imageIds.length > 0) {
      let updateSql = "update azure_disks_encryption set record_status='0' WHERE id not in (" + imageIds.join() + ")";
      console.log("updateSql --- ", updateSql);
      db.query(updateSql, (error, rows, fields) => {
        dbFunc.connectionRelease;
        if (!!error) {
          console.log(error);
        } else {
          console.log(`Updated Record status to 0'`);
          console.log(rows);
        }
      });
    }
  })
}

module.exports = {
  azure_authtoken,
  getSubscriptionList,
  getTenantList,
  getVMList,
  getLocationList,
  getHardwareProfileList,
  getVmCatalogs,
  vmOperations,
  getVMDetails,
  createVm,
  getDirectAzureAccessToken,
  getAzureSubscriptionList,
  getAzureSubscriptionWiseLocationList,
  getAzureCatalog,
  getAzureSubscriptionWiseOsTemplatesList,
  getAzureResourceGroups,
  syncAzureStorageTypes,
  syncVmList,
  updateVMList,
  updateResourceList,
  getAvailabilitySets,
  getZoneListLocationWise,
  createAvailabilitySet,
  getNetworkInterfaces,
  getAvailNetworkInterfaces,
  createNetworkInterfaces,
  getIpAddressProfile,
  createIpAddressProfile,
  getVirtualNetwork,
  createVirtualNetwork,
  getResourceList,
  getResourceSearchList,
  assignAvailabilityToVm,
  getDiskList,
  getVmSizes,
  getImageList,
  validateVmName,
  getVirtualNetworkLocationWise,
  syncVirtualNetwork,
  deleteResourceGroup,
  deleteVirtualNetwork,
  deleteVirtualMachine,
  deleteDisk,
  deleteNetworkInterface,
  deleteIpAddressProfile,
  syncVmStatus,
  syncAzureServiceMeters,
  syncAzureServicesUsage,
  createVmTemplate,
  syncVmBackupStatus,
  syncVmsInCmdb,
  syncGalleryImageVersions,
  syncStorageSkus,
  syncAzureResources,
  syncVmBackupVaultNames,
  syncVmBackupVaultPolicies,
  syncStorageAccountNames,
  syncAvailabilitySets,
  syncCmdbBusinessUnits,
  syncCmdbCountries,
  syncCmdbRegions,
  syncCmdbServices,
  updateOutdatedHostnames,
  getAzureUsers,
  getAzureAllowedUsers, addADusertoUCP,
  getADConfig, getCyberArkConfig,
  getCyberAPIs, deleteDetails,
  getAzureADToken, getAzureAllowedUsersDB,
  jenkinJobBuilds, get_all_users,
  updateVMOatDetails, jenkinJobBuildsUpdate,
  getCyberarkToken, updateVMDetails,
  syncDiskEncryptions,
  buildWithParams,
  getCyberArkFileInfo, cyberarkSafeCreation,
  cyberarkLog, updateVMCyberarkDetails,
  getActiveCyberarkData, syncCyberarkData,
  checkADGroup, cyberarkMemberAddition,
  cyberarkapiuserMemberAddition,
}
