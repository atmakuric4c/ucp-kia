const AWS = require('aws-sdk');
const dbHandler = require('../../config/api_db_handler');

function getCostForecastDetails(costexplorer, start_date, end_date, dimensions_input){

    let params = {
        "TimePeriod": {
          "Start": start_date,
          "End": end_date
        },
        "Granularity": "MONTHLY",
        "Filter": {
            "Dimensions": {
                "Key": "SERVICE",
                "Values": [
                    "Amazon ElastiCache", "EC2 - Other", "Amazon Elastic Compute Cloud - Compute", "Amazon Elasticsearch Service", "Amazon EC2"
                ]
            },
        },
        "Metric": "BLENDED_COST",
        "PredictionIntervalLevel": 85
    }
   
    return costexplorer.getCostForecast(params).promise();
}


function getUsageForecastDetails(costexplorer, start_date, end_date, dimensions_input){

    let params = {
        "TimePeriod": {
          "Start": start_date,
          "End": end_date
        },
        "Granularity": "MONTHLY",
        "Filter": {
            "Dimensions": {
                "Key": "USAGE_TYPE_GROUP",
                "Values": [
                    "EC2: Running Hours"
                ]
            }
        },
        "Metric": "USAGE_QUANTITY",
        "PredictionIntervalLevel": 85,
        
    }
   
    return costexplorer.getUsageForecast(params).promise();
}

function getAWSRepoList(codecommit, obj){

    let params = {"nextToken": null,
    "order": "descending",
    "sortBy": "repositoryName"};
   
    return codecommit.listRepositories(params).promise();
}

function getAWSRepoDetails(codecommit, obj){

    let params = {
        "repositoryName": obj.name
     };
   
    return codecommit.getRepository(params).promise();
}

function getAWSRepoFolder(codecommit, obj){

    let params = {
        "folderPath": "",
        "repositoryName": obj.name
     };
   
    return codecommit.getFolder(params).promise();
}

function getAWSRepoFileContent(codecommit, obj){

    let params = {
        "blobId": obj.file_id,
        "repositoryName": obj.name
     };
   
    return codecommit.getBlob(params).promise();
}

function getAWSRepoBranches(codecommit, obj){

    let params = {
        "repositoryName": obj.name
     };
   
    return codecommit.listBranches(params).promise();
}

function addAWSRepo(codecommit, obj){

    let params = {
        "repositoryName": obj['name'],
        "repositoryDescription": obj['description'] ? obj['description']: '' 
    };
   
    return codecommit.createRepository(params).promise();
}

function addAWSBranchAndFile(codecommit, obj){

    let params = {
        "branchName": 'master',
        "fileContent": 'Add your description for the project here...',
        "filePath": 'README.md',
        "repositoryName": obj['name'],
    };
   
    return codecommit.putFile(params).promise();
}

function deleteAWSRepo(codecommit, obj){

    let params = {
        "repositoryName": obj['name']
    };
   
    return codecommit.deleteRepository(params).promise();
}

function getAWSPipelineList(codepipeline, obj){

    let params = {};
   
    return codepipeline.listPipelines(params).promise();
}

function getAWSPipelineDetails(codepipeline, obj){

    let params = {
        "name": obj.name
     };
   
    return codepipeline.getPipeline(params).promise();
}

function getAWSPipelineStatus(codepipeline, obj){

    let params = {
        "name": obj.name
     };
   
    return codepipeline.getPipelineState(params).promise();
}

function getAWSPipelineExecutionHistory(codepipeline, obj){

    let params = {
        "maxResults": obj.limit ? obj.limit : 100,
        "nextToken": null,
        "pipelineName": obj.name
     }
   
    return codepipeline.listPipelineExecutions(params).promise();
}

function startAWSPipeline(codepipeline, obj){

    let params = {
        "name": obj.name
     };
   
    return codepipeline.startPipelineExecution(params).promise();
}

function stopAWSPipeline(codepipeline, obj){

    let params = {
        "pipelineName": obj.name,
        "pipelineExecutionId": obj.pipelineExecutionId
     };
   
    return codepipeline.stopPipelineExecution(params).promise();
}

function deleteAWSPipeline(codepipeline, obj){

    let params = {
        "name": obj.name,
     };
   
    return codepipeline.stopPipelineExecution(params).promise();
}

module.exports.getCostForecastDetails = getCostForecastDetails;
module.exports.getUsageForecastDetails = getUsageForecastDetails;
module.exports.getAWSRepoList = getAWSRepoList;
module.exports.getAWSRepoDetails = getAWSRepoDetails;
module.exports.getAWSRepoFolder = getAWSRepoFolder;
module.exports.getAWSRepoFileContent = getAWSRepoFileContent;
module.exports.getAWSRepoBranches = getAWSRepoBranches;
module.exports.addAWSRepo = addAWSRepo;
module.exports.addAWSBranchAndFile = addAWSBranchAndFile;
module.exports.deleteAWSRepo = deleteAWSRepo;
module.exports.getAWSPipelineList = getAWSPipelineList;
module.exports.getAWSPipelineDetails = getAWSPipelineDetails;
module.exports.getAWSPipelineStatus = getAWSPipelineStatus;
module.exports.getAWSPipelineExecutionHistory = getAWSPipelineExecutionHistory;
module.exports.startAWSPipeline = startAWSPipeline;
module.exports.stopAWSPipeline = stopAWSPipeline;
module.exports.deleteAWSPipeline = deleteAWSPipeline;