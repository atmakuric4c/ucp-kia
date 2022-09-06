import React from "react";
export default class Vcenterlist extends React.Component {
  constructor(props) {
    super(props);
  }
  editVCenterDetails(item) {
    this.props.editVCenrerInfo(item);
  }
  render() {
    if (this.props.vcenter) {
      return this.props.vcenter.map((item, key) => {
        return (
          <tr key={key}>
            <td>{item.vdc_id}</td>
            <td>
              {item.vdc_name} / {item.current_vm_count}
            </td>
            <td>{item.vdc_location}</td>
            <td>{item.vdc_ip}</td>
            <td>{item.db_host}</td>
            <td>{item.db_name}</td>
            <td>{item.db_user}</td>
            <td>{item.db_driver}</td>
            <td>{item.status}</td>
            <td>
              <button onClick={() => this.editVCenterDetails(item)}>
                <i className="fa fa-edit" />
              </button>
            </td>
          </tr>
        );
      });
    } else
      return (
        <tr>
          <td>Loading...</td>
        </tr>
      );
  }
}
