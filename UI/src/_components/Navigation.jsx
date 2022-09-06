import React from "react";
import { Link, BrowserRouter as Router, Route } from "react-router-dom";
import { connect } from "react-redux";
import { commonActions, userActions } from "../_actions/common.actions";
import { userService } from "../_services/user.service";
import { profileCommon } from "../_helpers";
import { userConstants } from "../_constants/user.constants";
import {Header} from "./Header";
import Footer from "./Footer";
import { profileActions } from '../_actions';
import { decryptResponse } from './../_helpers';
import config from 'config';


class Navigation extends React.Component {
  constructor(props) {
    super(props);
    
    let user = decryptResponse(
      localStorage.getItem("user")),
      {isSuperAdmin, resource_groups} = user.data,
      only_member = true;

    isSuperAdmin = parseInt(isSuperAdmin);
    resource_groups.map(resource => {
      if (resource.role_id === 3) {
        only_member = false
      }
      return resource;
    });

	  let cts = Math.round(new Date().getTime() / 1000);
   
    this.state = {
      user: user,
      basicMenuList: [
        {
          menu_name:  "Dashboard",
          url: "/#/",
          classname: "fa fa-home",
          show: true,
        },
        {
          menu_name:  "Access",
          classname: "fa fa-universal-access",
          show:  (user.data.user_role == 1 && !only_member) || isSuperAdmin ?
            true : false,
          child: [
            {
              menu_name:  "Users",
              url: "/#/users",
              classname: "fas fa-users",
              show: true,
            },
            {
              menu_name:  "Profile Template",
              url: "/#/ManageProfile",
              classname: "fas fa-users",
              show: false,
            }
          ]
        },
        {
          menu_name:  "Support",
          classname: "fa fa-ticket-alt",
          show: true,
          child: [
            {
              menu_name:  "Ticket List",
              url: "/#/myticket",
              classname: "fa fa-list",
              show: true,
            }
          ]
        },
      ],
      dynamicMenuList: [
        {
          menu_name:  "Dashboard",
          url: "/#/",
          classname: "fa fa-home",
          show: true,
        },
        {
          menu_name:  "Order",
          classname: "fa fa-shopping-cart",
          show: true,
          child: [
            {
              menu_name:  "New VM Instance",
              classname: "fa fa-desktop",
              show: true,
              child: [
//                {
//                  menu_name:  "Cloud4C",
//                  url: "/#/newVMInstance",
//                  classname: "fas fa-cloud",
//                  show: true,
//                },
                {
                  menu_name:  "Azure",
                  url: "/#/AzureNewVMInstance",
                  classname: "fab fa-microsoft",
                  show: (user.data.azure_linked == 1 ? true : false),
                },
//                {
//                  menu_name:  "AWS",
//                  url: "/#/AwsNewVMInstance",
//                  classname: "fab fa-aws",
//                  show: (user.data.is_aws_enabled == 1 ? true : false),
//                },
//                {
//                  menu_name:  "Google Cloud",
//                  url: "/#/GcpNewVMInstance",
//                  classname: "fa fa-cloud",
//                  show: (user.data.is_gcp_enabled == 1 ? true : false),
//                },
              ]
            },
            {
                menu_name:  "Orders List",
                url: "/#/pendingOrdersList",
                classname: "fa fa-shopping-cart",
                show: true,
            },
//            {
//              menu_name:  "View Cart",
//              url: "/#/viewCart",
//              classname: "fa fa-shopping-cart",
//              show: true,
//            },
            {
                menu_name:  "Deployment Information",
                url: "/#/pendingOrders",
                classname: "fa fa-desktop",
                show: true,
              }
          ]
        },
        {
          menu_name:  "Manage",
          classname: "fa fa-tasks",
          show: true,
          child: [
//            {
//              menu_name:  "Cloud4C",
//              url: "/#/cloud4c",
//              classname: "fas fa-cloud",
//              show: true,
//            },
            {
              menu_name:  "Azure",
              classname: "fab fa-microsoft",
              show: (user.data.azure_linked == 1 ? true : false),
              child: [
                {
                  menu_name:  "VM List",
                  url: "/#/azureVmList",
                  classname: "fab fa-microsoft",
                  show: true,
                },
                {
                    menu_name:  "VM Ops Requests",
                    url: "/#/vmOpsRequests",
                    classname: "fab fa-microsoft",
                    show: true,
                },
                {
                    menu_name:  "User VM Access Requests",
                    url: "/#/UserVmAccessRequests",
                    classname: "fab fa-microsoft",
                    show: true,
                },
                {
                    menu_name:  "User VM Access List",
                    url: "/#/UserVmAccessList",
                    classname: "fab fa-microsoft",
                    show: true,
                },
//                {
//                    menu_name:  "Resources",
//                    url: "/#/azure",
//                    classname: "fab fa-microsoft",
//                    show: true,
//                },
//                {
//                  menu_name:  "Resource Groups",
//                  url: "/#/azureResourceGroups",
//                  classname: "fab fa-microsoft",
//                  show: true,
//                },
                {
                  menu_name:  "Disks",
                  url: "/#/azureDiskList",
                  classname: "fas fa-hdd",
                  show: false,
                },
//                {
//                  menu_name:  "Virtual Networks",
//                  url: "/#/azurenetwork",
//                  classname: "fab fa-microsoft",
//                  show: true,
//                },
//                {
//                  menu_name:  "Public IP Config",
//                  url: "/#/azureIpList",
//                  classname: "fas fa-server",
//                  show: true,
//                },
//                {
//                  menu_name:  "Azure Repository",
//                  url: "/#/azure-repository-list",
//                  classname: "fab fa-github",
//                  show: user.data.is_msdevops_enabled ? true : false
//                },
//                {
//                  menu_name:  "Azure Pipeline",
//                  url: "/#/azure-pipeline-list",
//                  classname: "fa fa-cloud",
//                  show: user.data.is_msdevops_enabled ? true : false
//                }
              ]
            },
              
//            {
//              menu_name:  "AWS",
//              classname: "fab fa-aws",
//              show: (user.data.is_aws_enabled == 1 ? true : false),
//              child: [
//                {
//                  menu_name:  "VMs",
//                  url: "/#/aws",
//                  classname: "fab fa-aws",
//                  show: true,
//                },
//                {
//                  menu_name:  "Volume",
//                  url: "/#/awsVolumeList",
//                  classname: "fas fa-server",
//                  show: true,
//                },
//                {
//                  menu_name:  "VPC",
//                  url: "/#/awsVPCList",
//                  classname: "fab fa-aws",
//                  show: true,
//                },
//                {
//                  menu_name:  "Subnet",
//                  url: "/#/awsSubnetList",
//                  classname: "fab fa-aws",
//                  show: true,
//                },
//                {
//                  menu_name:  "NIC",
//                  url: "/#/awsNICList",
//                  classname: "fas fa-server",
//                  show: true,
//                },
//                {
//                  menu_name:  "IM Policy",
//                  url: "/#/AwsManagePolicy",
//                  classname: "fa fa-lock",
//                  show: false,
//                },
//                {
//                  menu_name:  "IM Users",
//                  url: "/#/AwsManageUsers",
//                  classname: "fas fa-users",
//                  show: false,
//                },
//                {
//                  menu_name:  "AWS Repository",
//                  url: "/#/aws-repository-list",
//                  classname: "fab fa-github",
//                  show: user.data.is_aws_enabled ? true : false
//                },
//                {
//                  menu_name:  "AWS Pipeline",
//                  url: "/#/aws-pipeline-list",
//                  classname: "fa fa-cloud",
//                  show: user.data.is_aws_enabled ? true : false
//                }
//              ]
//            },
//            {
//              menu_name:  "Google Cloud",
//              classname: "fa fa-cloud",
//              show: (user.data.is_gcp_enabled == 1 ? true : false),
//              child: [
//                {
//                  menu_name:  "VMs",
//                  url: "/#/GcpVmList",
//                  classname: "fa fa-cloud",
//                  show: true,
//                },
//                {
//                  menu_name:  "Disks",
//                  url: "/#/GcpDiskList",
//                  classname: "fas fa-hdd",
//                  show: true,
//                },
//                {
//                  menu_name:  "Networks",
//                  url: "/#/GcpNetworkList",
//                  classname: "fa fa-cloud",
//                  show: true,
//                },
//                {
//                  menu_name:  "Subnet",
//                  url: "/#/GcpSubnetList",
//                  classname: "fa fa-cloud",
//                  show: true,
//                },
//                {
//                  menu_name:  "GCP Repository",
//                  url: "/#/gcp-repository-list",
//                  classname: "fab fa-github",
//                  show: user.data.is_gcp_enabled ? true : false
//                },
//                {
//                  menu_name:  "GCP Builds",
//                  url: "/#/gcp-pipeline-list",
//                  classname: "fa fa-cloud",
//                  show: user.data.is_gcp_enabled ? true : false
//                }
//              ]
//            }
          ]
        },
//        {
//          menu_name:  "Monitoring",
//          classname: "fa fa-desktop",
//          show: true,
//          child: [
//            {
//              menu_name:  "Cloud4c Dashboard",
//              url: "/#/monitoringdashboard",
//              classname: "fa fa-chart-line",
//              show: true,
//            }
//          ]
//        },
        {
          menu_name:  "User Management",
          classname: "fa fa-universal-access",
          show: resource_groups.length || isSuperAdmin,
          child: [
           {
             menu_name:  "Users",
             url: "/#/users",
             classname: "fas fa-users",
             show: true,
           },
            // {
            //     menu_name:  "Roles",
            //     url: "/#/roles",
            //     classname: "fas fa-users",
            //     show: true,
            //     child: [
            //       {
            //         menu_name:  "Assigned Users",
            //         url: "/#/assign-users",
            //         classname: "fas fa-users",
            //         show: true,
            //       }]
            // },
            {
              menu_name:  "User Access",
              url: "/#/resource-group-users",
              classname: "fas fa-users",
              show: true
            },
            // {
            //     menu_name:  "AD Users List",
            //     url: "/#/cyberArkUsers",
            //     classname: "fas fa-users",
            //     show: (!only_member && (resource_groups || []).length) || 
            //     isSuperAdmin
            // },
            // {
            //   menu_name:  "All Users List",
            //   url: "/#/resource-group-all-users",
            //   classname: "fas fa-users",
            //   show: true
            // },
//            {
//	            menu_name:  "Approval Management",
//	            url: "/#/approvalManagement",
//	            classname: "fas fa-users",
//	            show: true,
//            },
//            {
//              menu_name:  "Profile",
//              url: "/#/profile",
//              classname: "fas fa-users",
//              show: true,
//            }
          ]
        },
        {
          menu_name:  "Help",
          classname: "fa fa-tasks",
          show: true,
          child: [
            {
              menu_name:  "FAQs",
              url: '/#/faqs',
              onclick: '/#/faqs',
              classname: "fa fa-faq",
              show: true,
            },
//             {
//                 menu_name:  "User Guides HTML",
//                 url: '/#/user-guide',
// //                onclick: '/#/user-guide',
//                 classname: "fa fa-book",
//                 show: true,
//             },
//             {
//               menu_name:  "User Guides",
// //              url: '/#/user-guide',
// //              onclick: '/#/user-guide',
//               classname: "fa fa-book",
//               show: true,
//               child: [
//                 {
//                   menu_name:  "AAD User Onboarding",
//                   url: config.apiUrl+"/download/UserGuide/AAD_User_Onboarding_v1.0.pdf",
//                   classname: "fa fa-book",
//                   show: true,
//                   openInNewTab : true
//                 },
//                 {
//                     menu_name:  "Linux & Linux+MiddleWare",
//                     url: config.apiUrl+"/download/UserGuide/Linux_&_Linux_+_MiddleWare_v1.4.pdf",
//                     classname: "fa fa-book",
//                     show: true,
//                     openInNewTab : true
//                 },
//                 {
//                 	menu_name:  "Linux Oracle",
//                     url: config.apiUrl+"/download/UserGuide/Linux_Oracle_v1.1.pdf",
//                     classname: "fa fa-book",
//                     show: true,
//                     openInNewTab : true
//                 },
//                 {
//                 	menu_name:  "Linux Server Access",
//                     url: config.apiUrl+"/download/UserGuide/Linux_Server_Access_v1.1.pdf",
//                     classname: "fa fa-book",
//                     show: true,
//                     openInNewTab : true
//                 },
//                 {
//                 	menu_name:  "Linux Weblogic",
//                     url: config.apiUrl+"/download/UserGuide/Linux_Weblogic_v1.1.pdf",
//                     classname: "fa fa-book",
//                     show: true,
//                     openInNewTab : true
//                 },
//                 {
//                 	menu_name:  "Role Based Access Management",
//                     url: config.apiUrl+"/download/UserGuide/Role_Based_Access_Management_v1.2.pdf",
//                     classname: "fa fa-book",
//                     show: true,
//                     openInNewTab : true
//                 },
//                 {
//                 	menu_name:  "Server Details & Operations",
//                     url: config.apiUrl+"/download/UserGuide/Server_Details_&_Operations_v1.1.pdf",
//                     classname: "fa fa-book",
//                     show: true,
//                     openInNewTab : true
//                 },
//                 {
//                 	menu_name:  "Windows MSSQL",
//                     url: config.apiUrl+"/download/UserGuide/Windows_MSSQL_v1.1.pdf",
//                     classname: "fa fa-book",
//                     show: true,
//                     openInNewTab : true
//                 },
//                 {
//                 	menu_name:  "Windows Plain & IIS",
//                     url: config.apiUrl+"/download/UserGuide/Windows_Plain_&_IIS_v1.3.pdf",
//                     classname: "fa fa-book",
//                     show: true,
//                     openInNewTab : true
//                 },
//                 {
//                 	menu_name:  "Windows Server & MSSQL DB Access",
//                     url: config.apiUrl+"/download/UserGuide/Windows_Server_and_MSSQL_Database_access_v1.3.pdf",
//                     classname: "fa fa-book",
//                     show: true,
//                     openInNewTab : true
//                 },
//               ]
//             }
         ]
        }
//        {
//          menu_name:  "Search",
//          url: "/#/azureResourcesSearch",
//          classname: "fa fa-search",
//          show: true,
//        },
//        {
//          menu_name:  "Billing",
//          classname: "fa fa-file-invoice",
//          show: true,
//          child: [
//            {
//              menu_name:  "Dashboard",
//              url: "/#/billingDashboard",
//              classname: "fas fa-tachometer-alt",
//              show: true
//            },
//            {
//              menu_name:  "Invoices",
//              url: "/#/billingInvoices",
//              classname: "fas fa-file-invoice",
//              show: true
//            },
//            {
//              menu_name:  "Transactions",
//              url: "/#/billingTransactions",
//              classname: "fas fa-exchange-alt",
//              show: true
//            },
//            {
//              menu_name:  "Payments",
//              url: "/#/billingPayments",
//              classname: "fa fa-credit-card",
//              show: true
//            },
//            {
//              menu_name:  "Budget Alerts",
//              url: "/#/budgetAlerts",
//              classname: "fa fa-bell",
//              show: user.data.azure_linked || user.data.is_aws_enabled || user.data.is_gcp_enabled ? true : false
//            },
//            {
//              menu_name:  "Reports",
//              classname: "fa fa-file-invoice",
//              show:  user.data.azure_linked || user.data.is_aws_enabled || user.data.is_gcp_enabled ? true : false,
//              child: [
//                {
//                  menu_name:  "AWS Billing Report",
//                  url: "/#/aws-billing-report",
//                  classname: "fa fa-chart-line",
//                  show: user.data.is_aws_enabled ? true : false
//                },
//                {
//                  menu_name:  "Azure Billing Report",
//                  url: "/#/azure-billing-report",
//                  classname: "fa fa-chart-line",
//                  show: user.data.azure_linked ? true : false
//                },
//                {
//                  menu_name:  "GCP Billing Report",
//                  url: "/#/gcp-billing-report",
//                  classname: "fa fa-chart-line",
//                  show: user.data.is_gcp_enabled ? true : false
//                }
//              ]
//            },
//            {
//              menu_name:  "Forecasts",
//              classname: "fa fas fa-bolt",
//              show:  user.data.is_msdevops_enabled || user.data.is_aws_enabled || user.data.is_gcp_enabled ? true : false,
//              child: [
//                {
//                  menu_name:  "AWS Cost Forecast",
//                  url: "/#/aws-cost-forecast",
//                  classname: "fa fas fa-dollar-sign",
//                  show: user.data.is_aws_enabled ? true : false
//                },
//                {
//                  menu_name:  "AWS Usage Forecast",
//                  url: "/#/aws-usage-forecast",
//                  classname: "fa fas fa-receipt",
//                  show: user.data.is_aws_enabled ? true : false
//                }
//              ]
//            }
//          ]
//        },
//        {
//          menu_name:  "Governance Reports",
//          url: "/#/Documents",
//          classname: "fa fa-file",
//          show: true,
//        },
//        {
//          menu_name:  "Support",
//          classname: "fa fa-ticket-alt",
//          show: true,
//          child: [
//            {
//              menu_name:  "Ticket List",
//              url: "/#/myticket",
//              classname: "fa fa-list",
//              show: true,
//            }
//          ]
//        },
      ],

    }

    //UnComment to Enable Profile Template
    /*setTimeout(() => {
      this.updateDynamicMenu();  
    }, 100);*/
  }

  componentWillReceiveProps(nextProps) {
    let user = localStorage.getItem("user");

    if(user){
      this.setState({
        user: decryptResponse(user)
      });

      //UnComment to Enable Profile Template
      /*setTimeout(() => {
        this.updateDynamicMenu(nextProps);
      }, 100);*/
    }
  }

  showDynamicUserProfileMenu(){

    let menu = profileCommon.flatToMultiLevel(this.props.profiles.userProfileMenu.data.profile_menu_list);

    return menu;

  }

  logout = () => {
    userService.logout();
    window.location.href = window.location.origin + "/#/login";
    return { type: userConstants.LOGOUT };
  };

  componentDidMount(){

    let params = { clientid: null }
//    this.props.dispatch(profileActions.getUserProfile(params));

    $(document).on("click", ".ReactModal__Overlay--after-open", function(e){
      if(e.target.className && e.target.className.indexOf && e.target.className.indexOf("ReactModal__Overlay--after-open") != -1){
        e.stopImmediatePropagation()
      }
    });

    if(window.innerWidth < 769){
      $(document).on("click", "#menu a", function(e){
        if(e.target.href && e.target.href.indexOf("#") != -1){
          $("#toggle").click();
        }
      });
      
      $(document).on("click", "#menu", function(e){
        $("#menu *").removeClass("open");
      });
    }
  }

  render() {
    let user = this.state.user;

    return (
      <div>
        <Header/>
        {/* <header>
        <img src="./src/img/logo.png"/>
        {user?
        <span className='text-right float-right'>Welcome {user.data.email}</span>
        :
          ""
        }
      </header> */}
      
    <div className="main-menu">
        <nav id="menu">
          <Router>
            {(this.state.user.data.TicketOnlyClients && this.state.user.data.TicketOnlyClients.indexOf(this.state.user.data.clientid) >=0 ) ?
             <ul>
             {
               this.state.basicMenuList.map((menuItem, index) => (
                 (menuItem.show && (menuItem.url || menuItem.child) &&
                 (<li key={"li-"+index}>
                   <a href={menuItem.url}>
                     <i className={menuItem.classname + " nav-icon"} />
                     {"   " + menuItem.menu_name}
                     {menuItem.child && <i className="fa fa-chevron-right float-right"></i>}
                   </a>
                   {
                     menuItem.child && menuItem.show &&
                     <ul className="drop" key={"ul-"+index}>
                       {
                         menuItem.child.map((item, childIndex) => (
                           item.show && (item.url || item.child) &&
                           <li className={item.child && "sub-child"}  key={"li-"+index+"-"+childIndex}>
                             <a href={item.url}>
                               {item.classname ? <i className={"sub-menu-icon " + item.classname} /> : 
                               <i className="sub-menu-icon"></i> }
                               {item.menu_name}

                               {item.child && <span className="float-right mobile-sub-menu-right">&gt;</span> }
                             </a>

                               {item.child &&
                                 <ul>
                                     {item.child.map((newitem, childIndex) => (
                                       newitem.show &&
                                       <li key={"li-li-"+index+"-"+childIndex}>
                                         <a href={newitem.url}>
                                           {newitem.classname ? <i className={"sub-menu-icon " + newitem.classname} /> : 
                                           <i className="sub-menu-icon"></i> }
                                           {newitem.menu_name}
                                           </a>
                                       </li>
                                     ))}
                                 </ul>
                               }
                           </li>
                         ))
                       }
                     </ul>
                   }
                 </li>))
               ))
             }
         </ul>:
          <ul>
          {
        	  this.state.dynamicMenuList.map((menuItem, index) => (
	              (menuItem.show && (menuItem.url || menuItem.child) ?
	              (<li key={"li-"+index}>
	                <a href={menuItem.url}>
	                  <i className={menuItem.classname + " nav-icon"} />
	                  {"   " + menuItem.menu_name}
	                  {menuItem.child && <i className="fa fa-chevron-right float-right"></i>}
	                </a>
	                {
	                  menuItem.child && menuItem.show &&
	                  <ul className="drop" key={"ul-"+index}>
	                    {
	                      menuItem.child.map((item, childIndex) => (
	                        item.show && (item.url || item.child) ?
	                        <li className={item.child && "sub-child"}  key={"li-"+index+"-"+childIndex}>
	                          <a href={item.url || item.onclick}  target={item.onclick ? "_blank": ""}>
	                            {item.classname ? <i className={"sub-menu-icon " + item.classname} /> : 
	                            <i className="sub-menu-icon"></i> }
	                            {item.menu_name}
	
	                            {item.child && <span className="float-right mobile-sub-menu-right">&gt;</span> }
	                          </a>
	
	                            {item.child &&
	                              <ul>
	                                  {item.child.map((newitem, childIndex) => (
	                                    newitem.show ?
	                                    <li key={"li-li-"+index+"-"+childIndex}>
	                                      <a href={newitem.url} target={newitem.openInNewTab ?"_blank":""}>
	                                        {newitem.classname ? <i className={"sub-menu-icon " + newitem.classname} /> : 
	                                        <i className="sub-menu-icon"></i> }
	                                        {newitem.menu_name}
	                                        </a>
	                                    </li>: null
	                                  ))}
	                              </ul>
	                            }
	                        </li>:null
	                      ))
	                    }
	                  </ul>
	                }
	              </li>): null)
	            ))
          }
      </ul>}
         
          </Router>
        </nav>
      </div>
      <Footer/>
      </div>
    );
  }
}

function mapStateToProps(state) {
  let { menus, profiles } = state;
  return {
    menus,
    profiles
  };
}

const connectedNavigation = connect(mapStateToProps)(Navigation);
export { connectedNavigation as Navigation };
