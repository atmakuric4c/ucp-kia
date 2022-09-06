import { combineReducers } from "redux";

import { authentication } from "./authentication.reducer";
import { registration } from "./registration.reducer";
import { forgotpass } from "./forgotpass.reducer";
import { users } from "./users.reducer";
import { alert } from "./alert.reducer";
import { ipam } from "./ipam.reducer";
import { common } from "./common.reducers";
import { vcentermgmt } from "./vcentermgmt.reducer";
import { datastore } from "./datastore.reducer";
import { profiles } from "./profiles.reducer";
import { ostemplates } from "./ostemplates.reducer";
import { emailsettings } from "./emailsettings.reducer";
import { NetworkMgmt } from "../NetworkMgmt/networkmgmt.reducers";
import { VeeamServer } from "../VeeamServer/VeeamServer.reducers";
import { esximgmt } from "./esximgmt.reducer";
import { tickets,myticket } from "../_components/Support/support.reducer";
import { myshift } from "../_components/PrivateTickets/myshift.reducer";
import { vmlist,veeamjob } from "../_components/Vmlist/vmlist.reducer";
import { citrix } from "../_components/Citrix/vmlist.reducer";
import { ApprovalMatrices } from "../_components/ApprovalMatrix/ApprovalMatrix.reducer";
import { azure,azureNetwrok } from "../_components/Azure/azure.reducer";
import { aws } from "../_components/Aws/aws.reducer";
import { scheduler } from "../_components/Scheduler/vmlist.reducer";
import { vmHourlyReports,vmHourlyHistoryReports,vmReports,generateReport,generateVmHourlyReport } from "../_components/VmReports/vmreports.reducer";
import { menus } from "./menu.reducer";
import { orders } from "../_components/Orders/orders.reducer";
import { billing } from "../_components/Billing/billing.reducer";
import { awsDevops } from "./awsDevops.reducer";
import { azureDevops } from "./azureDevops.reducer";
import { gcpDevops } from "./gcpDevops.reducer";
import { billingCommon } from "./billing.reducer";
import { Vcenterloginfo } from "../Vcenterlogs/vcenterlog.reducer";
import { monitoringServers, monitoringmetrics, monitoringdashboard, monitoringUsageMetrics, monitoringUptimeReport, monitoringUtilizationReport, monitoringalerts, monitoringVMItems, hostitemsgraphs } from "../_components/Monitoring/monitoring.reducer";

const rootReducer = combineReducers({
  authentication,
  registration,
  forgotpass,
  users,
  alert,
  ipam,
  common,
  vcentermgmt,
  datastore,
  profiles,
  ostemplates,
  emailsettings,
  esximgmt,
  NetworkMgmt,
  VeeamServer,
  vmlist,
  Vcenterloginfo,
  monitoringmetrics,
  monitoringdashboard,
  monitoringUsageMetrics,
  monitoringUptimeReport,
  monitoringUtilizationReport,
  monitoringalerts,
  monitoringVMItems,
  monitoringServers,
  hostitemsgraphs,
  tickets,
  myticket,
  myshift,
  vmHourlyReports,
  vmHourlyHistoryReports,
  menus,
  vmReports,
  generateReport,
  generateVmHourlyReport,
  veeamjob,
  scheduler,
  orders,
  billing,
  awsDevops,
  azureDevops,
  gcpDevops,
  citrix,
  azure,
  azureNetwrok,
  aws,
  billingCommon,
  ApprovalMatrices
});

export default rootReducer;
