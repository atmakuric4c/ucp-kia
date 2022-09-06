import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable } from 'mdbreact';
import PageLoader from '../PageLoader';

Modal.setAppElement("#app");
class AzureAddRepoModal extends React.Component {
    constructor(props) {
        super(props);
        let user = JSON.parse(localStorage.getItem("user"));
        
        this.state = {
            user:user.data,
            clientid: user.data.clientid,
            user_id: user.data.id,
            ticketDetail:[],
            data: {}
        };

    }


    loadOrganizationInfo(){

        let organizationList = this.props.organizations.data;

        let finalArr = organizationList.map((element, index) => {
            return <option
                    key={`organization${index}`}
                    value={element.organization_id}
                    className="form-control"                      
                >{element.name}</option>;
       });

       return finalArr;
    }


    loadProjectInfo(){

        let projectList = this.props.projects.data;

        let finalArr = projectList.map((element, index) => {
            return <option
                    key={`project${index}`}
                    value={element.project_id}
                    className="form-control"                      
                >{element.name}</option>;
       });

       return finalArr;
    }


    render() {
        const {azureDevops} = this.props;
        const regex = /(<([^>]+)>)/ig;
        let submitDisabled = azureDevops.loadingAddRepo;

        return (
            <Modal isOpen={this.props.azureDevops.showAddRepoModal}  contentLabel="Add Azure Repo">               
                  <h2 style={{color:'red'}}>
                      Create Azure Repository <a style={{cursor:'pointer'}} className="float-right" onClick={e => this.props.handleBudgetModalClose(e)}><i className="fa fa-times" /></a>
                  </h2>

                  <div className="col-md-12">
                        <div className="panel panel-default" />
                        <form
                        name="addAWSRepo"
                        id="addAWSRepo"
                        onSubmit={this.props.addAzureRepoSubmitHandler}
                        >
                        <div className="form-group">
                            <label htmlFor="name">Name<span className="star-mark">*</span></label>
                            <input
                            type="name"
                            className="form-control"
                            name="name"
                            required                      
                            placeholder="Enter Name : Cloud4c-Repo"
                            onChange={e => this.props.addRepoChangeHandler(e)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="region">Organization<span className="star-mark">*</span></label>
                            <select
                            type="organization_id"
                            className="form-control"
                            name="organization_id"
                            required
                            onChange={e => this.props.addOrganizationChangeHandler(e)}             
                            >
                            {this.props.organizations && this.loadOrganizationInfo()}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="region">Project<span className="star-mark">*</span></label>
                            <select
                            type="project_id"
                            className="form-control"
                            name="project_id"
                            required
                            onChange={e => this.props.addRepoChangeHandler(e)}             
                            >
                            {this.props.projects && this.loadProjectInfo()}
                            </select>
                        </div>
                        {azureDevops.loadingAddRepo && <PageLoader/>}
                        <div className="text-center btn-form-submit-parent">
                            <button
                            disabled={azureDevops.loadingOrganization || azureDevops.loadingProject || !azureDevops.azureProjectList.data.length || submitDisabled
                            ? true : false}
                            className="btn btn-sm btn-primary" type="submit">Submit</button>
                        </div>
                    </form>
                </div>
          </Modal>
        );
        }
    }
    function mapStateToProps(state) {
        const { azureDevops } = state;
        return {
            azureDevops: azureDevops
        };
      }
      
    export default connect(mapStateToProps)(AzureAddRepoModal);
