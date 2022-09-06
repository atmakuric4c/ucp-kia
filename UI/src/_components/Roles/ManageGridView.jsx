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
class ManageRoleDataTablePage extends React.Component {
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
    if (
      this.props.ApprovalMatrices &&
      this.props.ApprovalMatrices.data &&
      this.props.ApprovalMatrices.data.data &&
      this.props.ApprovalMatrices.data.data.length > 0
    ) {
      this.props.ApprovalMatrices.data.data.map((val, index) => {
        this.matricesRows[this.matricesRows.length] = {
          sno: this.matricesRows.length + 1,
          Role_name: val.name,
          Permissions: (
            <span>
              <ul>
                {val.user_permissions &&
                  val.user_permissions.length > 0 &&
                  val.user_permissions.map((item, index) => (
                    <li key={index}>
                      {item.module_name}
                      <ul>
                        {item.read_permission ? <li> Read </li> : null}
                        {item.write_permission ? <li> Write </li> : null}
                        {item.delete_permission ? <li> Delete </li> : null}
                      </ul>
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
      editModuleList: [],
      ModuleList: [],
      clientList: [],
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
            label: "Permissions",
            field: "Permissions",
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
    let item = this.state.selectedItem;
    $(".sweet-alert")
      .find(".btn-danger")
      .prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled", true);


    let formdata = {
      user_id: this.state.user_id,
      role_id: item.id,
    };
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formdata)
    };
    return fetch(`${config.apiUrl}/secureApi/roles/deleteRole?noencrypt=1`, requestOptions)
    .then(res => res.json())
    .then((data) => {
      if (data.status == "success") {
        toast.success("Role deleted successfully !");
        this.closeModalDelete()
        this.props.dispatch(ApprovalMatrixActions.getAllRoles({}));
      }
      else{
        toast.error((data.message ? data.message : "Unable to Delete Role!"));
        this.closeModalDelete()
        this.props.dispatch(ApprovalMatrixActions.getAllRoles({}));
      }
    })
    .catch(console.log)

  }
  
  openModal() {
    this.setState({ modalIsOpen: true });
  }

  closeModal() {
    this.setState({ modalIsOpen: false });
  }

  openEditModal(item) {
    console.log('edit data',item)
    let {ModuleList} = this.state,
      editDetails = JSON.parse(JSON.stringify(item)), 
      user_permissions = editDetails.user_permissions,
      editModuleList = ModuleList.map(module => {
        let name = module.name,
          mapped = user_permissions.filter(permission => {
            return permission.module_name === name;
          });

        mapped = mapped[0] || {};
        Object.assign(module, mapped);

        return module;
      });

    this.setState({ modalEditOpen: true, editDetails,
      editModuleList });
  }

  closeEditModal() {
    this.setState({ modalEditOpen: false });
  }

  openModalDelete(val) {
    this.setState({ modalDelete: true });
    this.setState({selectedItem: val})
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
    addDetails.report_id = formData.reports_to;
     console.log("Add details",addDetails) 
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

  editRole = e => {
    e.preventDefault();
    var form = document.querySelector("#editRole");
    var formData = serialize(form, { hash: true });
    console.log("formData"+formData);
    let editDetails = this.state.editDetails;
    if (formData.role_name)
    if (!formData.role_name) {
      toast.warn("Please enter role Name");
      return;
    }
    this.setState({
      isEditSaveInprogress: true
    });
    let arr = this.state.ModuleList;
    console.log('Module arr:'+arr)
    editDetails.user_id = this.state.user_id;
    editDetails.record_status = 1;
    editDetails.role_name = formData.role_name;
    editDetails.report_id = formData.reports_to;
     console.log(" editDetails",editDetails) 
    let readPermissions = formData.read_permission,
      writePermission = formData.write_permission,
      deletePermission = formData.delete_permission;

      editDetails.assign_permissions = arr.map((item) => {
        console.log('Module Id:'+item)
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
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(editDetails),
    };

    fetch(`${config.apiUrl}/secureApi/roles/saveRole?noencrypt=1`, requestOptions).then(response => {
      response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

        this.setState({
          isEditSaveInprogress: false
        });
        if (response.ok) {
          var result = (data.value ? data.value : data)
          console.log("RolesUpdate result --- ", result);
          if (result.status == "success") {
            toast.success(result.message);
            this.setState(prevState => ({
              editDetails: []
            }));
            this.props.dispatch(ApprovalMatrixActions.getAllRoles({}));
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
        let res = JSON.parse(text).data;
        this.setState({
          RoleList: res || [],
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

  render() {
    const { userPermissions, ModuleList, editDetails,
      editModuleList } = this.state;

    const regex = /(<([^>]+)>)/gi;
    return (
      <div>
        <div className="row">
          <div className="col-md-12 mb-2">
            <h5 className="color">Roles Management</h5>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="text-right">
              {/* <button
                className="btn btn-sm btn-primary mr-3"
                onClick={this.openModal}
              >
                {" "}
                <i className="fa fa-plus" /> Add Role
              </button> */}
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
            Add Role{" "}
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
              name="addRole"
              id="addRole"
              method="post"
              onSubmit={this.addRole}
            >
              <fieldset className="fieldset-wrapper">
                <legend className="fieldset-legend color">Create Role</legend>
                <div className="form-group">
                  <label htmlFor="role_name">
                    Role<span className="star-mark">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="role_name"
                    required
                    onChange={this.bindField}
                    placeholder="Role Name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bu_id">Reports to</label>
                  <select
                    className="form-control"
                    name="reports_to"
                    onChange={(e) => {
                      this.bindField(e);
                    }}
                  >
                    <option value="">--SELECT--</option>
                    {this.state.RoleList.map((item, index) => (
                      <option value={item.id} key={index}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>

              <fieldset className="fieldset-wrapper">
                <legend className="fieldset-legend color">
                  Assign Permission
                </legend>
                {ModuleList.map((item, index) => (
                  <div className="form-group" key={index}>
                    <label htmlFor="role_name">{item.name}</label>
                    <div class="row" style={{ marginLeft: "30px" }}>
                      <div
                        class="column"
                        style={{ float: "left", width: "25%" }}
                      >
                        <tr key={index}>
                          <td>
                            <div
                              class="checkbox checkbox-circle checkbox-color-scheme"
                              style={{ marginRight: "5px" }}
                            >
                              <label class="checkbox-checked">
                                <input
                                  type="checkbox"
                                  value={item.id}
                                  name="read_permission"
                                  onChange={(e) => {
                                    let val = e.target.checked,
                                      arr = this.state.ModuleList;
                                    const found = arr.find(
                                      (ele) => ele.module_id == item.module_id
                                    );
                                    found.read_permission = val ? 1 : 0;
                                  }}
                                />
                              </label>
                            </div>
                          </td>
                          <td>Read</td>
                        </tr>
                      </div>
                      <div
                        class="column"
                        style={{ float: "left", width: "25%" }}
                      >
                        <tr key={index}>
                          <td>
                            <div
                              class="checkbox checkbox-circle checkbox-color-scheme"
                              style={{ marginRight: "5px" }}
                            >
                              <label class="checkbox-checked">
                                <input
                                  type="checkbox"
                                  value={item.id}
                                  name="write_permission"
                                  onChange={(e) => {
                                    let val = e.target.checked,
                                      arr = this.state.ModuleList;
                                    const found = arr.find(
                                      (ele) => ele.module_id == item.module_id
                                    );
                                    found.write_permission = val ? 1 : 0;
                                  }}
                                />
                              </label>
                            </div>
                          </td>
                          <td>Write</td>
                        </tr>
                      </div>
                      <div
                        class="column"
                        style={{ float: "left", width: "25%" }}
                      >
                        <tr key={index}>
                          <td>
                            <div
                              class="checkbox checkbox-circle checkbox-color-scheme"
                              style={{ marginRight: "5px" }}
                            >
                              <label class="checkbox-checked">
                                <input
                                  type="checkbox"
                                  value={item.id}
                                  name="delete_permission"
                                  onChange={(e) => {
                                    let val = e.target.checked,
                                      arr = this.state.ModuleList;
                                    const found = arr.find(
                                      (ele) => ele.module_id == item.module_id
                                    );
                                    found.delete_permission = val ? 1 : 0;
                                  }}
                                />
                              </label>
                            </div>
                          </td>
                          <td>Delete</td>
                        </tr>
                      </div>
                    </div>
                  </div>
                ))}
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
                  <button className="btn btn-sm btn-primary  ">Submit</button>
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
            Edit Role{" "}
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
              name="editRole"
              id="editRole"
              method="post"
              onSubmit={this.editRole}
            >
              <div className="form-group">
                            <label>Role Name</label> :&nbsp;
                            {this.state.editDetails.name}
                        </div>
              <fieldset className="fieldset-wrapper">
                <legend className="fieldset-legend color">Role Details</legend>
                <div className="form-group">
                  <label htmlFor="role_name">
                    Role<span className="star-mark">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="role_name"
                    required
                    defaultValue={this.state.editDetails.name}
                    onChange={this.bindField}
                    placeholder="Role Name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bu_id">Reports to</label>
                  <select
                    className="form-control"
                    name="reports_to"
                    defaultValue={this.state.editDetails.report_id}
                    onChange={(e) => {
                      this.bindField(e);
                    }}
                  >
                    <option value="">--SELECT--</option>
                    {this.state.RoleList.map((item, index) => (
                      <option value={item.id} key={index}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>

              <fieldset className="fieldset-wrapper">
                <legend className="fieldset-legend color">
                  Permission Details
                </legend>
                <div>
                 <b>READ:</b> View access to see the all options <br />
                 <b>WRITE:</b> Ability to perform the action like VM provsioning, VM Resize & Add Disks etc <br />
                 <b>DELETE:</b> Ability to delete the records if applicable <br />
                 <br />
                 <br />

                </div>
                {editModuleList.map((item, index) => (
                  <div className="form-group" key={index}>
                  <label htmlFor="role_name">{item.name}</label>
                    <div class="row" style={{ marginLeft: "30px" }}>
                      <div
                        class="column"
                        style={{ float: "left", width: "25%" }}
                      >
                        <tr key={index}>
                          <td>
                            <div
                              class="checkbox checkbox-circle checkbox-color-scheme"
                              style={{ marginRight: "5px" }}
                            >
                              <label class="checkbox-checked">
                                <input
                                  type="checkbox"
                                  value={item.id}
                                  defaultChecked={item.read_permission}
                                  name="read_permission"
                                  onChange={(e) => {
                                    let val = e.target.checked,
                                      arr = this.state.ModuleList;
                                    // debugger;
                                    const found = arr.find(
                                      (ele) => ele.module_id == item.module_id
                                    );
                                    found.read_permission = val ? 1 : 0;
                                  }}
                                />
                              </label>
                            </div>
                          </td>
                          <td>Read</td>
                        </tr>
                      </div>
                      <div
                        class="column"
                        style={{ float: "left", width: "25%" }}
                      >
                        <tr key={index}>
                          <td>
                            <div
                              class="checkbox checkbox-circle checkbox-color-scheme"
                              style={{ marginRight: "5px" }}
                            >
                              <label class="checkbox-checked">
                                <input
                                  type="checkbox"
                                  value={item.id}
                                  defaultChecked={item.write_permission}
                                  name="write_permission"
                                  onChange={(e) => {
                                    let val = e.target.checked,
                                      arr = this.state.ModuleList;
                                    const found = arr.find(
                                      (ele) => ele.module_id == item.module_id
                                    );
                                    found.write_permission = val ? 1 : 0;
                                  }}
                                />
                              </label>
                            </div>
                          </td>
                          <td>Write</td>
                        </tr>
                      </div>
                      <div
                        class="column"
                        style={{ float: "left", width: "25%" }}
                      >
                        <tr key={index}>
                          <td>
                            <div
                              class="checkbox checkbox-circle checkbox-color-scheme"
                              style={{ marginRight: "5px" }}
                            >
                              <label class="checkbox-checked">
                                <input
                                  type="checkbox"
                                  value={item.id}
                                  name="delete_permission"
                                  defaultChecked={item.delete_permission}
                                  onChange={(e) => {
                                    let val = e.target.checked,
                                      arr = this.state.ModuleList;
                                    const found = arr.find(
                                      (ele) => ele.module_id == item.module_id
                                    );
                                    found.delete_permission = val ? 1 : 0;
                                  }}
                                />
                              </label>
                            </div>
                          </td>
                          <td>Delete</td>
                        </tr>
                      </div>
                    </div>
                  </div>
                ))}
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
                  <button className="btn btn-sm btn-primary"
                     >Update</button>
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
            confirmBtnText="Delete Role"
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

export default connect(mapStateToProps)(ManageRoleDataTablePage);
