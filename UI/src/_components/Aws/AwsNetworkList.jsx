import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { awsActions } from './aws.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import ReactHtmlParser from 'react-html-parser'; 
import DatatablePage from './awsNetworkGrid';
import PageLoader from '../PageLoader';


Modal.setAppElement("#app");
class AwsNetworkList extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      aws: [],
      networks: [],
      sweetalert: null,
      action: null
    };

  }

  componentDidMount() {
    this.props.dispatch(awsActions.getAllNetwork(this.state.clientid));
  }
  render() { 
    const { awsNetwrok } = this.props;
    let networks = this.props.awsNetwrok.items;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          {!awsNetwrok.error && awsNetwrok.loading && <PageLoader/>}
          {awsNetwrok.error && <span className="text-danger">ERROR - {awsNetwrok.error}</span>}
          {networks && !awsNetwrok.loading && <DatatablePage networks={networks}/> }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { awsNetwrok } = state;
  return {
    awsNetwrok
  };
}

const connected = connect(mapStateToProps)(AwsNetworkList);
export { connected as AwsNetworkList };