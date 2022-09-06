import React from 'react';
import { connect } from 'react-redux';
import { vmlistActions } from './vmlist.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import Moment from 'react-moment';
import PageLoader from '../PageLoader';

Modal.setAppElement("#app");
class CitrixVmDetail extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_role: user.data.user_role,
      citrix: [],
      vm_data:[],
      logData: [],
      jobdata:[],
      sweetalert: true,
      modalIsOpen: false,
      modalVmHistory: false,
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
  openVmHistory(vm_data) {      
    this.setState({ modalVmHistory: true });
    this.setState({ vmDetails: vm_data });
    var params={clientid:vm_data.clientid,vmid:vm_data.id}
    this.props.dispatch(vmlistActions.vmLogs(params));
  }

  modalCloseVm() {
    this.setState({ modalVmHistory: false });
    this.props.dispatch(vmlistActions.vmDetail(btoa(this.state.clientid),this.props.match.params.id));
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
    this.props.dispatch(vmlistActions.vmDetail(btoa(this.state.clientid),this.props.match.params.id));
    //this.props.dispatch(vmlistActions.backupDetail(btoa(this.state.clientid),this.props.match.params.id));
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
    const postParams = { "ref_id": btoa(vmData.ref_id), "action": action,vm_id:btoa(vmData.id),clientid:btoa(this.state.clientid) };
    this.props.dispatch(vmlistActions.vmOperations(postParams));
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
            <select className="form-control form-control-sm" name="memory" defaultValue={(vmData.ram_units_gb)}>
              <option value="1">1 GB</option>
              <option value="2">2 GB</option>
              <option value="4">4 GB</option>
              <option value="8">8 GB</option>
              <option value="16">16 GB</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="cpu_count">CPU</label>
            <select className="form-control form-control-sm" name="cpu" defaultValue={(vmData.cpu_units)}>
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
            <input type="hidden" value={vmData.id} name="vm_id" />
            <input type="hidden" value={vmData.ref_id} name="ref_id" />
            <input type="hidden" value={vmData.clientid} name="user_id" />
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
  veeamAction(vmData,job_id,action){
    this.setState({
      vmDetails: vmData,
      job_id: job_id,
      action:action
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
    let job_id = this.state.job_id;
    let action = this.state.action;
    const postParams = { "ref_id": btoa(vmData.ref_id),"action":action, "job_id": job_id,vm_id:btoa(vmData.id),clientid:btoa(this.state.clientid) };
    this.props.dispatch(vmlistActions.veeamOperations(postParams));
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
    const { citrix} = this.props;
    let loading=this.props.citrix.loading;                                      
    let vm_data=this.props.citrix.vm_data;  
    let logData=this.props.citrix.logData;  
                 
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color"><img src="/src/img/citrix_img.png" width="50px" className="mr-2" />VM Details</h5>
          {loading && <PageLoader/>}
          {vm_data &&  <div className="row vm-details">
            <div className="col-md-12 p-0 vm-details-row mt-3">
              <div className="col-md-12">
              {(vm_data.vm.vm_status == "poweredOn" || vm_data.vm.vm_status == "Running") ?
                <span className="alert info-box-danger mr-2 cursor-pointer" onClick={() => this.vmAction(vm_data.vm,'stop','Power Off')}><span className="fas fa-power-off mr-2"></span>Power Off</span>
                :<span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.vmAction(vm_data.vm,'start','Power On')}><span className="fa fa-play mr-2"></span>Power On</span>}
                <span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.vmAction(vm_data.vm,'restart','Reboot')}><span className="fas fa-sync-alt mr-2"></span>Reboot</span>
                <span className="alert info-box-danger mr-2 cursor-pointer" onClick={() => this.vmAction(vm_data.vm,'delete','Terminate')}><span className="fa fa-times mr-2"></span>Terminate</span>
                <span className="alert info-box-blue mr-2 cursor-pointer" onClick={() => this.vmResizeForm(vm_data.vm)}><span className="fa fa-expand mr-2"></span>Resize</span>
                <span className="alert info-box-blue mr-2 cursor-pointer" onClick={() => this.openVmHistory(vm_data.vm)}><span className="fa fa-history mr-2"></span>History</span>
              </div>
            </div>
            <div className="col-md-12 p-0 vm-details-row mt-4">
              <div className="col-md-6 float-left">
                <div className="col-md-3 float-left p-0"><h6>VM Name : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.label_name}</div>
              </div>
              <div className="col-md-6 float-right">
                <div className="col-md-3 float-left p-0"><h6>VM Status : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.vm_status}</div>
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
            <div className="col-md-12 p-0 vm-details-row">
              <div className="col-md-6 float-left">
                <div className="col-md-3 float-left p-0"><h6>Disk Size(GB) : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.disk_units_gb}</div>
              </div>
              <div className="col-md-6 float-right">
                <div className="col-md-3 float-left p-0"><h6>OS Template : </h6></div>
                <div className="col-md-9 float-right p-0">{vm_data.vm.os_template_name}</div>
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
            {vm_data.jobdata && vm_data.vm.copy_type == '3C' && <div>
              <h5 className="color float-left mt-4 mb-2">Backup Job Details</h5>
              {/* <a className="btn btn-primary cursorpointer2 btn-sm float-right mt-4 mb-2" 
              onClick={() => this.veeamAction(vm_data.vm,0,'create')}><i className="fa fa-plus"></i>&nbsp;<span>Create Job</span>
              </a> */}
              <table className="table table-bordered table-striped table-dark table-custom table-hover">
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Job Name</th>
                  <th>Job Type</th>
                  <th>Job Mode</th>
                  {/* <th>Actions</th> */}
                </tr>
              </thead>
              <tbody>
              {vm_data.jobdata.map((job,index)=>
              <tr key={index+1}>
                <td>{index+1}</td>
                <td>{job.cx_job_name}</td>
                <td>{job.cx_type}</td>
                <td>{job.cx_mode}</td>
                {/* <td><a className="btn btn-danger cursorpointer btn-sm" 
                  onClick={() => this.veeamAction(vm_data.vm,job.cx_job_id,'delete')}><span>Delete</span>
                  </a>
                </td> */}
                </tr>
              )}
              </tbody>
              </table>
            </div>
            }
            <br/>
          </div>}
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
  const { citrix,vm_data,logData } = state;
  return {
    citrix,
    vm_data,
    logData
  };
}

const connectedVmlist = connect(mapStateToProps)(CitrixVmDetail);
export { connectedVmlist as CitrixVmDetail };