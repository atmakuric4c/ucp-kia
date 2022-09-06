import React, { useState } from 'react';
import { commonFns } from "../../_helpers/common";
import { connect } from 'react-redux';
import config from 'config';
import Modal from "react-modal";
import { azureActions } from './azure.actions';
import { MDBDataTable } from 'mdbreact';
import nl2br from "react-newline-to-break";
import utf8 from 'utf8';
import Moment from 'react-moment';
var serialize = require("form-serialize");
import ReactHtmlParser from 'react-html-parser';
import { toast } from 'react-toastify';
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';
import Select from 'react-select';
import { default as ReactSelect } from "react-select";
import { components } from "react-select";


Modal.setAppElement("#app");

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

class DatatablePage extends React.Component {
	
	
    constructor(props) {
        super(props);

        commonFns.fnCheckPageAuth(commonFns.menuUrls.azureResourceGroups);

        this.openModal = this.openModal.bind(this);
        this.afterOpenModal = this.afterOpenModal.bind(this);
        this.handleAzureSubscriptions = this.handleAzureSubscriptions.bind(this);
        this.closeModal = this.closeModal.bind(this);
        
        this.openModalEditResourceGroupBuUsers = this.openModalEditResourceGroupBuUsers.bind(this);
        this.afterOpenModalEditResourceGroupBuUsers = this.afterOpenModalEditResourceGroupBuUsers.bind(this);
        this.closeModalEditResourceGroupBuUsers = this.closeModalEditResourceGroupBuUsers.bind(this);
        
        this.bindField = this.bindField.bind(this);
        this.handleBu = this.handleBu.bind(this);
        
        this.values=[];
        this.props.azure.resourceGroups.map((val, index) =>{
            this.values[index]={
                SL:(index+1),
                //name : <a href={"#/azure/"+val.id}>{val.name}</a>,
                name:val.name,
                subscription_id:val.subscription_id,
                subscription_display_name:val.subscription_display_name,
                location_display_name:val.location_display_name,
                bu_name:<span>{val.bu_name}
                	<ul>
	                {val.mapped_users && val.mapped_users.map((item, index) =>
		                <li key={index}>
		                {item.email}
		                </li>
		            )}
		            </ul>
	            </span>,
                action : <span className="cursor-pointer" onClick={() => this.openModalEditResourceGroupBuUsers(val)}><i className="fa fa-edit"></i> </span>
            }
        })
        let user = JSON.parse(localStorage.getItem("user"));
        
        this.state = {
            user:user.data,
            clientid: user.data.clientid,
            user_id: user.data.id,
            subscription_list : [],
            subscription_locations : [],
            modalIsOpen:false,
            editDetails : {},
            isEditSaveInprogress: false,
            BuData : [],
            BuUsersData : [],
            BuUsersDataMod : [],
            data: {
                columns: [
                {
                    label: 'SL',
                    field: 'SL',
                    width: 50
                },
                {
                    label: 'Resource Group',
                    field: 'name',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Subscription ID',
                    field: 'subscription_id',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Subscription Label Name',
                    field: 'subscription_display_name',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Location',
                    field: 'location_display_name',
                    // sort: 'asc',
                    width: 150
                },
//                {
//                    label: 'Business Service',
//                    field: 'bu_name',
//                },
//                {
//                    label: 'Action',
//                    field: 'action'
//                }
            ],
            rows: this.values
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
      	if(this.state.modalIsOpenEditResourceGroupBuUsers == true){
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
    
    componentDidMount() {
        this.props.dispatch(azureActions.getAzureSubscriptions({clientid:this.state.clientid}));
        this.getBuList();
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
      	let mapped_users = [];
      	let mapped_user_ids = [];
      	if(target_name == "mapped_users"){
      		console.log("target_value ", target_value);
      		
      		var select = document.getElementById('mapped_users');
      		var options = select && select.options;
      		var opt;

      		console.log("options --- ", options);
      		for (var i=0, iLen=options.length; i<iLen; i++) {
      		    opt = options[i];

      		    if (opt.selected && opt.value != "") {
      		    	mapped_users.push({"user_id":opt.value});
      		    	mapped_user_ids.push(opt.value);
      		    }
      		}
      		console.log("mapped_users --- ", mapped_users);
      		console.log("mapped_user_ids --- ", mapped_user_ids);
      	}
      	if(this.state.modalIsOpenEditResourceGroupBuUsers == true){
      		let editDetails = this.state.editDetails;
      		if(target_name == "mapped_users"){
      			editDetails[target_name] = mapped_users;
      			editDetails.mapped_user_ids = mapped_user_ids;
      		}else{
      			editDetails[target_name] = target_value;
      		}
      		this.setState(prevState => ({ 
      			editDetails: editDetails
  		    }));
      	}
      }, 100);
      
    }
    
    openModalEditResourceGroupBuUsers(item) { 
        //debugger;
    	if(item.bu_id){
    		this.handleBu(item.bu_id, item);
    	}
        this.setState({editDetails: item});
        this.setState({ modalIsOpenEditResourceGroupBuUsers: true });
    }

    afterOpenModalEditResourceGroupBuUsers() {       
    //this.subtitle.style.color = "#f00";
    }

    closeModalEditResourceGroupBuUsers() {
    this.setState({ modalIsOpenEditResourceGroupBuUsers: false });
    }

    editResourceGroupBuUsersRequest = e => {
        e.preventDefault();  
        var form = document.querySelector("#editResourceGroupBuUsers");
        var formData = serialize(form, { hash: true });
        let editDetails = this.state.editDetails;
        
        if(!formData.bu_id){
            toast.warn("Please select BU");
            return;
        }
        if(!this.state.editDetails.mapped_users || this.state.editDetails.mapped_users.length == 0){
            toast.warn("Please select BU Users");
            return;
        }
        
        
        this.setState({
        	isEditSaveInprogress: true
        });

        editDetails.user_id = this.state.user_id;
        
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(ucpEncrypt(editDetails)),
        };

        fetch(`${config.apiUrl}/secureApi/azure/saveResourceGroupBuUsers`, requestOptions).then(response  => {
            response.text().then(text => {
                const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
                
                this.setState({
                	isEditSaveInprogress: false
                });
                if (response.ok) {
                    var result=(data.value ? data.value : data)
                    console.log("saveResourceGroupBuUsers result --- ",result);
                	if(result.status == "success"){
                		toast.success(result.message);
                		this.setState(prevState => ({
                			editDetails: [],
                			modalIsOpenEditResourceGroupBuUsers: false
                	    }));
                		this.props.dispatch(azureActions.getAzureResourceGroups({clientid:this.state.clientid}));
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

    openModal() { 
        this.setState({ modalIsOpen: true });
    }
    
    afterOpenModal() {       
    //this.subtitle.style.color = "#f00";
    }

    closeModal() {
        this.setState({ modalIsOpen: false });        
    }

    handleAzureSubscriptions = (subscription) => {
        if(subscription != ''){
            this.props.dispatch(azureActions.getAzureSubscriptionLocations({clientid:this.state.clientid,subscription:subscription}));
        }
    }

    addResourceGroupRequest = e => {
        e.preventDefault();      
        var form = document.querySelector("#addResourceGroup");
        var formData = serialize(form, { hash: true });
        
        if(!formData.bu_id){
            toast.warn("Please select BU");
            return;
        }
        if(!formData.mapped_users){
            toast.warn("Please select BU Users");
            return;
        }

        const re = /^[-\w\._\(\)]+$/;
        // if value is not blank, then test the regex
        if (formData.name != '' && !re.test(formData.name)) {
            toast.error("Invalid Resource Group Name");
        }else{
            //this.props.dispatch(azureActions.addAzureResourceGroups(formData,this.state.clientid));

            this.setState({
                is_add_network_inprogress: true
            });

            const requestOptions = {
                method: 'POST',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify(ucpEncrypt(formData))
            };
          
            fetch(`${config.apiUrl}/secureApi/azure/addAzureResourceGroups`, requestOptions).then(response  => this.handleAddResourceGroupResponse(response));
        }
    };

    
  handleAddResourceGroupResponse(response, stateName) {
    return response.text().then(data => {
      data = (data && JSON.parse(ucpDecrypt(JSON.parse(data))) ? JSON.parse(ucpDecrypt(JSON.parse(data))) : "");

      this.setState({
        is_add_network_inprogress: false
      });

      if(data.status != "success"){
        toast.error(data.message ? data.message : "Unable to Resource Group");
      }
      else {
        toast.success("Resource Group has been added Successfully!");

        this.closeModal();

        setTimeout(() => {
          location.reload(true);
        }, 2000);
      }   
    });
  }
  
    
    render() {
        const { azure } = this.props; 
        let subscription_list = this.props.azure.subscription_list; 
        let subscription_locations = this.props.azure.subscription_locations; 
        const { plainArray, objectArray, selectedValues, options } = this.state;
        
        return (
            <div className="container-fluid main-body">
            {subscription_list && subscription_list.length == 0 && <h5 className="txt-error-icon">Please contact Cloud4C support to Activate the Azure Subscriptions in UCP</h5>}
                <div className="row">
                    <div className="col-md-6">
                    <h5 className="color">Azure Resource Groups</h5>
                    </div>
                    <div className="col-md-6">
                    {/*<div className="text-right">
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={this.openModal}
                        > <i className="fa fa-plus" /> Add
                        </button>
                    </div>*/}
                    </div>
                </div>
                <br/>
                <MDBDataTable
                striped
                hover
                data={this.state.data}
                />
                <Modal
                    isOpen={this.state.modalIsOpen}
                    onAfterOpen={this.afterOpenModal}
                    onRequestClose={this.closeModal}              
                    contentLabel="Add Resource Group"
                    >
                    <h2 style={{color:'red'}}>
                        Add Resource Group <span className="float-right cursor-pointer" onClick={this.closeModal}><i className="fa fa-times" /></span>
                    </h2>

                    <div className="col-md-12">
                        <div className="panel panel-default" />
                        <form
                        name="addResourceGroup"
                        id="addResourceGroup"
                        method="post"
                        onSubmit={this.addResourceGroupRequest}
                        >
                        <div className="form-group">
                            <label htmlFor="subscription">Subscription Id</label>
                            <select
                            className="form-control"
                            required
                            name="subscription"        
                            onChange={e => this.handleAzureSubscriptions(e.target.value)}      
                            >
                                <option value="">-Select-</option>
                                {subscription_list && subscription_list.map((sub, index) =>
                                    <option value={sub.clientid+"_"+sub.subscription_id} key={sub.subscription_id}>
                                        {sub.subscription_id}
                                    </option>
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="location">Location</label>
                            <select
                            className="form-control"
                            required
                            name="location"                     
                            >
                                <option value="">-Select-</option>
                                {subscription_locations && subscription_locations.map((l, index) =>
                                    <option value={l.id+"_"+l.name} key={l.id}>
                                        {l.display_name}
                                    </option>
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="name">Resource Group  Name</label>
                            <input
                            type="text"
                            className="form-control"
                            name="name"
                            required                      
                            placeholder="Resource Group Name"
                            />
                        </div>
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
    	                <div className="form-group">
    	                    <label htmlFor="mapped_users">BU Users<span className="star-mark">*</span></label>                    
    	                    <select
    	                    className="form-control"
    	                    required
    	                    name="mapped_users" id="mapped_users"
    	                	multiple
    	                	defaultValue={this.state.editDetails.mapped_user_ids}
    	                    onChange={this.bindField}
    	                    >        
    	                    	<option value="">--SELECT--</option>
    	                        {this.state.BuUsersData.map((item, index) =>
    	                            <option value={item.id} key={index}>
    	                            {item.email}
    	                            </option>
    	                        )}
    	                    </select>        
                    	</div>
                        <div className="form-group">
                            <input type="hidden" name="user_id" value={this.state.user_id} />
                            <button 
                            className={"btn btn-sm btn-primary " + (this.state.is_add_network_inprogress ? "no-access" : "")} disabled={this.state.is_add_network_inprogress ? true : false}
                            >{this.state.is_add_network_inprogress &&
                                <i className="fas fa-circle-notch icon-loading"></i>}
                                Submit</button>
                        </div>
                        </form>
                    </div>
                </Modal>
                
                <Modal
                isOpen={this.state.modalIsOpenEditResourceGroupBuUsers}
                onAfterOpen={this.afterOpenModalEditResourceGroupBuUsers}
                onRequestClose={this.closeModalEditResourceGroupBuUsers}              
                contentLabel="Edit Resource Group BU Users"
                >
                <h2 style={{color:'red'}}>
                    Edit Resource Group BU Users <span className="float-right cursor-pointer" onClick={this.closeModalEditResourceGroupBuUsers}><i className="fa fa-times" /></span>
                </h2>

                <div className="col-md-12">
                    <div className="panel panel-default" />
                    <form
                    name="editResourceGroupBuUsers"
                    id="editResourceGroupBuUsers"
                    method="post"
                    onSubmit={this.editResourceGroupBuUsersRequest}
                    >
                    <div className="form-group">
                        <label>Resource Group</label> :&nbsp;
                        {this.state.editDetails.name}
                    </div>
                    <div className="form-group">
                        <label>Subscription ID</label> :&nbsp;
                        {this.state.editDetails.subscription_id}
                    </div>
                    <div className="form-group">
	                    <label>Location</label> :&nbsp;
	                    {this.state.editDetails.location_display_name}
	                </div>
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
	                <div className="form-group">
	                    <label htmlFor="mapped_users">BU Users<span className="star-mark">*</span></label>                    
	                    {/*<select
	                    className="form-control"
	                    required
	                    name="mapped_users" id="mapped_users"
	                	multiple
	                	defaultValue={this.state.editDetails.mapped_user_ids}
	                    onChange={this.bindField}
	                    >        
	                    	<option value="">--SELECT--</option>
	                        {this.state.BuUsersData.map((item, index) =>
	                            <option value={item.id} key={index}>
	                            {item.email}
	                            </option>
	                        )}
	                    </select>    */}
	                    
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
		                      hideSelectedOptions={false}
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
        const { azure } = state;
        return {
            azure:azure
        };
      }
      
    export default connect(mapStateToProps)(DatatablePage);
