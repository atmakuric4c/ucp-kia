import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { billingActions } from './billing.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import ReactHtmlParser from 'react-html-parser'; 
import DatatablePage from './invoicesGridview';
import PageLoader from '../PageLoader';
import { toast } from 'react-toastify';

const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");
class billingInvoices extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      billing: [],
      invoicesList: [],
      pgiData : [],
      sweetalert: null,
      action: null
    };

    console.log(this.props);
    let message = new URLSearchParams(this.props.location.search).get("message");
    if(message){
    	toast.info(decodeURI(atob(message)));
    	
//    	let params = new URLSearchParams(this.props.location.search);
//    	// Delete the foo parameter.
//    	params.delete('message');
    	
//    	new URLSearchParams(this.props.location.search).delete("message");
//    	this.props.history.location.pathname =`${window.location.origin}/billingInvoices`;
    }
  }

  componentDidMount() {
    this.props.dispatch(billingActions.getInvoiceList(this.state.clientid));
  }
  render() { 
    const { billing } = this.props;
    let invoicesList = this.props.billing.invoicesList;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">Billing Invoices</h5>
          {!billing.error && billing.loading && <PageLoader/>}
          {billing.error && <span className="text-danger">ERROR - {billing.error}</span>}
          {invoicesList && !billing.loading && <DatatablePage invoicesList={invoicesList}/> }
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

const connected = connect(mapStateToProps)(billingInvoices);
export { connected as billingInvoices };