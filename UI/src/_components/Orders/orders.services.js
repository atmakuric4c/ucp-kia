import config from 'config';
import { authHeader,logout,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';
import Swal from "sweetalert2";

export const ordersService = {   
    getAllCloudNames,
    getAllDCLocations,
    getCopyTypes,
    getOsTemplates,
    getBillingPrice,
    getPendingOrders,
    getConsoleOutput,
    updatePgiSelection,
    saveOrderInfo,
    saveTxnInfo,
    payFromFunds,
    getCartList,
    getApprovalPendingVmOpsList,
    getApprovalPendingCartList,
    getTxnSuccessData,
    updateCartItemCount,
    deleteCartItem,
    getTxnDetails
};

function getAllCloudNames() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/orders/getAllCloudNames`, requestOptions).then(handleResponse);
}

function getCartList(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    return fetch(`${config.apiUrl}/secureApi/orders/getCartList`, requestOptions).then(handleEncResponse);
}

function getApprovalPendingVmOpsList(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };
    console.log('getApprovalPendingVmOpsList===',frmData)
    return fetch(`${config.apiUrl}/secureApi/orders/getApprovalPendingVmOpsList`, requestOptions).then(handleEncResponse);
}

function getApprovalPendingCartList(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    return fetch(`${config.apiUrl}/secureApi/orders/getApprovalPendingCartList`, requestOptions).then(handleEncResponse);
}

function getTxnSuccessData(txnId) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/orders/getTxnSuccessData/`+txnId, requestOptions).then(handleResponse);
}

function updateCartItemCount(id,count) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/orders/updateCartItemCount/`+id+'/'+count, requestOptions).then(handleResponse);
}

function deleteCartItem(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/orders/deleteCartItem/`+id, requestOptions).then(handleResponse);
}

function getAllDCLocations(cloudName) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/orders/getAllDCLocations/`+(btoa(cloudName)), requestOptions).then(handleEncResponse);
}

function getOsTemplates(vdc_tech_disk_id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/orders/getOsTemplates/`+(btoa(vdc_tech_disk_id)), requestOptions).then(handleEncResponse);
}

function getCopyTypes(vdc_tech_disk_id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/orders/getCopyTypes/`+(btoa(vdc_tech_disk_id)), requestOptions).then(handleEncResponse);
}

function getTxnDetails(txnId) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/orders/getTxnDetails/`+txnId, requestOptions).then(handleResponse);
}

function getBillingPrice(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    return fetch(`${config.apiUrl}/secureApi/orders/getBillingPrice`, requestOptions).then(handleEncResponse);
}

function getPendingOrders(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    return fetch(`${config.apiUrl}/secureApi/orders/jenkins-build-data`, requestOptions).then(handleEncResponse);
}

function getConsoleOutput(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    return fetch(`${config.apiUrl}/jenkinsapi/console-output`, requestOptions).then(handleEncResponse);
}

function updatePgiSelection(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    return fetch(`${config.apiUrl}/secureApi/orders/updatePgiSelection`, requestOptions).then(handleEncResponse);
}

function saveOrderInfo(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    return fetch(`${config.apiUrl}/secureApi/orders/saveOrderInfo`, requestOptions).then(handleEncResponse);
}

function saveTxnInfo(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    return fetch(`${config.apiUrl}/secureApi/orders/saveTxnInfo`, requestOptions).then(handleResponse);
}

function payFromFunds(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    return fetch(`${config.apiUrl}/secureApi/orders/payFromFunds`, requestOptions).then(handleEncResponse);
}

function handleResponse(response) {
//    debugger;
    console.log(response);
    return response.text().then(text => {
//        debugger
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