import { ordersConstants } from './orders.constants';

export function orders(state = {}, action) {
  switch (action.type) {
    case ordersConstants.CLOUDNAMES_GETALL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case ordersConstants.CLOUDNAMES_GETALL_SUCCESS:
      return {
        ...state,
        loading:false,
        cloudNames: action.cloudNames
      };
    case ordersConstants.CLOUDNAMES_GETALL_FAILURE:
      return { 
        ...state,
        loading:false,
        error: action.error
      };

    case ordersConstants.DCLocations_GETALL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case ordersConstants.DCLocations_GETALL_SUCCESS:
      return {
        ...state,
        loading:false,
        DCLocations: action.DCLocations
      };
    case ordersConstants.DCLocations_GETALL_FAILURE:
      return { 
        ...state,
        loading:false,
        error: action.error
      };

    case ordersConstants.CopyTypes_GETALL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case ordersConstants.CopyTypes_GETALL_SUCCESS:
      return {
        ...state,
        loading:false,
        CopyTypes: action.CopyTypes
      };
    case ordersConstants.CopyTypes_GETALL_FAILURE:
      return { 
        ...state,
        loading:false,
        error: action.error
      };

      case ordersConstants.getTxnDetails_REQUEST:
      return {
        ...state,
        loading: true
      };
    case ordersConstants.getTxnDetails_SUCCESS:
      console.log("action.TxnDetails");
      console.log(action.TxnDetails);
      return {
        ...state,
        loading:false,
        TxnDetails: action.TxnDetails
      };
    case ordersConstants.getTxnDetails_FAILURE:
      return { 
        ...state,
        loading:false,
        error: action.error
      };

      case ordersConstants.OsTemplates_GETALL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case ordersConstants.OsTemplates_GETALL_SUCCESS:
      return {
        ...state,
        loading:false,
        OsTemplates: action.OsTemplates
      };
    case ordersConstants.OsTemplates_GETALL_FAILURE:
      return { 
        ...state,
        loading:false,
        error: action.error
      };

      case ordersConstants.BillingPrice_REQUEST:
      return {
        ...state,
        loading: true
      };
    case ordersConstants.BillingPrice_SUCCESS:
      return {
        ...state,
        loading:false,
        BillingPrice: action.BillingPrice
      };
    case ordersConstants.BillingPrice_FAILURE:
      return { 
        ...state,
        loading:false,
        error: action.error
      };  
      
    case ordersConstants.getPendingOrders_REQUEST:
	    return {
	      ...state,
	      loading: true
	    };
	  case ordersConstants.getPendingOrders_SUCCESS:
	    return {
	      ...state,
	      loading:false,
	      pendingOrders: action.pendingOrders.data,
        total_records: action.pendingOrders.lastIndex
	    };
	  case ordersConstants.getPendingOrders_FAILURE:
	    return { 
	      ...state,
	      loading:false,
	      error: action.error
	    };  
	      
    case ordersConstants.getConsoleOutput_REQUEST:
	    return {
	      ...state,
	      loading: true
	    };
	  case ordersConstants.getConsoleOutput_SUCCESS:
	    return {
	      ...state,
	      loading:false,
	      consoleOutput: action.consoleOutput
	    };
	  case ordersConstants.getConsoleOutput_FAILURE:
	    return { 
	      ...state,
	      loading:false,
	      error: action.error
	    };  
      
    case ordersConstants.updatePgiSelection_REQUEST:
        return {
          ...state,
          loading: true
        };
      case ordersConstants.updatePgiSelection_SUCCESS:
        return {
          ...state,
          loading:false,
          resdata: action.resdata
        };
      case ordersConstants.updatePgiSelection_FAILURE:
        return { 
          ...state,
          loading:false,
          error: action.error
        };  

    case ordersConstants.saveOrderInfo_REQUEST:
      return {
        ...state,
        submitLoading: true
      };
    case ordersConstants.saveOrderInfo_SUCCESS:
      return {
        ...state,
        submitLoading:false,
        saveOrderInfoData: action.saveOrderInfoData
      };
    case ordersConstants.saveOrderInfo_FAILURE:
      return { 
        ...state,
        submitLoading:false,
        error: action.error
      };  

    case ordersConstants.saveTxnInfo_REQUEST:
      return {
        ...state,
        loading: true
      };
    case ordersConstants.saveTxnInfo_SUCCESS:
      return {
        ...state,
        loading:false,
        pgiData: action.pgiData
      };
    case ordersConstants.saveTxnInfo_FAILURE:
      return { 
        ...state,
        loading:false,
        error: action.error
      };  

    case ordersConstants.payFromFunds_REQUEST:
      return {
        ...state,
        loading: true
      };
    case ordersConstants.payFromFunds_SUCCESS:
      return {
        ...state,
        loading:false,
        pgiData: action.pgiData
      };
    case ordersConstants.payFromFunds_FAILURE:
      return { 
        ...state,
        loading:false,
        error: action.error
      };  
  
  case ordersConstants.getCartList_REQUEST:
    return {
      ...state,
      loading: true
    };
  case ordersConstants.getCartList_SUCCESS:
    return {
      ...state,
      loading:false,
      cartList: action.cartList
    };
  case ordersConstants.getCartList_FAILURE:
    return { 
      ...state,
      loading:false,
      error: action.error
    };  
    
  case ordersConstants.getApprovalPendingCartList_REQUEST:
    return {
      ...state,
      loading: true
    };
  case ordersConstants.getApprovalPendingCartList_SUCCESS:
    return {
      ...state,
      loading:false,
      approvalPendingCartList: action.approvalPendingCartList,
      total_records: action.approvalPendingCartList.total_records
    };
  case ordersConstants.getApprovalPendingCartList_FAILURE:
    return { 
      ...state,
      loading:false,
      error: action.error
    };  
    
  case ordersConstants.getApprovalPendingVmOpsList_REQUEST:
    return {
      ...state,
      loading: true
    };
  case ordersConstants.getApprovalPendingVmOpsList_SUCCESS:
    return {
      ...state,
      loading:false,
      approvalPendingVmOpsList: action.approvalPendingVmOpsList,
      total_records: action.approvalPendingVmOpsList.total_records
    };
  case ordersConstants.getApprovalPendingVmOpsList_FAILURE:
    return { 
      ...state,
      loading:false,
      error: action.error
    };  

  case ordersConstants.getTxnSuccessData_REQUEST:
    return {
      ...state,
      loading: true
    };
  case ordersConstants.getTxnSuccessData_SUCCESS:
    return {
      ...state,
      loading:false,
      TxnSuccessData: action.TxnSuccessData
    };
  case ordersConstants.getTxnSuccessData_FAILURE:
    return { 
      ...state,
      loading:false,
      error: action.error
    };  

  case ordersConstants.updateCartItemCount_REQUEST:
    return {
      ...state,
      loading: true
    };
  case ordersConstants.updateCartItemCount_SUCCESS:
    return {
      ...state,
      loading:false,
      result: action.result
    };
  case ordersConstants.updateCartItemCount_FAILURE:
    return { 
      ...state,
      loading:false,
      error: action.error
    };  

  case ordersConstants.deleteCartItem_REQUEST:
    return {
      ...state,
      loading: true
    };
  case ordersConstants.deleteCartItem_SUCCESS:
    return {
      ...state,
      loading:false,
      result: action.result
    };
  case ordersConstants.deleteCartItem_FAILURE:
    return { 
      ...state,
      loading:false,
      error: action.error
    };  
    
    default:
      return state
  }
}