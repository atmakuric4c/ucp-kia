import config from "config";
import { authHeader, ucpEncrypt, ucpDecrypt } from "../../_helpers";

export const ApprovalMatrixService = {
  getAll,
  addUser,
  update,
};


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

function getAll(params) {
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(ucpEncrypt(params))
  };
  return fetch(`${config.apiUrl}/secureApi/approvalMatrix/list`, requestOptions).then(
		  handleEncResponse
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

