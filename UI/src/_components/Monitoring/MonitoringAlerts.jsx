import React from 'react';
import { connect } from 'react-redux';
import { monitoringActions } from './monitoring.actions';
import Modal from "react-modal";
var serialize = require("form-serialize");
import PageLoader from '../PageLoader';

const customStyles = {
  content: {
    
  }
};
Modal.setAppElement("#app");

class MonitoringAlerts extends React.Component {
  constructor(props) {
    super(props); 
    let user = JSON.parse(localStorage.getItem("user"));    
    this.state = {
        clientid:   user.data.clientid,
        user_role:  user.data.user_role
    }; 
  }
  
  componentDidMount() {
      this.props.dispatch(monitoringActions.getAllAlerts());      
  }
  
    render() {
        const { monitoringalerts } = this.props;                               
        return (
          <div className="container-fluid main-body">
          <div className="contentarea">
            <h2>Monitoring Alerts</h2>                 
                {!monitoringalerts.error && monitoringalerts.loading && <PageLoader/>}
                {monitoringalerts.error && <span className="text-danger">ERROR - {monitoringalerts.error}</span>}               
                {monitoringalerts.items && !monitoringalerts.loading && (  
                        <div className="table-responsive">
                        <table className="table table-bordered table-hover" id="monitoringalerts">
                             <thead> 
                             <tr>
                             <th>S.No</th>
                             <th>Host Id</th>
                             <th>Trigger Id</th>
                             <th>Description</th>                         
                           </tr>
                         </thead>
                         <tbody> 
                        {monitoringalerts.items.map((mon, index) =>
                            <tr key={index}>
                            <td>{index+1}</td>
                            <td>{mon.hostid}</td>
                            <td>{mon.triggerid}</td>                    
                            <td>{mon.description}</td>
                          </tr>                             
                        )}

                    </tbody>
                    </table>
                    </div>
                )
                }
        </div>  
        </div> 
        );
    }
}

function mapStateToProps(state) {   
    const { monitoringalerts } = state;      
    return {
      monitoringalerts
    };
}

const connectedMonitoringAlerts = connect(mapStateToProps)(MonitoringAlerts);
export { connectedMonitoringAlerts as MonitoringAlerts };