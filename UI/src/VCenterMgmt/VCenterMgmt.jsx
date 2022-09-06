import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { commonActions, alertActions } from "../_actions/";
import { vcentermgmtActions } from "../_actions/vcentermgmt.action";
import Vcenterlist from "./Vcenterlist";
import Modal from "react-modal";
var serialize = require("form-serialize");
const customStyles = {
  content: {}
};
export default class VCenterMgmt extends React.Component {
   constructor(props) {
    super(props);
    this.state = {
      modalIsOpen: false,
      modalIsOpenEdit: false,
      vdc_name: "",
      vdc_location: "",
      vdc_ip: "",
      vdc_user: "",
      vdc_password: "",
      db_host: "",
      db_user: "",
      db_pass: "",
      db_name: "",
      db_type: "",
      status: "",
      vdc_id: ""
    };
  }
  openModal() {
    this.setState({ modalIsOpen: true });
  }
  openModalEdit() {
    this.setState({ modalIsOpenEdit: true });
  }
  editVCenrerInfo = item => {
    this.vdc_name = item.vdc_name;
    this.vdc_location = item.vdc_location;
    this.vdc_ip = item.vdc_ip;
    this.vdc_user = item.vdc_user;
    this.vdc_password = item.vdc_password;
    this.db_host = item.vdc_host;
    this.db_user = item.db_user;
    this.db_pass = item.db_pass;
    this.db_name = item.db_name;
    this.db_host = item.db_host;
    this.vdc_id = item.vdc_id;
    this.db_type = item.db_type;
    this.status = item.status;
    this.openModalEdit();
  };
  componentDidMount() {
    this.props.dispatch(commonActions.getVcenterList());
    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.openModalEdit = this.openModalEdit.bind(this);
    this.afterOpenModalEdit = this.afterOpenModalEdit.bind(this);
    this.closeModalEdit = this.closeModalEdit.bind(this);
    this.updateVcenterData = this.updateVcenterData.bind(this);
    //this.openModal = this.openModal.bind(this);
  }
  updateVcenterData(e) {
    e.preventDefault();
    this.closeModalEdit();
    const upd = document.querySelector("#editVcenter");
    const formData1 = serialize(upd, { hash: true });
    this.props.dispatch(vcentermgmtActions.vCenterUpdateRequest(formData1));
    this.props.dispatch(commonActions.getVcenterList());
  }
  afterOpenModal() {
    this.subtitle.style.color = "#f00";
  }
  afterOpenModalEdit() {
    this.subtitle.style.color = "#f00";
  }

  closeModal() {
    this.setState({ modalIsOpen: false });
    this.props.dispatch(alertActions.clear());
  }
  closeModalEdit() {
    this.setState({ modalIsOpenEdit: false });
    this.props.dispatch(alertActions.clear());
  }
  validateData(e) {
    const name = e.target.name;
    const value = e.target.value;
    this.setState({ [name]: value });
  }
  addVcenterData = e => {
    e.preventDefault();
    const form = document.querySelector("#addVcenter");
    const formData = serialize(form, { hash: true });
    this.props.dispatch(vcentermgmtActions.vCenterAddRequest(formData));
    this.props.dispatch(commonActions.getVcenterList());
  };
  render() {
    //let vdc_locations = this.props.vdc_locations;
    const { vdc_locations} = this.props;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
        <h2>VCenter Management</h2>
        <div className="pull-right">
          <button className="btn btn-success" onClick={this.openModal}>
            <i className="fa fa-plus" /> Add New
          </button>
        </div>
        <div>
          <table className="table table-bordered table-hover">
            <thead>
              <tr>
                <th>SNO</th>
                <th>VCenter Name / VM Count</th>
                <th>Location</th>
                <th>IP Address</th>
                <th>DB Host</th>
                <th>DB Name</th>
                <th>DB User</th>
                <th>DB Driver</th>
                <th>Status</th>
                <th>options</th>
              </tr>
            </thead>
            <tbody>
              <Vcenterlist
                vcenter={vdc_locations}
                editVCenrerInfo={this.editVCenrerInfo.bind(this)}
                key={vdc_locations}
              />
            </tbody>
          </table>
        </div>
      </div>
        <Modal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          style={customStyles}
          contentLabel="Add Vcenter"
        >
          <h2 ref={subtitle => (this.subtitle = subtitle)}>
            Add VCenter <a href="javascript:void(0)" className="float-right" onClick={this.closeModal}><i className="fa fa-times" /></a>
          </h2>

          <div>
            <div className="panel panel-default" />
            <form
              name="addVcenter"
              id="addVcenter"
              method="post"
              onSubmit={this.addVcenterData}
            >
              <div className="form-group">
                <label htmlFor="vdc_name">Enter VDC Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="vdc_name"
                  required
                  onChange={event => this.validateData(event)}
                  placeholder="Enter VDC Name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="vdc_location">VDC Location</label>
                <input
                  type="text"
                  className="form-control"
                  name="vdc_location"
                  required
                  onChange={event => this.validateData(event)}
                  placeholder="Enter VDC Location"
                />
              </div>
              <div className="form-group">
                <label htmlFor="vdc_ip">VDC IP Address</label>
                <input
                  type="text"
                  className="form-control"
                  name="vdc_ip"
                  required
                  onChange={event => this.validateData(event)}
                  placeholder="VDC IP Address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="vdc_user">VDC Username</label>
                <input
                  type="text"
                  className="form-control"
                  name="vdc_user"
                  required
                  onChange={event => this.validateData(event)}
                  placeholder="VDC UserName"
                />
              </div>
              <div className="form-group">
                <label htmlFor="vdc_password">VDC Password</label>
                <input
                  type="text"
                  className="form-control"
                  name="vdc_password"
                  required
                  onChange={event => this.validateData(event)}
                  placeholder="VDC Password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="db_user">Database Username</label>
                <input
                  type="text"
                  className="form-control"
                  name="db_user"
                  required
                  onChange={event => this.validateData(event)}
                  placeholder="Database UserName"
                />
              </div>
              <div className="form-group">
                <label htmlFor="db_pass">Database Password</label>
                <input
                  type="text"
                  className="form-control"
                  name="db_pass"
                  required
                  onChange={event => this.validateData(event)}
                  placeholder="Database Password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="db_name">Database Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="db_name"
                  required
                  onChange={event => this.validateData(event)}
                  placeholder="Database Name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="db_host">DB Host</label>
                <input
                  type="text"
                  className="form-control"
                  name="db_host"
                  required
                  onChange={event => this.validateData(event)}
                  placeholder="Database Host Name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  name="status"
                  className="form-control"
                  required
                  onChange={event => this.validateData(event)}
                >
                  <option value="A">Active</option>
                  <option value="I">InActive </option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="db_type">DB Type</label>
                <select
                  name="db_type"
                  className="form-control"
                  required
                  onChange={event => this.validateData(event)}
                >
                  <option value="mssql">MS SQL</option>
                  <option value="pgsql">PgSQL </option>
                </select>
              </div>
              <div className="form-group">
                <button className="btn btn-success">Submit</button>
              </div>
            </form>
          </div>
        </Modal>

        <Modal
          isOpen={this.state.modalIsOpenEdit}
          onAfterOpen={this.afterOpenModalEdit}
          onRequestClose={this.closeModalEdit}
          style={customStyles}
          contentLabel="Edit Vcenter Info"
        >
          <h2 ref={subtitle => (this.subtitle = subtitle)}>
            Edit VCenter <a href="javascript:void(0)" className="float-right" onClick={this.closeModalEdit}><i className="fa fa-times" /></a>
          </h2>

          <div>
            <div className="panel panel-default" />
            <form
              name="editVcenter"
              id="editVcenter"
              method="post"
              onSubmit={this.updateVcenterData}
            >
              <div className="form-group">
                <label htmlFor="vdc_name">Enter VDC Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="vdc_name"
                  required
                  value={this.vdc_name}
                  onChange={event => this.validateData(event)}
                  placeholder="Enter VDC Name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="vdc_location">VDC Location</label>
                <input
                  type="text"
                  className="form-control"
                  name="vdc_location"
                  required
                  value={this.vdc_location}
                  onChange={event => this.validateData(event)}
                  placeholder="Enter VDC Location"
                />
              </div>
              <div className="form-group">
                <label htmlFor="vdc_ip">VDC IP Address</label>
                <input
                  type="text"
                  className="form-control"
                  name="vdc_ip"
                  defaultValue={this.vdc_ip}
                  required
                  onChange={event => this.validateData(event)}
                  placeholder="VDC IP Address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="vdc_user">VDC Username</label>
                <input
                  type="text"
                  className="form-control"
                  name="vdc_user"
                  required
                  defaultValue={this.vdc_user}
                  onChange={event => this.validateData(event)}
                  placeholder="VDC UserName"
                />
              </div>
              <div className="form-group">
                <label htmlFor="vdc_password">VDC Password</label>
                <input
                  type="text"
                  className="form-control"
                  name="vdc_password"
                  defaultValue={this.vdc_password}
                  required
                  onChange={event => this.validateData(event)}
                  placeholder="VDC Password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="db_user">Database Username</label>
                <input
                  type="text"
                  className="form-control"
                  name="db_user"
                  required
                  defaultValue={this.db_user}
                  onChange={event => this.validateData(event)}
                  placeholder="Database UserName"
                />
              </div>
              <div className="form-group">
                <label htmlFor="db_pass">Database Password</label>
                <input
                  type="text"
                  className="form-control"
                  name="db_pass"
                  required
                  defaultValue={this.db_pass}
                  onChange={event => this.validateData(event)}
                  placeholder="Database Password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="db_name">Database Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="db_name"
                  defaultValue={this.db_name}
                  required
                  onChange={event => this.validateData(event)}
                  placeholder="Database Name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="db_host">DB Host</label>
                <input
                  type="text"
                  className="form-control"
                  name="db_host"
                  defaultValue={this.db_host}
                  required
                  onChange={event => this.validateData(event)}
                  placeholder="Database Host Name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  name="status"
                  className="form-control"
                  required
                  defaultValue={this.status}
                  onChange={event => this.validateData(event)}
                >
                  <option value="A">Active</option>
                  <option value="I">InActive </option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="db_type">DB Type</label>
                <select
                  name="db_type"
                  className="form-control"
                  required
                  defaultValue={this.db_type}
                  onChange={event => this.validateData(event)}
                >
                  <option value="mssql">MS SQL</option>
                  <option value="pgsql">PgSQL </option>
                </select>
              </div>
              <input
                type="hidden"
                name="vdc_id"
                value={this.vdc_id}
                onChange={event => this.validateData(event)}
              />
              <div className="form-group">
                <button className="btn btn-success">Submit</button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    );
  }
}
/*let mapStateToProps = state => ({
  vdc_locations: state.common.data
});*/
function mapStateToProps(state) {
const vdc_locations = state.common.vcenter;
  return {vdc_locations};
}
const connectedVCenterMgmt = connect(mapStateToProps)(VCenterMgmt);
export { connectedVCenterMgmt as VCenterMgmt };
