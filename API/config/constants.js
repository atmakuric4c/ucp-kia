var path = require('path');
const env = require('./env');

let configData = {
    AUTHKEY:'e10adc3949ba59abbe56e057f20f883e',
    AUTHKEY2:'4632d0b1cb653959b4ad75361aabf97c',
	AUTHKEY3:'MYS@123',
    TICKETLIST:'https://api.ctrls.in/core_api/api.php/?x=myshiftorgtickets_cloud_api',   //org id 100245
    CLIENTTICKET:'https://api.ctrls.in/core_api_myshift/api.php/?x=get_ticketdetails_useremail_api&email=',
    TICKETDETAIL:'https://api.ctrls.in/core_api_myshift/api.php/?x=get_ticketdetailslist_ticketid&ticketid=',
    TICKETREPLY  :'https://api.ctrls.in/index.php/api/ticket_reply_communication/replyticket',
    TICKETCREATE:'https://api.ctrls.in/index.php/api/ticket/createopfticket',
    PRIORITY_TICKET:'https://api.ctrls.in/index.php/api/getcustomer_priority/getdata?orgid=',
    TICKET_TYPE_LIST:'https://api.ctrls.in/index.php/api/tickettypedetails/getdata',
    KFINTECH_SLATICKET:'https://api.ctrls.in/index.php/api/getk_fintechInfo/data?',
	KFINTECH_ALERT:`https://api.ctrls.in/index.php/api/admin_form/kfintech_organizationticketDetails?org_id=`,
//    PRIORITIES:[{id:618,priority:'P3'},{id:612,priority:'P2'},{id:606,priority:'P1'}],
    PRIORITIES:[{id:7,priority:'P1 Critical'},{id:8,priority:'P2 High'},{id:9,priority:'P3 Normal'}],
//    DEPARTMENT_ID:223,
//    GOBEAR_DEPARTMENT_ID:2259,
    GOBEAR_CLIENT_ID:14057,
//    VODAFONE_DEPARTMENT_ID:1105,
    VODAFONE_CLIENT_ID:14710,
    APCPDCL_CLIENT_ID:14709,
    DEMO_CLIENT_ID:222,
//    CTRLS_DEPARTMENT_ID:1105,
    TICKET_TYPE:1,
    DEFAULT_TICKET_TYPE_AND_PRIORITIES : {
    	TICKET_TYPE_ID :15,
    	TICKET_TYPE_NAME : 'INCIDENT',
    	PRIORITIES : [{id:7,priority:'P1 Critical'},{id:8,priority:'P2 High'},{id:9,priority:'P3 Normal'}]
    },
	SERVICE_REQUEST_TICKET_TYPE_AND_PRIORITIES : {
		TICKET_TYPE_ID :17,
		TICKET_TYPE_NAME : 'Service Request',
		PRIORITIES : [{id:10,priority:'P1 Critical'},{id:11,priority:'P2 High'},{id:12,priority:'P3 Normal'}],
//		PRIORITIES : [{id:5104,priority:'TakeYourTime'},{id:5097,priority:'Prompt'},{id:5083,priority:'Urgent'}]
	},
    TICKETTYPEID:2,
    MYSHIFT_API_DOMAIN : "https://api.ctrls.in/",

    //Azure AD url
    tenant_id: 'cd99fef8-1cd3-4a2a-9bdf-15531181d65e',
    grant_type: 'client_credentials',
    client_id: '1d9f6c0f-bde1-4cd8-ba4e-e1879730006c',
    client_secret: 'MUG7Q~d~04PyJ.NdUHUKm1NUdWaYtlIUWO9cr',
    resource: 'https://management.azure.com/',
    azure_ad_url: 'https://graph.microsoft.com/v1.0/',
    azure_ad_login: 'https://login.microsoftonline.com/cd99fef8-1cd3-4a2a-9bdf-15531181d65e/oauth2/token',

}

configData.APIPATH = path.resolve(__dirname + '/../');
configData.ROOTPATH = path.resolve(configData.APIPATH + '/../../');
//configData.REPORTS_PATH = configData.APIPATH + '/reports/';
//configData.REPORTS_PATH = configData.ROOTPATH+'/reports/';
//configData.REPORTS_PATH = '/home/site/API/reports/';
configData.SAMPLE_FILES_PATH = configData.APIPATH + '/sample_files/';

configData.env = env.env;
if(env.env == 'local'){
	configData.DB = {
	     host: "localhost",
	     user: "root",
	     password: "cca6a81d7e7ba2efbkyipMsjUCoTn7TpNpykIA==",
	     database: "ucpdemo",

		mon_host: "182.18.185.120",
		mon_user: "comDB",
		mon_pass: "ecbf4d5bd9af383duisTNu4kkolEXZvpHPW/Jw==",
		mon_db: "ctrls_nagios",
	}
	
    configData.FRONTEND_URL = 'http://localhost:8081/#/';
//	configData.FRONTEND_URL = 'http://localhost:9891/#/';
    configData.CTRLS_FRONTEND_URL = 'http://localhost:8081/#/';
    configData.API_URL = 'http://localhost:9891/';
    
    configData.DISPLAY_ALL_NETWORK_RESOURCES = 1; //1 - Yes, 0 - No
    configData.azureAd = {
		REDIRECT_URI : configData.API_URL+"azure/adRedirect",
//		clientId: "19e4e9e5-4f2e-4c0b-ac1e-812c7b7b557f", // app client id
//        authority: "https://login.microsoftonline.com/a0c56b8c-f051-4f98-90ae-5b0a61eb9497/",//tenant_id
//        clientSecret: "2VM7Q~7DZvn~lGyAdGjfpV47QXue4ztYddciL", // secret key Value
		success_url : "login?loginType=adLogin&azureAdStatus=success",
		error_url : "login?loginType=adLogin&azureAdStatus=error",
		"pvwa_ad_group" : "53245e55-959b-49db-bf62-8ffba466222e"
	};
    
    configData.REPORTS_PATH = configData.APIPATH + '/reports/';
} else if(env.env == 'dev'){
	configData.DB = {
		host: "120.138.9.81",
	    user: "uat",
	    password: "972cc55a303ac5d2PyDx+OaYrqmnmaYYCi80AQ==",
	    database: "dhldb",

		mon_host: "182.18.185.120",
		mon_user: "comDB",
		mon_pass: "ecbf4d5bd9af383duisTNu4kkolEXZvpHPW/Jw==",
		mon_db: "ctrls_nagios",
	}
	
	configData.FRONTEND_URL = 'https://internalucp360.cloud4c.com/#/';
    configData.CTRLS_FRONTEND_URL = 'https://internalucp360.cloud4c.com/#/';
    configData.API_URL = 'https://internalucp360api.cloud4c.com/';
    
    configData.DISPLAY_ALL_NETWORK_RESOURCES = 1; //1 - Yes, 0 - No
    configData.azureAd = {
		REDIRECT_URI : configData.API_URL+"azure/adRedirect",
//		clientId: "19e4e9e5-4f2e-4c0b-ac1e-812c7b7b557f", // app client id
//        authority: "https://login.microsoftonline.com/a0c56b8c-f051-4f98-90ae-5b0a61eb9497/",//tenant_id
//        clientSecret: "2VM7Q~7DZvn~lGyAdGjfpV47QXue4ztYddciL", // secret key Value
		success_url : "login?loginType=adLogin&azureAdStatus=success",
		error_url : "login?loginType=adLogin&azureAdStatus=error",
		"pvwa_ad_group" : "53245e55-959b-49db-bf62-8ffba466222e"
	};
    
    configData.REPORTS_PATH = configData.APIPATH + '/reports/';
} else if(env.env == 'uat'){
	configData.DB = {
		host: "120.138.9.81",
	    user: "uat",
	    password: "972cc55a303ac5d2PyDx+OaYrqmnmaYYCi80AQ==",
	    database: "dhldb",

		mon_host: "182.18.185.120",
		mon_user: "comDB",
		mon_pass: "ecbf4d5bd9af383duisTNu4kkolEXZvpHPW/Jw==",
		mon_db: "ctrls_nagios",
	}
	
	configData.FRONTEND_URL = 'https://internalucp360.cloud4c.com/#/';
    configData.CTRLS_FRONTEND_URL = 'https://internalucp360.cloud4c.com/#/';
    configData.API_URL = 'https://internalucp360api.cloud4c.com/';
    
    configData.DISPLAY_ALL_NETWORK_RESOURCES = 1; //1 - Yes, 0 - No
    configData.azureAd = {
		REDIRECT_URI : configData.API_URL+"azure/adRedirect",
//		clientId: "19e4e9e5-4f2e-4c0b-ac1e-812c7b7b557f", // app client id
//        authority: "https://login.microsoftonline.com/a0c56b8c-f051-4f98-90ae-5b0a61eb9497/",//tenant_id
//        clientSecret: "2VM7Q~7DZvn~lGyAdGjfpV47QXue4ztYddciL", // secret key Value
		success_url : "login?loginType=adLogin&azureAdStatus=success",
		error_url : "login?loginType=adLogin&azureAdStatus=error",
		"pvwa_ad_group" : "53245e55-959b-49db-bf62-8ffba466222e"
	};
    
    configData.REPORTS_PATH = configData.APIPATH + '/reports/';
} else if(env.env == 'dhluat'){
	configData.DB = {
		host: "103.27.86.104",
	    user: "automation",
	    password: "972cc55a303ac5d2PyDx+OaYrqmnmaYYCi80AQ==",
	    database: "dhluatdb",

		mon_host: "182.18.185.120",
		mon_user: "comDB",
		mon_pass: "ecbf4d5bd9af383duisTNu4kkolEXZvpHPW/Jw==",
		mon_db: "ctrls_nagios",
	}
	
	configData.FRONTEND_URL = 'https://dhl-uat.cloud4c.com/#/';
    configData.CTRLS_FRONTEND_URL = 'https://dhl-uat.cloud4c.com/#/';
    configData.API_URL = 'https://dhl-uatapi.cloud4c.com/';
    
    configData.DISPLAY_ALL_NETWORK_RESOURCES = 1; //1 - Yes, 0 - No
    configData.azureAd = {
		REDIRECT_URI : configData.API_URL+"azure/adRedirect",
//		clientId: "19e4e9e5-4f2e-4c0b-ac1e-812c7b7b557f", // app client id
//        authority: "https://login.microsoftonline.com/a0c56b8c-f051-4f98-90ae-5b0a61eb9497/",//tenant_id
//        clientSecret: "2VM7Q~7DZvn~lGyAdGjfpV47QXue4ztYddciL", // secret key Value
		success_url : "login?loginType=adLogin&azureAdStatus=success",
		error_url : "login?loginType=adLogin&azureAdStatus=error",
		"pvwa_ad_group" : "53245e55-959b-49db-bf62-8ffba466222e"
	};
    
    configData.REPORTS_PATH = configData.APIPATH + '/reports/';
} else if(env.env == 'ucpdemo'){
	configData.DB = {
		host: "mssqlucpdemo.mysql.database.azure.com",
	    user: "cloud4cadmin@mssqlucpdemo",
	    password: "d1013506ca2dbfe17NtLeUYpsbDcpHvKlkCBwhG/6itFuYJPDoy/jz0vnSM=",
	    database: "dhldb",

		mon_host: "182.18.185.120",
		mon_user: "comDB",
		mon_pass: "ecbf4d5bd9af383duisTNu4kkolEXZvpHPW/Jw==",
		mon_db: "ctrls_nagios",
	}
	
	configData.FRONTEND_URL = 'https://demoucp.cloud4c.com/#/';
    configData.CTRLS_FRONTEND_URL = 'https://demoucp.cloud4c.com/#/';
    configData.API_URL = 'https://demoucp.cloud4c.com/';
    
    configData.DISPLAY_ALL_NETWORK_RESOURCES = 1; //1 - Yes, 0 - No
    configData.azureAd = {
		REDIRECT_URI : configData.API_URL+"azure/adRedirect",
//		clientId: "1d9f6c0f-bde1-4cd8-ba4e-e1879730006c", // app client id
//        authority: "https://login.microsoftonline.com/cd99fef8-1cd3-4a2a-9bdf-15531181d65e/",//tenant_id
//        clientSecret: "MUG7Q~d~04PyJ.NdUHUKm1NUdWaYtlIUWO9cr", // secret key Value
		success_url : "login?loginType=adLogin&azureAdStatus=success",
		error_url : "login?loginType=adLogin&azureAdStatus=error",
		"pvwa_ad_group" : "922a4a1a-647e-4312-9cc6-57c6dc90c60f"
	};

    configData.REPORTS_PATH = '/home/site/API/reports/';
} else if(env.env == 'dhluatonprem'){
	configData.DB = {
		host: "uatucpmysqlpldnsazr.mysql.database.azure.com",
	    user: "dhladmin@uatucpmysqlpldnsazr",
	    password: "9f3c7e40fcf9b298S3ZBYeQLiZ7Whqbb9zTmRQ==",
	    database: "dhldb",

		mon_host: "182.18.185.120",
		mon_user: "comDB",
		mon_pass: "ecbf4d5bd9af383duisTNu4kkolEXZvpHPW/Jw==",
		mon_db: "ctrls_nagios",
	}
	
	configData.FRONTEND_URL = 'https://uatucp.dhl.com/#/';
    configData.CTRLS_FRONTEND_URL = 'https://uatucp.dhl.com/#/';
    configData.API_URL = 'https://uatucp.dhl.com/';
    
    configData.DISPLAY_ALL_NETWORK_RESOURCES = 0; //1 - Yes, 0 - No
    configData.azureAd = {
		REDIRECT_URI : configData.API_URL+"azure/adRedirect",
//		clientId: "1d9f6c0f-bde1-4cd8-ba4e-e1879730006c", // app client id
//        authority: "https://login.microsoftonline.com/cd99fef8-1cd3-4a2a-9bdf-15531181d65e/",//tenant_id
//        clientSecret: "MUG7Q~d~04PyJ.NdUHUKm1NUdWaYtlIUWO9cr", // secret key Value
		success_url : "login?loginType=adLogin&azureAdStatus=success",
		error_url : "login?loginType=adLogin&azureAdStatus=error",
		"pvwa_ad_group" : "922a4a1a-647e-4312-9cc6-57c6dc90c60f"
	};

    configData.REPORTS_PATH = '/home/site/API/reports/';
}else if(env.env == 'dhlonprem'){
	configData.DB = {
		host: "producpmysqlpldnsazr.mysql.database.azure.com",
	    user: "dhladmin@producpmysqlpldnsazr",
	    password: "e936548bc0faf45fFSjEkyMWF/VhInLgbc6trA==",
	    database: "dhldb",

		mon_host: "182.18.185.120",
		mon_user: "comDB",
		mon_pass: "ecbf4d5bd9af383duisTNu4kkolEXZvpHPW/Jw==",
		mon_db: "ctrls_nagios",
	}
	
	configData.FRONTEND_URL = 'https://ucp.dhl.com/#/';
    configData.CTRLS_FRONTEND_URL = 'https://ucp.dhl.com/#/';
    configData.API_URL = 'https://ucp.dhl.com/';
    
    configData.DISPLAY_ALL_NETWORK_RESOURCES = 0; //1 - Yes, 0 - No
    configData.azureAd = {
		REDIRECT_URI : configData.API_URL+"azure/adRedirect",
//		clientId: "19e4e9e5-4f2e-4c0b-ac1e-812c7b7b557f", // app client id
//        authority: "https://login.microsoftonline.com/a0c56b8c-f051-4f98-90ae-5b0a61eb9497/",//tenant_id
//        clientSecret: "2VM7Q~7DZvn~lGyAdGjfpV47QXue4ztYddciL", // secret key Value
		success_url : "login?loginType=adLogin&azureAdStatus=success",
		error_url : "login?loginType=adLogin&azureAdStatus=error",
		"pvwa_ad_group" : "53245e55-959b-49db-bf62-8ffba466222e"
	};
    
//    configData.REPORTS_PATH = configData.APIPATH + '/reports/';
    configData.REPORTS_PATH = '/home/site/API/reports/';
} else {
	configData.DB = {
		host: "137.59.201.117",
		user: "ctrl4c",
        password: "6233be5490ba59d0VxwH1GWD1NYyGWr90+bRuA==",
        database: "ctrl4c_test",

		mon_host: "182.18.185.120",
		mon_user: "comDB",
		mon_pass: "ecbf4d5bd9af383duisTNu4kkolEXZvpHPW/Jw==",
		mon_db: "ctrls_nagios",
	}
	
    configData.FRONTEND_URL = 'http://localhost:8081/#/';
    configData.CTRLS_FRONTEND_URL = 'http://localhost:8081/#/';
    configData.API_URL = 'http://localhost:9890/';
    
    configData.DISPLAY_ALL_NETWORK_RESOURCES = 1; //1 - Yes, 0 - No
    configData.azureAd = {
		REDIRECT_URI : configData.API_URL+"azure/adRedirect",
//		clientId: "19e4e9e5-4f2e-4c0b-ac1e-812c7b7b557f", // app client id
//        authority: "https://login.microsoftonline.com/a0c56b8c-f051-4f98-90ae-5b0a61eb9497/",//tenant_id
//        clientSecret: "2VM7Q~7DZvn~lGyAdGjfpV47QXue4ztYddciL", // secret key Value
		success_url : "login?loginType=adLogin&azureAdStatus=success",
		error_url : "login?loginType=adLogin&azureAdStatus=error",
		"pvwa_ad_group" : "53245e55-959b-49db-bf62-8ffba466222e"
	};
    
    configData.REPORTS_PATH = configData.APIPATH + '/reports/';
} 

configData.EBS_ACCOUNTID = '';
configData.EBS_SKEY = '';
configData.EBS_MODE = 'LIVE';

configData.APPLICATION_ENV = 'DEMO';

configData.PAYTM_ENVIRONMENT = 'PROD'; // PROD // TEST
//configData.PAYTM_MERCHANT_KEY = ''; //Change this constant's value with Merchant key downloaded from portal
//configData.PAYTM_MERCHANT_MID = ''; //Change this constant's value with MID (Merchant ID) received from Paytm
//configData.PAYTM_MERCHANT_WEBSITE = 'WEB_STAGING'; //Change this constant's value with Website name received from Paytm

configData.PAYTM_MERCHANT_KEY = ''; //Change this constant's value with Merchant key downloaded from portal
configData.PAYTM_MERCHANT_MID = ''; //Change this constant's value with MID (Merchant ID) received from Paytm
configData.PAYTM_MERCHANT_WEBSITE = ''; //Change this constant's value with Website name received from Paytm

configData.PAYTM_DOMAIN = "pguat.paytm.com";
if (configData.PAYTM_ENVIRONMENT == 'PROD' ){
	configData.PAYTM_DOMAIN = 'secure.paytm.in';
}

configData.PAYTM_REFUND_URL = 'https://'+configData.PAYTM_DOMAIN+'/oltp/HANDLER_INTERNAL/REFUND';
configData.PAYTM_STATUS_QUERY_URL = 'https://'+configData.PAYTM_DOMAIN+'/oltp/HANDLER_INTERNAL/TXNSTATUS';
configData.PAYTM_STATUS_QUERY_NEW_URL = 'https://'+configData.PAYTM_DOMAIN+'/oltp/HANDLER_INTERNAL/getTxnStatus';
configData.PAYTM_TXN_URL = 'https://'+configData.PAYTM_DOMAIN+'/oltp-web/processTransaction';
configData.PAYTM_RETURN_TXN_URL = 'api/ebsResponse';

configData.OLDAPP_PORTAL_PATH = path.resolve(configData.ROOTPATH + '/../ctrl4capp/');
configData.OLDAPP_PORTAL_URL = "http://ctrls4capp.localhost/"; //http://uatapp.cloud4c.com/   //'http://devops-ctrls4capp.localhost/'
configData.ADMIN_SECURITY_KEY = '7680881782';
configData.ADMIN_DOMAIN = 'http://admincenter.localhost/';//'http://devops_admincenter.localhost/'; // 'https://uatadmin.cloud4c.com/';
configData.EMAIL_BYPASS = 0;
configData.ZABBX_URL = 'http://182.18.185.120';
configData.ZABBX_KEY='los0lkld1521cf65';

configData.AZURE = {
    cloudid : 3,
    cloud_name : "AZURE",
    vdc_id :42,
    tech_id : 42,
    resource_url : "https://management.azure.com/",
    grant_type : "client_credentials"
};

configData.AWS = {
    cloudid : 4,
    cloud_name : "AWS",
    vdc_id :43,
    tech_id : 43
};

configData.GCP = {
    cloudid : 5,
    cloud_name : "GCP",
    vdc_id :44,
    tech_id : 44,
    gcp_client_id : "534932766114-ncnt9t8g43cnogumvek67bk0marhm3k7.apps.googleusercontent.com",
    gcp_client_secret_key : "LmOQaUXmZrenu1fdO5rGS2Cp",
    gcp_success_url : "?gcpStatus=success",
    gcp_error_url : "?gcpStatus=error",
};

configData.MS_DEVOPS = {
		client_id : "B5685257-52F9-45D1-810A-23047F691E19",
		client_secret : "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Im9PdmN6NU1fN3AtSGpJS2xGWHo5M3VfVjBabyJ9.eyJjaWQiOiJiNTY4NTI1Ny01MmY5LTQ1ZDEtODEwYS0yMzA0N2Y2OTFlMTkiLCJjc2kiOiIxNThmMGYzNi0xZDZmLTRlMzktYjg1NS0wMzQ2ZjVhNDc1NmMiLCJuYW1laWQiOiJlMTcxYTRhMi02MmVjLTZmNzEtOTM2My1hOTkxNGQ0NjI5MTIiLCJpc3MiOiJhcHAudnN0b2tlbi52aXN1YWxzdHVkaW8uY29tIiwiYXVkIjoiYXBwLnZzdG9rZW4udmlzdWFsc3R1ZGlvLmNvbSIsIm5iZiI6MTYxMzAyMzk5MSwiZXhwIjoxNzcwNzkwMzkxfQ.PRbIet7wjE-kjBtWHSbG71_yWLVRE4GczUEnzLf00XEi3mLCQuH1CbzZbdf6wKP6h95FPB3U-v9HtPOb2RLK4s_HXbroK_-8lkGqaqlMQzf-JB3QZ4nCKgPV0B28NJuwbfLo1_R3Anhrqay03nJyCHhx69a1RNii9B3HiSBCBV4LOu1YMypS8uIKmLaLAblay0VcfYZSlkbk3Kq7RridpDqNZxi6qOfs_JnhV207OPgyof6LuJI1AgOip6x6Cch69v7iXqka-jLnePVb3Jvhki1Fnv8j6VRe1-g-vRVmJbJJcyye5KjOBdpqrABkgMHSRxqpMqjzTm02NS496SoiNQ",
		scope : "vso.analytics%20vso.auditlog%20vso.build_execute%20vso.code_full%20vso.code_status%20vso.connected_server%20vso.dashboards_manage%20vso.entitlements%20vso.environment_manage%20vso.extension.data_write%20vso.extension_manage%20vso.gallery_manage%20vso.graph_manage%20vso.identity_manage%20vso.loadtest_write%20vso.machinegroup_manage%20vso.memberentitlementmanagement_write%20vso.notification_diagnostics%20vso.notification_manage%20vso.packaging_manage%20vso.profile_write%20vso.project_manage%20vso.release_manage%20vso.securefiles_manage%20vso.security_manage%20vso.serviceendpoint_manage%20vso.symbols_manage%20vso.taskgroups_manage%20vso.test_write%20vso.threads_full%20vso.tokenadministration%20vso.tokens%20vso.variablegroups_manage%20vso.wiki_write%20vso.work_full",
		redirect_uri : configData.API_URL+"msdevops/msdevopsReturnUrl",
		msdevops_success_url : "?msdevopsStatus=success",
		msdevops_error_url : "?msdevopsStatus=error",
}
configData.Allowed_Domains = [
	configData.FRONTEND_URL.replace("#/", ""),
	configData.ADMIN_DOMAIN
];

configData.IS_TEST_PAYMENT = 1; //1- Test payments, 0 - Non Test payments

configData.CREATE_VM_CLOUD_IDS = "1,2,3,4,5";

configData.WINDOWS_DEVICES=['/dev/sda2','/dev/sdb','/dev/sdc','/dev/sdd','/dev/sde','/dev/sdf','/dev/sdg','/dev/sdh','/dev/xvdd','/dev/xvde','/dev/xvdf']
configData.LINUX_DEVICES=['/dev/sdb','/dev/sdc','/dev/sdd','/dev/sde','/dev/sdf','/dev/sdg','/dev/sdh','/dev/xvda','/dev/xvdb','/dev/xvdd','/dev/xvde']
configData.encKey = '255a6142a394f4952ac32b81398d672e';
configData.dbKey = '46ae424002872e0c01b6f549897526cc';
configData.enable_user_encryption = 1; // 0 - disable encryption, 1 - enable encryption
configData.BILLING_EMAIL_ADDRESS = 'rajesh.ponyaboina@cloud4c.com'; // billing@cloud4c.com
configData.Automation_Email = 'rajesh.ponyaboina@cloud4c.com'; // automation@cloud4c.com
configData.BCC_EMAILS = {0:'rajesh.ponyaboina@cloud4c.com', 1:'pradeepkumar.p@ctrls.in', 2:'haritha@cloud4c.com',3:'naveen.mallepally@cloud4c.com',4:'Naresh.adigoppula@cloud4c.com'};
configData.SMS = {SMSSTRIKER : {
	user : "controls",
	password : "73244888",
	senderid : "CTRLFC",
	messagetype : "1"
}};
configData.GOOGLE_AUTH_NAME = "Local-ucp.cloud4c.com"; // local - Local-ucp.cloud4c.com, uat - UAT-ucp.cloud4c.com, live - ucp.cloud4c.com
configData.COMPANY_ENTITIES = {cloud:'1', ctrls:'2'};
configData.CRAYON = {
    cloudid : 6,
    cloud_name : "CRAYON",
    vdc_id :0,
    tech_id : 0,
    url : "https://api.crayon.com/api/v1/",
};

configData.admincenter_apikey_header = 'cBqk3t4fQ5OR';
configData.ADMIN_ROLE_ID = 1;

configData.allowedVmSizes = ['Standard_D3_v2', 'Standard_D12_v2', 'Standard_D3_v2_Promo', 'Standard_D12_v2_Promo', 'Standard_DS3_v2', 'Standard_DS12_v2', 'Standard_DS13-4_v2', 'Standard_DS14-4_v2', 'Standard_DS3_v2_Promo', 'Standard_DS12_v2_Promo',
    'Standard_DS13-4_v2_Promo', 'Standard_DS14-4_v2_Promo', 'Standard_F4', 'Standard_F4s', 'Standard_D8_v3', 'Standard_D8s_v3', 'Standard_D32-8s_v3', 'Standard_E8_v3', 'Standard_E8s_v3', 'Standard_D3_v2_ABC', 'Standard_D12_v2_ABC', 
    'Standard_F4_ABC', 'Standard_F8s_v2', 'Standard_D4_v2', 'Standard_D13_v2', 'Standard_D4_v2_Promo', 'Standard_D13_v2_Promo', 'Standard_DS4_v2', 'Standard_DS13_v2', 'Standard_DS14-8_v2', 'Standard_DS4_v2_Promo', 'Standard_DS13_v2_Promo',
    'Standard_DS14-8_v2_Promo', 'Standard_F8', 'Standard_F8s', 'Standard_M64-16ms', 'Standard_D16_v3', 'Standard_D16s_v3', 'Standard_D32-16s_v3', 'Standard_D64-16s_v3', 'Standard_E16_v3', 'Standard_E16s_v3', 'Standard_E32-16s_v3', 'Standard_D4_v2_ABC', 
    'Standard_D13_v2_ABC', 'Standard_F8_ABC', 'Standard_F16s_v2', 'Standard_D5_v2', 'Standard_D14_v2', 'Standard_D5_v2_Promo', 'Standard_D14_v2_Promo', 'Standard_DS5_v2', 'Standard_DS14_v2', 'Standard_DS5_v2_Promo', 'Standard_DS14_v2_Promo', 
    'Standard_F16', 'Standard_F16s', 'Standard_M64-32ms', 'Standard_M128-32ms', 'Standard_D32_v3', 'Standard_D32s_v3', 'Standard_D64-32s_v3', 'Standard_E32_v3', 'Standard_E32s_v3', 'Standard_E32-8s_v3', 'Standard_E32-16_v3', 'Standard_D5_v2_ABC', 
    'Standard_D14_v2_ABC', 'Standard_F16_ABC', 'Standard_F32s_v2', 'Standard_D15_v2', 'Standard_D15_v2_Promo', 'Standard_D15_v2_Nested', 'Standard_DS15_v2', 'Standard_DS15_v2_Promo', 'Standard_DS15_v2_Nested', 'Standard_D40_v3', 'Standard_D40s_v3', 
    'Standard_D15_v2_ABC', 'Standard_M64ms', 'Standard_M64s', 'Standard_M128-64ms', 'Standard_D64_v3', 'Standard_D64s_v3', 'Standard_E64_v3', 'Standard_E64s_v3', 'Standard_E64-16s_v3', 'Standard_E64-32s_v3', 'Standard_F64s_v2', 'Standard_F72s_v2', 
    'Standard_M128s', 'Standard_M128ms', 'Standard_L8s_v2', 'Standard_L16s_v2', 'Standard_L32s_v2', 'Standard_L64s_v2', 'SQLGL', 'SQLGLCore', 'Standard_D4_v3', 'Standard_D4s_v3', 'Standard_D2_v2', 'Standard_DS2_v2', 'Standard_E4_v3', 'Standard_E4s_v3', 
    'Standard_F2', 'Standard_F2s', 'Standard_F4s_v2', 'Standard_D11_v2', 'Standard_DS11_v2', 'AZAP_Performance_ComputeV17C', 'AZAP_Performance_ComputeV17C_DDA', 'AZAP_Performance_ComputeV17C_HalfNode', 'Standard_PB6s', 'Standard_PB12s', 'Standard_PB24s', 
    'Standard_L80s_v2', 'Standard_M8ms', 'Standard_M8-4ms', 'Standard_M8-2ms', 'Standard_M16ms', 'Standard_M16-8ms', 'Standard_M16-4ms', 'Standard_M32ms', 'Standard_M32-8ms', 'Standard_M32-16ms', 'Standard_M32ls', 'Standard_M32ts', 'Standard_M64ls', 
    'Standard_E64i_v3', 'Standard_E64is_v3', 'Standard_E4-2s_v3', 'Standard_E8-4s_v3', 'Standard_E8-2s_v3', 'Standard_E16-4s_v3', 'Standard_E16-8s_v3', 'Standard_E20s_v3', 'Standard_E20_v3', 'Standard_D11_v2_Promo', 'Standard_D2_v2_Promo', 
    'Standard_DS11_v2_Promo', 'Standard_DS2_v2_Promo', 'Standard_M208ms_v2', 'Standard_MDB16s', 'Standard_MDB32s', 'Experimental_E64-40s_v3', 'Standard_DS11-1_v2', 'Standard_DS12-1_v2', 'Standard_DS12-2_v2', 'Standard_DS13-2_v2', 'MSODSG5', 
    'Special_CCX_DS13_v2', 'Special_CCX_DS14_v2', 'F2_Flex', 'F4_Flex', 'F8_Flex', 'F16_Flex', 'F32_Flex', 'F64_Flex', 'F2s_Flex', 'F4s_Flex', 'F8s_Flex', 'F16s_Flex', 'F32s_Flex', 'F64s_Flex', 'D2_Flex', 'D4_Flex', 'D8_Flex', 'D16_Flex', 
    'D32_Flex', 'D64_Flex', 'D2s_Flex', 'Standard_D2s_v3', 'Standard_D2s_v4', 'D4s_Flex', 'D8s_Flex', 'D16s_Flex', 'D32s_Flex', 'D64s_Flex', 'E2_Flex', 'E4_Flex', 'E8_Flex', 'E16_Flex', 'E32_Flex', 'E64_Flex', 'E64i_Flex', 'E2s_Flex', 'E4s_Flex', 'E8s_Flex', 'E16s_Flex', 'E32s_Flex', 
    'E64s_Flex', 'E64is_Flex', 'Standard_M416ms_v2', 'Standard_M416s_v2', 'Standard_M208s_v2', 'FCA_E64-52s_v3', 'FCA_E32-28s_v3', 'FCA_E32-26s_v3', 'FCA_E32-24s_v3', 'FCA_E16-14s_v3', 'FCA_E16-12s_v3', 'FCA_E16-10s_v3', 'FCA_E8-6s_v3', 
    'Special_D4_v2', 'D48_Flex', 'D48s_Flex', 'E20_Flex', 'E20s_Flex', 'E48_Flex', 'E48s_Flex', 'F48s_Flex', 'Standard_D48_v3', 'Standard_D48s_v3', 'Standard_E48_v3', 'Standard_E48s_v3', 'Standard_F48s_v2', 'Standard_L48s_v2', 'SQLG5_IaaS', 
    'Standard_M128', 'Standard_M128m', 'Standard_M64', 'Standard_M64m', 'AZAP_Performance_ComputeV17C_12', 'Standard_B12ms', 'Standard_B16ms', 'Standard_B20ms', 'SQLG5-80m', 'AZAP_Performance_ComputeV17C_QuarterNode', 'Standard_DS15i_v2', 
    'Standard_D15i_v2', 'Standard_F72fs_v2', 'AZAP_Performance_ComputeV17B_76', 'Standard_ND40s_v3', 'SQLG5_NP80', 'SQLG6', 'StandardM208msv2', 'SQLG6_IaaS', 'SQLG7_AMD', 'SQLG6_NP2', 'SQLG6_NP4', 'SQLG6_NP8', 'SQLG6_NP16', 'SQLG6_NP24', 
    'SQLG6_NP32', 'SQLG6_NP40', 'SQLG6_NP64', 'SQLG6_NP80', 'SQLG6_NP96', 'SQLG6_NP96s', 'Standard_D4a_v3', 'Standard_D8a_v3', 'Standard_D16a_v3', 'Standard_D32a_v3', 'Standard_D48a_v3', 'Standard_D64a_v3', 'Standard_D96a_v3', 'Standard_D104a_v3', 
    'Standard_D4as_v3', 'Standard_D8as_v3', 'Standard_D16as_v3', 'Standard_D32as_v3', 'Standard_D48as_v3', 'Standard_D64as_v3', 'Standard_D96as_v3', 'Standard_D104as_v3', 'Standard_E4a_v3', 'Standard_E8a_v3', 'Standard_E16a_v3', 'Standard_E32a_v3', 
    'Standard_E48a_v3', 'Standard_E64a_v3', 'Standard_E96a_v3', 'Standard_E104a_v3', 'Standard_E4as_v3', 'Standard_E8as_v3', 'Standard_E16as_v3', 'Standard_E32as_v3', 'Standard_E48as_v3', 'Standard_E64as_v3', 'Standard_E96as_v3', 'Standard_E104as_v3', 
    'SQLG5_NP80s', 'Standard_D4_v4', 'Standard_D8_v4', 'Standard_D16_v4', 'Standard_D32_v4', 'Standard_D48_v4', 'Standard_D64_v4', 'Standard_D4d_v4', 'Standard_D8d_v4', 'Standard_D16d_v4', 'Standard_D32d_v4', 'Standard_D48d_v4', 'Standard_D64d_v4', 
    'Standard_D4s_v4', 'Standard_D8s_v4', 'Standard_D16s_v4', 'Standard_D32s_v4', 'Standard_D48s_v4', 'Standard_D64s_v4', 'Standard_D4ds_v4', 'Standard_D8ds_v4', 'Standard_D16ds_v4', 'Standard_D32ds_v4', 'Standard_D48ds_v4', 'Standard_D64ds_v4', 
    'Standard_E4_v4', 'Standard_E8_v4', 'Standard_E16_v4', 'Standard_E20_v4', 'Standard_E32_v4', 'Standard_E48_v4', 'Standard_E64_v4', 'Standard_E4d_v4', 'Standard_E8d_v4', 'Standard_E16d_v4', 'Standard_E20d_v4', 'Standard_E32d_v4', 'Standard_E48d_v4',
    'Standard_E64d_v4', 'Standard_E4s_v4', 'Standard_E8s_v4', 'Standard_E16s_v4', 'Standard_E20s_v4', 'Standard_E32s_v4', 'Standard_E48s_v4', 'Standard_E64s_v4', 'Standard_E64is_v4', 'Standard_E4ds_v4', 'Standard_E8ds_v4', 'Standard_E16ds_v4', 
    'Standard_E20ds_v4', 'Standard_E32ds_v4', 'Standard_E48ds_v4', 'Standard_E64ds_v4', 'Standard_E64ids_v4', 'Standard_DC2s_v2', 'Standard_DC4s_v2', 'Standard_DC8_v2', 'SQLDCGen6_2', 'AZAP_Performance_ComputeV17W_76', 'AZAP_Performance_ComputeV17B_40', 
    'Standard_D4a_v4', 'Standard_D4as_v4', 'Standard_D8a_v4', 'Standard_D8as_v4', 'Standard_D16a_v4', 'Standard_D16as_v4', 'Standard_D32a_v4', 'Standard_D32as_v4', 'Standard_D48a_v4', 'Standard_D48as_v4', 'Standard_D64a_v4', 'Standard_D64as_v4', 
    'Standard_D96a_v4', 'Standard_D96as_v4', 'Standard_E4a_v4', 'Standard_E4as_v4', 'Standard_E8a_v4', 'Standard_E8as_v4', 'Standard_E16a_v4', 'Standard_E16as_v4', 'Standard_E20a_v4', 'Standard_E20as_v4', 'Standard_E32a_v4', 'Standard_E32as_v4', 
    'Standard_E48a_v4', 'Standard_E48as_v4', 'Standard_E64a_v4', 'Standard_E64as_v4', 'Standard_E96a_v4', 'Standard_E96as_v4', 'Standard_E64is_v4_SPECIAL', 'Standard_E64ids_v4_SPECIAL', 'Standard_E4-2s_v4', 'Standard_E8-2s_v4', 'Standard_E8-4s_v4', 
    'Standard_E16-8s_v4', 'Standard_E16-4s_v4', 'Standard_E32-16s_v4', 'Standard_E32-8s_v4', 'Standard_E64-32s_v4', 'Standard_E64-16s_v4', 'Standard_E4-2ds_v4', 'Standard_E8-4ds_v4', 'Standard_E8-2ds_v4', 'Standard_E16-8ds_v4', 'Standard_E16-4ds_v4', 
    'Standard_E32-16ds_v4', 'Standard_E32-8ds_v4', 'Standard_E64-32ds_v4', 'Standard_E64-16ds_v4', 'SQLG7', 'SQLG7_IaaS', 'SQLG6_NP56', 'Experimental_Olympia20ls', 'Experimental_Olympia20s', 'Experimental_Olympia20ms', 'Experimental_Olympia40ls', 
    'Experimental_Olympia40s', 'Experimental_Olympia40ms', 'Experimental_Olympia72ls', 'Experimental_Olympia72s', 'Experimental_Olympia72ms', 'Standard_E64i_v4_SPECIAL', 'Experimental_OlympiaBTT20ls', 'Experimental_OlympiaBTT20s', 'Experimental_OlympiaBTT20ms', 
    'Experimental_OlympiaBTT40ls', 'Experimental_OlympiaBTT40s', 'Experimental_OlympiaBTT40ms', 'Experimental_OlympiaBTT72ls', 'Experimental_OlympiaBTT72s', 'Experimental_OlympiaBTT72ms', 'SQLG7_NP4', 'SQLG7_NP8', 'SQLG7_NP16', 'SQLG7_NP24', 'SQLG7_NP32', 
    'SQLG7_NP40', 'SQLG7_NP64', 'SQLG7_NP80', 'SQLG7_NP96', 'SQLG7_NP104', 'SQLG7_NP104s', 'Standard_M24s_v2', 'Standard_M24ms_v2', 'Standard_M48s_v2', 'Standard_M48ms_v2', 'Standard_M96s_v2', 'Standard_M96ms_v2', 'Standard_M192s_v2', 'Standard_M192ms_v2', 
    'Standard_D4hs_v3', 'Standard_D8hs_v3', 'Standard_D4ahs_v4', 'Standard_D8ahs_v4', 'AZAP_Performance_ComputeGen6_1_96', 'Experimental_F4ns_v2', 'Experimental_F8ns_v2', 'Experimental_F16ns_v2', 'Experimental_F32ns_v2', 'Experimental_F48ns_v2', 'Experimental_F64ns_v2', 
    'Experimental_F72ns_v2', 'Experimental_D4ns_v4', 'Experimental_D8ns_v4', 'Experimental_D16ns_v4', 'Experimental_D32ns_v4', 'Experimental_D48ns_v4', 'Experimental_E4ns_v4', 'Experimental_E8ns_v4', 'Experimental_E16ns_v4', 'Standard_E64id_v4_SPECIAL', 
    'Experimental_UltraLocalDisk4', 'Experimental_UltraLocalDisk8', 'Experimental_UltraLocalDisk16', 'Experimental_UltraLocalDisk32', 'Experimental_UltraLocalDisk48', 'Experimental_UltraLocalDisk64', 'Experimental_UltraLocalDisk80', 'AZAP_Performance_ComputeV17W_38_HalfNode', 
    'SQLG7_DCLK', 'CosmosDBG5_JBOD', 'Standard_M416xs_v2', 'Standard_M420xs_v2', 'Standard_M384xs_v2', 'Standard_M208-104ms_v2', 'Standard_M208-52ms_v2', 'Standard_M208-104s_v2', 'Standard_M208-52s_v2', 'Standard_M416-208ms_v2', 'Standard_M416-104ms_v2', 
    'Standard_M416-208s_v2', 'Standard_M416-104s_v2'];

configData.network_identify_arr = ["Unclassified","Classified"];
module.exports = configData;
