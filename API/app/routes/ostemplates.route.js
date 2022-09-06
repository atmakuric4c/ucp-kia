const ostemplatesService = require('../services/ostemplates.service');

function init(router) {
    router.route('/ostemplates').get(getAllOStemplates);
    router.route('/ostemplates/:id').put(updateOStemplate);   
}

function getAllOStemplates(req,res) {
    ostemplatesService.getAllOStemplates().then((data) => {
      res.send(data);
    }).catch((err) => {      
      res.send(err);
    });
}

function updateOStemplate(req,res) {
    var osformData=req.body;
    var id = req.params.id;
    ostemplatesService.updateOStemplate(id,osformData).then((data)=>{
       res.json(data);
   }).catch((err)=>{
       mail.mail(err);
       res.json(err);
    });
 }

module.exports.init = init;