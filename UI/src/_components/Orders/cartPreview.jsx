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
import config from 'config';
import { ucpDecrypt, decryptResponse } from '../../_helpers';

const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");
class cartPreview extends React.Component {
  constructor(props) {
    super(props);
    
    let user = decryptResponse( localStorage.getItem("user"));
    
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      isPayFromFundsInprogress: false,
      orders: [],
      cartList: [],
      pgiData : [],
      sweetalert: null,
      action: null,
      isPaymentFundsDisable: (user.data.clientid == 222 ? false: true),
      cart_id : this.props.match.params.id
    };
    
    this.payFromFundsRequest = this.payFromFundsRequest.bind(this);
    this.saveTxnInfoRequest = this.saveTxnInfoRequest.bind(this);
  }

  payFromFundsRequest = e => {
    e.preventDefault();
//    let {inpCaptcha, captcha} = this.state;
//    if (!inpCaptcha) {
//      toast.error("Please enter captcha");
//      return;
//    }
//    else {
//      if (inpCaptcha !== captcha) {
//        toast.error("Enter valid captcha");
//        return
//      }
//    }

    var form = document.querySelector("#payFromFundsFrm");
    var formData = serialize(form, { hash: true });
    this.setState({
        isPayFromFundsInprogress: true
    });
    formData.cartList = this.props.orders.cartList;
    this.props.dispatch(ordersActions.payFromFunds(formData));
    document.getElementById("payFromFundsFrm").reset();
    this.setState({ sweetalert: null });
  }

  onCaptchaChange(aEvent) {
    this.setState({inpCaptcha: aEvent.target.value})
  }

  saveTxnInfoRequest = e => {
    e.preventDefault();  
    var form = document.querySelector("#saveTxnInfoFrm");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(ordersActions.saveTxnInfo(formData));
    document.getElementById("saveTxnInfoFrm").reset();
    this.setState({ sweetalert: null });
  }

  getCaptcha() {
    let requestOptions = {method: 'GET'};

    fetch(`${config.apiUrl}/azure/get-captcha`, requestOptions).then(response  => {
      response.text().then(text => {
        let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

          this.setState({svg: data.data, captcha: data.text});
      });
    });
  }

  componentDidMount() {
    this.getCaptcha();
    this.props.dispatch(ordersActions.getCartList({user_id:this.state.user_id, cart_id : this.state.cart_id}));
  }
  render() { 
    const { orders } = this.props;
    let {inpCaptcha, svg} = this.state,
      cartList = this.props.orders.cartList,
      items = ((cartList || {}).items || []);

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
        <h5 className="color">Cart Preview</h5>
          {!orders.error && orders.loading && <em><PageLoader/></em>}
          {orders.error && <span className="text-danger">ERROR - {orders.error}</span>}

            <div className="tableresp table-responsive">
              <table className="table table-bordered table-striped table-dark table-custom table-hover" id="cartList">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Product Details</th>
                    <th>Configuration</th>
                    {/*<th>Price</th>*/}
                    <th>Quantity</th>
                    {/*<th>Total Charge</th>*/}
                  </tr>
                </thead>
                <tbody>
                  {items && items.length > 0 && (items || []).map((itemData, index) =>{
                    let cart_config_arr = itemData.cart_config;

                    return cart_config_arr.map((cart_config, indx) => {

                      return <tr key={indx}>
                      <td>{indx + 1}</td>
                      <td>{/*itemData.product_type*/} Virtual Machine 
                          <span>
                      		<br/>
                            VM Name : {itemData.virtual_machine_name[indx]}
                          </span>
                      </td>
                      <td>
	                      <table className="table table-bordered table-hover bg-color-white build-params-table">
			            	<thead>
			              	</thead>
			              	<tbody>
			              	<React.Fragment>
				              	{cart_config &&
				              		<React.Fragment>
				              			<tr className="bg-color-white"><td>VM Name</td><td>{cart_config.virtual_machine_name}</td></tr>
				              			<tr className="bg-color-white"><td>Subscription Provision Type</td><td>{cart_config.subscription_provision_type}</td></tr>
				              			<tr className="bg-color-white"><td>vCPUS</td><td>{cart_config.cpus}</td></tr>
				              			<tr className="bg-color-white"><td>Memory</td><td>{cart_config.ram} GB</td></tr>
				              			<tr className="bg-color-white"><td>OS Storage</td><td>{cart_config.disksize} GB</td></tr>
				              			<tr className="bg-color-white"><td>Subscription</td><td>{cart_config.selectedSubscriptionLabel}</td></tr>
				              			<tr className="bg-color-white"><td>VM Resource Group</td><td>{cart_config.deployment_resource_group_name}</td></tr>
				              			<tr className="bg-color-white"><td>Region</td><td>{cart_config.selected_network_location_name}</td></tr>
				              			<tr className="bg-color-white"><td>NIC Name</td><td>{cart_config.nic_name}</td></tr>
				              			<tr className="bg-color-white"><td>Managed Disk Name</td><td>{cart_config.managed_disk_name}</td></tr>
			                    		<tr className="bg-color-white"><td>Managed Disk Host Caching</td><td>{cart_config.managed_disk_host_caching}</td></tr>
			                    		<tr className="bg-color-white"><td>Managed Disk Storage Size</td><td>{cart_config.managed_disk_storage_size}</td></tr>
			                    		<tr className="bg-color-white"><td>Managed Disk Size</td><td>{cart_config.managed_disk_size}</td></tr>
			                    		<tr className="bg-color-white"><td>Managed Disk Size Storage Account Type</td><td>{cart_config.managed_disk_size_storage_account_type}</td></tr>
				              			<tr className="bg-color-white"><td>Network Resource Group Name</td><td>{cart_config.network_resource_group_name}</td></tr>
				              			<tr className="bg-color-white"><td>Virtual Network Name</td><td>{cart_config.virtual_network_name}</td></tr>
				              			<tr className="bg-color-white"><td>Subnet Name</td><td>{cart_config.subnet_name}</td></tr>
					                    {(cart_config.availability_set_or_zone == 'Zone')?
					                      <React.Fragment>
					                      	<tr className="bg-color-white"><td>Zone</td><td>{cart_config.zone}</td></tr>
					                      </React.Fragment>
					                      :
				                    	  <React.Fragment>
					                      	<tr className="bg-color-white"><td>Availability Set Name</td><td>{cart_config.availability_set_name}</td></tr>
					                      </React.Fragment>
					                    }
					                    <tr className="bg-color-white"><td>Environment</td><td>{cart_config.environment}</td></tr>
					                    {/*<tr className="bg-color-white"><td>System Name</td><td>{cart_config.system_name}</td></tr>*/}
					                    <tr className="bg-color-white"><td>System Type</td><td>{cart_config.system_type}</td></tr>
					                    <tr className="bg-color-white"><td>Storage Account Name</td><td>{cart_config.storage_account_name}</td></tr>
					                    <tr className="bg-color-white"><td>Is Cluster</td><td>{(itemData.is_cluster?"Yes":"No")}</td></tr>
					                    {itemData.is_cluster == 1 && 
			                            	  <React.Fragment>
					                    		<tr className="bg-color-white"><td>VM 1 NIC Name 2</td><td>{cart_config.nic_name2}</td></tr>
					                    		<tr className="bg-color-white"><td>VM 2 Name</td><td>{cart_config.virtual_machine_name2}</td></tr>
					                    		<tr className="bg-color-white"><td>VM 2 NIC Name 1</td><td>{cart_config.nic_name3}</td></tr>
					                    		<tr className="bg-color-white"><td>VM 2 NIC Name 2</td><td>{cart_config.nic_name4}</td></tr>
					                    		<tr className="bg-color-white"><td>VM 2 Managed Disk Name</td><td>{cart_config.managed_disk_name2}</td></tr>
					                    		<tr className="bg-color-white"><td>VM 2 Managed Disk Host Caching</td><td>{cart_config.managed_disk_host_caching2}</td></tr>
					                    		<tr className="bg-color-white"><td>VM 2 Managed Disk Storage Size</td><td>{cart_config.managed_disk_storage_size2}</td></tr>
					                    		<tr className="bg-color-white"><td>VM 2 Managed Disk Size</td><td>{cart_config.managed_disk_size2}</td></tr>
					                    		<tr className="bg-color-white"><td>VM 2 Managed Disk Size Storage Account Type</td><td>{cart_config.managed_disk_size_storage_account_type2}</td></tr>
					                    		<tr className="bg-color-white"><td>VM 2 Zone</td><td>{cart_config.zone2}</td></tr>
					                    		<tr className="bg-color-white"><td>VM 2 Availability Set Name</td><td>{cart_config.availability_set_name2}</td></tr>
			                            	  </React.Fragment>
			                              }
				                    </React.Fragment>
		                  	  }
		                      {cart_config && cart_config.gallery_name &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Gallery Name</td><td>{cart_config.gallery_name}</td></tr></React.Fragment>
		                      }  
		                      {cart_config && cart_config.managed_infra_subscription_id &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Managed Infra Subscription ID</td><td>{cart_config.managed_infra_subscription_id}</td></tr></React.Fragment>
		                      }
		                      {cart_config && cart_config.shared_image_name &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Shared Image Name</td><td>{cart_config.shared_image_name}</td></tr></React.Fragment>
		                      }
		                      {cart_config && cart_config.shared_image_version &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Shared Image Version</td><td>{cart_config.shared_image_version}</td></tr></React.Fragment>
		                      }
		                      {cart_config && cart_config.backup_resource_group_name &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Backup Resource group</td><td>{cart_config.backup_resource_group_name}</td></tr></React.Fragment>
		                      }
		                      {cart_config && cart_config.recovery_vault_name &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Backup Vault Name</td><td>{cart_config.recovery_vault_name}</td></tr></React.Fragment>
		                      }
		                      {cart_config && cart_config.backup_policy &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Backup Policy</td><td>{cart_config.backup_policy}</td></tr></React.Fragment>
		                      }
		                      {cart_config && cart_config.cyberark_usernames &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Cyberark Usernames</td><td>{cart_config.cyberark_usernames}</td></tr></React.Fragment>
		                      }
		                      {cart_config && cart_config.disk_encryption_name &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Disk Encryption Name</td><td>{cart_config.disk_encryption_name}</td></tr></React.Fragment>
		                      }
		                      {cart_config && cart_config.disk_encryption_resource_group_name &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Disk Encryption Resource Group Name</td><td>{cart_config.disk_encryption_resource_group_name}</td></tr></React.Fragment>
		                      }
		                      </React.Fragment>
	                    	</tbody>
	                	</table>
                      {/*{(itemData.cloudid == 3 ) &&
                  		<span>
		                      vCPUS : {cart_config.cpus}<br/>
		                      Memory : {cart_config.ram} GB<br/>
		                      OS Storage : {cart_config.disksize} GB<br/>
		                      VM Resource Group : {cart_config.deployment_resource_group_name}<br/>
		                      NIC Name : {cart_config.nic_name}<br/>
		                      Subnet Name : {cart_config.subnet_name}<br/>
		                      {(cart_config.availability_set_or_zone == 'Zone')?
		                    		  <React.Fragment>
		                    		  	Zone : {cart_config.zone}<br/>
		                    		  </React.Fragment>
		                    		  :
	                    			  <React.Fragment>
		                    		  Availability Set Name : {cart_config.availability_set_name}<br/>
		                    		  </React.Fragment>
		                      }
		                      Environment : {cart_config.environment}<br/>
		                      System Name : {cart_config.system_name}<br/>
		                      System Type : {cart_config.system_type}<br/>
		                      Storage Account Name : {cart_config.storage_account_name}<br/>
                  		</span>
                  	}
                      {(itemData.cloudid == 1 || itemData.cloudid == 2 ) &&
                        <span>
                          vCPUS : {cart_config.config.cpus}<br/>
                          Memory : {cart_config.config.ram} GB<br/>
                          Storage : {cart_config.config.storage} GB<br/>
                          Copy Type : {itemData.copy_type}<br/>
                        </span>
                      }
                      {(itemData.cloudid == 4 || itemData.cloudid == 5) &&
                        <span>
                          vCPUS : {cart_config.cpus}<br/>
                          Memory : {cart_config.ram} GB<br/>
                          Storage : {cart_config.disksize} GB<br/>
                        </span>
                      }
                      {(itemData.cloudid != 3) &&
                      	<span>
	                          OS : {itemData.template_name}<br/>
	                          IP Address : -
	                        </span>
                      }
                      {cart_config.managed_infra_subscription_id &&
                      	<span>Managed Infra Subscription ID : {cart_config.managed_infra_subscription_id}<br/></span>
                      }
                      {cart_config.gallery_name &&
                      	<span>Gallery Name : {cart_config.gallery_name}<br/></span>
                      }
                      {cart_config.shared_image_name &&
                      	<span>Shared Image Name : {cart_config.shared_image_name}<br/></span>
                      }
                      {cart_config.shared_image_version &&
                      	<span>Shared Image Version : {cart_config.shared_image_version}<br/></span>
                      }
                      {cart_config.backup_resource_group_name &&
                      	<span>Backup Resource group : {cart_config.backup_resource_group_name}<br/></span>
                      }
                      {cart_config.recovery_vault_name &&
                      	<span>Backup Vault Name : {cart_config.recovery_vault_name}<br/></span>
                      }
                      {cart_config.backup_policy &&
                      	<span>Backup Policy : {cart_config.backup_policy}<br/></span>
                      }*/}
                      </td>
                      {/*<td className="currency-symbol">{commonFns.fnFormatCurrency(itemData.item_value)} </td>*/}
                      <td>{itemData.items_count} </td>
                      {/*<td className="currency-symbol">{commonFns.fnFormatCurrency(itemData.total_charge)}</td>*/}
                    </tr>
                    })
                    
                  })
                }
                  {items.length == 0 && 
                      <tr>
                        <td colSpan="7" align="center">Cart is empty, add <a className="blue-col" href="/#/AzureNewVMInstance">New VM Instance</a></td>
                      </tr>
                  }
                </tbody>
              </table>
              {this.state.sweetalert}
            </div>

          {items && items.length > 0 && 
            <div>
              <div className="text-right color">
              {/*<strong>
                  Total : <span className="currency-symbol color">{commonFns.fnFormatCurrency(cartList.taxData.total)}</span> <br/>
                  Tax @ {cartList.taxData.tax_percent} % : <span className="currency-symbol color">{commonFns.fnFormatCurrency(cartList.taxData.tax_amount)}</span> <br/>
                  (Approx. Monthly Cost) GRAND TOTAL (Total + Tax) : <span className="currency-symbol color">{commonFns.fnFormatCurrency(cartList.taxData.grand_total)}</span><br/>
                </strong>
                */}
              	<br/>
              </div>
              <div className="row mb-5 pr-2">               
                    <div className="col-md-12 ml-2">
                        <form
                            className="text-right float-right mr-2"
                            name="payFromFundsFrm"
                            id="payFromFundsFrm"
                            method="post"
                            onSubmit={this.payFromFundsRequest}
                          >
                            <input type="hidden" name="user_id" value={this.state.user_id} />
                            <input type="hidden" name="clientid" value={this.state.clientid} />
                            <input type="hidden" name="cartid" value={items[0].cartid} />
                            <input type="hidden" name="cart_id" value={this.state.cart_id} />
                            {/*<div className="row">
                              <div className="col-md-6">
                                <input type="text" 
                                  maxLength="4" placeholder="Captcha" autoComplete="off" 
                                  name="inpCaptcha" className="form-control-captcha-text"  
                                  onChange={this.onCaptchaChange.bind(this)}
                                  value={inpCaptcha} />
                              </div>
                              <div className="col-md-6 pl-0">
                                <div className="captcha-wrapper form-control input-field-capcha input-md round">
                                  <span className="form-control-captcha" dangerouslySetInnerHTML={{ __html: svg }} /> 
                                  <i class="fas fa-sync btn-refresh-captcha" onClick={this.getCaptcha.bind(this)}></i>
                                </div>
                              </div>
                            </div>*/}
                            <button className={"btn btn-sm info-box-success " + (this.state.isPayFromFundsInprogress ? "no-access" : "")} disabled={this.state.isPayFromFundsInprogress ? true : false}>
	                            {this.state.isPayFromFundsInprogress && <i className="fas fa-circle-notch icon-loading"></i> }
	                            Proceed for Provision
                            </button>
                        </form>
                  </div>
              </div>
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

const connectedCartPreview = connect(mapStateToProps)(cartPreview);
export { connectedCartPreview as cartPreview };