import React from 'react';
import { connect } from 'react-redux';
import { azureActions } from './azure.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import Moment from 'react-moment';
import PageLoader from '../PageLoader';
import { authHeader,ucpEncrypt, ucpDecrypt, decryptResponse } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';
import { MDBDataTable } from 'mdbreact';
import { commonFns } from "../../_helpers/common";
import { default as ReactSelect } from "react-select";
import { exportDataToExcel } from '../../_helpers';

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
class AzureVmlist extends React.Component {
  constructor(props) {
    super(props);
    let user = decryptResponse( localStorage.getItem("user"));
    let is_manager = {},
	resource_groups = user.data.resource_groups.map(resource => {
		is_manager[resource.subscription_id+"@$"+resource.name] = resource.role_id === 3;
		return resource.name;
	});
    console.log("is_manager --- ", is_manager);
    let assigned_resource_groups = user.data.resource_groups.map(resource => {
		return resource.subscription_id+"@$"+resource.name;
	});
    this.state = {
      assigned_resource_groups : assigned_resource_groups,
      clientid: user.data.clientid,
      user_role: user.data.user_role,
      user_id: user.data.id,
      isSuperAdmin: user.data.isSuperAdmin,
      provision_type: user.data.provision_type,
      user:user,
      resourceList: [],
      resourceGroups:[],
      isItFirstLoad: false,
      subscriptionSelectedValue: "",
      isResouceListLoading: false,
      is_subscription_list_loaded: false,
      isAllUsersListInProgress : false,
      azure: [],
      vm_data:[],
      logData: [],
      Azure_Regions_Data : [],
      searchSubscription : "",
      searchResourceGroupName : "",
      searchRegion : "",
      searchOsType : "",
      searchAppType : "",
      search_host_name : "",
      sweetalert: null,
      modalIsOpen: false,
      action: null,
      loading:true,
      usersList : [],
      usersListMod : [],
      usersListSelected : [],
      data: {
          columns: [
            {
                label: 'Name',
                field: 'name',
            },
            {
                label: 'Power Status',
                field: 'power_status',
            },
            {
                label: 'VM Status',
                field: 'vm_status'
            },
            {
                label: 'Location',
                field: 'location'
            },
            {
                label: 'Resource Group',
                field: 'resourceGroup'
            },
            {
                label: 'OS Template',
                field: 'os_template_name'
            },
            {
                label: 'Disk Units GB',
                field: 'disk_units_gb'
            },
            {
                label: 'CI Number',
                field: 'cmdb_ci_number'
            },
            {
                label: 'RFC Number',
                field: 'cmdb_rfc_number'
            },
            {
                label: 'Provisioned By',
                field: 'provisioned_by'
            },
            {
                label: '',
                field: 'action'
            }
          ],
          rows: [],
      },
      exportData : [],
    };
    this.intervalConter = null;
    this.loaderImage=this.loaderImage.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.bindField = this.bindField.bind(this);
  }
  

  resetGetVmList() {
	  this.setState({
//		  searchSubscription : "",
		  searchResourceGroupName : "",
		  searchRegion : "",
		  searchOsType : "",
		  search_host_name : "",
		  usersListSelected : [],
		  usersListSelectedOptions : [],
	  });
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
  
  loaderImage(){
    this.props.dispatch(azureActions.getAll(this.state.clientid));
  }
  
  openModal() {      
    this.setState({ modalIsOpen: true });
  }

  closeModal() {
    this.setState({ modalIsOpen: false });
    window.location.reload();         
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
  
  componentDidMount() {
	  this.getAllUsersList();
	  $(window).keydown(function(event){
	    if(event.keyCode == 13) {
	      event.preventDefault();
	      return false;
	    }
	  });
	  this.props.dispatch(azureActions.getAzureSubscriptions({clientid:this.state.clientid, user_role: this.state.user_role,provision_type:this.state.user.data.provision_type}));
//    this.props.dispatch(azureActions.getAll(this.state.clientid));
	  this.props.dispatch(azureActions.getAzureDropdownData({clientid:this.state.clientid}));
	    
	    let self = this;
	    var dropdownData = setInterval(function(){
//	    	console.log(self.state.azure);
//	    	console.log(self.props.azure);
//	    	console.log("entered --- ", ((self.props && self.props.azure && self.props.azure.dropdownData && self.props.azure.dropdownData.Azure_Region)?self.props.azure.dropdownData.Azure_Region.length:""));
	    	if(self.props && self.props.azure && self.props.azure.dropdownData && self.props.azure.dropdownData.Azure_Region && self.props.azure.dropdownData.Azure_Region.length > 0){
	    		clearInterval(dropdownData);
	    		setTimeout(() => {
	    			self.setState({
	    				Azure_Regions_Data: self.props.azure.dropdownData.Azure_Region
			        });
	            }, 100);
	    	}
	    }, 1000);
  }

  hideAlert() {
    this.setState({
      sweetalert: null
    });
  }

  bytes2English(filesize)
	{
		//return $filesize;
		if(filesize<1048676)
			return (filesize/1024,1) + " KB";
		if(filesize>=1048576 && filesize<1073741824)
			return (filesize/1048576,1) + " MB";
		if(filesize>=1073741824 && filesize<1099511627776)
			return (filesize/1073741824,2) + " GB";
		if(filesize>=1099511627776)
			return (filesize/1099511627776,2) + " TB";
		if(filesize>=1125899906842624) //Currently, PB won't show due to PHP limitations
			return (filesize/1125899906842624,3) + " PB";
  }
  subscriptionChange(value,cb){
    if(!value){
      value = $("#drp_subscription option:selected").val();
    }

//    this.setState({
//      subscriptionSelectedValue: value,
//      isResouceListLoading: true
//    });

//    this.getVmList( { "clientid" : this.state.clientid, "subscriptionId" : value,
//		user_role: this.state.user_role, 
//		provision_type : this.state.provision_type,
//		user_id:this.state.user_id});
    
    
    if(cb){
		  console.log("iffff");
		  this.setState({
			  searchSubscription:value,
			  searchResourceGroupName : "",
	    	searchAppType:"",
	      });
	  }else{
		  console.log("elseeee");
	      this.setState({
	        subscription:value,
	        resourceGroupName : "",
	    	appType:"",
	      });
	  }
    
    if(value){
      var frmData={
      	subscription_id: value,
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
//                          resourceGroups.push(result[rg]);
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
	    });
    }
  }
  
  loadResourceList(){
    setTimeout(() => {
      if(!this.state.isItFirstLoad){
        if(document.getElementById("drp_subscription") && document.getElementById("drp_subscription")[0]){
          document.getElementById("drp_subscription")[0].remove();
        }

        this.setState({
          subscriptionSelectedValue: this.props.azure.subscription_list[0].subscription_id
        });
        setTimeout(() => {
        	this.subscriptionChange(this.props.azure.subscription_list[0].subscription_id,"search")
        }, 500);

        this.getVmList( { "clientid" : this.state.clientid, "searchSubscription" : this.props.azure.subscription_list[0].subscription_id,
    		user_role: this.state.user_role,  
    		provision_type : this.state.provision_type,
    		user_id:this.state.user_id});

        this.setState({
          isItFirstLoad: true,
          is_subscription_list_loaded: true
        });
      }
    }, 500);
  }
  
  getVmList(frmData) {
//	  e.preventDefault();
    this.setState({
      isResouceListLoading: true
    });
    if(!frmData){
    	frmData = {};
    }
    
    var form = document.querySelector("#azureVmListSearch");
    var formData = serialize(form, { hash: true });
    formData = {...formData, ...frmData, "clientid" : this.state.clientid, user_id : this.state.user_id,
    		user_role: this.state.user_role,  
    		provision_type : this.state.provision_type,
    		user_id:this.state.user_id		
    };
    
    formData.subscriptionId = formData.searchSubscription;
    formData.usersList = this.state.usersListSelectedOptions;
    console.log("search formData ---- ", formData);

    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(formData))
    };

    fetch(`${config.apiUrl}/secureApi/azure/listdata`, requestOptions).then(response  => this.handleVmListResponse(response));
  }
  handleVmListResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        let resourceList = [];
        let exportData = [];
        
        if(data && data.value){
          for(let i =0; i < data.value.length; i++){
            let newRow = {};
            newRow.name = data.value[i].host_name; 
            newRow.power_status = data.value[i].power_status;
            newRow.vm_status = data.value[i].vm_status;
            newRow.location = data.value[i].location;
            newRow.resourceGroup = data.value[i].resourceGroup;
            newRow.os_template_name = data.value[i].os_template_name;
            newRow.cmdb_ci_number = data.value[i].cmdb_ci_number;
            newRow.cmdb_rfc_number = data.value[i].cmdb_rfc_number;
            newRow.provisioned_by = data.value[i].provisioned_by;
            newRow.disk_units_gb = data.value[i].disk_units_gb + " GB";
            newRow.action = <a className="cursor" href={"#/azurevmdetail?id=" + data.value[i].subscriptionId + "&name=" + data.value[i].host_name }>VM Details</a>;
            resourceList.push(newRow);
            
            let newExportRow = {};
            newExportRow['Name'] = data.value[i].host_name; 
            newExportRow['Power Status'] = data.value[i].power_status;
            newExportRow['VM Status'] = data.value[i].vm_status;
            newExportRow['Location'] = data.value[i].location;
            newExportRow['Resource Group'] = data.value[i].resourceGroup;
            newExportRow['OS Template'] = data.value[i].os_template_name;
            newExportRow['Disk Units GB'] = data.value[i].disk_units_gb + " GB";
            newExportRow['CI Number'] = data.value[i].cmdb_ci_number;
            newExportRow['RFC Number'] = data.value[i].cmdb_rfc_number;
            newExportRow['Provisioned By'] = data.value[i].provisioned_by;
            exportData.push(newExportRow);
          }
        }

        this.state.data.rows = resourceList;
        if (data && data.error && data.error.message) {
          toast.error(data.error.message);
        }
        else{
          if(this.state.data.rows.length == 0){
            toast.error("No record for current selection!");
          }

          this.setState({
            data: this.state.data
          })
          //return data;
        }
        this.setState({
          isResouceListLoading: false,
          exportData
        }) 
    });
  }
  
  render() { 
    const { azure} = this.props;
    let subscription_list = this.props.azure.subscription_list;
    let vm_data=this.props.azure.vm_data;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">Azure VMs</h5>
         
          <form
	          name="azureVmListSearch"
	          id="azureVmListSearch"
	          method="post"
	          onSubmit={this.getVmList}
	          >
	          <div className="row mt-4">
		          <div className="col-lg-6">
		              <div className="form-group row">
		                  <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Subscription</label>                
		                  <div className="col-sm-9">
		                      <select
		                      className="form-control"
		                      required
		                      name="searchSubscription"
		                      id="drp_subscription"
				              value={this.state.searchSubscription}
		                      onChange={e => this.subscriptionChange(e.target.value,"search")}
		                      >
		                      <option value="">--Select--</option>
		                      {subscription_list && subscription_list.length > 0 && subscription_list.map((sub, index) =>
		                          <option value={sub.subscription_id} key={index}>
		                              {sub.display_name}
		                          </option>
		                      )}
		                      </select>
		                      { /* !this.state.is_subscription_list_loaded && 
		                        <i className="fas fa-circle-notch icon-loading drp-loader-icon"></i>
		                      */ }
		
		                      {subscription_list && subscription_list.length > 0 && this.loadResourceList()}
		                  </div>
		              </div>
		              <div className="form-group row">
			            <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Resource Group</label>
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
				            {this.state.isResourceGroupInprogress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
			            </div>
			        </div>
			        <div className="form-group row">
			            <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Region</label>
			            <div className="col-sm-9">
				            <select
				                className="form-control"
				                value={this.state.searchRegion}
				              	name="searchRegion"
			                    id="searchRegion"
			                	onChange={this.bindField}
				                >
				                <option value="">--SELECT--</option>
				                {this.state.Azure_Regions_Data && this.state.Azure_Regions_Data.length > 0 && this.state.Azure_Regions_Data.map((row, index) =>
			                        <option value={row.location} key={index}>
			                            {row.value}
			                        </option>
			                    )}
				            </select>
			            </div>
			        </div>
			        <div className="form-group row">
			            <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>OS Type</label>
			            <div className="col-sm-9">
				            <select
				                className="form-control"
				                value={this.state.searchOsType}
				              	name="searchOsType"
			                    id="searchOsType"
		                    	onChange={this.bindField}
				                >
					            <option value="">--SELECT--</option>    
					            <option value="Linux">Linux</option>
				                <option value="Windows">Windows</option>
				            </select>
			            </div>
			        </div>
				      <div className="form-group row">
			              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Virtual Machines</label>
			              <div className="col-sm-9">
				              <input
		                        type="text" 
		                        className="form-control"
		                        name="search_host_name"
		                        placeholder="Virtual Machine"
		                        onChange={this.bindField}
		                        value={this.state.search_host_name}
		                        />
			              </div>
				      </div>
				      <div className="form-group row">
			              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Provisioned By</label>
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
			              	<span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.getVmList()}>Search</span>
			              	<span className="btn info-box-danger cursor-pointer m-l-xs" onClick={() => this.resetGetVmList()}>Reset</span>
			              </div>
		              </div>
		          </div>
		        </div>
	        </form>
	        <div className="row mt-4">
		        <div className="col-md-12">
		            {this.state.isResouceListLoading ? <PageLoader/> :
		            <React.Fragment>
		              {this.state.data.rows && this.state.data.rows.length > 0 &&
		            	  <React.Fragment>
		              		<div className="col-md-12 float-right">
			            	  <button onClick={e => { 
				                  return this.state.data.rows && this.state.data.rows.length ? 
				                		  exportDataToExcel({data: this.state.exportData, reportName : "Azure-VM-List"}) : 
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
         </div>
      </div>

    );
  }
}

function mapStateToProps(state) {
  const { azure, logData,vm_data, diskInfo } = state;
  return {
    azure,
    logData,
    vm_data,
    diskInfo
  };
}

const connectedVmlist = connect(mapStateToProps)(AzureVmlist);
export { connectedVmlist as AzureVmlist };