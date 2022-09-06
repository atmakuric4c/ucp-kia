import { billingConstants } from '../_constants';

export function billingCommon(state = {}, action) {
 
    switch (action.type) {
        
        case billingConstants.BUDGET_REPORT_REQUEST:
            return {
            ...state,
            loading: true
            };
        case billingConstants.BUDGET_REPORT_SUCCESS:
            let budgetAlert;
        
            if(action.budgetAlerts.cloudName === 'Azure'){
            budgetAlert = { azurebudgetAlerts: action.budgetAlerts.alert };
            }
            else if(action.budgetAlerts.cloudName === 'AWS'){
            budgetAlert = { awsbudgetAlerts: action.budgetAlerts.alert };
            }
            else if(action.budgetAlerts.cloudName === 'GCP'){
            budgetAlert = { gcpbudgetAlerts: action.budgetAlerts.alert };
            }
            return {
            ...state,
            loading:false,
            ...budgetAlert,
            showBudgetModal: false
            };
        case billingConstants.BUDGET_REPORT_UPDATE_FAILURE:
            return { 
            ...state
            };
        case billingConstants.BUDGET_REPORT_UPDATE_REQUEST:
            return {
            ...state,
            loading: true
            };
        case billingConstants.BUDGET_REPORT_UPDATE_SUCCESS:
        
            return {
            ...state
            };
        case billingConstants.BUDGET_REPORT_UPDATE_FAILURE:
            return { 
            ...state
            };
        case billingConstants.BUDGET_REPORT_UPDATE_MODAL:
        return { 
            ...state,
            showBudgetModal: action.value
        };
        case billingConstants.AWS_BILLING_REPORT_REQUEST:
            return {
            ...state,
            loading: true
            };
        case billingConstants.AWS_BILLING_REPORT_SUCCESS:
            return {
            ...state,
            loading:false,
            awsReports: action.reports
            };
        case billingConstants.AWS_BILLING_REPORT_FAILURE:
            return { 
            ...state,
            loading:false
            };
        case billingConstants.AZURE_BILLING_REPORT_REQUEST:
            return {
                ...state,
                loading: true
            };
        case billingConstants.AZURE_BILLING_REPORT_SUCCESS:
            return {
                ...state,
                loading:false,
                azureReports: action.reports
            };
        case billingConstants.AZURE_BILLING_REPORT_FAILURE:
            return { 
                ...state,
                loading:false
            };
        
        case billingConstants.GCP_BILLING_REPORT_REQUEST:
            return {
                ...state,
                loading: true
            };
        case billingConstants.GCP_BILLING_REPORT_SUCCESS:
            return {
                ...state,
                loading:false,
                gcpReports: action.reports
            };
        case billingConstants.GCP_BILLING_REPORT_FAILURE:
            return { 
                ...state,
                loading:false
            };

        default:
            return state

    }
}