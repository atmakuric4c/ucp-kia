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
          <option value={v.vdc_id} key={v.vdc_id}>
            {v.vdc_name} -{v.vdc_location}
          </option>
        );
      });
    }
  }
}
