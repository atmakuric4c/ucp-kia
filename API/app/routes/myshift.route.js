const supportService = require('../services/myshift.service');
var mail = require('../../common/mailer.js');

function init(router) {
    router.route('/myshift/tickets/:clientid').get(getAllTickets);
    router.route('/myshift/mytickets/:clientid').get(getAllMyTickets);
    router.route('/myshift/replyTicket').post(replyTicket);
    router.route('/myshift/ticket_detail/:id').get(ticketDetail);
    router.route('/myshift/createTicket').post(createTicket);
    router.route('/myshift/getTicketFormData/:clientid').get(getTicketFormData);
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
function getTicketFormData(req,res) {
  let clientid=req.params.clientid
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