import { ordersConstants } from './orders.constants';
import { ordersService } from './orders.services';
import { alertActions } from '../../_actions';
import { history } from '../../_helpers';
import { toast } from 'react-toastify';

export const ordersActions = {
    getAllCloudNames,
    getAllDCLocations,
    getCopyTypes,
    getTxnDetails,
    getOsTemplates,
    getBillingPrice,
    getPendingOrders,
    getConsoleOutput,
    saveOrderInfo,
    saveTxnInfo,
    payFromFunds,
    getCartList,
    getApprovalPendingCartList,
    getApprovalPendingVmOpsList,
    getTxnSuccessData,
    updateCartItemCount,
    deleteCartItem,
    updatePgiSelection
};

function getCartList(formData) {
    return dispatch => {
        dispatch(request(formData));
        ordersService.getCartList(formData)       
            .then(
                cartList => { 
                    dispatch(success(cartList));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(formData) { return { type: ordersConstants.getCartList_REQUEST, formData } }
    function success(cartList) { return { type: ordersConstants.getCartList_SUCCESS, cartList } }
    function failure(error) { return { type: ordersConstants.getCartList_FAILURE, error } }
  }

function getApprovalPendingCartList(formData) {
    return dispatch => {
        dispatch(request(formData));
        ordersService.getApprovalPendingCartList(formData)       
            .then(
        		approvalPendingCartList => { 
                    dispatch(success(approvalPendingCartList));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(user_id) { return { type: ordersConstants.getApprovalPendingCartList_REQUEST, user_id } }
    function success(approvalPendingCartList) { return { type: ordersConstants.getApprovalPendingCartList_SUCCESS, approvalPendingCartList } }
    function failure(error) { return { type: ordersConstants.getApprovalPendingCartList_FAILURE, error } }
  }

function getApprovalPendingVmOpsList(formData) {
    return dispatch => {
        dispatch(request(formData));
        ordersService.getApprovalPendingVmOpsList(formData)       
            .then(
        		approvalPendingCartList => { 
                    dispatch(success(approvalPendingCartList));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(user_id) { return { type: ordersConstants.getApprovalPendingVmOpsList_REQUEST, user_id } }
    function success(approvalPendingVmOpsList) { return { type: ordersConstants.getApprovalPendingVmOpsList_SUCCESS, approvalPendingVmOpsList } }
    function failure(error) { return { type: ordersConstants.getApprovalPendingVmOpsList_FAILURE, error } }
  }

  function getTxnSuccessData(txnId) {
    return dispatch => {
        dispatch(request(txnId));
        ordersService.getTxnSuccessData(txnId)       
            .then(
                cartList => { 
                    dispatch(success(cartList));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(txnId) { return { type: ordersConstants.getTxnSuccessData_REQUEST, txnId } }
    function success(TxnSuccessData) { return { type: ordersConstants.getTxnSuccessData_SUCCESS, TxnSuccessData } }
    function failure(error) { return { type: ordersConstants.getTxnSuccessData_FAILURE, error } }
  }

  function updateCartItemCount(user_id, id,count) {
    return dispatch => {
        dispatch(request(id,count));
        ordersService.updateCartItemCount(id,count)       
            .then(
                result => { 
                    dispatch(success(result));
                    dispatch(getCartList(user_id));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                    dispatch(getCartList(user_id));
                }
            );
    };
  
    function request(id,count) { return { type: ordersConstants.updateCartItemCount_REQUEST, id,count } }
    function success(result) { return { type: ordersConstants.updateCartItemCount_SUCCESS, result } }
    function failure(error) { return { type: ordersConstants.updateCartItemCount_FAILURE, error } }
  }

  function deleteCartItem(user_id,id) {
    return dispatch => {
        dispatch(request(id));
        ordersService.deleteCartItem(id)       
            .then(
                result => { 
                    dispatch(success(result));
                    dispatch(getCartList(user_id));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                    dispatch(getCartList(user_id));
                }
            );
    };
  
    function request(id) { return { type: ordersConstants.updateCartItemCount_REQUEST, id } }
    function success(result) { return { type: ordersConstants.updateCartItemCount_SUCCESS, result } }
    function failure(error) { return { type: ordersConstants.updateCartItemCount_FAILURE, error } }
  }

function getAllCloudNames() {
    return dispatch => {
        dispatch(request());
        ordersService.getAllCloudNames()
            .then(
              cloudNames => dispatch(success(cloudNames)),
                error => dispatch(failure(error.toString()))
            );
    };

    function request() { return { type: ordersConstants.CLOUDNAMES_GETALL_REQUEST } }
    function success(cloudNames) {  return { type: ordersConstants.CLOUDNAMES_GETALL_SUCCESS, cloudNames } }
    function failure(error) { return { type: ordersConstants.CLOUDNAMES_GETALL_FAILURE, error } }
}

function getAllDCLocations(cloudName) {
  return dispatch => {
      dispatch(request(cloudName));
      ordersService.getAllDCLocations(cloudName)       
          .then(
            DCLocations => { 
                  dispatch(success(DCLocations));
              },
              error => {
                  dispatch(failure(error.toString()));
                  dispatch(alertActions.error(error.toString()));
              }
          );
  };

  function request(cloudName) { return { type: ordersConstants.DCLocations_GETALL_REQUEST, cloudName } }
  function success(DCLocations) { return { type: ordersConstants.DCLocations_GETALL_SUCCESS, DCLocations } }
  function failure(error) { return { type: ordersConstants.DCLocations_GETALL_FAILURE, error } }
}

function getCopyTypes(vdc_tech_disk_id) {
  return dispatch => {
      dispatch(request(vdc_tech_disk_id));
      ordersService.getCopyTypes(vdc_tech_disk_id)       
          .then(
            CopyTypes => { 
                  dispatch(success(CopyTypes));
              },
              error => {
                  dispatch(failure(error.toString()));
                  dispatch(alertActions.error(error.toString()));
              }
          );
  };

  function request(vdc_tech_disk_id) { return { type: ordersConstants.CopyTypes_GETALL_REQUEST, vdc_tech_disk_id } }
  function success(CopyTypes) { return { type: ordersConstants.CopyTypes_GETALL_SUCCESS, CopyTypes } }
  function failure(error) { return { type: ordersConstants.CopyTypes_GETALL_FAILURE, error } }
}

function getTxnDetails(txnId) {
    return dispatch => {
        dispatch(request(txnId));
        ordersService.getTxnDetails(txnId)       
            .then(
                TxnDetails => { 
                    dispatch(success(TxnDetails));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(txnId) { return { type: ordersConstants.getTxnDetails_REQUEST, txnId } }
    function success(TxnDetails) {console.log(TxnDetails); return { type: ordersConstants.getTxnDetails_SUCCESS, TxnDetails } }
    function failure(error) { return { type: ordersConstants.getTxnDetails_FAILURE, error } }
  }

function getOsTemplates(vdc_tech_disk_id) {
  return dispatch => {
      dispatch(request(vdc_tech_disk_id));
      ordersService.getOsTemplates(vdc_tech_disk_id)       
          .then(
            OsTemplates => { 
                  dispatch(success(OsTemplates));
              },
              error => {
                  dispatch(failure(error.toString()));
                  dispatch(alertActions.error(error.toString()));
              }
          );
  };

  function request(vdc_tech_disk_id) { return { type: ordersConstants.OsTemplates_GETALL_REQUEST, vdc_tech_disk_id } }
  function success(OsTemplates) { return { type: ordersConstants.OsTemplates_GETALL_SUCCESS, OsTemplates } }
  function failure(error) { return { type: ordersConstants.OsTemplates_GETALL_FAILURE, error } }
}

function getBillingPrice(formData){
    return dispatch => {
        dispatch(request(formData));
        ordersService.getBillingPrice(formData).then(
            BillingPrice => {
            dispatch(success(BillingPrice));
        },
        error => {
            failure(error.toString()),
            dispatch(alertActions.error(error.toString()));
        }
        );
    }
    function request(formData) {
    return { type: ordersConstants.BillingPrice_REQUEST, formData };
    }
    function success(BillingPrice) {
    return { type: ordersConstants.BillingPrice_SUCCESS, BillingPrice };
    }
    function failure(error) {
    return { type: ordersConstants.BillingPrice_FAILURE, error };
    }
}

function getPendingOrders(formData){
    return dispatch => {
        dispatch(request(formData));
        ordersService.getPendingOrders(formData).then(
        		pendingOrders => {
            dispatch(success(pendingOrders));
        },
        error => {
            failure(error.toString()),
            dispatch(alertActions.error(error.toString()));
        }
        );
    }
    function request(formData) {
    return { type: ordersConstants.getPendingOrders_REQUEST, formData };
    }
    function success(pendingOrders) {
    return { type: ordersConstants.getPendingOrders_SUCCESS, pendingOrders };
    }
    function failure(error) {
    return { type: ordersConstants.getPendingOrders_FAILURE, error };
    }
}

function getConsoleOutput(formData){
    return dispatch => {
        dispatch(request(formData));
        ordersService.getConsoleOutput(formData).then(
        		consoleOutput => {
            dispatch(success(consoleOutput));
        },
        error => {
            failure(error.toString()),
            dispatch(alertActions.error(error.toString()));
        }
        );
    }
    function request(formData) {
    return { type: ordersConstants.getConsoleOutput_REQUEST, formData };
    }
    function success(consoleOutput) {
    return { type: ordersConstants.getConsoleOutput_SUCCESS, consoleOutput };
    }
    function failure(error) {
    return { type: ordersConstants.getConsoleOutput_FAILURE, error };
    }
}

function updatePgiSelection(formData){
    return dispatch => {
        dispatch(request(formData));
        ordersService.updatePgiSelection(formData).then(
        		resdata => {
            dispatch(success(resdata));
        },
        error => {
            failure(error.toString()),
            dispatch(alertActions.error(error.toString()));
        }
        );
    }
    function request(formData) {
    return { type: ordersConstants.updatePgiSelection_REQUEST, formData };
    }
    function success(resdata) {
    return { type: ordersConstants.updatePgiSelection_SUCCESS, resdata };
    }
    function failure(error) {
    return { type: ordersConstants.updatePgiSelection_FAILURE, error };
    }
}

function saveOrderInfo(formData){
    return dispatch => {
        dispatch(request(formData));
        ordersService.saveOrderInfo(formData).then(
        resdata => {
            dispatch(success(resdata));
            if(resdata.success == false){          
                toast.error(resdata.message);
            } else {          
                toast.success(resdata.message);
            }
        },
        error => {
            failure(error.toString()),
            toast.error(error.toString());
        }
        );
    }
    function request(formData) {
    return { type: ordersConstants.saveOrderInfo_REQUEST, formData };
    }
    function success(resdata) {
    return { type: ordersConstants.saveOrderInfo_SUCCESS, resdata };
    }
    function failure(error) {
    return { type: ordersConstants.saveOrderInfo_FAILURE, error };
    }
}

function saveTxnInfo(formData){
    return dispatch => {
        dispatch(request(formData));
        ordersService.saveTxnInfo(formData).then(
        pgiData => {
            dispatch(success(pgiData));
            history.push("/#/pgiSelection/"+pgiData.uid);
            location.reload();
        },
        error => {
            failure(error.toString())
        }
        );
    }
    function request(formData) {
    return { type: ordersConstants.saveTxnInfo_REQUEST, formData };
    }
    function success(pgiData) {
    return { type: ordersConstants.saveTxnInfo_SUCCESS, pgiData };
    }
    function failure(error) {
    return { type: ordersConstants.saveTxnInfo_FAILURE, error };
    }
}

function payFromFunds(formData){
    return dispatch => {
        dispatch(request(formData));
        ordersService.payFromFunds(formData).then(
        TxnSuccessData => {
            dispatch(success(TxnSuccessData));
            history.push("/#/txnSuccess/"+TxnSuccessData.uid);
            location.reload();
        },
        error => {
            failure(error.toString()),
            toast.error(error.toString());
        }
        );
    }
    function request(formData) {
    return { type: ordersConstants.payFromFunds_REQUEST, formData };
    }
    function success(TxnSuccessData) {
    return { type: ordersConstants.payFromFunds_SUCCESS, TxnSuccessData };
    }
    function failure(error) {
    return { type: ordersConstants.payFromFunds_FAILURE, error };
    }
}