import { commonConstants } from "../_constants";
import { commonService } from "../_services";
import { alertActions } from "./";
import { history } from "../_helpers";
import { toast } from 'react-toastify';

function getAllVdcLocations() {
  return dispatch => {
    dispatch(request());
    commonService.getAllVdcLocations().then(
      data => dispatch(success(data)),
      error =>
        dispatch(
          failure(
            error.toString(),
            toast.error(error.toString())
          )
        )
    );
  };

  function request() {
    return { type: commonConstants.GETALL_REQUEST };
  }
  function success(data) {
    //console.log("In Actions " + ips);
    return { type: commonConstants.GETALL_SUCCESS, data };
  }
  function failure(error) {
    return { type: commonConstants.GETALL_FAILURE, error };
  }
}
function getDashboardCounts(params) {
  return dispatch => {
    dispatch(request());
    commonService.getDashboardCounts(params).then(
      data => dispatch(success(data)),
      error =>
        dispatch(
          failure(
            error.toString(),
            toast.error(error.toString())
          )
        )
    );
  };

  function request() {
    return { type: commonConstants.getDashboardCounts_REQUEST };
  }
  function success(data) {
    //console.log("In Actions " + ips);
    return { type: commonConstants.getDashboardCounts_SUCCESS, data };
  }
  function failure(error) {
    return { type: commonConstants.getDashboardCounts_FAILURE, error };
  }
}
function getVcenterList() {
  return dispatch => {
    dispatch(request());
    commonService.getAllVdcLocations().then(
      data => dispatch(success(data)),
      error =>
        dispatch(
          failure(
            error.toString(),
            toast.error(error.toString())
          )
        )
    );
  };

  function request() {
    return { type: commonConstants.GETALLLOC_REQUEST };
  }
  function success(data) {
    //console.log("In Actions " + ips);
    return { type: commonConstants.GETALLLOC_SUCCESS, data };
  }
  function failure(error) {
    return { type: commonConstants.GETALLLOC_FAILURE, error };
  }
}

function getAllMenus() {
  return dispatch => {
    dispatch(request());
    commonService
      .getAllMenus()
      .then(
        data => dispatch(success(data)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: commonConstants.GETALL_REQUEST };
  }
  function success(data) {
    //console.log("In Actions " + ips);
    return { type: commonConstants.GETALL_SUCCESS, data };
  }
  function failure(error) {
    return { type: commonConstants.GETALL_FAILURE, error };
  }
}

function getRamList() {
  return dispatch => {
    dispatch(request());
    commonService
      .getRamList()
      .then(
        ramList => dispatch(success(ramList)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: commonConstants.RAM_GETALL_REQUEST };
  }
  function success(ramList) {
    //console.log("In Actions " + ips);
    return { type: commonConstants.RAM_GETALL_SUCCESS, ramList };
  }
  function failure(error) {
    return { type: commonConstants.RAM_GETALL_FAILURE, error };
  }
}

function getCpuList() {
  return dispatch => {
    dispatch(request());
    commonService
      .getCpuList()
      .then(
        cpuList => dispatch(success(cpuList)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: commonConstants.CPU_GETALL_REQUEST };
  }
  function success(cpuList) {
    //console.log("In Actions " + ips);
    return { type: commonConstants.CPU_GETALL_SUCCESS, cpuList };
  }
  function failure(error) {
    return { type: commonConstants.CPU_GETALL_FAILURE, error };
  }
}

function getDiskList() {
  return dispatch => {
    dispatch(request());
    commonService
      .getDiskList()
      .then(
        diskList => dispatch(success(diskList)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: commonConstants.DISK_GETALL_REQUEST };
  }
  function success(diskList) {
    //console.log("In Actions " + ips);
    return { type: commonConstants.DISK_GETALL_SUCCESS, diskList };
  }
  function failure(error) {
    return { type: commonConstants.DISK_GETALL_FAILURE, error };
  }
}

function setEnableDisable(action, id, value) {
  return dispatch => {
    dispatch(request(action, id, value));
    commonService.setEnableDisable(action, id, value).then(
      data => {
        dispatch(success(data)),
          //history.push('/esximgmt');
          dispatch(alertActions.success("Updated successful"));
      },
      error => dispatch(failure(error.toString()))
    );
  };

  function request() {
    return { type: commonConstants.GETSTATUS_REQUEST };
  }
  function success(data) {
    //console.log("In Actions " + ips);
    return { type: commonConstants.GETSTATUS_SUCCESS, data };
  }
  function failure(error) {
    return { type: commonConstants.GETSTATUS_FAILURE, error };
  }
}
function getDashboard() {
  return dispatch => {
    dispatch(request());

    commonService.getDashboard().then(
      dashboarddata => dispatch(success(dashboarddata)),
      error =>
        dispatch(
          failure(
            error.toString(),
            toast.error(error.toString())
          )
        )
    );
  };

  function request() {
    return { type: commonConstants.DASHBOARD_GETALL_REQUEST };
  }
  function success(data) {
    //console.log("In Actions " + ips);
    return { type: commonConstants.DASHBOARD_GETALL_SUCCESS, data };
  }
  function failure(error) {
    return { type: commonConstants.DASHBOARD_GETALL_FAILURE, error };
  }
}

function getUserMenus() {
  return dispatch => {
    dispatch(request());
    commonService.getUserMenus().then(
      menus =>
        dispatch(
          success(menus),
          localStorage.setItem("menus", JSON.stringify(menus))
        ),
      error =>
        dispatch(
          failure(
            error.toString(),
            toast.error(error.toString())
          )
        )
    );
  };

  function request() {
    return { type: commonConstants.MENUS_GETALL_REQUEST };
  }
  function success(menus) {
    //console.log("In Actions " + ips);
    return { type: commonConstants.MENUS_GETALL_SUCCESS, menus };
  }
  function failure(error) {
    return { type: commonConstants.MENUS_GETALL_FAILURE, error };
  }
}

function getVmListArr(obj) {
  return dispatch => {
    dispatch(request());
    commonService.getVmListArr(obj).then(
      data => dispatch(success(data)),
      error =>
        dispatch(
          failure(
            error.toString(),
            toast.error(error.toString())
          )
        )
    );
  };

  function request() {
    return { type: commonConstants.GETVMALL_REQUEST };
  }
  function success(data) {
    return { type: commonConstants.GETVMALL_SUCCESS, data };
  }
  function failure(error) {
    return { type: commonConstants.GETVMALL_FAILURE, error };
  }
}

export const commonActions = {
  getAllVdcLocations: getAllVdcLocations,
  getAllMenus: getAllMenus,
  setEnableDisable: setEnableDisable,
  getDashboard: getDashboard,
  getUserMenus: getUserMenus,
  getVmListArr,getVcenterList,
  getRamList,getCpuList,getDiskList,
  getDashboardCounts
};
