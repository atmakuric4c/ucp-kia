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
class GcpDiskList extends React.Component {
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

      zone_id: "",
      zone_list: [],
      zone_list_loading: false,
      
      dataList: "",
      isDataListLoading: 0,
      selectedDeleteDiskName: "",
      
      isCurrentPriceLoading: true,
      priceFor1GBDisk: 0
    };
  }

  componentDidMount(){
    this.calGcpApis({clientid: this.state.clientid}, "get_gcp_project_list" , "project_list", "project_list_loading" );
    this.fetchPriceForVolume();
    
    document.getElementById("body_wrapper").addEventListener("click", (e) => {
        if(e.target.className && (e.target.className.indexOf("skip-propagation") != -1 || e.target.className.indexOf("custom-auto-drp-down-select-option-skip") != -1)){
            return false;
        }
    
        this.setState({
            region_drp_active: false
        });
    });
  }
  
  fetchPriceForVolume(){
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt({"cloud_type" : "GCP", "addon_name" : "storage", "currency_id" : this.state.user.data.currency_id}))
    };

    fetch(`${config.apiUrl}/secureApi/orders/getAddonPrice`, requestOptions).then(response  => this.handlePriceResponse(response));
  }

  handlePriceResponse(response, stateName, isLoading) {
    return response.text().then(text => {
        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

        if(data && data.data && data.data[0] && data.data[0].price){
          this.setState({
            priceFor1GBDisk: data.data[0].price
          });
        }

        this.setState({
          isCurrentPriceLoading: false
        })
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
        
        if(data && (data.status == 1 || data.status == "success")){
          this.setState({
             [stateName]: (data.data ? data.data : data)
          });

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
    this.emptyZone();

    this.setState({
        project_id: target.value,
        project_name: target.options[target.selectedIndex].text
    });

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
      this.emptyZone();

      this.resetDataList();

      if($(target).attr("value")){
          let value = $(target).attr("value");
          let name = $(target).attr("name");

          this.setState({
              region_id: value,
              region_name: name
          });

          this.calGcpApis({clientid : this.state.clientid, projectId : this.state.project_id, region : value }, "get_gcp_zones_list" , "zone_list", "zone_list_loading" );
      }
    }
  /*End: Region*/

  /*start: Zone*/
    emptyZone = () => {
      this.setState({
        zone_id: "",
        zone_list: [],
        zone_list_loading: false
      });
    }

    zoneClick = (target) => {  
      if(target.value){
          let value = target.value;

          this.setState({
              zone_id: value
          });

          setTimeout(() => {
            this.bindDataList();
          }, 0);
      }
      else{
          this.resetDataList();
      }
    }
  /*end: Zone*/
  
  /*Start: Data List*/
  bindDataList() {
    this.setState({
        dataList: "",
        isDataListLoading: 1
    });

    this.loadDataList({clientid : this.state.clientid, projectId : this.state.project_id, zone: this.state.zone_id});
  }
  
  resetDataList(){
    this.setState({
        dataList: "",
        isDataListLoading: 0
    });
  }

  loadDataList(frmData){
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/gcp/disk_list`, requestOptions).then(response  => this.handleDataListResponse(response));
  }

  handleDataListResponse(response) {
    return response.text().then(text => {
        let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if(data && data.success && data.data && data.data.items && data.data.items.length > 0){
            let rows = [];

            let disks = data.data.items;
        
            for(let num = 0; num < disks.length; num++){
                let row = disks[num];
                
                rows.push({
                    name: row.name,
                    sizeGb: row.sizeGb + " GB",
                    status: row.status,
                    delete: <div className="text-center"><button title={row.status.toLowerCase() == "deleting" ?  "Disk deletion is in-process" : ""} disabled={row.status.toLowerCase() == "deleting" ?  true : false} className={"btn btn-sm btn-danger " + (row.status.toLowerCase() == "deleting" && "no-access")} onClick={() => this.deleteAction(row.name)}><i className="fas fa-minus-circle"></i> Delete Disk</button></div>
                });
            }

            let disk_grid_list = {
                columns: [
                {
                    label: 'Disk Name',
                    field: 'name',
                },
                {
                    label: 'Disk',
                    field: 'sizeGb'
                },
                {
                    label: 'Status',
                    field: 'status'
                },
                {
                    label: '',
                    field: 'delete'
                }
            ],
            rows: rows
            }
    
            this.setState({
                dataList: disk_grid_list
            });
        }
        /*else if(data && data.message){
            toast.error(data.message);
        }*/
        
        this.setState({
          isDataListLoading: 2
        }) 
    });
  }
  /*End: Data List*/

  /*Start: Delete Disk*/
  deleteAction = (diskName) => {
    this.setState({
        sweetalert: true,
        selectedDeleteDiskName: diskName
    });
  }

  hideDeletePopup() {
    this.setState({
        sweetalert: false,
        selectedDeleteDiskName: ""
    });
  }
  
  deleteHandle(){
    $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);

    let formdata = { clientid : this.state.clientid,    
                     projectId : this.state.project_id,
                     zone : this.state.zone_id,
                     resourceId : this.state.selectedDeleteDiskName
                    }

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(formdata))
    };
    return fetch(`${config.apiUrl}/secureApi/gcp/delete_disk`, requestOptions)
    .then(res => res.json())
    .then((text) => {
      const data = text && JSON.parse(ucpDecrypt((text)));
      if (data.success == 1) {
        toast.success("Disk deletion has requested successfully !");
        
        this.bindDataList();
      }
      else{
        toast.error((data.message ? data.message : "Unable to Delete Disk!"));
      }

      this.setState({
          sweetalert: false
      });
    })
    .catch(console.log)
  }
  /*End: Delete Disk*/

  /*Start: Add Disk*/
  addDisk = () => {
    if(!this.state.project_id){
        toast.warn("Please select Project, Region and Zone to Add Disk");
        return;
    }

    if(!this.state.region_id){
        toast.warn("Please select Region and Zone also to Add Disk");
        return;
    }

    if(!this.state.zone_id){
        toast.warn("Please select Zone to Add Disk");
        return;
    }

    this.openModalAddVolume();
  }

  openModalAddVolume() {
    this.setState({ modalIsAddVolumeOpen: true, AddDiskDiskName: "", diskSizeGB: "" });
  }

  closeAddVolumeModal = () => {
    this.setState({ modalIsAddVolumeOpen: false });        
  }

  addVolume = e => {
    e.preventDefault();      
    var form = document.querySelector("#addVolume");
    var frmData = serialize(form, { hash: true });
    
    if(!frmData.diskName){
      toast.error("Please enter Disk Name");
      return;
    }
    
    if(frmData.diskName.length < 4){
      toast.error("Disk Name should be at least 4 characters");
      return;
   }
    
    if(!frmData.sizeGb){
      toast.error("Please enter Size");
      return;
    }
   
    this.setState({
      is_add_volume_inprogress: true
    });

    frmData.currency_id = this.state.user.data.currency_id;
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/gcp/create_disk`, requestOptions).then(response  => this.handleaddVolumeResponse(response));
  }

  handleaddVolumeResponse(response, stateName) {
    return response.text().then(data => {

      data = (data && JSON.parse(ucpDecrypt(JSON.parse(data))) ? JSON.parse(ucpDecrypt(JSON.parse(data))) : "");

      this.setState({
        is_add_volume_inprogress: false
      });

      if(!data.success){
        toast.error(data.message ? data.message : "Unable to Add Disk");
      }
      else {
        toast.success("Disk has been added Successfully!");

        this.closeAddVolumeModal();
        this.bindDataList();
      }   
    });
  }

  handleAddDiskName = (target) =>{
    let val = target.value.toLowerCase();;
    var letterNumber = /^[0-9a-z]+$/;
    if(val == ""){
        this.setState({
          AddDiskDiskName: ""
        })
    }
    else if((val.match(letterNumber))){
        this.setState({
          AddDiskDiskName: val
        })
    }
  }

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

  /*End: Add Disk*/


  render() {
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">       
            <div className="row">
                <div className="col-lg-6">
                <h5 className="color">Google Cloud Disk List</h5>
                </div>
                <div className="col-lg-6">
                    <div className="text-right">
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={this.addDisk}
                        > <i className="fas fa-hdd pr-1" /> Add Disk
                        </button>
                        <Modal
                          isOpen={this.state.modalIsAddVolumeOpen}
                          onRequestClose={this.closeAddVolumeModal}
                          >
                              <h2 style={{color:'red'}}>
                                  Add Disk<a className="float-right" href="javascript:void(0);" onClick={this.closeAddVolumeModal}><i className="fa fa-times" /></a>
                              </h2>

                              <div className="col-md-12">
                                  <div className="panel panel-default" />
                                  <form
                                  name="addVolume"
                                  id="addVolume"
                                  method="post"
                                  onSubmit={this.addVolume}
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
                                      <label htmlFor="subscription">Zone</label>
                                      <input
                                        type="text"
                                        className="form-control input-disabled"
                                        name="zone"
                                        value={this.state.zone_id}
                                        readOnly
                                        />
                                  </div>
                                  <div className="form-group">
                                      <label htmlFor="name">Disk Name<span className="star-mark">*</span></label>
                                      <input
                                      type="text"
                                      className="form-control"
                                      name="diskName"
                                      required
                                      value={this.state.AddDiskDiskName}
                                      onChange={event => this.handleAddDiskName(event.target)}
                                      placeholder="Ex: disk1"
                                      />
                                  </div>
                                  <div className="form-group position-relative">
                                      <label htmlFor="name">Size (GB)<span className="star-mark">*</span></label>
                                      <input
                                      type="text"
                                      className="form-control"
                                      name="sizeGb"
                                      required      
                                      onChange={(e) => this.allowOnlyNumbers(e, "diskSizeGB")}
                                      value={this.state.diskSizeGB}                  
                                      placeholder="Ex: 30"
                                      />
                                      <span className="txt-right-placeholder">1 GB = 
                                          {!this.state.isCurrentPriceLoading &&
                                            <span className="currency-symbol font-weight-bold color pl-1">{commonFns.fnFormatCurrency(this.state.priceFor1GBDisk)}</span>
                                          }
                                          {this.state.isCurrentPriceLoading &&
                                            <React.Fragment>
                                              <span className="currency-symbol font-weight-bold color pl-1">{commonFns.fnFormatCurrency(this.state.priceFor1GBDisk, 0, true)}</span>
                                              <i className="fas fa-circle-notch icon-loading form-drp-loader-icon price-loading-on-form"></i>
                                            </React.Fragment>
                                          }
                                      </span>
                                  </div>
                                  <div className="form-group">
                                      <input type="hidden" name="clientid" value={this.state.clientid} />
                                      <button 
                                      className={"btn btn-sm btn-primary " + (this.state.is_add_volume_inprogress ? "no-access" : "")} disabled={this.state.is_add_volume_inprogress ? true : false}
                                      >
                                        {this.state.is_add_volume_inprogress &&
                                          <i className="fas fa-circle-notch icon-loading"></i>}
                                        Submit</button>

                                        <label className="total-price-right">
                                          Price:
                                          <span className="currency-symbol color ml-2 font-weight-bold">
                                            {commonFns.fnFormatCurrency(this.state.priceFor1GBDisk * (this.state.diskSizeGB ? this.state.diskSizeGB : 0))}
                                          </span>
                                        </label>
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
                        <label htmlFor="cloud_type" className='col-sm-2 col-form-label'>Zone<span className="star-mark">*</span></label>
                        <div className="col-sm-10 position-relative">
                            <select
                            className="form-control-vm"
                            onChange={e => this.zoneClick(e.target)}
                            >
                            <option selected="true" value="">--SELECT--</option>
                            {this.state.zone_list && this.state.zone_list.length > 0 && this.state.zone_list.map((row, index) =>
                                <option value={row.name}>
                                    {row.name}
                                </option>
                            )}
                            </select>

                            {this.state.zone_list_loading && <i className="fas fa-circle-notch icon-loading drop-loader"></i>}
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
                            <div className="text-error-message">No Disk is found for the selection !</div>
                            }

                            {this.state.sweetalert &&
                                <SweetAlert
                                    warning
                                    showCancel
                                    confirmBtnText="Delete Disk"
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

const connectedNewVMInstance = connect(mapStateToProps)(GcpDiskList);
export { connectedNewVMInstance as GcpDiskList };