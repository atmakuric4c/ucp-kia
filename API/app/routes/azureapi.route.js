const azureModel = require('../../models/azure_model');
const azureFunction = require('../../app/models/azure.model');
var base64 = require('base-64');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');
const dbHandler= require('../../config/api_db_handler');

function init(router) {
    router.route('/azureapi/os_templates').post(getOsTemplates);
    router.route('/azureapi/vm_sizes').post(getVmCatalogs);
    router.route('/azureapi/vm_resize').post(resizeVm);
    router.route('/azureapi/virtual_networks').post(getVirtualNetwork);
    router.route('/azureapi/virtual_networks_locationwise').post(getVirtualNetworkLocationWise);
    router.route('/azureapi/address_ranges').post(getAddressRanges);
    router.route('/azureapi/public_ips').post(getIpAddressProfile);
    router.route('/azureapi/create_public_ip').post(createIpAddressProfile);
    router.route('/azureapi/nic_list').post(getAvailNetworkInterfaces);
    router.route('/azureapi/create_nic').post(createNetworkInterfaces);
    router.route('/azureapi/validate_computername').post(validateVmName);
    router.route('/azureapi/vm_list').post(getVMList);
    router.route('/azureapi/subscription_list').post(getSubscriptionList);
    router.route('/azureapi/resource_list').post(getResourceList);
    router.route('/azureapi/resource_search_list').post(getResourceSearchList);
    router.route('/azureapi/disk_list').post(getDiskList);
    router.route('/azureapi/delete_resource_group').post(deleteResourceGroup);
    router.route('/azureapi/delete_virtual_network').post(deleteVirtualNetwork);
    router.route('/azureapi/delete_virtual_machine').post(deleteVirtualMachine);
    router.route('/azureapi/delete_virtual_disk').post(deleteDisk);
    router.route('/azureapi/delete_network_interface').post(deleteNetworkInterface);
    router.route('/azureapi/delete_ip_address').post(deleteIpAddressProfile);
    router.route('/azureapi/delete_vm').post(deleteVm);
    router.route('/azureapi/create_availability_set').post(createAvailabilitySet);
    router.route('/azureapi/get_availability_sets').post(getAvailabilitySets);
  }

  function createAvailabilitySet(req,res) {
	  azureModel.createAvailabilitySet(req.body,function(err,result){
	    if (err) {
	      res.status(200).send(result)
	    } else {
	      res.status(200).send(result)
	    }
	  });
	}
  function deleteVm(req,res){
    let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)); 
    azureModel.deleteVm(reqBody,async function(err,result){
    	await new Promise(async function(innerResolve, innerReject){
			if(typeof reqBody.vm_ops_request_id != 'undefined' && reqBody.vm_ops_request_id != ''){
				console.log("err 111111111 ---- ", err);
				let updateData = {
					response_obj : JSON.stringify(result),
					approval_status : 3,
					updated_by : reqBody.request_processed_user_id,
					updated_date : (new Date().getTime() / 1000)
				};
				if(err){
					updateData.approval_status = 4;
				}
				await dbHandler.updateTableData('azure_vm_ops_requests',{id:reqBody.vm_ops_request_id},updateData,async function(err,result){
					console.log("err 22222 --- ", err);
					innerResolve("");
				});
			}else{
				innerResolve("");
			}
		});
      if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      }
    });
  }
function deleteIpAddressProfile(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureModel.deleteIpAddressProfile(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function getAvailabilitySets(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureModel.getAvailabilitySets(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function deleteNetworkInterface(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureModel.deleteNetworkInterface(reqBody,function(err,result){
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function deleteDisk(req,res){
  azureModel.deleteDisk(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function deleteVirtualMachine(req,res){
  azureModel.deleteVirtualMachine(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function deleteVirtualNetwork(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureModel.deleteVirtualNetwork(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function deleteResourceGroup(req,res){
  azureModel.deleteResourceGroup(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function getDiskList(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  //Restrict based on resource group and subscription
  Object.assign(reqBody, {
    subscriptions: req.subscriptions,
    resource_groups: req.resource_groups,
  });
  azureModel.getDiskList(reqBody, function (err, result) {
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query));
    } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query));
    }
  });
}
function getVirtualNetworkLocationWise(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureModel.getVirtualNetworkLocationWise(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function getResourceList(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  Object.assign(reqBody, {
    subscriptions: req.subscriptions,
    resource_groups: req.resource_groups,
  });
  azureModel.getResourceList(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function getResourceSearchList(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureModel.getResourceSearchList(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function getSubscriptionList(req,res){
  azureModel.getSubscriptionList(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function getVMList(req,res){
  azureModel.getVMList(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function getOsTemplates(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  console.log("reqBody");
  console.log(reqBody);
  azureFunction.getOsTemplates(reqBody,function(err,result){
	  console.log("result");
	  console.log(result);
	  console.log("req.query");
	  console.log(req.query);
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function resizeVm(req,res){
  azureModel.resizeVm(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function getVmCatalogs(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureModel.getVmCatalogs(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function getVirtualNetwork(req,res){
  azureModel.getVirtualNetwork(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function getIpAddressProfile(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureModel.getIpAddressProfile(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function createIpAddressProfile(req,res){
  azureModel.createIpAddressProfile(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}

function getAvailNetworkInterfaces(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureModel.getAvailNetworkInterfaces(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function createNetworkInterfaces(req,res){
  azureModel.createNetworkInterfaces(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function getAddressRanges(req,res){
  var result=[
    {
      addressPrefix:'10.0.0.0/16'
    },
    {
      addressPrefix:'10.0.0.0/24'
    }

  ]
    res.status(200).send(result)
}
function validateVmName(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureModel.validateVmName(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}

module.exports.init = init;