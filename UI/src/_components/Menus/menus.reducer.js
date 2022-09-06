import { menusConstants } from './menus.constants';

export function menus(state = {}, action) {
  switch (action.type) {
    case menusConstants.MENUS_GETALL_REQUEST:
      return {
        ...state,
        loading: true
      };
    case menusConstants.MENUS_GETALL_SUCCESS:
      return {
        ...state,
        loading:false,
        items: action.menus
      };
    case menusConstants.MENUS_GETALL_FAILURE:
      return { 
        ...state,
        error: action.error
      };
    case menusConstants.MENUS_ADDMENU_REQUEST:
      return {
        loading: true
      };
    case menusConstants.MENUS_ADDMENU_SUCCESS:
      return {
        ...state,
        addMenu: action.addMenu
      };
    case menusConstants.MENUS_ADDMENU_FAILURE:
      return { 
        error: action.error
      };  
    case menusConstants.MENUS_DELETEMENU_REQUEST:
      return {
        loading: true
      };
    case menusConstants.MENUS_DELETEMENU_SUCCESS:
      return {
        ...state,
        deleteMenu: action.deleteMenu
      };
    case menusConstants.MENUS_DELETEMENU_FAILURE:
      return { 
        error: action.error
      };  
    default:
      return state
  }
}