import { ostemplatesConstants } from '../_constants';
import { ostemplatesService } from '../_services';
import { alertActions } from './';
import { history } from '../_helpers';

export const ostemplatesActions = {
    getAll,
    updateOSstatus
};

function getAll() {
    return dispatch => {
        dispatch(request());

        ostemplatesService.getAll()
            .then(
                ostemplates => dispatch(success(ostemplates)),
                error => dispatch(failure(error.toString()))
            );
    };

    function request() { return { type: ostemplatesConstants.GETALL_REQUEST } }
    function success(ostemplates) { return { type: ostemplatesConstants.GETALL_SUCCESS, ostemplates } }
    function failure(error) { return { type: ostemplatesConstants.GETALL_FAILURE, error } }
}


function updateOSstatus(ostempdata) {     
    return dispatch => {
        dispatch(request(ostempdata));
        ostemplatesService.update(ostempdata)
            .then(
                ostempdata => { 
                    dispatch(success());
                    // history.push('/ostemplates');
                    dispatch(alertActions.success('OS Template Updated successful'));
                    dispatch(getAll());
                },
                error => {
                    dispatch(failure(error.toString()));
                    dispatch(alertActions.error(error.toString()));
                }
            );
    };

    function request(ostempdata) { return { type: ostemplatesConstants.UPDATEOS_REQUEST, ostempdata } }
    function success(ostempdata) { return { type: ostemplatesConstants.UPDATEOS_SUCCESS, ostempdata } }
    function failure(error) { return { type: ostemplatesConstants.UPDATEOS_FAILURE, error } }
}
