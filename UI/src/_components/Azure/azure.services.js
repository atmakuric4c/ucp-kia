import config from 'config';
import { authHeader,logout,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';
export const azureService = {   
    getAll,
    addVm,
    vmOperations,
    getAzureResourceGroups,
    getUserVmAccessRequests,
    getAzureDropdownData,
    getAzureSubscriptions,
    getAzureSubscriptionLocations,
    addAzureResourceGroups,
    vmDetail,
    vmResize,
    vmLogs,
    getAllNetwork,
    addAzureNetwork
};

function getAzureSubscriptions(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    return fetch(`${config.apiUrl}/secureApi/getAzureSubscriptions`, requestOptions).then(handleEncResponse);
}

function getAzureSubscriptionLocations(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    return fetch(`${config.apiUrl}/secureApi/getAzureSubscriptionLocations`, requestOptions).then(handleEncResponse);
}

function addAzureResourceGroups(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };
    return fetch(`${config.apiUrl}/secureApi/azure/addAzureResourceGroups`, requestOptions).then(handleResponse);
}
function addAzureNetwork(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };
    return fetch(`${config.apiUrl}/secureApi/azure/addAzureNetwork`, requestOptions).then(handleResponse);
}
function getAll(clientid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureApi/azure/listdata/`+btoa(clientid), requestOptions).then(handleResponse);
}

function getAllNetwork(clientid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureApi/azure/networks/`+btoa(clientid), requestOptions).then(handleEncResponse);
}

function getAzureResourceGroups(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    return fetch(`${config.middleApiUrl}/secureApi/azure/getAzureResourceGroups`, requestOptions).then(handleEncResponse);
}

function getUserVmAccessRequests(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    return fetch(`${config.middleApiUrl}/secureApi/azure/getUserVmAccessRequests`, requestOptions).then(handleEncResponse);
}

function getAzureDropdownData(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    return fetch(`${config.middleApiUrl}/secureApi/azure/getAzureDropdownData`, requestOptions).then(handleEncResponse);
}

function addVm(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    return fetch(`${config.middleApiUrl}/secureApi/azure/add_vm`, requestOptions).then(handleResponse);
}
function vmOperations(frmData) { 
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };
    return fetch(`${config.apiUrl}/secureApi/azure/vm_operations`, requestOptions).then(handleEncResponse);
}
function vmResize(frmData) { 
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };
    return fetch(`${config.apiUrl}/secureApi/azure/vm_resize`, requestOptions).then(handleResponse);
}
function vmDetail(encId) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/azure/getVMDetails/${encId}`, requestOptions).then(handleResponse);
}

function vmLogs(formData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(formData))
    };

    return fetch(`${config.apiUrl}/secureApi/azure/vm_log`, requestOptions).then(handleEncResponse);
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