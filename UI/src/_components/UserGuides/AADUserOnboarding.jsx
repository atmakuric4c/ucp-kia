import React, { Component } from "react";
import { authHeader, ucpEncrypt, ucpDecrypt } from '../../_helpers';
import config from 'config';

class AADUserOnboarding extends Component {
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
		this.aadUserOnboardingRef = React.createRef();
		this.glossaryRef = React.createRef();

		this.userOnboardingRef = React.createRef();
		this.userOffboardingRef = React.createRef();
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
						<h6>AAD User Onboarding</h6>
						<ul className="sidebar-menu" id="nav-accordion">
							<li className="sub-menu">
								<span className="d-flex ugMenu introductionRef active" onClick={(e) => this.scrollToSection({ submenu: "", ref: "introductionRef" })}>
									<i className="far fa-file-alt fa-fw"></i>
									<small data-submenu="">1 Introduction to UCP AAP User Onboarding</small>
								</span>
							</li>
							<li className="sub-menu">
								<span className="d-flex ugMenu aadUserOnboardingRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "aadUserOnboardingRef" })}>
									<i className="far fa-file-alt fa-fw"></i>
									<small data-submenu="">2 What is AAD User Onboarding?</small>
								</span>
								<ul className="sub" id="aadUserOnboardingSubMenu">
									<li>
										<span className="sliding-link ugMenu userOnboardingRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "userOnboardingRef" })}><i className="far fa-circle fa-fw"></i> 2.1 User Onboarding</span>
									</li>
									<li>
										<span className="sliding-link ugMenu userOffboardingRef" onClick={(e) => this.scrollToSection({ submenu: "", ref: "userOffboardingRef" })}><i className="far fa-circle fa-fw"></i> 2.2 User Off-boarding</span>
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
								<h5>1 Introduction to UCP AAP User Onboarding</h5>
							</header>
							<div className="card-body">
								<p>Welcome to Universal Cloud Platform user guide. UCP is a multi-cloud Self-Service platform that allows users to provision Virtual Machines into Azure Environment. Along with provisioning Linux, SAP & Windows Virtual Machines, you will be able to manage them, perform 2nd Day operations, decommission, obtain or provide access to the virtual machine. </p>
								<p>UCP not only does allow to provision the virtual machine but also configures monitoring via Splunk Monitoring, configures backup via Netbackup software, on-board Linux VMs to Cyberark Platform to obtain secure access, onboard Windows VMs to Active Directory.</p>
								<p>You will be able to create Virtual machines for both Test & Production purposes.</p>
								<p>UCP creates a CMDB CI entry in Global Service Now (GSN) for every virtual machine that get provisioned.</p>
								<p>UCP also creates a Change Management ticket (RFC) for every VM that has been deployed for Production purposes only. Based on this RFC ticket, every virtual machine undergoes thorough automated and manual checks for its readiness on the day of the delivery.</p>
								<p>This document explains how to on-board a user into different two Azure Active Directories(AAD)</p>
								<p>Azure Active Directory (Azure AD) is a cloud-based identity and access management service. This service helps your employees access external resources, such as Microsoft 365, the Azure portal, and thousands of other SaaS applications. Azure Active Directory also helps them access internal resources like apps on your corporate intranet network, along with any cloud apps developed for your own organization </p>
								<p>There are only 2 active directories visible in UCP</p>
								<ul className="alpha">
									<li>UDLDHL-UCP -&gt; Those who have to obtain access to the UCP Platform</li>
									<li>UDLDHL-PVWA -&gt; Those who have to obtain access to Cyberark Platform.</li>
								</ul>
							</div>
						</section>

						<section className="card aadUserOnboarding" id="aadUserOnboarding">
							<header className="card-header" ref={this.aadUserOnboardingRef}>
								<h5>2 What is AAD User Onboarding?</h5>
							</header>
							<div className="card-body">
								<p>Azure Active Directory (AAD) user onboarding process provides users to access platforms via Azure Identity Management. In order to obtain access to UCP or Cyberark Platforms kindly follow the below mentioned steps.</p>
							</div>
						</section>
						<section className="card" id="userOnboarding">
							<header className="card-header" ref={this.userOnboardingRef}>
								<h5>2.1 User Onboarding </h5>
							</header>
							<div className="card-body">
								<ul className="alpha">
									<li>Navigate to <a href="https://ucp.dhl.com">https://ucp.dhl.com</a>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/AAD_User_Onboarding/pic1.png" />
										</div>
									</li>
									<li>Enter your DHL email id AD Credentials
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/AAD_User_Onboarding/pic2.png" />
										</div>
										The user will be landing on the dashboard as shown hereunder
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/AAD_User_Onboarding/pic3.png" />
										</div>
									</li>
									<li>Click on user management -&gt; AD Users List
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/AAD_User_Onboarding/pic4.png" />
										</div>
									</li>
									<li>The user will then be navigating to Active Directory view list page.
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/AAD_User_Onboarding/pic5.png" />
										</div>
									</li>
									<li>Selecting the relevant AD Group shows the corresponding list of users in that group
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/AAD_User_Onboarding/pic6.png" />
										</div>
									</li>
									<li>Click on New user onboarding will navigate the user to a pop-up
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/AAD_User_Onboarding/pic7.png" />
										</div>
									</li>
									<li>Enter an email id who needs to be onboarded onto the respective AD group.
										<p>Note: UCP allows only @dhl.com domain email ids to be onboarded. Entering any other email id is prohibited.</p>
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/AAD_User_Onboarding/pic8.png" />
										</div>
									</li>
									<li>Select the desired AD group and click on SUBMIT.
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/AAD_User_Onboarding/pic9.png" />
										</div>
									</li>
									<li>Once submitted the user will receive an acknowledgement email and it will take upto 60 minutes for the user to get access to the desired platform.
									</li>
								</ul>
							</div>
						</section>
						<section className="card" id="userOffboarding">
							<header className="card-header" ref={this.userOffboardingRef}>
								<h5>2.2 User Off-boarding </h5>
							</header>
							<div className="card-body">
								<p>Once a user has fulfilled his/her tasks via UCP and if he/she should not have access to UCP anymore then the user must be off-boarded from either of the active directories. Below are the steps to off-board a user from active directory.</p>
								<ul className="alpha">
									<li>Navigate to User Management -&gt; AD Users List
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/AAD_User_Onboarding/pic10.png" />
										</div>
									</li>
									<li>Click on the Trash Icon against the user whom you wish to off-board from the desired Active Directory. You will see the below alert to confirm / reject the action
									</li>
									<li>If you click on Cancel, you will be returning the previous page and the action to remove the user from Active Directory is cancelled
									</li>
									<li>If you click on "Yes, Remove user!" button, then you will receive a notification on top right of the screen and also an acknowledgement email will be sent to the user who has been removed. 
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/AAD_User_Onboarding/pic11.png" />
										</div>
									</li>
									<li>In order to view the status of user being off-boarded, kindly navigate to Deployment Information -&gt; User Onboarding -&gt; AD User Offboarding Tab
										<div className="my-4">
											<img className="img-fluid" src="/src/img/user-guides/AAD_User_Onboarding/pic12.png" />
										</div>
									</li>
									<li>The Success Message means that the user has been removed from the Active Directory that he/she was in.
									</li>
									<li>If the user has been removed from UDLDHL-UCP then the user has lost access to UCP Platform
									</li>
									<li>If the user has been removed from UDLDHL-PVWA then the user has lost access to Cyberark Platform
									</li>
								</ul>
								<p><b>Note:</b> These servers will have exactly the same base machine or SKU. This will be explained in the following steps</p>
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
											<tr>
												<td>AD</td>
												<td>Active Directory</td>
											</tr>
											<tr>
												<td>AAD</td>
												<td>Azure Active Directory</td>
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

export { AADUserOnboarding as AADUserOnboarding };