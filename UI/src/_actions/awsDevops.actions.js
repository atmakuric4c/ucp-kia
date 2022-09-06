import { awsDevopsConstants } from '../_constants';
import { awsDevopsService } from '../_services';
import { alertActions } from './alert.actions';
import { history } from '../_helpers';
import Swal from "sweetalert2";
import { combineReducers } from 'redux';
import { toast } from 'react-toastify';

export const awsDevopsActions = {
    getCostForecast,
    getUsageForecast,
    getRepoList,
    getRepoFileList,
    getRepoFileContent,
    getRepoBranchList,
    addAWSRepo,
    deleteAWSRepo,
    getPipelineList,
    getPipelineExecutionHistoryList,
    getPipelineStatus,
    startPipeline,
    stopPipeline,
    updatePipelineStatusModal,
    updateAddRepoModal,
    getRegionList
};

function getCostForecast(params){
    return dispatch => {
        dispatch(request(params.clientid));
        awsDevopsService.getCostForecast(params)       
            .then(
                costForecast => { 
                    dispatch(success(costForecast));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: awsDevopsConstants.AWS_DEVOPS_COST_FORECAST_REQUEST, clientid } }
    function success(costForecast) { return { type: awsDevopsConstants.AWS_DEVOPS_COST_FORECAST_SUCCESS, costForecast } }
    function failure(error) { return { type: awsDevopsConstants.AWS_DEVOPS_COST_FORECAST_FAILURE, error } }
}

function getUsageForecast(params){
    return dispatch => {
        dispatch(request(params.clientid));
        awsDevopsService.getUsageForecast(params)       
            .then(
                usageForecast => { 
                    dispatch(success(usageForecast));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: awsDevopsConstants.AWS_DEVOPS_USAGE_FORECAST_REQUEST, clientid } }
    function success(usageForecast) { return { type: awsDevopsConstants.AWS_DEVOPS_USAGE_FORECAST_SUCCESS, usageForecast } }
    function failure(error) { return { type: awsDevopsConstants.AWS_DEVOPS_USAGE_FORECAST_FAILURE, error } }
}

function getRepoList(params){
    return dispatch => {
        dispatch(request(params.clientid));
        awsDevopsService.getRepoList(params)       
            .then(
                awsRepoList => { 
                    dispatch(success(awsRepoList));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: awsDevopsConstants.AWS_DEVOPS_REPO_LIST_REQUEST, clientid } }
    function success(awsRepoList) { return { type: awsDevopsConstants.AWS_DEVOPS_REPO_LIST_SUCCESS, awsRepoList } }
    function failure(error) { return { type: awsDevopsConstants.AWS_DEVOPS_REPO_LIST_FAILURE, error } }
}

function getRepoFileList(params){
    return dispatch => {
        dispatch(request(params.repo_id));
        awsDevopsService.getRepoFileList(params)       
            .then(
                awsRepoFileList => { 
                    dispatch(success({...awsRepoFileList, repo_id: params.repo_id}));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: awsDevopsConstants.AWS_DEVOPS_REPO_FILE_LIST_REQUEST, clientid } }
    function success(awsRepoFileList) { return { type: awsDevopsConstants.AWS_DEVOPS_REPO_FILE_LIST_SUCCESS, awsRepoFileList } }
    function failure(error) { return { type: awsDevopsConstants.AWS_DEVOPS_REPO_FILE_LIST_FAILURE, error } }
}

function getRepoFileContent(params){
    return dispatch => {
        dispatch(request(params.repo_id));
        awsDevopsService.getRepoFileContent(params)       
            .then(
                awsRepoFileContent => { 
                    dispatch(success({...awsRepoFileContent, repo_id: params.repo_id}));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: awsDevopsConstants.AWS_DEVOPS_REPO_FILE_CONTENT_REQUEST, clientid } }
    function success(awsRepoFileContent) { return { type: awsDevopsConstants.AWS_DEVOPS_REPO_FILE_CONTENT_SUCCESS, awsRepoFileContent } }
    function failure(error) { return { type: awsDevopsConstants.AWS_DEVOPS_REPO_FILE_CONTENT_FAILURE, error } }
}

function getRepoBranchList(params){
    return dispatch => {
        dispatch(request(params.repo_id));
        awsDevopsService.getRepoBranchList(params)       
            .then(
                awsRepoBranchList => { 
                    dispatch(success({...awsRepoBranchList, repo_id: params.repo_id}));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: awsDevopsConstants.AWS_DEVOPS_REPO_BRANCH_LIST_REQUEST, clientid } }
    function success(awsRepoBranchList) { return { type: awsDevopsConstants.AWS_DEVOPS_REPO_BRANCH_LIST_SUCCESS, awsRepoBranchList } }
    function failure(error) { return { type: awsDevopsConstants.AWS_DEVOPS_REPO_BRANCH_LIST_FAILURE, error } }
}

function addAWSRepo(reqData) {
    return dispatch => {
        dispatch(request(reqData));
        awsDevopsService.addAWSRepo(reqData)       
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
  
    function request(reqData) { return { type: awsDevopsConstants.AWS_ADD_REPO_REQUEST, reqData } }
    function success(pgiData) { return { type: awsDevopsConstants.AWS_ADD_REPO_SUCCESS, pgiData } }
    function failure(error) { return { type: awsDevopsConstants.AWS_ADD_REPO_FAILURE, error } }
}

function deleteAWSRepo(reqData) {
    return dispatch => {
        dispatch(request(reqData));
        awsDevopsService.deleteAWSRepo(reqData)       
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
  
    function request(reqData) { return { type: awsDevopsConstants.AWS_DELETE_REPO_REQUEST, reqData } }
    function success(pgiData) { return { type: awsDevopsConstants.AWS_DELETE_REPO_SUCCESS, pgiData } }
    function failure(error) { return { type: awsDevopsConstants.AWS_DELETE_REPO_FAILURE, error } }
}

function getPipelineList(params){
    return dispatch => {
        dispatch(request(params.clientid));
        awsDevopsService.getPipelineList(params)       
            .then(
                awsPipelineList => { 
                    dispatch(success(awsPipelineList));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: awsDevopsConstants.AWS_DEVOPS_PIPELINE_LIST_REQUEST, clientid } }
    function success(awsPipelineList) { return { type: awsDevopsConstants.AWS_DEVOPS_PIPELINE_LIST_SUCCESS, awsPipelineList } }
    function failure(error) { return { type: awsDevopsConstants.AWS_DEVOPS_PIPELINE_LIST_FAILURE, error } }
}

function getPipelineExecutionHistoryList(params){
    return dispatch => {
        dispatch(request(params.clientid));
        awsDevopsService.getPipelineExecutionHistoryList(params)       
            .then(
                awsPipelineExecutionHistoryList => { 
                    dispatch(success({...awsPipelineExecutionHistoryList, pipeline_id: params.pipeline_id}));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: awsDevopsConstants.AWS_DEVOPS_PIPELINE_EXECUTION_HISTORY_LIST_REQUEST, clientid } }
    function success(awsPipelineExecutionHistoryList) { return { type: awsDevopsConstants.AWS_DEVOPS_PIPELINE_EXECUTION_HISTORY_LIST_SUCCESS, awsPipelineExecutionHistoryList } }
    function failure(error) { return { type: awsDevopsConstants.AWS_DEVOPS_PIPELINE_EXECUTION_HISTORY_LIST_FAILURE, error } }
}

function updatePipelineStatusModal(type) {
    return dispatch => {
        dispatch({ type: awsDevopsConstants.PIPELINE_STATUS_UPDATE_MODAL, value: type });
    }
}

function getPipelineStatus(params){
    return dispatch => {
        dispatch(request(params.clientid));
        awsDevopsService.getPipelineStatus(params)       
            .then(
                awsPipelineStatus => { 
                    dispatch(success(awsPipelineStatus));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: awsDevopsConstants.AWS_DEVOPS_PIPELINE_STATUS_REQUEST, clientid } }
    function success(awsPipelineStatus) { return { type: awsDevopsConstants.AWS_DEVOPS_PIPELINE_STATUS_SUCCESS, awsPipelineStatus } }
    function failure(error) { return { type: awsDevopsConstants.AWS_DEVOPS_PIPELINE_STATUS_FAILURE, error } }
}

function startPipeline(params){
    return dispatch => {
        dispatch(request(params.clientid));
        awsDevopsService.startPipeline(params)       
            .then(
                awsStartPipeline => { 
                    dispatch(success(awsStartPipeline), toast.success('Pipeline Started Successfully!'));
                    //dispatch(success(awsStartPipeline));
                },
                error => {
                    dispatch(failure(error.toString(), toast.error(error)));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: awsDevopsConstants.AWS_DEVOPS_START_PIPELINE_REQUEST, clientid } }
    function success(awsStartPipeline) { return { type: awsDevopsConstants.AWS_DEVOPS_START_PIPELINE_SUCCESS, awsStartPipeline } }
    function failure(error) { return { type: awsDevopsConstants.AWS_DEVOPS_START_PIPELINE_FAILURE, error } }
}

function stopPipeline(params){
    return dispatch => {
        dispatch(request(params.clientid));
        awsDevopsService.stopPipeline(params)       
            .then(
                awsStopPipeline => { 
                    dispatch(success(awsStopPipeline), toast.success('Pipeline Execution Stopped Successfully!'));
                    dispatch(success(awsStopPipeline));
                    dispatch(this.getPipelineExecutionHistoryList({pipeline_id: params.pipeline_id}));
                },
                error => {
                    dispatch(failure(error.toString(), toast.error(error)));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: awsDevopsConstants.AWS_DEVOPS_STOP_PIPELINE_REQUEST, clientid } }
    function success(awsStopPipeline) { return { type: awsDevopsConstants.AWS_DEVOPS_STOP_PIPELINE_SUCCESS, awsStopPipeline } }
    function failure(error) { return { type: awsDevopsConstants.AWS_DEVOPS_STOP_PIPELINE_FAILURE, error } }
}

function updateAddRepoModal(type) {
    return dispatch => {
        dispatch({ type: awsDevopsConstants.ADD_REPO_UPDATE_MODAL, value: type });
    }
}

function getRegionList(params){
    return dispatch => {
        dispatch(request(params.clientid));
        awsDevopsService.getRegionList(params)       
            .then(
                awsRepoList => { 
                    dispatch(success(awsRepoList));
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(clientid) { return { type: awsDevopsConstants.AWS_DEVOPS_REGION_LIST_REQUEST, clientid } }
    function success(awsRegionList) { return { type: awsDevopsConstants.AWS_DEVOPS_REGION_LIST_SUCCESS, awsRegionList } }
    function failure(error) { return { type: awsDevopsConstants.AWS_DEVOPS_REGION_LIST_FAILURE, error } }
}