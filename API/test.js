// Copyright 2012 Google LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

//'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const opn = require('open');
const destroyer = require('server-destroy');

const {google} = require('googleapis');
const plus = google.plus('v1');

const express = require("express");
app = express();

/**
 * To use OAuth2 authentication, we need access to a a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.  To get these credentials for your application, visit https://console.cloud.google.com/apis/credentials.
 */
//const keyPath = path.join(__dirname, 'oauth2.keys.json');
//let keys = {redirect_uris: ['']};
//if (fs.existsSync(keyPath)) {
//  keys = require(keyPath).web;
//}

/**
 * Create a new OAuth2 client with the configured keys.
 */
const oauth2Client = new google.auth.OAuth2(
//  keys.client_id,
//  keys.client_secret,
//  keys.redirect_uris[0]
		'534932766114-ncnt9t8g43cnogumvek67bk0marhm3k7.apps.googleusercontent.com',
		  'c_DY-cdSCK7RTaKt3lD8V37M',
		  'http://localhost:3001/oauth2callback'
);

/*{ access_token:
	   'ya29.a0AfH6SMACeKOZB7B4kbAYT_-iFVLiz3FSQxqu5QAgJz8J0SG9-yF-8D32nKChO_YblKKGcQlPpoNC1caaCF4NdVNA3-vDP3IHysJ7C7TzpTOVd53U-2F-ei_orRWrJOAwdtcvXrpwA3QbiktlX2C0ESuKHPCMJ0zoSSE',
	  refresh_token:
	   '1//0gV4d1hL_zQoRCgYIARAAGBASNwF-L9IrRo4uvOGSnAiez-8VgIKD695Q3573NQhTjhibXCto4slKNEhBkEa_mJIXA8JJmOLpRQE',
	  scope: 'https://www.googleapis.com/auth/cloud-platform openid',
	  token_type: 'Bearer',
	  id_token:
	   'eyJhbGciOiJSUzI1NiIsImtpZCI6ImE0MWEzNTcwYjhlM2FlMWI3MmNhYWJjYWE3YjhkMmRiMjA2NWQ3YzEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI1MzQ5MzI3NjYxMTQtbmNudDl0OGc0M2Nub2d1bXZlazY3YmswbWFyaG0zazcuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI1MzQ5MzI3NjYxMTQtbmNudDl0OGc0M2Nub2d1bXZlazY3YmswbWFyaG0zazcuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDU0MDk2NjQ5NDYxOTM3OTM2MDUiLCJhdF9oYXNoIjoiMFhEQ0k1aTRBTmI1U0g4X1BkME9vQSIsImlhdCI6MTU5NDAzNjgzOCwiZXhwIjoxNTk0MDQwNDM4fQ.QWKdxkFBoIfERj_ANxIUInq3F4WwLQmrc9erPaLvzkTLi-3JBGVMq1H5bKwe-_ITaCEXLFhAl83NgSsqbBt84Rgntn1JP6nCpBeu2KoQT8eaE8bh3vXUCRCPgk9QzfDC0aQt7RfTYaQW94hB3qu9fQTVCxH_2Vp8_Jptl9gs0Tca0I6Cw6itrTD807G-7UwKZonQVqujRM7NFyvjWweh6P3zcBcvyfJMlRb0Zse5z0ugGdmxsND2vKEhw_6C5KIM4nf-55x7vwJCUBCTbQMF6toSD9Uqj-9v63Celez4-7dKExbcz0cmaEUusEKzdG7egizhc0L9RxDPjq7tDcpOag',
	  expiry_date: 1594040437449 }*/
// code 4%2F1gGGNN6RsGk99Agf1apv13Xnz0cHbgW0j7naPh04PxdK7cqOCYitv5WXKCaeawI2z1ol59ntEpeKYOXgm12PH_k

/**
 * This is one of the many ways you can configure googleapis to use authentication credentials.  In this method, we're setting a global reference for all APIs.  Any other API you use here, like google.drive('v3'), will now use this auth client. You can also override the auth client at the service and method call levels.
 */
google.options({auth: oauth2Client});

/**
 * Open an http server to accept the oauth callback. In this simple example, the only request to our webserver is to /callback?code=<code>
 */
async function authenticate(scopes) {
  return new Promise((resolve, reject) => {
    // grab the url that will be used for authorization
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' '),
    });
    const server = http
      .createServer(async (req, res) => {
        try {
        	//4%2F1gGRyEz7A16ovoUiIscDBKrKLotwBEC2ssNvqj3IvCoJ0xQPsPPZ9NZKggw5EI8lILILY1VL8x6yMW9gYtPZSc0
//        	const {tokens} = await oauth2Client.getToken("4%2F1gGRyEz7A16ovoUiIscDBKrKLotwBEC2ssNvqj3IvCoJ0xQPsPPZ9NZKggw5EI8lILILY1VL8x6yMW9gYtPZSc0");
//            console.log(tokens);
            
          if (req.url.indexOf('/oauth2callback') > -1) {
            const qs = new url.URL(req.url, 'http://localhost:3001')
              .searchParams;
            res.end('Authentication successful! Please return to the console.');
            server.destroy();
            const {tokens} = await oauth2Client.getToken(qs.get('code'));
            console.log(tokens);
            oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates
            resolve(oauth2Client);
          }
        } catch (e) {
          reject(e);
        }
      })
      .listen(3001, () => {
        // open the browser to the authorize url to start the workflow
        opn(authorizeUrl, {wait: false}).then(cp => cp.unref());
      });
    destroyer(server);
  });
}

async function runSample() {
  // retrieve user profile
  const res = await plus.people.get({userId: 'me'});
  console.log(res.data);
}

const scopes = ['https://www.googleapis.com/auth/plus.me','https://www.googleapis.com/auth/cloud-platform'];
authenticate(scopes)
  .then(client => runSample(client))
  .catch(console.error);

//var router = express.Router();
//router.get('/oauth2callback', function(req, res, next) {
//	const {tokens} = oauth2Client.getToken("4%2F1gGGNN6RsGk99Agf1apv13Xnz0cHbgW0j7naPh04PxdK7cqOCYitv5WXKCaeawI2z1ol59ntEpeKYOXgm12PH_k");
//	console.log(tokens);
//});
//module.exports = router;
//app.listen("3001");