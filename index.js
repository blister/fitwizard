const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/test', (req, res) => {
    res.send('got it');
});

app.listen(process.env.PORT || 3000);