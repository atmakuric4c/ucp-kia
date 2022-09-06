import { awsConstants } from './aws.constants';
import { awsService } from './aws.services';
import { alertActions } from '../../_actions';
import { history } from '../../_helpers';
import { toast } from 'react-toastify';

export const awsActions = {
    getAll,
    getAwsResourceGroups,
    addVm,
    vmOperations,
    vmResize,
    vmLogs,
    vmDetail,
    getAwsSubscriptions,
    getAwsSubscriptionLocations,
    addAwsResourceGroups,
    getAllNetwork,
    addAwsNetwork
};
function getAllNetwork(clientid) {
  return dispatch => {
      dispatch(request());
      awsService.getAllNetwork(clientid)
          .then(
              list => dispatch(success(list)),
              error => dispatch(failure(error.toString()))
          );
  };

  function request() { return { type: awsConstants.GETALLNETWORK_REQUEST } }
  function success(list) { return { type: awsConstants.GETALLNETWORK_SUCCESS, list } }
  function failure(error) { return { type: awsConstants.GETALLNETWORK_FAILURE, error } }
}

function getAwsResourceGroups(clientid) {
  return dispatch => {
      dispatch(request(clientid));
      awsService.getAwsResourceGroups(clientid)       
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

  function request(clientid) { return { type: awsConstants.getAwsResourceGroups_REQUEST, clientid } }
  function success(resourceGroups) { return { type: awsConstants.getAwsResourceGroups_SUCCESS, resourceGroups } }
  function failure(error) { return { type: awsConstants.getAwsResourceGroups_FAILURE, error } }
}

function getAll(clientid) {
    return dispatch => {
        dispatch(request());
        awsService.getAll(clientid)
            .then(
                vmlist => dispatch(success(vmlist)),
                error => dispatch(failure(error.toString()))
            );
    };

    function request() { return { type: awsConstants.GETALL_REQUEST } }
    function success(vmlist) { return { type: awsConstants.GETALL_SUCCESS, vmlist } }
    function failure(error) { return { type: awsConstants.GETALL_FAILURE, error } }
}

function addVm(formData){
    return dispatch => {
        dispatch(request(formData));
        awsService.addVm(formData).then(
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
      return { type: awsConstants.ADDVM_REQUEST, formData };
    }
    function success(resdata) {
      return { type: awsConstants.ADDVM_SUCCESS, resdata };
    }
    function failure(error) {
      return { type: awsConstants.ADDVM_FAILURE, error };
    }
}

function vmOperations(postParams) {
    return dispatch => {
        dispatch(request(postParams));
        awsService.vmOperations(postParams)       
            .then(
                resData => { 
                    dispatch(vmDetail({clientid:postParams.clientid,vm_id:postParams.vm_id}));
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

    function request(postParams) { return { type: awsConstants.VMOPERATIONS_REQUEST, postParams } }
    function success(postParams) { return { type: awsConstants.VMOPERATIONS_SUCCESS, postParams } }
    function failure(error) { return { type: awsConstants.VMOPERATIONS_FAILURE, error } }
}

function vmResize(formData){
    return dispatch => {
        dispatch(request(formData));
        awsService.vmResize(formData)       
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
    function request(formData) { return { type: awsConstants.VMOPERATIONS_REQUEST, formData } }
    function success(formData) { return { type: awsConstants.VMOPERATIONS_SUCCESS, formData } }
    function failure(error) { return { type: awsConstants.VMOPERATIONS_FAILURE, error } }
}

function vmLogs(params) {
    return dispatch => {
        dispatch(request());
        awsService.vmLogs(params)       
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

    function request() { return { type: awsConstants.VMLOGS_REQUEST } }
    function success(logData) { return { type: awsConstants.VMLOGS_SUCCESS, logData } }
    function failure(error) { return { type: awsConstants.VMLOGS_FAILURE, error } }
}
function vmDetail(obj) {
  return dispatch => {
      dispatch(request());
      awsService.vmDetail(obj)       
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

  function request() { return { type: awsConstants.VMDETAIL_REQUEST } }
  function success(vm_data) { return { type: awsConstants.VMDETAIL_SUCCESS, vm_data } }
  function failure(error) { return { type: awsConstants.VMDETAIL_FAILURE, error } }
}

function getAwsSubscriptions(reqData) {
  return dispatch => {
      dispatch(request(reqData));
      awsService.getAwsSubscriptions(reqData)       
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

  function request(reqData) { return { type: awsConstants.getAwsSubscriptions_REQUEST, reqData } }
  function success(subscription_list) { return { type: awsConstants.getAwsSubscriptions_SUCCESS, subscription_list } }
  function failure(error) { return { type: awsConstants.getAwsSubscriptions_FAILURE, error } }
}

function getAwsSubscriptionLocations(reqData) {
  return dispatch => {
      dispatch(request(reqData));
      awsService.getAwsSubscriptionLocations(reqData)       
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

  function request(reqData) { return { type: awsConstants.getAwsSubscriptionLocations_REQUEST, reqData } }
  function success(subscription_locations) { return { type: awsConstants.getAwsSubscriptionLocations_SUCCESS, subscription_locations } }
  function failure(error) { return { type: awsConstants.getAwsSubscriptionLocations_FAILURE, error } }
}

function addAwsResourceGroups(reqData,clientid) {
  return dispatch => {
      dispatch(request(reqData));
      awsService.addAwsResourceGroups(reqData)       
          .then(
            res => { 
                  dispatch(success(res));
                  if(res.status == 'success'){
                    toast.success(res.message);
                    setTimeout(function() {
                      dispatch(getAwsResourceGroups(clientid));
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

  function request(reqData) { return { type: awsConstants.addAwsResourceGroups_REQUEST, reqData } }
  function success(res) { return { type: awsConstants.addAwsResourceGroups_SUCCESS, res } }
  function failure(error) { return { type: awsConstants.addAwsResourceGroups_FAILURE, error } }
}

function addAwsNetwork(reqData,clientid) {
  return dispatch => {
      dispatch(request(reqData));
      awsService.addAwsNetwork(reqData)       
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

  function request(reqData) { return { type: awsConstants.addAwsNetwork_REQUEST, reqData } }
  function success(res) { return { type: awsConstants.addAwsNetwork_SUCCESS, res } }
  function failure(error) { return { type: awsConstants.addAwsNetwork_FAILURE, error } }
}
