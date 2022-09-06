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

Modal.setAppElement("#app");
class ViewReportDatatablePage extends React.Component {
    constructor(props) {
        super(props);
        this.hourlyReportviewValues=[];
        this.props.billing.hourlyReportview.map((val, index) =>{
            this.hourlyReportviewValues[index]={
                start_time:val.start_time,
                end_time:val.end_time,
                description:ReactHtmlParser (val.description),
                total_deduction:val.total_deduction,
            }
        })
        let user = JSON.parse(localStorage.getItem("user"));
        this.state = {
            user:user.data,
            reportData: {
                columns: [
                {
                    label: 'From Time',
                    field: 'start_time',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'To Time',
                    field: 'end_time',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Description',
                    field: 'description',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Amount Charged',
                    field: 'total_deduction',
                    // sort: 'asc',
                    width: 200
                }
            ],
            rows: this.hourlyReportviewValues
            }
        };
    }
    render() {
        const {billing}=this.props;
        let hourlyReportview = this.props.billing.hourlyReportview;
        const regex = /(<([^>]+)>)/ig;
        return (
            <div className="container-fluid main-body">
                <MDBDataTable
                striped
                hover
                data={this.state.reportData}
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
      
    export default connect(mapStateToProps)(ViewReportDatatablePage);
