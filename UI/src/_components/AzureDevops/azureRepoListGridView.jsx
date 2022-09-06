import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable, MDBBtn } from 'mdbreact';
import { Link } from "react-router-dom";

Modal.setAppElement("#app");
class AzureRepoListDatatablePage extends React.Component {
    constructor(props) {
        super(props);
        this.values=[];

        let user = JSON.parse(localStorage.getItem("user"));
        
        this.state = {
            user:user.data,
            clientid: user.data.clientid,
            user_id: user.data.id,
            ticketDetail:[],
            modalIsOpen:false,
            data: null
        };
    }

    showRepoList(){

        let values = [];

        this.props.azureRepoList.data.map((val, index) =>{
            let link = `/#/azure-repository-list/${val.repo_id}`;
            let deletebutton;

            if(this.props.loadingDeleteRepo && this.props.deleteRepo == val.repo_id){
                deletebutton = <MDBBtn disabled tag="a" onClick={(e) => this.props.handleDelete(val.repo_id)} color="blue" >Delete 
                                    <div style={{marginLeft: 5}} class="spinner-border spinner-border-sm" role="status">
                                    </div>
                            </MDBBtn>
            }
            else{
                deletebutton = <MDBBtn tag="a" onClick={(e) => this.props.handleDelete(val.repo_id)} color="blue" >Delete </MDBBtn>
            }

            values[index] = {
                index: index + 1,
                name: val.name,
                organization_name: val.organization_name,
                project_name: val.project_name,
                default_branch: val.default_branch,
                handle: <MDBBtn tag="a" href={link} color="blue" >View</MDBBtn>,
                delete: deletebutton
            }
        })

        return {
            columns: [
                {
                    label: 'Index',
                    field: 'index',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Name',
                    field: 'name',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Organization',
                    field: 'organization_name',
                    // sort: 'asc',
                    width: 150
                } ,
                {
                    label: 'Project',
                    field: 'project_name',
                    // sort: 'asc',
                    width: 150
                } ,
                {
                    label: 'Default Branch',
                    field: 'default_branch',
                    // sort: 'asc',
                    width: 150
                } ,
                {
                    label: 'Details',
                    field: 'handle',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Delete',
                    field: 'delete',
                    // sort: 'asc',
                    width: 150
                }                
        ],
        rows: values
        }

    }

    render() {
        const {billing}=this.props;
        const regex = /(<([^>]+)>)/ig;
        return (
            <div className="container-fluid main-body">
                <MDBDataTable
                striped
                hover
                data={this.props.azureRepoList && this.showRepoList()}
                />
            </div>
        );
        }
    }
    function mapStateToProps(state) {
        return {
            
        };
      }
      
    export default connect(mapStateToProps)(AzureRepoListDatatablePage);
