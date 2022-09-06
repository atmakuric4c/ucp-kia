import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { userActions, profileActions } from '../../_actions';
import { MDBDataTable } from 'mdbreact';
import { toast } from 'react-toastify';
var serialize = require("form-serialize");
import PageLoader from '../PageLoader';
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';
import config from 'config';
import { validation } from "../../_helpers/passwordPolicy";
import { decryptResponse } from '../../_helpers';

Modal.setAppElement("#app");
class DatatablePage extends React.Component {
    constructor(props) {
        super(props);
        let user = decryptResponse( localStorage.getItem("user"));

        this.openModal = this.openModal.bind(this);
        this.afterOpenModal = this.afterOpenModal.bind(this);
        this.handleMobileNo = this.handleMobileNo.bind(this);
        this.closeModal = this.closeModal.bind(this);

        this.openModalEdituser = this.openModalEdituser.bind(this);
        this.afterOpenModalEdituser = this.afterOpenModalEdituser.bind(this);
        this.handleEditMobileNo = this.handleMobileNo.bind(this);
        this.closeModalEdituser = this.closeModalEdituser.bind(this);
        this.bindField = this.bindField.bind(this);
        
        this.values=[];
        this.activeUsers=[];
        this.inactiveUsers=[];
        this.props.users.items.map((val, index) =>{
            if(val.status == 1){
                this.activeUsers[this.activeUsers.length]={
                    sno : (this.activeUsers.length +1),
                    email:val.email,
                    display_name: val.display_name && !val.display_name.status ? val.display_name: "",
                    mobile:val.mobile &&  !val.mobile.status ? val.mobile : "",
                    user_role:((val.user_role == 1)?"Admin":"User"),
                    provision_type:val.provision_type? val.provision_type : "",
                    bu_name:val.bu_name? val.bu_name : "",
                    status:((val.status == 1)?"Active":"Inactive"),
                    profile_name:((val.user_role == 2)? val.profile_name :""),
                    otp: (val.otp_status ? "Enabled" : "Disabled"),
                    google_auth_login: (val.google_auth_login ? "Enabled" : "Disabled"),
                    security_question_enable: (val.security_question_enable?"Yes":"No"),
                    action : ((user.data.user_role == 1)?<span className=" cursor-pointer" onClick={() => this.openModalEdituser(val)}><i className="fa fa-edit"></i> </span>:"")
                }
            }
            else{
                this.inactiveUsers[this.inactiveUsers.length]={
                    sno : (this.inactiveUsers.length +1),
                    email:val.email,
                    display_name:val.display_name && !val.display_name.status ? val.display_name: "",
                    mobile:val.mobile && !val.mobile.status ? val.mobile : "",
                    user_role:((val.user_role == 1)?"Admin":"User"),
                    provision_type:val.provision_type? val.provision_type : "",
                    bu_name:val.bu_name? val.bu_name : "",
                    status:((val.status == 1)?"Active":"Inactive"),
                    profile_name:((val.user_role == 2)? val.profile_name :""),
                    otp: (val.otp_status ? "Enabled" : "Disabled"),
                    google_auth_login: (val.google_auth_login ? "Enabled" : "Disabled"),
                    security_question_enable: (val.security_question_enable?"Yes":"No"),
                    action : ((user.data.user_role == 1)?<span className=" cursor-pointer" onClick={() => this.openModalEdituser(val)}><i className="fa fa-edit"></i> </span>:"")
                }
            }
        })
        
        this.state = {
            user:user.data,
            clientid:   user.data.clientid,
            client_master_id:   user.data.client_master_id,
            user_role:  user.data.user_role,
            profiles: [],
            userDetails:[],
            userPassword: '',
            userCPassword: '',
            userMobileNo: '',
            BuData : [],
            modalIsOpen: false,
            modalIsOpenEdituser: false,
            isActiveUserTabActive: true,
            questions:[],
            viewAddQuestions:0,
            viewEditQuestions:0,
            profile_id: null,
            activeUsers: {
                columns: [
                {
                    label: 'S. No.',
                    field: 'sno',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Email',
                    field: 'email',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Display name',
                    field: 'display_name',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Mobile',
                    field: 'mobile',
                    // sort: 'asc',
                    width: 200
                },
                // {
                //     label: 'Role',
                //     field: 'user_role',
                //     // sort: 'asc',
                //     width: 200
                // },
                // {
                //     label: 'Provision Type',
                //     field: 'provision_type',
                //     // sort: 'asc',
                //     width: 200
                // },
                // {
                //     label: 'BU Name',
                //     field: 'bu_name',
                //     // sort: 'asc',
                //     width: 200
                // },
                
                //UnComment to Enable Profile Template
                /*{
                    label: 'Profile Template',
                    field: 'profile_name',
                    width: 200
                },*/
                // {
                //     label: 'OTP Security',
                //     field: 'otp',
                //     // sort: 'asc',
                //     width: 200
                // },
                // {
                //     label: 'Google Auth Security',
                //     field: 'google_auth_login',
                //     // sort: 'asc',
                //     width: 200
                // },
                // {
                //     label: 'Security Question?',
                //     field: 'security_question_enable',
                //     // sort: 'asc',
                //     width: 200
                // },
                {
                    label: 'Status',
                    field: 'status',
                    // sort: 'asc',
                    width: 200
                },
                {
                    label: 'Action',
                    field: 'action',
                    // sort: 'asc',
                    width: 200
                },
            ],
            rows: this.activeUsers
            },
            inactiveUsers: {
                columns: [
                {
                    label: 'S. No.',
                    field: 'sno',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Email',
                    field: 'email',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Display name',
                    field: 'display_name',
                    // sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Mobile',
                    field: 'mobile',
                    // sort: 'asc',
                    width: 200
                },
                // {
                //     label: 'Role',
                //     field: 'user_role',
                //     // sort: 'asc',
                //     width: 200
                // },
                // {
                //     label: 'Provision Type',
                //     field: 'provision_type',
                //     // sort: 'asc',
                //     width: 200
                // },
                // {
                //     label: 'BU Name',
                //     field: 'bu_name',
                //     // sort: 'asc',
                //     width: 200
                // },
                
                //UnComment to Enable Profile Template
                /*{
                    label: 'Profile Template',
                    field: 'profile_name',
                    width: 200
                },*/
                // {
                //     label: 'OTP Security',
                //     field: 'otp',
                //     // sort: 'asc',
                //     width: 200
                // },
                // {
                //     label: 'Google Auth Security',
                //     field: 'google_auth_login',
                //     // sort: 'asc',
                //     width: 200
                // },
                // {
                //     label: 'Security Question?',
                //     field: 'security_question_enable',
                //     // sort: 'asc',
                //     width: 200
                // },
                {
                    label: 'Status',
                    field: 'status',
                    // sort: 'asc',
                    width: 200
                },
                {
                    label: 'Action',
                    field: 'action',
                    // sort: 'asc',
                    width: 200
                },
            ],
            rows: this.inactiveUsers
            },
        };
    }
    
    bindField(e){    
//      if(e.target.name == "approval_matrix_name"){
//          let value = e.target.value;
//          let charCode = value.charCodeAt(value.length - 1);
//          if (charCode > 31 && (charCode < 48 || charCode > 57)) {
//              return false;
//          }
//      }
      
      console.log("e.target.name -- "+e.target.name+" --- e.target.value -- "+e.target.value);
      console.log(this.state[e.target.name]);

      let target_name = e.target.name;
      let target_value = e.target.value;
      setTimeout(() => {
      		this.setState({ 
      			target_name: target_value
  		    });
      }, 100);
      
    }
    
    openModal() { 
        // this.props.dispatch(profileActions.getAll());    
        this.setState({ modalIsOpen: true, userRole: 1 });
    }
    
    afterOpenModal() {       
    //this.subtitle.style.color = "#f00";
    }

    closeModal() {    
    this.setState({ modalIsOpen: false });        
    }
    checkQuestionsAnswer(val,type=null){
        if(type=='answer')
        {
            if(this.state.selectedQues){
                for(var each of this.state.selectedQues){
                    if(each.question_id==val.question_id)return each.answer;
                }
            }else{
                return '';
            }
        }else{
            if(this.state.selectedQues){
                for(var each of this.state.selectedQues){
                    if(each.question_id==val.question_id)return true;
                }
            }else{
                return false;
            }
        }
    }
    openModalEdituser(user) { 
        //debugger;
        // this.props.dispatch(profileActions.getAll());
        if(user.security_question_enable==1){
            this.getUserSecurityQuestions(user.id)
        }
        this.setState({userDetails: user, userRole: user.user_role, profileTemplateId: user.profile_id});
        this.setState({ modalIsOpenEdituser: true });
    }

    afterOpenModalEdituser() {       
    //this.subtitle.style.color = "#f00";
        setTimeout(function(){ 
            document.getElementById("input-email").addEventListener("mousedown", function(event){
                event.preventDefault();
            });
            document.getElementById("input-name").addEventListener("mousedown", function(event){
                event.preventDefault();
            });
            document.getElementById("input-mobile").addEventListener("mousedown", function(event){
                event.preventDefault();
            });
        }, 
        100);        
    }

    closeModalEdituser() {
    this.setState({ modalIsOpenEdituser: false });
    }
    
    handleDeleteUser(id) {
        return (e) => this.props.dispatch(userActions.delete(id));
    }

    handlePassword = (event) => {
        this.state.userPassword = event.target.value;
    }
    handleConfirmPassword = (event) => {
        if (event.target.value !== this.state.userPassword) {
            toast.error("Password Mismatch");                     
        }
    }
    
    handleMobileNo(e){
          const re = /^[0-9\b]+$/;
      
          // if value is not blank, then test the regex
      
          if (e.target.value === '' || re.test(e.target.value)) {
             this.setState({userMobileNo: e.target.value})
          }
    }

    handleUserRole(e){
        this.setState({
            userRole: e.value
        });
    }

    handleProfileTemplateId(e){
        this.setState({
            profileTemplateId: e.value
        });
    }

    handleEditMobileNo(e){
        const re = /^[0-9\b]+$/;
    
        // if value is not blank, then test the regex
    
        if (e.target.value === '' || re.test(e.target.value)) {
           this.setState(Object.assign(userDetails,{mobile: e.target.value}));
        }
    }
    addUserRequest = e => {
        e.preventDefault();
        var form = document.querySelector("#addUser");
        var formData = serialize(form, { hash: true });
        formData.otp_status = (formData.otp_status ? 1 : 0);
        formData.google_auth_login = (formData.google_auth_login ? 1 : 0);
        formData.security_question_enable = (formData.security_question_enable ? 1 : 0);
        //formData.profile_id = this.state.profile_id;
        var quesAndans = []
        if(formData.security_question_enable==1){
            if(!formData.questions){
                toast.error("Please select 4 questions.");
                return false;
            }
            var questions = formData.questions.filter(function (el) {
                return el != null;
            });
            var answers = formData.answers.filter(function (el) {
                return el != null;
            });
            if(questions.length<4){
                toast.error("Please select 4 questions.");
                return false;
            }else if(answers.length>4){
                toast.error("Please select maximum of 4 questions.");
                return false;
            }else{
                 for(var question_id in questions){
                     if(!answers[question_id])continue;
                    var each ={}
                    each.question_id = questions[question_id], 
                    each.answer = answers[question_id]
                    quesAndans.push(each)
                 }
                 if(quesAndans.length!=4){
                    toast.error("Please select 4 questions and answers.");
                    return false; 
                 }
             }
        }
        formData.quesAndans = quesAndans;
        //debugger;
        let validatPasswordPoliy = validation.c4cCheckPasswordPolicy(
            formData.userPassword,
            formData.userDisplayName,
            "",
            "",
            formData.userMobile,
            formData.userEmail,
            "",
            []);

        if(!validatPasswordPoliy[0]){
            toast.error(validatPasswordPoliy[1]);
            return false;
        }
        else if(!formData.userCPassword){
            toast.error("Please enter Confirm Password");
            return false;
        }
        else if(formData.userPassword != formData.userCPassword){
            toast.error("Password and Confirm Password don't match");
            return false;
        }
        
        //UnComment to Enable Profile Template
        /*if(formData.userRole == 2){
            formData.profile_id =  $("#drpProfileTemplate").val();
        }*/

        this.props.dispatch(userActions.addUserRequest(formData,this.props.user.data.clientid));
        // this.setState({ modalIsOpen: false });
        // this.props.dispatch(userActions.getAll(this.props.user.data.clientid));     
    };

    editOtpChange = e => {
        this.state.userDetails.otp_status = e.checked;
        this.setState({
            userDetails: this.state.userDetails
        });
    }

    editGoogleAuthChange = e => {
        this.state.userDetails.google_auth_login = e.checked;
        this.setState({
            userDetails: this.state.userDetails
        });
    }

    editSecurityQuestionChange = e => {
        this.getSecurityQuestions();
        this.state.userDetails.security_question_enable = e.checked;
        this.setState({
            userDetails: this.state.userDetails,
            viewEditQuestions: (e.checked)?1:0
        });
    }
    addSecurityQuestionChange = e => {
        this.getSecurityQuestions();
        this.setState({
            viewAddQuestions: (e.checked)?1:0
        });
    }
    
    editUserRequest = e => {
        e.preventDefault();  
        var form = document.querySelector("#editUser");
        var formData = serialize(form, { hash: true });
        formData.editotp_status = (formData.editotp_status ? 1 : 0);
        formData.editgoogle_auth_login = (formData.editgoogle_auth_login ? 1 : 0);
        formData.security_question_enable = (formData.security_question_enable ? 1 : 0);
        var quesAndans = []
        if(formData.security_question_enable==1){
            if(!formData.questions){
                toast.error("Please select 4 questions.");
                return false;
            }
            var questions = formData.questions.filter(function (el) {
                return el != null;
            });
            var answers = formData.answers.filter(function (el) {
                return el != null;
            });
            if(questions.length<4){
                toast.error("Please select 4 questions.");
                return false;
            }else if(answers.length>4){
                toast.error("Please select maximum of 4 questions.");
                return false;
            }else{
                 for(var question_id in questions){
                     if(!answers[question_id])continue;
                    var each ={}
                    each.question_id = questions[question_id], 
                    each.answer = answers[question_id]
                    quesAndans.push(each)
                 }
                 if(quesAndans.length!=4){
                    toast.error("Please select 4 questions and answers.");
                    return false; 
                 }
             }
        }
        formData.quesAndans = quesAndans;
        
        if(this.state.userRole == 2){
            formData.profile_id =  $("#drpProfileTemplate").val();
        }

        this.props.dispatch(userActions.editUserRequest(formData,this.props.user.data.clientid));
        // this.setState({ modalIsOpenEdituser: false });
        // this.props.dispatch(userActions.getAll(this.props.user.data.clientid));    
    };

    callActiveTab = (e, flag) => {
        //e.preventDefault();     
        this.setState({
            isActiveUserTabActive: flag
        });
    }

    componentDidMount(){
        //UnComment to Enable Profile Template
        //this.getProfileTemplateData();
    	this.getBuList();
    }
    
    getBuList(){
    	this.setState({
    		BuData: []
    	});

	    var frmData={
	    		"record_status": "1",
	    }
	    
	    const requestOptions = {
	        method: 'POST',
	        headers: { ...authHeader(), 'Content-Type': 'application/json' },
	        body: JSON.stringify(ucpEncrypt(frmData)),
	    };
	
	    fetch(`${config.apiUrl}/secureApi/bu/list`, requestOptions).then(response  => {
	        response.text().then(text => {
	            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	            
	            if (response.ok) {
	                var result=(data.value ? data.value : data)
	                console.log("BuData result --- ",result);
	            	if(result.status == "success"){
	                    this.setState({
	                    	BuData: result.data
	                    });
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
    
    getUserSecurityQuestions(user_id){
        this.setState({
           selectedQues: []
        });
        var requestOptions = {
            method: 'GET',
            headers: { ...authHeader(), 'Content-Type': 'application/json' }
        };
        fetch(`${config.apiUrl}/securityQuestions/user/?user_id=${user_id}`, requestOptions).then(response  => {
            return response.text().then(text => {
                let data = text && JSON.parse(text);
                if(data && data.data && data.data.length > 0){
                  this.setState({
                    selectedQues: data.data
                  });
                  this.getSecurityQuestions();
                }
            });
        });
    }
    getSecurityQuestions(){
        this.setState({
           questions: [],
          dataList: ""
        });
        var requestOptions = {
            method: 'GET',
            headers: { ...authHeader(), 'Content-Type': 'application/json' }
        };
        fetch(`${config.apiUrl}/securityQuestions`, requestOptions).then(response  => {
            return response.text().then(text => {
                let data = text && JSON.parse(text);
                if(data && data.data && data.data.length > 0){
                  this.setState({
                    questions: data.data
                  });
                }
            });
        });
    }
    getProfileTemplateData(){
        this.setState({
          isProfileTemplateDataLoading: true,
          dataList: ""
        });
  
        const requestOptions = {
            method: 'GET',
            headers: { ...authHeader(), 'Content-Type': 'application/json' }
        };
  
        fetch(`${config.apiUrl}/secureApi/menus/getUserProfile/` + this.state.clientid, requestOptions).then(response  => this.handleDataListResponse(response));
    }
  
    handleDataListResponse(response) {
      return response.text().then(text => {
          
          let data = text && JSON.parse(text);
          
          if(data && data.data && data.data.length > 0){
            this.setState({
              profileTemplateList: data.data
            });
          }

          this.setState({
            isProfileTemplateDataLoading: false
          }) 
      });
    }

    loadProfileInfo(){

        let profileList = this.props.profileList.data;

        let finalArr = profileList.map((element, index) => {
            return <option
                    key={`profile${index}`}
                    value={element.profile_id}
                    className="form-control"                      
                >{element.profile_name}</option>;
       });

       console.log(finalArr);

       return finalArr;
    }

    handleUserProfile(event){
        this.setState({[event.target.name]: event.target.value});
    }
    
    render() {
        const { user, users } = this.props; 
        
        const regex = /(<([^>]+)>)/ig;
        return (
            <div>
                <div className="row">
                    <div className="col-md-12 mb-2">
                        <h5 className="color">User Management</h5>
                    </div>
                </div>

                <div className="main-tab mb-4">
                    <div className="tabs-wrapper">
                        <button onClick={() => this.callActiveTab(this, true)} className={"btn btn-sm tab-wrapper " + (this.state.isActiveUserTabActive && "active-tab")}> Active Users</button>
                        <button onClick={() => this.callActiveTab(this, false)} className={"btn btn-sm tab-wrapper " + (!this.state.isActiveUserTabActive && "active-tab")}> Inactive Users</button>
                    </div>
                
                    <div>
                        {(this.state.user_role == 1 && this.state.isActiveUserTabActive) &&
                            <div className="row pt-3">
                                <div className="col-md-12">
                                    <div className="text-right">
                                        <button
                                            className="btn btn-sm btn-primary mr-3"
                                            onClick={this.openModal}
                                        > <i className="fa fa-plus" /> Add User
                                        </button>
                                    </div>
                                </div>
                            </div>
                        }

                        <br/>

                        {this.state.isActiveUserTabActive ?
                            <div className="pt-3 pr-3 pl-3 pb-0">
                                <MDBDataTable
                                striped
                                hover
                                data={this.state.activeUsers}
                                />
                            </div>
                        :
                            <div className="pt-3 pr-3 pl-3 pb-0">
                                <MDBDataTable
                                striped
                                hover
                                data={this.state.inactiveUsers}
                                />
                            </div>
                        }
                    </div>
                </div>
                <Modal
                    isOpen={this.state.modalIsOpen}
                    onAfterOpen={this.afterOpenModal}
                    onRequestClose={this.closeModal}              
                    contentLabel="Add User Modal"
                    >
                                       
                    <h2 style={{color:'red'}}>
                        Add User <span className="float-right cursor-pointer" onClick={this.closeModal}><i className="fa fa-times" /></span>
                    </h2>

                    <div className="col-md-12">
                        <div className="panel panel-default" />
                        <form
                        name="addUser"
                        id="addUser"
                        method="post"
                        onSubmit={this.addUserRequest}
                        >
                        <div className="form-group">
                            <label htmlFor="userEmail">Email<span className="star-mark">*</span></label>
                            <input
                            type="email"
                            className="form-control"
                            name="userEmail"
                            required                      
                            placeholder="Enter Email Address : xyz@gmail.com"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="userPassword">Password<span className="star-mark">*</span></label>
                            <input
                            type="password"
                            className="form-control"
                            name="userPassword"
                            required
                            onChange={event => this.handlePassword(event)}                      
                            placeholder="Password"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="userCPassword">Confirm Password<span className="star-mark">*</span></label>
                            <input
                            type="password"
                            className="form-control"
                            name="userCPassword"
                            required
                            onBlur={event => this.handleConfirmPassword(event)}                  
                            placeholder="Confirm Password"
                            />                    
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="userDisplayName">Display Name<span className="star-mark">*</span></label>
                            <input
                            type="text"
                            className="form-control"
                            name="userDisplayName"
                            required                      
                            placeholder="Enter Display Name"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="userMobile">Mobile<span className="star-mark">*</span></label>
                            <input
                            type="text"
                            className="form-control"
                            name="userMobile"
                            value={this.state.userMobileNo}
                            maxLength="10"
                            required
                            onChange={event => this.handleMobileNo(event)}
                            placeholder="Enter Mobile"
                            />
                        </div>
                        {/* <div className="form-group">
                            <label htmlFor="userRole">Role<span className="star-mark">*</span></label>                    
                            <select
                            className="form-control"
                            required
                            name="userRole"
                            value={this.state.userRole}
                            onChange={e => this.handleUserRole(e.target)}
                            >                   
                                <option value="1">Admin</option>
                                <option value="2">User</option>                      
                            </select>                  
                        </div> */}
                        {/* <div className="form-group">
                            <label htmlFor="bu_id">BU<span className="star-mark">*</span></label>                    
                            <select
                            className="form-control"
                            required
                            name="bu_id"
                            value={this.state.bu_id}
                            onChange={e => this.bindField(e)}
                            >                   
	                            <option value="">--SELECT--</option>
	                            {this.state.BuData.map((item, index) =>
		                            <option value={item.id} key={index}>
		                            {item.bu_name}
		                            </option>
		                        )}
                            </select>                  
                        </div> */}
                        {/* <div className="form-group">
                            <label htmlFor="profile_id">Profile<span className="star-mark">*</span></label>                    
                            <select
                            className="form-control"
                            name="profile_id"
                            onChange={e => this.handleUserProfile(e)}
                            >     
                                <option value=''>No Profile</option>              
                                {this.props.profileList && this.loadProfileInfo()}                 
                            </select>                  
                        </div> */}
                        {/* <div className="form-group">
	                        <label htmlFor="provision_type">Provision Type<span className="star-mark">*</span></label>                    
	                        <select
	                        className="form-control"
	                        required
	                        name="provision_type" 
                            onChange={e => this.bindField(e)}                  
	                        >                   
	                        <option value="SAP">SAP</option>
	                        <option value="IAAS">IAAS</option>                      
	                        </select>
	                    </div> */}
                        {/*
                        //UnComment to Enable Profile Template
                        this.state.userRole == 2 &&
                        <div className="form-group position-relative">
                            <label>Profile Template<span className="star-mark">*</span></label>                    
                            <select
                            className="form-control"
                            id="drpProfileTemplate"
                            required
                            >                   
                            <option value="">--SELECT--</option>
                            {this.state.profileTemplateList && this.state.profileTemplateList.length > 0 && this.state.profileTemplateList.map((item, index) =>
                                <option value={item.profile_id}>
                                {item.profile_name}
                                </option>
                            )}
                            </select>
                            { this.state.isProfileTemplateDataLoading && 
                              <i className="fas fa-circle-notch icon-loading form-drp-loader-icon"></i>
                            }
                        </div>*/
                        }
                        {/* <fieldset className="fieldset-wrapper fieldset-wrapper-user">
                            <legend className="fieldset-legend color">Additional Security</legend>
                            <div className="control-group">
                                <div className="form-group pl-20">
                                    <input type="checkbox" className="form-check-input cursor-pointer" id="otp_status" name="otp_status"></input>
                                    <label className="form-check-label cursor-pointer" htmlFor="otp_status">Enable Dual Security with OTP while login to account ?</label>
                                </div>
                                <div className="form-group pl-20">
                                    <input type="checkbox" className="form-check-input cursor-pointer" id="google_auth_login" name="google_auth_login"></input>
                                    <label className="form-check-label cursor-pointer" htmlFor="google_auth_login">Enable Google Authenticator Security to account ?</label>
                                </div>
                                <div className="form-group pl-20">
                                    <input type="checkbox" className="form-check-input cursor-pointer" onChange={e => this.addSecurityQuestionChange(e.target)} id="security_question_enable" name="security_question_enable"></input>
                                    <label className="form-check-label cursor-pointer" htmlFor="security_question_enable">Enable Security Questions ?</label>
                                    {this.state.viewAddQuestions && <fieldset className="fieldset-wrapper fieldset-wrapper-user">
                                    <legend className="fieldset-legend color">Security Questions</legend>
                                    <div className="control-group">
                                    {this.state.questions.map((val,index)=>
                                        <div className="form-group pl-20">
                                            <input type="checkbox" value={val.question_id} className="form-check-input cursor-pointer" name={`questions[${val.question_id}]`}/>
                                            <label className="form-check-label cursor-pointer">{val.question}</label>
                                            <div className="form-group pl-20">
                                                <label className="form-check-label">Answer :&nbsp;</label>
                                                <input type="text" value={val.answer} name={`answers[${val.question_id}]`}/>
                                            </div>
                                        </div>
                                    )}
                                    </div>
                                    </fieldset>
                                    }
                                </div>
                            </div>
                        </fieldset> */}

                        <div className="form-group">
                            <input type="hidden" name="clientid" value={this.state.clientid} />
                            <input type="hidden" name="client_master_id" value={this.state.client_master_id} />
                            <button 
                            className={"btn btn-sm btn-primary float-right " + (users.submitLoading ? "no-access" : "")} disabled={users.submitLoading ? true : false}
                            >
                                {users.submitLoading && 
                                    <i className="fas fa-circle-notch icon-loading"></i>
                                }
                                Submit
                            </button>
                        </div>
                        </form>
                    </div>
                    </Modal>

                    <Modal
                    isOpen={this.state.modalIsOpenEdituser}
                    onAfterOpen={this.afterOpenModalEdituser}
                    onRequestClose={this.closeModalEdituser}              
                    contentLabel="Edit User"
                    >
                    <h2 style={{color:'red'}}>
                        Edit User <span className="float-right cursor-pointer" onClick={this.closeModalEdituser}><i className="fa fa-times" /></span>
                    </h2>

                    <div className="col-md-12">
                        <div className="panel panel-default" />
                        <form
                        name="editUser"
                        id="editUser"
                        method="post"
                        onSubmit={this.editUserRequest}
                        >
                        <div className="form-group">
                            <label htmlFor="edituserEmail">Email</label>
                            <input
                            id="input-email"
                            type="email"
                            className="form-control readOnly"
                            name="edituserEmail"
                            readOnly                                           
                            defaultValue={this.state.userDetails.email}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="edituserDisplayName">Display Name</label>
                            <input
                            id="input-name"
                            type="text"
                            className="form-control readOnly"
                            name="edituserDisplayName"
                            readOnly                                           
                            defaultValue={this.state.userDetails.display_name}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="edituserMobile">Mobile</label>
                            <input
                            id="input-mobile"
                            type="text"
                            className="form-control readOnly"
                            name="edituserMobile"
                            onChange={event => this.handleEditMobileNo(event)}
                            readOnly                   
                            defaultValue={this.state.userDetails.mobile}
                            />
                        </div>
                        {/* <div className="form-group">
                            <label htmlFor="edituserRole">Role<span className="star-mark">*</span></label>                    
                            <select
                            className="form-control"
                            required
                            name="edituserRole" 
                            //defaultValue={this.state.userDetails.user_role}   
                            value={this.state.userRole}
                            onChange={e => this.handleUserRole(e.target)}                 
                            >                   
                            <option value="1">Admin</option>
                            <option value="2">User</option>                      
                            </select>                  
                        </div> */}
                        {/* <div className="form-group">
	                        <label htmlFor="editbu_id">BU<span className="star-mark">*</span></label>                    
	                        <select
	                        className="form-control"
	                        required
	                        name="editbu_id"
	                        onChange={e => this.bindField(e)}
                            defaultValue={this.state.userDetails.bu_id}
	                        >                   
	                            <option value="">--SELECT--</option>
	                            {this.state.BuData.map((item, index) =>
		                            <option value={item.id} key={index}>
		                            {item.bu_name}
		                            </option>
		                        )}
	                        </select>                  
	                    </div> */}
                        {/* <div className="form-group">
                            <label htmlFor="editUserProfile">Profile<span className="star-mark">*</span></label>                    
                            <select
                            className="form-control"
                            name="editUserProfile"
                            onChange={e => this.handleUserProfile(e)}
                            defaultValue={this.state.userDetails.profile_id}
                            >           
                                <option value=''>No Profile</option>        
                                {this.props.profileList && this.loadProfileInfo()}                 
                            </select>                  
                        </div> */}
                        {/*
                        //UnComment to Enable Profile Template
                        this.state.userRole == 2 &&
                        <div className="form-group position-relative">
                            <label>Profile Template<span className="star-mark">*</span></label>                    
                            <select
                            className="form-control"
                            id="drpProfileTemplate"
                            required
                            onChange={e => this.handleProfileTemplateId(e.target)} 
                            value={this.state.profileTemplateId}
                            >                   
                            <option value="">--SELECT--</option>
                            {this.state.profileTemplateList && this.state.profileTemplateList.length > 0 && this.state.profileTemplateList.map((item, index) =>
                                <option value={item.profile_id}>
                                {item.profile_name}
                                </option>
                            )}
                            </select>
                            { this.state.isProfileTemplateDataLoading && 
                              <i className="fas fa-circle-notch icon-loading form-drp-loader-icon"></i>
                            }
                        </div>
                        */}
                        {/* <div className="form-group">
	                        <label htmlFor="edituserProvisionType">Provision Type<span className="star-mark">*</span></label>                    
	                        <select
	                        className="form-control"
	                        required
	                        name="edituserProvisionType" 
	                        defaultValue={this.state.userDetails.provision_type}                    
	                        >                   
	                        <option value="SAP">SAP</option>
	                        <option value="IAAS">IAAS</option>                      
	                        </select>
	                    </div> */}
                        <div className="form-group">
                            <label htmlFor="edituserStatus">Status<span className="star-mark">*</span></label>                    
                            <select
                            className="form-control"
                            required
                            name="edituserStatus" 
                            defaultValue={this.state.userDetails.status}                    
                            >                   
                            <option value="0">In Active</option>
                            <option value="1">Active</option>                      
                            </select>
                        </div>
                        
                        {/* <fieldset className="fieldset-wrapper fieldset-wrapper-user">
                            <legend className="fieldset-legend color">Additional Security</legend>
                            <div className="control-group">
                                <div className="form-group pl-20">
                                    <input type="checkbox" className="form-check-input cursor-pointer" onChange={e => this.editOtpChange(e.target)} checked={this.state.userDetails.otp_status ? true : false} id="editotp_status" name="editotp_status"></input>
                                    <label className="form-check-label cursor-pointer" htmlFor="editotp_status">Enable Mobile/Email Security with OTP while login to account ?</label>
                                </div>
                                <div className="form-group pl-20">
                                    <input type="checkbox" className="form-check-input cursor-pointer" onChange={e => this.editGoogleAuthChange(e.target)} checked={this.state.userDetails.google_auth_login ? true : false} id="editgoogle_auth_login" name="editgoogle_auth_login"></input>
                                    <label className="form-check-label cursor-pointer" htmlFor="editgoogle_auth_login">Enable Google Authenticator Security to account ?</label>
                                </div>
                                <div className="form-group pl-20">
                                    <input type="checkbox" className="form-check-input cursor-pointer" onChange={e => this.editSecurityQuestionChange(e.target)} checked={this.state.userDetails.security_question_enable ? true : false} id="security_question_enable" name="security_question_enable"></input>
                                    <label className="form-check-label cursor-pointer" htmlFor="security_question_enable">Enable Security Questions ?</label>
                                    {(this.state.viewEditQuestions || this.state.userDetails.security_question_enable) && <fieldset className="fieldset-wrapper fieldset-wrapper-user">
                                    <legend className="fieldset-legend color">Security Questions</legend>
                                    <div className="control-group">
                                    {this.state.questions.map((val,index)=>
                                        <div className="form-group pl-20">
                                            <input type="checkbox" value={val.question_id} defaultChecked={this.checkQuestionsAnswer(val)} className="form-check-input cursor-pointer" name={`questions[${val.question_id}]`}/>
                                            <label className="form-check-label cursor-pointer">{val.question}</label>
                                            <div className="form-group pl-20">
                                                <label className="form-check-label">Answer :&nbsp;</label>
                                                <input type="text" defaultValue={this.checkQuestionsAnswer(val,'answer')} name={`answers[${val.question_id}]`}/>
                                            </div>
                                        </div>
                                    )}
                                    </div>
                                    </fieldset>
                                    }
                                </div>
                            </div>
                        </fieldset> */}
                        <div className="form-group">
                            <input type="hidden" name="id" value={this.state.userDetails.id} />
                            <button 
                            className={"btn btn-sm btn-primary float-right " + (users.submitLoading ? "no-access" : "")} disabled={users.submitLoading ? true : false}
                            >
                                {users.submitLoading && 
                                    <i className="fas fa-circle-notch icon-loading"></i>
                                }
                                Update
                            </button>
                        </div>
                        </form>
                    </div>
                    </Modal>
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
      
    export default connect(mapStateToProps)(DatatablePage);
