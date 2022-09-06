import React, { Component } from "react";
import { authHeader, ucpEncrypt, ucpDecrypt } from '../../_helpers';
import config from 'config';

class LinuxPlusOracle extends Component {
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
		this.firstoracleRef = React.createRef();
		this.myserverRef = React.createRef();
		this.glossaryRef = React.createRef();

		this.basicinfoRef = React.createRef();
		this.vmdetailsRef = React.createRef();
		this.backupgsnRef = React.createRef();
		this.orderlistRef = React.createRef();
		this.informationmenuRef = React.createRef();
		this.acknowledgementsRef = React.createRef();
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
						<h6>Linux + Oracle</h6>
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
								<span className="d-flex ugMenu firstoracleRef" onClick={(e) => this.scrollToSection({ submenu: "firstlinuxSubMenu", ref: "firstoracleRef" })}>
									<i className="far fa-file-alt fa-fw"></i>
									<small data-submenu="firstlinuxSubMenu">3 How do I deploy my first Linux Oracle Machine?</small>
								</span>
								<ul className="sub" id="firstlinuxSubMenu">
									<li>
										<span className="sliding-link ugMenu basicinfoRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "basicinfoRef" })}><i className="far fa-circle fa-fw"></i> 3.1 Basic Info tab</span>
									</li>
									<li>
										<span className="sliding-link ugMenu vmdetailsRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "vmdetailsRef" })}><i className="far fa-circle fa-fw"></i> 3.2 VM Details Tab</span>
									</li>
									<li>
										<span className="sliding-link ugMenu backupgsnRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "backupgsnRef" })}><i className="far fa-circle fa-fw"></i> 3.3 Backup & GSN Tab</span>
									</li>
									<li>
										<span className="sliding-link ugMenu orderlistRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "orderlistRef" })}><i className="far fa-circle fa-fw"></i> 3.4 Order List Menu</span>
									</li>
									<li>
										<span className="sliding-link ugMenu informationmenuRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "informationmenuRef" })}><i className="far fa-circle fa-fw"></i> 3.5 Deployment Information Menu</span>
									</li>
									<li>
										<span className="sliding-link ugMenu acknowledgementsRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "acknowledgementsRef" })}><i className="far fa-circle fa-fw"></i> 3.6 Email Acknowledgements</span>
									</li>
								</ul>
							</li>
							<li className="sub-menu">
								<span className="d-flex ugMenu myserverRef" onClick={(e) => this.scrollToSection({ submenu: "myserverSubMenu", ref: "myserverRef" })}>
									<i className="far fa-file-alt fa-fw"></i>
									<small>4 Where is MY Server?</small>
								</span>
								<ul className="sub" id="myserverSubMenu">
									<li>
										<span className="sliding-link ugMenu myserverRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "myserverRef" })}><i className="far fa-circle fa-fw"></i> 4.1 VM List Menu</span>
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
								<h6 className="border-bottom pb-2 mb-2">This document helps users to provision different types of Linux Machines, namely the following</h6>
								<ul className="alpha">
									<li>Linux + Oracle Images</li>
								</ul>
								<h6 className="border-bottom pb-2 mb-2">In addition, this document also emphasizes various features such as</h6>
								<ul className="alpha">
									<li>Mount-points</li>
									<li>Additional Disk requests while raising a service order</li>
									<li>Provisioning in desired zones</li>
									<li>Provisioning with desired availability sets</li>
									<li>Cloning of Machines</li>
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
									<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/form1.png" />
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
							</div>
						</section>
						<section className="card" id="firstlinux">
							<header className="card-header" ref={this.firstoracleRef}>
								<h5>3. How do I deploy my first Oracle machine? </h5>
							</header>
							<div className="card-body">
								<p>Once the access to UCP is granted via GSD Form, you will be able to login to UCP by navigating to  <a href="#">https://ucp.dhl.com</a></p>
								<div className="mb-4">
									<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture1.png" />
								</div>
								<p>Click on Login and enter your credentials</p>
								<div className="mb-4">
									<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture2.png" />
								</div>
								<p>You will be landing on the dashboard as shown hereunder. The dashboard shows a list of Virtual Machines that you have configured and related details.</p>
								<div className="mb-4">
									<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture3.png" />
								</div>
								<p>In order to provision your first machine or Service Order, Clicking on Order -&gt; New VM Instance -&gt; Azure</p>
								<div className="mb-4">
									<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture3.png" />
								</div>
								<p>The service Order Page appears as below</p>
							</div>
						</section>
						<section className="card" id="basicinfo">
							<header className="card-header" ref={this.basicinfoRef}>
								<h5>3.1 Basic Info tab </h5>
							</header>
							<div className="card-body">
								<p>In the Basic Info Page, you will be able to select the purpose of the virtual machine, region, type of the machine, etc. Based on these details the desired virtual machine gets provisioned and delivered to you. Please follow the instructions, given below to configure your machine. </p>
								<h6 className="border-bottom pb-2 mb-2">Please select one of the following details </h6>
								<ul className="alpha">
									<li>Servers being provisioned for <strong><u>Production</u></strong> purpose, please select <u>ITS-SPCS-Azure-Managed-VM-PROD-122</u></li>
									<li>Servers being provisioned for <strong><u>Test</u></strong> purpose, please select <u>ITS-SPCS-Azure-Managed-VM-TEST-123</u>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture5.png" />
										</div>
									</li>
									<li>VM Resource group automatically populates to the one that you're assigned to.</li>
									<li>If you're assigned to more than one Resource Group, you may click on the drop-down list to view and select the relevant Resource Group.</li>
									<li>The Gallery Name is automatically set to sig_dhl_iaas_images. This cannot be modified. Gallery is the repository for the OS Templates which are used to provision the servers.</li>
									<li>Servers can be provisioned based on two types of Operating Systems
										<ul className="alpha">
											<li>Linux</li>
											<li>Windows</li>
										</ul>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture6.png" />
										</div>
									</li>
									<li>Selecting Linux Will show the Add-Ons as below.
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture7.png" />
										</div>
									</li>
									<li>By Selecting Linux + Oracle option, the following images will appear.
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture8.png" />
										</div>
									</li>
									<li>After selecting the desired image the latest version of the image will appear automatically.
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture9.png" />
										</div>
									</li>
									<li><b>There are two types of Environments</b>
										<ul className="alpha">
											<li><b>PRODUCTION - </b> Purpose of the server is for a Production instance. This option is automatically selected when ITS-SPCS-Azure-Managed-VM-PROD-122 is selected for provision purpose.</li>
											<li><b>TEST - </b> Purpose of the server is for a Test instance. This option is automatically selected when ITS-SPCS-Azure-Managed-VM-TEST-123 is selected for provision purpose.</li>
										</ul>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture10.png" />
										</div>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture11.png" />
										</div>
									</li>
									<li><strong> Identity Selection. There are two types of Network identity option.</strong>
										<ul className="alpha">
											<li><b>Classified : </b> Any external server will be able to access this server, via internet, that you have provisioned with Classified Network setting. </li>
											<li><b>Unclassified : </b> Purpose of the server is for a Test instance. This option is automatically selected when ITS-SPCS-Azure-Managed-VM-TEST-123 is selected for provision purpose.Any external server will be not be able to access this server, via internet, that you have provisioned with Classified Network setting.</li>
										</ul>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture12.png" />
										</div>
									</li>
									<li>Network Resource Group is set to Default always.
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture13.png" />
										</div>
									</li>
									<li>Please select the desired Region. The selected region is the datacenter where the requested server will be provisioned.
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture14.png" />
										</div>
									</li>
									<li><b>Based on the region selected, the corresponding Virtual Network is automatically selected along with the subnet.</b>
										<ul className="alpha">
											<li>For Linux Machines with Classified Network setting, the subnet assigned, by default, is Classified-Subnet-1.</li>
											<li>For Linux Machines with Unclassified Network Setting, the subnet assigned, by default, is Unclassified-Subnet-1. </li>
										</ul>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture15.png" />
										</div>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture16.png" />
										</div>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture17.png" />
										</div>
									</li>
									<li><b>Select the number of servers that need to be provisioned in a single order.</b>
										<ul className="alpha">
											<li>At a time, a maximum of 10 similar servers can be ordered & provisioned.</li>
											<li><b>Note:</b> These servers will have exactly the same base machine or SKU. This will be explained in the following steps </li>
										</ul>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture18.png" />
										</div>
									</li>
									<li>Cluster option will be explained in the user guide for Cluster Servers.</li>
									<li><b>For every order either an Availability Zone / Availability Set / None option can be selected.</b>
										<ul className="alpha">
											<li><b>Availability Zone:</b> Azure regions and availability zones are physically separate locations within each Azure region that are tolerant to datacenter failures because of redundant infrastructure and logical isolation of Azure services. There are 3 zones numbered 1/2/3 available in UCP to provision servers.
												<div className="my-4">
													<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture19.png" />
												</div>
											</li>
											<li><b>Availability Set:</b> An availability set is a logical grouping of VMs that allows Azure to understand how your application is built to provide for redundancy and availability. We recommended that two or more VMs are created within an availability set to provide for a highly available application and to meet the 99.95% Azure SLA
												<div className="my-4">
													<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture20.png" />
												</div>
											</li>
											<li><b>Create Availability Set:</b> Availability Set Name will be listing out the Sets that are already configured in the Subscription. If there are no availability sets and if you wish to create one, then the "Create New" button will allow you to create a New Availability set.
												<div className="my-4">
													<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture21.png" />
												</div>
												<div className="my-4">
													<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture22.png" />
												</div>
												<div className="my-4">
													<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture23.png" />
												</div>
											</li>
										</ul>
									</li>
									<li>After selected all the relevant options please click on Next on the bottom Right of the screen.
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture24.png" />
										</div>
									</li>
								</ul>
							</div>
						</section>
						<section className="card" id="vmdetails1">
							<header className="card-header" ref={this.vmdetailsRef}>
								<h5>3.2 VM Details Tab </h5>
							</header>
							<div className="card-body">
								<div className="my-4">
									<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture25.png" />
								</div>
								<ul className="alpha">
									<li>Select the desired server size by clicking on "Select VM Size" which will then show the list of VM sizes available for the relevant image.
										<ul className="alpha">
											<li><b>Note:</b> For each image of Linux & Windows only the supported list of VM SKUs will appear for selection.
												<div className="my-4">
													<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture26.png" />
												</div>
											</li>
										</ul>
									</li>
									<li>Select the desired VM size and click on the SAVE button. </li>
									<li>You may also be able to change the server size by clicking on "Change VM Size" button and re-selecting another SKU.</li>
									<li>The list of SKUs(VM Sizes) that are displayed here are based on the OS Image template.</li>
									<li>User can select the desired Operating System Storage Type from the list shown below.
										<ul className="alpha">
											<li><b>Standard SSD_LRS :</b> This type of OS Disk is a Solid State Drive which is Locally Redundant Storage</li>
											<li><b>Standard_LRS :</b> This type of OS Disk is a Hard Disk Drive which is Locally Redundant Storage</li>
										</ul>
										<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture27.png" />
									</li>
									<li>The Network details & NIC information are automatically populated and cannot be modified.</li>
									<li>However, a relevant zone can be selected based on previous selection in Step-3.p
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture28.png" />
										</div>
									</li>
									<li>You should then add the following details.
										<ul className="alpha">
											<li>DB Name - Name of the database</li>
											<li>DB Username - Custom username for the database</li>
											<li>DB Password - Custom password for the database</li>
											<li>DB Character set - Custom Character set for the database
												<div className="my-4">
													<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture29.png" />
												</div>
											</li>
										</ul>
									</li>
									<li>Disk Storage SKU1 dropdown option will provide the list of supported disk types along with the size of the disk. Either Standard or Standard_SSD
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture30.png" />
										</div>
									</li>
									<li>After selecting relevant disk type & size, Disk Host caching can be selected based on the options available
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture31.png" />
										</div>
										<b>Note:</b> The Effective database disk size available will be between <b>17.9% to 69.5%</b>
									</li>
									<li>After configuring the desired option, click next on the bottom right to select Backup related information and Global Service Now Details for Business purposes
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture32.png" />
										</div>
									</li>
									<li>Or Click on Back to go to the previous page for changes in Basic Information</li>
								</ul>
							</div>
						</section>

						<section className="card" id="backupgsn">
							<header className="card-header" ref={this.backupgsnRef}>
								<h5>3.3 Backup & GSN Tab </h5>
							</header>
							<div className="card-body">
								<ul className="alpha">
									<li>The Backup options are automatically selected based on the Type of server that is selected to Provisioned.
										<ul className="alpha">
											<li>There are two types of Backup Policies</li>
											<li>
												<ol className="alpha">
													<li><b>GOLD -</b> Gold Policy is applied by default for every server that is built for Production Purposes</li>
													<li><b>BRONZE -</b> Bronze Policy is applied by default for every server that s built for Testing Purposes.</li>
													<li>The Backup Policy details are mentioned in the FAQ section.</li>
													<div className="my-4">
														<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture35.png" />
													</div>
													<div className="my-4">
														<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture36.png" />
													</div>
												</ol>
											</li>
										</ul>
									</li>

									<li>For Global Service Now Business details the Following options can be selected

										<ol className="roman">
											<li>IMPACT
												<div className="my-4">
													<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture37.png" />
												</div>
											</li>
											<li>Impacted BUSINESS UNIT

												<div className="my-4">
													<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture38.png" />
												</div>
											</li>
											<li>Impacted COUNTRY
												<div className="my-4">
													<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture39.png" />
												</div>
											</li>

											<li>Impacted region is automatically selected based on the Impacted Country.
												<ol>
													<li><b>Note:</b> Multiple Countries & Regions can be selected based on the business requirements.</li>
													<li><b>Note:</b> Selecting multiple Countries will auto select regions and vice-versa.</li>
													<div className="my-4">
														<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture40.png" />
													</div>
												</ol>

											</li>
											<li>Impacted service can be selected based on the list of 4000+ services available
												<div className="my-4">
													<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture41.png" />
												</div>
											</li>
											<li>After having selected all the relevant information click on the "Add to Cart" button to place the order for the service.

											</li>
										</ol>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture42.png" />
										</div>
									</li>

								</ul>


							</div>
						</section>

						<section className="card" id="orderlist">
							<header className="card-header" ref={this.orderlistRef}>
								<h5>3.4 Order List Menu </h5>
							</header>
							<div className="card-body">
								<h6>You will be navigated to Order List screen for approving the provisioning.</h6>

								<p><b>Note:</b> If the user requesting for the server is a Team Member then the Team Manager (Resource Group Owner) alone can approve or reject the Order request. </p>
								<p><b>Note:</b> If the Team Manager (Resource group Owner) him/her-self is raising the Service Order request then the order can be Approved/Rejected by him/her-self.</p>
								<p>After approving the request the Resource Group Owner/ Team Manager should click on Submit to Order the server for Provisioning.</p>
								<p><b>Note:</b> Until the Submit button is clicked, the Order will not be sent for Provisioning.</p>
								<div className="my-4">
									<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture43.png" />
								</div>

								<p>After clicking on Submit Button the preview of the Order is visible in the next screen.</p>
								<div className="my-4">
									<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture44.png" />
								</div>
								<p>The Team Manager or Resource Group Owner only can click on Proceed to Provisioning button to order the server.</p>
								<div className="my-4">
									<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture45.png" />
								</div>
								<p>Once the desired server is sent to provisioning the following acknowledgement screen will appear, along with an acknowledgement email.</p>

								<div className="my-4">
									<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture46.png" />
								</div>
								<div className="my-4">
									<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture47.png" />
								</div>

							</div>
						</section>

						<section className="card" id="informationmenu">
							<header className="card-header" ref={this.informationmenuRef}>
								<h5>3.5 Deployment Information Menu </h5>
							</header>
							<div className="card-body">
								<h6 className="pb-3">To Check for Provisioning Status Navigate to Order <span className="text-primary">-&gt;</span> <span className="text-danger">Deployment Information.</span></h6>
								<div className="mb-4">
									<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture48.png" />
								</div>

								<ul className="alpha">
									<li>There are several tabs to check for the status of activities performed in UCP. The table mentioned hereunder outlines all the activities.
										<div className="table-responsive">
											<table className="table table-bordered table-striped deployment mt-2 ">
												<thead className="thead-light">
													<tr>
														<th>Sl.No</th>
														<th>Main Tab</th>
														<th>Sub-Tab</th>
														<th>Activity</th>
													</tr>
												</thead>
												<tbody>
													<tr>
														<th>1</th>
														<td rowSpan="7" className="text-danger font-weight-bold">Linux Provisioning</td>
														<td>IAAS Linux</td>
														<td>
															<ol className="tbroman">
																<li>Plain Linux Machines with Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>2</th>
														<td>IAAS Linux DB</td>
														<td>
															<ol className="tbroman">
																<li>Oracle Machines with Additional Disk</li>
																<li>TOMCAT Machines with Additional Disk</li>
																<li>APACHE Machines with Additional Disk</li>
																<li>JBOSS Machines with Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>3</th>
														<td>Linux WebLogic</td>
														<td>
															<ol className="tbroman">
																<li>WebLogic Machines with Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>4</th>
														<td>IAAS Linux Cluster</td>
														<td>
															<ol className="tbroman">
																<li>SAP Veritas Clusters with Additional Disk</li>
																<li>SAP Veritas Clusters with Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>5</th>
														<td>IAAS Linux Without Disk</td>
														<td>
															<ol className="tbroman">
																<li>Plain Linux Machines without Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>6</th>
														<td>IAAS Linux DB Without Disk</td>
														<td>
															<ol className="tbroman">
																<li>Oracle Machines without Additional Disk</li>
																<li>TOMCAT Machines without Additional Disk</li>
																<li>APACHE Machines without Additional Disk</li>
																<li>JBOSS Machines without Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>7</th>
														<td>IAAS Linux Cluster Without Disk</td>
														<td>
															<ol className="tbroman">
																<li>SAP Veritas Clusters without Additional Disk</li>
																<li>Veritas Clusters without Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>8</th>
														<td rowSpan="4" className="text-danger font-weight-bold">Windows Provisioning</td>
														<td>IAAS Windows</td>
														<td>
															<ol className="tbroman">
																<li>Plain Windows with Additional Disk</li>
																<li>Windows IIS with Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>9</th>
														<td>IAAS Windows DB</td>
														<td>
															<ol className="tbroman">
																<li>Windows MSSQL with Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>10</th>
														<td>IAAS Windows without Disk</td>
														<td>
															<ol className="tbroman">
																<li>Plain Windows without Additional Disk</li>
																<li>Windows IIS without Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>11</th>
														<td>IAAS Windows DB without Disk</td>
														<td>
															<ol className="tbroman">
																<li>Windows MSSQL without Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>12</th>
														<td rowSpan="7" className="text-danger font-weight-bold">Linux Decommissioning</td>
														<td>IAAS Linux Decommissioning</td>
														<td>
															<ol className="tbroman">
																<li>Plain Linux Machines with Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>13</th>
														<td>IAAS Linux DB Decommissioning</td>
														<td>
															<ol className="tbroman">
																<li>Oracle Machines with Additional Disk</li>
																<li>TOMCAT Machines with Additional Disk</li>
																<li>APACHE Machines with Additional Disk</li>
																<li>JBOSS Machines with Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>14</th>
														<td>Linux WebLogic Decommissioning</td>
														<td>
															<ol className="tbroman">
																<li>WebLogic Machines with Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>15</th>
														<td>IAAS Linux Cluster Decommissioning</td>
														<td>
															<ol className="tbroman">
																<li>SAP Veritas Clusters with Additional Disk</li>
																<li>Veritas Clusters with Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>16</th>
														<td>IAAS Linux Without Disk Decommissioning</td>
														<td>
															<ol className="tbroman">
																<li>Plain Linux Machines without Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>17</th>
														<td>IAAS Linux DB Without Disk Decommissioning</td>
														<td>
															<ol className="tbroman">
																<li>Oracle Machines without Additional Disk</li>
																<li>TOMCAT Machines without Additional Disk</li>
																<li>APACHE Machines without Additional Disk</li>
																<li>JBOSS Machines without Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>18</th>
														<td>IAAS Linux Cluster Without Disk Decommissioning</td>
														<td>
															<ol className="tbroman">
																<li>SAP Veritas Clusters without Additional Disk</li>
																<li>Veritas Clusters without Additional Disk</li>
															</ol>
														</td>
													</tr>

													<tr>
														<th>19</th>
														<td rowSpan="4" className="text-danger font-weight-bold">Windows Decommissioning</td>
														<td>IAAS Windows Decommissioning</td>
														<td>
															<ol className="tbroman">
																<li>Plain Windows with Additional Disk</li>
																<li>Windows IIS with Additional Disk</li>
															</ol>
														</td>
													</tr>

													<tr>
														<th>20</th>
														<td>IAAS Windows DB Decommissioning</td>
														<td>
															<ol className="tbroman">
																<li>Windows MSSQL with Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>21</th>
														<td>IAAS Windows without Disk Decommissioning</td>
														<td>
															<ol className="tbroman">
																<li>Plain Windows without Additional Disk</li>
																<li>Windows IIS without Additional Disk</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>22</th>
														<td>IAAS Windows DB without Disk Decommissioning</td>
														<td>
															<ol className="tbroman">
																<li>Windows MSSQL without Additional Disk</li>
															</ol>
														</td>
													</tr>

													<tr>
														<th>23</th>
														<td rowSpan="5" className="text-danger font-weight-bold">User On-boarding</td>
														<td>Windows User On-boarding</td>
														<td>
															<ol className="tbroman">
																<b>Onboard a user to a Windows Plain or IIS machine as either</b>
																<li>Administrator or</li>
																<li>Remote Desktop User</li>
															</ol>
														</td>
													</tr>

													<tr>
														<th>24</th>
														<td>Windows User Off-boarding</td>
														<td>
															<ol className="tbroman">
																<b>Offboard a user from a Windows Plain or IIS Machine either as</b>
																<li>Administrator or</li>
																<li>Remote Desktop User</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>25</th>
														<td>Windows SQL user On-boarding</td>
														<td>
															<ol className="tbroman">
																<b>Onboard a Database user onto MSSQL DB as</b>
																<p className="mb-0 pt-2 font-weight-bold">a. <u>User Account</u></p>
																<li>MSSQL Reader</li>
																<li>MSSQL DataReader</li>
																<li>MSSQL DataWriter</li>
																<li>MSSQL AgentReader</li>
																<li>MSSQL DBSSISAdmin</li>
															</ol>
														</td>
													</tr>

													<tr>
														<th>26</th>
														<td>AD User Onboarding (Active Directory)</td>
														<td>
															<ol className="tbroman">
																<b>Onboard a <a href="#">abc@dhl.com</a> email id user to</b>
																<li>UDLDHL-UCP (UCP Access)</li>
																<li>UDLDHL-PVWA (Cyberark Platform Acces)</li>
															</ol>
														</td>
													</tr>

													<tr>
														<th>27</th>
														<td>AD User Off-boarding (Active Directory)</td>
														<td>
															<ol className="tbroman">
																<b>Offboard a <a href="#">abc@dhl.com</a> email id user to</b>
																<li>UDLDHL-UCP (UCP Access)</li>
																<li>UDLDHL-PVWA (Cyberark Platform Acces)</li>
															</ol>
														</td>
													</tr>

													<tr>
														<th>28</th>
														<td rowSpan="10" className="text-danger font-weight-bold">Other Jobs</td>
														<td>Windows SQL Service Account Onboarding</td>
														<td>
															<ol className="tbroman">
																<b>Onboard a user to a Windows Plain or IIS machine as either</b>
																<p className="mb-0 pt-2 font-weight-bold">a. <u>Service Account</u></p>
																<li>MSSQL DBOwner</li>
																<li>MSSQL SysAdmin</li>
																<li>MSSQL AgentReader</li>
																<li>MSSQL DBSSISAdmin</li>
															</ol>
														</td>
													</tr>

													<tr>
														<th>29</th>
														<td>IAAS Windows OAT Rerun</td>
														<td>Status of OAT Checklist Re-Run for Windows Plain & IIS Machines</td>
													</tr>

													<tr>
														<th>30</th>
														<td>IAAS Linux OAT Rerun</td>
														<td>Status of OAT Checklist Re-Run for any Plain Linux Machine</td>
													</tr>

													<tr>
														<th>31</th>
														<td>IAAS-Linux DB OAT Rerun</td>
														<td>
															<ol className="tbroman">
																<b>Status of OAT Checklist Re-Run for all</b>
																<li>Oracle Machines</li>
																<li>Tomcat Machines</li>
																<li>Apache Machines</li>
																<li>JBOSS Machines</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>32</th>
														<td>IAAS-Linux Weblogic OAT Rerun</td>
														<td>
															<ol className="tbroman">
																<b>Status of OAT Checklist Re-Run for all</b>
																<li>Weblogic Machines</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>33</th>
														<td>IAAS-Linux Cluster OAT Re-Run</td>
														<td>
															<ol className="tbroman">
																<b>Status of OAT Checklist Re-Run for all</b>
																<li>SAP Veritas Cluster Machines</li>
																<li>Veritas Cluster Machines</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>34</th>
														<td>IAAS-Windows SQL OAT Re-Run</td>
														<td>
															<ol className="tbroman">
																<b>Status of OAT Checklist Re-Run for all</b>
																<li>MSSQL Machines</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>35</th>
														<td>IAAS Linux DB Add Disk</td>
														<td>
															<ol className="tbroman">
																<b>Provisioning of Additional Disk for <u>already provisioned</u></b>
																<li>Oracle Machines</li>
																<li>Tomcat Machines</li>
																<li>Apache Machines</li>
																<li>JBOSS Machines</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>36</th>
														<td>IAAS Linux Weblogic Add Disk</td>
														<td>
															<ol className="tbroman">
																<b>Provisioning of Additional Disk for <u>already provisioned</u></b>
																<li>Weblogic Machines</li>
															</ol>
														</td>
													</tr>
													<tr>
														<th>37</th>
														<td>IAAS Windows DB Add Disk</td>
														<td>
															<ol className="tbroman">
																<b>Provisioning of Additional Disk for <u>already provisioned</u></b>
																<li>MSSQL Machines</li>
															</ol>
														</td>
													</tr>
												</tbody>


											</table>
										</div>
									</li>


									<li className="mt-3 pt-2"><strong>Status of <span className="text-primary">Provisioning -</span>  There are 3 Statuses</strong>

										<div className="table-responsive pt-2">
											<table className="table table-bordered tblstatuses">
												<tbody>
													<tr>
														<th width="20%">Provisioning</th>
														<td width="20%" className="text-warning font-weight-bold">IN-PROGRESS</td>
														<td>Provisioning of a server is In-Progress</td>
													</tr>
													<tr>
														<td> </td>
														<td className="text-success font-weight-bold">SUCCESS</td>
														<td>Provisioning of a server is Successful</td>
													</tr>
													<tr>
														<td> </td>
														<td className="text-danger font-weight-bold">FAILURE</td>
														<td>Provisioning of a server has Failed</td>
													</tr>
												</tbody>
											</table>
										</div>
									</li>

									<li className="mt-3 pt-2"><strong>Status of <span className="text-primary">Resizing -</span>  There are 3 Statuses</strong>

										<div className="table-responsive pt-2">
											<table className="table table-bordered tblstatuses">
												<tbody>
													<tr>
														<th width="20%">Resizing</th>
														<td width="20%" className="text-warning font-weight-bold">IN-PROGRESS</td>
														<td>Resizing of a server is In-Progress</td>
													</tr>
													<tr>
														<td> </td>
														<td className="text-success font-weight-bold">SUCCESS</td>
														<td>Resizing of a server is Successful</td>
													</tr>
													<tr>
														<td> </td>
														<td className="text-danger font-weight-bold">FAILURE</td>
														<td>Resizing of a server has Failed</td>
													</tr>
												</tbody>
											</table>
										</div>
									</li>

									<li className="mt-3 pt-2"><strong>Status of <span className="text-primary">Decommissioning -</span>  There are 3 Statuses</strong>
										<div className="table-responsive pt-2">
											<table className="table table-bordered tblstatuses">
												<tbody>
													<tr>
														<th width="20%">Decommissioning</th>
														<td width="20%" className="text-warning font-weight-bold">IN-PROGRESS</td>
														<td>Decommissioning of a server is In-Progress</td>
													</tr>
													<tr>
														<td> </td>
														<td className="text-success font-weight-bold">SUCCESS</td>
														<td>Decommissioning of a server is Successful</td>
													</tr>
													<tr>
														<td> </td>
														<td className="text-danger font-weight-bold">FAILURE</td>
														<td>Decommissioning of a server has Failed</td>
													</tr>
												</tbody>
											</table>
										</div>
									</li>


								</ul>



							</div>
						</section>

						<section className="card" id="acknowledgements">
							<header className="card-header" ref={this.acknowledgementsRef}>
								<h5>3.6 Email Acknowledgements </h5>
							</header>
							<div className="card-body">
								<h6>If you are ordering for a new service, you will receive the following Acknowledgement emails</h6>
								<ol className="alpha">
									<li>Service Order Raising Request.</li>
									<li>Server Order Pending for Approval Email.</li>
									<li><b className="text-primary">Approval Email -</b> Stating that your server is being provisioned.</li>
									<li><b className="text-danger">Rejection Email -</b> Your service order has been rejected.</li>
									<li><b className="text-success">Success Email -</b> You server has been provisioned successfully.</li>
									<li><b className="text-info">Failure Email -</b> Your server has failed to provision.</li>
								</ol>



							</div>
						</section>

						<section className="card" id="myserver">
							<header className="card-header" ref={this.myserverRef}>
								<h5>4 Where is MY Server? </h5>
							</header>
							<div className="card-body">
								<h6>4.1	VM List Menu</h6>
								<p>The VM List menu depicts the list of servers provisioned within the resource groups you have been assigned to. In order to view the list of successfully provisioned servers you should navigate to <b>Manage -&gt; Azure -&gt; VM List</b></p>
								<div className="my-4">
									<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture49.png" />
								</div>

								<ul className="alpha">
									<li>S
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture50.png" />
										</div>
									</li>

									<li>Click on VM Details Button to view the details of the server that has been provisioned.
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture51.png" />
										</div>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/Linux+Oracle/picture52.png" />
										</div>
									</li>
								</ul>
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

export { LinuxPlusOracle as LinuxPlusOracle };