import { userConstants } from '../_constants';

export function forgotpass(state = {}, action) {
  switch (action.type) {
    case userConstants.FORGOTPASS_REQUEST:
      return { forgotpassing: true };
    case userConstants.FORGOTPASS_SUCCESS:
      return {};
    case userConstants.FORGOTPASS_FAILURE:
      return {};
    default:
      return state
  }
}