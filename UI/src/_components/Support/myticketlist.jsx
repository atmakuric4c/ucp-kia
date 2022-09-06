import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { supportActions } from './support.actions';
import { MDBDataTable } from 'mdbreact';
import nl2br from "react-newline-to-break";
import utf8 from 'utf8';
import Moment from 'react-moment';
import ReactFileReader from 'react-file-reader';
var serialize = require("form-serialize");

Modal.setAppElement("#app");
class DatatablePage extends React.Component {
    constructor(props) {
        super(props);
        this.openModalTicketView = this.openModalTicketView.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.values=[];
        this.props.mytickets.map((ticket, index) =>{
            this.values[index]={
                ticketmaskid:<a href="javascript:void(0);" onClick={() => this.openModalTicketView(ticket)}>{ticket.ticketmaskid}</a>,
                subject:ticket.subject,
                priority:ticket.prioritytitle,
                status:ticket.ticketstatustitle,
                type:ticket.tickettypetitle,
                createddate:ticket.createddate,                
                issue_type:ticket.issue_type,
                category:ticket.category,
                req_devision:ticket.req_devision,
                bu_unit:ticket.bu_unit,
            action:<a href="javascript:void(0);" onClick={() => this.openModalTicketView(ticket)}>{ticket.ticketstatustitle =="Open" ? <i className="fas fa-reply"></i>:""} </a>
            }
        })
        let user = JSON.parse(localStorage.getItem("user"));
        this.state = {
            user:user.data,
            ticketDetail:[],
            modalIsOpen:false,
            files: {
                temp_name: [],
                name: []
            },
            data: {
                columns: [
                {
                    label: 'Ticket ID',
                    field: 'ticketmaskid',
                    sort: 'asc',
                    width: 150
                },
                {
                    label: 'Subject',
                    field: 'subject',
                    sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Priority',
                    field: 'priority',
                    sort: 'asc',
                    width: 200
                },
                {
                    label: 'Status',
                    field: 'status',
                    sort: 'asc',
                    width: 100
                },
                {
                    label: 'Ticket Type',
                    field: 'type',
                    sort: 'asc',
                    width: 150
                },
                {
                    label: 'Created Date',
                    field: 'createddate',
                    sort: 'asc',
                    width: 150
                },
                {
                    label: 'Reply',
                    field: 'action',
                    sort: 'asc',
                    width: 1000
                }
            ],
            rows: this.values
            },
            gobeardata: {
                columns: [
                {
                    label: 'Ticket ID',
                    field: 'ticketmaskid',
                    sort: 'asc',
                    width: 150
                },
                {
                    label: 'Subject',
                    field: 'subject',
                    sort: 'asc',
                    width: 1000
                },
                {
                    label: 'Priority',
                    field: 'priority',
                    sort: 'asc',
                    width: 200
                },
                {
                    label: 'Status',
                    field: 'status',
                    sort: 'asc',
                    width: 100
                },
                {
                    label: 'Ticket Type',
                    field: 'type',
                    sort: 'asc',
                    width: 150
                },
                {
                    label: 'Issue Type',
                    field: 'issue_type',
                    sort: 'asc',
                    width: 200
                },
                {
                    label: 'Category',
                    field: 'category',
                    sort: 'asc',
                    width: 100
                },
                {
                    label: 'Requestor Division',
                    field: 'req_devision',
                    sort: 'asc',
                    width: 150
                },
                {
                    label: 'Business Unit',
                    field: 'bu_unit',
                    sort: 'asc',
                    width: 150
                },
                {
                    label: 'Created Date',
                    field: 'createddate',
                    sort: 'asc',
                    width: 150
                },
                {
                    label: 'Reply',
                    field: 'action',
                    sort: 'asc',
                    width: 1000
                }
            ],
            rows: this.values
            }
        };
        this.replyTicket = this.replyTicket.bind(this);
    }

    handleFiles = (files) => {

        files.base64.map((base64, i) => {
            return this.state.files.temp_name.push(base64.split(',')[1]);
        });

        Object.values(files.fileList).map((file) => {
            return this.state.files.name.push(file.name);
        });

        this.setState({
            fileName: this.state.files.name.join(', ')
        });

    }

    replyTicket = e => {
        e.preventDefault();  
        var form = document.querySelector("#ticketReplyFrm");
        var formData = serialize(form, { hash: true });
        var post = { files: this.state.files }
        this.props.dispatch(supportActions.replyTicket(formData, post));

        //this.setState({ sweetalert: null });
        //this.closeModal();
      }
    openModalTicketView(item) {//rfcno
        this.setState({ ticketDetail: item });
        this.setState({ modalIsOpen: true });
        this.props.dispatch(supportActions.getTicketDetail(item.rfcno));
    }
    closeModal() {
        this.setState({ modalIsOpen: false });
    } 
    render() {
        const {ticket, tickets}=this.props;
        var clientId = JSON.parse(localStorage.getItem("user")).data.clientid ;
        var gobearId = JSON.parse(localStorage.getItem("user")).data.GOBEAR_CLIENT_ID;
        const regex = /(<([^>]+)>)/ig;
        return (
            <div className="mb-2 pt-3">
            <Modal
            isOpen={this.state.modalIsOpen}    
            onRequestClose={this.closeModal}
            contentLabel="Ticket Detail" className="metrics">
            <h2 style={{color:'red'}}>
            Ticket Details:: {tickets.detail && tickets.detail.ticketmaskid} <a className="float-right" href="javascript:void(0);" onClick={this.closeModal}><i className="fa fa-times" /></a>
            </h2>
            <div className="row mb-2">
            <div className="col-md-6">
            <strong>Subject:</strong> {tickets.detail && tickets.detail.subject}
            </div>
            <div className="col-md-3">
            <strong>Status:</strong> {tickets.detail && tickets.detail.statustitle}
            </div>
            <div className="col-md-3">
            <strong>Priority:</strong> {tickets.detail && tickets.detail.prioritytitle}
            </div>
            </div>
            {clientId == gobearId ?
            <div className="row mb-2">                
            {/* <div className="col-md-2">          
            <strong>Ticket Type:</strong> {tickets.detail && tickets.detail.tickettypetitle}
            </div> */}
            <div className="col-md-4">
            <strong>Issue Type:</strong> {tickets.detail && tickets.detail.issue_type}
            </div>
            <div className="col-md-2">
            <strong>Category:</strong> {tickets.detail && tickets.detail.category}
            </div>
            <div className="col-md-3">
            <strong>Requestor Division:</strong> {tickets.detail && tickets.detail.req_devision}
            </div>
            <div className="col-md-3">
            <strong>Business Unit:</strong> {tickets.detail && tickets.detail.bu_unit}
            </div>
            </div> :""}
            {tickets.detail && 
            <div className="table-responsive">
            <div className="col-md-12 ticket_box" >
                <div className="col-md-3 float-left"><i className="fa fa-paperclip small"></i><strong>Document Attachments:</strong></div>
                <div className="col-md-9 float-right">
                    {tickets.detail.document_attachment && tickets.detail.document_attachment.map((attach,index)=>
                    <a href={`${attach.attachment_path}`} key={index+1} className="btn btn-sm btn-link" download>{attach.display}</a> 
                    )}
                </div>
            </div>
            {tickets.detail && tickets.detail.emailcontent.map((tkt,index)=>
                <div className="col-md-12 ticket_box" key={index+1}>
                    <div className="col-md-3 float-left fullname"><i className="fa fa-user"></i> {tkt.fullname}</div>
                    <div className="col-md-9 float-right box_left_border">
                    <p className="small ptop">Posted On: <Moment format="YYYY-MM-DD hh:mm A">{tkt.cdate}</Moment></p>
                    <p className="color-white">{nl2br(utf8.decode(tkt.contents).replace(regex, ''))}</p>
                    <br/>
                    <p className="small pbottom">To Emails: {tkt.toemail} <br/>
                    CC Emails: {tkt.ccemail}
                    </p>
                    </div>
                </div>
                )}
                {tickets.detail && tickets.detail.statustitle!='Closed' && 
                <form name="ticketReplyFrm" id="ticketReplyFrm" method="post" onSubmit={this.replyTicket} >
                <div className="col-md-12 ticket_box">
                    <div className="col-md-3 float-left fullname"><i className="fa fa-user"></i> {this.state.user.username}</div>
                    <div className="col-md-9 float-right box_left_border">
                    <textarea name="content_email" placeholder="Reply here..." className="form-control" rows="10"></textarea>
                    {false && <div className="col-md-12 p-0 pbottom">
                        <input type="file" name="attachments[]" className="col-md-9 p-0 pbottom"/><a href="javascript:void(0)" className="btn btn-sm btn-info float-right">Add More Attachment</a>
                    </div>
                    }<br/>
                    <div className="col-md-12 p-0 pbottom">
                        <input type="hidden" name="rfcno" value={`${tickets.detail.rfcno}`} />
                        <input type="hidden" name="to_email" value={`${tickets.detail.replyto}`}/>
                        <input type="hidden" name="fromemail" value={`${this.state.user.email}`}/>
                        <input type="hidden" name="clientid" value={`${this.state.user.clientid}`}/>
                      
                        <React.Fragment>
                        <ReactFileReader fileTypes={["*"]} base64={true} multipleFiles={true} handleFiles={this.handleFiles} id="file_contents" name="file_contents">
                                                    <div className='btn btn-sm btn-primary '>Upload</div>
                                                </ReactFileReader>
                                                {this.state.fileName ? <span className='mr-2'>{this.state.fileName}</span> : ""}
                                                </React.Fragment>
                                                

                        <button className="btn btn-sm btn-primary float-right mt-1">
                            {tickets.submitLoading && 
                                <i className="fas fa-circle-notch icon-loading"></i>
                            }
                            Reply
                        </button>
                    </div>
                    </div>
                </div>
                </form>
                }
            </div>
            }
            </Modal>
         
            {clientId != gobearId ?
             <MDBDataTable
             striped
             hover
             data={this.state.data}
             />:
            <MDBDataTable
            striped
            hover
            data={this.state.gobeardata}
            />}
            </div>
        );
        }
    }
    function mapStateToProps(state) {
        const { tickets } = state;
        return {
            // ticket:tickets.detail,
            tickets : tickets
        };
      }
      
    export default connect(mapStateToProps)(DatatablePage);
