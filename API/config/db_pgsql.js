var pg=require('pg')
/*const dbConfig = {
  host: 'localhost',
  user: 'test',
  database: 'testdb', 
  password: 'testingpasa', 
  port: 5432 
};*/
  exports.executeSql = function(sql,vdc, callback) {
    if(!vdc.db_host)return callback('vdc information not available.',null)
    var dbConfig = {
      host: vdc.db_host,
      user: vdc.db_user,
      database: vdc.db_name, 
      password: vdc.db_pass
    };
    var pgpool = new pg.Pool(dbConfig);
    pgpool.connect(function(err,client,done) {
      if(err){
          //console.log("Not able to get connection "+ err);
          return callback(err,null)
      } 
      client.query(sql ,function(err,result) {
         //call `done()` to release the client back to the pool
          done(); 
          if(err){
              return callback(err,null)
          }
          return callback(null,result)
      });
   });
  };
