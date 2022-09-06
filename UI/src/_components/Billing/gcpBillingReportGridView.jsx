import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable } from 'mdbreact';
import moment from 'moment';

Modal.setAppElement("#app");
class DatatablePage extends React.Component {
    constructor(props) {
        super(props);
        this.values=[];
        this.props.billingReports.data.map((val, index) =>{
            this.values[index]={
                index: (index+1),
                bigquery_project_id: val.bigquery_project_id,
                billing_account_id: val.billing_account_id,
                service_description: val.service_description,
                sku_description: val.sku_description,
                sku_id: val.sku_id,
                description: 'Usage',
                start_date: moment(this.props.date.start_date).format('YYYY-MM-DD'),
                end_date: moment(this.props.date.end_date).format('YYYY-MM-DD'),
                total_quantity: val.total_quantity,
                usage_pricing_unit: val.usage_pricing_unit,
                total_usage_cost: val.total_usage_cost
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
                    label: 'Account Name',
                    field: 'bigquery_project_id',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Account ID',
                    field: 'billing_account_id',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Product',
                    field: 'service_description',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Resource Type',
                    field: 'sku_description',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'SKU ID',
                    field: 'sku_id',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Description',
                    field: 'description',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'From Date',
                    field: 'start_date',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'End Date',
                    field: 'end_date',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Quantity',
                    field: 'total_quantity',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Unit',
                    field: 'usage_pricing_unit',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Amount',
                    field: 'total_usage_cost',
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
