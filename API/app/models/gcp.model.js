var db = require('../../config/database');
var dbFunc = require('../../config/db-function');
const helper=require('../../helpers/common_helper');
const axios = require('axios');
var dateFormat=require('dateformat');
const dbHandler= require('../../config/api_db_handler');
const gcpModel=require('../../models/gcp_model');
const connpool=require('../../config/db_mssql');
var querystring = require('querystring');
var base64 = require('base-64');
const request=require('request');
const { promises } = require('dns');
const moment = require('moment');

let getGcpMachineTypesList = async (reqBody,callback)=>{
  var zone=reqBody.zone;
  if(typeof(zone)=='undefined' || zone==''){
    var response={status:"error",message:'Please provide zone.',data:[]}
    return callback(1,response);
  }
  
  var projectId=reqBody.projectId;
  if(typeof(projectId)=='undefined' || projectId==''){
    var response={status:"error",message:'Please provide projectId.',data:[]}
    return callback(1,response);
  }
  
  var currency_id=reqBody.currency_id;
  if(typeof(currency_id)=='undefined' || currency_id==''){
    var response={status:"error",message:'Please provide currency_id.'}
    return callback([],response);
  }

  let sql = `SELECT c.*, ocp.price from gcp_machinetypes as c
  inner join c4_othercloud_prices as ocp on (ocp.ref_id = c.id and ocp.ref_type = 'SIZES' and ocp.cloud_type = 'GCP' and ocp.currency_id = '${currency_id}' and ocp.record_status = 1)
   where c.zone = '${zone}' and c.projectId = '${projectId}' `;

  console.log("sql");
  console.log(sql);
  await dbHandler.executeQuery(sql,async function(data){
    return callback(null,{status:"success",message:'GCP Machine Type List.',data:data});
  });
}
let getGcpProjectDetails = async (reqBody,callback)=>{
  var clientid=reqBody.clientid;
  if(typeof(clientid)=='undefined' || clientid==''){
    var response={status:"error",message:'Please provide clientid.',data:[]}
    return callback(1,response);
  }
  var projectId=reqBody.projectId;
  if(typeof(projectId)=='undefined' || projectId==''){
    var response={status:"error",message:'Please provide projectId.',data:[]}
    return callback(1,response);
  }

  let sql = `SELECT c.* from c4_gcp_project_details as c
   where clientid = '${clientid}' and name = '${projectId}' `;

  console.log("sql");
  console.log(sql);
  await dbHandler.executeQuery(sql,async function(data){
    return callback(null,{status:"success",message:'GCP Zone Details.',data:data});
  });
}
let getVMDetails = async (encId,callback)=> {
    vmId = base64.decode(encId);
    //console.log("vmId");
    //console.log(vmId);
    
    if(typeof(vmId)=='undefined' || vmId==''){
      var response={status:"error",message:'Invalid request'}
      return callback(1,response);
    }
    let vmDetailSql = `SELECT vm.*, 
        av.*,
        av.id as aws_vm_id,
        md5(vm.id) as mdvmid
        FROM c4_vm_details as vm
        inner join gcp_vms as av on av.vm_detail_id = vm.id
        where vm.id = '${vmId}'`;
        ////console.log(sql);
    let vmDetail=await new Promise(function(resolve,reject){
        dbHandler.executeQuery(vmDetailSql,function(result){
            ////console.log(result);
            resolve(result)
        });
    })
    if(vmDetail.length == 0){
        var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
        return callback(1,response);
    }else{
        return gcpModel.gcp_authtoken(vmDetail[0].clientid,async function(error, token){
            // //console.log("token");
            //console.log(token);
            if(token.tokendata.length == 0){
                var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
                return callback(1,response);
            }else{
                return gcpModel.syncGcpVmDetail({instanceId:vmDetail[0].instanceId,returnData:true}, async function(error, dataFromGcp){
                	console.log("dataFromGcp");
                	console.log(dataFromGcp);
                    if(error){
                        var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
                        return callback(1,response);
                    }else{
                    	dbHandler.executeQuery(vmDetailSql,function(updatedVmDetail){
                    		if(updatedVmDetail.length == 0){
                    			var response={status:"error",message:'The operation did not execute as expected. Please raise a ticket to support'}
                                return callback(1,response);
                    		}else{
                    			let resData = {status:"success",message:'VM Details',vmdetails : {dataFromDB:updatedVmDetail[0],dataFromGcp:dataFromGcp},clientdetails:token.clientdata};
                                return callback(null,resData);
                    		}
                    	});
                    }
                });
            }
        })
    }
}
let getGcpImagesList = async (reqBody,callback)=>{
  var image_type=reqBody.image_type;
  if(typeof(image_type)=='undefined' || image_type==''){
    var response={status:"error",message:'Please provide image_type.',data:[]}
    return callback(1,response);
  }
  
  var clientid=reqBody.clientid;
  if(typeof(clientid)=='undefined' || clientid==''){
    var response={status:"error",message:'Please provide clientid.',data:[]}
    return callback(1,response);
  }
  
  var currency_id=reqBody.currency_id;
  if(typeof(currency_id)=='undefined' || currency_id==''){
    var response={status:"error",message:'Please provide currency_id.',data:[]}
    return callback(1,response);
  }

  let sql = `SELECT c.*, ocp.price from c4_gcp_images as c
  inner join c4_othercloud_prices as ocp on (ocp.ref_id = c.id and ocp.ref_type = 'OS' and ocp.cloud_type = 'GCP' and ocp.currency_id = '${currency_id}' and ocp.record_status = 1)
   where 1 `;

  if(reqBody.status && reqBody.status != 'all'){
	  sql += ` and c.record_status = '${reqBody.status}' `;
  }else if(!reqBody.status){
	  sql += ` and c.record_status = 1 `;
  }
  
  if(reqBody.image_type && reqBody.image_type == 'public'){
	  sql += ` and c.image_type = '${reqBody.image_type}' `;
  }else if(reqBody.image_type && reqBody.image_type != ''){
	  sql += ` and c.image_type = '${reqBody.image_type}' and c.clientid = '${clientid}' `;
  }
  
  if(reqBody.imagecloudtype && reqBody.imagecloudtype != ''){
	  sql += ` and c.imagecloudtype = '${reqBody.imagecloudtype}' `;
  }
  
  console.log("sql");
  console.log(sql);
  await dbHandler.executeQuery(sql,async function(data){
    return callback(null,{status:"success",message:'GCP Project Details.',data:data});
  });
}

let getGcpNetworkslist = async (reqBody,callback)=>{
  var clientid=reqBody.clientid;
  if(typeof(clientid)=='undefined' || clientid==''){
    var response={status:"error",message:'Please provide clientid.',data:[]}
    return callback(1,response);
  }
  
  let sql = `SELECT c.*, p.clientid from gcp_networks as c
  inner join c4_gcp_projects as p on p.projectId = c.projectId
   where p.clientid = '${clientid}' `;

  if(reqBody.status && reqBody.status != 'all'){
	  sql += ` and c.status = '${reqBody.status}' `;
  }else if(!reqBody.status){
	  sql += ` and c.status = 1 `;
  }
  
  if(reqBody.projectId && reqBody.projectId != ''){
	  sql += ` and c.projectId = '${reqBody.projectId}' `;
  }
  
  console.log("sql");
  console.log(sql);
  await dbHandler.executeQuery(sql,async function(data){
    return callback(null,{status:"success",message:'GCP Networks list.',data:data});
  });
}

let getGcpSubNetworklist = async (reqBody,callback)=>{
  var clientid=reqBody.clientid;
  if(typeof(clientid)=='undefined' || clientid==''){
    var response={status:"error",message:'Please provide clientid.',data:[]}
    return callback(1,response);
  }
  
  let sql = `SELECT c.*, p.clientid from gcp_subnetworks as c
  inner join gcp_networks as n on n.name = c.networkName
  inner join c4_gcp_projects as p on p.projectId = c.projectId
   where p.clientid = '${clientid}' `;

  if(reqBody.status && reqBody.status != 'all'){
	  sql += ` and c.status = '${reqBody.status}' `;
  }else if(!reqBody.status){
	  sql += ` and c.status = 1 `;
  }
  
  if(reqBody.projectId && reqBody.projectId != ''){
	  sql += ` and c.projectId = '${reqBody.projectId}' `;
  }
  
  if(reqBody.networkName && reqBody.networkName != ''){
	  sql += ` and c.networkName = '${reqBody.networkName}' `;
  }
  
  console.log("sql");
  console.log(sql);
  await dbHandler.executeQuery(sql,async function(data){
    return callback(null,{status:"success",message:'GCP SubNetwork List.',data:data});
  });
}

let getGcpZonesList = async (reqBody,callback)=>{
  var clientid=reqBody.clientid;
  if(typeof(clientid)=='undefined' || clientid==''){
    var response={status:"error",message:'Please provide clientid.',data:[]}
    return callback(1,response);
  }

  let sql = `SELECT c.* from c4_gcp_zones as c
  inner join c4_gcp_projects as p on p.id = c.project_id
   where p.clientid = '${clientid}' `;

  if(reqBody.status && reqBody.status != 'all'){
	  sql += ` and c.record_status = '${reqBody.status}' `;
  }else if(!reqBody.status){
	  sql += ` and c.record_status = 1 `;
  }
  
  if(reqBody.projectId && reqBody.projectId != ''){
	  sql += ` and p.projectId = '${reqBody.projectId}' `;
  }
  
  if(reqBody.region && reqBody.region != ''){
	  sql += ` and c.region = '${reqBody.region}' `;
  }
  
  if(reqBody.zone_id && reqBody.zone_id != ''){
	  sql += ` and c.id = '${reqBody.zone_id}' `;
  }
  
  console.log("sql");
  console.log(sql);
  await dbHandler.executeQuery(sql,async function(data){
    return callback(null,{status:"success",message:'GCP Project Details.',data:data});
  });
}

let getGcpRegionsList = async (reqBody,callback)=>{
  var clientid=reqBody.clientid;
  if(typeof(clientid)=='undefined' || clientid==''){
    var response={status:"error",message:'Please provide clientid.',data:[]}
    return callback(1,response);
  }
  let sql = `SELECT c.* from c4_gcp_regions as c
  inner join c4_gcp_projects as p on p.id = c.project_id
   where p.clientid = '${clientid}' `;

  if(reqBody.status && reqBody.status != 'all'){
	  sql += ` and c.record_status = '${reqBody.status}' `;
  }else if(!reqBody.status){
	  sql += ` and c.record_status = 1 `;
  }
  
  if(reqBody.projectId && reqBody.projectId != ''){
	  sql += ` and p.projectId = '${reqBody.projectId}' `;
  }
  
  if(reqBody.region_id && reqBody.region_id != ''){
	  sql += ` and c.id = '${reqBody.region_id}' `;
  }
  
  console.log("sql");
  console.log(sql);
  await dbHandler.executeQuery(sql,async function(data){
    return callback(null,{status:"success",message:'GCP Region Details.',data:data});
  });
}
let getAllVmlist=(clientid,callback)=>{
	let sql = `Select * from c4_vm_details where vm_status!='Deleted' and clientid='${clientid}' and cloudid=5 and status=1`;
	dbHandler.executeQuery(sql,function(result){
		return callback(200,{success:1,vms:result})
	})
}
//vmOperations
function vmOperations(reqObj,callback){
  var clientid=base64.decode(reqObj.clientid);
  var ref_id=base64.decode(reqObj.ref_id);
  var vm_id=base64.decode(reqObj.vm_id);
  new Promise((resolve,reject) => {
      var sql=`select * from c4_vm_details as vm where vm.clientid=${clientid} and vm.id=${vm_id} and vm.cloudid=5`
      dbHandler.executeQuery(sql,function(result){
          resolve(result)
      })
  }).then(async function(vmInfo){
      if(!vmInfo)return callback([],{success:0,message:'The operation did not execute as expected. Please raise a ticket to support'});
      //let postParams = { "ref_id": ref_id, "action": reqObj.action,"user_id":clientid};
      let vm_status='';var action_no=0;
      switch(reqObj.action){
          case 'stop': vm_status='PoweredOff';action_no=2;break;
          case 'start': vm_status='Running';action_no=1;break;
          case 'restart': vm_status='Running';action_no=4;break;
          case 'delete':
          	return callback(null,{success:0,message:'Access denied',data:[]});
//          	vm_status='Deleted';
//          	action_no=3;
          	break;
      }
      var insertArr={
          vmid:vm_id,
          type:action_no,
          description:vm_status+' VM',
          createddate:parseInt(new Date()/1000),
          clientid:clientid
      }
      await new Promise(function (resolve, reject) {
          dbHandler.insertIntoTable('c4_vm_logs',insertArr,function(err,result){
              resolve(result)
          })
      });
      var obj={
          actionName:reqObj.action,
          ref_id:ref_id,
          clientid:clientid
      }
      await gcpModel.vmOperations(obj,function(error,response){
          dbHandler.updateTableData('c4_vm_details',{id:vm_id},{vm_status:vm_status},function(err,result){
              return callback(null,response);
          })
      })
      
  })
}
function vmLogs(clientid,vmid) {
  return new Promise((resolve,reject) => {
     var sql=`SELECT * from c4_vm_logs WHERE vmid=${vmid} and clientid=${clientid} order by createddate desc`;
     db.query(sql,(error,rows,fields)=>{
          if(!!error) {
              dbFunc.connectionRelease;
              reject(error);
          } else {
              dbFunc.connectionRelease;
              resolve(rows)
          }
     });
  });
}
let validateVmName = async (reqObj,callback)=> {
  if(!reqObj.vmName){
      var response={success:0,status:"error",message:'Please provide vm name'}
      return callback(1,response);
  }
  if(!reqObj.clientid){
      var response={success:0,status:"error",message:'Please provide client id'}
      return callback(1,response);
  }
  if(!reqObj.zoneName){
      var response={success:0,status:"error",message:'Please provide zone name'}
      return callback(1,response);
  }
  if(!reqObj.projectId){
    var response={success:0,status:"error",message:'Please provide projectId'}
    return callback(1,response);
  }
  var clientid=reqObj.clientid;
  var vm_name=reqObj.vmName;
  var zoneName=reqObj.zoneName;
  var projectId=reqObj.projectId;
  var sql=`select * from gcp_vms where clientid=${clientid} and projectId='${projectId}' and zone='${zoneName}' 
  and name='${vm_name}' and status!='Deleted'`;
  dbHandler.executeQuery(sql,function(result){
      if(result.length > 0){
          return callback(null,{success:0,message:"VM already exists"})
      }else{
          return callback(null,{success:1,message:"VM allowed for creation"})
      }
  })
}

async function getGCPBillingReport(req,callback) {

  let { start_date, end_date, set, limit } = req.query;
  let { clientid } = req;

  let checkStatusQuery = `select * from c4_clients where is_gcp_enabled = 1 and id = :clientid`;
  let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
  if(!checkStatus.length) throw ({ type: "custom", message: `GCP is not enabled`, status: 400 });

  start_date = moment(start_date).unix();
  end_date = moment(end_date).unix();

  let offset = '';
  let values = {client_id: clientid, start_date: start_date, end_date: end_date};

  if(set && limit){
      offset = ` limit :offset, :limit`;
      values = {client_id: clientid, start_date: start_date, end_date: end_date, offset: parseInt((set - 1) * limit), limit: parseInt(limit) }
  }

  let sql = `select bigquery_project_id,
            billing_account_id,
            service_description,
            sku_description,
            sku_id,
            sum(usage_amount_in_pricing_units) as total_quantity,
            sum(usage_cost) as total_usage_cost,
            usage_pricing_unit
            from c4_gcp_budget_usage as bu where bu.clientid = :client_id and bu.usage_start_time >= :start_date and bu.usage_end_time <= :end_date group by bigquery_project_id, sku_id having total_usage_cost > 0 order by service_description asc ${offset}`
  let sql_count = `select count(*) as count from 
                  (select bigquery_project_id, sku_id, sum(usage_cost) as total_usage_cost from c4_gcp_budget_usage as bu where bu.clientid = :client_id and bu.usage_start_time >= :start_date and bu.usage_end_time <= :end_date group by bigquery_project_id, sku_id having total_usage_cost > 0) as t`

  let list = await dbHandler.executeQueryv2(sql, values);
  let count = await dbHandler.executeQueryv2(sql_count, {client_id: clientid, start_date: start_date, end_date: end_date });

  let response = {status:"success",message:'GCP Billing report', data : list, count: count[0]['count']};
  return response;

}

module.exports = {
	getGcpProjectDetails,
	getVMDetails,
	getGcpImagesList,
	getGcpZonesList,
	getGcpNetworkslist,
	getGcpSubNetworklist,
  getGcpRegionsList,
  getGcpMachineTypesList,
  getAllVmlist,
  vmOperations,
  vmLogs,
  validateVmName,
  getGCPBillingReport
};

