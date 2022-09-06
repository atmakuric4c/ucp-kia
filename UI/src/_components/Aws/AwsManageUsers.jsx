import React, {Fragment} from 'react';
import { connect } from 'react-redux';
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
import ReactTooltip from "react-tooltip";

Modal.setAppElement("#app");
class AwsManageUsers extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));

    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      usergroup_list: [],
      is_usergroup_list_loaded: false,
      isAddUserGroupModelOpen: false,
      isAddUserModelOpen: false,
      addUserGroupInput: "",
      userName: "",
      is_add_user_inprogress: false,
      regionid: "",
      dataList: "",
      isDataListLoading: false,
      is_add_usergroup_inprogress: false,
      sweetalert: false,
      currentRowDeleteDetails: "",
      regionName: "",
      editUserGroupDetails: {}
    };

    this.closeAddUserGroupModal = this.closeAddUserGroupModal.bind(this);
  }

  componentDidMount() {
    this.getUserList();
    this.calAwsApis({clientid: this.state.clientid}, "userGroups" , "usergroup_list", "is_usergroup_list_loaded" );
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

          if(stateName == "usergroup_list"){
            let dataRowList = [];
            if(data && data.data){
              let group_list = data.data;
              for(let i =0; i < group_list.length; i++){
                let newRow = {};
                group_list[i].Read =  i%2 ? 1 : 0;
                group_list[i].Write = i%2 ? 0 : 1;

                newRow.GroupId = group_list[i].GroupId;
                newRow.GroupName = group_list[i].GroupName;
                newRow.Read =  <div class="text-center" >{group_list[i].Read ? <i class="far fa-check-circle success-color fz-20"></i> : <i class="far fa-times-circle failure-color fz-20"></i>}</div>;
                newRow.Write = <div class="text-center" >{group_list[i].Write ? <i class="far fa-check-circle success-color fz-20"></i> : <i class="far fa-times-circle failure-color fz-20"></i>}</div>;
                newRow.action = <div class="text-center"><a href="javascript:void(0);" onClick={() => this.editUserGroupModal(group_list[i])}><i class="fa fa-edit"></i> </a></div>;

                dataRowList.push(newRow);
              }
            }

            let dataList = "";
            
            dataList = {
              columns: [
                {
                    label: 'User Group',
                    field: 'GroupName'
                },
                {
                    label: 'Read',
                    field: 'Read'
                },
                {
                    label: 'Write',
                    field: 'Write'
                },
                {
                    label: '',
                    field: 'action'
                }
              ],
              rows: dataRowList
            }

            this.setState({
              dataGroupList: dataList
            });
          }
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

      fetch(`${config.apiUrl}/secureApi/aws/userList`, requestOptions).then(response  => this.handleDataListResponse(response));
  }

  handleDataListResponse(response) {
    return response.text().then(text => {
        
        let data = text && JSON.parse(text);
        
        if(!data.success) {
          toast.error(data.message ? data.message : "Unable to fetch User List, Please try again later !");
          
          this.setState({
            dataList: ""
          });
        }
        else{
          let dataRowList = [];
        
          if(data && data.data){
            data = data.data;
            for(let i =0; i < data.length; i++){
              let newRow = {};
              newRow.UserId = (data[i].UserId && data[i].UserId[0] ? data[i].UserId[0] : "");
              newRow.UserName = (data[i].UserName && data[i].UserName[0] ? data[i].UserName[0] : "");
              newRow.UserGroup = "";
              newRow.action = <div class="text-center"><a href="javascript:void(0);" onClick={() => this.editUser(data[i])}><i class="fa fa-edit"></i> </a></div>;

              dataRowList.push(newRow);
            }
          }

          let dataList = "";

          if(dataRowList.length > 0){
            dataList = {
              columns: [
                {
                    label: 'User Name',
                    field: 'UserName'
                },
                {
                    label: 'User Group',
                    field: 'UserGroup'
                },
                {
                    label: '',
                    field: 'action'
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

  /*Start: Add User Group*/
  addUserGroup = e => {
    e.preventDefault();      
    
    if(!this.state.addUserGroupInput){
      toast.error("Please enter User Group");
      return;
    }

    let frmData = {};
    frmData.groupName = this.state.addUserGroupInput;
    frmData.clientid = this.state.clientid;

    this.setState({
      is_add_usergroup_inprogress: true
    });
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/aws/createGroup`, requestOptions).then(response  => this.handleAddUserGroupResponse(response));
  }

  handleAddUserGroupResponse(response, stateName) {
    return response.text().then(data => {
      data = (data && JSON.parse(data) ? JSON.parse(data) : "");

      this.setState({
        is_add_usergroup_inprogress: false
      });

      if(!data.success){
        toast.error(data.message ? data.message : "Unable to Add User Group");
      }
      else {
        toast.success("User Group has been Added Successfully!");

        this.closeAddUserGroupModal();

        setTimeout(() => {
          location.reload(true);
        }, 2000);
      }   
    });
  }

  addUserGroupModal = () => {     
    this.setState({ isAddUserGroupModelOpen: true, addUserGroupInput: "" });
  }

  closeAddUserGroupModal = () => {
      this.setState({ isAddUserGroupModelOpen: false });        
  }

  /*End: Add User Group*/

  /*Start: Add User*/

  addUserModal = () => {     
    this.setState({ isAddUserModelOpen: true, userName: "" });
  }
  
  closeAddUserModal = () => {
    this.setState({ isAddUserModelOpen: false });        
  }

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

  addUser = e => {
    e.preventDefault();
    var form = document.querySelector("#addUserFrom");
    var frmData = serialize(form, { hash: true });     
    
    if(!frmData.groupName){
      toast.error("Please select IAM User Group");
      return;
    }

    if(!frmData.userName){
      toast.error("Please enter User Name");
      return;
    }
    
    frmData.clientid = this.state.clientid;

    this.setState({
      is_add_user_inprogress: true
    });
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/aws/createUser`, requestOptions).then(response  => this.handleAddUserResponse(response));
  }

  handleAddUserResponse(response, stateName) {
    return response.text().then(data => {
      data = (data && JSON.parse(data) ? JSON.parse(data) : "");

      this.setState({
        is_add_user_inprogress: false
      });

      if(!data.success){
        toast.error(data.message ? data.message : "Unable to Add User Group");
      }
      else {
        toast.success("User has been Added Successfully!");

        this.closeAddUserModal();

        setTimeout(() => {
          location.reload(true);
        }, 2000);
      }   
    });
  }

  /*End: Add User*/
  
/*Start: User Edit*/
editUser = (row) =>{    
  this.setState({ isEditUserModelOpen: true, editUserGroupDetails: row });
}

closeEditUserModal = () => {
  this.setState({ isEditUserModelOpen: false });        
}

editHandle(){
  let currentRowDeleteDetails = this.state.currentRowDeleteDetails;
  let formdata = {
    clientid: this.state.clientid, 
    regionName: this.state.regionid, 
    vpcId: (currentRowDeleteDetails.vpcId && currentRowDeleteDetails.vpcId[0] ? currentRowDeleteDetails.vpcId[0] : "")
  };

  const requestOptions = {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(formdata)
  };

  $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
  $(".sweet-alert").find(".btn-danger").attr("disabled",true);
  
  fetch(`${config.apiUrl}/secureApi/aws/deleteVpc`, requestOptions).then(response  => this.handleEditItemResponse(response));
}

handleEditItemResponse(response, stateName) {
  return response.text().then(text => {
    const data = (text && JSON.parse(text) ? JSON.parse(text) : "");
    this.setState({
      sweetalert: false
    });

    if(!data.success){
      if(data && data.data && data.data && data.data[0] && data.data[0].Error && data.data[0].Error[0] && data.data[0].Error[0].Message && data.data[0].Error[0].Message[0]){
        toast.error(data.data[0].Error[0].Message[0]);  
      }
      else{
        toast.error("Unble to delete VPC"); 
      }
    }
    else {
      toast.success("Deleted VPC successfully!");
      
      this.userGroupChange(this.state.regionid);
    }

    this.setState({
      is_delete_item_inprogress: false
    });

  });
}
/*End: User Edit*/

hideAlert() {
this.setState({
    sweetalert: null
});
}

  render() { 
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <div className="row">
            <div className="col-lg-6">
              <h5 className="color">AWS IAM User Management</h5>
            </div>
            <div className="col-lg-6">
                <div className="text-right">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={this.addUserGroupModal}
                    > <i className="fas fa-users" /> Add IAM User Group
                    </button>
                    <button
                        className="btn btn-sm btn-primary ml-2"
                        onClick={this.addUserModal}
                    > <i className="fa fa-user" /> Add IAM User
                    </button>
                </div>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-lg-6">
                <div className="form-group row">
                    <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>IAM User Group</label>                
                    <div className="col-sm-9">
                          <select
                            className="form-control-vm"                                    
                            name="userGroup"
                            onChange={e => this.userGroupChange(e.target)}
                            >
                            <option selected="true" value="">All</option>
                            {this.state.usergroup_list && this.state.usergroup_list.length > 0 && this.state.usergroup_list.map((row, index) =>
                                <option value={row.GroupId}>
                                    {row.GroupName}
                                </option>
                            )}
                            </select>
                            { this.state.is_usergroup_list_loaded && 
                              <i className="fas fa-circle-notch icon-loading drp-loader-icon"></i>
                            }
                    </div>
                </div>
            </div>
          </div>
          
          <div className="fieldset-equal-heigh">
            <fieldset className="fieldset-wrapper large-popup-profile-fieldset fliedset-left-50">
                <legend className="fieldset-legend color">IAM User Group</legend>
                <div class="fieldset-child control-group">
                  <div className="col-md-12 mt-4">
                    {this.state.dataGroupList &&
                        <MDBDataTable
                        striped
                        hover
                        data={this.state.dataGroupList}
                        />
                    }
                    
                    {this.state.is_usergroup_list_loaded && <PageLoader />}
                  </div>
                </div>
            </fieldset>
            <fieldset className="fieldset-wrapper large-popup-profile-fieldset fliedset-right-50">
                <legend className="fieldset-legend color">IAM User Details</legend>
                <div class="fieldset-child control-group">
                  <div className="row mt-4">
                      <div className="col-md-12">                    
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
                                  confirmBtnText="Delete VPC"
                                  confirmBtnBsStyle="danger"
                                  cancelBtnBsStyle="default"
                                  title="Are you sure?"
                                  onConfirm={() => this.editHandle()}
                                  onCancel={this.hideAlert.bind(this)}
                              >
                              </SweetAlert>
                            }
                            
                          </React.Fragment>
                      </div>
                  </div>        
                </div>
            </fieldset>
          </div>

          <Modal
            isOpen={this.state.isAddUserGroupModelOpen}
            onRequestClose={this.closeAddUserGroupModal}
            >
                <h2 style={{color:'red'}}>
                    Add IAM User Group<a className="float-right" href="javascript:void(0);" onClick={this.closeAddUserGroupModal}><i className="fa fa-times" /></a>
                </h2>

                <div className="col-md-12">
                    <div className="panel panel-default" />
                    <form
                    name="addUserGroupFrom"
                    id="addUserGroupFrom"
                    method="post"
                    onSubmit={this.addUserGroup}
                    >
                    <div className="form-group position-relative">
                        <label htmlFor="name">IAM User Group<span className="star-mark">*</span></label>
                        <input
                        type="text"
                        className="form-control"
                        name="addUserGroupInput"
                        required                      
                        placeholder="Ex: AwsGroup1"
                        value={this.state.addUserGroupInput}
                        onChange={e => this.allowAlphaNumericChange(e.target)}
                        />
                    </div>
                    <div class="form-group pl-20">
                      <div class="d-inline-block">
                        <input type="checkbox" class="form-check-input cursor-pointer" id="add_read" name="add_read" />
                        <label class="form-check-label cursor-pointer" for="add_read">
                          Read Permission
                        </label>
                      </div>
                      <div class="d-inline-block ml-5">
                        <input type="checkbox" class="form-check-input cursor-pointer" id="add_write" name="add_write" />
                        <label class="form-check-label cursor-pointer" for="add_write">
                          Write Permission
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                        <button className="btn btn-sm btn-primary">
                          {this.state.is_add_usergroup_inprogress &&
                            <i className="fas fa-circle-notch icon-loading"></i>}
                          Submit</button>
                    </div>
                    </form>
                </div>
          </Modal>

          <Modal
            isOpen={this.state.isEditUserGroupModelOpen}
            onRequestClose={this.closeEditUserGroupModal}
            >
                <h2 style={{color:'red'}}>
                    Edit IAM User Group<a className="float-right" href="javascript:void(0);" onClick={this.closeEditUserGroupModal}><i className="fa fa-times" /></a>
                </h2>

                <div className="col-md-12">
                    <div className="panel panel-default" />
                    <form
                    name="editUserGroupFrom"
                    id="editUserGroupFrom"
                    method="post"
                    onSubmit={this.addUserGroup}
                    >
                    <div className="form-group position-relative">
                        <label htmlFor="name">IAM User Group<span className="star-mark">*</span></label>
                        <input
                        type="text"
                        className="form-control"
                        name="addUserGroupInput"
                        required                      
                        placeholder="Ex: AwsGroup1"
                        value={this.state.editUserGroupDetails.GroupName}
                        onChange={e => this.allowAlphaNumericChange(e.target)}
                        />
                    </div>
                    <div class="form-group pl-20">
                      <div class="d-inline-block">
                        <input type="checkbox" class="form-check-input cursor-pointer" id="add_read" name="add_read"
                        checked={this.state.editUserGroupDetails.Read ? true : false}
                        />
                        <label class="form-check-label cursor-pointer" for="add_read">
                          Read Permission
                        </label>
                      </div>
                      <div class="d-inline-block ml-5">
                        <input type="checkbox" class="form-check-input cursor-pointer" id="add_write" name="add_write"
                        checked={this.state.editUserGroupDetails.Write ? true : false}
                        />
                        <label class="form-check-label cursor-pointer" for="add_write">
                          Write Permission
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                        <button className="btn btn-sm btn-primary">
                          {this.state.is_add_usergroup_inprogress &&
                            <i className="fas fa-circle-notch icon-loading"></i>}
                          Submit</button>
                    </div>
                    </form>
                </div>
          </Modal>

          <Modal
          isOpen={this.state.isAddUserModelOpen}
          onRequestClose={this.closeAddUserModal}
          >
            <h2>
                IAM Add User <a className="float-right" href="javascript:void(0);" onClick={this.closeAddUserModal}><i className="fa fa-times" /></a>
            </h2>

            <div className="col-md-12">
                <div className="panel panel-default" />
                <form
                name="addUserFrom"
                id="addUserFrom"
                method="post"
                onSubmit={this.addUser}
                >
                <div className="form-group position-relative">
                    <label htmlFor="name">IAM User Group<span className="star-mark">*</span></label>
                    <select
                      className="form-control"                                    
                      name="groupName"
                      required
                      >
                      <option value="">--SELECT--</option>
                      {this.state.usergroup_list && this.state.usergroup_list.length > 0 && this.state.usergroup_list.map((row, index) =>
                          <option value={row.GroupName}>
                              {row.GroupName}
                          </option>
                      )}
                      </select>
                      { this.state.is_usergroup_list_loaded && 
                        <i className="fas fa-circle-notch icon-loading form-drp-loader-icon"></i>
                      }
                </div>
                <div className="form-group position-relative">
                    <label htmlFor="name">User Name<span className="star-mark">*</span></label>
                    <input
                    type="text"
                    className="form-control"
                    name="userName"
                    required                      
                    placeholder="Ex: User1"
                    value={this.state.userName}
                    onChange={e => this.allowAlphaNumericChange(e.target)}
                    />
                </div>
                <div className="form-group">
                    <button className="btn btn-sm btn-primary">
                      {this.state.is_add_user_inprogress &&
                        <i className="fas fa-circle-notch icon-loading"></i>}
                      Submit</button>
                </div>
                </form>
            </div>
          </Modal>

          <Modal
          isOpen={this.state.isEditUserModelOpen}
          onRequestClose={this.closeEditUserModal}
          >
            <h2>
                IAM Edit User <a className="float-right" href="javascript:void(0);" onClick={this.closeEditUserModal}><i className="fa fa-times" /></a>
            </h2>

            <div className="col-md-12">
                <div className="panel panel-default" />
                <form
                name="addUserFrom"
                id="addUserFrom"
                method="post"
                onSubmit={this.addUser}
                >
                <div className="form-group position-relative">
                    <label htmlFor="name">IAM User Group<span className="star-mark">*</span></label>
                    <select
                      className="form-control"                                    
                      name="groupName"
                      required
                      >
                      <option value="">--SELECT--</option>
                      {this.state.usergroup_list && this.state.usergroup_list.length > 0 && this.state.usergroup_list.map((row, index) =>
                          <option value={row.GroupName}>
                              {row.GroupName}
                          </option>
                      )}
                      </select>
                      { this.state.is_usergroup_list_loaded && 
                        <i className="fas fa-circle-notch icon-loading form-drp-loader-icon"></i>
                      }
                </div>
                <div className="form-group position-relative">
                    <label htmlFor="name">User Name<span className="star-mark">*</span></label>
                    <input
                    type="text"
                    className="form-control"
                    name="userName"
                    required                      
                    placeholder="Ex: User1"
                    value={this.state.editUserGroupDetails.UserName}
                    onChange={e => this.allowAlphaNumericChange(e.target)}
                    />
                </div>
                <div className="form-group">
                    <button className="btn btn-sm btn-primary">
                      {this.state.is_add_user_inprogress &&
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

const connected = connect(mapStateToProps)(AwsManageUsers);
export { connected as AwsManageUsers };