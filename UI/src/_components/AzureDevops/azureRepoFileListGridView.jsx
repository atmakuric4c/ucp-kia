
import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable } from 'mdbreact';
import { Link } from "react-router-dom";

Modal.setAppElement("#app");
class AwsRepoListDatatablePage extends React.Component {
    constructor(props) {
        super(props);
        this.values=[];
        let count = 0;

       
        this.props.azureRepoFileList.data.map((val, index) =>{
        if(index){
        this.values.push({
            index: ++count,
            name: val.path,
            type: val.isFolder ? 'Folder' : 'File'
        });
        }
        })

        let user = JSON.parse(localStorage.getItem("user"));
        
        this.state = {
            user:user.data,
            clientid: user.data.clientid,
            user_id: user.data.id,
            ticketDetail:[],
            modalIsOpen:false,
            data: {
                columns: [
                    {
                        label: 'Index',
                        field: 'index',
                        sort: 'asc',
                        width: 150
                    },
                    {
                        label: 'Name',
                        field: 'name',
                        sort: 'asc',
                        width: 150
                    },
                    {
                        label: 'Type',
                        field: 'type',
                        // sort: 'asc',
                        width: 150
                    }         
            ],
            rows: this.values
            }
        };
    }

    render() {
        const {billing}=this.props;
        const regex = /(<([^>]+)>)/ig;
        return (
            <div className="container-fluid main-body">
                <MDBDataTable
                striped
                hover
                data={this.state.data}
                />
            </div>
        );
        }
    }
    function mapStateToProps(state) {
        return {
            
        };
      }
      
    export default connect(mapStateToProps)(AwsRepoListDatatablePage);
