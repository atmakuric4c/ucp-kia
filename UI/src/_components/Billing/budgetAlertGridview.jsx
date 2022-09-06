import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable } from 'mdbreact';

Modal.setAppElement("#app");
class BudgetAlertGridview extends React.Component {
    constructor(props) {
        super(props);
        
        let user = JSON.parse(localStorage.getItem("user"));
        
        this.state = {
            user:user.data,
            clientid: user.data.clientid,
            user_id: user.data.id,
            ticketDetail:[],
            modalIsOpen:false
        };
    }

    showBudgetModal(){
        let values = [];
        this.props.budgetAlerts.alerts.data.map((val, index) =>{
            values[index] = {
                index: (index + 1),
                alert_percentage : val.alert_percentage
            }
        })

        return {
            columns: [
            {
                label: 'SL',
                field: 'index',
                // sort: 'asc',
                width: 150
            },
            {
                label: 'Alert Percentage',
                field: 'alert_percentage',
                // sort: 'asc',
                width: 150
            }                
        ],
        rows: values
        }

    }

    render() {
        const {billing} = this.props;
        const regex = /(<([^>]+)>)/ig;
        return (
            <div className="container-fluid main-body">
                <div className="row">
                <div className="col-md-6">
                    <h5 className="color">{`${this.props.budgetAlerts.type}`}</h5>
                </div>
                <div className="col-md-6">
                    <div className="text-right">
                        <button className="btn btn-sm btn-primary" onClick = {(e) => this.props.handleBudgetModalOpen(this.props.budgetAlerts.type)} > <i className="fa fa-edit" ></i> Edit</button>
                    </div>
                </div>
                </div>
                <br></br>
                <MDBDataTable
                striped
                hover
                data={this.showBudgetModal()}
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
      
    export default connect(mapStateToProps)(BudgetAlertGridview);
