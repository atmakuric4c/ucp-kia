import { ApprovalMatrixConstants } from "./ApprovalMatrix.constants";
import { ApprovalMatrixService } from "./ApprovalMatrix.services";
import { alertActions } from "../../_actions";
import { history,authHeader, ucpEncrypt, ucpDecrypt } from "../../_helpers";
import { toast } from 'react-toastify';
import config from "config";

export const ApprovalMatrixActions = {
  getAll,
  addApprovalMatrixRequest,
  editApprovalMatrixRequest,
};


function getAll(params) {
  return dispatch => {
    dispatch(request());
    ApprovalMatrixService
      .getAll(params)
      .then(
    	data => dispatch(success(data)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: ApprovalMatrixConstants.GETALL_REQUEST };
  }
  function success(data) {
    return { type: ApprovalMatrixConstants.GETALL_SUCCESS, data };
  }
  function failure(error) {
    return { type: ApprovalMatrixConstants.GETALL_FAILURE, error };
  }
}

function addApprovalMatrixRequest(ApprovalMatrixdata,clientid) {
  return dispatch => {
    dispatch(request(ApprovalMatrixdata));
    ApprovalMatrixService.addApprovalMatrix(ApprovalMatrixdata).then(
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
    return { type: ApprovalMatrixConstants.ADD_ApprovalMatrix_REQUEST, ApprovalMatrixdata };
  }
  function success(resdata) {
    return { type: ApprovalMatrixConstants.ADD_ApprovalMatrix_SUCCESS, resdata };
  }
  function failure(error) {
    return { type: ApprovalMatrixConstants.ADD_ApprovalMatrix_FAILURE, error };
  }
}

function editApprovalMatrixRequest(ApprovalMatrixdata,clientid) {
  return dispatch => {
    dispatch(request(ApprovalMatrixdata));
    ApprovalMatrixService.update(ApprovalMatrixdata).then(
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
    return { type: ApprovalMatrixConstants.EDIT_ApprovalMatrix_REQUEST, ApprovalMatrixdata };
  }
  function success(resdata) {
    return { type: ApprovalMatrixConstants.EDIT_ApprovalMatrix_SUCCESS, resdata };
  }
  function failure(error) {
    return { type: ApprovalMatrixConstants.EDIT_ApprovalMatrix_FAILURE, error };
  }
}
