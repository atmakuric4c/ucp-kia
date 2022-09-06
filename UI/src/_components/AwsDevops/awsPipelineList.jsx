import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { awsDevopsActions } from '../../_actions';
import Modal from "react-modal";
import AwsPipelineListDatatablePage from './awsPipelineListGridView';
import AwsPipelineStatus from './awsPipelineStatus';
import PageLoader from '../PageLoader';

Modal.setAppElement("#app");
class AwsPipelineList extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      pgiData : [],
      action: null,
      startPipeline: null
    };

    this.handlePipelineModalOpen = this.handlePipelineModalOpen.bind(this)
    this.handlePipelineModalClose = this.handlePipelineModalClose.bind(this)
    this.handleStartPipeline = this.handleStartPipeline.bind(this)
  }

  componentDidMount() {
    if(!this.props.awsDevops || !this.props.awsDevops.awsPipelineList){
        var params = {clientid:this.state.clientid,cloudName:'AWS'}
        this.props.dispatch(awsDevopsActions.getPipelineList(params));
    }
  }

  handlePipelineModalOpen(pipeline_id) {
    this.props.dispatch(awsDevopsActions.updatePipelineStatusModal(true));
    this.props.dispatch(awsDevopsActions.getPipelineStatus({pipeline_id: pipeline_id}));
  }


  handleStartPipeline(pipeline_id) {
    this.setState({startPipeline: pipeline_id})
    this.props.dispatch(awsDevopsActions.startPipeline({pipeline_id: pipeline_id}));
  }


  handlePipelineModalClose(e) {
    e.preventDefault();
    this.props.dispatch(awsDevopsActions.updatePipelineStatusModal(false));
  }

  render() { 

    const { awsDevops } = this.props;
    let awsPipelineList = awsDevops.awsPipelineList;
    let awsPipelineStatus = awsDevops.awsPipelineStatus;

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">AWS Pipeline List</h5>
          {/*!awsDevops.error && awsDevops.loading && <PageLoader/>*/}
          {awsDevops.error && <span className="text-danger">ERROR - {awsDevops.error}</span>}
          {awsDevops.showPipelineStatusModal && <AwsPipelineStatus 
              awsPipelineStatus={awsPipelineStatus}
              handlePipelineModalClose={this.handlePipelineModalClose}>
          </AwsPipelineStatus>}
          {awsPipelineList && <AwsPipelineListDatatablePage 
          handlePipelineModalOpen={this.handlePipelineModalOpen} 
          handleStartPipeline={this.handleStartPipeline}
          startPipeline={this.state.startPipeline}
          loadingStartPipeline={this.props.awsDevops.loadingStartPipeline}
          awsPipelineList={awsPipelineList}/> }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { awsDevops } = state;
  return {
    awsDevops
  };
}

const connected = connect(mapStateToProps)(AwsPipelineList);
export { connected as AwsPipelineList };