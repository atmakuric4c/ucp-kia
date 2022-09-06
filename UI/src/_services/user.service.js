import config from "config";
import { authHeader, ucpEncrypt, ucpDecrypt, decryptResponse } from "../_helpers";

const clearSession = (url) => {
  window.location.href = `${url}`;
}

export const userService = {
  login,
  logout,
  register,
  getAll,
  getById,
  addUser,
  update,
  resetPasswordRequest,
  resetNewPasswordRequest,
  validateResetPasswordRequest,
  changePasswordRequest,
  delete: _delete,
  forgotpass
};

function login(email, password) {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    //headers: { "Content-Type": "application/json" , "mode":"no-cors"},
    body: JSON.stringify(ucpEncrypt({ email, password },{}))
  };
  
//  console.log("requestOptions");
//  console.log(requestOptions);

  return fetch(`${config.apiUrl}/api/login`, requestOptions)
    .then(handleEncResponse)
    .then(user => {
      // store user details and jwt token in local storage to keep user logged
		// in between page refreshes
      localStorage.setItem("user", JSON.stringify(user));
      const requestOptions = {
        method: "GET",
        headers: authHeader()
      };
      /*
		 * return fetch(`${config.apiUrl}/secureApi/getUserMenus`,
		 * requestOptions) .then(handleResponse) .then(menus => {
		 * localStorage.setItem("menus", JSON.stringify(menus)); return user;
		 * });
		 */
      return user;
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

function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("menus");
  /*
  let requestOptions = {
    method: "DELETE",
    headers: authHeader()
  }, user = decryptResponse(localStorage.getItem("user")),
  azure_account_id = user.data.azure_account_id;

  fetch(`${config.apiUrl}/api/adLogout`, requestOptions).then(response => {
    response.text().then(text => {
      const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

      if (azure_account_id) {
        let url = data.ad_azure_logout.replace('azure_account_id', azure_account_id);
        localStorage.removeItem("user");
        localStorage.removeItem("menus");
        clearSession(url);
      }
    })
  }).catch(e => {
    localStorage.removeItem("user");
  localStorage.removeItem("menus");
  })*/
}

function getAll(id) {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };
  return fetch(`${config.apiUrl}/secureApi/users/${id}`, requestOptions).then(
		  handleEncResponse
  );
}

function getById(id) {
  const requestOptions = {
    method: "GET",
    headers: authHeader()
  };

  return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(
    handleResponse
  );
}

function register(user) {
  user.company_entity = "cloud";
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  };

  return fetch(`${config.apiUrl}/api/signup`, requestOptions).then(
    handleResponse
  );
}

function forgotpass(user) {
  user.company_entity = "cloud";
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  };

  return fetch(`${config.apiUrl}/api/forgotpass`, requestOptions).then(
    handleResponse
  );
}

function addUser(userdata) {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(ucpEncrypt(userdata))
  };

  return fetch(`${config.apiUrl}/secureApi/users`, requestOptions).then(
		  handleEncResponse
  );
}

function update(userdata) {
  const requestOptions = {
    method: "PUT",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(ucpEncrypt(userdata))
  };

  return fetch(
    `${config.apiUrl}/secureApi/users/${userdata.id}`,
    requestOptions
  ).then(handleEncResponse);
}

// prefixed function name with underscore because delete is a reserved word in
// javascript
function _delete(id) {
  const requestOptions = {
    method: "DELETE",
    headers: authHeader()
  };

  return fetch(`${config.apiUrl}/users/${id}`, requestOptions).then(
    handleResponse
  );
}

function handleResponse(response) {
  // console.log("response === "+JSON.stringify(response));
  return response.text().then(text => {
    const data = text && JSON.parse(text);
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

function resetPasswordRequest(frmData) {
  const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
  };

  return fetch(`${config.apiUrl}/secureApi/users/resetPassword`, requestOptions).then(handleResponse);
}

function resetNewPasswordRequest(hash, newPassowrd, confirmPassowrd) {
  const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hash: hash, 
        userPassword: newPassowrd, 
        userCPassword: confirmPassowrd
      })
  };

  return fetch(`${config.apiUrl}/api/resetPassword`, requestOptions).then(handleResponse);
}

function validateResetPasswordRequest(hash) {
  
  const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hash: hash
      })
  };

  return fetch(`${config.apiUrl}/api/isValidResetHash`, requestOptions).then(handleResponse);
}

function changePasswordRequest(frmData) {
  const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
  };

  return fetch(`${config.apiUrl}/secureApi/users/changePassword`, requestOptions).then(handleResponse);
}