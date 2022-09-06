import config from "config";
import { authHeader,logout } from "../_helpers";
import { toast } from "react-toastify";
export const vCentermgmtService = {
  vcenterAddRequest: vcenterAddRequest,
  vCenterUpdateRequest: vCenterUpdateRequest
};
function vcenterAddRequest(vdata) {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(vdata)
  };
  return fetch(
    `${config.apiUrl}/vmware/add_vcenter_details`,
    requestOptions
  ).then(handleResponse);
}

function vCenterUpdateRequest(vdata) {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(vdata)
  };
  return fetch(
    `${config.apiUrl}/vmware/update_vcenter_details`,
    requestOptions
  ).then(handleResponse);
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
      if(typeof data.message == 'object')
        toast.error(JSON.stringify(data));
      else toast.error(data.message);
      return Promise.reject(error);
    }
    //  console.log(data);
    return data;
  });
}
