
const cron = require("node-cron");
const express = require("express");
const crayonModel = require('./models/crayon_model');
app = express();

//# ┌────────────── second (optional)
//# │ ┌──────────── minute
//# │ │ ┌────────── hour
//# │ │ │ ┌──────── day of month
//# │ │ │ │ ┌────── month
//# │ │ │ │ │ ┌──── day of week
//# │ │ │ │ │ │
//# │ │ │ │ │ │
//# * * * * * *
//field	value
//second	0-59
//minute	0-59
//hour	0-23
//day of month	1-31
//month	1-12 (or names)
//day of week	0-7 (or names, 0 or 7 are sunday)

//run daily once at 12:05 AM
cron.schedule("0 5 0 * * *", function() {
    console.log("Running Cron Job For syncCrayonUsageData.");
    crayonModel.syncCrayonUsageData([],function(err,result){});
});

app.listen("3133");