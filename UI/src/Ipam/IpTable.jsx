import React from "react";
import PageLoader from "../_components/PageLoader";

export default class IpTable extends React.Component {
  constructor(props) {
    super(props);
    //this.props;
    //this.setState({ ip_history: [] });
    //console.log("in SUB" + JSON.stringify(this.));
  }

  render() {
    // console.log(this.props.history_data);
    if (!this.props.history_data) {
      return (
        <tr>
          <td><PageLoader/></td>
        </tr>
      );
    } else {
      return this.props.history_data.map((his, key) => {
        return (
          <tr key={his.id}>
            <td>{his.id}</td>
            <td>{his.ip_address}</td>
            <td>{his.vm_id}</td>
            <td>{his.opf_id}</td>
            <td>{his.requested_by}</td>
            <td>{his.client}</td>
            <td>{his.note}</td>
            <td>{his.updated_date}</td>
          </tr>
        );
      });
    }
  }
}
