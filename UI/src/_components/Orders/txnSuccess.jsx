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
class txnSuccess extends React.Component {
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
              <h5 className="color mb-3">Congratulations. &nbsp;Your Instance is now being provisioned.</h5>
              <div className="fs color-black mt-2">To view pending orders, click <a href={"/#/pendingOrders"} className="blue-cloud">here</a></div>
              <div className="fs color-black mt-2">The following product(s) will be available for you, shortly.</div>
              <table className="table table-bordered table-striped table-dark table-custom table-hover" id="TxnSuccessData">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Products Details</th>
                    <th>Configuration</th>
                    {/*<th>Price</th>*/}
                    <th>Quantity</th>
                    {/*<th>Total Charge</th>*/}
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
                            VM Name : {itemData.cart_config.virtual_machine_name}
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
	                      <table className="table table-bordered table-hover bg-color-white build-params-table">
			            	<thead>
			              	</thead>
			              	<tbody>
			              	<React.Fragment>
				              	{itemData.cart_config &&
				              		<React.Fragment>
				              			<tr className="bg-color-white"><td>VM Name</td><td>{itemData.cart_config.virtual_machine_name}</td></tr>
				              			<tr className="bg-color-white"><td>Subscription Provision Type</td><td>{itemData.cart_config.subscription_provision_type}</td></tr>
				              			<tr className="bg-color-white"><td>vCPUS</td><td>{itemData.cart_config.cpus}</td></tr>
				              			<tr className="bg-color-white"><td>Memory</td><td>{itemData.cart_config.ram} GB</td></tr>
				              			<tr className="bg-color-white"><td>OS Storage</td><td>{itemData.cart_config.disksize} GB</td></tr>
				              			<tr className="bg-color-white"><td>VM Resource Group</td><td>{itemData.cart_config.deployment_resource_group_name}</td></tr>
				              			<tr className="bg-color-white"><td>NIC Name</td><td>{itemData.cart_config.nic_name}</td></tr>
				              			<tr className="bg-color-white"><td>Network Resource Group Name</td><td>{itemData.cart_config.network_resource_group_name}</td></tr>
				              			<tr className="bg-color-white"><td>Virtual Network Name</td><td>{itemData.cart_config.virtual_network_name}</td></tr>
				              			<tr className="bg-color-white"><td>Subnet Name</td><td>{itemData.cart_config.subnet_name}</td></tr>
					                    {(itemData.cart_config.availability_set_or_zone == 'Zone')?
					                      <React.Fragment>
					                      	<tr className="bg-color-white"><td>Zone</td><td>{itemData.cart_config.zone}</td></tr>
					                      </React.Fragment>
					                      :
				                    	  <React.Fragment>
					                      	<tr className="bg-color-white"><td>Availability Set Name</td><td>{itemData.cart_config.availability_set_name}</td></tr>
					                      </React.Fragment>
					                    }
					                    <tr className="bg-color-white"><td>Environment</td><td>{itemData.cart_config.environment}</td></tr>
					                    <tr className="bg-color-white"><td>System Name</td><td>{itemData.cart_config.system_name}</td></tr>
					                    <tr className="bg-color-white"><td>System Type</td><td>{itemData.cart_config.system_type}</td></tr>
					                    <tr className="bg-color-white"><td>Storage Account Name</td><td>{itemData.cart_config.storage_account_name}</td></tr>
				                    </React.Fragment>
		                  	  }
		                      {itemData.cart_config && itemData.cart_config.gallery_name &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Gallery Name</td><td>{itemData.cart_config.gallery_name}</td></tr></React.Fragment>
		                      }  
		                      {itemData.cart_config && itemData.cart_config.managed_infra_subscription_id &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Managed Infra Subscription ID</td><td>{itemData.cart_config.managed_infra_subscription_id}</td></tr></React.Fragment>
		                      }
		                      {itemData.cart_config && itemData.cart_config.shared_image_name &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Shared Image Name</td><td>{itemData.cart_config.shared_image_name}</td></tr></React.Fragment>
		                      }
		                      {itemData.cart_config && itemData.cart_config.shared_image_version &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Shared Image Version</td><td>{itemData.cart_config.shared_image_version}</td></tr></React.Fragment>
		                      }
		                      {itemData.cart_config && itemData.cart_config.backup_resource_group_name &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Backup Resource group</td><td>{itemData.cart_config.backup_resource_group_name}</td></tr></React.Fragment>
		                      }
		                      {itemData.cart_config && itemData.cart_config.recovery_vault_name &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Backup Vault Name</td><td>{itemData.cart_config.recovery_vault_name}</td></tr></React.Fragment>
		                      }
		                      {itemData.cart_config && itemData.cart_config.backup_policy &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Backup Policy</td><td>{itemData.cart_config.backup_policy}</td></tr></React.Fragment>
		                      }
		                      </React.Fragment>
	                  	</tbody>
	              	</table>
                      {/*{(itemData.cloudid == 3 ) &&
                  		<span>
		                      vCPUS : {itemData.cart_config.cpus}<br/>
		                      Memory : {itemData.cart_config.ram} GB<br/>
		                      OS Storage : {itemData.cart_config.disksize} GB<br/>
		                      VM Resource Group : {itemData.cart_config.deployment_resource_group_name}<br/>
		                      NIC Name : {itemData.cart_config.nic_name}<br/>
		                      Subnet Name : {itemData.cart_config.subnet_name}<br/>
		                      {(itemData.cart_config.availability_set_or_zone == 'Zone')?
		                    		  <React.Fragment>
		                    		  	Zone : {itemData.cart_config.zone}<br/>
		                    		  </React.Fragment>
		                    		  :
	                    			  <React.Fragment>
		                    		  Availability Set Name : {itemData.cart_config.availability_set_name}<br/>
		                    		  </React.Fragment>
		                      }
		                      Environment : {itemData.cart_config.environment}<br/>
		                      System Name : {itemData.cart_config.system_name}<br/>
		                      System Type : {itemData.cart_config.system_type}<br/>
		                      Storage Account Name : {itemData.cart_config.storage_account_name}<br/>
                  		</span>
                  	}
                      {(itemData.cloudid == 1 || itemData.cloudid == 2 ) &&
                        <span>
                          vCPUS : {itemData.cart_config.config.cpus}<br/>
                          Memory : {itemData.cart_config.config.ram} GB<br/>
                          Storage : {itemData.cart_config.config.storage} GB<br/>
                          Copy Type : {itemData.copy_type}<br/>
                        </span>
                      }
                      {(itemData.cloudid == 4 || itemData.cloudid == 5) &&
                        <span>
                          vCPUS : {itemData.cart_config.cpus}<br/>
                          Memory : {itemData.cart_config.ram} GB<br/>
                          Storage : {itemData.cart_config.disksize} GB<br/>
                        </span>
                      }
                      {(itemData.cloudid != 3) &&
                      	<span>
	                          OS : {itemData.template_name}<br/>
	                          IP Address : -
	                        </span>
                      }
                      {itemData.cart_config.managed_infra_subscription_id &&
                      	<span>Managed Infra Subscription ID : {itemData.cart_config.managed_infra_subscription_id}<br/></span>
                      }
                      {itemData.cart_config.gallery_name &&
                      	<span>Gallery Name : {itemData.cart_config.gallery_name}<br/></span>
                      }
                      {itemData.cart_config.shared_image_name &&
                      	<span>Shared Image Name : {itemData.cart_config.shared_image_name}<br/></span>
                      }
                      {itemData.cart_config.shared_image_version &&
                      	<span>Shared Image Version : {itemData.cart_config.shared_image_version}<br/></span>
                      }
                      {itemData.cart_config.backup_resource_group_name &&
                      	<span>Backup Resource group : {itemData.cart_config.backup_resource_group_name}<br/></span>
                      }
                      {itemData.cart_config.recovery_vault_name &&
                      	<span>Backup Vault Name : {itemData.cart_config.recovery_vault_name}<br/></span>
                      }
                      {itemData.cart_config.backup_policy &&
                      	<span>Backup Policy : {itemData.cart_config.backup_policy}<br/></span>
                      }*/}
                      </td>
                      {/*<td className="currency-symbol">{commonFns.fnFormatCurrency(itemData.item_value)} </td>*/}
                      <td>{itemData.items_count} </td>
                      {/*<td className="currency-symbol">{commonFns.fnFormatCurrency(itemData.total_charge)}</td>*/}
                    </tr>
                  )}
                </tbody>
              </table>
              {this.state.sweetalert}
            </div>
          }
          {TxnSuccessData && TxnSuccessData.taxData && 
            <div>
              {/*<div className="text-right color mt-4">
                <strong>
                  Total : <span className="currency-symbol color">{commonFns.fnFormatCurrency(TxnSuccessData.taxData.total)}</span> <br/>
                  Tax @ {TxnSuccessData.taxData.tax_percent} % : <span className="currency-symbol color">{commonFns.fnFormatCurrency(TxnSuccessData.taxData.tax_amount)}</span> <br/>
                  (Approx. Monthly Cost) GRAND TOTAL (Total + Tax) : <span className="currency-symbol color">{commonFns.fnFormatCurrency(TxnSuccessData.taxData.grand_total)}</span><br/>
                </strong>
                <br/>
              </div>*/}
            </div>
          }
          {TxnSuccessData && TxnSuccessData.failedInfo &&
            <div className="tableresp table-responsive">
              <h2>Transaction : Failed</h2>
              <h3>Error: {TxnSuccessData.failedInfo.message}</h3>
            </div>
          }
        </div>
        <br/><br/><br/><br/><br/>
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

const connectedTxnSuccess = connect(mapStateToProps)(txnSuccess);
export { connectedTxnSuccess as txnSuccess };