import React from 'react';
import { connect } from 'react-redux';
import { ApprovalMatrixActions } from './ApprovalMatrix.actions';
import Modal from "react-modal";
var serialize = require("form-serialize");
import ApprovalMatrixDataTablePage from './ApprovalMatrixGridview';
import PageLoader from '../PageLoader';
import {decryptResponse} from './../../_helpers';

const customStyles = {
  content: {
    
  }
};
Modal.setAppElement("#app");

class ApprovalMatrix extends React.Component {
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
      this.props.dispatch(ApprovalMatrixActions.getAll({})); 
  }

  render() {
    const { ApprovalMatrices } = this.props; 
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          
          {/* <h5 className="color">User Management</h5> */}
          {!ApprovalMatrices.error && ApprovalMatrices.loading && <PageLoader/>}
          {ApprovalMatrices.error && <span className="text-danger">ERROR - {ApprovalMatrices.error}</span>}
          {!ApprovalMatrices.loading && ApprovalMatrices.data && <ApprovalMatrixDataTablePage data={ApprovalMatrices.data} /> }
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

const connectedApprovalMatrix = connect(mapStateToProps)(ApprovalMatrix);
export { connectedApprovalMatrix as ApprovalMatrix };