import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { azureDevopsActions } from '../../_actions';
import Modal from "react-modal";
import AzureRepoFileListDatatablePage from './azureRepoFileListGridView';
import PageLoader from '../PageLoader';
import { useParams } from "react-router";

Modal.setAppElement("#app");
class AzureRepoFileList extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      pgiData : [],
      action: null
    };
  }

  componentDidMount() {
      if(!this.props.azureDevops || !this.props.azureDevops.azureRepoFileList || !this.props.azureDevops.azureRepoFileList[this.props.match.params.repo_id]){
        var params = {clientid:this.state.clientid,cloudName:'Azure', repo_id: this.props.match.params.repo_id}
        this.props.dispatch(azureDevopsActions.getRepoFileList(params));
      }
  }
  render() { 
    const { azureDevops } = this.props;

    let azureRepoFileList = azureDevops.azureRepoFileList;

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">Azure Repository File List</h5>
          {!azureDevops.error && azureDevops.loading && <PageLoader/>}
          {azureDevops.error && <span className="text-danger">ERROR - {azureDevops.error}</span>}
          {azureRepoFileList && azureRepoFileList[this.props.match.params.repo_id] && <AzureRepoFileListDatatablePage azureRepoFileList={azureRepoFileList[this.props.match.params.repo_id]}/> }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { azureDevops } = state;
  return {
    azureDevops
  };
}

const connected = connect(mapStateToProps)(AzureRepoFileList);
export { connected as AzureRepoFileList };