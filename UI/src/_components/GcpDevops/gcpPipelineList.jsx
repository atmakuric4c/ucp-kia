import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { gcpDevopsActions } from '../../_actions';
import Modal from "react-modal";
import GcpPipelineListDatatablePage from './gcpPipelineListGridView';
import PageLoader from '../PageLoader';

Modal.setAppElement("#app");
class GcpPipelineList extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      project: 1,
      pgiData : [],
      action: null
    };
  }

  componentDidMount() {
    /*if(!this.props.gcpDevops || !this.props.gcpDevops.gcpProjectList){*/
        let params = {clientid:this.state.clientid,cloudName:'GCP', url: this.props.location.pathname}
        this.props.dispatch(gcpDevopsActions.getProjectList(params));
    /*}*/
  }

  projectChange = (project) => {
    let params = {clientid:this.state.clientid,cloudName:'GCP',project_id: project}
    this.props.dispatch(gcpDevopsActions.getPipelineList(params));
  }

  render() { 

    const { gcpDevops } = this.props;

    let gcpProjectList = gcpDevops.gcpProjectList;
    let gcpPipelineList = gcpDevops.gcpPipelineList;
    let options = '';


    if(gcpProjectList){
        options = gcpProjectList.data.map((project, index) => <option key={index} value={project.projectId}>{project.name}</option>);
    }

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">GCP Pipeline List</h5>
          <div className="row">
              <div className="col-lg-6">
                <div className="form-group row">
                        <label htmlFor="cloud_type" className='col-sm-3 col-form-label'>Project</label>  
                    <div className="col-sm-9">
                            <select
                            className="form-control-vm form-gcp-project"
                            required
                            name="GcpProject"
                            onChange={e => this.projectChange(e.target.value)}
                            >{options.length && options}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
          {!gcpDevops.error && gcpDevops.loading && <PageLoader/>}
          {gcpDevops.error && <span className="text-danger">ERROR - {gcpDevops.error}</span>}
          {gcpPipelineList && <GcpPipelineListDatatablePage gcpPipelineList={gcpPipelineList}/> }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { gcpDevops } = state;
  return {
    gcpDevops
  };
}

const connected = connect(mapStateToProps)(GcpPipelineList);
export { connected as GcpPipelineList };