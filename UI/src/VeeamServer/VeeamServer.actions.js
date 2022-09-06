import { VeeamServerConstants } from "./VeeamServer.constatnts";
import { alertActions } from "./";
import { history } from "../_helpers";
import { VeeamServerService } from "./VeeamServer.services";
import { toast } from 'react-toastify';

function getAllServers() {
  return dispatch => {
    //dispatch(request());
    console.log("in Action");

    VeeamServerService
      .getAllServers()
      .then(
        data => dispatch(success(data)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: VeeamServerConstants.GETALL_REQUEST };
  }
  function success(data) {
    //console.log("In Actions " + ips);
    return { type: VeeamServerConstants.GETALL_SUCCESS, data };
  }
  function failure(error) {
    return { type: VeeamServerConstants.GETALL_FAILURE, error };
  }
}

function addServer(data) {
  return dispatch => {
    VeeamServerService.addServer(data).then(
      resp => {
        if(resp.status)
          toast.error(resp.message);
        else
          toast.success(resp.message);
        dispatch(getAllServers());
      },
      error => dispatch(error.toString())
    );
  };
}

export const VeeamServerActions = {
  getAllServers: getAllServers,
  addServer: addServer
};
