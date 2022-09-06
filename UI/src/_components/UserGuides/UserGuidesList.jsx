import React, {Component} from "react";

export default class UserGuidesList extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="container" className="container UserGuidesListDiv" style={{display:"block"}}>
		      	<h5 className="color sub-heading py-2">
		          User Guides
		        </h5>
		        <div className="row">
			        <div className="col-md-4">
			          <div className="doclist-content">
			             <div className="header d-flex">
			                 <div className="icon">D</div>
			                 <div className="doctitle">
			                     <h5 className="mb-0 pt-2">AAD User Onboarding</h5> 
			                 </div>
			             </div>
			             <ul className="list-group list-group-flush">
				               <li className="list-group-item">
				                 <i className="fa fa-file-o" aria-hidden="true"></i>
				                <a className="sliding-link2" href="/#/AADUserOnboarding?ref=introductionRef">Introduction to UCP AAD User Onboarding</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/AADUserOnboarding?ref=aadUserOnboardingRef">What is AAD User Onboarding?</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/AADUserOnboarding?ref=glossaryRef">Glossary</a>
				               </li>
				           </ul>
				           <a href="/#/AADUserOnboarding" className="read_more">Learn More <i className="fa fa-arrow-right" aria-hidden="true"></i></a>
			         </div>
			       </div>
			        <div className="col-md-4">
				        <div className="doclist-content">
				           <div className="header d-flex">
				               <div className="icon">D</div>
				               <div className="doctitle">
				                   <h5 className="mb-0 pt-2">Linux & Linux + MiddleWare</h5> 
				               </div>
				           </div>
				           <ul className="list-group list-group-flush">
				               <li className="list-group-item">
				                 <i className="fa fa-file-o" aria-hidden="true"></i>
				                <a className="sliding-link2" href="/#/LinuxAndLinuxPlusMiddleWare?ref=introductionRef">Introduction to UCP AAP User Onboarding</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/LinuxAndLinuxPlusMiddleWare?ref=getaccessRef">What is AAD User Onboarding?</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/LinuxAndLinuxPlusMiddleWare?ref=firstlinuxRef">How do I deploy my first Linux OS Machine?</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/LinuxAndLinuxPlusMiddleWare?ref=myserverRef">Where is MY Server?</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/LinuxAndLinuxPlusMiddleWare?ref=glossaryRef">Glossary</a>
				               </li>
				           </ul>
				           <a href="/#/LinuxAndLinuxPlusMiddleWare" className="read_more">Learn More <i className="fa fa-arrow-right" aria-hidden="true"></i></a>
				       </div>
				    </div>
			        <div className="col-md-4">
				        <div className="doclist-content">
				           <div className="header d-flex">
				               <div className="icon">D</div>
				               <div className="doctitle">
				                   <h5 className="mb-0 pt-2">Linux + Oracle</h5> 
				               </div>
				           </div>
				           <ul className="list-group list-group-flush">
				               <li className="list-group-item">
				                 <i className="fa fa-file-o" aria-hidden="true"></i>
				                <a className="sliding-link2" href="/#/LinuxPlusOracle?ref=introductionRef">Introduction to UCP AAP User Onboarding</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/LinuxPlusOracle?ref=getaccessRef">How to get access to UCP?</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/LinuxPlusOracle?ref=firstoracleRef">How do I deploy my first Oracle machine?</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/LinuxPlusOracle?ref=myserverRef">Where is MY Server?</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/LinuxPlusOracle?ref=glossaryRef">Glossary</a>
				               </li>
				           </ul>
				           <a href="/#/LinuxPlusOracle" className="read_more">Learn More <i className="fa fa-arrow-right" aria-hidden="true"></i></a>
				       </div>
				    </div>
					
			        <div className="col-md-4">
				        <div className="doclist-content">
				           <div className="header d-flex">
				               <div className="icon">D</div>
				               <div className="doctitle">
				                   <h5 className="mb-0 pt-2">Linux Server Access</h5> 
				               </div>
				           </div>
				           <ul className="list-group list-group-flush">
				               <li className="list-group-item">
				                 <i className="fa fa-file-o" aria-hidden="true"></i>
				                <a className="sliding-link2" href="/#/LinuxServerAccess?ref=introductionRef">Introduction to UCP AAP User Onboarding</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/LinuxServerAccess?ref=getaccessRef">How to get access to UCP?</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/LinuxServerAccess?ref=accessServerRef">How to Access my Server ?</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/LinuxServerAccess?ref=CyberarkLoginProcedureRef">Cyberark Login Procedure</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/LinuxServerAccess?ref=glossaryRef">Glossary</a>
				               </li>
				           </ul>
				           <a href="/#/LinuxServerAccess" className="read_more">Learn More <i className="fa fa-arrow-right" aria-hidden="true"></i></a>
				       </div>
				    </div>

					<div className="col-md-4">
				        <div className="doclist-content">
				           <div className="header d-flex">
				               <div className="icon">D</div>
				               <div className="doctitle">
				                   <h5 className="mb-0 pt-2">Linux + Weblogic</h5> 
				               </div>
				           </div>
				           <ul className="list-group list-group-flush">
				               <li className="list-group-item">
				                 <i className="fa fa-file-o" aria-hidden="true"></i>
				                <a className="sliding-link2" href="/#/LinuxWeblogic?ref=introductionRef">Introduction to UCP AAP User Onboarding</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/LinuxWeblogic?ref=getaccessRef">How to get access to UCP?</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/LinuxWeblogic?ref=firstlinuxRef">How do I deploy my first machine?</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/LinuxWeblogic?ref=CyberarkLoginProcedureRef">Cyberark Login Procedure</a>
				               </li>
				               <li className="list-group-item">
				                   <i className="fa fa-file-o" aria-hidden="true"></i>
				                   <a className="sliding-link2" href="/#/LinuxWeblogic?ref=glossaryRef">Glossary</a>
				               </li>
				           </ul>
				           <a href="/#/LinuxWeblogic" className="read_more">Learn More <i className="fa fa-arrow-right" aria-hidden="true"></i></a>
				       </div>
				    </div>

					<div className="col-md-4">
						<div className="doclist-content">
						<div className="header d-flex">
							<div className="icon">D</div>
							<div className="doctitle">
								<h5 className="mb-0 pt-2">Role Based Access Management</h5> 
							</div>
						</div>
						<ul className="list-group list-group-flush">
							<li className="list-group-item">
								<i className="fa fa-file-o" aria-hidden="true"></i>
								<a className="sliding-link2" href="/#/RoleBasedAccessManagement?ref=introductionRef">Introduction to UCP RBAC User Access Management</a>
							</li>
							<li className="list-group-item">
								<i className="fa fa-file-o" aria-hidden="true"></i>
								<a className="sliding-link2" href="/#/RoleBasedAccessManagement?ref=myResourceGroupRef">How Can I assign a Team Member to my Resource Group?</a>
							</li>
							<li className="list-group-item">
								<i className="fa fa-file-o" aria-hidden="true"></i>
								<a className="sliding-link2" href="/#/RoleBasedAccessManagement?ref=glossaryRef">Glossary</a>
							</li>
						</ul>
						<a href="/#/RoleBasedAccessManagement" className="read_more">Learn More <i className="fa fa-arrow-right" aria-hidden="true"></i></a>
					</div>
					</div>
		     	</div>
		      </div>
        );
    }
};