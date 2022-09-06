import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { azureActions } from './azure.actions';
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
class azureResourceGroups extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      provision_type: user.data.provision_type,
      azure: [],
      resourceGroups: [],
      sweetalert: null,
      action: null
    };

  }

  componentDidMount() {
	  this.props.dispatch(azureActions.getAzureResourceGroups({clientid:this.state.clientid,
  		user_role: this.state.user_role, 
  		provision_type : this.state.provision_type,
  		user_id:this.state.user_id}));
  }
  render() { 
    const { azure } = this.props;
    let resourceGroups = this.props.azure.resourceGroups;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          {!azure.error && azure.loading && <PageLoader/>}
          {azure.error && <span className="text-danger">ERROR - {azure.error}</span>}
          {resourceGroups && !azure.loading && <DatatablePage resourceGroups={resourceGroups}/> }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  console.log(state);
  const { azure } = state;
  return {
    azure
  };
}

const connected = connect(mapStateToProps)(azureResourceGroups);
export { connected as azureResourceGroups };