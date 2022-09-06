import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable } from 'mdbreact';
import PageLoader from '../PageLoader';
import moment from 'moment';

Modal.setAppElement("#app");
class AwsPipelineStatus extends React.Component {
    constructor(props) {
        super(props);
        let user = JSON.parse(localStorage.getItem("user"));

        /*this.props.awsPipelineList.data.map((val, index) =>{
           
        })*/
        
        this.state = {
            user:user.data,
            clientid: user.data.clientid,
            user_id: user.data.id,
            ticketDetail:[],
            data: {}
        };

       

    }

    showPipelineStatus(){
        let awsPipelineStatus = this.props.awsPipelineStatus;
        let table = [];

        awsPipelineStatus.data.stageStates.forEach((element, index) => {
            if(element.actionStates && element.actionStates.length && element.actionStates[element.actionStates.length - 1]['latestExecution']){
                let name = element['stageName'];
                let status = element.actionStates[element.actionStates.length - 1]['latestExecution']['status'];
                let summary = element.actionStates[element.actionStates.length - 1]['latestExecution']['summary'] ? 
                element.actionStates[element.actionStates.length - 1]['latestExecution']['summary'] : '';
                let date = element.actionStates[element.actionStates.length - 1]['latestExecution']['lastStatusChange'];
                let badge = ''
                if(status == 'Succeeded') badge = 'badge badge-success'
                else if(status == 'Failed') badge = 'badge badge-danger'

                let singleObj = {
                    index: index + 1,
                    name: name,
                    status: <span style={{padding:5}} className={badge}>{status}</span>,
                    summary: summary,
                    date: moment(date).format('DD-MM-YYYY HH:MM:SS'),
                }
                table.push(singleObj);
            }
            
        });

        let data = {
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
                    label: 'Status',
                    field: 'status',
                    // sort: 'asc',
                    width: 150
                } ,
                {
                    label: 'Summary',
                    field: 'summary',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Date',
                    field: 'date',
                    // sort: 'asc',
                    width: 150
                }               
        ],
        rows: table
        };

        let toshow = <div>
                        <h5>Name: <span className='badge badge-primary'>{awsPipelineStatus.data.pipelineName}</span>
                        </h5>
                        <h5>Version: <span className=''>{awsPipelineStatus.data.pipelineVersion}</span>
                        </h5>
                        <br></br>
                        <div style={{padding: 0}} className="col-md-12">
                            <h5>Stages:</h5>
                            <br></br>
                            {data && <MDBDataTable
                            striped
                            hover
                            data={data}
                            />}
                        </div>
                    </div>
        return toshow
    }


    render() {
        const {awsDevops} = this.props;
        const regex = /(<([^>]+)>)/ig;

        return (
            <Modal isOpen={this.props.awsDevops.showPipelineStatusModal} contentLabel="AWS Pipeline Status">               
                  <h2 style={{color:'red'}}>
                      Pipeline Alert Status <a style={{cursor:'pointer'}} className="float-right" onClick={e => this.props.handlePipelineModalClose(e)}><i className="fa fa-times" /></a>
                  </h2>
                  {!awsDevops.error && awsDevops.loading && <PageLoader/>}
                  {this.props.awsPipelineStatus && this.showPipelineStatus()}
                  
          </Modal>
        );
        }
    }
    function mapStateToProps(state) {
        const { awsDevops } = state;
        return {
            awsDevops:awsDevops
        };
      }
      
    export default connect(mapStateToProps)(AwsPipelineStatus);
