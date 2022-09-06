import { userConstants } from "../_constants";
import { userService } from "../_services";
import { alertActions } from "./";
import { history,authHeader, ucpEncrypt, ucpDecrypt } from "../_helpers";
import { toast } from 'react-toastify';
import config from "config";

export const userActions = {
  login,
  logout,
  register,
  getAll,
  forgotpass,
  addUserRequest,
  editUserRequest,
  resetPasswordRequest,
  changePasswordRequest,
  resetNewPasswordRequest,
  validateResetPasswordRequest,
  delete: _delete
};

function login(email, password) {
  return dispatch => {
    dispatch(request({ email }));
    userService.login(email, password).then(
      user => {
        console.log("user === "+JSON.stringify(user));
        if(!user.success){        
          dispatch(failure(user.message));  
          toast.error(user.message);
        } else {     
          dispatch(success(user));     
          /*if(user.data.is_password_expired == 1){
            //console.log("user.data.is_password_expired == "+user.data.is_password_expired);
            history.push("/#/resetpassword");
            location.reload();
          }else{*/
            //history.push("/#/");
            //location.reload();
            localStorage.setItem("showVersion","");
            window.location.href = window.location.origin;
          //}
          
        }
      },
      error => {
        if(error){
          error = error.toString();
        }
        toast.error(error);
        dispatch(failure(error));
        dispatch(alertActions.error(error.toString()));
      }
    );
  };

  function request(user) {
    return { type: userConstants.LOGIN_REQUEST, user };
  }
  function success(user) {
    return { type: userConstants.LOGIN_SUCCESS, user };
  }
  function failure(error) {
    return { type: userConstants.LOGIN_FAILURE, error };
  }
}

function logout() {
  userService.logout();
  history.push("/login");
  return { type: userConstants.LOGOUT };
}

function register(user) {
  return dispatch => {
    dispatch(request(user));

    userService.register(user).then(
      user => {
        dispatch(success());
        if(user.success){          
          toast.success("User registeration successfully done.");
          history.push("/#/login");
          setTimeout(function() {
            location.reload();
          }, 3000);       
        } else {     
          
          toast.error(user.message);
        }
      },
      error => {
        dispatch(failure(error.toString()));
        dispatch(alertActions.error(error.toString()));
      }
    );
  };

  function request(user) {
    return { type: userConstants.REGISTER_REQUEST, user };
  }
  function success(user) {
    return { type: userConstants.REGISTER_SUCCESS, user };
  }
  function failure(error) {
    return { type: userConstants.REGISTER_FAILURE, error };
  }
}

function forgotpass(user) {
  return dispatch => {
    dispatch(request(user));
    userService.forgotpass(user).then(
      user => {
        dispatch(success());
        if(user && user.success){
          toast.success(user.message);
          history.push("/#/login");
          setTimeout(function() {
            location.reload();
          }, 3000);      
        } else if(user && user.message){          
          toast.error(user.message);
        } else {          
          toast.error("The operation did not execute as expected. Please raise a ticket to support");
        }
      },
      error => {
        dispatch(failure(error.toString()));
        dispatch(alertActions.error(error.toString()));
      }
    );
  };

  function request(user) {
    return { type: userConstants.FORGOTPASS_REQUEST, user };
  }
  function success(user) {
    return { type: userConstants.FORGOTPASS_SUCCESS, user };
  }
  function failure(error) {
    return { type: userConstants.FORGOTPASS_FAILURE, error };
  }
}

function getAll(clientid) {
  return dispatch => {
    dispatch(request());
    userService
      .getAll(clientid)
      .then(
        users => dispatch(success(users)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: userConstants.GETALL_REQUEST };
  }
  function success(users) {
    return { type: userConstants.GETALL_SUCCESS, users };
  }
  function failure(error) {
    return { type: userConstants.GETALL_FAILURE, error };
  }
}

function addUserRequest(userdata,clientid) {
  return dispatch => {
    dispatch(request(userdata));
    userService.addUser(userdata).then(
      resdata => {
        dispatch(success(resdata));
        // history.push("/#/users");
        if(resdata.success == false){          
          toast.error(resdata.message);
        } else {  
          var quesAndans = {
            'user_id': resdata.insertId,
            'questions': userdata.quesAndans
          }
          var requestOptions = {
              method: 'POST',
              body: JSON.stringify(quesAndans),
              headers: { ...authHeader(), 'Content-Type': 'application/json' }
          };
          fetch(`${config.apiUrl}/securityQuestions/user`, requestOptions).then(response  => {
              return response.text().then(text => {
                toast.success("Security Questions & Answers Added successfully");
                  let data = text && JSON.parse(text);
                  return data;
              });
          });        
          toast.success("User Added successfully");
          setTimeout(function() {
            dispatch(userActions.getAll(clientid));
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

  function request(userdata) {
    return { type: userConstants.ADDUSER_REQUEST, userdata };
  }
  function success(resdata) {
    return { type: userConstants.ADDUSER_SUCCESS, resdata };
  }
  function failure(error) {
    return { type: userConstants.ADDUSER_FAILURE, error };
  }
}

function editUserRequest(userdata,clientid) {
  return dispatch => {
    dispatch(request(userdata));
    userService.update(userdata).then(
      resdata => {
        dispatch(success(resdata));
        if(resdata.success == false){          
          toast.error(resdata.message);
        }
        else{
          var quesAndans = {
            'user_id': userdata.id,
            'questions': userdata.quesAndans
          }
          var requestOptions = {
              method: 'PUT',
              body: JSON.stringify(quesAndans),
              headers: { ...authHeader(), 'Content-Type': 'application/json' }
          };
          fetch(`${config.apiUrl}/securityQuestions/user`, requestOptions).then(response  => {
              return response.text().then(text => {
                toast.success("Security Questions & Answers Updated successfully");
                  let data = text && JSON.parse(text);
                  return data;
              });
          });
          toast.success("User Updated successfully");
          setTimeout(function() {
            dispatch(userActions.getAll(clientid));
          }, 2000);
        }
      },
      error => {
        dispatch(failure(error.toString()));
        dispatch(alertActions.error(error.toString()));
      }
        
    );
  };

  function request(userdata) {
    return { type: userConstants.EDITUSER_REQUEST, userdata };
  }
  function success(resdata) {
    return { type: userConstants.EDITUSER_SUCCESS, resdata };
  }
  function failure(error) {
    return { type: userConstants.EDITUSER_FAILURE, error };
  }
}
// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
  return dispatch => {
    dispatch(request(id));

    userService
      .delete(id)
      .then(
        user => dispatch(success(id)),
        error => dispatch(failure(id, error.toString()))
      );
  };

  function request(id) {
    return { type: userConstants.DELETE_REQUEST, id };
  }
  function success(id) {
    return { type: userConstants.DELETE_SUCCESS, id };
  }
  function failure(id, error) {
    return { type: userConstants.DELETE_FAILURE, id, error };
  }
}

function resetPasswordRequest(formData){
    return dispatch => {
        dispatch(request(formData));
        userService.resetPasswordRequest(formData).then(
          resdata => {
            dispatch(success(resdata));
            if(resdata.success == false){          
              toast.error(resdata.message);
            } else {          
              toast.success(resdata.message);
              localStorage.removeItem("user");
              localStorage.removeItem("menus");
              history.push("/#/login");
              setTimeout(function() {
                location.reload();
              }, 2000);
            }
          },
          error => {
            failure(error.toString()),
            toast.error(error.toString())
          }
        );
    }
    function request(formData) {
      return { type: userConstants.USER_RESET_PASSWORD_REQUEST, formData };
    }
    function success(resdata) {
      return { type: userConstants.USER_RESET_PASSWORD_SUCCESS, resdata };
    }
    function failure(error) {
      return { type: userConstants.USER_RESET_PASSWORD_FAILURE, error };
    }
}
function changePasswordRequest(formData){
  return dispatch => {
      dispatch(request(formData));
      userService.changePasswordRequest(formData).then(
        resdata => {
          dispatch(success(resdata));
          if(resdata.status == "error"){          
            toast.error(resdata.message);
          } else {          
            toast.success(resdata.message);
            setTimeout(function() {
              location.reload();
            }, 2000);
          }
        },
        error => {
          failure(error.toString()),
          toast.error(error.toString());
        }
      );
  }
  function request(formData) {
    return { type: userConstants.USER_CHANGE_PASSWORD_REQUEST, formData };
  }
  function success(resdata) {
    return { type: userConstants.USER_CHANGE_PASSWORD_SUCCESS, resdata };
  }
  function failure(error) {
    return { type: userConstants.USER_CHANGE_PASSWORD_FAILURE, error };
  }
}

function resetNewPasswordRequest(hash, newPassowrd, confirmPassowrd) {
  return dispatch => {
    dispatch(request({ hash, newPassowrd, confirmPassowrd }));
    userService.resetNewPasswordRequest(hash, newPassowrd, confirmPassowrd).then(
      user => {
        if(!user.success){        
          dispatch(failure(user.message));  
          toast.success(user.message);
          history.push("/#/login");
          setTimeout(function() {
            location.reload();
          }, 2000);
        } else {     
          dispatch(success(user));  
          history.push("/#/");
          location.reload();
        }
      },
      error => {
        toast.error(error);
        dispatch(failure(error.toString()));
        dispatch(alertActions.error(error.toString()));
      }
    );
  };

  function request(formData) {
    return { type: userConstants.USER_RESET_PASSWORD_REQUEST, formData };
  }
  function success(resdata) {
    return { type: userConstants.USER_RESET_PASSWORD_SUCCESS, resdata };
  }
  function failure(error) {
    return { type: userConstants.USER_RESET_PASSWORD_FAILURE, error };
  }
}

function validateResetPasswordRequest(hash) {
  return dispatch => {
    dispatch(request({ hash }));
    userService.validateResetPasswordRequest(hash).then(
      user => {
        if(user.status == "error"){
          dispatch(failure(user.message));  
          toast.error(user.message);
          history.push("/#/login");
          setTimeout(function() {
            location.reload();
          }, 2000);
        }
      },
      error => {
        toast.error(error);
        dispatch(failure(error.toString()));
        dispatch(alertActions.error(error.toString()));
      }
    );
  };

  function request(formData) {
    return { type: userConstants.USER_RESET_PASSWORD_REQUEST, formData };
  }
  function success(resdata) {
    return { type: userConstants.USER_RESET_PASSWORD_SUCCESS, resdata };
  }
  function failure(error) {
    return { type: userConstants.USER_RESET_PASSWORD_FAILURE, error };
  }
}