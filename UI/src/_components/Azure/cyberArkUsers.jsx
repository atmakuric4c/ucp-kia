import React, {Fragment} from 'react';
import { commonFns } from "../../_helpers/common";
import { connect } from 'react-redux';
import { azureActions } from './azure.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import ReactHtmlParser from 'react-html-parser'; 
import DatatablePage from './resourceGroupsGridview';
import PageLoader from '../PageLoader';
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri, decryptResponse } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';
import { MDBDataTable } from 'mdbreact';
import { exportDataToExcel } from '../../_helpers';

Modal.setAppElement("#app");
class cyberArkUsers extends React.Component {
  constructor(props) {
    super(props);
    
    commonFns.fnCheckPageAuth(commonFns.menuUrls.azure);

    let user = decryptResponse(localStorage.getItem("user"));

    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      provision_type: user.data.provision_type,
      isCyberArkUsersInProgress: false,
      saveUserOnboardingInProgress : false,
      sweetalert: true,
      removeAdUserInProgress : false,
      newUserOnboardingIsOpen : false,
      isAdGroupsInProgress : false,
      adGroupsList : [],
      UserPrincipalName : "",
      ou : "prod",
      data: {
        columns: [
          {
              label: 'S.No',
              field: 'sno',
          },
          {
              label: 'Email',
              field: 'email',
          },
          {
              label: 'Action',
              field: 'action',
              width: 200
          },
        ],
        rows: []
      },
      exportData : [],
    };
    
    this.bindField = this.bindField.bind(this);
    this.openNewUserOnboarding = this.openNewUserOnboarding.bind(this);
    this.closeModalNewUserOnboarding = this.closeModalNewUserOnboarding.bind(this);
  }

  openNewUserOnboarding(){
	  this.setState({ newUserOnboardingIsOpen: true});
  }
  closeModalNewUserOnboarding(){
    this.setState({ newUserOnboardingIsOpen: false });
  }
  userOnboardingRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#userOnboarding");
    var formData = serialize(form, { hash: true });
    let vm_error = false;
    
	if(!this.state.UserPrincipalName){
		vm_error = true;
        toast.error("Please enter Email");
    	return;
	}
	else if(this.state.UserPrincipalName.substr(-8) != '@dhl.com'){
		vm_error = true;
        toast.error("Please enter valid Email");
    	return;
	}
	else if(!this.state.adGroup){
		vm_error = true;
        toast.error("Please select AD Group");
    	return;
	}
	console.log("formData ---- ", formData);
	
	if(!vm_error){
	    let newFormData = formData;
	    console.log("newFormData --- ", newFormData);
	
	    this.setState({
	    	saveUserOnboardingInProgress: true
	    });

	    const requestOptions = {
	        method: 'POST',
	        headers: { ...authHeader(), 'Content-Type': 'application/json' },
	        body: JSON.stringify(ucpEncrypt({
	        	...newFormData,
	        	"client_id": this.state.clientid,
	            "user_id": this.state.user_id
	        }))
	    };
	    return fetch(`${config.apiUrl}/secureApi/azure/saveUserOnboarding`, requestOptions).then(response  => {
	        response.text().then(text => {
	            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	            
	            this.setState({
	            	saveUserOnboardingInProgress: false
	            });
	            if (response.ok) {
	                var result=(data.value ? data.value : data)
	                console.log("saveUserOnboarding result --- ",result);
	            	if(result.status == "success"){
	            		this.setState({
		                	vmAccessIsOpen: false,
		                });
	            		toast.success(result.message);
	                      setTimeout(() => {
	                        location.reload(true);
	                      }, 2000);
	            	}else{
	            		toast.error(result.message);
	            	}
	            }
	            else{
	                toast.error("The operation did not execute as expected. Please raise a ticket to support");
	            }        
	        });
	    });
	}
  };
  removeAdUserClick(userInfo) {
	  console.log("removeAdUserClick userInfo ---- ", userInfo);
	  var dispLabel = "Yes, Remove user!";
	  const getAlert = () => (
	    <SweetAlert
	      warning
	      showCancel
	      confirmBtnText={dispLabel}
	      confirmBtnBsStyle="danger"
	      cancelBtnBsStyle="default"
	      title="Are you sure?"
	      onConfirm={() => this.removeAdUser(userInfo)}
	      onCancel={this.hideAlert.bind(this)}
	    >
	    </SweetAlert>
	  );
	  console.log("removeAdUserClick getAlert ---- ", getAlert);
	  this.setState({
	    sweetalert: getAlert()
	  });
  }
  hideAlert() {
    this.setState({
      sweetalert: null
    });
  }
  removeAdUser (userInfo) {
	  console.log("removeAdUser userInfo ---- ", userInfo);
	  $(".complete-page-loader").show();
	    const requestOptions = {
	        method: 'POST',
	        headers: { ...authHeader(), 'Content-Type': 'application/json' },
	        body: JSON.stringify(ucpEncrypt({
	        	...userInfo,
	        	"client_id": this.state.clientid,
	            "requested_user_id": this.state.user_id
	        }))
	    };
	    return fetch(`${config.apiUrl}/secureApi/azure/removeAdUser`, requestOptions).then(response  => {
	        response.text().then(text => {
	            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	            $(".complete-page-loader").hide();
	            if (response.ok) {
	                var result=(data.value ? data.value : data)
	                console.log("removeAdUser result --- ",result);
	            	if(result.status == "success"){
	            		this.hideAlert();
	            		toast.success(result.message);
	                      setTimeout(() => {
	                        location.reload(true);
	                      }, 1000);
	            	}else{
	            		toast.error(result.message);
	            	}
	            }
	            else{
	                toast.error("The operation did not execute as expected. Please raise a ticket to support");
	            }        
	        });
	    });
  };
	  
  bindField(e){    
	  if(e.target.name == "durationDays" || e.target.name == "durationHours"){
		  let value = e.target.value;
	      let charCode = value.charCodeAt(value.length - 1);
	      console.log("charCode ---- ", charCode);
	      if (charCode < 48 || charCode > 57) {
	          return false;
	      }
	  }else if(e.target.name == "resourceGroupName" || e.target.name == "region"){
    	this.setState({
    		appType: ""
        })
        setTimeout(() => {
        	this.osTypeChange(this.state.osType, "");
        }, 100);
	  }

	  this.setState({
        [e.target.name]: e.target.value
	  })
  }

  getAdGroups(){
	  const requestOptions = {
          method: 'GET',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
      };

      this.setState({
    	  isAdGroupsInProgress: true
      });
      
      fetch(`${config.apiUrl}/secureApi/azure/getAdGroups`, requestOptions).then(response  => {
          response.text().then(text => {
              
              var data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
              var errorMsg = "The operation did not execute as expected. Please raise a ticket to support";
              if (response.ok) {
                  if(data.data && data.data.length > 0){
                  	this.setState({
                  		adGroupsList : data.data,
              		});
                  	this.getCyberArkUsers(data.data[0].group_id+"@$"+data.data[0].group_name);
                  } else {
                      toast.error(errorMsg);
                  }
              }
              else{
                  toast.error(errorMsg);
              }

              this.setState({
              	isAdGroupsInProgress: false
              });
          });
      });
  }
  getCyberArkUsers(ad){
	  if(!ad){
		  toast.error("Please select AD Group");
		  return;
	  }
	  //sub.group_id+"@$"+sub.group_name
	  ad = ad.split("@$");
	  const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(ucpEncrypt({
        	  adGroup : ad[0],
        	  record_status : 1
          }))
      };
	  let exportData = [];

      this.setState({
          isCyberArkUsersInProgress: true,
          cyberArkUsersList : [],
          exportData
      });
      this.state.data.rows = [];
      this.setState({
          data: this.state.data
      })
      
      fetch(`${config.apiUrl}/secureApi/azure/get-cyberark-users`, requestOptions).then(response  => {
          response.text().then(text => {
              
              var data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
              var errorMsg = "The operation did not execute as expected. Please raise a ticket to support";
              if (response.ok) {
                  if(data.data && data.data.length > 0){
                  	this.setState({
                  		cyberArkUsersList : data.data,
              		});
                  	
                  	let usersList = [];
                  	for(let i =0; i < data.data.length; i++){
                        let newRow = {};
                        newRow.sno = (i+1)
                        newRow.email = data.data[i].email;
                        newRow.action = <span className=" cursor-pointer" onClick={() => this.removeAdUserClick(data.data[i])}><i className="fa fa-trash"></i> </span>
                        usersList.push(newRow);
                        
                        let newExportRow = {};
                        newExportRow['S.No.'] = (i+1); 
                        newExportRow['Email'] = data.data[i].email;
                        newExportRow['AD Group'] = ad[1];
                        exportData.push(newExportRow);
                    }
                  	this.state.data.rows = usersList;
                    this.setState({
                        data: this.state.data
                    })
                  } else {
                      toast.error("Records not found");
                  }
              }
              else{
                  toast.error(errorMsg);
              }

              this.setState({
              	isCyberArkUsersInProgress: false,
              	exportData
              });
          });
      });
  }

  componentDidMount() {
    this.getAdGroups();
  }

  render() { 
    const { azure } = this.props;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
        	<div className="row">
	            <div className="col-lg-6">
	            	<h5 className="color">AD Users List</h5>
	            </div>
	            <div className="col-lg-6">
		            <span className="alert info-box-blue mr-2 cursor-pointer float-right" onClick={() => this.openNewUserOnboarding()}>New User Onboarding</span>
		        </div>
	        </div>
	        <span className="text-danger">
	      		Note: Onboarding of a new user into Active Directory will take 45-60 minutes. If the user is not reflecting in the AD users list in UCP platform, please check after sometime or raise a ticket to support.
	      	</span>
	        <br/><br/>
          <div className="row">
              <div className="col-lg-8">
                  <div className="form-group row">
                      <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>AAD Group</label>                
                      <div className="col-sm-9">
                          <select
                          className="form-control-vm"
                          required
                          name="subscription"
                          onChange={e => this.getCyberArkUsers(e.target.value)}
                          >
                          {this.state.adGroupsList && this.state.adGroupsList.length > 0 && this.state.adGroupsList.map((sub, index) =>
                              <option value={sub.group_id+"@$"+sub.group_name} key={sub.group_id}>
                                  {sub.group_name}
                              </option>
                          )}
                          </select>
                      </div>
                  </div>
              </div>
              {this.state.sweetalert}
            </div>
                
            <div className="row mt-4">
                <div className="col-md-12">
                    {this.state.isCyberArkUsersInProgress ? <PageLoader/> :
                    <React.Fragment>
                      {this.state.data.rows && this.state.data.rows.length > 0 &&
                    	  <React.Fragment>
		              		<div className="col-md-12 float-right">
			            	  <button onClick={e => { 
				                  return this.state.data.rows && this.state.data.rows.length ? 
				                		  exportDataToExcel({data: this.state.exportData, reportName : "AD-Users-List"}) : 
				                  toast.error('No data to export')}}
				                type="button" className="btn btn-blue float-right" >Export <i className="fas fa-file-download"></i></button>
			                </div>
	                        <MDBDataTable
		                        striped
		                        hover
		                        data={this.state.data}
		                        />
	                      </React.Fragment>
                      }
                    </React.Fragment>
                  }
                </div>
            </div>
            <Modal
	          isOpen={this.state.newUserOnboardingIsOpen}
	          onRequestClose={this.closeModalNewUserOnboarding}              
	          contentLabel="User VM Access"
	          >
	          <h2 style={{color:'red'}}>
	              User On-Boarding <span className="float-right cursor-pointer" onClick={this.closeModalNewUserOnboarding}><i className="fa fa-times" /></span>
	          </h2>
	          <div className="col-md-12">
	              <div className="panel panel-default" />
	              <form
	                  name="userOnboarding"
	                  id="userOnboarding"
	                  method="post"
	                  onSubmit={this.userOnboardingRequest}
	                  >
		              <div className="form-group">
			              <label htmlFor="cloud_type" className=''>User Email <span className="star-mark">*</span></label>
			              <input
	                        type="text" 
	                        className="form-control"
	                        name="UserPrincipalName"
	                        placeholder="Email"
	                        onChange={this.bindField}
	                        value={this.state.UserPrincipalName}
	                        />
			          </div>
			          <div className="form-group">
			            <label htmlFor="cloud_type" className=''>AAD Group <span className="star-mark">*</span></label>
			            <select
			                className="form-control"
			                value={this.state.adGroup}
			              	name="adGroup"
	                        id="adGroup"
                        	onChange={this.bindField}
			                >
			                <option value="">--SELECT--</option>
			                {this.state.adGroupsList && this.state.adGroupsList.length > 0 && this.state.adGroupsList.map((sub, index) =>
                            <option value={sub.group_id+"@$"+sub.group_name} key={sub.group_id}>
                                {sub.group_name}
                            </option>
                        )}
			            </select>
			          </div>
	                  <div className="form-group">
	                      <button
	                      className={"btn btn-sm btn-primary " + (this.state.saveUserOnboardingInProgress ? "no-access" : "")} disabled={this.state.saveUserOnboardingInProgress ? true : false}
	                      >
	                      {this.state.saveUserOnboardingInProgress && 
	                          <i className="fas fa-circle-notch icon-loading"></i>
	                      }
	                      Submit</button>
	                      <br/>
	                      <span className="text-danger">
		      		      	Note: Onboarding of a new user into Active Directory will take 45-60 minutes. If the user is not reflecting in the AD users list in UCP platform, please check after sometime or raise a ticket to support.
		      		      </span>
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
  console.log(state);
  const { azure } = state;
  return {
    azure
  };
}

const connected = connect(mapStateToProps)(cyberArkUsers);
export { connected as cyberArkUsers };