const awsService = require('../services/aws.service');
const aws_model = require('../../models/aws_model');
var base64 = require('base-64');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');
const { errorResponse } = require('../../common/error-response');

function init(router) {
    router.route('/aws/listdata/:id').get(getAllVmlist);
    router.route('/aws/networks/:id').get(getAllNetwork);
    router.route('/aws/addAwsNetwork').post(addAwsNetwork);
    router.route('/aws/getVMDetails/:id').get(getVMDetails);
    router.route('/aws/getVMDetailByName/:sid/:name').get(getVMDetailByName);
    router.route('/aws/getDiskList').post(getDiskList);
    router.route('/aws/addDisk').post(addDisk);
    router.route('/aws/attachDisk').post(attachDisk);
    router.route('/aws/detachDisk').post(detachDisk);
    router.route('/aws/vm_detail').post(getVmDetailbyId);
    router.route('/aws/add_Vm').post(addVm);
    router.route('/aws/vm_operations').post(vmOperations);
    router.route('/aws/get_aws_regions').post(getAwsRegions);
    router.route('/aws/get_aws_images').post(getAwsImages);
    router.route('/aws/get_aws_availability_zones').post(getAwsAvailabilityZones);
    router.route('/aws/get_aws_instance_types').post(getAwsInstanceTypes);
    router.route('/aws/vm_resize').post(vmResize);
    router.route('/aws/vm_log').post(vmLogs);
    router.route('/aws/getAllRegions/:id').get(getAllRegions);
    router.route('/aws/getAllRigionBasedZones').post(getAllRigionBasedZones);
    router.route('/aws/validateVmName').post(validateVmName);
    ////////
    router.route('/aws/getVpcList').post(getVpcList);
    router.route('/aws/createVpc').post(createVpc);
    router.route('/aws/deleteVpc').post(deleteVpc);
    router.route('/aws/getSubnetList').post(getSubnetList);
    router.route('/aws/get_subnet_list').post(getSubnetList);
    router.route('/aws/createSubnet').post(createSubnet);
    router.route('/aws/deleteSubnet').post(deleteSubnet);
    router.route('/aws/getNetworkInterfaceList').post(getNetworkInterfaceList);
    router.route('/aws/createNetworkInterface').post(createNetworkInterface);
    router.route('/aws/deleteNetworkInterface').post(deleteNetworkInterface);
    router.route('/aws/attachNetworkInterface').post(attachNetworkInterface);
    router.route('/aws/getVolumeList').post(getVolumeList);
    router.route('/aws/availableVolumeList').post(availableVolumeList);
    router.route('/aws/createVolume').post(createVolume);
    router.route('/aws/modifyVolume').post(modifyVolume);
    router.route('/aws/detachVolume').post(detachVolume);
    router.route('/aws/deleteVolume').post(deleteVolume);
    router.route('/aws/attachVolume').post(attachVolume);
    router.route('/aws/addAwsDetailsToClient').post(addAwsDetailsToClient);
    router.route('/aws/delete_vm').post(deleteVm);
    router.route('/aws/userList').post(userList);
    router.route('/aws/createUser').post(createUser);
    router.route('/aws/updateUser').post(updateUser);
    router.route('/aws/userGroups').post(userGroups);
    router.route('/aws/createGroup').post(createGroup);
    router.route('/aws/updateGroup').post(updateGroup);
    router.route('/aws/deleteGroup').post(deleteGroup);
    router.route('/aws/addUserToGroup').post(addUserToGroup);
    router.route('/aws/policyList').post(policyList);
    router.route('/aws/createPolicy').post(createPolicy);
    router.route('/aws/deletePolicy').post(deletePolicy);
    router.route('/aws/attachUserPolicy').post(attachUserPolicy); 
    router.route('/aws/detachUserPolicy').post(detachUserPolicy);  
    router.route('/aws/listGroupPolicies').post(listGroupPolicies);  
    router.route('/aws/deleteGroupPolicy').post(deleteGroupPolicy);  
    router.route('/aws/billingReport').get(getAWSBillingReport); 
    
    router.route('/aws/costForecast').get(getAWSCostForecast); 
    router.route('/aws/usageForecast').get(getAWSUsageForecast);
        
}

function getAwsInstanceTypes(req,res){
  var reqBody=JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.getAwsInstanceTypes(reqBody,function(err,result){
    if (err) {
      res.status(400).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function getAwsRegions(req,res){
  var reqBody=JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.getAwsRegions(reqBody,function(err,result){
    if (err) {
      res.status(400).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function getAwsImages(req,res){
  var reqBody=JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.getAwsImages(reqBody,function(err,result){
    if (err) {
      res.status(400).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}

function getAwsAvailabilityZones(req,res){
  var reqBody=JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.getAwsAvailabilityZones(reqBody,function(err,result){
    if (err) {
      res.status(400).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}

function deletePolicy(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body)); 
  aws_model.listGroupPolicies(reqBody,function(err,result){
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function listGroupPolicies(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body)); 
  aws_model.listGroupPolicies(reqBody,function(err,result){
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function deleteGroupPolicy(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body)); 
  aws_model.deleteGroupPolicy(reqBody,function(err,result){
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function detachUserPolicy(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body)); 
  aws_model.detachUserPolicy(reqBody,function(err,result){
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function attachUserPolicy(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body)); 
  aws_model.attachUserPolicy(reqBody,function(err,result){
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function createPolicy(req,res){
  let reqBody = req.body; 
  aws_model.createPolicy(reqBody,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function policyList(req,res){
  let reqBody = req.body; 
  aws_model.policyList(reqBody,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function addUserToGroup(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body)); 
  aws_model.addUserToGroup(reqBody,function(err,result){
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function userGroups(req,res){
  let reqBody = req.body; 
  aws_model.userGroups(reqBody,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function createGroup(req,res){
  let reqBody = req.body
  aws_model.createGroup(reqBody,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function deleteGroup(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.deleteGroup(reqBody,function(err,result){
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function updateGroup(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.updateGroup(reqBody,function(err,result){
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function updateUser(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.updateUser(reqBody,function(err,result){
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function createUser(req,res){
  let reqBody = req.body;
  aws_model.createUser(reqBody,function(err,result){
    if (err) {
      res.status(200).send(result)
      } else {
      res.status(200).send(result)
      }
  });
}
function userList(req,res){
  let reqBody = req.body; 
  aws_model.userList(reqBody,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function availableVolumeList(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.availableVolumeList(reqBody,function(err,result){
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
      }
  });
}
function deleteVm(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.deleteVm(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}

function attachVolume(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.attachVolume(reqBody,function(err,result){
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
      }
  });
}
function deleteVolume(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.deleteVolume(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function detachVolume(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.detachVolume(reqBody,function(err,result){
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
      }
  });
}
function modifyVolume(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.modifyVolume(reqBody,function(err,result){
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
      }
  });
}
function createVolume(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.createVolume(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function getVolumeList(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.getVolumeList(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function validateVmName(req,res){
   let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  awsService.validateVmName(reqBody,function(err,result){
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
      }
  });
}
function getVpcList(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.getVpcList(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function createVpc(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.createVpc(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function deleteVpc(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.deleteVpc(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function getSubnetList(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.getSubnetList(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function createSubnet(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.createSubnet(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function deleteSubnet(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.deleteSubnet(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function getNetworkInterfaceList(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.getNetworkInterfaceList(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function createNetworkInterface(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.createNetworkInterface(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function deleteNetworkInterface(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  aws_model.deleteNetworkInterface(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function attachNetworkInterface(req,res){
  aws_model.attachNetworkInterface(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function getAllRegions(req,res) {
  let clientid = req.params.id; 
  awsService.getAllRegions(clientid).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}
function getAllRigionBasedZones(req,res){
  awsService.getAllRigionBasedZones(req.body).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}
function getAllVmlist(req,res) {
  let clientid=base64.decode(req.params.id);
//  clientid = ucpEncryptDecrypt.ucpDecryptForUri(clientid); 
    awsService.getAllVmlist(clientid).then((data) => {
      res.json(ucpEncryptDecrypt.ucpEncrypt(data));
    }).catch((err) => {
      res.json(ucpEncryptDecrypt.ucpEncrypt(err));
    });
}

function getAllNetwork(req,res) {
  let clientid = base64.decode(req.params.id);
//  clientid = ucpEncryptDecrypt.ucpDecryptForUri(clientid);
  awsService.getAllNetwork(clientid).then((data) => {
    res.json(ucpEncryptDecrypt.ucpEncrypt(data));
    }).catch((err) => {
      res.json(ucpEncryptDecrypt.ucpEncrypt(err));
    });
}

function addAwsNetwork(req,res){
  awsService.addAwsNetwork(req,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}

function getVMDetails(req,res) {
  let encId = req.params.id; 
  awsService.getVMDetails(encId,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function getVMDetailByName(req,res) {
  awsService.getVMDetailByName(req.params,function(err,result){
    if (err) {
    res.status(400).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}

function getDiskList(req,res) {
  awsService.getDiskList(req,function(err,result){
    if (err) {
    res.status(400).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}

function addDisk(req,res) {
  awsService.addDisk(req,function(err,result){
    if (err) {
    res.status(400).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}

function attachDisk(req,res) {
  awsService.attachDisk(req,function(err,result){
    if (err) {
    res.status(400).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}

function detachDisk(req,res) {
  awsService.detachDisk(req,function(err,result){
    if (err) {
    res.status(400).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}

function vmOperations(req,res) {
  var reqBody=JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  awsService.vmOperations(reqBody,function(err,result){
    if (err) {
      res.status(400).send(ucpEncryptDecrypt.ucpEncrypt({message:result}))
    } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}

function vmResize(req,res) {
  awsService.vmResize(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}

function addVm(req,res){
  awsService.addVm(req,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}

function getVmDetailbyId(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body)); 
  //console.log(reqBody)
  let vmId = base64.decode(reqBody.vm_id); 
  let clientid = base64.decode(reqBody.clientid); 
  // if(!req.body.vm_id || !req.body.clientid){
  //   return res.status(400).send({success:0,message:"Input params missing"})
  // } 
  console.log(vmId+'--'+clientid)
  awsService.getVmDetailbyId(clientid,vmId,function(err,result) {
    if (err) {
      res.status(400).send(ucpEncryptDecrypt.ucpEncrypt(result))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
      }
  })
}

function vmLogs(req,res) {
  let vmId = req.body.vmid; 
  let clientid = req.body.clientid;  
  awsService.vmLogs(clientid,vmId).then((data) => {
      res.send(data);
    }).catch((err) => {
      //mail.mail(err);
      res.send(err);
    });
}

function addScheduler(req,res){
  awsService.addScheduler(req,function(err,result){
    if (err) {
    res.status(400).send({message:result,success:false})
    } else {
    res.status(200).send(result)
    }
  });
}

function getVmLogsbyId(req,res) {
  let vmId = req.params;  
  awsService.getVmLogsbyId(vmId).then((data) => {
      res.send(data);
    }).catch((err) => {
      //mail.mail(err);
      res.send(err);
    });
}

function getScheduleList(req,res) {
  let vdc_id = req.params.id; 
  awsService.getScheduleList(vdc_id).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}
function getVmNotScheduleList(req,res) {
  let vdc_id = req.params.id; 
  awsService.getVmNotScheduleList(vdc_id).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}

function getVmDiskInfobyId(req,res) {
  let vmId = req.params;  
  awsService.getVmDiskInfobyId(vmId).then((data) => {
      res.send(data);
    }).catch((err) => {
      //mail.mail(err);
      res.send(err);
    });
}
function updateVmCreateDate(req,res){
  awsService.updateVmCreateDate(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function getAllVmGrouplist(req,res) {
  awsService.getAllVmGrouplist().then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}
function addVmGroup(req,res) {
  awsService.addVmGroup(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function editVmGroup(req,res) {
  awsService.editVmGroup(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function editVmGroupMapping(req,res) {
  awsService.editVmGroupMapping(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}

let addAwsDetailsToClient = async (req,res)=>{
	try{
		ucpEncryptDecryptParser = await JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
//		console.log("ucpEncryptDecryptParser11111111112222222222");
//		console.log(ucpEncryptDecryptParser);
	}catch{
		return res.status(500).json(ucpEncryptDecrypt.ucpEncrypt({status:"error", success:0, message:"Invalid request"}, req.query));
    }
  awsService.addAwsDetailsToClient(ucpEncryptDecryptParser, req,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}

async function getAWSBillingReport(req,res) {
  try{

    let { start_date, end_date } = req.query;

    if(!start_date)
    return res.status(400).send({status:"error",message:'start date is missing'});

    if(!end_date)
    return res.status(400).send({status:"error",message:'end date is missing'});

    let result = await awsService.getAWSBillingReport(req);
    res.status(200).send(result);
  }
  catch(error){
    errorResponse(res, error);
  }

}

async function getAWSCostForecast(req, res) {
  try{
  
    let result = await awsService.getAWSCostForecast(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}


async function getAWSUsageForecast(req, res) {
  try{
  
    let result = await awsService.getAWSUsageForecast(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }

}

module.exports.init = init;