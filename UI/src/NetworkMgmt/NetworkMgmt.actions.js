import { NetworkMgmtConstants } from "./NetworkMgmt.constatnts";
import { alertActions } from "./";
import { history } from "../_helpers";
import { networkMgmtService } from "./NetworkMgmt.services";
import { toast } from 'react-toastify';

function getAllNetworks() {
  return dispatch => {
    //dispatch(request());
    console.log("in Action");

    networkMgmtService
      .getAllNetworks()
      .then(
        data => dispatch(success(data)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: NetworkMgmtConstants.GETALL_REQUEST };
  }
  function success(data) {
    //console.log("In Actions " + ips);
    return { type: NetworkMgmtConstants.GETALL_SUCCESS, data };
  }
  function failure(error) {
    return { type: NetworkMgmtConstants.GETALL_FAILURE, error };
  }
}

function addNetwork(data) {
  return dispatch => {
    //dispatch(request());
    console.log("in Action");

    networkMgmtService.addNetwork(data).then(
      resp => {
        if(resp.status)
          toast.error(resp.message);
        else
          toast.success(resp.message);
        dispatch(getAllNetworks());
      },
      error => dispatch(error.toString())
    );
  };
}

export const NetworkMgmtActions = {
  getAllNetworks: getAllNetworks,
  addNetwork: addNetwork
};
