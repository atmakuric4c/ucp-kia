import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import ReactHtmlParser from 'react-html-parser'; 
import DatatablePage from './resourceGroupsGridview';
import PageLoader from '../PageLoader';
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri,decryptResponse } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';
import { MDBDataTable } from 'mdbreact';
import ReactTooltip from "react-tooltip";

Modal.setAppElement("#app");
class AwsManagePolicy extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));

    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      isAddPolicyModelOpen: false,
      isAddUserModelOpen: false,
      addPolicyName: "",


      regionid: "",
      dataList: "",
      isDataListLoading: false,
      is_add_policy_inprogress: false,
      sweetalert: false,
      currentRowDeleteDetails: "",

      regionName: "",
    };

    this.closeAddPolicyModal = this.closeAddPolicyModal.bind(this);
  }

  componentDidMount() {
    this.getUserList();
  }
/*Start: Common AWS API*/
  calAwsApis(frmData, apiName, stateName, isLoading){
    if(isLoading){
      this.setState({
        [isLoading]: true
      });
    }

    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/aws/` + apiName, requestOptions).then(response  => this.handleResponse(response, stateName, isLoading));
  }

  handleResponse(response, stateName, isLoading) {
    return response.text().then(text => {

        const data = (text && JSON.parse(text) ? JSON.parse(text) : "");
        if (!data.success) {
          
        }
        else{
          this.setState({
            [stateName]: (data.data ? data.data : (data.value ? data.value : data))
          });
        }

        if(isLoading){
          this.setState({
            [isLoading]: false
          });
        }
    });
  }
/*End: Common AWS API*/

/*Start: User List*/
  getUserList(){
      let frmData = { "clientid" : this.state.clientid};

      this.setState({
        isDataListLoading: true,
        dataList: ""
      });

      const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(frmData)
      };

      fetch(`${config.apiUrl}/secureApi/aws/policyList`, requestOptions).then(response  => this.handleDataListResponse(response));
  }
  
  handleDataListResponse(response) {
    return response.text().then(text => {
        
        let data = text && JSON.parse(text);
        
        if(!data.success) {
          toast.error(data.message ? data.message : "Unable to fetch Policy List, Please try again later !");
          
          this.setState({
            dataList: ""
          });
        }
        else{
          let dataRowList = [];
          
          if(data && data.data){
            data = data.data.member;
            for(let i =0; i < data.length; i++){
              let newRow = {};
              newRow.PolicyId = (data[i].PolicyId && data[i].PolicyId[0] ? data[i].PolicyId[0] : "");
              newRow.PolicyName = (data[i].PolicyName && data[i].PolicyName[0] ? data[i].PolicyName[0] : "");
              newRow.AttachmentCount = (data[i].AttachmentCount && data[i].AttachmentCount[0] ? data[i].AttachmentCount[0] : 0);
              newRow.action = <a href="javascript:void(0);" onClick={() => this.editPolicy(data[i])}><i class="fa fa-edit"></i> </a>;
              newRow.delete =  <div className="text-center"><button className="btn btn-sm btn-danger" onClick={() => this.deletePolicy(data[i])}><i className="fas fa-minus-circle"></i> Delete Policy</button></div>;
              dataRowList.push(newRow);
            }
          }

          let dataList = "";

          if(dataRowList.length > 0){
            dataList = {
              columns: [
                {
                    label: 'Policy Id',
                    field: 'PolicyId'
                },
                {
                    label: 'Policy Name',
                    field: 'PolicyName'
                },
                {
                    label: 'Attachment Count',
                    field: 'AttachmentCount'
                },
                {
                    label: 'Edit',
                    field: 'action'
                },
                {
                  label: 'Delete',
                  field: 'delete'
                }
              ],
              rows: dataRowList
            }
          }

          if(dataRowList.length == 0){
            toast.error("No record for current selection!");
          }

          this.setState({
            dataList: dataList
          });
        
        }       
        this.setState({
          isDataListLoading: false
        }) 
    });
  }
/*End: User List*/

/*Start: User Edit*/
  deletePolicy = (row) =>{    
    this.setState({
      sweetalert: true,
      currentRowDeleteDetails: row
    });
  }

  deletePolicyHandle(){
    let currentRowDeleteDetails = this.state.currentRowDeleteDetails;
    let formdata = {
      clientid: this.state.clientid, 
      policyName: currentRowDeleteDetails.PolicyName
    };

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formdata)
    };

    $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);
    
    fetch(`${config.apiUrl}/secureApi/aws/deletePolicy`, requestOptions).then(response  => this.handleDeleteItemResponse(response));
  }

  handleDeleteItemResponse(response, stateName) {
    return response.text().then(text => {
      
      const data = (text && decryptResponse(text));


      if(data && data.success){
        toast.success("Deleted Policy successfully!");
      }
      else {
        toast.error(data.message ? data.message : "Unable to Delete Policy !");
      }

      this.setState({
        is_delete_item_inprogress: false,
        sweetalert: false
      });

    });
  }
/*End: User Edit*/

  hideAlert() {
    this.setState({
        sweetalert: null
    });
  }

  /*Start: Add Policy*/
  editPolicy = (e) => {
    this.setState({ isEdidPolicyModelOpen: true, editPolicyName: e.PolicyName });
  }

  closeEditPolicyModal = () => {
    this.setState({ isEdidPolicyModelOpen: false });        
  }

  updatePolicy = e => {
    e.preventDefault();      
    
    if(!this.state.editPolicyName){
      toast.error("Please enter Policy Name");
      return;
    }

    let frmData = {};
    frmData.policyName = this.state.editPolicyName;
    frmData.clientid = this.state.clientid;
    //frmData.policyDocument = "ANPAI23HZ27SI6FQMGNQ2";

    this.setState({
      is_edit_policy_inprogress: true
    });
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/aws/createPolicy`, requestOptions).then(response  => this.handleEditUserGroupResponse(response));
  }

  handleEditUserGroupResponse(response, stateName) {
    return response.text().then(data => {
      
      data = (data && JSON.parse(data));

      this.setState({
        is_edit_policy_inprogress: false
      });

      if(data && data.success){
        toast.success("Policy has been Updated Successfully!");

        this.closeEditPolicyModal();

        setTimeout(() => {
          location.reload(true);
        }, 2000);
      }
      else {
        toast.error(data.message ? data.message : "Unable to Updated Policy !");
      }   
    });
  }
  /*End: Add Policy*/

  /*Start: Add Policy*/
  createPolicy = e => {
    e.preventDefault();      
    
    if(!this.state.addPolicyName){
      toast.error("Please enter Policy Name");
      return;
    }

    let frmData = {};
    frmData.policyName = this.state.addPolicyName;
    frmData.clientid = this.state.clientid;
    //frmData.policyDocument = "ANPAI23HZ27SI6FQMGNQ2";

    this.setState({
      is_add_policy_inprogress: true
    });
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/aws/createPolicy`, requestOptions).then(response  => this.handleAddUserGroupResponse(response));
  }

  handleAddUserGroupResponse(response, stateName) {
    return response.text().then(data => {
      
      data = (data && JSON.parse(data));

      this.setState({
        is_add_policy_inprogress: false
      });

      if(data && data.success){
        toast.success("Policy has been Created Successfully!");

        this.closeAddPolicyModal();

        setTimeout(() => {
          location.reload(true);
        }, 2000);
      }
      else {
        toast.error(data.message ? data.message : "Unable to Create Policy !");
      }   
    });
  }

  addPolicyModal = () => {     
    this.setState({ isAddPolicyModelOpen: true, addPolicyName: "" });
  }

  closeAddPolicyModal = () => {
      this.setState({ isAddPolicyModelOpen: false });        
  }

  /*End: Add Policy*/

  /*Start: Add User*/
  
  allowAlphaNumericChange(target){
    let val = target.value;
    var letterNumber = /^[0-9a-zA-Z]+$/;
    if(val == ""){
        this.setState({
            [target.name]: ""
        })
    }
    else if((val.match(letterNumber))){
        this.setState({
            [target.name]: val
        })
    }
  }

  /*End: Add User*/

  render() { 
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <div className="row">
            <div className="col-lg-6">
              <h5 className="color">AWS Policy Management</h5>
            </div>
            <div className="col-lg-6">
                <div className="text-right">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={this.addPolicyModal}
                    > <i class="fa fa-plus" /> Create Policy
                    </button>
                </div>
            </div>
          </div>
            
          <div className="row mt-4">
              <div className="col-md-12 mt-2">                    
                  <React.Fragment>
                    {this.state.dataList &&
                      <MDBDataTable
                      striped
                      hover
                      data={this.state.dataList}
                      />}

                    {this.state.isDataListLoading && <PageLoader />}

                    {this.state.regionid && !this.state.isDataListLoading && !this.state.dataList && 
                      <div className="text-error-message">No record found!</div>
                    }

                    {this.state.sweetalert &&
                      <SweetAlert
                          warning
                          showCancel
                          confirmBtnText="Delete Policy"
                          confirmBtnBsStyle="danger"
                          cancelBtnBsStyle="default"
                          title="Are you sure?"
                          onConfirm={() => this.deletePolicyHandle()}
                          onCancel={this.hideAlert.bind(this)}
                      >
                      </SweetAlert>
                    }
                    
                  </React.Fragment>
              </div>
          </div>
        
          <Modal
            isOpen={this.state.isAddPolicyModelOpen}
            onRequestClose={this.closeAddPolicyModal}
            >
                <h2 style={{color:'red'}}>
                    Create Policy<a className="float-right" href="javascript:void(0);" onClick={this.closeAddPolicyModal}><i className="fa fa-times" /></a>
                </h2>

                <div className="col-md-12">
                    <div className="panel panel-default" />
                    <form
                    name="addUserGroupFrom"
                    id="addUserGroupFrom"
                    method="post"
                    onSubmit={this.createPolicy}
                    >
                    <div className="form-group position-relative">
                        <label htmlFor="name">Policy Name<span className="star-mark">*</span></label>
                        <input
                        type="text"
                        className="form-control"
                        name="addPolicyName"
                        required                      
                        placeholder="Ex: AwsPolicy"
                        value={this.state.addPolicyName}
                        onChange={e => this.allowAlphaNumericChange(e.target)}
                        />
                    </div>
                    <div className="form-group">
                        <button className="btn btn-sm btn-primary">
                          {this.state.is_add_policy_inprogress &&
                            <i className="fas fa-circle-notch icon-loading"></i>}
                          Submit</button>
                    </div>
                    </form>
                </div>
            </Modal>
        
            <Modal
            isOpen={this.state.isEdidPolicyModelOpen}
            onRequestClose={this.closeEditPolicyModal}
            >
                <h2>
                    Edit Policy<a className="float-right" href="javascript:void(0);" onClick={this.closeEditPolicyModal}><i className="fa fa-times" /></a>
                </h2>

                <div className="col-md-12">
                    <div className="panel panel-default" />
                    <form
                    name="addUserGroupFrom"
                    id="addUserGroupFrom"
                    method="post"
                    onSubmit={this.updatePolicy}
                    >
                    <div className="form-group position-relative">
                        <label htmlFor="name">Policy Name<span className="star-mark">*</span></label>
                        <input
                        type="text"
                        className="form-control"
                        name="editPolicyName"
                        required                      
                        placeholder="Ex: AwsPolicy"
                        value={this.state.editPolicyName}
                        onChange={e => this.allowAlphaNumericChange(e.target)}
                        />
                    </div>
                    <div className="form-group">
                        <button className="btn btn-sm btn-primary">
                          {this.state.is_edit_policy_inprogress &&
                            <i className="fas fa-circle-notch icon-loading"></i>}
                          Submit</button>
                    </div>
                    </form>
                </div>
            </Modal>
        
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

const connected = connect(mapStateToProps)(AwsManagePolicy);
export { connected as AwsManagePolicy };