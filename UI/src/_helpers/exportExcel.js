//import XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import  moment  from 'moment';
const XLSX = require("xlsx")

export function exportBillingReportExcel(report){

    let data = report.data.map((singleRow, index) => { return {
        ['Index']: index + 1,
        ['Dimension']: singleRow['item_key'],
        ['Category']: singleRow['item_value'],
        ['Quantity']: singleRow['total_usage_quantity'],
        ['Usage Cost']: singleRow['total_blended_cost'],
        ['From Date']: moment(report.start_date).format('YYYY-MM-DD'),
        ['End Date']: moment(report.end_date).format('YYYY-MM-DD')
    }});

    const ws = XLSX.utils.json_to_sheet(data);
    let fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset-UTF-8';

    const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'AWS Billing Report');
    if(!wb.Props) wb.Props = {};
    wb.Props.Title = `AWS Billing Report ${moment(report.start_date).format('DDMMYYYY')} - ${moment(report.end_date).format('DDMMYYYY')}`;

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const val = new Blob([excelBuffer], { type: fileType } )

    saveAs(val, `AWS-Billing-Report-${moment(report.start_date).format('DDMMYYYY')}-${moment(report.end_date).format('DDMMYYYY')}.xlsx`);

}


export function exportAzureBillingReportExcel(report){

    let data = report.data.map((singleRow, index) => { return {
        ['Index']: index + 1,
        ['Subscription Id']: singleRow['subscription_id'],
        ['Meter Id']: singleRow['meterId'],
        ['Meter Name']: singleRow['meterName'],
        ['Meter Category']: singleRow['meterCategory'],
        ['Meter Sub Category']: singleRow['meterSubCategory'],
        ['Quantity']: singleRow['total_quantity'].toFixed(4),
        ['Meter Rates']: singleRow['average_meter_rates'].toFixed(4),
        ['Usage Cost']: singleRow['total_usage_cost'].toFixed(6),
        ['Unit']: singleRow['unit']
    }});

    const ws = XLSX.utils.json_to_sheet(data);
    let fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset-UTF-8';

    const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'Azure Billing Report');
    if(!wb.Props) wb.Props = {};
    wb.Props.Title = `Azure Billing Report ${moment(report.start_date).format('DDMMYYYY')} - ${moment(report.end_date).format('DDMMYYYY')}`;

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const val = new Blob([excelBuffer], { type: fileType } )

    saveAs(val, `Azure-Billing-Report-${moment(report.start_date).format('DDMMYYYY')}-${moment(report.end_date).format('DDMMYYYY')}.xlsx`);

}

export function exportDataToExcel(report){

//    let data = report.data.rows.map((singleRow, index) => { return {
//        ['Index']: index + 1,
//        ['Resource Group']: singleRow['resourceGroup'],
//    }});
	let data = report.data;
//    console.log("data ---- ", data);

    const ws = XLSX.utils.json_to_sheet(data);
    let fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset-UTF-8';

    const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, `${report.reportName}`);
    if(!wb.Props) wb.Props = {};
    wb.Props.Title = `Azure Billing Report`;

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const val = new Blob([excelBuffer], { type: fileType } )

    saveAs(val, `${report.reportName}-${moment(new Date()).format('YYYY-MM-DD hh:mm:ss')}.xlsx`);

}

export function exportGcpBillingReportExcel(report){

    let data = report.data.map((singleRow, index) => { return {
        ['Index']: index + 1,
        ['Account Name']: singleRow['bigquery_project_id'],
        ['Account ID']: singleRow['billing_account_id'],
        ['Product']: singleRow['service_description'],
        ['Resource Type']: singleRow['sku_description'],
        ['SKU ID']: singleRow['sku_id'],
        ['Description']: 'Usage',
        ['From Date']: moment(report.start_date).format('YYYY-MM-DD'),
        ['End Date']: moment(report.end_date).format('YYYY-MM-DD'),
        ['Quantity']: singleRow['total_quantity'],
        ['Unit']: singleRow['usage_pricing_unit'],
        ['Amount']: singleRow['total_usage_cost']
    }});

    const ws = XLSX.utils.json_to_sheet(data);
    let fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset-UTF-8';

    const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'GCP Billing Report');
    if(!wb.Props) wb.Props = {};
    wb.Props.Title = `GCP Billing Report ${moment(report.start_date).format('DDMMYYYY')} - ${moment(report.end_date).format('DDMMYYYY')}`;

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const val = new Blob([excelBuffer], { type: fileType } )

    saveAs(val, `GCP-Billing-Report-${moment(report.start_date).format('DDMMYYYY')}-${moment(report.end_date).format('DDMMYYYY')}.xlsx`);

}