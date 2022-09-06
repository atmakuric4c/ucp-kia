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
class AzureNetworkList extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));

    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      resourceList: [],
      resourceGroups:[],
      subscriptionSelectedValue: "",
      isNetworkListLoading: false,
      modalIsOpen:false,
      is_subscription_list_loaded: false,
      is_add_network_inprogress: false,
      currentRowDeleteDetails: "",
      sweetalert: false,
      locations: [],
      subscription_list: [],
      backup_network_list: [],
      selectedDeleteRow: "",
      data: {
        columns: [
            {
                label: 'SL No',
                field: 'slno',
                // sort: 'asc',
                width: 150
            },
            {
            label: 'Network Name',
            field: 'name',
            // sort: 'asc',
            width: 150
          },
          {
              label: 'Location Name',
              field: 'location',
              // sort: 'asc',
              width: 150
          },
          {
              label: 'Resource Group',
              field: 'resource_group',
              // sort: 'asc',
              width: 150
          },
//          {
//              label: '',
//              field: 'delete',
//              // sort: 'asc',
//              width: 150
//          }
        ],
        rows: []
      }
    };

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
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
          is_resource_group_list_loading: false
        })
    });
  }

  closeModal() {
      this.setState({ modalIsOpen: false });        
  }
  
  handleAzureLocations = (resourceGroup) => {
    this.setState({ locations: [] })

    var resourceGroupsList = this.state.resourceGroups;
    if(resourceGroup != '' && resourceGroupsList!=''){
        for(const loc of resourceGroupsList){
            if(loc.name==resourceGroup){console.log(loc)
                this.setState({ locations: [loc] })
                break;
            }
        }
    }
  }

  componentDidMount() {
    this.getSubscriptionList();
  }
  
  getNetworkList() {
    this.setState({
      isNetworkListLoading: true
    });

    const requestOptions = {
        method: 'GET',
        headers: { ...authHeader(), 'Content-Type': 'application/json' }
    };

    fetch(`${config.apiUrl}/secureApi/azure/networks/` + btoa(this.state.clientid), requestOptions).then(response  => this.handleNetworkListResponse(response));
  }

  filterNetworkList(){
    let data = this.state.backup_network_list;
    let values = [];
    
    let count = 0;
    for(let index = 0; index < data.length; index++){
      let val = data[index];
      if(this.state.subscriptionSelectedValue == val.subscriptionId){
        values[count]={
            slno:(count+1),
            name : val.name,
            location:val.location,
            resource_group:val.resource_group,
            //delete: <button className="btn btn-sm btn-danger" onClick={() => this.azureDeleteAction(val)}><i className="fas fa-minus-circle"></i> Delete Network</button>
        }
        count++;
      }
    }

    let newData = this.state.data;
    newData.rows  = values;

    this.setState({
      data: newData,
      isNetworkListLoading: false
    });
  }

  handleNetworkListResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if (data && data.error && data.error.message) {
          toast.error(data.error.message);

          this.setState({
            isNetworkListLoading: false
          }) 
        }
        else if(!response.ok){
          toast.error("No Subscription records found !");

          this.setState({
            isNetworkListLoading: false
          }) 
        }
        else if(data && data.length > 0){     
          this.setState({
            backup_network_list: data
          });
          this.filterNetworkList();
        }
    });
  }

  getSubscriptionList() {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt({clientid: this.state.clientid}))
    };

    fetch(`${config.apiUrl}/secureApi/getAzureSubscriptions`, requestOptions).then(response  => this.handleSubscriptionResponse(response));
  }

  handleSubscriptionResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if (data && data.error && data.error.message) {
          toast.error(data.error.message);
        }
        else if(!response.ok){
          toast.error("No Subscription records found !");
        }
        else if(data && data.length > 0){
          this.setState({
            subscription_list: data
          });

          if(document.getElementById("drp_subscription") && document.getElementById("drp_subscription")[0]){
            document.getElementById("drp_subscription")[0].remove();
          }
  
          this.setState({
            subscriptionSelectedValue: (data[0] && data[0].subscription_id ? data[0].subscription_id : "")
          });
        }

        this.setState({
          is_subscription_list_loaded: true
        });

        if(this.state.subscription_list.length > 0 ){
        	this.getNetworkList();
        }
    });
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

  deleteNetworkHandle(){
      let row = this.state.selectedDeleteRow;

      $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
      $(".sweet-alert").find(".btn-danger").attr("disabled",true);

      let formdata = { clientid : this.state.clientid,    
                        subscriptionId : row.subscriptionId,
                        resourceGroup : row.resource_group,
                        virtualNetwork : row.name,
                        id: row.id
                      }
  
      const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(formdata))
      };
      return fetch(`${config.apiUrl}/secureApi/azureapi/delete_virtual_network`, requestOptions)
      .then(res => res.json())
      .then((text) => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        if (data.success == 1) {
          toast.success(data.message);
          
          this.subscriptionChange();
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

  subscriptionChange(value){
    if(!value){
      value = $("#drp_subscription option:selected").val();
    }

    this.setState({
      subscriptionSelectedValue: value
    });

    this.getNetworkList();
  }

  azureVirtualNetwrokRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#azureVirtualNetwrok");
    var frmData = serialize(form, { hash: true });
    
    if(!frmData.subscription){
      toast.error("Please select Subscription");
      return;
    }
    else if(!frmData.resource_group){
      toast.error("Please select Resource Group");
      return;
    }
    else if(!frmData.location){
      toast.error("Please select Location");
      return;
    }
    else if(!frmData.name){
      toast.error("Please enter Virtual Network Name");
      return;
    }
    else if(frmData.name.length < 5){
      toast.error("Virtual Network Name should be at least 5 characters");
      return;
    }
    else if(!frmData.ip_address_prefix){
      toast.error("Please enter IP Address Prefix");
      return;
    }

    this.setState({
      is_add_network_inprogress: true
    });
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azure/addAzureNetwork`, requestOptions).then(response  => this.handleAddNetworkResponse(response, frmData.subscription));
  }

  handleAddNetworkResponse(response, subscription) {
    return response.text().then(text => {
      this.setState({
        is_add_network_inprogress: false
      });
      
      const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
      
      if(data.status == "error"){
        toast.error(data.message);
      }
      else if (!response.ok) {
        toast.error(data.message);
      }
      else{
        toast.success("Virtual Network Added Successfully!");
        this.setState({
          modalIsOpen: false
        })
        
        this.subscriptionChange();
      }        
    });
  }

  render() { 
    const { azure } = this.props;
    let subscription_list = this.state.subscription_list;

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          {subscription_list && subscription_list.length == 0 && <h5 className="txt-error-icon">Please contact Cloud4C support to Activate the Azure Subscriptions in UCP</h5>}
          <div className="row">
            <div className="col-lg-6">
              <h5 className="color">Azure Network List</h5>
            </div>
            <div className="col-lg-6">
                <div className="text-right">
                    {/*<button
                        className="btn btn-sm btn-primary"
                        onClick={this.openModal}
                    > <i className="fa fa-plus" /> Add Network
                    </button>*/}
                      <Modal
                      isOpen={this.state.modalIsOpen}
                      onRequestClose={this.closeModal}              
                      contentLabel="Add Resource Group"
                      >
                      <h2 style={{color:'red'}}>
                          Add Virtual Network <a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
                      </h2>

                      <div className="col-md-12">
                          <div className="panel panel-default" />
                          <form
                          name="azureVirtualNetwrok"
                          id="azureVirtualNetwrok"
                          method="post"
                          onSubmit={this.azureVirtualNetwrokRequest}
                          >
                          <div className="form-group">
                              <label htmlFor="subscription">Subscription Id</label>
                              <input
                                type="text"
                                className="form-control input-disabled"
                                readOnly
                                name="subscription"   
                                value={this.state.subscriptionSelectedValue}     
                              />
                          </div>
                          <div className="form-group position-relative">
                              <label htmlFor="resource_group">Resource Group</label>
                              <select
                              className="form-control"
                              required
                              name="resource_group" 
                              onChange={e => this.handleAzureLocations(e.target.value)}                    
                              >
                                  <option value="">-Select-</option>
                                  {this.state.resourceGroups && this.state.resourceGroups.map((l, index) =>
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
                              <label htmlFor="location">Location</label>
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
                              <label htmlFor="name">Virtual Network Name</label>
                              <input
                              type="text"
                              className="form-control"
                              name="name"
                              required                      
                              placeholder="Virtual Network Name"
                              />
                          </div>
                          <div className="form-group">
                              <label htmlFor="ip_address_prefix">IP Address Prefix</label>
                              <input
                              type="text"
                              className="form-control"
                              name="ip_address_prefix"
                              required   
                              placeholder="e.g 10.0.0.1/16"                   
                              />
                          </div>
                          
                          <div className="form-group">
                              <input type="hidden" name="userid" value={this.state.user_id} />
                              <button
                              className={"btn btn-sm btn-primary " + (this.state.is_add_network_inprogress ? "no-access" : "")} disabled={this.state.is_add_network_inprogress ? true : false}
                              >
                              {this.state.is_add_network_inprogress &&
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
                          { !this.state.is_subscription_list_loaded && 
                            <i className="fas fa-circle-notch icon-loading drp-loader-icon"></i>
                          }
                      </div>
                  </div>
              </div>
            </div>
                
            <div className="row mt-4">
                <div className="col-md-12">
                    {this.state.isNetworkListLoading ? <PageLoader/> :
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
                    confirmBtnText="Delete Azure Network"
                    confirmBtnBsStyle="danger"
                    cancelBtnBsStyle="default"
                    title="Are you sure?"
                    onConfirm={() => this.deleteNetworkHandle()}
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

const connected = connect(mapStateToProps)(AzureNetworkList);
export { connected as AzureNetworkList };
