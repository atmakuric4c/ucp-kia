import { ipamConstants } from "../_constants";
const initialState = {
  ips: [{}],
  ip_history: [{}]
};
export function ipam(state = {}, action) {
  switch (action.type) {
    case ipamConstants.GETALL_REQUEST:
      return {
        loading: true,
        ips: [],
        ip_history: []
      };
    case ipamConstants.GETALL_SUCCESS:
      // console.log("in rEDUCERS " + action.ips);
      return {
        ips: action.ips
      };
    case ipamConstants.GETALL_FAILURE:
      return {
        error: action.error
      };
    case ipamConstants.HISTORYIPAM_SUCCESS:
      return {
        ...state,
        ipHistory: action.ipHistory
      };

    case ipamConstants.GET_IPAM_SUCCESS:
      return {
        //  ...state,
        data: action.data
      };
    case ipamConstants.GET_IPAM_FAILURE:
      return {
        error: action.error
      };
    default:
      return state;
  }
}
