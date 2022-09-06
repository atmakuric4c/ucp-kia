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
class azureResourceList extends React.Component {
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
          }
        ],
        rows: []
      }
    };
  }

  componentDidMount() {
    this.props.dispatch(azureActions.getAzureSubscriptions({clientid:this.state.clientid}));
  }

  loadResourceList(){
    if(!this.state.isItFirstLoad){
      this.setState({
    	  isResouceListLoading: true,
        subscriptionSelectedValue: this.props.azure.subscription_list[0].subscription_id
      });

      this.getResourceList( { "clientid" : this.state.clientid, "subscriptionId" : this.props.azure.subscription_list[0].subscription_id,
      		user_role: this.state.user_role, 
      		provision_type : this.state.provision_type,
      		user_id:this.state.user_id});

      this.setState({
        isItFirstLoad: true
      });
    }
  }
  
  getResourceList(frmData) {
    const requestOptions = {
        method: 'POST',
//        "Access-Control-Allow-Origin":"*",
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azureapi/resource_list`, requestOptions).then(response  => this.handleResourceListResponse(response));
  }

  handleResourceListResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if(data.error && data.error.message){
          toast.error(data.error.message);
        }

        let resourceList = [];
        if(data && data.value){
          for(let i =0; i < data.value.length; i++){
            let newRow = {};
            newRow.name = (data.value[i].type.split("/")[1].toLowerCase().indexOf("virtualmachine") == -1 ? 
            data.value[i].name : 
            <a className="cursor" href={"#/azurevmdetail?id=" + data.value[i].id.split("/")[2] + "&name=" + data.value[i].id.split("/")[8] }> {data.value[i].id.split("/")[8]} </a>); 
            newRow.backupName = data.value[i].name;
            newRow.type = data.value[i].type.split("/")[1];
            newRow.id = data.value[i].id.split("/")[4];
            newRow.location = data.value[i].location;
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

    this.getResourceList( { "clientid" : this.state.clientid, "subscriptionId" : value,
  		user_role: this.state.user_role, 
  		provision_type : this.state.provision_type,
  		user_id:this.state.user_id});
  }

  render() { 
    const { azure } = this.props;
    let subscription_list = this.props.azure.subscription_list;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
        {subscription_list && subscription_list.length == 0 && <h5 className="txt-error-icon">Please contact Cloud4C support to Activate the Azure Subscriptions in UCP</h5>} 
          <h5 className="color">Resources List</h5>
          <div className="row">
              <div className="col-lg-8">
                  <div className="form-group row">
                      <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Subscription</label>                
                      <div className="col-sm-9">
                          <select
                          className="form-control-vm"
                          required
                          name="subscription"
                          onChange={e => this.subscriptionChange(e.target.value)}
                          >
                          {subscription_list && subscription_list.length > 0 && subscription_list.map((sub, index) =>
                              <option value={sub.subscription_id} key={sub.subscription_id}>
                                  {sub.subscription_id} / {sub.display_name}
                              </option>
                          )}
                          </select>
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

const connected = connect(mapStateToProps)(azureResourceList);
export { connected as azureResourceList };