import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { userActions, profileActions } from '../../_actions';
import { ApprovalMatrixActions } from './ApprovalMatrix.actions';
import { MDBDataTable } from 'mdbreact';
import { toast } from 'react-toastify';
var serialize = require("form-serialize");
import PageLoader from '../PageLoader';
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';
import config from 'config';
import { validation } from "../../_helpers/passwordPolicy";
import Select from 'react-select';
import { default as ReactSelect } from "react-select";
import { components } from "react-select";

const reactSelectComponentOption = (props) => {
	  return (
	    <div>
	      <components.Option {...props}>
	        <input
	          type="checkbox"
	          checked={props.isSelected}
	          onChange={() => null}
	        />{" "}
	        <label>{props.label}</label>
	      </components.Option>
	    </div>
	  );
	};
Modal.setAppElement("#app");
class ApprovalMatrixDataTablePage extends React.Component {
    constructor(props) {
        super(props);
        let user = JSON.parse(localStorage.getItem("user"));

        this.openModal = this.openModal.bind(this);
        this.afterOpenModal = this.afterOpenModal.bind(this);
        this.closeModal = this.closeModal.bind(this);

        this.openModalEditApprovalMatrix = this.openModalEditApprovalMatrix.bind(this);
        this.afterOpenModalEditApprovalMatrix = this.afterOpenModalEditApprovalMatrix.bind(this);
        this.closeModalEditApprovalMatrix = this.closeModalEditApprovalMatrix.bind(this);
        this.values=[];
        
        this.bindField = this.bindField.bind(this);
        this.handleBu = this.handleBu.bind(this);
        
        this.matricesRows=[];
        if(this.props.ApprovalMatrices && this.props.ApprovalMatrices.data && this.props.ApprovalMatrices.data.data && this.props.ApprovalMatrices.data.data.length > 0){
	        this.props.ApprovalMatrices.data.data.map((val, index) =>{
	            this.matricesRows[this.matricesRows.length]={
	                sno : (this.matricesRows.length +1),
	                approval_matrix_name:val.approval_matrix_name,
	                approval_matrix_level: val.approval_matrix_level,
	                bu_name:<span>{val.bu_name}
		                	<ul>
			                {val.mapped_users && val.mapped_users.length > 0 && val.mapped_users.map((item, index) =>
				                <li key={index}>
				                {item.email}
				                </li>
				            )}
				            </ul>
			            </span>,
	                status:((val.record_status == 1)?"Active":"Inactive"),
	                action : <span className="cursor-pointer" onClick={() => this.openModalEditApprovalMatrix(val)}><i className="fa fa-edit"></i> </span>
	            }
	        });
        }
        
        this.state = {
            user:user.data,
            clientid:   user.data.clientid,
            client_master_id:   user.data.client_master_id,
            user_role:  user.data.user_role,
            user_id: user.data.id,
            profiles: [],
            userDetails:[],
            userPassword: '',
            userCPassword: '',
            userMobileNo: '',
            modalIsOpen: false,
            modalIsOpenEdituser: false,
            isActiveUserTabActive: true,
            questions:[],
            viewAddQuestions:0,
            viewEditQuestions:0,
            profile_id: null,
            ApprovalLevelsData: [],
            editDetails : {},
            isEditSaveInprogress: false,
            addDetails : {},
            isAddSaveInprogress : false,
            BuData : [],
            BuUsersData : [],
            BuUsersDataMod : [],
            matricesData: {
                columns: [
                	{
                        label: 'S. No.',
                        field: 'sno',
                    },
                  {
                      label: 'Name',
                      field: 'approval_matrix_name',
                  },
                  {
                      label: 'Level',
                      field: 'approval_matrix_level',
                  },
                  {
                      label: 'BU',
                      field: 'bu_name',
                  },
                  {
                      label: 'Staus',
                      field: 'status',
                  },
                  {
                      label: 'Action',
                      field: 'action'
                  }
                ],
                rows: this.matricesRows
              },
          	optionSelected: null,
          	mapped_user : [],
          	mapped_user_ids : []
        };
        this.reactSelectHandleChange = this.reactSelectHandleChange.bind(this);
    }
    reactSelectHandleChange = (selected) => {
    	console.log("selected --- ", selected);
        this.setState({
          optionSelected: selected
        });
        
        let mapped_users = [];
      	let mapped_user_ids = [];
      	
      	if(selected.length > 0){
	      	let opt;
      		for (var i=0, iLen=selected.length; i<iLen; i++) {
	  		    opt = selected[i];
	
	  		    if (opt.value != "") {
	  		    	mapped_users.push({"user_id":opt.value});
	  		    	mapped_user_ids.push(opt.value);
	  		    }
	  		}
      	}
  		console.log("mapped_users --- ", mapped_users);
  		console.log("mapped_user_ids --- ", mapped_user_ids);
      	if(this.state.modalIsOpenEditApprovalMatrix == true){
      		let editDetails = this.state.editDetails;
  			editDetails["mapped_users"] = mapped_users;
  			editDetails.mapped_user_ids = mapped_user_ids;
      		this.setState(prevState => ({ 
      			editDetails: editDetails
  		    }));
      	}else{
      		this.setState({
      			mapped_users: mapped_users,
      			mapped_user_ids : mapped_user_ids
        	});
      	}
      };
    
    bindField(e){    
//        if(e.target.name == "approval_matrix_name"){
//            let value = e.target.value;
//            let charCode = value.charCodeAt(value.length - 1);
//            if (charCode > 31 && (charCode < 48 || charCode > 57)) {
//                return false;
//            }
//        }
        
        console.log("e.target.name -- "+e.target.name+" --- e.target.value -- "+e.target.value);
        console.log(this.state[e.target.name]);

        let target_name = e.target.name;
        let target_value = e.target.value;
        setTimeout(() => {
        	let mapped_users = [];
        	if(target_name == "mapped_users"){
        		console.log("target_value ", target_value);
        		
        		var select = document.getElementById('mapped_users');
        		var options = select && select.options;
        		var opt;

        		for (var i=0, iLen=options.length; i<iLen; i++) {
        		    opt = options[i];

        		    if (opt.selected && opt.value != "") {
        		    	mapped_users.push({"user_id":opt.value});
        		    }
        		}
        		console.log("mapped_users --- ", mapped_users);
        	}
        	if(this.state.modalIsOpenEditApprovalMatrix == true){
        		let editDetails = this.state.editDetails;
        		if(target_name == "mapped_users"){
        			editDetails[target_name] = mapped_users;
        		}else{
        			editDetails[target_name] = target_value;
        		}
        		this.setState(prevState => ({ 
        			editDetails: editDetails
    		    }));
        	}else{
        		let addDetails = this.state.addDetails;
        		if(target_name == "mapped_users"){
        			addDetails[target_name] = mapped_users;
        		}else{
        			addDetails[target_name] = target_value;
        		}
        		this.setState(prevState => ({ 
        			addDetails: addDetails
    		    }));
        	}
        }, 100);
        
      }
    
    openModal() { 
        this.setState({ modalIsOpen: true });
    }
    
    afterOpenModal() {       
    //this.subtitle.style.color = "#f00";
    }

    closeModal() {    
    this.setState({ modalIsOpen: false });        
    }
    openModalEditApprovalMatrix(item) { 
        //debugger;
        this.setState({editDetails: JSON.parse(JSON.stringify(item))});
        this.setState({ modalIsOpenEditApprovalMatrix: true });
        if(item.bu_id){
    		this.handleBu(item.bu_id, item);
    	}
    }

    afterOpenModalEditApprovalMatrix() {       
    //this.subtitle.style.color = "#f00";
    }

    closeModalEditApprovalMatrix() {
    this.setState({ modalIsOpenEditApprovalMatrix: false });
    }
    
    addApprovalMatrixRequest = e => {
        e.preventDefault();
        var form = document.querySelector("#addApprovalMatrix");
        var formData = serialize(form, { hash: true });
        console.log("formData --- ",formData);
        if(formData.approval_matrix_name)
    	if(!formData.approval_matrix_name){
            toast.warn("Please enter Approval Matrix Name");
            return;
        }
        if(!formData.bu_id){
            toast.warn("Please select BU");
            return;
        }
//        if(!formData.mapped_users){
//            toast.warn("Please select BU Users");
//            return;
//        }

        if(!this.state.mapped_users || this.state.mapped_users.length == 0){
            toast.warn("Please select BU Users");
            return;
        }
        if(!formData.approval_matrix_level){
            toast.warn("Please select Level");
            return;
        }
        
        this.setState({
        	isAddSaveInprogress: true
        });

        let addDetails = this.state.addDetails;
        addDetails.mapped_users = this.state.mapped_users;
        addDetails.user_id = this.state.user_id;
        addDetails.record_status = 1;
        console.log("addDetails --- ",addDetails);
        
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(ucpEncrypt(addDetails)),
        };

        fetch(`${config.apiUrl}/secureApi/approvalMatrix/saveApprovalMatrix`, requestOptions).then(response  => {
            response.text().then(text => {
                const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
                
                this.setState({
                	isAddSaveInprogress: false
                });
                if (response.ok) {
                    var result=(data.value ? data.value : data)
                    console.log("saveApprovalMatrix result --- ",result);
                	if(result.status == "success"){
                		toast.success(result.message);
                		this.setState(prevState => ({
                			addDetails: []
                	    }));
                		this.props.dispatch(ApprovalMatrixActions.getAll({})); 
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

    editApprovalMatrixRequest = e => {
        e.preventDefault();  
        var form = document.querySelector("#editApprovalMatrix");
        var formData = serialize(form, { hash: true });
        let editDetails = this.state.editDetails;
        
        this.setState({
        	isEditSaveInprogress: true
        });

        editDetails.user_id = this.state.user_id;
        
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(ucpEncrypt(editDetails)),
        };

        fetch(`${config.apiUrl}/secureApi/approvalMatrix/saveApprovalMatrix`, requestOptions).then(response  => {
            response.text().then(text => {
                const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
                
                this.setState({
                	isEditSaveInprogress: false
                });
                if (response.ok) {
                    var result=(data.value ? data.value : data)
                    console.log("saveApprovalMatrix result --- ",result);
                	if(result.status == "success"){
                		toast.success(result.message);
                		this.setState(prevState => ({
                			editDetails: []
                	    }));
                		this.props.dispatch(ApprovalMatrixActions.getAll({})); 
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

    componentDidMount(){
    	this.getApprovalLevels();
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
    
    getApprovalLevels(){
  	  this.setState({
  		ApprovalLevelsData: []
  	  });

      var frmData={
		  "option_type": "Azure_Approval_Levels"
      }
      
      const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(ucpEncrypt(frmData)),
      };

      fetch(`${config.apiUrl}/secureApi/getOptionConfigJsonData`, requestOptions).then(response  => {
          response.text().then(text => {
              const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
              
              if (response.ok) {
                  var result=(data.value ? data.value : data)
                  console.log("ApprovalLevelsData result --- ",result);
              	if(result.status == "success"){
                      this.setState({
                    	  ApprovalLevelsData: result.data
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
    
    /*handleBu(bu){
    	this.setState({
    		BuUsersData: [],
    		BuUsersDataMod : [],
    		optionSelected : null
    	});
    	
        if(!bu){
            toast.warn("Please select BU");
            return;
        }

	    var frmData={
    		"record_status": "1",
    	    "bu_id": bu,
    	    "clientid": this.state.clientid
	    }
	    
	    const requestOptions = {
	        method: 'POST',
	        headers: { ...authHeader(), 'Content-Type': 'application/json' },
	        body: JSON.stringify(ucpEncrypt(frmData)),
	    };
	
	    fetch(`${config.apiUrl}/secureApi/bu/getAllBuUsers`, requestOptions).then(response  => {
	        response.text().then(text => {
	            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	            
	            if (response.ok) {
	                var result=(data.value ? data.value : data)
	                console.log("BuUsersData result --- ",result);
	                let optionSelected = [];
	            	if(result.status == "success"){
	            		let BuUsersDataMod = [];
	            		for(let i=0; i< result.data.length; i++){
	            			console.log("BuUsersData result.data[i] --- ",result.data[i]);
	            			BuUsersDataMod.push({ value: result.data[i].id, label: result.data[i].email });
	            			if(typeof editDetails != 'undefined'
	            				&& typeof editDetails.mapped_user_ids != 'undefined'
            					&& editDetails.mapped_user_ids.length > 0
            					){
	            				console.log("editDetails.mapped_user_ids -- ", editDetails.mapped_user_ids);
	            				console.log("editDetails.mapped_user_ids -- ", result.data[i].id + " ==== " + editDetails.mapped_user_ids.indexOf(result.data[i].id));
	            				if(editDetails.mapped_user_ids.indexOf(result.data[i].id) !== -1){
	            					optionSelected.push({ value: result.data[i].id, label: result.data[i].email });
	            					console.log("optionSelected -- ", optionSelected);
	            				}
	            			}
	            		}
	            		console.log("optionSelected -- ", optionSelected);
	            		this.setState({
            	          optionSelected: optionSelected
            	        });
	                    this.setState({
	                    	BuUsersData: result.data,
	                    	BuUsersDataMod : BuUsersDataMod
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
    }*/
    handleBu(bu, editDetails){
    	this.setState({
    		BuUsersData: [],
    		BuUsersDataMod : [],
    		optionSelected : null
    	});
    	
        if(!bu){
            toast.warn("Please select BU");
            return;
        }

	    var frmData={
    		"record_status": "1",
    	    "bu_id": bu,
    	    "clientid": this.state.clientid
	    }
	    
	    const requestOptions = {
	        method: 'POST',
	        headers: { ...authHeader(), 'Content-Type': 'application/json' },
	        body: JSON.stringify(ucpEncrypt(frmData)),
	    };
	
	    fetch(`${config.apiUrl}/secureApi/bu/getAllBuUsers`, requestOptions).then(response  => {
	        response.text().then(text => {
	            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	            
	            if (response.ok) {
	                var result=(data.value ? data.value : data)
	                console.log("BuUsersData result --- ",result);
	                let optionSelected = [];
	            	if(result.status == "success"){
	            		let BuUsersDataMod = [];
	            		for(let i=0; i< result.data.length; i++){
	            			console.log("BuUsersData result.data[i] --- ",result.data[i]);
	            			BuUsersDataMod.push({ value: result.data[i].id, label: result.data[i].email });
	            			if(typeof editDetails != 'undefined'
	            				&& typeof editDetails.mapped_user_ids != 'undefined'
            					&& editDetails.mapped_user_ids.length > 0
            					){
	            				console.log("editDetails.mapped_user_ids -- ", editDetails.mapped_user_ids);
	            				console.log("editDetails.mapped_user_ids -- ", result.data[i].id + " ==== " + editDetails.mapped_user_ids.indexOf(result.data[i].id));
	            				if(editDetails.mapped_user_ids.indexOf(result.data[i].id) !== -1){
	            					optionSelected.push({ value: result.data[i].id, label: result.data[i].email });
	            					console.log("optionSelected -- ", optionSelected);
	            				}
	            			}
	            		}
	            		console.log("optionSelected -- ", optionSelected);
	            		this.setState({
            	          optionSelected: optionSelected
            	        });
	                    this.setState({
	                    	BuUsersData: result.data,
	                    	BuUsersDataMod : BuUsersDataMod
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

    render() {
        const { user, ApprovalMatrices } = this.props; 
//        console.log(ApprovalMatrices);
        
        const regex = /(<([^>]+)>)/ig;
        return (
            <div>
                <div className="row">
                    <div className="col-md-12 mb-2">
                        <h5 className="color">Approval Management</h5>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <div className="text-right">
                            <button
                                className="btn btn-sm btn-primary mr-3"
                                onClick={this.openModal}
                            > <i className="fa fa-plus" /> Add Approval Matrix
                            </button>
                        </div>
                        <br/>
                    </div>
                    
                    <div className="col-md-12">
                        <MDBDataTable
                        striped
                        hover
                        data={this.state.matricesData}
                        />
                    </div>
                </div>
                <div className="col-lg-6">
	                <div className="form-group row">
	                    <div className="col-sm-12">
	                    	<span className="star-mark">*</span> Level 1 is LOW & Level 5 is High
	                    </div>
	                </div>
	            </div>
                <Modal
                    isOpen={this.state.modalIsOpen}
                    onAfterOpen={this.afterOpenModal}
                    onRequestClose={this.closeModal}              
                    contentLabel="Add Approval Matrix Modal"
                    >
                                       
                    <h2 style={{color:'red'}}>
                        Add Approval Matrix <span className="float-right cursor-pointer" onClick={this.closeModal}><i className="fa fa-times" /></span>
                    </h2>

                    <div className="col-md-12">
                        <div className="panel panel-default" />
                        <form
                        name="addApprovalMatrix"
                        id="addApprovalMatrix"
                        method="post"
                        onSubmit={this.addApprovalMatrixRequest}
                        >
                        <div className="form-group">
                            <label htmlFor="approval_matrix_name">Approval Matrix Name<span className="star-mark">*</span></label>
                            <input
                            type="text"
                            className="form-control"
                            name="approval_matrix_name"
                            required                      
                            defaultValue={this.state.addDetails.approval_matrix_name}
                            onChange={this.bindField}
                            placeholder="Approval Matrix Name"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="bu_id">BU<span className="star-mark">*</span></label>                    
                            <select
                            className="form-control"
                            required
                            name="bu_id"
                            value={this.state.addDetails.bu_id}
                            onChange={e => {this.handleBu(e.target.value); this.bindField(e)}}
                            >                   
                                <option value="">--SELECT--</option>
                                {this.state.BuData.map((item, index) =>
		                            <option value={item.id} key={index}>
		                            {item.bu_name}
		                            </option>
		                        )}
                            </select>                  
                        </div>
                        {/*<div className="form-group">
	                        <label htmlFor="mapped_users">BU Users<span className="star-mark">*</span></label>                    
	                        <select
	                        className="form-control"
	                        required
	                        name="mapped_users" id="mapped_users"
                        	multiple
                        	onChange={this.bindField}
	                        >                   
	                            <option value="">--SELECT--</option>
	                            {this.state.BuUsersData.map((item, index) =>
		                            <option value={item.id} key={index}>
		                            {item.email}
		                            </option>
		                        )}
	                        </select>                  
	                    </div>*/}
	                    <div className="form-group">
		                    <label htmlFor="mapped_users">BU Users<span className="star-mark">*</span></label>                    
		                    <span
			                    className="d-inline-block"
			                    data-toggle="popover"
			                    data-trigger="focus"
			                    data-content="Please selecet user(s)" style={{width:'100%'}}
			                  >
			                    <ReactSelect
			                      options={this.state.BuUsersDataMod}
			                      isMulti
			                      closeMenuOnSelect={false}
			                      hideSelectedOptions={true}
			                      components={{
			                    	  reactSelectComponentOption
			                      }}
			                      onChange={this.reactSelectHandleChange}
			                      allowSelectAll={true}
			                      value={this.state.optionSelected}
			                    />
		                    </span>
	                	</div>
                        <div className="form-group">
	                        <label htmlFor="approval_matrix_level">Level<span className="star-mark">*</span></label>                    
	                        <select
	                        className="form-control"
	                        required
	                        name="approval_matrix_level" 
	                        defaultValue={this.state.addDetails.approval_matrix_level}   
	                        onChange={this.bindField}
	                        >       
	                        	<option value="">--SELECT--</option>
	                            {this.state.ApprovalLevelsData.map((item, index) =>
		                            <option value={item.value} key={index}>
		                            {item.value}
		                            </option>
		                        )}
	                        </select>                  
	                    </div>

                        <div className="form-group">
                            <input type="hidden" name="clientid" value={this.state.clientid} />
                            <input type="hidden" name="client_master_id" value={this.state.client_master_id} />
                            <button 
                            className={"btn btn-sm btn-primary float-right " + (this.state.isAddSaveInprogress ? "no-access" : "")} disabled={this.state.isAddSaveInprogress ? true : false}
                            >
                                {this.state.isAddSaveInprogress && 
                                    <i className="fas fa-circle-notch icon-loading"></i>
                                }
                                Submit
                            </button>
                        </div>
                        </form>
                    </div>
                    </Modal>

                    <Modal
                    isOpen={this.state.modalIsOpenEditApprovalMatrix}
                    onAfterOpen={this.afterOpenModalEditApprovalMatrix}
                    onRequestClose={this.closeModalEditApprovalMatrix}              
                    contentLabel="Edit Approval Matrix"
                    >
                    <h2 style={{color:'red'}}>
                        Edit Approval Matrix <span className="float-right cursor-pointer" onClick={this.closeModalEditApprovalMatrix}><i className="fa fa-times" /></span>
                    </h2>

                    <div className="col-md-12">
                        <div className="panel panel-default" />
                        <form
                        name="editApprovalMatrix"
                        id="editApprovalMatrix"
                        method="post"
                        onSubmit={this.editApprovalMatrixRequest}
                        >
                        <div className="form-group">
                            <label>Approval Matrix Name</label> :&nbsp;
                            {this.state.editDetails.approval_matrix_name}
                        </div>
                        {/*<div className="form-group">
                            <label>BU Unit</label> :&nbsp;
                            {this.state.editDetails.bu_name}
                        </div>
                        <div className="form-group">
                            <label>BU Users</label> :&nbsp;
                            <ul>
                            {this.state.editDetails.mapped_users && this.state.editDetails.mapped_users.map((item, index) =>
                                <li key={index}>
                                {item.email}
                                </li>
                            )}
                            </ul>
                        </div>*/}
                        <div className="form-group">
	                        <label htmlFor="bu_id">BU<span className="star-mark">*</span></label>                    
	                        <select
	                        className="form-control"
	                        required
	                        name="bu_id"
	                        value={this.state.editDetails.bu_id}
	                        onChange={e => {this.handleBu(e.target.value); this.bindField(e)}}
	                        >                   
	                            <option value="">--SELECT--</option>
	                            {this.state.BuData.map((item, index) =>
		                            <option value={item.id} key={index}>
		                            {item.bu_name}
		                            </option>
		                        )}
	                        </select>                  
	                    </div>
	                    {/*<div className="form-group">
	                        <label htmlFor="mapped_users">BU Users<span className="star-mark">*</span></label>                    
	                        <select
	                        className="form-control"
	                        required
	                        name="mapped_users" id="mapped_users"
	                    	multiple
	                    	onChange={this.bindField}
	                        >                   
	                            <option value="">--SELECT--</option>
	                            {this.state.BuUsersData.map((item, index) =>
		                            <option value={item.id} key={index}>
		                            {item.email}
		                            </option>
		                        )}
	                        </select>                  
	                    </div>*/}
	                    <div className="form-group">
		                    <label htmlFor="mapped_users">BU Users<span className="star-mark">*</span></label>                    
		                    <span
			                    className="d-inline-block"
			                    data-toggle="popover"
			                    data-trigger="focus"
			                    data-content="Please selecet user(s)" style={{width:'100%'}}
			                  >
			                    <ReactSelect
			                      options={this.state.BuUsersDataMod}
			                      isMulti
			                      closeMenuOnSelect={false}
			                      hideSelectedOptions={true}
			                      components={{
			                    	  reactSelectComponentOption
			                      }}
			                      onChange={this.reactSelectHandleChange}
			                      allowSelectAll={true}
			                      value={this.state.optionSelected}
			                    />
		                    </span>
	                	</div>
                        <div className="form-group">
                            <label htmlFor="approval_matrix_level">Level<span className="star-mark">*</span></label>                    
                            <select
                            className="form-control"
                            required
                            name="approval_matrix_level" 
                            defaultValue={this.state.editDetails.approval_matrix_level}   
                            onChange={this.bindField}
                            >                   
	                            {this.state.ApprovalLevelsData.map((item, index) =>
		                            <option value={item.value} key={index}>
		                            {item.value}
		                            </option>
		                        )}
                            </select>                  
                        </div>
                        <div className="form-group">
                            <label htmlFor="record_status">Status<span className="star-mark">*</span></label>                    
                            <select
                            className="form-control"
                            required
                            name="record_status" 
                        	onChange={this.bindField}
                            defaultValue={this.state.editDetails.record_status}
                            >                   
                            <option value="0">In Active</option>
                            <option value="1">Active</option>                      
                            </select>
                        </div>
                        <div className="form-group">
                            <input type="hidden" name="id" value={this.state.editDetails.id} />
                            <button 
                            className={"btn btn-sm btn-primary float-right " + (this.state.isEditSaveInprogress ? "no-access" : "")} disabled={this.state.isEditSaveInprogress ? true : false}
                            >
                            {this.state.isEditSaveInprogress && <i className="fas fa-circle-notch icon-loading"></i> }
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
    	const { ApprovalMatrices } = state;
        return {
        	ApprovalMatrices:ApprovalMatrices
        };
    }
      
    export default connect(mapStateToProps)(ApprovalMatrixDataTablePage);
