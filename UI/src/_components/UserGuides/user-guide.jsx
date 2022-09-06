import React from 'react';
import { authHeader, ucpEncrypt, ucpDecrypt } from '../../_helpers';
import config from 'config';
import Modal from "react-modal";
import UserGuidesList from './UserGuidesList';

Modal.setAppElement("#app");
class userGuide extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      is_loading: false
    };
  }

  componentDidMount() {
  }

  render() {
    let { userGuide = [] } = this.state;

    return <React.Fragment>
      <UserGuidesList />
    </React.Fragment>
  }
}

export { userGuide as userGuide };