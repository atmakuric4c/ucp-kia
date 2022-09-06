var express = require('express');
var router = express.Router();
const vmwareModel = require('../models/vmware_model')
const helper  = require('../helpers/common_helper')
/*
  Author: Pradeep
  Descri: Add Vecenter details
  Date  : 02-04-2019
*/
router.post('/add_vcenter_details', function(req, res, next) {
  vmwareModel.addVcenterDetails(req.body,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: update Vecenter details
  Date  : 02-04-2019
*/
router.post('/update_vcenter_details', function(req, res, next) {
  vmwareModel.updateVcenterDetails(req.body,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: Add datastore details
  Date  : 04-04-2019
*/
router.post('/add_datastore', function(req, res, next) {
  vmwareModel.addDatastoreDetails(req.body,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: update datastore details
  Date  : 04-04-2019
*/
router.post('/update_datastore', function(req, res, next) {
  vmwareModel.updateDatastoreDetails(req.body,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: Add Esxi Host details
  Date  : 04-04-2019
*/
router.post('/add_host', function(req, res, next) {
  vmwareModel.addHostDetails(req.body,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: update Esxi Host details
  Date  : 04-04-2019
*/
router.post('/update_host', function(req, res, next) {
  vmwareModel.updateHostDetails(req.body,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: update Esxi Host details
  Date  : 04-04-2019
*/
router.post('/vcenter_vms', function(req, res, next) {
  vmwareModel.vcenterVms(req.body.vdc_id,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: vcenter datastore list
  Date  : 09-04-2019
*/
router.post('/vcenter_datastores', function(req, res, next) {
  vmwareModel.vcenterDatastores(req.body.vdc_id,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: vcenter esxi host list
  Date  : 09-04-2019
*/
router.post('/vcenter_hosts', function(req, res, next) {
  vmwareModel.vcenterHosts(req.body.vdc_id,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: vcenter template list
  Date  : 09-04-2019
*/
router.post('/vcenter_templates', function(req, res, next) {
  vmwareModel.vcenterTemplates(req.body.vdc_id,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: vcenter template list
  Date  : 09-04-2019
*/
router.post('/vcenter_snapshots', function(req, res, next) {
  var inputs=req.body
  vmwareModel.vcenterSnapshots(inputs.vdc_id,inputs.vm_id,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: vm creation api
  Date  : 10-04-2019
*/
router.post('/vm_creation', function(req, res, next) {
  new Promise(function(resolve, reject) {
    vmwareModel.insertApiLog({vm_id:0,method:'POST',url:'vmware/vm_creation',request:req.body},function(logId){resolve(logId)})
  }).then(function(logId){
    vmwareModel.addVm(req,logId,function(err,result){
      if (err) {
        vmwareModel.updateApiLog({error_log:err,response:result},logId,function(result){})
        res.status(400).send({message:result})
      } else {
        vmwareModel.updateApiLog({vm_id:result.vm_id,response:result},logId,function(result){})
        res.status(200).send(result)
      }
    });
  });
});
/*
  Author: Pradeep
  Descri: vm creation api
  Date  : 10-04-2019
*/
router.post('/create_vm', function(req, res, next) {
  new Promise(function(resolve, reject) {
    vmwareModel.insertApiLog({vm_id:req.body.vm_id,method:'POST',url:'vmware/create_vm',request:req.body},function(logId){resolve(logId)})
  }).then(function(logId){
    vmwareModel.createVm(req,logId,function(err,result){
      if (err) {
        vmwareModel.updateApiLog({error_log:err,response:result},logId,function(result){})
        res.status(400).send({message:result})
      } else {
        vmwareModel.updateApiLog({response:result},logId,function(result){})
        res.status(200).send(result)
      }
    });
  });
});

/*
  Author: Pradeep
  Descri: vm creation api
  Date  : 10-04-2019
*/
router.post('/vm_operations', function(req, res, next) {
  new Promise(function(resolve, reject) {
    vmwareModel.insertApiLog({vm_id:req.body.vm_id,method:'POST',url:'vmware/vm_operations',request:req.body},function(logId){resolve(logId)})
  }).then(function(logId){
    vmwareModel.vmOperations(req,logId,function(err,result){
      if (err) {
        vmwareModel.updateApiLog({error_log:err,response:result},logId,function(result){})
        res.status(400).send({message:result})
      } else {
        vmwareModel.updateApiLog({response:result},logId,function(result){})
        res.status(200).send(result)
      }
    });
  });
});
/*
  Author: Pradeep
  Descri: vm creation api
  Date  : 10-04-2019
*/
router.get('/vcenter_logs', function(req, res, next) {
  vmwareModel.vcenterLogs(req.query,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: update vm memory
  Date  : 24-04-2019
*/
router.post('/update_vm_memory', function(req, res, next) {
  new Promise(function(resolve, reject) {
    vmwareModel.insertApiLog({vm_id:req.body.vm_id,method:'POST',url:'vmware/update_vm_memory',request:req.body},function(logId){resolve(logId)})
  }).then(function(logId){
    vmwareModel.updateVmMemory(req,logId,function(err,result){
      if (err) {
        vmwareModel.updateApiLog({error_log:err,response:result},logId,function(result){})
        res.status(400).send({message:result})
      } else {
        vmwareModel.updateApiLog({response:result},logId,function(result){})
        res.status(200).send(result)
      }
    });
  });
});
/*
  Author: Pradeep
  Descri: update vm cpu core
  Date  : 24-04-2019
*/
router.post('/update_vm_cpu', function(req, res, next) {
  new Promise(function(resolve, reject) {
    vmwareModel.insertApiLog({vm_id:req.body.vm_id,method:'POST',url:'vmware/update_vm_cpu',request:req.body},function(logId){resolve(logId)})
  }).then(function(logId){
    vmwareModel.updateVmCpu(req,logId,function(err,result){
      if (err) {
        vmwareModel.updateApiLog({error_log:err,response:result},logId,function(result){})
        res.status(400).send({message:result})
      } else {
        vmwareModel.updateApiLog({response:result},logId,function(result){})
        res.status(200).send(result)
      }
    });
  });
});
/*
  Author: Pradeep
  Descri: Add vm disk in gb
  Date  : 24-04-2019
*/
router.post('/add_vm_disk', function(req, res, next) {
  new Promise(function(resolve, reject) {
    vmwareModel.insertApiLog({vm_id:req.body.vm_id,method:'POST',url:'vmware/add_vm_disk',request:req.body},function(logId){resolve(logId)})
  }).then(function(logId){
    vmwareModel.addVmDisk(req,logId,function(err,result){
      if (err) {
        vmwareModel.updateApiLog({error_log:err,response:result},logId,function(result){})
        res.status(400).send({message:result})
      } else {
        vmwareModel.updateApiLog({response:result},logId,function(result){})
        res.status(200).send(result)
      }
    });
  });
});
/*
  Author: Pradeep
  Descri: Add vm disk in gb
  Date  : 24-04-2019
*/
router.post('/remove_vm_disk', function(req, res, next) {
  new Promise(function(resolve, reject) {
    vmwareModel.insertApiLog({vm_id:req.body.vm_id,method:'POST',url:'vmware/remove_vm_disk',request:req.body},function(logId){resolve(logId)})
  }).then(function(logId){
    vmwareModel.removeVmDisk(req,logId,function(err,result){
      if (err) {
        vmwareModel.updateApiLog({error_log:err,response:result},logId,function(result){})
        res.status(400).send({message:result})
      } else {
        vmwareModel.updateApiLog({response:result},logId,function(result){})
        res.status(200).send(result)
      }
    });
  });
});
/*
  Author: Pradeep
  Descri: veeam job creation api
  Date  : 07-08-2019
*/
router.post('/create_backup_job', function(req, res, next) {
  new Promise(function(resolve, reject) {
    vmwareModel.insertApiLog({vm_id:req.body.vm_id,method:'POST',url:'vmware/create_backup_job',request:req.body},function(logId){resolve(logId)})
  }).then(function(logId){
    vmwareModel.createBackupJob(req,logId,function(err,result){
      if (err) {
        vmwareModel.updateApiLog({error_log:err,response:result},logId,function(res){})
        res.status(400).send({message:result})
      } else {
        vmwareModel.updateApiLog({response:result},logId,function(res){})
        res.status(200).send({message:result})
      }
    });
  });
});
/*
  Author: Pradeep
  Descri: veeam job creation api
  Date  : 07-08-2019
*/
router.post('/create_replica_job', function(req, res, next) {
  new Promise(function(resolve, reject) {
    vmwareModel.insertApiLog({vm_id:req.body.vm_id,method:'POST',url:'vmware/create_replica_job',request:req.body},function(logId){resolve(logId)})
  }).then(function(logId){
    vmwareModel.createReplicaJob(req,logId,function(err,result){
      if (err) {
        vmwareModel.updateApiLog({error_log:err,response:result},logId,function(res){})
        res.status(400).send({message:result})
      } else {
        vmwareModel.updateApiLog({response:result},logId,function(res){})
        res.status(200).send({message:result})
      }
    });
  });
});
/*
  Author: Pradeep
  Descri: veeam job creation api
  Date  : 14-08-2019
*/
router.get('/update_veeam_job_detail', function(req, res, next) {
  vmwareModel.updateVeeamJobDetail(req.query,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});
/*
  Author: Pradeep
  Descri: monitoring graph data
  Date  : 09-05-2019
*/
router.get('/get_monitoring_graph_data', function(req, res, next) {
  vmwareModel.getMonitoringGraphData(req.query,function(err,result){
    if (err) {
      res.status(400).send({message:result})
    } else {
      res.status(200).send(result)
    }
  });
});

module.exports = router;
/*netstat -ano | findstr :9890
tskill pinumber  */