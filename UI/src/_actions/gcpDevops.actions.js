import { gcpDevopsConstants } from '../_constants';
import { gcpDevopsService } from '../_services';
import { alertActions } from './alert.actions';
import { history } from '../_helpers';
import Swal from "sweetalert2";
import { combineReducers } from 'redux';

export const gcpDevopsActions = {
    getProjectList,
    getRepoList,
    getPipelineList
};

function getProjectList(params){
    return dispatch => {
        dispatch(request(params.project_id));
        gcpDevopsService.getProjectList(params)       
            .then(
                gcpProjectList => { 
                    dispatch(success(gcpProjectList));
                    if(params.url.includes('repository'))
                    dispatch(getRepoList({ project_id: gcpProjectList.data[0].projectId }));
                    else if(params.url.includes('pipeline'))
                    dispatch(getPipelineList({ project_id: gcpProjectList.data[0].projectId }));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: gcpDevopsConstants.GCP_DEVOPS_PROJECT_LIST_REQUEST, clientid } }
    function success(gcpProjectList) { return { type: gcpDevopsConstants.GCP_DEVOPS_PROJECT_LIST_SUCCESS, gcpProjectList } }
    function failure(error) { return { type: gcpDevopsConstants.GCP_DEVOPS_PROJECT_LIST_FAILURE, error } }
}


function getRepoList(params){
    return dispatch => {
        dispatch(request(params.project_id));
        gcpDevopsService.getRepoList(params)       
            .then(
                gcpRepoList => {
                    dispatch(success({ ...gcpRepoList, project_id: params.project_id }));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: gcpDevopsConstants.GCP_DEVOPS_REPO_LIST_REQUEST, clientid } }
    function success(gcpRepoList) { return { type: gcpDevopsConstants.GCP_DEVOPS_REPO_LIST_SUCCESS, gcpRepoList } }
    function failure(error) { return { type: gcpDevopsConstants.GCP_DEVOPS_REPO_LIST_FAILURE, error } }
}


function getPipelineList(params){
    return dispatch => {
        dispatch(request(params.project_id));
        gcpDevopsService.getPipelineList(params)       
            .then(
                gcpPipelineList => {
                    dispatch(success({ ...gcpPipelineList, project_id: params.project_id }));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: gcpDevopsConstants.GCP_DEVOPS_PIPELINE_LIST_REQUEST, clientid } }
    function success(gcpPipelineList) { return { type: gcpDevopsConstants.GCP_DEVOPS_PIPELINE_LIST_SUCCESS, gcpPipelineList } }
    function failure(error) { return { type: gcpDevopsConstants.GCP_DEVOPS_PIPELINE_LIST_FAILURE, error } }
}
