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
class GcpNetworkList extends React.Component {
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
      
      dataList: "",
      isDataListLoading: 0,
      selectedRowName: ""
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

    this.setState({
        project_id: target.value,
        project_name: target.options[target.selectedIndex].text
    });

    if(target.value){
      setTimeout(() => {                
        this.bindDataList();
      }, 0);
    }
  }
  
  /*Start: Data List*/
  bindDataList() {
    this.setState({
      dataList: "",
      isDataListLoading: 1
    });
    
    this.loadDataList({clientid : this.state.clientid, projectId : this.state.project_id});
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

    fetch(`${config.apiUrl}/secureApi/gcp/getNetworkList`, requestOptions).then(response  => this.handleDataListResponse(response));
  }

  handleDataListResponse(response) {
    return response.text().then(text => {
        let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if(data && data.success && data.data && data.data.items && data.data.items.length > 0){
            let rows = [];

            let networks = data.data.items;
        
            for(let num = 0; num < networks.length; num++){
                let row = networks[num];
                
                rows.push({
                    name: row.name,
                    link: row.selfLink,
                    delete: <div className="text-center"><button className="btn btn-sm btn-danger" onClick={() => this.deleteAction(row.name)}><i className="fas fa-minus-circle"></i> Delete Network</button></div>
                });
            }

            let network_grid_list = {
                columns: [
                {
                    label: 'Network Name',
                    field: 'name',
                },
                {
                    label: 'Network Link',
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
                dataList: network_grid_list
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

  /*Start: Delete Network*/
  deleteAction = (networkName) => {
    this.setState({
        sweetalert: true,
        selectedRowName: networkName
    });
  }

  hideDeletePopup() {
    this.setState({
        sweetalert: false,
        selectedRowName: ""
    });
  }
  
  deleteHandle(){
    $(".sweet-alert").find(".btn-danger").prepend("<i class='fas fa-circle-notch icon-loading'></i>");
    $(".sweet-alert").find(".btn-danger").attr("disabled",true);

    let formdata = { clientid : this.state.clientid,    
                     projectId : this.state.project_id,
                     networkName : this.state.selectedRowName
                    }

    const requestOptions = {
      method: 'DELETE',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(formdata))
    };
    return fetch(`${config.apiUrl}/secureApi/gcp/deleteNetwork`, requestOptions)
    .then(res => res.json())
    .then((text) => {
      const data = text && JSON.parse(ucpDecrypt((text)));
      if (data.success == 1) {
        toast.success("Network deletion has requested successfully !");
        
        this.bindDataList();
      }
      else{
        toast.error((data.message ? data.message : "Unable to Delete Network!"));
      }

      this.setState({
          sweetalert: false
      });
    })
    .catch(console.log)
  }
  /*End: Delete Network*/

  /*Start: Add Network*/
  addNetworkPopup = () => {
    if(!this.state.project_id){
        toast.warn("Please select Project to Add Network");
        return;
    }

    this.openModalAddNetwork();
  }

  openModalAddNetwork() {
    this.setState({ modalIsAddNetworkOpen: true, AddNetworkName: "" });
  }

  closeAddNetworkModal = () => {
    this.setState({ modalIsAddNetworkOpen: false });        
  }

  addNetwork = e => {
    e.preventDefault(); 

    if(!this.state.AddNetworkName){
      toast.error("Please enter Network Name");
      return;
    }
    
    if(this.state.AddNetworkName.length < 4){
      toast.error("Network Name should be at least 4 characters");
      return;
    }
    
    var frmData = {
      clientid: this.state.clientid,
      projectId: this.state.project_id,
      networkName: this.state.AddNetworkName,
      autoCreateSubnetworks: false
    };
    
    this.setState({
      is_add_network_inprogress: true
    });
    
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/gcp/createNetwork`, requestOptions).then(response  => this.handleaddNetworkResponse(response));
  }

  handleaddNetworkResponse(response, stateName) {
    return response.text().then(data => {

      data = (data && JSON.parse(ucpDecrypt(JSON.parse(data))) ? JSON.parse(ucpDecrypt(JSON.parse(data))) : "");

      this.setState({
        is_add_network_inprogress: false
      });

      if(!data.success){
        toast.error(data.message ? data.message : "Unable to Add Network");
      }
      else {
        toast.success("Network has been added Successfully!");

        this.closeAddNetworkModal();
        this.bindDataList();
      }   
    });
  }

  handleAddNetworkName = (target) =>{
    let val = target.value.toLowerCase();;
    var letterNumber = /^[0-9a-z]+$/;
    if(val == ""){
        this.setState({
          AddNetworkName: ""
        })
    }
    else if((val.match(letterNumber))){
        this.setState({
          AddNetworkName: val
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

  /*End: Add Network*/

  render() {
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">       
            <div className="row">
                <div className="col-lg-6">
                <h5 className="color">Google Cloud Network List</h5>
                </div>
                <div className="col-lg-6">
                    <div className="text-right">
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={this.addNetworkPopup}
                        > <i className="fa fa-plus" /> Add Network
                        </button>
                        <Modal
                          isOpen={this.state.modalIsAddNetworkOpen}
                          onRequestClose={this.closeAddNetworkModal}
                          >
                              <h2 style={{color:'red'}}>
                                  Add Network<a className="float-right" href="javascript:void(0);" onClick={this.closeAddNetworkModal}><i className="fa fa-times" /></a>
                              </h2>

                              <div className="col-md-12">
                                  <div className="panel panel-default" />
                                  <form
                                  name="addNetwork"
                                  id="addNetwork"
                                  method="post"
                                  onSubmit={this.addNetwork}
                                  >
                                  <div className="form-group position-relative">
                                      <label htmlFor="subscription">Project</label>
                                      <input
                                        type="text"
                                        className="form-control input-disabled"
                                        value={this.state.project_name}
                                        readOnly
                                        />
                                  </div>
                                  <div className="form-group">
                                      <label htmlFor="name">Network Name<span className="star-mark">*</span></label>
                                      <input
                                      type="text"
                                      className="form-control"
                                      name="networkName"
                                      required
                                      value={this.state.AddNetworkName}
                                      onChange={event => this.handleAddNetworkName(event.target)}
                                      placeholder="Ex: newgcpnetwork"
                                      />
                                  </div>
                                  <div className="form-group">
                                      <input type="hidden" name="clientid" value={this.state.clientid} />
                                      <button 
                                      className={"btn btn-sm btn-primary " + (this.state.is_add_network_inprogress ? "no-access" : "")} disabled={this.state.is_add_network_inprogress ? true : false}
                                      >
                                        {this.state.is_add_network_inprogress &&
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
                <div className="col-lg-6">
                    <div className="form-group row">
                        <label htmlFor="cloud_type" className='col-sm-3 col-form-label'>Project<span className="star-mark">*</span></label>
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
                            <div className="text-error-message">No Network is found !</div>
                            }

                            {this.state.sweetalert &&
                                <SweetAlert
                                    warning
                                    showCancel
                                    confirmBtnText="Delete Network"
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

const connectedNewVMInstance = connect(mapStateToProps)(GcpNetworkList);
export { connectedNewVMInstance as GcpNetworkList };