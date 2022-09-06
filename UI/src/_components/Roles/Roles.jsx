import React from 'react';
import { connect } from 'react-redux';
import { ApprovalMatrixActions } from './Roles.actions';
import Modal from "react-modal";
import RoleDataTablePage from './RolesGridview';
import PageLoader from '../PageLoader';
import {decryptResponse} from './../../_helpers';

const customStyles = {
  content: {
    
  }
};
Modal.setAppElement("#app");

class Roles extends React.Component {
  constructor(props) {
    super(props); 
    let user = decryptResponse( localStorage.getItem("user"));

    this.state = {
        clientid:   user.data.clientid,
        user_role:  user.data.user_role,
        profiles: [],
        userDetails:[],
    }; 
  }
  componentDidMount() {
//      this.props.dispatch(ApprovalMatrixActions.getAll({})); 
  }

  render() {
    const { ApprovalMatrices } = this.props; 
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          
          {/* <h5 className="color">User Management</h5> */}
          {!ApprovalMatrices.error && ApprovalMatrices.loading && <PageLoader/>}
          {ApprovalMatrices.error && <span className="text-danger">ERROR - {ApprovalMatrices.error}</span>}
          {/* !ApprovalMatrices.loading && ApprovalMatrices.data && <RoleDataTablePage data={ApprovalMatrices.data} /> */ }
          <RoleDataTablePage />
        </div>       
      </div>            
    );
  }
}

function mapStateToProps(state) {   
    const { ApprovalMatrices } = state;
    return {
    	ApprovalMatrices
    };
}

const connectedApprovalMatrix = connect(mapStateToProps)(Roles);
export { connectedApprovalMatrix as Roles };