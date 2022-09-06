import React from 'react';
import { connect } from 'react-redux';
import { vmlistActions } from './vmlist.actions';
import { commonActions, alertActions, ostemplatesActions } from "../../_actions";
import { NetworkMgmtActions } from "../../NetworkMgmt/NetworkMgmt.actions";
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import axios from 'axios';
import DatePicker from "react-datepicker";
import Datetime from 'react-datetime';
import Moment from 'react-moment';

const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");
class Vms extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_role: user.data.user_role,
      vmlist: [],
      vm_data:[],
      logData: [],
      sweetalert: null,
      modalIsOpen: false,
      modalIsVmDetailOpen: false,
      modalIsEditSchedulerOpen:false,
      datemodalIsOpen:false,
      modalIsOpenDiskinfo: false,
      modalIsOpenAddVm: false,
      isAddVmLoading: false,
      vmDetails: [],
      delDiskInfo:[],
      action: null,
      loading:true,
      vm_id_val:0,
      creation_date:'',
      form_data:
      { 
        vm_id: '',
        scheduler_type: '',
        week_day: '',
        start_hour: '',
        start_min: '',
        after_hr: '',
        after_min: '',
        status: '',
        isRequired:false
     }
    };
    this.changeisRequired = this.changeisRequired.bind(this);
    this.intervalConter = null;
    this.loaderImage=this.loaderImage.bind(this);
   
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);

    this.openVmDetailModal = this.openVmDetailModal.bind(this);
    this.closeVmDetailModal = this.closeVmDetailModal.bind(this);

    this.openEditSchedulerModal = this.openEditSchedulerModal.bind(this);
    this.closeEditSchedulerModal = this.closeEditSchedulerModal.bind(this);
    
    this.openModalDiskInfo = this.openModalDiskInfo.bind(this);
    this.afterOpenModalDiskInfo = this.afterOpenModalDiskInfo.bind(this);
    this.closeModalDiskInfoHandle = this.closeModalDiskInfo.bind(this);
    this.openModalAddVm = this.openModalAddVm.bind(this);
    this.closeModalAddVm = this.closeModalAddVm.bind(this);
    this.afterOpenModalAddVm = this.afterOpenModalAddVm.bind(this);
    this.addDisk = this.addDisk.bind(this);
    this.deleteDisk = this.deleteDisk.bind(this);
    this.updateVmList=this.updateVmList.bind(this);
    this.addScheduler = this.addScheduler.bind(this);
    this.dateopenModal = this.dateopenModal.bind(this);
    this.datecloseModal = this.datecloseModal.bind(this);
    this.dateUpdateRequest = this.dateUpdateRequest.bind(this);
    this.handleChangeCreationDateTime = this.handleChangeCreationDateTime.bind(this);    
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
    this.props.dispatch(vmlistActions.getVmList(this.props.match.params.id));
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
  this.props.dispatch(vmlistActions.getAll(this.props.match.params.id));
 }

  openModal() {      
    this.setState({ modalIsOpen: true });
  }

  closeModal() {
    this.setState({ modalIsOpen: false });
    window.location.reload();         
  }
  openVmDetailModal() {      
    this.setState({ modalIsVmDetailOpen: true });
  }

  closeVmDetailModal() {
    this.setState({ modalIsVmDetailOpen: false });
    //window.location.reload();         
  }
  openEditSchedulerModal() {     
    this.setState({ modalIsEditSchedulerOpen: true });
  }
  
  closeEditSchedulerModal() {
    this.setState({ modalIsEditSchedulerOpen: false });
    this.setState({ form_data: '' });
    //window.location.reload();         
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
    this.props.dispatch(vmlistActions.getAll(this.props.match.params.id));
    this.props.dispatch(commonActions.getAllVdcLocations());
    //this.props.dispatch(commonActions.getAllVdcGroups());
    //this.intervalConter = setInterval(this.updateVmList.bind(this), 10000);
  }
  componentWillUnmount(){
    //if(this.intervalConter) clearInterval(this.intervalConter);
  }
  openAlert(vmData, action, label) {
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
    const postParams = { "vm_id": String(vmData.id), "vm_action": String(action) };
    this.props.dispatch(vmlistActions.vmOperations(postParams));
    //this.props.dispatch(vmlistActions.getAll());
  }

  vmResizeForm(vmData) {
    const resizeAlert = () => (
      <SweetAlert
        showCancel
        confirmBtnText="Update"
        confirmBtnBsStyle="danger"
        cancelBtnBsStyle="default"
        title=""
        onConfirm={this.vmResize.bind(this)}
        onCancel={this.hideAlert.bind(this)}
      >
        <form
          name="vmResize"
          id="vmResize"
        >
          <div className="form-group">
            <label htmlFor="ram_gb">RAM</label>
            <select className="form-control form-control-sm" name="ram_gb" defaultValue={(vmData.ram / 1024)}>
              <option value="2">2 GB</option>
              <option value="4">4 GB</option>
              <option value="8">8 GB</option>
              <option value="16">16 GB</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="cpu_count">CPU</label>
            <select className="form-control form-control-sm" name="cpu_count" defaultValue={(vmData.cpu_count)}>
              <option value="1">1 Core</option>
              <option value="2">2 Core</option>
              <option value="3">3 Core</option>
              <option value="4">4 Core</option>
              <option value="5">5 Core</option>
              <option value="6">6 Core</option>
              <option value="7">7 Core</option>
              <option value="8">8 Core</option>
              <option value="9">9 Core</option>
              <option value="10">10 Core</option>
            </select>
          </div>

          <div className="form-group">
            <input type="hidden" value={vmData.id} name="vmid" />
            <input type="hidden" value={vmData.ram} name="old_ram_size" />
            <input type="hidden" value={vmData.cpu_count} name="old_cpu_size" />
          </div>
        </form>
      </SweetAlert>
    );
    this.setState({
      sweetalert: resizeAlert()
    });
  }

  vmResize() {
    var form = document.querySelector("#vmResize");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(vmlistActions.vmResize(formData));
    this.setState({ sweetalert: null });
    window.location.reload();
  }
  addScheduler = e => {
    e.preventDefault();  
    var form = document.querySelector("#addVmFrm");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(vmlistActions.addScheduler(formData));
    this.setState({ sweetalert: null });
    this.closeModalAddVm();
    // this.props.dispatch(vmlistActions.getAll());
  }
  vmLogs(vmid) {
    this.props.dispatch(vmlistActions.vmLogs(vmid));
    //this.setState({ modalIsOpen: true });
    this.openModal();
  }
  vm_detail(vmid){
    this.props.dispatch(vmlistActions.vmDetail(vmid));
    this.openVmDetailModal();
  }
  edit_scheduler(vmData){
    this.setState({form_data:vmData});
    //this.props.dispatch(vmlistActions.vmDetail(vmid));
    this.openEditSchedulerModal();
  }
  updateScheduler = e => {
    e.preventDefault();  
    var form = document.querySelector("#editVmFrm");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(vmlistActions.addScheduler(formData));
    this.setState({ sweetalert: null });
    this.closeEditSchedulerModal();
    // this.props.dispatch(vmlistActions.getAll());
  }
  changeisRequired(e){
    var value=e.target.value;
    if(value=='weekly')
    this.setState({form_data:{isRequired:true}})
    else
    this.setState({form_data:{isRequired:false}})
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
    const { scheduler,vdc_locations,ostemplates,network_list,groups } = this.props;
    let vmlogs = this.props.scheduler.logData;
    let vm_data=this.props.scheduler.vm_data;
    let vmdiskInfo = this.props.scheduler.diskInfo;
    var hours = [];
    var hours2 = [];
    for (var i = 0; i <= 23; i++) {
      if(i<10)
      hours.push('0'+i);
      else
      hours.push(i);
    }  
    for (var i = 0; i <= 22; i++) {
      if(i<10)
      hours2.push('0'+i);
      else
      hours2.push(i);
    }  
    var mns = [];
    for (var i = 0; i <= 59; i++) {
      if(i<10)
      mns.push('0'+i);
      else
      mns.push(i);
    }   
    var days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h2>Scheduler VM List</h2>
          <ul className="nav nav-pills">
          {vdc_locations && vdc_locations.map((vdc, index) =>
            <li className="nav-item" key={index}>
              <a onClick={this.loaderImage} className={(this.props.match.params.id==vdc.vdc_id)?"nav-link active":"nav-link"} href={"/#/scheduler/"+vdc.vdc_id}>{vdc.vdc_name}-Vcenter</a>
            </li>
          )}
          </ul>
          <div className="text-right">
            <button
              className="btn btn-success"
              onClick={this.openModalAddVm}
            >
              <i className="fa fa-plus" /> Create VM Scheduler
              </button>
          </div>
          {scheduler.loading && <em>Loading VM List...</em>}
          {scheduler.items=='' && <em>No Vm is in Scheduler...</em>}
          {scheduler.error && <span className="text-danger">ERROR: {scheduler.error}</span>}
          {scheduler.items &&
            <div className="tableresp table-responsive" style={{height:'400px'}}>
              <table className="table table-bordered table-hover" id="scheduler">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>VM Name</th>
                    <th>VM Group Name</th>
                    <th>IP Address</th>
                    <th>CPU Core</th>
                    <th>RAM (in GB)</th>
                    <th>HDD (in GB)</th>
                    <th>Schedule start with on/off?</th>
                    <th>Schedule Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduler.items!='undefined' && scheduler.items.map((vmData, index) =>
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td><span className="badge badge-primary badge-sm" href="javascript:void(0);" onClick={() => this.vm_detail(vmData.vm_id)}>{vmData.name}</span></td>
                      <td>{vmData.group_name} </td>
                      <td>{vmData.ip_address} </td>
                      <td>{vmData.cpu_count} </td>
                      <td>{vmData.ram} </td>
                      <td>{vmData.hdd} </td>
                      <td>{vmData.status?'Active':'Inactive'} </td>
                      <td>Vm Power{vmData.start_on_off} </td>
                      <td>
                        <span className="badge badge-primary badge-sm" href="javascript:void(0);" onClick={() => this.edit_scheduler(vmData)}>Edit Scheduler</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {this.state.sweetalert}
            </div>
           }
         </div>
        <Modal
          isOpen={this.state.modalIsOpenAddVm}
          onAfterOpen={this.afterOpenModalAddVm}
          onRequestClose={this.closeModalAddVm}
          contentLabel="Add VM Scheduler"
        >
          <h2 style={{color:'red'}}>
           VM Scheduler Creation <a className="float-right" href="javascript:void(0);" onClick={this.closeModalAddVm}><i className="fa fa-times" /></a>
          </h2>
          <div className="col-md-12">
            <div className="panel panel-default" >
            <form
              name="addVmFrm"
              id="addVmFrm"
              method="post"
              onSubmit={this.addScheduler}
            >              
              <div className="form-group row">
                <label htmlFor="vm_id" className='col-sm-4 col-form-label'>Select VM</label>
                {scheduler.vmlist && 
                  <div className="col-sm-8">
                    <select
                      name="vm_id" 
                      className="form-control"
                      required
                      defaultValue={this.state.form_data.vm_id}                    
                    >
                    <option></option>
                    {scheduler.vmlist.map((osItem, index) =>
                    (osItem.status != "Deleted")?
                        <option value={osItem.id} key={osItem.id}>
                        {osItem.name }
                      </option>
                      :
                      ""
                    )}
                      
                    </select>
                  </div>
                }
              </div>
              <div className="form-group row">
                  <label className='col-sm-4 col-form-label' htmlFor="status">Select Scheduler Type</label>
                  <div className="col-sm-8">
                  <select
                    name="scheduler_type"
                    className="form-control"
                    required
                    defaultValue={this.state.form_data.scheduler_type}
                    onChange={e=>this.changeisRequired(e)}
                  >
                    <option></option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
               </div>
              </div>
              <div className="form-group row">
                  <label className='col-sm-4 col-form-label' htmlFor="status">Schedule Start with On/Off?</label>
                  <div className="col-sm-8">
                  <select
                    name="start_on_off"
                    className="form-control"
                    required
                    defaultValue={this.state.form_data.start_on_off}
                  >
                    <option></option>
                    <option value="off">PowerOff</option>
                    <option value="on">PowerOn</option>
                  </select>
               </div>
              </div>
              <div className={`form-group row ${this.state.form_data.isRequired ? "" : "d-none"}`}>
                  <label className='col-sm-4 col-form-label' htmlFor="status">Select Day</label>
                  <div className="col-sm-8">
                  <select
                    name="week_day"
                    className="form-control"
                    required={this.state.form_data.isRequired} 
                    defaultValue={this.state.form_data.week_day}
                  >
                    <option></option>
                    {days && days.map((day, index) =>
                      <option value={day} key={index}>{day}</option>
                    )}
                  </select>
               </div>
              </div>
              <div className="form-group row">
                  <label className='col-sm-4 col-form-label' htmlFor="status">Start Time</label>
                  <div className="col-sm-3">
                    <select
                      name="start_hour"
                      className="form-control"
                      required
                      defaultValue={this.state.form_data.start_hour}
                    >
                      <option></option>
                      {hours && hours.map((hr, index) =>
                      <option value={hr} key={index}>{hr}</option>
                      )}
                    </select>hr
                  </div>
                  <div className="col-sm-3">
                    <select
                      name="start_min"
                      className="form-control"
                      required
                      defaultValue={this.state.form_data.start_min}
                    >
                      <option></option>
                      {mns && mns.map((mn, index) =>
                      <option value={mn} key={index}>{mn}</option>
                      )}
                    </select>min
                  </div>
                  
              </div>
              <div className="form-group row">
                  <label className='col-sm-4 col-form-label' htmlFor="status">End Time After</label>
                  <div className="col-sm-3">
                    <select
                      name="after_hr"
                      className="form-control"
                      required
                      defaultValue={this.state.form_data.after_hr}
                    >
                      <option></option>
                      {hours2 && hours2.map((hr, index) =>
                      <option value={hr} key={index}>{hr}</option>
                      )}
                    </select>hr
                  </div>
                  <div className="col-sm-3">
                    <select
                      name="after_min"
                      className="form-control"
                      required
                      defaultValue={this.state.form_data.after_min}
                    >
                      <option></option>
                      {mns && mns.map((mn, index) =>
                      <option value={mn} key={index}>{mn}</option>
                      )}
                    </select>min
                  </div>
                  
              </div>
              <div className="form-group row">
                  <label className='col-sm-4 col-form-label' htmlFor="status">Select Status</label>
                  <div className="col-sm-8">
                  <select
                    name="status"
                    className="form-control"
                    required
                    defaultValue={this.state.form_data.status}
                  >
                    <option></option>
                    <option value="1">Active</option>
                    <option value="0">InActive</option>
                  </select>
               </div>
              </div>
              <div className="form-group row">
                <label className='col-sm-4 col-form-label'>&nbsp;</label>
                <div className="col-sm-8">
                <input type="hidden" name="client_id" value={this.state.clientid} />
                <input type="hidden" name="vdc_id" value={this.props.match.params.id} />
                  <button className="btn btn-success">Submit</button>
                </div>
              </div>
            </form>
          </div>
          </div>
        </Modal>
        <Modal
          isOpen={this.state.modalIsEditSchedulerOpen}
          onRequestClose={this.closeEditSchedulerModal}
          contentLabel="Edit VM Scheduler"
        >
          <h2 style={{color:'red'}}>
           Edit VM Scheduler <a className="float-right" href="javascript:void(0);" onClick={this.closeEditSchedulerModal}><i className="fa fa-times" /></a>
          </h2>
          <div className="col-md-12">
            <div className="panel panel-default" >
            <form
              name="editVmFrm"
              id="editVmFrm"
              method="post"
              onSubmit={this.updateScheduler}
            >              
              <div className="form-group row">
                <label htmlFor="vm_id" className='col-sm-4 col-form-label'>VM Name</label>
                <input type="hidden" name="vm_id" value={this.state.form_data.vm_id} />
                {this.state.form_data.name && 
                  <div className="col-sm-8">
                   {this.state.form_data.name}
                  </div>
                }
              </div>
              <div className="form-group row">
                  <label className='col-sm-4 col-form-label' htmlFor="status">Select Scheduler Type</label>
                  <div className="col-sm-8">
                  <select
                    name="scheduler_type"
                    className="form-control"
                    required
                    defaultValue={this.state.form_data.scheduler_type}
                    onChange={e=>this.changeisRequired(e)}
                  >
                    <option></option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
               </div>
              </div>
              <div className="form-group row">
                  <label className='col-sm-4 col-form-label' htmlFor="status">Schedule Start with On/Off?</label>
                  <div className="col-sm-8">
                  <select
                    name="start_on_off"
                    className="form-control"
                    required
                    defaultValue={this.state.form_data.start_on_off}
                  >
                    <option></option>
                    <option value="off">PowerOff</option>
                    <option value="on">PowerOn</option>
                  </select>
               </div>
              </div>
              
              <div className={`form-group row ${this.state.form_data.isRequired ? "" : "d-none"}`}>
                  <label className='col-sm-4 col-form-label' htmlFor="status">Select Day</label>
                  <div className="col-sm-8">
                  <select
                    name="week_day"
                    className="form-control"
                    required={this.state.form_data.isRequired} 
                    defaultValue={this.state.form_data.week_day}
                  >
                    <option></option>
                    {days && days.map((day, index) =>
                      <option value={day} key={index}>{day}</option>
                    )}
                  </select>
               </div>
              </div>
              <div className="form-group row">
                  <label className='col-sm-4 col-form-label' htmlFor="status">Start Time</label>
                  <div className="col-sm-3">
                    <select
                      name="start_hour"
                      className="form-control"
                      required
                      defaultValue={this.state.form_data.start_hour}
                    >
                      <option></option>
                      {hours && hours.map((hr, index) =>
                      <option value={hr} key={index}>{hr}</option>
                      )}
                    </select>hr
                  </div>
                  <div className="col-sm-3">
                    <select
                      name="start_min"
                      className="form-control"
                      required
                      defaultValue={this.state.form_data.start_min}
                    >
                      <option></option>
                      {mns && mns.map((mn, index) =>
                      <option value={mn} key={index}>{mn}</option>
                      )}
                    </select>min
                  </div>
                  <div className="col-sm-2">
                  <strong>{this.state.form_data.start_time}</strong>
                  </div>
                  
              </div>
              <div className="form-group row">
                  <label className='col-sm-4 col-form-label' htmlFor="status">End Time After</label>
                  <div className="col-sm-3">
                    <select
                      name="after_hr"
                      className="form-control"
                      required
                      defaultValue={this.state.form_data.after_hr}
                    >
                      <option></option>
                      {hours2 && hours2.map((hr, index) =>
                      <option value={hr} key={index}>{hr}</option>
                      )}
                    </select>hr
                  </div>
                  <div className="col-sm-3">
                    <select
                      name="after_min"
                      className="form-control"
                      required
                      defaultValue={this.state.form_data.after_min}
                    >
                      <option></option>
                      {mns && mns.map((mn, index) =>
                      <option value={mn} key={index}>{mn}</option>
                      )}
                    </select>min
                  </div>
                  <div className="col-sm-2">
                    <strong>{this.state.form_data.end_time}</strong>
                  </div>
              </div>
              <div className="form-group row">
                  <label className='col-sm-4 col-form-label' htmlFor="status">Select Status</label>
                  <div className="col-sm-8">
                  <select
                    name="status"
                    className="form-control"
                    required
                    defaultValue={this.state.form_data.status}
                  >
                    <option></option>
                    <option value="1">Active</option>
                    <option value="0">InActive</option>
                  </select>
               </div>
              </div>
              <div className="form-group row">
                <label className='col-sm-4 col-form-label'>&nbsp;</label>
                <div className="col-sm-8">
                <input type="hidden" name="client_id" value={this.state.clientid} />
                <input type="hidden" name="vdc_id" value={this.props.match.params.id} />
                  <button className="btn btn-success">Update</button>
                </div>
              </div>
            </form>
          </div>
          </div>
        </Modal>
        <Modal
          isOpen={this.state.modalIsOpen}  
          onRequestClose={this.closeModal}
          contentLabel="VM Logs Modal"  className="metrics">
          <h2 style={{color:'red'}}>
            VM Scheduler <a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
          </h2>
          <div className="table-responsive">
            <table className="table table-bordered table-hover" id="vmlogs">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Method</th>
                  <th>URL</th>
                  <th>Request IP</th>
                  <th>Request</th>
                  <th>Response</th>
                  <th>Request Time</th>
                </tr>
              </thead>
              <tbody>
                {vmlogs && vmlogs.map((lgData, index) =>
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{lgData.method} </td>
                    <td>{lgData.url} </td>
                    <td>{lgData.request_ip} </td>
                    <td>{lgData.request} </td>
                    <td>{lgData.response} </td>
                    <td>{lgData.request_time} </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>
        <Modal
          isOpen={this.state.modalIsVmDetailOpen}    
          onRequestClose={this.closeVmDetailModal}
          contentLabel="VM Details Modal"  className="metrics">
          <h2 style={{color:'red'}}>
            VM Details <a className="float-right" href="javascript:void(0);" onClick={this.closeVmDetailModal}><i className="fa fa-times" /></a>
          </h2>
          <div className="table-responsive">
          {vm_data && 
            <table className="table table-bordered table-hover" id="vm_detail">
              <tbody>
                  <tr>
                    <th>VM Name:</th><td>{vm_data.name}</td>
                    <th>Vcenter VM ID:</th><td>{vm_data.vcenter_vm_id}</td>
                    <th>VM UUID:</th><td>{vm_data.vcenter_uuid}</td>
                    <th>Host Name:</th><td>{vm_data.host_name}</td>
                  </tr>
                  <tr>
                    <th>VM IP:</th><td>{vm_data.ip_address}</td>
                    <th>CPU/RAM/HDD</th><td>{vm_data.cpu_count+'Core /'+vm_data.ram+'MB /'+vm_data.hdd+'GB'}</td>
                    <th>Power Status</th><td>{vm_data.status}</td>
                    <th>OS Name:</th><td>{vm_data.os}</td>
                  </tr>
                  <tr>
                    <th>OS Template:</th><td>{vm_data.template}</td>
                    <th>VM Host:</th><td>{vm_data.vm_host}</td>
                    <th>VM Datastore:</th><td>{vm_data.datastore}</td>
                    <th>Network Name:</th><td>{vm_data.network_name}</td>
                  </tr>
                  <tr>
                    <th>VMWare Tool:</th><td>{vm_data.vmware_tool}</td>
                    <th>VM Sync Date:</th><td>{vm_data.date_added !='0000-00-00 00:00:00' && <Moment format="YYYY-MM-DD hh:mm A">{vm_data.date_added}</Moment>}</td>
                    <th>VM Deletion Date:</th><td>{vm_data.deleted_date !='0000-00-00 00:00:00' && <Moment format="YYYY-MM-DD hh:mm A">{vm_data.deleted_date}</Moment>}</td>
                    <th>Creation Date</th><td>{vm_data.creation_date !='0000-00-00 00:00:00' && <Moment format="YYYY-MM-DD hh:mm A">{vm_data.creation_date}</Moment>}</td>
                  </tr>
                  <tr>
                    <th colSpan="8" style={{color:'red'}}>Backup Details</th>
                  </tr>
                  <tr id="backupjob">
                    <td colSpan="8" style={{padding:'0px'}}>
                      <table><tbody>
                        <tr>
                          <th>SL No</th>
                          <th>Job Name</th>
                          <th>Job Id</th>
                          <th>Backup Server</th>
                          <th>Creation Date</th>
                          <th>Created By / Modified By</th>
                          <th>Restore_Points_Date</th>
                          <th>Job Description</th>
                        </tr>
                        {vm_data.jobData && vm_data.jobData.map((job, index) =>
                          <tr key={index}>
                            <td>{index+1}</td>
                            <td>{job.name}</td>
                            <td>{job.job_id}</td>
                            <td>{job.ip_address}</td>
                            <td>{job.creation_date !='' && <Moment format="YYYY-MM-DD HH:mm">{job.creation_date}</Moment>}</td>
                            <td>{job.created_by}<br/>{job.modified_by}</td>
                            <td><ul style={{padding:'0 10px',listStyleType:'decimal'}}>
                            {vm_data.jobData[index].restorePoints && vm_data.jobData[index].restorePoints.map((point, ind) =>
                              <li key={ind}>{point.vm_restore_point_date!='' && <Moment format="YYYY-MM-DD HH:mm">{point.vm_restore_point_date}</Moment>}</li>
                            )}
                            </ul></td>
                            <td><ul style={{padding:'0 10px',listStyleType:'decimal'}}>
                              <li><b>Schedule Status:</b> {(job.schedule_enabled)?'Yes':'No'}</li>
                              <li><b>Latest Recovery Point:</b> {vm_data.jobData[index].restorePoints.vm_restore_point_date!='' && <Moment format="YYYY-MM-DD HH:mm">{vm_data.jobData[index].restorePoints.vm_restore_point_date}</Moment>}</li>
                              <li><b>Total Size:</b> {(job.veeamData.total_size_gb/(1024*1024*1024)).toFixed(3)} GB</li>
                              <li><b>Backup Size:</b> {(job.veeamData.backup_size_mb/(1024*1024*1024)).toFixed(3)} GB</li>
                              <li><b>Data Read:</b> {(job.veeamData.data_read_mb/(1024)).toFixed(3)} KB</li>
                              <li><b>Transferred Size:</b> {(job.veeamData.transferred_mb/(1024)).toFixed(3)} KB</li>
                              <li><b>Job State:</b> {(job.veeamData.state=='-1')?'Completed':''}{(job.veeamData.state=='5')?'Running':''}</li>
                              <li><b>Backup Status:</b> {(job.veeamData.progress<100 && job.veeamData.progress!='')?progress +" % Completed":''}
                              {(job.veeamData.progress=='')?'Starting':''}{(job.veeamData.progress=='100')?'Completed':''}
                              </li>
                            </ul></td>
                          </tr>
                        )}
                        </tbody>
                      </table>
                    </td>
                  </tr>
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
  const { scheduler, logData,vm_data, diskInfo,ostemplates } = state;
  const vdc_locations = state.common.data;
  const network_list = state.NetworkMgmt.data;
  return {
    scheduler,
    logData,
    vm_data,
    diskInfo,
    vdc_locations,
    ostemplates,
    network_list
  };
}

const connectedVms = connect(mapStateToProps)(Vms);
export { connectedVms as Vms };