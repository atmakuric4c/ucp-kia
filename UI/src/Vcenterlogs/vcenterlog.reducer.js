import { VcenterlogConstants } from "./vcenterlog.constatnts";
const initialState = {
  data: [{}]
};
export function Vcenterloginfo(state = {}, action) {
  switch (action.type) {
    case VcenterlogConstants.GETALL_REQUEST:
      return {
        ...state,
        loading: true,
        data: []
      };
    case VcenterlogConstants.GETALL_SUCCESS:
      // console.log("in rEDUCERS " + action.ips);
      return {
        data: action.data
      };
    case VcenterlogConstants.GETALL_FAILURE:
      return {
        error: action.error
      };

    default:
      return state;
  }
}
