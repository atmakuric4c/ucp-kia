import { settingsConstants } from "../_constants";
import { settingsService } from "../_services";
import { alertActions } from "./";
import { history } from "../_helpers";
import { toast } from 'react-toastify';

function getEmailSettings() {
  return dispatch => {
    dispatch(request());

    settingsService
      .getEmailSettings()
      .then(
        emaildata => dispatch(success(emaildata)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: settingsConstants.SETTINGS_GETALL_REQUEST };
  }
  function success(emaildata) {
    //console.log("In Actions " + ips);
    return { type: settingsConstants.SETTINGS_GETALL_SUCCESS, emaildata };
  }
  function failure(error) {
    return { type: settingsConstants.SETTINGS_GETALL_FAILURE, error };
  }
}

function enableDisableEmail(id, status) {
  return dispatch => {
    dispatch(request(id, status));
    settingsService
      .enableDisableEmail(id, status)
      .then(
        respdata => dispatch(success(respdata), getEmailSettings()),
        error => dispatch(failure(error.toString()))
      );
  };

  function request(id, status) {
    //console.log(id + " -In Request- " + status);
    return {
      type: settingsConstants.SETTINGS_EMAIL_ENABLE_DISABLE_REQUEST,
      id,
      status
    };
  }
  function success(respdata) {
    return {
      type: settingsConstants.SETTINGS_EMAIL_ENABLE_DISABLE_SUCCESS,
      respdata
    };
  }
  function failure(error) {
    return {
      type: settingsConstants.SETTINGS_EMAIL_ENABLE_DISABLE_FAILURE,
      error
    };
  }
}

function addEmailConfig(emailconf) {
  return dispatch => {
    dispatch(request(emailconf));
    settingsService
      .addEmailConfig(emailconf)
      .then(
        respdata =>
          dispatch(
            success(respdata),
            toast.success("Mail Status Added Successfully.")
          ),
        error => dispatch(failure(error.toString()))
      );
  };

  function request(emailconf) {
    return {
      type: settingsConstants.SETTINGS_EMAIL_ADD_REQUEST,
      emailconf
    };
  }
  function success(respdata) {
    return {
      type: settingsConstants.SETTINGS_EMAIL_ADD_SUCCESS,
      respdata
    };
  }
  function failure(error) {
    return {
      type: settingsConstants.SETTINGS_EMAIL_ADD_FAILURE,
      error
    };
  }
}

export const settingsActions = {
  getEmailSettings: getEmailSettings,
  enableDisableEmail: enableDisableEmail,
  addEmailConfig: addEmailConfig
};
