import config from 'config';
import { authHeader,logout,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../_helpers';
import Swal from "sweetalert2";

export const awsDevopsService = {
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
    getRegionList
};


function getCostForecast(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureAPI/aws/costForecast`, requestOptions).then(handleResponse);
}

function getUsageForecast(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/secureAPI/aws/usageForecast`, requestOptions).then(handleResponse);
}

function getRepoList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/aws-devops/repo`, requestOptions).then(handleResponse);
}

function getRepoFileList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/aws-devops/repo/${params.repo_id}/files`, requestOptions).then(handleResponse);
}

function getRepoFileContent(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/aws-devops/repo/${params.repo_id}/files/${params.file_id}`, requestOptions).then(handleResponse);
}

function getRepoBranchList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/aws-devops/repo/${params.repo_id}/branch`, requestOptions).then(handleResponse);
}

function addAWSRepo(params) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    };

    return fetch(`${config.apiUrl}/aws-devops/repo/`, requestOptions).then(handleResponse);
}

function deleteAWSRepo(params) {
    const requestOptions = {
        method: 'DELETE',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    };

    return fetch(`${config.apiUrl}/aws-devops/repo/${params.repo_id}`, requestOptions).then(handleResponse);
}

function getPipelineList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/aws-devops/pipeline`, requestOptions).then(handleResponse);
}

function getPipelineExecutionHistoryList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/aws-devops/pipeline/${params.pipeline_id}/execution/history`, requestOptions).then(handleResponse);
}

function getPipelineStatus(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/aws-devops/pipeline/${params.pipeline_id}/status`, requestOptions).then(handleResponse);
}

function startPipeline(params) {
    const requestOptions = {
        method: 'POST',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/aws-devops/pipeline/${params.pipeline_id}/start`, requestOptions).then(handleResponse);
}

function stopPipeline(params) {
    const requestOptions = {
        method: 'POST',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/aws-devops/pipeline/${params.pipeline_id}/stop/${params.execution_id}`, requestOptions).then(handleResponse);
}

function getRegionList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/aws-devops/region`, requestOptions).then(handleResponse);
}

function handleResponse(response) {
    // console.log(response);
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
            if (response.status === 401) {
                // auto logout if 401 response returned from api
                logout();
                location.reload(true);
            }

            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }        
        return data;
    });
}
function handleEncResponse(response) {
//  console.log("response === "+JSON.stringify(response));
  return response.text().then(text => {
//	  console.log("bef text");
//	  console.log(text);
    const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
//    console.log("aft data");
//	  console.log(data);
    if (!response.ok) {
      if (response.status === 401) {
        // auto logout if 401 response returned from api
        logout();
        if(response.message=='')
        location.reload(true);
      }

      const error = (data && data.message) || response.statusText;
      return Promise.reject(error);
    }

    return data;
  });
}