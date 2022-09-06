var mail = require("./../../common/mailer.js");
const groupModel = require("../models/group.model");
const ucpEncryptDecrypt = require('../../config/ucpEncryptDecrypt');

function init(router) {
	router.route('/roles/list').post(getAllGroup);
	router.route('/roles/saveGroup').post(saveGroup);
}

function getAllGroup(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	groupModel.getAllGroup(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	});
}
function saveGroup(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	groupModel.saveGroup(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	});
}

module.exports.init = init;
