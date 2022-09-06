import { ostemplatesConstants } from '../_constants';

export function ostemplates(state = {}, action) {
  switch (action.type) {
    case ostemplatesConstants.GETALL_REQUEST:
      return {
        loading: true
      };
    case ostemplatesConstants.GETALL_SUCCESS:
      return {
        items: action.ostemplates
      };
    case ostemplatesConstants.GETALL_FAILURE:
      return { 
        error: action.error
      };
      case ostemplatesConstants.UPDATEOS_REQUEST:
      return {
        loading: true
      };
    case ostemplatesConstants.UPDATEOS_SUCCESS:
      return {
        items: action.ostemplates
      };
    case ostemplatesConstants.UPDATEOS_FAILURE:
      return { 
        error: action.error
      };
    case ostemplatesConstants.DELETE_REQUEST:
      // add 'deleting:true' property to user being deleted
      return {
        ...state,
        items: state.items.map(ostemp =>
            ostemp.id === action.id
            ? { ...ostemp, deleting: true }
            : ostemp
        )
      };
    case ostemplatesConstants.DELETE_SUCCESS:
      // remove deleted ostemp from state
      return {
        items: state.items.filter(ostemp => ostemp.id !== action.id)
      };
    case ostemplatesConstants.DELETE_FAILURE:
      // remove 'deleting:true' property and add 'deleteError:[error]' property to ostemp 
      return {
        ...state,
        items: state.items.map(ostemp => {
          if (ostemp.id === action.id) {
            // make copy of ostemp without 'deleting:true' property
            const { deleting, ...ostempCopy } = ostemp;
            // return copy of ostemp with 'deleteError:[error]' property
            return { ...ostempCopy, deleteError: action.error };
          }

          return ostemp;
        })
      };
    default:
      return state
  }
}