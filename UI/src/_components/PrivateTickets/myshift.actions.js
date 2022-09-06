import { supportConstants } from './myshift.constants';
import { supportService } from './myshift.services';
import { alertActions } from '../../_actions';
import { history } from '../../_helpers';
import { toast } from 'react-toastify';

export const supportActions = {
    getAll,getTicketDetail,replyTicket,createTicket,getTicketFormData,getAllMyTicket
};

function getAll(clientid) {
    return dispatch => {
        dispatch(request());
        supportService.getAll(clientid)
            .then(
                tickets => dispatch(success(tickets)),
                error => dispatch(failure(error.toString()))
            );
    };

    function request() { return { type: supportConstants.SUPPORT_GETALL_REQUEST } }

    function success(tickets) { return { type: supportConstants.SUPPORT_GETALL_SUCCESS, tickets } }
    
    function failure(error) { return { type: supportConstants.SUPPORT_GETALL_FAILURE, error } }
}
function getAllMyTicket(clientid) {
  return dispatch => {
      dispatch(request());
      supportService.getAllMyTicket(clientid)
          .then(
              tickets => dispatch(success(tickets)),
              error => dispatch(failure(error.toString()))
          );
  };

  function request() { return { type: supportConstants.MYTICKET_GETALL_REQUEST } }

  function success(tickets) { return { type: supportConstants.MYTICKET_GETALL_SUCCESS, tickets } }
  
  function failure(error) { return { type: supportConstants.MYTICKET_GETALL_FAILURE, error } }
}

function getTicketFormData(clientid) {
  return dispatch => {
      dispatch(request());
      supportService.getTicketFormData(clientid)
          .then(
            configdata => dispatch(success(configdata)),
              error => dispatch(failure(error.toString()))
          );
  };

  function request() { return { type: supportConstants.SUPPORT_FORMDATA_REQUEST } }

  function success(configdata) { return { type: supportConstants.SUPPORT_FORMDATA_SUCCESS, configdata } }
  
  function failure(error) { return { type: supportConstants.SUPPORT_FORMDATA_FAILURE, error } }
}

function getTicketDetail(ticketid) {
  return dispatch => {
      dispatch(request());
      supportService.getTicketDetail(ticketid)
          .then(
            tktDetail => dispatch(success(tktDetail)),
            error => dispatch(failure(error.toString()))
          );
  };

  function request() { return { type: supportConstants.SUPPORT_TICKET_REQUEST } }

  function success(tktDetail) { return { type: supportConstants.SUPPORT_TICKET_SUCCESS, tktDetail } }
  
  function failure(error) { return { type: supportConstants.SUPPORT_TICKET_FAILURE, error } }
}
function replyTicket(formData){
    return dispatch => {
        dispatch(request(formData));
        supportService.replyTicket(formData).then(
          resdata => {
            dispatch(success(resdata));
            if(resdata.success == false){          
              toast.error(resdata.message);
              //dispatch(getAll(formData.clientid));
            } else {          
              toast.success(resdata.message);
              //dispatch(getAll(formData.clientid));
              setTimeout(function() {
                //dispatch(getAll(post.clientid));
                location.reload(true);
              }, 2000);
            }
          },
          error => {
            failure(error.toString()),
            toast.error(error.toString());
            dispatch(getAll(formData.clientid));
          }
        );
    }
    function request(formData) {
      return { type: supportConstants.SUPPORT_ADDTICKET_REQUEST, formData };
    }
    function success(resdata) {
      return { type: supportConstants.SUPPORT_ADDTICKET_SUCCESS, resdata };
    }
    function failure(error) {
      return { type: supportConstants.SUPPORT_ADDTICKET_FAILURE, error };
    }
}
function createTicket(formData,post){
  return dispatch => {
      dispatch(request(formData));
      supportService.createTicket(formData,post).then(
        resdata => {
          dispatch(success(resdata));
          if(resdata.success == true){   
            toast.success(resdata.message);  
            setTimeout(function() {
              //dispatch(getAll(post.clientid));
              location.reload(true);
            }, 2000);
          } else {          
            toast.error('The operation did not execute as expected. Please raise a ticket to support');
            // setTimeout(function() {
            //   dispatch(getAll(post.clientid));
            // }, 2000);
          }
        },
        error => {
          failure(error.toString()),
          toast.error('The operation did not execute as expected. Please raise a ticket to support');
          dispatch(getAll(post.clientid));
        }
      );
  }

  function request(formData) {
    return { type: supportConstants.createTicket_REQUEST, formData };
  }
  function success(resdata) {
    return { type: supportConstants.createTicket_SUCCESS, resdata };
  }
  function failure(error) {
    return { type: supportConstants.createTicket_FAILURE, error };
  }
}

