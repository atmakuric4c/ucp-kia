import React from 'react';
import { connect } from 'react-redux';
import { ordersActions } from './orders.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import PageLoader from '../PageLoader';
import { commonFns } from "../../_helpers/common";
import { toast } from 'react-toastify';

const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");
class txnFailed extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      orders: [],
      TxnSuccessData: [],
      sweetalert: null,
      action: null,
      txnId : this.props.match.params.id
    };
    
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
    this.props.dispatch(ordersActions.getTxnSuccessData(this.state.txnId));
  }
  render() { 
    const { orders } = this.props;
    let TxnSuccessData = this.props.orders.TxnSuccessData;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          
          {!orders.error && orders.loading && <em><PageLoader/></em>}
          {orders.error && <span className="text-danger">ERROR - {orders.error}</span>}
          {TxnSuccessData && TxnSuccessData.items && TxnSuccessData.orderDetails && !orders.loading &&
            <div className="tableresp table-responsive">
              <h5 className="color mb-3">Congratulations! &nbsp;Your Order for New Product(s) Success. Order Reference Number : #{TxnSuccessData.orderDetails.orderid}</h5>
    					<div className="fs color-white mt-2">The following product(s) will be available shortly for you.</div>
              <table className="table table-bordered table-striped table-dark table-custom table-hover" id="TxnSuccessData">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Products Details</th>
                    <th>Configuration</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total Charge</th>
                  </tr>
                </thead>
                <tbody>
                  {TxnSuccessData.items.map((itemData, index) =>
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{itemData.product_type} Vartual Machine 
                      	{(itemData.cloudid == 3) &&
                          <span>
                      		<br/>
                            VM Name : {itemData.cart_config.computerName}
                          </span>
                        }
                      	{(itemData.cloudid == 4) &&
                          <span>
                      		<br/>
                            VM Name : {itemData.cart_config.vmName}
                          </span>
                        }
                      	{(itemData.cloudid == 5) &&
                          <span>
                      		<br/>
                            VM Name : {itemData.cart_config.instanceName}
                          </span>
                        }
                      </td>
                      <td>
                        {(itemData.cloudid == 1 || itemData.cloudid == 2 ) &&
                          <span>
                            vCPUS : {itemData.cart_config.config.cpus}<br/>
                            Memory : {itemData.cart_config.config.ram} GB<br/>
                            Storage : {itemData.cart_config.config.storage} GB<br/>
                          </span>
                        }
                        {(itemData.cloudid == 3  || itemData.cloudid == 4 || itemData.cloudid == 5) &&
                          <span>
                            vCPUS : {itemData.cart_config.cpus}<br/>
                            Memory : {itemData.cart_config.ram} GB<br/>
                            Storage : {itemData.cart_config.disksize} GB<br/>
                          </span>
                        }
                          Copy Type : {itemData.copy_type}<br/>
                          OS : {itemData.template_name}<br/>
                          IP Address : - </td>
                      <td className="currency-symbol">{commonFns.fnFormatCurrency(itemData.item_value)} </td>
                      <td>{itemData.items_count} </td>
                      <td className="currency-symbol">{commonFns.fnFormatCurrency(itemData.total_charge)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {this.state.sweetalert}
            </div>
          }
          {TxnSuccessData && TxnSuccessData.taxData && 
            <div>
              <div className="text-right color mt-4">
                <strong>
                  Total : <span className="currency-symbol color">{commonFns.fnFormatCurrency(TxnSuccessData.taxData.total)}</span> <br/>
                  Tax @ {TxnSuccessData.taxData.tax_percent} % : <span className="currency-symbol color">{commonFns.fnFormatCurrency(TxnSuccessData.taxData.tax_amount)}</span> <br/>
                  (Approx. Monthly Cost) GRAND TOTAL (Total + Tax) : <span className="currency-symbol color">{commonFns.fnFormatCurrency(TxnSuccessData.taxData.grand_total)}</span><br/>
                </strong>
                <br/>
              </div>
            </div>
          }
          {TxnSuccessData && TxnSuccessData.failedInfo &&
            <div className="tableresp table-responsive">
              <h2>Transaction : Failed</h2>
              <h3>Error: {TxnSuccessData.failedInfo.message}</h3>
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

const connectedTxnFailed = connect(mapStateToProps)(txnFailed);
export { connectedTxnFailed as txnFailed };