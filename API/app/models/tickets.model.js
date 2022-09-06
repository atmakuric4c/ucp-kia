var db = require('../../config/database');
var dbFunc = require('../../config/db-function');
const helper=require('../../helpers/common_helper');
const dbHandler= require('../../config/api_db_handler');
const dateFormat = require("dateformat");
const axios = require('axios');
const in_array = require('in_array');
const array_unique = require('array-unique');
const querystring = require('querystring');
const config=require('../../config/constants');
const { arraydecode } = require('../../helpers/common_helper');

function getTicketFormData(clientid,callback) {
    new Promise((resolve,reject) => {
    	db.query(`SELECT * from c4_clients where id=${clientid} limit 1`,(clientError,clientDetails,clientFields)=>{
            if(!!clientError) {
                dbFunc.connectionRelease;
                resolve([]);
            } else {
                dbFunc.connectionRelease;
                db.query(`SELECT issue_type from c4_support_issue_types where record_status=1 order by sort_order asc`,async (error,rows,fields)=>{
		            if(!!error) {
		                dbFunc.connectionRelease;
		                resolve([]);
		            } else {
		                dbFunc.connectionRelease;
//		                let priorities=config.PRIORITIES;
//		                let response={issue_type:rows,priorities:priorities,vms:[]}
		                
		                let TICKET_TYPE_AND_PRIORITIES= [];
		               
		                if(clientid == config.GOBEAR_CLIENT_ID){
		                	let SERVICE_REQUEST_TICKET_TYPE_AND_PRIORITIES = config.SERVICE_REQUEST_TICKET_TYPE_AND_PRIORITIES;
		                	SERVICE_REQUEST_TICKET_TYPE_AND_PRIORITIES.PRIORITIES = [{id:5104,priority:'TakeYourTime'},{id:5097,priority:'Prompt'},{id:5083,priority:'Urgent'}];
		                	TICKET_TYPE_AND_PRIORITIES.push(SERVICE_REQUEST_TICKET_TYPE_AND_PRIORITIES);
		                }
		                else {
		                    TICKET_TYPE_AND_PRIORITIES.push(config.DEFAULT_TICKET_TYPE_AND_PRIORITIES);
		                }
		                let response={issue_type:rows,TICKET_TYPE_AND_PRIORITIES:TICKET_TYPE_AND_PRIORITIES,vms:[]}
		                if(clientid == config.GOBEAR_CLIENT_ID){
		                	response = Object.assign({}, response, { 
		                		GobearIssueType: [
		                			{val:'Database/Data Pipelines'}, 
		                			{val:'Not working or slow'}, 
		                			{val:'Access request'},
		                			{val:'Deployment related'},
		                			{val:'Query/Clarification'},
		                			{val:'Configuration/setup'}, 
		                			{val:'Troubleshooting'},
		                			{val:'Misc'}
									],
								Category:[
									{val:'Dev'},
									{val:'UAT'},
									{val:'STG'},
									{val:'Prod'},
									{val:'N.A'}
									],
								RequestorDivision : [
									{val:'Tech'},
									{val:'Product'},
									{val:'Growth'},
									{val:'Strategy'},
									{val:'Finance'},
									{val:'PeopleOps'},
									{val:'Lending'}
									],
								BusinessUnit :[
									{val:'SuperMarket'},
									{val:'Insurance'},
									{val:'Lending'},
									{val:'Others'}
								]
		                	});
		                }
		                if(clientDetails[0].kayako_organization_id != ''){
		                	await new Promise(function(categoryResolve,categoryReject){
		                		let requestUrl = config.MYSHIFT_API_DOMAIN+'index.php/api/admin_form/getCategory?org_id='+clientDetails[0].kayako_organization_id;
		                        axios.get(requestUrl)
		                         .then(async categoryResponse => {
		                        	 if(categoryResponse.data){
			                        	 console.log("categoryResponse.data");
			                        	 console.log(categoryResponse.data);
		                        	 }
		                             if(categoryResponse.data && categoryResponse.data.data && categoryResponse.data.data.status && categoryResponse.data.data.status == 'success'){
		                            	 response.Category = [];
		                            	 for await(var val of categoryResponse.data.data.data){
		                            		 response.Category.push({val:val.category});
		                            	 }
		                            	 categoryResolve(categoryResponse.data.data.data)
		                             }else {
		                            	 categoryResolve(categoryResponse.data)
		                             }
		                         })
		                         .catch(error => {
		                        	 categoryResolve([])
		                         })
	                	    });
		                	
		                	await new Promise(function(issuetypeResolve,issuetypeReject){
		                		let requestUrl = config.MYSHIFT_API_DOMAIN+'index.php/api/admin_form/getIssuetype?org_id='+clientDetails[0].kayako_organization_id;
		                        axios.get(requestUrl)
		                         .then(async issuetypeResponse => {
		                        	 if(issuetypeResponse.data){
			                        	 console.log("issuetypeResponse.data");
			                        	 console.log(issuetypeResponse.data);
		                        	 }
		                             if(issuetypeResponse.data && issuetypeResponse.data.data && issuetypeResponse.data.data.status && issuetypeResponse.data.data.status == 'success'){
		                            	 response.issue_type = [];
		                            	 for await(var val of issuetypeResponse.data.data.data){
		                            		 response.issue_type.push({issue_type:val.issuetype});
		                            	 }
		                            	 
		                            	 response.GobearIssueType = [];
		                            	 for await(var val of issuetypeResponse.data.data.data){
		                            		 response.GobearIssueType.push({val:val.issuetype});
		                            	 }
		                            	 
		                            	 issuetypeResolve(issuetypeResponse.data.data.data)
		                             }else {
		                            	 issuetypeResolve(issuetypeResponse.data)
		                             }
		                         })
		                         .catch(error => {
		                        	 issuetypeResolve([])
		                         })
	                	    });
		                	
		                	await new Promise(function(RequestorDivisionResolve,RequestorDivisionReject){
		                		let requestUrl = config.MYSHIFT_API_DOMAIN+'index.php/api/admin_form/getReqDivision?org_id='+clientDetails[0].kayako_organization_id;
		                        axios.get(requestUrl)
		                         .then(async RequestorDivisionResponse => {
		                        	 if(RequestorDivisionResponse.data){
			                        	 console.log("RequestorDivisionResponse.data");
			                        	 console.log(RequestorDivisionResponse.data);
		                        	 }
		                             if(RequestorDivisionResponse.data && RequestorDivisionResponse.data.data && RequestorDivisionResponse.data.data.status && RequestorDivisionResponse.data.data.status == 'success'){
		                            	 response.RequestorDivision = [];
		                            	 for await(var val of RequestorDivisionResponse.data.data.data){
		                            		 response.RequestorDivision.push({val:val.req_division});
		                            	 }
		                            	 
		                            	 RequestorDivisionResolve(RequestorDivisionResponse.data.data.data)
		                             }else {
		                            	 RequestorDivisionResolve(RequestorDivisionResponse.data)
		                             }
		                         })
		                         .catch(error => {
		                        	 RequestorDivisionResolve([])
		                         })
	                	    });
		                	
		                	await new Promise(function(BusinessUnitResolve,BusinessUnitReject){
		                		let requestUrl = config.MYSHIFT_API_DOMAIN+'index.php/api/admin_form/getBuUnit?org_id='+clientDetails[0].kayako_organization_id;
		                        axios.get(requestUrl)
		                         .then(async BusinessUnitResponse => {
		                        	 if(BusinessUnitResponse.data){
			                        	 console.log("BusinessUnitResponse.data");
			                        	 console.log(BusinessUnitResponse.data);
		                        	 }
		                             if(BusinessUnitResponse.data && BusinessUnitResponse.data.data && BusinessUnitResponse.data.data.status && BusinessUnitResponse.data.data.status == 'success'){
		                            	 response.BusinessUnit = [];
		                            	 for await(var val of BusinessUnitResponse.data.data.data){
		                            		 response.BusinessUnit.push({val:val.bu_unit});
		                            	 }
		                            	 
		                            	 BusinessUnitResolve(BusinessUnitResponse.data.data.data)
		                             }else {
		                            	 BusinessUnitResolve(BusinessUnitResponse.data)
		                             }
		                         })
		                         .catch(error => {
		                        	 BusinessUnitResolve([])
		                         })
	                	    });
		                	
		                	await new Promise(function(TicketTypeResolve,TicketTypeReject){
		                		let requestUrl = config.MYSHIFT_API_DOMAIN+'index.php/api/admin_form/getTicketType?org_id='+clientDetails[0].kayako_organization_id;
		                        axios.get(requestUrl)
		                         .then(async TicketTypeResponse => {
		                        	 if(TicketTypeResponse.data){
			                        	 console.log("TicketTypeResponse.data");
			                        	 console.log(TicketTypeResponse.data);
		                        	 }
		                             if(TicketTypeResponse.data && TicketTypeResponse.data.data && TicketTypeResponse.data.data.status && TicketTypeResponse.data.data.status == 'success'){
		                            	 response.TICKET_TYPE_AND_PRIORITIES = [];
		                            	 for await(var TicketTypeVal of TicketTypeResponse.data.data.data){
		                            		 let TICKET_TYPE_AND_PRIORITY = {
		                            				 TICKET_TYPE_ID: TicketTypeVal.ticket_type_id,
		                            			     TICKET_TYPE_NAME: TicketTypeVal.typetittle,
		                            			     PRIORITIES: []
		                            		 };
		                            		 await new Promise(function(PriorityResolve,PriorityReject){
		         		                		let requestUrl = config.MYSHIFT_API_DOMAIN+'index.php/api/admin_form/getPriority?org_id='+clientDetails[0].kayako_organization_id+'&ticekt_type_id='+TicketTypeVal.ticket_type_id;
		         		                        axios.get(requestUrl)
		         		                         .then(async PriorityResponse => {
		         		                        	 if(PriorityResponse.data){
		         			                        	 console.log("PriorityResponse.data");
		         			                        	 console.log(PriorityResponse.data);
		         		                        	 }
		         		                             if(PriorityResponse.data && PriorityResponse.data.data && PriorityResponse.data.data.status && PriorityResponse.data.data.status == 'success'){
		         		                            	 for await(var val of PriorityResponse.data.data.data){
		         		                            		TICKET_TYPE_AND_PRIORITY.PRIORITIES.push({id:val.priority_id,priority:val.prioritytitle});
		         		                            	 }
		         		                            	 
		         		                            	 PriorityResolve(PriorityResponse.data.data.data)
		         		                             }else {
		         		                            	 PriorityResolve(PriorityResponse.data)
		         		                             }
		         		                         })
		         		                         .catch(error => {
		         		                        	 PriorityResolve([])
		         		                         })
		         	                	    });
		                            		 
		                            		 response.TICKET_TYPE_AND_PRIORITIES.push(TICKET_TYPE_AND_PRIORITY);
		                            	 }
		                            	 
		                            	 TicketTypeResolve(TicketTypeResponse.data.data.data)
		                             }else {
		                            	 TicketTypeResolve(TicketTypeResponse.data)
		                             }
		                         })
		                         .catch(error => {
		                        	 TicketTypeResolve([])
		                         })
	                	    });
		                }
		                console.log("response");
                   	 	console.log(response);
		                resolve(response);
		            }
		        });
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
		var configuration = {
			headers: {'auth-key': config.AUTHKEY3}
		};
	  return axios.get(requestUrl,configuration)
         //  return axios.get(requestUrl)
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
// function getAllTickets(clientid,callback) {
//     new Promise((resolve,reject) => {
//         db.query(`SELECT kayako_organization_id FROM c4_clients WHERE id=${clientid}`,(error,rows,fields)=>{
//             if(!!error) {
//                 dbFunc.connectionRelease;
//                 reject(error);
//             } else {
//                 dbFunc.connectionRelease;
//                 resolve(rows[0]);
//             }
//        });
//     }).then(function(result){
//         if(!days)var days=1;
//         var orgid=result.kayako_organization_id;
//         if(!orgid)callback(null,[])
//         var requestUrl = `${config.TICKETLIST}&orgid=${orgid}&days=${days}`;//100245
//         return axios.get(requestUrl)
//             .then(response => {
//                 //console.log(response.data.result)
//                 if(response.data.result)
//                 callback(null,response.data.result)
//                 else callback(null,[])
//             })
//             .catch(error => {
//                 callback(null,[])
//             })
//     })
// }
function getAllMyTickets(clientid,callback) {
    if(!clientid)return callback(null,{success:0,message:"Please provide the clientid"})
    var sql=`SELECT email as email FROM c4_client_users WHERE clientid=${clientid} and status=1`;
    new Promise((resolve,reject) => {
        db.query(sql,async (error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                resolve("");
            } else {
                dbFunc.connectionRelease;
                let emails  = [];
                for await(var val of rows){
                	emails.push(val.email);
                }
                console.log("emails");
                console.log(emails);
                resolve(emails.join());
            }
       });
    }).then(function(emails){
        if(!emails || emails == ''){
        	return callback(null,[])
        }
//        console.log(emails)
        var requestUrl = `${config.CLIENTTICKET}${emails}`;
//        console.log("requestUrl");
//        console.log(requestUrl);
        return axios.get(requestUrl)
            .then(response => {
                //console.log(response.data.Ticketdetails)
                if(response.data.Ticketdetails){
                	return callback(null,response.data.Ticketdetails)
                }else {
                	return callback(null,[])
                }
            })
            .catch(error => {
                //console.log(error)
            	return callback(null,[])
            })
    })
}
function getPriorityTicketList(reqBody,callback) {
    if(!reqBody.clientid)return callback(null,{success:0,message:"Please provide the clientid"})
    if(!reqBody.from_date)return callback(null,{success:0,message:"Please provide the from date"})
    if(!reqBody.to_date)return callback(null,{success:0,message:"Please provide the to date"})
    if(!reqBody.user_id)return callback(null,{success:0,message:"Please provide the user id"})
    if(!reqBody.role_type)return callback(null,{success:0,message:"Please provide the role type"})
    new Promise((resolve,reject) => {
        if(reqBody.role_type=='1'){
        	var sql=`SELECT email FROM c4_client_users WHERE clientid=${reqBody.clientid} and status=1`;
        }else{
        	var sql=`SELECT email FROM c4_client_users WHERE id=${reqBody.user_id} and clientid=${reqBody.clientid} and status=1`;
        }
        db.query(sql,async (error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                resolve("");
            } else {
                dbFunc.connectionRelease;
                let emails  = [];
                for await(var val of rows){
                	emails.push(val.email);
                }
                console.log("emails");
                console.log(emails);
                resolve(emails.join());
            }
       });
    }).then(function(emails){
    	if(!emails || emails == ''){
        	return callback(null,[])
        }
        //var requestUrl = `${config.PRIORITY_TICKET}${email}&sdate=${reqBody.from_date}&edate=${reqBody.to_date}`;
        // var configuration = {
        //     headers: {'auth-key': config.AUTHKEY}
        // };
        // return axios.get(requestUrl,configuration)
        //     .then(response => {
        //         if(response.data)
        //         return callback(null,response.data)
        //         else return callback(null,[])
        //     })
        //     .catch(error => {
        //         return callback(null,[])
        //     })
        var requestUrl = `${config.CLIENTTICKET}${emails}&from_date=${reqBody.from_date}&to_date=${reqBody.to_date}`;
        return axios.get(requestUrl)
            .then(async response => {
                if(response.data && response.data.Ticketdetails){
                    var arrValues=response.data.Ticketdetails
                    //var arr={}
                    //var arrValues=[]
                    // var result=await new Promise(async function(res,rej){
                    //     for await(var val of arrValues){
                    //         var values=await new Promise(async function(res1,rej1){
                    //             if(!arr[val.response.data.Ticketdetails])
                    //             arr[val.prioritytitle]=await new Array();
                    //             arr[val.prioritytitle][await arr[val.prioritytitle].length]=await val.ticketstatustitle
                    //             res1(arr[val.prioritytitle])
                    //          })
                    //          if(values)
                    //          await arrValues.push(values)
                    //     }
                    //     res(arrValues)
                    // })
                    return callback(null,arrValues)
                }
                else return callback(null,[])
            })
            .catch(error => {
                return callback(null,[])
            })
    })
}
let getWeeklySlaApiList=(reqBody,callback)=>{
    if(!reqBody.clientid)return callback(null,{success:0,message:"Please provide the clientid"})
    if(!reqBody.from_date)return callback(null,{success:0,message:"Please provide the from date"})
    if(!reqBody.to_date)return callback(null,{success:0,message:"Please provide the to date"})
    new Promise((resolve,reject) => {
        db.query(`SELECT GROUP_CONCAT(email) as email FROM c4_client_users WHERE clientid=${reqBody.clientid} and status=1`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows[0]);
            }
       });
    }).then(async function(result){
        if(!result)callback(null,[])
        var email=result.email;
        var requestUrl = `${config.KFINTECH_SLATICKET}sdate=${reqBody.from_date}&edate=${reqBody.to_date}`;
        var configuration = {
            headers: {'auth-key': config.AUTHKEY}
        };
        await axios.get(requestUrl,configuration)
            .then(async response => {
                if(response.data && response.data.data){
                    return callback(null,response.data.data)
                    // var firstreplymet= await new Promise(async function(res1,rej1){
                    //     var typetittle_records={}
                    //     for await(var val of response.data.data.data){
                    //         try{
                    //             if(!typetittle_records[val.typetittle_records])
                    //             typetittle_records[val.typetittle_records]=new Array();
                    //             if(val.firstreplymet){
                    //                 typetittle_records[val.typetittle_records][typetittle_records[val.typetittle_records].length]=await val.firstreplymet;
                    //                 //typetittle_records[val.typetittle_records]=await array_unique(typetittle_records[val.typetittle_records]);
                    //             }
                    //         }catch(e){

                    //         }
                    //     }//for loop
                    //     res1({result:typetittle_records})
                    // })//promise block
                    // return callback(null,firstreplymet) 
                }
                else return callback(null,[])
            })
            .catch(error => {
                return callback(null,[])
            })
    })
}

function getTicketTypeList(clientid, callback) {
    new Promise((resolve,reject) => {
    	db.query(`SELECT * from c4_clients where id=${clientid} limit 1`,async (clientError,clientDetails,clientFields)=>{
            if(!!clientError) {
                dbFunc.connectionRelease;
                resolve([]);
            } else {
                dbFunc.connectionRelease;
		    	let TICKET_TYPE_AND_PRIORITIES= [];
		        TICKET_TYPE_AND_PRIORITIES.push(config.DEFAULT_TICKET_TYPE_AND_PRIORITIES);
		    	TICKET_TYPE_AND_PRIORITIES.push(config.SERVICE_REQUEST_TICKET_TYPE_AND_PRIORITIES);
		    	
		    	if(clientDetails[0].kayako_organization_id != ''){
		    		await new Promise(function(TicketTypeResolve,TicketTypeReject){
                		let requestUrl = config.MYSHIFT_API_DOMAIN+'index.php/api/admin_form/getTicketType?org_id='+clientDetails[0].kayako_organization_id;
                        axios.get(requestUrl)
                         .then(async TicketTypeResponse => {
                        	 if(TicketTypeResponse.data){
	                        	 console.log("TicketTypeResponse.data");
	                        	 console.log(TicketTypeResponse.data);
                        	 }
                             if(TicketTypeResponse.data && TicketTypeResponse.data.data && TicketTypeResponse.data.data.status && TicketTypeResponse.data.data.status == 'success'){
                            	 TICKET_TYPE_AND_PRIORITIES = [];
                            	 for await(var TicketTypeVal of TicketTypeResponse.data.data.data){
                            		 let TICKET_TYPE_AND_PRIORITY = {
                            				 TICKET_TYPE_ID: TicketTypeVal.ticket_type_id,
                            			     TICKET_TYPE_NAME: TicketTypeVal.typetittle,
                            			     PRIORITIES: []
                            		 };
                            		 await new Promise(function(PriorityResolve,PriorityReject){
         		                		let requestUrl = config.MYSHIFT_API_DOMAIN+'index.php/api/admin_form/getPriority?org_id='+clientDetails[0].kayako_organization_id+'&ticekt_type_id='+TicketTypeVal.ticket_type_id;
         		                        axios.get(requestUrl)
         		                         .then(async PriorityResponse => {
         		                        	 if(PriorityResponse.data){
         			                        	 console.log("PriorityResponse.data");
         			                        	 console.log(PriorityResponse.data);
         		                        	 }
         		                             if(PriorityResponse.data && PriorityResponse.data.data && PriorityResponse.data.data.status && PriorityResponse.data.data.status == 'success'){
         		                            	 for await(var val of PriorityResponse.data.data.data){
         		                            		TICKET_TYPE_AND_PRIORITY.PRIORITIES.push({id:val.priority_id,priority:val.prioritytitle});
         		                            	 }
         		                            	 
         		                            	 PriorityResolve(PriorityResponse.data.data.data)
         		                             }else {
         		                            	 PriorityResolve(PriorityResponse.data)
         		                             }
         		                         })
         		                         .catch(error => {
         		                        	 PriorityResolve([])
         		                         })
         	                	    });
                            		 
                            		 TICKET_TYPE_AND_PRIORITIES.push(TICKET_TYPE_AND_PRIORITY);
                            	 }
                            	 
                            	 TicketTypeResolve(TicketTypeResponse.data.data.data)
                             }else {
                            	 TicketTypeResolve(TicketTypeResponse.data)
                             }
                         })
                         .catch(error => {
                        	 TicketTypeResolve([])
                         })
            	    });
		    	}
		    	return callback(null,TICKET_TYPE_AND_PRIORITIES);
            }
    	});
//        var requestUrl = `${config.TICKET_TYPE_LIST}`;
//        var configuration = {
//            headers: {'auth-key': config.AUTHKEY2}
//        };
//        return axios.post(requestUrl,configuration)
//            .then(response => {
//                if(response.data)
//                return callback(null,response.data)
//                else return callback(null,[])
//            })
//            .catch(error => {
//                return callback(null,[])
//            })
    })
}

function getAllMyTicketList(reqObj,callback) {
    if(!reqObj.clientid)
        return callback(1,{success:0,message:"Please provide the clientid"});
    if(!reqObj.user_id)
        return callback(1,{success:0,message:"Please provide the userid"});
    if(!reqObj.from_date)
        return callback(1,{success:0,message:"Please provide the from date"});
    if(!reqObj.to_date)
        return callback(1,{success:0,message:"Please provide the to date"});
    if(!reqObj.role_type)
        return callback(1,{success:0,message:"Please provide the role type"});
    var clientid=reqObj.clientid;
    var from_date=reqObj.from_date;
    var to_date=reqObj.to_date;
    new Promise((resolve,reject) => {
        if(reqObj.role_type=='1')
        var sql=`SELECT email FROM c4_client_users WHERE clientid=${reqObj.clientid} and status=1`;
        else
        var sql=`SELECT email FROM c4_client_users WHERE id=${reqObj.user_id} and clientid=${reqObj.clientid} and status=1`;
        db.query(sql,async (error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                resolve("");
            } else {
                dbFunc.connectionRelease;
                let emails  = [];
                for await(var val of rows){
                	emails.push(val.email);
                }
//                console.log("emails");
//                console.log(emails);
                resolve(emails.join());
            }
       });
    }).then(function(emails){
        if(!emails && emails == ''){
        	return callback(null,[])
        }
        var requestUrl = `${config.CLIENTTICKET}${emails}&from_date=${from_date}&to_date=${to_date}`;
        return axios.get(requestUrl)
            .then(response => {
                if(response.data.Ticketdetails)
                return callback(null,response.data.Ticketdetails)
                else return callback(null,[])
            })
            .catch(error => {
                return callback(null,[])
            })
    })
}
function getAllAlertTicketList(reqObj,callback) {
    if(!reqObj.clientid)
        return callback(1,[]);
    var clientid=reqObj.clientid;
	dbHandler.getOneRecord('c4_clients',{id:clientid},function(clientInfo){
		if(clientInfo && clientInfo.kayako_organization_id){
			var requestUrl = `${config.KFINTECH_ALERT}${clientInfo.kayako_organization_id}`;
			var configuration = {
				headers: {'auth-key': config.AUTHKEY}
			};
			return axios.get(requestUrl,configuration)
			.then(async response => {
				var alerts = []
				if(response.data && response.data.data && response.data.data.data){
					for await(var alert of response.data.data.data){
						await alerts.push(alert)
					}
					//console.log(alerts)
					return callback(null,alerts)
				}
				else return callback(null,[])
			})
			.catch(error => {
				return callback(null,[])
			})
		}else{
			return callback(1,[]);
		}
	})
	
	
}

function replyTicket(reqObj) {
    return new Promise((resolve,reject) => {
    var requestUrl = config.TICKETREPLY;
        var configuration = {
            headers: {'auth-key': config.AUTHKEY}
        };
        //console.log(reqObj)
        if (reqObj && reqObj.files!='') {	
            reqObj.crattachment =JSON.stringify(reqObj.files)
        }
        //var reqObj={'rfcno':'TSK54984382','to_email':'pradeepkumar.p@ctrls.in','fromemail':'haritha@ctrls.in','content_email':'reply test message'};
        //console.log(reqObj)
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
	if(!reqObj.clientid && reqObj.clientid == ''){
        var return_result={message:'clientid is missing',success:false};
        console.log(return_result);
        return callback(return_result);
	}
    new Promise((resolve,reject) => {
    	db.query(`SELECT * from c4_clients where id=${reqObj.clientid} limit 1`,async (clientError,clientDetails,clientFields)=>{
    		dbFunc.connectionRelease;
    		if(!!clientError) {
    			var return_result={message:'The operation did not execute as expected. Please raise a ticket to support',success:false};
    	        console.log(return_result);
    	        return callback(return_result);
    	        resolve(return_result);
            } else if(clientDetails.length == 0){
            	var return_result={message:'Invalid client',success:false};
    	        console.log(return_result);
    	        return callback(return_result);
    	        resolve(return_result);
            }else{
		        var message = reqObj.description;
		        
		        let DEPARTMENT_ID = clientDetails[0].kayako_department_id;
		        if(reqObj.clientid == config.VODAFONE_CLIENT_ID){
//		    		DEPARTMENT_ID = config.VODAFONE_DEPARTMENT_ID;
		        }else if(reqObj.clientid == config.GOBEAR_CLIENT_ID){
//		    		DEPARTMENT_ID = config.GOBEAR_DEPARTMENT_ID;
		        }else if(typeof config.COMPANY_ENTITIES[reqObj.company_entity] != 'undefined'){
//		        	if(config.COMPANY_ENTITIES[reqObj.company_entity] == 1){
//		        		DEPARTMENT_ID = config.DEPARTMENT_ID;
//		        	}else{
//		        		DEPARTMENT_ID = config.CTRLS_DEPARTMENT_ID;
//		        	}
		        	message = `<b>Cloud4C : Issue Type : </b>${reqObj.issue_type}:<br/><br/><br/>${message}<br /><br /><br />
		                <br /><br /><br />Virtual Instance : ${reqObj.instance}`;
		        }else{
//		        	DEPARTMENT_ID = config.DEPARTMENT_ID;
		        	message = `<b>Cloud4C : Issue Type : </b>${reqObj.issue_type}:<br/><br/><br/>${message}<br /><br /><br />
		                <br /><br /><br />Virtual Instance : ${reqObj.instance}`;
		        }
		        
		        let ticketPost={
		            department_id:DEPARTMENT_ID,
		            type:config.TICKET_TYPE,
		//            tickettypeid:config.TICKETTYPEID,
		            tickettypeid:reqObj.TICKETTYPEID,
		            priority:reqObj.priority,
		            subject:reqObj.subject,
		            description:message,
		            user_email:reqObj.user_email
		        }
		        if(reqObj.clientid == config.GOBEAR_CLIENT_ID){
		        	ticketPost.issuetype = reqObj.issuetype;
		        	ticketPost.req_division = reqObj.req_division;
		        	ticketPost.bu_unit = reqObj.bu_unit;
		        	ticketPost.category = reqObj.category;
		        }
		        
//		        console.log(ticketPost);
//		        return callback(ticketPost);
//	            resolve(message);
	            
		        //console.log(ticketPost)
		        var requestUrl =config.TICKETCREATE;
		        var configuration = {
		            headers: {
		            'auth-key': config.AUTHKEY
		            }
		        };
		        if (reqObj && reqObj.files!='') {	
		            ticketPost.attachment =JSON.stringify(reqObj.files)
		        }
		        console.log(ticketPost);
		//        return callback("");
		//        console.log(querystring.stringify(ticketPost));
		        await axios.post(requestUrl,querystring.stringify(ticketPost),configuration)
		        .then(response => {
		            console.log(response.data);
		//            console.log(response.data.data);
		//            console.log(response.data.data.status);
		//            console.log(response.data.data.error_msg);
		            if(response.data && response.data.data && response.data.data.status && response.data.data.status == 'error'){
		            	let error_msg = '';
		            	if(response.data && response.data.data && response.data.data.error_msg && response.data.data.error_msg != ''){
		            		error_msg = response.data.data.error_msg;
		            	}else{
		            		error_msg = 'The operation did not execute as expected. Please raise a ticket to support';
		            	}
		            	var message={message:error_msg, success:false};
		            	message.requestData = ticketPost;
		            }else{
		            	var message={message:'Your ticket has been created successfully.',success:true};
		            }
		            return callback(message);
		            resolve(message);
		        })
		        .catch(error => {
		            console.log(error)
		            var message={message:'The operation did not execute as expected. Please raise a ticket to support',success:false};
		            return callback(message);
		            resolve(message);
		        })
            }
    	});
    })
}
var menusModel = {
    //getAllTickets:getAllTickets,
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
module.exports = menusModel;

