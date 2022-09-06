const gcpService = require('../services/gcp.service');
const model = require('../models/gcp.model');
const gcp_model = require('../../models/gcp_model');
var base64 = require('base-64');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');
const {  errorResponse } = require('../../common/error-response');

function init(router) {
    router.route('/gcp/get_gcp_project_list').post(getGcpProjectList);
    router.route('/gcp/get_gcp_project_details').post(getGcpProjectDetails);
    router.route('/gcp/get_gcp_images_list').post(getGcpImagesList);
    router.route('/gcp/getVMDetails/:id').get(getVMDetails);
    router.route('/gcp/get_gcp_zones_list').post(getGcpZonesList);
    router.route('/gcp/get_gcp_regions_list').post(getGcpRegionsList);
    router.route('/gcp/getGcpNetworkslist').post(getGcpNetworkslist);
    router.route('/gcp/getGcpSubNetworklist').post(getGcpSubNetworklist);
    router.route('/gcp/get_gcp_machinetype_list').post(getGcpMachineTypesList);
    router.route('/gcp/vm_detail').post(getVmDetailbyId);
    router.route('/gcp/vm_list').post(getAllVmlist);
    router.route('/gcp/create_vm').post(createVm);
    router.route('/gcp/vm_operations').post(vmOperations);
    router.route('/gcp/vm_log').post(vmLogs);
    router.route('/gcp/delete_vm').post(deleteVm);
    router.route('/gcp/disk_list').post(diskList);
    router.route('/gcp/create_disk').post(createDisk);
    router.route('/gcp/delete_disk').post(deleteDisk);
    router.route('/gcp/available_disk').post(availableDisk);   
    router.route('/gcp/attach_disk').post(attachDisk);  
    router.route('/gcp/detach_disk').post(detachDisk);  
    router.route('/gcp/createNetwork').post(createNetwork);  
    router.route('/gcp/createSubnet').post(createSubnet);  
    router.route('/gcp/validateVmName').post(validateVmName);          
    router.route('/gcp/getNetworkList').post(getNetworkList);          
    router.route('/gcp/getSubnetList').post(getSubnetList); 
    router.route('/gcp/getFirewallList').post(getFirewallList);  
    router.route('/gcp/createFirewall').post(createFirewall);  
    router.route('/gcp/updateFirewall').put(updateFirewall);  
    router.route('/gcp/deleteFirewall').delete(deleteFirewall);          
    router.route('/gcp/deleteNetwork').delete(deleteNetwork);          
    router.route('/gcp/deleteSubnet').delete(deleteSubnet);      
    
    router.route('/gcp/billingReport').get(getGCPBillingReport); 
}
function deleteSubnet(req,res){
  gcp_model.deleteSubnet(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function deleteNetwork(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  gcp_model.deleteNetwork(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function createFirewall(req,res){
  gcp_model.createFirewall(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function updateFirewall(req,res){
  gcp_model.updateFirewall(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function deleteFirewall(req,res){
  gcp_model.deleteFirewall(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function getSubnetList(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  gcp_model.getSubnetList(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function getNetworkList(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  gcp_model.getNetworkList(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function createFirewall(req,res){
  gcp_model.createFirewall(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function getFirewallList(req,res){
  gcp_model.getFirewallList(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function createSubnet(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  gcp_model.createSubnet(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function createNetwork(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  gcp_model.createNetwork(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function detachDisk(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  gcp_model.detachDisk(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function attachDisk(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  gcp_model.attachDisk(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function availableDisk(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  gcp_model.availableDisk(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function deleteDisk(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  gcp_model.deleteDisk(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function createDisk(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  gcp_model.createDisk(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function diskList(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  gcp_model.diskList(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function deleteVm(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  gcp_model.deleteVm(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function vmLogs(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  let vmId = reqBody.vmid; 
  let clientid = reqBody.clientid;  
  gcpService.vmLogs(clientid,vmId).then((data) => {
      res.send(ucpEncryptDecrypt.ucpEncrypt(data));
    }).catch((err) => {
      //mail.mail(err);
      res.send(ucpEncryptDecrypt.ucpEncrypt(err));
    });
}
function vmOperations(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  gcpService.vmOperations(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function validateVmName(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  gcpService.validateVmName(req.body,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}

function createVm(req,res) {
  gcp_model.createVm(req.body,function(err,result) {
    if (err) {
      res.status(200).send(result)
      } else {
      res.status(200).send(result)
      }
  })
}
function getAllVmlist(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  if(!reqBody.clientid){
    return res.status(200).send({success:0,message:"Input params missing"})
  }
  let clientid = base64.decode(reqBody.clientid);
  model.getAllVmlist(clientid,function(err,result) {
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
      }
  })
}
function getVmDetailbyId(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  if(!reqBody.vm_id || !reqBody.clientid){
    return res.status(400).send({success:0,message:"Input params missing"})
  }
  let vmId = base64.decode(reqBody.vm_id); 
  let clientid = base64.decode(reqBody.clientid);  
  gcp_model.getVmDetailbyId(clientid,vmId,function(err,result) {
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
      }
  })
}
function getGcpMachineTypesList(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
	gcpService.getGcpMachineTypesList(reqBody,function(err,result){
    if (err) {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function getGcpProjectList(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
	gcp_model.getGcpProjectList(reqBody,function(err,result){
    if (err) {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}

function getGcpProjectDetails(req,res){
	gcpService.getGcpProjectDetails(req.body,function(err,result){
    if (err) {
    	res.status(200).send(result)
    } else {
    	res.status(200).send(result)
    }
  });
}
function getVMDetails(req,res) {
  let encId = req.params.id; 
  gcpService.getVMDetails(encId,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function getGcpSubNetworklist(req,res) {
  model.getGcpSubNetworklist(req.body,function(err,result) {
    if (err) {
      res.status(200).send(result)
      } else {
      res.status(200).send(result)
      }
  })
}
function getGcpNetworkslist(req,res) {
  model.getGcpNetworkslist(req.body,function(err,result) {
    if (err) {
      res.status(200).send(result)
      } else {
      res.status(200).send(result)
      }
  })
}
function getGcpImagesList(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
	gcpService.getGcpImagesList(reqBody,function(err,result){
    if (err) {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}

function getGcpZonesList(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
	gcpService.getGcpZonesList(reqBody,function(err,result){
    if (err) {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}

function getGcpRegionsList(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
	gcpService.getGcpRegionsList(reqBody,function(err,result){
    if (err) {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    } else {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}

async function getGCPBillingReport(req,res) {
  try{

    let { start_date, end_date } = req.query;

    if(!start_date)
    return res.status(400).send({status:"error",message:'start date is missing'});

    if(!end_date)
    return res.status(400).send({status:"error",message:'end date is missing'});

    let result = await gcpService.getGCPBillingReport(req);
    res.status(200).send(result);
  }
  catch(error){
    errorResponse(res, error);
  }

}

module.exports.init = init;