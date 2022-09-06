import { userConstants } from "../_constants";

export function users(state = {}, action) {
  switch (action.type) {
    case userConstants.GETALL_REQUEST:
      return {
        loading: true
      };
    case userConstants.GETALL_SUCCESS:
      return {
        items: action.users
      };
    case userConstants.GETALL_FAILURE:
      return {
        error: action.error
      };
    case userConstants.ADDUSER_REQUEST:
      return {
        ...state,
        submitLoading: true
      };
    case userConstants.ADDUSER_SUCCESS:
      return {
        ...state,
        submitLoading: false,
        resdata: action.resdata
      };
    case userConstants.ADDUSER_FAILURE:
      return {
        ...state,
        submitLoading: false,
        error: action.error
      };
      case userConstants.EDITUSER_REQUEST:
      return {
        ...state,
        submitLoading: true,
      };
    case userConstants.EDITUSER_SUCCESS:
      return {
        ...state,
        resdata: action.resdata,
        submitLoading: false
      };
    case userConstants.EDITUSER_FAILURE:
      return {
        ...state,
        submitLoading: false,
        error: action.error
      };
    case userConstants.USER_RESET_PASSWORD_REQUEST:
      return {
        loading: true
      };
    case userConstants.USER_RESET_PASSWORD_SUCCESS:
      return {
        ...state,
        resdata: action.resdata
      };
    case userConstants.USER_RESET_PASSWORD_FAILURE:
      return {
        error: action.error
      };
    case userConstants.USER_CHANGE_PASSWORD_REQUEST:
      return {
        loading: true
      };
    case userConstants.USER_CHANGE_PASSWORD_SUCCESS:
      return {
        ...state,
        resdata: action.resdata
      };
    case userConstants.USER_CHANGE_PASSWORD_FAILURE:
      return {
        error: action.error
      };
    case userConstants.DELETE_REQUEST:
      // add 'deleting:true' property to user being deleted
      return {
        ...state,
        items: state.items.map(user =>
          user.id === action.id ? { ...user, deleting: true } : user
        )
      };
    case userConstants.DELETE_SUCCESS:
      // remove deleted user from state
      return {
        items: state.items.filter(user => user.id !== action.id)
      };
    case userConstants.DELETE_FAILURE:
      // remove 'deleting:true' property and add 'deleteError:[error]' property to user
      return {
        ...state,
        items: state.items.map(user => {
          if (user.id === action.id) {
            // make copy of user without 'deleting:true' property
            const { deleting, ...userCopy } = user;
            // return copy of user with 'deleteError:[error]' property
            return { ...userCopy, deleteError: action.error };
          }

          return user;
        })
      };
    default:
      return state;
  }
}
