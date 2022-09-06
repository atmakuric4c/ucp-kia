import React from 'react';
import { connect } from 'react-redux';
import { vmlistActions } from './vmlist.actions';
import { commonActions } from "../../_actions";
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import Moment from 'react-moment';
import PageLoader from '../PageLoader';
import { toast } from 'react-toastify';
import { commonFns } from "../../_helpers/common";
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri, encryptRequest } from '../../_helpers';
import config from 'config';

Modal.setAppElement("#app");
class PhysicalServerDetails extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_role: user.data.user_role,
      vmlist: [],
      vm_data:[],
      logData: [],
      vmData : [],
      common: [],
      job_type:'',
      sweetalert: true,
      modalIsOpen: false,
      openBackupStatus:false,
      openReplicaStatus:false,
      modalVmHistory: false,
      modalResizeIsOpen : false,
      modalIsVmDetailOpen: false,
      datemodalIsOpen:false,
      modalIsOpenDiskinfo: false,
      modalIsOpenAddVm: false,
      isAddVmLoading: false,
      vmDetails: [],
      delDiskInfo:[],
      action: null,
      loading:true,
      vm_id_val:0,
      creation_date:''
    };
    this.intervalConter = null;
    this.loaderImage=this.loaderImage.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);

    this.openVmHistory = this.openVmHistory.bind(this);
    this.modalCloseVm = this.modalCloseVm.bind(this);

    this.closeResizeModal = this.closeResizeModal.bind(this);

    this.viewBackupStatus  = this.viewBackupStatus .bind(this);
    this.closeBackupStatus = this.closeBackupStatus.bind(this);

    this.viewReplicaStatus  = this.viewReplicaStatus.bind(this);
    this.closeReplicaStatus = this.closeReplicaStatus.bind(this);

    this.openVmDetailModal = this.openVmDetailModal.bind(this);
    this.closeVmDetailModal = this.closeVmDetailModal.bind(this);

    this.openModalDiskInfo = this.openModalDiskInfo.bind(this);
    this.afterOpenModalDiskInfo = this.afterOpenModalDiskInfo.bind(this);
    this.closeModalDiskInfoHandle = this.closeModalDiskInfo.bind(this);
    this.openModalAddVm = this.openModalAddVm.bind(this);
    this.closeModalAddVm = this.closeModalAddVm.bind(this);
    this.afterOpenModalAddVm = this.afterOpenModalAddVm.bind(this);
    this.addDisk = this.addDisk.bind(this);
    this.deleteDisk = this.deleteDisk.bind(this);
    this.updateVmList=this.updateVmList.bind(this);
    this.addVmRequest = this.addVmRequest.bind(this);
    this.dateopenModal = this.dateopenModal.bind(this);
    this.datecloseModal = this.datecloseModal.bind(this);
    this.dateUpdateRequest = this.dateUpdateRequest.bind(this);
    this.handleChangeCreationDateTime = this.handleChangeCreationDateTime.bind(this);
    this.compareValues = this.compareValues.bind(this);
    
  }
  compareValues(val1,val2) {
    console.log(val1+" -- "+val2+" == "+(val2 > val1));
    if(val2 > val1){
      return true;
    }else{
      return false;
    }
  }
  handleChangeCreationDateTime(date) {
    this.setState({
      creation_date: date
    });
  }
  loaderImage(){
    this.props.dispatch(vmlistActions.getAll(0));
  }
  openModalAddVm() { 
    this.setState({ modalIsOpenAddVm: true });
    this.setState({ isAddVmLoading: true });
  }

  afterOpenModalAddVm() {       
    // this.subtitle.style.color = "#f00";
  }

  closeModalAddVm() {
    this.setState({ modalIsOpenAddVm: false });
  } 
  
 updateVmList=()=>{
  this.props.dispatch(vmlistActions.getAll(this.state.clientid));
 }

  openModal() {      
    this.setState({ modalIsOpen: true });
  }

  afterOpenModal() {       
    //this.subtitle.style.color = "#f00";
  }

  closeModal() {
    this.setState({ modalIsOpen: false });
    window.location.reload();         
  }
  
  viewBackupStatus (vm_data) {      
    this.setState({ 
      openBackupStatus: true,
      vmDetails: vm_data,
      job_type: 'backup'
     });
    var params={clientid:vm_data.clientid,vmid:vm_data.id,type:'backup'}
    this.props.dispatch(vmlistActions.getJobStatus(params));
  }
  closeBackupStatus() {
    this.setState({ openBackupStatus: false });
  }
  viewReplicaStatus (vm_data) {      
    this.setState({ 
      openReplicaStatus: true,
      vmDetails: vm_data,
      job_type: 'replication'
     });
    var params={clientid:vm_data.clientid,vmid:vm_data.id,type:'replication'}
    this.props.dispatch(vmlistActions.getJobStatus(params));
  }
  closeReplicaStatus() {
    this.setState({ openReplicaStatus: false });  
  }
  openVmHistory(vm_data) {      
    this.setState({ modalVmHistory: true });
    this.setState({ vmDetails: vm_data });
    var params={clientid:vm_data.clientid,vmid:vm_data.id}
    this.props.dispatch(vmlistActions.vmLogs(params));
  }

  modalCloseVm() {
    this.setState({ modalVmHistory: false });
    this.props.dispatch(vmlistActions.vmDetail(btoa(this.state.clientid),this.props.match.params.id));       
  }
  openVmDetailModal() {      
    this.setState({ modalIsVmDetailOpen: true });
  }
  closeVmDetailModal() {
    this.setState({ modalIsVmDetailOpen: false });      
  }
  dateopenModal(vmData){
    this.setState({ datemodalIsOpen: true });
    this.setState({ vm_id_val: vmData.id });
  }
  datecloseModal() {
    this.setState({ datemodalIsOpen: false }); 
    this.setState({ vm_id_val: 0 });
    //window.location.reload();
  }
  dateUpdateRequest = e => {
    //e.preventDefault();  
    var form = document.querySelector("#updatedateform");
    var formData = serialize(form, { hash: true });
    formData.vm_id=this.state.vm_id_val;
    formData.client_id=this.state.clientid;
    formData.creation_date=Math.round(new Date(this.state.creation_date).getTime());
    this.props.dispatch(vmlistActions.updateVmCreateDate(formData));
    this.setState({ sweetalert: null });
    this.datecloseModal();
  }

  openModalDiskInfo() {      
    this.setState({ modalIsOpenDiskinfo: true });
  }

  afterOpenModalDiskInfo() {       
    //this.subtitle.style.color = "#f00";
  }
  
  closeModalDiskInfo() {     
    this.setState({ modalIsOpenDiskinfo: false });
    window.location.reload();             
  }

  componentDidMount() {
    debugger;
    //this.props.dispatch(vmlistActions.vmDetail(this.props.match.params.id));
    this.getPhysicalServerDetails(this.props.match.params.id);

    this.props.dispatch(commonActions.getRamList());
    this.props.dispatch(commonActions.getCpuList());
    // this.props.dispatch(commonActions.getDiskList());
    //this.intervalConter = setInterval(this.updateVmList.bind(this), 15000);
  }

  getPhysicalServerDetails(formData){
    this.setState({
      loading: true
    });

    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/vmlist/physicalVmDetails/` + formData, requestOptions).then(this.handlePhysicalServerDetails);
  }

  handlePhysicalServerDetails = (response) => {
    return response.text().then(text => {
      let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

      if(data){
        this.setState({
          vm_data: data
        });
      }
      else{
        this.setState({
          vm_data: {
            vm: {}
          }
        });
      }

      this.setState({
        loading: false
      });
    });
  }

  veeamAction(vmData,type_id,action,job_type){
    this.setState({
      vmDetails: vmData,
      type_id: type_id,
      job_type:job_type
    });
    var dispLable = "Yes, " + action + " it!";
    const getAlert = () => (
      <SweetAlert
        warning
        showCancel
        confirmBtnText={dispLable}
        confirmBtnBsStyle="danger"
        cancelBtnBsStyle="default"
        title="Are you sure?"
        onConfirm={this.veeamOperations.bind(this)}
        onCancel={this.hideAlert.bind(this)}
      >
      </SweetAlert>
    );
    this.setState({
      sweetalert: getAlert()
    });
  }
  veeamOperations() {
    this.hideAlert();
    let vmData = this.state.vmDetails;
    let type_id = this.state.type_id;
    let job_type = this.state.job_type;
    const postParams = { "ref_id": btoa(vmData.ref_id),"job_type":job_type, "type_id": type_id,vm_id:btoa(vmData.id),clientid:btoa(this.state.clientid) };
    this.props.dispatch(vmlistActions.veeamOperations(postParams));
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

  hideAlert() {
    this.setState({
      sweetalert: null
    });
  }

  vmOperations() {
    this.hideAlert();
    let vmData = this.state.vmDetails;
    let action = this.state.action;
    const postParams = { "ref_id": btoa(vmData.ref_id), "type": action,vm_id:btoa(vmData.id),clientid:btoa(this.state.clientid) };
    this.props.dispatch(vmlistActions.vmOperations(postParams));
  }

  vmResizeForm(vmData) {
    console.log("vmData");
    console.log(vmData);
    // const resizeAlert = () => (
    //   <SweetAlert
    //     showCancel
    //     confirmBtnText="Update"
    //     confirmBtnBsStyle="danger"
    //     cancelBtnBsStyle="default"
    //     title=""
    //     onConfirm={this.vmResize.bind(this)}
    //     onCancel={this.hideAlert.bind(this)}
    //   >
    //     <form
    //       name="vmResize"
    //       id="vmResize"
    //     >
    //       <div className="form-group">
    //         <label htmlFor="ram_gb">RAM</label>
    //         <select className="form-control form-control-sm" name="memory" defaultValue={(vmData.ram_units_gb)}>
    //           <option value="1">1 GB</option>
    //           <option value="2">2 GB</option>
    //           <option value="4">4 GB</option>
    //           <option value="8">8 GB</option>
    //           <option value="16">16 GB</option>
    //         </select>
    //       </div>
    //       <div className="form-group">
    //         <label htmlFor="cpu_count">CPU</label>
    //         <select className="form-control form-control-sm" name="cpu" defaultValue={(vmData.cpu_units)}>
    //           <option value="1">1 Core</option>
    //           <option value="2">2 Core</option>
    //           <option value="3">3 Core</option>
    //           <option value="4">4 Core</option>
    //           <option value="5">5 Core</option>
    //           <option value="6">6 Core</option>
    //           <option value="7">7 Core</option>
    //           <option value="8">8 Core</option>
    //           <option value="9">9 Core</option>
    //           <option value="10">10 Core</option>
    //         </select>
    //       </div>

    //       <div className="form-group">
    //         <input type="hidden" value={vmData.id} name="id" />
    //         <input type="hidden" value={vmData.ref_id} name="vm_id" />
    //         <input type="hidden" value={vmData.clientid} name="user_id" />
    //         <input type="hidden" value={vmData.ram} name="old_ram_size" />
    //         <input type="hidden" value={vmData.cpu_count} name="old_cpu_size" />
    //       </div>
    //     </form>
    //   </SweetAlert>
    // );
    // this.setState({
    //   sweetalert: resizeAlert()
    // });
  
    this.setState({ modalResizeIsOpen: true });
    this.setState({ vmData: vmData });
  }

  closeResizeModal() {
    this.setState({ modalResizeIsOpen: false });
    // this.props.dispatch(vmlistActions.vmDetail(btoa(this.state.clientid),this.props.match.params.id));       
  }

  // vmResizeRequest() {
  vmResizeRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#vmResizeFrm");
    var formData = serialize(form, { hash: true });
    console.log(formData);
    if(formData.memory != '' && formData.old_ram_size > formData.memory)
    {
      toast.error("Ram size must be greater than the existing Ram size or else select no change");
      return;
    }
    if(formData.cpu != '' && formData.old_cpu_size > formData.cpu)
    {
      toast.error("CPU size must be greater than the existing CPU size or else select no change");
      return;
    }

    if(formData.memory != '' && formData.cpu != '' &&
      formData.old_ram_size == formData.memory &&
      formData.old_cpu_size == formData.cpu){
      toast.error("Please select valid data to upgrade the VM");
      return;
    }

    // this.props.dispatch(vmlistActions.vmResize(formData));
    // this.setState({ sweetalert: null });
  }
  addVmRequest = e => {
    e.preventDefault();  
    var form = document.querySelector("#addVmFrm");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(vmlistActions.addVm(formData));
    this.setState({ sweetalert: null });
    this.closeModalAddVm();
    // this.props.dispatch(vmlistActions.getAll());
  }

  vmLogs(vmid) {
    this.props.dispatch(vmlistActions.vmLogs(vmid));
    //this.setState({ modalIsOpen: true });
    this.openModal();
  }

  vmDiskInfo(vmData) {
    this.props.dispatch(vmlistActions.getDiskDetails(vmData.id));
    this.setState({ vmDetails: vmData });
    this.openModalDiskInfo();
  }

  addDisk() {
    let vmId = this.state.vmDetails.id;
    const addDiskAlert = () => (
      <SweetAlert
        showCancel
        confirmBtnText="Add Disk"
        confirmBtnBsStyle="danger"
        cancelBtnBsStyle="default"
        title=""
        onConfirm={this.vmAddDisk.bind(this)}
        onCancel={this.hideAlert.bind(this)}
      >
        <form
          name="vmAddDisk"
          id="vmAddDisk"
        >
          <div className="form-group">
            <label htmlFor="disk_gb">Disk</label>
            <select className="form-control form-control-sm" name="disk_gb" >
              <option value="50">50 GB</option>
              <option value="100">100 GB</option>
              <option value="150">150 GB</option>
              <option value="200">200 GB</option>
              <option value="250">250 GB</option>
              <option value="300">300 GB</option>
              <option value="350">350 GB</option>
              <option value="400">400 GB</option>
              <option value="450">450 GB</option>
              <option value="500">500 GB</option>
            </select>
          </div>
          <input type="hidden" value={vmId} name="vm_id" />
        </form>
      </SweetAlert>
    );
    this.setState({
      sweetalert: addDiskAlert()
    });
  }

  vmAddDisk() {
    var form = document.querySelector("#vmAddDisk");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(vmlistActions.vmAddDisk(formData));
    this.setState({ sweetalert: null });
    this.closeModalDiskInfo();
    window.location.reload();

  }
  
  deleteDisk(vmid, diskid){
    let diskinfo = {'vm_id':vmid,'diskid':diskid};
    this.setState({delDiskInfo : diskinfo});
    const deleteDiskAlert = () => (
      <SweetAlert
        warning
        showCancel
        confirmBtnText="Delete Disk"
        confirmBtnBsStyle="danger"
        cancelBtnBsStyle="default"
        title="Are you sure to Delete Disk?"
        onConfirm={this.vmDeleteDisk.bind(this)}
        onCancel={this.hideAlert.bind(this)}
      >
      </SweetAlert>
    );
    this.setState({
      sweetalert: deleteDiskAlert()
    });

  }
  vmDeleteDisk(){
    let delDiskInfo = this.state.delDiskInfo;
    this.props.dispatch(vmlistActions.vmDeleteDisk(delDiskInfo));
    this.setState({ sweetalert: null });
    this.closeModalDiskInfo();
    window.location.reload();
  }

  render() { 
    const { vmlist,veeamjob} = this.props;
    let loading=this.state.loading;                                      
    let vm_data=this.state.vm_data;  
    let logData=this.props.vmlist.logData; 
    let jobstatus=this.props.veeamjob.jobstatus;  
    let common = this.props.common;

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color"><i className="sub-menu-icon fas fa-server cloud-icon-server mr-2"></i>Physcial Servers</h5>
          {loading && <PageLoader/>}
          {!loading &&  
          <React.Fragment>
          <div className="row vm-details">
            <div className="col-md-12 p-0 vm-details-row mt-4">
              <div className="col-md-6 float-left">
                <div className="col-md-3 float-left p-0"><h6> Name : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.label_name}</div>
              </div>
              <div className="col-md-6 float-right">
                <div className="col-md-3 float-left p-0"><h6>OS Type : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.os_type}</div>
              </div>
            </div>
            <div className="col-md-12 p-0 vm-details-row">
              <div className="col-md-6 float-left">
                <div className="col-md-3 float-left p-0"><h6>CPU Core : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.cpus}</div>
              </div>
              <div className="col-md-6 float-right">
                <div className="col-md-3 float-left p-0"><h6>Memory(GB) : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.ram_gb}</div>
              </div>
            </div>
            <div className="col-md-12 p-0 vm-details-row">
              <div className="col-md-6 float-left">
                <div className="col-md-3 float-left p-0"><h6>Disk Size(GB) : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.disk_gb}</div>
              </div>
            </div>
			      <div className="col-md-12 p-0 vm-details-row">
              <div className="col-md-6 float-left">
                <div className="col-md-3 float-left p-0"><h6>IP Address : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.primary_ip}</div>
              </div>
              <div className="col-md-6 float-right">
                <div className="col-md-3 float-left p-0"><h6>Other Ips : </h6></div>
                <div className="col-md-9 float-right p-0 wordwrap">{vm_data.vm.multiple_ip}</div>
              </div>
            </div>
          </div>
            {vm_data.vm.cloudid == 1 && vm_data.vm.copy_type !="1C" && vm_data.vm.copy_type !="2C"?
            <div className="row p-0 clear-both hide">          
             <div className="col-md-6 p-0 float-left">
              <h5 className="color float-left">Backup Job Operations</h5>
              <div className="float-left col-md-12 p-0 margin-b-5">
              {vm_data.vm.fourth_copy != 1 ?
              <a className="btn btn-success cursorpointer2 btn-sm" 
              onClick={() => this.veeamAction(vm_data.vm,1,'enable','backup')}><span>Enable Job</span></a>
              :<a className="btn btn-danger cursorpointer2 btn-sm" 
              onClick={() => this.veeamAction(vm_data.vm,2,'disable','backup')}><span>Disable Job</span></a>}
              <a className="btn btn-primary cursorpointer2 btn-sm ml-2" 
              onClick={() => this.viewBackupStatus(vm_data.vm)}><span>Backup Status</span></a>
              </div>
            </div>
            {vm_data.vm.copy_type =="4C"?
            <div className="col-md-6 p-0 float-right">
              <h5 className="color float-left mt-4">Replication Job Operations</h5>
              <div className="float-left col-md-12 p-0 margin-b-5">
              {vm_data.vm.fourth_copy != 1 ?
              <a className="btn btn-success cursorpointer2 btn-sm" 
              onClick={() => this.veeamAction(vm_data.vm,1,'enable','replication')}><span>Enable Job</span></a>
              :<a className="btn btn-danger cursorpointer2 btn-sm" 
              onClick={() => this.veeamAction(vm_data.vm,2,'disable','replication')}><span>Disable Job</span></a>}
              <a className="btn btn-primary cursorpointer2 btn-sm ml-2" 
              onClick={() => this.viewReplicaStatus(vm_data.vm)}><span>Replica Status</span></a>
              </div>
            </div>
            :""}
            </div>
            :
            <div className="row clear-both hide">          
             <div className="col-md-6 p-0 float-left">
              <h5 className="color float-left">Backup Job Operations</h5>
              <div className="float-left col-md-12 p-0 margin-b-5">
              {vm_data.vm.fourth_copy != 1 ?
              <a className="btn btn-success cursorpointer2 btn-sm" 
              onClick={() => this.veeamAction(vm_data.vm,1,'enable','backup')}><span>Enable Job</span></a>
              :<a className="btn btn-danger cursorpointer2 btn-sm" 
              onClick={() => this.veeamAction(vm_data.vm,2,'disable','backup')}><span>Disable Job</span></a>}
              <a className="btn btn-primary cursorpointer2 btn-sm ml-2" 
              onClick={() => this.viewBackupStatus(vm_data.vm)}><span>Backup Status</span></a>
              </div>
            </div>
            </div>}
            <br/>

          
          </React.Fragment>
          }
          {this.state.sweetalert}
      </div>
      <Modal
          isOpen={this.state.openBackupStatus}  
          onRequestClose={this.closeBackupStatus}
          contentLabel="Veeam Replica Job Status">
          <h2 style={{color:'red'}}>
            Veeam Backup Job Status <a className="float-right" href="javascript:void(0);" onClick={this.closeBackupStatus}><i className="fa fa-times" /></a>
          </h2>
          <div className="table-responsive">
          {jobstatus && this.state.job_type=='backup' &&
            <table className="table table-bordered table-striped table-dark table-custom table-hover" id="job_status">
            {!jobstatus.data && <thead><tr><th>{jobstatus.message}</th></tr></thead>}
            {jobstatus.data ? <thead>
                  {typeof jobstatus.data.TotalRecoveryPoints !='undefined' ?<tr><th style={{'width':'37%'}}>Total Recovery Points</th><td>{jobstatus.data.TotalRecoveryPoints}</td></tr>:''}
                  {jobstatus.data['Recovery Range'] ?<tr><th>Recovery Range</th><td>{jobstatus.data['Recovery Range']}</td></tr>:''}
                  {jobstatus.data['Latest Recovery Point'] ?<tr><th>Latest Recovery Point</th><td>{jobstatus.data['Latest Recovery Point']}</td></tr>:''}
                  {jobstatus.data['Total size'] ?<tr><th>Total size</th><td>{jobstatus.data['Total size']}</td></tr>:''}
                  {jobstatus.data['Backup Size'] ?<tr><th>Backup Size</th><td>{jobstatus.data['Backup Size']}</td></tr>:''}
                  {jobstatus.data['Data read'] ?<tr><th>Data read</th><td>{jobstatus.data['Data read']}</td></tr>:''}
                  {jobstatus.data['Transferred'] ?<tr><th>Transferred</th><td>{jobstatus.data['Transferred']}</td></tr>:''}
                  {jobstatus.data['Backup Enabled'] ?<tr><th>Backup Enabled</th><td>{jobstatus.data['Backup Enabled']}</td></tr>:''}
                  {jobstatus.data['Oldest Recovery Point(s)'] ?<tr><th style={{"verticalAlign":"inherit"}}>Oldest Recovery Point(s)</th><td>{jobstatus.data['Oldest Recovery Point(s)']}</td></tr>:''}
                  {jobstatus.data['State'] ?<tr><th>State</th><td>{jobstatus.data['State']}</td></tr>:''}
                  {jobstatus.data['Backup Status'] ?<tr><th>Backup Status</th><td>{jobstatus.data['Backup Status']}</td></tr>:''}
                  {jobstatus.restore_point ?<tr><th style={{"verticalAlign":"inherit"}}>Available Restore Points</th><td>
                  {jobstatus.restore_point && jobstatus.restore_point.map((job,index)=>
                    <label key={index+1}>{`${index+1}-> ${job.vm_restore_point_date}`}<br/></label>
                    )}
                  </td></tr>:''}
              </thead>:''}
            </table>
          }
          </div>
        </Modal>
        <Modal
          isOpen={this.state.openReplicaStatus}  
          onRequestClose={this.closeReplicaStatus}
          contentLabel="Veeam Replica Job Status">
          <h2 style={{color:'red'}}>
            Veeam Replication Job Status <a className="float-right" href="javascript:void(0);" onClick={this.closeReplicaStatus}><i className="fa fa-times" /></a>
          </h2>
          <div className="table-responsive">
          {jobstatus && this.state.job_type=='replication' &&
            <table className="table table-bordered table-striped table-dark table-custom table-hover" id="job_status">
            {!jobstatus.data && <thead><tr><th>{jobstatus.message}</th></tr></thead>}
              {jobstatus.data ?<thead>
                  {typeof jobstatus.data.AverageReplicationLatency !='undefined' ?<tr><th style={{'width':'37%'}}>Average Replication Latency</th><td>{jobstatus.data.AverageReplicationLatency}</td></tr>:''}
                  {jobstatus.data.LastReplicationTime ?<tr><th>Last Replication Time</th><td>{jobstatus.data.LastReplicationTime}</td></tr>:''}
                  {jobstatus.data.ReplicationState.value !='' ?<tr><th>Replication %</th><td>{jobstatus.data.ReplicationState.value}</td></tr>:''}
                  {jobstatus.data.ReplicationState.Value ?<tr><th>Replication Status</th><td>{jobstatus.data.ReplicationState.Value}</td></tr>:''}
                  {jobstatus.restore_point ?<tr><th style={{"verticalAlign":"inherit"}}>Available Restore Points</th><td>
                  {jobstatus.restore_point && jobstatus.restore_point.map((job,index)=>
                    <label key={index+1}>{`${index+1}-> ${job.vm_restore_point_date}`}<br/></label>
                    )}
                  </td></tr>:''}
              </thead>:''}
            </table>
          }
          </div>
        </Modal>
        <Modal
          isOpen={this.state.modalVmHistory}  
          onRequestClose={this.modalCloseVm}
          contentLabel="VM Details Modal"  className="metrics">
          <h2 style={{color:'red'}}>
            VM History <a className="float-right" href="javascript:void(0);" onClick={this.modalCloseVm}><i className="fa fa-times" /></a>
          </h2>
          <div className="table-responsive color-white">
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
        <Modal
          isOpen={this.state.modalResizeIsOpen}
          onRequestClose={this.closeResizeModal}
          contentLabel="VM Resize" className="metrics">
          <h2 style={{ color: 'red' }}>
              VM Resize <a className="float-right" href="javascript:void(0);" onClick={this.closeResizeModal}><i className="fa fa-times" /></a>
          </h2>
          <form
            name="vmResizeFrm"
            id="vmResizeFrm"
            method="post"
            onSubmit={this.vmResizeRequest}
          >
            <div className="form-group">
              <label htmlFor="ram_gb">RAM </label>
              
              <select
                className="form-control form-control-sm"
                required
                name="memory"
                defaultValue={(this.state.vmData.ram_units_gb)}
              >
                <option value="">--No Change--</option>
                {common.ramList && common.ramList.map((item, index) =>
                  <option value={item.option_value} key={item.option_value}>
                    {item.option_value}
                  </option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="cpu">CPU</label>
              <select
                className="form-control form-control-sm"
                required
                name="cpu"
                defaultValue={(this.state.vmData.cpu_units)}
              >
                <option value="">--No Change--</option>
                {common.cpuList && common.cpuList.map((item, index) =>
                  <option value={item.option_value} key={item.option_value}>
                    {item.option_value} Core
                  </option>
                )}
              </select>
            </div>

            <div className="form-group">
              <input type="hidden" value={this.state.vmData.id} name="id" />
              <input type="hidden" value={this.state.vmData.ref_id} name="vm_id" />
              <input type="hidden" value={this.state.vmData.clientid} name="user_id" />
              <input type="hidden" value={this.state.vmData.ram_units_gb} name="old_ram_size" />
              <input type="hidden" value={this.state.vmData.cpu_units} name="old_cpu_size" />
              <button className="btn btn-success ">Submit</button>
            </div>
          </form>
          
      </Modal>
    </div> 
    );
  }
}

function mapStateToProps(state) {
  const { vmlist,vm_data,logData,veeamjob, common } = state;
  return {
    vmlist,
    vm_data,
    logData,
    veeamjob, common
  };
}

const connectedVmlist = connect(mapStateToProps)(PhysicalServerDetails);
export { connectedVmlist as PhysicalServerDetails };