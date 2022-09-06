import React from "react";
import { Link } from "react-router-dom";
let monitoringVMItems = [];
export default class HostItemsFromZabbix extends React.Component {
  constructor(props) {
    super(props);
    console.log(props);
  }
  render() {
    monitoringVMItems = this.props.monitoringVMItems;
    return (
      (monitoringVMItems.isHostItemsLoading)?(<div>Loading...</div>)
      :
      (<div>
        <div dangerouslySetInnerHTML={{__html: monitoringVMItems.monitoringVMItems.htmlForm}} >
        </div>
        <div className="form-group">
          <button className="btn btn-success">Update</button>
        </div>
      </div>
      )
    );
  }
}
