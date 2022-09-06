import { settingsConstants } from "../_constants";
const initialState = {
  emaildata: []
};
export function emailsettings(state = {}, action) {
  switch (action.type) {
    case settingsConstants.SETTINGS_GETALL_REQUEST:
      return {
        loading: true
      };
    case settingsConstants.SETTINGS_GETALL_SUCCESS:
      return {
        ...state,
        emaildata: action.emaildata
      };
    case settingsConstants.SETTINGS_GETALL_FAILURE:
      return {
        error: action.error
      };
    case settingsConstants.SETTINGS_EMAIL_ENABLE_DISABLE_REQUEST:
      return {
        loading: true
      };
    case settingsConstants.SETTINGS_EMAIL_ENABLE_DISABLE_SUCCESS:
      return {
        ...state,
        id: action.id
      };
    case settingsConstants.SETTINGS_EMAIL_ENABLE_DISABLE_FAILURE:
      return {
        error: action.error
      };
    case settingsConstants.SETTINGS_EMAIL_ADD_REQUEST:
      return {
        ...state,
        loading: true
      };
    case settingsConstants.SETTINGS_EMAIL_ADD_SUCCESS:
      return {
        ...state,
        id: action.id
      };
    case settingsConstants.SETTINGS_EMAIL_ADD_FAILURE:
      return {
        error: action.error
      };

    //SETTINGS_EMAIL_ADD_REQUEST
    default:
      return state;
  }
}
