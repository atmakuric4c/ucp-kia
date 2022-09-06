import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable } from 'mdbreact';

Modal.setAppElement("#app");
class AwsUsageForecastDatatablePage extends React.Component {
    constructor(props) {
        super(props);
        this.values=[];

        this.props.awsUsageForecast.data.map((val, index) =>{
            this.values[index] = {
                month: val.month,
                start_date: val.ForecastResultsByTime[0].TimePeriod.Start,
                end_date: val.ForecastResultsByTime[0].TimePeriod.End,
                total: parseFloat(val.Total.Amount).toFixed(4),
                unit: val.Total.Unit                
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
                    label: 'Month',
                    field: 'month',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Start Date',
                    field: 'start_date',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'End Date',
                    field: 'end_date',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Total',
                    field: 'total',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Unit',
                    field: 'unit',
                    // sort: 'asc',
                    width: 150
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
      
    export default connect(mapStateToProps)(AwsUsageForecastDatatablePage);
