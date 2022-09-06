var db = require("../../config/database");
var dbFunc = require("../../config/db-function");
var config = require("../../config/constants");
const dbHandler= require('../../config/api_db_handler');
const vmwareModel=require('../../models/vmware_model');
const request=require('request');
const helper = require('../../helpers/common_helper');
var base64 = require('base-64');
const querystring = require('querystring');

function getAzureSubscriptions(reqObj) {
  // console.log('Subscription Assigned: ',reqObj.subscriptions);
  // console.log('Resource groups Assigned: ',reqObj.resource_groups);
  return new Promise((resolve, reject) => {
    let sql = `SELECT *  FROM c4_azure_subscriptions where state='Enabled' and record_status = 1 and is_visible_to_frontend = 1 `
    if(typeof reqObj.clientid != 'undefined'){
      sql += ` and clientid= '${reqObj.clientid}'`;
    }
    if(typeof reqObj.provision_type != 'undefined' && (typeof reqObj.user_role == 'undefined' || (typeof reqObj.user_role != 'undefined' && reqObj.user_role != config.ADMIN_ROLE_ID))){
      sql += ` and provision_type = '${reqObj.provision_type}' `;
    }
    if(typeof reqObj.subscriptions != 'undefined'){
      sql += ` and subscription_id in(${reqObj.subscriptions})`;
    }
    sql += ` order by id desc`;
    console.log(sql);
    db.query(sql, (error, rows, fields) => {
      if (!!error) {
        dbFunc.connectionRelease;
        resolve(error);
      } else {
        dbFunc.connectionRelease;
        // console.log(rows);
        resolve(rows);
      }
    });
  });
}

function getClientDocuments(reqObj,callback) {
	clientid = reqObj.clientid;

    if(typeof(clientid)=='undefined' || clientid==''){
        var response={status:"error",message:'missing clientid',data:[]}
        return callback(1,response);
    }
  return new Promise((resolve, reject) => {
    let sql = `SELECT
				d.id,
				d.clientid,
				d.uploaded_staffid,
				d.title,
				d.description,
				d.file_path,
				d.file_type,
				d.created_date,
				d.updated_date,
				d.status,
				d.client_access,
				d.service_id,
				md5(d.id) AS documentid,
				u.empname
				FROM
				c4_client_documents as d
				left JOIN staff_users as u ON d.uploaded_staffid = u.Id
				where d.clientid ='${clientid}' and d.client_access = 1 and status = 1 order by d.id desc`;
    console.log(sql);
    db.query(sql, (error, rows, fields) => {
      if (!!error) {
        dbFunc.connectionRelease;
        callback(1,{status:"error",message:'The operation did not execute as expected. Please raise a ticket to support',data:[]});
        resolve(error);
      } else {
        dbFunc.connectionRelease;
        // console.log(rows);
        rows.forEach(function(val,key) {
        	rows[key].downloadPath = config.ADMIN_DOMAIN+'api/v1/index.php/download/'+val.documentid;
        });
        callback(null,{status:"error",message:'Client Documents',data:rows});
        resolve(rows);
      }
    });
  });
}

function getAzureSubscriptionLocations(reqObj) {
  return new Promise((resolve, reject) => {
    var subscription = reqObj.subscription.split("_");
    var subscription_id = subscription[1];
    var sql = `SELECT * FROM c4_azure_subscription_locations where clientid='${reqObj.clientid}'
     and subscription_id='${subscription_id}' order by id desc`;
     console.log(sql)
    db.query(sql, (error, rows, fields) => {
      if (!!error) {
        dbFunc.connectionRelease;
        resolve(error);
      } else {
        dbFunc.connectionRelease;
        // console.log(rows);
        resolve(rows);
      }
    });
  });
}

function getOptionConfigData(option_type) {
  return new Promise((resolve, reject) => {
    db.query(`select * from c4_option_config where status = 1 and option_type = '${option_type}' order by CAST(option_value as SIGNED INTEGER) asc`, (error, rows, fields) => {
      if (!!error) {
        dbFunc.connectionRelease;
        resolve(error);
      } else {
        dbFunc.connectionRelease;
        // console.log(rows);
        resolve(rows);
      }
    });
  });
}

let getOptionConfigJsonData = async (reqObj,callback)=>{
    console.log(reqObj);

    if(typeof(reqObj.option_type)=='undefined' || reqObj.option_type==''){
        var response={status:"error",message:'missing option_type'}
        return callback(1,response);
    }
    return new Promise(async (resolve, reject) => {
        db.query(`select * from c4_option_config where status = 1 and option_type = '${reqObj.option_type}'`, async (error, rows, fields) => {
          if (!!error) {
            dbFunc.connectionRelease;
            callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support"});
            resolve(error);
          } else {
            dbFunc.connectionRelease;
//            console.log(rows);
            if(rows.length == 0){
            	callback(null,{status:"success",message:`Data not found for ${reqObj.option_type}.`,data:""});
            }else{
//            	await helper.sleep(5000);
            	callback(null,{status:"success",message:`${reqObj.option_type} data.`,data:JSON.parse(rows[0].option_value)});
            }
            resolve(rows);
          }
        });
    });
}

const getFaqSearchList= async (reqObj,callback) => {
  let searchKey = reqObj.searchKey;

  if (!searchKey || searchKey === '') {
    callback(1,{status:"error",message:"Search is empty",data:""});
  }

  return new Promise((resolve, reject) => {
    db.query(`select question, answer from c4_faqs where status=1 AND (question LIKE '%${searchKey}%' OR answer LIKE '%${searchKey}%')`, (error, rows, fields) => {
      dbFunc.connectionRelease;
      if (!!error) {
          callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support",data:""});
          resolve(error);
      } else {
        if (rows.length === 0) {
          callback(null,{status:"success",message:`Data not found for ${searchKey}.`,data:""});
        } else {
          callback(null,{status:"success",message:`${reqObj.template_key} data.`,data:rows[0]});
        }
        resolve(rows);
      }
    });
  });
}

const getFaqList= async (reqObj,callback) => {
  return new Promise((resolve, reject) => {
    db.query(`select question, answer from c4_faqs where status=1`, (error, rows, fields) => {
      dbFunc.connectionRelease;
      if (!!error) {
          callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support",data:""});
          resolve(error);
      } else {
        if (rows.length == 0) {
          callback(null,{status:"success",message:`No Records found.`,data:""});
        } else {
          callback(null,{status:"success",message:`FaQ`,data:rows});
        }
        resolve(rows);
      }
    });
  });
}

let getEmailTemplate = async (reqObj,callback)=>{
    console.log(reqObj);

    if(typeof(reqObj.template_key)=='undefined' || reqObj.template_key==''){
        var response={status:"error",message:'missing template_key'}
        return callback(1,response);
    }
    return new Promise((resolve, reject) => {
        db.query(`select email_subject, email_body from c4_email_templates where record_status = 1 and template_key = '${reqObj.template_key}' limit 1`, (error, rows, fields) => {
        	dbFunc.connectionRelease;
        	if (!!error) {
	            callback(1,{status:"error",message:"The operation did not execute as expected. Please raise a ticket to support",data:""});
	            resolve(error);
        	} else {
//            console.log(rows);
	            if(rows.length == 0){
	            	callback(null,{status:"success",message:`Data not found for ${reqObj.template_key}.`,data:""});
	            }else{
	            	callback(null,{status:"success",message:`${reqObj.template_key} data.`,data:rows[0]});
	            }
	            resolve(rows);
        	}
        });
    });
}

async function getVmListArr(reqObj) {
  var vdc_id=reqObj.vdc_id;
  var group=await new Promise((resolve, reject) => {
    dbHandler.getOneRecord('vm_groups',{vdc_id:vdc_id,is_primary:1},function(result){
      resolve(result)
    });
  })    
  var vmgroupids=group.id+','+reqObj.id;
  return await new Promise((resolve, reject) => {
    db.query('select id,name,vm_groupid from infra_vms where vdc_id='+vdc_id+' and vm_groupid in('+vmgroupids+')',
    (error, rows, fields) => {
      dbFunc.connectionRelease;
      if(!rows.length)resolve({vmlistArr:[],selectedItems:[]})
      var vmlistArr=[];
      var selectedItems=[];
      for(var i=0;i<rows.length;i++){
         vmlistArr.push({name:rows[i].name,id:rows[i].id});
        if(rows[i].vm_groupid==reqObj.id)
         selectedItems.push(rows[i].id);
      }
      resolve({vmlistArr:vmlistArr,selectedItems:selectedItems})
    });
   });  
}
function getAllVdcLocations() {
  return new Promise((resolve, reject) => {
    db.query(`select * from infra_vdc`, (error, rows, fields) => {
      if (!!error) {
        dbFunc.connectionRelease;
        resolve(error);
      } else {
        dbFunc.connectionRelease;
        // console.log(rows);
        resolve(rows);
      }
    });
  });
}

function getDashboardCounts(reqBody) {
	console.log("reqBody ---- ", reqBody);
	let clientid = reqBody.clientid;
	let provision_type = reqBody.provision_type;
	let user_role = reqBody.user_role;
 
  return new Promise((resolve, reject) => {   
    let sql = `
              SELECT
                COUNT(VD.id) AS vm_count,
                SUM(VD.ram_units_gb) AS ram_count,
                SUM(VD.cpu_units) AS cpu_count,
                SUM(VD.disk_units_gb) AS disk_count
            FROM
                c4_vm_details AS VD
            LEFT JOIN azure_vms AS AV
            ON
                VD.id = AV.vm_detail_id
            LEFT JOIN c4_azure_subscriptions AS s ON s.subscription_id = AV.subscriptionId
            WHERE
                VD.cloudid = '3' AND VD.status = 1 and s.record_status = 1 `;
    if(reqBody.resource_groups !== undefined){
      sql +=  ` and AV.resourceGroup IN(${reqBody.resource_groups})`;
    }
    if(reqBody.subscription_id !== undefined){
      sql += ` and AV.subscriptionId IN(${reqBody.subscription_id})`;
    }
    console.log("sql --- ", sql);
    db.query(sql, (error, rows, fields) => {
      if (!!error) {
        dbFunc.connectionRelease;
        resolve(error);
      } else {
        dbFunc.connectionRelease;
        
        let sql = `Select giv.*, s.display_name as subscription_display_name,
        	giv.subscription_id as realName_subscription_id, 
        	giv.resourceGroup as realName_resourceGroup, giv.galleryName as realName_galleryName, 
        	giv.galleryImageName as realName_galleryImageName, giv.galleryImageVersionName as realName_galleryImageVersionName
		    from azure_gallery_image_versions as giv 
		    inner join c4_azure_subscriptions as s on s.subscription_id = giv.subscription_id
		    where giv.record_status = 1`;
		  if(typeof clientid != 'undefined'){
		      sql += ` and giv.clientid = '${clientid}' `;
		  }
		  if(typeof provision_type != 'undefined' && (typeof user_role == 'undefined' || (typeof user_role != 'undefined' && user_role != config.ADMIN_ROLE_ID))){
		      sql += ` and giv.provision_type = '${provision_type}' `;
		  }
		  sql += ` group by giv.id `;
	      sql += ` order by giv.resourceGroup, giv.galleryName, giv.galleryImageName, giv.galleryImageVersionName asc`;
		  // sql += ' limit 1';
		  console.log(sql);
		  
		  dbHandler.executeQuery(sql,async function(gallery_image_versions){
			  let gallery_image_versions_new = [];
			  for await (const item of gallery_image_versions) {
				  let gallery_response_obj = JSON.parse(item.gallery_response_obj);
        		  let image_response_obj = JSON.parse(item.image_response_obj);
        		  let version_response_obj = JSON.parse(item.version_response_obj);
        		  if(!(gallery_response_obj.tags && gallery_response_obj.tags.Status && gallery_response_obj.tags.Status == 'Deprecated')
    				  && !(gallery_response_obj.tags && gallery_response_obj.tags['UCP-Status'] && gallery_response_obj.tags['UCP-Status'] == 'Deprecated')
    				  && !(version_response_obj.tags && version_response_obj.tags.Status && version_response_obj.tags.Status == 'Deprecated')
    				  && !(version_response_obj.tags && version_response_obj.tags['UCP-Status'] && version_response_obj.tags['UCP-Status'] == 'Deprecated')
    				  && !(image_response_obj.tags && image_response_obj.tags.Status && image_response_obj.tags.Status == 'Deprecated')
    				  && !(image_response_obj.tags && image_response_obj.tags['UCP-Status'] && image_response_obj.tags['UCP-Status'] == 'Deprecated')){
        			gallery_image_versions_new.push(item);
        		  }
			  }
			  
			  resolve(Object.assign({}, rows[0],{os_rows:gallery_image_versions_new}));
		  })
      }
    });
  });
}

function getAllDataStores() {
  return new Promise((resolve, reject) => {
    db.query(
      `select infra_vm_datastore.*,infra_vdc.vdc_name,infra_vdc.vdc_location from infra_vm_datastore inner join infra_vdc on infra_vm_datastore.vdc_id = infra_vdc.vdc_id order by infra_vm_datastore.id desc`,
      (error, rows, fields) => {
        if (!!error) {
          dbFunc.connectionRelease;
          resolve(error);
        } else {
          dbFunc.connectionRelease;
          // console.log(rows);
          resolve(rows);
        }
      }
    );
  });
}
function getDatastoreDetail(dsid) {
  return new Promise((resolve, reject) => {
    db.query(
      `select * from infra_vm_datastore where id=${dsid}`,
      (error, rows, fields) => {
        if (!!error) {
          dbFunc.connectionRelease;
          resolve(error);
        } else {
          dbFunc.connectionRelease;
          if(rows){
            let vdc_id=rows[0].vdc_id;
            let ds_name=rows[0].datastore_name;
              vmwareModel.vcenterDatastoreDetailByName(ds_name,vdc_id,function(err,result){
                if(!result)return resolve([])
                resolve(result.data)
              })
          }
          //resolve(rows);
        }
      }
    );
  });
}
function getHostDetail(id) {
  return new Promise((resolve, reject) => {
    db.query(
      `select * from infra_vm_host where id=${id}`,
      (error, rows, fields) => {
        if (!!error) {
          dbFunc.connectionRelease;
          resolve(error);
        } else {
          dbFunc.connectionRelease;
          if(rows){
            let vdc_id=rows[0].vdc_id;
            let name=rows[0].host_ip;
              vmwareModel.vcenterHostDetailByName(name,vdc_id,function(err,result){
                if(!result)return resolve([])
                resolve(result.data)
              })
          }
          //resolve(rows);
        }
      }
    );
  });
}
function datastoreUnderHost(id) {
  return new Promise((resolve, reject) => {
    db.query(
      `select * from infra_vm_host where id=${id}`,
      (error, rows, fields) => {
        if (!!error) {
          dbFunc.connectionRelease;
          resolve(error);
        } else {
          dbFunc.connectionRelease;
          if(rows){
            let vdc_id=rows[0].vdc_id;
            let name=rows[0].host_ip;
              vmwareModel.datastoreUnderHost(name,vdc_id,function(err,result){
                if(!result)return resolve([])
                resolve(result.data)
              })
          }
        }
      }
    );
  });
}
function hostUnderDatastore(id) {
  return new Promise((resolve, reject) => {
    db.query(
      `select * from infra_vm_datastore where id=${id}`,
      (error, rows, fields) => {
        if (!!error) {
          dbFunc.connectionRelease;
          resolve(error);
        } else {
          dbFunc.connectionRelease;
          if(rows){
            let vdc_id=rows[0].vdc_id;
            let name=rows[0].datastore_name;
              vmwareModel.hostUnderDatastore(name,vdc_id,function(err,result){
                if(!result)return resolve([])
                resolve(result.data)
              })
          }
        }
      }
    );
  });
}

function getAllMenus() {
  return new Promise((resolve, reject) => {
    db.query(
      `select * from app_menu where status='1' and parent_id=0`,
      (error, rows, fields) => {
        if (!!error) {
          dbFunc.connectionRelease;
          resolve(error);
        } else {
          dbFunc.connectionRelease;
          // console.log(rows);
          resolve(rows);
        }
      }
    );
  });
}
function getAllHostDetails() {
  return new Promise((resolve, reject) => {
    db.query(
      `select infra_vm_host.*,infra_vdc.vdc_name,infra_vdc.vdc_location from infra_vm_host inner join infra_vdc on infra_vm_host.vdc_id = infra_vdc.vdc_id order by infra_vm_host.id desc`,
      (error, rows, fields) => {
        if (!!error) {
          dbFunc.connectionRelease;
          resolve(error);
        } else {
          dbFunc.connectionRelease;
          // console.log(rows);
          resolve(rows);
        }
      }
    );
  });
}
async function zabixApiApplicationGet(zabbix_server, hostid,callback){
  const { ZabbixClient } = require("zabbix-client");
  const client = new ZabbixClient(zabbix_server[0].server_name);
  const api = await client.login(zabbix_server[0].username, zabbix_server[0].password);
  const cpuGraphs = await api.method("application.get").call({
      'output':'extend',
      "hostids": hostid
  });
  // console.log(cpuGraphs);
  await api.logout();
  callback(cpuGraphs);
}

async function zabixApiItemGet(zabbix_server, hostid, appid,callback){
  const { ZabbixClient } = require("zabbix-client");
  const client = new ZabbixClient(zabbix_server[0].server_name);
  const api = await client.login(zabbix_server[0].username, zabbix_server[0].password);
  const itemgets = await api.method("item.get").call({
      'output':'extend',
      "hostids": hostid,
      "applicationids" : appid,
      "filter" : {
          "status" : "0"
      }
  });
  await api.logout();
  await callback(itemgets);
}

async function getHostParameterList(cloud_host_id, appid,callback) {
  return new Promise((resolve, reject) => {
    db.query("select parameter_id from zabbix_monitoring_items  where cloud_host_id = '"+cloud_host_id+"' AND application_id = '"+appid+"' AND status=1", (error, rows, fields) => {
      if (!!error) {
        dbFunc.connectionRelease;
        resolve(error);
      } else {
        dbFunc.connectionRelease;
        // console.log(rows);
        response = [];
        for(key in rows) {
          response[key]=rows[key].parameter_id;
        }
        return callback(response);
      }
    });
  });
}
function setEnableDisable(action, id, value) {
  var sqlquery = "";
  return new Promise((resolve, reject) => {
    switch (action) {
      case "esxistatus":
        sqlquerry =
          "Update infra_vm_host set status='" + value + "' where Id=" + id;
        console.log(sqlquery);
        break;
      case "networkstatus":
        value == "Activate" ? (status = 1) : (status = 0);
        sqlquerry =
          "Update infra_network set status='" + status + "' where Id=" + id;
        break;
      case "datastore":
        value == "Activate" ? (status = "A") : (status = "I");
        sqlquerry =
          "Update infra_vm_datastore set status='" +
          status +
          "' where id=" +
          id;
        console.log(sqlquerry);
        break;
      case "serverstatus":
        value == "Activate" ? (status = "A") : (status = "I");
        sqlquerry =
          "Update veeam_server set status='" +
          status +
          "' where id=" +
          id;
        console.log(sqlquerry);
        break;
      default:
        sqlquery = "";
    }
    db.query(sqlquerry, (error, rows, fields) => {
      if (!!error) {
        dbFunc.connectionRelease;
        resolve(error);
      } else {
        dbFunc.connectionRelease;
        resolve(rows);
      }
    });
  });
}

function loginTokenUpdate(token, id) {
  let ts = Math.floor(Date.now() / 1000);
  return new Promise((resolve, rejects) => {
    let sqlquerry =
      "Update app_client_users set logintokenid='" +
      token +
      "',tokengen_date='" +
      ts +
      "' where id=" +
      id;
    db.query(sqlquerry, (error, rows, fields) => {
      if (!!error) {
        dbFunc.connectionRelease;
        resolve(error);
      } else {
        dbFunc.connectionRelease;
        resolve(rows);
      }
    });
  });
}

getIPSCount = callback => {
  //return new Promise((resolve, reject) => {
  let sql = `select count(*) as total from infra_ipam `;
  db.query(sql, (error, rows, fields) => {
    if (!!error) {
      dbFunc.connectionRelease;
      resolve(error);
    } else {
      dbFunc.connectionRelease;
      callback(rows[0]["total"]);
    }
  });
  // });
};

getVcenterCount = callback => {
  //return new Promise((resolve, reject) => {
  let sql = `select count(*) as total from infra_vdc `;
  db.query(sql, (error, rows, fields) => {
    if (!!error) {
      dbFunc.connectionRelease;
      resolve(error);
    } else {
      dbFunc.connectionRelease;
      callback(rows[0]["total"]);
    }
  });
  // });
};

getAcviveVMInfo = callback => {
  let sql = `select count(*) as total from infra_vms where status IN('PowerOn','Running','Stopped','UnderCreation','PowerOff','UnsupportedCluster','Saved','UpdateFailed','IncompleteVMConfig','ShutDown','Suspend','Rebooting','Hold') `;
  db.query(sql, (error, rows, fields) => {
    if (!!error) {
      dbFunc.connectionRelease;
      callback(error);
    } else {
      dbFunc.connectionRelease;
      callback(rows[0]["total"]);
    }
  });
};

getPrivateIPCount = callback => {
  let sql = `select count(*) as total from infra_private_ipam `;
  db.query(sql, (error, rows, fields) => {
    if (!!error) {
      dbFunc.connectionRelease;
      callback(error);
    } else {
      dbFunc.connectionRelease;
      callback(rows[0]["total"]);
    }
  });
};

getNetworkCount = callback => {
  let sql = `select count(*) as total from infra_network where status='1' `;
  db.query(sql, (error, rows, fields) => {
    if (!!error) {
      dbFunc.connectionRelease;
      callback(error);
    } else {
      dbFunc.connectionRelease;
      callback(rows[0]["total"]);
    }
  });
};

getDataStores = callback => {
  let sql = `select count(*) as total from infra_vm_datastore `;
  db.query(sql, (error, rows, fields) => {
    if (!!error) {
      dbFunc.connectionRelease;
      callback(error);
    } else {
      dbFunc.connectionRelease;
      callback(rows[0]["total"]);
    }
  });
};
getEsxiHostsCount = callback => {
  let sql = `select count(*) as total from infra_vm_host `;
  db.query(sql, (error, rows, fields) => {
    if (!!error) {
      dbFunc.connectionRelease;
      callback(error);
    } else {
      dbFunc.connectionRelease;
      callback(rows[0]["total"]);
    }
  });
};
function getDashboard() {
  return new Promise((resolve, rejects) => {
    const respdata = [];
    getVcenterCount(function(results) {
      console.log(results);
      respdata["vcenters"] = results;
      getIPSCount(function(ipcount) {
        respdata["ipcount"] = ipcount;
        getPrivateIPCount(function(privateips) {
          respdata["privateips"] = privateips;
          getAcviveVMInfo(function(vmcount) {
            respdata["vmcount"] = vmcount;
            getNetworkCount(function(nwcount) {
              respdata["nwcount"] = nwcount;
              getDataStores(function(datastorecount) {
                respdata["datastores"] = datastorecount;
                getEsxiHostsCount(function(esxicount) {
                  respdata["esxicount"] = esxicount;
                  resolve(respdata);
                });
              });
            });
          });
        });
      });
    });
  });
}
function getSubmenus(menu) {
  let sql = `select id,menu_name,url,menu_icon as icon,parent_id from app_menu where status=1 and parent_id =${
    menu["id"]
  }`;
  //console.log(sql);
  return new Promise((resolve, rejects) => {
    db.query(sql, (error, rows, fields) => {
      if (!!error) {
        dbFunc.connectionRelease;
        resolve(error);
      } else {
        dbFunc.connectionRelease;
        menu["submenus"] = rows;
        resolve(menu);
      }
    });
  });
}
function getMenusByList(menucsv) {
  // console.log(menucsv);
  let sql = `select id,menu_name,url,menu_icon as icon,parent_id,have_child from app_menu where status=1 and id in(${menucsv}) and parent_id=0 order by sort_order asc`;
  return new Promise((resolve, rejects) => {
    db.query(sql, (error, rows, fields) => {
      if (!!error) {
        dbFunc.connectionRelease;
        resolve(error);
      } else {
        dbFunc.connectionRelease;
        resolve(rows);
      }
    });
  });
}
function getUserMenus(userid) {
  let sql =
    "select app_profile_templates.profile_menu_list from app_user_profile_mapping "
    +" inner join app_profile_templates  on app_user_profile_mapping.profile_id = app_profile_templates.profile_id "
    +" where app_user_profile_mapping.user_id='" +userid +"'";
  return new Promise(async (profileResolve, rejects) => {
    db.query(sql, async (error, rows, fields) => {
      if (!!error) {
        dbFunc.connectionRelease;
        profileResolve(error);
      } else {
        dbFunc.connectionRelease;
        if (rows.length > 0) {
          let menus = JSON.parse(rows[0]["profile_menu_list"]);
          let strmenus = menus.toString();
          const menusData = await new Promise((menuResolve, rejects) => {
            db.query(`select id,menu_name,url,menu_icon as icon,parent_id,have_child from app_menu where status=1 and ((id in(${strmenus}) and parent_id=0) || parent_id in(${strmenus})) order by parent_id asc, sort_order asc`, (error, rows, fields) => {
              if (!!error) {
                dbFunc.connectionRelease;
                menuResolve(error);
              } else {
                dbFunc.connectionRelease;
                let menusFormatted = [], menusFormattedNew = [];
                rows.forEach(function(val,key) {
                  if(val.parent_id == 0){
                    menusFormatted[val.id] = val;
                  }else if(typeof menusFormatted[val.parent_id] !='undefined'){
                    if(typeof menusFormatted[val.parent_id]["submenus"] == "undefined"){
                      menusFormatted[val.parent_id]["submenus"] = [];
                    }
                    menusFormatted[val.parent_id]["submenus"].push(val);
                  }
                });
                menusFormatted.forEach(function(val,key) {
                  if(val != null){
                    menusFormattedNew.push(val);
                  }
                });
                menuResolve(menusFormattedNew);
              }
            });
          });
          profileResolve(menusData);
        } else {
          console.log("Now Rows");
        }
      }
    });
  });
}

async function getBudgetAlertList(req) {

  let { clientid } = req;
  let { cloudName } = req.params;

  return new Promise(async function(resolve, reject){
      try{

          let checkStatusQuery;
          if(cloudName == 'Azure')
          checkStatusQuery = `select * from c4_clients where azure_linked = 1 and id = :clientid`;
          else if(cloudName == 'AWS')
          checkStatusQuery = `select * from c4_clients where is_aws_enabled = 1 and id = :clientid`;
          else if(cloudName == 'GCP')
          checkStatusQuery = `select * from c4_clients where is_gcp_enabled = 1 and id = :clientid`;

          let checkStatus = await dbHandler.executeQueryv2(checkStatusQuery, { clientid: clientid });
          if(!checkStatus.length) throw ({ type: "custom", message: `${cloudName} is not enabled`, status: 400 });
 
          let sql = `select alert_info from c4_other_cloud_budgets as cb where cb.clientid = :clientid and cb.cloud_id = (select id FROM c4_cloud_names where cloud_name = :cloud_name )`

          let list = await dbHandler.executeQueryv2(sql, { clientid: clientid, cloud_name: cloudName });
          list = list.length && list[0]['alert_info'] ? JSON.parse(list[0]['alert_info']): [
            { alert_percentage: "50" },
            { alert_percentage: "75" },
            { alert_percentage: "90" }];

          let response = {status:"success", message:'budget alert list', data : list, count: list.length};
          resolve(response);
      }
      catch(error){
          resolve(error);
      }
      
  });
    

}

async function updateBudgetAlertList(req) {

  let { clientID, cloudName } = req.params;
  let { user_id, alert_info } = req.body;
  let { clientid } = req;

  return new Promise(async function(resolve, reject){
      try{
          let getBudgetAlertQuery = `select * from c4_other_cloud_budgets as cb where cb.clientid = :clientid and cb.cloud_id = 
                                    (select id FROM c4_cloud_names where cloud_name = :cloud_name )`;

          let oldBudgetAlert = await dbHandler.executeQueryv2(getBudgetAlertQuery, { 
                                  clientid: clientid, 
                                  cloud_name: cloudName 
                                });

         
          let updateBudgetQuery = `update c4_other_cloud_budgets as cb set alert_info = :alert_info, modified_date = :modified_date where cb.clientid = :clientid and cb.cloud_id =
                                      (select id FROM c4_cloud_names where cloud_name = :cloud_name )`;
          let updateBudgetAlert = await dbHandler.executeQueryv2(updateBudgetQuery, { 
                                    alert_info: JSON.stringify(alert_info), 
                                    clientid: clientid, 
                                    cloud_name: cloudName,
                                    modified_date: (new Date().getTime()/ 1000),
                                  });

          let newBudgetAlert = await dbHandler.executeQueryv2(getBudgetAlertQuery, { 
                                  clientid: clientid, 
                                  cloud_name: cloudName 
                                });

          let logQuery = `insert into c4_client_edit_update_log(clientid, ref_id, activity_type, old_value, new_value, createddate, staff_id) 
                          values (:clientid, :ref_id, :activity_type, :old_value, :new_value, :created_date, :user_id)`;
          let insertLog = await dbHandler.executeQueryv2(logQuery, { 
                            clientid: clientid, 
                            ref_id: oldBudgetAlert[0]['id'], 
                            activity_type: 'OTHER_CLOUD_BUDGET', 
                            old_value: JSON.stringify(oldBudgetAlert[0]),
                            new_value: JSON.stringify(newBudgetAlert[0]),
                            created_date: (new Date().getTime()/ 1000),
                            user_id: user_id
                          });


          let response = {status:"success", message:'budget alert list updated', data : newBudgetAlert, count: 0};
          resolve(response);
      }
      catch(error){
          resolve(error);
      }
      
  });
    

}

let azure_authtoken=(clientid,callback)=>{
	console.log("222222222222 enter");
  if(typeof clientid == 'undefined'){
      callback(null,[]);
  }else{
    new Promise(function(resolve,reject){
        dbHandler.getOneRecord('c4_clients',{id:clientid},function(result){
            resolve(result)
        })
    }).then(function(config){
    	if(!config){
    		return callback(null,{data:[],tokendata:[],message:'The operation did not execute as expected. Please raise a ticket to support',clientdata:config});
    	}
      var crypto = require('crypto');
      config.mdclientid = crypto.createHash('md5').update(""+config.id).digest("hex");
      config.base64_clientid = base64.encode (config.id);
      // console.log("config");
      // console.log(config);
        var currentTime=Math.floor(Date.now() / 1000);
        var sql=`select * from azure_auth_tokens where client_id='${config.azure_clientid}' and 
        tenant_id='${config.azure_tenantid}' and expires_on > ${currentTime}  order by id desc limit 1`;
        // console.log("sql");
        // console.log(sql);
        dbHandler.executeQuery(sql,function(results){
        // console.log("results");
        // console.log(results);
        if(results.length > 0){
            var response={data:results[0].id,tokendata:results[0],message:'Token Exists',clientdata:config};
            // console.log("ifff response");
            // console.log(response);
            return callback(null,response)
        }else{
          var options={
            tenant_id:config.azure_tenantid,
            grant_type:config.azure_granttype,
            client_id:config.azure_clientid,
            client_secret:config.azure_clientsecretkey,
            resource:config.azure_resource,
          }
          getDirectAzureAccessToken(options,async function(error,result){
            if (error) {
                return callback(null,{data:error,tokendata:[],message:result,clientdata:config})
            }else{
                try{
                   var body=JSON.parse(result);
                }catch(e){
                  var body=result;
                }
                //console.log(body)
                var tokendata={
                token_type:body.token_type,
                expires_in:body.expires_in,
                expires_on:body.expires_on,
                resource:body.resource,
                tenant_id:config.azure_tenantid,
                client_id:config.azure_clientid,
                access_token:body.access_token
                }
                dbHandler.insertIntoTable('azure_auth_tokens',tokendata,function(err,result){
                if(err)return callback(null,{data:result,tokendata:tokendata,message:'The operation did not execute as expected. Please raise a ticket to support',clientdata:config})
                var response={data:result,tokendata:tokendata,message:'Token Created Successfully',clientdata:config}
                return callback(null,response)
                })
            }
          });
        }
      });
    }); 
  }
}
function getDirectAzureAccessToken(regData,callback){
  var options={
    tenant_id:regData.tenant_id,
    grant_type:regData.grant_type,
    client_id:regData.client_id,
    client_secret:regData.client_secret,
    resource:regData.resource,
  }
  var url='https://login.microsoftonline.com/'+options.tenant_id+'/oauth2/token';
  request.post({
    url:url, 
    body:querystring.stringify(options)},
    function optionalCallback(err, httpResponse, result) {
      //console.log("result");
      //console.log(result);
      if(err){
        callback(1,"Invalid token request");
      }else{
        result = JSON.parse(result);
        if(result.access_token && result.access_token != ''){
          callback(null,result);
        }else{
          callback(1,"Invalid token request");
        }
      }
    }
  );
}

module.exports = {
	getAllVdcLocations: getAllVdcLocations,
	getDashboardCounts: getDashboardCounts,
	getAllDataStores: getAllDataStores,
	getAllMenus: getAllMenus,
	getAllHostDetails: getAllHostDetails,
	setEnableDisable: setEnableDisable,
	loginTokenUpdate: loginTokenUpdate,
	getDashboard: getDashboard,
	getUserMenus:getUserMenus,
	getSubmenus,getVmListArr,
	zabixApiApplicationGet:zabixApiApplicationGet,
	zabixApiItemGet:zabixApiItemGet,
	getHostParameterList:getHostParameterList,
	getDatastoreDetail:getDatastoreDetail,
	getHostDetail:getHostDetail,
	datastoreUnderHost:datastoreUnderHost,
	hostUnderDatastore:hostUnderDatastore,
	getOptionConfigData:getOptionConfigData,
	getAzureSubscriptions : getAzureSubscriptions,
	getAzureSubscriptionLocations : getAzureSubscriptionLocations,
	getClientDocuments,
	getBudgetAlertList: getBudgetAlertList,
	updateBudgetAlertList: updateBudgetAlertList,
	getOptionConfigJsonData,
	getEmailTemplate,
	getFaqSearchList, getFaqList,
	azure_authtoken,
	getDirectAzureAccessToken
};