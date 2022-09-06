import { menuConstants } from '../_constants';
import { menuService } from '../_services';
import { alertActions } from './';
import { history } from '../_helpers';
import { toast } from 'react-toastify';

export const menuActions = {
    getMenuList
};

function getMenuList(params){
    return dispatch => {
        dispatch(request(params.clientid));
        menuService.getMenuList(params)       
            .then(
                menuList => { 
                    dispatch(success(menuList));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: menuConstants.MENU_LIST_REQUEST, clientid } }
    function success(menuList) { return { type: menuConstants.MENU_LIST_SUCCESS, menuList } }
    function failure(error) { return { type: menuConstants.MENU_LIST_FAILURE, error } }
}