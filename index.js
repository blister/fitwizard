const express = require('express');
const app = express();
require('dotenv').config();

import { google } from 'googleapis';

const googleConfig = {
	clientId: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	redirect: 'https://fitwizard.herokuapp.com'
}

app.use(express.static('public'));
app.set('view engine', 'ejs');


/**
 * Create the google auth object which gives us access to talk to google's apis.
 */
function createConnection() {
	return new google.auth.OAuth2(
		googleConfig.clientId,
		googleConfig.clientSecret,
		googleConfig.redirect
	);
}

/**
 * This scope tells google what information we want to request.
 */
const defaultScope = [
	'https://www.googleapis.com/auth/plus.me',
	'https://www.googleapis.com/auth/userinfo.email',
];

/**
 * Get a url which will open the google sign-in page and request access to the scope provided (such as calendar events).
 */
function getConnectionUrl(auth) {
	return auth.generateAuthUrl({
		access_type: 'offline',
		prompt: 'consent', // access type and approval prompt will force a new refresh token to be made each time signs in
		scope: defaultScope
	});
}

/**
 * Create the google url to be sent to the client.
 */
function urlGoogle() {
	const auth = createConnection(); // this is from previous step
	const url = getConnectionUrl(auth);
	return url;
}

function getGoogleAccountFromCode(code) {
	const data = await auth.getToken(code);
	const tokens = data.tokens;
	const auth = createConnection();
	auth.setCredentials(tokens);
	const plus = getGooglePlusApi(auth);
	const me = await plus.people.get({ userId: 'me' });
	const userGoogleId = me.data.id;
	const userGoogleEmail = me.data.emails && me.data.emails.length && me.data.emails[0].value;
	return {
		id: userGoogleId,
		email: userGoogleEmail,
		tokens: tokens,
	};
}

app.get('/login', (req, res) => {
	let url = urlGoogle();
	return res.render('login', { google_login_url: url });
});

app.get('/test', (req, res) => {
    res.send('got it');
});

app.get('/vibration', (req, res) => {
	if ( Math.random() >= .5 ) {
		return res.json({'buzz': true });
	} 

	return res.json({'buzz': false });
});

app.listen(process.env.PORT || 3000);