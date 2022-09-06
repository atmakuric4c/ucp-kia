import React from 'react';
import { commonFns } from "../../_helpers/common";
import { connect } from 'react-redux';
import { ordersActions } from './orders.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import { azureActions } from '../Azure/azure.actions';
import config from 'config';
import { authHeader,ucpEncrypt, ucpDecrypt, decryptResponse } from '../../_helpers';
import { toast } from 'react-toastify';
import { MDBDataTable } from 'mdbreact';
import PageLoader from '../PageLoader';
import { history } from '../../_helpers';
const env = require('../../../env');
import { default as ReactSelect } from "react-select";

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
class azureNewVMInstance extends React.Component {
  constructor(props) {
    super(props);

    commonFns.fnCheckPageAuth(commonFns.menuUrls.azureNewVMInstance);

    let user = decryptResponse( localStorage.getItem("user")),
    	assigned_resource_groups = user.data.resource_groups.map(resource => {
						return resource.subscription_id+"@$"+resource.name;
					});
    this.state = {
      user_details: user,
      assigned_resource_groups : assigned_resource_groups,
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      isSuperAdmin: user.data.isSuperAdmin,
      DISPLAY_ALL_NETWORK_RESOURCES : user.data.DISPLAY_ALL_NETWORK_RESOURCES,
      subscription_provision_type:"",
      sweetalert: null,
      action: null,
      loading: true,
      vm_size_popup: false,
      vm_disk_popup: false,
      generateIPPopup: false,
      createNewAvailabilitySetPopup: false,
      generateNICPopup: false,
      modalDiskPopupIsOpen: false,
      is_add_disk_inprogress: false,
      virtualNetworkInProgress: false,
      is_first_loading: true,
      selected_rg_location_name : "",
      selected_region_location_name : "",
      selected_network_location_name : "",
      backupType : "Yes",
      osTemplate: [],
      unAttachedDisksList: "",
      resourceGroups : [],
      backupResourceGroups : [],
      storageResourceGroups : [],
      completeResourceGroups : [],
      Azure_Regions_Data : [],
      domain_extension : "",
      environmentData : [],
      vmSize: [],
      virtualNetwork: [],
      subnets: [],
      publicIps: [],
      temp_vmSize: [],
      vm_size_name: "",
      vm_diskName : "",
      vm_cpus : "",
      vm_ram : "",
      vm_name: "",
      subscriptionId: "",
      selectedSubscriptionLabel: "",
      locationId: 0,
      resourceGroupValue: 0,
      resourceGroupName: '',
      networkResourceGroupName : '',
      zone: '',
      zoneList : [],
      acceleratedNetworkingEnabled : '',
      disksize: "",
      username: "",
      password: "",
      vm_price: 0,
      os_price: 0,
      disk_price: 0,
      os_template_id: 0,
      os_template_name: "",
      os_type : "",
      storageAccountType: "",
      locationName:'',
      selectedPublicIp: 0,
      selectedVirtualNetwork: 0,
      selectedSubnet: 0,
      subnet1_name : "",
      selectedNIC: 0,
      choosenIpName: "",
      isGenerateIpInprogress: false,
      choosenNICName: "",
      isGenerateNICInprogress: false,
      isCartAddingInprogress: false,
      isVmSizeValidatingInProgress: false,
      vmSize_backup_list: [],
      vmDisk_backup_list: [],
      disk_new_name: [],
      disk_new_size_GB: "",
      isVmSizeListLoading: false,
      isVmDiskListLoading: false,
      selected_subscription_id: "",
      selected_os_id: "",
//      Disk_Name_1: "",
//      Disk_Name_2: "",
      vmNameValidate: "",
      userNameValidate: "",
      activeStepper: 1,
      basicInfoStepper: 1,
      VMDetailsStepper: 2,
      NetworkInterfaceStepper: 3,
      ProtectVMStepper: 4,
      isCurrentPriceLoading: true,
      priceFor1GBDisk: 0,
      sharedimage_resource_group_name : "",
      isStorageAccountNameInprogress: false,
      storageAccountNames : [],
      storage_account_name : "",//((env.env== "dhluat" || env.env== "dhluatonprem" || env.env== "dhlonprem")?"stgitssapwediag001" : "devopsautomationstorage1"),
//      disksList: [{Disk_Name: "", Disk_Size: "", Disk_Host_Caching: "None"}],
//      disksListCount : 2,
      system_name : '',
      selected_system_type : '',
      isResourceGroupInprogress : false,
      isGalleryNameInprogress : false,
      galleryListData : [],
      osType : "ALL",
      osTypeData : ["ALL","Linux","Windows"],
      weblogicManagedServersData :[1,2,3,4],
      dbCharacterSetData : ['AL32UTF8', 'WE8ISO8859P15', 'WE8MSWIN1252'],
      weblogicMiddlewares : ["WebLogic", "WebLogic Server"],
      isOsMiddlewareInprogress : false,
      osMiddlewareData : [],
      isSharedImageNameInprogress : false,
      sharedImageNameData : [],
  	  shared_image_tags : {},
  	  shared_image_version_tags : {},
  	  recovery_vault_name_tags : [],
      isSharedImageVersionInprogress : false,
      sharedImageVersionData : [],
      backup_resource_group_name : "",
      recovery_vault_name : "",
      isRecoveryVaultNameInprogress : false,
      recoveryVaultNameData : [],
      backup_policy : "",
      isBackupPolicyInprogress : false,
      backupPolicyData : [],
      Netbackup_policy : "",
      db_full_backup : "", 
	  db_log_backup : "", 
	  db_backup : "",
	  db_backup2 : "",
      availability_set_name : "",
      isAvailabilitySetNameInprogress : false,
      availabilitySetNameData : [],
      vm_count_arr : [1,2,3,4,5,6,7,8,9,10],
      vm_count : 1,
      previous_vm_count : 0,
      vm_selection: "Quantity",
      availability_set_or_zone : "Zone",
      vmListInit : {
    	  zone: "1", 
    	  vm_name: "", 
    	  disksListCount : 2, 
    	  disksList: [{Disk_Name: "", Disk_Size: "", Disk_Host_Caching: "None", Disk_Storage_Type : "", Disk_Storage_Size: "",vmNameValidate: "",keyValue:""}],
//    	  disksList: [],
      },
      vmList : [{
    	  zone: "1", 
    	  vm_name: "", 
    	  disksListCount : 2, 
    	  disksList: [{Disk_Name: "", Disk_Size: "", Disk_Host_Caching: "None", Disk_Storage_Type : "", Disk_Storage_Size: "",disksListId:"disksList_1",vmNameValidate: "",keyValue:""}],
//    	  disksList: [],
      }],
      disksList_1: [{Disk_Name: "", Disk_Size: "", Disk_Host_Caching: "None", Disk_Storage_Type : "", Disk_Storage_Size: "",keyValue:""}],
      disksListInit: [{Disk_Name: "", Disk_Size: "", Disk_Host_Caching: "None", Disk_Storage_Type : "", Disk_Storage_Size: "",keyValue:""}],
      vmSizePremiumIO : "True",
      disksMountPointListInit: [{Mount_Point : "", Mount_Size :""}],
      maxDataDiskCount : 1,
      managed_infra_subscription_id : "",
      storageTypesList : [],
      storageSkusList : [],
      isStorageSkusInProgress: false,
      username : "dhladmin",
      password : "*******",
      confirmPassword : "*******",
      availableIpsCount : 0,
      validateAvailableIpsCount : false,
      cmdbBuData : [],
      cmdbCountries : [],
      cmdbCountriesMod : [],
      cmdbSelectedCountries : [],
      cmdbRegions : [],
      cmdbRegionsMod : [],
      cmdbSelectedRegions : [],
      cmdbImpacts : [],
      cmdbServices : [],
      cmdbBuUnit : "",
      cmdbCountry : "",
      cmdbImpact : "",
      cmdbRegion : "",
      cmdbService : "",
      diskMountPointsArr : [],
      mountPointJson: [],
      selected_ansible_server : '',
      regionWiseCountriesList: {},
      isAdditionalDiskRequired : false,
    };
    
    this.regionChange = this.regionChange.bind(this);
    this.storageResourceGroupNameChange = this.storageResourceGroupNameChange.bind(this);
    this.subscriptionChange = this.subscriptionChange.bind(this);
    this.resourceGroupNameChange = this.resourceGroupNameChange.bind(this);
    this.getAvailabilitySetNames = this.getAvailabilitySetNames.bind(this);
    this.getGalleryNames = this.getGalleryNames.bind(this);
    this.galleryNameChange = this.galleryNameChange.bind(this);
    this.sharedImageNameChange = this.sharedImageNameChange.bind(this);
    this.osTypeChange = this.osTypeChange.bind(this);
    this.sharedImageVersionChange = this.sharedImageVersionChange.bind(this);
    this.backupResourceGroupNameChange = this.backupResourceGroupNameChange.bind(this);
    this.recoveryVaultNameChange = this.recoveryVaultNameChange.bind(this);
    this.backupPolicyChange = this.backupPolicyChange.bind(this);
    
    if(window.location.href.indexOf("provision_type=") != -1){
    	let subscription_provision_type = window.location.href.split("provision_type=")[1];
    	subscription_provision_type = subscription_provision_type.split("&")[0];
    	this.state.subscription_provision_type = subscription_provision_type;
    }
    if(window.location.href.indexOf("subscription_id=") != -1){
    	let hrefurl = window.location.href;
        let selected_subscription_id = hrefurl.split("subscription_id=")[1];
        selected_subscription_id = selected_subscription_id.split("&")[0];
        this.state.selected_subscription_id = selected_subscription_id;
        
        if(hrefurl.indexOf("os_id=") != -1){
	        let selected_os_id = hrefurl.split("os_id=")[1];
	        selected_os_id = selected_os_id.split("&")[0];
	        this.state.selected_os_id = selected_os_id;
        }
        
        setTimeout(() => {
//        	var event = new Event('input', { bubbles: true });
//        	var node = document.getElementById('subscription_id');
//            node.dispatchEvent(event);
//            this.subscriptionChange(this.state.clientid+"_"+selected_subscription_id, hrefurl);
            
        	if(hrefurl.indexOf("galleryName=") != -1){
        		console.log("enter  galleryName cb ");
        		let galleryName = hrefurl.split("galleryName=")[1].split("&")[0];
        		this.galleryNameChange(galleryName,hrefurl);
        	}
            	
//            window.history.pushState('Customer Portal', 'Title', window.location.href.split('?')[0]);
          }, 3000);
      }
    
    this.bindField = this.bindField.bind(this);
    this.vmNameChange = this.vmNameChange.bind(this);
    this.userNameChange = this.userNameChange.bind(this);
    this.vm_size_popup = this.vm_size_popup.bind(this);
    this.vm_size_popupCloseModal = this.vm_size_popupCloseModal.bind(this);
    this.generateIPPopupClick = this.generateIPPopupClick.bind(this);
    this.generateIPPopupCloseModal = this.generateIPPopupCloseModal.bind(this);
    this.createNewAvailabilitySetPopupClick = this.createNewAvailabilitySetPopupClick.bind(this);
    this.createNewAvailabilitySetPopupCloseModal = this.createNewAvailabilitySetPopupCloseModal.bind(this);
    this.generateNICPopupClick = this.generateNICPopupClick.bind(this);
    this.generateNICPopupCloseModal = this.generateNICPopupCloseModal.bind(this);
		}
		
		onImpactedCountriesChange = (selected, opt, more) => {
			let is_delete = opt.action === 'remove-value',
					option = is_delete ? opt.removedValue : opt.option,
					state = this.state,
					{optionsCmdbSelectedCountries, countryRegionJson,
						regionsJson,
						optionsCmdbSelectedRegions	} = state,
					selectedRegion = countryRegionJson[option.value],
					is_present = false, keep_region = false,
					selectedValue = regionsJson[selectedRegion];

			if (!is_delete) {
				is_present = optionsCmdbSelectedRegions.filter(region => {
					return region.value === selectedValue.value
				})

				if (!is_present.length) {
					optionsCmdbSelectedRegions.push(selectedValue);
				}

				this.setState({
					optionsCmdbSelectedCountries: selected,
					optionsCmdbSelectedRegions
				})
			}
			else {
				optionsCmdbSelectedCountries = optionsCmdbSelectedCountries.filter(
					country => country.value != option.value
				)

				optionsCmdbSelectedCountries.map(country => {
					if (!keep_region && selectedRegion === country.u_region) {
						keep_region = true;
					}
					return country;
				});

				if (!keep_region) {
					optionsCmdbSelectedRegions = optionsCmdbSelectedRegions.filter(region => {
						return region.value != selectedValue.value
					});
				}
				this.setState({optionsCmdbSelectedCountries, optionsCmdbSelectedRegions})
			}
		}

		onImpactedRegionsChange = (selected, opt, more) => {
			let is_delete = opt.action === 'remove-value' || opt.action === "deselect-option",
					option = is_delete ? (opt.removedValue || opt.option) : opt.option,
					state = this.state,
					{optionsCmdbSelectedRegions, regionsJson, countryRegionJson,
						optionsCmdbSelectedCountries} = state,
						selectedCountries = countryRegionJson[regionsJson[(option || {}).value]];

			if (!is_delete) {
				this.setState({optionsCmdbSelectedRegions: selected});
				if (selectedCountries) {
					optionsCmdbSelectedCountries = optionsCmdbSelectedCountries.concat(selectedCountries)
				}
				this.setState({optionsCmdbSelectedCountries,
					optionsCmdbSelectedCountries
				})
			}
			else {
				optionsCmdbSelectedCountries = (optionsCmdbSelectedCountries || []).filter(country => {
					let selectedCountry = (selectedCountries || []).filter(countries => {
						return country.value === countries.value
					});

					return !selectedCountry.length
				})
				optionsCmdbSelectedRegions = optionsCmdbSelectedRegions.filter(
					region => region.value != option.value
				)
				this.setState({optionsCmdbSelectedRegions, optionsCmdbSelectedCountries})
			}
		}
		//{'key':"cmdbSelectedRegions", optionSelected : ""}
  
  reactSelectHandleChange = (selected, jObj) => {
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
	this.setState({
		[jObj.key] : selected_values
	});
	setTimeout(() => {

	}, 10);
  };
  
  addClick(vm,diskState){
	  if(this.state.vm_selection == 'Clustering'){
		  if(this.state["disksList_"+(vm+1)].length == 0){
		    	this.setState(prevState => ({ 
					["disksList_1"]: [...prevState["disksList_1"], { Disk_Name: this.state.vmList[0].vm_name+"-disk1", Disk_Size: "", Disk_Host_Caching: "None", Disk_Storage_Size: "", keyValue: 1}],
					["disksList_2"]: [...prevState["disksList_2"], { Disk_Name: this.state.vmList[1].vm_name+"-disk1", Disk_Size: "", Disk_Host_Caching: "None", Disk_Storage_Size: "", keyValue: 1}]
				}));
				
				let vmList = [...this.state.vmList];
				vmList[0] = {...vmList[0], disksListCount: 2};
				vmList[1] = {...vmList[1], disksListCount: 2};
			    this.setState({ vmList });
		  }else{
				this.setState(prevState => ({ 
					["disksList_1"]: [...prevState["disksList_1"], { Disk_Name: this.state.vmList[0].vm_name+"-disk"+this.state.vmList[0].disksListCount, Disk_Size: "", Disk_Host_Caching: "None", Disk_Storage_Size: "", keyValue: ""+this.state.vmList[0].disksListCount}],
					["disksList_2"]: [...prevState["disksList_2"], { Disk_Name: this.state.vmList[1].vm_name+"-disk"+this.state.vmList[1].disksListCount, Disk_Size: "", Disk_Host_Caching: "None", Disk_Storage_Size: "", keyValue: ""+this.state.vmList[1].disksListCount}]
				}));
				
				let vmList = [...this.state.vmList];
				vmList[0] = {...vmList[0], disksListCount: (this.state.vmList[0].disksListCount+1)};
				vmList[1] = {...vmList[1], disksListCount: (this.state.vmList[1].disksListCount+1)};
			    this.setState({ vmList });
		  }
	  }else{
		  if(this.state["disksList_"+(vm+1)].length == 0){
		    	this.setState(prevState => ({ 
					["disksList_"+(vm+1)]: [...prevState[diskState], { Disk_Name: this.state.vmList[vm].vm_name+"-disk1", Disk_Size: "", Disk_Host_Caching: "None", Disk_Storage_Size: "", keyValue: 1}]
				}));
				
				let vmList = [...this.state.vmList];
				vmList[vm] = {...vmList[vm], disksListCount: 2};
			    this.setState({ vmList });
		  }else{
				this.setState(prevState => ({ 
					["disksList_"+(vm+1)]: [...prevState[diskState], { Disk_Name: this.state.vmList[vm].vm_name+"-disk"+this.state.vmList[vm].disksListCount, Disk_Size: "", Disk_Host_Caching: "None", Disk_Storage_Size: "", keyValue: ""+this.state.vmList[vm].disksListCount}]
				}));
				
				let vmList = [...this.state.vmList];
				vmList[vm] = {...vmList[vm], disksListCount: (this.state.vmList[vm].disksListCount+1)};
			    this.setState({ vmList });
		  }
	  }
  }
  addMountPoints(vm,diskState){
	  let diskMountPointsArr = [...this.state.diskMountPointsArr];
	  diskMountPointsArr.push(diskState);
	  this.setState({[diskState] : this.state.disksMountPointListInit, diskMountPointsArr : diskMountPointsArr});
	  setTimeout(() => {

	  }, 500);
  }
  removeMountPoints(vm,diskState){
	  let diskMountPointsArr = [...this.state.diskMountPointsArr];
	  const index = diskMountPointsArr.indexOf(diskState);
	  if (index > -1) {
		  diskMountPointsArr.splice(index, 1);
	  }
	  
	  this.setState({[diskState] : [], diskMountPointsArr : diskMountPointsArr});
	  setTimeout(() => {
	  }, 500);
  }
  
  addMountClick(item, e){	 
	 this.setState(prevState => ({ 
			[item.Disk_Name]: [...prevState[item.Disk_Name], { Mount_Point : "", Mount_Size :"" }]
	 }));
	 setTimeout(() => {
		 console.log("item.Disk_Name -- ", this.state[item.Disk_Name]);
     }, 500);
  }
  
  createVmUI(){
	  let self = this;
//	  console.log("vmSizePremiumIO --- ", this.state.vmSizePremiumIO);
	  return this.state.vmList.map((vmRow, index) =>
	      <React.Fragment key={index}>
	      VM {(index+1)}
	      <div style={{border: "1px solid #000", padding : "5px"}}>
	      <div className="row">
		      <div className="col-lg-6">
		          <div className="form-group row">
		              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>VM Name<span className="star-mark">*</span></label>
		              <div className="col-sm-9">
		                  <input type="text" maxLength="15" readOnly placeholder="Ex: AzureNewVM" autoComplete="off" name="vm_name" className="form-control-vm"  onBlur={() => this.vmNameBlur(index)} 
		                  onChange={this.vmNameChange.bind(this, index)}
		                  value={vmRow.vm_name} />
		                  {
		                	  vmRow.vmNameValidate == "checking" &&
		                      <i className="fas fa-circle-notch icon-loading txt-loader-icon"></i>
		                  }
		                  {
		                	  vmRow.vmNameValidate == "fail" && 
		                      <i title={vmRow.vmValidationName} className="fa fa-exclamation-triangle txt-error-icon txt-loader-icon"></i>
		                  }
		                  {
		                	  vmRow.vmNameValidate == "success" && 
		                      <i title="VM name validated" className="fa fa-check-circle txt-loader-icon txt-succses-icon"></i>
		                  }
		              </div>
		          </div>
		      </div>
		      {this.state.availability_set_or_zone == "Zone" && 
		    	  <div className="col-lg-6">
			          <div className="form-group row">
			              <label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>VM Zone<span className="star-mark">*</span></label>                
			              <div className="col-sm-9">
			                  <select
			                      className="form-control"
			                      name="zone"
			                  	value={vmRow.zone}
			                  	onChange={this.handleZoneChange.bind(this, index)}
			                      >
		                      	  <option value="">--SELECT--</option>
			                      {this.state.zoneList && this.state.zoneList.length > 0 && this.state.zoneList.map((row, index) =>
			                          <option value={row.key} key={index}>
			                              {row.value}
			                          </option>
			                      )}
			                  </select>
			              </div>
			          </div>
			      </div>
		      }
		      <div className="col-lg-6">
		          <div className="form-group row">
		              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>VM NIC<span className="star-mark">*</span></label>
		              <div className="col-sm-9">
		                  <input type="text" maxLength="15" readOnly placeholder="NIC" name="selectedNIC" className="form-control-vm" 
		                  value={vmRow.selectedNIC} />
		              </div>
		          </div>
		      </div>
		      {this.state.vm_selection == 'Clustering' &&
		    	  <div className="col-lg-6">
			          <div className="form-group row">
			              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>VM NIC 2<span className="star-mark">*</span></label>
			              <div className="col-sm-9">
			                  <input type="text" maxLength="15" readOnly placeholder="NIC" name="selectedNIC2" className="form-control-vm" 
			                  value={vmRow.selectedNIC2} />
			              </div>
			          </div>
			      </div>
		      }
	      </div>
	      <hr/>
	      {this.state.weblogicMiddlewares.indexOf(this.state.shared_image_tags["UCP-MW"]) >= 0 && 
	    	  <React.Fragment>
		    	  <div className="row">
				      <div className="col-lg-6">
				          <div className="form-group row">
				              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Weblogic Service Name<span className="star-mark">*</span></label>
				              <div className="col-sm-9">
				                  <input type="text" maxLength="15" placeholder="Service Name" name="weblogicServiceName" className="form-control" 
				                  onChange={this.handleVmDataChange.bind(this, index)}
				                  value={vmRow.weblogicServiceName} />
				                  <input type="hidden" maxLength="15" readOnly placeholder="Username" name="weblogicUsername" className="form-control-vm" 
					                  value={vmRow.weblogicUsername} />
				                  <input type="hidden" maxLength="32" autoComplete="off" 
					                  onChange={this.handleVmDataChange.bind(this, index)}
					                  placeholder="Password" name="weblogicPassword" className="form-control" 
					                  value={vmRow.weblogicPassword} />
				              </div>
				          </div>
				      </div>
			    	  {/*<div className="col-lg-6">
				          <div className="form-group row">
				              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Weblogic Managed Servers {index+1}<span className="star-mark">*</span></label>                
				              <div className="col-sm-9">
				                  <select
				                      className="form-control"
				                      name="weblogicManagedServers"
				                  	value={vmRow.weblogicManagedServers}
				                  	onChange={this.handleVmDataChange.bind(this, index)}
				                      >
				                      {this.state.weblogicManagedServersData && this.state.weblogicManagedServersData.length > 0 && this.state.weblogicManagedServersData.map((row, index) =>
				                          <option value={row} key={index}>
				                              {row}
				                          </option>
				                      )}
				                  </select>
			                  </div>
				          </div>
				      </div>*/}
				      {/*<div className="col-lg-6">
				          <div className="form-group row">
				              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Weblogic Username<span className="star-mark">*</span></label>
				              <div className="col-sm-9">
				                  <input type="text" maxLength="15" readOnly placeholder="Username" name="weblogicUsername" className="form-control-vm" 
				                  value={vmRow.weblogicUsername} />
				              </div>
				          </div>
				      </div>
				      <div className="col-lg-6">
				          <div className="form-group row">
				              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Weblogic Password<span className="star-mark">*</span></label>
				              <div className="col-sm-9">
				                  <input type="password" maxLength="32" autoComplete="off" 
					                  onChange={this.handleVmDataChange.bind(this, index)}
					                  placeholder="Password" name="weblogicPassword" className="form-control" 
					                  value={vmRow.weblogicPassword} />
				              </div>
				          </div>
				      </div>*/}
			      </div>
			      <hr/>
		      </React.Fragment>
	      }
	      {(this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] == 'Informix') && 
	    	  <React.Fragment>
		    	  <div className="row">
				      <div className="col-lg-6">
				          <div className="form-group row">
				              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>DB Name<span className="star-mark">*</span></label>
				              <div className="col-sm-9">
				                  <input type="text" maxLength="8" placeholder="DB Name" name="dbName" className="form-control" 
				                  onChange={this.handleVmDataChange.bind(this, index)}
				                  value={vmRow.dbName} />
				              </div>
				          </div>
				      </div>
			    	  <div className="col-lg-6">
				          <div className="form-group row">
				              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Log<span className="star-mark">*</span></label>                
				              <div className="col-sm-9">
				                  <select
				                      className="form-control"
				                      name="informixLog"
				                  	value={vmRow.informixLog}
				                  	onChange={this.handleVmDataChange.bind(this, index)}
				                      >
				                  		<option value="buffered">Buffered</option>
				                  		<option value="unbuffered">Un-Buffered</option>
				                  </select>
				              </div>
				          </div>
				      </div>
			      </div>
			      <hr/>
		      </React.Fragment>
	      }
	      {(this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] == 'Oracle') && 
	    	  <React.Fragment>
		    	  <div className="row">
				      <div className="col-lg-6">
				          <div className="form-group row">
				              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>DB Name<span className="star-mark">*</span></label>
				              <div className="col-sm-9">
				                  <input type="text" maxLength="8" placeholder="DB Name" name="dbName" className="form-control" 
				                  onChange={this.handleVmDataChange.bind(this, index)}
				                  value={vmRow.dbName} />
				              </div>
				          </div>
				      </div>
				      <div className="col-lg-6">
				          <div className="form-group row">
				              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>DB Username<span className="star-mark">*</span></label>
				              <div className="col-sm-9">
				                  <input type="text" maxLength="10" autoComplete="off" 
					                  onChange={this.handleVmDataChange.bind(this, index)} placeholder="Username" name="dbUsername" className="form-control" 
				                  value={vmRow.dbUsername} />
				              </div>
				          </div>
				      </div>
				      <div className="col-lg-6">
				          <div className="form-group row">
				              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>DB Password<span className="star-mark">*</span></label>
				              <div className="col-sm-9">
				                  <input type="text" maxLength="32" autoComplete="off" 
					                  onChange={this.handleVmDataChange.bind(this, index)} readOnly={vmRow.dbPasswordReadonly} onFocus={this.handleVmDataFocus.bind(this, index)}
					                  placeholder="Password" name="dbPassword" className="form-control" 
					                  value={vmRow.dbPassword} />
				              </div>
				          </div>
				      </div>
			    	  <div className="col-lg-6">
				          <div className="form-group row">
				              <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>DB Character Set {index+1}<span className="star-mark">*</span></label>                
				              <div className="col-sm-9">
				                  <select
				                      className="form-control"
				                      name="dbCharacterSet"
				                  	value={vmRow.dbCharacterSet}
				                  	onChange={this.handleVmDataChange.bind(this, index)}
				                      >
				                  		<option value="">--SELECT--</option>
				                      {this.state.dbCharacterSetData && this.state.dbCharacterSetData.length > 0 && this.state.dbCharacterSetData.map((row, index) =>
				                          <option value={row} key={index}>
				                              {row}
				                          </option>
				                      )}
				                  </select>
				              </div>
				          </div>
				      </div>
			      </div>
			      <hr/>
		      </React.Fragment>
	      }
	      {(this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] == 'MSSQL') && 
	    	  <React.Fragment>
		    	  <div className="row">
				      <div className="col-lg-6">
				          <div className="form-group row">
				              <label htmlFor="cloud_type" className='col-sm-3 col-form-label'>DB Name<span className="star-mark">*</span></label>
				              <div className="col-sm-9">
				                  <input type="text" maxLength="12" placeholder="DB Name" name="msDbName" className="form-control" 
				                  onChange={this.handleVmDataChange.bind(this, index)}
				                  value={vmRow.msDbName} />
				              </div>
				          </div>
				      </div>
	    	          <div className="col-lg-6">
	    	              <div className="form-group row">
	    	                  <label htmlFor="cloud_type" className='col-sm-3 col-form-label'>Data File Size<span className="star-mark">*</span></label>
	    	                  <div className="col-sm-9 overflow-wrap">
	    	                      <input
	    	                          type="number" placeholder="Data File Size"
	    	                          className="form-control position-relative"
	    	                          name="Data_File_Size" min="64" max="2048"
    	                        	  onChange={this.handleVmDataChange.bind(this, index)}
					                  value={vmRow.Data_File_Size} /><span className="disk_size_gb" style={{top: "1px"}}>GB</span>
		                      </div>
	    	              </div>
	    	          </div>
			      </div>
			      <div className="row">
				      <div className="col-lg-6">
				          <div className="form-group row">
				              <label htmlFor="cloud_type" className='col-sm-3 col-form-label'>Log File Size<span className="star-mark">*</span></label>
				              <div className="col-sm-9 overflow-wrap">
				                  <input type="number" placeholder="Log File Size" min="64" max="2048"
				                	  name="Log_File_Size" className="form-control position-relative" 
					                  onChange={this.handleVmDataChange.bind(this, index)}
					                  value={vmRow.Log_File_Size} /><span className="disk_size_gb" style={{top: "1px"}}>GB</span>
				              </div>
				          </div>
				      </div>
	    	          <div className="col-lg-6">
	    	              <div className="form-group row">
	    	                  <label htmlFor="cloud_type" className='col-sm-3 col-form-label'>Temp DB Size<span className="star-mark">*</span></label>
	    	                  <div className="col-sm-9 overflow-wrap">
	    	                      <input
	    	                          type="number" placeholder="Temp DB Size" min="64" max="2048"
	    	                          className="form-control position-relative"
	    	                          name="Temp_DB_Size" 
		                        	  onChange={this.handleVmDataChange.bind(this, index)}
					                  value={vmRow.Temp_DB_Size} /><span className="disk_size_gb" style={{top: "1px"}}>GB</span>
		                      </div>
	    	              </div>
	    	          </div>
			      </div>
			      <hr/>
		      </React.Fragment>
	      }
	      {!this.state.isAdditionalDiskRequired && (!this.state["disksList_"+(index+1)] || this.state["disksList_"+(index+1)].length == 0) &&
	    	  <span className="btn btn-primary m-t-xs m-r-xs cursor-pointer" onClick={this.addClick.bind(this,index,"disksList_"+(index+1))}>Add Disks</span>
	      }
	      {this.state["disksList_"+(index+1)] && this.state["disksList_"+(index+1)].length > 0 && this.state["disksList_"+(index+1)].map((el, i) => (
    		  <React.Fragment key={i}>
    		  <div className="row">
    	          <div className="col-lg-2">
    	              <div className="form-group">
    	                  <label htmlFor="cloud_type" className=''>Disk Name {i+1}<span className="star-mark">*</span></label>
	                      <input type="text" readOnly className="form-control-vm" name="Disk_Name"
	                        	  value={el.Disk_Name} onChange={this.handleChange.bind(this, i, index)}  />
    	              </div>
    	          </div>
    	          <div className="col-lg-2">
			          <div className="form-group">
			              <label htmlFor="cloud_type" className=''>Disk Storage Type {i+1}<span className="star-mark">*</span></label>
		                  <select
		                      className="form-control"
		                      value={el.Disk_Storage_Type}
		                      name="Disk_Storage_Type"
                        	  id={"Disk_Storage_Type_"+el.keyValue}
	                    	  onChange={this.handleChange.bind(this, i, index)}
		                      >
		                      <option value="">--SELECT--</option>
		                      {this.state.storageTypesList && this.state.storageTypesList.length > 0 && this.state.storageTypesList.map((row, index) =>
		                    	  <React.Fragment key={index}>
			                    	  {(self.state.vmSizePremiumIO == 'True' || (self.state.vmSizePremiumIO != 'True' && row != 'Premium_LRS')) && 
					                      <option value={row}>
					                          {row}
					                      </option>
			                    	  }
			                      </React.Fragment>
		                      )}
	                      </select>
	                      {this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] == 'Oracle' && <span><span className="star-mark">*</span>Recommendation for DB StandardSSD_LRS/Premium_LRS</span>}
			          </div>
			      </div>
    	          <div className="col-lg-2">
			          <div className="form-group">
			              <label htmlFor="cloud_type" className=''>Disk Storage SKU {i+1}<span className="star-mark">*</span></label>
		                  <select
		                      className="form-control"
		                      value={el.Disk_Storage_Size}
		                      name="Disk_Storage_Size"
                        	  id={"Disk_Storage_Size_"+index+"_"+i}
	                    	  onChange={this.handleChange.bind(this, i, index)}
		                      >
		                      <option value="">--SELECT--</option>
		                      {this.state.storageSkusList && this.state.storageSkusList.length > 0 && this.state.storageSkusList.map((row, index) =>
		                      	<React.Fragment key={index}>
		                      	  {el.Disk_Storage_Type == row.name && 
		                      		  ((this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] == 'Oracle' && parseInt(row.MaxSizeGiB) >= 200 ) 
		                      				  || (this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] != 'Oracle')) &&
			                    	  <option value={row.size+"_"+row.MinSizeGiB+"_"+row.MaxSizeGiB}>
			                          	{row.size+" - "+row.MaxSizeGiB+" GB"}
			                          </option>
			                      }
		                      	</React.Fragment>
		                      )}
	                      </select>
			          </div>
			      </div>
    	          <div className="col-lg-1 p-l-0">
    	              <div className="form-group">
    	                  <label htmlFor="cloud_type" className=''>Disk Size {i+1}<span className="star-mark">*</span></label>
    	                  <div className="overflow-wrap">
    	                      <input
    	                          type="text"
    	                          className="form-control-vm position-relative"
    	                          name="Disk_Size" readOnly
	                        	  id={"Disk_Size_"+index+"_"+i}
		                      	  value={el.Disk_Size}
    	                        onChange={this.handleChange.bind(this, i, index)} /><span className="disk_size_gb" style={{top: "28px"}}>GB</span>
	                      </div>
	                      {false && el.Disk_Storage_Size != '' && 
	                    	  <span><span className="star-mark">Allowed</span> : {el.MinSizeGiB+" - "+el.MaxSizeGiB} <strong>GB</strong></span>
	                      }
    	              </div>
    	          </div>
    	          <div className="col-lg-2">
			          <div className="form-group">
			              <label htmlFor="cloud_type" className=''>Disk Host Caching {i+1}<span className="star-mark">*</span></label>
		                  <select
		                      className="form-control"
		                      value={el.Disk_Host_Caching}
		                      name="Disk_Host_Caching"
	                    	  onChange={this.handleChange.bind(this, i, index)}
		                      >
		                      <option value="">--SELECT--</option>
		                      {this.props.azure.dropdownData && this.props.azure.dropdownData.Azure_Disk_Host_Caching 
		                    	  && this.props.azure.dropdownData.Azure_Disk_Host_Caching.length > 0 && this.props.azure.dropdownData.Azure_Disk_Host_Caching.map((row, index) =>
		                    	  <React.Fragment key={index}>
			                    	  {((parseInt(el.Disk_Size) >= 4092 && row.key == 'None') || parseInt(el.Disk_Size) < 4092) && 
				                    	  <option value={row.key} key={index}>
					                          {row.value}
					                      </option>
			                    	  }
			                      </React.Fragment>
		                      )}
	                      </select>
			          </div>
			      </div>
    	          <div className="col-lg-3">
	                  {(this.state["disksList_"+(index+1)].length > 1 || !this.state.isAdditionalDiskRequired) && 
	                	  	<span className="btn btn-primary m-t-xs m-r-xs cursor-pointer" onClick={this.removeClick.bind(this, i, index)}>-</span>
	                  }
	                  {(this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] != 'Oracle')
	                	  && (this.state.shared_image_tags && this.state.shared_image_tags["UCP-MW"] && this.state.weblogicMiddlewares.indexOf(this.state.shared_image_tags["UCP-MW"]) < 0)
	                	  && (this.state["disksList_"+(index+1)].length-1) == i && (i+1) < this.state.maxDataDiskCount && 
	                	  	<span className="btn btn-primary m-t-xs m-r-xs cursor-pointer" onClick={this.addClick.bind(this,index,"disksList_"+(index+1))}>+</span>
	                  }
	                  {false && (this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] != 'Oracle')
	                	  && (this.state.shared_image_tags && this.state.shared_image_tags["UCP-MW"] && this.state.weblogicMiddlewares.indexOf(this.state.shared_image_tags["UCP-MW"]) < 0) 
	                	  && this.state.os_type == 'Linux' && el.Disk_Size && (!this.state[el.Disk_Name]
	                  		|| this.state[el.Disk_Name] && this.state[el.Disk_Name].length == 0) && 
	                	  	<span className="btn btn-primary m-t-xs cursor-pointer" onClick={this.addMountPoints.bind(this,index,el.Disk_Name)}>Add Mount Points</span>
	                  }
	                  {this.state.os_type == 'Linux' && el.Disk_Size && this.state[el.Disk_Name] && this.state[el.Disk_Name].length > 0 && 
	                	  	<span className="btn btn-primary m-t-xs cursor-pointer" onClick={this.removeMountPoints.bind(this,index,el.Disk_Name)}>Remove Mount Points</span>
	                  }
	                  {el.MaxSizeGiB && (this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] == 'Oracle') && 
	                	  <span><span className="star-mark">*</span>Effective DB size available post OS and DB system requirements : <strong>{Math.floor((parseInt(el.MaxSizeGiB) - 149 - 40)*70/100)} GB</strong></span>
	                  }
	                  {el.MaxSizeGiB && (this.state.shared_image_tags && this.state.shared_image_tags["UCP-MW"] && this.state.weblogicMiddlewares.indexOf(this.state.shared_image_tags["UCP-MW"]) >= 0) && 
	                	  <span><span className="star-mark">*</span>Effective weblogic domain size available post Domain creation and mountpoint Threshold requirements : <strong>{Math.floor((parseInt(el.MaxSizeGiB) - 8)*80/100)} GB</strong></span>
	                  }
		          </div>
    	      </div>
    	      {this.state.os_type == 'Linux' 
    	    	  && el.Disk_Size 
    	    	  && this.state[el.Disk_Name] 
    	      	  && this.state[el.Disk_Name].length > 0 
    	      	  && <div className="row">
	    	      	  <div className="col-lg-2"></div>
	    	      	  <div className="col-lg-8" style={{border: "1px solid #000", padding : "5px"}}>
		    	      	  {"Disk "+(i+1)+" Mount Points (Buffer Size : "+self.props.azure.dropdownData.Azure_Disk_Mount_Buffer_Size+" GB)"}
			    	      {this.state[el.Disk_Name].map((el1, i1) => (
				    		  <React.Fragment key={i1}>
				    		  <div className="row">
				    	          <div className="col-lg-4">
				    	              <div className="form-group">
				    	                  <label htmlFor="cloud_type" className=''>Mount Point {i1+1}<span className="star-mark">*</span></label>
					                      <input type="text" className="form-control" name="Mount_Point" placeholder="Ex : /data/abc"
					                        	  value={el1.Mount_Point} onChange={this.handleMountChange.bind(this, {Disk_Name : el.Disk_Name, disk:i, vm:index, mountPoint : i1})}  />
				    	              </div>
				    	          </div>
				    	          <div className="col-lg-4">
				    	              <div className="form-group">
				    	                  <label htmlFor="cloud_type" className=''>Mount Point Label {i1+1}<span className="star-mark">*</span></label>
					                      <input type="text" className="form-control-vm" readOnly name="Mount_Point_Label" 
					                        	  value={el1.Mount_Point_Label}  />
				    	              </div>
				    	          </div>
				    	          <div className="col-lg-2">
				    	              <div className="form-group">
				    	                  <label htmlFor="cloud_type" className=''>Size {i1+1}<span className="star-mark">*</span></label>
				    	                  <div className="overflow-wrap">
				    	                      <input
				    	                          type="number"
				    	                          className="form-control position-relative"
				    	                          name="Mount_Size" min="0" maxLength="5"
					                        	  id={"Mount_Size_"+index+"_"+i+"_"+i1}
						                      	  value={el1.Mount_Size} onKeyDown={ (evt) => (evt.key === 'e' || evt.key === '+' || evt.key === '-') && evt.preventDefault() }
				    	                        onChange={this.handleMountChange.bind(this, {Disk_Name : el.Disk_Name, disk:i, vm:index, mountPoint : i1})} /><span className="disk_size_gb" style={{top: "28px"}}>GB</span>
					                      </div>
				    	              </div>
				    	          </div>
				    	          <div className="col-lg-2">
					                  {this.state[el.Disk_Name].length > 1 && 
					                	  	<span className="btn btn-primary m-t-xs m-r-xs cursor-pointer" onClick={this.removeMountClick.bind(this, {Disk_Name : el.Disk_Name, disk:i, vm:index, mountPoint : i1})}>-</span>
					                  }
					                  {(this.state[el.Disk_Name].length-1) == i1  && 
					                	  	<span className="btn btn-primary m-t-xs m-r-xs cursor-pointer" onClick={this.addMountClick.bind(this,{Disk_Name : el.Disk_Name, disk:i, vm:index, mountPoint : i1})}>+</span>
					                  }
						          </div>
				    	      </div>
			    	      </React.Fragment>
			    	     ))}
	    	      	</div>
    	      	</div>}
    	      </React.Fragment>
    	     ))}
	      </div>
	  </React.Fragment>
	)
  }
  
  handleMountChange(item, e) {
     const { name, value } = e.target;
     let mountList = [...this.state[item.Disk_Name]];
     
     if(name == 'Mount_Point'){ 
    	 mountList[item.mountPoint] = {...mountList[item.mountPoint], [name]: value, Mount_Point_Label: value.replace(/[^0-9A-Z]+/gi,"")};
	 }else if(name == 'Mount_Size'){
		 let updateValue = value.replace(/[^0-9]/g, "");
		 if(updateValue.length > 5){
			 if(mountList[item.mountPoint].Mount_Size == ''){
				 mountList[item.mountPoint] = {...mountList[item.mountPoint], [name]: updateValue.substr(0,5)};
			 }else{
				 return false;
			 }
		 }else{
			 mountList[item.mountPoint] = {...mountList[item.mountPoint], [name]: updateValue};
		 }
	 }else{
		 mountList[item.mountPoint] = {...mountList[item.mountPoint], [name]: value};
	 }
     
     this.setState({ [item.Disk_Name] : mountList });
  }
  
  removeMountClick(item, e){
     let mountList = [...this.state[item.Disk_Name]];
     mountList.splice(item.mountPoint, 1);
     this.setState({ [item.Disk_Name] : mountList });
  }
  
  handleVmDataChange(vm, e) {
     const { name, value } = e.target;
     let vmList = [...this.state.vmList];
     if(name == 'dbName'){
    	 vmList[vm] = {...vmList[vm], [name]: ((value)?value.toUpperCase():"")};
     }else{
    	 vmList[vm] = {...vmList[vm], [name]: value};    	 
     }
	 this.setState({ vmList });
  }
  
  handleVmDataFocus(vm, e) {
     const { name, value } = e.target;
     let vmList = [...this.state.vmList];
	 vmList[vm] = {...vmList[vm], [name+"Readonly"]: false};
	 this.setState({ vmList });
  }
  
  handleChange(i, vm, e) {
     const { name, value } = e.target;
     let disksList = [...this.state["disksList_"+(vm+1)]];
     
     if(name == 'Disk_Storage_Type'){ 
    	 disksList[i] = {...disksList[i], [name]: value, Disk_Storage_Size : "", Disk_Size : ""};
    	 $("#Disk_Size_"+vm+"_"+i).val("");
    	 $("#Disk_Storage_Size_"+vm+"_"+i).val("");
    	 
    	 this.setState({ ["disksList_"+(vm+1)+"_Disk_"+(i+1)] : [] });
    	 
	 }else if(name == 'Disk_Storage_Size'){ 
    	 let MinSizeGiB = "", MaxSizeGiB = "";
    	 MinSizeGiB = value.split('_')[1];
    	 MaxSizeGiB = value.split('_')[2];
    	 disksList[i] = {...disksList[i], [name]: value, MinSizeGiB, MaxSizeGiB, Disk_Size : MaxSizeGiB, Disk_Host_Caching : "None"};
    	 $("#Disk_Size_"+vm+"_"+i).val(MaxSizeGiB);
	 }else{
		 disksList[i] = {...disksList[i], [name]: value};
	 }
     
     this.setState({ ["disksList_"+(vm+1)] : disksList });
  }
  
  removeClick(i,vm){
//	  let disksList = [...this.state["disksList_"+(vm+1)]];
//	  disksList[i] = {...disksList[i], Disk_Storage_Type: "", Disk_Storage_Size : "", Disk_Size : ""};
// 	 $("#Disk_Size_"+vm+"_"+i).val("");
// 	 $("#Disk_Storage_Size_"+vm+"_"+i).val("");
// 	 this.setState({ ["disksList_"+(vm+1)+"_Disk_"+(i+1)] : [] });
 	 
// 	setTimeout(() => {
	  if(this.state.vm_selection == 'Clustering'){
	  	let disksList1 = [...this.state["disksList_1"]];
	  	let nextDiskData1 = [];
	  	if(disksList1[(i+1)]){
		  for (let j = (i+1); j< disksList1.length; j++){
			  let next_Disk_Storage_Type = $("#Disk_Storage_Type_"+disksList1[j].keyValue).val();
			  let next_Disk_keyValue = disksList1[j].keyValue;
			  nextDiskData1.push({next_Disk_Storage_Type,next_Disk_keyValue});
		  }
	  	}
 	    disksList1.splice(i, 1);
 	    this.setState({ ["disksList_1"] : disksList1 });
 	    setTimeout(() => {
 	    	if(nextDiskData1.length > 0){
	 	    	for (let j = 0; j< nextDiskData1.length; j++){
		 	    	if(nextDiskData1[j].next_Disk_Storage_Type == ''){
		 	    		$("#Disk_Storage_Type_"+nextDiskData1[j].next_Disk_keyValue).val("");
		 	    	}
	 	    	}
 	    	}
 	    }, 100);

	  	let disksList2 = [...this.state["disksList_2"]];
	  	let nextDiskData2 = [];
	  	if(disksList2[(i+1)]){
		  for (let j = (i+1); j< disksList2.length; j++){
			  let next_Disk_Storage_Type = $("#Disk_Storage_Type_"+disksList2[j].keyValue).val();
			  let next_Disk_keyValue = disksList2[j].keyValue;
			  nextDiskData2.push({next_Disk_Storage_Type,next_Disk_keyValue});
		  }
	  	}
 	    disksList2.splice(i, 1);
 	    this.setState({ ["disksList_2"] : disksList2 });
 	    setTimeout(() => {
 	    	if(nextDiskData2.length > 0){
	 	    	for (let j = 0; j< nextDiskData2.length; j++){
		 	    	if(nextDiskData2[j].next_Disk_Storage_Type == ''){
		 	    		$("#Disk_Storage_Type_"+nextDiskData2[j].next_Disk_keyValue).val("");
		 	    	}
	 	    	}
 	    	}
 	    }, 100);
	  }else{
		  let disksList = [...this.state["disksList_"+(vm+1)]];
		  	let nextDiskData = [];
		  	if(disksList[(i+1)]){
			  for (let j = (i+1); j< disksList.length; j++){
				  let next_Disk_Storage_Type = $("#Disk_Storage_Type_"+disksList[j].keyValue).val();
				  let next_Disk_keyValue = disksList[j].keyValue;
				  nextDiskData.push({next_Disk_Storage_Type,next_Disk_keyValue});
			  }
		  	}
	 		
	 	    disksList.splice(i, 1);
	 	    this.setState({ ["disksList_"+(vm+1)] : disksList });
	 	    setTimeout(() => {
	 	    	if(nextDiskData.length > 0){
		 	    	for (let j = 0; j< nextDiskData.length; j++){
			 	    	if(nextDiskData[j].next_Disk_Storage_Type == ''){
			 	    		$("#Disk_Storage_Type_"+nextDiskData[j].next_Disk_keyValue).val("");
			 	    	}
		 	    	}
	 	    	}
	 	    }, 100);
	  }
// 	}, 1000);
     
  }
  
  handleZoneChange(vm, e) {
     const { name, value } = e.target;
//     let zonesList = [...this.state.zonesList];
//     zonesList[i] = {...zonesList[i], [name]: value};
//     this.setState({ zonesList });
     
     let vmList = [...this.state.vmList];
	 vmList[vm] = {...vmList[vm], [name]: value};
	 this.setState({ vmList });
  }
  
  getBuList(){
  	this.setState({
  		cmdbBuData: []
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
                console.log("cmdbBuData result --- ",result);
            	if(result.status == "success"){
                    this.setState({
                    	cmdbBuData: result.data
                    });
                    if(result.data && result.data.length > 0){
                    	// this.setState({
                    	// 	cmdbBuUnit: result.data[0].bu_name
                     //    });
                    }
            	}else{
            		toast.error(result.message);
            	}
            }
            else{
                toast.error("Failed loading the GSN BU List, please try later.");
            }        
        });
    });
  }
  
  getCmdbCountries(){
  	this.setState({
  		cmdbCountries: [],
  		cmdbCountriesMod : [],
  		optionsCmdbSelectedCountries : null
  	});

    var frmData={
    		"record_status": "1",
    }, countryRegionJson = {};
    
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    fetch(`${config.apiUrl}/secureApi/azure/getCmdbCountries`, requestOptions).then(response  => {
        response.text().then(text => {
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

            if (response.ok) {
                var result=(data.value ? data.value : data)
//                console.log("getCmdbCountries result --- ",result);
                let optionsCmdbSelectedCountries = [];
            	if(result.status == "success"){
                    if(result.data && result.data.length > 0){
                    	let cmdbCountriesMod = [];
	            		for(let i=0; i< result.data.length; i++){
//	            			console.log("cmdbCountries result.data[i] --- ",result.data[i]);
	            			cmdbCountriesMod.push({ 
																	value: result.data[i].u_code+"@$"+result.data[i].u_name, 
																	label: result.data[i].u_name,
																	u_region: result.data[i].u_region 
																});
																countryRegionJson[
																	result.data[i].u_code+"@$"+result.data[i].u_name
																] = result.data[i].u_region;
																countryRegionJson[result.data[i].u_region] = countryRegionJson[result.data[i].u_region] || [];

																countryRegionJson[result.data[i].u_region].push({ 
																	value: result.data[i].u_code+"@$"+result.data[i].u_name, 
																	label: result.data[i].u_name,
																	u_region: result.data[i].u_region 
																});
															}
	            		/*optionsCmdbSelectedCountries.push({ 
																value: result.data[0].u_code+"@$"+result.data[0].u_name, 
																label: result.data[0].u_name,
																u_region: result.data[0].u_region
															});*/
//    					console.log("optionsCmdbSelectedCountries -- ", optionsCmdbSelectedCountries);
	            		this.setState({
																countryRegionJson,
	            			optionsCmdbSelectedCountries: optionsCmdbSelectedCountries,
	            			cmdbSelectedCountries: [result.data[0].u_code+"@$"+result.data[0].u_name],
                        	cmdbCountriesMod
                        });
                    }
                    this.setState({cmdbCountries: result.data,});
					if(result.data && result.data[0] && result.data[0].u_region){
						this.getCmdbRegions(result.data[0].u_region);
					}
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
  
  getCmdbRegions(selectedRegion){
  	this.setState({
  		cmdbRegions : [],
  		cmdbRegionsMod : [],
  		optionsCmdbSelectedRegions : null
  	});

				var countryRegionJson = this.state.countryRegionJson,
				 frmData={
    		"record_status": "1",
     }, regionsJson = {};
    
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    fetch(`${config.apiUrl}/secureApi/azure/getCmdbRegions`, requestOptions).then(response  => {
        response.text().then(text => {
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
            
            if (response.ok) {
																var result=(data.value ? data.value : data)
//                console.log("getCmdbRegions result --- ",result);
                let optionsCmdbSelectedRegions = [];
            	if(result.status == "success"){
                    if(result.data && result.data.length > 0){
                    	let cmdbRegionsMod = [];
	            		for(let i=0; i< result.data.length; i++){
																/*if (selectedRegion === result.data[i].sys_id) {
																	optionsCmdbSelectedRegions.push({ value: result.data[i].u_code+"@$"+result.data[i].u_name, label: result.data[i].u_name });
																}
																*/
																regionsJson[result.data[i].u_code+"@$"+result.data[i].u_name] = result.data[i].sys_id;

//	            			console.log("cmdbRegions result.data[i] --- ",result.data[i]);
																cmdbRegionsMod.push({ value: result.data[i].u_code+"@$"+result.data[i].u_name, label: result.data[i].u_name });
																regionsJson[result.data[i].sys_id] = { value: result.data[i].u_code+"@$"+result.data[i].u_name, label: result.data[i].u_name };
	            		}
	            		
//    					console.log("optionsCmdbSelectedRegions -- ", optionsCmdbSelectedRegions);
	            		this.setState({
																regionsJson,
	            			optionsCmdbSelectedRegions: optionsCmdbSelectedRegions,
	            			cmdbRegion: "",
                        	cmdbRegionsMod
                        });
                    }
                    this.setState({
                    	cmdbRegions: result.data
                    });
                    if(result.data && result.data.length > 0){
                    	this.setState({
                    		cmdbSelectedRegions: [result.data[0].u_code+"@$"+result.data[0].u_name]
                        });
                    }
            	}else{
            		toast.error(result.message);
            	}
            }
            else{
                toast.error("Failed loading the GSN Regions List, please try later.");
            }        
        });
    });
  }
  
  getCmdbImpacts(){
  	this.setState({
  		cmdbImpacts : []
  	});

    var frmData={
    		"record_status": "1",
    }
    
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    fetch(`${config.apiUrl}/secureApi/azure/getCmdbImpacts`, requestOptions).then(response  => {
        response.text().then(text => {
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
            
            if (response.ok) {
                var result=(data.value ? data.value : data)
//                console.log("getCmdbImpacts result --- ",result);
            	if(result.status == "success"){
                    this.setState({
                    	cmdbImpacts: result.data
                    });
                    if(result.data && result.data.length > 0){
                    	// this.setState({
                    	// 	cmdbImpact : result.data[0].label_value+"@$"+result.data[0].label_name
                     //    });
                    }
            	}else{
            		toast.error(result.message);
            	}
            }
            else{
                toast.error("Failed loading the GSN Impacts List, please try later.");
            }        
        });
    });
		}
		
		getCaptcha() {
			let requestOptions = {method: 'GET'};

			fetch(`${config.apiUrl}/azure/get-captcha`, requestOptions).then(response  => {
				response.text().then(text => {
					let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

						this.setState({svg: data.data, captcha: data.text});
				});
			});
		}

  getCmdbServices(){
  	this.setState({
  		cmdbServices : []
  	});

    var frmData={
    		"record_status": "1",
    }
    
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    fetch(`${config.apiUrl}/secureApi/azure/getCmdbServices`, requestOptions).then(response  => {
        response.text().then(text => {
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
            
            if (response.ok) {
                var result=(data.value ? data.value : data)
//                console.log("getCmdbServices result --- ",result);
            	if(result.status == "success"){
                    this.setState({
                    	cmdbServices : result.data
                    });
                    if(result.data && result.data.length > 0){
                    	// this.setState({
                    	// 	cmdbService : result.data[0].u_name+"@$"+result.data[0].sys_id
                     //    });
                    }
            	}else{
            		toast.error(result.message);
            	}
            }
            else{
                toast.error("Failed loading the GSN Services List, please try later.");
            }        
        });
    });
  }
  
  changeSystemName(val){
	  this.setState({ system_name :val});
	  console.log(this.state.system_name);
	  let system_type = '';
    if(val == 'ABAP'){
    	system_type = 'APP';
    }else if(val == 'HANA DB'){
    	system_type = 'DB';
    }
    this.setState({ selected_system_type :system_type});
    console.log(system_type);
  }
  
  changeSystemType(val){
	  this.setState({ selected_system_type :val});
	  console.log(this.state.system_name);
  }
  changeNetworkIdentify(val){
	  this.setState({ 
//		  selectedVirtualNetwork :"", 
		  selectedSubnet : ""
	  });
	  console.log("NetworkIdentify -- "+val);
//	  $("#virtualNetwork").val("");
	  $("#subnet").val("");
	  
	  if(val){
		  setTimeout(() => {
	    		this.changeSubnetData();
	      }, 100);
	  }
  }
  environmentChange(val){
	  this.setState({ 
		  selectedSubnet : "",
		  environment : val
	  });
	  console.log("environment -- "+val);
	  $("#subnet").val("");
	  
	  if(val){
		  setTimeout(() => {
	    		this.changeSubnetData();
	      }, 100);
	  }
  }
  changeSubnetData(){
	  if(!this.state.shared_image_name){
		  return;
	  }
	  
	  var form = document.querySelector("#saveOrderInfoFrm");
      var formData = serialize(form, { hash: true });
      console.log("formData -- ",formData);
      
	  let subnet = [];
      let network_identify_arr = ["Unclassified","Classified"];
      let matched_subnet = "";
      console.log("this.state.shared_image_name.toLowerCase().indexOf('sap') --- ",this.state.shared_image_name.toLowerCase().indexOf('sap'));
      let network_tag = "UCP-"+this.state.environment+"-"+((this.state.shared_image_name.toLowerCase().indexOf('sap') >= 0)?"HN":((this.state.os_type == 'Windows')?"WS":"LS"))+"-"+network_identify_arr[formData.network_identify];
      console.log("network_tag ---- ", network_tag);
      let cluster_tag = "UCP-"+this.state.environment+"-Cluster-"+network_identify_arr[formData.network_identify];
      console.log("cluster_tag ---- ", cluster_tag);
      console.log("formData.virtualNetwork ---- ", formData.virtualNetwork);
      let subnet1_name = '';
      for(let i =0; i < this.state.virtualNetwork.length; i++){
          if(this.state.virtualNetwork[i].name == formData.virtualNetwork){
        	  console.log("this.state.virtualNetwork[i] ---- ", this.state.virtualNetwork[i]);
          	for(let j =0; j < this.state.virtualNetwork[i].properties.subnets.length; j++){
//          		if(this.state.virtualNetwork[i].properties.subnets[j].name.toLowerCase().indexOf(network_identify_arr[formData.network_identify]) == 0){
          		if(formData.network_identify == 0){
              		if(this.state.virtualNetwork[i].properties.subnets[j].name.toLowerCase().indexOf("unclassified") >= 0){
              			subnet.push(this.state.virtualNetwork[i].properties.subnets[j]);
              			console.log("subnet ---- ", subnet);

              			if(this.state.virtualNetwork[i].tags
          					&& this.state.virtualNetwork[i].tags[network_tag]
              			&& JSON.parse(this.state.virtualNetwork[i].tags[network_tag]).indexOf(this.state.virtualNetwork[i].properties.subnets[j].name) >= 0
              			){
              				matched_subnet = this.state.virtualNetwork[i].properties.subnets[j];
              			}
              		}
              		if(this.state.virtualNetwork[i].tags
          					&& this.state.virtualNetwork[i].tags[cluster_tag]
              			&& JSON.parse(this.state.virtualNetwork[i].tags[cluster_tag])[0] != ""
              			){
              			subnet1_name = JSON.parse(this.state.virtualNetwork[i].tags[cluster_tag])[0];
              		}
                }else{
                  	if(this.state.virtualNetwork[i].properties.subnets[j].name.toLowerCase().indexOf("unclassified") < 0){
                  		subnet.push(this.state.virtualNetwork[i].properties.subnets[j]);
                  		console.log("subnet ---- ", subnet);

              			if(this.state.virtualNetwork[i].tags
          					&& this.state.virtualNetwork[i].tags[network_tag]
              				&& JSON.parse(this.state.virtualNetwork[i].tags[network_tag]).indexOf(this.state.virtualNetwork[i].properties.subnets[j].name) >= 0
              			){
              				matched_subnet = this.state.virtualNetwork[i].properties.subnets[j];
              			}
                  	}
                  	if(this.state.virtualNetwork[i].tags
          					&& this.state.virtualNetwork[i].tags[cluster_tag]
              			&& JSON.parse(this.state.virtualNetwork[i].tags[cluster_tag])[0] != ""
              			){
              			subnet1_name = JSON.parse(this.state.virtualNetwork[i].tags[cluster_tag])[0];
              		}
                }
          	}
          	if(matched_subnet != ""){
          		subnet = [];
          		subnet.push(matched_subnet);
          	}
              break;
          }
      }
      console.log("subnet1_name ---- ", subnet1_name);
      
      if(subnet && subnet.length > 0){
      	setTimeout(() => {
      		this.subnetChange(subnet[0].name);
          }, 100);
      }
      this.setState({
          subnets: subnet,
          subnet1_name
      });
  }
  changeBackupType(val){
	  this.setState({ 
		  backupType : val
	  });
  }
  
  AddToCart = (e) => {
				e.preventDefault();
				let state = this.state,
				{activeStepper} = state;
//				 {inpCaptcha, captcha, activeStepper} = state;
    if(activeStepper != 2){
    	console.log("AddToCart triggered");
    	return
				}
				
////    if(this.state.userNameValidate == "checking"){
////        toast.warn("Please wait, Username is Validating");
////        return;
////    }
//    else if(!this.state.username){
//        toast.error("Please enter Username");
//        return;
//    }
////    else if(this.state.userNameValidate != "success"){
////        toast.error("Please enter valid Username");
////        return;
////    }
//    else if(!this.state.password){
//        toast.error("Please enter Password");
//        return;
//    }
////    else if(this.state.password.length < 12){
////        toast.error("New Password Must be at least 12 characters.");
////        return;
////    }
////    else if(this.state.password.length > 32){
////        toast.error("New Password Must not be greater than 32 characters.");
////        return;
////    }
////    else if(!this.state.password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)){
////        toast.error("New Password Must be Contain Atleast one Small and one Capital letter");
////        return;
////    }
////    else if(!this.state.password.match(/([0-9])/)){
////        toast.error("New Password Must be Contain Atleast one number");
////        return;
////    }
////    else if(this.state.password.match(/(.*[.,()%])/)){
////        toast.error(".,()% These Special characters are not allowed in New Password");
////        return;
////    }
////    else if(!this.state.password.match(/(.*[@,=,!,&,#,$,^,*,?,_,~,-])/)){
////        toast.error("New Password Must be Contain atleast one special character");
////        return;
////    }
//    else if(!this.state.confirmPassword){
//        toast.error("Please enter Confirm Password");
//        return;
//    }
//    else if(this.state.password != this.state.confirmPassword){
//        toast.error("Password and Confirm Password does not match");
//        return;
//    }
    
    if(!this.state.selectedSubnet){
        toast.error("Please select Subnet");
        return;
    }
//    else if(this.state.validateAvailableIpsCount && !this.state.availableIpsCount){
//        toast.error("Ips not available for selected Subnet");
//        return;
//    }
//    else if(!this.state.selectedPublicIp){
//        toast.error("Please select Public IP");
//        return;
//    }
//    else if(!this.state.selectedNIC){
//        toast.error("Please enter NIC");
//        return;
//    }
    // else if(!this.state.backup_resource_group_name){
    //     toast.error("Please enter Backup Resource Group");
    //     return;
    // }
    // else if(!this.state.recovery_vault_name){
    //     toast.error("Please enter Backup Vault Name");
    //     return;
    // }
    // else if(!this.state.backup_policy){
    //     toast.error("Please enter Backup Vault Policy");
    //     return;
    // }
    // else if(!this.state.storage_resource_group_name){
    //     toast.error("Please select Storage Resource Group");
    //     return;
    // }
    // else if(!this.state.storage_account_name){
    //     toast.error("Please select Storage Account Name");
    //     return;
    // }else if(!this.state.cmdbBuUnit){
    // 	toast.error("Please select Impacted Business Unit");
	// 							return;
    // }else if(this.state.optionsCmdbSelectedCountries && this.state.optionsCmdbSelectedCountries.length == 0){
    // 	toast.error("Please select Impacted Country");
    //     return;
    // }else if(this.state.optionsCmdbSelectedRegions && this.state.optionsCmdbSelectedRegions.length == 0){
    // 	toast.error("Please select Impacted Region");
    //     return;
    // }else if(!this.state.cmdbImpact){
    // 	toast.error("Please select Impact");
    //     return;
    // }else if(!this.state.cmdbService){
    // 	toast.error("Please select Impacted Service");
    //     return;
    // } 
//    else if (!inpCaptcha) {
//		toast.error("Please enter captcha");
//		return;
//	} else if (inpCaptcha !== captcha) {
//		toast.error("Enter valid captcha");
//		return
//	}
    
//    console.log("this.state.vmList -- ",this.state.vmList);
//    for(let i =0; i < this.state.vmList.length; i++){
//    	if(!this.state.vmList[i].selectedNIC || this.state.vmList[i].selectedNIC == ''){
//            toast.error("Please enter in VM NIC "+(i+1));
//        	return;
//    	}
//    }

    this.setState({
        isCartAddingInprogress: true
    });

    var form = document.querySelector("#saveOrderInfoFrm");
    var formData = serialize(form, { hash: true });
    console.log("formData -- ",formData);
    
    let frmData = {
        "cloud_id" : 3,
        "cart_items" : {
//            "location": this.state.locationName,//locationId
//            "clientid" : this.state.clientid,
//            "storageAccountType" : this.state.storageAccountType,
//            "imageName" : this.state.os_template_name,
//            "subscriptionId" : this.state.subscriptionId.replace(this.state.clientid+"_",""),
//            "networkInterface" : this.state.selectedNIC,
//            "adminUsername" : this.state.username,
//            "computerName" : this.state.vm_name,
//            "adminPassword" : this.state.password,
//            "resourceGroup" : this.state.resourceGroupName,
//            "networkResourceGroupName" : formData.networkResourceGroupName,
//            "zone" : formData.zone,
//            "vmSize" : this.state.vm_size_name,
//            "diskName" : this.state.vm_diskName,
//            "cpus" : this.state.vm_cpus,
//            "ram" : this.state.vm_ram,
//            "disksize" : this.state.disksize,
            
            "location": this.state.locationName,//locationId
            selected_rg_location_name : this.state.selected_rg_location_name,
            selected_network_location_name : this.state.selected_network_location_name,
            "clientid" : this.state.clientid,
            "diskName" : this.state.vm_diskName,
            "cpus" : this.state.vm_cpus,
            "ram" : this.state.vm_ram,
            "disksize" : this.state.disksize,
            
//            virtual_machine_name: this.state.vm_name,
//            nic_name: this.state.selectedNIC,
            virtual_machine_size: this.state.vm_size_name,
            os_disk_size:this.state.disksize,
            os_disk_storage_account_type:this.state.storageAccountType,
            os_type:this.state.os_type,
//            managed_disk_name:'[\"'+formData.Disk_Name_1+'\",\"'+formData.Disk_Name_2+'\"]',
//            managed_disk_size:'['+formData.Disk_Size_1+','+formData.Disk_Size_2+']',
//            managed_disk_size_storage_account_type: '[\"'+this.state.storageAccountType+'\",\"'+this.state.storageAccountType+'\"]',
            deployment_resource_group_name: this.state.resourceGroupName,
            sharedimage_resource_group_name : this.state.sharedimage_resource_group_name,
            gallery_name: this.state.gallery_name,
            shared_image_name: this.state.shared_image_name,
            shared_image_version: this.state.shared_image_version,
            network_resource_group_name: formData.networkResourceGroupName,
            virtual_network_name: formData.virtualNetwork,
            subnet_name: formData.subnet,
//            zone: formData.zone,
            image_name: this.state.os_template_name,
            admin_username: this.state.username,
            admin_password: this.state.password,
            environment: formData.environment,
//            system_name: formData.system_name,
            system_type: ((this.state.shared_image_tags && this.state.shared_image_tags['UCP-System-Type'])?this.state.shared_image_tags['UCP-System-Type']:"APP"),//formData.system_type,
            subscription_id: this.state.subscriptionId.replace(this.state.clientid+"_",""),
            client_id: this.state.user_details.data.azure_clientid,
            client_secret: this.state.user_details.data.azure_clientsecretkey,
            tenant_id: this.state.user_details.data.azure_tenantid,
            storage_resource_group_name : this.state.storage_resource_group_name,
            storage_account_name: formData.storage_account_name,
            backup_resource_group_name: this.state.backup_resource_group_name,
            recovery_vault_name : this.state.recovery_vault_name,
            backup_policy : this.state.backup_policy,
            region : formData.region,
            network_identify : formData.network_identify,
            availability_set_or_zone : this.state.availability_set_or_zone,
            managed_infra_subscription_id : this.state.managed_infra_subscription_id,
            subscription_provision_type : this.state.subscription_provision_type,
            cmdbBuUnit : this.state.cmdbBuUnit,
			cmdbCountry : ((this.state.optionsCmdbSelectedCountries)?this.state.optionsCmdbSelectedCountries.map(country => country.value).join("@^"):""),//this.state.cmdbCountry,
			cmdbRegion : ((this.state.optionsCmdbSelectedRegions)?this.state.optionsCmdbSelectedRegions.map(region => region.value).join("@^"):""),//this.state.cmdbRegion,
            cmdbImpact : this.state.cmdbImpact,
            cmdbService : this.state.cmdbService,
            shared_image_tags : this.state.shared_image_tags,
            shared_image_version_tags : this.state.shared_image_version_tags,
            mountPointJson: this.state.mountPointJson,
            selected_ansible_server : this.state.selected_ansible_server,
            osMiddleware :  this.state.osMiddleware,
            is_cluster : ((this.state.vm_selection == 'Clustering')?1:0),
            subnet1_name : this.state.subnet1_name,
            acceleratedNetworkingEnabled : this.state.acceleratedNetworkingEnabled,
            domain_extension : this.state.domain_extension,
            Netbackup_policy:this.state.Netbackup_policy,
            db_full_backup:this.state.db_full_backup,
  		  	db_log_backup:this.state.db_log_backup,
  		  	db_backup:this.state.db_backup,
  		  	db_backup2:this.state.db_backup2,
            recovery_vault_name_tags:this.state.recovery_vault_name_tags,
            cyberark_region : this.state.cyberark_region,
            selectedSubscriptionLabel : this.state.selectedSubscriptionLabel
        },
        "clientid": this.state.clientid,
        "user_id": this.state.user_id,
        "billing_type": "MONTHLY",
        "os_template_id": this.state.os_template_id,
        "cloud_type": "AZURE",
        is_cluster : ((this.state.vm_selection == 'Clustering')?1:0),
        "price" : (Number(this.state.vm_price) + Number(this.state.os_price) + Number(this.state.disk_price))
    };

    let VmListUpdated = [];
    for(let vm =0; vm < this.state.vmList.length; vm++){
    	let vmData = {
    			virtual_machine_name : this.state.vmList[vm].vm_name,
    			nic_name : this.state.vmList[vm].selectedNIC,
    	};
    	if(this.state.vm_selection == 'Clustering'){
    		vmData.nic_name2 = this.state.vmList[vm].selectedNIC2;
    	}
    	if(this.state.availability_set_or_zone == 'Zone'){
    		vmData.zone = this.state.vmList[vm].zone;
    	}else if(this.state.availability_set_or_zone == 'Set'){
    		vmData.availability_set_name = this.state.availability_set_name;
    	}
    	
    	if(this.state.weblogicMiddlewares.indexOf(this.state.shared_image_tags["UCP-MW"]) >= 0){
    		vmData.weblogicServiceName = this.state.vmList[vm].weblogicServiceName;
//    		vmData.weblogicManagedServers = this.state.vmList[vm].weblogicManagedServers;
    		vmData.weblogicUsername = this.state.vmList[vm].weblogicUsername;
    		vmData.weblogicPassword = this.state.vmList[vm].weblogicPassword;
        }
    	if(this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] == 'Oracle'){
    		vmData.dbName = this.state.vmList[vm].dbName;
    		vmData.dbUsername = this.state.vmList[vm].dbUsername;
    		vmData.dbPassword = this.state.vmList[vm].dbPassword;
    		vmData.dbCharacterSet = this.state.vmList[vm].dbCharacterSet;
        }
    	if(this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] == 'Informix'){
    		vmData.dbName = this.state.vmList[vm].dbName;
    		vmData.informixLog = this.state.vmList[vm].informixLog;
        }
    	if(this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] == 'MSSQL'){
    		vmData.msDbName = this.state.vmList[vm].msDbName;
    		vmData.Data_File_Size = this.state.vmList[vm].Data_File_Size;
    		vmData.Log_File_Size = this.state.vmList[vm].Log_File_Size;
    		vmData.Temp_DB_Size = this.state.vmList[vm].Temp_DB_Size;
        }
    	
    	vmData.managed_disk_name ='';
	    vmData.managed_disk_host_caching ='';
	    vmData.managed_disk_storage_size ='';
	    vmData.managed_disk_size ='';
	    vmData.managed_disk_size_storage_account_type ='';
	    if(this.state[this.state.vmList[vm].disksListId] && this.state[this.state.vmList[vm].disksListId].length > 0){
		    for(let i =0; i < this.state[this.state.vmList[vm].disksListId].length; i++){
		    	if(i == 0){
		    		vmData.managed_disk_name = '[\"'+this.state[this.state.vmList[vm].disksListId][i].Disk_Name+'\"';
		    		vmData.managed_disk_host_caching = '[\"'+this.state[this.state.vmList[vm].disksListId][i].Disk_Host_Caching+'\"';
		    		vmData.managed_disk_storage_size = '[\"'+this.state[this.state.vmList[vm].disksListId][i].Disk_Storage_Size+'\"';
		    	    vmData.managed_disk_size = '['+this.state[this.state.vmList[vm].disksListId][i].Disk_Size;
	//	    	    vmData.managed_disk_size_storage_account_type = '[\"'+this.state.storageAccountType+'\"';
		    	    vmData.managed_disk_size_storage_account_type = '[\"'+this.state[this.state.vmList[vm].disksListId][i].Disk_Storage_Type+'\"';
		    	}else{
			    	vmData.managed_disk_name +=',\"'+this.state[this.state.vmList[vm].disksListId][i].Disk_Name+'\"';
			    	vmData.managed_disk_host_caching +=',\"'+this.state[this.state.vmList[vm].disksListId][i].Disk_Host_Caching+'\"';
			    	vmData.managed_disk_storage_size +=',\"'+this.state[this.state.vmList[vm].disksListId][i].Disk_Storage_Size+'\"';
			        vmData.managed_disk_size +=','+this.state[this.state.vmList[vm].disksListId][i].Disk_Size;
	//		        vmData.managed_disk_size_storage_account_type +=',\"'+this.state.storageAccountType+'\"';
			        vmData.managed_disk_size_storage_account_type +=',\"'+this.state[this.state.vmList[vm].disksListId][i].Disk_Storage_Type+'\"';
		    	}
		    }
		    vmData.managed_disk_name +=']';
		    vmData.managed_disk_host_caching +=']';
		    vmData.managed_disk_storage_size +=']';
		    vmData.managed_disk_size +=']';
		    vmData.managed_disk_size_storage_account_type +=']';
	    }
	    
	    VmListUpdated.push(vmData);
    }
    frmData.cart_items.VmListUpdated = VmListUpdated;
    
    console.log("frmData -- ",frmData);
//    return;
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/orders/saveOtherCloudOrderInfo`, requestOptions).then(response  => this.handleCartResponse(response));
  }
  
  handleCartResponse(response, stateName) {
	    return response.text().then(text => {
	        const data = text && JSON.parse(ucpDecrypt((text)));
	        if (!response.ok) {
	        	this.setState({
		            isCartAddingInprogress: false
		        });
	            toast.error(response.message);
	        }
	        else{
	          toast.success("Order added to cart successfully.");
	          setTimeout(() => {
	        	  history.push("/#/pendingOrdersList");
	              location.reload();
	          }, 1000);
	        }
	    });
	  }

  vm_size_popup(){
    this.setState({ vm_size_popup: true });
    this.updateVmSize();
  }

  vm_size_popupCloseModal(){
    this.setState({ vm_size_popup: false });
  }

  vm_disk_popup = () =>{
    this.setState({ vm_disk_popup: true });
    this.updateVmDisk();
  }

  vm_disk_popupCloseModal = () => {
    this.setState({ vm_disk_popup: false });
  }

  generateIPPopupClick(){
    this.setState({ generateIPPopup: true, choosenIpName: "" });
  }

  generateIPPopupCloseModal(){
    this.setState({ generateIPPopup: false, choosenIpName: "" });
  }
  
  generatePublicIpClick(){
    if(!this.state.choosenIpName){
        toast.error("Please choose valid IP Name");
        return;
    }

    this.setState({
        isGenerateIpInprogress: true
    });

    var frmData={
        resourceGroup: this.state.resourceGroupName,
        subscriptionId: this.state.subscriptionId.replace(this.state.clientid+"_",""),
        clientid: this.state.clientid,
        location: this.state.selected_network_location_name,
        publicIpAddressName: this.state.choosenIpName
    }
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/azureapi/create_public_ip`, requestOptions).then(response  => {
        response.text().then(text => {
            
            
            this.setState({
                isGenerateIpInprogress: false
            });
            var data = text && JSON.parse(text);
            if (response.ok) {
                var result=(data.value ? data.value : data)
                if(result.error){          
                    toast.error(result.error.message);
                } else {
                    toast.success("Generated Public IP Successfully!");

                    let publicIps = this.state.publicIps;
                    publicIps.push(result);
                    this.setState({
                        publicIps: publicIps,
                        selectedPublicIp: result.name,
                        choosenIpName: ""
                    });
                    this.generateIPPopupCloseModal();
                    
                    setTimeout(() => {
                        $("#publicIpAddressName").val(result.name);
                        toast.info("Newly generated IP has been auto-selected !");
                    }, 1000);
                }
            }
            else{
                toast.error("Unable generate Public IP, Please check selection.");
            }        
        });
    });
  }
  
  createNewAvailabilitySetPopupClick(){
    this.setState({ createNewAvailabilitySetPopup: true, availability_set_name_new: "" });
  }

  createNewAvailabilitySetPopupCloseModal(){
    this.setState({ createNewAvailabilitySetPopup: false, availability_set_name_new: "" });
  }
  
  createNewAvailabilitySetClick(){
    if(!this.state.availability_set_name_new){
        toast.error("Please enter Availability Set Name");
        return;
    }

    this.setState({
        isCreateNewAvailabilitySetInprogress: true
    });

    var frmData={
		resourceGroup: this.state.resourceGroupName,
        subscriptionId: this.state.selected_subscription_id,
        clientid: this.state.clientid,
        location: this.state.selected_region_location_name,
        availabilitySet: this.state.availability_set_name_new
    }
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/azureapi/create_availability_set`, requestOptions).then(response  => {
        response.text().then(text => {
            this.setState({
                isCreateNewAvailabilitySetInprogress: false
            });
            var data = text && JSON.parse(text);
            if (response.ok) {
                var result=(data.value ? data.value : data)
            	if(result.status == "success"){
            		toast.success("Created Availability Set Successfully!");

                    let availabilitySetNameData = this.state.availabilitySetNameData;
                    availabilitySetNameData.push(result.data);
                    this.setState({
                    	availabilitySetNameData: availabilitySetNameData,
                        availability_set_name: result.data.name,
                        availability_set_name_new: ""
                    });
                    this.createNewAvailabilitySetPopupCloseModal();
                    
                    setTimeout(() => {
                        $("#availability_set_name").val(result.data.name);
                        toast.info("Newly created Availability Set has been auto-selected !");
                    }, 1000);
            	}else{
            		toast.error(result.message);
            	}
            }
            else{
                toast.error("Unable to create Availability Set, Please check data.");
            }        
        });
    });
  }

  generateNICPopupClick(){
    if(!this.state.selectedPublicIp){
        toast.error("Please select Public IP before generate NIC");
        return;
    }

    this.setState({ generateNICPopup: true, choosenNICName: "" });
  }

  generateNICPopupCloseModal(){
    this.setState({ generateNICPopup: false, choosenNICName: "" });
  }

  getDiskList(frmData){
    frmData.diskState = "Unattached";

      const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    this.setState({
        isVmDiskListLoading: true
    });

    fetch(`${config.apiUrl}/secureApi/azure/getDiskList`, requestOptions).then(response  => this.vmDiskHandleResponse(response,"unAttachedDisksList"));
  }

  vmDiskHandleResponse(response, stateName) {
    return response.text().then(text => {
        let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if (data.status != "success") {
            this.setState({
                [stateName]: [],
                vmDisk_backup_list: []
            });
        }
        else{            
            data = (data.data ? data.data : data);

            this.setState({
                [stateName]: [],
                vmDisk_backup_list: data
            });

            setTimeout(() => {
                this.updateVmDisk();
            }, 10);
        }

        this.setState({
            isVmDiskListLoading: false
        });
    });
  }

  vm_disk_Change = (id, vm_disk_name, disk_price) => {
    setTimeout(() => {
        $("#"+id).prop("checked", true);
    }, 0);

    if(!disk_price){
        disk_price = 0;
    }
    
    this.setState({
        vm_diskName: vm_disk_name,
        disk_price : disk_price
    });
  }

  updateVmDisk(){
    let rows = [];
    
    let data = this.state.vmDisk_backup_list;

    for(let num = 0; num < data.length; num++){
        let row = data[num];
        rows.push({
            action: <input id={"radioVmDisk" + num} checked={(row.name == this.state.vm_diskName ?  true : false)} onChange={e => this.vm_disk_Change(
                "radioVmDisk" + num,
                row.name,
                row.properties.diskSizeGB * this.state.priceFor1GBDisk)}
            style={{ height: '20px', width: '20px'}} type="radio" name="vm_size_popup" value={row.name} />,
            name: row.name,
            diskSizeGB: row.properties.diskSizeGB + " GB",
            price: commonFns.fnFormatCurrency(Number(row.properties.diskSizeGB * this.state.priceFor1GBDisk))
        });
    }
    
    if(rows.length > 0){
        this.setState({
            unAttachedDisksList: {
                columns: [
                {
                    label: '',
                    field: 'action'
                },
                {
                    label: 'Disk Name',
                    field: 'name',
                },
                {
                    label: 'Disk Size',
                    field: 'diskSizeGB',
                },
                {
                    label: 'Price',
                    field: 'price',
                }
            ],
            rows: rows
            }
        });
    }
  }

  callDisks(){
      if(this.state.subscriptionId){
        this.getDiskList(
            { 
            "clientid" : this.state.clientid, 
            "subscription_id" : this.state.subscriptionId.replace(this.state.clientid+"_",""),
            "diskState" : "Unattached", 
            "resourceGroup": this.state.resourceGroupName
        });
      }
      else{
        this.setState({
            unAttachedDisksList: "",
            vm_diskName: "",
            disk_price: 0
        });
      }
  }

  subscriptionChange = (subscriptionId,cb) => {
	  console.log("subscription_provision_type --- ", this.state.subscription_provision_type);
      this.setState({
        subscriptionId:subscriptionId,
        selected_subscription_id : subscriptionId.replace(this.state.clientid+"_",""),
		virtualNetwork: [],
		resourceGroups : [],
		backupResourceGroups : [],
	    storageResourceGroups : [],
	    completeResourceGroups : [],
        selected_region : "",
        selected_rg_location_name : "",
        selectedSubscriptionLabel : "",
        environment : "",
        storage_resource_group_name:"",
		storage_account_name : "",
		backup_resource_group_name:"",
		recoveryVaultNameData: [],
		recovery_vault_name:"",
		backupPolicyData: [],
		backup_policy : '',
		resourceGroupName : "",
		selected_network_location_name : "",
//		virtualNetworkInProgress: true
      });
      
      if(subscriptionId){
//        this.getAzureOSTemplate({clientid:this.state.clientid,
//            subscriptionId:subscriptionId.replace(this.state.clientid+"_",""),
//            currency_id: this.state.user_details.data.currency_id
//        });
//        this.props.dispatch(azureActions.getAzureResourceGroups({clientid:this.state.clientid,subscription_id:subscriptionId.replace(this.state.clientid+"_","")}));
//        this.state.dispatch(azureActions.getAzureDropdownData({clientid:this.state.clientid,subscription_id:subscriptionId.replace(this.state.clientid+"_","")}));
        
        var frmData={
        	subscription_id: subscriptionId.replace(this.state.clientid+"_",""),
        	clientid:this.state.clientid,
    		user_role: this.state.user_role, 
    		user_id:this.state.user_id
        }
        let selected_provision_type = '';
        for(let sub =0; sub < this.props.azure.subscription_list.length; sub++){
        	if(this.props.azure.subscription_list[sub].subscription_id == frmData.subscription_id){
        		selected_provision_type = this.props.azure.subscription_list[sub].provision_type;
        		let environmentData = ((this.props.azure.subscription_list[sub].environment && this.props.azure.subscription_list[sub].environment != '')?JSON.parse(this.props.azure.subscription_list[sub].environment):[]);
        		this.setState({
        			selectedSubscriptionLabel: this.props.azure.subscription_list[sub].display_name,
        			environmentData : environmentData
		        });
        		if(environmentData && environmentData.length > 0){
//        			$("#environment").val(environmentData[0].key);
        			this.setState({
        				environment: environmentData[0].key
    		        });
        		}else{
//        			$("#environment").val("");
        		}
        	}
        }
        
        let existing_subscription_provision_type = this.state.subscription_provision_type;
        console.log("existing_subscription_provision_type --- ",existing_subscription_provision_type);
        console.log("selected_provision_type --- ",selected_provision_type);
     // || this.state.subscription_provision_type != selected_provision_type
        //!this.state.is_first_loading || 
        if(this.state.subscription_provision_type != selected_provision_type ){
        	if(this.state.subscription_provision_type != selected_provision_type){
	        	this.setState({
	    			subscription_provision_type: selected_provision_type
		        });
        	}
      	  this.setState({
  	        gallery_name:"",
  			sharedImageNameData: [],
  			managed_infra_subscription_id : "",
  			sharedimage_resource_group_name : "",
  			shared_image_name : "",
  			shared_image_version : "",
  			sharedImageVersionData: []
  	      });
            $("#gallery_name").val("");
            $("#shared_image_name").val("");
            $("#shared_image_version").val("");
        }else{
      	  this.setState({
      		  is_first_loading: false
  	      });
        }
        console.log("existing_subscription_provision_type --- ",existing_subscription_provision_type);
        console.log("selected_provision_type --- ",selected_provision_type);
        if(existing_subscription_provision_type != selected_provision_type){ // cb == '' ||  && $("#gallery_name").val() == '' && this.state.subscription_provision_type != selected_provision_type
	        setTimeout(() => {
	        	if(this.state.galleryListData && this.state.galleryListData.length > 0){
	        		for(let gal =0; gal < this.state.galleryListData.length; gal++){
//	        			if(selected_provision_type == this.state.galleryListData[gal].provision_type){
				    		$("#gallery_name").val(this.state.galleryListData[gal].galleryName);
				    		this.galleryNameChange(this.state.galleryListData[gal].galleryName, "");
				    		break;
//	        			}
	        		}
//	        		$("#gallery_name").val(this.state.galleryListData[0].galleryName);
//		    		this.galleryNameChange(this.state.galleryListData[0].galleryName, "");
	        	}
	        }, 100);
        }
        
        this.setState({
        	isResourceGroupInprogress: true
        });
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(ucpEncrypt(frmData))
        };

//        fetch(`${config.apiUrl}/secureApi/azure/getAzureResourceGroups`, requestOptions).then(response  => {
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
                    this.setState({
                    	resourceGroups: resourceGroups,
                    	completeResourceGroups : result,
                    	backupResourceGroups : [],
              	      	storageResourceGroups : []
                    });
                    
                    if(this.state.DISPLAY_ALL_NETWORK_RESOURCES == 0){
                    	$("#networkResourceGroupName").val("default");
                    }
                    
                    if(cb != '' && cb.indexOf("resourceGroup=") != -1){
                		console.log("enter  resourceGroup cb ");
                		let resourceGroup = cb.split("resourceGroup=")[1].split("&")[0];
                		setTimeout(() => {
	                		resourceGroups.forEach((sub, index) => {
	    	    				if(sub.name == resourceGroup){
	    	    					this.resourceGroupNameChange(resourceGroup,cb);
	    	    				}
	    	    			});
                		}, 100);
                    }else{
            	        setTimeout(() => {
            	        	if(resourceGroups && resourceGroups.length > 0){
    				    		$("#resourceGroupName").val(resourceGroups[0].name);
    				    		this.resourceGroupNameChange(resourceGroups[0].name, "");
            	        	}
            	        }, 100);
                    }
                }
                else{
                    toast.error("The operation did not execute as expected. Please raise a ticket to support");
                }        
            });
        });
        
//        if(this.state.locationName != ''){
//	         this.getAzureVMSize({
//	             clientid:this.state.clientid,
//	             subscriptionId: subscriptionId.replace(this.state.clientid+"_",""), 
//	             location : this.state.locationName,
//	             currency_id: this.state.user_details.data.currency_id});
//        }
      }
      else{
        this.props.azure.subscription_locations = [];
        this.setState({
            osTemplate: [],
            resourceGroupName: "",
//            locationName: "",
//            os_template_id: 0,
//            os_template_name: "",
//            os_price: 0,
//            storageAccountType: "",
//            disksize: "",
//            unAttachedDisksList: "",
//            vm_diskName: "",
//            disk_price: 0
        });
        this.setState({
	        gallery_name:"",
			sharedImageNameData: [],
			managed_infra_subscription_id : "",
			sharedimage_resource_group_name : "",
			shared_image_name : "",
			shared_image_version : "",
			sharedImageVersionData: []
	      });
          $("#gallery_name").val("");
          $("#shared_image_name").val("");
          $("#shared_image_version").val("");
      }
  }

  regionChange = (selValue) => {
	  
	  this.setState({
		  backup_resource_group_name:"",
		  recoveryVaultNameData: [],
		  recovery_vault_name:"",
		  backupPolicyData: [],
		  backup_policy : '',
		  storage_resource_group_name:"",
		  storage_account_name : "",
		  storageAccountNames : [],
		  
		  region : selValue,
		  selectedVirtualNetwork: "",
		  selected_region : "",
		  domain_extension : '',
		  subnets: [],
		  selectedSubnet : "",
		  cyberark_region : ""
	  });
	  
	  console.log("selValue --- ", selValue);
	  this.setState({
		  region : selValue,
		  selectedVirtualNetwork: "",
		  selected_region : "",
		  domain_extension : '',
		  subnets: []
	  });
	  if(!selValue){
		  toast.error("Please Select Region");
	        return;
	  }
	  for(let i =0; i < this.state.Azure_Regions_Data.length; i++){
        if(this.state.Azure_Regions_Data[i].key == selValue){
        	console.log("selected_ansible_server ---- ", this.state.Azure_Regions_Data[i]['ansible-server']);
        	console.log("this.state.Azure_Regions_Data[i].location ---- ", this.state.Azure_Regions_Data[i].location);
        	this.setState({
        		selected_region : this.state.Azure_Regions_Data[i].value,
        		domain_extension : this.state.Azure_Regions_Data[i].domain,
        		selected_ansible_server : this.state.Azure_Regions_Data[i]['ansible-server'],
        		selected_region_location_name : this.state.Azure_Regions_Data[i].location,
        		cyberark_region : this.state.Azure_Regions_Data[i].cyberarkKey
        	});
        	
        	if(this.state.completeResourceGroups && this.state.completeResourceGroups.length > 0){
//    			let selected_rg_location_name = this.state.Azure_Regions_Data[i].location;
    			let backupResourceGroups = [];
      	      	let storageResourceGroups = [];
      	      	
        		for(let rg =0; rg < this.state.completeResourceGroups.length; rg++){
        			if(this.state.completeResourceGroups[rg].is_backup == 'Yes' && this.state.Azure_Regions_Data[i].location == this.state.completeResourceGroups[rg].location_name){
        				backupResourceGroups.push(this.state.completeResourceGroups[rg]);
        			}
        			if(this.state.completeResourceGroups[rg].is_storage == 'Yes' && this.state.Azure_Regions_Data[i].location == this.state.completeResourceGroups[rg].location_name){
        				storageResourceGroups.push(this.state.completeResourceGroups[rg]);
        			}
        		}
    			let backup_resource_group_name = '';
          		let storage_resource_group_name = '';
    	      	this.setState({
    	      		backupResourceGroups :backupResourceGroups,
    	      		storageResourceGroups : storageResourceGroups,
    	      		backup_resource_group_name : backup_resource_group_name,
    	      		storage_resource_group_name : storage_resource_group_name,
//    	    	      		selected_rg_location_name : selected_rg_location_name
    	      	});
    	  }
        }
      }
	  if(selValue){
		  setTimeout(() => {
			  this.load_virtual_networks_locationwise("");
			  this.getAvailabilitySetNames({resource_group: this.state.resourceGroupName,
			        subscription_id: this.state.subscriptionId.replace(this.state.clientid+"_","")});
		  }, 100);
	  } else{
		  this.setState({
			  virtualNetwork: [],
		  });
	  }
  }

  vm_size_Change = (selectedSize) => {
    setTimeout(() => {
        $("#"+selectedSize.id).prop("checked", true);
    }, 0);
    
    let zoneList = [];
    let zoneListArr = ((selectedSize.zones)?JSON.parse(selectedSize.zones):[]);
    if(zoneListArr.length > 0){
    	for(let zl = 0; zl < zoneListArr.length; zl++){
    		zoneList.push({key:zoneListArr[zl],value:zoneListArr[zl]});
    	}
    }
    this.setState({
        vm_size_name: selectedSize.vm_size_name,
        vm_cpus : selectedSize.vm_cpus,
        vm_ram : selectedSize.vm_ram,
        vm_price: selectedSize.vm_price,
        maxDataDiskCount : selectedSize.maxDataDiskCount,
        vmSizePremiumIO : selectedSize.PremiumIO,
        storageAccountType : "",
        acceleratedNetworkingEnabled : selectedSize.AcceleratedNetworkingEnabled,
        zoneList
    });
    let vmList = [...this.state.vmList];
    console.log(vmList);
    for(let i=1; i<= this.state.vm_count; i++){
   	 	vmList[(i-1)] = {...vmList[(i-1)], zone: ""};
   	 
    	let disksList = [...this.state["disksList_"+(i)]];
    	let disksListLength = disksList.length;
    	for(let j=1; j<= disksListLength; j++){
    		if(j <= selectedSize.maxDataDiskCount){
    			if(typeof disksList[(j-1)] != 'undefined'){
    				console.log("disksList[(j-1)] ---- ", disksList[(j-1)]);
    				disksList[(j-1)] = {...disksList[(j-1)], Disk_Storage_Type: "", Disk_Storage_Size : "", Disk_Size : ""};
    			}
    			continue;
    		}
	        disksList.splice(selectedSize.maxDataDiskCount, 1);
    	}
    	
    	this.setState({ ["disksList_"+(i)] : disksList });
    }
    console.log(vmList);
    this.setState({ vmList });
  }

  resourceGroupNameChange = (val,cb) => {
	  this.setState({
		  resourceGroupName:val,
//		  galleryListData: [],
		  selected_rg_location_name : "",
//		  backup_resource_group_name:"",
//		  recoveryVaultNameData: [],
//		  recovery_vault_name:"",
//		  backupPolicyData: [],
//		  backup_policy : '',
//		  storage_resource_group_name:"",
//		  storage_account_name : "",
//		  storageAccountNames : []
	  });
	  if(!val){
        toast.error("Please Select VM Resource Group");
        return;
	  }
	  let self = this;
	  if(this.state.completeResourceGroups && this.state.completeResourceGroups.length > 0){
		  this.state.completeResourceGroups.forEach((sub, index) => {
				if(sub.name == val){
					let selected_rg_location_name = sub.location_name;
//					let backupResourceGroups = [];
//          	      	let storageResourceGroups = [];
//          	      	
//	        		for(let rg =0; rg < this.state.completeResourceGroups.length; rg++){
//	        			if(this.state.completeResourceGroups[rg].is_backup == 'Yes' && selected_rg_location_name == this.state.completeResourceGroups[rg].location_name){
//	        				backupResourceGroups.push(this.state.completeResourceGroups[rg]);
//	        			}
//	        			if(this.state.completeResourceGroups[rg].is_storage == 'Yes' && selected_rg_location_name == this.state.completeResourceGroups[rg].location_name){
//	        				storageResourceGroups.push(this.state.completeResourceGroups[rg]);
//	        			}
//	        		}
//					let backup_resource_group_name = '';
//		      		let storage_resource_group_name = '';
//		      		if(backupResourceGroups.length > 0){
//		      			backup_resource_group_name = backupResourceGroups[0].name;
//		      			this.backupResourceGroupNameChange(backup_resource_group_name);
//		      		}
//	    	      	if(storageResourceGroups.length > 0){
//	    	      		storage_resource_group_name = storageResourceGroups[0].name;
//		      			this.storageResourceGroupNameChange(storage_resource_group_name);
//		      		}
	    	      	this.setState({
//	    	      		backupResourceGroups :backupResourceGroups,
//	    	      		storageResourceGroups : storageResourceGroups,
//	    	      		backup_resource_group_name : backup_resource_group_name,
//	    	      		storage_resource_group_name : storage_resource_group_name,
	    	      		selected_rg_location_name : selected_rg_location_name
	    	      	});
	    	      	
	    	      	if(1 || this.state.DISPLAY_ALL_NETWORK_RESOURCES == 0){
	    	      		
	    	      		//To give region dropdown based on resource group selection
//	    	      		let Azure_Regions_Data = [];
//    	              	if(self.props && self.props.azure && self.props.azure.dropdownData && self.props.azure.dropdownData.Azure_Region && self.props.azure.dropdownData.Azure_Region.length > 0){
//    	  	            	for(let j =0; j < self.props.azure.dropdownData.Azure_Region.length; j++){
//    	  	                    if(self.props.azure.dropdownData.Azure_Region[j].location == selected_rg_location_name){
//    	  	                    	Azure_Regions_Data.push(self.props.azure.dropdownData.Azure_Region[j]);
//    	  	                    }
//    	  	            	}
//    	              	}
//	    	          
//    	              	this.setState({
//    	              		Azure_Regions_Data : Azure_Regions_Data
//    	              	});
//    	              	setTimeout(() => {
//    	              		if(Azure_Regions_Data.length > 0){
//    	              			self.regionChange(Azure_Regions_Data[0].key);
//    	              		}
//    	              	}, 100);
    	              	
    	                //To give multi region dropdown irrespective of the resource group selection
	    	      		var checkDropdownData = setInterval(function(){
		    	      		if(self.props && self.props.azure && self.props.azure.dropdownData && self.props.azure.dropdownData.Azure_Region && self.props.azure.dropdownData.Azure_Region.length > 0){
		    	        		clearInterval(checkDropdownData);
			    	        	setTimeout(() => {
			    	        		if(self.props.azure.dropdownData.Azure_Region.length > 0){
				    	        		self.regionChange(self.props.azure.dropdownData.Azure_Region[0].key);
			//	    	        		this.load_virtual_networks_locationwise("");
			    	        		}
			    	            }, 100);
		    	      		}
	    	      		}, 1000);
	    			}
				}
			});
	  }
	  this.getAvailabilitySetNames({resource_group: val,
	        subscription_id: this.state.subscriptionId.replace(this.state.clientid+"_","")});

//    this.setState({
//        isGalleryNameInprogress: true
//    });
//
//    var frmData={
//    	gallery_resource_group: val,
//        subscription_id: this.state.subscriptionId.replace(this.state.clientid+"_",""),
//        client_id: this.state.clientid,
//    }
//    
//    const requestOptions = {
//        method: 'POST',
//        headers: { ...authHeader(), 'Content-Type': 'application/json' },
//        body: JSON.stringify(ucpEncrypt(frmData))
//    };
//
//    fetch(`${config.apiUrl}/secureApi/azure/galleryList`, requestOptions).then(response  => {
//        response.text().then(text => {
//            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
//            
//            this.setState({
//            	isGalleryNameInprogress: false
//            });
//            if (response.ok) {
//                var result=(data.value ? data.value : data)
//                console.log("galleryList result --- ",result);
//            	if(result.status == "success"){
//                    this.setState({
//                    	galleryListData: result.data.value
//                    });
////                    if(cb != ''){
////                    	if(cb.indexOf("galleryName=") != -1){
////                    		console.log("enter  galleryName cb ");
////                    		let galleryName = cb.split("galleryName=")[1].split("&")[0];
////                    		this.galleryNameChange(galleryName,cb);
////                    	}
////                    }
//            	}else{
//            		toast.error(result.message);
//            	}
//            }
//            else{
//                toast.error("The operation did not execute as expected. Please raise a ticket to support");
//            }        
//        });
//    });
  }
  
  getAvailabilitySetNames = (params) => {
	  if(!this.state.selected_region_location_name){
		  return;
	  }
    this.setState({
    	isAvailabilitySetNameInprogress: true,
    	availabilitySetNameData : []
    });

    var frmData={
		resourceGroup: params.resource_group,
		subscriptionId: params.subscription_id,
		clientid: this.state.clientid,
		location: this.state.selected_region_location_name,
    }
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azureapi/get_availability_sets`, requestOptions).then(response  => {
        response.text().then(text => {
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
            
            this.setState({
            	isAvailabilitySetNameInprogress: false
            });
            if (response.ok) {
                var result=(data.value ? data.value : data)
                console.log("get_availability_sets result --- ",result);
            	if(result.status == "success"){
                    this.setState({
                    	availabilitySetNameData: result.data.value
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
  
  getGalleryNames = () => {
	  this.setState({
		  galleryListData: []
	  });

    this.setState({
        isGalleryNameInprogress: true
    });

    var frmData={
		client_id: this.state.clientid,
		user_role: this.state.user_role,
		provision_type:this.state.subscription_provision_type,//this.state.user_details.data.provision_type
    }
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azure/getGalleryImageVersions`, requestOptions).then(response  => {
        response.text().then(text => {
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
            
            this.setState({
            	isGalleryNameInprogress: false
            });
            if (response.ok) {
                var result=(data.value ? data.value : data)
                console.log("galleryList result --- ",result);
            	if(result.status == "success"){
                    this.setState({
                    	galleryListData: result.data
                    });
//                    if(cb != ''){
//                    	if(cb.indexOf("galleryName=") != -1){
//                    		console.log("enter  galleryName cb ");
//                    		let galleryName = cb.split("galleryName=")[1].split("&")[0];
//                    		this.galleryNameChange(galleryName,cb);
//                    	}
//                    }
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
  
  galleryNameChange = (val, cb) => {
	  this.setState({
		  gallery_name:val,
		  sharedImageNameData: [],
		  managed_infra_subscription_id : "",
		  sharedimage_resource_group_name : "",
		  shared_image_name : "",
		  shared_image_version : "",
		  sharedImageVersionData: []
	  });
      $("#shared_image_name").val("");
      $("#shared_image_version").val("");
	  if(!val){
        toast.error("Please Select Gallery Name");
        return;
	  }
	  
	  for(let i = 0; i < this.state.galleryListData.length; i++){
		  console.log("this.state.galleryListData[i].galleryName --- "+this.state.galleryListData[i].galleryName);
          if(this.state.galleryListData[i].galleryName == val){
          	console.log("enter galleryListData for loop", this.state.galleryListData[i]);
          	this.setState({
          		managed_infra_subscription_id: this.state.galleryListData[i].subscription_id,
          		sharedimage_resource_group_name : this.state.galleryListData[i].resourceGroup
              });
          }
	  }
	  
	  if(cb != ''){
      	if(cb.indexOf("osType=") != -1){
      		console.log("enter  osType cb ");
      		let osType = cb.split("osType=")[1].split("&")[0];
      		this.osTypeChange(osType,cb);
      	}
      }else{
      	if(this.state.osTypeData && this.state.osTypeData.length > 0){
    		$("#osType").val(this.state.osTypeData[0]);
    		this.osTypeChange(this.state.osTypeData[0], "");
      	}
      }

//    this.setState({
//        isSharedImageNameInprogress: true
//    });

    /*var frmData={
//    	gallery_resource_group: this.state.resourceGroupName,
//        subscription_id: this.state.subscriptionId.replace(this.state.clientid+"_",""),
        client_id: this.state.clientid,
        galleryName: val,
        user_role: this.state.user_role,
		provision_type:this.state.user_details.data.provision_type
    }
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azure/getGalleryImageVersions`, requestOptions).then(response  => {
        response.text().then(text => {
        	
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
//            this.setState({
//            	isSharedImageNameInprogress: false
//            });
            if (response.ok) {
                var result=(data.value ? data.value : data)
                console.log("galleryImagesList result --- ",result);
            	if(result.status == "success"){
//                    this.setState({
//                    	sharedImageNameData: result.data
//                    });
                    if(cb != ''){
                    	if(cb.indexOf("osType=") != -1){
                    		console.log("enter  osType cb ");
                    		let osType = cb.split("osType=")[1].split("&")[0];
                    		this.osTypeChange(osType,cb);
                    	}
                    }else{
        	        	if(result.data && result.data.length > 0){
				    		$("#osType").val(result.data[0].osType);
				    		this.osTypeChange(result.data[0].osType, "");
        	        	}
                    }
//                    if(cb != ''){
//                    	if(cb.indexOf("galleryImageName=") != -1){
//                    		console.log("enter  galleryImageName cb ");
//                    		let galleryImageName = cb.split("galleryImageName=")[1].split("&")[0];
//                    		this.sharedImageNameChange(galleryImageName,cb);
//                    	}
//                    }else{
//        	        	if(result.data && result.data.length > 0){
//				    		$("#shared_image_name").val(result.data[0].galleryImageName);
//				    		this.sharedImageNameChange(result.data[0].galleryImageName, "");
//        	        	}
//                    }
            	}else{
            		toast.error(result.message);
            	}
            }
            else{
                toast.error("The operation did not execute as expected. Please raise a ticket to support");
            }        
        });
    });*/
  }
  
  osTypeChange = (val, cb) => {
	  this.setState({
		  osType:val,
		  osMiddleware : "",
		  shared_image_name : "",
		  sharedImageNameData: [],
//		  managed_infra_subscription_id : "",
//		  sharedimage_resource_group_name : "",
		  shared_image_name : "",
		  shared_image_version : "",
		  sharedImageVersionData: []
	  });
      $("#osMiddleware").val("");
      $("#shared_image_name").val("");
      $("#shared_image_version").val("");
	  /*if(!val){
        toast.error("Please Select OS Type");
        return;
	  }*/
	  
	  /*for(let i = 0; i < this.state.galleryListData.length; i++){
      	console.log("this.state.galleryListData[i].galleryName --- "+this.state.galleryListData[i].galleryName);
          if(this.state.galleryListData[i].galleryName == val){
          	console.log("enter galleryListData for loop");
          	this.setState({
          		managed_infra_subscription_id: this.state.galleryListData[i].subscription_id,
          		sharedimage_resource_group_name : this.state.galleryListData[i].resourceGroup
              });
          }
  	}*/

    this.setState({
    	isOsMiddlewareInprogress: true
    });

    var frmData={
//    	gallery_resource_group: this.state.resourceGroupName,
//        subscription_id: this.state.subscriptionId.replace(this.state.clientid+"_",""),
        client_id: this.state.clientid,
        galleryName: this.state.gallery_name,
        user_role: this.state.user_role,
		provision_type:this.state.subscription_provision_type,//this.state.user_details.data.provision_type,
		osType:val
    }
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azure/getGalleryOsMiddleware`, requestOptions).then(response  => {
        response.text().then(text => {
        	
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
            this.setState({
            	isOsMiddlewareInprogress: false
            });
            if (response.ok) {
                var result=(data.value ? data.value : data)
                console.log("getGalleryOsMiddleware result --- ",result);
            	if(result.status == "success"){
                    this.setState({
                    	osMiddlewareData: result.data
                    });
                    if(cb != ''){
                    	if(cb.indexOf("dbType=") != -1 && cb.indexOf("middleWare=") != -1){
                    		console.log("enter  dbType middleWare cb ");
                    		let dbType = cb.split("dbType=")[1].split("&")[0];
                    		let middleWare = cb.split("middleWare=")[1].split("&")[0];
                    		this.osMiddlewareChange(dbType+"@$"+middleWare,cb);
                    	}
                    }else{
        	        	if(result.data && result.data.length > 0){
				    		$("#shared_image_name").val(result.data[0].key);
				    		this.osMiddlewareChange(result.data[0].key, "");
        	        	}
                    }
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
  
  osMiddlewareChange = (val, cb) => {
	  this.setState({
		  osMiddleware:val,
		  shared_image_name : "",
		  sharedImageNameData: [],
//		  managed_infra_subscription_id : "",
//		  sharedimage_resource_group_name : "",
		  shared_image_name : "",
		  shared_image_version : "",
		  sharedImageVersionData: []
	  });
      $("#shared_image_name").val("");
      $("#shared_image_version").val("");
	  /*if(!val){
        toast.error("Please Select OS Type");
        return;
	  }*/
	  
	  /*for(let i = 0; i < this.state.galleryListData.length; i++){
      	console.log("this.state.galleryListData[i].galleryName --- "+this.state.galleryListData[i].galleryName);
          if(this.state.galleryListData[i].galleryName == val){
          	console.log("enter galleryListData for loop");
          	this.setState({
          		managed_infra_subscription_id: this.state.galleryListData[i].subscription_id,
          		sharedimage_resource_group_name : this.state.galleryListData[i].resourceGroup
              });
          }
  	}*/

    this.setState({
        isSharedImageNameInprogress: true
    });

    var frmData={
//    	gallery_resource_group: this.state.resourceGroupName,
//        subscription_id: this.state.subscriptionId.replace(this.state.clientid+"_",""),
        client_id: this.state.clientid,
        galleryName: this.state.gallery_name,
        user_role: this.state.user_role,
		provision_type:this.state.subscription_provision_type,//this.state.user_details.data.provision_type,
		osType:this.state.osType,
		osMiddleware: val
    }
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azure/getGalleryImageVersions`, requestOptions).then(response  => {
        response.text().then(text => {
        	
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
            this.setState({
            	isSharedImageNameInprogress: false
            });
            if (response.ok) {
                var result=(data.value ? data.value : data)
                console.log("galleryImagesList result --- ",result);
            	if(result.status == "success"){
                    this.setState({
                    	sharedImageNameData: result.data
                    });
                    if(cb != ''){
                    	if(cb.indexOf("galleryImageName=") != -1){
                    		console.log("enter  galleryImageName cb ");
                    		let galleryImageName = cb.split("galleryImageName=")[1].split("&")[0];
                    		this.sharedImageNameChange(galleryImageName,cb);
                    	}
                    }else{
        	        	if(result.data && result.data.length > 0){
				    		$("#shared_image_name").val(result.data[0].galleryImageName);
				    		this.sharedImageNameChange(result.data[0].galleryImageName, "");
        	        	}
                    }
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
  
  sharedImageNameChange = (val,cb) => {
	  this.setState({
		  shared_image_name:val,
		  sharedImageVersionData: [],
	  	  shared_image_version : "",
	  	  shared_image_tags : {},
	  	  shared_image_version_tags : {},
	  	  HyperVGenerations: "",
	  	  isAdditionalDiskRequired : false,
	  });
      $("#shared_image_version").val("");
	  if(!val){
        toast.error("Please Select Shared Image Name");
        return;
	  }

    this.setState({
        isSharedImageVersionInprogress: true
    });

    var frmData={
//    	gallery_resource_group: this.state.resourceGroupName,
//        subscription_id: this.state.subscriptionId.replace(this.state.clientid+"_",""),
        client_id: this.state.clientid,
        galleryName: this.state.gallery_name,
        galleryImageName: val,
        user_role: this.state.user_role,
		provision_type:this.state.subscription_provision_type,//this.state.user_details.data.provision_type,
		osType:this.state.osType,
		osMiddleware: this.state.osMiddleware
    }
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azure/getGalleryImageVersions`, requestOptions).then(response  => {
        response.text().then(text => {
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
            
            this.setState({
            	isSharedImageVersionInprogress: false
            });
            if (response.ok) {
                var result=(data.value ? data.value : data)
                console.log("galleryImageVersionList result --- ",result);
            	if(result.status == "success"){
                    this.setState({
                    	sharedImageVersionData: result.data
                    });
                    if(cb != ''){
                    	if(cb.indexOf("galleryImageVersionName=") != -1){
                    		console.log("enter  galleryImageVersionName cb ");
                    		let galleryImageVersionName = cb.split("galleryImageVersionName=")[1].split("&")[0];
                    		this.sharedImageVersionChange(galleryImageVersionName,cb);
                    	}
                    }else{
        	        	if(result.data && result.data.length > 0){
				    		$("#shared_image_version").val(result.data[0].galleryImageVersionName);
				    		this.sharedImageVersionChange(result.data[0].galleryImageVersionName, "");
        	        	}
                    }
            	}else{
            		toast.error(result.message);
            	}
            }
            else{
                toast.error("The operation did not execute as expected. Please raise a ticket to support");
            }        
        });
    });
    
    
    let os_price = 0,
    storageAccountType = "",
    locationName = "",
    disksize="",
    HyperVGenerations = '',
    osTemplateValue = "",
    osTemplateName = val;
    console.log("osTemplateValue --- "+osTemplateValue);
    console.log("osTemplateName --- "+osTemplateName);

    if(osTemplateName){
        for(let i = 0; i < this.state.sharedImageNameData.length; i++){
//        	console.log("this.state.sharedImageNameData[i].galleryImageName --- "+this.state.sharedImageNameData[i].galleryImageName);
            if(this.state.sharedImageNameData[i].galleryImageName == osTemplateName){
//            	console.log("enter os for loop");
            	let image_response_obj = JSON.parse(this.state.sharedImageNameData[i].image_response_obj);
            	this.setState({
            		os_type: this.state.sharedImageNameData[i].osType,
            		shared_image_tags : ((image_response_obj && image_response_obj.tags)?image_response_obj.tags:{})
                });
            	if(image_response_obj && image_response_obj.tags 
            			&& image_response_obj.tags['UCP-Cluster']
            			&& image_response_obj.tags['UCP-Cluster'] == 'Yes'){
            		this.vmSelectionImageChange({name:"vm_selection", value:"Clustering"});
            		$("#vm_selection_clustering").attr({"disabled":false});
            		$("#vm_selection_quantity").attr({"disabled":true});
            	}else{
            		this.vmSelectionImageChange({name:"vm_selection", value:"Quantity"});
            		$("#vm_selection_clustering").attr({"disabled":true});
            		$("#vm_selection_quantity").attr({"disabled":false});
            	}
            	if(image_response_obj && image_response_obj.tags 
            			&& image_response_obj.tags['UCP-OS-Disk-Size']){
            		disksize = image_response_obj.tags['UCP-OS-Disk-Size'];
            	}else{
            		disksize = this.state.sharedImageNameData[i].diskSizeGB;
            	}
            	if(image_response_obj && image_response_obj.tags 
            			&& image_response_obj.tags['UCP-HyperVGenerations']){
            		HyperVGenerations = image_response_obj.tags['UCP-HyperVGenerations'];
            	}
            	
            	if(image_response_obj && image_response_obj.tags 
            		&& image_response_obj.tags['UCP-Data-Disk-Required']
            		&& image_response_obj.tags['UCP-Data-Disk-Required'] == 'Yes'
            	){
            		this.setState({
            			isAdditionalDiskRequired : true
                    });
            	}
//            	console.log("image_response_obj.tags --- ", ((image_response_obj && image_response_obj.tags)?image_response_obj.tags:""));
//            	console.log("disksize --- ", disksize);
            	
                os_price = 0;//this.state.osTemplate[i].price;
                locationName = this.state.sharedImageNameData[i].location;
//                console.log("this.state.sharedImageNameData[i] --- "+JSON.stringify(this.state.sharedImageNameData[i]));
//                console.log("locationName --- "+locationName);
            }
        }
    }
    else{
        this.setState({
            disk_price: 0,
            os_type : ""
        });
    }
    
    this.setState({
        os_template_id: osTemplateValue,
        os_template_name: osTemplateName,
        os_price: os_price,
        storageAccountType: storageAccountType,
        locationName:locationName,
        disksize:disksize,
        HyperVGenerations,
    });
    
    setTimeout(() => {
		this.changeSubnetData();
    }, 100);
  }
  
  sharedImageVersionChange = (val,cb) => {
	  this.setState({
		  shared_image_version:val,
		  shared_image_version_tags : {}
	  });
	  if(!val){
        toast.error("Please Select Shared Image Version");
        return;
	  }
	  
	    let storageAccountType = "";
//	    var disksize="";
	    let locationName = "";
	    let resourceGroupName = "";

	    if(val){
	        for(let i = 0; i < this.state.sharedImageVersionData.length; i++){
	        	console.log("this.state.sharedImageVersionData[i].galleryImageVersionName --- "+this.state.sharedImageVersionData[i].galleryImageVersionName);
	            if(this.state.sharedImageVersionData[i].galleryImageVersionName === val){
	                storageAccountType = this.state.sharedImageVersionData[i].storageAccountType;
	                locationName = this.state.locationName;
//	                disksize=this.state.sharedImageVersionData[i].diskSizeGB;
	                resourceGroupName=this.state.resourceGroupName;
	                
	                let version_response_obj = JSON.parse(this.state.sharedImageVersionData[i].version_response_obj);
	            	this.setState({
	            		shared_image_version_tags : ((version_response_obj && version_response_obj.tags)?version_response_obj.tags:{})
	                });
	            	setTimeout(() => {
	            		console.log("this.state.shared_image_version_tags --- ", this.state.shared_image_version_tags);
	                }, 200);
	            }
	        }
	    }
	    else{
	        this.setState({
	            disk_price: 0,
	            os_type : ""
	        });
	    }
	    
	    this.setState({
	        storageAccountType: storageAccountType,
//	        disksize:disksize
	    });
  }
  
  getbackupResourceGroupNameChange() {
    var frmData={
        clientid: this.state.clientid
            }
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azure/getAllAzureResourceGroups`, requestOptions).then(response  => {
        response.text().then(text => {
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
            if (response.ok) {
                var result=(data.value ? data.value : data)
                this.setState({networkResourceGroup:result })
            }
            else{
                toast.error("The operation did not execute as expected. Please raise a ticket to support");
            }        
        });
    });

  }
  backupResourceGroupNameChange = (val) => {
	  this.setState({
		  backup_resource_group_name:val,
		  recoveryVaultNameData: [],
		  recovery_vault_name:"",
		  backupPolicyData: [],
		  backup_policy : ''
	  });
	  if(!val){
        toast.error("Please Select Backup Resource Group Name");
        return;
	  }

    this.setState({
    	isRecoveryVaultNameInprogress: true
    });

    var frmData={
        subscription_id: this.state.subscriptionId.replace(this.state.clientid+"_",""),
        client_id: this.state.clientid,
        backup_resource_group_name: val
    }
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData)),
    };

    fetch(`${config.apiUrl}/secureApi/azure/getVmBackupVaultNames`, requestOptions).then(response  => {
        response.text().then(text => {
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
            
            this.setState({
            	isRecoveryVaultNameInprogress: false
            });
            if (response.ok) {
                var result=(data.value ? data.value : data)
                console.log("getVmBackupVaultNames result --- ",result);
            	if(result.status == "success"){
                    this.setState({
                    	recoveryVaultNameData: result.data.value
                    });
                    if(result.data && result.data.value && result.data.value.length > 0){
                    	this.recoveryVaultNameChange(result.data.value[0].name);
                    }
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
  
  storageResourceGroupNameChange = (val) => {
	  this.setState({
		  storage_resource_group_name:val,
		  storage_account_name : "",
		  storageAccountNames : []
	  });
	  if(!val){
        toast.error("Please Select Storage Resource Group Name");
        return;
	  }

    this.setState({
    	isStorageAccountNameInprogress: true
    });

    var frmData={
        subscription_id: this.state.subscriptionId.replace(this.state.clientid+"_",""),
        client_id: this.state.clientid,
        storage_resource_group_name: val
    }
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData)),
    };

    fetch(`${config.apiUrl}/secureApi/azure/getStorageAccountNames`, requestOptions).then(response  => {
        response.text().then(text => {
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
            
            this.setState({
            	isStorageAccountNameInprogress: false
            });
            if (response.ok) {
                var result=(data.value ? data.value : data)
                console.log("getStorageAccountNames result --- ",result);
            	if(result.status == "success"){
                    this.setState({
                    	storageAccountNames: result.data.value
                    });
                    if(result.data && result.data.value && result.data.value.length > 0){
                    	this.setState({
                    		storage_account_name: result.data.value[0].name
                        });
                    }
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
  
  recoveryVaultNameChange = (val) => {
	  this.setState({
		  recovery_vault_name:val,
		  backupPolicyData: [],
		  backup_policy : '',
		  recovery_vault_name_tags : {}
	  });
	  if(!val){
        toast.error("Please Select Backup Vault Name");
        return;
	  }

	  let recovery_vault_name_tags = {};
	  for(let i = 0; i < this.state.recoveryVaultNameData.length; i++){
		  console.log("this.state.recoveryVaultNameData[i].name --- ", this.state.recoveryVaultNameData[i].name);
          if(this.state.recoveryVaultNameData[i].name == val){
          	console.log("enter os for loop");
          	recovery_vault_name_tags = this.state.recoveryVaultNameData[i].tags;
          	this.setState({
          		recovery_vault_name_tags
            });
          }
	  }
	  console.log("recovery_vault_name_tags --- ", recovery_vault_name_tags);
    this.setState({
    	isBackupPolicyInprogress: true
    });

    var frmData={
		backup_resource_group_name: this.state.backup_resource_group_name,
        subscription_id: this.state.subscriptionId.replace(this.state.clientid+"_",""),
        client_id: this.state.clientid,
        recovery_vault_name: val
    }
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData)),
    };

    fetch(`${config.apiUrl}/secureApi/azure/getVmBackupVaultPolicies`, requestOptions).then(response  => {
        response.text().then(text => {
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
            
            this.setState({
            	isBackupPolicyInprogress: false
            });
            if (response.ok) {
                var result=(data.value ? data.value : data)
                console.log("getVmBackupVaultPolicies result --- ",result);
            	if(result.status == "success"){
                    this.setState({
                    	backupPolicyData: result.data.value
                    });
                    if(result.data && result.data.value && result.data.value.length > 0){
                    	setTimeout(() => {
                    		this.backupPolicyChange(result.data.value[0].name);
                        }, 500);
                    }
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
  
  backupPolicyChange = (val) => {
	  this.setState({
		  backup_policy:val
	  });
	  if(this.state.recovery_vault_name_tags && this.state.recovery_vault_name_tags["UCP-"+val]){
		  this.setState({
			  Netbackup_policy:this.state.recovery_vault_name_tags["UCP-"+val]
		  });
	  }else{
		  this.setState({
			  Netbackup_policy : ""
		  });
	  }
	  
	  setTimeout(() => {
		  let db_full_backup = "", db_log_backup = "", db_backup = "", db_backup2 = "";
		  if(this.state.recovery_vault_name_tags 
	      		&& Object.keys(this.state.recovery_vault_name_tags).length > 0){
		    	if(this.state.shared_image_tags['UCP-DB-Type'] && this.state.recovery_vault_name_tags["UCP-"+this.state.shared_image_tags['UCP-DB-Type']+"-Full-"+this.state.backup_policy]){
		    		db_full_backup = this.state.recovery_vault_name_tags["UCP-"+this.state.shared_image_tags['UCP-DB-Type']+"-Full-"+this.state.backup_policy];
		    	}
		    	if(this.state.shared_image_tags['UCP-DB-Type'] && this.state.recovery_vault_name_tags["UCP-"+this.state.shared_image_tags['UCP-DB-Type']+"-Log-"+this.state.backup_policy]){
		    		db_log_backup = this.state.recovery_vault_name_tags["UCP-"+this.state.shared_image_tags['UCP-DB-Type']+"-Log-"+this.state.backup_policy];
		    	}
		    	if(this.state.shared_image_tags['UCP-DB-Type'] && this.state.recovery_vault_name_tags["UCP-"+this.state.shared_image_tags['UCP-DB-Type']+"-"+this.state.backup_policy]){
		    		db_backup = this.state.recovery_vault_name_tags["UCP-"+this.state.shared_image_tags['UCP-DB-Type']+"-"+this.state.backup_policy];
		    	}
		    	if(this.state.shared_image_tags['UCP-DB-Type'] && this.state.recovery_vault_name_tags["UCP-"+this.state.shared_image_tags['UCP-DB-Type']+"-group-"+this.state.backup_policy]){
		    		db_backup2 = this.state.recovery_vault_name_tags["UCP-"+this.state.shared_image_tags['UCP-DB-Type']+"-group-"+this.state.backup_policy];
		    	}
	  	  }
		  this.setState({
			  db_full_backup, 
			  db_log_backup, 
			  db_backup,
			  db_backup2
		  });
	  }, 200);
	  if(!val){
        toast.error("Please Select Backup Policy");
        return;
	  }
  }

  virtualNetworkChange = (virtualNetworkName) => {
    this.setState(
        {
            selectedVirtualNetwork: virtualNetworkName,
//            Azure_Regions_Data : [],
//            selected_region : "",
//            domain_extension : '',
            subnets: []
        }
    );
//    $("#region").val("");
    var form = document.querySelector("#saveOrderInfoFrm");
    var formData = serialize(form, { hash: true });
    console.log("formData -- ",formData);
    let self = this;
    if(virtualNetworkName){
        let subnet = [];
//        let Azure_Regions_Data = [];
        
//        let network_identify_arr = ["unclassified","classified"];
//        for(let i =0; i < this.state.virtualNetwork.length; i++){
//            if(this.state.virtualNetwork[i].name == virtualNetworkName){
//            	if(self.props && self.props.azure && self.props.azure.dropdownData && self.props.azure.dropdownData.Azure_Region && self.props.azure.dropdownData.Azure_Region.length > 0){
//	            	for(let j =0; j < self.props.azure.dropdownData.Azure_Region.length; j++){
//	                    if(self.props.azure.dropdownData.Azure_Region[j].location == this.state.virtualNetwork[i].location){
//	                    	Azure_Regions_Data.push(self.props.azure.dropdownData.Azure_Region[j]);
//	                    	$("#region").val(self.props.azure.dropdownData.Azure_Region[j].key);
//	                    	console.log("selected_ansible_server ---- ", self.props.azure.dropdownData.Azure_Region[j]['ansible-server']);
//	                    	this.setState({
//	                    		selected_region : self.props.azure.dropdownData.Azure_Region[j].value,
//	                    		domain_extension : self.props.azure.dropdownData.Azure_Region[j].domain,
//	                    		selected_ansible_server : self.props.azure.dropdownData.Azure_Region[j]['ansible-server']
//	                    	});
//	                    }
//	            	}
//            	}
////            	for(let j =0; j < this.state.virtualNetwork[i].properties.subnets.length; j++){
////                    if(this.state.virtualNetwork[i].properties.subnets[j].name.toLowerCase().indexOf(network_identify_arr[formData.network_identify]) == 0){
////                    	subnet.push(this.state.virtualNetwork[i].properties.subnets[j]);
////                    }
////            	}
//                break;
//            }
//        }
        
        this.setState({
//            subnets: subnet,
//            Azure_Regions_Data : Azure_Regions_Data
        });
        setTimeout(() => {
//        	if(Azure_Regions_Data.length > 0){
//            	$("#region").val(Azure_Regions_Data[0].key);
//            }
        }, 10);
        
        setTimeout(() => {
    		this.changeSubnetData();
        }, 200);
    }
    else{
        this.setState({
            subnets: []
        });
    }
  }
  
  subnetChange= (subnetName) => {
    this.setState({
        selectedSubnet: subnetName,
        availableIpsCount : 0
    });
    let availableIpsCount = 0;
    console.log("availableIpsCount 1 --- ", availableIpsCount);
    if(subnetName){
		for(let i =0; i < this.state.subnets.length; i++){
			if(this.state.subnets[i].name == subnetName 
					&& this.state.subnets[i].properties 
					&& this.state.subnets[i].properties.addressPrefix){
				let splitAddress = this.state.subnets[i].properties.addressPrefix.split("/") 
			    availableIpsCount = Math.pow(2, (32 - splitAddress[1])) - 5 - ((this.state.subnets[i].properties.ipConfigurations)?this.state.subnets[i].properties.ipConfigurations.length:0);
				this.setState({
			        availableIpsCount : availableIpsCount
			    });
				break;
	    	}
	    }
		console.log("availableIpsCount 2 --- ", availableIpsCount);
//	    foreach( $subnet in $subnets)
//	    {
//	    $subnet.Name
//	    $subnet.IpConfigurations.Count
//	    $subnet.AddressPrefix
//	    }
//	
//	    $splitAddress = $subnet.AddressPrefix.Split("/") 
//	    $output = [math]::Pow(2, (32 - $splitAddress[1])) - 5 - $subnet.IpConfigurations.Count
    }
  }

  publicIpAddressNameChange = (publicIpAddressName) => {
    if(publicIpAddressName){ 
        this.setState({
            selectedPublicIp:publicIpAddressName
        });
    }
  }

  networkInterfaceChange = (value) => {
    this.setState({
        selectedNIC: value
    });
  }
  
  generateNICClick(){
    
    
    if(!this.state.choosenNICName){
        toast.error("Please choose valid NIC Name");
        return;
    }
    
    this.setState({
        isGenerateNICInprogress: true
    });

    var frmData={
        resourceGroup: this.state.resourceGroupName,
        subscriptionId: this.state.subscriptionId.replace(this.state.clientid+"_",""),
        clientid: this.state.clientid,
        networkInterface: this.state.choosenNICName + "-nic",
        publicIpAddressName: this.state.selectedPublicIp,
        virtualNetwork: this.state.selectedVirtualNetwork,
        configName: this.state.choosenNICName + "-config",
        subnetName: this.state.selectedSubnet,
        location: this.state.selected_network_location_name
    }
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/azureapi/create_nic `, requestOptions).then(response  => {
        response.text().then(text => {
            
                    
            this.setState({
                isGenerateNICInprogress: false
            });
            
            var data = text && JSON.parse(text);
            if (response.ok) {
                var result=(data.value ? data.value : data)
                if(result.error){          
                    toast.error("Unable generate NIC, Please choose another Public IP.");
                    //selectedNIC
                } else {   
                    toast.success("Generated NIC Successfully !");

                    let niclist = this.state.niclist;
                    niclist.push(result);
                    this.setState({
                        niclist: niclist,
                        selectedNIC: result.name,
                        choosenNICName: ""
                    });
                    this.generateNICPopupCloseModal();

                    setTimeout(() => {
                        $("#networkInterface").val(result.name);
                        toast.info("Newly generated NIC has been auto-selected !");
                    }, 1000);
                }
            }
            else{
                toast.error("Unable generate NIC, Please check selection.");
            }        
        });
    });
  }

  getAzureOSTemplate(frmData) {
    
    frmData.currency_id = this.state.user_details.data.currency_id;
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azureapi/os_templates`, requestOptions).then(response  => this.handleResponse(response, "osTemplate"));
  }
  
  getAzureVMSize(frmData) {
    
    frmData.currency_id = this.state.user_details.data.currency_id;
    frmData.shared_image_tags = this.state.shared_image_tags;
    frmData.environment = this.state.environment;
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    this.setState({
        isVmSizeListLoading: true
    });

    fetch(`${config.apiUrl}/secureApi/azureapi/vm_sizes`, requestOptions).then(response  => this.vmSizeHandleResponse(response, "vmSize"));
  }

  updateVmSize(){
    let rows = [];

    let data = this.state.vmSize_backup_list;

    for(let num = 0; num < data.length; num++){
        let row = data[num];
        
        rows.push({
            action: <input id={"radioVmSize" + num} checked={(row.name == this.state.vm_size_name ?  true : false)} onChange={e => this.vm_size_Change(
            		{id : "radioVmSize" + num, 
            			vm_size_name : row.name, 
            			vm_cpus : row.numberOfCores, 
            			vm_ram : row.memoryInMB, 
            			maxDataDiskCount : row.maxDataDiskCount, 
            			vm_price  : row.price, 
            			PremiumIO : row.PremiumIO, 
            			AcceleratedNetworkingEnabled : row.AcceleratedNetworkingEnabled, 
            			zones : row.zones
            		})}
            style={{ height: '20px', width: '20px'}} type="radio" name="vm_size_popup" value={row.name} />,
            name: row.name,
            numberOfCores: row.numberOfCores,
            maxDataDiskCount: row.maxDataDiskCount,
            memoryInMB: (row.memoryInMB ? (row.memoryInMB >= 1024 ? row.memoryInMB/1024 : row.memoryInMB) : "0") + (row.memoryInMB >= 1024 ? " GB" : " MB"),
            AcceleratedNetworkingEnabled: row.AcceleratedNetworkingEnabled,
            PremiumIO : ((row.PremiumIO == 'True')?"Supported": "Not Supported"),
            EphemeralOSDiskSupported : row.EphemeralOSDiskSupported,
//            price: commonFns.fnFormatCurrency(Number(row.price))
        });
    }
    
    this.setState({
        vmSize: {
            columns: [
            {
                label: '',
                field: 'action'
            },
            {
                label: 'VM Size',
                field: 'name',
            },
            {
                label: 'CPU Core',
                field: 'numberOfCores'
            },
            {
                label: 'RAM',
                field: 'memoryInMB'
            },
            {
                label: 'Max Disks',
                field: 'maxDataDiskCount'
            },
            {
                label: 'Accelerated Networking Enabled',
                field: 'AcceleratedNetworkingEnabled'
            },
            {
                label: 'Premium IO',
                field: 'PremiumIO'
            },
            {
                label: 'EphemeralOSDiskSupported',
                field: 'EphemeralOSDiskSupported'
            },
//            {
//                label: 'Price',
//                field: 'price'
//            }
        ],
        rows: rows
        }
    });
  }
  
  vmSizeHandleResponse(response, stateName) {
    return response.text().then(text => {
        let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if (!response.ok) {
            this.setState({
                [stateName]: [],
                vmSize_backup_list: []
            });
        }
        else{            
            data = (data.value ? data.value : data);

            this.setState({
                [stateName]: [],
                vmSize_backup_list: data
            });

            setTimeout(() => {
                this.updateVmSize();
            }, 10);

        }

        this.setState({
            isVmSizeListLoading: false
        });
    });
  }
  load_virtual_networks_locationwise(networkResourceGroupName){
	  console.log("networkResourceGroupName -- ",networkResourceGroupName);
	  console.log("this.state.selected_region_location_name -- ",this.state.selected_region_location_name);
//	  this.setState({
//		  selected_region : ""
//	    });
//	  $("#region").val("");
	  if(!networkResourceGroupName){
		  var form = document.querySelector("#saveOrderInfoFrm");
	      var formData = serialize(form, { hash: true });
	      console.log("formData -- ",formData);
	      networkResourceGroupName = formData.networkResourceGroupName;
	  }
	  console.log("networkResourceGroupName -- ",networkResourceGroupName);
	  if(networkResourceGroupName && this.state.resourceGroupName != ''){
//		  if(!this.state.selected_rg_location_name){
//	          toast.error("Please select VM Resource Group");
//	          return;
//	      }
		  if(!this.state.selected_region_location_name){
	          toast.error("Please select Region");
	          return;
	      }
		  
		  this.virtual_networks_locationwise({
			  clientid:this.state.clientid,
			  subscriptionId:this.state.subscriptionId.replace(this.state.clientid+"_",""),
		      resourceGroup : networkResourceGroupName,
		      location:this.state.selected_region_location_name
	      });
	  }
  }
  virtual_networks_locationwise(frmData) {
	this.setState({
		virtualNetwork: [],
		virtualNetworkInProgress: true
    });
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azureapi/virtual_networks_locationwise`, requestOptions).then(response  => this.handleResponse(response, "virtualNetwork"));
  }
  
  getAzurePublicIps(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azureapi/public_ips`, requestOptions).then(response  => this.handleResponse(response, "publicIps"));
  }
  nic_list(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azureapi/nic_list`, requestOptions).then(response  => this.handleResponse(response, "niclist"));
  }
  
  handleResponse(response, stateName) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        if (!response.ok) {
            //
        }
        else{
          this.setState({
            [stateName]: (data.value ? data.value : data)
          })
          if(stateName == 'virtualNetwork'){
        	  this.setState({
	        		virtualNetworkInProgress: false
	          });
        	  setTimeout(() => {
        		  if(this.state.virtualNetwork && this.state.virtualNetwork.length > 0){
			    		$("#virtualNetwork").val(this.state.virtualNetwork[0].name);
			    		this.virtualNetworkChange(this.state.virtualNetwork[0].name);
			    		this.setState({
			    			selected_network_location_name : this.state.virtualNetwork[0].location
			          });
        		  }
        	  }, 1000);
          }
          //return data;
        }        
    });
  }

  componentDidMount() {
    this.fetchPriceForVolume();
    this.props.dispatch(azureActions.getAzureSubscriptions({clientid:this.state.clientid, user_role: this.state.user_role, provision_type:this.state.user_details.data.provision_type}));
    this.props.dispatch(azureActions.getAzureDropdownData({clientid:this.state.clientid}));
    this.getGalleryNames();
    this.getBuList();
    this.getCmdbCountries();
    this.getCmdbImpacts();
				this.getCmdbServices();
				this.getCaptcha();
    this.getbackupResourceGroupNameChange();
    
    let self = this;
    let hrefurl = window.location.href;
    var subsInt = setInterval(function(){
    	console.log(self.state.azure);
    	console.log(self.props.azure);
    	console.log("entered --- ", ((self.props && self.props.azure && self.props.azure.subscription_list)?self.props.azure.subscription_list.length:""));
    	if(self.props && self.props.azure && self.props.azure.subscription_list && self.props.azure.subscription_list.length > 0){
    		clearInterval(subsInt);
    		setTimeout(() => {
    			self.props.azure.subscription_list.forEach((sub, index) => {
    				if(sub.subscription_id == self.state.selected_subscription_id){
//    					selected_sub_found = true;
    					self.subscriptionChange(self.state.clientid+"_"+self.state.selected_subscription_id, hrefurl);
    				}
    			});
              }, 1000);
    	}
    }, 1000);
    
    var dropdownData = setInterval(function(){
    	console.log(self.state.azure);
    	console.log(self.props.azure);
    	console.log("entered --- ", ((self.props && self.props.azure && self.props.azure.dropdownData && self.props.azure.dropdownData.Azure_Region)?self.props.azure.dropdownData.Azure_Region.length:""));
    	if(self.props && self.props.azure && self.props.azure.dropdownData && self.props.azure.dropdownData.Azure_Region && self.props.azure.dropdownData.Azure_Region.length > 0){
    		clearInterval(dropdownData);
    		setTimeout(() => {
//    			if(self.props.azure.dropdownData.Azure_Region.length > 0){
//    				this.regionChange(self.props.azure.dropdownData.Azure_Region[0].key);
//    			}
//    			if(this.state.DISPLAY_ALL_NETWORK_RESOURCES == 0){
//    				
//    			}else{
//    				self.load_virtual_networks_locationwise("");
//    			}
    			self.setState({
    				Azure_Regions_Data: self.props.azure.dropdownData.Azure_Region
		        });
//		        $("#environment").val("Test");
    			$("#network_identify").val("1");
              }, 1000);
    	}
    }, 1000);
  }

  fetchPriceForVolume(){
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt({"cloud_type" : "Azure", "addon_name" : "storage", "currency_id" : this.state.user_details.data.currency_id}))
    };

    fetch(`${config.apiUrl}/secureApi/orders/getAddonPrice`, requestOptions).then(response  => this.handlePriceResponse(response));
  }

  handlePriceResponse(response, stateName, isLoading) {
    return response.text().then(text => {
        
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if(data && data.data && data.data[0] && data.data[0].price){
          this.setState({
            priceFor1GBDisk: data.data[0].price
          });
        }

        this.setState({
          isCurrentPriceLoading: false
        })
    });
  }

  bindField(e){    
    if(e.target.name == "disk_new_size_GB"){
        let value = e.target.value;
        let charCode = value.charCodeAt(value.length - 1);
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
    }else if(e.target.name == "vm_selection"){
    	if(e.target.value == 'Quantity'){
    		this.setState({vm_count:1, availability_set_or_zone : "Zone", vm_count_arr : [1,2,3,4,5,6,7,8,9,10], availability_set_name : ""});
    		//vm_count
    		$("#vm_count").val("1");
    	}else if(e.target.value == 'Clustering'){
    		this.setState({vm_count:2, availability_set_or_zone : "Zone", vm_count_arr : [2], availability_set_name : ""});
    		$("#vm_count").val("2");
    	}
    }
    
//    console.log("e.target.name -- "+e.target.name+" --- e.target.value -- "+e.target.value);
//    console.log(this.state[e.target.name]);

    let target_name = e.target.name;
    let target_value = e.target.value;
    this.setState({
        [target_name]: target_value
    })
    setTimeout(() => {
	    console.log(this.state[target_name]);
    }, 100);
    
    if(e.target.name == "vm_selection" || e.target.name == "vm_count"){
	    setTimeout(() => {
		    let vmList = [];
		    for(let i=0;i<this.state.vm_count;i++){
		    	vmList.push(Object.assign({},this.state.vmListInit,{disksListId:"disksList_"+(i+1)}));
		    	if(this.state.isAdditionalDiskRequired){
		    		this.setState({["disksList_"+(i+1)] : this.state.disksListInit});
		    	}else{
		    		this.setState({["disksList_"+(i+1)] : []});
		    	}
		    }
		    this.setState(prevState => ({ 
		    	vmList: vmList
		    }));
	    }, 200);
    }
  }
  
  vmSelectionImageChange(e){    
    if(e.name == "vm_selection"){
    	if(e.value == 'Quantity'){
    		this.setState({vm_count:1, availability_set_or_zone : "Zone",vm_count_arr : [1,2,3,4,5,6,7,8,9,10]});
    		//vm_count
    		$("#vm_count").val("1");
    	}else if(e.value == 'Clustering'){
    		this.setState({vm_count:2, availability_set_or_zone : "Zone",vm_count_arr : [2]});
    		$("#vm_count").val("2");
    	}
    }
    
//	    console.log("e.name -- "+e.name+" --- e.value -- "+e.value);
//	    console.log(this.state[e.name]);

    let target_name = e.name;
    let target_value = e.value;
    this.setState({
        [target_name]: target_value
    })
    setTimeout(() => {
	    console.log(this.state[target_name]);
    }, 100);
    
    if(e.name == "vm_selection"){
	    setTimeout(() => {
		    let vmList = [];
		    for(let i=0;i<this.state.vm_count;i++){
		    	vmList.push(Object.assign({},this.state.vmListInit,{disksListId:"disksList_"+(i+1)}));
		    	if(this.state.isAdditionalDiskRequired){
		    		this.setState({["disksList_"+(i+1)] : this.state.disksListInit});
		    	}else{
		    		this.setState({["disksList_"+(i+1)] : []});
		    	}
		    }
		    this.setState(prevState => ({ 
		    	vmList: vmList
		    }));
	    }, 200);
    }
  }

  vmNameChange(vm, e){
    let val = e.target.value;
    var letterNumber = /^[0-9a-zA-Z]+$/;
    if(val == ""){
        this.setState({
            vm_name: ""
        });
        let vmList = [...this.state.vmList];
  	  	vmList[vm] = {...vmList[vm], vm_name: "", selectedNIC:"-nic"};
  	  	this.setState({ vmList });
    }
    else if((val.match(letterNumber))){
//        this.setState({
//            vm_name: val,
////            Disk_Name_1:val+"-disk1",
////            Disk_Name_2:val+"-disk2",
//            selectedNIC:val+"-nic"
//        })
        
        let vmList = [...this.state.vmList];
  	  	vmList[vm] = {...vmList[vm], vm_name: val, selectedNIC:val+"-nic"};
  	  	this.setState({ vmList });
    }
  }

  vmNameBlur(vm){
      setTimeout(() => {
    	  let vmList = [...this.state.vmList];
    	  vmList[vm] = {...vmList[vm], vmNameValidate: "checking"};
    	  this.setState({ vmList });
//        this.setState({
//            vmNameValidate: "checking"
//        });
      }, 0);

      let validationName = "";

      if(!this.state.vmList[vm].vm_name){
        validationName = "Please enter VM Name for VM "+(vm+1);
        toast.error(validationName);
        setTimeout(() => {
        	let vmList = [...this.state.vmList];
      	  	vmList[vm] = {...vmList[vm], vmNameValidate: "fail", vmValidationName: validationName};
      	  	this.setState({ vmList });
//            this.setState({
//                vmNameValidate: "fail",
//                vmValidationName: validationName
//            });
          }, 100);
        return;
      }
      else if(this.state.vmList[vm].vm_name.length < 4){
        validationName = "VM Name should be atleast 5 characters";
        toast.error(validationName);
        
        setTimeout(() => {
        	let vmList = [...this.state.vmList];
      	  	vmList[vm] = {...vmList[vm], vmNameValidate: "fail", vmValidationName: validationName};
      	  	this.setState({ vmList });
//            this.setState({
//                vmNameValidate: "fail",
//                vmValidationName: validationName
//            });
          }, 100);
        return;
      }
      else{
        var frmData={
            computerName:this.state.vmList[vm].vm_name,
            clientid:this.state.clientid,
            subscriptionId:this.state.subscriptionId.replace(this.state.clientid+"_",""),
            resourceGroupName : this.state.resourceGroupName
        }
        
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(ucpEncrypt(frmData))
        };

        fetch(`${config.apiUrl}/secureApi/azureapi/validate_computername`, requestOptions).then(response  => {
            response.text().then(text => {
                var data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
                if (response.ok) {
                    var result=(data.value ? data.value : data)
                    if(result.success == false){     
                        validationName = result.message;
                        toast.error(validationName);
                        
                        let vmList = [...this.state.vmList];
                  	  	vmList[vm] = {...vmList[vm], vmNameValidate: "fail", vmValidationName: validationName};
                  	  	this.setState({ vmList });
//                        this.setState({vmNameValidate: 'fail',                    
//                            vmValidationName: validationName});
                    } else {      
                        //toast.success(result.message);
                    	let vmList = [...this.state.vmList];
                  	  	vmList[vm] = {...vmList[vm], vmNameValidate: "success"};
                  	  	this.setState({ vmList });
//                        this.setState({vmNameValidate: 'success'});
                    }
                }
                else{
                	let vmList = [...this.state.vmList];
              	  	vmList[vm] = {...vmList[vm], vmNameValidate: "fail"};
              	  	this.setState({ vmList });
//                    this.setState({vmNameValidate: 'fail'});
                    toast.error('The operation did not execute as expected. Please raise a ticket to support');
                }        
            });
        });
      }
  }

  userNameChange(e){
	  return true;
    let val = e.target.value;
    var letterNumber = /^[0-9a-zA-Z]+$/;
    if(val == ""){
        this.setState({
        	username: ""
        })
    }
    else if((val.match(letterNumber))){
        this.setState({
        	username: val
        })
    }
  }

  userNameBlur(){
	  return true;
      setTimeout(() => {
        this.setState({
            userNameValidate: "checking"
        });
      }, 0);

      let validationName = "";

      if(!this.state.username){
        validationName = "Please enter Username";
        toast.error(validationName);
        setTimeout(() => {
            this.setState({
                userNameValidate: "fail",
                userValidationName: validationName
            });
          }, 100);
        return;
      }
      else if(this.state.username.length < 4){
        validationName = "User Name should be atleast 5 characters";
        toast.error(validationName);
        setTimeout(() => {
            this.setState({
                userNameValidate: "fail",
                userValidationName: validationName
            });
          }, 100);
        return;
      }
      else{
    	  let notAllowedUsernames = ["administrator", "admin", "user", "user1", "test", "user2", "test1", "user3", "admin1", "1", "123", "a", "actuser", "adm", "admin2", "aspnet", "backup", "console", "david", "guest", "john", "owner", "root", "server", "sql", "support", "support_388945a0", "sys", "test2", "test3", "user4", "user5"];
    	  if(notAllowedUsernames.indexOf(this.state.username) >= 0){
  	        toast.error("Literal words not allowed for Username");
	  	      setTimeout(() => {
	  	        this.setState({userNameValidate: 'fail',                    
	                  userValidationName: validationName});
	          }, 100);
  	      }else if(this.state.username.match( /demo|test/g )){
    	        toast.error("Invalid Username");
    	        setTimeout(() => {
	    	        this.setState({userNameValidate: 'fail',                    
	                    userValidationName: validationName});
    	          }, 100);
    	  }else{
    		  setTimeout(() => {
    	    	this.setState({userNameValidate: 'success'});
              }, 100);
    	  }
      }
  }
	  
  backStepperClick(){
    this.setState({
        activeStepper: --this.state.activeStepper
    });
  }

  nextStepperClick = (e) =>{
		e.preventDefault();
    if(this.state.activeStepper == 1){
    	var form = document.querySelector("#saveOrderInfoFrm");
        var formData = serialize(form, { hash: true });
        console.log("formData -- ",formData);
        console.log("vmList -- ", this.state.vmList);
        this.setState({
            zoneList: JSON.parse(JSON.stringify(this.props.azure.dropdownData.Azure_Zones))
        });
        
        if(!this.state.subscriptionId){
            toast.error("Please select Subscription");
            return;
        }
//        else if(!this.state.os_template_id){
//            toast.error("Please select OS Template");
//            return;
//        }
        else if(!this.state.resourceGroupName){
            toast.error("Please select VM Resource Group");
            return;
        }
        else if(!this.state.gallery_name){
            toast.error("Please select Gallery Name");
            return;
        }
        else if(!this.state.shared_image_name){
            toast.error("Please select Shared Image Name");
            return;
        }
        else if(!this.state.shared_image_version){
            toast.error("Please select Shared Image Version");
            return;
        }
        else if(!formData.networkResourceGroupName){
            toast.error("Please select Network Resource Group Name");
            return;
        }
//        else if(!formData.zone){
//            toast.error("Please select Zone");
//            return;
//        }
        else if(!formData.environment){
            toast.error("Please select Environment");
            return;
        }
//        else if(!formData.system_name){
//            toast.error("Please select System Name");
//            return;
//        }
//        else if(!formData.system_type){
//            toast.error("Please select System Type");
//            return;
//        }
        // else if(!this.state.selectedVirtualNetwork){
        //     toast.error("Please select Virtual Network");
        //     return;
        // }
         else if(!formData.region){
             toast.error("Please select Region");
             return;
         }
        else if(!formData.network_identify){
            toast.error("Please select Network Identify");
            return;
        }else if(!this.state.selectedSubnet){
            toast.error("Please select Subnet");
            return;
        }else if(this.state.availability_set_or_zone == "Set" && !formData.availability_set_name){
            toast.error("Please select Availability Set Name");
            return;
        }
        else{
        	this.setState({
	        	vm_size_name: "",
	            vm_cpus : "",
	            vm_ram : "",
	            acceleratedNetworkingEnabled : "",
	            maxDataDiskCount : 1,
        	});
        	this.getAzureVMSize({
                clientid:this.state.clientid,
                subscriptionId: this.state.subscriptionId.replace(this.state.clientid+"_",""), 
                location : this.state.selected_network_location_name,
                currency_id: this.state.user_details.data.currency_id,
                HyperVGenerations : this.state.HyperVGenerations,
                os_type : this.state.os_type,
                shared_image_name : this.state.shared_image_name,
                is_cluster : ((this.state.vm_selection == 'Clustering')?1:0),
                MinimumDisks : ((this.state.shared_image_tags && this.state.shared_image_tags["UCP-Minimum-Disks"] && this.state.shared_image_tags["UCP-Minimum-Disks"] != 'NA')?this.state.shared_image_tags["UCP-Minimum-Disks"]:"")
                });
        	
            const requestOptions = {
                method: 'POST',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify(ucpEncrypt(Object.assign({}, formData,{
                	subscription_id:this.state.subscriptionId.replace(this.state.clientid+"_",""), 
                	os_type : this.state.os_type, 
                	clientid : this.state.clientid, 
                	vm_count : this.state.vm_count,
                	provision_type : this.state.subscription_provision_type,
                	subnet : this.state.selectedSubnet
                	})))
                }

            this.setState({
                isVmSizeValidatingInProgress: true
            });

            fetch(`${config.apiUrl}/secureApi/azure/generateUniqueVmName`, requestOptions).then(response  => {
                response.text().then(text => {
                    
                    var data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
                    var errorMsg = ((data.message)?data.message:"The operation did not execute as expected. Please raise a ticket to support");
                    if (response.ok) {
                        if(data.status == "success"){
                        	let vmList = [];
                        	data.vm_name.forEach((vmName, index) => {
                        	    console.log(vmName);
                		    	let disksListCount = 1;
                                if(this.state.isAdditionalDiskRequired){
                                	this.setState({
                                		["disksList_"+(index+1)]: [{Disk_Name: vmName.name+"-disk1", Disk_Size: "", Disk_Host_Caching: "None", Disk_Storage_Size: "", Disk_Storage_Type : "",keyValue:"1"}],
//                                		[vmList[index].disksListCount] : 2
                                		});
                                	disksListCount = 2;
                                }else{
                		    		this.setState({["disksList_"+(index+1)] : []});
                		    	}
                                
                                let vmInfo = Object.assign({},this.state.vmListInit,{
                                	disksListId:"disksList_"+(index+1),
                                	vm_name:vmName.name,
                                	disksListCount:disksListCount, 
                                	selectedNIC:vmName.name+"-nic"
                            	});
                                if(this.state.vm_selection == 'Clustering'){
                                	vmInfo.selectedNIC2 = vmName.name+"-nic-2"
                                }
                                if(this.state.weblogicMiddlewares.indexOf(this.state.shared_image_tags["UCP-MW"]) >= 0){
                                	vmInfo.weblogicServiceName = "";
//                                	vmInfo.weblogicManagedServers = "1";
                                	vmInfo.weblogicUsername = "weblogic";
                                	vmInfo.weblogicPassword = commonFns.fnGenerateString({passwordPolicy:[{characters:"abcdefghijklmnopqrstuvwxyz",minLength:1},{characters:"ABCDEFGHIJKLMNOPQRSTUVWXYZ",minLength:1},{characters:"0123456789",minLength:1},{characters:"@^$_",minLength:1},{characters:"0123456789",minLength:1},{characters:"@^$_",minLength:1}], passwordMinLength: 10});
                                }
                                if(this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] == 'Oracle'){
                                	vmInfo.dbName = "";
                                	vmInfo.dbUsername = "";
                                	vmInfo.dbPassword = "";
                                	vmInfo.dbCharacterSet = "";
                                	vmInfo.dbPasswordReadonly = true;
                                }
                                if(this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] == 'Informix'){
                                	vmInfo.dbName = "";
                                	vmInfo.informixLog = "buffered";
                                }
                                if(this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] == 'MSSQL'){
                                	vmInfo.msDbName = "";
                                	vmInfo.Data_File_Size = "64";
                                	vmInfo.Log_File_Size = "64";
                                	vmInfo.Temp_DB_Size = "64";
                                }
                                vmList.push(vmInfo);
                                
                        	});
                        	
                        	this.setState(prevState => ({ 
                		    	vmList: vmList
                		    }));
                        	setTimeout(() => {
                        		$("input[name^=Disk_Storage_Type]").val("");
                                $("input[name^=Disk_Storage_Size]").val("");
                                $("input[name^=Disk_Size]").val("");
                            }, 500);
                        	setTimeout(() => {
                                $("input[name=dbPassword]").attr("type","password");
                            }, 2000);
                        	
                        	data.vm_name.forEach((vmName, index) => {
                        		this.vmNameBlur(index);
                        	});
                        	
                        	const storageSkusRequestOptions = {
                                method: 'POST',
                                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                                body: JSON.stringify(ucpEncrypt(Object.assign({}, formData,{clientid : this.state.clientid, 
                                	"location": this.state.selected_network_location_name, 
                                	storagetype: this.state.storageAccountType,
                                	subscription_id : this.state.subscriptionId.replace(this.state.clientid+"_","")})))
                            };

                            this.setState({
                                isStorageSkusInProgress: true
                            });
                            
                            fetch(`${config.apiUrl}/secureApi/azure/getStorageSkus`, storageSkusRequestOptions).then(response  => {
                                response.text().then(text => {
                                    
                                    var data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
                                    var errorMsg = "The operation did not execute as expected. Please raise a ticket to support";
                                    if (response.ok) {
                                        if(data.status == "success"){
                                        	let storageTypesList = [];
                                        	if(data.value && data.value.length > 0){
                                        		for(let st = 0; st < data.value.length; st++){
                                        			if(storageTypesList.indexOf(data.value[st].name) < 0){
                                        				storageTypesList.push(data.value[st].name);
                                        			}
                                        		}
                                        	}
                                        	console.log("storageTypesList --- ", storageTypesList);
                                        	this.setState({
                                        		storageSkusList : data.value,
                                        		storageTypesList
                                    		});
                                        	
                                        } else {
                                            toast.error(errorMsg);
                                        }
                                    }
                                    else{
                                        toast.error(errorMsg);
                                    }

                                    this.setState({
                                    	isStorageSkusInProgress: false
                                    });
                                    
                                    this.setState({
                                        activeStepper: ++this.state.activeStepper
                                    });
                                });
                            });
                        } else {
                            toast.error(errorMsg);
                        }
                    }
                    else{
                        toast.error(errorMsg);
                    }

                    this.setState({
                        isVmSizeValidatingInProgress: false
                    });
                    
                    let backup_resource_group_name = '';
		      		let storage_resource_group_name = '';
		      		if(this.state.backupResourceGroups.length > 0){
		      			backup_resource_group_name = this.state.backupResourceGroups[0].name;
		      			this.backupResourceGroupNameChange(backup_resource_group_name);
		      		}
	    	      	if(this.state.storageResourceGroups.length > 0){
	    	      		storage_resource_group_name = this.state.storageResourceGroups[0].name;
		      			this.storageResourceGroupNameChange(storage_resource_group_name);
		      		}
	    	      	this.setState({
	    	      		backup_resource_group_name,
	    	      		storage_resource_group_name
                    });
                });
            });
            
            return;
        }
    }
    else if(this.state.activeStepper == 2){
    	var form = document.querySelector("#saveOrderInfoFrm");
        var formData = serialize(form, { hash: true });
        console.log("formData -- ",formData);
        
//        if(this.state.vmNameValidate == "checking"){
//            toast.warn("Please wait, VM Name is Validating");
//            return;
//        }
//        else if(!this.state.vm_name){
//            toast.error("Please enter VM  Name");
//            return;
//        }
//        else if(this.state.vmNameValidate != "success"){
//            toast.error("Please enter valid VM  Name");
//            return;
//        }
//        else 
        	if(!this.state.vm_size_name){
            toast.error("Please select VM Size");
            return;
        }else if(!this.state.storageAccountType){
            toast.error("Please select OS Storage Type");
            return;
        }
        let vm_error = false;
        console.log("this.state.vmList -- ",this.state.vmList);
        let selectedZonesList = [];
        let mountPointJson = {};
        this.setState({
        	mountPointJson: {}
        });
        
        let Existing_Mount_Point_Labels = [];
		if(this.state.shared_image_tags
				  && Object.keys(this.state.shared_image_tags).length > 0){
			let shared_image_tags_keys = Object.keys(this.state.shared_image_tags);
			for (const tag_key of shared_image_tags_keys){
    			if(tag_key.indexOf("UCP-Mount-Path") >= 0){
    				Existing_Mount_Point_Labels.push(this.state.shared_image_tags[tag_key]);
    			}
			}
		}
		console.log("Existing_Mount_Point_Labels --- ", Existing_Mount_Point_Labels);
		
        let Azure_Predefined_Mount_Names = (this.props.azure.dropdownData && this.props.azure.dropdownData.Azure_Predefined_Mount_Names?this.props.azure.dropdownData.Azure_Predefined_Mount_Names:{});
        let completeVmDiskInfo = [];
        for(let i =0; i < this.state.vmList.length; i++){
        	if(this.state.availability_set_or_zone == "Zone" && this.state.vmList[i].zone == ''){
        		vm_error = true;
                toast.error("Please select Zone in VM "+(i+1));
            	return;
        	}else if(this.state.vmList[i].vm_name == ''){
        		vm_error = true;
                toast.error("Please enter VM Name in VM "+(i+1));
            	return;
        	}else if(this.state.vmList[i].vmNameValidate == "checking"){
        		vm_error = true;
                toast.warn("Please wait, VM Name is Validating");
                return;
            }
            else if(this.state.vmList[i].vmNameValidate != "success"){
            	vm_error = true;
                toast.error("Please enter valid VM  Name");
                return;
            }
            else if(!this.state.vmList[i].selectedNIC || this.state.vmList[i].selectedNIC == ''){
            	vm_error = true;
            	toast.error("Please enter in VM NIC "+(i+1));
                return;
            }
        	
        	if(this.state.weblogicMiddlewares.indexOf(this.state.shared_image_tags["UCP-MW"]) >= 0){
        		if(!this.state.vmList[i].weblogicServiceName){
	                toast.error("Please enter Weblogic Service Name in VM "+(i+1));
	                return;
	            }
        		else if(this.state.vmList[i].weblogicServiceName.length < 4){
	                toast.error("Weblogic Service Name Must be at least 4 characters in VM "+(i+1));
	                return;
	            }
	            else if(this.state.vmList[i].weblogicServiceName.length > 32){
	                toast.error("Weblogic Service Name Must not be greater than 32 characters in VM "+(i+1));
	                return;
	            }
        		else if(/[^a-zA-Z]/.test(this.state.vmList[i].weblogicServiceName)){
	                toast.error("Please enter only alphabets for Weblogic Service Name");
	                return;
	            }
//	            else if(!this.state.vmList[i].weblogicPassword){
//	                toast.error("Please enter Weblogic Password in VM "+(i+1));
//	                return;
//	            }
//	            else if(this.state.vmList[i].weblogicPassword.length < 8){
//	                toast.error("Weblogic Password Must be at least 8 characters in VM "+(i+1));
//	                return;
//	            }
//	            else if(this.state.vmList[i].weblogicPassword.length > 32){
//	                toast.error("Weblogic Password Must not be greater than 32 characters in VM "+(i+1));
//	                return;
//	            }
//	            else if(!this.state.vmList[i].weblogicPassword.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)){
//	                toast.error("Weblogic Password Must be Contain Atleast one Small and one Capital letter in VM "+(i+1));
//	                return;
//	            }
//	            else if(!this.state.vmList[i].weblogicPassword.match(/([0-9])/)){
//	                toast.error("Weblogic Password Must be Contain Atleast one number in VM "+(i+1));
//	                return;
//	            }
//	            else if(this.state.vmList[i].weblogicPassword.match(/(.*[.,()%#])/)){
//	                toast.error(".,()%# These Special characters are not allowed for Weblogic Password in VM "+(i+1));
//	                return;
//	            }
//	            else if(!this.state.vmList[i].weblogicPassword.match(/(.*[@,=,!,&,$,^,*,?,_,~,-])/)){
//	                toast.error("Weblogic Password Must be Contain atleast one special character @,=,!,&,$,^,*,?,_,~,- in VM "+(i+1));
//	                return;
//	            }
        	}
        	
        	if(this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] == 'MSSQL'){
        		if(!this.state.vmList[i].msDbName){
	                toast.error("Please enter DB Name in VM "+(i+1));
	                return;
	            }
        		else if(this.state.vmList[i].msDbName.length < 4){
	                toast.error("DB Name Must be at least 4 characters in VM "+(i+1));
	                return;
	            }
	            else if(this.state.vmList[i].msDbName.length > 12){
	                toast.error("DB Name Must be less than or equal to 12 characters in VM "+(i+1));
	                return;
	            }
        		else if(/[^a-zA-Z0-9_]/.test(this.state.vmList[i].msDbName)){
	                toast.error("Please enter alphabets or numbers or underscore( _ ) for DB Name");
	                return;
	            }
	            else if(!this.state.vmList[i].msDbName.match(/([a-zA-Z0-9])/)){
	                toast.error("DB Name Must be Contain Atleast one alphabet or number in VM "+(i+1));
	                return;
	            }
	            else if(this.state.vmList[i].Data_File_Size < 64){
	                toast.error("Data File Size Must be greater than or equal to 64 GB in VM "+(i+1));
	                return;
	            }
	            else if(this.state.vmList[i].Data_File_Size > 2048){
	                toast.error("Data File Size Must be less than or equal to 2048 GB in VM "+(i+1));
	                return;
	            }
	            else if(this.state.vmList[i].Log_File_Size < 64){
	                toast.error("Log File Size Must be greater than or equal to 64 GB in VM "+(i+1));
	                return;
	            }
	            else if(this.state.vmList[i].Log_File_Size > 2048){
	                toast.error("Log File Size Must be less than or equal to 2048 GB in VM "+(i+1));
	                return;
	            }
	            else if(this.state.vmList[i].Temp_DB_Size < 64){
	                toast.error("Temp DB Size Must be greater than or equal to 64 GB in VM "+(i+1));
	                return;
	            }
	            else if(this.state.vmList[i].Temp_DB_Size > 2048){
	                toast.error("Temp DB Size Must be less than or equal to 2048 GB in VM "+(i+1));
	                return;
	            }
        	}
        	if(this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] == 'Oracle'){
        		if(!this.state.vmList[i].dbName){
	                toast.error("Please enter DB Name in VM "+(i+1));
	                return;
	            }
        		else if(this.state.vmList[i].dbName.length < 4){
	                toast.error("DB Name Must be at least 4 characters in VM "+(i+1));
	                return;
	            }
	            else if(this.state.vmList[i].dbName.length > 8){
	                toast.error("DB Name Must not be greater than 8 characters in VM "+(i+1));
	                return;
	            }
        		else if(/[^a-zA-Z0-9]/.test(this.state.vmList[i].dbName)){
	                toast.error("Please enter alphabets or numbers for DB Name");
	                return;
	            }
	            else if(!this.state.vmList[i].dbUsername){
	                toast.error("Please enter DB Username in VM "+(i+1));
	                return;
	            }
        		else if(this.state.vmList[i].dbUsername.length < 4){
	                toast.error("DB Username Must be at least 4 characters in VM "+(i+1));
	                return;
	            }
	            else if(this.state.vmList[i].dbUsername.length > 10){
	                toast.error("DB Username Must not be greater than 10 characters in VM "+(i+1));
	                return;
	            }
        		else if(/[^a-zA-Z0-9]/.test(this.state.vmList[i].dbUsername)){
	                toast.error("Please enter alphabets or numbers for DB Username");
	                return;
	            }
	            else if(!this.state.vmList[i].dbPassword){
	                toast.error("Please enter DB Password in VM "+(i+1));
	                return;
	            }
	            else if(this.state.vmList[i].dbPassword.length < 10){
	                toast.error("DB Password Must be at least 10 characters in VM "+(i+1));
	                return;
	            }
	            else if(this.state.vmList[i].dbPassword.length > 32){
	                toast.error("DB Password Must not be greater than 32 characters in VM "+(i+1));
	                return;
	            }
	            else if(!this.state.vmList[i].dbPassword.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)){
	                toast.error("DB Password Must be Contain Atleast one Small and one Capital letter in VM "+(i+1));
	                return;
	            }
	            else if(!this.state.vmList[i].dbPassword.match(/([0-9])/)){
	                toast.error("DB Password Must be Contain Atleast one number in VM "+(i+1));
	                return;
	            }
	            else if(this.state.vmList[i].dbPassword.match(/(.*[.,()%#@&$])/)){
	                toast.error(".,()%#@&$ These Special characters are not allowed for DB Password in VM "+(i+1));
	                return;
	            }
	            else if(!this.state.vmList[i].dbPassword.match(/(.*[=,!,^,*,?,_,~,-])/)){
	                toast.error("DB Password Must Contain atleast one special character =,!,^,*,?,_,~,- in VM "+(i+1));
	                return;
	            }
	            else if(!this.state.vmList[i].dbCharacterSet){
	                toast.error("Please enter DB Character Set in VM "+(i+1));
	                return;
	            }
        		
        		//password policy checker
        		if(this.state.vmList[i].dbPassword.toLowerCase().indexOf(this.state.vmList[i].dbUsername.toLowerCase()) >= 0){
        			toast.error("DB Password should not contain DB Username in VM "+(i+1));
	                return;
    			}else if(this.state.vmList[i].dbPassword.toLowerCase().indexOf(this.state.vmList[i].dbUsername.split('').reverse().join('').toLowerCase()) >= 0){
        			toast.error("DB Password should not contain reverse of DB Username in VM "+(i+1));
	                return;
    			}else if(this.state.vmList[i].dbPassword.toLowerCase().indexOf(this.state.vmList[i].dbName.toLowerCase()) >= 0){
        			toast.error("DB Password should not contain DB Name in VM "+(i+1));
	                return;
    			}else{
	        		let passwordDisallowedWords = [
	        			'welcome1', 'database1', 'account1', 'user1234', 'password1', 'oracle123', 'computer1', 'abcdefg1', 'change_on_install','dhl123','dhl12345','dhl123456' ,'oracle'
	        			];
	        		let passwordDisallowedWordFound = false;
	        		for(let sl = 0; sl < passwordDisallowedWords.length; sl++){
	        			if(this.state.vmList[i].dbPassword.toLowerCase().indexOf(passwordDisallowedWords[sl]) >= 0){
	        				passwordDisallowedWordFound = true;
	        			}
	        		}
	        		if(passwordDisallowedWordFound){
	        			toast.error("DB Password should not contain dictionary keywords in VM "+(i+1));
		                return;
	        		}
    			}
        	}
        	

        	if(this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] == 'Informix'){
        		if(!this.state.vmList[i].dbName){
	                toast.error("Please enter DB Name in VM "+(i+1));
	                return;
	            }
        		else if(this.state.vmList[i].dbName.length < 4){
	                toast.error("DB Name Must be at least 4 characters in VM "+(i+1));
	                return;
	            }
	            else if(this.state.vmList[i].dbName.length > 8){
	                toast.error("DB Name Must not be greater than 8 characters in VM "+(i+1));
	                return;
	            }
        		else if(/[^a-zA-Z0-9]/.test(this.state.vmList[i].dbName)){
	                toast.error("Please enter alphabets or numbers for DB Name");
	                return;
	            }
	            else if(!this.state.vmList[i].informixLog){
	                toast.error("Please select Log in VM "+(i+1));
	                return;
	            }
        	}
        	
        	let physical_volume = [];
            let storage_breakup = [];
            let Mount_Point_Labels = [];
            completeVmDiskInfo[i] = {};
            completeVmDiskInfo[i].disksList = [];
        	console.log("this.state[this.state.vmList[i].disksListId].length -- ",this.state[this.state.vmList[i].disksListId].length);
        	for(let j =0; j < this.state[this.state.vmList[i].disksListId].length; j++){
        		console.log("this.state[this.state.vmList[i].disksListId][j] -- ",this.state[this.state.vmList[i].disksListId][j]);
        		completeVmDiskInfo[i].disksList.push(this.state[this.state.vmList[i].disksListId][j]);
            	if(this.state[this.state.vmList[i].disksListId][j].Disk_Name == ''){
            		vm_error = true;
                    toast.error("Please enter Disk Name "+(j+1)+" in VM "+(i+1));
                	return;
            	}
            	if(this.state[this.state.vmList[i].disksListId][j].Disk_Host_Caching == ''){
            		vm_error = true;
                    toast.error("Please select Disk Host Caching "+(j+1)+" in VM "+(i+1));
                	return;
            	}
            	if(this.state[this.state.vmList[i].disksListId][j].Disk_Storage_Type == ''){
            		vm_error = true;
                    toast.error("Please select Disk Storage Type "+(j+1)+" in VM "+(i+1));
                	return;
            	}
            	if(this.state[this.state.vmList[i].disksListId][j].Disk_Storage_Size == ''){
            		vm_error = true;
                    toast.error("Please select Disk Storage SKU "+(j+1)+" in VM "+(i+1));
                	return;
            	}
            	if(this.state[this.state.vmList[i].disksListId][j].Disk_Size == ''){
            		vm_error = true;
                    toast.error("Please enter Disk Size "+(j+1)+" in VM "+(i+1));
                	return;
            	}else if(parseInt(this.state[this.state.vmList[i].disksListId][j].MinSizeGiB) > parseInt(this.state[this.state.vmList[i].disksListId][j].Disk_Size) 
            			|| parseInt(this.state[this.state.vmList[i].disksListId][j].Disk_Size) > parseInt(this.state[this.state.vmList[i].disksListId][j].MaxSizeGiB)){
            		vm_error = true;
                    toast.error("Please enter Disk Size "+(j+1)+" in VM "+(i+1)+" must be in between "+this.state[this.state.vmList[i].disksListId][j].MinSizeGiB+" and "+this.state[this.state.vmList[i].disksListId][j].MaxSizeGiB);
                	return;
            	}
            	
            	//diskMountPointsArr
            	if(this.state.diskMountPointsArr.indexOf(this.state[this.state.vmList[i].disksListId][j].Disk_Name) >= 0
            		&& this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name]
            		&& this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name].length > 0
            	){
//            		completeVmDiskInfo[i].diskMountPoints = this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name];
            		
            		let totalMountSize = (this.props.azure.dropdownData && this.props.azure.dropdownData.Azure_Disk_Mount_Buffer_Size?parseInt(this.props.azure.dropdownData.Azure_Disk_Mount_Buffer_Size):0);
            		console.log("this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name] -- ",this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name]);
//            		let Mount_Point_Labels = [];
	            	for(let dm = 0; dm < this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name].length; dm++){
	            		console.log("this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name][dm] -- ",this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name][dm]);
	            		
	            		if(this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name][dm].Mount_Point == ''){
	                		vm_error = true;
	                        toast.error("Please enter Mount Point "+(dm+1)+" under Disk "+(j+1)+" in VM "+(i+1));
	                    	return;
	                	}else if(!(/^[a-zA-Z0-9\/]*$/.test(this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name][dm].Mount_Point))){
	                		vm_error = true;
	                        toast.error("Please enter valid Mount Point "+(dm+1)+" under Disk "+(j+1)+" in VM "+(i+1)+", it allowed only Alphabets, Numbers, slash(/)");
	                    	return;
	                	}else if(this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name][dm].Mount_Point.indexOf('/') != 0){
	                		vm_error = true;
	                		toast.error("Mount Point "+(dm+1)+" should start with slash(/) under Disk "+(j+1)+" in VM "+(i+1));
	                    	return;
	                	}else if(Azure_Predefined_Mount_Names.same_values
	                			&& Azure_Predefined_Mount_Names.same_values.length > 0
	                			&& Azure_Predefined_Mount_Names.same_values.indexOf(this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name][dm].Mount_Point) >= 0){
	                		vm_error = true;
	                		toast.error("Mount Point "+(dm+1)+" should not be predefined value under Disk "+(j+1)+" in VM "+(i+1));
	                    	return;
	                	}else if(Azure_Predefined_Mount_Names.mountpoint_labels
	                			&& Azure_Predefined_Mount_Names.mountpoint_labels.length > 0
	                			&& Azure_Predefined_Mount_Names.mountpoint_labels.indexOf(this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name][dm].Mount_Point_Label) >= 0){
	                		vm_error = true;
	                		toast.error("Mount Point "+(dm+1)+" should not be predefined value under Disk "+(j+1)+" in VM "+(i+1));
	                    	return;
	                	}else if(Azure_Predefined_Mount_Names.prefix_values
	                			&& Azure_Predefined_Mount_Names.prefix_values.length > 0){
	                		for(let mp = 0; mp < Azure_Predefined_Mount_Names.prefix_values.length; mp++){
	                			if(this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name][dm].Mount_Point.indexOf(Azure_Predefined_Mount_Names.prefix_values[mp]) == 0){
			                		vm_error = true;
			                		toast.error("Mount Point "+(dm+1)+" should not start with predefined value under Disk "+(j+1)+" in VM "+(i+1));
			                    	return;
	                			}
	                		}
	                	}
	            		
	            		if(Existing_Mount_Point_Labels.indexOf(this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name][dm].Mount_Point_Label) >= 0){
	            			vm_error = true;
	                        toast.error("Mount point "+(dm+1)+" already exists in image under Disk "+(j+1)+" in VM "+(i+1));
	                    	return;
	            		}else if(Mount_Point_Labels.indexOf(this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name][dm].Mount_Point_Label) < 0){
	            			Mount_Point_Labels.push(this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name][dm].Mount_Point_Label);
	            		}else{
	                		vm_error = true;
	                        toast.error("Please enter different Mount point "+(dm+1)+" under Disk "+(j+1)+" in VM "+(i+1));
	                    	return;
	                	}
	            		if(this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name][dm].Mount_Size == ''){
	                		vm_error = true;
	                        toast.error("Please enter Mount Size "+(dm+1)+" under Disk "+(j+1)+" in VM "+(i+1));
	                    	return;
	                	}else{
	                		totalMountSize +=parseInt(this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name][dm].Mount_Size);
	                	}
	            	}
	            	
	            	if(totalMountSize > parseInt(this.state[this.state.vmList[i].disksListId][j].Disk_Size)){
	            		vm_error = true;
	                    toast.error("Please enter valid Mount Sizes, it should not exceed Disk Size "+(j+1)+" in VM "+(i+1)+" including Buffer Size");
	                	return;
	            	}
	            	
	            	physical_volume.push({["vg_"+((j+1)+"").padStart(2,'0')]:[this.state[this.state.vmList[i].disksListId][j].Disk_Size]});
	            	for(let dm = 0; dm < this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name].length; dm++){
		            	storage_breakup.push({
		            		"lvname": this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name][dm].Mount_Point_Label,
		            		"mount": this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name][dm].Mount_Point,
		            		"vg": "vg_"+((j+1)+"").padStart(2,'0'),
		            		"size": this.state[this.state[this.state.vmList[i].disksListId][j].Disk_Name][dm].Mount_Size
		            	});
	            	}
            	}
            	
            	//Oracle DB mount points
            	if(this.state.shared_image_tags && this.state.shared_image_tags["UCP-DB-Type"] && this.state.shared_image_tags["UCP-DB-Type"] == 'Oracle'){
            		let oracleMountPoints = [
            			{Mount_Point:"/oracle/log1/"+this.state.vmList[i].dbName, Mount_Point_Label : ("/oracle/log1/"+this.state.vmList[i].dbName).replace(/[^0-9A-Z]+/gi,""), Mount_Size : 12},
            			{Mount_Point:"/oracle/log2/"+this.state.vmList[i].dbName, Mount_Point_Label : ("/oracle/log2/"+this.state.vmList[i].dbName).replace(/[^0-9A-Z]+/gi,""), Mount_Size : 12},
            			{Mount_Point:"/oracle/arclog/"+this.state.vmList[i].dbName, Mount_Point_Label : ("/oracle/arclog/"+this.state.vmList[i].dbName).replace(/[^0-9A-Z]+/gi,""), Mount_Size : 50},
//            			{Mount_Point:"/oracle/audit/"+this.state.vmList[i].dbName, Mount_Point_Label : ("/oracle/audit/"+this.state.vmList[i].dbName).replace(/[^0-9A-Z]+/gi,""), Mount_Size : 20},
            			{Mount_Point:"/oracle/oradata/"+this.state.vmList[i].dbName, Mount_Point_Label : ("/oracle/oradata/"+this.state.vmList[i].dbName).replace(/[^0-9A-Z]+/gi,""), Mount_Size : (parseInt(this.state[this.state.vmList[i].disksListId][j].Disk_Size) - 79)},// 79 is nothing but sum of all above mount points and 5 GB buffer size
            		];
            		console.log("oracleMountPoints ---- ", oracleMountPoints);
//            		physical_volume.push({["vg_"+((j+1)+"").padStart(2,'0')]:[this.state[this.state.vmList[i].disksListId][j].Disk_Size]});
            		physical_volume.push({["dgoracldb"+((j+1)+"").padStart(2,'0')]:[this.state[this.state.vmList[i].disksListId][j].Disk_Size]});
	            	for(let dm = 0; dm < oracleMountPoints.length; dm++){
		            	storage_breakup.push({
		            		"lvname": oracleMountPoints[dm].Mount_Point_Label,
		            		"mount": oracleMountPoints[dm].Mount_Point,
//		            		"vg": "vg_"+((j+1)+"").padStart(2,'0'),
		            		"vg": "dgoracldb"+((j+1)+"").padStart(2,'0'),
		            		"size": oracleMountPoints[dm].Mount_Size
		            	});
	            	}
            	}

            	//Web-logic mount points
            	if(this.state.shared_image_tags && this.state.shared_image_tags["UCP-MW"] && this.state.weblogicMiddlewares.indexOf(this.state.shared_image_tags["UCP-MW"]) >= 0){
            		let oracleMountPoints = [
            			{Mount_Point:"/appl/"+this.state.vmList[i].weblogicServiceName, Mount_Point_Label : ("/appl/"+this.state.vmList[i].weblogicServiceName).replace(/[^0-9A-Za-z]+/gi,""), Mount_Size : Math.floor((parseInt(this.state[this.state.vmList[i].disksListId][j].Disk_Size) - 8)*80/100)},
            		];
            		console.log("oracleMountPoints ---- ", oracleMountPoints);
            		physical_volume.push({["vg_"+((j+1)+"").padStart(2,'0')]:[this.state[this.state.vmList[i].disksListId][j].Disk_Size]});
	            	for(let dm = 0; dm < oracleMountPoints.length; dm++){
		            	storage_breakup.push({
		            		"lvname": oracleMountPoints[dm].Mount_Point_Label,
		            		"mount": oracleMountPoints[dm].Mount_Point,
		            		"vg": "vg_"+((j+1)+"").padStart(2,'0'),
		            		"size": oracleMountPoints[dm].Mount_Size
		            	});
	            	}
            	}
            }
        	
        	if(physical_volume.length > 0){
        		storage_breakup.sort(commonFns.fnDynamicArrayOfObjectsSort("lvname"));
        		completeVmDiskInfo[i].storage_breakup = storage_breakup;
        		mountPointJson[this.state.vmList[i].vm_name] = {
	            		physical_volume : physical_volume,
	            		storage_breakup : storage_breakup,
	            		filesystem_type : ["xfs"]
	            };
        	}
    		console.log("mountPointJson --- ", mountPointJson);
        	
        	if(this.state.availability_set_or_zone == "Zone" && this.state.vm_selection == "Clustering"){
        		if(selectedZonesList.indexOf(this.state.vmList[i].zone) < 0){
        			selectedZonesList.push(this.state.vmList[i].zone);
        		}else{
        			vm_error = true;
                    toast.error("Please select different Zone in VM "+(i+1));
                	return;
        		}
        	}
        }
        if(this.state.vm_selection == 'Clustering'){
        	completeVmDiskInfo = JSON.stringify(completeVmDiskInfo).replaceAll(this.state.vmList[0].vm_name, this.state.vmList[1].vm_name);
        	completeVmDiskInfo = JSON.parse(completeVmDiskInfo);
        	console.log("completeVmDiskInfo --- ", completeVmDiskInfo);
        	console.log("completeVmDiskInfo --- ", JSON.stringify(completeVmDiskInfo));
        	if(!commonFns.fnDeepCompareObjects(completeVmDiskInfo[0], completeVmDiskInfo[1])){
        		vm_error = true;
                toast.error("For Cluster order, both VMs should have same configuration and sequence.");
            	return;
        	}
        }
		console.log("mountPointJson ---- ", mountPointJson);
        if(!vm_error){
        	this.setState({
            	mountPointJson: mountPointJson
            });
//        let disk_error = false;
//        console.log("this.state.disksList -- ",this.state.disksList);
//        for(let i =0; i < this.state.disksList.length; i++){
//        	if(this.state.disksList[i].Disk_Name == ''){
//        		disk_error = true;
//                toast.error("Please enter Disk Name "+(i+1));
//            	return;
//        	}
//        	if(this.state.disksList[i].Disk_Host_Caching == ''){
//        		disk_error = true;
//                toast.error("Please select Disk Host Caching "+(i+1));
//            	return;
//        	}
//        	if(this.state.disksList[i].Disk_Size == ''){
//        		disk_error = true;
//                toast.error("Please enter Disk Size "+(i+1));
//            	return;
//        	}
//        }
//        if(!disk_error){
            /*let frmData = {storagetype: this.state.storageAccountType, vmsizename : this.state.vm_size_name};

            const requestOptions = {
                method: 'POST',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify(ucpEncrypt(frmData))
            };

            this.setState({
                isVmSizeValidatingInProgress: true
            });

            fetch(`${config.apiUrl}/secureApi/azure/checkStorageAndSizeCompatability`, requestOptions).then(response  => {
                response.text().then(text => {
                    
                    var data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
                    var errorMsg = "Please change VM Size, Selected VM Size is not supporting to '" + this.state.os_template_name + "' OS Template!";
                    if (response.ok) {
                        if(data.status == "success"){
                            this.setState({
                                selectedPublicIp: 0,
//                                selectedNIC: 0
                            });

                            this.setState({
                                activeStepper: ++this.state.activeStepper
                            });
                        } else {
                            toast.error(errorMsg);
                        }
                    }
                    else{
                        toast.error(errorMsg);
                    }

                    this.setState({
                        isVmSizeValidatingInProgress: false
                    });
                });
            });*/
        	
        	// this.setState({
            //     activeStepper: ++this.state.activeStepper
            // });
			this.AddToCart(e);

            return;
        }
    }
    else if(this.state.activeStepper == 3){
//        if(!this.state.selectedSubnet){
//            toast.error("Please select Subnet");
//            return;
//        }
//        else if(this.state.validateAvailableIpsCount && !this.state.availableIpsCount){
//            toast.error("Ips not available for selected Subnet");
//            return;
//        }
//        else if(!this.state.selectedPublicIp){
//            toast.error("Please select Public IP");
//            return;
//        }
//        else if(!this.state.selectedNIC){
//            toast.error("Please enter NIC");
//            return;
//        }
        if(!this.state.backup_resource_group_name){
            toast.error("Please enter Backup Resource Group");
            return;
        }
        else if(!this.state.recovery_vault_name){
            toast.error("Please enter Backup Vault Name");
            return;
        }
        else if(!this.state.backup_policy){
            toast.error("Please enter Backup Vault Policy");
            return;
        }
        else if(!this.state.storage_resource_group_name){
            toast.error("Please select Storage Resource Group");
            return;
        }
        else if(!this.state.storage_account_name){
            toast.error("Please select Storage Account Name");
            return;
        }
        
//        console.log("this.state.vmList -- ",this.state.vmList);
//        for(let i =0; i < this.state.vmList.length; i++){
//        	if(!this.state.vmList[i].selectedNIC || this.state.vmList[i].selectedNIC == ''){
//                toast.error("Please enter in VM NIC "+(i+1));
//            	return;
//        	}
//        }
    }

    this.setState({
        activeStepper: ++this.state.activeStepper
    });
  }

  createDiskPopupClick = () =>{
    this.setState({
        modalDiskPopupIsOpen: true
    });
  }

  closeDiskPopupModalClick = () =>{
    this.setState({
        modalDiskPopupIsOpen: false
    });
  }
  
  popupFormSubmit = (event, flag) =>{
    if (event.key === 'Enter') {
      if(flag == "disk"){
       this.azureAddDiskRequest();
      }
      else if(flag == "ip"){
        this.generatePublicIpClick();
      }
      else if(flag == "set"){
          this.createNewAvailabilitySetClick();
      }
      else if(flag == "nic"){
          this.generateNICClick();
      }
    }
  }

  azureAddDiskRequest = e => {
    var frmData = {};
    
    if(this.state.disk_new_name.length < 5){
      toast.error("Disk name should be at least 5 characters");
      return;
    }

    if(!this.state.disk_new_size_GB){
        toast.error("Please enter Disk Size");
        return;
    }

    frmData.clientid = this.state.clientid;
    frmData.name = this.state.disk_new_name;
    frmData.diskSizeGB =  this.state.disk_new_size_GB;
    frmData.createOption = "Empty";
    frmData.location = this.state.locationName;
    frmData.resourceGroup = this.state.resourceGroupName;
    frmData.subscription_id = this.state.subscriptionId.replace(this.state.clientid+"_","");
    frmData.currency_id = this.state.user_details.data.currency_id;
    
    this.setState({
      is_add_disk_inprogress: true
    });
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/azure/addDisk`, requestOptions).then(response  => this.handleAddDiskResponse(response));
  }

  handleAddDiskResponse(response, stateName) {
    return response.text().then(text => {
      this.setState({
        is_add_disk_inprogress: false
      });

        const data = text && JSON.parse(text);
        if (!response.ok) {
          toast.error(data.message);
        }
        else{
          toast.success("Disk Added Successfully!");
          this.setState({
            modalDiskPopupIsOpen: false
          })
          
          this.callDisks();
        }        
    });
		}
		
		onCaptchaChange(aEvent) {
			this.setState({inpCaptcha: aEvent.target.value})
		}

  render() {
			let {optionsCmdbSelectedRegions, svg, inpCaptcha} = this.state;
			let dropdownData = this.props.azure.dropdownData;
   let subscription_locations = this.props.azure.subscription_locations;
   let subscription_list = this.props.azure.subscription_list;
//    let resourceGroups = this.props.azure.resourceGroups;
//    console.log("resourceGroups --- ",resourceGroups);
//    console.log("dropdownData --- ",dropdownData);
//    console.log("dropdownData.length --- ",((dropdownData)?dropdownData.length:""));

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">Azure - New VM Instance</h5>
          <div className="customized-stepper">
            <div className="row">
                <div className={"col-lg-6 mobile-width-25per " + (this.state.activeStepper == this.state.basicInfoStepper && "active")}>
                    <h5 className="stepper-heading count-heading">
                        { this.state.activeStepper > this.state.basicInfoStepper ?
                        <label><i className="fa fa-check-circle stepper-done"></i></label>
                        : <span>1</span>}
                        </h5>
                </div>
                <div className={"col-lg-6 mobile-width-25per " + (this.state.activeStepper == this.state.VMDetailsStepper && "active")}>
                    <div className="progress-line"></div>
                    <h5 className="stepper-heading count-heading">
                        { this.state.activeStepper > this.state.VMDetailsStepper ?
                        <label><i className="fa fa-check-circle stepper-done"></i></label>
                        : <span>2</span>}
                    </h5>
                </div>
                {/* <div className={"col-lg-4 mobile-width-25per " + (this.state.activeStepper == this.state.NetworkInterfaceStepper && "active")}>
                    <div className="progress-line"></div>
                    <h5 className="stepper-heading count-heading">
                        { this.state.activeStepper > this.state.NetworkInterfaceStepper ?
                        <label><i className="fa fa-check-circle stepper-done"></i></label>
                        : <span>3</span>}
                    </h5>
                </div> */}
                {/*<div className={"col-lg-3 mobile-width-25per " + (this.state.activeStepper == this.state.ProtectVMStepper && "active")}>
                    <div className="progress-line"></div>
                    <h5 className="stepper-heading count-heading">
                        <span>4</span>
                    </h5>
                </div>*/}
            </div>
            <div className="row mb-4">
                <div className={"col-lg-6 mobile-width-25per " + (this.state.activeStepper == this.state.basicInfoStepper ? " active" : "")}>
                    <h5 className={"stepper-heading" + (this.state.activeStepper > this.state.basicInfoStepper ? " color-black" : "")}>Basic Info</h5>
                </div>
                <div className={"col-lg-6 mobile-width-25per " + (this.state.activeStepper == this.state.VMDetailsStepper ? "active" : "") + (this.state.activeStepper > this.state.basicInfoStepper && " color-white")}>
                <h5 className={"stepper-heading" + (this.state.activeStepper > this.state.VMDetailsStepper ? " color-black" : "")}>VM Details</h5>
                </div>
                {/* <div className={"col-lg-4 mobile-width-25per " + (this.state.activeStepper == this.state.NetworkInterfaceStepper ? "active" : "") + (this.state.activeStepper > this.state.basicInfoStepper && " color-white")}>
                <h5 className={"stepper-heading" + (this.state.activeStepper > this.state.NetworkInterfaceStepper ? " color-black" : "")}>Backup & GSN</h5>
                </div> */}
                {/*<div className={"col-lg-3 mobile-width-25per " + (this.state.activeStepper == this.state.ProtectVMStepper ? "active" : "") + (this.state.activeStepper > this.state.basicInfoStepper && " color-white")}>
                <h5 className={"stepper-heading" + (this.state.activeStepper > this.state.ProtectVMStepper ? " color-black" : "")}>Add Protection to VM</h5>
                </div>*/}
            </div>
          </div>
          <form
            name="saveOrderInfoFrm"
            id="saveOrderInfoFrm"
            method="post" autoComplete="off"
            onSubmit={this.AddToCart}
            className="mt-4 mb-4"
          >
            <div style={{ marginTop: 20 }}>{JSON.stringify(this.state.inputList)}</div>
            <div className={(this.state.activeStepper != this.state.basicInfoStepper ? "hide":"")}>
                <React.Fragment>
                    {//Basic Info Tab
                    }
                    <input style={{display: "none"}} type="text" name="username" />
                	<input style={{display: "none"}} type="password" name="password" />
                    <div className="row">
	                    <div className="col-lg-6">
	                        <div className="col-lg-12">
	                            <div className="form-group row">
	                                <label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>Subscription<span className="star-mark">*</span></label>                
	                                <div className="col-sm-9">
	                                    <select
	                                    className="form-control"
	                                	value={(this.state.selected_subscription_id != ''?this.state.clientid+"_"+this.state.selected_subscription_id:"")}
	                                    name="subscription"
	                                    onChange={e => this.subscriptionChange(e.target.value,"")}
	                                    id="subscription_id"
	                                    >
	                                    <option value="">--SELECT--</option>
	                                    {subscription_list && subscription_list.length > 0 && subscription_list.map((sub, index) =>
	                                        <option value={sub.clientid+"_"+sub.subscription_id} key={sub.subscription_id}>
	                                            {sub.display_name}
	                                        </option>
	                                    )}
	                                    </select>
	                                </div>
	                            </div>
	                        </div>
	                        <div className="col-lg-12">
	                            <div className="form-group row">
	                                <label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>VM Resource Group<span className="star-mark">*</span></label>                
	                                <div className="col-sm-9">
		                                <select
			                                className="form-control"
			                                name="resourceGroupName"
			                                id="resourceGroupName"
			                                value={this.state.resourceGroupName} 
		                                	onChange={e => this.resourceGroupNameChange(e.target.value,"")}
			                                >
			                                <option value="">--SELECT--</option>
			                                {this.state.resourceGroups && this.state.resourceGroups.length > 0 && this.state.resourceGroups.map((row, index) =>
			                                    <option value={row.name} key={row.id}>
			                                        {row.name}
			                                    </option>
			                                )}
			                            </select>
			                            {this.state.isResourceGroupInprogress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
	                                </div>
	                            </div>
	                        </div>                        
		                    <div className="col-lg-12">
		                        <div className="form-group row">
			                        <label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>Gallery Name<span className="star-mark">*</span></label>                
			                        <div className="col-sm-9">
			                            <select
			                                className="form-control"
			                                name="gallery_name"
			                                id="gallery_name"
			                                value={this.state.gallery_name}
			                            	onChange={e => this.galleryNameChange(e.target.value, "")}
			                                >
			                                <option value="">--SELECT--</option>
			                                {this.state.galleryListData && this.state.galleryListData.length > 0 && this.state.galleryListData.map((row, index) =>
			                                	<React.Fragment key={index}>
			                                		{/*this.state.subscription_provision_type == row.provision_type*/}
				                                	{true && <option value={row.galleryName}>
				                                        {row.galleryName}
				                                    </option>}
			                                    </React.Fragment>
			                                )}
			                            </select>
			                            {this.state.isGalleryNameInprogress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
			                            {/*<br/>
			                            Shared Resource Group : {this.state.sharedimage_resource_group_name}*/}
			                        </div>
			                    </div>
		                        {/*<div className="form-group row">
		                        	<label htmlFor="cpu" className='col-sm-3 col-form-label'>VM Resource Group</label>
		                            <div className="col-sm-9">
		                                <input type="text" disabled value={this.state.resourceGroupName} name="resourceGroupName" className="form-control" />
		                            </div>
		                        </div>*/}
		                    </div>
		                    <div className="col-lg-12">
		                        <div className="form-group row">
		                        	<label htmlFor="cpu" className='col-sm-3 col-form-label azure_api_field_label'>OS Type<span className="star-mark">*</span></label>
		                        	<div className="col-sm-9">
			                            <select
			                                className="form-control"
			                                name="osType"
			                                id="osType"
			                                value={this.state.osType}
			                            	onChange={e => this.osTypeChange(e.target.value, "")}
			                                >
			                                {this.state.osTypeData && this.state.osTypeData.length > 0 && this.state.osTypeData.map((row, index) =>
			                                    <option value={row} key={index}>
			                                        {row}
			                                    </option>
			                                )}
			                            </select>
			                        </div>
		                        </div>            
		                    </div>
		                    <div className="col-lg-12">
		                        <div className="form-group row">
		                        	<label htmlFor="cpu" className='col-sm-3 col-form-label azure_api_field_label'>OS Add-ons<span className="star-mark">*</span></label>
		                        	<div className="col-sm-9">
			                            <select
			                                className="form-control"
			                                name="osMiddleware"
			                                id="osMiddleware"
			                                value={this.state.osMiddleware}
			                            	onChange={e => this.osMiddlewareChange(e.target.value, "")}
			                                >
			                                {this.state.osMiddlewareData && this.state.osMiddlewareData.length > 0 && this.state.osMiddlewareData.map((row, index) =>
			                                    <option value={row.key} key={index}>
			                                        {row.value}
			                                    </option>
			                                )}
			                                {this.state.osMiddlewareData && this.state.osMiddlewareData.length == 0 &&
			                                    <option value="">
			                                        --SELECT--
			                                    </option>
			                                }
			                            </select>
			                            {this.state.isOsMiddlewareInprogress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
			                        </div>
		                        </div>
		                    </div>
		                    <div className="col-lg-12">
		                        <div className="form-group row">
		                        	<label htmlFor="cpu" className='col-sm-3 col-form-label azure_api_field_label'>Image Name<span className="star-mark">*</span></label>
		                        	<div className="col-sm-9">
			                            <select
			                                className="form-control"
			                                name="shared_image_name"
			                                id="shared_image_name"
			                                value={this.state.shared_image_name}
			                            	onChange={e => this.sharedImageNameChange(e.target.value, "")}
			                                >
			                                <option value="">--SELECT--</option>
			                                {this.state.sharedImageNameData && this.state.sharedImageNameData.length > 0 && this.state.sharedImageNameData.map((row, index) =>
			                                    <option value={row.galleryImageName} key={index}>
			                                        {row.galleryImageName}
			                                    </option>
			                                )}
			                            </select>
			                            {this.state.isSharedImageNameInprogress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
			                        </div>
		                        </div>            
		                    </div>
	                        <div className="col-lg-12">
		                        <div className="form-group row">
			                        <label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>Image Version<span className="star-mark">*</span></label>                
			                        {env.env == "dhlonprem" && 
			                        	<div className="col-sm-9 p-t-xxs">
				                        	<input type="hidden" className="form-control" name="shared_image_version" id="shared_image_version" value={this.state.shared_image_version} />
			                                <strong>{this.state.shared_image_version}</strong>
				                            {/*<select
				                                className="form-control"
				                                name="shared_image_version"
				                                id="shared_image_version"
				                                value={this.state.shared_image_version}
				                            	onChange={e => this.sharedImageVersionChange(e.target.value, "")}
				                                >
				                                <option value="">--SELECT--</option>
				                                {this.state.sharedImageVersionData && this.state.sharedImageVersionData.length > 0 && this.state.sharedImageVersionData.map((row, index) =>
				                                    <option value={row.galleryImageVersionName} key={index}>
				                                        {row.galleryImageVersionName}
				                                    </option>
				                                )}
				                            </select>
				                            {this.state.isSharedImageVersionInprogress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }*/}
				                        </div>}
			                        {env.env != "dhlonprem" && 
			                        	<div className="col-sm-9">
				                            <select
				                                className="form-control"
				                                name="shared_image_version"
				                                id="shared_image_version"
				                                value={this.state.shared_image_version}
				                            	onChange={e => this.sharedImageVersionChange(e.target.value, "")}
				                                >
				                                <option value="">--SELECT--</option>
				                                {this.state.sharedImageVersionData && this.state.sharedImageVersionData.length > 0 && this.state.sharedImageVersionData.map((row, index) =>
				                                    <option value={row.galleryImageVersionName} key={index}>
				                                        {row.galleryImageVersionName}
				                                    </option>
				                                )}
				                            </select>
				                            {this.state.isSharedImageVersionInprogress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
				                        </div>}
			                    </div>
	                            {/*<div className="form-group row">
	                            	<label htmlFor="cpu" className='col-sm-3 col-form-label'>VM Resource Group</label>
	                                <div className="col-sm-9">
	                                    <input type="text" disabled value={this.state.resourceGroupName} name="resourceGroupName" className="form-control" />
	                                </div>
	                            </div>*/}
	                        </div>
	                        <div className="col-lg-12">
		                        <div className="form-group row">
		                            <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Environment<span className="star-mark">*</span></label>                
		                            <div className="col-sm-9">
		                                <select
			                                className="form-control"
			                                name="environment"
			                                id="environment"
			                                value={this.state.environment}
		                                	onChange={e => this.environmentChange(e.target.value)}
			                                >
			                                <option value="">--SELECT--</option>
			                                {this.state.environmentData && this.state.environmentData.length > 0 && this.state.environmentData.map((row, index) =>
		                                        <option value={row.key} key={index}>
		                                            {row.value}
		                                        </option>
		                                    )}
		                                </select>
		                            </div>
		                        </div>
		                    </div>
		                    {/*<div className="col-lg-12">
		                        <div className="form-group row">
		                            <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>System Name<span className="star-mark">*</span></label>                
		                            <div className="col-sm-9">
		                                <select
			                                className="form-control"
		                                	defaultValue={this.state.system_name}
			                                name="system_name"
			                                id="system_name"
		                                	onChange={e => this.changeSystemName(e.target.value)}
			                                >
			                                <option value="">--SELECT--</option>
			                                {dropdownData && dropdownData.Azure_System_Name && dropdownData.Azure_System_Name.length > 0 && dropdownData.Azure_System_Name.map((row, index) =>
		                                        <option value={row.key} key={index}>
		                                            {row.value}
		                                        </option>
		                                    )}
		                                </select>
		                            </div>
		                        </div>
		                    </div>*/}
		                    {/*<div className="col-lg-12">
		                        <div className="form-group row">
		                            <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>System Type<span className="star-mark">*</span></label>                
		                            <div className="col-sm-9">
		                                <select
			                                className="form-control" readOnly
		                                	value={this.state.selected_system_type}
			                                name="system_type"
			                                id="system_type"
		                                	onChange={e => this.changeSystemType(e.target.value)}
			                                >
			                                <option value="">--SELECT--</option>
			                                {dropdownData && dropdownData.Azure_System_Type && dropdownData.Azure_System_Type.length > 0 && dropdownData.Azure_System_Type.map((row, index) =>
		                                        <option value={row.key} key={index}>
		                                            {row.value}
		                                        </option>
		                                    )}
		                                </select>
		                            </div>
		                        </div>
		                    </div>*/}
		                    <div className="col-lg-12">
		                        <div className="form-group row">
		                            <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Network Identify<span className="star-mark">*</span></label>                
		                            <div className="col-sm-9">
		                                <select
			                                className="form-control"
		                                	value={this.state.network_identify}
			                                name="network_identify"
			                                id="network_identify"
		                                	onChange={e => this.changeNetworkIdentify(e.target.value)}
			                                >
			                                <option value="">--SELECT--</option>
			                                {dropdownData && dropdownData.Azure_Network_Identify && dropdownData.Azure_Network_Identify.length > 0 && dropdownData.Azure_Network_Identify.map((row, index) =>
		                                        <option value={row.key} key={index}>
		                                            {row.value}
		                                        </option>
		                                    )}
		                                </select>
		                            </div>
		                        </div>
		                    </div>
		                    {this.state.DISPLAY_ALL_NETWORK_RESOURCES == 1 && 
				                <div className="col-lg-12">
				                    <div className="form-group row">
				                    	<label htmlFor="cpu" className='col-sm-3 col-form-label azure_api_field_label'>Network Resource Group<span className="star-mark">*</span></label>
				                        <div className="col-sm-9">
				                            <select
				                                className="form-control"
				                                name="networkResourceGroupName"
				                                id="networkResourceGroupName"
		                                        onChange={e => this.load_virtual_networks_locationwise(e.target.value)}
				                                >
				                                <option value="">--SELECT--</option>
				                                {this.state.DISPLAY_ALL_NETWORK_RESOURCES == 1 && this.state.networkResourceGroup && this.state.networkResourceGroup.length > 0 && this.state.networkResourceGroup.map((row, index) =>
				                                    <option value={row.name} key={row.id}>
				                                        {row.name}
				                                    </option>
				                                )}
				                                {this.state.DISPLAY_ALL_NETWORK_RESOURCES == 0 && 
				                                    <option value="default">default</option>
				                                }
				                            </select>
				                            {this.state.isResourceGroupInprogress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
				                        </div>
				                    </div>            
				                </div>
			                }
			                {this.state.DISPLAY_ALL_NETWORK_RESOURCES == 0 && 
			                	<React.Fragment>
					                <div className="col-lg-12">
					                    <div className="form-group row">
					                    	<label htmlFor="cpu" className='col-sm-3 col-form-label azure_api_field_label'>Network Resource Group<span className="star-mark">*</span></label>
					                        <div className="col-sm-9 p-t-xxs">
						                        <input type="hidden" className="form-control" name="networkResourceGroupName" id="networkResourceGroupName" value="default"/>
						                		<strong>default</strong>
					                        </div>
					                    </div>            
					                </div>
			                		
		                		</React.Fragment>
			                }
		                    <div className="col-lg-12">
		                        <div className="form-group row">
		                            <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Region<span className="star-mark">*</span></label>                
		                            <div className="col-sm-9 p-t-xxs">
		                                <select
			                                className="form-control"
			                                name="region"
			                                id="region" value={this.state.region}
	                                        onChange={e => this.regionChange(e.target.value)}
			                                >
			                                <option value="">--SELECT--</option>
			                                {this.state.Azure_Regions_Data && this.state.Azure_Regions_Data.length > 0 && this.state.Azure_Regions_Data.map((row, index) =>
		                                        <option value={row.key} key={index}>
		                                            {row.value}
		                                        </option>
		                                    )}
		                                </select>
		                                {/*<input type="hidden" className="form-control" name="region" id="region" />
		                                <strong>{this.state.selected_region}</strong>*/}
		                            </div>
		                        </div>
		                    </div>
		                    <div className="col-lg-12">
	                            <div className="form-group row">
	                                <label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>Virtual Network<span className="star-mark">*</span></label>                
	                                <div className="col-sm-9">
	                                    <select
	                                        className="form-control"
	                                        name="virtualNetwork" id="virtualNetwork"
	                                        onChange={e => this.virtualNetworkChange(e.target.value)}
	                                        >
	                                    <option value="">--SELECT--</option>
	                                    {this.state.virtualNetwork && this.state.virtualNetwork.length > 0 && this.state.virtualNetwork.map((row, index) =>
	                                        <option value={row.name} key={index}>
	                                            {row.name}
	                                        </option>
	                                    )}
	                                    </select>
	                                    {this.state.virtualNetworkInProgress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
	                                </div>
	                            </div>
	                        </div>
			                <div className="col-lg-12">
			                    <div className="form-group row">
			                        <label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>Subnet<span className="star-mark">*</span></label>                
			                        <div className="col-sm-9">
			                            <select
			                                className="form-control"
			                            	name="subnet" id="subnet"
			                        		value={this.state.selectedSubnet}
			                                onChange={e => this.subnetChange(e.target.value)}
			                                >
			                            <option value="">--SELECT--</option>
			                            {this.state.subnets && this.state.subnets.length > 0 && this.state.subnets.map((row, index) =>
			                                <option value={row.name} key={index}>
			                                    {row.name}
			                                </option>
			                            )}
			                            </select>
			                        </div>
			                    </div>
			                </div>
		                    {/*<div className="col-lg-12">
		                        <div className="form-group row">
		                            <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Is Backup Required <span className="star-mark">*</span></label>                
		                            <div className="col-sm-9">
		                                <select
			                                className="form-control"
		                                	value={this.state.backupType}
			                                name="backupType"
			                                id="backupType"
		                                	onChange={e => this.changeBackupType(e.target.value)}
			                                >
			                                <option value="Yes">Yes</option>
			                                <option value="No">No</option>
		                                </select>
		                            </div>
		                        </div>
		                    </div>*/}
		                    <div className="col-lg-12">
		                        <div className="form-group row">
		                        <label htmlFor="cpu" className='col-sm-3 col-form-label'>VM Selection</label>
		                            <div className="col-sm-9 p-t-xs">
			                            <input type="radio" checked={(this.state.vm_selection == "Quantity")} id="vm_selection_quantity" name="vm_selection" value="Quantity" onChange={this.bindField}></input>&nbsp;
		                                <label htmlFor="vm_selection_quantity">Quantity</label>&nbsp;&nbsp;
		                                <input type="radio" checked={(this.state.vm_selection == "Clustering")} id="vm_selection_clustering" name="vm_selection" value="Clustering" onChange={this.bindField}></input>&nbsp;
		                                <label htmlFor="vm_selection_clustering">Cluster</label>                           
		                            </div>
		                        </div>            
		                    </div>
		                    {(this.state.vm_selection == "Clustering" || this.state.vm_selection == "Quantity") &&
			                    <div className="col-lg-12">
			                        <div className="form-group row">
			                            <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>VM Count<span className="star-mark">*</span></label>                
			                            <div className="col-sm-9">
			                                <select
				                                className="form-control"
				                                name="vm_count"
				                                id="vm_count"
			                                	onChange={this.bindField}
				                                >
			                                {/*disabled={(row==1 && this.state.vm_selection == "Clustering")}*/}
				                                {this.state.vm_count_arr.map((row, index) =>
			                                        <option value={row} key={index} >
			                                            {row}
			                                        </option>
			                                    )}
			                                </select>
			                            </div>
			                        </div>
			                    </div> 
		                    }
			                {(true || this.state.vm_selection == "Clustering") &&
			                	<React.Fragment>
				                    <div className="col-lg-12">
				                        <div className="form-group row">
				                        <label htmlFor="cpu" className='col-sm-3 col-form-label'>Availability Set/Zone</label>
				                            <div className="col-sm-9 p-t-xs">
					                            <input type="radio" checked={(this.state.availability_set_or_zone == "Zone")} id="availability_set_or_zone_zone" name="availability_set_or_zone" value="Zone" onChange={this.bindField}></input>&nbsp;
				                                <label htmlFor="availability_set_or_zone_zone">Zone</label>&nbsp;&nbsp;
				                                <input type="radio" checked={(this.state.availability_set_or_zone == "Set")} id="availability_set_or_zone_set" name="availability_set_or_zone" value="Set" onChange={this.bindField}></input>&nbsp;
				                                <label htmlFor="availability_set_or_zone_set">Set</label>&nbsp;&nbsp;
				                                {this.state.vm_selection != "Clustering" && 
				                                	<React.Fragment>
				                                		<input type="radio" checked={(this.state.availability_set_or_zone == "None")} id="availability_set_or_zone_none" name="availability_set_or_zone" value="None" onChange={this.bindField}></input>&nbsp;
				                                		<label htmlFor="availability_set_or_zone_none">None</label>
			                                		</React.Fragment>
				                                }
				                            </div>
				                        </div>            
				                    </div>
				                </React.Fragment>
			                }
			                {(true || this.state.vm_selection == "Clustering") && this.state.availability_set_or_zone == "Set" &&
			                	<React.Fragment>
				                    <div className="col-lg-12">
				                        <div className="form-group row">
				                            <label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>Availability Set Name<span className="star-mark">*</span></label>                
				                            <div className="col-sm-9">
				                                <select
					                                className="form-control"
					                                name="availability_set_name"
					                                id="availability_set_name"
				                                	onChange={this.bindField}
					                                >
				                                	<option value="">--SELECT--</option>
					                                {this.state.availabilitySetNameData.map((row, index) =>
				                                        <option value={row.name} key={index}>
				                                            {row.name}
				                                        </option>
				                                    )}
				                                </select>
				                                {this.state.isAvailabilitySetNameInprogress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
				                                <br/>
				                                <span className="anch-link small-anch-link cursor-pointer" onClick={() => this.createNewAvailabilitySetPopupClick()}>Create New</span>
		
				                                <Modal
				                                    isOpen={this.state.createNewAvailabilitySetPopup}
				                                    onRequestClose={this.createNewAvailabilitySetPopupCloseModal}
				                                    >
				                                    <h2>Create Availability Set <span className="float-right cursor-pointer" onClick={this.createNewAvailabilitySetPopupCloseModal}><i className="fa fa-times" /></span>
				                                    </h2>                                    
				                                    <div className="dataTables_wrapper dt-bootstrap4 mt-4" onKeyDown={(e) => this.popupFormSubmit(e, 'set')}>
				                                        <div className="row">
				                                            <div className="col-lg-12">
				                                                <div className="form-group row">
				                                                    <label htmlFor="cloud_type" className='col-sm-5  col-form-label'>Subscription Id</label>                
				                                                    <div className="col-sm-7">
				                                                         {this.state.selectedSubscriptionLabel}
				                                                    </div>
				                                                </div>
				                                            </div>
				                                            <div className="col-lg-12">
				                                                <div className="form-group row">
				                                                    <label htmlFor="cloud_type" className='col-sm-5  col-form-label'>Resource Group</label>                
				                                                    <div className="col-sm-7">
				                                                         {this.state.resourceGroupName}
				                                                    </div>
				                                                </div>
				                                            </div>
				                                            <div className="col-lg-12">
				                                                <div className="form-group row">
				                                                    <label htmlFor="cloud_type" className='col-sm-5  col-form-label'>Location</label>                
				                                                    <div className="col-sm-7">
				                                                         {this.state.selected_region_location_name}
				                                                    </div>
				                                                </div>
				                                            </div>
				                                            <div className="col-lg-12">
				                                                <div className="form-group row">
				                                                    <label htmlFor="cloud_type" className='col-sm-5  col-form-label'>Set Name</label>                
				                                                    <div className="col-sm-7">
				                                                        <input type="text"  name="availability_set_name_new" className="form-control" onChange={this.bindField} value={this.state.availability_set_name_new} />
				                                                    </div>
				                                                </div>
				                                            </div>
				                                        </div>
				                                        <div className="row">
				                                            <div className="col-lg-12">
				                                                <div className="form-group row">
				                                                    <div className="col-sm-12 text-right">
				                                                        <span
				                                                        className={"btn btn-primary cursor-pointer " + (this.state.isCreateNewAvailabilitySetInprogress ? "no-access" : "")} disabled={this.state.isCreateNewAvailabilitySetInprogress ? true : false}  onClick={() => this.createNewAvailabilitySetClick()}>
				                                                        {this.state.isCreateNewAvailabilitySetInprogress && <i className="fas fa-circle-notch icon-loading"></i> }
				                                                        Create</span>
				                                                    </div>
				                                                </div>
				                                            </div>
				                                        </div>
				                                    </div>
				                                </Modal>
				                            </div>
				                        </div>
				                    </div> 
			                    </React.Fragment>
			                }
		                </div>
		            </div>
                </React.Fragment>
            </div>
            
            <div className={(this.state.activeStepper != this.state.VMDetailsStepper ? "hide":"")}>
                <React.Fragment>
                    <div className="row">
                        <div className="col-lg-6">
                            <div className="form-group row">
                                <label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>VM Size<span className="star-mark">*</span></label>                
                                <div className="col-sm-9 pt-2 overflow-wrap">
                                    {this.state.vm_size_name && <i className="color-black pr-4">{this.state.vm_size_name}</i> }
                                    <span className="anch-link cursor-pointer" onClick={this.vm_size_popup}>{ (this.state.vm_size_name ? "Change" : "Select") } VM Size</span>
                                    <br/>
                                    {this.state.vm_cpus && <i className="color-black pr-4">vCPUS : <strong>{this.state.vm_cpus}</strong></i> }
                                    {this.state.vm_ram && <i className="color-black pr-4">Memory : <strong>{(this.state.vm_ram ? (this.state.vm_ram >= 1024 ? this.state.vm_ram/1024 : this.state.vm_ram) : "0") + (this.state.vm_ram >= 1024 ? " GB" : " MB")}</strong></i> }
                                    <Modal
                                        isOpen={this.state.vm_size_popup}
                                        onRequestClose={this.vm_size_popupCloseModal} className="metrics"
                                        >
                                        <h2 style={{lineHeight:1.6+ 'em' }}>
                                            VM Size <span className="float-right cursor-pointer" onClick={this.vm_size_popupCloseModal}><span className="btn btn-primary">Save</span></span>
                                        </h2>
                                        <div className="col-sm-12">
	    			                    	<span><span className="anch-link">Note :</span> For Oracle Prod VM's please select SKU D series or higher.</span>
	    			                    </div>
                                        {this.state.isVmSizeListLoading && <PageLoader/> }

                                        {this.state.vmSize.rows && this.state.vmSize.rows.length > 0 &&
                                            <div className="dataTables_wrapper dt-bootstrap4 mt-4">
                                                <MDBDataTable
                                                striped
                                                hover
                                                data={this.state.vmSize}
                                                />
                                            </div>
                                        }
                                    </Modal>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
	                        <div className="form-group row">
	                            <label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>OS Type</label>
	                            <div className="col-sm-9 pt-2 overflow-wrap">
	                            	<strong>{this.state.os_type}</strong>
	                                <input type="hidden"  name="os_type" disabled className="form-control" onChange={this.bindField} value={this.state.os_type} />
	                            </div>
	                        </div>
	                    </div>
                    </div>
                    <div className="row">
	                    <div className="col-lg-6">
				          <div className="form-group row">
				              <label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>OS Storage Type<span className="star-mark">*</span></label>
				              <div className="col-sm-9 pt-2 overflow-wrap">
					              <select
				                      className="form-control"
				                      value={this.state.storageAccountType}
					              	  id="storageAccountType"
				                      name="storageAccountType"
			                    	  onChange={this.bindField}
				                      >
				                      <option value="">--SELECT--</option>
				                      {this.state.storageTypesList && this.state.storageTypesList.length > 0 && this.state.storageTypesList.map((row, index) =>
				                    	  <React.Fragment key={index}>
					                    	  {(this.state.vmSizePremiumIO == 'True' || (this.state.vmSizePremiumIO != 'True' && row != 'Premium_LRS')) && 
							                      <option value={row}>
							                          {row}
							                      </option>
					                    	  }
					                      </React.Fragment>
				                      )}
			                      </select>
		                      </div>
				          </div>
				      </div>
				      {(typeof this.state.acceleratedNetworkingEnabled != "undefined" && this.state.acceleratedNetworkingEnabled != "") && <div className="col-lg-6">
	                      <div className="form-group row">
	                          <label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>Accelerated Networking Enabled</label>
	                          <div className="col-sm-9 pt-2 overflow-wrap">
	                          	<strong>{this.state.acceleratedNetworkingEnabled}</strong>
	                          </div>
	                      </div>
	                  </div>}
				    </div>
                    <div className="row">
	                    <div className="col-lg-12">
			                <div className="form-group row">
			                    <div className="col-sm-12">
			                    	<span><span className="anch-link">Note :</span> Mv2-series, DC-series, NDv2-series, Msv2 and Mdsv2-series Medium Memory do not support Generation 1 VM images and only support a subset of Generation 2 images</span>
			                    </div>
			                </div>
			            </div>
		            </div>

                    {/*<div className="row">
                        <div className="col-lg-6">
                            <div className="form-group row">
                                <label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>OS Disk Size</label>
                                <div className="col-sm-9 pt-2 position-relative">
                                    <input type="text"  name="disksize" disabled className="form-control" onChange={this.bindField} value={this.state.disksize} />
                                    <span className="disk_size_gb">GB</span>
                                </div>
                            </div>
                        </div>
                    </div>*/}
                    {this.createVmUI()}
                </React.Fragment>
            </div>

            <div className={(this.state.activeStepper != this.state.NetworkInterfaceStepper ? "hide":"")}>
                <React.Fragment>
	                {/*<div className="row">
		                {this.state.vmList.map((vmRow, index) =>
		                	<React.Fragment key={index}>
			                    <div className="col-lg-6">
			                        <div className="form-group row">
			                            <label htmlFor="networkInterface" className='col-sm-3  col-form-label'>VM NIC {(index+1)}<span className="star-mark">*</span></label>
			                            <div className="col-sm-9">
				                            <input
					                            type="text"
					                            className="form-control"
					                            name="selectedNIC" readOnly
				                            	onChange={this.handleZoneChange.bind(this, index)}
				                            	value={vmRow.selectedNIC} 
					                            placeholder="NIC"
				                            />
				                        </div>
				                    </div>
				                </div>
		                    </React.Fragment>
		                )}
		        </div>
		        <div className="row">
		        	<div className="col-lg-12">
		        		<span className="star-mark">*</span> IP is Auto-assigned. Network Accelerator enabled
		        		{this.state.validateAvailableIpsCount &&
		        			<React.Fragment>
		        				<br/>Available Ips Count : <strong>{this.state.availableIpsCount}</strong>
	        				</React.Fragment>
		        		}
		        		
		        	</div>
		        </div>
		        <hr/>*/}
	                <div className="row">
		            	<div className="col-lg-6">
		                    <div className="form-group row">
		                        <label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>Backup Resource Group<span className="star-mark">*</span></label>                
		                        <div className="col-sm-9">
		                            <select
		                                className="form-control"
		                                name="backup_resource_group_name"
		                                id="backup_resource_group_name"
	                                	value={this.state.backup_resource_group_name} onChange={e => this.backupResourceGroupNameChange(e.target.value)}
		                                >
		                                <option value="">--SELECT--</option>
		                                {this.state.backupResourceGroups && this.state.backupResourceGroups.length > 0 && this.state.backupResourceGroups.map((row, index) =>
		                                    <option value={row.name} key={row.id}>
		                                        {row.name}
		                                    </option>
		                                )}
		                            </select>
		                            {this.state.isResourceGroupInprogress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
		                        </div>
		                    </div>
		                </div>                        
		                <div className="col-lg-6">
		                    <div className="form-group row">
		                        <label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>Backup Vault Name<span className="star-mark">*</span></label>                
		                        <div className="col-sm-9">
		                            <select
		                                className="form-control"
		                                name="recovery_vault_name"
		                                id="recovery_vault_name"
	                                	value={this.state.recovery_vault_name} onChange={e => this.recoveryVaultNameChange(e.target.value)}
		                                >
		                                <option value="">--SELECT--</option>
		                                {this.state.recoveryVaultNameData && this.state.recoveryVaultNameData.length > 0 && this.state.recoveryVaultNameData.map((row, index) =>
		                                    <option value={row.name} key={index}>
		                                        {row.name}
		                                    </option>
		                                )}
		                            </select>
		                            {this.state.isRecoveryVaultNameInprogress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
		                        </div>
		                    </div>
		                </div>
		        	</div>
		        	<div className="row">
		            	<div className="col-lg-6">
		                    <div className="form-group row">
		                        <label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>Backup Vault Policy<span className="star-mark">*</span></label>                
		                        <div className="col-sm-9">
		                            <select
		                                className="form-control"
		                                name="backup_policy"
		                                id="backup_policy"
	                                	value={this.state.backup_policy} onChange={e => this.backupPolicyChange(e.target.value)}
		                                >
		                                <option value="">--SELECT--</option>
		                                {this.state.backupPolicyData && this.state.backupPolicyData.length > 0 && this.state.backupPolicyData.map((row, index) =>
		                                    <option value={row.name} key={index}>
		                                        {row.name}
		                                    </option>
		                                )}
		                            </select>
		                            {this.state.isBackupPolicyInprogress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
		                        </div>
		                    </div>
		                </div>                        
		                <div className="col-lg-6">
		                    <div className="form-group row">
		                        <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>NetBackup Policy<span className="star-mark">*</span></label>                
		                        <div className="col-sm-9 p-t-xxs">
		                            {this.state.Netbackup_policy}
		                        </div>
		                    </div>
		                </div>
		        	</div>
		        	<div className="row">
		                {this.state.db_full_backup && <div className="col-lg-6">
		                    <div className="form-group row">
		                        <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>DB Full Backup Policy<span className="star-mark">*</span></label>                
		                        <div className="col-sm-9 p-t-xxs">
		                            {this.state.db_full_backup}
		                        </div>
		                    </div>
		                </div>}
		                {this.state.db_log_backup && <div className="col-lg-6">
		                    <div className="form-group row">
		                        <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>DB Log Backup Policy<span className="star-mark">*</span></label>                
		                        <div className="col-sm-9 p-t-xxs">
		                            {this.state.db_log_backup}
		                        </div>
		                    </div>
		                </div>}
		                {false && this.state.db_backup && <div className="col-lg-6">
		                    <div className="form-group row">
		                        <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>DB Backup Policy<span className="star-mark">*</span></label>                
		                        <div className="col-sm-9 p-t-xxs">
		                            {this.state.db_backup}
		                        </div>
		                    </div>
		                </div>}
		                {this.state.db_backup2 && <div className="col-lg-6">
		                    <div className="form-group row">
		                        <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>NB SQL Group<span className="star-mark">*</span></label>                
		                        <div className="col-sm-9 p-t-xxs">
		                            {this.state.db_backup2}
		                        </div>
		                    </div>
		                </div>}
		        	</div>
		        	<hr/>
	                <div className="row">
	                	<div className="col-lg-6">
	                		<div className="form-group row">
	                    		<label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>Storage Resource Group<span className="star-mark">*</span></label>                
	                    		<div className="col-sm-9">
	                    		<select className="form-control" name="storage_resource_group_name" id="storage_resource_group_name"
	                            value={this.state.storage_resource_group_name} onChange={e => this.storageResourceGroupNameChange(e.target.value,"")}
	                            >
	                            	<option value="">--SELECT--</option>
	                            {this.state.storageResourceGroups && this.state.storageResourceGroups.length > 0 && this.state.storageResourceGroups.map((row, index) =>
	                                <option value={row.name} key={row.id}>
	                                    {row.name}
	                                </option>
	                            )}
	                            </select>
	                            {this.state.isResourceGroupInprogress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
	                        	</div>
	                        </div>
	                    </div>
	                    <div className="col-lg-6">
	                		<div className="form-group row">
	                			<label htmlFor="cloud_type" className='col-sm-3  col-form-label azure_api_field_label'>Storage Account Name<span className="star-mark">*</span></label>                
	                			<div className="col-sm-9">
	                			<select className="form-control" name="storage_account_name"
	                				value={this.state.storage_account_name} onChange={this.bindField}
	                			>
	                				<option value="">--SELECT--</option>
	                				{this.state.storageAccountNames && this.state.storageAccountNames.length > 0 && this.state.storageAccountNames.map((row, index) =>
	                					<option value={row.name} key={index}>{row.name}</option>
	                				)}
	                			</select>
	                				{this.state.isStorageAccountNameInprogress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
	                			</div>
	                		</div>
	                	</div>
			        </div>
			        <div>Global ServiceNow</div>
			        <hr/>
	                <div className="row">
	                	{this.state.cmdbRegions && this.state.cmdbImpacts.length > 0 && 
		                	<div className="col-lg-6">
		                		<div className="form-group row">
		                    		<label htmlFor="cloud_type" className='col-sm-3  col-form-label '>Impact<span className="star-mark">*</span></label>                
		                    		<div className="col-sm-9">
		                    		<select className="form-control" name="cmdbImpact" id="cmdbImpact"
		                            value={this.state.cmdbImpact} onChange={this.bindField}
		                            >
		                            	<option value="">--SELECT--</option>
		                            {this.state.cmdbImpacts && this.state.cmdbImpacts.length > 0 && this.state.cmdbImpacts.map((row, index) =>
			                            <option value={row.label_value+"@$"+ row.label_name} key={index}>
		                                    {row.label_name}
		                                </option>
		                            )}
		                            </select>
		                        	</div>
		                        </div>
		                    </div>
	                	}
	                	{this.state.cmdbBuData && this.state.cmdbBuData.length > 0 && 
		                	<div className="col-lg-6">
		                		<div className="form-group row">
		                    		<label htmlFor="cloud_type" className='col-sm-3  col-form-label '>Impacted Business Unit<span className="star-mark">*</span></label>                
		                    		<div className="col-sm-9">
		                    		<select className="form-control" name="cmdbBuUnit" id="cmdbBuUnit"
		                            value={this.state.cmdbBuUnit} onChange={this.bindField}
		                            >
		                            	<option value="">--SELECT--</option>
		                            {this.state.cmdbBuData && this.state.cmdbBuData.length > 0 && this.state.cmdbBuData.map((row, index) =>
		                                <option value={row.bu_name} key={row.id}>
		                                    {row.bu_name}
		                                </option>
		                            )}
		                            </select>
		                        	</div>
		                        </div>
		                    </div>
	                	}
	                	{this.state.cmdbCountries && this.state.cmdbCountries.length > 0 && 
		                	<div className="col-lg-6">
		                		<div className="form-group row">
		                    		<label htmlFor="cloud_type" className='col-sm-3  col-form-label '>Impacted Country<span className="star-mark">*</span></label>                
		                    		<div className="col-sm-9">
			                    		{/*<select className="form-control" name="cmdbCountry" id="cmdbCountry"
				                            value={this.state.cmdbCountry} onChange={this.bindField}
				                            >
				                            	<option value="">--SELECT--</option>
				                            {this.state.cmdbCountries && this.state.cmdbCountries.length > 0 && this.state.cmdbCountries.map((row, index) =>
				                                <option value={row.u_code+"@$"+ row.u_name} key={row.id}>
				                                    {row.u_code+" - "+ row.u_name}
				                                </option>
				                            )}
			                            </select>*/}
			                    		<span
						                    className="d-inline-block"
						                    data-toggle="popover"
						                    data-trigger="focus"
						                    data-content="Please seleet Country(s)" style={{width:'100%'}}
						                  >
						                    <ReactSelect
						                      options={this.state.cmdbCountriesMod}
						                      isMulti
						                      closeMenuOnSelect={false}
						                      hideSelectedOptions={false}
						                      components={{
						                    	  reactSelectComponentOption
						                      }}
						                      onChange={this.onImpactedCountriesChange.bind(this)}
						                      allowSelectAll={true}
						                      value={this.state.optionsCmdbSelectedCountries}
						                    />
					                    </span>
		                        	</div>
		                        </div>
		                    </div>
	                	}
	                    {this.state.cmdbRegions && this.state.cmdbRegions.length > 0 && 
		                	<div className="col-lg-6">
		                		<div className="form-group row">
		                    		<label htmlFor="cloud_type" className='col-sm-3  col-form-label '>Impacted Region<span className="star-mark">*</span></label>                
		                    		<div className="col-sm-9">
			                    		{/*<select className="form-control" name="cmdbRegion" id="cmdbRegion"
				                            value={this.state.cmdbRegion} onChange={this.bindField}
				                            >
				                            	<option value="">--SELECT--</option>
				                            {this.state.cmdbRegions && this.state.cmdbRegions.length > 0 && this.state.cmdbRegions.map((row, index) =>
					                            <option value={row.u_code+"@$"+ row.u_name} key={row.id}>
				                                    {row.u_code+" - "+ row.u_name}
				                                </option>
				                            )}
			                            </select>*/}
			                    		<span className="d-inline-block"
						                    data-toggle="popover"
						                    data-trigger="focus"
						                    data-content="Please seleet Region(s)" style={{width:'100%'}}
						                  >
						                    <ReactSelect
						                      options={this.state.cmdbRegionsMod}
						                      isMulti
						                      closeMenuOnSelect={false}
						                      hideSelectedOptions={false}
						                      components={{
						                    	  reactSelectComponentOption
						                      }}
						                      onChange={this.onImpactedRegionsChange.bind(this)}
						                      allowSelectAll={true}
						                      value={optionsCmdbSelectedRegions}
						                    />
																										{(optionsCmdbSelectedRegions || []).map(region => region.value.split('@$')[0]).join(', ')}
					                    </span>
		                        	</div>
		                        </div>
		                    </div>
	                	}
	                	{this.state.cmdbServices && this.state.cmdbServices.length > 0 && 
		                	<div className="col-lg-6">
		                		<div className="form-group row">
		                    		<label htmlFor="cloud_type" className='col-sm-3  col-form-label '>Impacted Service<span className="star-mark">*</span></label>                
		                    		<div className="col-sm-9">
		                    		<select className="form-control" name="cmdbService" id="cmdbService"
		                            value={this.state.cmdbService} onChange={this.bindField}
		                            >
		                            	<option value="">--SELECT--</option>
		                            {this.state.cmdbServices && this.state.cmdbServices.length > 0 && this.state.cmdbServices.map((row, index) =>
			                            <option value={row.u_name+"@$"+row.sys_id} key={index}>
		                                    {row.u_name}
		                                </option>
		                            )}
		                            </select>
		                        	</div>
		                        </div>
		                    </div>
	                	}
			        </div>
                </React.Fragment>
            </div>

            {/*<div className={(this.state.activeStepper != this.state.ProtectVMStepper ? "hide":"")}>
                <React.Fragment>
                    <div className="row">
                        <div className="col-lg-6">
                            <div className="form-group row">
                                <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>User name</label>                
                                <div className="col-sm-9">
                                    <input type="text" placeholder="Ex: vm_user_name" autoComplete="new-password" name="username" id="username" className="form-control" readOnly onBlur={() => this.userNameBlur()} onChange={this.userNameChange} value={this.state.username}  />
                                    {
                                        this.state.userNameValidate == "checking" &&
                                        <i className="fas fa-circle-notch icon-loading txt-loader-icon"></i>
                                    }
                                    {
                                        this.state.userNameValidate == "fail" && 
                                        <i title={this.state.userValidationName} className="fa fa-exclamation-triangle txt-error-icon txt-loader-icon"></i>
                                    }
                                    {
                                        this.state.userNameValidate == "success" && 
                                        <i title="User name validated" className="fa fa-check-circle txt-loader-icon txt-succses-icon"></i>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row">
	                    <div className="col-lg-6">
	                        <div className="form-group row">
	                            <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Password</label>                
	                            <div className="col-sm-9">
	                                <input type="password" placeholder="******" autoComplete="new-password" name="password" id="password" className="form-control" readOnly onChange={this.bindField} value={this.state.password}  />
	                            </div>
	                        </div>
	                    </div>
	                    <div className="col-lg-6">
	                        <div className="form-group row">
	                            <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Conf. Password</label>                
	                            <div className="col-sm-9">
	                                <input type="password" placeholder="******" autoComplete="new-password" name="confirmPassword" id="confirmPassword" className="form-control" readOnly onChange={this.bindField} value={this.state.confirmPassword}  />
	                            </div>
	                        </div>
	                    </div>
	                </div>
	                <div>
	                	<strong>Password Rules <span className="star-mark">*</span> :</strong>
	                	<br/>
	                	<ul>
	                		<li>New Password Must be at least 12 characters.</li>
	                		<li>New Password Must not be greater than 32 characters.</li>
	                		<li>New Password Must be Contain Atleast one Small and one Capital letter</li>
	                		<li>New Password Must be Contain Atleast one number</li>
	                		<li>These Special characters are not allowed in New Password(.,()% )</li>
	                		<li>New Password Must be Contain atleast one special character( like @,=,!,&,#,$,^,*,?,_,~,- )</li>
                		</ul>
	                </div>
                </React.Fragment>
            </div>*/}

            <div className="form-group row mt-4 pb-4">
                <div className="col-lg-6">
                    <div className="form-group row">
                        <div className="col-sm-12">
                        </div>
                    </div>
                </div>
                <div className="col-lg-6">
                    <div className="form-group row">
                    	<label htmlFor="cloud_type" className='col-sm-3  col-form-label display-only-desktop'>{/*Price*/}</label>
                        <div className="col-sm-9 line-height">
                        	{/*<strong>
                            	<span className="display-only-mobile pr-1 price-mobile-text">Price:</span>
                                <span id="priceText" className="currency-symbol color">
                                    {commonFns.fnFormatCurrency((Number(this.state.vm_price) + Number(this.state.os_price) + Number(this.state.disk_price)))}
                                </span>
                            </strong>*/}
																												{this.state.activeStepper == 3 &&
																												<React.Fragment>
																													{/*<div className="row">
																														<div className="col-md-6">
																															<input type="text" 
																																maxLength="4" placeholder="Captcha" autoComplete="off" 
																																name="inpCaptcha" className="form-control-captcha-text"  
																																onChange={this.onCaptchaChange.bind(this)}
																																value={inpCaptcha} />
																														</div>
																														<div className="col-md-6 pl-0">
																															<div className="captcha-wrapper form-control input-field-capcha input-md round">
																																<span className="form-control-captcha" dangerouslySetInnerHTML={{ __html: svg }} /> 
																																<i class="fas fa-sync btn-refresh-captcha" onClick={this.getCaptcha.bind(this)}></i>
																															</div>
																														</div>
																													</div>*/}
																													<button name="submit" className={"ml-2 btn btn-primary float-right " + (this.state.isCartAddingInprogress ? "no-access" : "")} disabled={this.state.isCartAddingInprogress ? true : false}>
                                {this.state.isCartAddingInprogress && <i className="fas fa-circle-notch icon-loading"></i> }
                                Add to Cart
                            </button>
																												</React.Fragment>}
                            {this.state.activeStepper != 3 &&
                            <button name="next" onClick={(e) => this.nextStepperClick(e)} className="ml-2 btn btn-primary float-right cursor-pointer">
                                {this.state.isVmSizeValidatingInProgress && <i className="fas fa-circle-notch icon-loading"></i> }
                                Next
                            </button>}
                            {this.state.activeStepper != 1 &&
                            <button name="back" onClick={() => this.backStepperClick()} className="btn btn-primary float-right disable-btn cursor-pointer">
                                Back
                            </button>}
                        </div>
                    </div>
                </div>
                <div className="col-lg-6">
	                <div className="form-group row">
	                    <div className="col-sm-12">
	                    	<span className="star-mark">*</span> Fields highlighted in BLUE color are from Azure REST API.
	                    </div>
	                </div>
	            </div>
            </div>
          </form>
        </div>
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

const connectedNewVMInstance = connect(mapStateToProps)(azureNewVMInstance);
export { connectedNewVMInstance as azureNewVMInstance };