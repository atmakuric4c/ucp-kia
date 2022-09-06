import { azureDevopsConstants } from '../_constants';

export function azureDevops(state = {}, action) {
  switch (action.type) {  

    case azureDevopsConstants.AZURE_DEVOPS_REPO_LIST_REQUEST:
      return {
        ...state,
        loading: true
      };
    case azureDevopsConstants.AZURE_DEVOPS_REPO_LIST_SUCCESS:
      return {
        ...state,
        loading:false,
        azureRepoList: action.azureRepoList
      };
    case azureDevopsConstants.AZURE_DEVOPS_REPO_LIST_FAILURE:
      return { 
        ...state,
        loading:false
      };

    case azureDevopsConstants.AZURE_DEVOPS_REPO_FILE_LIST_REQUEST:
      return {
        ...state,
        loading: true
      };
    case azureDevopsConstants.AZURE_DEVOPS_REPO_FILE_LIST_SUCCESS:
      return {
        ...state,
        loading:false,
        azureRepoFileList: {...state.azureRepoFileList, [action.azureRepoFileList.repo_id]: action.azureRepoFileList}
      };
    case azureDevopsConstants.AZURE_DEVOPS_REPO_FILE_LIST_FAILURE:
      return { 
        ...state,
        loading:false,
        azureRepoFileList: {...state.azureRepoFileList, [action.error.repo_id]: {data: []}}
      };

    case azureDevopsConstants.AZURE_DEVOPS_ADD_REPO_REQUEST:
      return {
        ...state,
        loadingAddRepo: true
      };
    case azureDevopsConstants.AZURE_DEVOPS_ADD_REPO_SUCCESS:
      return {
        ...state,
        loadingAddRepo: false
      };
    case azureDevopsConstants.AZURE_DEVOPS_ADD_REPO_FAILURE:
      return { 
        ...state,
        loadingAddRepo: false
      };


    case azureDevopsConstants.AZURE_DEVOPS_DELETE_REPO_REQUEST:
      return {
        ...state,
        loadingDeleteRepo: true
      };
    case azureDevopsConstants.AZURE_DEVOPS_DELETE_REPO_SUCCESS:
      return {
        ...state,
        loadingDeleteRepo: false
      };
    case azureDevopsConstants.AZURE_DEVOPS_DELETE_REPO_FAILURE:
      return { 
        ...state,
        loadingDeleteRepo: false
      };
  

    case azureDevopsConstants.AZURE_DEVOPS_PIPELINE_LIST_REQUEST:
        return {
          ...state,
          loading: true
        };
    case azureDevopsConstants.AZURE_DEVOPS_PIPELINE_LIST_SUCCESS:
        return {
          ...state,
          loading:false,
          azurePipelineList: action.azurePipelineList
        };
    case azureDevopsConstants.AZURE_DEVOPS_PIPELINE_LIST_FAILURE:
        return { 
          ...state,
          loading:false
        };

      case azureDevopsConstants.AZURE_DEVOPS_PIPELINE_RUN_LIST_REQUEST:
        return {
          ...state,
          loading: true
        };
      case azureDevopsConstants.AZURE_DEVOPS_PIPELINE_RUN_LIST_SUCCESS:
        return {
          ...state,
          loading:false,
          azurePipelineRunList: {...state.azurePipelineRunList, [action.azurePipelineRunList.pipeline_id]: action.azurePipelineRunList}
        };
      case azureDevopsConstants.AZURE_DEVOPS_PIPELINE_RUN_LIST_FAILURE:
        return { 
          ...state,
          loading:false,
          azurePipelineRunList: {...state.azurePipelineRunList, [action.error.pipeline_id]: {data: []}}
        };

        case azureDevopsConstants.AZURE_DEVOPS_PIPELINE_STATUS_REQUEST:
          return {
            ...state,
            loadingModal: true
          };
        case azureDevopsConstants.AZURE_DEVOPS_PIPELINE_STATUS_SUCCESS:
          return {
            ...state,
            loadingModal: false,
            azurePipelineStatus: action.azurePipelineStatus
          };
        case azureDevopsConstants.AZURE_DEVOPS_PIPELINE_STATUS_FAILURE:
          return { 
            ...state,
            loadingModal: false
          };

        case azureDevopsConstants.AZURE_DEVOPS_START_PIPELINE_REQUEST:
          return {
            ...state,
            loadingStartPipeline: true
          };
        case azureDevopsConstants.AZURE_DEVOPS_START_PIPELINE_SUCCESS:
          return {
            ...state,
            loadingStartPipeline:false,
          };
        case azureDevopsConstants.AZURE_DEVOPS_START_PIPELINE_FAILURE:
          return { 
            ...state,
            loadingStartPipeline:false
          };
  
        case azureDevopsConstants.PIPELINE_STATUS_UPDATE_MODAL:
          return { 
              ...state,
              showPipelineStatusModal: action.value,
              azurePipelineStatus: null
          };

        case azureDevopsConstants.AZURE_ADD_REPO_UPDATE_MODAL:
          return { 
              ...state,
              showAddRepoModal: action.value
          };

        case azureDevopsConstants.AZURE_DEVOPS_ORGANIZATION_LIST_REQUEST:
          return {
            ...state,
            loadingOrganization: true
          };
        case azureDevopsConstants.AZURE_DEVOPS_ORGANIZATION_LIST_SUCCESS:
          return {
            ...state,
            loadingOrganization:false,
            azureOrganizationList: action.azureOrganizationList
          };
        case azureDevopsConstants.AZURE_DEVOPS_ORGANIZATION_LIST_FAILURE:
          return { 
            ...state,
            loadingOrganization:false
          };

        case azureDevopsConstants.AZURE_DEVOPS_PROJECT_LIST_REQUEST:
          return {
            ...state,
            loadingProject: true
          };
        case azureDevopsConstants.AZURE_DEVOPS_PROJECT_LIST_SUCCESS:
          return {
            ...state,
            loadingProject:false,
            azureProjectList: action.azureProjectList
          };
        case azureDevopsConstants.AZURE_DEVOPS_PROJECT_LIST_FAILURE:
          return { 
            ...state,
            loadingProject:false
          };
  
    default:
      return state
  }
}