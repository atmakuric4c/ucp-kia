const cron = require("node-cron");
const express = require("express");
const azureModel = require('./models/azure_model');
const appAzureModel = require('./app/models/azure.model');
const azureCronModel = require('./models/azure_cron_model');
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
 * AZURE crons starts here
 */
cron.schedule("0 0 * * * 6", function() {
    console.log("Running Cron Job For getAzureSubscriptionList.");
    azureModel.getAzureSubscriptionList([],function(err,result){});
});
cron.schedule("0 5 0 * * 6", function() {
    console.log("Running Cron Job For getAzureSubscriptionWiseLocationList.");
    azureModel.getAzureSubscriptionWiseLocationList([],function(err,result){});
});
cron.schedule("0 10 0 * * 6", function() {
    console.log("Running Cron Job For getAzureCatalog.");
    azureModel.getAzureCatalog([],function(err,result){});
});
cron.schedule("0 15 * * * *", function() {
    console.log("Running Cron Job For getAzureResourceGroups.");
    azureModel.getAzureResourceGroups([],function(err,result){});
});
cron.schedule("0 */5 * * * *", function() {
    console.log("Running Cron Job For syncAdUserRequests.");
    appAzureModel.syncAdUserRequests([]);
});
//cron.schedule("0 */40 * * * *", function() {
//    console.log("Running Cron Job For getAzureSubscriptionWiseOsTemplatesList.");
//    azureModel.getAzureSubscriptionWiseOsTemplatesList([],function(err,result){});
//});
cron.schedule("0 */20 * * * *", function() {
    console.log("Running Cron Job For sync azure VmList.");
    azureModel.syncVmList([]);
});
cron.schedule("0 */5 * * * *", function() {
    console.log("Running Cron Job For sync latest azure VMs.");
    appAzureModel.syncLatestVms([]);
});
cron.schedule("0 2 * * * *", function() {
    console.log("Running Cron Job For sync azure syncVmStatus.");
    azureModel.syncVmStatus([]);
});
cron.schedule("0 */5 * * * *", function() {
    console.log("Running Cron Job For sync azure syncJenkinJobsStatus.");
    appAzureModel.syncJenkinJobsStatus({job_type:2});
});
cron.schedule("0 */5 * * * *", function() {
    console.log("Running Cron Job For sync azure syncJenkinJobsStatus.");
    appAzureModel.syncJenkinJobsStatus({job_type:1});
});
cron.schedule("0 */5 * * * *", function() {
    console.log("Running Cron Job For sync azure syncJenkinJobsStatus.");
    appAzureModel.syncJenkinJobsStatus({job_type:8});
});
cron.schedule("0 30 23 * * *", function() {
    console.log("Running Cron Job For syncVirtualNetwork.");
    azureModel.syncVirtualNetwork({});
});
cron.schedule("0 30 23 * * *", function() {
    console.log("Running Cron Job For syncVmBackupVaultNames.");
    azureModel.syncVmBackupVaultNames({});
});
cron.schedule("0 30 23 * * *", function() {
    console.log("Running Cron Job For syncStorageAccountNames.");
    azureModel.syncStorageAccountNames({});
});
cron.schedule("0 30 * * * *", function() {
    console.log("Running Cron Job For syncAvailabilitySets.");
    azureModel.syncAvailabilitySets({});
});

cron.schedule("0 10 */2 * * *", function() {
    console.log("Running Cron Job For syncVmBackupStatus.");
    azureModel.syncVmBackupStatus([]);
});

cron.schedule("0 */5 * * * *", function() {
  console.log("Running Cron Job For syncVmsInCmdb.");
  azureModel.syncVmsInCmdb([]);
});

cron.schedule("0 15 * * * 6", function() {
  console.log("Running Cron Job For syncGalleryImageVersions.");
  azureModel.syncGalleryImageVersions([]);
});

//run saturday once at 03:15 AM
cron.schedule("0 15 3 * * 6", function() {
  console.log("Running Cron Job For syncStorageSkus.");
  azureModel.syncStorageSkus([]);
});

//run daily once at 03:15 AM
cron.schedule("0 15 3 * * *", function() {
	console.log("Running Cron Job For syncCmdbBusinessUnits.");
	azureModel.syncCmdbBusinessUnits([]);
});

//run daily once at 03:15 AM
cron.schedule("0 15 3 * * *", function() {
	console.log("Running Cron Job For syncCmdbCountries.");
	azureModel.syncCmdbCountries([]);
});

//run daily once at 03:15 AM
cron.schedule("0 15 3 * * *", function() {
	console.log("Running Cron Job For syncCmdbRegions.");
	azureModel.syncCmdbRegions([]);
});

//run daily once at 03:15 AM
cron.schedule("0 15 3 * * *", function() {
	console.log("Running Cron Job For syncCmdbServices.");
	azureModel.syncCmdbServices([]);
});

// cron.schedule("0 3 * * * *", function() {
//     console.log("Running Cron Job For syncAzureResources.");
//     azureModel.syncAzureResources([]);
// });

//run daily once at 03:00 AM
cron.schedule("0 0 3 * * *", function() {
    console.log("Running Cron Job For updateOutdatedHostnames.");
    azureModel.updateOutdatedHostnames([]);
});

//run daily once at 03:00 AM
cron.schedule("0 0 3 * * *", function() {
    console.log("Running Cron Job For syncDiskEncryptions.");
    azureModel.syncDiskEncryptions([]);
});

cron.schedule("0 */15 * * * *", function() {
    console.log("Running Cron Job For revokeVMAccessCron.");
    azureCronModel.revokeVMAccessCron([],function(err,result){});
});
//run weekly once(sunday) at 12:10 AM
//cron.schedule("0 10 0 * * 7", function() {
//    console.log("Running Cron Job For syncAzureServiceMeters.");
//    azureModel.syncAzureServiceMeters([],function(err,result){});
//});
//
////run daily once at 12:15 AM
//cron.schedule("0 15 0 * * *", function() {
//    console.log("Running Cron Job For syncAzureServicesUsage.");
//    azureModel.syncAzureServicesUsage([],function(err,result){});
//});
//
//cron.schedule("0 */30 * * *", function() {
//    console.log("Running Cron Job For MS Devops Repo Sync");
//    msDevopsModel.syncClientMSProjects();
//    msDevopsModel.syncClientMSRepos();
//});
//
//cron.schedule("0 */30 * * *", function() {
//    console.log("Running Cron Job For MS Devops Pipeline Sync");
//    msDevopsModel.syncClientMSProjects();
//    msDevopsModel.syncClientMSPipelines();
//});

/**
 * AZURE crons ends here
 */
app.listen("8080");