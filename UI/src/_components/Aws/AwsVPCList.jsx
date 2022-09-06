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
import ReactTooltip from "react-tooltip";

Modal.setAppElement("#app");
class AwsVPCList extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));

    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      region_list: [],
      is_region_list_loaded: false,
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

      fetch(`${config.apiUrl}/secureApi/aws/getVpcList`, requestOptions).then(response  => this.handleDataListResponse(response));
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
              newRow.vpcId = (data[i].vpcId && data[i].vpcId[0] ? data[i].vpcId[0] : "");
              newRow.cidrBlock = (data[i].cidrBlock && data[i].cidrBlock[0] ? data[i].cidrBlock[0] : "");
              newRow.state = (data[i].state && data[i].state[0] ? data[i].state[0] : "");
              newRow.action = <button className="btn btn-sm btn-danger" onClick={() => this.deleteAction(data[i])}><i className="fas fa-minus-circle"></i> Delete VPC</button>;

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
                    label: 'VPC Id',
                    field: 'vpcId'
                },
                {
                    label: 'CIDR Block',
                    field: 'cidrBlock'
                },
                {
                    label: 'State',
                    field: 'state'
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
      vpcId: (currentRowDeleteDetails.vpcId && currentRowDeleteDetails.vpcId[0] ? currentRowDeleteDetails.vpcId[0] : "")
    };

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(formdata))
    };

    $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);
    
    fetch(`${config.apiUrl}/secureApi/aws/deleteVpc`, requestOptions).then(response  => this.handleDeleteItemResponse(response));
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
          toast.error("Unble to delete VPC"); 
        }
      }
      else {
        toast.success("Deleted VPC successfully!");
        
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

  addNewItem = e => {
    e.preventDefault();      
    var form = document.querySelector("#addNewItem");
    var frmData = serialize(form, { hash: true });
    
    if(!frmData.regionName){
      toast.error("Please select region");
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
      body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/aws/createVpc`, requestOptions).then(response  => this.handleAddNewItemResponse(response));
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
          toast.error("Unable to Add VPC"); 
        }
      }
      else {
        toast.success("VPC Added Successfully!");

        this.closeModal();

        this.regionChange(this.state.regionName);
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
              <h5 className="color">AWS VPC List</h5>
            </div>
            <div className="col-lg-6">
                <div className="text-right">
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={this.openModal}
                    > <i className="fa fa-plus" /> Add VPC
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
                          confirmBtnText="Delete VPC"
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
                    Add VPC<a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
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
                        <label htmlFor="name">CIDR Block<span className="star-mark">*</span></label>
                        <input
                        type="text"
                        className="form-control"
                        name="cidrBlock"
                        required                      
                        placeholder="Ex: 192.0.0.0/16"
                        />
                        <i data-tip data-for="addVpcCIDRTip" class="fa fa-info-circle txt-info-icon" aria-hidden="true"></i>
                        <ReactTooltip id="addVpcCIDRTip" place="top" effect="solid">
                            Each CIDR Block format should be like 192.0.0.0/16,<br/>
                            193.0.0.0/16, 194.0.0.0/16
                        </ReactTooltip>
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

const connected = connect(mapStateToProps)(AwsVPCList);
export { connected as AwsVPCList };