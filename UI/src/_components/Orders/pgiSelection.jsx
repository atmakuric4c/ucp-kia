import React from 'react';
import { connect } from 'react-redux';
import { ordersActions } from './orders.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import PageLoader from '../PageLoader';
import { commonFns } from "../../_helpers/common";

const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");
class pgiSelection extends React.Component {
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
      TECHPROCESSSelection :"",
      EBSSelection : "active",
      PAYTMSelection : "",
      txnId : this.props.match.params.id
    };
    
    this.updatePgiSelection = this.updatePgiSelection.bind(this);
  }

  updatePgiSelection(sel) {
    if(sel == 'TECHPROCESS'){
      this.setState({ TECHPROCESSSelection: "active" });
      this.setState({ EBSSelection: "" });
      this.setState({ PAYTMSelection: "" });
    }else if(sel == 'EBS'){
      this.setState({ TECHPROCESSSelection: "" });
      this.setState({ EBSSelection: "active" });
      this.setState({ PAYTMSelection: "" });
    }else if(sel == 'PAYTM'){
      this.setState({ TECHPROCESSSelection: "" });
      this.setState({ EBSSelection: "" });
      this.setState({ PAYTMSelection: "active" });
    }
    this.props.dispatch(ordersActions.updatePgiSelection({
    	txnId : this.state.txnId,
    	paymentGateway : sel
    }));

  }

  componentDidMount() {
    this.props.dispatch(ordersActions.getTxnDetails(this.state.txnId));
  }

  render() { 
    const { orders } = this.props;
    let TxnDetails = this.props.orders.TxnDetails;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
        <h5 className="color">Select Payment Gateway</h5>
          {orders.loading && !orders.error && <PageLoader/>}
          {orders.error && <span className="text-danger">ERROR - {orders.error}</span>}
          {TxnDetails && !orders.loading &&
            <div className="">
              <div className="bhoechie-tab-container row">
                <div className="col-lg-3 col-md-3 col-sm-3 col-xs-3 bhoechie-tab-menu">
                  <div className="list-group">
                    {/* <a href="javascript:void(0)" onClick={e=>this.updatePgiSelection('TECHPROCESS')} className={"list-group-item text-center "+this.state.TECHPROCESSSelection}>
                      <img src="./src/img/techprocess.png" width="100px"/><br/>Credit / Debit / Net Banking<br/>(Issued In India)
                    </a> */}
                    <a href="javascript:void(0)" onClick={e=>this.updatePgiSelection('EBS')} className={"list-group-item text-center "+this.state.EBSSelection}>
                    <img src="./src/img/ebs.png" width="100px" /><br/>Credit / Debit / Net Banking / Wallets<br/>(Issued In India &amp; Other than India)
                    </a>
                    <a href="javascript:void(0)" onClick={e=>this.updatePgiSelection('PAYTM')} className={"list-group-item text-center "+this.state.PAYTMSelection}>
                    <img src="./src/img/paytm.png" width="100px" /><br/> Pay with PayTM<br/>
                    </a>
                  </div>
                </div>
                
                <div className="ml-3 col-lg-6 col-md-6 col-sm-6 col-xs-6 bhoechie-tab">
                  <div className={"bhoechie-tab-content "+this.state.TECHPROCESSSelection+" "+(this.state.TECHPROCESSSelection == 'active' ? 'd-block' : 'd-none')}>
                    <h6 className="mt-2">Credit Cards / Debit Cards / Net Banking <br/><span className="required">(Issued In India)</span></h6>
                    <div className="col-md-12">
                      <br/><br/>
                      <h4 className="color">Payable Amount : <strong className="currency-symbol color">{commonFns.fnFormatCurrency(TxnDetails.requested_amount)}</strong></h4>
                      <br/>
                      <br/>
                      <div className="pull-right"><a className="btn badge adge-md badge-primary" href={"/#/pgitpsl/"+this.state.txnId}>Pay Now</a></div>
                    </div>
                  </div>
                  <div className={"bhoechie-tab-content "+this.state.EBSSelection+" "+(this.state.EBSSelection == 'active' ? 'd-block' : 'd-none')}>
                    <h6 className="mt-2">Credit Cards / Debit Cards / Net Banking / Wallets <br/><span className="required">(Issued In India &amp; Other than India)</span></h6>
                    <div className="col-md-12">
                      <br/><br/>
                      <h4 className="color">Payable Amount : <strong className="currency-symbol color">{commonFns.fnFormatCurrency(TxnDetails.requested_amount)}</strong></h4>
                      <br/>
                      <span className="required app-color">Credit Cards / Debit Cards / Net Banking / Wallets</span><br/>
                      (You can use ItzCash, ICash ,PayCash ,YPayCash ,MobiKwik ,PayZapp ,Jio money, Mrupee,AMEX Cards also)
                      <br/>
                      
                      <div className="pull-right"><a className="btn badge adge-md badge-primary" href={"/#/pgiebs/"+this.state.txnId}>Pay Now</a></div>
                    </div>
                  </div>
                  <div className={"bhoechie-tab-content "+this.state.PAYTMSelection+" "+(this.state.PAYTMSelection == 'active' ? 'd-block' : 'd-none')}>
                    <h6 className="mt-2" >Pay with PayTM Wallet <br/><span className="required">(Issued In India)</span></h6>
                      <div className="col-md-12">
                        <br/><br/>
                        <h4  className="color">Payable Amount : <strong className="currency-symbol color">{commonFns.fnFormatCurrency(TxnDetails.requested_amount)}</strong></h4>
                        <br/><br/>
                        <div className="pull-right"><a className="btn badge adge-md badge-primary" href={"/#/pgiPaytm/"+this.state.txnId}>Pay Now</a></div>
                      </div>
                  </div>
                </div>
              </div>
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

const connectedPgiSelection = connect(mapStateToProps)(pgiSelection);
export { connectedPgiSelection as pgiSelection };