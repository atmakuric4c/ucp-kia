import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import Modal from "react-modal";
import { commonActions, alertActions,esxiActions} from "../_actions";
var serialize = require("form-serialize");
import Swal from "sweetalert2";
import { toast } from 'react-toastify';
import PageLoader from "../_components/PageLoader";
const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
};

export default class EsxiList extends React.Component {
 
  constructor(props) {
    super(props);
    this.state = {

    };
    this.makeenabledisable=this.makeenabledisable.bind(this);
  }
  host_detail=(id)=>{
    this.props.hostDetail(id);
  }
  view_datastore=(id)=>{
    this.props.viewDatastore(id);
  }
 makeenabledisable = (action,id, status) => {
   let statusStr=(status=='A')?'Active':'Inactive';
  Swal.fire({
    title: "Are you sure?",
    text: "You want to " + statusStr + "?",
    type: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, Update it!"
  }).then(result => {
    if (result.value) {
      this.props.dispatch(
        this.props.makeEsxiAction(action,id,status)
      );
      this.props.dispatch(esxiActions.getAllHosts()); 
      toast.success("Host Status Updated.");
    }
  });
};
  render() {
    if (this.props.data) {
      {
        return this.props.data.map((esxihost, key) => {
          return (
            <tr key={esxihost.id}>
              <td>{esxihost.id}</td>
              <td>{esxihost.vdc_name}</td>
              <td><span className="badge badge-primary badge-sm" onClick={() => this.host_detail(esxihost.id)}>{esxihost.host_ip}</span></td>
              <td>{esxihost.host_name}</td>
              <td>{esxihost.status == "A" ? "Active" : "InActive"}</td>
              <td>
              {esxihost.status == "A" ? (
                  <a
                    href="javascript:void(0);"
                    className="btn btn-warning"
                    onClick={() => this.makeenabledisable("esxistatus",esxihost.id, "I")}
                  >
                    Make InActive
                  </a>
                ) : (
                  <a
                    href="javascript:void(0);"
                    className="btn btn-primary"
                    onClick={() => this.makeenabledisable("esxistatus",esxihost.id, "A")}
                  >
                    Make Active
                  </a>
                )}
                &nbsp;&nbsp;&nbsp;&nbsp;<a
                    href="javascript:void(0);"
                    className="btn btn-info"
                    onClick={() => this.view_datastore(esxihost.id)}
                  >
                    View Datastore
                  </a>
              </td>
            </tr>
          );
        });
      }
      
    } else
      return (
        <tr>
          <td><PageLoader/></td>
        </tr>
      );
  }
}