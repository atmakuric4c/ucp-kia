import { vmlistConstants } from './vmlist.constants';

export function scheduler(state = {}, action) {
  switch (action.type) {
    case vmlistConstants.GETALL_SCHEDULER_REQUEST:
      return {
        ...state,
        loading: true
      };
    case vmlistConstants.GETALL_SCHEDULER_SUCCESS:
      return {
        loading:false,
        items: action.scheduler
      };
    case vmlistConstants.GETALL_SCHEDULER_FAILURE:
      return { 
        ...state,
        error: action.error
      };
      case vmlistConstants.VMLIST_SCHEDULER_REQUEST:
        return {
          ...state,
          loading: true
        };
      case vmlistConstants.VMLIST_SCHEDULER_SUCCESS:
        return {
          ...state,
          loading:false,
          vmlist: action.vms
        };
      case vmlistConstants.VMLIST_SCHEDULER_FAILURE:
        return { 
          ...state,
          error: action.error
        };
    case vmlistConstants.VMOPERATIONS_SCHEDULER_REQUEST:
      return {
        ...state,
        loading: true
      };
    case vmlistConstants.VMOPERATIONS_SCHEDULER_SUCCESS:
      return {
        ...state,
        loading:false,
        resData: action.resData
      };
    case vmlistConstants.VMOPERATIONS_SCHEDULER_FAILURE:
      return { 
        ...state,
        error: action.error
      }; 
    case vmlistConstants.VMLOGS_SCHEDULER_REQUEST:
      return {
        loading: true
      };
    case vmlistConstants.VMLOGS_SCHEDULER_SUCCESS:
      return {
        ...state,
        logData: action.logData
      };
    case vmlistConstants.VMLOGS_SCHEDULER_FAILURE:
      return { 
        error: action.error
      }; 
    case vmlistConstants.VMDETAIL_SCHEDULER_REQUEST:
      return {
        loading: true
      };
    case vmlistConstants.VMDETAIL_SCHEDULER_SUCCESS:
      return {
        ...state,
        vm_data: action.vm_data
      };
    case vmlistConstants.VMDETAIL_SCHEDULER_FAILURE:
      return { 
        error: action.error
      };   
    case vmlistConstants.DISKINFO_SCHEDULER_REQUEST:
      return {
        loading: true
      };
    case vmlistConstants.DISKINFO_SCHEDULER_SUCCESS:
      return {
        ...state,
        diskInfo: action.diskInfo
      };
    case vmlistConstants.DISKINFO_SCHEDULER_FAILURE:
      return { 
        error: action.error
      };   
    case vmlistConstants.ADDDISK_SCHEDULER_REQUEST:
      return {
        loading: true
      };
    case vmlistConstants.ADDDISK_SCHEDULER_SUCCESS:
      return {
        ...state,
        addDisk: action.addDisk
      };
    case vmlistConstants.ADDDISK_SCHEDULER_FAILURE:
      return { 
        error: action.error
      };  
    default:
      return state
  }
}
