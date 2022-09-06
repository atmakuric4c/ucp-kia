import React from 'react';
import { connect } from 'react-redux';
import { userActions } from '../../_actions';
import Modal from "react-modal";
import { toast } from 'react-toastify';
var serialize = require("form-serialize");
import { validation } from "../../_helpers/passwordPolicy";
import { authHeader } from '../../_helpers';
import config from 'config';
import ReactTooltip from "react-tooltip";

const customStyles = {
  content: {
    
  }
};
Modal.setAppElement("#app");

class ChangePassword extends React.Component {
  constructor(props) {
    super(props); 
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      user : user,
      errorMsg : "",
      userPassword: '',
      userCPassword: '',
      oldPassword: '',
      changePswdInprogress: false          
    };
  }

    componentDidMount() {
        //this.props.dispatch(userActions.getAll(this.props.user.data.clientid));      
    }

    handleOldPassword = (event) => {
      this.setState({ oldPassword : event.target.value});
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
   
    changePasswordRequest = e => {
      e.preventDefault();      
      const { userPassword, userCPassword, oldPassword } = this.state;
      console.log(userPassword + userCPassword+" length == "+userPassword.length+" "+(userPassword.length < 8));
      // perform all neccassary validations
      if(!oldPassword){
        toast.error("Please enter Old Password");
        return false;
      }
      
      let validatPasswordPoliy = validation.c4cCheckPasswordPolicy(
        userPassword,
        "",
        "",
        "",
        "",
        "",
        "",
        ["ucp"]);

      if(!validatPasswordPoliy[0]){
          toast.error(validatPasswordPoliy[1]);
          return false;
      }
      else if(!userCPassword){
        toast.error("Please enter Confirm Password");
        return false;
      }
      else if (userPassword !== userCPassword) {
        toast.error("Password and Confirm Password don't match");
        return false;
      }else {
        this.setState({ errorMsg:""});
        // make API call  
        var form = document.querySelector("#changePasswordFrm");
        var formData = serialize(form, { hash: true });
        this.setState({
          changePswdInprogress: true
        });
        
        //this.props.dispatch(userActions.changePasswordRequest(formData)); 
        
        const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        };

        fetch(`${config.apiUrl}/secureApi/users/changePassword`, requestOptions).then(response  => this.handleChangePasswordResponse(response));
      }      
    };
  
    handleChangePasswordResponse(response) {
      return response.text().then(text => {
          debugger;
          const resdata = text && JSON.parse(text);
          if(resdata.status == "error"){

            toast.error(resdata.message);
          } else {          
            toast.success(resdata.message);
            setTimeout(function() {
              location.reload();
            }, 2000);
          }

          this.setState({
            changePswdInprogress: false
          })
      });
    }

    render() {
        const { user} = this.props;       
        
        console.log(this.props);
        
        return (
          <div className="change_pswd_wrapper skip-propagation-change-pswd">
                  <form
                    name="changePasswordFrm"
                    id="changePasswordFrm"
                    method="post"
                    onSubmit={this.changePasswordRequest}
                    className="skip-propagation-change-pswd">
                    <div className="form-group skip-propagation-change-pswd">
                    
                      <input
                        type="password"
                        className="change-pswd-from-contrl form-control mb-2 skip-propagation-change-pswd"
                        name="oldPassword"
                        placeholder="Old Password" 
                        onChange={event => this.handleOldPassword(event)}   
                      />
                    </div>
                    <div className="form-group skip-propagation-change-pswd position-relative">
                      <input
                        type="password"
                        className="change-pswd-from-contrl form-control mb-2 skip-propagation-change-pswd"
                        name="userPassword"
                        placeholder="New Password"
                        onChange={event => this.handlePassword(event)}   
                      />
                      <i data-tip data-for="password_policy_hints" className="fa fa-info-circle txt-info-blue-icon position-top-5px" aria-hidden="true"></i>
                      <ReactTooltip id="password_policy_hints" place="left" effect="solid">
                          <div className="password-policy-hints-wrapper pt-110px pl-4 pt-1">
                              <div className="position-relative mb-10px mt-1">
                                  <strong className="rounded-bullet-point-back-white">1</strong> 
                                  Password must contain <strong>min 14</strong> characters and <strong>max 32</strong> characters
                              </div>
                              <div className="position-relative mb-10px mt-1">
                                  <strong className="rounded-bullet-point-back-white">2</strong> 
                                  Password must contain atleast <strong>3 alphabet characters</strong>
                              </div>
                              <div className="position-relative mb-10px mt-1">
                                  <strong className="rounded-bullet-point-back-white">3</strong> 
                                  Password must contain atleast <strong>one Small & Capital letter</strong> and <strong>one Number & special character</strong>
                              </div>
                              <div className="position-relative mb-10px mt-1">
                                  <strong className="rounded-bullet-point-back-white">4</strong> 
                                  <strong>Space and . , ( ) %</strong> these special characters are <strong>not allowed</strong> in Password
                              </div>
                              <div className="position-relative mb-10px mt-1">
                                  <strong className="rounded-bullet-point-back-white">5</strong> 
                                  Password must not contain more than 2 sequential repeated characters. eg: sm<strong>aaaa</strong>rr<strong>tttt</strong>, universa<strong>llll</strong>
                              </div>
                              <div className="position-relative mb-10px mt-1">
                                  <strong className="rounded-bullet-point-back-white">6</strong> 
                                  Password must not contain more than 2 sequential numbers and reverse numbers. eg: smart<strong>123456</strong>, smart<strong>654321</strong>
                              </div>
                              <div className="position-relative mb-10px mt-1">
                                  <strong className="rounded-bullet-point-back-white">7</strong> 
                                  Password must not contain more than 2 sequential alphabets and reverse alphabets. eg: smart<strong>abcdef</strong>, smart<strong>fedcba</strong>
                              </div>
                              <div className="position-relative mb-10px mt-1">
                                  <strong className="rounded-bullet-point-back-white">8</strong>
                                  Password must not contain any common words like <strong>cloud4c, c4c, ctrls, ucp, myshift, welcome, password, admin and user name/mobile number</strong> and must not contain reverse of any common words also
                              </div>
                          </div>
                      </ReactTooltip>
                    </div>
                    <div className="form-group skip-propagation-change-pswd">
                     
                      <input
                        type="password"
                        className="change-pswd-from-contrl form-control mb-2 skip-propagation-change-pswd"
                        name="userCPassword"
                        placeholder="Confirm Password"
                        onChange={event => this.handleCPassword(event)}   
                      />                    
                      <div className='error skip-propagation-change-pswd'>
                        {this.state.errorMsg}
                      </div>
                    </div>             
                    <div className="form-group m-0 skip-propagation-change-pswd">
                      <input type="hidden" name="user_id" value={this.state.user.data.id} />
                      <button 
                      className={"btn btn-sm btn-primary float-right skip-propagation-change-pswd " + (this.state.changePswdInprogress ? "no-access" : "")} disabled={this.state.changePswdInprogress ? true : false}
                      >
                        {this.state.changePswdInprogress && <i className="fas fa-circle-notch icon-loading"></i> }
                        Submit</button>
                    </div>
                  </form>
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

const connectedUsers = connect(mapStateToProps)(ChangePassword);
export { connectedUsers as ChangePassword };