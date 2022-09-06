import React from 'react';
import { connect } from 'react-redux';
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
class GcpSubnetList extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      user: user,
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,

      project_id: "",
      project_name: "",
      project_list: [],
      project_list_loading: true,

      region_id: "",
      region_name: "",
      region_list: [],
      backup_region_list: [],
      region_drp_active: false,
      region_list_loading: false,
      
      network_id: "",
      network_list: [],
      network_list_loading: false,

      subnet_list: [],
      addSubnetName: "",

      dataList: "",
      isDataListLoading: 0,
      selectedDeleteSubnetName: ""
    };
  }

  componentDidMount(){
    this.calGcpApis({clientid: this.state.clientid}, "get_gcp_project_list" , "project_list", "project_list_loading" );
    
    document.getElementById("body_wrapper").addEventListener("click", (e) => {
        if(e.target.className && (e.target.className.indexOf("skip-propagation") != -1 || e.target.className.indexOf("custom-auto-drp-down-select-option-skip") != -1)){
            return false;
        }
    
        this.setState({
            region_drp_active: false
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
        
        if(data && (data.status == 1 || data.status == "success" || data.success)){
          if(stateName == "network_list"){
            this.setState({
                [stateName]: (data && data.data && data.data.items ? data.data.items : [])
            });
            
            if(!stateLoading){
              this.bindDataList();
            }
          }
          else{
            this.setState({
              [stateName]: (data.data ? data.data : data)
            });
          }

          if(backupStateName){
            this.setState({
             [backupStateName]: (data.data ? data.data : data)
            });
          }
        }

        if(stateLoading){
            this.setState({
                [stateLoading]: false
            });
        }
    });
  }

  projectChange(target){
    this.resetDataList();
    this.emptyRegion();
    this.emptyNetwork();

    this.setState({
        project_id: target.value,
        project_name: target.options[target.selectedIndex].text
    });

    if(target.value){        
        this.calGcpApis({clientid : this.state.clientid, projectId : target.value }, "get_gcp_regions_list" , "region_list", "region_list_loading", "backup_region_list" );
        this.calGcpApis({clientid : this.state.clientid, projectId : target.value }, "getNetworkList" , "network_list", "network_list_loading");
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
      if($(target).attr("value")){
          let value = $(target).attr("value");
          let name = $(target).attr("name");

          this.setState({
              region_id: value,
              region_name: name
          });
      }

      this.bindDataList();
    }
  /*End: Region*/

  /*Start: Network*/
    emptyNetwork = () => {
      this.setState({
          network_id: "",
          network_list: [],
          network_list_loading: false
      });
    }

    network_Change(target, value){
      let val = (value ? value : target.value);
      
      if(val){
          this.setState({
            network_id: val
          });

          this.setState({
              subnet_list: this.state.network_list[$($(target)[0].options[$(target)[0].selectedIndex]).attr("index")].subnetworks
          });
      }
      else{
          this.setState({
              network_id: ""
          })
      }

      this.bindDataList();
    }
  /*End: Network*/
  
  /*Start: Data List*/
  dataListLoading(){
    this.setState({
      dataList: "",
      isDataListLoading: 1
    });
  }

  bindDataList() {
    setTimeout(() => {
      if(this.state.region_id && this.state.network_id){
        this.dataListLoading();
        this.loadDataList();
      }
      else{
        this.resetDataList();
      }
    }, 0);
  }
  
  resetDataList(){
    this.setState({
        dataList: "",
        isDataListLoading: 0
    });
  }

  loadDataList(){
    if(this.state.subnet_list && this.state.subnet_list.length > 0){
      let rows = [];

      let subnets = this.state.subnet_list;
      
      for(let num = 0; num < subnets.length; num++){
          let row = subnets[num];

          if(row.split("/regions/")[1].split("/")[0] == this.state.region_id){ 
            rows.push({
                name: row.split("subnetworks/")[1],
                link: row,
                delete: <div className="text-center"><button className="btn btn-sm btn-danger" onClick={() => this.deleteAction(row.split("/subnetworks/")[1])}><i className="fas fa-minus-circle"></i> Delete Subnet</button></div>
            });
          }
      }

      if(rows.length > 0){
        let subnet_grid_list = {
            columns: [
            {
                label: 'Subnet Name',
                field: 'name',
            },
            {
                label: 'Subnet Link',
                field: 'link'
            },
            {
                label: '',
                field: 'delete'
            }
        ],
        rows: rows
        }

        this.setState({
            dataList: subnet_grid_list
        });
      }
      else{
        this.setState({
          dataList: ""
        });
      }
    }
  
    this.setState({
      isDataListLoading: 2
    });
  }
  /*End: Data List*/

  /*Start: Delete Subnet*/
  deleteAction = (subnetName) => {
    this.setState({
        sweetalert: true,
        selectedDeleteSubnetName: subnetName
    });
  }

  hideDeletePopup() {
    this.setState({
        sweetalert: false,
        selectedDeleteSubnetName: ""
    });
  }
  
  deleteHandle(){
    $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);

    let formdata = { clientid : this.state.clientid,    
                     projectId : this.state.project_id,
                     regionName : this.state.region_id,
                     subnetName : this.state.selectedDeleteSubnetName
                    }

    const requestOptions = {
      method: 'DELETE',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formdata)
    };
    return fetch(`${config.apiUrl}/secureApi/gcp/deleteSubnet`, requestOptions)
    .then(res => res.json())
    .then((data) => {
      if (data.success == 1) {
        toast.success("Subnet deletion has requested successfully !");
        
        this.dataListLoading();

        this.calGcpApis({clientid : this.state.clientid, projectId : this.state.project_id }, "getNetworkList" , "network_list");
      }
      else{
        toast.error((data.message ? data.message : "Unable to Delete Subnet!"));
      }

      this.setState({
          sweetalert: false
      });
    })
    .catch(console.log)
  }
  /*End: Delete Subnet*/

  /*Start: Add Subnet*/
  addSubnetPopup = () => {
    if(!this.state.project_id){
        toast.warn("Please select Project, Region and Network to Add Subnet");
        return;
    }

    if(!this.state.region_id){
        toast.warn("Please select Region and Network also to Add Subnet");
        return;
    }

    if(!this.state.network_id){
        toast.warn("Please select Network to Add Subnet");
        return;
    }

    this.openModalAddSubnet();
  }

  openModalAddSubnet() {
    $("#ipCidrRange").val("");
    this.setState({ modalIsAddSubnetOpen: true, addSubnetName: "" });
  }

  closeAddSubnetModal = () => {
    this.setState({ modalIsAddSubnetOpen: false });        
  }

  addSubnet = (e) => {
    e.preventDefault();

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
        is_add_subnet_inprogress: true
    });
    
    const requestOptions = {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(frmData)
    };

    fetch(`${config.apiUrl}/secureApi/gcp/createSubnet`, requestOptions).then(response  => this.handleAddSubnetResponse(response));
  }

  handleAddSubnetResponse(response) {
      return response.text().then(data => {
          data = (data && JSON.parse(data) ? JSON.parse(data) : "");

          this.setState({
              is_add_subnet_inprogress: false
          });

          if(!data.success){
              toast.error(data.message ? data.message : "Unable to Add Subnet");
          }
          else {
              toast.success((data.message ? data.message : "Subnet Added Successfully!"));
              this.closeAddSubnetModal();

              this.dataListLoading();

              this.calGcpApis({clientid : this.state.clientid, projectId : this.state.project_id }, "getNetworkList" , "network_list");
          }
      });
  }

  handleAddSubnetName = (target) => {
    let val = target.value.toLowerCase();;
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

  /*End: Add Subnet*/

  render() {
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">       
            <div className="row">
                <div className="col-lg-6">
                <h5 className="color">Google Cloud Subnet List</h5>
                </div>
                <div className="col-lg-6">
                    <div className="text-right">
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={this.addSubnetPopup}
                        > <i className="fa fa-plus pr-1" /> Add Subnet
                        </button>
                        <Modal
                          isOpen={this.state.modalIsAddSubnetOpen}
                          onRequestClose={this.closeAddSubnetModal}
                          >
                              <h2 style={{color:'red'}}>
                                  Add Subnet<a className="float-right" href="javascript:void(0);" onClick={this.closeAddSubnetModal}><i className="fa fa-times" /></a>
                              </h2>

                              <div className="col-md-12">
                                  <div className="panel panel-default" />
                                  <form
                                  name="addSubnet"
                                  id="addSubnet"
                                  method="post"
                                  onSubmit={this.addSubnet}
                                  >
                                  <div className="form-group position-relative">
                                      <label htmlFor="subscription">Project</label>
                                      <input
                                        type="text"
                                        className="form-control input-disabled"
                                        value={this.state.project_name}
                                        readOnly
                                        />
                                      <input type="hidden" name="projectId" value={this.state.project_id} />
                                  </div>
                                  <div className="form-group position-relative">
                                      <label htmlFor="subscription">Region</label>
                                      <input
                                        type="text"
                                        className="form-control input-disabled"
                                        value={this.state.region_id}
                                        readOnly
                                        />
                                  </div>
                                  <div className="form-group position-relative">
                                      <label htmlFor="subscription">Network Name</label>
                                      <input
                                        type="text"
                                        className="form-control input-disabled"
                                        name="zone"
                                        value={this.state.network_id}
                                        readOnly
                                        />
                                  </div>
                                  <div className="form-group">
                                      <label htmlFor="name">Subnet Name<span className="star-mark">*</span></label>
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
                                      <i data-tip data-for="addVpcCIDRTip" class="fa fa-info-circle txt-info-icon" aria-hidden="true"></i>
                                      <ReactTooltip id="addVpcCIDRTip" place="top" effect="solid">
                                          CIDR Block should be like 192.0.0.0/16,<br/>
                                          193.0.0.0/16, 194.0.0.0/16
                                      </ReactTooltip>
                                  </div>
                                  <div className="form-group">
                                      <input type="hidden" name="clientid" value={this.state.clientid} />
                                      <button
                                      className={"btn btn-sm btn-primary " + (this.state.is_add_subnet_inprogress ? "no-access" : "")} disabled={this.state.is_add_subnet_inprogress ? true : false}
                                      >
                                        {this.state.is_add_subnet_inprogress &&
                                          <i className="fas fa-circle-notch icon-loading"></i>}
                                        Submit</button>
                                  </div>
                                  </form>
                              </div>
                          </Modal>
                    </div>
                </div>
            </div>            
            <div className="row mt-4">                        
                <div className="col-lg-4">
                    <div className="form-group row">
                        <label htmlFor="cloud_type" className='col-sm-2 col-form-label'>Project<span className="star-mark">*</span></label>
                        <div className="col-sm-10 position-relative">
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
                <div className="col-lg-4">
                    <div className="form-group row">
                        <label htmlFor="cloud_type" className='col-sm-2 col-form-label'>Region<span className="star-mark">*</span></label>
                        <div className="col-sm-10">
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
                <div className="col-lg-4">
                    <div className="form-group row">
                        <label htmlFor="cloud_type" className='col-sm-3 col-form-label'>Network<span className="star-mark">*</span></label>
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
                        </div>
                    </div>
                </div>                     
            </div>
            <div className="row mt-4">
                    <div className="col-md-12">                    
                        <React.Fragment>
                            {this.state.dataList &&
                            <MDBDataTable
                            striped
                            hover
                            data={this.state.dataList}
                            />}

                            {this.state.isDataListLoading == 1 && <PageLoader />}

                            {this.state.isDataListLoading == 2 && !this.state.dataList && 
                            <div className="text-error-message">No Subnet is found for the selection !</div>
                            }

                            {this.state.sweetalert &&
                                <SweetAlert
                                    warning
                                    showCancel
                                    confirmBtnText="Delete Subnet"
                                    confirmBtnBsStyle="danger"
                                    cancelBtnBsStyle="default"
                                    title="Are you sure?"
                                    onConfirm={() => this.deleteHandle()}
                                    onCancel={this.hideDeletePopup.bind(this)}
                                >
                                </SweetAlert>
                            }
                        </React.Fragment>
                    </div>
                </div>
            
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

const connectedNewVMInstance = connect(mapStateToProps)(GcpSubnetList);
export { connectedNewVMInstance as GcpSubnetList };