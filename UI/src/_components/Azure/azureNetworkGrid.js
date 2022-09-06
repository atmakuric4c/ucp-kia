import React from 'react';
import { connect } from 'react-redux';
import config from 'config';
import Modal from "react-modal";
import { azureActions } from './azure.actions';
import { MDBDataTable } from 'mdbreact';
import nl2br from "react-newline-to-break";
import utf8 from 'utf8';
import Moment from 'react-moment';
var serialize = require("form-serialize");
import ReactHtmlParser from 'react-html-parser';
import { toast } from 'react-toastify';
import { authHeader,logout } from '../../_helpers';
import SweetAlert from 'react-bootstrap-sweetalert';

Modal.setAppElement("#app");
class DatatablePage extends React.Component {
    constructor(props) {
        super(props);

        this.openModal = this.openModal.bind(this);
        //this.handleAzureSubscriptions = this.handleAzureSubscriptions.bind(this);
        this.handleAzureResourceGroups = this.handleAzureResourceGroups.bind(this);
        this.closeModal = this.closeModal.bind(this);

        this.values=[];
        this.props.networks.map((val, index) =>{
            this.values[index]={
                slno:(index+1),
                name : val.name,
                location:val.name,
                resource_group:val.resource_group,
                //delete: <button className="btn btn-sm btn-danger" onClick={() => this.azureDeleteAction(val)}><i className="fas fa-minus-circle"></i> Delete Network</button>
            }
        })
        let user = JSON.parse(localStorage.getItem("user"));
        
        this.state = {
            user:user.data,
            clientid: user.data.clientid,
            user_id: user.data.id,
            subscription_list : [],
            locations : [],
            modalIsOpen:false,
            sweetalert: true,
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
                },
                /*{
                    label: 'Actions',
                    field: 'delete',
                    // sort: 'asc',
                    width: 150
                }*/
            ],
            rows: this.values
            }
        };
    }

    azureDeleteAction = (row) => {
        var dispLable = "Delete Azure Network";
    
        const getAlert = () => (
        <SweetAlert
            warning
            showCancel
            confirmBtnText={dispLable}
            confirmBtnBsStyle="danger"
            cancelBtnBsStyle="default"
            title="Are you sure?"
            onConfirm={() => this.detachDiskHandle(row)}
            onCancel={this.hideAlert.bind(this)}
        >
        </SweetAlert>
        );
        this.setState({
        sweetalert: getAlert()
        });
    }

    hideAlert() {
        this.setState({
            sweetalert: null
        });
    }
    
    detachDiskHandle(row){
        //$(".sweet-alert").find(".btn-danger").prepend("<i className='fas fa-circle-notch icon-loading'></i>");
        //$(".sweet-alert").find(".btn-danger").attr("disabled",true);

        let formdata = {};/*{ "clientid" : this.state.clientid,    
                          "subscription_id" : this.state.vm_data.vmdetails.dataFromDB.subscriptionId,    
                          "vmName" : this.state.vm_data.vmdetails.dataFromDB.label_name,
                          "diskName" : row.name
                       }*/
    
        const requestOptions = {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify(formdata)
        };
        return fetch(`${config.apiUrl}/secureApi/azure/detachDisk`, requestOptions)
        .then(res => res.json())
        .then((data) => {
          if (data.status == "success") {
            toast.success(data.message);
            //this.getDiskList( { "clientid" : this.state.clientid, "subscription_id" : this.state.vm_data.vmdetails.dataFromDB.subscriptionId, "resourceGroup" : this.state.vm_data.vmdetails.dataFromDB.resourceGroup});
            setTimeout(() => {
              location.reload(true);
            }, 2000);
          }
          else{
            toast.error(data.message);
          }
        })
        .catch(console.log)
    }

    openModal() { 
        this.props.dispatch(azureActions.getAzureSubscriptions({clientid:this.state.clientid}));    
        this.setState({ modalIsOpen: true });
    }
    closeModal() {
        this.setState({ modalIsOpen: false });        
    }

    handleAzureLocations = (resourceGroup) => {
        this.setState({ locations: [] })
        
        var resourceGroupsList=this.state.resourceGroups;
        if(resourceGroup != '' && resourceGroupsList!=''){
            for(const loc of resourceGroupsList){
                if(loc.name==resourceGroup){console.log(loc)
                    this.setState({ locations: [loc] })
                    break;
                }
            }
        }
    }
    // handleAzureResourceGroups = (location) => {
    //     var subscription=this.state.subscription;
    //     if(subscription != '' && location!=''){
    //         const requestOptions = {
    //             method: 'POST',
    //             headers: { ...authHeader(), 'Content-Type': 'application/json' },
    //             body: JSON.stringify({subscription:subscription,location:location})
    //         };
    //         return fetch(`${config.apiUrl}/secureApi/azure/get_resrouce_group_list`, requestOptions)
    //         .then(res => res.json())
    //         .then((data) => {
    //             this.setState({ resourceGroups: data })
    //         })
    //         .catch(console.log)
    //         }
    // }
    handleAzureResourceGroups = (subscription) => {
        this.setState({ resourceGroups: [], locations: [] })
        
        if(subscription != ''){
            const requestOptions = {
                method: 'POST',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({subscription:subscription})
            };
            return fetch(`${config.apiUrl}/secureApi/azure/get_resrouce_group_list`, requestOptions)
            .then(res => res.json())
            .then((data) => {
                this.setState({ resourceGroups: data })
            })
            .catch(console.log)
        }
    }

    azureVirtualNetwrokRequest = e => {
        e.preventDefault();      
        var form = document.querySelector("#azureVirtualNetwrok");
        var formData = serialize(form, { hash: true });

        const re = /^[-\w\._\(\)]+$/;
        // if value is not blank, then test the regex
        if (formData.name != '' && !re.test(formData.name)) {
            toast.error("Invalid Network Name");
        }else{
            this.props.dispatch(azureActions.addAzureNetwork(formData,this.state.clientid));
            this.setState({ modalIsOpen: false });
        }
    };
    
    render() {
        const { azure } = this.props; 
        let subscription_list = this.props.azure.subscription_list; 
        //let subscription_locations = this.props.azure.subscription_locations; 
        
        return (
            <div className="container-fluid main-body">
                <div className="row">
                    <div className="col-md-6">
                    <h5 className="color">Azure Network List</h5>
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
                        name="azureVirtualNetwrok"
                        id="azureVirtualNetwrok"
                        method="post"
                        onSubmit={this.azureVirtualNetwrokRequest}
                        >
                        <div className="form-group">
                            <label htmlFor="subscription">Subscription Id</label>
                            <select
                            className="form-control"
                            required
                            name="subscription"        
                            onChange={e => this.handleAzureResourceGroups(e.target.value)}      
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
                            <label htmlFor="resource_group">Resource Group</label>
                            <select
                            className="form-control"
                            required
                            name="resource_group" 
                            onChange={e => this.handleAzureLocations(e.target.value)}                    
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
                            <label htmlFor="location">Location</label>
                            <select
                            className="form-control"
                            required
                            name="location"                     
                            >
                                <option value="">-Select-</option>
                                {this.state.locations && this.state.locations.map((l, index) =>
                                    <option value={l.location_name} key={l.location_id}>
                                        {l.display_name}
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
        const { azure } = state;
        return {
            azure:azure
        };
      }
      
    export default connect(mapStateToProps)(DatatablePage);
