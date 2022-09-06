import React from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from 'react-toastify';

export default class EmailList extends React.Component {
  constructor(props) {
    super(props);
    this.updateEmailStatus = this.updateEmailStatus.bind(this);
  }
  updateEmailStatus = (id, status) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You sure make " + status + " ?",
      type: "info",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Do it!",
      showLoaderOnConfirm: true
    }).then(result => {
      console.log(result.value);
      if (result.value) {
        //Swal.fire("Deleted!", "Your file has been deleted.", "success");
        //settingsActions.enableDisableEmail(id, status);
        this.props.enabeDisableEmail(id, status);
        toast.success("Mail Status Updated Successfully.");
      }
    });
  };
  render() {
    if (this.props.data) {
      return this.props.data.map((em, key) => {
        return (
          <tr key={key}>
            <td>{em.hostname}</td>
            <td>{em.email}</td>
            <td>{em.port}</td>
            <td>XXXX</td>
            <td>{em.status}</td>
            <td>
              {em.status == "Active" ? (
                <a
                  href="javascript:void(0);"
                  className="btn btn-warning"
                  onClick={() => this.updateEmailStatus(em.id, "InActive")}
                >
                  Make InActive
                </a>
              ) : (
                <a
                  href="javascript:void(0);"
                  className="btn btn-primary"
                  onClick={() => this.updateEmailStatus(em.id, "Activate")}
                >
                  Make Active
                </a>
              )}
            </td>
          </tr>
        );
      });
    } else {
      return (
        <tr>
          <td colSpan="4"> No Data or Loading..</td>
        </tr>
      );
    }
  }
}
