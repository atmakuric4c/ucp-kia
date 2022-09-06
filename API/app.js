const apis = require("./config/api-config");
const PORT = 9891;

//console.log("process.env.PORT -- ",process.env.PORT);
//console.log("process.env -- ",process.env);
apis.app.listen(process.env.PORT || PORT, function() {
    console.log("server connected to port " + PORT);
});
