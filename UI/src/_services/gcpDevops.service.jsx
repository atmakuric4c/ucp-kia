import config from 'config';
import { authHeader,logout,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../_helpers';
import Swal from "sweetalert2";

export const gcpDevopsService = {
    getProjectList,
    getRepoList,
    getPipelineList
};

function getProjectList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/gcp-devops/project`, requestOptions).then(handleResponse);
}

function getRepoList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/gcp-devops/project/${params.project_id}/trigger`, requestOptions).then(handleResponse);
}

function getPipelineList(params) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    return fetch(`${config.apiUrl}/gcp-devops/project/${params.project_id}/build`, requestOptions).then(handleResponse);
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