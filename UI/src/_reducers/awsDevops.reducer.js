import { awsDevopsConstants } from '../_constants';

export function awsDevops(state = {}, action) {
  switch (action.type) {  

  case awsDevopsConstants.AWS_DEVOPS_COST_FORECAST_REQUEST:
    return {
      ...state,
      loading: true
    };
  case awsDevopsConstants.AWS_DEVOPS_COST_FORECAST_SUCCESS:
    return {
      ...state,
      loading:false,
      costForecast: action.costForecast
    };
  case awsDevopsConstants.AWS_DEVOPS_COST_FORECAST_FAILURE:
    return { 
      ...state,
    };

  case awsDevopsConstants.AWS_DEVOPS_USAGE_FORECAST_REQUEST:
    return {
      ...state,
      loading: true
    };
  case awsDevopsConstants.AWS_DEVOPS_USAGE_FORECAST_SUCCESS:
    return {
      ...state,
      loading:false,
      usageForecast: action.usageForecast
    };
  case awsDevopsConstants.AWS_DEVOPS_USAGE_FORECAST_FAILURE:
    return { 
      ...state,
    };


    case awsDevopsConstants.AWS_DEVOPS_REPO_LIST_REQUEST:
      return {
        ...state,
        loading: true
      };
    case awsDevopsConstants.AWS_DEVOPS_REPO_LIST_SUCCESS:
      return {
        ...state,
        loading:false,
        awsRepoList: action.awsRepoList
      };
    case awsDevopsConstants.AWS_DEVOPS_REPO_LIST_FAILURE:
      return { 
        ...state,
        loading:false
      };

    case awsDevopsConstants.AWS_DEVOPS_REPO_FILE_LIST_REQUEST:
      return {
        ...state,
        loading: true
      };
    case awsDevopsConstants.AWS_DEVOPS_REPO_FILE_LIST_SUCCESS:
      return {
        ...state,
        loading:false,
        awsRepoFileList: {...state.awsRepoFileList, [action.awsRepoFileList.repo_id]: action.awsRepoFileList}
      };
    case awsDevopsConstants.AWS_DEVOPS_REPO_FILE_LIST_FAILURE:
      return { 
        ...state,
        loading:false
      };


    case awsDevopsConstants.AWS_DEVOPS_REPO_FILE_CONTENT_REQUEST:
      return {
        ...state,
        loading: true
      };
    case awsDevopsConstants.AWS_DEVOPS_REPO_FILE_CONTENT_SUCCESS:
      return {
        ...state,
        loading:false,
        awsRepoFileContent: action.awsRepoFileContent
      };
    case awsDevopsConstants.AWS_DEVOPS_REPO_FILE_CONTENT_FAILURE:
      return { 
        ...state,
        loading:false
      };

      case awsDevopsConstants.AWS_DEVOPS_REPO_BRANCH_LIST_REQUEST:
        return {
          ...state,
          loading: true
        };
      case awsDevopsConstants.AWS_DEVOPS_REPO_BRANCH_LIST_SUCCESS:
        return {
          ...state,
          loading:false,
          awsRepoBranchList: action.awsRepoBranchList
        };
      case awsDevopsConstants.AWS_DEVOPS_REPO_FILE_LIST_FAILURE:
        return { 
          ...state,
          loading:false
        };

    case awsDevopsConstants.AWS_ADD_REPO_REQUEST:
      return {
        ...state,
        loadingAddRepo: true
      };
    case awsDevopsConstants.AWS_ADD_REPO_SUCCESS:
      return {
        ...state,
        loadingAddRepo: false
      };
    case awsDevopsConstants.AWS_ADD_REPO_FAILURE:
      return { 
        ...state,
        loadingAddRepo: false
      };

    case awsDevopsConstants.AWS_DELETE_REPO_REQUEST:
      return {
        ...state,
        loadingDeleteRepo: true
      };
    case awsDevopsConstants.AWS_DELETE_REPO_SUCCESS:
      return {
        ...state,
        loadingDeleteRepo: false
      };
    case awsDevopsConstants.AWS_DELETE_REPO_FAILURE:
      return { 
        ...state,
        loadingDeleteRepo: false
      };

    case awsDevopsConstants.AWS_DEVOPS_PIPELINE_LIST_REQUEST:
      return {
        ...state,
        loading: true
      };
    case awsDevopsConstants.AWS_DEVOPS_PIPELINE_LIST_SUCCESS:
      return {
        ...state,
        loading:false,
        awsPipelineList: action.awsPipelineList
      };
    case awsDevopsConstants.AWS_DEVOPS_PIPELINE_LIST_FAILURE:
      return { 
        ...state,
        loading:false
      };
    
    case awsDevopsConstants.AWS_DEVOPS_PIPELINE_EXECUTION_HISTORY_LIST_REQUEST:
      return {
        ...state,
        loading: true
      };
    case awsDevopsConstants.AWS_DEVOPS_PIPELINE_EXECUTION_HISTORY_LIST_SUCCESS:
      return {
        ...state,
        loading:false,
        awsPipelineExecutionHistoryList: {...state.awsPipelineExecutionHistoryList, [action.awsPipelineExecutionHistoryList.pipeline_id]: action.awsPipelineExecutionHistoryList}
      };
    case awsDevopsConstants.AWS_DEVOPS_PIPELINE_EXECUTION_HISTORY_LIST_FAILURE:
      return { 
        ...state,
        loading:false
      };

      case awsDevopsConstants.AWS_DEVOPS_PIPELINE_STATUS_REQUEST:
        return {
          ...state,
          loading: true
        };
      case awsDevopsConstants.AWS_DEVOPS_PIPELINE_STATUS_SUCCESS:
        return {
          ...state,
          loading:false,
          awsPipelineStatus: action.awsPipelineStatus
        };
      case awsDevopsConstants.AWS_DEVOPS_PIPELINE_STATUS_FAILURE:
        return { 
          ...state,
          loading:false
        };

      case awsDevopsConstants.AWS_DEVOPS_START_PIPELINE_REQUEST:
        return {
          ...state,
          loadingStartPipeline: true
        };
      case awsDevopsConstants.AWS_DEVOPS_START_PIPELINE_SUCCESS:
        return {
          ...state,
          loadingStartPipeline:false,
        };
      case awsDevopsConstants.AWS_DEVOPS_START_PIPELINE_FAILURE:
        return { 
          ...state,
          loadingStartPipeline:false
        };

      case awsDevopsConstants.AWS_DEVOPS_STOP_PIPELINE_REQUEST:
        return {
          ...state,
          loadingStopPipeline: true
        };
      case awsDevopsConstants.AWS_DEVOPS_STOP_PIPELINE_SUCCESS:
        return {
          ...state,
          loadingStopPipeline:false,
        };
      case awsDevopsConstants.AWS_DEVOPS_STOP_PIPELINE_FAILURE:
        return { 
          ...state,
          loadingStopPipeline:false
        };

      case awsDevopsConstants.PIPELINE_STATUS_UPDATE_MODAL:
        return { 
            ...state,
            showPipelineStatusModal: action.value,
            awsPipelineStatus: null
        };
      
      case awsDevopsConstants.ADD_REPO_UPDATE_MODAL:
        return { 
            ...state,
            showAddRepoModal: action.value
        };
      
      case awsDevopsConstants.AWS_DEVOPS_REGION_LIST_REQUEST:
        return {
          ...state
        };
      case awsDevopsConstants.AWS_DEVOPS_REGION_LIST_SUCCESS:
        return {
          ...state,
          awsRegionList: action.awsRegionList
        };
      case awsDevopsConstants.AWS_DEVOPS_REGION_LIST_FAILURE:
        return { 
          ...state
        };
    
    default:
      return state
  }
}