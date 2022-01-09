const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.static('public'));
app.set('view engine', 'ejs');

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