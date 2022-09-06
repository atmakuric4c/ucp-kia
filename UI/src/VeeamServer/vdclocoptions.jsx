import React from "react";

export default class Vdclocoptions extends React.Component {
  constructor(props) {
    super(props);
    let vdc = this.props;
  }
  render() {
    let vdc_info = this.vdcData;
    console;
    if (vdc_info) {
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
