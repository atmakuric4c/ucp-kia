import React from "react";
import { HashRouter as Router, Route } from "react-router-dom";
import { connect } from "react-redux";
import { history } from "../_helpers";
import { alertActions } from "../_actions";
import { PrivateRoute } from "../_components";
import { Navigation } from "../_components/Navigation";
import { HomePage } from "../HomePage";
import { LoginPage } from "../LoginPage";
/*import { RegisterPage } from "../RegisterPage";
//import { ForgotPassword } from "../ForgotPassword";
//import { VCenterMgmt } from "../VCenterMgmt";
import { IpamCom } from "../Ipam";
import { Datastore } from "../Datastore";
import { EmailSettings } from "../Settings";
import { Profiles } from "../_components/Profiles";
import { Ostemplates } from "../_components/Ostemplates";
import { EsxiMgmt } from "../EsxiMgmt";
import { NetworkMgmt } from "../NetworkMgmt";
import { VeeamServer } from "../VeeamServer";
*/
import { Vmlist,VmDetail,PhysicalServerDetails } from "../_components/Vmlist";
//import { CitrixVmlist,CitrixVmDetail } from "../_components/Citrix";
import { azureIpList,azureDiskList, AzureVmlist,AzureVmDetail,azureResourceGroups,
  AzureNetworkList, azureResourceList, azureResourcesSearch, userVmAccessList,
  cyberArkUsers } from "../_components/Azure";
/*import { GcpVmList,GcpVmDetails,GcpDiskList,GcpNetworkList,GcpSubnetList } from "../_components/Gcp";
import { AwsVmlist,AwsVmDetail, AwsVPCList, AwsSubnetList, AwsVolumeList, AwsNICList, AwsManageUsers, AwsManagePolicy } from "../_components/Aws";
import { Vms } from "../_components/Scheduler";
import { VmHourlyReport,VmReport } from "../_components/VmReports";
import { Users,ResetPassword, ChangePassword,MyProfile, ManageProfile } from "../_components/Users";
import { ApprovalMatrix } from "../_components/ApprovalMatrix";*/
import { Users } from "../_components/Users";
import { Roles } from "../_components/Roles";
//import { RolesList } from "../_components/Roles/RolesList";
import { ManageRoles } from "../_components/Roles/ManageRoles";
import { AssignUsers } from "../_components/Roles/AssignUsers";
import { newVMInstance, viewCart, cartPreview, pgiSelection, txnSuccess, txnFailed, pgiebs, pgiPaytm, azureNewVMInstance, awsNewVMInstance, gcpNewVMInstance, pendingOrders, pendingOrdersList, vmOpsRequests } from "../_components/Orders";
/*import { billingDashboard, billingInvoices, billingTransactions, billingPayments, billingReports, AwsBillingReport, budgetAlerts, AzureBillingReport, GcpBillingReport } from "../_components/Billing";
import { AwsCostForecast, AwsUsageForecast, AwsRepoList, AwsRepoFileList, AwsRepoFileContent, AwsPipelineList, AwsPipelineExecutionHistory } from "../_components/AwsDevops";
import { AzureRepoList, AzureRepoFileList, AzurePipelineList, AzurePipelineRunList } from "../_components/AzureDevops";
import { GcpRepoList, GcpPipelineList } from "../_components/GcpDevops";*/
//import { ProfileList } from "../_components/Profiles";
/*import { Menus } from "../_components/Menus";
import { Myticket } from "../_components/Support";
import { Documents } from "../_components/Documents";
import { Ticketlist } from "../_components/PrivateTickets";
import { MonitoringMetrics, MonitoringDashboard, MonitoringAlerts, HostItemsGraphs, MonitoringServers } from "../_components/Monitoring";
import { Vcenterlogs } from "../Vcenterlogs";*/
import {userVmAccessRequests} from '../_components/Azure/userVmAccessRequests';
import {faqs} from '../_components/Support/faqs';
import {userGuide, LinuxAndLinuxPlusMiddleWare, AADUserOnboarding, 
  LinuxPlusOracle, LinuxServerAccess, LinuxWeblogic,
  RoleBasedAccessManagement } from '../_components/UserGuides';
import { ToastContainer } from 'react-toastify';
import { commonFns } from "../_helpers/common";
import { NoAccess } from "../App/NoAccess";
import { authHeader, decryptResponse, encryptRequest } from '../_helpers';
import config from 'config';

class App extends React.Component {
  constructor(props) {
    super(props);

    let user = localStorage.getItem("user"), showVersion;

    if(user){
      user =  decryptResponse(user);
    }

    //UnComment to Enable Profile Template
    /*this.state = {
      dynamicMenuList: (user && user.data && user.data.profile && user.data.profile.menuInfo ? user.data.profile.menuInfo : [])
    };*/

    //UnComment to Enable Profile Template
    //this.fnGetMenuVmOperationsList();
    
    const { dispatch } = this.props;
    history.listen((location, action) => {

      //UnComment to Enable Profile Template
      //this.fnGetMenuVmOperationsList();
      
      
      // clear alert on location change
      dispatch(alertActions.clear());
    });
  }

  fnGetMenuVmOperationsList(){
    let user = localStorage.getItem("user"), showVersion;

    user = decryptResponse(user)
    showVersion = localStorage.getItem("showVersion");

    if(user && user.data && user.data.user_role != 1){
      let formdata = {
        user_id: user.data.id,
      };

      const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(formdata)
      };
  
      fetch(`${config.apiUrl}/secureApi/users/getMenuListVMOperations`, requestOptions).then(response  => this.handleEditItemResponse(response));
    }
  }

  handleEditItemResponse(response, stateName) {
    return response.text().then(text => {
      let data = (text ? JSON.parse(text) : ""),
        user = decryptResponse(localStorage.getItem("user"));
      
      user.data.profile.menuInfo = (data && data.menuInfo ? data.menuInfo : []);
      user.data.profile.profileInfo = (data && data.profileInfo ? data.profileInfo : {profile_menu_list: "[]", vm_operations: "{}"});

      localStorage.setItem("user", encryptRequest(JSON.stringify(user)));

      if(data && data.menuInfo){
        this.setState({
          dynamicMenuList: data.menuInfo
        });
      }
      else{
        this.setState({
          dynamicMenuList: []
        });
      }
    });
  }

  componentDidMount(){

  let url = window.location.href.split('#/');
    if(localStorage.user && !url[1]){
      let user = localStorage.getItem("user");

      user = decryptResponse(user)
      if(user.data.TicketOnlyClients && user.data.TicketOnlyClients.indexOf(user.data.clientid) >=0 ){
    	  //(user.data.clientid === user.data.GOBEAR_CLIENT_ID)
	      window.history.pushState('', '', '/#/myticket');
	      window.location.reload(true); 
      }
  }
      
  }

  render() {
    const { alert, common } = this.props;
    let menus = common.menus;

    return (
          <Router /*history={history}*/>
          <div>
            {localStorage.user ? 
              <React.Fragment>
                <div>
                  {
                    /*UnComment to Enable Profile Template
                      <Navigation userMenus={this.state.dynamicMenuList} />
                    */
                  }
                  <Navigation />
                </div>
                <ToastContainer />

                <PrivateRoute exact path="/" component={commonFns.fnCheckPageAuth('dashboard') ? HomePage : NoAccess} />
               
                <PrivateRoute exact path="/newVMInstance" component={commonFns.fnCheckPageAuth(commonFns.menuUrls.newVMInstance) ? newVMInstance : NoAccess} />

                <PrivateRoute exact path="/users" component={commonFns.fnCheckManagerRole() ? Users : NoAccess} /> 

                <PrivateRoute exact path="/resource-group-users" component={commonFns.fnCheckManagerRole() ? Roles : NoAccess} />

                {/*<PrivateRoute exact path="/resource-group-all-users" component={commonFns.fnCheckManagerRole() ? RolesList : NoAccess} />*/}
                <PrivateRoute exact path="/roles" component={commonFns.fnCheckPageAuth('access') ? ManageRoles : NoAccess} />

                <PrivateRoute exact path="/rbac" component={commonFns.fnCheckPageAuth('access') ? AssignUsers : NoAccess} />

                {/**<PrivateRoute exact path="/approvalManagement" component={commonFns.fnCheckManagerRole() ? ApprovalMatrix : NoAccess} /> */}
                
                {/**<PrivateRoute exact path="/ManageProfile" component={commonFns.fnCheckPageAuth(commonFns.menuUrls.ManageProfile) ? ManageProfile : NoAccess} /> */}

                {/**<PrivateRoute exact path="/monitoringdashboard" component={commonFns.fnCheckPageAuth(commonFns.menuUrls.monitoringdashboard) ? MonitoringDashboard : NoAccess} /> */}

                <PrivateRoute exact path="/vmdetail/:id" component={commonFns.fnCheckPageAuth('manage') ? VmDetail : NoAccess} />
                
                <PrivateRoute exact path="/azureNewVMInstance" component={commonFns.fnCheckPageAuth('order', 'write_permission') ? azureNewVMInstance : NoAccess} />

                <PrivateRoute exact path="/AwsNewVMInstance" component={commonFns.fnCheckPageAuth(commonFns.menuUrls.AwsNewVMInstance) ? awsNewVMInstance : NoAccess} />

                <PrivateRoute exact path="/viewCart" component={commonFns.fnCheckPageAuth(commonFns.menuUrls.viewCart) ? viewCart : NoAccess} />

                <PrivateRoute exact path="/cartPreview/:id" component={commonFns.fnCheckPageAuth(commonFns.menuUrls.viewCart) ? cartPreview : NoAccess} />
                <PrivateRoute exact path="/pendingOrders" component={commonFns.fnCheckPageAuth('order') ? pendingOrders : NoAccess} />
                <PrivateRoute exact path="/pendingOrdersList" component={commonFns.fnCheckPageAuth('order') ? pendingOrdersList : NoAccess} />
                <PrivateRoute exact path="/vmOpsRequests" component={commonFns.fnCheckPageAuth('manage') ? vmOpsRequests : NoAccess} />
                
                
                <PrivateRoute exact path="/azure" component={commonFns.fnCheckPageAuth('manage') ? azureResourceList : NoAccess} />
                
                <PrivateRoute exact path="/azureResourcesSearch" component={commonFns.fnCheckPageAuth(commonFns.menuUrls.azureResourcesSearch) ? azureResourcesSearch : NoAccess} />
                
                <PrivateRoute exact path="/userVmAccessRequests" component={commonFns.fnCheckPageAuth(commonFns.menuUrls.userVmAccessRequests) ? userVmAccessRequests : NoAccess} />
                <PrivateRoute exact path="/userVmAccessList" component={commonFns.fnCheckPageAuth(commonFns.menuUrls.userVmAccessList) ? userVmAccessList : NoAccess} />
                <PrivateRoute exact path="/cyberArkUsers" component={commonFns.fnCheckPageAuth(commonFns.menuUrls.cyberArkUsers) ? cyberArkUsers : NoAccess} />
                
                <PrivateRoute exact path="/azurevmdetail" component={commonFns.fnCheckPageAuth('manage') ? AzureVmDetail : NoAccess} />

                <PrivateRoute exact path="/azureResourceGroups" component={commonFns.fnCheckPageAuth('manage') ? azureResourceGroups : NoAccess} />

                <PrivateRoute exact path="/azureDiskList" component={false ? azureDiskList : NoAccess} />

                {/**<PrivateRoute exact path="/profile" component={commonFns.fnCheckPageAuth(commonFns.menuUrls.profileList) ? ProfileList : NoAccess} /> */}


                <PrivateRoute exact path="/azureVmList" component={commonFns.fnCheckPageAuth('manage') ? AzureVmlist : NoAccess} />
                <PrivateRoute exact path="/faqs" component={faqs} />
                
                <PrivateRoute exact path="/user-guide" component={userGuide} />
                <PrivateRoute exact path="/AADUserOnboarding" component={AADUserOnboarding} />
                <PrivateRoute exact path="/LinuxAndLinuxPlusMiddleWare" component={LinuxAndLinuxPlusMiddleWare} />
                <PrivateRoute exact path="/LinuxPlusOracle" component={LinuxPlusOracle} />
                <PrivateRoute exact path="/LinuxServerAccess" component={LinuxServerAccess} />
                <PrivateRoute exact path="/LinuxWeblogic" component={LinuxWeblogic} />
                <PrivateRoute exact path="/RoleBasedAccessManagement" component={RoleBasedAccessManagement} />
                
                <PrivateRoute exact path="/txnSuccess/:id" component={txnSuccess} />
                <PrivateRoute exact path="/txnFailed" component={txnFailed} />

                <PrivateRoute exact path="/NoAccess" component={NoAccess} />
              </React.Fragment>
            :
              <React.Fragment>
                <ToastContainer />
                <LoginPage />
              </React.Fragment>
            }
          </div>
        </Router>
    );
  }
}

function mapStateToProps(state) {
  const { alert, common } = state;
  return {
    alert,
    common
  };
}

const connectedApp = connect(mapStateToProps)(App);
export { connectedApp as App };
