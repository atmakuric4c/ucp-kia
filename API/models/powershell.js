const Shell = require('node-powershell');
/* Check Vcenter Connection */
let exicutePSscript=function(filename,params, callback) {
    /*const ps = new Shell({
      executionPolicy: 'Bypass',
      noProfile: true
    });*/
    const ps = new Shell();
    //Please configure the below folder based on vcenter version
    var powershellVersion='powershellv6';

    /****for vcenter version 6 and above****/
    //ps.addCommand('Get-Module -Name VMware* -ListAvailable | Import-Module')
    if(powershellVersion=='powershellv6')
    var psrequest='powershell -ExecutionPolicy ByPass -file "'+process.cwd()+'/'+powershellVersion+'/'+filename+'.ps1" '+params;
    /********/
    /****for vcenter below version 6****/
    /********/
    if(powershellVersion=='powershellv5')
    var psrequest='powershell -psc "C:/Program Files (x86)/VMware/Infrastructure/vSphere PowerCLI/vim.psc1" -ExecutionPolicy ByPass -file "'+process.cwd()+'/'+powershellVersion+'/'+filename+'.ps1" '+params;
    psrequest=psrequest.replace(/"/g,"'");
    console.log(psrequest)
    ps.addCommand(psrequest)
    ps.invoke()
    .then(output => {
      console.log({result:output})
      return callback(output);
    })
    .catch(err => {
      console.log({err:err})
      return callback('The operation did not execute as expected. Please raise a ticket to support');
    });
}
module.exports={
  exicutePSscript
}