import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { commonActions, alertActions, esxiActions } from "../_actions";
import Modal from "react-modal";
import EsxiList from "./EsxiList";
import PageLoader from "../_components/PageLoader";
//import Vdclocoptions from "../Datastore/vdclocoptions";
var serialize = require("form-serialize");
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    width: "50%",
    transform: "translate(-50%, -50%)"
  }
};
class EsxiMgmt extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalIsHostDetailOpen:false,
      modalIsDatastoreOpen:false,
      esxihost:[]
    };
    this.makeEsxiAction=this.makeEsxiAction.bind(this);
    this.openHostDetailModal = this.openHostDetailModal.bind(this);
    this.closeHostDetailModal = this.closeHostDetailModal.bind(this);

    this.openDatastoreModal = this.openDatastoreModal.bind(this);
    this.closeDatastoreModal = this.closeDatastoreModal.bind(this);
  }
  componentDidMount() {
    this.props.dispatch(esxiActions.getAllHosts());      
  }

  hostDetail=(hostid)=>{
    this.props.dispatch(esxiActions.getHostDetail(hostid));
    this.openHostDetailModal();
  }
  openHostDetailModal() {      
    this.setState({ modalIsHostDetailOpen: true });
  }
  closeHostDetailModal() {
    this.setState({ modalIsHostDetailOpen: false });       
  }

  viewDatastore=(hostid)=>{
    this.props.dispatch(esxiActions.datastoreUnderHost(hostid));
    this.openDatastoreModal();
  }
  openDatastoreModal() {      
    this.setState({ modalIsDatastoreOpen: true });
  }
  closeDatastoreModal() {
    this.setState({ modalIsDatastoreOpen: false });       
  }
  makeEsxiAction = (action,id, status) => {
    this.props.dispatch(commonActions.setEnableDisable(action,id,status));
    this.props.dispatch(esxiActions.getAllHosts());    
 };
  render() {
    const esxihost = this.props.esxi_host;
    const details = this.props.details;
    const dslist = this.props.dslist;
    if (esxihost == "undefined") {
      return <h2><PageLoader/></h2>;
    } else {
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
        <h2>Esxi Host Mgmt</h2>
        <div className="col-md-12">
            <table className="table table-bordered table-hover">
              <thead>
                <tr>
                  <th>SNO</th>
                  <th>VDC Name</th>
                  <th>ESXI Host IP</th>
                  <th>ESXI Host Name</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
              <EsxiList data={this.props.esxi_host} hostDetail={this.hostDetail.bind(this)}
               makeEsxiAction={this.makeEsxiAction.bind(this)} viewDatastore={this.viewDatastore.bind(this)}/>
              </tbody>
            </table>
          </div>
        </div>
        <Modal
          isOpen={this.state.modalIsHostDetailOpen}     
          onRequestClose={this.closeHostDetailModal}
          contentLabel="Host Details Modal"  className="metrics">
          <h2 style={{color:'red'}}>
            Exi Host Details <a className="float-right" href="javascript:void(0);" onClick={this.closeHostDetailModal}><i className="fa fa-times" /></a>
          </h2>
          <div className="table-responsive">
          {!details && <h4>Host not available in vcenter.</h4>}
          {details && 
            <table className="table table-bordered table-hover" id="host_detail">
              <tbody>
                  <tr> <th>Name:</th><td>{details.IP_ADDRESS}</td>    
                    <th>Host Id:</th><td>{details.HOSTID}</td> </tr> 
                  <tr> <th>Is Enabled:</th><td>{(details.ENABLED > 0)?'Yes':'No'}</td> 
                    <th>Host Name:</th><td>{details.HOST_VENDOR}</td> </tr>   
                  <tr> <th>CPU Core Count:</th><td>{details.CPU_CORE_COUNT}</td>
                    <th>CPU Hz:</th><td>{details.CPU_HZ}</td></tr>
                  <tr> <th>RAM:</th><td>{((details.MEM_SIZE)/(1024*1024*1024)).toFixed(2)} GB</td>
                    <th>NIC Count:</th><td>{details.NIC_COUNT}</td></tr> 
                  <tr> <th>HBA Count:</th><td>{details.HBA_COUNT}</td>
                    <th>Cluster:</th><td>{details.CLUSTER_NAME}</td></tr> 
                  <tr> <th>Host Model:</th><td>{details.HOST_MODEL}</td>
                    <th>CPU Model:</th><td>{details.CPU_MODEL}</td></tr> 
                  <tr> <th>CPU Count:</th><td>{details.CPU_COUNT}</td>
                    <th>Boot Time:</th><td>{details.BOOT_TIME}</td></tr> 
                  <tr> <th>DNS Name:</th><td>{details.DNS_NAME}</td>
                    <th>Product Name:</th><td>{details.PRODUCT_NAME}</td></tr> 
                  <tr> <th>Product Full Name:</th><td>{details.PRODUCT_FULLNAME}</td>
                    <th>Product Version:</th><td>{details.PRODUCT_VERSION}</td></tr> 
                  <tr> <th>Product Build:</th><td>{details.PRODUCT_BUILD}</td>
                    <th>Produc Vendor:</th><td>{details.PRODUCT_VENDOR}</td></tr>  
                  <tr> <th>OS Type:</th><td>{details.PRODUCT_OS_TYPE}</td>
                    <th>IP Address:</th><td>{details.IP_ADDRESS}</td></tr>   
                  <tr> <th>UUID:</th><td>{details.UUID_BIOS}</td>
                    <th>Licensed Edition:</th><td>{details.LICENSED_EDITION}</td></tr>  
                  <tr> <th>Local IP Address:</th><td>{details.LOCAL_IP_ADDRESS}</td>
                    <th>Management IP:</th><td>{details.MANAGEMENT_IP}</td></tr>
                  <tr> <th>Power State:</th><td>{details.POWER_STATE}</td>
                    <th>RAM Size</th><td>{(details.MEM_SIZE?(details.MEM_SIZE/(1024*1024*1024)).toFixed(2):'')}</td></tr> 
                  <tr> <th>RAM Used:</th><td>{(details.RAM_USED?(details.RAM_USED/(1024*1024*1024)).toFixed(2):'')}</td>
                    <th>RAM Usage (%):</th><td>{(details.RAM_USAGE_PERCENT?(details.RAM_USAGE_PERCENT).toFixed(2):'')}</td></tr>
                  <tr> <th>VMOTION Status:</th><td>{details.VMOTION_ENABLED?'Enabled':'Disabled'}</td>
                    <th>Maintenance Mode:</th><td>{details.MMODE}</td></tr>                              
              </tbody>
            </table>
          }
          </div>
        </Modal>
        <Modal
          isOpen={this.state.modalIsDatastoreOpen}    
          onRequestClose={this.closeDatastoreModal}
          contentLabel="Datastore Under Host"  className="metrics" id="ds_detail">
          <h2 style={{color:'red'}}>
            Datastore Under Host <a className="float-right" href="javascript:void(0);" onClick={this.closeDatastoreModal}><i className="fa fa-times" /></a>
          </h2>
          <div className="table-responsive">
          {!dslist && <h4>Datastore not available for this host.</h4>}
          {dslist && 
            <table className="table table-bordered table-hover" >
              <tbody>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Capacity (GB)</th>
                    <th>Available Space (GB)</th>
                    <th>Is Maintenance Mode</th>
                  </tr> 
                  {dslist.map((ds, key) =>  
                    <tr key={key}>
                      <td>{ds.ID}</td>
                      <td>{ds.NAME}</td>
                      <td>{ds.TYPE}</td>
                      <td>{(ds.CAPACITY/(1024*1024*1024)).toFixed(2)}</td>
                      <td>{(ds.FREE_SPACE/(1024*1024*1024)).toFixed(2)}</td>
                      <td>{(ds.MAINTENANCE_MODE > 0)?'Yes':'No'}</td>
                    </tr> 
                    )}                      
              </tbody>
            </table>
          }
          </div>
        </Modal>
        </div>
      )
    }

  }
}

let mapStateToProps = state => ({
    esxi_host:state.esximgmt.data,
    dslist: state.esximgmt.dslist,
    details: state.esximgmt.details
});

const connectedEsxiMgmt = connect(mapStateToProps)(EsxiMgmt);
export { connectedEsxiMgmt as EsxiMgmt };


