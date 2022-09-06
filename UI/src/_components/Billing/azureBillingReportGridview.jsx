import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable } from 'mdbreact';

Modal.setAppElement("#app");
class DatatablePage extends React.Component {
    constructor(props) {
        super(props);
        this.values=[];
        this.props.billingReports.data.map((val, index) =>{
            this.values[index]={
                index: (index+1),
                subscription_id: val.subscription_id,
                meterId: val.meterId,
                meterName : val.meterName,
                meterCategory:val.meterCategory,
                meterSubCategory:val.meterSubCategory,
                total_quantity: val.total_quantity.toFixed(4),
                average_meter_rates: val.average_meter_rates.toFixed(4),
                total_usage_cost: val.total_usage_cost.toFixed(6),
                unit: val.unit
            }
        })
        let user = JSON.parse(localStorage.getItem("user"));
        
        this.state = {
            user:user.data,
            clientid: user.data.clientid,
            user_id: user.data.id,
            ticketDetail:[],
            modalIsOpen:false,
            values: this.values,
            data: {
                columns: [
                {
                    label: 'Index',
                    field: 'index',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Subscription Id',
                    field: 'subscription_id',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Meter Id',
                    field: 'meterId',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Meter Name',
                    field: 'meterName',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Meter Category',
                    field: 'meterCategory',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Meter Sub Category',
                    field: 'meterSubCategory',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Quantity',
                    field: 'total_quantity',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Meter Rates',
                    field: 'average_meter_rates',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Usage Cost',
                    field: 'total_usage_cost',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Unit',
                    field: 'unit',
                    // sort: 'asc',
                    width: 1000
                }
            ],
            rows: this.values
            }
        };
    }

    
    
    render() {
        const {billing}=this.props;
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
