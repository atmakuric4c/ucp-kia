var express = require('express');
var router = express.Router();
const azureModel = require('../models/azure_model');
const helper  = require('../helpers/common_helper');
const appAzureModel = require('../app/models/azure.model');
const config=require('../config/constants');
const dbHandler= require('../config/api_db_handler');
const ucpEncryptDecrypt=require('../config/ucpEncryptDecrypt');
var db = require('../config/database');
var dbFunc = require('../config/db-function');
var base64 = require('base-64');
const axios = require('axios');
const qs = require('qs')
const env = require('./../config/env');
const multer = require('multer');
var svgCaptcha = require('svg-captcha');
const commonModel = require('../app/models/common.model');
const azureCronModel = require('../models/azure_cron_model');
var mail = require("../common/mailer.js");
const request=require('request');
const https = require('https');
const agent = new https.Agent({    rejectUnauthorized: false});

//const REDIRECT_URI = "http://localhost:9891/azure/adRedirect";

//1st leg of auth code flow: acquire a code
router.get('/adLogin', (req, res) => {
	var sql=`select option_value from c4_option_config where option_type='Azure_AD_Details' limit 1`;
    dbHandler.executeQuery(sql,async function(result){
        if(result.length > 0){
        	result[0].option_value = JSON.parse(result[0].option_value);
        	const adconfig = {
			    auth: {
			    	clientId : result[0].option_value.clientId,
			    	authority : result[0].option_value.authority,
			    	clientSecret : result[0].option_value.clientSecret,
			    },
			    system: {
			        loggerOptions: {
			            loggerCallback(loglevel, message, containsPii) {
			            },
			            piiLoggingEnabled: false,
			        }
			    }
        	};

			const msal = require('@azure/msal-node');
		
			//Create msal application object
			const pca = new msal.ConfidentialClientApplication(adconfig);
		    const authCodeUrlParameters = {
		        scopes: ["user.read"],
		        redirectUri: config.azureAd.REDIRECT_URI,
		    };
		
		    // get url to sign user in and consent to scopes needed for application
		    pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
          //response += '&prompt=login'
		        res.redirect(response);
		    }).catch((error) => {
		    	console.log(JSON.stringify(error))
		    	res.redirect(decodeURIComponent(config.FRONTEND_URL+config.azureAd.success_url)+"&message=Invalid Azure Credentials");
			});
        }else{
//      	  console.log("\n err: \n:", err);
//	        	  res.status(200).send({response,err});
      	  res.redirect(decodeURIComponent(config.FRONTEND_URL+config.azureAd.error_url)+"&message=Invalid Azure Credentials");        	  
      }
  });
});

// 2nd leg of auth code flow: exchange code for token
router.get('/adRedirect', async (req, res) => {
 let {code, client_info, session_state} = req.query;

 res.redirect(decodeURIComponent(config.FRONTEND_URL + `login?loginType=adLogin&code=${code}&client_info=${client_info}&session_state=${session_state}`));
});

router.get('/sync_azure_services_usage', function(req, res, next) {
	azureModel.syncAzureServicesUsage(req.query,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});

router.get('/sync_azure_service_meters', function(req, res, next) {
	azureModel.syncAzureServiceMeters(req.query,function(err,result){
    if (err) {
      res.status(400).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});

/*
  Author: Pradeep
  Descri: get subscription list
  Date  : 22-10-2019
*/
router.get('/get_subscription_list', function(req, res, next) {
  azureModel.getSubscriptionList(req.query,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: get location list
  Date  : 23-10-2019
*/
router.get('/get_location_list', function(req, res, next) {
  azureModel.getLocationList(req,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: get tenant list
  Date  : 22-10-2019
*/
router.get('/get_tenant_list', function(req, res, next) {
  azureModel.getTenantList(req,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: get vm list
  Date  : 22-10-2019
*/
router.post('/vm_list', function(req, res, next) {
  azureModel.getVMList(req.body,function(error,result){
    res.status(200).send(result)
  });
});
/*
  Author: Pradeep
  Descri: get vm list
  Date  : 22-10-2019
*/
router.get('/sync_vm_list', function(req, res, next) {
  azureModel.syncVmList(req.query);
  res.status(200).send({success:"Success"})
});
router.get('/syncLatestVms', function(req, res, next) {
  appAzureModel.syncLatestVms(req.query);
  res.status(200).send({success:"running syncLatestVms"})
});

/*
  Author: Pradeep
  Descri: get resource group list
  Date  : 29-10-2019
*/
router.get('/get_resource_group_list', function(req, res, next) {
  azureModel.getResourceGroupList(req,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: create vm
  Date  : 22-05-2020
*/
router.post('/vm_creation', function(req, res, next) {
  azureModel.createVm(req.body,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: resize vm
  Date  : 22-05-2020
*/
router.post('/vm_resize', function(req, res, next) {
  azureModel.resizeVm(req.body,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: get vm operations
  Date  : 29-10-2019
*/
router.post('/vm_operations', function(req, res, next) {
  azureModel.vmOperations(req,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: get vm details
  Date  : 29-10-2019
*/
router.get('/get_vm_details', function(req, res, next) {
  azureModel.getVMDetails(req,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});


/*
  Author: Rajesh
  Description: get Azure Subscription List
  Date  : 08-05-2020
  url check from postman :: http://localhost:9890/azure/getAzureSubscriptionList
*/
router.get('/getAzureSubscriptionList', function(req, res, next) {
  console.log("getAzureSubscriptionList");
  azureModel.getAzureSubscriptionList(req.query,function(err,result){
      if (err) {
      res.status(400).send({message:result})
      } else {
      res.status(200).send(result)
      }
  });
});

/*
  Author: Rajesh
  Description: get Azure Subscription wise Location list
  Date  : 08-05-2020
  url check from postman :: http://localhost:9890/azure/getAzureSubscriptionWiseLocationList
*/
router.get('/getAzureSubscriptionWiseLocationList', function(req, res, next) {
  console.log("getAzureSubscriptionWiseLocationList");
  azureModel.getAzureSubscriptionWiseLocationList(req.query,function(err,result){
      if (err) {
      res.status(200).send({message:result})
      } else {
      res.status(200).send(result)
      }
  });
});

/*
  Author: Rajesh
  Description: sync Azure StorageTypes
  Date  : 18-06-2020
  url check from postman :: http://localhost:9890/azure/syncAzureStorageTypes
*/
router.get('/syncAzureStorageTypes', function(req, res, next) {
  console.log("syncAzureStorageTypes");
  azureModel.syncAzureStorageTypes(req.query,function(err,result){
      if (err) {
      res.status(200).send(result);
      } else {
      res.status(200).send(result)
      }
  });
});

/*
  Author: Rajesh
  Description: get Azure catalog list
  Date  : 11-05-2020
  url check from postman :: http://localhost:9890/azure/getAzureCatalog
*/
router.get('/getAzureCatalog', function(req, res, next) {
	azureModel.getAzureCatalog(req.query);
	res.status(200).send("Running getAzureCatalog");
	
//  console.log("getAzureCatalog");
//  azureModel.getAzureCatalog(req.query,function(err,result){
//      if (err) {
//      res.status(400).send({message:result})
//      } else {
//      res.status(200).send(result)
//      }
//  });
});

/*
  Author: Rajesh
  Description: get Azure Subscription wise OsTemplates list
  Date  : 12-05-2020
  url check from postman :: http://localhost:9890/azure/getAzureSubscriptionWiseOsTemplatesList
*/
router.get('/getAzureSubscriptionWiseOsTemplatesList', function(req, res, next) {
  console.log("getAzureSubscriptionWiseOsTemplatesList");
  azureModel.getAzureSubscriptionWiseOsTemplatesList(req.query,function(err,result){
      if (err) {
      res.status(400).send({message:result})
      } else {
      res.status(200).send(result)
      }
  });
});

/*
  Author: Rajesh
  Description : get and update Azure Subscription wise Resource Groups list
  Date  : 13-05-2020
  url check from postman :: http://localhost:9890/azure/getAzureResourceGroups
*/
router.get('/getAzureResourceGroups', function(req, res, next) {
	azureModel.getAzureResourceGroups(req.query)
	res.status(200).send("Running getAzureResourceGroups")
//  console.log("getAzureResourceGroups");
//  azureModel.getAzureResourceGroups(req.query,function(err,result){
//      if (err) {
//      res.status(400).send({message:result})
//      } else {
//      res.status(200).send(result)
//      }
//  });
});

/*
  Author: Rajesh
  Description : get and update All Azure Subscription wise Resource Groups list
  Date  : 13-05-2020
  url check from postman :: http://localhost:9890/azure/getAllAzureResourceGroups
*/
router.get('/getAllAzureResourceGroups', function(req, res, next) {
	azureModel.getAllAzureResourceGroups(req.query)
	res.status(200).send("Running getAllAzureResourceGroups")
//  console.log("getAllAzureResourceGroups");
//  azureModel.getAllAzureResourceGroups(req.query,function(err,result){
//      if (err) {
//      res.status(400).send({message:result})
//      } else {
//      res.status(200).send(result)
//      }
//  });
});
/*
  Author: Pradeep
  Descri: get Network Interfaces
  Date  : 19-05-2020
*/
router.post('/get_network_interfaces', function(req, res, next) {
  azureModel.getNetworkInterfaces(req.body,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: create Network Interfaces
  Date  : 19-05-2020
*/
router.post('/create_network_interfaces', function(req, res, next) {
  azureModel.createNetworkInterfaces(req.body,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: get Virtual Network
  Date  : 19-05-2020
*/
router.post('/get_virtual_network', function(req, res, next) {
  azureModel.getVirtualNetwork(req.body,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: create virtual Network
  Date  : 19-05-2020
*/
router.post('/create_virtual_network', function(req, res, next) {
  azureModel.createVirtualNetwork(req.body,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: get Ip address profile
  Date  : 19-05-2020
*/
router.post('/get_Ip_address_profile', function(req, res, next) {
  azureModel.getIpAddressProfile(req.body,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: create Ip address profile
  Date  : 19-05-2020
*/
router.post('/create_Ip_address_profile', function(req, res, next) {
  azureModel.createIpAddressProfile(req.body,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: get availability sets
  Date  : 19-05-2020
*/
router.post('/get_zone_list_location_wise', function(req, res, next) {
  azureModel.getZoneListLocationWise(req.body,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: get vm sizes
  Date  : 19-05-2020
*/
router.post('/get_vm_sizes', function(req, res, next) {
  azureModel.getVmSizes(req.body,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});

/*
  Author: Pradeep
  Descri: get availability sets
  Date  : 19-05-2020
*/
router.post('/get_availability_sets', function(req, res, next) {
  azureModel.getAvailabilitySets(req.body,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: create availability sets
  Date  : 20-05-2020
*/
router.post('/create_availability_set', function(req, res, next) {
  azureModel.createAvailabilitySet(req.body,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});

/*
  Author: Pradeep
  Descri: get disk lists
  Date  : 19-05-2020
*/
router.post('/get_disk_list', function(req, res, next) {
  azureModel.getDiskList(req.body,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: get os image lists
  Date  : 19-05-2020
*/
router.post('/get_image_list', function(req, res, next) {
  azureModel.getImageList(req.body,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: validate vm name
  Date  : 19-05-2020
*/
router.post('/validate_vm_name', function(req, res, next) {
  azureModel.validateVmName(req.body,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: sync virtual netowrk
  Date  : 19-05-2020
*/
router.get('/sync_virtual_network', function(req, res, next) {
  azureModel.syncVirtualNetwork(req.query)
  res.status(200).send("Running")
});
/*
  Author: Pradeep
  Descri: sync vm status
  Date  : 19-05-2020
*/
router.get('/syncVmStatus', function(req, res, next) {
   azureModel.syncVmStatus(req.query);
   res.status(200).send({message:"vm status syncing initiated"})
});

/*
  Author: Manish
  Description: sync Azure StorageTypes
  Date  : 21-07-2021
  url check from postman :: http://localhost:9890/azure/createVmTemplate
*/
router.post('/createVmTemplate', function(req, res, next) {
  console.log("createVmTemplate");
  //return res.send({code : 200, message : "createVmTemplate route has been set"});
  azureModel.createVmTemplate(req.body,function(err,result){
      if (err) {
      res.status(200).send(result);
      } else {
      res.status(200).send(result);
      }
  });
});

router.get('/syncVmBackupStatus', function(req, res, next) {
 azureModel.syncVmBackupStatus(req.query);
 res.status(200).send({message:"vm backup status syncing initiated"})
});

router.get('/syncVmsInCmdb', function(req, res, next) {
	 azureModel.syncVmsInCmdb(req.query);
	 res.status(200).send({message:"sync Vms In Cmdb initiated"})
});

router.get('/syncGalleryImageVersions', function(req, res, next) {
	 azureModel.syncGalleryImageVersions(req.query);
	 res.status(200).send({message:"syncGalleryImages initiated"})
});

router.get('/syncStorageSkus', function(req, res, next) {
	 azureModel.syncStorageSkus(req.query);
	 res.status(200).send({message:"syncStorageSkus initiated"})
});

router.get('/syncAzureResources', function(req, res, next) {
	 azureModel.syncAzureResources(req.query);
	 res.status(200).send({message:"syncAzureResources initiated"})
});

router.get('/syncVmBackupVaultNames', function(req, res, next) {
	  azureModel.syncVmBackupVaultNames(req.query)
	  res.status(200).send("Running syncVmBackupVaultNames")
});

router.get('/syncVmBackupVaultPolicies', function(req, res, next) {
	  azureModel.syncVmBackupVaultPolicies(req.query)
	  res.status(200).send("Running syncVmBackupVaultPolicies")
});

router.get('/syncStorageAccountNames', function(req, res, next) {
	  azureModel.syncStorageAccountNames(req.query)
	  res.status(200).send("Running syncStorageAccountNames")
});

router.get('/syncAvailabilitySets', function(req, res, next) {
	  azureModel.syncAvailabilitySets(req.query)
	  res.status(200).send("Running syncAvailabilitySets")
});

router.get('/syncCmdbBusinessUnits', function(req, res, next) {
	  azureModel.syncCmdbBusinessUnits(req.query)
	  res.status(200).send("Running syncCmdbBusinessUnits")
});

router.get('/syncCmdbCountries', function(req, res, next) {
	  azureModel.syncCmdbCountries(req.query)
	  res.status(200).send("Running syncCmdbCountries")
});

router.get('/syncCmdbRegions', function(req, res, next) {
	  azureModel.syncCmdbRegions(req.query)
	  res.status(200).send("Running syncCmdbRegions")
});

router.get('/syncCmdbServices', function(req, res, next) {
	  azureModel.syncCmdbServices(req.query)
	  res.status(200).send("Running syncCmdbServices")
});

router.get('/updateOutdatedHostnames', function(req, res, next) {
	  azureModel.updateOutdatedHostnames(req.query)
	  res.status(200).send("Running updateOutdatedHostnames")
});

router.get('/syncJenkinJobsStatus', function(req, res, next) {
	appAzureModel.syncJenkinJobsStatus(req.query)
	  res.status(200).send("Running syncJenkinJobsStatus")
});

router.get('/syncDiskEncryptions', function(req, res, next) {
	azureModel.syncDiskEncryptions(req.query);
	  res.status(200).send("Running syncDiskEncryptions");
});

router.post('/addAndAttachDisk', function(req, res, next) {
	console.log("Running addAndAttachDisk");
	appAzureModel.addAndAttachDisk(req.body,function(err,result){
	      if (err) {
	          res.status(200).send(result);
          } else {
	          res.status(200).send(result);
          }
	});
//	res.status(200).send("Running addAndAttachDisk");
});

router.get('/revokeVMAccessCron', function(req, res, next) {
	azureCronModel.revokeVMAccessCron(req.query,"");
	res.status(200).send("Running revokeVMAccessCron");
});

router.get('/testFileUpload', function(req, res, next) {
	if(typeof(req.query.file)=='undefined' || req.query.file==''){
        return res.status(200).send({success:0,message:'Please provide file.'});
    }
	if(typeof(req.query.ip)=='undefined' || req.query.ip==''){
        return res.status(200).send({success:0,message:'Please provide ip.'});
    }
	if(typeof(req.query.path)=='undefined' || req.query.path==''){
        return res.status(200).send({success:0,message:'Please provide path.'});
    }
	let file_name = req.query.file;
	let ip = req.query.ip;
	try {
	  const fs = require('fs');
	  let filepath = config.REPORTS_PATH+file_name;
	  console.log("filepath --- ", filepath);
	  if (fs.existsSync(filepath)) {
	    //file exists
		const Client = require('ssh2-sftp-client');
	    let sftp = new Client();
	    try {
	    	sftp.connect({
			  host: ip,
			  username: "",
			  password: "",
			  port: "",
	    	}).then(() => {
	    		return sftp.put(filepath, req.query.path+file_name);
	    	}).then((data) => {
	    		//console.log(data)
		    }).catch((err) => {
		    	console.log(err.message, 'catch error');
		    });
	    }catch(e) {
		    console.log(e.errmsg)
		}
	  }else{
		  console.log("file not found");
	  }
	} catch(err) {
	  console.error(err)
	}
	res.status(200).send("testFileUpload")
});

router.get('/testMail', async function(req, res, next) {
	var nodemailer = require("nodemailer");
	if(typeof(req.query.from_email)=='undefined' || req.query.from_email==''){
        return res.status(200).send({success:0,message:'Please provide from_email.'});
    }
	if(typeof(req.query.to_email)=='undefined' || req.query.to_email==''){
        return res.status(200).send({success:0,message:'Please provide to_email.'});
    }
	if(typeof(req.query.subject)=='undefined' || req.query.subject==''){
        return res.status(200).send({success:0,message:'Please provide subject.'});
    }
	if(typeof(req.query.host)=='undefined' || req.query.host==''){
        return res.status(200).send({success:0,message:'Please provide host.'});
    }
	
	let resObj = {};
	const transporter = nodemailer.createTransport({
	    host: ((req.query.host)?req.query.host : "gateway.cloud4c.com"), //Host
	    port: 587, // Port 
	    secure: false
	  });

    let mailOptions = {
      from: req.query.from_email, // sender address
      to: req.query.to_email, // list of receivers
      subject: req.query.subject, // Subject line
//	      text: , // plain text body
      html: req.query.subject// html body
    };
    console.log("mailOptions ---- ", mailOptions);

    /**
     * send mail with defined transport object
     */
    await new Promise(async function(resolve,reject){
    	transporter.sendMail(mailOptions,
	      (error, info) => {
	    	  console.log("error ---- ", error);
	    	  console.log("info ---- ", info);
	    	  resObj.error = error;
	    	  resObj.info = info;
	    	  resolve("");
	    });
    });
	res.status(200).send({fn : "testMail", resObj})
});

//API to get 600 build info from job
router.post('/jenkins-data-sync', async (req, res) => {
	let reqBody = await dbHandler.executeQueryv2(`SELECT job_name FROM azure_jenkin_jobs WHERE record_status=1`);//await JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)),
	let UCP_CONSTANTS_DATA = "";
	await commonModel.getOptionConfigJsonData({option_type:"UCP_CONSTANTS"},async function(err, result){
//		console.log("result 1111111 --- ", result);
		if(!err && result.data){
			UCP_CONSTANTS_DATA = result.data;
		}
		console.log("UCP_CONSTANTS_DATA 1111111 --- ", UCP_CONSTANTS_DATA);
	});
	if(!UCP_CONSTANTS_DATA){
		console.log("UCP_CONSTANTS not found");
		return res.status(200).send({length: reqBody.length, reqBody});
	}
  
    let basicAuth=base64.encode(`${UCP_CONSTANTS_DATA.JENKINS.JenkinsUSERNAME}:${UCP_CONSTANTS_DATA.JENKINS.JenkinsTOKEN}`);

    reqBody = reqBody.map(async obj => {
      let job_name = obj.job_name,
      start = 0,
      end = 400,
      lastIndex = 0,
      options = {
        'method': 'GET',
        'url': `${UCP_CONSTANTS_DATA.JENKINS.Jenkins_protocal}://${UCP_CONSTANTS_DATA.JENKINS.JenkinsURL}/job/${job_name}/api/json?tree=builds[result,id,building,actions[parameters[name,value]]]{0,1}`,
        'headers': {
          'Authorization': `Basic ${basicAuth}`
        },
        'Content-Type': 'application/json',
      },
      response = await axios(options).catch(e => {
        lastIndex = 25;
      });

    if (!response) {
      return options.url
    }
    response.body = response.data;
    lastIndex = ((response.body && response.body.builds && response.body.builds[0])?response.body.builds[0].id:0);
    
    if (end > lastIndex) {
      end= lastIndex;
    }
    options = {
      'method': 'GET',
      'url': `${UCP_CONSTANTS_DATA.JENKINS.Jenkins_protocal}://${UCP_CONSTANTS_DATA.JENKINS.JenkinsURL}/job/${job_name}/api/json?tree=builds[result,id,building,actions[parameters[name,value]]]{${start},${end}}`,
      'headers': {
        'Authorization': `Basic ${basicAuth}`
      },
      'Content-Type': 'application/json',
      };
    
      response = await axios(options);
      let rowInfo = response.data.builds;

      rowInfo = rowInfo.map((row, indx) =>{
        let actions = row.actions || [],
        subscription_id = '',
      params, resource_group = 'NA', host_name = 'NA';

      if (actions[0] && actions[0].parameters) {
        params = actions[0].parameters
      } else {
        if (actions[1] && actions[1].parameters) {
          params = actions[1].parameters || [];
        }
        else {
          params = [];
        }
      }
        params = params.map((param, paramindx) => {
          let retObj = {}, {name, value} = param;

          if (name === 'deployment_resource_group_name') {
            resource_group = value;
          }
          if (name === 'subscription_id') {
            subscription_id = value;
          }
          if (name === 'virtual_machine_name') {
            host_name = value
          }
          if (name === 'cyberark_usernames') {
            value = (value || '').replace(/::/g, "--").replace(/@$/g, "++").replace(/:':/g, "--").replace(/'@$/g, "++")
          }

          retObj[name.trim()] = (value || '').trim();
          return retObj;
        });

        return {
          job_name, build_id: row.id, resource_group, host_name,
          subscription_id,
          build_info: JSON.stringify(params), status: row.result
        }
      });

      try
      {
        await azureModel.jenkinJobBuilds(rowInfo);
        return rowInfo;
      // res.status(200).send({rowInfo})
      }
      catch(e) {
        //res.status(400).send({ errmsg: e.message})
        return e.message
      }
  });
reqBody = await Promise.all(reqBody);
res.status(200).send({length: reqBody.length, reqBody})
});


router.get('/get-captcha', async (req, res) => {
  var captcha = svgCaptcha.create(),
    data = {
      data: captcha.data,
      text: captcha.text
    };

  res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(data, req.query));
});

//jenkin Build processing
router.post('/jenkins-build-sync', async (req, res) => {
	let UCP_CONSTANTS_DATA = "";
	await commonModel.getOptionConfigJsonData({option_type:"UCP_CONSTANTS"},async function(err, result){
//		console.log("result 1111111 --- ", result);
		if(!err && result.data){
			UCP_CONSTANTS_DATA = result.data;
		}
		console.log("UCP_CONSTANTS_DATA 1111111 --- ", UCP_CONSTANTS_DATA);
	});
	if(!UCP_CONSTANTS_DATA){
		console.log("UCP_CONSTANTS not found");
		res.status(400).send({errmsg: 'Jenkins config missing!'});
		return;
	}
	
  try
  {
    let {job_name, job_id, resource_group = 'NA', host_name='NA', subscription_id = 'NA'} =req.body,
      jenkinsapi = require('node-jenkins-api'),
      jenkins = jenkinsapi.init(`${UCP_CONSTANTS_DATA.JENKINS.Jenkins_protocal}://${UCP_CONSTANTS_DATA.JENKINS.JenkinsUSERNAME}:${UCP_CONSTANTS_DATA.JENKINS.JenkinsTOKEN}@${UCP_CONSTANTS_DATA.JENKINS.JenkinsURL}`),
      buildDataRes;
    
    if (!job_name || !job_id) {
      res.status(400).send({errmsg: 'Job name or Job Id is missing!'});
      return;
    }
      
    buildDataRes = await new Promise(async function(innerResolve, innerReject){
      jenkins.build_info(job_name, job_id, function(err, buildData) {
        if (err){  
          console.log(err); 
          innerResolve(err);
        }else{
          innerResolve(buildData);
        }
      });
    });
    
    let actions = buildDataRes.actions || [],
      params;

      if (actions[0] && actions[0].parameters) {
        params = actions[0].parameters
      } else {
        if (actions[1] && actions[1].parameters) {
          params = actions[1].parameters || [];
        }
        else {
          params = [];
        }
      }

      let paramsObj = {};
    params = params.map((param) => {
      let retObj = {}, {name, value} = param;

      if (name === 'deployment_resource_group_name') {
        resource_group = value;
      }
      if (name === 'virtual_machine_name') {
        host_name = value
      }
      if (name === 'subscription_id') {
        subscription_id = value;
      }
      if (name === 'cyberark_usernames') {
        value = (value || '').replace(/::/g, "--").replace(/@$/g, "++").replace(/:':/g, "--").replace(/'@$/g, "++")
      }
      paramsObj[name.trim()] = (value || '').trim();
      retObj[name.trim()] = (value || '').trim();
      return retObj;
    });
    
    console.log("paramsObj --- ", paramsObj);
    buildDataRes.result = ((!buildDataRes.result || buildDataRes.result == '')?"In-Progress":buildDataRes.result);
    
    //TODO comment below lines
//    buildDataRes = {result : 'SUCCESS'}
//    job_name = 'WINDOWS-USER-ONBOARDING';
//    host_name = "xa122ws210010";
//    resource_group = 'rg-its-spcs-prod-weu-001';
//    subscription_id = '7e8e1e96-c128-42b8-a445-d18281754604';
//    paramsObj = {"request_ref_id":77,"jenkins_job_type":3,"os_type":"Windows","mw_type":"","accessType":"userAccount","UserPrincipalName":"rajesh.ponyaboina@cloud4c.com","mail_id":"rajesh.ponyaboina@cloud4c.com","Roles":"RemoteDesktopUser","role":"RemoteDesktopUser","DomainName":"prg-dc.cloud4c.com","dc":"prg-dc.cloud4c.com","deployment_resource_group_name":"rg-its-spcs-prod-weu-001","subscription_id":"7e8e1e96-c128-42b8-a445-d18281754604","virtual_machine_name":"xa122ws210010","requested_domain":"http://localhost:9891/"};
    
    console.log("buildDataRes ---- ", buildDataRes);
  
    let dbJobSql = `SELECT job_name, job_type FROM azure_jenkin_jobs WHERE record_status=1 and job_name = '${job_name}' limit 1 `;
    console.log("dbJobSql --- ", dbJobSql);
    let dbJobInfo = await dbHandler.executeQueryv2(dbJobSql);
    console.log("dbJobInfo --- ", dbJobInfo);
    if(dbJobInfo && dbJobInfo.length > 0 && dbJobInfo[0].job_type == 4 && buildDataRes.result){
    	let vmUserAccessSql = `SELECT ar.*, cu.email 
	    	FROM azure_user_vm_access_requests as ar
	    	inner join azure_user_vm_access_vm_mapping as avm on avm.request_id = ar.id
	    	inner join c4_vm_details as vd on vd.id = avm.vm_id
	    	inner join c4_client_users as cu on cu.id = ar.cyberArkUserId
	    	WHERE ar.is_revoke_email_sent = 0
	    	and vd.host_name = '${host_name}' 
	    	and ar.subscription = '${subscription_id}' 
	    	and ar.resourceGroup = '${resource_group}'
	    	`;
    	if((paramsObj.UserPrincipalName || paramsObj.mail_id) && (paramsObj.Roles || paramsObj.role)){
    		if(paramsObj.UserPrincipalName){
    			vmUserAccessSql +=` and cu.email = '${paramsObj.UserPrincipalName}' `;
    		}else if(paramsObj.mail_id){
    			vmUserAccessSql +=` and cu.email = '${paramsObj.mail_id}' `;
    		}
    		
    		if(paramsObj.Roles){
    			vmUserAccessSql +=` and ar.role = '${paramsObj.Roles}' `;
    		}else if(paramsObj.role){
    			vmUserAccessSql +=` and ar.role = '${paramsObj.role}' `;
    		}
    		vmUserAccessSql +=` order by id desc limit 1 `;
			console.log("vmUserAccessSql --- ", vmUserAccessSql);
			let vmUserAccessInfo = await dbHandler.executeQueryv2(vmUserAccessSql);
			console.log("vmUserAccessInfo --- ", vmUserAccessInfo);
		    if(vmUserAccessInfo && vmUserAccessInfo.length > 0){
		    	commonModel.getEmailTemplate({template_key:"WINDOWS_SERVER_ACCESS_REVOKED"},async function(error,emailTempRow){
		    		console.log("emailTempRow --- ",JSON.stringify(emailTempRow));
		    		if(emailTempRow.data){
		                let subject = emailTempRow.data.email_subject+` - ${host_name}`;
		                let mailbody = emailTempRow.data.email_body;
		                
		                let vmTable = `<table border='1'>`;
		                vmTable+= `<tr><th>Email</th><td>${vmUserAccessInfo[0].email}</td></tr>`;
		                vmTable+= `<tr><th>Host Name</th><td>${host_name}</td></tr>`;
//		                vmTable+= `<tr><th>Subscription</th><td>${vmUserAccessInfo[0].subscription}</td></tr>`;
		                vmTable+= `<tr><th>Resource Group</th><td>${vmUserAccessInfo[0].resourceGroup}</td></tr>`;
		                vmTable+= `<tr><th>Region</th><td>${vmUserAccessInfo[0].location}</td></tr>`;
		                vmTable+= `<tr><th>Server Type</th><td>${vmUserAccessInfo[0].appType}</td></tr>`;
		                vmTable+=`</table>`;
		                mailbody = mailbody.replace("{{USER_INFO}}", vmTable);
		                mailbody = mailbody.replace("{{ROLE}}", vmUserAccessInfo[0].role);
		                subject = subject.replace("{{ROLE}}", vmUserAccessInfo[0].role);
		                
		                mail.mail({subject : subject, messageBody : mailbody,tomail : vmUserAccessInfo[0].email});
		    		}
		    	});
		    	dbHandler.updateTableData('azure_user_vm_access_requests',{id:vmUserAccessInfo[0].id},{is_revoke_email_sent:1},function(err,result){
		    		console.log(err)
		        });
		    }
    	}
	} else if(dbJobInfo && dbJobInfo.length > 0 && dbJobInfo[0].job_type == 3 && buildDataRes.result){
    	let vmUserAccessSql = `SELECT ar.*, cu.email 
	    	FROM azure_user_vm_access_requests as ar
	    	inner join azure_user_vm_access_vm_mapping as avm on avm.request_id = ar.id
	    	inner join c4_vm_details as vd on vd.id = avm.vm_id
	    	inner join c4_client_users as cu on cu.id = ar.cyberArkUserId
	    	WHERE (ar.is_email_sent = 0 or ar.is_edit_email_sent = 0)
	    	and vd.host_name = '${host_name}' 
	    	and ar.subscription = '${subscription_id}' 
	    	and ar.resourceGroup = '${resource_group}'
	    	`;
    	if((paramsObj.UserPrincipalName || paramsObj.mail_id) && (paramsObj.Roles || paramsObj.role)){
    		if(paramsObj.UserPrincipalName){
    			vmUserAccessSql +=` and cu.email = '${paramsObj.UserPrincipalName}' `;
    		}else if(paramsObj.mail_id){
    			vmUserAccessSql +=` and cu.email = '${paramsObj.mail_id}' `;
    		}
    		
    		if(paramsObj.Roles){
    			vmUserAccessSql +=` and ar.role = '${paramsObj.Roles}' `;
    		}else if(paramsObj.role){
    			vmUserAccessSql +=` and ar.role = '${paramsObj.role}' `;
    		}
    		vmUserAccessSql +=` order by id desc limit 1 `;
			console.log("vmUserAccessSql --- ", vmUserAccessSql);
			let vmUserAccessInfo = await dbHandler.executeQueryv2(vmUserAccessSql);
			console.log("vmUserAccessInfo --- ", vmUserAccessInfo);
		    if(vmUserAccessInfo && vmUserAccessInfo.length > 0){
		    	commonModel.getEmailTemplate({template_key:"WINDOWS_SERVER_ACCESS"},async function(error,emailTempRow){
		    		console.log("emailTempRow --- ",JSON.stringify(emailTempRow));
		    		if(emailTempRow.data){
		                let subject = emailTempRow.data.email_subject+` - ${host_name}`;
		                let mailbody = emailTempRow.data.email_body;
		                
		                let vmTable = `<table border='1'>`;
		                vmTable+= `<tr><th>Email</th><td>${vmUserAccessInfo[0].email}</td></tr>`;
		                vmTable+= `<tr><th>Host Name</th><td>${host_name}</td></tr>`;
//		                vmTable+= `<tr><th>Subscription</th><td>${vmUserAccessInfo[0].subscription}</td></tr>`;
		                vmTable+= `<tr><th>Resource Group</th><td>${vmUserAccessInfo[0].resourceGroup}</td></tr>`;
		                vmTable+= `<tr><th>Region</th><td>${vmUserAccessInfo[0].location}</td></tr>`;
		                vmTable+= `<tr><th>Server Type</th><td>${vmUserAccessInfo[0].appType}</td></tr>`;
		                vmTable+=`</table>`;
		                mailbody = mailbody.replace("{{USER_INFO}}", vmTable);
		                mailbody = mailbody.replace("{{ROLE}}", vmUserAccessInfo[0].role);
		                subject = subject.replace("{{ROLE}}", vmUserAccessInfo[0].role);
		                
		                mail.mail({subject : subject, messageBody : mailbody,tomail : vmUserAccessInfo[0].email});
		    		}
		    	});
		    	dbHandler.updateTableData('azure_user_vm_access_requests',{id:vmUserAccessInfo[0].id},{is_email_sent : 1, is_edit_email_sent : 1},function(err,result){
		    		console.log(err)
		        });
		    }
    	}
	} else if(dbJobInfo && dbJobInfo.length > 0 && dbJobInfo[0].job_type == 1 && buildDataRes.result){
    	let vmCreatedUserSql = `SELECT vc.id, cu.email, vc.cluster_name, vc.is_cluster, vc.request_obj
		    	FROM c4_vm_creation as vc
		    	inner join c4_client_users as cu on cu.id = vc.created_by
		    	WHERE vc.is_email_sent = 0 
		    	and vc.host_name = '${host_name}' 
		    	limit 1 `;
    	console.log("vmCreatedUserSql --- ", vmCreatedUserSql);
    	let vmCreatedUserInfo = await dbHandler.executeQueryv2(vmCreatedUserSql);
        if(vmCreatedUserInfo && vmCreatedUserInfo.length > 0){
        	commonModel.getEmailTemplate({template_key:"VM_PROVISION_STATUS_UPDATE"},async function(error,emailTempRow){
	    		console.log("emailTempRow --- ",JSON.stringify(emailTempRow));
	    		if(emailTempRow.data){
                    let subject = emailTempRow.data.email_subject+ ((vmCreatedUserInfo[0].is_cluster == 0)?" - "+host_name:"");
                    let mailbody = emailTempRow.data.email_body;

//                    let vmTable = "<table border='1'><thead><tr><th>VM Name</th></tr></thead>";
//                	  vmTable+=`<tr><td>${host_name}</td></tr>`;
//                    if(vmCreatedUserInfo[0].is_cluster == 1){
//                    	vmTable+=`<tr><td>${vmCreatedUserInfo[0].cluster_name}</td></tr>`;
//                    }
//                    vmTable+=`</table>`;
                    
                    let vmTable = "";
                    let vm = JSON.parse(vmCreatedUserInfo[0].request_obj);
                	vmTable+=`<h3>#1 : VM Information</h3>`;
                	vmTable+=`<table border='1'><tr><td>VM Name</td><td>${vm.virtual_machine_name}</td></tr>`;
//              		vmTable+=`<tr><td>Subscription Provision Type</td><td>${vm.subscription_provision_type}</td></tr>`;
              		vmTable+=`<tr><td>vCPUS</td><td>${vm.cpus}</td></tr>`;
              		vmTable+=`<tr><td>Memory</td><td>${(vm.ram/1024)} GB</td></tr>`;
              		vmTable+=`<tr><td>OS Storage</td><td>${vm.disksize} GB</td></tr>`;
              		vmTable+=`<tr><td>Subscription</td><td>${((vm.selectedSubscriptionLabel)?vm.selectedSubscriptionLabel:"")}</td></tr>`;
              		vmTable+=`<tr><td>VM Resource Group</td><td>${vm.deployment_resource_group_name}</td></tr>`;
              		vmTable+=`<tr><td>Region</td><td>${((vm.selected_network_location_name)?vm.selected_network_location_name:"")}</td></tr>`;
//              		vmTable+=`<tr><td>Network Resource Group Name</td><td>${vm.network_resource_group_name}</td></tr>`;
              		vmTable+=`<tr><td>Network Identify</td><td>${config.network_identify_arr[vm.network_identify]}</td></tr>`;
              		vmTable+=`<tr><td>Virtual Network Name</td><td>${vm.virtual_network_name}</td></tr>`;
//              		vmTable+=`<tr><td>Subnet Name</td><td>${vm.subnet_name}</td></tr>`;
//              		vmTable+=`<tr><td>NIC Name</td><td>${vm.nic_name}</td></tr>`;
              		vmTable+=`<tr><td>Private IP Address</td><td>${((vm.private_ip_address)?vm.private_ip_address:"")}</td></tr>`;
              		vmTable+=`<tr><td>Managed Disk Name</td><td>${vm.managed_disk_name}</td></tr>`;
                	vmTable+=`<tr><td>Managed Disk Host Caching</td><td>${vm.managed_disk_host_caching}</td></tr>`;
                	vmTable+=`<tr><td>Managed Disk SKU</td><td>${vm.managed_disk_storage_size}</td></tr>`;
                	vmTable+=`<tr><td>Managed Disk Size</td><td>${vm.managed_disk_size}</td></tr>`;
                	vmTable+=`<tr><td>Managed Disk Size Storage Account Type</td><td>${vm.managed_disk_size_storage_account_type}</td></tr>`;
                    vmTable+=`<tr><td>Zone</td><td>${((vm.zone)?vm.zone:"")}</td></tr>`;
                    vmTable+=`<tr><td>Availability Set Name</td><td>${((vm.availability_set_name)?vm.availability_set_name:"")}</td></tr>`;
	                vmTable+=`<tr><td>Environment</td><td>${vm.environment}</td></tr>`;
//	                vmTable+=`<tr><td>System Type</td><td>${vm.system_type}</td></tr>`;
//	                vmTable+=`<tr><td>Storage Account Name</td><td>${vm.storage_account_name}</td></tr>`;
//	                vmTable+=`<tr><td>Ansible IP</td><td>${vm.selected_ansible_server}</td></tr>`;
	                vmTable+=`<tr><td>Is Cluster</td><td>${(vm.is_cluster?"Yes":"No")}</td></tr>`;
                    if(vm.is_cluster == 1){ 
                		vmTable+=`<tr><td>VM 1 NIC Name 2</td><td>${vm.nic_name2}</td></tr>`;
                    	vmTable+=`<tr><td>VM 2 Name</td><td>${vm.virtual_machine_name2}</td></tr>`;
//                    	vmTable+=`<tr><td>VM 2 Subnet Name</td><td>${vm.subnet1_name}</td></tr>`;
//                    	vmTable+=`<tr><td>VM 2 NIC Name 1</td><td>${vm.nic_name3}</td></tr>`;
                    	vmTable+=`<tr><td>VM 2 Private IP Address</td><td>${((vm.private_ip_address2)?vm.private_ip_address2:"")}</td></tr>`;
                    	vmTable+=`<tr><td>VM 2 NIC Name 2</td><td>${vm.nic_name4}</td></tr>`;
                    	vmTable+=`<tr><td>VM 2 Managed Disk Name</td><td>${vm.managed_disk_name2}</td></tr>`;
                    	vmTable+=`<tr><td>VM 2 Managed Disk Host Caching</td><td>${vm.managed_disk_host_caching2}</td></tr>`;
                    	vmTable+=`<tr><td>VM 2 Managed Disk SKU</td><td>${vm.managed_disk_storage_size2}</td></tr>`;
                    	vmTable+=`<tr><td>VM 2 Managed Disk Size</td><td>${vm.managed_disk_size2}</td></tr>`;
                    	vmTable+=`<tr><td>VM 2 Managed Disk Size Storage Account Type</td><td>${vm.managed_disk_size_storage_account_type2}</td></tr>`;
                    	vmTable+=`<tr><td>VM 2 Zone</td><td>${((vm.zone2)?vm.zone2:"")}</td></tr>`;
                    	vmTable+=`<tr><td>VM 2 Availability Set Name</td><td>${((vm.availability_set_name2)?vm.availability_set_name2:"")}</td></tr>`;
                    }
                    if(vm.gallery_name){
//                      	vmTable+=`<tr><td>Gallery Name</td><td>${vm.gallery_name}</td></tr>`;
                    }  
                    if(vm.managed_infra_subscription_id){
//                      	vmTable+=`<tr><td>Managed Infra Subscription ID</td><td>${vm.managed_infra_subscription_id}</td></tr>`;
                    }
                    if(vm.shared_image_name){
                      	vmTable+=`<tr><td>Template Name</td><td>${vm.shared_image_name}</td></tr>`;
                    }
                    if(vm.shared_image_version){
//                      	vmTable+=`<tr><td>Template Version</td><td>${vm.shared_image_version}</td></tr>`;
                    }
                    if(vm.backup_resource_group_name){
//                      	vmTable+=`<tr><td>Backup Resource group</td><td>${vm.backup_resource_group_name}</td></tr>`;
                    }
                    if(vm.recovery_vault_name){
//                      	vmTable+=`<tr><td>Backup Vault Name</td><td>${vm.recovery_vault_name}</td></tr>`;
                    }
                    if(vm.backup_policy){
//                      	vmTable+=`<tr><td>Backup Policy</td><td>${((vm.backup_policy.toLowerCase().indexOf("gold") >= 0)?"GOLD":((vm.backup_policy.toLowerCase().indexOf("silver") >= 0)?"SILVER":((vm.backup_policy.toLowerCase().indexOf("bronze") >= 0)?"BRONZE":vm.backup_policy)))}</td></tr>`;
                    }
                    if(vm.db_full_backup){
//                      	vmTable+=`<tr><td>DB Full Backup Policy</td><td>${vm.db_full_backup}</td></tr>`;
                    }
                    if(vm.db_log_backup){
//                      	vmTable+=`<tr><td>DB Log Backup Policy</td><td>${vm.db_log_backup}</td></tr>`;
                    }
                    if(vm.db_backup){
//                      	vmTable+=`<tr><td>DB Backup Policy</td><td>${vm.db_backup}</td></tr>`;
                    }
//                    if(vm.cyberark_usernames){
//                      	vmTable+=`<tr><td>Cyberark Usernames</td><td>${vm.cyberark_usernames}</td></tr>`;
//                    }
                    if(vm.disk_encryption_name){
//                      	vmTable+=`<tr><td>Disk Encryption Name</td><td>${vm.disk_encryption_name}</td></tr>`;
                    }
                    if(vm.disk_encryption_resource_group_name){
//                      	vmTable+=`<tr><td>Disk Encryption Resource Group Name</td><td>${vm.disk_encryption_resource_group_name}</td></tr>`;
                    }
                    vmTable+=`</table>`;
                    
                    mailbody = mailbody.replace("{{HOST_INFO}}", vmTable);
                    mailbody = mailbody.replace("{{JOB_STATUS}}", buildDataRes.result);
                    
                    mail.mail({subject : subject, messageBody : mailbody,tomail : vmCreatedUserInfo[0].email});
	    		}
	    	});
        	dbHandler.updateTableData('c4_vm_creation',{id:vmCreatedUserInfo[0].id},{is_email_sent:1},function(err,result){
        		console.log(err)
            });
        }
    } else if(dbJobInfo && dbJobInfo.length > 0 && dbJobInfo[0].job_type == 5 && buildDataRes.result){
    	let ojrSql = `SELECT id
	    	FROM other_jenkins_requests
	    	WHERE 1
	    	and jenkins_job_status is NULL
	    	and jenkins_job_type = 5
	    	and ad_group_name = '${paramsObj.ou}'
	    	and ad_email = '${paramsObj.UserPrincipalName}' 
	    	order by id desc
	    	limit 1 `;
		let ojrInfo = await dbHandler.executeQueryv2(ojrSql);
	    if(ojrInfo && ojrInfo.length > 0){
	    	dbHandler.updateTableData('other_jenkins_requests',{id:ojrInfo[0].id},{jenkins_job_status:buildDataRes.result},function(err,result){
	    		console.log(err)
	        });
	    }
    }

    await azureModel.jenkinJobBuildsUpdate({
      job_name, build_id: job_id, resource_group, host_name,
      subscription_id,
      build_info: JSON.stringify(params), status: buildDataRes.result
    });
    res.status(200).send({status: 'Jenkins Build trigger updated in UCP'})
  }
  catch(e) {
    res.status(200).send({ errmsg: e.message})
  }
})

//jenkin Build process in vdi
router.post('/jenkins-build-data', async (req, res) => {
	let UCP_CONSTANTS_DATA = "";
	await commonModel.getOptionConfigJsonData({option_type:"UCP_CONSTANTS"},async function(err, result){
//		console.log("result 1111111 --- ", result);
		if(!err && result.data){
			UCP_CONSTANTS_DATA = result.data;
		}
		console.log("UCP_CONSTANTS_DATA 1111111 --- ", UCP_CONSTANTS_DATA);
	});
	if(!UCP_CONSTANTS_DATA){
		console.log("UCP_CONSTANTS not found");
		res.status(400).send({errmsg: 'Jenkins config missing!'});
		return;
	}
	
  try
  {
    let {job_name, job_id, resource_group = 'NA', host_name='NA', subscription_id='NA'} =req.body,
      jenkinsapi = require('node-jenkins-api'),
      jenkins = jenkinsapi.init(`${UCP_CONSTANTS_DATA.JENKINS.Jenkins_protocal}://${UCP_CONSTANTS_DATA.JENKINS.JenkinsUSERNAME}:${UCP_CONSTANTS_DATA.JENKINS.JenkinsTOKEN}@${UCP_CONSTANTS_DATA.JENKINS.JenkinsURL}`),
      buildDataRes;
    
    if (!job_name || !job_id) {
      res.status(400).send({errmsg: 'Job name or Job Id is missing!'});
      return;
    }
      
    buildDataRes = await new Promise(async function(innerResolve, innerReject){
      jenkins.build_info(job_name, job_id, function(err, buildData) {
        if (err){  
          console.log(err); 
          innerResolve(err);
        }else{
          innerResolve(buildData);
        }
      });
    });

    let actions = buildDataRes.actions,
      params;
      
      if (actions[0] && actions[0].parameters) {
        params = actions[0].parameters
      } else {
        if (actions[1] && actions[1].parameters) {
          params = actions[1].parameters || [];
        }
        else {
          params = [];
        }
      }

    params = params.map((param) => {
      let retObj = {}, {name, value} = param;

      if (name === 'deployment_resource_group_name') {
        resource_group = value;
      }
      if (name === 'virtual_machine_name') {
        host_name = value
      }
      if (name === 'subscription_id') {
        subscription_id = value;
      }
      if (name === 'cyberark_usernames') {
        value = (value || '').replace(/::/g, "--").replace(/@$/g, "++").replace(/:':/g, "--").replace(/'@$/g, "++")
      }
      retObj[name.trim()] = (value || '').trim();
      return retObj;
    });

    res.status(200).send({status: 'Jenkins Build trigger updated in UCP',
      job_name, build_id: job_id, resource_group, host_name,
      build_info: JSON.stringify(params), status: buildDataRes.result
    })
  }
  catch(e) {
    res.status(200).send({ errmsg: e.message})
  }
})

//oat checklist 
router.post('/oat-file-upload', multer().single('oat'), async (req, res) => {
  let file = req.file || {},
  host_name = file.originalname.split('.')[0],
  //oat_checklist_data = file.buffer.toString();
  oat_checklist_data = Buffer.from(file.buffer.toString(), 'base64');
  
  try {
    oat_checklist_data = oat_checklist_data.toString('utf-8');
    oat_checklist_data = (oat_checklist_data || '').replace(/0m/g, '').replace(//g, '')
      .replace(/1;32m/g, '').replace(/undefined:\[/g, '').replace(/1;31m/g, '')
      .replace(/\[/g, '').replace(/'/g, '`').replace(/"/g, '`')
      .replace(/1;33m/g, '').replace(/1;35m/g, '');

    azureModel.updateVMOatDetails({host_name, oat_checklist_data})
    
    let blocks = {}, currentblock = 0,
      is_fail = false, is_heading = '',
			is_tests = '', temp_holder = 0,
      pass = 0, fail = 0, passed_checklist_data = [], failed_checklist_data = [],
      oat_data = oat_checklist_data.split('\n');

	oat_data = oat_data.map(block => {
		let is_fail = false, set_minus = false, present_block= currentblock,
		 numbers, substr = '';

			block = block.trim().replace(/\t/g, ' ');
		if (block) {
			//identify if test number is present
			//if (block.match(/^(?:\d*\.\d{1}|\d+)/)) {
				substr = block.split(' ')[0];
			 substr = substr.split('.');
				//if (block.match(/^(?:\d{1}\.\d{1}[^.])/)) {
				if (substr.length === 2) {
					is_heading = block;
					is_tests = '';
					blocks[is_heading] = {
						text: block,
						is_fail: false,
						is_heading: true,
						submenu: {},
						tests: []
					};
				}
			else {
				//if (block.match(/^(?:\d{1}\.\d{1}\.\d{1})/)) {
				if (substr.length === 3) {
					if (is_heading) {
						is_tests = block;
						blocks[is_heading].submenu[block] = blocks[is_heading].submenu[block] || {
							text: block,
							is_fail: false,
							tests: []
						}
					}
					else {
						is_heading = block;
						is_tests = '';
						blocks[is_heading] = {
							text: block,
							is_fail: false,
							is_heading: true,
							submenu: {},
							tests: []
						};
					}
				}
				else {
					if (block.includes('Pass') || block.includes('Fail')) {
						is_fail = block.includes('Fail');
						if (!is_tests && is_heading && blocks[is_heading]) {
							blocks[is_heading].tests.push(block)
							last_block = blocks[is_heading].tests.length;
							if (is_fail) {
								blocks[is_heading].is_fail = is_fail;
							}
						}
						else {
							blocks[is_heading].submenu[is_tests].tests.push(block);
							last_block = blocks[is_heading].submenu[is_tests].tests;
							if (is_fail) {
								blocks[is_heading].is_fail = is_fail;
								blocks[is_heading].submenu[is_tests].is_fail = is_fail;
							}
						}
					}
					else {
						if (!is_tests && is_heading && blocks[is_heading]) {
							blocks[is_heading].tests[last_block - 1] += '\n' + block;
						}
						else {
							blocks[is_heading].submenu[is_tests].tests[last_block - 1] += '\n' + block;
						}
					}
				}
			}
   return block;
		}
		return null;
	});

	Object.values(blocks).map(block => {
   if (block.is_fail) {
				fail++;
				failed_checklist_data.push(block)
			}
			else{
				pass++;
				passed_checklist_data.push(block)
			}
			return block;
	})

	await appAzureModel.insertOatData({
		oat_checklist_data: JSON.stringify(blocks), pass, fail, 
		passed_checklist_data: JSON.stringify(passed_checklist_data),
		failed_checklist_data: JSON.stringify(failed_checklist_data), host_name
  });
  
  res.status(200).send({pass, fail})
  } catch(e){
    res.status(400).send({errmsg: e.message})
  }  
});

/**API route for adding ad azure users for specific groups to ucp */
router.get('/azure-ad-users', async (req, res) => {
  let config = await azureModel.getADConfig(),
  auth = await azureModel.getAzureADToken(config),
  users = await azureModel.getAzureUsers(Object.assign(config, {auth}));

  res.status(200).send({count: users.length, users})
});

router.get('/syncAdUserRequests', async (req, res) => {
	appAzureModel.syncAdUserRequests(req.query);
  res.status(200).send({success:"running syncAdUserRequests"})
});

/**
 * Cyber ark user account deletion call 
 */
router.delete('/delete-account/:ipaddress', async (req, res) => {
  if (!req.params.ipaddress) {
    res.status(400).send({errmsg: 'IP address required'});
  }
  let cyber = await azureModel.getCyberArkConfig(),
    getCyberDetails = await azureModel.getCyberAPIs(req.params.ipaddress),
    token,
    url = cyber.api + 'Accounts/',
    headers, deletedAccounts = [],
    cyberark_usernames = [],
    process_cyberark_requests = async (itr) => {
      let response;

      process_obj = cyberark_usernames[itr];

      console.log('line 1207-----------------', itr)
      console.log(process_obj);

      if (process_obj) {
        if (process_obj.account_id) {
          response = await deleteAccount(process_obj, 1)
          console.log('-----------1214-----')
          deletedAccounts.push(Object.assign(process_obj, response))
        }
        itr++;
        process_cyberark_requests(itr)
      }
      else {
        console.log('------------------final response--------------')
        console.log(deletedAccounts)
        res.status(200).send({deletedAccounts})
      }
    },
    deleteAccount = async (aObj, loop) => {
      let {account_id, id} = aObj, del_response_obj;
      token = await azureModel.getCyberarkToken(cyber);
      headers = {
        headers: {
          Authorization: token
        },
        httpsAgent: agent
      }

      try {
        del_response_obj = await axios.delete(url + account_id, headers)
        await azureModel.deleteDetails(id);
        return {
          is_deleted: true, status: 204, token, url: url + account_id       
        }
      }
      catch(e) {
        let status = e.response?.status,
          data = e.response?.data;

        if ((status === 401 || status === 409) && loop === 1) {
          token = await azureModel.getCyberarkToken(cyber, true);
          return deleteAccount(aObj, loop+1)
        }
        else {
          if (status === 404 && data.ErrorCode === 'PASWS039E') {
            await azureModel.deleteDetails(id);
            return {
              is_deleted: true, status: 204, token, url: url + account_id       
            }
          } 
          else{
            console.log(1258)
            return {
              data, status, token, url: url + account_id,
              is_deleted: false      
            }
          }
        }
      }
    };

  getCyberDetails = getCyberDetails.map(async rec => {
    cyberark_usernames.push(rec)
  })
  process_cyberark_requests(0);
  return
});


//cyberark code clean upp
router.get('/sync-cyberark-data', async (req, res) => {
  let vms = await azureModel.syncCyberarkData(),
  cyberark = await azureModel.getCyberArkConfig(),
  vm_cyber_details = [],
  process_cyberark_requests = async (itr) => {
    let ip, data = vms[itr], resp;

    if (!data) {
      res.status(200).send({count: vm_cyber_details.length, vm_cyber_details});
      return
    }

    try {
      ip = JSON.parse(data.multiple_ip).ip_address;
    }
    catch(e) {
      ip = null;
    }

    if (ip) {
      data.ip = ip;
      resp = await get_cyberark_data(data);
      vm_cyber_details.push(Object.assign(resp, data));
    }
    else {
      vm_cyber_details.push(Object.assign({
        is_success: false,
        errmsg: 'No IP found'
      }, data));
    }
    process_cyberark_requests(itr+1)
  },
  get_cyberark_data = async (data) => {
    let token = await azureModel.getCyberarkToken(cyberark),
      resp, updates;
      
     try{ 
       console.log(`${data.hostname}, ${data.ip}`, token);
      resp = await axios.get(
        cyberark.api + `Accounts?search=${data.ip}&searchtype=contains`,{
        headers: {
          Authorization: token || 'na'
        },
        httpsAgent: agent
      });

      resp = resp?.data?.value || [];
      updates = resp.map(rec => {
        return dbHandler.executeQueryv2(
          `UPDATE c4_azure_cyberak_info SET account_id=:id, hostname=:hostname, is_updated=1 FROM  WHERE userName=? AND status=1 AND safeName=? AND address=? AND platformId=?`,
        {id: rec.id, hostname: rec.platformAccountProperties.HostName, userName: rec.userName,
          safeName: rec.safeName, platformId: rec.platformId
        });
      })

      updates = await Promise.all(updates);
      if (!resp.length) {
        dbHandler.executeQueryv2(
          `UPDATE c4_azure_cyberak_info SET status=0 FROM  WHERE address=?`,
        {address: data.ip})
      }
      return {
        hostname: data.hostname, ip: data.ip, is_udpated: true,
        data: resp
      };
    }
    catch(e) {
      let status = e.response?.status,
        rep_data = e.response?.data;

      if ((status === 401 || status === 409) && loop === 1) {
        token = await azureModel.getCyberarkToken(cyber, true);
        return get_cyberark_data(data, loop+1)
      }
      else {
        return {
          hostname: data.hostname, ip: data.ip, is_udpated: false,
          data: rep_data
        }
      }
    }
  };

  //res.status(200).send({vms})
  process_cyberark_requests(0);

});

router.get('/delete-cyberark-data', async (req, res) => {
  let cyber = await azureModel.getCyberArkConfig(),
    getCyberDetails = await azureModel.getActiveCyberarkData(req.query.status),
    token,
    url = cyber.api + 'Accounts/',
    headers, deletedAccounts = [],
    process_cyberark_requests = async (itr) => {
      let response;

      process_obj = getCyberDetails[itr];

      if (process_obj) {
        if (process_obj.account_id) {
          response = await deleteAccount(process_obj, 1)
          console.log('-----------1214-----')
          deletedAccounts.push(Object.assign(process_obj, response))
        }
        itr++;

        process_cyberark_requests(itr)
      }
      else {
        res.status(200).send({count:deletedAccounts.length, deletedAccounts})
      }
    },
    deleteAccount = async (aObj, loop) => {
      let {account_id, id} = aObj, del_response_obj;
      token = await azureModel.getCyberarkToken(cyber);
      headers = {
        headers: {
          Authorization: token
        },
        httpsAgent: agent
      }

      try {
        del_response_obj = await axios.delete(url + account_id, headers)
        await azureModel.deleteDetails(id);
        return {
          is_deleted: true, status: 204, account_id, id, token, url
        }
      }
      catch(e) {
        let status = e.response?.status,
          data = e.response?.data;

        if ((status === 401 || status === 409) && loop === 1) {
          token = await azureModel.getCyberarkToken(cyber, true);
          return deleteAccount(aObj, loop+1)
        }
        else {
          if (status === 404 && data.ErrorCode === 'PASWS039E') {
            await azureModel.deleteDetails(id);
            return {
              is_deleted: true, status: 204, token, url: url + account_id       
            }
          } 
          else{
            return {
              data, status, token, url: url + account_id, is_deleted: false     
            }
          }
        }
      }

    };

  process_cyberark_requests(0);
  return
});


router.get('/get-token-info', async (req, res) => {
  let cyber = await azureModel.getCyberarkToken(),
    token = await azureModel.getCyberArkFileInfo();

  res.status(200).send({cyber, token});
});

router.post('/add-cyber-user', async (req, res) => {
  let {userName} = req.body,
  cts = Math.round(new Date().getTime() / 1000),
  cyber = await azureModel.getCyberArkConfig(),
  url = cyber.api + `Users/`,
  token, headers, response, payload = {
    userName,
    "userType": "EPVUser",
    "initialPassword": "c4clou@S" + cts + '$'
  }, is_pvwa_group;

  if (!userName) {
    res.status(400).send({errmsg: "User name missing"});
    return
  }
  else {
    is_pvwa_group = await azureModel.checkADGroup(userName);

    if (!is_pvwa_group) {
      res.status(400).send({errmsg: "User name not in cyberark group"});
      return
    }
  }

  token = await azureModel.getCyberarkToken(cyber);
  headers = {
      headers: {
          Authorization: token || 'na'
     },
     httpsAgent: agent
 };

 try {
	 searchUrl = url+"?search="+userName;
	 console.log("searchUrl --- ", searchUrl);
	 await new Promise(async function(innerResolve, innerReject){
		 request.get({url: searchUrl, headers: headers},
	        async function optionalCallback(err, httpResponse, searchResult) {
	    	  console.log("searchResult --- ", searchResult);
	          if (err) {//0 && 
	              console.log("err --- ", err)
	              innerResolve(err);
	          }else{
//	        	  searchResult = '{"Users":[{"id":198,"username":"rajesh.ponyaboina@cloud4c.com","source":"CyberArk","userType":"EPVUser","componentUser":false,"vaultAuthorization":[],"location":"","personalDetails":{"firstName":"","middleName":"","lastName":""}}],"Total":1}';
	            var searchBody=JSON.parse(searchResult);
	            console.log("searchBody --- ", searchBody);
	            if(searchBody && searchBody.Users && searchBody.Users.length > 0){//0 && 
	            	response = searchBody;
	            	innerResolve(response);
	            }else{
					 response = await axios.post(url, payload, headers);
					 response = response?.data;
//					 response = {"id":198,"username":"rajesh.ponyaboina@cloud4c.com","source":"CyberArk","userType":"EPVUser","componentUser":false,"vaultAuthorization":[],"location":"","personalDetails":{"firstName":"","middleName":"","lastName":""}};
					 console.log("response --- ", response);
					 if(response && response.id){
	            		let userSql = `select id, email from c4_client_users where email = '${userName}' limit 1 `;
	        			console.log("userSql --- ", userSql);
	        			let userRows = await dbHandler.executeQueryv2(userSql);
	        	    	console.log("userRows ---- ", userRows);
	        	    	if(userRows.length > 0){
	        	    		await dbHandler.updateTableData('c4_client_users',{id:userRows[0].id}, {cyberark_user_id: response.id}, async function(err,result){
//										console.log("err 22222 --- ", err);
	        	    			innerResolve(response);
							});
	        	    	}else{
	        	    		innerResolve(response);
	        	    	}
			         }else{
			        	 innerResolve(response);
			         }
	            }
	          }
		 });
	 });
 }
  catch(e){
    console.log(e.response)
    console.log(e.message)
    console.log(e.response?.status)
    console.log(e.response?.data)
      if (e.response?.status === 401 || e.response?.status === 409) {
          token = await azureModel.getCyberarkToken(cyber, true);
          headers = {
              headers: {
                  Authorization: token || 'na'
              },
              httpsAgent: agent
         };

         try {
          response = await axios.post(url, payload, headers);
          response = response?.data;
         }
         catch(e) {
           response = e?.response?.data;
         }
      }
      else {
        response = e?.response?.data;
      }
    }
  console.log("response --- ", response);
  res.status(200).send({response})
});

//**Sync cyberark safe default members */
router.post('/sync-safe-members', async (req, res) => {
  let cyber = await azureModel.getCyberArkConfig(),
   token, safeName = req.body.safeName, url = cyber.api + `Safes/`;
/*
  try {
    token = await azureModel.getCyberarkToken(cyber);
    headers = {
      headers: {
        Authorization: token
      },
     httpsAgent: agent
    };
    outpt = await axios.get(url, headers)
    outpt = outpt?.data?.value || [];
  }
  catch(eer) {
    if (eer.response?.status === 401 || eer.response?.status === 409) {
        token = await azureModel.getCyberarkToken(cyber, true);
        headers = {
          headers: {
            Authorization: token
          },
          httpsAgent: agent
        }

      try {
        outpt = await axios.get(url, headers)
        outpt = outpt?.data?.value || [];
      }
      catch(er2) {
        outpt = er2?.response?.data || er2.message;
      }
    }
    else {
      outpt = eer?.response?.data || eer.messagea;
    }
  }
*/
token = await axios.post(cyber.api + 'auth/Cyberark/Logon', {
  "username": "apiuser",
  "password": "NOV52hxdep6YWKNK8iDp"
},
{httpsAgent: agent}).catch (e => { errmsg = e.response?.status})
token = (token || {}).data;

let obj = await azureModel.cyberarkapiuserMemberAddition(safeName, cyber, token)
res.status(200).send({obj})

})

/* 
Cyber ark account addition post call
*/
router.post('/add-account', async (req, res) => {
  let cyber = await azureModel.getCyberArkConfig(),
    token,
    url = cyber.api + 'Accounts',
    { ipaddress, show_output,
      users, region, hostname, auth_token } = req.body,
    admin = users["UCP-CyberArkSafe-Global-Prod"],
    app = users["UCP-CyberArkSafe-RTP-Prod"],
    application = users["UCP-CyberArkSafe-App-Prod"],
    temp = users["UCP-CyberArkSafe-TEMP"],
    reqObj = {
      name: ipaddress, address: ipaddress, platformId: cyber.platform,
      platformAccountProperties: {
        hostname
      },
      secret: cyber.secret,
      secretType: "password",
      secretManagement: {
        automaticManagementEnabled: true,
        manualManagementReason: ''
      },
      remoteMachinesAccess: {
        remoteMachines: '',
        accessRestrictedToRemoteMachines: true
      }
    },
    headers, is_error = false,
    cyberark_usernames = [],
    cyberark_resp = [],
    managingCPM = region === 'EU' ? 'CPM_EU' : (
      region === 'AP' ? 'CPM_AP' : 'PasswordManager'
    ),
    common, safes,
    process_cyberark_requests = async (itr) => {
      //res.status(200).send({cyberark_usernames});
      let response;

      process_obj = cyberark_usernames[itr];

      console.log('line 1289-----------------', itr)
      console.log(process_obj);

      if (process_obj) {
        if (process_obj.userName) {
          let newObj = {...reqObj};
          newObj.ipaddress = newObj.address;
          newObj = Object.assign(newObj, process_obj);
          response = await addAccount({url, newObj, ipaddress: newObj.ipaddress}, 1)
          console.log('-----------1297-----')
          cyberark_resp.push(Object.assign(newObj, response))
        }
        else {
          response = await azureModel.cyberarkSafeCreation({
            ...process_obj, managingCPM, hostname
          }, 1)
          cyberark_resp.push(Object.assign(process_obj, response))
        }
        itr++;
        process_cyberark_requests(itr)
      }
      else {
        await azureModel.updateVMCyberarkDetails({
          hostname,
           cyberark_data: JSON.stringify(cyberark_resp),
           safe_data: 'na', request_data: JSON.stringify(req.body)
          });
        await azureModel.cyberarkLog({hostname, response: JSON.stringify(req.body),
          payload: JSON.stringify(cyberark_resp),
          statusid: is_error ? 400 : 200,
          title: 'Accounts Creation'});
        console.log('------------------final response--------------')
        console.log(cyberark_resp);
        console.log(JSON.stringify(cyberark_resp));
        if (show_output || true) {
          res.status(200).send({cyberark_resp})
        }
        else {
          res.status(200).send({})
        }
      }
    },
    addAccount = async (aObj, itr) => {
      let {url, newObj, ipaddress} = aObj, resp, headers, token, is_error;

      token = await azureModel.getCyberarkToken(cyber);
      headers = {
        headers: {
          Authorization: token || 'na'
        },
        httpsAgent: agent
      }

      try {
        resp = await axios.post(url, newObj, headers);
      }
      catch(e) {
        is_error = true;
        resp = e.response;
      }

      let status = resp?.status, data = resp?.data;
      if (is_error) {
        if ((status === 401 || status === 409) && itr === 1) {
          token = await azureModel.getCyberarkToken(cyber, true);
          itr++;
          return await addAccount({url, newObj, ipaddress}, itr);
        }
        else {
          let log_error;
          is_error = true;
          try {
            data = JSON.stringify(data) || data;
          }
          catch(e) {
            data = data;
          }
          try {
            await azureModel.updateVMDetails({
              account_id:-2,
              id: -2,
              ipaddress, platformId: newObj.platformId, 
              userName: newObj.userName,
              safeName: newObj.safeName,
              status: -2, hostname,
              comment: data, status_code: status});
          }
          catch(e) {
            log_error = e.message
          }

          return {
            token, url,
            status,
           added: false, data: JSON.parse(data || '{}'), log_error
          }
        }
      }
      else {
        await azureModel.updateVMDetails({...data, 
          ipaddress, 
          comment: "Cyberark inserted",
          status: 1, status_code: 201, hostname});
        return {
          token, data, url,
          added: true
        }
      }
    } 
  if (!region) {
    res.status(400).send({message: 'Region Missing'})
    return;
  }
  if (!ipaddress) {
    res.status(400).send({message: 'IP address Missing'})
    return;
  }


  application = (application || '').split('::');
  admin = (admin || '').split('::');
  app = (app || '').split('::');
  temp = (temp || '').split('::');
  admin = admin.filter(rec => {
    return rec.includes(region);
  })
  admin = admin[0];
  application = application.filter(rec => {
    return rec.includes(region)
  });
  application = application[0];

  app = app.filter(rec => {
    return rec.includes(region);
  });

  reqObj.platformId = cyber.platformId[region]
  app = app[0];
  admin = (admin || '').split('@$') || [];
  app = (app || '').split('@$') || [];
  application = (application || '').split('@$') || [];

  admin = admin.filter(i => i)
  app = app.filter(i => i)
  application = application.filter(i => i);

  if (application.length) {
    cyberark_usernames.push({
      safeName: application[1],
      userName: application[0]
    });
  }

  if (admin.length) {
    cyberark_usernames.push({
    safeName: admin[1],
    userName: admin[0]
    });
  }

  if (app.length) {
    cyberark_usernames.push({
    safeName: app[1],
    userName: app[0]
    });
  }

  common = {
    ipaddress: reqObj.address,
    name: reqObj.name,
    platformId: reqObj.platformId,
    platformAccountProperties: reqObj.platformAccountProperties
  };

  if (temp.length) {
    safes = temp.map(async rec => {
      rec = rec.split('@$');
      cyberark_usernames.push({
        safeName: rec[1],
        userName: rec[0]
        });
        cyberark_usernames.unshift({
          safeName: rec[1]
        })
    });
  }

  cyberark_usernames = cyberark_usernames.filter(user => {
    return (user.userName && user.safeName) || user.safeName;
  });

  console.log(cyberark_usernames)


  process_cyberark_requests(0)
  return
})

router.get('/syncCyberarkUserIdsInDb', function(req, res, next) {
	azureCronModel.syncCyberarkUserIdsInDb(req.query);
	res.status(200).send({success:"running syncCyberarkUserIdsInDb"})
});

router.post('/getVmInitialPwd', function(req, res, next) {
  azureCronModel.getVmInitialPwd(req.body,function(err,result){
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