import { datastoreConstants } from "../_constants";
const initialState = {};
export function datastore(state = {}, action) {
  switch (action.type) {
    case datastoreConstants.DATASTORE_GETALL_REQUEST:
      return {
        loading: true
      };
    case datastoreConstants.DATASTORE_GETALL_SUCCESS:
      return {
        datastoredata: action.datastoredata
      };
    case datastoreConstants.DATASTORE_GETALL_FAILURE:
      return {
        error: action.error
      };
    case datastoreConstants.DATASTOREINFO_GETALL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case datastoreConstants.DATASTOREINFO_GETALL_SUCCESS:
      return {
        ...state,
        datastores: action.datastores
      };
    case datastoreConstants.DATASTOREINFO_GETALL_FAILURE:
      return {
        error: action.error
      };

    case datastoreConstants.SAVE_DATASTOREINFO_GETALL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case datastoreConstants.SAVE_DATASTOREINFO_GETALL_SUCCESS:
      return {
        ...state,
        data: action.data
      };
    case datastoreConstants.SAVE_DATASTOREINFO_GETALL_FAILURE:
      return {
        error: action.error
      };
      case datastoreConstants.EDIT_DATASTOREINFO_GETALL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case datastoreConstants.EDIT_DATASTOREINFO_GETALL_SUCCESS:
      return {
        ...state,
        info: action.info
      };
    case datastoreConstants.EDIT_DATASTOREINFO_GETALL_FAILURE:
      return {
        error: action.error
      };
    case datastoreConstants.DATASTORE_DETAIL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case datastoreConstants.DATASTORE_DETAIL_SUCCESS:
      return {
        ...state,
        details: action.details
      };
    case datastoreConstants.DATASTORE_DETAIL_FAILURE:
      return {
        error: action.error
      };
      case datastoreConstants.HOST_LIST_REQUEST:
      return {
        ...state,
        loading: true
      };
    case datastoreConstants.HOST_LIST_SUCCESS:
      return {
        ...state,
        hostlist: action.hostlist
      };
    case datastoreConstants.HOST_LIST_FAILURE:
      return {
        error: action.error
      };
    default:
      return state;
  }
}
