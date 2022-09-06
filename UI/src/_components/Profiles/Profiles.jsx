import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { profileActions, commonActions } from '../../_actions';
import Modal from "react-modal";
var serialize = require("form-serialize");

const customStyles = {
  content: {
    
  }
};

Modal.setAppElement("#app");

class Profiles extends React.Component {
  constructor(props) {
    super(props); 
    let user = JSON.parse(localStorage.getItem("user"));   
    this.state = {
        clientid:   user.data.clientid,
        user_role:  user.data.user_role,
        modalIsOpen: false,
        modalIsOpenEditprofile: false,
        profiles: [],
        profileDetails:[],
        common:[]        
    };
 
    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);

    this.openModalEditprofile = this.openModalEditprofile.bind(this);
    this.afterOpenModalEditprofile = this.afterOpenModalEditprofile.bind(this);
    this.closeModalEditprofile = this.closeModalEditprofile.bind(this);
    
  }

  openModal() { 
    this.props.dispatch(commonActions.getAllMenus());    
    this.setState({ modalIsOpen: true });
  }

  afterOpenModal() {       
    //this.subtitle.style.color = "#f00";
  }

  closeModal() {    
    this.setState({ modalIsOpen: false });        
  }

  openModalEditprofile(profile) { 
    this.props.dispatch(commonActions.getAllMenus());
    this.setState({profileDetails: profile});
    this.setState({ modalIsOpenEditprofile: true });
  }

  afterOpenModalEditprofile() {       
    //this.subtitle.style.color = "#f00";
  }

  closeModalEditprofile() {
    this.setState({ modalIsOpenEditprofile: false });
  }
 
  addProfileRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#addProfile");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(profileActions.addProfile(formData));
    this.setState({ modalIsOpen: false });
    this.props.dispatch(profileActions.getAll());      
  };

  editProfileRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#editProfile");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(profileActions.editProfile(formData));
    this.setState({ modalIsOpenEditprofile: false });
    this.props.dispatch(profileActions.getAll());     
  };
    componentDidMount() {
        this.props.dispatch(profileActions.getAll());
    }

    handleDeleteProfile(id) {
        return (e) => this.props.dispatch(profileActions.delete(id));
    }
  
    render() {
        const { profiles } = this.props;        
        let common = this.props.common;          
        return (
          <div className="container-fluid main-body">
          <div className="contentarea">
            <h2>Profile Management</h2>
            <div className="text-right">
              <button
                className="btn btn-success"
                onClick={this.openModal}
              >
                <i className="fa fa-plus" /> Add Profile
              </button>
            </div>   
                {profiles.loading && <PageLoader/>}
                {profiles.error && <span className="text-danger">ERROR - {profiles.error}</span>}
                {profiles.items &&
                    <div className="table-responsive">
                    <table className="table table-bordered table-hover" id="profiles">
                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Profile Name</th>
                          <th>Status</th>
                          <th>Action</th>                         
                        </tr>
                      </thead>
                      <tbody>  
                        {profiles.items.map((profile, index) =>                            
                            <tr key={index}>
                            <td>{index+1}</td>
                            <td>{profile.profile_name} </td>
                            <td>{profile.status} </td>
                            <td><div>
                            <a href="javascript:void(0);" onClick={() => this.openModalEditprofile(profile)}><i className="fa fa-edit"></i> </a> 
                                </div>
                            </td>                           
                          </tr>
                        )}                         
                      </tbody>
                     </table>
                     </div>                    
                }
                </div>
            <Modal
              isOpen={this.state.modalIsOpen}
              onAfterOpen={this.afterOpenModal}
              onRequestClose={this.closeModal}              
              contentLabel="Add Profile"
            >
              <h2 style={{color:'red'}}>
                Add Profile <a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
              </h2>

              <div className="col-md-12">
                <div className="panel panel-default" />
                <form
                  name="addProfile"
                  id="addProfile"
                  method="post"
                  onSubmit={this.addProfileRequest}
                >
                  <div className="form-group">
                    <label htmlFor="profileName">Profile Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="profileName"
                      required                      
                      placeholder="Enter Profile Name"
                    />
                  </div>               
                                    
                  <div className="form-group">
                    <label htmlFor="menuList">Profile Menu Permissions </label>
                    {common.data && 
                     <div className="checkbox" >
                     {common.data.map((menu, index) =>                    
                         <span key={index}><input type="checkbox" name="menuList[]" value={menu.id} />{menu.menu_name}&nbsp;&nbsp;</span>        
                      )}
                    </div>
                    }
                  </div>                  
                                   
                  <div className="form-group">                    
                    <button className="btn btn-success">Submit</button>
                  </div>
                </form>
              </div>
            </Modal>

            <Modal
              isOpen={this.state.modalIsOpenEditprofile}
              onAfterOpen={this.afterOpenModalEditprofile}
              onRequestClose={this.closeModalEditprofile}             
              contentLabel="Edit Profile Modal"
            >
              <h2 style={{color:'red'}}>
                Edit Profile <a className="float-right" href="javascript:void(0);" onClick={this.closeModalEditprofile}><i className="fa fa-times" /></a>
              </h2>

              <div className="col-md-12">
                <div className="panel panel-default" />
                <form
                  name="editProfile"
                  id="editProfile"
                  method="post"
                  onSubmit={this.editProfileRequest}
                >
                  <div className="form-group">
                    <label htmlFor="editprofileName">Profile Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="editprofileName"
                      required
                      defaultValue={this.state.profileDetails.profile_name}                     
                      placeholder="Enter Profile Name"
                    />
                  </div>               
                                    
                  <div className="form-group">
                    <label htmlFor="editmenuList">Profile Menu Permissions </label>
                    {common.data && 
                     <div className="checkbox">
                     {common.data.map((menu, index) =>                    
                         <span key={index}>                                                
                         {this.state.profileDetails.profile_menu_list && this.state.profileDetails.profile_menu_list.indexOf('"'+menu.id+'"') != -1 ? (
                            <input type="checkbox" name="editmenuList[]" defaultChecked={menu.id}  value={menu.id} />
                          ) : (
                            <input type="checkbox" name="editmenuList[]" value={menu.id} />
                          )}                      
                         
                         {menu.menu_name}&nbsp;&nbsp;</span>        
                      )}
                    </div>
                    }
                  </div>                  
                                   
                  <div className="form-group"> 
                  <input type="hidden" name="id" value={this.state.profileDetails.profile_id} />                   
                    <button className="btn btn-success">Update</button>
                  </div>
                </form>
              </div>
            </Modal>
          </div>
        );
    }
}

function mapStateToProps(state) {
    const { profiles, authentication, common } = state;
    const { profile } = authentication;
    return {
        profile,
        profiles,
        common
    };
}

const connectedProfiles = connect(mapStateToProps)(Profiles);
export { connectedProfiles as Profiles };