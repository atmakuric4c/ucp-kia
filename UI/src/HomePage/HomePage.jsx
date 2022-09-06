import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { userActions, commonActions } from "../_actions";
import { commonFns } from "../_helpers/common";
import PageLoader from '../_components/PageLoader';
import ReactHtmlParser from 'react-html-parser';
import {decryptResponse} from './../_helpers';

class HomePage extends React.Component {
  constructor(props) {
    super(props); 
    
    let data = this.callAccessPermission();

    this.state = {
      user : data.user,
      user_role: data.user.data.user_role,
      dashboardData :{},
      isUserHaveAccess: data.isUserHaveAccess,
      osTempHeaderIcon : "+",
      osTempDispStatus : 0,
      loading : false,
      galleryData : [],
      galleryDataCopy : []
    };
    this.toggleOsTempDisp = this.toggleOsTempDisp.bind(this);
    this.bindField = this.bindField.bind(this);
    this.gallerySearchFn = this.gallerySearchFn.bind(this);
    
  }
  
  toggleOsTempDisp = () => {
	  this.setState({
		  gallery_search : "",
		  galleryData : ((this.props.common.dashboardData && this.props.common.dashboardData.os_rows)?JSON.parse(JSON.stringify(this.props.common.dashboardData.os_rows)):[]),
		  galleryDataCopy: ((this.props.common.dashboardData && this.props.common.dashboardData.os_rows)?JSON.parse(JSON.stringify(this.props.common.dashboardData.os_rows)):[])
	  });
    if(this.state.osTempDispStatus == 0){
    	this.setState({
    		osTempHeaderIcon : "-",
    	    osTempDispStatus : 1,
	    });
    }else{
    	this.setState({
    		osTempHeaderIcon : "+",
    	    osTempDispStatus : 0,
	    });
    }
  }
  
  bindField(e){    
    console.log("e.target.name -- "+e.target.name+" --- e.target.value -- "+e.target.value);
    console.log(this.state[e.target.name]);

    let target_name = e.target.name;
    let target_value = e.target.value;
    setTimeout(() => {
	    this.setState({
	        [target_name]: target_value
	    })
	    console.log(this.state[target_name]);
    }, 100);
  }
  
  gallerySearchFn(){    
	  setTimeout(() => {
		  let galleryData = [];
		  let i = 0;
		  let searchTerm = this.state.gallery_search.trim().toLowerCase();
		  let galleryDataCopy = JSON.parse(JSON.stringify(this.state.galleryDataCopy));
	      for(let i =0 ; i < galleryDataCopy.length; i++){
	    	  let item = galleryDataCopy[i];
	    	  console.log(item);
	    	  if(searchTerm == ''){
	    		  galleryData.push(item)
	    	  }else if(item.galleryImageName.toLowerCase().indexOf(searchTerm) >= 0
    					  || item.galleryImageVersionName.toLowerCase().indexOf(searchTerm) >= 0
					  ){
//	    		  || item.resourceGroup.toLowerCase().indexOf(searchTerm) >= 0
//				  || item.galleryName.toLowerCase().indexOf(searchTerm) >= 0
//				  || item.subscription_id.toLowerCase().indexOf(searchTerm) >= 0
//				  || item.subscription_display_name.toLowerCase().indexOf(searchTerm) >= 0
	    		  
		    		  var searchRegEx = new RegExp(this.state.gallery_search.trim(), "ig");
		    		  var replaceMask = "<span class='search-highlight-text'>"+this.state.gallery_search.trim()+"</span>";
		    		  
		    		  item.subscription_id = item.subscription_id.replace(searchRegEx, replaceMask);
		    		  item.subscription_display_name = item.subscription_display_name.replace(searchRegEx, replaceMask);
		    		  item.resourceGroup = item.resourceGroup.replace(searchRegEx, replaceMask);
		    		  item.galleryName = item.galleryName.replace(searchRegEx, replaceMask);
		    		  item.galleryImageName = item.galleryImageName.replace(searchRegEx, replaceMask);
		    		  item.galleryImageVersionName = item.galleryImageVersionName.replace(searchRegEx, replaceMask);
		    		  galleryData.push(item)
		    	  }
	      }
	      this.setState({ 
	    	  galleryData: galleryData
		  });
		  console.log(this.state.galleryData);
		  console.log(this.state.galleryDataCopy);
		  console.log(this.props.common.dashboardData.os_rows);
	  }, 100);
  }

  callAccessPermission(){
    let user = decryptResponse( localStorage.getItem("user"));

    //Remove below line after uncommenting Profile Template
    let isUserHaveAccess = true;

    //UnComment to Enable Profile Template
    /*let getAccessMenuList = user.data.profile.menuInfo;

    let isUserHaveAccess = false;

    if(user.data.user_role == 1){
      isUserHaveAccess = true;
    }
    else if(getAccessMenuList && getAccessMenuList.length > 0){
      let totalCount = 0;
      for(let i =0 ; i < getAccessMenuList.length; i++){
        if(getAccessMenuList[i].url)
          ++totalCount;
        
        if(totalCount > 1){
          isUserHaveAccess = true;
          break;
        }
      }
    }*/

    return {
      user : user,
      isUserHaveAccess: isUserHaveAccess
    };
  }

  componentWillReceiveProps() {
    let data = this.callAccessPermission();
    
    this.setState({
      user : data.user,
      isUserHaveAccess: data.isUserHaveAccess
    });
  }
  componentDidMount() {
     this.props.dispatch(commonActions.getDashboardCounts({clientid:this.state.user.data.clientid, user_role: this.state.user_role, provision_type:this.state.user.data.provision_type}));
//     this.props.dispatch(commonActions.getDashboardOsTemplates());
  }

  render() {
    let user = this.state.user,
	resource_groups = user.data.resource_groups,
	user_role = user.data.user_role;
	let superAdmin = (user.data.isSuperAdmin == "1") ? true : false;
	
	let authorizeUser = (user_role && resource_groups.length >= 1) || superAdmin ? true : false;
	
    const { common } = this.props;
    let dashboardData = common.dashboardData;
    console.log("dashboardData");
    console.log(dashboardData);
    
    return (
      <div className="container-fluid main-body no-padding-mobile">
        <div className="contentarea mb-5 no-padding-mobile">
          {/* <h1 className="title">Dashboard</h1> */}
          {/* <h5 className="color">Dashboard</h5> */}
          {common.loading ? <PageLoader/> :
          <div className="row m-0">
	          <div className="col-lg-12">
			  	{!authorizeUser ? <h2 style={{color:"red"}}>** No resource group & role assigned! Please contact your manager.</h2> : null }
		          <div className="app-content content container-fluid">
		            <div className="content-wrapper clouds-bg">
					{!authorizeUser ?  <div className="profile-card-header no-dashboard-access-wrapper pt-4 pb-4">
			                {dashboardData && 
			                	<React.Fragment>
			                		<div className="row">
						                <div className="col-sm-3">
						                	<h3><a className="color-black" href={"/#/azure"}>0</a></h3>
						                	<br/>
						                	VMs Count
						                </div>
					                	<div className="col-sm-3">
						                	<h3><a className="color-black" href={"/#/azure"}>0</a></h3>
						                	<br/>
						                	CPU Count
						                </div>
					                	<div className="col-sm-3">
						                	<h3><a className="color-black" href={"/#/azure"}>0</a></h3>
						                	<br/>
						                	Storage(GB)
						                </div>
					                	<div className="col-sm-3">
						                	<h3><a className="color-black" href={"/#/azure"}>0</a></h3>
						                	<br/>
						                	Memory(GB)
						                </div>
				                	</div>
			                	</React.Fragment>
			                }
		              </div>:  
					  <div className="profile-card-header no-dashboard-access-wrapper pt-4 pb-4">
			                <h2>My Resource Usage</h2>
			                {dashboardData && 
			                	<React.Fragment>
			                		<div className="row">
						                <div className="col-sm-3">
						                	<h3>{dashboardData.vm_count != undefined ? dashboardData.vm_count : '0'}{/*<a className="color-black" href={"/#/azureVmList"}></a>*/}</h3>
						                	<br/>
						                	VMs Count
						                </div>
					                	<div className="col-sm-3">
						                	<h3>{dashboardData.cpu_count != undefined ? dashboardData.cpu_count : '0' }{/*<a className="color-black" href={"/#/azureVmList"}></a>*/}</h3>
						                	<br/>
						                	CPU Count
						                </div>
					                	<div className="col-sm-3">
						                	<h3>{dashboardData.disk_count != undefined ? dashboardData.disk_count : '0'}{/*<a className="color-black" href={"/#/azureVmList"}></a>*/}</h3>
						                	<br/>
						                	Storage(GB)
						                </div>
					                	<div className="col-sm-3">
						                	<h3>{dashboardData.ram_count != undefined ? dashboardData.ram_count : '0'}{/*<a className="color-black" href={"/#/azureVmList"}></a>*/}</h3>
						                	<br/>
						                	Memory(GB)
						                </div>
				                	</div>
			                	</React.Fragment>
			                }
		              </div>}
			           
		              {false && <div className="row">
			            <div className="col-sm-6">	
			              	<button className="btn btn-primary m-t-xs" onClick={this.toggleOsTempDisp}>{this.state.osTempHeaderIcon}</button>
		              	</div>
		              	{(this.state.osTempDispStatus == 1) && this.state.galleryDataCopy.length > 0 &&
			              	<div className="col-sm-6">
		              			<div className="row">
			              			<div className="col-sm-12">
				              			<input type="text" style={{width:"84%",display: "inline"}} name="gallery_search" className="form-control-vm m-r-xs m-l-xs m-t-xs " onChange={this.bindField} value={this.state.gallery_search} />
				              			<button className="btn btn-primary m-t-xs " style={{display: "inline",float: "right"}} onClick={this.gallerySearchFn}>Search</button>
		              				</div>
		              			</div>
			              	</div>
		              	}
		              </div>}
		              <div className="row random-psw-gentr-container1 p">
			              {(this.state.osTempDispStatus == 1) && this.state.galleryData.length > 0 && this.state.galleryData.map((osItem, index) => (
				              <div className="col-sm-3 p-0" key={index}>
					              <div className="m-xxs profile-card-header no-dashboard-access-wrapper pt-4 pb-4">
					              	<div className="row">
					              		<div className="col-sm-3 p-0">
					              			<img className="" style={{width:"60px"}} src={osItem.osType === "Windows" ?"/src/img/windows-icon.png":"/src/img/red-hat.png"} />
						                </div>
						                <div className="col-sm-9 p-0" style={{whiteSpace: 'pre-wrap', overflowWrap: 'break-word'}}>
						                	{/*<span><strong>subscriptionId : </strong>{ReactHtmlParser (osItem.subscription_id)}</span><br/>
						                	<span><strong>subscriptionDisplayName : </strong>{ReactHtmlParser (osItem.subscription_display_name)}</span><br/>
						                	<span><strong>resourceGroup : </strong>{ReactHtmlParser (osItem.resourceGroup)}</span><br/>
						                	<span><strong>gallery : </strong>{ReactHtmlParser (osItem.galleryName)}</span><br/>*/}
						                	<span><strong>OS Name : </strong>{ReactHtmlParser (osItem.galleryImageName)}</span><br/>
						                	<span><strong>OS Version : </strong>{ReactHtmlParser (osItem.galleryImageVersionName)}</span>
						                </div>
					                </div>
					                <br/><br/>
					                <a href={"/#/AzureNewVMInstance?subscription_id="+osItem.realName_subscription_id+"&resourceGroup="+osItem.realName_resourceGroup+"&galleryName="+osItem.realName_galleryName+"&galleryImageName="+osItem.realName_galleryImageName+"&galleryImageVersionName="+osItem.realName_galleryImageVersionName+"&provision_type="+osItem.provision_type+"&osType="+osItem.osType+"&dbType="+osItem.dbType+"&middleWare="+osItem.middleWare}>Place Order</a>
				                </div>
				              </div>
				              ))
			              }
			              {(this.state.osTempDispStatus == 1) && this.state.galleryData.length == 0 && 
			            	  <div className="no-access-contact-admin">
				                  No Gallery Images found/matched.
				              </div>
			              }
		              </div>
		              {!this.state.isUserHaveAccess &&
		              <div className="profile-card-header no-dashboard-access-wrapper text-center pt-4 pb-4">
		                <div className="profile-card-heading no-dashboard-access">
		                  <i className="fa fa-exclamation-triangle"></i>
		                  You don't have access to any page as Profile Template need to attach or update to Your Account by Admin.
		                </div>
		                <div className="no-access-contact-admin">
		                  Contact Admin to get Access !
		                </div>
		              </div>
		              }
		            </div>
		          </div>
	          </div>
          </div>
          }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { users, authentication, common } = state;
  const { user } = authentication;

  return {
    user,
    users,
    common
  };
}

const connectedHomePage = connect(mapStateToProps)(HomePage);
export { connectedHomePage as HomePage };
