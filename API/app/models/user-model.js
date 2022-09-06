var db = require('../../config/database');
var dbFunc = require('../../config/db-function');
const dbHandler= require('../../config/api_db_handler');
var md5 = require('md5');
const helper=require('../../helpers/common_helper');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');
const config=require('../../config/constants');
var mail = require("./../../common/mailer.js");
var querystring = require('querystring');
const axios = require('axios');
const securityQuestionsValidations = require('../validations/securityQuestions.validator');

function userOtpVerify(reqBody,callback) {
    return new Promise((resolve,reject) => {
        db.query("SELECT u.* FROM c4_client_users as u " +
        		"where u.id ='"+reqBody.userid+"' and u.last_otp = '"+reqBody.otp+"'",async (error,rows,fields)=>{
        			console.log(rows);
            if(!!error) {
                dbFunc.connectionRelease;
                var res = {status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"};
                resolve(res);
                callback(1,res);
            } else {
                dbFunc.connectionRelease;
                if(rows.length > 0){
                	await dbHandler.updateTableData('c4_login_access',{userid : reqBody.userid, status:1},{status:0,updateddate:Math.round(new Date().getTime() / 1000)},async function(err,result){
	            		console.log("login attempts updated");
        			});
                	var res = {status:"success",message:"OTP is Valid"};
                    resolve(res);
                    callback(1,res);
                }else{
                	var res = {status:"error",message:"Invalid information provided"};
                    resolve(res);
                    callback(1,res);
                }
            }
       });
    });  
}

function resendOtp(reqBody,callback) {
	userid = reqBody.userid;
	if(typeof(userid)=='undefined' || userid==''){
        var response={status:"error",message:'userid is missing'}
        return callback(1,response);
    }
    return new Promise((resolve,reject) => {
        db.query("SELECT u.* FROM c4_client_users as u " +
        		"where u.id ='"+reqBody.userid+"'",async (error,rows,fields)=>{
//        			console.log(rows);
            if(!!error) {
                dbFunc.connectionRelease;
                var res = {status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"};
                resolve(res);
                callback(1,res);
            } else {
                dbFunc.connectionRelease;
                if(rows.length > 0){
                	if(config.enable_user_encryption == 1){
						  rows[0].mobile = ((rows[0].mobile)?(await ucpEncryptDecrypt.ucpDecryptForDb(rows[0].mobile)):"");
					}
                	
                	let otp = helper.getRandomNumber(5);
                	var request = require('request');
					var options = {
					  'method': 'POST',
					  'url': config.ADMIN_DOMAIN+'api/v1/index.php/getSmsTemlateDetailsApi',
					  'headers': {
					    'apikey': config.admincenter_apikey_header,
					    'Content-Type': 'application/json'
					  },
					  body: JSON.stringify({
					    "template_name": "OTPUCP"
					  })

					};
					request(options, function (error, response) {
					  if (error){ 
//						  throw new Error(error);
					  	console.log(error);
					  }
//					  console.log(response.body);
					  sms_template = JSON.parse(response.body);
					  
                	  smsData = {
	              		  message : `Your OTP for UCP Portal Login : ${otp}. Logged in IP : ${reqBody.clientIp} - Cloud4C Services`,
	              		  mobileno : rows[0].mobile,
	              		  staffid : rows[0].id,
	              		  userid : rows[0].id,
	              		  clientid : rows[0].clientid,
	              		  template_id : ((sms_template && sms_template.data && sms_template.data.template_id)?sms_template.data.template_id:"")
                	  };
//                          	  rows[0].email = "rajesh.ponyaboina@cloud4c.com";
                	  dbHandler.updateTableData('c4_client_users',{id:userid},{last_otp:otp},function(err,result){
                		  mail.mail('UCP Cloud4C :: Login OTP Alert !',smsData.message,rows[0].email);
                		  helper.sendsms(smsData,function(err,result){
                			console.log("sms result :: ");
							console.log(result);
                			var res = {status:"success",message:"OTP resent successfully"};
                			callback(null,res);
                          });
                	  });
					});
                }else{
                	var res = {status:"error",message:"Invalid request"};
                    resolve(res);
                    callback(1,res);
                }
            }
       });
    });  
}

function getAllUsers(clientId) {
    return new Promise((resolve,reject) => {
      let sql = `SELECT users.*, bu.bu_name FROM c4_client_users as users
    	  inner join bu_info as bu on bu.id = users.bu_id
        where clientid ='`+config.DEMO_CLIENT_ID+`' order by id desc`;
        db.query(sql,async (error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                var usrelist=[]
                for await(var user of rows) {
                  delete user.password;
                  var profile=await new Promise(function(userRes,userRej){
                    var sql2=`select pro.profile_id,pro.profile_name 
                    from c4_ucpprofile_templates as pro 
                    inner join c4_ucpuser_profile_mapping as map on pro.profile_id=map.profile_id 
                    where pro.client_id=${clientId.id} and map.user_id=${user.id} and pro.status=1 and pro.deleted_status=0 and map.status=1 limit 1`
                    dbHandler.executeQuery(sql2,function(result){
                        if(result){
                          userRes(result[0])
                        }else{
                          userRes('')
                        }
                      })
                  })
                  if(profile && profile.profile_id){
                    await Object.assign(user,{profile_id:profile.profile_id})
                  }else{
                    await Object.assign(user,{profile_id:0})
                  }
                  if(profile && profile.profile_name){
                    await Object.assign(user,{profile_name:profile.profile_name})
                  }else{
                    await Object.assign(user,{profile_name:'NA'})
                  }
                  
                	 if(config.enable_user_encryption == 1){
	                 	user.display_name = ((user.display_name)?(await ucpEncryptDecrypt.ucpDecryptForDb(user.display_name)):"");
	                 	user.phone = ((user.phone)?(await ucpEncryptDecrypt.ucpDecryptForDb(user.phone)):"");
	                 	user.mobile = ((user.mobile)?(await ucpEncryptDecrypt.ucpDecryptForDb(user.mobile)):"");
                	 }
                	 usrelist.push(user);
                }
                resolve(usrelist);
            }
       });
    });
}

function getUserById(id) {
    return new Promise((resolve,reject) => {
        db.query("SELECT users.*,prof_map.profile_id FROM app_client_users as users,app_user_profile_mapping as prof_map  where users.user_role=0 and users.id=prof_map.user_id and users.id ="+id.id,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });
    });  
}

function addUser(userData, userid) {
  return new Promise((resolve,reject) => {

//    if(userData.userRole != '1' && !userData.profile_id){	
//      return resolve({	
//        success: false,	
//        message: "Non-Admin user needs to have a profile"	
//      });	
//    }

    db.query(
      "SELECT * FROM c4_client_users WHERE email='"+userData.userEmail+"' and status=1",
      (error, rows, fields) => {
    	  dbFunc.connectionRelease;
        if (error) {
          resolve(error);
        } else if (rows.length > 0) {
          resolve({
            success: false,
            message: "user already exist with this email! try with different user"
          });
        } else {
          db.query(
            "SELECT * FROM c4_client_users WHERE status=1",
            async (error, rows, fields) => {
            	dbFunc.connectionRelease;
              if (error) {
                resolve(error);
              } else{
            	  let mobileExists = 0;
            	  let i = 1;
            	  for await (const item of rows) {
            		  if(item.mobile){
            			  if(config.enable_user_encryption == 1){
	            			  existedMobileNo = await ucpEncryptDecrypt.ucpDecryptForDb(item.mobile);
	            			  existedPhoneNo = await ucpEncryptDecrypt.ucpDecryptForDb(item.phone);
            			  }else{
            				  existedMobileNo = item.mobile;
	            			  existedPhoneNo = item.phone;
            			  }
            			  if(parseInt(existedMobileNo) == parseInt(userData.userMobile) 
            					  || parseInt(existedPhoneNo) == parseInt(userData.userMobile)){
            				  mobileExists = true;
            				  break;
            			  }
            		  }
            		  i++;
            	  }
            	  if (mobileExists) {
	                resolve({
	                  success: false,
	                  message: "user already exist with this mobile number! try with different user"
	                });
	              } else {
	                let cts = Math.round(new Date().getTime() / 1000);    
	                var userValues = {
	                    email: userData.userEmail,
	                    display_name: userData.userDisplayName,
	                    mobile: userData.userMobile,
	                    password: userData.userPassword,
	                    clientid: userData.clientid,
	                    // google_auth_login: userData.google_auth_login,
	                    client_master_id: userData.client_master_id,
	                    // user_role: userData.userRole,
	                    // bu_id: userData.bu_id,
	                    // otp_status: userData.otp_status,
	                    // provision_type: userData.provision_type,
	                    status: 1,
	                    createddate: cts
	                };
	                if(config.enable_user_encryption == 1){
		                userValues.display_name = ((userValues.display_name)?(await ucpEncryptDecrypt.ucpEncryptForDb(userValues.display_name)):"");
		                userValues.password = ((userValues.password)?(await ucpEncryptDecrypt.ucpEncryptForDb(userValues.password)):"");
		                userValues.mobile = ((userValues.mobile)?(await ucpEncryptDecrypt.ucpEncryptForDb(userValues.mobile)):"");
	                }else{
	                	userValues.password = md5(userValues.password);
	                }
	                db.query("INSERT INTO c4_client_users SET ?", userValues ,async (error,rows,fields)=>{
	                    if(error) {
	                        dbFunc.connectionRelease;
	                        console.log(error);
	                        resolve(error);
	                    } else {
	                        console.log(rows.insertId);
                          dbFunc.connectionRelease;
                          await new Promise((resolve1,reject1) => {
                            var menuValues={
                              user_id:rows.insertId,
                              profile_id:userData.profile_id,
                              created_on: new Date(),
                              created_by: userid,
                              updated_by: userid,
                              updated_on: new Date()
                            }
                            db.query("INSERT INTO c4_ucpuser_profile_mapping SET ?", menuValues ,(error,orderRows,fields)=>{
                              dbFunc.connectionRelease;
                              if(error) {
                                resolve1();
                              } else {
                                resolve1();
                              }
                            });
                         })
	                        resolve({insertId:rows.insertId});
	                    }
	                });
	              }
              }
            });
          }
    });
  });
}


let updateUser= async (id,userData, userid)=>{
    let cts = Math.round(new Date().getTime() / 1000);    
    console.log("userData --- ", userData);
    return new Promise((resolve,reject) => {

//      if(userData.edituserRole != '1' && !userData.editUserProfile){	
//        return resolve({	
//          success: false,	
//          message: "Non-Admin user needs to have a profile"	
//        });	
//      }

      let sql =`UPDATE c4_client_users set status='${userData.edituserStatus}',
      updateddate='${cts}' WHERE id='${userData.id}'`;
      //bu_id ='${userData.editbu_id}',
      // provision_type='${userData.edituserProvisionType}',
      // user_role='${userData.edituserRole}',
      // otp_status='${userData.editotp_status}',
      // google_auth_login='${userData.editgoogle_auth_login}',
      // security_question_enable='${userData.security_question_enable}',
        db.query(sql,async (error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                resolve(error);
            } else {                
                dbFunc.connectionRelease;
                await new Promise((resolve1,reject1) => {
                  if(typeof userData.id =='undefined')resolve1('')
                  dbHandler.getOneRecord('c4_ucpuser_profile_mapping',{user_id:userData.id},function(result){
                    if(result){
                      dbHandler.updateTableData('c4_ucpuser_profile_mapping',{user_id:userData.id},{
                          profile_id:userData.editUserProfile,
                          updated_by: userid,
                          updated_on: new Date()
                        },function(error,result){
                        if(error) {
                          resolve1();
                        } else {
                          resolve1();
                        }
                      });
                    }else{
                      var menuValues={
                        user_id:userData.id,
                        profile_id:userData.editUserProfile,
                        created_on: new Date(),
                        created_by: userid,
                        updated_by: userid,
                        updated_on: new Date()
                      }
                      db.query("INSERT INTO c4_ucpuser_profile_mapping SET ?", menuValues ,(error,orderRows,fields)=>{
                        dbFunc.connectionRelease;
                        if(error) {
                          resolve1();
                        } else {
                          resolve1();
                        }
                      });
                    }
                  })
               })
                resolve({id:userData.id});
            }
       });    
    })
}

let updateLoggedinUserData = async (userData,callback)=>{
    let cts = Math.round(new Date().getTime() / 1000);    
    return new Promise((resolve,reject) => {
          dbHandler.updateTableData('c4_client_users',{id:userData.user_id},{theme_name : userData.theme_name, updateddate : cts},function(error,result){
            if(error) {
            	var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
                resolve(response);
                callback(null,response);
            } else {
            	var response={status:"success",message:'User details updated successfully'}
                resolve(response);
                callback(null,response);
            }
          });
    })
}

function deleteUser(id) {
   return new Promise((resolve,reject) => {
        db.query("DELETE FROM test WHERE id='"+id+"'",(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });    
    });
}

function resetPassword(reqObj,callback) {
  let formData = reqObj.body;
  console.log(formData);
  let cts = Math.round(new Date().getTime() / 1000); 

  return new Promise((resolve,reject) => {
    // perform all neccassary validations
    if (!formData.hash) {
      return callback(1,"Please provide Hash key");
      //resolve(formData);
    }else if (!formData.userPassword) {
      return callback(1,"Please provide Password");
      //resolve(formData);
    }else if (!formData.userPassword) {
      return callback(1,"Please provide Confirm Password");
      //resolve(formData);
    }else if (formData.userPassword !== formData.userCPassword) {
      return callback(1,"Password and Confirm Password don't match");
      //resolve(formData);
    }else {
      db.query(`SELECT * FROM c4_client_users WHERE hash_key ='${formData.hash}' and status=1`,
        async (error, rows, fields) => {
        	dbFunc.connectionRelease;
          //console.log("rows ==== "+JSON.stringify(rows));
          if (error) {
            return callback(1,{status : 'error', "message":"The operation did not execute as expected. Please raise a ticket to support",'error':1000});
            //resolve(error);
          } else {
            if(rows.length > 0){
            	await axios.post(config.ADMIN_DOMAIN+'api/v1/index.php/checkUserPwdPolicy',{validateType:'password_history',user_type:'CLIENT',user_id:rows[0].id,password:formData.userPassword})
        		.then(async response => {
        			//console.log("response");
        			//console.log(response);
        			if(response.data.status=='error'){
//        				return resolve(response.data.message);
        				return callback(1,{"status":"error","message":response.data.message});
        		    //resolve(response.data.message);
        			}else{

                  if(rows[0].security_question_enable){

                    const error = securityQuestionsValidations.validateSecurityAnswersforUser(formData.questions ? formData.questions : []);
                    if (error) return callback(1,{"status":"error","message": error});

                    for(let single_ans of formData.questions){
                      let verify_ans_query = `select * from c4_client_question_ans where user_id = :userid and question_id = :question_id and answer = :answer`;
                      let verify_ans = await dbHandler.executeQueryv2(verify_ans_query, { userid: rows[0].id, question_id: single_ans.question_id, answer: single_ans.answer } );
          
                      if(!verify_ans.length) return callback(1,{"status":"error","message":"could not verify answers"});
                    }
                  }

		            	console.log("formData.userPassword --"+formData.userPassword+"---");
		            	console.log("ucpEncryptDecrypt.ucpEncryptForDb(formData.userPassword) -- "+ucpEncryptDecrypt.ucpEncryptForDb(formData.userPassword));
		            	let updateinfo = {hash_key:"",password:ucpEncryptDecrypt.ucpEncryptForDb(formData.userPassword),updateddate:cts};
		              dbHandler.updateTableData('c4_client_users',{hash_key:formData.hash},updateinfo,async function(error,result){
		                console.log("result");
		                console.log(result);
		                let hisInsData = {
                  			  user_type: 'CLIENT',
                  			  user_id:rows[0].id,
                  			  password:updateinfo.password,
                  			  created_date:Math.round(new Date().getTime() / 1000)
              			  };
              		  await dbHandler.insertIntoTable('c4_user_password_history',hisInsData,function(err,result){
              	        console.log("Pwd History inserted in DB ");
              	    })
		                if(error) {
                      return callback(1,{status : 'error', "message":"The operation did not execute as expected. Please raise a ticket to support",'error':1001});
		                  //resolve({status : 'error', "message":error});
		                } else {
                      var date = new Date();
                      var timestamp = await parseInt(date.getTime()/1000);
                      console.log({userid:rows[0].id,clientid:rows[0].clientid, createddate:timestamp})
                      await dbHandler.updateTableData('c4_access_log',{userid:rows[0].id,clientid:rows[0].clientid,type:'passwordexpired'},{createddate:timestamp},async function(err,result){
                        console.log("c4_access_log");
                      });
		                  return callback(null,{status : 'success', "message":"Password Reset Successful."});
		                  //resolve(result);
		                }
		              });
        			}
        		}).catch(error=>{
        			return callback(1,{"status":'error',"message":`The operation did not execute as expected. Please raise a ticket to support`,'error':1002});
        	    //resolve(error);
        		})
            }else{
              return callback(1,{status : 'error', "message":"Invalid request"});
              //resolve({status : 'error', "message":"Invalid request"});
            }
          }
      });
    }
  });
}

function changePassword(reqObj,callback) {
  let formData = reqObj.body;
  //console.log(formData);
  let cts = Math.round(new Date().getTime() / 1000); 
  return new Promise(async (resolve,reject) => {
    await axios.post(config.ADMIN_DOMAIN+'api/v1/index.php/checkUserPwdPolicy',{validateType:'password_history',user_type:'CLIENT',user_id:formData.user_id,password:formData.userPassword})
		.then(response => {
//			console.log("response");
//			console.log(response);
			if(response.data.status=='error'){
//				return resolve(response.data.message);
				return callback(1,{"status":"error","message":response.data.message});
		      //resolve(response.data.message);
			}else{
				db.query(
			      `SELECT * FROM c4_client_users WHERE id ='${
			        formData.user_id
			      }' and status=1`,
			      (error, rows, fields) => {
			    	  dbFunc.connectionRelease;
			        //console.log("rows ==== "+JSON.stringify(rows));
			        if (error) {
			          return callback(1,{"status":"error","message":"The operation did not execute as expected. Please raise a ticket to support"});
			          //resolve(error);
			        } else {
			          var isMatch=0;
			          if(rows.length >0){
			            if(formData.oldPassword==ucpEncryptDecrypt.ucpDecryptForDb(rows[0].password)){
			            	isMatch=1;
			            }
			            if (isMatch) {
			                // perform all neccassary validations
			                if (formData.userPassword !== formData.userCPassword) {
			                  return callback(1,{"status":"error","message":"Password and Confirm Password don't match"});
			                  //resolve(formData);
			                }else if (formData.oldPassword == formData.userCPassword) {
			                  return callback(1,{"status":"error","message":"New Password and Old Password should not be same"});
			                  //resolve(formData);
			                }else {
			                	console.log("formData.userPassword test--"+formData.userPassword+"--");
			                	console.log("ucpEncryptDecrypt.ucpEncryptForDb(formData.userPassword) --"+ucpEncryptDecrypt.ucpEncryptForDb(formData.userPassword)+"--");
			                	let updateinfo = {password:ucpEncryptDecrypt.ucpEncryptForDb(formData.userPassword),updateddate:cts};
			                	dbHandler.updateTableData('c4_client_users',{id:formData.user_id},updateinfo,async function(error,result){
			                    	 let hisInsData = {
			                    			  user_type: 'CLIENT',
			                    			  user_id:formData.user_id,
			                    			  password:updateinfo.password,
			                    			  created_date:Math.round(new Date().getTime() / 1000)
			                			  };
			                		  await dbHandler.insertIntoTable('c4_user_password_history',hisInsData,function(err,result){
			                	        console.log("Pwd History inserted in DB ");
			                	    })
			                    	if(error) {
			                            return callback(1,{"status":"error","message":"The operation did not execute as expected. Please raise a ticket to support"});
			                            //resolve(error);
			                        } else {
                                var date = new Date();
                                  var timestamp = await parseInt(date.getTime()/1000);
                                  console.log({userid:rows[0].id,clientid:rows[0].clientid, createddate:timestamp})
                                  await dbHandler.updateTableData('c4_access_log',{userid:rows[0].id,clientid:rows[0].clientid, type:'passwordexpired'},{createddate:timestamp},async function(err,result){
                                    console.log("c4_access_log");
                                  });
			                            return callback(null,{"status":"success","message":"Password Changed Successfully."});
			                            //resolve(result);
			                        }
			                      });
			                }
			              } else {
			                return callback(1,{"status":"error","message":"Old Password is wrong."});
			                //resolve(formData);
			              }
			          }else{
			            return callback(1,{"status":"error","message":"User doesnot exist."});
			            //resolve(formData);
			          }
			        }
			      }
			    );
			}
		}).catch(error=>{
			return callback(1,{"status":"error","message":`Password validation failed`});
	    //resolve(error);
		})
  });
}
function getMenuListVMOperations(user_id){
	return new Promise((resolve, reject) => {
    let sql=`SELECT * from c4_client_users where id=${user_id} and status=1`
		dbHandler.executeQuery(sql,function(result){
			if(result && result.length > 0){
        var data=result[0]
					if(data && data.user_role==1){
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
                if(resdata[0] && resdata[0].profile_menu_list){
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
                    if(resdata[0] && resdata[0].profile_menu_list){
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
			}else{
				resolve({success:0,message:'User id is not valid',data:[]})
			}
		})
	})
}

async function getUserByEmail(req, email) {

  let sql = `select * from c4_client_users where email = :email and status = :status`;
  let list = await dbHandler.executeQueryv2(sql, { email: email, status: '1' });

  return list;

}

async function getAzureInfo(id) {
  let sql = `SELECT user.display_name, user.id, user.email, user.bu_id,
  user.provision_type, user.isSuperAdmin, user.group_id, user.clientid,  user.user_role,
  bu.bu_name, com.company_name,com.address,com.city, com.state, com.country, 
  com.currency_id, com.currency_code, com.billing_from_address,
  com.azure_tenantid, com.azure_clientid, com.azure_clientsecretkey, com.azure_resource, com.azure_granttype,
  com.azure_linked, com.aws_username, com.is_aws_enabled, com.is_msdevops_enabled,
  com.gcp_client_id, com.gcp_client_secret_key, com.is_gcp_enabled,
  com.is_support_only,
  acm.empname as acm_name,
  acm.emailid as acm_email,
  acm.contactno as acm_mobile,
  act.id as aws_ref_id,
  act.accesstoken as aws_accesskey, 
  act.secretekey as aws_secretekey,
  ROUND(f.amount, 2) as 'available_funds' 
  FROM c4_client_users as user 
  inner join c4_clients as com on com.id=user.clientid 
  inner join bu_info as bu on bu.id = user.bu_id
  left join staff_users as acm on acm.Id = com.acm_id 
  left join c4_aws_client_tokens as act on (act.clientid = com.id and act.record_status = 1)
  left join c4_client_funds as f on (f.clientid = user.clientid and f.fund_type = 'CLOUD')
  WHERE user.id ='${id}' and user.status=1 and com.client_entity_id = '${config.COMPANY_ENTITIES['cloud']}'`,
  list = await dbHandler.executeQueryv2(sql),
  azureDetails = list[0] || {};

  return Object.assign(azureDetails, {
    tenant_id: azureDetails.azure_tenantid, client_id: azureDetails.azure_clientid,
    client_secret: azureDetails.azure_clientsecretkey
  });
}

/** Getting subcription and resource data of logged user */
async function getUserDetails(id) {

  let sql = `SELECT rp.id, rp.user_id, mapping.subscription_id, mapping.role_id, mapping.resource_group,
    resource.name, rp.is_deleted, resource.id as resource_id FROM resource_group rp
  INNER JOIN resource_group_mapping mapping ON (rp.id=mapping.resource_group_id AND mapping.record_status=1) 
  INNER JOIN c4_azure_resourcegroups resource ON  (resource.id=mapping.resource_group) 
  WHERE rp.record_status=1 AND rp.user_id=:id AND rp.is_deleted=0`,
    list = await dbHandler.executeQueryv2(sql, { id: id });

  return list;

}

/*Check if user is super admin*/
async function isSuperUser(id) {
 let sql = `SELECT * from c4_client_users WHERE isSuperAdmin='1' and id=:id`,
   list = await dbHandler.executeQueryv2(sql, { id: id });

 return (list || []).length;
}

async function getUserReportees(id) {
  let sql = `SELECT user_id from resource_group WHERE report_to=:id AND record_status=1`,
    list = await dbHandler.executeQueryv2(sql, { id: id });

  return list.map(user => user.user_id);
}

module.exports = {
  getAllUsers:getAllUsers,
  addUser:addUser,
  updateUser:updateUser,
  deleteUser:deleteUser,
  getUserById:getUserById,
  resetPassword:resetPassword,
  changePassword:changePassword,
  userOtpVerify,
  resendOtp,getMenuListVMOperations,
  updateLoggedinUserData,
  getUserByEmail: getUserByEmail,
  getUserDetails, isSuperUser, getUserReportees,
  getAzureInfo
};

