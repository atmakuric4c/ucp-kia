var express = require('express');
var router = express.Router();
const awsModel = require('../models/aws_model');
const helper = require('../helpers/common_helper');
const {  errorResponse } = require('../common/error-response');

router.get('/sync_aws_services_usage', function(req, res, next) {
  awsModel.syncAwsServicesUsage(req.query,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});

router.get('/sync_aws_list_access_token', function(req, res, next) {
  awsModel.syncAwsListAccessToken(req,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});

router.post('/aws_create_access_token', function(req, res, next) {
  awsModel.AwsCreateAccessToken(req,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});

router.post('/aws_update_access_token', function(req, res, next) {
  awsModel.AwsUpdateAccessToken(req,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});

router.post('/aws_delete_access_token', function(req, res, next) {
  awsModel.AwsDeleteAccessToken(req,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});

router.post('/get_aws_access_token_last_use', function(req, res, next) {
  awsModel.getAwsAccessTokenLastUse(req,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});

/*
  Author: Rajesh
  Descri: get availability zones
  Date  : 04-06-2020
*/
router.get('/sync_aws_availability_zones', function(req, res, next) {
  awsModel.syncAwsAvailabilityZones(req,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
Author: Rajesh
Descri: get availability zones
Date  : 04-06-2020
*/
router.post('/get_aws_availability_zones', function(req, res, next) {
awsModel.getAwsAvailabilityZones(req.body,function(err,result){
  if (err) {
    res.status(400).send(result)
  } else {
    res.status(200).send(result)
  }
});
});
/*
  Author: rajesh
  Descri: get aws regions list
  Date  : 04-06-2020
*/
router.post('/get_aws_regions', function(req, res, next) {
  awsModel.getAwsRegions(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: rajesh
  Descri: get aws images list
  Date  : 04-06-2020
*/
router.post('/get_aws_images', function(req, res, next) {
  awsModel.getAwsImages(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: pradeep
  Descri: get Images list
  Date  : 04-06-2020
*/
router.get('/sync_aws_images', function(req, res, next) {
  awsModel.syncAwsImages(req,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: rajesh
  Descri: get aws intance types list
  Date  : 04-06-2020
*/
router.post('/get_aws_instance_types', function(req, res, next) {
  awsModel.getAwsInstanceTypes(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: pradeep
  Descri: get Images list
  Date  : 04-06-2020
*/
router.get('/sync_aws_instance_types', function(req, res, next) {
  awsModel.syncInstanceTypes(req,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: rajesh
  Descri: get aws intance types list
  Date  : 04-06-2020
*/
router.post('/get_aws_vms', function(req, res, next) {
  awsModel.getAwsVms(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: pradeep
  Descri: get vm list
  Date  : 08-06-2020
*/
router.get('/sync_aws_vms', function(req, res, next) {
  awsModel.syncAwsVms(req.query,function(err,result){
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
  Date  : 10-06-2020
*/
router.post('/vm_operations', function(req, res, next) {
  awsModel.vmOperations(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: get subnet list
  Date  : 10-06-2020
*/
router.post('/get_subnet_list', function(req, res, next) {
  awsModel.getSubnetList(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: pradeep
  Descri: get vpc list
  Date  : 10-06-2020
*/
router.post('/get_vpc_list', function(req, res, next) {
  awsModel.getVpcList(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: pradeep
  Descri: get network interface list
  Date  : 10-06-2020
*/
router.post('/get_network_interfaces_list', function(req, res, next) {
  awsModel.getNetworkInterfaceList(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: pradeep
  Descri: create vpc
  Date  : 11-06-2020
*/
router.post('/create_vpc', function(req, res, next) {
  awsModel.createVpc(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: pradeep
  Descri: create vpc
  Date  : 11-06-2020
*/
router.post('/create_subnet', function(req, res, next) {
  awsModel.createSubnet(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: pradeep
  Descri: create network interface
  Date  : 11-06-2020
*/
router.post('/create_network_interface', function(req, res, next) {
  awsModel.createNetworkInterface(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: pradeep
  Descri: delete VPC
  Date  : 12-06-2020
*/
router.post('/delete_vpc', function(req, res, next) {
  awsModel.deleteVpc(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: pradeep
  Descri: delete VPC
  Date  : 12-06-2020
*/
router.post('/delete_subnet', function(req, res, next) {
  awsModel.deleteSubnet(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: pradeep
  Descri: delete network interface
  Date  : 12-06-2020
*/
router.post('/delete_network_interface', function(req, res, next) {
  awsModel.deleteNetworkInterface(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: pradeep
  Descri: attach network interface
  Date  : 12-06-2020
*/
router.post('/attach_network_interface', function(req, res, next) {
  awsModel.attachNetworkInterface(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: pradeep
  Descri: create vm
  Date  : 15-06-2020
*/
router.post('/create_vm', function(req, res, next) {
  awsModel.createVm(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: pradeep
  Descri: get vm detail
  Date  : 15-06-2020
*/
router.get('/get_vm_detail', function(req, res, next) {
  awsModel.getAwsVmDetail(req.query,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: pradeep
  Descri: get vm detail
  Date  : 15-06-2020
*/
router.get('/syncVmStatus', function(req, res, next) {
  awsModel.syncVmStatus();
  res.status(200).send("Success")
});

/*
  Author: Pradeep
  Descri: get subnet list
  Date  : 10-06-2020
*/
router.post('/get_volume_list', function(req, res, next) {
  awsModel.getVolumeList(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: create volume
  Date  : 16-06-2020
*/
router.post('/create_volume', function(req, res, next) {
  awsModel.createVolume(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: modify volume
  Date  : 18-06-2020
*/
router.post('/modify_volume', function(req, res, next) {
  awsModel.modifyVolume(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: detach volume
  Date  : 18-06-2020
*/
router.post('/detach_volume', function(req, res, next) {
  awsModel.detachVolume(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: delete volume
  Date  : 18-06-2020
*/
router.post('/delete_volume', function(req, res, next) {
  awsModel.deleteVolume(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: attach volume
  Date  : 18-06-2020
*/
router.post('/attach_volume', function(req, res, next) {
  awsModel.attachVolume(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: attach volume
  Date  : 18-06-2020
*/
router.post('/availableVolumeList', function(req, res, next) {
  awsModel.availableVolumeList(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: get tag list
  Date  : 18-06-2020
*/
router.post('/get_tags', function(req, res, next) {
  awsModel.getTags(req.body,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});

router.post('/aws_cost_forecast_mail', async function(req, res, next) {
  try{
  
    let result = await awsModel.sendAWSCostForecastMail(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
});


router.post('/aws_usage_forecast_mail', async function(req, res, next) {
  try{
  
    let result = await awsModel.sendAWSUsageForecastMail(req);
    res.status(200).send(result);

  }
  catch(error){
    errorResponse(res, error);
  }
});

router.get('/testDB', function(req, res, next) {
	const config=require('../config/constants');
	var mysql = require('mysql');
	var con = mysql.createConnection({
		host: config.DB.host,
		  user: config.DB.user,
		  password: config.DB.password,
		  database: config.DB.database,
	});
	
	con.connect(function(err) {
	  if (err){
		  console.log(err);
	  }
	  console.log("Connected!");
	});
	res.status(200).send("Done");
});

module.exports = router;
/*netstat -ano | findstr :9890
tskill pinumber  */
//for linux
//pkill -f node