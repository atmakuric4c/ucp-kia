import React, {Fragment} from 'react';
import { commonFns } from "../../_helpers/common";
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
class azureResourcesSearch extends React.Component {
  constructor(props) {
    super(props);
    
    commonFns.fnCheckPageAuth(commonFns.menuUrls.azure);

    let user = JSON.parse(localStorage.getItem("user"));

    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      provision_type: user.data.provision_type,
      resourceList: [],
      isItFirstLoad: false,
      subscriptionSelectedValue: "",
      isResouceListLoading: false,
      data: {
        columns: [
          {
              label: 'Subscription',
              field: 'subscriptionId',
          },
          {
              label: 'Name',
              field: 'name',
          },
          {
              label: 'Resource Group',
              field: 'resourceGroup',
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
              label: 'Linked VM Name',
              field: 'linked_vm_name',
          },
          {
              label: '',
              field: 'action',
          },
        ],
        rows: []
      }
    };

    this.bindField = this.bindField.bind(this);
  }

  componentDidMount() {
    this.props.dispatch(azureActions.getAzureSubscriptions({clientid:this.state.clientid}));
  }
  
  bindField(e){    
//	    console.log("e.target.name -- "+e.target.name+" --- e.target.value -- "+e.target.value);
//	    console.log(this.state[e.target.name]);

	    let target_name = e.target.name;
	    let target_value = e.target.value;
	    setTimeout(() => {
		    this.setState({
		        [target_name]: target_value
		    })
		    console.log(this.state[target_name]);
	    }, 100);
  }
  
  getResourceSearchList() {
	  if(!this.state.filter_type){
		  toast.error('Please select Filter Type');
		  return;
	  }
	  if(!this.state.filter_name){
		  toast.error('Please select Filter Name');
		  return;
	  }
	  
	  this.setState({
    	  isResouceListLoading: true,
      });

	  let frmData = { "clientid" : this.state.clientid, "filter_type" : this.state.filter_type, "filter_name" : this.state.filter_name,
      		user_role: this.state.user_role, 
      		provision_type : this.state.provision_type,
      		user_id:this.state.user_id};
    const requestOptions = {
        method: 'POST',
//        "Access-Control-Allow-Origin":"*",
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azureapi/resource_search_list`, requestOptions).then(response  => this.handleResourceListResponse(response));
  }

  handleResourceListResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if(data.status && data.status == 'error'){
          toast.error(data.message);
        }

        let resourceList = [];
        if(data && data.value){
          for(let i =0; i < data.value.length; i++){
            let newRow = {};
            newRow.name = data.value[i].name; 
            newRow.type = data.value[i].type.split("/")[1];
            newRow.resourceGroup = data.value[i].resourceGroup;
            newRow.linked_vm_name = ((newRow.type != 'virtualMachines')?data.value[i].linked_vm_name:data.value[i].name);
            newRow.location = data.value[i].location;
            newRow.subscriptionId = data.value[i].subscriptionId;
            newRow.action = ((data.value[i].linked_vm_name != '' || newRow.type == 'virtualMachines')?<a className="cursor" href={"#/azurevmdetail?id=" + data.value[i].subscriptionId + "&name=" + ((data.value[i].linked_vm_name != '')?data.value[i].linked_vm_name:newRow.name) }>VM Details</a>:"");
            resourceList.push(newRow);
          }
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

  render() { 
    const { azure } = this.props;
    let subscription_list = this.props.azure.subscription_list;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">Resources Search</h5>
          <div className="row">
              <div className="col-lg-5">
                  <div className="form-group row">
                      <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Filter Type<span className="star-mark">*</span></label>                
                      <div className="col-sm-9">
                          <select
                          className="form-control-vm"
                          required
                          name="filter_type"
                        	  onChange={this.bindField}
                          >
                              <option value="">--SELECT--</option>
                              <option value="Microsoft.Compute/disks">Disks</option>
                              <option value="Microsoft.Network/networkInterfaces">Network Interfaces(NIC)</option>
                              <option value="Microsoft.Compute/virtualMachines">VMs</option>
                          </select>
                      </div>
                  </div>
              </div>
              <div className="col-lg-5">
	              <div className="form-group row">
	                  <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Name<span className="star-mark">*</span></label>                
	                  <div className="col-sm-9">
	                  <input type="text" placeholder="Name" name="filter_name" className="form-control-vm"  onChange={this.bindField}  />
	                  </div>
	              </div>
	          </div>
	          <div className="col-lg-2 float-left">
	          	<button name="search" onClick={() => this.getResourceSearchList()} className="ml-2 btn btn-primary cursor-pointer">Search</button>
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
  const { azure } = state;
  return {
    azure
  };
}

const connected = connect(mapStateToProps)(azureResourcesSearch);
export { connected as azureResourcesSearch };