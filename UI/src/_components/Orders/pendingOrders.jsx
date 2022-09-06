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

const customStyles = {
  content: {
    width: "80% !important"
  }
};

Modal.setAppElement("#app");
class pendingOrders extends React.Component {
  constructor(props) {
    super(props);
				let user = decryptResponse( localStorage.getItem("user")),
					resource_groups = user.data.resource_groups.map(resource => {
						return resource.name;
					}),
					azure_jobs = user.data.azure_jobs,
					jobs = {}, category_names;
 
		(azure_jobs || []).map(jobObj => {
			jobs[jobObj.category_name] = jobs[jobObj.category_name] || [];
			jobs[jobObj.category_name].push(jobObj)
			return jobObj;
		})
	
	category_names = Object.keys(jobs) || [];
	azure_jobs = jobs[category_names[0]];

 this.state = {
		pages: [],
		pages_start: 1,
		current_page: 1,
		rowLength: 20,
		clientid: user.data.clientid,
		user_id: user.data.id,
	    isSuperAdmin: user.data.isSuperAdmin,
	    user_role: user.data.user_role,
		azure_jobs,
		jobs,
		resource_groups,
      user:user,
      orders: [],
      cartList: [],
      sweetalert: null,
      action: null,
      vmModalIsOpen: false, 
      autoPORefInt : "",
      vmDetails : [],
						category_names,
						active_os_tab: category_names[0],
      activeTab: ((azure_jobs && 
							azure_jobs.length > 0) ? azure_jobs[0].job_name:""),
						is_resource_group:((azure_jobs 
							&& azure_jobs.length > 0) ? azure_jobs[0].is_resource_group:""),
							skip_resource_grp: !((azure_jobs 
								&& azure_jobs.length > 0) ? azure_jobs[0].is_resource_group: true),
      modalIsOpenConsoleOutput : false,
      buildId : 0,
      build_status : 'In-Progress',
      isConsoleOutputInprogress: false
    };

    this.afterOpenModalConsoleOutput = this.afterOpenModalConsoleOutput.bind(this);
    this.closeModalConsoleOutput = this.closeModalConsoleOutput.bind(this);
    
    this.openVmModal = this.openVmModal.bind(this);
    this.afterOpenVmModal = this.afterOpenVmModal.bind(this);
    this.closeVmModal = this.closeVmModal.bind(this);
    this.getPageData = this.getPageData.bind(this);
    
//    this.callActiveTab = this.callActiveTab.bind(this);
//    this.getConsoleOutput = this.getConsoleOutput.bind(this); 
		}
  
 openVmModal(vmDetails) { 
		vmDetails = (vmDetails || '').replace(/"\["/g, '["').replace(/"]"/g, '"]').
		replace(/"\[{"/g, '[{"').replace(/"{"/g, '{"').replace(/"}"/g, '"}')
		.replace(/}]"/g, '}]').replace(/--/g, '::').replace(/\+\+/g, '@$');

		vmDetails = JSON.parse(vmDetails);
		this.setState({ vmModalIsOpen: true, vmDetails});
 }
	afterOpenVmModal() {       
	//this.subtitle.style.color = "#f00";
	}
	closeVmModal() {    
	this.setState({ vmModalIsOpen: false });        
	}
		
		getPageData(page_num) {
			if (page_num == 'autoRefresh') {
				//Continue
    page_num = this.state.current_page;
			}
			else {
				if (this.state.current_page === page_num) {
					return
				}
				else {
					this.setState({current_page: page_num});
				}
			}

			let pendingOrderType = this.state.activeTab,
			skip_resource_grp = this.state.skip_resource_grp;
	  this.props.dispatch(ordersActions.getPendingOrders(({job_name:pendingOrderType, page_num, skip_resource_grp})));
		console.log("this.state.autoPORefInt 3333333 ", this.state.autoPORefInt);
	}

  componentDidMount() {
	  console.log("this.state.activeTab -- ",this.state.activeTab);
      let pendingOrderType = this.state.activeTab,
						skip_resource_grp = this.state.skip_resource_grp;

      console.log("pendingOrderType -- ",pendingOrderType);
	  this.props.dispatch(ordersActions.getPendingOrders({job_name:pendingOrderType, page_num: 1, skip_resource_grp}));
	  
	  let self = this;
	  
//	  let autoPORefInt;     // <- put here
//	  useEffect(() => {
//	      autoPORefInt = window.setInterval(() => {
//	    	  self.getPageData("autoRefresh");
//	      }, 15000);
//	      return () => {
//	        window.clearInterval(autoPORefInt);
//	      };
//	    }, []);
	  
	  
	  console.log("this.state.autoPORefInt 1111 ",this.state.autoPORefInt);
//	  if(this.state.autoPORefInt){
//		  clearInterval(this.state.autoPORefInt);
//	  }
	  this.state.autoPORefInt = setInterval(function(){
		  self.getPageData("autoRefresh");
	  }, 300000);//5 mins
	  console.log("this.state.autoPORefInt 2222222 ",this.state.autoPORefInt);
  }
  componentWillUnmount() {
	  clearInterval(this.state.autoPORefInt);
  }
	callParentActiveTab = (e, category_name) => {
		let {jobs} = this.state,
		 job_details = ((jobs[category_name] || [])[0] || {});

		this.setState({
			active_os_tab: category_name,
			azure_jobs: jobs[category_name]
		});

		setTimeout(() => {
			this.callActiveTab(this, job_details.job_name, job_details.job_class_name, job_details)
		}, 1)
	}
  callActiveTab = (e, flag, tab, job) => {
      //e.preventDefault();
      this.setState({
    	  activeTab: flag,
							skip_resource_grp: !job.is_resource_group
      });
      //$('.btn.tab-wrapper').removeClass('active-tab');
      //$('.btn.tab-wrapper.'+tab).addClass('active-tab');
      this.props.orders.pendingOrders = [];
      setTimeout(() => {
          console.log("this.state.activeTab -- ",this.state.activeTab);
      }, 2000);
					
      this.setState({current_page: 1});
        this.props.dispatch(ordersActions.getPendingOrders({
		job_name:flag,
		skip_resource_grp: !job.is_resource_group,
		page_num: 1
      }));
  }
  
  getConsoleOutput(buildId, build_status, is_firsttime_loading){
	  this.setState({ modalIsOpenConsoleOutput: true, buildId, build_status });
	  let pendingOrderType = this.state.activeTab;

//      this.props.dispatch(ordersActions.getConsoleOutput({job_name:pendingOrderType,build_number:buildId}));
      
      var frmData={job_name:pendingOrderType,build_number:buildId}
      
      this.setState({
      	isConsoleOutputInprogress: true,
      });
      if(is_firsttime_loading){
    	  this.setState({
	      	consoleOutput : ""
	      });
      }
      const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(ucpEncrypt(frmData))
      };

      fetch(`${config.apiUrl}/jenkinsapi/console-output`, requestOptions).then(response  => {
          response.text().then(text => {
              const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
              
              this.setState({
            	  isConsoleOutputInprogress: false
              });
              if (response.ok) {
            	  var result=(data.value ? data.value : data)
                  console.log("getConsoleOutput result --- ",result);
            	  this.setState({
            		  consoleOutput : result,
            	  });
              }
              else{
                  toast.error("The operation did not execute as expected. Please raise a ticket to support");
              }        
          });
      });
  }
  afterOpenModalConsoleOutput() { 
	  
  }
  closeModalConsoleOutput() {
    this.setState({ modalIsOpenConsoleOutput: false });
    }

  render() { 
			//total_records
			const { orders } = this.props;
			let {resource_groups, isSuperAdmin, pages, active_os_tab,
				current_page, rowLength, vmDetails, category_names, azure_jobs,
				activeTab } = this.state,
				pendingOrders = orders.pendingOrders,
				consoleOutput = orders.consoleOutput,
				lastIndex = orders.total_records || 0;

			pages = Math.ceil(lastIndex/rowLength);
			pages = pages > 25 ? 25: pages;

			pages = [...Array(pages)].map((_, i) => {
				return i + 1;
			});
	
    return (
      <div className="container-fluid main-body">
        <div className="contentarea mb-4">
          
          <h5 className="color">Deployment Information</h5>
			<div className="main-tab">
		         <div className="tabs-wrapper">
					 {category_names && category_names.map((category_name, indx) => {

							return <React.Fragment key={indx+456}>
						<button onClick={() => this.callParentActiveTab(this, category_name)}
							className={`btn parent-tab-wrapper ${category_name == active_os_tab ?"active-tab":""}` }>
									{category_name}
									</button>
					</React.Fragment>
						})}
					</div>
				</div>
        	  <div className="main-tab mb-4">
		          <div className="tabs-wrapper">
		          	{azure_jobs && azure_jobs.length > 0 && azure_jobs.map((jobData, index) => 
		          		<React.Fragment key={index}>
		          			<button onClick={() => this.callActiveTab(this, jobData.job_name, jobData.job_class_name, jobData)} 
															 className={"btn btn-sm tab-wrapper "+jobData.job_class_name+(jobData.job_name === activeTab ?" active-tab":"")}> 
															{jobData.display_job_name}</button>
		          		</React.Fragment>
		          	)}
		          </div>
		          <div>
		          {!orders.error && orders.loading && <em><PageLoader/></em>}
		          {orders.error && <span className="text-danger">ERROR - {orders.error}</span>}
		          {!orders.error && !orders.loading && 
	                  <div className="pt-3 pr-3 pl-3 pb-0">
						{pages && pages.length ? pages.map(page => {
								return current_page === page ? <span className="p-1 m-1 btn btn-danger">{page}</span>: 
						  <span className="cursor p-1 m-1 btn btn-info"
										onClick={this.getPageData.bind(this, page)}>{page}</span>}): null}
		                  <table className="table table-bordered table-striped table-dark table-custom table-hover" id="cartList">
			                  <thead>
			                    <tr>
			                      {/*<th>S.No</th>*/}
			                      <th>Build No.</th>
			                      <th>Build Status</th>
			                      <th>Vm Name</th>
			                      <th>Actions</th>
			                    </tr>
			                  </thead>
			                  <tbody>
								{pendingOrders  && pendingOrders.length > 0 && 
								pendingOrders.map((itemData, index) =>
			                      <tr key={index}>
				                      {/**<td>{index + 1}</td> */}
				                      <td>{itemData.build_id}</td>
									<td><strong className={((itemData.status == 'In-Progress' || itemData.status == '')?"blue-color":((itemData.status == 'SUCCESS')?"green-color":((itemData.status == 'FAILURE')?"red-color":"")))}>{(
										(itemData.status) && itemData.status != 'null' ?itemData.status:"In-Progress")}</strong></td>
				                      <td>{itemData && itemData.host_name && 
				                      		<React.Fragment key={index}>
				                      	
				                      			<span className="anch-link cursor-pointer" onClick={() => 
												  this.openVmModal(itemData.build_info)}>{((itemData.host_name)?itemData.host_name:"empty")}
													</span>
				                      		</React.Fragment>
				                      }
				                      </td>
				                      <td><button className="btn btn-primary m-t-xs" onClick={() => this.getConsoleOutput(itemData.build_id, itemData.status, true)}>Console Output</button></td>
			                      </tr>
		                      )}
		                      </tbody>
	                      </table>
						{pages && pages.length ? pages.map(page => {
								return current_page === page ? <span className="p-1 m-1 btn btn-danger">{page}</span>: 
									<span className="cursor p-1 m-1 btn btn-info"
										onClick={this.getPageData.bind(this, page)}>{page}</span>}): null}
	                      <Modal className="mypop"
	                      isOpen={this.state.modalIsOpenConsoleOutput}
	                      onAfterOpen={this.afterOpenModalConsoleOutput}
	                      onRequestClose={this.closeModalConsoleOutput}              
	                      contentLabel="Console Output"
	                      >
		                      <h2 style={{color:'red'}}>
		                      Console Output <a className="float-right" href="javascript:void(0);" onClick={this.closeModalConsoleOutput}><i className="fa fa-times" /></a>
		                      </h2>
	
		                      <div className="col-md-12">
		                          <div className="panel panel-default" />
		                          {this.state.isConsoleOutputInprogress && <em><PageLoader/></em>}
	                          	  <pre>
		                        	  {this.state.consoleOutput && this.state.consoleOutput.message && 
		                        		  <div className="console-output-tag">{this.state.consoleOutput.message.body}</div>
		                        	  }
	                        	  </pre>
	                        	  {(this.state.build_status == 'In-Progress' || this.state.build_status == 'null') &&
	                        		  <button className="btn btn-primary m-t-xs" onClick={() => this.getConsoleOutput(this.state.buildId, this.state.build_status, false)}>Refresh</button>  
	                        	  }
	                          </div>
                          </Modal>
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
					                      	{vmDetails 
					                      		&& vmDetails.length > 0 
					                      		&& vmDetails.map((paramData, index) =>{
												let name = Object.keys(paramData)[0],
													value = Object.values(paramData)[0];
												
												if (typeof value === 'object' && value!== null &&
													!Array.isArray(value)
												) {
													value = JSON.stringify(value)
												}

												return <React.Fragment key={index}>
												{(name != 'admin_username' 
													&& name != 'admin_password'
													&& name != 'subscription_id'
													&& name != 'client_id'
													&& name != 'client_secret'
													&& name != 'tenant_id'
													&& name != 'managed_infra_client_id'
													&& name != 'managed_infra_client_secret'
													&& name != 'managed_infra_tenant_id'
													&& name != 'managed_infra_subscription_id'
													&& name != 'weblogic_password'
											)?
													<tr className="bg-color-white" key={index}><td>{name}</td><td>{value}</td></tr>
													:<tr></tr>
												}
												</React.Fragment>
											})}
				                      	</tbody>
			                      	</table>
                	          </div>
                          </Modal>
	                  </div>
		          	}
		          </div>
		      </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {

  const { orders } = state;
  return {
    orders
  };
}

const connectedpendingOrders = connect(mapStateToProps)(pendingOrders);
export { connectedpendingOrders as pendingOrders };
