const dbHandler= require('../config/api_db_handler')
const monitoringDB= require('../config/monitoring_db');
const helper = require('../helpers/common_helper')
var fs = require('fs');
const axios = require('axios')
const in_array = require('in_array');
const dateFormat = require('dateformat');
var pdf = require('html-pdf');
const powershell = require('./powershell')
const vmwareModel = require('../models/vmware_model')
const array_unique = require('array-unique');
var path = require('path');
var _basePath = 'file:///' + __dirname+"/../" ;
//const curl = new (require("curl-request"))();
var request = require('request');
const http = require('http');
const querystring = require('querystring');
const config=require('../config/constants');
const { getAwsInstanceTypes } = require('./aws_model');
const { response } = require('express');
var data=[];
/*
  Author: Pradeep
  Descri: sync vms from vcenter
  Date  : 23-04-2019
*/
let syncVcenterVms=(vdc_id,callback)=>{
    return new Promise(function(resolve, reject){
        vmwareModel.getVdcDetail(vdc_id,function(result){
            if(!result)return callback(400,'vdc information not available')
            resolve(result)
        })
    }).then(async function(vdc){
        var dbcon=require('../models/'+vdc.db_type+'_query')
        var vcenterVms=await new Promise(function(resolve, reject){
            dbcon.vcenterVmDetailsList(vdc,function(err,result){
                if(err)return callback(400,err)
                resolve(result)
            })
        });
        var result=vcenterVms.data
        var vmDataArr={};
        var ipAddressArr={};
        var diskArr={};
        var vms_arr=await new Promise(async function (resolve, reject) {
            for (var i in result) {
                vmId = result[i].ID;
                temp_arr={};
                powerState = 'PowerOff';
                if(in_array(result[i].POWER_STATE,[0,'Off']))
                    powerState = 'PowerOff';
                else if(in_array(result[i].POWER_STATE,[1,'On']))
                    powerState = 'PowerOn';
                else if(in_array(result[i].POWER_STATE,[2,'Suspended']))
                    powerState = 'Suspend';	
                var vmName=await decodeURIComponent(result[i].NAME);
                vmDataArr[vmId]={ 'vcenterVmId':'VirtualMachine-vm-'+vmId,'vmId':vmId,'vmHostName': result[i].DNS_NAME,
                    'powerState': powerState,'memoryMb': result[i].MEM_SIZE_MB,'cpu': result[i].NUM_VCPU,
                    'NUM_DISK': result[i].NUM_DISK,'host': result[i].HOST, 'datastore': result[i].DATASTORE,
                    'vmName': vmName,'guest': result[i].GUEST_OS,'os_type': result[i].GUEST_FAMILY,
                    'vcenter_uuid': result[i].VMUNIQUEID,'vmware_tool':result[i].VMMWARE_TOOL
                };
                await new Promise(function (resolve2, reject2) {
                    console.log(vmName)
                    dbHandler.updateTableData('infra_vms',{name:vmName,vdc_id:vdc_id},{vcenter_vm_id:'VirtualMachine-vm-'+vmId,vcenter_uuid:result[i].VMUNIQUEID},function(err,result){resolve2(1)});
                })
                if(!ipAddressArr[vmId])
                ipAddressArr[vmId]=new Array();
                ipAddressArr[vmId][ipAddressArr[vmId].length]=result[i].IP_ADDRESS;
                ipAddressArr[vmId]=await array_unique(ipAddressArr[vmId]);
                if(!diskArr[vmId])
                diskArr[vmId]=new Array();
                diskArr[vmId][diskArr[vmId].length]={
                    'capacity':result[i].CAPACITY,
                    //'vdevice_id':result[i].VDEVICE_ID,
                    'disk_label':result[i].DISK_LABEL
                }
            }
            resolve({ips:ipAddressArr,diskInfo:diskArr,vms:vmDataArr})
        }); 
        var vms_ids=[];
        var replicaServerVmArr = ['repl4cp4','repl6cp4','repl5cp4','repl3cp4','repl2cp4','repl1cp3'];
        for (var vmId in vms_arr.vms) {
            var vmData=vms_arr.vms[vmId];
            vmName = vmData['vmName'];
            //console.log(vmName+'**********'+vmId)
			if(in_array(vmName,replicaServerVmArr))
                continue;
            var vCenterVmId = vmData['vcenterVmId'];
            var vcenter_uuid = vmData['vcenter_uuid'];
            var checkVm=await new Promise(function (resolve, reject) {
                dbHandler.getOneRecord('infra_vms',{vcenter_vm_name:vmName,vdc_id:vdc_id},function(result){
                    resolve(result)
                })
            })
            if(!checkVm)
            {
                //finding os type
                var template = '';var osType='';
                if(vmData['os_type'] == 'linuxGuest')
                    osType   = 'linux';
                else
                    osType   = 'windows';
                //check the vm have ip address	
                var ipAddress = '';
                if(vms_arr.ips[vmId].length>0)					
                ipAddress = vms_arr.ips[vmId][0];
                //username and password
                if(osType == 'windows')
                {
                    ctrl4cUserName   = '..\ctrl4c';
                    userName	= 'Administrator';
                    password 	= 'Not Available';
                }
                else
                {
                    ctrl4cUserName   = 'ctrl4c';
                    userName	= 'root';
                    password 	= 'Not Available';
                }
                //calculating total disk size
                var diskSize = 0;var diskArr=[];
                for(d=0;d<vms_arr.diskInfo[vmId].length;d++)
                {
                    if(!in_array(vms_arr.diskInfo[vmId][d].disk_label,diskArr)){
                        await diskArr.push(vms_arr.diskInfo[vmId][d].disk_label);
                        diskSize = parseFloat(diskSize)+parseFloat(vms_arr.diskInfo[vmId][d].capacity);
                    }
                }
                data={ 
                    vcenter_vm_id:vCenterVmId,name:vmName,host_name:vmData['vmHostName'],vcenter_vm_name:vmName,
                    cpu_count:vmData['cpu'], ram:vmData['memoryMb'],status:vmData['powerState'],
                    ip_address:ipAddress, date_added:dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                    vm_host:vmData['host'],os_type:osType,os:vmData['guest'],vdc_id:vdc_id,template:template,is_running_under_dr:'0',
                    vcenter_uuid:vmData['vcenter_uuid'],is_running_under_restore:'0', dr_status:'0', backup_status:'0',
                    datastore:vmData['datastore'], hdd:diskSize, creation_status:'C',ctrl4c_user:ctrl4cUserName,
                    ctrl4c_password:'ctrls.1234$#$',user:userName, password:password,vmware_tool:vmData['vmware_tool']
                }
                var vm_id=await new Promise(function (resolve, reject) {
                    dbHandler.insertIntoTable('infra_vms',data,function(err,result){
                        resolve(result)
                    })
                })
                if(vm_id > 0){
                    if(vms_arr.ips[vmData['vmId']].length > 0)
                    {
                        for(h=0;h<vms_arr.ips[vmData['vmId']].length;h++)
                        {
                            var insertIpDataArr={};
                            ipAddress = vms_arr.ips[vmData['vmId']][h];
                            ipArr = ipAddress.split(".");
                            dns = '';
                            if(osType == 'windows')
                                dns = '8.8.8.8';
                            dGateway = ipArr[0]+"."+ipArr[1]+"."+ipArr[2]+".1";
                            subnetmask = '255.255.255.0';
                            insertIpDataArr = {'vm_id':vm_id,'ip_address':ipAddress,'date_added':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                                    'subnetmask':subnetmask,'defult_gateway':dGateway,'interface':'eth0'}
                            await new Promise(function (resolve, reject) {
                            dbHandler.insertIntoTable('infra_vm_ips',insertIpDataArr,function(err,result){resolve(result)});
                            })
                            //updating ip in ipam
                            vmwareModel.updateIpamIpStatus(ipAddress,0,vm_id);
                            var ipNote = "New VM with name "+vmData['vmName']+" sync with middle layer with this IP";
                            vmwareModel.insertIpLog(ipAddress,vm_id,0,ipNote);
                        }
                    }
                    //insert into disk detail table
					if(vms_arr.diskInfo[vmData['vmId']].length > 0)
					{
							//attaching vm id to diskdata array
						for(j=0;j<vms_arr.diskInfo[vmData['vmId']].length;j++)
						{
                            var diskData=vms_arr.diskInfo[vmData['vmId']][j];
                            var diskDataArr={};
							if(!diskData['disk_label'])
                                var disk_label = 'Hard disk '+(await parseInt(j)+ await parseInt(1));
							else
                                var disk_label = diskData['disk_label'];
                            //disk_label
                            var timeInMss = await new Promise(function (resolve, reject) {
                                 resolve(Math.floor(new Date().getTime()/1000)-parseInt(Math.floor(Math.random()*100000+1)));
                            });
                            diskDataArr = {'vm_id':vm_id,'storage_format':'thin','date_added':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                                    'disk_type':'Flat','capacity_gb':diskData['capacity'],'name':disk_label,vcenter_disk_id:timeInMss}
                            await new Promise(function (resolve, reject) {
                                dbHandler.insertIntoTable('infra_vm_disk_details',diskDataArr,function(err,result){resolve(result)});
                            })
						}
					}
					//loging
					vmwareModel.logSyncData({'vm_name':vmName,'vm_id':vm_id,'action':'NEWVM','notes':""});	
                    vms_ids.push(vm_id);
                }
            }else{
                await new Promise(function (resolve1, reject1) {
                    dbHandler.updateTableData('infra_vms',{name:vmName,vdc_id:vdc_id,vcenter_vm_id:''},{vcenter_vm_id:vCenterVmId,vcenter_uuid:vcenter_uuid},function(err,result){resolve1(1)});
                })
                updateVmDetails({vm_id:checkVm.id},function(err,result){});
            }
            
        }   
        var response={data:vms_ids,message:'Records Inserted Successfully.'}
        return callback(null,response)        
    })
}
/*
  Author: Pradeep
  Descri: Update vm status
  Date  : 23-04-2019
*/
let updateVmStatus=(reqObj,callback)=>{
    var vm_id=reqObj.vm_id;
    new Promise(function(resolve, reject) {
        dbHandler.executeQuery("select * from infra_vms where id="+vm_id,function(result){
            if(result)
            resolve(result[0]);
            else resolve(result);
        })
    }).then(async function(vmDetail){
        const vdc = await new Promise(function (resolve, reject) {
            vmwareModel.getVdcDetail(vmDetail.vdc_id, function (result) {
                if(!result)return callback(400,'vdc information not available')
                resolve(result);
            });
        });
        if(reqObj.wait_time)
        await helper.sleep(reqObj.wait_time);
        var dbcon=require('../models/'+vdc.db_type+'_query')
        var vcenterVmId=vmDetail.vcenter_vm_id.replace('VirtualMachine-vm-', '');
        var vcenterVmDetail=await new Promise(function(resolve, reject){
            dbcon.vcenterVmDetailById(vcenterVmId,vdc,function(err,result){
                if(err)return callback(400,'The operation did not execute as expected. Please raise a ticket to support')
                resolve(result.data)
            })
        });
        powerState = 'PowerOff';
        if(in_array(vcenterVmDetail.POWER_STATE,[0,'Off']))
            powerState = 'PowerOff';
        else if(in_array(vcenterVmDetail.POWER_STATE,[1,'On']))
            powerState = 'PowerOn';
        else if(in_array(vcenterVmDetail.POWER_STATE,[2,'Suspended']))
            powerState = 'Suspend';	
        data={
            'status':powerState,'vmware_tool':vcenterVmDetail.VMMWARE_TOOL,'action_status':'Done'
        }
        dbHandler.updateTableData('infra_vms',{id:vm_id},data,function(err,result){
            if(err)return callback(400,'Record Not Updated')
            var response={data:result,message:'Record Updated Successfully'}
            return callback(null,response)
        })
    });
}
/*
  Author: Pradeep
  Descri: sync datastore from vcenter
  Date  : 23-04-2019
*/
let syncVcenterDatastores=(vdc_id,callback)=>{
    return new Promise(function(resolve, reject){
        vmwareModel.getVdcDetail(vdc_id,function(result){
            if(!result)return callback(400,'vdc information not available')
            resolve(result)
        })
    }).then(async function(vdc){
        var vcenterDatastores=await new Promise(function(resolve, reject){
            vmwareModel.vcenterDatastores(vdc_id,function(err,result){
                if(err)return callback(400,'The operation did not execute as expected. Please raise a ticket to support')
                resolve(result)
            })
        });
        var datastores=vcenterDatastores.data
        var data_ids=[];
        for (var i in datastores) {
            data={};
            data={'datastore_name':datastores[i].NAME,'vdc_id':vdc_id,'status': 'I'};
            var checkDatastore=await new Promise(function (resolve, reject) {
                vmwareModel.getDatastoreDetailByName(datastores[i].NAME,vdc_id,function(result){
                    resolve(result)
                })
            });
            if(!checkDatastore)
            {
                var insertedId=await new Promise(function (resolve, reject) {
                    dbHandler.insertIntoTable('infra_vm_datastore',data,function(err,result){
                        resolve(result)
                    })
                })
                if(insertedId)
                data_ids.push(insertedId);
            }else if(checkDatastore.datastore_name!=''){
                var vmsdata = {'disk_type':checkDatastore['disk_type']}
                await new Promise(function(resolve, reject){
                    dbHandler.updateTableData('infra_vms',{datastore:checkDatastore.datastore_name,vdc_id:vdc_id},vmsdata,function(err,result){resolve(result)});
                })
            }
        }
        var response={data:data_ids,message:'Records Inserted Successfully.'}
        return callback(null,response)        
    }) 
}
/*
  Author: Pradeep
  Descri: sync datastore from vcenter
  Date  : 23-04-2019
*/
let syncVcenterHosts=(vdc_id,callback)=>{
    return new Promise(function(resolve, reject){
        vmwareModel.getVdcDetail(vdc_id,function(result){
            if(!result)return callback(400,'vdc information not available')
            resolve(result)
        })
    }).then(async function(vdc){
        var vcenterHosts=await new Promise(function(resolve, reject){
            vmwareModel.vcenterHosts(vdc_id,function(err,result){
                if(err)return callback(400,'The operation did not execute as expected. Please raise a ticket to support')
                resolve(result)
            })
        });
        var hosts=vcenterHosts.data
        var data_ids=[];
        for (var i in hosts) {
            data={};
            data={'host_ip':hosts[i].IP_ADDRESS,'host_name':hosts[i].DNS_NAME,'vdc_id':vdc_id,'status': 'I'};
            var checkHost=await new Promise(function (resolve, reject) {
                vmwareModel.getHostDetailByIp(hosts[i].IP_ADDRESS,vdc_id,function(result){
                    resolve(result)
                })
            });
            if(!checkHost)
            {
                var insertedId=await new Promise(function (resolve, reject) {
                    dbHandler.insertIntoTable('infra_vm_host',data,function(err,result){
                        resolve(result)
                    })
                })
                if(insertedId)
                data_ids.push(insertedId);
            }
        }
        var response={data:data_ids,message:'Records Inserted Successfully.'}
        return callback(null,response)        
    }) 
}
/*
  Author: Pradeep
  Descri: sync datastore from vcenter
  Date  : 23-04-2019
*/
let syncVcenterTemplates=(vdc_id,callback)=>{
    return new Promise(function(resolve, reject){
        vmwareModel.getVdcDetail(vdc_id,function(result){
            if(!result)return callback(400,'vdc information not available')
            resolve(result)
        })
    }).then(async function(vdc){
        var vcenterTemplates=await new Promise(function(resolve, reject){
            vmwareModel.vcenterTemplates(vdc_id,function(err,result){
                if(err)return callback(400,'The operation did not execute as expected. Please raise a ticket to support')
                resolve(result)
            })
        });
        var templates=vcenterTemplates.data
        var data_ids=[];
        for (var i in templates) {
            data={};
            var type='linux';
            var port=2232;
            var template=templates[i].NAME
			if(templates[i].GUEST_FULL_NAME.toLowerCase().indexOf('windows') > 0)
			{
				type='windows';port=33893;
			}
            data={'vcenter_temp_name':template,'name':template,os_name:templates[i].GUEST_FULL_NAME,'vdc_id':vdc_id,
            'status': 'I','hot_add':'N',port:port,adding_ip_type:1,type:type};
            var checkTemplate=await new Promise(function (resolve, reject) {
                vmwareModel.getTemplateDetailByTemplateName(template,vdc_id,function(result){
                    resolve(result)
                })
            });
            if(!checkTemplate)
            {
                var insertedId=await new Promise(function (resolve, reject) {
                    dbHandler.insertIntoTable('infra_vm_templates',data,function(err,result){
                        resolve(result)
                    })
                })
                if(insertedId)
                data_ids.push(insertedId);
            }
        }
        var response={data:data_ids,message:'Records Inserted Successfully.'}
        return callback(null,response)        
    }) 
}
/*
  Author: Pradeep
  Descri: Update vm status
  Date  : 23-04-2019
*/
let updateVmDetails=(reqObj,callback)=>{
    var vm_id=reqObj.vm_id;
    if(!vm_id) return callback(400,'Please provide the vm_id')
    syncIpFromVcenter(reqObj,function(err,result){});
    new Promise(function(resolve, reject) {
        dbHandler.executeQuery("select * from infra_vms where id="+vm_id,function(result){
            if(result)
            resolve(result[0]);
            else resolve(result);
        })
    }).then(async function(vmDetail){
        const vdc = await new Promise(function (resolve, reject) {
            vmwareModel.getVdcDetail(vmDetail.vdc_id, function (result) {
                if(!result)return callback(400,'vdc information not available')
                resolve(result);
            });
        });
        if(reqObj.wait_time)
        await helper.sleep(reqObj.wait_time);
        var dbcon=require('../models/'+vdc.db_type+'_query')
        if(!vmDetail.vcenter_vm_id)return callback(400,'vcenter vm id is not available')
        var vcenterVmId=vmDetail.vcenter_vm_id.replace('VirtualMachine-vm-', '');
        var vcenterVms=await new Promise(function(resolve, reject){
            dbcon.vcenterVmDetailsById(vcenterVmId,vdc,function(err,result){
                if(err)return callback(400,'The operation did not execute as expected. Please raise a ticket to support')
                resolve(result)
            })
        });
        var result=vcenterVms.data
        var vmDataArr={};
        var ipAddressArr={};
        var diskArr={};
        var vms_arr=await new Promise(async function (resolve, reject) {
            for (var i in result) {
                vmId = result[i].ID;
                temp_arr={};
                powerState = 'PowerOff';
                if(in_array(result[i].POWER_STATE,[0,'Off']))
                    powerState = 'PowerOff';
                else if(in_array(result[i].POWER_STATE,[1,'On']))
                    powerState = 'PowerOn';
                else if(in_array(result[i].POWER_STATE,[2,'Suspended']))
                    powerState = 'Suspend';	
                var vmName=await decodeURIComponent(result[i].NAME);
                vmDataArr[vmId]={ 'vcenterVmId':'VirtualMachine-vm-'+vmId,'vmId':vmId,'vmHostName': result[i].DNS_NAME,
                    'powerState': powerState,'memoryMb': result[i].MEM_SIZE_MB,'cpu': result[i].NUM_VCPU,
                    'NUM_DISK': result[i].NUM_DISK,'host': result[i].HOST, 'datastore': result[i].DATASTORE,
                    'vmName': vmName,'guest': result[i].GUEST_OS,'os_type': result[i].GUEST_FAMILY,
                    'vcenter_uuid': result[i].VMUNIQUEID,'vmware_tool':result[i].VMMWARE_TOOL
                };
                if(!ipAddressArr[vmId])
                ipAddressArr[vmId]=new Array();
                ipAddressArr[vmId][ipAddressArr[vmId].length]=result[i].IP_ADDRESS;
                ipAddressArr[vmId]=await array_unique(ipAddressArr[vmId]);
                if(!diskArr[vmId])
                diskArr[vmId]=new Array();
                diskArr[vmId][diskArr[vmId].length]={
                    'capacity':result[i].CAPACITY,
                    //'vdevice_id':result[i].VDEVICE_ID,
                    'disk_label':result[i].DISK_LABEL
                }
            }
             resolve({ips:ipAddressArr,diskInfo:diskArr,vms:vmDataArr})
        }); 
        
        for (var vmId in vms_arr.vms) {
            var vmData=vms_arr.vms[vmId]
			vmName = vmData['vmName'];
            //finding os type
            var template = '';var osType='';
            if(vmData['os_type'] == 'linuxGuest')
                osType   = 'linux';
            else
                osType   = 'windows';
            //check the vm have ip address	
            var ipAddress = '';
            if(vms_arr.ips[vmId].length>0)					
            ipAddress = vms_arr.ips[vmId][0];
            //calculating total disk size
            var diskSize = 0;var diskArr=[];
            for(d=0;d<vms_arr.diskInfo[vmId].length;d++)
            {
                if(!in_array(vms_arr.diskInfo[vmId][d].disk_label,diskArr)){
                    await diskArr.push(vms_arr.diskInfo[vmId][d].disk_label);
                    diskSize = parseFloat(diskSize)+parseFloat(vms_arr.diskInfo[vmId][d].capacity);
                }
            }
             //update disk information
            if(vms_arr.diskInfo[vmData['vmId']].length > 0)
            {
                var diskIdsArr=[];
                //attaching vm id to diskdata array
                for(j=0;j<vms_arr.diskInfo[vmData['vmId']].length;j++)
                {
                    var diskData=vms_arr.diskInfo[vmData['vmId']][j];
                    var diskDataArr={};
                    if(!diskData['disk_label'])
                        var disk_label = 'Hard disk '+(await parseInt(j)+ await parseInt(1));
                    else
                        var disk_label = diskData['disk_label'];
                    var diskInfo=await new Promise(function(resolve, reject){
                        dbHandler.executeQuery("select * from infra_vm_disk_details where vm_id="+vm_id+" and name='"+disk_label+"'",function(result){
                            if(result)
                            resolve(result[0]);
                            else resolve(result);
                        })
                    });
                    if(diskInfo){
                        console.log('diskinfo updated')
                        diskDataArr = {'capacity_gb':diskData['capacity'],'updated_date':dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss"),'status':'A'}
                        await new Promise(function(resolve, reject){
                            dbHandler.updateTableData('infra_vm_disk_details',{id:diskInfo.id},diskDataArr,function(err,result){resolve(result)});
                        })
                        await diskIdsArr.push(diskInfo.id);
                    }else{
                        console.log('diskinfo inserted')
                        var timeInMss = await new Promise(function (resolve, reject) {
                            resolve(Math.floor(new Date().getTime()/1000)-parseInt(Math.floor(Math.random()*100000+1)));
                       });
                        diskDataArr = {'vm_id':vm_id,'storage_format':'thin','date_added':dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss"),'status':'A',
                        'disk_type':'Flat','capacity_gb':diskData['capacity'],'name':disk_label,vcenter_disk_id:timeInMss}
                        var diskId=await new Promise(function(resolve, reject){
                            dbHandler.insertIntoTable('infra_vm_disk_details',diskDataArr,function(err,result){resolve(result)});
                            var logStr = vmName+" with id "+vm_id+" was added new disk with name "+disk_label;
                            vmwareModel.logSyncData({'vm_name':vmName,'vm_id':vm_id,'action':'DISK','notes':logStr});
                        });
                        await diskIdsArr.push(diskId);	
                    }
                }
                //delete all other disks from db
                if(diskIdsArr.length > 0)
                {
                    var disk_ids=await diskIdsArr.join();
                    console.log('disk deleted-'+disk_ids)
                    await new Promise(function(resolve, reject){
                        var sqlQry="update infra_vm_disk_details set status='D',updated_date='"+dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")+"' where vm_id="+vm_id+" and status !='D' and id not in("+disk_ids+")"
                        dbHandler.executeQuery(sqlQry,function(result){resolve(result)});
                    })
                }
            }
             //update ip information
            var ipAddressArr = vms_arr.ips[vmData['vmId']];
            var ipIdArr = [];
            if(ipAddressArr)
            {
                for(i=0;i<ipAddressArr.length;i++)
                {
                    var ipArr =[];
                    ip = ipAddressArr[i];
                    if(!ip)continue;
                    var vm_ip_id=await new Promise(function(resolve, reject){
                        dbHandler.executeQuery("select * from infra_vm_ips where vm_id='"+vm_id+"' and ip_address='"+ip+"'",function(result){
                            try{
                                if(result[0].id)
                                resolve(result[0].id);
                            }
                            catch{
                                resolve(0);
                            }
                        })
                    });		
                    //creating gateway
                    if(ip)
                    var ipOctArr = ip.split(".");
                    var dns = '';
                    if(vmDetail['os_type'] == 'windows')
                        dns = '8.8.8.8';
                    if(ipOctArr)
                    var dGateway = ipOctArr[0]+"."+ipOctArr[1]+"."+ipOctArr[2]+".1";
                    var subnetmask = '255.255.255.0';
                    if(vm_ip_id == 0)
                    {
                        var ipArr = {'vm_id':vm_id,'ip_address':ip,'dns':dns,'interface':'eth'+i}
                        ipArr.defult_gateway = dGateway;
                        ipArr.subnetmask = subnetmask;
                        ipArr.date_added = dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")
                        //check the IP is exist in IPAM
                        var ipamResult=await new Promise(function(resolve, reject){
                            dbHandler.executeQuery("select * from infra_ipam where ip_address='"+ip+"'",function(result){
                                if(result)
                                resolve(result[0]);
                                else resolve(result);
                            })
                        });	
                        if(ipamResult && ipamResult.length > 0)
                        {
                            ipArr.defult_gateway = ipamResult.gateway;
                            ipArr.subnetmask = ipamResult.subnetmask;
                            //updating ip in ipam
                            console.log('ip changed')
                            await new Promise(function(resolve, reject){
                                var sqlQry={'status':'AS','comments':vmName+' with id '+vm_id+' assigned IP without middle layer @ '+dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")}
                                dbHandler.updateTableData('infra_ipam',{ip_address:ip},diskDataArr,function(err,result){});
                                vmwareModel.logSyncData({'vm_name':vmName,'vm_id':vm_id,'action':'IPADDRESS','notes':ip+" is assigned to the VM "+vmName+" with id "+vm_id+" without middle layer"});
                                var ipNote = ip+" is assigned to the VM "+vmName+" with id "+vm_id+" without middle layer";
                                vmwareModel.insertIpLog(ip,vm_id,0,ipNote);
                                resolve(1)
                            })
                        }
                        else
                        {
                            console.log('ipam not found')
                            await new Promise(function(resolve, reject){
                                vmwareModel.logSyncData({'vm_name':vmName,'vm_id':vm_id,'action':'IPADDRESS','notes':ip+" is not exist in our IPAM, that assigned to the VM "+vmName+" with id "+vm_id});
                                resolve(1)
                            })
                        }
                        //#assigning ip to VM
                        var ipId=await new Promise(function(resolve, reject){
                            console.log('ip inserted')
                            dbHandler.insertIntoTable('infra_vm_ips',ipArr,function(err,result){resolve(result)});
                        })
                        await ipIdArr.push(ipId)
                    }
                    else
                    {
                        if(vm_ip_id > 0)
                        await ipIdArr.push(vm_ip_id)
                    }
                }
            }
            //#checking any other ip previously assigned to that vm in middle layer record
            if(ipIdArr && ipIdArr.length > 0)
            {
                var ip_ids=ipIdArr.join();
                var ipResult=await new Promise(function(resolve, reject){
                    var sqlQry="select * from infra_vm_ips where vm_id="+vm_id+" and id not in("+ip_ids+")"
                    dbHandler.executeQuery(sqlQry,function(result){resolve(result)});
                })
                if(ipResult && ipResult.length > 0)
                {
                    for(i=0;i<ipResult.length;i++)
                    {
                        ip = ipResult[i].ip_address;
                        vmwareModel.logSyncData({'vm_name':vmName,'vm_id':vm_id,'action':'IPADDRESS','notes':ip+" was removed from the VM "+vmName+" with id "+vm_id+". Please verify and update in IPAM"});
                        var sqlQqry={'status':'H','comments':vmName+' with id '+vm_id+' unassigned IP without middle layer @ '+dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")}
                        await new Promise(function(resolve, reject){
                            dbHandler.updateTableData('infra_ipam',{ip_address:ip},sqlQqry,function(err,result){
                                resolve(1)
                            });
                        })
                        //#remove from vm ip table
                        console.log('vm_ips deleted'+ip)
                        var sqlQry="delete * from infra_vm_ips where vm_id="+vm_id+" and ip_address='"+ip+"'"
                        await new Promise(function(resolve, reject){
                            dbHandler.executeQuery(sqlQry,function(result){});
                            var ipNote = vmName+' with id '+vm_id+' unassigned IP without middle layer @ '+dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss");
                            vmwareModel.insertIpLog(ip,vm_id,0,ipNote);
                            resolve(1)
                        })
                    }
                }
            }
            
            //#checking the primary ip is exist in ip array, if not exist update the vms table ip column with new ip
            if(!in_array(vmDetail.ip_address,ipAddressArr))
            {
                ip = ipAddressArr[0];
                if(ip != '')
                {
                    console.log('infra_vms ip updated')
                    await new Promise(function(resolve, reject){
                        dbHandler.updateTableData('infra_vms',{id:vm_id},{ip_address:ip},function(err,result){});
                        vmwareModel.logSyncData({'vm_name':vmName,'vm_id':vm_id,'action':'IPADDRESS','notes':ip+" is assigned as primary ip instead of "+vmDetail.ip_address+" for the VM "+vmName+" with id "+vm_id});
                        resolve(1)
                    })
                }
            }	
            //#validate table vm data with vcenter vm data
            var updateVmArr = {status:vmData['powerState'],creation_status:'C',action_status:'Done'};
            if(vmDetail.datastore != vmData['datastore'])
            {
                updateVmArr.datastore = vmData['datastore'];
                vmwareModel.logSyncData({'vm_name':vmName,'vm_id':vm_id,'action':'DATASTORE','notes':vmName+" with id "+vm_id+" was moved from "+vmDetail.datastore+" to "+vmData['datastore']+" datastore."});
            }
            if(vmDetail.cpu_count != vmData['cpu'] && vmData['cpu'] !=0 && vmData['cpu'] != '')
            {
                updateVmArr.cpu_count = vmData['cpu'];
                vmwareModel.logSyncData({'vm_name':vmName,'vm_id':vm_id,'action':'CPU','notes':"CPU count of "+vmName+" with id "+vm_id+" was changed from "+vmDetail.cpu_count+" to "+vmData['cpu']});
            }
            if(vmDetail.ram != vmData['memoryMb'] && vmData['memoryMb'] !=0 && vmData['memoryMb'] != '')
            {
                updateVmArr.ram = vmData['memoryMb'];
                vmwareModel.logSyncData({'vm_name':vmName,'vm_id':vm_id,'action':'RAM','notes':"Memory size of "+vmName+" with id "+vm_id+" was changed from "+vmDetail.ram+" to "+vmData['memoryMb']});
            }
            if(vmDetail.vm_host != vmData['host'])
            {
                updateVmArr.vm_host = vmData['host'];
                vmwareModel.logSyncData({'vm_name':vmName,'vm_id':vm_id,'action':'HOST','notes':vmName+" with id "+vm_id+" was moved from "+vmDetail.vm_host+" to "+vmData['host']+" host."});
            }
            if(vmDetail.hdd != diskSize)
            {
                updateVmArr.hdd = diskSize;
                vmwareModel.logSyncData({'vm_name':vmName,'vm_id':vm_id,'action':'DISK','notes':"Disk size of "+vmName+" with id "+vm_id+" was changed from "+vmDetail.hdd+" to "+diskSize});
            }
            if(vmDetail.host_name != vmData['vmHostName'])
            {
                updateVmArr.host_name = vmData['vmHostName'];
                vmwareModel.logSyncData({'vm_name':vmName,'vm_id':vm_id,'action':'HOSTNAME','notes':"Host name of "+vmName+" with id "+vm_id+" was changed from "+vmDetail.host_name+" to "+vmData['vmHostName']});
            }
            if(vmDetail.vcenter_uuid != vmData['vcenter_uuid'])
                updateVmArr.vcenter_uuid = vmData['vcenter_uuid']
            if(vmData['guest'] != '')
                updateVmArr.os = vmData['guest'];
            if(vmData['vmware_tool'] != '')
                updateVmArr.vmware_tool = vmData['vmware_tool'];
            //update vms table if any diffrence is exist
            await new Promise(function(resolve, reject){
                dbHandler.updateTableData('infra_vms',{id:vm_id},updateVmArr,function(err,result){
                    console.log('infra_vms info updated')
                    resolve(result)
                })
            })
        } 
        return callback(null,{message:'Syncing done'})
    });
}
// and status in('PowerOn','UnderCreation','PowerOff','Suspend','Rebooting','ShutDown','Stopped')


/*
  Author: Rajesh
  Descri: Update Zabbix monitoring in infra_vms table
  Date  : 01-05-2019
*/
let updateMonitoringInInfravm= async (reqObj,callback)=>{
    //const { ZabbixClient } = require("zabbix-client");
    //var client_id=reqObj.client_id;
    //var server_ip=reqObj.server_ip;
    //var service_type=reqObj.service_type;//'OVM,DEDICATED,OTHERDC',CLOUD
    //var server_ip='45.113.138.237';
    var server_id='39';
    var client_id='14053';
    var service_type='DEDICATED';
    if(service_type=='CLOUD')
    var controller_name='nagios_details_api'
    else
    var controller_name='service_api'
    var postData={
        server_id:server_id,
        security_key:config.ZABBX_KEY
    }
    var url=`${config.ZABBX_URL}/nagios/index.php/api/${controller_name}/get_server_detail_by_id`;
    var serverDetail=await axios.post(url,
    querystring.stringify(postData))
    .then(response=>{
        //console.log(response.data)
        return response.data
    }).catch(error=>{
        //console.log(error.data)
        return [];
    })
    //console.log(serverDetail)
    //return 1;
    new Promise(function(resolve, reject) {
        var sql=`select label_name,primary_ip from c4_vm_details where clientid=${client_id}`
        dbHandler.executeQuery(sql,async function(infra_vms){
            var postData={
                server_id:server_id,
                security_key:config.ZABBX_KEY
            }
            var url=`${config.ZABBX_URL}/nagios/index.php/api/${controller_name}/get_host_list_by_server_id`;
            //console.log(url)
            var hostinfo=await axios.post(url,
            querystring.stringify(postData))
            .then(response=>{
                //console.log(response.data)
                return response.data
            }).catch(error=>{
                console.log(error.data)
                return [];
            })
            //dbHandler.executeQuery("select * from zabbix_servers",async function(zabbix_server){
                // const client = new ZabbixClient(zabbix_server[0].server_name);
                // const api = await client.login(zabbix_server[0].username, zabbix_server[0].password);
                // const hostsInfo = await api.method("host.get").call({
                //     'output':['hostid','name','host','interfaces'],
                //     "selectInterfaces": ['ip']
                // });

                // await api.logout();
                //console.log(hostinfo)
                //return callback(null,hostinfo)
                for(key in infra_vms) {
                    let val=infra_vms[key];
                    // console.log(val);
                    let monitoring_enable = monitoring_visibility = 'no';
                    for(key1 in hostsInfo) {
                        let val1=hostsInfo[key1];
                        // console.log(val1);
                        // console.log(val1.interfaces[0].ip);
                        // console.log(val1.interfaces[0].ip +" === "+ val.ip_address);
                        if (val1.interfaces[0].ip === val.ip_address) {
                            // console.log(val.ip_address);
                            monitoring_enable = monitoring_visibility = 'yes';

                            dbHandler.executeQuery("select * from zabbix_monitoring where cloud_host_id = "+val.id,async function(zabbix_monitoring){
                                // console.log(zabbix_monitoring);
                                if(zabbix_monitoring && zabbix_monitoring.length > 0)
                                {
                                    dataArr = {'serverid':zabbix_server[0].id,'host_id':val1.hostid,'host_name':val1.name,'status':1}
                                    //dbHandler.updateTableData('zabbix_monitoring',{cloud_host_id:val.id},dataArr,function(err,result){resolve(result)})
                                }else{
                                    dataArr = {'serverid':zabbix_server[0].id,'host_id':val1.hostid,'host_name':val1.name,'status':1,'cloud_host_id':val.id}
                                    // dbHandler.insertIntoTable('zabbix_monitoring',dataArr,function(err,result){
                                    //     resolve(result)
                                    // })
                                }
                            });
                            break;
                        }
                    }
                    // console.log(monitoring_enable +" === "+ monitoring_visibility);
                    dataArr = {'monitoring_enable':monitoring_enable,'monitoring_visibility':monitoring_visibility}
                    //dbHandler.updateTableData('infra_vms',{id:val.id},dataArr,function(err,result){resolve(result)})
                }
                return callback(null,{"message":"Updated Vm's with monitoring status."});
            })
        });
}

/*
  Author: Rajesh
  Descri: uptime downtime Report Generation
  Date  : 01-05-2019
*/
let uptimeReportGeneration= async (reqObj,callback)=>{
    const { ZabbixClient } = require("zabbix-client");
    await new Promise(function(resolve, reject) {
        dbHandler.executeQuery("SELECT m.*,s.username,s.password,s.server_name,token.id as token_id,token.from_date,token.to_date,token.server_id,token.host_id as hostid,token.token_no FROM zabbix_uptime_downtime_report_token as token "
        +" inner join zabbix_servers as s on token.server_id=s.id "
        +" left join zabbix_monitoring as m on token.server_id=m.serverid and token.host_id=m.host_id where token.is_data_ready='No'",async function(AllServerInfo){
            try{
                let totalSync=0;
                let service_type='PING';
                for await (const serverInfo of AllServerInfo) {
                    if(serverInfo.host_name == ''){
                        dataArr = {'is_data_ready':'Failed','response':'Monitoring Information not found for this VM'}
                        response = dbHandler.updateTableData('zabbix_uptime_downtime_report_token',{id:serverInfo.token_id},dataArr,function(err,result){resolve(result)})
                        return;
                    }
                    let total=0;
                    let token_id = serverInfo.token_id;
                    let serverid = serverInfo.serverid;
                    let host_id = serverInfo.host_id;
                    let cloud_host_id = serverInfo.cloud_host_id;
                    let host_name  = serverInfo.host_name;
                    let from_date = serverInfo.from_date;
                    let to_date = serverInfo.to_date;
                    let days  = 0;

                    const client = new ZabbixClient(serverInfo.server_name);
                    const api = await client.login(serverInfo.username, serverInfo.password);

                    await new Promise(async function(itemResolve, reject){
                        await dbHandler.executeQuery("SELECT parameter_id,value_type FROM zabbix_monitoring_items  where cloud_host_id='"+cloud_host_id+"' and name_expanded='ICMP ping' and status =1",async function(itemDetail){
                        itemid = itemDetail[0].parameter_id;
                        value_type = itemDetail[0].value_type;
                        if(itemid=='' || itemid==0){
                            // Get Item info
                            const itemgets = await api.method("item.get").call({
                                'output':'extend',
                                "hostids": host_id,
                                "monitored" : true,
                                "filter" : {
                                    "name" : ["ICMP ping"]
                                }
                            });
                            
                            itemid=itemgets[0].itemid;
                            value_type=itemgets[0].value_type;
                        }
                        datediff = await Math.abs(to_date - from_date);
                        days= await (Math.floor(datediff / (60 * 60 * 24)))+1;
                        
                        let dayArr = await helper.getArrFromNo(days);
                        for await (const day of dayArr) {
                            let history_data = {};
                            let record_date=await (to_date-(day * (60 * 60 * 24)));
                            let to_date_post = await (record_date +((60 * 60 * 24) - 1));
                            let from_date_post = await record_date ;
                             
                            //Check record inserted in db or not
                              var result=await new Promise(async function(resolve, reject){
                                let dataValues = {cloud_host_id:cloud_host_id,host_id:host_id,serverid:serverid,parameter_id: itemid, service_type:service_type, record_date: record_date};
                                await dbHandler.getOneRecord('zabbix_monitoring_info',dataValues,async function(result){
                                    if(result != undefined){
                                        total++;
                                        resolve(result);
                                        return;
                                    }
                        
                                    diff = to_date_post - from_date_post;
                                    const historygets = await api.method("history.get").call({
                                        'output':'extend',
                                        "hostids": host_id,
                                        "itemids": itemid,
                                        "time_from":from_date_post,
                                        "time_till":to_date_post,
                                        "history" : value_type
                                    });
                                    
                                    let downtimeArr= [];

                                    let historyArr = await helper.getArrFromNo(historygets.length);
                                    for await (const i of historyArr) {
                                        if(historygets[i].value == 0 && i!=0){
                                            if(historygets[i-1].value==0){
                                                downtimeArr.push(Math.abs(historygets[i-1].clock-historygets[i].clock));
                                            }
                                        }
                                        if(historygets[i].value == 1 && i!=0){
                                            if(historygets[i-1].value==0){
                                                downtimeArr.push(Math.abs(historygets[i-1].clock-historygets[i].clock));
                                            }
                                        }
                                    };
                                    downhours = await downtimeArr.reduce((partial_sum, a) => partial_sum + a,0);// / ( 60 * 60 );
                                    downtime_percent=await Math.round((downhours/diff)*100,"2");
                                    uptime_percent=await Math.round((100-downtime_percent),"2");
                                    
                                    //Save history info
                                    history_data.uptime_percent=uptime_percent;
                                    history_data.downtime_percent=downtime_percent;
                                    history_data.parameter_id=itemid;
                                    
                                    history_data.serverid=serverid;
                                    history_data.host_id=host_id;
                                    history_data.cloud_host_id=cloud_host_id;
                                    history_data.service_type=service_type;
                                    history_data.record_date=record_date;
                                    response = await dbHandler.insertIntoTable('zabbix_monitoring_info',history_data,function(err,result){
                                        total++;
                                        totalSync++;
                                        resolve(result)
                                    });
                                                                                                              
                                })
                            }); 
                        }
                        itemResolve('Done') 
                    }); 
                    
                    }).then(async function(status){
                        if(total>=days){
                            console.log(__dirname);
                            //update the data ready status for a token
                            dataArr = {'is_data_ready':'Yes'}
                            response = await dbHandler.updateTableData('zabbix_uptime_downtime_report_token',{id:serverInfo.token_id},dataArr,async function(err,result){
                                uptimeResponse = await dbHandler.executeQuery("SELECT mi.uptime_percent, mi.downtime_percent, mi.record_date FROM zabbix_monitoring_info as mi inner join zabbix_uptime_downtime_report_token as r on (r.cloud_host_id = mi.cloud_host_id and r.from_date <= mi.record_date and r.to_date >= mi.record_date) where r.cloud_host_id='"+serverInfo.cloud_host_id+"' and r.id='"+serverInfo.token_id+"' and mi.service_type='PING' order by mi.record_date desc",async function(uptimeResult){
                                    var assestPath = path.join(__dirname+"/../");
                                    assestPath = assestPath.replace(new RegExp(/\\/g),'/');
                                    assestPath = "file:///"+assestPath;
                                    
                                    let html = '<div style="display:none;"><img src="'+assestPath+'img/cloud4c_logo.png" alt="Logo" width="100" height="30" border="0"  /></div>';
                                    html += '<h1>Uptime Report</h1>';
                                    html += '<table border="1" width="100%">';
                                    html += '<tr>';
                                    html += '<th>Date</th>';
                                    html += '<th>Uptime(%)</th>';
                                    html += '<th>Downtime(%)</th>';
                                    html += '</tr>';

                                    for await (const record of uptimeResult) {
                                        html += '<tr>';
                                        html += '<th>'+dateFormat((record.record_date*1000),"yyyy-mm-dd")+'</th>';
                                        html += '<th>'+record.uptime_percent+'</th>';
                                        html += '<th>'+record.downtime_percent +'</th>';
                                        html += '</tr>';
                                    }

                                    html += '</table>';
                                    
                                    var options = { 
                                        format: 'Letter',
                                        base: assestPath,
                                        "header": {
                                            "height": "45mm",
                                            "contents": '<div style="text-align: center;"><img src="'+assestPath+'img/cloud4c_logo.png" alt="Logo" width="100" height="30" border="0"  /></div>'
                                        },
                                        "footer": {
                                            "height": "28mm",
                                            "contents": {
                                            //first: 'Cover page',
                                            // 2: 'Second page', // Any page number is working. 1-based index
                                            default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
                                            // last: 'Last Page'
                                            }
                                        }
                                    };
    
                                    pdf.create(html, options).toFile('./reports/'+serverInfo.token_no+'.pdf', function(err, res) {
                                    if (err){
                                        return console.log(err);
                                    }
                                    console.log(res); // { filename: '/app/businesscard.pdf' }
                                    });
                                    
                                });
                                resolve(result);
                            });
                        }
                    })                    
                    
                };
                return callback(null,"Total "+totalSync+" records successfully executed.");
            }
            catch{
                resolve(0);
            }
        });
    })
    
}
/*
  Author: Rajesh
  Descri: utilization downtime Report Generation
  Date  : 01-05-2019
*/
//let utilizationReportGeneration= async (reqObj,callback)=>{
//    const { ZabbixClient } = require("zabbix-client");
//    await new Promise(function(resolve, reject) {
//        dbHandler.executeQuery("SELECT m.*,s.username,s.password,s.server_name,token.id as token_id,token.from_date,token.to_date,token.server_id,token.host_id as hostid,token.token_no FROM zabbix_utilization_report_token as token "
//        +" inner join zabbix_servers as s on token.server_id=s.id "
//        +" left join zabbix_monitoring as m on token.server_id=m.serverid and token.host_id=m.host_id where token.is_data_ready='No'",async function(AllServerInfo){
//            console.log(AllServerInfo);
//            try{
//                var assestPath = path.join(__dirname+"/../");
//                assestPath = assestPath.replace(new RegExp(/\\/g),'/');
//                assestPath = "file:///"+assestPath;
//                for await (const serverInfo of AllServerInfo) {
//                    savefilepath = './reports/'+serverInfo.token_no+'.pdf';
//                    if (fs.existsSync(savefilepath)) {
//                        const stats = fs.statSync(savefilepath);
//                        const fileSizeInBytes = stats.size;
//                        if(fileSizeInBytes < 1){
//                            fs.unlink(savefilepath, function (err) {
//                                if (err) throw err;
//                                // if no error, file has been deleted successfully
//                            }); 
//                        }
//                    }
//                    if(serverInfo.host_name == ''){
//                        dataArr = {'is_data_ready':'Failed','response':'Monitoring Information not found for this VM'}
//                        response = dbHandler.updateTableData('zabbix_utilization_report_token',{id:serverInfo.token_id},dataArr,function(err,result){resolve(result)})
//                        return;
//                    }
//
//                    let token_id = serverInfo.token_id;
//                    let serverid = serverInfo.serverid;
//                    let host_id = serverInfo.host_id;
//                    let cloud_host_id = serverInfo.cloud_host_id;
//                    let host_name  = serverInfo.host_name;
//                    let from_date = serverInfo.from_date;
//                    let to_date = serverInfo.to_date;
//                    let days  = 0;
//
//                    const client = new ZabbixClient(serverInfo.server_name);
//                    const api = await client.login(serverInfo.username, serverInfo.password);
//
//                    await new Promise(async function(itemResolve, reject){
//                        await dbHandler.executeQuery("SELECT parameter_id from zabbix_monitoring_items where cloud_host_id='"+cloud_host_id+"'",async function(itemids){
//                            if(itemids.length == 0){
//                                dataArr = {'is_data_ready':'Failed','response':'No line items found for this VM'}
//                                response = dbHandler.updateTableData('zabbix_utilization_report_token',{id:serverInfo.token_id},dataArr,function(err,result){resolve(result)})
//                                return;
//                            }
//                            let itemidsNew = [];
//                            for await (const item of itemids) {
//                                itemidsNew.push(item.parameter_id);
//                            }
//                            
//                            let graphids=[];
//                            const graphitem = await api.method("graphitem.get").call({
//                                'output':['graphid'],
//                                "hostids": host_id,
//                                "itemids" : itemidsNew
//                            });
//                            if(graphitem.length == 0){
//                                dataArr = {'is_data_ready':'Failed','response':'No graphs found for this VM'}
//                                response = dbHandler.updateTableData('zabbix_utilization_report_token',{id:serverInfo.token_id},dataArr,function(err,result){resolve(result)})
//                                return;
//                            }else{
//                                for await (const item of graphitem) {
//                                    graphids.push(item.graphid);
//                                }
//                            
//                            }
//
//                            let zabbix_url=serverInfo.server_name.replace('api_jsonrpc.php','reports/api_create_pdf.php');
//                            // let responseBody = '',responseStatusCode = '';
//                            post_data = {};
//                            post_data.graphids=graphids.join(',');
//                            post_data.host_id=host_id;
//                            post_data.start_time=dateFormat((from_date*1000), "dd-mm-yyyy");
//                            post_data.end_time=dateFormat((to_date*1000), "dd-mm-yyyy");
//                            responseBody = await new Promise(async function(curlResolve, reject){
//                                curl.setBody(post_data)
//                                .post(zabbix_url)
//                                .then(({statusCode, body, headers}) => {
//                                    if(statusCode == 404){
//                                        zabbix_url=serverInfo.server_name.replace('api_jsonrpc.php','report/api_create_pdf.php');
//                        
//                                        post_data = {};
//                                        post_data.graphids=graphids.join(',');
//                                        post_data.host_id=host_id;
//                                        post_data.start_time=dateFormat((from_date*1000), "dd-mm-yyyy");
//                                        post_data.end_time=to_date;
//                                        curl.setBody(post_data)
//                                        .post(zabbix_url)
//                                        .then(({statusCode, body, headers}) => {
//                                            // responseBody = body;
//                                            curlResolve(body);
//                                        })
//                                        .catch((e) => {
//                                            console.log(e);
//                                        });
//                                    }else{
//                                        // responseBody = body;
//                                        curlResolve(body);
//                                    }
//                                })
//                                .catch((e) => {
//                                    console.log(e);
//                                });
//                            });
//
//                            responseBody = JSON.parse(responseBody);
//                            let file_path =decodeURIComponent(responseBody.file_path);
//                            
//                            const file = fs.createWriteStream(savefilepath);
//                            const request = await http.get(file_path, async function(response) {
//                                response.pipe(file);
//                                file.on('finish', async function() {
//                                    file.close();  // close() is async, call cb after close completes.
//                                    dataArr = {'is_data_ready':'Yes'}
//                                    response = await dbHandler.updateTableData('zabbix_utilization_report_token',{id:serverInfo.token_id},dataArr,async function(err,result){
//                                        resolve(result);
//                                    });
//                                });
//                            }).on('error', function(err) { // Handle errors
//                                fs.unlink(dest); // Delete the file async. (But we don't check the result)
//                                console.log(err.message);
//                            });
//                            itemResolve(itemids);
//                        });
//                    });
//                    resolve("Done");
//                };
//                return callback(null,"Total records successfully executed.");
//            }
//            catch{
//                resolve(0);
//            }
//        });
//    })
//    
//}

/*
  Author : Rajesh
  Description : Hyperv Create VM Cron job
  Date  : 27-04-2020
*/
let hypervCreateVm= async (reqObj,callback)=>{
    console.log(reqObj);
    let sql = `Select vc.*,od.copy_type from c4_vm_creation as vc
    left join c4_order_details as od on od.id = vc.order_details_id 
    where vc.status = 0 and vc.cloudid in (${config.CREATE_VM_CLOUD_IDS}) and (vc.vm_host is NULL or vc.vm_host = '') `;
    if(typeof reqObj.id != 'undefined'){
        sql += ` and vc.order_details_id = ${reqObj.id} order by id desc limit 1`;
    }else{
        sql += ` order by id asc limit 2`;
    }
    console.log(sql);
    await new Promise(function(resolve, reject) {
        dbHandler.executeQuery(sql,async function(CreateVmData){
            // console.log("CreateVmData");
            // console.log(CreateVmData);
        	if (CreateVmData.length > 0) {
        		try{
                    for await (const CreateVmItem of CreateVmData) {
                        // console.log("CreateVmItem.request_obj");
                        // console.log(CreateVmItem.request_obj);
                        if(CreateVmItem.cloudid == 3){
                            var request = require("request");

                            var options = { method: 'POST',
                                url: config.API_URL+'azure/vm_creation',
                                headers: 
                                { 
                                    'cache-control': 'no-cache',
                                    'content-type': 'application/json' },
                                body:JSON.parse(CreateVmItem.request_obj),
                                json: true 
                            };

                            request(options, async function (error, response, body) {
                                if (error){ 
                                    //throw new Error(error);
                                    // console.log("error");
                                    // console.log(error);
                                    await dbHandler.updateTableData('c4_vm_creation',{'id':CreateVmItem.id},{'status':'2','response_obj':JSON.stringify(error),'updateddate':(new Date().getTime() / 1000)},function(err,result){})
                                }else{
                                    // console.log("body");
                                    // console.log(body);

                                    if(typeof body.name != "undefined"){
                                        await dbHandler.updateTableData('c4_vm_creation',{'id':CreateVmItem.id},{'status':'1','response_obj':JSON.stringify(body),'updateddate':(new Date().getTime() / 1000)},function(err,result){})
                                    }else{
                                        await dbHandler.updateTableData('c4_vm_creation',{'id':CreateVmItem.id},{'status':'2','response_obj':JSON.stringify(body),'updateddate':(new Date().getTime() / 1000)},function(err,result){})
                                    }
                                    
                                }
                            });
                        }else if(CreateVmItem.cloudid == 4){
                            var request = require("request");

                            var options = { method: 'POST',
                                url: config.API_URL+'aws/create_vm',
                                headers: 
                                { 
                                    'cache-control': 'no-cache',
                                    'content-type': 'application/json' },
                                body:JSON.parse(CreateVmItem.request_obj),
                                json: true 
                            };

                            request(options, async function (error, response, body) {
                                if (error){ 
                                    //throw new Error(error);
                                    // console.log("error");
                                    // console.log(error);
                                    await dbHandler.updateTableData('c4_vm_creation',{'id':CreateVmItem.id},{'status':'2','response_obj':JSON.stringify(error),'updateddate':(new Date().getTime() / 1000)},function(err,result){})
                                }else{
                                    // console.log("body");
                                    // console.log(body);

                                    if(typeof body.RunInstancesResponse != "undefined"){
                                        await dbHandler.updateTableData('c4_vm_creation',{'id':CreateVmItem.id},{'status':'1','response_obj':JSON.stringify(body),'updateddate':(new Date().getTime() / 1000)},function(err,result){})
                                    }else{
                                        await dbHandler.updateTableData('c4_vm_creation',{'id':CreateVmItem.id},{'status':'2','response_obj':JSON.stringify(body),'updateddate':(new Date().getTime() / 1000)},function(err,result){})
                                    }
                                    
                                }
                            });
                        }else if(CreateVmItem.cloudid == 5){
                            var request = require("request");

                            var options = { method: 'POST',
                                url: config.API_URL+'gcp/create_vm?askey='+config.ADMIN_SECURITY_KEY,
                                headers: 
                                { 
                                    'cache-control': 'no-cache',
                                    'content-type': 'application/json' },
                                body:JSON.parse(CreateVmItem.request_obj),
                                json: true 
                            };

                            request(options, async function (error, response, body) {
                                if (error){ 
                                    //throw new Error(error);
                                    // console.log("error");
                                    // console.log(error);
                                    await dbHandler.updateTableData('c4_vm_creation',{'id':CreateVmItem.id},{'status':'2','response_obj':JSON.stringify(error),'updateddate':(new Date().getTime() / 1000)},function(err,result){})
                                }else{
                                    // console.log("body");
                                    // console.log(body);

                                    if(typeof body.success != "undefined" && body.success == 1){
                                        await dbHandler.updateTableData('c4_vm_creation',{'id':CreateVmItem.id},{'status':'1','response_obj':JSON.stringify(body),'updateddate':(new Date().getTime() / 1000)},function(err,result){})
                                    }else{
                                        await dbHandler.updateTableData('c4_vm_creation',{'id':CreateVmItem.id},{'status':'2','response_obj':JSON.stringify(body),'updateddate':(new Date().getTime() / 1000)},function(err,result){})
                                    }
                                    
                                }
                            });
                        }else{
                            await new Promise(async function(itemResolve, itemReject){
                                let techSql = `SELECT * from c4_vdc_tech_disk
                                where tech_id = '${CreateVmItem.tech_id}' and vdc_id = '${CreateVmItem.vdc_id}' and status = 1 and disk_type = '${CreateVmItem.disk_type}'`;
                                console.log("techSql");
                                console.log(techSql);
                                await dbHandler.executeQuery(techSql,async function(curlinfo){
                                    console.log("curlinfo");
                                    console.log(curlinfo);
                                    if(curlinfo.length > 0){
                                        curlpath = curlinfo[0].curlpath;
                                        /**
                                         * TODO:
                                         * comment below line in live
                                         */
                                        // curlpath = 'http://45.127.100.129/vmware/v3/';
                                        basepath = curlpath;

                                        let osSql = `SELECT * from c4_os_templates
                                        where id = ${CreateVmItem.osid}`;
                                        await dbHandler.executeQuery(osSql,async function(osInfo){
                                            console.log("osInfo");
                                            console.log(osInfo);
                                            if(osInfo.length > 0){
                                                oscode = osInfo[0].template_name;
                                                /**
                                                 * TODO:
                                                 * comment below line in live
                                                 */
                                                // oscode = 'CentOS-6.6-64bit';
                                                let cloud_type = CreateVmItem.copy_type;
                                                switch (cloud_type) {
                                                    case '1C':
                                                        cloud_type = 1;
                                                        break;
                                                    case '2C':
                                                        cloud_type = 2;
                                                        break;
                                                    case '3C':
                                                        cloud_type = 3;
                                                        break;
                                                    case '4C':
                                                        cloud_type = 4;
                                                        break;
                                                }
                                                env = config.APPLICATION_ENV;

                                                let vmdata = {
                                                    'vmName'  : CreateVmItem.label_name,
                                                    'template'  : oscode,
                                                    'memoryMB'  : CreateVmItem.ram,
                                                    'diskSize'  : CreateVmItem.disk,
                                                    'cpuCount'  : CreateVmItem.cpus,
                                                    'fullName'  : CreateVmItem.label_name,
                                                    'vmCount' : 1,
                                                    'user_id'  : CreateVmItem.clientid,
                                                    'order_id'  : CreateVmItem.order_details_id,
                                                    'vdc_id'  : CreateVmItem.vdc_id,
                                                    'ComputerName'  : CreateVmItem.host_name,
                                                    'user_db_prefix'  : env,
                                                    'cloud_type'  : cloud_type,
                                                    'network_id'  : CreateVmItem.network_id
                                                };
                                                if(CreateVmItem.vm_host && CreateVmItem.vm_host != ''){
                                                	vmdata.vm_host = CreateVmItem.vm_host;
                                                }
                                                if(CreateVmItem.datastore && CreateVmItem.datastore != ''){
                                                	vmdata.datastore = CreateVmItem.datastore;
                                                }
                                                curlpath = curlpath + 'vm_creation';
                                                
                                                console.log("curlpath");
                                                console.log(curlpath);
                                                console.log("vmdata");
                                                console.log(vmdata);
                                                // axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
                                                await axios
                                                .post(curlpath, querystring.stringify(vmdata))
                                                .then(async body => {
                                                // curl.setBody(querystring.stringify(vmdata))
                                                // .post(curlpath)
                                                // .then(async ({statusCode, body, headers}) => {
                                                    console.log("VM create curl");
                                                    console.log(body);
                                                    let response = body.data;
                                                    if(response.success){

                                                        if(response.vm_id){
                                                        	await dbHandler.updateTableData('c4_vm_creation',{'id':CreateVmItem.id},{'status':'1','response_obj':JSON.stringify(response),'updateddate':(new Date().getTime() / 1000)},function(err,result){})
                                                            await dbHandler.updateTableData('c4_order_details',{'id':CreateVmItem.order_details_id},{'status':'1','updateddate':(new Date().getTime() / 1000)},function(err,result){})
                                                            
                                                        	curlpath = basepath + 'vm_details?vm=' + response.vm_id;
                                                        	//curlpath = basepath + 'vm_list?user_id=' + CreateVmItem.clientid + '&user_db_prefix=' + config.APPLICATION_ENV;
                                                        	
	                                                        await axios
	                                                        .get(curlpath)
	                                                        .then(async body => {
	                                                        // curl.get(curlpath)
	                                                        // .then(async ({statusCode, body, headers}) => {
	                                                            console.log("VM update curl");
	                                                            console.log(body);
	                                                            vmUpdateResult = body.data;
	                                                            if(vmUpdateResult.success){
	                                                            	
	                                                            	vmsinfo = vmUpdateResult.data;
	                                                                console.log(vmsinfo);
	                                                                if (Object.keys(vmsinfo).length > 0) {
	                                                                    hddcount = ((vmsinfo.VmDiskDetails)?Object.keys(JSON.stringify(vmsinfo.VmDiskDetails)).length:0);
	                                                                    diskinfo = ((vmsinfo.VmDiskDetails)?JSON.stringify(vmsinfo.VmDiskDetails):"");
	                                                                    let v = vmsinfo;
	                                                                    extra_ips = JSON.stringify(vmsinfo.extra_ips);
	                                                                    if (v.Vms.host_name != '') {
	                                                                        host_name = v.Vms.host_name;
	                                                                    } else {
	                                                                        host_name = v.Vms.name;
	                                                                    }
	                                                                    
//		                                                                listvm = vmUpdateResult['data'];
//		                                                                if (listvm.length > 1) {
//		                                                                    cnt = listvm.length;
//		                                                                    vm = cnt - 1;
//		                                                                    vminfo = listvm[vm];
//		                                                                } else {
//		                                                                    vminfo = listvm[0];
//		                                                                }
//		                                                                console.log("vminfo");
//		                                                                console.log(vminfo);
		                                                                vmdetails = {
		                                                                    'cloudid':CreateVmItem.cloudid,
		                                                                    'order_details_id' : CreateVmItem.order_details_id,
		                                                                    'ref_id' : response.vm_id,
		                                                                    'host_name' : host_name,
                                                                            'label_name' : v.Vms.name,
		                                                                    'clientid' : CreateVmItem.clientid,
		                                                                    'primary_ip' : v.Vms.ip_address,
		                                                                    'multiple_ip' : extra_ips,
		                                                                    'username' : v.Vms.user,
                                                                            'password' : v.Vms.password,
                                                                            'ram_units_gb' : (v.Vms.ram / 1024),
                                                                            'cpu_units' : v.Vms.cpu_count,
                                                                            'disk_units_gb' : v.Vms.hdd,
                                                                            'disk_count' : hddcount,
                                                                            'disk_info' : diskinfo,
		                                                                    'vm_env' : env,
		                                                                    'power_status' : v.Vms.power_state,
		                                                                    'vdc_id' : CreateVmItem.vdc_id,
		                                                                    'tech_id' : CreateVmItem.tech_id,
		                                                                    'is_running_under_restore' : v.Vms.is_running_under_restore,
                                                                            'plan_failover_status' : v.Vms.is_running_under_dr,
                                                                            'creation_start_date' : v.Vms.date_added,
                                                                            'creation_complete_date' : v.Vms.creation_date,
                                                                            'third_copy' : v.Vms.backup_status,
                                                                            'fourth_copy' : v.Vms.dr_status,
                                                                            'os_type' : v.Vms.os_type,
		                                                                    'os_id' : CreateVmItem.osid,
		                                                                    'os_template_name' : v.Vms.os
		                                                                };
		
		                                                                let odSql = `SELECT * from c4_order_details
		                                                                where id = ${CreateVmItem.order_details_id}`;
		                                                                await dbHandler.executeQuery(odSql,async function(orderdetailsidinfo){
		                                                                    console.log("orderdetailsidinfo");
		                                                                    console.log(orderdetailsidinfo);
		                                                                    if(orderdetailsidinfo.length > 0){
		                                                                        cartref_id = orderdetailsidinfo[0].reference_id;
		                                                                        vmdetails.cpu_price = v.Vms.cpu_count * orderdetailsidinfo[0].cpu_cost;
		                                                                        vmdetails.ram_price = (v.Vms.ram / 1024) * orderdetailsidinfo[0].ram_cost;
		                                                                        vmdetails.disk_on_price = v.Vms.hdd * orderdetailsidinfo[0].disk_on_cost;
		                                                                        vmdetails.disk_off_price = v.Vms.hdd * orderdetailsidinfo[0].disk_off_cost;
		                                                                        vmdetails.os_price = orderdetailsidinfo[0].os_cost;
		                                                                        vmdetails.bandwidth_price = (orderdetailsidinfo[0].bandwidth_in_cost + orderdetailsidinfo[0].bandwidth_out_cost);
		                                                                        vmdetails.copy_type = orderdetailsidinfo[0].copy_type;
		                                                                        vmdetails.createddate = (new Date().getTime() / 1000);
		                                                                        vmdetails.createdby = CreateVmItem.clientid;
		                                                                        console.log("vmdetails");
		                                                                        console.log(vmdetails);
		                                                                        await dbHandler.insertIntoTable('c4_vm_details',vmdetails,async function(error,vmdid){
		                                                                            console.log("vmdid");
		                                                                            console.log(vmdid);
		                                                                            await dbHandler.updateTableData('c4_order_details',{'id':CreateVmItem.order_details_id},{'vmid':vmdid,'updateddate':(new Date().getTime() / 1000)},async function(err,odUpdateResult){
		                                                                            	if(CreateVmItem.po_vm_id && CreateVmItem.po_vm_id != '' && CreateVmItem.po_vm_id != 0){
		                                                                            		await dbHandler.updateTableData('c4_po_vm_info',{'id':CreateVmItem.po_vm_id},{'serviceid':CreateVmItem.order_details_id,'updateddate':(new Date().getTime() / 1000)},function(err,poVmUpdateResult){
			                                                                                	itemResolve(poVmUpdateResult);
				                                                                            })
		                                                                                }else{
		                                                                                	itemResolve(odUpdateResult);
		                                                                                }
		                                                                            })
		                                                                        });
		                                                                    }else{
		                                                                        console.log("Error in loading Order Details");
		                                                                        return callback(1,"Error in loading Order Details");
		                                                                        itemReject({"message":"Error in loading Order Details"});
		                                                                        reject("Error in loading Order Details");
		                                                                    }
		                                                                });
	                                                                }else{
	                                                                	console.log("VM details not found");
	                                                                	console.log(vmUpdateResult);
		                                                                return callback(1,vmUpdateResult);
		                                                                itemReject({"message":vmUpdateResult});
		                                                                reject(vmUpdateResult);
	                                                                }
	                                                            }else{
	                                                            	console.log("Invaid Response from server while fetching VM details");
	                                                                console.log(vmUpdateResult);
	                                                                return callback(1,vmUpdateResult);
	                                                                itemReject({"message":vmUpdateResult});
	                                                                reject(vmUpdateResult);
	                                                            }
	                                                        })
	                                                        .catch((e) => {
	                                                            console.log(e);
	                                                            return callback(1,e);
	                                                            itemReject({"message":e});
	                                                            reject(e);
	                                                        });
                                                        }else{
                                                        	console.log("VM ID not found in VM creation response");
                                                        	// VM creation error logging
                                                            await dbHandler.updateTableData('c4_vm_creation',{'id':CreateVmItem.id},{'status':'2','response_obj':JSON.stringify(response),'updateddate':(new Date().getTime() / 1000)},function(err,result){})
                                                            console.log(response);
                                                            return callback(1,response);
                                                            itemReject({"message":response});
                                                            reject(response);
                                                        }
                                                    }else{
                                                    	console.log("Invaid Response from server while creating VM");
                                                        // VM creation error logging
                                                        await dbHandler.updateTableData('c4_vm_creation',{'id':CreateVmItem.id},{'status':'2','response_obj':JSON.stringify(response),'updateddate':(new Date().getTime() / 1000)},function(err,result){})
                                                        console.log(response);
                                                        return callback(1,response);
                                                        itemReject({"message":response});
                                                        reject(response);
                                                    }
                                                })
                                                .catch((e) => {
                                                    console.log(e);
                                                    itemReject({"message":e});
                                                    reject(e);
                                                    return callback(1,e);
                                                });

                                            }else{
                                                itemReject({"message":"Invaid OS Template."});
                                                return callback(1,"Invaid OS Template.");
                                            }
                                        });
                                    }else{
                                        itemReject({"message":"Invaid VDC or Tech Id Provided or Disk Type Provided."});
                                        return callback(1,"Invaid VDC or Tech Id Provided or Disk Type Provided.");
                                    }
                                });
                            });
                        }
                    }
                    resolve("VM creation requested.");
                    return callback(null,"VM creation requested.");
	            }
	            catch{
	                resolve(0);
	            }
            }else{
            	resolve(0);
                return callback(1,"Invalid data.");
            }
        });
    });
    
}

/*
  Author : Rajesh
  Description : Hyperv Update VM Details Cron job
  Date  : 27-04-2020
*/
let hypervUpdateVmDetails= async (reqObj,callback)=>{
    //console.log(reqObj);
    let sql = `SELECT	vm.id,vm.order_details_id,vm.ref_id,vm.host_name,
    vm.label_name,vm.clientid,vm.primary_ip,vm.multiple_ip,
    vm.username,	vm.password,vm.ram_units_gb,	vm.cpu_units,
    vm.disk_units_gb,vm.disk_count,
    vm.disk_info,vm.power_status,	vm.cpu_price,
    vm.ram_price,vm.disk_on_price,
    vm.disk_off_price,vm.bandwidth_price,
    vm.os_price,	vm.vdc_id,vm.tech_id,vm.copy_type,
    vm.plan_id,vm.os_id,vm.os_template_name,
    vm.extra,vm.status,	vm.createddate, vm.zabbix_config_status,
    vm.updateddate,	vm.createdby,	vm.updatedby,vtd.curlpath,vm.nagios_config_status,
    vm.cloudid
    FROM c4_vm_details as vm
    INNER JOIN c4_vdc_tech_disk as vtd ON vm.tech_id = vtd.tech_id AND vm.vdc_id = vtd.vdc_id
    WHERE vm.status = 1 and vm.cloudid in (1,2) `;
    if(typeof reqObj.ref_id != 'undefined' && typeof reqObj.vdc_id != 'undefined'){
        sql += ` and vm.ref_id = ${reqObj.ref_id} and vm.vdc_id = ${reqObj.vdc_id} order by id desc limit 1`;
    }else if(typeof reqObj.recent != 'undefined' && reqObj.recent == 'yes'){
        sql += ` and vm.createddate >= ${((new Date().getTime() / 1000) - 3600)} order by id desc`;
    }else{
        sql += ` order by id desc`;
    }
    //console.log(sql);
    await new Promise(function(resolve, reject) {
        dbHandler.executeQuery(sql,async function(AllVmData){
            //console.log("AllVmData");
            //console.log(AllVmData);
            try{
                if (AllVmData.length > 0) {
                    for await (const vmData of AllVmData) {
                        await new Promise(async function(itemResolve, itemReject){
                            let vmcreateddate = vmData.createddate;
                            let vmid = vmData.id;
                            curlpath = vmData.curlpath;
                            /**
                             * TODO:
                             * comment below line in live
                             */
                            //curlpath = 'http://45.127.100.129/vmware/v3/';
                            basepath = curlpath;
                            curlpath = basepath + 'vm_details?vm=' + vmData.ref_id;
                            //console.log("curlpath");
                            //console.log(curlpath);
                            await axios
                            .get(curlpath)
                            .then(async body => {
                            // curl.get(curlpath)
                            // .then(async ({statusCode, body, headers}) => {
                                //console.log("VM update curl");
                                //console.log(body.data);
                                vmUpdateResult = body.data;
                                if(vmUpdateResult.success){
                                    vmsinfo = vmUpdateResult.data;
                                    //console.log(vmsinfo);
                                    if (Object.keys(vmsinfo).length > 0) {
                                        hddcount = ((vmsinfo.VmDiskDetails)?Object.keys(JSON.stringify(vmsinfo.VmDiskDetails)).length:0);
                                        diskinfo = ((vmsinfo.VmDiskDetails)?JSON.stringify(vmsinfo.VmDiskDetails):"");
                                        let v = vmsinfo;
                                        extra_ips = JSON.stringify(vmsinfo.extra_ips);
                                        
                                        //For Citrix VMs sync the secondary Ips
                                        if(vmData.cloudid == 2){
                                        	extra_ips = ((vmsinfo.secondary_ips)?JSON.stringify(vmsinfo.secondary_ips):"");
                                        }
                                        
                                        if (v.Vms.host_name != '') {
                                            host_name = v.Vms.host_name;
                                        } else {
                                            host_name = v.Vms.name;
                                        }
                                        vmdata = {
                                            'host_name' : host_name,
                                            'label_name' : v.Vms.name,
                                            'primary_ip' : v.Vms.ip_address,
                                            'multiple_ip' : extra_ips,
                                            'username' : v.Vms.user,
                                            'password' : v.Vms.password,
                                            'ram_units_gb' : (v.Vms.ram / 1024),
                                            'cpu_units' : v.Vms.cpu_count,
                                            'disk_units_gb' : v.Vms.hdd,
                                            'disk_count' : hddcount,
                                            'disk_info' : diskinfo,
                                            'power_status' : v.Vms.power_state,
                                            'updateddate' : (new Date().getTime() / 1000),
                                            'vm_status' : v.Vms.status,
                                            'is_running_under_restore' : v.Vms.is_running_under_restore,
                                            'plan_failover_status' : v.Vms.is_running_under_dr,
                                            'creation_start_date' : v.Vms.date_added,
                                            'creation_complete_date' : v.Vms.creation_date,
                                            'third_copy' : v.Vms.backup_status,
                                            'fourth_copy' : v.Vms.dr_status,
                                            'os_type' : v.Vms.os_type,
                                            'os_template_name' : v.Vms.os
                                        };
                                        if(vmData.zabbix_config_status == 1 
                                        		&& ((vmData.vm_status == 'Running' && v.Vms.status != 'Running')
                                				|| (vmData.vm_status != 'Running' && v.Vms.status == 'Running'))){
                                        	let zab_action = 'suspend';
                                        	let zab_action_text = 'disabling';
                                            if(vmData.vm_status != 'Running' && v.Vms.status == 'Running'){
                                                zab_action = 'resume';
                                                zab_action_text = 'enable';
                                            }
                                            let security_key = config.ZABBX_KEY;
                                            let environment = 'live';
                                            let nagiosapiurl = config.ZABBX_URL;
                                            let cloud_hostids = vmid;
                                            let zab_action_params = {
                                                'security_key' : security_key,
                                                'environment' : environment,
                                                'cloud_host_id' : cloud_hostids,
                                                'update_type' : zab_action
                                            };
                                            var url=`${nagiosapiurl}/nagios/index.php/api/nagios_details_api/updateHostInZabbix`;
                                            await axios.post(url,querystring.stringify(zab_action_params))
                                            .then(async response=>{
                                                //console.log(response.data)
                                                let notesdata = {
	                                                'ref_id' : vmid,
	                                                'notes' : 'Monitoring Alert '+zab_action_text+' Triggred',
	                                                'notes_type' : 'VM',
	                                                'added_staff_id' : 1,
	                                                'added_staff_name' : 'Admin'
	                                            };
	                                            await dbHandler.insertIntoTable('staff_notes',notesdata,function(err,result){})
	                                            
	                                            zab_get_params = {
                                                    'security_key' : security_key,
                                                    'environment' : environment,
                                                    'cloud_host_id' : cloud_hostids
	                                            };
	                                            var url=`${nagiosapiurl}/nagios/index.php/api/nagios_details_api/getHostStatusInZabbix`;
	                                            await axios.post(url,querystring.stringify(zab_get_params))
	                                            .then(async response=>{
	                                                //console.log(response.data)
	                                                let mon_status = response.data.response.status;
	                                                await dbHandler.updateTableData('c4_vm_details',{'id':vmid},{zabbix_host_alert_status : mon_status},function(err,odUpdateResult){})
	                                                let notesdata = {
		                                                'ref_id' : vmid,
		                                                'notes' : 'Zabbix Monitoring has been ' + mon_status,
		                                                'notes_type' : 'VM',
		                                                'added_staff_id' : 1,
		                                                'added_staff_name' : 'Admin'
		                                            };
		                                            await dbHandler.insertIntoTable('staff_notes',notesdata,function(err,result){})
	                                            })
	                                            .catch(async error=>{
	                                                console.log(error);
	                                                let mon_status = 'FAILED'
	                                                await dbHandler.updateTableData('c4_vm_details',{'id':vmid},{zabbix_host_alert_status : mon_status},function(err,odUpdateResult){})
	                                                let notesdata = {
		                                                'ref_id' : vmid,
		                                                'notes' : 'Zabbix Monitoring has been '+mon_status,
		                                                'notes_type' : 'VM',
		                                                'added_staff_id' : 1,
		                                                'added_staff_name' : 'Admin'
		                                            };
		                                            await dbHandler.insertIntoTable('staff_notes',notesdata,function(err,result){})
	                                            })
                                            })
                                            .catch(error=>{
                                                console.log(error)
                                            })
                                        }
                                        
                                        if (v.Vms.nic_count) {
                                            vmdata.nic_count = v.Vms.nic_count;
                                        }

                                        if (v.Vms.licence_status) {
                                            vmdata.licence_status = v.Vms.licence_status;
                                        }
                                        if (v.Vms.public_ip) {
                                            vmdata.public_ipaddress = ((Array.isArray(v.Vms.public_ip))?JSON.stringify(v.Vms.public_ip):v.Vms.public_ip);
                                        }
                                        if (v.Vms.used_disk_in_gb) {
                                            vmdata.used_disk_in_gb = v.Vms.used_disk_in_gb;
                                        }
                                        if (v.Vms.avail_disk_in_gb) {
                                            vmdata.avail_disk_in_gb = v.Vms.avail_disk_in_gb;
                                        }
                                        if (v.Vms.status == 'Deleted') {
                                            if (v.Vms.status == 'Deleted') { // automatically delete vm from list and cancell order after 12 hours of vm creation - Praveen
                                                vmdata.status = 0;
                                                await dbHandler.updateTableData('c4_order_details',{'id':vmData.order_details_id},{'status' : 0,
                                                'updateddate' : (new Date().getTime() / 1000),
                                                'suspend_date' : (new Date().getTime() / 1000)},function(err,odUpdateResult){
                                                    //itemResolve(odUpdateResult);
                                                })
                                                await dbHandler.updateTableData('c4_order_details',{'vmid':vmid},{'status' : 0,
                                                'updateddate' : (new Date().getTime() / 1000),
                                                'suspend_date' : (new Date().getTime() / 1000)},function(err,odUpdateResult){
                                                    //itemResolve(odUpdateResult);
                                                })
                                            }
                                        }
                                        //console.log(vmdata);

                                        await dbHandler.updateTableData('c4_vm_details',{'id':vmid},vmdata,function(err,odUpdateResult){
                                            if(err){
                                                console.log("Error in updating the record.");
                                                callback(1,"Error in updating the record.");
                                                itemResolve({"message":"Error in updating the record."});
                                            } else{
                                                itemResolve(odUpdateResult);
                                            }
                                        })
                                    } else {
                                        console.log("NO data Available");
                                        callback(1,"NO data Available");
                                        itemResolve({"message":"NO data Available"});
                                    }
                                }else{
                                    console.log("Invaid Response from server");
                                    callback(1,"Invaid Response from server");
                                    itemResolve({"message":"Invaid Response from server."});
                                }      
                            })
                            .catch((e) => {
                                console.log(e);
                                callback(1,e);
                                itemResolve({"message":e});
                            });
                        });
                    }
                }else{
                    console.log("No records to update.");
                    callback(1,"No records to update.");
                    itemResolve({"message":"No records to update."});
                    resolve("No records to update.");
                }
            }
            catch{
                console.log("VM details updated successfully");
                callback(null,"VM details updated successfully");
                resolve({"message":"VM details updated successfully"});
            }
            console.log("VM details updated successfully");
            callback(null,"VM details updated successfully");
            resolve({"message":"VM details updated successfully"});
        });
    });
}

/*
  Author : Rajesh
  Description : calculate Hourly Billing Cron job
  Date  : 30-04-2020
*/
let calculateHourlyBilling= async (reqObj,callback)=>{
    console.log(reqObj);
    let fundType = "CLOUD";
    let sql = `SELECT c4_order_details.os_cost, c4_order_details.disk_off_cost, c4_order_details.disk_on_cost, c4_order_details.ram_cost, c4_order_details.cpu_cost, c4_order_details.base_price,c4_order_details.mrc_price,
    c4_vm_details.id,c4_vm_details.plan_failover_status, c4_vm_details.order_details_id, c4_vm_details.host_name,c4_vm_details.label_name,
    c4_vm_details.clientid,	c4_vm_details.primary_ip,c4_vm_details.multiple_ip,	c4_vm_details.ram_units_gb,
    c4_vm_details.cpu_units,c4_vm_details.disk_units_gb,c4_vm_details.disk_count,c4_vm_details.power_status,
    c4_vm_details.vm_status,c4_vm_details.cpu_price,c4_vm_details.ram_price,c4_vm_details.disk_on_price,
    c4_vm_details.disk_off_price,c4_vm_details.bandwidth_price,	c4_vm_details.os_price, c4_vm_details.copy_type,
    c4_vm_details.status, c4_order_details.order_id, c4_order_details.billing_frequency
    FROM c4_vm_details 
    INNER JOIN c4_order_details ON c4_vm_details.order_details_id = c4_order_details.id	
    WHERE c4_vm_details.status = 1 AND c4_order_details.billing_frequency = 'HOURLY' and c4_order_details.order_type='CLOUD' and c4_vm_details.vm_env = 'LIVE' order by c4_order_details.id desc `;

    console.log(sql);
    await new Promise(function(resolve, reject) {
        dbHandler.executeQuery(sql,async function(AllVmData){
            console.log("AllVmData");
            console.log(AllVmData);
            try{
                if (AllVmData.length > 0) {
                    for await (const vmData of AllVmData) {
                        await new Promise(async function(itemResolve, itemReject){
                            plan_failover_status= vmData.plan_failover_status;
                            /*Assigning client id to member variable */
                            let clientID=vmData.clientid;
                            let lastbillingupdatedtime = 0;
                            let vm_lastbilling_sql = `SELECT * from c4_vm_lastbilling_update
                            where vmid = '${vmData.id}' and clientid = '${vmData.clientid}'
                            order by id desc limit 1`;
                            await dbHandler.executeQuery(vm_lastbilling_sql,async function(lastbillinginfo){
                                console.log("lastbillinginfo");
                                console.log(lastbillinginfo);
                                //$lastbillinginfo = $this->common->getTableData('c4_vm_lastbilling_update',array('clientid'=>vmData.clientid,'vmid'=>vmData.id),0,1,'id','desc');
                                if(lastbillinginfo.length > 0){
                                    lastbillingupdatedtime= lastbillinginfo[0].last_billing_time;
                                }else{
                                    lastbillingdata={
                                        'last_billing_time':(new Date().getTime() / 1000),
                                        'clientid':vmData.clientid,
                                        'vmid':vmData.id,
                                        'createddate':(new Date().getTime() / 1000)
                                    };
                                // $this->common->insertData('c4_vm_lastbilling_update',lastbillingdata);
                                    await dbHandler.insertIntoTable('c4_vm_lastbilling_update',lastbillingdata,function(err,result){})
                                    lastbillingupdatedtime=(new Date().getTime() / 1000);
                                }
                                let currenttime=(new Date().getTime() / 1000);
                                if((currenttime - lastbillingupdatedtime) >=3600){
                                    power_status = '';
                                    numberofhours = helper.financial((currenttime - lastbillingupdatedtime) / 3600);
                                    vmstatus = vmData.vm_status;
                                    let funds_sql = `SELECT * from c4_client_funds
                                    where fund_type = 'CLOUD' and clientid = '${vmData.clientid}'
                                    order by id desc limit 1`;
                                    await dbHandler.executeQuery(funds_sql,async function(clientcloudfunds){
                                        console.log("clientcloudfunds clientcloudfunds.length"+clientcloudfunds.length);
                                        console.log(clientcloudfunds);
                                        // $clientcloudfunds = $this->common->getTableData('c4_client_funds', array(
                                        //     'fund_type' => 'CLOUD',
                                        //     'clientid' => vmData.clientid
                                        // ), 0, 1, 'id', 'desc');
                                        if (clientcloudfunds.length > 0) {
                                            // $availblefunds = $clientcloudfunds[0]->amount;
                                        } else {
                                            fundsdata = {
                                                'clientid' : vmData.clientid,
                                                'createddate' : (new Date().getTime() / 1000),
                                                'fund_type' : fundType,
                                                'amount' : 0
                                            };
                                            await dbHandler.insertIntoTable('c4_client_funds',fundsdata,function(err,result){})
                                            // $this->common->insertData("c4_client_funds", $fundsdata);
                                            // $availblefunds=0;
                                        }

                                        servicetax = 0;
                                        parenttax = 0;
                                        childtax = 0;
                                        totaltax = 0;
                                        taxsql = "select c4_clients.tax_id, c4_clients.currency_code, c4_clients.billing_from_address ,c4_clients.currency_id, c4_clients.state, c4_clients.country from c4_clients where id =" +vmData.clientid;
                                        // $taxes = $this->common->executeQuery($taxsql);
                                        await dbHandler.executeQuery(taxsql,async function(taxes){
                                            console.log("taxes");
                                            console.log(taxes);
                                            currencycode = taxes[0].currency_code;
                                            currency_id = taxes[0].currency_id;
                                            
                                            base_price = (vmData.base_price * numberofhours);
                                            if (vmstatus == 'Running' || plan_failover_status == 1) {
                                                power_status = 'ON';
                                                diskcost = vmData.disk_units_gb * vmData.disk_on_cost;
                                                cpucost = vmData.cpu_cost * vmData.cpu_units;
                                                ramcost = vmData.ram_cost * vmData.ram_units_gb;
                                                oscost = vmData.os_cost;
                                                billperhour = diskcost + cpucost + ramcost + oscost; // vmData.disk_on_price + vmData.cpu_price + vmData.ram_price+ vmData.os_price;

                                                totalbill = billperhour * numberofhours;
                                                totalbill = totalbill + base_price;
                                                console.log('Total Bil: ' + totalbill);
                                                // die();
                                                org_amount_wo_tax = totalbill;

                                                // discountamount = $this->ctrl4c->calculateDiscountAmount($this->clientID, $totalbill);
                                                // $discountrec= $this->get_records('c4_client_discounts',array('clientid'=>$clientid,'disc_status'=>1));
                                                disc_sql = "select * from c4_client_discounts where disc_status = '1' and clientid =" +vmData.clientid;
                                                await dbHandler.executeQuery(disc_sql,async function(discountrec){
                                                    disc_percentage=0;
                                                    discountamount = 0;
                                                    if(discountrec.length > 0){
                                                        disc_percentage = discountrec[0].disc_percent;			
                                                    }
                                                    if(disc_percentage>0){
                                                        discountamount =  helper.financial((totalbill * percentage)/100,2);
                                                    }
                                                    console.log("discountamount "+discountamount);
                                                    totalbill = totalbill - discountamount;
                                                    x = {
                                                        'amount' : '1',
                                                        'tax_id' : currency_id,
                                                        'country_name' : taxes[0].country,
                                                        'state_name' : taxes[0].state,
                                                        'billing_from_address' : taxes[0].billing_from_address,
                                                        'is_client_taxable' : '1',
                                                        'get_tax' : 'percent'
                                                    };
                                                    taxpercent = helper.calculateTax(x);
                                                    // echo 'Tax Percent ==='.$taxpercent.'====';
                                                    totaltax = (totalbill * taxpercent) / 100;
                                                    // ====================
                                                    servicetax = helper.financial(totaltax, 4);
                                                    total = totalbill + totaltax;
                                                    total = helper.financial(total, 4);
                                                    /* Assigning Debit Amount to the variable */
                                                    debitAmount = total;

                                                    deductClientFunds({debitAmount:debitAmount,clientID:clientID,fundType:fundType},function(status){
                                                        console.log("status - "+status);
                                                        if (status == 1) {
                                                            fundSource = "COUPON";
                                                        } else {
                                                            fundSource = "";
                                                        }
                                                        getCurrentAvailbal(clientID,async function(availblefunds){
                                                            console.log("availblefunds - "+availblefunds);
                                                            fundsfor24hours = total * 24;
                                                            if (availblefunds >= total && availblefunds <= fundsfor24hours) {
                                                                // $this->sendalertmail($av, 'ALERT');
                                                            }
                                                            if (availblefunds >= 0) {
                                                                txn_status = 'PAID';
                                                                // $this->common->updateRecordInTable('c4_vm_hourly_transactions', array(
                                                                //     'txn_status' => 'PAID'
                                                                // ), array(
                                                                //     'vmid' => vmData.id,
                                                                //     'txn_status' => 'UNPAID',
                                                                //     'clientid' => vmData.clientid,
                                                                //     'report_generated' => 0
                                                                // ));
                                                                dataArr = {'txn_status' : 'PAID'}
                                                                await dbHandler.updateTableData('c4_vm_hourly_transactions',{'vmid' : vmData.id, 'txn_status' : 'UNPAID', 'clientid' : vmData.clientid, 'report_generated' : 0},dataArr,function(err,result){})
                                                            } else {
                                                                txn_status = 'UNPAID';
                                                                // $this->suspendvm(vmData.id,'SUSPEND'); // Temp suspend vm commented
                                                                // $this->sendalertmail($av,'ALERT');
                                                            }
                                                            hourlydata = {
                                                                'clientid' : vmData.clientid,
                                                                'vmid' : vmData.id,
                                                                'description' : currencycode + ' : ' + total + ' for ' + vmData.host_name + ' for ' + numberofhours + ' Hours',
                                                                'start_time' : lastbillingupdatedtime,
                                                                'end_time' : currenttime,
                                                                'cpu_cost' : vmData.cpu_cost,
                                                                'os_cost' : vmData.os_cost,
                                                                'ram_cost' : vmData.ram_cost,
                                                                'disk_cost' : vmData.disk_on_cost,
                                                                'total_amount' : totalbill,
                                                                'tax' : servicetax,
                                                                'total_deduction' : total,
                                                                'type' : 'HOURLYVM',
                                                                'createddate' : (new Date().getTime() / 1000),
                                                                'avail_funds' : availblefunds,
                                                                'currency_id' : currency_id,
                                                                'fund_source' : fundSource,
                                                                'txn_status' : txn_status,
                                                                'discount_amount' : discountamount,
                                                                'org_amount_wo_tax' : org_amount_wo_tax,
                                                                'base_price' : base_price,
                                                                'power_status' : power_status,
                                                                'hours' : numberofhours,
                                                                'tax_percent' : taxpercent
                                                            };
                                                            console.log(hourlydata);
                                        
                                                            await dbHandler.insertIntoTable('c4_vm_hourly_transactions',hourlydata,function(err,result){})
                                                            // $this->common->insertData("c4_vm_hourly_transactions", $hourlydata);
                                                            dataArr = {'last_billing_time' : currenttime, 'last_billed_amount' : total};
                                                            await dbHandler.updateTableData('c4_vm_lastbilling_update',{'vmid' : vmData.id,'clientid' : vmData.clientid},dataArr,function(err,result){})
                                                            // $this->common->updateRecordInTable('c4_vm_lastbilling_update', array(
                                                            //     'last_billing_time' : $currenttime,
                                                            //     'last_billed_amount' : $total
                                                            // ), array(
                                                            //     'vmid' : vmData.id,
                                                            //     'clientid' : vmData.clientid
                                                            // ));
                                                            if (txn_status == 'UNPAID') {
                                                                let vmsuspension_sql = "select * from c4_vm_suspensions where suspend_status = '1' and vmid =" +vmData.id;
                                                                await dbHandler.executeQuery(vmsuspension_sql,async function(vmsuspension){
                                                                    // $vmsuspension = $this->common->getRow('c4_vm_suspensions', array(
                                                                    //     'suspend_status' : 1,
                                                                    //     'vmid' : vmData.id
                                                                    // ));
                                                                    if (vmsuspension.length == 0) {
                                                                        suspensiondata = {
                                                                            'vmid' : vmData.id,
                                                                            'createddate' : (new Date().getTime() / 1000)
                                                                        };
                                                                        await dbHandler.insertIntoTable('c4_vm_suspensions',suspensiondata,function(err,result){})
                                                                        // $this->common->insertData("c4_vm_suspensions", $suspensiondata);
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    })
                                                    
                                                });
                                            } else {
                                                power_status = 'OFF';
                                                billperhour = (vmData.disk_units_gb * vmData.disk_on_cost) + vmData.base_price; // added base price
                          
                                                totalbill = billperhour * numberofhours;
                                                console.log('Total Bil: ' + totalbill);
                                                org_amount_wo_tax = totalbill;

                                                // discountamount = $this->ctrl4c->calculateDiscountAmount($this->clientID, $totalbill);
                                                // $discountrec= $this->get_records('c4_client_discounts',array('clientid'=>$clientid,'disc_status'=>1));
                                                disc_sql = "select * from c4_client_discounts where disc_status = '1' and clientid =" +vmData.clientid;
                                                await dbHandler.executeQuery(disc_sql,async function(discountrec){
                                                    disc_percentage=0;
                                                    discountamount = 0;
                                                    if(discountrec.length > 0){
                                                        disc_percentage = discountrec[0].disc_percent;			
                                                    }
                                                    if(disc_percentage>0){
                                                        discountamount =  helper.financial((totalbill * percentage)/100,2);
                                                    }
                                                    console.log("discountamount "+discountamount);
                                                    totalbill = totalbill - discountamount;
                                                    x = {
                                                        'amount' : '1',
                                                        'tax_id' : currency_id,
                                                        'country_name' : taxes[0].country,
                                                        'state_name' : taxes[0].state,
                                                        'billing_from_address' : taxes[0].billing_from_address,
                                                        'is_client_taxable' : '1',
                                                        'get_tax' : 'percent'
                                                    };
                                                    taxpercent = helper.calculateTax(x);
                                                    // echo 'Tax Percent ==='.$taxpercent.'====';
                                                    totaltax = (totalbill * taxpercent) / 100;
                                                    // ====================
                                                    servicetax = helper.financial(totaltax, 4);
                                                    total = totalbill + totaltax;
                                                    total = helper.financial(total, 4);
                                                    /* Assigning Debit Amount to the variable */
                                                    debitAmount = total;

                                                    deductClientFunds({debitAmount:debitAmount,clientID:clientID,fundType:fundType},function(status){
                                                        console.log("status - "+status);
                                                        if (status == 1) {
                                                            fundSource = "COUPON";
                                                        } else {
                                                            fundSource = "";
                                                        }
                                                        getCurrentAvailbal(clientID,async function(availblefunds){
                                                            console.log("availblefunds - "+availblefunds);
                                                            fundsfor24hours = total * 24;
                                                            if (availblefunds >= total && availblefunds <= fundsfor24hours) {
                                                                // $this->sendalertmail($av, 'ALERT');
                                                            }
                                                            if (availblefunds >= 0) {
                                                                txn_status = 'PAID';
                                                                // $this->common->updateRecordInTable('c4_vm_hourly_transactions', array(
                                                                //     'txn_status' => 'PAID'
                                                                // ), array(
                                                                //     'vmid' => vmData.id,
                                                                //     'txn_status' => 'UNPAID',
                                                                //     'clientid' => vmData.clientid,
                                                                //     'report_generated' => 0
                                                                // ));
                                                                dataArr = {'txn_status' : 'PAID'}
                                                                await dbHandler.updateTableData('c4_vm_hourly_transactions',{'vmid' : vmData.id, 'txn_status' : 'UNPAID', 'clientid' : vmData.clientid, 'report_generated' : 0},dataArr,function(err,result){})
                                                            } else {
                                                                txn_status = 'UNPAID';
                                                                // $this->suspendvm(vmData.id,'SUSPEND'); // Temp suspend vm commented
                                                                // $this->sendalertmail($av,'ALERT');
                                                            }
                                                            hourlydata = {
                                                                'clientid' : vmData.clientid,
                                                                'vmid' : vmData.id,
                                                                'description' : currencycode + ' : ' + total + ' for ' + vmData.host_name + ' for ' + numberofhours + ' Hours',
                                                                'start_time' : lastbillingupdatedtime,
                                                                'end_time' : currenttime,
                                                                'cpu_cost' : vmData.cpu_cost,
                                                                'os_cost' : vmData.os_cost,
                                                                'ram_cost' : vmData.ram_cost,
                                                                'disk_cost' : vmData.disk_on_cost,
                                                                'total_amount' : totalbill,
                                                                'tax' : servicetax,
                                                                'total_deduction' : total,
                                                                'type' : 'HOURLYVM',
                                                                'createddate' : (new Date().getTime() / 1000),
                                                                'avail_funds' : availblefunds,
                                                                'currency_id' : currency_id,
                                                                'fund_source' : fundSource,
                                                                'txn_status' : txn_status,
                                                                'discount_amount' : discountamount,
                                                                'org_amount_wo_tax' : org_amount_wo_tax,
                                                                'base_price' : base_price,
                                                                'power_status' : power_status,
                                                                'hours' : numberofhours,
                                                                'tax_percent' : taxpercent
                                                            };
                                                            console.log(hourlydata);
                                        
                                                            await dbHandler.insertIntoTable('c4_vm_hourly_transactions',hourlydata,function(err,result){})
                                                            // $this->common->insertData("c4_vm_hourly_transactions", $hourlydata);
                                                            dataArr = {'last_billing_time' : currenttime, 'last_billed_amount' : total};
                                                            await dbHandler.updateTableData('c4_vm_lastbilling_update',{'vmid' : vmData.id,'clientid' : vmData.clientid},dataArr,function(err,result){})
                                                            // $this->common->updateRecordInTable('c4_vm_lastbilling_update', array(
                                                            //     'last_billing_time' : $currenttime,
                                                            //     'last_billed_amount' : $total
                                                            // ), array(
                                                            //     'vmid' : vmData.id,
                                                            //     'clientid' : vmData.clientid
                                                            // ));
                                                            if (txn_status == 'UNPAID') {
                                                                let vmsuspension_sql = "select * from c4_vm_suspensions where suspend_status = '1' and vmid =" +vmData.id;
                                                                await dbHandler.executeQuery(vmsuspension_sql,async function(vmsuspension){
                                                                    // $vmsuspension = $this->common->getRow('c4_vm_suspensions', array(
                                                                    //     'suspend_status' : 1,
                                                                    //     'vmid' : vmData.id
                                                                    // ));
                                                                    if (vmsuspension.length == 0) {
                                                                        suspensiondata = {
                                                                            'vmid' : vmData.id,
                                                                            'createddate' : (new Date().getTime() / 1000)
                                                                        };
                                                                        await dbHandler.insertIntoTable('c4_vm_suspensions',suspensiondata,function(err,result){})
                                                                        // $this->common->insertData("c4_vm_suspensions", $suspensiondata);
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    })
                                                    
                                                });
                                            }
                                        });
                                    });
                                }else{
                                    let msg = 'Last Billing Updated at : '+helper.convertTimestampToDatetime(lastbillingupdatedtime)+' For Virtual Machine Id '+vmData.id+"<br />";
                                    console.log(msg);
                                    callback(1,msg);
                                    itemReject({"message":msg});
                                    reject(msg);
                                }
                            });
                            
                        });
                    }
                }else{
                    console.log("No records to update.");
                    callback(1,"No records to update.");
                    itemReject({"message":"No records to update."});
                    reject("No records to update.");
                }

            }
            catch{
                console.log("calculate Hourly Billing Cron job completed successfully");
                callback(null,"calculate Hourly Billing Cron job completed successfully");
                resolve({"message":"calculate Hourly Billing Cron job completed successfully"});
            }
            console.log("calculate Hourly Billing Cron job completed successfully");
            callback(null,"calculate Hourly Billing Cron job completed successfully");
            resolve({"message":"calculate Hourly Billing Cron job completed successfully"});
        });
    });
}

let getCurrentAvailbal= async (clientid,callback) => {
    console.log("clientid "+clientid);
    let availbal = 0;
    let couponFunds = 0;
    let currentdate = dateFormat(new Date(),"yyyy-mm-dd");
    let sql = `select * from c4_coupons_used where available_funds > 0 AND clientid = ${clientid} AND expirydate >= '${currentdate}' order by expirydate ASC`;
    console.log(sql);
    await new Promise(function(resolve, reject) {
        dbHandler.executeQuery(sql,async function(couponDetails){
            console.log("couponDetails");
            console.log(couponDetails);
            if (couponDetails.length > 0) {
                for await (const couponData of couponDetails) {
                    couponFunds += couponData.available_funds;
                }
            }
            let fundssql = `select * from c4_client_funds where clientid = ${clientid} order by id asc`;
            console.log(fundssql);
            dbHandler.executeQuery(fundssql,async function(fundDetails){
                console.log("fundDetails");
                console.log(fundDetails);
                if (fundDetails.length > 0) {
                    for await (const fundData of fundDetails) {
                        if (fundData.fund_type == "CLOUD"){
                            availbal = fundData.amount;
                        }
                    }
                }
                resolve((availbal + couponFunds));
            });
        });
    }).then(function(returnVal){
        callback(returnVal)
    });
};

let deductClientFunds= async (reqData,callback) => {
    console.log(reqData);
    let currentdate = dateFormat(new Date(),"yyyy-mm-dd");
    let sql = `select * from c4_coupons_used where available_funds > ${reqData.debitAmount} AND clientid = ${reqData.clientID} AND expirydate >= '${currentdate}' order by expirydate ASC LIMIT 1`;
    console.log(sql);
    await new Promise(function(resolve, reject) {
        dbHandler.executeQuery(sql,async function(couponDetails){
            console.log("couponDetails");
            console.log(couponDetails);
            if (couponDetails.length > 0) {
                $sql = "UPDATE `c4_coupons_used` set `available_funds`=`available_funds`-"+reqData.debitAmount+" where `id`=" + couponDetails[0].id;
                dbHandler.executeQuery(sql,async function(result){
                    resolve(1);
                });
            } else {
                let clientcloudfundssql = `select * from c4_client_funds where fund_type = '${reqData.fundType}' and clientid = ${reqData.clientID} order by id DESC LIMIT 1`;
                console.log(clientcloudfundssql);
                dbHandler.executeQuery(clientcloudfundssql,async function(clientcloudfunds){
                    
                    if (clientcloudfunds.length > 0) {
                        availblefunds = clientcloudfunds[0].amount;
                    } else {
                        fundsdata = {
                            'clientid' : reqData.clientID,
                            'createddate' : (new Date().getTime() / 1000),
                            'fund_type' : reqData.fundType,
                            'amount' : 0
                        };
                        // $this->common->insertData("c4_client_funds", $fundsdata);
                        await dbHandler.insertIntoTable('c4_client_funds',fundsdata,function(err,result){})
                        availblefunds = 0;
                    }
                    // $sql = "UPDATE `c4_client_funds` SET `amount`=`amount`-" . $this->debitAmount . " WHERE `clientid`=" . $this->clientID . " AND `fund_type`='" . $this->fundType . "'";
                    $sql = "UPDATE `c4_client_funds` set `amount`=`amount`-"+reqData.debitAmount+" where `clientid`=" + reqData.clientID+" AND `fund_type`='" +reqData.fundType + "'";
                    dbHandler.executeQuery(sql,async function(result){
                        resolve(2);
                    });
                });
            }
        });
    }).then(function(returnVal){
        callback(returnVal)
    });
};

let getHostids= (vmObj,callback) => {
    var hostids=[];
    new Promise(async function(resolve,reject){
        for(key in vmObj){
            await hostids.push(vmObj[key]['host_id']);
        }
        resolve(hostids)
    }).then(function(hostids){
        callback(hostids)
    })
    
}
/*
  Author: Pradeep
  Descri: Update Zabbix monitoring alerts in infra_alerts
  date  : 06-05-2019
*/
let updateAlertInfo= async (reqObj,callback)=>{
    const { ZabbixClient } = require("zabbix-client");
    new Promise(function(resolve, reject) {
        dbHandler.executeQuery("select * from zabbix_monitoring",async function(hostinfo){
            resolve(hostinfo);
        });
    }).then(async function(hostinfo){
        var hostids=await new Promise(function(resolve, reject) {
            getHostids(hostinfo,function(result){
                resolve(result);
            })
        })
        dbHandler.executeQuery("select * from zabbix_servers",async function(zabbix_server){
            for(k in hostids)
            {
                var hostid=hostids[k];
                const client = new ZabbixClient(zabbix_server[0].server_name);
                const api = await client.login(zabbix_server[0].username, zabbix_server[0].password);
                const alertsInfo = await api.method("trigger.get").call(
                {
                    'output' : 'extend',
                    'hostids' : hostid,
                    'only_true' : true,
                    'selectLastEvent' : true,
                    'monitored' : true,
                    'expandData' : false,
                    'limit' : 100,
                    'expandDescription' : false,
                    'sortfield' : 'lastchange',
                    'sortorder' : "DESC",
                    'expandExpression' : false,
                    'skipDependent' : true,
                    'filter' : [{'value' : 1}]
                });
                await api.logout();
                for(key in alertsInfo) {
                    let val=alertsInfo[key];
                    dbHandler.executeQuery("select * from zabbix_alerts where hostid="+hostid+" and triggerid="+val.triggerid,async function(alert){
                        if(alert && alert.length > 0)
                        {
                            dataArr = {'triggerid':val.triggerid,'description':val.description,'priority':val.priority,'lastchange':val.lastchange}
                            await dbHandler.updateTableData('zabbix_alerts',{'hostid':hostid,'triggerid':val.triggerid},dataArr,function(err,result){})
                        }else{
                            dataArr = {'serverid':zabbix_server[0].id,'hostid':hostid,'triggerid':val.triggerid,
                            'description':val.description,'priority':val.priority,'lastchange':val.lastchange}
                            await dbHandler.insertIntoTable('zabbix_alerts',dataArr,function(err,result){})
                        }
                    });
                }
            }
            return callback(null,{"message":"Alert infor updated successfully."});
        });
    })
}
/*
  Author: Pradeep
  Descri: cron for private network
  Date  : 07-05-2019
*/
let syncVcenterNetworks=(vdc_id,callback)=>{
    new Promise(function(resolve, reject) {
        vmwareModel.getVdcDetail(vdc_id, function (result) {
            if(!result)return callback(400,'vdc information not available')
            resolve(result);
        });
    }).then(async function(vdc){
        var dbcon=require('../models/'+vdc.db_type+'_query')
        var vcenterNetworks=await new Promise(function(resolve, reject){
            dbcon.vcenterNetworks(vdc,function(err,result){
                if(err)return callback(400,'The operation did not execute as expected. Please raise a ticket to support')
                resolve(result)
            })
        });
        var networks=vcenterNetworks.data;
        for(key in networks){
            var network=networks[key];
            var checkNetwork=await new Promise(function(resolve, reject){
                dbHandler.getOneRecord('infra_network',{network_name:network.NAME,vdc_id:vdc_id},function(result){
                    resolve(result)
                })
            });
            if(!checkNetwork){
                var dataArr={display_name:network.NAME,network_name:network.NAME,status:0,vdc_id:vdc_id}
                await dbHandler.insertIntoTable('infra_network',dataArr,function(err,result){});
            }
        }
        callback(null,'Record successfully updated.')
    });
}
/*
  Author: Pradeep
  Descri: cron for private ip sync
  Date  : 07-05-2019
*/
let syncIpFromVcenter=(reqObj,callback)=>{
    var vm_id=reqObj.vm_id;
    if(!vm_id) return callback(400,'Please provide the vm_id')
    new Promise(function(resolve, reject) {
        dbHandler.executeQuery("select * from infra_vms where id="+vm_id,function(result){
            if(result)
            resolve(result[0]);
            else resolve(result);
        })
    }).then(async function(vmDetail){
        const vdc = await new Promise(function (resolve, reject) {
            vmwareModel.getVdcDetail(vmDetail.vdc_id, function (result) {
                if(!result)return callback(400,'vdc information not available')
                resolve(result);
            });
        });
        if(reqObj.wait_time)
        await helper.sleep(reqObj.wait_time);
        var dbcon=require('../models/'+vdc.db_type+'_query')
        if(!vmDetail.vcenter_vm_id)return callback(400,'vcenter vm id is not available')
        var vcenterVmId=vmDetail.vcenter_vm_id.replace('VirtualMachine-vm-', '');
        var vcenterVms=await new Promise(function(resolve, reject){
            dbcon.vcenterVmIpAndNetwork(vcenterVmId,vdc,function(err,result){
                if(err)return callback(400,'The operation did not execute as expected. Please raise a ticket to support')
                resolve(result)
            })
        });
        var ipsArr=vcenterVms.data    
        for (key in ipsArr) {
            var ipData=ipsArr[key];	
            var ip=ipData.IP_ADDRESS;
            //creating gateway
            var ipOctArr = ip.split(".");
            var dns = '';
            if(vmDetail['os_type'] == 'windows')
                dns = '8.8.8.8';
            var gateway = ipOctArr[0]+"."+ipOctArr[1]+"."+ipOctArr[2]+".1";
            var subnetmask = '255.255.255.0';
            if(!in_array(ipOctArr[0],[192,172,10])){
                continue;
            }
            var network=await new Promise(function(resolve, reject){
                dbHandler.getOneRecord('infra_network',{network_name:ipData.NAME,vdc_id:vmDetail.vdc_id},function(result){
                    resolve(result)
                })
            });
            var ipDetail=await new Promise(function(resolve, reject){
                dbHandler.getOneRecord('infra_private_ipam',{ip_address:ip,network_id:network.id},function(result){
                    resolve(result)
                })
            });
            if(!ipDetail)
            {
                //Insert private ipam
                var ipArr = {'vm_id':vm_id,'ip_address':ip,'gateway':gateway,'subnetmask':subnetmask,'network_id':network.id,
                'status':'AS','added_date':dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")}
                var ipId=await new Promise(function(resolve, reject){
                    console.log('ip inserted')
                    dbHandler.insertIntoTable('infra_private_ipam',ipArr,function(err,result){resolve(result)});
                })
                console.log(ipId)
            }
            else
            {
                //update the private ipam
                var ipArr = {'vm_id':vm_id,'status':'AS','updated_date':dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss")}
                var response=await new Promise(function(resolve, reject){
                    dbHandler.updateTableData('infra_private_ipam',{id:ipDetail.id},ipArr,function(err,result){
                        console.log('ip status updated')
                        resolve(result)
                    })
                })
                console.log(response)
            } 
        }    
        return callback(null,{message:'Syncing done'})
    });
}
let vmHourlyReport=(reqObj,callback)=>{
    new Promise(function(resolve, reject) {
        dbHandler.executeQuery("select * from infra_vms where status in('PowerOn','PowerOff','Running','ShutDown','Suspend','Rebooting')",function(result){
            resolve(result);
        })
    }).then(async function(vms){
        for(var key in vms){
            var vmDetail=vms[key];
            var vm_id=vmDetail.id;
            //datetime start here
            var createddate = Math.round(new Date().getTime()/1000);
            var currentdate = new Date(dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"));
            var datetime1 = currentdate.getFullYear() + "-"+(currentdate.getMonth()+1) 
            + "-" + currentdate.getDate() + " " 
            + currentdate.getHours() + ":00:00";
            var datetime2=dateFormat(new Date(datetime1), "yyyy-mm-dd HH:MM:ss")
            var starttime = Math.round(new Date(datetime2).getTime()/1000);
            var datetime3 = currentdate.getFullYear() + "-"+(currentdate.getMonth()+1) 
            + "-" + currentdate.getDate() + " " 
            + currentdate.getHours() + ":59:59";
            var datetime4=dateFormat(new Date(datetime3), "yyyy-mm-dd HH:MM:ss")
            var endtime = Math.round(new Date(datetime4).getTime()/1000);
            //end of date time vlaues
            var hourlyRecord = await new Promise(function (resolve, reject) {
                dbHandler.getOneRecord('app_hourly_reports',{vm_id:vm_id,starttime:starttime,endtime:endtime},function(result) {
                    resolve(result);
                });
            });
            if(hourlyRecord)
            continue;
            var vdc = await new Promise(function (resolve, reject) {
                vmwareModel.getVdcDetail(vmDetail.vdc_id, function (result) {
                    if(!result)return callback(400,'vdc information not available')
                    resolve(result);
                });
            });
            //////update of vm details to hourly report
            var dbcon=require('../models/'+vdc.db_type+'_query')
            var vcenterVmId=vmDetail.vcenter_vm_id.replace('VirtualMachine-vm-', '');
            var vcenterVms=await new Promise(function(resolve, reject){
                dbcon.vcenterVmDetailsById(vcenterVmId,vdc,function(err,result){
                    if(err)resolve([])
                    resolve(result)
                })
            });
            var result=vcenterVms.data
            var vmDataArr={};
            var diskArr={};
            var vms_arr=await new Promise(function (resolve, reject) {
                for (var i in result) {
                    vmId = result[i].ID;
                    temp_arr={};
                    powerState = '0';
                    if(in_array(result[i].POWER_STATE,[0,'Off']))
                        powerState = '0';
                    else if(in_array(result[i].POWER_STATE,[1,'On']))
                        powerState = '1';
                    else if(in_array(result[i].POWER_STATE,[2,'Suspended']))
                        powerState = '0';	
                    vmDataArr[vmId]={ 'vcenterVmId':'VirtualMachine-vm-'+vmId,'vmId':vmId,'vmHostName': result[i].DNS_NAME,
                        'powerState': powerState,'memoryMb': result[i].MEM_SIZE_MB,'cpu': result[i].NUM_VCPU,
                        'NUM_DISK': result[i].NUM_DISK,'host': result[i].HOST, 'datastore': result[i].DATASTORE,
                        'vmName': decodeURIComponent(result[i].NAME),'guest': result[i].GUEST_OS,'os_type': result[i].GUEST_FAMILY,
                        'vcenter_uuid': result[i].VMUNIQUEID
                    };
                    if(!diskArr[vmId])
                    diskArr[vmId]=new Array();
                    diskArr[vmId][diskArr[vmId].length]={
                        'capacity':result[i].CAPACITY,
                        //'vdevice_id':result[i].VDEVICE_ID,
                        'disk_label':result[i].DISK_LABEL
                    }
                }
                resolve({diskInfo:diskArr,vms:vmDataArr})
            }); 
            for (var vmId in vms_arr.vms) {
                var vmData=vms_arr.vms[vmId]
                //calculating total disk size
                var diskSize = 0;var diskArr=[];
                for(d=0;d<vms_arr.diskInfo[vmId].length;d++)
                {
                    if(!in_array(vms_arr.diskInfo[vmId][d].disk_label,diskArr)){
                        await diskArr.push(vms_arr.diskInfo[vmId][d].disk_label);
                        diskSize = parseFloat(diskSize)+parseFloat(vms_arr.diskInfo[vmId][d].capacity);
                    }
                }	
                var vmInfo = {clientid:1,vm_id:vm_id,starttime:starttime,endtime:endtime,memory:vmData['memoryMb'],
                cpu_core:vmData['cpu'],harddisk:diskSize,power_status:powerState,createddate:createddate};
                //Insert vm details in hourly report table
                await new Promise(function(resolve, reject){
                    dbHandler.insertIntoTable('app_hourly_reports',vmInfo,function(err,result){
                        console.log('app_hourly_reports info inserted')
                        resolve(result)
                    })
                })
            } 
            /////
        }
        callback(null,'Syncing done');
    });
}
let scheduleCronJob=(callback)=> {
    var baseUrl = 'http://localhost:9890/';
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var d = new Date();
    var dayName = days[d.getDay()];
    sql = "select vm.vcenter_vm_name,sch.* from infra_vms as vm inner join infra_scheduler as sch on vm.id=sch.vm_id where sch.status=1";
    new Promise(function(resolve,reject){
        dbHandler.executeQuery(sql,function(result){resolve(result)})
    }).then(async function(items){
        var response = [];var vm=[];
        //console.log(items);
        for(var i=0;i<items.length;i++){
            vm=items[i];
            //checking the scheduler type and current day
            if(vm.scheduler_type=='weekly' && vm.waiting_at==1 && vm.week_day!=dayName){
                console.log('continue..skipping..as condition not satisfy')
                continue;
            }
            var current = dateFormat(new Date(),"HH:MM:ss");
            var d1 = dateFormat(new Date(),"yyyy-mm-dd");
            d1=(d1+' '+current).toString();
            var d = new Date(d1);
            var current = dateFormat(new Date(d),"yyyy-mm-dd HH:MM:ss");
            d.setMinutes(d.getMinutes() + 5);
            var d2 = dateFormat(new Date(d),"yyyy-mm-dd HH:MM:ss");
            var currentWithFewMints=dateFormat(d2,"yyyy-mm-dd HH:MM:ss"); 
            d1 = dateFormat(new Date(),"yyyy-mm-dd");
            d1=(d1+' '+vm.start_time).toString();
            d = new Date(d1);
            var start_time = dateFormat(new Date(d),"yyyy-mm-dd HH:MM:ss");
            d1 = dateFormat(new Date(),"yyyy-mm-dd");
            d1=(d1+' '+vm.end_time).toString();
            d = new Date(d1);
            var end_time = dateFormat(new Date(d),"yyyy-mm-dd HH:MM:ss");
            console.log(current+'--'+start_time+'--'+currentWithFewMints)
            if(start_time>=current && start_time<=currentWithFewMints && vm.waiting_at==1)
            {console.log(1)
                 if(vm.start_on_off=='off'){console.log(vm.start_on_off)
                    await axios.post(baseUrl+'vmware/vm_operations',querystring.stringify({vm_id:vm.vm_id,vm_action:2}))
                        .then(response => {
                            console.log(response.data);
                            new Promise(function (resolve2, reject2) {
                                dbHandler.updateTableData('infra_scheduler',{vm_id:vm.vm_id},{waiting_at:2},function(err,result){resolve2(1)});
                            })
                            var insertIpDataArr = {'vm_id':vm.vm_id,'action':'Power Off','action_time':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                                    'log':querystring.stringify(response.data)}
                            new Promise(function (resolve, reject) {
                                dbHandler.insertIntoTable('scheduler_log',insertIpDataArr,function(err,result){resolve(result)});
                            })
                        })
                        .catch(error => {
                            console.log(error);
                            new Promise(function (resolve2, reject2) {
                                dbHandler.updateTableData('infra_scheduler',{vm_id:vm.vm_id},{waiting_at:1},function(err,result){resolve2(1)});
                            })
                            var insertIpDataArr = {'vm_id':vm.vm_id,'action':'Power Off','action_time':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                                    'log':querystring.stringify(error)}
                            new Promise(function (resolve, reject) {
                                dbHandler.insertIntoTable('scheduler_log',insertIpDataArr,function(err,result){resolve(result)});
                            })
                        });
                 }else{console.log(vm.start_on_off)
                    await axios.post(baseUrl+'vmware/vm_operations',querystring.stringify({vm_id:vm.vm_id,vm_action:1}))
                        .then(response => {
                            console.log(response.data);
                            new Promise(function (resolve2, reject2) {
                                dbHandler.updateTableData('infra_scheduler',{vm_id:vm.vm_id},{waiting_at:2},function(err,result){resolve2(1)});
                            })
                            var insertIpDataArr = {'vm_id':vm.vm_id,'action':'Power On','action_time':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                                    'log':querystring.stringify(response.data)}
                            new Promise(function (resolve, reject) {
                                dbHandler.insertIntoTable('scheduler_log',insertIpDataArr,function(err,result){resolve(result)});
                            })
                        })
                        .catch(error => {
                            console.log(error);
                            new Promise(function (resolve2, reject2) {
                                dbHandler.updateTableData('infra_scheduler',{vm_id:vm.vm_id},{waiting_at:1},function(err,result){resolve2(1)});
                            })
                            var insertIpDataArr = {'vm_id':vm.vm_id,'action':'Power On','action_time':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                                    'log':querystring.stringify(error)}
                            new Promise(function (resolve, reject) {
                                dbHandler.insertIntoTable('scheduler_log',insertIpDataArr,function(err,result){resolve(result)});
                            })
                        });
                }
            }else if(end_time>=current && end_time<=currentWithFewMints && vm.waiting_at==2)
            {console.log(2)
                 if(vm.start_on_off=='off'){
                    await axios.post(baseUrl+'vmware/vm_operations',querystring.stringify({vm_id:vm.vm_id,vm_action:1}))
                        .then(response => {
                            console.log(response.data);
                            new Promise(function (resolve2, reject2) {
                                dbHandler.updateTableData('infra_scheduler',{vm_id:vm.vm_id},{waiting_at:1},function(err,result){resolve2(1)});
                            })
                            var insertIpDataArr = {'vm_id':vm.vm_id,'action':'Power On','action_time':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                                    'log':querystring.stringify(response.data)}
                            new Promise(function (resolve, reject) {
                                dbHandler.insertIntoTable('scheduler_log',insertIpDataArr,function(err,result){resolve(result)});
                            })
                        })
                        .catch(error => {
                            console.log(error);
                            new Promise(function (resolve2, reject2) {
                                dbHandler.updateTableData('infra_scheduler',{vm_id:vm.vm_id},{waiting_at:2},function(err,result){resolve2(1)});
                            })
                            var insertIpDataArr = {'vm_id':vm.vm_id,'action':'Power On','action_time':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                                    'log':querystring.stringify(error)}
                            new Promise(function (resolve, reject) {
                                dbHandler.insertIntoTable('scheduler_log',insertIpDataArr,function(err,result){resolve(result)});
                            })
                        });
                 }else{
                   await axios.post(baseUrl+'vmware/vm_operations',querystring.stringify({vm_id:vm.vm_id,vm_action:2}))
                        .then(response => {
                            console.log(response.data);
                            new Promise(function (resolve2, reject2) {
                                dbHandler.updateTableData('infra_scheduler',{vm_id:vm.vm_id},{waiting_at:1},function(err,result){resolve2(1)});
                            })
                            var insertIpDataArr = {'vm_id':vm.vm_id,'action':'Power Off','action_time':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                                    'log':querystring.stringify(response.data)}
                            new Promise(function (resolve, reject) {
                                dbHandler.insertIntoTable('scheduler_log',insertIpDataArr,function(err,result){resolve(result)});
                            })
                        })
                        .catch(error => {
                            console.log(error);
                            new Promise(function (resolve2, reject2) {
                                dbHandler.updateTableData('infra_scheduler',{vm_id:vm.vm_id},{waiting_at:2},function(err,result){resolve2(1)});
                            })
                            var insertIpDataArr = {'vm_id':vm.vm_id,'action':'Power Off','action_time':dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                                    'log':querystring.stringify(error)}
                            new Promise(function (resolve, reject) {
                                dbHandler.insertIntoTable('scheduler_log',insertIpDataArr,function(err,result){resolve(result)});
                            })
                        });
                }
            }
        }
        callback(null,'Success');  
    })
}
function preparedUsageData(){
    axios.get(`${config.ZABBX_URL}/nagios/index.php/cronjob/sync_usage_data`);
    console.log('running')
    return 1;
}
/*
  Author: Pradeep
  Descri: usage Report Generation
  Date  : 01-05-2019
*/
function usageReportGeneration(){
    var assestPath = path.join(__dirname+"/../");
    assestPath = assestPath.replace(new RegExp(/\\/g),'/');
    assestPath = "file:///"+assestPath;
    var sql=`select vm.host_name,u.* from zabbix_usage_report_token as u inner join zabbix_monitoring as vm on
    vm.client_id=u.client_id and vm.cloud_host_id=u.cloud_host_id where u.is_data_ready='Yes' order by u.id desc limit 50`
    monitoringDB.executeQuery(sql,async function(tokens){
        //console.log(tokens)
        for await(const token of tokens)
        {
            var checkVal=await new Promise(function(resolve,reject){
                dbHandler.getOneRecord('c4_usage_reports',{client_id:token.client_id,vm_id:token.cloud_host_id,status:1,token:token.token_no},function(result){
                    resolve(result)
                })
            })
            if(checkVal){
                console.log(`continue..${checkVal.token}`)
                continue;
            }
            var sql2=`select * from zabbix_monitoring_usage_report where client_id=${token.client_id} and 
            cloud_host_id=${token.cloud_host_id} and record_date >=${token.from_date}
             and record_date <=${token.to_date} order by record_date asc`
             try{
                await monitoringDB.executeQuery(sql2,async function(resultsets){
                    try{
                    await new Promise(async function(resolve,reject){
                        
                            let html = '<div style="display:none;"><img src="'+assestPath+'img/cloud4c_logo.png" alt="Logo" width="100" height="30" border="0"  /></div>';
                            html += `<h4>Usage Report For Host: ${token.host_name}</h1>`;
                            html += '<table border="1" width="100%">';
                            html += '<tr>';
                            html += '<th>Date</th>';
                            html += '<th>CPU(%)</th>';
                            html += '<th>Memory(%)</th>';
                            html += '<th>Disk(%)</th>';
                            html += '</tr>';
                            for await (const record of resultsets) {
                                html += '<tr>';
                                html += '<th>'+dateFormat((record.record_date*1000),"yyyy-mm-dd")+'</th>';
                                html += '<th>'+record.CPU+'</th>';
                                html += '<th>'+record.RAM+'</th>';
                                html += '<th>'+record.HDD+'</th>';
                                html += '</tr>';
                            }
                            html += '</table>';
                            var options = { 
                                format: 'Letter',
                                base: assestPath,
                                "header": {
                                    "height": "45mm",
                                    "contents": '<div style="text-align: center;"><img src="'+assestPath+'img/cloud4c_logo.png" alt="Logo" width="100" height="30" border="0"  /></div>'
                                },
                                "footer": {
                                    "height": "28mm",
                                    "contents": {
                                    //first: 'Cover page',
                                    // 2: 'Second page', // Any page number is working. 1-based index
                                    default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
                                    // last: 'Last Page'
                                    }
                                }
                            };
                            await pdf.create(html, options).toFile('./reports/'+token.token_no+'.pdf', function(err, res) {
                                if (err){
                                    console.log(err);
                                }else{
                                   dbHandler.updateTableData('c4_usage_reports',{client_id:token.client_id,token:token.token_no},{status:1},function(result){

                                    })
                                    console.log(res)
                                }
                            })
                        })
                    }
                    catch(e){
                        console.log("Error")
                    }
                })
            }
            catch(e){
                console.log("Error")
            }
        }
    })          
}
/*
  Author: Pradeep
  Descri: sync vm list
  Date  : 21-10-2019
*/
let syncVmList= (reqBody,callback)=>{
    if(!reqBody.clientid)return callback(400,{message:"Please provide the client id"})
    if(!reqBody.vdc_id)return callback(400,{message:"Please provide the vdc id"})
    if(!reqBody.tech_id)return callback(400,{message:"Please provide the vdc tech id"})
    var vdc_id=reqBody.vdc_id;
    var clientid=reqBody.clientid;
    var tech_id=reqBody.tech_id;
    new Promise(function(resolve,reject){
        var sql=`select curlpath from c4_vdc_tech_disk where vdc_id=${vdc_id} and tech_id=${tech_id}`
        dbHandler.executeQuery(sql,function(vdc){
            if(vdc && vdc.length > 0)
            resolve(vdc[0])
            else resolve([])
        })
    }).then(async function(vdc){
        if(!vdc)return callback(400,{message:"Invalid inputs"})
        await axios.get(`${vdc.curlpath}vm_list`).
        then(async response=>{
            if(response && response.data && response.data.data){
                for await(var data of response.data.data){
                    var vm=data.Vms;
                    var vm_status='Running';
                    var power_state='poweredOn'
                    if(vm.status=='poweredOn' || vm.status=='PowerOn'){
                        vm_status='Running';
                        power_state='poweredOn'
                    }
                    else {
                        vm_status='Stopped';
                        power_state='poweredOff'
                    }
                    var insertdata={
                        cloudid : 1,
                        copy_type:'1C',
                        order_details_id : 0,
                        clientid : clientid,
                        host_name:vm.name,
                        label_name:vm.name,
                        ref_id:vm.id,
                        ram_units_gb:parseInt(vm.ram/1024),
                        cpu_units:vm.cpu_count,
                        disk_units_gb:vm.hdd,
                        multiple_ip:JSON.stringify({"ip_address":vm.ip_address}),
                        primary_ip:vm.ip_address,
                        power_status:power_state,
                        vm_status:vm_status,
                        vdc_id : vdc_id,
                        tech_id : tech_id,
                        updateddate : Math.floor(Date.now()/1000)
                    }
                    //console.log(insertdata)
                    await new Promise(async function(res1,rej1){
                        await dbHandler.getOneRecord('c4_vm_details',{label_name:vm.name,ref_id:vm.id},async function(vmdetail){
                            if(!vmdetail){
                                await dbHandler.insertIntoTable('c4_vm_details',insertdata,function(err,result){
                                    console.log(result)
                                    res1('')
                                });
                            }
                            else{
                                await dbHandler.updateTableData('c4_vm_details',{id:vmdetail.id},insertdata,function(err,result){
                                    console.log(result)
                                    res1('')
                                });
                            }
                        })
                    })
                }
            }
        }) 
        .catch(error=>{
            //console.log(error)
            return callback(400,{message:"The operation did not execute as expected. Please raise a ticket to support"})
        })
    })
}

    /*
    Author: Pradeep
    Description: dynamically vm attachments
    */
let privateVmSyncing= (reqQuery,callback)=>{
	console.log("reqQuery");
	console.log(reqQuery);
    new Promise(function(resolve,reject){
//      clientid = 14703  //Kfintech clientid
      var sql=`select vdc.curlpath,vdc.tech_id,vdc.vdc_id,cv.client_id from c4_vdc_tech_disk as vdc 
	        inner join c4_clients_vdc as cv on cv.vdc_id=vdc.vdc_id 
	        inner join c4_clients as c on c.id=cv.client_id 
	        where c.status=1 and vdc.client_entity_id=2`
      if(reqQuery.clientid && reqQuery.clientid != ''){
    	  sql += ` and c.id = '${reqQuery.clientid}'`;
      }
      if(!reqQuery.clientVdcStatus){
    	  sql += ` and cv.status = 1`;
      }if(reqQuery.clientVdcStatus && reqQuery.clientVdcStatus != '' && reqQuery.clientVdcStatus != 'any'){
    	  sql += ` and cv.status = '${reqQuery.clientVdcStatus}'`;
      }
//      console.log(sql);
    //   else{
    //     var sql=`select vdc.curlpath,vdc.tech_id,vdc.vdc_id,cv.client_id from c4_vdc_tech_disk as vdc inner join c4_clients_vdc as cv
    //    on cv.vdc_id=vdc.vdc_id inner join c4_clients as c on c.id=cv.client_id where c.status=1 and vdc.client_entity_id=2`
    //   }
       dbHandler.executeQuery(sql,function(result){
           if(result){
               resolve(result)
           }else{
               resolve('')
           }
       })
   }).then(async function(vdclist){
	   console.log(vdclist);
//	   return 1;
       //console.log(vdclist)
       if(!vdclist){
    	   return callback('Wrong url');
	   }
       for await(var vdc of vdclist)
       {
    	   console.log(`${vdc.curlpath}vm_list`)
            await axios.get(`${vdc.curlpath}vm_list`)
            .then(async response=>{
//                console.log(response.data)
                //return callback(response.data)
                if(response && response.data && response.data.data){
                    for await(var data of response.data.data){
                        var vm=data.Vms;
                        //console.log(vm)
                        if(vm.user_id=='0')
                        {
                                var vm_status='Running';
                                var power_status="poweredOff"
                                if(vm.status=='PowerOn'){
                                    vm_status='Running';
                                    power_status="poweredOn";
                                }
                                else{
                                    vm_status='Stopped';
                                    power_status="poweredOff";
                                }
                                var insertdata={
                                    cloudid : 1,
                                    copy_type:'1C',
                                    //order_details_id : 0,
                                    clientid : vdc.client_id,
                                    host_name:vm.name,
                                    label_name:vm.name,
                                    ref_id:vm.id,
                                    ram_units_gb:parseInt(vm.ram/1024),
                                    cpu_units:vm.cpu_count,
                                    disk_units_gb:vm.hdd,
                                    multiple_ip:JSON.stringify({"ip_address":vm.ip_address}),
                                    primary_ip:vm.ip_address,
                                    power_status:power_status,
                                    vm_status:vm_status,
                                    vdc_id : vdc.vdc_id,
                                    tech_id : vdc.tech_id,
                                    status:1,
                                    updateddate : Math.floor(Date.now()/1000)
                                }
                                if(vm.status=='Deleted')
                                {
                                    insertdata.vm_status='Deleted';
                                    insertdata.power_status="poweredOff";
                                    insertdata.status=0;
                                } 
                                console.log("insertdata")
                                //console.log(insertdata)
                                await new Promise(async function(res1,rej1){
                                    await dbHandler.getOneRecord('c4_vm_details',{clientid:vdc.client_id,ref_id:vm.id,vdc_id:vdc.vdc_id},async function(vmdetail){
                                        if(!vmdetail && vm.status!='Deleted'){
                                            await dbHandler.insertIntoTable('c4_vm_details',insertdata,function(err,result){
                                                console.log("inserted")
                                                console.log(result)
                                                res1('')
                                            });
                                        }
                                        else if(vmdetail && vmdetail.id!=''){
                                            await dbHandler.updateTableData('c4_vm_details',{id:vmdetail.id,clientid:vdc.client_id},insertdata,function(err,result){
                                                console.log("updated")
                                                console.log(result)
                                                res1('')
                                            });
                                        }else{
                                            res1('')
                                        }
                                    })
                                })
                            }
                        }
                    }
                    console.log("Success")
                    return callback("Success")
            }).catch(error=>{
                console.log(error)
                return callback({error:error})
            })
        }
   })
}

module.exports={
    syncVcenterVms,syncVcenterDatastores,
    updateVmStatus,syncVcenterHosts,
    updateVmDetails,syncVcenterTemplates,
    vmHourlyReport,
    updateMonitoringInInfravm,
    uptimeReportGeneration,
//    utilizationReportGeneration,
    hypervCreateVm,hypervUpdateVmDetails,
    calculateHourlyBilling,
    updateAlertInfo,syncVcenterNetworks,
    syncIpFromVcenter,scheduleCronJob,
    usageReportGeneration,
    preparedUsageData,
    syncVmList,
    privateVmSyncing
}

