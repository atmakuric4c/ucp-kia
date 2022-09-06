import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable } from 'mdbreact';
import PageLoader from '../PageLoader';

Modal.setAppElement("#app");
class AwsAddRepoModal extends React.Component {
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


    loadRegionInfo(){

        let regionList = this.props.regions.data;

        let finalArr = regionList.map((element, index) => {
            return <option
                    key={`region${index}`}
                    value={element.regionid}
                    className="form-control"                      
                >{element.regionname}</option>;
       });

       return finalArr;
    }


    render() {
        const {awsDevops} = this.props;
        const regex = /(<([^>]+)>)/ig;
        let submitDisabled = awsDevops.loadingAddRepo;

        return (
            <Modal isOpen={this.props.awsDevops.showAddRepoModal}  contentLabel="Add AWS Repo">               
                  <h2 style={{color:'red'}}>
                      Create AWS Repository <a style={{cursor:'pointer'}} className="float-right" onClick={e => this.props.handleBudgetModalClose(e)}><i className="fa fa-times" /></a>
                  </h2>

                  <div className="col-md-12">
                        <div className="panel panel-default" />
                        <form
                        name="addAWSRepo"
                        id="addAWSRepo"
                        onSubmit={this.props.addAWSRepoSubmitHandler}
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
                            <label htmlFor="description">Description</label>
                            <input
                            type="description"
                            className="form-control"
                            name="description"              
                            placeholder="Enter Description"
                            onChange={e => this.props.addRepoChangeHandler(e)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="region">Region<span className="star-mark">*</span></label>
                            <select
                            type="region"
                            className="form-control"
                            name="region"
                            required
                            onChange={e => this.props.addRepoChangeHandler(e)}             
                            >
                            {this.props.regions && this.loadRegionInfo()}
                            </select>
                        </div>
                        {awsDevops.loadingAddRepo && <PageLoader/>}
                        <div className="text-center btn-form-submit-parent">
                            <button disabled={submitDisabled} className="btn btn-sm btn-primary" type="submit">Submit</button>
                        </div>
                    </form>
                </div>
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
      
    export default connect(mapStateToProps)(AwsAddRepoModal);
