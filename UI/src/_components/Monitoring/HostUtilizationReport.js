import React from 'react';
import config from 'config';
import PageLoader from '../PageLoader';

let monitoringUtilizationReport = [];
export default class HostUtilizationReport extends React.Component {
  constructor(props) {
    super(props);
    console.log("props");
    console.log(props);
    
  }
  
  render() {
    monitoringUtilizationReport = this.props.monitoringUtilizationReport;
    return (
        <div>
            <div className="table-responsive">
              <table className="table table-bordered table-striped table-dark table-custom table-hover" id="monitoringUtilizationReport">
                 <thead> 
                    <tr>
                      <th>S.No</th>
                      <th>From Date</th>
                      <th>To Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                <tbody> 
                  {
                    (monitoringUtilizationReport && monitoringUtilizationReport.length > 0)?
                      monitoringUtilizationReport.map((mon, index) =>
                      <tr key={index}>
                        <td>{index+1}</td>
                        <td>{mon.from_date} </td>
                        <td>{mon.to_date} </td>
                        <td>{mon.status == "1"?<a href={mon.download_path} target="_blank">Download</a>:'In-progress'} </td>                    
                      </tr>                             
                    )
                  :
                  (
                    <tr>
                      <td colSpan='4' className='text-center'>No matching records found</td>
                    </tr>
                  )
                }
                </tbody>
            </table>
            </div>
        </div>
    );
  }
}
