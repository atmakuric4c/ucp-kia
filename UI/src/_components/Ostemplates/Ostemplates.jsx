import React from 'react';
import { connect } from 'react-redux';
import { ostemplatesActions } from '../../_actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import PageLoader from '../PageLoader';

class Ostemplates extends React.Component {
  constructor(props) {
    super(props); 
    let user = JSON.parse(localStorage.getItem("user"));    
    this.state = {
        clientid:   user.data.clientid,
        user_role:  user.data.user_role,
        ostemplates: [],
        sweetalert: null             
    };         
  }

    componentDidMount() {
        this.props.dispatch(ostemplatesActions.getAll());      
    }
    
  
    openAlert(ostemp) {
      const getAlert = () => (
        <SweetAlert          
          showCancel
          confirmBtnText="Update"
          confirmBtnBsStyle="danger"
          cancelBtnBsStyle="default"
          title=""         
          onConfirm={this.updateOSstatus.bind(this)}
          onCancel={this.hideAlert.bind(this)}
          > 
          <form
                  name="updateosStatus"
                  id="updateosStatus"                  
           >        
          <div className="form-group">          
          <select className="form-control"
                      name="ostempstatus" defaultValue={ostemp.status}>
            <option value="A">Active</option>
            <option value="I">In-Active</option>
            <option value="D">Deleted</option>
          </select>
          <input type="hidden" value={ostemp.id} name="ostempid" />
          </div>
          </form>         
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

    updateOSstatus(){          
      var form = document.querySelector("#updateosStatus");
      var formData = serialize(form, { hash: true });
      this.props.dispatch(ostemplatesActions.updateOSstatus(formData));
      this.setState({ sweetalert: null });
      this.props.dispatch(ostemplatesActions.getAll());       
    };
    render() {
        const { ostemplates } = this.props;                                  
        return (
      <div className="container-fluid main-body">
        <div className="contentarea">
            <h2>OS Templates Mgmt</h2>
                {!ostemplates.error && ostemplates.loading && <PageLoader/>}
                {ostemplates.error && <span className="text-danger">ERROR - {ostemplates.error}</span>}               
                {ostemplates.items && !ostemplates.loading &&
                        <div className="table-responsive">
                        <table className="table table-bordered table-hover" id="ostemplates">
                             <thead> 
                             <tr>
                             <th>S.No</th>
                             <th>Name</th>
                             <th>Type</th>
                             <th>Status</th>
                             <th>Action</th>                         
                           </tr>
                         </thead>
                         <tbody> 
                        {ostemplates.items.map((ostemp, index) =>
                            <tr key={index}>
                            <td>{index+1}</td>
                            <td>{ostemp.name} </td>
                            <td>{ostemp.type} </td>
                            <td>                             
                              {ostemp.status=='A' && <span>Active</span>}
                              {ostemp.status=='I' && <span>In Active</span>}
                              {ostemp.status=='D' && <span>Deleted</span>} 
                            </td>
                            <td><div>                                                                                   
                                    <a href="javascript:void(0);" onClick={()=>this.openAlert(ostemp)}><i className="fa fa-edit"></i> </a>                                                                      
                                </div></td>                           
                          </tr>                             
                        )}
                     </tbody>
                    </table>
                    {this.state.sweetalert}
                    </div>
                }
        </div>       
          
        </div>            
          
        );
    }
}

function mapStateToProps(state) {   
    const { ostemplates } = state;    
    return {
        ostemplates
    };
}

const connectedOstemplates = connect(mapStateToProps)(Ostemplates);
export { connectedOstemplates as Ostemplates };