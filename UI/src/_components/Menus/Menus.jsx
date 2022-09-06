import React from 'react';
import { connect } from 'react-redux';
import { menusActions } from './menus.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import PageLoader from '../PageLoader';

const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");
class Menus extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      menus: [],
      sweetalert: null,
      modalIsOpen: false,
      modalIsOpenDiskinfo: false,
      modalIsOpenSaveMenu: false,
      isSaveMenuLoading: false,
      action: null,
      menuInit :{
        menu_name:"",
        url :"",
        menu_icon:"",
        parent_id:0,
        status:1,
        id:""
      },
      menuInfo :{
        menu_name:"",
        url :"",
        menu_icon:"",
        parent_id:0,
        status:1,
        id:0
      }
    };
    
    this.openModalSaveMenu = this.openModalSaveMenu.bind(this);
    this.closeModalSaveMenu = this.closeModalSaveMenu.bind(this);
    this.afterOpenModalSaveMenu = this.afterOpenModalSaveMenu.bind(this);
    this.saveMenuRequest = this.saveMenuRequest.bind(this);
    this.handleDeleteMenu = this.handleDeleteMenu.bind(this);
  }

  openModalSaveMenu(menuDetails) { 
    if(menuDetails.id==0){
      this.setState({ 'modalTitle': "Add Menu" });
    }else{
      this.setState({ 'modalTitle': "Edit Menu" });
    }
    this.setState({menuInfo:menuDetails})
    this.setState({ modalIsOpenSaveMenu: true });
    this.setState({ isSaveMenuLoading: true });
  }

  afterOpenModalSaveMenu() {       
    // this.subtitle.style.color = "#f00";
  }

  closeModalSaveMenu() {
    this.setState({ modalIsOpenSaveMenu: false });
  }

  componentDidMount() {
    this.props.dispatch(menusActions.getAll());
  }
  saveMenuRequest = e => {
    e.preventDefault();  
    var form = document.querySelector("#saveMenuFrm");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(menusActions.saveMenu(formData));
    this.setState({ sweetalert: null });
    this.closeModalSaveMenu();
    this.props.dispatch(commonActions.getUserMenus());
  }
  handleDeleteMenu(id) {
    this.props.dispatch(menusActions.deleteMenu(id));
  }

  render() { 
    const { menus } = this.props;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h2>Menus</h2>
          <div className="text-right">
            <button
              className="btn btn-success"
              onClick={() => this.openModalSaveMenu(this.state.menuInit)}
            >
              <i className="fa fa-plus" /> Create Menu
              </button>
          </div>
          {!menus.error && menus.loading && <PageLoader/>}
          {menus.error && <span className="text-danger">ERROR - {menus.error}</span>}
          {menus.items && !menus.loading &&
            <div className="tableresp table-responsive">
              <table className="table table-bordered table-hover" id="menus">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Menu Name</th>
                    <th>URL</th>
                    <th>Menu Icon</th>
                    <th>Parent Menu</th>
                    <th>Sort Order</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menus.items.map((menuData, index) =>
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{menuData.menu_name} </td>
                      <td>{menuData.url} </td>
                      <td>{menuData.menu_icon} </td>
                      <td>{(menuData.parent_name)} </td>
                      <td>{menuData.sort_order}</td>
                      <td>{menuData.status=='1'?'Active':"In-active"} </td>
                      <td>
                        <div>
                          <a href="javascript:void(0);" onClick={() => this.openModalSaveMenu(menuData)}><i className="fa fa-edit"></i> </a>
                          &nbsp;
                          <a href="javascript:void(0);" onClick={() => this.handleDeleteMenu(menuData.id)}><i className="fa fa-trash"></i> </a>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {this.state.sweetalert}
            </div>
          }
        </div>

        <Modal
          isOpen={this.state.modalIsOpenSaveMenu}
          onAfterOpen={this.afterOpenModalSaveMenu}
          onRequestClose={this.closeModalSaveMenu}
          style={customStyles}
          contentLabel={this.state.modalTitle}
          className=""
        >
          <h2 style={{color:'red'}}>
          {this.state.modalTitle} <a className="float-right" href="javascript:void(0);" onClick={this.closeModalSaveMenu}><i className="fa fa-times" /></a>
          </h2>
          <div className="col-md-12">
            <div className="panel panel-default" />
            <form
              name="saveMenuFrm"
              id="saveMenuFrm"
              method="post"
              onSubmit={this.saveMenuRequest}
            >
              <div className="form-group row">
                <label htmlFor="menu_name" className='col-sm-3 col-form-label'>Menu Name</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control" defaultValue={this.state.menuInfo.menu_name} required name="menu_name" placeholder="Menu Name" />
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="url" className='col-sm-3 col-form-label'>URL</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control" defaultValue={this.state.menuInfo.url} required name="url" placeholder="URL" />
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="menu_icon" className='col-sm-3 col-form-label'>Menu Icon</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control" defaultValue={this.state.menuInfo.menu_icon} name="menu_icon" placeholder="Menu Icon" />
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="sort_order" className='col-sm-3 col-form-label'>Menu Order</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control" defaultValue={this.state.menuInfo.sort_order} name="sort_order" placeholder="Menu Order" />
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="parent_id" className='col-sm-3 col-form-label'>Parent Menu</label>
                {menus.items && 
                  <div className="col-sm-9">
                    <select
                      className="form-control"
                      required
                      name="parent_id"       
                      defaultValue={this.state.menuInfo.parent_id}              
                    >
                      <option value="0">No Parent</option>
                    {menus.items.map((menuItem, index) =>
                    (menuItem.status == "1" && menuItem.parent_id == 0)?
                        <option value={menuItem.id} key={menuItem.id}>
                        {menuItem.menu_name }
                      </option>
                      :
                      ""
                    )}
                      
                    </select>
                  </div>
                }
              </div>
              <div className="form-group row">
                <label htmlFor="status" className='col-sm-3 col-form-label'>Status</label>   
                <div className="col-sm-9">
                  <select
                    className="form-control"
                    required
                    name="status" 
                    defaultValue={this.state.menuInfo.status}                    
                  >                   
                  <option value="0">In Active</option>
                  <option value="1">Active</option>                      
                  </select>         
                </div>         
              </div>
              <div className="form-group row">
                <label className='col-sm-3 col-form-label'>&nbsp;</label>
                <div className="col-sm-9">
                <input type="hidden" name="user_id" value={this.state.user_id} />
                <input type="hidden" name="menu_id" value={this.state.menuInfo.id} />
                  <button className="btn btn-success">Submit</button>
                </div>
              </div>
            </form>
          </div>
        </Modal>

      </div>

    );
  }
}

function mapStateToProps(state) {
  console.log(state);
  const { menus } = state;
  return {
    menus
  };
}

const connectedMenus = connect(mapStateToProps)(Menus);
export { connectedMenus as Menus };