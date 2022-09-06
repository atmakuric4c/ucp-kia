import config from 'config';
import { authHeader,logout } from '../../_helpers';
import Swal from "sweetalert2";

export const menusService = {   
    getAll,
    saveMenu,
    deleteMenu
};

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/menus`, requestOptions).then(handleResponse);
}

function saveMenu(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    return fetch(`${config.apiUrl}/secureApi/menus/saveMenu`, requestOptions).then(handleResponse);
}
function deleteMenu(id) {
    const requestOptions = {
      method: "DELETE",
      headers: authHeader()
    };
  
    return fetch(`${config.apiUrl}/secureApi/menus/${id}`, requestOptions).then(
      handleResponse
    );
  }
function handleResponse(response) {
    console.log(response);
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