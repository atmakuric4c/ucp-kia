import React from 'react';
import { connect } from 'react-redux';
import { userActions } from '../../_actions';
import Modal from "react-modal";
var serialize = require("form-serialize");

const customStyles = {
  content: {
    
  }
};
Modal.setAppElement("#app");

class ResetPassword extends React.Component {
  constructor(props) {
    super(props); 
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      user : user,
      errorMsg : "",
      userPassword: '',
      userCPassword: ''           
    };
 
    
    
  }

    componentDidMount() {
        //this.props.dispatch(userActions.getAll(this.props.user.data.clientid));      
    }
    handlePassword = (event) => {
      this.setState({ userPassword : event.target.value});
      // if (this.state.userCPassword == this.state.userPassword && this.state.userCPassword != '' && this.state.userPassword != '') {
      //   this.setState({ updatePasswordFrmInvalid : false});
      //   this.setState({ errorMsg:""});
      // }else{
      //   this.setState({ updatePasswordFrmInvalid : true});
      //   this.setState({ errorMsg:"Passwords don't match"});
      // }
      // console.log("this.state.updatePasswordFrmInvalid === "+this.state.updatePasswordFrmInvalid);
    }

    handleCPassword = (event) => {
      this.setState({ userCPassword : event.target.value});
      // if (this.state.userCPassword == this.state.userPassword && this.state.userCPassword != '' && this.state.userPassword != '') {
      //   this.setState({ updatePasswordFrmInvalid : false});
      //   this.setState({ errorMsg:""});
      // }else{
      //   this.setState({ updatePasswordFrmInvalid : true});
      //   this.setState({ errorMsg:"Passwords don't match"});
      // }
      // console.log("this.state.updatePasswordFrmInvalid === "+this.state.updatePasswordFrmInvalid);
    }
   
    updatePasswordRequest = e => {
      e.preventDefault();      
      const { userPassword, userCPassword } = this.state;
      // perform all neccassary validations
      
      if(userPassword == ""){
        toast.error("Please enter Password");
        return false;
      }else if(userPassword.length < 8){
        toast.error("Password Must be at least 8 characters.");
        return;
			}else if(userPassword.length > 32){
        toast.error("Password Must not be greater than 32 characters.");
        return;
			}else if(!userPassword.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)){
        toast.error("Password Must be Contain Atleast one Small and one Capital letter");
        return;
			}else if(!userPassword.match(/([0-9])/)){
        toast.error("Password Must be Contain Atleast one number");
        return;
			}else if(!userPassword.match(/(.*[@,=,!,&,#,$,^,*,?,_,~,-])/)){
        toast.error("Password Must be Contain atleast one special character");
        return;
			}else if(userPassword.match(/(.*[.,()%])/)){
        toast.error(".,()% These Special characters are not allowed.");
        return;
      }
      else if (userPassword !== userCPassword) {
        toast.error("Password and Confirm Password don't match");
        return;
      }else {
        this.setState({ errorMsg:""});
        // make API call  
        var form = document.querySelector("#updatePasswordFrm");
        var formData = serialize(form, { hash: true });
        this.props.dispatch(userActions.resetPasswordRequest(formData)); 
      }
      
    };
    
   
    render() {
        const { user} = this.props;                   
        
        return (
          <div className="container-fluid main-body">
          <div className="contentarea">
          <div className="login">
                <div className="login-header">
                  <h2 className="m-0">Reset Password</h2>
                </div>
             <div className="login-body">
                <form
                  name="updatePasswordFrm"
                  id="updatePasswordFrm"
                  method="post"
                  onSubmit={this.updatePasswordRequest}
                >
                  <div className="form-group">
                    <label htmlFor="userPassword">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      name="userPassword"
                      required                     
                      placeholder="New Password"
                      onChange={event => this.handlePassword(event)}   
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="userCPassword">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      name="userCPassword"
                      required
                      placeholder="Confirm Password"
                      onChange={event => this.handleCPassword(event)}   
                    />                    
                    <div className='error'>
                      {this.state.errorMsg}
                    </div>
                  </div>             
                  <div className="form-group">
                    <input type="hidden" name="user_id" value={this.state.user.data.id} />
                    <button className="btn btn-success" >Submit</button>
                  </div>
                </form>
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

const connectedUsers = connect(mapStateToProps)(ResetPassword);
export { connectedUsers as ResetPassword };