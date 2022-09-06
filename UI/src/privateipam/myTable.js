import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import TabeData from "./tabeData";
import Modal from "react-modal";
import IpTable from "./IpTable";
var serialize = require("form-serialize");
import IpamModalComponent from "./IpamModalComponent";
import { commonActions, alertActions } from "../_actions";
import { NetworkMgmtActions } from "../NetworkMgmt/NetworkMgmt.actions";
import { privateipamActions } from "./privateipam.actions";
const customStyles = {
  content: {}
};
Modal.setAppElement("#app");
class MyTable extends React.Component {
  constructor(props) {
    super(props);
    this.updatepageSize = this.updatepageSize.bind(this);
    this.state = {
      modalIsOpen: false,
      modalIsOpenIPHistory: false,
      pageOfItems: [],
      startIpAddress: "",
      endIpAddress: "",
      subnetmask: "",
      gateway: "",
      name: "network_type",
      formValid: false,
      startIp: false,
      endIp: false,
      subnet: false,
      vdc_locations: [],
      vdc_location: "",
      ip_history: [],
      searchparam: ""
    };
    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.openModalIPHistory = this.openModalIPHistory.bind(this);
    this.afterOpenModalIPHistory = this.afterOpenModalIPHistory.bind(this);
    this.closeModalIPHistory = this.closeModalIPHistory.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.keyPress = this.keyPress.bind(this);
    this.updateSearchtoparent = this.updateSearchtoparent.bind(this);
  }
  handleChange(e) {
    // console.log("ok");
    this.setState({ searchparam: e.target.value });
  }
  updateSearchtoparent = searchkey => {
    this.props.updateSearchtoparentsearchkey(searchkey);
  };
  keyPress = e => {
    if (e.keyCode == 13) {
      // console.log("value", e.target.value);
      // if (e.target.value.length > 2) {
      this.updateSearchtoparent(e.target.value);
      //  }
      // put the login here
    }
  };
  openModalIPHistory(ip) {
    this.props.dispatch(privateipamActions.getIPUsageHistory(ip.ip_address));
    this.setState({ modalIsOpenIPHistory: true });
    //alert(JSON.stringify(ip));
  }

  afterOpenModalIPHistory() {
    this.subtitle.style.color = "#f00";
  }
  closeModalIPHistory() {
    this.setState({ modalIsOpenIPHistory: false });
  }
  openModal() {
    this.setState({ modalIsOpen: true });
    // this.props.dispatch(commonActions.getAllVdcLocations());
    this.props.dispatch(NetworkMgmtActions.getAllNetworks());
  }

  afterOpenModal() {
    this.subtitle.style.color = "#f00";
  }

  closeModal() {
    this.setState({ modalIsOpen: false });
  }

  onChangePage(pageOfItems) {
    this.setState({ pageOfItems: pageOfItems });
  }
  IpadmAddRequest = e => {
    e.preventDefault();
    //  if (this.formValid) {
    var form = document.querySelector("#addIpam");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(privateipamActions.IpadmAddRequest(formData));
    this.setState({ modalIsOpen: false });
    this.props.dispatch(privateipamActions.getIpamPageData(0, 10, "", ""));
    //  } else {
    //  alert("Invalid Ip Details");
    // }
    // this.props.dispatch(ipamActions.getAll());
  };
  validateIPAddress(e) {
    const name = e.target.name;
    const value = e.target.value;
    this.setState({ [name]: value });
    var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (value.match(ipformat)) {
      this.setState({ [name]: value });
      switch (name) {
        case "startIpAddress":
          this.setState({ startIp: true });
          break;
        case "endIpAddress":
          this.setState({ endIp: true });
          break;
        case "subnetmask":
          this.setState({ subnet: true });
          break;
      }
    }
    if (this.startIp && this.endIp && this.subnet) {
      this.setState({ formValid: true });
      // console.log("For valid status" + this.formValid);
    } else {
      // console.log("Form invalid status " + this.formValid);
    }
  }
  updatepageSize(e) {
    let value = e.target.value;
    if (!isNaN(value) && value) this.props.updateParentpageSize(e.target.value);
  }

  render() {
    //console.log("MyTable render:", { props: this.props, state: this.state });
    let pages = 0;
    let ipsdata = this.props.ips.ipam.ips;
    // let vdc_locations = this.props.vdc_locations;
    let ip_history = this.props.ips.ipam.ipHistory;
    const { networkList } = this.props;
    if (this.props.data) {
      if (this.props.data.pages) {
        pages = this.props.data.pages;
      }
      return (
        <div>
          <div className="text-right">
            <button
              className="btn btn-success text-right"
              onClick={this.openModal}
            >
              <i className="fa fa-plus" /> Add IP
            </button>
          </div>
          <div className="col-sm-12 p-0">
              <div className="col-sm-3 p-0">
                <label>Totoal records: {pages}</label>
              </div>
              <div className="col-sm-3 p-0 float-left">
              <label>Select page Size <select
                  className="form-control"
                  onChange={e => this.updatepageSize(e)}
                  name="pagesize"
                >
                  <option value="10">10</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
              </label>
            </div>
            <div className="col-sm-3 p-0 float-right">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Ip Address"
                  value={this.state.value}
                  onKeyDown={event => this.keyPress(event)}
                  onChange={event => this.handleChange(event)}
                  name="searchparam"
                  value={this.state.value}
                />
              </div>
            </div>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>IP ID</th>
                <th>IP Address</th>
                <th>Gateway</th>
                <th>SubnetMask</th>
                <th>Status</th>
                <th>History</th>
              </tr>
            </thead>
            <tbody>
              <TabeData
                datadisp={this.props.data.rows}
                openModalIPHistory={this.openModalIPHistory.bind(this)}
              />
            </tbody>
          </table>
          <Modal
            isOpen={this.state.modalIsOpen}
            onAfterOpen={this.afterOpenModal}
            onRequestClose={this.closeModal}
            style={customStyles}
            contentLabel="Add IP"
          >
            <h2 ref={subtitle => (this.subtitle = subtitle)}>
              Add IP <a href="javascript:void(0)" className="float-right" onClick={this.closeModal}><i className="fa fa-times" /></a>
            </h2>
            <div className="col-md-12">
              <div className="panel panel-default" />
              <form
                name="addIpaam"
                id="addIpam"
                method="post"
                onSubmit={this.IpadmAddRequest}
              >
                <div className="form-group">
                  <label htmlFor="startIpAddress">Start IP Address</label>
                  <input
                    type="text"
                    className="form-control"
                    name="startIpAddress"
                    required
                    onChange={event => this.validateIPAddress(event)}
                    placeholder="Enter Starting IP Address example : 192.168.1.2"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endIpAddress">End IP Address</label>
                  <input
                    type="text"
                    className="form-control"
                    name="endIpAddress"
                    required
                    onChange={event => this.validateIPAddress(event)}
                    placeholder="Enter Ending IP Address example : 192.168.1.254"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="subnetmask">Subnet mask</label>
                  <input
                    type="text"
                    className="form-control"
                    name="subnetmask"
                    required
                    onChange={event => this.validateIPAddress(event)}
                    placeholder="Enter subnet mask IP Address example :255.255.255.0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gateway">Gateway</label>
                  <input
                    type="text"
                    className="form-control"
                    name="gateway"
                    required
                    onChange={event => this.validateIPAddress(event)}
                    placeholder="Enter Gateway IP Address example :192.168.1.1"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="gateway">Select Network</label>
                  <select
                    className="form-control"
                    name="network_id"
                    required
                    onChange={event => this.validateIPAddress(event)}
                  >
                    <IpamModalComponent data={networkList} />
                  </select>
                </div>

                <div className="form-group">
                  <button className="btn btn-success">Submit</button>
                </div>
              </form>
            </div>
          </Modal>

          <Modal
            isOpen={this.state.modalIsOpenIPHistory}
            onAfterOpen={this.afterOpenModalIPHistory}
            onRequestClose={this.closeModalIPHistory}
            style={customStyles}
            contentLabel="IP History"
          >
            <h2 ref={subtitle => (this.subtitle = subtitle)}>
              IP History <a href="javascript:void(0)" className="float-right" onClick={this.closeModalIPHistory}><i className="fa fa-times" /></a>
            </h2>
            <div className="col-md-12">
              <div className="panel panel-default">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>id</th>
                      <th>IP Address</th>
                      <th>Vmid</th>
                      <th>opf</th>
                      <th />
                      <th>Client</th>
                      <th>Note</th>
                      <th>Updateddate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <IpTable history_data={ip_history} />
                  </tbody>
                </table>
              </div>
            </div>
          </Modal>
        </div>
      );
    } else {
      return <div>Loading</div>;
    }
  }
}

const mapStateToProps = state => ({
  pageSize: state.pageSize,
  ips: state,
  ipHistory: state.ipam.ipHistory,
  networkList: state.NetworkMgmt.data
});

export default connect(mapStateToProps)(MyTable);
