import React from 'react';
import { connect } from 'react-redux';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import Moment from 'react-moment';
import PageLoader from '../PageLoader';
import { MDBDataTable } from 'mdbreact';
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri, encryptRequest } from '../../_helpers';
import config from 'config';
import { toast } from 'react-toastify';

Modal.setAppElement("#app");
class Documents extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      loading:true,
      data: ""
    };
  }

  componentDidMount() {
    this.setState({
      loading: true
    });

    setTimeout(() => {
        this.getDocuments();
    }, 100);
  }
  
  getDocuments() {
    const requestOptions = {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: encryptRequest({"clientid":this.state.clientid})
    };

    return fetch(`${config.apiUrl}/secureApi/getClientDocuments`, requestOptions).then(this.handleVmSuccess).catch((error) => {
      toast.error("Internal server error, Please try again");
      this.loadDocuments([]);
    });
  }

  handleVmSuccess = (response) => {
    return response.text().then(text => {
      let data = text && JSON.parse(ucpDecrypt(JSON.parse(text)));

      if(!data){
        data = []
      }
      else{
        data = (data.data ? data.data : data);
      }

      this.loadDocuments(data);
    });
  }
  
  loadDocuments = (values) => {
    let rows = [];

    for(let index = 0; index < values.length; index++){
      let docs = values[index];
      
      rows.push({
        sno: index + 1,
        title: docs.title,
        download: <div class="text-center"><a className="badge adge-md badge-primary btn-blue" target="_blank" href={docs.downloadPath}>Download</a></div>
      });
    }

    let docsColums = [
      {
          label: 'S.No',
          field: 'sno',
      },
      {
          label: 'Title',
          field: 'title',
      },
      {
          label: 'Download',
          field: 'download',
      }
    ];

    let data = {
      columns: docsColums,
      rows: rows
    }

    /*if(rows && rows.length > 0){*/
      this.setState({
        data: data,
        loading: false
      });
    //}
  }

  render() {                                       
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">Governance Reports</h5>
            {this.state.loading && <div className="m-4"> <PageLoader/></div>}
            {!this.state.loading &&
            <React.Fragment>
              <React.Fragment>
                {this.state.data &&
                  <div className="mb-2 pt-3">
                      <MDBDataTable
                      striped
                      hover
                      data={this.state.data}
                      />
                  </div>
                }
              </React.Fragment>
            </React.Fragment>
            }
      </div>
    </div>
    );
  }
}

function mapStateToProps(state) {
  const { vmlist, logData,vm_data, diskInfo } = state;
  return {
    vmlist,
    logData,
    vm_data,
    diskInfo
  };
}

const connectedVmlist = connect(mapStateToProps)(Documents);
export { connectedVmlist as Documents };