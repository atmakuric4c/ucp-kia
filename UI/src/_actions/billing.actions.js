import { billingConstants } from '../_constants';
import { billingService } from '../_services';
import { alertActions } from './alert.actions';
import { toast } from 'react-toastify';

export const billingActions = {
    getBudgetAlerts,
    updateBudgetAlerts,
    updateBudgetModal,
    getAwsBillingReports,
    getAzureBillingReports,
    getGcpBillingReports
};

function getBudgetAlerts(params){
    return dispatch => {
        dispatch(request(params.clientid));
        billingService.getBudgetAlerts(params)       
            .then(
                budgetAlerts => { 
                    dispatch(success({ alert: budgetAlerts, cloudName: params.cloudName}));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(clientid) { return { type: billingConstants.BUDGET_REPORT_REQUEST, clientid } }
    function success(budgetAlerts) { return { type: billingConstants.BUDGET_REPORT_SUCCESS, budgetAlerts } }
    function failure(error) { return { type: billingConstants.BUDGET_REPORT_FAILURE, error } }
}

function updateBudgetAlerts(reqData) {
    return dispatch => {
        dispatch(request(reqData));
        billingService.updateBudgetAlerts(reqData)       
            .then(
                pgiData => { 
                    dispatch(success(pgiData), toast.success('Budget Alert Updated Successfully!'));
                    dispatch(this.getBudgetAlerts({ clientid: reqData.clientid, cloudName: reqData.cloudName,}));
                },
                error => {
                    console.log('456', error);
                    dispatch(failure(error.toString(), toast.error(error)));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(reqData) { return { type: billingConstants.BUDGET_REPORT_UPDATE_REQUEST, reqData } }
    function success(pgiData) { return { type: billingConstants.BUDGET_REPORT_UPDATE_SUCCESS, pgiData } }
    function failure(error) { return { type: billingConstants.BUDGET_REPORT_UPDATE_FAILURE, error } }
}

function updateBudgetModal(type) {
    return dispatch => {
        dispatch({ type: billingConstants.BUDGET_REPORT_UPDATE_MODAL, value: type });
    }
}

function getAwsBillingReports(params) {
    return dispatch => {
        dispatch(request(params.clientid));
        billingService.getAwsBillingReports(params)       
            .then(
                reports => { 
                    dispatch(success(reports));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(clientid) { return { type: billingConstants.AWS_BILLING_REPORT_REQUEST, clientid } }
    function success(reports) { return { type: billingConstants.AWS_BILLING_REPORT_SUCCESS, reports } }
    function failure(error) { return { type: billingConstants.AWS_BILLING_REPORT_FAILURE, error } }
  }

function getAzureBillingReports(params) {
    return dispatch => {
        dispatch(request(params.clientid));
        billingService.getAzureBillingReports(params)       
            .then(
                reports => { 
                    dispatch(success(reports));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(clientid) { return { type: billingConstants.AZURE_BILLING_REPORT_REQUEST, clientid } }
    function success(reports) { return { type: billingConstants.AZURE_BILLING_REPORT_SUCCESS, reports } }
    function failure(error) { return { type: billingConstants.AZURE_BILLING_REPORT_FAILURE, error } }
  }

  function getGcpBillingReports(params) {
    return dispatch => {
        dispatch(request(params.clientid));
        billingService.getGcpBillingReports(params)       
            .then(
                reports => { 
                    dispatch(success(reports));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(clientid) { return { type: billingConstants.GCP_BILLING_REPORT_REQUEST, clientid } }
    function success(reports) { return { type: billingConstants.GCP_BILLING_REPORT_SUCCESS, reports } }
    function failure(error) { return { type: billingConstants.GCP_BILLING_REPORT_FAILURE, error } }
  }
