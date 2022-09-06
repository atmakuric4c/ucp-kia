import React from "react";

export default class Dstoreoptions extends React.Component {
  constructor(props) {
    super(props);
    //let vdc = this.props;
  }
  render() {
    let dstorelists = this.props.dstoreops;
    console.log("-->" + typeof dstorelists);
    if (typeof dstorelists == "undefined") {
      return <option>Loading</option>;
    } else {
      console.log(this.props.dstoreops);
      return this.props.dstoreops.data.map((v, key) => {
        return (
          <option value={v.NAME} key={v.ID}>
            {v.ID} -{v.NAME} -- Type -- {v.TYPE}
          </option>
        );
      });
    }
  }
}
