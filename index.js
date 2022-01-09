const express = require('express');
const app = express();
require('dotenv').config();

const queryString = require('query-string');

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
	// return new google.auth.OAuth2(
	// 	googleConfig.clientId,
	// 	googleConfig.clientSecret,
	// 	googleConfig.redirect
	// );
}

/**
 * Get a url which will open the google sign-in page and request access to the scope provided (such as calendar events).
 */
function getConnectionUrl(auth) {
	// return auth.generateAuthUrl({
	// 	access_type: 'offline',
	// 	prompt: 'consent', // access type and approval prompt will force a new refresh token to be made each time signs in
	// 	scope: defaultScope
	// });
}

/**
 * Create the google url to be sent to the client.
 */
function urlGoogle() {
	const stringifiedParams = queryString.stringify({
		client_id: process.env.GOOGLE_CLIENT_ID,
		redirect_uri: 'https://fitwizard.herokuapp.com/authenticate/google',
		scope: [
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/userinfo.profile',
		].join(' '), // space separated string
		response_type: 'code',
		access_type: 'offline',
		prompt: 'consent',
	});

	const googleLoginUrl = `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`;
	return googleLoginUrl;
}

app.get('/authenticate/google', (req, res) => {
	const urlParams = queryString.parse(req.query.code);
	console.log(urlParams);

	res.json(urlParams);
});

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