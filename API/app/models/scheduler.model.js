const dbHandler= require('../../config/api_db_handler');

const getListPendingCyberark = async () => {
 let sql = `SELECT id, jenkins_request_obj FROM c4_vm_creation WHERE is_cyberark_acc_created=0 AND jenkins_request_obj IS NOT NULL AND jenkins_status='SUCCESS'`,
 list = await dbHandler.executeQueryv2(sql, {});

 return list;    
}

const updateVMDetails = async (aObj) => {
 let {id, comment, status} = aObj,
   sql = `UPDATE c4_vm_creation SET is_cyberark_acc_created=:status, cyberak_response=:comment WHERE id=:id`,
  list = await dbHandler.executeQueryv2(sql, {status, id, comment});

 return list;
}

getListPendingOat = async () => {
 let sql = `SELECT det.id, vm.jenkins_request_obj, jenkin.oat_checklist_file_path FROM c4_vm_creation vm INNER JOIN c4_vm_details det ON (det.order_details_id=vm.order_details_id AND det.oat_checklist_data IS NULL) INNER JOIN azure_jenkin_jobs jenkin ON (jenkin.job_name=vm.job_name) WHERE vm.jenkins_status='SUCCESS'`,
  list = await dbHandler.executeQueryv2(sql, {});

 return list;    
}

const updateVMOatDetails = async (aObj) => {
 let {id, oat_checklist_data} = aObj,
   sql = `UPDATE c4_vm_details SET oat_checklist_data=:oat_checklist_data WHERE id=:id`,
  list = await dbHandler.executeQueryv2(sql, {oat_checklist_data, id});

 return list;
}

module.exports = {
 getListPendingCyberark,
 updateVMDetails,
 getListPendingOat,
 updateVMOatDetails
}