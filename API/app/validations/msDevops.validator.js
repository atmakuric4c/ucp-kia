let Joi = require("@hapi/joi");

function validateMSRepo(data) {

    const schema = Joi.object().keys({
        name: Joi.string().max(100).required(),
        organization_id: Joi.string().max(1000).required(),
        project_id: Joi.string().max(500).required(),
    });
  
    let { error } = schema.validate(data);
    return error ? error.details[0].message.replace(/\"/g, "") : null;
  
}

module.exports = {
    validateMSRepo
};