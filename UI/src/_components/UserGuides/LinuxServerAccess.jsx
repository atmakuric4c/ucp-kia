import React, { Component } from "react";
import { authHeader, ucpEncrypt, ucpDecrypt } from '../../_helpers';
import config from 'config';

class LinuxServerAccess extends Component {
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
		this.getaccessRef = React.createRef();
		this.accessServerRef = React.createRef();
		this.CyberarkLoginProcedureRef = React.createRef();
		this.glossaryRef = React.createRef();

		this.CyberarkLoginProcedureSubRef = React.createRef();
		this.CyberarkLoadBalancerRef = React.createRef();
		this.durationRef = React.createRef();
		this.RevokeAccessRef = React.createRef();
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
						<h6>Linux Server Access</h6>
						<ul className="sidebar-menu" id="nav-accordion">
							<li className="sub-menu">
								<span className="d-flex ugMenu introductionRef active" onClick={(e) => this.scrollToSection({ submenu: "", ref: "introductionRef" })}>
									<i className="far fa-file-alt fa-fw"></i>
									<small data-submenu="">1 Introduction to UCP	</small>
								</span>
							</li>
							<li className="sub-menu">
								<span className="d-flex ugMenu getaccessRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "getaccessRef" })}>
									<i className="far fa-file-alt fa-fw"></i>
									<small data-submenu="">2 How to get access to UCP?</small>
								</span>
							</li>
							<li className="sub-menu">
								<span className="d-flex ugMenu accessServerRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "accessServerRef" })}>
									<i className="far fa-file-alt fa-fw"></i>
									<small data-submenu="">3 How to Access my Server ?</small>
								</span>
							</li>
							<li className="sub-menu">
								<span className="d-flex ugMenu CyberarkLoginProcedureRef" onClick={(e) => this.scrollToSection({ submenu: "CyberarkLoginProcedureSubMenu", ref: "CyberarkLoginProcedureRef" })}>
									<i className="far fa-file-alt fa-fw"></i>
									<small data-submenu="CyberarkLoginProcedureSubMenu">4 Cyberark Login Procedure</small>
								</span>
								<ul className="sub" id="CyberarkLoginProcedureSubMenu">
									<li>
										<span className="sliding-link ugMenu CyberarkLoginProcedureSubRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "CyberarkLoginProcedureSubRef" })}><i className="far fa-circle fa-fw"></i> 4.1 Cyberark Login Procedure</span>
									</li>
									<li>
										<span className="sliding-link ugMenu CyberarkLoadBalancerRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "CyberarkLoadBalancerRef" })}><i className="far fa-circle fa-fw"></i> 4.2 Cyberark Load Balancer IPs and Next Steps</span>
									</li>
									<li>
										<span className="sliding-link ugMenu durationRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "durationRef" })}><i className="far fa-circle fa-fw"></i> 4.3 Modification of duration of access</span>
									</li>
									<li>
										<span className="sliding-link ugMenu RevokeAccessRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "RevokeAccessRef" })}><i className="far fa-circle fa-fw"></i> 4.4 Revoke Access</span>
									</li>
								</ul>
							</li>
							<li className="sub-menu">
								<span className="d-flex ugMenu glossaryRef" onClick={(e) => this.scrollToSection({ submenu: "glossarySubMenu", ref: "glossaryRef" })}>
									<i className="far fa-file-alt fa-fw"></i>
									<small>5 Glossary</small>
								</span>
								<ul className="sub" id="glossarySubMenu">
									<li>
										<span className="sliding-link ugMenu glossaryRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "glossaryRef" })}><i className="far fa-circle fa-fw"></i> 5.1 Definition</span>
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
								<h5>1 Introduction to UCP</h5>
							</header>
							<div className="card-body">
								<p>Welcome to Universal Cloud Platform user guide. UCP is a multi-cloud Self-Service platform that allows users to provision Virtual Machines into Azure Environment. Along with provisioning Linux, SAP & Windows Virtual Machines, you will be able to manage them, perform 2nd Day operations, decommission, obtain or provide access to the virtual machine. </p>
								<p>UCP not only does allow to provision the virtual machine but also configures monitoring via Splunk Monitoring, configures backup via Netbackup software, on-board Linux VMs to Cyberark Platform to obtain secure access, on-board Windows VMs to Active Directory.</p>
								<p>You will be able to create Virtual machines for both Test & Production purposes.</p>
								<p>UCP creates a CMDB CI entry in Global Service Now (GSN) for every virtual machine that get provisioned.</p>
								<p>UCP also creates a Change Management ticket (RFC) for every VM that has been deployed for Production purposes only. Based on this RFC ticket, every virtual machine undergoes thorough automated and manual checks for its readiness on the day of the delivery. </p>
								<h6 className="border-bottom pb-2 mb-2">This document emphasizes on accessing a server via Cyberark</h6>
								<ul className="alpha">
									<li>Ordering for server access via UCP</li>
									<li>Steps in Cyberark to access VM</li>
								</ul>
							</div>
						</section>
						<section className="card getaccess" id="getaccess">
							<header className="card-header" ref={this.getaccessRef}>
								<h5>2 How to get access to UCP? </h5>
							</header>
							<div className="card-body">
								<p>In order to be able to get access to UCP, the user should be part of the "UDLDHL-UCP" Active Directory Group.</p>
								<p>If you're a Team Manager for a Project, then you should request for a new project to be created in Azure via the GSD form  <a href="#">https://gsd.dhl.com/forms/4887</a></p>
								<div className="mb-4">
									<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/form1.png" />
								</div>
								<h6 className="border-bottom pb-2 mb-2">The form involves 4 steps where the SPCS Cloud Ops IaaS team will grant you the following </h6>
								<ul className="alpha">
									<li>The desired Project Name / Resource Group Name</li>
									<li>Assign you to the UDLDHL-UCP Active Directory Group</li>
									<li>Assign both Production & Test Subscriptions for the Project Name and</li>
									<li>Assign you the Team Manager role where you will be able to onboard and add other team members within your project.</li>
								</ul>
								<p><b>Note:</b> Only "@dhl.com" email ids can only be onboarded onto UCP.</p>
								<p>Once you receive a confirmation email notification that your request has been fulfilled, you will be able to login to the platform with your Active Directory credentials i.e. email-id & password provided to you at the time of creating your DHL account. You will be able to use the same credentials for accessing other platforms too. </p>
								
								<p>Step 1 - Navigate to <a href="https://ucp.dhl.com">https://ucp.dhl.com</a></p>
								<div className="mb-4">
									<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic1.png" />
								</div>
								<p>Step 1.a - Enter your DHL email id AD Credentials</p>
								<div className="mb-4">
									<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic2.png" />
								</div>
								<p>The user will be landing on the dashboard as shown hereunder</p>
								<div className="mb-4">
									<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic3.png" />
								</div>
							</div>
						</section>
						<section className="card" id="accessServer">
							<header className="card-header" ref={this.accessServerRef}>
								<h5>3. How to Access my Server ? </h5>
							</header>
							<div className="card-body">
								<p>In order to access the server that you desire, you will have to raise a request via UCP or request the Resource group manager to grant you the access. Follow the steps shown below.</p>
								<ol className="alpha">
									<li>Navigate to Manage Menu -&gt; Azure -&gt; User VM Access Requests.
										<div className="mb-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic4.png" />
										</div>
									</li>
									<li>Click on New VM Access request
										<div className="mb-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic5.png" />
										</div>
										A Pop-up screen will appear.
									</li>
									<li>Select the Subscription, Resource Group, OS Type: Linux, Account Type
										<p><b>BU Sysadmin -</b> A Business user Admin who needs temporary access to all the virtual machines in the resource Group</p>
										<p><b>BU Application Admin -</b> A Business user Admin who needs temporary access to all the virtual machines of different application types such as Apache, Tomcat, JBOSS, Weblogic and Oracle Database, within the resource Group</p>
										<p>Select the email in the "Provide Access to" Dropdown list.</p>
										<p><b>Note :</b> If an email id is not visible in the dropdown list, then please refer to "AAD User Onboarding - UCP User guide v1.0" to on-board the email id to UDLDHL-PVWA Group first. After 45-60 minutes the email id will appear in the dropdown list below.</p>
									</li>
									<li>Select the desired duration and click on "Submit"
										<div className="mb-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic6.png" />
										</div>
									</li>
									<li>The request then goes for an approval to the Resource Group Owner / Team Manager
										<div className="mb-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic7.png" />
										</div>
									</li>
									<li>Click on Approve -&gt; Proceed</li>
									<li>The requestor will receive an acknowledgement 
										<div className="mb-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic8.png" />
										</div>
										<div className="mb-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic9.png" />
										</div>
										The user who needs the access to the Virtual Machine will receive an acknowledgement email with the steps to login to the requested machine
									</li>
								</ol>
							</div>
						</section>
						<section className="card" id="CyberarkLoginProcedure">
							<header className="card-header" ref={this.CyberarkLoginProcedureRef}>
								<h5>4 Cyberark Login Procedure </h5>
							</header>
							<div className="card-body">
								<p>All the servers that are provisioned via UCP will have to be accessed only via Cyberark PAM Console Procedure. Cyberark platform allows you to login to the server in a safe & secure fashion. Follow the below mentioned steps in order to access the desired server.</p>
							</div>
						</section>
						<section className="card" id="vmdetails1">
							<header className="card-header" ref={this.CyberarkLoginProcedureSubRef}>
								<h5>4.1 Cyberark Login Procedure </h5>
							</header>
							<div className="card-body">
								<ol>
									<li>Login into DHL network (VDI/VPN) and access the below PAM URL based on Region
										<div className="table-responsive">
											<table className="table table-bordered table-striped deployment mt-2 ">
												<thead className="thead-light">
													<tr>
														<th>Region</th>
														<th>Server</th>
														<th>URL</th>
													</tr>
												</thead>
												<tbody>
													<tr>
														<td>South East Asia</td>
														<td>If the server is provisioned in South East Asia Region</td>
														<td><a href="https://pvwa-sea.dhl.com">https://pvwa-sea.dhl.com</a></td>
													</tr>
													<tr>
														<td>West Europe</td>
														<td>If the server is provisioned in West Europe Region</td>
														<td><a href="https://pvwa-weu.dhl.com">https://pvwa-weu.dhl.com</a></td>
													</tr>
													<tr>
														<td>East United States</td>
														<td>If the server is provisioned in East United States Region</td>
														<td><a href="https://pvwa-eus.dhl.com">https://pvwa-eus.dhl.com</a></td>
													</tr>
												</tbody>
											</table>
										</div>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic10.png" />
										</div>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic11.png" />
										</div>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic12.png" />
										</div>
									</li>
									<li>Click on SAML authentication for login and you will be able to login directly to CyberArk Console using your Azure AD credentials
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic13.png" />
										</div>
									</li>
									<li>Navigate (On Left Pane) to Accounts -&gt; PSM for SSH MFA Caching
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic14.png" />
										</div>
									</li>
									<li>Click on <b>Generate</b> and <b>Download PPK private key</b> from CyberArk portal (Which is valid for 60 minutes) from PSM for SSH MFA Caching window.
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic15.png" />
										</div>
									</li>
									<li>Import the private key into putty (On Putty Application left pane select Connection -&gt; SSH -&gt; Auth -&gt; Private key file for authentication)
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic16.png" />
										</div>
									</li>
									<li>Prepare the connection string and put it into the hostname. (Session -&gt; Hostname)
										<p>Connection String: &lt;CyberArkUserID&gt;%&lt;TargetAccountName&gt;%&lt;TargetServerIP&gt;@&lt;RegionSpecificPSMSSHServerLoadBalancerIP&gt;</p>
										<p>Example: keerthana.ch@dhl.com%sadminits%10.224.174.4@10.224.18.42</p>
										<p><b>CyberarkUserID :</b> keerthana.ch@dhl.com</p>
										<p><b>TargetAccountName :</b> sadminits</p>
										<p><b>TargetSeverIP :</b> 10.224.174.4</p>
										<p><b>East US PSM-SSH Load Balancer IP :</b> 10.224.18.42 (As the above server is provisioned in East US region)</p>
									</li>
								</ol>
							</div>
						</section>

						<section className="card" id="CyberarkLoadBalancer">
							<header className="card-header" ref={this.CyberarkLoadBalancerRef}>
								<h5>4.2 Cyberark Load Balancer IPs and Next Steps </h5>
							</header>
							<div className="card-body">
								<div className="table-responsive">
									<table className="table table-bordered table-striped deployment mt-2 ">
										<thead className="thead-light">
											<tr>
												<th>Load Balancer in Each Region</th>
												<th>IP Address</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>East US PSM-SSH Load Balancer IP</td>
												<td>10.224.18.42</td>
											</tr>
											<tr>
												<td>West Europe PSM-SSH Load Balancer IP</td>
												<td>10.156.9.145</td>
											</tr>
											<tr>
												<td>SEA PSM-SSH Load Balancer IP</td>
												<td>10.234.1.72</td>
											</tr>
										</tbody>
									</table>
								</div>
								<div className="my-4">
									<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic17.png" />
								</div>
								<p>Specify the reason for accessing the target server and continue accessing the server.</p>
								<div className="my-4">
									<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic18.png" />
								</div>
							</div>
						</section>

						<section className="card" id="duration">
							<header className="card-header" ref={this.durationRef}>
								<h5>4.3 Modification of duration of access </h5>
							</header>
							<div className="card-body">
								<p>If the duration of accessing the server needs to be increased or decreased beyond the approved duration, then you may request the Team Manager to extend or reduce the time limit for the server access. The following are the steps in extending the duration of the access</p>
								<ol>
									<li>Navigate to Manage -&gt; Azure -&gt; User VM Access List
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic19.png" />
										</div>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic20.png" />
										</div>
									</li>
									<li>The user can modify the duration of the by clicking on the edit button as shown below.
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic21.png" />
										</div>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic22.png" />
										</div>
										<p>Click on "Update" for the duration to be updated.</p>
										<p>The requestor will receive an acknowledgement email with the information about extended duration.</p>
									</li>
								</ol>
							</div>
						</section>

						<section className="card" id="RevokeAccess">
							<header className="card-header" ref={this.RevokeAccessRef}>
								<h5>4.4 Revoke Access </h5>
							</header>
							<div className="card-body">
								<p>The Resource group Owner can request to revoke the access of the virtual machines in the resource group at any time, so the business user is not allowed to access them at anytime.</p>
								<div className="mb-4">
									<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic23.png" />
								</div>
								<div className="mb-4">
									<img className="img-fluid" src="/src/img/user-guides/LinuxServerAccess/pic24.png" />
								</div>
								<p>Clicking on OK, will revoke the access of the servers to the business user</p>
							</div>
						</section>
						<section className="card" id="glossary" style={{minHeight: "700px"}}>
							<header className="card-header" ref={this.glossaryRef}>
								<h5>5 Glossary </h5>
							</header>
							<div className="card-body">
								<h6>5.1	Definition</h6>
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
				<span id="back-to-top" ><i className="fa fa-arrow-up"></i></span>
			</div>
		);
	}
};

export { LinuxServerAccess as LinuxServerAccess };