import { profileConstants } from '../_constants';

export function profiles(state = {}, action) {
  switch (action.type) {
    case profileConstants.GETALL_REQUEST:
      return {
        loading: true
      };
    case profileConstants.GETALL_SUCCESS:
      return {
        items: action.profiles
      };
    case profileConstants.GETALL_FAILURE:
      return { 
        error: action.error
      };
    case profileConstants.DELETE_REQUEST:
      // add 'deleting:true' property to user being deleted
      return {
        ...state,
        items: state.items.map(profile =>
            profile.id === action.id
            ? { ...profile, deleting: true }
            : profile
        )
      };
    case profileConstants.DELETE_SUCCESS:
      // remove deleted profile from state
      return {
        items: state.items.filter(profile => profile.id !== action.id)
      };
    case profileConstants.DELETE_FAILURE:
      // remove 'deleting:true' property and add 'deleteError:[error]' property to profile 
      return {
        ...state,
        items: state.items.map(profile => {
          if (profile.id === action.id) {
            // make copy of profile without 'deleting:true' property
            const { deleting, ...profileCopy } = profile;
            // return copy of profile with 'deleteError:[error]' property
            return { ...profileCopy, deleteError: action.error };
          }

          return profile;
        })
      };

    case profileConstants.PROFILE_LIST_REQUEST:
      return {
        ...state,
        loading: true
      };
    case profileConstants.PROFILE_LIST_SUCCESS:
      return {
        ...state,
        loading:false,
        profileList: action.profileList
      };
    case profileConstants.PROFILE_LIST_FAILURE:
      return { 
        ...state,
        loading:false
      };
    
    case profileConstants.ADD_PROFILE_UPDATE_MODAL:
      return { 
          ...state,
          showAddProfileModal: action.value
      };

    case profileConstants.EDIT_PROFILE_UPDATE_MODAL:
      return { 
          ...state,
          showUpdateProfileModal: action.value
      };
    
    case profileConstants.ADD_PROFILE_REQUEST:
      return {
        ...state,
        loadingAddProfile: true
      };
    case profileConstants.ADD_PROFILE_SUCCESS:
      return {
        ...state,
        loadingAddProfile: false
      };
    case profileConstants.ADD_PROFILE_FAILURE:
      return { 
        ...state,
        loadingAddProfile: false
      };

    case profileConstants.UPDATE_PROFILE_REQUEST:
      return {
        ...state,
        loadingUpdateProfile: true
      };
    case profileConstants.UPDATE_PROFILE_SUCCESS:
      return {
        ...state,
        loadingUpdateProfile: false
      };
    case profileConstants.UPDATE_PROFILE_FAILURE:
      return { 
        ...state,
        loadingUpdateProfile: false
      };

    case profileConstants.DELETE_PROFILE_REQUEST:
      return {
        ...state,
        loadingDeleteProfile: true
      };
    case profileConstants.DELETE_PROFILE_SUCCESS:
      return {
        ...state,
        loadingDeleteProfile: false
      };
    case profileConstants.DELETE_PROFILE_FAILURE:
      return { 
        ...state,
        loadingDeleteProfile: false
      };

    case profileConstants.USER_PROFILE_REQUEST:
      return {
        ...state,
        loadingUserProfile: true
      };
    case profileConstants.USER_PROFILE_SUCCESS:
      return {
        ...state,
        loadingUserProfile:false,
        userProfileMenu: action.userProfileMenu
      };
    case profileConstants.USER_PROFILE_FAILURE:
      return { 
        ...state,
        loadingUserProfile:false
      };

    case profileConstants.VMOPERATION_LIST_REQUEST:
      return {
        ...state,
        loading: true
      };
    case profileConstants.VMOPERATION_LIST_SUCCESS:
      return {
        ...state,
        loading:false,
        vmOperationList: action.vmOperationList
      };
    case profileConstants.VMOPERATION_LIST_FAILURE:
      return { 
        ...state,
        loading:false
      };

    default:
      return state
  }
}