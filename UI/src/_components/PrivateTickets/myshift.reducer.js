import { supportConstants } from './myshift.constants';

export function myshift(state = {}, action) {
  switch (action.type) {
    case supportConstants.MYTICKET_GETALL_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case supportConstants.MYTICKET_GETALL_SUCCESS:
      return {
        ...state,
        loading:false,
        items: action.tickets
      };
    case supportConstants.MYTICKET_GETALL_FAILURE:
      return { 
        ...state,
        error: action.error
      }; 
      
      case supportConstants.createTicket_REQUEST:
      return {
        ...state,
        submitLoading: true
      };
    case supportConstants.createTicket_SUCCESS:
      return {
        ...state,
        submitLoading: false,
        resdata: action.resdata
      };
    case supportConstants.createTicket_FAILURE:
      return {
        ...state,
        submitLoading: false,
        error: action.error
      };
     case supportConstants.SUPPORT_TICKET_REQUEST:
        return {
          ...state
        };
      case supportConstants.SUPPORT_TICKET_SUCCESS:
        return {
          ...state,
          loading:false,
          detail: action.tktDetail
        };
      case supportConstants.SUPPORT_TICKET_FAILURE:
        return { 
          ...state,
          error: action.error
        };
    case supportConstants.SUPPORT_FORMDATA_REQUEST:
      return {
        ...state,
      };
    case supportConstants.SUPPORT_FORMDATA_SUCCESS:
      return {
        ...state,
        configdata: action.configdata
      };
    case supportConstants.SUPPORT_FORMDATA_FAILURE:
      return { 
        error: action.error
      };
    default:
      return state
  }
}