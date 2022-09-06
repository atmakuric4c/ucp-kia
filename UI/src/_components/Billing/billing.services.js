import config from 'config';
import { authHeader,logout,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';
import Swal from "sweetalert2";

export const billingService = {
    getOrderList,
    getInvoiceList,
    getTransactionsList,
    getPaymentsList,
    getOrderDetails,
    viewHourlyReport,
    downloadHourlyReport,
    payInvoice
};

function getOrderList(clientid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/billing/getOrderList/`+btoa(clientid), requestOptions).then(handleEncResponse);
}

function getInvoiceList(clientid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/billing/getInvoiceList/`+btoa(clientid), requestOptions).then(handleEncResponse);
}

function getPaymentsList(clientid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/billing/getPaymentsList/`+btoa(clientid), requestOptions).then(handleEncResponse);
}

function getTransactionsList(clientid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/billing/getTransactionsList/`+btoa(clientid), requestOptions).then(handleEncResponse);
}

function payInvoice(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    return fetch(`${config.apiUrl}/secureApi/billing/payInvoice`, requestOptions).then(handleResponse);
}

function getOrderDetails(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    return fetch(`${config.apiUrl}/secureApi/billing/getOrderDetails`, requestOptions).then(handleEncResponse);
}

function viewHourlyReport(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    return fetch(`${config.apiUrl}/secureApi/billing/viewHourlyReport`, requestOptions).then(handleEncResponse);
}

function downloadHourlyReport(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    return fetch(`${config.apiUrl}/secureApi/billing/downloadHourlyReport?time=${(new Date().getTime() / 1000)}`, requestOptions).then(handleEncResponse);
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
