import React from 'react';
import { commonFns } from "../../_helpers/common";
import { connect } from 'react-redux';
import { azureActions } from './azure.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import Moment from 'react-moment';
import PageLoader from '../PageLoader';
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri,
  decryptResponse } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';
import { profiles } from '../../_reducers/profiles.reducer';
import { MDBDataTable } from 'mdbreact';
import OatCheckList from './oatCheckList';
import CyberarkList from './cyberarkVMInfo';
import WindowsVMAccessInfo from './windowsVMAccessInfo';

Modal.setAppElement("#app");
class AzureVmDetail extends React.Component {
  constructor(props) {
    super(props);
    
    let user = decryptResponse( localStorage.getItem("user")),
    is_manager = {},
    resource_groups = user.data.resource_groups.map(resource => {
      is_manager[resource.name] = resource.role_id === 3;
      return resource.name;
    });

    this.state = {
      clientid: user.data.clientid,
      user_role: user.data.user_role,
      provision_type: user.data.provision_type,
      user_id: user.data.id,
      user: user,
      azure: [],
      vm_data:"",
      logData: [],
      jobdata:[],
      sweetalert: true,
      modalIsOpen: false,
      modalVmHistory: false,
      addNetworkModalIsOpen: false,
      addNewDiskModalIsOpen: false,
      attachDiskModalIsOpen: false,
      extendDiskModalIsOpen: false,
      syncDataFromAzureInProgress: false,
      vMLockLoading : false,
      existingDisk : {},
      extendDiskSizeGB : 0,
      vm_size_popup: false,
      vmSize: [],
      vm_size_name: "",
      isVmSizeValidatingInProgress: false,
      isVmSizeListLoading: false,
      vmSize_backup_list: [],
      resize_request_inprocess : false,
      action: null,
      loading:true,
      virtualnetworks: [],
      vmDiskList: [],
      vmNetworkInterfaceList: [],
      resourceGroups:[],
      subscription_id: "",
      resourceGroupName: "",
      addDiskRequestInProgress: false,
      VmAccessRequestInProgress : false,
      attachDiskRequestInProgress: false,
      attachDisk_DiskList: [],
      vmDetails: [],
      isItFirstLoad: false,
      error_message : "",
      attachdiskDiskListInprogress: false,
      isRerunVmOatChecklistInprogress : false,
      selectedStorageType : "",
      selectedDiskSize : "",
      
      storageTypesList : [],
      storageSkusList : [],
      isStorageSkusInProgress: false,
      diskMountPointsArr : [],
      mountPointJson: [],
      disksMountPointListInit: [{Mount_Point : "", Mount_Size :""}],
      Disk_Name : "",//vm_data.vmdetails.dataFromDB.host_name+"-disk";
    };
    
    this.bindField = this.bindField.bind(this);
    
    this.loaderImage=this.loaderImage.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);

    this.openVmHistory = this.openVmHistory.bind(this);
    this.modalCloseVm = this.modalCloseVm.bind(this);
    this.getVirtualNetworks = this.getVirtualNetworks.bind(this);
    this.getDiskList = this.getDiskList.bind(this);

    this.openModalAddNetworks = this.openModalAddNetworks.bind(this);
    this.closeModalAddNetworks = this.closeModalAddNetworks.bind(this);
    this.handleAzureSubscriptions = this.handleAzureSubscriptions.bind(this);
    this.handleAzureResourceGroups = this.handleAzureResourceGroups.bind(this);

    this.openModalAddNewDisk = this.openModalAddNewDisk.bind(this);
    this.closeModalAddNewDisk = this.closeModalAddNewDisk.bind(this);

    this.openModalAttachDisk = this.openModalAttachDisk.bind(this);
    this.closeModalAttachDisk = this.closeModalAttachDisk.bind(this);
    
    this.openModalExtendDisk = this.openModalExtendDisk.bind(this);
    this.closeModalExtendDisk = this.closeModalExtendDisk.bind(this);
    this.azureExtendDiskRequest = this.azureExtendDiskRequest.bind(this);
    
    this.getVMDetails = this.getVMDetails.bind(this);
    
    this.vmResizeForm = this.vmResizeForm.bind(this);
    this.vm_size_popupCloseModal = this.vm_size_popupCloseModal.bind(this);
    this.vm_size_popup_update_req = this.vm_size_popup_update_req.bind(this);
  }
  
  addMountPoints(diskState,e){
	  console.log("diskState -- ",diskState);
	  console.log("this.state.diskMountPointsArr -- ", this.state.diskMountPointsArr);
	  let diskMountPointsArr = [...this.state.diskMountPointsArr];
	  diskMountPointsArr.push(diskState);
	  this.setState({[diskState] : this.state.disksMountPointListInit, diskMountPointsArr : diskMountPointsArr});
	  setTimeout(() => {
		 console.log("this.state.diskMountPointsArr -- ", this.state.diskMountPointsArr);
		 console.log("this.state[diskState] -- ", this.state[diskState]);
	  }, 500);
  }
  removeMountPoints(diskState,e){
	  console.log("diskState -- ",diskState);
	  console.log("this.state.diskMountPointsArr -- ", this.state.diskMountPointsArr);
	  let diskMountPointsArr = [...this.state.diskMountPointsArr];
	  const index = diskMountPointsArr.indexOf(diskState);
	  if (index > -1) {
		  diskMountPointsArr.splice(index, 1);
	  }
	  
	  this.setState({[diskState] : [], diskMountPointsArr : diskMountPointsArr});
	  setTimeout(() => {
			 console.log("this.state.diskMountPointsArr -- ", this.state.diskMountPointsArr);
	  }, 500);
  }
  
  addMountClick(item, e){
	  console.log("item -- ",item);
	  console.log("item.Disk_Name -- ", this.state[item.Disk_Name]);
	 this.setState(prevState => ({ 
			[item.Disk_Name]: [...prevState[item.Disk_Name], { Mount_Point : "", Mount_Size :"" }]
	 }));
	 setTimeout(() => {
		 console.log("item.Disk_Name -- ", this.state[item.Disk_Name]);
     }, 500);
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
  
  createDiskUI(){
	  let self = this;
	  return (<React.Fragment>
	  <div className="row">
	    <div className="col-lg-12">
		    <div className="row">
		        <div className="col-lg-12">
			        <div className="form-group">
		              <label htmlFor="cloud_type" className=''>Disk Host Caching<span className="star-mark">*</span></label>
	                  <select
	                      className="form-control"
	                      value={this.state.Disk_Host_Caching}
	                  	  required
	                      name="Disk_Host_Caching"
	                    	onChange={this.bindField}
	                      >
	                      <option value="">--SELECT--</option>
	                      {this.props.azure.dropdownData && this.props.azure.dropdownData.Azure_Disk_Host_Caching && this.props.azure.dropdownData.Azure_Disk_Host_Caching.length > 0 && this.props.azure.dropdownData.Azure_Disk_Host_Caching.map((row, index) =>
		                      <React.Fragment key={index}>
		                    	  {((parseInt(this.state.Disk_Size) >= 4092 && row.key == 'None') || parseInt(this.state.Disk_Size) < 4092) && 
		                    		  <option value={row.key} key={index}>
				                          {row.value}
				                      </option>
		                    	  }
	                    	  </React.Fragment>
	                      )}
	                  </select>
			        </div>
			    </div>
			  	<div className="col-lg-6">
			        <div className="form-group">
			            <label htmlFor="cloud_type" className=''>Disk Size <span className="star-mark">*</span></label>
			            <div className="overflow-wrap">
			                <input
			                    type="text"
			                    className="form-control-vm position-relative"
			                    name="Disk_Size" readOnly
			              	  id={"Disk_Size"}
			                	  value={this.state.Disk_Size}
			                		onChange={this.bindField} /><span className="disk_size_gb" style={{top: "28px"}}>GB</span>
			            </div>
			            {false && this.state.Disk_Storage_Size != '' && 
			          	  <span><span className="star-mark">Allowed</span> : {this.state.MinSizeGiB+" - "+this.state.MaxSizeGiB} <strong>GB</strong></span>
			            }
			        </div>
		        </div>
			    <div className="col-lg-6">
			        {true && this.state.vm_data.vmdetails.dataFromDB.osType == 'Linux' && this.state.Disk_Size && (!this.state[this.state.Disk_Name]
			        		|| this.state[this.state.Disk_Name] && this.state[this.state.Disk_Name].length == 0) && 
			      	  	<span className="btn btn-primary m-t-xs cursor-pointer" onClick={this.addMountPoints.bind(this,this.state.Disk_Name)}>Add Mount Points</span>
			        }
			        {this.state.vm_data.vmdetails.dataFromDB.osType == 'Linux' && this.state.Disk_Size && this.state[this.state.Disk_Name] && this.state[this.state.Disk_Name].length > 0 && 
			      	  	<span className="btn btn-primary m-t-xs cursor-pointer" onClick={this.removeMountPoints.bind(this,this.state.Disk_Name)}>Remove Mount Points</span>
			        }
			    </div>
		    </div>
	  </div>
	</div>
  	{this.state.vm_data.vmdetails.dataFromDB.osType == 'Linux' 
  	  && this.state.Disk_Size 
  	  && this.state[this.state.Disk_Name] 
	  && this.state[this.state.Disk_Name].length > 0 
	  && <div className="row">
		  <div className="col-lg-12" style={{border: "1px solid #000", padding : "5px", marginBottom : "10px"}}>
	    	  {"Disk Mount Points (Buffer Size : "+self.props.azure.dropdownData.Azure_Disk_Mount_Buffer_Size+" GB)"}
		      {this.state[this.state.Disk_Name].map((el1, i1) => (
	  		  <React.Fragment key={i1}>
	  		  <div className="row">
	  	          <div className="col-lg-4">
	  	              <div className="form-group">
	  	                  <label htmlFor="cloud_type" className=''>Mount Point {i1+1}<span className="star-mark">*</span></label>
		                      <input type="text" className="form-control" name="Mount_Point" placeholder="Ex : /data/abc"
		                        	  value={el1.Mount_Point} onChange={this.handleMountChange.bind(this, {Disk_Name : this.state.Disk_Name, mountPoint : i1})}  />
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
	  	                          name="Mount_Size"  min="0" maxLength="5"
	                        	  id={"Mount_Size_"+i1}
		                      	  value={el1.Mount_Size} onKeyDown={ (evt) => (evt.key === 'e' || evt.key === '+' || evt.key === '-') && evt.preventDefault() }
	  	                          onChange={this.handleMountChange.bind(this, {Disk_Name : this.state.Disk_Name, mountPoint : i1})} /><span className="disk_size_gb" style={{top: "28px"}}>GB</span>
		                      </div>
	  	              </div>
	  	          </div>
	  	          <div className="col-lg-2">
		                  {this.state[this.state.Disk_Name].length > 1 && 
		                	  	<span className="btn btn-primary m-t-xs m-r-xs cursor-pointer" onClick={this.removeMountClick.bind(this, {Disk_Name : this.state.Disk_Name, mountPoint : i1})}>-</span>
		                  }
		                  {(this.state[this.state.Disk_Name].length-1) == i1  && 
		                	  	<span className="btn btn-primary m-t-xs m-r-xs cursor-pointer" onClick={this.addMountClick.bind(this,{Disk_Name : this.state.Disk_Name, mountPoint : i1})}>+</span>
		                  }
			          </div>
	  	      </div>
		      </React.Fragment>
		     ))}
		</div>
	</div>}
  	</React.Fragment>
	)
  }
  
  bindField(e){
	  const { name, value } = e.target;
	  
	  if(name == 'Disk_Storage_Type'){ 
    	 $("#Disk_Size").val("");
    	 $("#Disk_Storage_Size").val("");
    	 this.setState({ Disk_Storage_Size : "", Disk_Size : "" });
	 }else if(name == 'Disk_Storage_Size'){ 
    	 let MinSizeGiB = "", MaxSizeGiB = "";
    	 MinSizeGiB = value.split('_')[1];
    	 MaxSizeGiB = value.split('_')[2];
    	 $("#Disk_Size").val(MaxSizeGiB);
    	 this.setState({ MinSizeGiB, MaxSizeGiB, Disk_Size : MaxSizeGiB, Disk_Host_Caching : "None" });
	 }else if(e.target.name == "extendDiskSizeGB"){
        let value = e.target.value;
        let charCode = value.charCodeAt(value.length - 1);
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
    }else if(e.target.name == "attach_disk_list"){
    	this.setState({
    		selectedStorageType : "",
    		selectedDiskSize : ""
        })
    	if(this.state.attachDisk_DiskList.length > 0){
    		for(let i = 0; i <= this.state.attachDisk_DiskList.length; i++){
    			if(e.target.value == this.state.attachDisk_DiskList[i].name){
    				this.setState({
    		    		selectedStorageType : ((this.state.attachDisk_DiskList[i].sku && this.state.attachDisk_DiskList[i].sku.name)?this.state.attachDisk_DiskList[i].sku.name:""),
    		    		selectedDiskSize : ((this.state.attachDisk_DiskList[i].properties && this.state.attachDisk_DiskList[i].properties.diskSizeGB)?this.state.attachDisk_DiskList[i].properties.diskSizeGB+" GB":"")
    		        })
    		        break;
    			}
    		}
    	}
    }

    this.setState({
        [e.target.name]: e.target.value
    })
  }
  
  getStorageSkus(){
	  var form = document.querySelector("#azureAddNewDisk");
      var formData = serialize(form, { hash: true });
      console.log("formData -- ",formData);
      
      let hrefurl = window.location.href;
      let selected_subscription_id = hrefurl.split("id=")[1];
      selected_subscription_id = selected_subscription_id.split("&")[0];
      
	  const storageSkusRequestOptions = {
              method: 'POST',
              headers: { ...authHeader(), 'Content-Type': 'application/json' },
              body: JSON.stringify(ucpEncrypt(Object.assign({}, formData,{clientid : this.state.clientid, 
              	"location": this.state.vm_data.vmdetails.dataFromDB.location, 
              	storagetype: "",//this.state.storageAccountType,
              	subscription_id : selected_subscription_id
              })))
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
  }
  
  vmResizeForm(){
	  if(!this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj
			  || this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj == ''){
		  toast.error("You can't Resize this VM, as it is not spinned from UCP.");
		  return;
	  }
    this.setState({ vm_size_popup: true,
            vm_size_name: "",
            vm_cpus : "",
            vm_ram : "",
            vm_price: ""
        });
    this.updateVmSize();
  }
  vm_size_popupCloseModal(){
	  this.setState({ vm_size_popup: false });
  }

  vm_size_popup_update_req(){
	  if(this.state.vm_size_name != "" && this.state.vm_size_name != this.state.vm_data.vmdetails.dataFromDB.vmSize){
		  this.setState({
	    	  resize_request_inprocess: true
	      })
	      let vmData = this.state.vm_data.vmdetails.dataFromDB;
	    let request_obj = {
	        method: 'POST',
	        headers: { 'Content-Type': 'application/json' },
	        body: {
	        	"client_id": this.state.clientid,
	            "vm_id": vmData.id,
	            "subscription_id": this.state.vm_data.vmdetails.dataFromDB.subscriptionId,
	            "resource_group": this.state.vm_data.vmdetails.dataFromDB.resourceGroup,
	            "vm_name": this.state.vm_data.vmdetails.dataFromDB.host_name,
	            "new_vmSize": this.state.vm_size_name,
	            vm_cpus : this.state.vm_cpus,
	            vm_ram : this.state.vm_ram,
	            search_code : this.state.vm_data.vmdetails.dataFromDB.search_code,
	            "location_name": this.state.vm_data.vmdetails.dataFromDB.location,
	            "user_id": this.state.user_id,
	            is_cluster : this.state.vm_data.vmdetails.dataFromDB.is_cluster,
	            cluster_vm_id : this.state.vm_data.vmdetails.dataFromDB.cluster_vm_id,
	            cluster_host_name : this.state.vm_data.vmdetails.dataFromDB.cluster_host_name,
	            cluster_search_code : this.state.vm_data.vmdetails.dataFromDB.cluster_search_code,
	            os_type : this.state.vm_data.vmdetails.dataFromDB.osType,
                shared_image_name : this.state.vm_data.vmdetails.dataFromDB.os_template_name,
	        }
	    };
	    let request_url = `${config.apiUrl}/secureApi/azure/vm_resize?noencrypt=1`;
	    
	    const requestOptions = {
	        method: 'POST',
	        headers: { ...authHeader(), 'Content-Type': 'application/json' },
	        body: JSON.stringify(ucpEncrypt({
	        	"request_type": "Re-Size",
	            "vm_id": vmData.id,
    			request_url : request_url,
    			request_obj : request_obj,
	            "user_id": this.state.user_id,
                clientid:this.state.clientid,
                ref_type : 'vmUpdate'
	        }))
	    };
	    return fetch(`${config.apiUrl}/secureApi/azure/saveVmOpsRequests`, requestOptions).then(response  => {
	        response.text().then(text => {
	            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	            
	            this.setState({
	            	resize_request_inprocess: false
	            });
	            if (response.ok) {
	                var result=(data.value ? data.value : data)
	                console.log("saveVmOpsRequests result --- ",result);
	            	if(result.status == "success"){
	            		toast.success(result.message);
	            		this.setState({ 
	            			vm_size_popup: false,
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
	  }else{
		  this.setState({ vm_size_popup: false });
		  toast.info("Nothing to Update");
	  }
  }
  handleVmResizeResponse(response) {
	  return response.text().then(text => {
	      const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	      console.log(data);
	      if (!response.ok) {
	          //
	      }
	      else{
	    	  if(data.status == 'success'){
		    	  this.setState({ vm_size_popup: false });
		    	  toast.success(data.message);
		          
		          setTimeout(() => {
		        	  window.location.reload();
		          }, 2000);
	        }
	        else{
	          toast.error(data.message);
	        }
	        //return data;
	      }        
	      this.setState({
	    	  resize_request_inprocess: false
	      })
	  });
  }
  
  vm_size_Change = (id, vm_size_name, vm_cpus, vm_ram, vm_price) => {
    setTimeout(() => {
        $("#"+id).prop("checked", true);
    }, 0);
    
    this.setState({
        vm_size_name: vm_size_name,
        vm_cpus : vm_cpus,
        vm_ram : vm_ram,
        vm_price: vm_price
    });
  }
  
  updateVmSize(){
    let rows = [];

    let data = this.state.vmSize_backup_list;

    for(let num = 0; num < data.length; num++){
        let row = data[num];
        
        //console.log(row.name," == ",this.state.vm_data.vmdetails.dataFromDB.vmSize);
        rows.push({
            action: ((row.name != this.state.vm_data.vmdetails.dataFromDB.vmSize)? <input id={"radioVmSize" + num} checked={(row.name == this.state.vm_data.vmdetails.dataFromDB.vmSize ?  true : false)} onChange={e => this.vm_size_Change(
                "radioVmSize" + num,
                row.name,
                row.numberOfCores, 
                row.memoryInMB,
                row.price)}
            style={{ height: '20px', width: '20px'}} type="radio" name="vm_size_popup" value={row.name} />
            		:""
            ),
            name: row.name,
            numberOfCores: row.numberOfCores,
            memoryInMB: (row.memoryInMB ? (row.memoryInMB >= 1024 ? row.memoryInMB/1024 : row.memoryInMB) : "0") + (row.memoryInMB >= 1024 ? " GB" : " MB"),
            maxDataDiskCount: row.maxDataDiskCount,
            AcceleratedNetworkingEnabled: row.AcceleratedNetworkingEnabled,
            PremiumIO : ((row.PremiumIO == 'True')?"Supported": "Not Supported"),
            EphemeralOSDiskSupported : row.EphemeralOSDiskSupported,
//	            price: commonFns.fnFormatCurrency(Number(row.price))
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
//	            {
//	                label: 'Price',
//	                field: 'price'
//	            }
        ],
        rows: rows
        }
    });
  }
  
  getAzureVMSize(frmData) {
    frmData.currency_id = this.state.user.data.currency_id;
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    this.setState({
        isVmSizeListLoading: true
    });

    fetch(`${config.apiUrl}/secureApi/azure/getVmSupportedSizes`, requestOptions).then(response  => this.vmSizeHandleResponse(response, "vmSize"));
  }
  
  vmSizeHandleResponse(response, stateName) {
    return response.text().then(text => {
        let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        console.log("vmSizeHandleResponse --- ",data);
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
	  
  loaderImage(){
    this.props.dispatch(azureActions.getAll(0));
  }
  openModal() {      
    this.setState({ modalIsOpen: true });
  }
  closeModal() {
    this.setState({ modalIsOpen: false });
    window.location.reload();         
  }

  openModalAddNetworks(){
    this.setState({ addNetworkModalIsOpen: true });
  }
  closeModalAddNetworks(){
    this.setState({ addNetworkModalIsOpen: false });
  }
  
  openModalAddNewDisk(){
	  if(!this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj
			  || this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj == ''){
		  toast.error("You can't Add New Disk to this VM, as it is not spinned from UCP.");
		  return;
	  }
	  console.log("this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj --- ", this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj);
	  //let vmDiskList = ((this.state.vm_data && this.state.vm_data.vmdetails && this.state.vm_data.vmdetails.dataFromAzure && this.state.vm_data.vmdetails.dataFromAzure.properties && this.state.vm_data.vmdetails.dataFromAzure.properties.storageProfile && this.state.vm_data.vmdetails.dataFromAzure.properties.storageProfile.dataDisks) ? this.state.vm_data.vmdetails.dataFromAzure.properties.storageProfile.dataDisks : []);
	  let vmDiskList = ((this.state.vm_data && this.state.vm_data.vmdetails && this.state.vm_data.vmdetails.dataFromAzure && this.state.vm_data.vmdetails.dataFromAzure.diskInformation) ? this.state.vm_data.vmdetails.dataFromAzure.diskInformation : []);
	  let newDiskNo = 0;
	  if(vmDiskList && vmDiskList.length > 0){
		  for(let i = 0; i < vmDiskList.length; i++){
			  let diskNo = ((vmDiskList[i].name.split(this.state.vm_data.vmdetails.dataFromDB.host_name+"-disk").length > 1)?parseInt(vmDiskList[i].name.split(this.state.vm_data.vmdetails.dataFromDB.host_name+"-disk")[1]):0);
			  console.log("diskNo --- ",diskNo);
			  if(diskNo > newDiskNo){
				  newDiskNo = diskNo;
			  }
		  }
	  }else{
		  this.syncDataFromAzure();
	  }
	  let Disk_Name = this.state.vm_data.vmdetails.dataFromDB.host_name+"-disk"+(newDiskNo+1);
	  this.setState({ addNewDiskModalIsOpen: true, Disk_Name});
  }
  closeModalAddNewDisk(){
    this.setState({ addNewDiskModalIsOpen: false });
  }
  openModalAttachDisk(){
    this.setState({ attachDiskModalIsOpen: true });
    setTimeout(() => {
    	this.handleAzureDiskList();
    }, 1000);
  }
  closeModalAttachDisk(){
    this.setState({ attachDiskModalIsOpen: false });
  }
  
  openModalExtendDisk(diskData){
	this.setState({ 
		existingDisk: diskData,
		extendDiskSizeGB : ((diskData.diskSizeGB)?diskData.diskSizeGB:0)
	});
    this.setState({ extendDiskModalIsOpen: true });
  }
  closeModalExtendDisk(){
    this.setState({ extendDiskModalIsOpen: false });
  }
  azureExtendDiskRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#azureExtendDisk");
    var formData = serialize(form, { hash: true });
    console.log("azureExtendDisk formData -- " , formData);

    if(this.state.existingDisk.diskSizeGB >= formData.extendDiskSizeGB){
    	toast.error("New Disk Size must be greater than Existing Disk Size");
    	return;
    }
    if(!(this.state.vm_data.vmdetails.dataFromDB.vm_status.toLowerCase() == "poweredoff" 
    	|| this.state.vm_data.vmdetails.dataFromDB.vm_status.toLowerCase() == "stopped")){
    	
    	toast.error("Put the VM in PowerOff mode, to update the VM Disk Size");
    	return;
    }
    let newFormData = {
      "client_id": formData.clientid,
      "subscription_id": this.state.existingDisk.managedDisk.id.split('/subscriptions/')[1].split('/')[0],
      "resource_group_name": this.state.existingDisk.managedDisk.id.split('/resourceGroups/')[1].split('/')[0],
      "disk_name": this.state.existingDisk.name,
      "disk_size": formData.extendDiskSizeGB
      }

    this.setState({
    	extendDiskRequestInProgress: true
    });

    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(newFormData))
    };

    fetch(`${config.apiUrl}/secureApi/azure/extendDisk`, requestOptions).then(response  => {
        response.text().then(text => {
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
            
            this.setState({
            	extendDiskRequestInProgress: false
            });
            if (response.ok) {
                var result=(data.value ? data.value : data)
                console.log("extendDisk result --- ",result);
            	if(result.status == "success"){
            		toast.success(result.message);
            		this.setState({ extendDiskModalIsOpen: false });
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
  };
  
  handleAzureSubscriptions = (subscription) => {
    if(subscription != ''){
        this.setState({subscription:subscription})
        this.props.dispatch(azureActions.getAzureSubscriptionLocations({clientid:this.state.clientid,subscription:subscription}));
    }
  }
  handleAzureResourceGroups = (location) => {
      var subscription=this.state.subscription;
      if(subscription != '' && location!=''){
          const requestOptions = {
              method: 'POST',
              headers: { ...authHeader(), 'Content-Type': 'application/json' },
              body: JSON.stringify(ucpEncrypt({subscription:subscription,location:location}))
          };
          return fetch(`${config.apiUrl}/secureApi/azure/get_resrouce_group_list`, requestOptions).then(response  => this.handleresourceGroupsResponse(response))
          // .then(res => res.json())
          // .then((data) => {
          //     this.setState({ resourceGroups: ucpDecrypt(JSON.parse(data)) })
          // })
          // .catch(console.log)
          // }
        }
  }
  handleresourceGroupsResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        if (!response.ok) {
            //
        }
        else{
          this.setState({
            ['resourceGroups']: (data.data ? data.data : data)
          })
          //return data;
        }        
        this.setState({
          loading: false
        })
    });
  }
//  handleAzureDiskList  = (resourceGroup) => {
  handleAzureDiskList  = () => {
	  var form = document.querySelector("#azureAttachDisk");
	    var frmData = serialize(form, { hash: true });
	    frmData.subscription_id = frmData.subscription.split(/_(.+)/)[1];
	    frmData.clientid = this.state.clientid;
	    frmData.diskState = "Unattached";
	    frmData.resourceGroup = frmData.resource_group;
    if(frmData.resource_group){
    	this.setState({ attachdiskDiskListInprogress: true });
//      let frmData = {clientid: this.state.clientid, subscription_id:this.state.subscription.split(/_(.+)/)[1],diskState : "Unattached", resourceGroup: resourceGroup };
      const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
      };

      fetch(`${config.apiUrl}/secureApi/azure/getDiskList`, requestOptions).then(response  => this.handleResponse(response, "attachDisk_DiskList"));
    }
 }

 openVmOatData(vm_data) {
  const requestOptions = {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(ucpEncrypt({
      id: vm_data.vmdetails.dataFromDB.id
    }))
  }, self = this;
  this.setState({
    modalVmOatData: true,
    loadingOAT: true,
    console_vm_name: vm_data.vmdetails.dataFromAzure.name
  });
  fetch(`${config.apiUrl}/secureApi/azure/get-oat-data`, requestOptions).then(response  => {
    
    response.text().then(text => {
      text = text && ucpDecrypt(JSON.parse(text));
      self.setState({
        loadingOAT: false,
        vm_console: (text || '').replace(/0m/g, '').replace(//g, '').replace(/1;32m/g, '')
      });
    });
  });
 }

 manageVMLock(dataFromDB) {
  const requestOptions = {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(ucpEncrypt({
      id: dataFromDB.id,
      is_locked: !parseInt(dataFromDB.is_locked),
  	  "client_id": this.state.clientid,
      "requested_user_id": this.state.user_id
    }))
  }, self = this, is_locked = parseInt(dataFromDB.is_locked);

  this.setState({vMLockLoading: true});

  fetch(`${config.apiUrl}/secureApi/azure/manage-vm-lock`, requestOptions).then(response  => {
    
    response.text().then(text => {
      text = text && ucpDecrypt(JSON.parse(text));
      text = JSON.parse(text).data || {};

      if (text.affectedRows) {
        this.state.vm_data.vmdetails.dataFromDB.is_locked = !is_locked ? 1: 0;
        if(this.state.vm_data.vmdetails.dataFromDB.is_locked){
	        this.state.vm_data.vmdetails.dataFromDB.locked_by_user_email = this.state.user.data.email;
	        this.state.vm_data.vmdetails.dataFromDB.locked_date = text.locked_date;
        }else{
        	this.state.vm_data.vmdetails.dataFromDB.locked_by_user_email = "";
        	this.state.vm_data.vmdetails.dataFromDB.locked_date = "";
        }
        self.setState({vMLockLoading: false})
        toast.success(`VM got ${is_locked ? 'Unlocked': 'Locked'}`)
      }
      else {
        self.setState({vMLockLoading: false})
         toast.error(`VM ${is_locked ? 'Unlocking': 'Locking'} failed!`)
      }
    });
  }).catch(e => {
    self.setState({vMLockLoading: false})
    toast.error(`VM ${is_locked ? 'Unlocking': 'Locking'} failed!`)
  });
 }
  
  rerunVmOatChecklist(vm_data) {
	  if(!this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj
			  || this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj == ''){
		  toast.error("You can't Rerun OAT checklist for this VM, as it is not spinned from UCP.");
		  return;
	  }
//	  if(this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj
//			  && this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.os_type == 'Windows'
//			  && this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.shared_image_tags
//			  && this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.shared_image_tags["UCP-DB-Type"] == 'MSSQL'){
//		  toast.error("Feature Coming soon.");
//		  return;
//	  }
//	  console.log("rerunVmOatChecklist vm_data ---- ", vm_data);
	  if(false && this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.os_type == 'Windows'){
		  var titleLabel = "Note :\n" +
		  		"The OAT Check for Group policies to Pass, a user must login, at-least once, into this VM for Group Policies to get affected.\n" +
		  		"By Clicking the OAT Re-Run you confirm that at-least one user has logged in.\n" +
		  		"If the OAT Check has failed even after logging into this machine, then it is a genuine failure.\n" +
		  		"Please raise a ticket to support for resolution.";
		  var dispLabel = "Yes, Rerun OAT";
		  const getAlert = () => (
		    <SweetAlert
		      warning
		      showCancel
		      confirmBtnText={dispLabel}
		      confirmBtnBsStyle="danger"
		      cancelBtnBsStyle="default"
		      title={titleLabel}
		      onConfirm={() => this.rerunVmOatChecklistFn(vm_data)}
		      onCancel={this.hideAlert.bind(this)}
		    >
		    </SweetAlert>
		  );
		  console.log("rerunVmOatChecklist getAlert ---- ", getAlert);
		  this.setState({
		    sweetalert: getAlert()
		  });
	  }else{
		  this.rerunVmOatChecklistFn(vm_data);
	  }
  }
  
  rerunVmOatChecklistFn(vm_data) {
	  if(!this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj
			  || this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj == ''){
		  toast.error("You can't Decommission this VM, as it is not spinned from UCP.");
		  return;
	  }
//	  if(this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj
//			  && this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.os_type == 'Windows'
//			  && this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.shared_image_tags
//			  && this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.shared_image_tags["UCP-DB-Type"] == 'MSSQL'){
//		  toast.error("Feature Coming soon.");
//		  return;
//	  }
	  const requestOptions = {
	    method: 'POST',
	    headers: { ...authHeader(), 'Content-Type': 'application/json' },
	    body: JSON.stringify(ucpEncrypt({
	    	vm_data,
        	"client_id": this.state.clientid,
            "requested_user_id": this.state.user_id
	    }))
	  }, self = this;
	  this.setState({
		  isRerunVmOatChecklistInprogress: true,
	  });
	  $(".complete-page-loader").show();
	  fetch(`${config.apiUrl}/secureApi/azure/rerunVmOatChecklist`, requestOptions).then(response  => {
		  $(".complete-page-loader").hide();
		  this.hideAlert();
	    response.text().then(text => {
	      let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	      console.log("data --- ", data);
	      self.setState({
	    	  isRerunVmOatChecklistInprogress: false,
	      });
	      if (response.ok) {
		      if(data.status == "success"){
	      		toast.success(data.message);
	      		this.setState({ 
	      			vm_size_popup: false,
	  			});
		      }else{
		      		toast.error(data.message);
		      }
	      }
          else{
              toast.error("The operation did not execute as expected. Please raise a ticket to support");
          }
	    });
	  });
  }

  openVmHistory(vm_data) {      
    this.setState({ modalVmHistory: true, modalVmOatData: false });
    this.setState({ vmDetails: vm_data });
    var params={clientid:this.state.clientid,vmid:vm_data.vmdetails.dataFromDB.id}
    this.props.dispatch(azureActions.vmLogs(params));
  }

  modalCloseVm() {
    this.setState({ modalVmHistory: false, modalVmOatData: false });
    //this.props.dispatch(azureActions.vmDetail(this.props.match.params.id));       
  }

  getVirtualNetworks(){
    const requestOptions = {
      method: 'GET',
      headers: authHeader()
    };

    fetch(`${config.apiUrl}/secureApi/azure/networks/`+btoa(this.state.clientid), requestOptions).then(response  => this.handleResponse(response, "virtualnetworks"));
  }

  handleResponse(response, stateName) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        if (!response.ok) {
            //
        }
        else{
        	if(stateName == 'attachDisk_DiskList'){
          	  this.setState({
          		  attachdiskDiskListInprogress: false
                  });
            }
          this.setState({
            [stateName]: (data.data ? data.data : data)
          });
          if(stateName == 'vm_data' && data.status == 'error' && data.message){
        	  this.setState({
                  error_message: data.message
                });
          }else if(stateName == 'vm_data'){
        	  this.setState({
                  error_message: ""
                });
          }
          if(stateName == 'vm_data'){
        	  setTimeout(() => {
	          if(this.state.vm_data && this.state.vm_data.vmdetails 
	        		  && this.state.vm_data.vmdetails.dataFromDB){
	        	  
	        	  let vmDiskList = ((this.state.vm_data && this.state.vm_data.vmdetails && this.state.vm_data.vmdetails.dataFromAzure && this.state.vm_data.vmdetails.dataFromAzure.diskInformation) ? this.state.vm_data.vmdetails.dataFromAzure.diskInformation : []);
	        	  let PremiumIO = "False";
	        	  if(vmDiskList && vmDiskList.length > 0){
	    	    	vmDiskList.map((row, index) =>{
	    	    		if(row.sku && row.sku.tier && row.sku.tier == 'Premium'){
	    	    			PremiumIO = 'True';
	    	    		}
	    	    	});
	        	  }else{
	        		  this.syncDataFromAzure();
	        	  }
	    	    
	    	  	  this.getAzureVMSize({
	    		        clientid:this.state.clientid,
	    		        subscriptionId: this.state.vm_data.vmdetails.dataFromDB.subscriptionId, 
	    		        location : this.state.vm_data.vmdetails.dataFromDB.location,
	    		        currency_id: this.state.user.data.currency_id,
	    		        host_name : this.state.vm_data.vmdetails.dataFromDB.label_name,
	    		        resourceGroup : this.state.vm_data.vmdetails.dataFromDB.resourceGroup,
	    		        is_cluster : this.state.vm_data.vmdetails.dataFromDB.is_cluster,
	    		        PremiumIO : PremiumIO,//this.state.vm_data.vmdetails.dataFromDB.PremiumIO,
	    		        shared_image_tags : ((this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj)?this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.shared_image_tags:{}),
	    		        AcceleratedNetworkingEnabled : ((this.state.vm_data.vmdetails.dataFromAzure.networkInformation && this.state.vm_data.vmdetails.dataFromAzure.networkInformation.properties && this.state.vm_data.vmdetails.dataFromAzure.networkInformation.properties.enableAcceleratedNetworking)?this.state.vm_data.vmdetails.dataFromAzure.networkInformation.properties.enableAcceleratedNetworking:"False"),
	    	            os_type : this.state.vm_data.vmdetails.dataFromDB.osType,
	                    shared_image_name : this.state.vm_data.vmdetails.dataFromDB.os_template_name,
	                    environment : ((this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj)?this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.environment:""),
    		      });
	    	  	  this.getStorageSkus();
	    	    }
        	  }, 100);
          }
          //return data;
        }        
        this.setState({
          loading: false
        })
    });
  }
  
  getVMDetails(){
//    const requestOptions = {
//      method: 'GET',
//      headers: authHeader()
//    };

    let urlParams = location.href.split("?")[1].split("&");
    
    let frmData = {
		subscriptionId : urlParams[0].split("=")[1],
		name : urlParams[1].split("=")[1],
		user_role: this.state.user_role, 
		user_id:this.state.user_id
    };
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/azure/getVMDetailByName`, requestOptions).then(response  => this.handleResponse(response, "vm_data"));
  }
  
  componentDidMount() {
    this.getVMDetails();
    this.props.dispatch(azureActions.getAzureSubscriptions({clientid:this.state.clientid, user_role: this.state.user_role, provision_type: this.state.provision_type}));
    //this.props.dispatch(azureActions.vmDetail(this.props.match.params.id));
    this.getVirtualNetworks();
    this.props.dispatch(azureActions.getAzureDropdownData({clientid:this.state.clientid}));
//    var vmSizeTimerVar = setInterval(function(){
//    	if(this.state.vm_data && this.state.vm_data.vmdetails && this.state.vm_data.vmdetails.dataFromDB){
//	  	  this.getAzureVMSize({
//		        clientid:this.state.clientid,
//		        subscriptionId: this.state.vm_data.vmdetails.dataFromDB.subscriptionId, 
//		        location : this.state.vm_data.dataFromDB.location,
//		        currency_id: this.state.user_details.data.currency_id});
//		  clearInterval(vmSizeTimer);
//	    }
//    }, 1000);

  }

  vmAction(vmData,action, label) {
    var dispLable = "Yes, Send " + label + " Request!";
    this.setState({
      vmDetails: vmData,
      action: action
    });
    const getAlert = () => (
      <SweetAlert
        warning
        showCancel
        confirmBtnText={dispLable}
        confirmBtnBsStyle="danger"
        cancelBtnBsStyle="default"
        title="Are you sure?"
        onConfirm={this.vmOperations.bind(this)}
        onCancel={this.hideAlert.bind(this)}
      >
      </SweetAlert>
    );
    this.setState({
      sweetalert: getAlert()
    });
  }
  syncDataFromAzure(){
	  const requestOptions = {
	      method: 'GET',
	      headers: authHeader()
	  };
	  let vmData = this.state.vm_data.vmdetails.dataFromDB;
	  this.setState({
    	  syncDataFromAzureInProgress : true
      });
	  
	  let formdata = { 
		  "clientId" : this.state.clientid,
		  "vmId" : vmData.id,
		  "subscriptionId" : vmData.subscriptionId,
		  "resourceGroup" : vmData.resourceGroup,
		  "virtualMachineName" : vmData.label_name
      }

	  fetch(`${config.apiUrl}/secureApi/azure/syncSingleVmDetails?clientId=${formdata.clientId}&resourceGroup=${formdata.resourceGroup}&subscriptionId=${formdata.subscriptionId}&virtualMachineName=${formdata.virtualMachineName}&vmId=${formdata.vmId}`, requestOptions)
	  .then(res => res.json())
	  .then((text) => {
	        const data = ((typeof text === 'string')?JSON.parse(text):text);
	        if (data.status == 'success') {
	          toast.success(data.message);
	          
	          this.setState({
	        	  vm_data: (data.data ? data.data : data),
	        	  syncDataFromAzureInProgress : false
	          });
	        }
	        else{
	          toast.error(data.message);
	          this.setState({
	        	  syncDataFromAzureInProgress : false
	          });
	        }
	  })
	  .catch(console.log)
  }

  vmTerminateOperations = () => {
    $(".sweet-alert").find(".btn-danger").prepend("<i className='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);
    
    let formdata = { "clientid" : this.state.clientid,    
                      "vmId" : this.state.vm_data.vmdetails.dataFromDB.id
                   }

    /*const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(formdata))
    };
    return fetch(`${config.apiUrl}/secureApi/azureapi/delete_vm`, requestOptions)
    .then(res => res.json())
    .then((text) => {
      const data = text && JSON.parse(ucpDecrypt((text)));
      if (data.success) {
        toast.success(data.message);
        
        setTimeout(() => {
          window.location = window.location.origin + "/#/azure"
        }, 2000);
      }
      else{
        toast.error(data.message);
      }
    })
    .catch(console.log)*/
    
    
    let request_obj = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: formdata
    };
    let request_url = `${config.apiUrl}/secureApi/azure/decommissionVm?noencrypt=1`;
    let vmData = this.state.vm_data.vmdetails.dataFromDB;
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt({
        	"request_type": "Decommission",
            "vm_id": vmData.id,
			request_url : request_url,
			request_obj : request_obj,
            "user_id": this.state.user_id,
            clientid:this.state.clientid,
            ref_type : 'Decommission'
        }))
    };
    return fetch(`${config.apiUrl}/secureApi/azure/saveVmOpsRequests`, requestOptions).then(response  => {
        response.text().then(text => {
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
            this.hideAlert()
//            this.setState({
//            	resize_request_inprocess: false
//            });
            if (response.ok) {
                var result=(data.value ? data.value : data)
                console.log("saveVmOpsRequests result --- ",result);
            	if(result.status == "success"){
            		toast.success(result.message);
//            		this.setState({ 
//            			vm_size_popup: false,
//            			});
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

  vmTerminateAction() {
	  if(!this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj
			  || this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj == ''){
		  toast.error("You can't Decommission this VM, as it is not spinned from UCP.");
		  return;
	  }
    var dispLable = "Yes, Send Decommission Request!";
    
    const getAlert = () => (
      <SweetAlert
        warning
        showCancel
        confirmBtnText={dispLable}
        confirmBtnBsStyle="danger"
        cancelBtnBsStyle="default"
        title="Are you sure?"
        onConfirm={this.vmTerminateOperations.bind(this)}
        onCancel={this.hideAlert.bind(this)}
      >
      </SweetAlert>
    );
    this.setState({
      sweetalert: getAlert()
    });
  }

  hideAlert() {
    this.setState({
      sweetalert: null
    });
  }

  vmOperations() {
    this.hideAlert();
    $(".sweet-alert").find(".btn-danger").prepend("<i className='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);
    let vmData = this.state.vm_data.vmdetails.dataFromDB;
    let action = this.state.action;
    const postParams = { "ref_id": btoa(vmData.ref_id), "action": action,vm_id:btoa(vmData.id),clientid:btoa(this.state.clientid) };
//    this.props.dispatch(azureActions.vmOperations(postParams));
    
    let request_obj = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: postParams
        };
        let request_url = `${config.apiUrl}/secureApi/azure/vm_operations?noencrypt=1`;
//        let vmData = this.state.vm_data.vmdetails.dataFromDB;
        
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(ucpEncrypt({
            	"request_type": action,
                "vm_id": vmData.id,
    			request_url : request_url,
    			request_obj : request_obj,
                "user_id": this.state.user_id,
                clientid:this.state.clientid,
                ref_type : 'vmUpdate'
            }))
        };
        return fetch(`${config.apiUrl}/secureApi/azure/saveVmOpsRequests`, requestOptions).then(response  => {
            response.text().then(text => {
                const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
                this.hideAlert()
//                this.setState({
//                	resize_request_inprocess: false
//                });
                if (response.ok) {
                    var result=(data.value ? data.value : data)
                    console.log("saveVmOpsRequests result --- ",result);
                	if(result.status == "success"){
                		toast.success(result.message);
//                		this.setState({ 
//                			vm_size_popup: false,
//                			});
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

  vmLogs(vmid) {
    this.props.dispatch(azureActions.vmLogs(vmid));
    this.openModal();
  }

  azureVirtualNetwrokRequest = e => {
      e.preventDefault();      
      var form = document.querySelector("#azureVirtualNetwrok");
      var formData = serialize(form, { hash: true });

      const re = /^[-\w\._\(\)]+$/;
      // if value is not blank, then test the regex
      if (formData.name != '' && !re.test(formData.name)) {
          toast.error("Invalid Network Name");
      }else{
          this.props.dispatch(azureActions.addAzureNetwork(formData,this.state.clientid));
          this.setState({ modalIsOpen: false });
      }
  };

  getDiskList(frmData) {
    
    /*const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/azure/getDiskList`, requestOptions).then(response  => this.handleResponse(response, "vmDiskList"));*/
  }
  
  azureAddNewDiskRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#azureAddNewDisk");
    var formData = serialize(form, { hash: true });

    formData.subscription = formData.subscription.replace(this.state.clientid + "_","");
    let mountPointJson = {};
    this.setState({
    	mountPointJson: {}
    });
    let Azure_Predefined_Mount_Names = (this.props.azure.dropdownData && this.props.azure.dropdownData.Azure_Predefined_Mount_Names?this.props.azure.dropdownData.Azure_Predefined_Mount_Names:{});
    let physical_volume = [];
    let storage_breakup = [];
    let Mount_Point_Labels = [];
    let vm_error = false;
    
	if(this.state.Disk_Name == ''){
		vm_error = true;
        toast.error("Please enter Disk Name ");
    	return;
	}
	if(this.state.Disk_Host_Caching == ''){
		vm_error = true;
        toast.error("Please select Disk Host Caching ");
    	return;
	}
	if(this.state.Disk_Storage_Type == ''){
		vm_error = true;
        toast.error("Please select Disk Storage Type ");
    	return;
	}
	if(this.state.Disk_Storage_Size == ''){
		vm_error = true;
        toast.error("Please select Disk Storage SKU ");
    	return;
	}
	if(this.state.Disk_Size == ''){
		vm_error = true;
        toast.error("Please enter Disk Size ");
    	return;
	}else if(parseInt(this.state.MinSizeGiB) > parseInt(this.state.Disk_Size) 
			|| parseInt(this.state.Disk_Size) > parseInt(this.state.MaxSizeGiB)){
		vm_error = true;
        toast.error("Please enter Disk Size must be in between "+this.state.MinSizeGiB+" and "+this.state.MaxSizeGiB);
    	return;
	}
	
	//diskMountPointsArr
	if(this.state.diskMountPointsArr.indexOf(this.state.Disk_Name) >= 0
		&& this.state[this.state.Disk_Name]
		&& this.state[this.state.Disk_Name].length > 0
	){
		let totalMountSize = (this.props.azure.dropdownData && this.props.azure.dropdownData.Azure_Disk_Mount_Buffer_Size?parseInt(this.props.azure.dropdownData.Azure_Disk_Mount_Buffer_Size):0);
		console.log("this.state[this.state.Disk_Name] -- ",this.state[this.state.Disk_Name]);
//    		let Mount_Point_Labels = [];
		let Existing_Mount_Point_Labels = [];
		if(this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.shared_image_tags
				  && Object.keys(this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.shared_image_tags).length > 0){
			let shared_image_tags_keys = Object.keys(this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.shared_image_tags);
			for (const tag_key of shared_image_tags_keys){
    			if(tag_key.indexOf("UCP-Mount-Path") >= 0){
    				Existing_Mount_Point_Labels.push(this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.shared_image_tags[tag_key]);
    			}
			}
		}
		if(this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.mountPointJson
			&& this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.mountPointJson[this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.virtual_machine_name]
			&& this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.mountPointJson[this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.virtual_machine_name].storage_breakup
			&& this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.mountPointJson[this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.virtual_machine_name].storage_breakup.length > 0
		){
			let existing_storage_breakup =  this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.mountPointJson[this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.virtual_machine_name].storage_breakup;
			for(let dm = 0; dm < existing_storage_breakup.length; dm++){
				Existing_Mount_Point_Labels.push(existing_storage_breakup[dm].lvname);
			}
		}
		console.log("Existing_Mount_Point_Labels --- ", Existing_Mount_Point_Labels);
    	for(let dm = 0; dm < this.state[this.state.Disk_Name].length; dm++){
    		console.log("this.state[this.state.Disk_Name][dm] -- ",this.state[this.state.Disk_Name][dm]);
    		
    		if(this.state[this.state.Disk_Name][dm].Mount_Point == ''){
        		vm_error = true;
                toast.error("Please enter Mount Point "+(dm+1));
            	return;
        	}else if(!(/^[a-zA-Z0-9\/]*$/.test(this.state[this.state.Disk_Name][dm].Mount_Point))){
        		vm_error = true;
                toast.error("Please enter valid Mount Point "+(dm+1)+", it allowed only Alphabets, Numbers, slash(/)");
            	return;
        	}else if(this.state[this.state.Disk_Name][dm].Mount_Point.indexOf('/') != 0){
        		vm_error = true;
        		toast.error("Mount Point "+(dm+1)+" should start with slash(/)");
            	return;
        	}else if(Azure_Predefined_Mount_Names.same_values
        			&& Azure_Predefined_Mount_Names.same_values.length > 0
        			&& Azure_Predefined_Mount_Names.same_values.indexOf(this.state[this.state.Disk_Name][dm].Mount_Point) >= 0){
        		vm_error = true;
        		toast.error("Mount Point "+(dm+1)+" should not be predefined value");
            	return;
        	}else if(Azure_Predefined_Mount_Names.mountpoint_labels
        			&& Azure_Predefined_Mount_Names.mountpoint_labels.length > 0
        			&& Azure_Predefined_Mount_Names.mountpoint_labels.indexOf(this.state[this.state.Disk_Name][dm].Mount_Point_Label) >= 0){
        		vm_error = true;
        		toast.error("Mount Point "+(dm+1)+" should not be predefined value");
            	return;
        	}else if(Azure_Predefined_Mount_Names.prefix_values
        			&& Azure_Predefined_Mount_Names.prefix_values.length > 0){
        		for(let mp = 0; mp < Azure_Predefined_Mount_Names.prefix_values.length; mp++){
        			if(this.state[this.state.Disk_Name][dm].Mount_Point.indexOf(Azure_Predefined_Mount_Names.prefix_values[mp]) == 0){
                		vm_error = true;
                		toast.error("Mount Point "+(dm+1)+" should not start with predefined value");
                    	return;
        			}
        		}
        	}
    		
    		if(Existing_Mount_Point_Labels.indexOf(this.state[this.state.Disk_Name][dm].Mount_Point_Label) >= 0){
    			vm_error = true;
                toast.error("Mount point "+(dm+1)+" already exists in VM");
            	return;
    		}else if(Mount_Point_Labels.indexOf(this.state[this.state.Disk_Name][dm].Mount_Point_Label) < 0){
    			Mount_Point_Labels.push(this.state[this.state.Disk_Name][dm].Mount_Point_Label);
    		}else{
        		vm_error = true;
                toast.error("Please enter different Mount point "+(dm+1));
            	return;
        	}
    		if(this.state[this.state.Disk_Name][dm].Mount_Size == ''){
        		vm_error = true;
                toast.error("Please enter Mount Size "+(dm+1));
            	return;
        	}else{
        		totalMountSize +=parseInt(this.state[this.state.Disk_Name][dm].Mount_Size);
        	}
    	}
    	
    	if(totalMountSize > parseInt(this.state.Disk_Size)){
    		vm_error = true;
            toast.error("Please enter valid Mount Sizes, it should not exceed Disk Size including Buffer Size");
        	return;
    	}
    	
    	let vmDiskList = ((this.state.vm_data && this.state.vm_data.vmdetails && this.state.vm_data.vmdetails.dataFromAzure && this.state.vm_data.vmdetails.dataFromAzure.properties && this.state.vm_data.vmdetails.dataFromAzure.properties.storageProfile && this.state.vm_data.vmdetails.dataFromAzure.properties.storageProfile.dataDisks) ? this.state.vm_data.vmdetails.dataFromAzure.properties.storageProfile.dataDisks : []);
    	if(this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.shared_image_tags
  			  && this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.shared_image_tags["UCP-DB-Type"] == 'Oracle'){
    		physical_volume.push({["dgoracldb"+((vmDiskList.length+1)+"").padStart(2,'0')]:[this.state.Disk_Size]});
    	}else{
    		physical_volume.push({["vg_"+((vmDiskList.length+1)+"").padStart(2,'0')]:[this.state.Disk_Size]});
    	}
    	for(let dm = 0; dm < this.state[this.state.Disk_Name].length; dm++){
    		let storage_breakup_obj = {
        		"lvname": this.state[this.state.Disk_Name][dm].Mount_Point_Label,
        		"mount": this.state[this.state.Disk_Name][dm].Mount_Point,
        		"vg": "vg_"+((vmDiskList.length+1)+"").padStart(2,'0'),
        		"size": this.state[this.state.Disk_Name][dm].Mount_Size
        	};
    		if(this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.shared_image_tags
	  			  && this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.shared_image_tags["UCP-DB-Type"] == 'Oracle'){
    			storage_breakup_obj.vg = "dgoracldb"+((vmDiskList.length+1)+"").padStart(2,'0');
	    	}
        	storage_breakup.push(storage_breakup_obj);
    	}
    	storage_breakup.sort(commonFns.fnDynamicArrayOfObjectsSort("lvname"));
	}
	
	if(physical_volume.length > 0){
		mountPointJson[this.state.vm_data.vmdetails.dataFromDB.host_name] = {
    		physical_volume : physical_volume,
    		storage_breakup : storage_breakup,
    		filesystem_type : ["xfs"]
        };
	}
	console.log("mountPointJson --- ", mountPointJson);
//	return;
	
	if(!vm_error){
//	    let newFormData = { "clientid" : formData.clientid,    
//	      "subscription_id" : formData.subscription,    
//	      "name" : formData.name,    
//	      "location" : formData.location,//formData.location.split(/_(.+)/)[1],    
//	      "diskSizeGB" : formData.diskSizeGB,    
//	      "resourceGroup" : formData.resource_group,    
//	      "zone" : formData.zones
//	    };
	    
	    let newFormData = formData;
	    newFormData.mountPointJson = mountPointJson;
	    console.log("newFormData --- ", newFormData);
	
	    this.addDiskList(newFormData);
	}
  };
  
  addDiskList(frmData) {
    this.setState({
      addDiskRequestInProgress: true
    });

    frmData.currency_id = this.state.user.data.currency_id;
    
    let vmData = this.state.vm_data.vmdetails.dataFromDB;
    let request_obj = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {...frmData,
        	"client_id": this.state.clientid,
            "vm_id": vmData.id,
            "user_id": this.state.user_id
        }
    };
    console.log("request_obj --- ", request_obj);
    let request_url = `${config.apiUrl}/secureApi/azure/updateVmRequestThroughJenkins?noencrypt=1`;
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt({
        	"request_type": "Add New Disk",
            "vm_id": vmData.id,
			request_url : request_url,
			request_obj : request_obj,
            "user_id": this.state.user_id,
            clientid:this.state.clientid,
            ref_type : 'vmUpdate'
        }))
    };
    return fetch(`${config.apiUrl}/secureApi/azure/saveVmOpsRequests`, requestOptions).then(response  => {
        response.text().then(text => {
            const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
            
            this.setState({
            	resize_request_inprocess: false
            });
            if (response.ok) {
                var result=(data.value ? data.value : data)
                console.log("saveVmOpsRequests result --- ",result);
                this.setState({
                    addNewDiskModalIsOpen: false,
                    attachDiskModalIsOpen: false,
                  });
            	if(result.status == "success"){
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

    /*const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/azure/addDisk`, requestOptions).then(response  => this.handleAddDiskResponse(response));*/
  }

  azureAttachDiskRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#azureAttachDisk");
    var formData = serialize(form, { hash: true });

    formData.subscription = formData.subscription.split(/_(.+)/)[1];

    let selectedDisk  = [];
    for(let i = 0 ; i  < this.state.attachDisk_DiskList.length; i++){
      if(this.state.attachDisk_DiskList[i].name == formData.attach_disk_list){
        selectedDisk = this.state.attachDisk_DiskList[i];
        break;
      }
    }

    let newFormData = { "clientid" : this.state.clientid,    
    "subscription_id" : formData.subscription,    
    "vmName" : this.state.vm_data.vmdetails.dataFromDB.label_name,    
    "diskId" : selectedDisk.id,
    "storageAccountType" : selectedDisk.sku.name,    
    "diskSizeGB" : selectedDisk.properties.diskSizeGB,    
    "resourceGroup" : formData.resource_group,
    "vmIdFromDB" : this.state.vm_data.vmdetails.dataFromDB.id,     
    "currency_id" : this.state.user.data.currency_id
    };

    this.attachDiskList(newFormData);
  };

  detachDiskHandle(diskRowInfo){
    //$(".sweet-alert").find(".btn-danger").prepend("<i className='fas fa-circle-notch icon-loading'></i>");
    //$(".sweet-alert").find(".btn-danger").attr("disabled",true);
    
    let formdata = { "clientid" : this.state.clientid,    
                      "subscription_id" : this.state.vm_data.vmdetails.dataFromDB.subscriptionId,    
                      "vmName" : this.state.vm_data.vmdetails.dataFromDB.label_name,
                      "diskName" : diskRowInfo.name,
                      "resourceGroup": this.state.vm_data.vmdetails.dataFromDB.resourceGroup
                   }

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formdata)
    };
    return fetch(`${config.apiUrl}/secureApi/azure/detachDisk`, requestOptions)
    .then(res => res.json())
    .then((data) => {
      if (data.status == "success") {
        toast.success(data.message);
        //this.getDiskList( { "clientid" : this.state.clientid, "subscription_id" : this.state.vm_data.vmdetails.dataFromDB.subscriptionId, "resourceGroup" : this.state.vm_data.vmdetails.dataFromDB.resourceGroup});
        setTimeout(() => {
          location.reload(true);
        }, 2000);
      }
      else{
        toast.error(data.message);
      }
    })
    .catch(console.log)
  }
  
  azureDetachDiskAction(diskRowInfo) {
    var dispLable = "Detach Disk From Azure VM";
    
    const getAlert = () => (
      <SweetAlert
        warning
        showCancel
        confirmBtnText={dispLable}
        confirmBtnBsStyle="danger"
        cancelBtnBsStyle="default"
        title="Are you sure?"
        onConfirm={() => this.detachDiskHandle(diskRowInfo)}
        onCancel={this.hideAlert.bind(this)}
      >
      </SweetAlert>
    );
    this.setState({
      sweetalert: getAlert()
    });
  }

  attachDiskList(frmData) {
    this.setState({
      attachDiskRequestInProgress: true
    })
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/azure/attachDisk`, requestOptions).then(response  => this.handleAddDiskResponse(response));
  }

  handleAddDiskResponse(response, stateName) {
    return response.text().then(text => {
        this.setState({
          addDiskRequestInProgress: false,
          attachDiskRequestInProgress: false
        });

        const data = text && JSON.parse(text);
        if (!response.ok) {
          toast.error(data.message);
        }
        else{
          toast.success(data.message);
          this.setState({
            addNewDiskModalIsOpen: false,
            attachDiskModalIsOpen: false,
          });
          setTimeout(() => {
            location.reload(true);
          }, 2000);
          //this.getDiskList( { "clientid" : this.state.clientid, "subscription_id" : this.state.vm_data.vmdetails.dataFromDB.subscriptionId, "resourceGroup" : this.state.vm_data.vmdetails.dataFromDB.resourceGroup});
        }        
    });
  }

  render() { 
    const { azure, profiles } = this.props;
    let loading=this.state.loading;                                      
    let vm_data=this.state.vm_data;  
    let vmDiskList = ((vm_data && vm_data.vmdetails && vm_data.vmdetails.dataFromAzure && vm_data.vmdetails.dataFromAzure.diskInformation) ? vm_data.vmdetails.dataFromAzure.diskInformation : []);
    let diskEncryptionStatus = "";
    let customerKeyCounter = 0;
    let platformKeyCounter = 0,
      dataFromDB = ((vm_data || {}).vmdetails || {}).dataFromDB || {},
      dataFromAzure = ((vm_data || {}).vmdetails || {}).dataFromAzure;

    if(vmDiskList && vmDiskList.length > 0){
    	vmDiskList.map((row, index) =>{
    		if(row.properties && row.properties.encryption && row.properties.encryption.type && row.properties.encryption.type.indexOf("PlatformKey") >= 0){
    			platformKeyCounter++;
    		}else if(row.properties && row.properties.encryption && row.properties.encryption.type && row.properties.encryption.type.indexOf("CustomerKey") >= 0){
    			customerKeyCounter++;
    		}
    	});
//    	if(platformKeyCounter == vmDiskList.length){
//    		diskEncryptionStatus = 'Passed: Enabled with PMK';
//    	}else 
		if(customerKeyCounter == vmDiskList.length){
    		diskEncryptionStatus = '<strong class="text-success">Passed: Enabled with CMK</strong>';
    	}else{
    		diskEncryptionStatus = '<strong class="text-danger">Failed</strong>';
    	}
    }
    let tagInfo = "";
    if(vm_data.vmdetails && vm_data.vmdetails.dataFromAzure 
	  && vm_data.vmdetails.dataFromAzure.tags){ 
    	Object.entries(vm_data.vmdetails.dataFromAzure.tags).map(([tagKey, tagValue]) => {
    		tagInfo += tagKey+" : "+tagValue+"</br>";
	  });
    }
    let vmOsDisk = ((vm_data && vm_data.vmdetails && vm_data.vmdetails.dataFromAzure && vm_data.vmdetails.dataFromAzure.properties && vm_data.vmdetails.dataFromAzure.properties.storageProfile && vm_data.vmdetails.dataFromAzure.properties.storageProfile.osDisk) ? vm_data.vmdetails.dataFromAzure.properties.storageProfile.osDisk : []);
    let vmNetworkInterfaceList = ((vm_data && vm_data.vmdetails && vm_data.vmdetails.dataFromAzure && vm_data.vmdetails.dataFromAzure.properties && vm_data.vmdetails.dataFromAzure.properties.networkProfile && vm_data.vmdetails.dataFromAzure.properties.networkProfile.networkInterfaces) ? vm_data.vmdetails.dataFromAzure.properties.networkProfile.networkInterfaces : []);
    let logData=this.props.azure.logData;         
    let subscription_list = this.props.azure.subscription_list; 
    let subscription_locations = this.props.azure.subscription_locations,
      {vm_console, console_vm_name, vm, loadingOAT, showRerun} = this.state,
      is_manager = this.state.is_manager || {};

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color"><img src="/src/img/azure_img.png" width="50px" className="mr-2" />VM Details</h5>
          {loading && <PageLoader/>}
          {!loading && (this.state.error_message || (vm_data && (!vm_data.vmdetails || !vm_data.vmdetails.dataFromDB))) &&
        	  <h3 className="row text-danger">
          		{((this.state.error_message)?this.state.error_message:"VM info not yet synced in our DB, please try later.")}
          	  </h3>
          }
          {!loading && vm_data && vm_data.vmdetails && vm_data.vmdetails.dataFromDB && vm_data.vmdetails.dataFromDB.status == 0 &&
        	  <h3 className="row text-danger">
          		{((this.state.error_message)?this.state.error_message:"VM Decommissioned.")}
          	  </h3>
          }
          {!loading && vm_data && vm_data.vmdetails && vm_data.vmdetails.dataFromDB && vm_data.vmdetails.dataFromDB.status == 1 && 
        	  <div className="row vm-details1">
	          <div className="col-md-12">    
	          	<span className="text-danger">
			      	Note : If you see any discrepancy in VM information, Please click on "Sync Data From Azure"
			    </span>
	          </div>
            <div className="col-md-12 p-0 vm-details-row mt-3">
              <div className="col-md-12">
                
                {/*commonFns.fnCheckVMOperationsAuth(profiles, commonFns.vmOperations.AzureOperations.OnOff) &&
                  <React.Fragment>
                    {(vm_data.vmdetails.dataFromDB.vm_status.toLowerCase() == "poweredon" || vm_data.vmdetails.dataFromDB.vm_status.toLowerCase() == "running") ?
                    <span className="alert info-box-danger mr-2 cursor-pointer" onClick={() => this.vmAction(vm_data.vm,'stop','Power Off')}><span className="fas fa-power-off mr-2"></span>Power Off</span>
                    :<span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.vmAction(vm_data.vm,'start','Power On')}><span className="fa fa-play mr-2"></span>Power On</span>}
                  </React.Fragment>
                */}
                {commonFns.fnCheckVMOperationsAuth(profiles, commonFns.vmOperations.AzureOperations.Reboot) ?
                  <span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.vmAction(vm_data.vm,'restart','Reboot')}><span className="fa fa-sync-alt mr-2"></span>Reboot</span>:null
                }

                {commonFns.fnCheckVMOperationsAuth(profiles, commonFns.vmOperations.AzureOperations.Terminate) ?
                  <span className="alert info-box-danger mr-2 cursor-pointer" onClick={() => this.vmTerminateAction()}><span className="fa fa-times mr-2"></span>Decommission</span>:null
                }

                {commonFns.fnCheckVMOperationsAuth(profiles, commonFns.vmOperations.AzureOperations.Resize) ?
                  <React.Fragment>
                    {<span className="alert info-box-blue mr-2 cursor-pointer" onClick={() => this.vmResizeForm(vm_data.vm)}><span className="fa fa-expand mr-2"></span>Resize</span>}
                    <Modal
	                    isOpen={this.state.vm_size_popup}
	                    onRequestClose={this.vm_size_popupCloseModal} className="metrics"
	                    >
	                    <h2 style={{lineHeight:1.6+ 'em' }}>
	                        VM Re-Size <span className="float-right btn btn-white-btn-primary cursor-pointer" onClick={this.vm_size_popupCloseModal}>Close</span>
	                        <span className={"float-right m-r-xs btn btn-primary cursor-pointer" + (this.state.resize_request_inprocess ? "no-access" : "")} 
	                        onClick={this.vm_size_popup_update_req}  disabled={this.state.resize_request_inprocess ? true : false} 
	                        >Update{this.state.resize_request_inprocess && (
                                    <i className="fas fa-circle-notch icon-loading"></i>
                            )}</span>
	                    </h2>
	                    {vm_data.vmdetails.dataFromDB.is_cluster == 1 && vm_data.vmdetails.dataFromDB.cluster_host_name && 
	                        <span className="text-danger">
	                        	Note : VM Size will be updated in both cluster nodes
	                        	<br/>
	                        </span>
                    	}
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
                  </React.Fragment>:null
                }

                {commonFns.fnCheckVMOperationsAuth(profiles, commonFns.vmOperations.AzureOperations.History) &&
                  <span className="alert info-box-blue mr-2 cursor-pointer" onClick={() => this.openVmHistory(vm_data)}><span className="fa fa-history mr-2"></span>History</span>
                }
                {/* <span className="alert info-box-blue mr-2 cursor-pointer" onClick={() => 
                  this.openVmOatData(vm_data)}>
                    <span className="fa mr-2"></span>Latest OAT Checklist
                  </span>
                <span className="alert info-box-blue mr-2 cursor-pointer"
                 onClick={() => 
                  this.rerunVmOatChecklist(vm_data)}>
                    <span className="fa mr-2">{this.state.isRerunVmOatChecklistInprogress && 
                        <i className="fas fa-circle-notch icon-loading"></i>
                    }</span>Re-run OAT checklist
                  </span> */}

                <span className="alert info-box-blue mr-2 cursor-pointer"
                 onClick={() => 
                  this.manageVMLock(dataFromDB)}>
                   <span className="fa mr-2">{this.state.vMLockLoading && 
                      <i className="fas fa-circle-notch icon-loading"></i>
                    }</span>{parseInt(dataFromDB.is_locked) ? 'Unlock': 'Lock'}
                </span>

                {commonFns.fnCheckVMOperationsAuth(profiles, commonFns.vmOperations.AzureOperations.syncDataFromAzure) &&
                    <span className="alert info-box-success mr-2 cursor-pointer float-right" onClick={() => this.syncDataFromAzure()}><span className={"fa fa-sync-alt mr-2 "+((this.state.syncDataFromAzureInProgress)?"fa-spin":"")}></span>Sync Data From Azure</span>
                }
              </div>
            </div>
            <div className="col-md-12">
        		<div className="row">
	              <div className="col-md-6 float-left">
	                <div className="col-md-4 float-left p-0"><h6>VM Name : </h6></div>
	                <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.label_name}</div>
	              </div>
	              <div className="col-md-6 float-right">
	                <div className="col-md-4 float-left p-0"><h6>VM Status : </h6></div>
	                <div className="col-md-8 float-right p-0 text-capitalize">{vm_data.vmdetails.dataFromDB.vm_status}</div>
	              </div>
	              <div className="col-md-6 float-left">
	                <div className="col-md-4 float-left p-0"><h6>VM Location : </h6></div>
	                <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromAzure.location}</div>
	              </div>
	              {/*<div className="col-md-6 float-right">
	                <div className="col-md-4 float-left p-0"><h6>Cloud type : </h6></div>
	                <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.copy_type}</div>
	              </div>*/}
	              <div className="col-md-6 float-right">
		              <div className="col-md-4 float-left p-0"><h6>VM Size : </h6></div>
		              <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.vmSize}</div>
		          </div>
	              <div className="col-md-6 float-left">
	                <div className="col-md-4 float-left p-0"><h6>Resource Group : </h6></div>
	                <div className="col-md-8 float-right p-0 wordwrap">{vm_data.vmdetails.dataFromDB.resourceGroup}</div>
	              </div>
	              <div className="col-md-6 float-right">
	                <div className="col-md-4 float-left p-0"><h6>CPU Core : </h6></div>
	                <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.cpu_units}</div>
	              </div>
	              <div className="col-md-6 float-left">
	                <div className="col-md-4 float-left p-0"><h6>Memory(GB) : </h6></div>
	                <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.ram_units_gb}</div>
	              </div>
	              <div className="col-md-6 float-right">
	                <div className="col-md-4 float-left p-0"><h6>Total Disk Size(GB) : </h6></div>
	                <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.disk_units_gb}</div>
	              </div>
	              <div className="col-md-6">
	                <div className="col-md-4 float-left p-0"><h6>OS Template : </h6></div>
	                <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.os_template_name}</div>
	              </div>        
	              <div className="col-md-6">
	                <div className="col-md-4 float-left p-0"><h6>OS Disk Size(GB) : </h6></div>
	                <div className="col-md-8 float-right p-0">{vmOsDisk.diskSizeGB}</div>
	              </div>
		            {/*<div className="col-md-6">
		              <div className="col-md-4 float-left p-0"><h6>OS Name : </h6></div>
		              <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.osName}</div>
		            </div>*/}
		            <div className="col-md-6">
		              <div className="col-md-4 float-left p-0"><h6>OS Version : </h6></div>
		              <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.osVersion}</div>
		            </div>
	              <div className="col-md-6">
	                <div className="col-md-4 float-left p-0"><h6>Virtual Network : </h6></div>
	                <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.virtualNetwork}</div>
	              </div>
	              <div className="col-md-6">
	                <div className="col-md-4 float-left p-0"><h6>Network Interface : </h6></div>
	                <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.networkInterface}</div>
	              </div>
	              <div className="col-md-6">
	                <div className="col-md-4 float-left p-0"><h6>Accelerated Networking : </h6></div>
	                <div className="col-md-8 float-right p-0">{((vm_data.vmdetails.dataFromAzure.networkInformation && vm_data.vmdetails.dataFromAzure.networkInformation.properties && vm_data.vmdetails.dataFromAzure.networkInformation.properties.enableAcceleratedNetworking)?vm_data.vmdetails.dataFromAzure.networkInformation.properties.enableAcceleratedNetworking.toString():"false")}</div>
	              </div>
	              <div className="col-md-6">
	                <div className="col-md-4 float-left p-0"><h6>Private IP Address : </h6></div>
	                <div className="col-md-8 float-right p-0 wordwrap">{((vm_data.vmdetails.dataFromDB.multiple_ip && vm_data.vmdetails.dataFromDB.multiple_ip.ip_address)?vm_data.vmdetails.dataFromDB.multiple_ip.ip_address:"")}</div>
	              </div>
		            <div className="col-md-6">
		              <div className="col-md-4 float-left p-0"><h6>CI Number : </h6></div>
		              <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.cmdb_ci_number}</div>
		            </div>
		            <div className="col-md-6">
		              <div className="col-md-4 float-left p-0"><h6>RFC Number : </h6></div>
		              <div className="col-md-8 float-right p-0 wordwrap">{vm_data.vmdetails.dataFromDB.cmdb_rfc_number}</div>
		            </div>
		            <div className="col-md-6">
		              <div className="col-md-4 float-left p-0"><h6>Search Code : </h6></div>
		              <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.search_code}</div>
		            </div>
		            <div className="col-md-6">
		              <div className="col-md-4 float-left p-0"><h6>MiddleWare CI Number : </h6></div>
		              <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.cmdb_ci_mw_number}</div>
		            </div>
		            <div className="col-md-6">
		              <div className="col-md-4 float-left p-0"><h6>DB Search Code : </h6></div>
		              <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.cmdb_db_search_code}</div>
		            </div>
		            <div className="col-md-6">
		              <div className="col-md-4 float-left p-0"><h6>DB CI Number : </h6></div>
		              <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.cmdb_db_ci_number}</div>
		            </div>
		            <div className="col-md-6">
		              <div className="col-md-4 float-left p-0"><h6>Is Cluster : </h6></div>
		              <div className="col-md-8 float-right p-0">{(vm_data.vmdetails.dataFromDB.is_cluster == 1)?"Yes":"No"}</div>
		            </div>
		            {(vm_data.vmdetails.dataFromDB.is_cluster == 1) &&
			            <div className="col-md-6">
			              <div className="col-md-4 float-left p-0"><h6>Cluster VM Name : </h6></div>
			              <div className="col-md-8 float-right p-0">{vm_data.vmdetails.dataFromDB.cluster_host_name}</div>
			            </div>
		            }
		            <div className="col-md-6">
		              <div className="col-md-4 float-left p-0"><h6>Impacted BU : </h6></div>
		              <div className="col-md-8 float-right p-0">{(this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj 
		            		  && this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.cmdbBuUnit)?this.state.vm_data.vmdetails.dataFromDB.vm_creation_request_obj.cmdbBuUnit:""}</div>
		            </div>
		            <div className="col-md-6">
		              <div className="col-md-4 float-left p-0"><h6>VM Creation Time : </h6></div>
		              <div className="col-md-8 float-right p-0">{this.state.vm_data.vmdetails.dataFromDB.vmCreationTime} {this.state.vm_data.vmdetails.dataFromDB.vmCreationTime && this.state.user.data.TIME_ZONE}</div>
		            </div>
		        	<div className="col-md-6">
		        		<div className="col-md-4 float-left p-0"><h6>VM Provisioned By : </h6></div>
		        		<div className="col-md-8 float-right p-0">{this.state.vm_data.vmdetails.dataFromDB.provisioned_by}</div>
		            </div>
		            <div className="col-md-6">
		              <div className="col-md-4 float-left p-0"><h6>VM Locked Status : </h6></div>
		              <div className="col-md-8 float-right p-0">{parseInt(dataFromDB.is_locked) ? 'Locked': 'Unlock'}</div>
		            </div>
		            {dataFromDB.locked_by_user_email && 
			            <div className="col-md-6">
			              <div className="col-md-4 float-left p-0"><h6>VM Locked By : </h6></div>
			              <div className="col-md-8 float-right p-0">{dataFromDB.locked_by_user_email}</div>
			            </div>
		            }
		            {dataFromDB.locked_by_user_email && 
			            <div className="col-md-6">
			              <div className="col-md-4 float-left p-0"><h6>VM Locked Date : </h6></div>
			              <div className="col-md-8 float-right p-0">{dataFromDB.locked_date} {this.state.user.data.TIME_ZONE}</div>
			            </div>
		            }
		            {dataFromDB.zone && 
			            <div className="col-md-6">
			              <div className="col-md-4 float-left p-0"><h6>Zone : </h6></div>
			              <div className="col-md-8 float-right p-0">{dataFromDB.zone}</div>
			            </div>
		            }
		            {dataFromDB.availabilty_set && 
			            <div className="col-md-6">
			              <div className="col-md-4 float-left p-0"><h6>Availabilty Set : </h6></div>
			              <div className="col-md-8 float-right p-0">{dataFromDB.availabilty_set}</div>
			            </div>
		            }
	            	<div className="col-md-6">
	            		<div className="col-md-4 float-left p-0"><h6>Azure tags : </h6></div>
	            		<div className="col-md-8 float-right p-0"><div dangerouslySetInnerHTML={{ __html: tagInfo }} /></div>
		            </div>
	            </div>
	        </div>
            {vm_data.jobdata && <div>
              <h5 className="color float-left mt-4 mb-2">Backup Job Details</h5><a className="btn btn-primary cursorpointer2 btn-sm float-right mt-4 mb-2" 
              onClick={() => this.veeamAction(job,'create')}><i className="fa fa-plus"></i>&nbsp;<span>Create Job</span>
              </a>
              <table className="table table-bordered table-striped table-dark table-custom table-hover">
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Job Name</th>
                  <th>Job Type</th>
                  <th>Job Mode</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
              {vm_data.jobdata.map((job,index)=>
              <tr key={index+1}>
                <td>{index+1}</td>
                <td>{job.cx_job_name}</td>
                <td>{job.cx_type}</td>
                <td>{job.cx_mode}</td>
                <td><a className="btn btn-danger cursorpointer btn-sm" 
              onClick={() => this.veeamAction(job,'delete')}><span>Delete</span>
              </a><a className="btn btn-info cursorpointer btn-sm" 
              onClick={() => this.veeamAction(job,'enable')}><span>Enable</span>
              </a><a className="btn btn-warning cursorpointer btn-sm" 
              onClick={() => this.veeamAction(job,'delete')}><span>Disable</span>
              </a></td>
                </tr>
              )}
              </tbody>
              </table>
            </div>
            }
            <br/>
          </div>}
          <div className="clear-both"></div>
          {!loading && vm_data && vm_data.vmdetails && vm_data.vmdetails.dataFromDB && vm_data.vmdetails.dataFromDB.status == 1 && 
        	<div className="row mt-3 mb-4">
            <div className="col-md-6">
              <h5 className="color sub-heading">VM Disks</h5>
            </div>
            <div className="col-md-6">
              <div className="text-right">
                {/*<button className="btn btn-sm btn-primary mr-2" onClick={this.openModalAttachDisk}><i className="fa fa-plus"></i> Attach Disk</button>*/}
                <button className="btn btn-sm btn-primary" onClick={this.openModalAddNewDisk}><i className="fa fa-plus"></i> Add New Disk</button>
                <Modal
                    isOpen={this.state.attachDiskModalIsOpen}
                    onRequestClose={this.closeModalAttachDisk}              
                    contentLabel="Add Resource Group"
                    >
                    <h2 style={{color:'red'}}>
                        Attach Disk To Azure VM<span className="float-right cursor-pointer" onClick={this.closeModalAttachDisk}><i className="fa fa-times" /></span>
                    </h2>

                    <div className="col-md-12">
                        <div className="panel panel-default" />
                        <form
                        name="azureAttachDisk"
                        id="azureAttachDisk"
                        method="post"
                        onSubmit={this.azureAttachDiskRequest}
                        >
                        <div className="form-group">
                            <label htmlFor="subscription">Subscription Id<span className="star-mark">*</span></label>
                            : {!loading && vm_data.vmdetails && vm_data.vmdetails.dataFromDB && vm_data.vmdetails.dataFromDB.subscriptionId} / {!loading && vm_data.vmdetails && vm_data.vmdetails.dataFromDB && vm_data.vmdetails.dataFromDB.subscription_display_name}
                            <input type="hidden" name="subscription" value={vm_data.vmdetails.dataFromDB.clientid+"_"+vm_data.vmdetails.dataFromDB.subscriptionId} />
                            {/*<select
                            className="form-control"
                            required
                            name="subscription"        
                            onChange={e => this.handleAzureSubscriptions(e.target.value)}      
                            >
                                <option value="">-Select-</option>
                                {subscription_list && subscription_list.map((sub, index) =>
                                    <option value={sub.clientid+"_"+sub.subscription_id} key={index}>
                                        {sub.subscription_id} / {sub.display_name}
                                    </option>
                                )}
                            </select>*/}
                        </div>
                        <div className="form-group">
                            <label htmlFor="location">Location<span className="star-mark">*</span></label>
                            : {!loading && vm_data.vmdetails && vm_data.vmdetails.dataFromDB && vm_data.vmdetails.dataFromDB.location_display_name}
                            <input type="hidden" name="location" value={vm_data.vmdetails.dataFromAzure.location} />
                            {/*<select
                            className="form-control"
                            required
                            name="location"
                            onChange={e => this.handleAzureResourceGroups(e.target.value)}                     
                            >
                                <option value="">-Select-</option>
                                {subscription_locations && subscription_locations.map((l, index) =>
                                    <option value={l.id+"_"+l.name} key={index}>
                                        {l.display_name}
                                    </option>
                                )}
                            </select>*/}
                        </div>
                        <div className="form-group">
                            <label htmlFor="resource_group">Resource Group<span className="star-mark">*</span></label>
                            : {!loading && vm_data.vmdetails && vm_data.vmdetails.dataFromDB && vm_data.vmdetails.dataFromDB.resourceGroup}
                            <input type="hidden" name="resource_group" value={vm_data.vmdetails.dataFromDB.resourceGroup} />
                            {/*<select
                            className="form-control"
                            required
                            name="resource_group"
                            onChange={e => this.handleAzureDiskList(e.target.value)}          
                            >
                                <option value="">-Select-</option>
                                {this.state.resourceGroups && this.state.resourceGroups.map((l, index) =>
                                    <option value={l.name} key={index}>
                                        {l.name}
                                    </option>
                                )}
                            </select>*/}
                        </div>
                        <div className="form-group">
                            <label htmlFor="name">Available Disk List (disks which are not attached to any VMs)<span className="star-mark">*</span></label>
                            <select
                            className="form-control"
                            required
                            name="attach_disk_list"
                            id="attach_disk_list"
                        	onChange={this.bindField}
                            >
                                <option value="">-Select-</option>
                                {this.state.attachDisk_DiskList && this.state.attachDisk_DiskList.map((l, index) =>
                                    <option value={l.name} key={index}>
                                        {l.name}
                                    </option>
                                )}
                            </select>
                            {this.state.attachdiskDiskListInprogress && <i className="fas fa-circle-notch icon-loading icon-loading-on-selectbox"></i> }
                            <br/>{this.state.selectedStorageType && "Storage Type : "+this.state.selectedStorageType+", "}{this.state.selectedDiskSize && "Disk Size : "+this.state.selectedDiskSize}
                        </div>
                        
                        <div className="form-group">
                            <input type="hidden" name="clientid" value={this.state.clientid} />
                            <button 
                            className={"btn btn-sm btn-primary " + (this.state.attachDiskRequestInProgress ? "no-access" : "")} disabled={this.state.attachDiskRequestInProgress ? true : false}
                            >
                            {this.state.attachDiskRequestInProgress && 
                                <i className="fas fa-circle-notch icon-loading"></i>
                            }
                            Submit</button>
                        </div>
                        </form>
                    </div>
                </Modal>
                <Modal
                    isOpen={this.state.addNewDiskModalIsOpen}
                    onRequestClose={this.closeModalAddNewDisk}              
                    contentLabel="Add Resource Group"
                    >
                    <h2 style={{color:'red'}}>
                        Add New Disk To Vm <span className="float-right cursor-pointer" onClick={this.closeModalAddNewDisk}><i className="fa fa-times" /></span>
                    </h2>

                    <div className="col-md-12">
                        <div className="panel panel-default" />
                        <form
                        name="azureAddNewDisk"
                        id="azureAddNewDisk"
                        method="post"
                        onSubmit={this.azureAddNewDiskRequest}
                        >
                        <div className="form-group">
                            <label htmlFor="subscription">Subscription Id<span className="star-mark">*</span></label>
                            : {!loading && vm_data.vmdetails && vm_data.vmdetails.dataFromDB && vm_data.vmdetails.dataFromDB.subscription_display_name} / {!loading && vm_data.vmdetails && vm_data.vmdetails.dataFromDB && vm_data.vmdetails.dataFromDB.subscriptionId}
                            <input type="hidden" name="subscription" value={vm_data.vmdetails.dataFromDB.clientid+"_"+vm_data.vmdetails.dataFromDB.subscriptionId} />
                            <input type="hidden" name="zones" value={vm_data.vmdetails.dataFromAzure.zones && vm_data.vmdetails.dataFromAzure.zones[0]} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="location">Location<span className="star-mark">*</span></label>
                            : {!loading && vm_data.vmdetails && vm_data.vmdetails.dataFromDB && vm_data.vmdetails.dataFromDB.location_display_name}
                            <input type="hidden" name="location" value={vm_data.vmdetails.dataFromAzure.location} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="resource_group">Resource Group<span className="star-mark">*</span></label>
                            : {!loading && vm_data.vmdetails && vm_data.vmdetails.dataFromDB && vm_data.vmdetails.dataFromDB.resourceGroup}
                            <input type="hidden" name="resource_group" value={vm_data.vmdetails.dataFromDB.resourceGroup} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="location">VM Name<span className="star-mark">*</span></label>
                            : {!loading && vm_data.vmdetails && vm_data.vmdetails.dataFromDB && vm_data.vmdetails.dataFromDB.label_name}
                        </div>
                        {vm_data.vmdetails.dataFromDB.is_cluster == 1 && vm_data.vmdetails.dataFromDB.cluster_host_name && 
	                        <div className="form-group">
		                        <label htmlFor="location">Cluster VM Name<span className="star-mark">*</span></label>
		                        : {!loading && vm_data.vmdetails && vm_data.vmdetails.dataFromDB && vm_data.vmdetails.dataFromDB.cluster_host_name}
		                    </div>
                        }
                        <div className="form-group">
	                        <label htmlFor="ip_address_prefix">Disk Name<span className="star-mark">*</span></label>
	                        <input
	                        type="text" readOnly
	                        className="form-control-vm"
	                        name="Disk_Name"
	                        required   
	                        placeholder="Ex: Hard_Disk_1"
                        	onChange={this.bindField}
	                        value={this.state.Disk_Name}
	                        />
	                    </div>
		  			          <div className="form-group">
		  			              <label htmlFor="cloud_type" className=''>Disk Storage Type <span className="star-mark">*</span></label>
		  		                  <select
		  		                      className="form-control"
		  		                      value={this.state.Disk_Storage_Type}
		  		                      name="Disk_Storage_Type"
		  		                    	required
		  		                    	onChange={this.bindField}
		  		                      >
		  		                      <option value="">--SELECT--</option>
		  		                      {this.state.storageTypesList && this.state.storageTypesList.length > 0 && this.state.storageTypesList.map((row, index) =>
			  		                  	<React.Fragment key={index}>
				                    	  {( !loading && vm_data.vmdetails && vm_data.vmdetails.dataFromDB && (vm_data.vmdetails.dataFromDB.PremiumIO == 'True' || (vm_data.vmdetails.dataFromDB.PremiumIO != 'True' && row != 'Premium_LRS'))) && 
						                      <option value={row}>
						                          {row}
						                      </option>
				                    	  }
				                    	</React.Fragment>
		  		                      )}
		  	                      </select>
		  			          </div>
		  			          <div className="form-group">
		  			              <label htmlFor="cloud_type" className=''>Disk Storage SKU <span className="star-mark">*</span></label>
		  		                  <select
		  		                      className="form-control"
		  		                      value={this.state.Disk_Storage_Size}
		  		                      name="Disk_Storage_Size"
		                          	  id={"Disk_Storage_Size"}
		  		                  		required
		  		                  		onChange={this.bindField}
		  		                      >
		  		                      <option value="">--SELECT--</option>
		  		                      {this.state.storageSkusList && this.state.storageSkusList.length > 0 && this.state.storageSkusList.map((row, index) =>
		  		                      	<React.Fragment key={index}>
		  		                      	  {this.state.Disk_Storage_Type == row.name && 
		  			                    	  <option value={row.size+"_"+row.MinSizeGiB+"_"+row.MaxSizeGiB}>
		  			                          	{row.size+" - "+row.MaxSizeGiB+" GB"}
		  			                          </option>
		  			                      }
		  		                      	</React.Fragment>
		  		                      )}
		  	                      </select>
		  			          </div>
		  			        {this.createDiskUI()}
                        
                        
                        <div className="form-group">
                        	{vm_data.vmdetails.dataFromDB.is_cluster == 1 && vm_data.vmdetails.dataFromDB.cluster_host_name && 
		                        <span className="text-danger">
		                        	Note : Disk will be added in both cluster nodes
		                        	<br/>
		                        </span>
                        	}
                            <input type="hidden" name="clientid" value={this.state.clientid} />
                            <button
                            className={"btn btn-sm btn-primary " + (this.state.addDiskRequestInProgress ? "no-access" : "")} disabled={this.state.addDiskRequestInProgress ? true : false}
                            >
                            {this.state.addDiskRequestInProgress && 
                                <i className="fas fa-circle-notch icon-loading"></i>
                            }
                            Submit</button>
                        </div>
                        </form>
                    </div>
                </Modal>
                <Modal
                isOpen={this.state.extendDiskModalIsOpen}
                onRequestClose={this.closeModalExtendDisk}              
                contentLabel="Extend Disk"
                >
                <h2 style={{color:'red'}}>
                	Extend Disk <span className="float-right cursor-pointer" onClick={this.closeModalExtendDisk}><i className="fa fa-times" /></span>
                </h2>

                <div className="col-md-12">
                    <div className="panel panel-default" />
                    <form
                    name="azureExtendDisk"
                    id="azureExtendDisk"
                    method="post"
                    onSubmit={this.azureExtendDiskRequest}
                    >
                    <div className="form-group">
                        <label htmlFor="ip_address_prefix">Disk Name</label>&nbsp;:&nbsp;{this.state.existingDisk.name}
                    </div>
                    <div className="form-group">
	                    <label htmlFor="ip_address_prefix">Existing Disk Size (GB)</label>&nbsp;:&nbsp;{this.state.existingDisk.diskSizeGB}
	                </div>
                    <div className="form-group">
                        <label htmlFor="name">New Disk Size (GB)<span className="star-mark">*</span></label>
                        <input
                        type="text"
                        className="form-control"
                        name="extendDiskSizeGB"
                        required                      
                        placeholder="100"
                    	onChange={this.bindField}
                    	value={this.state.extendDiskSizeGB}
                        />
                    </div>
                    
                    <div className="form-group">
                        <input type="hidden" name="clientid" value={this.state.clientid} />
                        <button
                        className={"btn btn-sm btn-primary " + (this.state.extendDiskRequestInProgress ? "no-access" : "")} disabled={this.state.extendDiskRequestInProgress ? true : false}
                        >
                        {this.state.extendDiskRequestInProgress && 
                            <i className="fas fa-circle-notch icon-loading"></i>
                        }
                        Submit</button>
                    </div>
                    </form>
                </div>
            </Modal>
              </div>
            </div>
            {vmDiskList && vmDiskList.length > 0 && vm_data.vmdetails.dataFromDB.status == 1 &&
            <div className="col-md-12">
              <div className="dataTables_wrapper dt-bootstrap4 mt-2">
                  <table className="table table-hover table-striped dataTable">
                      <thead>
                          <tr>
                              <th>Disk Name</th>
                              <th>Disk Size (GB)</th>
                              <th>Storage Account Type</th>
                              <th>Encryption Type</th>
                              <th>Encryption Name</th>
                              {/*<th>Actions</th>*/}
                          </tr>
                      </thead>
                      <tbody>
                        {vmDiskList && vmDiskList.length > 0 && vmDiskList.map((row, index) =>
                            <tr key={index}>
                                <td>
                                    {row.name}
                                </td>
                                <td>
                                    {((row.properties && row.properties.diskSizeGB)?row.properties.diskSizeGB:"")}
                                </td>
                                <td>
                                	{((row.sku && row.sku.name)?row.sku.name:"")}
                                </td>
                                <td>
	                                {((row.properties && row.properties.encryption && row.properties.encryption.type)?row.properties.encryption.type:"")}
	                            </td>
	                            <td>
	                            	{((row.properties && row.properties.encryption && row.properties.encryption.diskEncryptionSetId)?row.properties.encryption.diskEncryptionSetId.split("/")[(row.properties.encryption.diskEncryptionSetId.split("/").length-1)]:"")}
		                        </td>
                                {/*<td className="text-center">
                                  <button className="btn btn-sm btn-danger" onClick={() => this.azureDetachDiskAction(row)}><i className="fas fa-minus-circle"></i> Detach Disk</button>
                                  <button className="btn btn-sm" onClick={() => this.openModalExtendDisk(row)}><i className="fa fa-edit"></i> </button>
                                </td>*/}
                            </tr>
                        )}
                      </tbody>
                  </table>
              </div>
              {/*<span className="text-danger">
              	Note : If the Disk size is not visible, please "Power On" the Virtual Machine.
        	  </span>*/}
            {/* <OatCheckList {...this.props} vm_data={vm_data} ></OatCheckList> */}
            {dataFromDB.osType == 'Linux' && <CyberarkList 
              hostname={(((vm_data || {}).vmdetails || {}).dataFromAzure || {}).name}
              osType={dataFromDB.osType} location={dataFromDB.location} 
              os_template_name={dataFromDB.os_template_name}
              resourceGroup={dataFromDB.resourceGroup}
            ></CyberarkList>}

            {dataFromDB.osType == 'Windows' && <WindowsVMAccessInfo 
              hostname={(((vm_data || {}).vmdetails || {}).dataFromAzure || {}).name}
              osType={dataFromDB.osType} location={dataFromDB.location} 
              vmId={dataFromDB.id}
              os_template_name={dataFromDB.os_template_name}
              resourceGroup={dataFromDB.resourceGroup}
            ></WindowsVMAccessInfo>}
            </div>}
          </div>}
          
          <div className="clear-both"></div>
          {!loading 
        	  && vm_data.vmdetails 
        	  && vm_data.vmdetails.dataFromAzure && vm_data.vmdetails.dataFromDB.status == 1 && 
        	  <div className="row mt-3 mb-4">
	            <div className="col-md-6">
	              <h5 className="color sub-heading">Azure Portal OAT Checklist:</h5>
	            </div>
	            <div className="col-md-12">
	              <div className="dataTables_wrapper dt-bootstrap4 mt-2">
			            <table className="table table-hover table-striped dataTable">
			            	<tbody>
			                    <tr>
			                        <th>Disk Encryption</th>
			                        <td>
			                        <div dangerouslySetInnerHTML={ {__html: diskEncryptionStatus} } />
			                        </td>
			                    </tr>
			                    <tr>
			                        <th>Backup Details</th>
			                        <td>
			                        {vm_data.vmdetails 
			                      	  && vm_data.vmdetails.dataFromDB 
			                      	  && vm_data.vmdetails.dataFromDB.backup_details 
			                      	  && vm_data.vmdetails.dataFromDB.backup_details.properties && 
			                      	  <div className="row mt-3 mb-4">
			              	            <div className="col-md-12">
			              	              <div className="dataTables_wrapper dt-bootstrap4 mt-2">
			              			            <table className="table table-hover table-striped dataTable">
			              			            	<tbody>
			              			                    {/*<tr>
			              			                        <th>Friendly Name</th>
			              			                        <td>{vm_data.vmdetails.dataFromDB.backup_details.properties.friendlyName}</td>
			              			                    </tr>*/}
			              			                    <tr>
			              				                    <th>Vault Name</th>
			              				                    <td>{((vm_data.vmdetails.dataFromDB.backup_details.properties.policyId)?vm_data.vmdetails.dataFromDB.backup_details.properties.policyId.split("/")[8]:"")}</td>
			              				                </tr>
			              			                    <tr>
			              				                    <th>Policy Name</th>
			              				                    <td>{vm_data.vmdetails.dataFromDB.backup_details.properties.policyName}</td>
			              				                </tr>
			              			                    <tr>
			              				                    <th>Protection Status</th>
			              				                    <td>{vm_data.vmdetails.dataFromDB.backup_details.properties.protectionStatus}</td>
			              				                </tr>
			              			                    <tr>
			              				                    <th>Health Status</th>
			              				                    <td>{vm_data.vmdetails.dataFromDB.backup_details.properties.healthStatus}</td>
			              				                </tr>
			              				                {/*<tr>
			              				                    <th>Health Details</th>
			              				                    <td>
			              				                    	<ul>
			              					                    	{vm_data.vmdetails.dataFromDB.backup_details.properties.healthDetails && vm_data.vmdetails.dataFromDB.backup_details.properties.healthDetails.map((data, index) =>
			              						                        <li key={index}>
			              						                        	<span>title : {data.title}</span><br/>
			              						                        	<span>message : {data.message}</span>
			              						                        </li>
			              						                    )}
			              					                    </ul>
			              				                    </td>
			              				                </tr>*/}
			              			                    <tr>
			              				                    <th>Last Backup Status</th>
			              				                    <td>{vm_data.vmdetails.dataFromDB.backup_details.properties.lastBackupStatus}</td>
			              				                </tr>
			              				                <tr>
			              				                    <th>Last Backup Time</th>
			              				                    <td>{vm_data.vmdetails.dataFromDB.backup_details.properties.lastBackupTime}</td>
			              				                </tr>
			              				                {/*<tr>
			              				                    <th>protectedItemDataId</th>
			              				                    <td>{vm_data.vmdetails.dataFromDB.backup_details.properties.protectedItemDataId}</td>
			              				                </tr>*/}
			              			                </tbody>
			              			            </table>
			              		            </div>
			              	            </div>
			              	          </div>}
			                        </td>
			                    </tr>
		                    </tbody>
			            </table>
		            </div>
	            </div>
	          </div>}
          
          <div className="clear-both"></div>
          {this.state.sweetalert}
      </div>
      <Modal
          isOpen={this.state.modalVmOatData}  
          onRequestClose={this.modalCloseVm}
          contentLabel="VM Console Modal"  className="metrics">
          <h2 style={{color:'red'}}>
          VM {console_vm_name} Console <a className="float-right" href="javascript:void(0);" onClick={this.modalCloseVm}><i className="fa fa-times" /></a>
          </h2>
          {loadingOAT && <PageLoader/>}
          <div className="col-md-12">
            <div className="panel panel-default"></div>
            <pre><div>{vm_console}</div></pre>
          </div>
          </Modal>
      <Modal
          isOpen={this.state.modalVmHistory}  
          onRequestClose={this.modalCloseVm}
          contentLabel="VM Details Modal"  className="metrics">
          <h2 style={{color:'red'}}>
            VM History <a className="float-right" href="javascript:void(0);" onClick={this.modalCloseVm}><i className="fa fa-times" /></a>
          </h2>
          <div className="table-responsive">
          {logData &&
            <table className="table table-bordered table-striped table-dark table-custom table-hover" id="vm_logs">
              <thead>
                  <tr>
                    <th>SL</th>
                    <th>Vm Name</th>
                    <th>Description</th>
                    <th>Log Time</th>
                  </tr>
              </thead>
              <tbody>
                {logData && logData.map((data, index) =>
                    <tr key={index}>
                      <td>{index+1}</td>
                      <td>{vm_data.vmdetails.dataFromDB.label_name}</td>
                      <td>{data.description}</td>
                      <td><Moment format="YYYY-MM-DD hh:mm A">{data.createddate*1000}</Moment></td>
                    </tr>
                  )}
              </tbody>
            </table>
          }
          </div>
        </Modal>
        <br/><br/><br/>
    </div> 
    );
  }
}

function mapStateToProps(state) {
  const { azure,vm_data,logData, profiles } = state;
  return {
    azure,
    vm_data,
    logData,
    profiles
  };
}

const connectedVmlist = connect(mapStateToProps)(AzureVmDetail);
export { connectedVmlist as AzureVmDetail };