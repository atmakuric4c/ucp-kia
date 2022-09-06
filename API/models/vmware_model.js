const dbHandler= require('../config/api_db_handler')
const monitoringDB= require('../config/monitoring_db');
const monitoringModel= require('../app/models/monitoring-model');
const config= require('../config/constants');
const helper = require('../helpers/common_helper')
const axios = require('axios')
const in_array = require('in_array');
const dateFormat = require('dateformat');
const powershell = require('../models/powershell')
const querystring = require('querystring');
var data=[];
/*
  Author: Pradeep
  Descri: checking of vcenter connection
  Date  : 10-04-2019
*/
function validateVcenterConnection(connString,callback){
    powershell.exicutePSscript('vcenter_connection',connString,function(result){
        return callback(result)
    })
}
/*
  Author: Pradeep
  Descri: get vcenter details by vdc id
  Date  : 10-04-2019
*/
let getVcenterDetailById=(vdc_id,callback)=>{
    dbHandler.getOneRecord('infra_vdc',{vdc_id:vdc_id},function(result){
        return callback(result)
    })
}
/*
  Author: Pradeep
  Descri: add vcenter details
  Date  : 10-04-2019
*/
let addVcenterDetails=(params,callback)=>{
    dbHandler.getOneRecord('infra_vdc',{status:'A',vdc_name:params.vdc_name},function(result){
        if(!result){
            if(!params.vdc_name) return callback(400,'Please provide the vdc_name')
            if(!params.vdc_location) return callback(400,'Please provide the vdc_location')
            if(!params.vdc_ip) return callback(400,'Please provide the vdc_ip')
            if(!params.vdc_user) return callback(400,'Please provide the vdc_user')
            if(!params.vdc_password) return callback(400,'Please provide the vdc_password')
            if(!params.db_host) return callback(400,'Please provide the vdc db_host')
            if(!params.db_user) return callback(400,'Please provide the vdc db_user')
            if(!params.db_pass) return callback(400,'Please provide the vdc db_pass')
            if(!params.db_name) return callback(400,'Please provide the vdc db_name')
            if(!params.db_type) return callback(400,'Please provide the vdc db_type')
            if(!params.status) return callback(400,'Please provide the record status')
            switch(params.db_type){
                case 'mssql':
                    params.db_driver='sqlsrv';
                    break;
                case 'pgsql':
                        params.db_driver='postgre';
                    break;
            }
            var connString='-Server "'+params.vdc_ip+'" -User "'+params.vdc_user+'" -password "'+params.vdc_password+'"';
            var dbcon=require('../models/'+params.db_type+'_query')
            var promise1=new Promise(function(resolve, reject) {
                validateVcenterConnection(connString,function(result){
                    resolve({vcenter_conn:helper.trim(result)})
                })
            })
            var promise2=new Promise(function(resolve, reject) {
                dbcon.checkVcenterDB(params, function(err,result) {
                    if (err) {
                        resolve(err)
                    }
                    resolve(result)
                })
            })
            Promise.all([
                promise1,promise2
            ]).then(function(result){
                if(result[0].vcenter_conn != 'Connected')
                return callback(400,result[0].vcenter_conn)
                //return callback(400,'Please check the vcenter connection')
                if(result[1].db_conn != 'Connected')
                return callback(400,result[1].db_conn)
                //return callback(400,'Please check the vcenter DB Connection')
                if(result[0].vcenter_conn=='Connected' && result[1].db_conn=='Connected'){
                    new Promise(function(resolve, reject) {
                        data=params;
                        dbHandler.insertIntoTable('infra_vdc',data,function(err,result){
                            resolve(result)
                        })
                    }).then(function(vdc_id){
                        if(isNaN(vdc_id))return callback(400,'The operation did not execute as expected. Please raise a ticket to support')
                        var vmgroups={vdc_id:vdc_id,group_name:Default,is_primary:1};
                        dbHandler.insertIntoTable('vm_groups',vmgroups,function(err,result){}); 
                        var response={data:{vdc_id:vdc_id},message:'Record Inserted Successfully'}
                        return callback(null,response)
                    })
                }
            })
        }else{
              return callback(400,'VCenter is already exist') 
        }
    })
}
/*
  Author: Pradeep
  Descri: update vcenter details
  Date  : 10-04-2019
*/
let updateVcenterDetails=(params,callback)=>{
    if(!params.vdc_id) return callback(400,'Please provide the vdc_id')
    if(!params.vdc_name) return callback(400,'Please provide the vdc_name')
    if(!params.vdc_location) return callback(400,'Please provide the vdc_location')
    if(!params.vdc_ip) return callback(400,'Please provide the vdc_ip')
    if(!params.vdc_user) return callback(400,'Please provide the vdc_user')
    if(!params.vdc_password) return callback(400,'Please provide the vdc_password')
    if(!params.db_host) return callback(400,'Please provide the vdc db_host')
    if(!params.db_user) return callback(400,'Please provide the vdc db_user')
    if(!params.db_pass) return callback(400,'Please provide the vdc db_pass')
    if(!params.db_name) return callback(400,'Please provide the vdc db_name')
    if(!params.db_type) return callback(400,'Please provide the vdc db_type')
    if(!params.status) return callback(400,'Please provide the record status')
    switch(params.db_type){
        case 'mssql':
            params.db_driver='sqlsrv';
            break;
        case 'pgsql':
                params.db_driver='postgre';
            break;
    }
    var vdc_id=params.vdc_id;
    delete params.vdc_id;
    data=params;
    dbHandler.updateTableData('infra_vdc',{vdc_id:vdc_id},data,function(err,result){
        if(err)return callback(400,'Record Not Updated')
        var response={data:result,message:'Record Updated Successfully'}
        return callback(null,response)
    })
}
/*
  Author: Pradeep
  Descri: get datastore details by datastore name
  Date  : 10-04-2019
*/
let getDatastoreDetailByName=(name,vdc_id,callback)=>{
    dbHandler.getOneRecord('infra_vm_datastore',{datastore_name:name,vdc_id:vdc_id},function(result){
        return callback(result)
    })
}
/*
  Author: Pradeep
  Descri: get datastore details by datastore id
  Date  : 10-04-2019
*/
let getDatastoreDetailById=(id,vdc_id,callback)=>{
    dbHandler.getOneRecord('infra_vm_datastore',{id:id,vdc_id:vdc_id},function(result){
        return callback(result)
    })
}
/*
  Author: Pradeep
  Descri: add datastore details
  Date  : 10-04-2019
*/
let addDatastoreDetails=(params,callback)=>{
    if(!params.datastore_name) return callback(400,'Please provide the datastore_name')
    if(!params.vdc_id) return callback(400,'Please provide the vdc_id')
    if(!params.status) return callback(400,'Please provide the record status')
    data=params;
    getDatastoreDetailByName(params.datastore_name,params.vdc_id,function(result){
        if(!result){
            dbHandler.insertIntoTable('infra_vm_datastore',data,function(err,result){
                if(err)return callback(400,'Record Not Inserted')
                var response={data:result,message:'Record Inserted Successfully'}
                return callback(null,response)
            })
        }else{
            return callback(400,'Datastore name is already exists')
        }
    })
}
/*
  Author: Pradeep
  Descri: update datastore details
  Date  : 10-04-2019
*/
let updateDatastoreDetails=(params,callback)=>{
    if(!params.id) return callback(400,'Please provide the id')
    //if(!params.datastore_name) return callback(400,'Please provide the datastore_name')
    if(!params.disk_type) return callback(400,'Please provide the disk type')
    if(!params.status) return callback(400,'Please provide the record status')
    var id=params.id;
    //var vdc_id=params.vdc_id;
    delete params.id;
    data=params;
    dbHandler.updateTableData('infra_vm_datastore',{id:id},data,function(err,result){
        if(err)return callback(400,'Datastore Not Updated')
        var response={data:result,message:'Datastore Updated Successfully'}
        return callback(null,response)
    })
}
/*
  Author: Pradeep
  Descri: get host details by host name
  Date  : 10-04-2019
*/
let getHostDetailByIp=(host_ip,vdc_id,callback)=>{
    dbHandler.getOneRecord('infra_vm_host',{host_ip:host_ip,vdc_id:vdc_id},function(result){
        return callback(result)
    })
}
/*
  Author: Pradeep
  Descri: get host details by host id
  Date  : 10-04-2019
*/
let getHostDetailById=(id,vdc_id,callback)=>{
    dbHandler.getOneRecord('infra_vm_host',{id:id,vdc_id:vdc_id},function(result){
        return callback(result)
    })
}
/*
  Author: Pradeep
  Descri: add host details
  Date  : 10-04-2019
*/
let addHostDetails=(params,callback)=>{
    if(!params.host_ip) return callback(400,'Please provide the host_ip')
    if(!params.host_name) return callback(400,'Please provide the host_name')
    if(!params.vdc_id) return callback(400,'Please provide the vdc_id')
    if(!params.status) return callback(400,'Please provide the record status')
    data=params;
    getHostDetailByIp(params.host_ip,params.vdc_id,function(result){
        if(!result){
            dbHandler.insertIntoTable('infra_vm_host',data,function(err,result){
                if(err)return callback(400,'Record Not Inserted')
                var response={data:result,message:'Record Inserted Successfully'}
                return callback(null,response)
            })
        }else{
            return callback(400,'Host IP already exists')
        }
    })
}
/*
  Author: Pradeep
  Descri: update host details
  Date  : 10-04-2019
*/
let updateHostDetails=(params,callback)=>{
    if(!params.id) return callback(400,'Please provide the id')
    if(!params.host_ip) return callback(400,'Please provide the host_ip')
    if(!params.host_name) return callback(400,'Please provide the host_name')
    if(!params.vdc_id) return callback(400,'Please provide the vdc_id')
    if(!params.status) return callback(400,'Please provide the record status')
    var id=params.id;
    var vdc_id=params.vdc_id;
    delete params.id;
    data=params;
    dbHandler.updateTableData('infra_vm_host',{id:id,vdc_id:vdc_id},data,function(err,result){
        if(err)return callback(400,'Record Not Updated')
        var response={data:result,message:'Record Updated Successfully'}
        return callback(null,response)
    })
}
/*
  Author: Pradeep
  Descri: get vdc details by vdc id
  Date  : 10-04-2019
*/
let getVdcDetail=(vdc_id,callback)=>{
    dbHandler.getOneRecord('infra_vdc',{vdc_id:vdc_id,status:'A'},function(result){
        return callback(result);
    })
}
/*
  Author: Pradeep
  Descri: get vm host
  Date  : 1-04-2019
*/
let getVmHost=(vdc_id,callback)=>{
    dbHandler.executeQuery('select * from infra_vm_host where vdc_id='+vdc_id+' and status="A" order by last_used asc',function(result){
        if(result)
            return callback(result[0]);
        else return callback(result);
    })
}
/*
  Author: Pradeep
  Descri: get vm datastore
  Date  : 1-04-2019
*/
let getVmDataStore=(vdc_id,callback)=>{
    dbHandler.executeQuery('select * from infra_vm_datastore where vdc_id='+vdc_id+' and status="A" order by last_used asc',function(result){
        if(result)
            return callback(result[0]);
        else return callback(result);
    })
}
/*
  Author: Pradeep
  Descri: get host based datastore
  Date  : 06-06-2019
*/
let getHostBasedDataStore=(vdc,host_ip,callback)=>{
    var vdc_id=vdc.vdc_id;
    var data=require('../models/'+vdc.db_type+'_query')
    var promise = new Promise(function(resolve, reject) {
        data.vcenterHostLinkedDatastoreList(vdc,host_ip,function(err,result){
            if(err) return callback([])
            if(!result)return callback([]);
            resolve(result.data);
        });
    });
    promise.then(async function(datastores) {
        for(var kk in datastores){
            var obj=datastores[kk];
            var response=await new Promise(function(resolve, reject) {
                var sql='select * from infra_vm_datastore where vdc_id='+vdc_id+' and status="A" and datastore_name="'+obj.NAME+'" order by last_used asc limit 1';
                dbHandler.executeQuery(sql,function(result){
                    console.log(sql)
                    if(result){
                        return resolve(result[0]);
                    }
                    else return resolve({});
                })
            });
            if(response)return callback(response);
        }
        return callback(response);
    });
}

/*
  Author: Pradeep
  Descri: get ip address
  Date  : 12-04-2019
*/
let getPrivateIpAddress=(network_id,callback)=>{
    dbHandler.getOneRecord('infra_private_ipam',{network_id:network_id,status:'A'},function(result){
        return callback(result);
    })
}
/*
  Author: Pradeep
  Descri: get vcenter vms
  Date  : 10-04-2019
*/
let vcenterVms=(vdc_id,callback)=>{
    if(!vdc_id) return callback(400,'Please provide the vdc_id')
    var promise = new Promise(function(resolve, reject) {
        getVdcDetail(vdc_id,function(result){
            if(!result)return callback(400,'vdc information not available')
            resolve(result)
        })
    });
    promise.then(function(vdc) {
    var data=require('../models/'+vdc.db_type+'_query')
    data.vcenterVmList(vdc,function(err,result){
        if(err) return callback(400,err)
        return callback(null,result)
    })
    });
}
/*
  Author: Pradeep
  Descri: get vcenter datastores
  Date  : 10-04-2019
*/
let vcenterDatastores=(vdc_id,callback)=>{
    if(!vdc_id) return callback(400,'Please provide the vdc_id')
    var promise = new Promise(function(resolve, reject) {
        getVdcDetail(vdc_id,function(result){
            if(!result)return callback(400,'vdc information not available')
            resolve(result)
        })
    });
    promise.then(function(vdc) {
    var data=require('../models/'+vdc.db_type+'_query')
    data.vcenterDatastoreList(vdc,function(err,result){
        if(err) return callback(400,err)
        return callback(null,result)
    })
    });
}
/*
  Author: Pradeep
  Descri: get vcenter datastore details
  Date  : 18-03-2020
*/
let vcenterDatastoreDetailByName=(ds_name,vdc_id,callback)=>{
    if(!vdc_id) return callback(400,'Please provide the vdc_id')
    var promise = new Promise(function(resolve, reject) {
        getVdcDetail(vdc_id,function(result){
            if(!result)return callback(400,'vdc information not available')
            resolve(result)
        })
    });
    promise.then(function(vdc) {
    var data=require('../models/'+vdc.db_type+'_query')
    data.vcenterDatastoreDetailByName(ds_name,vdc,function(err,result){
        if(err) return callback(400,err)
        return callback(null,result)
    })
    });
}
/*
  Author: Pradeep
  Descri: get host details by host id
  Date  : 24-03-2020
*/
let vcenterHostDetailByName=(host_id,vdc_id,callback)=>{
    if(!vdc_id) return callback(400,'Please provide the vdc_id')
    var promise = new Promise(function(resolve, reject) {
        getVdcDetail(vdc_id,function(result){
            if(!result)return callback(400,'vdc information not available')
            resolve(result)
        })
    });
    promise.then(function(vdc) {
    var data=require('../models/'+vdc.db_type+'_query')
    data.vcenterHostDetailByName(host_id,vdc,function(err,result){
        if(err) return callback(400,err)
        return callback(null,result)
    })
    });
}
let datastoreUnderHost=(host_ip,vdc_id,callback)=>{
    if(!vdc_id) return callback(400,'Please provide the vdc_id')
    var promise = new Promise(function(resolve, reject) {
        getVdcDetail(vdc_id,function(result){
            if(!result)return callback(400,'vdc information not available')
            resolve(result)
        })
    });
    promise.then(function(vdc) {
    var data=require('../models/'+vdc.db_type+'_query')
    data.datastoreUnderHost(host_ip,vdc,function(err,result){
        if(err) return callback(400,err)
        return callback(null,result)
    })
    });
}
let hostUnderDatastore=(dsname,vdc_id,callback)=>{
    if(!vdc_id) return callback(400,'Please provide the vdc_id')
    var promise = new Promise(function(resolve, reject) {
        getVdcDetail(vdc_id,function(result){
            if(!result)return callback(400,'vdc information not available')
            resolve(result)
        })
    });
    promise.then(function(vdc) {
    var data=require('../models/'+vdc.db_type+'_query')
    data.hostUnderDatastore(dsname,vdc,function(err,result){
        if(err) return callback(400,err)
        return callback(null,result)
    })
    });
}

/*
  Author: Pradeep
  Descri: get vcenter hosts
  Date  : 10-04-2019
*/
let vcenterHosts=(vdc_id,callback)=>{
    if(!vdc_id) return callback(400,'Please provide the vdc_id')
    var promise = new Promise(function(resolve, reject) {
        getVdcDetail(vdc_id,function(result){
            if(!result)return callback(400,'vdc information not available')
            resolve(result)
        })
    });
    promise.then(function(vdc) {
    var data=require('../models/'+vdc.db_type+'_query')
        data.vcenterHostList(vdc,function(err,result){
            if(err) return callback(400,err)
            return callback(null,result)
        })
    });
}
/*
  Author: Pradeep
  Descri: get vcenter templates
  Date  : 10-04-2019
*/
let vcenterTemplates=(vdc_id,callback)=>{
    if(!vdc_id) return callback(400,'Please provide the vdc_id')
    var promise = new Promise(function(resolve, reject) {
        getVdcDetail(vdc_id,function(result){
            if(!result)return callback(400,'vdc information not available')
            resolve(result)
        })
    });
    promise.then(function(vdc) {
    var data=require('../models/'+vdc.db_type+'_query')
    data.vcenterTemplateList(vdc,function(err,result){
        if(err) return callback(400,err)
        return callback(null,result)
    })
    });
}
/*
  Author: Pradeep
  Descri: get vcenter snapshots
  Date  : 10-04-2019
*/
let vcenterSnapshots=(vdc_id,vm_id,callback)=>{
    if(!vdc_id) return callback(400,'Please provide the vdc_id')
    if(!vm_id) return callback(400,'Please provide the vm_id')
    var promise = new Promise(function(resolve, reject) {
        getVdcDetail(vdc_id,function(result){
            if(!result)return callback(400,'vdc information not available')
            resolve(result)
        })
    });
    promise.then(function(vdc) {
    var data=require('../models/'+vdc.db_type+'_query')
    data.vcenterSnapshotList(vm_id,vdc,function(err,result){
        if(err) return callback(400,err)
        return callback(null,result)
    })
    });
}
/*
  Author: Pradeep
  Descri: get template details
  Date  : 12-04-2019
*/
let getTemplateDetailByTemplateName=(template_name,vdc_id,callback)=>{
    dbHandler.getOneRecord('infra_vm_templates',{vcenter_temp_name:template_name,vdc_id:vdc_id},function(result){
        return callback(result)
    })
}
/*
  Author: Pradeep
  Descri: add vm
  Date  : 10-04-2019
*/
let addVm=(reqObj,logId,callback)=>{
    var inputs=reqObj.body
    if(!inputs.vdc_id) return callback(400,'Please provide the vdc_id')
    if(!inputs.vm_name) return callback(400,'Please provide the vm_name')
    if(!inputs.host_name) return callback(400,'Please provide the host_name')
    if(!inputs.disk_type) return callback(400,'Please provide the disk_type')
    if(!inputs.cpu_count) return callback(400,'Please provide the cpu_count')
    if(!inputs.memory_mb) return callback(400,'Please provide the memory_mb')
    if(!inputs.disk_size) return callback(400,'Please provide the disk_size in GB')
    if(!inputs.user_id) return callback(400,'Please provide the user_id')
    if(!inputs.template_name) return callback(400,'Please provide the template_name')
    if(!inputs.cloud_type) return callback(400,'Please provide the cloud_type')
    if(!inputs.order_id) return callback(400,'Please provide the order_id')
    if(!inputs.network_id) return callback(400,'Please provide the network_id')
    new Promise(function(resolve, reject) {
        getVdcDetail(inputs.vdc_id,function(result){
            if(!result)return callback(400,'vdc information not available')
            resolve(result)
        })
    }).then(async function(vdc){
        if(vdc){
            return new Promise(function(resolve, reject){
                dbHandler.getOneRecord('infra_vms',{vcenter_vm_name:inputs.vm_name,vdc_id:inputs.vdc_id},function(checkVM){
                    if(checkVM) {
                        return callback(400,'VM Name already exists')
                    }else{
                        resolve(vdc)
                    }
                })
            })
        }else{
            return callback(400,'Invalid vdc_id')
        }
    }).then(async function(vdc){
        var networkInfo = await new Promise(function (resolve, reject) {
            var sql='select net.network_name,ip.ip_address from infra_network as net inner join';
            sql +=' infra_private_ipam as ip on ip.network_id=net.id';
            sql +=' where net.id='+inputs.network_id+' and ip.status="A" limit 1';
            dbHandler.executeQuery(sql,function (err,result) {
                if(result)
                resolve(result[0]);
                else resolve([])
            });
        });
        if(!networkInfo) return callback(400,'IP not available for the provided network')
        var memoryGb = inputs.memory_mb/1024;
		if(memoryGb > 256)
			return callback(400,'Maximum allowed memory size is 256 GB');
        if(memoryGb < 1)
            return callback(400,'Minimum allowed memory size is 1 GB');
		var allowedCpuCountArr = [1,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40];
        if(!in_array(inputs.cpu_count,allowedCpuCountArr))
            return callback(400,'Supplied cpu count is an invalid, so please try with the following valid cpu count '+allowedCpuCountArr.toString());
			
        //retriving template detail by template id
        return new Promise(function(resolve, reject){
            getTemplateDetailByTemplateName(inputs.template_name,inputs.vdc_id,function(result){
                resolve(result)
            })
        }).then(async function(template){
            if(!template){
                return callback(400,'Please provide a valid template');
            }else{
                var template_name	= template.vcenter_temp_name;
                var os_name			= template.name;
                var os_type		    = template.type;
                if(inputs.vdc_id != template.vdc_id)
                {
                    return callback(400,'Sorry we are unable to deploy the VM because the template you given is not found in the vcenter');
                }
                var datastore = await new Promise(function (resolve, reject) {
                    var sql='select * from infra_vm_datastore where vdc_id='+inputs.vdc_id+' and status="A" and disk_type="'+inputs.disk_type+'" order by last_used asc limit 1';
                    dbHandler.executeQuery(sql,function(result){
                        if(result){
                            return resolve(result);
                        }
                        else return resolve({});
                    })
                });
                if(datastore.length == 0) 
                return callback(400,`No active or ${inputs.disk_type} datastore available to create the vm.`)
                var ctrl4cUserName = '';
                if(os_type == 'windows')
                    ctrl4cUserName   = '..\ctrl4c';
                else
                    ctrl4cUserName   = 'ctrl4c';
                let vm_groupid=await new Promise(function(resolve, reject) {
                    dbHandler.getOneRecord('vm_groups',{vdc_id:inputs.vdc_id},function(vmgroup){
                        if(!vmgroup) {
                            return callback(400,'Default VM group not found')
                        }else{
                            resolve(vmgroup.id);
                        }
                    })
                })
                data= {'user_id':inputs.user_id,'name':inputs.vm_name,'host_name':inputs.host_name,
                'vcenter_vm_name':inputs.vm_name,'cloud_type':inputs.cloud_type,'os':os_name,
                'hdd':inputs.disk_size,'cpu_count':inputs.cpu_count,'ram':inputs.memory_mb,
                'disk_type':inputs.disk_type,'creation_status':'S','ctrl4c_user':ctrl4cUserName,'status':'UnderCreation',
                'date_added':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),'order_id':inputs.order_id,
                'ctrl4c_password':'ctrls.1234$#$','network_id':inputs.network_id,'os_type':os_type,
                'vdc_id':inputs.vdc_id,'template':template_name,'vm_groupid':vm_groupid}
                return new Promise(function(resolve, reject){
                    dbHandler.insertIntoTable('infra_vms',data,function(err,result){
                        if(err)return callback(400,'Record not inserted');
                        resolve(result)
                    })
                }).then(function(insertId){
                    if(insertId > 0){
                        var baseUrl = reqObj.protocol + '://' + reqObj.get('host');
                        axios.post(baseUrl+'/vmware/create_vm',{vm_id:insertId})
                        .then(response => {
                            //console.log(response.data.url);
                            updateApiLog({error_log:err},logId,function(result){})
                        })
                        .catch(error => {
                            console.log(error);
                            updateApiLog({error_log:error},logId,function(result){})
                        });
                        var response={vm_id:insertId,message:'Your VM creation request is submitted successfully.'}
                        return callback(null,response); 
                    }else{
                        return callback(400,'Record not inserted');
                    }
                })
            }
        })
       
    })
}
/*
  Author: Pradeep
  Descri: create vm
  Date  : 10-04-2019
*/
let createVm=(reqObj,logId,callback)=>{
    var vm_id=reqObj.body.vm_id
    if(!vm_id)return callback(400,'Please provide vm_id');
    new Promise(function(resolve, reject) {
        dbHandler.getOneRecord('infra_vms',{id:vm_id},function(vmDetail){
            if(!vmDetail) {
                return callback(400,'VM not found')
            }else{
                resolve(vmDetail)
            }
        })
    }).then(async function(vmDetail){
        const vdc = await new Promise(function (resolve, reject) {
            getVdcDetail(vmDetail.vdc_id, function (result) {
                if(!result)return callback(400,'vdc information not available')
                resolve(result);
            });
        });
        if(vmDetail.creation_status=='S'){
            var vmName=vmDetail.name
            var vmHost = await new Promise(function (resolve, reject) {
                getVmHost(vmDetail.vdc_id, function (result) {
                    resolve(result);
                });
            });
            if(!vmHost) return callback(400,'No active host to create the vm')
            var datastore = await new Promise(function (resolve, reject) {
                getHostBasedDataStore(vdc,vmHost.host_ip, function (result) {
                    resolve(result);
                });
            });
            if(!datastore) return callback(400,'No active datastore for host '+vmHost.host_ip+' to create the vm')
            var ipAddressArr = await new Promise(function (resolve, reject) {
                getPrivateIpAddress(vmDetail.network_id, function (result) {
                    resolve(result);
                });
            });
            if(!ipAddressArr) return callback(400,'IP not available')
            var networkInfo = await new Promise(function (resolve, reject) {
                var sql='select net.network_name,ip.ip_address from infra_network as net inner join';
                sql +=' infra_vms as vm on vm.network_id=net.id inner join infra_private_ipam as ip';
                sql +=' on ip.network_id=net.id where net.id='+vmDetail.network_id+' and ip.status="A" limit 1';
                dbHandler.executeQuery(sql,function (result) {
                    if(result)
                    resolve(result[0]);
                    else resolve(result)
                });
            });
            if(!networkInfo) return callback(400,'Network info not available')
            var ip_address 	= ipAddressArr.ip_address;
			var subnetMask = ipAddressArr.subnetmask;
            var gateway	= ipAddressArr.gateway;
            var generator = require('generate-password');
            var passwordData = await generator.generateMultiple(1, {
                length: 15,
                numbers: true
            });
            if(vmDetail.os_type == 'windows')
			{
				var dns		= '8.8.8.8';
				var userName   = 'administrator';
			}
			else
			{	
				var dns		= '0';	
				var userName   = 'root';
			}
            var password=passwordData[0];
            var networkName = networkInfo.network_name;
            vm_host_ip=vmHost.host_ip;
            datastoreName=datastore.datastore_name;
            var updateData={ip_address:ip_address,password:password,user:userName,creation_status:'S',
            vm_host:vm_host_ip,datastore:datastoreName}
            var updateCheck = await new Promise(function (resolve, reject) {
                dbHandler.updateTableData('infra_vms',{id:vmDetail.id},updateData,function (err,result) {
                    resolve(result);
                });
            });
            var osSpec = vmName+'_spec';
            var corePerSocket = '0';
             if(ip_address){
                var inputParams='-Server "'+vdc.vdc_ip+'" -User "'+vdc.vdc_user+'" -password "'+vdc.vdc_password+'"';
                inputParams +=' -osSpec "'+osSpec+'" -ipAddress "'+ip_address+'" -subnetMask "'+subnetMask+'" -gateway "'+gateway+'"';
                inputParams +=' -dns "'+dns+'" -vmName "'+vmName+'" -vmhost "'+vm_host_ip+'" -template "'+vmDetail.template+'"';
                inputParams +=' -datastore "'+datastoreName+'" -vmId "'+vm_id+'" -corePerSocket "'+corePerSocket+'" -network "'+networkName+'"';
                inputParams +=' -cpu "'+vmDetail.cpu_count+'" -memory "'+vmDetail.ram+'" -hardDisk "'+vmDetail.hdd+'" -vmPassword "'+password+'"';
                var vm_response = await new Promise(function (resolve, reject) {
                    powershell.exicutePSscript('add_vm',inputParams,function(result){
                        updateApiLog({error_log:result},logId,function(result){})
                        resolve(result)
                    });
                });
                console.log(vm_response)
            }else{
                await new Promise(function (resolve, reject) {
                    dbHandler.updateTableData('infra_vms',{id:vmDetail.id},{status:'CreationFailed',creation_status:'C'},function (err,result) {
                        updateApiLog({error_log:'Ip not available'},logId,function(result){})
                        resolve(result);
                    });
                });
                return callback(400,'Ip not available')
            }
        }else{
            return callback(400,'Invalid status of vm creation')
        }
    })
}
/*
  Author: Pradeep
  Descri: vm operations
  Date  : 10-04-2019
*/
let vmOperations=(reqObj,logId,callback)=>{
    var inputs=reqObj.body
    if(!inputs.vm_id) return callback(400,'Please provide the vm_id')
    if(!inputs.vm_action) return callback(400,'Please provide the vm_action')
    var vm_id=inputs.vm_id;
    var vm_action=inputs.vm_action;
    new Promise(function(resolve, reject) {
        dbHandler.getOneRecord('infra_vms',{id:vm_id},function(vmDetail){
            if(!vmDetail) {
                return callback(400,'VM not found')
            }else{
                resolve(vmDetail)
            }
        })
    }).then(async function(vmDetail){
        const vdc = await new Promise(function (resolve, reject) {
            getVdcDetail(vmDetail.vdc_id, function (result) {
                if(!result)return callback(400,'vdc information not available')
                resolve(result);
            });
        });
        updateVmActionStatus(vm_id,'InProgress',function(result){})
        var baseUrl = reqObj.protocol + '://' + reqObj.get('host');
        var inputParams='-Server "'+vdc.vdc_ip+'" -User "'+vdc.vdc_user+'" -password "'+vdc.vdc_password+'"';
        switch(vm_action)
		{
            case '1'://power on vm
                inputParams=inputParams+' -vmName "'+vmDetail.vcenter_vm_name+'"';
                new Promise(function (resolve, reject) {
                    powershell.exicutePSscript('start_vm',inputParams,function(result){
                        axios.get(baseUrl+'/cron/update_vm_status?vm_id='+vm_id)
                        updateApiLog({error_log:result},logId,function(result){})
                        resolve(result)
                    });
                });
                var response={message:'VM Power on request received.'}
                return callback(null,response)
			break;
			case '2'://power off vm
                inputParams=inputParams+' -vmName "'+vmDetail.vcenter_vm_name+'"';
                new Promise(function (resolve, reject) {
                    powershell.exicutePSscript('stop_vm',inputParams,function(result){
                        axios.get(baseUrl+'/cron/update_vm_status?vm_id='+vm_id)
                        updateApiLog({error_log:result},logId,function(result){})
                        resolve(result)
                    });
                });
                var response={message:'VM Power off request received.'}
                return callback(null,response)
            break;
            case '3'://shutdown vm
                inputParams=inputParams+' -vmName "'+vmDetail.vcenter_vm_name+'"';
                new Promise(function (resolve, reject) {
                    powershell.exicutePSscript('shutdown_vm',inputParams,function(result){
                        axios.get(baseUrl+'/cron/update_vm_status?vm_id='+vm_id)
                        updateApiLog({error_log:result},logId,function(result){})
                        resolve(result)
                    });
                });
                var response={message:'VM Shutdown request received.'}
                return callback(null,response)
			break;
			case '4'://reboot vm
                inputParams=inputParams+' -vmName "'+vmDetail.vcenter_vm_name+'"';
                new Promise(function (resolve, reject) {
                    powershell.exicutePSscript('reboot_vm',inputParams,function(result){
                        axios.get(baseUrl+'/cron/update_vm_status?vm_id='+vm_id)
                        updateApiLog({error_log:result},logId,function(result){})
                        resolve(result)
                    });
                });
                var response={message:'VM Reboot request received.'}
                return callback(null,response)
			break;
			case '5'://suspend vm
                inputParams=inputParams+' -vmName "'+vmDetail.vcenter_vm_name+'"';
                new Promise(function (resolve, reject) {
                    powershell.exicutePSscript('suspend_vm',inputParams,function(result){
                        axios.get(baseUrl+'/cron/update_vm_status?vm_id='+vm_id)
                        updateApiLog({error_log:result},logId,function(result){})
                        resolve(result)
                    });
                });
                var response={message:'VM Suspend request received.'}
                return callback(null,response)
			break;
			case '6'://resume vm
                inputParams=inputParams+' -vmName "'+vmDetail.vcenter_vm_name+'"';
                new Promise(function (resolve, reject) {
                    powershell.exicutePSscript('start_vm',inputParams,function(result){
                        axios.get(baseUrl+'/cron/update_vm_status?vm_id='+vm_id)
                        updateApiLog({error_log:result},logId,function(result){})
                        resolve(result)
                    });
                });
                var response={message:'VM Resume request received.'}
                return callback(null,response)
            break;
            case '7'://delete vm
                // inputParams=inputParams+' -vmName "'+vmDetail.vcenter_vm_name+'"';
                // new Promise(function (resolve, reject) {
                //     powershell.exicutePSscript('delete_vm',inputParams,function(result){
                //         axios.get(baseUrl+'/cron/update_vm_status?vm_id='+vm_id)
                //         updateApiLog({error_log:result},logId,function(result){})
                //         resolve(result)
                //     });
                // });
                var response={message:'Delete operation not allowed.'}
                return callback(null,response)
			break;
        }
        
    })
}
/*
  Author: Pradeep
  Descri: update Ipam status
  Date  : 23-04-2019
*/
let updateIpamIpStatus=(ipAddress,clientId,vmId)=>{
    //updating ip status to assigned in ipam table
    data={'status':'AS'}
    dbHandler.updateTableData('infra_ipam',{ip_address:ipAddress},data,function(err,result){
    })
    //log ip status
    var note = 'IP assigned to the VM with ID '+vmId;
    insertIpLog(ipAddress,vmId,clientId,note);
    return 1;
}
/*
  Author: Pradeep
  Descri: insert Ip log
  Date  : 23-04-2019
*/
let insertIpLog=(ipAddress,vmId,clientId,note)=>{
    var ipLogArr = {'ip_address':ipAddress,'vm_id':vmId,'client':clientId,'note':note,'requested_by':'self'}
    dbHandler.insertIntoTable('infra_ip_log',ipLogArr,function(err,result){})
    return 1;
}
/*
  Author: Pradeep
  Descri: insert Ip log
  Date  : 23-04-2019
*/
let logSyncData=(logData)=>{
    dbHandler.insertIntoTable('infra_sync_data',logData,function(err,result){})
    return 1;
}
/*
  Author: Pradeep
  Descri: insert api log
  Date  : 23-04-2019
*/
let insertApiLog=(logData,callback)=>{
    logData.request_ip='self';
    try{
        logData.request=JSON.stringify(logData.request);
        logData.response=JSON.stringify(logData.response);
        logData.error_log=JSON.stringify(logData.error_log);
    }
    catch{
        logData.request='';  logData.response=''; logData.error_log='';
    }
    logData.request_time=dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
    new Promise(function(resolve, reject) {
        dbHandler.insertIntoTable('infra_api_log',logData,function(err,result){resolve(result)})
    }).then(function(insertId){
        callback(insertId)
    })
}
/*
  Author: Pradeep
  Descri: update api log
  Date  : 23-04-2019
*/
let updateApiLog=(logData,logId=0,callback)=>{
    logData.request_ip='self';
    try{
        if(typeof logData.error_log !== 'string')
         logData.error_log=JSON.stringify(logData.error_log);
         if(logData.response)
        logData.response=JSON.stringify(logData.response);
    }
    catch{
        delete logData.error_log;
        delete logData.response;
    }
    if(logId > 0){
        logData.response_time=dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
        dbHandler.updateTableData('infra_api_log',{id:logId},logData,function(err,result){
            callback(result);
        });
    }
}
/*
  Author: Pradeep
  Descri: update vm action status
  Date  : 14-05-2019
*/
let updateVmActionStatus=(vm_id,action_status,callback)=>{
    if(vm_id > 0){
        dbHandler.updateTableData('infra_vms',{id:vm_id},{action_status:action_status},function(err,result){
            callback(result);
        });
    }
}
/*
  Author: Pradeep
  Descri: get vcenter logs
  Date  : 23-04-2019
*/
let vcenterLogs=(inputs,callback)=>{
    if(!inputs.vm_id) return callback(400,'Please provide the vm_id')
    if(!inputs.log_type) return callback(400,'Please provide the log_type')
    var vm_id=inputs.vm_id;
    var log_type=inputs.log_type;
    new Promise(function(resolve, reject) {
        dbHandler.executeQuery("select * from infra_vms where id="+vm_id+" order by id desc limit 200",function(result){
            if(result)
            resolve(result[0]);
            else resolve(result);
        })
    }).then(async function(vmDetail){
        if(!vmDetail)
        return callback(400,'The operation did not execute as expected. Please raise a ticket to support')
        const vdc = await new Promise(function (resolve, reject) {
            getVdcDetail(vmDetail.vdc_id, function (result) {
                if(!result)return callback(400,'vdc information not available')
                resolve(result);
            });
        });
        var dbcon=require('../models/'+vdc.db_type+'_query')
        if(vmDetail.vcenter_vm_id)
        var vcenterVmId=vmDetail.vcenter_vm_id.replace('VirtualMachine-vm-', '');
        else return callback(400,'VM still not created.')
        var logs=await new Promise(function(resolve, reject){
            switch(log_type){
                case '1':
                    dbcon.vcenterVmTaskById(vcenterVmId,vdc,function(err,result){
                        if(err)return callback(400,'The operation did not execute as expected. Please raise a ticket to support')
                        resolve(result.data)
                    })
                break;
                case '2':
                    dbcon.vcenterVmEventById(vcenterVmId,vdc,function(err,result){
                        if(err)return callback(400,'The operation did not execute as expected. Please raise a ticket to support')
                        resolve(result.data)
                    })
                break;
                case '3':
                    dbHandler.executeQuery('select * from infra_sync_data where vm_id='+vm_id+' order by id desc',function(result){
                        resolve(result)
                    })
                break;
                case '4':
                    dbHandler.executeQuery('select * from infra_deleted_vm_log where vm_id='+vm_id+' order by id desc',function(result){
                        resolve(result)
                    })
                break;
                default:return callback(400,'Please provide the log_type between 1 to 4')
            }
            
        });
        return callback(null,{data:logs})
    });   
}
let updateVmMemory=(reqObj,logId,callback)=>{
    var inputs=reqObj.body
    if(!inputs.vm_id) return callback(400,'Please provide the vm_id')
    if(!inputs.memory_gb) return callback(400,'Please provide the memory_gb')
    var vm_id=inputs.vm_id;
    var memory_gb=inputs.memory_gb;
    new Promise(function(resolve, reject) {
        dbHandler.executeQuery("select * from infra_vms where id="+vm_id,function(result){
            if(result)
            resolve(result[0]);
            else resolve(result);
        })
    }).then(async function(vmDetail){
        const vdc = await new Promise(function (resolve, reject) {
            getVdcDetail(vmDetail.vdc_id, function (result) {
                if(!result)return callback(400,'vdc information not available')
                resolve(result);
            });
        });
        if(memory_gb == vmDetail['ram']/parseInt(1024))
		{
			return callback(400,'Current memory size is same as you requested to update')
		}
        var vmName 	= vmDetail['vcenter_vm_name'];
        var inputParams='-Server "'+vdc.vdc_ip+'" -User "'+vdc.vdc_user+'" -password "'+vdc.vdc_password+'"';
        inputParams += ' -vmName "'+vmName+'" -memory "'+memory_gb+'"';
        var baseUrl = reqObj.protocol + '://' + reqObj.get('host');
		new Promise(function (resolve, reject) {
            powershell.exicutePSscript('update_memory',inputParams,function(result){
                axios.get(baseUrl+'/cron/update_vm_details?vm_id='+vm_id+'&wait_time=30000')
                updateApiLog({error_log:result},logId,function(result){})
                resolve(result)
            });
        });
		return callback(null,{message:'VM memory update request received.'})
    })
}
let updateVmCpu=(reqObj,logId,callback)=>{
    var inputs=reqObj.body
    if(!inputs.vm_id) return callback(400,'Please provide the vm_id')
    if(!inputs.cpu_core) return callback(400,'Please provide the cpu_core')
    var vm_id=inputs.vm_id;
    var cpu_core=inputs.cpu_core;
    new Promise(function(resolve, reject) {
        dbHandler.executeQuery("select * from infra_vms where id="+vm_id,function(result){
            if(result)
            resolve(result[0]);
            else resolve(result);
        })
    }).then(async function(vmDetail){
        const vdc = await new Promise(function (resolve, reject) {
            getVdcDetail(vmDetail.vdc_id, function (result) {
                if(!result)return callback(400,'vdc information not available')
                resolve(result);
            });
        });
        if(cpu_core == vmDetail['cpu_count'])
		{
			return callback(400,'Current cpu size is same as you requested to update')
		}
        var vmName 	= vmDetail['vcenter_vm_name'];
        var inputParams='-Server "'+vdc.vdc_ip+'" -User "'+vdc.vdc_user+'" -password "'+vdc.vdc_password+'"';
        inputParams += ' -vmName "'+vmName+'" -cpu "'+cpu_core+'"';
        var baseUrl = reqObj.protocol + '://' + reqObj.get('host');
		new Promise(function (resolve, reject) {
            powershell.exicutePSscript('update_cpu',inputParams,function(result){
                axios.get(baseUrl+'/cron/update_vm_details?vm_id='+vm_id+'&wait_time=30000')
                updateApiLog({error_log:result},logId,function(result){})
                resolve(result)
            });
        });
		return callback(null,{message:'VM cpu core update request received.'})
    })
}
/*
#Author:		Pradeep
#Description:	for gettng the veeam server
#Created Date:	14/08/2019
*/
let getVeeamServer=(serverType,vdc_id,callback)=>{

    var sqlQry="select * from veeam_server where status='A' and server_type='"+serverType+"' order by job_count asc,last_used asc";
    dbHandler.executeQuery(sqlQry,function(results){
        var result=results[0];
        var serverId=result['id'];
        //update the last used time
        var data={'last_used':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")};
        dbHandler.updateTableData('veeam_server',{id:serverId,vdc_id:vdc_id},data,function(err,res){
            if(err)return callback('The operation did not execute as expected. Please raise a ticket to support')
            return callback(result)
        })
    })
}
/*
#Author:		Pradeep
#Description:	for gettng the veeam server details
#Created Date:	14/08/2019
*/
let getServerDetailByServerId=(serverId,callback)=>{
    dbHandler.getOneRecord('veeam_server',{id:serverId},function(result){
        return callback(result)
    })
}
/*
#Author:		Pradeep
#Description:	for gettng the veeam server
#Created Date:	03/09/2015
*/
let getBackupRepositories=(serverId,callback)=>{
    new Promise(function (resolve, reject) {
       getServerDetailByServerId(serverId, function (result) {
           if(!result)callback('');
           resolve(result)
       })
    }).then(function(serverDataArr){
        var vdc ={'db_host':serverDataArr['db_host'],'db_user':serverDataArr['db_user'],
        'db_pass':serverDataArr['db_password'],'db_name':serverDataArr['db_name']}
        const connpool=require('../config/db_mssql');
        var repName='';
        var query="SELECT TOP 1 dbo.BackupRepositories.name, dbo.BackupRepositories.is_unavailable,";
        query +="dbo.BackupRepositories.is_full,dbo.BackupRepositories.free_space,";
        query +="dbo.BackupRepositories.total_space FROM dbo.BackupRepositories WHERE ";
        query +="dbo.BackupRepositories.is_unavailable = 0 AND dbo.BackupRepositories.is_busy = 0";
        query +="ORDER BY dbo.BackupRepositories.total_space DESC";
        connpool.executeSql(query,vdc, function(result,err) {
            if (err) {
                return callback(repName)
            }else{
                if(result.recordsets[0])
                repName=result.recordsets[0][0].name;
                return callback(repName)
            }
        })
    })
}
let createBackupJob=(reqObj,logId,callback)=>{
    var inputs=reqObj.body
    if(!inputs.vm_id) return callback(400,'Please provide the vm_id')
    var vm_id=inputs.vm_id;
    new Promise(function(resolve, reject) {
        dbHandler.executeQuery("select * from infra_vms where id="+vm_id,function(result){
            if(result)
            resolve(result[0]);
            else resolve(result);
        })
    }).then(async function(vmDetail){
        const vdc = await new Promise(function (resolve, reject) {
            getVdcDetail(vmDetail.vdc_id, function (result) {
                if(!result)return callback(400,'VDC information not available.')
                resolve(result);
            });
        });
        //get the backup server detail
		let serverData = await new Promise(function (resolve, reject) {
            getVeeamServer("B",vmDetail.vdc_id, function (result) {
                if(!result)return callback(400,'Backup server not found.')
                resolve(result);
            });
        });
		var backupServerIp = serverData['ip_address'];
		var backupServerUn = serverData['username'];
		var backupServerPw = serverData['password'];
		var serverId	   = serverData['id'];
		var veeamDbName	   = serverData['db_name'];
		//rotate the job shedule time
		var serverLastJobTme = serverData['last_job_time'];
		if(serverLastJobTme == '' || serverLastJobTme == '06:00')
			serverLastJobTme = '22:00';
		else
		{
			serverLastJobTmeArr = serverLastJobTme.split(":");
			if(serverLastJobTmeArr[1] == '30') 
				firstOct = parseInt(serverLastJobTmeArr[0])+1;
			else
				firstOct = serverLastJobTmeArr[0];
			if(firstOct > 23)
				firstOct = '00';
			else if(firstOct == 7)
				firstOct = '22';
			if(serverLastJobTmeArr[1] == '00') 
				secondOct = 30;
			else
				secondOct = '00';
			serverLastJobTme = firstOct+':'+secondOct;
		}
       
        //checking replication job is enabled if enabled make the backup hour as denied hour in replication job
        //get the backup server detail
		let repJobRst = await new Promise(function (resolve, reject) {
            dbHandler.executeQuery("select * from vm_job_details where job_type='REPLICA' and vm_id="+vm_id,function(result){
                if(result)
                resolve(result[0]);
                else resolve(result);
            })
        });
		//setting the backup job time as the deined hour of replication
		if(repJobRst)
			serverLastJobTme = repJobRst['denied_hour']+":00";
		//finding the full backup day
        var serverFullBackupDay = serverData['full_backup_day'];	
        var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        var dayno = await days.indexOf(serverFullBackupDay);
        dayno=dayno+1;
        if(dayno>6)dayno=0;	
		var currentJobFullBackupDay = days[dayno];//date('l',strtotime('+1 Day' ,strtotime($serverFullBackupDay)));
        //update in to server table with new time
        var updatedata={'last_job_time':serverLastJobTme,'full_backup_day':currentJobFullBackupDay};
        dbHandler.updateTableData('veeam_server',{id:serverId},updatedata,function(err,result){
        })
        //remove job detail if fails
        dbHandler.executeQuery("delete from vm_job_details where vm_id="+vm_id+" and job_type='BACKUP'",function(result){})
        //job name creation
        var random=Math.floor(1000 + Math.random() * 9000);
		backupJobName = vmDetail['vcenter_vm_name']+'_backup_'+random;
		//inserting into veeam job detail table
        var veeamJobData = {'vm_id':vm_id,'job_name':backupJobName,'job_type':'BACKUP','full_backup_day':currentJobFullBackupDay,
        'server_id':serverId,'status':'W','created_date':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),'backup_time':serverLastJobTme}
        var backupJobId=await new Promise(function(resolve, reject){
            dbHandler.insertIntoTable('vm_job_details',veeamJobData,function(err,result){
                if(err)return callback(400,'Record not inserted');
                resolve(result)
            })
        })
		//if replication is not enabled then immediately trigger the backup
		if(!repJobRst || repJobRst=='undefined')
		{
            let repName = await new Promise(function (resolve, reject) {
                getBackupRepositories(serverId,function(result){
                    resolve(result)
                });
             });
			if(repName == '')
			{
				//remove job detail if fails
                await dbHandler.executeQuery("delete from vm_job_details where id="+backupJobId,function(result){})
                //update vm status in db
                await dbHandler.executeQuery("update vms set backup_status='0' where id="+vm_id,function(result){})
                return callback(null,'Backup job creation failed because repository not available.')
			}			
			//update job status in db
            await dbHandler.executeQuery("update vm_job_details set status='S' where id="+backupJobId,function(result){})
			//submitting job creation request
			var requestUrl = 'http://'+backupServerIp+'/veeamapi/create_backup_job.php?vm_id='+vm_id+'&vm_name='+encodeURIComponent(vmDetail['vcenter_vm_name'])+'&shedule_time='+serverLastJobTme+'&full_backup_day='+currentJobFullBackupDay+'&job_name='+backupJobName+'&db_job_id='+backupJobId+'&rep_name='+repName;
            await axios.get(requestUrl)
            .then(response => {
                if(response.data!='1'){
                    //remove job detail if fails
                    dbHandler.executeQuery("delete from vm_job_details where id="+backupJobId,function(result){})
                    //update vm status in db
                    dbHandler.executeQuery("update vms set backup_status='0' where id="+vm_id,function(result){})
                    return callback(null,'Backup job creation failed because repository not available.'+response.data)
                }else{
                    return callback(null,'Job has been created successfully.')
                }
            })
            .catch(error => {
                console.log(error);
                return callback(null,'Job not created.'+error)
            })
			
        }
        		
    })
}
let createReplicaJob=(reqObj,logId,callback)=>{
    var inputs=reqObj.body
    if(!inputs.vm_id) return callback(400,'Please provide the vm_id')
    var vm_id=inputs.vm_id;
    new Promise(function(resolve, reject) {
        dbHandler.executeQuery("select * from infra_vms where id="+vm_id,function(result){
            if(result)
            resolve(result[0]);
            else resolve(result);
        })
    }).then(async function(vmDetail){
        const vdc = await new Promise(function (resolve, reject) {
            getVdcDetail(vmDetail.vdc_id, function (result) {
                if(!result)return callback(400,'VDC information not available.')
                resolve(result);
            });
        });
        //get target host
        let targetHost = await new Promise(function (resolve, reject) {
            getReplicaTargetHost(vmDetail.vdc_id, function (result) {
                if(!result)return callback(400,'Replica target host not found.')
                resolve(result);
            });
        });
        //get the replica server detail
		let serverData = await new Promise(function (resolve, reject) {
            getVeeamServer("R",vmDetail.vdc_id, function (result) {
                if(!result)return callback(400,'Replica server not found.')
                resolve(result);
            });
        });
		var replicaServerIp = serverData['ip_address'];
		var replicaServerUn = serverData['username'];
		var replicaServerPw = serverData['password'];
		var serverId	   = serverData['id'];
		var veeamDbName	   = serverData['db_name'];
        //rotate the job shedule time
		serverLastJobTme = serverData['last_job_time'];
		if(serverLastJobTme == '')
			hourlyOffset = 0;
		hourlyOffset = serverLastJobTme+10;
		if(hourlyOffset>59)
			hourlyOffset = 0;
        //get the backup server detail
		let backJobRst = await new Promise(function (resolve, reject) {
            dbHandler.executeQuery("select * from vm_job_details where job_type='BACKUP' and vm_id="+vm_id,function(result){
                if(result)
                resolve(result[0]);
                else resolve(result);
            })
        });
        var deniedHourArr = [22,23,0,1,2,3,4,5,6];
        var index=Math.floor(Math.random() * Math.floor(8));
		var deniedHour = deniedHourArr[index];
		//checking backup and replication job hourly offset is same, if same add 20 min latency
		if(backJobRst)
		{
			var backupHourOffset = backJobRst['backup_time'];
			var backupHourOffsetArr = backupHourOffset.split(":");
			//find replication job deied hour, while backup job is runing replication should disabled
			var deniedHour = backupHourOffsetArr[0];			
		}
		//update in to server table with new time
        var updatedata={'last_job_time':hourlyOffset};
        dbHandler.updateTableData('veeam_server',{id:serverId},updatedata,function(err,result){
        })
        //remove job detail if fails
        dbHandler.executeQuery("delete from vm_job_details where vm_id="+vm_id+" and job_type='REPLICA'",function(result){})
        //job name creation
        var random=Math.floor(1000 + Math.random() * 9000);
        replicaJobName = vmDetail['vcenter_vm_name']+'_replica_'+random;
        //source host name
		var sourceHost = vmDetail['vm_host'];
		//inserting into veeam job detail table
        var veeamJobData = {'vm_id':vm_id,'job_name':replicaJobName,'job_type':'REPLICA','denied_hour':deniedHour,
        'server_id':serverId,'status':'W','created_date':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),'backup_time':serverLastJobTme}
        var replicaJobId=await new Promise(function(resolve, reject){
            dbHandler.insertIntoTable('vm_job_details',veeamJobData,function(err,result){
                if(err)return callback(400,'Record not inserted');
                resolve(result)
            })
        })
		if(replicaJobId > 0)
		{	
			//update job status in db
            await dbHandler.executeQuery("update vm_job_details set status='S' where id="+replicaJobId,function(result){})
			//submitting job creation request
			var requestUrl = 'http://'+replicaServerIp+'/veeamapi/create_replication_job.php?vm_id='+vm_id+'&vm_name='+encodeURIComponent(vmDetail['vcenter_vm_name'])+'&source_host='+sourceHost+'&destination_host='+targetHost+'&job_name='+replicaJobName+'&db_job_id='+replicaJobId+'&hourly_offset='+hourlyOffset+'&denied_hour='+deniedHour;
            await axios.get(requestUrl)
            .then(response => {
                if(response.data!='1'){
                    //remove job detail if fails
                    dbHandler.executeQuery("delete from vm_job_details where id="+replicaJobId,function(result){})
                    //update vm status in db
                    dbHandler.executeQuery("update vms set dr_status='0' where id="+vm_id,function(result){})
                    return callback(null,'DR job creation failed, because veeam server not responded properly.'+response.data)
                }else{
                     return callback(null,'Job has been created successfully.')
                }
            })
            .catch(error => {
                console.log(error);
                return callback(null,'Job not created.'+error)
            })
			
        }
        		
    })
}
let getReplicaTargetHost=(vdc_id,callback)=>{
    new Promise(function(resolve, reject) {
        dbHandler.executeQuery("select * from replica_host where status='A' and vdc_id="+vdc_id+" order by last_used asc limit 1",function(result){
            if(result)
            resolve(result[0]);
            else resolve(result);
        })
    }).then(async function(replicaHost){
        if(replicaHost){
            dbHandler.updateTableData('replica_host',{'host':replicaHost['host'],'vdc_id':vdc_id},{'last_used':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")},function(err,result){})
            callback(replicaHost['host']);
        }else{
            callback('');
        }
    });
}
/*
	#Author:		Pradeep
	#Description:	for Updating the veeam job detail after job creation
	#Created Date:	14/08/2019
*/
let updateVeeamJobDetail=(req,callback)=>{
    var vmId = req.vm_id;
    var jobType = req.job_type;
    var dbJobId = req.db_job_id;
    var jobId = req.veeam_job_id;
    new Promise(function(resolve, reject) {
        dbHandler.getOneRecord('vm_job_details',{id:dbJobId,job_type:jobType},function(result){
            resolve(result)
        })
    }).then(async function(jobDetail){
        if(jobId != '' && jobDetail)
        {
            //update job details
            var jobDetailArr = {'job_id':jobId,'status':'A','updated_date':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")}
            dbHandler.updateTableData('vm_job_details',{id:dbJobId},jobDetailArr,function(err,result){})
            //update vm status in db
            if(jobType == 'REPLICA')
                dbHandler.updateTableData('vms',{id:vmId},{'dr_status':'1'},function(err,result){})
            else if(jobType == 'BACKUP')
                dbHandler.updateTableData('vms',{id:vmId},{'backup_status':'1'},function(err,result){})
            //update into api log table
            var dataArr={'status':'1','response_time':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")};
            dbHandler.updateTableData('infra_api_log',{method:'update_veeam_job_detail',vm_id:vmId,status:'2'},dataArr,function(err,result){})					
        }
        else
        {
            //remove job detail if fails
            dbHandler.executeQuery("delete from vm_job_details where id="+dbJobId,function(result){})
            //update vm status in db
            if(jobType == 'REPLICA')
                dbHandler.updateTableData('vms',{id:vmId},{'dr_status':'1'},function(err,result){})	
            else if(jobType == 'BACKUP')
                dbHandler.updateTableData('vms',{id:vmId},{'backup_status':'1'},function(err,result){})			
            //update into api log table       
            var error_log = {'COMPLETE_STATE':'error','ERROR_DATA':jobType+' job creation failed from veeam server','RESULT_DATA':jobDetail,'START_TIME':'','COMPLETE_TIME':Math.floor(Date.now()/1000)}
            error_log=JSON.stringify(error_log);
            var dataArr={'status':'0','response_time':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),'error_log':error_log};
            dbHandler.updateTableData('infra_api_log',{method:'update_veeam_job_detail',vm_id:vmId,status:'2'},dataArr,function(err,result){})					
        }
    })
    return callback(null,{message:'Job updated successfully.'})
}
let addVmDisk=(reqObj,logId,callback)=>{
    var inputs=reqObj.body
    if(!inputs.vm_id) return callback(400,'Please provide the vm_id')
    if(!inputs.disk_size_gb) return callback(400,'Please provide the disk_size_gb')
    var vm_id=inputs.vm_id;
    var disk_size_gb=inputs.disk_size_gb;
    new Promise(function(resolve, reject) {
        dbHandler.executeQuery("select * from infra_vms where id="+vm_id,function(result){
            if(result)
            resolve(result[0]);
            else resolve(result);
        })
    }).then(async function(vmDetail){
        const vdc = await new Promise(function (resolve, reject) {
            getVdcDetail(vmDetail.vdc_id, function (result) {
                if(!result)return callback(400,'vdc information not available')
                resolve(result);
            });
        });
        var vmName 	= vmDetail['vcenter_vm_name'];
        var inputParams='-Server "'+vdc.vdc_ip+'" -User "'+vdc.vdc_user+'" -password "'+vdc.vdc_password+'"';
        inputParams += ' -vmName "'+vmName+'" -disk_size "'+disk_size_gb+'"';
        var baseUrl = reqObj.protocol + '://' + reqObj.get('host');
		new Promise(function (resolve, reject) {
            powershell.exicutePSscript('add_disk',inputParams,function(result){
                axios.get(baseUrl+'/cron/update_vm_details?vm_id='+vm_id+'&wait_time=30000')
                updateApiLog({error_log:result},logId,function(result){})
                resolve(result)
            });
        });
		return callback(null,{message:'Add disk request received.'})
    })
}
let removeVmDisk=(reqObj,logId,callback)=>{
    var inputs=reqObj.body
    if(!inputs.vm_id) return callback(400,'Please provide the vm_id')
    if(!inputs.vcenter_disk_id) return callback(400,'Please provide the vcenter_disk_id')
    var vm_id=inputs.vm_id;
    var vcenter_disk_id=inputs.vcenter_disk_id;
    new Promise(function(resolve, reject) {
        dbHandler.executeQuery("select * from infra_vms where id="+vm_id,function(result){
            if(result)
            resolve(result[0]);
            else resolve(result);
        })
    }).then(async function(vmDetail){
        const vdc = await new Promise(function (resolve, reject) {
            getVdcDetail(vmDetail.vdc_id, function (result) {
                if(!result)return callback(400,'vdc information not available')
                resolve(result);
            });
        });
        const diskInfo = await new Promise(function (resolve, reject) {
            dbHandler.executeQuery("select * from infra_vm_disk_details where vm_id='"+vm_id+"' and vcenter_disk_id='"+vcenter_disk_id+"'",function(result){
                if(result)
            resolve(result[0]);
            else resolve(result);
            })
        });
        if(!diskInfo)return callback(400,'Disk information not found')
        if(diskInfo.name == 'Hard disk 1')return callback(400,'Sorry, we can not remove the primary disk')
        var vmName 	= vmDetail['vcenter_vm_name'];
        var inputParams='-Server "'+vdc.vdc_ip+'" -User "'+vdc.vdc_user+'" -password "'+vdc.vdc_password+'"';
        inputParams += ' -vmName "'+vmName+'" -disk_name "'+diskInfo.name+'"';
        var baseUrl = reqObj.protocol + '://' + reqObj.get('host');
		new Promise(function (resolve, reject) {
            powershell.exicutePSscript('remove_disk',inputParams,function(result){
                axios.get(baseUrl+'/cron/update_vm_details?vm_id='+vm_id+'&wait_time=30000')
                updateApiLog({error_log:result},logId,function(result){})
                resolve(result)
            });
        });
		return callback(null,{message:'Remove disk request received.'})
    })
}

let getPhysicalItemIds=(host_id,app_id,callback)=> {
    sql = "select parameter_id,units from zabbix_host_items where host_id = "+host_id+" AND application_id = "+app_id+" AND status=1";
    new Promise(function(resolve,reject){
        monitoringDB.executeQuery(sql,function(result){resolve(result)})
    }).then(async function(items){
        var itemids = [],units = [];
        await items.forEach(async function(obj){
            await itemids.push(obj.parameter_id);
            await units.push({itemid:obj.parameter_id,units:obj.units});
        })
        callback({itemids:itemids,units:units})  
    })
}
let getItemIds=(host_id,app_id,callback)=> {
    sql = "select parameter_id,units from zabbix_monitoring_custom_graph_view where host_id = "+host_id+" AND application_id = "+app_id+" AND status=1";
    new Promise(function(resolve,reject){
        monitoringDB.executeQuery(sql,function(result){resolve(result)})
    }).then(async function(items){
        var itemids = [],units = [];
        await items.forEach(async function(obj){
            await itemids.push(obj.parameter_id);
            await units.push({itemid:obj.parameter_id,units:obj.units});
        })
        callback({itemids:itemids,units:units})  
    })
}
let getAppIds=(host_id,serverid,callback)=> {
    sql = "select application_id from zabbix_monitoring_custom_graph_view where host_id = "+host_id+" AND serverid = "+serverid+" AND status=1 group by application_id";
    new Promise(function(resolve,reject){
        monitoringDB.executeQuery(sql,function(result){resolve(result)})
    }).then(async function(items){
        var response = [];
        await items.forEach(async function(obj){
            await response.push(obj.application_id);
        })
        callback(response)  
    })
}
let getPhysicalAppIds=(host_id,serverid,callback)=> {
    sql = "select application_id from zabbix_host_items where host_id = "+host_id+" AND serverid = "+serverid+" AND status=1 group by application_id";
    new Promise(function(resolve,reject){
        monitoringDB.executeQuery(sql,function(result){resolve(result)})
    }).then(async function(items){
        var response = [];
        await items.forEach(async function(obj){
            await response.push(obj.application_id);
        })
        callback(response)  
    })
}
// let getMonitoringGraphData=(reqObj,callback)=>{
//     if(!reqObj.vm_id) return callback(400,'Please provide the vm_id')
//     var vm_id=reqObj.vm_id;
//     new Promise(function(resolve, reject) {
//         monitoringDB.executeQuery(`select mon.host_id,ser.* from zabbix_monitoring as mon inner join zabbix_servers as ser
//          on mon.serverid=ser.id where mon.cloud_host_id=${vm_id}`,function(result){
//             if(result)
//             resolve(result[0]);
//             else resolve(result);
//         })
//     }).then(async function(zabbix_server){
//         const { ZabbixClient } = require("zabbix-client");
//         var appids=await new Promise(function(resolve,reject){
//             getAppIds(zabbix_server.host_id,zabbix_server.id,function(result){
//                 resolve(result)
//             });
//         });
//         var applications = await new Promise(async function (resolve, reject) {
//             var client = await new ZabbixClient(zabbix_server.server_name);
//             var api = await client.login(zabbix_server.username, zabbix_server.password);
//             var appData = await api.method("application.get").call(
//             {
//                 'output' : ['applicationid','name'],
//                 'hostids' : zabbix_server.host_id,
//                 'applicationids':appids
//             });
//             await api.logout();
//             resolve(appData)
//         });
//         var dataArr=[];
//         if (applications) {
//             for (key in applications) {
//                 var value=applications[key];            
//                 var appid= value.applicationid;
//                 var appname = value.name;
//                 var items=await new Promise(function(resolve,reject){
//                     getItemIds(zabbix_server.host_id,appid,function(result){
//                         resolve(result)
//                     });
//                 });
//                 var itemids=items.itemids;
//                 var units=items.units;
//                 var itemValues = await new Promise(async function (resolve, reject) {
//                     var client = await new ZabbixClient(zabbix_server.server_name);
//                     var api = await client.login(zabbix_server.username, zabbix_server.password);
//                     var appData = await api.method("item.get").call(
//                     {
//                         'output' : ['itemid','name','value_type','history'],
//                         'hostids' : zabbix_server.host_id,
//                         'applicationids' : appid,
//                         'itemids': itemids,
//                         'filter' :{'status':0}
//                     });
//                     await api.logout();
//                     resolve(appData)
//                 });
//                 var finalItemArr=[];
//                 var time_till    = await Math.floor(Date.now()/1000);
//                 for(var kk in itemValues){
//                     var obj=itemValues[kk];
//                     var time_from  =await parseInt(Math.floor(Date.now()/1000)-(60*24));
//                     var eachItem = await new Promise(async function (resolve, reject) {
//                         var client =await new ZabbixClient(zabbix_server.server_name);
//                         var api = await client.login(zabbix_server.username, zabbix_server.password);
//                         var appData = await api.method("history.get").call(
//                         {
//                             'output' : 'extend',
//                             'hostids' : zabbix_server.host_id,
//                             'itemids': obj.itemid,
//                             'time_from':time_from,
//                             'time_till':time_till,
//                             'history':obj.value_type
//                         });
//                         await api.logout();
//                         resolve(appData)
//                     });
//                     if(eachItem)
//                     {
//                         var clockData = [], valData = [];
//                         await eachItem.forEach(async function(obj){
//                             if(units[0].itemid==obj.itemid && units[0].units=='B'){
//                                 var val=Number.parseFloat(parseInt(obj.value)/(1024*1024*1024)).toFixed(3)+' GB';
//                                 await valData.push(val);
//                             }
//                             else
//                             await valData.push(obj.value);
//                             await clockData.push(dateFormat(new Date(obj.clock * 1000), "yyyy-mm-dd HH:MM:ss"));
//                         })
//                         finalItemArr.push({item_id:obj.itemid,item_name:obj.name,valData:valData,clockData:clockData});
//                     }
//                 }
//                 dataArr.push({values:finalItemArr,appid:appid,appname:appname});
//             }
//         }
//         callback(null,dataArr)
//     });
// }
let getMonitoringGraphData=(reqObj,callback)=>{
    if(!reqObj.vm_id) return callback(400,'Please provide the vm_id')
    var vm_id=56740//reqObj.vm_id;
    //reqObj.service_type='DEDICATED';
    new Promise(function(resolve, reject) {
        if(reqObj && reqObj.service_type && reqObj.service_type!='CLOUD')
        {
            monitoringDB.executeQuery(`select mon.host_id,ser.* from zabbix_hosts as mon inner join zabbix_servers as ser
            on mon.serverid=ser.id where mon.cloud_host_id=${vm_id}`,function(result){
                if(result)
                resolve(result[0]);
                else resolve(result);
            })
        }else{
            monitoringDB.executeQuery(`select mon.host_id,ser.* from zabbix_monitoring as mon inner join zabbix_servers as ser
            on mon.serverid=ser.id where mon.cloud_host_id=${vm_id}`,function(result){
                if(result)
                resolve(result[0]);
                else resolve(result);
            })
        }
    }).then(async function(zabbix_server){
        console.log(zabbix_server)
        // var appids=await new Promise(function(resolve,reject){
        //     if(reqObj && reqObj.service_type && reqObj.service_type!='CLOUD'){
        //         getPhysicalAppIds(zabbix_server.host_id,zabbix_server.id,function(result){
        //             resolve(result)
        //         });
        //     }else{
        //         getAppIds(zabbix_server.host_id,zabbix_server.id,function(result){
        //             resolve(result)
        //         });
        //     }            
        // });
        // var client = await new ZabbixClient(zabbix_server.server_name);
        // var api = await client.login(zabbix_server.username, zabbix_server.password);
        // var applications = await new Promise(async function (resolve, reject) {
        //     var appData = await api.method("application.get").call(
        //     {
        //         'output' : ['applicationid','name'],
        //         'hostids' : zabbix_server.host_id,
        //         'applicationids':appids
        //     });
        //     //await api.logout();
        //     resolve(appData)
        // });
        // monitoringModel.zabixApiApplicationGet(zabbix_server.id,zabbix_server.host_id,function(data){
        //     console.log(data)
        // })
        var applications = await new Promise(function (resolve, reject) {
            try{
                var url=`${config.ZABBX_URL}/nagios/index.php/api/common_api/get_application_data`
                var postData={
                    server_id:zabbix_server.id,
                    host_id:zabbix_server.host_id,
                    security_key:config.ZABBX_KEY,
                    output:['applicationid','name']
                  }
                  //console.log(postData)
                  axios.post(url,querystring.stringify(postData))
                  .then(response=>{
                      //console.log(response.data.data);
                      if(response && response.data && response.data.data)
                      resolve(response.data.data);
                      else resolve([]);
                  })
                  .catch(error=>{
                      //console.log(error)
                      resolve([]);
                  })
            }catch(e){
                resolve([])
            }
        });
        //console.log(applications)
        var dataArr=[];
        if (applications) {
            for (key in applications) {
                var value=applications[key];            
                var appid= value.applicationid;
                var appname = value.name;
                var items=await new Promise(function(resolve,reject){
                    if(reqObj && reqObj.service_type && reqObj.service_type!='CLOUD'){
                        getPhysicalItemIds(zabbix_server.host_id,appid,function(result){
                            //console.log(result);
                            resolve(result)
                        });
                     }else{
                        getItemIds(zabbix_server.host_id,appid,function(result){
                            //console.log(result);
                            resolve(result)
                        });
                     }
                });
                var itemids=items.itemids;
                var item_ids = await itemids.join();
                //console.log(item_ids)
                var units=items.units;
                var itemValues = await new Promise(async function (resolve, reject) {
                    //var client = await new ZabbixClient(zabbix_server.server_name);
                    //var api = await client.login(zabbix_server.username, zabbix_server.password);
                    // var appData = await api.method("item.get").call(
                    // {
                    //     'output' : ['itemid','name','value_type','history'],
                    //     'hostids' : zabbix_server.host_id,
                    //     'applicationids' : appid,
                    //     'itemids': itemids,
                    //     'filter' :{'status':0}
                    // });
                    if(reqObj && reqObj.service_type && reqObj.service_type!='CLOUD')
                    var sql=`select *,parameter_id as itemid,name_expanded as name from zabbix_host_items where host_id=${zabbix_server.host_id}
                     and application_id=${appid} and parameter_id in(${item_ids}) group by name_expanded`;
                    else
                    var sql=`select *,parameter_id as itemid,name_expanded as name from zabbix_monitoring_custom_graph_view where host_id=${zabbix_server.host_id}
                     and application_id=${appid} and parameter_id in(${item_ids}) group by name_expanded`;
                    //console.log(sql)
                    monitoringDB.executeQuery(sql,function(result){
                        //console.log(result);
                        resolve(result)
                    })
                    //await api.logout();
                    //resolve(appData)
                });
                var finalItemArr=[];
                var time_till    = await Math.floor(Date.now()/1000);
                for await(var obj of itemValues){
                    //var obj=itemValues[kk];
                    var time_from  =await parseInt(Math.floor(Date.now()/1000)-(60*24));
                    var eachItem = await new Promise(async function (resolve, reject) {
                        //var client =await new ZabbixClient(zabbix_server.server_name);
                        //var api = await client.login(zabbix_server.username, zabbix_server.password);
                        var postdata={
                            security_key : config.ZABBX_KEY,
                            serverid:zabbix_server.id,
                            host_id : zabbix_server.host_id,
                            itemid: obj.itemid,
                            value_type:obj.value_type,
                            units:obj.units,
                            limit:10,
                            service_name:"test",
                            history:obj.history
                        }
                        //console.log(postdata)
                        if(reqObj && reqObj.service_type && reqObj.service_type!='CLOUD')
                        var graph_url=`${config.ZABBX_URL}/nagios/index.php/api/service_api/get_advanced_services_graph`
                        else
                        var graph_url=`${config.ZABBX_URL}/nagios/index.php/api/nagios_details_api/get_advanced_services_graph`
                        axios.post(graph_url,querystring.stringify(postdata))
                        .then(response => {
                            //console.log(graph_url)
                            //console.log(response.data);
                            if(response && response.data && response.data.response)
                            resolve(JSON.parse(response.data.response))
                            else resolve([])
                        })
                        .catch(error => {
                            //console.log(error);
                            resolve([])
                        });
                        // var appData = await api.method("history.get").call(
                        // {
                        //     'output' : 'extend',
                        //     'hostids' : zabbix_server.host_id,
                        //     'itemids': obj.itemid,
                        //     'time_from':time_from,
                        //     'time_till':time_till,
                        //     'history':obj.value_type
                        // });
                        
                        //resolve(appData)
                    });
                    if(eachItem)
                    {
                        //console.log(eachItem)
                        var clockData = [], valData = [];
                        await eachItem.forEach(async function(obj){
                            // if(units[0].itemid==obj.itemid && units[0].units=='B'){
                            //     var val=Number.parseFloat(parseInt(obj.value)/(1024*1024*1024)).toFixed(3)+' GB';
                            //     await valData.push(val);
                            // }
                            // else
                            await valData.push(obj.value);
                            await clockData.push(obj.date);
                        })
                        //console.log(obj.name)
                        finalItemArr.push({item_id:obj.itemid,item_name:obj.name,valData:valData,clockData:clockData});
                    }
                }
                dataArr.push({values:finalItemArr,appid:appid,appname:appname});
            }
            
        }
        //await api.logout();
        return callback(null,dataArr)
    });
}

module.exports={getVcenterDetailById,addVcenterDetails,updateVcenterDetails,validateVcenterConnection,
    getDatastoreDetailById,addDatastoreDetails,updateDatastoreDetails,getHostDetailById,addHostDetails,
    updateHostDetails,vcenterVms,vcenterDatastores,vcenterHosts,vcenterTemplates,vcenterSnapshots,addVm,
    createVm,vmOperations,getVdcDetail,getDatastoreDetailByName,getHostDetailByIp,updateIpamIpStatus,insertIpLog,
    logSyncData,vcenterLogs,updateVmMemory,updateVmCpu,addVmDisk,removeVmDisk,insertApiLog,updateApiLog,
    getTemplateDetailByTemplateName,getMonitoringGraphData,createBackupJob,getVeeamServer,updateVeeamJobDetail,
    getServerDetailByServerId,getBackupRepositories,createReplicaJob,getReplicaTargetHost,vcenterDatastoreDetailByName,
    vcenterHostDetailByName,datastoreUnderHost,hostUnderDatastore
}

