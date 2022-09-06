import { VcenterlogConstants } from "./vcenterlog.constatnts";
import { alertActions } from "./";
import { history } from "../_helpers";
import { vcenterlogService } from "./vcenterlog.service";
import Swal from "sweetalert2";
import { toast } from 'react-toastify';

function getAllLogs(typeid, vmid) {
  return dispatch => {
    vcenterlogService
      .getAllLogs(typeid, vmid)
      .then(
        data => dispatch(success(data)),
        error =>
          dispatch(
            failure(error.toString()),
            toast.error(error.toString())
          )
      );
  };

  function request() {
    return { type: VcenterlogConstants.GETALL_REQUEST };
  }
  function success(data) {
    //console.log("In Actions " + ips);
    return { type: VcenterlogConstants.GETALL_SUCCESS, data };
  }
  function failure(error) {
    return { type: VcenterlogConstants.GETALL_FAILURE, error };
  }
}

export const vcenterlogActions = {
  getAllLogs: getAllLogs
};
