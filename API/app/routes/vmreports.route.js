const vmreportService = require('../services/vmreports.service');

function init(router) {
    router.route('/vmreports/hourlyReport').get(getHourlyReport);
    router.route('/vmreports/hourlyHistoryReport').post(getHourlyHistoryReport);
    router.route('/vmreports/generateVMReport').get(generateVMReport);
    router.route('/vmreports/generateVmHourlyReport').post(generateVmHourlyReport);
}
function generateVMReport(req,res) {
  vmreportService.generateVMReport().then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}

function getHourlyReport(req,res) {
    vmreportService.getHourlyReport().then((data) => {
      res.send(data);
    }).catch((err) => {      
      res.send(err);
    });
}
function getHourlyHistoryReport(req,res) {
  vmreportService.getHourlyHistoryReport(req.body).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}
function generateVmHourlyReport(req,res) {
  vmreportService.generateVmHourlyReport(req.body).then((data) => {
    res.send(data);
  }).catch((err) => {      
    res.send(err);
  });
}
module.exports.init = init;