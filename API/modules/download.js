var express = require('express');
var router = express.Router();
const fs = require('fs');
const config=require('../config/constants');
var base64 = require('base-64');
const dbHandler= require('../config/api_db_handler');

router.get('/vm_reports/:id/:type', function(req, res, next) {
    if(!req.params.id){
        res.status(400).send('Invalid Url')
        return 1;
    }
    if(!req.params.type){
        res.status(400).send('Invalid Url')
        return 1;
    }
    var clientid=base64.decode(req.params.id);
    var type=base64.decode(req.params.type);
    console.log(type)
    const fs = require('fs');
    if(type=="true"){
        var sql=`select label_name as vm_name,vdc.location,primary_ip,ram_units_gb as ram_in_gb,
		    cpu_units as cpu_core,vm_status,
		    IF((vm.cluster_hdd = '0' and vm.clientid = '${config.APCPDCL_CLIENT_ID}'), "0", disk_units_gb) as total_disk_space_in_gb,
		    used_disk_in_gb,
            os_template_name 
		    from c4_vm_details as vm 
		    inner join c4_vdc as vdc on vm.vdc_id=vdc.id 
		    where vm_status!='Deleted' and vm.clientid=${clientid}`;
    }else{
    	var sql=`select label_name as vm_name,setup_type,primary_ip,ram_gb,cpus,power_status,disk_gb from c4_other_vm_details where status!='0' and clientid=${clientid}`
    }
   dbHandler.executeQuery(sql,function(result){
        if(result.length==0){
            res.status(400).send('No records found to download!')
            return 1;
        }
        const { Parser, transforms: { unwind } } = require('json2csv');
        var fields=Object.keys(result[0])
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(result);
        var file_loc=`./reports/allvmreport_${clientid}.csv`;
        fs.writeFile(file_loc, csv, function(err) {
            if (err) {
                //return console.error(err);
                res.status(400).send('The operation did not execute as expected. Please raise a ticket to support')
            }
            console.log('cars.csv saved');
            filePath = config.REPORTS_PATH+`allvmreport_${clientid}.csv`;
            console.log(filePath)
            res.download(filePath);
            //res.status(200).send('Downloading...')
        });
    })
})
router.get('/all_vm_reports/:id/:type', function(req, res, next) {
    if(!req.params.id){
        res.status(400).send('Invalid Url')
        return 1;
    }
    if(!req.params.type){
        res.status(400).send('Invalid Url')
        return 1;
    }
    var clientid=base64.decode(req.params.id);
    var type=base64.decode(req.params.type);
    console.log(type)
    const fs = require('fs');
    if(type=="true"){
	    var sql=`select label_name as vm_name,vdc.location,primary_ip,ram_units_gb as ram_in_gb,
		    cpu_units as cpu_core,vm_status,disk_units_gb,os_template_name from c4_vm_details as vm 
		    inner join c4_vdc as vdc on vm.vdc_id=vdc.id where vm_status!='Deleted' and vm.clientid=${clientid}`;
    }else{
    	var sql=`select label_name as vm_name,setup_type,primary_ip,ram_gb,cpus,power_status,disk_gb from c4_other_vm_details where status!='0' and clientid=${clientid}`
    }
   dbHandler.executeQuery(sql,function(result){
        if(result.length==0){
            res.status(400).send('No records found to download!')
            return 1;
        }
        const { Parser, transforms: { unwind } } = require('json2csv');
        var fields=Object.keys(result[0])
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(result);
        var file_loc=`./reports/allvmreport_${clientid}.csv`;
        fs.writeFile(file_loc, csv, function(err) {
            if (err) {
                //return console.error(err);
                res.status(400).send('The operation did not execute as expected. Please raise a ticket to support')
            }
            console.log('cars.csv saved');
            filePath = config.REPORTS_PATH+`allvmreport_${clientid}.csv`;
            console.log(filePath)
            res.download(filePath);
            //res.status(200).send('Downloading...')
        });
    })
})
router.get('/billing_aws_reports', async function(req, res, next) {
    if(!req.query.data){
        res.status(400).send('Invalid Url')
        return 1;
    }
    console.log(base64.decode(req.query.data))
    var dataArr=await JSON.parse(base64.decode(req.query.data));
    var clientid = await dataArr.clientid;
    //console.log(dataArr)
    const fs = require('fs');
    let offset = '';
    offset = ` limit 0,${dataArr.limit}`;
    let sql = `select item_key as Service,item_value as 'Item Value',blended_cost as 'Blended Cost',
    unblended_cost as 'UnBlended Cost',usage_quantity as 'Usage Quantity',granularity as Granularity,
    usage_date as 'Usage Date' from c4_aws_budget_usage as bu where bu.clientid = ${clientid} 
    and bu.usage_date >= "${dataArr.start_date}" and bu.usage_date <= "${dataArr.end_date}"${offset}`
    let result = await dbHandler.executeQueryv2(sql);
    if(result.length==0){
        res.status(400).send('No records found to download!')
        return 1;
    }
    const { Parser, transforms: { unwind } } = require('json2csv');
    var fields=Object.keys(result[0])
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(result);
    var file_loc=`./reports/billing_reports_${clientid}.csv`;
    fs.writeFile(file_loc, csv, function(err) {
        if (err) {
            res.status(400).send('The operation did not execute as expected. Please raise a ticket to support')
        }
        filePath = config.REPORTS_PATH+`billing_reports_${clientid}.csv`;
        res.download(filePath);
    });
})
/*
  Author: Pradeep
  Descri: Download reports
  Date  : 10-04-2019
*/
router.get('/reports', function(req, res, next) {
  // Check if the right request is coming through for the file type
  return new Promise((resolve, reject) => {
      if (req.query.file) {
          return resolve(req.query.file);
      }
      return reject(`Please provide a file name of ?file=${fileTypes.join('|')}`);
  })
  // Validate if the files exists
  .then((file) => {
      return new Promise((resolve, reject) => {
          if(fs.existsSync(`./reports/${file}`)) {
              return resolve(`./reports/${file}`)
          }
          return reject(`File '${file}' was not found.`);
      })
  })
  // Return the file to download
  .then((filePath) => {
      res.download(filePath);
  })
  // Catches errors and displays them
  .catch((e) => {
      res.status(400).send({
          message: e,
      });
  });
});

/*
  Author: Rajesh
  Descri: Download any file from server
  Date  : 29-04-2020
  url check from postman :: http://localhost:9890/download/downloadfile?file=aaaaa&type=INVOICE
*/
router.get('/downloadfile', function(req, res, next) {
    // Check if the right request is coming through for the file type
    return new Promise((resolve, reject) => {
        if (req.query.file && req.query.type) {
            return resolve({file:req.query.file, type : req.query.type});
        }else if (req.query.type) {
            return reject(`Please provide a file name`);
        }else{
            return reject(`Please provide a type`);
        }
    })
    // Validate if the files exists
    .then((res) => {
        return new Promise((resolve, reject) => {
            let filePath = '', file = "";
            console.log("res --- ",res);
            if(res.type == "UserGuide"){
            	file = res.file;
            }else{
            	file = base64.decode (res.file);
            }
            console.log("file ---- ", file); 
            if(res.type == "INVOICE"){
                filePath = config.OLDAPP_PORTAL_PATH;
                if(file.charAt(0) == '.'){
                    file = file.substr(1);
                }
            }else if(res.type == "REPORT"){
                filePath = config.REPORTS_PATH;
            }else if(res.type == "UserGuide"){
                filePath = config.SAMPLE_FILES_PATH;
            }
            console.log(file); 
            console.log("full file path", filePath+file);
            if(fs.existsSync(filePath+file)) {
                return resolve(filePath+file)
            }
            return reject(`File not found.`);
        })
    })
    // Return the file to download
    .then((filePath) => {
//        res.download(filePath);
        fs.readFile(filePath , function (err,data){
        	res.setHeader('Content-disposition', 'inline; filename="' + req.query.file + '"');
	        res.contentType("application/pdf");
	        res.send(data);
	    });
    })
    // Catches errors and displays them
    .catch((e) => {
    	console.log("e --- ",e);
        res.status(400).send({
            message: e,
        });
    });
});

router.get('/UserGuide/:file', function(req, res, next) {
    // Check if the right request is coming through for the file type
    return new Promise((resolve, reject) => {
        if (req.params.file) {
            return resolve({file:req.params.file});
        }else{
            return reject(`Please provide file`);
        }
    })
    // Validate if the files exists
    .then((res) => {
        return new Promise((resolve, reject) => {
            let filePath = '', file = "";
            console.log("res --- ",res);
        	file = res.file;
            console.log("file ---- ", file); 
            filePath = config.SAMPLE_FILES_PATH;
            console.log("full file path", filePath+file);
            if(fs.existsSync(filePath+file)) {
                return resolve(filePath+file)
            }
            return reject(`File not found.`);
        })
    })
    // Return the file to download
    .then((filePath) => {
//        res.download(filePath);
        fs.readFile(filePath , function (err,data){
        	res.setHeader('Content-disposition', 'inline; filename="' + req.params.file + '"');
	        res.contentType("application/pdf");
	        res.send(data);
	    });
    })
    // Catches errors and displays them
    .catch((e) => {
    	console.log("e --- ",e);
        res.status(400).send({
            message: e,
        });
    });
});

module.exports = router;
/*netstat -ano | findstr :3000
tskill pinumber  */