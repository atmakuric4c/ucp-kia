import React from "react";
import { Link } from "react-router-dom";
import Moment from 'react-moment';
export default class VeeamServerList extends React.Component {
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
            <td>{item.vdc_name}</td>
            <td>{item.ip_address}</td>
            <td>{item.username}</td>
            <td>{item.password}</td>
            <td>{item.server_type}</td>
            <td>{item.db_user}</td>
            <td>{item.db_password}</td>
            <td>{item.db_host}</td>
            <td>{item.db_name}</td>
            <td>{item.db_driver}</td>
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
