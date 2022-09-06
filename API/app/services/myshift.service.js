var supportModel = require("../models/myshift.model.js");


var menusService = {
    getAllTickets: getAllTickets,
    replyTicket:replyTicket,
    ticketDetail:ticketDetail,
    createTicket:createTicket,
    getTicketFormData:getTicketFormData,
    getAllMyTickets:getAllMyTickets
}

function getAllTickets(clientid) {
    return new Promise((resolve,reject) => {
        supportModel.getAllTickets(clientid,function(err,result){
            resolve(result);
        })
    });
}
function getAllMyTickets(clientid) {
    return new Promise((resolve,reject) => {
        supportModel.getAllMyTickets(clientid,function(err,result){
            resolve(result);
        })
    });
}

function getTicketFormData(clientid) {
    return new Promise((resolve,reject) => {
        supportModel.getTicketFormData(clientid,function(result){
            resolve(result);
        })
    });
}

function ticketDetail(ticketid) {
    return new Promise((resolve,reject) => {
        supportModel.ticketDetail(ticketid).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
}
function replyTicket(reqObj) {
    return new Promise((resolve,reject) => {
        supportModel.replyTicket(reqObj).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}
function createTicket(reqObj) {
    return new Promise((resolve,reject) => {
        supportModel.createTicket(reqObj,function(result){
            resolve(result);
        })
    });
}
module.exports = menusService;

