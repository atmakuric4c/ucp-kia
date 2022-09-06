import React from 'react';
import { connect } from 'react-redux';
import { vmlistActions } from './vmlist.actions';
import { commonActions } from "../../_actions/common.actions";
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import Moment from 'react-moment';
import { MultiSelectComponent, CheckBoxSelection, Inject } from '@syncfusion/ej2-react-dropdowns';

Modal.setAppElement("#app");
class Vmgroup extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_role: user.data.user_role,
      vmgroup: [],
      groupDetail: [],
      vmlist:[],
      selectedItems:[],
      sweetalert: null,
      modalIsOpen: false,
      modalIsOpenEditGroup:false,
      modalIsOpenMapping:false,
      action: null,
      loading:true
    };
    //this.vmlist = [];
    //this.selectedItems = [];
    //maps the appropriate column to fields property
    this.checkFields = { text: 'name', value: 'id' };
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.openModalEditGroup = this.openModalEditGroup.bind(this);
    this.closeModalEditGroup = this.closeModalEditGroup.bind(this);
    this.openModalMapping = this.openModalMapping.bind(this);
    this.closeModalMapping = this.closeModalMapping.bind(this);
  }
// function to handle the CheckBox change event
onChange(args) {
  // enable or disable the SelectAll in multiselect on CheckBox checked state
  this.mulObj.showSelectAll = args.checked;
}
// function to handle the CheckBox change event
onChangeDrop(args) {
  // enable or disable the Dropdown button in multiselect on CheckBox checked state
  this.mulObj.showDropDownIcon = args.checked;
}
// function to handle the CheckBox change event
onChangeLimit(args) {
  // enable or disable the selection limit in multiselect on CheckBox checked state
  this.mulObj.enableSelectionOrder = args.checked;
}
  openModal() {      
    this.setState({ modalIsOpen: true });
  }
  closeModal() {
    this.setState({ modalIsOpen: false });
    this.props.dispatch(vmlistActions.getVmGroupAll());         
  }
  openModalEditGroup(groupDetail) {      
    this.setState({ modalIsOpenEditGroup: true });
    this.setState({groupDetail: groupDetail});
  }
  closeModalEditGroup() {
    this.setState({ modalIsOpenEditGroup: false });
    this.props.dispatch(vmlistActions.getVmGroupAll());         
  }
  openModalMapping(groupDetail) {      
    this.setState({ modalIsOpenMapping: true });
    this.setState({groupDetail: groupDetail});
    this.props.dispatch(commonActions.getVmListArr(groupDetail));
  }
  closeModalMapping() {
    this.setState({ modalIsOpenMapping: false });        
  }
  addVmGroupRequest = e => {
    e.preventDefault();  
    var form = document.querySelector("#addVmGroupFrm");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(vmlistActions.addVmGroup(formData));
    this.setState({ sweetalert: null });
    this.closeModal();
  }
  editVmGroupRequest = e => {
    e.preventDefault();  
    var form = document.querySelector("#editVmGroupFrm");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(vmlistActions.editVmGroup(formData));
    this.setState({ sweetalert: null });
    this.closeModalEditGroup();
  }
  editVmGroupMappingRequest = e => {
    e.preventDefault();  
    var form = document.querySelector("#editVmGroupMappingFrm");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(vmlistActions.editVmGroupMapping(formData));
    this.setState({ sweetalert: null });
    this.closeModalMapping();
  }
  componentDidMount() {
    this.props.dispatch(vmlistActions.getVmGroupAll());
    this.props.dispatch(commonActions.getAllVdcLocations());
  }

  render() { 
    const { vmgroup,vdc_locations,vmlist,selectedItems} = this.props;                            
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h2>Manage VM's Group</h2>
          <div className="text-right">
            <button
              className="btn btn-success"
              onClick={this.openModal}
            >
              <i className="fa fa-plus" /> Create VM Group
              </button>
          </div>
          {vmgroup.loading && <em>Loading VM Group List...</em>}
          {vmgroup.error && <span className="text-danger">ERROR: {vmgroup.error}</span>}
          {vmgroup.items &&
            <div className="tableresp table-responsive">
              <table className="table table-bordered table-hover" id="vmgroup">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>VDC Name</th>
                    <th>VM Group Name</th>
                    <th>IS Primary Group</th>
                    <th>Status</th>
                    <th>Creation Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vmgroup.items.map((vmData, index) =>
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{vmData.vdc_name}</td>
                      <td>{vmData.group_name} </td>
                      <td>{vmData.is_primary==1?'Yes':'No'} </td>
                      <td>{vmData.status==1?'Active':'InActive'}</td>
                      <td><Moment format="YYYY-MM-DD hh:mm A">{vmData.creation_date}</Moment></td>
                      <td><a href="javascript:void(0);" onClick={() => this.openModalEditGroup(vmData)}><i className="fa fa-edit"></i> </a>                                                                      
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <a href="javascript:void(0);" onClick={() => this.openModalMapping(vmData)}><i className="fa fa-object-group"></i> </a>
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
          isOpen={this.state.modalIsOpen}
          onRequestClose={this.closeModal}
          contentLabel="VM Group"
        >
          <h2 style={{color:'red'}}>
            Create VM Group<a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
          </h2>
          <div className="col-md-12">
            <div className="panel panel-default" />
            <form
              name="addVmGroupFrm"
              id="addVmGroupFrm"
              method="post"
              onSubmit={this.addVmGroupRequest}
            >
            <div className="form-group row">
                <label htmlFor="vdc_id" className='col-sm-3 col-form-label'>Select VDC</label>
                {vdc_locations && 
                  <div className="col-sm-9">
                    <select
                      className="form-control"
                      required
                      name="vdc_id"                     
                    >
                    {vdc_locations.map((vdc, index) =>
                    (vdc.status == "A")?
                        <option value={vdc.vdc_id} key={vdc.vdc_id}>
                        {vdc.vdc_location+" - "+vdc.vdc_name }
                      </option>
                      :
                      ""
                    )}
                      
                    </select>
                  </div>
                }
              </div>
              <div className="form-group row">
                <label htmlFor="group_name" className='col-sm-3 col-form-label'>Group Name</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control" required name="group_name" placeholder="Group Name" />
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="status" className='col-sm-3 col-form-label'>Status</label>
                <div className="col-sm-9">
                  <div className="row">
                    <div className="col">
                      <select
                          className="form-control"
                          required
                          name="status"                     
                        >
                        <option value="1">Active</option>
                        <option value="0">InActive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
                            
              <div className="form-group row">
                <label className='col-sm-3 col-form-label'>&nbsp;</label>
                <div className="col-sm-9">
                <input type="hidden" name="client_id" value={this.state.clientid} />
                  <button className="btn btn-success">Submit</button>
                </div>
              </div>
            </form>
          </div>
        </Modal>

        <Modal
          isOpen={this.state.modalIsOpenEditGroup}
          onRequestClose={this.closeModalEditGroup}
          contentLabel="VM Group"
        >
        
          <h2 style={{color:'red'}}>
            Update VM Group<a className="float-right" href="javascript:void(0);" onClick={this.closeModalEditGroup}><i className="fa fa-times" /></a>
          </h2>
          <div className="col-md-12">
            <div className="panel panel-default" />
            <form
              name="editVmGroupFrm"
              id="editVmGroupFrm"
              method="post"
              onSubmit={this.editVmGroupRequest}
            >
            <div className="form-group row">
                <label htmlFor="vdc_id" className='col-sm-3 col-form-label'>VDC Name</label>
                {vdc_locations && 
                  <div className="col-sm-9">
                    <select
                      className="form-control"
                      readOnly
                      name="vdc_id" defaultValue={this.state.vmgroup.vdc_id}                    
                    >
                    {vdc_locations.map((vdc, index) =>
                    (vdc.status == "A")?
                        <option value={vdc.vdc_id} key={vdc.vdc_id}>
                        {vdc.vdc_location+" - "+vdc.vdc_name }
                      </option>
                      :
                      ""
                    )}
                      
                    </select>
                  </div>
                }
              </div>
              <div className="form-group row">
                <label htmlFor="group_name" className='col-sm-3 col-form-label'>Group Name</label>
                <div className="col-sm-9">
                  <input type="text" className="form-control" defaultValue={this.state.groupDetail.group_name} required name="group_name" placeholder="Group Name" />
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="status" className='col-sm-3 col-form-label'>Status</label>
                <div className="col-sm-9">
                  <div className="row">
                    <div className="col">
                      <select
                          className="form-control"
                          required
                          name="status" defaultValue={this.state.groupDetail.status}                     
                        >
                        <option value="1">Active</option>
                        <option value="0">InActive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
                            
              <div className="form-group row">
                <label className='col-sm-3 col-form-label'>&nbsp;</label>
                <div className="col-sm-9">
                <input type="hidden" name="client_id" value={this.state.clientid} />
                <input type="hidden" name="id" value={this.state.groupDetail.id} />
                <input type="hidden" name="vdc_id" value={this.state.groupDetail.vdc_id} />
                  <button className="btn btn-success">Update</button>
                </div>
              </div>
            </form>
          </div>
        </Modal>
        <Modal
          isOpen={this.state.modalIsOpenMapping}
          onRequestClose={this.closeModalMapping}
          contentLabel="VM Group Mapping"
        >
          <h2 style={{color:'red'}}>
            Update VM Group Mapping<a className="float-right" href="javascript:void(0);" onClick={this.closeModalMapping}><i className="fa fa-times" /></a>
          </h2>
          <div className="col-md-12">
            <div className="panel panel-default" />
            <form
              name="editVmGroupMappingFrm"
              id="editVmGroupMappingFrm"
              method="post"
              onSubmit={this.editVmGroupMappingRequest}
            >
            
            <div id="multichecbox" className='control-pane'>
            <div className='control-section col-lg-8'>
              <div id="multigroup" className="control-styles">
                <h4>VM List</h4>
                <MultiSelectComponent value={selectedItems} id="checkbox" ref={(scope) => { this.mulObj = scope; }} 
                dataSource={vmlist} fields={this.checkFields} placeholder="Select VMs" 
                mode="CheckBox" showSelectAll={true} showDropDownIcon={true} filterBarPlaceholder="Search VMs" 
                popupHeight="350px">
                  <Inject services={[CheckBoxSelection]}/>
                </MultiSelectComponent>
              </div>
            </div>
            </div>
                                          
              <div className="form-group row">
                <label className='col-sm-8 col-form-label'>&nbsp;</label>
                <div className="col-sm-4">
                <input type="hidden" name="client_id" value={this.state.clientid} />
                <input type="hidden" name="id" value={this.state.groupDetail.id} />
                <input type="hidden" name="vdc_id" value={this.state.groupDetail.vdc_id} />
                  <button className="btn btn-success">Update</button>
                </div>
              </div>
            </form>
            <div className="tableresp table-responsive">
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Sl. No</th>
                    <th>VM Name</th>
                  </tr>
                </thead>
                <tbody>
                  {vmlist && vmlist.map((vm, index) =>
                    <tr key={index} className={selectedItems.indexOf(vm.id)=='-1'?"d-none":""}>
                      <td>{index + 1}</td>
                      <td>{vm.name} </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      </div>

    );
  }
}

function mapStateToProps(state) {
  console.log(state);
  const { vmgroup } = state;
  const vdc_locations = state.common.vcenter;    
  const vmlist = state.common.vmlist;  
  const selectedItems = state.common.selectedItems;  
  return {
    vmgroup,vdc_locations,vmlist,selectedItems
  };
}

const connectedvmgroup = connect(mapStateToProps)(Vmgroup);
export { connectedvmgroup as Vmgroup };