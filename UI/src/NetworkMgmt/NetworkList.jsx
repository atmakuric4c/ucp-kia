import React from "react";
import { Link } from "react-router-dom";
import Moment from 'react-moment';
export default class NetworkList extends React.Component {
  constructor(props) {
    super(props);
    this.editNw = this.editNw.bind(this);
  }
  editNw(item, status) {
    this.props.editUpdate(item, status);
  }
  render() {
    if (this.props.data) {
      return this.props.data.map((item, key) => {
        return (
          <tr key={item.id}>
            <td>{item.id}</td>
            <td>{item.display_name}</td>
            <td>{item.network_name}</td>
            <td>{item.firewall_vm_name}</td>
            <td>{item.type}</td>
            {/* <td>{item.public_ip}</td> */}
            {/* <td>{item.external_interface}</td>
            <td>{item.internal_interface}</td> */}
            <td>{item.username}</td>
            <td>{item.port}</td>
            {/* <td>{item.private_ip_start}</td>
            <td>{item.private_ip_end}</td> */}
            <td>{item.private_ip_gateway}</td>
            <td>{item.private_ip_subnetmask}</td>
            <td>{item.added_date && <Moment format="YYYY-MM-DD HH:mm:ss">{new Date(new Date(item.added_date))}</Moment>}</td>
            <td>{item.status}</td>
            <td>
              {item.status == "Active" ? (
                <a
                  href="javascript:void(0);"
                  className="btn btn-warning"
                  onClick={() => this.editNw(item.id, "InActive")}
                >
                  Make InActive
                </a>
              ) : (
                <a
                  href="javascript:void(0);"
                  className="btn btn-primary"
                  onClick={() => this.editNw(item.id, "Activate")}
                >
                  Make Active
                </a>
              )}
            </td>
          </tr>
        );
      });
    } else {
      return (
        <tr>
          <td colSpan="6">No Data</td>
        </tr>
      );
    }
  }
}
