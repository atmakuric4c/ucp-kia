
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

/**
 * GCP crons start here
 */
cron.schedule("0 */4 * * * *", function() {
    console.log("Running Cron Job For syncGcpVms.");
    gcpModel.syncGcpVms([],function(err,result){});
});
cron.schedule("0 0 1 * * *", function() {
    console.log("Running Cron Job For syncGcpImagesList.");
    gcpModel.syncGcpImagesList([],function(err,result){});
});
cron.schedule("0 0 1 * * *", function() {
    console.log("Running Cron Job For syncGcpProjectList.");
    gcpModel.syncGcpProjectList([],function(err,result){});
});
cron.schedule("0 0 1 * * *", function() {
    console.log("Running Cron Job For syncGcpZonesList.");
    gcpModel.syncGcpZonesList([],function(err,result){});
});
cron.schedule("0 0 1 * * *", function() {
    console.log("Running Cron Job For syncMachineTypes.");
    gcpModel.syncMachineTypes([],function(err,result){});
});
cron.schedule("0 0 1 * * *", function() {
    console.log("Running Cron Job For syncNetworkList.");
    gcpModel.syncNetworkList([]);
});
cron.schedule("0 0 1 * * *", function() {
    console.log("Running Cron Job For syncSubnetList.");
    gcpModel.syncSubnetList([],function(err,result){});
});
cron.schedule("0 */3 * * * *", function() {
    console.log("Running Cron Job For syncGcpVmStatus.");
    gcpModel.syncGcpVmStatus([]);
});

//run daily once at 12:05 AM
cron.schedule("0 5 0 * * *", function() {
    console.log("Running Cron Job For syncGcpDatasetsAndTablesList.");
    gcpModel.syncGcpDatasetsAndTablesList([],function(err,result){});
});
//run daily once at 12:30 AM
cron.schedule("0 30 0 * * *", function() {
    console.log("Running Cron Job For syncGcpServicesUsageData.");
    gcpModel.syncGcpServicesUsageData([],function(err,result){});
});
/**
 * GCP crons end here
 */

app.listen("3130");