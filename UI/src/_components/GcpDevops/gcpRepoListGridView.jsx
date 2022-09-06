import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable, MDBBtn } from 'mdbreact';
import { Link } from "react-router-dom";

Modal.setAppElement("#app");
class GcpRepoListDatatablePage extends React.Component {
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

        this.props.gcpRepoList.data.triggers.map((val, index) =>{
            values.push({
                index: index + 1,
                name: val.name,
                github_name: val.github && val.github.name ? val.github.name: '',
                owner: val.github && val.github.owner ? val.github.owner: '',
                branch: val.github && val.github.push && val.github.push.branch ? val.github.push.branch: ''
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
                    label: 'Name',
                    field: 'name',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'GitHub Name',
                    field: 'github_name',
                    // sort: 'asc',
                    width: 150
                } ,
                {
                    label: 'GitHub Owner',
                    field: 'owner',
                    // sort: 'asc',
                    width: 150
                } ,
                {
                    label: 'GitHub Branch',
                    field: 'branch',
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
                data={this.showData()}
                />
            </div>
        );
        }
    }
    function mapStateToProps(state) {
        return {
            
        };
      }
      
    export default connect(mapStateToProps)(GcpRepoListDatatablePage);
