import config from "config";
import { authHeader,logout } from "../_helpers";
import { toast } from "react-toastify";
export const esxiService = {
  getAllHosts,getHostDetail,datastoreUnderHost
};
function getAllHosts() {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  return fetch(
    `${config.apiUrl}/secureApi/getAllHostDetails`,
    requestOptions
  ).then(handleResponse);
}

function getHostDetail(hostid) {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  return fetch(
    `${config.apiUrl}/secureApi/getHostDetail/${hostid}`,
    requestOptions
  ).then(handleResponse);
}
function datastoreUnderHost(hostid) {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  return fetch(
    `${config.apiUrl}/secureApi/datastoreUnderHost/${hostid}`,
    requestOptions
  ).then(handleResponse);
}

/*function esxiUpdateRequest(data) {
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
    return fetch(`${config.apiUrl}/secureApi/updateHostDetails`, requestOptions).then(
      handleResponse
    );
  }*/
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
  