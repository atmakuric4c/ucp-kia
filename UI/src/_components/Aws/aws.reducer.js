import { awsConstants } from './aws.constants';

export function aws(state = {}, action) {
  switch (action.type) {
    case awsConstants.GETALL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case awsConstants.GETALL_SUCCESS:
      return {
        ...state,
        loading:false,
        items: action.vmlist
      };
    case awsConstants.GETALL_FAILURE:
      return { 
        ...state,
        error: action.error
      };

  case awsConstants.getAwsResourceGroups_REQUEST:
    return {
      ...state,
      loading: true
    };
  case awsConstants.getAwsResourceGroups_SUCCESS:
    return {
      ...state,
      loading:false,
      resourceGroups: action.resourceGroups
    };
  case awsConstants.getAwsResourceGroups_FAILURE:
    return { 
      ...state,
      loading:false,
      error: action.error
  };

  case awsConstants.getAwsSubscriptions_REQUEST:
    return {
      ...state,
      // loading: true
    };
  case awsConstants.getAwsSubscriptions_SUCCESS:
    return {
      ...state,
      // loading:false,
      subscription_list: action.subscription_list
    };
  case awsConstants.getAwsSubscriptions_FAILURE:
    return { 
      ...state,
      // loading:false,
      error: action.error
  };

  case awsConstants.getAwsSubscriptionLocations_REQUEST:
    return {
      ...state,
      // loading: true
    };
  case awsConstants.getAwsSubscriptionLocations_SUCCESS:
    return {
      ...state,
      // loading:false,
      subscription_locations: action.subscription_locations
    };
  case awsConstants.getAwsSubscriptionLocations_FAILURE:
    return { 
      ...state,
      // loading:false,
      error: action.error
  };

  case awsConstants.addAwsResourceGroups_REQUEST:
    return {
      ...state,
      loading: true
    };
  case awsConstants.addAwsResourceGroups_SUCCESS:
    return {
      ...state,
      loading:false,
      res: action.res
    };
  case awsConstants.addAwsResourceGroups_FAILURE:
    return { 
      ...state,
      loading:false,
      error: action.error
  };

    case awsConstants.VMOPERATIONS_REQUEST:
      return {
        ...state,
        loading: true
      };
    case awsConstants.VMOPERATIONS_SUCCESS:
      return {
        loading:false,
        resData: action.resData
      };
    case awsConstants.VMOPERATIONS_FAILURE:
      return { 
        loading:false,
        error: action.error
      }; 
    case awsConstants.VMLOGS_REQUEST:
      return {
        ...state,
        loading: true
      };
    case awsConstants.VMLOGS_SUCCESS:
      return {
        ...state,
        logData: action.logData
      };
    case awsConstants.VMLOGS_FAILURE:
      return { 
        error: action.error
      }; 
    case awsConstants.VMDETAIL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case awsConstants.VMDETAIL_SUCCESS:
      return {
        loading:false,
        vm_data: action.vm_data
      };
    case awsConstants.VMDETAIL_FAILURE:
      return { 
        loading:false,
        error: action.error
      };   
    default:
      return state
  }
}

export function awsNetwrok(state = {}, action) {
  switch (action.type) {
    case awsConstants.GETALLNETWORK_REQUEST:
      return {
        ...state,
        loading: true
      };
    case awsConstants.GETALLNETWORK_SUCCESS:
      return {
        ...state,
        loading:false,
        items: action.list
      };
    case awsConstants.GETALLNETWORK_FAILURE:
      return { 
        ...state,
        error: action.error
      };
      case awsConstants.addAwsNetwork_REQUEST:
        return {
          ...state,
          loading: true
        };
      case awsConstants.addAwsNetwork_SUCCESS:
        return {
          ...state,
          loading:false,
          res: action.res
        };
      case awsConstants.addAwsNetwork_FAILURE:
        return { 
          ...state,
          loading:false,
          error: action.error
      };
      default:
        return state
    }
  }