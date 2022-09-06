const supportService = require('../services/tickets.service');
var mail = require('../../common/mailer.js');

function init(router) {
    router.route('/tickets/:clientid').get(getAllTickets);
    router.route('/mytickets/:clientid').get(getAllMyTickets);
    router.route('/getAllMyTicketList').post(getAllMyTicketList);
    router.route('/getAllAlertTicketList').post(getAllAlertTicketList);
    router.route('/replyTicket').post(replyTicket);
    router.route('/ticket_detail/:id').get(ticketDetail);
    router.route('/createTicket').post(createTicket);
    router.route('/getTicketFormData/:clientid').get(getTicketFormData);
    router.route('/getPriorityTicketList').post(getPriorityTicketList);
    router.route('/getWeeklySlaApiList').post(getWeeklySlaApiList);
    router.route('/getTicketTypeList/:clientid').get(getTicketTypeList);
}

let getWeeklySlaApiList=(req,res)=>{
  supportService.getWeeklySlaApiList(req.body,function(err,data){
    //console.log(data)
    res.status(200).send(data)
  })
}


function getAllTickets(req,res) {
    var clientid=req.params.clientid
    supportService.getAllTickets(clientid).then((data) => {
      res.send(data);
    }).catch((err) => {    
      res.send([]);
    });
}

function getAllMyTickets(req,res) {
  var clientid=req.params.clientid
  supportService.getAllMyTickets(clientid).then((data) => {
    res.send(data);
  }).catch((err) => {    
    res.send([]);
  });
}
function getAllMyTicketList(req,res) {
  supportService.getAllMyTicketList(req.body).then((data) => {
    res.send(data);
  }).catch((err) => {    
    res.send([]);
  });
}
function getAllAlertTicketList(req,res) {
  supportService.getAllAlertTicketList(req.body).then((data) => {
    res.send(data);
  }).catch((err) => {    
    res.send([]);
  });
}

function getPriorityTicketList(req,res) {
  supportService.getPriorityTicketList(req.body).then((data) => {
    res.send(data);
  }).catch((err) => {    
    res.send([]);
  });
}

function getTicketTypeList(req,res) {
	let clientid=req.params.clientid;
  supportService.getTicketTypeList(clientid).then((data) => {
    res.send(data);
  }).catch((err) => {    
    res.send([]);
  });
}

function getTicketFormData(req,res) {
  let clientid=req.params.clientid;
  supportService.getTicketFormData(clientid).then((data) => {
    res.send(data);
  }).catch((err) => {    
    res.send([]);
  });
}

function ticketDetail(req,res) {
  var ticketid = req.params.id;
  supportService.ticketDetail(ticketid).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send([]);
  });
}

function replyTicket(req,res){
  supportService.replyTicket(req.body).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send([]);
  });
}
function createTicket(req,res){
  supportService.createTicket(req.body).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send([]);
  });
}

module.exports.init = init;