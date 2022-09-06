import { ipamConstants } from "../_constants";
import { ipamService } from "../_services";
import { alertActions } from "./";
import { history } from "../_helpers";
import { toast } from 'react-toastify';

function getAll() {
  return dispatch => {
    dispatch(request());

    ipamService
      .getAll()
      .then(
        ips => dispatch(success(ips)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: ipamConstants.GETALL_REQUEST };
  }
  function success(ips) {
    //console.log("In Actions " + ips);
    return { type: ipamConstants.GETALL_SUCCESS, ips };
  }
  function failure(error) {
    return { type: ipamConstants.GETALL_FAILURE, error };
  }
}
function IpadmAddRequest(ipData) {
  return dispatch => {
    dispatch(request(ipData));

    ipamService
      .IpadmAddRequest(ipData)
      .then(
        ip => dispatch(success(ip), toast.success(ip.message)),
        error =>
          dispatch(
            failure(
              error.toString(),
              toast.error(error.toString())
            )
          )
      );
  };
  function request(ipData) {
    return { type: ipamConstants.ADDIPAM_REQUEST, ipData };
  }
  function success(ipData) {
    //console.log("In Actions " + ips);
    return { type: ipamConstants.ADDIPAM_SUCCESS, ipData };
  }
  function failure(error) {
    return { type: ipamConstants.ADDIPAM_FAILURE, error };
  }
}
function getIPUsageHistory(ipid) {
  return dispatch => {
    dispatch(request(ipid));

    ipamService
      .getIPUsageHistory(ipid)
      .then(
        ipHistory => dispatch(success(ipHistory)),
        error => dispatch(failure(error.toString()))
      );
  };
  function request(ipid) {
    return { type: ipamConstants.HISTORYIPAM_REQUEST, ipid };
  }
  function success(ipHistory) {
    console.log("In Actions " + ipHistory);
    return { type: ipamConstants.HISTORYIPAM_SUCCESS, ipHistory };
  }
  function failure(error) {
    return { type: ipamConstants.HISTORYIPAM_FAILURE, error };
  }
}

function getIpamPageData(
  page,
  pageSize,
  sorted,
  filtered,
  handleRetrievedData
) {
  let postObject = {
    page: page,
    pageSize: pageSize,
    sorted: sorted,
    filtered: filtered
  };
  return dispatch => {
    //dispatch(request(postObject));

    ipamService
      .getIpamPageData(postObject)
      .then(
        data => dispatch(success(data)),
        error => dispatch(failure(error.toString()))
      );
    function request() {
      console.log("in requiest");
      return { type: ipamConstants.GET_IPAM_REQUEST };
    }
    function success(data) {
      return { type: ipamConstants.GET_IPAM_SUCCESS, data };
    }
    function failure(error) {
      return { type: ipamConstants.GET_IPAM_FAILURE, error };
    }
  };
}

export const ipamActions = {
  getAll: getAll,
  IpadmAddRequest: IpadmAddRequest,
  getIPUsageHistory: getIPUsageHistory,
  getIpamPageData: getIpamPageData
};
