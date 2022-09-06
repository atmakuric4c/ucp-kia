import { commonConstants } from "../_constants";
const initialState = {
  data: [{}],
  vcenter:[{}]
};
export function common(state = {}, action) {
  switch (action.type) {
    case commonConstants.GETSTATUS_REQUEST:
      return {
        loading: true,
        data: []
      };
    case commonConstants.GETSTATUS_SUCCESS:
      return {
        data: action.data
      };
    case commonConstants.GETSTATUS_FAILURE:
      return {
        error: action.error
      };     
    case commonConstants.CPU_GETALL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case commonConstants.CPU_GETALL_SUCCESS:
      return {
        ...state,
        loading:false,
        cpuList: action.cpuList
      };
    case commonConstants.CPU_GETALL_FAILURE:
      return { 
        ...state,
        error: action.error
      };

      case commonConstants.DISK_GETALL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case commonConstants.DISK_GETALL_SUCCESS:
      return {
        ...state,
        loading:false,
        diskList: action.diskList
      };
    case commonConstants.DISK_GETALL_FAILURE:
      return { 
        ...state,
        error: action.error
      };

      case commonConstants.RAM_GETALL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case commonConstants.RAM_GETALL_SUCCESS:
      return {
        ...state,
        loading:false,
        ramList: action.ramList
      };
    case commonConstants.RAM_GETALL_FAILURE:
      return { 
        ...state,
        error: action.error
      };
    case commonConstants.GETALL_REQUEST:
      return {
        loading: true,
        data: []
      };
    case commonConstants.GETALL_SUCCESS:
      return {
        data: action.data
      };
    case commonConstants.GETALL_FAILURE:
      return {
        error: action.error
      }; 
    case commonConstants.getDashboardCounts_REQUEST:
	    return {
	      loading: true,
	      dashboardData: []
	};
    case commonConstants.getDashboardCounts_SUCCESS:
    	return {
        ...state,
        loading:false,
        dashboardData: action.data
      };
	case commonConstants.getDashboardCounts_FAILURE:
		return {
        ...state,
        loading:false,
        error: action.error
      };
    case commonConstants.DASHBOARD_GETALL_REQUEST:
      return {
        loading: true,
        data: []
      };
    case commonConstants.DASHBOARD_GETALL_SUCCESS:
      // console.log("in rEDUCERS " + action.ips);
      return {
        ...state,
        dashboarddata: action.data
      };
    case commonConstants.DASHBOARD_GETALL_FAILURE:
      return {
        error: action.error
      };

    case commonConstants.MENUS_GETALL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case commonConstants.MENUS_GETALL_SUCCESS:
      // console.log("in rEDUCERS " + action.ips);
      return {
        ...state,
        menus: action.menus
      };
    case commonConstants.MENUS_GETALL_FAILURE:
      return {
        error: action.error
      };
      case commonConstants.GETVMALL_REQUEST:
      return {
        loading: true,
        vmlist: [],
        selectedItems: []
      };
    case commonConstants.GETVMALL_SUCCESS:
      return {
        vmlist: action.data.vmlistArr,
        selectedItems: action.data.selectedItems
      };
    case commonConstants.GETVMALL_FAILURE:
      return {
        error: action.error
      };
    case commonConstants.GETALLLOC_REQUEST:
      return {
        loading: true,
        vcenter: []
      };
    case commonConstants.GETALLLOC_SUCCESS:
      return {
        vcenter: action.data
      };
    case commonConstants.GETALLLOC_FAILURE:
      return {
        error: action.error
      }; 
    default:
      return state;
  }
}
