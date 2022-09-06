import { vcentermgmtConstants } from "../_constants";
const initialState = {};
export function vcentermgmt(state = {}, action) {
  switch (action.type) {
    case vcentermgmtConstants.ADDVCENTER_REQUEST:
      return {
        loading: true
      };
    case vcentermgmtConstants.ADDVCENTER_SUCCESS:
      // console.log("in rEDUCERS " + action.ips);
      return {
        id: action.id
      };
    case vcentermgmtConstants.ADDVCENTER_FAILURE:
      return {
        error: action.error
      };
    case vcentermgmtConstants.UPDATEVCENTER_REQUEST:
      return {
        loading: true
      };
    case vcentermgmtConstants.UPDATEVCENTER_SUCCESS:
      // console.log("in rEDUCERS " + action.ips);
      return {
        id: action.id
      };
    case vcentermgmtConstants.UPDATEVCENTER_FAILURE:
      return {
        error: action.error
      };
    default:
      return state;
  }
}
