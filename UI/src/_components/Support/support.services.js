import config from 'config';
import { authHeader,logout } from '../../_helpers';
import Swal from "sweetalert2";

export const supportService = {   
    getAll,getTicketDetail,replyTicket,createTicket,getTicketFormData,getAllMyTicket
};

function getAll(clientid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/tickets/${clientid}`, requestOptions).then(handleResponse);
}
function getAllMyTicket(clientid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/mytickets/${clientid}`, requestOptions).then(handleResponse);
}
function handleResponsePriorityList(response) {
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
        var values=[]
        for(var i=0;i<data.length;i++){
            var val=data[i]
            if(!values[val.prioritytitle])
            values[val.prioritytitle]=new Array();

            if(!values[val.prioritytitle]['Closed'])
            values[val.prioritytitle]['Closed']=new Array();

            if(!values[val.prioritytitle]['Pending'])
            values[val.prioritytitle]['Pending']=new Array();

            if(val.ticketstatustitle=='Closed')
            values[val.prioritytitle]['Closed'][values[val.prioritytitle]['Closed'].length]=val.ticketstatustitle
            else values[val.prioritytitle]['Pending'][values[val.prioritytitle]['Pending'].length]=val.ticketstatustitle
        }       
        return values;
    });
}

function handleResponseSlaList(response) {
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
        var values=[]
        var values2=[]

        for(var i=0;i<data.data.length;i++){
            var val=data.data[i]
            if(!values[val.typetittle_records])
            values[val.typetittle_records]=new Array();

            if(!values[val.typetittle_records]['Yes'])
            values[val.typetittle_records]['Yes']=new Array();

            if(!values[val.typetittle_records]['No'])
            values[val.typetittle_records]['No']=new Array();

            if(val.sla_resolved=='YES')
            values[val.typetittle_records]['Yes'][values[val.typetittle_records]['Yes'].length]='Yes'
            else values[val.typetittle_records]['No'][values[val.typetittle_records]['No'].length]=val.sla_resolved

            if(!values2[val.typetittle_records])
            values2[val.typetittle_records]=new Array();

            if(!values2[val.typetittle_records]['Yes'])
            values2[val.typetittle_records]['Yes']=new Array();

            if(!values2[val.typetittle_records]['No'])
            values2[val.typetittle_records]['No']=new Array();

            if(val.firstreplymet=='YES')
            values2[val.typetittle_records]['Yes'][values2[val.typetittle_records]['Yes'].length]='Yes'
            else values2[val.typetittle_records]['No'][values2[val.typetittle_records]['No'].length]=val.firstreplymet
        }      
        //console.log({sla_resolved:values,firstreplymet:values2}) 
        return {sla_resolved:values,firstreplymet:values2};
    });
}
function getTicketFormData(clientid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureApi/getTicketFormData/${clientid}`, requestOptions).then(handleResponse);
}

function getTicketDetail(ticketid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/ticket_detail/${ticketid}`, requestOptions).then(handleResponse);
}
function replyTicket(frmData, post) {
    const object2 = {...frmData, ...post }
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(object2)
    };

    return fetch(`${config.apiUrl}/secureApi/replyTicket`, requestOptions).then(handleResponse);
}
function createTicket(fromData,post) {
    const object3 = {...fromData, ...post }
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(object3)
    };

    return fetch(`${config.apiUrl}/secureApi/createTicket`, requestOptions).then(handleResponse);
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