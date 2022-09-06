import config from "config";
import { authHeader,logout } from "../_helpers";
export const settingsService = {
  getEmailSettings,
  enableDisableEmail,
  addEmailConfig
};

function getEmailSettings() {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  return fetch(
    `${config.apiUrl}/secureApi/getEmailSettings`,
    requestOptions
  ).then(handleResponse);
}

function enableDisableEmail(id, status) {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ id: id, status: status })
  };
  return fetch(
    `${config.apiUrl}/secureApi/enableDisableEmail`,
    requestOptions
  ).then(handleResponse);
}

function addEmailConfig(emailconf) {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(emailconf)
  };
  return fetch(
    `${config.apiUrl}/secureApi/addEmailConfig`,
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
