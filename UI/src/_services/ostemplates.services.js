import config from 'config';
import { authHeader,logout } from '../_helpers';

export const ostemplatesService = {   
    getAll,
    update
};

function getAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/ostemplates`, requestOptions).then(handleResponse);
}

function update(ostempdata) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ostempdata)
    };

    return fetch(`${config.apiUrl}/secureApi/ostemplates/${ostempdata.ostempid}`, requestOptions).then(handleResponse);;
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