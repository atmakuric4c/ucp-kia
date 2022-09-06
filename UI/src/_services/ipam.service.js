import config from "config";
import { authHeader,logout } from "../_helpers";
export const ipamService = {
  getAll,
  IpadmAddRequest,
  getIPUsageHistory,
  getIpamPageData
};

function getAll() {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  return fetch(`${config.apiUrl}/secureApi/getAllIps`, requestOptions).then(
    handleResponse
  );
}

function IpadmAddRequest(ipData) {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(ipData)
  };
  return fetch(`${config.apiUrl}/secureApi/addIPamData`, requestOptions).then(
    handleResponse
  );
}
function getIPUsageHistory(ipid) {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ ipid: ipid })
  };
  return fetch(`${config.apiUrl}/secureApi/getIPHistory`, requestOptions).then(
    handleResponse
  );
}

function getIpamPageData(reqobj) {
  console.log("in service");
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(reqobj)
  };
  return fetch(
    `${config.apiUrl}/secureApi/getIpamPageData`,
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
