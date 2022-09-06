let Joi = require("@hapi/joi");

function validateSecurityQuestionsforUser(data) {
  let singleObj = Joi.object().keys({
    question_id: Joi.number().required(),
    answer: Joi.string().max(500).required(),
  });
  const schema = Joi.object().keys({
    user_id: Joi.number().required(),
    questions: Joi.array().items(singleObj).length(4).required().error(errors => {
      errors.forEach(err => {
        switch (err.code) {
          case "array.length":
            err.message = "A minimum of 4 questions are required!";
            break
          default:
            err.message = err.message;
        }
      })
      return errors;
    })
  });
  let { error } = schema.validate(data);
	return error ? error.details[0].message.replace(/\"/g, "") : null;

}

function validateSingleSecurityQuestionforUser(data) {

  const schema = Joi.object().keys({
    answer: Joi.string().max(500).required(),
  });

  let { error } = schema.validate(data);
  return error ? error.details[0].message.replace(/\"/g, "") : null;

}

function validateSecurityAnswersforUser(data) {

  let singleObj = Joi.object().keys({
      question_id: Joi.number().required(),
      answer: Joi.string().max(500).required(),
  });

  const schema = Joi.array().items(singleObj).length(2).required().error(errors => {
    errors.forEach(err => {
      switch (err.code) {
        case "array.length":
          err.message = "Please pass 2 questions to verify!";
          break
        default:
          err.message = err.message;
      }
    });
    return errors;
  });;

  let { error } = schema.validate(data);
  console.log(error);
  return error ? error.details[0].message.replace(/\"/g, "") : null;

}


module.exports = {
    validateSecurityQuestionsforUser: validateSecurityQuestionsforUser,
    validateSingleSecurityQuestionforUser: validateSingleSecurityQuestionforUser,
    validateSecurityAnswersforUser: validateSecurityAnswersforUser
};