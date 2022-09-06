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
class viewCart extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      orders: [],
      cartList: [],
      sweetalert: null,
      action: null
    };
    
    this.updateCartItemCount = this.updateCartItemCount.bind(this);
    this.deleteCartItem = this.deleteCartItem.bind(this);
  }

  componentDidMount() {
    this.props.dispatch(ordersActions.getCartList(this.state.user_id));
  }
  updateCartItemCount(id,count) {
    this.props.dispatch(ordersActions.updateCartItemCount(this.state.user_id,id,count));
  }
  deleteCartItem(id) {
    this.props.dispatch(ordersActions.deleteCartItem(this.state.user_id,id));
  }

  render() { 
    const { orders } = this.props;
    let cartList = this.props.orders.cartList;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea mb-4">
          
          <h5 className="color">Cart View</h5>
          {!orders.error && orders.loading && <em><PageLoader/></em>}
          {orders.error && <span className="text-danger">ERROR - {orders.error}</span>}
          {cartList && cartList.items && !orders.loading &&
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cartList.items.length > 0 && cartList.items.map((itemData, index) =>
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{itemData.product_type} Virtual Machine 
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
                      {(itemData.cloudid == 3 ) &&
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
                        }
                        </td>
                      {/*<td className="currency-symbol">{commonFns.fnFormatCurrency(itemData.item_value)} </td>*/}
                      <td>
                      {itemData.items_count}  
                      {/*<select
                          className="form-control-vm"
                          required
                          name="parent_id"       
                          defaultValue={itemData.items_count} 
                          onChange={e=>this.updateCartItemCount(itemData.id, e.target.value)}                   
                        >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                      </select>*/}
                    </td>
                    {/*<td className="currency-symbol">{commonFns.fnFormatCurrency(itemData.total_charge)}</td>*/}
                    <td>
                        <div>
                          <a href="javascript:void(0);" onClick={() => this.deleteCartItem(itemData.id)}><i className="fa fa-trash"></i> </a>
                        </div>
                      </td>
                    </tr>
                  )}
                  {cartList.items.length == 0 && 
                      <tr>
                        <td colSpan="7" align="center">Cart is empty, add <a className="blue-col" href="/#/AzureNewVMInstance">New VM Instance</a></td>
                      </tr>
                  }
                </tbody>
              </table>
              {this.state.sweetalert}
            </div>
          }
          {cartList && cartList.items.length > 0 && cartList.taxData && 
            <div className="text-right color mt-4">
          		{/*<strong>
	                Total : <span className="currency-symbol color"> {commonFns.fnFormatCurrency(cartList.taxData.total)}</span> <br/>
	                Tax @ {cartList.taxData.tax_percent}% : <span className="currency-symbol color">{commonFns.fnFormatCurrency(cartList.taxData.tax_amount)}</span> <br/>
	                (Approx. Monthly Cost) GRAND TOTAL (Total + Tax) : <span className="currency-symbol color">{commonFns.fnFormatCurrency(cartList.taxData.grand_total)}</span><br/>
	              </strong>
	              <br/>*/}
	              <a className="btn btn-primary" href="/#/cartPreview">Next</a>
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

const connectedviewCart = connect(mapStateToProps)(viewCart);
export { connectedviewCart as viewCart };