import { menusConstants } from './menus.constants';
import { menusService } from './menus.services';
import { alertActions } from '../../_actions';
import { history } from '../../_helpers';
import { toast } from 'react-toastify';

export const menusActions = {
    getAll,
    saveMenu,
    deleteMenu
};

function getAll() {
    return dispatch => {
        dispatch(request());
        menusService.getAll()
            .then(
                menus => dispatch(success(menus)),
                error => dispatch(failure(error.toString()))
            );
    };

    function request() { return { type: menusConstants.MENUS_GETALL_REQUEST } }
    function success(menus) { return { type: menusConstants.MENUS_GETALL_SUCCESS, menus } }
    function failure(error) { return { type: menusConstants.MENUS_GETALL_FAILURE, error } }
}

function saveMenu(formData){
  let menuType = "Edit";
  if(typeof formData.menu_id == "undefined" || formData.menu_id == 0){
    menuType = "Add";
  }
    return dispatch => {
        dispatch(request(formData));
        menusService.saveMenu(formData).then(
          resdata => {
            dispatch(success(resdata));
            if(resdata.success == false){          
              toast.error(resdata.message);
              dispatch(getAll());
            } else {          
              toast.success(resdata.message);
              dispatch(getAll());
            }
          },
          error => {
            failure(error.toString()),
            toast.error(error.toString()),
            dispatch(getAll());
          }
        );
    }
    function request(formData) {
      return { type: menusConstants.MENUS_ADDMENU_REQUEST, formData };
    }
    function success(resdata) {
      return { type: menusConstants.MENUS_ADDMENU_SUCCESS, resdata };
    }
    function failure(error) {
      return { type: menusConstants.MENUS_ADDMENU_FAILURE, error };
    }
}
function deleteMenu(id) {
  return dispatch => {
    dispatch(request(id));

    menusService
      .deleteMenu(id)
      .then(
        resdata => {
          dispatch(success(resdata));
          console.log("resdata ==="+JSON.stringify(resdata));
          if(resdata.success == false){          
            toast.error(resdata.message);
            dispatch(getAll());
          } else {          
            toast.success(resdata.message);
            dispatch(getAll());
          }
        },
        error => {
          failure(error.toString()),
          toast.error(error.toString());
          dispatch(getAll());
        }
      );
  };

  function request(id) {
    return { type: menusConstants.MENUS_DELETEMENU_REQUEST, id };
  }
  function success(id) {
    return { type: menusConstants.MENUS_DELETEMENU_SUCCESS, id };
  }
  function failure(id, error) {
    return { type: menusConstants.MENUS_DELETEMENU_FAILURE, id, error };
  }
}

