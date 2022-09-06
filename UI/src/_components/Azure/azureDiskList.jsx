import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { azureActions } from './azure.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import ReactHtmlParser from 'react-html-parser'; 
import DatatablePage from './resourceGroupsGridview';
import PageLoader from '../PageLoader';
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';
import { MDBDataTable } from 'mdbreact';
import { commonFns } from "../../_helpers/common";

Modal.setAppElement("#app");
class azureDiskList extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));

    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      provision_type: user.data.provision_type,
      user: user,
      resourceList: [],
      resourceGroups:[],
      isItFirstLoad: false,
      subscriptionSelectedValue: "",
      isResouceListLoading: false,
      modalIsOpen:false,
      is_subscription_list_loaded: false,
      is_add_disk_inprogress: false,
      diskSizeGB: "",
      currentRowDeleteDetails: "",
      sweetalert: false,
      locations: [],
      data: {
        columns: [
          {
              label: 'Name',
              field: 'name',
          },
          {
              label: 'Resource Group',
              field: 'id',
          },
          {
              label: 'Location',
              field: 'location'
          },
          {
              label: 'Type',
              field: 'type'
          },
          {
              label: 'Status',
              field: 'diskState'
          },
          {
              label: 'Size',
              field: 'diskSizeGB'
          },
          {
              label: '',
              field: 'action'
          }
        ],
        rows: [],
        isCurrentPriceLoading: true,
        priceFor1GBDisk: 0
      }
    };

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  componentDidMount() {
	  this.props.dispatch(azureActions.getAzureSubscriptions({clientid:this.state.clientid,
      		user_role: this.state.user_role, 
      		provision_type : this.state.provision_type,
      		user_id:this.state.user_id}));
    this.fetchPriceForVolume();
  }

  fetchPriceForVolume(){
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt({"cloud_type" : "Azure", "addon_name" : "storage", "currency_id" : this.state.user.data.currency_id}))
    };

    fetch(`${config.apiUrl}/secureApi/orders/getAddonPrice`, requestOptions).then(response  => this.handlePriceResponse(response));
  }

  handlePriceResponse(response, stateName, isLoading) {
    return response.text().then(text => {
        
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if(data && data.data && data.data[0] && data.data[0].price){
          this.setState({
            priceFor1GBDisk: data.data[0].price
          });
        }

        this.setState({
          isCurrentPriceLoading: false
        })
    });
  }

  openModal() {     
    if(!this.state.subscriptionSelectedValue){
      toast.warn("Please select Subscription before Proceed!");
      return;
    }

    this.setState({ modalIsOpen: true, resourceGroups: [], locations: [], is_resource_group_list_loading: true });

    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt({subscription: this.state.clientid + "_" + this.state.subscriptionSelectedValue}))
    };
    return fetch(`${config.apiUrl}/secureApi/azure/get_resrouce_group_list`, requestOptions).then(response  => this.handleresourceGroupsResponse(response))
  }

  handleresourceGroupsResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        if (!response.ok) {
            //
        }
        else{
          this.setState({
            ['resourceGroups']: (data.data ? data.data : data)
          })
          //return data;
        }        
        this.setState({
          is_resource_group_list_loading: false,
        })
    });
  }
  
  closeModal() {
    this.setState({ modalIsOpen: false });        
  }

  handleAzureLocations = (resourceGroup) => {
    this.setState({ locations: [] })

    var resourceGroupsList=this.state.resourceGroups;
    if(resourceGroup != '' && resourceGroupsList!=''){
        for(const loc of resourceGroupsList){
            if(loc.name==resourceGroup){console.log(loc)
                this.setState({ locations: [loc] })
                break;
            }
        }
    }
  }
  
  loadResourceList(){
    setTimeout(() => {
      if(!this.state.isItFirstLoad){
        if(document.getElementById("drp_subscription") && document.getElementById("drp_subscription")[0]){
          document.getElementById("drp_subscription")[0].remove();
        }

        this.setState({
          subscriptionSelectedValue: this.props.azure.subscription_list[0].subscription_id
        });

        this.getDiskList( { "clientid" : this.state.clientid, "subscriptionId" : this.props.azure.subscription_list[0].subscription_id,
      		user_role: this.state.user_role, 
      		provision_type : this.state.provision_type,
      		user_id:this.state.user_id});

        this.setState({
          isItFirstLoad: true,
          is_subscription_list_loaded: true
        });
      }
    }, 2000);
  }
  
  getDiskList(frmData) {
    this.setState({
      isResouceListLoading: true
    });

    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azureapi/disk_list`, requestOptions).then(response  => this.handleDiskListResponse(response));
  }
  
  deleteAction = (row) =>{    
    this.setState({
      sweetalert: true,
      currentRowDeleteDetails: row
    });
  }

  hideAlert() {
    this.setState({
        sweetalert: null
    });
  }

  deleteHandle(){
    let currentRowDeleteDetails = this.state.currentRowDeleteDetails;
    
    let formdata = {
      clientid: this.state.clientid, 
      subscriptionId: currentRowDeleteDetails.id.split("/subscriptions/")[1].split("/")[0], 
      resourceGroup: currentRowDeleteDetails.id.split("/resourceGroups/")[1].split("/")[0],
      diskName: currentRowDeleteDetails.id.split("/disks/")[1].split("/")[0]
    };

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formdata)
    };

    $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);
    
    fetch(`${config.apiUrl}/secureApi/azureapi/delete_virtual_disk`, requestOptions).then(response  => this.handleDeleteItemResponse(response));
  }

  handleDeleteItemResponse(response, stateName) {
    return response.text().then(text => {
      
      const data = (text && JSON.parse(text) ? JSON.parse(text) : "");
      this.setState({
        sweetalert: false
      });
      
      if(data.success == 1){
          toast.success(data.message);
          this.subscriptionChange();
      }
      else{
        if(data.message){
          toast.error(data.message); 
        }
        else{
          toast.error("Unable to Delete Disk");
        }
      }
      
    });
  }

  handleDiskListResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        let resourceList = [];
        
        if(data && data.value){
          for(let i =0; i < data.value.length; i++){
            let newRow = {};
            newRow.name = (data.value[i].type.split("/")[1].toLowerCase().indexOf("virtualmachine") == -1 ? 
            data.value[i].name : 
            <a className="cursor" href={"#/azurevmdetail?id=" + data.value[i].id.split("/")[2] + "&name=" + data.value[i].name }> {data.value[i].name} </a>); 
            newRow.type = data.value[i].type.split("/")[1];
            newRow.id = data.value[i].id.split("/")[4];
            newRow.location = data.value[i].location;
            newRow.diskSizeGB = (data.value[i] && data.value[i].properties && data.value[i].properties.diskSizeGB ? data.value[i].properties.diskSizeGB + " GB" : "0 GB");
            newRow.diskState = data.value[i].properties.diskState;

            let isDisable = (newRow.diskState.toLowerCase().indexOf("unattached") == -1);

            newRow.action = <button
              disabled={isDisable ? 'disabled' : null}
              title={isDisable && "Disk is in Use, Detach the Disk before delete"}
              className={"btn btn-sm btn-danger " + (isDisable && " not-allow") } 
              onClick={() => this.deleteAction(data.value[i])}><i className="fas fa-minus-circle"></i> Delete Disk</button>;
            resourceList.push(newRow);
          }
        }

        this.state.data.rows = resourceList;
        if (data && data.error && data.error.message) {
          toast.error(data.error.message);
        }
        else{
          if(this.state.data.rows.length == 0){
            toast.error("No record for current selection!");
          }

          this.setState({
            data: this.state.data
          })
          //return data;
        }       
        this.setState({
          isResouceListLoading: false
        }) 
    });
  }

  handleResponse(response, stateName) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
            //
        }
        else{
          this.setState({
            [stateName]: (data.data ? data.data : (data.value ? data.value : data))
          })
          //return data;
        }        
    });
  }

  subscriptionChange(value){
    if(!value){
      value = $("#drp_subscription option:selected").val();
    }

    this.setState({
      subscriptionSelectedValue: value,
      isResouceListLoading: true
    });

    this.getDiskList( { "clientid" : this.state.clientid, "subscriptionId" : value,
  		user_role: this.state.user_role, 
  		provision_type : this.state.provision_type,
  		user_id:this.state.user_id});
  }

  azureAddDiskRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#azureAddDisk");
    var frmData = serialize(form, { hash: true });
    
    if(frmData.name.length < 5){
      toast.error("Disk name should be at least 5 characters");
      return;
    }

    if(!frmData.diskSizeGB){
      toast.error("Please enter Disk Size");
      return;
    }

    this.setState({
      is_add_disk_inprogress: true
    });

    frmData.currency_id = this.state.user.data.currency_id;
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/azure/addDisk`, requestOptions).then(response  => this.handleAddDiskResponse(response));
  }

  handleAddDiskResponse(response, stateName) {
    return response.text().then(text => {
      this.setState({
        is_add_disk_inprogress: false
      });

        const data = text && JSON.parse(text);
        if (!response.ok) {
          toast.error(data.message);
        }
        else{
          toast.success("Disk Added Successfully!");
          this.setState({
            modalIsOpen: false
          })
          
          this.subscriptionChange()
        }        
    });
  }
  
  handleDiskSizeGB = (event) => {
    let value = event.target.value;

    let charCode = value.charCodeAt(value.length - 1);
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
    }

    this.setState({
      diskSizeGB: value
    });
  }

  render() { 
    const { azure } = this.props;
    let subscription_list = this.props.azure.subscription_list;

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          {subscription_list && subscription_list.length == 0 && <h5 className="txt-error-icon">Please contact Cloud4C support to Activate the Azure Subscriptions in UCP</h5>}
          <div className="row">
            <div className="col-lg-6">
              <h5 className="color">Azure Disk List</h5>
            </div>
            <div className="col-lg-6">
                <div className="text-right">
                    {/*<button
                        className="btn btn-sm btn-primary"
                        onClick={this.openModal}
                    > <i className="fa fa-plus" /> Add Disk
                    </button>*/}
                    <Modal
                    isOpen={this.state.modalIsOpen}
                    onRequestClose={this.closeModal}              
                    contentLabel="Add Resource Group"
                    >
                        <h2>
                            Add Disk <a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
                        </h2>

                        <div className="col-md-12">
                            <div className="panel panel-default" />
                              <form
                              name="azureAddDisk"
                              id="azureAddDisk"
                              method="post"
                              onSubmit={this.azureAddDiskRequest}
                              >
                                <div className="form-group">
                                    <label htmlFor="subscription">Subscription Id<span className="star-mark">*</span></label>
                                    <input
                                    type="text"
                                    className="form-control input-disabled"
                                    readOnly
                                    name="subscription_id"        
                                    value={this.state.subscriptionSelectedValue}    
                                    />
                                </div>
                                <div className="form-group position-relative">
                                    <label htmlFor="resource_group">Resource Group<span className="star-mark">*</span></label>
                                    <select
                                    className="form-control"
                                    required
                                    name="resourceGroup"   
                                    onChange={e => this.handleAzureLocations(e.target.value)}                      
                                    >
                                        <option value="">-Select-</option>
                                        {this.state.resourceGroups && this.state.resourceGroups.length > 0 && this.state.resourceGroups.map((l, index) =>
                                            <option value={l.name} key={l.id}>
                                                {l.name}
                                            </option>
                                        )}
                                    </select>
                                    { this.state.is_resource_group_list_loading && 
                                      <i className="fas fa-circle-notch icon-loading form-drp-loader-icon"></i>
                                    }
                                </div>
                                <div className="form-group">
                                    <label htmlFor="location">Location<span className="star-mark">*</span></label>
                                    <select
                                    className="form-control"
                                    required
                                    name="location"                   
                                    >
                                        <option value="">-Select-</option>
                                        {this.state.locations && this.state.locations.map((l, index) =>
                                          <option value={l.location_name} key={l.location_id}>
                                              {l.display_name}
                                          </option>
                                        )}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="name">Disk Name<span className="star-mark">*</span></label>
                                    <input
                                    type="text"
                                    className="form-control"
                                    name="name"
                                    required                      
                                    placeholder="Disk Name"
                                    />
                                </div>
                                <div className="form-group position-relative">
                                    <label htmlFor="ip_address_prefix">Disk Size (GB)<span className="star-mark">*</span></label>
                                    <input
                                    type="text"
                                    className="form-control"
                                    name="diskSizeGB"
                                    required   
                                    placeholder="30"    
                                    onChange={this.handleDiskSizeGB}
                                    value={this.state.diskSizeGB}             
                                    />
                                    <span className="txt-right-placeholder">1 GB = 
                                      {!this.state.isCurrentPriceLoading &&
                                        <span className="currency-symbol font-weight-bold color pl-1">{commonFns.fnFormatCurrency(this.state.priceFor1GBDisk)}</span>
                                      }
                                      {this.state.isCurrentPriceLoading &&
                                        <React.Fragment>
                                          <span className="currency-symbol font-weight-bold color pl-1">{commonFns.fnFormatCurrency(this.state.priceFor1GBDisk, 0, true)}</span>
                                          <i className="fas fa-circle-notch icon-loading form-drp-loader-icon price-loading-on-form"></i>
                                        </React.Fragment>
                                      }
                                  </span>
                                </div>
                                <div className="form-group">
                                    <input type="hidden" name="clientid" value={this.state.clientid} />
                                    <input type="hidden" name="createOption" value="Empty" />
                                    <button 
                                    className={"btn btn-sm btn-primary " + (this.state.is_add_disk_inprogress ? "no-access" : "")} disabled={this.state.is_add_disk_inprogress ? true : false}
                                    >
                                      {this.state.is_add_disk_inprogress &&
                                      <i className="fas fa-circle-notch icon-loading"></i>}
                                      Submit</button>

                                      <label className="total-price-right">
                                        Price:
                                        <span className="currency-symbol color ml-2 font-weight-bold">
                                          {commonFns.fnFormatCurrency(this.state.priceFor1GBDisk * (this.state.diskSizeGB ? this.state.diskSizeGB : 0))}
                                        </span>
                                      </label>
                                </div>
                              </form>
                        </div>
                    </Modal>
                </div>
            </div>
          </div>

          <div className="row mt-4">
              <div className="col-lg-8">
                  <div className="form-group row">
                      <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Subscription</label>                
                      <div className="col-sm-9">
                          <select
                          className="form-control-vm"
                          required
                          name="subscription"
                          id="drp_subscription"
                          onChange={e => this.subscriptionChange(e.target.value)}
                          >
                          <option value="">--Select--</option>
                          {subscription_list && subscription_list.length > 0 && subscription_list.map((sub, index) =>
                              <React.Fragment>
                              <option value={sub.subscription_id} key={sub.subscription_id}>
                                  {sub.subscription_id} / {sub.display_name}
                              </option>
                              </React.Fragment>
                          )}
                          </select>
                          { /* !this.state.is_subscription_list_loaded && 
                            <i className="fas fa-circle-notch icon-loading drp-loader-icon"></i>
                          */ }

                          {subscription_list && subscription_list.length > 0 && this.loadResourceList()}
                      </div>
                  </div>
              </div>
            </div>
                
            <div className="row mt-4">
                <div className="col-md-12">
                    {this.state.isResouceListLoading ? <PageLoader/> :
                    <React.Fragment>
                      {this.state.data.rows && this.state.data.rows.length > 0 &&
                        <MDBDataTable
                        striped
                        hover
                        data={this.state.data}
                        />}
                    </React.Fragment>
                  }
                </div>
            </div>
            {this.state.sweetalert &&
              <SweetAlert
                  warning
                  showCancel
                  confirmBtnText="Delete Disk"
                  confirmBtnBsStyle="danger"
                  cancelBtnBsStyle="default"
                  title="Are you sure?"
                  onConfirm={() => this.deleteHandle()}
                  onCancel={this.hideAlert.bind(this)}
              >
              </SweetAlert>
            }
            <div className="col-lg-6">
	            <div className="form-group row">
	                <div className="col-sm-12">
	                	<span className="star-mark">*</span> Data coming Azure REST API, you might face some delay in loading this page.
	                </div>
	            </div>
	        </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  console.log(state);
  const { azure } = state;
  return {
    azure
  };
}

const connected = connect(mapStateToProps)(azureDiskList);
export { connected as azureDiskList };
