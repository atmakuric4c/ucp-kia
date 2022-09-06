var fs = require('fs');
var path = require('path');
var base64 = require('base-64');
var bodyParser = require("body-parser");
var https = require('https');
var cryptoJs = require('crypto-js');
var crypto = require('crypto');
var util = require('util');
const request=require('request');
const axios = require('axios');
const dbHandler= require('../config/api_db_handler');
const config = require('../config/constants');

// sleep time expects milliseconds
function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
  // Usage!
 // sleep(500).then(() => {
      // Do something after the sleep!
  //});
function lowerToUpper(arr) {
    var obj = [];var keyVal1='';var keyVal2='';
    for(key1 in arr){
        keyVal1=key1.toUpperCase();
        obj[keyVal1]=arr[key1]
        if(Array.isArray(arr[key1]) || typeof arr[key1] === 'object'){
            for(key2 in arr[key1]){
                keyVal2=key2.toUpperCase();
                obj[keyVal1][keyVal2]=arr[key1][key2]
                delete obj[key1][key2]
            }
        }
    }
    return obj;
}
function getRandomString() {
    let length = 5;
    let characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let string = '';
    
    for (i = 0; i < length; i++) {
        string += characters[Math.floor(Math.random() * 62)];
    }
    
    return Math.round(new Date().getTime()/1000)+string;
}

function calculateTax(regData) {
    let totalTax = 0;
    let totalTaxPercent =0;
    
    if(regData.currency_id == 1){
        totalTaxPercent = 18;
    }else{
        totalTaxPercent = 0;
    }
    
    totalTax = (regData.amount * totalTaxPercent) / 100;

    if (regData.get_tax == 'amount')
        return financial( totalTax, 2 );
    if (regData.get_tax == 'percent')
        return totalTaxPercent;
}

function financial(val,fixed) {
    if(typeof fixed == 'undefined'){
        fixed = 2;
    }
    return Number.parseFloat(val).toFixed(fixed);
}

function arrayencode(arr) {
    str = JSON.stringify( arr );
    str = base64.encode ( str );
    return encodeURI( str );
}
function arraydecode(str) {
    arr = decodeURI(str );
    arr = base64.decode ( arr );
    arr = JSON.parse ( arr );
    return arr;
}

function logDataToFile(log_file_name,dataToWrite,cb){
	fs.appendFile(config.REPORTS_PATH+log_file_name, ((typeof dataToWrite=='object')?JSON.stringify(dataToWrite):dataToWrite)+"\n", (err) => {
		if (err) {
			console.log(err);
		}
		if(typeof cb != 'undefined'){
			cb(null, ((err)?false:true));
		}
	});
}

function getRandomNumber(limitLength) {
    let length = 5;
    if(typeof limitLength != 'undefined'){
    	length = limitLength;
    }
    let characters = '0123456789';
    let string = '';
    
    for (i = 0; i < length; i++) {
        string += characters[Math.floor(Math.random() * 10)];
    }
    if(typeof limitLength != 'undefined'){
    	return string;
    }else{
    	return Math.round(new Date().getTime()/1000)+string;
    }
}

function getRandomNumberWithinRange(rangeFrom,rangeTo,NotInValues) {
    var min = parseInt(rangeFrom); 
    var max = parseInt(rangeTo);  
    var random = 0;
    while(true){
        random = Math.floor(Math.random() * (+max - +min)) + +min; 
        if(NotInValues.indexOf(random) == -1){
            break;
        }
    }
    console.log("Random Number Generated : " + random ); 

    return random;
}

let fileWrite=(fileName,string,flag='w')=>{
    fs.writeFile(
        'debug/'+fileName, // file
        '***'+string, // string
        {
            encoding: "utf8",
            flag: flag // flag that specifies that it will append stuff
        },
        function(){
        }
    )
}

function strEscape(str){
    try{
        return str.replace(/"/g, '\\\"').replace(/'/g, "\\\'");
    }
    catch(e){
        return 'Not Connected'
    }
}
function trim(str){
    try{
        return str.replace(/^\s*|\s*$/g,'')
    }
    catch(e){
        return 'Not Connected'
    }
}
async function getArrFromNo(no){
    return await Array.from(Array(no).keys());
}
function getRootDirectory(){
    return path.join(__dirname+"/../");
}
async function getFilesizeInBytes(filename) {
    const stats = fs.statSync(filename);
    const fileSizeInBytes = stats.size;
    return fileSizeInBytes;
}

async function getNextBusinessDayFromGivenDate(startDate,noOfDaysToAdd, cb) {
	await new Promise(function(resolve1,reject1){
	//	var startDate = "20-Jan-2022";
		startDate = new Date(startDate.replace(/-/g, "/"));
		var endDate = "", count = 0; //noOfDaysToAdd = 9, 
		while(count < noOfDaysToAdd){
		    endDate = new Date(startDate.setDate(startDate.getDate() + 1));
		    if(endDate.getDay() != 0 && endDate.getDay() != 6){
		       count++;
		    }
		}
//		console.log(endDate);//You can format this date as per your requirement
		cb(null, endDate);
		resolve1(endDate);
	});
}

function convertTimestampToDatetime(unixtimestamp){

    // Unixtimestamp
    // var unixtimestamp = document.getElementById('timestamp').value;
   
    // Months array
    var months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
   
    // Convert timestamp to milliseconds
    var date = new Date(unixtimestamp*1000);
   
    // Year
    var year = date.getFullYear();
   
    // Month
    var month = months_arr[date.getMonth()];
   
    // Day
    var day = date.getDate();
   
    // Hours
    var hours = date.getHours();
   
    // Minutes
    var minutes = "0" + date.getMinutes();
   
    // Seconds
    var seconds = "0" + date.getSeconds();
   
    // Display date time in MM-dd-yyyy h:m:s format
    var convdataTime = month+'-'+day+'-'+year+' '+hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    
    //document.getElementById('datetime').innerHTML = convdataTime;
    return convdataTime;
    
}

function convertTimestampToDate(unixtimestamp){

    // Unixtimestamp
    // var unixtimestamp = document.getElementById('timestamp').value;
   
    // Months array
    var months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
   
    // Convert timestamp to milliseconds
    var date = new Date(unixtimestamp*1000);
   
    // Year
    var year = date.getFullYear();
   
    // Month
    var month = months_arr[date.getMonth()];
   
    // Day
    var day = date.getDate();
   
    // Display date time in MM-dd-yyyyformat
    var convdataTime = month+'-'+day+'-'+year;
    
    //document.getElementById('datetime').innerHTML = convdataTime;
    return convdataTime;
    
}

// this function converts the generic JS ISO8601 date format to the specific format the AWS API wants
function getAmzDate(dateStr) {
    var chars = [":","-"];
    for (var i=0;i<chars.length;i++) {
      while (dateStr.indexOf(chars[i]) != -1) {
        dateStr = dateStr.replace(chars[i],"");
      }
    }
    dateStr = dateStr.split(".")[0] + "Z";
    return dateStr;
}

  // this function gets the Signature Key, see AWS documentation for more details
function getAwsSignature(Crypto, key, dateStamp, regionName, serviceName) {
    var kDate = Crypto.HmacSHA256(dateStamp, "AWS4" + key);
    var kRegion = Crypto.HmacSHA256(regionName, kDate);
    var kService = Crypto.HmacSHA256(serviceName, kRegion);
    var kSigning = Crypto.HmacSHA256("aws4_request", kService);
    return kSigning;
}

function awsPerformRequest(endpoint, CanonicalQueryString, myMethod, headers, data, success) {
    // var dataString = data;
    // var options = {
    //   host: endpoint,
    // //   port: 443,
    //   path: CanonicalQueryString,
    //   method: myMethod,
    //   headers: headers
    // };
    // var req = https.request(options, function(res) {
    //   res.setEncoding('utf-8');
    //   var responseString = '';
    //   res.on('data', function(data) {
    //     responseString += data;
    //   });
    //   res.on('end', function() {
    //     console.log("responseString");
    //     console.log(responseString);
    //     success(responseString);
    //   });
    // });
    // req.write(dataString);
    // req.end();

    var options = {
        'method': myMethod,
        'url': "https://"+endpoint+"?"+CanonicalQueryString,
        'headers': headers
      };
    if(myMethod != 'GET'){
    	options.body = data
    }
      //console.log("options")
      //console.log(options)

    request(options, function (error, response) { 
        if (error){
            // throw new Error(error);
            //console.log(error);
            success({message:"The operation did not execute as expected. Please raise a ticket to support."});
        }else{ 
            // console.log(response.body);
            success(response.body);
        }
      });
  }
  function CanonicalQueryStringFn(params){
    queryStr = '';
    if(Object.keys(params).length){
        const ordered = {};
        Object.keys(params).sort().forEach(function(key) {
            ordered[key] = params[key];
        });
        params = ordered;
        //console.log(params)
        for (var key in params) {
            if (params.hasOwnProperty(key)){
                params[key] = encodeURI(params[key]);
                if (params[key].indexOf('/') != -1) {
                    //params[key] = params[key].replace('/', "%2F");
                    params[key] = params[key].replace(/\//g, "%2F");
                }
                queryStr += encodeURI(key)+"="+params[key]+"&";
            }
        }
    }
    if(queryStr != ''){
        queryStr =  queryStr.substring(0, queryStr.length - 1);
    }
    //console.log("queryStr");
    //console.log(queryStr);
    return queryStr;
  }

  /*
   * ref url :: https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
   */
  let awsProcessRequest=(params,callback)=>{
    // our variables
    var access_key = params.access_key;
    var secret_key = params.secret_key;
    var region = params.region;
    var myService = params.myService;
    var url = params.url;
    var myMethod = params.myMethod;
    var myPath = params.myPath;

    if(region == ""){
        region = "us-east-1";
    }
  
    // declare our dependencies
    var xml = require('xml2js');
  
    // get the various date formats needed to form our request
    var amzDate = getAmzDate(new Date().toISOString());
    var authDate = amzDate.split("T")[0];
    
    // we have an empty payload here because it is a GET request
    var payload = '';
    if(typeof params.reqBody != 'undefined' && Object.keys(params.reqBody).length){
    	payload = params.reqBody;
    }
    // get the SHA256 hash value for our payload
    var hashedPayload = cryptoJs.SHA256(payload).toString();
  
    //{"Action": "DescribeAvailabilityZones","Version":"2016-11-15"}
    //console.log("params111")
    //console.log(params)
    var CanonicalQueryString = CanonicalQueryStringFn(params.queryParams);

    // create our canonical request
    var canonicalReq =  myMethod + '\n' +
    myPath + '\n' +
    CanonicalQueryString+'\n' +
    'host:' + url + '\n' +
    'x-amz-content-sha256:' + hashedPayload + '\n' +
    'x-amz-date:' + amzDate + '\n' +
    '\n' +
    'host;x-amz-content-sha256;x-amz-date' + '\n' +
    hashedPayload;
  
    // hash the canonical request
    var canonicalReqHash = cryptoJs.SHA256(canonicalReq).toString();
  
    // form our String-to-Sign
    var stringToSign =  'AWS4-HMAC-SHA256\n' +
    amzDate + '\n' +
    authDate+'/'+region+'/'+myService+'/aws4_request\n'+
    canonicalReqHash;
  
    // get our Signing Key
    var signingKey = getAwsSignature(cryptoJs, secret_key, authDate, region, myService);
  
    // Sign our String-to-Sign with our Signing Key
    var authKey = cryptoJs.HmacSHA256(stringToSign, signingKey);
  
    // Form our authorization header
    var authString  = 'AWS4-HMAC-SHA256 ' +
    'Credential='+
    access_key+'/'+
    authDate+'/'+
    region+'/'+
    myService+'/aws4_request,'+
    'SignedHeaders=host;x-amz-content-sha256;x-amz-date,'+
    'Signature='+authKey;
  
    // throw our headers together
    headers = {
      'Authorization' : authString,
      'Host' : url,
      'x-amz-date' : amzDate,
      'x-amz-content-sha256' : hashedPayload
    };
    if(typeof params.additionalHeaderParams != 'undefined' && Object.keys(params.additionalHeaderParams).length){
    	headers = Object.assign({}, headers, params.additionalHeaderParams);
    }
    //console.log("headers");
    //console.log(headers);
     
    // console.log("hashedPayload");
    // console.log(hashedPayload);
    // console.log(url +" -- "+ CanonicalQueryString +" -- "+  myMethod +" -- "+  headers+" -- "+  payload);
  
    // call our function
    awsPerformRequest(url , CanonicalQueryString, myMethod , headers, payload, function(response) {
       //console.log(response);
       if(typeof params.dontConvertResponse != 'undefined' && params.dontConvertResponse == true){
    	   callback(null, JSON.parse(response));
       }else{
	      // parse the response from our function and write the results to the console
	      xml.parseString(response, function (err, result) {
	        // console.log(result);
	        callback(null,result);
	      });
       }
    });
}
  
let sendsms = async (params,callback)=>{
//	return callback(null,"return to parent call");
	if(typeof params.template_id == 'undefined' || params.template_id == ''){
		return callback(1,"Missing template_id");
	}
	if(typeof params.gateway == 'undefined'){
		params.gateway = 'SMSSTRIKER';
	}
	if(typeof params.type == 'undefined'){
		params.type = '';
	}
	if(typeof params.clientid == 'undefined'){
		params.clientid = '';
	}
	msg = decodeURI ( params.message );
	mobilenumbers = params.mobileno; // enter Mobile numbers comma seperated
	message = encodeURI ( msg );
	user = config.SMS.SMSSTRIKER.user; // your username
	password = config.SMS.SMSSTRIKER.password; // your password //
	senderid = config.SMS.SMSSTRIKER.senderid; // Your senderid //CTRLFC
	messagetype = config.SMS.SMSSTRIKER.messagetype; // Type Of Your Message	
	template_id = params.template_id;
	
	url = `https://www.smsstriker.com/API/sms.php?username=${user}&password=${password}&from=${senderid}&to=${mobilenumbers}&msg=${message}&type=${messagetype}&template_id=${template_id}`;
//	console.log(url)
	await axios
    .get(url)
    .then(async body => {
    	console.log("body.data");
    	console.log(body.data);
    	api_reponse_obj = body.data;
    	data={
    			txt : decodeURI ( message ),
    			mobile : mobilenumbers,
    			type : params.type,
    			gateway : params.gateway,				
    			userid : 0,
    			clientid : 0,
    			createddate : Math.round(new Date().getTime() / 1000),
    			requested_domain : config.API_URL,
    			api_reponse_obj : api_reponse_obj
    			};
    	if(typeof params.clientid != 'undefined' && params.clientid != ''){
    		data.clientid = params.clientid;
    	}
    	if(typeof params.userid != 'undefined' && params.userid != ''){
    		data.userid = params.userid;
    	}
    	if(typeof params.staffid != 'undefined' && params.staffid != ''){
    		data.staffid = params.staffid;
    	}
    	console.log(data);
    	dbHandler.insertIntoTable('c4_client_otp_sent',data,function(err,result){
    		return callback(null,body.data);
        })
    })
    .catch((e) => {
        console.log(e);
        return callback(1,e);
    });
}

function fnFormatCurrency(val, currency, avoidValue){
//	var currency_symbols = {
//	    'USD': '$', // US Dollar
//	    'EUR': '€', // Euro
//	    'CRC': '₡', // Costa Rican Colón
//	    'GBP': '£', // British Pound Sterling
//	    'ILS': '₪', // Israeli New Sheqel
//	    'INR': '₹', // Indian Rupee
//	    'JPY': '¥', // Japanese Yen
//	    'KRW': '₩', // South Korean Won
//	    'NGN': '₦', // Nigerian Naira
//	    'PHP': '₱', // Philippine Peso
//	    'PLN': 'zł', // Polish Zloty
//	    'PYG': '₲', // Paraguayan Guarani
//	    'THB': '฿', // Thai Baht
//	    'UAH': '₴', // Ukrainian Hryvnia
//	    'VND': '₫', // Vietnamese Dong
//	};
	
    //if(currency_symbols[userCurrencyCode]!==undefined) {
      //  alert(currency_symbols[userCurrencyCode]);
    //}
    
    //Reference Links
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
    //https://stackoverflow.com/questions/19373860/convert-currency-names-to-currency-symbol
    //https://stackoverflow.com/questions/149055/how-to-format-numbers-as-currency-string
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      });

    if(!val)
        val = 0;

    val = formatter.format(val);
    
    if(!avoidValue){
        return val.slice(0, 1) + " " + val.slice(1);    
    }
    else{
        return val.slice(0, 1)
    }
}

let currencyConvert = async (params,callback)=>{
	console.log("params11");
	console.log(params);
	if(params.from == params.to){
		return callback(null, params.amount);
	}else{
	//	return callback(null,"return to parent call");
	//	$url = "https://www.finance.google.com/finance/converter?a=$amount&from=$from&to=$to";
	//	$url='http://api.fixer.io/latest?base='+params.from;

//		{"success": false,"error": {"code": 104,"info": "Your monthly usage limit has been reached. Please upgrade your Subscription Plan."}}
		let url = "http://data.fixer.io/api/latest?access_key=8574a64dc19a8ac92a469f6903469125";
		
		await axios
	    .get(url)
	    .then(async body => {
	    	console.log("url");
	    	console.log(url);
//	    	console.log("body");
//	    	console.log(body);
	    	console.log("body.data");
	    	console.log(body.data);
	    	if(params.from=='USD')
	    		rate =72;
	    	if(params.from =='AED')
	    		rate = 20;
	    	if(body.data.success == true){
		    	if(body.data.rates){
		    	    rate = body.data.rates.INR / body.data.rates[params.from];
		    	}
		    	//$data = explode ( 'bld>', $response );
		    	//$data = explode ( $to, $data [1] );
		    	amount = rate*params.amount;
		    	return callback(null,financial ( amount, 2 ));
	    	}else{
	    		let url = "http://data.fixer.io/api/latest?access_key=d0add930af34c2032162e64f0e0e23c5"; //latest
	    		await axios
	    	    .get(url)
	    	    .then(async body => {
	    	    	console.log("url");
	    	    	console.log(url);
//	    	    	console.log("body");
//	    	    	console.log(body);
	    	    	console.log("body.data");
	    	    	console.log(body.data);
    		    	if(body.data.rates){
    		    	    rate = body.data.rates.INR / body.data.rates[params.from];
    		    	}
    		    	//$data = explode ( 'bld>', $response );
    		    	//$data = explode ( $to, $data [1] );
    		    	amount = rate*params.amount;
    		    	return callback(null,financial ( amount, 2 ));
	    	    })
	    	    .catch((e) => {
	    	        console.log(e);
	    	        return callback(1,e);
	    	    });
	    	}
	    })
	    .catch((e) => {
	        console.log(e);
	        return callback(1,e);
	    });
	}
}

//mandatory flag: when it set, only mandatory parameters are added to checksum

function paytm_paramsToString(params, mandatoryflag) {
  var data = '';
  var tempKeys = Object.keys(params);
  tempKeys.sort();
  tempKeys.forEach(function (key) {
  var n = params[key].toString().includes("REFUND"); 
   var m = params[key].toString().includes("|");  
        if(n == true )
        {
          params[key] = "";
        }
          if(m == true)
        {
          params[key] = "";
        }  
    if (key !== 'CHECKSUMHASH' ) {
      if (params[key] === 'null') params[key] = '';
      if (!mandatoryflag || mandatoryParams.indexOf(key) !== -1) {
        data += (params[key] + '|');
      }
    }
});
  return data;
}


function paytm_genchecksum(params, key, cb) {
	var crypt = require('./crypt');
  var data = paytm_paramsToString(params);
crypt.gen_salt(4, function (err, salt) {
    var sha256 = crypto.createHash('sha256').update(data + salt).digest('hex');
    var check_sum = sha256 + salt;
    var encrypted = crypt.encrypt(check_sum, key);
    cb(undefined, encrypted);
  });
}
function paytm_genchecksumbystring(params, key, cb) {
	var crypt = require('./crypt');
  crypt.gen_salt(4, function (err, salt) {
    var sha256 = crypto.createHash('sha256').update(params + '|' + salt).digest('hex');
    var check_sum = sha256 + salt;
    var encrypted = crypt.encrypt(check_sum, key);

     var CHECKSUMHASH = encodeURIComponent(encrypted);
     CHECKSUMHASH = encrypted;
    cb(undefined, CHECKSUMHASH);
  });
}

function paytm_verifychecksum(params, key, checksumhash) {
  var data = paytm_paramsToString(params, false);

  //TODO: after PG fix on thier side remove below two lines
  if (typeof checksumhash !== "undefined") {
    checksumhash = checksumhash.replace('\n', '');
    checksumhash = checksumhash.replace('\r', '');
    var temp = decodeURIComponent(checksumhash);
    
    var crypt = require('./crypt');
    var checksum = crypt.decrypt(temp, key);
    var salt = checksum.substr(checksum.length - 4);
    var sha256 = checksum.substr(0, checksum.length - 4);
    var hash = crypto.createHash('sha256').update(data + salt).digest('hex');
    if (hash === sha256) {
      return true;
    } else {
      util.log("checksum is wrong");
      return false;
    }
  } else {
    util.log("checksum not found");
    return false;
  }
}

function paytm_verifychecksumbystring(params, key,checksumhash) {
	var crypt = require('./crypt');
    var checksum = crypt.decrypt(checksumhash, key);
    var salt = checksum.substr(checksum.length - 4);
    var sha256 = checksum.substr(0, checksum.length - 4);
    var hash = crypto.createHash('sha256').update(params + '|' + salt).digest('hex');
    if (hash === sha256) {
      return true;
    } else {
      util.log("checksum is wrong");
      return false;
    }
  } 

function paytm_genchecksumforrefund(params, key, cb) {
	var crypt = require('./crypt');
  var data = paytm_paramsToStringrefund(params);
crypt.gen_salt(4, function (err, salt) {
    var sha256 = crypto.createHash('sha256').update(data + salt).digest('hex');
    var check_sum = sha256 + salt;
    var encrypted = crypt.encrypt(check_sum, key);
      params.CHECKSUM = encodeURIComponent(encrypted);
    cb(undefined, params);
  });
}

function paytm_paramsToStringrefund(params, mandatoryflag) {
  var data = '';
  var tempKeys = Object.keys(params);
  tempKeys.sort();
  tempKeys.forEach(function (key) {
   var m = params[key].includes("|");  
          if(m == true)
        {
          params[key] = "";
        }  
    if (key !== 'CHECKSUMHASH' ) {
      if (params[key] === 'null') params[key] = '';
      if (!mandatoryflag || mandatoryParams.indexOf(key) !== -1) {
        data += (params[key] + '|');
      }
    }
});
  return data;
}
async function fnGenerateString(reqObj){
  let string = '';
  await new Promise(function(resolve1,reject1){
    console.log("reqObj ---- ", reqObj);
    let length = ((reqObj.passwordMinLength)?reqObj.passwordMinLength:8);
    let characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if(reqObj.passwordPolicy && reqObj.passwordPolicy.length > 0){
      for (let i = 0; i < reqObj.passwordPolicy.length; i++) {
        if(reqObj.passwordPolicy[i].characters && reqObj.passwordPolicy[i].minLength){
          for (let j = 0; j < reqObj.passwordPolicy[i].minLength; j++) {
            string += reqObj.passwordPolicy[i].characters[Math.floor(Math.random() * reqObj.passwordPolicy[i].characters.length)];
          }
        }
        }
    }
    console.log("string.length ---- ", string.length);
    for (let i = string.length; i < length; i++) {
        string += characters[Math.floor(Math.random() * 62)];
    }
    resolve1(string);
  });
  return string;
}


module.exports={
    sleep,
    lowerToUpper,
    fileWrite,
    trim,
    getRandomString,
    getRandomNumber,
    getRandomNumberWithinRange,
    fnGenerateString,
    getArrFromNo,
    getRootDirectory,
    getFilesizeInBytes,
    calculateTax,
    financial,
    arrayencode,
    arraydecode,
    convertTimestampToDatetime,
    convertTimestampToDate,
    getAwsSignature,
    getAmzDate,
    awsPerformRequest,
    awsProcessRequest,
    CanonicalQueryStringFn,
    sendsms,
    fnFormatCurrency,
    currencyConvert,
    paytm_genchecksum,
    paytm_verifychecksum,
    paytm_verifychecksumbystring,
    paytm_genchecksumbystring,
    paytm_genchecksumforrefund,
    strEscape,
    getNextBusinessDayFromGivenDate,
    logDataToFile
}