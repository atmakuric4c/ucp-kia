import config from 'config';
import { authHeader,logout } from '../../_helpers';
import axios from 'axios';
import { toast } from 'react-toastify';

export const vmlistService = {   
    getAll,
    addScheduler,
    vmOperations,
    vmResize,
    vmLogs,
    vmDetail,
    getDiskDetails,
    vmAddDisk,
    vmDeleteDisk,
    updateVmCreateDate,
    getVmGroupAll,
    addVmGroup,
    editVmGroup,
    editVmGroupMapping,
    getVmList
};

function getAll(vdc_id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/vmlist/getScheduleList/`+vdc_id, requestOptions).then(handleResponse);
}
function getVmList(vdc_id) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/vmlist/getVmNotScheduleList/`+vdc_id, requestOptions).then(handleResponse);
}

function getVmGroupAll() {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/vmlist/vmgrouplist`, requestOptions).then(handleResponse);
}
function addScheduler(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };
    return fetch(`${config.middleApiUrl}/secureApi/vmlist/addScheduler`, requestOptions).then(handleResponse);
}
function addVmGroup(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };
    return fetch(`${config.apiUrl}/secureApi/vmlist/addVmGroup`, requestOptions).then(handleResponse);
}
function editVmGroup(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };
    return fetch(`${config.apiUrl}/secureApi/vmlist/editVmGroup`, requestOptions).then(handleResponse);
}
function editVmGroupMapping(frmData) {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
    };
    return fetch(`${config.apiUrl}/secureApi/vmlist/editVmGroupMapping`, requestOptions).then(handleResponse);
}

function vmOperations(postParams) {    
    return axios.post(`${config.middleApiUrl}/vmware/vm_operations`,postParams)
    .then(response => {
        toast.success(response.data.message)
      }).catch(error => {
        toast.error(error);
      });  
}

function vmResize(formData){
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

function vmLogs(vmid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/vmlogs/${vmid}`, requestOptions).then(handleResponse);
}
function vmDetail(vmid) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/secureApi/vmDetail/${vmid}`, requestOptions).then(handleResponse);
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
function updateVmCreateDate(formData){    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    };
    return fetch(`${config.apiUrl}/secureApi/vmlist/updateVmCreateDate`, requestOptions).then(handleResponse);    
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