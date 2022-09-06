import config from 'config';
import { authHeader, ucpEncrypt, ucpDecrypt,logout } from "../_helpers";

export const profileService = {   
    getAll,
    addProfile,
    getById,
    update,
    delete: _delete,
    getProfileList,
    addProfile,
    updateProfile,
    deleteProfile,
    getUserProfile,
    getVMOperationList
};

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/profiles`, requestOptions).then(handleEncResponse);
}

function addProfile(profiledata){
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(profiledata)
    };

    return fetch(`${config.apiUrl}/secureApi/profiles`, requestOptions).then(handleResponse);
}

function getById(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/profiles/${id}`, requestOptions).then(handleResponse);
}

function update(formData) {    
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    };

    return fetch(`${config.apiUrl}/secureApi/profiles/${formData.id}`, requestOptions).then(handleResponse);;
}

// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/profiles/${id}`, requestOptions).then(handleResponse);
}

function getProfileList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureAPi/profile`, requestOptions).then(handleEncResponse);
}

function addProfile(params) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    };
    return fetch(`${config.apiUrl}/secureAPi/profile`, requestOptions).then(handleResponse);
}

function updateProfile(params) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(params.body)
    };
    return fetch(`${config.apiUrl}/secureAPi/profile/${params.profile_id}`, requestOptions).then(handleResponse);
}

function deleteProfile(params) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureAPi/profile/${params.profile_id}`, requestOptions).then(handleResponse);
}

function getUserProfile(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureAPi/profile/user`, requestOptions).then(handleResponse);
}

function getVMOperationList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureAPi/vmoperation`, requestOptions).then(handleResponse);
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