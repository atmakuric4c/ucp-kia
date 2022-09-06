import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable, MDBBtn } from 'mdbreact';
import { Link } from "react-router-dom";
import moment from 'moment';

Modal.setAppElement("#app");
class GcpPipelineListDatatablePage extends React.Component {
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
            
        };
    }

    showData(){

        let values = [];

        this.props.gcpPipelineList.data.builds.map((val, index) =>{
            values.push({
                index: index + 1,
                id: val.id,
                name: val.name,
                status: val.status,
                startTime: moment(val.startTime).format('DD-MM-YYYY HH:MM:SS'),
                finishTime: moment(val.finishTime).format('DD-MM-YYYY HH:MM:SS'),
                repo_name: val.substitutions ? val.substitutions.REPO_NAME: '',
                branch_name: val.substitutions ? val.substitutions.BRANCH_NAME : ''
            })
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
                    label: 'ID',
                    field: 'id',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Status',
                    field: 'status',
                    // sort: 'asc',
                    width: 150
                },    
                {
                    label: 'Start Time',
                    field: 'startTime',
                    // sort: 'asc',
                    width: 150
                } ,
                {
                    label: 'Finish Time',
                    field: 'finishTime',
                    // sort: 'asc',
                    width: 150
                } ,
                {
                    label: 'Repo Name',
                    field: 'repo_name',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Branch Name',
                    field: 'branch_name',
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
                {this.props.gcpPipelineList && <MDBDataTable
                striped
                hover
                data={this.showData()}
                />}
            </div>
        );
        }
    }
    function mapStateToProps(state) {
        return {
            
        };
      }
      
    export default connect(mapStateToProps)(GcpPipelineListDatatablePage);
