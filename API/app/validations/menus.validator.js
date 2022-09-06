const { number } = require("@hapi/joi");
let Joi = require("@hapi/joi");

function validateMenuItem(data) {

    const schema = Joi.object().keys({
        menu_name: Joi.string().max(100).required(),
        url: Joi.string().max(1000).required().allow(null),
        classname: Joi.string().max(1000).required().allow(null),
        description: Joi.string().max(1000).required().allow(null),
        parent_id: Joi.number().required().allow(null),
        sort_order: Joi.number().required(),
        reference_table: Joi.string().max(1000).required().allow(null),
        reference_flag: Joi.string().max(1000).required().allow(null)
    });
  
    let { error } = schema.validate(data);
    return error ? error.details[0].message.replace(/\"/g, "") : null;
  
}

function validateUpdateMenuItem(data) {

    const schema = Joi.object().keys({
        menu_name: Joi.string().max(100).required(),
        url: Joi.string().max(1000).required().allow(null),
        classname: Joi.string().max(1000).required().allow(null),
        description: Joi.string().max(1000).required().allow(null),
        parent_id: Joi.number().required().allow(null),
        status: Joi.number().required(),
        sort_order: Joi.number().required(),
        reference_table: Joi.string().max(1000).required().allow(null),
        reference_flag: Joi.string().max(1000).required().allow(null)
    });
  
    let { error } = schema.validate(data);
    return error ? error.details[0].message.replace(/\"/g, "") : null;
  
}

function validateProfileItem(data) {

    let singleItem = Joi.number().allow(null);

    const schema = Joi.object().keys({
        profile_name: Joi.string().max(100).required(),
        menu_list: Joi.array().items(singleItem).min(1).required().error(errors => {
            errors.forEach(err => {
              switch (err.code) {
                case "array.min":
                  err.message = "A minimum of 1 menu item has to be selected!";
                  break
                default:
                  err.message = err.message;
              }
            })
            return errors;
          }),
        vm_operations: Joi.array().items(singleItem).required()
    });
  
    let { error } = schema.validate(data);
    return error ? error.details[0].message.replace(/\"/g, "") : null;
  
}

function validateUpdateProfileItem(data) {

    let singleItem = Joi.number().allow(null);

    const schema = Joi.object().keys({
        profile_name: Joi.string().max(100).required(),
        menu_list: Joi.array().items(singleItem).required(),
        vm_operations: Joi.array().items(singleItem).required()
    });
  
    let { error } = schema.validate(data);
    return error ? error.details[0].message.replace(/\"/g, "") : null;
  
}

function validateAddUserProfile(data) {

    const schema = Joi.object().keys({
        profile_id: Joi.number().required(),
        user_id: Joi.number().required()
    });
  
    let { error } = schema.validate(data);
    return error ? error.details[0].message.replace(/\"/g, "") : null;
  
}

function validateUpdateUserProfile(data) {

    const schema = Joi.object().keys({
        profile_id: Joi.number().required(),
        user_id: Joi.number().required()
    });
  
    let { error } = schema.validate(data);
    return error ? error.details[0].message.replace(/\"/g, "") : null;
  
}

function validateVMOperationItem(data) {

    const schema = Joi.object().keys({
        vm_action_name: Joi.string().max(100).required(),
        event: Joi.string().max(100).required(),
        description: Joi.string().max(1000).required().allow(null)
    });
  
    let { error } = schema.validate(data);
    return error ? error.details[0].message.replace(/\"/g, "") : null;
  
}

function validateUpdateVMOperationItem(data) {

    const schema = Joi.object().keys({
        vm_action_name: Joi.string().max(100).required(),
        event: Joi.string().max(100).required(),
        description: Joi.string().max(1000).required().allow(null),
        status: Joi.number().required()
    });
  
    let { error } = schema.validate(data);
    return error ? error.details[0].message.replace(/\"/g, "") : null;
  
}

module.exports = {
    validateMenuItem,
    validateUpdateMenuItem,
    validateProfileItem,
    validateUpdateProfileItem,
    validateAddUserProfile,
    validateUpdateUserProfile,
    validateVMOperationItem,
    validateUpdateVMOperationItem
};