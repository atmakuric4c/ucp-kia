var sqlDb = require("mssql");
/*const dbConfig = {
    user: "sa",
    password: "sam",
    server: "localhost\\1433",
    database: "SampleDb",
    port: 1433
  };*/
exports.executeSql = function(sql,vdc, callback) {
  var dbConfig = {
    server: vdc.db_host,
    user: vdc.db_user,
    database: vdc.db_name, 
    password: vdc.db_pass
  };
  var conn = new sqlDb.ConnectionPool(dbConfig);
  conn.connect()
  .then(function() {
    var req = new sqlDb.Request(conn);
    req.query(sql)
    .then(function(recordset) {
      callback(recordset);
    })
    .catch(function(err) {
      //console.log(err);
      callback(null, err);
    });
  })
  .catch(function(err) {
    //console.log(err);
    callback(null, err);
  });
};
