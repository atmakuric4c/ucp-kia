import React from "react";

export default class TabeData extends React.Component {
  constructor(props) {
    super(props);
    //this.props;
    //this.setState({ ip_history: [] });
    //console.log("in SUB" + JSON.stringify(this.));
    this.openModalIPHistory = this.openModalIPHistory.bind(this);
    // this.closeModalIPHistory = this.closeModalIPHistory.bind(this);
  }
  openModalIPHistory = item => {
    this.props.openModalIPHistory(item);
  };

  render() {
    // console.log(this.props.datadisp);
    if (!this.props.datadisp) {
      return (
        <tr>
          <td>Loading...</td>
        </tr>
      );
    } else {
      return this.props.datadisp.map((his, key) => {
        return (
          <tr key={his.id}>
            <td>{his.id}</td>
            <td>{his.ip_address}</td>
            <td>{his.gateway}</td>
            <td>{his.subnetmask}</td>
            <td>{his.status}</td>
            <td>
              <button
                href="javascript:void(0);"
                title="History"
                onClick={() => this.openModalIPHistory(his)}
              >
                <i className="fa fa-history" />
              </button>
            </td>
          </tr>
        );
      });
    }
  }
}
