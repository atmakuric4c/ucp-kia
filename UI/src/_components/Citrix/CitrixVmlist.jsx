import React from 'react';
import { connect } from 'react-redux';
import { vmlistActions } from './vmlist.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import Moment from 'react-moment';
import PageLoader from '../PageLoader';

Modal.setAppElement("#app");
class CitrixVmlist extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_role: user.data.user_role,
      citrix: [],
      vm_data:[],
      logData: [],
      sweetalert: null,
      modalIsOpen: false,
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

    this.openVmDetailModal = this.openVmDetailModal.bind(this);
    this.closeVmDetailModal = this.closeVmDetailModal.bind(this);
    this.afterOpenVmDetailModal = this.afterOpenVmDetailModal.bind(this);

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
  openVmDetailModal() {      
    this.setState({ modalIsVmDetailOpen: true });
  }

  afterOpenVmDetailModal() {       
    //this.subtitle.style.color = "#f00";
  }

  closeVmDetailModal() {
    this.setState({ modalIsVmDetailOpen: false });
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
    this.props.dispatch(vmlistActions.getAll(this.state.clientid));
    //this.intervalConter = setInterval(this.updateVmList.bind(this), 15000);
  }
  componentWillUnmount(){
    if(this.intervalConter) clearInterval(this.intervalConter);
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
  render() { 
    const { citrix} = this.props;
    let vmlogs = this.props.citrix.logData;
    let vm_data=this.props.citrix.vm_data;
    let vmdiskInfo = this.props.citrix.diskInfo;                                         
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">Manage Citrix VMs</h5>
         
          {!citrix.error && citrix.loading && <PageLoader/>}
          {citrix.error && <span className="text-danger">ERROR - {citrix.error}</span>}
          {citrix.items && !citrix.loading &&
            <div className="tableresp table-responsive" style={{height:'400px'}}>
              <table className="table table-bordered table-striped table-dark table-custom table-hover" id="vmlist">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>VM Name</th>
                    <th>Location</th>
                    <th>Cloud Type</th>
                    <th>IP Address</th>
                    <th>CPU Core</th>
                    <th>RAM (in GB)</th>
                    <th>HDD (in GB)</th>
                    {/*<th>OS Name</th>
                    <th>OS Type</th>
                    <th>VMWare Tool</th>*/}
                    <th>Creation Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {citrix.items!='undefined' && citrix.items.map((vmData, index) =>
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td><a className="badge adge-sm cursor" href={`/#/citrixvmdetail/${btoa(vmData.id)}`} >{vmData.label_name}</a></td>
                      <td>{vmData.location} </td>
                      <td>{vmData.copy_type} </td>
                      <td>{vmData.primary_ip} </td>
                      <td>{vmData.cpu_units} </td>
                      <td>{vmData.ram_units_gb} </td>
                      <td>{vmData.disk_units_gb} </td>
                      {/*<td>{vmData.os} </td>
                      <td>{vmData.os_type} </td>
                      <td>{vmData.vmware_tool} </td>*/}
                      <td>{vmData.createddate !='0' && <Moment format="YYYY-MM-DD hh:mm A">{new Date(vmData.createddate*1000)}</Moment>}</td>
                      <td>{vmData.vm_status!=''?vmData.vm_status:'Not Available'} </td>
                      <td className="text-center"><a className="badge adge-md badge-primary btn-blue" href={`/#/citrixvmdetail/${btoa(vmData.id)}`}>VM Detail</a></td>
                    </tr>
                  )}
                </tbody>
              </table>
              {this.state.sweetalert}
            </div>
           }
         </div>

        <Modal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}       
          onRequestClose={this.closeModal}
          contentLabel="VM Logs Modal"  className="metrics">
          <h2 style={{color:'red'}}>
            VM Logs <a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
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
        
      </div>

    );
  }
}

function mapStateToProps(state) {
  const { citrix, logData,vm_data, diskInfo } = state;
  return {
    citrix,
    logData,
    vm_data,
    diskInfo
  };
}

const connectedVmlist = connect(mapStateToProps)(CitrixVmlist);
export { connectedVmlist as CitrixVmlist };