import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { billingActions } from './billing.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import ReactHtmlParser from 'react-html-parser'; 
import DatatablePage from './transactionsGridview';
import PageLoader from '../PageLoader';

const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");
class billingTransactions extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      billing: [],
      transactionsList: [],
      pgiData : [],
      sweetalert: null,
      action: null
    };

  }

  componentDidMount() {
    this.props.dispatch(billingActions.getTransactionsList(this.state.clientid));
  }
  render() { 
    const { billing } = this.props;
    let transactionsList = this.props.billing.transactionsList;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">Billing Transactions</h5>
          {!billing.error && billing.loading && <PageLoader/>}
          {billing.error && <span className="text-danger">ERROR - {billing.error}</span>}
          {transactionsList && !billing.loading && <DatatablePage transactionsList={transactionsList}/> }
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

const connected = connect(mapStateToProps)(billingTransactions);
export { connected as billingTransactions };