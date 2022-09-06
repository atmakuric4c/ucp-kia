import React from "react";
import { connect } from "react-redux";
import Modal from "react-modal";
import PageLoader from '../PageLoader'; 
import { MDBDataTable } from "mdbreact";
import { toast } from "react-toastify";
import SweetAlert from "react-bootstrap-sweetalert";
import { ApprovalMatrixActions } from "./Roles.actions";
var serialize = require("form-serialize");
import {
  authHeader,
  ucpEncrypt,
  ucpDecrypt,
  decryptResponse,
  encryptRequest
} from "../../_helpers";
import config from "config";
import { default as ReactSelect } from "react-select";
import { components } from "react-select";
import { exportDataToExcel } from '../../_helpers';

const reactSelectComponentOption = (props) => {
  return (
    <div>
      <components.Option {...props}>
        <input
          type="checkbox"
          checked={props.isSelected}
          onChange={() => null}
        />{" "}
        <label>{props.label}</label>
      </components.Option>
    </div>
  );
};
Modal.setAppElement("#app");
class RoleDataTablePage extends React.Component {
  constructor(props) {
    super(props);
    let user = decryptResponse(localStorage.getItem("user")),
      manager_resource_groups_array = [],
      is_manager_flag = 0,
      manager_resource_groups = {},
    assigned_resource_groups = user.data.resource_groups.map(resource => {
      if (resource.role_id === 3) {
        manager_resource_groups[resource.subscription_id+"@$"+resource.name] = true
        manager_resource_groups_array.push(resource.subscription_id+"@$"+resource.name);
        is_manager_flag = 1;
      }
      return resource.subscription_id+"@$"+resource.name;
    });

    // console.log('====manager_resource_groups_array====',manager_resource_groups_array)
    this.openAssignRoleModal = this.openAssignRoleModal.bind(this);
    this.closeAssignRoleModel = this.closeAssignRoleModel.bind(this);

    this.openUserModal = this.openUserModal.bind(this);
    this.closeUserModal = this.closeUserModal.bind(this);

    this.openModalDelete = this.openModalDelete.bind(this);
    this.closeModalDelete = this.closeModalDelete.bind(this);

    this.modalIsOpenEditResourceGroup =
      this.modalIsOpenEditResourceGroup.bind(this);

    this.closeModalEditResourceGroup =
      this.closeModalEditResourceGroup.bind(this);
    this.values = [];

    this.bindField = this.bindField.bind(this);
    this.matricesRows = [];
    if (this.props.ApprovalMatrices && this.props.ApprovalMatrices.data && this.props.ApprovalMatrices.data.data && this.props.ApprovalMatrices.data.data.length > 0) {
      this.props.ApprovalMatrices.data.data.map((val, index) => {
        this.matricesRows[this.matricesRows.length] = {
          sno: (this.matricesRows.length + 1),
          Subscription: val.subscription_name,
          // Resource_group: <span>
          //   <ul>
          //     {val.resource_groups && val.resource_groups.length > 0 && val.resource_groups.map((item, index) =>
          //       <li key={index}>
          //         {item.name}
          //       </li>
          //     )}
          //   </ul>
          // </span>,
          // ((val.created_by == user.data.id || val.report_email == user.data.email || user.data.isSuperAdmin == "1") &&  (is_manager_flag != "0" || user.data.isSuperAdmin == "1"))
          Resource_group: val.RGname,
          User_name: val.email,
          Role_name: val.role_name,
          // Report_To: val.report_email,
          // Created_By: val.created_by_email,
          action: 
          (user.data.isSuperAdmin == "1") ?
          <div><span className="cursor-pointer" onClick={() => this.modalIsOpenEditResourceGroup(val)}><i className="fa fa-edit"></i> </span>
          <span
            className="cursor-pointer"
            onClick={() => this.openModalDelete(val)}
          >
            <i className="fa fa-trash" aria-hidden="true"></i>{" "}
          </span>
        </div> :
          ((is_manager_flag == 1 || user.data.isSuperAdmin == "1") && manager_resource_groups_array.indexOf(val.subscription_id+"@$"+val.RGname) !== -1) ? 
          <div><span className="cursor-pointer" onClick={() => this.modalIsOpenEditResourceGroup(val)}><i className="fa fa-edit"></i> </span>
          <span
            className="cursor-pointer"
            onClick={() => this.openModalDelete(val)}
          >
            <i className="fa fa-trash" aria-hidden="true"></i>{" "}
          </span>
        </div> : null 

        }
      });
    }


    this.state = {
      user: user.data,
      subscription_selected: "",
      subscription_id : "",
      role_id_filtered_selected: "",
      isResouceListLoading: false,
      assigned_resource_groups : assigned_resource_groups,
      manager_resource_groups_array:manager_resource_groups_array,
      manager_resource_groups,
      is_manager_flag,
      superAdmin: user.data.isSuperAdmin,
      userRoleSelected: 0,
      isOpenUserModal: false,
      assignModalOpen: false,
      hideReportsTo: false,
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
      modalIsOpenEdituser: false,
      modalIsOpenEditResourceGroup: false,
      isActiveUserTabActive: true,
      questions: [],
      viewAddQuestions: 0,
      viewEditQuestions: 0,
      profile_id: null,
      ApprovalLevelsData: [],
      editDetails: {},
      isEditSaveInprogress: false,
      modalDelete: false,
      addDetails: {},
      isAddSaveInprogress: false,
      RoleList: [],
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
            label: "Subscription",
            field: "Subscription",
          },
          {
            label: "Resource Group",
            field: "Resource_group",
          },
          {
            label: "User Name",
            field: "User_name",
          },
          {
            label: "Role",
            field: "Role_name",
          },
          // {
          //   label: "Report To",
          //   field: "Report_To",
          // },
          // {
          //   label: "Created By",
          //   field: "Created_By",
          // },
          {
            label: "Action",
            field: "action",
          },
        ],
        rows: this.matricesRows,
      },
      exportData :[],
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
      optionSelected: null,
      optionClientSelected: null,
      addFormResourcesSelected : [],
	  addFormResourcesSelectedOptions : [],
	  isUpdateRGInProgress : false,
	  isAddRGInProgress : false
    };
    this.reactSelectHandleChange = this.reactSelectHandleChange.bind(this);
    this.reactSelectHandleChangeClient = this.reactSelectHandleChangeClient.bind(this);
  }
  reactSelectHandleChange = (selected, jObj) => {
		console.log("selected --- ", selected);
		console.log("jObj --- ", jObj);
	  if(jObj){
		  this.setState({
	  		[jObj.optionSelected]: selected
	  	  });
		  setTimeout(() => {
			    console.log("this.state[jObj.optionSelected]",this.state[jObj.optionSelected]);
		    }, 100);
	  }else{
	    this.setState({
	      optionSelected: selected,
	    });
	  }
    // this.setState({
    //   optionClientSelected: selected,
    // });
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
    if (this.state.modalIsOpenEditResourceGroup == true) {
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

  updateRGLocalStorage = () =>{
    //Step 1 SQL get the RG with user (ids)
    //Step 2 Delete the RG object from local Storage
    //Step 3 Update the RG Object in local Storage
      let user_id = this.state.user.id;

      const requestOptions = {
        method: "POST",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(ucpEncrypt({
           user_id:this.state.user.id , isSuperAdmin: this.state.superAdmin 
        }))
      }; 

      return fetch(`${config.apiUrl}/secureApi/roles/listRGAssigned`, requestOptions).then(
        (response) => {
          response.text().then((text) => {
            let res = text && JSON.parse(ucpDecrypt(JSON.parse(text))).data;
            // console.log('>>>Assigned RG LIST',res); 
            let user = decryptResponse(localStorage.getItem("user"));
            // console.log('before local storage++++',user.data.resource_groups);
            let assigned_resource_groups = [];
              if(user.data.resource_groups.length >0){
                 user.data.resource_groups = res.map(resource => {
                  return resource;
                });
              }
              // console.log('after local storage resource group ++++',user.data.resource_groups);
              localStorage.setItem("user", encryptRequest(JSON.stringify(user)));
              // console.log('>>>>after update local storage',JSON.parse(localStorage.getItem("user")));

            // this.setState({
            //   RoleList: res,
            // });
          });
        }
      );
  }
  handleResourceList = (selected) => {
    this.setState({
      selectedResource: selected,
    });

//    let user = decryptResponse(localStorage.getItem("user")),
//      assigned_resource_groups = [];
//
//    if(user.data.resource_groups.length >0){
//      assigned_resource_groups = user.data.resource_groups.map(resource => {
//        return resource.name;
//      });
//    }
//    // this.setState({
//    //   optionClientSelected: selected,
//    // });
//    // this.props.dispatch(ApprovalMatrixActions.getUserAll({resource_group_id:selected.value}));
//    
//    // this.props.dispatch(ApprovalMatrixActions.getAllRoles());
//    // console.log('matricesData=======',this.state.matricesData);
//    let role_id_selected ='';
//    if(this.state.role_id_filtered_selected){
//      role_id_selected = this.state.role_id_filtered_selected;
//    }
//    this.getAllResourceList({subscription_selected:this.state.subscription_selected,role_id:role_id_selected,
//                             resource_group_id:selected.value,assigned_resource_groups:assigned_resource_groups,current_user_id:user.data.id,superAdmin:this.state.superAdmin});
  };

  handleRoleList = (selected) => {
    this.setState({
      role_id_filtered_selected: selected.target.value,
    });

//    let user = decryptResponse(localStorage.getItem("user")),
//      assigned_resource_groups = [];
//    if(user.data.resource_groups.length >0){
//      assigned_resource_groups = user.data.resource_groups.map(resource => {
//        return resource.name;
//      });
//    } 
//
//    // this.setState({
//    //   optionClientSelected: selected,
//    // });
//    // this.props.dispatch(ApprovalMatrixActions.getUserAll({resource_group_id:selected.value}));
//    
//    // this.props.dispatch(ApprovalMatrixActions.getAllRoles());
//    // console.log('matricesData=======',this.state.matricesData);
//    this.getAllResourceList({subscription_selected:this.state.subscription_selected,
//                             role_id:selected.target.value,resource_group_id:this.state.selectedResource.value,assigned_resource_groups:assigned_resource_groups,current_user_id:user.data.id,superAdmin:this.state.superAdmin});
  };
  searchRGUsersList(){
	  let user = decryptResponse(localStorage.getItem("user")),
      assigned_resource_groups = user.data.resource_groups || [],
      {subscription_selected, role_id_filtered_selected,
        selectedResource, superAdmin} = this.state;

    if(assigned_resource_groups.length > 0) {
      assigned_resource_groups = assigned_resource_groups.map(resource => {
        return resource.name;
      });
    }

	  this.getAllResourceList({
		  subscription_selected: subscription_selected,
      role_id: role_id_filtered_selected,
      resource_group_id: (selectedResource || {}).value,
      assigned_resource_groups: assigned_resource_groups,
      current_user_id: user.data.id,
      superAdmin: superAdmin
    });
  }

  getAllResourceList(frmData) {
//	  console.log("frmData --- ", frmData);
    this.setState({
      isResouceListLoading: true
    });

    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/roles/getAllResourceGroupList`, requestOptions).then(response  => this.handleResourceListResponse(response));
  }
  handleResourceListResponse(response) {
    return response.text().then(text => {
      //  this.props.ApprovalMatrices.data = text && JSON.parse(text);
       let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

        // let resourceList = [];
        // this.matricesRows = [];
        let resourceList = [];
        let exportData = [];

//        console.log("data --- ", data);
        if ( data && data.data && data.data.length > 0) {
          for(let i =0; i < data.data.length; i++){
            let newRow = {};
            newRow.sno = i + 1; 
            newRow.Subscription = data.data[i].subscription_name;
            // newRow.Resource_group = <span>
            //     <ul>
            //       {data.data[i].resource_groups && data.data[i].resource_groups.length > 0 && data.data[i].resource_groups.map((item, index) =>
            //         <li key={index}>
            //           {item.name}
            //         </li>
            //       )}
            //     </ul>
            //   </span>;
            newRow.Resource_group = data.data[i].RGname;
            newRow.User_name = data.data[i].email;
            newRow.Role_name = data.data[i].role_name;
            // newRow.Report_To = data.data[i].report_email;
            // newRow.Created_By = data.data[i].created_by_email;
            newRow.action = (this.state.user.isSuperAdmin == "1") ?
                <div><span className="cursor-pointer" onClick={() => this.modalIsOpenEditResourceGroup(data.data[i])}><i className="fa fa-edit"></i> </span>
                <span
                  className="cursor-pointer"
                  onClick={() => this.openModalDelete(data.data[i])}
                >
                  <i className="fa fa-trash" aria-hidden="true"></i>{" "}
                </span>
              </div> :
                ((this.state.is_manager_flag == 1 || this.state.user.isSuperAdmin == "1") && this.state.manager_resource_groups_array.indexOf(data.data[i].subscription_id+"@$"+data.data[i].RGname) !== -1) ? 
                <div><span className="cursor-pointer" onClick={() => this.modalIsOpenEditResourceGroup(data.data[i])}><i className="fa fa-edit"></i> </span>
                <span
                  className="cursor-pointer"
                  onClick={() => this.openModalDelete(data.data[i])}
                >
                  <i className="fa fa-trash" aria-hidden="true"></i>{" "}
                </span>
              </div> : null 
            resourceList.push(newRow);
              
              let newExportRow = {};
              newExportRow['S. No.'] = i + 1; 
              newExportRow['Subscription'] = data.data[i].subscription_name;
              newExportRow['Resource Group'] = data.data[i].RGname;
              newExportRow['User Name'] = data.data[i].email;
              newExportRow['Role'] = data.data[i].role_name;
              exportData.push(newExportRow);
          }
        }

        // this.state.filteredData = this.matricesRows;
        this.state.matricesData.rows = resourceList;
        // this.setState({
        //   matricesData: this.matricesRows
        // })
        if (data && data.error && data.error.message) {
          toast.error(data.error.message);
        }
        else{

          if(data && data.message =='No data found.'){
            toast.error("No record for current selection!");
          }

          this.setState({
            data: this.state.matricesData
          })
          //return data;
        }
//        console.log("exportData --- ", exportData);
        this.setState({
          isResouceListLoading: false,
          exportData
        }) 
    });
  }

  reactSelectHandleChangeClient = (selected) => {
    this.setState({
      optionClientSelected: selected,
      addFormResourcesSelected :[],
      addFormResourcesSelectedOptions :[],
      subscription_id : "",
      subscription_selected :""
    });
    // this.setState({
    //   optionClientSelected: selected,
    // });
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
    if (this.state.modalIsOpenEditResourceGroup == true) {
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

  openAssignRoleModal() {
    this.setState({ assignModalOpen: true })
  }

  closeAssignRoleModel() {
    this.setState({ assignModalOpen: false })
  }

  openModalDelete(item) {
	  console.log("item --- ", item);
    this.setState({ modalDelete: true });
    this.setState({ selectedItem: item });
  }

  closeModalDelete() {
    this.setState({ modalDelete: false });
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
      .prepend("<i className='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled", true);

    let formdata = {
      user_id: this.state.user_id,
      resoure_group_id: item.resource_group_id,
      resource_group_mapping_id: item.resource_group_mapping_id,
      azure_account_id : item.azure_account_id,
      RGname : item.RGname,
      subscription_id : item.subscription_id,
    };
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(formdata))
    };
    return fetch(`${config.apiUrl}/secureApi/roles/deleteResourceGroup`, requestOptions)
    .then(response => response.text()
      .then((data) => {
        data = data && JSON.parse(ucpDecrypt(JSON.parse(data)));

        if (data.status == "success") {
          toast.success("User removed from resource group successfully");
          this.closeModalDelete();
          if(this.state.superAdmin != '1'){
           //CALL COMMON FUNCTION UPDATE LOCAL STORAGE
            this.updateRGLocalStorage();
          }
//          this.props.dispatch(ApprovalMatrixActions.getAll({}));
          this.searchRGUsersList();
        }
        else {
          toast.error((data.message ? data.message : "Unable to remove user!"));
          this.closeModalDelete();
          this.searchRGUsersList();
//          this.props.dispatch(ApprovalMatrixActions.getAll({}));
        }

      })
    )
      .catch(console.log)

  }

  modalIsOpenEditResourceGroup(item) {

    // //call Local storage common function
    // this.updateRGLocalStorage();
    let mapped_resource_group_ids = item.resource_groups.filter(grp => {
      return item.RGname === grp.name;
    });
    item.mapped_resource_group_ids = mapped_resource_group_ids.map(rec => rec.resource_group);

    this.setState({ editDetails: JSON.parse(JSON.stringify(item)) });
    this.setState({ modalIsOpenEditResourceGroup: true });
    
    // this.handleSubscription(item.subscription_id)
    if (item.subscription_id) {
      this.handleSubscription(item.subscription_id, item)
    }
    this.getUsers(item)
  }

  closeModalEditResourceGroup() {
    this.setState({ modalIsOpenEditResourceGroup: false });
  }


  openUserModal() {
    this.setState({ isOpenUserModal: true })
  }

  closeUserModal() {
    this.setState({ isOpenUserModal: false })
  }



  assignRole = (e) => {
    e.preventDefault();
    var form = document.querySelector("#assignRole");
    var formData = serialize(form, { hash: true });
    if (!formData.role_id) {
      toast.warn("Please enter role role_id");
      return;
    }


    let addDetails = this.state.addDetails;
    addDetails.user_id = this.state.user_id;
    addDetails.record_status = 1;

    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(ucpEncrypt(addDetails)),
    };

    fetch(
      `${config.apiUrl}/secureApi/roles/saveRole`,
      requestOptions
    ).then((response) => {
      response.text().then((text) => {
      });
    });
  };

  resourceGroupAssignment = (e) => {
    e.preventDefault();
    var form = document.querySelector("#resourceGroup");
    var formData = serialize(form, { hash: true });
    console.log("formData --- ", formData);
      if (!formData.resource_user_id) {
        toast.error("Please select User");
        return;
      }

    let List = formData.resources, resourceGroupArray;
    if (!List || List.length == 0) {
        toast.error("Please select Resource Group");
        return;
    }

    if (typeof (List) == "string") {
      resourceGroupArray = [{ resource_group: formData.resources }];
    } else {
      resourceGroupArray = List.map((item) => ({
        resource_group: item
      }));
    }
    
    let addDetails = this.state.addDetails;
    addDetails.user_id = this.state.user_id;
    addDetails.resource_user_id = formData.resource_user_id;
    addDetails.record_status = 1;
    addDetails.assign_resources = resourceGroupArray;
    addDetails.userRoleSelected = this.state.userRoleSelected;
    
    if(this.state.superAdmin == '1'){
      addDetails.report_to = formData.resource_user_id;
    }else{
      if(formData.role_id == 3){
        addDetails.report_to = formData.resource_user_id;
      }else{
        addDetails.report_to = this.state.user_id;
      }
    }
    /*if (formData.report_to == undefined) {
      addDetails.report_to = this.state.user_id;
    } else {
      addDetails.report_to = formData.report_to;
    }*/
    this.setState({
    	isAddRGInProgress: true
    });
    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(ucpEncrypt(addDetails)),
    };

    fetch(
      `${config.apiUrl}/secureApi/roles/saveResourceGroup`,
      requestOptions
    ).then((response) => {
      response.text().then((text) => {
    	  this.setState({
    	    	isAddRGInProgress: false
    	  });
        let res = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        if (res.status == "error") {
          toast.warning(res.message)
        }
        if (res.status == "success") {
          toast.info(<div dangerouslySetInnerHTML={ {__html: res.message} } />);
          this.closeUserModal();

          if(this.state.superAdmin != '1'){
            //CALL COMMON FUNCTION UPDATE LOCAL STORAGE
             this.updateRGLocalStorage();
           }
          
//          this.props.dispatch(ApprovalMatrixActions.getAll({}));
          this.searchRGUsersList();
        }
      });
    });
  };

  editResourceGroupAssignment = e => {
    e.preventDefault();
    var form = document.querySelector("#editresourceGroup");
    var formData = serialize(form, { hash: true });
    
    let editDetails = this.state.editDetails;
    
    console.log("formData --- ", formData);
//    return;
    if (formData.user)
      if (!formData.user) {
        toast.warn("Please enter user Name");
        return;
      }
    this.setState({
      isEditSaveInprogress: true
    });
    // editDetails.user_id = this.state.user_id;
    let List = formData.resources, resourceGroupArray;
    if (!List || List.length == 0) {
        toast.error("Please select Resource Group");
        return;
    }
    if (typeof (List) == "string") {
      resourceGroupArray = [{ resource_group: formData.resources }];
    } else {
      resourceGroupArray = List.map((item) => ({
        resource_group: item
      }));
    }
    console.log("resourceGroupArray --- ", resourceGroupArray);
//  return;

    editDetails.user_id = this.state.user_id;
    editDetails.record_status = 1;
    editDetails.assign_resources = resourceGroupArray;
    editDetails.id = editDetails.resource_group_id;
    editDetails.resource_group_mapping_id = editDetails.resource_group_mapping_id;
    editDetails.resource_user_id = formData.user_selected_hidden;
    editDetails.subscription_id = formData.subscription_id;
    editDetails.role_id = formData.role_id;
    editDetails.userRoleSelected = this.state.userRoleSelected;
    editDetails.edit_mode = true;
    
    /*if (formData.report_to == undefined) {
      editDetails.report_to = this.state.user_id;
    } else {
      editDetails.report_to = formData.report_to;
    }*/
    if(this.state.superAdmin == '1'){
      editDetails.report_to = formData.user_selected_hidden;
    }else{
      if(formData.role_id == 3){
        editDetails.report_to = formData.user_selected_hidden;
      }else{
        editDetails.report_to = this.state.user_id;
      }
    }

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(editDetails)),
    };
    this.setState({
    	isUpdateRGInProgress: true
    });
    fetch(`${config.apiUrl}/secureApi/roles/saveResourceGroup`, requestOptions).then(response => {
      response.text().then(text => {
    	  this.setState({
    		  isUpdateRGInProgress: false
          });
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

        this.setState({
          isEditSaveInprogress: false
        });
        if (response.ok) {
          var result = (data.value ? data.value : data)
          
          if (result.status == "success") {
            
            toast.success(<div dangerouslySetInnerHTML={ {__html: result.message} } />);
            this.closeModalEditResourceGroup();
            this.setState(prevState => ({
              editDetails: []
            }));
            if(this.state.superAdmin != '1'){
              //CALL COMMON FUNCTION UPDATE LOCAL STORAGE
               this.updateRGLocalStorage();
             }

//            this.props.dispatch(ApprovalMatrixActions.getAll({}));
            this.searchRGUsersList();
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
	  this.searchRGUsersList();
    this.getRoleList();
    this.getSubscriptionList();
    this.getUsers();
  }

  getRoleList() {
    var frmData = {
      record_status: "1",
    };
    var isRoleAssigned = '1';
    // if(this.state.superAdmin == '1'){
    //   let isRoleAssigned = '3';
    // }

    const requestOptions = {
      method: "POST",
      headers: { ...authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(ucpEncrypt({ is_role: isRoleAssigned, 
        isSuperAdmin: this.state.superAdmin }))
    }; 

    return fetch(`${config.apiUrl}/secureApi/roles/listRoleAssigned`, requestOptions).then(
      (response) => {
        response.text().then((text) => {
          let res = text && JSON.parse(ucpDecrypt(JSON.parse(text))).data;
          this.setState({
            RoleList: res,
          });
        });
      }
    );
  }

  getSubscriptionList() {
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt({ clientid: this.state.clientid }))
    };

    fetch(`${config.apiUrl}/secureApi/getAzureSubscriptions`, requestOptions).then(response =>
       this.handleSubscriptionResponse(response));
  }

  handleSubscriptionResponse(response) {
    return response.text().then(text => {
      const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

      if (data && data.error && data.error.message) {
        toast.error(data.error.message);
      }
      else if (!response.ok) {
        toast.error("No Subscription records found !");
      }
      else if (data && data.length > 0) {
        this.setState({ subscriptionList: data })
      }
    });
  }

  handleSubscription(subscriptionID, editDetails, isSearch) {

	  var form = document.querySelector("#resourceGroup");
	    var formData = serialize(form, { hash: true });
	    console.log("formData --- ", formData);
	      
    this.setState({
    	subscription_selected: subscriptionID.replace(this.state.clientid + "_", ""),
    	resourceGroupsList: [],
        resourceLIST: [],
        resourceLISTFilter:[]
    	});
    if(typeof isSearch != "undefined" && isSearch == "search"){
    	this.setState({
        	selectedResource : {}
    	});
    }
    if(this.state.isOpenUserModal){
    	this.setState({
    		addFormResourcesSelected : [],
    		addFormResourcesSelectedOptions : []
    	});
    }else if(this.state.modalIsOpenEditResourceGroup){
    	this.setState({
    		editFormResourcesSelected : [],
    		editFormResourcesSelectedOptions : []
    	});
    }

    this.setState({
      optionSelected: ""
    });
    if(subscriptionID){
	    var frmData = {
	      subscription_id: subscriptionID.replace(this.state.clientid + "_", ""),
	      clientid: this.state.clientid,
	      user_role: this.state.user_role,
	      user_id: this.state.user_id
	    }
	    if(!editDetails && (!isSearch || isSearch != "search")){
	    	if (!formData.resource_user_id) {
		        toast.error("Please select User");
		        return;
		    }
	    	this.setState({
	        	subscription_id : subscriptionID,
        	});
	    	frmData.resource_user_id = formData.resource_user_id;
	    	frmData.type = "User_Role_Form";
	    }
	    const requestOptions = {
	      method: 'POST',
	      headers: { ...authHeader(), 'Content-Type': 'application/json' },
	      body: JSON.stringify(ucpEncrypt(frmData))
	    };
	
	    fetch(`${config.apiUrl}/secureApi/azure/getAzureResourceGroups`, requestOptions).then(response => {
	      response.text().then(text => {
	        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
	
	        this.setState({
	          isResourceGroupInprogress: false
	        });
	        if ((data || []).length) {
	          var result = (data.value ? data.value : data)
	        
	          let optionSelected = [], editFormResourcesSelectedOptions = [];
	          if (result) {
	            let resourceLIST = [];
	            // let resourceLISTFilter = [];
	            for (let i = 0; i < result.length; i++) {
	              if (result[i].Virtual_Machines == 'Yes'
	                && ((typeof isSearch != "undefined" && isSearch == "search" && this.state.assigned_resource_groups.indexOf(result[i].subscription_id+"@$"+result[i].name) >= 0) 
	                		|| (!isSearch && this.state.manager_resource_groups_array.indexOf(result[i].subscription_id+"@$"+result[i].name) >= 0) 
	                		|| this.state.superAdmin == "1")
	        		 ) {
	                resourceLIST.push({ value: result[i].id, label: result[i].name });
	                if (typeof editDetails != 'undefined'
	                  && typeof editDetails.mapped_resource_group_ids != 'undefined'
	                  && editDetails.mapped_resource_group_ids.length > 0
	                ) {
	                 
	                  /*if (editDetails.mapped_resource_group_ids.indexOf(result[i].id) !== -1) {
	                    optionSelected.push({ value: result[i].id, label: result[i].name });
	                  }*/
	                  if (editDetails.RGname == result[i].name) {
	                	  editFormResourcesSelectedOptions.push({ value: result[i].id, label: result[i].name });
	                  }
	                }
	              }
	            }
	
	            this.setState({
	              optionSelected,
	              editFormResourcesSelectedOptions
	            });
	
	            this.setState({
	              resourceGroupsList: result,
	              resourceLIST: resourceLIST,
	              resourceLISTFilter:resourceLIST
	            });
	          } else {
	            toast.error(result.message);
	          }
	        }
	        else {
	          toast.error("The operation did not execute as expected. Please raise a ticket to support");
	        }
	      });
	    });
    }
  }

  getUsers(editDetails) {
    this.setState({
      optionClientSelected: null
    });
    const requestOptions = {
      method: "GET",
      headers: { ...authHeader(), "Content-Type": "application/json" }
    };

    return fetch(`${config.apiUrl}/secureApi/user/getAllClientUsers`, requestOptions).then(
      (response) => {
        response.text().then((text) => {
          let res = text && JSON.parse(ucpDecrypt(JSON.parse(text))).data;
          let val = res[0].display_name;
          let result = [];
          res.map((item) => {
           // if (item.id != this.state.user_id) {
              result.push(item)
           // }
            return result;
          })
          let optionClientSelected = [];
          if (result) {
            let clientList = [];
           
            for (let i = 0; i < result.length; i++) {
              
              // if (result[i].Virtual_Machines == 'Yes'
              //   && (this.state.assigned_resource_groups.indexOf(result[i].name) >= 0 || this.state.superAdmin == "1")) {
                  clientList.push({ value: result[i].id, label: result[i].email });
                if (typeof editDetails != 'undefined' && typeof editDetails.user_id != 'undefined') {
                 
                  if (editDetails.user_id == result[i].id) {
                    optionClientSelected.push({ value: result[i].id, label: result[i].email });
                    
                  }
                }
              // }
            }
            
            this.setState({
              optionClientSelected: optionClientSelected
            });
            this.setState({
              allClientList: result,
              clientList: clientList
            });
          }

          // this.setState({
          //   clientList: userMap,
          // });
        });
      }
    );
  }

  handleDataListResponse(response) {
    return response.text().then((text) => {
      let data = text && JSON.parse(text);

      if (data && data.data && data.data.length > 0) {
        this.setState({
          profileTemplateList: data.data,
        });
      }

      this.setState({
        isProfileTemplateDataLoading: false,
      });
    });
  }

  handleClear = (e) => {

    // this.setState({subscription_selected:null})
    window.location.reload();
  }


  render() {
    const { user, ApprovalMatrices } = this.props;

    //  console.log('======this.state.is_manager_flag',this.state.is_manager_flag);
    //  console.log('======this.state.superAdmin',this.state.superAdmin);
//      if(this.state.superAdmin != '1'){
//        resourceLIST = (resourceLIST || []).filter(resource => {
//          return manager_resource_groups[resource.label];
//        });
//      }
    const regex = /(<([^>]+)>)/gi;
    return (
      <div>
        <div className="row">
          <div className="col-md-12 mb-2">
          	<div className="row">
          		<div className="col-md-8">
          			<h5 className="color">Resource Group - User List</h5>
	            </div>
	            <div className="col-md-4">
		            <div className="text-right">
			            {this.state.superAdmin === "1" || this.state.is_manager_flag === 1 ?
			            <button
			              className="btn btn-sm btn-primary mr-3"
			              onClick={this.openUserModal}
			            >
			              {" "}
			              <i className="fa fa-plus" /> Add Role
			            </button>
			              : null }
			        </div>
		        </div>
	        </div>
          </div>
        </div>
        <form
	        name="RGUsersListSearchFrm"
	        id="RGUsersListSearchFrm"
	        method="post"
	        onSubmit={this.searchRGUsersList}
	        >
        <div className="row mt-4">
	          <div className="col-lg-8">
	              <div className="form-group row">
	                  <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Subscription</label>                
	                  <div className="col-sm-9">
                    <select
                    className="form-control"
                    required
                    name="subscription_filter_id"
                    onChange={(e) => {
                      this.handleSubscription(e.target.value, '', 'search');
                      this.bindField(e);
                    }}
                  >
                    <option value="">--SELECT--</option>
                    {this.state.subscriptionList.map((item, index) => (
                      <option value={item.subscription_id} key={index}>
                        {item.display_name}
                      </option>
                    ))}
                  </select>
	                  </div>
	              </div>
	          </div>
	        </div>
          <div className="row">
	          <div className="col-lg-8">
	              <div className="form-group row">
	                  <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Resource Group</label>                
	                  <div className="col-sm-9">
                    <ReactSelect
                      options={this.state.resourceLISTFilter}
                      isMulti={false}
                      closeMenuOnSelect={true}
                      hideSelectedOptions={true}
                      name="resources"
//                	  onChange={this.bindField}
                      onChange={this.handleResourceList}
                      allowSelectAll={true}
                      value={this.state.selectedResource}
                    // value={this.state.editDetails.resource_groups ? (this.state.editDetails.resource_groups).map((item) =>{
                    //   return item.resource_group
                    // }) : null}
                    />
	                  </div>
	              </div>
	          </div>
	        </div>

          <div className="row">
	          <div className="col-lg-8">
	              <div className="form-group row">
	                  <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Role</label>                
	                  <div className="col-sm-9">
                    <select
                    className="form-control"
                    required
                    name="role_id"
//                  	  onChange={this.bindField}
                    onChange={this.handleRoleList}
                  >
                    <option value="">--SELECT--</option>
                    {this.state.RoleList && this.state.RoleList.map((item, index) => (
                      <option value={item.id} data-isrole={item.is_role} key={index}> 
                        {item.name}
                      </option>
                    ))}
                  </select>
	                  </div>
	              </div>
	          </div>
	        </div>
          <div className="row">
	          <div className="col-lg-8">
	              <div className="form-group row">
	                  <label htmlFor="cloud_type" className='col-sm-3  col-form-label'></label>                
	                  <div className="col-sm-9">
	                    {/*<button className="btn btn-sm btn-primary mr-3" onClick={this.handleClear}> Reset</button>*/}
	                    <span className="alert info-box-success mr-2 cursor-pointer" onClick={() => this.searchRGUsersList()}>Search</span>
	                  </div>
	              </div>
	          </div>
	        </div>
        </form>
        <br/>
        <div className="row">
          	<div className="col-md-12">
	            {this.state.isResouceListLoading ? <PageLoader/> :
	            <React.Fragment>
	              {/* {this.state.matricesData.rows && this.state.matricesData.rows.length > 0 && */}
	              	<div className="col-md-12 float-right">
	            	  <button onClick={e => { 
		                  return this.state.matricesData.rows && this.state.matricesData.rows.length ? 
		                		  exportDataToExcel({data: this.state.exportData, reportName : "User-Access-List"}) : 
		                  toast.error('No data to export')}}
		                type="button" className="btn btn-blue float-right" >Export <i className="fas fa-file-download"></i></button>
	                </div>
	                <MDBDataTable
	                striped
	                hover
	                data={this.state.matricesData}
	                />
                {/* } */}
	            </React.Fragment>
	          }
	        </div>
        </div>
        {/* Resource Management */}
        <Modal
          isOpen={this.state.isOpenUserModal}
          onRequestClose={this.closeUserModal}
          contentLabel="Assign User"
        >
          <h2 style={{ color: "red" }}>
            Assign User{" "}
            <span
              className="float-right cursor-pointer"
              onClick={this.closeUserModal}
            >
              <i className="fa fa-times" />
            </span>
          </h2>

          <div className="col-md-12">
            <div className="panel panel-default" />
            <form
              name="resourceGroup"
              id="resourceGroup"
              method="post"
              onSubmit={this.resourceGroupAssignment}
            > 
              <fieldset className="fieldset-wrapper">
                <legend className="fieldset-legend color">
                  Assign User
                </legend>
                <div className="form-group">
                  <label htmlFor="user">
                    User<span className="star-mark">*</span>
                  </label>
                  {/* <select
                    className="form-control"
                    required
                    name="resource_user_id"
                    onChange={(e) => {
                      this.bindField(e);
                    }}
                  >
                    <option value="">--SELECT--</option>
                    {this.state.clientList.map((item, index) => (
                      <option value={item.id} key={index}>
                        {item.email}
                      </option>
                    ))}
                  </select> */}
                     <ReactSelect
                      options={this.state.clientList}
                      isMulti = {false}
                      closeMenuOnSelect={true}
                      hideSelectedOptions={true}
                      name="resource_user_id"
                      components={{
                        reactSelectComponentOption
                      }}
                      onChange={this.reactSelectHandleChangeClient}
                      allowSelectAll={false}
                      // value={this.state.optionClientSelected}
                    />
                </div>
                <div className="form-group">
                  <label htmlFor="bu_id">
                    Subscription<span className="star-mark">*</span>
                  </label>
                  <select
                    className="form-control"
                    required
                    name="subscription_id"
                    onChange={(e) => {
                      this.handleSubscription(e.target.value);
                      this.bindField(e);
                    }}
                    value={this.state.subscription_id}
                  >
                    <option value="">--SELECT--</option>
                    {this.state.subscriptionList.map((item, index) => (
                      <option value={item.subscription_id} key={index}>
                        {item.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="mapped_users">Resource Group<span className="star-mark">*</span></label>
                  <span
                    className="d-inline-block"
                    data-toggle="popover"
                    data-trigger="focus"
                    data-content="Please selecet resource(s)" style={{ width: '100%' }}
                  >
                    <ReactSelect
                      options={this.state.resourceLIST}
                      isMulti
                      closeMenuOnSelect={false}
                      hideSelectedOptions={true}
                      name="resources"
//                	  menuIsOpen={true}
                      components={{
                        reactSelectComponentOption
                      }}
//                      onChange={this.reactSelectHandleChange}
                      onChange={e => {this.reactSelectHandleChange(e,{'key':"addFormResourcesSelected", optionSelected : "addFormResourcesSelectedOptions"})}}
                      allowSelectAll={true}
                       value={this.state.addFormResourcesSelectedOptions}
                    />
                  </span>
                </div>
                <div className="form-group">
                  <label htmlFor="role">
                    Role<span className="star-mark">*</span>
                  </label>
                  <select
                    className="form-control"
                    required
                    name="role_id"
                    onChange={(e) => {
                      this.bindField(e);
                      this.setState({
                        userRoleSelected: e.target[e.target.selectedIndex].getAttribute('data-isrole')
                      })
                     /* if (e.target.value == 3) {
                        this.setState({
                          hideReportsTo: true
                        })
                      } else {
                        this.setState({
                          hideReportsTo: false
                        })
                      }*/
                    }}
                  >
                    <option value="">--SELECT--</option>
                    {this.state.RoleList && this.state.RoleList.map((item, index) => (
                      <option value={item.id} data-isrole={item.is_role} key={index}> 
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                
              </fieldset>

              <div className="form-group">
                <div style={{ float: "right" }}>
                  <button
                    className="btn btn-sm btn-primary mr-3"
                    onClick={this.closeUserModal}
                  >
                    {" "}
                    Cancel
                  </button>
                  <button className="btn btn-sm btn-primary  ">
                  {this.state.isAddRGInProgress && <i className="fas fa-circle-notch icon-loading"></i> } Submit
                  </button>
                </div>
                <span className="text-danger">Note : Change in Role assignments requires logging-out of all sessions of UCP and login again; for the new role assignment to be affected.</span>
              </div>
            </form>
          </div>
        </Modal>

        {/* Resource Edit Modal */}
        <Modal
          isOpen={this.state.modalIsOpenEditResourceGroup}
          onRequestClose={this.closeModalEditResourceGroup}
          contentLabel="Assign User"
        >
          <h2 style={{ color: "red" }}>
            Assign User{" "}

            <span
              className="float-right cursor-pointer"
              onClick={this.closeModalEditResourceGroup}
            >
              <i className="fa fa-times" />
            </span>
          </h2>

          <div className="col-md-12">
            <div className="panel panel-default" />
            <form
              name="editresourceGroup"
              id="editresourceGroup"
              method="post"
              onSubmit={this.editResourceGroupAssignment}
            >
              <div className="form-group">
                <label>User Name</label> :&nbsp;
                {this.state.editDetails.email}
              </div>
              <fieldset className="fieldset-wrapper">
                <legend className="fieldset-legend color">
                  Assign User
                </legend>
                <input type="hidden" name="user_selected_hidden" id="user_selected_hidden" value={this.state.editDetails.user_id}></input>
                <div className="form-group">
                  <label htmlFor="user">
                    User<span className="star-mark">*</span>
                  </label> : {this.state.editDetails && this.state.editDetails.email}
                  {/* <select
                    className="form-control"
                    required
                    name="resource_user_id"
                    defaultValue={this.state.editDetails.user_id}
                    onChange={(e) => {
                      this.bindField(e);
                    }}
                  >
                    <option value="">--SELECT--</option>
                    {this.state.clientList.map((item, index) => (
                      <option value={item.id} key={index}>
                        {item.email}
                      </option>
                    ))}
                  </select> */}
                 {/* <ReactSelect
                      options={this.state.clientList}
                      isMulti = {false}
                      isDisabled={true}
                      closeMenuOnSelect={true}
                      hideSelectedOptions={true}
                      name="resource_user_id"
                      components={{
                        reactSelectComponentOption
                      }}
                      onChange={this.reactSelectHandleChangeClient}
                      
                      allowSelectAll={false}
                      value={this.state.optionClientSelected}
                    />*/}
                </div>
                <div className="form-group">
                  <label htmlFor="bu_id">
                    Subscription<span className="star-mark">*</span>
                    </label> : {this.state.editDetails && this.state.editDetails.subscription_name}
                    <input type="hidden" name="subscription_id" id="subscription_id" value={this.state.editDetails.subscription_id}></input>
                  {/*<select
                    className="form-control"
                    required
                    name="subscription_id"
                    defaultValue={this.state.editDetails.subscription_id}
                    onChange={(e) => {
                      this.handleSubscription(e.target.value);
                      this.bindField(e);
                    }}
                  >
                    <option value="">--SELECT--</option>
                    {this.state.subscriptionList.map((item, index) => (
                      <option value={item.subscription_id} key={index}>
                        {item.display_name}
                      </option>
                    ))}
                  </select>*/}
                </div>

                <div className="form-group">
                  <label htmlFor="mapped_users">Resource Group<span className="star-mark">*</span></label>
                   : {this.state.editDetails && this.state.editDetails.RGname}
                  <input type="hidden" name="resources" id="resources" value={this.state.editDetails.mapped_resource_group_ids && this.state.editDetails.mapped_resource_group_ids[0]}></input>
                  {/*<span
                    className="d-inline-block"
                    data-toggle="popover"
                    data-trigger="focus"
                    data-content="Please selecet resource(s)" style={{ width: '100%' }}
                  >
                    <ReactSelect
                      options={this.state.resourceLIST}
                      isMulti={false}
                      closeMenuOnSelect={true}
                      hideSelectedOptions={true}
                      name="resources"
                      components={{
                        reactSelectComponentOption
                      }}
//                      onChange={this.reactSelectHandleChange}
                    onChange={e => {this.reactSelectHandleChange(e,{'key':"editFormResourcesSelected", optionSelected : "editFormResourcesSelectedOptions"})}}
                      allowSelectAll={true}
                      value={this.state.editFormResourcesSelectedOptions}
                    // value={this.state.editDetails.resource_groups ? (this.state.editDetails.resource_groups).map((item) =>{
                    //   return item.resource_group
                    // }) : null}
                    />
                  </span>*/}
                </div>
                <div className="form-group">
                  <label htmlFor="role">
                    Role<span className="star-mark">*</span>
                  </label>
                  <select
                    className="form-control"
                    required
                    name="role_id"
                    defaultValue={this.state.editDetails.role_id}
                    onChange={(e) => {
                      this.bindField(e);
                   
                      
                      this.setState({
                        userRoleSelected: e.target[e.target.selectedIndex].getAttribute('data-isrole')
                      })
                      if (e.target.value == 3) {
                        this.setState({
                          hideReportsTo: true
                        })
                      } else {
                        this.setState({
                          hideReportsTo: false
                        })
                      }
                    }}
                  >
                    <option value="">--SELECT--</option>
                    {this.state.RoleList && this.state.RoleList.map((item, index) => (
                      <option value={item.id} data-isrole={item.is_role} key={index}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>

              <div className="form-group">
                <div style={{ float: "right" }}>
                  <button
                    className="btn btn-sm btn-primary mr-3"

                    onClick={this.closeModalEditResourceGroup}
                  >
                    {" "}
                    Cancel
                  </button>
                  <button className="btn btn-sm btn-primary  ">
                  	{this.state.isUpdateRGInProgress && <i className="fas fa-circle-notch icon-loading"></i> } Update
                  </button>
                </div>
                <span className="text-danger">Note : Change in Role assignments requires logging-out of all sessions of UCP and login again; for the new role assignment to be affected.</span>
              </div>
            </form>
          </div>
        </Modal>

        {/* Confirmation Modal  */}
        {this.state.modalDelete && (
          <SweetAlert
            warning
            showCancel
            confirmBtnText="Delete"
            confirmBtnBsStyle="danger"
            cancelBtnBsStyle="default"
            title="Are you sure to delete?"
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

export default connect(mapStateToProps)(RoleDataTablePage);
