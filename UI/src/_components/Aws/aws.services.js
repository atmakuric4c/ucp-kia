import config from 'config';
import { authHeader,logout,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';
export const awsService = {   
    getAll,
    addVm,
    vmOperations,
    getAwsResourceGroups,
    getAwsSubscriptions,
    getAwsSubscriptionLocations,
    addAwsResourceGroups,
    vmDetail,
    vmResize,
    vmLogs,
    getAllNetwork,
    addAwsNetwork
};

function getAwsSubscriptions(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    return fetch(`${config.apiUrl}/secureApi/getAwsSubscriptions`, requestOptions).then(handleResponse);
}

function getAwsSubscriptionLocations(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    return fetch(`${config.apiUrl}/secureApi/getAwsSubscriptionLocations`, requestOptions).then(handleResponse);
}

function addAwsResourceGroups(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };
    return fetch(`${config.apiUrl}/secureApi/aws/addAwsResourceGroups`, requestOptions).then(handleResponse);
}
function addAwsNetwork(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };
    return fetch(`${config.apiUrl}/secureApi/aws/addAwsNetwork`, requestOptions).then(handleResponse);
}
function getAll(clientid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureApi/aws/listdata/`+btoa(clientid), requestOptions).then(handleEncResponse);
}

function getAllNetwork(clientid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureApi/aws/networks/`+btoa(clientid), requestOptions).then(handleEncResponse);
}

function getAwsResourceGroups(clientid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/aws/getAwsResourceGroups/`+clientid, requestOptions).then(handleResponse);
}
function addVm(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    return fetch(`${config.middleApiUrl}/secureApi/aws/add_vm`, requestOptions).then(handleResponse);
}
function vmOperations(frmData) { 
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };
    return fetch(`${config.apiUrl}/secureApi/aws/vm_operations`, requestOptions).then(handleEncResponse);
}
function vmResize(frmData) { 
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };
    return fetch(`${config.apiUrl}/secureApi/aws/vm_resize`, requestOptions).then(handleResponse);
}
function vmDetail(formData) {
    const requestOptions = {
        method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(ucpEncrypt(formData))
      };
    return fetch(`${config.apiUrl}/secureApi/aws/vm_detail`, requestOptions).then(handleEncResponse);
}

function vmLogs(formData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    };

    return fetch(`${config.apiUrl}/secureApi/aws/vm_log`, requestOptions).then(handleResponse);
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