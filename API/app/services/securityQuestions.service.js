const securityQuestionsModel = require('../models/securityQuestions.model');
const securityQuestionsValidations = require('../validations/securityQuestions.validator');

let securityQuestionsService = {
    getSecurityQuestions: getSecurityQuestions,
    getUserSecurityQuestions: getUserSecurityQuestions,
    addUserSecurityQuestions: addUserSecurityQuestions,
    updateUserSecurityQuestions: updateUserSecurityQuestions,
    getRandomUserSecurityQuestions: getRandomUserSecurityQuestions,
    verifyUserSecurityQuestions: verifyUserSecurityQuestions
}

async function getSecurityQuestions(req) {
    let { output, count } = await securityQuestionsModel.getSecurityQuestions(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getUserSecurityQuestions(req) {
    let { output, count } = await securityQuestionsModel.getUserSecurityQuestions(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function addUserSecurityQuestions(req) {

    const error = securityQuestionsValidations.validateSecurityQuestionsforUser(req.body);
    if (error) throw ({ type: "custom", message: error, status: 400 });
    
    const uniqueQuestions = new Set(req.body.questions.map(v => v.question_id));
    if (uniqueQuestions.size < req.body.questions.length) throw ({ type: "custom", message: "Cannot select the same question more than once", status: 400 });

    let { output, count } = await securityQuestionsModel.addUserSecurityQuestions(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function updateUserSecurityQuestions(req) {

    const error = securityQuestionsValidations.validateSecurityQuestionsforUser(req.body);
    if (error) throw ({ type: "custom", message: error, status: 400 });

    const uniqueQuestions = new Set(req.body.questions.map(v => v.question_id));
    if (uniqueQuestions.size < req.body.questions.length) throw ({ type: "custom", message: "Cannot select the same question more than once", status: 400 });

    let { output, count } = await securityQuestionsModel.updateUserSecurityQuestions(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function updateUserSecurityQuestions(req) {

    let { output, count } = await securityQuestionsModel.updateUserSecurityQuestions(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function getRandomUserSecurityQuestions(req) {
    let { output, count } = await securityQuestionsModel.getRandomUserSecurityQuestions(req);
    return { message:'success', data : output, count: count, status: 200 };
}

async function verifyUserSecurityQuestions(req) {

    const error = securityQuestionsValidations.validateSecurityAnswersforUser(req.body);
    if (error) throw ({ type: "custom", message: error, status: 400 });

    const uniqueQuestions = new Set(req.body.map(v => v.question_id));
    if (uniqueQuestions.size < req.body.length) throw ({ type: "custom", message: "Cannot answer the same question twice", status: 400 });

    let { output, count } = await securityQuestionsModel.verifyUserSecurityQuestions(req);
    if(!output){
        let { output, count } = await securityQuestionsModel.getRandomUserSecurityQuestions(req);
        return { message:'please verify new questions', data : output, count: count, status: 200 };
    }

    return { message:'successfully verified answers', data : output, count: count, status: 200 };
}
  
module.exports = securityQuestionsService;
  