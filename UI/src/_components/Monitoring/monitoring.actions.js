import { monitoringdashboardConstants, monitroingalertsConstants, monitoringmetricsConstants } from "./monitoring.constants";
import { monitoringService } from "./monitoring.service";
import { alertActions } from "../../_actions";
import { history } from "../../_helpers";
import { toast } from 'react-toastify';

export const monitoringActions = {
  getAllMonitoringServers,saveMonitoringServer,getAllAlerts,getHostUsageMetrics,
  getHostItemsFromZabbix,getAllMonitoringVms,vmItemsSave,getAllMetrics,
  addGroupRequest,editGroupRequest,getHostItemsGraphs,getHostUptimeReport,
  addHostUptimeReport,getHostUtilizationReport,addHostUtilizationReport,
  usageMetricFromApi
};
function getAllMonitoringServers() {
  return dispatch => {
      dispatch(request());
      monitoringService.getAllMonitoringServers()
          .then(
              monitoringServers => dispatch(success(monitoringServers)),
              error => dispatch(failure(error.toString()))
          );
  };

  function request() { return { type: monitoringdashboardConstants.GET_MONITORING_SERVERS_REQUEST } }
  function success(monitoringServers) { return { type: monitoringdashboardConstants.GET_MONITORING_SERVERS_SUCCESS, monitoringServers } }
  function failure(error) { return { type: monitoringdashboardConstants.GET_MONITORING_SERVERS_FAILURE, error } }
}

function saveMonitoringServer(formData){
let monitoringServerType = "Edit";
if(typeof formData.server_id == "undefined" || formData.server_id == 0){
  monitoringServerType = "Add";
}
  return dispatch => {
      dispatch(request(formData));
      monitoringService.saveMonitoringServer(formData).then(
        resdata => {
          dispatch(success(resdata));
          if(resdata.success == false){       
            toast.error(resdata.message);
            dispatch(getAllMonitoringServers());
          } else {          
            toast.success(resdata.message);
            dispatch(getAllMonitoringServers());
          }
        },
        error => {
          failure(error.toString()),
          toast.error(error.toString());
          dispatch(getAllMonitoringServers());
        }
      );
  }
  function request(formData) {
    return { type: monitoringdashboardConstants.SAVE_MONITORING_SERVER_REQUEST, formData };
  }
  function success(resdata) {
    return { type: monitoringdashboardConstants.SAVE_MONITORING_SERVER_SUCCESS, resdata };
  }
  function failure(error) {
    return { type: monitoringdashboardConstants.SAVE_MONITORING_SERVER_FAILURE, error };
  }
}
function getAllAlerts() {
  return dispatch => {
    dispatch(request());
    monitoringService
      .getAllAlerts()
      .then(
        monitoring => dispatch(success(monitoring)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: monitroingalertsConstants.GETALL_REQUEST };
  }
  function success(monitoring) {
    return { type: monitroingalertsConstants.GETALL_SUCCESS, monitoring };
  }
  function failure(error) {
    return { type: monitroingalertsConstants.GETALL_FAILURE, error };
  }
}
function getHostItemsGraphs(id, service_type) {
  return dispatch => {
    dispatch(request());
    monitoringService
      .getHostItemsGraphs(id, service_type)
      .then(
        hostitemsgraphs => dispatch(success(hostitemsgraphs)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: monitroingalertsConstants.GETALL_REQUEST };
  }
  function success(hostitemsgraphs) {
    return { type: monitroingalertsConstants.GETALL_SUCCESS, hostitemsgraphs };
  }
  function failure(error) {
    return { type: monitroingalertsConstants.GETALL_FAILURE, error };
  }
}
function getAllMonitoringVms(vmdata) {
  return dispatch => {
    dispatch(request());
    monitoringService
      .getAllMonitoringVms(vmdata)
      .then(
        monitoringdashboard => dispatch(success(monitoringdashboard)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: monitoringdashboardConstants.GETALL_REQUEST };
  }
  function success(monitoringdashboard) {
    return { type: monitoringdashboardConstants.GETALL_SUCCESS, monitoringdashboard };
  }
  function failure(error) {
    return { type: monitoringdashboardConstants.GETALL_FAILURE, error };
  }
}

function getHostItemsFromZabbix(id) {
  return dispatch => {
    dispatch(request());
    monitoringService
      .getHostItemsFromZabbix(id)
      .then(
        monitoringVMItems => {
          dispatch(success(monitoringVMItems))
        },
        error => dispatch(
          failure(error.toString()),
          toast.error(error.toString())
        )
      );
  };

  function request() {
    return { type: monitoringdashboardConstants.GETHOST_ITEMS_FROM_ZABBIX_REQUEST };
  }
  function success(monitoringVMItems) {
    return { type: monitoringdashboardConstants.GETHOST_ITEMS_FROM_ZABBIX_SUCCESS, monitoringVMItems };
  }
  function failure(error) {
    return { type: monitoringdashboardConstants.GETHOST_ITEMS_FROM_ZABBIX_FAILURE, error };
  }
}

function getHostUsageMetrics(id) {
  return dispatch => {
    dispatch(request());
    monitoringService
      .getHostUsageMetrics(id)
      .then(
        monitoringUsageMetrics => {
          dispatch(success(monitoringUsageMetrics))
        },
        error => dispatch(
          failure(error.toString()),
          toast.error(error.toString())
        )
      );
  };

  function request() {
    return { type: monitoringdashboardConstants.GETHOST_USAGE_METRICS_REQUEST };
  }
  function success(monitoringUsageMetrics) {
    return { type: monitoringdashboardConstants.GETHOST_USAGE_METRICS_SUCCESS, monitoringUsageMetrics };
  }
  function failure(error) {
    return { type: monitoringdashboardConstants.GETHOST_USAGE_METRICS_FAILURE, error };
  }
}
function usageMetricFromApi(postdata) {
  return dispatch => {
    dispatch(request());
    monitoringService
      .usageMetricFromApi(postdata)
      .then(
        monitoringUsageMetrics => {
          dispatch(success(monitoringUsageMetrics))
        },
        error => dispatch(
          failure(error.toString()),
          toast.error(error.toString())
        )
      );
  };

  function request() {
    return { type: monitoringdashboardConstants.GETHOST_USAGE_METRICS_REQUEST };
  }
  function success(monitoringUsageMetrics) {
    return { type: monitoringdashboardConstants.GETHOST_USAGE_METRICS_SUCCESS, monitoringUsageMetrics };
  }
  function failure(error) {
    return { type: monitoringdashboardConstants.GETHOST_USAGE_METRICS_FAILURE, error };
  }
}
function getHostUptimeReport(id) {
  return dispatch => {
    dispatch(request());
    monitoringService
      .getHostUptimeReport(id)
      .then(
        monitoringUptimeReport => {
          dispatch(success(monitoringUptimeReport))
        },
        error => dispatch(
          failure(error.toString()),
          toast.error(error.toString())
        )
      );
  };

  function request() {
    return { type: monitoringdashboardConstants.GETHOST_UPTIME_REPORT_REQUEST };
  }
  function success(monitoringUptimeReport) {
    return { type: monitoringdashboardConstants.GETHOST_UPTIME_REPORT_SUCCESS, monitoringUptimeReport };
  }
  function failure(error) {
    return { type: monitoringdashboardConstants.GETHOST_UPTIME_REPORT_FAILURE, error };
  }
}

function addHostUptimeReport(reportData) {
  return dispatch => {
    dispatch(request(reportData));
    monitoringService.addHostUptimeReport(reportData).then(
      resdata => {
        dispatch(success(resdata));
        //console.log(JSON.stringify(resdata))
        // history.push("/monitoringdashboard");
        if(resdata.success == false){          
          toast.error(resdata.message);
        } else {          
          toast.success("Uptime Report Added successfully");
          dispatch(getHostUptimeReport(reportData.vm_id));
        }
      },
      error => {
        failure(error.toString()),
        toast.error(error.toString())
      }
    );
  }
  function request(reportData) {
  return { type: monitoringdashboardConstants.ADDHOST_UPTIME_REPORT_REQUEST, reportData };
  }
  function success(resdata) {
  return { type: monitoringdashboardConstants.ADDHOST_UPTIME_REPORT_SUCCESS, resdata };
  }
  function failure(error) {
  return { type: monitoringdashboardConstants.ADDHOST_UPTIME_REPORT_FAILURE, error };
  }
}

function getHostUtilizationReport(id) {
  return dispatch => {
    dispatch(request());
    monitoringService
      .getHostUtilizationReport(id)
      .then(
        monitoringUtilizationReport => {
          dispatch(success(monitoringUtilizationReport))
        },
        error => dispatch(
          failure(error.toString()),
          toast.error(error.toString())
        )
      );
  };

  function request() {
    return { type: monitoringdashboardConstants.GETHOST_UTILIZATION_REPORT_REQUEST };
  }
  function success(monitoringUtilizationReport) {
    return { type: monitoringdashboardConstants.GETHOST_UTILIZATION_REPORT_SUCCESS, monitoringUtilizationReport };
  }
  function failure(error) {
    return { type: monitoringdashboardConstants.GETHOST_UTILIZATION_REPORT_FAILURE, error };
  }
}

function addHostUtilizationReport(reportData) {
  return dispatch => {
    dispatch(request(reportData));
    monitoringService.addHostUtilizationReport(reportData).then(
      resdata => {
        dispatch(success(resdata));
        console.log(JSON.stringify(resdata))
        // history.push("/monitoringdashboard");
        if(resdata.success == false){          
          toast.error(resdata.message);
        } else {          
          toast.success("Utilization Report Added successfully");
          dispatch(getHostUtilizationReport(reportData.vm_id));
        }

      },
      error => {
        failure(error.toString()),
        toast.error(error.toString());
      }
    );
  }
  function request(reportData) {
  return { type: monitoringdashboardConstants.ADDHOST_UTILIZATION_REPORT_REQUEST, reportData };
  }
  function success(resdata) {
  return { type: monitoringdashboardConstants.ADDHOST_UTILIZATION_REPORT_SUCCESS, resdata };
  }
  function failure(error) {
  return { type: monitoringdashboardConstants.ADDHOST_UTILIZATION_REPORT_FAILURE, error };
  }
}

function vmItemsSave(vmItemData) {
  return dispatch => {
    dispatch(request(vmItemData));
    monitoringService.vmItemsSave(vmItemData).then(
      resdata => {
        dispatch(success(resdata));
        console.log(JSON.stringify(resdata))
        history.push("/monitoringdashboard");
        if(resdata.success == false){          
          toast.error(resdata.message);
        } else {          
          toast.success("VM Items updated successfully");
        }
      },
      error => {
        failure(error.toString()),
        toast.error(error.toString());
      }
    );
  }
  function request(vmItemData) {
  return { type: monitoringdashboardConstants.ADDHOST_ITEMS_REQUEST, vmItemData };
  }
  function success(resdata) {
  return { type: monitoringdashboardConstants.ADDHOST_ITEMS_SUCCESS, resdata };
  }
  function failure(error) {
  return { type: monitoringdashboardConstants.ADDHOST_ITEMS_FAILURE, error };
  }
}
function getAllMetrics() {
  return dispatch => {
    dispatch(request());
    monitoringService
      .getAllMetrics()
      .then(
        monitoring => dispatch(success(monitoring)),
        error => dispatch(failure(error.toString()))
      );
  };

  function request() {
    return { type: monitoringmetricsConstants.GETALL_REQUEST };
  }
  function success(monitoring) {
    return { type: monitoringmetricsConstants.GETALL_SUCCESS, monitoring };
  }
  function failure(error) {
    return { type: monitoringmetricsConstants.GETALL_FAILURE, error };
  }
}

function addGroupRequest(groupdata) {
  return dispatch => {
    dispatch(request(groupdata));
    monitoringService.addGroup(groupdata).then(
      resdata => {
        dispatch(success(resdata));
        console.log(JSON.stringify(resdata))
        history.push("/monitoringmetrics");
        if(resdata.success == false){          
          toast.error(resdata.message);
        } else {          
          toast.success("Group name added successfully");
        }
      },
      error => {
        toast.error(error.toString());
      }
    );
  }
  function request(groupdata) {
  return { type: monitoringmetricsConstants.ADDUSER_REQUEST, groupdata };
  }
  function success(resdata) {
  return { type: monitoringmetricsConstants.ADDUSER_SUCCESS, resdata };
  }
  function failure(error) {
  return { type: monitoringmetricsConstants.ADDUSER_FAILURE, error };
  }
}
function editGroupRequest(groupdata) {
  return dispatch => {
    dispatch(request(groupdata));
    monitoringService.editGroup(groupdata).then(
      resdata => {
        dispatch(success(resdata));
        history.push("/monitoringmetrics");
        toast.success("Group Updated successfully");
      },
      error => {
        dispatch(failure(error.toString()));
        dispatch(alertActions.error(error.toString()));
      }
    );
  };

  function request(groupdata) {
    return { type: monitoringmetricsConstants.EDITUSER_REQUEST, groupdata };
  }
  function success(resdata) {
    return { type: monitoringmetricsConstants.EDITUSER_SUCCESS, resdata };
  }
  function failure(error) {
    return { type: monitoringmetricsConstants.EDITUSER_FAILURE, error };
  }
}