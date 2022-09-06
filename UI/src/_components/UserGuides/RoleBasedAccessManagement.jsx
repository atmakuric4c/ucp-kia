import React, { Component } from "react";
import { authHeader, ucpEncrypt, ucpDecrypt } from '../../_helpers';
import config from 'config';

class RoleBasedAccessManagement extends Component {
	constructor(props) {
		super(props);

		let hrefurl = window.location.href;
		setTimeout(() => {
			if (hrefurl.indexOf("ref=") != -1) {
				console.log("enter  ref cb ");
				let ref = hrefurl.split("ref=")[1].split("&")[0];
				this.scrollToSection({ submenu: "", ref: ref })
			}else{
				$("#back-to-top").click();
			}
			window.history.pushState('Customer Portal', 'Title', window.location.href.split('?')[0]);
		}, 1000);

		this.scrollToSection = this.scrollToSection.bind(this);

		this.introductionRef = React.createRef();
		this.myResourceGroupRef = React.createRef();
		this.glossaryRef = React.createRef();
		
		this.RoleBasedAccessManagementRef = React.createRef();
		this.rightsToTMRef = React.createRef();
		this.UserAccessMenuRef = React.createRef();
		this.SearchOptionRef = React.createRef();
		this.userResourceGroupRef = React.createRef();
		this.roleAssignmentsRef = React.createRef();
		this.deleteRoleRef = React.createRef();
	}
	scrollToSection = (obj) => {
		setTimeout(() => {
			$(".ugMenu").removeClass("active");
			$("." + obj.ref).addClass("active");
		}, 1000);
		// console.log("enterrrr---- ", obj);
		this[obj.ref].current.scrollIntoView({ behavior: 'smooth' })
	};
	componentDidMount() {
		var elem1 = document.getElementsByTagName("body")[0];
		elem1.addEventListener("scroll", this.handleScroll);
	}
	  componentWillUnmount() {
		var elem1 = document.getElementsByTagName("body")[0];
		elem1.removeEventListener("scroll", this.handleScroll);
	  }

	  handleScroll = (event) => {
		// console.log("event.target.scrollHeight --- ",  event.target.scrollHeight);
		// console.log("event.target.scrollTop --- ",  event.target.scrollTop);
		// console.log("event.target.clientHeight --- ",  event.target.clientHeight);
		if(event.target.scrollTop >= '140'){
			$("#sidebar").css("position","fixed");
		}else{
			$("#sidebar").css("position","relative");
		}
	}

	render() {
		return (
			<div id="container" className="light-sidebar-nav">
				<aside>
					<div className="sidebar-toggle-box" id="leftSideBarNav" >
						<i className="fa fa-bars"></i>
					</div>
					<div id="sidebar" className="fixedElement nav-collapse ">
						<h6>Role Based Access Management</h6>
						<ul className="sidebar-menu" id="nav-accordion">
							<li className="sub-menu">
								<span className="d-flex ugMenu introductionRef" onClick={(e) => this.scrollToSection({ submenu: "introductionSubMenu", ref: "introductionRef" })}>
									<i className="far fa-file-alt fa-fw"></i>
									<small data-submenu="">1 Introduction to UCP RBAC User Access Management</small>
								</span>
								<ul className="sub" id="introductionSubMenu">
									<li>
										<span className="sliding-link ugMenu RoleBasedAccessManagementRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "RoleBasedAccessManagementRef" })}><i className="far fa-circle fa-fw"></i> 1.1 What is Role Based Access?</span>
									</li>
									<li>
										<span className="sliding-link ugMenu rightsToTMRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "rightsToTMRef" })}><i className="far fa-circle fa-fw"></i> 1.2 Rights of a Team Member & a Team Manager</span>
									</li>
								</ul>
							</li>
							<li className="sub-menu">
								<span className="d-flex ugMenu myResourceGroupRef" onClick={(e) => this.scrollToSection({ submenu: "myResourceGroupSubMenu", ref: "myResourceGroupRef" })}>
									<i className="far fa-file-alt fa-fw"></i>
									<small data-submenu="">2. How Can I assign a Team Member to my Resource Group?</small>
								</span>
								<ul className="sub" id="myResourceGroupSubMenu">
									<li>
										<span className="sliding-link ugMenu myResourceGroupRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "myResourceGroupRef" })}><i className="far fa-circle fa-fw"></i> 2.1 User Access Menu</span>
									</li>
									<li>
										<span className="sliding-link ugMenu SearchOptionRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "SearchOptionRef" })}><i className="far fa-circle fa-fw"></i> 2.2 Search Option</span>
									</li>
									<li>
										<span className="sliding-link ugMenu userResourceGroupRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "userResourceGroupRef" })}><i className="far fa-circle fa-fw"></i> 2.3 Addition of user to a Resource Group</span>
									</li>
									<li>
										<span className="sliding-link ugMenu roleAssignmentsRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "roleAssignmentsRef" })}><i className="far fa-circle fa-fw"></i> 2.4 Modifying the Role Assignments</span>
									</li>
									<li>
										<span className="sliding-link ugMenu deleteRoleRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "deleteRoleRef" })}><i className="far fa-circle fa-fw"></i> 2.4 Delete a User Role</span>
									</li>
								</ul>
							</li>
							<li className="sub-menu">
								<span className="d-flex ugMenu glossaryRef" onClick={(e) => this.scrollToSection({ submenu: "glossarySubMenu", ref: "glossaryRef" })}>
									<i className="far fa-file-alt fa-fw"></i>
									<small>3 Glossary</small>
								</span>
								<ul className="sub" id="glossarySubMenu">
									<li>
										<span className="sliding-link ugMenu glossaryRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "glossaryRef" })}><i className="far fa-circle fa-fw"></i> 3.1 Definition</span>
									</li>
								</ul>
							</li>
						</ul>
					</div>
				</aside>
				<section id="main-content">
					<section className="wrapper">
						<section className="card" id="introduction">
							<header className="card-header" ref={this.introductionRef}>
								<h5>1 Introduction to UCP RBAC User Access Management</h5>
							</header>
							<div className="card-body">
								<p>Welcome to Universal Cloud Platform user guide. UCP is a multi-cloud Self-Service platform that allows users to provision Virtual Machines into Azure Environment. Along with provisioning Linux, SAP & Windows Virtual Machines, you will be able to manage them, perform 2nd Day operations, decommission, obtain or provide access to the virtual machine. </p>
								<p>UCP not only does allow to provision the virtual machine but also configures monitoring via Splunk Monitoring, configures backup via Netbackup software, on-board Linux VMs to Cyberark Platform to obtain secure access, onboard Windows VMs to Active Directory.</p>
								<p>You will be able to create Virtual machines for both Test & Production purposes.</p>
								<p>UCP creates a CMDB CI entry in Global Service Now (GSN) for every virtual machine that get provisioned.</p>
								<p>UCP also creates a Change Management ticket (RFC) for every VM that has been deployed for Production purposes only. Based on this RFC ticket, every virtual machine undergoes thorough automated and manual checks for its readiness on the day of the delivery.</p>
								<p>This document emphasizes on providing Role based access to users within UCP.</p>
							</div>
						</section>

						<section className="card RoleBasedAccessManagement" id="RoleBasedAccessManagement">
							<header className="card-header" ref={this.RoleBasedAccessManagementRef}>
								<h5>1.1 What is Role Based Access?</h5>
							</header>
							<div className="card-body">
								<p>The UCP Platform has 2 types of users. Team Manager & Team Member</p>
								<p>Team Manager: A Team Manager is, most of the times, a Resource Group Owner. A manager of a team who can request to create a new Resource Group</p>
								<p>A resource group is a container that holds related resources for an Azure solution. The resource group can include all the resources for the solution, or only those resources that you want to manage as a group</p>
								<p>Team Member: A Team Member is part of the team where he/she can provision servers into a resource group.</p>
								<p>Note: A Team Member in a resource group can be a Team Manager in another resource group. Similarly, A Team Manager in a resource group can be a Team Member in another resource group.</p>
								<p>Note: There can be multiple Team Managers for one Single Resource Group and a Team Manager can have multiple resource groups assigned to him/her</p>
							</div>
						</section>

						<section className="card" id="rightsToTM">
							<header className="card-header" ref={this.rightsToTMRef}>
								<h5>1.2 Rights of a Team Member & a Team Manager </h5>
							</header>
							<div className="card-body">
								<p>The UCP Platform follows an approval methodology to create, perform or destroy any server within UCP.</p>
								<p>The rights are defined as follows</p>
								<p><b>Team Member:</b> A Team Member, of a resource group, can only request to perform the following actions on server(s) in UCP. Every request raised by a Team Member must be approved by a Team Manager(s) of the same resource group.</p>
								<ol className="alpha">
									<li>Provisioning - Raise a Service Order</li>
									<li>Resize - Resize an existing Server to another size</li>
									<li>Decommission - Raise a request to Destroy an existing server</li>
									<li>Create & Attach Disks - Raise a request to Create & attach additional disks for an existing server.</li>
								</ol>
								<p><b>Team Manager:</b> A Team Manager/Owner of a Resource Group, will be able to perform all the operations within UCP. He/She will be able to Approve or Reject a request raised by a Team Member within his/her resource group.</p>
								<ol className="alpha">
									<li>Provisioning - A service order request from a Team Member</li>
									<li>Resize - A server order request to resize an existing server to a different size</li>
									<li>Decommission - A service order to destroy an existing server</li>
									<li>Create & Attach Disks - A service order to Create & attach disks to existing server</li>
									<li>Server Access - Provide access to a Business user/System Administrator/Application Administrator to access a server(s) within his/her resource group</li>
									<li>UCP Access - Provide access to UCP and assign his/her resource group to a Team Member.</li>
								</ol>
							</div>
						</section>

						<section className="card" id="myResourceGroup">
							<header className="card-header" ref={this.myResourceGroupRef}>
								<h5>2. How Can I assign a Team Member to my Resource Group?</h5>
							</header>
							<div className="card-body">
								<h6>2.1	User Access Menu</h6>
								<p>User Access is the menu where Role based access can be controlled by Team Managers to the desired Resource Groups. Please follow the steps listed below to access the menu to perform the assignments.</p>
								<ul className="alpha">
									<li>Navigate to <a href="https://ucp.dhl.com">https://ucp.dhl.com</a>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic1.png" />
										</div>
									</li>
									<li>Enter your DHL email id AD Credentials
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic2.png" />
										</div>
										<p>The user will be landing on the dashboard as shown hereunder</p>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic3.png" />
										</div>
									</li>
									<li>Navigate to User Management -&gt; User Access
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic4.png" />
										</div>
										<p>The user will be landing on this page</p>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic5.png" />
										</div>
									</li>
								</ul>
							</div>
						</section>

						<section className="card" id="SearchOption">
							<header className="card-header" ref={this.SearchOptionRef}>
								<h5>2.2 Search Option</h5>
							</header>
							<div className="card-body">
								<p>Based on the following filters a user can search for the other users (Team Managers/ Team Members) within the resource groups he/she is part of.</p>
								<div className="my-4">
									<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic6.png" />
								</div>
								<div className="my-4">
									<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic7.png" />
								</div>
								<div className="my-4">
									<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic8.png" />
								</div>
								<p>The result of the search will appear as shown below.</p>
								<div className="my-4">
									<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic9.png" />
								</div>
							</div>
						</section>

						<section className="card" id="userResourceGroup">
							<header className="card-header" ref={this.userResourceGroupRef}>
								<h5>2.3 Addition of user to a Resource Group</h5>
							</header>
							<div className="card-body">
								<ul className="alpha">
									<li>In order to add a user to required resource group, click on Add Role.
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic10.png" />
										</div>
										<p>A pop-up will appear to select the following details</p>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic11.png" />
										</div>
									</li>
									<li>Select the desired user, select the Subscription, Resource Group(s) & the desired Role and click the Submit Button
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic12.png" />
										</div>
										<p>Note: Change in Role assignments requires logging-out of all sessions of UCP and login again; for the new role assignment to be affected.</p>
									</li>
								</ul>
							</div>
						</section>

						<section className="card" id="roleAssignments">
							<header className="card-header" ref={this.roleAssignmentsRef}>
								<h5>2.4 Modifying the Role Assignments</h5>
							</header>
							<div className="card-body">
								<ul className="alpha">
									<li>Search for the desired user
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic13.png" />
										</div>
									</li>
									<li>Click on the Edit Button in the Action column
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic14.png" />
										</div>
									</li>
									<li>Change the role from Team Manager to Team Member and click on Submit.
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic15.png" />
										</div>
									</li>
									<li>The user role is now changed to Team Member
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic16.png" />
										</div>
									</li>
								</ul>
							</div>
						</section>

						<section className="card" id="deleteRole">
							<header className="card-header" ref={this.deleteRoleRef}>
								<h5>2.5 Delete a User Role</h5>
							</header>
							<div className="card-body">
								<ul className="alpha">
									<li>To delete a user role from UCP, click on the trash icon and the user will lose the access to the particular Resource group as that particular role forever. He/She can be reassigned another or the same resource group again following the steps mentioned above in 2.3
									</li>
									<li>There is a separate menu, User Management-&gt; AD Users List to delete a user from UCP, so that he/she loses access to UCP. This will be explained in the AAD User Onboarding Document.
										<p>Note: Until the user logs out of UCP and logs back in, his existing role will still be in effect. The user might also observe some inconsistencies in the way he operates UCP. Logging out of UCP after change in the role or deletion of role is a MUST</p>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic17.png" />
										</div>
									</li>
									<li>A confirmation pop-up appears. Once the Delete button is clicked the user role will be removed from RBAC
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic18.png" />
										</div>
									</li>
									<li>As shown below, the user has lost access to that particular resource group as Team Manager
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/RoleBasedAccessManagement/pic19.png" />
										</div>
									</li>
								</ul>
							</div>
						</section>

						<section className="card" id="glossary" style={{minHeight: "700px"}}>
							<header className="card-header" ref={this.glossaryRef}>
								<h5>3 Glossary </h5>
							</header>
							<div className="card-body">
								<h6>3.1	Definition</h6>
								<div className="table-responsive">
									<table className="table tblstatuses">
										<thead className="thead-light">
											<tr>
												<th scope="col">Terms</th>
												<th scope="col">Abbreviation</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>VM</td>
												<td>Virtual Machine</td>
											</tr>
											<tr>
												<td>UCP</td>
												<td>Universal Cloud Platform</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</section>
					</section>
				</section>
				<span id="back-to-top"><i className="fa fa-arrow-up"></i></span>
			</div>
		);
	}
};

export { RoleBasedAccessManagement as RoleBasedAccessManagement };