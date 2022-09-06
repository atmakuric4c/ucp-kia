import { menuConstants } from '../_constants';

export function menus(state = {}, action) {
    switch (action.type) {
      case menuConstants.MENU_LIST_REQUEST:
      return {
        ...state,
        loading: true
      };
    case menuConstants.MENU_LIST_SUCCESS:
      return {
        ...state,
        loading:false,
        menuList: action.menuList
      };
    case menuConstants.MENU_LIST_FAILURE:
      return { 
        ...state,
        loading:false
      };

    default:
      return state
  }
}