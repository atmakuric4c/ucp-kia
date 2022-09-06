var db = require("../../config/database");
var dbFunc = require("../../config/db-function");
const dbHandler = require("../../config/api_db_handler")
var settingsModel = {
  getEmailSettings,
  enableDisableEmail,
  addEmailConfig,
  getAllNetworks,
  addNetwork,getAllServers,addServer
};

function getEmailSettings() {
  return new Promise((resolve, reject) => {
    db.query(
      `select id,hostname,email,port,sender_name,
      CASE WHEN status=1 THEN 'Active'
       WHEN status=0 THEN 'InActive' else 'NA' end as status from app_email_settings`,
      (error, rows, fields) => {
        if (!!error) {
          dbFunc.connectionRelease;
          reject(error);
        } else {
          dbFunc.connectionRelease;
          resolve(rows);
        }
      }
    );
  });
}
function enableDisableEmail(id, status) {
  return new Promise((resolve, reject) => {
    let quer =
      `update app_email_settings set status='` +
      status +
      `' where id='` +
      id +
      `' limit 1`;
    db.query(quer, (error, rows, fields) => {
      if (!!error) {
        dbFunc.connectionRelease;
        reject(error);
      } else {
        dbFunc.connectionRelease;
        resolve(rows);
      }
    });
  });
}
function addEmailConfig(emailconf) {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO app_email_settings SET ?",
      emailconf,
      (error, rows, fields) => {
        if (error) {
          dbFunc.connectionRelease;
          reject(error);
        } else {
          dbFunc.connectionRelease;
          resolve(rows);
        }
      }
    );
  });
}

function getAllNetworks() {
  return new Promise((resolve, reject) => {
    db.query(
      `select id,display_name,network_name, firewall_vm_name,client_id,type, public_ip,external_interface,
        internal_interface,username,port, private_ip_start,private_ip_end, private_ip_gateway,private_ip_subnetmask,
        added_date,case when type='1' then 'Cisco' when type='2' then 'Fortigate' else 'NA' end as type,
      CASE WHEN status=1 THEN 'Active' WHEN status=0 THEN 'InActive' else 'NA' end as status from infra_network`,
      (error, rows, fields) => {
        if (!!error) {
          dbFunc.connectionRelease;
          reject(error);
        } else {
          dbFunc.connectionRelease;
          resolve(rows);
        }
      }
    );
  });
}

function addNetwork(data) {
  return new Promise(async (resolve, reject) => {
    var network=await new Promise(function(resolvedata, rejectdata){
      dbHandler.getOneRecord('infra_network',{network_name:data.network_name},function(result){
        resolvedata(result)
      })
    });
    if(network)
    return reject({message:'Network name already exists.',status:'Error'})
    var vdc=await new Promise(function(resolvedata, rejectdata){
      dbHandler.getOneRecord('infra_vdc',{vdc_id:data.vdc_id},function(result){
        resolvedata(result)
      })
    });
    db.query("INSERT INTO infra_network SET ?", data, (error, rows, fields) => {
      if (error) {
        dbFunc.connectionRelease;
        reject(error);
      } else {
        dbFunc.connectionRelease;
        resolve(rows);
      }
    });
  });
}
function getAllServers() {
  return new Promise((resolve, reject) => {
    db.query(
      `select vdc.vdc_name,ser.id,ser.ip_address,ser.username,ser.password,ser.db_host,ser.db_user,ser.db_password,
      ser.db_driver,ser.db_name,case when ser.server_type='B' then 'Backup' when 
      ser.server_type='R' then 'Replica' else 'NA' end as server_type,
      CASE WHEN ser.status='A' THEN 'Active' WHEN ser.status='I' THEN 'InActive' else 'NA' end as status
       from veeam_server as ser inner join infra_vdc as vdc on vdc.vdc_id=ser.vdc_id`,
      (error, rows, fields) => {
        if (!!error) {
          dbFunc.connectionRelease;
          reject(error);
        } else {
          dbFunc.connectionRelease;
          resolve(rows);
        }
      }
    );
  });
}

function addServer(data) {
  return new Promise(async (resolve, reject) => {
    var server=await new Promise(function(resolvedata, rejectdata){
      dbHandler.getOneRecord('veeam_server',{ip_address:data.ip_address,vdc_id:data.vdc_id,status:'A'},function(result){
        resolvedata(result)
      })
    });
    if(server)
    return reject({message:'Server already exists.',status:'Error'})
    db.query("INSERT INTO veeam_server SET ?", data, (error, rows, fields) => {
      if (error) {
        dbFunc.connectionRelease;
        reject(error);
      } else {
        dbFunc.connectionRelease;
        resolve(rows);
      }
    });
  });
}
module.exports = settingsModel;
