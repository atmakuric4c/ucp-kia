import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable } from 'mdbreact';
import PageLoader from '../PageLoader';
import moment from 'moment';

Modal.setAppElement("#app");
class AzurePipelineStatus extends React.Component {
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
        let azurePipelineStatus = this.props.azurePipelineStatus;
        let table = [];
        let stateBadge = 'badge badge-danger';
        let resultBadge = 'badge badge-primary';

        if(azurePipelineStatus.data.state == 'completed')
        stateBadge = 'badge badge-success'

        if(azurePipelineStatus.data.result == 'succeeded')
        resultBadge = 'badge badge-success'

        let repoName, repoType, refName, version;

        if(azurePipelineStatus.data['resources'] && azurePipelineStatus.data['resources']['repositories']['self']){
            repoName = azurePipelineStatus.data['resources']['repositories']['self']['repository']['fullName'];
            repoType = azurePipelineStatus.data['resources']['repositories']['self']['repository']['type'];
            refName = azurePipelineStatus.data['resources']['repositories']['self']['refName'];
            version = azurePipelineStatus.data['resources']['repositories']['self']['version'];
        }

        let styleHeading = {
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold'
        }

        let styleValue = {
            color: 'white',
            fontSize: 16,
            wordWrap: 'break-word'
        }
       

        let toshow = <div>
                        <p><span style={styleHeading}>Name:</span> <span className='badge badge-primary'>{azurePipelineStatus.data.name}</span>
                        </p>
                        <p><span style={styleHeading}>State:</span> <span className={stateBadge}>{azurePipelineStatus.data.state}</span>
                        </p>
                        <p><span style={styleHeading}>Result:</span> <span className={resultBadge}>{azurePipelineStatus.data.result}</span>
                        </p>
                        <p><span style={styleHeading}>Created Date:</span> <span style={styleValue}>{moment(azurePipelineStatus.data.createdDate).format('DD-MM-YYYY HH:MM:SS')}</span>
                        </p>
                        <p><span style={styleHeading}>Finished Date:</span> <span style={styleValue}>{moment(azurePipelineStatus.data.finishedDate).format('DD-MM-YYYY HH:MM:SS')}</span>
                        </p>
                        <p><span style={styleHeading}>Repository Name:</span> <span style={styleValue}>{repoName}</span>
                        </p>
                        <p><span style={styleHeading}>Repoistory Type:</span> <span style={styleValue}>{repoType}</span>
                        </p>
                        <p><span style={styleHeading}>Ref Name:</span> <span style={styleValue}>{refName}</span>
                        </p>
                        <p><span style={styleHeading}>Version:</span> <span style={styleValue}>{version}</span>
                        </p>
                        <br></br>
                    </div>
        return toshow
    }


    render() {
        const {azureDevops} = this.props;
        const regex = /(<([^>]+)>)/ig;

        return (
            <Modal isOpen={this.props.azureDevops.showPipelineStatusModal} contentLabel="AWS Pipeline Status">               
                  <h2 style={{color:'red'}}>
                      Azure Pipeline Run Status <a style={{cursor:'pointer'}} className="float-right" onClick={e => this.props.handlePipelineModalClose(e)}><i className="fa fa-times" /></a>
                  </h2>
                  {!azureDevops.error && azureDevops.loadingModal && <PageLoader/>}
                  {this.props.azurePipelineStatus && this.showPipelineStatus()}
                  
          </Modal>
        );
        }
    }
    function mapStateToProps(state) {
        const { azureDevops } = state;
        return {
            azureDevops:azureDevops
        };
      }
      
    export default connect(mapStateToProps)(AzurePipelineStatus);
