import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable, MDBBtn } from 'mdbreact';
import { Link } from "react-router-dom";

Modal.setAppElement("#app");
class AzurePipelineListDatatablePage extends React.Component {
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

    showPipelineList(){

        let values = [];

        this.props.azurePipelineList.data.map((val, index) =>{
            let link = `/#/azure-pipeline-list/${val.pipeline_id}/run`;

            let startButton;
            
            if(this.props.loadingStartPipeline && this.props.startPipeline == val.pipeline_id){
                startButton = <MDBBtn disabled tag="a" onClick = {(e) => this.props.handleStartPipeline(val.pipeline_id)} color="blue" >Start
                    <div style={{marginLeft: 5}} class="spinner-border spinner-border-sm" role="status">
                    </div>
                </MDBBtn>
            } 
            else{
                startButton = <MDBBtn tag="a" onClick = {(e) => this.props.handleStartPipeline(val.pipeline_id)} color="blue" >Start</MDBBtn>
            }

            values[index] = {
                index: index + 1,
                name: val.name,
                organization_name: val.organization_name,
                project_name: val.project_name,
                handle: <MDBBtn tag="a" href={link} color="blue" >View</MDBBtn>,
                start: startButton
            }
        });

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
                    label: 'Execution Details',
                    field: 'handle',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Start Execution',
                    field: 'start',
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
                data={this.props.azurePipelineList && this.showPipelineList()}
                />
            </div>
        );
        }
    }
    function mapStateToProps(state) {
        return {
            
        };
      }
      
    export default connect(mapStateToProps)(AzurePipelineListDatatablePage);
