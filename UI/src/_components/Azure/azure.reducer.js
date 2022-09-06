import { azureConstants } from './azure.constants';

export function azure(state = {}, action) {
  switch (action.type) {
    case azureConstants.GETALL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case azureConstants.GETALL_SUCCESS:
      return {
        ...state,
        loading:false,
        items: action.vmlist
      };
    case azureConstants.GETALL_FAILURE:
      return { 
        ...state,
        loading:false,
        error: action.error
      };

  case azureConstants.getAzureResourceGroups_REQUEST:
    return {
      ...state,
      loading: true
    };
  case azureConstants.getAzureResourceGroups_SUCCESS:
    return {
      ...state,
      loading:false,
      resourceGroups: action.resourceGroups
    };
  case azureConstants.getAzureResourceGroups_FAILURE:
    return { 
      ...state,
      loading:false,
      error: action.error
  };

  case azureConstants.getUserVmAccessRequests_REQUEST:
    return {
      ...state,
      loading: true
    };
  case azureConstants.getUserVmAccessRequests_SUCCESS:
    return {
      ...state,
      loading:false,
      userVmAccessRequests: action.userVmAccessRequests,
      total_records: action.userVmAccessRequests.total_records
    };
  case azureConstants.getUserVmAccessRequests_FAILURE:
    return { 
      ...state,
      loading:false,
      error: action.error
  };

  case azureConstants.getAzureDropdownData_REQUEST:
    return {
      ...state,
      loading: true
    };
  case azureConstants.getAzureDropdownData_SUCCESS:
    return {
      ...state,
      loading:false,
      dropdownData: action.dropdownData
    };
  case azureConstants.getAzureDropdownData_FAILURE:
    return { 
      ...state,
      loading:false,
      error: action.error
  };

  case azureConstants.getAzureSubscriptions_REQUEST:
    return {
      ...state,
      // loading: true
    };
  case azureConstants.getAzureSubscriptions_SUCCESS:
    return {
      ...state,
      // loading:false,
      subscription_list: action.subscription_list
    };
  case azureConstants.getAzureSubscriptions_FAILURE:
    return { 
      ...state,
      // loading:false,
      error: action.error
  };

  case azureConstants.getAzureSubscriptionLocations_REQUEST:
    return {
      ...state,
      // loading: true
    };
  case azureConstants.getAzureSubscriptionLocations_SUCCESS:
    return {
      ...state,
      // loading:false,
      subscription_locations: action.subscription_locations
    };
  case azureConstants.getAzureSubscriptionLocations_FAILURE:
    return { 
      ...state,
      // loading:false,
      error: action.error
  };

  case azureConstants.addAzureResourceGroups_REQUEST:
    return {
      ...state,
      loading: true
    };
  case azureConstants.addAzureResourceGroups_SUCCESS:
    return {
      ...state,
      loading:false,
      res: action.res
    };
  case azureConstants.addAzureResourceGroups_FAILURE:
    return { 
      ...state,
      loading:false,
      error: action.error
  };

    case azureConstants.VMOPERATIONS_REQUEST:
      return {
        ...state,
        loading: true
      };
    case azureConstants.VMOPERATIONS_SUCCESS:
      return {
        loading:false,
        resData: action.resData
      };
    case azureConstants.VMOPERATIONS_FAILURE:
      return { 
        loading:false,
        error: action.error
      }; 
    case azureConstants.VMLOGS_REQUEST:
      return {
        loading: true
      };
    case azureConstants.VMLOGS_SUCCESS:
      return {
        ...state,
        logData: action.logData
      };
    case azureConstants.VMLOGS_FAILURE:
      return { 
        error: action.error
      }; 
    case azureConstants.VMDETAIL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case azureConstants.VMDETAIL_SUCCESS:
      return {
        loading:false,
        vm_data: action.vm_data
      };
    case azureConstants.VMDETAIL_FAILURE:
      return { 
        loading:false,
        error: action.error
      };   
    default:
      return state
  }
}

export function azureNetwrok(state = {}, action) {
  switch (action.type) {
    case azureConstants.GETALLNETWORK_REQUEST:
      return {
        ...state,
        loading: true
      };
    case azureConstants.GETALLNETWORK_SUCCESS:
      return {
        ...state,
        loading:false,
        items: action.list
      };
    case azureConstants.GETALLNETWORK_FAILURE:
      return { 
        ...state,
        error: action.error
      };
      case azureConstants.addAzureNetwork_REQUEST:
        return {
          ...state,
          loading: true
        };
      case azureConstants.addAzureNetwork_SUCCESS:
        return {
          ...state,
          loading:false,
          res: action.res
        };
      case azureConstants.addAzureNetwork_FAILURE:
        return { 
          ...state,
          loading:false,
          error: action.error
      };
      default:
        return state
    }
  }