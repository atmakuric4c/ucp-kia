import React from 'react';
import { connect } from 'react-redux';
import { supportActions } from './support.actions';
import SweetAlert from 'react-bootstrap-sweetalert';
var serialize = require("form-serialize");
import Modal from "react-modal";
import DatatablePage from './myticketlist'
import PageLoader from '../PageLoader';
import ReactFileReader from 'react-file-reader';

Modal.setAppElement("#app");
class Myticket extends React.Component {
  constructor(props) {
    super(props);
    let user = JSON.parse(localStorage.getItem("user"));
    this.state = {
      user: user.data,
      myticket: [],
      modalIsOpenTicket: false,
      files: {
        tmp_name: [],
        name: []
      },
      selectedIndex:0,
    }
    this.openModalCreateTicket = this.openModalCreateTicket.bind(this)
    this.closeModalTicket = this.closeModalTicket.bind(this)
    this.createSupportTicket = this.createSupportTicket.bind(this)
  }
  createSupportTicket = e => {
    e.preventDefault();
    var form = document.querySelector("#createTicketFrm");
    var formData = serialize(form, { hash: true });
    var post = { clientid: this.state.user.clientid, user_email: this.state.user.email, company_entity: "cloud", files: this.state.files }
    this.props.dispatch(supportActions.createTicket(formData, post));
    //this.setState({ sweetalert: null });
    //this.closeModalTicket();
  }
createGobearSupportTicket
  createGobearSupportTicket = e => {
    e.preventDefault();
    var form = document.querySelector("#createTicketFrm");
    var formData = serialize(form, { hash: true });
    var post = { clientid: this.state.user.clientid, user_email: this.state.user.email, company_entity: "cloud", files: this.state.files,instance:"" }
    this.props.dispatch(supportActions.createTicket(formData, post));
    //this.setState({ sweetalert: null });
    //this.closeModalTicket();
  }

  closeModalTicket() {
    this.setState({ modalIsOpenTicket: false });
  }
  openModalCreateTicket() {
    this.setState({ modalIsOpenTicket: true });
    this.props.dispatch(supportActions.getTicketFormData(this.state.user.clientid));
  }

  handleIndex=(aEvent)=>{
    let target = aEvent.target;
    let selectedIndex = parseInt(aEvent.target.selectedOptions[0].getAttribute('data-index'))
    this.setState({ selectedIndex: selectedIndex });
  }

  handleFiles = (files) => {
    
    files.base64.map((base64, i) => {
      return this.state.files.tmp_name.push(base64.split(',')[1]);
    });

    Object.values(files.fileList).map((file) => {
      return this.state.files.name.push(file.name);
    });
    
    this.setState({
      fileName: this.state.files.name.join(', ')
    });

  }


  componentDidMount() {
    this.props.dispatch(supportActions.getAllMyTicket(this.state.user.clientid));
  }

  render() {
    const { myticket } = this.props;
    console.log(this.props.myticket.configdata)
    let configdata = this.props.myticket.configdata || {BusinessUnit:[],Category:[],GobearIssueType:[],RequestorDivision:[],TICKET_TYPE_AND_PRIORITIES:[],issue_type:[],vms:[]};
    console.log(configdata)
    var clientId = JSON.parse(localStorage.getItem("user")).data.clientid ;
    var gobearId = JSON.parse(localStorage.getItem("user")).data.GOBEAR_CLIENT_ID ;
    var selectedIndex =  this.state.selectedIndex || 0;
   
    return (
      <div className="container-fluid main-body">
        <div className="contentarea">
         
          <div className="row">
            <div className="col-md-6">
              <h5 className="color">Ticket List</h5>
            </div>
            <div className="col-md-6">
              <div className="text-right mb-2">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => this.openModalCreateTicket()}
                >
                  <i className="fa fa-plus" /> Create Ticket
              </button>
              </div>
            </div>
          </div>
          {!myticket.error && myticket.loading && <em><PageLoader /></em>}
          {myticket.error && <span className="text-danger">ERROR - {myticket.error}</span>}
          {myticket.items && !myticket.loading && <DatatablePage mytickets={myticket.items} />}
        </div>
        {clientId != gobearId ?
        <Modal
          isOpen={this.state.modalIsOpenTicket}
          onRequestClose={this.closeModalTicket}
          contentLabel="Create Ticket">
          <h2 style={{ color: 'red' }}>
            Create Ticket <a className="float-right" href="javascript:void(0);" onClick={this.closeModalTicket}><i className="fa fa-times" /></a>
          </h2>
          <div className="col-md-12">
            <div className="panel panel-default" />
            <form
              name="createTicketFrm"
              id="createTicketFrm"
              method="post"
              onSubmit={this.createSupportTicket}
            >
              {clientId != gobearId ?
              <div className="form-group row ">
                <label htmlFor="COE" className='col-sm-3 col-form-label'>COE:<i className="redcolor">*</i></label>
                <div className="col-sm-9">
                  <input type="text" className="form-control color" required disabled value="Cloud" />
                </div>
              </div>
              :
              <div className="form-group row d-none">
                <label htmlFor="COE" className='col-sm-3 col-form-label'>COE:<i className="redcolor">*</i></label>
                <div className="col-sm-9">
                  <input type="text" className="form-control color" required disabled value="Cloud" />
                </div>
              </div>}
              <div className="form-group row">
                <label htmlFor="issue_type" className='col-sm-3 col-form-label'>Ticket Type:<i className="redcolor">*</i></label>
                <div className="col-sm-9">
                  <select className="form-control" required name="TICKETTYPEID" onChange={this.handleIndex}>
              
                  {configdata && configdata.TICKET_TYPE_AND_PRIORITIES.map((ticketType, index) =>
                      <option key={index + 1} data-index={index} value={`${ticketType.TICKET_TYPE_ID}`}>{ticketType.TICKET_TYPE_NAME}</option>
                  )}
                  </select>
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="issue_type" className='col-sm-3 col-form-label'>Issue Type:<i className="redcolor">*</i></label>
                <div className="col-sm-9">
                  <select className="form-control" required name="issue_type">
                    {configdata && configdata.issue_type.map((issue, index) =>
                      <option key={index + 1} value={`${issue.issue_type}`}>{issue.issue_type}</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="priority" className='col-sm-3 col-form-label'>Ticket Priority:<i className="redcolor">*</i></label>
                <div className="col-sm-9">
                {console.log(selectedIndex)}
                  {console.log(configdata.TICKET_TYPE_AND_PRIORITIES[selectedIndex])}
                  <select className="form-control" required name="priority">
                  {configdata && configdata.TICKET_TYPE_AND_PRIORITIES[selectedIndex] && 
                  (configdata.TICKET_TYPE_AND_PRIORITIES[selectedIndex].PRIORITIES || []).map((priority, index) =>
                      <option key={index + 1} value={`${priority.id}`}>{priority.priority}</option>
  )}
                  </select>
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="Instance" className='col-sm-3 col-form-label'>Instance:<i className="redcolor">*</i></label>
                <div className="col-sm-9">
                  <select className="form-control" required name="instance">
                    {configdata && configdata.vms.map((data, index) =>
                      <option key={index + 1} value={`${data.label_name}`}>{data.label_name}</option>
                    )}
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="subject" className='col-sm-3 col-form-label'>Subject:<i className="redcolor">*</i></label>
                <div className="col-sm-9">
                  <input type="text" className="form-control" required name="subject" placeholder="Subject" />
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="description" className='col-sm-3 col-form-label'>Description:<i className="redcolor">*</i></label>
                <div className="col-sm-9">
                  <textarea type="text" className="form-control" required name="description" placeholder="Description" rows="5"></textarea>
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="attach_file" className='col-sm-3 col-form-label'>Attach File:</label>
                <div className="col-sm-9">
                  {/* <input type="file" className="form-control" name="attach_file" /> */}
                  <ReactFileReader fileTypes={["*"]} base64={true} multipleFiles={true} handleFiles={this.handleFiles} id="file_contents" name="file_contents">
                    <div className='btn btn-sm btn-primary '>Upload</div>
                  </ReactFileReader>
                  {this.state.fileName ? <span className='mr-2'>{this.state.fileName}</span> : ""}
                </div>
              </div>

              <div className="form-group row">
                <label className='col-sm-2 col-form-label'>&nbsp;</label>
                <div className="col-sm-10">
                  {/*  <input type="hidden" name="department_id" value='3' />
                <input type="hidden" name="type" value='1' />
                <input type="hidden" name="tickettypeid" value='2' />
                <input type="hidden" name="priority" value='618' />*/}
                  <button 
                  className={"btn btn-sm btn-primary float-right " + (myticket.submitLoading ? "no-access" : "")} disabled={myticket.submitLoading ? true : false}
                  >
                    {myticket.submitLoading && 
                        <i className="fas fa-circle-notch icon-loading"></i>
                    }
                    Submit
                  </button>
                </div>
              </div>
            </form>
          </div>
        </Modal> :
         <Modal
         isOpen={this.state.modalIsOpenTicket}
         onRequestClose={this.closeModalTicket}
         contentLabel="Create Ticket">
         <h2 style={{ color: 'red' }}>
           Create Ticket <a className="float-right" href="javascript:void(0);" onClick={this.closeModalTicket}><i className="fa fa-times" /></a>
         </h2>
         <div className="col-md-12">
           <div className="panel panel-default" />
           <form
             name="createTicketFrm"
             id="createTicketFrm"
             method="post"
             onSubmit={this.createGobearSupportTicket}
           >
             {clientId != gobearId  ?
             <div className="form-group row ">
               <label htmlFor="COE" className='col-sm-3 col-form-label'>COE:<i className="redcolor">*</i></label>
               <div className="col-sm-9">
                 <input type="text" className="form-control color" required disabled value="Cloud" />
               </div>
             </div>
             :
             <div className="form-group row d-none">
               <label htmlFor="COE" className='col-sm-3 col-form-label'>COE:<i className="redcolor">*</i></label>
               <div className="col-sm-9">
                 <input type="text" className="form-control color" required disabled value="Cloud" />
               </div>
             </div>}
             <div className="form-group row">
               <label htmlFor="issue_type" className='col-sm-3 col-form-label'>Ticket Type:<i className="redcolor">*</i></label>
               <div className="col-sm-9">
                 <select className="form-control" required name="TICKETTYPEID" onChange={this.handleIndex}>
             
                 {configdata && configdata.TICKET_TYPE_AND_PRIORITIES.map((ticketType, index) =>
                     <option key={index + 1} data-index={index} value={`${ticketType.TICKET_TYPE_ID}`}>{ticketType.TICKET_TYPE_NAME}</option>
                 )}
                 </select>
               </div>
             </div>
             <div className="form-group row">
               <label htmlFor="issue_type" className='col-sm-3 col-form-label'>Issue Type:<i className="redcolor">*</i></label>
               <div className="col-sm-9">
                 <select className="form-control" required name="issuetype">
                   {configdata && configdata.GobearIssueType.map((issue, index) =>
                     <option key={index + 1} value={`${issue.val}`}>{issue.val}</option>
                   )}
                 </select>
               </div>
             </div>
             <div className="form-group row">
               <label htmlFor="Category" className='col-sm-3 col-form-label'>Category:<i className="redcolor">*</i></label>
               <div className="col-sm-9">
                 <select className="form-control" required name="category">                  
                    {configdata && configdata.Category.map((category, index) =>
                     <option key={index + 1} value={`${category.val}`}>{category.val}</option>
                   )}
                   {/* <option value="Others">Others</option> */}
                 </select>
               </div>
             </div>
             <div className="form-group row">
               <label htmlFor="priority" className='col-sm-3 col-form-label'>Ticket Priority:<i className="redcolor">*</i></label>
               <div className="col-sm-9">
               {console.log(selectedIndex)}
                 {console.log(configdata.TICKET_TYPE_AND_PRIORITIES[selectedIndex])}
                 <select className="form-control" required name="priority">
                 {configdata && configdata.TICKET_TYPE_AND_PRIORITIES[selectedIndex] && 
                 (configdata.TICKET_TYPE_AND_PRIORITIES[selectedIndex].PRIORITIES || []).map((priority, index) =>
                     <option key={index + 1} value={`${priority.id}`}>{priority.priority}</option>
 )}
                 </select>
               </div>
             </div>
             <div className="form-group row">
               <label htmlFor="RequestorDivision" className='col-sm-3 col-form-label'>Requestor Division:<i className="redcolor">*</i></label>
               <div className="col-sm-9">
                 <select className="form-control" required name="req_division">                  
                    {configdata && configdata.RequestorDivision.map((reqdivision, index) =>
                     <option key={index + 1} value={`${reqdivision.val}`}>{reqdivision.val}</option>
                   )}
                   {/* <option value="Others">Others</option> */}
                 </select>
               </div>
             </div>
             <div className="form-group row">
               <label htmlFor="BusinessUnit" className='col-sm-3 col-form-label'>Business Unit:<i className="redcolor">*</i></label>
               <div className="col-sm-9">
                 <select className="form-control" required name="bu_unit">                  
                    {configdata && configdata.BusinessUnit.map((bu, index) =>
                     <option key={index + 1} value={`${bu.val}`}>{bu.val}</option>
                   )}
                   {/* <option value="Others">Others</option> */}
                 </select>
               </div>
             </div>             
           
             <div className="form-group row">
               <label htmlFor="subject" className='col-sm-3 col-form-label'>Subject:<i className="redcolor">*</i></label>
               <div className="col-sm-9">
                 <input type="text" className="form-control" required name="subject" placeholder="Subject" />
               </div>
             </div>
             <div className="form-group row">
               <label htmlFor="description" className='col-sm-3 col-form-label'>Description:<i className="redcolor">*</i></label>
               <div className="col-sm-9">
                 <textarea type="text" className="form-control" required name="description" placeholder="Description" rows="4"></textarea>
               </div>
             </div>
    
             <div className="form-group row">
               <label htmlFor="attach_file" className='col-sm-3 col-form-label'>Attach File:<i className="redcolor">*</i></label>
               <div className="col-sm-9">
                 {/* <input type="file" className="form-control" name="attach_file" /> */}
                 <ReactFileReader fileTypes={["*"]} base64={true} multipleFiles={true} handleFiles={this.handleFiles} id="file_contents" name="file_contents">
                   <div className='btn btn-sm btn-primary '>Upload</div>
                 </ReactFileReader>
                 {this.state.fileName ? <span className='mr-2'>{this.state.fileName}</span> : ""}
               </div>
             </div> 


             <div className="form-group row">
               <label className='col-sm-2 col-form-label'>&nbsp;</label>
               <div className="col-sm-10">
                 {/*  <input type="hidden" name="department_id" value='3' />
               <input type="hidden" name="type" value='1' />
               <input type="hidden" name="tickettypeid" value='2' />
               <input type="hidden" name="priority" value='618' />*/}
                 <button 
                 className={"btn btn-sm btn-primary float-right " + (myticket.submitLoading ? "no-access" : "")} disabled={myticket.submitLoading ? true : false}
                 >
                   {myticket.submitLoading && 
                       <i className="fas fa-circle-notch icon-loading"></i>
                   }
                   Submit
                 </button>
               </div>
             </div>
           </form>
         </div>
                  </Modal> }

      </div>
    );
  }
}

function mapStateToProps(state) {
  const { myticket } = state;
  return {
    myticket: myticket
  };
}

const connectedTicketlist = connect(mapStateToProps)(Myticket);
export { connectedTicketlist as Myticket };