var db = require('../../config/database');
var dbFunc = require('../../config/db-function');
const dbHandler= require('../../config/api_db_handler');
const helper=require('../../helpers/common_helper');
var md5 = require('md5');
const dateFormat = require("dateformat");
var base64 = require('base-64');
const config=require('../../config/constants')
var pdf = require('html-pdf');
var path = require('path');
const ucpEncryptDecrypt=require('../../config/ucpEncryptDecrypt');

let getOrderList= async (reqObj,callback)=>{
    let clientid = base64.decode(reqObj.params.id); 
    console.log(clientid);
    return new Promise(async function(resolve,reject) {
        let orderSql = `select c4_orders.order_number,c4_order_details.*, 
        c4_vm_details.id as vm_id,
        c4_vm_details.host_name as vm_host_name,
        c4_vm_details.label_name as vm_label_name,
        c4_vm_details.primary_ip as vm_primary_ip,
        c4_vm_details.status as vm_status,
        c4_vm_details.cpu_units as vm_cpu_units,
        c4_vm_details.ram_units_gb as vm_ram_units_gb,
        c4_vm_details.disk_units_gb as vm_disk_units_gb,
        c4_other_vm_details.id as other_id,
        c4_other_vm_details.host_name as other_host_name,
        c4_other_vm_details.label_name as other_label_name,
        c4_other_vm_details.primary_ip as other_primary_ip,
        c4_other_vm_details.status as other_status,
        c4_other_vm_details.cpus as other_cpus,
        c4_other_vm_details.ram_gb as other_ram_gb,
        c4_other_vm_details.disk_gb as other_disk_gb
        from c4_orders 
        INNER JOIN c4_order_details ON c4_orders.id=c4_order_details.order_id 
        left join c4_vm_details on c4_vm_details.order_details_id = c4_order_details.id
        left join c4_other_vm_details on c4_other_vm_details.serviceid = c4_order_details.id
        where  c4_orders.clientid='${clientid}' and c4_order_details.status=1
        order by c4_orders.id DESC`;
        console.log(orderSql);
        db.query(orderSql,async function(error,orderList,fields){
            if(!!error) {
                dbFunc.connectionRelease;
                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                if (orderList.length > 0) {
                    let key = 0;
                    for await (var val of orderList) {
                        
                        await new Promise(async function(innerResolve, innerReject) {
                            // console.log(key);
                            if (val.status==0){ 
                                orderList[key].status="Terminated";
                            }else if (val.status==2){ 
                                orderList[key].status="Pending";
                            }else{
                                orderList[key].status="Active";
                            }
                            // console.log(val.id+" 1111111111111 "+key);

                            if (val.order_type=="CLOUD" 
                            	|| val.order_type=="AZURE" 
                        		|| val.order_type=="AWS" 
                    			|| val.order_type=="GCP"){
                                if (val.vm_id) {
                                    cpus=val.vm_cpu_units;
                                    //print_r(val.vm_label_name);
                                    let config = 'Label Name : '+val.vm_label_name;
                                    config += "<br/>vCPU's : "+val.vm_cpu_units;
                                    config +='<br/> RAM : '+val.vm_ram_units_gb+' GB';
                                    config +='<br/> HDD : '+val.vm_disk_units_gb+' GB';
                                    orderList[key].info=config;
                            
                                    if (val.order_type=="CLOUD" && val.billing_frequency=="HOURLY"){
                                        price = (val.vm_ram_units_gb*val.ram_cost)+(val.vm_disk_units_gb* val.disk_on_cost)+(val.vm_cpu_units*val.cpu_cost)+ val.base_price+val.os_cost;
                                    }else if (val.order_type=="CLOUD" && val.billing_frequency=="MONTHLY"){
                                        price =val.base_price+val.mrc_price;
                                    }else{
                                        price =val.base_price+val.mrc_price;
                                    }
                                    orderList[key].price = price;
                                }else{
                                    if (val.billing_frequency=="MONTHLY"){
                                        price =val.base_price+val.mrc_price;
                                    }else{
                                        price =val.base_price+val.mrc_price;
                                    }
                                    orderList[key].price = price;
                                }

                                key++;
                                innerResolve("Done");

                                // await dbHandler.executeQuery(`SELECT c4_vm_details.id,
                                // c4_vm_details.host_name,
                                // c4_vm_details.label_name,
                                // c4_vm_details.primary_ip,
                                // c4_vm_details.status,
                                // c4_vm_details.cpu_units,
                                // c4_vm_details.ram_units_gb,
                                // c4_vm_details.disk_units_gb
                                // FROM c4_vm_details
                                // WHERE c4_vm_details.order_details_id = '${val.id}'`,async function(vminfolist){
                                //         dbFunc.connectionRelease;
                                //         // console.log("vminfolist");
                                //         // console.log(vminfolist);
                                //         if (vminfolist.length > 0) {
                                //             cpus=vminfolist[0].cpu_units;
                                //             //print_r(vminfolist[0].label_name);
                                //             let config = 'Label Name : '+vminfolist[0].label_name;
                                //             config += "<br/>vCPU's : "+vminfolist[0].cpu_units;
                                //             config +='<br/> RAM : '+vminfolist[0].ram_units_gb+' GB';
                                //             config +='<br/> HDD : '+vminfolist[0].disk_units_gb+' GB';
                                //             orderList[key].info=config;
                                    
                                //             if (val.billing_frequency=="HOURLY"){
                                //                 price = (vminfolist[0].ram_units_gb*val.ram_cost)+(vminfolist[0].disk_units_gb* val.disk_on_cost)+(vminfolist[0].cpu_units*val.cpu_cost)+ val.base_price+val.os_cost;
                                //             }else if (val.billing_frequency=="MONTHLY"){
                                //                 price =val.base_price+val.mrc_price;
                                //             }else{
                                //                 price =val.base_price+val.mrc_price;
                                //             }
                                //             orderList[key].price = price;
                                //         }else{
                                //             if (val.billing_frequency=="MONTHLY"){
                                //                 price =val.base_price+val.mrc_price;
                                //             }else{
                                //                 price =val.base_price+val.mrc_price;
                                //             }
                                //             orderList[key].price = price;
                                //         }
                                //     // }

                                //     key++;
                                //     innerResolve("Done");
                                // });

                            }else if ((val.order_type=="OVM") || (val.order_type=="DEDICATED")){
                                let config = '';
                                if (val.other_id) {
                                    config = 'Label Name : '+val.other_label_name;
                                }
                                orderList[key].price = val.mrc_price;
                                orderList[key].info = config+"<br />"+val.description;

                                key++;
                                innerResolve("Done");

                                // await dbHandler.executeQuery(`SELECT c4_other_vm_details.id,
                                // c4_other_vm_details.host_name,
                                // c4_other_vm_details.label_name,
                                // c4_other_vm_details.primary_ip,
                                // c4_other_vm_details.status,
                                // c4_other_vm_details.cpus,
                                // c4_other_vm_details.ram_gb,
                                // c4_other_vm_details.disk_gb
                                // FROM c4_other_vm_details					
                                // WHERE c4_other_vm_details.serviceid = '${val.id}'`,async function(ovminfolist){
                                //     dbFunc.connectionRelease;
                                //         // console.log("ovminfolist");
                                //         // console.log(ovminfolist);
                                //         let config = '';
                                //         if (ovminfolist.length > 0) {
                                //             config = 'Label Name : '+ovminfolist[0].label_name;
                                //         }
                                //         orderList[key].price = val.mrc_price;
                                //         orderList[key].info = config+"<br />"+val.description;
                                //     // }

                                //     key++;
                                //     innerResolve("Done");
                                // });
                            }else{
                                orderList[key].price = val.mrc_price;
                                orderList[key].info = val.description;

                                key++;
                                innerResolve("Done");
                            }

                            
                        });
                    }

                    // console.log("orderListttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt");
                    callback(null,orderList);
                    resolve(orderList);
                }else{
                    callback(null,[]);
                    resolve({"message":"No records found"});
                }
            }
       });
    });
}

let getInvoiceList= async (reqObj,callback)=>{
	let clientid = base64.decode(reqObj.params.id); 
    console.log(clientid);
    return new Promise(async function(resolve,reject) {
        let invSql = `select SQL_CALC_FOUND_ROWS tds_amount,tds_percent,payable_amount,
        c4_client_invoices.inv_id as id,inv_amount,inv_display_id,invoice_type,
        twoc_invoice_id,inv_status,balance_amount,record_status,
        DATE_FORMAT(inv_date, "%d-%m-%Y") as inv_date,DATE_FORMAT(inv_due_date,"%d-%m-%Y") as inv_due_date,
        inv_path
        from c4_client_invoices
        where  c4_client_invoices.clientid = '${clientid}' and c4_client_invoices.inv_status in ('PAID','UNPAID') and c4_client_invoices.invoice_type = 'CURRENT'
        order by c4_client_invoices.inv_id DESC`;
        console.log(invSql);
        db.query(invSql,async function(error,invList,fields){
            if(!!error) {
                dbFunc.connectionRelease;
                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                let dueSql = `select sum(balance_amount) as total_due_amount_pending, count(*) as total_due_invoice_count 
                from c4_client_invoices 
                where clientid = ${clientid} and inv_status='UNPAID'`;
                console.log(dueSql);
                db.query(dueSql,async function(error,dueData,fields){
                    if(!!error) {
                        dbFunc.connectionRelease;
                        callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                        resolve(error);
                    } else {
                        dbFunc.connectionRelease;
                        let clientSql = `select c.currency_id, c.currency_code
                        from c4_clients as c
                        where c.id = ${clientid}`;
                        console.log(clientSql);
                        db.query(clientSql,async function(error,clientData,fields){
                            if(!!error) {
                                dbFunc.connectionRelease;
                                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                                resolve(error);
                            } else {
                                dbFunc.connectionRelease;
                                if(clientData.length == 0){
                                    callback(1,"Invalid request.");
                                    resolve("Invalid request.");
                                }
                                if(invList.length > 0){
                                    let key = 0;
                                    var crypto = require('crypto');
                                    for await (var val of invList) {
                                        invList[key].inv_path = base64.encode (val.inv_path);
                                        invList[key].download_path = config.OLDAPP_PORTAL_URL+"DownloadInvoice/index/"+crypto.createHash('md5').update(""+val.id).digest("hex")+"/signed";
                                        key++;
                                    }
                                }
                                otherData = {total_invoices:0,due_invoice_count:0,due_amount:0,currency:clientData[0].currency_code};
                                otherData.total_invoices = invList.length;
                                otherData.due_amount = ((dueData[0].total_due_amount_pending)?dueData[0].total_due_amount_pending:0);
                                otherData.due_invoice_count = ((dueData[0].total_due_invoice_count)?dueData[0].total_due_invoice_count:0);
                                let returnData = {invList:invList,otherData:otherData};
                                callback(null,returnData);
                                resolve(returnData);
                            }
                        });
                    }
                });
            }
       });
    });
}

let getTransactionsList= async (reqObj,callback)=>{
	let clientid = base64.decode(reqObj.params.id); 
    console.log(clientid);
    return new Promise(async function(resolve,reject) {
        let txnSql = `select SQL_CALC_FOUND_ROWS FROM_UNIXTIME(createddate,"%d-%m-%Y %h:%i:%s %p") as createddate,
        requested_amount,clnt_txn_ref,txn_msg,request_type,extra
        from c4_transaction_requests
        where  c4_transaction_requests.clientid = '${clientid}'
        order by c4_transaction_requests.uid DESC`;
        console.log(txnSql);
        db.query(txnSql,async function(error,txnList,fields){
            if(!!error) {
                dbFunc.connectionRelease;
                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                callback(null,txnList);
                resolve(txnList);
            }
       });
    });
}

let getPaymentsList= async (reqObj,callback)=>{
	let clientid = base64.decode(reqObj.params.id); 
    console.log(clientid);
    return new Promise(async function(resolve,reject) {
        let paySql = `select SQL_CALC_FOUND_ROWS FROM_UNIXTIME(createddate,"%d-%m-%Y %h:%i:%s %p") as createddate,
        IF(type="DEBITFUND", IFNULL(ROUND(debit_amount,2),0), IFNULL(ROUND(amount,2),0)) as debit_amount,
        type,reference_id,status as statusddd,trans_type
        from c4_client_payments
        where c4_client_payments.clientid = '${clientid}' and (c4_client_payments.type="ONLINE" or c4_client_payments.type="DEBITFUND")
        order by c4_client_payments.id DESC`;
        console.log(paySql);
        db.query(paySql,async function(error,payList,fields){
            if(!!error) {
                dbFunc.connectionRelease;
                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                callback(null,payList);
                resolve(payList);
            }
       });
    });
}

function payInvoice(reqObj,callback) {
    let formData = reqObj.body;
    console.log(formData);
    console.log(JSON.stringify(formData));
    var frmValues = {
        'clientid': formData.clientid,
        'transaction_type' : "PAYMENT",
        'createddate' : (new Date().getTime() / 1000),
        'ref_id' : formData.inv_id,
        'requested_amount' : helper.financial( formData.grand_total, 2 ),
        'request_type' : 'INVOICE',
        'planid' : 0,
        'extra' : formData.inv_id,
        'request_sub_type' : 'INVOICE',
        'currency_code' : formData.currency,
        created_by : formData.user_id,
        requested_domain : config.API_URL,
        gateway: 'EBS'
      };

    return new Promise((resolve,reject) => {
        db.query(`SELECT ci.* FROM c4_client_invoices as ci
        where ci.inv_id = '${formData.inv_id}' and ci.inv_status = 'UNPAID' order by inv_id asc`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                resolve(error);
            } else {
                dbFunc.connectionRelease;
                if (rows.length > 0) {
                    // let ts = {'REQTYPE':'CART',
                    //     'AMOUNT': frmValues.total,
                    //     'CLIENTID': frmValues.clientid,
                    //     'CARTID': frmValues.cartid,
                    //     'CURRENCY': frmValues.currency
                    // };
                    // str = helper.arrayencode(ts);

                    db.query("INSERT INTO c4_transaction_requests SET ?", frmValues ,(error,orderRows,fields)=>{
                        if(error) {
                            dbFunc.connectionRelease;
                            callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                            resolve(error);
                        } else {
                            dbFunc.connectionRelease;
                            console.log(orderRows);
                            let lastInsId = orderRows.insertId;
                            callback(null,{uid: base64.encode (lastInsId.toString().padStart(10, '0')),"message":"Redirecting to Payment Gateway..."});
                            resolve(orderRows);
                        }
                    });
                }else{
                    callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                    resolve({"message":"The operation did not execute as expected. Please raise a ticket to support"});
                }
            }
       });
        
        
    });
}

function getOrderDetails(formData,callback) {
//    console.log("formData");
//    console.log(formData);
    console.log(JSON.stringify(formData));
    productinfo={};

    let sql = '';
    if(formData.order_type == 'CLOUD' 
    	|| formData.order_type == 'AZURE'
		|| formData.order_type == 'AWS'
		|| formData.order_type == 'GCP'){
        sql = `SELECT c4_order_details.id,
            c4_order_details.order_id,
            c4_order_details.configuration,
            c4_order_details.order_type,
            c4_order_details.quantity,
            c4_order_details.status,
            c4_order_details.reference_id,
            c4_order_details.cpu_cost,
            c4_order_details.ram_cost,
            c4_order_details.disk_on_cost,
            c4_order_details.disk_off_cost,
            c4_order_details.os_cost,
            c4_order_details.bandwidth_in_cost,
            c4_order_details.bandwidth_out_cost,
            c4_order_details.upfront_cost,
            c4_order_details.price,
            c4_order_details.plan_id,
            c4_order_details.dependentid,
            c4_order_details.vmid,
            c4_order_details.copy_type,
            c4_order_details.createddate,
            c4_order_details.updateddate,
            c4_order_details.billing_frequency,
            c4_order_details.clientid,
            c4_order_details.base_price,
            c4_order_details.mrc_price,
            c4_order_details.hold_amount,
            c4_order_details.last_report_gen_date,
            c4_order_details.next_report_gen_date,
            c4_order_details.activation_date,
            c4_order_details.suspend_date,
            c4_order_details.diskName,
            c4_order_details.pay_type,
            c4_order_details.description,
            c4_vm_details.id as vmdid,
            c4_vm_details.order_details_id,
            c4_vm_details.ref_id,
            c4_vm_details.host_name,
            c4_vm_details.label_name,
            c4_vm_details.clientid,
            c4_vm_details.primary_ip,
            c4_vm_details.multiple_ip,
            c4_vm_details.username,
            c4_vm_details.password,
            c4_vm_details.ram_units_gb,
            c4_vm_details.cpu_units,
            c4_vm_details.disk_units_gb,
            c4_vm_details.bandwidth_units_gb,
            c4_vm_details.disk_count,
            c4_vm_details.disk_info,
            c4_vm_details.power_status,
            c4_vm_details.vm_status,
            c4_vm_details.cpu_price,
            c4_vm_details.ram_price,
            c4_vm_details.disk_on_price,
            c4_vm_details.disk_off_price,
            c4_vm_details.bandwidth_price,
            c4_vm_details.os_price,
            c4_vm_details.vdc_id,
            c4_vm_details.tech_id,
            c4_vm_details.copy_type,
            c4_vm_details.third_copy,
            c4_vm_details.rpo_time,
            c4_vm_details.plan_failover_status,
            c4_vm_details.fourth_copy,
            c4_vm_details.total_recovery_points,
            c4_vm_details.is_running_under_restore,
            c4_vm_details.plan_id,
            c4_vm_details.os_id,
            c4_vm_details.os_template_name,
            c4_vm_details.extra,
            c4_vm_details.status,
            c4_vm_details.createddate,
            c4_vm_details.updateddate,
            c4_vm_details.creation_start_date,
            c4_vm_details.creation_complete_date,
            c4_vm_details.createdby,
            c4_vm_details.updatedby,
            c4_vm_details.nagios_config_status,
            c4_vm_details.display_label_name,
            c4_vm_details.display_host_name,
            c4_vm_details.termination_status
            FROM
            c4_order_details
            INNER JOIN c4_vm_details ON c4_order_details.id = c4_vm_details.order_details_id
            WHERE
            c4_order_details.id = ${formData.id} AND
            c4_order_details.clientid = ${formData.clientid} limit 1`;
    } else if(formData.order_type == 'ADDON'){
        sql = `SELECT
        c4_order_details.id,
        c4_order_details.order_id,
        c4_order_details.configuration,
        c4_order_details.order_type,
        c4_order_details.quantity,
        c4_order_details.status,
        c4_order_details.reference_id,
        c4_order_details.cpu_cost,
        c4_order_details.ram_cost,
        c4_order_details.disk_on_cost,
        c4_order_details.disk_off_cost,
        c4_order_details.os_cost,
        c4_order_details.bandwidth_in_cost,
        c4_order_details.bandwidth_out_cost,
        c4_order_details.upfront_cost,
        c4_order_details.price,
        c4_order_details.plan_id,
        c4_order_details.dependentid,
        c4_order_details.vmid,
        c4_order_details.copy_type,
        c4_order_details.createddate,
        c4_order_details.updateddate,
        c4_order_details.billing_frequency,
        c4_order_details.clientid,
        c4_order_details.base_price,
        c4_order_details.mrc_price,
        c4_order_details.hold_amount,
        c4_order_details.last_report_gen_date,
        c4_order_details.next_report_gen_date,
        c4_order_details.activation_date,
        c4_order_details.suspend_date,
        c4_order_details.diskName,
        c4_order_details.pay_type,
        c4_order_details.description,
        c4_addons.typeid,
        c4_addons.name,
        c4_addons.currency_id,
        c4_addons.price,
        c4_addons.record_status,
        c4_addons.description,
        c4_addons.quantity as addonqty,
        c4_addons.tech_id,
        c4_addons.vdc_id,
        c4_addons.createddate,
        c4_addons.updateddate
        FROM
        c4_order_details
        INNER JOIN c4_addons ON c4_order_details.plan_id = c4_addons.id
        WHERE
        c4_order_details.id = ${formData.id} AND
        c4_order_details.clientid = ${formData.clientid} limit 1`;
    }else{
        sql = `SELECT
        c4_order_details.id,
        c4_order_details.order_id,
        c4_order_details.configuration,
        c4_order_details.order_type,
        c4_order_details.quantity,
        c4_order_details.status,
        c4_order_details.reference_id,
        c4_order_details.cpu_cost,
        c4_order_details.ram_cost,
        c4_order_details.disk_on_cost,
        c4_order_details.disk_off_cost,
        c4_order_details.os_cost,
        c4_order_details.bandwidth_in_cost,
        c4_order_details.bandwidth_out_cost,
        c4_order_details.upfront_cost,
        c4_order_details.price,
        c4_order_details.plan_id,
        c4_order_details.dependentid,
        c4_order_details.vmid,
        c4_order_details.copy_type,
        c4_order_details.createddate,
        c4_order_details.updateddate,
        c4_order_details.billing_frequency,
        c4_order_details.clientid,
        c4_order_details.base_price,
        c4_order_details.mrc_price,
        c4_order_details.hold_amount,
        c4_order_details.last_report_gen_date,
        c4_order_details.next_report_gen_date,
        c4_order_details.activation_date,
        c4_order_details.suspend_date,
        c4_order_details.diskName,
        c4_order_details.pay_type,
        c4_order_details.description
        FROM
        c4_order_details
        WHERE
        c4_order_details.id = ${formData.id} AND
        c4_order_details.clientid = ${formData.clientid} limit 1`;
    }
    return new Promise((resolve,reject) => {
        if(sql == ''){
            callback(1,"The operation did not execute as expected. Please raise a ticket to support");
            resolve({"message":"The operation did not execute as expected. Please raise a ticket to support"});
        }else{
            db.query(sql,(error,rows,fields)=>{
                if(!!error) {
                    dbFunc.connectionRelease;
                    callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                    resolve(error);
                } else {
                    dbFunc.connectionRelease;
                    if (rows.length > 0) {
                        let returnData = Object.assign({}, rows[0]);
                        returnData.price = 0;
                        if(formData.order_type != 'HOURLY' && formData.order_type=='CLOUD'){
                            returnData.price= returnData.base_price+ returnData.mrc_price;
                        }else if(formData.order_type=='CLOUD'){
                            returnData.price= (returnData.ram_units_gb * returnData.ram_cost) + (returnData.disk_units_gb * returnData.disk_on_cost) + (returnData.cpu_units * returnData.cpu_cost) + returnData.base_price;
                        }else{
                        	returnData.price= returnData.mrc_price;
                        }
                        returnData.producttype = formData.order_type;
                        returnData.order_details_id = formData.id;
                        returnData.billingfrequency = formData.billing_frequency;
                        callback(null,returnData);
                        //resolve(returnData);
                    }else{
                        callback(null,[]);
                        //resolve({"message":"Data not found."});
                    }
                }
        });
        }
        
    });
}

function viewHourlyReport(formData,callback) {
    console.log(formData);
    console.log(JSON.stringify(formData));
    productinfo={};

    let typeid = formData.typeid;
    let from_date = dateFormat(new Date(formData.from_date), "yyyy-mm-dd");

    let to_date = dateFormat(new Date(formData.to_date), "yyyy-mm-dd");
    let sdate = (new Date(from_date).getTime()/1000);
    let edate = (new Date(to_date).getTime()/1000)+86400;
    console.log("typeid "+typeid);
    console.log("sdate "+sdate);
    console.log("edate "+edate);
                
    let sql = '';
    if(formData.prodtype == 'CLOUD' 
    	|| formData.prodtype == 'AWS' 
		|| formData.prodtype == 'AZURE' 
		|| formData.prodtype == 'GCP'){
        sql = `SELECT
        c4_vm_hourly_transactions.id,
        c4_vm_hourly_transactions.clientid,
        c4_vm_hourly_transactions.vmid,
        c4_vm_hourly_transactions.description,
        c4_vm_hourly_transactions.start_time,
        c4_vm_hourly_transactions.end_time,
        c4_vm_hourly_transactions.cpu_cost,
        c4_vm_hourly_transactions.ram_cost,
        c4_vm_hourly_transactions.os_cost,
        c4_vm_hourly_transactions.disk_cost,
        c4_vm_hourly_transactions.total_amount,
        c4_vm_hourly_transactions.tax,
        c4_vm_hourly_transactions.total_deduction,
        c4_vm_hourly_transactions.type,
        c4_vm_hourly_transactions.createddate,
        c4_vm_hourly_transactions.avail_funds,
        c4_vm_hourly_transactions.currency_id,
        c4_vm_hourly_transactions.report_generated,
        c4_vm_hourly_transactions.updateddate,
        c4_vm_hourly_transactions.fund_source,
        c4_vm_hourly_transactions.txn_status,
        c4_vm_hourly_transactions.discount_amount,
        c4_vm_hourly_transactions.org_amount_wo_tax,
        c4_vm_hourly_transactions.base_price,
        c4_vm_hourly_transactions.hours
        FROM
        c4_vm_hourly_transactions
        WHERE
        c4_vm_hourly_transactions.vmid = ${typeid} AND
        c4_vm_hourly_transactions.start_time >= ${sdate} AND
        c4_vm_hourly_transactions.end_time <= ${edate}
        ORDER BY
        c4_vm_hourly_transactions.id DESC`;
    }else{
        sql = `SELECT
        c4_vm_addon_hourly_transactions.id,
        c4_vm_addon_hourly_transactions.clientid,
        c4_vm_addon_hourly_transactions.vmid,
        c4_vm_addon_hourly_transactions.order_details_id,
        c4_vm_addon_hourly_transactions.addon_id,
        c4_vm_addon_hourly_transactions.description,
        c4_vm_addon_hourly_transactions.start_time,
        c4_vm_addon_hourly_transactions.end_time,
        c4_vm_addon_hourly_transactions.total_amount,
        c4_vm_addon_hourly_transactions.tax,
        c4_vm_addon_hourly_transactions.total_deduction,
        c4_vm_addon_hourly_transactions.type,
        c4_vm_addon_hourly_transactions.createddate,
        c4_vm_addon_hourly_transactions.avail_funds,
        c4_vm_addon_hourly_transactions.currency_id,
        c4_vm_addon_hourly_transactions.report_generated,
        c4_vm_addon_hourly_transactions.updateddate,
        c4_vm_addon_hourly_transactions.fund_source,
        c4_vm_addon_hourly_transactions.txn_status,
        c4_vm_addon_hourly_transactions.discount_amount,
        c4_vm_addon_hourly_transactions.org_amount_wo_tax,
        c4_vm_addon_hourly_transactions.base_price
        FROM
        c4_vm_addon_hourly_transactions
        WHERE
        c4_vm_addon_hourly_transactions.order_details_id = ${typeid} AND
        c4_vm_addon_hourly_transactions.start_time >= ${sdate} AND
        c4_vm_addon_hourly_transactions.end_time <= ${edate}`;
    }
    console.log(sql);
    return new Promise((resolve,reject) => {
        if(sdate > edate){
            callback(1,"Invaid Date Selection");
            resolve({"message":"Invaid Date Selection"});
        }else{
            db.query(sql,async (error,rows,fields)=>{
                if(!!error) {
                    dbFunc.connectionRelease;
                    callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                    resolve(error);
                } else {
                    dbFunc.connectionRelease;
                    if (rows.length > 0) {
                        let key = 0;
                        var sql ='';
                        new Promise((cur_resolve,cur_reject) => {
                        	if(formData.prodtype == 'CLOUD' 
                            	|| formData.prodtype == 'AWS' 
                        		|| formData.prodtype == 'AZURE' 
                        		|| formData.prodtype == 'GCP'){
	        	            	sql=`SELECT c.currency_code FROM c4_clients as c 
	        	            	 inner join c4_vm_details as vm on vm.clientid = c.id
	        	            	 WHERE vm.id = '${typeid}'`;
                        	}else{
                        		sql=`SELECT c.currency_code FROM c4_clients as c 
               	            	 inner join c4_order_details as od on od.clientid = c.id
               	            	 WHERE od.id = '${typeid}'`;
                        	}
        	            	dbHandler.executeQuery(sql,function(result){
        	                	cur_resolve(result)
        	                });
                    	}).then(async function(curData){
                    		console.log("curData");
                    		console.log(curData);
	                        for await (var val of rows) {
	                            rows[key].start_time = helper.convertTimestampToDatetime (val.start_time);
	                            rows[key].end_time = helper.convertTimestampToDatetime (val.end_time);
	                            rows[key].total_deduction = helper.fnFormatCurrency(helper.financial( val.total_deduction, 2 ),curData[0].currency_code);
	                            key++;
	                        }
	                        callback(null,rows);
	                        resolve(rows);
                    	});
                    }else{
                        callback(null,rows);
                        resolve({"message":"Data not found."});
                    }
                }
            });
        }
    });
}

function downloadHourlyReport(formData,callback) {
    console.log(formData);
    console.log(JSON.stringify(formData));
    productinfo={};

    let typeid = formData.typeid;
    let from_date = dateFormat(new Date(formData.from_date), "yyyy-mm-dd");

    let to_date = dateFormat(new Date(formData.to_date), "yyyy-mm-dd");
    let sdate = (new Date(from_date).getTime()/1000);
    let edate = (new Date(to_date).getTime()/1000)+86400;
    console.log("typeid "+typeid);
    console.log("sdate "+sdate);
    console.log("edate "+edate);
                
    let sql = '';
    if(formData.prodtype == 'CLOUD' 
    	|| formData.prodtype == 'AWS' 
		|| formData.prodtype == 'AZURE' 
		|| formData.prodtype == 'GCP'){
        sql = `SELECT
        c4_vm_hourly_transactions.id,
        c4_vm_hourly_transactions.clientid,
        c4_vm_hourly_transactions.vmid,
        c4_vm_hourly_transactions.description,
        c4_vm_hourly_transactions.start_time,
        c4_vm_hourly_transactions.end_time,
        c4_vm_hourly_transactions.cpu_cost,
        c4_vm_hourly_transactions.ram_cost,
        c4_vm_hourly_transactions.os_cost,
        c4_vm_hourly_transactions.disk_cost,
        c4_vm_hourly_transactions.total_amount,
        c4_vm_hourly_transactions.tax,
        c4_vm_hourly_transactions.total_deduction,
        c4_vm_hourly_transactions.type,
        c4_vm_hourly_transactions.createddate,
        c4_vm_hourly_transactions.avail_funds,
        c4_vm_hourly_transactions.currency_id,
        c4_vm_hourly_transactions.report_generated,
        c4_vm_hourly_transactions.updateddate,
        c4_vm_hourly_transactions.fund_source,
        c4_vm_hourly_transactions.txn_status,
        c4_vm_hourly_transactions.discount_amount,
        c4_vm_hourly_transactions.org_amount_wo_tax,
        c4_vm_hourly_transactions.base_price,
        c4_vm_hourly_transactions.hours
        FROM
        c4_vm_hourly_transactions
        WHERE
        c4_vm_hourly_transactions.vmid = ${typeid} AND
        c4_vm_hourly_transactions.start_time >= ${sdate} AND
        c4_vm_hourly_transactions.end_time <= ${edate}
        ORDER BY
        c4_vm_hourly_transactions.id DESC`;
    }else{
        sql = `SELECT
        c4_vm_addon_hourly_transactions.id,
        c4_vm_addon_hourly_transactions.clientid,
        c4_vm_addon_hourly_transactions.vmid,
        c4_vm_addon_hourly_transactions.order_details_id,
        c4_vm_addon_hourly_transactions.addon_id,
        c4_vm_addon_hourly_transactions.description,
        c4_vm_addon_hourly_transactions.start_time,
        c4_vm_addon_hourly_transactions.end_time,
        c4_vm_addon_hourly_transactions.total_amount,
        c4_vm_addon_hourly_transactions.tax,
        c4_vm_addon_hourly_transactions.total_deduction,
        c4_vm_addon_hourly_transactions.type,
        c4_vm_addon_hourly_transactions.createddate,
        c4_vm_addon_hourly_transactions.avail_funds,
        c4_vm_addon_hourly_transactions.currency_id,
        c4_vm_addon_hourly_transactions.report_generated,
        c4_vm_addon_hourly_transactions.updateddate,
        c4_vm_addon_hourly_transactions.fund_source,
        c4_vm_addon_hourly_transactions.txn_status,
        c4_vm_addon_hourly_transactions.discount_amount,
        c4_vm_addon_hourly_transactions.org_amount_wo_tax,
        c4_vm_addon_hourly_transactions.base_price
        FROM
        c4_vm_addon_hourly_transactions
        WHERE
        c4_vm_addon_hourly_transactions.order_details_id = ${typeid} AND
        c4_vm_addon_hourly_transactions.start_time >= ${sdate} AND
        c4_vm_addon_hourly_transactions.end_time <= ${edate}`;
    }
    console.log(sql);
    return new Promise((resolve,reject) => {
        if(sdate > edate){
            callback(1,"Invaid Date Selection");
            resolve({"message":"Invaid Date Selection"});
        }else{
            db.query(sql,async (error,rows,fields)=>{
                if(!!error) {
                    dbFunc.connectionRelease;
                    callback(1,"The operation did not execute as expected. Please raise a ticket to support");
                    resolve(error);
                } else {
                    dbFunc.connectionRelease;
                    if (rows.length > 0) {
                        let key = 0;
                        var sql='';
                        new Promise((cur_resolve,cur_reject) => {
                        	if(formData.prodtype == 'CLOUD' 
                            	|| formData.prodtype == 'AWS' 
                        		|| formData.prodtype == 'AZURE' 
                        		|| formData.prodtype == 'GCP'){
	        	            	sql=`SELECT c.currency_code FROM c4_clients as c 
	        	            	 inner join c4_vm_details as vm on vm.clientid = c.id
	        	            	 WHERE vm.id = '${typeid}'`;
                        	}else{
                        		sql=`SELECT c.currency_code FROM c4_clients as c 
               	            	 inner join c4_order_details as od on od.clientid = c.id
               	            	 WHERE od.id = '${typeid}'`;
                        	}
        	            	dbHandler.executeQuery(sql,function(result){
        	                	cur_resolve(result)
        	                });
                    	}).then(async function(curData){
	                        for await (var val of rows) {
	                            rows[key].start_time = helper.convertTimestampToDatetime (val.start_time);
	                            rows[key].end_time = helper.convertTimestampToDatetime (val.end_time);
	                            rows[key].total_deduction = helper.fnFormatCurrency(helper.financial( val.total_deduction, 2 ),curData[0].currency_code);
	                            key++;
	                        }
	                        // var assestPath = path.join(__dirname+"/../");
	                        // assestPath = assestPath.replace(new RegExp(/\\/g),'/');
	                        assestPath = config.APIPATH;
	                        assestPath = "file:///"+assestPath+'/';
	                        console.log(assestPath);
	                        
	                        let html = '<div style="display:none;"><img src="'+assestPath+'img/cloud4c_logo.png" alt="Logo" width="100" height="30" border="0"  /></div>';
	                        html += '<h1>Hourly Transactions</h1>';
	                        html += '<table border="1" width="100%">';
	                        html += '<tr>';
	                        html += '<th>From Time</th>';
	                        html += '<th>To Time</th>';
	                        html += '<th>Description</th>';
	                        html += '<th>Amount Deducted</th>';
	                        html += '</tr>';
	
	                        
	                        for await (const record of rows) {
	                            html += '<tr>';
	                            html += '<th>'+record.start_time+'</th>';
	                            html += '<th>'+record.end_time+'</th>';
	                            html += '<th>'+record.description +'</th>';
	                            html += '<th>'+record.total_deduction +'</th>';
	                            html += '</tr>';
	                        }
	
	                        html += '</table>';
	                        
	                        var options = { 
	                            format: 'Letter',
	                            base: assestPath,
	                            "header": {
	                                "height": "45mm",
	                                "contents": '<div style="text-align: center;"><img src="'+assestPath+'img/cloud4c_logo.png" alt="Logo" width="100" height="30" border="0"  /></div>'
	                            },
	                            "footer": {
	                                "height": "28mm",
	                                "contents": {
	                                //first: 'Cover page',
	                                // 2: 'Second page', // Any page number is working. 1-based index
	                                default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
	                                // last: 'Last Page'
	                                }
	                            }
	                        };
	
	                        let filename = helper.getRandomString()+".pdf";
	                        let completeFilePath = config.REPORTS_PATH+filename;
	                        pdf.create(html, options).toFile(completeFilePath, function(err, res) {
	                            if (err){
	                                console.log(err);
	                                callback(1,"The operation did not execute as expected. Please raise a ticket to support");
	                                resolve(err);
	                            }else{
	                                console.log(res); // { filename: '/app/businesscard.pdf' }
	                                callback(null,{filename:base64.encode (filename)});
	                                resolve({filename:base64.encode (filename)});
	                            }
	                        });
                    	});
                    }else{
                        callback(1,"Data not found.");
                        resolve({"message":"Data not found."});
                    }
                }
            });
        }
    });
}


module.exports = {
    getOrderList : getOrderList,
    getInvoiceList : getInvoiceList,
    getTransactionsList : getTransactionsList,
    getPaymentsList : getPaymentsList,
    payInvoice:payInvoice,
    getOrderDetails : getOrderDetails,
    viewHourlyReport : viewHourlyReport,
    downloadHourlyReport : downloadHourlyReport
};

