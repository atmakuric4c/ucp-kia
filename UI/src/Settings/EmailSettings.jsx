import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import Swal from "sweetalert2";
import { settingsActions, alertActions } from "../_actions/";
import EmailList from "./emailsList";
import Modal from "react-modal";
import { toast } from "react-toastify";
const customStyles = {
  content: {
   
  }
};
export default class EmailSettings extends React.Component {
  componentDidMount() {
    this.props.dispatch(settingsActions.getEmailSettings());
  }
  constructor(props) {
    super(props);
    this.state = {
      modalIsOpen: false,
      fields: {
        hostname: "",
        password: "",
        email: "",
        port: "",
        sender_name: ""
      },
      errors: {},
      validation: false
    };
    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  enabeDisableEmail = (id, status) => {
    this.props.dispatch(settingsActions.enableDisableEmail(id, status));
    this.props.dispatch(settingsActions.getEmailSettings());
  };

  openModal() {
    this.setState({ modalIsOpen: true });
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
    if (!fields["hostname"]) {
      formIsValid = false;
      errors["hostname"] = "enter valid host name or ip address";
    }
    if (!fields["email"]) {
      formIsValid = false;
      errors["email"] = "enter valid Email Address";
    }
    if (!fields["password"] || fields["password"].length < 5) {
      formIsValid = false;
      errors["password"] = "cannot be empty and minimum 5 characters";
    }
    if (!fields["sender_name"] || fields["sender_name"].length < 4) {
      formIsValid = false;
      errors["sender_name"] = "Sender name minimum 4 characters";
    }
    if (!fields["port"] || fields["port"].length < 2) {
      formIsValid = false;
      errors["port"] = "Port number Cannot be empty minimum 2 digit number";
    }
    if (typeof fields["email"] !== "undefined") {
      let lastAtPos = fields["email"].lastIndexOf("@");
      let lastDotPos = fields["email"].lastIndexOf(".");
      if (
        !(
          lastAtPos < lastDotPos &&
          lastAtPos > 0 &&
          fields["email"].indexOf("@@") === -1 &&
          lastDotPos > 2 &&
          fields["email"].length - lastDotPos > 2
        )
      ) {
        formIsValid = false;
        errors["email"] = "Valid email requied";
      }
    }

    this.setState({ errors: errors });
    if (formIsValid) {
      this.setState({ validation: true });
    } else {
      this.setState({ validation: false });
    }
    return formIsValid;
  }

  handleChange(field, e) {
    let fields = this.state.fields;
    fields[field] = e.target.value;
    this.setState({ fields });
    this.handleValidation();
  }
  handleSubmit(e) {
    e.preventDefault();
    if (this.handleValidation()) {
      // alert("Form submitted");
      // this.state.validation=true;
      this.closeModal();
      this.props.dispatch(settingsActions.addEmailConfig(this.state.fields));
      this.props.dispatch(settingsActions.getEmailSettings());
    } else {
      toast.error("Form has errors.");
    }
  }
  render() {
    var email_data = this.props.email_data;
    return (
      <div className="container-fluid main-body">
      <div className="contentarea">
        <h2>Email Settings</h2>
        <div className="text-right">
          <button className="btn btn-success" onClick={this.openModal}>
            <i className="fa fa-plus" /> Add New
          </button>
        </div>
        <div className="">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Host Name</th>
                <th>Email Address</th>
                <th>Port Number</th>
                <th>Password</th>
                <th>Status</th>
                <th>Options</th>
              </tr>
            </thead>
            <tbody>
              <EmailList
                data={email_data}
                enabeDisableEmail={this.enabeDisableEmail.bind(this)}
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
          contentLabel="Example Modal"
        >
          <h2 ref={subtitle => (this.subtitle = subtitle)}>
            Add Mail Confiuration Setup <a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
          </h2>

          <div
           
          >
            <div className="panel panel-default">
              <form
                name="emailconf"
                id="emailconf"
                onSubmit={this.handleSubmit.bind(this)}
              >
                <div className="form-data">
                  <label>Host Name /IP Address :</label>
                  <input
                    type="text"
                    className="form-control"
                    name="hostname"
                    required
                    maxLength="300"
                    minLength="5"
                    onChange={this.handleChange.bind(this, "hostname")}
                    value={this.state.fields["hostname"]}
                  />
                  <span className="bg-warning">
                    {this.state.errors["hostname"]}
                  </span>
                </div>
                <div className="form-data">
                  <label>From Email Address :</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    required
                    maxLength="300"
                    minLength="5"
                    onChange={this.handleChange.bind(this, "email")}
                    value={this.state.fields["email"]}
                  />
                  <span className="bg-warning">
                    {this.state.errors["email"]}
                  </span>
                </div>
                <div className="form-data">
                  <label>Password :</label>
                  <input
                    type="text"
                    className="form-control"
                    name="password"
                    required
                    maxLength="300"
                    minLength="5"
                    onChange={this.handleChange.bind(this, "password")}
                    value={this.state.fields["password"]}
                  />
                  <span className="bg-warning">
                    {this.state.errors["password"]}
                  </span>
                </div>
                <div className="form-data">
                  <label>Sending Port Number :</label>
                  <input
                    type="text"
                    className="form-control"
                    name="port"
                    required
                    maxLength="5"
                    minLength="2"
                    onChange={this.handleChange.bind(this, "port")}
                    value={this.state.fields["port"]}
                  />
                  <span className="bg-warning">
                    {this.state.errors["port"]}
                  </span>
                </div>
                <div className="form-data">
                  <label>Sender Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="sender_name"
                    required
                    maxLength="40"
                    minLength="4"
                    onChange={this.handleChange.bind(this, "sender_name")}
                    value={this.state.fields["sender_name"]}
                  />
                  <span className="bg-warning">
                    {this.state.errors["sender_name"]}
                  </span>
                </div>
                <div className="form-data">
                  <button className="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

let mapStateToProps = state => ({
  email_data: state.emailsettings.emaildata
});
const connectedEmailSettings = connect(mapStateToProps)(EmailSettings);
export { connectedEmailSettings as EmailSettings };
