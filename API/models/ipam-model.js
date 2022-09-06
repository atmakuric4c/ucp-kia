var db = require("../../config/database");
var dbFunc = require("../../config/db-function");

var ipamModel = {
  getAllIP: getAllIP
};

function getAllIP() {
  return new Promise((resolve, reject) => {
    db.query(`select * from infra_ipam`, (error, rows, fields) => {
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
module.exports = ipamModel;
