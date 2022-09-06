const dbHandler= require('../config/api_db_handler');
var nodemailer = require("nodemailer");
const config=require('../config/constants');
const axios = require('axios');
const querystring = require('querystring');

let mail = async (reqObj)=>{
// function mail(subject,messageBody,tomail) {
	let {subject,messageBody,tomail, ccmails = '', bccmails = '', from_email = ''} = reqObj;
	let emailInsData = {subject:subject,email:tomail,body:messageBody,createddate:Math.round(new Date().getTime() / 1000),status:1};
//	console.log("emailInsData --- ", emailInsData);
	let emailInsDataId = '';
	await dbHandler.insertIntoTable('c4_client_emails_sent',emailInsData,function(err,result){
        console.log("Email inserted in DB ");
        emailInsDataId = result
    })
  if(config.EMAIL_BYPASS == 1){
//    url = 'https://app.cloud4c.com/cronjobs/Generalcurl/sendemail';
    url = config.OLDAPP_PORTAL_URL+'cronjobs/Generalcurl/sendemail';
    let params = {subject : subject,
      body: messageBody,
      bcc : JSON.stringify(config.BCC_EMAILS),
      emailid : tomail
    };

    await axios
    .post(url, querystring.stringify(params))
    .then(async response => {
    	console.log("mail response.data");
    	console.log(response.data);
    }).catch(error => {
    	console.log("mail error.response");
      console.log(error.response);
    });
  }else{
	  let emailConfigSql = `select * from c4c_email_config where status = 1 limit 1 `;
	  console.log("emailConfigSql --- ", emailConfigSql);
	  let emailConfigRows = await dbHandler.executeQueryv2(emailConfigSql);
  	  console.log("emailConfigRows ---- ", emailConfigRows);
  	  if(emailConfigRows.length > 0){
		  let resObj = {};
		  const transporter = nodemailer.createTransport({
			    host: emailConfigRows[0].host_name, //Host
			    port: emailConfigRows[0].smtp_port, // Port 
			    secure: false
		  });
	
		  resObj.mailOptions = {
		      from: ((from_email)?from_email:emailConfigRows[0].email_address), // sender address
		      to: tomail, // list of receivers
		      subject: subject, // Subject line
	//		      text: , // plain text body
		      html: messageBody// html body
		  };
		  if(ccmails){
			  resObj.mailOptions.cc = ccmails;
		  }
		  if(bccmails){
			  resObj.mailOptions.bcc = bccmails;
		  }
		  console.log("resObj.mailOptions ---- ", resObj.mailOptions);
	
		    /**
		     * send mail with defined transport object
		     */
		  await new Promise(async function(resolve,reject){
		    	transporter.sendMail(resObj.mailOptions,
			      (error, info) => {
			    	  console.log("error ---- ", error);
			    	  console.log("info ---- ", info);
			    	  resObj.error = ((typeof error=='object')?error:{error:error});
			    	  resObj.info = ((typeof info=='object')?info:{info:info});
			    	  resolve("");
			    });
		  });
		  if(emailInsDataId){
			  await dbHandler.updateTableData('c4_client_emails_sent',{id:emailInsDataId},{'email_resoponse':JSON.stringify(resObj)},function(err,result){ });
		  }
  	  }
	  
	  /*var smtpTransport = nodemailer.createTransport({
		  service: "gmail", // sets automatically host, port and connection security settings
		  auth: {
		    user: "no-reply@gmail.com",
		    pass: "test"
		  }
		});
    //let messageBodyJson = 'test';//JSON.stringify(messageBody);
    smtpTransport.sendMail({
        //email options
        from: "developer.ctrls@gmail.com", // sender address.  Must be the same as authenticated user if using Gmail.
        to: tomail, // receiver
        subject: subject, // subject
        text: messageBody // body
      },
      function(error, response) {
        //callback
        if (error) {
          console.log('error', error.message);
        } else {
          console.log('success', response);
        }

        //    smtpTransport.close(); // shut down the connection pool, no more messages.  Comment this line out to continue sending emails.
      });*/
  }
}

module.exports = {
  mail: mail
};
