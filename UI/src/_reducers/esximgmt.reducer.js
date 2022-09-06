import { esxiConstants } from "../_constants";
const initialState = {};
export function esximgmt(state = {}, action) {
  //console.log("action type:"+action.type);
  switch (action.type) {
    case esxiConstants.GETALL_REQUEST:
    return {
      loading: true
    };
  case esxiConstants.GETALL_SUCCESS:
    return {
         data: action.data
    };
  case esxiConstants.GETALL_FAILURE:
    return {
      error: action.error
    };
   
    case esxiConstants.UPDATEESXI_REQUEST:
      return {
        loading: true
      };
    case esxiConstants.UPDATEESXI_SUCCESS:
      return {
        id: action.id
      };
    case esxiConstants.UPDATEESXI_FAILURE:
      return {
        error: action.error
      };
     case esxiConstants.HOST_DETAIL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case esxiConstants.HOST_DETAIL_SUCCESS:
      return {
        ...state,
        details: action.details
      };
    case esxiConstants.HOST_DETAIL_FAILURE:
      return {
        error: action.error
      };
    case esxiConstants.DS_UNDER_HOST_REQUEST:
      return {
        ...state,
        loading: true
      };
    case esxiConstants.DS_UNDER_HOST_SUCCESS:
      return {
        ...state,
        dslist: action.dslist
      };
    case esxiConstants.DS_UNDER_HOST_FAILURE:
      return {
        error: action.error
      };
    default:
      return state;
  }
}
