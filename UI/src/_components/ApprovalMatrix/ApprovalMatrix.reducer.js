import { ApprovalMatrixConstants } from './ApprovalMatrix.constants';

export function ApprovalMatrices(state = {}, action) {
  switch (action.type) {
    case ApprovalMatrixConstants.GETALL_REQUEST:
      return {
        loading: true
      };
    case ApprovalMatrixConstants.GETALL_SUCCESS:
      return {
    	data: action.data
      };
    case ApprovalMatrixConstants.GETALL_FAILURE:
      return {
        error: action.error
      };
    case ApprovalMatrixConstants.ADD_ApprovalMatrix_REQUEST:
      return {
        ...state,
        submitLoading: true
      };
    case ApprovalMatrixConstants.ADD_ApprovalMatrix_SUCCESS:
      return {
        ...state,
        submitLoading: false,
        resdata: action.resdata
      };
    case ApprovalMatrixConstants.ADD_ApprovalMatrix_FAILURE:
      return {
        ...state,
        submitLoading: false,
        error: action.error
      };
      case ApprovalMatrixConstants.EDIT_ApprovalMatrix_REQUEST:
      return {
        ...state,
        submitLoading: true,
      };
    case ApprovalMatrixConstants.EDIT_ApprovalMatrix_SUCCESS:
      return {
        ...state,
        resdata: action.resdata,
        submitLoading: false
      };
    case ApprovalMatrixConstants.EDIT_ApprovalMatrix_FAILURE:
      return {
        ...state,
        submitLoading: false,
        error: action.error
      };
    default:
      return state;
  }
}
