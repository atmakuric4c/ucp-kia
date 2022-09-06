import React from "react";
import Link from "react-dom";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import Swal from "sweetalert2";
import { vmlistActions } from "../_components/Vmlist/vmlist.actions";
import Modal from "react-modal";
import { alertActions } from "../_actions";
import { vcenterlogActions } from "./vcenterlog.actions";
import TaskDisplay from "./taskDisplay";
import EventDisplay from "./eventsDisplay";
import PageLoader from '../_components/PageLoader';

const customStyles = {
  content: {
    width: "80% !important"
  }
};
export default class Vcenterlogs extends React.Component {
  componentDidMount() {
    this.props.dispatch(vmlistActions.getAll(1));
    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }
  constructor(props) {
    super(props);
    this.state = {
      modalIsOpen: false,
      actiontype: ""
    };
  }
  openModal = (type, vmid) => {
    this.setState({ modalIsOpen: true });
    this.setState({ actiontype: type });
    switch (type) {
      case "task":
        this.props.dispatch(vcenterlogActions.getAllLogs(1, vmid));
        break;
      case "event":
        this.props.dispatch(vcenterlogActions.getAllLogs(2, vmid));
        break;
    }
  };
  afterOpenModal() {
    this.subtitle.style.color = "#f00";
  }
  closeModal() {
    this.setState({ modalIsOpen: false });
  }

  render() {
    //console.log("-----"+JSON.stringify(this.props));
    const { vmlist, Vcenterloginfo } = this.props;
    let { actiontype } = this.state;
    // console.log(Vcenterloginfo);
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h2>vCenter Logs</h2>
          <div className="text-right" />
          {!vmlist.error && (vmlist.loading || vmlist.items=='') && <PageLoader/>}
          {vmlist.error && (
            <span className="text-danger">ERROR: {vmlist.error}</span>
          )}
          {vmlist.items && !vmlist.loading && (
            <div className="tableresp table-responsive">
              <table className="table table-bordered table-hover" id="vmlist">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>VM Name</th>
                    <th>IP Address</th>
                    <th>CPU/ RAM/ HDD</th>
                    <th>OS /OS Type</th>
                    <th>Status</th>
                    <th>Tasks</th>
                    <th>Events</th>
                  </tr>
                </thead>
                <tbody>
                  {vmlist.items && vmlist.items.map((vmData, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{vmData.name} </td>
                      <td>{vmData.ip_address} </td>
                      <td>
                        {vmData.cpu_count} /{vmData.ram} MB/{vmData.hdd}GB
                      </td>
                      <td>
                        {vmData.os} /{vmData.os_type}
                      </td>
                      <td>{vmData.status} </td>
                      <td>
                        <button
                          className="btn btn-success"
                          onClick={() => this.openModal("task", vmData.id)}
                        >
                          Tasks
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn btn-success"
                          onClick={() => this.openModal("event", vmData.id)}
                        >
                          Events
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Modal
                isOpen={this.state.modalIsOpen}
                onAfterOpen={this.afterOpenModal}
                onRequestClose={this.closeModal}
                contentLabel="vcenter Logs"
                style={customStyles}
                className="metrics"
              >
                <h2 ref={subtitle => (this.subtitle = subtitle)}>
                  VCenter Logs <a href="javascript:void(0)" className="float-right" onClick={this.closeModal}><i className="fa fa-times" /></a>
                </h2>

                <div>
                  <div className="panel panel-default">
                    {actiontype == "task" && (
                      <div key="taskblock">
                        {Vcenterloginfo.data && (
                          <div key="taskdisplay">
                            <TaskDisplay key='modal-1' tasksdata={Vcenterloginfo.data.data} />
                          </div>
                        )}
                      </div>
                    )}
                    {actiontype == "event" && (
                      <div key="eventblock">
                        {Vcenterloginfo.data && (
                          <div key="eventdisplay">
                            <EventDisplay key='modal-2' tasksdata={Vcenterloginfo.data.data} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Modal>
            </div>
          )}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { vmlist, Vcenterloginfo } = state;
  return {
    vmlist,
    Vcenterloginfo
  };
}
const connectedVcenterlogs = connect(mapStateToProps)(Vcenterlogs);
export { connectedVcenterlogs as Vcenterlogs };
