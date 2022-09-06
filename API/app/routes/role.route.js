var mail = require("./../../common/mailer.js");
const roleModel = require("../models/role.model");
const ucpEncryptDecrypt = require('../../config/ucpEncryptDecrypt');

function init(router) {
	router.route('/roles/list').get(getAllRole);
	router.route('/roles/listRoleAssigned').post(listRoleAssigned);
	router.route('/roles/saveRole').post(saveRole);
	router.route('/roles/deleteRole').post(deleteRole);
	router.route('/roles/getUserRoleList').get(getUserRoleList);
	router.route('/roles/getRolePermissionList').get(getRolePermissionList);
	router.route('/roles/saveUserRole').post(saveUserRole);
	router.route('/roles/updateUserRole').post(updateUserRole);
	router.route('/roles/saveRolePermission').post(saveRolePermission);
	router.route('/roles/deleteUserRole').post(deleteUserRole);
	router.route('/roles/deleteRolePermission').post(deleteRolePermission);
	router.route('/module/list').get(getAllModule);
	router.route('/module/saveModule').post(saveModule);
	router.route('/module/deleteModule').post(deleteModule);
	router.route('/module/getModulePermissionList').get(getModulePermissionList);
	router.route('/user/getAllClientUsers').get(getAllClientUsers);
	router.route('/roles/saveResourceGroup').post(saveResourceGroup);
	router.route('/roles/getAllResourceGroupList').post(getAllResourceGroupList);
	router.route('/roles/getAllUserResourceGroupList').post(getAllUserResourceGroupList);
	router.route('/roles/deleteResourceGroup').post(deleteResourceGroup);
	router.route('/roles/listRGAssigned').post(listRGAssigned);
}

function listRGAssigned(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.listRGAssigned(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	}); 
} 

function getAllRole(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.getAllRole(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	}); 
} 

function listRoleAssigned(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.listRoleAssigned(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	}); 
} 

function saveRole(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.saveRole(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		} 
	});
}

function deleteRole(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.deleteRole(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	});
}

function deleteUserRole(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.deleteUserRole(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	});
}

function deleteRolePermission(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.deleteRolePermission(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	});
}

function getUserRoleList(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.getUserRoleList(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	});
}

function getRolePermissionList(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.getRolePermissionList(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	});
}

function saveUserRole(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.saveUserRole(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		} 
	});
}

function updateUserRole(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.updateUserRole(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		} 
	}); 
} 

function saveRolePermission(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.saveRolePermission(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		} 
	});
}

function getAllModule(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.getAllModule(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	}); 
} 

function saveModule(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.saveModule(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		} 
	});
}

function deleteModule(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.deleteModule(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	});
}

function getModulePermissionList(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.getModulePermissionList(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	}); 
} 

function getAllClientUsers(req, res) { 
	console.log('getAllClientUsers'); 
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.getAllClientUsers(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	}); 
} 

function saveResourceGroup(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.saveResourceGroup(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		} 
	}); 
}

function getAllResourceGroupList(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	Object.assign(reqBody, {
	      subscription_resource_group_combo: req.subscription_resource_group_combo,
	      is_super_admin : req.is_super_admin
	    })

	roleModel.getAllResourceGroupList(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({data: err.message}))
		} else {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
		}
	}); 
} 

function getAllUserResourceGroupList(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));

	roleModel.getAllUserResourceGroupList(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		} 
	}); 
} 

function deleteResourceGroup(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	roleModel.deleteResourceGroup(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	});
}


module.exports.init = init;
