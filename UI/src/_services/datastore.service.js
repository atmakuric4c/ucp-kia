import config from "config";
import { authHeader,logout } from "../_helpers";
import { toast } from "react-toastify";
export const datastoreService = {
  getAll,
  getStoredByVdcId,
  addDataStoreData,
  updateDatastore,
  getDatastoreDetail,
  hostUnderDatastore
};

function getAll() {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  return fetch(
    `${config.apiUrl}/secureApi/getAllDataStores`,
    requestOptions
  ).then(handleResponse);
}
function hostUnderDatastore(dsid) {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  return fetch(
    `${config.apiUrl}/secureApi/hostUnderDatastore/${dsid}`,
    requestOptions
  ).then(handleResponse);
}
function getDatastoreDetail(dsid) {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  return fetch(
    `${config.apiUrl}/secureApi/getDataStoreDetail/${dsid}`,
    requestOptions
  ).then(handleResponse);
}

function getStoredByVdcId(vdc_id) {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ vdc_id: vdc_id })
  };
  return fetch(
    `${config.apiUrl}/vmware/vcenter_datastores`,
    requestOptions
  ).then(handleResponse);
}
function addDataStoreData(data) {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
  return fetch(`${config.apiUrl}/vmware/add_datastore`, requestOptions).then(
    handleResponse
  );
}
function updateDatastore(data) {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
  return fetch(`${config.apiUrl}/vmware/update_datastore`, requestOptions).then(
    handleResponse
  );
}

function handleResponse(response) {
  return response.text().then(text => {
    const data = text && JSON.parse(text);

    if (!response.ok) {
      if (response.status === 401) {
        // auto logout if 401 response returned from api
        logout();
        location.reload(true);
      }

      const error = (data && data.message) || response.statusText;
      toast.error(data.message);
      return Promise.reject(error);
    }
    //  console.log(data);
    return data;
  });
}
