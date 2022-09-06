import config from 'config';
import { authHeader,logout,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../_helpers';
import Swal from "sweetalert2";

export const azureDevopsService = {
    getRepoList,
    getRepoFileList,
    addAzureRepo,
    deleteAzureRepo,
    getPipelineList,
    getPipelineRunList,
    getPipelineStatus,
    startPipeline,
    getOrganizationList,
    getProjectList
};

function getRepoList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/ms-devops/repo`, requestOptions).then(handleResponse);
}

function getRepoFileList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/ms-devops/repo/${params.repo_id}/files`, requestOptions).then(handleResponse);
}

function addAzureRepo(params) {
    const requestOptions = {
        method: 'POST',
        headers: {...authHeader(), 'Content-Type': 'application/json'},
        body: JSON.stringify(params)
    };
    return fetch(`${config.apiUrl}/ms-devops/repo`, requestOptions).then(handleResponse);
}

function deleteAzureRepo(params) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader(),
        body: JSON.stringify(params)
    };
    return fetch(`${config.apiUrl}/ms-devops/repo/${params.repo_id}`, requestOptions).then(handleResponse);
}

function getPipelineList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/ms-devops/pipeline`, requestOptions).then(handleResponse);
}

function getPipelineRunList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/ms-devops/pipeline/${params.pipeline_id}/run`, requestOptions).then(handleResponse);
}

function getPipelineStatus(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/ms-devops/pipeline/${params.pipeline_id}/run/${params.run_id}`, requestOptions).then(handleResponse);
}

function startPipeline(params) {
    const requestOptions = {
        method: 'POST',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/ms-devops/pipeline/${params.pipeline_id}/start`, requestOptions).then(handleResponse);
}

function getOrganizationList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/ms-devops/organization`, requestOptions).then(handleResponse);
}

function getProjectList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/ms-devops/organization/${params.organization_id}/project`, requestOptions).then(handleResponse);
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