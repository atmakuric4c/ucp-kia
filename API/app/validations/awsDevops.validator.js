let Joi = require("@hapi/joi");

function validateAWSRepo(data) {

    const schema = Joi.object().keys({
        name: Joi.string().max(100).regex(/[\w\.-]+/).required(),
        description: Joi.string().max(1000).required().allow(null, ''),
        region: Joi.string().max(500).required(),
    });
  
    let { error } = schema.validate(data);
    return error ? error.details[0].message.replace(/\"/g, "") : null;
  
}

module.exports = {
    validateAWSRepo
};