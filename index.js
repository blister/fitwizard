const express = require('express');
const app = express();
require('dotenv').config();

const bcrypt = require('bcrypt');
const session = require('express-session');
const validator = require('email-validator');

const mysql = require('mysql2');

const FWG = require('fitwizardgame');

const game = new FWG(process.env.DB_HOST, process.env.DB_USER, process.env.DB_PASS, process.env.DB_PORT, process.env.DB_SCHEMA);

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
 * haversine
 * @param {*} min 
 * @param {*} max 
 * @returns 
 */
function getDistance(lat1,lon1,lat2,lon2) {
	//var R = 6371; // Radius of the earth in km
	let R = 3958.8; // radius of the earth in miles
	let dLat = deg2rad(lat2-lat1);  // deg2rad below
	let dLon = deg2rad(lon2-lon1); 
	let a = 
	  Math.sin(dLat/2) * Math.sin(dLat/2) +
	  Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
	  Math.sin(dLon/2) * Math.sin(dLon/2); 
	let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	let d = R * c; // Distance in km
	return d;
}

function deg2rad(deg) {
	return deg * (Math.PI/180);
}

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
app.post('/adventure', async (req, res) => {

	const output = await game.start(req.session.user_id, req.body.lat, req.body.lng);
	console.log('starting new adventure');
	console.log(output);
	return res.json(output);
});

app.all('/adventure/:adventure_id', async (req, res) => {
	if ( ! req.session.user_id ) {
		return res.json({'error': 'You must be logged in'});
	}
	try {
		let user_id = req.session.user_id;
		let adventure_id = req.params.adventure_id;
		let output = {adventure_id: adventure_id};
		let current = await game.getCurrent(adventure_id);
		let player = await game.player(user_id);
		output['player'] = player;
		output['status'] = current.status;
		output['mode']   = current.mode;
		output['distance'] = getDistance(current.lat, current.lng, req.body.lat, req.body.lng);
		output['time'] = (new Date().getTime() - new Date(current.created_on).getTime()) / (1000 * 60 * 60);
		output['speed'] = output['distance'] / output['time'];
		
		let foundMonster = await game.storeTick(adventure_id, user_id, output['mode'], req.body.lat, req.body.lng);

		if ( output['mode'] == 'exploring' && foundMonster ) {
			console.log('You have discovered a bad guy! FIGHT!');
			game.enterBattle(adventure_id);
			let monster = game.mon(adventure_id, player.level);
			// TODO(erh) YOU ARE HERE. FIGURE THIS OUT.

			output['mode'] = 'battle';
			return res.json(output);
		} else {
			return res.json(output);
		}
	} catch(error) {
		console.log(error);
	}
				// TODO(erh): figure out speed, combat, etc
				// check to see if we have encountered a monster
				/*
				if ( adv_results[0].mode == 'exploring' ) {

					let mon_rand = rand(1,25);
					// TODO(decrease randomizer the longer we go without a fight)
					console.log('Random Chance: ' + mon_rand);
					if ( mon_rand < 5 ) {
						console.log("Fight!");
						// we found a monster!
						let monster = {
							name: 'orc',
							level: 2,
							hp: 15
						};
						let create_query = 'INSERT INTO adventure_fights (adventure_id, status, monster_name, monster_level, monster_hp) VALUES (?, ?, ?, ?, ?)';
						connection.query(create_query, [ req.params.adventure_id, 'active', monster.name, monster.level, monster.hp ], (err, results) => {
							output['battle'] = monster;

							connection.query('UPDATE adventures SET mode = "battle" WHERE id = ?', req.params.adventure_id, (err, results) => {
								return res.json(output);
							});
							
						});
					} else {
						return res.json(output);
					}

				} else if ( adv_results[0].mode == 'battle' ) {
					let battle_query = 'SELECT status,monster_name,monster_level,monster_hp FROM adventure_fights WHERE adventure_id = ?';
					connection.query(battle_query, req.params.adventure_id, (err, results) => {
						let monster = {
							name: results[0].monster_name,
							level: results[0].monster_level,
							hp: results[0].monster_hp
						};

						output['battle'] = monster;
						return res.json(output);
					});
				}

		});
		
	});	
	*/
});

app.all('/adventure/:adventure_id/end', (req, res) => {
	connection.query(
		'UPDATE adventures SET status = "retreated" WHERE id = ?', 
		[ req.params.adventure_id ],
		(err, results) => {
			return res.json({ status: "retreated", adventure_id: results.insertId });
	});
});

app.listen(process.env.PORT || 3000);