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
class pgiebs extends React.Component {
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
      ebsSelection : "active",
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
              <form  method="post" name="frmTransaction" id="frmTransaction" action="https://secure.ebs.in/pg/ma/payment/request">
                <input name="account_id" type="hidden" value={TxnDetails.ACCOUNTID} />     
                <input name="return_url" type="hidden" size="60" value={TxnDetails.returnurl} />
                <input name="mode" type="hidden" size="60" value={TxnDetails.MODE} />
                <input name="reference_no" type="hidden" value={TxnDetails.uid} />
                <input type="hidden" value="0" name="channel" />
                <input name="amount" type="hidden" value={TxnDetails.AMOUNT} />
                <input name="description" type="hidden" value={TxnDetails.request_type} />
                <input name="name" type="hidden" value={(TxnDetails.company_name.length>0)?TxnDetails.company_name:'Ctrl4c'} />
                <input name="address" type="hidden" value={(TxnDetails.address.length>0)?TxnDetails.address:'Hyderabad'} />
                <input name="city" type="hidden" value={(TxnDetails.city.length>0)?TxnDetails.city:'Hyderabad'} />
                <input name="state" type="hidden" value={(TxnDetails.state.length>0)?TxnDetails.state:'Telangana'} />
                <input name="postal_code" type="hidden" value={(TxnDetails.postalcode >5)?TxnDetails.postalcode:'500081'} />
                <input name="country" type="hidden" value="Ind" />
                <input name="phone" type="hidden" value={(TxnDetails.phone.length>0)?TxnDetails.phone:'04046474747'} />
                <input name="email" type="hidden" size="60" value={TxnDetails.email} />
                <input name="ship_name" type="hidden" value={(TxnDetails.company_name.length>0)?TxnDetails.company_name:'Ctrl4c'} />
                <input name="ship_address" type="hidden" value={(TxnDetails.address >3)?TxnDetails.address:"Hyderabad"} />
                <input name="ship_city" type="hidden" value={(TxnDetails.city.length>0)?TxnDetails.city:'Hyderabad'} />
                <input name="ship_state" type="hidden" value={(TxnDetails.state.length>0)?TxnDetails.state:'Telangana'} />
                <input name="ship_postal_code" type="hidden" value={(TxnDetails.postalcode >5)?TxnDetails.postalcode:'500081'} />
                <input name="ship_country" type="hidden" value="Ind" />
                <input name="ship_phone" type="hidden" value={TxnDetails.phone} />
                <input name="secure_hash" type="hidden" value={TxnDetails.secure_hash} />
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

const connectedPgiebs = connect(mapStateToProps)(pgiebs);
export { connectedPgiebs as pgiebs };