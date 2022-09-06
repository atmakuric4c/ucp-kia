import React, {Fragment} from 'react';
import { connect, router } from 'react-redux';
import { profileActions } from '../../_actions';
import { menuActions } from '../../_actions';
import Modal from "react-modal";
import ProfileListDatatablePage from './profileListGridView';
import PageLoader from '../PageLoader';
import { Redirect, Router } from 'react-router';
import ProfileAddModal from './profileAddModal';
import ProfileUpdateModal from './profileUpdateModal';

Modal.setAppElement("#app");
class ProfileList extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      pgiData : [],
      action: null,
      name: null,
      description: null,
      region: null,
      name: null,
      menu_list: [],
      current_profile_id: null,
      current_menu_list: [],
      current_vm_operation_list: [],
      current_name: null,
      delete_profile: null,
      vm_operation_list: []
    };

    this.handleAddProfileModalOpen = this.handleAddProfileModalOpen.bind(this)
    this.handleAddProfileModalClose = this.handleAddProfileModalClose.bind(this)
    this.addProfileChangeHandler = this.addProfileChangeHandler.bind(this)
    this.addProfileMenuChangeHandler = this.addProfileMenuChangeHandler.bind(this)
    this.addProfileSubmitHandler = this.addProfileSubmitHandler.bind(this)
    this.addProfileVMOperationChangeHandler = this.addProfileVMOperationChangeHandler.bind(this)

    this.handleUpdateProfileModalOpen = this.handleUpdateProfileModalOpen.bind(this)
    this.handleUpdateProfileModalClose = this.handleUpdateProfileModalClose.bind(this)
    this.updateProfileChangeHandler = this.updateProfileChangeHandler.bind(this)
    this.updateProfileMenuChangeHandler = this.updateProfileMenuChangeHandler.bind(this)
    this.updateProfileVMOperationChangeHandler = this.updateProfileVMOperationChangeHandler.bind(this)
    this.updateProfileSubmitHandler = this.updateProfileSubmitHandler.bind(this)
    this.handleDelete = this.handleDelete.bind(this)
  }


  handleAddProfileModalOpen() {
    this.props.dispatch(profileActions.updateAddProfileModal(true));
  }


  handleAddProfileModalClose(e) {
    e.preventDefault();
    this.props.dispatch(profileActions.updateAddProfileModal(false));
  }

  addProfileChangeHandler(event) {
    this.setState({[event.target.name]: event.target.value});
  }

  addProfileMenuChangeHandler(event) {
    let menu = this.state.menu_list;
    if(event.target.checked){
      if(!menu.includes(parseInt(event.target.value))) 
        this.setState({menu_list: [...menu,parseInt(event.target.value)]});
    }
    else{
      this.setState({menu_list: menu.filter(item => item !== parseInt(event.target.value))})
    }
  }

  addProfileVMOperationChangeHandler(event) {
    let vm_operation = this.state.vm_operation_list;
    if(event.target.checked){
      if(!vm_operation.includes(parseInt(event.target.value))) 
        this.setState({vm_operation_list: [...vm_operation,parseInt(event.target.value)]});
    }
    else{
      this.setState({vm_operation_list: vm_operation.filter(item => item !== parseInt(event.target.value))})
    }
  }

  addProfileSubmitHandler(event) {

    event.preventDefault();
    let addProfileParams = {
      profile_name: this.state.name,
      menu_list: this.state.menu_list.sort(),
      vm_operations: this.state.vm_operation_list.sort(),
    }
    this.props.dispatch(profileActions.addProfile(addProfileParams));
  }


  handleUpdateProfileModalOpen(profile_id, current_name, current_menu_list, current_vm_operation_list) {
    this.setState({current_profile_id: profile_id})
    this.setState({current_name: current_name})

    let current_list = current_menu_list.filter(element => {
      return this.props.menus.menuList.data.some(elementInner => {
          return elementInner['id'] == element
      }) 
    });

    let current_vm_list = current_vm_operation_list.filter(element => {
      return this.props.profiles.vmOperationList.data.some(elementInner => {
          return elementInner['id'] == element
      }) 
    });

    this.setState({current_menu_list: current_list})
    this.setState({current_vm_operation_list: current_vm_list})

    this.props.dispatch(profileActions.updateEditProfileModal(true));
  }


  handleUpdateProfileModalClose(e) {
    e.preventDefault();
    this.props.dispatch(profileActions.updateEditProfileModal(false));
  }

  updateProfileChangeHandler(event) {
    this.setState({[event.target.name]: event.target.value});
  }

  updateProfileMenuChangeHandler(event) {
    let menu = this.state.current_menu_list;
    if(event.target.checked){
      if(!menu.includes(parseInt(event.target.value)))
        this.setState({current_menu_list: [...menu, parseInt(event.target.value)]});
    }
    else{
      this.setState({current_menu_list: menu.filter(item => item !== parseInt(event.target.value))})
    }
  }

  updateProfileVMOperationChangeHandler(event) {
    let vm_operation = this.state.current_vm_operation_list;
    if(event.target.checked){
      if(!vm_operation.includes(parseInt(event.target.value)))
        this.setState({current_vm_operation_list: [...vm_operation, parseInt(event.target.value)]});
    }
    else{
      this.setState({current_vm_operation_list: vm_operation.filter(item => item !== parseInt(event.target.value))})
    }
  }

  updateProfileSubmitHandler(event) {

    event.preventDefault();
    let updateProfileParams = {
      profile_id: this.state.current_profile_id,
      body: {
        profile_name: this.state.current_name,
        menu_list: this.state.current_menu_list.sort(),
        vm_operations: this.state.current_vm_operation_list.sort(),
      }
    }
    this.props.dispatch(profileActions.updateProfile(updateProfileParams));
  }

  handleDelete(profile_id){
    this.setState({delete_profile: profile_id})
    this.props.dispatch(profileActions.deleteProfile({profile_id: profile_id}));
  }

  componentDidMount() {
    //if(!this.props.awsDevops || !this.props.awsDevops.awsRepoList){
        let params = { clientid: this.state.clientid }
        this.props.dispatch(profileActions.getProfileList(params));
    //}
        this.props.dispatch(menuActions.getMenuList(params));
        this.props.dispatch(profileActions.getVMOperationList(params));
  }

  render() { 

    const { profiles, menus } = this.props;
    let profileList = profiles.profileList;
    let menuList = menus.menuList;
    let vmOperationList = profiles.vmOperationList;

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">Profile List</h5>
          <div className="text-right">
              <button
                  className="btn btn-sm btn-primary mr-3"
                  onClick={this.handleAddProfileModalOpen}
              > <i className="fa fa-plus" /> Create Profile
              </button>
          </div>
          <br></br>
          {profiles.showAddProfileModal && <ProfileAddModal  
              menuList={menuList}
              vmOperationList={vmOperationList}
              handleAddProfileModalClose={this.handleAddProfileModalClose}
              addProfileChangeHandler={this.addProfileChangeHandler}
              addProfileMenuChangeHandler={this.addProfileMenuChangeHandler}
              addProfileVMOperationChangeHandler={this.addProfileVMOperationChangeHandler}
              addProfileSubmitHandler={this.addProfileSubmitHandler}>
          </ProfileAddModal>}
          {profiles.showUpdateProfileModal && <ProfileUpdateModal
              current_name={this.state.current_name}
              current_profile_id={this.state.current_profile_id}
              current_menu_list={this.state.current_menu_list} 
              current_vm_operation_list={this.state.current_vm_operation_list}  
              menuList={menuList}
              vmOperationList={vmOperationList}
              handleUpdateProfileModalClose={this.handleUpdateProfileModalClose}
              updateProfileChangeHandler={this.updateProfileChangeHandler}
              updateProfileMenuChangeHandler={this.updateProfileMenuChangeHandler}
              updateProfileVMOperationChangeHandler={this.updateProfileVMOperationChangeHandler}
              updateProfileSubmitHandler={this.updateProfileSubmitHandler}>
          </ProfileUpdateModal>}
          {profiles && !profiles.error && profiles.loading && <PageLoader/>}
          {profiles && profiles.error && <span className="text-danger">ERROR - {profiles.error}</span>}
          {profileList && <ProfileListDatatablePage 
          handleDelete={this.handleDelete} 
          delete_profile={this.state.delete_profile}
          loadingDeleteProfile={this.props.profiles.loadingDeleteProfile}
          handleUpdateProfileModalOpen={this.handleUpdateProfileModalOpen}
          profileList={profileList}/>}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { profiles, menus } = state;
  return {
    profiles,
    menus
  };
}

const connected = connect(mapStateToProps)(ProfileList);
export { connected as ProfileList };