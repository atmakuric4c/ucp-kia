import React from 'react';
import { connect } from 'react-redux';
import { azureActions } from './azure.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import PageLoader from '../PageLoader';
import { commonFns } from "../../_helpers/common";
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri, decryptResponse } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';
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
class userVmAccessList extends React.Component {
  constructor(props) {
    super(props);
    let user = decryptResponse(localStorage.getItem("user"));
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
	  user_details: user,
      assigned_resource_groups : assigned_resource_groups,
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
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
      vmAccessIsOpen : false,
      isCyberArkUsersInProgress: false,
      cyberArkUsersList : [],
      isAppTypesInProgress: false,
      appTypesList : [],
      azure: [],
      logDetails : [],
      vmDetails : [],
      userVmAccessRequests: [],
      sweetalert: true,
      action: null,
      approval_status : "3",
      hostNames : [],
      hostNamesMod : [],
      hostNamesSelected : [],
      osType : 'Linux',
      role : "",
      searchSubscription : "",
      searchResourceGroupName : "",
      searchOsType : "",
      searchAppType : "",
      search_host_name : "",
      searchCyberArkUser : "",
      searchRole : "",
      Azure_Regions_Data : [],
      durationDays : 0,
      durationHours : 0,
      requestedData : {},
      vmList : [],
      isVmAccessDetailsInprogress: false,
      vmListArr : "",
    };

    this.bindField = this.bindField.bind(this);
    
    this.openVMAccess = this.openVMAccess.bind(this);
    this.closeModalVmAccess = this.closeModalVmAccess.bind(this);
    
    this.subscriptionChange = this.subscriptionChange.bind(this);
    this.revokeVmAccessRequest = this.revokeVmAccessRequest.bind(this);
    
    this.openVmModal = this.openVmModal.bind(this);
    this.afterOpenVmModal = this.afterOpenVmModal.bind(this);
    this.closeVmModal = this.closeVmModal.bind(this);
  }
  
  openVmModal(vmDetails) { 
	  console.log("vmDetails --- ", vmDetails);
	  let itemDetails = {...vmDetails, request_obj : JSON.parse(vmDetails.request_obj), response_obj : JSON.parse(vmDetails.response_obj)};
	  console.log("itemDetails --- ", itemDetails);
      this.setState({ vmModalIsOpen: true, vmDetails: {}, vmList : [], vmListArr : "" });
      var frmData=itemDetails.request_obj.body;
      
      this.setState({
      	isVmAccessDetailsInprogress: true
      });
      const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(ucpEncrypt(frmData))
      };

      fetch(`${config.apiUrl}/secureApi/azure/getHostNames`, requestOptions).then(response  => {
          response.text().then(text => {
              const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
              
              this.setState({
            	  isVmAccessDetailsInprogress: false
              });
              if (response.ok) {
                  var result=(data.value ? data.value : data)
                  console.log("getHostNames result --- ",result);
                  let vmListArr = "";
                  for (var i=0, iLen= result.data.length; i<iLen; i++) {
                	  vmListArr +=result.data[i].host_name;
                	  if(i != (iLen-1)){
                		  vmListArr +=", ";
                	  }
                  }
                  this.setState({
                	  vmDetails: itemDetails,
                	  vmList : result.data,
                	  vmListArr,
                  });
              }
              else{
                  toast.error("The operation did not execute as expected. Please raise a ticket to support");
              }        
          });
      });
  }
  afterOpenVmModal() {       
  //this.subtitle.style.color = "#f00";
  }
  closeVmModal() {    
	  this.setState({ vmModalIsOpen: false });        
  }

  get_OptionConfigJsonData(reqObj){
  	  this.setState({
  		[reqObj.key]: []
  	  });

      var frmData={
		  "option_type": reqObj.key
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
                  console.log(`${reqObj.key} result --- `,result);
              	if(result.status == "success"){
                      this.setState({
                    	  [reqObj.value]: result.data
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
//                            resourceGroups.push(result[rg]);
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

  osTypeChange = (osType,cb) => {
	  this.setState({
		  osType:osType,
		  hostNamesSelected : [],
		  hostNamesSelectedOptions : [],
		  hostNamesMod : [],
	  	  durationDays : 0,
	      durationHours : 0
      });
	  var form = document.querySelector("#azureVmAccessUpdateFrm");
	  var formData = serialize(form, { hash: true });
	  formData.vm_status = 'Running';
	  const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(ucpEncrypt(formData))
      };
	  if(!this.state.region){
    	return;
	  }
	  if(!osType){
		  toast.error("Please select Application Type ");
	    	return;
	  }

      this.setState({
          isVirtualMachinesInProgress: true
      });
      
      fetch(`${config.apiUrl}/secureApi/azure/getHostNames`, requestOptions).then(response  => {
          response.text().then(text => {
              
              var data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
              var errorMsg = "The operation did not execute as expected. Please raise a ticket to support";
              if (response.ok) {
            	  if(data.data && data.data.length > 0){
            		  let hostNamesMod = [];
            		  for(let i=0; i< data.data.length; i++){
            			  hostNamesMod.push({ value: data.data[i].id+"@$"+data.data[i].host_name+"@$"+data.data[i].privateIpAddress, label: data.data[i].host_name });
            		  }
            		  this.setState({
            			  hostNamesMod
	                  });
                  } else {
                      toast.error("VMs not found.");
                  }
              }
              else{
                  toast.error(errorMsg);
              }

              this.setState({
              	isVirtualMachinesInProgress: false
              });
          });
      });
  }
  
  appTypeChange = (appType,cb) => {
	  this.setState({
		  appType:appType,
		  hostNamesSelected : [],
		  hostNamesSelectedOptions : [],
		  hostNamesMod : []
      });
	  var form = document.querySelector("#azureVmAccessUpdateFrm");
	  var formData = serialize(form, { hash: true });
	  formData.vm_status = 'Running';
	  const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(ucpEncrypt(formData))
      };
	  if(!appType){
		  toast.error("Please select Application Type ");
	    	return;
	  }

      this.setState({
          isVirtualMachinesInProgress: true
      });
      
      fetch(`${config.apiUrl}/secureApi/azure/getHostNames`, requestOptions).then(response  => {
          response.text().then(text => {
              
              var data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
              var errorMsg = "The operation did not execute as expected. Please raise a ticket to support";
              if (response.ok) {
            	  if(data.data && data.data.length > 0){
                  	let hostNamesMod = [];
	            		for(let i=0; i< data.data.length; i++){
	            			hostNamesMod.push({ value: data.data[i].id+"@$"+data.data[i].host_name+"@$"+data.data[i].privateIpAddress, label: data.data[i].host_name });
	            		}
	            		this.setState({
                      	hostNamesMod
                      });
                  } else {
                      toast.error("VMs not found.");
                  }
              }
              else{
                  toast.error(errorMsg);
              }

              this.setState({
              	isVirtualMachinesInProgress: false
              });
          });
      });
  }
  openVMAccess(vmDetails){
	  console.log("vmDetails --- ", vmDetails);
	  let requestedData = {...vmDetails, request_obj : JSON.parse(vmDetails.request_obj), response_obj : JSON.parse(vmDetails.response_obj)};
	  console.log("requestedData --- ", requestedData);
      
	  this.setState({ 
		  request_obj_body : requestedData.request_obj.body,
		  vmAccessIsOpen: true, 
		  requestedData,
		  subscription : requestedData.subscription,
		  subscription_display_name : requestedData.subscription_display_name,
		  resourceGroupName : requestedData.request_obj.body.resourceGroupName,
		  region : requestedData.request_obj.body.region,
		  osType : requestedData.request_obj.body.osType,
		  appTypeDisplay : requestedData.appType,
		  appType : requestedData.request_obj.body.appType,
		  hostNamesSelected : requestedData.request_obj.body.hostNames,
		  cyberArkUser : requestedData.request_obj.body.cyberArkUser,
		  accessType : requestedData.accessType,
		  service_account_name : requestedData.request_obj.body.service_account_name,
		  role : ""+requestedData.request_obj.body.role,
		  Sql_Role : ""+requestedData.request_obj.body.Sql_Role,
		  durationDays : ((requestedData.request_obj.body.durationDays)?requestedData.request_obj.body.durationDays:0),
		  durationHours : ((requestedData.request_obj.body.durationHours)?requestedData.request_obj.body.durationHours:0),
	  });
	  setTimeout(() => {
		  console.log("this.state.role --- ", this.state.role);
      }, 500);
  }
  closeModalVmAccess(){
    this.setState({ vmAccessIsOpen: false });
  }
  getAppTypes(){
	  const requestOptions = {
          method: 'GET',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
      };

      this.setState({
          isAppTypesInProgress: true
      });
      
      fetch(`${config.apiUrl}/secureApi/azure/get-cyberark-apps`, requestOptions).then(response  => {
          response.text().then(text => {
              
              var data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
              var errorMsg = "The operation did not execute as expected. Please raise a ticket to support";
              if (response.ok) {
                  if(data.data && data.data.length > 0){
                  	this.setState({
                  		appTypesList : data.data,
              		});
                  } else {
                      toast.error(errorMsg);
                  }
              }
              else{
                  toast.error(errorMsg);
              }

              this.setState({
              	isAppTypesInProgress: false
              });
          });
      });
  }
  getCyberArkUsers(){
	  const requestOptions = {
		  method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(ucpEncrypt({
        	  record_status : 1
          }))
      };

      this.setState({
          isCyberArkUsersInProgress: true
      });
      
      fetch(`${config.apiUrl}/secureApi/azure/get-cyberark-users`, requestOptions).then(response  => {
          response.text().then(text => {
              
              var data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
              var errorMsg = "The operation did not execute as expected. Please raise a ticket to support";
              if (response.ok) {
                  if(data.data && data.data.length > 0){
                  	this.setState({
                  		cyberArkUsersList : data.data,
              		});
                  } else {
                      toast.error(errorMsg);
                  }
              }
              else{
                  toast.error(errorMsg);
              }

              this.setState({
              	isCyberArkUsersInProgress: false
              });
          });
      });
  }
  revokeVmAccessRequest(requestData) {
	  let confirmtext = 'Are you sure do you want to revoke this request.'
	  if (confirm(confirmtext) == true) {
		  console.log("You pressed OK!");
		  const requestOptions = {
	        method: 'POST',
	        headers: { ...authHeader(), 'Content-Type': 'application/json' },
	        body: JSON.stringify(ucpEncrypt({
	        	request_id : requestData.request_id,
	        	request_obj : JSON.parse(requestData.request_obj),
	            "user_id": this.state.user_id,
	        }))
		  };
		  return fetch(`${config.apiUrl}/secureApi/azure/revokeUserVmAccessRequest`, requestOptions).then(response  => {
	        response.text().then(text => {
	            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	            
	            this.setState({
	            	VmAccessRequestInProgress: false
	            });
	            if (response.ok) {
	                var result=(data.value ? data.value : data)
	                console.log("revokeUserVmAccessRequest result --- ",result);
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
	  } else {
		  console.log("cancelled");
	  }
  };
  azureVmAccessRequestUpdate = e => {
    e.preventDefault();      
    var form = document.querySelector("#azureVmAccessUpdateFrm");
    var formData = serialize(form, { hash: true });
    console.log("this.state.hostNamesSelectedOptions ---- ", this.state.hostNamesSelectedOptions);
    console.log("this.state.hostNamesSelected  ---- ", this.state.hostNamesSelected );
    let vm_error = false;
    
	if(!this.state.subscription){
		vm_error = true;
        toast.error("Please select Subscription");
    	return;
	}else if(!this.state.resourceGroupName){
		vm_error = true;
        toast.error("Please select Resource Group");
    	return;
	}else if(this.state.osType == 'Windows' && !this.state.region){
		vm_error = true;
        toast.error("Please select Region");
    	return;
	}else if(!this.state.osType){
		vm_error = true;
        toast.error("Please select OS Type");
    	return;
	}else if(!this.state.appType){
		vm_error = true;
        toast.error("Please select Application Type");
    	return;
	}else if(this.state.osType == 'Windows' && !this.state.role){
		vm_error = true;
        toast.error("Please select Role");
    	return;
	}else if(this.state.osType == 'Windows' && this.state.role && this.state.role == this.state.requestedData.request_obj.body.role){
		vm_error = true;
        toast.error("No change has been observed in the request. Please select another option.");
    	return;
	}else if(!this.state.cyberArkUser){
		vm_error = true;
        toast.error("Please select Provide Access To");
    	return;
	}else if(this.state.osType == 'Windows' && (!this.state.hostNamesSelected || this.state.hostNamesSelected.length == 0)){
		vm_error = true;
        toast.error("Please select Virtual Machines");
    	return;
	}else if(this.state.osType == 'Linux' && this.state.durationDays == 0 && this.state.durationHours == 0){
		vm_error = true;
        toast.error("Please enter Duration");
    	return;
	}else if(this.state.osType == 'Linux' && typeof this.state.durationDays != 'undefined' && this.state.durationDays < 0 || this.state.durationDays > 364){
		vm_error = true;
        toast.error("Please enter valid Duration Days");
    	return;
	}else if(this.state.osType == 'Linux' && typeof this.state.durationHours != 'undefined' && (this.state.durationHours < 0 || this.state.durationHours > 23)){
		vm_error = true;
        toast.error("Please enter valid Duration Hours");
    	return;
	}
	if(this.state.osType == 'Windows'){
		formData.hostNames = this.state.hostNamesSelected;
	}
	console.log("formData ---- ", formData);
	
	if(!vm_error){
	    let newFormData = formData;
	    console.log("newFormData --- ", newFormData);
	
	    this.setState({
	    	VmAccessRequestInProgress: true
	    });

	    let request_obj = {
	        method: 'POST',
	        headers: { 'Content-Type': 'application/json' },
	        body: {
	        	...this.state.request_obj_body,
	        	...newFormData,
	        	"client_id": this.state.clientid,
	            "user_id": this.state.user_id
	        }
	    };
	    console.log("request_obj --- ", request_obj);
	    let request_url = `${config.apiUrl}/secureApi/azure/grantVmAccessToUser`;
	    
	    const requestOptions = {
	        method: 'POST',
	        headers: { ...authHeader(), 'Content-Type': 'application/json' },
	        body: JSON.stringify(ucpEncrypt({
	        	request_id : newFormData.request_id,
	        	"request_type": "Access to VM",
				request_url : request_url,
				request_obj : request_obj,
	            "user_id": this.state.user_id,
	            clientid:this.state.clientid,
	            ref_type : 'vmAccess'
	        }))
	    };
	    return fetch(`${config.apiUrl}/secureApi/azure/updateUserVmAccessRequests`, requestOptions).then(response  => {
	        response.text().then(text => {
	            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	            
	            this.setState({
	            	VmAccessRequestInProgress: false
	            });
	            if (response.ok) {
	                var result=(data.value ? data.value : data)
	                console.log("updateUserVmAccessRequests result --- ",result);
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
		var form = document.querySelector("#azureVmAccessListSearch");
	    var formData = serialize(form, { hash: true });
	    formData = {...formData, user_id : this.state.user_id, approval_status : this.state.approval_status, page_num: page_num};
	    console.log("search formData ---- ", formData);
		this.props.dispatch(azureActions.getUserVmAccessRequests(formData));
	}

  componentDidMount() {
	  this.props.dispatch(azureActions.getAzureSubscriptions({clientid:this.state.clientid, user_role: this.state.user_role, provision_type:this.state.user_details.data.provision_type}));
    this.props.dispatch(azureActions.getUserVmAccessRequests({user_id : this.state.user_id, approval_status : this.state.approval_status, page_num: 1}));

    this.getCyberArkUsers();
    this.getAppTypes();
    this.get_OptionConfigJsonData({key:"WINDOWS_ACCESS_ROLES",value:"WINDOWS_ACCESS_ROLES"});
    this.props.dispatch(azureActions.getAzureDropdownData({clientid:this.state.clientid}));
    
    let self = this;
    var dropdownData = setInterval(function(){
//    	console.log(self.state.azure);
//    	console.log(self.props.azure);
//    	console.log("entered --- ", ((self.props && self.props.azure && self.props.azure.dropdownData && self.props.azure.dropdownData.Azure_Region)?self.props.azure.dropdownData.Azure_Region.length:""));
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
  searchList() {
	  var form = document.querySelector("#azureVmAccessListSearch");
	    var formData = serialize(form, { hash: true });
	    formData = {...formData, user_id : this.state.user_id, approval_status : this.state.approval_status, page_num: 1};
	    console.log("search formData ---- ", formData);
	    this.props.dispatch(azureActions.getUserVmAccessRequests(formData));
  }
  
  hideAlert() {
    this.setState({
      sweetalert: null
    });
  }

  render() { 
   let { azure } = this.props,
				userVmAccessRequests = azure.userVmAccessRequests,
			 total_records = azure.total_records,
				{pages, pages_start, current_page, rowLength} = this.state;
			let subscription_list = this.props.azure.subscription_list;

			pages = Math.ceil(total_records/rowLength) || 0;
			pages = (pages > 25)?25:pages;
			pages = [...Array(pages)].map((_, i) => {
				return i + 1;
			});

    return (
      <div className="container-fluid main-body">
        <div className="contentarea mb-4">
          <h5 className="color">User VM Access List</h5>
          <form
	          name="azureVmAccessListSearch"
	          id="azureVmAccessListSearch"
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
		                        <option value="0">Approval Pending</option>
		                        <option value="1">Approved</option>
		                        <option value="2">Rejected</option>
		                        <option value="3">Request Processed</option>
		                        <option value="4">Request Failed</option>
		                      </select>
		                  </div>
		              </div>
		              <div className="form-group row">
			              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Subscription </label>
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
			        {this.state.searchOsType == 'Linux' && <div className="form-group row">
			              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Application Type</label>
			              <div className="col-sm-9">
				              <select
			                      className="form-control"
			                      value={this.state.searchAppType}
			                      name="searchAppType" id="searchAppType" 
		                    	  onChange={this.bindField}
			                      >
			                      <option value="">--SELECT--</option>
			                      {this.state.appTypesList && this.state.appTypesList.length > 0 && this.state.appTypesList.map((row, index) =>
					                  	<React.Fragment key={index}>
					                  		{row.status && 
					                      <option value={row.name}>
					                          {row.name}
					                      </option>
					                  		}
			                    	</React.Fragment>
			                      )}
			                  </select>
		                  </div>
				      </div>}
				      {this.state.searchOsType == 'Windows' && <div className="form-group row">
			              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Role</label>
			              <div className="col-sm-9">
				              <select
			                      className="form-control"
			                      value={this.state.searchRole}
			                      name="searchRole" id="searchRole" 
		                    	  onChange={this.bindField}
			                      >
			                      <option value="">--SELECT--</option>
			                      <option value="Administrator">Administrator</option>
					              <option value="RemoteDesktopUser">RemoteDesktopUser</option>
			                  </select>
		                  </div>
				      </div>}
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
			              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>User Email </label>
			              <div className="col-sm-9">
				              <input
		                        type="text" 
		                        className="form-control"
		                        name="searchCyberArkUser"
		                        placeholder="User Email"
		                        onChange={this.bindField}
		                        value={this.state.searchCyberArkUser}
		                        />
				              {/*<select
			                      className="form-control"
			                      value={this.state.searchCyberArkUser}
			                      name="searchCyberArkUser"
		                    	  onChange={this.bindField}
			                      >
			                      <option value="">--SELECT--</option>
			                      {this.state.cyberArkUsersList && this.state.cyberArkUsersList.length > 0 && this.state.cyberArkUsersList.map((row, index) =>
					                  	<React.Fragment key={index}>
				                      <option value={row.user_id}>
				                          {row.email}
				                      </option>
			                    	</React.Fragment>
			                      )}
			                  </select>*/}
		                  </div>
				      </div>
				      <div className="form-group row">
			              <div className='col-sm-3  col-form-label'></div>
			              <div className="col-sm-9">
			              	<span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.searchList()}>Search</span>
			              </div>
		              </div>
		          </div>
		          <div className="col-lg-6 m-t-xxs">
	                  
	              </div>
              </div>
	      </form>
          {!azure.error && azure.loading && <em><PageLoader/></em>}
          {azure.error && <span className="text-danger">ERROR - {azure.error}</span>}
          {userVmAccessRequests && userVmAccessRequests.items && !azure.loading &&
            <div className="tableresp table-responsive">
			{pages && pages.length ? pages.map((page, index) => {
					return current_page === page ? <span className="p-1 m-1 btn btn-danger" key={index}>{page}</span>: 
					<span className="cursor p-1 m-1 btn btn-info"
							onClick={this.getPageData.bind(this, page)} key={index}>{page}</span>}): null}
              <table className="table table-bordered table-striped table-dark table-custom table-hover" id="userVmAccessRequests">
                <thead>
                  <tr>
                    {/**<th>Request Id</th> */}
                    <th>VM Name / Safe & Member Name</th>
                    <th>OS Type</th>
                    <th>Request Raised By & Date</th>
                    <th>Status</th>
                    <th>Approved/Rejected By & Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userVmAccessRequests.items.length > 0 && userVmAccessRequests.items.map((itemData, index) =>
                    <tr key={index}>
                      {/**<td>{itemData.id}</td> */}
                      <td><div dangerouslySetInnerHTML={ {__html: ((itemData.osType == 'Windows')?itemData.host_name:itemData.safeName) +" <br/> "+ itemData.safe_requested_for} } ></div>
	                      <div className="col-md-12">
		                      <div className="text-right">
		                      	<span className="anch-link cursor-pointer" onClick={() => this.openVmModal(itemData)}>Additional info &#62;&#62;</span>
		                      </div>
		                  </div>
                      </td>
                      <td>{itemData.osType}</td>
                      <td>{itemData.order_raised_by}<br/>{itemData.requested_date} {this.state.user_details.data.TIME_ZONE}</td>
                      <td>{((itemData.approval_status == 1)?"Approved":((itemData.approval_status == 0)?"Approval Pending":((itemData.approval_status == 2)?"Rejected":((itemData.approval_status == 3)?"Request Processed":"Request Failed"))))}</td>
                      <td>{itemData.updated_email}<br/>{itemData.updated_date} {itemData.updated_date && this.state.user_details.data.TIME_ZONE}</td>
                      <td>{(itemData.approval_status == 3 && !itemData.is_revoked 
                    		  && ((itemData.osType == 'Windows' && itemData.vm_record_status) || itemData.osType == 'Linux') 
                    		  && (this.state.is_manager[itemData.subscription+"@$"+itemData.resourceGroup] || this.state.isSuperAdmin == '1'))? <span>
                      			{itemData.appType != 'SQL' && <span className="alert info-box-danger mr-2 cursor-pointer float-right" onClick={() => this.revokeVmAccessRequest(itemData)}>Revoke</span>}
	                      		<span className="alert info-box-blue mr-2 cursor-pointer float-right" onClick={() => this.openVMAccess(itemData)}>Edit</span>
                      		</span>
                      :""		
                      }
                      </td>
                    </tr>
                  )}
                  {userVmAccessRequests.items.length == 0 && 
                      <tr>
                        <td colSpan="7" align="center">No Records</td>
                      </tr>
                  }
                </tbody>
              </table>
              {pages && pages.length ? pages.map((page, index) => {
				return current_page === page ? <span className="p-1 m-1 btn btn-danger" key={index}>{page}</span>: 
				<span className="cursor p-1 m-1 btn btn-info"
						onClick={this.getPageData.bind(this, page)} key={index}>{page}</span>}): null}
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
		              			{this.state.isCyberArkUsersInProgress && <em><PageLoader/></em>}
				              	{!this.state.isCyberArkUsersInProgress && this.state.vmDetails &&
				              		<React.Fragment>
				              			<tr className="bg-color-white"><td>Subscription </td><td>{this.state.vmDetails.subscription_display_name}</td></tr>
				              			<tr className="bg-color-white"><td>Resource Group</td><td>{this.state.vmDetails.resourceGroup}</td></tr>
				              			<tr className="bg-color-white"><td>OS Type</td><td>{this.state.vmDetails.osType}</td></tr>
				              			{this.state.vmDetails.osType == 'Windows' && <tr className="bg-color-white"><td>Location</td><td>{this.state.vmDetails.location}</td></tr>}
				              			<tr className="bg-color-white"><td>Application Type</td><td>{this.state.vmDetails.appType}</td></tr>
				              			{this.state.vmDetails.osType == 'Windows' && <tr className="bg-color-white"><td>Access Type</td><td>{this.state.vmDetails.accessType}</td></tr>}
				              			{this.state.vmDetails.osType == 'Windows' && <tr className="bg-color-white"><td>Role</td><td>{this.state.vmDetails.role}</td></tr>}
				              			{this.state.vmDetails.osType == 'Windows' && this.state.vmDetails.appType == 'SQL' && this.state.vmDetails.accessType == 'userAccount' && <tr className="bg-color-white"><td>SQL Role</td><td>{this.state.vmDetails.Sql_Role}</td></tr>}
				              			{this.state.vmDetails.osType == 'Windows' && this.state.vmDetails.service_account_name && <tr className="bg-color-white"><td>Service Account Name</td><td>{this.state.vmDetails.service_account_name}</td></tr>}
				              			{this.state.vmDetails.osType == 'Windows' && <tr className="bg-color-white"><td>VM Name</td><td>{this.state.vmDetails.host_name}</td></tr>}
				              			{this.state.vmDetails.osType == 'Linux' && <tr className="bg-color-white"><td>Duration</td><td>{this.state.vmDetails.request_obj && this.state.vmDetails.request_obj.body && this.state.vmDetails.request_obj.body.durationDays+" Days "+this.state.vmDetails.request_obj.body.durationHours+" Hours"}</td></tr>}
				              			<tr className="bg-color-white"><td>Provide Access To</td><td>{this.state.vmDetails.safe_requested_for}</td></tr>
				              			{this.state.vmDetails.osType == 'Linux' && <tr className="bg-color-white"><td>Safe Name</td><td>{this.state.vmDetails.safeName}</td></tr>}
				              			<tr className="bg-color-white"><td>Server Response Message</td><td>{this.state.vmDetails.response_obj && this.state.vmDetails.response_obj.message}</td></tr>
				              			<tr className="bg-color-white"><td>VM List</td><td>{this.state.vmListArr}</td></tr>
				                    </React.Fragment>
				              	}
		                     </React.Fragment>
                      	</tbody>
                  	</table>
	          </div>
          </Modal>
          <Modal
	          isOpen={this.state.vmAccessIsOpen}
	          onRequestClose={this.closeModalVmAccess}
	          contentLabel="User VM Access"
	          >
	          <h2 style={{color:'red'}}>
	              User VM Access <span className="float-right cursor-pointer" onClick={this.closeModalVmAccess}><i className="fa fa-times" /></span>
	          </h2>
	          <div className="col-md-12">
	              <div className="panel panel-default" />
	              <form
	                  name="azureVmAccessUpdateFrm"
	                  id="azureVmAccessUpdateFrm"
	                  method="post"
	                  onSubmit={this.azureVmAccessRequestUpdate}
	                  >
		              <div className="form-group">
			              <label htmlFor="cloud_type" className='font-weight-bold'>Subscription :&nbsp;</label>
			              <input type="hidden" name="subscription" value={this.state.subscription} />
		                  {this.state.subscription} / {this.state.subscription_display_name}
		              </div>
		              <div className="form-group">
			            <label htmlFor="cloud_type" className='font-weight-bold'>Resource Group :&nbsp;</label>
			            <input type="hidden" name="resourceGroupName" value={this.state.resourceGroupName} />
		                  {this.state.resourceGroupName}
			          </div>
			          {this.state.osType == 'Windows' && <div className="form-group">
			            <label htmlFor="cloud_type" className='font-weight-bold'>Region :&nbsp;</label>
			            <input type="hidden" name="region" value={this.state.region} />
		                  {this.state.requestedData.location}
			          </div>}
			          <div className="form-group">
			            <label htmlFor="cloud_type" className='font-weight-bold'>OS Type :&nbsp;</label>
			            <input type="hidden" name="osType" value={this.state.osType} />
		                  {this.state.osType}
			          </div>
			          <div className="form-group">
			              <label htmlFor="cloud_type" className='font-weight-bold'>Application Type :&nbsp;</label>
			              <input type="hidden" name="appType" value={this.state.appType} />
		                  {this.state.appTypeDisplay}
				      </div>
				      {this.state.osType == 'Windows' && <div className="form-group">
			              <label htmlFor="cloud_type" className='font-weight-bold'>Access Type :&nbsp;</label>
			              <input type="hidden" name="accessType" value={this.state.accessType} />
		                  {this.state.accessType}
				      </div>}
				      {this.state.osType == 'Windows' && this.state.service_account_name && <div className="form-group">
			              <label htmlFor="cloud_type" className='font-weight-bold'>Service Account Name :&nbsp;</label>
			              <input type="hidden" name="service_account_name" value={this.state.service_account_name} />
		                  {this.state.service_account_name}
				      </div>}
				      {this.state.osType == 'Windows' && this.state.appType == 'SQL' && this.state.accessType == 'userAccount' && <div className="form-group">
			              <label htmlFor="cloud_type" className='font-weight-bold'>SQL Role :&nbsp;</label>
			              <input type="hidden" name="Sql_Role" value={this.state.Sql_Role} />
		                  {this.state.Sql_Role}
				      </div>}
				      {this.state.osType == 'Windows' && <div className="form-group">
			              <label htmlFor="cloud_type" className='font-weight-bold'>Virtual Machines :&nbsp;</label>
			              <input type="hidden" name="hostNamesSelected" value={this.state.hostNamesSelected} />
		                  {this.state.requestedData.host_name}
				      </div>}
				      <div className="form-group">
			              <label htmlFor="cloud_type" className='font-weight-bold'>Provided Access To :&nbsp;</label>
			              <input type="hidden" name="cyberArkUser" value={this.state.cyberArkUser} />
		                  {this.state.requestedData.safe_requested_for}
				      </div>
				      {this.state.osType == 'Windows' && <div className="form-group">
			              <label htmlFor="cloud_type" className=''>Role <span className="star-mark">*</span></label>
		                  <select
		                      className="form-control"
		                      value={this.state.role}
		                      name="role" id="role" 
	                    	  onChange={this.bindField}
		                      >
		                      <option value="">--SELECT--</option>
		                      {this.state.WINDOWS_ACCESS_ROLES && this.state.WINDOWS_ACCESS_ROLES.length > 0 && this.state.WINDOWS_ACCESS_ROLES.map((row, index) =>
			                  	<React.Fragment key={index}>
			                  		{row.record_status && this.state.appType == row.appType && this.state.accessType == row.accessType && 
				                      <option value={row.value}>
				                          {row.name}
				                      </option>
			                  		}
		                    	</React.Fragment>
		                      )}
	                    </select>
				      </div>}
				      {this.state.osType == 'Linux' && <div className="form-group">
			              <label htmlFor="cloud_type" className=''>Duration <span className="star-mark">*</span></label><br/>
		                  <input type="number" className="form-control-inline" value={this.state.durationDays} name="durationDays" min="0" step="1" max="364" onChange={this.bindField} /> Days
		                  <input type="number" className="form-control-inline" value={this.state.durationHours} name="durationHours" min="0" step="1" max="23" onChange={this.bindField} /> Hours
	                  </div>}
	                  <div className="form-group">
		                  <input type="hidden" name="clientid" value={this.state.clientid} />    
		                  <input type="hidden" name="request_id" value={this.state.requestedData.request_id} />
	                      <button
	                      className={"btn btn-sm btn-primary " + (this.state.VmAccessRequestInProgress ? "no-access" : "")} disabled={this.state.VmAccessRequestInProgress ? true : false}
	                      >
	                      {this.state.VmAccessRequestInProgress && 
	                          <i className="fas fa-circle-notch icon-loading"></i>
	                      }
	                      Update</button>
	                  </div>
	              </form>
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
  const { azure } = state;
  return {
	  azure
  };
}

const connectedPage = connect(mapStateToProps)(userVmAccessList);
export { connectedPage as userVmAccessList };