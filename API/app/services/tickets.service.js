var supportModel = require("../models/tickets.model.js");

let getWeeklySlaApiList=(reqBody,callback)=>{
    supportModel.getWeeklySlaApiList(reqBody,function(err,result){
        return callback(err,result);
    })
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

function getPriorityTicketList(reqBody) {
    return new Promise((resolve,reject) => {
        supportModel.getPriorityTicketList(reqBody,function(err,result){
            resolve(result);
        })
    });
}


function getTicketTypeList(clientid) {
    return new Promise((resolve,reject) => {
        supportModel.getTicketTypeList(clientid, function(err,result){
            resolve(result);
        })
    });
}

function getAllMyTicketList(reqbody) {
    return new Promise((resolve,reject) => {
        supportModel.getAllMyTicketList(reqbody,function(err,result){
            resolve(result);
        })
    });
}
function getAllAlertTicketList(reqbody) {
    return new Promise((resolve,reject) => {
        supportModel.getAllAlertTicketList(reqbody,function(err,result){
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

var menusService = {
    getAllTickets: getAllTickets,
    replyTicket:replyTicket,
    ticketDetail:ticketDetail,
    createTicket:createTicket,
    getTicketFormData:getTicketFormData,
    getAllMyTickets:getAllMyTickets,
    getAllMyTicketList:getAllMyTicketList,
    getAllAlertTicketList:getAllAlertTicketList,
    getPriorityTicketList:getPriorityTicketList,
    getTicketTypeList:getTicketTypeList,
    getWeeklySlaApiList:getWeeklySlaApiList
}
module.exports = menusService;

