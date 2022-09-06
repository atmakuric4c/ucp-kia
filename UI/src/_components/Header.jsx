import React from 'react';
import { connect } from 'react-redux';
import { Link, BrowserRouter as Router, Route } from "react-router-dom";
import { ChangePassword } from './Users/ChangePassword';
import { userService } from "../_services/user.service";
import { history } from "../_helpers";
import { userConstants } from "../_constants/user.constants";
import AutoSessionOut from "../_services/AutoSessionOut";
import { authHeader, encryptRequest, decryptResponse } from '../_helpers';
import config from 'config';
import { toast } from 'react-toastify';
import ReactTooltip from "react-tooltip";
import Modal from "react-modal";

class Header extends React.Component {
  constructor(props) {
    super(props); 
    let user = decryptResponse(localStorage.getItem("user")), showVersion;

    showVersion = localStorage.getItem("showVersion");
    
    this.state = {
      user : user,
      user_role: user.data.user_role,
      viewUserDetails: false,
      changePswd: false,      
      userPassword: '',
      userCPassword: '',
      context: this,
      showHeaderNotification: false,//(showVersion == "1" ? false : true),
      isAzureProfileEditMode: false,
      isAwsProfileEditMode: false,
      isGcpProfileEditMode: false,
      azure_tenantid: "",
      azure_clientid: "",
      azure_clientsecretkey: "",
      aws_username: "",
      aws_accesskey: "",
      aws_secretekey: "",
      gcp_client_id: "",
      gcp_client_secret_key: "",
      showAzureSecretKey: false,
      updateAzureProfileDetailsInProgress: false,
      showAwsSecretKey: false,
      updateAwsProfileDetailsInProgress: false,
      showGcpSecretKey: false,
      updateGcpProfileDetailsInProgress: false
    };

    if(window.location.href.indexOf("?gcpStatus=") != -1){

      let status = window.location.href.split("gcpStatus=")[1];

      if(status && status.toLowerCase() == "error"){
        window.history.pushState('Customer Portal', 'Title', window.location.href.replace('?gcpStatus=error', ''));
    
        this.state.isGcpProfileEditMode = true;
        this.state.gcp_client_id = this.state.user.data.backup_gcp_client_id;
        this.state.gcp_client_secret_key = this.state.user.data.backup_gcp_client_secret_key;
        
        this.state.user.data.backup_gcp_client_id = "";
        this.state.user.data.backup_gcp_client_secret_key = "";
        localStorage.setItem("user", JSON.stringify(this.state.user));

        this.state.viewUserDetails = true;
        toast.error("Unable to enable GCP account in UCP !");
    
        setTimeout(() => {
          toast.info("Please follow the steps to enable GCP account in UCP !");
          this.setState({
            modalIsOpen: true
          });
        }, 6000);
      }
      else if(status && status.toLowerCase() == "success"){
        window.history.pushState('Customer Portal', 'Title', window.location.href.replace('?gcpStatus=success', ''));

        this.state.user.data.gcp_client_id = this.state.user.data.backup_gcp_client_id;
        this.state.user.data.gcp_client_secret_key = this.state.user.data.backup_gcp_client_secret_key;
        this.state.user.data.backup_gcp_client_id = "";
        this.state.user.data.backup_gcp_client_secret_key = "";
        
        toast.success("GCP Profile has updated and enabled successfully !");
        
        setTimeout(() => {
          localStorage.setItem("user", JSON.stringify(this.state.user));
          setTimeout(() => {
            location.reload(true);
          }, 3000);
        }, 100);
      }
    }
    
    if(window.location.href.indexOf("?msdevopsStatus=") != -1){
        let status = window.location.href.split("msdevopsStatus=")[1];
        status = status.split("&")[0];

        if(status && status.toLowerCase() == "error"){
          window.history.pushState('Customer Portal', 'Title', window.location.href.replace('?msdevopsStatus=error', ''));
      
          this.state.viewUserDetails = true;
          toast.error("Unable to enable Azure Devops account in UCP!");
        } else if(status && status.toLowerCase() == "success"){
          window.history.pushState('Customer Portal', 'Title', window.location.href.replace('?msdevopsStatus=success', ''));

          this.state.user.data.is_msdevops_enabled = 1;
          toast.success("Azure Devops Profile has updated and enabled successfully !");
        }
      }

    this.profileOnClick = this.profileOnClick.bind(this);
    this.changePswdOnClick = this.changePswdOnClick.bind(this);
  }

  fnSessionLogout(){
    sessionStorage.setItem("sessionOut", true);
    userService.logout();
    window.location.href = window.location.origin + "/#/login";
    return { type: userConstants.LOGOUT };
  }

  componentDidMount() {
      //this.props.dispatch(userActions.getAll(this.props.user.data.clientid));      
      document.getElementById("body_wrapper").addEventListener("click", (e) => {
          if(!e.target || !e.target.className || (e.target.className.indexOf && e.target.className.indexOf("skip-propagation-change-pswd") == -1 && e.target.className.indexOf("Toastify__") == -1)){
              this.setState({
                changePswd: false
              });
          }
          if(!this.state.modalIsOpen){
            if(!e.target || !e.target.className || (e.target.className.indexOf && e.target.className.indexOf("skip-propagation-user-profile") == -1)){
              this.setState({
                viewUserDetails: false
              });
            }
          }
      });
  }

  profileOnClick(){
    this.setState({
      viewUserDetails: !this.state.viewUserDetails,
      showAzureSecretKey: false,
      showAwsSecretKey: false,
      showGcpSecretKey: false
    })
  }
    
  changePswdOnClick(){
    this.setState({
      changePswd: !this.state.changePswd
    });
  }

  logout = () => {
    userService.logout();
    window.location.href = window.location.origin + "/#/login";
    return { type: userConstants.LOGOUT };
  };

  closeHeaderNotification = () => {
    this.setState({
      showHeaderNotification: false
    });
    localStorage.setItem("showVersion","1");
  }

  editAzureUserDetails = () => {
    this.setState({
      isAzureProfileEditMode: true,      
      azure_tenantid: this.state.user.data.azure_tenantid,
      azure_clientid: this.state.user.data.azure_clientid,
      azure_clientsecretkey: this.state.user.data.azure_clientsecretkey
    });
  }

  cancelAzureeditAzureUserDetails = () => {
    this.setState({
      isAzureProfileEditMode: false,
      showAzureSecretKey: false
    });
  }

  azureSettingsFormSubmit = (event) =>{
    if (event.key === 'Enter') {
       this.updateAzureUserDetails();
    }
  }

  updateAzureUserDetails = () => {
    if(!this.state.azure_tenantid){
      toast.error("Please enter Azure Tenant Id");
      return;
    }
    else if(!this.state.azure_clientid){
      toast.error("Please enter Azure Client Id");
      return;
    }
    else if(!this.state.azure_clientsecretkey){
      toast.error("Please enter Azure Client Secret Key");
      return;
    }

    let formData = {
      clientid : this.state.user.data.clientid,
      azure_tenantid : this.state.azure_tenantid,     
      "azure_clientid" : this.state.azure_clientid,     
      "azure_clientsecretkey" : this.state.azure_clientsecretkey 
    };

    this.setState({
      updateAzureProfileDetailsInProgress: true
    });

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: encryptRequest(formData)
    };

    fetch(`${config.apiUrl}/secureApi/azure/addAzureDetailsToClient`, requestOptions).then(response  => this.handleupdateAzureUserDetailsResponse(response));
  }
  
  handleupdateAzureUserDetailsResponse(response, stateName) {
    return response.text().then(text => {
        const data = decryptResponse(text);
        if (data.status == "error") {
            toast.error(data.message);
        }
        else{
          this.state.user.data.azure_tenantid = this.state.azure_tenantid;
          this.state.user.data.azure_clientid = this.state.azure_clientid;
          this.state.user.data.azure_clientsecretkey = this.state.azure_clientsecretkey;
          this.state.user.data.azure_linked = 1;
          
          toast.success("Azure details updated successfully!");
          this.setState({
            user: this.state.user,
            isAzureProfileEditMode: false,
            showAzureSecretKey: false
          });
          
          setTimeout(() => {
            localStorage.setItem("user", JSON.stringify(this.state.user));
            setTimeout(() => {
              location.reload(true);
            }, 2000);
          }, 100);
          
          //return data;
        }
        this.setState({
          updateAzureProfileDetailsInProgress: false
        })
    });
  }

  editAwsUserDetails = () => {
    this.setState({
      isAwsProfileEditMode: true,
      aws_username: this.state.user.data.aws_username,
      aws_accesskey: this.state.user.data.aws_accesskey,
      aws_secretekey: this.state.user.data.aws_secretekey
    });
  }

  cancelAwseditAzureUserDetails = () => {
    this.setState({
      isAwsProfileEditMode: false,
      showAwsSecretKey: false
    });
  }

  awsSettingsFormSubmit = (event) =>{
    if (event.key === 'Enter') {
       this.updateAwsUserDetails();
    }
  }
  
  updateAwsUserDetails = () => {    
    if(!this.state.aws_accesskey){
      toast.error("Please enter AWS Access Key");
      return;
    }
    else if(!this.state.aws_secretekey){
      toast.error("Please enter AWS Secret Token");
      return;
    }

    let formData = {
      clientid : this.state.user.data.clientid,  
      aws_username: this.state.aws_username,
      aws_accesskey : this.state.aws_accesskey,     
      aws_secretekey : this.state.aws_secretekey,
      aws_ref_id: this.state.user.data.aws_ref_id
    };

    this.setState({
      updateAwsProfileDetailsInProgress: true
    });

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: encryptRequest(formData)
    };

    fetch(`${config.apiUrl}/secureApi/aws/addAwsDetailsToClient`, requestOptions).then(response  => this.handleupdateAwsUserDetailsResponse(response));
  }

  handleupdateAwsUserDetailsResponse(response, stateName) {
    return response.text().then(text => {
        const data = decryptResponse(text);
        
        if (data.status == "error") {
            toast.error(data.message);
        }
        else{
          this.state.user.data.aws_username = this.state.aws_username;
          this.state.user.data.aws_accesskey = this.state.aws_accesskey;
          this.state.user.data.aws_secretekey = this.state.aws_secretekey;
          this.state.user.data.is_aws_enabled = 1;
          this.state.user.data.aws_ref_id = data.aws_ref_id;

          toast.success("AWS details updated successfully!");
          this.setState({
            user: this.state.user,
            isAwsProfileEditMode: false,
            showAwsSecretKey: false
          });
          //return data;

          setTimeout(() => {
            localStorage.setItem("user", JSON.stringify(this.state.user));
            setTimeout(() => {
              location.reload(true);
            }, 2000);
          }, 100);
        }
        this.setState({
          updateAwsProfileDetailsInProgress: false
        })
    });
  }
  
  editGcpUserDetails = () => {
    this.setState({
      isGcpProfileEditMode: true,
      gcp_client_id: this.state.user.data.gcp_client_id,
      gcp_client_secret_key: this.state.user.data.gcp_client_secret_key
    });
  }

  cancelGcpeditAzureUserDetails = () => {
    this.setState({
      isGcpProfileEditMode: false,
      showGcpSecretKey: false
    });
  }

  gcpSettingsFormSubmit = (event) =>{
    if (event.key === 'Enter') {
       this.updateGcpUserDetails();
    }
  }
  
  updateGcpUserDetails = () => {    
    if(!this.state.gcp_client_id){
      toast.error("Please enter GCP Client Id");
      return;
    }
    else if(!this.state.gcp_client_secret_key){
      toast.error("Please enter GCP Secret Key");
      return;
    }
    
    this.setState({
      updateGcpProfileDetailsInProgress: true
    });

    this.state.user.data.backup_gcp_client_id = this.state.gcp_client_id;
    this.state.user.data.backup_gcp_client_secret_key = this.state.gcp_client_secret_key;
       
    setTimeout(() => {
      localStorage.setItem("user", JSON.stringify(this.state.user));
      setTimeout(() => {
        window.location = `${config.apiUrl}/gcp/gcpOauth?gcp_client_id=${this.state.gcp_client_id}&gcp_client_secret_key=${this.state.gcp_client_secret_key}&clientid=${this.state.user.data.clientid}`;
      }, 1000);
    }, 100);
 }
  
  linkAzureDevopsFn = () => {    
	    window.location = `${config.apiUrl}/msdevops/msdevopsOauth?clientid=${this.state.user.data.clientid}&domain=${window.location.origin}/`;
  }

  bindTxtField = (field) => {
    this.setState({
      [field.target.name]: field.target.value
    });
  }

  showAzureSecretKeyClick = () => {
    this.setState({
      showAzureSecretKey: true
    });
  }

  
  showAwsSecretKeyClick = () => {
    this.setState({
      showAwsSecretKey: true
    });
  }

  showGcpSecretKeyClick = () => {
    this.setState({
      showGcpSecretKey: true
    });
  }

  openModal = () => {
    this.setState({ modalIsOpen: true });
  }

  closeModal = () => {
      this.setState({ modalIsOpen: false });        
  }
    render() {
      var assigned_resource_group ="<ul>";
      var role = '';

      let subscriptionWiseRG = {};
      (this.state.user.data.resource_groups || []).map(function(val) {
          if(val.role_id == 3){
            role = ' [Manager]';
          }
          if(val.role_id == 2){
           role = ' [Member]';
         }
          if(!subscriptionWiseRG[val.subscription_display_name]){
        	  subscriptionWiseRG[val.subscription_display_name] = [];
          }
          subscriptionWiseRG[val.subscription_display_name].push(val.name+role);
       });
//      console.log("subscriptionWiseRG --- ", subscriptionWiseRG);
//      let assigned_resource_group_inner = "";
//       (Object.keys(subscriptionWiseRG) || []).map(function(val) {
//    	   console.log("val --- ", val);
//    	   assigned_resource_group_inner += "<li>"+val+"<ul>";
//    	   (subscriptionWiseRG[val] || []).map(function(innerVal) {
//    		   console.log("innerVal --- ", innerVal);
//    		   assigned_resource_group_inner +="<li>"+innerVal+"</li>";
//    	      });
//         assigned_resource_group_inner += "</ul></li>";
//         console.log("assigned_resource_group_inner --- ", assigned_resource_group_inner);
//         assigned_resource_group += assigned_resource_group_inner;
//      });
//      assigned_resource_group +="</ul>"; 
        return (
            <div>
              <AutoSessionOut timeOut="600" sessionOutEvent={this.state.context}></AutoSessionOut>
              {this.state.showHeaderNotification &&
              <div  className="login-check-old-version">
                <a href="https://app.cloud4c.com/" target="_blank">Click here</a> to view the Earlier Version!
                  <i onClick={() => this.closeHeaderNotification()} className="far fa-times-circle close-header-notification"></i>
              </div>}
              <div className="header">
                <a id="toggle" href="#"><i className="fas fa-bars lineicon"></i></a>
                <div className="App-logo">
                  {/*<h5 className="header-text mt-1">{this.state.user.data.clientid === this.state.user.data.GOBEAR_CLIENT_ID ?<img src="/src/img/gobear_white.png" />:""}<img className="p-0" src="/src/img/blue-logo.png" />Universal Cloud Platform</h5>*/}
                  <div className="row">
	                  <div className="col-sm-3 m-t-xs">
	                  	<img className="p-0" src="/src/img/cloud-4c-white.png" />
	                  </div>
	                  <div className="col-sm-6 m-t-xs">
	                  	<h5 className="header-text mt-1">Universal Cloud Platform</h5>
	                  </div>
                  </div>
                </div>
                <div className="header-right-user-settings">
                  <div className="welcome-user-wrapper position-relative">
                      Welcome<br/>
                      {this.state.user.data.display_name ? this.state.user.data.display_name : this.state.user.data.email}
                  </div>
                  <div className="float-right">
                    {/* <div className="float-left position-relative">
                        <i onClick={this.changePswdOnClick} className="fas fa-cog cursor header-icons cursor-pointer-new skip-propagation-change-pswd" title="Change Password"></i>
                        {this.state.changePswd ?
                        <ChangePassword/>                    
                        : ""}
                    </div> */}
                    <div className="float-left position-relative">
                      <i onClick={this.profileOnClick} title="My Profile" className="fas fa-user-circle cursor header-icons cursor-pointer-new skip-propagation-user-profile"></i>
                      {this.state.viewUserDetails ?
                        <React.Fragment>
                          <div className="header-view-user-details skip-propagation-user-profile">
                            <table className="table table-hover skip-propagation-user-profile user-profile-table" id="vm_detail">
                              <tbody className="skip-propagation-user-profile">
                                  <tr className="skip-propagation-user-profile">
                                    <th className="skip-propagation-user-profile">User Name:</th>
                                    <td className="skip-propagation-user-profile" style={{width: "360px"}}>
                                      {this.state.user.data.display_name}
                                    </td>
                                  </tr>
                                  <tr className="skip-propagation-user-profile">
                                    <th className="skip-propagation-user-profile">User Email:</th>
                                    <td className="skip-propagation-user-profile">
                                      {this.state.user.data.email}
                                    </td>
                                  </tr>
                                  {/*<tr className="skip-propagation-user-profile">
                                    <th className="skip-propagation-user-profile">Company Name:</th>
                                    <td className="skip-propagation-user-profile">{this.state.user.data.company_name}</td>
                                  </tr>*/}
                                  {/*<tr className="skip-propagation-user-profile">
                                    <th className="skip-propagation-user-profile">Address:</th>
                                    <td className="skip-propagation-user-profile">{this.state.user.data.address}</td>
                                  </tr>*/}
                                  {/* <tr className="skip-propagation-user-profile">
                                    <th className="skip-propagation-user-profile">User Mobile:s</th>
                                    <td className="skip-propagation-user-profile">{this.state.user.data.mobile}</td>
                                  </tr> */}
                                  <tr className="skip-propagation-user-profile">
                                    <th className="skip-propagation-user-profile">Resource Groups:</th>
                                    <td className="skip-propagation-user-profile">
	                                    <ul>
	                                    {subscriptionWiseRG && Object.keys(subscriptionWiseRG).length > 0 && Object.keys(subscriptionWiseRG).map((sub, index) =>
		                                    <React.Fragment key={index}>
		                                    	<li>{sub}<ul>
			                                    	{subscriptionWiseRG[sub] && subscriptionWiseRG[sub].length > 0 && subscriptionWiseRG[sub].map((rg, innerIndex) =>
					                                    <React.Fragment key={innerIndex}>
					                                    	<li>{rg}</li>
					                                    </React.Fragment>
				                                    )}
		                                    	</ul></li>
		                                    </React.Fragment>
	                                    )}
	                                    </ul>
                                      {/*<div dangerouslySetInnerHTML={ {__html: assigned_resource_group} } />*/}
                                      </td>
                                  </tr>
                                  {/*<tr className="skip-propagation-user-profile">
                                    <th className="skip-propagation-user-profile">User Role:</th>
                                    <td className="skip-propagation-user-profile">{this.state.user_role==1?'Admin':'User'}</td>
                                  </tr>*/}
	                              {/* <tr className="skip-propagation-user-profile">
	                                  <th className="skip-propagation-user-profile">BU:</th>
	                                  <td className="skip-propagation-user-profile">{this.state.user.data.bu_name}</td>
	                              </tr> */}
	                              {/*<tr className="skip-propagation-user-profile">
	                                  <th className="skip-propagation-user-profile">Provision Type:</th>
	                                  <td className="skip-propagation-user-profile">{this.state.user.data.provision_type}</td>
	                              </tr>*/}
                                </tbody>
                              </table>
                              <React.Fragment>
                              {/*<React.Fragment>
                                  <div className="user-profile-table user-profile-headers skip-propagation-user-profile">
                                    Azure
                                    {this.state.isAzureProfileEditMode ? 
                                        <React.Fragment>
                                          <span onClick={() => this.cancelAzureeditAzureUserDetails()} className="cancel-profile-edit-btn btn btn-primary float-right skip-propagation-user-profile while-profile-button cursor-pointer">Cancel</span>
                                          <button onClick={() => this.updateAzureUserDetails()} 
                                          className={"mr-1 btn float-right skip-propagation-user-profile while-profile-button " + (this.state.updateAzureProfileDetailsInProgress ? "no-access" : "")} disabled={this.state.updateAzureProfileDetailsInProgress ? true : false}
                                          >
                                            {this.state.updateAzureProfileDetailsInProgress && <i className="fas fa-circle-notch icon-loading"></i> }
                                            Update</button>
                                          </React.Fragment>
                                    : 
                                    (this.state.user_role == 1 ? <span onClick={() => this.editAzureUserDetails()} className="btn float-right skip-propagation-user-profile while-profile-button cursor-pointer">Edit</span>:"")
                                    }
                                  </div>
                                  <table onKeyDown={this.azureSettingsFormSubmit} className="table table-hover skip-propagation-user-profile user-profile-table">
                                  <tbody className="skip-propagation-user-profile">
                                    <tr className="skip-propagation-user-profile">
                                      <th className="skip-propagation-user-profile">Azure Tenant Id:</th>
                                      <td className="skip-propagation-user-profile">
                                        {this.state.isAzureProfileEditMode ? 
                                          <input type="text" value={this.state.azure_tenantid} onChange={(e) => this.bindTxtField(e)} className="form-control edit-user-input-text skip-propagation-user-profile" name="azure_tenantid" required="" placeholder="Enter Azure Tenant Id" /> : 
                                        this.state.user.data.azure_tenantid}
                                      </td>
                                    </tr>
                                    <tr className="skip-propagation-user-profile">
                                      <th className="skip-propagation-user-profile">Azure Client Id:</th>
                                      <td className="skip-propagation-user-profile">
                                      {this.state.isAzureProfileEditMode ? 
                                          <input type="text" value={this.state.azure_clientid} onChange={(e) => this.bindTxtField(e)} className="form-control edit-user-input-text skip-propagation-user-profile" name="azure_clientid" required="" placeholder="Enter Azure Client Id"  /> : 
                                      	(this.state.user.data.azure_clientsecretkey
                                          ? (this.state.showAzureSecretKey ? this.state.user.data.azure_clientid : 
                                            <React.Fragment>
                                            ****-****-****-****
                                            </React.Fragment>)
                                          : "")
                                      }
                                      </td>
                                    </tr>
                                    <tr className="skip-propagation-user-profile">
                                      <th className="skip-propagation-user-profile">Azure Client Secret Key:</th>
                                      <td className="skip-propagation-user-profile">
                                      {this.state.isAzureProfileEditMode ? 
                                          <input type="text" value={this.state.azure_clientsecretkey} onChange={(e) => this.bindTxtField(e)} className="form-control edit-user-input-text skip-propagation-user-profile" name="azure_clientsecretkey" value={this.state.azure_clientsecretkey} required="" placeholder="Enter Azure Secret Key" /> : 
                                        (this.state.user.data.azure_clientsecretkey
                                        ? (this.state.showAzureSecretKey ? this.state.user.data.azure_clientsecretkey : 
                                          <React.Fragment>
                                          ****-****-****-**** {this.state.user_role == 1 && <span onClick={(e) => this.showAzureSecretKeyClick(e)} className="skip-propagation-user-profile show_secret_key_btn alert info-box-blue mr-2 cursor-pointer">Show Secret Key</span>}
                                          </React.Fragment>)
                                        : "")
                                      }
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                </React.Fragment>*/}
                                {/*<React.Fragment>
                                <div className="user-profile-table user-profile-headers skip-propagation-user-profile">
                                  AWS
                                  {this.state.isAwsProfileEditMode ? 
                                      <React.Fragment>
                                        <a href="#" onClick={() => this.cancelAwseditAzureUserDetails()} className="cancel-profile-edit-btn btn btn-primary float-right skip-propagation-user-profile while-profile-button ">Cancel</a>
                                        <button onClick={() => this.updateAwsUserDetails()} 
                                        className={"mr-1 btn float-right skip-propagation-user-profile while-profile-button " + (this.state.updateAwsProfileDetailsInProgress ? "no-access" : "")} disabled={this.state.updateAwsProfileDetailsInProgress ? true : false}
                                        >
                                          {this.state.updateAwsProfileDetailsInProgress && <i className="fas fa-circle-notch icon-loading"></i> }
                                          Update</button>
                                        </React.Fragment>
                                  : 
                                    <a href="#" onClick={() => this.editAwsUserDetails()} className="btn float-right skip-propagation-user-profile while-profile-button">Edit</a>
                                  }
                                </div>
                                <table onKeyDown={this.awsSettingsFormSubmit} className="table table-hover skip-propagation-user-profile user-profile-table">
                                  <tbody className="skip-propagation-user-profile">
                                    <tr className="skip-propagation-user-profile">
                                      <th className="skip-propagation-user-profile">AWS User Name:</th>
                                      <td className="skip-propagation-user-profile">
                                        {this.state.isAwsProfileEditMode ? 
                                          <input type="text" value={this.state.aws_username} onChange={(e) => this.bindTxtField(e)} className="form-control edit-user-input-text skip-propagation-user-profile" name="aws_username" required="" placeholder="Enter Azure Tenant Id" /> : 
                                        this.state.user.data.aws_username}
                                      </td>
                                    </tr>
                                    <tr className="skip-propagation-user-profile">
                                      <th className="skip-propagation-user-profile">AWS Access Key:</th>
                                      <td className="skip-propagation-user-profile">
                                      {this.state.isAwsProfileEditMode ? 
                                          <input type="text" value={this.state.aws_accesskey} onChange={(e) => this.bindTxtField(e)} className="form-control edit-user-input-text skip-propagation-user-profile" name="aws_accesskey" required="" placeholder="Enter Azure Client Id"  /> : 
                                        this.state.user.data.aws_accesskey}  
                                      </td>
                                    </tr>
                                    <tr className="skip-propagation-user-profile">
                                      <th className="skip-propagation-user-profile">AWS Secret Token:</th>
                                      <td className="skip-propagation-user-profile">
                                      {this.state.isAwsProfileEditMode ? 
                                          <input type="text" value={this.state.aws_secretekey} onChange={(e) => this.bindTxtField(e)} className="form-control edit-user-input-text skip-propagation-user-profile" name="aws_secretekey" value={this.state.aws_secretekey} required="" placeholder="Enter Azure Secret Key" /> : 
                                        (this.state.user.data.aws_secretekey
                                        ? (this.state.showAwsSecretKey ? this.state.user.data.aws_secretekey : 
                                          <React.Fragment>
                                          ****-****-****-**** <a href="#" onClick={(e) => this.showAwsSecretKeyClick(e)} className="skip-propagation-user-profile show_secret_key_btn">Show Secret Key</a>
                                          </React.Fragment>)
                                        : "")
                                      }
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                </React.Fragment>
                                <React.Fragment>
                              <div className="user-profile-table user-profile-headers skip-propagation-user-profile">
                                <span className="position-relative"> Google Cloud Portal
                                    <blink>
                                      <i
                                      onClick={() => this.openModal()}
                                      data-tip data-for="hintForGCP" className="fas fa-question-circle txt-hints-icon-gcp skip-propagation-user-profile" aria-hidden="true"></i>
                                    </blink>
                                </span>
                                <ReactTooltip id="hintForGCP" place="top" effect="solid">
                                    Check how to Enable GCP Profile
                                </ReactTooltip>
                                {this.state.isGcpProfileEditMode ? 
                                    <React.Fragment>
                                      <a href="#" onClick={() => this.cancelGcpeditAzureUserDetails()} className="cancel-profile-edit-btn btn btn-primary float-right skip-propagation-user-profile while-profile-button ">Cancel</a>
                                      <button onClick={() => this.updateGcpUserDetails()} 
                                      className={"mr-1 btn float-right skip-propagation-user-profile while-profile-button " + (this.state.updateGcpProfileDetailsInProgress ? "no-access" : "")} disabled={this.state.updateGcpProfileDetailsInProgress ? true : false}
                                      >
                                        {this.state.updateGcpProfileDetailsInProgress && <i className="fas fa-circle-notch icon-loading"></i> }
                                        Update</button>
                                      </React.Fragment>
                                : 
                                  <a href="#" onClick={() => this.editGcpUserDetails()} className="btn float-right skip-propagation-user-profile while-profile-button">Edit</a>
                                }
                              </div>
                              <table onKeyDown={this.gcpSettingsFormSubmit} className="table table-hover skip-propagation-user-profile user-profile-table">
                                <tbody className="skip-propagation-user-profile">
                                  <tr className="skip-propagation-user-profile">
                                    <th className="skip-propagation-user-profile">Client ID:</th>
                                    <td className="skip-propagation-user-profile">
                                    {this.state.isGcpProfileEditMode ? 
                                        <input type="text" value={this.state.gcp_client_id} onChange={(e) => this.bindTxtField(e)} className="form-control edit-user-input-text skip-propagation-user-profile" name="gcp_client_id" required="" placeholder="Enter GCP Client ID"  /> : 
                                      this.state.user.data.gcp_client_id}  
                                    </td>
                                  </tr>
                                  <tr className="skip-propagation-user-profile">
                                    <th className="skip-propagation-user-profile">Client Secret:</th>
                                    <td className="skip-propagation-user-profile">
                                    {this.state.isGcpProfileEditMode ? 
                                        <input type="text" value={this.state.gcp_client_secret_key} onChange={(e) => this.bindTxtField(e)} className="form-control edit-user-input-text skip-propagation-user-profile" name="gcp_client_secret_key" value={this.state.gcp_client_secret_key} required="" placeholder="Enter GCP Secret Key" /> : 
                                      (this.state.user.data.gcp_client_secret_key
                                      ? (this.state.showGcpSecretKey ? this.state.user.data.gcp_client_secret_key : 
                                        <React.Fragment>
                                        ****-****-****-**** <a href="#" onClick={(e) => this.showGcpSecretKeyClick(e)} className="skip-propagation-user-profile show_secret_key_btn">Show Secret Key</a>
                                        </React.Fragment>)
                                      : "")
                                    }
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              
                              </React.Fragment>*/}
                              </React.Fragment>
                          </div>
                        </React.Fragment>
                        : ""}
                    </div>
                    <div className="float-left"><i onClick={this.logout} className="fas fa-sign-out-alt cursor header-icons cursor-pointer-new" title="Logout"></i></div>
                  </div>
                </div>
              </div>
              <Modal
                isOpen={this.state.modalIsOpen}
                onRequestClose={this.closeModal}
                >
                    <h2 style={{color:'red'}}>
                        Steps to Enable GCP Profile<a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times skip-propagation-user-profile" /></a>
                    </h2>
                    <div className="col-md-12 hint-popup-wrapper skip-propagation-user-profile">
                        <div className="panel panel-default" />                 
                        
                        Must follow the below steps to enable GCP in UCP Portal <br/><br/>

                        <div className="position-relative">
                          <span className="rounded-bullet-point">1</span> <a href="https://console.developers.google.com/apis/credentials">Click here</a> to login into the GCP account and create the GCP Credentials API with <b>Oauth Client ID</b>.

                          <img className="w-100" src="/src/img/Gcp_OAuth.png"></img>
                        </div>
                        <br/>
                        <div className="position-relative">
                          <span className="rounded-bullet-point">2</span> Add this URL (https://ucpapi.cloud4c.com/gcp/gcpReturnUrl) under "Authorized redirect URIs".
                          <img className="w-100" src="/src/img/Gcp_Authorization.png"></img>
                        </div>
                        <br/>
                        <div className="position-relative">
                          <span className="rounded-bullet-point">3</span> <strong className="hint-highlight">Must follow this step after 1 & 2.</strong> <br/><br/>  
                        Add the Client ID, Client Secret fields in UCP Portal under Google Cloud Portal section in Profile Settings.
                        </div>
                        <br/>
                        <div className="position-relative">
                          <span className="rounded-bullet-point">4</span> After submitting the GCP profile details, Page will redirect to the Google login page.
                        </div>
                        <br/>
                        <div className="position-relative">
                          <span className="rounded-bullet-point">5</span> Login into google with the appropriate account
                        </div>
                        <br/>
                        <div className="position-relative">
                          <span className="rounded-bullet-point">6</span> After successfully logged in into Google it will redirect back to UCP Portal and You can access GCP in the UCP portal once google authentication is verified.
                        </div>
                    </div>
                </Modal>
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

const connectedUsers = connect(mapStateToProps)(Header);
export { connectedUsers as Header };