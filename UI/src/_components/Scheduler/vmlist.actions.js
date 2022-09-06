import { vmlistConstants } from './vmlist.constants';
import { vmlistService } from './vmlist.services';
import { alertActions } from '../../_actions';
import { history } from '../../_helpers';
import { toast } from 'react-toastify';

export const vmlistActions = {
    getAll,
    addScheduler,
    vmOperations,
    vmResize,
    vmLogs,
    vmDetail,
    getDiskDetails,
    vmAddDisk,
    vmDeleteDisk,
    updateVmCreateDate,
    getVmGroupAll,
    addVmGroup,
    editVmGroup,
    editVmGroupMapping,
    getVmList
};

function getAll(vdc_id) {
    return dispatch => {
        dispatch(request());
        vmlistService.getAll(vdc_id)
            .then(
                scheduler => dispatch(success(scheduler)),
                error => dispatch(failure(error.toString()))
            );
    };

    function request() { return { type: vmlistConstants.GETALL_SCHEDULER_REQUEST } }
    function success(scheduler) { return { type: vmlistConstants.GETALL_SCHEDULER_SUCCESS, scheduler } }
    function failure(error) { return { type: vmlistConstants.GETALL_SCHEDULER_FAILURE, error } }
}
function getVmList(vdc_id) {
  return dispatch => {
      dispatch(request());
      vmlistService.getVmList(vdc_id)
          .then(
              vms => dispatch(success(vms)),
              error => dispatch(failure(error.toString()))
          );
  };

  function request() { return { type: vmlistConstants.VMLIST_SCHEDULER_REQUEST } }
  function success(vms) { return { type: vmlistConstants.VMLIST_SCHEDULER_SUCCESS, vms } }
  function failure(error) { return { type: vmlistConstants.VMLIST_SCHEDULER_FAILURE, error } }
}

function addScheduler(formData){
    return dispatch => {
        dispatch(request(formData));
        vmlistService.addScheduler(formData).then(
          resdata => {
            dispatch(success(resdata));
            console.log(resdata)
            if(resdata.success == false){          
              toast.error(resdata.message);
            } else {          
              toast.success(resdata.message);
              if(formData.vdc_id)
              dispatch(getAll(formData.vdc_id));
            }
          },
          error => {
            failure(error.toString()),
            toast.error(error.toString());
          }
        );
    }
    function request(formData) {
      return { type: vmlistConstants.ADDVM_SCHEDULER_REQUEST, formData };
    }
    function success(resdata) {
      return { type: vmlistConstants.ADDVM_SCHEDULER_SUCCESS, resdata };
    }
    function failure(error) {
      return { type: vmlistConstants.ADDVM_SCHEDULER_FAILURE, error };
    }
}
function getVmGroupAll() {
    return dispatch => {
        dispatch(request());
        vmlistService.getVmGroupAll()
            .then(
                vmgroup => dispatch(success(vmgroup)),
                error => dispatch(failure(error.toString()))
            );
    };

    function request() { return { type: vmlistConstants.GETGROUPALL_SCHEDULER_REQUEST } }
    function success(vmgroup) { return { type: vmlistConstants.GETGROUPALL_SCHEDULER_SUCCESS, vmgroup } }
    function failure(error) { return { type: vmlistConstants.GETGROUPALL_SCHEDULER_FAILURE, error } }
}

function addVmGroup(formData){
    return dispatch => {
        dispatch(request(formData));
        vmlistService.addVmGroup(formData).then(
          resdata => {
            dispatch(success(resdata));
            console.log(JSON.stringify(resdata))
            // history.push("/monitoringdashboard");
            if(resdata.success == false){          
              toast.error(resdata.message);
            } else {          
              toast.success("VM GROUP Added successfully");
              if(formData.vdc_id)
              dispatch(getAll(formData.vdc_id));
            }
          },
          error => {
            failure(error.toString()),
            toast.error(error.toString());
          }
        );
    }
    function request(formData) {
      return { type: vmlistConstants.ADDVMGROUP_SCHEDULER_REQUEST, formData };
    }
    function success(resdata) {
      return { type: vmlistConstants.ADDVMGROUP_SCHEDULER_SUCCESS, resdata };
    }
    function failure(error) {
      return { type: vmlistConstants.ADDVMGROUP_SCHEDULER_FAILURE, error };
    }
}
function editVmGroup(formData){
    return dispatch => {
        dispatch(request(formData));
        vmlistService.editVmGroup(formData).then(
          resdata => {
            dispatch(success(resdata));
            console.log(JSON.stringify(resdata))
            // history.push("/monitoringdashboard");
            if(resdata.success == false){          
              toast.error(resdata.message);
            } else {          
              toast.success("VM GROUP Updated successfully");
              if(formData.vdc_id)
              dispatch(getAll(formData.vdc_id));
            }
          },
          error => {
            failure(error.toString()),
            toast.error(error.toString());
          }
        );
    }
    function request(formData) {
      return { type: vmlistConstants.EDITVMGROUP_SCHEDULER_REQUEST, formData };
    }
    function success(resdata) {
      return { type: vmlistConstants.EDITVMGROUP_SCHEDULER_SUCCESS, resdata };
    }
    function failure(error) {
      return { type: vmlistConstants.EDITVMGROUP_SCHEDULER_FAILURE, error };
    }
}
function editVmGroupMapping(formData){
  return dispatch => {
      dispatch(request(formData));
      vmlistService.editVmGroupMapping(formData).then(
        resdata => {
          dispatch(success(resdata));
          console.log(JSON.stringify(resdata))
          // history.push("/monitoringdashboard");
          if(resdata.success == false){          
            toast.error(resdata.message);
          } else {          
            toast.success("GROUP Mapping Updated successfully");
            if(formData.vdc_id)
            dispatch(getAll(formData.vdc_id));
          }
        },
        error => {
          failure(error.toString()),
          toast.error(error.toString());
        }
      );
  }
  function request(formData) {
    return { type: vmlistConstants.GROUPMapping_SCHEDULER_REQUEST, formData };
  }
  function success(resdata) {
    return { type: vmlistConstants.GROUPMapping_SCHEDULER_SUCCESS, resdata };
  }
  function failure(error) {
    return { type: vmlistConstants.GROUPMapping_SCHEDULER_FAILURE, error };
  }
}

function vmOperations(postParams) {
    return dispatch => {
        dispatch(request(postParams));
        vmlistService.vmOperations(postParams)       
            .then(
                resData => { 
                    console.log('done');
                    if(postParams.vdc_id)
                    dispatch(getAll(postParams.vdc_id));
                },
                error => {
                    //dispatch(failure(error.toString()));
                    //dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(postParams) { return { type: vmlistConstants.VMOPERATIONS_SCHEDULER_REQUEST, postParams } }
    function success(postParams) { return { type: vmlistConstants.VMOPERATIONS_SCHEDULER_SUCCESS, postParams } }
    function failure(error) { return { type: vmlistConstants.VMOPERATIONS_SCHEDULER_FAILURE, error } }
}

function vmResize(formData){
    return dispatch => {
        dispatch(request(formData));
        vmlistService.vmResize(formData);        
            /*.then(
                resData => { 
                    dispatch(success(resData));
                    history.push('/vmlist');
                    dispatch(alertActions.success(resData));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );*/
    };
    function request(formData) { return { type: vmlistConstants.VMOPERATIONS_SCHEDULER_REQUEST, formData } }
    function success(formData) { return { type: vmlistConstants.VMOPERATIONS_SCHEDULER_SUCCESS, formData } }
    function failure(error) { return { type: vmlistConstants.VMOPERATIONS_SCHEDULER_FAILURE, error } }
}

function vmLogs(vmid) {
    return dispatch => {
        dispatch(request(vmid));
        vmlistService.vmLogs(vmid)       
            .then(
                logData => { 
                    dispatch(success(logData));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(vmid) { return { type: vmlistConstants.VMLOGS_SCHEDULER_REQUEST, vmid } }
    function success(logData) { return { type: vmlistConstants.VMLOGS_SCHEDULER_SUCCESS, logData } }
    function failure(error) { return { type: vmlistConstants.VMLOGS_SCHEDULER_FAILURE, error } }
}
function vmDetail(vmid) {
  return dispatch => {
      dispatch(request(vmid));
      vmlistService.vmDetail(vmid)       
          .then(
            vm_data => { 
                  dispatch(success(vm_data));
              },
              error => {
                  dispatch(failure(error.toString()));
                  dispatch(alertActions.error(error.toString()));
              }
          );
  };

  function request(vmid) { return { type: vmlistConstants.VMDETAIL_SCHEDULER_REQUEST, vmid } }
  function success(vm_data) { return { type: vmlistConstants.VMDETAIL_SCHEDULER_SUCCESS, vm_data } }
  function failure(error) { return { type: vmlistConstants.VMDETAIL_SCHEDULER_FAILURE, error } }
}
function getDiskDetails(vmid) {
    return dispatch => {
        dispatch(request(vmid));
        vmlistService.getDiskDetails(vmid)       
            .then(
                diskInfo => { 
                    dispatch(success(diskInfo));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(vmid) { return { type: vmlistConstants.DISKINFO_SCHEDULER_REQUEST, vmid } }
    function success(diskInfo) { return { type: vmlistConstants.DISKINFO_SCHEDULER_SUCCESS, diskInfo } }
    function failure(error) { return { type: vmlistConstants.DISKINFO_SCHEDULER_FAILURE, error } }
}

function vmAddDisk(formData){
    return dispatch => {
        dispatch(request(formData));
        vmlistService.vmAddDisk(formData);  
            
    };

    function request(formData) { return { type: vmlistConstants.ADDDISK_SCHEDULER_REQUEST, formData } }
    function success(formData) { return { type: vmlistConstants.ADDDISK_SCHEDULER_SUCCESS, formData } }
    function failure(error) { return { type: vmlistConstants.ADDDISK_SCHEDULER_FAILURE, error } }

}

function vmDeleteDisk(delDiskInfo){
    return dispatch => {
        dispatch(request(delDiskInfo));
        vmlistService.vmDeleteDisk(delDiskInfo);  
            
    };

    function request(delDiskInfo) { return { type: vmlistConstants.DELETEDISK_SCHEDULER_REQUEST, delDiskInfo } }
    function success(delDiskInfo) { return { type: vmlistConstants.DELETEDISK_SCHEDULER_SUCCESS, delDiskInfo } }
    function failure(error) { return { type: vmlistConstants.DELETEDISK_SCHEDULER_FAILURE, error } }

}
function updateVmCreateDate(formData){
    return dispatch => {
        dispatch(request(formData));
        vmlistService.updateVmCreateDate(formData).then(
        resdata => {
            dispatch(success(resdata));
            console.log(JSON.stringify(resdata))
            // history.push("/monitoringdashboard");
            if(resdata.success == false){          
              toast.error(resdata.message);
            } else {          
              toast.success(resdata.message);
              if(formData.vdc_id)
              dispatch(getAll(formData.vdc_id));
            }
          },
          error => {
            failure(error.toString()),
            toast.error(error.toString());
          } 
        );
    };
    function request(formData) { return { type: vmlistConstants.VMDATE_SCHEDULER_REQUEST, formData } }
    function success(formData) { return { type: vmlistConstants.VMDATE_SCHEDULER_SUCCESS, formData } }
    function failure(error) { return { type: vmlistConstants.VMDATE_SCHEDULER_FAILURE, error } }

}