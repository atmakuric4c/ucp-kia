const azureService = require('../services/azure.service');
const appAzureModel = require('../models/azure.model');
const azureModel = require('../models/azure.model');
var base64 = require('base-64');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');
const {  errorResponse } = require('../../common/error-response');
const dbHandler= require('../../config/api_db_handler');
const azureCronModel = require('../../models/azure_cron_model');

function init(router) {
    router.route('/azure/listdata').post(getAllVmlist);
    router.route('/azure/networks/:id').get(getAllNetwork);
    router.route('/azure/getCmdbImpacts').get(getCmdbImpacts);
    router.route('/azure/getCmdbServices').get(getCmdbServices);
    router.route('/azure/getCmdbCountries').get(getCmdbCountries);
    router.route('/azure/getCmdbRegions').get(getCmdbRegions);
    router.route('/azure/getHostNames').post(getHostNames);
    router.route('/azure/addAzureNetwork').post(addAzureNetwork);
    router.route('/azure/addAzureDetailsToClient').post(addAzureDetailsToClient);
    router.route('/azure/create_availability_set').post(createAvailabilitySet);
    router.route('/azure/get_resrouce_group_list').post(get_resrouce_group_list);
    router.route('/azure/getAzureResourceGroups').post(getAzureResourceGroups);
    router.route('/azure/getAllAzureResourceGroups').post(getAllAzureResourceGroups);
    router.route('/azure/getAzureDropdownData').post(getAzureDropdownData);
    router.route('/azure/decommissionVm').post(decommissionVm);
    router.route('/azure/updateVmRequestThroughJenkins').post(updateVmRequestThroughJenkins);
    router.route('/azure/getVMDetails/:id').get(getVMDetails);
    router.route('/azure/syncSingleVmDetails').get(syncSingleVmDetails);
//    router.route('/azure/getVMDetailByName/:sid/:name/:user_id').get(getVMDetailByName);
    router.route('/azure/getVMDetailByName').post(getVMDetailByName);
    router.route('/azure/addAzureResourceGroups').post(addAzureResourceGroups);
    router.route('/azure/checkStorageAndSizeCompatability').post(checkStorageAndSizeCompatability);
    router.route('/azure/generateUniqueVmName').post(generateUniqueVmName);
    router.route('/azure/getDiskList').post(getDiskList);
    router.route('/azure/addDisk').post(addDisk);
    router.route('/azure/attachDisk').post(attachDisk);
    router.route('/azure/detachDisk').post(detachDisk);
    router.route('/azure/vm_detail').post(getVmDetailbyId);
    router.route('/azure/add_Vm').post(addVm);
    router.route('/azure/vm_operations').post(vmOperations);
    router.route('/azure/vm_resize').post(vmResize);
    router.route('/azure/vm_log').post(vmLogs);
    router.route('/azure/veeam_operations').post(veeamOperations);
    router.route('/azure/azureResourceGroupBySubscription').post(azureResourceGroupBySubscription);
    router.route('/azure/billingReport').get(getAzureBillingReport); 
    router.route('/azure/galleryList').post(galleryList);
    router.route('/azure/galleryImagesList').post(galleryImagesList);
    router.route('/azure/galleryImageVersionList').post(galleryImageVersionList);
    router.route('/azure/getVmBackupVaultNames').post(getVmBackupVaultNames);
    router.route('/azure/getVmBackupVaultPolicies').post(getVmBackupVaultPolicies);
    router.route('/azure/extendDisk').post(extendDisk);
    router.route('/azure/saveResourceGroupBuUsers').post(saveResourceGroupBuUsers);
    router.route('/azure/getGalleryImageVersions').post(getGalleryImageVersions);
    router.route('/azure/getGalleryOsMiddleware').post(getGalleryOsMiddleware);
    router.route('/azure/getStorageAccountNames').post(getStorageAccountNames);
    router.route('/azure/getUserVmAccessRequests').post(getUserVmAccessRequests);
    router.route('/azure/saveUserVmAccessRequests').post(saveUserVmAccessRequests);
    router.route('/azure/updateUserVmAccessRequests').post(updateUserVmAccessRequests);
    router.route('/azure/revokeUserVmAccessRequest').post(revokeUserVmAccessRequest);
    router.route('/azure/grantVmAccessToUser').post(grantVmAccessToUser);
    router.route('/azure/updateUserVmAccessRequestsStatus').post(updateUserVmAccessRequestsStatus);
    router.route('/azure/getStorageSkus').post(getStorageSkus);
    router.route('/azure/saveVmOpsRequests').post(saveVmOpsRequests);
    router.route('/azure/saveUserOnboarding').post(saveUserOnboarding);
    router.route('/azure/removeAdUser').post(removeAdUser);
    router.route('/azure/getVmSupportedSizes').post(getVmSupportedSizes);
    router.route('/azure/rerunVmOatChecklist').post(rerunVmOatChecklist);
    router.route('/azure/get-oat-data').post(getOatData);
    router.route('/azure/get-oat-list-data').post(getOatListData);
    router.route('/azure/get-oat-list').post(getOatList);
    router.route('/azure/getAdGroups').get(getAdGroups);
    router.route('/azure/get-cyberark-users').post(getCyberArkUsers);
    router.route('/azure/getAllUsersList').post(getAllUsersList);
    router.route('/azure/get-cyberark-permissions').get(getCyberArkPermissions);
    router.route('/azure/get-cyberark-apps').get(getCyberArkApplication);
    router.route('/azure/create-cyberark-safe').post(createCyberArkSafe);
    router.route('/azure/add-cyberark-safe-member').post(addCyberArkSafeMember);
    router.route('/azure/get-cyberark-list').post(getCyberarkList);
    router.route('/azure/get-cyberark-users-list').post(getCyberarkUserList);
    router.route('/azure/manage-vm-lock').post(manageVMLock);
    router.route('/azure/getWindowsVmUserAccessList').post(getWindowsVmUserAccessList);
}

function getUserVmAccessRequests(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)); 
    Object.assign(reqBody, {
      my_reportees: req.my_reportees,
      resource_groups: req.resource_groups,
      subscription_resource_group_combo: req.subscription_resource_group_combo,
      is_super_admin : req.is_super_admin
    })
	  azureService.getUserVmAccessRequests(reqBody).then((data) => {
	    res.send(ucpEncryptDecrypt.ucpEncrypt(data, req.query));
	  }).catch((err) => {
	    // mail.mail(err);
	    res.send(ucpEncryptDecrypt.ucpEncrypt(err, req.query));
	  });
}

function getWindowsVmUserAccessList(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)); 
    Object.assign(reqBody, {
      my_reportees: req.my_reportees,
      resource_groups: req.resource_groups,
      subscription_resource_group_combo: req.subscription_resource_group_combo,
      is_super_admin : req.is_super_admin
    })
	  azureService.getWindowsVmUserAccessList(reqBody).then((data) => {
	    res.send(ucpEncryptDecrypt.ucpEncrypt(data, req.query));
	  }).catch((err) => {
	    // mail.mail(err);
	    res.send(ucpEncryptDecrypt.ucpEncrypt(err, req.query));
	  });
}
function saveUserVmAccessRequests(req,res){
    let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
    azureCronModel.saveUserVmAccessRequests(reqBody,function(err,result){
      if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      }
    });
}
function updateUserVmAccessRequests(req,res){
    let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
    azureService.updateUserVmAccessRequests(reqBody, async function(err,result){
    	await new Promise(async function(innerResolve, innerReject){
			if(typeof reqBody.request_id != 'undefined' && reqBody.request_id != ''){
//				console.log("err 111111111 ---- ", err);
				let updateData = {
					response_obj : JSON.stringify(result),
				};
				await dbHandler.updateTableData('azure_user_vm_access_requests',{id:reqBody.request_id},updateData,async function(err,result){
//					console.log("err 22222 --- ", err);
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
function revokeUserVmAccessRequest(req,res){
    let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
    azureService.revokeUserVmAccessRequest(reqBody, async function(err,result){
    	await new Promise(async function(innerResolve, innerReject){
			if(typeof reqBody.request_id != 'undefined' && reqBody.request_id != ''){
//				console.log("err 111111111 ---- ", err);
				let updateData = {
					revoke_response_obj : JSON.stringify(result),
				};
				if(!err){
					updateData.is_revoked = 1;
					updateData.revoke_user_id = reqBody.user_id;
				}
				await dbHandler.updateTableData('azure_user_vm_access_requests',{id:reqBody.request_id},updateData,async function(err,result){
//					console.log("err 22222 --- ", err);
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
function grantVmAccessToUser(req,res){
    let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
    console.log("reqBody ---- ", reqBody);
//    return res.status(200).send(ucpEncryptDecrypt.ucpEncrypt([], req.query));
    azureService.grantVmAccessToUser(reqBody,async function(err,result){
    	await new Promise(async function(innerResolve, innerReject){
			if(typeof reqBody.user_vm_access_request_id != 'undefined' && reqBody.user_vm_access_request_id != ''){
//				console.log("err 111111111 ---- ", err);
				let updateData = {
					response_obj : JSON.stringify(result),
					approval_status : 3,
					safeName :((result.data && result.data.finalSafeName)?result.data.finalSafeName:""),
					updated_by : reqBody.request_processed_user_id,
					updated_date : (new Date().getTime() / 1000),
					ref_id : ((result.ref_id)?result.ref_id:0)
				};
				if(err){
					updateData.approval_status = 4;
				}
				await dbHandler.updateTableData('azure_user_vm_access_requests',{id:reqBody.user_vm_access_request_id},updateData,async function(err,result){
//					console.log("err 22222 --- ", err);
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
function updateUserVmAccessRequestsStatus(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));  
  appAzureModel.updateUserVmAccessRequestsStatus(reqBody,function(err,result){
    if (err) {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function saveVmOpsRequests(req,res){
    let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
    reqBody= {...reqBody, userDetails: req.userDetails};
    azureService.saveVmOpsRequests(reqBody,function(err,result){
      if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      }
    });
}
function saveUserOnboarding(req,res){
    let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
    azureService.saveUserOnboarding(reqBody,function(err,result){
      if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      }
    });
}
function removeAdUser(req,res){
    let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
    azureService.removeAdUser(reqBody,function(err,result){
      if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      }
    });
}
function getVmSupportedSizes(req,res){
    let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
    azureService.getVmSupportedSizes(reqBody,function(err,result){
      if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      }
    });
}
function rerunVmOatChecklist(req,res){
    let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
    azureService.rerunVmOatChecklist(reqBody,function(err,result){
      if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      }
    });
}
function getStorageSkus(req,res){
    let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
    console.log(reqBody);
    azureService.getStorageSkus(reqBody,function(err,result){
      if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      }
    });
}
function getGalleryImageVersions(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureModel.getGalleryImageVersions(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function getGalleryOsMiddleware(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureModel.getGalleryOsMiddleware(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function getStorageAccountNames(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureModel.getStorageAccountNames(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function saveResourceGroupBuUsers(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureModel.saveResourceGroupBuUsers(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function getAllVmlist(req,res) {
    let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
    Object.assign(reqBody, {
      subscriptions: req.subscriptions,
      resource_groups: req.resource_groups,
      subscription_resource_group_combo: req.subscription_resource_group_combo,
      is_super_admin : req.is_super_admin
      });
    console.log(reqBody);
    azureService.getAllVmlist(reqBody,function(err,result){
      if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      } else {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
      }
    });
}
function getAllNetwork(req,res) { 
	let clientid = base64.decode(req.params.id);
//  clientid = ucpEncryptDecrypt.ucpDecryptForUri(clientid, req.query);
  azureService.getAllNetwork(clientid).then((data) => {
    res.send(ucpEncryptDecrypt.ucpEncrypt(data, req.query));
  }).catch((err) => {      
    res.send(ucpEncryptDecrypt.ucpEncrypt(err, req.query));
  });
}
function getHostNames(req,res) { 
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  appAzureModel.getHostNames(reqBody,function(err,result){
//	  console.log("err1 ------------------------ ",err);
//	  console.log("result1 ------------------------ ",result);
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function getCmdbCountries(req,res) { 
  azureService.getCmdbCountries(req.query,function(err,result){
	  if (err) {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	  } else {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	  }
  });
}
function getCmdbRegions(req,res) { 
  azureService.getCmdbRegions(req.query,function(err,result){
	  if (err) {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	  } else {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	  }
  });
}
function getCmdbImpacts(req,res) { 
  azureService.getCmdbImpacts(req.query,function(err,result){
	  if (err) {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	  } else {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	  }
  });
}
function getCmdbServices(req,res) { 
  azureService.getCmdbServices(req.query,function(err,result){
	  if (err) {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	  } else {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	  }
  });
}
function addAzureNetwork(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  var bodydata={body:reqBody}
  azureService.addAzureNetwork(bodydata,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}

let addAzureDetailsToClient = async (req,res)=>{
	try{
		ucpEncryptDecryptParser = await JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
//		console.log("ucpEncryptDecryptParser1111111111");
//		console.log(ucpEncryptDecryptParser);
	}catch{
		return res.status(500).json(ucpEncryptDecrypt.ucpEncrypt({status:"error", success:0, message:"Invalid request"}, req.query));
    }
  azureService.addAzureDetailsToClient(ucpEncryptDecryptParser, req,function(err,result){
    if (err) {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query));
    } else {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query));
    }
  });
}
function createAvailabilitySet(req,res){
  azureService.createAvailabilitySet(req.body,function(err,result){
    if (err) {
    res.status(200).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}

function getAzureResourceGroups(req,res) {
	  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)); 
//  let clientid=base64.decode(req.params.id);
//  clientid = ucpEncryptDecrypt.ucpDecryptForUri(clientid, req.query);
//Assigned subscriptions & resource groups
Object.assign(reqBody, {
  subscriptions: req.subscriptions,
  resource_groups: req.resource_groups,
  subscription_resource_group_combo: req.subscription_resource_group_combo,
  is_super_admin : req.is_super_admin
  });
  azureService.getAzureResourceGroups(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}

function decommissionVm(req,res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)); 
	//let clientid=base64.decode(req.params.id);
	//clientid = ucpEncryptDecrypt.ucpDecryptForUri(clientid, req.query);
	azureService.decommissionVm(reqBody,async function(err,result){
		await new Promise(async function(innerResolve, innerReject){
			if(typeof reqBody.vm_ops_request_id != 'undefined' && reqBody.vm_ops_request_id != ''){
				console.log("err 111111111 ---- ", err);
				let updateData = {
					response_obj : JSON.stringify(result),
					approval_status : 3,
					updated_by : reqBody.request_processed_user_id,
					updated_date : (new Date().getTime() / 1000),
					ref_id : ((result.ref_id)?result.ref_id:0)
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
		
		var insertArr={
            vmid:reqBody.vmId,
            type:3,
            description:'VM Decommission request Completed',
            createddate:parseInt(new Date()/1000),
            createdby : reqBody.request_processed_user_id,
            clientid : reqBody.clientid
        }
		if(err){
			insertArr.description = 'VM Decommission request Failed';
		}
        await new Promise(function (resolve, reject) {
            dbHandler.insertIntoTable('c4_vm_logs',insertArr,function(err,result){
                resolve(result)
            })
        });
        
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}, req.query))
		} else {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	});
}

function updateVmRequestThroughJenkins(req,res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)); 
	//let clientid=base64.decode(req.params.id);
	//clientid = ucpEncryptDecrypt.ucpDecryptForUri(clientid, req.query);
	azureService.updateVmRequestThroughJenkins(reqBody,async function(err,result){
		await new Promise(async function(innerResolve, innerReject){
			if(typeof reqBody.vm_ops_request_id != 'undefined' && reqBody.vm_ops_request_id != ''){
				console.log("err 111111111 ---- ", err);
				let updateData = {
					response_obj : JSON.stringify(result),
					approval_status : 3,
					updated_by : reqBody.request_processed_user_id,
					updated_date : (new Date().getTime() / 1000),
					ref_id : ((result.ref_id)?result.ref_id:0)
				};
				if(err){
					updateData.approval_status = 4;
				}
				await dbHandler.updateTableData('azure_vm_ops_requests',{id:reqBody.vm_ops_request_id},updateData,async function(err,result){
					console.log("err 22222 --- ", err);
					innerResolve("");
				});
			} else {
				innerResolve("");
			}
		});
		
		var insertArr={
            vmid:reqBody.vm_id,
            type:6,
            description:'VM Update request Completed',
            createddate:parseInt(new Date()/1000),
            createdby : reqBody.request_processed_user_id,
            clientid : reqBody.clientid
        }
		if(err){
			insertArr.description = 'VM Update request Failed';
		}
        await new Promise(function (resolve, reject) {
            dbHandler.insertIntoTable('c4_vm_logs',insertArr,function(err,result){
                resolve(result)
            })
        });
        
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}, req.query))
		} else {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
  });
}
function getAllAzureResourceGroups(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)); 
//  let clientid=base64.decode(req.params.id);
//  clientid = ucpEncryptDecrypt.ucpDecryptForUri(clientid, req.query);
//Assigned subscriptions & resource groups

azureService.getAllAzureResourceGroups(reqBody,function(err,result){
  if (err) {
  res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}, req.query))
  } else {
  res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
  }
});
}


function getAzureDropdownData(req,res) {
  azureService.getAzureDropdownData(req.body,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function generateUniqueVmName(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)); 
  var bodydata={body:reqBody}
  azureService.generateUniqueVmName(bodydata,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function checkStorageAndSizeCompatability(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)); 
  var bodydata={body:reqBody}
  azureService.checkStorageAndSizeCompatability(bodydata,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function azureResourceGroupBySubscription(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureService.azureResourceGroupBySubscription(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}

function getVMDetails(req,res) {
  let encId = req.params.id; 
  azureService.getVMDetails(encId,function(err,result){
    if (err) {
    res.status(400).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function syncSingleVmDetails(req,res) {
  let reqBody = req.body;
  reqBody = req.query;
  azureService.syncSingleVmDetails(reqBody,function(err,result){
    if (err) {
    res.status(400).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}
function getVMDetailByName(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureService.getVMDetailByName(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}

function getDiskList(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  var bodydata={body:reqBody}
  azureService.getDiskList(bodydata,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}

function addDisk(req,res) {
  azureService.addDisk(req,function(err,result){
    if (err) {
    res.status(400).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}

function attachDisk(req,res) {
  azureService.attachDisk(req,function(err,result){
    if (err) {
	    res.status(400).send(result);
	    return;
    } else {
	    res.status(200).send(result);
	    return;
    }
  });
}

function detachDisk(req,res) {
  azureService.detachDisk(req,function(err,result){
    if (err) {
    res.status(400).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}

function get_resrouce_group_list(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureService.get_resrouce_group_list(reqBody,function(err,result){
    if (err) {
    res.status(400).send(ucpEncryptDecrypt.ucpEncrypt({message:result}, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function addAzureResourceGroups(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  var bodydata={body:reqBody}
  azureService.addAzureResourceGroups(bodydata,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}


function vmOperations(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  azureService.vmOperations(reqBody,async function(err,result){
	  await new Promise(async function(innerResolve, innerReject){
		if(typeof reqBody.vm_ops_request_id != 'undefined' && reqBody.vm_ops_request_id != ''){
			console.log("err ---- ", err);
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
				console.log("err --- ", err);
				innerResolve("");
			});
		}else{
			innerResolve("");
		}
	});
    if (err) {
    res.status(400).send(ucpEncryptDecrypt.ucpEncrypt({message:result}, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function veeamOperations(req,res) {
  azureService.veeamOperations(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}

async function getOatData(req, res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)),
    result = await azureService.vmOatData(reqBody)

  res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
}

async function getCyberArkUsers(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  let result = await azureService.getCyberArkUsers(reqBody)

  res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({data: result}))
}
async function getAllUsersList(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  let result = await azureService.getAllUsersList(reqBody)

  res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({data: result}))
}

async function getAdGroups(req, res) {
  let result = await azureService.getAdGroups(req)

  res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({data: result}))
}

async function createCyberArkSafe(req, res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)),
  result = await azureService.cyberarkSafeCreation(reqBody)

  res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({data: result}))
}

async function addCyberArkSafeMember(req, res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)),
    result = await azureService.cyberarkMemberAddition(reqBody);

  res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({data: result}))
}

async function getCyberArkApplication(req, res) {
  let result = await azureService.cyberArkApplication();

  res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({data: result}))
}

async function getCyberArkPermissions(req, res) {
  let result = await azureService.cyberArkPermissions();

  res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({data: result}))
}

async function getCyberarkList(req, res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)),
    result = await azureService.vmCyberarkList(reqBody);

  res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({data : result}))
}

async function manageVMLock(req, res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)),
    result = await azureService.manageVMLock(reqBody);

  if (result.status === "error") {
    res.status(400).send(ucpEncryptDecrypt.ucpEncrypt({data : result}))
  }
  else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({data : result})) 
  }
}

async function getCyberarkUserList(req, res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)),
    result = await azureService.vmCyberarkUsersList(reqBody);

  res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({data : result}))
}

async function getOatList(req, res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)),
    result = await azureService.vmOatList(reqBody);

  res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({data : result}))
}

async function getOatListData(req, res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)),
    result = await azureService.vmOatListData(reqBody)

  res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({data : result}))
}

function vmResize(req,res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	azureService.vmResize(reqBody,async function(err,result){
		await new Promise(async function(innerResolve, innerReject){
			if(typeof reqBody.vm_ops_request_id != 'undefined' && reqBody.vm_ops_request_id != ''){
				console.log("err ---- ", err);
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
					console.log("err --- ", err);
					innerResolve("");
				});
			}else{
				innerResolve("");
			}
		});
		var insertArr={
            vmid:reqBody.vm_id,
            type:5,
            description:'VM Re-Size request Completed',
            createddate:parseInt(new Date()/1000),
            createdby : reqBody.request_processed_user_id,
            clientid : reqBody.client_id
        }
		if(err){
			insertArr.description = 'VM Re-Size request Failed';
		}
        await new Promise(function (resolve, reject) {
            dbHandler.insertIntoTable('c4_vm_logs',insertArr,function(err,result){
                resolve(result)
            })
        });
	    if (err) {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	    } else {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	    }
	});
}

function galleryList(req,res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	azureService.galleryList(reqBody,function(err,result){
	    if (err) {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	    } else {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	    }
	});
}

function galleryImagesList(req,res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	azureService.galleryImagesList(reqBody,function(err,result){
	    if (err) {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	    } else {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	    }
	});
}

function galleryImageVersionList(req,res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	azureService.galleryImageVersionList(reqBody,function(err,result){
	    if (err) {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	    } else {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	    }
	});
}

function getVmBackupVaultNames(req,res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	azureService.getVmBackupVaultNames(reqBody,function(err,result){
	    if (err) {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	    } else {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	    }
	});
}

function getVmBackupVaultPolicies(req,res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	azureService.getVmBackupVaultPolicies(reqBody,function(err,result){
	    if (err) {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	    } else {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	    }
	});
}

function extendDisk(req,res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	azureService.extendDisk(reqBody,function(err,result){
	    if (err) {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	    } else {
	    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
	    }
	});
}

function addVm(req,res){
  azureService.addVm(req,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}

function getVmDetailbyId(req,res) {
  if(!req.body.vmid || !req.body.clientid){
    return res.status(400).send({success:0,message:"Input params missing"})
  }
  let vmId = base64.decode(req.body.vmid); 
  let clientid = base64.decode(req.body.clientid);  
  azureService.getVmDetailbyId(clientid,vmId).then((data) => {
      res.send(data);
    }).catch((err) => {
      res.send(err);
    });
}

function vmLogs(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  let vmId = reqBody.vmid; 
  let clientid = reqBody.clientid;  
  azureService.vmLogs(clientid,vmId).then((data) => {
      res.send(ucpEncryptDecrypt.ucpEncrypt(data, req.query));
    }).catch((err) => {
      res.send(ucpEncryptDecrypt.ucpEncrypt(err, req.query));
    });
}

function addScheduler(req,res){
  azureService.addScheduler(req,function(err,result){
    if (err) {
    res.status(400).send({message:result,success:false})
    } else {
    res.status(200).send(result)
    }
  });
}

function getVmLogsbyId(req,res) {
  let vmId = req.params;  
  azureService.getVmLogsbyId(vmId).then((data) => {
      res.send(data);
    }).catch((err) => {
      //mail.mail(err);
      res.send(err);
    });
}

function getScheduleList(req,res) {
  let vdc_id = req.params.id; 
  azureService.getScheduleList(vdc_id).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}
function getVmNotScheduleList(req,res) {
  let vdc_id = req.params.id; 
  azureService.getVmNotScheduleList(vdc_id).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}

function getVmDiskInfobyId(req,res) {
  let vmId = req.params;  
  azureService.getVmDiskInfobyId(vmId).then((data) => {
      res.send(data);
    }).catch((err) => {
      //mail.mail(err);
      res.send(err);
    });
}
function updateVmCreateDate(req,res){
  azureService.updateVmCreateDate(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function getAllVmGrouplist(req,res) {
  azureService.getAllVmGrouplist().then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}
function addVmGroup(req,res) {
  azureService.addVmGroup(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function editVmGroup(req,res) {
  azureService.editVmGroup(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function editVmGroupMapping(req,res) {
  azureService.editVmGroupMapping(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}

async function getAzureBillingReport(req,res) {
  try{

    let { start_date, end_date } = req.query;

    if(!start_date)
    return res.status(400).send({status:"error",message:'start date is missing'});

    if(!end_date)
    return res.status(400).send({status:"error",message:'end date is missing'});

    let result = await azureService.getAzureBillingReport(req);
    res.status(200).send(result);
  }
  catch(error){
    errorResponse(res, error);
  }

}

module.exports.init = init;