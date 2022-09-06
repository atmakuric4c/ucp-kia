import React from 'react';
import { connect } from 'react-redux';
import { awsActions } from './aws.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import Moment from 'react-moment';
import PageLoader from '../PageLoader';
import { MDBDataTable } from 'mdbreact';

Modal.setAppElement("#app");
class AwsVmlist extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    
    this.state = {
      clientid: user.data.clientid,
      user_role: user.data.user_role,
      aws: [],
      vm_data:[],
      logData: [],
      sweetalert: null,
      modalIsOpen: false,
      action: null,
      loading:true,
      isAwsListLoaded: false,      
      data: {
        columns: [
        {
            label: 'S.No',
            field: 'slno'
        },
        {
            label: 'VM Name',
            field: 'name'
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
          label: 'Status',
          field: 'vm_status'
        },
        {
          label: 'Action',
          field: 'action'
        }
      ],
      rows: []
      }
    };
    this.intervalConter = null;
    this.loaderImage=this.loaderImage.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  loadAwsVms = () => {
    if(!this.state.isAwsListLoaded){
      let values=[];

      let aws = this.props.aws;

      if(aws.items && aws.items.length > 0){
        aws.items.map((val, index) =>{
            values[index]={
                slno:(index+1),
                name : <a className="badge adge-sm cursor" href={`/#/awsvmdetail/${btoa(val.id)}`} >{val.host_name} {val.label_name}</a>,
                backup_name: val.label_name,
                copy_type:val.copy_type,
                primary_ip:val.primary_ip,
                cpu_units: val.cpu_units,
                ram_units_gb: val.ram_units_gb,
                disk_units_gb: val.disk_units_gb,
                vm_status: (val.vm_status!=''?val.vm_status:'Not Available'),
                action: <a className="badge adge-md badge-primary btn-blue" href={`/#/awsvmdetail/${btoa(val.id)}`}>VM Detail</a>
            }
        });
      }

      let data = this.state.data;

      data.rows = values;

      this.setState({
        data: data,
        isAwsListLoaded: true
      });
    }
  }

  loaderImage(){
    this.props.dispatch(awsActions.getAll(this.state.clientid));
  }
  
  openModal() {      
    this.setState({ modalIsOpen: true });
  }

  closeModal() {
    this.setState({ modalIsOpen: false });
    window.location.reload();         
  }
  
  componentDidMount() {
    this.props.dispatch(awsActions.getAll(this.state.clientid));
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
    this.props.dispatch(awsActions.vmOperations(postParams));
    //this.props.dispatch(awsActions.getAll());
  }
  vmLogs(vmid) {
    this.props.dispatch(awsActions.vmLogs(vmid));
    //this.setState({ modalIsOpen: true });
    this.openModal();
  }

  vmDiskInfo(vmData) {
    this.props.dispatch(awsActions.getDiskDetails(vmData.id));
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
    this.props.dispatch(awsActions.vmAddDisk(formData));
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
    this.props.dispatch(awsActions.vmDeleteDisk(delDiskInfo));
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
    const { aws} = this.props;
    
    let vmlogs = this.props.aws.logData;
    let vm_data=this.props.aws.vm_data;
    let vmdiskInfo = this.props.aws.diskInfo;                                         
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 class="color mb-4">Manage Aws VMs</h5>
         
          {aws.loading && !aws.error && <PageLoader/>}
          {aws.error && <span className="text-danger">ERROR: {aws.error}</span>}
          {aws.items && !aws.loading &&
            <React.Fragment>
              { !this.state.isAwsListLoaded && this.loadAwsVms()}
              <div>
                <MDBDataTable
                  striped
                  hover
                  data={this.state.data}
                  />
                {this.state.sweetalert}
              </div>
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

    );
  }
}

function mapStateToProps(state) {
  const { aws, logData,vm_data, diskInfo } = state;
  return {
    aws,
    logData,
    vm_data,
    diskInfo
  };
}

const connectedVmlist = connect(mapStateToProps)(AwsVmlist);
export { connectedVmlist as AwsVmlist };