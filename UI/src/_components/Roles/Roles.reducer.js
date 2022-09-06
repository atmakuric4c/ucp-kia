import { RoleConstants } from './Roles.Constants';

export function ApprovalMatrices(state = {}, action) {
  switch (action.type) {
    case RoleConstants.GETALL_REQUEST:
      return {
        loading: true
      };
    case RoleConstants.GETALL_SUCCESS:
      return {
    	data: action.data
      };
    case RoleConstants.GETALL_FAILURE:
      return {
        error: action.error
      };
      case RoleConstants.GETALLROLES_REQUEST:
      return {
        loading: true
      };
    case RoleConstants.GETALLROLES_SUCCESS:
      return {
    	data: action.data
      };
    case RoleConstants.GETALLROLES_FAILURE:
      return {
        error: action.error
      };
    case RoleConstants.ADD_ApprovalMatrix_REQUEST:
      return {
        ...state,
        submitLoading: true
      };
    case RoleConstants.ADD_ApprovalMatrix_SUCCESS:
      return {
        ...state,
        submitLoading: false,
        resdata: action.resdata
      };
    case RoleConstants.ADD_ApprovalMatrix_FAILURE:
      return {
        ...state,
        submitLoading: false,
        error: action.error
      };
      case RoleConstants.EDIT_ApprovalMatrix_REQUEST:
      return {
        ...state,
        submitLoading: true,
      };
    case RoleConstants.EDIT_ApprovalMatrix_SUCCESS:
      return {
        ...state,
        resdata: action.resdata,
        submitLoading: false
      };
    case RoleConstants.EDIT_ApprovalMatrix_FAILURE:
      return {
        ...state,
        submitLoading: false,
        error: action.error
      };
    default:
      return state;
  }
}
