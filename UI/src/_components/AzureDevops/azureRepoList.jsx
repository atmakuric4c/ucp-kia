import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { azureDevopsActions } from '../../_actions';
import Modal from "react-modal";
import AzureRepoListDatatablePage from './azureRepoListGridView';
import PageLoader from '../PageLoader';
import AzureAddRepoModal from './azureAddRepoModal';

Modal.setAppElement("#app");
class AzureRepoList extends React.Component {
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
      organization_id: null,
      project_id: null,
      deleteRepo: null
    };

    this.handleBudgetModalOpen = this.handleBudgetModalOpen.bind(this)
    this.handleBudgetModalClose = this.handleBudgetModalClose.bind(this)
    this.addOrganizationChangeHandler = this.addOrganizationChangeHandler.bind(this)
    this.addRepoChangeHandler = this.addRepoChangeHandler.bind(this)
    this.addAzureRepoSubmitHandler = this.addAzureRepoSubmitHandler.bind(this)
    this.handleDelete = this.handleDelete.bind(this)
  }

  handleBudgetModalOpen() {
    this.props.dispatch(azureDevopsActions.updateAddRepoModal(true));
  }


  handleBudgetModalClose(e) {
    e.preventDefault();
    this.props.dispatch(azureDevopsActions.updateAddRepoModal(false));
  }

  addOrganizationChangeHandler(event) {
    this.setState({[event.target.name]: event.target.value});
    this.props.dispatch(azureDevopsActions.getProjectList({[event.target.name]: event.target.value}));
  }

  addRepoChangeHandler(event) {
    this.setState({[event.target.name]: event.target.value});
  }

  addAzureRepoSubmitHandler(event) {

    event.preventDefault();

    let organization = 'data' in this.props.azureDevops.azureOrganizationList && this.props.azureDevops.azureOrganizationList.data.length ? this.props.azureDevops.azureOrganizationList['data'][0]['organization_id'] : null;
    let project = 'data' in this.props.azureDevops.azureOrganizationList && this.props.azureDevops.azureProjectList.data.length ? this.props.azureDevops.azureProjectList['data'][0]['project_id'] : null;

    let addRepoParams = {
      name: this.state.name,
      organization_id: this.state.organization_id ? this.state.organization_id : organization, 
      project_id: String(this.state.project_id ? this.state.project_id : project) 
    }
    this.props.dispatch(azureDevopsActions.addAzureRepo(addRepoParams));
  }

  handleDelete(repo_id){
    this.setState({deleteRepo: repo_id})
    this.props.dispatch(azureDevopsActions.deleteAzureRepo({repo_id: repo_id}));
  }

  componentDidMount() {
    if(!this.props.azureDevops || !this.props.azureDevops.azureRepoList){
        var params = {clientid:this.state.clientid,cloudName:'AWS'}
        this.props.dispatch(azureDevopsActions.getRepoList(params));
    }

    if(!this.props.awsDevops || !this.props.azureDevops.awsOrganizationList){
      var params = {clientid:this.state.clientid,cloudName:'AWS'}
      this.props.dispatch(azureDevopsActions.getOrganizationList(params));
    }

  }
  render() { 

    const { azureDevops } = this.props;

    let azureRepoList = azureDevops.azureRepoList;
    let azureOrganizationList = azureDevops.azureOrganizationList;
    let azureProjectList = azureDevops.azureProjectList;


    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">Azure Repository List</h5>
          <div className="text-right">
              <button
                  className="btn btn-sm btn-primary mr-3"
                  onClick={this.handleBudgetModalOpen}
              > <i className="fa fa-plus" /> Create Repository
              </button>
          </div>
          <br></br>
          {azureDevops.showAddRepoModal && <AzureAddRepoModal  
              organizations={azureOrganizationList}
              projects={azureProjectList}
              handleBudgetModalClose={this.handleBudgetModalClose}
              addOrganizationChangeHandler={this.addOrganizationChangeHandler}
              addRepoChangeHandler={this.addRepoChangeHandler}
              addAzureRepoSubmitHandler={this.addAzureRepoSubmitHandler}>
          </AzureAddRepoModal>}
          {!azureDevops.error && azureDevops.loading && <PageLoader/>}
          {azureDevops.error && <span className="text-danger">ERROR - {azureDevops.error}</span>}
          {azureRepoList && <AzureRepoListDatatablePage 
          handleDelete={this.handleDelete} 
          azureRepoList={azureRepoList}
          deleteRepo={this.state.deleteRepo}
          loadingDeleteRepo={this.props.azureDevops.loadingDeleteRepo}/> }
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

const connected = connect(mapStateToProps)(AzureRepoList);
export { connected as AzureRepoList };