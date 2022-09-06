import React from 'react';
import { connect } from 'react-redux';
import { ordersActions } from './orders.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import PageLoader from '../PageLoader';
import { commonFns } from "../../_helpers/common";
import { authHeader,ucpEncrypt, ucpDecrypt, decryptResponse } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';

const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");
class vmOpsRequests extends React.Component {
  constructor(props) {
    super(props);

				let user = decryptResponse( localStorage.getItem("user")),
     is_manager = {},
     resource_groups = user.data.resource_groups.map(resource => {
      is_manager[resource.subscription_id+"@$"+resource.name] = resource.role_id === 3;
      return resource.name;
					});

    this.state = {
    		clientid: user.data.clientid,
    		user_id: user.data.id,
    		user_role: user.data.user_role,
    	    user : user,
    		isSuperAdmin: user.data.isSuperAdmin,
    		bu_id: user.data.bu_id,
    		is_manager,
			resource_groups,
			pages: [],
			pages_start: 1,
			current_page: 1,
			rowLength: 20,
			modalIsOpen: false,
			vmModalIsOpen: false,
			orders: [],
			logDetails : [],
			vmDetails : [],
			approvalPendingVmOpsList: [],
			sweetalert: true,
			action: null,
			approval_status : "ALL",
			vm_name : ""
    };

    this.bindField = this.bindField.bind(this);
    this.updateVmOpsStatus = this.updateVmOpsStatus.bind(this);
    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    
    this.openVmModal = this.openVmModal.bind(this);
    this.afterOpenVmModal = this.afterOpenVmModal.bind(this);
    this.closeVmModal = this.closeVmModal.bind(this);
    this.processVmOpsRequest = this.processVmOpsRequest.bind(this);
    
  }
  bindField(e){    
	    if(e.target.name == "extendDiskSizeGB"){
	        let value = e.target.value;
	        let charCode = value.charCodeAt(value.length - 1);
	        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
	            return false;
	        }
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
	  this.props.dispatch(ordersActions.getApprovalPendingVmOpsList({user_id : this.state.user_id, approval_status : this.state.approval_status, vm_name: this.state.vm_name, page_num}));
		}

  componentDidMount() {
    this.props.dispatch(ordersActions.getApprovalPendingVmOpsList({user_id : this.state.user_id, approval_status : this.state.approval_status, vm_name: this.state.vm_name, page_num: 1}));
  }
  searchList() {
	    this.props.dispatch(ordersActions.getApprovalPendingVmOpsList({user_id : this.state.user_id, approval_status : this.state.approval_status, vm_name: this.state.vm_name, page_num: 1}));
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
  
  openVmModal(vmDetails) { 
	  console.log("vmDetails --- ", vmDetails);
      this.setState({ vmModalIsOpen: true, vmDetails: vmDetails });
  }
  afterOpenVmModal() {       
  //this.subtitle.style.color = "#f00";
  }
  closeVmModal() {    
	  this.setState({ vmModalIsOpen: false });        
  }
  updateVmOpsStatus(item,status) {
	  let isConfirmed = false;
	  let rejectResonse = "";
	  let self = this;
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
					  cancelBtnBsStyle="default"
				      title="Reason for reject!"
				      placeHolder="Reason for reject"
				      onConfirm={(response) => {
					    	  console.log("response --- ", response);
					    	  response = response.trim()
					    	  if(response != ''){
					    		  isConfirmed = true;
					    		  rejectResonse = response;
					    		  self.updateVmOpsStatusConfirm({item,status,rejectResonse});
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
		  self.updateVmOpsStatusConfirm({item,status,rejectResonse})
	  }
  }
  
  updateVmOpsStatusConfirm(regObj) {
	  let self = this;
	  
	  $(".complete-page-loader").show();

	    var frmData={
    		item: regObj.item,
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

	    fetch(`${config.apiUrl}/secureApi/orders/updateVmOpsStatus`, requestOptions).then(response  => {
	        response.text().then(text => {
	            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	            
	            $(".complete-page-loader").hide();
	            if (response.ok) {
	                var result=(data.value ? data.value : data)
	                console.log("updateVmOpsStatus result --- ",result);
	            	if(result.status == "success"){
	            		this.props.dispatch(ordersActions.getApprovalPendingVmOpsList({user_id : this.state.user_id, approval_status : this.state.approval_status, vm_name: this.state.vm_name}));
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
  
  processVmOpsRequest(regObj) {
	  console.log("regObj --- ", regObj);
	  let request_obj = JSON.parse(regObj.request_obj);
	  request_obj.body.vm_ops_request_id = regObj.id;
	  request_obj.body.request_processed_user_id = this.state.user_id;
	  console.log("request_obj --- ", request_obj);
//	  return;
	  let self = this;
	  
	  $(".complete-page-loader").show();

	    const requestOptions = {
	        method: request_obj.method,
	        headers: { ...authHeader(), ...request_obj.headers },
	        body: JSON.stringify(request_obj.body)
	    };
	    console.log("requestOptions --- ", requestOptions);

	    fetch(regObj.request_url, requestOptions).then(response  => {
	        response.text().then(text => {
	            const data = text && JSON.parse(text);
	            $(".complete-page-loader").hide();
	            if (response.ok) {
	                var result=(data.value ? data.value : data)
	                console.log("processVmOpsRequest result --- ",result);
	            	if(result.status == "success"){
	            		toast.success(data.message);
	            	}else{
	            		toast.error(result.message);
	            	}
            		this.props.dispatch(ordersActions.getApprovalPendingVmOpsList({user_id : this.state.user_id, approval_status : this.state.approval_status,  vm_name: this.state.vm_name}));
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
   let { orders } = this.props,
				approvalPendingVmOpsList = orders.approvalPendingVmOpsList,
			 total_records = orders.total_records,
				{pages, pages_start, current_page, rowLength} = this.state;

			pages = Math.ceil(total_records/rowLength) || 0;
			pages = (pages > 25)?25:pages;
			pages = [...Array(pages)].map((_, i) => {
				return i + 1;
			});

    return (
      <div className="container-fluid main-body">
        <div className="contentarea mb-4">
          <h5 className="color">VM Ops Requests</h5>
          <div className="row">
	          <div className="col-lg-5">
	              <div className="form-group row">
	                  <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Status</label>                
	                  <div className="col-sm-9">
	                      <select
		                      className="form-control-vm"
		                      name="approval_status"
		                      id="approval_status"
	                    	  value={this.state.approval_status} 
	                      	  onChange={this.bindField}
	                      >
                          	<option value="ALL">ALL</option>
	                        <option value="0">Approval Pending</option>
	                        <option value="1">Approved</option>
	                        <option value="2">Rejected</option>
	                        <option value="3">Request Processed</option>
	                        <option value="4">Request Failed</option>
	                      </select>
	                  </div>
	              </div>
	          </div>
	          <div className="col-lg-4">
	              <div className="form-group row">
	                  <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>VM Name</label>                
	                  <div className="col-sm-9">
	                  	<input type="text" className="form-control" name="vm_name" value={this.state.vm_name} onChange={this.bindField} />
	                  </div>
	              </div>
	          </div>
	          <div className="col-lg-2 m-t-xxs">
	          	<span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.searchList()}>Search</span>
	          </div>
	      </div>
          {!orders.error && orders.loading && <em><PageLoader/></em>}
          {orders.error && <span className="text-danger">ERROR - {orders.error}</span>}
          {approvalPendingVmOpsList && approvalPendingVmOpsList.items && !orders.loading &&
            <div className="tableresp table-responsive">
													{pages && pages.length ? pages.map(page => {
															return current_page === page ? <span className="p-1 m-1 btn btn-danger">{page}</span>: 
															<span className="cursor p-1 m-1 btn btn-info"
																	onClick={this.getPageData.bind(this, page)}>{page}</span>}): null}
              <table className="table table-bordered table-striped table-dark table-custom table-hover" id="approvalPendingVmOpsList">
                <thead>
                  <tr>
                    {/**<th>Request Id</th> */}
                    <th>Request Information</th>
                    <th>Approval details</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalPendingVmOpsList.items.length > 0 && approvalPendingVmOpsList.items.map((itemData, index) =>
                    <tr key={index}>
                      {/**<td>{itemData.id}</td> */}
                      <td>
                          Type : {itemData.request_type}<br/>
	                      VM Name : {itemData.host_name}<br/>
                          Raised By : {itemData.order_raised_by}<br/>
	                      <strong>Status :: </strong>{((itemData.approval_status == 1)?"Approved":((itemData.approval_status == 0)?"Approval Pending":((itemData.approval_status == 2)?"Rejected":((itemData.approval_status == 3)?"Request Processed":"Request Failed"))))}<br/>
	                      {itemData.rejected_comments && <span>Comments : {itemData.rejected_comments}<br/></span>}
	                      <div className="col-md-12">
	                        <div className="text-right">
	                        	<span className="anch-link cursor-pointer" onClick={() => this.openVmModal(itemData)}>Additional info &#62;&#62;</span>
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
		                          	{/*<td><span className="anch-link cursor-pointer" onClick={() => this.openModal(itemData.logs)}>{logData.bu_name}</span></td>*/}
		                          	<td>{logData.requested_date} {this.state.user.data.TIME_ZONE}</td>
		                          	{/*<td>{logData.approval_matrix_level}</td>*/}
		                          	<td>{((logData.approval_status == 0)?"Approval Pending":((logData.approval_status == 1)?"Approved":"Rejected"))}
		                          		{(logData.approval_status == 0  && 
												(this.state.is_manager[itemData.subscriptionId+"@$"+itemData.resourceGroup] || this.state.isSuperAdmin == '1'))?
		                          			<span>
			                          			<br/>
				                          		<span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.updateVmOpsStatus({...logData, vm_id : itemData.vm_id, request_type : itemData.request_type}, '1')}>Approve</span>
				                          		&nbsp;
				                          		<span className="alert info-box-danger mr-2 cursor-pointer" onClick={() => this.updateVmOpsStatus({...logData, vm_id : itemData.vm_id, request_type : itemData.request_type}, '2')}>Reject</span>
			                          		</span>
			                          		:""
		                          		}
		                          	</td>
			                      	<td>{logData.updated_email}</td>
		                          	<td>{logData.updated_date} {logData.updated_date && this.state.user.data.TIME_ZONE}</td>
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
                        		&& itemData.approval_status == 1 && 
								(this.state.is_manager[itemData.subscriptionId+"@$"+itemData.resourceGroup] || this.state.isSuperAdmin == '1')
                        		) && 
                        	<div className="col-md-12">
                        		<br/>
		                        <div className="text-right">
		                        <span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.processVmOpsRequest(itemData)}>Proceed</span>
		                        </div>
		                    </div>
                        }
                      </td>
                    </tr>
                  )}
                  {approvalPendingVmOpsList.items.length == 0 && 
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
	              Request Details <span className="float-right cursor-pointer" onClick={this.closeVmModal}><i className="fa fa-times" /></span>
	          </h2>
	
	          <div className="col-md-12">
	              <div className="panel panel-default" />
	              	<table className="table table-bordered table-hover bg-color-white build-params-table">
		            	<thead>
		              	</thead>
		              	<tbody>
		              		<React.Fragment>
				              	{this.state.vmDetails &&
				              		<React.Fragment>
				              			<tr className="bg-color-white"><td>VM Name</td><td>{this.state.vmDetails.host_name}</td></tr>
				              			<tr className="bg-color-white"><td>Server Response Message</td><td>{this.state.vmDetails.response_obj && this.state.vmDetails.response_obj.message && this.state.vmDetails.response_obj.message}</td></tr>
				                    </React.Fragment>
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
  const { orders } = state;
  return {
    orders
  };
}

const connectedviewCart = connect(mapStateToProps)(vmOpsRequests);
export { connectedviewCart as vmOpsRequests };