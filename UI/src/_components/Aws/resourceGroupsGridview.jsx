import React from 'react';
import { connect } from 'react-redux';
import config from 'config';
import Modal from "react-modal";
import { awsActions } from './aws.actions';
import { MDBDataTable } from 'mdbreact';
import nl2br from "react-newline-to-break";
import utf8 from 'utf8';
import Moment from 'react-moment';
var serialize = require("form-serialize");
import ReactHtmlParser from 'react-html-parser';
import { toast } from 'react-toastify';


Modal.setAppElement("#app");
class DatatablePage extends React.Component {
    constructor(props) {
        super(props);

        this.openModal = this.openModal.bind(this);
        this.afterOpenModal = this.afterOpenModal.bind(this);
        this.handleAwsSubscriptions = this.handleAwsSubscriptions.bind(this);
        this.closeModal = this.closeModal.bind(this);

        this.values=[];
        this.props.aws.resourceGroups.map((val, index) =>{
            this.values[index]={
                SL:(index+1),
                //name : <a href={"#/aws/"+val.id}>{val.name}</a>,
                name:val.name,
                subscription_id:val.subscription_id,
                location_display_name:val.location_display_name
            }
        })
        let user = JSON.parse(localStorage.getItem("user"));
        
        this.state = {
            user:user.data,
            clientid: user.data.clientid,
            user_id: user.data.id,
            subscription_list : [],
            subscription_locations : [],
            modalIsOpen:false,
            data: {
                columns: [
                {
                    label: 'SL',
                    field: 'SL',
                    width: 50
                },
                {
                    label: 'Resource Group',
                    field: 'name',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Subscription ID',
                    field: 'subscription_id',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Location',
                    field: 'location_display_name',
                    // sort: 'asc',
                    width: 150
                }
            ],
            rows: this.values
            }
        };
    }

    openModal() { 
        this.props.dispatch(awsActions.getAwsSubscriptions({clientid:this.state.clientid}));    
        this.setState({ modalIsOpen: true });
    }
    
    afterOpenModal() {       
    //this.subtitle.style.color = "#f00";
    }

    closeModal() {
        this.setState({ modalIsOpen: false });        
    }

    handleAwsSubscriptions = (subscription) => {
        if(subscription != ''){
            this.props.dispatch(awsActions.getAwsSubscriptionLocations({clientid:this.state.clientid,subscription:subscription}));
        }
    }

    addResourceGroupRequest = e => {
        e.preventDefault();      
        var form = document.querySelector("#addResourceGroup");
        var formData = serialize(form, { hash: true });

        const re = /^[-\w\._\(\)]+$/;
        // if value is not blank, then test the regex
        if (formData.name != '' && !re.test(formData.name)) {
            toast.error("Invalid Resource Group Name");
        }else{
            this.props.dispatch(awsActions.addAwsResourceGroups(formData,this.state.clientid));
            this.setState({ modalIsOpen: false });
        }
    };
    
    render() {
        const { aws } = this.props; 
        let subscription_list = this.props.aws.subscription_list; 
        let subscription_locations = this.props.aws.subscription_locations; 
        
        return (
            <div className="container-fluid main-body">
                <div className="row">
                    <div className="col-md-6">
                    <h5 className="color">Aws Resource Groups</h5>
                    </div>
                    <div className="col-md-6">
                    <div className="text-right">
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={this.openModal}
                        > <i className="fa fa-plus" /> Add
                        </button>
                    </div>
                    </div>
                </div>
                <br/>
                <MDBDataTable
                striped
                hover
                data={this.state.data}
                />
                <Modal
                    isOpen={this.state.modalIsOpen}
                    onAfterOpen={this.afterOpenModal}
                    onRequestClose={this.closeModal}              
                    contentLabel="Add Resource Group"
                    >
                    <h2 style={{color:'red'}}>
                        Add Resource Group <a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
                    </h2>

                    <div className="col-md-12">
                        <div className="panel panel-default" />
                        <form
                        name="addResourceGroup"
                        id="addResourceGroup"
                        method="post"
                        onSubmit={this.addResourceGroupRequest}
                        >
                        <div className="form-group">
                            <label htmlFor="subscription">Subscription Id</label>
                            <select
                            className="form-control"
                            required
                            name="subscription"        
                            onChange={e => this.handleAwsSubscriptions(e.target.value)}      
                            >
                                <option value="">-Select-</option>
                                {subscription_list && subscription_list.map((sub, index) =>
                                    <option value={sub.clientid+"_"+sub.subscription_id} key={sub.subscription_id}>
                                        {sub.subscription_id}
                                    </option>
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="location">Location</label>
                            <select
                            className="form-control"
                            required
                            name="location"                     
                            >
                                <option value="">-Select-</option>
                                {subscription_locations && subscription_locations.map((l, index) =>
                                    <option value={l.id+"_"+l.name} key={l.id}>
                                        {l.display_name}
                                    </option>
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="name">Resource Group  Name</label>
                            <input
                            type="text"
                            className="form-control"
                            name="name"
                            required                      
                            placeholder="Resource Group Name"
                            />
                        </div>
                        
                        <div className="form-group">
                            <input type="hidden" name="userid" value={this.state.user_id} />
                            <button className="btn btn-sm btn-primary">Submit</button>
                        </div>
                        </form>
                    </div>
                </Modal>
            </div>
        );
        }
    }
    function mapStateToProps(state) {
        const { aws } = state;
        return {
            aws:aws
        };
      }
      
    export default connect(mapStateToProps)(DatatablePage);
