import React from 'react';
import { connect } from 'react-redux';
import { vmreportsActions } from './vmreports.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
import Modal from "react-modal";
import axios from 'axios';
import DatePicker from "react-datepicker";
import config from 'config';
import PageLoader from '../PageLoader';
const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");
class VmReport extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_role: user.data.user_role,
      action: null,
      loading:true
    };
  }
    
  componentDidMount() {
    this.props.dispatch(vmreportsActions.getAllVmlist());
  }
  getAllVmReport() {  
    this.props.dispatch(vmreportsActions.generateReport());      
  }
  render() { 
    const { vmReports, generateReport } = this.props;                       
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h2>VMs Reports</h2>
          <span className='float-right'>
          {!generateReport.isDownload && <a href="javascript:void(0);" className='btn btn-sm btn-info' onClick={() => this.getAllVmReport()} >Generate Report</a>}
          {generateReport.isDownload && <a href={`${config.apiUrl}/download/reports?file=vmlistreports.xlsx`} download className='btn btn-sm btn-info' >Download</a>}
          </span>
          {vmReports.loading && !vmReports.error && <PageLoader/>}
          {vmReports.error && <span className="text-danger">ERROR: {vmReports.error}</span>}
          {vmReports.items && !vmReports.loading &&
            <div className="tableresp table-responsive">
              <table className="table table-bordered table-hover" id="vmlist">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>VM Name</th>
                    <th>IP Address</th>
                    <th>CPU</th>
                    <th>RAM</th>
                    <th>HDD</th>
                    <th>OS</th>
                    <th>OS Type</th>
                    <th>VMWare Tool</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vmReports.items.map((vmData, index) =>
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{vmData.name} </td>
                      <td>{vmData.ip_address} </td>
                      <td>{vmData.cpu_count} </td>
                      <td>{(vmData.ram) / 1024} GB </td>
                      <td>{vmData.hdd} GB </td>
                      <td>{vmData.os} </td>
                      <td>{vmData.os_type} </td>
                      <td>{vmData.vmware_tool} </td>
                      <td>{vmData.action_status=='InProgress'?'InProgress':vmData.status} </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {this.state.sweetalert}
            </div>
          }
        </div>

      </div>

    );
  }
}

function mapStateToProps(state) {
  console.log(state);
  const { vmReports ,generateReport} = state;
  return {
    vmReports,generateReport
  };
}

const connectedVmReport = connect(mapStateToProps)(VmReport);
export { connectedVmReport as VmReport };