import { RoleConstants } from "./Roles.Constants";
import { RolesService } from "./Roles.services";
import { alertActions } from "../../_actions";
import { toast } from 'react-toastify';

export const ApprovalMatrixActions = {
  getAll,
  getUserAll,
  getAllRoles,
  addApprovalMatrixRequest,
  editApprovalMatrixRequest,
  getAllAssignUsers,
};


function getAll(params) {
  return dispatch => {
    dispatch(request());
    RolesService
      .getAll(params)
      .then(
    	data => dispatch(success(data)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: RoleConstants.GETALL_REQUEST };
  }
  function success(data) {
    return { type: RoleConstants.GETALL_SUCCESS, data };
  }
  function failure(error) {
    return { type: RoleConstants.GETALL_FAILURE, error };
  }
}

function getUserAll(params) {
  return dispatch => {
    dispatch(request());
    RolesService
      .getUserAll(params)
      .then(
    	data => dispatch(success(data)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: RoleConstants.GETALL_REQUEST };
  }
  function success(data) {
    return { type: RoleConstants.GETALL_SUCCESS, data };
  }
  function failure(error) {
    return { type: RoleConstants.GETALL_FAILURE, error };
  }
}

function getAllRoles(params) {
  return dispatch => {
    dispatch(request());
    RolesService
      .getAllRoles(params)
      .then(
    	data => dispatch(success(data)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: RoleConstants.GETALL_REQUEST };
  }
  function success(data) {
    return { type: RoleConstants.GETALL_SUCCESS, data };
  }
  function failure(error) {
    return { type: RoleConstants.GETALL_FAILURE, error };
  }
}

function getAllAssignUsers(params) {
  return dispatch => {
    dispatch(request());
    RolesService
      .getAllAssignUsers(params)
      .then(
    	data => dispatch(success(data)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: RoleConstants.GETALL_REQUEST };
  }
  function success(data) {
    return { type: RoleConstants.GETALL_SUCCESS, data };
  }
  function failure(error) {
    return { type: RoleConstants.GETALL_FAILURE, error };
  }
}

function addApprovalMatrixRequest(ApprovalMatrixdata,clientid) {
  return dispatch => {
    dispatch(request(ApprovalMatrixdata));
    RolesService.addApprovalMatrix(ApprovalMatrixdata).then(
      resdata => {
        dispatch(success(resdata));
        if(resdata.success == false){          
          toast.error(resdata.message);
        } else {  
          toast.success("Approval Matrix Added successfully");
          setTimeout(function() {
            dispatch(ApprovalMatrixActions.getAll(clientid));
          }, 2000);
        }
         
      },
      error => {
        //dispatch(failure(error.toString()));
        toast.error(error.toString());
        //dispatch(alertActions.error(error.toString()));
      }
    );
  };

  function request(ApprovalMatrixdata) {
    return { type: RolesConstants.ADD_ApprovalMatrix_REQUEST, ApprovalMatrixdata };
  }
  function success(resdata) {
    return { type: RolesConstants.ADD_ApprovalMatrix_SUCCESS, resdata };
  }
  function failure(error) {
    return { type: RolesConstants.ADD_ApprovalMatrix_FAILURE, error };
  }
}

function editApprovalMatrixRequest(ApprovalMatrixdata,clientid) {
  return dispatch => {
    dispatch(request(ApprovalMatrixdata));
    RolesService.update(ApprovalMatrixdata).then(
      resdata => {
        dispatch(success(resdata));
        if(resdata.success == false){          
          toast.error(resdata.message);
        }
        else{
          toast.success("Approval Matrix Updated successfully");
          setTimeout(function() {
            dispatch(ApprovalMatrixActions.getAll(clientid));
          }, 2000);
        }
      },
      error => {
        dispatch(failure(error.toString()));
        dispatch(alertActions.error(error.toString()));
      }
        
    );
  };

  function request(ApprovalMatrixdata) {
    return { type: RolesConstants.EDIT_ApprovalMatrix_REQUEST, ApprovalMatrixdata };
  }
  function success(resdata) {
    return { type: RolesConstants.EDIT_ApprovalMatrix_SUCCESS, resdata };
  }
  function failure(error) {
    return { type: RolesConstants.EDIT_ApprovalMatrix_FAILURE, error };
  }
}
