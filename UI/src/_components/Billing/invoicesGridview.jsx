import React from 'react';
import { connect } from 'react-redux';
import config from 'config';
import Modal from "react-modal";
import { billingActions } from './billing.actions';
import { MDBDataTable } from 'mdbreact';
import nl2br from "react-newline-to-break";
import utf8 from 'utf8';
import Moment from 'react-moment';
var serialize = require("form-serialize");
import ReactHtmlParser from 'react-html-parser';
import { commonFns } from "../../_helpers/common";


Modal.setAppElement("#app");
class DatatablePage extends React.Component {
    constructor(props) {
        super(props);
        this.payInv = this.payInv.bind(this);
        this.values=[];
        this.props.billing.invoicesList.invList.map((val, index) =>{
            this.values[index]={
                inv_display_id : val.inv_display_id,
                inv_amount:commonFns.fnFormatCurrency(val.inv_amount),
                payable_amount:commonFns.fnFormatCurrency(val.payable_amount),
                balance_amount: commonFns.fnFormatCurrency(val.balance_amount),
                inv_date:val.inv_date,
                inv_due_date:val.inv_due_date,
                inv_status:val.inv_status,
                // download:<a href={`${config.apiUrl}/download/downloadfile?file=`+val.inv_path+`&type=INVOICE`} download><i className="fa fa-download"></i></a>,
                download:<a href={val.download_path} target="_blank"><i className="fa fa-download"></i></a>,
                pay:((val.inv_status=='UNPAID')?(<a href="javascript:void(0);" onClick={() => this.payInv(val.id,val.balance_amount)} className="btn btn-ctrls badge-primary" >Pay Now</a>):'-'),
            }
        })
        let user = JSON.parse(localStorage.getItem("user"));
        
        this.state = {
            user:user.data,
            clientid: user.data.clientid,
            user_id: user.data.id,
            ticketDetail:[],
            modalIsOpen:false,
            data: {
                columns: [
                {
                    label: 'Invoice#',
                    field: 'inv_display_id',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Amount',
                    field: 'inv_amount',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Payable Amount',
                    field: 'payable_amount',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Due',
                    field: 'balance_amount',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Date',
                    field: 'inv_date',
                    // sort: 'asc',
                    width: 200
                },
                {
                    label: 'Due Date',
                    field: 'inv_due_date',
                    // sort: 'asc',
                    width: 200
                },
                {
                    label: 'Invoice Status',
                    field: 'inv_status',
                    // sort: 'asc',
                    width: 200
                },
                {
                    label: ReactHtmlParser ('<i class="fa fa-download" text="Download"></i>'),
                    field: 'download',
                    // sort: 'asc',
                    width: 200
                },
                {
                    label: 'Pay',
                    field: 'pay',
                    // sort: 'asc',
                    width: 200
                }
            ],
            rows: this.values
            }
        };
        // this.replyTicket = this.replyTicket.bind(this);
    }

    payInv(id,amnt) {
        let reqData = {'inv_id':id,user_id:this.state.user_id,clientid:this.state.clientid,grand_total:amnt,currency:this.props.billing.invoicesList.otherData.currency};
        this.props.dispatch(billingActions.payInvoice(reqData));
    }
    
    render() {
        const {billing}=this.props;
        let invoicesList = this.props.billing.invoicesList;
        const regex = /(<([^>]+)>)/ig;
        return (
            <div className="container-fluid main-body">
                <div className="row p-0 billing-invoice-header">
                    <span className="alert info-box-success mr-2">Total Invoices : {invoicesList.otherData.total_invoices}</span>
                    <span className="alert info-box-warning mr-2">Unpaid Invoices: {invoicesList.otherData.due_invoice_count}</span>
                    <span className="alert info-box-danger">Total Due Amount : <span className="currency-symbol"> {commonFns.fnFormatCurrency(invoicesList.otherData.due_amount)}</span></span>
                </div>
                <div className="clear-both"></div>
                <div className="clear-both">
                    <MDBDataTable
                    striped
                    hover
                    data={this.state.data}
                    />
                </div>
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
