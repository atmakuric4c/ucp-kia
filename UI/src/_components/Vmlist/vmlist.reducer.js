import { vmlistConstants } from './vmlist.constants';

export function vmlist(state = {}, action) {
  switch (action.type) {
    case vmlistConstants.GETALL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case vmlistConstants.GETALL_SUCCESS:
      return {
        ...state,
        loading:false,
        items: action.vmlist
      };
    case vmlistConstants.GETALL_FAILURE:
      return { 
        ...state,
        error: action.error
      };
    case vmlistConstants.VMOPERATIONS_REQUEST:
      return {
        ...state,
        loading: true
      };
    case vmlistConstants.VMOPERATIONS_SUCCESS:
      return {
        loading:false,
        resData: action.resData
      };
    case vmlistConstants.VMOPERATIONS_FAILURE:
      return { 
        loading:false,
        error: action.error
      }; 
      case vmlistConstants.VEEAMACTION_REQUEST:
        return {
          ...state,
          loading: true
        };
      case vmlistConstants.VEEAMACTION_SUCCESS:
        return {
          loading:false,
        };
      case vmlistConstants.VEEAMACTION_FAILURE:
        return { 
          loading:false,
          error: action.error
        };
    case vmlistConstants.VMLOGS_REQUEST:
      return {
        loading: true
      };
    case vmlistConstants.VMLOGS_SUCCESS:
      return {
        ...state,
        logData: action.logData
      };
    case vmlistConstants.VMLOGS_FAILURE:
      return { 
        error: action.error
      }; 
    case vmlistConstants.VMDETAIL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case vmlistConstants.VMDETAIL_SUCCESS:
      return {
        loading:false,
        vm_data: action.vm_data
      };
    case vmlistConstants.VMDETAIL_FAILURE:
      return { 
        loading:false,
        error: action.error
      };   
    case vmlistConstants.DISKINFO_REQUEST:
      return {
        loading: true
      };
    case vmlistConstants.DISKINFO_SUCCESS:
      return {
        ...state,
        diskInfo: action.diskInfo
      };
    case vmlistConstants.DISKINFO_FAILURE:
      return { 
        error: action.error
      };   
    case vmlistConstants.ADDDISK_REQUEST:
      return {
        loading: true
      };
    case vmlistConstants.ADDDISK_SUCCESS:
      return {
        ...state,
        addDisk: action.addDisk
      };
    case vmlistConstants.ADDDISK_FAILURE:
      return { 
        error: action.error
      };  
    default:
      return state
  }
}
export function veeamjob(state = {}, action) {
  switch (action.type) {
    case vmlistConstants.JOBDATA_REQUEST:
      return {
        loading: false,
      };
    case vmlistConstants.JOBDATA_SUCCESS:
      return {
        ...state,
        loading:false,
        jobstatus: action.jobstatus
      };
    case vmlistConstants.JOBDATA_FAILURE:
      return { 
        ...state,
        error: action.error
      }; 
    default:
      return state
  }
}