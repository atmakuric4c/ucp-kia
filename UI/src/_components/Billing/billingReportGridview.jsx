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
                item_key : val.item_key,
                item_value:val.item_value,
                blended_cost:val.blended_cost,
                unblended_cost:val.unblended_cost,
                usage_quantity: val.usage_quantity,
                granularity: val.granularity,
                usage_date: val.usage_date,
                //created_date: moment(val.created_date).format('yyyy/MM/DD'),
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
                    label: 'SL',
                    field: 'index',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Service',
                    field: 'item_key',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Item Value',
                    field: 'item_value',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Blended Cost',
                    field: 'blended_cost',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'UnBlended Cost',
                    field: 'unblended_cost',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Usage Quantity',
                    field: 'usage_quantity',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Granularity',
                    field: 'granularity',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Usage Date',
                    field: 'usage_date',
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
