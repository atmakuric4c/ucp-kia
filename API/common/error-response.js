function errorResponse(res, error) {
    if(error && error.type == "custom")
      return res.status(error.status).send({ status: error.status, message: error.message } );

    return res.status(500).send({status: "error", message:'The operation did not execute as expected. Please raise a ticket to support',code:error.message});
}

module.exports.errorResponse = errorResponse;