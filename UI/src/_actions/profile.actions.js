import { profileConstants } from '../_constants';
import { profileService } from '../_services';
import { alertActions } from './';
import { history } from '../_helpers';
import { toast } from 'react-toastify';

export const profileActions = {
    getAll,
    addProfile,
    editProfile,      
    delete: _delete,
    getProfileList,
    addProfile,
    updateProfile,
    deleteProfile,
    getUserProfile,
    getVMOperationList,
    updateAddProfileModal,
    updateEditProfileModal
};

function getAll() {
    return dispatch => {
        dispatch(request());

        profileService.getAll()
            .then(
                profiles => dispatch(success(profiles)),
                error => dispatch(failure(error.toString()))
            );
    };

    function request() { return { type: profileConstants.GETALL_REQUEST } }
    function success(profiles) { return { type: profileConstants.GETALL_SUCCESS, profiles } }
    function failure(error) { return { type: profileConstants.GETALL_FAILURE, error } }
}

function addProfile(profiledata) {    
    return dispatch => {
        dispatch(request(profiledata));
        profileService.addProfile(profiledata)
            .then(
                profiledata => { 
                    dispatch(success(profiledata));
                    history.push('/profiles');
                    toast.success("Profile Added successful");
                    //dispatch(alertActions.success('Profile Added successful'));
                },
                error => {
                    //dispatch(failure(error.toString()));
                    //dispatch(alertActions.error(error.toString()));
                    toast.error(error.toString());
                }
            );
    };

    function request(profiledata) { return { type: profileConstants.ADDPROFILE_REQUEST, profiledata } }
    function success(profiledata) { return { type: profileConstants.ADDPROFILE_SUCCESS, profiledata } }
    function failure(error) { return { type: profileConstants.ADDPROFILE_FAILURE, error } }
}


function editProfile(formData) {    
    return dispatch => {
        dispatch(request(formData));
        profileService.update(formData)
            .then(
                profiledata => { 
                    dispatch(success(profiledata));
                    history.push('/profiles');
                    //dispatch(alertActions.success('Profile Updated successful'));
                    toast.success("Profile Updated successful");
                },
                error => {
                    //dispatch(failure(error.toString()));
                    toast.error(error.toString());
                    //dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(formData) { return { type: profileConstants.EDITPROFILE_REQUEST, formData } }
    function success(profiledata) { return { type: profileConstants.EDITPROFILE_SUCCESS, profiledata } }
    function failure(error) { return { type: profileConstants.EDITPROFILE_FAILURE, error } }
}
// prefixed function name with underscore because delete is a reserved word in javascript
function _delete(id) {
    return dispatch => {
        dispatch(request(id));

        profileService.delete(id)
            .then(
                profile => dispatch(success(id)),
                error => dispatch(failure(id, error.toString()))
            );
    };

    function request(id) { return { type: profileConstants.DELETE_REQUEST, id } }
    function success(id) { return { type: profileConstants.DELETE_SUCCESS, id } }
    function failure(id, error) { return { type: profileConstants.DELETE_FAILURE, id, error } }
}

function getProfileList(params){
    return dispatch => {
        dispatch(request(params.clientid));
        profileService.getProfileList(params)       
            .then(
                profileList => { 
                    dispatch(success(profileList));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: profileConstants.PROFILE_LIST_REQUEST, clientid } }
    function success(profileList) { return { type: profileConstants.PROFILE_LIST_SUCCESS, profileList } }
    function failure(error) { return { type: profileConstants.PROFILE_LIST_FAILURE, error } }
}

function addProfile(params){
    return dispatch => {
        dispatch(request(params.clientid));
        profileService.addProfile(params)       
            .then(
                pgiData => {
                    dispatch(success(pgiData), toast.success('Profile Created Successfully!'));
                    dispatch(this.getProfileList({clientid: null}));
                    dispatch(this.updateAddProfileModal(false));
                },
                error => {
                    dispatch(failure(error.toString(), toast.error(error)));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: profileConstants.ADD_PROFILE_REQUEST, clientid } }
    function success(pgiData) { return { type: profileConstants.ADD_PROFILE_SUCCESS, pgiData } }
    function failure(error) { return { type: profileConstants.ADD_PROFILE_FAILURE, error } }
}

function updateProfile(params){
    return dispatch => {
        dispatch(request(params.clientid));
        profileService.updateProfile(params)       
            .then(
                pgiData => {
                    dispatch(success(pgiData), toast.success('Profile Updated Successfully!'));
                    dispatch(this.getProfileList({clientid: null}));
                    dispatch(this.updateEditProfileModal(false));
                },
                error => {
                    dispatch(failure(error.toString(), toast.error(error)));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: profileConstants.UPDATE_PROFILE_REQUEST, clientid } }
    function success(pgiData) { return { type: profileConstants.UPDATE_PROFILE_SUCCESS, pgiData } }
    function failure(error) { return { type: profileConstants.UPDATE_PROFILE_FAILURE, error } }
}

function deleteProfile(params){
    return dispatch => {
        dispatch(request(params.clientid));
        profileService.deleteProfile(params)       
            .then(
                pgiData => {
                    dispatch(success(pgiData), toast.success('Profile Deleted Successfully!'));
                    dispatch(this.getProfileList({clientid: null}));
                },
                error => {
                    dispatch(failure(error.toString(), toast.error(error)));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: profileConstants.DELETE_PROFILE_REQUEST, clientid } }
    function success(pgiData) { return { type: profileConstants.DELETE_PROFILE_SUCCESS, pgiData } }
    function failure(error) { return { type: profileConstants.DELETE_PROFILE_FAILURE, error } }
}

function getUserProfile(params){
    return dispatch => {
        dispatch(request(params.clientid));
        profileService.getUserProfile(params)       
            .then(
                userProfileMenu => { 
                    let vm_operations_obj = userProfileMenu.data.vm_operations
                    .reduce((ac,a) => ({...ac, [a['event']]: 1}),{});

                    userProfileMenu.data.vm_operations_obj = vm_operations_obj;

                    dispatch(success(userProfileMenu));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: profileConstants.USER_PROFILE_REQUEST, clientid } }
    function success(userProfileMenu) { return { type: profileConstants.USER_PROFILE_SUCCESS, userProfileMenu } }
    function failure(error) { return { type: profileConstants.USER_PROFILE_FAILURE, error } }
}

function getVMOperationList(params){
    return dispatch => {
        dispatch(request(params.clientid));
        profileService.getVMOperationList(params)       
            .then(
                vmOperationList => { 
                    dispatch(success(vmOperationList));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: profileConstants.VMOPERATION_LIST_REQUEST, clientid } }
    function success(vmOperationList) { return { type: profileConstants.VMOPERATION_LIST_SUCCESS, vmOperationList } }
    function failure(error) { return { type: profileConstants.VMOPERATION_LIST_FAILURE, error } }
}

function updateAddProfileModal(type) {
    return dispatch => {
        dispatch({ type: profileConstants.ADD_PROFILE_UPDATE_MODAL, value: type });
    }
}

function updateEditProfileModal(type) {
    return dispatch => {
        dispatch({ type: profileConstants.EDIT_PROFILE_UPDATE_MODAL, value: type });
    }
}