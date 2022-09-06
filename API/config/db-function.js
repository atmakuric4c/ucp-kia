var db = require('./database');
const mysql = require("mysql");
const config=require('./constants');
const ucpEncryptDecrypt=require('./ucpEncryptDecrypt');
//console.log("db",db);

function connectionCheck() {
    return new Promise((resolve,reject) => {
      db.getConnection(function(err, connection) {
          if(err) {
               if(connection) connection.release();
//               reconnect(db)
             reject(err)
          } else  {
            resolve('Connection Established successfully')
          }
      })
    })
}

//- Reconnection function
function reconnect(db){
	try{
	    console.log("\n New connection tentative...");
	    console.trace(db);
	
	    //- Destroy the current connection variable
	    if(db) db.destroy();
	//    db.on('release', function (connection) {
	//        console.log('Connection %d released', connection.threadId);
	//    });
	//    db.end(function (err) {
	//	  // all connections in the pool have ended
	//    	console.log('all connections in the pool have ended');
	//	});
	
	    //- Create a new one
	    var db = mysql.createPool({
	    	  host: config.DB.host,
	    	  user: config.DB.user,
	    	  password: ucpEncryptDecrypt.ucpDecryptForDb(config.DB.password),
	    	  database: config.DB.database,
	    	  timezone: 'utc',
	    	  dateStrings: ['DATE','DATETIME'],
	    	  connectionLimit : 1000
	    	});
	
	    //- Try to reconnect
	    db.getConnection(function(err, connection) {
	        if(err) {
	        	//- Try to connect every 2 seconds.
	            setTimeout(reconnect, 2000);
	       } else  {
	    	   console.log("\n\t *** New connection established with the database. ***")
	           return db;
	       }
	   })
	}catch(e){
		console.log(e);
	}
}

function connectionRelease() {
//	db = reconnect(db);
    db.on('release', function (connection) {
        console.log('Connection %d released', connection.threadId);
    });
  //- Error listener
//    db.on('error', function(err) {
//
//        //- The server close the connection.
//        if(err.code === "PROTOCOL_CONNECTION_LOST"){    
//            console.log("/!\\ Cannot establish a connection with the database. /!\\ ("+err.code+")");
//            db = reconnect(db);
//        }
//
//        //- Connection in closing
//        else if(err.code === "PROTOCOL_ENQUEUE_AFTER_QUIT"){
//            console.log("/!\\ Cannot establish a connection with the database. /!\\ ("+err.code+")");
//            db = reconnect(db);
//        }
//
//        //- Fatal error : connection variable must be recreated
//        else if(err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"){
//            console.log("/!\\ Cannot establish a connection with the database. /!\\ ("+err.code+")");
//            db = reconnect(db);
//        }
//
//        //- Error because a connection is already being established
//        else if(err.code === "PROTOCOL_ENQUEUE_HANDSHAKE_TWICE"){
//            console.log("/!\\ Cannot establish a connection with the database. /!\\ ("+err.code+")");
//        }
//
//        //- Anything else
//        else{
//            console.log("/!\\ Cannot establish a connection with the database. /!\\ ("+err.code+")");
//            db = reconnect(db);
//        }
//
//    });
}

function keepAlive(){
	db.getConnection(function(err, connection){
		console.log("triggered keepAlive fn");
    if(err) { return; }
    connection.ping();
//    connection.end();
    connection.release();
  });
}
setInterval(keepAlive, 30000);

module.exports = {
    connectionCheck:connectionCheck(),
    connectionRelease:connectionRelease()   
}
