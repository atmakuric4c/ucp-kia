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
import { authHeader,logout } from '../../_helpers';


Modal.setAppElement("#app");
class DatatablePage extends React.Component {
    constructor(props) {
        super(props);

        this.openModal = this.openModal.bind(this);
        this.handleAwsSubscriptions = this.handleAwsSubscriptions.bind(this);
        this.handleAwsResourceGroups = this.handleAwsResourceGroups.bind(this);
        this.closeModal = this.closeModal.bind(this);

        this.values=[];
        this.props.networks.map((val, index) =>{
            this.values[index]={
                slno:(index+1),
                name : val.name,
                location:val.name,
                resource_group:val.resource_group
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
            resourceGroups:[],
            data: {
                columns: [
                    {
                        label: 'SL No',
                        field: 'slno',
                        // sort: 'asc',
                        width: 150
                    },
                    {
                    label: 'Network Name',
                    field: 'name',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Location Name',
                    field: 'location',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Resource Group',
                    field: 'resource_group',
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
    closeModal() {
        this.setState({ modalIsOpen: false });        
    }

    handleAwsSubscriptions = (subscription) => {
        if(subscription != ''){
            this.setState({subscription:subscription})
            this.props.dispatch(awsActions.getAwsSubscriptionLocations({clientid:this.state.clientid,subscription:subscription}));
        }
    }
    handleAwsResourceGroups = (location) => {
        var subscription=this.state.subscription;
        if(subscription != '' && location!=''){
            const requestOptions = {
                method: 'POST',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({subscription:subscription,location:location})
            };
            return fetch(`${config.apiUrl}/secureApi/aws/get_resrouce_group_list`, requestOptions)
            .then(res => res.json())
            .then((data) => {
                this.setState({ resourceGroups: data })
            })
            .catch(console.log)
            }
    }
    awsVirtualNetwrokRequest = e => {
        e.preventDefault();      
        var form = document.querySelector("#awsVirtualNetwrok");
        var formData = serialize(form, { hash: true });

        const re = /^[-\w\._\(\)]+$/;
        // if value is not blank, then test the regex
        if (formData.name != '' && !re.test(formData.name)) {
            toast.error("Invalid Network Name");
        }else{
            this.props.dispatch(awsActions.addAwsNetwork(formData,this.state.clientid));
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
                    <h5 className="color">Aws Network List</h5>
                    </div>
                    <div className="col-md-6">
                    <div className="text-right">
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={this.openModal}
                        > <i className="fa fa-plus" /> Add Network
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
                    onRequestClose={this.closeModal}              
                    contentLabel="Add Resource Group"
                    >
                    <h2 style={{color:'red'}}>
                        Add Virtual Network <a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
                    </h2>

                    <div className="col-md-12">
                        <div className="panel panel-default" />
                        <form
                        name="awsVirtualNetwrok"
                        id="awsVirtualNetwrok"
                        method="post"
                        onSubmit={this.awsVirtualNetwrokRequest}
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
                            onChange={e => this.handleAwsResourceGroups(e.target.value)}                     
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
                            <label htmlFor="resource_group">Resource Group</label>
                            <select
                            className="form-control"
                            required
                            name="resource_group"                     
                            >
                                <option value="">-Select-</option>
                                {this.state.resourceGroups && this.state.resourceGroups.map((l, index) =>
                                    <option value={l.name} key={l.id}>
                                        {l.name}
                                    </option>
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="name">Virtual Network Name</label>
                            <input
                            type="text"
                            className="form-control"
                            name="name"
                            required                      
                            placeholder="Virtual Network Name"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="ip_address_prefix">IP Address Prefix</label>
                            <input
                            type="text"
                            className="form-control"
                            name="ip_address_prefix"
                            required   
                            placeholder="e.g 10.0.0.1/16"                   
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
