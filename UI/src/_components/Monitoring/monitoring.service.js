
import config from 'config';
import { authHeader,logout,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';

export const monitoringService = {
    getAllMonitoringServers,saveMonitoringServer, getHostItemsGraphs,getAllAlerts,
    getHostUsageMetrics,getHostItemsFromZabbix,getAllMonitoringVms,vmItemsSave,
    getAllMetrics,addGroup,editGroup,getHostUptimeReport,addHostUptimeReport,
    getHostUtilizationReport,addHostUtilizationReport,usageMetricFromApi
};

function getAllMonitoringServers() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/monitoring/getAllMonitoringServers`, requestOptions).then(handleResponse);
}

function saveMonitoringServer(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    return fetch(`${config.apiUrl}/secureApi/monitoring/saveMonitoringServer`, requestOptions).then(handleResponse);
}
function getAllAlerts() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureApi/monitoring/alerts`, requestOptions).then(handleResponse);
}
function getHostItemsGraphs(id, service_type) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    
    if(service_type){
        return fetch(`${config.apiUrl}/vmware/get_monitoring_graph_data/?vm_id=${id}&service_type=zabbix`, requestOptions).then(handleResponse);    
    }
    else{
        return fetch(`${config.apiUrl}/vmware/get_monitoring_graph_data/?vm_id=${id}`, requestOptions).then(handleResponse);
    }
}
function getAllMonitoringVms(vmdata) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(vmdata))
    };
    return fetch(`${config.apiUrl}/secureApi/monitoring/getAllMonitoringVms`, requestOptions).then(handleEncResponse);
}
function getHostItemsFromZabbix(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureApi/monitoring/getHostItemsFromZabbix/${id}`, requestOptions).then(handleResponse);
}
function getHostUsageMetrics(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureApi/monitoring/usageMetrics/${id}`, requestOptions).then(handleResponse);
}
function usageMetricFromApi(postData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
    };
    return fetch(`${config.apiUrl}/secureApi/monitoring/usageMetricFromApi`, requestOptions).then(handleResponse);
}
function vmItemsSave(vmItemData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(vmItemData)
    };
    return fetch(`${config.apiUrl}/secureApi/monitoring/vmItemsSave`, requestOptions).then(handleResponse);
}
function getHostUptimeReport(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureApi/monitoring/uptimeReport/${id}`, requestOptions).then(handleResponse);
}
function addHostUptimeReport(reportData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
    };
    return fetch(`${config.apiUrl}/secureApi/monitoring/addUptimeReport`, requestOptions).then(handleResponse);
}
function getHostUtilizationReport(id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureApi/monitoring/utilizationReport/${id}`, requestOptions).then(handleResponse);
}
function addHostUtilizationReport(reportData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
    };
    return fetch(`${config.apiUrl}/secureApi/monitoring/addUtilizationReport`, requestOptions).then(handleResponse);
}
function getAllMetrics() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureApi/monitoring/metrics`, requestOptions).then(handleResponse);
}
function addGroup(groupdata){
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(groupdata)
    };
    return fetch(`${config.apiUrl}/secureApi/monitoring/addgroup`, requestOptions).then(handleResponse);
}
function editGroup(groupdata){
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(groupdata)
    };
    return fetch(`${config.apiUrl}/secureApi/monitoring/editGroup`, requestOptions).then(handleResponse);
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