import React from 'react';
import { connect } from 'react-redux';
import { monitoringActions } from './monitoring.actions';
import Modal from "react-modal";
import Moment from 'react-moment';
var serialize = require("form-serialize");
import PageLoader from '../PageLoader';

const customStyles = {
  content: {
    
  }
};
Modal.setAppElement("#app");

class MonitoringMetrics extends React.Component {
  constructor(props) {
    super(props); 
    let user = JSON.parse(localStorage.getItem("user"));    
    this.state = {
        clientid:   user.data.clientid,
        user_role:  user.data.user_role,
        modalIsOpen: false,
        modalIsOpenEditGroup: false,
        groupDetails:[]      
    }; 
    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);

    this.openModalEditGroup = this.openModalEditGroup.bind(this);
    this.afterOpenModalEditGroup = this.afterOpenModalEditGroup.bind(this);
    this.closeModalEditGroup = this.closeModalEditGroup.bind(this);
  }
  
  componentDidMount() {
      this.props.dispatch(monitoringActions.getAllMetrics());      
  }
  openModal() { 
    this.props.dispatch(monitoringActions.getAllMetrics());    
    this.setState({ modalIsOpen: true });
  }

  afterOpenModal() {       
    this.subtitle.style.color = "#f00";
  }

  closeModal() {    
    this.setState({ modalIsOpen: false });        
  }
  openModalEditGroup(group) { 
    this.props.dispatch(monitoringActions.getAllMetrics());
    this.setState({groupDetails: group});
    this.setState({ modalIsOpenEditGroup: true });
  }

  afterOpenModalEditGroup() {       
    this.subtitle.style.color = "#f00";
  }

  closeModalEditGroup() {
    this.setState({ modalIsOpenEditGroup: false });
  } 
  addGroupRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#addGroup");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(monitoringActions.addGroupRequest(formData));
    this.setState({ modalIsOpen: false });
    this.props.dispatch(monitoringActions.getAllMetrics());  
  };
  editGroupRequest = e => {
    e.preventDefault();      
    var form = document.querySelector("#editGroup");
    var formData = serialize(form, { hash: true });
    this.props.dispatch(monitoringActions.editGroupRequest(formData));
    this.setState({ modalIsOpenEditGroup: false });
    this.props.dispatch(monitoringActions.getAllMetrics()); 
  };
    render() {
        const { monitoringmetrics } = this.props;                               
        return (
          <div className="container-fluid main-body">
          <div className="contentarea">
            <h2>Monitoring Key Metrics</h2>
            {this.state.user_role == 1 &&
            <div className="text-right">
              <button
                className="btn btn-success"
                onClick={this.openModal}
              > <i className="fa fa-plus" /> Add Group Key
              </button>
            </div>
            }
                   
                {!monitoringmetrics.error && monitoringmetrics.loading && <PageLoader/>}
                {monitoringmetrics.error && <span className="text-danger">ERROR - {monitoringmetrics.error}</span>}               
                {monitoringmetrics.items && !monitoringmetrics.loading && (  
                        <div className="table-responsive">
                        <table className="table table-bordered table-hover" id="monitoringmetrics">
                             <thead> 
                             <tr>
                             <th>S.No</th>
                             <th>Group Name</th>
                             <th>Status</th>
                             <th>Created Date</th>                         
                             <th>Action</th>                         
                           </tr>
                         </thead>
                         <tbody> 
                        {monitoringmetrics.items.map((mon, index) =>
                            <tr key={index}>
                            <td>{index+1}</td>
                            <td>{mon.group_name} </td>
                            <td>{mon.status?'Active':'InActive'} </td>                    
                            <td><Moment format="YYYY-MM-DD HH:mm:ss">{new Date(new Date(mon.created_date))}</Moment></td>
                            <td><div>
                                    <a href="javascript:void(0);" onClick={() => this.openModalEditGroup(mon)}><i className="fa fa-edit"></i> </a>                                                                      
                                </div></td>                   
                          </tr>                             
                        )}

                    </tbody>
                    </table>
                    </div>
                )
                }
        </div>  
                       
          <Modal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          style={customStyles}
          contentLabel="Add Group"
        >
          <h2 ref={subtitle => (this.subtitle = subtitle)}>
            Add Group <a href="javascript:void(0);" className="float-right" onClick={this.closeModal}><i className="fa fa-times" /></a>
          </h2>

          <div className="col-md-12">
            <div className="panel panel-default" />
            <form
              name="addGroup"
              id="addGroup"
              method="post"
              onSubmit={this.addGroupRequest}
            >
              <div className="form-group">
                <label htmlFor="group_name">Group Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="group_name"
                  required                      
                  placeholder="Enter Group Name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="CPU">CPU Key</label>
                <input
                  type="text"
                  className="form-control"
                  name="group[CPU]"
                  required                      
                  placeholder="Enter CPU Key"
                />
              </div>
              <div className="form-group">
                <label htmlFor="Disk">Disk Key</label>
                <input
                  type="text"
                  className="form-control"
                  name="group[Disk]"
                  required                      
                  placeholder="Enter Disk Key"
                />
              </div>
              <div className="form-group">
                <label htmlFor="Memory">Memory Key</label>
                <input
                  type="text"
                  className="form-control"
                  name="group[Memory]"
                  required                      
                  placeholder="Enter Memory Key"
                />
              </div>
              <div className="form-group">
                    <label htmlFor="status">Status</label>                    
                    <select
                      className="form-control"
                      required
                      name="status" 
                      defaultValue='1'                    
                    >                   
                    <option value="0">In Active</option>
                    <option value="1">Active</option>                      
                    </select>                  
              </div> 
                                            
              <div className="form-group">
                <input type="hidden" name="clientid" value={this.state.clientid} />
                <button className="btn btn-success">Submit</button>
              </div>
            </form>
          </div>
        </Modal>
        <Modal
              isOpen={this.state.modalIsOpenEditGroup}
              onAfterOpen={this.afterOpenModalEditGroup}
              onRequestClose={this.closeModalEditGroup}
              style={customStyles}
              contentLabel="Edit Group Modal"
            >
              <h2 ref={subtitle => (this.subtitle = subtitle)}>
                Edit Group <a href="javascript:void(0);" className="float-right" onClick={this.closeModalEditGroup}><i className="fa fa-times" /></a>
              </h2>

              <div className="col-md-12">
                <div className="panel panel-default" />
                <form
                  name="editGroup"
                  id="editGroup"
                  method="post"
                  onSubmit={this.editGroupRequest}
                >
                <div className="form-group">
                <label htmlFor="group_name">Group Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="group_name"
                  readOnly
                  defaultValue={this.state.groupDetails.group_name}                     
                  placeholder="Enter Group Name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="CPU">CPU Key</label>
                <input
                  type="text"
                  className="form-control"
                  name="group[CPU]"
                  required  
                  defaultValue={this.state.groupDetails.CPU}                     
                  placeholder="Enter CPU Key"
                />
              </div>
              <div className="form-group">
                <label htmlFor="Disk">Disk Key</label>
                <input
                  type="text"
                  className="form-control"
                  name="group[Disk]"
                  required    
                  defaultValue={this.state.groupDetails.Disk}                   
                  placeholder="Enter Disk Key"
                />
              </div>
              <div className="form-group">
                <label htmlFor="Memory">Memory Key</label>
                <input
                  type="text"
                  className="form-control"
                  name="group[Memory]"
                  required   
                  defaultValue={this.state.groupDetails.Memory}                    
                  placeholder="Enter Memory Key"
                />
              </div>
              <div className="form-group">
                    <label htmlFor="status">Status</label>                    
                    <select
                      className="form-control"
                      required
                      name="status" 
                      defaultValue={this.state.groupDetails.status}                    
                    >                   
                    <option value="0">In Active</option>
                    <option value="1">Active</option>                      
                    </select>                  
              </div>                   
                  <div className="form-group">
                    <input type="hidden" name="id" value={this.state.groupDetails.id} />
                    <input type="hidden" name="clientid" value={this.state.clientid} />
                    <button className="btn btn-success">Update</button>
                  </div>
                </form>
              </div>
            </Modal>
        </div> 
        );
    }
}

function mapStateToProps(state) {   
    const { monitoringmetrics } = state;      
    return {
      monitoringmetrics
    };
}

const connectedMonitoring = connect(mapStateToProps)(MonitoringMetrics);
export { connectedMonitoring as MonitoringMetrics };