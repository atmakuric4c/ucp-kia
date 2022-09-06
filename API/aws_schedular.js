const cron = require("node-cron");
const express = require("express");
const cronModel = require('./models/cron_model');
const azureModel = require('./models/azure_model');
const awsModel = require('./models/aws_model');
const gcpModel = require('./models/gcp_model');
const awsDevopsModel = require('./models/aws_devops_model');
app = express();

//# ┌────────────── second (optional)
//# │ ┌──────────── minute
//# │ │ ┌────────── hour
//# │ │ │ ┌──────── day of month
//# │ │ │ │ ┌────── month
//# │ │ │ │ │ ┌──── day of week
//# │ │ │ │ │ │
//# │ │ │ │ │ │
//# * * * * * *
//field	value
//second	0-59
//minute	0-59
//hour	0-23
//day of month	1-31
//month	1-12 (or names)
//day of week	0-7 (or names, 0 or 7 are sunday)

/**
 * AWS crons starts here
 */
cron.schedule("0 */2 * * * *", function() {
    console.log("Running Cron Job For syncAwsVms.");
    awsModel.syncAwsVms([],function(err,result){});
});
cron.schedule("0 0 1 * * * *", function() {
   console.log("Running Cron Job For syncAwsImages.");
   awsModel.syncAwsImages([],function(err,result){});
});
cron.schedule("0 */2 * * * *", function() {
    console.log("Running Cron Job For syncVmStatus.");
    awsModel.syncVmStatus();
 });

cron.schedule("0 0 1 * * *", function() {
    console.log("Running Cron Job For syncInstanceTypes.");
    awsModel.syncInstanceTypes([],function(err,result){});
});

//run daily once at 12:15 AM
cron.schedule("0 15 0 * * *", function() {
    console.log("Running Cron Job For syncAwsServicesUsage.");
    awsModel.syncAwsServicesUsage([],function(err,result){});
});

//run daily once at 12:15 AM
cron.schedule("0 15 0 * * *", function() {
    console.log("Running Cron Job For AWS Cost Forecast.");
    awsModel.sendAWSCostForecastMail();
});

//run daily once at 12:15 AM
cron.schedule("0 15 0 * * *", function() {
    console.log("Running Cron Job For AWS Usage Forecast.");
    awsModel.sendAWSUsageForecastMail();
});

cron.schedule("0 */1 * * *", function() {
    console.log("Running Cron Job For AWS Repo Sync");
    awsDevopsModel.syncClientAWSRepos();
});

cron.schedule("0 */1 * * *", function() {
    console.log("Running Cron Job For AWS Pipeline Sync");
    awsDevopsModel.syncClientAWSPipelines();
});

/**
* AWS crons ends here
*/

app.listen("3131");