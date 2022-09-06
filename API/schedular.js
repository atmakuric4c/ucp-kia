const cron = require("node-cron");
const express = require("express");
const cronModel = require('./models/cron_model');
const azureModel = require('./models/azure_model');
const awsModel = require('./models/aws_model');
const gcpModel = require('./models/gcp_model');
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

// schedule tasks to be run on the server
cron.schedule("0 */1 * * * *", function() {
    console.log("Running Cron Job For hypervCreateVm.");
    cronModel.hypervCreateVm([],function(err,result){});
});
//for recent created VM's
cron.schedule("0 */1 * * * *", function() {
    console.log("Running Cron Job For hypervUpdateVmDetails.");
    cronModel.hypervUpdateVmDetails({recent:"yes"},function(err,result){});
});
//cron.schedule("0 0 */1 * * *", function() {
//    console.log("Running Cron Job For hypervUpdateVmDetails.");
//    cronModel.hypervUpdateVmDetails([],function(err,result){});
//});

cron.schedule("0 */4 * * * *", function() {
    console.log("Running Cron Job For preparedUsageData.");
    cronModel.preparedUsageData();
});
cron.schedule("0 */5 * * * *", function() {
    console.log("Running Cron Job For usageReportGeneration.");
    cronModel.usageReportGeneration ();
});

cron.schedule("0 */30 * * * *", function() {
    console.log("Running Cron Job For privateVmSyncing.");
    cronModel.privateVmSyncing ({clientVdcStatus:"1"},function(result){});
});
app.listen("3128");