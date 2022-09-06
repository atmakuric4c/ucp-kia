import config from 'config';
import { authHeader,logout,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../_helpers';

export const billingService = {
    getBudgetAlerts,
    updateBudgetAlerts,
    getAwsBillingReports,
    getAzureBillingReports,
    getGcpBillingReports
};

function getBudgetAlerts(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureApi/budgetAlertList/${params.cloudName}`, requestOptions).then(handleResponse);
}


function updateBudgetAlerts(params) {
    const requestOptions = {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(params.arrAlert)
    };

    return fetch(`${config.apiUrl}/secureApi/budgetAlertList/${params.cloudName}`, requestOptions).then(handleResponse);
}

function getAwsBillingReports(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    var queryString = `start_date=${params.start_date}&end_date=${params.end_date}&set=${params.set}&limit=${params.limit}`
    return fetch(`${config.apiUrl}/secureApi/aws/billingReport?${queryString}`, requestOptions).then(handleResponse);
}

function getAzureBillingReports(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    var queryString = `start_date=${params.start_date}&end_date=${params.end_date}&set=${params.set}&limit=${params.limit}`
    return fetch(`${config.apiUrl}/secureApi/azure/billingReport?${queryString}`, requestOptions).then(handleResponse);
}

function getGcpBillingReports(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    var queryString = `start_date=${params.start_date}&end_date=${params.end_date}&set=${params.set}&limit=${params.limit}`
    return fetch(`${config.apiUrl}/secureApi/gcp/billingReport?${queryString}`, requestOptions).then(handleResponse);
}

function handleResponse(response) {
    // console.log(response);
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
