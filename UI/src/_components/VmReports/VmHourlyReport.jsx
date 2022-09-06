import React from 'react';
import { connect } from 'react-redux';
import { vmreportsActions } from './vmreports.actions';
import Modal from "react-modal";
import Moment from 'react-moment';
//import DatePicker from "react-datepicker";
import Datetime from 'react-datetime';
import config from 'config';
var serialize = require("form-serialize");
const customStyles = {
  content: {
     minHeight:'420px',
     border:'2px solid cadetblue'
  }
};
Modal.setAppElement("#app");

class VmHourlyReport extends React.Component {
  constructor(props) {
    super(props); 
    let user = JSON.parse(localStorage.getItem("user"));   
    this.state = {
        clientid:   user.data.clientid,
        user_role:  user.data.user_role,
        modalIsOpen:false,
        start_time: new Date(),
        end_time: new Date(),
        vm_id:0
    }; 
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.handleChangeStartTime = this.handleChangeStartTime.bind(this);
    this.handleChangeEndTime = this.handleChangeEndTime.bind(this);
  }
  handleChangeStartTime(date) {
    this.setState({
      start_time: date
    });
  }
  handleChangeEndTime(date) {
    this.setState({
      end_time: date
    });
  }
  openModal(mon) {   
    this.props.dispatch(vmreportsActions.clearReportBtn());   
    this.setState({ start_time: new Date() });
    this.setState({ end_time: new Date() });
    this.props.dispatch(vmreportsActions.getVmHourlyHistory({})); 
    this.setState({ modalIsOpen: true });
    this.setState({ vm_id: mon.vm_id });
  }
  closeModal() {
    this.props.dispatch(vmreportsActions.clearReportBtn());
    this.setState({ modalIsOpen: false });
    this.setState({ vm_id: 0 });
    this.setState({ start_time: new Date() });
    this.setState({ end_time: new Date() });
    this.props.dispatch(vmreportsActions.getVmHourlyHistory({}));         
  }
  showVmHourlyHistoryReport = e => {
    e.preventDefault();      
    var form = document.querySelector("#vmHourlyHistoryReport");
    var formData = serialize(form, { hash: true });
    formData = Object.assign(formData, {start_time:Math.round(new Date(this.state.start_time).getTime()/1000),end_time:Math.round(new Date(this.state.end_time).getTime()/1000)});
    console.log(formData);
    this.props.dispatch(vmreportsActions.clearReportBtn());
    this.props.dispatch(vmreportsActions.getVmHourlyHistory(formData));
  };
  generateVmHourlyHistoryReport() {
    var form = document.querySelector("#vmHourlyHistoryReport");
    var formData = serialize(form, { hash: true });
    formData = Object.assign(formData, {start_time:Math.round(new Date(this.state.start_time).getTime()/1000),end_time:Math.round(new Date(this.state.end_time).getTime()/1000)});
    console.log(formData);
    this.props.dispatch(vmreportsActions.generateVmHourlyReport(formData));
  };
  afterOpenModal() {       
    //this.subtitle.style.color = "#f00";
  }

  componentDidMount() {
      this.props.dispatch(vmreportsActions.getHourlyReports());    
  }
    
    render() {
        const { vmHourlyReports,vmHourlyHistoryReports,generateVmHourlyReport } = this.props;                               
        return (
          <div className="container-fluid main-body">
          <div className="contentarea">
            <h2>VM Hourly Reports</h2>
            
            {this.state.user_role == 1 &&
            <div className="text-right">
            </div>
            }
                  {vmHourlyReports.items &&  (  
                      <div className="table-responsive">
                      <table className="table table-bordered table-hover" >
                        <thead> 
                          <tr>
                            <th>SL No</th>
                            <th>VM Name</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Memory (In MB)</th>
                            <th>CPU Core</th>
                            <th>Hard Disk (In GB)</th>
                            <th>Power Status</th>
                            <th>Created Date</th>                                             
                            <th>Actions</th>                                             
                          </tr>
                        </thead>
                        <tbody> 
                      {vmHourlyReports.items.map((mon, index) =>
                          <tr key={index}>
                          <td>{index+1}</td>
                          <td>{mon.name}</td>
                          <td><Moment format="YYYY-MM-DD HH:mm:ss">{new Date(mon.starttime*1000)}</Moment></td>                    
                          <td><Moment format="YYYY-MM-DD HH:mm:ss">{new Date(mon.endtime*1000)}</Moment></td>                    
                          <td>{mon.memory}</td>                    
                          <td>{mon.cpu_core}</td>                    
                          <td>{mon.harddisk}</td>                    
                          <td>{mon.power_status?'On':'Off'}</td>                    
                          <td><Moment format="YYYY-MM-DD HH:mm:ss">{new Date(mon.createddate*1000)}</Moment></td>                 
                          <td><a href="javascript:void(0);" onClick={() => this.openModal(mon)} className='btn btn-sm btn-info'>History</a></td>
                        </tr>                             
                      )}
                  </tbody>
                  </table>
                  </div>
                )}
        </div>  
        
        <Modal className="metrics" style={customStyles}
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}       
          onRequestClose={this.closeModal}
          contentLabel="VM Hourly History" >
          <h2 style={{color:'red'}}>
            VM Hourly History<a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
          </h2>
          <span className='float-right'>
          {!generateVmHourlyReport.isDownload && <a href="javascript:void(0);" className='btn btn-sm btn-info' onClick={() => this.generateVmHourlyHistoryReport()} >Generate Report</a>}
          {generateVmHourlyReport.isDownload  && <a href={`${config.apiUrl}/download/reports?file=vmhourlyreport.xlsx`} download className='btn btn-sm btn-info' >Download</a>}
          </span>
                <form
                  name="vmHourlyHistoryReport"
                  id="vmHourlyHistoryReport"
                  method="post"
                  onSubmit={this.showVmHourlyHistoryReport}
                >
                  <div className="row">
                    <div className="form-group col-sm-4">
                      <label htmlFor="from_date">From Date</label>
                      <Datetime
                        value={this.state.start_time}
                        onChange={this.handleChangeStartTime}
                    />
                    </div>
                    <div className="form-group col-sm-4">
                      <label htmlFor="to_date">To Date</label>
                      <Datetime
                        value={this.state.end_time}
                        onChange={this.handleChangeEndTime}
                    />
                    </div>
                    <div className="form-group col-sm-4">
                      <label>&nbsp;</label>
                      <input type="hidden" name="vm_id" value={this.state.vm_id} />
                      <button className="btn btn-success ">Submit</button>
                    </div>
                  </div>
                </form>

            {vmHourlyHistoryReports.items &&  (  
               <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                      <thead> 
                        <tr>
                        <th>SL No</th>
                        <th>VM Name</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Memory (In MB)</th>
                        <th>CPU Core</th>
                        <th>Hard Disk (In GB)</th>
                        <th>Power Status</th>
                        <th>Created Date</th>                                                                                   
                      </tr>
                    </thead>
                    <tbody> 
                  {vmHourlyHistoryReports.items.map((mon, index) =>
                      <tr key={index}>
                      <td>{index+1}</td>
                      <td>{mon.name}</td>
                      <td><Moment format="YYYY-MM-DD HH:mm:ss">{new Date(mon.starttime*1000)}</Moment></td>                    
                      <td><Moment format="YYYY-MM-DD HH:mm:ss">{new Date(mon.endtime*1000)}</Moment></td>                    
                      <td>{mon.memory}</td>                    
                      <td>{mon.cpu_core}</td>                    
                      <td>{mon.harddisk}</td>                    
                      <td>{mon.power_status?'On':'Off'}</td>                    
                      <td><Moment format="YYYY-MM-DD HH:mm:ss">{new Date(mon.createddate*1000)}</Moment></td>                 
                    </tr>                             
                  )}
              </tbody>
              </table>
              </div>
            )}
        </Modal>
        </div> 
        );
    }
}

function mapStateToProps(state) {   
    const { vmHourlyReports,vmHourlyHistoryReports,generateVmHourlyReport } = state;      
    return {
      vmHourlyReports,vmHourlyHistoryReports,generateVmHourlyReport
    };
}

const connectedVmHourlyReport = connect(mapStateToProps)(VmHourlyReport);
export { connectedVmHourlyReport as VmHourlyReport };