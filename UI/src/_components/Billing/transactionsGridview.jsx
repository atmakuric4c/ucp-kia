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
        this.values=[];
        this.props.billing.transactionsList.map((val, index) =>{
            this.values[index]={
                createddate : val.createddate,
                requested_amount: commonFns.fnFormatCurrency(val.requested_amount),
                clnt_txn_ref:val.clnt_txn_ref,
                request_type: val.request_type,
                txn_msg:val.txn_msg
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
                    label: 'Date',
                    field: 'createddate',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Transaction Amount',
                    field: 'requested_amount',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Transaction Ref. No',
                    field: 'clnt_txn_ref',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Transaction Type',
                    field: 'request_type',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Status',
                    field: 'txn_msg',
                    // sort: 'asc',
                    width: 200
                }
            ],
            rows: this.values
            }
        };
    }
    
    render() {
        const {billing}=this.props;
        let transactionsList = this.props.billing.transactionsList;
        const regex = /(<([^>]+)>)/ig;
        return (
            <div className="container-fluid main-body">
                <MDBDataTable
                striped
                hover
                data={this.state.data}
                />
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
