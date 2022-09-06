import { billingConstants } from './billing.constants';

export function billing(state = {}, action) {
  switch (action.type) {  
  case billingConstants.getOrderList_REQUEST:
    return {
      ...state,
      loading: true
    };
  case billingConstants.getOrderList_SUCCESS:
    return {
      ...state,
      loading:false,
      orderList: action.orderList
    };
  case billingConstants.getOrderList_FAILURE:
    return { 
      ...state,
      error: action.error
    };

  case billingConstants.getInvoiceList_REQUEST:
    return {
      ...state,
      loading: true
    };
  case billingConstants.getInvoiceList_SUCCESS:
    return {
      ...state,
      loading:false,
      invoicesList: action.invoicesList
    };
  case billingConstants.getInvoiceList_FAILURE:
    return { 
      ...state,
      error: action.error
    };

  case billingConstants.getPaymentsList_REQUEST:
    return {
      ...state,
      loading: true
    };
  case billingConstants.getPaymentsList_SUCCESS:
    return {
      ...state,
      loading:false,
      paymentsList: action.paymentsList
    };
  case billingConstants.getPaymentsList_FAILURE:
    return { 
      ...state,
      error: action.error
    };

  

  case billingConstants.getOrderDetails_REQUEST:
    return {
      ...state,
      // loading: true
    };
  case billingConstants.getOrderDetails_SUCCESS:
    return {
      ...state,
      // loading:false,
      orderDetail: action.orderDetail
    };
  case billingConstants.getOrderDetails_FAILURE:
    return { 
      ...state,
      // loading:false,
      error: action.error
    };

  case billingConstants.viewHourlyReport_REQUEST:
    return {
      ...state,
//      loading: true
    };
  case billingConstants.viewHourlyReport_SUCCESS:
    return {
      ...state,
//      loading:false,
      hourlyReportview: action.hourlyReportview
    };
  case billingConstants.viewHourlyReport_FAILURE:
    return { 
      ...state,
//      loading:false,
      error: action.error
    };

  case billingConstants.downloadHourlyReport_REQUEST:
    return {
      ...state,
//      loading: true
    };
  case billingConstants.downloadHourlyReport_SUCCESS:
    return {
      ...state,
//      loading:false,
      hourlyReportDownload: action.hourlyReportDownload
    };
  case billingConstants.downloadHourlyReport_FAILURE:
    return { 
      ...state,
//      loading:false,
      error: action.error
    };

  case billingConstants.getTransactionsList_REQUEST:
    return {
      ...state,
      loading: true
    };
  case billingConstants.getTransactionsList_SUCCESS:
    return {
      ...state,
      loading:false,
      transactionsList: action.transactionsList
    };
  case billingConstants.getTransactionsList_FAILURE:
    return { 
      ...state,
      error: action.error
    };

  case billingConstants.payInvoice_REQUEST:
    return {
      ...state,
      loading: true
    };
  case billingConstants.payInvoice_SUCCESS:
    return {
      ...state,
      loading:false,
      pgiData: action.pgiData
    };
  case billingConstants.payInvoice_FAILURE:
    return { 
      ...state,
      error: action.error
    };
    
    default:
      return state
  }
}