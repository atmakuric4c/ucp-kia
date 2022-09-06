var db = require('../../config/database');
var dbFunc = require('../../config/db-function');
const helper=require('../../helpers/common_helper');
const dbHandler= require('../../config/api_db_handler');
const dateFormat = require("dateformat");
const axios = require('axios');
const querystring = require('querystring');
const config=require('../../config/constants')
var menusModel = {
    getAllTickets:getAllTickets,
    replyTicket:replyTicket,
    ticketDetail:ticketDetail,
    createTicket:createTicket,
    getTicketFormData:getTicketFormData,
    getAllMyTickets:getAllMyTickets
}

function getTicketFormData(clientid,callback) {
    new Promise((resolve,reject) => {
        db.query(`SELECT issue_type from c4_support_issue_types where record_status=1 order by sort_order asc`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                resolve([]);
            } else {
                dbFunc.connectionRelease;
                let priorities=config.PRIORITIES;
                let response={issue_type:rows,priorities:priorities,vms:[]}
                resolve(response);
            }
        });
    }).then(async function(result){
        var sql=`select id,label_name from c4_vm_details where status=1 and clientid=${clientid} order by label_name asc`
        await dbHandler.executeQuery(sql,function(rows){
            result.vms=rows;
            callback(result)
        })
    })
}
function ticketDetail(ticketid) {
    return new Promise((resolve,reject) => {
        var requestUrl = config.TICKETDETAIL+''+ticketid;
           return axios.get(requestUrl)
            .then(response => {
                if(response.data)
                resolve(response.data.ticketdetails)
                else resolve(response.data)
            })
            .catch(error => {
                reject([])
            })
    });
}
function getAllTickets(clientid,callback) {
    new Promise((resolve,reject) => {
        db.query(`SELECT kayako_organization_id FROM c4_clients WHERE id=${clientid}`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows[0]);
            }
       });
    }).then(function(result){
        var orgid=result.kayako_organization_id;
        if(!orgid)callback(null,[])
        var requestUrl = `${config.TICKETLIST}&orgid=${orgid}&days=1`;//100245
        return axios.get(requestUrl)
            .then(response => {
                //console.log(response.data.result)
                if(response.data.result)
                callback(null,response.data.result)
                else callback(null,[])
            })
            .catch(error => {
                callback(null,[])
            })
    })
}
function getAllMyTickets(clientid,callback) {
    new Promise((resolve,reject) => {
        db.query(`SELECT GROUP_CONCAT(email) as email FROM c4_client_users WHERE clientid=${clientid} and status=1`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows[0]);
            }
       });
    }).then(function(result){
        if(!result)callback(null,[])
        var email=result.email;
        //console.log(result.email)
        var requestUrl = `${config.CLIENTTICKET}${email}`;
        return axios.get(requestUrl)
            .then(response => {
                //console.log(response.data.Ticketdetails)
                if(response.data.Ticketdetails)
                callback(null,response.data.Ticketdetails)
                else callback(null,[])
            })
            .catch(error => {
                //console.log(error)
                callback(null,[])
            })
    })
}

function replyTicket(reqObj) {
    return new Promise((resolve,reject) => {
    var requestUrl = config.TICKETREPLY;
        var configuration = {
            headers: {'auth-key': config.AUTHKEY}
        };
        //var reqObj={'rfcno':'TSK54984382','to_email':'pradeepkumar.p@ctrls.in','fromemail':'haritha@ctrls.in','content_email':'reply test message'};
        console.log(reqObj)
        return axios.post(requestUrl,querystring.stringify(reqObj),configuration)
        .then(response => {
            console.log(response.data)
            var message={message:'Your reply post submitted successfully.',success:true};
            resolve(message)
        })
        .catch(error => {
            console.log(error)
            var message={message:'The operation did not execute as expected. Please raise a ticket to support',success:false};
            reject(message)
        })
    });
}
function createTicket(reqObj,callback) {
    new Promise((resolve,reject) => {
        var message = reqObj.description;
        message = `<b>Ctrl4C : Issue Type : </b>${reqObj.issue_type}:<br/><br/><br/>${message}<br /><br /><br />
        <br /><br /><br />Virtual Instance : ${reqObj.instance}`;
        let ticketPost={
            department_id:config.DEPARTMENT_ID,
            type:config.TICKET_TYPE,
            tickettypeid:config.TICKETTYPEID,
            priority:reqObj.priority,
            subject:reqObj.subject,
            description:message,
            user_email:reqObj.user_email
        }
        resolve(ticketPost)
    }).then(function(ticketPost){
        //console.log(ticketPost)
        var requestUrl =config.TICKETCREATE;
        var configuration = {
            headers: {'auth-key': config.AUTHKEY}
        };
        axios.post(requestUrl,querystring.stringify(ticketPost),configuration)
        .then(response => {
            console.log(response.data)
            var message={message:'Your ticket has been created successfully.',success:true};
            callback(message)
        })
        .catch(error => {
            console.log(error)
            var message={message:'The operation did not execute as expected. Please raise a ticket to support',success:false};
            callback(message)
        })
    })
}

module.exports = menusModel;

