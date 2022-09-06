const mysql = require("mysql");
var sql = require("sql-query"),
sqlQuery = sql.Query();
const config=require('./constants');
var db = require('./database');
var dbFunc = require('./db-function');

getOneRecord = (tableName, whereCondition, callback) => {
//  conn.connect(function(error) {
    var sqlSelect = sqlQuery.select();
    let My_Query = sqlSelect
      .from(tableName)
      .where(whereCondition)
      .build();
//	    console.log(My_Query);
    db.query(My_Query+" limit 1", function(err, results) {
    	dbFunc.connectionRelease;
      if(err){
        //console.log(My_Query);
        console.log(err);
        return callback('The operation did not execute as expected. Please raise a ticket to support');
      }
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
//  });
};

insertIntoTable = (tableName, data, callback) => {
//  conn.connect(function(error) {
    var sqlInsert = sqlQuery.insert();
    let My_Query = sqlInsert
      .into(tableName)
      .set(data)
      .build();
    db.query(My_Query, function(err, results) {
    	dbFunc.connectionRelease;
      if(err){
        //console.log(My_Query);
        console.log(err);
        return callback(400, 'The operation did not execute as expected. Please raise a ticket to support');
      }
      try{
        var string = JSON.stringify(results);
        //console.log(">> string:  after Insert ", string);
        var json = JSON.parse(string);
        //  console.log(">> json: After Insert ", json);
        //console.log(">> Inserted data : ", json);
        return callback(null, json.insertId);
      }
      catch(e){
        if(results)
        return callback(null, results.insertId);
        else  callback(400, 'The operation did not execute as expected. Please raise a ticket to support');
      }
    });
//  });
};

updateTableData = function(tableName, where, data,callback) {
//  conn.connect(function(error) {
    var sqlUpdate = sqlQuery.update();
    let My_Query = sqlUpdate
      .into(tableName)
      .set(data)
      .where(where)
      .build();
    //console.log(My_Query);
    db.query(My_Query, function(err, results) {
    	dbFunc.connectionRelease;
      if(err){
        //console.log(My_Query);
        console.log(err);
        return callback(400, 'The operation did not execute as expected. Please raise a ticket to support');
      }
      try{
        var string = JSON.stringify(results);
        //console.log(">> string:  after Insert ", string);
        var json = JSON.parse(string);
        //  console.log(">> json: After Insert ", json);
        //console.log(">> Inserted data : ", json);
        return callback(null, json.insertId);
      }
      catch(e){
        return callback(null, results);
      }
    });
//  });
};

executeQuery = (My_Query, callback) => {
  //console.log(My_Query);
//  conn.connect(function(error) {
    db.query(My_Query, function(err, results) {
    	dbFunc.connectionRelease;
      if(err){
        //console.log(My_Query);
        console.log(err);
        callback([]);
      }
      try{
        var string = JSON.stringify(results);
        var json = JSON.parse(string);
        return callback(json);
      }
      catch(e){
        if(results)
        return callback(results);
        else
        return callback([]);
      }
    });
//  });
};

function sqlEscapeFormatter(sql, values){
	if (!values) return sql;
	return sql.replace(/\:(\w+)/g, function (txt, key) {
	    if (values.hasOwnProperty(key)) {
	      return "'"+this.escape(values[key])+"'";
	    }
	    return "'"+txt+"'";
	}.bind(this));
}
executeQueryv2 = (sql, values) => {
  return new Promise(async function(resolve, reject){

    //Have used binding parameters in order to escape parameters in order to avoid SQL Injection
//	  db.config.connectionConfig.queryFormat = function (query, values) {
//        if (!values) return query;
//        return query.replace(/\:(\w+)/g, function (txt, key) {
//          if (values.hasOwnProperty(key)) {
//            return this.escape(values[key]);
//          }
//          return txt;
//        }.bind(this));
//      };
      //console.log("values --- ", values);
      let finalSql = sqlEscapeFormatter(sql, values);
      //console.log("finalSql --- ", finalSql);
   
//    db.query(sql, values, (error, rows, fields)=>{ 
    db.query(finalSql, (error, rows, fields)=>{
    	dbFunc.connectionRelease;
      if(error) {
          console.log("error", error);
          resolve(error);
      } else {
          let string = JSON.stringify(rows);
          let json = JSON.parse(string);
//          console.log("json --- ", json);
          resolve(json);
      }
    });
  
});
}

module.exports = {
  getOneRecord: getOneRecord,
  insertIntoTable: insertIntoTable,
  updateTableData: updateTableData,
  executeQuery: executeQuery,
  executeQueryv2: executeQueryv2
};
