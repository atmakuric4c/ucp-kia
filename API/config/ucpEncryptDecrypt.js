const config=require('./constants');

//Nodejs encryption with crypto
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = config.encKey;
const iv = crypto.randomBytes(16);
var base64 = require('base-64');

//function ucpEncrypt(reqBody, params) {
//	if(typeof params == 'undefined'){
//		params = {};
//	}
//	try{
//		console.log("typeof params.noencrypt")
//		console.log(typeof params.noencrypt)
//		
//		console.log("(typeof params.noencrypt == 'undefined' || (typeof params.noencrypt != 'undefined' && params.noencrypt != 1))")
//		console.log((typeof params.noencrypt == 'undefined' || (typeof params.noencrypt != 'undefined' && params.noencrypt != 1)))
//		
//		if(typeof params.noencrypt == 'undefined' || (typeof params.noencrypt != 'undefined' && params.noencrypt != 1)){
//			if(typeof reqBody === 'object' && reqBody.constructor === Object){
//				reqBody = JSON.stringify(reqBody);
//			}else if(Array.isArray(reqBody)){
//				reqBody = reqBody.toString();
//			}
//			let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
//			let encrypted = cipher.update(reqBody);
//			encrypted = Buffer.concat([encrypted, cipher.final()]);
//			return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
//		}else{
//			return reqBody;
//		}
//	}
//	catch{
//		return {status:"error", success:0, message:"Invalid request"};
//    }
//}
//
//function ucpDecrypt(reqBody, params) {
//	if(typeof params == 'undefined'){
//		params = {};
//	}
//	try{
//		if(typeof params.noencrypt == 'undefined' || (typeof params.noencrypt != 'undefined' && params.noencrypt != 1)){
//			let iv = Buffer.from(reqBody.iv, 'hex');
//			let encryptedreqBody = Buffer.from(reqBody.encryptedData, 'hex');
//			let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
//			let decrypted = decipher.update(encryptedreqBody);
//			decrypted = Buffer.concat([decrypted, decipher.final()]);
//			return decrypted.toString();
//		}else{
//			if(typeof reqBody === 'object' && reqBody.constructor === Object){
//				reqBody = JSON.stringify(reqBody);
//			}else if(Array.isArray(reqBody)){
//				reqBody = reqBody.toString();
//			}
//			return reqBody;
//		}
//	}
//	catch{
//		return {status:"error", success:0, message:"Invalid request"};
//    }
//}

var ucpEncrypt = function (reqBody, params) {
//	console.log("reqBody");
//	  console.log(reqBody);
	if(typeof params == 'undefined'){
		params = {};
	}
	try{
		if(typeof params.noencrypt == 'undefined' || (typeof params.noencrypt != 'undefined' && params.noencrypt != 1)){
			if(typeof reqBody === 'object' && reqBody.constructor === Object){
				reqBody = JSON.stringify(reqBody);
			}else if(Array.isArray(reqBody)){
//				reqBody = reqBody.toString();
				reqBody = JSON.stringify(reqBody);
			}
//			console.log("aft stringify reqBody");
//			  console.log(reqBody);
			var iv = crypto.randomBytes(16).toString('hex').substr(0,16);
//		    var iv = key.substr(0,16);    //using this for testing purposes (to have the same encryption IV in PHP and Node encryptors)
		    var encryptor = crypto.createCipheriv('aes-256-cbc', key, iv);
		    var encrypted = iv + encryptor.update(reqBody, 'utf8', 'base64') + encryptor.final('base64');
//		    console.log("aft encrypted");
//			  console.log(encrypted);
		    return {data:encrypted};
		}else{
			return reqBody;
		}
	}
	catch{
		return {status:"error", success:0, message:"Invalid request"};
    }
};

var ucpDecrypt = function (reqBody, params) {
	if(typeof params == 'undefined'){
		params = {};
	}
	try{
		if(typeof reqBody.data != 'undefined' && (typeof params.noencrypt == 'undefined' || (typeof params.noencrypt != 'undefined' && params.noencrypt != 1))){
		    var iv =reqBody.data.substr(0, 16).toString();
		    var decryptor = crypto.createDecipheriv('aes-256-cbc', key, iv);
		    return decryptor.update(reqBody.data.substr(16), 'base64', 'utf8') + decryptor.final('utf8');
		}else{
			if(typeof reqBody === 'object' && reqBody.constructor === Object){
				reqBody = JSON.stringify(reqBody);
			}else if(Array.isArray(reqBody)){
//				reqBody = reqBody.toString();
				reqBody = JSON.stringify(reqBody);
			}
			return reqBody;
		}
	}
	catch{
		return {status:"error", success:0, message:"Invalid request"};
    }
};

var ucpEncryptForDb = function (reqBody) {
	try{
		var iv = crypto.randomBytes(16).toString('hex').substr(0,16);
//		    var iv = key.substr(0,16);    //using this for testing purposes (to have the same encryption IV in PHP and Node encryptors)
	    var encryptor = crypto.createCipheriv('aes-256-cbc', config.dbKey, iv);
	    var encrypted = iv + encryptor.update(reqBody, 'utf8', 'base64') + encryptor.final('base64');
	    //console.log(encrypted);
	    return (encrypted);
	}
	catch{
		return {status:"error", success:0, message:"Invalid request"};
    }
};

var ucpDecryptForDb = function (reqBody) {
	try{
	    var iv =reqBody.substr(0, 16).toString();
	    var decryptor = crypto.createDecipheriv('aes-256-cbc', config.dbKey, iv);
	    return (decryptor.update(reqBody.substr(16), 'base64', 'utf8') + decryptor.final('utf8'));
	}
	catch{
		return {status:"error", success:0, message:"Invalid request"};
    }
};

var ucpEncryptForUri = function (reqBody) {
	if(typeof params == 'undefined'){
		params = {};
	}
	try{
		if((typeof params.noencrypt == 'undefined' || (typeof params.noencrypt != 'undefined' && params.noencrypt != 1))){
	//		return base64.encode(reqBody);
			var iv = crypto.randomBytes(16).toString('hex').substr(0,16);
	//		    var iv = key.substr(0,16);    //using this for testing purposes (to have the same encryption IV in PHP and Node encryptors)
		    var encryptor = crypto.createCipheriv('aes-256-cbc', key, iv);
		    var encrypted = iv + encryptor.update(reqBody, 'utf8', 'base64') + encryptor.final('base64');
		    //console.log(encrypted);
		    return encodeURIComponent(encrypted);
		}else{
			return reqBody
		}
	}
	catch{
		return {status:"error", success:0, message:"Invalid request"};
    }
};

var ucpDecryptForUri = function (reqBody) {
	if(typeof params == 'undefined'){
		params = {};
	}
	try{
		if((typeof params.noencrypt == 'undefined' || (typeof params.noencrypt != 'undefined' && params.noencrypt != 1))){
	//		return base64.decode(reqBody);
			//console.log("before decodeURIComponent reqBody "+reqBody);
			reqBody = decodeURIComponent(reqBody);
			//console.log("after decodeURIComponent reqBody "+reqBody);
		    var iv =reqBody.substr(0, 16).toString();
		    var decryptor = crypto.createDecipheriv('aes-256-cbc', key, iv);
		    return decryptor.update(reqBody.substr(16), 'base64', 'utf8') + decryptor.final('utf8');
		}else{
			return reqBody
		}
	}
	catch{
		return {status:"error", success:0, message:"Invalid request"};
    }
};

module.exports={
	ucpEncrypt,
	ucpDecrypt,
	ucpEncryptForDb,
	ucpDecryptForDb,
	ucpEncryptForUri,
	ucpDecryptForUri
}

