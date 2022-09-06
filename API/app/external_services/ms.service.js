const axios = require('axios');

async function getMSProjectList(singlOrg, authtoken){
    let options = {
        'method': 'GET',
        'url': `https://dev.azure.com/${singlOrg['name']}/_apis/projects?api-version=6.0`,
        'headers': {
            'Content-Type' : 'application/json',
            'Authorization' : `Bearer ${authtoken}`
        }
      };

      return axios(options);
}

async function getMSRepoList(singlOrg, authtoken){
    let options = {
        'method': 'GET',
        'url': `https://dev.azure.com/${singlOrg['organization_name']}/${singlOrg['name']}/_apis/git/repositories?api-version=6.0`,
        'headers': {
            'Content-Type' : 'application/json',
            'Authorization' : `Bearer ${authtoken}`
        }
      };

      return axios(options);
}

async function getMSRepoDetails(singlOrg, authtoken){
    let options = {
        'method': 'GET',
        'url': `https://dev.azure.com/${singlOrg['organization_name']}/${singlOrg['project_name']}/_apis/git/repositories/${singlOrg['ms_repo_id']}?api-version=6.0`,
        'headers': {
            'Content-Type' : 'application/json',
            'Authorization' : `Bearer ${authtoken}`
        }
      };

      return axios(options);
}

async function getMSRepoFiles(singlOrg, authtoken){
    let options = {
        'method': 'GET',
        'url': `https://dev.azure.com/${singlOrg['organization_name']}/${singlOrg['project_name']}/_apis/git/repositories/${singlOrg['ms_repo_id']}/items?scopePath/&recursionLevel=OneLevel&api-version=6.0`,
        'headers': {
            'Content-Type' : 'application/json',
            'Authorization' : `Bearer ${authtoken}`
        }
      };

      return axios(options);
}

async function addMSRepo(singlOrg, authtoken){
    let options = {
        'method': 'POST',
        'url': `https://dev.azure.com/${singlOrg['organization_name']}/${singlOrg['project_name']}/_apis/git/repositories?api-version=6.0`,
        'data':  { 'name': singlOrg['name'] },
        'headers': {
            'Content-Type' : 'application/json',
            'Authorization' : `Bearer ${authtoken}`
        }
      };

      return axios(options);
}

async function deleteMSRepo(singlOrg, authtoken){
    let options = {
        'method': 'DELETE',
        'url': `https://dev.azure.com/${singlOrg['organization_name']}/${singlOrg['project_name']}/_apis/git/repositories/${singlOrg['ms_repo_id']}?api-version=6.0`,
        'headers': {
            'Content-Type' : 'application/json',
            'Authorization' : `Bearer ${authtoken}`
        }
      };

      return axios(options);
}

async function getMSPipelineList(singlOrg, authtoken){
    let options = {
        'method': 'GET',
        'url': `https://dev.azure.com/${singlOrg['organization_name']}/${singlOrg['name']}/_apis/pipelines?api-version=6.0-preview.1`,
        'headers': {
            'Content-Type' : 'application/json',
            'Authorization' : `Bearer ${authtoken}`
        }
      };

      return axios(options);
}

async function getMSPipelineDetails(singlOrg, authtoken){
    let options = {
        'method': 'GET',
        'url': `https://dev.azure.com/${singlOrg['organization_name']}/${singlOrg['project_name']}/_apis/pipelines/${singlOrg['ms_pipeline_id']}?api-version=6.0-preview.1`,
        'headers': {
            'Content-Type' : 'application/json',
            'Authorization' : `Bearer ${authtoken}`
        }
      };

      return axios(options);
}

async function getMSPipelineRuns(singlOrg, authtoken){
    let options = {
        'method': 'GET',
        'url': `https://dev.azure.com/${singlOrg['organization_name']}/${singlOrg['project_name']}/_apis/pipelines/${singlOrg['ms_pipeline_id']}/runs?api-version=6.0-preview.1`,
        'headers': {
            'Content-Type' : 'application/json',
            'Authorization' : `Bearer ${authtoken}`
        }
      };

      return axios(options);
}

async function getMSPipelineRunDetails(singlOrg, authtoken, run_id){
    let options = {
        'method': 'GET',
        'url': `https://dev.azure.com/${singlOrg['organization_name']}/${singlOrg['project_name']}/_apis/pipelines/${singlOrg['ms_pipeline_id']}/runs/${run_id}?api-version=6.0-preview.1`,
        'headers': {
            'Content-Type' : 'application/json',
            'Authorization' : `Bearer ${authtoken}`
        }
      };

      return axios(options);
}

async function startMSPipeline(singlOrg, authtoken, run_id){
    let options = {
        'method': 'POST',
        'url': `https://dev.azure.com/${singlOrg['organization_name']}/${singlOrg['project_name']}/_apis/pipelines/${singlOrg['ms_pipeline_id']}/runs?api-version=6.0-preview.1`,
        'data': {
            "resources":{
            }
        },
        'headers': {
            'Content-Type' : 'application/json',
            'Authorization' : `Bearer ${authtoken}`
        }
      };

      return axios(options);
}

module.exports = {
    getMSProjectList: getMSProjectList,
    getMSRepoList: getMSRepoList,
    getMSRepoDetails: getMSRepoDetails,
    getMSRepoFiles: getMSRepoFiles,
    addMSRepo: addMSRepo,
    deleteMSRepo: deleteMSRepo,
    getMSPipelineList: getMSPipelineList,
    getMSPipelineDetails: getMSPipelineDetails,
    getMSPipelineRuns: getMSPipelineRuns,
    getMSPipelineRunDetails: getMSPipelineRunDetails,
    startMSPipeline: startMSPipeline
}