import { NetworkMgmtConstants } from "./NetworkMgmt.constatnts";
const initialState = {
  data: [{}]
};
export function NetworkMgmt(state = {}, action) {
  switch (action.type) {
    case NetworkMgmtConstants.GETALL_REQUEST:
      return {
        ...state,
        loading: true,
        data: []
      };
    case NetworkMgmtConstants.GETALL_SUCCESS:
      // console.log("in rEDUCERS " + action.ips);
      return {
        data: action.data
      };
    case NetworkMgmtConstants.GETALL_FAILURE:
      return {
        error: action.error
      };

    default:
      return state;
  }
}
