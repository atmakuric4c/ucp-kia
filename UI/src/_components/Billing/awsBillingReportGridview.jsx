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
                item_key : val.item_key,
                item_value:val.item_value,
                total_blended_cost:val.total_blended_cost,
                total_usage_quantity: val.total_usage_quantity,
                start_date: moment(this.props.date.start_date).format('YYYY-MM-DD'),
                end_date: moment(this.props.date.end_date).format('YYYY-MM-DD')
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
                    label: 'Dimension',
                    field: 'item_key',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Category',
                    field: 'item_value',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Quantity',
                    field: 'total_usage_quantity',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Usage Cost',
                    field: 'total_blended_cost',
                    // sort: 'asc',
                    width: 150
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
