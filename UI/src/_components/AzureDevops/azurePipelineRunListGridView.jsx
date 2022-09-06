
import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable, MDBBtn } from 'mdbreact';
import { Link } from "react-router-dom";
import moment from 'moment';

Modal.setAppElement("#app");
class AzurePipelineRunListDatatablePage extends React.Component {
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

    showRunList(){

        let values = [];
        let count = 0;

        if(this.props.azurePipelineRunList.data.value.length){
            this.props.azurePipelineRunList.data.value.map((val, index) =>{

                values.push({
                    index: ++count,
                    id: val.id,
                    state: val.state,
                    result: val.result,
                    created_date: moment(val.createdDate).format('DD-MM-YYYY HH:MM:SS'),
                    finished_date: moment(val.finishedDate).format('DD-MM-YYYY HH:MM:SS'),
                    status: <MDBBtn tag="a" onClick = {(e) => this.props.handlePipelineModalOpen(this.props.pipelineId, val.id)} color="blue" >Details</MDBBtn> 
                });
        
            })
        }

        return {
            columns: [
                {
                    label: 'Index',
                    field: 'index',
                    sort: 'asc',
                    width: 150
                },
                {
                    label: 'Name',
                    field: 'id',
                    sort: 'asc',
                    width: 150
                },
                {
                    label: 'State',
                    field: 'state',
                    // sort: 'asc',
                    width: 150
                },
                {
                  label: 'Result',
                  field: 'result',
                  // sort: 'asc',
                  width: 150
                },
                {
                  label: 'Created Date',
                  field: 'created_date',
                  // sort: 'asc',
                  width: 150
                },
                {
                  label: 'Finished Date',
                  field: 'finished_date',
                  // sort: 'asc',
                  width: 150
                } ,
                {
                    label: 'Details',
                    field: 'status',
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

        console.log('px112', ('data' in this.props.azurePipelineRunList.data));

        return (
            <div className="container-fluid main-body">
                {!this.props.loading && <MDBDataTable
                striped
                hover
                data={this.props.azurePipelineRunList && this.showRunList()}
                />}
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
      
    export default connect(mapStateToProps)(AzurePipelineRunListDatatablePage);
