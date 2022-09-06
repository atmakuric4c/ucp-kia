import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { billingActions } from './billing.actions';
import Modal from "react-modal";
import DatatablePage from './paymentsGridview';
import PageLoader from '../PageLoader';

Modal.setAppElement("#app");
class billingPayments extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      billing: [],
      paymentsList: [],
      pgiData : [],
      sweetalert: null,
      action: null
    };

  }

  componentDidMount() {
    this.props.dispatch(billingActions.getPaymentsList(this.state.clientid));
  }
  render() { 
    const { billing } = this.props;
    let paymentsList = this.props.billing.paymentsList;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">Billing Payments</h5>
          {!billing.error && billing.loading && <PageLoader/>}
          {billing.error && <span className="text-danger">ERROR - {billing.error}</span>}
          {paymentsList && !billing.loading && <DatatablePage paymentsList={paymentsList}/> }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  console.log(state);
  const { billing } = state;
  return {
    billing
  };
}

const connected = connect(mapStateToProps)(billingPayments);
export { connected as billingPayments };