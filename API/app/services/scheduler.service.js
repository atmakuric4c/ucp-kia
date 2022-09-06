const schedule = require('node-schedule-tz');
const axios = require('axios');
const config = require('../../config/constants');
const env = require('./../../config/env')

const updateAdUsers = () => {
  axios.get(config.API_URL + 'azure/azure-ad-users').then(res => {
    console.log('Azure Ad users sync up Job')
  }).catch(e => {
    console.log('Error: Azure Ad users sync up Job Error', e.message)
  });
}

const startJobs = () => {
  if (env.is_local) {
    return true;
  }
  try {
    //AD users sync scheduelr job 
    console.log('------------Scheduler service called------------')
    // var j = schedule.scheduleJob('*/20 * * * *', () => {
    //   console.log('AD users sync Job triggered on ' + new Date());
    //   updateAdUsers();
    // });
    
   }
   catch (e) {
   console.log(e.message)
   }
	
}

module.exports = {
 startJobs
}