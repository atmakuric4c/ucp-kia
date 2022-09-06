import config from 'config';
import { authHeader,logout } from '../../_helpers';
export const vmlistService = {   
    getAll,
    addVm,
    vmOperations,
    vmDetail,
    vmResize,
    vmLogs,
    veeamOperations
};
function veeamOperations(frmData) { 
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };
    return fetch(`${config.apiUrl}/secureApi/citrix/veeam_operations`, requestOptions).then(handleResponse);
}
function getAll(vdc_id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/citrix/listdata/`+vdc_id, requestOptions).then(handleResponse);
}
function addVm(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    return fetch(`${config.middleApiUrl}/secureApi/citrix/add_vm`, requestOptions).then(handleResponse);
}
function vmOperations(frmData) { 
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };
    return fetch(`${config.apiUrl}/secureApi/citrix/vm_operations`, requestOptions).then(handleResponse);
}
function vmResize(frmData) { 
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };
    return fetch(`${config.apiUrl}/secureApi/citrix/vm_resize`, requestOptions).then(handleResponse);
}
function vmDetail(formData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    };

    return fetch(`${config.apiUrl}/secureApi/citrix/vm_detail`, requestOptions).then(handleResponse);
}

function vmLogs(formData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    };

    return fetch(`${config.apiUrl}/secureApi/citrix/vm_log`, requestOptions).then(handleResponse);
}

function handleResponse(response) {
    //console.log(response);
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