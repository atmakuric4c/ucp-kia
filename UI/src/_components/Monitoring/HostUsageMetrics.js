import React from "react";
import Chart from 'react-apexcharts'
import PageLoader from '../PageLoader';

let monitoringUsageMetrics = [];
export default class HostUsageMetrics extends React.Component {
  constructor(props) {
    super(props);
    console.log(props);
  }
  render() {
    monitoringUsageMetrics = this.props.monitoringUsageMetrics;
    return (
      (monitoringUsageMetrics.isUsageMetricsLoading)?(<PageLoader/>)
      :
      (
        <div>
          
          <div className="row">
            <div className="col-md-4 col-sm-12 text-center">
              <Chart options={{labels: ['Used', 'Free'],
        responsive: [{
          breakpoint: 380,
          options: {
            chart: {
              width: 150
            },
            legend: {
              position: 'top',
              horizontalAlign: 'center',
            }
          }
        }],
        colors: [monitoringUsageMetrics.monitoringUsageMetrics.response.CPUcolor, '#BFBFBF']
      }} series={[parseFloat(monitoringUsageMetrics.monitoringUsageMetrics.response.CPUperformance), (100-parseFloat(monitoringUsageMetrics.monitoringUsageMetrics.response.CPUperformance))]} type="pie" width="380" />
              <div className="text-center" style={{paddingRight: "70px"}}>
                CPU Utilization
              </div>
            </div>
            <div className="col-md-4 col-sm-12 text-center">
              <Chart options={{labels: ['Used', 'Free'],
        responsive: [{
          breakpoint: 380,
          options: {
            chart: {
              width: 150
            },
            legend: {
              position: 'top',
              horizontalAlign: 'center',
            }
          }
        }],
        colors: [monitoringUsageMetrics.monitoringUsageMetrics.response.RAMcolor, '#BFBFBF']
      }} series={[parseFloat(monitoringUsageMetrics.monitoringUsageMetrics.response.RAMperformance), (100-parseFloat(monitoringUsageMetrics.monitoringUsageMetrics.response.RAMperformance))]} type="pie" width="380" />
              <div className="text-center" style={{paddingRight: "70px"}}>
                Memory Utilization
              </div>
            </div>
            <div className="col-md-4 col-sm-12 text-center">
              <Chart options={{labels: ['Used', 'Free'],
        responsive: [{
          breakpoint: 380,
          options: {
            chart: {
              width: 150
            },           
            legend: {
              position: 'top',
              horizontalAlign: 'center',
            }
          }
        }],
        colors: [monitoringUsageMetrics.monitoringUsageMetrics.response.HDDcolor, '#BFBFBF']
      }} series={[parseFloat(monitoringUsageMetrics.monitoringUsageMetrics.response.HDDperformance), (100-parseFloat(monitoringUsageMetrics.monitoringUsageMetrics.response.HDDperformance))]} type="pie" width="380" />
              <div className="text-center" style={{paddingRight: "70px"}}>
                Storage Utilization
              </div>
            </div>
          </div>
          <div className="clearfix"></div>
          <div className="row mt-5">
            <div className="col-md-4 col-sm-12 text-primary">
              <span className="alert info-box-white" style={{fontWeight: "bold"}}>
                TOTAL SERVICES: {monitoringUsageMetrics.monitoringUsageMetrics.response.services_count}
              </span>
            </div>
            
            <div className="col-md-8 col-sm-12 margin10_T text-right">
              <span className="alert info-box-danger mr-2">
                <i className="fa fa-fire  pr-1"></i>
                Critical: {monitoringUsageMetrics.monitoringUsageMetrics.response.critical}</span>
              <span className="alert info-box-warning mr-2">
                <i className="fa fa-exclamation-triangle  pr-1"></i>
                Warning: {monitoringUsageMetrics.monitoringUsageMetrics.response.warning}</span>
              <span className="alert info-box-success">
                <i className="fa fa-check-circle  pr-1"></i>
                Normal: {monitoringUsageMetrics.monitoringUsageMetrics.response.normal} 
              </span>
            </div>
          </div>
        </div>
      )
    );
  }
}
