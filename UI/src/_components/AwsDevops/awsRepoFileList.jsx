import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { awsDevopsActions } from '../../_actions';
import Modal from "react-modal";
import AwsRepoFileListDatatablePage from './awsRepoFileListGridView';
import PageLoader from '../PageLoader';
import { useParams } from "react-router";

Modal.setAppElement("#app");
class AwsRepoFileList extends React.Component {
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
      if(!this.props.awsDevops || !this.props.awsDevops.awsRepoFileList || !this.props.awsDevops.awsRepoFileList[this.props.match.params.repo_id]){
        var params = {clientid:this.state.clientid,cloudName:'AWS', repo_id: this.props.match.params.repo_id}
        this.props.dispatch(awsDevopsActions.getRepoFileList(params));
      }

      //if(!this.props.awsDevops || !this.props.awsDevops.awsRepoFileList || !this.props.awsDevops.awsRepoFileList[this.props.match.params.repo_id]){
        var params = {clientid:this.state.clientid,cloudName:'AWS', repo_id: this.props.match.params.repo_id}
        this.props.dispatch(awsDevopsActions.getRepoBranchList(params));
      //}
  }
  render() { 
    const { awsDevops } = this.props;

    let awsRepoFileList = awsDevops.awsRepoFileList;
    let awsRepoBranchList = awsDevops.awsRepoBranchList;
    let options = '';

    if(awsRepoBranchList){
      options = awsRepoBranchList.data.map((branch, index) => <option key={index} value={branch}>{branch}</option>);
    }

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">AWS Repository File List</h5>
          <div className="row">
              <div className="col-lg-6">
                <div className="form-group row">
                    <label htmlFor="cloud_type" className='col-sm-3 col-form-label'>Branch</label>  
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
          {!awsDevops.error && awsDevops.loading && <PageLoader/>}
          {awsDevops.error && <span className="text-danger">ERROR - {awsDevops.error}</span>}
          {awsRepoFileList && 
            awsRepoFileList[this.props.match.params.repo_id] && 
          <AwsRepoFileListDatatablePage 
          repo_id={this.props.match.params.repo_id}
          awsRepoFileList={awsRepoFileList[this.props.match.params.repo_id]}/> }
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

const connected = connect(mapStateToProps)(AwsRepoFileList);
export { connected as AwsRepoFileList };