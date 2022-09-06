import React from 'react';
import { connect } from 'react-redux';
import { supportActions } from './support.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import DatatablePage from './gridview'
import PageLoader from '../PageLoader';

Modal.setAppElement("#app");
class Ticketlist extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      user: user.data,
      tickets: [],
      modalIsOpenTicket: false
    }
    this.openModalCreateTicket = this.openModalCreateTicket.bind(this)
    this.closeModalTicket = this.closeModalTicket.bind(this)
    this.createSupportTicket = this.createSupportTicket.bind(this)
  }
  createSupportTicket = e => {
    e.preventDefault();
    var form = document.querySelector("#createTicketFrm");
    var formData = serialize(form, { hash: true });
    var post = { clientid: this.state.user.clientid, user_email: this.state.user.email }
    this.props.dispatch(supportActions.createTicket(formData, post));
    this.setState({ sweetalert: null });
    this.closeModalTicket();
  }
  closeModalTicket() {
    this.setState({ modalIsOpenTicket: false });
  }
  openModalCreateTicket() {
    this.setState({ modalIsOpenTicket: true });
    this.props.dispatch(supportActions.getTicketFormData(this.state.user.clientid));
  }
  componentDidMount() {
    this.props.dispatch(supportActions.getAll(this.state.user.clientid));
  }

  render() {
    const { tickets } = this.props;
    let configdata = this.props.tickets.configdata;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
         
          <div className="row">
            <div className="col-md-6">
              <h5 className="color">Support Tickets</h5>
            </div>
            <div className="col-md-6">
              <div className="text-right mb-2">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => this.openModalCreateTicket()}
                >
                  <i className="fa fa-plus" /> Create Ticket
              </button>
              </div>
            </div>
          </div>
          {!tickets.error && tickets.loading && <em><PageLoader /></em>}
          {tickets.error && <span className="text-danger">ERROR - {tickets.error}</span>}
          {tickets.items && !tickets.loading && <DatatablePage tickets={tickets.items} />}
        </div>
        <Modal
          isOpen={this.state.modalIsOpenTicket}
          onRequestClose={this.closeModalTicket}
          contentLabel="Create Ticket">
          <h2 style={{ color: 'red' }}>
            Create Ticket <a className="float-right" href="javascript:void(0);" onClick={this.closeModalTicket}><i className="fa fa-times" /></a>
          </h2>
          <div className="col-md-12">
            <div className="panel panel-default" />
            <form
              name="createTicketFrm"
              id="createTicketFrm"
              method="post"
              onSubmit={this.createSupportTicket}
            >
              <div className="form-group row">
                <label htmlFor="COE" className='col-sm-3 col-form-label'>COE:<i className="redcolor">*</i></label>
                <div className="col-sm-9">
                  <input type="text" className="form-control color" required disabled value="Cloud" />
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="issue_type" className='col-sm-3 col-form-label'>Issue Type:<i className="redcolor">*</i></label>
                <div className="col-sm-9">
                  <select className="form-control" required name="issue_type">
                    {configdata && configdata.issue_type.map((issue, index) =>
                      <option key={index + 1} value={`${issue.issue_type}`}>{issue.issue_type}</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="priority" className='col-sm-3 col-form-label'>Ticket Priority:<i className="redcolor">*</i></label>
                <div className="col-sm-9">
                  <select className="form-control" required name="priority">
                    {configdata && configdata.priorities.map((data, index) =>
                      <option key={index + 1} value={`${data.id}`}>{data.priority}</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="Instance" className='col-sm-3 col-form-label'>Instance:<i className="redcolor">*</i></label>
                <div className="col-sm-9">
                  <select className="form-control" required name="instance">
                    {configdata && configdata.vms.map((data, index) =>
                      <option key={index + 1} value={`${data.label_name}`}>{data.label_name}</option>
                    )}
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="subject" className='col-sm-3 col-form-label'>Subject:<i className="redcolor">*</i></label>
                <div className="col-sm-9">
                  <input type="text" className="form-control" required name="subject" placeholder="Subject" />
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="description" className='col-sm-3 col-form-label'>Description:<i className="redcolor">*</i></label>
                <div className="col-sm-9">
                  <textarea type="text" className="form-control" required name="description" placeholder="Description" rows="5"></textarea>
                </div>
              </div>
              {/*<div className="form-group row">
                <label htmlFor="attach_file" className='col-sm-3 col-form-label'>Attach File:<i className="redcolor">*</i></label>
                <div className="col-sm-9">
                  <input type="file" className="form-control" name="attach_file" />
                </div>
              </div>*/}

              <div className="form-group row">
                <label className='col-sm-2 col-form-label'>&nbsp;</label>
                <div className="col-sm-10">
                  {/*  <input type="hidden" name="department_id" value='3' />
                <input type="hidden" name="type" value='1' />
                <input type="hidden" name="tickettypeid" value='2' />
                <input type="hidden" name="priority" value='618' />*/}
                  <button className="btn btn-sm btn-primary float-right" >Submit</button>
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
  const { tickets } = state;
  return {
    tickets: tickets
  };
}

const connectedTicketlist = connect(mapStateToProps)(Ticketlist);
export { connectedTicketlist as Ticketlist };