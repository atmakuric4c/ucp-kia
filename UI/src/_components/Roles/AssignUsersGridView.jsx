import React from "react";
import { connect } from "react-redux";
import Modal from "react-modal";
import { ApprovalMatrixActions } from "./Roles.actions";
import { MDBDataTable } from "mdbreact";
import { toast } from "react-toastify";
var serialize = require("form-serialize");
import SweetAlert from "react-bootstrap-sweetalert";
import {
  authHeader,
  ucpEncrypt,
  ucpDecrypt,
  ucpEncryptForUri,
  ucpDecryptForUri,
} from "../../_helpers";
import config from "config";
import { validation } from "../../_helpers/passwordPolicy";
import Select from "react-select";
import { default as ReactSelect } from "react-select";
import { components } from "react-select";


Modal.setAppElement("#app");
class AssignUsersDataTablePage extends React.Component {
  constructor(props) {
    super(props);

    let user = JSON.parse(localStorage.getItem("user"));

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);

    this.openEditModal = this.openEditModal.bind(this);
    this.closeEditModal = this.closeEditModal.bind(this);

    this.openModalDelete = this.openModalDelete.bind(this);
    this.closeModalDelete = this.closeModalDelete.bind(this);

    this.values = [];

    this.bindField = this.bindField.bind(this);
    this.matricesRows = [];
    this.matricesRows = [];
    if (
      this.props.ApprovalMatrices &&
      this.props.ApprovalMatrices.data &&
      this.props.ApprovalMatrices.data.data &&
      this.props.ApprovalMatrices.data.data.length > 0
    ) {
      this.props.ApprovalMatrices.data.data.map((val, index) => {
        this.matricesRows[this.matricesRows.length] = {
          sno: this.matricesRows.length + 1,
          Role_name: val.role_name,
          Users: (
            <span>
              <ul>
                {val.user_assignd &&
                  val.user_assignd.length > 0 &&
                  val.user_assignd.map((item, index) => (
                    <li key={index}>
                      {item.user_email}
                    </li>
                  ))}
              </ul>
            </span>
          ),
          action: (
            <div>
              <span
                className="cursor-pointer mr-3"
                onClick={() => this.openEditModal(val)}
              >
                <i className="fa fa-edit"></i>{" "}
              </span>
              <span
                className="cursor-pointer"
                onClick={() => this.openModalDelete(val)}
              >
                <i class="fa fa-trash" aria-hidden="true"></i>{" "}
              </span>
            </div>
          ),
        };
      });
    }

    this.state = {
      user: user.data,
      isOpenUserModal: false,
      assignModalOpen: false,
      clientid: user.data.clientid,
      client_master_id: user.data.client_master_id,
      user_role: user.data.user_role,
      user_id: user.data.id,
      profiles: [],
      userDetails: [],
      userPassword: "",
      userCPassword: "",
      userMobileNo: "",
      modalIsOpen: false,
      modalEditOpen: false,
      modalIsOpenEdituser: false,
      isActiveUserTabActive: true,
      questions: [],
      viewAddQuestions: 0,
      viewEditQuestions: 0,
      profile_id: null,
      ApprovalLevelsData: [],
      editDetails: {},
      isEditSaveInprogress: false,
      addDetails: {},
      isAddSaveInprogress: false,
      modalDelete: false,
      RoleList: [],
      ModuleList: [],
      clientList: [],
      editClientList: [],
      subscriptionList: [],
      resourceGroupsList: [],
      BuUsersData: [],
      BuUsersDataMod: [],
      matricesData: {
        columns: [
          {
            label: "S. No.",
            field: "sno",
          },
          {
            label: "Role",
            field: "Role_name",
          },
          {
            label: "Users",
            field: "Users",
          },
          {
            label: "Action",
            field: "action",
          },
        ],
        rows: this.matricesRows,
      },
      userPermissions: [
        {
          id: 1,
          name: "Read",
        },
        {
          id: 2,
          name: "Write",
        },
        {
          id: 3,
          name: "Delete",
        },
      ],
    };
    this.reactSelectHandleChange = this.reactSelectHandleChange.bind(this);
  }

  reactSelectHandleChange = (selected) => {
    this.setState({
      optionSelected: selected,
    });

    let mapped_users = [];
    let mapped_user_ids = [];

    if (selected.length > 0) {
      let opt;
      for (var i = 0, iLen = selected.length; i < iLen; i++) {
        opt = selected[i];

        if (opt.value != "") {
          mapped_users.push({ user_id: opt.value });
          mapped_user_ids.push(opt.value);
        }
      }
    }
    if (this.state.modalIsOpenEditApprovalMatrix == true) {
      let editDetails = this.state.editDetails;
      editDetails["mapped_users"] = mapped_users;
      editDetails.mapped_user_ids = mapped_user_ids;
      this.setState((prevState) => ({
        editDetails: editDetails,
      }));
    } else {
      this.setState({
        mapped_users: mapped_users,
        mapped_user_ids: mapped_user_ids,
      });
    }
  };

  bindField(e) {
    let target_name = e.target.name;
    let target_value = e.target.value;

    setTimeout(() => {
      let mapped_users = [];
      if (target_name == "mapped_users") {
        var select = document.getElementById("mapped_users");
        var options = select && select.options;
        var opt;

        for (var i = 0, iLen = options.length; i < iLen; i++) {
          opt = options[i];

          if (opt.selected && opt.value != "") {
            mapped_users.push({ user_id: opt.value });
          }
        }
      }
      if (this.state.modalIsOpenEditApprovalMatrix == true) {
        let editDetails = this.state.editDetails;
        if (target_name == "mapped_users") {
          editDetails[target_name] = mapped_users;
        } else {
          editDetails[target_name] = target_value;
        }
        this.setState((prevState) => ({
          editDetails: editDetails,
        }));
      } else {
        let addDetails = this.state.addDetails;
        if (target_name == "mapped_users") {
          addDetails[target_name] = mapped_users;
        } else {
          addDetails[target_name] = target_value;
        }
        this.setState((prevState) => ({
          addDetails: addDetails,
        }));
      }
    }, 100);
  }

  hideDeletePopup() {
    this.setState({
      modalDelete: false,
    });
  }



  deleteHandle() {
    $(".sweet-alert")
      .find(".btn-danger")
      .prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled", true);

    let item = this.state.selectedItem;
    let formdata = {
      user_id: this.state.user_id,
      user_role_id: item.role_id,
    };
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formdata)
    };
    return fetch(`${config.apiUrl}/secureApi/roles/deleteUserRole?noencrypt=1`, requestOptions)
      .then(res => res.json())
      .then((data) => {
        if (data.status == "success") {
          toast.success("User Role deleted successfully !");
          this.props.dispatch(ApprovalMatrixActions.getAllAssignUsers({}));
        }
        else {
          toast.error((data.message ? data.message : "Unable to Delete User Role!"));
          this.props.dispatch(ApprovalMatrixActions.getAllAssignUsers({}));
        }

        this.setState({
          modalDelete: false
        });
      })
      .catch(console.log)

  }

  openModal() {
    this.setState({ modalIsOpen: true });
  }

  closeModal() {
    this.setState({ modalIsOpen: false });
  }

  updatedMappedUsers = (aEvent) => {
    let target = aEvent.target,
      { value, checked } = target,
      { clientList, mapped_user_assignd_ids, editDetails,
        editClientList } = this.state;

    if (checked) {
      mapped_user_assignd_ids.push(value)
    }
    else {
      mapped_user_assignd_ids = mapped_user_assignd_ids.reduce(
        (r, v) => v !== parseInt(value) ? r.concat(v) : r, []
      )
    }
    editDetails.mapped_user_assignd_ids = mapped_user_assignd_ids;

    editClientList = (clientList || []).map(item => {
      item.isChecked = mapped_user_assignd_ids.indexOf(item.id) > -1;
      return item
    });

    this.setState({
      modalEditOpen: true,
      editDetails,
      mapped_user_assignd_ids,
      editClientList
    });
  }

  openEditModal(item) {
    let clientList = this.state.clientList,
      mapped_user_assignd_ids = item.mapped_user_assignd_ids,
      editClientList = (clientList || []).map(item => {
        item.isChecked = mapped_user_assignd_ids.indexOf(item.id) > -1;
        return item
      });

    this.setState({
      modalEditOpen: true,
      editDetails: JSON.parse(JSON.stringify(item)),
      mapped_user_assignd_ids,
      editClientList
    });
  }

  closeEditModal() {
    this.setState({ modalEditOpen: false });
  }

  openModalDelete(item) {
    // this.setState({editDetails: JSON.parse(JSON.stringify(item))});
    // this.deleteHandle(item)
    this.setState({ modalDelete: true });
    this.setState({ selectedItem: item });
  }

  closeModalDelete() {
    this.setState({ modalDelete: false });
  }

  addRole = (e) => {
    e.preventDefault();
    var form = document.querySelector("#addRole");
    var formData = serialize(form, { hash: true });
    if (formData.role_name)
      if (!formData.role_name) {
        toast.warn("Please enter role Name");
        return;
      }

    let addDetails = this.state.addDetails,
      arr = this.state.ModuleList;
    addDetails.user_id = this.state.user_id;
    addDetails.record_status = 1;
    addDetails.role_name = formData.role_name;

    let readPermissions = formData.read_permission,
      writePermission = formData.write_permission,
      deletePermission = formData.delete_permission;

    addDetails.assign_permissions = arr.map((item) => {
      return {
        module_id: item.id,
        read_permission:
          readPermissions != undefined
            ? readPermissions.includes(item.id + "")
              ? 1
              : 0
            : 0,
        write_permission:
          writePermission != undefined
            ? writePermission.includes(item.id + "")
              ? 1
              : 0
            : 0,
        delete_permission:
          deletePermission != undefined
            ? deletePermission.includes(item.id + "")
              ? 1
              : 0
            : 0,
      };
    });

    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(addDetails),
    };

    fetch(
      `${config.apiUrl}/secureApi/roles/saveRole?noencrypt=1`,
      requestOptions
    ).then((response) => {
      response.text().then((text) => {
        let res = JSON.parse(text);
        if (res.status == "error") {
          toast.warning(res.message);
        }
        if (res.status == "success") {
          toast.success(res.message);
          this.closeModal();
          this.props.dispatch(ApprovalMatrixActions.getAllRoles({}));
        }
      });
    });
  };

  assignRole = (e) => {
    e.preventDefault();
    var form = document.querySelector("#assignRole");
    var formData = serialize(form, { hash: true });
    if (!formData.role_id) {
      toast.warn("Please enter role role_id");
      return;
    }


    let addDetails = this.state.addDetails;
    console.log("form data", formData);
    let arr = formData.user_ids;
    addDetails.user_id = this.state.user_id;
    addDetails.record_status = 1;
    addDetails.role_id = formData.role_id;
    addDetails.assign_roles = arr.map((item) => {
      console.log('UserIDS', item)
      return {
        client_user_id: item
      }
    });
    console.log("addDetails --- ", addDetails);

    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      // body: JSON.stringify(ucpEncrypt(addDetails)),
      body: JSON.stringify(addDetails),
    };

    fetch(
      `${config.apiUrl}/secureApi/roles/saveUserRole?noencrypt=1`,
      requestOptions
    ).then((response) => {
      response.text().then((text) => {
        let res = JSON.parse(text);
        console.log("===res:", res)
        if (res.status == "error") {
          toast.warning(res.message)
        }
        if (res.status == "success") {
          toast.success(res.message);
          this.closeModal();
          this.props.dispatch(ApprovalMatrixActions.getAllAssignUsers({}));
        }
      });
    });
  };

  editAssignRole = e => {
    e.preventDefault();
    var form = document.querySelector("#editAssignRole");
    var formData = serialize(form, { hash: true });
    let editDetails = this.state.editDetails;

    this.setState({
      isEditSaveInprogress: true
    });
    let arr = formData.user_ids;
    editDetails.user_id = this.state.user_id;
    editDetails.role_id = formData.role_id;
    editDetails.id = formData.role_id;
    editDetails.assign_roles = arr.map((item) => {
      console.log('UserIDS', item)
      return {
        client_user_id: item
      }
    });
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(editDetails),
    };

    fetch(`${config.apiUrl}/secureApi/roles/saveUserRole?noencrypt=1`, requestOptions).then(response => {
      response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

        this.setState({
          isEditSaveInprogress: false
        });
        if (response.ok) {
          var result = (data.value ? data.value : data)
          console.log("saveAssignUsers result --- ", result);
          if (result.status == "success") {
            toast.success(result.message);
            this.setState(prevState => ({
              editDetails: []
            }));
            this.props.dispatch(ApprovalMatrixActions.getAllAssignUsers({}));
          } else {
            toast.error(result.message);
          }
        }
        else {
          toast.error("The operation did not execute as expected. Please raise a ticket to support");
        }
      });
    });
  };

  componentDidMount() {
    this.getRoleList();
    this.getModules();
    this.getUsers();
  }

  getRoleList() {
    var frmData = {
      record_status: "1",
    };

    const requestOptions = {
      method: "GET",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    };

    return fetch(
      `${config.apiUrl}/secureApi/roles/list?noencrypt=1`,
      requestOptions
    ).then((response) => {
      response.text().then((text) => {
        let res = JSON.parse(text).data || [];
        this.setState({
          RoleList: res,
        });
      });
    });
  }

  getModules() {
    const requestOptions = {
      method: "GET",
      headers: { ...authHeader(), "Content-Type": "application/json" },
    };

    return fetch(
      `${config.apiUrl}/secureApi/module/list?noencrypt=1`,
      requestOptions
    ).then((response) => {
      response.text().then((text) => {
        let res = JSON.parse(text).data;
        this.setState({
          ModuleList: res,
        });
      });
    });
  }

  getUsers() {
    const requestOptions = {
      method: "GET",
      headers: { ...authHeader(), "Content-Type": "application/json" }
    };

    return fetch(`${config.apiUrl}/secureApi/user/getAllClientUsers?noencrypt=1`, requestOptions).then(
      (response) => {
        response.text().then((text) => {
          let res = JSON.parse(text).data;
          let val = res[0].display_name;
          this.setState({
            clientList: res,
          });
        });
      }
    );
  }

  render() {
    const { user, ApprovalMatrices } = this.props;
    const { userPermissions, ModuleList, clientList, editClientList } = this.state;

    const regex = /(<([^>]+)>)/gi;
    return (
      <div>
        <div className="row">
          <div className="col-md-12 mb-2">
            <h5 className="color">Assign Users Role Management</h5>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="text-right">
              <button
                className="btn btn-sm btn-primary mr-3"
                onClick={this.openModal}
              >
                {" "}
                <i className="fa fa-plus" /> Assign Roles
              </button>
            </div>
            <br />
          </div>
        </div>

        <div className="col-md-12">
          <MDBDataTable striped hover data={this.state.matricesData} />
        </div>

        {/* ADD ROLE */}
        <Modal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          contentLabel="Add Role Modal"
        >
          <h2 style={{ color: "red" }}>
            Assign User Role{" "}
            <span
              className="float-right cursor-pointer"
              onClick={this.closeModal}
            >
              <i className="fa fa-times" />
            </span>
          </h2>

          <div className="col-md-12">
            <div className="panel panel-default" />
            <form
              name="assignRole"
              id="assignRole"
              method="post"
              onSubmit={this.assignRole}
            >
              <fieldset className="fieldset-wrapper">
                <legend className="fieldset-legend color">Assign Role</legend>
                <div className="form-group">
                  <label htmlFor="role_name">
                    Role<span className="star-mark">*</span>
                  </label>
                  <select
                    className="form-control"
                    required
                    name="role_id"
                    value={this.state.addDetails.bu_id}
                  >
                    <option value="">--SELECT--</option>
                    {this.state.RoleList.map((item, index) => (
                      <option value={item.id} key={index}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="bu_id">
                    Users<span className="star-mark">*</span>
                  </label>
                  {clientList.map((item, i) => (
                    <div class="row" style={{
                      margin: "10px"
                    }}>
                      <div class="column">
                        <tr key={i}>
                          <td>

                            <div class="checkbox checkbox-circle checkbox-color-scheme" style={{ marginRight: "5px" }}>
                              <label class="checkbox-checked">
                                <input
                                  type="checkbox"
                                  value={item.id}
                                  name="user_ids[]"
                                />
                              </label>
                            </div>
                          </td>
                          <td>{item.email}</td>
                        </tr>

                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>

              <div className="form-group">
                <div style={{ float: "right" }}>
                  <button
                    className="btn btn-sm btn-primary mr-3"

                    onClick={this.closeModal}
                  >
                    {" "}
                  Cancel
                </button>
                  <button className="btn btn-sm btn-primary  ">
                    Submit
                </button>
                </div>
              </div>
            </form>
          </div>
        </Modal>

        {/* EDIT ROLE */}
        <Modal
          isOpen={this.state.modalEditOpen}
          onRequestClose={this.closeEditModal}
          contentLabel="Edit Role Modal"
        >
          <h2 style={{ color: "red" }}>
            Edit Assign Role{" "}
            <span
              className="float-right cursor-pointer"
              onClick={this.closeEditModal}
            >
              <i className="fa fa-times" />
            </span>
          </h2>

          <div className="col-md-12">
            <div className="panel panel-default" />
            <form
              name="editAssignRole"
              id="editAssignRole"
              method="post"
              onSubmit={this.editAssignRole}
            >
              <fieldset className="fieldset-wrapper">
                <legend className="fieldset-legend color">Edit Assign Role</legend>
                <div className="form-group">
                  <label htmlFor="role_name">
                    Role<span className="star-mark">*</span>
                  </label>
                  <select
                    className="form-control"
                    required
                    name="role_id"
                    defaultValue={this.state.editDetails.role_id}
                    onChange={this.bindField}
                  >
                    <option value="">--SELECT--</option>
                    {this.state.RoleList.map((item, index) => (
                      <option value={item.id} key={index}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="bu_id">
                    Users<span className="star-mark">*</span>
                  </label>
                  {editClientList.map((item, i) => (
                    <div class="row" style={{
                      margin: "10px"
                    }}>
                      <div class="column">
                        <tr key={i}>
                          <td>

                            <div class="checkbox checkbox-circle checkbox-color-scheme" style={{ marginRight: "5px" }}>
                              <label class="checkbox-checked">
                                <input
                                  type="checkbox"
                                  value={item.id}
                                  defaultChecked={item.isChecked}
                                  onChange={this.updatedMappedUsers.bind(this)}
                                  name="user_ids[]"
                                />
                              </label>
                            </div>
                          </td>
                          <td>{item.email}</td>
                        </tr>

                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>

              <div className="form-group">
                <div style={{ float: "right" }}>
                  <button
                    className="btn btn-sm btn-primary mr-3"

                    onClick={this.closeEditModal}
                  >
                    {" "}
                  Cancel
                </button>
                  <button className="btn btn-sm btn-primary  ">
                    Update
                </button>
                </div>
              </div>
            </form>
          </div>
        </Modal>

        {/* Confirmation Modal  */}
        {this.state.modalDelete && (
          <SweetAlert
            warning
            showCancel
            confirmBtnText="Delete User Role"
            confirmBtnBsStyle="danger"
            cancelBtnBsStyle="default"
            title="Are you sure?"
            onConfirm={() => this.deleteHandle()}
            onCancel={this.hideDeletePopup.bind(this)}
          ></SweetAlert>
        )}
      </div>
    );
  }
}
function mapStateToProps(state) {
  const { ApprovalMatrices } = state;
  return {
    ApprovalMatrices: ApprovalMatrices,
  };
}

export default connect(mapStateToProps)(AssignUsersDataTablePage);
