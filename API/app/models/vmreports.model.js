var db = require('../../config/database');
var dbFunc = require('../../config/db-function');
var dateFormat=require('dateformat')
var vmreportsModel = {
    getHourlyReport,getHourlyHistoryReport,generateVMReport,generateVmHourlyReport
}

async function generateVMReport(){
    //https://stackoverflow.com/questions/17450412/how-to-create-an-excel-file-with-nodejs
    var vmlist= await new Promise((resolve,reject) => {
        db.query(`SELECT * FROM infra_vms order by id desc`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });
    });
    // Require library
    var excel = require('excel4node');
    return new Promise(async (resolve,reject) => {
        // Create a new instance of a Workbook class
        var workbook = await new excel.Workbook();
        // Add Worksheets to the workbook
        var worksheet = await workbook.addWorksheet('VM List');
        // Create a reusable style
        var style = await workbook.createStyle({
        font: {
            color: '#000000',
            size: 14
        },
        //numberFormat: '$#,##0.00; ($#,##0.00); -'
        });
        await worksheet.cell(1,1).string('SL').style(style);
        await worksheet.cell(1,2).string('VM Name').style(style);
        await worksheet.cell(1,3).string('IP Address').style(style);
        await worksheet.cell(1,4).string('CPU').style(style);
        await worksheet.cell(1,5).string('RAM').style(style);
        await worksheet.cell(1,6).string('HDD').style(style);
        await worksheet.cell(1,7).string('OS Type').style(style);
        await worksheet.cell(1,8).string('Status').style(style);
        // Set value of cell A1 to 100 as a number type styled with paramaters of style
        for(j=0;j<vmlist.length;j++){
            var val=vmlist[j];
            await worksheet.cell(j+2,1).number(j+1);
            await worksheet.cell(j+2,2).string(val.name);
            await worksheet.cell(j+2,3).string(val.ip_address);
            await worksheet.cell(j+2,4).number(val.cpu_count);
            await worksheet.cell(j+2,5).number(val.ram);
            await worksheet.cell(j+2,6).number(val.hdd);
            await worksheet.cell(j+2,7).string(val.os_type);
            await worksheet.cell(j+2,8).string(val.status);
        }
        // Set value of cell A3 to true as a boolean type styled with paramaters of style but with an adjustment to the font size.
        //worksheet.cell(3,1).bool(true).style(style).style({font: {size: 14}});
        await workbook.write('./reports/vmlistreports.xlsx');
        resolve({filename:'vmlistreports.xlsx'});
    });
}
async function generateVmHourlyReport(reqObj){
    //https://stackoverflow.com/questions/17450412/how-to-create-an-excel-file-with-nodejs
    let vmHourlylist=await getHourlyHistoryReport(reqObj);
    // Require library
    var excel = require('excel4node');
    return new Promise(async (resolve,reject) => {
        // Create a new instance of a Workbook class
        var workbook = await new excel.Workbook();
        // Add Worksheets to the workbook
        var worksheet = await workbook.addWorksheet('VM Hourly Report');
        // Create a reusable style
        var style = await workbook.createStyle({
        font: {
            color: '#000000',
            size: 14
        },
        //numberFormat: '$#,##0.00; ($#,##0.00); -'
        });
        await worksheet.cell(1,1).string('SL').style(style);
        await worksheet.cell(1,2).string('VM Name').style(style);
        await worksheet.cell(1,3).string('Start Time').style(style);
        await worksheet.cell(1,4).string('End Time').style(style);
        await worksheet.cell(1,5).string('Memory (In MB)').style(style);
        await worksheet.cell(1,6).string('CPU Core').style(style);
        await worksheet.cell(1,7).string('Hard Disk (In GB)').style(style);
        await worksheet.cell(1,8).string('Power Status').style(style);
        await worksheet.cell(1,9).string('Created Date').style(style);
        // Set value of cell A1 to 100 as a number type styled with paramaters of style
        for(j=0;j<vmHourlylist.length;j++){
            var val=vmHourlylist[j];
            await worksheet.cell(j+2,1).number(j+1);
            await worksheet.cell(j+2,2).string(val.name);
            await worksheet.cell(j+2,3).string(dateFormat(new Date(val.starttime * 1000), "yyyy-mm-dd HH:MM:ss"));
            await worksheet.cell(j+2,4).string(dateFormat(new Date(val.endtime * 1000), "yyyy-mm-dd HH:MM:ss"));
            await worksheet.cell(j+2,5).number(val.memory);
            await worksheet.cell(j+2,6).number(val.cpu_core);
            await worksheet.cell(j+2,7).number(val.harddisk);
            await worksheet.cell(j+2,8).string(val.power_status?'On':'Off');
            await worksheet.cell(j+2,9).string(dateFormat(new Date(val.createddate * 1000), "yyyy-mm-dd HH:MM:ss"));
        }
        // Set value of cell A3 to true as a boolean type styled with paramaters of style but with an adjustment to the font size.
        //worksheet.cell(3,1).bool(true).style(style).style({font: {size: 14}});
        await workbook.write('./reports/vmhourlyreport.xlsx');
        resolve({filename:'vmhourlyreport.xlsx'});
    });
}
function getHourlyReport() {
    return new Promise((resolve,reject) => {
        db.query(`SELECT app.*,vm.name FROM app_hourly_reports as app inner join infra_vms as vm on  vm.id=app.vm_id group by app.vm_id order by app.id desc`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });
    });
}
function getHourlyHistoryReport(reqObj) {
    var vm_id=reqObj.vm_id;
    var start_time=reqObj.start_time;
    var end_time=reqObj.end_time;
    return new Promise((resolve,reject) => {
        db.query(`SELECT app.*,vm.name FROM app_hourly_reports as app inner join infra_vms as vm on vm.id=app.vm_id where app.vm_id='`+vm_id+`' and app.starttime >= '`+start_time+`' and app.endtime <= '`+end_time+`' order by app.id desc`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });
    });
}
module.exports = vmreportsModel;

