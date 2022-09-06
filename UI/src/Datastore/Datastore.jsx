import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { commonActions, alertActions, datastoreActions } from "../_actions/";
import Modal from "react-modal";
import Datastorelist from "./Datastorelist";
//import Vdclocoptions from "./vdclocoptions";
//import Dstoreoptions from "./dstoreoptions";
var serialize = require("form-serialize");
import Swal from "sweetalert2";
import { toast } from 'react-toastify';
import PageLoader from "../_components/PageLoader";
const customStyles = {
  content: {}
};
class Datastore extends React.Component {
 constructor(props) {
    super(props);
    this.state = {
      modalIsOpen: false,
      modalIsDatastoreDetailOpen:false,
      modalIsHostOpen:false,
      datastore:[],
      vdc_id: ""
    };
    this.openDatastoreDetailModal = this.openDatastoreDetailModal.bind(this);
    this.closeDatastoreDetailModal = this.closeDatastoreDetailModal.bind(this);
    this.openHostModal = this.openHostModal.bind(this);
    this.closeHostModal = this.closeHostModal.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }
  componentDidMount() {
    this.props.dispatch(datastoreActions.getAll());
  }

  viewHost=(dsid)=>{
    this.props.dispatch(datastoreActions.hostUnderDatastore(dsid));
    this.openHostModal();
  }
  openHostModal() {      
    this.setState({ modalIsHostOpen: true });
  }
  closeHostModal() {
    this.setState({ modalIsHostOpen: false });       
  }

  datastoreDetail=(dsid)=>{
    this.props.dispatch(datastoreActions.getDatastoreDetail(dsid));
    this.openDatastoreDetailModal();
  }
  openModal(data) {
    this.setState({ modalIsOpen: true });
    this.setState({datastore: data});
  }
  closeModal() {
    this.setState({ modalIsOpen: false });
  }

  openDatastoreDetailModal() {      
    this.setState({ modalIsDatastoreDetailOpen: true });
  }
  closeDatastoreDetailModal() {
    this.setState({ modalIsDatastoreDetailOpen: false });       
  }
  updateDatastore = e => {
    e.preventDefault();
    const upd = document.querySelector("#editDatastoreFrm");
    const formData1 = serialize(upd, { hash: true });
    this.closeModal();
    this.props.dispatch(datastoreActions.updateDatastore(formData1));
  };
  makeActiveInactive = (id, status) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You want to " + status + "?",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Update it!"
    }).then(result => {
      if (result.value) {
        this.props.dispatch(
          commonActions.setEnableDisable("datastore", id, status)
        );
        this.props.dispatch(datastoreActions.getAll());
        toast.success("Datastore Status Updated.");
      }
    });
  };
  render() {
    const datastores = this.props.data_store;
    const details = this.props.details;
    const hostlist = this.props.hostlist;
    if (datastores == "undefined") {
      return <h2><PageLoader/></h2>;
    } else {
      return (
        <div className="container-fluid main-body">
          <div className="contentarea">
          <h2>Datastore Mgmt</h2>
          <div className="col-md-12">
            <div className="text-right" />
            <table className="table table-bordered table-hover">
              <thead>
                <tr>
                  <th>SNO</th>
                  <th>Name</th>
                  <th>Disk Type</th>
                  <th>VDC Name</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <Datastorelist datastoreDetail={this.datastoreDetail.bind(this)}
                  data={this.props.data_store} viewHost={this.viewHost.bind(this)}
                  makeActiveInactive={this.makeActiveInactive.bind(this)} openModal={this.openModal.bind(this)}
                />
              </tbody>
            </table>
          </div>
          </div>
          <Modal
          isOpen={this.state.modalIsHostOpen}    
          onRequestClose={this.closeHostModal}
          contentLabel="Host Under Datastore"  className="metrics" id="hostlist">
          <h2 style={{color:'red'}}>
            Host Under Datastore <a className="float-right" href="javascript:void(0);" onClick={this.closeHostModal}><i className="fa fa-times" /></a>
          </h2>
          <div className="table-responsive">
          {!hostlist && <h4>Host not available for this datastore.</h4>}
          {hostlist && 
            <table className="table table-bordered table-hover" >
              <tbody>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Is Enabled</th>
                    <th>Product Fullname</th>
                    <th>CPU Core</th>
                    <th>Memory Size</th>
                  </tr> 
                  {hostlist.map((host, key) =>  
                    <tr key={key}>
                      <td>{host.HOSTID}</td>
                      <td>{host.NAME}</td>
                      <td>{(host.ENABLED==1)?'Yes':'No'}</td>
                      <td>{host.PRODUCT_FULLNAME}</td>
                      <td>{host.CPU_CORE_COUNT}</td>
                      <td>{(host.MEM_SIZE/(1024*1024*1024)).toFixed(2)} GB</td>
                    </tr> 
                    )}                      
              </tbody>
            </table>
          }
          </div>
        </Modal>
          <Modal
            isOpen={this.state.modalIsOpen}
            onRequestClose={this.closeModal}
            style={customStyles}
            contentLabel="Edit Datastore"
          >
            <h2 style={{color:'red'}}>
              Edit DataStore &nbsp;
              <a className="float-right" href="javascript:void(0);" onClick={this.closeModal}>
                <i className="fa fa-times" />
              </a>
            </h2>

            <div>
              <div className="panel panel-default" />
              <form
                name="editDatastoreFrm"
                id="editDatastoreFrm"
                method="post"
                onSubmit={this.updateDatastore}
              >
               <div className="form-group">
                  <label htmlFor="status">Select Disk Type</label>
                  <select
                    name="disk_type"
                    className="form-control"
                    required
                    defaultValue={this.state.datastore.disk_type}
                  >
                    <option>Select Disk Type</option>
                    <option value="SSD">SSD</option>
                    <option value="SAS">SAS</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="status">Select Status</label>
                  <select
                    name="status"
                    className="form-control"
                    required
                    defaultValue={this.state.datastore.status}
                  >
                    <option>Select Status</option>
                    <option value="I">Inactive</option>
                    <option value="A">Active</option>
                  </select>
                </div>
                <div className="form-group">
                <input type="hidden" name="id" defaultValue={this.state.datastore.id}/>
                  <button className="btn btn-success">Submit</button>
                </div>
              </form>
            </div>
          </Modal>
          <Modal
          isOpen={this.state.modalIsDatastoreDetailOpen}      
          onRequestClose={this.closeDatastoreDetailModal}
          contentLabel="Datastore Details Modal"  className="metrics">
          <h2 style={{color:'red'}}>
            Datastore Details <a className="float-right" href="javascript:void(0);" onClick={this.closeDatastoreDetailModal}><i className="fa fa-times" /></a>
          </h2>
          <div className="table-responsive">
          {details && 
            <table className="table table-bordered table-hover" id="datastore_detail">
              <tbody>
                  <tr> <th>Datastore Name:</th><td>{details.NAME}</td> </tr>   
                  <tr> <th>Storage URL:</th><td>{details.STORAGE_URL}</td> </tr> 
                  <tr> <th>Capacity:</th><td>{(details.CAPACITY/(1024*1024*1024)).toFixed(2)} GB</td> </tr>
                  <tr> <th>Free Space:</th><td>{(details.FREE_SPACE/(1024*1024*1024)).toFixed(2)} GB</td> </tr>   
                  <tr> <th>Is Maintenance Mode:</th><td>{(details.MAINTENANCE_MODE > 0)?'Yes':'No'}</td> </tr>               
              </tbody>
            </table>
          }
          </div>
        </Modal>
        </div>
      );
    }
  }
}

let mapStateToProps = state => ({
  vdc_locations: state.common.data,
  data_store: state.datastore.datastoredata,
  datastores: state.datastore.datastores,
  details: state.datastore.details,
  hostlist: state.datastore.hostlist,
});
const connectedDatastore = connect(mapStateToProps)(Datastore);
export { connectedDatastore as Datastore };
