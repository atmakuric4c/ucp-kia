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
import PageLoader from '../PageLoader';
import { MDBDataTable } from 'mdbreact';

Modal.setAppElement("#app");
class gcpNewVMInstance extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      user: user,
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,

      project_id: "",
      project_list: [],
      project_list_loading: true,

      region_id: "",
      region_name: "",
      region_list: [],
      backup_region_list: [],
      region_drp_active: false,
      region_list_loading: false,

      zone_id: "",
      zone_name: "",
      zone_list: [],
      backup_zone_list: [],
      zone_drp_active: false,
      zone_list_loading: false,

      vm_name: "",
      vmNameValidate: "",
      vmValidationName: "",

      machine_id: "",
      machine_list: [],
      machine_list_loading: false,
      machine_grid_list: "",
      machine_cpu: 0,
      machine_ram: 0,
      machine_price: 0,
      machine_name: "",

      image_id: "",
      image_os_template_id: "",
      image_name: "",
      image_size: 0,
      image_price: 0,
      image_list: [],
      image_grid_list: "",
      image_list_loading: false,
      os_filter_in_progress: false,
      os_filter_list: [],

      showNetworkGroup: false,
      network_id: "",
      network_list: [],
      network_list_loading: false,
      modalIsCreateNetworkOpen: false,
      is_network_add_inprogress: false,
      addNetworkName: "",

      subnet_id: "",
      subnet_list: [],
      subnet_list_loading: false,
      modalIsCreateSubnetOpen: false,
      is_subnet_add_inprogress: false,
      addSubnetName: "",
    };
  }

  AddToCart = (e) => {
    e.preventDefault();

    var form = document.querySelector("#gcpAddDisk");
    var frmData = serialize(form, { hash: true });

    if(!this.state.project_id){
        toast.error("Please select Project");
        return;
    }
    else if(!this.state.region_id){
        toast.error("Please select Region");
        return;
    }
    else if(!this.state.zone_id){
        toast.error("Please select Zone");
        return;
    }
    else if(!this.state.vm_name){
        toast.error("Please enter VM Name");
        return;
    }
    else if(this.state.vm_name.length < 4){
        toast.error("VM Name should be atleast 5 characters");
        return;
    }
    else if(this.state.vmNameValidate == "checking"){
        toast.warn("Please wait, VM Name is Validating");
        return;
    }
    else if(this.state.vmNameValidate != "success"){
        toast.error("Please enter valid VM Name");
        return;
    }
    else if(!frmData.image_type){
        toast.error("Please select Image Type");
        return;
    }
    else if(!this.state.image_id){
        toast.error("Please select Image");
        return;
    }
    else if(!this.state.machine_id){
        toast.error("Please select Machine Type");
        return;
    }
    else if(!frmData.networkType){
        toast.error("Please select Network Type");
        return;
    }

    if(frmData.networkType == "withNetwork"){
      if(!this.state.network_id){
        toast.error("Please select Network");
        return;
      }
      else if(!this.state.subnet_id){
        toast.error("Please select Subnet");
        return;
      }
    }
    
    this.setState({
        isCartAddingInprogress: true
    });
    
    let newformData = {
      "cloud_id" : 5,
      "cart_items" : {
          clientid: this.state.clientid,
          instanceName: frmData.vmName,
          projectId: this.state.project_id,
          zoneName: this.state.zone_id,
          machineType: this.state.machine_name,
          imageId: this.state.image_id,
          regionName: this.state.region_id,
          networkType: frmData.networkType,
          cpus: this.state.machine_cpu,
          ram: this.state.machine_ram,
          disksize: this.state.image_size
      },
      "clientid": this.state.clientid,
      "user_id": this.state.user_id,
      "billing_type": "MONTHLY",
      "os_template_id": this.state.image_os_template_id,
      "cloud_type": "GCP",
      "price" : (Number(this.state.image_price ? this.state.image_price : 0) + Number(this.state.machine_price ? this.state.machine_price : 0)) // sum of os price and vmsize price(based on os platform pick windows_price or linux_price)
      };

    if(frmData.networkType == "withNetwork"){
      newformData.cart_items.networkName = this.state.network_id;
      newformData.cart_items.subnetName = this.state.subnet_id;
    }
    
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(newformData))
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
    this.calGcpApis({clientid: this.state.clientid}, "get_gcp_project_list" , "project_list", "project_list_loading" );
    
    document.getElementById("body_wrapper").addEventListener("click", (e) => {
        if(e.target.className && (e.target.className.indexOf("skip-propagation") != -1 || e.target.className.indexOf("custom-auto-drp-down-select-option-skip") != -1)){
            return false;
        }
    
        this.setState({
            region_drp_active: false,
            zone_drp_active: false,
            instance_type_drp_active: false
        });
    });
  }
  
  calGcpApis(frmData, apiName, stateName, stateLoading, backupStateName, resetValue){
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
    
    fetch(`${config.apiUrl}/secureApi/gcp/` + apiName, requestOptions).then(response  => this.handleResponse(response, stateName, stateLoading, backupStateName, resetValue));
  }

  handleResponse(response, stateName, stateLoading, backupStateName, resetValue) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if (!response.ok) {
            //
        }
        else if(data && data.success == 0){
            //return false;
        }
        else{
          if(stateName == "network_list"){
            this.setState({
                [stateName]: (data && data.data && data.data.items ? data.data.items : [])
            });
          }
          else{
            this.setState({
                [stateName]: (data.data ? data.data : data)
            });
          }

          if(stateName == "subnet_list"){
              let newNetworkList = this.state.network_list;
              for(let i = 0; i <  newNetworkList.length; i++){
                if(newNetworkList[i].name == this.state.network_id){
                    newNetworkList[i].subnetworks = (data.data ? data.data : data);
                    break;
                }
              }
              this.setState({
                network_list: newNetworkList
              });
          }

          if(backupStateName){
            this.setState({
             [backupStateName]: (data.data ? data.data : data)
            });
          }

          if(stateName == "machine_list"){
            setTimeout(() => {
               this.updateMachineType();
            }, 10);
          }

          if(stateName == "image_list"){
            setTimeout(() => {                
                this.updateImage();
            }, 10);
          }

          if(resetValue){
            if(stateName == "network_list"){
                setTimeout(() => {
                    if($("#gcpNetwork option[value='" + resetValue + "']").length){
                        $("#gcpNetwork").val(resetValue);
                        this.network_Change("", resetValue);

                        toast.info("Newly created Network has been auto-selected !");
                    }
                }, 1000);
            }

            if(stateName == "subnet_list"){
                setTimeout(() => {
                    if($("#gcpSubnet option[value='" + resetValue + "']").length){
                        $("#gcpSubnet").val(resetValue);
                        this.setState({
                            subnet_id: resetValue
                        });
                        
                        toast.info("Newly created Subnet has been auto-selected !");
                    }
                }, 1000);
            }
          }
        }

        if(stateLoading){
            if(stateName == "machine_list" || stateName == "image_list")
                return
            
            this.setState({
                [stateLoading]: false
            });
        }
    });
  }

  projectChange(target){
    $("#networkType").val("");
    this.emptyVmName();
    this.emptyNetwork();
    this.emptySubnet();

    this.setState({
        project_id: target.value
    });

    this.emptyRegion();
    this.emptyZone();
    this.emptyMachine();

    if(target.value){        
        this.calGcpApis({clientid : this.state.clientid, projectId : target.value }, "get_gcp_regions_list" , "region_list", "region_list_loading", "backup_region_list" );
    }
  }

  /*Start: Region*/
    emptyRegion = () => {
      this.setState({
          region_id: "",
          region_name: "",
          region_list: [],
          backup_region_list: [],
          region_drp_active: false,
          region_list_loading: false
      });
    }

    regionDrpClick = (e) => {
      if(e.target.className && e.target.className.indexOf("skip-propagation") != -1){
          return false;
      }

      if(e.target.className && e.target.className.indexOf("custom-auto-drp-down-options") != -1){
          this.setState({
              region_drp_active: false
          });
      }
      else{
          setTimeout(() => {
              this.setState({
                  region_drp_active: !this.state.region_drp_active
              });
          }, 0);        
      }
    }

    regionDrpSearchChange = (e) => {
        let value = (e.target.value ? e.target.value.toLowerCase() : "");
        let region_list = JSON.parse(JSON.stringify(this.state.backup_region_list));
        let filtered_region_list = [];
        for(let row = 0; row < region_list.length; row++){
          if(region_list[row].name.toLowerCase().indexOf(value) != -1){
              filtered_region_list.push(region_list[row]);
          }
        }

        this.setState({
            region_list: filtered_region_list
        });
    }

    regionClick(target){
      this.emptyVmName();
      this.emptyZone();
      this.emptyMachine();
      this.emptySubnet();

      if($(target).attr("value")){
          let value = $(target).attr("value");
          let name = $(target).attr("name");

          this.setState({
              region_id: value,
              region_name: name,
          });

          this.calGcpApis({clientid : this.state.clientid, projectId : this.state.project_id, region : value }, "get_gcp_zones_list" , "zone_list", "zone_list_loading", "backup_zone_list" );
          this.bindSubnetList();
      }
    }
  /*End: Region*/

  /*start: Zone*/
    emptyZone = () => {
      this.setState({
        zone_id: "",
        zone_name: "",
        zone_list: [],
        backup_zone_list: [],
        zone_drp_active: false,
        zone_list_loading: false
      });
    }

    zoneDrpClick = (e) => {
      if(e.target.className && e.target.className.indexOf("skip-propagation") != -1){
          return false;
      }

      if(e.target.className && e.target.className.indexOf("custom-auto-drp-down-options") != -1){
          this.setState({
              zone_drp_active: false
          });
      }
      else{
          setTimeout(() => {
              this.setState({
                  zone_drp_active: !this.state.zone_drp_active
              });
          }, 0);        
      }
    }

    zoneDrpSearchChange = (e) => {
        let value = (e.target.value ? e.target.value.toLowerCase() : "");
        let zone_list = JSON.parse(JSON.stringify(this.state.backup_zone_list));
        let filtered_zone_list = [];
        for(let row = 0; row < zone_list.length; row++){
          if(zone_list[row].name.toLowerCase().indexOf(value) != -1){
              filtered_zone_list.push(zone_list[row]);
          }
        }

        this.setState({
          zone_list: filtered_zone_list
        });
    }

    zoneClick(target){  
      this.emptyVmName();
      this.emptyMachine();

      if($(target).attr("value")){
          let value = $(target).attr("value");
          let name = $(target).attr("name");

          this.setState({
              zone_id: value,
              zone_name: name,
          });


          this.calGcpApis({clientid : this.state.clientid, projectId : this.state.project_id, zone: value, currency_id: this.state.user.data.currency_id}, "get_gcp_machinetype_list" , "machine_list", "machine_list_loading" );
      }
    }
  /*end: Zone*/

  /*Start: VM Name*/
  emptyVmName = () => {
    this.setState({
        vmNameValidate: "",
        vm_name: ""
    });
  }

  vmNameChange = (e) =>{
    let val = e.target.value;
    val = val ? val.toLowerCase() : val;
    var letterNumber = /^[0-9a-z]+$/;
    if(val == ""){
        this.setState({
            vm_name: ""
        })
    }
    else if((val.match(letterNumber))){
        this.setState({
            vm_name: val
        })
    }
  }

  vmNameBlur(){
      setTimeout(() => {
        this.setState({
            vmNameValidate: "checking"
        });
      }, 0);

      let validationName = "";

      if(!this.state.vm_name){
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
      else if(this.state.vm_name.length < 4){
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
            clientid:this.state.clientid,
            projectId:this.state.project_id,
            zoneName: this.state.zone_name,
            vmName: this.state.vm_name
        }
        
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(ucpEncrypt(frmData))
        };

        fetch(`${config.apiUrl}/secureApi/gcp/validateVmName`, requestOptions).then(response  => {
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
  /*End: VM Name*/

  /*Start:Machine*/
    emptyMachine = () =>{
        this.setState({
          machine_name: "",
          machine_id: "",
          machine_list: [],        
          machine_cpu: "",
          machine_ram: "",
          machine_price: 0,
          machine_list_loading: false,
          machine_grid_list: "",
        });
    }

    machine_type_popup = () =>{
        if(!this.state.zone_id){
            toast.warn("Please select Zone");
            return;
        }

        this.setState({ is_machine_type_popup: true });

        if(!this.state.machine_list_loading)
            this.updateMachineType();
    }

    machine_type_popupCloseModal = () =>{
        this.setState({ is_machine_type_popup: false });
    }

    updateMachineType(){
        let rows = [];
    
        let data = this.state.machine_list;
    
        for(let num = 0; num < data.length; num++){
            let row = data[num];
            
            rows.push({
                action: <input id={"radioMachineType" + num} checked={(row.machineId == this.state.machine_id ?  true : false)} onChange={e => this.machineType_Change(
                    "radioMachineType" + num,
                    row.name,
                    row.machineId,
                    row.guestCpus, 
                    row.memoryMb,
                    row.price)}
                style={{ height: '20px', width: '20px'}} type="radio" name="machine_type" value={row.name} />,
                name: row.name,
                description: row.description,
                guestCpus: row.guestCpus,
                memoryMb: (row.memoryMb ? (row.memoryMb >= 1024 ? row.memoryMb/1024 : row.memoryMb) : "0") + (row.memoryMb >= 1024 ? " GB" : " MB"),
                price: commonFns.fnFormatCurrency(Number(row.price))
            });
        }
        
        this.setState({
            machine_grid_list: {
                columns: [
                {
                    label: '',
                    field: 'action'
                },
                {
                    label: 'Machine Name',
                    field: 'name',
                },
                {
                    label: 'Description',
                    field: 'description',
                },
                {
                    label: 'CPU Cores',
                    field: 'guestCpus'
                },
                {
                    label: 'RAM',
                    field: 'memoryMb'
                },
                {
                    label: 'Price',
                    field: 'price'
                }
            ],
            rows: rows
            }
        });

        this.setState({
            machine_list_loading: false
        });
      }

      machineType_Change = (id, name, machine_id, machine_cpu, machine_ram, machine_price) => {
        setTimeout(() => {
            $("#"+id).prop("checked", true);
        }, 0);
        
        
        this.setState({
            machine_id: machine_id,
            machine_name: name,
            machine_cpu: machine_cpu,
            machine_ram: machine_ram,
            machine_price: machine_price
        });
      }
  /*End: Machine*/

  /*Start: Image*/  
    emptyImage = () => {
      this.setState({
          image_id: "",
          image_os_template_id: "",
          image_name: "",
          image_size: 0,
          image_price: 0,
          image_list: [],
          image_grid_list: "",
          image_list_loading: false
      });
    }

    imageTypeChange(target){
      this.emptyImage();

      if(target.value){
          this.calGcpApis({clientid : this.state.clientid, image_type : target.value, currency_id: this.state.user.data.currency_id }, "get_gcp_images_list" , "image_list", "image_list_loading");
      }
    }

    image_popup = () =>{
        if(!$("#image_type").val()){
            toast.warn("Please select Image Type");
            return;
        }

        this.setState({ is_image_popup: true });

        if(!this.state.image_list_loading)
            this.updateImage();
    }

    image_popupCloseModal = () =>{
        this.setState({ is_image_popup: false });
    }

    os_filter_Change(target){
        this.setState({
            os_filter_in_progress: true
        });

        this.updateImage(target.value, "os_filter");
    }

    updateImage(os_type, isFilterCall){
        let rows = [];
    
        let data = this.state.image_list;

        let os_filter_list = [];
    
        for(let num = 0; num < data.length; num++){
            let row = data[num];
            
            if(!os_type || os_type == row.os_type){
                rows.push({
                    action: <input id={"radioImage" + num} checked={(row.image_id == this.state.image_id ?  true : false)} onChange={e => this.image_Change(
                        "radioImage" + num,
                        row.image_name,
                        row.image_id,
                        row.id,
                        row.diskSizeGb, 
                        row.price)}
                    style={{ height: '20px', width: '20px'}} type="radio" name="radio_image" value={row.name} />,
                    name: row.image_name,
                    os_type: <div className="text-capitalize">{row.os_type}</div>,
                    backup_os_type: row.os_type,
                    diskSizeGb: row.diskSizeGb + " GB",
                    price: commonFns.fnFormatCurrency(Number(row.price))
                });

                if(!isFilterCall && os_filter_list.indexOf(row.os_type) == -1)
                    os_filter_list.push(row.os_type);
            }
        }
        
        this.setState({
            image_grid_list: {
                columns: [
                {
                    label: '',
                    field: 'action'
                },
                {
                    label: 'Image Name',
                    field: 'name',
                },
                {
                    label: 'OS Type',
                    field: 'os_type',
                },
                {
                    label: 'Disk',
                    field: 'diskSizeGb'
                },
                {
                    label: 'Price',
                    field: 'price'
                }
              ],
              rows: rows
            }
        });

        if(!isFilterCall){
            this.setState({
                os_filter_list: os_filter_list
            });
        }

        this.setState({
            image_list_loading: false,
            os_filter_in_progress: false
        });
      }

      image_Change = (id, name, image_id, image_os_template_id, image_size, image_price) => {
        setTimeout(() => {
            $("#"+id).prop("checked", true);
        }, 0);
        
        
        this.setState({
            image_id: image_id,
            image_name: name,
            image_os_template_id: image_os_template_id,
            image_size: image_size,
            image_price: image_price
        });
      }

  /*End: Image*/

  /**Start: Network*/
    emptyNetwork = () => {
      this.setState({
          network_id: "",
          network_list: [],
          network_list_loading: false,
          showNetworkGroup: false
      });
    }

    networkType_Change(target){
      this.emptyNetwork();

      if(target.value == "withNetwork"){
          this.setState({
            showNetworkGroup: true
          });

          this.calGcpApis({clientid : this.state.clientid, projectId : this.state.project_id }, "getNetworkList" , "network_list", "network_list_loading");
      }
    }

    network_Change(target, value){
      this.emptySubnet();

      let val = (value ? value : target.value);

      if(val){
          this.setState({
            network_id: val
          });

          this.bindSubnetList();

          /*this.setState({
              subnet_list: this.state.network_list[$($(target)[0].options[$(target)[0].selectedIndex]).attr("index")].subnetworks
          });*/
      }
      else{
          this.setState({
              network_id: ""
          })
      }
    }
    
    openCreateNetworkModalClick = () => {
        if(!this.state.project_id){
            toast.warn("Please select Project to Create Network");
            return;
        }

        this.setState({ modalIsCreateNetworkOpen: true, addNetworkName: "" });
    }

    closeCreateNetworkModalClick = () => {
        this.setState({ modalIsCreateNetworkOpen: false });
    }

    handleAddNetworkName(e){
        let val = e.value.toLowerCase();;
        var letterNumber = /^[0-9a-z]+$/;
        if(val == ""){
            this.setState({
                addNetworkName: ""
            })
        }
        else if((val.match(letterNumber))){
            this.setState({
                addNetworkName: val
            })
        }
    }
    
    addNetwork = () => {    
        if(!$("#networkName").val()){
            toast.error("Please enter Network");
            return;
        }

        if($("#networkName").val().length < 4){
            toast.error("Network Name should be at least 4 characters");
            return;
        }

        var frmData = {
            clientid: this.state.clientid,
            projectId: this.state.project_id,
            networkName: $("#networkName").val(),
            autoCreateSubnetworks: false
        };

        this.setState({
            is_network_add_inprogress: true
        });
        
        const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
        };

        fetch(`${config.apiUrl}/secureApi/gcp/createNetwork`, requestOptions).then(response  => this.handleAddNetworkResponse(response, $("#networkName").val()));
    }
    
    handleAddNetworkResponse(response, newitem) {
        return response.text().then(data => {
        
        data = (data && JSON.parse(data) ? JSON.parse(data) : "");

        this.setState({
            is_network_add_inprogress: false
        });

        if(!data.success){
            toast.error(data.message ? data.message : "Unable to Add Network");
        }
        else {
            toast.success((data.message ? data.message : "Network has been added Successfully!"));
            this.closeCreateNetworkModalClick();

            this.calGcpApis({clientid : this.state.clientid, projectId : this.state.project_id }, "getNetworkList" , "network_list", "network_list_loading", "", newitem);
         }
      });
    }
  /*End: Netwrok*/

  /*Start: Subnet*/
    emptySubnet = () => {
      this.setState({
          subnet_id: "",
          subnet_list: [],
          subnet_list_loading: false
      });
    }

    subnet_Change(target){   
      this.setState({
        subnet_id: target.value
      });
    }

    handleAddSubnetName(target){
        let val = target.value.toLowerCase();
        var letterNumber = /^[0-9a-z]+$/;
        if(val == ""){
            this.setState({
                addSubnetName: ""
            })
        }
        else if((val.match(letterNumber))){
            this.setState({
                addSubnetName: val
            })
        }
    }

    bindSubnetList(){
        setTimeout(() => {
            if(this.state.project_id && this.state.network_id && this.state.region_id){
                    this.calGcpApis({clientid : this.state.clientid, projectId : this.state.project_id, networkName: this.state.network_id, regionName: this.state.region_id}, "getSubnetList" , "subnet_list", "subnet_list_loading");
            }
        }, 0);
    }

    openCreateSubnetModalClick = () => {
        if(!this.state.project_id){
            toast.warn("Please select Project to Create Subnet");
            return;
        }

        if(!this.state.region_id){
            toast.warn("Please select Region to Create Subnet");
            return;
        }

        if(!this.state.network_id){
            toast.warn("Please select Network to Create Subnet");
            return;
        }

        this.setState({ modalIsCreateSubnetOpen: true, addSubnetName: "" });
    }

    closeCreateSubnetModalClick = () => {
        this.setState({ modalIsCreateSubnetOpen: false });
    }
    
    addSubnet = () => {
        if(!$("#subnetName").val()){
            toast.error("Please enter Subnet");
            return;
        }
        
        if($("#subnetName").val().length < 4){
            toast.error("Subnet Name should be at least 4 characters");
            return;
        }

        if(!$("#ipCidrRange").val()){
            toast.error("Please enter IP CIDR Range");
            return;
        }

        var frmData = {
            clientid: this.state.clientid,
            projectId: this.state.project_id,
            regionName: this.state.region_id,
            networkName: this.state.network_id,
            subnetName: $("#subnetName").val(),
            ipCidrRange: $("#ipCidrRange").val()
        };

        this.setState({
            is_subnet_add_inprogress: true
        });
        
        const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(frmData)
        };

        fetch(`${config.apiUrl}/secureApi/gcp/createSubnet`, requestOptions).then(response  => this.handleAddSubnetResponse(response, $("#subnetName").val()));
    }
    
    handleAddSubnetResponse(response, newitem) {
        return response.text().then(data => {
            data = (data && JSON.parse(data) ? JSON.parse(data) : "");

            this.setState({
                is_subnet_add_inprogress: false
            });

            if(!data.success){
                toast.error(data.message ? data.message : "Unable to Add Subnet");
            }
            else {
                toast.success((data.message ? data.message : "Subnet Added Successfully!"));
                this.closeCreateSubnetModalClick();

                this.calGcpApis({clientid : this.state.clientid, projectId : this.state.project_id, networkName: this.state.network_id, regionName: this.state.region_id}, "getSubnetList" , "subnet_list", "subnet_list_loading", "", newitem);
            }
        });
    }
  /*End: Subnet*/
  
  render() {
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">Google Cloud - New VM Instance</h5>
          <form
            name="gcpAddDisk"
            id="gcpAddDisk"
            method="post"
            onSubmit={this.AddToCart}
            className="mt-4 mb-4"
          >
            <div>
                <React.Fragment>
                    <div className="row">                        
                        <div className="col-lg-6">
                            <div className="form-group row">
                                <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Project<span className="star-mark">*</span></label>
                                <div className="col-sm-9 position-relative">
                                    <select
                                    className="form-control-vm"
                                    onChange={e => this.projectChange(e.target)}
                                    >
                                    <option selected="true" value="">--SELECT--</option>
                                    {this.state.project_list && this.state.project_list.length > 0 && this.state.project_list.map((row, index) =>
                                        <option value={row.projectId}>
                                            {row.name}
                                        </option>
                                    )}
                                    </select>

                                    {this.state.project_list_loading && <i className="fas fa-circle-notch icon-loading drop-loader"></i>}
                                </div>
                            </div>
                        </div>      
                        <div className="col-lg-6">
                            <div className="form-group row">
                                <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Region<span className="star-mark">*</span></label>
                                <div className="col-sm-9">
                                    <div onClick={this.regionDrpClick} className={"form-control-vm custom-auto-drp-down " + (this.state.region_drp_active && "active")}>
                                        <div className="custom-auto-drp-down-select-option-skip custom-auto-drp-down-select-option">
                                            <div title={this.state.region_name && this.state.region_name.length > 50 && this.state.region_name} className="custom-auto-drp-option custom-auto-drp-down-select-option-skip">
                                                {(this.state.region_name ? (this.state.region_name.length > 50? (this.state.region_name.slice(0,50) + "...") : this.state.region_name) : "--SELECT--")}
                                            </div>
                                            <i className="fa fa-chevron-right custom-auto-drp-down-arrow"></i>
                                            {this.state.region_list_loading && <i className="fas fa-circle-notch custom-auto-drp-data-loading icon-loading"></i> }
                                        </div>
                                        <div className="custom-auto-drp-down-options-wrapper">
                                            <div className="skip-propagation">
                                                <input type="text" onChange={e => this.regionDrpSearchChange(e)} placeholder="Search" className="custom-auto-drp-down-search-textbox skip-propagation" />
                                            </div>
                                            {this.state.region_list && this.state.region_list.length > 0 && this.state.region_list.map((row, index) =>
                                                <div onClick={e => this.regionClick(e.target)} className={"custom-auto-drp-down-options overflow-wrap " + (row.name == this.state.region_id && "custom-auto-drp-down-selected") } value={row.name} name={row.name}>
                                                    {(row.name)}
                                                </div>
                                            )}
                                            {(!this.state.region_list || this.state.region_list.length == 0) &&
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
                                <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Zone<span className="star-mark">*</span></label>
                                <div className="col-sm-9">
                                    <div onClick={this.zoneDrpClick} className={"form-control-vm custom-auto-drp-down " + (this.state.zone_drp_active && "active")}>
                                        <div className="custom-auto-drp-down-select-option-skip custom-auto-drp-down-select-option">
                                            <div title={this.state.zone_name && this.state.zone_name.length > 50 && this.state.zone_name} className="custom-auto-drp-option custom-auto-drp-down-select-option-skip">
                                                {(this.state.zone_name ? (this.state.zone_name.length > 50? (this.state.zone_name.slice(0,50) + "...") : this.state.zone_name) : "--SELECT--")}
                                            </div>
                                            <i className="fa fa-chevron-right custom-auto-drp-down-arrow"></i>
                                            {this.state.zone_list_loading && <i className="fas fa-circle-notch custom-auto-drp-data-loading icon-loading"></i> }
                                        </div>
                                        <div className="custom-auto-drp-down-options-wrapper">
                                            <div className="skip-propagation">
                                                <input type="text" onChange={e => this.zoneDrpSearchChange(e)} placeholder="Search" className="custom-auto-drp-down-search-textbox skip-propagation" />
                                            </div>
                                            {this.state.zone_list && this.state.zone_list.length > 0 && this.state.zone_list.map((row, index) =>
                                                <div onClick={e => this.zoneClick(e.target)} className={"custom-auto-drp-down-options overflow-wrap " + (row.name == this.state.zone_id && "custom-auto-drp-down-selected") } value={row.name} name={row.name}>
                                                    {(row.name)}
                                                </div>
                                            )}
                                            {(!this.state.zone_list || this.state.zone_list.length == 0) &&
                                                <div className="custom-auto-drp-down-options no-selection">
                                                    No Data Available
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>                     
                        <div className="col-lg-6">
                            <div className="form-group row">
                                <label className='col-sm-3  col-form-label'>VM Name<span className="star-mark">*</span></label>
                                <div className="col-sm-9">
                                    <input disabled={ !this.state.zone_id ? true : false} type="text" placeholder="Ex: gcpvm1" autoComplete="off" name="vmName" className={"form-control-vm " + (!this.state.zone_id && "no-access")} onBlur={() => this.vmNameBlur()} onChange={this.vmNameChange} value={this.state.vm_name} />
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
                    <div className="row">
                        <div className="col-lg-6">
                            <div className="form-group row">
                                <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Image Type<span className="star-mark">*</span></label>
                                <div className="col-sm-9 position-relative">
                                    <select
                                    className="form-control-vm"
                                    name="image_type"
                                    id="image_type"
                                    onChange={e => this.imageTypeChange(e.target)}
                                    >
                                        <option value="">--SELECT--</option>
                                        <option value="private">Custom</option>
                                        <option value="public">Global</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="form-group row">
                                <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Image<span className="star-mark">*</span></label>
                                <div className="col-sm-9 pt-2 overflow-wrap">
                                    {this.state.image_name && <i className="color-white pr-4">{this.state.image_name}</i> }
                                    <a href="javascript:void(0)" className="anch-link" onClick={this.image_popup}>{ (this.state.image_name ? "Change" : "Select") } Image</a>
                                    <Modal
                                        isOpen={this.state.is_image_popup}
                                        onRequestClose={this.image_popupCloseModal}
                                        >
                                        <h2 style={{lineHeight:1.6+ 'em' }}>
                                            Image <a className="float-right" href="javascript:void(0);" onClick={this.image_popupCloseModal}><span className="btn btn-primary">Save</span></a>
                                        </h2>
                                        
                                        { this.state.image_list_loading ? <PageLoader/> :
                                          <React.Fragment>
                                            {(
                                                this.state.image_grid_list && 
                                                this.state.image_grid_list.rows && 
                                                this.state.image_grid_list.rows.length > 0) ?
                                                <React.Fragment>
                                                    {this.state.os_filter_list.length > 0 &&
                                                        <React.Fragment>
                                                            <div>
                                                                <span style={{display: 'inline-block',width: '100px'}}>
                                                                    OS Type
                                                                </span>
                                                                <select
                                                                    className="form-control-vm text-capitalize"
                                                                    style={{display: 'inline-block',
                                                                    width: 'calc(100% - 120px)',
                                                                    marginLeft: '20px',
                                                                    marginBottom: '10px'}}
                                                                    id="os_filter"
                                                                    onChange={e => this.os_filter_Change(e.target)}
                                                                    >
                                                                    <option selected="true" value="">All</option>
                                                                    {this.state.os_filter_list && this.state.os_filter_list.length > 0 && this.state.os_filter_list.map((name, index) =>
                                                                        <option className="text-capitalize" value={name}>
                                                                            {name}
                                                                        </option>
                                                                    )}
                                                                </select>
                                                            </div>
                                                            <div className="clear-both"></div>
                                                        </React.Fragment>
                                                    }

                                                    {
                                                        this.state.os_filter_in_progress ? <PageLoader/> :
                                                        <div className="dataTables_wrapper dt-bootstrap4 mt-4">
                                                            <MDBDataTable
                                                            striped
                                                            hover
                                                            data={this.state.image_grid_list}
                                                            />
                                                        </div>
                                                    }
                                                </React.Fragment>
                                                : <span className="star-mark">No Record found</span>
                                            }
                                          </React.Fragment>
                                        }
                                    </Modal>
                                </div>
                            </div>
                        </div>                        
                    </div>
                    
                    <div className="row">
                        <div className="col-lg-6">
                            <div className="form-group row">
                                <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Machine Type<span className="star-mark">*</span></label>
                                <div className="col-sm-9 pt-2 overflow-wrap">
                                    {this.state.machine_name && <i className="color-white pr-4">{this.state.machine_name}</i> }
                                    <a href="javascript:void(0)" className="anch-link" onClick={this.machine_type_popup}>{ (this.state.machine_name ? "Change" : "Select") } Machine Type</a>
                                    <Modal
                                        isOpen={this.state.is_machine_type_popup}
                                        onRequestClose={this.machine_type_popupCloseModal}
                                        >
                                        <h2 style={{lineHeight:1.6+ 'em' }}>
                                            Machine Type <a className="float-right" href="javascript:void(0);" onClick={this.machine_type_popupCloseModal}><span className="btn btn-primary">Save</span></a>
                                        </h2>
                                        
                                        { this.state.machine_list_loading ? <PageLoader/> :
                                          <React.Fragment>
                                            {(
                                                this.state.machine_grid_list && this.state.machine_grid_list.rows && this.state.machine_grid_list.rows.length > 0) ?
                                                <div className="dataTables_wrapper dt-bootstrap4 mt-4">
                                                    <MDBDataTable
                                                    striped
                                                    hover
                                                    data={this.state.machine_grid_list}
                                                    />
                                                </div>
                                                : <span className="star-mark">No Record found</span>
                                            }
                                          </React.Fragment>
                                        }
                                    </Modal>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="form-group row">
                            <label htmlFor="cpu" className='col-sm-3 col-form-label'>Network Type<span className="star-mark">*</span></label>
                                <div className="col-sm-9 position-relative">
                                    <select
                                    className={"form-control-vm " + (!this.state.project_id && "no-access")}
                                    onChange={e => this.networkType_Change(e.target)}
                                    name="networkType"
                                    id="networkType"
                                    disabled={ !this.state.project_id ? true : false}
                                    >
                                      <option value="">--SELECT--</option>
                                      <option value="default">Default</option>
                                      <option value="withNetwork">Network</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className={"row " + (!this.state.showNetworkGroup && "hide") }>
                        <div className="col-lg-6">
                            <div className="form-group row">
                            <label htmlFor="cpu" className='col-sm-3 col-form-label'>Network<span className="star-mark">*</span></label>
                                <div className="col-sm-9 position-relative">
                                    <select
                                    className="form-control-vm"
                                    id="gcpNetwork"
                                    onChange={e => this.network_Change(e.target)}
                                    >
                                    <option selected="true" value="">--SELECT--</option>
                                    {this.state.network_list && this.state.network_list.length > 0 && this.state.network_list.map((row, index) =>
                                        <option index={index} value={row.name}>
                                            {row.name}
                                        </option>
                                    )}
                                    </select>
                                    {this.state.network_list_loading && <i className="fas fa-circle-notch icon-loading drop-loader"></i>}

                                    <a href="javascript:void(0)" className="anch-link small-anch-link" onClick={() => this.openCreateNetworkModalClick()}>Create New Network</a>
                                    <Modal
                                    isOpen={this.state.modalIsCreateNetworkOpen}
                                    onRequestClose={this.closeCreateNetworkModalClick}
                                    >
                                        <h2 style={{color:'red'}}>
                                            Add Network<a className="float-right" href="javascript:void(0);" onClick={this.closeCreateNetworkModalClick}><i className="fa fa-times" /></a>
                                        </h2>

                                        <div className="col-md-12">
                                            <div className="form-group">
                                                <label htmlFor="name">Network Name<span className="star-mark">*</span>
                                                </label>
                                                <input
                                                type="text"
                                                className="form-control"
                                                name="networkName"
                                                id="networkName"
                                                placeholder="Ex: newgcpnetwork"
                                                required
                                                value={this.state.addNetworkName}
                                                onChange={event => this.handleAddNetworkName(event.target)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <button onClick={() => this.addNetwork()} className="btn btn-sm btn-primary">
                                                {this.state.is_network_add_inprogress &&
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
                                    className={"form-control-vm " + (this.state.region_id && this.state.network_id ? "" : "no-access")}
                                    id="gcpSubnet"
                                    disabled={this.state.region_id && this.state.network_id ? false : true}
                                    onChange={e => this.subnet_Change(e.target)}
                                    >
                                    <option selected="true" value="">--SELECT--</option>
                                    {this.state.subnet_list && this.state.subnet_list.length > 0 && this.state.subnet_list.map((value, index) =>
                                        <option value={value.name ? value.name : value.substring(value.lastIndexOf('/') + 1)}>
                                            {value.name ? value.name : value.substring(value.lastIndexOf('/') + 1)}
                                        </option>
                                    )}
                                    </select>
                                    {this.state.subnet_list_loading && <i className="fas fa-circle-notch icon-loading drop-loader"></i>}

                                    <a href="javascript:void(0)" className="anch-link small-anch-link" onClick={() => this.openCreateSubnetModalClick()}>Create New Subnet</a>
                                    <Modal
                                    isOpen={this.state.modalIsCreateSubnetOpen}
                                    onRequestClose={this.closeCreateSubnetModalClick}
                                    >
                                        <h2>
                                            Add Subnet<a className="float-right" href="javascript:void(0);" onClick={this.closeCreateSubnetModalClick}><i className="fa fa-times" /></a>
                                        </h2>

                                        <div className="col-md-12">
                                            <div className="form-group">
                                                <label htmlFor="name">Network Name<span className="star-mark">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control input-disabled"
                                                    value={this.state.network_id}
                                                    readOnly
                                                    />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="name">Subnet Name<span className="star-mark">*</span>
                                                </label>
                                                <input
                                                type="text"
                                                className="form-control"
                                                name="subnetName"
                                                id="subnetName"
                                                placeholder="Ex: newsubnet"
                                                required
                                                value={this.state.addSubnetName}
                                                onChange={event => this.handleAddSubnetName(event.target)}
                                                />
                                            </div>
                                            <div className="form-group position-relative">
                                                <label htmlFor="name">IP CIDR Range<span className="star-mark">*</span>
                                                </label>
                                                <input
                                                type="text"
                                                className="form-control"
                                                name="ipCidrRange"
                                                id="ipCidrRange"
                                                required                      
                                                placeholder="Ex: 192.0.0.0/16"
                                                />
                                                <i data-tip data-for="addVpcCIDRTip" className="fa fa-info-circle txt-info-icon" aria-hidden="true"></i>
                                                <ReactTooltip id="addVpcCIDRTip" place="top" effect="solid">
                                                    CIDR Block should be like 192.0.0.0/16,<br/>
                                                    193.0.0.0/16, 194.0.0.0/16
                                                </ReactTooltip>
                                            </div>
                                            <div className="form-group">
                                                <button onClick={() => this.addSubnet()} className="btn btn-sm btn-primary">
                                                {this.state.is_subnet_add_inprogress &&
                                                    <i className="fas fa-circle-notch icon-loading"></i>}
                                                Submit</button>
                                            </div>
                                        </div>
                                    </Modal>
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
                                    {commonFns.fnFormatCurrency((Number(this.state.image_price ? this.state.image_price : 0) + Number(this.state.machine_price ? this.state.machine_price : 0)))}
                                </span>
                            </strong>
                            <button 
                            className={"ml-2 btn btn-primary float-right " + (this.state.isCartAddingInprogress ? "no-access" : "")} disabled={this.state.isCartAddingInprogress ? true : false}
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

const connectedNewVMInstance = connect(mapStateToProps)(gcpNewVMInstance);
export { connectedNewVMInstance as gcpNewVMInstance };