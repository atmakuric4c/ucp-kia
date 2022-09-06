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
class awsIpList extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));

    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      resourceList: [],
      resource_group: [],
      isItFirstLoad: true,
      subscriptionSelectedValue: "",
      resourceSelectedValue: "",
      isIpListLoading: true,
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
    this.props.dispatch(awsActions.getAwsSubscriptions({clientid:this.state.clientid}));
  }

  loadResourceGroup(){
    if(this.state.isItFirstLoad){
      this.setState({
        isItFirstLoad: false
      })
      if(this.props.aws.subscription_list && this.props.aws.subscription_list[0] && this.props.aws.subscription_list[0].subscription_id){
          this.setState({
            subscriptionSelectedValue: this.props.aws.subscription_list[0].subscription_id
          });

          var frmData = { "clientid" : this.state.clientid, "subscriptionId" : this.props.aws.subscription_list[0].subscription_id }
          this.getResourceList(frmData);
      }
    }
  }

  getResourceList(frmData){
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/awsapi/resource_list `, requestOptions).then(response  => this.handleResponse(response,"resource_group"));
  }

  resourceChange(value){
    this.setState({
      resourceSelectedValue: value,
      isIpListLoading: true
    })
    
    var frmData = { "clientid" : this.state.clientid, "subscriptionId" : this.state.subscriptionSelectedValue, resourceGroup: value};

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/awsapi/public_ips `, requestOptions).then(response  => this.handleIpListResponse(response));
  }

  handleIpListResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        let resourceList = [];
        if(data.value){
          for(let i =0; i < data.value.length; i++){
            let newRow = {};
            newRow.name = (data.value[i].type.split("/")[1].toLowerCase().indexOf("virtualmachine") == -1 ? 
            data.value[i].name : 
            <a className="cursor" href={"#/awsvmdetail?id=" + data.value[i].id.split("/")[2] + "&name=" + data.value[i].name }> {data.value[i].name} </a>); 
            newRow.type = data.value[i].type.split("/")[1];
            newRow.id = data.value[i].id.split("/")[4];
            newRow.location = data.value[i].location;
            resourceList.push(newRow);
          }
        }
        this.state.data.rows = resourceList;
        if (!response.ok) {
            toast.error(data.error.message);
        }
        else{
          this.setState({
            data: this.state.data
          })
          //return data;
        }       
        this.setState({
          isIpListLoading: false
        }) 
    });
  }

  handleResponse(response, stateName) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
            toast.error(data.error.message);
        }
        else{
          this.setState({
            [stateName]: (data.data ? data.data : (data.value ? data.value : data))
          })
          if(stateName == "resource_group"){
            this.resourceChange(this.state.resource_group[0].name);
          }
        }        
    });
  }

  subscriptionChange(value){
    this.setState({
      subscriptionSelectedValue: value,
      isIpListLoading: true
    });

    this.getResourceList( { "clientid" : this.state.clientid, "subscriptionId" : value});
  }

  render() { 
    const { aws } = this.props;
    let subscription_list = this.props.aws.subscription_list;
    let resource_group = this.state.resource_group;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <div className="row">
            <div className="col-lg-6">
              <h5 className="color">Aws Public IP List</h5>
            </div>
            <div className="col-lg-6">
                <div className="text-right">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={this.openModal}
                    > <i className="fa fa-plus" /> Add Public IP
                    </button>
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
                          onChange={e => this.subscriptionChange(e.target.value)}
                          >
                          {subscription_list && subscription_list.length > 0 && subscription_list.map((sub, index) =>
                              <React.Fragment>
                              <option value={sub.subscription_id} key={sub.subscription_id}>
                                  {sub.subscription_id}
                              </option>
                              </React.Fragment>
                          )}
                          {(subscription_list && subscription_list.length > 0) && this.loadResourceGroup()}
                          </select>
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
                          name="subscription"
                          onChange={e => this.resourceChange(e.target.value)}
                          >
                          {resource_group && resource_group.length > 0 && resource_group.map((sub, index) =>
                              <React.Fragment>
                              <option value={sub.name}>
                                  {sub.name}
                              </option>
                              </React.Fragment>
                          )}
                          </select>
                      </div>
                  </div>
              </div>
            </div>
                
            <div className="row mt-4">
                <div className="col-md-12">
                    {this.state.isIpListLoading ? <PageLoader/> :
                    <React.Fragment>
                      {this.state.data.rows && this.state.data.rows.length > 0 ?
                        <MDBDataTable
                        striped
                        hover
                        data={this.state.data}
                        />
                      : <span className="star-mark">No Record found</span>}
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

const connected = connect(mapStateToProps)(awsIpList);
export { connected as awsIpList };