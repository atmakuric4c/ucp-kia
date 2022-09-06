import env from './../../env';
export function authHeader() {
		// return authorization header with jwt token
		let user = decryptResponse(
			localStorage.getItem("user"));

  if (user && user.token) {
    return { Authorization: "Bearer " + user.token };
  } else {
    return {};
  }
}

export function logout() {
  // remove user from local storage to log user out
  localStorage.removeItem("user");
  localStorage.removeItem("menus");
}

//Nodejs encryption with crypto
const crypto = require('crypto');
const kplatformey = "255a6142a394f4952ac32b81398d672e";
const iv = crypto.randomBytes(16);

export function ucpEncryptForUri(reqBody) {
    try{
//    	console.log("bef encrypted "+(reqBody));
//    	console.log("aft encrypted "+btoa(reqBody));
//    	return btoa(reqBody);
		reqBody = reqBody.toString();
        var iv = crypto.randomBytes(16).toString('hex').substr(0,16);
//            var iv = key.substr(0,16);    //using this for testing purposes (to have the same encryption IV in PHP and Node encryptors)
        var encryptor = crypto.createCipheriv('aes-256-cbc', kplatformey, iv);
        var encrypted = iv + encryptor.update(reqBody, 'utf8', 'base64') + encryptor.final('base64');
        console.log("encrypted "+encrypted);
        return encodeURIComponent(encrypted);
    }
    catch(e){
        return reqBody;
    }
};
export function ucpEncrypt(reqBody, params) {
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
			var iv = crypto.randomBytes(16).toString('hex').substr(0,16);
//			var iv = key.substr(0,16);    //using this for testing purposes (to have the same encryption IV in PHP and Node encryptors)
		    var encryptor = crypto.createCipheriv('aes-256-cbc', kplatformey, iv);
		    var encrypted = iv + encryptor.update(reqBody, 'utf8', 'base64') + encryptor.final('base64');
		    return {data:encrypted};
		}else{
			return reqBody;
		}
	}
	catch(e){
		return {status:"error", success:0, message:"Invalid request"};
    }
}

export function ucpDecryptForUri(reqBody) {
    try{
//    	return atob(reqBody);
    	reqBody = decodeURIComponent(reqBody);
        var iv =reqBody.substr(0, 16).toString();
        var decryptor = crypto.createDecipheriv('aes-256-cbc', kplatformey, iv);
        return decryptor.update(reqBody.substr(16), 'base64', 'utf8') + decryptor.final('utf8');
    }
    catch(e){
        return reqBody;
    }
};
export function ucpDecrypt(reqBody, params) {
	if(typeof params == 'undefined'){
		params = {};
	}
	try{
		if(typeof reqBody.data != 'undefined' && (typeof params.noencrypt == 'undefined' || (typeof params.noencrypt != 'undefined' && params.noencrypt != 1))){
		    var iv =reqBody.data.substr(0, 16).toString();
		    var decryptor = crypto.createDecipheriv('aes-256-cbc', kplatformey, iv);
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
	catch(e){
		return {status:"error", success:0, message:"Invalid request"};
    }
}

export function encryptRequest(reqBody, params){
	try{
		return JSON.stringify(ucpEncrypt(reqBody,params));
	}
	catch(e){
		return "";
    }
}

export function decryptResponse(response, params){
	try{
		return (response ? JSON.parse(ucpDecrypt(JSON.parse(response), (params && JSON.parse(params)))) : "");
	}
	catch(e){
		return "";
    }
}
