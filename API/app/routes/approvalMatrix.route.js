var mail = require("./../../common/mailer.js");
const approvalMatrixModel = require("../models/approvalMatrix.model");
const ucpEncryptDecrypt = require('../../config/ucpEncryptDecrypt');

function init(router) {
	router.route('/approvalMatrix/list').post(getAllApprovalMatrix);
	router.route('/approvalMatrix/saveApprovalMatrix').post(saveApprovalMatrix);
}

function getAllApprovalMatrix(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	approvalMatrixModel.getAllApprovalMatrix(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	});
}
function saveApprovalMatrix(req, res) {
	let reqBody = JSON.parse(ucpEncryptDecrypt.ucpDecrypt(req.body, req.query));
	approvalMatrixModel.saveApprovalMatrix(reqBody, function(err, result) {
		if (err) {
			res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
        } else {
        	res.status(200).send(ucpEncryptDecrypt.ucpEncrypt(result, req.query))
		}
	});
}

module.exports.init = init;
