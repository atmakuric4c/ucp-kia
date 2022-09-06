import config from "config";
import { authHeader,logout,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from "../_helpers";
export const commonService = {
  getAllVdcLocations,
  getDashboardCounts,
  getAllMenus,
  setEnableDisable,
  getDashboard,
  getUserMenus,getVmListArr,
  getRamList,getCpuList,getDiskList
};

function getAllVdcLocations() {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  //console.log(requestOptions);
  return fetch(
    `${config.apiUrl}/secureApi/getAllVdcLocations`,
    requestOptions
  ).then(handleResponse);
}
function getDashboardCounts(params) {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(ucpEncrypt(params))
  };

  return fetch(
    `${config.apiUrl}/secureApi/getDashboardCounts`,
    requestOptions
  ).then(handleEncResponse);
}

function getRamList() {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  //console.log(requestOptions);
  return fetch(
    `${config.apiUrl}/secureApi/getRamList`,
    requestOptions
  ).then(handleEncResponse);
}

function getCpuList() {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  //console.log(requestOptions);
  return fetch(
    `${config.apiUrl}/secureApi/getCpuList`,
    requestOptions
  ).then(handleEncResponse);
}

function getDiskList() {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  //console.log(requestOptions);
  return fetch(
    `${config.apiUrl}/secureApi/getDiskList`,
    requestOptions
  ).then(handleEncResponse);
}

function getAllMenus() {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  //console.log(requestOptions);
  return fetch(`${config.apiUrl}/secureApi/getAllMenus`, requestOptions).then(
    handleResponse
  );
}

function setEnableDisable(action, id, value) {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ action: action, id: id, value: value })
  };

  return fetch(
    `${config.apiUrl}/secureApi/setEnableDisable`,
    requestOptions
  ).then(handleResponse);
}
function getVmListArr(frmData) {
  const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
  };
  return fetch(`${config.apiUrl}/secureApi/getVmListArr`, requestOptions).then(handleResponse);
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
function handleEncResponse(response) {
  //  console.log("response === "+JSON.stringify(response));
    return response.text().then(text => {
  //	  console.log("bef text");
  //	  console.log(text);
      const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
  //    console.log("aft data");
  //	  console.log(data);
      if (!response.ok) {
        if (response.status === 401) {
          // auto logout if 401 response returned from api
          logout();
          if(response.message=='')
          location.reload(true);
        }
  
        const error = (data && data.message) || response.statusText;
        return Promise.reject(error);
      }
  
      return data;
    });
  }

function getDashboard() {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  //console.log(requestOptions);
  return fetch(`${config.apiUrl}/secureApi/getDashboard`, requestOptions).then(
    handleResponse
  );
}

function getUserMenus() {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  //console.log(requestOptions);
  return fetch(`${config.apiUrl}/secureApi/getUserMenus`, requestOptions).then(
    handleResponse
  );
}
