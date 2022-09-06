import React from "react";
import { Link } from "react-router-dom";
import Modal from "react-modal";
export default class IpHistoryComponent extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div>
        <Modal
          isOpen={this.state.modalIsOpenIPHistory}
          onAfterOpen={this.afterOpenModalIPHistory}
          onRequestClose={this.closeModalIPHistory}
          style={customStyles}
          contentLabel="IP History"
        >
          <h2 ref={subtitle => (this.subtitle = subtitle)}>
            IPAM History
            <i className="fa fa-times" onClick={this.closeModalIPHistory} />
          </h2>

          <div className="col-md-12">
            <div className="panel panel-default"> Modal 2</div>
          </div>
        </Modal>
      </div>
    );
  }
}
