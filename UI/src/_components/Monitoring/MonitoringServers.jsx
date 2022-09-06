import React from 'react';
import { connect } from 'react-redux';
import { monitoringActions } from './monitoring.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";

const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");
class MonitoringServers extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      MonitoringServers: [],
      sweetalert: null,
      isMonitoringServersLoading: false,
      modalIsOpenSaveMonitoringServer:false,
      action: null,
      serverDataInit :{
        display_name:"",
        url :"",
        menu_icon:"",
        parent_id:0,
        status:1,
        id:""
      },
      serverDataInfo :{
        display_name:"",
        url :"",
        menu_icon:"",
        parent_id:0,
        status:1,
        id:0
      },
      hidden: true,
    };
    
    this.openModalSaveMonitoringServer = this.openModalSaveMonitoringServer.bind(this);
    this.closeModalSaveMonitoringServer = this.closeModalSaveMonitoringServer.bind(this);
    this.afterOpenModalSaveMonitoringServer = this.afterOpenModalSaveMonitoringServer.bind(this);
    this.saveMonitoringServerRequest = this.saveMonitoringServerRequest.bind(this);
    this.toggleShow = this.toggleShow.bind(this);
  }

  toggleShow() {
    this.setState({ hidden: !this.state.hidden });
  }

  openModalSaveMonitoringServer(serverDetails) { 
    if(serverDetails.id==0){
      this.setState({ 'modalTitle': "Add Monitoring Server" });
    }else{
      this.setState({ 'modalTitle': "Edit Monitoring Server" });
    }
    this.setState({serverDataInfo:serverDetails,hidden: true})
    this.setState({ modalIsOpenSaveMonitoringServer: true });
  }

  afterOpenModalSaveMonitoringServer() {       
    // this.subtitle.style.color = "#f00";
  }

  closeModalSaveMonitoringServer() {
    this.setState({ modalIsOpenSaveMonitoringServer: false });
  }

  componentDidMount() {
    this.props.dispatch(monitoringActions.getAllMonitoringServers());
  }
  saveMonitoringServerRequest = e => {
    e.preventDefault();  
    var form = document.querySelector("#saveMonitoringServerFrm");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(monitoringActions.saveMonitoringServer(formData));
    this.setState({ sweetalert: null });
    this.closeModalSaveMonitoringServer();
    // this.props.dispatch(monitoringActions.getAllMonitoringServers());
  }

  render() { 
    const { monitoringServers } = this.props;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h2>Monitoring Servers</h2>
          <div className="text-right">
            <button
              className="btn btn-success"
              onClick={() => this.openModalSaveMonitoringServer(this.state.serverDataInit)}
            >
              <i className="fa fa-plus" /> Create Monitoring Server
              </button>
          </div>
          {!monitoringServers.error && monitoringServers.isMonitoringServersLoading && <PageLoader/>}
          {monitoringServers.error && <span className="text-danger">ERROR - {monitoringServers.error}</span>}
          {monitoringServers.items && !monitoringServers.isMonitoringServersLoading &&
            <div className="tableresp table-responsive">
              <table className="table table-bordered table-hover" id="monitoringServers">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Display Name</th>
                    <th>Server URL</th>
                    <th>Username</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoringServers.items.map((serverData, index) =>
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{serverData.display_name} </td>
                      <td>{serverData.server_name} </td>
                      <td>{serverData.username} </td>
                      <td>{serverData.status=='1'?'Active':"In-active"} </td>
                      <td>
                        <div>
                          <a href="javascript:void(0);" onClick={() => this.openModalSaveMonitoringServer(serverData)}><i className="fa fa-edit"></i> </a>
                        </div>
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
          isOpen={this.state.modalIsOpenSaveMonitoringServer}
          onAfterOpen={this.afterOpenModalSaveMonitoringServer}
          onRequestClose={this.closeModalSaveMonitoringServer}
          style={customStyles}
          contentLabel={this.state.modalTitle}
          className=""
        >
          <h2 style={{color:'red'}}>
          {this.state.modalTitle} <a className="float-right" href="javascript:void(0);" onClick={this.closeModalSaveMonitoringServer}><i className="fa fa-times" /></a>
          </h2>
          <div className="col-md-12">
            <div className="panel panel-default" />
            <form
              name="saveMonitoringServerFrm"
              id="saveMonitoringServerFrm"
              method="post"
              onSubmit={this.saveMonitoringServerRequest}
            >
              <div className="form-group row">
                <label htmlFor="display_name" className='col-sm-3 col-form-label'>Display Name</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control" defaultValue={this.state.serverDataInfo.display_name} required name="display_name" placeholder="Display Name" />
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="server_name" className='col-sm-3 col-form-label'>Server URL</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control" defaultValue={this.state.serverDataInfo.server_name} required name="server_name" placeholder="Server URL" />
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="username" className='col-sm-3 col-form-label'>Username</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control" defaultValue={this.state.serverDataInfo.username} name="username" placeholder="Username" />
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="password" className='col-sm-3 col-form-label'>Password</label>
                <div className="col-sm-9">
                  <div className="password"> 
                    <input type={this.state.hidden ? "password" : "text"} className="form-control password__input" defaultValue={this.state.serverDataInfo.password} name="password" placeholder="Password" />
                    <span className="password__show" onClick={this.toggleShow}>{this.state.hidden ? 'Show' : 'Hide'}</span>
                  </div>
                </div>
              </div>
              
              <div className="form-group row">
                <label htmlFor="status" className='col-sm-3 col-form-label'>Status</label>   
                <div className="col-sm-9">
                  <select
                    className="form-control"
                    required
                    name="status" 
                    defaultValue={this.state.serverDataInfo.status}                    
                  >                   
                  <option value="0">In Active</option>
                  <option value="1">Active</option>                      
                  </select>         
                </div>         
              </div>
              <div className="form-group row">
                <label className='col-sm-3 col-form-label'>&nbsp;</label>
                <div className="col-sm-9">
                <input type="hidden" name="user_id" value={this.state.user_id} />
                <input type="hidden" name="server_id" value={this.state.serverDataInfo.id} />
                  <button className="btn btn-success">Submit</button>
                </div>
              </div>
            </form>
          </div>
        </Modal>

      </div>

    );
  }
}

function mapStateToProps(state) {
  const { monitoringServers } = state;
  return {
    monitoringServers
  };
}

const connectedMonitoringServers = connect(mapStateToProps)(MonitoringServers);
export { connectedMonitoringServers as MonitoringServers };