import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { awsDevopsActions } from '../../_actions';
import Modal from "react-modal";
import AwsUsageForecastDatatablePage from './awsUsageForecastGridView';
import BarChart from '../Chart/barChart';
import PageLoader from '../PageLoader';

Modal.setAppElement("#app");
class AwsUsageForecast extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      awsDevops: [],
      awsCostForecast: [],
      billing: [],
      budgetAlerts: [],
      pgiData : [],
      action: null
    };
  }
  
  componentDidMount() {
    if(!this.props.awsDevops || !this.props.awsDevops.usageForecast){
      var params = {clientid:this.state.clientid,cloudName:'AWS'}
      this.props.dispatch(awsDevopsActions.getUsageForecast(params));
    }
  }
  render() { 
    const { awsDevops } = this.props;
    
    let awsUsageForecast = awsDevops.usageForecast;

    let chartData = {};

    if(awsUsageForecast){
      chartData = {
        labels: [],
        datasets: [{
        label: `Usage Forecast Per Month in ${awsUsageForecast.data[0].Total.Unit}`,
        data: [],
        barPercentage: 0.3,
        backgroundColor:'rgba(54, 162, 235, 1)',
        borderColor: 'rgba(255, 99, 132, 1)'
      }]};
  
      awsUsageForecast.data.forEach((val, index) => {
        chartData.labels.push(val.month);
        chartData.datasets[0].data.push(parseFloat(val.Total.Amount).toFixed(4));
      })
    }

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">AWS Usage Forecast</h5>
          {!awsDevops.error && awsDevops.loading && <PageLoader/>}
          {awsDevops.error && <span className="text-danger">ERROR - {awsDevops.error}</span>}
          {awsUsageForecast && chartData &&  
              <div className="container-fluid chart-body mb-50">
                <div className="col-md-6 offset-3">
                  <BarChart chartData={chartData}/>
                </div>
              </div>}
          {awsUsageForecast && <AwsUsageForecastDatatablePage awsUsageForecast={awsUsageForecast}/> }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { awsDevops } = state;

  return {
    awsDevops
  };
}

const connected = connect(mapStateToProps)(AwsUsageForecast);
export { connected as AwsUsageForecast };