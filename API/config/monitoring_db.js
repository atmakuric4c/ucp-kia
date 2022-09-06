return 1;
const mysql = require("mysql");
var sql = require("sql-query"),
sqlQuery = sql.Query();
const config=require('./constants');
const ucpEncryptDecrypt=require('./ucpEncryptDecrypt');

const conn = mysql.createConnection({
  host:config.DB.mon_host,// "182.18.185.120",
  user:config.DB.mon_user,// "comDB",
  password: ucpEncryptDecrypt.ucpDecryptForDb(config.DB.mon_pass),// "ctrls@123",
  database:config.DB.mon_db// "ctrls_nagios"
});
conn.connect(function(err) {
  if (err) {
    //throw err;
    console.log("Monitoring DB Connection error");
  } else {
    console.log("Monitoring DB Connection Established successfully");
  }
});

getOneRecord = (tableName, whereCondition, callback) => {
  conn.connect(function(error) {
    var sqlSelect = sqlQuery.select();
    let My_Query = sqlSelect
      .from(tableName)
      .where(whereCondition)
      .build();
    //console.log(My_Query);
    conn.query(My_Query, function(err, results) {
      if(err)callback('The operation did not execute as expected. Please raise a ticket to support');
      try{
        var string = JSON.stringify(results);
        var json = JSON.parse(string);
        return callback(json[0]);
      }
      catch{
        if(results)
        return callback(results[0]);
        else
        return callback([]);
      }
    });
  });
};

insertIntoTable = (tableName, data, callback) => {
  conn.connect(function(error) {
    var sqlInsert = sqlQuery.insert();
    let My_Query = sqlInsert
      .into(tableName)
      .set(data)
      .build();
    //console.log(My_Query);
    conn.query(My_Query, function(err, results) {
      if(err)callback(400, 'The operation did not execute as expected. Please raise a ticket to support');
      try{
        var string = JSON.stringify(results);
        //console.log(">> string:  after Insert ", string);
        var json = JSON.parse(string);
        //  console.log(">> json: After Insert ", json);
        //console.log(">> Inserted data : ", json);
        callback(null, json.insertId);
      }
      catch{
        if(results)
        callback(null, results.insertId);
        else callback(400, 'The operation did not execute as expected. Please raise a ticket to support');
      }
    });
  });
};

updateTableData = function(tableName, where, data,callback) {
  conn.connect(function(error) {
    var sqlUpdate = sqlQuery.update();
    let My_Query = sqlUpdate
      .into(tableName)
      .set(data)
      .where(where)
      .build();
    //console.log(My_Query);
    conn.query(My_Query, function(err, results) {
      if(err)callback(400, 'The operation did not execute as expected. Please raise a ticket to support');
      try{
        var string = JSON.stringify(results);
        //console.log(">> string:  after Insert ", string);
        var json = JSON.parse(string);
        //  console.log(">> json: After Insert ", json);
        //console.log(">> Inserted data : ", json);
        callback(null, json.insertId);
      }
      catch{
        callback(null, results);
      }
    });
  });
};

executeQuery = (My_Query, callback) => {
  //console.log(My_Query);
  conn.connect(function(error) {
    conn.query(My_Query, function(err, results) {
      if(err)callback([]);
      try{
        var string = JSON.stringify(results);
        var json = JSON.parse(string);
        return callback(json);
      }
      catch{
        if(results)
        return callback(results);
        else
        return callback([]);
      }
    });
  });
};

module.exports = {
  getOneRecord: getOneRecord,
  insertIntoTable: insertIntoTable,
  updateTableData: updateTableData,
  executeQuery: executeQuery
};
