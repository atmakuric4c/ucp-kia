import { azureConstants } from './azure.constants';
import { azureService } from './azure.services';
import { alertActions } from '../../_actions';
import { history } from '../../_helpers';
import { toast } from 'react-toastify';

export const azureActions = {
    getAll,
    getAzureResourceGroups,
    getUserVmAccessRequests,
    getAzureDropdownData,
    addVm,
    vmOperations,
    vmResize,
    vmLogs,
    vmDetail,
    getAzureSubscriptions,
    getAzureSubscriptionLocations,
    addAzureResourceGroups,
    getAllNetwork,
    addAzureNetwork
};
function getAllNetwork(clientid) {
  return dispatch => {
      dispatch(request());
      azureService.getAllNetwork(clientid)
          .then(
              list => dispatch(success(list)),
              error => dispatch(failure(error.toString()))
          );
  };

  function request() { return { type: azureConstants.GETALLNETWORK_REQUEST } }
  function success(list) { return { type: azureConstants.GETALLNETWORK_SUCCESS, list } }
  function failure(error) { return { type: azureConstants.GETALLNETWORK_FAILURE, error } }
}

function getAzureResourceGroups(params) {
  return dispatch => {
      dispatch(request(params));
      azureService.getAzureResourceGroups(params)       
          .then(
              orderList => { 
                  dispatch(success(orderList));
              },
              error => {
                  dispatch(failure(error.toString()));
                  dispatch(alertActions.error(error.toString()));
              }
          );
  };

  function request(params) { return { type: azureConstants.getAzureResourceGroups_REQUEST, params } }
  function success(resourceGroups) { return { type: azureConstants.getAzureResourceGroups_SUCCESS, resourceGroups } }
  function failure(error) { return { type: azureConstants.getAzureResourceGroups_FAILURE, error } }
}

function getUserVmAccessRequests(params) {
  return dispatch => {
      dispatch(request(params));
      azureService.getUserVmAccessRequests(params)       
          .then(
              orderList => { 
                  dispatch(success(orderList));
              },
              error => {
                  dispatch(failure(error.toString()));
                  dispatch(alertActions.error(error.toString()));
              }
          );
  };

  function request(params) { return { type: azureConstants.getUserVmAccessRequests_REQUEST, params } }
  function success(userVmAccessRequests) { return { type: azureConstants.getUserVmAccessRequests_SUCCESS, userVmAccessRequests } }
  function failure(error) { return { type: azureConstants.getUserVmAccessRequests_FAILURE, error } }
}

function getAzureDropdownData(params) {
  return dispatch => {
      dispatch(request(params));
      azureService.getAzureDropdownData(params)       
          .then(
    		  dropdownData => { 
                  dispatch(success(dropdownData));
              },
              error => {
                  dispatch(failure(error.toString()));
                  dispatch(alertActions.error(error.toString()));
              }
          );
  };

  function request(params) { return { type: azureConstants.getAzureDropdownData_REQUEST, params } }
  function success(dropdownData) { return { type: azureConstants.getAzureDropdownData_SUCCESS, dropdownData } }
  function failure(error) { return { type: azureConstants.getAzureDropdownData_FAILURE, error } }
}

function getAll(clientid) {
    return dispatch => {
        dispatch(request());
        azureService.getAll(clientid)
            .then(
                vmlist => dispatch(success(vmlist)),
                error => dispatch(failure(error.toString()))
            );
    };

    function request() { return { type: azureConstants.GETALL_REQUEST } }
    function success(vmlist) { return { type: azureConstants.GETALL_SUCCESS, vmlist } }
    function failure(error) { return { type: azureConstants.GETALL_FAILURE, error } }
}

function addVm(formData){
    return dispatch => {
        dispatch(request(formData));
        azureService.addVm(formData).then(
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
      return { type: azureConstants.ADDVM_REQUEST, formData };
    }
    function success(resdata) {
      return { type: azureConstants.ADDVM_SUCCESS, resdata };
    }
    function failure(error) {
      return { type: azureConstants.ADDVM_FAILURE, error };
    }
}

function vmOperations(postParams) {
    return dispatch => {
        dispatch(request(postParams));
        azureService.vmOperations(postParams)       
            .then(
                resData => { 
//                    dispatch(vmDetail(postParams.vm_id));
                    if(resData.success==1){
                    	toast.success(resData.message);
                    	setTimeout(() => {
                            location.reload(true);
                          }, 1000);
                    }else{
                    	toast.error("VM Opeartion Failed");
                    }
                },
                error => {
                    toast.error("VM Opeartion Failed");
                }
            );
    };

    function request(postParams) { return { type: azureConstants.VMOPERATIONS_REQUEST, postParams } }
    function success(postParams) { return { type: azureConstants.VMOPERATIONS_SUCCESS, postParams } }
    function failure(error) { return { type: azureConstants.VMOPERATIONS_FAILURE, error } }
}

function vmResize(formData){
    return dispatch => {
        dispatch(request(formData));
        azureService.vmResize(formData)       
          .then(
            resData => { 
                dispatch(vmDetail(btoa(formData.vm_id)));
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
    function request(formData) { return { type: azureConstants.VMOPERATIONS_REQUEST, formData } }
    function success(formData) { return { type: azureConstants.VMOPERATIONS_SUCCESS, formData } }
    function failure(error) { return { type: azureConstants.VMOPERATIONS_FAILURE, error } }
}

function vmLogs(params) {
    return dispatch => {
        dispatch(request());
        azureService.vmLogs(params)       
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

    function request() { return { type: azureConstants.VMLOGS_REQUEST } }
    function success(logData) { return { type: azureConstants.VMLOGS_SUCCESS, logData } }
    function failure(error) { return { type: azureConstants.VMLOGS_FAILURE, error } }
}
function vmDetail(encId) {
  return dispatch => {
      dispatch(request());
      azureService.vmDetail(encId)       
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

  function request() { return { type: azureConstants.VMDETAIL_REQUEST } }
  function success(vm_data) { return { type: azureConstants.VMDETAIL_SUCCESS, vm_data } }
  function failure(error) { return { type: azureConstants.VMDETAIL_FAILURE, error } }
}

function getAzureSubscriptions(reqData) {
  return dispatch => {
      dispatch(request(reqData));
      azureService.getAzureSubscriptions(reqData)       
          .then(
            subscription_list => { 
                  dispatch(success(subscription_list));
              },
              error => {
                  dispatch(failure(error.toString()));
                  dispatch(alertActions.error(error.toString()));
              }
          );
  };

  function request(reqData) { return { type: azureConstants.getAzureSubscriptions_REQUEST, reqData } }
  function success(subscription_list) { return { type: azureConstants.getAzureSubscriptions_SUCCESS, subscription_list } }
  function failure(error) { return { type: azureConstants.getAzureSubscriptions_FAILURE, error } }
}

function getAzureSubscriptionLocations(reqData) {
  return dispatch => {
      dispatch(request(reqData));
      azureService.getAzureSubscriptionLocations(reqData)       
          .then(
            subscription_locations => { 
                  dispatch(success(subscription_locations));
              },
              error => {
                  dispatch(failure(error.toString()));
                  dispatch(alertActions.error(error.toString()));
              }
          );
  };

  function request(reqData) { return { type: azureConstants.getAzureSubscriptionLocations_REQUEST, reqData } }
  function success(subscription_locations) { return { type: azureConstants.getAzureSubscriptionLocations_SUCCESS, subscription_locations } }
  function failure(error) { return { type: azureConstants.getAzureSubscriptionLocations_FAILURE, error } }
}

function addAzureResourceGroups(reqData,clientid) {
  return dispatch => {
      dispatch(request(reqData));
      azureService.addAzureResourceGroups(reqData)       
          .then(
            res => { 
                  dispatch(success(res));
                  if(res.status == 'success'){
                    toast.success(res.message);
                    setTimeout(function() {
                      dispatch(getAzureResourceGroups(clientid));
                    }, 2000);
                  }else{
                    toast.error(res.message);
                  }
              },
              error => {
                  dispatch(failure(error.toString()));
                  dispatch(alertActions.error(error.toString()));
              }
          );
  };

  function request(reqData) { return { type: azureConstants.addAzureResourceGroups_REQUEST, reqData } }
  function success(res) { return { type: azureConstants.addAzureResourceGroups_SUCCESS, res } }
  function failure(error) { return { type: azureConstants.addAzureResourceGroups_FAILURE, error } }
}

function addAzureNetwork(reqData,clientid) {
  return dispatch => {
      dispatch(request(reqData));
      azureService.addAzureNetwork(reqData)       
          .then(
            res => { 
                  dispatch(success(res));
                  if(res.status == 'success'){
                    toast.success(res.message);
                    setTimeout(function() {
                      dispatch(getAllNetwork(clientid));
                    }, 2000);
                  }else{
                    toast.error(res.message);
                  }
              },
              error => {
                  dispatch(failure(error.toString()));
                  dispatch(alertActions.error(error.toString()));
              }
          );
  };

  function request(reqData) { return { type: azureConstants.addAzureNetwork_REQUEST, reqData } }
  function success(res) { return { type: azureConstants.addAzureNetwork_SUCCESS, res } }
  function failure(error) { return { type: azureConstants.addAzureNetwork_FAILURE, error } }
}
