import { billingConstants } from './billing.constants';
import { billingService } from './billing.services';
import { alertActions } from '../../_actions';
import { history } from '../../_helpers';
import Swal from "sweetalert2";
import { budgetAlerts } from './budgetAlerts';
import { toast } from 'react-toastify';

export const billingActions = {
    getOrderList,
    getInvoiceList,
    getTransactionsList,
    getPaymentsList,
    getOrderDetails,
    viewHourlyReport,
    downloadHourlyReport,
    payInvoice
};

function getOrderList(clientid) {
    return dispatch => {
        dispatch(request(clientid));
        billingService.getOrderList(clientid)       
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
  
    function request(clientid) { return { type: billingConstants.getOrderList_REQUEST, clientid } }
    function success(orderList) { return { type: billingConstants.getOrderList_SUCCESS, orderList } }
    function failure(error) { return { type: billingConstants.getOrderList_FAILURE, error } }
  }

  function getInvoiceList(clientid) {
    return dispatch => {
        dispatch(request(clientid));
        billingService.getInvoiceList(clientid)       
            .then(
                invoicesList => { 
                    dispatch(success(invoicesList));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(clientid) { return { type: billingConstants.getInvoiceList_REQUEST, clientid } }
    function success(invoicesList) { return { type: billingConstants.getInvoiceList_SUCCESS, invoicesList } }
    function failure(error) { return { type: billingConstants.getInvoiceList_FAILURE, error } }
  }

  function payInvoice(reqData) {
    return dispatch => {
        dispatch(request(reqData));
        billingService.payInvoice(reqData)       
            .then(
                pgiData => { 
                    dispatch(success(pgiData));
                    history.push("/#/pgiSelection/"+pgiData.uid);
                    location.reload();
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(reqData) { return { type: billingConstants.payInvoice_REQUEST, reqData } }
    function success(pgiData) { return { type: billingConstants.payInvoice_SUCCESS, pgiData } }
    function failure(error) { return { type: billingConstants.payInvoice_FAILURE, error } }
  }

  function getTransactionsList(clientid) {
    return dispatch => {
        dispatch(request(clientid));
        billingService.getTransactionsList(clientid)       
            .then(
                transactionsList => { 
                    dispatch(success(transactionsList));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(clientid) { return { type: billingConstants.getTransactionsList_REQUEST, clientid } }
    function success(transactionsList) { return { type: billingConstants.getTransactionsList_SUCCESS, transactionsList } }
    function failure(error) { return { type: billingConstants.getTransactionsList_FAILURE, error } }
  }

  function getPaymentsList(clientid) {
    return dispatch => {
        dispatch(request(clientid));
        billingService.getPaymentsList(clientid)       
            .then(
                paymentsList => { 
                    dispatch(success(paymentsList));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(clientid) { return { type: billingConstants.getPaymentsList_REQUEST, clientid } }
    function success(paymentsList) { return { type: billingConstants.getPaymentsList_SUCCESS, paymentsList } }
    function failure(error) { return { type: billingConstants.getPaymentsList_FAILURE, error } }
  }
  
  function getOrderDetails(data) {
    return dispatch => {
        dispatch(request(data));
        billingService.getOrderDetails(data)       
            .then(
                orderDetail => { 
                    dispatch(success(orderDetail));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(data) { return { type: billingConstants.getOrderDetails_REQUEST, data } }
    function success(orderDetail) { return { type: billingConstants.getOrderDetails_SUCCESS, orderDetail } }
    function failure(error) { return { type: billingConstants.getOrderDetails_FAILURE, error } }
  }

  function viewHourlyReport(data) {
    return dispatch => {
        dispatch(request(data));
        billingService.viewHourlyReport(data)       
            .then(
                hourlyReportview => { 
                    dispatch(success(hourlyReportview));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(data) { return { type: billingConstants.viewHourlyReport_REQUEST, data } }
    function success(hourlyReportview) { return { type: billingConstants.viewHourlyReport_SUCCESS, hourlyReportview } }
    function failure(error) { return { type: billingConstants.viewHourlyReport_FAILURE, error } }
  }

  function downloadHourlyReport(data) {
    return dispatch => {
        dispatch(request(data));
        billingService.downloadHourlyReport(data)       
            .then(
                hourlyReportDownload => { 
                    dispatch(success(hourlyReportDownload));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };
  
    function request(data) { return { type: billingConstants.downloadHourlyReport_REQUEST, data } }
    function success(hourlyReportDownload) { return { type: billingConstants.downloadHourlyReport_SUCCESS, hourlyReportDownload } }
    function failure(error) { return { type: billingConstants.downloadHourlyReport_FAILURE, error } }
  }