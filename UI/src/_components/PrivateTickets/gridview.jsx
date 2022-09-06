import React from 'react';
import { connect } from 'react-redux';
import Modal from "react-modal";
import { supportActions } from './myshift.actions';
import { MDBDataTable } from 'mdbreact';
import nl2br from "react-newline-to-break";
import utf8 from 'utf8';
import Moment from 'react-moment';
var serialize = require("form-serialize");

Modal.setAppElement("#app");
class DatatablePage extends React.Component {
    constructor(props) {
        super(props);
        this.openModalTicketView = this.openModalTicketView.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.values=[];
        this.props.tickets.map((ticket, index) =>{
            this.values[index]={
                ticketmaskid:ticket.ticketmaskid,
                subject:ticket.subject,
                priority:ticket.priority,
                status:ticket.status,
                type:ticket.type,
                createddate:ticket.createddate,
                action:<a href="/#/ticketlist" onClick={() => this.openModalTicketView(ticket)}><i className="fas fa-reply"></i> </a>
            }
        })
        let user = JSON.parse(localStorage.getItem("user"));
        this.state = {
            user:user.data,
            ticketDetail:[],
            modalIsOpen:false,
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
            }
        };
        this.replyTicket = this.replyTicket.bind(this);
    }
    replyTicket = e => {
        e.preventDefault();  
        var form = document.querySelector("#ticketReplyFrm");
        var formData = serialize(form, { hash: true });
        this.props.dispatch(supportActions.replyTicket(formData));
        this.setState({ sweetalert: null });
        this.closeModal();
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
        const {ticket}=this.props;
        const regex = /(<([^>]+)>)/ig;
        return (
            <div className="mb-2 pt-3">
            <Modal
            isOpen={this.state.modalIsOpen}    
            onRequestClose={this.closeModal}
            contentLabel="Ticket Detail" className="metrics">
            <h2 style={{color:'red'}}>
            Ticket Details:: {ticket && ticket.ticketmaskid} <a className="float-right" href="/#/ticketlist" onClick={this.closeModal}><i className="fa fa-times" /></a>
            </h2>
            <div className="row mb-2">
            <div className="col-md-8">
            <strong>Subject:</strong> {ticket && ticket.subject}
            </div>
            <div className="col-md-2">
            <strong>Status:</strong> {ticket && ticket.statustitle}
            </div>
            <div className="col-md-2">
            <strong>Priority:</strong> {ticket && ticket.prioritytitle}
            </div>
            </div>
            {ticket && 
            <div className="table-responsive">
            <div className="col-md-12 ticket_box" >
                <div className="col-md-3 float-left"><i className="fa fa-paperclip small"></i><strong>Document Attachments:</strong></div>
                <div className="col-md-9 float-right">
                    {ticket.document_attachment && ticket.document_attachment.map((attach,index)=>
                    <a href={`${attach.attachment_path}`} key={index+1} className="btn btn-sm btn-link" target="_blank">{attach.display}</a> 
                    )}
                </div>
            </div>
            {ticket && ticket.emailcontent.map((tkt,index)=>
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
                {ticket && ticket.statustitle!='Closed' && 
                <form name="ticketReplyFrm" id="ticketReplyFrm" method="post" onSubmit={this.replyTicket} >
                <div className="col-md-12 ticket_box">
                    <div className="col-md-3 float-left fullname"><i className="fa fa-user"></i> {this.state.user.username}</div>
                    <div className="col-md-9 float-right box_left_border">
                    <textarea name="content_email" placeholder="Reply here..." className="form-control" rows="10"></textarea>
                    {false && <div className="col-md-12 p-0 pbottom">
                        <input type="file" name="attachments[]" className="col-md-9 p-0 pbottom"/><a href="/#/ticketlist" className="btn btn-sm btn-info float-right">Add More Attachment</a>
                    </div>
                    }<br/>
                    <div className="col-md-12 p-0 pbottom">
                        <input type="hidden" name="rfcno" value={`${ticket.rfcno}`} />
                        <input type="hidden" name="to_email" value={`${ticket.replyto}`}/>
                        <input type="hidden" name="fromemail" value={`${this.state.user.email}`}/>
                        <input type="hidden" name="clientid" value={`${this.state.user.clientid}`}/>
                        <button className="btn btn-sm btn-primary float-right mt-1">Reply</button>
                    </div>
                    </div>
                </div>
                </form>
                }
            </div>
            }
            </Modal>
            
            <MDBDataTable
            striped
            hover
            data={this.state.data}
            />
            </div>
        );
        }
    }
    function mapStateToProps(state) {
        const { myshift } = state;
        return {
            ticket:myshift.detail
        };
      }
      
    export default connect(mapStateToProps)(DatatablePage);
