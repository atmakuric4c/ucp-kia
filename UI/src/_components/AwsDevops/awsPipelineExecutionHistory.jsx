import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { awsDevopsActions } from '../../_actions';
import Modal from "react-modal";
import AwsPipelineExecutionHistoryDatatablePage from './awsPipelineExecutionHistoryGridView';
import PageLoader from '../PageLoader';
import { useParams } from "react-router";

Modal.setAppElement("#app");
class AwsPipelineExecutionHistory extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      pgiData : [],
      action: null,
      stopExecution: null
    };

    this.handleStopPipeline = this.handleStopPipeline.bind(this)
  }

  handleStopPipeline(execution_id) {
    this.setState({stopExecution: execution_id})
    this.props.dispatch(awsDevopsActions.stopPipeline({execution_id: execution_id, pipeline_id: this.props.match.params.pipeline_id}));
  }

  componentDidMount() {
      //if(!this.props.awsDevops || !this.props.awsDevops.awsPipelineExecutionHistoryList || !this.props.awsDevops.awsPipelineExecutionHistoryList[this.props.match.params.pipeline_id]){
        var params = {clientid:this.state.clientid,cloudName:'AWS', pipeline_id: this.props.match.params.pipeline_id}
        this.props.dispatch(awsDevopsActions.getPipelineExecutionHistoryList(params));
      //}
  }
  render() { 
    const { awsDevops } = this.props;

    let awsPipelineExecutionHistoryList = awsDevops.awsPipelineExecutionHistoryList;

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">AWS Pipeline Execution History</h5>
          {!awsDevops.error && awsDevops.loading && <PageLoader/>}
          {awsDevops.error && <span className="text-danger">ERROR - {awsDevops.error}</span>}
          {awsPipelineExecutionHistoryList && awsPipelineExecutionHistoryList[this.props.match.params.pipeline_id] && 
          <AwsPipelineExecutionHistoryDatatablePage 
          stopExecution={this.state.stopExecution}
          handleStopPipeline={this.handleStopPipeline}
          loading={awsDevops.loading}
          loadingStopPipeline={this.props.awsDevops.loadingStopPipeline}
          awsPipelineExecutionHistoryList={awsPipelineExecutionHistoryList[this.props.match.params.pipeline_id]}/> }
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

const connected = connect(mapStateToProps)(AwsPipelineExecutionHistory);
export { connected as AwsPipelineExecutionHistory };