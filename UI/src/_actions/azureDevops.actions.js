import { azureDevopsConstants } from '../_constants';
import { azureDevopsService } from '../_services';
import { alertActions } from './alert.actions';
import { history } from '../_helpers';
import Swal from "sweetalert2";
import { combineReducers } from 'redux';
import { toast } from 'react-toastify';

export const azureDevopsActions = {
    getRepoList,
    getRepoFileList,
    addAzureRepo,
    deleteAzureRepo,
    getPipelineList,
    getPipelineRunList,
    updatePipelineStatusModal,
    getPipelineStatus,
    startPipeline,
    updateAddRepoModal,
    getOrganizationList,
    getProjectList
};


function getRepoList(params){
    return dispatch => {
        dispatch(request(params.clientid));
        azureDevopsService.getRepoList(params)       
            .then(
                azureRepoList => { 
                    dispatch(success(azureRepoList));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: azureDevopsConstants.AZURE_DEVOPS_REPO_LIST_REQUEST, clientid } }
    function success(azureRepoList) { return { type: azureDevopsConstants.AZURE_DEVOPS_REPO_LIST_SUCCESS, azureRepoList } }
    function failure(error) { return { type: azureDevopsConstants.AZURE_DEVOPS_REPO_LIST_FAILURE, error } }
}

function getRepoFileList(params){
    return dispatch => {
        dispatch(request(params.repo_id));
        azureDevopsService.getRepoFileList(params)       
            .then(
                azureRepoFileList => { 
                    dispatch(success({...azureRepoFileList, repo_id: params.repo_id}));
                },
                error => {
                    dispatch(failure({error: error.toString(), repo_id: params.repo_id}));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: azureDevopsConstants.AZURE_DEVOPS_REPO_FILE_LIST_REQUEST, clientid } }
    function success(azureRepoFileList) { return { type: azureDevopsConstants.AZURE_DEVOPS_REPO_FILE_LIST_SUCCESS, azureRepoFileList } }
    function failure(error) { return { type: azureDevopsConstants.AZURE_DEVOPS_REPO_FILE_LIST_FAILURE, error } }
}

function addAzureRepo(params){
    return dispatch => {
        dispatch(request(params.clientid));
        azureDevopsService.addAzureRepo(params)       
            .then(
                pgiData => { 
                    dispatch(success(pgiData), toast.success('Repository Created Successfully!'));
                    dispatch(this.getRepoList({clientid: null}));
                    dispatch(this.updateAddRepoModal(false));
                },
                error => {
                    dispatch(failure(error.toString(), toast.error(error)));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: azureDevopsConstants.AZURE_DEVOPS_ADD_REPO_REQUEST, clientid } }
    function success(pgiData) { return { type: azureDevopsConstants.AZURE_DEVOPS_ADD_REPO_SUCCESS, pgiData } }
    function failure(error) { return { type: azureDevopsConstants.AZURE_DEVOPS_ADD_REPO_FAILURE, error } }
}

function deleteAzureRepo(params){
    return dispatch => {
        dispatch(request(params.clientid));
        azureDevopsService.deleteAzureRepo(params)       
            .then(
                pgiData => { 
                    dispatch(success(pgiData), toast.success('Repository Deleted Successfully!'));
                    dispatch(this.getRepoList({clientid: null}));
                },
                error => {
                    dispatch(failure(error.toString(), toast.error(error)));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: azureDevopsConstants.AZURE_DEVOPS_DELETE_REPO_REQUEST, clientid } }
    function success(pgiData) { return { type: azureDevopsConstants.AZURE_DEVOPS_DELETE_REPO_SUCCESS, pgiData } }
    function failure(error) { return { type: azureDevopsConstants.AZURE_DEVOPS_DELETE_REPO_FAILURE, error } }
}

function getPipelineList(params){
    return dispatch => {
        dispatch(request(params.clientid));
        azureDevopsService.getPipelineList(params)       
            .then(
                azurePipelineList => { 
                    dispatch(success(azurePipelineList));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: azureDevopsConstants.AZURE_DEVOPS_PIPELINE_LIST_REQUEST, clientid } }
    function success(azurePipelineList) { return { type: azureDevopsConstants.AZURE_DEVOPS_PIPELINE_LIST_SUCCESS, azurePipelineList } }
    function failure(error) { return { type: azureDevopsConstants.AZURE_DEVOPS_PIPELINE_LIST_FAILURE, error } }
}

function getPipelineRunList(params){
    return dispatch => {
        dispatch(request(params.pipeline_id));
        azureDevopsService.getPipelineRunList(params)       
            .then(
                azurePipelineRunList => { 
                    dispatch(success({...azurePipelineRunList, pipeline_id: params.pipeline_id}));
                },
                error => {
                    dispatch(failure({error: error.toString(), pipeline_id: params.pipeline_id}));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: azureDevopsConstants.AZURE_DEVOPS_PIPELINE_RUN_LIST_REQUEST, clientid } }
    function success(azurePipelineRunList) { return { type: azureDevopsConstants.AZURE_DEVOPS_PIPELINE_RUN_LIST_SUCCESS, azurePipelineRunList } }
    function failure(error) { return { type: azureDevopsConstants.AZURE_DEVOPS_PIPELINE_RUN_LIST_FAILURE, error } }
}

function updatePipelineStatusModal(type) {
    return dispatch => {
        dispatch({ type: azureDevopsConstants.PIPELINE_STATUS_UPDATE_MODAL, value: type });
    }
}

function getPipelineStatus(params){
    return dispatch => {
        dispatch(request(params.clientid));
        azureDevopsService.getPipelineStatus(params)       
            .then(
                azurePipelineStatus => { 
                    dispatch(success(azurePipelineStatus));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: azureDevopsConstants.AZURE_DEVOPS_PIPELINE_STATUS_REQUEST, clientid } }
    function success(azurePipelineStatus) { return { type: azureDevopsConstants.AZURE_DEVOPS_PIPELINE_STATUS_SUCCESS, azurePipelineStatus } }
    function failure(error) { return { type: azureDevopsConstants.AZURE_DEVOPS_PIPELINE_STATUS_FAILURE, error } }
}

function startPipeline(params){
    return dispatch => {
        dispatch(request(params.clientid));
        azureDevopsService.startPipeline(params)       
            .then(
                startAzurePipeline => { 
                    dispatch(success(startAzurePipeline), toast.success('Pipeline Started Successfully!'));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: azureDevopsConstants.AZURE_DEVOPS_START_PIPELINE_REQUEST, clientid } }
    function success(startAzurePipeline) { return { type: azureDevopsConstants.AZURE_DEVOPS_START_PIPELINE_SUCCESS, startAzurePipeline } }
    function failure(error) { return { type: azureDevopsConstants.AZURE_DEVOPS_START_PIPELINE_FAILURE, error } }
}

function getOrganizationList(params){
    return dispatch => {
        dispatch(request(params.clientid));
        azureDevopsService.getOrganizationList(params)       
            .then(
                azureOrganizationList => { 
                    dispatch(success(azureOrganizationList));
                    dispatch(this.getProjectList({
                        organization_id: azureOrganizationList.data.length ? azureOrganizationList.data[0]['organization_id']: null
                    }));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: azureDevopsConstants.AZURE_DEVOPS_ORGANIZATION_LIST_REQUEST, clientid } }
    function success(azureOrganizationList) { return { type: azureDevopsConstants.AZURE_DEVOPS_ORGANIZATION_LIST_SUCCESS, azureOrganizationList } }
    function failure(error) { return { type: azureDevopsConstants.AZURE_DEVOPS_ORGANIZATION_LIST_FAILURE, error } }
}

function getProjectList(params){
    return dispatch => {
        dispatch(request(params));
        azureDevopsService.getProjectList(params)       
            .then(
                azureProjectList => { 
                    dispatch(success(azureProjectList));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: azureDevopsConstants.AZURE_DEVOPS_PROJECT_LIST_REQUEST, clientid } }
    function success(azureProjectList) { return { type: azureDevopsConstants.AZURE_DEVOPS_PROJECT_LIST_SUCCESS, azureProjectList } }
    function failure(error) { return { type: azureDevopsConstants.AZURE_DEVOPS_PROJECT_LIST_FAILURE, error } }
}

function updateAddRepoModal(type) {
    return dispatch => {
        dispatch({ type: azureDevopsConstants.AZURE_ADD_REPO_UPDATE_MODAL, value: type });
    }
}
