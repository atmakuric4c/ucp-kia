import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable } from 'mdbreact';

Modal.setAppElement("#app");
class BudgetModal extends React.Component {
    constructor(props) {
        super(props);
        let user = JSON.parse(localStorage.getItem("user"));
        
        this.state = {
            user:user.data,
            clientid: user.data.clientid,
            user_id: user.data.id,
            ticketDetail:[],
            data: {}
        };

    }

    

    preLoadBudgetInfo(){

        let listtoUse = [];
       
        if(this.props.budgetType == 'Azure'){
            listtoUse = JSON.parse(JSON.stringify(this.props.billingCommon.azurebudgetAlerts.data));
        }
        else if(this.props.budgetType == 'AWS'){
            listtoUse = JSON.parse(JSON.stringify(this.props.billingCommon.awsbudgetAlerts.data));
        }
        else if(this.props.budgetType == 'GCP'){
            listtoUse = JSON.parse(JSON.stringify(this.props.billingCommon.gcpbudgetAlerts.data));
        }

        let finalArr = listtoUse.map((element, index) => {
            return <div key={`percentage${index}`} className="form-group">
                    <label htmlFor="alertPercentage">Percentage<span className="star-mark">*</span></label>
                    <input
                    name={`percentage${index}`}
                    className="form-control"
                    defaultValue = {element['alert_percentage']}
                    onChange={e => this.props.alertChangeHandler(e, index)}
                    required                      
                    />
            </div>;
       });

       return finalArr;


    }


    render() {
        const {billingCommon} = this.props;
        const regex = /(<([^>]+)>)/ig;

        return (
            <Modal isOpen={this.props.billingCommon.showBudgetModal}  contentLabel="Edit Budget Alert">               
                  <h2 style={{color:'red'}}>
                      Edit Budget Alert <a style={{cursor:'pointer'}} className="float-right" onClick={e => this.props.handleBudgetModalClose(e)}><i className="fa fa-times" /></a>
                  </h2>

                  <div className="col-md-12">
                      <div className="panel panel-default" />
                      <form
                      name="editBudgetAlert"
                      id="editBudgetAlert"
                      onSubmit={this.props.updateAlertSubmitHandler}
                      >
                       {this.props.alerts && this.preLoadBudgetInfo()}
                       <input
                        name={`type`}
                        className="form-control"
                        value = {this.props.budgetType}
                        onChange={e => this.handleRole(e.target)}
                        required hidden 
                    />
                    <div className="text-center btn-form-submit-parent">
                       <button className="btn btn-sm btn-primary" type="submit">Submit</button>
                    </div>
                    </form>
                    </div>
          </Modal>
        );
        }
    }
    function mapStateToProps(state) {
        const { billingCommon } = state;
        return {
            billingCommon:billingCommon
        };
      }
      
    export default connect(mapStateToProps)(BudgetModal);
