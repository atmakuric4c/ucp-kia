import React from 'react';
import { connect } from 'react-redux';
import { userActions, profileActions } from '../../_actions';
import Modal from "react-modal";
var serialize = require("form-serialize");
import DatatablePage from './usersGridview';
import PageLoader from '../PageLoader';
import {decryptResponse} from './../../_helpers';

const customStyles = {
  content: {
    
  }
};
Modal.setAppElement("#app");

class Users extends React.Component {
  constructor(props) {
    super(props); 
    let user = decryptResponse(localStorage.getItem("user"));

    this.state = {
        clientid:   user.data.clientid,
        user_role:  user.data.user_role,
        profiles: [],
        userDetails:[],
    }; 
  }
  componentDidMount() {
      this.props.dispatch(userActions.getAll(this.state.clientid)); 
      
      let params = { clientid: this.state.clientid }
      this.props.dispatch(profileActions.getProfileList(params));

  }

  render() {
    const { user, users, profiles } = this.props; 
    let profileList = profiles.profileList;
    // let profiles = this.props.profiles;                           
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          
          {/* <h5 className="color">User Management</h5> */}
          {!users.error && users.loading && <PageLoader/>}
          {users.error && <span className="text-danger">ERROR - {users.error}</span>}    
          {!users.loading && users.items && <DatatablePage items={users.items} profileList={profileList}/> }           
        </div>       
      </div>            
    );
  }
}

function mapStateToProps(state) {   
    const { users, authentication, profiles } = state;
    const { user } = authentication;    
    return {
        user,
        users,
        profiles
    };
}

const connectedUsers = connect(mapStateToProps)(Users);
export { connectedUsers as Users };