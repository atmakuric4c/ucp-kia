import React from 'react';
import Modal from "react-modal";
import { authHeader,ucpEncrypt, ucpDecrypt,ucpEncryptForUri,ucpDecryptForUri, decryptResponse } from '../../_helpers';
import config from 'config';
import PageLoader from '../PageLoader';
//import "./../../css/oatchecklist.css";

Modal.setAppElement("#app");
class OatCheckList extends React.Component {
  constructor(props) {
    super(props);

    let user = decryptResponse(localStorage.getItem("user"));
    this.state = {
      oatList: [],
      show_results_modal: false,
      data: undefined,
      is_loading: false,
      user : user
    };
  }

  popupCloseModal() {
    this.setState({ show_results_modal: false });
  }

  componentDidMount() {
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt({
        id: this.props.vm_data.vmdetails.dataFromDB.id
      }))
    }, self = this;

    fetch(`${config.apiUrl}/secureApi/azure/get-oat-list`, requestOptions).then(response => {
      response.text().then(text => {
        try {
          text = JSON.parse(ucpDecrypt(JSON.parse(text)));
        }
        catch(e) {
          text = [];
        }
        self.setState({ oatList: text.data });
      });
    });
  }

  showResults(aData) {
    this.setState({
      show_results_modal: 1, is_loading: true, data: {
        heading: aData.heading,
        arr: []
      }
    });
    const requestOptions = {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(ucpEncrypt({
        id: aData.id
      }))
    }, self = this;

    fetch(`${config.apiUrl}/secureApi/azure/get-oat-list-data`, requestOptions).then(response => {
      response.text().then(text => {
        try {
          text = ucpDecrypt(JSON.parse(text));
          text = JSON.parse(text).data;
        }
        catch(e) {
          text = [{oat_checklist_data: 'NA'}];
        }       

        let oatList = text[0];
        if (aData.mode === 'all') {
          oatList.oat_checklist_data = unescape(oatList.oat_checklist_data)
          oatList = JSON.parse(oatList.oat_checklist_data)
        }
        if (aData.mode === 'pass') {
          oatList.passed_checklist_data = unescape(oatList.passed_checklist_data)
          oatList = JSON.parse(oatList.passed_checklist_data)
        }
        if (aData.mode === 'fail') {
          oatList.failed_checklist_data = unescape(oatList.failed_checklist_data)
          oatList = JSON.parse(oatList.failed_checklist_data)
        }

        self.setState({
          is_loading: false, data: {
            arr: Object.values(oatList),
            heading: aData.heading
          }
        });
      });
    });
  }

  render() {
    let { oatList = [], show_results_modal, data = {}, is_loading } = this.state;

    return <React.Fragment>
      <h5 className="color sub-heading">
        OAT Checklist
   </h5>
      <div className="table-responsive">
        <table className="table table-bordered table-striped table-dark table-custom table-hover" id="vm_logs">
          <thead>
            <tr>
              <th>Version</th>
              <th>Pass</th>
              <th>Fail</th>
              <th>Total</th>
              <th>Date</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {oatList && oatList.map((data, index) =>
              <tr key={index}>
                <td>{index + 1}</td>
                <td><span className="alert info-box-success cursor" onClick={() => {
                  this.showResults({
                    heading: `Total ${data.pass} of ${data.pass + data.fail} Passed`,
                    mode: 'pass', id: data.id
                  })
                }}>{data.pass}</span></td>
                <td>
                  <span className="alert info-box-danger cursor" onClick={() => {
                    this.showResults({
                      heading: `Total ${data.fail} of ${data.pass + data.fail} Failed`,
                      mode: 'fail', id: data.id
                    })
                  }}>{data.fail}</span></td>
                <td>
                  <span className="alert info-box-blue cursor" onClick={() => {
                    this.showResults({
                      heading: 'Total CheckList ' + `${data.pass + data.fail}`,
                      mode: 'all', id: data.id
                    })
                  }}>{data.pass + data.fail}</span>
                </td>
                <td>{data.created_on} {this.state.user.data.TIME_ZONE}</td>
                <td>{data.ctask}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Modal
        isOpen={show_results_modal && data}
        onRequestClose={this.popupCloseModal.bind(this)}
      >
        <h2 style={{ color: 'red' }}>
          {data.heading} <a className="float-right" href="javascript:void(0);" 
            onClick={this.popupCloseModal.bind(this)}><i className="fa fa-times" /></a>
        </h2>
        {is_loading && <PageLoader />}
        <div className="oat-check-list col-md-12">
          
            {((data || {}).arr || []).map((block, blkIndex) => {
              let submenus = Object.values(block.submenu) || [],
                tests = block.tests;

              return <div className="container" key={blkIndex}>
                <div className="row">
                  <div className="col-12 col-md-12">
                    <div className="list-unstyleddata">
                      <ol className="list-group pt-0">
                        <li className="list-group-item py-0 title">
                          <h6 className="text-muted d-inline-block">{block.text}</h6>
                          {submenus.map((menu, menuIndex) => {
                            let is_fail = menu.is_fail ? "text-danger": "text-success",
                              menu_tests = menu.tests;

                            return <ol key={menuIndex+'_'+blkIndex}>
                              <li className="list-group-item py-0"><strong class={is_fail}>
                                {menu.text}
                              </strong>
                              </li>
                              {menu_tests && menu_tests.length ? <ol className="list-group liststyle-none">
                              {menu_tests.map((test, testIndex) => {
                                let className = (test || '').includes('Pass')? "text-success": "text-danger",
                                  iconClass = (test || '').includes('Pass') ? "fa-check": "fa-window-close";
                              test = (test || '').split(':');

                              return <li className="list-group-item py-0" 
                                key={menuIndex+'_'+blkIndex+'_'+testIndex}>
                                <span class={className}>
                                  <i className={`fas ${iconClass} mx-2`}></i>
                                  <small>{test[0]} :</small>
                                </span> 
                                {test[1]}
                              </li>
                              })}
                              </ol>: null}
                            </ol>
                          })}
                          {
                            tests && tests.length ? <ol className="list-group liststyle-none">
                              {tests.map((test, headText) => {
                                  let className = (test || '').includes('Pass')? "text-success": "text-danger";
                                  test = (test || '').split(':');

                                  return <li className="list-group-item py-0" key={headText+ blkIndex+'_'}>
                                    <span class={className}>
                                      <i className="fas fa-check mx-2"></i>
                                      <small>{test[0]} :</small>
                                    </span> 
                                    {test[1]}
                                  </li>
                                })
                              }   
                            </ol>: null
                          }
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            })}
          </div>

      </Modal>
    </React.Fragment>
  }
}

export default OatCheckList;