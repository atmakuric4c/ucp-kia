import { datastoreConstants } from "../_constants";
import { datastoreService } from "../_services";
import { alertActions } from "./";
import { history } from "../_helpers";
import Swal from "sweetalert2";
function getAll() {
  return dispatch => {
    dispatch(request());

    datastoreService
      .getAll()
      .then(
        datastoredata => dispatch(success(datastoredata)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: datastoreConstants.DATASTORE_GETALL_REQUEST };
  }
  function success(datastoredata) {
    return { type: datastoreConstants.DATASTORE_GETALL_SUCCESS, datastoredata };
  }
  function failure(error) {
    return { type: datastoreConstants.DATASTORE_GETALL_FAILURE, error };
  }
}

function getDatastoreDetail(dsid) {
  return dispatch => {
    dispatch(request(dsid));
    datastoreService
      .getDatastoreDetail(dsid)
      .then(
        details => dispatch(success(details)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request(dsid) {
    return { type: datastoreConstants.DATASTORE_DETAIL_REQUEST, dsid };
  }
  function success(details) {
    return { type: datastoreConstants.DATASTORE_DETAIL_SUCCESS, details  };
  }
  function failure(error) {
    return { type: datastoreConstants.DATASTORE_DETAIL_FAILURE, error };
  }
}
function hostUnderDatastore(dsid) {
  return dispatch => {
    dispatch(request(dsid));
    datastoreService
      .hostUnderDatastore(dsid)
      .then(
        hostlist => dispatch(success(hostlist)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request(dsid) {
    return { type: datastoreConstants.HOST_LIST_REQUEST, dsid };
  }
  function success(hostlist) {
    return { type: datastoreConstants.HOST_LIST_SUCCESS, hostlist  };
  }
  function failure(error) {
    return { type: datastoreConstants.HOST_LIST_FAILURE, error };
  }
}

function getStoredByVdcId(vdc_id) {
  return dispatch => {
    dispatch(request(vdc_id));

    datastoreService
      .getStoredByVdcId(vdc_id)
      .then(
        datastores => dispatch(success(datastores)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request(vdc_id) {
    return { type: datastoreConstants.DATASTOREINFO_GETALL_REQUEST, vdc_id };
  }
  function success(datastores) {
    return {
      type: datastoreConstants.DATASTOREINFO_GETALL_SUCCESS,
      datastores
    };
  }
  function failure(error) {
    return { type: datastoreConstants.DATASTOREINFO_GETALL_FAILURE, error };
  }
}

function addDataStoreData(data) {
  return dispatch => {
    dispatch(request(data));
    datastoreService
      .addDataStoreData(data)
      .then(
        id => dispatch(success(id)),
        dispatch(getAll()),
        alertActions.success("Datastore saved successfully"),
        error => dispatch(failure(error.toString()))
      );
  };

  function request(data) {
    return { type: datastoreConstants.SAVE_DATASTOREINFO_GETALL_REQUEST, data };
  }
  function success(id) {
    return { type: datastoreConstants.SAVE_DATASTOREINFO_GETALL_SUCCESS, id };
  }
  function failure(error) {
    return { type: datastoreConstants.SAVE_DATASTOREINFO_GETALL_FAILURE,  error };
  }
}
function updateDatastore(data) {
  return dispatch => {
    dispatch(request(data));
    datastoreService
      .updateDatastore(data)
      .then(
        info => dispatch(success(info)),
        dispatch(getAll()),
        alertActions.success("Datastore updated successfully"),
        error => dispatch(failure(error.toString()))
      );
  };

  function request(data) {
    return { type: datastoreConstants.EDIT_DATASTOREINFO_GETALL_REQUEST, data };
  }
  function success(info) {
    return { type: datastoreConstants.EDIT_DATASTOREINFO_GETALL_SUCCESS, info };
  }
  function failure(error) {
    return { type: datastoreConstants.EDIT_DATASTOREINFO_GETALL_FAILURE,  error };
  }
}
export const datastoreActions = {
  getAll: getAll,
  getStoredByVdcId: getStoredByVdcId,
  addDataStoreData: addDataStoreData,
  updateDatastore:updateDatastore,
  getDatastoreDetail:getDatastoreDetail,
  hostUnderDatastore:hostUnderDatastore
};
