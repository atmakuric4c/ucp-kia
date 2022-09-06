import { vmlistConstants } from './vmlist.constants';
import { vmlistService } from './vmlist.services';
import { alertActions } from '../../_actions';
import { history } from '../../_helpers';
import Swal from "sweetalert2";
import { toast } from 'react-toastify';

export const vmlistActions = {
    getAll,
    addVm,
    vmOperations,
    vmResize,
    vmLogs,
    vmDetail,
    getDiskDetails,
    vmAddDisk,
    vmDeleteDisk,
    veeamOperations
};
function veeamOperations(postParams) {
  return dispatch => {
      dispatch(request());
      vmlistService.veeamOperations(postParams)       
          .then(
              resData => { 
                setTimeout(function () {
                    dispatch(vmDetail(postParams.clientid,postParams.vm_id));
                }, 2000);
                  if(resData.success==1)    
                  toast.success(resData.message);
                  else
                  toast.error( "Backup Opeartion Failed");
              },
              error => {
                  toast.error("Backup Opeartion Failed");
              }
          );
  };

  function request() { return { type: vmlistConstants.VEEAMACTION_REQUEST } }
  function success(postParams) { return { type: vmlistConstants.VEEAMACTION_SUCCESS, postParams } }
  function failure(error) { return { type: vmlistConstants.VEEAMACTION_FAILURE, error } }
}
function vmOperations(postParams) {
  return dispatch => {
      dispatch(request(postParams));
      vmlistService.vmOperations(postParams)       
          .then(
              resData => { 
                  dispatch(vmDetail(postParams.clientid,postParams.vm_id));
                  if(resData.success==1)      
                    toast.success(resData.message);
                  else
                    toast.error("VM Opeartion Failed");
              },
              error => {
                  toast.error("VM Opeartion Failed");
              }
          );
  };

  function request(postParams) { return { type: vmlistConstants.VMOPERATIONS_REQUEST, postParams } }
  function success(postParams) { return { type: vmlistConstants.VMOPERATIONS_SUCCESS, postParams } }
  function failure(error) { return { type: vmlistConstants.VMOPERATIONS_FAILURE, error } }
}
function getAll(vdc_id) {
    return dispatch => {
        dispatch(request());
        vmlistService.getAll(vdc_id)
            .then(
                vmlist => dispatch(success(vmlist)),
                error => dispatch(failure(error.toString()))
            );
    };

    function request() { return { type: vmlistConstants.GETALL_REQUEST } }
    function success(vmlist) { return { type: vmlistConstants.GETALL_SUCCESS, vmlist } }
    function failure(error) { return { type: vmlistConstants.GETALL_FAILURE, error } }
}
function addVm(formData){
    return dispatch => {
        dispatch(request(formData));
        vmlistService.addVm(formData).then(
          resdata => {
            dispatch(success(resdata));
            console.log(JSON.stringify(resdata))
            // history.push("/monitoringdashboard");
            if(resdata.success == false){          
                toast.error(resdata.message);
            } else {          
                toast.success("Your VM creation request is submitted successfully");
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
      return { type: vmlistConstants.ADDVM_REQUEST, formData };
    }
    function success(resdata) {
      return { type: vmlistConstants.ADDVM_SUCCESS, resdata };
    }
    function failure(error) {
      return { type: vmlistConstants.ADDVM_FAILURE, error };
    }
}

function vmResize(formData){
    return dispatch => {
        dispatch(request(formData));
        vmlistService.vmResize(formData)       
          .then(
            resData => { 
                dispatch(vmDetail(btoa(formData.user_id),btoa(formData.vm_id)));
                if(resData.success==1)      
                    toast.success(resData.message);
                else
                    toast.error("VM Opeartion Failed");
            },
            error => {
                toast.error("VM Opeartion Failed");
            }
        );
    };
    function request(formData) { return { type: vmlistConstants.VMOPERATIONS_REQUEST, formData } }
    function success(formData) { return { type: vmlistConstants.VMOPERATIONS_SUCCESS, formData } }
    function failure(error) { return { type: vmlistConstants.VMOPERATIONS_FAILURE, error } }
}

function vmLogs(params) {
    return dispatch => {
        dispatch(request());
        vmlistService.vmLogs(params)       
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

    function request() { return { type: vmlistConstants.VMLOGS_REQUEST } }
    function success(logData) { return { type: vmlistConstants.VMLOGS_SUCCESS, logData } }
    function failure(error) { return { type: vmlistConstants.VMLOGS_FAILURE, error } }
}
function vmDetail(clientid,vmid) {
  return dispatch => {
      dispatch(request());
      vmlistService.vmDetail({clientid:clientid,vmid:vmid})       
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

  function request() { return { type: vmlistConstants.VMDETAIL_REQUEST } }
  function success(vm_data) { return { type: vmlistConstants.VMDETAIL_SUCCESS, vm_data } }
  function failure(error) { return { type: vmlistConstants.VMDETAIL_FAILURE, error } }
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

    function request(vmid) { return { type: vmlistConstants.DISKINFO_REQUEST, vmid } }
    function success(diskInfo) { return { type: vmlistConstants.DISKINFO_SUCCESS, diskInfo } }
    function failure(error) { return { type: vmlistConstants.DISKINFO_FAILURE, error } }
}

function vmAddDisk(formData){
    return dispatch => {
        dispatch(request(formData));
        vmlistService.vmAddDisk(formData);  
            
    };

    function request(formData) { return { type: vmlistConstants.ADDDISK_REQUEST, formData } }
    function success(formData) { return { type: vmlistConstants.ADDDISK_SUCCESS, formData } }
    function failure(error) { return { type: vmlistConstants.ADDDISK_FAILURE, error } }

}

function vmDeleteDisk(delDiskInfo){
    return dispatch => {
        dispatch(request(delDiskInfo));
        vmlistService.vmDeleteDisk(delDiskInfo);  
            
    };

    function request(delDiskInfo) { return { type: vmlistConstants.DELETEDISK_REQUEST, delDiskInfo } }
    function success(delDiskInfo) { return { type: vmlistConstants.DELETEDISK_SUCCESS, delDiskInfo } }
    function failure(error) { return { type: vmlistConstants.DELETEDISK_FAILURE, error } }

}
