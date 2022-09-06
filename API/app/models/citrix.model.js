var db = require('../../config/database');
var dbFunc = require('../../config/db-function');
const helper=require('../../helpers/common_helper');
const axios = require('axios');
var dateFormat=require('dateformat');
const dbHandler= require('../../config/api_db_handler');
const connpool=require('../../config/db_mssql');
var querystring = require('querystring');
var base64 = require('base-64');
var vmlistModel = {
    getAllVmlist, 
    getVmDetailbyId,
    addVm,vmResize,
    vmOperations,
    vmLogs,veeamOperations
}
let get_access_token=(clientid,callback)=>{
    new Promise((resolve,reject) => {
        dbHandler.getOneRecord('citrix_api_token',{clientid:1},function(result){
            if(!result)callback(400);
            else resolve(result);
        })
    }).then(function(result){
        console.log('token request triggered')
        axios.post(`http://198.18.2.170:9890/api/create_access_token`,querystring.stringify(result),{headers: {'Content-Type': 'application/x-www-form-urlencoded' }})
        .then(response => {
            console.log(response.data)
            if(response.data.data.access_token){
                dbHandler.updateTableData('citrix_api_token',{clientid:1},{access_token:response.data.data.access_token},function(err,result){})
                callback(null,response.data.data.access_token);
            }
            else callback(400);
        })
        .catch(error => {
            console.log(error);
            callback(null,'Error');
        }); 
    })       
}
function syncVmFromApiServer(clientid) {
    return new Promise((resolve,reject) => {
        dbHandler.getOneRecord('citrix_api_token',{clientid:1},function(result){
            if(result){
                var token='notoken';
                if(result.access_token)token=result.access_token;
                axios.get(`http://198.18.2.170:9890/api/vm_list`,{headers: {'Authorization':token,'Content-Type': 'application/x-www-form-urlencoded' }})
                .then(response => {
                    //console.log(response.data)
                    console.log("First time triggered")
                    resolve(response.data.data);
                })
                .catch(error => {
                    resolve([])
                    //console.log("Error:"+error);
                }); 
            }
        })
    })
}
function searchVmNameFromApiServer(clientid,vm_name) {
    return new Promise((resolve,reject) => {
        dbHandler.getOneRecord('citrix_api_token',{clientid:1},function(result){
            if(result){
                var token='notoken';
                if(result.access_token)token=result.access_token;
                axios.post(`http://198.18.2.170:9890/api/vm_detail`,{vm_name:vm_name},{headers: {'Authorization':token,'Content-Type': 'application/x-www-form-urlencoded' }})
                .then(response => {
                    //console.log(response.data)
                    console.log("First time triggered")
                    resolve(response.data.data);
                })
                .catch(error => {
                   resolve([])
                    //console.log("Error:"+error);
                }); 
            }
        })
    })
}
function getAllVmlist(clientid) {
    return new Promise((resolve,reject) => {
       var sql=`SELECT vm.*,vdc.location from c4_vm_details as vm inner join c4_vdc as vdc on vm.vdc_id=vdc.id WHERE vm.clientid=${clientid} and vm.cloudid=2 and vm.status=1 and vm.vm_status not in('Deleted','CreationFailed') order by vm.label_name asc`;
       db.query(sql,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
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
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows)
            }
       });
    });
}

function getVmBackupDetail(clientid,vm_id,callback) {
    new Promise((resolve,reject) => {
        var sql=`select vdc.curlpath,vm.ref_id from c4_vdc_tech_disk as vdc inner join c4_vm_details as vm on vm.vdc_id=vdc.vdc_id
         and vm.tech_id=vdc.tech_id where vm.clientid=${clientid} and vm.id=${vm_id} and vm.cloudid=2`
        dbHandler.executeQuery(sql,function(result){
            resolve(result)
        })
    }).then(async function(vdc){
        if(!vdc)callback(null,'The operation did not execute as expected. Please raise a ticket to support');
        var url=vdc[0].curlpath;
        var postParams={user_id:clientid,ref_id:vdc[0].ref_id}
        await dbHandler.getOneRecord('citrix_api_token',{clientid:1},function(result){
            if(result){
                var token='notoken';
                if(result.access_token)token=result.access_token;
                axios.post(`${url}get_backup_detail`,querystring.stringify(postParams),{headers: {'Authorization':token,'Content-Type': 'application/x-www-form-urlencoded' }})
                .then(response => {
                    console.log("First time triggered")
                    if(response.data){
                        callback(response.data);
                    }
                    else
                    callback([]);
                })
                .catch(error => {
                    callback([]);
                }); 
            }
        })
    })
}
function getVmDetailbyId(clientid,vm_id) {
    return new Promise((resolve,reject) => {
        var sql=`SELECT vm.*,vdc.location from c4_vm_details as vm inner join c4_vdc as vdc on vm.vdc_id=vdc.id
         WHERE vm.id=${vm_id} and vm.clientid=${clientid}`;
        db.query(sql,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                var result={vm:[],jobdata:[]}
                getVmBackupDetail(clientid,vm_id,function(jobdata){
                    result.vm=rows[0]
                    result.jobdata=jobdata
                    resolve(result);
                })
                
            }
       });
    });  
}
function veeamOperations(reqObj,callback){
    var querystring = require('querystring');
    var clientid=base64.decode(reqObj.clientid);
    var ref_id=base64.decode(reqObj.ref_id);
    var vm_id=base64.decode(reqObj.vm_id);
    let postParams={ref_id:ref_id,job_id:reqObj.job_id,user_id:clientid,job_name:''}
    new Promise((resolve,reject) => {
        var sql=`select vdc.curlpath,vm.label_name from c4_vdc_tech_disk as vdc inner join c4_vm_details as vm on vm.vdc_id=vdc.vdc_id
         and vm.tech_id=vdc.tech_id where vm.clientid=${clientid} and vm.id=${vm_id} and vm.cloudid=2`
        dbHandler.executeQuery(sql,function(result){
            resolve(result)
        })
    }).then(async function(vdc){
        if(!vdc)callback(null,'The operation did not execute as expected. Please raise a ticket to support');
        var url=vdc[0].curlpath;
        var method_name='';
        if(reqObj.action=='create'){
            method_name='create_backup_job';
            postParams.job_name=`${vdc[0].label_name}_${Math.floor(Math.random() * Math.floor(8654987654))}_backup`
        }
        console.log(postParams)
        if(reqObj.action=='delete'){
            method_name='delete_backup_job';
        }
        var insertArr={
            vmid:vm_id,
            type:method_name,
            description:reqObj.action+' Backup Job',
            createddate:parseInt(new Date()/1000),
            clientid:clientid
        }
        await new Promise(function (resolve, reject) {
            dbHandler.insertIntoTable('c4_vm_logs',insertArr,function(err,result){
                resolve(result)
            })
        });
        await axios.post(`${url}${method_name}`,querystring.stringify(postParams),{headers: {'Content-Type': 'application/x-www-form-urlencoded' }})
        .then(response => {
            console.log(response.data)
            if(response.data){
                callback(null,response.data);
            }else{
                callback(null,'The operation did not execute as expected. Please raise a ticket to support');
            }
        })
        .catch(error => {
            console.log("Error:"+error);
            callback(error,null);
        });        
    })
}
function vmOperations(reqObj,callback){
    var clientid=base64.decode(reqObj.clientid);
    var ref_id=base64.decode(reqObj.ref_id);
    var vm_id=base64.decode(reqObj.vm_id);
    new Promise((resolve,reject) => {
        var sql=`select vdc.curlpath from c4_vdc_tech_disk as vdc inner join c4_vm_details as vm on vm.vdc_id=vdc.vdc_id
         and vm.tech_id=vdc.tech_id where vm.clientid=${clientid} and vm.id=${vm_id} and vm.cloudid=2`
        dbHandler.executeQuery(sql,function(result){
            resolve(result)
        })
    }).then(async function(vdc){
        if(!vdc)callback(null,'The operation did not execute as expected. Please raise a ticket to support');
        var url=vdc[0].curlpath;
        let postParams = { "ref_id": ref_id, "action": reqObj.action,"user_id":clientid};
        let vm_status='';var action_no=0;
        switch(reqObj.action){
            case 'stop': vm_status='PoweredOff';action_no=2;break;
            case 'start': vm_status='Running';action_no=1;break;
            case 'restart': vm_status='Running';action_no=4;break;
            //case 'delete': vm_status='Deleted';action_no=3;break;
        }
        var insertArr={
            vmid:vm_id,
            type:action_no,
            description:vm_status+' VM',
            createddate:parseInt(new Date()/1000),
            clientid:clientid
        }
        await new Promise(function (resolve, reject) {
            dbHandler.insertIntoTable('c4_vm_logs',insertArr,function(err,result){
                resolve(result)
            })
        });
        dbHandler.getOneRecord('citrix_api_token',{clientid:1},function(result){
            if(result){
                var token='notoken';
                if(result.access_token)token=result.access_token;
                axios.post(`${url}vm_operation`,querystring.stringify(postParams),{headers: {'Authorization':token,'Content-Type': 'application/x-www-form-urlencoded' }})
                .then(response => {
                    //console.log(response.data)
                    console.log("First time triggered")
                    if(response.data){
                        dbHandler.updateTableData('c4_vm_details',{id:vm_id},{vm_status:vm_status},function(err,result){
                            callback(null,response.data);
                        })
                    }
                    else
                    callback(null,'The operation did not execute as expected. Please raise a ticket to support');
                })
                .catch(error => {
                    callback(null,'The operation did not execute as expected. Please raise a ticket to support');
                }); 
            }
        })
    })
}

function vmResize(postParams,callback){
    var clientid=postParams.user_id;
    var vm_id=postParams.vm_id;
    var insertArr={
        vmid:vm_id,
        type:0,
        description:'Resizing VM',
        createddate:parseInt(new Date()/1000),
        clientid:clientid
    }
    new Promise(function (resolve, reject) {
        dbHandler.insertIntoTable('c4_vm_logs',insertArr,function(err,result){
            resolve(result)
        })
    });
    dbHandler.getOneRecord('citrix_api_token',{clientid:1},function(result){
        if(result){
            var token='notoken';
            if(result.access_token)token=result.access_token;
            axios.post(`http://198.18.2.170:9890/api/update_cpu_memory`,querystring.stringify(postParams),{headers: {'Authorization':token,'Content-Type': 'application/x-www-form-urlencoded' }})
            .then(response => {
                //console.log(response.data)
                console.log("First time triggered")
                if(response.data)
                callback(null,response.data);
                else
                callback(null,'The operation did not execute as expected. Please raise a ticket to support');
            })
            .catch(error => {
                callback(null,'The operation did not execute as expected. Please raise a ticket to support');
            }); 
        }
    })
}

function addVm(reqObj,callback) {
    let formData = reqObj.body;
    let cts = Math.round(new Date().getTime() / 1000);
    var orderValues = {
        order_number: helper.getRandomNumber(),
        clientid: formData.client_id,
        createddate : cts
      };
    let ram_size_in_mb = formData.ram*1024*((formData.ram_units_type== "GB")?1:1024);
    let disk_size_in_gb = formData.disk_size*((formData.disk_size_units_type== "GB")?1:1024);
    return new Promise((resolve,reject) => {
        db.query("INSERT INTO app_orders SET ?", orderValues ,(error,orderRows,fields)=>{
            if(error) {
                dbFunc.connectionRelease;
                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                reject(error);
            } else {
                dbFunc.connectionRelease;
                let order_id = orderRows.insertId;
                orderDetailsValues = {
                    order_id: order_id,
                    configuration : JSON.stringify({"tech_id":"1",
                                    "vdc_id":"1",
                                    "ram":ram_size_in_mb,
                                    "disk":disk_size_in_gb,
                                    "cpus":formData.cpu,
                                    "bandwidth":null,
                                    "osid":formData.os_id,
                                    "clientid":formData.client_id
                                    }),
                    clientid: formData.client_id,
                    createddate : cts,
                    copy_type:"1C",
                    quantity:"1",
                    order_type:"CLOUD",
                    billing_frequency:"FREE"
                };
                db.query("INSERT INTO app_order_details SET ?", orderDetailsValues ,async (error,orderDetailRows,fields)=>{
                    if(error) {
                        dbFunc.connectionRelease;
                        callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                        reject(error);
                    } else {
                        dbFunc.connectionRelease;
                        let order_detail_id = orderDetailRows.insertId;

                        const clientDetails = await new Promise((clientResolve,reject) => {
                            db.query("SELECT company_name FROM app_clients WHERE id ="+formData.client_id+" limit 1",(error,rows,fields)=>{
                                if(!!error) {
                                    dbFunc.connectionRelease;
                                    callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                                    reject(error);
                                } else {
                                    dbFunc.connectionRelease;
                                    clientResolve(rows);
                                }
                            });
                        });
                        let company_name = clientDetails[0].company_name;
                        let company_name_string = company_name.replace(" ", '');
                        company_name_string = company_name_string.replace(/[\W_]+/g, '');
                        const osDetails = await new Promise((osResolve,reject) => {
                            db.query("SELECT * FROM infra_vm_templates WHERE id ="+formData.os_id+" limit 1",(error,rows,fields)=>{
                                if(!!error) {
                                    dbFunc.connectionRelease;
                                    callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                                    reject(error);
                                } else {
                                    dbFunc.connectionRelease;
                                    osResolve(rows);
                                }
                            });
                        });
                        var baseUrl = reqObj.protocol + '://' + reqObj.get('host');
                        let vmValues = {};
                        vmValues.vdc_id = formData.vdc_id;
                        vmValues.vm_name = company_name_string+"_"+order_id;
                        vmValues.host_name = company_name_string+"_"+order_id;
                        vmValues.cpu_count = formData.cpu;
                        vmValues.disk_type = formData.disk_type;
                        vmValues.memory_mb = ram_size_in_mb;
                        vmValues.disk_size = disk_size_in_gb;
                        vmValues.user_id = formData.client_id;
                        vmValues.template_name = osDetails[0].vcenter_temp_name;
                        vmValues.cloud_type = "CLOUD";
                        vmValues.order_id = order_id;
                        vmValues.network_id  = formData.network_id;
                        await axios.post(baseUrl+'/vmware/vm_creation',vmValues)
                        .then(response => {
                            //console.log(response);
                            // updateApiLog({error_log:err},logId,function(result){})
                            var response={message:'Your VM creation request is submitted successfully.'};
                            callback(null,response);
                            resolve(response);
                        })
                        .catch(error => {
                            // console.log(error.response.data.message);
                            // updateApiLog({error_log:error},logId,function(result){})
                            callback(1,error.response.data.message);
                            reject(error.response.data.message);
                        });
                    }
                });
                // resolve(rows);
            }
        });
    });
}
function addScheduler(reqObj,callback) {
    var inputs=reqObj.body
    if(!inputs.vdc_id) return callback(400,'Please provide the vdc_id')
    if(!inputs.vm_id) return callback(400,'Please provide the vm_id')
    if(!inputs.scheduler_type) return callback(400,'Please provide the scheduler_type')
    if(!inputs.start_on_off) return callback(400,'Please provide the start_on_off')
    if(inputs.scheduler_type=='weekly' && !inputs.week_day)
    {
        return callback(400,'Please provide the week_day')
    }else{
        var week_day=inputs.week_day;
    }
    if(!inputs.start_hour) return callback(400,'Please provide the start_hour')
    if(!inputs.start_min) return callback(400,'Please provide the start_min')
    //if(!inputs.start_ampm) return callback(400,'Please provide the start_ampm')
    if(!inputs.after_hr) return callback(400,'Please provide the after_hr')
    if(!inputs.after_min) return callback(400,'Please provide the after_min')
    //if(!inputs.end_ampm) return callback(400,'Please provide the end_ampm')
    if(!inputs.status) return callback(400,'Please provide the status')
    var start_time=inputs.start_hour+':'+inputs.start_min+':00';
    var totalminutes=parseInt((inputs.after_hr*60))+parseInt(inputs.after_min);
    //dateFormat(new Date(creation_date),"yyyy-mm-dd HH:MM:ss");
    var d1 = dateFormat(new Date(),"yyyy-mm-dd");
    d1=(d1+' '+start_time).toString();
    var d = new Date(d1);
    d.setMinutes(d.getMinutes() + totalminutes);
    var d2 = dateFormat(new Date(d),"yyyy-mm-dd HH:MM:ss");
    var end_time=dateFormat(d2,"HH:MM:ss");
    new Promise(function(resolve, reject) {
        dbHandler.getOneRecord('infra_scheduler',{vm_id:inputs.vm_id},function(checkVM){
            if(checkVM) {
                return resolve(checkVM)
            }else{
                resolve([])
            }
        })
    }).then(function(scheduler){
        if(inputs.scheduler_type=='daily')week_day='';
        var insertArr=[];
        insertArr.vm_id=inputs.vm_id;
        insertArr.vdc_id=inputs.vdc_id;
        insertArr.scheduler_type=inputs.scheduler_type;
        insertArr.week_day=week_day;
        insertArr.start_hour=inputs.start_hour;
        insertArr.start_min=inputs.start_min;
        insertArr.start_time=start_time;
        insertArr.end_time=end_time;
        insertArr.after_hr=inputs.after_hr;
        insertArr.after_min=inputs.after_min;
        insertArr.start_on_off=inputs.start_on_off;
        insertArr.status=inputs.status;
        var insertedId=0;
        if(scheduler.length == 0){
            insertArr.created_date=dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss");
            insertedId=new Promise(function (resolve, reject) {
                dbHandler.insertIntoTable('infra_scheduler',insertArr,function(err,result){
                    resolve(result)
                })
            });
        }else{
            if(inputs.scheduler_type=='daily')week_day='';
            var updateArr={
                'scheduler_type':inputs.scheduler_type,
                'week_day':week_day,
                'start_time':start_time,
                'end_time':end_time,
                'start_hour':inputs.start_hour,
                'start_min':inputs.start_min,
                'after_hr':inputs.after_hr,
                'after_min':inputs.after_min,
                'start_on_off':inputs.start_on_off,
                'status':inputs.status
            }
            insertedId=new Promise(function(resolve, reject){
                dbHandler.updateTableData('infra_scheduler',{id:scheduler.id},updateArr,function(err,result){
                    resolve(result)
                });
            })
        }
        if(insertedId){
            var response={message:'Record updated successfully.'};
            callback(null,response);
        }else{
            var response={message:'The operation did not execute as expected. Please raise a ticket to support'};
            callback(400,response);
        }
    })
}

function getVmLogsbyId(id) {
    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM infra_api_log WHERE vm_id ="+id.id+" order by id desc limit 200",(error,rows,fields)=>{
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
function getScheduleList(vdc_id) {
    return new Promise((resolve,reject) => {
		if(vdc_id!=0){
            var sql=`SELECT sch.*,vm.name,vm.ip_address,vm.cpu_count,vm.ram,vm.hdd,grp.group_name FROM infra_vms as vm inner join vm_groups as grp on vm.vm_groupid=grp.id inner join infra_scheduler as sch on sch.vm_id=vm.id where vm.vdc_id=${vdc_id} order by sch.id desc`;
        }else{
            var sql=`SELECT sch.*,vm.name,vm.ip_address,vm.cpu_count,vm.ram,vm.hdd,grp.group_name FROM infra_vms as vm inner join vm_groups as grp on vm.vm_groupid=grp.id inner join infra_scheduler as sch on sch.vm_id=vm.id  order by sch.id desc`;
        }
        db.query(sql,(error,rows,fields)=>{
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
function getVmNotScheduleList(vdc_id) {
    return new Promise((resolve,reject) => {
		if(vdc_id!=0){
            var sql=`SELECT vm.id,vm.name,vm.status FROM infra_vms as vm where vm.vdc_id=${vdc_id} and vm.id not in(select vm_id from infra_scheduler where vdc_id=${vdc_id}) order by vm.name asc`;
        }else{
            var sql=`SELECT vm.id,vm.name,vm.status FROM infra_vms as vm where vm.id not in(select vm_id from infra_scheduler) order by vm.name asc`;
        }
        db.query(sql,(error,rows,fields)=>{
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
function getAllVmGrouplist() {
    return new Promise((resolve,reject) => {
        db.query(`SELECT grp.*,vdc.vdc_name FROM vm_groups as grp inner join infra_vdc as vdc on grp.vdc_id=vdc.vdc_id order by grp.id desc`,(error,rows,fields)=>{
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
function updateVmCreateDate(reqObj,callback){
    let creation_date=reqObj.creation_date;
    let datetime = dateFormat(new Date(creation_date),"yyyy-mm-dd HH:MM:ss");
    var vm_id=reqObj.vm_id;
    return new Promise((resolve,reject) => {
        sqlquerry = "Update infra_vms set creation_date='" + datetime + "' where id=" + vm_id;
        db.query(sqlquerry, (error, rows, fields) => {
            if (!!error) {
            dbFunc.connectionRelease;
                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
            } else {
            dbFunc.connectionRelease;
                var response={message:'VM creation date updated successfully.'};
                callback(null,response);
            }
        });
    });
}
function addVmGroup(reqObj,callback){
    var groupInfo={
        vdc_id:reqObj.vdc_id,
        group_name:reqObj.group_name,
        status:reqObj.status
    }
    return new Promise((resolve,reject) => {
        db.query("INSERT INTO vm_groups SET ?", groupInfo ,(error,orderRows,fields)=>{
            if (!!error) {
                dbFunc.connectionRelease;
                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
            } else {
                dbFunc.connectionRelease;
                var response={message:'VM Group created successfully.'};
                callback(null,response);
            }
        });
    });
}
function editVmGroup(reqObj,callback){
    return new Promise((resolve,reject) => {
        sqlquerry = "Update vm_groups set group_name='" + reqObj.group_name + "',status='" + reqObj.status + "' where id=" + reqObj.id;
        db.query(sqlquerry, (error, rows, fields) => {
            if (!!error) {
            dbFunc.connectionRelease;
                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
            } else {
            dbFunc.connectionRelease;
                var response={message:'VM Group updated successfully.'};
                callback(null,response);
            }
        });
    });
}
function editVmGroupMapping(reqObj,callback){
    return new Promise((resolve,reject) => {
        sqlquerry = "Update infra_vms set vm_groupid='1' where vm_groupid="+reqObj.id+" and vdc_id="+reqObj.vdc_id;
        db.query(sqlquerry, (error, rows, fields) => {
            if (!!error) {
            dbFunc.connectionRelease;
                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
            } else {
                dbFunc.connectionRelease;
                resolve('done');
            }
        })
    }).then(async function(result){
       await new Promise(async (resolve,reject) => {
        var vmlistArr=reqObj.checkbox;
        vmlistArr.forEach(async function(vmid) {
                qlquerry = "Update infra_vms set vm_groupid='"+reqObj.id+"' where id=" +vmid+" and vdc_id="+reqObj.vdc_id;
                await db.query(qlquerry, (error, rows, fields) => {
                    if (!!error) {
                    dbFunc.connectionRelease;
                        callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                    } else {
                        dbFunc.connectionRelease; 
                    }
                });
            })
            resolve('Record updated');
        })
        var response={message:'VM Group updated successfully.'};
        callback(null,response);
    })
}

//####################################################
//# Auther 		: Pradeep
//# Creted date : 22/08/2019
//# Description	: For getting veeam job
//####################################################
let getVeeamJobs=(vmDetail,jobType='B',callback)=>
{
    //get veeam server details
    new Promise((resolve,reject) => {
        dbHandler.executeQuery('select * from veeam_server where vdc_id='+vmDetail.vdc_id+' and server_type="'+jobType+'" and status="A"',function(result){
            if(result)
                return resolve(result);
            else return resolve([]);
        })
    }).then(async function(veeamServers){
        var job_type=(jobType=='R')?1:0;
        var promises = [];
        for(var kk in veeamServers){
            var serverDataArr=veeamServers[kk];
            var vdc ={'db_host':serverDataArr['db_host'],'db_user':serverDataArr['db_user'],
            'db_pass':serverDataArr['db_password'],'db_name':serverDataArr['db_name']}
            var vcenterVmId=await vmDetail.vcenter_vm_id.replace('VirtualMachine-vm-', '');
            var veeamQry="SELECT dbo.[WmiServer.JobsView].id as job_id,dbo.[WmiServer.JobsView].name,dbo.[WmiServer.JobsView].created_by,dbo.[WmiServer.JobsView].modified_by,dbo.[WmiServer.JobsView].creation_date,dbo.[WmiServer.JobsView].latest_result,dbo.[WmiServer.JobsView].schedule_enabled,dbo.[WmiServer.ObjectsInJobsView].obj_name as vm_name,dbo.[WmiServer.ObjectsInJobsView].obj_reference as vCenterVmId FROM dbo.[WmiServer.JobsView] INNER JOIN dbo.[WmiServer.ObjectsInJobsView] ON dbo.[WmiServer.JobsView].id = dbo.[WmiServer.ObjectsInJobsView].job_id WHERE dbo.[WmiServer.ObjectsInJobsView].obj_reference = 'vm-"+vcenterVmId+"' and dbo.[WmiServer.JobsView].type='"+job_type+"'";
            var serverdata=await new Promise((resolve,reject) => {
                connpool.executeSql(veeamQry,vdc, function(result,err) {
                    if (err) {
                        resolve([]);
                    }else{
                        if(result.recordsets[0])
                        resolve(result.recordsets[0])
                        else resolve([]);
                    }
                })
            });
            var sqlQry="SELECT dbo.[Backup.Model.OIBs].id,dbo.[Backup.Model.OIBs].creation_time as vm_restore_point_date ";
            sqlQry +="FROM dbo.[Backup.Model.OIBs] INNER JOIN dbo.ObjectSensitiveView ON dbo.ObjectSensitiveView.id = dbo.[Backup.Model.OIBs].object_id ";
            sqlQry +="WHERE dbo.ObjectSensitiveView.object_id = 'vm-"+vcenterVmId+"' ORDER BY dbo.[Backup.Model.OIBs].creation_time DESC";
            var restorePoints=await new Promise((resolve,reject) => {
                connpool.executeSql(sqlQry,vdc, function(result,err) {
                    if (err) {
                        resolve([]);
                    }else{
                        if(result.recordsets[0])
                        resolve(result.recordsets[0])
                        else resolve([]);
                    }
                })
            });
            //await serverdata.forEach(async function(val){
            for(var jj in serverdata){
                var val=serverdata[jj];
                var temp=val;
                temp['server_id']=serverDataArr['id'];
                temp['ip_address']=serverDataArr['ip_address'];
                var query="SELECT top 1 [Backup.Model.JobSessions].creation_time,[Backup.Model.JobSessions].state,";
                query +="[Backup.Model.JobSessions].result,[Backup.Model.JobSessions].progress,";
                query +="[Backup.Model.BackupJobSessions].total_size AS 'total_size_gb',";
                query +="[Backup.Model.BackupJobSessions].processed_size AS 'processed_size_gb',";
                query +="[Backup.Model.BackupJobSessions].processed_used_size AS 'backup_size_mb',";
                query +="[Backup.Model.BackupJobSessions].read_size AS 'data_read_mb',";
                query +="[Backup.Model.BackupJobSessions].stored_size AS 'transferred_mb' FROM [Backup.Model.JobSessions] ";
                query +="INNER JOIN [Backup.Model.BackupJobSessions] ON [Backup.Model.JobSessions].orig_session_id = [Backup.Model.BackupJobSessions].id ";
                query +="WHERE [Backup.Model.JobSessions].job_id = '"+val.job_id+"' ORDER BY [Backup.Model.JobSessions].creation_time DESC";
                var veeamData=await new Promise((resolve,reject) => {
                    connpool.executeSql(query,vdc, function(result,err) {
                        if (err) {
                            resolve([]);
                        }else{
                            if(result.recordsets[0][0])
                            resolve(result.recordsets[0][0])
                            else resolve([]);
                        }
                    })
                });
                temp['veeamData']=veeamData;
                temp['restorePoints']=restorePoints;
                await promises.push(temp);
            }
            
        }
        Promise.all(promises)
          .then((jobsArr) => {
            //console.log(jobsArr)
            callback({jobData:jobsArr});
          })
          .catch((e) => {
            callback({jobData:[]});
          });
        
    })
}
function getVmDiskInfobyId(id) {
    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM infra_vm_disk_details WHERE status='A' and vm_id ="+id.id,(error,rows,fields)=>{
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

module.exports = vmlistModel;

