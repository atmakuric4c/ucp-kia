var db = require('../../config/database');
var dbFunc = require('../../config/db-function');
const dateFormat = require("dateformat");
const dbHandler= require('../../config/api_db_handler');
const monitoringDB= require('../../config/monitoring_db');
const commonModel= require('./common.model.js');
const in_array = require('in_array');
var base64 = require('base-64');
var utf8 = require('utf8');
const helper=require('../../helpers/common_helper')
const axios = require('axios')
const querystring = require('querystring');
const config=require('../../config/constants');

var monitoringModel = {
    getAllMonitoringServers,
    saveMonitoringServer,
    uptimeReport,
    addUptimeReport,
    usageReport,
    addUsageReport,
    utilizationReport,
    addUtilizationReport,
    usageMetrics,
    usageMetricFromApi,
    vmItemsSave,
    getHostItemsFromZabbix,
    get_advanced_services_graph,
    advanced_serverMonitoring,
    getAllMonitoringVms,
    getAllGroups,
    addGroup,
    editGroup,
    getAllAlerts,
    zabixApiApplicationGet,
    zabixApiItemGet,
    getUsageAlerts

}
async function zabixApiApplicationGet(server_id, hostid,callback){
    var url=`${config.ZABBX_URL}/nagios/index.php/api/common_api/get_application_data`
    var postData={
      server_id:server_id,
      host_id:hostid,
      security_key:config.ZABBX_KEY
    }
    axios.post(url,querystring.stringify(postData))
    .then(response=>{
        //console.log(response.data)
        if(response && response.data && response.data.data)
        return callback(response.data.data);
        else return callback([]);
    })
    .catch(error=>{
        //console.log(error)
        return callback([]);
    })
 }
async function zabixApiItemGet(server_id, hostid, appid,callback){
    var url=`${config.ZABBX_URL}/nagios/index.php/api/common_api/get_items_data`
    var postData={
      server_id:server_id,
      host_id:hostid,
      app_id:appid,
      security_key:config.ZABBX_KEY
    }
    axios.post(url,querystring.stringify(postData))
    .then(response=>{
        //console.log(response.data)
        if(response && response.data && response.data.data)
        return callback(response.data.data);
        else return callback([]);
    })
    .catch(error=>{
        return callback([]);
    })    
  }
function getAllMonitoringServers() {
    return new Promise((resolve,reject) => {
        db.query(`SELECT m.* FROM zabbix_servers as m order by id desc`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });
    });
}
function saveMonitoringServer(reqObj,callback) {
    let formData = reqObj.body;
    let datetime = dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss");
    var serverValues = {
        display_name: formData.display_name,
        server_name: formData.server_name,
        username: formData.username,
        password: formData.password,
        status: formData.status
      };

    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM zabbix_servers WHERE display_name='"+formData.display_name+"' "+((typeof formData.server_id == "undefined" || formData.server_id == 0)?"":" and id <> "+formData.server_id),(error, rows, fields) => {
            if (error) {
                dbFunc.connectionRelease;
                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                reject(error);
            } else if (rows.length > 0) {
                dbFunc.connectionRelease;
                callback(1,"Server already exist ! try with different Server details.");
                resolve(rows);
            } else {
                dbFunc.connectionRelease;
                if(typeof formData.server_id == "undefined" || formData.server_id == 0){
                    serverValues.created_date = datetime;
                    serverValues.created_by = formData.user_id;
                    db.query("INSERT INTO zabbix_servers SET ?", serverValues ,(error,orderRows,fields)=>{
                        if(error) {
                            dbFunc.connectionRelease;
                            callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                            reject(error);
                        } else {
                            dbFunc.connectionRelease;
                            callback(null,{"message":"Monitoring Server Added Successfully."});
                            resolve(orderRows);
                        }
                    });
                }else{
                    serverValues.updated_date = datetime;
                    serverValues.updated_by = formData.user_id;
                    dbHandler.updateTableData('zabbix_servers',{id:formData.server_id},serverValues,async function(error,result){
                        if(error) {
                            callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                            reject(error);
                        } else {
                            callback(null,{"message":"Monitoring Server Updated Successfully."});
                            resolve(result);
                        }
                    });
                }
            }
        });
    });
}
function getAllMonitoringVms(clientid) {
    return new Promise((resolve,reject) => {
        //"SELECT m.*,m.host_name as zabbix_host_name,vm.vcenter_vm_name,vm.ip_address,vm.os_type, vm.host_name as vm_host_name FROM infra_vms as vm inner join zabbix_monitoring as m on m.cloud_host_id=vm.id where monitoring_visibility = 'yes'";
        db.query(`SELECT vm.id,ref_id,vm.clientid,vm.label_name,vm.primary_ip,vm.vm_status,vdc.location 
        FROM c4_vm_details as vm inner join c4_vdc as vdc on vm.vdc_id=vdc.id where vm.zabbix_portal_visibility=1
         and vm.clientid=${clientid} and vm.zabbix_config_status=1 and vm.status = 1 and vm.vm_status!='Deleted'`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows)
            }
       });
    })
}
function advanced_serverMonitoring(reqObj,callback){
    if(!reqObj.cloud_host_id)
        return callback(1,"Please provide the cloud host id");
    if(!reqObj.type)
        return callback(1,"Please provide the type");

    new Promise(function(resolve, reject) {
        let cloud_host_id = reqObj.cloud_host_id;
        let type = reqObj.type;
        if(type=='CLOUD')
        var controller_name='nagios_details_api';
        else
        var controller_name='service_api';
        var url=`${config.ZABBX_URL}/nagios/index.php/api/${controller_name}/advanced_serverMonitoring`
        var postData={
            cloud_host_id:cloud_host_id,
            security_key:config.ZABBX_KEY
        }
        axios.post(url,querystring.stringify(postData))
        .then(response=>{
            if(response && response.data)
            return callback(null,response.data);
            else return callback(1,{"response":[]});
        })
        .catch(error=>{
            return callback(1,{"response":[]});
        })
    });
}
function get_advanced_services_graph(reqObj,callback){
    new Promise(function(resolve, reject) {
        let itemid = reqObj.itemid;
        let limit = reqObj.limit;
        let serverid = reqObj.serverid;
        let host_id = reqObj.host_id;
        let value_type = reqObj.value_type;
        let service_name = reqObj.service_name;
        let history = reqObj.history;
        let units = reqObj.units;
        let type = reqObj.type;
        //{headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
        if(type=='CLOUD')
        var controller_name='nagios_details_api';
        else
        var controller_name='service_api';
        var url=`${config.ZABBX_URL}/nagios/index.php/api/${controller_name}/get_advanced_services_graph`
        var postData={
            itemid:itemid,
            limit:limit,
            serverid:serverid,
            value_type:value_type,
            service_name:service_name,
            history:history,
            units:units,
            host_id:host_id,
            environment:'zabbix',
            security_key:config.ZABBX_KEY
        }
        //console.log(postData);
        //console.log(reqObj);
        axios.post(url,querystring.stringify(postData))
        .then(response=>{
            //console.log(response.data)
            if(response && response.data)
            return callback(null,{"response":response.data});
            else return callback(1,{"response":[]});
        })
        .catch(error=>{
            //console.log(error)
            return callback(1,{"response":[]});
        })
    });
}
function getHostItemsFromZabbix(reqObj,callback){
    const { ZabbixClient } = require("zabbix-client");
    // zabixApiapplicationGet
    new Promise(function(resolve, reject) {
        let cloud_host_id = reqObj.id;
        monitoringDB.executeQuery("SELECT m.*,vm.metric_group_id FROM zabbix_monitoring as m inner join infra_vms as vm on vm.id=m.cloud_host_id where m.cloud_host_id = '"+cloud_host_id+"'",async function(zabbix_monitoring){
            // console.log(zabbix_monitoring);
            if(zabbix_monitoring.length > 0){
                let serverid = zabbix_monitoring[0].serverid;
                monitoringDB.executeQuery("select * from zabbix_servers where id="+serverid,async function(zabbix_server){
                    let hostid = zabbix_monitoring[0].host_id;
                    //const client = new ZabbixClient(zabbix_server[0].server_name);
                    //const api = await client.login(zabbix_server[0].username, zabbix_server[0].password);
                    zabixApiApplicationGet(zabbix_server[0].id,hostid,async function(cpuGraphs) {
                        // resolve(cpuGraphs);
                        // return callback(null,cpuGraphs);
                        monitoringDB.executeQuery("SELECT * FROM zabbix_metrics_groups where status=1",async function(metricGroups){
                            // console.log(metricGroups);
                            let form = '';
                            form += '<div className="form-group">';
                            form += '<label for="metric_group_id">Select Profile</label>';
                            form += '<select class="form-control" required name="metric_group_id">';
                            for(metricGroupKey in metricGroups) {
                                let metricGroup=metricGroups[metricGroupKey];
                                // console.log(metricGroup);
                                let selected = '';
                                if(zabbix_monitoring[0].metric_group_id == metricGroup.id){
                                    selected = 'selected';
                                }
                                form += '<option value="'+metricGroup.id+'" '+selected+' key="'+metricGroup.id+'">'+metricGroup.group_name+'</option>';
                            }
                            form += '</select></div><br/>';
                            form += '<input type="text" name="hostid" value="' + hostid + '" hidden="hidden">';
                            form += '<input type="text" name="cloud_host_id" value="' + cloud_host_id + '" hidden="hidden" >';
                            form += '<input type="text" name="serverid" value="' + serverid + '" hidden="hidden" >';
                            form += '<table class="table-condensed">';
                            if (cpuGraphs.length > 0) {
                                for(graphKey in cpuGraphs) {
                                    let graphValue=cpuGraphs[graphKey];
                                    // console.log(graphValue);
                                    let appid    = graphValue['applicationid'];
                                    let appname  = graphValue['name'];
                                    // itemgets=[];
                                    // const itemgets = await api.method("item.get").call({
                                    //     'output':'extend',
                                    //     "hostids": hostid,
                                    //     "applicationids" : appid,
                                    //     "filter" : {
                                    //         "status" : "0"
                                    //     }
                                    // });
                                    const itemgets=await new Promise(function(res,rej){
                                        zabixApiItemGet(zabbix_server[0].id,hostid,appid,function(itemdata){
                                            res(itemdata)
                                        });
                                    })
                                    // commonModel.zabixApiItemGet(zabbix_server, hostid, appid,async function(itemgets){
                                        if (itemgets.length > 0) {
                                            // console.log(appid+" ==== "+JSON.stringify(itemgets));
                                            commonModel.getHostParameterList(cloud_host_id, appid,async function(response){
                                                // console.log(response);
                                                let default_params=["CPU Utilisation", "CPU Utilization", "Free inodes on / (percentage)", "Free swap space in %", "ICMP ping"];
                                                for(paramKey in default_params) {
                                                    default_params[paramKey] = default_params[paramKey].toLowerCase();
                                                }
                                                // console.log(default_params);

                                                form += '<tr><th colspan="4" align="left">' + appname + '</th></tr><tr>';
                                                let i = 0;
                                                for(itemKey in itemgets) {
                                                    let checked = '';
                                                    let itemVal=itemgets[itemKey];
                                                    // console.log(itemVal);
                                                    if (i % 4 == 0) {
                                                        form += '</tr><tr>';
                                                    }
                                                    if(typeof itemVal.name === "undefined"){
                                                        continue;
                                                    }
                                                    // console.log((itemVal.name).toLowerCase());
                                                    if(in_array((itemVal.name).toLowerCase(), default_params)){
                                                        checked="checked='checked' disabled";
                                                    }else if (in_array(itemVal.itemid, response)){
                                                        checked="checked='checked'";
                                                    }else{
                                                        checked='';
                                                    }

                                                    var keyBytes = utf8.encode(itemVal.key_);
                                                    var keyBase64data = base64.encode(keyBytes);
                                                    var appnameBytes = utf8.encode(appname);
                                                    var appnameBase64data = base64.encode(appnameBytes);
                                                    var unitsBytes = utf8.encode(itemVal.units);
                                                    var unitsBase64data = base64.encode(unitsBytes);
                                                    var nameBytes = utf8.encode(itemVal.name);
                                                    var nameBase64data = base64.encode(nameBytes);

                                                    form += '<td><input type="checkbox" id="monitorparameters" '+checked+' name="monitorparameters[]" value="'+appid+'_'+nameBase64data+'_'+itemVal['itemid']+'_'+itemVal['value_type']+'_'+itemVal['history']+'_'+keyBase64data+'_'+appnameBase64data+'_'+unitsBase64data+'">&nbsp;' + itemVal['name'];
                                                    if(in_array((itemVal.name).toLowerCase(), default_params)){
                                                        form += '<input type="hidden" id="monitorparameters" name="monitorparameters[]" value="'+appid+'_'+nameBase64data+'_'+itemVal['itemid']+'_'+itemVal['value_type']+'_'+itemVal['history']+'_'+keyBase64data+'_'+appnameBase64data+'_'+unitsBase64data+'" />';
                                                    }
                                                    form += '&nbsp;</td>';
                                                    i++;
                                                }
                                                form += '</tr>';
                                                // console.log(form);
                                            });
                                        }
                                    // });
                                }
                            }
                            form += '</table>';
                            return callback(null,{"htmlForm":form});
                        });
                    })
                    .catch(err => {
                    reject(err);
                    });
                });
            }else{
                return callback(1,"No monitoring host found");
            }
        });
    })
}
function vmItemsSave(formdata) {
    // console.log(formdata);
    // let datetime = dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss");
    return new Promise((resolve,reject) => {
        db.query("DELETE FROM zabbix_monitoring_items WHERE cloud_host_id='"+formdata.cloud_host_id+"'",async (error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;

                var monitorparameters=formdata.monitorparameters;  
                for(key in monitorparameters) 
                {
                    monitorparameter = monitorparameters[key].split("_");
                    await new Promise((resolve,reject) => {
                        let vmItems=[];
                        vmItems.cloud_host_id = formdata.cloud_host_id;
                        vmItems.host_id = formdata.hostid;
                        vmItems.serverid = formdata.serverid;
                        vmItems.application_id = monitorparameter[0];
                        vmItems.parameter_id = monitorparameter[2];
                        vmItems.value_type = monitorparameter[3];
                        vmItems.history = monitorparameter[4];

                        let nameBytes = base64.decode(monitorparameter[1]);
                        let name_text = utf8.decode(nameBytes);
                        vmItems.name_expanded = name_text;
                        let keyBytes = base64.decode(monitorparameter[5]);
                        let key_text = utf8.decode(keyBytes);
                        vmItems.key_ = key_text;
                        let groupBytes = base64.decode(monitorparameter[6]);
                        let group_text = utf8.decode(groupBytes);
                        vmItems.application_group = group_text;
                        let unitsBytes = base64.decode(monitorparameter[7]);
                        let units_text = utf8.decode(unitsBytes);
                        vmItems.units = units_text;
                        vmItems.status = 1;

                        // console.log(vmItems);
                        dbHandler.insertIntoTable('zabbix_monitoring_items',vmItems,function(err,result){
                            //resolve(result)
                            dbHandler.updateTableData('infra_vms',{id:formdata.cloud_host_id},{metric_group_id:formdata.metric_group_id},function(err,result){
                                resolve(result)
                            })
                        })
                    })
                }
                resolve({message:'VM Items Added Successfully'});

                // resolve(rows);
            }
       });    
    });
}
function usageMetricFromApi(reqObj,callback){
    new Promise(function(resolve, reject) {
        let cloud_host_id = reqObj.id;
        let client_id = reqObj.client_id;
        //{headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
        var url=`${config.ZABBX_URL}/nagios/index.php/api/common_api/usage_metric`
        var postData={
            cloud_host_id:cloud_host_id,
            client_id:client_id,
            environment:'live',
            security_key:config.ZABBX_KEY
        }
        axios.post(url,querystring.stringify(postData))
        .then(response=>{
            //console.log(JSON.stringify(response.data))
            if(response && response.data){
                var normal=0; var warning=0; var critical=0;
                if(response.data.response.CPU[0].status){}
                var jsonFormattedData={
                    response:{
                        "CPUperformance": response.data.response.CPU[0].performance,
                        "RAMperformance": response.data.response.RAM[0].performance,
                        "HDDperformance": response.data.response.HDD[0].performance,
                        "CPUstatus": response.data.response.CPU[0].status,
                        "RAMstatus": response.data.response.RAM[0].status,
                        "HDDstatus": response.data.response.HDD[0].status,
                        "CPUcolor": "#FF0202",
                        "RAMcolor": "#098C2F",
                        "HDDcolor": "#098C2F",
                        "services_count": 3,
                        "normal": response.data.service_count.normalCount,
                        "warning": response.data.service_count.warningCount,
                        "critical": response.data.service_count.criticalCount
                    }
                }
                //console.log(jsonFormattedData)
                return callback(null,jsonFormattedData);
            }
            else return callback(1,{"response":[]});
        })
        .catch(error=>{
            //console.log(error)
            return callback(1,{"response":[]});
        })
    });
} 
function getUsageAlerts(reqObj,callback){
    new Promise(function(resolve, reject) {
        var sql=`select id,label_name,clientid from c4_vm_details where status=1 and vm_status!='Deleted' 
        and clientid=${reqObj.clientid} and zabbix_config_status=1 order by label_name asc`
        //console.log(sql)
        dbHandler.executeQuery(sql,async function(results){
            //console.log(results)
            if(!results){
                return callback(1,[]);
            }
            var alertArr=[];
            for await(var vm of results){
                //let cloud_host_id = reqObj.id;
                var client_id = vm.clientid;
                //{headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
                var url=`${config.ZABBX_URL}/nagios/index.php/api/common_api/usage_metric`
                var postData={
                    cloud_host_id:vm.id,
                    client_id:client_id,
                    environment:'live',
                    security_key:config.ZABBX_KEY
                }
                await axios.post(url,querystring.stringify(postData))
                .then(async response=>{
                    if(response && response.data){
                        var alerts={
                            label_name:vm.label_name
                        }
                        if(response.data.response.CPU[0].performance>=90)
                            await Object.assign(alerts,{CPU:response.data.response.CPU[0].performance})
                        if(response.data.response.RAM[0].performance>=90)
                            await Object.assign(alerts,{RAM:response.data.response.RAM[0].performance})
                        if(response.data.response.HDD[0].performance>=90)
                            await Object.assign(alerts,{HDD:response.data.response.HDD[0].performance})

                        if(response.data.response.CPU[0].performance<90 && response.data.response.CPU[0].performance>=85)
                            await Object.assign(alerts,{CPU:response.data.response.CPU[0].performance})
                        if(response.data.response.RAM[0].performance<90 && response.data.response.RAM[0].performance>=85)
                            await Object.assign(alerts,{RAM:response.data.response.RAM[0].performance})
                        if(response.data.response.HDD[0].performance<90 && response.data.response.HDD[0].performance>=85)
                            await Object.assign(alerts,{HDD:response.data.response.HDD[0].performance})
                        
                        if(response.data.response.CPU[0].performance<85)
                            await Object.assign(alerts,{CPU:response.data.response.CPU[0].performance})
                        if(response.data.response.RAM[0].performance<85)
                            await Object.assign(alerts,{RAM:response.data.response.RAM[0].performance})
                        if(response.data.response.HDD[0].performance<85)
                            await Object.assign(alerts,{HDD:response.data.response.HDD[0].performance})
                        await alertArr.push(alerts)
                        //return callback(null,alerts);
                    }
                    //else return callback(1,{"alerts":[]});
                })
                .catch(error=>{
                    //console.log(error)
                    //return callback(1,{"alerts":[]});
                })
            }
            return callback(null,alertArr);
        })
    });
} 
function usageMetrics(reqObj,callback){
    const { ZabbixClient } = require("zabbix-client");
    // zabixApiapplicationGet
    new Promise(function(resolve, reject) {
        let cloud_host_id = reqObj.id;
        monitoringDB.executeQuery("SELECT m.* FROM zabbix_monitoring as m where m.cloud_host_id = '"+cloud_host_id+"'",async function(zabbix_monitoring){
            if(zabbix_monitoring.length > 0){
                let serverid = zabbix_monitoring[0].serverid;
                monitoringDB.executeQuery("select * from zabbix_servers where id="+serverid,async function(zabbix_server){
                    if(zabbix_server.length > 0){
                        let hostid = zabbix_monitoring[0].host_id;
                        let server_type_id = zabbix_server[0].server_type_id;
                        const client = new ZabbixClient(zabbix_server[0].server_name);
                        const api = await client.login(zabbix_server[0].username, zabbix_server[0].password);
                        monitoringDB.executeQuery("select * from healthcheck_params where server_type_id="+server_type_id,async function(zabbix_key_metrics){
                            if(zabbix_key_metrics.length > 0){
                                let FSNAME_arr = [
                                    '/',
                                    'A:',
                                    'B:',
                                    'C:',
                                    'D:',
                                    'E:',
                                    'F:',
                                    'G:',
                                    'H:',
                                    'I:',
                                    'J:',
                                    'K:'
                                ];
                                let CPUParams = [], MemoryParams = [], DiskParams = [], DiskFreeParams = [];
                                zabbix_key_metrics.forEach(function(val,key) {
                                    let paramVal=val.name;
                                    //let parameters = val.name.split("@^");
                                    //parameters.forEach(function(paramVal, paramKey) {
                                        paramVal = paramVal.trim();
                                        if (paramVal.indexOf("{#FSNAME}") !== -1) {
                                            FSNAME_arr.forEach(function(val1, key1) {
                                                let updated_name = paramVal.replace("{#FSNAME}", val1);
                                                if (val.type == 'CPU') {
                                                    CPUParams.push(updated_name);
                                                } else if (val.type == 'Memory') {
                                                    MemoryParams.push(updated_name);
                                                } else if (val.type == 'Disk') {
                                                    if (paramVal.indexOf('pused') !== -1) {
                                                        DiskParams.push(updated_name);
                                                    } else {
                                                        DiskFreeParams.push(updated_name); 
                                                    }
                                                }
                                            });
                                        } else {
                                            if (val.type == 'CPU') {
                                                CPUParams.push(paramVal);
                                            } else if (val.type == 'Memory') {
                                                MemoryParams.push(paramVal);
                                            } else if (val.type == 'Disk') {
                                                if (paramVal.indexOf('pused') !== -1) {
                                                    DiskParams.push(paramVal);
                                                } else {
                                                    DiskFreeParams.push(paramVal);
                                                }
                                            }
                                        }
                                    //});
                                });
                                let itemkey_ = CPUParams.concat(MemoryParams,DiskFreeParams,DiskParams); 
                                const itemlist = await api.method("item.get").call({
                                    'output':[
                                        'key_',
                                        'lastvalue'
                                    ],
                                    "hostids": hostid,
                                    "filter" : {
                                        "key_" : itemkey_
                                    }
                                });
                                CPUPer = 0; MemoryPer = 0; StoragePer = 0; FreeStoragePer = 0;
                                CPUPerArr = []; MemoryPerArr = []; StoragePerArr = []; FreeStoragePerArr = [];
                                itemlist.forEach(function(itemVal, itemKey) {
                                    if (in_array(itemVal.key_, CPUParams)) {
                                        CPUPerArr.push(itemVal.lastvalue);
                                    } else if (in_array(itemVal.key_, MemoryParams)) {
                                        MemoryPerArr.push(itemVal.lastvalue);
                                    } else if (in_array(itemVal.key_, DiskParams)) {
                                        StoragePerArr.push(itemVal.lastvalue);
                                    } else if (in_array(itemVal.key_, DiskFreeParams)) {
                                        FreeStoragePerArr.push(itemVal.lastvalue);
                                    }
                                });

                                if (FreeStoragePerArr.length > 0) {
                                    let sum = FreeStoragePerArr.reduce((a,b) => parseFloat(a) + parseFloat(b),0);
                                    FreeStoragePer = sum / FreeStoragePerArr.length;
                                    StoragePer = 100 - FreeStoragePer;
                                } else if (StoragePerArr.length > 0) {
                                    let sum = StoragePerArr.reduce((a,b) => parseFloat(a) + parseFloat(b),0);
                                    StoragePer = sum / StoragePerArr.length;
                                }
                                if (CPUPerArr.length > 0) {
                                    let sum = CPUPerArr.reduce((a,b) => parseFloat(a) + parseFloat(b),0); 
                                    CPUPer = sum / CPUPerArr.length;
                                }
                                if (MemoryPerArr.length > 0) {
                                    let sum = MemoryPerArr.reduce((a,b) => parseFloat(a) + parseFloat(b),0);
                                    MemoryPer = sum / MemoryPerArr.length;
                                }
                                let final_arr = {};
                                criticalVal = 80;
                                mediumVal = 70;
                                cpustatus = 'LOW';
                                ramstatus = 'LOW';
                                hddstatus = 'LOW';
                                criticalCount = 0;
                                warningCount = 0;
                                normalCount = 0;
                                let colorArr = {
                                    "LOW" : "#098C2F",
                                    "Medium" : "#FFCC33",
                                    "HIGH" : "#FF0202"
                                };
                                if (CPUPer >= criticalVal) {
                                    cpustatus = 'HIGH';
                                    criticalCount ++;
                                }else if (CPUPer >= mediumVal && CPUPer < criticalVal) {
                                    cpustatus = 'Medium';
                                    warningCount ++;
                                } else {
                                    normalCount ++;
                                }

                                if (MemoryPer >= criticalVal) {
                                    ramstatus = 'HIGH';
                                    criticalCount ++;
                                }else if (MemoryPer >= mediumVal && MemoryPer < criticalVal) {
                                    ramstatus = 'Medium';
                                    warningCount ++;
                                } else {
                                    normalCount ++;
                                }

                                if (StoragePer >= criticalVal) {
                                    hddstatus = 'HIGH';
                                    criticalCount ++;
                                }else if (StoragePer >= mediumVal && StoragePer < criticalVal) {
                                    hddstatus = 'Medium';
                                    warningCount ++;
                                } else {
                                    normalCount ++;
                                }
                                final_arr.CPUperformance = (CPUPer > 1) ? parseFloat(CPUPer).toFixed(2) : CPUPer;
                                final_arr.RAMperformance = (MemoryPer > 1) ? parseFloat(MemoryPer).toFixed(2) : MemoryPer;
                                final_arr.HDDperformance = (StoragePer > 1) ? parseFloat(StoragePer).toFixed(2) : StoragePer;

                                final_arr.CPUstatus = cpustatus;
                                final_arr.RAMstatus = ramstatus;
                                final_arr.HDDstatus = hddstatus;

                                final_arr.CPUcolor = colorArr[final_arr.CPUstatus];
                                final_arr.RAMcolor = colorArr[final_arr.RAMstatus];
                                final_arr.HDDcolor = colorArr[final_arr.HDDstatus];

                                final_arr.services_count = 3;
                                final_arr.normal = normalCount;
                                final_arr.warning = warningCount;
                                final_arr.critical = criticalCount;

                                return callback(null,{"response":final_arr});
                            }
                        });
                    }else{
                        //return callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                        return callback(1,{"response":[]});
                    }
                });
            }else{
                //return callback(1,"No monitoring host found");
                return callback(1,{"response":[]});
            }
        });
    })
}
function uptimeReport(reqObj,callback){
    new Promise(function(resolve, reject) {
        let vm_id = reqObj.vm_id;
        clientid = reqObj.clientid;
        setup_type = reqObj.setup_type;
    	if(typeof(vm_id)=='undefined' || vm_id==''){
          var response={status:"error",message:'vm_id is missing'}
          return callback(1,response);
        }
    	if(typeof(clientid)=='undefined' || clientid==''){
          var response={status:"error",message:'clientid is missing'}
          return callback(1,response);
        }
    	if(typeof(setup_type)=='undefined' || setup_type==''){
            var response={status:"error",message:'setup_type is missing'}
            return callback(1,response);
        }
    	
    	let sql = "SELECT ud.* FROM c4_uptime_reports as ud where ud.vm_id = '"+vm_id+"' and ud.client_id = '"+clientid+"' and ud.setup_type = '"+setup_type+"'";
        dbHandler.executeQuery(sql,async function(uptime_downtime_report){
            if(uptime_downtime_report.length > 0){
                uptime_downtime_report_new = [];
                uptime_downtime_report.forEach(function(val, key) {
                    uptime_downtime_report_new[key] = val;
                    uptime_downtime_report_new[key]['from_date'] = uptime_downtime_report_new[key]['from_date'];
                    uptime_downtime_report_new[key]['to_date'] = uptime_downtime_report_new[key]['to_date'];
                    uptime_downtime_report_new[key]['download_path'] = config.OLDAPP_PORTAL_URL+"DownloadInvoice/prepareZbxUptimeReport/"+uptime_downtime_report_new[key]['token']+"/"+uptime_downtime_report_new[key]['id']+"/"+((uptime_downtime_report_new[key]['file_path'])?uptime_downtime_report_new[key]['file_path']:"");
                });
                
                return callback(null,{"response":uptime_downtime_report_new});
            }else{
                return callback(null,{"response":[],"message":"No data found"});
            }
        });
    })
}
function addUptimeReport(formData) {
    let from_date = dateFormat(new Date(formData.from_date), "yyyy-mm-dd");
    //from_date = from_date.getTime();
    //let from_date_timeStamp = Math.round(from_date/1000);

    let to_date = dateFormat(new Date(formData.to_date), "yyyy-mm-dd");
    //to_date = to_date.getTime();
    //let to_date_timeStamp = Math.round(to_date/1000);
    
    var dataValues = {
		setup_type:((typeof(formData.setup_type)!='undefined' && formData.setup_type != '')?formData.setup_type:0),
        client_id:formData.clientid,
        vm_id: formData.vm_id,        
        token: '',
        status : 0,
        from_date : from_date,
        to_date : to_date,
        createdate : Math.floor(Date.now() / 1000),
        updatedate : Math.floor(Date.now() / 1000)
      };
      var postParams={
        setup_type:dataValues.setup_type,
        security_key:config.ZABBX_KEY,
        environment:'zabbix',
        client_id:formData.clientid,
        cloud_host_id:formData.vm_id,
        from_date:from_date,
        to_date:to_date,
    }
     return new Promise((resolve,reject) => {
    	 url = `${config.ZABBX_URL}/nagios/index.php/api/nagios_details_api/get_zabbix_token`;
    	 if(postParams.setup_type == 1){
    		 url = `${config.ZABBX_URL}/nagios/index.php/api/service_api/get_zabbix_token`;
    	 }
        axios.post(url,
        querystring.stringify(postParams))
        .then(response => {
            console.log(response.data);
            dataValues.token=response.data.response.token_no;
            //if(response.data.response.is_data_ready=='Yes')
            //dataValues.status=1;
                db.query("INSERT INTO c4_uptime_reports SET ?", dataValues ,(error,rows,fields)=>{
                    if(error) {
                        dbFunc.connectionRelease;
                        reject(error);
                    } else {
                        dbFunc.connectionRelease;
                        resolve(rows);
                    }
                })
            })
            .catch(error => {
                console.log(error);
                resolve([]);
            });
    });
}

function usageReport(reqObj,callback){
    new Promise(function(resolve, reject) {
        let vm_id = reqObj.id;
        dbHandler.executeQuery("SELECT ud.* FROM c4_usage_reports as ud where ud.vm_id = '"+vm_id+"'",async function(uptime_downtime_report){
            if(uptime_downtime_report.length > 0){
                uptime_downtime_report_new = [];
                uptime_downtime_report.forEach(function(val, key) {
                    uptime_downtime_report_new[key] = val;
                    uptime_downtime_report_new[key]['from_date'] = uptime_downtime_report_new[key]['from_date'];
                    uptime_downtime_report_new[key]['to_date'] = uptime_downtime_report_new[key]['to_date'];
                    uptime_downtime_report_new[key]['download_path'] = base64.encode (uptime_downtime_report_new[key]['token']+".pdf");
                });
                
                return callback(null,{"response":uptime_downtime_report_new});
            }else{
                return callback(null,{"response":[],"message":"No data found"});
            }
        });
    })
}
function addUsageReport(formData) {
    let from_date = dateFormat(new Date(formData.from_date), "yyyy-mm-dd");
    //from_date = from_date.getTime();
    //let from_date_timeStamp = Math.round(from_date/1000);

    let to_date = dateFormat(new Date(formData.to_date), "yyyy-mm-dd");
    //to_date = to_date.getTime();
    //let to_date_timeStamp = Math.round(to_date/1000);
    
    var dataValues = {
        client_id:formData.clientid,
        vm_id: formData.vm_id,        
        token: '',
        status : 0,
        from_date : from_date,
        to_date : to_date,
        createdate : Math.floor(Date.now() / 1000),
        updatedate : Math.floor(Date.now() / 1000)
      };
      var postParams={
    		  security_key:config.ZABBX_KEY,
    		  client_id:formData.clientid,
    		  cloud_host_id:formData.vm_id,
    		  from_date:from_date,
    		  to_date:to_date,
      }
     return new Promise((resolve,reject) => {
        axios.post(`${config.ZABBX_URL}/nagios/index.php/api/common_api/create_usage_data_token`,
        querystring.stringify(postParams))
        .then(response => {
            console.log(response.data);
            dataValues.token=response.data.response.token_no;
            //if(response.data.response.is_data_ready=='Yes')
            //dataValues.status=1;
            db.query("INSERT INTO c4_usage_reports SET ?", dataValues ,(error,rows,fields)=>{
                if(error) {
                    dbFunc.connectionRelease;
                    reject(error);
                } else {
                    dbFunc.connectionRelease;
                    resolve(rows);
                }
            })
        })
        .catch(error => {
            console.log(error);
            resolve([]);
        });
    });
}

function utilizationReport(reqObj,callback){
	let vm_id = reqObj.vm_id;
    clientid = reqObj.clientid;
    setup_type = reqObj.setup_type;
	if(typeof(vm_id)=='undefined' || vm_id==''){
      var response={status:"error",message:'vm_id is missing'}
      return callback(1,response);
    }
	if(typeof(clientid)=='undefined' || clientid==''){
      var response={status:"error",message:'clientid is missing'}
      return callback(1,response);
    }
	if(typeof(setup_type)=='undefined' || setup_type==''){
        var response={status:"error",message:'setup_type is missing'}
        return callback(1,response);
    }
    new Promise(function(resolve, reject) {
        let sql = "SELECT ud.* FROM c4_utilization_reports as ud where ud.vm_id = '"+vm_id+"' and ud.client_id = '"+clientid+"' and ud.setup_type = '"+setup_type+"'";
        sql +=" order by ud.id desc";
        dbHandler.executeQuery(sql,async function(uptime_downtime_report){
            if(uptime_downtime_report.length > 0){
                uptime_downtime_report_new = [];
                ids = [];
                uptime_downtime_report.forEach(function(val, key) {
                    uptime_downtime_report_new[key] = val;
                    uptime_downtime_report_new[key]['from_date'] = uptime_downtime_report_new[key]['from_date'];
                    uptime_downtime_report_new[key]['to_date'] = uptime_downtime_report_new[key]['to_date'];
                    uptime_downtime_report_new[key]['download_path'] = config.OLDAPP_PORTAL_URL+"monitoring/prepareUtilizationReport/"+uptime_downtime_report_new[key]['token'];
                    if(uptime_downtime_report_new[key]['status'] == 0){
                    	ids.push(uptime_downtime_report_new[key]['id'])
                    }
                });
                if(ids.length > 0){
                	var request = require('request');
                	var options = {
                	  'method': 'POST',
                	  'url': config.OLDAPP_PORTAL_URL+'monitoring/getUtilizationReportsStatus',
                	  formData: {
                	    'vm_id': encodeURIComponent(base64.encode(vm_id)),
                	    'report_ids': ids.join(),
                	    'clientid': clientid
                	  }
                	};
                	console.log("options");
                	console.log(options);
                	request(options, function (error, response) {
                	  if (error) {
                		  //throw new Error(error);
                		  console.log("error");
                		  console.log(error);
                	  }
                	  console.log(response.body);
                	});
                }
                return callback(null,{"response":uptime_downtime_report_new});
            }else{
                return callback(null,{"response":[],"message":"No data found"});
            }
        });
    })
}
function addUtilizationReport(formData) {
    let from_date = dateFormat(new Date(formData.from_date), "yyyy-mm-dd");
    //from_date = from_date.getTime();
    //let from_date_timeStamp = Math.round(from_date/1000);
    
    let to_date = dateFormat(new Date(formData.to_date), "yyyy-mm-dd");
    //to_date = to_date.getTime();
    //let to_date_timeStamp = Math.round(to_date/1000);
    
    var dataValues = {
		setup_type:((typeof(formData.setup_type)!='undefined' && formData.setup_type != '')?formData.setup_type:0),
        client_id: formData.clientid,
        vm_id: formData.vm_id,        
        token: '',
        status : 0,
        from_date : from_date,
        to_date : to_date,
        createdate : Math.floor(Date.now() / 1000),
        updatedate : Math.floor(Date.now() / 1000)
      };
      var postParams={
    	setup_type:dataValues.setup_type,
        security_key:config.ZABBX_KEY,
        environment:'zabbix',
        client_id:formData.clientid,
        cloud_host_id:formData.vm_id,
        start_date:from_date,
        end_date:to_date,
    }
     return new Promise((resolve,reject) => {
    	 url = `${config.ZABBX_URL}/nagios/index.php/api/nagios_details_api/get_zabbix_graph_token`;
    	 if(postParams.setup_type == 1){
    		 url = `${config.ZABBX_URL}/nagios/index.php/api/service_api/get_zabbix_graph_token`;
    	 }
        axios.post(url,
        querystring.stringify(postParams))
        .then(response => {
            console.log(response.data);
            dataValues.token=response.data.response.token_no;
            //if(response.data.response.is_graph_ready==1)
            //dataValues.status=1;
            db.query("INSERT INTO c4_utilization_reports SET ?", dataValues ,(error,rows,fields)=>{
                if(error) {
                    dbFunc.connectionRelease;
                    reject(error);
                } else {
                    dbFunc.connectionRelease;
                    resolve(rows);
                }
            })
        })
        .catch(error => {
            console.log(error);
            resolve([]);
        });
    });
}

function getAllGroups() {
    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM zabbix_metrics_groups",(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows)
            }
       });
    }).then(async function(groups){
        if(!groups) return Array();
        var final=groups;
        var finalArr=await new Promise(async (resolve,reject) => {
            for(k in groups){
                var group_id=groups[k].id;
                final[k]=groups[k];
                var groupData=await new Promise((resolve,reject) => {
                    dbHandler.executeQuery('SELECT * FROM zabbix_key_metrics where group_id="'+group_id+'"',function(result){
                        resolve(result)
                    })
                })
                for(key in groupData){
                    var arr=groupData[key];
                    final[k][arr.type]=arr.name;
                }
            }
            resolve(final)
        })  
        return finalArr;    
   })       
}
function addGroup(formdata) {
    let datetime = dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss"); 
    new Promise((resolve,reject) => {  
        db.query("SELECT * FROM zabbix_metrics_groups WHERE group_name='"+formdata.group_name+"'",
        (error, rows, fields) => {
        	dbFunc.connectionRelease;
          if (error) {
            reject(error);
          } else if (rows.length > 0) {
            reject({
              success: false,
              message: "Group name already exist ! try with different group name"
            });
          } else {
            var userValues = {
                group_name: formdata.group_name,
                status: formdata.status,
                created_by: formdata.clientid,
                created_date: datetime
            };
            db.query("INSERT INTO zabbix_metrics_groups SET ?", userValues ,(error,rows,fields)=>{
                if(error) {
                    dbFunc.connectionRelease;
                    console.log(error);
                    reject(error);
                } else {
                    var insertId=rows.insertId;
                    dbFunc.connectionRelease;
                    resolve(insertId)
               }
            
            });
          }
        }
      );
    }).then(async function(insertId){
        var arrType=['CPU','Disk','Memory'];  
        for(type in arrType) 
        {
            await new Promise((resolve,reject) => {
                var groupValues=[];  var typeValue=arrType[type]; 
                var grouparr=formdata.group;
                //console.log(grouparr)
                groupValues.group_id = insertId;
                groupValues.type = typeValue;
                if(grouparr[typeValue])
                groupValues.name = grouparr[typeValue];
                groupValues.updated_by = formdata.clientid;
                groupValues.updated_date = datetime;
                //console.log(groupValues)
                dbHandler.insertIntoTable('zabbix_key_metrics',groupValues,function(err,result){
                    resolve(result)
                })
            })
        }
        return {message:'Done'}
    })
}
function editGroup(formdata,callback) {
    let datetime = dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss"); 
    new Promise((resolve,reject) => {  
        db.query("SELECT * FROM zabbix_metrics_groups WHERE id='"+formdata.id+"'",
        (error, rows, fields) => {
          if (error) {
            dbFunc.connectionRelease;
            reject(error);
          } else if (rows.length > 0) {
            dbFunc.connectionRelease;
            resolve(rows[0])
          }
        });
    }).then(async function(group){
        var arrType=['CPU','Disk','Memory']; 
        await dbHandler.updateTableData('zabbix_metrics_groups',{id:group.id},{status:formdata.status},function(err,result){
        }) 
        for(type in arrType) 
        {
            await new Promise(async (resolve,reject) => {
                var groupValues=[];  var typeValue=arrType[type]; 
                var grouparr=formdata.group;
                groupValues.group_id = group.id;
                groupValues.type = typeValue;
                if(grouparr[typeValue])
                groupValues.name = grouparr[typeValue];
                groupValues.updated_by = formdata.clientid;
                groupValues.updated_date = datetime;
                await new Promise((resolve,reject) => {
                    dbHandler.getOneRecord('zabbix_key_metrics',{type:typeValue,group_id:group.id},function(result){
                        resolve(result)
                    })
                }).then(async function(result){
                    if(!result){
                        await dbHandler.insertIntoTable('zabbix_key_metrics',groupValues,function(err,result){
                            resolve(result)
                        })
                    }else{
                       await dbHandler.updateTableData('zabbix_key_metrics',{type:typeValue,group_id:group.id},groupValues,function(err,result){
                            resolve(result)
                        })
                    }
                })
            })
        }
        return 'ok';        
    })
}

function getAllAlerts()
{
    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM zabbix_alerts",(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows)
            }
       });
    })
}

module.exports = monitoringModel;

