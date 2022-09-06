import { privateipamConstants } from "./privateipam.constants";
import { privateipamService } from "./privateipam.servies";
import { alertActions } from "./";
import { history } from "../_helpers";
import { toast } from 'react-toastify';

function getAll() {
  return dispatch => {
    dispatch(request());

    privateipamService
      .getAll()
      .then(
        ips => dispatch(success(ips)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: privateipamConstants.GETALL_REQUEST };
  }
  function success(ips) {
    //console.log("In Actions " + ips);
    return { type: privateipamConstants.GETALL_SUCCESS, ips };
  }
  function failure(error) {
    return { type: privateipamConstants.GETALL_FAILURE, error };
  }
}
function IpadmAddRequest(ipData) {
  return dispatch => {
    dispatch(request(ipData));

    privateipamService
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
    return { type: privateipamConstants.ADDIPAM_REQUEST, ipData };
  }
  function success(ipData) {
    //console.log("In Actions " + ips);
    return { type: privateipamConstants.ADDIPAM_SUCCESS, ipData };
  }
  function failure(error) {
    return { type: privateipamConstants.ADDIPAM_FAILURE, error };
  }
}
function getIPUsageHistory(ipid) {
  return dispatch => {
    dispatch(request(ipid));

    privateipamService
      .getIPUsageHistory(ipid)
      .then(
        ipHistory => dispatch(success(ipHistory)),
        error => dispatch(failure(error.toString()))
      );
  };
  function request(ipid) {
    return { type: privateipamConstants.HISTORYIPAM_REQUEST, ipid };
  }
  function success(ipHistory) {
    console.log("In Actions " + ipHistory);
    return { type: privateipamConstants.HISTORYIPAM_SUCCESS, ipHistory };
  }
  function failure(error) {
    return { type: privateipamConstants.HISTORYIPAM_FAILURE, error };
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

    privateipamService
      .getIpamPageData(postObject)
      .then(
        data => dispatch(success(data)),
        error => dispatch(failure(error.toString()))
      );
    function request() {
      console.log("in requiest");
      return { type: privateipamConstants.GET_IPAM_REQUEST };
    }
    function success(data) {
      return { type: privateipamConstants.GET_IPAM_SUCCESS, data };
    }
    function failure(error) {
      return { type: privateipamConstants.GET_IPAM_FAILURE, error };
    }
  };
}

export const privateipamActions = {
  getAll: getAll,
  IpadmAddRequest: IpadmAddRequest,
  getIPUsageHistory: getIPUsageHistory,
  getIpamPageData: getIpamPageData
};
