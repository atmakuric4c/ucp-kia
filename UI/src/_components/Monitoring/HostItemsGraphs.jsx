import React from 'react';
import { connect } from 'react-redux';
import { monitoringActions } from './monitoring.actions';
import Modal from "react-modal";
var serialize = require("form-serialize");
import Chart from 'react-apexcharts'
import PageLoader from '../PageLoader';

const customStyles = {
  content: {
    width: "80% !important"
  }
};
Modal.setAppElement("#app");

class HostItemsGraphs extends React.Component {
  constructor(props) {
    super(props);
    //console.log(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      isHostItemsGraphsLoading: false,
      id: props.match.params.id
    };
  }

  componentDidMount() {
    debugger;
    if(window.location.href.indexOf("flag") == -1){
      this.props.dispatch(monitoringActions.getHostItemsGraphs(this.state.id));
    }
    else{
      //Physical Server Host API
      this.props.dispatch(monitoringActions.getHostItemsGraphs(this.state.id, true));
    }
  }

  render() {
    const { hostitemsgraphs } = this.props;
    //console.log(hostitemsgraphs);
    return (
      <div className="col-md-12">
        <h5 className="color mt-3">Host Items Graphs</h5>
        {!hostitemsgraphs.error && hostitemsgraphs.loading && <PageLoader/>}
        {hostitemsgraphs.error && <span className="text-danger">ERROR - {hostitemsgraphs.error}</span>}
        {hostitemsgraphs.items && !hostitemsgraphs.loading && (
          <div className="mb-4 pb-4">
            {hostitemsgraphs.items.map((mon, index) =>
              <div key={index} className="graphSegments">
               
                {mon.values.length>0 ?
                <h4 className="graph-heading-border color mt-2 mb-2">{mon.appname}</h4> : ""}
                 <div className="row mt-2 ">
                {mon.values.map((item, itemIndex) =>
                  // <div key={itemIndex} className="">
                  //   <h5>{item.item_name}</h5>
                    <div key={itemIndex} className="col-md-4">
                      <div className="graph-card mt-2">
                        <div className="graph-card-header">
                          <h4 className="graph-card-title">{item.item_name}</h4>
                        </div>
                        <Chart options={{
                          chart: {
                            id: "basic-bar"
                          },
                          xaxis: {
                            categories: item.clockData
                          }
                        }}
                          series={[
                            {
                              name: "",
                              data: item.valData
                            }
                          ]}
                          type="line"
                          width="100%" />
                          </div>
                          </div>

                      // </div>
                                  )}
                                  </div>
                        
                                </div>
                        )}

                    </div>
                )
                }
              </div>
            );
    }
}

function mapStateToProps(state) {
    const { hostitemsgraphs} = state;
    return {
              hostitemsgraphs
            };
}

const connectedMonitoring = connect(mapStateToProps)(HostItemsGraphs);
export { connectedMonitoring as HostItemsGraphs};