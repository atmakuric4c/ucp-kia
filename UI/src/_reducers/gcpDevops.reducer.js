import { gcpDevopsConstants } from '../_constants';

export function gcpDevops(state = {}, action) {
  switch (action.type) {  

    case gcpDevopsConstants.GCP_DEVOPS_PROJECT_LIST_REQUEST:
        return {
          ...state,
          loading: true
        };
      case gcpDevopsConstants.GCP_DEVOPS_PROJECT_LIST_SUCCESS:
        return {
          ...state,
          loading:false,
          gcpProjectList: action.gcpProjectList
        };
      case gcpDevopsConstants.GCP_DEVOPS_PROJECT_LIST_FAILURE:
        return { 
          ...state,
          loading:false
        };
  

    case gcpDevopsConstants.GCP_DEVOPS_REPO_LIST_REQUEST:
      return {
        ...state,
        loading: true
      };
    case gcpDevopsConstants.GCP_DEVOPS_REPO_LIST_SUCCESS:
      return {
        ...state,
        loading:false,
        gcpRepoList: action.gcpRepoList
      };
    case gcpDevopsConstants.GCP_DEVOPS_REPO_LIST_FAILURE:
      return { 
        ...state,
        loading:false
      };
      case gcpDevopsConstants.GCP_DEVOPS_REPO_LIST_CHANGE:
        return { 
          ...state,
          project_id: action.project_id
        };

    case gcpDevopsConstants.GCP_DEVOPS_PIPELINE_LIST_REQUEST:
      return {
        ...state,
        loading: true
      };
    case gcpDevopsConstants.GCP_DEVOPS_PIPELINE_LIST_SUCCESS:
      return {
        ...state,
        loading:false,
        gcpPipelineList: action.gcpPipelineList
      };
    case gcpDevopsConstants.GCP_DEVOPS_PIPELINE_LIST_FAILURE:
      return { 
        ...state,
        loading:false,
        gcpPipelineList: {data: { builds: [] } }
      };


    default:
      return state
  }
}