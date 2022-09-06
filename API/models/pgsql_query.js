const connpool=require('../config/db_pgsql')
const helper=require('../helpers/common_helper')

let checkVcenterDB=(vdc,callback)=>{
    connpool.executeSql("SELECT 'Connected' as testvalue",vdc, function(err,result) {
        if (err) {
            return callback(400,err)
        }else{
            return callback(null,{db_conn:result.rows[0].testvalue})
        }
    })
}
let vcenterVmList=(vdc,callback)=>{
     connpool.executeSql("SELECT * from vpxv_vms where is_template=0",vdc, function(err,result) {
        if (err) {
            return callback(err)
        }else{
            result=helper.lowerToUpper(result.rows)
            return callback(null,{data:result})
        }
    })
}
let vcenterVmDetailById=(vcenterVmId,vdc,callback)=>{
    connpool.executeSql("SELECT * from vpxv_vms where vmid="+vcenterVmId,vdc, function(err,result) {
       if (err) {
           return callback(err)
       }else{
           result=helper.lowerToUpper(result.rows)
           return callback(null,{data:result[0]})
       }
   })
}
let vcenterVmDetailsList=(vdc,callback)=>{
    var sql="SELECT VPX_VM.ID, VPXV_VMS.VMUNIQUEID, VPX_VM.DNS_NAME, VPX_IP_ADDRESS.IP_ADDRESS, VPX_VM.POWER_STATE,"
    sql +=" VPX_VM.MEM_SIZE_MB, VPX_VM.NUM_VCPU, VPX_VM.NUM_DISK, VPX_HOST.IP_ADDRESS AS HOST,"
    //sql +=" (VPX_VIRTUAL_DISK.HARDWARE_DEVICE_CAPACITY_IN::bigint)/(1024*1024) AS CAPACITY, VPX_VIRTUAL_DISK.VDEVICE_ID," 
    sql +=" (REPLACE(REPLACE(vpx_vm_virtual_device.device_info_summary,'KB',''),',','')::bigint)/(1024*1024) AS CAPACITY," 
    sql +=" VPX_DATASTORE.NAME AS Datastore, VPXV_VMS.NAME,VPXV_VMS.VMMWARE_TOOL, VPX_VM.GUEST_OS, VPX_VM.GUEST_FAMILY,"
    //sql +=" VPX_VIRTUAL_DEVICE.DEVICE_INFO_LABEL AS DISK_LABEL FROM VPX_VM"
    sql +=" vpx_vm_virtual_device.DEVICE_INFO_LABEL AS DISK_LABEL FROM VPX_VM"
    sql +=" INNER JOIN VPX_HOST ON VPX_VM.HOST_ID = VPX_HOST.ID" 
        ////**sql +=" INNER JOIN VPX_VIRTUAL_DISK ON VPX_VM.ID = VPX_VIRTUAL_DISK.VM_ID" 
    sql +=" LEFT OUTER JOIN VPX_IP_ADDRESS ON VPX_VM.ID = VPX_IP_ADDRESS.ENTITY_ID" 
    sql +=" AND  VPX_IP_ADDRESS.IP_ADDRESS NOT LIKE '%f%' ESCAPE '!'" 
    sql +=" AND  VPX_IP_ADDRESS.IP_ADDRESS NOT LIKE '%:%' ESCAPE '!'" 
    sql +=" INNER JOIN VPX_DS_ASSIGNMENT ON VPX_VM.ID = VPX_DS_ASSIGNMENT.ENTITY_ID" 
    sql +=" INNER JOIN VPX_DATASTORE ON VPX_DS_ASSIGNMENT.DS_ID = VPX_DATASTORE.ID" 
    //sql +=" INNER JOIN VPX_VIRTUAL_DEVICE ON VPX_VIRTUAL_DISK.VDEVICE_ID = VPX_VIRTUAL_DEVICE.VDEVICE_ID" 
    sql +=" INNER JOIN vpx_vm_virtual_device ON vpx_vm_virtual_device.ID = VPX_VM.ID and vpx_vm_virtual_device.DEVICE_INFO_LABEL LIKE 'Hard disk%'" 
    //sql +=" INNER JOIN vpx_guest_disk ON vpx_guest_disk.vm_id = VPX_VM.ID" 
    sql +=" INNER JOIN VPXV_VMS ON VPX_VM.ID = VPXV_VMS.VMID"
    sql +=" WHERE VPX_VM.IS_TEMPLATE =  '0'"
    sql +=" AND  VPXV_VMS.NAME NOT LIKE '%_replica%' ESCAPE '!'" 
    sql +=" AND  VPXV_VMS.NAME NOT LIKE '%repl4cp4%' ESCAPE '!'" 
    sql +=" AND  VPXV_VMS.NAME NOT LIKE '%repl6cp4%' ESCAPE '!'" 
    sql +=" AND  VPXV_VMS.NAME NOT LIKE '%repl5cp4%' ESCAPE '!'" 
    sql +=" AND  VPXV_VMS.NAME NOT LIKE '%repl3cp4%' ESCAPE '!'" 
    sql +=" AND  VPXV_VMS.NAME NOT LIKE '%repl2cp4%' ESCAPE '!'" 
    sql +=" AND  VPXV_VMS.NAME NOT LIKE '%repl1cp3%' ESCAPE '!'"
    sql +=" ORDER BY vpx_vm_virtual_device.DEVICE_INFO_LABEL ASC";
    connpool.executeSql(sql,vdc, function(err,result) {
       if (err) {
           return callback(err)
       }else{
           result=helper.lowerToUpper(result.rows)
           return callback(null,{data:result})
       }
   })
}
let vcenterDatastoreList=(vdc,callback)=>{
    connpool.executeSql("SELECT id,name,capacity,free_space,type from vpx_datastore",vdc, function(err,result) {
       if (err) {
            return callback(err)
       }else{
           result=helper.lowerToUpper(result.rows)
           return callback(null,{data:result})
       }
   })
}
let vcenterDatastoreDetailByName=(ds_name,vdc,callback)=>{
    connpool.executeSql(`SELECT * from vpx_datastore where name='${ds_name}'`,vdc, function(err,result) {
        if (err) {
            return callback(err)
        }else{
            result=helper.lowerToUpper(result.rows)
            return callback(null,{data:result[0]})
        }
   })
}
let vcenterHostDetailByName=(host_ip,vdc,callback)=>{
    return new Promise(function(resolve, reject){
        var sql=`SELECT VPXV_HOSTS.*,VPXV_ENTITY.NAME as CLUSTER_NAME
        FROM VPXV_HOSTS INNER JOIN VPXV_ENTITY ON VPXV_ENTITY.ID = VPXV_HOSTS.FARMID 
        WHERE VPXV_ENTITY.ENTITY_TYPE = 'CLUSTER_COMPUTE_RESOURCE' AND VPXV_HOSTS.NAME ='${host_ip}'`;
        connpool.executeSql(sql,vdc, function(err,result) {
            if (err) {
                return callback(err)
            }else{
                var result=helper.lowerToUpper(result.rows);
                resolve(result[0]);
            }
        })
    }).then(async function(hostDataArr){
        if(hostDataArr){
            var entityId = `host-${hostDataArr['HOSTID']}`;
            var sqlQry = `SELECT VPXV_HIST_STAT_DAILY.STAT_VALUE FROM VPXV_HIST_STAT_DAILY
                WHERE VPXV_HIST_STAT_DAILY.STAT_GROUP = 'mem' AND VPXV_HIST_STAT_DAILY.STAT_NAME = 'consumed' AND
                VPXV_HIST_STAT_DAILY.ENTITY = '${entityId}' ORDER BY VPXV_HIST_STAT_DAILY.SAMPLE_TIME DESC limit 1`;
            await connpool.executeSql(sqlQry,vdc, function(err,result) {
                if (err) {
                    return callback(null,{data:hostDataArr})
                }else{
                    if(!result.rows[0])return callback(null,{data:hostDataArr});
                    result=helper.lowerToUpper(result.rows)
                    var hostRamHelthDetails=result[0];
                    var hostMemUsage = hostRamHelthDetails['STAT_VALUE']*1024;
                    //calculating free space											
                    hostDataArr['RAM_USED'] = hostMemUsage;
                    var ramUsagePercentage = (hostMemUsage/(hostDataArr['MEM_SIZE']))*100;
                    hostDataArr['RAM_USAGE_PERCENT'] = ramUsagePercentage;
                    return callback(null,{data:hostDataArr});
                }
            });
        } else {return callback(null,{data:hostDataArr})};
    });
}
let vcenterHostLinkedDatastoreList=(vdc,host_ip,callback)=>{
    var sql="SELECT d.id,d.name,d.capacity,d.free_space,d.type from vpx_datastore as d";
    sql +=" INNER JOIN vpxv_host_datastore as hd on hd.ds_id=d.id INNER JOIN vpxv_hosts as h on h.hostid=hd.host_id";
    sql +=" where h.name='"+host_ip+"'";
    connpool.executeSql(sql,vdc, function(err,result) {
       if (err) {
            return callback(err)
       }else{
           result=helper.lowerToUpper(result.rows)
           return callback(null,{data:result})
       }
   })
}
let vcenterHostList=(vdc,callback)=>{
    connpool.executeSql("SELECT id,dns_name,ip_address,vmotion_enabled,enabled from vpx_host",vdc, function(err,result) {
       if (err) {
           return callback(err)
       }else{
           result=helper.lowerToUpper(result.rows)
           return callback(null,{data:result})
       }
   })
}
let vcenterTemplateList=(vdc,callback)=>{
    var sql='SELECT VPXV_VMS.NAME,VPXV_VMS.VMID,VPX_VM_CONFIG_INFO.GUEST_FULL_NAME,VPXV_VMS.MEM_SIZE_MB,VPXV_VMS.NUM_VCPU,VPXV_VMS.NUM_DISK FROM VPXV_VMS INNER JOIN VPX_VM_CONFIG_INFO ON VPXV_VMS.VMID = VPX_VM_CONFIG_INFO.ID WHERE VPXV_VMS.IS_TEMPLATE = 1'
    connpool.executeSql(sql,vdc, function(err,result) {
       if (err) {
        return callback(err)
       }else{
           result=helper.lowerToUpper(result.rows)
           return callback(null,{data:result})
       }
   })
}
let vcenterSnapshotList=(vm_id,vdc,callback)=>{
    var sql='select VPXV_SNAPSHOT.SNAPSHOT_ID,VPXV_SNAPSHOT.SNAPSHOT_NAME,VPXV_SNAPSHOT.CREATE_TIME,VPXV_SNAPSHOT.SNAPSHOT_UID, VPXV_SNAPSHOT.PARENT_SNAPSHOT_ID,VPXV_SNAPSHOT.IS_CURRENT_SNAPSHOT from VPXV_SNAPSHOT where vm_id="'+vm_id+'"'
    connpool.executeSql(sql,vdc, function(err,result) {
       if (err) {
        return callback(err)
       }else{
           result=helper.lowerToUpper(result.rows)
           return callback(null,{data:result})
       }
   })
}
let vcenterVmTaskById=(vcenterVmId,vdc,callback)=>{
    var sql="SELECT VPX_TASK.TASK_ID, VPX_TASK.NAME, VPX_TASK.COMPLETE_STATE, VPX_TASK.START_TIME,"
    sql+=" VPX_TASK.COMPLETE_TIME, VPX_TASK.USERNAME FROM VPX_TASK"
    sql+=" INNER JOIN VPXV_ENTITY ON VPX_TASK.ENTITY_ID = VPXV_ENTITY.ID WHERE VPXV_ENTITY.ENTITY_TYPE ='VM'"
    sql+=" AND VPX_TASK.ENTITY_ID = '"+vcenterVmId+"' ORDER BY VPX_TASK.TASK_ID desc"
    connpool.executeSql(sql,vdc, function(err,result) {
       if (err) {
           return callback(err)
       }else{
           result=helper.lowerToUpper(result.rows)
           return callback(null,{data:result})
       }
   })
}
let vcenterVmEventById=(vcenterVmId,vdc,callback)=>{
    var sql="SELECT VPX_EVENT.EVENT_ID, VPX_EVENT.EVENT_TYPE, VPX_EVENT.CREATE_TIME, VPX_EVENT.USERNAME," 
    sql+=" VPX_EVENT.HOST_NAME, VPX_EVENT.DATASTORE_NAME, VPX_EVENT.NETWORK_NAME FROM VPX_EVENT"
    sql+=" WHERE VPX_EVENT.VM_ID ='"+vcenterVmId+"' ORDER BY VPX_EVENT.EVENT_ID desc"
    connpool.executeSql(sql,vdc, function(err,result) {
       if (err) {
           return callback(err)
       }else{
           result=helper.lowerToUpper(result.rows)
           return callback(null,{data:result})
       }
   })
}
let vcenterVmDetailsById=(vcenterVmId,vdc,callback)=>{
    var sql="SELECT VPX_VM.ID, VPXV_VMS.VMUNIQUEID, VPX_VM.DNS_NAME, VPX_IP_ADDRESS.IP_ADDRESS, VPX_VM.POWER_STATE,"
    sql +=" VPX_VM.MEM_SIZE_MB, VPX_VM.NUM_VCPU, VPX_VM.NUM_DISK, VPX_HOST.IP_ADDRESS AS HOST,"
    //sql +=" (VPX_VIRTUAL_DISK.HARDWARE_DEVICE_CAPACITY_IN::bigint)/(1024*1024) AS CAPACITY, VPX_VIRTUAL_DISK.VDEVICE_ID," 
    sql +=" (REPLACE(REPLACE(vpx_vm_virtual_device.device_info_summary,'KB',''),',','')::bigint)/(1024*1024) AS CAPACITY," 
    sql +=" VPX_DATASTORE.NAME AS Datastore, VPXV_VMS.NAME,VPXV_VMS.VMMWARE_TOOL, VPX_VM.GUEST_OS, VPX_VM.GUEST_FAMILY,"
    //sql +=" VPX_VIRTUAL_DEVICE.DEVICE_INFO_LABEL AS DISK_LABEL FROM VPX_VM"
    sql +=" vpx_vm_virtual_device.DEVICE_INFO_LABEL AS DISK_LABEL FROM VPX_VM"
    sql +=" INNER JOIN VPX_HOST ON VPX_VM.HOST_ID = VPX_HOST.ID" 
        ////**sql +=" INNER JOIN VPX_VIRTUAL_DISK ON VPX_VM.ID = VPX_VIRTUAL_DISK.VM_ID" 
    sql +=" LEFT OUTER JOIN VPX_IP_ADDRESS ON VPX_VM.ID = VPX_IP_ADDRESS.ENTITY_ID" 
    sql +=" INNER JOIN VPX_DS_ASSIGNMENT ON VPX_VM.ID = VPX_DS_ASSIGNMENT.ENTITY_ID" 
    sql +=" INNER JOIN VPX_DATASTORE ON VPX_DS_ASSIGNMENT.DS_ID = VPX_DATASTORE.ID" 
    //sql +=" INNER JOIN VPX_VIRTUAL_DEVICE ON VPX_VIRTUAL_DISK.VDEVICE_ID = VPX_VIRTUAL_DEVICE.VDEVICE_ID" 
    sql +=" INNER JOIN vpx_vm_virtual_device ON vpx_vm_virtual_device.ID = VPX_VM.ID and vpx_vm_virtual_device.DEVICE_INFO_LABEL LIKE 'Hard disk%'" 
    //sql +=" INNER JOIN vpx_guest_disk ON vpx_guest_disk.vm_id = VPX_VM.ID" 
    sql +=" INNER JOIN VPXV_VMS ON VPX_VM.ID = VPXV_VMS.VMID"
    sql +=" WHERE VPX_VM.ID = '"+vcenterVmId+"'"
    sql +=" ORDER BY vpx_vm_virtual_device.DEVICE_INFO_LABEL ASC";
    connpool.executeSql(sql,vdc, function(err,result) {
       if (err) {
           return callback(err)
       }else{
           result=helper.lowerToUpper(result.rows)
           return callback(null,{data:result})
       }
   })
}
let vcenterVmIpAndNetwork=(vcenterVmId,vdc,callback)=>{
    var sql="SELECT VPX_VM.ID, VPX_IP_ADDRESS.IP_ADDRESS,VPXV_VM_NETWORK.NETWORK_ID,VPX_NETWORK.NAME FROM VPX_VM"
    sql +=" INNER JOIN VPXV_VM_NETWORK ON VPXV_VM_NETWORK.VM_ID = VPX_VM.ID" 
    sql +=" INNER JOIN VPX_NETWORK ON VPX_NETWORK.ID = VPXV_VM_NETWORK.NETWORK_ID" 
    sql +=" INNER JOIN VPX_IP_ADDRESS ON VPX_VM.ID = VPX_IP_ADDRESS.ENTITY_ID" 
    sql +=" WHERE VPX_VM.ID = '"+vcenterVmId+"'"
    connpool.executeSql(sql,vdc, function(err,result) {
       if (err) {
           return callback(err)
       }else{
           result=helper.lowerToUpper(result.rows)
           return callback(null,{data:result})
       }
   })
}
let vcenterNetworks=(vdc,callback)=>{
    connpool.executeSql("SELECT * from vpx_network",vdc, function(err,result) {
       if (err) {
           return callback(err)
       }else{
           result=helper.lowerToUpper(result.rows)
           return callback(null,{data:result})
       }
   })
}
let checkVcenterNetworkName=(name,vdc,callback)=>{
    connpool.executeSql("SELECT * from vpx_network where NAME='"+name+'"',vdc, function(err,result) {
       if (err) {
           return callback(err)
       }else{
           result=helper.lowerToUpper(result.rows)
           return callback(null,{data:result})
       }
   })
}
let datastoreUnderHost=(host_ip,vdc,callback)=>{
    return new Promise(function(resolve, reject){
        var sql=`SELECT hostid FROM VPXV_HOSTS WHERE name ='${host_ip}'`;
        connpool.executeSql(sql,vdc, function(err,result) {
            if (err) {
                return callback(err)
            }else{
                var result=helper.lowerToUpper(result.rows);
                resolve(result[0]);
            }
        })
    }).then(async function(hostDataArr){
        if(hostDataArr){
            var sql=`SELECT VPX_DATASTORE.CAPACITY,VPX_DATASTORE.FREE_SPACE,
            VPX_DATASTORE.NAME,VPX_DATASTORE.TYPE,VPX_DATASTORE.ID,VPX_DATASTORE.MAINTENANCE_MODE
            FROM VPX_DATASTORE INNER JOIN VPXV_HOST_DATASTORE ON VPX_DATASTORE.ID = VPXV_HOST_DATASTORE.DS_ID 
            WHERE VPXV_HOST_DATASTORE.HOST_ID = ${hostDataArr['HOSTID']}`
            await connpool.executeSql(sql,vdc, function(err,result) {
                if (err) {
                    return callback(err)
                }else{
                    result=helper.lowerToUpper(result.rows)
                    return callback(null,{data:result})
                }
            })
        }else{
            return callback(null,{data:[]})
        }
    });
}
let hostUnderDatastore=(dsname,vdc,callback)=>{
    return new Promise(function(resolve, reject){
        var sql=`SELECT ID FROM VPX_DATASTORE WHERE NAME ='${dsname}'`;
        connpool.executeSql(sql,vdc, function(err,result) {
            if (err) {
                return callback(err)
            }else{
                var result=helper.lowerToUpper(result.rows);
                resolve(result[0]);
            }
        })
    }).then(async function(hostDataArr){
        if(hostDataArr){
            var sql=`SELECT VPXV_HOSTS.* FROM VPXV_HOST_DATASTORE INNER JOIN VPXV_HOSTS ON VPXV_HOST_DATASTORE.HOST_ID = VPXV_HOSTS.HOSTID 
        INNER JOIN VPXV_ENTITY ON VPXV_ENTITY.ENTITY_TYPE = 'CLUSTER_COMPUTE_RESOURCE' AND VPXV_HOSTS.FARMID = VPXV_ENTITY.ID 
        WHERE VPXV_HOST_DATASTORE.DS_ID = ${hostDataArr['ID']}`
            connpool.executeSql(sql,vdc, function(err,result) {
            if (err) {
                return callback(err)
            }else{
                result=helper.lowerToUpper(result.rows)
                return callback(null,{data:result})
            }
            });  
        }else{
            return callback(null,{data:[]})
        }
    });
}

module.exports={
    checkVcenterDB,vcenterVmList,vcenterDatastoreList,vcenterHostList,vcenterTemplateList,vcenterSnapshotList,
    vcenterVmDetailsList,vcenterVmDetailById,vcenterVmTaskById,vcenterVmEventById,vcenterVmDetailsById,
    vcenterNetworks,vcenterVmIpAndNetwork,checkVcenterNetworkName,vcenterHostLinkedDatastoreList,
    vcenterDatastoreDetailByName,vcenterHostDetailByName,datastoreUnderHost,hostUnderDatastore
}