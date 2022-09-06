import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { awsDevopsActions } from '../../_actions';
import Modal from "react-modal";
import AwsRepoListDatatablePage from './awsRepoListGridView';
import PageLoader from '../PageLoader';
import AwsAddRepoModal from './awsAddRepoModal';

Modal.setAppElement("#app");
class AwsRepoList extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      pgiData : [],
      action: null,
      name: null,
      description: null,
      region: null,
      deleteRepo: null
    };

    this.handleBudgetModalOpen = this.handleBudgetModalOpen.bind(this)
    this.handleBudgetModalClose = this.handleBudgetModalClose.bind(this)
    this.addAWSRepoSubmitHandler = this.addAWSRepoSubmitHandler.bind(this)
    this.addRepoChangeHandler = this.addRepoChangeHandler.bind(this)
    this.handleDelete = this.handleDelete.bind(this)
  }


  handleBudgetModalOpen() {
    this.props.dispatch(awsDevopsActions.updateAddRepoModal(true));
  }


  handleBudgetModalClose(e) {
    e.preventDefault();
    this.props.dispatch(awsDevopsActions.updateAddRepoModal(false));
  }

  addAWSRepoSubmitHandler(event) {

    event.preventDefault();
    let addRepoParams = {
      name: this.state.name,
      description: this.state.description,
      region: this.state.region ? this.state.region : this.props.awsDevops.awsRegionList['data'][0]['regionid'] 
    }
    this.props.dispatch(awsDevopsActions.addAWSRepo(addRepoParams));
  }

  addRepoChangeHandler(event) {
    this.setState({[event.target.name]: event.target.value});
  }

  handleDelete(repo_id){
    this.setState({deleteRepo: repo_id})
    this.props.dispatch(awsDevopsActions.deleteAWSRepo({repo_id: repo_id}));
  }

  componentDidMount() {
    if(!this.props.awsDevops || !this.props.awsDevops.awsRepoList){
        var params = {clientid:this.state.clientid,cloudName:'AWS'}
        this.props.dispatch(awsDevopsActions.getRepoList(params));
    }

    if(!this.props.awsDevops || !this.props.awsDevops.awsRegionList){
      var params = {clientid:this.state.clientid,cloudName:'AWS'}
      this.props.dispatch(awsDevopsActions.getRegionList(params));
    }
  }
  render() { 

    const { awsDevops } = this.props;
    let awsRepoList = awsDevops.awsRepoList;
    let awsRegionList = awsDevops.awsRegionList;

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">AWS Repository List</h5>
          <div className="text-right">
              <button
                  className="btn btn-sm btn-primary mr-3"
                  onClick={this.handleBudgetModalOpen}
              > <i className="fa fa-plus" /> Create Repository
              </button>
          </div>
          <br></br>
          {awsDevops.showAddRepoModal && <AwsAddRepoModal  
              regions={awsRegionList}
              handleBudgetModalClose={this.handleBudgetModalClose}
              addRepoChangeHandler={this.addRepoChangeHandler}
              addAWSRepoSubmitHandler={this.addAWSRepoSubmitHandler}>
          </AwsAddRepoModal>}
          {!awsDevops.error && awsDevops.loading && <PageLoader/>}
          {awsDevops.error && <span className="text-danger">ERROR - {awsDevops.error}</span>}
          {awsRepoList && <AwsRepoListDatatablePage 
          handleDelete={this.handleDelete} 
          awsRepoList={awsRepoList}
          deleteRepo={this.state.deleteRepo}
          loadingDeleteRepo={this.props.awsDevops.loadingDeleteRepo}/> }
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

const connected = connect(mapStateToProps)(AwsRepoList);
export { connected as AwsRepoList };