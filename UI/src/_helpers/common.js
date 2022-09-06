import {decryptResponse} from "../_helpers";
var currency_symbols = {
    'USD': '$', // US Dollar
    'EUR': '€', // Euro
    'CRC': '₡', // Costa Rican Colón
    'GBP': '£', // British Pound Sterling
    'ILS': '₪', // Israeli New Sheqel
    'INR': '₹', // Indian Rupee
    'JPY': '¥', // Japanese Yen
    'KRW': '₩', // South Korean Won
    'NGN': '₦', // Nigerian Naira
    'PHP': '₱', // Philippine Peso
    'PLN': 'zł', // Polish Zloty
    'PYG': '₲', // Paraguayan Guarani
    'THB': '฿', // Thai Baht
    'UAH': '₴', // Ukrainian Hryvnia
    'VND': '₫', // Vietnamese Dong
};

export var commonFns = {
    fnFormatCurrency(val, currency, avoidValue) {
        let user = JSON.parse(localStorage.getItem("user"));
        let userCurrencyCode = (user && user.data && user.data.currency_code ? user.data.currency_code : "INR");

        //if(currency_symbols[userCurrencyCode]!==undefined) {
        //  alert(currency_symbols[userCurrencyCode]);
        //}

        //Reference Links
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
        //https://stackoverflow.com/questions/19373860/convert-currency-names-to-currency-symbol
        //https://stackoverflow.com/questions/149055/how-to-format-numbers-as-currency-string
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: (currency ? currency : userCurrencyCode),
            minimumFractionDigits: 2
        });

        if (!val)
            val = 0;

        val = formatter.format(val);

        if (!avoidValue) {
            return val.slice(0, 1) + " " + val.slice(1);
        }
        else {
            return val.slice(0, 1)
        }
    },
    menuUrls: {
        newVMInstance: "/#/newVMInstance",
        cloud4c: "/#/cloud4c",
        azure: "/#/azure",
        AzureNewVMInstance: "/#/AzureNewVMInstance",
        azureResourceGroups: "/#/azureResourceGroups",
        GcpVmList: "/#/GcpVmList",
        monitoringdashboard: "/#/monitoringdashboard",
        users: "/#/users",
        resourceGroupUsers: "/#/resource-group-users",
        // roles: "/#/roles",
        // assignUsers: "/#/assign-users",
        aws: "/#/aws",
        myticket: "/#/myticket",
        documents: "/#/Documents",
        billingDashboard: "/#/billingDashboard",
        awsVolumeList: "/#/awsVolumeList",
        GcpDiskList: "/#/GcpDiskList",
        billingTransactions: "/#/billingTransactions",
        ManageProfile: "/#/ManageProfile",
        billingInvoices: "/#/billingInvoices",
        viewCart: "/#/viewCart",
        billingPayments: "/#/billingPayments",
        AwsNewVMInstance: "/#/AwsNewVMInstance",
        GcpNetworkList: "/#/GcpNetworkList",
        awsVPCList: "/#/awsVPCList",
        azureDiskList: "/#/azureDiskList",
        azurenetwork: "/#/azurenetwork",
        awsSubnetList: "/#/awsSubnetList",
        GcpNewVMInstance: "/#/GcpNewVMInstance",
        GcpSubnetList: "/#/GcpSubnetList",
        awsNICList: "/#/awsNICList",
        azureIpList: "/#/azureIpList",
        AwsManagePolicy: "/#/AwsManagePolicy",
        AwsManageUsers: "/#/AwsManageUsers",
        awsCostForecast: "/#/aws-cost-forecast",
        awsUsageForecast: "/#/aws-usage-forecast",
        awsRepoList: "/#/aws-repository-list",
        awsRepoFileList: "/#/aws-repository-list/:repo_id",
        awsRepoFileContent: "/#/aws-repository-list/:repo_id/file/:file_id",
        azureRepoList: "/#/azure-repository-list",
        azureRepoFileList: "/#/azure-repository-list/:repo_id",
        gcpRepoList: "/#/gcp-repository-list",
        awsBillingReport: "/#/aws-billing-report",
        azureBillingReport: "/#/azure-billing-report",
        gcpBillingReport: "/#/gcp-billing-report",
        awsPipelineList: "/#/aws-pipeline-list",
        awsPipelineExecutionHistoryList: "/#/aws-pipeline-list/:pipeline_id/execution/history",
        azurePipelineList: "/#/azure-pipeline-list",
        azurePipelineRunList: "/#/gcp-pipeline-list/:pipeline_id/run",
        gcpPipelineList: "/#/gcp-pipeline-list",
        profileList: "/#/profile"
    },
    vmOperations: {
        Cloud4c: 1,
        Cloud4cOperations: {
            Reboot: 'CLOUD4C_REBOOT',
            OnOff: 'CLOUD4C_ON_OFF',
            Terminate: 'CLOUD4C_TERMINATE',
            Resize: 'CLOUD4C_RESIZE',
            History: 'CLOUD4C_HISTORY'
        },
        Azure: 2,
        AzureOperations: {
            Reboot: 'AZURE_REBOOT',
            OnOff: 'AZURE_ON_OFF',
            Terminate: 'AZURE_TERMINATE',
            Resize: 'AZURE_RESIZE',
            History: 'AZURE_HISTORY'
        },
        Aws: 3,
        AwsOperations: {
            Reboot: 'AWS_REBOOT',
            ONOFF: 'AWS_ON_OFF',
            Terminate: 'AWS_TERMINATE',
            Resize: 'AWS_RESIZE',
            History: 'AWS_HISTORY'
        },
        Gcp: 4,
        GcpOperations: {
            Reboot: 'GCP_REBOOT',
            ONOFF: 'GCP_ON_OFF',
            Terminate: 'GCP_TERMINATE',
            Resize: 'GCP_RESIZE',
            History: 'GCP_HISTORY'
        },
        Dashboard: 5
    },
    fnCheckManagerRole() {
        let user = decryptResponse(
            localStorage.getItem("user")),
            {resource_groups, isSuperAdmin} = user.data || {},
            is_manager = false;
        
        try {
            resource_groups.map(resource => {
                if (resource.role_id === 3) {
                    is_manager = true
                }
                return resource;
            });
        }
        catch(e) {
            localStorage.clear();
        }
        return is_manager || isSuperAdmin;
    },
    fnCheckPageAuth(url, mode) {
        //UnComment to Enable Profile Template
        return true;
        let userData = localStorage.getItem("user");
        userData = JSON.parse(userData);


        let menu_list = userData.data.profile.menuInfo;

        let result = false;
        if (userData) {
            url = (url ? url.toLowerCase() : "");

            if (userData.data.user_role == 1) {
                result = true;
            }
            else {
                for (let i = 0; i < menu_list.length; i++) {
                    if (menu_list[i].url && menu_list[i].url.toLowerCase() == url) {
                        result = true;
                        break;
                    }
                }
            }
        }

        if (result)
            return true;

        return false;
    },
    fnCheckVMOperationsRole(role, permission) {
        let user = JSON.parse(localStorage.getItem("user")),
            permissions = {},
            roles = (user.data.roles || []).map(role => {
                let module_name = (role.module_name || '').toLowerCase();

                permissions[module_name] = {
                    ...role
                }
            }),
            { access = {}, dashboard = {}, manage = {}, order = {}, support = {} } = permissions;

        return permissions[role][permission]
    },
    fnCheckVMOperationsAuth(profiles, event) {
        if (profiles
            && profiles.userProfileMenu
            && profiles.userProfileMenu.data
            && profiles.userProfileMenu.data.vm_operations
            && profiles.userProfileMenu.data.vm_operations.length
            && profiles.userProfileMenu.data.vm_operations_obj[event]) {
            return true;
        }
        return true;
    },
    fnCheckAccessForVms(vmId) {
        let userData = localStorage.getItem("user");
        userData = JSON.parse(userData);

        if (vmId == this.vmOperations.Azure) {
            return userData.data.azure_linked == 1 ? true : false;
        }
        else if (vmId == this.vmOperations.Aws) {
            return userData.data.is_aws_enabled == 1 ? true : false;
        }
        else if (vmId == this.vmOperations.Gcp) {
            return userData.data.is_gcp_enabled == 1 ? true : false;
        }
    },
    fnGenerateString(reqObj){
    	console.log("reqObj ---- ", reqObj);
    	let length = ((reqObj.passwordMinLength)?reqObj.passwordMinLength:8);
        let characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let string = '';
        if(reqObj.passwordPolicy && reqObj.passwordPolicy.length > 0){
        	for (let i = 0; i < reqObj.passwordPolicy.length; i++) {
        		if(reqObj.passwordPolicy[i].characters && reqObj.passwordPolicy[i].minLength){
	        		for (let j = 0; j < reqObj.passwordPolicy[i].minLength; j++) {
	        			string += reqObj.passwordPolicy[i].characters[Math.floor(Math.random() * reqObj.passwordPolicy[i].characters.length)];
	        		}
        		}
            }
        }
        console.log("string.length ---- ", string.length);
        for (let i = string.length; i < length; i++) {
            string += characters[Math.floor(Math.random() * 62)];
        }
    	return string;
    },
    fnDynamicArrayOfObjectsSort(property) {
        var sortOrder = 1;
        if(property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }
        return function (a,b) {
            /* next line works with strings and numbers, 
             * and you may want to customize it to your needs
             */
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder;
        }
    },
    fnDeepCompareObjects (arg1, arg2) {
    	let self = this;
	  if (Object.prototype.toString.call(arg1) === Object.prototype.toString.call(arg2)){
	    if (Object.prototype.toString.call(arg1) === '[object Object]' || Object.prototype.toString.call(arg1) === '[object Array]' ){
	      if (Object.keys(arg1).length !== Object.keys(arg2).length ){
	        return false;
	      }
	      return (Object.keys(arg1).every(function(key){
	        return self.fnDeepCompareObjects(arg1[key],arg2[key]);
	      }));
	    }
	    return (arg1===arg2);
	  }
	  return false;
	}
}
