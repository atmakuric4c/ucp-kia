import { vmreportsConstants,vmreportsHistoryConstants,vm_report_constants,generateReportConstant,vmHourlyReportConstant } from "./vmreports.constants";

export function generateReport(state = {}, action) {
  switch (action.type) {
    case generateReportConstant.GETALL_REQUEST:
      return {
        isDownload: false,
        loading: true
      };
    case generateReportConstant.GETALL_SUCCESS:
      return {
        isDownload:true,
        items: action.vmreports
      };
    case generateReportConstant.GETALL_FAILURE:
      return {
        error: action.error
      };  
    default:
      return state;
  }
}
export function generateVmHourlyReport(state = {}, action) {
  switch (action.type) {
    case vmHourlyReportConstant.GETALL_REQUEST:
      return {
        isDownload: false,
        loading: true
      };
    case vmHourlyReportConstant.GETALL_SUCCESS:
      return {
        isDownload:true,
        items: action.vmreports
      };
    case vmHourlyReportConstant.GETALL_FAILURE:
      return {
        isDownload:false,
        error: action.error
      };  
    default:
      return state;
  }
}
export function vmHourlyReports(state = {}, action) {
  switch (action.type) {
    case vmreportsConstants.GETALL_REQUEST:
      return {
        loading: true
      };
    case vmreportsConstants.GETALL_SUCCESS:
      return {
        items: action.vmreports
      };
    case vmreportsConstants.GETALL_FAILURE:
      return {
        error: action.error
      };  
    default:
      return state;
  }
}
export function vmHourlyHistoryReports(state = {}, action) {
  switch (action.type) {
    case vmreportsHistoryConstants.GETALL_REQUEST:
      return {
        loading: true
      };
    case vmreportsHistoryConstants.GETALL_SUCCESS:
      return {
        items: action.vmreports
      };
    case vmreportsHistoryConstants.GETALL_FAILURE:
      return {
        error: action.error
      };  
    default:
      return state;
  }
}

export function vmReports(state = {}, action) {
  switch (action.type) {
    case vm_report_constants.GETALL_REQUEST:
      return {
        loading: true
      };
    case vm_report_constants.GETALL_SUCCESS:
      return {
        
        items: action.vmreports
      };
    case vm_report_constants.GETALL_FAILURE:
      return {
        error: action.error
      };  
    default:
      return state;
  }
}
