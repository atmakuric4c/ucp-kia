import React from "react";

export default class IpamModalComponent extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    if (!this.props.data) {
      return <option>Loading</option>;
    } else {
      return this.props.data.map((v, key) => {
        return (
          v.status=='Active'?<option value={v.id} key={v.id}>{v.display_name} -{v.network_name}</option>:''
        );
      });
    }
  }
}
