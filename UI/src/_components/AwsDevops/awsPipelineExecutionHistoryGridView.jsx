
import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable, MDBBtn } from 'mdbreact';
import { Link } from "react-router-dom";
import moment from 'moment';

Modal.setAppElement("#app");
class AwsPipelineExecutionHistoryDatatablePage extends React.Component {
    constructor(props) {
        super(props);
        this.values=[];
       
        let user = JSON.parse(localStorage.getItem("user"));
        
        this.state = {
            user:user.data,
            clientid: user.data.clientid,
            user_id: user.data.id,
            ticketDetail:[],
            modalIsOpen:false
        };
    }

    showExecutionList(){
        let values = [];
        let count = 0;

        this.props.awsPipelineExecutionHistoryList.data.map((val, index) =>{

            let stopbutton;

            if(val.status == 'InProgress'){
                if(this.props.loadingStopPipeline && this.props.stopExecution == val.pipelineExecutionId){
                    stopbutton = <MDBBtn disabled tag="a" onClick={(e) => this.props.handleStopPipeline(val.pipelineExecutionId)} color="blue" >Stop
                                        <div style={{marginLeft: 5}} class="spinner-border spinner-border-sm" role="status">
                                        </div>
                                </MDBBtn>
                }
                else{
                    stopbutton = <MDBBtn tag="a" onClick={(e) => this.props.handleStopPipeline(val.pipelineExecutionId)} color="blue" >Stop </MDBBtn>
                }
            }
            
            values.push({
                index: ++count,
                status: val.status,
                startTime: moment(val.startTime).format('DD-MM-YYYY HH:MM:SS'),
                lastUpdateTime: moment(val.lastUpdateTime).format('DD-MM-YYYY HH:MM:SS'),
                triggerType: val.trigger && val.trigger.triggerType ? val.trigger.triggerType : '',
                stopbutton: stopbutton
            })
        });

        return {
            columns: [
                {
                    label: 'Index',
                    field: 'index',
                    sort: 'asc',
                    width: 150
                },
                {
                    label: 'Status',
                    field: 'status',
                    sort: 'asc',
                    width: 150
                },
                {
                    label: 'Start Time',
                    field: 'startTime',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Last Update Time',
                    field: 'lastUpdateTime',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Trigger Type',
                    field: 'triggerType',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Stop Execution',
                    field: 'stopbutton',
                    // sort: 'asc',
                    width: 150
                }            
        ],
        rows: values
        }
    }

    render() {
        const {awsDevops}=this.props;
        const regex = /(<([^>]+)>)/ig;

        return (
            <div className="container-fluid main-body">
                {!this.props.loading && <MDBDataTable
                striped
                hover
                data={this.props.awsPipelineExecutionHistoryList &&
                    this.showExecutionList()}
                />}
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
      
    export default connect(mapStateToProps)(AwsPipelineExecutionHistoryDatatablePage);
