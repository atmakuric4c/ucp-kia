var db = require("../../config/database");
var dbFunc = require("../../config/db-function");

var supportModel = {
  getUsersbyToken: getUsersbyToken,
  getUserInfobyToken: getUserInfobyToken
};

function getUsersbyClientid(clientid, callback) {
  db.query(
    `select * from app_client_users where clientid='${clientid}'`,
    (error, rows, fields) => {
      if (!!error) {
        dbFunc.connectionRelease;
        reject(error);
      } else {
        callback(rows);
      }
    }
  );
}
function getUsersbyToken(token) {
  return new Promise((resolve, reject) => {
    db.query(
      `select * from app_client_users `, //where logintokenid='${token}'`,
      (error, rows, fields) => {
        if (!!error) {
          dbFunc.connectionRelease;
          reject(error);
        } else {
          dbFunc.connectionRelease;
          // console.log(rows);
          /* if (rows[0]["clientid"]) {
            const clientid = rows[0]["clientid"];
            getUsersbyClientid(clientid, function(data) {
              resolve(data);
            });
          }*/
          resolve(rows);
        }
      }
    );
  });
}

function getUserInfobyToken(token) {
  return new Promise((resolve, reject) => {
    db.query(
      `select * from app_client_users where logintokenid='${token}'`,
      (error, rows, fields) => {
        if (!!error) {
          dbFunc.connectionRelease;
          reject(error);
        } else {
          dbFunc.connectionRelease;
          // console.log(rows);
          resolve(rows[0]);
        }
      }
    );
  });
}

module.exports = supportModel;
