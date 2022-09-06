const mysql = require("mysql");
const config=require('./constants');
const ucpEncryptDecrypt=require('./ucpEncryptDecrypt');

module.exports = mysql.createPool({
  host: config.DB.host,
  user: config.DB.user,
  password: ucpEncryptDecrypt.ucpDecryptForDb(config.DB.password),
  database: config.DB.database,
  timezone: 'utc',
  dateStrings: ['DATE','DATETIME'],
  connectionLimit : 1000
});