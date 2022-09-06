import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { azureDevopsActions } from '../../_actions';
import Modal from "react-modal";
import AzurePipelineListDatatablePage from './azurePipelineListGridView';
import PageLoader from '../PageLoader';

Modal.setAppElement("#app");
class AzurePipelineList extends React.Component {
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

    this.handleStartPipeline = this.handleStartPipeline.bind(this)
  }

  componentDidMount() {
    if(!this.props.azureDevops || !this.props.azureDevops.azurePipelineList){
        var params = {clientid:this.state.clientid,cloudName:'Azure'}
        this.props.dispatch(azureDevopsActions.getPipelineList(params));
    }
  }

  handleStartPipeline(pipeline_id) {
    this.setState({startPipeline: pipeline_id})
    this.props.dispatch(azureDevopsActions.startPipeline({pipeline_id: pipeline_id}));
  }

  render() { 

    const { azureDevops } = this.props;

    let azurePipelineList = azureDevops.azurePipelineList;

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">Azure Pipeline List</h5>
          {!azureDevops.error && azureDevops.loading && <PageLoader/>}
          {azureDevops.error && <span className="text-danger">ERROR - {azureDevops.error}</span>}
          {azurePipelineList && <AzurePipelineListDatatablePage 
          handleStartPipeline={this.handleStartPipeline}
          startPipeline={this.state.startPipeline}
          loadingStartPipeline={azureDevops.loadingStartPipeline}
          azurePipelineList={azurePipelineList}/> }
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

const connected = connect(mapStateToProps)(AzurePipelineList);
export { connected as AzurePipelineList };