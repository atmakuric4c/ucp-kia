import config from "config";
import { authHeader } from "../_helpers";
export const networkMgmtService = {
  getAllNetworks,
  addNetwork
};

function getAllNetworks() {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  //console.log(requestOptions);
  return fetch(
    `${config.apiUrl}/secureApi/getAllNetworks`,
    requestOptions
  ).then(handleResponse);
}

function addNetwork(data) {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
  //console.log(requestOptions);
  return fetch(`${config.apiUrl}/secureApi/addNetwork`, requestOptions).then(
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
      return Promise.reject(error);
    }
    //  console.log(data);
    return data;
  });
}
