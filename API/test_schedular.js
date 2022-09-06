const cron = require("node-cron");
const express = require("express");
//const cronModel = require('./models/cron_model');
//const azureModel = require('./models/azure_model');
//const awsModel = require('./models/aws_model');
//const gcpModel = require('./models/gcp_model');
app = express();
var router = express.Router();
// cron.schedule("*/5 * * * * *", function() {
//     console.log("Running Cron Job For getResourceList.");
//     azureModel.getResourceList();
// });
// cron.schedule("0 */1 * * * *", function() {
//     console.log("Running Cron Job For hypervUpdateVmDetails.");
//     cronModel.hypervUpdateVmDetails([],function(err,result){});
// });
// cron.schedule("* */3 * * * *", function() {
//     console.log("Running Cron Job For syncAwsImages.");
//     awsModel.syncAwsImages([],function(err,result){});
// });
// cron.schedule("0 */2 * * * *", function() {
//     console.log("Running Cron Job For preparedUsageData.");
//     cronModel.preparedUsageData();
// });
// cron.schedule("0 */2 * * * *", function() {
//     console.log("Running Cron Job For sync azure VmList.");
//     azureModel.syncVmList();
// });
// schedule tasks to be run on the server
// cron.schedule("0 */1 * * * *", function() {
//     console.log("Running Cron Job For hypervCreateVm.");
//     cronModel.hypervCreateVm([],function(err,result){});
// });
// cron.schedule("0 */1 * * * *", function() {
//     console.log("Running Cron Job For hypervCreateVm.");
//     cronModel.hypervCreateVm([],function(err,result){});
// });
// cron.schedule("0 */2 * * * *", function() {
//     console.log("Running Cron Job For syncInstanceTypes.");
//     awsModel.syncInstanceTypes([],function(err,result){});
// });
// cron.schedule("0 */2 * * * *", function() {
//     console.log("Running Cron Job For syncAwsVms.");
//     awsModel.syncAwsVms([],function(err,result){});
// });
// cron.schedule("0 */1 * * * *", function() {
//     console.log("Running Cron Job For privateVmSyncing.");
//     cronModel.privateVmSyncing (0,function(result){});
// });
router.get('/testCmdb', function(req, res, next) {
	const request=require('request');
	
	console.log({message:"initiated"});
	let url=`https://servicenow-uat.dhl.com/api/now/table/u_excel_dhl_hw_server_upload`;
  	console.log("url --- ", url);
	  	let options = {
		"u_folder" : "ITS SPCS Managed Services",
		"u_owner_person" : "harithan",
		"u_network_name" : "nic-XA120HN210064-NIC",
		"u_model" : "Azure Standard_DS2_v2",
		"u_description" : "Managed Azure VM - XA120HN210064",
		"u_synchronize_from_service" : true,
		"u_category" : "Virtual Server Linux",
		"u_location" : "EA-West Europe Azure Cloud",
		"u_ip_address_1" : "",
		"u_memory_installed" : 7168,
		"u_cpu_cores" : 2,
		"u_active" : true,
		"u_synchronize_from_folder" : true,
		"u_operatred_by_3rd_party" : true,
		"u_status" : "In Test",
		"u_class" : "Server",
		"u_cost_code" : "",
		"u_administrator_group" : "",
		"u_name" : "XA120HN210064",
		"u_os_build_version" : "redhat 8.1",
		"u_operations_support_level" : "Bronze",
		"u_order_number" : "",
		"u_search_code" : "EA-SVLV-XA120HN210064"
	};
  	console.log("u_excel_dhl_hw_server_upload request", JSON.stringify(options));
  	
  	let request_options = {
	  'method': 'POST',
	  'url': url,
	  'headers': {
	    'Content-Type': 'application/json',
	    'Authorization':  `Basic c25jX3N5c19pZl9teXNoaWZ0X2NtZGI6U2ZlM2ozbWpAI21mYVtBam9tNnNqMzE=`,
	  },
	  body: JSON.stringify(options)

	};
  	
  	console.log("u_excel_dhl_hw_server_upload request_options -- ", JSON.stringify(request_options));
	request(options, function (error, response) {
		console.log("error -- ", JSON.stringify(error));
		console.log("response.body -- ", JSON.stringify(response));
	  if (error){
		  //throw new Error(error);
		  console.log("error -- ", JSON.stringify(error));
		  console.log("Something went wrong");
	  }else{
	  console.log("response.body -- ", JSON.stringify(response.body));
        result = JSON.parse(response.body);
        if(result){
        	console.log(result);
        }else{
        	console.log("Something went wrong");
        }
      }
	});
	res.status(200).send({message:"initiated"});
});
app.use("/test", router);
app.listen("3129");