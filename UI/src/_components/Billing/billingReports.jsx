import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { billingActions } from './billing.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions } from "../../_actions";
import ReactHtmlParser from 'react-html-parser'; 
import DatatablePage from './billingReportGridview';
import PageLoader from '../PageLoader';
import DatePicker from "react-datepicker";
import moment from 'moment';
import config from 'config';
const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");
class billingReports extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    var start_date = new Date();
    start_date.setDate(start_date.getDate() -365);
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      billing: [],
      billingReports: [],
      pgiData : [],
      sweetalert: null,
      action: null,
      start_date:start_date,
      end_date:new Date(),
      export_url:''
    };
    this.handleChangeStartdate = this.handleChangeStartdate.bind(this);
    this.handleChangeEnddate = this.handleChangeEnddate.bind(this);
  }
  handleChangeStartdate(date) {
    this.setState({
      start_date: date
    });
  }

  handleChangeEnddate(date) {
    this.setState({
      end_date: date
    });
  }
  searchBillingReports = e => {
    e.preventDefault();      
    let data = this.state
    var start_date = moment(data.start_date).format('yyyy-MM-DD');
    var end_date = moment(data.end_date).format('yyyy-MM-DD');
    var params = {clientid:this.state.clientid,start_date:start_date,end_date:end_date,
      set:1,limit:100}
    this.props.dispatch(billingActions.getBillingReports(params));
  };
  componentDidMount() {
    var start_date = moment(this.state.start_date).format('yyyy-MM-DD');
    var end_date = moment(this.state.end_date).format('yyyy-MM-DD');
    var params = {clientid:this.state.clientid,start_date:start_date,end_date:end_date,set:1,limit:100}
    var queryString = params;
     queryString = btoa(JSON.stringify(queryString));
    this.setState({export_url:`${config.apiUrl}/download/billing_aws_reports/?data=${queryString}`})
    this.props.dispatch(billingActions.getBillingReports(params));
  }
  render() { 
    const { billing } = this.props;
    let billingReports = billing.reports;
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">AWS Billing Reports</h5>
          <form
              method="post"
              onSubmit={this.searchBillingReports}
            >
          <div className="row" style={{'padding':'0 20px'}}>
            <div className="col-sm-3">
              <label htmlFor="from_date">From Date :&nbsp;</label>
                <DatePicker
                  dateFormat="yyyy/MM/dd"
                  selected={this.state.start_date}
                  selectsStart
                  start_date={this.state.start_date}
                  end_date={this.state.end_date}
                  onChange={this.handleChangeStartdate}
                  withPortal
                  showYearDropdown
                  showMonthDropdown
              />
              </div>
              <div className="col-sm-3">
                <label htmlFor="to_date">To Date :&nbsp;</label>
                <DatePicker
                  dateFormat="yyyy/MM/dd"
                  selected={this.state.end_date}
                  selectsEnd
                  start_date={this.state.start_date}
                  end_date={this.state.end_date}
                  onChange={this.handleChangeEnddate}
                  withPortal
                  showYearDropdown
                  showMonthDropdown
              />
              </div>
              <div className="col-sm-2" style={{'padding-top':'6px','float':'left'}}><br/>
                <button className="btn btn-blue">Search</button>
              </div>
              <div className="col-sm-4" style={{'padding-top':'6px','float':'left'}}><br/>
              <div onClick={()=> window.open(this.state.export_url, "_blank")} className="btn btn-blue" >Export Report</div>                    
              </div>
          </div>
          </form>
          {!billing.error && billing.loading && <PageLoader/>}
          {billing.error && <span className="text-danger">ERROR - {billing.error}</span>}
          {billingReports && !billing.loading && <DatatablePage billingReports={billingReports}/> }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { billing } = state;
  return {
    billing
  };
}

const connected = connect(mapStateToProps)(billingReports);
export { connected as billingReports };