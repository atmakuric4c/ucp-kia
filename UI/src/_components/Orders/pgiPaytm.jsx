import React from 'react';
import { connect } from 'react-redux';
import { ordersActions } from './orders.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import PageLoader from '../PageLoader';
const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");
class pgiPaytm extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      orders: [],
      TxnDetails: [],
      sweetalert: null,
      action: null,
      tpslSelection :"",
      paytmSelection : "active",
      paytmSelection : "",
      txnId : this.props.match.params.id
    };
    
    this.submitform = this.submitform.bind(this);
  }

  submitform(){
    if(typeof document.forms["frmTransaction"] != 'undefined'){
      document.forms["frmTransaction"].submit();
    }
  }
  componentDidMount() {
    this.props.dispatch(ordersActions.getTxnDetails(this.state.txnId));
    // this.submitform();
    const interval = setInterval(() => {
      if(typeof this.props.orders.TxnDetails != 'undefined' && Object.keys(this.props.orders.TxnDetails).length > 0){
        this.submitform();
        clearInterval(interval);
      }
    }, 1000);
  }

  render() { 
    const { orders } = this.props;
    let TxnDetails = this.props.orders.TxnDetails;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          {(!orders.error) &&
            <div className="alert-middle"> Please wait we are processing your request.
              <br/> 
              Don't refresh/close the page....
            </div>
          }
          {!orders.error && orders.loading && <PageLoader/>}
          {orders.error && <span className="text-danger">ERROR - {orders.error}</span>}
          {TxnDetails && TxnDetails.AMOUNT && !orders.loading &&
            <div className="tableresp table-responsive">
              <form  method="post" name="frmTransaction" id="frmTransaction" action={TxnDetails.PAYTM_TXN_URL}>
	              {TxnDetails.paramList && Object.keys(TxnDetails.paramList).length > 0 && Object.keys(TxnDetails.paramList).map(key => 
	              	<input name={key} type="hidden" value={TxnDetails.paramList[key]}  key={key} />
	              )}
	              <input name="CHECKSUMHASH" type="hidden" value={TxnDetails.checksum} />
              </form>
              {this.state.sweetalert}
            </div>
          }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  console.log(state);
  const { orders } = state;
  return {
    orders
  };
}

const connectedPgiPaytm = connect(mapStateToProps)(pgiPaytm);
export { connectedPgiPaytm as pgiPaytm };