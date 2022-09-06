import { VeeamServerConstants } from "./VeeamServer.constatnts";
const initialState = {
  data: [{}]
};
export function VeeamServer(state = {}, action) {
  switch (action.type) {
    case VeeamServerConstants.GETALL_REQUEST:
      return {
        ...state,
        loading: true,
        data: []
      };
    case VeeamServerConstants.GETALL_SUCCESS:
      // console.log("in rEDUCERS " + action.ips);
      return {
        data: action.data
      };
    case VeeamServerConstants.GETALL_FAILURE:
      return {
        error: action.error
      };

    default:
      return state;
  }
}
