var db = require("../../config/database");
var dbFunc = require("../../config/db-function");

var ipamModel = {
  getAllIP: getAllIP,
  addIpAddressipIpam: addIpAddressipIpam,
  getIPHistory: getIPHistory,
  getIpamPageData: getIpamPageData,
  getAllPrivateIP: getAllPrivateIP,
  addPrivateIpAddressipIpam: addPrivateIpAddressipIpam,
  getPrivateIPHistory: getPrivateIPHistory,
  getPrivateIpamPageData: getPrivateIpamPageData
};
//Public
function getAllIP() {
  return new Promise((resolve, reject) => {
    db.query(`select * from infra_ipam`, (error, rows, fields) => {
      if (!!error) {
        dbFunc.connectionRelease;
        reject(error);
      } else {
        dbFunc.connectionRelease;
        // console.log(rows);
        resolve(rows);
      }
    });
  });
}
function addIpAddressipIpam(ipData) {
  return new Promise(async (resolve, reject) => {
    await db.query(
      "INSERT INTO infra_ipam SET ?",
      ipData,
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

function getIPHistory(ipid) {
  return new Promise((resolve, reject) => {
    db.query(
      `select * from infra_ip_log where ip_address='${ipid}' order by id desc`,
      (error, data) => {
        if (error) {
          dbFunc.connectionRelease;
          reject(error);
        } else {
          dbFunc.connectionRelease;
          resolve(data);
        }
      }
    );
  });
}

getIPS = (page, pageSize, searchkey, callback) => {
  // return new Promise((resolve, reject) => {
  let sql = `select * from infra_ipam `;
  if (searchkey) sql = sql + ` where ip_address like '${searchkey}%' `;
  sql = sql + ` limit ${page},${pageSize}`;
  console.log(sql);
  db.query(sql, (error, rows, fields) => {
    if (!!error) {
      dbFunc.connectionRelease;
      // reject(error);
    } else {
      dbFunc.connectionRelease;
      callback(rows);
    }
  });
  // });
};
getIPSCount = callback => {
  //return new Promise((resolve, reject) => {
  let sql = `select count(*) as total from infra_ipam `;
  db.query(sql, (error, rows, fields) => {
    if (!!error) {
      dbFunc.connectionRelease;
      reject(error);
    } else {
      dbFunc.connectionRelease;
      callback(rows[0]["total"]);
    }
  });
  // });
};

function getIpamPageData(page, pageSize, filtered, sort) {
  return new Promise((resolve, reject) => {
    let respdata = [];
    getIPS(page, pageSize, sort, function(results) {
      respdata["rows"] = results;
      getIPSCount(function(res) {
        respdata["pages"] = res;
        resolve(respdata);
      });
    });
  });
}

//private

function getAllPrivateIP() {
  return new Promise((resolve, reject) => {
    db.query(`select * from infra_private_ipam`, (error, rows, fields) => {
      if (!!error) {
        dbFunc.connectionRelease;
        reject(error);
      } else {
        dbFunc.connectionRelease;
        // console.log(rows);
        resolve(rows);
      }
    });
  });
}
function addPrivateIpAddressipIpam(ipData) {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO infra_private_ipam SET ?",
      ipData,
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

function getPrivateIPHistory(ipid) {
  return new Promise((resolve, reject) => {
    db.query(
      `select * from infra_ip_log where ip_address='${ipid}' order by id desc`,
      (error, data) => {
        if (error) {
          dbFunc.connectionRelease;
          reject(error);
        } else {
          dbFunc.connectionRelease;
          resolve(data);
        }
      }
    );
  });
}

getPrivateIPS = (page, pageSize, searchkey, callback) => {
  // return new Promise((resolve, reject) => {
  let sql = `select * from infra_private_ipam `;
  if (searchkey) sql = sql + ` where ip_address like '${searchkey}%' `;
  sql = sql + ` limit ${page},${pageSize}`;
  //console.log(sql);
  db.query(sql, (error, rows, fields) => {
    if (!!error) {
      dbFunc.connectionRelease;
      // reject(error);
    } else {
      dbFunc.connectionRelease;
      callback(rows);
    }
  });
  // });
};
getPrivateIPSCount = callback => {
  //return new Promise((resolve, reject) => {
  let sql = `select count(*) as total from infra_private_ipam `;
  db.query(sql, (error, rows, fields) => {
    if (!!error) {
      dbFunc.connectionRelease;
      reject(error);
    } else {
      dbFunc.connectionRelease;
      callback(rows[0]["total"]);
    }
  });
  // });
};

function getPrivateIpamPageData(page, pageSize, filtered, sort) {
  return new Promise((resolve, reject) => {
    let respdata = [];
    getPrivateIPS(page, pageSize, sort, function(results) {
      respdata["rows"] = results;
      getPrivateIPSCount(function(res) {
        respdata["pages"] = res;
        resolve(respdata);
      });
    });
  });
}

module.exports = ipamModel;
