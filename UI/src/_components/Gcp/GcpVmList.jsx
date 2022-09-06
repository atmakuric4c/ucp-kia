import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import ReactHtmlParser from 'react-html-parser'; 
import PageLoader from '../PageLoader';
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri } from '../../_helpers';
import config from 'config';
import { toast, ToastType } from 'react-toastify';
import { MDBDataTable } from 'mdbreact';
import ReactTooltip from "react-tooltip";

Modal.setAppElement("#app");
class GcpVmList extends React.Component {
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
      isDataListLoading: true,
      is_add_item_inprogress: false,
      sweetalert: false,
      currentRowDeleteDetails: "",

      regionName: ""
    };
  }

  componentDidMount() {
    this.loadDataList({clientid: btoa(this.state.clientid)} );
  }

  loadDataList(frmData){
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(ucpEncrypt(frmData))
    };

    fetch(`${config.apiUrl}/secureApi/gcp/vm_list`, requestOptions).then(response  => this.handleDataListResponse(response));
  }

  handleDataListResponse(response) {
    return response.text().then(text => {
        let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));
        
        if(data && data.success){
          let dataRowList = [];
          
          if(data && data.vms && data.vms.length > 0){
            let list = data.vms;
            for(let i =0; i < list.length; i++){
              let newRow = {};
              newRow.host_name = <a class="badge adge-sm cursor" href={"/#/GcpVmDetails/" + btoa(list[i].id)}>{list[i].host_name}</a>;
              newRow.copy_type = list[i].copy_type;
              newRow.cpu_units = list[i].cpu_units;
              newRow.disk_units_gb = list[i].disk_units_gb;
              newRow.ram_units_gb = list[i].ram_units_gb;
              newRow.vm_status = list[i].vm_status;
              newRow.action = <div class="text-center"><a class="badge adge-md badge-primary btn-blue" href={"/#/GcpVmDetails/" + btoa(list[i].id)}>VM Detail</a></div>;

              dataRowList.push(newRow);
            }
          }

          let dataList = "";

          if(dataRowList.length > 0){
            dataList = {
              columns: [
                {
                    label: 'VM Name',
                    field: 'host_name'
                },
                {
                    label: 'Cloud Type',
                    field: 'copy_type'
                },
                {
                    label: 'CPU Core',
                    field: 'cpu_units'
                },
                {
                    label: 'HDD (in GB)',
                    field: 'disk_units_gb'
                },
                {
                    label: 'RAM (in GB)',
                    field: 'ram_units_gb'
                },
                {
                    label: 'Status',
                    field: 'vm_status'
                },
                {
                    label: 'Action',
                    field: 'action'
                },
              ],
              rows: dataRowList
            }
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

  render() { 
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <div className="row">
            <div className="col-lg-12">
              <h5 className="color">Google Cloud VMs</h5>
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

                    {!this.state.isDataListLoading && !this.state.dataList && 
                      <div className="text-error-message">No Google Cloud VM is found !</div>
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
  console.log(state);
  const { azure } = state;
  return {
    azure
  };
}

const connected = connect(mapStateToProps)(GcpVmList);
export { connected as GcpVmList };