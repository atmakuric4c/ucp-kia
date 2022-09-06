import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { billingActions } from "../../_actions";
import Modal from "react-modal";
import BudgetAlertGridview from './budgetAlertGridview';
import BudgetModal from './budgetModal';
import PageLoader from '../PageLoader';
import SweetAlert from 'react-bootstrap-sweetalert';

Modal.setAppElement("#app");
class budgetAlerts extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      user: user,
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      pgiData : [],
      action: null,
      showBudgetModal: false,
      budgetType: '',
      arrAlert: []
    };

    this.handleBudgetModalOpen = this.handleBudgetModalOpen.bind(this)
    this.handleBudgetModalClose = this.handleBudgetModalClose.bind(this)
    this.alertChangeHandler = this.alertChangeHandler.bind(this)
    this.updateAlertSubmitHandler = this.updateAlertSubmitHandler.bind(this)

  }

  handleBudgetModalOpen(budgetType) {

    this.props.dispatch(billingActions.updateBudgetModal(true));

    this.setState({
      budgetType: budgetType
    })

    let intialValue = [];

    if(budgetType == 'Azure'){
      intialValue = JSON.parse(JSON.stringify(this.props.billingCommon.azurebudgetAlerts.data));
    }
    else if(budgetType == 'AWS'){
      intialValue = JSON.parse(JSON.stringify(this.props.billingCommon.awsbudgetAlerts.data));
    }
    else if(budgetType == 'GCP'){
      intialValue = JSON.parse(JSON.stringify(this.props.billingCommon.gcpbudgetAlerts.data));
    }

    this.setState({
      arrAlert: [...intialValue]
    })
    
  }


  handleBudgetModalClose(e) {
    e.preventDefault();
    this.props.dispatch(billingActions.updateBudgetModal(false));
  }


  alertChangeHandler (event, index) {
    let alerts = this.state.arrAlert;
    if(alerts[index])
    alerts[index]['alert_percentage'] = event.target.value;
    else {
      alerts[index] = {};
      alerts[index]['alert_percentage'] = event.target.value;
    }
    
    this.setState({arrAlert: alerts});
  }

  updateAlertSubmitHandler (event) {
    event.preventDefault();
    let alertParams = {clientid:this.state.clientid,cloudName: this.state.budgetType,arrAlert: {alert_info: this.state.arrAlert,user_id: this.state.user_id }}
    this.props.dispatch(billingActions.updateBudgetAlerts(alertParams));
  }
 
  
  componentDidMount() {

    if(this.state.user.data.azure_linked){
      let azureParams = {clientid:this.state.clientid,cloudName:'Azure'}
      this.props.dispatch(billingActions.getBudgetAlerts(azureParams));
    }
   
    if(this.state.user.data.is_aws_enabled){
      let awsParams = {clientid:this.state.clientid,cloudName:'AWS'}
      this.props.dispatch(billingActions.getBudgetAlerts(awsParams));
    }

    if(this.state.user.data.is_gcp_enabled){
      let gcpParams = {clientid:this.state.clientid,cloudName:'GCP'}
      this.props.dispatch(billingActions.getBudgetAlerts(gcpParams));
    }

  }

 

  render() { 
    const { billingCommon } = this.props;
    let budgetAlerts = billingCommon;

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">Budget Alerts</h5>
          {budgetAlerts.showBudgetModal && <BudgetModal 
              alerts = {budgetAlerts.azurebudgetAlerts} 
              budgetType = {this.state.budgetType} 
              handleBudgetModalClose={this.handleBudgetModalClose}
              alertChangeHandler={this.alertChangeHandler}
              updateAlertSubmitHandler={this.updateAlertSubmitHandler}>
          </BudgetModal>}
          {budgetAlerts.azurebudgetAlerts && <BudgetAlertGridview handleBudgetModalOpen={this.handleBudgetModalOpen} budgetAlerts={{ alerts: budgetAlerts.azurebudgetAlerts, type: 'Azure' }}/> }
          {budgetAlerts.awsbudgetAlerts && <BudgetAlertGridview handleBudgetModalOpen={this.handleBudgetModalOpen} budgetAlerts={{ alerts: budgetAlerts.awsbudgetAlerts, type: 'AWS' }}/> }
          {budgetAlerts.gcpbudgetAlerts && <BudgetAlertGridview handleBudgetModalOpen={this.handleBudgetModalOpen} budgetAlerts={{ alerts: budgetAlerts.gcpbudgetAlerts, type: 'GCP' }}/> }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { billingCommon } = state;
  return {
    billingCommon
  };
}

const connected = connect(mapStateToProps)(budgetAlerts);
export { connected as budgetAlerts };