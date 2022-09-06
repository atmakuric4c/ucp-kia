import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { awsActions } from './aws.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import ReactHtmlParser from 'react-html-parser'; 
import DatatablePage from './resourceGroupsGridview';
import PageLoader from '../PageLoader';
import { authHeader } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';
import { MDBDataTable } from 'mdbreact';

Modal.setAppElement("#app");
class awsDiskList extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));

    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      resourceList: [],
      isItFirstLoad: false,
      subscriptionSelectedValue: "",
      isResouceListLoading: false,
      modalIsOpen:false,
      is_subscription_list_loaded: false,
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
              label: 'Size (GB)',
              field: 'diskSizeGB'
          }
        ],
        rows: []
      }
    };

    this.openModal = this.openModal.bind(this);
    this.handleAwsSubscriptions = this.handleAwsSubscriptions.bind(this);
    this.handleAwsResourceGroups = this.handleAwsResourceGroups.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  componentDidMount() {
    this.props.dispatch(awsActions.getAwsSubscriptions({clientid:this.state.clientid}));
  }

  openModal() {     
    this.setState({ modalIsOpen: true });
  }

  closeModal() {
      this.setState({ modalIsOpen: false });        
  }

  handleAwsSubscriptions = (subscription) => {
      if(subscription != ''){
          this.setState({subscription:subscription})
          this.props.dispatch(awsActions.getAwsSubscriptionLocations({clientid:this.state.clientid,subscription:subscription}));
      }
  }

  handleAwsResourceGroups = (location) => {
      var subscription=this.state.subscription;
      if(subscription != '' && location!=''){
          const requestOptions = {
              method: 'POST',
              headers: { ...authHeader(), 'Content-Type': 'application/json' },
              body: JSON.stringify({subscription:subscription,location:location})
          };
          return fetch(`${config.apiUrl}/secureApi/aws/get_resrouce_group_list`, requestOptions)
          .then(res => res.json())
          .then((data) => {
              this.setState({ resourceGroups: data })
          })
          .catch(console.log)
          }
  }
  
  loadResourceList(){
    setTimeout(() => {
      if(!this.state.isItFirstLoad){
        if(document.getElementById("drp_subscription") && document.getElementById("drp_subscription")[0]){
          document.getElementById("drp_subscription")[0].remove();
        }

        this.setState({
          subscriptionSelectedValue: this.props.aws.subscription_list[0].subscription_id
        });

        this.getDiskList( { "clientid" : this.state.clientid, "subscriptionId" : this.props.aws.subscription_list[0].subscription_id});

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
        body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/awsapi/disk_list`, requestOptions).then(response  => this.handleResourceListResponse(response));
  }

  handleResourceListResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        let resourceList = [];
        
        for(let i =0; i < data.value.length; i++){
          let newRow = {};
          newRow.name = (data.value[i].type.split("/")[1].toLowerCase().indexOf("virtualmachine") == -1 ? 
          data.value[i].name : 
          <a className="cursor" href={"#/awsvmdetail?id=" + data.value[i].id.split("/")[2] + "&name=" + data.value[i].name }> {data.value[i].name} </a>); 
          newRow.type = data.value[i].type.split("/")[1];
          newRow.id = data.value[i].id.split("/")[4];
          newRow.location = data.value[i].location;
          newRow.diskSizeGB = (data.value[i] && data.value[i].properties && data.value[i].properties.diskSizeGB ? data.value[i].properties.diskSizeGB : "");
          resourceList.push(newRow);
        }
        this.state.data.rows = resourceList;
        if (!response.ok) {
            //
        }
        else{
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
    this.setState({
      subscriptionSelectedValue: value,
      isResouceListLoading: true
    });

    this.getDiskList( { "clientid" : this.state.clientid, "subscriptionId" : value});
  }

  awsAddDiskRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#awsAddDisk");
    var frmData = serialize(form, { hash: true });
    
    if(frmData.location){
      frmData.location = frmData.location.split("_")[1];
    }

    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/aws/addDisk`, requestOptions).then(response  => this.handleAddDiskResponse(response));
  }

  handleAddDiskResponse(response, stateName) {
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

  render() { 
    const { aws } = this.props;
    let subscription_list = this.props.aws.subscription_list;
    let subscription_locations = this.props.aws.subscription_locations; 

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <div className="row">
            <div className="col-lg-6">
              <h5 className="color">Aws Disk List</h5>
            </div>
            <div className="col-lg-6">
                <div className="text-right">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={this.openModal}
                    > <i className="fa fa-plus" /> Add Disk
                    </button>
                    <Modal
                    isOpen={this.state.modalIsOpen}
                    onRequestClose={this.closeModal}              
                    contentLabel="Add Resource Group"
                    >
                        <h2 style={{color:'red'}}>
                            Add Disk <a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
                        </h2>

                        <div className="col-md-12">
                            <div className="panel panel-default" />
                            <form
                            name="awsAddDisk"
                            id="awsAddDisk"
                            method="post"
                            onSubmit={this.awsAddDiskRequest}
                            >
                            <div className="form-group">
                                <label htmlFor="subscription">Subscription Id</label>
                                <select
                                className="form-control"
                                required
                                name="subscription_id"        
                                onChange={e => this.handleAwsSubscriptions(e.target.value)}      
                                >
                                    <option value="">-Select-</option>
                                    {subscription_list && subscription_list.length > 0 && subscription_list.map((sub, index) =>
                                        <option value={sub.subscription_id} key={sub.subscription_id}>
                                            {sub.subscription_id}
                                        </option>
                                    )}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="location">Location</label>
                                <select
                                className="form-control"
                                required
                                name="location"
                                onChange={e => this.handleAwsResourceGroups(e.target.value)}                     
                                >
                                    <option value="">-Select-</option>
                                    {subscription_locations && subscription_locations.length > 0 && subscription_locations.map((l, index) =>
                                        <option value={l.id+"_"+l.name} key={l.id}>
                                            {l.display_name}
                                        </option>
                                    )}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="resource_group">Resource Group</label>
                                <select
                                className="form-control"
                                required
                                name="resourceGroup"                     
                                >
                                    <option value="">-Select-</option>
                                    {this.state.resourceGroups && this.state.resourceGroups.length > 0 && this.state.resourceGroups.map((l, index) =>
                                        <option value={l.name} key={l.id}>
                                            {l.name}
                                        </option>
                                    )}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="name">Disk Name</label>
                                <input
                                type="text"
                                className="form-control"
                                name="name"
                                required                      
                                placeholder="Disk Name"
                                />
                            </div>
                            <div className="form-group position-relative">
                                <label htmlFor="ip_address_prefix">Disk Size</label>
                                <input
                                type="text"
                                className="form-control"
                                name="diskSizeGB"
                                required   
                                placeholder="30"                 
                                />
                                <span class="add_disk_size_gb">GB</span>
                            </div>
                            <div className="form-group">
                                <input type="hidden" name="clientid" value={this.state.clientid} />
                                <input type="hidden" name="createOption" value="Empty" />
                                <button className="btn btn-sm btn-primary">Submit</button>
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
                          { !this.state.is_subscription_list_loaded && 
                            <i className="fas fa-circle-notch icon-loading drp-loader-icon"></i>
                          }

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
                        />
                      }
                    </React.Fragment>
                  }
                </div>
            </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  console.log(state);
  const { aws } = state;
  return {
    aws
  };
}

const connected = connect(mapStateToProps)(awsDiskList);
export { connected as awsDiskList };