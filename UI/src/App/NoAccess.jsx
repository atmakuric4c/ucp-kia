import React from "react";

class NoAccess extends React.Component {
  constructor(props) {
    super(props); 
  }

  render() {
    return (
        <div className="container-fluid main-body">
            <div className="contentarea no-access-wrapper mb-0">
                <div className="wrapper-403">
                  Unauthorized Access !
                </div>
                <div className="border-btm-403">
                </div>
                <div className="no-access-admin-msg">
                  Sorry, you are forbidden to view this page.
                </div>
                <div className="no-access-admin-msg">
                  Kindly Contact your Team Manager to receive access.
                </div>
                <div className="mt-4 mb-5">
                    <a href="/#" className="btn btn-primary btn-white-btn-primary">Go Home</a>
                </div>
            </div>
        </div>
    );
  }
}

export { NoAccess };