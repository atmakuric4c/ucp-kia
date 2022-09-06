import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { azureDevopsActions } from '../../_actions';
import Modal from "react-modal";
import AzurePipelineRunListDatatablePage from './azurePipelineRunListGridView';
import PageLoader from '../PageLoader';
import AzurePipelineStatus from './azurePipelineRunStatus';
import { useParams } from "react-router";

Modal.setAppElement("#app");
class AzurePipelineRunList extends React.Component {
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

    this.handlePipelineModalOpen = this.handlePipelineModalOpen.bind(this)
    this.handlePipelineModalClose = this.handlePipelineModalClose.bind(this)

  }

  componentDidMount() {
      //if(!this.props.azureDevops || !this.props.azureDevops.azurePipelineRunList || !this.props.azureDevops.azurePipelineRunList[this.props.match.params.pipeline_id]){
        var params = {clientid:this.state.clientid,cloudName:'Azure', pipeline_id: this.props.match.params.pipeline_id}
        this.props.dispatch(azureDevopsActions.getPipelineRunList(params));
      //}
  }

  handlePipelineModalOpen(pipeline_id, run_id) {
    this.props.dispatch(azureDevopsActions.updatePipelineStatusModal(true));
    this.props.dispatch(azureDevopsActions.getPipelineStatus({pipeline_id: pipeline_id, run_id: run_id}));
  }


  handlePipelineModalClose(e) {
    e.preventDefault();
    this.props.dispatch(azureDevopsActions.updatePipelineStatusModal(false));
  }

  render() { 
    const { azureDevops } = this.props;

    let azurePipelineRunList = azureDevops.azurePipelineRunList;
    let azurePipelineStatus = azureDevops.azurePipelineStatus;

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">Azure Pipeline Run List</h5>
          {!azureDevops.error && azureDevops.loading && <PageLoader/>}
          {azureDevops.error && <span className="text-danger">ERROR - {azureDevops.error}</span>}
          {azureDevops.showPipelineStatusModal && <AzurePipelineStatus 
              azurePipelineStatus={azurePipelineStatus}
              handlePipelineModalClose={this.handlePipelineModalClose}>
          </AzurePipelineStatus>}
          {azurePipelineRunList && azurePipelineRunList[this.props.match.params.pipeline_id] && <AzurePipelineRunListDatatablePage 
          handlePipelineModalOpen={this.handlePipelineModalOpen} 
          loading={azureDevops.loading}
          pipelineId={this.props.match.params.pipeline_id} 
          azurePipelineRunList={azurePipelineRunList[this.props.match.params.pipeline_id]}/> }
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

const connected = connect(mapStateToProps)(AzurePipelineRunList);
export { connected as AzurePipelineRunList };