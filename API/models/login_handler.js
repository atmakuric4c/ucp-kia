const dblib = require("./dbHandler");
var md5 = require("md5");
let loginStatus = false;

destroyOldTokens = function(id) {
  let ts = Math.round(new Date().getTime() / 1000);
  dblib.updateTableData(
    "c4_staff_login_tokens",
    { userid: id, status: 1 },
    { status: 0, updateddate: ts }
  );
};
generateLoginToken = (user, callback) => {
  // console.log("User ID " + user.id);
  destroyOldTokens(user.Id);
  let ts = Math.round(new Date().getTime() / 1000);
  dblib.insertIntoTable(
    "c4_staff_login_tokens",
    {
      userid: user.Id,
      token_id: ts,
      createddate: ts
    },
    function(status, tokendata) {
      callback(status, ts);
    }
  );
};

loginVerify = (userName, password, callback) => {
  let tokenD;

  dblib.getOneRecord(
    "staff_users",
    { emailid: userName, mdpwd: md5(password), record_status: 1 },
    function(data) {
      if (data != null) {
        callback(null, data);
      } else {
        callback("error", data);
      }
    }
  );
};

function loginCheckWithTokenGen(userName, password, callback) {
  loginVerify(userName, password, function(status, data) {
    callback(null, data);
  });
}

module.exports = {
  loginVerify: loginVerify,
  loginCheckWithTokenGen: loginCheckWithTokenGen,
  generateLoginToken: generateLoginToken
};
