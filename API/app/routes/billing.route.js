const billingService = require('../services/billing.service');
var mail = require('./../../common/mailer.js');
const helper=require('../../helpers/common_helper');
const config=require('../../config/constants')
var md5 = require('md5');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');

function init(router) {
    router.route('/billing/getOrderList/:id').get(getOrderList);
    router.route('/billing/getInvoiceList/:id').get(getInvoiceList);
    router.route('/billing/getTransactionsList/:id').get(getTransactionsList);
    router.route('/billing/getPaymentsList/:id').get(getPaymentsList);
    router.route('/billing/payInvoice').post(payInvoice);
    router.route('/billing/getOrderDetails').post(getOrderDetails);
    router.route('/billing/viewHourlyReport').post(viewHourlyReport);
    router.route('/billing/downloadHourlyReport').post(downloadHourlyReport);
}

function getOrderList(req,res){
  billingService.getOrderList(req,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}));
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result));
    }
  });
}

let getOrderDetails = async (req,res)=>{
	try{
		ucpEncryptDecryptParser = await JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	}catch{
		return res.status(500).json(ucpEncryptDecrypt.ucpEncrypt({status:"error", success:0, message:"Invalid request"}, req.query));
    }
	var orderData = ucpEncryptDecryptParser;
  billingService.getOrderDetails(orderData,function(err,result){
//	  console.log("result");
//	    console.log(result);
	  if (err) {
		    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}));
	  } else {
		    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result));
	  }
  });
}

let viewHourlyReport = async (req,res)=>{
	try{
		ucpEncryptDecryptParser = await JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	}catch{
		return res.status(500).json(ucpEncryptDecrypt.ucpEncrypt({status:"error", success:0, message:"Invalid request"}, req.query));
    }
	var orderData = ucpEncryptDecryptParser;
  billingService.viewHourlyReport(orderData,function(err,result){
	  if (err) {
		    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}));
	  } else {
		    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result));
	  }
  });
}

let downloadHourlyReport = async (req,res)=>{
	try{
		ucpEncryptDecryptParser = await JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	}catch{
		return res.status(500).json(ucpEncryptDecrypt.ucpEncrypt({status:"error", success:0, message:"Invalid request"}, req.query));
    }
	var orderData = ucpEncryptDecryptParser;
  billingService.downloadHourlyReport(orderData,function(err,result){
	  if (err) {
		    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}));
	  } else {
		    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result));
	  }
  });
}

function payInvoice(req,res){
  billingService.payInvoice(req,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}

function getInvoiceList(req,res){
  billingService.getInvoiceList(req,function(err,result){
	  if (err) {
		    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}));
	  } else {
		    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result));
	  }
  });
}

function getTransactionsList(req,res){
  billingService.getTransactionsList(req,function(err,result){
	  if (err) {
		    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}));
	  } else {
		    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result));
	  }
  });
}

function getPaymentsList(req,res){
  billingService.getPaymentsList(req,function(err,result){
	  if (err) {
		    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}));
	  } else {
		    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result));
	  }
  });
}



module.exports.init = init;