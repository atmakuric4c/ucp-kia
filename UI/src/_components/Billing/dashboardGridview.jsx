import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { billingActions } from './billing.actions';
import { MDBDataTable } from 'mdbreact';
import nl2br from "react-newline-to-break";
import utf8 from 'utf8';
import Moment from 'react-moment';
var serialize = require("form-serialize");
import ReactHtmlParser from 'react-html-parser';
import DatePicker from "react-datepicker";
import config from 'config';
import { commonFns } from "../../_helpers/common";
import PageLoader from '../PageLoader';

Modal.setAppElement("#app");
class DatatablePage extends React.Component {
    constructor(props) {
        super(props);
        this.openModalOrderView = this.openModalOrderView.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.values=[];
        this.props.billing.orderList.map((val, index) =>{
            this.values[index]={
                sno : (index +1),
                order_number:val.order_number,
                order_type:val.order_type,
                info:ReactHtmlParser (val.info),
                quantity:val.quantity,
                billing_frequency:val.billing_frequency,
                price:commonFns.fnFormatCurrency(val.price),
                status:val.status,
                details : <a href="javascript:void(0);" onClick={() => this.openModalOrderView(val)} className="btn badge adge-md badge-primary">Details</a>
            }
        })
        let user = JSON.parse(localStorage.getItem("user"));
        this.state = {
            user:user.data,
            orderDetail:[],
            hourlyReportview :[],
            hourlyReportDownload : [],
            modalIsOpen:false,
            isViewReport:false,
            startDate: new Date(),
            endDate: new Date(),
            data: {
                columns: [
                {
                    label: 'S. No.',
                    field: 'sno',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Order #',
                    field: 'order_number',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Product Type',
                    field: 'order_type',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Info',
                    field: 'info',
                    // sort: 'asc',
                    width: 200
                },
                {
                    label: 'Quantity',
                    field: 'quantity',
                    // sort: 'asc',
                    width: 200
                },
                {
                    label: 'Billing Frequency',
                    field: 'billing_frequency',
                    // sort: 'asc',
                    width: 200
                },
                {
                    label: 'Price',
                    field: 'price',
                    // sort: 'asc',
                    width: 200,
                    class: "currency-symbol"
                },
                {
                    label: 'Status',
                    field: 'status',
                    // sort: 'asc',
                    width: 200
                },
                {
                    label: 'Details',
                    field: 'details',
                    // sort: 'asc',
                    width: 200
                }
            ],
            rows: this.values
            }
        };
        this.handleChangeStartDate = this.handleChangeStartDate.bind(this);
        this.handleChangeEndDate = this.handleChangeEndDate.bind(this);
        this.downloadHourlyReportRequest = this.downloadHourlyReportRequest.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
    }
    handleChangeStartDate(date) {
        this.setState({
          startDate: date
        });
      }
    handleChangeEndDate(date) {
        this.setState({
          endDate: date
        });
      }
    openModalOrderView(item) {
        this.setState({orderDetail:{},isViewReport:false});
        this.props.billing.orderDetail = {};
        // this.props.billing.hourlyReportview = [];
        delete this.props.billing.error;
        this.props.dispatch(billingActions.getOrderDetails(item));
        this.setState({ modalIsOpen: true });
    }
    closeModal() {
        this.setState({ modalIsOpen: false });
    } 

    viewHourlyReportRequest = e => {
        e.preventDefault();      
        this.props.billing.hourlyReportview = [];
        delete this.props.billing.error;
        var form = document.querySelector("#viewHourlyReportFrm");
        var formData = serialize(form, { hash: true });
        formData = Object.assign(formData, {from_date:this.state.startDate,to_date:this.state.endDate});
        this.props.dispatch(billingActions.viewHourlyReport(formData))
        this.setState({ isViewReport : true });
      };

      downloadFile(filename){
          let downloadPath = `${config.apiUrl}/download/downloadfile?file=`+filename+`&type=REPORT&time=${(new Date().getTime() / 1000)}`;
          window.open(downloadPath);
        //   window.location.href = downloadPath;
      }

      downloadHourlyReportRequest(){
        this.props.billing.hourlyReportview = [];
        this.setState({ isViewReport : false });
        if(typeof this.props.billing.hourlyReportDownload != 'undefined'){
        	delete this.props.billing.hourlyReportDownload;
        	if(typeof this.props.billing.hourlyReportDownload != 'undefined' && typeof this.props.billing.hourlyReportDownload.filename != 'undefined'){
        		delete this.props.billing.hourlyReportDownload.filename;
        	}
        }
        delete this.props.billing.error;
        var form = document.querySelector("#viewHourlyReportFrm");
        var formData = serialize(form, { hash: true });
        formData = Object.assign(formData, {from_date:this.state.startDate,to_date:this.state.endDate});
        this.props.dispatch(billingActions.downloadHourlyReport(formData))
        const interval = setInterval(() => {
            if(typeof this.props.billing.hourlyReportDownload != 'undefined' && typeof this.props.billing.hourlyReportDownload.filename != 'undefined'){
              this.downloadFile(this.props.billing.hourlyReportDownload.filename);
              clearInterval(interval);
            }else if(typeof this.props.billing.hourlyReportDownload != 'undefined' && typeof this.props.billing.error != 'undefined'){
                clearInterval(interval);
            }
          }, 1000);
      };
    
    render() {
        const {billing}=this.props;
        let orderDetail = this.props.billing.orderDetail;
        let hourlyReportview = this.props.billing.hourlyReportview;
        
        const regex = /(<([^>]+)>)/ig;
        return (
            <div className="">
                <MDBDataTable
                striped
                hover
                data={this.state.data}
                />
                <Modal
                    isOpen={this.state.modalIsOpen}
                    onRequestClose={this.closeModal}
                    contentLabel="Order Detail" className="metrics">
                    <h2 style={{ color: 'red' }}>
                        Order Details <a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
                    </h2>
                    {billing.loading && <PageLoader/>}
                    
                    {orderDetail && orderDetail.producttype && 
                        <div>
                            {(orderDetail.producttype=='CLOUD' 
                            || orderDetail.producttype=='AZURE'
                            || orderDetail.producttype=='AWS'
                            || orderDetail.producttype=='GCP') &&
                                <div className="row">
                                    <div className="col-sm-6">
                                        <strong>Instance Name:</strong>
                                    </div>
                                    <div className="col-sm-6">
                                        {orderDetail.label_name}
                                    </div>
                                    <div className="col-sm-6">
                                        <strong>Price:</strong>
                                    </div>
                                    <div className="col-sm-6 currency-symbol">
                                        {commonFns.fnFormatCurrency(orderDetail.price)}
                                    </div>
                                    <div className="col-sm-6">
                                        <strong>Billing Frequency:</strong>
                                    </div>
                                    <div className="col-sm-6">
                                        {orderDetail.billingfrequency}
                                    </div>
                                    <div className="col-sm-6">
                                        <strong>Quantity:</strong>
                                    </div>
                                    <div className="col-sm-6">
                                        {orderDetail.quantity}
                                    </div>
                                </div>
                            }
                            {(orderDetail.producttype !='CLOUD' 
                            && orderDetail.producttype !='AZURE'
                            && orderDetail.producttype !='AWS'
                            && orderDetail.producttype !='GCP') &&
                                <div className="row">
                                    <div className="col-sm-6">
                                        <strong>Name:</strong>
                                    </div>
                                    <div className="col-sm-6">
                                        {orderDetail.description}
                                    </div>
                                    <div className="col-sm-6">
                                        <strong>Quantity:</strong>
                                    </div>
                                    <div className="col-sm-6">
                                        {orderDetail.quantity}
                                    </div>
                                </div>
                            }
                            {(orderDetail.billingfrequency =='HOURLY' && orderDetail.producttype=='CLOUD')
                            || (orderDetail.producttype=='AZURE'
                            || orderDetail.producttype=='AWS'
                            || orderDetail.producttype=='GCP')
                             &&
                                <div className="col-md-12">
                                    <div className="panel panel-default" />
                                    <form
                                    name="viewHourlyReportFrm"
                                    id="viewHourlyReportFrm"
                                    method="post"
                                    onSubmit={this.viewHourlyReportRequest}
                                    >
                                    <div className="row">
                                        <div className="form-group col-sm-4">
                                        <label htmlFor="from_date">From Date :&nbsp;</label>
                                        
                                        <DatePicker
                                            dateFormat="yyyy/MM/dd"
                                            selected={this.state.startDate}
                                            selectsStart
                                            startDate={this.state.startDate}
                                            endDate={this.state.endDate}
                                            onChange={this.handleChangeStartDate}
                                        />
                                        </div>
                                        <div className="form-group col-sm-4">
                                        <label htmlFor="to_date">To Date :&nbsp;</label>
                                        <DatePicker
                                            dateFormat="yyyy/MM/dd"
                                            selected={this.state.endDate}
                                            selectsEnd
                                            startDate={this.state.startDate}
                                            endDate={this.state.endDate}
                                            onChange={this.handleChangeEndDate}
                                        />
                                        </div>
                                        <div className="form-group col-sm-4">
                                        <label>&nbsp;</label>
                                        <input type="hidden" name="prodtype" value={orderDetail.producttype} />
                                        <input type="hidden" name="typeid" value={orderDetail.vmid} />
                                        <button className="btn btn-success ">View</button>&nbsp;&nbsp;<a href="javascript:void(0);" onClick={() => this.downloadHourlyReportRequest()} className="btn btn-success" >Download</a>
                                        </div>
                                    </div>
                                    </form>
                                    <div className="col-md-12 p-0">
                                        <div className="panel panel-default">
                                            {this.state.isViewReport && hourlyReportview && (
                                            <div className="tableresp table-responsive">
                                                {/* <ViewReportDatatablePage 
                                                hourlyReportview={hourlyReportview}
                                                /> */}
                                                <table className="table table-bordered table-hover" id="cartList" style={{ background: '#fafafa' }}>
                                                    <thead>
                                                        <tr>
                                                            <th>From Time</th>
                                                            <th>To Time</th>
                                                            <th>Description</th>
                                                            <th>Amount Charged</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {hourlyReportview.length > 0 && hourlyReportview.map((itemData, index) =>
                                                            <tr key={index}>
                                                                <td>{itemData.start_time}</td>
                                                                <td>{itemData.end_time}</td>
                                                                <td>{itemData.description}</td>
                                                                <td>{itemData.total_deduction}</td>
                                                            </tr>
                                                        )}
                                                        {(!hourlyReportview || hourlyReportview.length == 0) && 
                                                            <tr>
                                                                <td colSpan="4" align="center">Data not found.</td>
                                                            </tr>
                                                        }
                                                    </tbody>
                                                </table>
                                            </div>
                                            )}
                                            
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    }
                    {billing.error && <span className="text-danger">ERROR - {billing.error}</span>}
                </Modal>
            </div>
        );
        }
    }
    function mapStateToProps(state) {
        const { billing } = state;
        return {
            billing:billing
        };
      }
      
    export default connect(mapStateToProps)(DatatablePage);
