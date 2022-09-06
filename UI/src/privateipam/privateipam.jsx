import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { commonActions, alertActions } from "../_actions";
import { privateipamActions } from "./privateipam.actions";
import IpamModalComponent from "./IpamModalComponent";
import IpTable from "./IpTable";
var serialize = require("form-serialize");
//import ReactTable from "react-table";
import MyTable from "./myTable";
//import FormErrors from "./FormErrors";
const customStyles = {
  content: {}
};
class Privateipam extends React.Component {
  componentWillMount() {
    this.props.dispatch(
      privateipamActions.getIpamPageData(0, 10, this.searchKey, "")
    );
  }
  constructor(props) {
    super(props);
    this.state = {
      data: [{ rows: [], pages: 0 }],
      pages: null,
      loading: true,
      resolvedData: [],
      perPage: 10,
      searchKey: ""
    };
    this.updateParentpageSize = this.updateParentpageSize.bind(this);
    this.updateSearchtoparentsearchkey = this.updateSearchtoparentsearchkey.bind(
      this
    );
  }

  updateParentpageSize = number => {
    this.setState({ perpage: number });
    if (number > 9)
      this.props.dispatch(
        privateipamActions.getIpamPageData(0, number, "", "")
      );
    // console.log(this.state.perpage);
  };
  updateSearchtoparentsearchkey = searchkey => {
    this.props.dispatch(
      privateipamActions.getIpamPageData(0, 100, searchkey, "")
    );
  };
  fetchData(state, instance) {}

  render() {
    let { data, pages, loading } = this.props;
    let perPage = this.state.perPage;
    return (
      <div className="container-fluid main-body">
      <div className="contentarea">
        <h2 className='h2block'>Private IPAM </h2>
        <MyTable
          data={data}
          perPage={perPage}
          updateParentpageSize={this.updateParentpageSize.bind(this)}
          updateSearchtoparentsearchkey={this.updateSearchtoparentsearchkey.bind(
            this
          )}
        />
      </div>
      </div>
    );
  }
}
let mapStateToProps = state => ({
  data: state.ipam.data
});
const connectedPrivateipam = connect(mapStateToProps)(Privateipam);
export { connectedPrivateipam as Privateipam };
