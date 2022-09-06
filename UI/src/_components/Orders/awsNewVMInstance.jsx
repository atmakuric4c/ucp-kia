import React from 'react';
import { connect } from 'react-redux';
import { ordersActions } from './orders.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import { commonFns } from "../../_helpers/common";
import { azureActions } from '../Azure/azure.actions';
import config from 'config';
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';
import { toast } from 'react-toastify';
import ReactTooltip from "react-tooltip";

Modal.setAppElement("#app");
class awsNewVMInstance extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      user: user,
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      region_list: [],
      region_list_loading: true,
      os_template_list: [],
      backup_os_template_list: [],
      instance_type_list: [],
      instance_type_list_loader: false,
      vpc_list: [],
      vpc_list_loader: false,
      subnet_list: [],
      subnet_list_loader: false,
      isCartAddingInprogress: false,
      platform: "",
      instance_type_price: 0,
      os_price: 0,
      instanceType: "",
      subnetId: "",
      cpus: "",
      ram: "",
      disksize: "",
      vmNameValidate: "",
      region_name: "",
      vpc_name: "",
      vpc_id: "",
      availability_zone_list: [],

      os_template_drp_active: false,
      os_template_loading: false,
      os_architecture: "",
      os_template_id: "",
      os_template_name: "",
      os_image_id: "",
      vmName: "",

      instance_type_drp_active: false,
      instance_type_list_loader: false,
      instance_type_name: "",
      backup_instance_type_list: [],

      modalIsVPCOpen: false,
      newlyCreateVPC: "",

      regionid: "",
      openCreateSubnetModal: false,

      volume_list: "",
      volume_list_loading: false,
      generated_volume_id: "",

      nicId: "",
      nic_list: "",
      nic_list_loading: false,
      generated_nic_id: "",

      tool: false
    };
  }

  AddToCart = (e) => {
    e.preventDefault();
    
    if(!this.state.regionid){
        toast.error("Please select Region");
        return;
    }
    else if(!this.state.os_template_id){
        toast.error("Please select OS Template");
        return;
    }
    else if(!this.state.vpc_id){
        toast.error("Please select VPC");
        return;
    }
    else if(!this.state.subnetId){
        toast.error("Please select Subnet");
        return;
    }
    else if(!this.state.nicId){
        toast.error("Please select NIC");
        return;
    }
    else if(!this.state.volumeId){
        toast.error("Please select Volume");
        return;
    }
    else if(!this.state.instanceType){
        toast.error("Please select Instance Type");
        return;
    }
    else if(!this.state.vmName){
        toast.error("Please select VM Name");
        return;
    }
    else if(this.state.vmName.length < 4){
        toast.error("VM Name should be atleast 5 characters");
        return;
    }
    if(this.state.vmNameValidate == "checking"){
        toast.warn("Please wait, VM Name is Validating");
        return;
    }
    else if(this.state.vmNameValidate != "success"){
        toast.error("Please enter valid VM Name");
        return;
    }
    
    this.setState({
        isCartAddingInprogress: true
    });
    
    let frmData = {
        "cloud_id" : 4,
        "cart_items" : {
            "clientid": this.state.clientid,
            "regionName": this.state.regionid,
            "imageId": this.state.os_template_id,
            "instanceType": this.state.instanceType,
            "maxCount":"1",
            "subnetId": this.state.subnetId,
            "vmName": this.state.vmName,
            "cpus": this.state.cpus,
            "ram": this.state.ram,
            "disksize": this.state.disksize,
            //"nicId": this.state.nicId,
            //"volumeId": this.state.volumeId
        },
        "clientid": this.state.clientid,
        "user_id": this.state.user_id,
        "billing_type": "MONTHLY",
        "os_template_id": this.state.os_image_id,
        "cloud_type": "AWS",
        "price" : (Number(this.state.instance_type_price ? this.state.instance_type_price : 0) + Number(this.state.os_price ? this.state.os_price : 0)) // sum of os price and vmsize price(based on os platform pick windows_price or linux_price)        
    };
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/orders/saveOtherCloudOrderInfo`, requestOptions).then(response  => this.handleCartResponse(response));
  }

  handleCartResponse(response, stateName) {
    return response.text().then(text => {
      const data = text && JSON.parse(ucpDecrypt((text)));
        this.setState({
            isCartAddingInprogress: false
        });
        if (!response.ok) {
            toast.error(response.message);
        }
        else{
          toast.success("Order added to cart successfully.");
          setTimeout(() => {
            location.reload(true);
          }, 2000);
        }
    });
  }

  componentDidMount(){
    this.calAwsApis({clientid: this.state.clientid}, "get_aws_regions" , "region_list", "region_list_loading" );
    
    this.fetchPriceForVolume();

    document.getElementById("body_wrapper").addEventListener("click", (e) => {
        if(e.target.className && (e.target.className.indexOf("skip-propagation") != -1 || e.target.className.indexOf("custom-auto-drp-down-select-option-skip") != -1)){
            return false;
        }
    
        this.setState({
            os_template_drp_active: false,
            instance_type_drp_active: false
        });
    });
  }

  fetchPriceForVolume(){
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt({"cloud_type" : "AWS", "addon_name" : "storage", "currency_id" : this.state.user.data.currency_id}))
    };

    fetch(`${config.apiUrl}/secureApi/orders/getAddonPrice`, requestOptions).then(response  => this.handlePriceResponse(response));
  }

  handlePriceResponse(response, stateName, isLoading) {
    return response.text().then(text => {
        
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if(data && data.data && data.data[0] && data.data[0].price){
          this.setState({
            priceFor1GBVolume: data.data[0].price
          });
        }

        this.setState({
          isCurrentPriceLoading: false
        })
    });
  }
  
  calAwsApis(frmData, apiName, stateName, stateLoading, backupStateName, resetValue){
    if(stateLoading){
        this.setState({
            [stateLoading]: true
        });
    }
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/aws/` + apiName, requestOptions).then(response  => this.handleResponse(response, stateName, stateLoading, backupStateName, resetValue));
  }
  
  calAwsSecureApis(frmData, apiName, stateName, stateLoading, backupStateName, resetValue){
    if(stateLoading){
        this.setState({
            [stateLoading]: true
        });
    }

    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/aws/` + apiName, requestOptions).then(response  => this.handleResponse(response, stateName, stateLoading, backupStateName, resetValue));
  }
  
  handleResponse(response, stateName, stateLoading, backupStateName, resetValue) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        console.log(stateName)
        console.log(data)
        if (!response.ok) {
            //
        }
        else if(data && data.success == 0 && stateName == "vpc_list"){
            toast.error("Selected region is not accessible for this account !");
        }
        else if(data && data.success == 0){
            //return false;
        }
        else{
          this.setState({
            [stateName]: (data.data ? data.data : data)
          });

          if(backupStateName){
            this.setState({
             [backupStateName]: (data.data ? data.data : data)
            });
          }

          if(stateLoading == "nic_list_loading"){
            if(this.state.generated_nic_id){
                $("#drp_nic").val(this.state.generated_nic_id);
                toast.info("Newly generated NIC has been auto-selected !");
                this.setState({
                    nicId: this.state.generated_nic_id
                });
            }
            this.setState({
                nic_list_loading: false
            });
          }

          if(stateName == "vpc_list" && resetValue){
              $("#vpc_id").val(resetValue);
              this.setState({
                vpc_name: resetValue,
                vpc_id: resetValue
              });
              
              toast.info("Newly created VPC has been auto-selected !");

              this.vpc_Change(resetValue);
          }

          if(stateName == "subnet_list" && resetValue){
            $("#subnet").val(resetValue);
            this.setState({
              subnetId: resetValue
            });
            
            toast.info("Newly Created Subnet has been auto-selected !");
          }

          if(stateName == "volume_list" && resetValue){
            $("#volume_id").val(resetValue);
            this.setState({
              volumeId: resetValue
            });
            
            toast.info("Newly Created Volume has been auto-selected !");
          }
        }
        
        if(stateLoading){
            this.setState({
                [stateLoading]: false
            });
        }
    });
  }

  regionChange(target){
    this.setState({
        regionid: target.value,
        region_name: (target.value ? target.options[target.selectedIndex].text : ""),
        os_template_list: [],
        backupStateName: [],
        vpc_list: [],
        os_architecture: "",
        os_template_id: "",
        os_template_name: "",
        os_image_id: "",
        platform: "",
        os_price: 0,
        
        instance_type_name: "",
        instance_type_list: [],
        backup_instance_type_list: [],
        instanceType: "",
        cpus: "",
        ram: "",
        disksize: "",
        instance_type_price: 0,

        subnetId: "",
        subnet_list: [],
        vpc_name: "",
        vpc_id: "",

        nicId: "",
        nic_list: [],
        nic_list_loading: false,
        generated_nic_id: "",

        volumeId: "",
        volume_list: [],
        volume_list_loading: false,

        is_availability_zone_loading: false,
        availability_zone_list: []
    });

    if(target.value){
        this.calAwsApis({clientid : this.state.clientid, 
            regionName : target.value,
            currency_id: this.state.user.data.currency_id }, "get_aws_images" , "os_template_list", "os_template_loading", "backup_os_template_list" );
        
        this.calAwsSecureApis({clientid : this.state.clientid, regionName : target.value }, "getVpcList" , "vpc_list", "vpc_list_loader" );

        this.calAwsSecureApis({clientid : this.state.clientid, regionName : target.value }, "getNetworkInterfaceList" , "nic_list");

        this.calAwsSecureApis({clientid : this.state.clientid, regionName : target.value }, "getVolumeList" , "volume_list", "volume_list_loader");
        
        this.getAvailableZoneData(target.value);
    }
  }

  osTemplateClick(target){
    if($(target).attr("value")){
        let architecture = $(target).attr("architecture");
        let value = $(target).attr("value");
        let os_id = $(target).attr("os_id");
        let platform = $(target).attr("platform");
        let price = $(target).attr("price");
        let name = $(target).attr("name");

        this.setState({
            os_architecture: architecture,
            os_template_id: value,
            os_template_name: name,
            os_image_id: os_id,
            platform: platform,
            os_price: price,
            os_template_drp_active: false,

            instance_type_name: "",
            instance_type_list: [],
            backup_instance_type_list: [],
            instanceType: "",
            cpus: "",
            ram: "",
            disksize: "",
            instance_type_price: 0,
            instance_type_drp_active: false,
            instance_type_list_loader: true
        });
        
        this.calAwsApis(
            {clientid : this.state.clientid, 
             regionName : this.state.regionid, 
             "architecture" : architecture,
             currency_id: this.state.user.data.currency_id }, 
            "get_aws_instance_types" , 
            "instance_type_list",
            "instance_type_list_loader",
            "backup_instance_type_list"
        );
    }
    else{
        this.setState({
            os_architecture: "",
            os_template_id: "",
            os_template_name: "",
            os_image_id: "",
            platform: "",
            os_price: 0,
            os_template_drp_active: false,

            instance_type_list: [],
            backup_instance_type_list: [],            
            instance_type_name: "",
            instanceType: "",
            cpus: "",
            ram: "",
            disksize: "",
            instance_type_price: 0,
            instance_type_drp_active: false,
            instance_type_list_loader: false
        });
    }
  }

  instanceTypeDrpClick = (e) => {
    if(e.target.className && e.target.className.indexOf("skip-propagation") != -1){
        return false;
    }

    if(e.target.className && e.target.className.indexOf("custom-auto-drp-down-options") != -1){
        this.setState({
            instance_type_drp_active: false
        });
    }
    else{
        setTimeout(() => {
            this.setState({
                instance_type_drp_active: !this.state.instance_type_drp_active
            });
        }, 0);        
    }
  }

  instanceTypeSearchChange = (e) => {
    let value = (e.target.value ? e.target.value.toLowerCase() : "");
    let instance_type_list = JSON.parse(JSON.stringify(this.state.backup_instance_type_list));
    let filtered_instance_type_list = [];
    for(let row = 0; row < instance_type_list.length; row++){
      if(instance_type_list[row].instanceType.toLowerCase().indexOf(value) != -1){
        filtered_instance_type_list.push(instance_type_list[row]);
      }
    }

    this.setState({
        instance_type_list: filtered_instance_type_list
    });
  }

  instanceTypeClick(target){
    if($(target).attr("value")){
        let cpus = $(target).attr("cpus");
        let value = $(target).attr("value");
        let ram = $(target).attr("ram");
        let disksize = $(target).attr("disksize");
        let price = $(target).attr("price");
        let name = $(target).attr("name");

        this.setState({
            instance_type_name: name,
            instanceType: value,
            cpus: cpus,
            ram: ram,
            disksize: disksize,
            instance_type_price: price,
            instance_type_drp_active: false
        });
    }
    else{
        this.setState({
            instance_type_name: "",
            instanceType: "",
            cpus: "",
            ram: "",
            disksize: "",
            instance_type_price: 0,
            instance_type_drp_active: false
        });
    }
  }

  vpc_Change(target, resetValue){
    let value = ((target.value || target.value == "") ? target.value : target);
    
    this.setState({
        subnetId: "",
        subnet_list: [],
        subnet_list_loader: false,
        vpc_name: (target.value ? target.options[target.selectedIndex].text : value),
        vpc_id: value
    });

    if(value){
        this.setState({
            subnet_list_loader: true
        });

        this.calAwsApis(
            {clientid : this.state.clientid, regionName : this.state.regionid, "ipCount" : 1, vpcId: value },
            "get_subnet_list" , 
            "subnet_list",
            "subnet_list_loader",
            "",
            resetValue
        );
    }
  }

  subnet_Change(target){
    this.setState({
        subnetId: target.value
    });
  }

  nic_Change(target){
    this.setState({
        nicId: target.value
    });
  }

  volume_Change(target){
    this.setState({
        volumeId: target.value
    });
  }
  
  vmNameChange(target){
    let val = target.value;
    var letterNumber = /^[0-9a-zA-Z]+$/;
    if(val == ""){
        this.setState({
            vmName: ""
        })
    }
    else if((val.match(letterNumber))){
        this.setState({
            vmName: val
        })
    }
  }

  osTemplateDrpClick = (e) => {
    if(e.target.className && e.target.className.indexOf("skip-propagation") != -1){
        return false;
    }

    if(e.target.className && e.target.className.indexOf("custom-auto-drp-down-options") != -1){
        this.setState({
            os_template_drp_active: false
        });
    }
    else{
        setTimeout(() => {
            this.setState({
                os_template_drp_active: !this.state.os_template_drp_active
            });
        }, 0);        
    }
  }

  osTemplateDrpSearchChange = (e) => {
      let value = (e.target.value ? e.target.value.toLowerCase() : "");
      let os_template_list = JSON.parse(JSON.stringify(this.state.backup_os_template_list));
      let filtered_os_template_list = [];
      for(let row = 0; row < os_template_list.length; row++){
        
        if(os_template_list[row].description){
            if(os_template_list[row].description.toLowerCase().indexOf(value) != -1){
                filtered_os_template_list.push(os_template_list[row]);
            }
        }
        else if(os_template_list[row].name.toLowerCase().indexOf(value) != -1){
            filtered_os_template_list.push(os_template_list[row]);
        }
      }

      this.setState({
          os_template_list: filtered_os_template_list
      });
  }

  vmNameBlur(){
    setTimeout(() => {
      this.setState({
          vmNameValidate: "checking"
      });
    }, 0);

    let validationName = "";

    if(!this.state.vmName){
      validationName = "Please enter VM Name";
      toast.error(validationName);
      setTimeout(() => {
          this.setState({
              vmNameValidate: "fail",
              vmValidationName: validationName
          });
        }, 100);
      return;
    }
    else if(this.state.vmName.length < 4){
      validationName = "VM Name should be atleast 5 characters";
      toast.error(validationName);
      setTimeout(() => {
          this.setState({
              vmNameValidate: "fail",
              vmValidationName: validationName
          });
        }, 100);
      return;
    }
    else{
      var frmData={
          vmName:this.state.vmName,
          clientid:this.state.clientid,
          regionName: this.state.regionid
      }
      
      const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(ucpEncrypt(frmData))
      };

      fetch(`${config.apiUrl}/secureApi/aws/validateVmName`, requestOptions).then(response  => {
          response.text().then(text => {
              
              var data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
              if (response.ok) {
                  var result=(data.value ? data.value : data)
                  if(result.success == false){     
                      validationName = result.message;
                      toast.error(validationName);
                      this.setState({vmNameValidate: 'fail',                    
                          vmValidationName: validationName});
                  } else {      
                      //toast.success(result.message);
                      this.setState({vmNameValidate: 'success'});
                  }
              }
              else{
                  this.setState({vmNameValidate: 'fail'});
                  toast.error('The operation did not execute as expected. Please raise a ticket to support');
              }        
          });
      });
    }
  }

  getAvailableZoneData(regionid){      
    let frmData = { "clientid" : this.state.clientid, "regionName" : regionid};

    this.setState({
        is_availability_zone_loading: true,
        availability_zone_list: []
    });

    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/aws/get_aws_availability_zones`, requestOptions).then(response  => this.handleRegionChangeListResponse(response));
  }
  
  openCreateVPCModalClick = () => {
    if(!this.state.region_name){
        toast.warn("Please select Region to Create VPC");
        return;
    }

    this.setState({ modalIsVPCOpen: true });
  }

  closeCreateVPCModalClick = () => {
    this.setState({ modalIsVPCOpen: false });        
  }

  popupFormSubmit = (event, flag) =>{
    if (event.key === 'Enter') {
      if(flag == "vpc"){
       this.addVPC();
      }
      else if(flag == "subnet"){
        this.addNewItem();
      }
    }
  }
  
  addVPC = () => {    
    if(!$("#addVpcCIDR").val()){
      toast.error("Please enter CIDR Block");
      return;
    }

    var frmData = {
        clientid: this.state.clientid,
        regionName: this.state.regionid,
        cidrBlock: $("#addVpcCIDR").val()
    };

    this.setState({
      is_vpc_add_inprogress: true
    });
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/aws/createVpc`, requestOptions).then(response  => this.handleAddVPCResponse(response));
  }

  handleAddVPCResponse(response) {
    return response.text().then(data => {
      data = (data && JSON.parse(data) ? JSON.parse(data) : "");

      this.setState({
        is_vpc_add_inprogress: false
      });

      if(!data.success){
        if(data && data.data && data.data && data.data[0] && data.data[0].Error && data.data[0].Error[0] && data.data[0].Error[0].Message && data.data[0].Error[0].Message[0]){
          toast.error(data.data[0].Error[0].Message[0]);  
        }
        else{
          toast.error("Unable to Add VPC"); 
        }
      }
      else {
        toast.success("VPC Added Successfully!");

        this.closeCreateVPCModalClick();

        this.calAwsSecureApis({clientid : this.state.clientid, regionName : this.state.regionid }, "getVpcList" , "vpc_list", "vpc_list_loader", "", 
        (data && data.data && data.data[0] && data.data[0].vpcId && data.data[0].vpcId[0])
        );
      }
    });
  }

  openCreateSubnetModalClick = () => {
    if(!this.state.region_name){
        toast.warn("Please select Region to Create New Subnet");
        return;
    }
    else if(!this.state.vpc_name){
        toast.warn("Please select VPC to Create New Subnet");
        return;
    }
    
    this.setState({ openCreateSubnetModal: true });
  }

  generateNewNICClick = () => {
    if(this.state.is_NIC_creating_in_progress){
        toast.warn("NIC creation request is already in-process");
        return;
    }
    else if(!this.state.regionid){
        toast.warn("Please select Region to generate NIC");
        return;
    }
    else if(!this.state.vpc_id){
        toast.warn("Please select VPC to generate NIC");
        return;
    }
    else if(!this.state.subnetId){
        toast.warn("Please select Subnet to generate NIC");
        return;
    }

    this.setState({
        is_NIC_creating_in_progress: true,
        generated_nic_id: ""
    });

    let frmData = {
        clientid: this.state.clientid,
        regionName: this.state.regionid,
        subnetId: this.state.subnetId,
        vpcId: this.state.vpc_id
    }
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
      };
  
      fetch(`${config.apiUrl}/secureApi/aws/createNetworkInterface`, requestOptions).then(response  => this.handleAddNewNICItemResponse(response, frmData.regionName));
  }

  handleAddNewNICItemResponse(response, regionName) {
    return response.text().then(data => {
      
      data = (data && JSON.parse(data) ? JSON.parse(data) : "");

      this.setState({
        is_NIC_creating_in_progress: false
      });

      if(!data.success){
        if(data && data.data && data.data && data.data[0] && data.data[0].Error && data.data[0].Error[0] && data.data[0].Error[0].Message && data.data[0].Error[0].Message[0]){
          toast.error(data.data[0].Error[0].Message[0]);  
        }
        else{
          toast.error("Unble to Add NIC"); 
        }
      }
      else {
        toast.success("NIC Added Successfully!");

        if(data && data.data && data.data[0] && data.data[0].networkInterfaceId && data.data[0].networkInterfaceId[0]){
            this.setState({
                generated_nic_id: data.data[0].networkInterfaceId[0]
            })
        }

        this.setState({
            nic_list_loading: true
        });

        this.calAwsSecureApis({clientid : this.state.clientid, regionName : this.state.regionid }, "getNetworkInterfaceList" , "nic_list", "nic_list_loading");
      }   
    });
  }
 
  openCreateVolumeModalClick = () => {
    if(!this.state.region_name){
        toast.warn("Please select Region to Create New Volume");
        return;
    }

    this.setState({ modalIsVolumeOpen: true });
  }

  closeCreateVolumeModalClick = () => {
    this.setState({ modalIsVolumeOpen: false });        
  }
    
  handleRegionChangeListResponse(response) {
    return response.text().then(text => {
      let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

      if(data && data.data && data.data.length > 0){
        this.setState({
          availability_zone_list:data.data
        });
      }

      this.setState({
        is_availability_zone_loading: false
      });
    });
  }

  closeCreateSubnetModalClick = () => {     
      this.setState({ openCreateSubnetModal: false });        
  }

  addNewItem = e => {    
    var frmData = {};

    frmData.clientid = this.state.clientid;
    frmData.regionName = this.state.regionid;
    frmData.vpcId = this.state.vpc_id;
    frmData.cidrBlock = $("#cidrBlock").val();
    frmData.availabilityZone = $("#availabilityZone").val();
    
    if(!frmData.regionName){
      toast.error("Please select Region");
      return;
    }

    if(!frmData.vpcId){
      toast.error("Please select VPC");
      return;
    }

    if(!frmData.availabilityZone){
      toast.error("Please enter Availability Zone");
      return;
    }

    if(!frmData.cidrBlock){
        toast.error("Please enter CIDR Block");
        return;
    }
    
    this.setState({
      is_add_item_inprogress: true,
      regionName: frmData.regionName
    });
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/aws/createSubnet`, requestOptions).then(response  => this.handleAddNewItemResponse(response));
  }

  handleAddNewItemResponse(response, stateName) {
    return response.text().then(data => {
      
      data = (data && JSON.parse(data) ? JSON.parse(data) : "");

      this.setState({
        is_add_item_inprogress: false
      });

      if(data && data.success == 0){
        if(data && data.data && data.data && data.data[0] && data.data[0].Error && data.data[0].Error[0] && data.data[0].Error[0].Message && data.data[0].Error[0].Message[0]){
          toast.error(data.data[0].Error[0].Message[0]);  
        }
        else{
          toast.error("Unble to Add Subnet"); 
        }
      }
      else if(data && data.CreateSubnetResponse && data.CreateSubnetResponse.subnet && 
        data.CreateSubnetResponse.subnet[0] && data.CreateSubnetResponse.subnet[0].subnetId &&
        data.CreateSubnetResponse.subnet[0].subnetId[0]){
        this.vpc_Change(this.state.vpc_id, data.CreateSubnetResponse.subnet[0].subnetId[0]);
        toast.success("Subnet Added Successfully!");

        this.closeCreateSubnetModalClick();
      }
      else{
        toast.error("Unble to Add Subnet"); 
      }
    });
  }

  toggle = () => {
      this.setState({
          tool: !this.tool
      })
  };

  allowOnlyNumbers = (event, name) => {
    let value = event.target.value;

    let charCode = value.charCodeAt(value.length - 1);
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
    }

    this.setState({
      [name]: value
    });
  }

  addNewVolume = e => {
    e.preventDefault();      
    var form = document.querySelector("#addNewVolume");
    var frmData = serialize(form, { hash: true });
    
    if(!frmData.regionName){
      toast.error("Please select region");
      return;
    }

    if(!frmData.availabilityZone){
      toast.error("Please enter Availability Zone");
      return;
    }

    if(!frmData.volumeType){
      toast.error("Please enter Volume Type");
      return;
    }
    
    if(!frmData.size){
      toast.error("Please enter Size");
      return;
    }
    
    if(!frmData.iops){
      toast.error("Please enter IOPS");
      return;
    }
   
    this.setState({
      is_add_item_inprogress: true,
      regionName: frmData.regionName
    });

    frmData.currency_id = this.state.user.data.currency_id;
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/aws/createVolume`, requestOptions).then(response  => this.handleAddNewItemResponse(response));
  }

  handleAddNewItemResponse(response, stateName) {
    return response.text().then(data => {

      data = (data && JSON.parse(data) ? JSON.parse(data) : "");

      this.setState({
        is_add_item_inprogress: false
      });

      if(!data.success){
        if(data && data.data && data.data && data.data[0] && data.data[0].Error && data.data[0].Error[0] && data.data[0].Error[0].Message && data.data[0].Error[0].Message[0]){
          toast.error(data.data[0].Error[0].Message[0]);  
        }
        else{
          toast.error("Unable to Add Volume"); 
        }
      }
      else {
        toast.success("Volume Added Successfully!");

        this.closeCreateVolumeModalClick();

        let resetValue =  (data && data.data && data.data.CreateVolumeResponse && 
            data.data.CreateVolumeResponse.volumeId && data.data.CreateVolumeResponse.volumeId[0] ? data.data.CreateVolumeResponse.volumeId[0] : "");
            
        this.calAwsSecureApis({clientid : this.state.clientid, regionName : this.state.regionid}, "getVolumeList" , "volume_list", "volume_list_loader", "", resetValue);
      }   
    });
  }

  render() {
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">AWS - New VM Instance</h5>
          <form
            name="saveOrderInfoFrm"
            id="saveOrderInfoFrm"
            method="post"
            onSubmit={this.AddToCart}
            className="mt-4 mb-4"
          >
            <div>
                <React.Fragment>
                    <div className="row">
                        <div className="col-lg-6">
                            <div className="form-group row">
                                <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Region<span className="star-mark">*</span></label>
                                <div className="col-sm-9 position-relative">
                                    <select
                                    className="form-control-vm"                                    
                                    name="subscription"
                                    onChange={e => this.regionChange(e.target)}
                                    >
                                    <option selected="true" value="">--SELECT--</option>
                                    {this.state.region_list && this.state.region_list.length > 0 && this.state.region_list.map((row, index) =>
                                        <option  value={row.regionid}>
                                            {row.regionname}
                                        </option>
                                    )}
                                    </select>

                                    {this.state.region_list_loading && <i className="fas fa-circle-notch icon-loading drop-loader"></i>}
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="form-group row">
                                <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>OS Template<span className="star-mark">*</span></label>
                                <div className="col-sm-9">
                                    <div onClick={this.osTemplateDrpClick} className={"form-control-vm custom-auto-drp-down " + (this.state.os_template_drp_active && "active")}>
                                        <div className="custom-auto-drp-down-select-option-skip custom-auto-drp-down-select-option">
                                            <div title={this.state.os_template_name && this.state.os_template_name.length > 50 && this.state.os_template_name} className="custom-auto-drp-option custom-auto-drp-down-select-option-skip">
                                                {(this.state.os_template_name ? (this.state.os_template_name.length > 50? (this.state.os_template_name.slice(0,50) + "...") : this.state.os_template_name) : "--SELECT--")}
                                            </div>
                                            <i className="fa fa-chevron-right custom-auto-drp-down-arrow"></i>
                                            {this.state.os_template_loading && <i className="fas fa-circle-notch custom-auto-drp-data-loading icon-loading"></i> }
                                        </div>
                                        <div className="custom-auto-drp-down-options-wrapper">
                                            <div className="skip-propagation">
                                                <input type="text" onChange={e => this.osTemplateDrpSearchChange(e)} placeholder="Search" className="custom-auto-drp-down-search-textbox skip-propagation" />
                                            </div>
                                            {this.state.os_template_list && this.state.os_template_list.length > 0 && this.state.os_template_list.map((row, index) =>
                                                <div onClick={e => this.osTemplateClick(e.target)} className={"custom-auto-drp-down-options overflow-wrap " + (row.imageId == this.state.os_template_id && "custom-auto-drp-down-selected") } os_id={row.id} price={row.price} platform={row.platform} architecture={row.architecture} value={row.imageId} name={(row.description ? row.description : row.name)}>
                                                    {(row.description ? row.description : row.name)}
                                                </div>
                                            )}
                                            {(!this.state.os_template_list || this.state.os_template_list.length == 0) &&
                                                <div className="custom-auto-drp-down-options no-selection">
                                                    No Data Available
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>                        
                    </div>
                    <div className="row">
                        <div className="col-lg-6">
                            <div className="form-group row">
                            <label htmlFor="cpu" className='col-sm-3 col-form-label'>VPC<span className="star-mark">*</span></label>
                                <div className="col-sm-9 position-relative">
                                    <select
                                    className="form-control-vm"
                                    id="vpc_id"
                                    onChange={e => this.vpc_Change(e.target)}
                                    >
                                    <option selected="true" value="">--SELECT--</option>
                                    {this.state.vpc_list && this.state.vpc_list.length > 0 && this.state.vpc_list.map((row, index) =>
                                        (row && row.vpcId && row.vpcId[0] &&
                                            <option value={row.vpcId[0]}>
                                                {row.vpcId[0]}
                                            </option>
                                        )
                                    )}
                                    </select>
                                    {this.state.vpc_list_loader && <i className="fas fa-circle-notch icon-loading drop-loader"></i>}
                                    <a href="javascript:void(0)" className="anch-link small-anch-link" onClick={() => this.openCreateVPCModalClick()}>Create New VPC</a>
                                    <Modal
                                        isOpen={this.state.modalIsVPCOpen}
                                        onRequestClose={this.closeCreateVPCModalClick}
                                        >
                                            <h2 style={{color:'red'}}>
                                                Add VPC<a className="float-right" href="javascript:void(0);" onClick={this.closeCreateVPCModalClick}><i className="fa fa-times" /></a>
                                            </h2>

                                            <div className="col-md-12" onKeyDown={(e) => this.popupFormSubmit(e, 'vpc')} >
                                                 <div className="form-group position-relative">
                                                    <label htmlFor="subscription">Region</label>
                                                    <input
                                                    type="text"
                                                    className="form-control input-disabled"
                                                    value={this.state.region_name}
                                                    readOnly
                                                    />
                                                </div>
                                                <div className="form-group position-relative">
                                                    <label htmlFor="name">CIDR Block<span className="star-mark">*</span>
                                                    </label>
                                                    <input
                                                    type="text"
                                                    className="form-control"
                                                    name="cidrBlock"
                                                    required                      
                                                    placeholder="Ex: 192.0.0.0/16"
                                                    id="addVpcCIDR"
                                                    />
                                                    {/*https://www.newline.co/@dmitryrogozhny/4-ways-to-show-tooltips-in-react-with-react-tooltip,-material-ui,-bootstrap,-or-semantic-ui--e3473190*/}
                                                    <i data-tip data-for="addVpcCIDRTip" className="fa fa-info-circle txt-info-icon" aria-hidden="true"></i>
                                                    <ReactTooltip id="addVpcCIDRTip" place="top" effect="solid">
                                                        Each CIDR Block format should be like 192.0.0.0/16,<br/>
                                                        193.0.0.0/16, 194.0.0.0/16
                                                    </ReactTooltip>
                                                </div>
                                                <div className="form-group">
                                                    <button onClick={() => this.addVPC()}
                                                    className={"btn btn-sm btn-primary " + (this.state.is_vpc_add_inprogress ? "no-access" : "")} disabled={this.state.is_vpc_add_inprogress ? true : false}
                                                    >
                                                    {this.state.is_vpc_add_inprogress &&
                                                        <i className="fas fa-circle-notch icon-loading"></i>}
                                                    Submit</button>
                                                </div>
                                            </div>
                                        </Modal>
                                </div>
                            </div>            
                        </div>
                        <div className="col-lg-6">
                            <div className="form-group row">
                            <label htmlFor="cpu" className='col-sm-3 col-form-label'>Subnet<span className="star-mark">*</span></label>
                                <div className="col-sm-9 position-relative">
                                    <select
                                    className="form-control-vm"
                                    id="subnet"
                                    name="subnet"
                                    onChange={e => this.subnet_Change(e.target)}
                                    >
                                    <option selected="true" value="">--SELECT--</option>
                                    {this.state.subnet_list && this.state.subnet_list.length > 0 && this.state.subnet_list.map((row, index) =>
                                        <option value={row.subnetId[0]}>
                                            {row.subnetId[0]}
                                        </option>
                                    )}
                                    </select>
                                    <a href="javascript:void(0)" className="anch-link small-anch-link" onClick={() => this.openCreateSubnetModalClick()}>Create New Subnet</a>
                                    {this.state.subnet_list_loader && <i className="fas fa-circle-notch icon-loading drop-loader"></i>}

                                    <Modal
                                        isOpen={this.state.openCreateSubnetModal}
                                        onRequestClose={this.closeCreateSubnetModalClick}
                                        >
                                            <h2 style={{color:'red'}}>
                                                Add Subnet<a className="float-right" href="javascript:void(0);" onClick={this.closeCreateSubnetModalClick}><i className="fa fa-times" /></a>
                                            </h2>
                                            <div className="col-md-12" onKeyDown={(e) => this.popupFormSubmit(e, 'subnet')}>
                                                <div className="panel panel-default" />
                                                <div
                                                >
                                                <div className="form-group">
                                                    <label htmlFor="name">Region</label>
                                                    <input
                                                    type="text"
                                                    className="form-control input-disabled"
                                                    value={this.state.region_name}
                                                    name="regionName"
                                                    readOnly
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="name">VPC</label>
                                                    <input
                                                    type="text"
                                                    className="form-control input-disabled"
                                                    id="create_subnet_vpc"
                                                    name="vpcId"
                                                    value={this.state.vpc_name}
                                                    readOnly
                                                    />
                                                </div>                                            
                                                <div className="form-group position-relative">
                                                    <label htmlFor="subscription">Availability Zone<span className="star-mark">*</span></label>
                                                    <select
                                                    className="form-control"
                                                    name="availabilityZone"
                                                    required
                                                    id="availabilityZone"
                                                    >
                                                    <option selected="true" value="">-Select-</option>
                                                    {this.state.availability_zone_list && this.state.availability_zone_list.length > 0 && this.state.availability_zone_list.map((row, index) =>
                                                        <option  value={row.zoneName}>
                                                            {row.zoneName}
                                                        </option>
                                                    )}
                                                    </select>
                                                    { this.state.is_availability_zone_loading && 
                                                    <i className="fas fa-circle-notch icon-loading form-drp-loader-icon"></i>
                                                    }
                                                </div>
                                                <div className="form-group position-relative">
                                                    <label htmlFor="name">CIDR Block<span className="star-mark">*</span></label>
                                                    <input
                                                    type="text"
                                                    className="form-control"
                                                    name="cidrBlock"
                                                    id="cidrBlock"
                                                    required
                                                    placeholder="Ex: 192.0.1.0/24"
                                                    />
                                                    <i data-tip data-for="addSubnetCIDRTip" className="fa fa-info-circle txt-info-icon" aria-hidden="true"></i>
                                                    <ReactTooltip id="addSubnetCIDRTip" place="top" effect="solid">
                                                        If VPC - CIDR Block is 192.0.0.0/16 then <br/>
                                                        Each Subnet - CIDR Block should divide like 192.0.0.0/24,<br/>192.0.1.0/24, 192.0.2.0/24
                                                    </ReactTooltip>
                                                </div>
                                                <div className="form-group">
                                                    <input type="hidden" name="clientid" value={this.state.clientid} />
                                                    <button
                                                    onClick={this.addNewItem}
                                                    className={"btn btn-sm btn-primary " + (this.state.is_add_item_inprogress ? "no-access" : "")} disabled={this.state.is_add_item_inprogress ? true : false}
                                                    >
                                                    {this.state.is_add_item_inprogress &&
                                                        <i className="fas fa-circle-notch icon-loading"></i>}
                                                    Submit</button>
                                                </div>
                                                </div>
                                            </div>
                                        </Modal>
                                </div>
                            </div>            
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-lg-6">
                            <div className="form-group row">
                                <label htmlFor="cpu" className='col-sm-3 col-form-label'>NIC<span className="star-mark">*</span></label>
                                <div className="col-sm-9 position-relative">
                                    <select
                                    className="form-control-vm"
                                    id="drp_nic"
                                    onChange={e => this.nic_Change(e.target)}
                                    >
                                    <option selected="true" value="">--SELECT--</option>
                                    {this.state.regionid && this.state.vpc_id && this.state.subnetId &&
                                        <React.Fragment>
                                            {this.state.nic_list && this.state.nic_list.length > 0 && this.state.nic_list.map((row, index) =>
                                                (row && row.vpcId && row.vpcId[0] && row.vpcId[0] == this.state.vpc_id
                                                    && row.subnetId && row.subnetId[0] && row.subnetId[0] == this.state.subnetId && row.networkInterfaceId && row.networkInterfaceId[0] &&
                                                    <option value={row.networkInterfaceId[0]}>
                                                        {row.networkInterfaceId[0]}
                                                    </option>
                                                )
                                            )}
                                        </React.Fragment>
                                    }
                                    </select>
                                    { this.state.nic_list_loading && 
                                        <i className="fas fa-circle-notch icon-loading drop-loader"></i>
                                    }
                                    <a href="javascript:void(0)" className="anch-link small-anch-link position-relative" onClick={() => this.generateNewNICClick()}>Generate New NIC
                                    { this.state.is_NIC_creating_in_progress && 
                                        <i className="fas fa-circle-notch icon-loading icon-link-loading ml-1"></i>
                                    }
                                    </a>
                                </div>
                            </div>            
                        </div>
                        <div className="col-lg-6">
                            <div className="form-group row">
                            <label htmlFor="cpu" className='col-sm-3 col-form-label'>Volume<span className="star-mark">*</span></label>
                                <div className="col-sm-9 position-relative">
                                    <select
                                    className="form-control-vm"
                                    id="volume_id"
                                    onChange={e => this.volume_Change(e.target)}
                                    >
                                    <option selected="true" value="">--SELECT--</option>
                                    {this.state.volume_list && this.state.volume_list.length > 0 && this.state.volume_list.map((row, index) =>
                                        (row && row.volumeId && row.volumeId[0] &&
                                            <option value={row.volumeId[0]}>
                                                {row.volumeId[0]}
                                            </option>
                                        )
                                    )}
                                    </select>
                                    {this.state.volume_list_loader && <i className="fas fa-circle-notch icon-loading drop-loader"></i>}
                                    <a href="javascript:void(0)" className="anch-link small-anch-link" onClick={() => this.openCreateVolumeModalClick()}>Add New Volume</a>
                                    <Modal
                                    isOpen={this.state.modalIsVolumeOpen}
                                    onRequestClose={this.closeCreateVolumeModalClick}
                                    >
                                        <h2>
                                            Add Volume<a className="float-right" href="javascript:void(0);" onClick={this.closeCreateVolumeModalClick}><i className="fa fa-times" /></a>
                                        </h2>

                                        <div className="col-md-12">
                                            <div className="panel panel-default" />
                                            <form
                                            name="addNewVolume"
                                            id="addNewVolume"
                                            method="post"
                                            >
                                            <div className="form-group position-relative">
                                                <label htmlFor="subscription">Region<span className="star-mark">*</span></label>
                                                <input
                                                    type="text"
                                                    className="form-control input-disabled"
                                                    value={this.state.region_name}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="form-group position-relative">
                                                <label htmlFor="subscription">Availability Zone<span className="star-mark">*</span></label>
                                                <select
                                                className="form-control"
                                                name="availabilityZone"
                                                required
                                                >
                                                <option selected="true" value="">-Select-</option>
                                                {this.state.availability_zone_list && this.state.availability_zone_list.length > 0 && this.state.availability_zone_list.map((row, index) =>
                                                    <option  value={row.zoneName}>
                                                        {row.zoneName}
                                                    </option>
                                                )}
                                                </select>
                                                { this.state.is_availability_zone_loading && 
                                                <i className="fas fa-circle-notch icon-loading form-drp-loader-icon"></i>
                                                }
                                            </div>
                                            <div className="form-group position-relative">
                                                <label htmlFor="subscription">Volume Type<span className="star-mark">*</span></label>
                                                <select
                                                className="form-control"
                                                name="volumeType"
                                                required
                                                >
                                                <option value="">-Select-</option>
                                                <option value="standard">Standard</option>
                                                <option value="io1">io1</option>
                                                <option value="gp2">gp2</option>
                                                <option value="sc1">sc1</option>
                                                <option value="st1">st1</option>
                                                </select>
                                            </div>
                                            <div className="form-group position-relative">
                                                <label htmlFor="name">Size (GB)<span className="star-mark">*</span></label>
                                                <input
                                                type="text"
                                                className="form-control"
                                                name="size"
                                                required      
                                                onChange={(e) => this.allowOnlyNumbers(e, "diskSizeGB")}
                                                value={this.state.diskSizeGB}                  
                                                placeholder="Ex: 30"
                                                />

                                                <span className="txt-right-placeholder">1 GB = 
                                                    {!this.state.isCurrentPriceLoading &&
                                                    <span className="currency-symbol font-weight-bold color pl-1">{commonFns.fnFormatCurrency(this.state.priceFor1GBVolume)}</span>
                                                    }
                                                    {this.state.isCurrentPriceLoading &&
                                                    <React.Fragment>
                                                        <span className="currency-symbol font-weight-bold color pl-1">{commonFns.fnFormatCurrency(this.state.priceFor1GBVolume, 0, true)}</span>
                                                        <i className="fas fa-circle-notch icon-loading form-drp-loader-icon price-loading-on-form"></i>
                                                    </React.Fragment>
                                                    }
                                                </span>
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="name">IOPS<span className="star-mark">*</span></label>
                                                <input
                                                type="text"
                                                className="form-control"
                                                name="iops"
                                                required      
                                                onChange={(e) => this.allowOnlyNumbers(e, "IOPS")}
                                                value={this.state.IOPS}                  
                                                placeholder="Ex: 100"
                                                />
                                            </div>        
                                            <div className="form-group">
                                                <input type="hidden" name="clientid" value={this.state.clientid} />
                                                <input type="hidden" name="regionName" value={this.state.regionid} />
                                                <button 
                                                className={"btn btn-sm btn-primary " + (this.state.is_add_item_inprogress ? "no-access" : "")} disabled={this.state.is_add_item_inprogress ? true : false} 
                                                onClick={this.addNewVolume}>
                                                {this.state.is_add_item_inprogress &&
                                                    <i className="fas fa-circle-notch icon-loading"></i>}
                                                Submit</button>

                                                <label className="total-price-right">
                                                    Price:
                                                    <span className="currency-symbol color ml-2 font-weight-bold">
                                                    {commonFns.fnFormatCurrency(this.state.priceFor1GBVolume * (this.state.diskSizeGB ? this.state.diskSizeGB : 0))}
                                                    </span>
                                                </label>
                                            </div>
                                            </form>
                                        </div>
                                    </Modal>
                                </div>
                            </div>            
                        </div>
                    </div>
                    
                    <div className="row">
                    <div className="col-lg-6">
                            <div className="form-group row">
                            <label htmlFor="cpu" className='col-sm-3 col-form-label'>Instance Type<span className="star-mark">*</span></label>
                            <div className="col-sm-9">
                                    <div onClick={this.instanceTypeDrpClick} className={"form-control-vm custom-auto-drp-down " + (this.state.instance_type_drp_active && "active")}>
                                        <div className="custom-auto-drp-down-select-option-skip custom-auto-drp-down-select-option">
                                            <div title={this.state.instance_type_name && this.state.instance_type_name.length > 50 && this.state.instance_type_name} className="custom-auto-drp-option custom-auto-drp-down-select-option-skip">
                                                {(this.state.instance_type_name ? (this.state.instance_type_name.length > 50? (this.state.instance_type_name.slice(0,50) + "...") : this.state.instance_type_name) : "--SELECT--")}
                                            </div>
                                            <i className="fa fa-chevron-right custom-auto-drp-down-arrow"></i>
                                            {this.state.instance_type_list_loader && <i className="fas fa-circle-notch custom-auto-drp-data-loading icon-loading"></i> }
                                        </div>
                                        <div className="custom-auto-drp-down-options-wrapper">
                                            <div className="skip-propagation">
                                                <input type="text" onChange={e => this.instanceTypeSearchChange(e)} placeholder="Search" className="custom-auto-drp-down-search-textbox skip-propagation" />
                                            </div>
                                            {this.state.instance_type_list && this.state.instance_type_list.length > 0 && this.state.instance_type_list.map((row, index) =>
                                                <React.Fragment>
                                                {this.state.os_architecture == row.supportedArchitectures &&
                                                    <div onClick={e => this.instanceTypeClick(e.target)}
                                                    className={"custom-auto-drp-down-options overflow-wrap " + (row.instanceType == this.state.instanceType && "custom-auto-drp-down-selected")}
                                                    name={row.instanceType}
                                                    price={(this.state.platform == "windows" ? row.windows_price : row.linux_price)} cpus={row.cores} ram={row.memoryInMB} disksize={row.totalSizeInGB} value={row.instanceType}>
                                                        {row.instanceType}
                                                    </div>
                                                }
                                                </React.Fragment>
                                            )}
                                            {(!this.state.instance_type_list || this.state.instance_type_list.length == 0) &&
                                                <div className="custom-auto-drp-down-options no-selection">
                                                    No Data Available
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                                <div className="col-sm-9 position-relative hide">
                                    <select
                                    className="form-control-vm"
                                    onChange={e => this.instanceTypeChange(e.target)}
                                    >
                                    <option selected="true" value="">--SELECT--</option>
                                    {this.state.instance_type_list && this.state.instance_type_list.length > 0 && this.state.instance_type_list.map((row, index) =>
                                        <React.Fragment>
                                            {this.state.os_architecture == row.supportedArchitectures &&
                                                <option price={(this.state.platform == "windows" ? row.windows_price : row.linux_price)} cpus={row.cores} ram={row.memoryInMB} disksize={row.totalSizeInGB} value={row.instanceType}>
                                                    {row.instanceType}
                                                </option>
                                            }
                                        </React.Fragment>
                                    )}
                                    </select>
                                    {this.state.instance_type_list_loader && <i className="fas fa-circle-notch icon-loading drop-loader"></i>}
                                </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="form-group row">
                                <label className='col-sm-3  col-form-label'>VM Name<span className="star-mark">*</span></label>
                                <div className="col-sm-9">
                                    <input type="text" placeholder="Ex: AwsNewVM" autoComplete="off" name="vmName" className="form-control-vm"  
                                    onBlur={() => this.vmNameBlur()} 
                                    onChange={e => this.vmNameChange(e.target)} value={this.state.vmName} />
                                    {
                                        this.state.vmNameValidate == "checking" &&
                                        <i className="fas fa-circle-notch icon-loading txt-loader-icon"></i>
                                    }
                                    {
                                        this.state.vmNameValidate == "fail" && 
                                        <i title={this.state.vmValidationName} className="fa fa-exclamation-triangle txt-error-icon txt-loader-icon"></i>
                                    }
                                    {
                                        this.state.vmNameValidate == "success" && 
                                        <i title="VM name validated" className="fa fa-check-circle txt-loader-icon txt-succses-icon"></i>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </React.Fragment>
            </div>
            
            <div className="form-group row mt-4 pb-4">
                <div className="col-lg-6">
                    <div className="form-group row">
                        <div className="col-sm-12">
                        </div>
                    </div>
                </div>
                <div className="col-lg-6">
                    <div className="form-group row">
                        <label htmlFor="cloud_type" className='col-sm-3  col-form-label display-only-desktop'>Price</label>
                        <div className="col-sm-9 line-height">
                            <strong>
                                <span className="display-only-mobile pr-1 price-mobile-text">Price:</span>
                                <span id="priceText" className="currency-symbol color">
                                    {commonFns.fnFormatCurrency((Number(this.state.instance_type_price ? this.state.instance_type_price : 0) + Number(this.state.os_price ? this.state.os_price : 0)))}
                                </span>
                            </strong>
                            <button className={"ml-2 btn btn-primary float-right " + (this.state.isCartAddingInprogress ? "no-access" : "")} disabled={this.state.isCartAddingInprogress ? true : false}
                            >
                                {this.state.isCartAddingInprogress && <i className="fas fa-circle-notch icon-loading"></i> }
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { azure } = state;
  return {
    azure:azure
  };
}

const connectedNewVMInstance = connect(mapStateToProps)(awsNewVMInstance);
export { connectedNewVMInstance as awsNewVMInstance };