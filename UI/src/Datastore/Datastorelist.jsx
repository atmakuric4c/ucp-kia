import React from "react";
import PageLoader from "../_components/PageLoader";
export default class Datastorelist extends React.Component {
  constructor(props) {
    super(props);
  }
  makeDatastoreAction = (id, status) => {
    this.props.makeActiveInactive(id, status);
  }
  datastore_detail=(dsid)=>{
    this.props.datastoreDetail(dsid);
  }
  view_host=(dsid)=>{
    this.props.viewHost(dsid);
  }
  openModal=(data)=>{
    this.props.openModal(data);
  }
  render() {
    if (this.props.data) {
      {
        return this.props.data.map((dstore, key) => {
          return (
            <tr key={dstore.id}>
              <td>{dstore.id}</td>
              <td><span className="badge badge-primary badge-sm" onClick={() => this.datastore_detail(dstore.id)}>{dstore.datastore_name}</span></td>
              <td>{dstore.disk_type}</td>
              <td>{dstore.vdc_name}</td>
              <td>{dstore.vdc_location}</td>
              <td>{dstore.status == "A" ? "Active" : "InActive"}</td>
              <td>
                {dstore.status == "A" ? (
                  <a
                    href="javascript:void(0);"
                    className="btn btn-warning"
                    onClick={() =>
                      this.makeDatastoreAction(dstore.id, "InActive")
                    }
                  >
                    Make InActive
                  </a>
                ) : (
                  <a
                    href="javascript:void(0);"
                    className="btn btn-primary"
                    onClick={() =>
                      this.makeDatastoreAction(dstore.id, "Activate")
                    }
                  >
                    Make Active
                  </a>
                )}
                &nbsp;&nbsp;&nbsp;&nbsp;<a
                    href="javascript:void(0);"
                    className="btn btn-info"
                    onClick={() => this.view_host(dstore.id)}
                  >
                    View Host
                  </a>
                  &nbsp;&nbsp;&nbsp;&nbsp;<a
                    href="javascript:void(0);"
                    className="btn btn-info"
                    onClick={() => this.openModal(dstore)}
                  >
                    Edit Datastore
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
