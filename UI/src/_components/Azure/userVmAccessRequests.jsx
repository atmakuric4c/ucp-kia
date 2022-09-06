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
class userVmAccessRequests extends React.Component {
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
      appTypesList : [],
      azure: [],
      logDetails : [],
      vmDetails : [],
      userVmAccessRequests: [],
      sweetalert: true,
      action: null,
      approval_status : "ALL",
      hostNames : [],
      hostNamesMod : [],
      hostNamesSelected : [],
      osType : 'Linux',
      appType: "",
	  accessType : "",
	  service_account_name : "a1d_",
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
      CYBER_ARK_ACCOUNT_TYPES : [],
      WINDOWS_APPLICATION_TYPES : [],
      WINDOWS_ACCESS_ROLES : [],
      WINDOWS_ACCESS_TYPES : [],
      isVmsExists : false,
      cyberArkUserEmail : "",
    };

    this.bindField = this.bindField.bind(this);
    this.updateUserVmAccessRequestsStatus = this.updateUserVmAccessRequestsStatus.bind(this);
    
    this.openVmModal = this.openVmModal.bind(this);
    this.afterOpenVmModal = this.afterOpenVmModal.bind(this);
    this.closeVmModal = this.closeVmModal.bind(this);
    this.processUserVmAccessRequest = this.processUserVmAccessRequest.bind(this);
    
    this.openVMAccess = this.openVMAccess.bind(this);
    this.closeModalVmAccess = this.closeModalVmAccess.bind(this);
    
    this.subscriptionChange = this.subscriptionChange.bind(this);
  }
  resetVmAccessRequestForm() {
	  this.setState({
		  subscription : "",
		  resourceGroupName : "",
		  region : "",
		  accountType : "",
		  appType : "",
		  accessType : "",
		  role : "",
		  cyberArkUser : "",
		  cyberArkUserEmail : "",
		  durationDays : 0,
		  durationHours : 0,
		  hostNamesSelected : [],
		  hostNamesSelectedOptions : [],
	  });
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
	      durationHours : 0,
	      accountType : "",
	      appType : "",
	      accessType : "",
	      role : "",
      });
	  if(!this.state.region){
    	return;
	  }
	  if(!osType){
		  toast.error("Please select Application Type ");
	    	return;
	  }
	  /*var form = document.querySelector("#azureVmAccess");
	  var formData = serialize(form, { hash: true });
	  formData.vm_status = 'Running';
	  const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(ucpEncrypt(formData))
      };
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
      });*/
  }
  
  accountTypeChange = (accountType,cb) => {
	  this.setState({
		  accountType : accountType,
		  appType:"",
		  hostNamesSelected : [],
		  hostNamesSelectedOptions : [],
		  hostNamesMod : []
      });
	  if(!accountType){
		  toast.error("Please select Account Type ");
		  return;
	  }else if(accountType != 'onlyApps'){
		  var form = document.querySelector("#azureVmAccess");
		  var formData = serialize(form, { hash: true });
		  formData.vm_status = 'Running';
		  formData.appTypesList = this.state.appTypesList;
		  formData.WINDOWS_APPLICATION_TYPES = this.state.WINDOWS_APPLICATION_TYPES;
		  const requestOptions = {
	          method: 'POST',
	          headers: { ...authHeader(), 'Content-Type': 'application/json' },
	          body: JSON.stringify(ucpEncrypt(formData))
	      };

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
	                      	hostNamesMod,
	                      	isVmsExists : true
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
  }
  appTypeChange = (appType,cb) => {
	  this.setState({
		  appType:appType,
		  hostNamesSelected : [],
		  hostNamesSelectedOptions : [],
		  hostNamesMod : [],
	      accessType : "",
	      role : "",
	      isVmsExists : false
      });
	  var form = document.querySelector("#azureVmAccess");
	  var formData = serialize(form, { hash: true });
	  formData.vm_status = 'Running';
	  formData.appTypesList = this.state.appTypesList;
	  formData.WINDOWS_APPLICATION_TYPES = this.state.WINDOWS_APPLICATION_TYPES;
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
                      	hostNamesMod,
                      	isVmsExists : true
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
  openVMAccess(){
	  this.setState({ vmAccessIsOpen: true,service_account_name : "a1d_"});
  }
  closeModalVmAccess(){
    this.setState({ vmAccessIsOpen: false });
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
  azureVmAccessRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#azureVmAccess");
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
	}else if(this.state.osType == 'Linux' && !this.state.accountType){
		vm_error = true;
        toast.error("Please select Account Type");
    	return;
	}else if(!this.state.appType && ((this.state.accountType == 'onlyApps' && this.state.osType == 'Linux') || this.state.osType == 'Windows')){
		vm_error = true;
        toast.error("Please select Application Type");
    	return;
	}else if(this.state.osType == 'Windows' && !this.state.accessType){
		vm_error = true;
        toast.error("Please select Access Type");
    	return;
	}else if(this.state.osType == 'Windows' && !this.state.role){
		vm_error = true;
        toast.error("Please select Role");
    	return;
	}else if(this.state.osType == 'Linux' && !this.state.cyberArkUser){
		vm_error = true;
        toast.error("Please select Provide Access To");
    	return;
	}else if((this.state.osType == 'Windows' || (this.state.osType == 'Linux' && this.state.cyberArkUser == 'OTHER')) && !this.state.cyberArkUserEmail){
		vm_error = true;
        toast.error("Please enter User Email");
    	return;
	} else if((this.state.osType == 'Windows' || (this.state.osType == 'Linux' && this.state.cyberArkUser == 'OTHER')) && this.state.cyberArkUserEmail.substr(-8) != '@dhl.com'){
		vm_error = true;
        toast.error("Please enter valid Email");
    	return;
	}else if(this.state.osType == 'Windows' && (!this.state.hostNamesSelected || this.state.hostNamesSelected.length == 0)){
		vm_error = true;
        toast.error("Please select Virtual Machines");
    	return;
	}else if(this.state.osType == 'Linux' && this.state.durationDays == 0 && this.state.durationHours == 0){
		vm_error = true;
        toast.error("Please enter Duration");
    	return;
	}else if(this.state.osType == 'Windows' && this.state.accessType == 'serviceAccount' && !this.state.service_account_name){
		vm_error = true;
        toast.error("Please enter Service Account Name");
    	return;
	}else if(this.state.osType == 'Windows' && this.state.accessType == 'serviceAccount' && this.state.service_account_name && this.state.service_account_name.indexOf("a1d_") != 0){
		vm_error = true;
        toast.error("Service Account Name should start with 'a1d_'");
    	return;
	} else if(this.state.osType == 'Windows' && this.state.accessType == 'serviceAccount' && this.state.service_account_name && /[^a-zA-Z0-9_]/.test(this.state.service_account_name)){
		vm_error = true;
		toast.error("Please enter alphabets or numbers or underscore( _ ) for Service Account Name");
        return;
    } else if(this.state.osType == 'Windows' && this.state.appType == 'SQL' && this.state.accessType == 'userAccount' && !this.state.Sql_Role){
    	vm_error = true;
        toast.error("Please select SQL Role");
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
	if(this.state.osType == 'Linux' && this.state.accountType != 'onlyApps'){
		formData.appType = "ALL@$"+this.state.accountType;
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
	        body: {...newFormData,
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
	        	"request_type": "Access to VM",
				request_url : request_url,
				request_obj : request_obj,
	            "user_id": this.state.user_id,
	            clientid:this.state.clientid,
	            ref_type : 'vmAccess'
	        }))
	    };
	    return fetch(`${config.apiUrl}/secureApi/azure/saveUserVmAccessRequests`, requestOptions).then(response  => {
	        response.text().then(text => {
	            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	            
	            this.setState({
	            	VmAccessRequestInProgress: false
	            });
	            if (response.ok) {
	                var result=(data.value ? data.value : data)
	                console.log("saveUserVmAccessRequests result --- ",result);
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
    		appType: "",
    		accessType : "",
    		accountType : "",
    		role : "",
        });
        setTimeout(() => {
        	this.osTypeChange(this.state.osType, "");
        }, 100);
	  }else if (e.target.name == "appType"){
		  this.setState({
			  hostNamesSelected : [],
			  hostNamesSelectedOptions : [],
			  hostNamesMod : [],
		  });
	  }else if (e.target.name == "accessType"){
		  this.setState({
		      role : "",
		  });
	  }else if (e.target.name == "cyberArkUser"){
		  this.setState({
			  cyberArkUserEmail : "",
		  });
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
		var form = document.querySelector("#azureVmAccessSearch");
	    var formData = serialize(form, { hash: true });
	    formData = {...formData, user_id : this.state.user_id, approval_status : this.state.approval_status, page_num: page_num};
	    console.log("search formData ---- ", formData);
		this.props.dispatch(azureActions.getUserVmAccessRequests(formData));
	}

  componentDidMount() {
	  this.props.dispatch(azureActions.getAzureSubscriptions({clientid:this.state.clientid, user_role: this.state.user_role, provision_type:this.state.user_details.data.provision_type}));
    this.props.dispatch(azureActions.getUserVmAccessRequests({user_id : this.state.user_id, approval_status : this.state.approval_status, page_num: 1}));

    this.getCyberArkUsers();
    this.get_OptionConfigJsonData({key:"CYBER_ARK_APPS",value:"appTypesList"});
    this.get_OptionConfigJsonData({key:"CYBER_ARK_ACCOUNT_TYPES",value:"CYBER_ARK_ACCOUNT_TYPES"});
    this.get_OptionConfigJsonData({key:"WINDOWS_APPLICATION_TYPES",value:"WINDOWS_APPLICATION_TYPES"});
    this.get_OptionConfigJsonData({key:"WINDOWS_ACCESS_ROLES",value:"WINDOWS_ACCESS_ROLES"});
    this.get_OptionConfigJsonData({key:"WINDOWS_ACCESS_TYPES",value:"WINDOWS_ACCESS_TYPES"});
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
	  var form = document.querySelector("#azureVmAccessSearch"),
				{approval_status, searchSubscription, searchResourceGroupName, searchRegion,
					searchOsType, searchAppType, searchRole, search_host_name, searchOsType,
					searchCyberArkUser} = this.state, is_error = false,
	   formData = serialize(form, { hash: true });
/*
   if (!approval_status) {
    is_error = true;
    toast.error('Please select Status');
   }

			if (!searchSubscription) {
				is_error = true;
    toast.error('Please select Subscription');
   }

			if (!searchResourceGroupName) {
    is_error = true;
    toast.error('Please select Resource Group');
   }

			if (!searchRegion) {
				is_error = true;
    toast.error('Please select Region');
   }
			
			if (!searchOsType) {
				is_error = true;
    toast.error('Please select OS Type');
   }

			if (!search_host_name) {
				is_error = true;
    toast.error('Virtual Machine is required!');
   }

			if (!searchCyberArkUser) {
				is_error = true;
    toast.error('Safe created for is required!');
   }

			if (searchOsType === 'Linux' && !searchAppType) {
				is_error = true;
    toast.error('Application Type is required!');
			}

			if (searchOsType === 'Windows' && !searchRole) {
				is_error = true;
    toast.error('Role is required!');
			}

			if (is_error) {
				return
			}
			
*/
			formData = {...formData, user_id : this.state.user_id, approval_status : this.state.approval_status, page_num: 1};
			console.log("search formData ---- ", formData);

			this.props.dispatch(azureActions.getUserVmAccessRequests(formData));
  }
  
  openVmModal(vmDetails) { 
	  console.log("vmDetails --- ", vmDetails);
	  let itemDetails = {...vmDetails, request_obj : JSON.parse(vmDetails.request_obj), response_obj : JSON.parse(vmDetails.response_obj)};
	  console.log("itemDetails --- ", itemDetails);
      this.setState({ vmModalIsOpen: true, vmDetails: itemDetails });
  }
  afterOpenVmModal() {       
  //this.subtitle.style.color = "#f00";
  }
  closeVmModal() {    
	  this.setState({ vmModalIsOpen: false });        
  }
  updateUserVmAccessRequestsStatus(item,status) {
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
				      title="Reason for reject!"
				      placeHolder="Reason for reject"
				      onConfirm={(response) => {
					    	  console.log("response --- ", response);
					    	  response = response.trim()
					    	  if(response != ''){
					    		  isConfirmed = true;
					    		  rejectResonse = response;
					    		  self.updateUserVmAccessRequestsStatusConfirm({item,status,rejectResonse});
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
	  }else{
		  self.updateUserVmAccessRequestsStatusConfirm({item,status,rejectResonse})
	  }
  }
  
  updateUserVmAccessRequestsStatusConfirm(regObj) {
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

	    fetch(`${config.apiUrl}/secureApi/azure/updateUserVmAccessRequestsStatus`, requestOptions).then(response  => {
	        response.text().then(text => {
	            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	            
	            $(".complete-page-loader").hide();
	            if (response.ok) {
	                var result=(data.value ? data.value : data)
	                console.log("updateUserVmAccessRequestsStatus result --- ",result);
	            	if(result.status == "success"){
	            		var form = document.querySelector("#azureVmAccessSearch");
	            	    var formData = serialize(form, { hash: true });
	            	    formData = {...formData, user_id : this.state.user_id, approval_status : this.state.approval_status, page_num: this.state.current_page};
	            	    console.log("search formData ---- ", formData);
	            		this.props.dispatch(azureActions.getUserVmAccessRequests(formData));
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
  
  processUserVmAccessRequest(regObj) {
	  console.log("regObj --- ", regObj);
	  let request_obj = JSON.parse(regObj.request_obj);
	  request_obj.body.user_vm_access_request_id = regObj.id;
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
	            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	            $(".complete-page-loader").hide();
	            if (response.ok) {
	                var result=(data.value ? data.value : data)
	                console.log("updateUserVmAccessRequestsStatus result --- ",result);
	            	if(result.status == "success"){
	            		toast.success(result.message);
	            	}else{
	            		toast.error(result.message);
	            	}
            		this.props.dispatch(azureActions.getUserVmAccessRequests({user_id : this.state.user_id, approval_status : this.state.approval_status}));
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
          <h5 className="color">User VM Access Requests</h5>
          <form
	          name="azureVmAccessSearch"
	          id="azureVmAccessSearch"
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
			              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Subscription</label>
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
	                  <span className="alert info-box-blue mr-2 cursor-pointer float-right" onClick={() => this.openVMAccess()}>New VM Access</span>
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
                    <th>Request Information</th>
                    <th>Approval details</th>
                  </tr>
                </thead>
                <tbody>
                  {userVmAccessRequests.items.length > 0 && userVmAccessRequests.items.map((itemData, index) =>
                    <tr key={index}>
                      {/**<td>{itemData.id}</td> */}
                      <td>
                          Type : {itemData.request_type}<br/>
                          {itemData.osType == 'Windows' && <span>VM Name : {itemData.host_name}<br/></span>}
                          {itemData.osType == 'Linux' && <span>Safe Name : {itemData.safeName}<br/></span>}
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
		                          <th>Request Raised Date</th>
		                          <th>Status</th>
			                      <th>Approved/Rejected By</th>
		                          <th>Approved/Rejected Date</th>
		                        </tr>
		                      </thead>
		                      <tbody>
	                          <tr>
	                          	<td>{itemData.requested_date} {this.state.user_details.data.TIME_ZONE}</td>
	                          	<td>{((itemData.log_approval_status == 0)?"Approval Pending":((itemData.log_approval_status == 1)?"Approved":"Rejected"))}
	                          		{(itemData.log_approval_status == 0  && 
											(this.state.is_manager[itemData.subscription+"@$"+itemData.resourceGroup] || this.state.isSuperAdmin == '1'))?
	                          			<span>
		                          			<br/>
			                          		<span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.updateUserVmAccessRequestsStatus(itemData,'1')}>Approve</span>
			                          		&nbsp;
			                          		<span className="alert info-box-danger mr-2 cursor-pointer" onClick={() => this.updateUserVmAccessRequestsStatus(itemData,'2')}>Reject</span>
		                          		</span>
		                          		:""
	                          		}
	                          	</td>
		                      	<td>{itemData.updated_email}</td>
	                          	<td>{itemData.updated_date} {itemData.updated_date && this.state.user_details.data.TIME_ZONE}</td>
	                          </tr>
	                        </tbody>
                        </table>
                        {(itemData.approval_status == 1  && 
								(this.state.is_manager[itemData.subscription+"@$"+itemData.resourceGroup] || this.state.isSuperAdmin == '1')
                        		) && 
                        	<div className="col-md-12">
                        		<br/>
		                        <div className="text-right">
		                        <span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.processUserVmAccessRequest(itemData)}>Proceed</span>
		                        </div>
		                    </div>
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
				              	{this.state.vmDetails &&
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
	                  name="azureVmAccess"
	                  id="azureVmAccess"
	                  method="post"
	                  onSubmit={this.azureVmAccessRequest}
	                  >
		              <div className="form-group">
			              <label htmlFor="cloud_type" className=''>Subscription <span className="star-mark">*</span></label>
		                  <select
		                      className="form-control"
		                      value={this.state.subscription}
		                    	name="subscription"
                                onChange={e => this.subscriptionChange(e.target.value,"")}
		                      >
		                      <option value="">--SELECT--</option>
		                      {subscription_list && subscription_list.length > 0 && subscription_list.map((sub, index) =>
	                              <option value={sub.subscription_id} key={sub.subscription_id}>
	                                  {sub.display_name}
	                              </option>
	                          )}
		                  </select>
			        </div>
			        <div className="form-group">
			            <label htmlFor="cloud_type" className=''>Resource Group <span className="star-mark">*</span></label>
			            <select
			                className="form-control"
			                value={this.state.resourceGroupName}
			              	name="resourceGroupName"
                            id="resourceGroupName"
                        	onChange={this.bindField}
			                >
			                <option value="">--SELECT--</option>
			                {this.state.resourceGroups && this.state.resourceGroups.length > 0 && this.state.resourceGroups.map((row, index) =>
	                            <option value={row.name} key={index}>
	                                {row.name}
	                            </option>
	                        )}
			            </select>
			            {this.state.isResourceGroupInprogress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
			        </div>
			        <div className="form-group">
			            <label htmlFor="cloud_type" className=''>OS Type <span className="star-mark">*</span></label>
			            <select
			                className="form-control"
			                value={this.state.osType}
			              	name="osType"
	                        id="osType"
                        	onChange={e => this.osTypeChange(e.target.value,"")}
			                >
			                <option value="Linux">Linux</option>
			                <option value="Windows">Windows</option>
			            </select>
			        </div>
			        {this.state.osType == 'Windows' && <div className="form-group">
			            <label htmlFor="cloud_type" className=''>Region <span className="star-mark">*</span></label>
			            <select
			                className="form-control"
			                value={this.state.region}
			              	name="region"
	                        id="region"
	                    	onChange={this.bindField}
			                >
			                <option value="">--SELECT--</option>
			                {this.state.Azure_Regions_Data && this.state.Azure_Regions_Data.length > 0 && this.state.Azure_Regions_Data.map((row, index) =>
	                            <option value={row.cyberarkKey+"@$"+row.location+"@$"+row["ansible-server"]+"@$"+row.domain+"@$"+row.windowsUserOnBoardingDomain} key={index}>
	                                {row.value}
	                            </option>
	                        )}
			            </select>
			        </div>}
			        {this.state.osType == 'Linux' && <div className="form-group">
			             <label htmlFor="cloud_type" className=''>Account Types <span className="star-mark">*</span></label>
		                 <select
		                      className="form-control"
		                      value={this.state.accountType}
		                      name="accountType" id="accountType" 
		                    	onChange={e => this.accountTypeChange(e.target.value,"")}
		                      >
		                      <option value="">--SELECT--</option>
		                      {this.state.CYBER_ARK_ACCOUNT_TYPES && this.state.CYBER_ARK_ACCOUNT_TYPES.length > 0 && this.state.CYBER_ARK_ACCOUNT_TYPES.map((row, index) =>
			                  	<React.Fragment key={index}>
			                  		{row.status && 
				                      <option value={row.value}>
				                          {row.name}
				                      </option>
			                  		}
		                    	</React.Fragment>
		                      )}
	                    </select>
				    </div>}
			        {this.state.osType == 'Linux' && this.state.accountType == 'onlyApps' && <div className="form-group">
			              <label htmlFor="cloud_type" className=''>Application Type <span className="star-mark">*</span></label>
		                  <select
		                      className="form-control"
		                      value={this.state.appType}
		                      name="appType" id="appType" 
//	                    	  onChange={this.bindField}
		                    	onChange={e => this.appTypeChange(e.target.value,"")}
		                      >
		                      <option value="">--SELECT--</option>
		                      {this.state.appTypesList && this.state.appTypesList.length > 0 && this.state.appTypesList.map((row, index) =>
	  		                  	<React.Fragment key={index}>
	  		                  		{row.status && ((this.state.accountType == 'onlyApps' && row.name != 'Plain') || this.state.accountType != 'onlyApps') && 
				                      <option value={row.name+"@$"+row.value}>
				                          {row.name}
				                      </option>
	  		                  		}
		                    	</React.Fragment>
		                      )}
	                      </select>
				      </div>}
				      {this.state.osType == 'Windows' && <div className="form-group">
			             <label htmlFor="cloud_type" className=''>Application Type <span className="star-mark">*</span></label>
		                 <select
		                      className="form-control"
		                      value={this.state.appType}
		                      name="appType" id="appType" 
	                    	  onChange={e => this.appTypeChange(e.target.value,"")}
		                      >
		                      <option value="">--SELECT--</option>
		                      {this.state.WINDOWS_APPLICATION_TYPES && this.state.WINDOWS_APPLICATION_TYPES.length > 0 && this.state.WINDOWS_APPLICATION_TYPES.map((row, index) =>
			                  	<React.Fragment key={index}>
			                  		{row.record_status && 
				                      <option value={row.value}>
				                          {row.name}
				                      </option>
			                  		}
		                    	</React.Fragment>
		                      )}
	                      </select>
	                   </div>}
				      {this.state.osType == 'Windows' && <div className="form-group">
			             <label htmlFor="cloud_type" className=''>Access Type <span className="star-mark">*</span></label>
		                 <select
		                      className="form-control"
		                      value={this.state.accessType}
		                      name="accessType" id="accessType" 
		                    	  onChange={this.bindField}
		                      >
		                      <option value="">--SELECT--</option>
		                      {this.state.WINDOWS_ACCESS_TYPES && this.state.WINDOWS_ACCESS_TYPES.length > 0 && this.state.WINDOWS_ACCESS_TYPES.map((row, index) =>
			                  	<React.Fragment key={index}>
			                  		{row.record_status && this.state.appType == row.appType && 
				                      <option value={row.value}>
				                          {row.name}
				                      </option>
			                  		}
		                    	</React.Fragment>
		                      )}
	                      </select>
	                   </div>}
				      {this.state.osType == 'Windows' && this.state.accessType == 'serviceAccount' && <div className="form-group">
			             <label htmlFor="cloud_type" className=''>Service Account Name <span className="star-mark">*</span></label>
			             <input
	                        type="text" 
	                        className="form-control"
	                        name="service_account_name"
	                        placeholder="Service Account Name"
	                        onChange={this.bindField}
	                        value={this.state.service_account_name}
	                        />
	                   </div>}
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
				      {this.state.osType == 'Windows' && this.state.appType == 'SQL' && this.state.accessType == 'userAccount' && <div className="form-group">
			             <label htmlFor="cloud_type" className=''>SQL Role <span className="star-mark">*</span></label>
		                 <select
		                      className="form-control"
		                      value={this.state.Sql_Role}
		                      name="Sql_Role" id="Sql_Role" 
		                    	  onChange={this.bindField}
		                      >
		                      <option value="">--SELECT--</option>
		                      {this.state.WINDOWS_ACCESS_ROLES && this.state.WINDOWS_ACCESS_ROLES.length > 0 && this.state.WINDOWS_ACCESS_ROLES.map((row, index) =>
			                  	<React.Fragment key={index}>
			                  		{row.record_status && this.state.appType == row.appType && row.accessType == this.state.appType+'_'+this.state.accessType && 
				                      <option value={row.value}>
				                          {row.name}
				                      </option>
			                  		}
		                    	</React.Fragment>
		                      )}
	                      </select>
	                   </div>}
				      {this.state.osType == 'Windows' && <div className="form-group">
			              <label htmlFor="cloud_type" className=''>Virtual Machines <span className="star-mark">*</span></label>
			              <span
		                    className="d-inline-block"
		                    data-toggle="popover"
		                    data-trigger="focus"
		                    data-content="Please seleet VM(s)" style={{width:'100%'}}
		                  >
				              <ReactSelect
		                      options={this.state.hostNamesMod}
				              isMulti={this.state.osType == 'Linux'?false:false}
		                      closeMenuOnSelect={this.state.osType == 'Linux'?true:true}
		                      hideSelectedOptions={false}
		                      components={{
		                    	  reactSelectComponentOption
		                      }}
		                      onChange={e => {this.reactSelectHandleChange(e,{'key':"hostNamesSelected", optionSelected : "hostNamesSelectedOptions"})}}
		                      allowSelectAll={true}
		                      value={this.state.hostNamesSelectedOptions}
		                    />
	                    </span>
				      </div>}
				      {this.state.osType == 'Linux' && <div className="form-group">
			              <label htmlFor="cloud_type" className=''>Provide Access To <span className="star-mark">*</span></label>
		                  <select
		                      className="form-control"
		                      value={this.state.cyberArkUser}
		                      name="cyberArkUser"
		                    	onChange={this.bindField}
		                      >
		                      <option value="">--SELECT--</option>
		                      {/*<option value="OTHER">OTHER</option>*/}
		                      {this.state.cyberArkUsersList && this.state.cyberArkUsersList.length > 0 && this.state.cyberArkUsersList.map((row, index) =>
	  		                  	<React.Fragment key={index}>
			                      <option value={row.user_id+"@$"+row.email}>
			                          {row.email}
			                      </option>
		                    	</React.Fragment>
		                      )}
	                      </select>
				      </div>}
				      {(this.state.osType == 'Windows' || (this.state.osType == 'Linux' && this.state.cyberArkUser == 'OTHER')) && <div className="form-group">
			              <label htmlFor="cloud_type" className=''>User Email <span className="star-mark">*</span></label><br/>
		                  <input type="email" className="form-control" value={this.state.cyberArkUserEmail} name="cyberArkUserEmail" onChange={this.bindField} />
	                  </div>}
				      {this.state.osType == 'Linux' && <div className="form-group">
			              <label htmlFor="cloud_type" className=''>Duration <span className="star-mark">*</span></label><br/>
		                  <input type="number" className="form-control-inline" value={this.state.durationDays} name="durationDays" min="0" step="1" max="364" onChange={this.bindField} /> Days
		                  <input type="number" className="form-control-inline" value={this.state.durationHours} name="durationHours" min="0" step="1" max="23" onChange={this.bindField} /> Hours
	                  </div>}
	                  <div className="form-group">
	                      <input type="hidden" name="clientid" value={this.state.clientid} />
	                      <button
	                      className={"btn btn-sm btn-primary " + ((this.state.VmAccessRequestInProgress || !this.state.isVmsExists) ? "no-access" : "")} disabled={(this.state.VmAccessRequestInProgress || !this.state.isVmsExists) ? true : false}
	                      >
	                      {this.state.VmAccessRequestInProgress && 
	                          <i className="fas fa-circle-notch icon-loading"></i>
	                      }
	                      Submit</button>
	                      <span className="btn info-box-danger cursor-pointer m-l-xs" onClick={() => this.resetVmAccessRequestForm()}>Reset</span>
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

const connectedPage = connect(mapStateToProps)(userVmAccessRequests);
export { connectedPage as userVmAccessRequests };