import React from 'react';
import { connect } from 'react-redux';
import { monitoringActions } from './monitoring.actions';
import Modal from "react-modal";
var serialize = require("form-serialize");
import HostItemsFromZabbix from "./hostItemsFromZabbix";
import HostUsageMetrics from "./HostUsageMetrics";
import HostUptimeReport from "./HostUptimeReport";
import HostUtilizationReport from "./HostUtilizationReport";
import DatePicker from "react-datepicker";
import PageLoader from '../PageLoader';
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri, encryptRequest } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';
import { MDBDataTable } from 'mdbreact';

const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");

class MonitoringDashboard extends React.Component {
  constructor(props) {
    super(props); 
    let user = JSON.parse(localStorage.getItem("user"));    
    this.state = {
        clientid:   user.data.clientid,
        modalIsOpen: false,
        modalIsOpenVMItems: false,
        modalIsOpenUsageMetrics : false,
        modalIsOpenUptimeReport : false,
        modalIsOpenUsageReport : false,
        modalIsOpenUtilizationReport : false,
        isHostItemsLoading: true,
        isUsageMetricsLoading : true,
        isUptimeReportLoading : true,
        isUsageReportLoading: true,
        isUtilizationReportLoading : true,
        uptimeStartDate: new Date(),
        uptimeEndDate: new Date(),
        UtilizationStartDate: new Date(),
        UtilizationEndDate: new Date(),
        usageStartDate: new Date(),
        usageEndDate: new Date(),
        monDetails:[],

        usageReportSelection: "",
        isMonitoringUsageReportLoading: false,
        monitoringUsageReport: [],
        isVmListDataLoaded: false,
        data: "",
        loading: true,
        isVMTabActive: true
    };

    this.handleChangeUptimeStart = this.handleChangeUptimeStart.bind(this);
    this.handleChangeUptimeEnd = this.handleChangeUptimeEnd.bind(this);
    this.handleChangeUsageStart = this.handleChangeUsageStart.bind(this);
    this.handleChangeUsageEnd = this.handleChangeUsageEnd.bind(this);
    this.handleChangeUtilizationStart = this.handleChangeUtilizationStart.bind(this);
    this.handleChangeUtilizationEnd = this.handleChangeUtilizationEnd.bind(this);
    
  }

  handleChangeUptimeStart(date) {
    this.setState({
      uptimeStartDate: date
    });
  }

  handleChangeUsageStart(date) {
    this.setState({
      usageStartDate: date
    });
  }

  handleChangeUptimeEnd(date) {
    this.setState({
      uptimeEndDate: date
    });
  }

  handleChangeUsageEnd(date) {
    this.setState({
      usageEndDate: date
    });
  }

  handleChangeUtilizationStart(date) {
    this.setState({
      utilizationStartDate: date
    });
  }
  handleChangeUtilizationEnd(date) {
    this.setState({
      utilizationEndDate: date
    });
  }

  getAllVirtualMachines(){
      const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt({clientid:this.state.clientid}))
    };
    return fetch(`${config.apiUrl}/secureApi/monitoring/getAllMonitoringVms`, requestOptions).then(this.handleVmSuccess)
    /*.catch((error) => {
      toast.error("Internal server error, Please try again");
      this.loadVmList([]);
    });*/
  }

  getAllPhysicalServers(){
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: encryptRequest({"clientid":this.state.clientid,"type":"monitor"})
    };

    return fetch(`${config.apiUrl}/secureApi/vmlist/physicalVmListData`, requestOptions).then(this.handleVmSuccess)
    /*.catch((error) => {
      toast.error("Internal server error, Please try again");
      this.loadVmList([]);
    });*/
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

  componentDidMount() {
    this.getAllVirtualMachines();

    //this.props.dispatch(monitoringActions.getAllMonitoringVms({clientid:this.state.clientid})));
    //this.getAllMonitoringVms();

      this.openModalVMItems = this.openModalVMItems.bind(this);
      this.afterOpenModalVMItems = this.afterOpenModalVMItems.bind(this);
      this.closeModalVMItems = this.closeModalVMItems.bind(this);

      this.openModalUsageMetrics = this.openModalUsageMetrics.bind(this);
      this.afterOpenModalUsageMetrics = this.afterOpenModalUsageMetrics.bind(this);
      this.closeModalUsageMetrics = this.closeModalUsageMetrics.bind(this);

      this.openModalUptimeReport = this.openModalUptimeReport.bind(this);
      this.afterOpenModalUptimeReport = this.afterOpenModalUptimeReport.bind(this);
      this.closeModalUptimeReport = this.closeModalUptimeReport.bind(this);

      this.openModalUtilizationReport = this.openModalUtilizationReport.bind(this);
      this.afterOpenModalUtilizationReport = this.afterOpenModalUtilizationReport.bind(this);
      this.closeModalUtilizationReport = this.closeModalUtilizationReport.bind(this);

      this.openModalUsageReport = this.openModalUsageReport.bind(this);
      this.afterOpenModalUsageReport = this.afterOpenModalUsageReport.bind(this);
      this.closeModalUsageReport = this.closeModalUsageReport.bind(this);
  }

  openModalVMItems(mon) { 
    this.props.dispatch(monitoringActions.getHostItemsFromZabbix(mon.id));//mon.cloud_host_id
    this.setState({monDetails: mon});
    this.setState({ modalIsOpenVMItems: true });
    this.setState({ isHostItemsLoading: true });
  }

  afterOpenModalVMItems() {       
    this.subtitle.style.color = "#f00";
  }

  closeModalVMItems() {
    this.setState({ modalIsOpenVMItems: false });
  }

  openModalUsageMetrics(mon) { 
    var postdata={
      id: this.state.isVMTabActive ? mon.id : mon.id,
      client_id:mon.clientid
    }
    //this.props.dispatch(monitoringActions.getHostUsageMetrics(mon.id));//mon.id
    this.props.dispatch(monitoringActions.usageMetricFromApi(postdata));
    this.setState({monDetails: mon});
    this.setState({ modalIsOpenUsageMetrics: true });
    this.setState({ isUsageMetricsLoading: true });
  }

  afterOpenModalUsageMetrics() {       
    this.subtitle.style.color = "#f00";
  }

  closeModalUsageMetrics() {
    this.setState({ modalIsOpenUsageMetrics: false });
  }

  openModalUptimeReport(mon) { 
    this.getHostReport(mon.id, "uptimeReport", "monitoringUptimeReport", "monitoringUptimeReportLoading");
    //this.props.dispatch(monitoringActions.getHostUptimeReport(mon.id));//mon.cloud_host_id

    this.setState({monDetails: mon});
    this.setState({ modalIsOpenUptimeReport: true });
    this.setState({ isUptimeReportLoading: true });
  }

  getHostReport(vm_id, api_name, dataset_report, loading){
    this.setState({
      [loading]: true
    });

    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify( {"clientid":this.state.clientid,"vm_id":vm_id,"setup_type":
        this.state.isVMTabActive ? "0" : "1"})
    };
    return fetch(`${config.apiUrl}/secureApi/monitoring/` + api_name, requestOptions).then(response  => this.commonHandleResponse(response, dataset_report, loading))
    /*.catch((error) => {
      toast.error("Internal server error, Please try again");
      this.setState({
        [dataset_report]: [],
        [loading]: false
      })
    });*/
  }
  
  commonHandleResponse(response, stateName, loading) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
          this.setState({
            [stateName]: []
          })
        }
        else{
          this.setState({
            [stateName]: data.response
          })
        }        
        
        this.setState({
          [loading]: false
        });
    });
  }

  afterOpenModalUptimeReport() {       
    this.subtitle.style.color = "#f00";
  }
 
  closeModalUptimeReport() {
    this.setState({ modalIsOpenUptimeReport: false });
  }

  openModalUsageReport(mon) {
    if(mon){
      this.setState({
        usageReportSelection: mon
      });
    }
    else{
      mon = this.state.usageReportSelection;
    }

    this.setState({
      isMonitoringUsageReportLoading: true
    });

    const requestOptions = {
      method: 'GET',
      headers: authHeader()
    };

    fetch(`${config.apiUrl}/secureApi/monitoring/usageReport/`+mon.id, requestOptions).then(response  => this.handleResponse(response));

    this.setState({monDetails: mon});
    this.setState({ modalIsOpenUsageReport: true });
    this.setState({ isUsageReportLoading: true });
  }

  handleResponse(response, stateName) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
          this.setState({
            monitoringUsageReport: []
          })
        }
        else{
          this.setState({
            monitoringUsageReport: data.response
          })
        }        
        
        this.setState({
          isMonitoringUsageReportLoading: false
        });
    });
  }

  afterOpenModalUsageReport() {       
    this.subtitle.style.color = "#f00";
  }

  closeModalUsageReport() {
    this.setState({ modalIsOpenUsageReport: false });
  }
  
  openModalUtilizationReport(mon) {
    this.getHostReport(mon.id, "utilizationReport", "monitoringUtilizationReport", "monitoringUtilizationReportLoading");

    //this.props.dispatch(monitoringActions.getHostUtilizationReport(mon.id));//mon.cloud_host_id

    this.setState({monDetails: mon});
    this.setState({ modalIsOpenUtilizationReport: true });
    this.setState({ isUtilizationReportLoading: true });
  }

  afterOpenModalUtilizationReport() {       
    this.subtitle.style.color = "#f00";
  }

  closeModalUtilizationReport() {
    this.setState({ modalIsOpenUtilizationReport: false });
  }
  vmItemsSave = e => {
    e.preventDefault();      
    var form = document.querySelector("#VMItems");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(monitoringActions.vmItemsSave(formData));
    this.setState({ modalIsOpenVMItems: false });
    
    this.getAllVirtualMachines();
    //this.props.dispatch(monitoringActions.getAllMonitoringVms({clientid:this.state.clientid}));
        
  };

  addUptimeReportRequest = e => {
    
    e.preventDefault();      
    var form = document.querySelector("#addUptimeReportFrm");
    var formData = serialize(form, { hash: true });
    formData = Object.assign(formData, {from_date:this.state.uptimeStartDate,to_date:this.state.uptimeEndDate});

    let validateDates = this.validateDates(formData);

    if(!validateDates)
      return false;
      
    this.addHostReport(formData, "addUptimeReport", "Uptime");
    //this.props.dispatch(monitoringActions.addHostUptimeReport(formData))
  };
  
  addHostReport(formData, api_name, name){
    this.setState({
      monitoringUptimeReportLoading: true,
      monitoringUtilizationReportLoading: true
    });

    formData.setup_type = this.state.isVMTabActive ? "0" : "1";

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
  };
  return fetch(`${config.apiUrl}/secureApi/monitoring/` + api_name, requestOptions).then(response  => this.commonaddHostReport(response, api_name, formData.vm_id, name))
  /*.catch((error) => {
      toast.error("Internal server error, Please try again");
      this.setState({
        monitoringUptimeReport: [],
        monitoringUptimeReportLoading: false,
        monitoringUtilizationReport: [],
        monitoringUtilizationReportLoading: false
      })
    });*/
  }
  
  commonaddHostReport(response, api_name, vmid, name) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        
        if(data.affectedRows){
          toast.success(name + " Report Added successfully");
        }
        else{
          toast.error(data.message ? data.message : "Unable to add " + name);
        }
        
        if(api_name == "addUptimeReport"){
          this.getHostReport(vmid, "uptimeReport", "monitoringUptimeReport", "monitoringUptimeReportLoading");
        }
        else if(api_name == "addUtilizationReport"){
          this.getHostReport(vmid, "utilizationReport", "monitoringUtilizationReport", "monitoringUtilizationReportLoading");
        }
    });
  }

  validateDates(formData){
    if(!formData.from_date){
      toast.error("Please select From Date!");
      return false;
    }

    if(!formData.to_date){
      toast.error("Please select From Date!");
      return false;
    }

    if(formData.from_date > formData.to_date){
      toast.error("To Date should be greater than From Date!");
      return false;
    }

    return true;
  }

  addUsageReportRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#addUsageReportFrm");
    var formData = serialize(form, { hash: true });
    formData = Object.assign(formData, {from_date:this.state.usageStartDate,to_date:this.state.usageEndDate});

    let validateDates = this.validateDates(formData);

    if(!validateDates)
      return false;

    this.setState({
      isMonitoringUsageReportLoading: true
    });
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    };

    fetch(`${config.apiUrl}/secureApi/monitoring/addUsageReport`, requestOptions).then(response  => this.handleAddUsageReportResponse(response));
  };

  handleAddUsageReportResponse(response, stateName) {
    return response.text().then(text => {
        if (!response.ok) {
            toast.error("Unable add Usage Report");
        }
        else{
          toast.success("Usage Report Added successfully");
          this.openModalUsageReport();
        }
    });
  }

  addUtilizationReportRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#addUtilizationReportFrm");
    var formData = serialize(form, { hash: true });
    formData = Object.assign(formData, {from_date:this.state.utilizationStartDate,to_date:this.state.utilizationEndDate});
    
    let validateDates = this.validateDates(formData);

    if(!validateDates)
      return false;

    this.addHostReport(formData, "addUtilizationReport", "Utilization");

    //this.props.dispatch(monitoringActions.addHostUtilizationReport(formData));
  };
  
  loadVmList = (values) => {
      let rows = [];

      for(let index = 0; index < values.length; index++){
        let mon = values[index];
        rows.push({
          sno: index + 1,
          label_name: <a href={`/#/hostitemsgraphs/${ this.state.isVMTabActive ? mon.id : mon.id + "&flag=ps"}`}>{mon.label_name}</a>,
          search_label_name: mon.label_name,
          location: mon.location,
          primary_ip: mon.primary_ip,
          vm_status: mon.vm_status,
          uptime: <div class="text-center"><i class="fas fa-chart-bar font-awesome-click-action" onClick={() => this.openModalUptimeReport(mon)}></i></div>,
          utilizationReport: <div class="text-center"><i class="fas fa-chart-line font-awesome-click-action" onClick={() => this.openModalUtilizationReport(mon)}></i></div>,
          usageReport: <div class="text-center"><i class="fas fa-chart-area font-awesome-click-action" onClick={() => this.openModalUsageReport(mon)}></i></div>,
          usageMetrics: <div class="text-center"><a className="badge adge-md badge-primary btn-blue" onClick={() => this.openModalUsageMetrics(mon)}>Usage Metrics</a></div>,
          os_type: mon.os_type,
          //power_status: mon.power_status
        });
      }
    
      let vmColoums = [
        {
            label: 'S.No',
            field: 'sno',
        },
        {
            label: 'VM Name',
            field: 'label_name',
        },
        {
            label: 'VM Location',
            field: 'location'
        },
        {
            label: 'VM IP',
            field: 'primary_ip'
        },
        {
            label: 'VM Status',
            field: 'vm_status'
        },
        {
            label: 'Uptime Report',
            field: 'uptime'
        },
        {
            label: 'Utilization Report',
            field: 'utilizationReport'
        },
        {
            label: 'Usage Report',
            field: 'usageReport'
        },
        {
            label: 'Usage Metrics',
            field: 'usageMetrics'
        }
      ];
      
      let physicalServersColoums = [
        {
            label: 'S.No',
            field: 'sno',
        },
        {
            label: 'Name',
            field: 'label_name',
        },
        {
            label: 'IP',
            field: 'primary_ip'
        },
        {
          label: 'OS Type',
          field: 'os_type'
        },
        {
            label: 'Uptime Report',
            field: 'uptime'
        },
        {
            label: 'Utilization Report',
            field: 'utilizationReport'
        },
        {
            label: 'Usage Metrics',
            field: 'usageMetrics'
        }
      ];

      let data = {
        columns: this.state.isVMTabActive ? vmColoums : physicalServersColoums,
        rows: rows
      }

      //if(rows && rows.length > 0){
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

    if(flag){
      this.getAllVirtualMachines();
    }
    else{
      this.getAllPhysicalServers();
    }
  }

    render() {
        const { monitoringdashboard,monitoringVMItems,monitoringUsageMetrics,monitoringUptimeReport,monitoringUtilizationReport } = this.props; 
        const monitoringUsageReport = this.state.monitoringUsageReport;
        return (
          <div className="container-fluid main-body">
          <div className="contentarea">
            <h5 class="color">Cloud4C Monitoring Dashboard</h5>
            <div className="main-tab mb-4">
              <div className="tabs-wrapper">
                  <button onClick={() => this.callActiveTab(true)} class={"btn btn-sm tab-wrapper " + (this.state.isVMTabActive && "active-tab")}> Virtual Machines</button>
                  <button onClick={() => this.callActiveTab(false)} class={"btn btn-sm tab-wrapper " + (!this.state.isVMTabActive && "active-tab")}> Physcial Servers</button>
              </div>
                <br/>
                {this.state.loading && <div className="m-4"> <PageLoader/></div>}
                {/*monitoringdashboard.error && <span className="text-danger">ERROR - {monitoringdashboard.error}</span>*/}
                {!this.state.loading &&
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

                        {/*!monitoringdashboard.items || monitoringdashboard.items.length == 0 &&
                          <span className="star-mark">No Record found</span>
                        */}
                      </React.Fragment>
                }
            </div>
        </div>  
                       
        <Modal
              isOpen={this.state.modalIsOpenUptimeReport}
              onAfterOpen={this.afterOpenModalUptimeReport}
              onRequestClose={this.closeModalUptimeReport}
              style={customStyles}
              contentLabel="Uptime Report"
            >
              <h2 ref={subtitle => (this.subtitle = subtitle)}>
              Uptime Report <a href="javascript:void(0);" className="float-right" onClick={this.closeModalUptimeReport}><i className="fa fa-times" /></a>
              </h2>
              <div className="row">
                <div className="col-sm-6">
                  <strong className="col-sm-4 align-top">VM Name : </strong>
                  <label className="col-sm-7">{this.state.monDetails.label_name}</label>
                </div>
                <div className="col-sm-6 p-0">
                  <strong className="col-sm-4">IP Address : </strong>
                  <label className="col-sm-7">{this.state.monDetails.primary_ip}</label>
                </div>
              </div>
              <div className="col-md-12">
                <div className="panel panel-default" />
                <form
                  name="addUptimeReportFrm"
                  id="addUptimeReportFrm"
                  method="post"
                  onSubmit={this.addUptimeReportRequest}
                >
                  <div className="row">
                    <div className="form-group col-sm-4">
                      <label htmlFor="from_date">From Date :&nbsp;</label>
                      
                      <DatePicker
                        dateFormat="yyyy/MM/dd"
                        selected={this.state.uptimeStartDate}
                        selectsStart
                        startDate={this.state.uptimeStartDate}
                        endDate={this.state.uptimeEndDate}
                        onChange={this.handleChangeUptimeStart}
                        withPortal
                        showYearDropdown
                        showMonthDropdown
                    />
                    </div>
                    <div className="form-group col-sm-4">
                      <label htmlFor="to_date">To Date :&nbsp;</label>
                      <DatePicker
                        dateFormat="yyyy/MM/dd"
                        selected={this.state.uptimeEndDate}
                        selectsEnd
                        startDate={this.state.uptimeStartDate}
                        endDate={this.state.uptimeEndDate}
                        onChange={this.handleChangeUptimeEnd}
                        withPortal
                        showYearDropdown
                        showMonthDropdown
                    />
                    </div>
                    <div className="form-group col-sm-4" style={{'padding-top':'6px'}}><br/>
                      <label>&nbsp;</label>
                      <input type="hidden" name="clientid" value={this.state.monDetails.clientid} />
                      <input type="hidden" name="vm_id" value={this.state.monDetails.id} />
                      <button className="btn btn-blue">Submit</button>
                    </div>
                  </div>
                </form>
                <div className="col-md-12 p-0">
                    <div className="panel panel-default">
                        {this.state.monitoringUptimeReportLoading ?
                          <PageLoader/>
                        : 
                          <div>
                            <HostUptimeReport 
                              monitoringUptimeReport={this.state.monitoringUptimeReport}
                            />
                          </div>
                        }
                        
                    </div>
                </div>
              </div>
            </Modal>

            <Modal
              isOpen={this.state.modalIsOpenUtilizationReport}
              onAfterOpen={this.afterOpenModalUtilizationReport}
              onRequestClose={this.closeModalUtilizationReport}
              style={customStyles}
              contentLabel="Utilization Report"
            >
              <h2 ref={subtitle => (this.subtitle = subtitle)}>
              Utilization Report <a href="javascript:void(0);" className="float-right" onClick={this.closeModalUtilizationReport}><i className="fa fa-times" /></a>
              </h2>
              <div className="row">
                <div className="col-sm-6">
                  <strong className="col-sm-4 align-top">VM Name : </strong>
                  <label className="col-sm-7">{this.state.monDetails.label_name}</label>
                </div>
                <div className="col-sm-6 p-0">
                  <strong className="col-sm-4">IP Address : </strong>
                  <label className="col-sm-7">{this.state.monDetails.primary_ip}</label>
                </div>
              </div>
              <div className="col-md-12">
                <div className="panel panel-default" />
                <form
                  name="addUtilizationReportFrm"
                  id="addUtilizationReportFrm"
                  method="post"
                  onSubmit={this.addUtilizationReportRequest}
                >
                  <div className="row">
                    <div className="form-group col-sm-4">
                      <label htmlFor="from_date">From Date :&nbsp;</label>
                      
                      <DatePicker
                        dateFormat="yyyy/MM/dd"
                        selected={this.state.utilizationStartDate}
                        selectsStart
                        startDate={this.state.utilizationStartDate}
                        endDate={this.state.utilizationEndDate}
                        onChange={this.handleChangeUtilizationStart}
                        withPortal
                        showYearDropdown
                        showMonthDropdown
                    />
                    </div>
                    <div className="form-group col-sm-4">
                      <label htmlFor="to_date">To Date :&nbsp;</label>
                      <DatePicker
                        dateFormat="yyyy/MM/dd"
                        selected={this.state.utilizationEndDate}
                        selectsEnd
                        startDate={this.state.utilizationStartDate}
                        endDate={this.state.utilizationEndDate}
                        onChange={this.handleChangeUtilizationEnd}
                        withPortal
                        showYearDropdown
                        showMonthDropdown
                    />
                    </div>
                    <div className="form-group col-sm-4" style={{'padding-top':'6px'}}><br/>
                      <label>&nbsp;</label>
                      <input type="hidden" name="clientid" value={this.state.monDetails.clientid} />
                      <input type="hidden" name="vm_id" value={this.state.monDetails.id} />
                      <button className="btn btn-blue">Submit</button>
                    </div>
                  </div>
                </form>
                <div className="col-md-12 p-0">
                    <div className="panel panel-default">
                    {this.state.monitoringUtilizationReportLoading ?
                          <PageLoader/>
                        : 
                        <div>
                          <HostUtilizationReport
                            monitoringUtilizationReport={this.state.monitoringUtilizationReport}
                          />
                        </div>
                    }
                  </div>
              </div>
              </div>
            </Modal>

        <Modal
              isOpen={this.state.modalIsOpenUsageReport}
              onAfterOpen={this.afterOpenModalUsageReport}
              onRequestClose={this.closeModalUsageReport}
              style={customStyles}
              contentLabel="Usage Report"
            >
              <h2 ref={subtitle => (this.subtitle = subtitle)}>
              Usage Report <a href="javascript:void(0);" className="float-right" onClick={this.closeModalUsageReport}><i className="fa fa-times" /></a>
              </h2>
              <div className="row">
                <div className="col-sm-6">
                  <strong className="col-sm-4 align-top">VM Name : </strong>
                  <label className="col-sm-7">{this.state.monDetails.label_name}</label>
                </div>
                <div className="col-sm-6 p-0">
                  <strong className="col-sm-4">IP Address : </strong>
                  <label className="col-sm-7">{this.state.monDetails.primary_ip}</label>
                </div>
              </div>
              <div className="col-md-12">
                <div className="panel panel-default" />
                <form
                  name="addUsageReportFrm"
                  id="addUsageReportFrm"
                  method="post"
                  onSubmit={this.addUsageReportRequest}
                >
                  <div className="row">
                    <div className="form-group col-sm-4">
                      <label htmlFor="from_date">From Date :&nbsp;</label>
                      
                      <DatePicker
                        dateFormat="yyyy/MM/dd"
                        selected={this.state.usageStartDate}
                        selectsStart
                        startDate={this.state.usageStartDate}
                        endDate={this.state.usageEndDate}
                        onChange={this.handleChangeUsageStart}
                        withPortal
                        showYearDropdown
                        showMonthDropdown
                    />
                    </div>
                    <div className="form-group col-sm-4">
                      <label htmlFor="to_date">To Date :&nbsp;</label>
                      <DatePicker
                        dateFormat="yyyy/MM/dd"
                        selected={this.state.usageEndDate}
                        selectsEnd
                        startDate={this.state.usageStartDate}
                        endDate={this.state.usageEndDate}
                        onChange={this.handleChangeUsageEnd}
                        withPortal
                        showYearDropdown
                        showMonthDropdown
                    />
                    </div>
                    <div className="form-group col-sm-4" style={{'padding-top':'6px'}}><br/>
                      <label>&nbsp;</label>
                      <input type="hidden" name="clientid" value={this.state.monDetails.clientid} />
                      <input type="hidden" name="vm_id" value={this.state.monDetails.id} />
                      <button className="btn btn-blue">Submit</button>
                    </div>
                  </div>
                </form>
                <div className="col-md-12 p-0">
                    <div className="panel panel-default">
                        {this.state.isMonitoringUsageReportLoading
                        ?
                        <PageLoader />
                        :
                        <React.Fragment>                        
                          <div className="table-responsive">
                            <table className="table table-bordered table-striped table-dark table-custom table-hover" id="monitoringUptimeReport">
                                <thead> 
                                  <tr>
                                    <th>SL</th>
                                    <th>From Date</th>
                                    <th>To Date</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody> 
                                {
                                  (monitoringUsageReport.length > 0)?
                                  monitoringUsageReport.map((mon, index) =>
                                    <tr key={index}>
                                      <td>{index+1}</td>
                                      <td>{mon.from_date} </td>
                                      <td>{mon.to_date} </td>
                                      <td>{mon.status == "1"?
                                      <a target="_blank" rel="noopener noreferrer" href={`${config.apiUrl}/download/downloadfile?file=`+mon.download_path+`&type=REPORT`} download>Download</a>
                                      :'In-progress'}
                                      </td>
                                    </tr>                             
                                  )
                                :
                                (
                                  <tr>
                                    <td colSpan='4' className='text-center'>No data found</td>
                                  </tr>
                                )
                              }
                            </tbody>
                          </table>
                        </div>
                        </React.Fragment>
                        }
                    </div>
                </div>
              </div>
            </Modal>

            <Modal
              isOpen={this.state.modalIsOpenUsageMetrics}
              onAfterOpen={this.afterOpenModalUsageMetrics}
              onRequestClose={this.closeModalUsageMetrics}
              style={customStyles}
              contentLabel="VM Usage Metrics"
              className="metrics"
            >
              <h2 ref={subtitle => (this.subtitle = subtitle)}>
              VM Usage Metrics : {this.state.monDetails.label_name} <a href="javascript:void(0);" className="float-right" onClick={this.closeModalUsageMetrics}><i className="fa fa-times" /></a>
              </h2>

              <div className="col-md-12 p-0">
                  <div className="panel panel-default">
                      {monitoringUsageMetrics && (
                        <div>
                          <HostUsageMetrics
                            monitoringUsageMetrics={monitoringUsageMetrics}
                          />
                        </div>
                      )}
                      
                  </div>
              </div>
            </Modal>

            <Modal
              isOpen={this.state.modalIsOpenVMItems}
              onAfterOpen={this.afterOpenModalVMItems}
              onRequestClose={this.closeModalVMItems}
              style={customStyles}
              contentLabel="Edit VM Monitoring Parameters"
              className="metrics"
            >
              <h2 ref={subtitle => (this.subtitle = subtitle)}>
              VM Monitoring Parameters <a href="javascript:void(0);" className="float-right" onClick={this.closeModalVMItems}><i className="fa fa-times" /></a>
              </h2>

              <div className="col-md-12">
                <div className="panel panel-default" />
                <form
                  name="VMItems"
                  id="VMItems"
                  method="post"
                  onSubmit={this.vmItemsSave}
                >
                  <div className="panel panel-default">
                      {monitoringVMItems && (
                        <div>
                          <HostItemsFromZabbix
                            monitoringVMItems={monitoringVMItems}
                          />
                        </div>
                      )}
                      
                  </div>
                  
                </form>
              </div>
            </Modal>
        </div> 
        );
    }
}

function mapStateToProps(state) {   
    const { monitoringdashboard, monitoringVMItems,monitoringUsageMetrics,monitoringUptimeReport,monitoringUtilizationReport } = state;      
    return {
      monitoringdashboard,
      monitoringVMItems,
      monitoringUsageMetrics,
      monitoringUptimeReport,
      monitoringUtilizationReport
    };
}

const connectedMonitoring = connect(mapStateToProps)(MonitoringDashboard);
export { connectedMonitoring as MonitoringDashboard };