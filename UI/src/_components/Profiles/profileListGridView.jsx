import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable, MDBBtn } from 'mdbreact';
import { Link } from "react-router-dom";
import PageLoader from '../PageLoader';

Modal.setAppElement("#app");
class ProfileListDatatablePage extends React.Component {
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

    showProfileList(){

        let values = [];

        this.props.profileList.data.map((val, index) =>{
            let deletebutton;

            if(this.props.loadingDeleteProfile && this.props.delete_profile == val.profile_id){
                deletebutton = <MDBBtn disabled tag="a" onClick={(e) => this.props.handleDelete(val.profile_id)} color="blue" >Delete 
                                    <div style={{marginLeft: 5}} className="spinner-border spinner-border-sm" role="status">
                                    </div>
                            </MDBBtn>
            }
            else{
                deletebutton = <MDBBtn tag="a" onClick={(e) => this.props.handleDelete(val.profile_id)} color="blue" >Delete </MDBBtn>
            }

            values[index] = {
                index: index + 1,
                name: val.profile_name,
                edit: <MDBBtn tag="a" onClick={(e) => this.props.handleUpdateProfileModalOpen(val.profile_id, val.profile_name, JSON.parse(val.profile_menu_list), JSON.parse(val.vm_operations))} color="blue" >Edit </MDBBtn>,
                delete: deletebutton
            }
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
                    label: 'Edit',
                    field: 'edit',
                    // sort: 'asc',
                    width: 150
                },
                {
                    label: 'Delete',
                    field: 'delete',
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
                {<MDBDataTable
                striped
                hover
                data={this.props.profileList && this.showProfileList()}
                />}
            </div>
        );
        }
    }
    function mapStateToProps(state) {
        const { profiles, menus } = state;
        return {
          profiles,
          menus
        };
      }
      
    export default connect(mapStateToProps)(ProfileListDatatablePage);
