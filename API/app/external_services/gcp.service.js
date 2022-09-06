const axios = require('axios');

async function getGCPTriggerList(singleProject, authtoken){

    let queryParams = ``;

    if(singleProject['pageSize'] && singleProject['pageToken']) queryParams = `pageSize=${singleProject['pageSize']}&pageToken=${singleProject['pageToken']}`;
    if(singleProject['pageSize'] && !singleProject['pageToken']) queryParams = `pageSize=${singleProject['pageSize']}`;
    if(!singleProject['pageSize'] && singleProject['pageToken']) queryParams = `pageToken=${singleProject['pageToken']}`;

    singleProject['pageSize'] = singleProject['pageSize'] ? singleProject['pageSize'] : '';
    singleProject['pageToken'] = singleProject['pageToken'] ? singleProject['pageToken'] : '';

    let options = {
        'method': 'GET',
        'url': `https://cloudbuild.googleapis.com/v1/projects/${singleProject['project_id']}/triggers?${queryParams}`,
        'headers': {
            'Authorization' : `Bearer ${authtoken}`
        }
      };

      return axios(options);
}

async function getGCPTriggerDetails(singleProject, authtoken){

    let options = {
        'method': 'GET',
        'url': `https://cloudbuild.googleapis.com/v1/projects/${singleProject['project_id']}/triggers/${singleProject['trigger_id']}`,
        'headers': {
            'Content-Type' : 'application/json',
            'Authorization' : `Bearer ${authtoken}`
        }
      };

      return axios(options);
}


async function getGCPBuildList(singleProject, authtoken){

    let queryParams = ``;

    if(singleProject['pageSize'] && singleProject['pageToken']) queryParams = `pageSize=${singleProject['pageSize']}&pageToken=${singleProject['pageToken']}`;
    if(singleProject['pageSize'] && !singleProject['pageToken']) queryParams = `pageSize=${singleProject['pageSize']}`;
    if(!singleProject['pageSize'] && singleProject['pageToken']) queryParams = `pageToken=${singleProject['pageToken']}`;

    singleProject['pageSize'] = singleProject['pageSize'] ? singleProject['pageSize'] : '';
    singleProject['pageToken'] = singleProject['pageToken'] ? singleProject['pageToken'] : '';

    let options = {
        'method': 'GET',
        'url': `https://cloudbuild.googleapis.com/v1/projects/${singleProject['project_id']}/builds?${queryParams}`,
        'headers': {
            'Authorization' : `Bearer ${authtoken}`
        }
      };

    return axios(options);
}

async function getGCPBuildDetails(singleProject, authtoken){

    let options = {
        'method': 'GET',
        'url': `https://cloudbuild.googleapis.com/v1/projects/${singleProject['project_id']}/builds/${singleProject['build_id']}`,
        'headers': {
            'Content-Type' : 'application/json',
            'Authorization' : `Bearer ${authtoken}`
        }
      };

      return axios(options);
}


module.exports = {
    getGCPTriggerList: getGCPTriggerList,
    getGCPTriggerDetails: getGCPTriggerDetails,
    getGCPBuildList: getGCPBuildList,
    getGCPBuildDetails: getGCPBuildDetails
}
