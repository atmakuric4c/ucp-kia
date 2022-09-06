import React from 'react';
import { connect } from 'react-redux';
import { vmlistActions } from './vmlist.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import Moment from 'react-moment';
import PageLoader from '../PageLoader';
import { MDBDataTable } from 'mdbreact';
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri, encryptRequest } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';

Modal.setAppElement("#app");
class Vmlist extends React.Component {
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
      data: "",
      isVMTabActive: true
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
    if(window.location.href.indexOf("flag") > -1){
      this.callActiveTab(false);
    }
    else{
      this.callActiveTab(true);
    }
    
    //this.props.dispatch(vmlistActions.getAll(this.state.clientid));
    
    
    //this.getAllPhysicalServers(encryptRequest({"clientid":this.state.clientid,"type":"all"}));
  }

  getAllVirtualMachines(){
    const requestOptions = {
      method: 'GET',
      headers: authHeader()
    };

    //return fetch(`${config.apiUrl}/secureApi/vmlist/listdata/`+ucpEncryptForUri(this.state.clientid), requestOptions).then(this.handleVmSuccess)
    return fetch(`${config.apiUrl}/secureApi/vmlist/listdata/`+btoa(this.state.clientid), requestOptions).then(this.handleVmSuccess)
    .catch((error) => {
      toast.error("Internal server error, Please try again");
      this.loadVmList([]);
    });
  }
  
  handleVmSuccess = (response) => {
    return response.text().then(text => {
      let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

      if(!data){
        data = []
      }
      else{
        data = (data.data ? data.data : data);
      }

      this.loadVmList(data);
    });
  }

  getAllPhysicalServers() {
      const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: encryptRequest({"clientid":this.state.clientid,"type":"all"})
      };

      return fetch(`${config.apiUrl}/secureApi/vmlist/physicalVmListData`, requestOptions).then(this.handleVmSuccess).catch((error) => {
        toast.error("Internal server error, Please try again");
        this.loadVmList([]);
      });
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

  loadVmList = (values) => {
    let rows = [];
//debugger;
    for(let index = 0; index < values.length; index++){
      let vmData = values[index];
      
      rows.push({
        sno: index + 1,
        label_name: (this.state.isVMTabActive ? (
          <a className="badge adge-sm cursor" href={`/#/vmdetail/${btoa(vmData.id)}`} >{vmData.label_name}</a>
        ) : 
          <a className="badge adge-sm cursor" href={`/#/physicalServerDetails/${ucpEncryptForUri(vmData.id)}`} >{vmData.label_name}</a>
        ),
        search_label_name: vmData.label_name,
        location: vmData.location,
        copy_type: <div className="text-center">{vmData.copy_type}</div>,
        primary_ip: <div className="text-center">{vmData.primary_ip}</div>,
        cpu_units: <div className="text-center">{this.state.isVMTabActive ? vmData.cpu_units : vmData.cpus}</div>,
        ram_units_gb: <div className="text-center">{this.state.isVMTabActive ? vmData.ram_units_gb : vmData.ram_gb}</div>,
        disk_units_gb: <div className="text-center">{ this.state.isVMTabActive ? vmData.disk_units_gb : vmData.disk_gb}</div>,
        createddate: vmData.createddate !='0' && <Moment format="YYYY-MM-DD hh:mm A">{new Date(vmData.createddate*1000)}</Moment>,
        vm_status: (vmData.vm_status!=''?vmData.vm_status:'Not Available'),
        vm_details: (this.state.isVMTabActive ? (
          <div className="text-center"><a className="badge adge-md badge-primary btn-blue" href={`/#/vmdetail/${btoa(vmData.id)}`}>VM Detail</a></div>
        ) : (
          <div className="text-center"><a className="badge adge-md badge-primary btn-blue" href={`/#/physicalServerDetails/${ucpEncryptForUri(vmData.id)}`}>View Detail</a></div>
        )),
        os_type: vmData.os_type
      });
    }

    let vmColums = [
      {
          label: 'S.No',
          field: 'sno',
      },
      {
          label: 'VM Name',
          field: 'label_name',
      },
      {
          label: 'Location',
          field: 'location'
      },
      {
          label: 'Cloud Type',
          field: 'copy_type'
      },
      {
          label: 'IP Address',
          field: 'primary_ip'
      },
      {
          label: 'CPU Core',
          field: 'cpu_units'
      },
      {
          label: 'RAM (in GB)',
          field: 'ram_units_gb'
      },
      {
          label: 'HDD (in GB)',
          field: 'disk_units_gb'
      },
      {
          label: 'Creation Date',
          field: 'createddate'
      },
      {
          label: 'Status',
          field: 'vm_status'
      },
      {
          label: 'Action',
          field: 'vm_details'
      }
    ];

    let physicalServersColumns = [
      {
          label: 'S.No',
          field: 'sno',
      },
      {
          label: 'Name',
          field: 'label_name',
      },
      {
          label: 'OS Type',
          field: 'os_type'
      },
      {
          label: 'IP Address',
          field: 'primary_ip'
      },
      {
          label: 'CPU Core',
          field: 'cpu_units'
      },
      {
          label: 'RAM (in GB)',
          field: 'ram_units_gb'
      },
      {
          label: 'HDD (in GB)',
          field: 'disk_units_gb'
      },
      {
          label: 'Creation Date',
          field: 'createddate'
      },
      {
          label: 'Action',
          field: 'vm_details'
      }
    ];

    let data = {
      columns: this.state.isVMTabActive ? vmColums : physicalServersColumns,
      rows: rows
    }

    /*if(rows && rows.length > 0){*/
      this.setState({
        data: data,
        loading: false
      });
    //}
  }

  callActiveTab= (flag) => {
    this.setState({
      isVMTabActive: flag,
      loading: true
    });

    setTimeout(() => {
      if(flag){
        this.getAllVirtualMachines();
      }
      else{
        this.getAllPhysicalServers();
      }
    }, 100);   
  }
  
  render() { 
    const { vmlist} = this.props;
    let vmlogs = this.props.vmlist.logData;
    let vm_data=this.props.vmlist.vm_data;
    let vmdiskInfo = this.props.vmlist.diskInfo;                                         
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">Manage Cloud4C VMs</h5>
          <div className="main-tab mb-4">
              <div className="tabs-wrapper">
                  <button onClick={() => this.callActiveTab(true)} className={"btn btn-sm tab-wrapper " + (this.state.isVMTabActive && "active-tab")}> Virtual Machines</button>
                  <button onClick={() => this.callActiveTab(false)} className={"btn btn-sm tab-wrapper " + (!this.state.isVMTabActive && "active-tab")}> Physcial Servers</button>
              </div>
              <br/>
              <div className="mb-12">
              <a style={{"marginRight":"15px"}} className="btn btn-sm btn-primary float-right" target="_blank" href={`${config.apiUrl}/download/all_vm_reports/${btoa(this.state.clientid)}/${btoa(this.state.isVMTabActive)}`}><i className="fas fa-download mr-1"></i>VM Report</a>
              </div>
              <br/>
              <br/>
              {this.state.loading && <div className="m-4"> <PageLoader/></div>}
              {/*vmlist.error && <span className="text-danger">ERROR: {vmlist.error}</span>*/}
              {!this.state.loading &&
              <React.Fragment>
                <React.Fragment>
                  {this.state.data &&
                    <div className="pt-3 pr-3 pl-3 pb-0">
                      <MDBDataTable
                      striped
                      hover
                      data={this.state.data}
                      />
                    </div>
                  }
                </React.Fragment>
                {/*!vmlist.items || vmlist.items.length == 0 &&
                <span className="star-mark">No Record found</span>
                */}
              </React.Fragment>
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
    </div>
    );
  }
}

function mapStateToProps(state) {
  const { vmlist, logData,vm_data, diskInfo } = state;
  return {
    vmlist,
    logData,
    vm_data,
    diskInfo
  };
}

const connectedVmlist = connect(mapStateToProps)(Vmlist);
export { connectedVmlist as Vmlist };