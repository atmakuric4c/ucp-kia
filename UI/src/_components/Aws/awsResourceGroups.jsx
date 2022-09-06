import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { awsActions } from './aws.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import ReactHtmlParser from 'react-html-parser'; 
import DatatablePage from './resourceGroupsGridview';
import PageLoader from '../PageLoader';

const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");
class awsResourceGroups extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      aws: [],
      resourceGroups: [],
      sweetalert: null,
      action: null
    };

  }

  componentDidMount() {
    this.props.dispatch(awsActions.getAwsResourceGroups(this.state.clientid));
  }
  render() { 
    const { aws } = this.props;
    let resourceGroups = this.props.aws.resourceGroups;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          {!aws.error && aws.loading && <PageLoader/>}
          {aws.error && <span className="text-danger">ERROR - {aws.error}</span>}
          {resourceGroups && !aws.loading && <DatatablePage resourceGroups={resourceGroups}/> }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  console.log(state);
  const { aws } = state;
  return {
    aws
  };
}

const connected = connect(mapStateToProps)(awsResourceGroups);
export { connected as awsResourceGroups };