import React from 'react';
import { commonFns } from "../../_helpers/common";
import { connect } from 'react-redux';
import { ordersActions } from './orders.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import { authHeader,ucpEncrypt,ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';
import config from 'config';

const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");
class newVMInstance extends React.Component {
  constructor(props) {
    super(props);
    
    commonFns.fnCheckPageAuth(commonFns.menuUrls.newVMInstance);

    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      user_details: user,
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      orders: [],
      cloudNames: [],
      DCLocations: [],
      CopyTypes: [],
      OsTemplates: [],
      BillingPrice: [],
      common: [],
      sweetalert: null,
      action: null,
      loading: true,
      CopyTypes: [],
      OsTemplates: []
    };
    this.getDCLocations = this.getDCLocations.bind(this);
    this.getCopyTypes = this.getCopyTypes.bind(this);
    this.saveOrderInfoRequest = this.saveOrderInfoRequest.bind(this);
    this.getBillingPriceInfo = this.getBillingPriceInfo.bind(this);
  }

  getDCLocations = (cloudName) => {
    this.props.dispatch(ordersActions.getAllDCLocations(cloudName));
    this.getBillingPriceInfo();
  }

  getBillingPriceInfo = () => {
    setTimeout(() => {
      var form = document.querySelector("#saveOrderInfoFrm");
      var formData = serialize(form, { hash: true });
      formData.currency_id = this.state.user_details.data.currency_id;

      /*if (typeof formData.plancloud != 'undefined' && typeof formData.plancloud != ''
        && typeof formData.dc_location != 'undefined' && typeof formData.dc_location != '') {*/
        this.props.dispatch(ordersActions.getBillingPrice(formData));
      //}
    }, 10);
  }

  getCopyTypes = (vdc_tech_disk_id) => {
    for(let i = 0; i < this.props.orders.DCLocations.length; i++){
      if(this.props.orders.DCLocations[i].id == vdc_tech_disk_id){
        this.setState({
          cloud_type: this.props.orders.DCLocations[i].cloudid
        });
      }
    }
    //this.props.dispatch(ordersActions.getCopyTypes(vdc_tech_disk_id ? vdc_tech_disk_id : 0));
    //this.props.dispatch(ordersActions.getOsTemplates(vdc_tech_disk_id ? vdc_tech_disk_id : 0));
    setTimeout(() => {
      this.setState({
        OsTemplates: [],
        CopyTypes: []
      });
    }, 0);
    
    if(vdc_tech_disk_id){
      this.getCopyTypesData(vdc_tech_disk_id);
      this.getOsTemplatesData(vdc_tech_disk_id);
    }
    this.getBillingPriceInfo();
  }

  getCopyTypesData(vdc_tech_disk_id){
    this.setState({
      copytype_list_loading: true
    });

    const requestOptions = {
        method: "GET",
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
    };
    
    fetch(`${config.apiUrl}/secureApi/orders/getCopyTypes/` + (btoa(vdc_tech_disk_id)), requestOptions).then(
        response  => this.handleCopyTypeApiResponse(response)
    );
  }

  handleCopyTypeApiResponse(response) {
    return response.text().then(text => {
        const data = (text && JSON.parse(ucpDecrypt(JSON.parse(text))));
        
        if(data && data.length > 0){
            this.setState({
              CopyTypes: data
            });
        }

        this.setState({
          copytype_list_loading: false
        });
    });
  }
  
  getOsTemplatesData(vdc_tech_disk_id){

    const requestOptions = {
        method: "GET",
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
    };
    
    fetch(`${config.apiUrl}/secureApi/orders/getOsTemplates/` + (btoa(vdc_tech_disk_id)), requestOptions).then(
        response  => this.handleOSApiResponse(response)
    );
  }

  handleOSApiResponse(response) {
    return response.text().then(text => {
        const data = (text && JSON.parse(ucpDecrypt(JSON.parse(text))));
        
        if(data && data.length > 0){
            this.setState({
              OsTemplates: data
            });
        }
    });
  }
  
  saveOrderInfoRequest = e => {
    e.preventDefault();
    var form = document.querySelector("#saveOrderInfoFrm");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(ordersActions.saveOrderInfo(formData));
    document.getElementById("saveOrderInfoFrm").reset();
    document.getElementById("priceText").innerHTML = "0";
    this.setState({ sweetalert: null });
  }

  componentDidMount() {
    // this.props.dispatch(ordersActions.getAllCloudNames());
    this.getDCLocations("1,2");
    this.props.dispatch(commonActions.getRamList());
    this.props.dispatch(commonActions.getCpuList());
    this.props.dispatch(commonActions.getDiskList());
  }

  render() {
    const { orders } = this.props;
    let cloudNames = this.props.orders.cloudNames;
    if(cloudNames && cloudNames.length > 0 && window.location.href.indexOf("flag") != -1){
      cloudNames = JSON.parse(JSON.stringify(cloudNames));
      if(window.location.href.split("flag=")[1] && window.location.href.split("flag=")[1].toLowerCase() == "cloud4c"){
        for(let i = 0; i < cloudNames.length; i++){
          if(cloudNames[i].cloud_name.toLowerCase() != "cloud4c" && cloudNames[i].cloud_name.toLowerCase() != "citrix"){
            cloudNames.splice(i, 1);
            i--;
          }
          else if(cloudNames[i].cloud_name.toLowerCase() == "cloud4c"){
            cloudNames[i].selected = true;
          }
        }
      }
      else if(window.location.href.split("flag=")[1] && window.location.href.split("flag=")[1].toLowerCase() == "azure"){
        for(let i = 0; i < cloudNames.length; i++){
          if(cloudNames[i].cloud_name.toLowerCase() != "azure"){
            cloudNames.splice(i, 1);
            i--;
          }
        }
      }
    }

    let DCLocations = this.props.orders.DCLocations;
    let CopyTypes = this.state.CopyTypes;
    let OsTemplates = this.state.OsTemplates;
    let BillingPrice = this.props.orders.BillingPrice;
    let common = this.props.common;
    // const { cloudNames,DCLocations } = this.props;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">New VM Instance</h5>
          <form
            name="saveOrderInfoFrm"
            id="saveOrderInfoFrm"
            method="post"
            onSubmit={this.saveOrderInfoRequest}
          >
            <div className="row">
              {/* <div className="col-lg-6">
                <div className="form-group row">
                  <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Cloud Name</label>
                  {cloudNames &&
                    <div className="col-sm-9">
                      <select
                        className="form-control-vm"
                        required
                        name="cloud_type"
                        onChange={e => this.getDCLocations(e.target.value)}
                      >
                        {window.location.href.indexOf("flag") == -1 &&
                        <option selected="true" value="">--SELECT--</option>}
                        {cloudNames.map((item, index) =>
                          <option selected={item.selected} value={item.id} key={item.id}>
                            {item.cloud_name}
                          </option>
                        )}

                      </select>
                    </div>
                  }
                </div>
              </div> */}

              <div className="col-lg-6">
              <div className="form-group row">
                    <label htmlFor="dc_location" className='col-sm-3 col-form-label'>DC Location</label>
                    <div className="col-sm-9">
                      <select
                        className="form-control-vm"
                        required
                        name="dc_location"
                        onChange={e => this.getCopyTypes(e.target.value)}
                      >
                        <option value="">--SELECT--</option>
                        {DCLocations && DCLocations.length > 0 && DCLocations.map((item, index) =>
                          <option value={item.id} key={item.id}>
                            {item.location}
                          </option>
                        )}
                      </select>
                    </div>
                  </div>
              </div>

              <div className="col-lg-6">
              <div className="form-group row">
              <label htmlFor="cpu" className='col-sm-3 col-form-label'>CPU</label>
              <div className="col-sm-9 position-relative">
                <select
                  className="form-control-vm"
                  required
                  name="cpu"
                  onChange={e => this.getBillingPriceInfo()}
                >
                  <option value="">--SELECT--</option>
                  {common.cpuList && common.cpuList.length > 0 && common.cpuList.map((item, index) =>
                    <option value={item.option_value} key={item.option_value}>
                      {item.option_value}
                    </option>
                  )}
                </select>
                <span className="cpu_ram_disk">Cores</span>
                </div>
              </div>
              </div>
            </div>

          <div className="row">
            <div className="col-lg-6">
              <div className="form-group row">
                <label htmlFor="plancloud" className='col-sm-3 col-form-label'>Copy Type</label>
                <div className="col-sm-9 position-relative">
                  <select
                    className="form-control-vm"
                    required
                    name="plancloud"
                    onChange={e => this.getBillingPriceInfo()}
                  >
                    <option value="">--SELECT--</option>
                    {CopyTypes && CopyTypes.length > 0 && CopyTypes.map((item, index) =>
                      (item.value == "1") ?
                        <option value={item.key} key={item.key}>
                          {item.key}
                        </option>
                        :
                        ""
                    )}
                  </select>
                  {this.state.copytype_list_loading && <i className="fas fa-circle-notch icon-loading drop-loader"></i>}
                </div>
              </div>
            </div>
     
            <div className="col-lg-6 position-relative">            
              <div className="form-group row">
                <label htmlFor="ram" className='col-sm-3 col-form-label'>RAM</label>
                <div className="col-sm-9">
                  <select
                    className="form-control-vm"
                    required
                    name="ram"
                    onChange={e => this.getBillingPriceInfo()}
                  >
                    <option value="">--SELECT--</option>
                    {common.ramList && common.ramList.length > 0 && common.ramList.map((item, index) =>
                      <option value={item.option_value} key={item.option_value}>
                        {item.option_value}
                      </option>
                    )}
                  </select>
                  <span className="cpu_ram_disk">GB</span>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-6">
              <div className="form-group row">
                <label htmlFor="network" className='col-sm-3 col-form-label'>Network</label>
                <div className="col-sm-9">
                  <select
                    className="form-control-vm"
                    required
                    name="network"
                    defaultValue="default"
                    onChange={e => this.getBillingPriceInfo()}
                  >
                    <option value="default">Default</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="form-group row">
                <label htmlFor="disk" className='col-sm-3 col-form-label'>Disk</label>
                <div className="col-sm-9 position-relative">
                  <select
                    className="form-control-vm"
                    required
                    name="disk"
                    onChange={e => this.getBillingPriceInfo()}
                  >
                    <option value="">--SELECT--</option>
                    {common.diskList && common.diskList.length > 0 && common.diskList.map((item, index) =>
                      <option value={item.option_value} key={item.option_value}>
                        {item.option_value}
                      </option>
                    )}
                  </select>
                  <span className="cpu_ram_disk">GB</span>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-6">
              <div className="form-group row">
                <label htmlFor="os_template_id" className='col-sm-3 col-form-label'>Operation System</label>
                <div className="col-sm-9 position-relative">
                  <select
                    className="form-control-vm"
                    required
                    name="os_template_id"
                    onChange={e => this.getBillingPriceInfo()}
                  >
                    <option value="">--SELECT--</option>
                    {OsTemplates && OsTemplates.length > 0 && OsTemplates.map((item, index) =>
                      <option value={item.id} key={item.id}>
                        {item.template_name}
                      </option>
                    )}
                  </select>
                  {this.state.copytype_list_loading && <i className="fas fa-circle-notch icon-loading drop-loader"></i>}
                  </div>
                </div>
            </div>
            <div className="col-lg-6">
              <div className="form-group row">
                <label htmlFor="disk_type" className='col-sm-3 col-form-label'>Disk type</label>
                <div className="col-sm-9">
                  <select
                    className="form-control-vm"
                    required
                    name="disk_type"
                    onChange={e => this.getBillingPriceInfo()}
                    defaultValue="Saas"
                  >
                    <option value="Saas">Saas</option>
                    <option value="vHDD">vHDD</option>
                  </select>
                  </div>
                </div>
              </div>
          </div>

          <div className="row">
            <div className="col-lg-6">
              <div className="form-group row">
                <label htmlFor="billing_type" className='col-sm-3 col-form-label'>Billing type</label>
                <div className="col-sm-9">
                  <select
                    className="form-control-vm"
                    required
                    name="billing_type"
                    onChange={e => this.getBillingPriceInfo()}
                    defaultValue="MONTHLY"
                  >
                    <option value="">--SELECT--</option>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="QUARTERLY">QUARTERLY</option>
                    <option value="YEARLY">YEARLY</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="form-group row">
                <label htmlFor="price" className='col-sm-3 col-form-label'>Price</label>
                <div className="col-sm-9 pt-2">                
                    <strong>
                    <span id="priceText" className="currency-symbol color">{DCLocations && BillingPrice && (BillingPrice.currency != "") ?
                    commonFns.fnFormatCurrency(BillingPrice.price) : 
                    commonFns.fnFormatCurrency(0)}</span>
                    </strong>
                  {(DCLocations && BillingPrice) ?
                    <span>
                      
                      <input type="hidden" name="price" id="price" value={BillingPrice.price} />
                      <input type="hidden" name="techid" id="techid" value={BillingPrice.billingRow.tech_id} />
                      <input type="hidden" name="vdcid" id="vdcid" value={BillingPrice.billingRow.vdc_id} />
                      <input type="hidden" name="cpu_monthlycost" id="cpu_monthlycost" value={BillingPrice.billingRow.core} />
                      <input type="hidden" name="ram_monthlycost" id="ram_monthlycost" value={BillingPrice.billingRow.ram} />
                      <input type="hidden" name="disk_on_monthlycost" id="disk_on_monthlycost" value={BillingPrice.billingRow.disk} />
                      <input type="hidden" name="bandwidth_in_price" id="bandwidth_in_price" value={BillingPrice.billingRow.bandwidth_in_price} />
                      <input type="hidden" name="base_monthlycost" id="base_monthlycost" value={BillingPrice.billingRow.base_price} />
                      <input type="hidden" name="osprice" id="osprice" value={BillingPrice.osRow.os_price} />
                    </span>
                    :
                    ""
                  }
                </div>
              </div>
            </div>
          </div>
          <div className="form-group row">
              <label className='col-sm-3 col-form-label'>&nbsp;</label>
              <div className="col-sm-9">
                <input type="hidden" name="user_id" value={this.state.user_id} />
                <input type="hidden" name="clientid" value={this.state.clientid} />
                <input type="hidden" name="cloud_type" id="cloud_type" value={this.state.cloud_type} />
                <button className={"btn btn-primary float-right " + (orders.submitLoading ? "no-access" : "")} disabled={orders.submitLoading ? true : false} >
                  {orders.submitLoading && 
                      <i className="fas fa-circle-notch icon-loading"></i>
                  }
                  Add to Cart
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { orders, common } = state;
  return {
    orders, common
  };
}

const connectedNewVMInstance = connect(mapStateToProps)(newVMInstance);
export { connectedNewVMInstance as newVMInstance };