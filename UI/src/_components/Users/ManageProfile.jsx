import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import ReactHtmlParser from 'react-html-parser';
import PageLoader from '../PageLoader';
import { authHeader, decryptResponse } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';
import { MDBDataTable } from 'mdbreact';
import ReactTooltip from "react-tooltip";
import { commonFns } from "../../_helpers/common";

Modal.setAppElement("#app");
class ManageProfile extends React.Component {
  constructor(props) {
    super(props);
    let user = decryptResponse(localStorage.getItem("user"));

    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      usergroup_list: [],
      
      isCreateProfileModelOpen: false,
      isMenuListLoading: false,
      menuList: [],
      uniqueNumber: 0,

      isVmOperationsListLoading: false,
      vmOperationsList: [],
      uniqueVmOperationsNumber: 0,

      menuSelectedList: [],
      vmOperationsSelectedList: {},

      is_createProfile_inprogress: false,
      
      dataList: "",
      isDataListLoading: false,
      sweetalert: false,
      currentRowDeleteDetails: "",
    };

    this.closeCreateProfileModal = this.closeCreateProfileModal.bind(this);
  }

  componentDidMount() {
    this.getProfileList();
  }

/*Start: Profile List*/
  getProfileList(){
      this.setState({
        isDataListLoading: true,
        dataList: ""
      });

      const requestOptions = {
          method: 'GET',
          headers: { ...authHeader(), 'Content-Type': 'application/json' }
      };

      fetch(`${config.apiUrl}/secureApi/menus/getUserProfile/` + this.state.clientid, requestOptions).then(response  => this.handleDataListResponse(response));
  }

  handleDataListResponse(response) {
    return response.text().then(text => {
        
        let data = text && JSON.parse(text);
        
        if(data){
          let dataRowList = [];
          
          if(data && data.data){
            data = data.data;
            
            for(let i =0; i < data.length; i++){
              let newRow = {};
              newRow.profile_name = data[i].profile_name;
              newRow.edit = <div className="text-center"><a href="javascript:void(0);" 
              onClick={(e) => this.openUserProfileModal(e, data[i])}
              ><i class="fa fa-edit"></i> </a></div>;
              newRow.delete =  <div className="text-center"><button className="btn btn-sm btn-danger" onClick={() => this.deleteProfileTemplate(data[i])}><i className="fas fa-minus-circle"></i> Delete Profile Template</button></div>;

              dataRowList.push(newRow);
            }
          }

          let dataList = "";

          if(dataRowList.length > 0){
            dataList = {
              columns: [
                {
                    label: 'Profile Name',
                    field: 'profile_name'
                },
                {
                    label: '',
                    field: 'edit'
                },
                {
                    label: '',
                    field: 'delete'
                }
              ],
              rows: dataRowList
            }
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
/*End: Profile List*/

/*Start: Create Profile*/
  /*Start: Menu List*/
    getMenuList(){
      this.setState({
        isMenuListLoading: true,
        menuList: []
      });

      const requestOptions = {
          method: 'GET',
          headers: { ...authHeader(), 'Content-Type': 'application/json' }
      };

      fetch(`${config.apiUrl}/secureApi/menus/list`, requestOptions).then(response  => this.handleMenuListResponse(response));
    }

    insertChildUnderParentMenu(meunParentList, menuChildList){   
        for(let j =0; j < menuChildList.length; j++){
          if(menuChildList[j].parent_id == meunParentList.id){
            if(!meunParentList.child)
              meunParentList.child = [];

            if(this.state.menuSelectedList.length > 0 && this.state.menuSelectedList.indexOf(menuChildList[j].id) > -1){
              menuChildList[j].checked = true;
            }
            
            meunParentList.child.push(menuChildList[j]);
            if(menuChildList[j].has_child){
              meunParentList.child[meunParentList.child.length - 1] = this.insertChildUnderParentMenu(
                meunParentList.child[meunParentList.child.length - 1],
                menuChildList
                );
            }
          }
        }

      return meunParentList;
    }

    handleMenuListResponse(response) {
      return response.text().then(text => {
          let data = text && JSON.parse(text);
          
          let meunParentList = [];

          if(data && data.length > 0){
            let menuChildList = [];
            for(let i =0; i < data.length; i++){
              if(data[i].status){
                if(data[i].parent_id == 0){

                  if((this.state.menuSelectedList.length > 0 && this.state.menuSelectedList.indexOf(data[i].id) > -1)){
                    data[i].checked = true;
                  }

                  if(data[i].group_id == commonFns.vmOperations.Dashboard){
                    data[i].checked = true;
                    data[i].disabled = true;
                    if(this.state.menuSelectedList.indexOf(data[i].id) == -1){
                      this.state.menuSelectedList.push(data[i].id)
                      this.setState({
                        menuSelectedList: this.state.menuSelectedList
                      });
                    }
                  }

                  meunParentList.push(data[i]);
                }
                else{
                  menuChildList.push(data[i]);
                }
              }
            }

            for(let i =0; i < meunParentList.length; i++){
              if(meunParentList[i].has_child){
                meunParentList[i] = this.insertChildUnderParentMenu(meunParentList[i], menuChildList);
              }
            }
          }
          
          this.setState({
            menuList: meunParentList,
            isMenuListLoading: false
          })
      });
    }

    autoSelectChildMenus(item, checked){
      let menuSelectedList = this.state.menuSelectedList;

      if(item && item.child && item.child.length > 0){
        for(let i = 0; i < item.child.length; i++){
          item.child[i].checked = checked;


          if(checked){
            if(menuSelectedList.indexOf(item.child[i].id) == -1){
              menuSelectedList.push(item.child[i].id);
            }
          }
          else{
            var index = menuSelectedList.indexOf(item.child[i].id);
            if (index > -1) {
              menuSelectedList.splice(index, 1);
            }
          }

          if(item.child[i].child && item.child[i].child.length > 0)
            this.autoSelectChildMenus(item.child[i], checked);
        }
      }

      this.setState({
        menuSelectedList: menuSelectedList,
        menuList: this.state.menuList
      });
    }

    menuListChange(e, id, item, parent, superParent){
      let menuSelectedList = this.state.menuSelectedList;

      if(e.checked){
        item.checked = true;
        menuSelectedList.push(id);

        if(parent && menuSelectedList.indexOf(parent.id) == -1){
          menuSelectedList.push(parent.id);
          parent.checked = true;
        }

        if(superParent && menuSelectedList.indexOf(superParent.id) == -1){
          menuSelectedList.push(superParent.id);
          superParent.checked = true;
        }

        this.autoSelectChildMenus(item, item.checked);
      }
      else{
        item.checked = false;

        var index = menuSelectedList.indexOf(id);
        if (index > -1) {
          menuSelectedList.splice(index, 1);
        }

        this.autoSelectChildMenus(item, item.checked);
      }

      this.setState({
        menuSelectedList: menuSelectedList,
        menuList: this.state.menuList
      });
   }

  /*End: Menu List*/

  /*Start: VM Operations List*/
    getVMOperationsList(){
      this.setState({
        isVmOperationsListLoading: true,
        vmOperationsList: [],
      });

      const requestOptions = {
          method: 'GET',
          headers: { ...authHeader(), 'Content-Type': 'application/json' }
      };

      fetch(`${config.apiUrl}/secureApi/menus/vmOperationMenus`, requestOptions).then(response  => this.handleVMOperarionsListResponse(response));
    }
    
    handleVMOperarionsListResponse(response) {
      return response.text().then(text => {
          
          let data = text && JSON.parse(text);
          
          let operationsParentList = [];

          if(data && data.length > 0){
            let operationsChildList = [];
            
            for(let i =0; i < data.length; i++){
              if(data[i].status){
                if(data[i].parent_id == 0){
                  operationsParentList.push(data[i]);

                  let meunParentList = data[i];

                  let vmOperationsSelectedList = this.state.vmOperationsSelectedList;
                  
                  if(vmOperationsSelectedList && vmOperationsSelectedList[meunParentList.ref_id] && vmOperationsSelectedList[meunParentList.ref_id])
                    data[i].checked = true;
                }
                else{
                  operationsChildList.push(data[i]);
                }
              }
            }
            
            for(let i =0; i < operationsParentList.length; i++){
              if(operationsParentList[i].parent_id == 0){
                operationsParentList[i] = this.insertChildUnderParentOperations(operationsParentList[i], operationsChildList);
              }
            }
          }
          
          this.setState({
            vmOperationsList: operationsParentList,
            isVmOperationsListLoading: false
          })
      });
    }

    insertChildUnderParentOperations(meunParentList, menuChildList){   
      for(let j =0; j < menuChildList.length; j++){
        if(menuChildList[j].parent_id == meunParentList.id){
          if(!meunParentList.child)
            meunParentList.child = [];

          let vmOperationsSelectedList = this.state.vmOperationsSelectedList;
          if(vmOperationsSelectedList && vmOperationsSelectedList[meunParentList.ref_id] && vmOperationsSelectedList[meunParentList.ref_id].indexOf(menuChildList[j].ref_id) > -1)
            menuChildList[j].checked = true;

          meunParentList.child.push(menuChildList[j]);
        }
      }

      return meunParentList;
    }

    autoSelectVmOperations(checked, item){
      let vmOperationsSelectedList = this.state.vmOperationsSelectedList;
      let typeId = item.ref_id;

      if(item && item.child && item.child.length > 0){
        for(let i = 0; i < item.child.length; i++){
          item.child[i].checked = checked;


          if(checked){
            vmOperationsSelectedList[typeId].push(item.child[i].ref_id);
          }
          else{
            var index = (vmOperationsSelectedList[typeId] ? vmOperationsSelectedList[typeId].indexOf(item.child[i].ref_id) : -1);
            if (index > -1) {
              vmOperationsSelectedList[typeId].splice(index, 1);
            }    
          }

          if(item.child[i].child && item.child[i].child.length > 0)
          {
            this.autoSelectVmOperations(checked, item.child[i]);
          }
        }
      }

      this.setState({
        vmOperationsSelectedList: vmOperationsSelectedList,
        vmOperationsList: this.state.vmOperationsList
      });
    }
    
    vmOperationsListChange(e, vmRow, id, item){
      let vmOperationsSelectedList = this.state.vmOperationsSelectedList;
  
      let typeId = vmRow.ref_id;

      if(e.checked){
        if(!vmOperationsSelectedList[typeId])
          vmOperationsSelectedList[typeId] = [];
        
        if(id)
          vmOperationsSelectedList[typeId].push(id);
  
        vmRow.checked = true;

        if(item){
          item.checked = true;
        }
        else{
          this.autoSelectVmOperations(e.checked, vmRow);
        }
      }
      else{
        var index = (vmOperationsSelectedList[typeId] ? vmOperationsSelectedList[typeId].indexOf(id) : -1);
        if (index > -1) {
          vmOperationsSelectedList[typeId].splice(index, 1);
        } 
  
        if(item){
          item.checked = false;
        }
        else{
          vmRow.checked = false;
          this.autoSelectVmOperations(e.checked, vmRow);
        }
      }
  
      this.setState({
        vmOperationsSelectedList: vmOperationsSelectedList,
        vmOperationsList: this.state.vmOperationsList
      });
    }
  /*End: VM Operations List*/
/*End: Create Profile*/

/*Start: Delete Profile Template*/
  deleteProfileTemplate = (row) =>{    
    this.setState({
      sweetalert: true,
      currentRowDeleteDetails: row
    });
  }

  deleteProfileTemplateHandle(){
    let currentRowDeleteDetails = this.state.currentRowDeleteDetails;
    
    const requestOptions = {
      method: 'DELETE',
      headers: { ...authHeader(), 'Content-Type': 'application/json' }
    };

    $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);
    
    fetch(`${config.apiUrl}/secureApi/menus/deleteProfile/`+ currentRowDeleteDetails.profile_id, requestOptions).then(response  => this.handleDeleteResponse(response));
  }

  handleDeleteResponse(response, stateName) {
    return response.text().then(text => {

      const data = (text && JSON.parse(text) ? JSON.parse(text) : "");
      this.setState({
        sweetalert: false
      });

      if(data && data.message && data.message.toLowerCase().indexOf("success") > -1){
        toast.success("Profile Template has been Deleted Successfully!");

        this.hideAlert();

        setTimeout(() => {
          location.reload(true);
        }, 2000);
      }
      else {
        toast.error("Unable to Delete Profile Template !");
      }
    });
  }

  hideAlert() {
    this.setState({
        sweetalert: null
    });
  }
/*End: Delete Profile Template*/

  /*Start: Create User Profile Template*/
  updateProfileName(e){
    this.setState({
      profileTemplateName: e.value
    });
  }

  submitUserProfile = e => {
    e.preventDefault();    
    if(!this.state.profileTemplateName){
      toast.error("Please enter Profile Template Name");
      return;
    }

    if(this.state.menuSelectedList.length == 0 && Object.keys(this.state.vmOperationsSelectedList).length == 0){
      toast.error("Please select Menu List or VM Operations !");
      return;
    }

    if(this.state.menuSelectedList.length == 0 && Object.keys(this.state.vmOperationsSelectedList).length > 0){
      let totalSelectedCount = 0;
      let keys = Object.keys(this.state.vmOperationsSelectedList);
      for(let i = 0; i < keys.length; i++){
        if(this.state.vmOperationsSelectedList[keys[i]] && this.state.vmOperationsSelectedList[keys[i]].length > 0){
          totalSelectedCount++;
          break;
        }
      }
      if(totalSelectedCount == 0){
        toast.error("Please select Menu List or VM Operations !");
        return;
      }
    }

    let frmData = {
      client_id: this.state.clientid,
      profile_name: this.state.profileTemplateName,
      profile_menu_list: JSON.stringify(this.state.menuSelectedList),
      vm_operations: JSON.stringify(this.state.vmOperationsSelectedList),
      dashboard_permissions: "1",
      status: 1,
      is_admin_profile: "0"
    };

    if(this.state.profile_id){
      frmData.profile_id = this.state.profile_id;
    }

    this.setState({
      is_createProfile_inprogress: true
    });
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/menus/saveUserProfile`, requestOptions).then(response  => this.handleCreateProfileResponse(response));
  }

  handleCreateProfileResponse(response, stateName) {
    return response.text().then(data => {
      
      data = (data && JSON.parse(data) ? JSON.parse(data) : "");

      this.setState({
        is_createProfile_inprogress: false
      });

      if(data.success){
        toast.success(data.message ? data.message : "Profile has been Saved Successfully!");

        this.closeCreateProfileModal();

        setTimeout(() => {
          location.reload(true);
        }, 2000);
      }   
      else{
        toast.error(data.message ? data.message : "Unable to Create Profile, Please check inputs !");
      }
    });
  }

  openUserProfileModal = (e, data) => {
    this.getMenuList(data);
    this.getVMOperationsList(data);
    this.setState({ 
      profileMode: (data ? "Update" : "Create"),
      profileTemplateName: (data ? data.profile_name : ""),
      isCreateProfileModelOpen: true, 
      uniqueNumber: 0, 
      uniqueVmOperationsNumber: 0,
      menuSelectedList: (data && data.profile_menu_list ? JSON.parse(data.profile_menu_list) : []), 
      vmOperationsSelectedList: (data && data.vm_operations ? JSON.parse(data.vm_operations) : {}),
      profile_id: (data && data.profile_id ? data.profile_id: "")
    });
  }

  closeCreateProfileModal = () => {
      this.setState({ isCreateProfileModelOpen: false });        
  }

  /*End: Create User Profile Template*/

  render() { 
    var styleTagStringContent = 
    ".ReactModal__Body--open .ReactModal__Content {"+
       "width:90% !important"+
    "}";
    return (
      <div className="container-fluid main-body">
      <style type="text/css">
        {styleTagStringContent}
      </style>
        <div className="contentarea">
          <div className="row">
            <div className="col-lg-6">
              <h5 className="color">Manage Profile Template</h5>
            </div>
            <div className="col-lg-6">
                <div className="text-right">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={this.openUserProfileModal}
                    > <i className="fas fa-user" /> Create User Profile Template
                    </button>
                </div>
            </div>
          </div>
            
          <div className="row mt-4">
              <div className="col-md-12 mt-3">                    
                  <React.Fragment>
                    {this.state.dataList &&
                      <MDBDataTable
                      striped
                      hover
                      data={this.state.dataList}
                      />}

                    {this.state.isDataListLoading && <PageLoader />}

                    {!this.state.isDataListLoading && !this.state.dataList && 
                      <div className="text-error-message">No record found!</div>
                    }

                    {this.state.sweetalert &&
                      <SweetAlert
                          warning
                          showCancel
                          confirmBtnText="Delete Profile Template"
                          confirmBtnBsStyle="danger"
                          cancelBtnBsStyle="default"
                          title="Are you sure?"
                          onConfirm={() => this.deleteProfileTemplateHandle()}
                          onCancel={this.hideAlert.bind(this)}
                      >
                      </SweetAlert>
                    }
                    
                  </React.Fragment>
              </div>
          </div>
        
          <Modal
            isOpen={this.state.isCreateProfileModelOpen}
            onRequestClose={this.closeCreateProfileModal}
            >
                <h2 style={{color:'red'}}>
                    {this.state.profileMode} User Profile Template<a className="float-right" href="javascript:void(0);" onClick={this.closeCreateProfileModal}><i className="fa fa-times" /></a>
                </h2>

                <div className="col-md-12">
                    <div className="panel panel-default" />
                    <form
                    name="addUserGroupFrom"
                    id="addUserGroupFrom"
                    method="post"
                    onSubmit={this.submitUserProfile}
                    >
                    <div className="form-group float-right">
                        <button 
                        className={"btn btn-sm btn-primary " + (this.state.is_createProfile_inprogress ? "no-access" : "")} disabled={this.state.is_createProfile_inprogress ? true : false}
                        >
                          {this.state.is_createProfile_inprogress &&
                            <i className="fas fa-circle-notch icon-loading"></i>}
                          {this.state.profileMode} User Profile Template</button>
                    </div>

                    <div className="form-group float-left">
                        <label htmlFor="name">Profile Template Name<span className="star-mark">*</span></label>
                        <input
                        type="text"
                        className="form-control min-width300"
                        name="profileTemplateName"
                        id="profileTemplateName"
                        required                      
                        placeholder="Ex: AdminProfile"
                        value={this.state.profileTemplateName}
                        onChange={(e) => this.updateProfileName(e.target)}
                        />
                    </div>

                    <div className="fieldset-equal-heigh">
                      <fieldset className="fieldset-wrapper large-popup-profile-fieldset large-popup-profile-left">
                        <legend className="fieldset-legend color">Menu List</legend>
                        {this.state.isMenuListLoading && <PageLoader />}

                        {
                          this.state.menuList && this.state.menuList.length > 0 && this.state.menuList.map((menuItem, index) => (
                            (
                            (<div className="ml-3">
                              <div>
                                <input
                                onChange={e => this.menuListChange(e.target, menuItem.id, menuItem)}
                                checked={menuItem.checked ? true : false}
                                disabled={menuItem.disabled ? true : false} type="checkbox" class={"form-check-input cursor-pointer " + (menuItem.disabled ? "no-access-chk" : "")} id={"chk" + ++this.state.uniqueNumber}></input>
                                <label className="cursor-pointer" for={"chk" + this.state.uniqueNumber}>
                                  {"   " + menuItem.menu_name}
                                </label>
                              </div>
                              {
                                menuItem.child && menuItem.child.map((item, childIndex) => (
                                  <span className={item.child ? "d-block" : "dynamicmenu_level2"}>
                                    <div className={"ml-4 " + (item.child ? "d-block": "d-inline-block")}>
                                      <input 
                                      onChange={e => this.menuListChange(e.target, item.id, item, menuItem)}
                                      checked={item.checked ? true : false}
                                      type="checkbox" class="form-check-input cursor-pointer" id={"chk" + ++this.state.uniqueNumber}></input>
                                      <label className="cursor-pointer" for={"chk" + this.state.uniqueNumber}>
                                        {"   " + item.menu_name}
                                      </label>
                                    </div>
                                      {item.child && item.child.map((newitem, subChildIndex) => (
                                          <div className="dynamicmenu_level3">
                                            <input
                                            onChange={e => this.menuListChange(e.target, newitem.id, newitem, menuItem, item)}
                                            checked={newitem.checked ? true : false}
                                            type="checkbox" class="form-check-input cursor-pointer" id={"chk" + ++this.state.uniqueNumber}></input>
                                            <label className="cursor-pointer" for={"chk" + this.state.uniqueNumber}>
                                              {"   " + newitem.menu_name}
                                            </label>
                                          </div>
                                        ))
                                      }
                                  </span>
                                ))
                              }
                            </div>))
                          ))
                        }
                      </fieldset>
                      <fieldset className="fieldset-wrapper large-popup-profile-fieldset large-popup-profile-right">
                      <legend className="fieldset-legend color">VM Operations</legend>
                      {this.state.isVmOperationsListLoading && <PageLoader />}

                      {
                        this.state.vmOperationsList && this.state.vmOperationsList.length > 0 && this.state.vmOperationsList.map((VMCat, index) => (
                          (
                          (<div className="ml-3">
                            <div>
                              <input
                              checked={VMCat.checked ? true : false}
                              onChange={e => this.vmOperationsListChange(e.target, VMCat)}
                              type="checkbox" class="form-check-input cursor-pointer" id={"chk" + ++this.state.uniqueNumber}></input>
                              <label className="cursor-pointer" for={"chk" + this.state.uniqueNumber}>
                                {"   " + VMCat.vm_action_name}
                              </label>
                            </div>
                            {
                              VMCat.child && VMCat.child.map((item, childIndex) => (
                                <div className="ml-4">
                                  <input
                                  onChange={e => this.vmOperationsListChange(e.target, VMCat, item.ref_id, item)}
                                  checked={item.checked ? true : false}
                                  type="checkbox" class="form-check-input cursor-pointer" id={"chk" + ++this.state.uniqueNumber}></input>
                                  <label className="cursor-pointer" for={"chk" + this.state.uniqueNumber}>
                                    {"   " + item.vm_action_name}
                                  </label>
                                </div>
                              ))
                            }
                          </div>))
                        ))
                      }
                    </fieldset>
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
  const { azure } = state;
  return {
    azure
  };
}

const connected = connect(mapStateToProps)(ManageProfile);
export { connected as ManageProfile };