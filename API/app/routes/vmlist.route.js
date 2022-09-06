const vmlistService = require('../services/vmlist.service');
var base64 = require('base-64');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');

function init(router) {
    router.route('/vmlist/listdata/:id').get(getAllVmlist);
    router.route('/vmlist/physicalVmListData').post(getAllPhysicalVmlist);
    router.route('/vmlist/physicalVmDetails/:id').get(getPhysicalVmDetails);
    router.route('/vmlist/getScheduleList/:id').get(getScheduleList);
    router.route('/vmlist/getVmNotScheduleList/:id').get(getVmNotScheduleList);
    router.route('/vmlogs/:id').get(getVmLogsbyId);
    router.route('/vmDetail').post(getVmDetailbyId);
    router.route('/vmdiskinfo/:id').get(getVmDiskInfobyId);   
    router.route('/vmlist/addVm').post(addVm);
    router.route('/vmlist/addScheduler').post(addScheduler);
    router.route('/vmlist/updateVmCreateDate').post(updateVmCreateDate);
    router.route('/vmlist/vmgrouplist').get(getAllVmGrouplist);
    router.route('/vmlist/addVmGroup').post(addVmGroup);
    router.route('/vmlist/editVmGroup').post(editVmGroup);
    router.route('/vmlist/editVmGroupMapping').post(editVmGroupMapping);
    router.route('/vmlist/vm_operations').post(vmOpeations);
    router.route('/vmlist/veeam_operations').post(veeamOperations);
    router.route('/vmlist/vm_resize').post(vmResize);
    router.route('/vmlist/vm_log').post(vmLogs);
    router.route('/vmlist/job_status').post(jobStatus);
    router.route('/vmlist/job_history').post(jobHistory);
    
}
function vmLogs(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  let vmId = reqBody.vmid; 
  let clientid = reqBody.clientid;  
  vmlistService.vmLogs(clientid,vmId).then((data) => {
      res.send(ucpEncryptDecrypt.ucpEncrypt(data));
    }).catch((err) => {
      //mail.mail(err);
      res.send(ucpEncryptDecrypt.ucpEncrypt(err));
    });
}
function getAllVmlist(req,res) {
  let vdc_id=base64.decode(req.params.id);
  //vdc_id = ucpEncryptDecrypt.ucpDecryptForUri(req.params.id);
  console.log(vdc_id)
    vmlistService.getAllVmlist(vdc_id).then((data) => {
      res.send(ucpEncryptDecrypt.ucpEncrypt(data));
    }).catch((err) => {      
      res.send(ucpEncryptDecrypt.ucpEncrypt(err));
    });
}
function getAllPhysicalVmlist(req,res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
	var bodydata={body:reqBody}
    vmlistService.getAllPhysicalVmlist(bodydata,function(err,result){
	    if (err) {
            res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result));
	    } else {
            res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result));
        }
    });
}
function getPhysicalVmDetails(req,res) {
  vm_id = ucpEncryptDecrypt.ucpDecryptForUri(req.params.id);
  console.log(vm_id)
    vmlistService.getPhysicalVmDetails(vm_id).then((data) => {
      res.send(ucpEncryptDecrypt.ucpEncrypt(data));
    }).catch((err) => {      
      res.send(ucpEncryptDecrypt.ucpEncrypt(err));
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

function addVm(req,res){
  vmlistService.addVm(req,function(err,result){
    if (err) {
    res.status(400).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function vmResize(req,res){
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  var bodydata={body:reqBody}
  vmlistService.vmResize(bodydata,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
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
function getVmDetailbyId(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  let vmId = base64.decode(reqBody.vmid); 
  let clientid = base64.decode(reqBody.clientid);  
  vmlistService.getVmDetailbyId(clientid,vmId).then((data) => {
      res.send(ucpEncryptDecrypt.ucpEncrypt(data));
    }).catch((err) => {
      res.send(ucpEncryptDecrypt.ucpEncrypt(err));
    });
}
function jobStatus(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  vmlistService.jobStatus(reqBody).then((data) => {
      res.send(ucpEncryptDecrypt.ucpEncrypt(data));
    }).catch((err) => {
      res.send(ucpEncryptDecrypt.ucpEncrypt(err));
    });
}
function jobHistory(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  let vmId = reqBody.vmid; 
  let clientid = reqBody.clientid;  
  vmlistService.jobHistory(clientid,vmId).then((data) => {
    res.send(ucpEncryptDecrypt.ucpEncrypt(data));
  }).catch((err) => {
    res.send(ucpEncryptDecrypt.ucpEncrypt(err));
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
    res.status(200).send({message:result})
    } else {
    res.status(200).send(result)
    }
  });
}
function vmOpeations(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  vmlistService.vmOpeations(reqBody,function(err,result){
    if (err) {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}
function veeamOperations(req,res) {
  let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body));
  vmlistService.veeamOperations(reqBody,function(err,result){
    if (err) {
      res.status(200).send(ucpEncryptDecrypt.ucpEncrypt({message:result}))
    } else {
    res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result))
    }
  });
}

module.exports.init = init;