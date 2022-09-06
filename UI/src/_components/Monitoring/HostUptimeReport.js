import React from 'react';
import config from 'config';
import PageLoader from '../PageLoader';

let monitoringUptimeReport = [];
export default class HostUptimeReport extends React.Component {
  constructor(props) {
    super(props);
    console.log("props");
    console.log(props);
    
  }

  render() {
    monitoringUptimeReport = this.props.monitoringUptimeReport;
    return (
        <div>
            <div className="table-responsive">
                <table className="table table-bordered table-striped table-dark table-custom table-hover" id="monitoringUptimeReport">
                    <thead> 
                      <tr>
                        <th>SL</th>
                        <th>From Date</th>
                        <th>To Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody> 
                  {
                      (monitoringUptimeReport && monitoringUptimeReport.length > 0)?
                      monitoringUptimeReport.map((mon, index) =>
                        <tr key={index}>
                          <td>{index+1}</td>
                          <td>{mon.from_date} </td>
                          <td>{mon.to_date} </td>
                          <td>{mon.status == "1"?<a href={mon.download_path} target="_blank" rel="noopener noreferrer" download>Download</a>:'In-progress'} 
                          </td>
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
      )
  }
}
