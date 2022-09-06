let Joi = require("@hapi/joi");

function validateBudgetAlerts(data) {
    let singleObj = Joi.object().keys({
      alert_percentage: Joi.number().min(0).max(100).required()
    });
    const schema = Joi.object().keys({
      user_id: Joi.number().required(),
      alert_info: Joi.array().items(singleObj).min(3).required().error(errors => {
        errors.forEach(err => {
          switch (err.code) {
            case "array.length":
              err.message = "A minimum of 3 alerts percentages are required";
              break
            case "number.max":
              err.message = "Alert percentage must be less than or equal to 100";
              break
            case "number.min":
            err.message = "Alert percentage must be greater than or equal to 0";
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

module.exports = {
    validateBudgetAlerts: validateBudgetAlerts
};