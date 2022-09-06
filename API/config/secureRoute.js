const jwt = require("jsonwebtoken");
const config=require('./constants');
const ucpEncryptDecrypt=require('./ucpEncryptDecrypt');
const dbHandler = require('./api_db_handler');
const userModel = require('../app/models/user-model');
const env = require("./env");
//var db = require('./database');
//var dbFunc = require('./db-function');

module.exports = async function checkToken(req, res, next) {
//	var hw = ucpEncryptDecrypt.ucpEncrypt(JSON.stringify({
//		"clientid" : "222",
//		"projectId" : "cloud4c-automation",
//		"status" : "all"
//	}))
//	console.log(hw)
//	console.log(ucpEncryptDecrypt.ucpDecrypt(hw))
	
//	var hw = ucpEncryptDecrypt.ucpEncrypt(JSON.stringify(req.body));
//	console.log(hw)
//	console.log(ucpEncryptDecrypt.ucpDecrypt(req.body))
//	req.body = ucpEncryptDecrypt.ucpDecrypt(req.body);
//	console.log(req.body);

    var token, session_token = req.session.username;
    token = req.headers["authorization"];
    token = ((token)?token.slice(7, token.length):"");

  // console.log("req.query");
  // console.log(req.query);
  if (req.query.askey && req.query.askey == config.ADMIN_SECURITY_KEY) {
    console.log("askey Token Verified");
    next();
  }else if (token) {

    /*await db.query("SELECT u.* FROM c4_profile_ucpvm_operations as u " +
        		"where u.ref_id in (1,2,3)",async (error,rows,fields)=>{
        		console.log(rows);
            res.status(401).send({ status: 500, message: "Testing" })
       });*/

   if (token) {
    token = ucpEncryptDecrypt.ucpDecryptForDb(token)

    try {
      token = await jwt.verify(token, "ucp_portal_secret_key");
      token = token.username;
    }
    catch(e) {
      res.status(401).send(ucpEncryptDecrypt.ucpEncrypt(JSON.stringify({ status: 500, message: "INVALID TOKEN"})));
      return
    }

    if (typeof token == 'undefined' || token =='') {
      res.status(401).send(ucpEncryptDecrypt.ucpEncrypt(JSON.stringify({ status: 500, message: "INVALID TOKEN" })))
      return;
    }
    
    if (session_token !== token && !env.is_local) {
      res.status(401).send(ucpEncryptDecrypt.ucpEncrypt(JSON.stringify({ status: 500, message: "INVALID Session"})))
      return;
    }
    if (env.is_local) {
      session_token = token;
    }
  
    let user = await userModel.getUserByEmail(req, session_token),
      userId = user[0]['id'],
      is_super_admin = await userModel.isSuperUser(userId),
      userDetails = await userModel.getUserDetails(userId),
      userReportees = await userModel.getUserReportees(userId),
      azureDetails = await userModel.getAzureInfo(userId),
      subscriptions = [], resource_groups = [], manager_resource_groups = [], subscription_resource_group_combo = []
      rbac_matches = {},
      reportees = [userId].concat(userReportees);

      userDetails.map(user => {
        subscriptions.push(`'${user.subscription_id}'`)
        resource_groups.push(`'${user.name}'`);
        subscription_resource_group_combo.push(user.subscription_id+"@$"+user.name+"@$"+user.resource_id);
        rbac_matches[`'${user.subscription_id}'`] = rbac_matches[`'${user.subscription_id}'`] || [];
        rbac_matches[`'${user.subscription_id}'`].push(`'${user.name}'`);
        if (user.role_id === 3) {
          manager_resource_groups.push(`'${user.name}'`);
        }
        return user;
      });

      if (!manager_resource_groups.length) {
        manager_resource_groups.push(-1)
      }

      req.clientid = user[0]['clientid'];
      req.userid = userId;
      req.subscription_resource_group_combo = subscription_resource_group_combo;
      req.subscriptions = is_super_admin? undefined: subscriptions.join(',');
      req.resource_groups = is_super_admin? undefined: resource_groups.join(',');
      req.manager_resource_groups = is_super_admin? undefined: manager_resource_groups.join(', ');
      req.my_reportees = is_super_admin? undefined: reportees.join(',');
      req.rbac_matches = rbac_matches;
      req.is_super_admin = is_super_admin;
      req.azureDetails = azureDetails;
      req.userDetails = user[0];
//      console.log("user[0] --- ",JSON.stringify(user[0]));

      next();
    }
  //});
  } else {
    res.status(401).send({
      status: 500,
      message: "NO TOKEN PROVIDE",
      error: "token must be provide in header for endpoint access"
    });
    /* res.json({
      status: 500,
      message: "NO TOKEN PROVIDE",
      error: "token must be provide in header for endpoint access"
    }); */
  }
};
