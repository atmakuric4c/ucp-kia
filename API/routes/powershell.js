var express = require('express');
var router = express.Router();
const Shell = require('node-powershell');

/* GET users listing. */
router.get('/', function(req, res, next) {
    const ps = new Shell({
        executionPolicy: 'Bypass',
        noProfile: true
      });
      var data='-Server 127.0.0.1 -User Haritha -password test';
      ps.addCommand('../powershell/vcenter_connection.ps1',data);
      ps.invoke()
      .then(output => {
        console.log(output);
      })
      .catch(err => {
        console.log(err);
      });
});

module.exports = router;