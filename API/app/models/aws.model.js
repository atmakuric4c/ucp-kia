var db = require('../../config/database');
var dbFunc = require('../../config/db-function');
const helper=require('../../helpers/common_helper');
const axios = require('axios');
var dateFormat=require('dateformat');
const dbHandler= require('../../config/api_db_handler');
const awsModel=require('../../models/aws_model');
const connpool=require('../../config/db_mssql');
var querystring = require('querystring');
var base64 = require('base-64');
const request=require('request');
const { promises } = require('dns');
///
const config=require('../../config/constants');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');
const AWS = require('aws-sdk');
const moment = require('moment');
const awsExternalServices = require('../external_services/aws.service');

let getAllVmlist = async (clientid)=> {
    return new Promise((resolve,reject) => {
       var sql=`SELECT vm.*,REPLACE(av.vm_name,av.vm_name,av.instanceId) as label_name from c4_vm_details as vm
       inner join aws_vms as av on av.vm_detail_id = vm.id
       WHERE  vm.clientid=${clientid} and vm.cloudid=4 and vm.vm_status not in('Deleted','CreationFailed') order by vm.label_name asc`;
       console.log(sql);
       db.query(sql,async (error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                // let i = 0;
                // for await (const item of rows) {
                //     rows[i].encodeVal = base64.encode(item.clientid+"_"+item.subscriptionId+"_"+item.vmId);
                //     i++;
                // }
                dbFunc.connectionRelease;
                resolve(rows)
            }
       });
    });
}

function getAllNetwork(clientid) {
    return new Promise((resolve,reject) => {
       var sql=`SELECT * from aws_networks WHERE clientid=${clientid} order by id desc`;
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

function getVmDetailbyId(clientid,vm_id,callback) {
    var sql=`SELECT vm.*,aws.regionName,aws.instanceId,'NA' as location from c4_vm_details as vm inner join aws_vms as aws on vm.ref_id=aws.instanceId
        WHERE vm.id=${vm_id} and vm.clientid=${clientid}`;
    //console.log(sql)
    db.query(sql,(error,rows,fields)=>{
        if(!!error) {
            dbFunc.connectionRelease;
            reject(error);
        } else {
            dbFunc.connectionRelease;
            var vminfo=rows[0]
            new Promise(function(resolve,reject){
                awsModel.aws_authtoken(vminfo.clientid, function(error, result){
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
                    var p3=new Promise(function(resolve,reject){
                        params.queryParams = {
                            "Action": 'DescribeVolumes',
                            "Filter.1.Name":"volume-id",
                            "Filter.1.Value.1":vmdetail.blockDeviceMapping[0].item[0].ebs[0].volumeId[0],
                            "Version":"2016-11-15"
                        };
                        params.url = params.myService+'.'+params.region+'.amazonaws.com';
                        helper.awsProcessRequest(params,async function(err, responseBody){
                            if(responseBody && responseBody.Response && responseBody.Response.Errors){
                                resolve([])
                            }else{
                                resolve(responseBody.DescribeVolumesResponse.volumeSet[0].item[0])
                            }
                        })
                    })
                    await Promise.all([p1,p2,p3]).then(function(values) {
                        var vpc=values[0]
                        var subnet=values[1]
                        var disk=values[2]
                        return callback(null,{vm:vminfo,vm_detail:vmdetail,
                            vpc_detail:vpc,subnet_detail:subnet,disk_detail:disk})
                    })
                }
            })           
        }
    });
}

function vmOperations(reqObj,callback){
    var clientid=base64.decode(reqObj.clientid);
    var ref_id=base64.decode(reqObj.ref_id);
    var vm_id=base64.decode(reqObj.vm_id);
    new Promise((resolve,reject) => {
        var sql=`select * from c4_vm_details as vm where vm.clientid=${clientid} and vm.id=${vm_id} and vm.cloudid=4`
        dbHandler.executeQuery(sql,function(result){
            resolve(result)
        })
    }).then(async function(vmInfo){
        if(!vmInfo)return callback([],{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'});
        let postParams = { "ref_id": ref_id, "action": reqObj.action,"user_id":clientid};
        let vm_status='';var action_no=0;
        switch(reqObj.action){
            case 'stop': vm_status='PoweredOff';action_no=2;break;
            case 'start': vm_status='Running';action_no=1;break;
            case 'restart': vm_status='Running';action_no=4;break;
            case 'delete':
            	return callback(null,{success:0,message:'Access denied',data:[]});
//            	vm_status='Deleted';
//            	action_no=3;
            	break;
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
        var obj={
            actionName:reqObj.action,
            ref_id:ref_id,
            clientid:clientid
        }
        await awsModel.vmOperations(obj,function(error,response){
            dbHandler.updateTableData('c4_vm_details',{id:vm_id},{vm_status:vm_status},function(err,result){
                return callback(null,response);
            })
        })
        
    })
}

let getDiskList = async (reqObj,callback)=>{
    var frmValues ={
        clientid : reqObj.body.clientid,
        subscription_id : reqObj.body.subscription_id,
        diskState : ((reqObj.body.diskState)?reqObj.body.diskState:""),
        resourceGroup : ((reqObj.body.resourceGroup)?reqObj.body.resourceGroup:"")
    }
    ////console.log(frmValues);
    return awsModel.aws_authtoken(frmValues.clientid,async function(error, token){
        // //console.log("token");
        // //console.log(token);
        if(token.tokendata.length == 0){
            var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
            resourcegroupsReject(response);
            reject(response);
        }else{
            urlpath = 'https://management.aws.com/subscriptions/'+frmValues.subscription_id+'/providers/Microsoft.Compute/disks?api-version=2019-07-01';
            //console.log("urlpath");
            //console.log(urlpath);

            var options = { method: 'GET',
                url: urlpath,
                headers: 
                { 
                    'cache-control': 'no-cache',
                    'content-type': 'application/json',
                    authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                },
                json: true 
            };

            request(options, async function (error, response, body) {
                if (error) {
                    let res = {status:"error","message":error.error.message};
                    callback(1,res);
                    //throw new Error(error);
                }else{
                    //console.log(body);
                    if (body.value) {
                        let dataRes = [];
                        if((frmValues.diskState != "" || frmValues.resourceGroup != '') && body.value.length > 0){
                            for await (const item of body.value) {
                                var string = await item.id.split('/');
                                var itemResourceGroup=string[4].toLowerCase();
                                if(frmValues.diskState != "" && item.properties.diskState.toLowerCase() == frmValues.diskState.toLowerCase()
                                    && frmValues.resourceGroup != "" && itemResourceGroup == frmValues.resourceGroup.toLowerCase()){
                                    dataRes.push(item);
                                }else if(frmValues.diskState != "" && item.properties.diskState.toLowerCase() == frmValues.diskState.toLowerCase()
                                && frmValues.resourceGroup == ""){
                                    dataRes.push(item);
                                }else if(frmValues.diskState == ""
                                && frmValues.resourceGroup != "" && itemResourceGroup == frmValues.resourceGroup.toLowerCase()){
                                    dataRes.push(item);
                                }
                            }
                        }else{
                            dataRes = body.value;
                        }
                        let res = {status:"success","message":"Disk list",data:dataRes};
                        callback(null,res);
                    }else{
                        let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                        if(body.error && body.error.message){
                            res.message = body.error.message;
                        }
                        callback(1,res);
                        //throw new Error(error);
                    }
                }
            });
        }
    })
}

let addDisk = async (reqObj,callback)=>{
    var frmValues ={
        clientid : reqObj.body.clientid,
        subscription_id : reqObj.body.subscription_id,
        name : reqObj.body.name,
        location : reqObj.body.location,
        diskSizeGB : reqObj.body.diskSizeGB,
        createOption : "Empty",
        resourceGroup : reqObj.body.resourceGroup
    }
    //console.log(frmValues);
    return awsModel.aws_authtoken(frmValues.clientid,async function(error, token){
        // //console.log("token");
        // //console.log(token);
        if(token.tokendata.length == 0){
            var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
            resourcegroupsReject(response);
            reject(response);
        }else{
            urlpath = 'https://management.aws.com/subscriptions/'+frmValues.subscription_id+'/resourceGroups/'+frmValues.resourceGroup+'/providers/Microsoft.Compute/disks/'+frmValues.name+'?api-version=2019-07-01';
            //console.log("urlpath");
            //console.log(urlpath);

            let reqBody = { 
                location: frmValues.location,
                properties: { 
                    creationData: { 
                        createOption: 'Empty' //frmValues.createOption 
                    }, 
                    diskSizeGB: frmValues.diskSizeGB 
                } 
            };

            var options = { method: 'PUT',
                url: urlpath,
                headers: 
                { 
                    'cache-control': 'no-cache',
                    'content-type': 'application/json',
                    authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                },
                body: reqBody,
                json: true 
            };

            request(options, async function (error, response, body) {
                if (error) {
                    let res = {status:"error","message":error.error.message};
                    callback(1,res);
                    //throw new Error(error);
                }else{
                    //console.log(body);
                    if (body.name) {
                        let res = {status:"success","message":"Disk added successfully"};
                        callback(null,res);
                    }else{
                        let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                        if(body.error && body.error.message){
                            res.message = body.error.message;
                        }
                        callback(1,res);
                        //throw new Error(error);
                    }
                }
            });
        }
    })
}

let attachDisk = async (reqObj,callback)=>{
    var frmValues ={
        clientid : reqObj.body.clientid,
        subscription_id : reqObj.body.subscription_id,
        vmName : reqObj.body.vmName,
        caching : "ReadWrite",
        diskId : reqObj.body.diskId,
        storageAccountType : reqObj.body.storageAccountType,
        diskSizeGB : reqObj.body.diskSizeGB,
        createOption : "Empty",
        resourceGroup : reqObj.body.resourceGroup
    }
    //console.log(frmValues);
    return awsModel.aws_authtoken(frmValues.clientid,async function(error, token){
        // //console.log("token");
        // //console.log(token);
        if(token.tokendata.length == 0){
            var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
            resourcegroupsReject(response);
            reject(response);
        }else{
            urlpath = 'https://management.aws.com/subscriptions/'+frmValues.subscription_id+'/resourceGroups/'+frmValues.resourceGroup+'/providers/Microsoft.Compute/virtualMachines/'+frmValues.vmName+'?api-version=2019-12-01';
            //console.log("urlpath");
            //console.log(urlpath);

            var options = { method: 'GET',
                url: urlpath,
                headers: 
                { 
                    'cache-control': 'no-cache',
                    'content-type': 'application/json',
                    authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                },
                json: true 
            };

            request(options, async function (error, response, vmBody) {
                if (error) {
                    let res = {status:"error","message":error.error.message};
                    callback(1,res);
                    //throw new Error(error);
                }else{
                    //console.log(vmBody);
                    if (vmBody.name) {
                        urlpath = 'https://management.aws.com/subscriptions/'+frmValues.subscription_id+'/resourceGroups/'+frmValues.resourceGroup+'/providers/Microsoft.Compute/virtualMachines/'+frmValues.vmName+'?api-version=2019-12-01';
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
                            "managedDisk":{
                                "id": frmValues.diskId,
                                "storageAccountType": frmValues.storageAccountType
                            },
                            "diskSizeGB": frmValues.diskSizeGB,
                            "createOption": "Attach",
                            "lun":helper.getRandomNumberWithinRange(0,63,lunArr)
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

                        var options = { method: 'PUT',
                            url: urlpath,
                            headers: 
                            { 
                                'cache-control': 'no-cache',
                                'content-type': 'application/json',
                                authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                            },
                            body: reqBody,
                            json: true 
                        };

                        request(options, async function (error, response, body) {
                            if (error) {
                                let res = {status:"error","message":error.error.message};
                                callback(1,res);
                                //throw new Error(error);
                            }else{
                                //console.log(body);
                                if (body.name) {
                                    let res = {status:"success","message":"Disk attached successfully"};
                                    callback(null,res);
                                }else{
                                    let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                                    if(body.error && body.error.message){
                                        res.message = body.error.message;
                                    }
                                    callback(1,res);
                                    //throw new Error(error);
                                }
                            }
                        });
                    }else{
                        let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                        if(vmBody.error && vmBody.error.message){
                            res.message = vmBody.error.message;
                        }
                        callback(1,res);
                        //throw new Error(error);
                    }
                }
            });
        }
    })
}

let detachDisk = async (reqObj,callback)=>{
    var frmValues ={
        clientid : reqObj.body.clientid,
        subscription_id : reqObj.body.subscription_id,
        vmName : reqObj.body.vmName,
        diskName : reqObj.body.diskName
    }
    //console.log(frmValues);
    return awsModel.aws_authtoken(frmValues.clientid,async function(error, token){
        // //console.log("token");
        // //console.log(token);
        if(token.tokendata.length == 0){
            var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
            resourcegroupsReject(response);
            reject(response);
        }else{
            urlpath = 'https://management.aws.com/subscriptions/'+frmValues.subscription_id+'/resourceGroups/automation/providers/Microsoft.Compute/virtualMachines/'+frmValues.vmName+'?api-version=2019-12-01';
            //console.log("urlpath");
            //console.log(urlpath);

            var options = { method: 'GET',
                url: urlpath,
                headers: 
                { 
                    'cache-control': 'no-cache',
                    'content-type': 'application/json',
                    authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                },
                json: true 
            };

            request(options, async function (error, response, vmBody) {
                if (error) {
                    let res = {status:"error","message":error.error.message};
                    callback(1,res);
                    //throw new Error(error);
                }else{
                    //console.log(vmBody);
                    if (vmBody.name) {
                        urlpath = 'https://management.aws.com/subscriptions/'+frmValues.subscription_id+'/resourceGroups/automation/providers/Microsoft.Compute/virtualMachines/'+frmValues.vmName+'?api-version=2019-12-01';
                        //console.log("urlpath");
                        //console.log(urlpath);

                        let dataDisks = vmBody.properties.storageProfile.dataDisks;
                        dataDisksUpdate = [];
                        if(dataDisks.length == 0){
                            let res = {status:"error","message":"Invalid request."};
                            callback(1,res);
                        }else{
                            //console.log("dataDisks");
                            //console.log(dataDisks);
                            for await (const item of dataDisks) {
                                if(item.name != frmValues.diskName){
                                    let dataDisksUpdateLength = dataDisksUpdate.length;
                                    dataDisksUpdate[dataDisksUpdateLength] = item;
                                }
                            }
                            //console.log("dataDisksUpdate");
                            //console.log(dataDisksUpdate);

                            let reqBody = { 
                                "location": vmBody.location, 
                                "properties": { 
                                    "storageProfile": { 
                                        "dataDisks": dataDisksUpdate
                                    }
                                }
                            };

                            var options = { method: 'PUT',
                                url: urlpath,
                                headers: 
                                { 
                                    'cache-control': 'no-cache',
                                    'content-type': 'application/json',
                                    authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                                },
                                body: reqBody,
                                json: true 
                            };

                            request(options, async function (error, response, body) {
                                if (error) {
                                    let res = {status:"error","message":error.error.message};
                                    callback(1,res);
                                    //throw new Error(error);
                                }else{
                                    //console.log(body);
                                    if (body.name) {
                                        let res = {status:"success","message":"Disk detached successfully"};
                                        callback(null,res);
                                    }else{
                                        let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                                        if(body.error && body.error.message){
                                            res.message = body.error.message;
                                        }
                                        callback(1,res);
                                        //throw new Error(error);
                                    }
                                }
                            });
                        }
                    }else{
                        let res = {status:"error","message":"The operation did not execute as expected. Please raise a ticket to support"};
                        if(vmBody.error && vmBody.error.message){
                            res.message = vmBody.error.message;
                        }
                        callback(1,res);
                        //throw new Error(error);
                    }
                }
            });
        }
    })
}

let getVMDetails = async (encId,callback)=> {
    vmId = base64.decode(encId);
    //console.log("vmId");
    //console.log(vmId);
    
    if(typeof(vmId)=='undefined' || vmId==''){
      var response={status:"error",message:'Invalid request'}
      return callback(1,response);
    }
    let vmDetailSql = `SELECT vm.*, 
        av.*,
        av.id as aws_vm_id,
        md5(vm.id) as mdvmid
        FROM c4_vm_details as vm
        inner join aws_vms as av on av.vm_detail_id = vm.id
        where vm.id = '${vmId}'`;
        ////console.log(sql);
    let vmDetail=await new Promise(function(resolve,reject){
        dbHandler.executeQuery(vmDetailSql,function(result){
            ////console.log(result);
            resolve(result)
        });
    })
    if(vmDetail.length == 0){
        var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
    }else{
        return awsModel.aws_authtoken(vmDetail[0].clientid,async function(error, token){
            // //console.log("token");
            //console.log(token);
            if(token.tokendata.length == 0){
                var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
                return callback(1,response);
            }else{
                return awsModel.getAwsVmDetail({ref_id:vmDetail[0].instanceId,clientid:vmDetail[0].clientid}, async function(error, dataFromAws){
//                	console.log(dataFromAws);
                    if(error){
                        var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
                        return callback(1,response);
                    }else{
                    	dbHandler.executeQuery(vmDetailSql,function(updatedVmDetail){
                    		if(updatedVmDetail.length == 0){
                    			var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
                                return callback(1,response);
                    		}else{
                    			let resData = {status:"success",message:'VM Details',vmdetails : {dataFromDB:updatedVmDetail[0],dataFromAws:dataFromAws},clientdetails:token.clientdata};
                                return callback(null,resData);
                    		}
                    	});
                    }
                });
            }
        })
    }
}
let validateVmName = async (reqObj,callback)=> {
    if(!reqObj.vmName){
        var response={success:0,status:"error",message:'Please provide vm name'}
        return callback(1,response);
    }
    if(!reqObj.clientid){
        var response={success:0,status:"error",message:'Please provide client id'}
        return callback(1,response);
    }
    if(!reqObj.regionName){
        var response={success:0,status:"error",message:'Please provide region name'}
        return callback(1,response);
    }
    var clientid=reqObj.clientid;
    var vm_name=reqObj.vmName;
    var regionName=reqObj.regionName;
    var sql=`select * from aws_vms where clientid=${clientid} and regionName='${regionName}' 
    and vm_name='${vm_name}' and vm_status!='Deleted'`;
    dbHandler.executeQuery(sql,function(result){
        if(result.length > 0){
            return callback(null,{success:0,message:"VM already exists"})
        }else{
            return callback(null,{success:1,message:"VM allowed for creation"})
        }
    })
}


function addAwsNetwork(reqObj,callback) {
    let formData = reqObj.body;
    ////console.log(formData);
    ////console.log(JSON.stringify(formData));
    var frmValues = {
        'subscription': formData.subscription,
        'location' : formData.location,
        'resource_group' : formData.resource_group,
        'name' : formData.name,
        'ip_address_prefix':formData.ip_address_prefix
      };
    frmValues.subscription = frmValues.subscription.split("_");
    frmValues.clientid = frmValues.subscription[0];
    frmValues.subscription_id = frmValues.subscription[1];

    frmValues.location = frmValues.location.split("_");
    frmValues.location_id = frmValues.location[0];
    frmValues.location_name = frmValues.location[1];

    //console.log("frmValues");
    //console.log(frmValues);

    return new Promise(async (resolve,reject) => {
        await new Promise(async function(resourcegroupsResolve, resourcegroupsReject){
            let resourcegroupsSql = `SELECT * from aws_networks
            where clientid = '${frmValues.clientid}' and subscriptionId = '${frmValues.subscription_id}' and location = '${frmValues.location_name}' and name = '${frmValues.name}'`;
            // //console.log("resourcegroupsSql");
            // //console.log(resourcegroupsSql);
            await dbHandler.executeQuery(resourcegroupsSql,async function(resourcegroupsInfo){
                // //console.log("resourcegroupsInfo");
                // //console.log(resourcegroupsInfo);
                if(resourcegroupsInfo.length == 0){
                    return awsModel.aws_authtoken(frmValues.clientid,async function(error, token){
                        // //console.log("token");
                        // //console.log(token);
                        if(token.tokendata.length == 0){
                            var response={message:'The operation did not execute as expected. Please raise a ticket to support'}
                            resourcegroupsReject(response);
                            reject(response);
                        }else{
                            urlpath=`https://management.aws.com/subscriptions/${frmValues.subscription_id}/resourceGroups/${frmValues.resource_group}/providers/Microsoft.Network/virtualNetworks/${frmValues.name}?api-version=2020-04-01`;
                            //console.log("urlpath");
                            //console.log(urlpath);
                            putParams = {
                                "properties": {
                                        "addressSpace": {
                                            "addressPrefixes": [`${frmValues.ip_address_prefix}`]
                                        }
                                    },
                                "location": frmValues.location_name
                                
                            };

                            var options = { method: 'PUT',
                                url: urlpath,
                                headers: 
                                { 
                                    'cache-control': 'no-cache',
                                    'content-type': 'application/json',
                                    authorization: token.tokendata.token_type+' '+token.tokendata.access_token
                                },
                                body: putParams,
                                json: true 
                            };

                            request(options, async function (error, response, body) {
                                if (error) {
                                    let res = {status:"error","message":error.error.message};
                                    callback(1,res);
                                    resourcegroupsReject(res);
                                    reject(res);
                                    //throw new Error(error);
                                }else{
                                    //console.log(body);

                                    if (body.properties && (body.properties.provisioningState == 'Updating' || body.properties.provisioningState == 'Succeeded')) {
                                    
                                        let insData = {
                                            location : frmValues.location_name,
                                            subscriptionId : frmValues.subscription_id,
                                            name : body.name,
                                            clientid:frmValues.clientid,
                                            resource_group:frmValues.resource_group
                                        };
                                        // //console.log("insData");
                                        // //console.log(insData);
                                        await dbHandler.insertIntoTable('aws_networks',insData,async function(error,vmdid){
                                            let text = {status:"success",message:"Virtual Network Created Successfully"};
                                            //console.log(text);
                                            callback(null,text);
                                            resourcegroupsResolve(text);
                                            resolve(text);
                                        });
                                    }else{
                                        let res = {status:"error","message":body.error.message};
                                        callback(1,res);
                                        resourcegroupsReject(res);
                                        reject(res);
                                        //throw new Error(error);
                                    }
                                }
                            });
                        }
                    })
                }else{
                    let res = {status:"error",message:'Resource Group already exists! Please try another one.'};
                    callback(1,res);
                    resourcegroupsReject(res);
                    reject(res);
                }
            });
        });
    });
}

  function getAllRegions(clientid) {
    return new Promise((resolve,reject) => {
       var sql=`SELECT * from c4_aws_client_regions WHERE clientid=${clientid} order by regionname asc`;
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
function getAllRigionBasedZones(clientid,regionName) {
    return new Promise((resolve,reject) => {
       var sql=`SELECT * from c4_aws_availability_zones WHERE clientid=${clientid} and regionName='${regionName}' order by zoneName asc`;
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

function addAwsDetailsToClient(reqObj,req,callback) {
    let formData = reqObj;
    ////console.log(formData);
    ////console.log(JSON.stringify(formData));
    if(!formData.clientid)
        callback(1,{status:"error",message:'clientid is missing'});
    if(!formData.aws_username)
        callback(1,{status:"error",message:'aws_username is missing'});
//    if(!formData.aws_ref_id)
//        callback(1,{status:"error",message:'aws_ref_id is missing'});
    if(!formData.aws_accesskey)
        callback(1,{status:"error",message:'aws_accesskey is missing'});
    if(!formData.aws_secretekey)
        callback(1,{status:"error",message:'aws_secretekey is missing'});

    var frmValues = {
        'clientid' : formData.clientid,
        'aws_username': formData.aws_username,
        'aws_ref_id': formData.aws_ref_id,
        'aws_accesskey' : formData.aws_accesskey,
        'aws_secretekey' : formData.aws_secretekey
      };

    console.log("frmValues");
    console.log(frmValues);
    return new Promise(async function(resolve, reject){
        awsModel.checkValidAwsAccessToken(frmValues,async function(error,result){
            if(error){
                var response={status:"error",message:'Invalid Credentials, please check.'}
                resolve(response);
                callback(1,response);
            }else{
                let updateData = {
            		aws_username : frmValues.aws_username,
                    updateddate : (new Date().getTime() / 1000),
                    is_aws_enabled : 1
                };
                console.log("updateData");
                console.log(updateData);
                await dbHandler.updateTableData('c4_clients',{'id':formData.clientid},updateData,async function(err,result){
                	var insertArr = {
                			clientid : frmValues.clientid,
                			accesstoken : frmValues.aws_accesskey,
                			secretekey : frmValues.aws_secretekey,
                			record_status : 1,
                	};
                	if(frmValues.aws_ref_id && frmValues.aws_ref_id != ''){
                		insertArr.updated_date = dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss");
                		console.log("insertArr");
                        console.log(insertArr);
                		await dbHandler.updateTableData('c4_aws_client_tokens',{'id':frmValues.aws_ref_id},insertArr,function(err,result){
//	                        resolve(result)
                			var response={status:"success",message:'Aws details updated successfully', aws_ref_id : frmValues.aws_ref_id}
                            resolve(response);
                            callback(null,response);
	                    })
                	}else{
                		insertArr.created_date = dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss");
                		console.log("insertArr");
                        console.log(insertArr);
	                	await dbHandler.insertIntoTable('c4_aws_client_tokens',insertArr,function(err,result){
	                		if(!err){
	                			frmValues.aws_ref_id = result;
	                		}
//	                        resolve(result)
	                		var response={status:"success",message:'Aws details updated successfully', aws_ref_id : frmValues.aws_ref_id}
	                        resolve(response);
	                        callback(null,response);
	                    })
                	}
                });
            }
        })
    });
}

async function getAWSBillingReport(req,callback) {

    let { start_date, end_date, set, limit } = req.query;
    let { clientid } = req;

    let checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
    let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
    if(!checkStatus.length) throw ({ type: "custom", message: `AWS is not enabled`, status: 400 });
    
    let offset = '';
    let values = {client_id: clientid, start_date: start_date, end_date: end_date};

    if(set && limit){
        offset = ` limit :offset, :limit`;
        values = {client_id: clientid, start_date: start_date, end_date: end_date, offset: parseInt((set - 1) * limit), limit: parseInt(limit) }
    }

    let sql = `select item_value, sum(blended_cost) as total_blended_cost,
                item_key,
                sum(blended_cost) as total_blended_cost,
                sum(usage_quantity) as total_usage_quantity
                from c4_aws_budget_usage as bu where bu.item_value != '' and bu.clientid = :client_id and bu.usage_date >= :start_date and bu.usage_date <= :end_date group by item_value order by item_value asc ${offset}`
    let sql_count = `select count(distinct item_value) as count from c4_aws_budget_usage as bu where bu.item_value != '' and bu.clientid = :client_id and bu.usage_date >= :start_date and bu.usage_date <= :end_date`

    let list = await dbHandler.executeQueryv2(sql, values);
    let count = await dbHandler.executeQueryv2(sql_count, {client_id: clientid, start_date: start_date, end_date: end_date });

    let response = {status:"success",message:'AWS billing report', data : list, count: count.length ? count[0]['count']: 0};
    return response;
      
}

async function getAWSCostForecast(req) {

    let { clientid } = req;
    let sql = `select * from c4_aws_client_tokens where clientid= :clientid and 
    record_status = 1 order by id asc limit 1`;
    let list = await dbHandler.executeQueryv2(sql, { clientid: clientid } );

    let costexplorer = new AWS.CostExplorer({ region: "us-east-1", accessKeyId: list[0]['accesstoken'], secretAccessKey: list[0]['secretekey'] });

    let curr_date = moment().format('YYYY-MM-DD');
    let curr_month_end = moment().clone().endOf('month').format('YYYY-MM-DD');

    let next_month_start = moment().clone().add(1, 'M').startOf('month').format('YYYY-MM-DD');
    let next_month_end = moment().clone().add(1, 'M').endOf('month').format('YYYY-MM-DD');
    let final_output;

    let curr_month = moment().clone().startOf('month').format('MMMM');
    let next_month = moment().clone().startOf('month').add(1, 'M').format('MMMM');

    try {
        final_output = await Promise.all([
            awsExternalServices.getCostForecastDetails(costexplorer, curr_date, curr_month_end, req.body),
            awsExternalServices.getCostForecastDetails(costexplorer, next_month_start, next_month_end, req.body)
        ]);
    }
    catch(error){
        throw ({ type: "custom", message: `insufficent history for provided dimensions to forecast cost`, status: 400 });
    }

    final_output[0]['month'] = curr_month;
    final_output[1]['month'] = next_month;

    let response = { output : final_output, count: 0 };
    return response;
}


async function getAWSUsageForecast(req) {

    let { clientid } = req;
    let sql = `select * from c4_aws_client_tokens where clientid= :clientid and 
    record_status = 1 order by id asc limit 1`;
    let list = await dbHandler.executeQueryv2(sql, { clientid: clientid } );

    let costexplorer = new AWS.CostExplorer({ region: "us-east-1", accessKeyId: list[0]['accesstoken'], secretAccessKey: list[0]['secretekey'] });

    let curr_date = moment().format('YYYY-MM-DD');
    let curr_month_end = moment().clone().endOf('month').format('YYYY-MM-DD');

    let next_month_start = moment().clone().add(1, 'M').startOf('month').format('YYYY-MM-DD');
    let next_month_end = moment().clone().add(1, 'M').endOf('month').format('YYYY-MM-DD');
    let final_output;

    let curr_month = moment().clone().startOf('month').format('MMMM');
    let next_month = moment().clone().startOf('month').add(1, 'M').format('MMMM');

    try {
        final_output = await Promise.all([
            awsExternalServices.getUsageForecastDetails(costexplorer, curr_date, curr_month_end, req.body),
            awsExternalServices.getUsageForecastDetails(costexplorer, next_month_start, next_month_end, req.body)
        ]);
    }
    catch(error){
        throw ({ type: "custom", message: `insufficent history for provided dimensions to forecast usage`, status: 400 });
    }

    final_output[0]['month'] = curr_month;
    final_output[1]['month'] = next_month;

    let response = { output : final_output, count: 0 };
    return response;
}


module.exports = {
    getAllVmlist,
    getDiskList,
    addDisk,
    attachDisk,
    detachDisk,
    getVMDetails,
    getVmDetailbyId,
    vmOperations,
    vmLogs,
    getAllNetwork,
    addAwsNetwork,
    getAllRegions,
    getAllRigionBasedZones,
    addAwsDetailsToClient,
    validateVmName,
    getAWSBillingReport,
    getAWSCostForecast,
    getAWSUsageForecast
};

