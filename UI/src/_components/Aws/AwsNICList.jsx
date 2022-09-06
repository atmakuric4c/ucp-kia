import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import ReactHtmlParser from 'react-html-parser'; 
import DatatablePage from './resourceGroupsGridview';
import PageLoader from '../PageLoader';
import { authHeader,ucpEncrypt,ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';
import { MDBDataTable } from 'mdbreact';

Modal.setAppElement("#app");
class AwsNICList extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));

    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      region_list: [],
      is_region_list_loaded: false,
      vpc_list: [],
      is_vpc_list_loaded: false,
      is_subnet_list_loaded: false,
      sub_list: [],
      regionid: "",
      dataList: "",
      isDataListLoading: false,
      is_add_item_inprogress: false,
      sweetalert: false,
      currentRowDeleteDetails: "",
      regionName: ""
    };

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  componentDidMount() {
    this.calAwsApis({clientid: this.state.clientid}, "get_aws_regions" , "region_list", "is_region_list_loaded" );
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

  regionChange(target, name){
    let value =  (name ? name : target.value);

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

      fetch(`${config.apiUrl}/secureApi/aws/getNetworkInterfaceList`, requestOptions).then(response  => this.handleDataListResponse(response));
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
              newRow.networkInterfaceId = (data[i].networkInterfaceId && data[i].networkInterfaceId[0] ? data[i].networkInterfaceId[0] : "");
              newRow.vpcId = (data[i].vpcId && data[i].vpcId[0] ? data[i].vpcId[0] : "");
              newRow.cidrBlock = (data[i].cidrBlock && data[i].cidrBlock[0] ? data[i].cidrBlock[0] : "");
              newRow.status = (data[i].status && data[i].status[0] ? data[i].status[0] : "");
              newRow.subnetId = (data[i].subnetId && data[i].subnetId[0] ? data[i].subnetId[0] : "");

              let isDisable = (newRow.status.toLowerCase().indexOf("in-use") != -1);

              newRow.action = <button
              disabled={isDisable ? 'disabled' : null}
              title={isDisable && "NIC in Use, Detach the NIC before delete"}
              className={"btn btn-sm btn-danger " + (isDisable && " not-allow") } 
              onClick={() => this.deleteAction(data[i])}><i className="fas fa-minus-circle"></i> Delete NIC</button>;

              //if(newRow.vpcId || newRow.cidrBlock || newRow.state){
                dataRowList.push(newRow);
              //}
            }
          }

          let dataList = "";

          if(dataRowList.length > 0){
            dataList = {
              columns: [
                {
                  label: 'NIC Id',
                  field: 'networkInterfaceId'
                },
                {
                  label: 'VPC Id',
                  field: 'vpcId'
                },
                {
                    label: 'Subnet',
                    field: 'subnetId'
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
      networkInterfaceId: (currentRowDeleteDetails.networkInterfaceId && currentRowDeleteDetails.networkInterfaceId[0] ? currentRowDeleteDetails.networkInterfaceId[0] : "")
    };

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(formdata))
    };

    $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);
    
    fetch(`${config.apiUrl}/secureApi/aws/deleteNetworkInterface`, requestOptions).then(response  => this.handleDeleteItemResponse(response));
  }

  handleDeleteItemResponse(response, stateName) {
    return response.text().then(text => {
      const data = (text && JSON.parse(ucpDecrypt(JSON.parse(text))) ? JSON.parse(ucpDecrypt(JSON.parse(text))) : "");
      this.setState({
        sweetalert: false
      });
      
      if(data.DeleteNetworkInterfaceResponse && data.DeleteNetworkInterfaceResponse.return && 
        data.DeleteNetworkInterfaceResponse.return[0] &&
        data.DeleteNetworkInterfaceResponse.return[0] == "true"){
          toast.success("Deleted NIC successfully!");
          this.regionChange("",this.state.regionid);
      }
      else if(!data.success || 
        (data && data.data && data.data && data.data[0] && data.data[0].Error && data.data[0].Error[0] && data.data[0].Error[0].Message && data.data[0].Error[0].Message[0]
        )){
          toast.error(data.data[0].Error[0].Message[0]);  
      }
      else{
        toast.error("Unable to delete NIC"); 
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
    this.setState({
      vpc_list: [],
      is_vpc_list_loaded: false,
      subnet_list: [],
      is_subnet_list_loaded: false
    });

    let value = target.value;

    if(value){
      let frmData = { "clientid" : this.state.clientid, "regionName" : value};

      this.setState({
        is_vpc_list_loaded: true,
        vpc_list: []
      });

      const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(ucpEncrypt(frmData))
      };

      fetch(`${config.apiUrl}/secureApi/aws/getVpcList`, requestOptions).then(response  => this.handleRegionChangeListResponse(response));
    }
  }

  handleRegionChangeListResponse(response) {
    return response.text().then(text => {
      let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

      if(data && data.data && data.data.length > 0){
        this.setState({
          vpc_list:data.data
        });
      }

      this.setState({
        is_vpc_list_loaded: false
      });
    });
  }

  vpcChange(target){
    let value = target.value;
    this.setState({
      subnet_list: [],
      is_subnet_list_loaded: false
    });

    if(value){
      let frmData = { "clientid" : this.state.clientid, "regionName" : $("#regionName").val(), vpcId: value, "ipCount" : 0};

      this.setState({
        is_subnet_list_loaded: true
      });

      const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(ucpEncrypt(frmData))
      };

      fetch(`${config.apiUrl}/secureApi/aws/getSubnetList`, requestOptions).then(response  => this.handleVPCChangeListResponse(response));
    }
  }
  
  handleVPCChangeListResponse(response) {
    return response.text().then(text => {
      let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

      if(data && data.data && data.data.length > 0){
        this.setState({
          subnet_list:data.data
        });
      }

      this.setState({
        is_subnet_list_loaded: false
      });
    });
  }
  
  addNewItem = e => {
    e.preventDefault();      
    var form = document.querySelector("#addNewItem");
    var frmData = serialize(form, { hash: true });
    
    if(!frmData.regionName){
      toast.error("Please select Region");
      return;
    }

    if(!frmData.vpcId){
      toast.error("Please select VPC");
      return;
    }

    if(!frmData.subnetId){
      toast.error("Please select Subnet");
      return;
    }

    this.setState({
      is_add_item_inprogress: true
    });
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/aws/createNetworkInterface`, requestOptions).then(response  => this.handleAddNewItemResponse(response, frmData.regionName));
  }

  handleAddNewItemResponse(response, regionName) {
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
          toast.error("Unble to Add NIC"); 
        }
      }
      else {
        toast.success("NIC Added Successfully!");

        this.closeModal();

        $("#regiondrp").val(regionName);
        this.regionChange("", regionName);
      }   
    });
  }

  openModal() {     
    this.setState({ modalIsOpen: true });
  }

  closeModal() {
      this.setState({ modalIsOpen: false });        
  }

  render() { 
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <div className="row">
            <div className="col-lg-6">
              <h5 className="color">AWS NIC List</h5>
            </div>
            <div className="col-lg-6">
                <div className="text-right">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={this.openModal}
                    > <i className="fa fa-plus" /> Add NIC
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
                            id="regiondrp"
                            onChange={e => this.regionChange(e.target)}
                            >
                            <option selected="true" value="">--SELECT--</option>
                            {this.state.region_list && this.state.region_list.length > 0 && this.state.region_list.map((row, index) =>
                                <option  value={row.regionid}>
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
                          confirmBtnText="Delete NIC"
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
                    Add NIC<a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
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
                        id="regionName"
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
                        <label htmlFor="subscription">VPC<span className="star-mark">*</span></label>
                        <select
                        className="form-control"
                        name="vpcId"
                        required
                        onChange={e => this.vpcChange(e.target)}
                        >
                        <option selected="true" value="">-Select-</option>
                        {this.state.vpc_list && this.state.vpc_list.length > 0 && this.state.vpc_list.map((row, index) =>
                            <option  value={row.vpcId}>
                                {row.vpcId}
                            </option>
                        )}
                        </select>
                        { this.state.is_vpc_list_loaded && 
                          <i className="fas fa-circle-notch icon-loading form-drp-loader-icon"></i>
                        }
                    </div>
                    <div className="form-group position-relative">
                        <label htmlFor="subscription">Subnet<span className="star-mark">*</span></label>
                        <select
                        className="form-control"
                        name="subnetId"
                        required
                        >
                        <option selected="true" value="">-Select-</option>
                        {this.state.subnet_list && this.state.subnet_list.length > 0 && this.state.subnet_list.map((row, index) =>
                            <option  value={row.subnetId}>
                                {row.subnetId}
                            </option>
                        )}
                        </select>
                        { this.state.is_subnet_list_loaded && 
                          <i className="fas fa-circle-notch icon-loading form-drp-loader-icon"></i>
                        }
                    </div>
                    <div className="form-group">
                        <input type="hidden" name="clientid" value={this.state.clientid} />
                        <button 
                        className={"btn btn-sm btn-primary " + (this.state.is_add_item_inprogress ? "no-access" : "")} disabled={this.state.is_add_item_inprogress ? true : false}
                        >
                          {this.state.is_add_item_inprogress &&
                            <i className="fas fa-circle-notch icon-loading"></i>}
                          Submit</button>
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

const connected = connect(mapStateToProps)(AwsNICList);
export { connected as AwsNICList };