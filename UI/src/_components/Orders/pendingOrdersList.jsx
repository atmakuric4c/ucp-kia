import React from 'react';
import { connect } from 'react-redux';
import { ordersActions } from './orders.actions';
import { azureActions } from '../Azure/azure.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import PageLoader from '../PageLoader';
import { commonFns } from "../../_helpers/common";
import { authHeader, ucpEncrypt, ucpDecrypt, decryptResponse } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';
import { MDBDataTable } from 'mdbreact';
import { default as ReactSelect } from "react-select";

const customStyles = {
  content: {
    width: "80% !important"
  }
};
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
class pendingOrdersList extends React.Component {
  constructor(props) {
    super(props);
				let user = decryptResponse( localStorage.getItem("user")),
				is_manager = {},
				resource_groups = user.data.resource_groups.map(resource => {
					is_manager[resource.subscription_id+"@$"+resource.name] = resource.role_id === 3;

		return resource.name;
	});
				console.log("user ---- ", user);

	let assigned_resource_groups = user.data.resource_groups.map(resource => {
		return resource.subscription_id+"@$"+resource.name;
	});
    this.state = {
    		  user_details: user,
    	      assigned_resource_groups : assigned_resource_groups,
      clientid: user.data.clientid,
      user_id: user.data.id,
	     isSuperAdmin: user.data.isSuperAdmin,
      user_role: user.data.user_role,
						bu_id: user.data.bu_id,
						pages: [],
					pages_start: 1,
					current_page: 1,
					rowLength: 20,
						is_manager,
						resource_groups,
      modalIsOpen: false,
      vmModalIsOpen: false,
      orders: [],
      logDetails : [],
      vmDetails : [],
      approvalPendingCartList: [],
      sweetalert: true,
      action: null,
      usersListMod : [],
      usersListSelected : [],
    };
    
    this.updateCartItemStatus = this.updateCartItemStatus.bind(this);
    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    
    this.openVmModal = this.openVmModal.bind(this);
    this.afterOpenVmModal = this.afterOpenVmModal.bind(this);
    this.closeVmModal = this.closeVmModal.bind(this);
    
    this.subscriptionChange = this.subscriptionChange.bind(this);
    this.bindField = this.bindField.bind(this);
  }
  
  getAllUsersList(){
	  const requestOptions = {
			  method: 'POST',
	          headers: { ...authHeader(), 'Content-Type': 'application/json' },
	          body: JSON.stringify(ucpEncrypt({
	        	  record_status : "ALL"
	          }))
      };

      this.setState({
          isAllUsersListInProgress: true,
          usersListMod : []
      });
      
      fetch(`${config.apiUrl}/secureApi/azure/getAllUsersList`, requestOptions).then(response  => {
          response.text().then(text => {
              
              var data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
              var errorMsg = "The operation did not execute as expected. Please raise a ticket to support";
              if (response.ok) {
                  if(data.data && data.data.length > 0){
                	  let usersListMod = [];
                	  usersListMod.push({ value: "", label: "--SELECT--" });
                	  for(let i=0; i< data.data.length; i++){
                		  usersListMod.push({ value: data.data[i].user_id+"@$"+data.data[i].email, label: data.data[i].email });
                	  }
                	  this.setState({
                		  usersListMod
                	  });
                  } else {
                      toast.error(errorMsg);
                  }
              }
              else{
                  toast.error(errorMsg);
              }

              this.setState({
              	isAllUsersListInProgress: false
              });
          });
      });
  }
  
  reactSelectHandleChange = (selected, jObj) => {
	console.log("selected --- ", selected);
	console.log("jObj --- ", jObj);
	if(!Array.isArray(selected) && typeof selected === 'object'){
		let selected_ow = [];
		selected_ow.push(selected);
		selected = selected_ow;
		console.log("selected --- ", selected);
  	}
  	this.setState({
  		[jObj.optionSelected]: selected
  	});

  	let selected_values = [];
	
	if(selected.length > 0){
      	let opt;
		for (var i=0, iLen=selected.length; i<iLen; i++) {
  		    opt = selected[i];

  		    if (opt.value != "") {
  		    	selected_values.push(opt.value);
  		    }
  		}
	}
	console.log("selected_values --- ", selected_values);
	this.setState({
		[jObj.key] : selected_values
	});
	setTimeout(() => {
		 console.log("this.state."+jObj.key+" -- ", this.state[jObj.key]);
	}, 10);
  };
	  
  searchList = (e) => {
	  e.preventDefault();
	  var form = document.querySelector("#orderListSearch");
	    var formData = serialize(form, { hash: true });
	    formData = {...formData, user_id : this.state.user_id, page_num: 1};
	    formData.usersList = this.state.usersListSelectedOptions;
	    console.log("search formData ---- ", formData);
	    this.props.dispatch(ordersActions.getApprovalPendingCartList(formData));
  }
  
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

	getPageData(page_num) {
		if (this.state.current_page === page_num) {
			return
		}
		else {
			this.setState({current_page: page_num});
		}
		var form = document.querySelector("#orderListSearch");
	    var formData = serialize(form, { hash: true });
	    formData = {...formData, user_id : this.state.user_id, approval_status : this.state.approval_status, page_num: page_num};
	    console.log("search formData ---- ", formData);
		this.props.dispatch(ordersActions.getApprovalPendingCartList(formData));
//		this.props.dispatch(ordersActions.getApprovalPendingCartList(this.state.user_id, page_num));
	}
	
	subscriptionChange = (subscription,cb) => {
		  if(cb){
			  console.log("iffff");
			  this.setState({
				  searchSubscription:subscription,
				  searchResourceGroupName : "",
		    	searchAppType:"",
			  	hostNamesSelected : [],
		      });
		  }else{
			  console.log("elseeee");
		      this.setState({
		        subscription:subscription,
		        resourceGroupName : "",
		    	appType:"",
			  	hostNamesSelected : [],
			  	hostNamesSelectedOptions : [],
			  	hostNamesMod : []
		      });
		  }
	      
	      if(subscription){
	        var frmData={
	        	subscription_id: subscription,
	        	clientid:this.state.clientid,
	    		user_role: this.state.user_role, 
	    		user_id:this.state.user_id
	        }
	        
	        this.setState({
	        	isResourceGroupInprogress: true
	        });
	        const requestOptions = {
	            method: 'POST',
	            headers: { ...authHeader(), 'Content-Type': 'application/json' },
	            body: JSON.stringify(ucpEncrypt(frmData))
	        };

	        fetch(`${config.apiUrl}/secureApi/azure/getAllAzureResourceGroups`, requestOptions).then(response  => {
	            response.text().then(text => {
	                const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	                
	                this.setState({
	                	isResourceGroupInprogress: false
	                });
	                if (response.ok) {
	                    var result=(data.value ? data.value : data)
	                    console.log("getAzureResourceGroups result --- ",result);
	          	      	let completeResourceGroups = [];
	                    let resourceGroups = [];
	                    
	                    if(result && result.length > 0){
	    	        		for(let rg =0; rg < result.length; rg++){
//		                            resourceGroups.push(result[rg]);
	    	        			 if(result[rg].Virtual_Machines == 'Yes'
	    	        				 && (this.state.assigned_resource_groups.indexOf(result[rg].subscription_id+"@$"+result[rg].name) >= 0 || this.state.isSuperAdmin == "1")){
	    	        			 	resourceGroups.push(result[rg]);
	    	        			 }
	    	        		}
	    	        	}
	                    if(cb){
	                    	this.setState({
	                    		searchResourceGroups: resourceGroups,
		                    	completeResourceGroups : result,
		                    });
	                    }else{
		                    this.setState({
		                    	resourceGroups: resourceGroups,
		                    	completeResourceGroups : result,
		                    });
	                    }
	                    
	                }
	                else{
	                    toast.error("The operation did not execute as expected. Please raise a ticket to support");
	                }        
	            });
	        });
	        
	      }
	      else{
	        this.setState({
	        	resourceGroupName : "",
	        	appType:appType,
	  		  	hostNamesSelected : [],
	  		  	hostNamesSelectedOptions : [],
	  		  	hostNamesMod : []
		    });
	      }
	  }

  componentDidMount() {
	  this.getAllUsersList();
	  this.props.dispatch(azureActions.getAzureSubscriptions({clientid:this.state.clientid, user_role: this.state.user_role, provision_type:this.state.user_details.data.provision_type}));
	  var form = document.querySelector("#orderListSearch");
	    var formData = serialize(form, { hash: true });
	    formData = {...formData, user_id : this.state.user_id, page_num: 1};
	    console.log("search formData ---- ", formData);
		this.props.dispatch(ordersActions.getApprovalPendingCartList(formData));
//    this.props.dispatch(ordersActions.getApprovalPendingCartList(this.state.user_id, 1));
  }
  openModal(logDetails) { 
      this.setState({ modalIsOpen: true, logDetails: logDetails });
  }
  afterOpenModal() {       
  //this.subtitle.style.color = "#f00";
  }
  closeModal() {    
	  this.setState({ modalIsOpen: false });        
  }
  
  openVmModal(vmDetails, itemData) { 
						this.setState({ vmModalIsOpen: true, vmDetails,
							is_cluster: itemData.is_cluster,
							order_raised_by: itemData.order_raised_by });
  }
  afterOpenVmModal() {       
  //this.subtitle.style.color = "#f00";
  }
  closeVmModal() {    
	  this.setState({ vmModalIsOpen: false });        
  }
  updateCartItemStatus(item, status, itemData) {
	  let isConfirmed = false;
	  let rejectResonse = "";
			let self = this;
			item.cart_id = itemData.cartid;
			item.cartids = itemData.cartids;
	  if(status == 2){
//		  isConfirmed = confirm("Are you sure, you want to Reject this?");
		  var dispLable = "Yes, Confirm!";
		  const getAlert = () => (
			      <SweetAlert
				      input
				      showCancel
				      confirmBtnText={dispLable}
				      cancelBtnBsStyle="light"
				      confirmBtnBsStyle="danger"
				      title="Reason for reject!"
				      placeHolder="Reason for reject"
				      onConfirm={(response) => {
					    	  console.log("response --- ", response);
					    	  response = response.trim()
					    	  if(response != ''){
					    		  isConfirmed = true;
					    		  rejectResonse = response;
					    		  self.updateCartItemStatusConfirm({item,status,rejectResonse,itemData});
					    		  self.hideAlert()
					    	  }
	//				    	  this.onReceiveInput(response)
				    	  }
				      }
				      onCancel={this.hideAlert.bind(this)}
				    >
			    	</SweetAlert>
			    );
			    this.setState({
			      sweetalert: getAlert()
			    });
			    setTimeout(() => {
			    	$(".sweet-alert input[type=text]").attr("maxlength","500");
				}, 1000);
	  }else{
		  self.updateCartItemStatusConfirm({item,status,rejectResonse,itemData})
	  }
	  
	  
	  /*let isConfirmed = false;
	  if(status == 2){
		  isConfirmed = confirm("Are you sure, you want to Reject this?");
	  }else{
		  isConfirmed = true;
	  }
	  
	  if(isConfirmed){
		  $(".complete-page-loader").show();

	    var frmData={
    		item: item,
    		status: status,
    		user_id: this.state.user_id,
	        client_id: this.state.clientid,
	    }
	    
	    const requestOptions = {
	        method: 'POST',
	        headers: { ...authHeader(), 'Content-Type': 'application/json' },
	        body: JSON.stringify(ucpEncrypt(frmData))
	    };

	    fetch(`${config.apiUrl}/secureApi/orders/updateCartItemStatus`, requestOptions).then(response  => {
	        response.text().then(text => {
	            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	            
	            $(".complete-page-loader").hide();
	            if (response.ok) {
	                var result=(data.value ? data.value : data)
	                console.log("updateCartItemStatus result --- ",result);
	            	if(result.status == "success"){
	            		this.props.dispatch(ordersActions.getApprovalPendingCartList(this.state.user_id));
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
  }
  
  updateCartItemStatusConfirm(regObj) {
			let self = this,
			  current_page = this.state.current_page;

	  $(".complete-page-loader").show();
	    var frmData={
    		item: regObj.item,
    		itemData : regObj.itemData,
    		status: regObj.status,
    		user_id: this.state.user_id,
	        client_id: this.state.clientid,
	        rejectResonse : regObj.rejectResonse
	    }
	    
	    const requestOptions = {
	        method: 'POST',
	        headers: { ...authHeader(), 'Content-Type': 'application/json' },
	        body: JSON.stringify(ucpEncrypt(frmData))
	    };

	    fetch(`${config.apiUrl}/secureApi/orders/updateCartItemStatus`, requestOptions).then(response  => {
	        response.text().then(text => {
	            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

	            $(".complete-page-loader").hide();
	            if (response.ok) {
	                var result=(data.value ? data.value : data)
	                console.log("updateCartItemStatus result --- ",result);
	            	if(result.status == "success"){
	            		var form = document.querySelector("#orderListSearch");
	            	    var formData = serialize(form, { hash: true });
	            	    formData = {...formData, user_id : this.state.user_id, page_num: current_page};
	            	    console.log("search formData ---- ", formData);
	            		this.props.dispatch(ordersActions.getApprovalPendingCartList(formData));
//	            		this.props.dispatch(ordersActions.getApprovalPendingCartList(this.state.user_id, current_page));
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

  hideAlert() {
    this.setState({
      sweetalert: null
    });
  }

  render() { 
    const { orders, azure } = this.props;
				let {resource_groups, is_manager, isSuperAdmin, vmDetails, order_raised_by,
				 is_cluster,  pages, pages_start, current_page, rowLength} = this.state,
					approvalPendingCartList = orders.approvalPendingCartList,
					total_records = orders.total_records || 0,
					parsing = ((approvalPendingCartList || {}).items || []).filter(obj => {
						return (resource_groups || []).indexOf(obj.resourceGroup) > -1;
					}),
					cart_config = (vmDetails || {}).cart_config || {};
					let subscription_list = this.props.azure.subscription_list;

				if(isSuperAdmin != "1"){
					approvalPendingCartList = approvalPendingCartList || {};
					approvalPendingCartList.items = parsing;
				}

				pages = Math.ceil(total_records/rowLength);
				pages = (pages > 25)?25:pages;
				pages = [...Array(pages)].map((_, i) => {
					return i + 1;
			});
    return (
      <div className="container-fluid main-body">
        <div className="contentarea mb-4">
          <h5 className="color">Orders List</h5>
          <form
	          name="orderListSearch"
	          id="orderListSearch"
	          method="post"
	          onSubmit={this.searchList}
	          >
	          <div className="row">
		          <div className="col-lg-6">
		              <div className="form-group row">
		                  <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Status</label>                
		                  <div className="col-sm-9">
		                      <select
			                      className="form-control"
			                      name="approval_status"
			                      id="approval_status"
		                    	  value={this.state.approval_status} 
		                      	  onChange={this.bindField}
		                      >
	                          	<option value="ALL">ALL</option>
		                        <option value="1">Approval Pending</option>
		                        <option value="3">Approved</option>
		                        <option value="0">Rejected</option>
		                        <option value="2">Sent for Provisioning</option>
		                      </select>
		                  </div>
		              </div>
		              <div className="form-group row">
			              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Subscription <span className="star-mark">*</span></label>
			              <div className="col-sm-9">
				              <select
			                      className="form-control"
			                      value={this.state.searchSubscription}
			                    	name="searchSubscription"
			                        onChange={e => this.subscriptionChange(e.target.value,"search")}
			                      >
			                      <option value="">--SELECT--</option>
			                      {subscription_list && subscription_list.length > 0 && subscription_list.map((sub, index) =>
			                          <option value={sub.subscription_id} key={sub.subscription_id}>
			                              {sub.display_name}
			                          </option>
			                      )}
			                  </select>
		                  </div>
	                  </div>
	                  <div className="form-group row">
			            <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Resource Group <span className="star-mark">*</span></label>
			            <div className="col-sm-9">
				            <select
				                className="form-control"
				                value={this.state.searchResourceGroupName}
				              	name="searchResourceGroupName"
			                    id="searchResourceGroupName"
			                	onChange={this.bindField}
				                >
				                <option value="">--SELECT--</option>
				                {this.state.searchResourceGroups && this.state.searchResourceGroups.length > 0 && this.state.searchResourceGroups.map((row, index) =>
			                        <option value={row.name} key={index}>
			                            {row.name}
			                        </option>
			                    )}
				            </select>
			            </div>
			          </div>
			          <div className="form-group row">
			              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Order Raised By</label>
			              <div className="col-sm-9">
				              <ReactSelect
			                      options={this.state.usersListMod}
					              isMulti={false}
			                      closeMenuOnSelect={true}
			                      hideSelectedOptions={false}
			                      components={{
			                    	  reactSelectComponentOption
			                      }}
				              	  placeholder="--SELECT--"
			                      onChange={e => {this.reactSelectHandleChange(e,{'key':"usersListSelected", optionSelected : "usersListSelectedOptions"})}}
			                      allowSelectAll={true}
			                      value={this.state.usersListSelectedOptions}
			                    />
			                    {this.state.isAllUsersListInProgress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
				              {/*<input
		                        type="text" 
		                        className="form-control"
		                        name="search_user_email"
		                        placeholder="User Email"
		                        onChange={this.bindField}
		                        value={this.state.search_user_email}
		                        />*/}
			              </div>
		              </div>
				      <div className="form-group row">
			              <div className='col-sm-3  col-form-label'></div>
			              <div className="col-sm-9">
			              	<span className="alert info-box-success mr-2 cursor-pointer" onClick={this.searchList}>Search</span>
			              </div>
		              </div>
		          </div>
		          <div className="col-lg-6 m-t-xxs">
	              </div>
	          </div>
	      </form>
          {!orders.error && orders.loading && <em><PageLoader/></em>}
          {orders.error && <span className="text-danger">ERROR - {orders.error}</span>}
										{!orders.loading &&
										
            <div className="tableresp table-responsive">
													{pages && pages.length ? pages.map(page => {
															return current_page === page ? <span className="p-1 m-1 btn btn-danger">{page}</span>: 
															<span className="cursor p-1 m-1 btn btn-info"
																	onClick={this.getPageData.bind(this, page)}>{page}</span>}): null}
              <table className="table table-bordered table-striped table-dark table-custom table-hover" id="approvalPendingCartList">
                <thead>
                  <tr>
                    {/**<th>Order Id</th> */}
                    <th>Order Information</th>
                    <th>Approval details</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalPendingCartList && approvalPendingCartList.items && approvalPendingCartList.items.length > 0 && approvalPendingCartList.items.map((itemData, index) =>
                    <tr key={index}>
                      {/**<td>{itemData.id}</td> */}
                      <td>
                      		  {itemData.product_type} Virtual Machine<br/>
                              VM Name : {itemData.virtual_machine_name.map((name, inx) => {
									return <React.Fragment>
										<span className="anch-link cursor-pointer" onClick={() => 
											  this.openVmModal(itemData.cart_config[inx], itemData)}>{name}
											</span>, &nbsp;
										</React.Fragment>
								})}<br/>
                              {itemData.is_cluster == 1 && 
                            	  <React.Fragment>
                            	  	VM Name 2 : {itemData.virtual_machine_name2.join(', ')}<br/>
                            	  </React.Fragment>
                              }
                              Order Raised By : {itemData.order_raised_by}<br/>
	                        <strong>Order Status :: </strong>{((itemData.record_status == 1)?((itemData.approval_status == 1)?"Yet to Provision":"Approval Pending"):((itemData.record_status == 2)?"Sent for Provisioning":((itemData.record_status == 0)?"Rejected":"-")))}<br/>
		                      {itemData.rejected_comments && <span>Comments : {itemData.rejected_comments}<br/></span>}
	                        <div className="col-md-12">
		                        <div className="text-right">
		                        	{/* {<span className="anch-link cursor-pointer" onClick={() => this.openVmModal(itemData)}>Additional info &#62;&#62;</span>} */}
		                        </div>
		                    </div>
                        </td>
                      <td>
	                      <table className="table table-bordered table-striped table-dark table-custom table-hover">
		                      <thead>
		                        <tr>
		                          {/*<th>Bu Unit</th>*/}
		                          <th>Request Raised Date</th>
		                          {/*<th>Level Number</th>*/}
		                          <th>Status</th>
			                      <th>Approved/Rejected By</th>
		                          <th>Approved/Rejected Date</th>
		                        </tr>
		                      </thead>
		                      <tbody>
		                        {itemData.logs.length > 0 && itemData.logs.map((logData, index) =>
		                          <tr key={index}>
									 { console.log('is_manager[itemData.subscription+"@$"+itemData.resourceGroup]== ',is_manager[itemData.subscription+"@$"+itemData.resourceGroup]) }
									 { console.log('itemData.resourceGroup== ',itemData.resourceGroup) }
		                          	{/*<td><span className="anch-link cursor-pointer" onClick={() => this.openModal(itemData.logs)}>{logData.bu_name}</span></td>*/}
		                          	<td>{logData.requested_date} {this.state.user_details.data.TIME_ZONE}</td>
		                          	{/*<td>{logData.approval_matrix_level}</td>*/}
		                          	<td>{((logData.approval_status == 0)?"Approval Pending":((logData.approval_status == 1)?"Approved":"Rejected"))}
																														{(logData.approval_status === 0 && 
																														(is_manager[itemData.subscription+"@$"+itemData.resourceGroup] || isSuperAdmin == '1')) &&
		                          			<span>
			                          			<br/>
				                          		<span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.updateCartItemStatus(logData,'1', itemData)}>Approve</span>
				                          		&nbsp;
				                          		<span className="alert info-box-danger mr-2 cursor-pointer" onClick={() => this.updateCartItemStatus(logData,'2', itemData)}>Reject</span>
			                          		</span>
		                          		}
		                          	</td>
			                      	<td>{logData.updated_email}</td>
		                          	<td>{logData.updated_date} {logData.updated_date && this.state.user_details.data.TIME_ZONE}</td>
		                          </tr>
		                        )}
	                        </tbody>
                        </table>
                        {/*<div className="col-md-12">
	                        <div className="text-right">
	                        	<span className="anch-link cursor-pointer" onClick={() => this.openModal(itemData.logs)}>More Details &#62;&#62;</span>
	                        </div>
	                    </div>*/}
                        {/*{(itemData.logs.length > 0)?itemData.logs[itemData.logs.length-1].levelwise_users_ids.indexOf(this.state.user_id):""}*/}
                        {(itemData.logs.length > 0 
                        		&& itemData.approval_status == 1 
																										&& itemData.record_status == 1 &&
																										(is_manager[itemData.subscription+"@$"+itemData.resourceGroup] || isSuperAdmin == '1')) && 
                        	<div className="col-md-12">
                        		<br/>
		                        <div className="text-right">
		                        	<a className="alert btn btn-sm btn-primary mr-2 cursor-pointer" href={"/#/cartPreview/"+itemData.cartid}>Submit</a>
		                        </div>
		                    </div>
                        }
                      </td>
                    </tr>
                  )}
                  {!approvalPendingCartList || approvalPendingCartList.items.length == 0 && 
                      <tr>
                        <td colSpan="7" align="center">No Records</td>
                      </tr>
                  }
                </tbody>
              </table>
														{pages && pages.length ? pages.map(page => {
																					return current_page === page ? <span className="p-1 m-1 btn btn-danger">{page}</span>: 
																			  <span className="cursor p-1 m-1 btn btn-info"
																							onClick={this.getPageData.bind(this, page)}>{page}</span>}): null}
              {this.state.sweetalert}
            </div>
          }
          <Modal className="mypop"
	          isOpen={this.state.vmModalIsOpen}
	          onAfterOpen={this.afterOpenVmModal}
	          onRequestClose={this.closeVmModal}              
	          contentLabel="VM Details"
	          >
	                             
	          <h2 style={{color:'red'}}>
	              VM Details <span className="float-right cursor-pointer" onClick={this.closeVmModal}><i className="fa fa-times" /></span>
	          </h2>
	
	          <div className="col-md-12">
	              <div className="panel panel-default" />
	              	<table className="table table-bordered table-hover bg-color-white build-params-table">
		            	<thead>
		              	</thead>
		              	<tbody>
		              	<React.Fragment>
			              	{vmDetails &&
			              		<React.Fragment>
					              	<tr className="bg-color-white"><td>Order Raised By</td><td>{order_raised_by}</td></tr>		
			              			{/*<tr className="bg-color-white"><td>Subscription Provision Type</td><td>{vmDetails.subscription_provision_type}</td></tr>*/}
			              			<tr className="bg-color-white"><td>VM Name</td><td>{vmDetails.virtual_machine_name}</td></tr>
			              			<tr className="bg-color-white"><td>vCPUS</td><td>{vmDetails.cpus}</td></tr>
			              			<tr className="bg-color-white"><td>Memory</td><td>{vmDetails.ram} GB</td></tr>
			              			<tr className="bg-color-white"><td>OS Storage</td><td>{vmDetails.disksize} GB</td></tr>
			              			<tr className="bg-color-white"><td>Subscription</td><td>{vmDetails.selectedSubscriptionLabel}</td></tr>
			              			<tr className="bg-color-white"><td>VM Resource Group</td><td>{vmDetails.deployment_resource_group_name}</td></tr>
			              			<tr className="bg-color-white"><td>Region</td><td>{vmDetails.selected_network_location_name}</td></tr>
			              			{/*<tr className="bg-color-white"><td>Network Resource Group Name</td><td>{vmDetails.network_resource_group_name}</td></tr>*/}
			              			<tr className="bg-color-white"><td>Virtual Network Name</td><td>{vmDetails.virtual_network_name}</td></tr>
			              			<tr className="bg-color-white"><td>Subnet Name</td><td>{vmDetails.subnet_name}</td></tr>
			              			<tr className="bg-color-white"><td>NIC Name</td><td>{vmDetails.nic_name}</td></tr>
			              			{vmDetails.private_ip_address && <tr className="bg-color-white"><td>Private IP Address</td><td>{vmDetails.private_ip_address}</td></tr>}
			              			<tr className="bg-color-white"><td>Managed Disk Name</td><td>{vmDetails.managed_disk_name}</td></tr>
		                    		<tr className="bg-color-white"><td>Managed Disk Host Caching</td><td>{vmDetails.managed_disk_host_caching}</td></tr>
		                    		<tr className="bg-color-white"><td>Managed Disk SKU</td><td>{vmDetails.managed_disk_storage_size}</td></tr>
		                    		<tr className="bg-color-white"><td>Managed Disk Size</td><td>{vmDetails.managed_disk_size}</td></tr>
		                    		<tr className="bg-color-white"><td>Managed Disk Size Storage Account Type</td><td>{vmDetails.managed_disk_size_storage_account_type}</td></tr>
			                      	<tr className="bg-color-white"><td>Zone</td><td>{vmDetails.zone}</td></tr>
			                      	<tr className="bg-color-white"><td>Availability Set Name</td><td>{vmDetails.availability_set_name}</td></tr>
				                    <tr className="bg-color-white"><td>Environment</td><td>{vmDetails.environment}</td></tr>
				                    {/*<tr className="bg-color-white"><td>System Type</td><td>{vmDetails.system_type}</td></tr>*/}
				                    <tr className="bg-color-white"><td>Storage Account Name</td><td>{vmDetails.storage_account_name}</td></tr>
				                    <tr className="bg-color-white"><td>Ansible IP</td><td>{vmDetails.selected_ansible_server}</td></tr>
				                    <tr className="bg-color-white"><td>Is Cluster</td><td>{(vmDetails.is_cluster?"Yes":"No")}</td></tr>
				                    {vmDetails.is_cluster == 1 && 
		                            	  <React.Fragment>
				                    		<tr className="bg-color-white"><td>VM 1 NIC Name 2</td><td>{vmDetails.nic_name2}</td></tr>
				                    		<tr className="bg-color-white"><td>VM 2 Name</td><td>{vmDetails.virtual_machine_name2}</td></tr>
				                    		<tr className="bg-color-white"><td>VM 2 Subnet Name</td><td>{vmDetails.subnet1_name}</td></tr>
				                    		<tr className="bg-color-white"><td>VM 2 NIC Name 1</td><td>{vmDetails.nic_name3}</td></tr>
				                    		{vmDetails.private_ip_address2 && <tr className="bg-color-white"><td>VM 2 Private IP Address</td><td>{vmDetails.private_ip_address2}</td></tr>}
				                    		<tr className="bg-color-white"><td>VM 2 NIC Name 2</td><td>{vmDetails.nic_name4}</td></tr>
				                    		<tr className="bg-color-white"><td>VM 2 Managed Disk Name</td><td>{vmDetails.managed_disk_name2}</td></tr>
				                    		<tr className="bg-color-white"><td>VM 2 Managed Disk Host Caching</td><td>{vmDetails.managed_disk_host_caching2}</td></tr>
				                    		<tr className="bg-color-white"><td>VM 2 Managed Disk Storage Size</td><td>{vmDetails.managed_disk_storage_size2}</td></tr>
				                    		<tr className="bg-color-white"><td>VM 2 Managed Disk Size</td><td>{vmDetails.managed_disk_size2}</td></tr>
				                    		<tr className="bg-color-white"><td>VM 2 Managed Disk Size Storage Account Type</td><td>{vmDetails.managed_disk_size_storage_account_type2}</td></tr>
				                    		<tr className="bg-color-white"><td>VM 2 Zone</td><td>{vmDetails.zone2}</td></tr>
				                    		<tr className="bg-color-white"><td>VM 2 Availability Set Name</td><td>{vmDetails.availability_set_name2}</td></tr>
		                            	  </React.Fragment>
		                              }
			                    </React.Fragment>
		                  	  }
		                      {vmDetails && vmDetails.gallery_name &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Gallery Name</td><td>{vmDetails.gallery_name}</td></tr></React.Fragment>
		                      }  
		                      {vmDetails && vmDetails.managed_infra_subscription_id &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Managed Infra Subscription ID</td><td>{vmDetails.managed_infra_subscription_id}</td></tr></React.Fragment>
		                      }
		                      {vmDetails && vmDetails.shared_image_name &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Template Name</td><td>{vmDetails.shared_image_name}</td></tr></React.Fragment>
		                      }
		                      {vmDetails && vmDetails.shared_image_version &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Template Version</td><td>{vmDetails.shared_image_version}</td></tr></React.Fragment>
		                      }
		                      {vmDetails && vmDetails.backup_resource_group_name &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Backup Resource group</td><td>{vmDetails.backup_resource_group_name}</td></tr></React.Fragment>
		                      }
		                      {vmDetails && vmDetails.recovery_vault_name &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Backup Vault Name</td><td>{vmDetails.recovery_vault_name}</td></tr></React.Fragment>
		                      }
		                      {vmDetails && vmDetails.backup_policy &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Backup Policy</td><td>{vmDetails.backup_policy}</td></tr></React.Fragment>
		                      }
		                      {vmDetails && vmDetails.db_full_backup &&
		                      	<React.Fragment><tr className="bg-color-white"><td>DB Full Backup Policy</td><td>{vmDetails.db_full_backup}</td></tr></React.Fragment>
		                      }
		                      {vmDetails && vmDetails.db_log_backup &&
		                      	<React.Fragment><tr className="bg-color-white"><td>DB Log Backup Policy</td><td>{vmDetails.db_log_backup}</td></tr></React.Fragment>
		                      }
		                      {vmDetails && vmDetails.db_backup &&
		                      	<React.Fragment><tr className="bg-color-white"><td>DB Backup Policy</td><td>{vmDetails.db_backup}</td></tr></React.Fragment>
		                      }
		                      {vmDetails && vmDetails.cyberark_usernames &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Cyberark Usernames</td><td>{vmDetails.cyberark_usernames}</td></tr></React.Fragment>
		                      }
		                      {vmDetails && vmDetails.disk_encryption_name &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Disk Encryption Name</td><td>{vmDetails.disk_encryption_name}</td></tr></React.Fragment>
		                      }
		                      {vmDetails && vmDetails.disk_encryption_resource_group_name &&
		                      	<React.Fragment><tr className="bg-color-white"><td>Disk Encryption Resource Group Name</td><td>{vmDetails.disk_encryption_resource_group_name}</td></tr></React.Fragment>
		                      }
	                      </React.Fragment>
                      	</tbody>
                  	</table>
	          </div>
          </Modal>
          <Modal className="mypop"
	          isOpen={this.state.modalIsOpen}
	          onAfterOpen={this.afterOpenModal}
	          onRequestClose={this.closeModal}              
	          contentLabel="Log Details"
	          >
	                             
	          <h2 style={{color:'red'}}>
	              Log Details <span className="float-right cursor-pointer" onClick={this.closeModal}><i className="fa fa-times" /></span>
	          </h2>
	
	          <div className="col-md-12">
	              <div className="panel panel-default" />
	            	  <table className="table table-bordered table-striped table-dark table-custom table-hover">
		                  <thead>
		                    <tr>
		                      <th>Bu Unit & Users</th>
		                      <th>Request By</th>
		                      <th>Request Raised Date</th>
		                      <th>Level Number</th>
		                      <th>Status</th>
		                      <th>Approved/Rejected By</th>
		                      <th>Approved/Rejected Date</th>
		                    </tr>
		                  </thead>
		                  <tbody>
		                    {this.state.logDetails.length > 0 && this.state.logDetails.map((logData, index) =>
		                      <tr key={index}>
		                      	<td><strong>BU Unit ::</strong> {logData.bu_name}
		                      		<br/>
		                      		<strong>BU Linked users ::</strong>
	                      			<ul>
		                      			{logData.levelwise_users_list.length > 0 && logData.levelwise_users_list.map((userRow, index) =>
		                      				<li key={index}>
		                      					{userRow.email}
		                      				</li>
	                      				)}
		                      		</ul>
		                      	</td>
		                      	<td>{logData.requested_email}</td>
		                      	<td>{logData.requested_date}</td>
		                      	<td>{logData.approval_matrix_level}</td>
		                      	<td>{((logData.approval_status == 0)?"Approval Pending":((logData.approval_status == 1)?"Approved":"Rejected"))}
		                      	</td>
		                      	<td>{logData.updated_email}</td>
		                      	<td>{logData.updated_date}</td>
		                      </tr>
		                    )}
		                </tbody>
		            </table>
														{pages && pages.length ? pages.map(page => {
															return current_page === page ? <span className="p-1 m-1 btn btn-danger">{page}</span>: 
															<span className="cursor p-1 m-1 btn btn-info"
																	onClick={this.getPageData.bind(this, page)}>{page}</span>}): null}
	          </div>
          </Modal>
        </div>
        <br/><br/><br/><br/><br/>
      </div>
    );
  }
}

function mapStateToProps(state) {
  console.log(state);
  const { orders, azure } = state;
  return {
    orders, azure
  };
}

const connectedviewCart = connect(mapStateToProps)(pendingOrdersList);
export { connectedviewCart as pendingOrdersList };