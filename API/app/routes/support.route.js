var schema = require("../schema/userValidationSchema.json");
var iValidator = require("../../common/iValidator");
var errorCode = require("../../common/error-code");
var errorMessage = require("../../common/error-methods");
var mail = require("./../../common/mailer.js");
const supportService = require("../services/support.service");
const myshiftUrl = "http://myshifttest.ctrls.in/";
var multer = require("multer");
let fs = require("fs");
const ticketType = 1; // Temp 1 => Internal , 2 => External
const Tickettypeid = 2; //2 => Task
const priority = 618; // ==>p3
const auth_key = "e10adc3949ba59abbe56e057f20f883e";
//const curl = new (require("curl-request"))();

function init(router) {
//  router.route("/getSupportTickets").get(getAllSupportTickets);
//  router.route("/getTicketDetails").post(getTicketDetails);
//  router.route("/submitTicket").post(submitTicket);
}

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "public");
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
//function getAllSupportTickets(req, res) {
//  var token = req.headers["authorization"];
//
//  if (token) {
//    token = token.slice(7, token.length);
//    supportService.getUsersbyToken(token).then(data => {
//      // console.log(data);
//      let emails = "";
//      data.map((item, key) => {
//        //  console.log(`key ${key}`);
//        if (key != 0) emails = emails + "," + item.email;
//        else emails = item.email;
//      });
//      if (emails != "") {
//        curl
//          .setHeaders([
//            "user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36"
//          ])
//          .get(
//            myshiftUrl +
//              "core_api_myshift/api.php/?x=get_ticketdetails_useremail_api&email=" +
//              emails
//          )
//          .then(({ statusCode, body, headers }) => {
//            // console.log(body); // , body, headers
//            if (body.status == "Success" && statusCode == 200) {
//              // console.log("=========" + JSON.stringify(body.Ticketdetails));
//              let tikets = JSON.stringify(body.Ticketdetails);
//              res.send(tikets);
//            } else {
//              res.status(500).send({ message: "Unable to fetch support Data" });
//            }
//          })
//          .catch(e => {
//            //console.log(e);
//          });
//      } else {
//        res.status(500).send({ message: "Unable to fetch support Data" });
//      }
//    });
//  } else {
//    res.status(500).send({ message: "Token Verification Failed" });
//  }
//}
//
//function getTicketDetails(req, res) {
//  if (req.body.maskid) {
//    let endurl =
//      myshiftUrl +
//      "core_api/api.php/?x=ticketdetails_api&maskid=" +
//      req.body.maskid;
//    //endurl =
//    // "http://myshifttest.ctrls.in/core_api/api.php/?x=ticketdetails_api&maskid=PDN-943-41774";
//    console.log(endurl);
//    curl
//      .setHeaders([
//        "user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36"
//      ])
//      .get(endurl)
//      .then(({ statusCode, body, headers }) => {
//        console.log(body); // , body, headers
//        if (body.status == "Success" && statusCode == 200) {
//          // console.log("=========" + JSON.stringify(body.Ticketdetails));
//          let tikets = JSON.stringify(body.result);
//          res.send(tikets);
//        } else {
//          res.status(500).send({ message: "Unable to fetch support Data" });
//        }
//      })
//      .catch(e => {
//        //console.log(e);
//      });
//  } else {
//    res.status(500).send("Invalid ticket");
//  }
//}
//
//function submitTicket(req, res) {
//  //console.log(submitImages);
//  const subject = req.body.data.subject.trim();
//  const description = req.body.data.description.trim();
//  const issue_type = req.body.data.issue_type;
//  const vm = req.body.data.vm;
//  const prority = req.body.data.prority;
//  if (subject.length > 3 && description.length > 3) {
//    var token = req.headers["authorization"];
//
//    if (token) {
//      token = token.slice(7, token.length);
//      supportService.getUserInfobyToken(token).then(userinfo => {
//        console.log(userinfo.email);
//        if (userinfo.email) {
//          const email = userinfo.email;
//          let attachments = [];
//          let names = [];
//          let submitImages = {};
//          req.body.files.map((file, key) => {
//            let data = file.base64;
//            let fileType = file.type;
//            let fileExt = fileType.split("/").pop();
//            let base64Image = data.split(";base64,").pop();
//            var date = new Date();
//            var timestamp = date.getTime();
//            var postFiles = timestamp + "_" + file.name;
//            fs.writeFile(
//              postFiles,
//              base64Image,
//              { encoding: "base64" },
//              function(err) {
//                console.log("File created");
//              }
//            );
//            attachments.push(postFiles);
//            names.push(file.name);
//          });
//          // if (attachments.length > 0) {
//          submitImages["tmp_name"] = attachments;
//          submitImages["name"] = names;
//          // }
//          //  console.log(JSON.stringify(submitImages));
//          // setTimeout(function() {
//          //  console.log("timeout completed");
//          //}, 5000);
//          // res.send({ message: "Ticket Posted Successfully" });
//          console.log(email);
//          curl
//            .setHeaders([
//              //  "Content-Type: multipart/form-data",
//              "user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
//              "auth-key : " + auth_key
//            ])
//            .setBody({
//              subject: subject,
//              description:
//                "Issue Type : " +
//                issue_type +
//                "    VM Name :" +
//                vm +
//                "   " +
//                description,
//              user_email: email,
//              type: ticketType,
//              tickettypeid: Tickettypeid,
//              department_id: 223,
//              priority: prority
//              // "attachment[0]": JSON.stringify(attachments)
//            })
//            .post(myshiftUrl + "index.php/api/ticket/createopfticket")
//            .then(({ statusCode, body, headers }) => {
//              console.log(body, statusCode);
//              res.status(200).send({
//                message: "Ticket Posted Successfully"
//              });
//            })
//            .catch(e => {
//              console.log(e);
//            });
//        } else {
//          res.status(500).send({
//            message: "Session Token Expired Login Again"
//          });
//        }
//      });
//    }
//  } else {
//    res.status(500).send({
//      message:
//        "Invalid ticket information minimun subject and description 4 characters"
//    });
//  }
//}


//function getAllSupportTickets(req, res) {
//	  var token = req.headers["authorization"];
//
//	  if (token) {
//	    token = token.slice(7, token.length);
//	    supportService.getUsersbyToken(token).then(data => {
//	      // console.log(data);
//	      let emails = "";
//	      data.map((item, key) => {
//	        //  console.log(`key ${key}`);
//	        if (key != 0) emails = emails + "," + item.email;
//	        else emails = item.email;
//	      });
//	      if (emails != "") {
//	    	 axios.defaults.headers.post['user-agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36';
//	          axios
//	          .get(myshiftUrl +
//	                  "core_api_myshift/api.php/?x=get_ticketdetails_useremail_api&email=" +
//	                  emails, querystring.stringify(vmdata))
//	          .then(async body => {
////	        curl
////	          .setHeaders([
////	            "user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36"
////	          ])
////	          .get(
////	            myshiftUrl +
////	              "core_api_myshift/api.php/?x=get_ticketdetails_useremail_api&email=" +
////	              emails
////	          )
////	          .then(({ statusCode, body, headers }) => {
//	             console.log(body); // , body, headers
//	            if (body.status == "Success" && statusCode == 200) {
//	              // console.log("=========" + JSON.stringify(body.Ticketdetails));
//	              let tikets = JSON.stringify(body.Ticketdetails);
//	              res.send(tikets);
//	            } else {
//	              res.status(500).send({ message: "Unable to fetch support Data" });
//	            }
//	          })
//	          .catch(e => {
//	            //console.log(e);
//	          });
//	      } else {
//	        res.status(500).send({ message: "Unable to fetch support Data" });
//	      }
//	    });
//	  } else {
//	    res.status(500).send({ message: "Token Verification Failed" });
//	  }
//	}
//
//	function getTicketDetails(req, res) {
//	  if (req.body.maskid) {
//	    let endurl =
//	      myshiftUrl +
//	      "core_api/api.php/?x=ticketdetails_api&maskid=" +
//	      req.body.maskid;
//	    //endurl =
//	    // "http://myshifttest.ctrls.in/core_api/api.php/?x=ticketdetails_api&maskid=PDN-943-41774";
//	    console.log(endurl);
//	    curl
//	      .setHeaders([
//	        "user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36"
//	      ])
//	      .get(endurl)
//	      .then(({ statusCode, body, headers }) => {
//	        console.log(body); // , body, headers
//	        if (body.status == "Success" && statusCode == 200) {
//	          // console.log("=========" + JSON.stringify(body.Ticketdetails));
//	          let tikets = JSON.stringify(body.result);
//	          res.send(tikets);
//	        } else {
//	          res.status(500).send({ message: "Unable to fetch support Data" });
//	        }
//	      })
//	      .catch(e => {
//	        //console.log(e);
//	      });
//	  } else {
//	    res.status(500).send("Invalid ticket");
//	  }
//	}
//
//	function submitTicket(req, res) {
//	  //console.log(submitImages);
//	  const subject = req.body.data.subject.trim();
//	  const description = req.body.data.description.trim();
//	  const issue_type = req.body.data.issue_type;
//	  const vm = req.body.data.vm;
//	  const prority = req.body.data.prority;
//	  if (subject.length > 3 && description.length > 3) {
//	    var token = req.headers["authorization"];
//
//	    if (token) {
//	      token = token.slice(7, token.length);
//	      supportService.getUserInfobyToken(token).then(userinfo => {
//	        console.log(userinfo.email);
//	        if (userinfo.email) {
//	          const email = userinfo.email;
//	          let attachments = [];
//	          let names = [];
//	          let submitImages = {};
//	          req.body.files.map((file, key) => {
//	            let data = file.base64;
//	            let fileType = file.type;
//	            let fileExt = fileType.split("/").pop();
//	            let base64Image = data.split(";base64,").pop();
//	            var date = new Date();
//	            var timestamp = date.getTime();
//	            var postFiles = timestamp + "_" + file.name;
//	            fs.writeFile(
//	              postFiles,
//	              base64Image,
//	              { encoding: "base64" },
//	              function(err) {
//	                console.log("File created");
//	              }
//	            );
//	            attachments.push(postFiles);
//	            names.push(file.name);
//	          });
//	          // if (attachments.length > 0) {
//	          submitImages["tmp_name"] = attachments;
//	          submitImages["name"] = names;
//	          // }
//	          //  console.log(JSON.stringify(submitImages));
//	          // setTimeout(function() {
//	          //  console.log("timeout completed");
//	          //}, 5000);
//	          // res.send({ message: "Ticket Posted Successfully" });
//	          console.log(email);
//	          curl
//	            .setHeaders([
//	              //  "Content-Type: multipart/form-data",
//	              "user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
//	              "auth-key : " + auth_key
//	            ])
//	            .setBody({
//	              subject: subject,
//	              description:
//	                "Issue Type : " +
//	                issue_type +
//	                "    VM Name :" +
//	                vm +
//	                "   " +
//	                description,
//	              user_email: email,
//	              type: ticketType,
//	              tickettypeid: Tickettypeid,
//	              department_id: 223,
//	              priority: prority
//	              // "attachment[0]": JSON.stringify(attachments)
//	            })
//	            .post(myshiftUrl + "index.php/api/ticket/createopfticket")
//	            .then(({ statusCode, body, headers }) => {
//	              console.log(body, statusCode);
//	              res.status(200).send({
//	                message: "Ticket Posted Successfully"
//	              });
//	            })
//	            .catch(e => {
//	              console.log(e);
//	            });
//	        } else {
//	          res.status(500).send({
//	            message: "Session Token Expired Login Again"
//	          });
//	        }
//	      });
//	    }
//	  } else {
//	    res.status(500).send({
//	      message:
//	        "Invalid ticket information minimun subject and description 4 characters"
//	    });
//	  }
//	}

module.exports.init = init;
