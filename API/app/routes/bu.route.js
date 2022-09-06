var mail = require("./../../common/mailer.js");
const buModel = require("../models/bu.model");
const ucpEncryptDecrypt = require('../../config/ucpEncryptDecrypt');

function init(router) {
	router.route('/bu/list').post(getAllBu);
	router.route('/bu/saveBu').post(saveBu);
	router.route('/bu/getAllBuUsers').post(getAllBuUsers);
}

function getAllBu(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	buModel.getAllBu(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	});
}
function saveBu(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	buModel.saveBu(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	});
}

function getAllBuUsers(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	buModel.getAllBuUsers(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	});
}

module.exports.init = init;
