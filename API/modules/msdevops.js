var express = require('express');
var router = express.Router();
const msdevopsModel = require('../models/msdevops_model');
const helper = require('../helpers/common_helper');
const config=require('../config/constants');
const {  errorResponse } = require('../common/error-response');

//sample Localhost url :: http://localhost:9890/gcp/gcpOauth?gcp_client_id=534932766114-ilq5oend23vb5rbdd19e9fl4vbn12lb3.apps.googleusercontent.com&gcp_client_secret_key=GYqFU6gJECNoRNXd88e1NPI0&clientid=222
//sample UAT url :: http://uatucp.cloud4c.com:9890/gcp/gcpOauth?gcp_client_id=534932766114-ab8fjgdefic52qmhcoks17u5sgdla6n3.apps.googleusercontent.com&gcp_client_secret_key=dGa44UKZDavHh-3ZfkVGbqG5&clientid=222
//sample LIVE url :: https://ucpapi.cloud4c.com/gcp/gcpOauth?gcp_client_id=534932766114-ncnt9t8g43cnogumvek67bk0marhm3k7.apps.googleusercontent.com&gcp_client_secret_key=LmOQaUXmZrenu1fdO5rGS2Cp&clientid=222
//sample url :: http://localhost:9890/msdevops/msdevopsOauth?clientid=222
router.get('/msdevopsOauth', function(req, res, next) {
	if(req.query.domain && config.Allowed_Domains.indexOf(req.query.domain) != -1){
//		res.status(200).send("successsssssssssssss");
		msdevopsModel.msdevopsOauth(req,res);
	}else if(!req.query.domain){
		res.status(200).send({"status":"error","message":"Invalid Request."});		
	}else{
//		res.status(200).send("errorrrrrrrrrrrrrrrrr");
		res.redirect(decodeURIComponent(req.query.domain+config.MS_DEVOPS.msdevops_error_url)+"&message=Invalid Request Domain.");		
	}
});

router.get('/msdevopsReturnUrl', function(req, res, next) {
	msdevopsModel.msdevopsReturnUrl(req,function(err,result){
		console.log(result);
		if (err) {
			if(result.redirectUrl){
				res.redirect(decodeURIComponent(result.redirectUrl+config.MS_DEVOPS.msdevops_error_url)+"&message=Invalid Azure DEVOPS Credentials&clientid="+result.clientid);
			}else{
				res.status(200).send({"status":"error","message":"Invalid Request."});
			}
		}else{
			res.redirect(decodeURIComponent(result.redirectUrl+config.MS_DEVOPS.msdevops_success_url)+"&message=Azure DEVOPS Credentials added successfully&clientid="+result.clientid);
		}
	});
});

// sample url :: http://localhost:9890/msdevops/msdevops_authtoken?clientid=222
router.get('/msdevops_authtoken', function(req, res, next) {
	msdevopsModel.msdevops_authtoken(req.query.clientid,function(err,result){
    if (err) {
      res.status(200).send(result)
    } else {
      res.status(200).send(result)
    }
  });
});

router.post('/repository-sync', async function(req, res, next) {
  try{
  
    let projectSync = await msdevopsModel.syncClientMSProjects();
    let repoSync = await msdevopsModel.syncClientMSRepos();
    res.status(200).send(repoSync);

  }
  catch(error){
    errorResponse(res, error);
  }
});


router.post('/pipeline-sync', async function(req, res, next) {
  try{
  
    let projectSync = await msdevopsModel.syncClientMSProjects();
    let repoSync = await msdevopsModel.syncClientMSPipelines();
    res.status(200).send(repoSync);

  }
  catch(error){
    errorResponse(res, error);
  }
});


module.exports = router;
/*netstat -ano | findstr :9890
tskill pinumber  */
//for linux
//pkill -f node