import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable } from 'mdbreact';
import PageLoader from '../PageLoader';
import { profileCommon } from "../../_helpers";

Modal.setAppElement("#app");
class ProfileUpdateModal extends React.Component {
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


    loadMenuInfo(){

        let current_list = this.props.current_menu_list;
        let list = this.props.menuList.data;

        list = list.map(element => {
            if(current_list.includes(element['id'])) return {...element, present: true}
            return {...element, present: false}
        });

        let roots = profileCommon.flatToMultiLevel(list);
        return this.showMenu(roots);
    }

    showMenu(menu){

        const menuOptions = menu.map(option => {

            let subMenu;

            if (option.child && option.child.length > 0){
                subMenu = this.showMenu(option.child)
            }

            return (
              <li  key={ option.id }>
                  <input defaultChecked={option.present} value= {parseInt(option.id)} style={{marginRight: 10}} type="checkbox" key={ option.id }
                    onChange={e => this.props.updateProfileMenuChangeHandler(e)}
                    />
                 { option.menu_name }
                 { subMenu }
              </li>)
        });


        return (
            <ul style={{ listStyleType: 'none'}}>
              { menuOptions }
            </ul>
        )

    }

    showVMOperationList(){

        let vmOperations = this.props.vmOperationList.data;
        let current_list = this.props.current_vm_operation_list;

        vmOperations = vmOperations.map(element => {
            if(current_list.includes(element['id'])) return {...element, present: true}
            return {...element, present: false}
        });

        const vmOperationList = vmOperations.map(element => {
            return (
                <li  key={ `vmoperation${element['id']}` }>
                    <input defaultChecked={element.present} value= {element.id} style={{marginRight: 10}} type="checkbox" key={ `vmoperation${element['id']}` }
                      onChange={e => this.props.updateProfileVMOperationChangeHandler(e)}
                      />
                   { element.vm_action_name }
                </li>)
        });

        return (
            <ul style={{ listStyleType: 'none'}}>
              { vmOperationList }
            </ul>
        )
    }


    render() {
        const { profiles } = this.props;
        const regex = /(<([^>]+)>)/ig;
        let submitDisabled = profiles.loadingUpdateProfile;

        return (
            <Modal isOpen={this.props.profiles.showUpdateProfileModal}  contentLabel="Update Profile">               
                  <h2 style={{color:'red'}}>
                      Update Profile <a style={{cursor:'pointer'}} className="float-right" onClick={e => this.props.handleUpdateProfileModalClose(e)}><i className="fa fa-times" /></a>
                  </h2>

                  <div className="col-md-12">
                        <div className="panel panel-default" />
                        <form
                        name="updateProfile"
                        id="updateProfile"
                        onSubmit={this.props.updateProfileSubmitHandler}
                        >
                        <div className="form-group">
                            <label htmlFor="name">Name<span className="star-mark">*</span></label>
                            <input
                            type="name"
                            className="form-control"
                            name="current_name"
                            required                      
                            placeholder="Enter Name : Admin"
                            defaultValue = {this.props.current_name}
                            onChange={e => this.props.updateProfileChangeHandler(e)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="menu_list">Menu List<span className="star-mark">*</span></label>
                            {this.props.menuList && this.props.current_menu_list && this.loadMenuInfo()}
                        </div>
                        <div className="form-group">
                            <label htmlFor="vm_operation_list">VM Operation List<span className="star-mark"></span></label>
                            {this.props.vmOperationList && this.showVMOperationList()}
                        </div>
                        {profiles.loadingUpdateProfile && <PageLoader/>}
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
        const { profiles, menus } = state;
        return {
            profiles,
            menus
        };
      }
      
    export default connect(mapStateToProps)(ProfileUpdateModal);
