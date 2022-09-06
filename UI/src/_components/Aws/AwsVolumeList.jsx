import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import { commonFns } from "../../_helpers/common";
import ReactHtmlParser from 'react-html-parser'; 
import DatatablePage from './resourceGroupsGridview';
import PageLoader from '../PageLoader';
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';
import { MDBDataTable } from 'mdbreact';

Modal.setAppElement("#app");
class AwsVolumeList extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      user: user,
      region_list: [],
      is_region_list_loaded: false,
      is_availability_zone_loading: false,
      availability_zone_list: [],
      regionid: "",
      dataList: "",
      isDataListLoading: false,
      is_add_item_inprogress: false,
      sweetalert: false,
      currentRowDeleteDetails: "",
      diskSizeGB: "",
      IOPS: "",
      isCurrentPriceLoading: true,
      priceFor1GBVolume: 0,

      regionName: ""
    };

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  componentDidMount() {
    this.calAwsApis({clientid: this.state.clientid}, "get_aws_regions" , "region_list", "is_region_list_loaded" );
    this.fetchPriceForVolume();
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

  calAwsApis(frmData, apiName, stateName, isLoading){
    if(isLoading){
      this.setState({
        [isLoading]: true
      });
    }

    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/aws/` + apiName, requestOptions).then(response  => this.handleResponse(response, stateName, isLoading));
  }

  handleResponse(response, stateName, isLoading) {
    return response.text().then(text => {

        const data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        if (!response.ok) {
            //
        }
        else{
          this.setState({
            [stateName]: (data.data ? data.data : (data.value ? data.value : data))
          })
        }

        if(isLoading){
          this.setState({
            [isLoading]: false
          });
        }
    });
  }

  regionChange(target){
    let value = (target.value ? target.value : target);
    this.setState({
      regionid: value
    });

    if(value){
      let frmData = { "clientid" : this.state.clientid, "regionName" : value};

      this.setState({
        isDataListLoading: true,
        dataList: ""
      });

      const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(ucpEncrypt(frmData))
      };

      fetch(`${config.apiUrl}/secureApi/aws/getVolumeList`, requestOptions).then(response  => this.handleDataListResponse(response));
    }
    else{
      this.setState({
        dataList: "",
        isDataListLoading: false
      });
    }
  }

  handleDataListResponse(response) {
    return response.text().then(text => {
        let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if(data && data.error && data.error.message) {
          toast.error(data.error.message);
          
          this.setState({
            dataList: ""
          });
        }
        else if(data && data.data && data.data[0] && data.data[0].Error && data.data[0].Error[0] &&
          data.data[0].Error[0].Message && data.data[0].Error[0].Message[0]){
            toast.error(data.data[0].Error[0].Message[0]);

            this.setState({
              dataList: ""
            });
        }
        else{
          let dataRowList = [];
        
          if(data && data.data){
            data = data.data;
            for(let i =0; i < data.length; i++){
              let newRow = {};
              newRow.volumeId = (data[i].volumeId && data[i].volumeId[0] ? data[i].volumeId[0] : "");
              //newRow.availabilityZone = (data[i].availabilityZone && data[i].availabilityZone[0] ? data[i].availabilityZone[0] : "");
              newRow.volumeType = (data[i].volumeType && data[i].volumeType[0] ? data[i].volumeType[0] : "");
              newRow.iops = (data[i].iops && data[i].iops[0] ? data[i].iops[0] : "");
              newRow.size = (data[i].size && data[i].size[0] ? data[i].size[0] + " GB" : "0 GB");
              newRow.status = (data[i].status && data[i].status[0] ? data[i].status[0] : "");

              let isDisable = (newRow.status.toLowerCase().indexOf("in-use") != -1)

              newRow.action = <button
              disabled={isDisable ? 'disabled' : null}
              title={isDisable && "Volume in Use, Detach the Volume before delete"}
              className={"btn btn-sm btn-danger " + (isDisable && " not-allow") } 
              onClick={() => this.deleteAction(data[i])}><i className="fas fa-minus-circle"></i> Delete Volume</button>;

              //if(newRow.volumeId){
                dataRowList.push(newRow);
              //}
            }
          }

          let dataList = "";

          if(dataRowList.length > 0){
            dataList = {
              columns: [
                {
                    label: 'Volume Id',
                    field: 'volumeId'
                },
                {
                    label: 'Volume Type',
                    field: 'volumeType'
                },
                {
                    label: 'Size',
                    field: 'size'
                },
                {
                    label: 'IOPS',
                    field: 'iops'
                },
                {
                    label: 'Status',
                    field: 'status'
                },
                {
                    label: '',
                    field: 'action'
                },
              ],
              rows: dataRowList
            }
          }

          if(dataRowList.length == 0){
            toast.error("No record for current selection!");
          }

          this.setState({
            dataList: dataList
          });
        
        }       
        this.setState({
          isDataListLoading: false
        }) 
    });
  }

  deleteAction = (row) =>{    
    this.setState({
      sweetalert: true,
      currentRowDeleteDetails: row
    });
  }

  deleteHandle(){
    let currentRowDeleteDetails = this.state.currentRowDeleteDetails;
    let formdata = {
      clientid: this.state.clientid, 
      regionName: this.state.regionid, 
      volumeId: (currentRowDeleteDetails.volumeId && currentRowDeleteDetails.volumeId[0] ? currentRowDeleteDetails.volumeId[0] : "")
    };

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(formdata))
    };

    $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);
    
    fetch(`${config.apiUrl}/secureApi/aws/deleteVolume`, requestOptions).then(response  => this.handleDeleteItemResponse(response));
  }
  
  handleDeleteItemResponse(response, stateName) {
    return response.text().then(text => {
      const data = (text && JSON.parse(ucpDecrypt(JSON.parse(text))) ? JSON.parse(ucpDecrypt(JSON.parse(text))) : "");
      this.setState({
        sweetalert: false
      });

      if(!data.success){
        if(data && data.data && data.data && data.data[0] && data.data[0].Error && data.data[0].Error[0] && data.data[0].Error[0].Message && data.data[0].Error[0].Message[0]){
          toast.error(data.data[0].Error[0].Message[0]);  
        }
        else{
          toast.error("Unble to delete Volume"); 
        }
      }
      else {
        toast.success("Deleted Volume successfully!");
        
        this.regionChange(this.state.regionid);
      }

      this.setState({
        is_delete_item_inprogress: false
      });

    });
  }

  hideAlert() {
    this.setState({
        sweetalert: null
    });
  }

  addFormregionChange(target){
    let value = target.value;

    if(value){
      let frmData = { "clientid" : this.state.clientid, "regionName" : value};

      this.setState({
        is_availability_zone_loading: true,
        availability_zone_list: []
      });

      const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(frmData)
      };

      fetch(`${config.apiUrl}/aws/get_aws_availability_zones`, requestOptions).then(response  => this.handleRegionChangeListResponse(response));
    }
    else{
      this.setState({
        is_availability_zone_loading: false,
        availability_zone_list: []
      });
    }
  }
 
  handleRegionChangeListResponse(response) {
    return response.text().then(text => {
      let data = text && JSON.parse(text);

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

  addNewItem = e => {
    e.preventDefault();      
    var form = document.querySelector("#addNewItem");
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
      body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/aws/createVolume`, requestOptions).then(response  => this.handleAddNewItemResponse(response));
  }

  handleAddNewItemResponse(response, stateName) {
    return response.text().then(data => {

      data = (data && JSON.parse(ucpDecrypt(JSON.parse(data))) ? JSON.parse(ucpDecrypt(JSON.parse(data))) : "");

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

        this.closeModal();

        this.regionChange(this.state.regionName);
      }   
    });
  }

  openModal() {     
    this.setState({ modalIsOpen: true, diskSizeGB: "" });
  }

  closeModal() {
      this.setState({ modalIsOpen: false });        
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

  render() {
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <div className="row">
            <div className="col-lg-6">
              <h5 className="color">AWS Volume List</h5>
            </div>
            <div className="col-lg-6">
                <div className="text-right">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={this.openModal}
                    > <i className="fa fa-plus" /> Add Volume
                    </button>
                </div>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-lg-6">
                <div className="form-group row">
                    <label htmlFor="cloud_type" className='col-sm-3  col-form-label'>Region</label>                
                    <div className="col-sm-9">
                          <select
                            className="form-control-vm"                                    
                            name="region"
                            onChange={e => this.regionChange(e.target)}
                            >
                            <option selected="true" value="">--SELECT--</option>
                            {this.state.region_list && this.state.region_list.length > 0 && this.state.region_list.map((row, index) =>
                                <option selected={row.regionid == this.state.regionid} value={row.regionid}>
                                    {row.regionname}
                                </option>
                            )}
                            </select>
                            { this.state.is_region_list_loaded && 
                              <i className="fas fa-circle-notch icon-loading drp-loader-icon"></i>
                            }
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

                    {this.state.isDataListLoading && <PageLoader />}

                    {this.state.regionid && !this.state.isDataListLoading && !this.state.dataList && 
                      <div className="text-error-message">No record found!</div>
                    }

                    {this.state.sweetalert &&
                      <SweetAlert
                          warning
                          showCancel
                          confirmBtnText="Delete Volume"
                          confirmBtnBsStyle="danger"
                          cancelBtnBsStyle="default"
                          title="Are you sure?"
                          onConfirm={() => this.deleteHandle()}
                          onCancel={this.hideAlert.bind(this)}
                      >
                      </SweetAlert>
                    }
                    
                  </React.Fragment>
              </div>
          </div>
        
          <Modal
            isOpen={this.state.modalIsOpen}
            onRequestClose={this.closeModal}
            >
                <h2 style={{color:'red'}}>
                    Add Volume<a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
                </h2>

                <div className="col-md-12">
                    <div className="panel panel-default" />
                    <form
                    name="addNewItem"
                    id="addNewItem"
                    method="post"
                    onSubmit={this.addNewItem}
                    >
                    <div className="form-group position-relative">
                        <label htmlFor="subscription">Region<span className="star-mark">*</span></label>
                        <select
                        className="form-control"
                        name="regionName"
                        required
                        onChange={e => this.addFormregionChange(e.target)}
                        >
                        <option selected="true" value="">-Select-</option>
                        {this.state.region_list && this.state.region_list.length > 0 && this.state.region_list.map((row, index) =>
                            <option  value={row.regionid}>
                                {row.regionname}
                            </option>
                        )}
                        </select>
                        { this.state.is_region_list_loaded && 
                          <i className="fas fa-circle-notch icon-loading form-drp-loader-icon"></i>
                        }
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
                        <button 
                        className={"btn btn-sm btn-primary " + (this.state.is_add_item_inprogress ? "no-access" : "")} disabled={this.state.is_add_item_inprogress ? true : false}
                        >
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
    );
  }
}

function mapStateToProps(state) {
  console.log(state);
  const { azure } = state;
  return {
    azure
  };
}

const connected = connect(mapStateToProps)(AwsVolumeList);
export { connected as AwsVolumeList };