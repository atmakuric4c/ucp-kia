import { monitoringdashboardConstants, monitroingalertsConstants, hostitemsgraphsConstants, monitoringmetricsConstants } from "./monitoring.constants";

export function monitoringdashboard(state = {}, action) {
  switch (action.type) {
    case monitoringdashboardConstants.GETALL_REQUEST:
      return {
        loading: true
      };
    case monitoringdashboardConstants.GETALL_SUCCESS:
      return {
        items: action.monitoringdashboard
      };
    case monitoringdashboardConstants.GETALL_FAILURE:
      return {
        error: action.error
      };  
    default:
      return state;
  }
}
export function monitoringServers(state = {}, action) {
  switch (action.type) {
    case monitoringdashboardConstants.GET_MONITORING_SERVERS_REQUEST:
      return {
        ...state,
        isMonitoringServersLoading: true,
      };
    case monitoringdashboardConstants.GET_MONITORING_SERVERS_SUCCESS:
      return {
        ...state,
        isMonitoringServersLoading:false,
        items: action.monitoringServers
      };
    case monitoringdashboardConstants.GET_MONITORING_SERVERS_FAILURE:
      return { 
        ...state,
        error: action.error
      };
    case monitoringdashboardConstants.SAVE_MONITORING_SERVER_REQUEST:
      return {
        ...state,
      };
    case monitoringdashboardConstants.SAVE_MONITORING_SERVER_SUCCESS:
      return {
        ...state,
        saveMonitoringServer: action.saveMonitoringServer
      };
    case monitoringdashboardConstants.SAVE_MONITORING_SERVER_FAILURE:
      return { 
        error: action.error
      };   
    default:
      return state;
  }
}
export function monitoringUsageMetrics(state = {}, action) {
  switch (action.type) {
    case monitoringdashboardConstants.GETHOST_USAGE_METRICS_REQUEST:
      return {
        ...state,
        isUsageMetricsLoading: true,
        monitoringUsageMetrics: []
      };
    case monitoringdashboardConstants.GETHOST_USAGE_METRICS_SUCCESS:
      return {
        isUsageMetricsLoading: false,
        monitoringUsageMetrics: action.monitoringUsageMetrics
      };
    case monitoringdashboardConstants.GETHOST_USAGE_METRICS_FAILURE:
      return {
        error: action.error
      };
    default:
      return state;
  }
}
export function monitoringUptimeReport(state = {}, action) {
  switch (action.type) {
    case monitoringdashboardConstants.GETHOST_UPTIME_REPORT_REQUEST:
      return {
        ...state,
        isUptimeReportLoading: true,
        monitoringUptimeReport: []
      };
    case monitoringdashboardConstants.GETHOST_UPTIME_REPORT_SUCCESS:
      return {
        isUptimeReportLoading: false,
        monitoringUptimeReport: action.monitoringUptimeReport
      };
    case monitoringdashboardConstants.GETHOST_UPTIME_REPORT_FAILURE:
      return {
        error: action.error
      };        
    default:
      return state;
  }
}
export function monitoringUtilizationReport(state = {}, action) {
  switch (action.type) {
    case monitoringdashboardConstants.GETHOST_UTILIZATION_REPORT_REQUEST:
      return {
        ...state,
        isUtilizationReportLoading: true,
        monitoringUtilizationReport: []
      };
    case monitoringdashboardConstants.GETHOST_UTILIZATION_REPORT_SUCCESS:
      return {
        isUtilizationReportLoading: false,
        monitoringUtilizationReport: action.monitoringUtilizationReport
      };
    case monitoringdashboardConstants.GETHOST_UTILIZATION_REPORT_FAILURE:
      return {
        error: action.error
      };        
    default:
      return state;
  }
}

export function monitoringalerts(state = {}, action) {
  switch (action.type) {
    case monitroingalertsConstants.GETALL_REQUEST:
      return {
        loading: true
      };
    case monitroingalertsConstants.GETALL_SUCCESS:
      return {
        items: action.monitoring
      };
    case monitroingalertsConstants.GETALL_FAILURE:
      return {
        error: action.error
      };    
    default:
      return state;
  }
}
export function hostitemsgraphs(state = {}, action) {
  switch (action.type) {
    case hostitemsgraphsConstants.GETALL_REQUEST:
      return {
        loading: true
      };
    case hostitemsgraphsConstants.GETALL_SUCCESS:
      return {
        isHostItemsGraphsLoading: false,
        items: action.hostitemsgraphs
      };
    case hostitemsgraphsConstants.GETALL_FAILURE:
      return {
        error: action.error
      };    
    default:
      return state;
  }
}

export function monitoringmetrics(state = {}, action) {
  switch (action.type) {
    case monitoringmetricsConstants.GETALL_REQUEST:
      return {
        loading: true
      };
    case monitoringmetricsConstants.GETALL_SUCCESS:
      return {
        items: action.monitoring
      };
    case monitoringmetricsConstants.GETALL_FAILURE:
      return {
        error: action.error
      };    
    default:
      return state;
  }
}

export function monitoringVMItems(state = {}, action) {
  switch (action.type) {
    case monitoringdashboardConstants.GETHOST_ITEMS_FROM_ZABBIX_REQUEST:
      return {
        ...state,
        isHostItemsLoading: true,
        monitoringVMItems: []
      };
    case monitoringdashboardConstants.GETHOST_ITEMS_FROM_ZABBIX_SUCCESS:
      return {
        isHostItemsLoading: false,
        monitoringVMItems: action.monitoringVMItems
      };
    case monitoringdashboardConstants.GETHOST_ITEMS_FROM_ZABBIX_FAILURE:
      return {
        error: action.error
      };   
    default:
      return state;
  }
}