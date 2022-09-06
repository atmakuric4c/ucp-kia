import React from 'react';
import { authHeader, ucpEncrypt, ucpDecrypt } from '../../_helpers';
import config from 'config';

class WindowsVMAccessInfo extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cyberarkList: [],
      is_loading: false
    };
  }

  componentDidMount() {
    let {osType, location, os_template_name, resourceGroup, vmId} = this.props;

    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt({
       hostname: this.props.hostname,
       vmId,
       osType
      }))
    }, self = this;

    fetch(`${config.apiUrl}/secureApi/azure/getWindowsVmUserAccessList`, requestOptions).then(response => {
      response.text().then(text => {
        try {
          text = JSON.parse(ucpDecrypt(JSON.parse(text)));
          console.log("getWindowsVmUserAccessList ---- ", text);
        }
        catch(e) {
          text = [];
        }
        self.setState({ cyberarkList: text.data });
      });
    });
  }

  render() {
   let { cyberarkList = []} = this.state;

   return <React.Fragment>
    <h5 className="color sub-heading">
     Access Users List
    </h5>
    <div className="table-responsive">
      <table className="table table-bordered table-striped table-dark table-custom table-hover" id="vm_logs">
       <thead>
        <tr>
         <th>S.No</th>
         <th>Username</th>
         <th>Role</th>
         <th>Access Type</th>
         <th>Service Account Name</th>
        </tr>
       </thead>
       <tbody>
        {cyberarkList && cyberarkList.map((data, index) =>
         <tr key={index}>
          <td>{index + 1}</td>
          <td>{data.safe_requested_for}</td>
          <td>{data.role}</td>
          <td>{data.accessType}</td>
          <td>{data.service_account_name}</td>
         </tr>
        )}
       </tbody>
      </table>
     </div> 
    </React.Fragment>
  }
}

export default WindowsVMAccessInfo;