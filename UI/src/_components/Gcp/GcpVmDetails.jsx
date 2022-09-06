import React from 'react';
import { connect } from 'react-redux';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import Moment from 'react-moment';
import PageLoader from '../PageLoader';
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';
import { commonFns } from "../../_helpers/common";
import { MDBDataTable } from 'mdbreact';

Modal.setAppElement("#app");
class GcpVmDetails extends React.Component {
  constructor(props) {
    super(props);
    
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      user: user,
      clientid: user.data.clientid,
      user_role: user.data.user_role,
      vm_data:"",
      logData: [],
      jobdata:[],
      sweetalert: true,
      modalIsOpen: false,
      modalVmHistory: false,
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
      isItFirstLoad: false,
      isDataDetailsLoading: true,
      AddDiskDiskName: "",
      isCurrentPriceLoading: true,
      priceFor1GBDisk: 0
    };
    
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);

    this.openVmHistory = this.openVmHistory.bind(this);
    this.modalCloseVm = this.modalCloseVm.bind(this);    
  }
  
  openModal() {      
    this.setState({ modalIsOpen: true });
  }
  closeModal() {
    this.setState({ modalIsOpen: false });
    window.location.reload();         
  }
  
  fetchPriceForVolume(){
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt({"cloud_type" : "GCP", "addon_name" : "storage", "currency_id" : this.state.user.data.currency_id}))
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
  
  openModalAttachVolume = () => {
    this.setState({ modalIsAttachVolumeOpen: true, attach_disk_name: "" });
    this.getAvailableVolumes();
  }

  getAvailableVolumes(){
    let frmData = { "clientid" : this.state.clientid, "projectId" : this.state.vm_data.vm.projectId,
    "zone": this.state.vm_data.vm.zone};

    this.setState({
      isAvailableVolumesLoading: true,
      availableVolumesList: ""
    });

    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/gcp/available_disk`, requestOptions).then(response  => this.handleVolumeListResponse(response));
  }

  handleVolumeListResponse(response) {
    return response.text().then(text => {
        let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        this.setState({
          availableVolumesList: ""
        });

        if(!data || !data.success) {
          //toast.error(data.message);
        }
        else{
          if(data && data.data){
            let rows = [];

            let disks = data.data;
        
            for(let num = 0; num < disks.length; num++){
                let row = disks[num];
                
                rows.push({
                    action: <div class="text-center"><input id={"radioImage" + num} onChange={e => this.attach_disk_Change(
                        "radioImage" + num,
                        row.name)}
                    style={{ height: '20px', width: '20px'}} type="radio" name="radio_image" value={row.name} /></div>,
                    name: row.name,
                    sizeGb: row.sizeGb + " GB",
                });
            }

            let disk_grid_list = {
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
                  label: 'Disk',
                  field: 'sizeGb'
              }
            ],
            rows: rows
          }

            this.setState({
              availableVolumesList: disk_grid_list
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
    this.setState({ modalIsAddVolumeOpen: true, AddDiskDiskName: "", diskSizeGB: "" });
  }

  closeAddVolumeModal = () => {
    this.setState({ modalIsAddVolumeOpen: false });        
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

  attach_disk_Change = (id, name) => {
    setTimeout(() => {
        $("#"+id).prop("checked", true);
    }, 0);
    
    this.setState({
        attach_disk_name: name
    });
  }

  attachVolume = e => {
    e.preventDefault();

    if(!this.state.attach_disk_name){
      toast.error("Please select Disk to Attach");
      return;
    }

    let frmData = {};

    frmData.clientid = this.state.clientid;
    frmData.projectId = this.state.vm_data.vm.projectId;
    frmData.zone = this.state.vm_data.vm.zone;
    frmData.instanceName = this.state.vm_data.vm.host_name;
    frmData.deviceName = this.state.attach_disk_name;
    frmData.currency_id = this.state.user.data.currency_id;
    
    this.setState({
      is_attach_volume_inprogress: true
    });
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/gcp/attach_disk`, requestOptions).then(response  => this.handleAttachVolumeResponse(response));
  }

  handleAttachVolumeResponse(response, stateName) {
    return response.text().then(data => {
      data = (data && JSON.parse(ucpDecrypt(JSON.parse(data))) ? JSON.parse(ucpDecrypt(JSON.parse(data))) : "");

      this.setState({
        is_attach_volume_inprogress: false
      });

      if(!data.success){
        toast.error((data.message ? data.message : "Unable to attach selected Disk to VM!"));
      }
      else {
        toast.success("Disk Attached Successfully!");

        this.closeModalAttachVolume();

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
    
    if(!frmData.diskName){
      toast.error("Please enter Disk Name");
      return;
    }
    
    if(frmData.diskName.length < 4){
      toast.error("Disk Name should be at least 4 characters");
      return;
   }
    
    if(!frmData.sizeGb){
      toast.error("Please enter Size");
      return;
    }
   
    this.setState({
      is_add_volume_inprogress: true
    });

    frmData.currency_id = this.state.user.data.currency_id;
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/gcp/create_disk`, requestOptions).then(response  => this.handleaddVolumeResponse(response));
  }

  handleaddVolumeResponse(response, stateName) {
    return response.text().then(data => {

      data = (data && JSON.parse(ucpDecrypt(JSON.parse(data))) ? JSON.parse(ucpDecrypt(JSON.parse(data))) : "");

      this.setState({
        is_add_volume_inprogress: false
      });

      if(!data.success){
        toast.error(data.message ? data.message : "Unable to Add Disk");
      }
      else {
        toast.success("Disk has been added Successfully!");

        this.closeAddVolumeModal();
      }   
    });
  }
  
  DetachDiskAction(diskRowInfo) {
    var dispLable = "Detach Disk From VM";
    
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

  detachDiskHandle(diskRowInfo){
    $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);
    
    let formdata = { "clientid" : this.state.clientid,
                      "projectId" : this.state.vm_data.vm.projectId,
                      "zone" : this.state.vm_data.vm.zone,
                      "instanceName" : this.state.vm_data.vm.host_name,
                      "deviceName" : diskRowInfo.deviceName
                   }

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formdata)
    };
    return fetch(`${config.apiUrl}/secureApi/gcp/detach_disk`, requestOptions)
    .then(res => res.json())
    .then((data) => {
      if (!data.success) {
        toast.error(data.message ? data.message : "Unable to Detach Disk!");
        this.hideAlert();
      }
      else{
        toast.success("Disk has been detached successfully!");
        
        setTimeout(() => {
          location.reload(true);
        }, 2000);
      }
    })
    .catch(console.log)
  }

  componentDidMount() {
    this.getVMDetails();
    this.fetchPriceForVolume();
  }

  getVMDetails(){
    this.loadDataList({clientid: btoa(this.state.clientid), vm_id:this.props.match.params.id} );
  }
  
  loadDataList(frmData){
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/gcp/vm_detail`, requestOptions).then(response  => this.handleDataListResponse(response));
  }
  
  handleDataListResponse(response) {
    return response.text().then(text => {
        let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

        if(data.success == 1){
          this.setState({
            vm_data: data
          })
        }
        else{
          toast.error("Unable to fetch VM Details, Please try again !");
        }

        this.setState({
          isDataDetailsLoading: false
        })
    })
  }

  calGcpOperationsApis(frmData, apiName){
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };
    
    fetch(`${config.apiUrl}/secureApi/gcp/` + apiName, requestOptions).then(response  => this.handleGcpOperationsApiResponse(response));
  }

  handleGcpOperationsApiResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if (!response.ok) {
          toast.error(data.message);
        }
        else if(data && data.success == 1){
          toast.success(data.message);
          setTimeout(() => {
            location.reload(true);
          }, 2000);
        }
        else{
          toast.error(data.message);
        }

        this.hideAlert();
    });
  }

  openVmHistory(vm_data) {      
    this.setState({ modalVmHistory: true });
    this.setState({ vmDetails: vm_data });
    var params={clientid:vm_data.clientid,vmid:vm_data.id}
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(params))
    };

    this.setState({
      isLogsLoading: true,
      logData: []
    });
  
    fetch(`${config.apiUrl}/secureApi/gcp/vm_log`, requestOptions).then(response  => this.handleGcpHistoryApiResponse(response));
  }

  handleGcpHistoryApiResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if(data && data.length > 0){
          this.setState({
            logData: data
          });
        }

        this.setState({
          isLogsLoading: false
        });
    });
  }

  modalCloseVm() {
    this.setState({ modalVmHistory: false });
    this.getVMDetails();     
  }

  /*Start: VM Operations*/
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

  hideAlert() {
    this.setState({
      sweetalert: null
    });
  }

  vmOperations() {
    $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);

    let vmData = this.state.vmDetails;
    let action = this.state.action;
    
    this.calGcpOperationsApis({ 
      ref_id: btoa(vmData.ref_id), 
      action: action,
      vm_id:btoa(vmData.id),
      clientid:btoa(this.state.clientid) }, "vm_operations");
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

  vmTerminateOperations = () => {
    $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);
    
    let formdata = { "clientid" : this.state.clientid,    
                      "vmId" : this.state.vm_data.vm.id
                   }

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(formdata))
    };
    return fetch(`${config.apiUrl}/secureApi/gcp/delete_vm`, requestOptions)
    .then(res => res.json())
    .then((text) => {
      const data = text && JSON.parse(ucpDecrypt((text)));
      if (data.success) {
        toast.success(data.message ? data.message : "VM deletion has requested successfully!");
        setTimeout(() => {
          window.location = window.location.origin + "/#/GcpVmList"
        }, 2000);
      }
      else{
        toast.error(data.message ? data.message : "Unable to delete VM");
      }

      this.hideAlert();
    })
    .catch(console.log)
  }

  vmLogs(vmid) {
    //this.props.dispatch(awsActions.vmLogs(vmid));
    this.openModal();
  }

  /*End: VM Operations*/

  /*Start: Add Disk*/
  handleAddDiskName = (target) => {
    let val = target.value.toLowerCase();
    var letterNumber = /^[0-9a-z]+$/;
    if(val == ""){
        this.setState({
          AddDiskDiskName: ""
        })
    }
    else if((val.match(letterNumber))){
        this.setState({
          AddDiskDiskName: val
        })
    }
  }
  /*End: Add Disk*/
  
  render() {
    const { profiles } = this.props;
    let vm_data=this.state.vm_data;  
    let logData = this.state.logData;

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color"><img src="/src/img/google_cloud_icon.png" className="mr-2 width-20" />VM Details</h5>
          {this.state.isDataDetailsLoading && <PageLoader/>}
          {!this.state.isDataDetailsLoading && vm_data &&  <div className="row vm-details">      
            <div className="col-md-12 p-0 vm-details-row mt-3">
              <div className="col-md-12">
                {commonFns.fnCheckVMOperationsAuth(profiles, commonFns.vmOperations.GcpOperations.OnOff) &&
                  <React.Fragment>
                    {(vm_data.vm.vm_status.toLowerCase() == "poweredon" || vm_data.vm.vm_status.toLowerCase() == "running") ?
                    <span className="alert info-box-danger mr-2 cursor-pointer" onClick={() => this.vmAction(vm_data.vm,'stop','Power Off')}><span className="fas fa-power-off mr-2"></span>Power Off</span>
                    :<span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.vmAction(vm_data.vm,'start','Power On')}><span className="fa fa-play mr-2"></span>Power On</span>}
                  </React.Fragment>
                }

                {commonFns.fnCheckVMOperationsAuth(profiles, commonFns.vmOperations.GcpOperations.Reboot) &&
                  <span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.vmAction(vm_data.vm,'restart','Reboot')}><span className="fa fa-sync-alt mr-2"></span>Reboot</span>
                }

                {commonFns.fnCheckVMOperationsAuth(profiles, commonFns.vmOperations.GcpOperations.Terminate) &&
                  <span className="alert info-box-danger mr-2 cursor-pointer" onClick={() => this.vmTerminateAction()}><span className="fa fa-times mr-2"></span>Terminate</span>
                }

                {commonFns.fnCheckVMOperationsAuth(profiles, commonFns.vmOperations.GcpOperations.Resize) &&
                  <React.Fragment>
                    {<span className="alert info-box-blue mr-2 cursor-pointer" onClick={() => this.vmResizeForm(vm_data.vm)}><span className="fa fa-expand mr-2"></span>Resize</span>}
                  </React.Fragment>
                }

                {commonFns.fnCheckVMOperationsAuth(profiles, commonFns.vmOperations.GcpOperations.History) &&
                  <span className="alert info-box-blue mr-2 cursor-pointer" onClick={() => this.openVmHistory(vm_data.vm)}><span className="fa fa-history mr-2"></span>History</span>
                }
              </div>
            </div>
            <div className="col-md-12 p-0 vm-details-row mt-4">
              <div className="col-md-6 float-left">
                <div className="col-md-3 float-left p-0"><h6>VM Name : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.host_name}</div>
              </div>
              <div className="col-md-6 float-right">
                <div className="col-md-3 float-left p-0"><h6>VM Status : </h6></div>
                <div className="col-md-9 float-right p-0 text-capitalize">{vm_data.vm.vm_status}</div>
              </div>
            </div>
            <div className="col-md-12 p-0 vm-details-row">
              <div className="col-md-6 float-left">
                <div className="col-md-3 float-left p-0"><h6>VM Zone : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.zone}</div>
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
            <div className="col-md-12 p-0 vm-details-row">
              <div className="col-md-6 float-left">
                <div className="col-md-3 float-left p-0"><h6>Disk Size(GB) : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.disk_units_gb}</div>
              </div>
              <div className="col-md-6 float-right">
                <div className="col-md-3 float-left p-0"><h6>Image : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.os_template_name}</div>
              </div>
            </div>
            <div className="col-md-12 p-0 vm-details-row">
              <div className="col-md-6 float-left">
                <div className="col-md-3 float-left p-0"><h6>Network IP : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm && vm_data.vm.primary_ip}</div>
              </div>
              <div className="col-md-6 float-right">
                <div className="col-md-3 float-left p-0"><h6>Other Ips : </h6></div>
                <div className="col-md-9 float-right p-0 wordwrap">{vm_data.vm && vm_data.vm.multiple_ip}</div>
              </div>
            </div>
            <div className="col-md-12 p-0 vm-details-row mb-4 clear-both pb-4">
              <div className="col-md-6 float-left">
                <div className="col-md-3 float-left p-0"><h6>Project : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm && vm_data.vm.project_name}</div>
              </div>
              <div className="col-md-6 float-right">
              </div>
            </div>

            <fieldset className="fieldset-wrapper">
                <legend className="fieldset-legend color">Network Interface</legend>
                <div class="control-group">
                  <div className="col-md-12 p-0 vm-details-row">
                    <div className="col-md-6 float-left">
                      <div className="col-md-4 float-left p-0"><h6>NIC Name : </h6></div>
                      <div className="col-md-8 float-right p-0">{vm_data.vm_detail && vm_data.vm_detail.networkInterfaces && vm_data.vm_detail.networkInterfaces[0] && vm_data.vm_detail.networkInterfaces[0].name}</div>
                    </div>
                    <div className="col-md-6 float-right">
                      <div className="col-md-4 float-left p-0"><h6>Sub Network : </h6></div>
                      <div className="col-md-8 float-right p-0 wordwrap">{vm_data.vm_detail && vm_data.vm_detail.networkInterfaces && vm_data.vm_detail.networkInterfaces[0] && vm_data.vm_detail.networkInterfaces[0].subnetwork && vm_data.vm_detail.networkInterfaces[0].subnetwork.split("subnetworks/")[1].split("/")[0]}</div>
                    </div>
                  </div>
                </div>
            </fieldset>
            
            <fieldset className="fieldset-wrapper">
                <legend className="fieldset-legend color">Disk Info</legend>
                <div class="control-group">
                  <div className="clear-both"></div>
                  <div className="col-md-12 p-0 vm-details-row">
                    <div class="col-md-12 p-0 pl-2">
                      <div class="float-right">
                        <button className="btn btn-sm btn-primary mr-2" onClick={this.openModalAttachVolume}><i className="fa fa-plus"></i> Attach Disk</button>
                        <button className="btn btn-sm btn-primary" onClick={this.openModalAddVolume}><i className="fa fa-plus"></i> Add Disk</button>
                        <Modal
                          isOpen={this.state.modalIsAttachVolumeOpen}
                          onRequestClose={this.closeModalAttachVolume}
                          >
                            <h2 style={{color:'red'}}>
                                Attach Disk to VM<a className="float-right" href="javascript:void(0);" onClick={this.closeModalAttachVolume}><i className="fa fa-times" /></a>
                            </h2>

                            <div className="col-md-12">
                                <div className="panel panel-default" />
                                <form
                                name="attachVolume"
                                id="attachVolume"
                                method="post"
                                onSubmit={this.attachVolume}
                                >
                                  {
                                      this.state.isAvailableVolumesLoading ? <PageLoader/> :
                                      <React.Fragment>
                                        <div className="form-group">
                                            <button 
                                            className={"btn btn-sm btn-primary float-right " + (this.state.is_attach_volume_inprogress ? "no-access" : "")} disabled={this.state.is_attach_volume_inprogress ? true : false}
                                            >
                                              {this.state.is_attach_volume_inprogress &&
                                                <i className="fas fa-circle-notch icon-loading"></i>}Attach Disk</button>
                                        </div>
                                        <div className="clear-both">
                                          <div className="dataTables_wrapper dt-bootstrap4 mt-4">
                                              <MDBDataTable
                                              striped
                                              hover
                                              data={this.state.availableVolumesList}
                                              />
                                          </div>
                                        </div>
                                      </React.Fragment>
                                  }
                                </form>
                            </div>
                        </Modal>
                        <Modal
                          isOpen={this.state.modalIsAddVolumeOpen}
                          onRequestClose={this.closeAddVolumeModal}
                          >
                              <h2 style={{color:'red'}}>
                                  Add Disk<a className="float-right" href="javascript:void(0);" onClick={this.closeAddVolumeModal}><i className="fa fa-times" /></a>
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
                                      <label htmlFor="subscription">Project</label>
                                      <input
                                        type="text"
                                        className="form-control input-disabled"
                                        value={vm_data.vm.project_name}
                                        readOnly
                                        />
                                      <input type="hidden" name="projectId" value={vm_data.vm.projectId} />
                                  </div>
                                  <div className="form-group position-relative">
                                      <label htmlFor="subscription">Zone</label>
                                      <input
                                        type="text"
                                        className="form-control input-disabled"
                                        name="zone"
                                        value={vm_data.vm.zone}
                                        readOnly
                                        />
                                  </div>
                                  <div className="form-group">
                                      <label htmlFor="name">Disk Name<span className="star-mark">*</span></label>
                                      <input
                                      type="text"
                                      className="form-control"
                                      name="diskName"
                                      required
                                      value={this.state.AddDiskDiskName}
                                      onChange={(event) => this.handleAddDiskName(event.target)}
                                      placeholder="Ex: disk1"
                                      />
                                  </div>
                                  <div className="form-group position-relative">
                                      <label htmlFor="name">Size (GB)<span className="star-mark">*</span></label>
                                      <input
                                      type="text"
                                      className="form-control"
                                      name="sizeGb"
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
                                      <th>Disk Name</th>
                                      <th>Size</th>
                                      <th>Type</th>
                                      <th></th>
                                  </tr>
                              </thead>
                              <tbody>
                                {(vm_data.vm_detail.disks && vm_data.vm_detail.disks.length > 0) ?
                                (vm_data.vm_detail.disks.map((row, index) =>
                                    <tr>
                                        <td>
                                            {row.deviceName}
                                        </td>
                                        <td>
                                            {row.diskSizeGb} GB
                                        </td>
                                        <td>
                                            {row.type}
                                        </td>
                                        <td className="text-center">
                                          <button class="btn btn-sm btn-danger" onClick={() => this.DetachDiskAction(row)}><i class="fas fa-minus-circle"></i> Detach Disk</button>
                                        </td>
                                    </tr>
                                )
                                ) : <tr><td colspan="5" className="text-center p-5"><span className="star-mark">No Disk is Attached</span></td></tr>}
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
          {this.state.isLogsLoading && <PageLoader/>}
          {!this.state.isLogsLoading && (!logData || logData.length == 0) && <div className="text-error-message">No logs found!</div>}
          {logData && logData.length > 0 &&
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
  const { vm_data, profiles } = state;
  return {
    vm_data,
    profiles
  };
}

const connectedVmlist = connect(mapStateToProps)(GcpVmDetails);
export { connectedVmlist as GcpVmDetails };