const vmlistService = require('../services/citrix.service');
var base64 = require('base-64');

function init(router) {
    router.route('/citrix/listdata/:id').get(getAllVmlist);
    router.route('/citrix/vm_detail').post(getVmDetailbyId);
    router.route('/citrix/add_Vm').post(addVm);
    router.route('/citrix/vm_operations').post(vmOperations);
    router.route('/citrix/vm_resize').post(vmResize);
    router.route('/citrix/vm_log').post(vmLogs);
    router.route('/citrix/veeam_operations').post(veeamOperations);
}

function getAllVmlist(req,res) {
    let vdc_id = req.params.id; 
    vmlistService.getAllVmlist(vdc_id).then((data) => {
      res.send(data);
    }).catch((err) => {      
      res.send(err);
    });
}
function vmOperations(req,res) {
  vmlistService.vmOperations(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function veeamOperations(req,res) {
  vmlistService.veeamOperations(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}

function vmResize(req,res) {
  vmlistService.vmResize(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}

function addVm(req,res){
  vmlistService.addVm(req,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}

function getVmDetailbyId(req,res) {
  let vmId = base64.decode(req.body.vmid); 
  let clientid = base64.decode(req.body.clientid);  
  vmlistService.getVmDetailbyId(clientid,vmId).then((data) => {
      res.send(data);
    }).catch((err) => {
      res.send(err);
    });
}

function vmLogs(req,res) {
  let vmId = req.body.vmid; 
  let clientid = req.body.clientid;  
  vmlistService.vmLogs(clientid,vmId).then((data) => {
      res.send(data);
    }).catch((err) => {
      //mail.mail(err);
      res.send(err);
    });
}

function addScheduler(req,res){
  vmlistService.addScheduler(req,function(err,result){
    if (err) {
    res.status(400).send({message:result,success:false})
    } else {
    res.status(200).send(result)
    }
  });
}

function getVmLogsbyId(req,res) {
  let vmId = req.params;  
  vmlistService.getVmLogsbyId(vmId).then((data) => {
      res.send(data);
    }).catch((err) => {
      //mail.mail(err);
      res.send(err);
    });
}

function getScheduleList(req,res) {
  let vdc_id = req.params.id; 
  vmlistService.getScheduleList(vdc_id).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}
function getVmNotScheduleList(req,res) {
  let vdc_id = req.params.id; 
  vmlistService.getVmNotScheduleList(vdc_id).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}

function getVmDiskInfobyId(req,res) {
  let vmId = req.params;  
  vmlistService.getVmDiskInfobyId(vmId).then((data) => {
      res.send(data);
    }).catch((err) => {
      //mail.mail(err);
      res.send(err);
    });
}
function updateVmCreateDate(req,res){
  vmlistService.updateVmCreateDate(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function getAllVmGrouplist(req,res) {
  vmlistService.getAllVmGrouplist().then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}
function addVmGroup(req,res) {
  vmlistService.addVmGroup(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function editVmGroup(req,res) {
  vmlistService.editVmGroup(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function editVmGroupMapping(req,res) {
  vmlistService.editVmGroupMapping(req.body,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}


module.exports.init = init;