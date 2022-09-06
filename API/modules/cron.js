var express = require('express');
var router = express.Router();
const vmwareModel = require('../models/vmware_model')
const cronModel = require('../models/cron_model')
const azureModel = require('../models/azure_model');
const helper  = require('../helpers/common_helper')
const axios = require('axios')
/*
  Author: Pradeep
  Descri: Sync Vecenter vms
  Date  : 23-04-2019
*/
router.get('/sync_vcenter_vms', function(req, res, next) {
    cronModel.syncVcenterVms(1,function(err,result){
        if (err) {
        res.status(400).send({message:result})
        } else {
        res.status(200).send(result)
        }
    });
});
/*
  Author: Pradeep
  Descri: Sync Vecenter datastores
  Date  : 23-04-2019
*/
router.get('/sync_vcenter_datastores', function(req, res, next) {
    cronModel.syncVcenterDatastores(1,function(err,result){
        if (err) {
        res.status(400).send({message:result})
        } else {
        res.status(200).send(result)
        }
    });
});
/*
  Author: Pradeep
  Descri: Sync Vecenter hosts
  Date  : 23-04-2019
*/
router.get('/sync_vcenter_hosts', function(req, res, next) {
    cronModel.syncVcenterHosts(1,function(err,result){
        if (err) {
        res.status(400).send({message:result})
        } else {
        res.status(200).send(result)
        }
    });
});
/*
  Author: Pradeep
  Descri: Sync Vecenter os template
  Date  : 26-04-2019
*/
router.get('/sync_vcenter_templates', function(req, res, next) {
    cronModel.syncVcenterTemplates(1,function(err,result){
        if (err) {
        res.status(400).send({message:result})
        } else {
        res.status(200).send(result)
        }
    });
});
/*
  Author: Pradeep
  Descri: Update vm status
  Date  : 23-04-2019
*/
router.get('/update_vm_status', function(req, res, next) {
    cronModel.updateVmStatus(req.query,function(err,result){
        if (err) {
        res.status(400).send({message:result})
        } else {
        res.status(200).send(result)
        }
    });
});
/*
  Author: Pradeep
  Descri: Update vm status
  Date  : 23-04-2019
*/
router.get('/update_vm_details', function(req, res, next) {
    cronModel.updateVmDetails(req.query,function(err,result){
        if (err) {
        res.status(400).send({message:result})
        } else {
        res.status(200).send(result)
        }
    });
});

/*
  Author: Rajesh
  Description: Update Zabbix monitoring in infra_vms table
  Date  : 01-05-2019
*/
router.get('/update_monitoring_in_infravm', function(req, res, next) {
  cronModel.updateMonitoringInInfravm(req.query,function(err,result){
      if (err) {
      res.status(400).send({message:result})
      } else {
      res.status(200).send(result)
      }
  });
});

/*
  Author: Rajesh
  Description: uptime downtime Report Generation
  Date  : 13-05-2019
*/
router.get('/uptime_report_generation', function(req, res, next) {
  cronModel.uptimeReportGeneration(req.query,function(err,result){
      if (err) {
      res.status(400).send({message:result})
      } else {
      res.status(200).send(result)
      }
  });
});

/*
  Author: Rajesh
  Description: utilization downtime Report Generation
  Date  : 14-05-2019
*/
router.get('/utilization_report_generation', function(req, res, next) {
  cronModel.utilizationReportGeneration(req.query,function(err,result){
      if (err) {
      res.status(400).send({message:result})
      } else {
      res.status(200).send(result)
      }
  });
});

/*
  Author: Rajesh
  Description: Hyperv Create VM Cron job
  Date  : 27-04-2020
  url check from postman :: http://localhost:9890/cron/hyperv_create_vm?id=76337
*/
router.get('/hyperv_create_vm', function(req, res, next) {
  cronModel.hypervCreateVm(req.query,function(err,result){
      if (err) {
      res.status(400).send({message:result})
      } else {
      res.status(200).send(result)
      }
  });
});

/*
  Author: Rajesh
  Description: Hyperv Create VM Cron job
  Date  : 27-04-2020
  url check from postman :: http://localhost:9890/cron/hyperv_update_vm_details?ref_id=53725&vdc_id=2
*/
router.get('/hyperv_update_vm_details', function(req, res, next) {
  console.log("hyperv_update_vm_details");
  cronModel.hypervUpdateVmDetails(req.query,function(err,result){
      if (err) {
      res.status(400).send({message:result})
      } else {
      res.status(200).send(result)
      }
  });
});

/*
  Author: Rajesh
  Description: calculate Hourly Billing Cron job
  Date  : 30-04-2020
  url check from postman :: http://localhost:9890/cron/calculate_hourly_billing
*/
router.get('/calculate_hourly_billing', function(req, res, next) {
  console.log("calculate_hourly_billing");
  // res.status(400).send({message:"calculate_hourly_billing"})
  cronModel.calculateHourlyBilling(req.query,function(err,result){
      if (err) {
      res.status(400).send({message:result})
      } else {
      res.status(200).send(result)
      }
  });
});

/*
  Author: Rajesh
  Description: calculatehourlybillforaddons
  Date  : 30-04-2020
  url check from postman :: http://localhost:9890/cron/calculatehourlybillforaddons
*/
router.get('/calculatehourlybillforaddons', function(req, res, next) {
  console.log("calculatehourlybillforaddons");
  cronModel.calculatehourlybillforaddons(req.query,function(err,result){
      if (err) {
      res.status(400).send({message:result})
      } else {
      res.status(200).send(result)
      }
  });
});


/*
  Author: Pradeep
  Descri: Update vm alert info in infra_alerts table
  Date  : 06-05-2019
*/
router.get('/update_alert_info', function(req, res, next) {
  cronModel.updateAlertInfo(req.query,function(err,result){
      if (err) {
      res.status(400).send({message:result})
      } else {
      res.status(200).send(result)
      }
  });
});
/*
  Author: Pradeep
  Descri: cron for private ip sync
  Date  : 07-05-2019
*/
router.get('/sync_vcenter_networks', function(req, res, next) {
  cronModel.syncVcenterNetworks(1,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: cron for private ip sync
  Date  : 07-05-2019
*/
router.get('/sync_ip_from_vcenter', function(req, res, next) {
  cronModel.syncIpFromVcenter(req.query,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: cron for private ip sync
  Date  : 07-05-2019
*/
router.get('/sync_hourly_report', function(req, res, next) {
  cronModel.vmHourlyReport(req.query,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: cron for schedule_cron_job
  Date  : 30-03-2020
*/
router.get('/schedule_cron_job', function(req, res, next) {
  cronModel.scheduleCronJob(function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
});
router.get('/prepared_usage_data', function(req, res, next) {
  cronModel.preparedUsageData()
  res.status(200).send('success')
});
/*
  Author: Pradeep
  Descri: cron for schedule_cron_job
  Date  : 30-03-2020
*/
router.get('/usageReportGeneration', function(req, res, next) {
  cronModel.usageReportGeneration()
  res.status(200).send('success')
});

router.post('/syncVmList', function(req, res, next) {
  cronModel.syncVmList(req.body,function(err,result){
      if(err){
        res.status(400).send(result)
      }else{
        res.status(200).send(result)
      }
  })
});

/*
  Author: Pradeep
  Descri: for pinging
  Date  : 16-05-2019
*/
router.get('/ping_check', function(req, res, next) {
  var ping = require('ping');
  var hosts = ['192.168.220.90'];
  hosts.forEach(function(host){
      ping.sys.probe(host, function(isAlive){
          var msg = isAlive ? 'alive' : 'dead';
          console.log(msg);
          res.status(200).send(msg)
      });
  });
});

/*
  Author: Pradeep
  Description: dynamically vm attachments
  Date  : 16-11-2020
  url check from postman :: http://localhost:9890/cron/private_vm_syncing?clientid=14703&clientVdcStatus=any
*/
router.get('/private_vm_syncing/:clientid', function(req, res, next) {
  var clientid=req.params.clientid
  cronModel.privateVmSyncing(clientid,function(result){
    res.status(200).send(result)
  });
});
/*
  Author: Pradeep
  Descri: for code testing
  Date  : 07-05-2019
*/
router.get('/testing_code', function(req, res, next) {
  //var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  //var msg = days.indexOf("Monday");
  var random=Math.floor(1000 + Math.random() * 9000);
  console.log(random)
  //console.log(days[msg+1])
  //res.sendStatus(200);
 /* //Math.random()
  console.log(Math.floor(Math.random()*100000+1));
  const dateFormat = require('dateformat');
  var currentdate = new Date(dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"));
  var datetime1 = currentdate.getFullYear() + "-"+(currentdate.getMonth()+1) 
+ "-" + currentdate.getDate() + " " 
+ currentdate.getHours() + ":00:00";
var datetime2=dateFormat(new Date(datetime1), "yyyy-mm-dd HH:MM:ss")
var starttime = Math.round(new Date(datetime2).getTime()/1000);
var datetime3 = currentdate.getFullYear() + "-"+(currentdate.getMonth()+1) 
+ "-" + currentdate.getDate() + " " 
+ currentdate.getHours() + ":59:59";
  var datetime4=dateFormat(new Date(datetime3), "yyyy-mm-dd HH:MM:ss")
  var endtime = Math.round(new Date(datetime4).getTime()/1000);
  console.log(starttime+'   '+endtime);*/

});

module.exports = router;
/*netstat -ano | findstr :9890
tskill pinumber  */
////pkill -f node for linux