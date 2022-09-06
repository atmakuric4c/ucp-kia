import config from 'config';
import { authHeader,logout,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';
import axios from 'axios';
import { toast } from 'react-toastify';

export const vmlistService = {   
    getAll,
    addVm,
    vmOperations,
    veeamOperations,
    vmResize,
    vmLogs,
    vmDetail,
    getDiskDetails,
    vmAddDisk,
    vmDeleteDisk,
    getJobStatus
};

function getAll(vdc_id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };
    //return fetch(`${config.apiUrl}/secureApi/vmlist/listdata/`+ucpEncryptForUri(vdc_id), requestOptions).then(handleEncResponse);
    return fetch(`${config.apiUrl}/secureApi/vmlist/listdata/`+btoa(vdc_id), requestOptions).then(handleEncResponse);
}
function addVm(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };

    return fetch(`${config.middleApiUrl}/secureApi/vmlist/addVm`, requestOptions).then(handleResponse);
}
function vmOperations(frmData) { 
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };
    return fetch(`${config.apiUrl}/secureApi/vmlist/vm_operations`, requestOptions).then(handleEncResponse);
}
function veeamOperations(frmData) { 
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };
    return fetch(`${config.apiUrl}/secureApi/vmlist/veeam_operations`, requestOptions).then(handleEncResponse);
}
function vmResize(frmData) { 
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };
    return fetch(`${config.apiUrl}/secureApi/vmlist/vm_resize`, requestOptions).then(handleEncResponse);
}
function vmResize2(formData){
    var resizeResponses = "";
    var postParams = "";      
    if(formData.cpu_count != formData.old_cpu_size){
        postParams = {"vm_id":String(formData.vmid),"cpu_core":String(formData.cpu_count)}
        axios.post(`${config.middleApiUrl}/vmware/update_vm_cpu`,postParams)
        .then(response => {
            toast.success(response.data.message);
        }).catch(error => {
            toast.error(error);
        });

    } 
    if(formData.ram_gb != (formData.old_ram_size/1024)){
        postParams = {"vm_id":String(formData.vmid),"memory_gb":String(formData.ram_gb)}
        axios.post(`${config.middleApiUrl}/vmware/update_vm_memory`,postParams)
        .then(response => {
            toast.success(response.data.message);                            
        }).catch(error => {
            toast.error(error);
        });
    }

    if((formData.cpu_count == formData.old_cpu_size) && (formData.ram_gb == (formData.old_ram_size/1024))){
        
        resizeResponses = "No change in Current RAM / CPU";
        toast.info(resizeResponses);
    }
     
}

function vmLogs(formData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(formData))
    };

    return fetch(`${config.apiUrl}/secureApi/vmlist/vm_log`, requestOptions).then(handleEncResponse);
}

function vmDetail(formData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(formData))
    };

    return fetch(`${config.apiUrl}/secureApi/vmDetail`, requestOptions).then(handleEncResponse);
}

function getDiskDetails(vmid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/vmdiskinfo/${vmid}`, requestOptions).then(handleResponse);
}

function vmAddDisk(formData){    
    var postParams = "";   
        postParams = {"vm_id":String(formData.vm_id),"disk_size_gb":String(formData.disk_gb)}
        axios.post(`${config.middleApiUrl}/vmware/add_vm_disk`,postParams)
        .then(response => {
            toast.success(response.data.message);
        }).catch(error => {
            toast.error(error);
        });     
}

function vmDeleteDisk(delDiskInfo){    
    var postParams = "";   
        postParams = {"vm_id":String(delDiskInfo.vm_id),"vcenter_disk_id":String(delDiskInfo.diskid)}
        axios.post(`${config.middleApiUrl}/vmware/remove_vm_disk`,postParams)
        .then(response => {
            toast.success(response.data.message);
        }).catch(error => {
            toast.error(error);
        });     
}
function getJobStatus(formData){    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(formData))
    };
    return fetch(`${config.apiUrl}/secureApi/vmlist/job_status`, requestOptions).then(handleEncResponse);    
}
function handleResponse(response) {
    //console.log(response);
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