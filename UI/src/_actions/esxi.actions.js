import { esxiConstants } from '../_constants';
import { esxiService } from '../_services';
import { alertActions } from ".";
import { history } from "../_helpers";

function getAllHosts() {
  return dispatch => {
    dispatch(request());

    esxiService
      .getAllHosts()
      .then(
        data => dispatch(success(data)),
        error => dispatch(failure(error.toString()))
      );

  };

  function request() {
    return { type: esxiConstants.GETALL_REQUEST };
  }
  function success(data) {
   //console.log("action array:"+JSON.stringify(data));
    return { type: esxiConstants.GETALL_SUCCESS, data };
  }
  function failure(error) {
    return { type: esxiConstants.GETALL_FAILURE, error };
  }
}

function getHostDetail(hostid) {
  return dispatch => {
    dispatch(request(hostid));
    esxiService
      .getHostDetail(hostid)
      .then(
        details => dispatch(success(details)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request(hostid) {
    return { type: esxiConstants.HOST_DETAIL_REQUEST, hostid };
  }
  function success(details) {
    return { type: esxiConstants.HOST_DETAIL_SUCCESS, details  };
  }
  function failure(error) {
    return { type: esxiConstants.HOST_DETAIL_FAILURE, error };
  }
}

function datastoreUnderHost(hostid) {
  return dispatch => {
    dispatch(request(hostid));
    esxiService
      .datastoreUnderHost(hostid)
      .then(
        dslist => dispatch(success(dslist)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request(hostid) {
    return { type: esxiConstants.DS_UNDER_HOST_REQUEST, hostid };
  }
  function success(dslist) {
    return { type: esxiConstants.DS_UNDER_HOST_SUCCESS, dslist  };
  }
  function failure(error) {
    return { type: esxiConstants.DS_UNDER_HOST_FAILURE, error };
  }
}
export const esxiActions = {
  getAllHosts:getAllHosts,
  getHostDetail:getHostDetail,
  datastoreUnderHost:datastoreUnderHost
};


 

/*function esxiUpdateRequest(vdata) {
return dispatch => {
  dispatch(request(vdata));
  esxiServices.esxiUpdateRequest(vdata).then(
    id => {
      dispatch(success(id));
      dispatch(alertActions.success("ESXI Updated successfully"));
    },
    error => {
      dispatch(failure(error.toString()));
      dispatch(alertActions.error(error.toString()));
    }
  );
};
function request(vdata) {
  return { type: esxiConstants.UPDATEESXI_REQUEST, vdata };
}
function success(vdata) {
  //console.log("In Actions " + ips);
  return { type: esxiConstants.UPDATEESXI_SUCCESS, vdata };
}
function failure(error) {
  return { type: esxiConstants.UPDATEESXI_FAILURE, error };
}
}
  esxiUpdateRequest: esxiUpdateRequest
*/