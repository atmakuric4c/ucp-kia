import React from 'react';
import { connect } from 'react-redux';
import { userActions } from '../../_actions';

var serialize = require("form-serialize");

const customStyles = {
  content: {
    
  }
};


class MyProfile extends React.Component {
  constructor(props) {
    super(props); 
    let user = JSON.parse(localStorage.getItem("user"));
    console.log(user)
    this.state = {
      user : user,
      errorMsg : ""     
    };
  }

  componentDidMount() {
      //this.props.dispatch(userActions.getAll(this.props.user.data.clientid));      
  }
    
    render() {
        const { user} = this.props;     
        console.log(user)              
        return (
          <div className="container-fluid main-body">
          <div className="contentarea">
          <h2>Profile Information</h2>
          <div className="table-responsive">
          <div className="col-md-8">
            <table className="table table-bordered table-hover" id="vm_detail">
              <tbody>
                  <tr>
                    <th>User Name:</th><td>{this.state.user.data.display_name}</td>
                    <th>User Email:</th><td>{this.state.user.data.email}</td>
                  </tr>
                  <tr>
                    <th>Company Name:</th><td>{this.state.user.data.company_name}</td>
                    <th>Address:</th><td>{this.state.user.data.address}</td>
                  </tr>
                  <tr>
                    <th>User Mobile:</th><td>{this.state.user.data.mobile}</td>
                    <th>User Role:</th><td>{this.state.user.data.user_role==1?'User':'Admin'}</td>
                  </tr>

                </tbody>
              </table>  
            </div> 
            </div> 
        </div>   
        </div>            
          
        );
    }
}

function mapStateToProps(state) {   
    const { user } = state.authentication;    
    return {
        user
    };
}

const connectedUsers = connect(mapStateToProps)(MyProfile);
export { connectedUsers as MyProfile };