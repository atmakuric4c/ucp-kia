import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { alertActions, commonActions } from "../_actions/";
import { VeeamServerActions } from "./VeeamServer.actions";
import VeeamServerList from "./VeeamServerList";
import Vdclocoptions from "./vdclocoptions";
import Modal from "react-modal";
var serialize = require("form-serialize");
import Swal from "sweetalert2";
import { toast } from 'react-toastify';

export default class VeeamServer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalIsOpen: false,
      fields: {
        vdc_id: "",
        ip_address: "",
        username: "",
        password: "",
        server_type: "",
        db_host: "",
        db_user: "",
        db_password: "",
        db_user: "",
        db_name: "",
        db_driver: "",
        status: ""
      },
      errors: {},
      validation: false
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.editUpdate = this.editUpdate.bind(this);
  }
  editUpdate(id, status) {
    Swal.fire({
      title: "Are you sure?",
      text: "You want to make the server status to " + status + " ?",
      type: "info",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Do it!",
      showLoaderOnConfirm: true
    }).then(result => {
      if (result.value) {
        this.props.dispatch(
          commonActions.setEnableDisable("serverstatus", id, status)
        );
        this.props.dispatch(VeeamServerActions.getAllServers());
        toast.success("Veeam Server Status Updated Successfully.");
      }
    });
  }
  componentDidMount() {
    this.props.dispatch(VeeamServerActions.getAllServers());
    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }
  openModal() {
    this.setState({ modalIsOpen: true });
    this.props.dispatch(commonActions.getAllVdcLocations());
  }
  afterOpenModal() {
    this.subtitle.style.color = "#f00";
  }
  closeModal() {
    this.setState({ modalIsOpen: false });
    this.props.dispatch(alertActions.clear());
  }

  handleValidation() {
    let fields = this.state.fields;
    let errors = {};
    let formIsValid = true;
    if (!fields["vdc_id"]) {
      formIsValid = false;
      errors["vdc_id"] = "Select valid VDC";
    }
    if (!fields["server_type"]) {
      formIsValid = false;
      errors["type"] = "Select Server Type";
    }
    if (!fields["ip_address"]) {
      formIsValid = false;
      errors["ip_address"] = "Enter Valid IP Address";
    }
    if (!fields["username"]) {
      formIsValid = false;
      errors["username"] = "Enter Valid User Name";
    }
    if (!fields["password"]) {
      formIsValid = false;
      errors["password"] = "Enter Veeam server password";
    }
    if (!fields["db_host"]) {
      formIsValid = false;
      errors["ip_address"] = "Enter Veeam DB host";
    }
    if (!fields["db_user"]) {
      formIsValid = false;
      errors["username"] = "Enter Veeam DB user";
    }
    if (!fields["db_password"]) {
      formIsValid = false;
      errors["password"] = "Enter Veeam DB password";
    }
    if (!fields["db_driver"]) {
      formIsValid = false;
      errors["db_driver"] = "Enter Veeam DB Driver";
    }
    if (fields["status"]=='') {
      formIsValid = false;
      errors["status"] = "Enter Server status";
    }
    this.setState({ errors: errors });
    if (formIsValid) {
      this.setState({ validation: true });
    } else {
      this.setState({ validation: false });
    }
    return formIsValid;
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.handleValidation()) {
      const upd = document.querySelector("#addServerFrm");
      const formData1 = serialize(upd, { hash: true });
      this.closeModal();
      this.props.dispatch(VeeamServerActions.addServer(formData1));
      this.props.dispatch(VeeamServerActions.getAllServers());
    } else {
      toast.error("Form has errors.");
    }
  }
  handleChange(field, e) {
    let fields = this.state.fields;
    fields[field] = e.target.value;
    this.setState({ fields });
    this.handleValidation();
  }
  render() {
    const vdc_locations = this.props.vdc_locations;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h2>Veeam Server</h2>
          <div>
            <button className="btn btn-success" onClick={this.openModal}>
              <i className="fa fa-plus" /> Add New
            </button>
          </div>
          <div>
            <table className="table table-bordered table-hover">
              <thead>
                <tr>
                  <th>SL</th>
                  <th>VDC Name</th>
                  <th>Server IP</th>
                  <th>Server Username</th>
                  <th>Server Password</th>
                  <th>Server Type</th>
                  <th>DB User Name</th>
                  <th>DB Password</th>
                  <th>DB Host</th>
                  <th>DB Name</th>
                  <th>DB Driver</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <VeeamServerList
                  editUpdate={this.editUpdate.bind(this)}
                  data={this.props.server_list}
                />
              </tbody>
            </table>
          </div>
        </div>
        <Modal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          contentLabel="Add Veeam Server"
        >
          <h2 ref={subtitle => (this.subtitle = subtitle)}>
            Add Veeam Server <a href="javascript:void(0)" className="float-right" onClick={this.closeModal}><i className="fa fa-times" /></a>
          </h2>

          <div>
            <div className="panel panel-default" />
            <form
              name="addServerFrm"
              id="addServerFrm"
              method="post"
              onSubmit={this.handleSubmit}
            >
              <div className="form-group">
                <label htmlFor="vdc_id">Select Vdc Name</label>
                <select
                  name="vdc_id"
                  className="form-control"
                  required
                  onChange={this.handleChange.bind(this, "vdc_id")}
                  value={this.state.fields["vdc_id"]}
                >
                  <option value="">Select</option>
                  <Vdclocoptions data={vdc_locations} />
                </select>
                <span className="bg-warning">
                  {this.state.errors["vdc_id"]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="ip_address">Veeam Server IP</label>
                <input
                  type="text"
                  className="form-control"
                  name="ip_address"
                  placeholder="Veeam Server IP"
                  required
                  onChange={this.handleChange.bind(this, "ip_address")}
                  value={this.state.fields["ip_address"]}
                />
                <span className="bg-warning">
                  {this.state.errors["ip_address"]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="username">Veeam Server User</label>
                <input
                  type="text"
                  className="form-control"
                  name="username"
                  required
                  placeholder="Veeam Server User"
                  onChange={this.handleChange.bind(this, "username")}
                  value={this.state.fields["username"]}
                />
                <span className="bg-warning">
                  {this.state.errors["username"]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="password">Veeam Server Password</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  name="password"
                  placeholder="Veeam Server Password"
                  onChange={this.handleChange.bind(this, "password")}
                  value={this.state.fields["password"]}
                />
                <span className="bg-warning">
                  {this.state.errors["password"]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="server_type">Select Type of Server</label>
                <select
                  name="server_type"
                  className="form-control"
                  required
                  onChange={this.handleChange.bind(this, "server_type")}
                  value={this.state.fields["server_type"]}
                >
                  <option value="">Select</option>
                  <option value="B">Backup</option>
                  <option value="R">Replica</option>
                </select>
                <span className="bg-warning">{this.state.errors["server_type"]}</span>
              </div>
              <div className="form-group">
                <label htmlFor="db_host">DB host name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  name="db_host"
                  placeholder="DB host name"
                  onChange={this.handleChange.bind(this, "db_host")}
                  value={this.state.fields["db_host"]}
                />
                <span className="bg-warning">
                  {this.state.errors["db_host"]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="db_user">DB username</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  name="db_user"
                  placeholder="DB Username"
                  onChange={this.handleChange.bind(this, "db_user")}
                  value={this.state.fields["db_user"]}
                />
                <span className="bg-warning">
                  {this.state.errors["db_user"]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="db_password">DB Password</label>
                <input
                  type="password"
                  required
                  className="form-control"
                  name="db_password"
                  placeholder="DB Password"
                  onChange={this.handleChange.bind(this, "db_password")}
                  value={this.state.fields["db_password"]}
                />
                <span className="bg-warning">
                  {this.state.errors["db_password"]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="db_name">DB name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  name="db_name"
                  placeholder="DB Name"
                  onChange={this.handleChange.bind(this, "db_name")}
                  value={this.state.fields["db_name"]}
                />
                <span className="bg-warning">
                  {this.state.errors["db_name"]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="db_driver">DB Driver</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  name="db_driver"
                  placeholder="DB Driver for e.g sqlsrv for ms sql server db"
                  onChange={this.handleChange.bind(this, "db_driver")}
                  value={this.state.fields["db_driver"]}
                />
                <span className="bg-warning">
                  {this.state.errors["db_driver"]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="status">Select Server Status</label>
                <select
                  name="status"
                  className="form-control"
                  required
                  onChange={this.handleChange.bind(this, "status")}
                  value={this.state.fields["status"]}
                >
                  <option value="">Select</option>
                  <option value="0">InActive</option>
                  <option value="1">Active</option>
                </select>
                <span className="bg-warning">{this.state.errors["status"]}</span>
              </div>
              <div className="form-group">
                <button
                  className="btn btn-primary "
                  disabled={!this.state.validation}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    );
  }
}

let mapStateToProps = state => ({
  server_list: state.VeeamServer.data,
  vdc_locations: state.common.data
});
const connectedVeeamServer = connect(mapStateToProps)(VeeamServer);
export { connectedVeeamServer as VeeamServer };
