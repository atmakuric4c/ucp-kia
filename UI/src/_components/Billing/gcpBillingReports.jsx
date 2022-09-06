import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import { commonActions, billingActions } from "../../_actions";
import ReactHtmlParser from 'react-html-parser'; 
import DatatablePage from './gcpBillingReportGridView';
import PageLoader from '../PageLoader';
import DatePicker from "react-datepicker";
import moment from 'moment';
import config from 'config';
import { toast } from 'react-toastify';
import { exportGcpBillingReportExcel } from '../../_helpers';
import Moment from 'react-moment';

const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");
class GcpBillingReport extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      billing: [],
      billingReports: [],
      pgiData : [],
      sweetalert: null,
      action: null,
      start_date: false,
      end_date: false,
      max_date: new Date(),
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
    if(!data.start_date || !data.end_date)
      return toast.error('Please select a start and end date')  

    var start_date = moment(data.start_date).format('yyyy-MM-DD');
    var end_date = moment(data.end_date).format('yyyy-MM-DD');

    let params = {clientid:this.state.clientid,start_date:start_date,end_date:end_date,
      set:1,limit:1000}
    this.props.dispatch(billingActions.getGcpBillingReports(params));
  };
  
  render() { 
    const { billingCommon } = this.props;
    let billingReports = billingCommon.gcpReports;

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">GCP Billing Report</h5>
          <form
              method="post"
              onSubmit={this.searchBillingReports}
            >
          <div className="row" style={{'padding':'0 20px'}}>
            <div className="col-sm-3">
              <label style={{'color': 'white'}} htmlFor="from_date">From Date :&nbsp;</label>
                <DatePicker
                  placeholderText="YYYY/MM/DD"
                  selected={this.state.start_date}
                  onChange={this.handleChangeStartdate}
                  selectsStart
                  startDate={this.state.start_date}
                  endDate={this.state.end_date}
                  maxDate={this.state.max_date}
                  withPortal
                  showYearDropdown
                  showMonthDropdown
              />
              </div>
              <div className="col-sm-3">
                <label style={{'color': 'white'}} htmlFor="to_date">To Date :&nbsp;</label>
                <DatePicker
                  placeholderText="YYYY/MM/DD"
                  selected={this.state.end_date}
                  onChange={this.handleChangeEnddate}
                  selectsEnd
                  startDate={this.state.start_date}
                  endDate={this.state.end_date}
                  minDate={this.state.start_date}
                  maxDate={this.state.max_date}
                  withPortal
                  showYearDropdown
                  showMonthDropdown
              />
              </div>
              <div className="col-sm-2" style={{paddingTop:'6px','float':'left'}}><br/>
                <button type="submit" className="btn btn-blue">Search</button>
              </div>
              <div className="col-sm-4" style={{paddingTop:'6px','float':'left'}}><br/>
              <button onClick={e => { 
                return billingReports && billingReports.data && billingReports.data.length ? 
                exportGcpBillingReportExcel({data: billingReports.data, start_date: this.state.start_date, end_date: this.state.end_date}) : 
                toast.error('No data to export')}}
              type="button" className="btn btn-blue" >Export Report</button>                    
              </div>
          </div>
          </form>
          <br></br>
          {!billingCommon.error && billingCommon.loading && <PageLoader/>}
          {billingCommon.error && <span className="text-danger">ERROR - {billingCommon.error}</span>}
          {billingReports && !billingCommon.loading && <DatatablePage
          date = {{ start_date: this.state.start_date, end_date: this.state.end_date }} 
          billingReports={billingReports}/> }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { billingCommon } = state;
  return {
    billingCommon
  };
}

const connected = connect(mapStateToProps)(GcpBillingReport);
export { connected as GcpBillingReport };