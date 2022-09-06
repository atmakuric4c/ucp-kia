import { vcentermgmtConstants } from "../_constants";
import { vCentermgmtService } from "../_services";
import { alertActions } from "./";
import { history } from "../_helpers";
import { toast } from 'react-toastify';

function vCenterAddRequest(vdata) {
  return dispatch => {
    dispatch(request(vdata));
    vCentermgmtService.vcenterAddRequest(vdata).then(
      id => {
        dispatch(success(id));
        dispatch(
          alertActions.success("VCenter Saved successfully"),
          toast.success("VCenter Saved successfully.")
        );
      },
      error => {
        dispatch(failure(error.toString()));
        dispatch(alertActions.error(error.toString()));
      }
    );
  };
  function request(vdata) {
    return { type: vcentermgmtConstants.ADDVCENTER_REQUEST, vdata };
  }
  function success(vdata) {
    //console.log("In Actions " + ips);
    return { type: vcentermgmtConstants.ADDVCENTER_SUCCESS, vdata };
  }
  function failure(error) {
    return { type: vcentermgmtConstants.ADDVCENTER_FAILURE, error };
  }
}

function vCenterUpdateRequest(vdata) {
  return dispatch => {
    dispatch(request(vdata));
    vCentermgmtService.vCenterUpdateRequest(vdata).then(
      id => {
        dispatch(success(id));
        dispatch(
          alertActions.success("VCenter Updated successfully"),
          toast.success("VCenter Updated successfully.")
        );
      },
      error => {
        dispatch(failure(error.toString()));
        dispatch(alertActions.error(error.toString()));
      }
    );
  };
  function request(vdata) {
    return { type: vcentermgmtConstants.UPDATEVCENTER_REQUEST, vdata };
  }
  function success(vdata) {
    //console.log("In Actions " + ips);
    return { type: vcentermgmtConstants.UPDATEVCENTER_SUCCESS, vdata };
  }
  function failure(error) {
    return { type: vcentermgmtConstants.UPDATEVCENTER_FAILURE, error };
  }
}

export const vcentermgmtActions = {
  vCenterAddRequest: vCenterAddRequest,
  vCenterUpdateRequest: vCenterUpdateRequest
};
