var express = require("express");
var app = express();
var path = require("path");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
var db = require("./database");
var dbfunc = require("./db-function");
var http = require("http");
var bodyParser = require("body-parser");
var UserRoute = require("../app/routes/user.route");
var IpamRoute = require("../app/routes/ipam.route");
var CommonRoute = require("../app/routes/common.route");
var vmwareRoute = require("../modules/vmware");
var downloadRoute = require("../modules/download");
var cronRouter = require("../modules/cron");
var azureApiRouter = require("../modules/azure");
var crayonApiRouter = require("../modules/crayon");
var awsApiRouter = require("../modules/aws");
var awsDevopsApiRouter = require("../modules/awsDevops");
var gcpApiRouter = require("../modules/gcp");
var msdevopsApiRouter = require("../modules/msdevops");
var AuthenticRoute = require("../app/routes/authentic.route");
var errorCode = require("../common/error-code");
var errorMessage = require("../common/error-methods");
var checkToken = require("./secureRoute");
var supportRoute = require("../app/routes/support.route");
var cors = require("cors");
var ostemplatesRoute = require("../app/routes/ostemplates.route");
var profileRoute = require("../app/routes/profile.route");
var dataStoreRoute = require("../app/routes/datastores.route");
var settingsRoute = require("../app/routes/settings.route");
var vmlistRoute = require("../app/routes/vmlist.route");
var citrixRoute = require("../app/routes/citrix.route");
var azureRoute = require("../app/routes/azure.route");
var awsRoute = require("../app/routes/aws.route");
var awsDevopsRoute = require("../app/routes/awsDevops.route");
var msDevopsRoute = require("../app/routes/msDevops.route");
var gcpDevopsRoute = require("../app/routes/gcpDevops.route");
var gcpRoute = require("../app/routes/gcp.route");
var azureapiRoute = require("../app/routes/azureapi.route");
var vmReportsRoute = require("../app/routes/vmreports.route");
var menusRoute = require("../app/routes/menus.route");
var ticketsRoute = require("../app/routes/tickets.route");
var myshiftRoute = require("../app/routes/myshift.route");
var monitoringRoute = require("../app/routes/monitoring.route");
var ordersRoute = require("../app/routes/orders.route");
var billingRoute = require("../app/routes/billing.route");
var billingRoute = require("../app/routes/billing.route");
var buRoute = require("../app/routes/bu.route");
var roleRoute = require("../app/routes/role.route");
var approvalMatrixRoute = require("../app/routes/approvalMatrix.route");
var securityQuestionsRoute = require("../app/routes/securityQuestions.route");
const schedulerJobs = require("../app/services/scheduler.service");
const env = require('./env');

var jenkinsRoute=require("../modules/jenkins");
// var schedule = require('node-schedule');

// var j = schedule.scheduleJob('*/1 * * * *', function(){
//   console.log('The answer to life, the universe, and everything!');
// });
const cookieSession = require('cookie-session');
const hsts = require('hsts');
const frameguard = require('frameguard');
const referrerPolicy = require('referrer-policy');

app.use(referrerPolicy({ policy: 'same-origin' }));
app.use(frameguard({ action: 'sameorigin' }));
app.use(hsts({
  maxAge: 1555200,//180 days
  includeSubDomains: false
}));

app.set('trust proxy', true);
app.use(cookieSession({
  name: 'session',
  keys: ['WDTNDO4tDs', 'iT6ogDsDV3'],
  // Cookie Options
   maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

  app.use((req, res, next) => {
    var corsWhitelist = env.env === 'dhlonprem' ? [
      'ucp.dhl.com', '10.156.8.9', '10.156.8.6', '10.224.2.132',
      '10.224.2.135', '10.234.14.17', '10.156.8.15', '10.156.8.22',
      '10.156.8.24'
     ] : [
      'demoucp.cloud4c.com', '10.224.2.154', '10.224.2.153'
    ],
    origin = (req.headers.origin || req.headers['x-forwarded-host'] || '');
    
    if (corsWhitelist.indexOf(origin) > -1) {
      res.setHeader('Access-Control-Allow-Origin', `https://${origin}`);
      res.header('Access-Control-Allow-Origin', `https://${origin}`);
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Credentials', true);  
     }
     next();
   });

if (env.is_local) {
  app.use(cors());
  app.options("*", cors());
}
dbfunc.connectionCheck
  .then(data => {
    console.log(data);
  })
  .catch(err => {
    console.log(err);
  });

//   app.use(function(req, res, next) {
//   	if (req.method === 'OPTIONS') {
//   	      console.log('OPTIONS SUCCESS');
//   	      var headers = {};
//   	      // IE8 does not allow domains to be specified, just the *
//   	      // headers["Access-Control-Allow-Origin"] = req.headers.origin;
//   	      headers["Access-Control-Allow-Origin"] = "*";
//   	      headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
//   	      headers["Access-Control-Allow-Credentials"] = false;
//   	      headers["Access-Control-Max-Age"] = '86400'; // 24 hours
//   //	      headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
//   	      headers["Access-Control-Allow-Headers"] = "*";
//   	      res.writeHead(200, headers);
//   	      res.end();
//   	}else{
//   	  res.header("Access-Control-Allow-Origin", "*");
//   	  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS");
//   	  res.header("Access-Control-Allow-Headers", "*");
//   	  if ( req.method === 'OPTIONS' ) {
//   	      console.log('OPTIONS SUCCESS');
//   	      res.end();
//   	  }
//   	  next();
//   	}
//   });
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Expires', '-1');
    res.setHeader('Pragma', 'no-cache');
    res.removeHeader("X-Powered-By");
    res.removeHeader("Server");
  
    next();
  });
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "50mb"
  })
);
app.use(bodyParser.json({ limit: "50mb", extended: true }));
// app.options("*", cors());
var router = express.Router();
app.use("/api", router);
AuthenticRoute.init(router);

var secureApi = express.Router();

//set static folder
app.use(express.static(path.join(__dirname, "public")));

//body parser middleware

app.use("/secureApi", secureApi);
secureApi.use(checkToken);

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("The operation did not execute as expected. Please raise a ticket to support");
});

// index route

var ApiConfig = {
  app: app
};

UserRoute.init(secureApi);
app.use("/vmware", vmwareRoute);
app.use("/cron", cronRouter);
app.use("/azure", azureApiRouter);
app.use("/crayon", crayonApiRouter);
app.use("/aws", awsApiRouter);
app.use("/aws-devops-sync", awsDevopsApiRouter);
app.use("/gcp", gcpApiRouter);
app.use("/msdevops", msdevopsApiRouter);
app.use("/download", downloadRoute);
//app.use("/jenkinsapi",jenkinsapiroute)
IpamRoute.init(secureApi);
CommonRoute.init(secureApi);
profileRoute.init(secureApi);
ostemplatesRoute.init(secureApi);
dataStoreRoute.init(secureApi);
settingsRoute.init(secureApi);
vmlistRoute.init(secureApi);
vmReportsRoute.init(secureApi);
supportRoute.init(secureApi);
monitoringRoute.init(secureApi);
menusRoute.init(secureApi);
ticketsRoute.init(secureApi);
myshiftRoute.init(secureApi);
ordersRoute.init(secureApi);
billingRoute.init(secureApi);
buRoute.init(secureApi);
roleRoute.init(secureApi);
approvalMatrixRoute.init(secureApi);
citrixRoute.init(secureApi);
azureRoute.init(secureApi);
awsRoute.init(secureApi);
gcpRoute.init(secureApi);
azureapiRoute.init(secureApi);
//securityQuestionsRoute.init();
app.use("/securityQuestions", securityQuestionsRoute);
app.use("/aws-devops", awsDevopsRoute);
app.use("/ms-devops", msDevopsRoute);
app.use("/gcp-devops", gcpDevopsRoute);
app.use("/jenkinsapi",jenkinsRoute);

schedulerJobs.startJobs();

app.get('*', (req, res, next) => {
	if ((req.originalUrl.match(/\?([^*]+)\=/gi) || []).length) {
		res.status(404).send();
		return;
	}
	else {
		next();
	}
});
const publicDirectoryPath = path.join(__dirname, './../ui/');
app.use(express.static(publicDirectoryPath));

app.get('*', (req, res) => {
 res.sendFile(publicDirectoryPath + 'index.html');
});
module.exports = ApiConfig;