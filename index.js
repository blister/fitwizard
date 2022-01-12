const express = require('express');
const app = express();
require('dotenv').config();

const bcrypt = require('bcrypt');
const session = require('express-session');
const validator = require('email-validator');

const mysql = require('mysql2');

const connection = mysql.createConnection({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PASS,
	database : process.env.DB_SCHEMA,
	port     : process.env.DB_PORT
});
connection.connect();

// temp fake user id for now
let user_id = 1;

const queryString = require('query-string');

const googleConfig = {
	clientId: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	redirect: 'https://fitwizard.herokuapp.com'
}

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(session({
	secret: 'fitwizard_secrets',
	resave: true,
	saveUninitialized: true
}));

app.use((req, res, next) => {
	if ( req.session.loggedIn ) {
		res.locals.loggedIn = true;
		res.locals.user_id = req.session.user_id;
		res.locals.username = req.session.username;	
	} else {
		req.session.loggedIn = false;
		res.locals.loggedIn = false;
		res.locals.user_id = null;
		res.locals.username = 'Guest Wizard';
	}
	
	next();
});

/**
 * generate random numbers for stats
 * 
 */
function rand(min, max) {
	return parseInt(Math.floor(Math.random() * ( max - min + 1) + min));
}

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

// app.get('/login', (req, res) => {
// 	let url = urlGoogle();
// 	return res.render('login', { google_login_url: url });
// });

app.get('/', (req, res) => {
	if ( req.session.loggedIn ) {

		connection.query(
			'SELECT xp,strength,dexterity,constitution,intelligence,wisdom FROM char_stats WHERE user_id = ?',
			req.session.user_id, 
			(err, results) => {
				if ( err ) {
					console.log(err);
					return res.render('landing');
				}
				return res.render('dashboard', { attributes: results[0] });		
		});

	} else {
		res.render('landing');
	}
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

app.get('/signup', (req, res) => {
	res.render('signup');
});
app.post('/signup', async (req, res) => {
	if ( validator.validate(req.body.email) && req.body.username ) {
		try {
			const salt = await bcrypt.genSalt();
			const signupPassword = `${await bcrypt.hash(req.body.password, salt)}`;
			let signupEmail = `${req.body.email}`;
			let signupUsername = `${req.body.username}`;
			let signup_verify_email_query = 'SELECT id FROM users WHERE users.email = ? OR users.username = ?';
			let signup_query = 'INSERT INTO users (email, username, password) VALUES (?, ?, ?)';
			let char_query = 'INSERT INTO char_stats (user_id, strength, dexterity, constitution, intelligence, wisdom) VALUES (?, ?, ?, ?, ?, ?)';
			connection.query(signup_verify_email_query, [ signupEmail, signupUsername ], (err, results) => {
				if ( ! results[0] ) {
					connection.query(signup_query, [ signupEmail, signupUsername, signupPassword ], (err, results) => {
						if ( err ) throw err;
						req.session.loggedIn = true;
						req.session.user_id = results.insertId;
						req.session.username = signupUsername;

						let str = rand(7,12);
						let dex = rand(7,14);
						let con = rand(7,14);
						let wis = rand(7,12);
						let intel = rand(10, 18);
						
						connection.query(char_query, [req.session.user_id, str, dex, con, wis, intel], (err, results) => {
							console.log(`New signup: ${signupUsername} - ${signupEmail}`);
							console.log(`Stats [Str: ${str}, Dex: ${dex}, Con: ${con}, Wis: ${wis}, Int: ${int}]`);
							res.redirect('/');
						});

						
					});
				} else {
					res.send('Username or email address already in use.');
				}
			});

		} catch(e) {
			res.status(500).send();
		}
	}
});

app.get('/login', (req, res) => {
	res.render('login');
});

// authenticate
app.post('/login', async (req, res) => {
	let loginEmail = `${req.body.email}`
	let loginPassword = `${req.body.password}`
	let login_query = `
	SELECT users.id, users.username, users.password
	FROM users 
	WHERE users.email = ?;
	`;
	connection.query(login_query, loginEmail, async (err, results) => {
		if (results.length > 0) {
			try {
				if (await bcrypt.compare(loginPassword, results[0].password)) {
					req.session.loggedIn = true;
					req.session.user_id = results[0].id;
					req.session.username = results[0].username;
					res.redirect('/');
				} else {
					res.send('Incorrect Username and/or Password!');
				}
			} catch {
				res.status(500).send();
			}
		} else {
			res.send('Incorrect Username and/or Password!');
		};
	});
});

app.get('/logout', (req, res) => {
	if ( req.session ) {
		req.session.destroy(err => {
			res.redirect('/');
		}); 
	} else {
		res.redirect('/');
	}
});

/* api endpoints for playing the game */
app.post('/adventure', (req, res) => {
	connection.query(
		'INSERT INTO adventures (`user_id`, `status`, `mode`, `lat`, `lng`) VALUES (?, ?, ?, ?, ?)', 
		[ req.session.user_id, 'active', 'exploring', req.body.lat, req.body.lng ],
		(err, results) => {
			return res.redirect('/adventure/' + results.insertId);
	});
});

app.get('/adventure/:adventure_id', (req, res) => {
	res.json(req.params);
});



app.listen(process.env.PORT || 3000);