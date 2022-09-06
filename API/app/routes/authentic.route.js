const authenticService = require("../services/authentic.service");
const ordersService = require('../services/orders.service');
const ordersModel = require('../models/orders.model');
const userService = require('../services/user.service');
var schema = require("../schema/loginValidationSchema.json");
var iValidator = require("../../common/iValidator");
var errorCode = require("../../common/error-code");
var errorMessage = require("../../common/error-methods");
var mail = require("./../../common/mailer.js");
var commonModel = require("./../models/common.model");
const commonService = require("../services/common.service");
const jwt = require("jsonwebtoken");
var db = require('../../config/database');
var dbFunc = require('../../config/db-function');
const dbHandler= require('../../config/api_db_handler');
const md5 = require("md5");
const config=require('../../config/constants');
var base64 = require('base-64');
const helper = require('../../helpers/common_helper');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const azureModel = require('../../models/azure_model');

function init(router) {
  router.route("/login").post(authentic);
  router.route("/adLogin").post(ssoAuthentic);
  router.route("/adLogout").delete(deleteSession);
  router.route("/dev_encrypt").post(dev_encrypt);
  router.route("/dev_decrypt").post(dev_decrypt);
  router.route("/signup").post(signup);
  router.route("/forgotpass").post(forgotpass);
  router.route("/isValidResetHash").post(isValidResetHash);
  router.route('/ebsResponse').post(ebsResponse);
  router.route('/paytmResponse').get(paytmResponse);
  router.route('/resetPassword').post(resetPassword);
  router.route('/verifyGoogleCode').post(verifyGoogleCode);
  router.route('/reset2FA').post(reset2FA);
  router.route('/sendOtp').post(sendOtp);
  router.route('/testSms').get(testSms);
}
async function reset2FA(req,res){
  var username=req.body.email;
  var otp=req.body.otp;
  await dbHandler.getOneRecord('c4_client_users',{last_otp:otp,email:username},async function(user){
    if(!user){
      return res.json({
        qrcode:'',
        secret:'',
        success: false,
        message:"Invalid Otp",
        showQRCode: false
      });
    }else{
      var secret = await speakeasy.generateSecret({
        name: `${config.GOOGLE_AUTH_NAME}-${username}`
      });
      await qrcode.toDataURL(secret.otpauth_url, async (err, qr) => {
        if (err) {
            throw err;
        }
      await dbHandler.updateTableData('c4_client_users',{email:username},{isAddDevice:0,google_auth_code:secret.ascii},function(err,result){
          return res.json({
            qrcode:qr,
            secret:secret.ascii,
            success: true,
            message:"Google Auth Verified successfully",
            showQRCode: false
          });
        });
      });
    }
  })
}
async function sendOtp(req,res){
  var username=req.body.email;
  await dbHandler.getOneRecord('c4_client_users',{email:username},async function(user){
  let otp = helper.getRandomNumber(5);
    var bodystring=`Dear Customer,
    <br/>
    <br/>
    To reset the 2FA, use the otp ${otp}<br/><br/> Thanks<br/>Cloud4C Services,
    <br/>
    <br/>`
    //console.log("bodystring");
    //console.log(bodystring);
    await mail.mail('OTP for 2FA',bodystring,username);
    if(user && user.mobile)
    {
      var mobile=await ucpEncryptDecrypt.ucpDecryptForDb(user.mobile);
      var request = require('request');
		var options = {
		  'method': 'POST',
		  'url': config.ADMIN_DOMAIN+'api/v1/index.php/getSmsTemlateDetailsApi',
		  'headers': {
		    'apikey': config.admincenter_apikey_header,
		    'Content-Type': 'application/json'
		  },
		  body: JSON.stringify({
		    "template_name": "UCP_RESET_2FA_OTP"
		  })

		};
		request(options, async function (error, response) {
		  if (error){ 
//			  throw new Error(error);
		  	console.log(error);
		  }
//		  console.log(response.body);
		  sms_template = JSON.parse(response.body);
	      smsData = {
	        message : `Your OTP for resetting UCP Portal 2FA : ${otp}.`,
	        mobileno : mobile,
	        staffid : user.id,
	        userid : user.id,
	        clientid : user.clientid,
	        template_id : ((sms_template && sms_template.data && sms_template.data.template_id)?sms_template.data.template_id:"")
	      };
	      await helper.sendsms(smsData,function(err,result){
	      });
		});
    }
    await dbHandler.updateTableData('c4_client_users',{email:username},{last_otp:otp},function(err,result){
      return res.json({
        otp:otp,
        success: true,
        message:"Otp has been sent to your email id successfully.",
        showQRCode: false
      });
    });
  })
}
async function verifyGoogleCode(req,res){
  var postdata=req.body;

  var secret=postdata.secret;
  var email=postdata.email;
  var securityCode=postdata.securityCode;
  try{
    verified = await speakeasy.totp.verify({
        secret:secret,
        encoding: 'ascii',
        token: securityCode,
        window: 4
    });

    if(verified)
    {
      await dbHandler.updateTableData('c4_client_users',{email:email},{isAddDevice:1},function(err,result){
        return res.json({
          success: true,
          message:"Google Auth Verified successfully",
          showQRCode: false
        });
      });
      
    }else{
      return res.json({
        success: false,
        message:"Incorrect Google Auth Code",
        showQRCode: true
      });
    }
  }
  catch{
    return res.json({
      success: false,
      message:"The operation did not execute as expected. Please raise a ticket to support",
      showQRCode: true
    });
  }
  
}
function paytmResponse(req,res){
//	ordersModel.PgiResponse(decodeURI(base64.encode(140219)),function(err,result){
//	    console.log("err  "+err);
//	    console.log("result");
//	    console.log(result);
//	});
//	return ;
//	
//	console.log("req.body");
//    console.log(req.body);
//    req.body = {
//    	  BANKTXNID: '',
//    	  CHECKSUMHASH: '0nuR5GgYtcqzbKGLUoWDsojwd59RW622g7ZNldv4QYZrSJPYHEE8im4cBV+BR2BPu+bet9L+s77slr9aaaqryo7VzWQulrzyY1uHRozOTOQ=',
//    	  CURRENCY: 'INR',
//    	  MID: 'Cloud466268762360428',
//    	  ORDERID: '140202_1602071109',
//    	  RESPCODE: '141',
//    	  RESPMSG: 'User has not completed transaction.',
//    	  STATUS: 'TXN_FAILURE',
//    	  TXNAMOUNT: '1.00'
//    	}
////    helper.paytm_genchecksum(data[0].paramList,config.PAYTM_MERCHANT_KEY, function (err, checksum) {
////		  data[0].checksum = checksum;
////		  
////		  console.log(data);
////        res.send(data[0]);
////	  });
//    
//    // verify the checksum
//	var checksumhash = req.body.CHECKSUMHASH;
//	// delete post_data.CHECKSUMHASH;
//    var isValidChecksum = helper.paytm_verifychecksum(req.body, config.PAYTM_MERCHANT_KEY, checksumhash);
//	console.log("Checksum Result => ", isValidChecksum, "\n");
//	if (isValidChecksum == "TRUE") {
//		
//	}
    return res.json({
        success: true,
        message:"Payment successfully",
        showQRCode: false
      });
}
function ebsResponse(req,res){
	let return_status_code = 200; // 307 // 200
  ordersService.ebsResponse(req,function(err,result){

    let FRONTEND_URL = config.FRONTEND_URL;
    if (err) {
      // res.status(400).send({message:result})
    	if (result.client_entity_id && result.client_entity_id == config.COMPANY_ENTITIES['ctrls']) {
    		FRONTEND_URL = config.CTRLS_FRONTEND_URL;
	    }
      let returnUrl = FRONTEND_URL+'txnFailed'
      if(result.TXNID && result.request_type){
        returnUrl += '?TXNID='+result.TXNID+"&request_type="+result.request_type
        if(result.message){
          returnUrl += '&message='+encodeURI(base64.encode(result.message));
        }

        res.redirect(returnUrl);
//        res.writeHead(return_status_code,
//                {Location: returnUrl}
//              );
        res.end();
      }else if (result.client_entity_id) {
    	  returnUrl += '?message='+encodeURI(base64.encode(result.message));
//          res.writeHead(return_status_code,
//                  {Location: returnUrl}
//                );
    	  res.redirect(returnUrl);
          res.end();
      }else if(result.message){
    	  returnUrl += '?message='+encodeURI(base64.encode(result.message));
//    	  res.writeHead(return_status_code,
//                  {Location: returnUrl}
//                );
    	  res.redirect(returnUrl);
          res.end();
//    	  res.sendFile(config.APIPATH+'/index.html');
      }
    } else {
    	if (result.client_entity_id && result.client_entity_id == config.COMPANY_ENTITIES['ctrls']) {
    		FRONTEND_URL = config.CTRLS_FRONTEND_URL;
	    }
      if(result.request_type == "INVOICE"){
        let returnUrl = FRONTEND_URL+'billingInvoices';
        if(result.message){
          returnUrl += '?message='+encodeURI(base64.encode(result.message));
        }
//        res.writeHead(return_status_code,
//          {Location: returnUrl}
//        );
        res.redirect(returnUrl);
        res.end();
      }else if(result.uid){
        let returnUrl = FRONTEND_URL+'txnSuccess/'+result.uid;
        if(result.message){
          returnUrl += '?message='+encodeURI(base64.encode(result.message));
        }
//        res.writeHead(return_status_code,
//          {Location: returnUrl}
//        );
        res.redirect(returnUrl);
        res.end();
      }else{
        let returnUrl = FRONTEND_URL+'txnFailed';
        if(result.TXNID && result.request_type){
          returnUrl += '?TXNID='+result.TXNID+"&request_type="+result.request_type
          if(result.message){
            returnUrl += '&message='+encodeURI(base64.encode(result.message));
          }
//          res.writeHead(return_status_code,
//              {Location: returnUrl}
//            );
          res.redirect(returnUrl);
            res.end();
        }else if (result.client_entity_id) {
    	  returnUrl += '?message='+encodeURI(base64.encode(result.message));
//          res.writeHead(return_status_code,
//                  {Location: returnUrl}
//                );
    	  res.redirect(returnUrl);
          res.end();
        }else if(result.message){
        	returnUrl += '?message='+encodeURI(base64.encode(result.message));
//        	res.writeHead(return_status_code,
//                    {Location: returnUrl}
//                  );
        	res.redirect(returnUrl);
            res.end();
        	//res.sendFile(config.APIPATH+'/index.html');
        }
      }
    // res.status(200).send(result)
    }
  });
}

let dev_encrypt = async (req,res)=>{
	try{
		ucpEncryptDecryptParser = await ucpEncryptDecrypt.ucpEncrypt(req.body, req.query);

		res.status(200).send(ucpEncryptDecryptParser)
	}catch{
		return res.status(500).json({status:"error", success:0, message:"Invalid request"});
    }
}
let dev_decrypt = async (req,res)=>{
	try{
		ucpEncryptDecryptParser = await JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
		res.status(200).send(ucpEncryptDecryptParser)
	}catch{
		return res.status(500).json({status:"error", success:0, message:"Invalid request"});
    }
}
let authentic = async (req,res)=>{
  const requestIp = require('request-ip');
	const clientIp = requestIp.getClientIp(req); 
	try{
		ucpEncryptDecryptParser = await JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	}catch{
		return res.status(500).json(ucpEncryptDecrypt.ucpEncrypt({status:"error", success:0, message:"Invalid request"}, req.query));
    }

	var authenticData = ucpEncryptDecryptParser;
	authenticData = Object.assign({}, authenticData, {clientIp:clientIp});


  authenticService
    .authentic(authenticData)
    .then(async data => {
      console.log("data ----- 1111111111 ", data);
      if (data) {
        var username = data.email;

        const token = jwt.sign(
          { username: username },
          "ucp_portal_secret_key",
          {
            expiresIn: 60 * 60 * 24 * 31
          }
        );
        var profile=await new Promise(function(resolve,reject){
          if(data.user_role==1){
            var sql3=`select * from c4_ucpcustomer_menu where status=1 order by sort_order asc`
            dbHandler.executeQuery(sql3,function(result2){
              resolve({profileInfo:[],menuInfo:result2})
            })
          }else{
          var sql=`select prof.profile_id,prof.profile_name,prof.profile_menu_list,prof.vm_operations,
          prof.dashboard_permissions,prof.is_admin_profile from c4_ucpuser_profile_mapping as map inner join c4_ucpprofile_templates as prof
          on prof.profile_id=map.profile_id where map.user_id='${data.id}' and prof.status=1 and prof.deleted_status=0`;
            dbHandler.executeQuery(sql,async function(resdata){
              if(resdata){
                if(resdata && resdata[0] && resdata[0].profile_menu_list){
                  var profileArr=await new Promise(async function(resolve2,reject2){
                    var jsonArr=await JSON.parse(resdata[0].profile_menu_list)
                    var idsarr=jsonArr.join()
                    var sql3=`select * from c4_ucpcustomer_menu where id in(${idsarr}) and status=1 order by sort_order asc`
                    dbHandler.executeQuery(sql3,function(result2){
                      resolve2({profileInfo:resdata[0],menuInfo:result2})
                    })
                 })
                }else{
                  var profileArr={profileInfo:resdata[0],menuInfo:[]}
                }
                //console.log(result[0].profile_menu_list)
                resolve(profileArr)
              }
              else{
                var sql2=`select prof.profile_id,prof.profile_name,prof.profile_menu_list,prof.vm_operations,
          prof.dashboard_permissions,prof.is_admin_profile from c4_ucpprofile_templates as prof where prof.client_id=0 and 
          prof.profile_name='DefaultProfile' and prof.status=1 and prof.deleted_status=0`;
                await dbHandler.executeQuery(sql2,async function(resdata){
                    if(resdata){
                      if(resdata && resdata[0] && resdata[0].profile_menu_list){
                        var profileArr=await new Promise(async function(resolve2,reject2){
                          var jsonArr=await JSON.parse(resdata[0].profile_menu_list)
                          var idsarr=jsonArr.join()
                          var sql3=`select * from c4_ucpcustomer_menu where id in(${idsarr}) and status=1 order by sort_order asc`
                          dbHandler.executeQuery(sql3,function(result2){
                              resolve2({profileInfo:resdata[0],menuInfo:result2})
                          })
                       })
                      }else{
                        var profileArr={profileInfo:resdata[0],menuInfo:[]}
                      }
                      //console.log(result[0].profile_menu_list)
                      resolve(profileArr)
                    }
                    else resolve([])
                })
              } 
            })
          }
        })
        console.log("data ----- 22222222222", data);
        var gcode=await new Promise(async function(resolve,reject){
            if (data.google_auth_code=='') {
              console.log('New google auth generated')
              //if (!data.google_auth_code) {
              var secret = await speakeasy.generateSecret({
                  name: `${config.GOOGLE_AUTH_NAME}-${username}`
              });
              await qrcode.toDataURL(secret.otpauth_url, async (err, qr) => {
                  if (err) {
                      throw err;
                  }
                 // console.log(gcodeData)
                 await dbHandler.updateTableData('c4_client_users',{email:username},{isAddDevice:0,google_auth_code:secret.ascii},function(err,result){
                    var qrInfo={
                      qrcode:qr,
                      secret:secret.ascii,
                      showQRCode: true
                    }
                    resolve(qrInfo)
                  });
                 
              });
            }else{
              console.log('Existing google auth generated')
              var qrInfo={
                qrcode:'',
                secret:data.google_auth_code,
                showQRCode: true
              }
              resolve(qrInfo)
            }
        })
        if(!data.profile)data.profile=[]
        data.profile=profile

        //return 1
        req.session.username = username;
        return res.json(ucpEncryptDecrypt.ucpEncrypt({
            success: true,
            data,
            token: ucpEncryptDecrypt.ucpEncryptForDb(token)
          }, req.query));
      } else {
        console.log("auth Issue");
      }
    })
    .catch(err => {
      console.log(err)
      // mail.mail(err);
      return res.status(500).json(ucpEncryptDecrypt.ucpEncrypt(err, req.query));
    });
}

let deleteSession = async (req, res) => {
  let sql=`select option_value from c4_option_config where option_type='Azure_AD_Details' limit 1`,
    response = await dbHandler.executeQueryv2(sql);

  response = JSON.parse(response[0].option_value);
  req.session = null;
  res.status(200).json(ucpEncryptDecrypt.ucpEncrypt(
    {ad_azure_logout: response.ad_azure_logout}
    )
  );
}

let ssoAuthentic = async (req, res) => {
	console.log("ssoAuthentic req.body --- ", req.body);
   var sql=`select option_value from c4_option_config where option_type='Azure_AD_Details' limit 1`,
    azure_allowed_users,
    ucpEncryptDecryptParser = await JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)),
    cts = Math.round(new Date().getTime() / 1000);
   console.log("ucpEncryptDecryptParser --- ", ucpEncryptDecryptParser);

    if (!ucpEncryptDecryptParser.code && !ucpEncryptDecryptParser.session_state) {
      res.status(401).send(ucpEncryptDecrypt.ucpEncrypt({errmsg: 'Invalid Azure credentials'}));
      return;
    }
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
			//            logLevel: msal.LogLevel.Verbose,
			        }
			    }
	        
        	};

			const msal = require('@azure/msal-node');
		
			//Create msal application object
			const pca = new msal.ConfidentialClientApplication(adconfig);
		    const tokenRequest = {
		        code: ucpEncryptDecryptParser.code,
		        scopes: ["user.read"],
		        redirectUri: config.azureAd.REDIRECT_URI,
		    };

		    pca.acquireTokenByCode(tokenRequest).then(async (authTokenResponse) => {
		//        res.sendStatus(200);
            var url='https://graph.microsoft.com/v1.0/me',
              accessToken = authTokenResponse.accessToken,
              ad_config = await azureModel.getADConfig(),
              auth = await azureModel.getAzureADToken(ad_config);

            azure_allowed_users = await azureModel.getAzureAllowedUsers(
              Object.assign(ad_config, {auth, ucp_login: true, search:
                (authTokenResponse.account.username || '').toLowerCase()}));
            //azure_allowed_users = await azureModel.getAzureAllowedUsersDB();
            
            azure_allowed_users = azure_allowed_users.filter(userRec => {
              return (userRec.mail || '').toLowerCase() ===
              (authTokenResponse.account.username || '').toLowerCase()
            });

            if (azure_allowed_users.length === 0) {
              res.status(400).send(
                ucpEncryptDecrypt.ucpEncrypt({
                errmsg: 'Please contact your manager for the access'
              }));
              //res.redirect(decodeURIComponent(config.FRONTEND_URL+config.azureAd.error_url)+"&message=Please contact your manager for the access");
              return;
            }
            azure_allowed_users = azure_allowed_users[0] || {};
		        const request=require('request');
		        request.get({url:url, headers : {
		          "Authorization" :'Bearer '+accessToken
		          }},
		        function optionalCallback(err, httpResponse, result) {
		    	  let azureResult=JSON.parse(result);
		          if (err) {
		        	  res.status(400).send(ucpEncryptDecrypt.ucpEncrypt({
                errmsg: 'Please contact your manager for the access'
              }));

		//        	  res.status(200).send({authTokenResponse,err});
		        	  //res.redirect(decodeURIComponent(config.FRONTEND_URL+config.azureAd.error_url)+"&message=Invalid Azure Credentials");
		          }else{

		//        	  res.status(200).send({authTokenResponse,result});
		        	  var sql=`select id from c4_client_users where email='${authTokenResponse.account.username}' limit 1`
		    	      dbHandler.executeQuery(sql,async function(result){
		    	          if(result.length > 0){
		    	        	  let updateData = {
                              azure_ad_response : JSON.stringify({authTokenResponse,azureResult}),
                              azure_account_id: authTokenResponse?.uniqueId,
                              group_id: azure_allowed_users.group_id || ''
                              };
//	                                      console.log('updateData')
//	                                      console.log(updateData)
                              await dbHandler.updateTableData('c4_client_users',{'id':result[0].id},updateData,function(err,updateResult){
                            	  if(err){
                            		  console.log("err --- ", err);
                            	  }
                                req.user_id = result[0].id;
                                adAuthentic(req, res)
                            	  //res.redirect(decodeURIComponent(config.FRONTEND_URL+config.azureAd.success_url)+"&message=Logged in successful");
                              });
		    	          }else{
		    	        	  let cts = Math.round(new Date().getTime() / 1000);    
		  	                var userValues = {
		  	                    email: authTokenResponse.account.username,
		  	                    display_name: azureResult.displayName,
		  	                    mobile: azureResult.mobilePhone,
		  	                    password: "Ctrls@123" + cts,
		  	                    clientid: config.DEMO_CLIENT_ID,
                            client_master_id: config.DEMO_CLIENT_ID,
                            group_id: azure_allowed_users.group_id || '',
		//  	                    user_role: userData.userRole,
		//  	                    bu_id: userData.bu_id,
		//  	                    otp_status: userData.otp_status,
		//  	                    provision_type: userData.provision_type,
		  	                    status: 1,
		  	                    createddate: cts,
		  	                    azure_ad_response : JSON.stringify({authTokenResponse,azureResult}),
                            azure_account_id: authTokenResponse?.uniqueId,
		  	                };
		  	                if(config.enable_user_encryption == 1){
		  		                userValues.display_name = ((userValues.display_name)?(await ucpEncryptDecrypt.ucpEncryptForDb(userValues.display_name)):"");
		  		                userValues.password = ((userValues.password)?(await ucpEncryptDecrypt.ucpEncryptForDb(userValues.password)):"");
		  		                userValues.mobile = ((userValues.mobile)?(await ucpEncryptDecrypt.ucpEncryptForDb(userValues.mobile)):"");
		  	                }else{
		  	                	userValues.password = md5(userValues.password);
		  	                }
		  	                db.query("INSERT INTO c4_client_users SET ?", userValues ,async (error,rows,fields)=>{
		  	                	dbFunc.connectionRelease;
		  	                    if(error) {
		  	                        console.log(error);
		  	                        res.status(400).send(ucpEncryptDecrypt.ucpEncrypt({
		  	                        	errmsg: 'Invalid Azure Credentials'
		  	                        }));
		  	                      //res.redirect(decodeURIComponent(config.FRONTEND_URL+config.azureAd.error_url)+"&message=Invalid Azure Credentials");
		  	                    } else {
		  	                    	//res.redirect(decodeURIComponent(config.FRONTEND_URL+config.azureAd.success_url)+"&message=Logged in successful&userId="+base64.encode (rows.insertId));
		  	                    	req.user_id = rows.insertId;
		  	                    	db.query("INSERT INTO c4_client_user_groups SET ?", {user_id : rows.insertId, group_id: (azure_allowed_users.group_id || ''), created_date : cts} ,async (error,rows,fields)=>{
		  	                    		dbFunc.connectionRelease;
		  	                    		if(error) {
		  	                    			console.log(error);
		  	                    		}
	                                });
	                                adAuthentic(req, res)
		  	                    }
		  	                });
		    	          }
		    	      })
		          }
		        });
		//        res.status(200).send(authTokenResponse);
		    }).catch((error) => {
		        console.log(error);
            res.status(400).send(ucpEncryptDecrypt.ucpEncrypt({
                errmsg: 'Invalid Azure Credentials'
              }));
		        //res.redirect(decodeURIComponent(config.FRONTEND_URL+config.azureAd.error_url)+"&message=Invalid Azure Credentials");
		//        res.status(500).send(error);
		    });
        }else{
      	  console.log("\n err: \n:", err);
          res.status(400).send(ucpEncryptDecrypt.ucpEncrypt({
            errmsg: 'Invalid Azure Credentials'
          }));
//	        	  res.status(200).send({authTokenResponse,err});
      	  //res.redirect(decodeURIComponent(config.FRONTEND_URL+config.azureAd.error_url)+"&message=Invalid Azure Credentials");        	  
      }
  });
}

let adAuthentic = async (req,res)=>{
	console.log("adAuthentic req.body ---- ", req.body);
	const requestIp = require('request-ip');
	const clientIp = requestIp.getClientIp(req);

	let authenticData = Object.assign({
    userId: req.user_id, 
    company_entity: 'cloud'}, {clientIp:clientIp});

  authenticService
    .adAuthentic(authenticData)
    .then(async data => {
      if (data) {
        var username = data.email,
        token = jwt.sign(
          { username: username },
          "ucp_portal_secret_key",
          {
            expiresIn: 60 * 60 * 24 * 31
          }
        );
        var profile=await new Promise(function(resolve,reject){
          if(data.user_role==1){
            var sql3=`select * from c4_ucpcustomer_menu where status=1 order by sort_order asc`
            dbHandler.executeQuery(sql3,function(result2){
              resolve({profileInfo:[],menuInfo:result2})
            })
          }else{
          var sql=`select prof.profile_id,prof.profile_name,prof.profile_menu_list,prof.vm_operations,
          prof.dashboard_permissions,prof.is_admin_profile from c4_ucpuser_profile_mapping as map inner join c4_ucpprofile_templates as prof
          on prof.profile_id=map.profile_id where map.user_id='${data.id}' and prof.status=1 and prof.deleted_status=0`;
            dbHandler.executeQuery(sql,async function(resdata){
              if(resdata){
                if(resdata && resdata[0] && resdata[0].profile_menu_list){
                  var profileArr=await new Promise(async function(resolve2,reject2){
                    var jsonArr=await JSON.parse(resdata[0].profile_menu_list)
                    var idsarr=jsonArr.join()
                    var sql3=`select * from c4_ucpcustomer_menu where id in(${idsarr}) and status=1 order by sort_order asc`
                    dbHandler.executeQuery(sql3,function(result2){
                      resolve2({profileInfo:resdata[0],menuInfo:result2})
                    })
                 })
                }else{
                  var profileArr={profileInfo:resdata[0],menuInfo:[]}
                }
                //console.log(result[0].profile_menu_list)
                resolve(profileArr)
              }
              else{
                var sql2=`select prof.profile_id,prof.profile_name,prof.profile_menu_list,prof.vm_operations,
          prof.dashboard_permissions,prof.is_admin_profile from c4_ucpprofile_templates as prof where prof.client_id=0 and 
          prof.profile_name='DefaultProfile' and prof.status=1 and prof.deleted_status=0`;
                await dbHandler.executeQuery(sql2,async function(resdata){
                    if(resdata){
                      if(resdata && resdata[0] && resdata[0].profile_menu_list){
                        var profileArr=await new Promise(async function(resolve2,reject2){
                          var jsonArr=await JSON.parse(resdata[0].profile_menu_list)
                          var idsarr=jsonArr.join()
                          var sql3=`select * from c4_ucpcustomer_menu where id in(${idsarr}) and status=1 order by sort_order asc`
                          dbHandler.executeQuery(sql3,function(result2){
                              resolve2({profileInfo:resdata[0],menuInfo:result2})
                          })
                       })
                      }else{
                        var profileArr={profileInfo:resdata[0],menuInfo:[]}
                      }

                      resolve(profileArr)
                    }
                    else resolve([])
                })
              } 
            })
          }
        })

        if(!data.profile)data.profile=[]
        data.profile=profile
        //return 1
        req.session.username = username;
        return res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({
            success: true,
            data,
            token: ucpEncryptDecrypt.ucpEncryptForDb(token)
          }, req.query));
      } else {
        
      }
    })
    .catch(err => {
      console.log(err)
      // mail.mail(err);
      return res.status(500).json(ucpEncryptDecrypt.ucpEncrypt(err, req.query));
    });
}

function signup(req, res) {
  var signUpData = req.body;
  //Validating the input entity
  var json_format = iValidator.json_schema(
    schema.postSchema,
    signUpData,
    "signUpData"
  );
  if (json_format.valid == false) {
    return res.status(422).send(json_format.errorMessage);
  }

  authenticService
    .signup(signUpData)
    .then(data => {
      if (data) {
        res.json({
          success: true,
          data: data
        });
      }
    })
    .catch(err => {
      //mail.mail(err);
      res.json(err);
    });
}
function generateRandoChars(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
function forgotpass(req, res){
  var tomail=req.body.email;
  new Promise(function(resolve,reject){
    var pass=generateRandoChars(10);
    resolve(pass)
  }).then(function(pass){
	  if(typeof req.body.company_entity == 'undefined'){req.body.company_entity = 'cloud';}
	  if(typeof config.COMPANY_ENTITIES[req.body.company_entity] != 'undefined'){
		  let sql = "SELECT u.id FROM c4_client_users as u " +
	  		" inner join c4_clients as c on c.id = u.clientid " +
	  		" WHERE u.email='" +tomail +"' and c.client_entity_id='" +config.COMPANY_ENTITIES[req.body.company_entity] +"' and u.status=1";
//		  console.log("sql");
//		  console.log(sql);
		  db.query(sql,(error, rows, fields) => {
			  dbFunc.connectionRelease;
	        if (error) {
	          res.json({
	              success: false,
	              data: "The operation did not execute as expected. Please raise a ticket to support"
	            });
	        } else if (rows.length > 0) {
			    let hash = md5(helper.getRandomString());
			    if(config.COMPANY_ENTITIES[req.body.company_entity] == 1){
			    	url = config.FRONTEND_URL+"login?reset="+hash;
			    }else{
			    	url = config.CTRLS_FRONTEND_URL+"login?reset="+hash;
			    }
			    var bodystring=`Dear Customer,
				    <br/>
				    <br/>
				    To reset your account, kindly click on below url,
				    <br/>
				    <br/>
				    <a href="${url}" target="_blank">${url}</a>`;
				 console.log("bodystring");

			    mail.mail('Forgot Password',bodystring,tomail);
			    db.query(`update c4_client_users set hash_key='${hash}', updateddate = '${(new Date().getTime() / 1000)}' WHERE email ='${tomail}'`,(error,rows,fields)=>{
			    	dbFunc.connectionRelease;
			        if(!!error) {
			            res.json({
			              success: false,
			              data: rows,
			              message: "The operation did not execute as expected. Please raise a ticket to support"
			            });
			        } else {
			            res.json({
			              success: true,
			              data: rows,
			              message: "Reset password link has sent to mail."
			            });
			        }
			    });
	        } else {
	            dbFunc.connectionRelease;
	            res.json({
	              success: false,
	              message: "User doesn't exist!"
	            });
	          } 
		  });
	  }else{
		  res.json({
              success: false,
              message: "Invalid company_entity"
            });
	  }
  })
}

function isValidResetHash(req, res){
  var hash=req.body.hash;
  if(hash && hash != ''){
    new Promise(function(resolve,reject){
      db.query(`SELECT cu.id FROM c4_client_users as cu
        where cu.hash_key = '${hash}' and status=1 order by id asc`,(error,rows,fields)=>{
          if(!!error) {
            dbFunc.connectionRelease;
            res.status(200).send({status : 'error', message : "The operation did not execute as expected. Please raise a ticket to support"})
          } else {
            dbFunc.connectionRelease;
            if (rows.length > 0) {
              res.status(200).send({status : 'success', message : "Valid Hash key"})
            }else{
              res.status(200).send({status : 'error', message : "Invalid Hash key"})
            }
          }
        })
    });
  }else{
    res.status(200).send({status : 'error', message : "Hash key is missing"})
  }
}

function resetPassword(req,res) {
  userService.resetPassword(req,function(err,result){
    if (err) {
    res.status(400).send(result)
    } else {
    res.status(200).send(result)
    }
  });
}

async function testSms(req,res){
  smsData = {
    message : req.query.message,
    mobileno : req.query.mobile,
    template_id : req.query.template_id,
    };
  let result = await new Promise(function(resolve,reject){
	  helper.sendsms(smsData,function(err,result){
		  resolve(result);
	  });
  });
  res.status(200).send(result);
}

module.exports.init = init;
