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

Modal.setAppElement("#app");
class azureIpList extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));

    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      resourceList: [],      
      resourceGroups:[],
      resource_group: [],
      isItFirstLoad: true,
      subscriptionSelectedValue: "",
      resourceSelectedValue: "",
      isIpListLoading: false,
      showIpList: false,
      is_add_ip_inprogress: false,
      is_subscription_list_loaded: false,
      is_resource_list_loading: false,      
      locations: [],
      sweetalert: false,
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
              label: 'Type',
              field: 'type'
          },
          {
              label: 'Location',
              field: 'location'
          },
          {
              label: '',
              field: 'delete'
          }
        ],
        rows: []
      }
    };

    
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  componentDidMount() {
    this.props.dispatch(azureActions.getAzureSubscriptions({clientid:this.state.clientid}));
  }

  openModal() {
    if(!this.state.subscriptionSelectedValue && !this.state.resourceSelectedValue){
      toast.warn("Please select Subscription & Resource Group to Add Public IP !");
      return;
    }
    else if(!this.state.resourceSelectedValue){
      toast.warn("Please select Resource Group to Add Public IP !");
      return;
    }

    this.setState({ modalIsOpen: true });
  }

  closeModal() {
      this.setState({ modalIsOpen: false });        
  }
  
  azureAddPublicIpRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#azureAddPublicIp");
    var frmData = serialize(form, { hash: true });
    
    if(frmData.publicIpAddressName.length < 5){
      toast.error("Public Ip Address Name should be at least 5 characters");
      return;
    }

    this.setState({
      is_add_ip_inprogress: true
    });
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/azureapi/create_public_ip`, requestOptions).then(response  => this.handleAddPublicIpResponse(response));
  }

  handleAddPublicIpResponse(response, stateName) {
    return response.text().then(text => {
      this.setState({
        is_add_ip_inprogress: false
      });
      
      const data = text && JSON.parse(text);
      if(data.name){
        toast.success("Public Ip Added Successfully!");

        this.setState({
          modalIsOpen: false
        });
        
        this.resourceChange(this.state.resourceSelectedValue);
      }
      else{
        toast.error("Unable to add Public IP!");
      }
    });
  }

  subscriptionLoaded(){
    setTimeout(() => {
      if(this.state.isItFirstLoad){
        this.setState({
          isItFirstLoad: false,
          is_subscription_list_loaded: true
        });
      }
    }, 100);
  }

  getResourceList(frmData){
    this.setState({
      is_resource_list_loading: true
    });

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azure/azureResourceGroupBySubscription `, requestOptions).then(response  => this.handleResponse(response,"resource_group", "is_resource_list_loading"));
  }

  resourceChange(value){
    debugger;

    let locations = [];
    if(value){
      this.setState({
        showIpList: true,
        isIpListLoading: true,
      });

      var resourceGroupsList=this.state.resource_group;
      
      for(const loc of resourceGroupsList){
          if(loc.name == value){

              locations = [loc];
              break;
          }
      }
    }
    else{  
      this.setState({
        showIpList: false,
        isIpListLoading: false,
      });
    }

    this.setState({
      resourceSelectedValue: value,
      locations: locations
    });

    if(value){ 
      var frmData = { "clientid" : this.state.clientid, "subscriptionId" : this.state.subscriptionSelectedValue, resourceGroup: value};

      const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
      };

      fetch(`${config.apiUrl}/secureApi/azureapi/public_ips `, requestOptions).then(response  => this.handleIpListResponse(response));
    }
  }

  azureDeleteAction = (row) => {
    this.setState({
        sweetalert: true,
        selectedDeleteRow: row
    });
  }
  
  hideAlert() {
    this.setState({
        sweetalert: false,
        selectedDeleteRow: ""
    });
  }

  deleteIpHandle(){
    let row = this.state.selectedDeleteRow;

    $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);

    let formdata = { clientid : this.state.clientid,    
                      subscriptionId :  this.state.subscriptionSelectedValue,
                      resourceGroup : this.state.resourceSelectedValue,
                      ipAddressProfile  : row.name
                    }

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(formdata))
    };
    return fetch(`${config.apiUrl}/secureApi/azureapi/delete_ip_address`, requestOptions)
    .then(res => res.json())
    .then((text) => {
      const data = text && JSON.parse(ucpDecrypt((text)));
      if (data.success == 1) {
        toast.success(data.message);
        
        this.resourceChange(this.state.resourceSelectedValue);
      }
      else{
        toast.error(data.message);
      }

      this.setState({
          sweetalert: false
      });
    })
    .catch(console.log)
  }

  handleIpListResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        let resourceList = [];
        if(data.value){
          for(let i =0; i < data.value.length; i++){
            let newRow = {};
            newRow.name = (data.value[i].type.split("/")[1].toLowerCase().indexOf("virtualmachine") == -1 ? 
            data.value[i].name : 
            <a className="cursor" href={"#/azurevmdetail?id=" + data.value[i].id.split("/")[2] + "&name=" + data.value[i].name }> {data.value[i].name} </a>); 
            newRow.type = data.value[i].type.split("/")[1];
            newRow.id = data.value[i].id.split("/")[4];
            newRow.location = data.value[i].location;
            newRow.delete = <button className="btn btn-sm btn-danger" onClick={() => this.azureDeleteAction(data.value[i])}><i className="fas fa-minus-circle"></i> Delete Public IP</button>
            resourceList.push(newRow);
          }
        }
        this.state.data.rows = resourceList;
        if (data && data.error && data.error.message) {
            toast.error(data.error.message);
        }
        else{
          this.setState({
            data: this.state.data
          })
          //return data;
        }       
        this.setState({
          isIpListLoading: false,
          showIpList: true
        }) 
    });
  }

  handleResponse(response, stateName, loading) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        if (!response.ok) {
            toast.error(data.error.message);

            if(stateName == "resource_group" && this.state.resource_group && this.state.resource_group[0]){
              this.setState({
                [stateName]: []
              })
            }
        }
        else{
          this.setState({
            [stateName]: (data.data ? data.data : (data.value ? data.value : data))
          });
        }

        this.setState({
          [loading]: false
        });
    });
  }

  subscriptionChange(value){
    this.setState({
      subscriptionSelectedValue: value,
      resourceSelectedValue: "",
      showIpList: false
    });

    this.getResourceList( { "clientid" : this.state.clientid, "subscriptionId" : value});
  }

  render() { 
    const { azure } = this.props;
    let subscription_list = this.props.azure.subscription_list;
    let resource_group = this.state.resource_group;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          {subscription_list && subscription_list.length == 0 && <h5 className="txt-error-icon">Please contact Cloud4C support to Activate the Azure Subscriptions in UCP</h5>}
          <div className="row">
            <div className="col-lg-6">
              <h5 className="color">Azure Public IP List</h5>
            </div>
            <div className="col-lg-6">
                <div className="text-right">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={this.openModal}
                    > <i className="fa fa-plus" /> Add Public IP
                    </button>
                    <Modal
                    isOpen={this.state.modalIsOpen}
                    onRequestClose={this.closeModal}              
                    contentLabel="Add Resource Group"
                    >
                        <h2 style={{color:'red'}}>
                            Add Public IP <a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
                        </h2>

                        <div className="col-md-12">
                            <div className="panel panel-default" />
                            <form
                            name="azureAddPublicIp"
                            id="azureAddPublicIp"
                            method="post"
                            onSubmit={this.azureAddPublicIpRequest}
                            >
                            <div className="form-group">
                                <label htmlFor="subscription">Subscription Id</label>
                                <input
                                type="text"
                                readOnly
                                className="form-control input-disabled"
                                name="subscriptionId" 
                                value={this.state.subscriptionSelectedValue}  
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="resource_group">Resource Group</label>
                                <input
                                type="text"
                                readOnly
                                className="form-control input-disabled"
                                name="resourceGroup"  
                                value={this.state.resourceSelectedValue}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="location">Location</label>
                                <select
                                className="form-control"
                                required
                                name="location"                  
                                >
                                    <option value="">-Select-</option>
                                    {this.state.locations && this.state.locations.map((l, index) =>
                                      <option value={l.location_name}>
                                          {l.location_name}
                                      </option>
                                    )}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="name">Public Ip Address Name</label>
                                <input
                                type="text"
                                className="form-control"
                                name="publicIpAddressName"
                                required                      
                                placeholder="IP Address Name"
                                />
                            </div>
                            <div className="form-group">
                                <input type="hidden" name="clientid" value={this.state.clientid} />
                                <button
                                className={"btn btn-sm btn-primary " + (this.state.is_add_ip_inprogress ? "no-access" : "")} disabled={this.state.is_add_ip_inprogress ? true : false}
                                >
                                {this.state.is_add_ip_inprogress &&
                                   <i className="fas fa-circle-notch icon-loading"></i>}
                                  Submit</button>
                            </div>
                            </form>
                        </div>
                    </Modal>
                </div>
            </div>
          </div>
          
          <div className="row mt-4">
              <div className="col-lg-6">
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
                                  {sub.subscription_id}
                              </option>
                              </React.Fragment>
                          )}
                          </select>
                          { /* !this.state.is_subscription_list_loaded && 
                            <i className="fas fa-circle-notch icon-loading drp-loader-icon"></i>
                           */ }
                          {(subscription_list && subscription_list.length > 0) && this.subscriptionLoaded()
                          }
                      </div>
                  </div>
              </div>
              <div className="col-lg-6">
                  <div className="form-group row">
                      <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Resource Group</label>                
                      <div className="col-sm-9">
                          <select
                          className="form-control-vm"
                          required
                          name="resource_group"
                          id="resource_group"
                          onChange={e => this.resourceChange(e.target.value)}
                          >
                          <option value="">--Select--</option>
                          {resource_group && resource_group.length > 0 && resource_group.map((sub, index) =>
                              <React.Fragment>
                              <option value={sub.name}>
                                  {sub.name}
                              </option>
                              </React.Fragment>
                          )}
                          </select>
                          { this.state.is_resource_list_loading && 
                            <i className="fas fa-circle-notch icon-loading drp-loader-icon"></i>
                          }
                      </div>
                  </div>
              </div>
            </div>
                
            <div className="row mt-4">
                <div className="col-md-12">
                    {this.state.isIpListLoading ? <PageLoader/> :
                    <React.Fragment>
                      {this.state.showIpList &&
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
                    confirmBtnText="Delete Public IP"
                    confirmBtnBsStyle="danger"
                    cancelBtnBsStyle="default"
                    title="Are you sure?"
                    onConfirm={() => this.deleteIpHandle()}
                    onCancel={this.hideAlert.bind(this)}
                >
                </SweetAlert>
            }
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

const connected = connect(mapStateToProps)(azureIpList);
export { connected as azureIpList };