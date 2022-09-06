import config from 'config';
import { authHeader,logout } from '../../_helpers';

export const supportService = {   
    getAll,getTicketDetail,replyTicket,createTicket,getTicketFormData,getAllMyTicket
};

function getAll(clientid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/myshift/tickets/${clientid}`, requestOptions).then(handleResponse);
}
function getAllMyTicket(clientid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/myshift/mytickets/${clientid}`, requestOptions).then(handleResponse);
}

function getTicketFormData(clientid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureApi/myshift/getTicketFormData/${clientid}`, requestOptions).then(handleResponse);
}

function getTicketDetail(ticketid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/myshift/ticket_detail/${ticketid}`, requestOptions).then(handleResponse);
}
function replyTicket(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    return fetch(`${config.apiUrl}/secureApi/myshift/replyTicket`, requestOptions).then(handleResponse);
}
function createTicket(fromData,post) {
    const object3 = {...fromData, ...post }
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(object3)
    };

    return fetch(`${config.apiUrl}/secureApi/myshift/createTicket`, requestOptions).then(handleResponse);
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