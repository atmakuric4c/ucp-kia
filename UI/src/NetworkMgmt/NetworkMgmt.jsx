import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { alertActions, commonActions } from "../_actions/";
import { NetworkMgmtActions } from "./NetworkMgmt.actions";
import NetworkList from "./NetworkList";
import Modal from "react-modal";
import Vdclocoptions from "./vdclocoptions";
var serialize = require("form-serialize");
import Swal from "sweetalert2";
import { toast } from 'react-toastify';

export default class NetworkMgmt extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalIsOpen: false,
      fields: {
        vdc_id: "",
        display_name: "",
        network_name: "",
        firewall_vm_name: "",
        type: "",
        //public_ip: "",
        external_interface: "",
        internal_interface: "",
        username: "",
        password: "",
        port: "",
        private_ip_start: "",
        private_ip_end: "",
        private_ip_gateway: "",
        private_ip_subnetmask: ""
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
      text: "You sure make network " + status + " ?",
      type: "info",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Do it!",
      showLoaderOnConfirm: true
    }).then(result => {
      //console.log(result.value);
      if (result.value) {
        this.props.dispatch(
          commonActions.setEnableDisable("networkstatus", id, status)
        );
        this.props.dispatch(NetworkMgmtActions.getAllNetworks());
        toast.success("NETWORK Status Updated Successfully.");
      }
    });
  }
  componentDidMount() {
    this.props.dispatch(NetworkMgmtActions.getAllNetworks());
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
    //Name
    if (!fields["display_name"]) {
      formIsValid = false;
      errors["display_name"] = "Enter Valid Display Name";
    }

    if (!fields["network_name"]) {
      formIsValid = false;
      errors["network_name"] = "Enter Valid Network Name";
    }
    // if (!fields["public_ip"]) {
    //   formIsValid = false;
    //   errors["public"] = "Enter Valid Public IP";
    // }
    if (!fields["type"]) {
      formIsValid = false;
      errors["type"] = "Select Type";
    }
    if (!fields["private_ip_start"]) {
      formIsValid = false;
      errors["private_ip_start"] = "Enter Valid Private Start IP Address";
    }
    if (!fields["private_ip_end"]) {
      formIsValid = false;
      errors["private_ip_end"] = "Enter valid private IP End address";
    }
    if (!fields["private_ip_gateway"]) {
      formIsValid = false;
      errors["private_ip_gateway"] = "Enter Private IP gateway";
    }
    if (!fields["private_ip_subnetmask"]) {
      formIsValid = false;
      errors["private_ip_subnetmask"] = "Enter valid private IP subnet mask";
    }
    if (!fields["firewall_vm_name"]) {
      formIsValid = false;
      errors["firewall_vm_name"] = "Enter valid firewall vm name";
    }
    // if (!fields["public_ip"]) {
    //   formIsValid = false;
    //   errors["public_ip"] = "Enter valid Public IP Address";
    // }
    if (!fields["external_interface"]) {
      formIsValid = false;
      errors["external_interface"] = "Enter valid external interface";
    }
    if (!fields["port"]) {
      formIsValid = false;
      errors["port"] = "Enter valid Port Number";
    }
    if (!fields["internal_interface"]) {
      formIsValid = false;
      errors["internal_interface"] = "Enter valid Internal interface";
    }
    if (!fields["vdc_id"]) {
      formIsValid = false;
      errors["vdc_id"] = "Select valid VDC";
    }
    if (!fields["username"]) {
      formIsValid = false;
      errors["username"] = "Enter Valid username address";
    }
    if (!fields["password"] || fields["password"].length < 5) {
      formIsValid = false;
      errors["password"] = "cannot be empty and minimum 5 characters";
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
      // alert("Form submitted");
      // this.state.validation = true;
      const upd = document.querySelector("#addNetworkStoreFrm");
      const formData1 = serialize(upd, { hash: true });
      this.closeModal();
      this.props.dispatch(NetworkMgmtActions.addNetwork(formData1));
      this.props.dispatch(NetworkMgmtActions.getAllNetworks());
    } else {
      toast.error("Form has errors.");
    }
  }
  handleChange(field, e) {
    let fields = this.state.fields;
    fields[field] = e.target.value;
    this.setState({ fields });
    //console.log(this.state.errors);
    this.handleValidation();
  }
  render() {
    const vdc_locations = this.props.vdc_locations;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h2>Network Mgmt</h2>
          <div>
            <button className="btn btn-success" onClick={this.openModal}>
              <i className="fa fa-plus" /> Add New
            </button>
          </div>
          <div>
            <table className="table table-bordered table-hover">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Display Name</th>
                  <th>Network Name</th>
                  <th>Firewall VM Name</th>
                  <th>Type</th>
                  {/* <th>Public Ip</th> */}
                  {/* <th>Ext Interface</th>
                  <th>Int Interface</th> */}
                  <th>User Name</th>
                  <th>Port</th>
                  {/* <th>Private Ip Start</th>
                  <th>Private IP End</th> */}
                  <th>Private IP Gateway</th>
                  <th>Private IP Subnetmask</th>
                  <th>Added date</th>
                  <th>Status </th>
                  <th>Options</th>
                </tr>
              </thead>
              <tbody>
                <NetworkList
                  editUpdate={this.editUpdate.bind(this)}
                  data={this.props.network_list}
                />
              </tbody>
            </table>
          </div>
        </div>
        <Modal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          contentLabel="Add Network"
        >
          <h2 ref={subtitle => (this.subtitle = subtitle)}>
            Add Network <a href="javascript:void(0)" className="float-right" onClick={this.closeModal}><i className="fa fa-times" /></a>
          </h2>

          <div>
            <div className="panel panel-default" />
            <form
              name="addNetworkStoreFrm"
              id="addNetworkStoreFrm"
              method="post"
              onSubmit={this.handleSubmit}
            >
              <div className="form-group">
                <label htmlFor="vdc_id">Select Vdc Location</label>
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
                <label htmlFor="display_name">Display Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="display_name"
                  placeholder="Display Name"
                  required
                  onChange={this.handleChange.bind(this, "display_name")}
                  value={this.state.fields["display_name"]}
                />
                <span className="bg-warning">
                  {this.state.errors["display_name"]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="network_name">Network Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="network_name"
                  required
                  placeholder="Network Name"
                  onChange={this.handleChange.bind(this, "network_name")}
                  value={this.state.fields["network_name"]}
                />
                <span className="bg-warning">
                  {this.state.errors["network_name"]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="firewall_vm_name">Firewall VM name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  name="firewall_vm_name"
                  placeholder="Firewall VM Name"
                  onChange={this.handleChange.bind(this, "firewall_vm_name")}
                  value={this.state.fields["firewall_vm_name"]}
                />
                <span className="bg-warning">
                  {this.state.errors["firewall_vm_name"]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="type">Select Type of Firewall</label>
                <select
                  name="type"
                  className="form-control"
                  required
                  onChange={this.handleChange.bind(this, "type")}
                  value={this.state.fields["type"]}
                >
                  <option value="">Select</option>
                  <option value="1">CISCO</option>
                  <option value="2">Fortigate</option>
                </select>
                <span className="bg-warning">{this.state.errors["type"]}</span>
              </div>
              {/* <div className="form-group">
                <label htmlFor="public_ip">Public IP</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  name="public_ip"
                  placeholder="Public IP Address"
                  onChange={this.handleChange.bind(this, "public_ip")}
                  value={this.state.fields["public_ip"]}
                />
                <span className="bg-warning">
                  {this.state.errors["public_ip"]}
                </span>
              </div> */}
              <div className="form-group">
                <label htmlFor="external_interface">External Interface</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  name="external_interface"
                  placeholder="External Interface"
                  onChange={this.handleChange.bind(this, "external_interface")}
                  value={this.state.fields["external_interface"]}
                />
                <span className="bg-warning">
                  {this.state.errors["external_interface"]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="internal_interface">External Interface</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  name="internal_interface"
                  placeholder="Internal Interface"
                  onChange={this.handleChange.bind(this, "internal_interface")}
                  value={this.state.fields["internal_interface"]}
                />
                <span className="bg-warning">
                  {this.state.errors["internal_interface"]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="username">User Name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  name="username"
                  placeholder="User name"
                  onChange={this.handleChange.bind(this, "username")}
                  value={this.state.fields["username"]}
                />
                <span className="bg-warning">
                  {this.state.errors["username"]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  required
                  className="form-control"
                  name="password"
                  placeholder="Password"
                  onChange={this.handleChange.bind(this, "password")}
                  value={this.state.fields["password"]}
                />
                <span className="bg-warning">
                  {this.state.errors["password"]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="port">Port Number</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  name="port"
                  placeholder="Port Number"
                  onChange={this.handleChange.bind(this, "port")}
                  value={this.state.fields["port"]}
                />
                <span className="bg-warning">{this.state.errors["port"]}</span>
              </div>
               <div className="form-group">
                <label htmlFor="private_ip_start">Private Ip start</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  name="private_ip_start"
                  placeholder="Private Ip start"
                  onChange={this.handleChange.bind(this, "private_ip_start")}
                  value={this.state.fields["private_ip_start"]}
                />
                <span className="bg-warning">
                  {this.state.errors["private_ip_start"]}
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="private_ip_end">Private Ip End</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  name="private_ip_end"
                  placeholder="Private Ip End"
                  onChange={this.handleChange.bind(this, "private_ip_end")}
                  value={this.state.fields["private_ip_end"]}
                />
                <span className="bg-warning">
                  {this.state.errors["private_ip_end"]}
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="private_ip_gateway">Private Ip gateway</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  name="private_ip_gateway"
                  placeholder="Private Ip gateway"
                  onChange={this.handleChange.bind(this, "private_ip_gateway")}
                  value={this.state.fields["private_ip_gateway"]}
                />
                <span className="bg-warning">
                  {this.state.errors["private_ip_gateway"]}
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="private_ip_subnetmask">
                  Private Ip Subnetmask
                </label>
                <input
                  type="text"
                  required
                  className="form-control"
                  name="private_ip_subnetmask"
                  placeholder="Private Ip Subnetmask"
                  onChange={this.handleChange.bind(
                    this,
                    "private_ip_subnetmask"
                  )}
                  value={this.state.fields["private_ip_subnetmask"]}
                />
                <span className="bg-warning">
                  {this.state.errors["private_ip_subnetmask"]}
                </span>
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
  network_list: state.NetworkMgmt.data,
  vdc_locations: state.common.data
});
const connectedNetworkMgmt = connect(mapStateToProps)(NetworkMgmt);
export { connectedNetworkMgmt as NetworkMgmt };
