const ordersService = require('../services/orders.service');
var ordersModel = require("../models/orders.model.js");
var mail = require('./../../common/mailer.js');
const helper=require('../../helpers/common_helper');
const config=require('../../config/constants')
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');
var base64 = require('base-64');
var md5 = require('md5');
const dbHandler= require('../../config/api_db_handler');

function init(router) {
    router.route('/orders/getAllCloudNames').get(getAllCloudNames);
    router.route('/orders/getAllDCLocations/:id').get(getAllDCLocations);
    router.route('/orders/getCopyTypes/:id').get(getCopyTypes);
    router.route('/orders/getTxnDetails/:id').get(getTxnDetails);
    router.route('/orders/getOsTemplates/:id').get(getOsTemplates);
    router.route('/orders/updateCartItemCount/:id/:count').get(updateCartItemCount);
    router.route('/orders/deleteCartItem/:id').get(deleteCartItem);
    router.route('/orders/getBillingPrice').post(getBillingPrice);
    router.route('/orders/getAddonPrice').post(getAddonPrice);
    router.route('/orders/updatePgiSelection').post(updatePgiSelection);
    router.route('/orders/saveOrderInfo').post(saveOrderInfo);
    router.route('/orders/saveOtherCloudOrderInfo').post(saveOtherCloudOrderInfo);
    router.route('/orders/saveTxnInfo').post(saveTxnInfo);
    router.route('/orders/payFromFunds').post(payFromFunds);
    router.route('/orders/updateCartItemStatus').post(updateCartItemStatus);
    router.route('/orders/updateVmOpsStatus').post(updateVmOpsStatus);
    router.route('/orders/getCartList').post(getCartList);
    router.route('/orders/getApprovalPendingVmOpsList').post(getApprovalPendingVmOpsList);
    router.route('/orders/getApprovalPendingCartList').post(getApprovalPendingCartList);
    router.route('/orders/getTxnSuccessData/:id').get(getTxnSuccessData);
    router.route('/orders/jenkins-build-data').post(getJenkinsBuildInformation);
}

function getAllCloudNames(req,res) {
  ordersService.getAllCloudNames(req).then((data) => {
      res.send(data);
    }).catch((err) => {
//      mail.mail(err);
      res.send(err);
    });
}

function getAddonPrice(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  Object.assign(reqBody, {...req.azureDetails});

  ordersService.getAddonPrice(reqBody,function(err,result){
    if (err) {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query));
    } else {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}

function getCartList(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  Object.assign(reqBody, {
    my_reportees: req.my_reportees,
    manager_resource_groups: req.manager_resource_groups
  })

	  ordersService.getCartList(reqBody).then((data) => {
	    res.send(ucpEncryptDecrypt.ucpEncrypt(data, req.query));
	  }).catch((err) => {
	    // mail.mail(err);
	    res.send(ucpEncryptDecrypt.ucpEncrypt(err, req.query));
	  });
}

function getApprovalPendingVmOpsList(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)); 
    Object.assign(reqBody, {
      my_reportees: req.my_reportees,
      resource_groups: req.resource_groups,
      subscription_resource_group_combo: req.subscription_resource_group_combo,
      is_super_admin : req.is_super_admin
    })
	  ordersService.getApprovalPendingVmOpsList(reqBody).then((data) => {
	    res.send(ucpEncryptDecrypt.ucpEncrypt(data, req.query));
	  }).catch((err) => {
	    // mail.mail(err);
	    res.send(ucpEncryptDecrypt.ucpEncrypt(err, req.query));
	  });
}
 
function getApprovalPendingCartList(req,res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)); 
    Object.assign(reqBody, {
      my_reportees: req.my_reportees,
      resource_groups: req.resource_groups,
      manager_resource_groups: req.manager_resource_groups,
      subscription_resource_group_combo: req.subscription_resource_group_combo,
      is_super_admin : req.is_super_admin
    })
  ordersModel.getApprovalPendingCartList(reqBody).then((data) => {
    res.send(ucpEncryptDecrypt.ucpEncrypt(data));
    // let taxData = {currency:"INR",total:0,tax_percent:0,tax_amount:0,grand_total:0};
  }).catch((err) => {
    // mail.mail(err);
    res.send(ucpEncryptDecrypt.ucpEncrypt(err));
  });
}

function getJenkinsBuildInformation(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));

  Object.assign(reqBody, {
    my_reportees: req.my_reportees,
    resource_groups: req.resource_groups,
    is_super_admin: req.is_super_admin,
    subscriptions: req.subscriptions,
    rbac_matches: req.rbac_matches
  });
  ordersService.getJenkinsBuildInformation(reqBody).then((data) => {
    res.send(ucpEncryptDecrypt.ucpEncrypt(data, req.query));
  }).catch((err) => {
    // mail.mail(err);
    res.send(ucpEncryptDecrypt.ucpEncrypt(err, req.query));
  });
}

function getTxnSuccessData(req,res) {
  let txnId = req.params.id; 
  ordersService.getTxnSuccessData(txnId).then((data) => {
    res.send(data);
    // let taxData = {currency:"INR",total:0,tax_percent:0,tax_amount:0,grand_total:0};
    // data.forEach(function(val,key) {
    //     data[key].cart_config = JSON.parse(val.cart_items);
    //     if(data[key]['cloudid'] == 1 ||data[key]['cloudid'] == 2){
    //       data[key].cart_config.config.ram = (data[key].cart_config.config.ram / 1024);
    //     }
    //     data[key].item_value = helper.financial(val.item_value);
    //     data[key].total_charge = helper.financial(helper.financial(val.item_value) * val.items_count);
    //     taxData.total = taxData.total + (parseFloat(val.item_value) * parseFloat(val.items_count));
    // });
    // taxData.total = helper.financial( taxData.total, 2)
    // taxData.tax_percent = helper.calculateTax({amount:0,currency_id:'1',get_tax:'percent'});
    // taxData.tax_amount = helper.calculateTax({amount:taxData.total,currency_id:'1',get_tax:'amount'});
    // taxData.grand_total = helper.financial( parseFloat(taxData.total) + parseFloat(taxData.tax_amount), 2);
    // let returnData = {items:data,taxData:taxData,orderDetails:{orderid:txnId}}
    //   res.send(returnData);
    }).catch((err) => {
      //mail.mail(err);
      res.send(err);
    });
}

function updateCartItemCount(req,res) {
  let id=req.params.id;
  let count= req.params.count;
  
  console.log(id+'--'+count)
  ordersService.updateCartItemCount(id,count).then((data) => {
    res.send(data);
  }).catch((err) => {
    res.send(err);
  });
}

function deleteCartItem(req,res) {
  let id = req.params.id;
  ordersService.deleteCartItem(id).then((data) => {
    res.send(data);
    }).catch((err) => {
      res.send(err);
    });
}

function saveOrderInfo(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));  
  var bodydata={body:reqBody}
  ordersService.saveOrderInfo(bodydata,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}

function updateCartItemStatus(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
  reqBody= {...reqBody, userDetails: req.userDetails};
  ordersModel.updateCartItemStatus(reqBody,function(err,result){
    if (err) {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}
function updateVmOpsStatus(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)); 
  reqBody= {...reqBody, userDetails: req.userDetails};
  ordersModel.updateVmOpsStatus(reqBody,function(err,result){
    if (err) {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    } else {
    	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}

function updatePgiSelection(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));  
  var bodydata={body:reqBody}
  ordersService.updatePgiSelection(bodydata,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}

function saveOtherCloudOrderInfo(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)),
    azureDetails = req.azureDetails,
    bodydata= {body:reqBody,userDetails: req.userDetails};

  Object.assign(bodydata.body.cart_items, {
    client_id: azureDetails.azure_clientid,
    client_secret: azureDetails.azure_clientsecretkey,
    tenant_id: azureDetails.azure_tenantid,
  });

  ordersService.saveOtherCloudOrderInfo(bodydata,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}, req.query))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
    }
  });
}

function saveTxnInfo(req,res){
  ordersService.saveTxnInfo(req,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}

function payFromFunds(req,res){
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	  reqBody= {...reqBody, userDetails: req.userDetails};
	  var bodydata={body:reqBody}
  ordersService.payFromFunds(bodydata,function(err,result){
    if (err) {
    res.status(200).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}

function getBillingPrice(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  var bodydata={body:reqBody}
  ordersService.getBillingPrice(bodydata,function(err,result){
    let BillingPriceData = {"price":"0","currency":"",billingRow:{},osRow:{}};
    if (err == 2) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(Object.assign(BillingPriceData,{message:result})));
    } else if (err) {
      res.status(400).send(ucpEncryptDecrypt.ucpEncrypt({message:result}));
    } else {
      let formData = reqBody;
      BillingPriceData.billingRow = result.billingRows[0];
      let BillingCycles = {"MONTHLY":"1","QUARTERLY":"3","YEARLY":"12"};
      if(typeof formData.ram != "undefined" && 
            typeof formData.cpu != "undefined" && 
            typeof formData.disk != "undefined"){
        BillingPriceData.price = result.billingRows[0].base_price + (result.billingRows[0].ram * formData.ram) + (result.billingRows[0].core * formData.cpu) + (result.billingRows[0].disk * formData.disk);
      }
      if (typeof result.osRows != "undefined" && result.osRows.length > 0) {
        BillingPriceData.osRow = result.osRows[0];
        BillingPriceData.currency = result.osRows[0].currency_code;
        BillingPriceData.price = BillingPriceData.price + result.osRows[0].os_price;
      }
      BillingPriceData.price = helper.financial(BillingPriceData.price * BillingCycles[formData.billing_type]);
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(BillingPriceData))
    }
  });
}

function getAllDCLocations(req,res) {
  let cloudName=(req.params.id);
  cloudName = base64.decode(cloudName);
  ordersService.getAllDCLocations(cloudName).then((data) => {
      res.send(ucpEncryptDecrypt.ucpEncrypt(data));
    }).catch((err) => {
      res.send(ucpEncryptDecrypt.ucpEncrypt(err));
    });
}

function getCopyTypes(req,res) {
  let vdc_tech_disk_id=(req.params.id);
  vdc_tech_disk_id = base64.decode(vdc_tech_disk_id);
  ordersService.getCopyTypes(vdc_tech_disk_id).then((data) => {
     let returnData = [
       {'key':'1C','value':data[0]['1C']},
       {'key':'2C','value':data[0]['2C']},
       {'key':'3C','value':data[0]['3C']},
       {'key':'4C','value':data[0]['4C']}]
      res.send(ucpEncryptDecrypt.ucpEncrypt(returnData));
    }).catch((err) => {
      //mail.mail(err);
      res.send(ucpEncryptDecrypt.ucpEncrypt(err));
    });
}

function getTxnDetails(req,res) {
	let cts = Math.round(new Date().getTime() / 1000); 
  let txnId = req.params.id; 
  ordersService.getTxnDetails(txnId).then(async (data) => {
	  console.log(data);
      string = data[0].phonestring.replace(' ', '');
      data[0].phonestring = string.replace(/[^A-Za-z0-9]/gi,'');
    
      params = {from:data[0].currency_code, to: 'INR', amount :1};
      console.log("params");
  	  console.log(params);
      await helper.currencyConvert(params, async function(err,conversion_rate){
    	  if(err){
    		  res.send("Invalid Request");
    	  }else{
    		  await dbHandler.updateTableData('c4_transaction_requests',{uid:data[0].uid},{conversion_rate: conversion_rate},async function(updateErr,updateResult){
		    	  data[0].AMOUNT = helper.financial((data[0].requested_amount * conversion_rate),2);
		          if(config.IS_TEST_PAYMENT && config.IS_TEST_PAYMENT == 1){
		            data[0].AMOUNT = "1.00";
		          }
		          data[0].uid = parseInt(data[0].uid);
		          
		          if(data[0].gateway == 'EBS'){
			          data[0].returnurl=config.API_URL+'api/ebsResponse?clientid='+data[0].clientid+'&userid='+data[0].userid+'&DR={DR}';
			          hash = config.EBS_SKEY+"|"+config.EBS_ACCOUNTID+"|"+data[0].AMOUNT+"|"+data[0].uid+"|"+data[0].returnurl+"|"+config.EBS_MODE;
			          data[0].secure_hash = md5(hash);
			          data[0].ACCOUNTID = config.EBS_ACCOUNTID;
			          data[0].MODE = config.EBS_MODE;
			          
			          console.log(data);
			          res.send(data[0]);
		          }else if(data[0].gateway == 'PAYTM'){
		        	  data[0].checkSum = "";
		        	  data[0].ORDER_ID = data[0].uid; // data[0].uid+"_"+cts;
		        	  data[0].CUST_ID = data[0].clientid;
		        	  data[0].INDUSTRY_TYPE_ID = 'Retail';
		        	  data[0].CHANNEL_ID = 'WEB';
		        	  data[0].TXN_AMOUNT = data[0].AMOUNT;
		        	  data[0].PAYTM_TXN_URL = config.PAYTM_TXN_URL;

		        	  data[0].paramList = {};
		        	  // Create an array having all required parameters for creating checksum.
		        	  data[0].paramList.MID = config.PAYTM_MERCHANT_MID;
		        	  data[0].paramList.ORDER_ID = data[0].ORDER_ID;
		        	  data[0].paramList.CUST_ID = data[0].CUST_ID;
		        	  data[0].paramList.INDUSTRY_TYPE_ID = data[0].INDUSTRY_TYPE_ID;
		        	  data[0].paramList.CHANNEL_ID = data[0].CHANNEL_ID;
		        	  data[0].paramList.TXN_AMOUNT = data[0].TXN_AMOUNT;
		        	  data[0].paramList.WEBSITE = config.PAYTM_MERCHANT_WEBSITE;
		        	  data[0].paramList.CALLBACK_URL = config.API_URL + config.PAYTM_RETURN_TXN_URL;

		        	  //Here checksum string will return by getChecksumFromArray() function.
		        	  helper.paytm_genchecksum(data[0].paramList,config.PAYTM_MERCHANT_KEY, function (err, checksum) {
		        		  data[0].checksum = checksum;
		        		  
		        		  console.log(data);
				          res.send(data[0]);
		        	  });
		          }
    		  });
    	  }
      });
  }).catch((err) => {
      res.send(err);
  });
}

function getOsTemplates(req,res) {
  let vdc_tech_disk_id=(req.params.id);
  vdc_tech_disk_id = base64.decode(vdc_tech_disk_id); 
  ordersService.getOsTemplates(vdc_tech_disk_id).then((data) => {
      res.send(ucpEncryptDecrypt.ucpEncrypt(data));
    }).catch((err) => {
      res.send(ucpEncryptDecrypt.ucpEncrypt(err));
    });
}

module.exports.init = init;



