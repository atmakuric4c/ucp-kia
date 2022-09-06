import React from 'react';
import { connect } from 'react-redux';
import { awsActions } from './aws.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import Moment from 'react-moment';
import PageLoader from '../PageLoader';
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';
import { commonFns } from "../../_helpers/common";

Modal.setAppElement("#app");
class AwsVmDetail extends React.Component {
  constructor(props) {
    super(props);
    
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      user: user,
      clientid: user.data.clientid,
      user_role: user.data.user_role,
      aws: [],
      vm_data:"",
      logData: [],
      jobdata:[],
      sweetalert: true,
      modalIsOpen: false,
      modalVmHistory: false,
      addNetworkModalIsOpen: false,
      addNewDiskModalIsOpen: false,
      attachDiskModalIsOpen: false,
      action: null,
      loading:true,
      virtualnetworks: [],
      vmDiskList: [],
      resourceGroups:[],
      subscription_id: "",
      resourceGroupName: "",
      addDiskRequestInProgress: false,
      attachDiskRequestInProgress: false,
      attachDisk_DiskList: [],
      vmDetails: [],
      isItFirstLoad: false
    };
    this.loaderImage=this.loaderImage.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);

    this.openVmHistory = this.openVmHistory.bind(this);
    this.modalCloseVm = this.modalCloseVm.bind(this);
    this.getVirtualNetworks = this.getVirtualNetworks.bind(this);
    this.getDiskList = this.getDiskList.bind(this);

    this.openModalAddNetworks = this.openModalAddNetworks.bind(this);
    this.closeModalAddNetworks = this.closeModalAddNetworks.bind(this);
    this.handleAwsSubscriptions = this.handleAwsSubscriptions.bind(this);
    this.handleAwsResourceGroups = this.handleAwsResourceGroups.bind(this);

    this.openModalAddNewDisk = this.openModalAddNewDisk.bind(this);
    this.closeModalAddNewDisk = this.closeModalAddNewDisk.bind(this);

    this.openModalAttachDisk = this.openModalAttachDisk.bind(this);
    this.closeModalAttachDisk = this.closeModalAttachDisk.bind(this);
    
    this.getVMDetails = this.getVMDetails.bind(this);
  }
  
  loaderImage(){
    this.props.dispatch(awsActions.getAll(0));
  }
  openModal() {      
    this.setState({ modalIsOpen: true });
  }
  closeModal() {
    this.setState({ modalIsOpen: false });
    window.location.reload();         
  }

  openModalAddNetworks(){
    this.props.dispatch(awsActions.getAwsSubscriptions({clientid:this.state.clientid}));    
    this.setState({ addNetworkModalIsOpen: true });
  }
  closeModalAddNetworks(){
    this.setState({ addNetworkModalIsOpen: false });
  }
  openModalAddNewDisk(){
    this.props.dispatch(awsActions.getAwsSubscriptions({clientid:this.state.clientid}));    
    this.setState({ addNewDiskModalIsOpen: true });
  }
  closeModalAddNewDisk(){
    this.setState({ addNewDiskModalIsOpen: false });
  }
  openModalAttachDisk(){
    this.props.dispatch(awsActions.getAwsSubscriptions({clientid:this.state.clientid}));    
    this.setState({ attachDiskModalIsOpen: true });
  }
  closeModalAttachDisk(){
    this.setState({ attachDiskModalIsOpen: false });
  }
  handleAwsSubscriptions = (subscription) => {
    if(subscription != ''){
        this.setState({subscription:subscription})
        this.props.dispatch(awsActions.getAwsSubscriptionLocations({clientid:this.state.clientid,subscription:subscription}));
    }
  }
  handleAwsResourceGroups = (location) => {
      var subscription=this.state.subscription;
      if(subscription != '' && location!=''){
          const requestOptions = {
              method: 'POST',
              headers: { ...authHeader(), 'Content-Type': 'application/json' },
              body: JSON.stringify({subscription:subscription,location:location})
          };
          return fetch(`${config.apiUrl}/secureApi/aws/get_resrouce_group_list`, requestOptions)
          .then(res => res.json())
          .then((data) => {
              this.setState({ resourceGroups: data })
          })
          .catch(console.log)
          }
  }

  handleAwsDiskList  = (resourceGroup) => {
    if(resourceGroup){
      let frmData = {clientid: this.state.clientid, subscription_id:this.state.subscription.split(/_(.+)/)[1],diskState : "Unattached", resourceGroup: resourceGroup };
      const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
      };

      fetch(`${config.apiUrl}/secureApi/aws/getDiskList`, requestOptions).then(response  => this.handleResponse(response, "attachDisk_DiskList"));
    }
 }

  openVmHistory(vm_data) {      
    this.setState({ modalVmHistory: true });
    this.setState({ vmDetails: vm_data });
    var params={clientid:vm_data.clientid,vmid:vm_data.id}
    this.props.dispatch(awsActions.vmLogs(params));
  }

  modalCloseVm() {
    this.setState({ modalVmHistory: false });
    this.getVMDetails();     
  }

  getVirtualNetworks(){
    const requestOptions = {
      method: 'GET',
      headers: authHeader()
    };

    fetch(`${config.apiUrl}/secureApi/aws/networks/`+this.state.clientid, requestOptions).then(response  => this.handleResponse(response, "virtualnetworks"));
  }

  handleResponse(response, stateName) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
            //
        }
        else{
          this.setState({
            [stateName]: (data.data ? data.data : data)
          })
          //return data;
        }        
        this.setState({
          loading: false
        })
    });
  }
  
  getVMDetails(){
    var formData={clientid:btoa(this.state.clientid),vm_id:this.props.match.params.id};
    this.props.dispatch(awsActions.vmDetail(formData));
  }
  
  componentDidMount() {
    this.getVMDetails();
    this.calAwsApis({clientid: this.state.clientid}, "get_aws_regions" , "region_list", "is_region_list_loaded" );
    this.fetchPriceForVolume();
    //this.props.dispatch(awsActions.vmDetail(this.props.match.params.id));
    //this.getVirtualNetworks();
  }

  fetchPriceForVolume(){
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt({"cloud_type" : "AWS", "addon_name" : "storage", "currency_id" : this.state.user.data.currency_id}))
    };

    fetch(`${config.apiUrl}/secureApi/orders/getAddonPrice`, requestOptions).then(response  => this.handlePriceResponse(response));
  }

  handlePriceResponse(response, stateName, isLoading) {
    return response.text().then(text => {
        
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if(data && data.data && data.data[0] && data.data[0].price){
          this.setState({
            priceFor1GBVolume: data.data[0].price
          });
        }

        this.setState({
          isCurrentPriceLoading: false
        })
    });
  }

  calAwsApis(frmData, apiName, stateName, isLoading){
    if(isLoading){
      this.setState({
        [isLoading]: true
      });
    }

    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/aws/` +apiName, requestOptions).then(
      response  => this.handleAwsResponse(
        response, stateName, isLoading)
      );
  }

  handleAwsResponse(response, stateName, isLoading) {
    return response.text().then(text => {

        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        if (!response.ok) {
            //
        }
        else{
          this.setState({
            [stateName]: (data.data ? data.data : (data.value ? data.value : data))
          })
        }

        if(isLoading){
          this.setState({
            [isLoading]: false
          });
        }
    });
  }

  vmAction(vmData,action, label) {
    var dispLable = "Yes, " + label + " it!";
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

  vmTerminateAction() {
    var dispLable = "Yes, Terminate it!";
    
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

  vmTerminateOperations = () => {
    $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);
    
    let formdata = { "clientid" : this.state.clientid,    
                      "vmId" : this.props.aws.vm_data.vm.id
                   }

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(formdata))
    };
    return fetch(`${config.apiUrl}/secureApi/aws/delete_vm`, requestOptions)
    .then(res => res.json())
    .then((text) => {
      const data = text && JSON.parse(ucpDecrypt((text)));
      if (data.success) {
        toast.success(data.message);
        
        setTimeout(() => {
          window.location = window.location.origin + "/#/aws"
        }, 2000);
      }
      else{
        toast.error(data.message);
      }
    })
    .catch(console.log)
  }

  vmOperations() {
    this.hideAlert();
    $(".sweet-alert").find(".btn-danger").prepend("<i className='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);
    let vmData = this.state.vmDetails;
    let action = this.state.action;
    const postParams = { "ref_id": btoa(vmData.ref_id), "action": action,vm_id:btoa(vmData.id),clientid:btoa(this.state.clientid) };
    this.props.dispatch(awsActions.vmOperations(postParams));
  }

  vmLogs(vmid) {
    this.props.dispatch(awsActions.vmLogs(vmid));
    this.openModal();
  }

  awsVirtualNetwrokRequest = e => {
      e.preventDefault();      
      var form = document.querySelector("#awsVirtualNetwrok");
      var formData = serialize(form, { hash: true });

      const re = /^[-\w\._\(\)]+$/;
      // if value is not blank, then test the regex
      if (formData.name != '' && !re.test(formData.name)) {
          toast.error("Invalid Network Name");
      }else{
          this.props.dispatch(awsActions.addAwsNetwork(formData,this.state.clientid));
          this.setState({ modalIsOpen: false });
      }
  };

  getDiskList(frmData) {
    
    /*const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/aws/getDiskList`, requestOptions).then(response  => this.handleResponse(response, "vmDiskList"));*/
  }
  
  awsAddNewDiskRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#awsAddNewDisk");
    var formData = serialize(form, { hash: true });

    formData.subscription = formData.subscription.replace(this.state.clientid + "_","");

    let newFormData = { "clientid" : formData.clientid,    
      "subscription_id" : formData.subscription,    
      "name" : formData.name,    
      "location" : formData.location.split(/_(.+)/)[1],    
      "diskSizeGB" : formData.diskSizeGB,    
      "resourceGroup" : formData.resource_group
      }

    this.addDiskList(newFormData);
  };

  addDiskList(frmData) {
    this.setState({
      addDiskRequestInProgress: true
    })
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/aws/addDisk`, requestOptions).then(response  => this.handleAddDiskResponse(response));
  }

  awsAttachDiskRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#awsAttachDisk");
    var formData = serialize(form, { hash: true });

    formData.subscription = formData.subscription.split(/_(.+)/)[1];

    let selectedDisk  = [];
    for(let i = 0 ; i  < this.state.attachDisk_DiskList.length; i++){
      if(this.state.attachDisk_DiskList[i].name == formData.attach_disk_list){
        selectedDisk = this.state.attachDisk_DiskList[i];
        break;
      }
    }

    let newFormData = { 
      "clientid" : this.state.clientid,    
    // "subscription_id" : formData.subscription,    
    // "vmName" : this.state.vm_data.vm.label_name,    
    // "diskId" : selectedDisk.id,
    // "storageAccountType" : selectedDisk.sku.name,    
    // "diskSizeGB" : selectedDisk.properties.diskSizeGB,    
    // "resourceGroup" : formData.resource_group
     };

    this.attachDiskList(newFormData);
  };

  detachDiskHandle(diskRowInfo){
    let formdata = {
      //  "clientid" : this.state.clientid,    
      //                 "subscription_id" : this.state.vm_data.vm.subscriptionId,    
      //                 "vmName" : this.state.vm_data.vm.label_name,
      //                 "diskName" : diskRowInfo.name
                   }

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formdata)
    };
    return fetch(`${config.apiUrl}/secureApi/aws/detachDisk`, requestOptions)
    .then(res => res.json())
    .then((data) => {
      if (data.status == "success") {
        toast.success(data.message);
        //this.getDiskList( { "clientid" : this.state.clientid, "subscription_id" : this.state.vm_data.vm.subscriptionId, "resourceGroup" : this.state.vm_data.vm.resourceGroup});
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
  
  awsDetachDiskAction(diskRowInfo) {
    var dispLable = "Detach Disk From Aws VM";
    
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

    fetch(`${config.apiUrl}/secureApi/aws/attachDisk`, requestOptions).then(response  => this.handleAddDiskResponse(response));
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
          //this.getDiskList( { "clientid" : this.state.clientid, "subscription_id" : this.state.vm_data.vm.subscriptionId, "resourceGroup" : this.state.vm_data.vm.resourceGroup});
        }        
    });
  }

  openModalAttachVolume = () => {
    this.setState({ modalIsAttachVolumeOpen: true });
    this.getAvailableVolumes();
  }

  getAvailableVolumes(){
    let frmData = { "clientid" : this.state.clientid, "regionName" : this.props.aws.vm_data.vm.regionName};

    this.setState({
      isAvailableVolumesLoading: true,
      availableVolumesList: ""
    });

    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/aws/availableVolumeList`, requestOptions).then(response  => this.handleDataListResponse(response));
  }

  handleDataListResponse(response) {
    return response.text().then(text => {
        let data = text && JSON.parse(text);
        
        if(data && data.error && data.error.message) {
          toast.error(data.error.message);
          
          this.setState({
            availableVolumesList: ""
          });
        }
        else if(data && data.data && data.data[0] && data.data[0].Error && data.data[0].Error[0] &&
          data.data[0].Error[0].Message && data.data[0].Error[0].Message[0]){
            toast.error(data.data[0].Error[0].Message[0]);

            this.setState({
              availableVolumesList: ""
            });
        }
        else{
          if(data && data.data && data.data.length == 0){
            toast.error("No disk is available, Please create new Disk!");
          }
          else{
            this.setState({
              availableVolumesList: data.data
            });
          }
        }

        this.setState({
          isAvailableVolumesLoading: false,
        }) 
    });
  }

  closeModalAttachVolume = () => {
    this.setState({ modalIsAttachVolumeOpen: false });
  }

  openModalAddVolume = () => {     
    this.setState({ modalIsAddVolumeOpen: true, diskSizeGB: "" });
  }

  closeAddVolumeModal = () => {
    this.setState({ modalIsAddVolumeOpen: false });        
  }

  addFormregionChange(target){
    let value = target.value;

    if(value){
      let frmData = { "clientid" : this.state.clientid, "regionName" : value};

      this.setState({
        is_availability_zone_loading: true,
        availability_zone_list: []
      });

      const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(ucpEncrypt(frmData))
      };

      fetch(`${config.apiUrl}/secureApi/aws/get_aws_availability_zones`, requestOptions).then(response  => this.handleRegionChangeListResponse(response));
    }
    else{
      this.setState({
        is_availability_zone_loading: false,
        availability_zone_list: []
      });
    }
  }

  handleRegionChangeListResponse(response) {
    return response.text().then(text => {
      let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

      if(data && data.data && data.data.length > 0){
        this.setState({
          availability_zone_list:data.data
        });
      }

      this.setState({
        is_availability_zone_loading: false
      });
    });
  }

  allowOnlyNumbers = (event, name) => {
    let value = event.target.value;

    let charCode = value.charCodeAt(value.length - 1);
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
    }

    this.setState({
      [name]: value
    });
  }

  attachVolume = e => {
    e.preventDefault();      
    var form = document.querySelector("#attachVolume");
    var frmData = serialize(form, { hash: true });
    
    if(!frmData.volumeId){
      toast.error("Please select Volume");
      return;
    }

    frmData.clientid = this.state.clientid;
    frmData.regionName = this.props.aws.vm_data.vm.regionName;
    frmData.instanceId = this.props.aws.vm_data.vm.instanceId;
    frmData.currency_id = this.state.user.data.currency_id;
    frmData.vmIdFromDB = this.props.aws.vm_data.vm.id;

    this.setState({
      is_attach_volume_inprogress: true
    });
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/aws/attachVolume`, requestOptions).then(response  => this.handleAttachVolumeResponse(response));
  }

  handleAttachVolumeResponse(response, stateName) {
    return response.text().then(data => {
      data = (data && JSON.parse(data) ? JSON.parse(data) : "");

      this.setState({
        is_attach_volume_inprogress: false
      });

      if(!data.success){
        toast.error(data.message);
      }
      else {
        toast.success("Volume Attached Successfully!");

        setTimeout(() => {
          location.reload(true);
        }, 2000);
      }   
    });
  }

  addVolume = e => {
    e.preventDefault();      
    var form = document.querySelector("#addVolume");
    var frmData = serialize(form, { hash: true });
    
    if(!frmData.regionName){
      toast.error("Please select region");
      return;
    }

    if(!frmData.availabilityZone){
      toast.error("Please enter Availability Zone");
      return;
    }

    if(!frmData.volumeType){
      toast.error("Please enter Volume Type");
      return;
    }
    
    if(!frmData.size){
      toast.error("Please enter Size");
      return;
    }
    
    if(!frmData.iops){
      toast.error("Please enter IOPS");
      return;
    }
   
    this.setState({
      is_add_volume_inprogress: true
    });

    frmData.currency_id = this.state.user.data.currency_id;
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/aws/createVolume`, requestOptions).then(response  => this.handleaddVolumeResponse(response));
  }

  handleaddVolumeResponse(response, stateName) {
    return response.text().then(data => {

      data = (data && JSON.parse(data) ? JSON.parse(data) : "");

      this.setState({
        is_add_volume_inprogress: false
      });

      if(!data.success){
        if(data && data.data && data.data && data.data[0] && data.data[0].Error && data.data[0].Error[0] && data.data[0].Error[0].Message && data.data[0].Error[0].Message[0]){
          toast.error(data.data[0].Error[0].Message[0]);  
        }
        else{
          toast.error("Unable to Add Volume"); 
        }
      }
      else {
        toast.success("Volume Added Successfully!");

        this.closeAddVolumeModal();
      }   
    });
  }
  
  awsDetachVolumeAction(diskRowInfo) {
    var dispLable = "Detach Volume From VM";
    
    const getAlert = () => (
      <SweetAlert
        warning
        showCancel
        confirmBtnText={dispLable}
        confirmBtnBsStyle="danger"
        cancelBtnBsStyle="default"
        title="Are you sure?"
        onConfirm={() => this.detachVolumeHandle(diskRowInfo)}
        onCancel={this.hideAlert.bind(this)}
      >
      </SweetAlert>
    );
    this.setState({
      sweetalert: getAlert()
    });
  }

  detachVolumeHandle(diskRowInfo){
    $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);
    
    let formdata = { "clientid" : this.state.clientid,
                      "regionName" : this.props.aws.vm_data.vm.regionName,
                      "volumeId" : diskRowInfo.volumeId[0]
                   }

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formdata)
    };
    return fetch(`${config.apiUrl}/secureApi/aws/detachVolume`, requestOptions)
    .then(res => res.json())
    .then((data) => {
      if (data.success == 0) {
        toast.error(data.message);
        this.hideAlert();
      }
      else{
        toast.success(data.message);
        
        setTimeout(() => {
          location.reload(true);
        }, 2000);
      }
    })
    .catch(console.log)
  }
  
  render() { 
    const { aws, profiles } = this.props;
    let loading=this.props.aws.loading;                                      
    let vm_data=this.props.aws.vm_data;  
    let vmDiskList = ((vm_data && vm_data.vmdetails && vm_data.vm.dataFromAws && vm_data.vm.dataFromAws.properties && vm_data.vm.dataFromAws.properties.storageProfile && vm_data.vm.dataFromAws.properties.storageProfile.dataDisks) ? vm_data.vm.dataFromAws.properties.storageProfile.dataDisks : []);
    let logData=this.props.aws.logData;         
    //let subscription_list = this.props.aws.subscription_list; 
    //let subscription_locations = this.props.aws.subscription_locations;   
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color"><img src="/src/img/aws_img.png" width="50px" className="mr-2" />VM Details</h5>
          {loading && <PageLoader/>}
          {!loading && vm_data &&  <div className="row vm-details">          
            <div className="col-md-12 p-0 vm-details-row mt-3">
              <div className="col-md-12">
                {commonFns.fnCheckVMOperationsAuth(profiles, commonFns.vmOperations.AwsOperations.ONOFF) &&
                  <React.Fragment>
                      {(vm_data.vm.vm_status.toLowerCase() == "poweredon" || vm_data.vm.vm_status.toLowerCase() == "running") ?
                        <span className="alert info-box-danger mr-2 cursor-pointer" onClick={() => this.vmAction(vm_data.vm,'stop','Power Off')}><span className="fas fa-power-off mr-2"></span>Power Off</span>
                        : <span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.vmAction(vm_data.vm,'start','Power On')}><span className="fa fa-play mr-2"></span>Power On</span>}
                  </React.Fragment>
                }

                {commonFns.fnCheckVMOperationsAuth(profiles, commonFns.vmOperations.AwsOperations.Reboot) &&
                  <span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.vmAction(vm_data.vm,'restart','Reboot')}><span className="fa fa-sync-alt mr-2"></span>Reboot</span>
                }

                {commonFns.fnCheckVMOperationsAuth(profiles, commonFns.vmOperations.AwsOperations.Terminate) &&
                  <span className="alert info-box-danger mr-2 cursor-pointer" onClick={() => this.vmTerminateAction()}><span className="fa fa-times mr-2"></span>Terminate</span>
                }

                {commonFns.fnCheckVMOperationsAuth(profiles, commonFns.vmOperations.AwsOperations.Resize) &&
                  <React.Fragment>
                    {<span className="alert info-box-blue mr-2 cursor-pointer" onClick={() => this.vmResizeForm(vm_data.vm)}><span className="fa fa-expand mr-2"></span>Resize</span>}
                  </React.Fragment>
                }

                {commonFns.fnCheckVMOperationsAuth(profiles, commonFns.vmOperations.AwsOperations.History) &&
                  <span className="alert info-box-blue mr-2 cursor-pointer" onClick={() => this.openVmHistory(vm_data.vm)}><span className="fa fa-history mr-2"></span>History</span>
                }
              </div>
            </div>
            <div className="col-md-12 p-0 vm-details-row mt-4">
              <div className="col-md-6 float-left">
                <div className="col-md-3 float-left p-0"><h6>VM Name : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.label_name}</div>
              </div>
              <div className="col-md-6 float-right">
                <div className="col-md-3 float-left p-0"><h6>VM Status : </h6></div>
                <div className="col-md-9 float-right p-0 text-capitalize">{vm_data.vm.vm_status}</div>
              </div>
            </div>
            <div className="col-md-12 p-0 vm-details-row">
              <div className="col-md-6 float-left">
                <div className="col-md-3 float-left p-0"><h6>VM Location : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.location}</div>
              </div>
              <div className="col-md-6 float-right">
                <div className="col-md-3 float-left p-0"><h6>Cloud type : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.copy_type}</div>
              </div>
            </div>
            <div className="col-md-12 p-0 vm-details-row">
              <div className="col-md-6 float-left">
                <div className="col-md-3 float-left p-0"><h6>CPU Core : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.cpu_units}</div>
              </div>
              <div className="col-md-6 float-right">
                <div className="col-md-3 float-left p-0"><h6>Memory(GB) : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.ram_units_gb}</div>
              </div>
            </div>
            <div className="col-md-12 p-0 vm-details-row mb-4 clear-both pb-4">
              <div className="col-md-6 float-left">
                <div className="col-md-3 float-left p-0"><h6>Disk Size(GB) : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.disk_units_gb}</div>
              </div>
              <div className="col-md-6 float-right">
                <div className="col-md-3 float-left p-0"><h6>OS Template : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.os_template_name}</div>
              </div>
            </div>

            <fieldset className="fieldset-wrapper">
                <legend className="fieldset-legend color">Network Interface</legend>
                <div class="control-group">
                  <div className="col-md-12 p-0 vm-details-row">
                    <div className="col-md-6 float-left">
                      <div className="col-md-4 float-left p-0"><h6>IP Address : </h6></div>
                      <div className="col-md-8 float-right p-0">{vm_data.vm.primary_ip}</div>
                    </div>
                    <div className="col-md-6 float-right">
                      <div className="col-md-4 float-left p-0"><h6>Other Ips : </h6></div>
                      <div className="col-md-8 float-right p-0 wordwrap">{vm_data.vm.multiple_ip}</div>
                    </div>
                  </div>
                  <div className="col-md-12 p-0 vm-details-row">
                    <div className="col-md-6 float-left">
                      <div className="col-md-4 float-left p-0"><h6>Private DNS Name : </h6></div>
                      <div className="col-md-8 float-right p-0">{vm_data.vm_detail.privateDnsName && vm_data.vm_detail.privateDnsName[0]}</div>
                    </div>
                    <div className="col-md-6 float-right">
                      <div className="col-md-4 float-left p-0"><h6>Private Ip Address : </h6></div>
                      <div className="col-md-8 float-right p-0 wordwrap">{vm_data.vm_detail.privateIpAddress && vm_data.vm_detail.privateIpAddress[0]}</div>
                    </div>
                  </div>
                  <div className="col-md-12 p-0 vm-details-row">
                    <div className="col-md-6 float-left">
                      <div className="col-md-4 float-left p-0"><h6>MAC Address : </h6></div>
                      <div className="col-md-8 float-right p-0">{
                      (vm_data && vm_data.vm_detail && vm_data.vm_detail.networkInterfaceSet && vm_data.vm_detail.networkInterfaceSet[0] && vm_data.vm_detail.networkInterfaceSet[0].item && vm_data.vm_detail.networkInterfaceSet[0].item && vm_data.vm_detail.networkInterfaceSet[0].item[0] && vm_data.vm_detail.networkInterfaceSet[0].item[0].macAddress && vm_data.vm_detail.networkInterfaceSet[0].item[0].macAddress[0]
                      ?
                      vm_data.vm_detail.networkInterfaceSet[0].item[0].macAddress[0] : "")}</div>
                    </div>
                  </div>
                </div>
            </fieldset>

            <fieldset className="fieldset-wrapper">
                <legend className="fieldset-legend color">VPC Info</legend>
                <div class="control-group">
                  <div className="col-md-12 p-0 vm-details-row">
                    <div className="col-md-6 float-left">
                      <div className="col-md-4 float-left p-0"><h6>VPC ID : </h6></div>
                      <div className="col-md-8 float-right p-0">{vm_data.vpc_detail && vm_data.vpc_detail.vpcId && vm_data.vpc_detail.vpcId[0]}</div>
                    </div>
                    <div className="col-md-6 float-right">
                      <div className="col-md-4 float-left p-0"><h6>State : </h6></div>
                      <div className="col-md-8 float-right p-0 wordwrap">{vm_data.vpc_detail && vm_data.vpc_detail.state && vm_data.vpc_detail.state[0]}</div>
                    </div>
                  </div>
                </div>
            </fieldset>
            
            <fieldset className="fieldset-wrapper">
                <legend className="fieldset-legend color">Subnet Info</legend>
                <div class="control-group">
                  <div className="col-md-12 p-0 vm-details-row">
                    <div className="col-md-6 float-left">
                      <div className="col-md-4 float-left p-0"><h6>Subnet : </h6></div>
                      <div className="col-md-8 float-right p-0">{vm_data.subnet_detail && vm_data.subnet_detail.subnetId && vm_data.subnet_detail.subnetId[0]}</div>
                    </div>
                    <div className="col-md-6 float-right">
                      <div className="col-md-4 float-left p-0"><h6>State : </h6></div>
                      <div className="col-md-8 float-right p-0 wordwrap">{vm_data.subnet_detail && vm_data.subnet_detail.state && vm_data.subnet_detail.state[0]}</div>
                    </div>
                  </div>
                </div>
            </fieldset>

            <fieldset className="fieldset-wrapper">
                <legend className="fieldset-legend color">Volume Info</legend>
                <div class="control-group">
                  <div className="clear-both"></div>
                  <div className="col-md-12 p-0 vm-details-row">
                    <div class="col-md-12 p-0 pl-2">
                      <div class="float-right">
                        <button className="btn btn-sm btn-primary mr-2" onClick={this.openModalAttachVolume}><i className="fa fa-plus"></i> Attach Volume</button>
                        <button className="btn btn-sm btn-primary" onClick={this.openModalAddVolume}><i className="fa fa-plus"></i> Add Volume</button>
                        <Modal
                          isOpen={this.state.modalIsAttachVolumeOpen}
                          onRequestClose={this.closeModalAttachVolume}
                          >
                            <h2 style={{color:'red'}}>
                                Attach Volume to VM<a className="float-right" href="javascript:void(0);" onClick={this.closeModalAttachVolume}><i className="fa fa-times" /></a>
                            </h2>

                            <div className="col-md-12">
                                <div className="panel panel-default" />
                                <form
                                name="attachVolume"
                                id="attachVolume"
                                method="post"
                                onSubmit={this.attachVolume}
                                >
                                <div className="form-group position-relative">
                                    <label htmlFor="subscription">Attach Volume<span className="star-mark">*</span></label>
                                    <select
                                    className="form-control"
                                    name="volumeId"
                                    required
                                    >
                                    <option selected="true" value="">-Select-</option>
                                    {this.state.availableVolumesList && this.state.availableVolumesList.length > 0 && this.state.availableVolumesList.map((row, index) =>
                                        (row.volumeId && row.volumeId[0] &&
                                          <option  value={row.volumeId[0]}>
                                              {row.volumeId[0]}
                                          </option>
                                        )
                                    )}
                                    </select>
                                    { this.state.isAvailableVolumesLoading && 
                                      <i className="fas fa-circle-notch icon-loading form-drp-loader-icon"></i>
                                    }
                                </div> 
                                <div className="form-group">
                                    <input type="hidden" name="clientid" value={this.state.clientid} />
                                    <button 
                                    className={"btn btn-sm btn-primary " + (this.state.is_attach_volume_inprogress ? "no-access" : "")} disabled={this.state.is_attach_volume_inprogress ? true : false}
                                    >
                                      {this.state.is_attach_volume_inprogress &&
                                        <i className="fas fa-circle-notch icon-loading"></i>}
                                      Submit</button>
                                </div>
                                </form>
                            </div>
                        </Modal>
                        <Modal
                          isOpen={this.state.modalIsAddVolumeOpen}
                          onRequestClose={this.closeAddVolumeModal}
                          >
                              <h2 style={{color:'red'}}>
                                  Add Volume<a className="float-right" href="javascript:void(0);" onClick={this.closeAddVolumeModal}><i className="fa fa-times" /></a>
                              </h2>

                              <div className="col-md-12">
                                  <div className="panel panel-default" />
                                  <form
                                  name="addVolume"
                                  id="addVolume"
                                  method="post"
                                  onSubmit={this.addVolume}
                                  >
                                  <div className="form-group position-relative">
                                      <label htmlFor="subscription">Region<span className="star-mark">*</span></label>
                                      <select
                                      className="form-control"
                                      name="regionName"
                                      required
                                      onChange={e => this.addFormregionChange(e.target)}
                                      >
                                      <option selected="true" value="">-Select-</option>
                                      {this.state.region_list && this.state.region_list.length > 0 && this.state.region_list.map((row, index) =>
                                          <option  value={row.regionid}>
                                              {row.regionname}
                                          </option>
                                      )}
                                      </select>
                                      { this.state.is_region_list_loaded && 
                                        <i className="fas fa-circle-notch icon-loading form-drp-loader-icon"></i>
                                      }
                                  </div>
                                  <div className="form-group position-relative">
                                      <label htmlFor="subscription">Availability Zone<span className="star-mark">*</span></label>
                                      <select
                                      className="form-control"
                                      name="availabilityZone"
                                      required
                                      >
                                      <option selected="true" value="">-Select-</option>
                                      {this.state.availability_zone_list && this.state.availability_zone_list.length > 0 && this.state.availability_zone_list.map((row, index) =>
                                          <option  value={row.zoneName}>
                                              {row.zoneName}
                                          </option>
                                      )}
                                      </select>
                                      { this.state.is_availability_zone_loading && 
                                        <i className="fas fa-circle-notch icon-loading form-drp-loader-icon"></i>
                                      }
                                  </div>
                                  <div className="form-group position-relative">
                                      <label htmlFor="subscription">Volume Type<span className="star-mark">*</span></label>
                                      <select
                                      className="form-control"
                                      name="volumeType"
                                      required
                                      >
                                        <option value="">-Select-</option>
                                        <option value="standard">Standard</option>
                                        <option value="io1">io1</option>
                                        <option value="gp2">gp2</option>
                                        <option value="sc1">sc1</option>
                                        <option value="st1">st1</option>
                                      </select>
                                  </div>
                                  <div className="form-group position-relative">
                                      <label htmlFor="name">Size (GB)<span className="star-mark">*</span></label>
                                      <input
                                      type="text"
                                      className="form-control"
                                      name="size"
                                      required      
                                      onChange={(e) => this.allowOnlyNumbers(e, "diskSizeGB")}
                                      value={this.state.diskSizeGB}                  
                                      placeholder="Ex: 30"
                                      />

                                      <span className="txt-right-placeholder">1 GB = 
                                          {!this.state.isCurrentPriceLoading &&
                                            <span className="currency-symbol font-weight-bold color pl-1">{commonFns.fnFormatCurrency(this.state.priceFor1GBVolume)}</span>
                                          }
                                          {this.state.isCurrentPriceLoading &&
                                            <React.Fragment>
                                              <span className="currency-symbol font-weight-bold color pl-1">{commonFns.fnFormatCurrency(this.state.priceFor1GBVolume, 0, true)}</span>
                                              <i className="fas fa-circle-notch icon-loading form-drp-loader-icon price-loading-on-form"></i>
                                            </React.Fragment>
                                          }
                                      </span>
                                  </div>
                                  <div className="form-group">
                                      <label htmlFor="name">IOPS<span className="star-mark">*</span></label>
                                      <input
                                      type="text"
                                      className="form-control"
                                      name="iops"
                                      required      
                                      onChange={(e) => this.allowOnlyNumbers(e, "IOPS")}
                                      value={this.state.IOPS}                  
                                      placeholder="Ex: 100"
                                      />
                                  </div>        
                                  <div className="form-group">
                                      <input type="hidden" name="clientid" value={this.state.clientid} />
                                      <button 
                                      className={"btn btn-sm btn-primary " + (this.state.is_add_volume_inprogress ? "no-access" : "")} disabled={this.state.is_add_volume_inprogress ? true : false}
                                      >
                                        {this.state.is_add_volume_inprogress &&
                                          <i className="fas fa-circle-notch icon-loading"></i>}
                                        Submit</button>

                                        <label className="total-price-right">
                                          Price:
                                          <span className="currency-symbol color ml-2 font-weight-bold">
                                            {commonFns.fnFormatCurrency(this.state.priceFor1GBVolume * (this.state.diskSizeGB ? this.state.diskSizeGB : 0))}
                                          </span>
                                        </label>
                                  </div>
                                  </form>
                              </div>
                          </Modal>
                      </div>
                    </div>
                    <div className="clear-both"></div>
                    <div class="col-md-12 p-0 pl-2">
                      <div className="dataTables_wrapper dt-bootstrap4 mt-2">
                          <table class="table table-hover table-striped dataTable">
                              <thead>
                                  <tr>
                                      <th>Volume Id</th>
                                      <th>Volume Type</th>
                                      <th>Size</th>
                                      <th>IOPS</th>
                                      <th>Status</th>
                                      <th></th>
                                  </tr>
                              </thead>
                              <tbody>
                                {(vm_data.disk_detail && vm_data.disk_detail.length > 0) ?
                                (vm_data.disk_detail.map((row, index) =>
                                    <tr>
                                        <td>
                                            {row.volumeId && row.volumeId[0]}
                                        </td>
                                        <td>
                                            {row.volumeType && row.volumeType[0]}
                                        </td>
                                        <td>
                                            {(row.size && row.size[0] ? row.size[0] : 0)} GB
                                        </td>
                                        <td>
                                            {row.iops && row.iops[0]}
                                        </td>
                                        <td>
                                            {row.status && row.status[0]}
                                        </td>
                                        <td className="text-center">
                                          <button class="btn btn-sm btn-danger" onClick={() => this.awsDetachVolumeAction(row)}><i class="fas fa-minus-circle"></i> Detach Volume</button>
                                        </td>
                                    </tr>
                                )
                                ) : <tr><td colspan="5" className="text-center p-5"><span className="star-mark">No Volume is Attached</span></td></tr>}
                              </tbody>
                          </table>
                      </div>
                    </div>
                  </div>
                </div>
            </fieldset>

            {vm_data.jobdata && false && <div>
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
          {!loading && false && <div className="row mt-3 mb-4">
            <div className="col-md-6">
              <h5 className="color sub-heading">VM Disks</h5>
            </div>
            <div className="col-md-6">
              <div className="text-right">
                <button className="btn btn-sm btn-primary mr-2" onClick={this.openModalAttachDisk}><i className="fa fa-plus"></i> Attach Disk</button>
                <button className="btn btn-sm btn-primary" onClick={this.openModalAddNewDisk}><i className="fa fa-plus"></i> Add New Disk</button>
                <Modal
                    isOpen={this.state.attachDiskModalIsOpen}
                    onRequestClose={this.closeModalAttachDisk}              
                    contentLabel="Add Resource Group"
                    >
                    <h2 style={{color:'red'}}>
                        Attach Disk To Aws VM<a className="float-right" href="javascript:void(0);" onClick={this.closeModalAttachDisk}><i className="fa fa-times" /></a>
                    </h2>

                    <div className="col-md-12">
                        <div className="panel panel-default" />
                        <form
                        name="awsAttachDisk"
                        id="awsAttachDisk"
                        method="post"
                        onSubmit={this.awsAttachDiskRequest}
                        >
                        <div className="form-group">
                            <label htmlFor="subscription">Subscription Id</label>
                            <select
                            className="form-control"
                            required
                            name="subscription"        
                            onChange={e => this.handleAwsSubscriptions(e.target.value)}      
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
                            onChange={e => this.handleAwsResourceGroups(e.target.value)}                     
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
                            <label htmlFor="resource_group">Resource Group</label>
                            <select
                            className="form-control"
                            required
                            name="resource_group"
                            onChange={e => this.handleAwsDiskList(e.target.value)}          
                            >
                                <option value="">-Select-</option>
                                {this.state.resourceGroups && this.state.resourceGroups.map((l, index) =>
                                    <option value={l.name} key={l.id}>
                                        {l.name}
                                    </option>
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="name">Disk List</label>
                            <select
                            className="form-control"
                            required
                            name="attach_disk_list"                     
                            >
                                <option value="">-Select-</option>
                                {this.state.attachDisk_DiskList && this.state.attachDisk_DiskList.map((l, index) =>
                                    <option value={l.name} key={l.name}>
                                        {l.name}
                                    </option>
                                )}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <input type="hidden" name="clientid" value={this.state.clientid} />
                            <button className="btn btn-sm btn-primary">
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
                        Add New Disk To Aws <a className="float-right" href="javascript:void(0);" onClick={this.closeModalAddNewDisk}><i className="fa fa-times" /></a>
                    </h2>

                    <div className="col-md-12">
                        <div className="panel panel-default" />
                        <form
                        name="awsAddNewDisk"
                        id="awsAddNewDisk"
                        method="post"
                        onSubmit={this.awsAddNewDiskRequest}
                        >
                        <div className="form-group">
                            <label htmlFor="subscription">Subscription Id</label>
                            <select
                            className="form-control"
                            required
                            name="subscription"        
                            onChange={e => this.handleAwsSubscriptions(e.target.value)}      
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
                            onChange={e => this.handleAwsResourceGroups(e.target.value)}                     
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
                            <label htmlFor="resource_group">Resource Group</label>
                            <select
                            className="form-control"
                            required
                            name="resource_group"                     
                            >
                                <option value="">-Select-</option>
                                {this.state.resourceGroups && this.state.resourceGroups.map((l, index) =>
                                    <option value={l.name} key={l.id}>
                                        {l.name}
                                    </option>
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="name">Disk Size (GB)</label>
                            <input
                            type="text"
                            className="form-control"
                            name="diskSizeGB"
                            required                      
                            placeholder="100"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="ip_address_prefix">Disk Name</label>
                            <input
                            type="text"
                            className="form-control"
                            name="name"
                            required   
                            placeholder="Ex: Hard_Disk_1"
                            />
                        </div>
                        
                        <div className="form-group">
                            <input type="hidden" name="clientid" value={this.state.clientid} />
                            <button className="btn btn-sm btn-primary">
                            {this.state.addDiskRequestInProgress && 
                                <i className="fas fa-circle-notch icon-loading"></i>
                            }
                            Submit</button>
                        </div>
                        </form>
                    </div>
                </Modal>
              </div>
            </div>
            {vmDiskList && vmDiskList.length > 0 &&
            <div className="col-md-12">
              <div className="dataTables_wrapper dt-bootstrap4 mt-2">
                  <table className="table table-hover table-striped dataTable">
                      <thead>
                          <tr>
                              <th>Disk Name</th>
                              <th>Disk Size (GB)</th>
                              <th>Storage Account Type</th>
                              <th>Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                        {vmDiskList && vmDiskList.length > 0 && vmDiskList.map((row, index) =>
                            <tr>
                                <td>
                                    {row.name}
                                </td>
                                <td>
                                    {row.diskSizeGB}
                                </td>
                                <td>
                                    {row.managedDisk.storageAccountType}
                                </td>
                                <td className="text-center">
                                  <button className="btn btn-sm btn-danger" onClick={() => this.awsDetachDiskAction(row)}><i className="fas fa-minus-circle"></i> Detach Disk</button>
                                </td>
                            </tr>
                        )}
                      </tbody>
                  </table>
              </div>
            </div>}
          </div>}
          
          <div className="clear-both"></div>
          {!loading && false &&
          <div className="row clear-both mt-4 mb-4">
            <div className="col-md-6">
              <h5 className="color sub-heading">Virtual Networks</h5>
            </div>
            <div className="col-md-6">
              <div className="text-right">
                <button className="btn btn-sm btn-primary hide" onClick={this.openModalAddNetworks}><i className="fa fa-plus"></i> Attach Network</button>
                <Modal
                    isOpen={this.state.addNetworkModalIsOpen}
                    onRequestClose={this.closeModalAddNetworks}              
                    contentLabel="Add Resource Group"
                    >
                    <h2 style={{color:'red'}}>
                        Add Virtual Network <a className="float-right" href="javascript:void(0);" onClick={this.closeModalAddNetworks}><i className="fa fa-times" /></a>
                    </h2>

                    <div className="col-md-12">
                        <div className="panel panel-default" />
                        <form
                        name="awsVirtualNetwrok"
                        id="awsVirtualNetwrok"
                        method="post"
                        onSubmit={this.awsVirtualNetwrokRequest}
                        >
                        <div className="form-group">
                            <label htmlFor="subscription">Subscription Id</label>
                            <select
                            className="form-control"
                            required
                            name="subscription"        
                            onChange={e => this.handleAwsSubscriptions(e.target.value)}      
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
                            onChange={e => this.handleAwsResourceGroups(e.target.value)}                     
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
                            <label htmlFor="resource_group">Resource Group</label>
                            <select
                            className="form-control"
                            required
                            name="resource_group"                     
                            >
                                <option value="">-Select-</option>
                                {this.state.resourceGroups && this.state.resourceGroups.map((l, index) =>
                                    <option value={l.name} key={l.id}>
                                        {l.name}
                                    </option>
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="name">Virtual Network Name</label>
                            <input
                            type="text"
                            className="form-control"
                            name="name"
                            required                      
                            placeholder="Virtual Network Name"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="ip_address_prefix">IP Address Prefix</label>
                            <input
                            type="text"
                            className="form-control"
                            name="ip_address_prefix"
                            required   
                            placeholder="e.g 10.0.0.1/16"                   
                            />
                        </div>
                        
                        <div className="form-group">
                            <input type="hidden" name="userid" value={this.state.user_id} />
                            <button className="btn btn-sm btn-primary">Submit</button>
                        </div>
                        </form>
                    </div>
                </Modal>
              </div>
            </div>
            {this.state.virtualnetworks && this.state.virtualnetworks.length > 0 && 
            <div className="col-md-12">
              <div className="dataTables_wrapper dt-bootstrap4 mt-2">
                  <table className="table table-hover table-striped dataTable">
                      <thead>
                          <tr>
                              <th>Network Name</th>
                              <th>Description</th>
                              <th>Location Name</th>
                              <th>Resource Group</th>
                          </tr>
                      </thead>
                      <tbody>
                      {this.state.virtualnetworks && this.state.virtualnetworks.length > 0 && this.state.virtualnetworks.map((row, index) =>
                          <tr>
                              <td>
                                  {row.name}
                              </td>
                              <td>
                                  {row.idurl}
                              </td>
                              <td>
                                  {row.location}
                              </td>
                              <td>
                                  {row.resource_group}
                              </td>
                          </tr>
                      )}
                      </tbody>
                  </table>
              </div>
            </div>}
          </div>
          }
          {this.state.sweetalert}
      </div>
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
                      <td>{this.state.vmDetails.label_name}</td>
                      <td>{data.description}</td>
                      <td><Moment format="YYYY-MM-DD hh:mm A">{data.createddate*1000}</Moment></td>
                    </tr>
                  )}
              </tbody>
            </table>
          }
          </div>
        </Modal>
    </div> 
    );
  }
}

function mapStateToProps(state) {
  const { aws,vm_data,logData, profiles } = state;
  return {
    aws,
    vm_data,
    logData,
    profiles
  };
}

const connectedVmlist = connect(mapStateToProps)(AwsVmDetail);
export { connectedVmlist as AwsVmDetail };