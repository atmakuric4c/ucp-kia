var express = require('express');
var router = express.Router();
const gcpModel = require('../models/gcp_model');
const helper = require('../helpers/common_helper');
const config=require('../config/constants');

//sample Localhost url :: http://localhost:9890/gcp/gcpOauth?gcp_client_id=534932766114-ilq5oend23vb5rbdd19e9fl4vbn12lb3.apps.googleusercontent.com&gcp_client_secret_key=GYqFU6gJECNoRNXd88e1NPI0&clientid=222
//sample UAT url :: http://uatucp.cloud4c.com:9890/gcp/gcpOauth?gcp_client_id=534932766114-ab8fjgdefic52qmhcoks17u5sgdla6n3.apps.googleusercontent.com&gcp_client_secret_key=dGa44UKZDavHh-3ZfkVGbqG5&clientid=222
//sample LIVE url :: https://ucpapi.cloud4c.com/gcp/gcpOauth?gcp_client_id=534932766114-ncnt9t8g43cnogumvek67bk0marhm3k7.apps.googleusercontent.com&gcp_client_secret_key=LmOQaUXmZrenu1fdO5rGS2Cp&clientid=222
//sample url :: http://localhost:9890/gcp/gcpOauth?clientid=3
router.get('/gcpOauth', function(req, res, next) {
	gcpModel.gcpOauth(req,res);
});

router.get('/gcpReturnUrl', function(req, res, next) {
	gcpModel.gcpReturnUrl(req,function(err,result){
		console.log(result);
		if (result.redirectUrl && result.redirectUrl != '') {
			if (err) {
				res.redirect(decodeURIComponent(result.redirectUrl)+"?status=error&message=Invalid GCP Credentials");
			}else{
				res.redirect(decodeURIComponent(result.redirectUrl)+"?status=success&message=GCP Credentials added successfully");
			}
		}else if (!result.client_entity_id) {
//	    	res.sendFile(config.APIPATH+'/index.html');
	    	res.redirect(config.FRONTEND_URL+config.GCP.gcp_error_url);
	    } else if (err) {
	    	if(result.client_entity_id == config.COMPANY_ENTITIES['cloud']){
	    		res.redirect(config.FRONTEND_URL+config.GCP.gcp_error_url);
	    	}else{
	    		res.redirect(config.CTRLS_FRONTEND_URL+config.GCP.gcp_error_url);
	    	}
	    } else {
	    	if(result.client_entity_id == config.COMPANY_ENTITIES['cloud']){
	    		res.redirect(config.FRONTEND_URL+config.GCP.gcp_success_url);
	    	}else{
	    		res.redirect(config.CTRLS_FRONTEND_URL+config.GCP.gcp_success_url);
	    	}
	    }
	});
});

// sample url :: http://localhost:9890/gcp/gcp_authtoken/1
router.get('/gcp_authtoken/:id', function(req, res, next) {
	gcpModel.gcp_authtoken(req.params.id,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});

/*
Author: Rajesh
Descriprion: sync project list
Date  : 07-07-2020
*/
router.get('/sync_gcp_project_list', function(req, res, next) {
	gcpModel.syncGcpProjectList(req,function(err,result){
	  if (err) {
	    res.status(200).send(result)
	  } else {
	    res.status(200).send(result)
	  }
	});
});

/*
Author: Rajesh
Descriprion: sync services and services.skus list
Date  : 05-11-2020
*/
router.get('/sync_gcp_services_and_services_skus_list', function(req, res, next) {
	gcpModel.syncGcpServicesAndServicesSkusList(req.query,function(err,result){
	  if (err) {
	    res.status(200).send(result)
	  } else {
	    res.status(200).send(result)
	  }
	});
});

/*
Author: Rajesh
Descriprion: sync datasets and tables list
Date  : 13-11-2020
*/
router.get('/sync_gcp_datasets_and_tables_list', function(req, res, next) {
	gcpModel.syncGcpDatasetsAndTablesList(req.query,function(err,result){
	  if (err) {
	    res.status(200).send(result)
	  } else {
	    res.status(200).send(result)
	  }
	});
});

/*
Author: Rajesh
Descriprion: sync gcp services usage data
Date  : 16-11-2020
*/
router.get('/sync_gcp_services_usage_data', function(req, res, next) {
	gcpModel.syncGcpServicesUsageData(req.query,function(err,result){
	  if (err) {
	    res.status(200).send(result)
	  } else {
	    res.status(200).send(result)
	  }
	});
});

/*
Author: Rajesh
Descriprion: get project list
Date  : 07-07-2020
*/
router.post('/get_gcp_project_list', function(req, res, next) {
	gcpModel.getGcpProjectList(req.body,function(err,result){
	  if (err) {
	    res.status(200).send(result);
	  } else {
	    res.status(200).send(result);
	  }
	});
});

/*
Author: Rajesh
Descriprion: sync zones list
Date  : 07-07-2020
*/
router.get('/sync_gcp_zones_list', function(req, res, next) {
	gcpModel.syncGcpZonesList(req,function(err,result){
	  if (err) {
	    res.status(200).send(result)
	  } else {
	    res.status(200).send(result)
	  }
	});
});

/*
Author: Rajesh
Descriprion: sync regions list
Date  : 07-07-2020
*/
router.get('/sync_gcp_regions_list', function(req, res, next) {
	gcpModel.syncGcpRegionsList(req,function(err,result){
	  if (err) {
	    res.status(200).send(result)
	  } else {
	    res.status(200).send(result)
	  }
	});
});

/*
Author: Rajesh
Descriprion: sync images list
Date  : 09-07-2020
*/
router.get('/sync_gcp_images_list', function(req, res, next) {
	gcpModel.syncGcpImagesList(req,function(err,result){
	  if (err) {
	    res.status(200).send(result)
	  } else {
	    res.status(200).send(result)
	  }
	});
});

/*
Author: Pradeep
Descri: sync vm list
Date  : 09-07-2020
*/
router.get('/sync_gcp_vms', function(req, res, next) {
	gcpModel.syncGcpVms(req.query,function(err,result){
	  if (err) {
	    res.status(200).send(result)
	  } else {
	    res.status(200).send(result)
	  }
	});
});

router.get('/sync_gcp_vm_status', function(req, res, next) {
	gcpModel.syncGcpVmStatus(req.query);
	res.status(200).send({message:"vm status syncing initiated"})
});
/*
Author: Pradeep
Descri: sync vm list
Date  : 09-07-2020
*/
router.get('/sync_gcp_vm_detail', function(req, res, next) {
	gcpModel.syncGcpVmDetail(req.query,function(err,result){
	  if (err) {
	    res.status(200).send(result)
	  } else {
	    res.status(200).send(result)
	  }
	});
});
/*
Author: Pradeep
Descri: sync machinetypes list
Date  : 09-07-2020
*/
router.get('/sync_machine_types', function(req, res, next) {
	gcpModel.syncMachineTypes(req.query,function(err,result){
	  if (err) {
	    res.status(200).send(result)
	  } else {
	    res.status(200).send(result)
	  }
	});
});
/*
Author: Pradeep
Descri: sync network list
Date  : 13-07-2020
*/
router.get('/syncNetworkList', function(req, res, next) {
	gcpModel.syncNetworkList(req.query)
	res.status(200).send('Success')
});
/*
Author: Pradeep
Descri: get network list
Date  : 13-07-2020
*/
router.post('/createNetwork', function(req, res, next) {
	gcpModel.createNetwork(req.body,function(err,result){
	  if (err) {
	    res.status(200).send(result)
	  } else {
	    res.status(200).send(result)
	  }
	});
});
/*
Author: Pradeep
Descri: get network detail
Date  : 13-07-2020
*/
router.post('/networkDetail', function(req, res, next) {
	gcpModel.networkDetail(req.body,function(err,result){
	  if (err) {
	    res.status(200).send(result)
	  } else {
	    res.status(200).send(result)
	  }
	});
});
/*
Author: Pradeep
Descri: get subnetwork detail
Date  : 13-07-2020
*/
router.post('/subnetDetail', function(req, res, next) {
	gcpModel.subnetDetail(req.body,function(err,result){
	  if (err) {
	    res.status(200).send(result)
	  } else {
	    res.status(200).send(result)
	  }
	});
});

/*
Author: Pradeep
Descri: sync subnetwork list
Date  : 13-07-2020
*/
router.get('/syncSubnetList', function(req, res, next) {
	gcpModel.syncSubnetList(req.query)
	res.status(200).send('Success')
});
/*
Author: Pradeep
Descri: create subnetwork
Date  : 13-07-2020
*/
router.post('/createSubnet', function(req, res, next) {
	gcpModel.createSubnet(req.body,function(err,result){
	  if (err) {
	    res.status(200).send(result)
	  } else {
	    res.status(200).send(result)
	  }
	});
});
/*
Author: Pradeep
Descri: create vm
Date  : 14-07-2020
*/
router.post('/create_vm', function(req, res, next) {
	gcpModel.createVm(req.body,function(err,result){
	  if (err) {
	    res.status(200).send(result)
	  } else {
	    res.status(200).send(result)
	  }
	});
});
/*
  Author: Pradeep
  Descri: vm operation
  Date  : 15-07-2020
*/
router.post('/vm_operations', function(req, res, next) {
	gcpModel.vmOperations(req.body,function(err,result){
	  if (err) {
		res.status(400).send(result)
	  } else {
		res.status(200).send(result)
	  }
	});
  });
/*
  Author: Pradeep
  Descri: vm operation
  Date  : 15-07-2020
*/
router.post('/vm_detail', function(req, res, next) {
	var clientid=req.body.clientid;
	var vmId=req.body.vmId;
	gcpModel.getVmDetailbyId(clientid,vmId,function(err,result){
	  if (err) {
		res.status(400).send(result)
	  } else {
		res.status(200).send(result)
	  }
	});
  });
  
module.exports = router;
/*netstat -ano | findstr :9890
tskill pinumber  */
//for linux
//pkill -f node