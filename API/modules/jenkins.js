var express = require('express');
var router = express.Router();
const jenkinsapi = require('node-jenkins-api');
const config=require('../config/constants');
const ucpEncryptDecrypt=require('../config/ucpEncryptDecrypt');
var base64 = require('base-64');
const commonModel = require('../app/models/common.model');

let getJenkinsConn= async ()=>{
	let jenkins = "";
	await commonModel.getOptionConfigJsonData({option_type:"UCP_CONSTANTS"},async function(err, result){
//		console.log("result 1111111 --- ", result);
		if(!err && result.data){
			jenkins = result.data;
		}
		console.log("jenkins 1111111 --- ", jenkins);
	});
	console.log("jenkins 22222 --- ", jenkins);
	if(jenkins){
		return jenkinsapi.init(`${jenkins.JENKINS.Jenkins_protocal}://${jenkins.JENKINS.JenkinsUSERNAME}:${jenkins.JENKINS.JenkinsTOKEN}@${jenkins.JENKINS.JenkinsURL}`);
	}else{
		return {};
	}
}
router.get('/jenkinsQueue', async function(req, res, next) {
//router.route('/queue').get(function(req, res) {
	let jenkins = await getJenkinsConn();
    jenkins.queue(function(err, data) {
        if (err){ return console.log(err); }
       res.json({ message: data });
    });
});

router.get('/jenkinsQueueItem', async function(req, res, next) {
//router.route('/queue-item').post(function(req, res) {
    var queue_item_number = req.query.queue_item_number;
    let jenkins = await getJenkinsConn();
    jenkins.queue_item(queue_item_number, function(err, data) {
        if (err){ return console.log(err); }
       res.json({ message: data });
    });
});

router.post('/getJenkinsRecentBulids', async (req, res) => {
    let reqBody = await JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)),
      job_name = reqBody.job_name,
      page_num = reqBody.page_num,
      request = require('request'),
      axios = require('axios'),
      start = page_num === 1 ? 0 :  (page_num-1) * 20,
      end = start + 20;
    let UCP_CONSTANTS_DATA = "";
	await commonModel.getOptionConfigJsonData({option_type:"UCP_CONSTANTS"},async function(err, result){
//		console.log("result 1111111 --- ", result);
		if(!err && result.data){
			UCP_CONSTANTS_DATA = result.data;
		}
		console.log("UCP_CONSTANTS_DATA 1111111 --- ", UCP_CONSTANTS_DATA);
	});
	if(!UCP_CONSTANTS_DATA){
		console.log("UCP_CONSTANTS not found");
		return res.json(ucpEncryptDecrypt.ucpEncrypt({
	           data: {data: {}, lastIndex}
        }, req.query));
	}

	console.log("url -------- ", `${UCP_CONSTANTS_DATA.JENKINS.Jenkins_protocal}://${UCP_CONSTANTS_DATA.JENKINS.JenkinsURL}/job/${job_name}/api/json?tree=builds[result,id,building,actions[parameters[name,value]]]`);
	console.log(start, end)
//	let index 
	let basicAuth=base64.encode(`${UCP_CONSTANTS_DATA.JENKINS.JenkinsUSERNAME}:${UCP_CONSTANTS_DATA.JENKINS.JenkinsTOKEN}`);
	var options = {
	  'method': 'GET',
	  'url': `${UCP_CONSTANTS_DATA.JENKINS.Jenkins_protocal}://${UCP_CONSTANTS_DATA.JENKINS.JenkinsURL}/job/${job_name}/api/json?tree=builds[result,id,building,actions[parameters[name,value]]]{0,1}`,
	  'headers': {
	    'Authorization': `Basic ${basicAuth}`
	  },
	  'Content-Type': 'application/json',
	};
	let response = await axios(options).catch(e => {
	  lastIndex = 20;
    });

    response.body = response.data;
	lastIndex = ((response.body && response.body.builds && response.body.builds[0])?response.body.builds[0].id:0);
    
    console.log(`${UCP_CONSTANTS_DATA.JENKINS.Jenkins_protocal}://${UCP_CONSTANTS_DATA.JENKINS.JenkinsURL}/job/${job_name}/api/json?tree=builds[result,id,building,actions[parameters[name,value]]]{${start},${end}}`)
	
	if (end > lastIndex) {
      end= lastIndex;
    }
	options = {
	  'method': 'GET',
	  'url': `${UCP_CONSTANTS_DATA.JENKINS.Jenkins_protocal}://${UCP_CONSTANTS_DATA.JENKINS.JenkinsURL}/job/${job_name}/api/json?tree=builds[result,id,building,actions[parameters[name,value]]]{${start},${end}}`,
	  'headers': {
	    'Authorization': `Basic ${basicAuth}`
	  },
	  'Content-Type': 'application/json',
    };
    console.log(options)
	request(options, function (error, response) {
        //console.log(response);
        console.log('----------------------------')
      if (error) throw new Error(error);
      
      res.json(ucpEncryptDecrypt.ucpEncrypt({
           data: {data: JSON.parse(response.body), lastIndex}
         }, req.query));
	});
//	res.json({builds,});
});

router.get('/all-jobs', async function(req, res, next) {
	let jenkins = await getJenkinsConn();
	jenkins.all_jobs(function(err, data) {
        if (err){ return console.log(err); }
        
        res.json({ message: data });  
    });
});

router.post('/latest-builds-with-info', async function(req, res) {
	reqBody = await JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
    var job_name = reqBody.job_name;
   // console.log(job_name);
    let jenkins = await getJenkinsConn();
    jenkins.all_builds(job_name, async function(err, data) {
        if (err){ return console.log(err); }
        updatedData = [];
        $recordsUpto = 0;
        for await (const item of data) {
//        	console.log("item.id -- ",item.id);
        	item.result = ((!item.result || item.result == '')?"In-Progress":item.result);
        	buildDataRes = await new Promise(async function(innerResolve, innerReject){
	        	jenkins.build_info(job_name, item.id, function(err, buildData) {
//	        		console.log("buildData -- ",buildData);
	                if (err){  
	                	console.log(err); 
	                	innerResolve(err);
	                }else{
	                	innerResolve(buildData);
	                }
	            });
        	});
        	updatedData.push({item,buildDataRes})
        	$recordsUpto++;
            if($recordsUpto == 5){
            	break;
            }
        }
         res.json(ucpEncryptDecrypt.ucpEncrypt({ data: updatedData }, req.query));
    });
});  

router.post('/all-builds',async function(req, res) {
    var job_name = req.body.job_name;
   // console.log(job_name);
    let jenkins = await getJenkinsConn();
    jenkins.all_builds(job_name, function(err, data) {
        if (err){ return console.log(err); }
         res.json({ data: data });
    });
});  

router.post('/console-output',async function(req, res) {
//    var job_name = req.body.job_name;
	var reqBody = await JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query)),
      job_name = reqBody.job_name,
      build_number = reqBody.build_number;

    console.log(job_name, build_number, ' ---- line 136');
    let jenkins = await getJenkinsConn();
    try {
        jenkins.console_output(job_name, build_number, async function(err, data) {
            if (err){ return console.log(err); }
    //        res.json({ message: data });
            if(data && data.body){
                /*data.body = await new Promise((fileDataResolve, fileDataReject) => {
                    var fs = require('fs');
                    fs.readFile(config.REPORTS_PATH+"console-output.txt", 'utf8', function (err, data) {
                        if (err) {
                            console.log("fileData error ",err);
                            fileDataResolve("");
                        }
                        fileDataResolve(data);
                      });
                  });*/
                data.body = data.body.toString('utf-8');
                let hideArr = ['admin_username', 'admin_password', 'subscription_id', 'client_id', 'client_secret', 'tenant_id', 'managed_infra_client_id', 'managed_infra_client_secret', 'managed_infra_tenant_id', 'managed_infra_subscription_id', 'cyberark_usernames'];
                for await (const item of hideArr) {
                    await new Promise(async function(innerResolve, innerReject){
                        let searchIndex = data.body.indexOf("-var="+item);
                        if(searchIndex >= 0){
                            let subString = data.body.substring(searchIndex, data.body.indexOf(" ", searchIndex));
    //            			subString = subString.replace('`',"");
    //            			let regex = new RegExp( '(' + subString + ')', 'gi' );
    //            			console.log("subString ---- ", subString);
    //            			data.body = data.body.replace( regex, "" );//replace(subString,"");
                            
//                            console.log("subString ---- ", subString, "---- ", data.body.indexOf(subString));
                            let splitData = data.body.split(subString);
                            data.body = splitData.join(" ");
//                            console.log("subString ---- ", subString, "---- ", data.body.indexOf(subString));
                            
                            subString = subString.replace('`',"");
//                            console.log("subString ---- ", subString, "---- ", data.body.indexOf(subString));
                            splitData = data.body.split(subString);
                            data.body = splitData.join(" ");
//                            console.log("subString ---- ", subString, "---- ", data.body.indexOf(subString));
                            
    //            			while(data.body.indexOf(subString) > 0) {
    //            		    	await new Promise(async function(whileResolve, whileReject){
    //            		    		
    //            		    	});
    //            			}
                            innerResolve("");
                        }else{
                            innerResolve("");
                        }
                    });
                }
                data.body = (data.body || '').replace(//g, '').replace( /\[[0-9]*m/gi, "" ).replace(/╷/g, '').replace(/╵/g, '').replace(/│/g, '')
                  .replace(/undefined:\[/g, '')
                  .replace(/'/g, '`').replace(/"/g, '`')
                  ;
                  //.replace( regex, "" ).replace(/\[/g, '').replace(/0m/g, '').replace(/1;31m/g, '').replace(/1;32m/g, '').replace(/1;33m/g, '').replace(/1;35m/g, '')
//                  data.body +=Math.round(new Date().getTime() / 1000);
            }
            res.json(ucpEncryptDecrypt.ucpEncrypt({ message: data }, req.query));
        });
    }
    catch(e) {
        console.log('1441-------')
        console.log(e.message)
        res.json(ucpEncryptDecrypt.ucpEncrypt({ message: {
            body: 'Invalid response' + ' -- ' + e.message
        }}, req.query));
    }
});

router.post('/build-info',async function(req, res) {
    var job_name = req.body.job_name;
    var build_number = req.body.build_number;
    let jenkins = await getJenkinsConn();
    jenkins.build_info(job_name, build_number, function(err, data) {
        if (err){ return console.log(err); }
        res.json({ message: data });
    });
});
       
router.post('/last-build-info',async function(req, res) {
    var job_name = req.body.job_name;
    let jenkins = await getJenkinsConn();
    jenkins.last_build_info(job_name, {depth: 1}, function(err, data) {
        if (err){ return console.log(err); }
        
        res.json({ message: data });  
    });
});

router.post('/last-completed-build-info',async function(req, res) {
    var job_name = req.body.job_name;
    let jenkins = await getJenkinsConn();
    jenkins.last_completed_build_info(job_name, function(err, data) {
        if (err){ return console.log(err); }
        res.json({ message: data });
        });
});

router.post('/last-result',async function(req, res) {
	let jenkins = await getJenkinsConn();
    var job_name = req.body.job_name;
    jenkins.last_result(job_name, function(err, data) {
        if (err){ return console.log(err); }
         res.json({ message: data });
    });
});

module.exports = router;