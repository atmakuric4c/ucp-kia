import config from "config";
import { authHeader } from "../_helpers";
export const vcenterlogService = {
  getAllLogs
};

function getAllLogs(typeid, vmid) {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  //console.log(requestOptions);
  return fetch(
    `${
      config.middleApiUrl
    }/vmware/vcenter_logs?vm_id=${vmid}&log_type=${typeid}`,
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
      return Promise.reject(error);
    }
    //  console.log(data);
    return data;
  });
}
