import React, {Fragment} from 'react';
import { connect } from 'react-redux';
import { awsDevopsActions } from '../../_actions';
import Modal from "react-modal";
import AwsRepoListDatatablePage from './awsRepoListGridView';
import PageLoader from '../PageLoader';
import hljs from 'highlight.js';
//import ReactQuill from 'react-quill';
//import 'react-quill/dist/quill.snow.css';

Modal.setAppElement("#app");
class AwsRepoFileContent extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      clientid: user.data.clientid,
      user_id: user.data.id,
      user_role: user.data.user_role,
      pgiData : [],
      modules: {
        toolbar: null,
        syntax: {
            highlight: text => hljs.highlightAuto(text).value
        },
        clipboard: {
            matchVisual: false,
          },
      }
    };

    this.handleBudgetModalOpen = this.handleBudgetModalOpen.bind(this)
  }


  handleBudgetModalOpen() {
    this.props.dispatch(awsDevopsActions.updateAddRepoModal(true));
  }

  componentDidMount() {
    //if(!this.props.awsDevops || !this.props.awsDevops.awsRepoFileContent){
      var params = {repo_id: this.props.match.params.repo_id, file_id: this.props.match.params.file_id, cloudName:'AWS'}
      this.props.dispatch(awsDevopsActions.getRepoFileContent(params));
    //}
  }
  render() { 

    const { awsDevops } = this.props;
    let awsRepoFileContent = awsDevops.awsRepoFileContent;

    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
          <h5 className="color">AWS File Content</h5>
          <br></br>
          {!awsDevops.error && awsDevops.loading && <PageLoader/>}
          {awsDevops.error && <span className="text-danger">ERROR - {awsDevops.error}</span>}
          {/*Buffer.from(awsRepoFileContent.data).toString()*/}
          {/*{awsRepoFileContent && !awsDevops.loading &&
          <ReactQuill theme="snow"
          modules={this.state.modules}
          readOnly={true}
          value={`<code><pre><xmp>${Buffer.from(awsRepoFileContent.data).toString()}</xmp></pre></code>`}
        />}
*/}          <br></br>
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

const connected = connect(mapStateToProps)(AwsRepoFileContent);
export { connected as AwsRepoFileContent };