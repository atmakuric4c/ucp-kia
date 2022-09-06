import { vmreportsConstants,vmreportsHistoryConstants,vm_report_constants,generateReportConstant,vmHourlyReportConstant } from "./vmreports.constants";
import { vmReportService } from "./vmreports.service";
import { alertActions } from "../../_actions";
import { history } from "../../_helpers";
import Swal from "sweetalert2";

export const vmreportsActions = {
  getHourlyReports,getVmHourlyHistory,getAllVmlist,generateReport,generateVmHourlyReport,clearReportBtn
};
function generateReport() {
  return dispatch => {
    dispatch(request());
    vmReportService
      .generateReport()
      .then(
        vmreports => {
          dispatch(success(vmreports))
        },
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: generateReportConstant.GETALL_REQUEST };
  }
  function success(vmreports) {
    return { type: generateReportConstant.GETALL_SUCCESS, vmreports };
  }
  function failure(error) {
    return { type: generateReportConstant.GETALL_FAILURE, error };
  }
}
function clearReportBtn(){
    var error={};
    return { type: vmHourlyReportConstant.GETALL_FAILURE, error};
}
function generateVmHourlyReport(reportData) {
  return dispatch => {
    dispatch(request());
    vmReportService
      .generateVmHourlyReport(reportData)
      .then(
        vmreports => {
          dispatch(success(vmreports))
        },
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: vmHourlyReportConstant.GETALL_REQUEST };
  }
  function success(vmreports) {
    return { type: vmHourlyReportConstant.GETALL_SUCCESS, vmreports };
  }
  function failure(error) {
    return { type: vmHourlyReportConstant.GETALL_FAILURE, error };
  }
}

function getHourlyReports() {
  return dispatch => {
    dispatch(request());
    vmReportService
      .getHourlyReports()
      .then(
        vmreports => dispatch(success(vmreports)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: vmreportsConstants.GETALL_REQUEST };
  }
  function success(vmreports) {
    return { type: vmreportsConstants.GETALL_SUCCESS, vmreports };
  }
  function failure(error) {
    return { type: vmreportsConstants.GETALL_FAILURE, error };
  }
}

function getVmHourlyHistory(reportData) {
  return dispatch => {
    dispatch(request(reportData));
    vmReportService
      .getVmHourlyHistory(reportData)
      .then(
        vmreports => dispatch(success(vmreports)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: vmreportsHistoryConstants.GETALL_REQUEST };
  }
  function success(vmreports) {
    return { type: vmreportsHistoryConstants.GETALL_SUCCESS, vmreports };
  }
  function failure(error) {
    return { type: vmreportsHistoryConstants.GETALL_FAILURE, error };
  }
}

function getAllVmlist() {
  return dispatch => {
    dispatch(request());
    vmReportService
      .getAllVmlist()
      .then(
        vmreports => dispatch(success(vmreports)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: vm_report_constants.GETALL_REQUEST };
  }
  function success(vmreports) {
    return { type: vm_report_constants.GETALL_SUCCESS, vmreports };
  }
  function failure(error) {
    return { type: vm_report_constants.GETALL_FAILURE, error };
  }
}