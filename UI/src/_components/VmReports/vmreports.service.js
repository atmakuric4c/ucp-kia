
import config from 'config';
import { authHeader,logout } from '../../_helpers';

export const vmReportService = {
    getHourlyReports,getVmHourlyHistory,getAllVmlist,generateReport,generateVmHourlyReport
};
function generateReport() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureApi/vmreports/generateVMReport`, requestOptions).then(handleResponse);
}
function generateVmHourlyReport(reportData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
    };
    return fetch(`${config.apiUrl}/secureApi/vmreports/generateVmHourlyReport`, requestOptions).then(handleResponse);
}
function getHourlyReports() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureApi/vmreports/hourlyReport`, requestOptions).then(handleResponse);
}
function getVmHourlyHistory(reportData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
    };
    return fetch(`${config.apiUrl}/secureApi/vmreports/hourlyHistoryReport`, requestOptions).then(handleResponse);
}
function getAllVmlist() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureApi/vmlist/listdata/0`, requestOptions).then(handleResponse);
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