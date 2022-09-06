import React from "react";
import Chart from 'react-apexcharts'
let monitoringUsageMetrics = [];
export default class HostUsageMetrics extends React.Component {
  constructor(props) {
    super(props);
    console.log(props);
  }
  render() {
    monitoringUsageMetrics = this.props.monitoringUsageMetrics;
    return (
      (false)?(<div>Loading...</div>)
      :
      (
        <div>
          
          <div className="row">
            <div className="col-sm-4 text-center">
              <Chart options={{labels: ['Used', 'Free'],
        responsive: [{
          breakpoint: 380,
          options: {
            chart: {
              width: 150
            },
            legend: {
              position: 'bottom'
            }
          }
        }],
        colors: ['#ff0', '#BFBFBF']
      }} series={[parseFloat(12.0), (100-parseFloat(49.23))]} type="pie" width="380" />
              CPU Utilization
            </div>
            <div className="col-sm-4 text-center">
              <Chart options={{labels: ['Used', 'Free'],
        responsive: [{
          breakpoint: 380,
          options: {
            chart: {
              width: 150
            },
            legend: {
              position: 'bottom'
            }
          }
        }],
        colors: ['#f00', '#BFBFBF']
      }} series={[parseFloat(43), (100-parseFloat(69))]} type="pie" width="380" />
              Memory Utilization
            </div>
            <div className="col-sm-4 text-center">
              <Chart options={{labels: ['Used', 'Free'],
        responsive: [{
          breakpoint: 380,
          options: {
            chart: {
              width: 150
            },
            legend: {
              position: 'bottom'
            }
          }
        }],
        colors: ['#0000ff', '#BFBFBF']
      }} series={[parseFloat(54), (100-parseFloat(23))]} type="pie" width="380" />
              Storage Utilization
            </div>
          </div>
          <div className="clearfix"></div>
          <div className="row mt-5">
            <div className="col-sm-4 text-primary">
            <span className="big-number"><span id="services_count">{13}</span></span> TOTAL Services</div>
            
            <div className="col-sm-8 margin10_T">
              <span className="text-critical"><span className="midd-number txt-color-red"><span id="critical_count">{2}</span><i className="fa fa-fire"></i></span> Critical</span>
              <span className="text-warning margin10_L"><span className="midd-number"><span id="warning_count">{3}</span><i className="fa fa-exclamation-triangle"></i></span> Warning</span>
              <span className="text-success margin10_L"><span className="midd-number"><span id="normal_count">{8}</span> <i className="fa fa-check-circle"></i></span> Normal</span>
            </div>
          </div>
        </div>
      )
    );
  }
}
