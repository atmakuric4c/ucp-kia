import React from 'react';
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri, decryptResponse } from '../../_helpers';
import config from 'config';

class cyberarkList extends React.Component {
  constructor(props) {
    super(props);
    let user = decryptResponse(localStorage.getItem("user"));
    this.state = {
      cyberarkList: [],
      is_loading: false,
      user : user
    };
  }

  componentDidMount() {
    let {osType, location, os_template_name, resourceGroup} = this.props;

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt({
       hostname: this.props.hostname,
       osType
      }))
    }, self = this;

    fetch(`${config.apiUrl}/secureApi/azure/get-cyberark-list`, requestOptions).then(response => {
      response.text().then(text => {
        try {
          text = JSON.parse(ucpDecrypt(JSON.parse(text)));
        }
        catch(e) {
          text = [];
        }
        self.setState({ cyberarkList: text.data });
      });
    });

    fetch(`${config.apiUrl}/secureApi/azure/get-cyberark-users-list`, {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt({
       hostname: this.props.hostname,
       osType, location, os_template_name, resourceGroup
      }))
    }).then(response => {
      response.text().then(text => {
        try {
          text = JSON.parse(ucpDecrypt(JSON.parse(text)));
        }
        catch(e) {
          text = [];
        }
        self.setState({ cyberarkListUsers: text.data });
      });
    });
  }

  render() {
   let { cyberarkList = [], cyberarkListUsers = []} = this.state;

   return <React.Fragment>
    <h5 className="color sub-heading">
     Cyberark Accounts
    </h5>
    <div className="table-responsive">
      <table className="table table-bordered table-striped table-dark table-custom table-hover" id="vm_logs">
       <thead>
        <tr>
         <th>S.No</th>
         <th>Username</th>
         <th>Safename</th>
         <th>IP Address</th>
         <th>Platform Id</th>
        </tr>
       </thead>
       <tbody>
        {cyberarkList && cyberarkList.map((data, index) =>
         <tr key={index}>
          <td>{index + 1}</td>
          <td>{data.userName}</td>
          <td>{data.safeName}</td>
          <td>{data.address}</td>
          <td>{data.platformId}</td>
         </tr>
        )}
       </tbody>
      </table>
     </div> 

     <h5 className="color sub-heading">
     Cyberark Application users
    </h5>
    <div className="table-responsive">
      <table className="table table-bordered table-striped table-dark table-custom table-hover" id="vm_logs">
       <thead>
        <tr>
         <th>S.No</th>
         <th>Username</th>
         <th>Safename</th>
         <th>Membership Expiration Date</th>
         <th>Status</th>
        </tr>
       </thead>
       <tbody>
        {cyberarkListUsers && cyberarkListUsers.map((data, index) =>
         <tr key={index}>
          <td>{index + 1}</td>
          <td>{data.memberName}</td>
          <td>{data.safeName}</td>
          <td>{data.membershipExpirationDate} {this.state.user.data.TIME_ZONE}</td>
          <td>{data.status}</td>
         </tr>
        )}
       </tbody>
      </table>
     </div> 
    </React.Fragment>
  }
}

export default cyberarkList;