import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { MDBDataTable } from 'mdbreact';
import PageLoader from '../PageLoader';
import { profileCommon } from "../../_helpers";

Modal.setAppElement("#app");
class ProfileAddModal extends React.Component {
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
        let roots = profileCommon.flatToMultiLevel(this.props.menuList.data)
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
                  <input value= {option.id} style={{marginRight: 10}} type="checkbox" key={ option.id }
                    onChange={e => this.props.addProfileMenuChangeHandler(e)}
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
        const vmOperationList = vmOperations.map(element => {
            return (
                <li  key={ `vmoperation${element['id']}` }>
                    <input value= {element.id} style={{marginRight: 10}} type="checkbox" key={ `vmoperation${element['id']}` }
                      onChange={e => this.props.addProfileVMOperationChangeHandler(e)}
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
        let submitDisabled = profiles.loadingAddProfile;

        return (
            <Modal isOpen={this.props.profiles.showAddProfileModal}  contentLabel="Add Profile">               
                  <h2 style={{color:'red'}}>
                      Create Profile <a style={{cursor:'pointer'}} className="float-right" onClick={e => this.props.handleAddProfileModalClose(e)}><i className="fa fa-times" /></a>
                  </h2>

                  <div className="col-md-12">
                        <div className="panel panel-default" />
                        <form
                        name="addProfile"
                        id="addProfile"
                        onSubmit={this.props.addProfileSubmitHandler}
                        >
                        <div className="form-group">
                            <label htmlFor="name">Name<span className="star-mark">*</span></label>
                            <input
                            type="name"
                            className="form-control"
                            name="name"
                            required                      
                            placeholder="Enter Name : Admin"
                            onChange={e => this.props.addProfileChangeHandler(e)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="menu_list">Menu List<span className="star-mark">*</span></label>
                            {this.props.menuList && this.loadMenuInfo()}
                        </div>
                        <div className="form-group">
                            <label htmlFor="vm_operation_list">VM Operation List<span className="star-mark"></span></label>
                            {this.props.vmOperationList && this.showVMOperationList()}
                        </div>
                        {profiles.loadingAddProfile && <PageLoader/>}
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
      
    export default connect(mapStateToProps)(ProfileAddModal);
