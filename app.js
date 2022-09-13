//load development environment variables if not running in production environment
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}

//setup and configure express app
const express = require('express');
const app = express();

//allow static files to be served, for SSL certbot
app.use(express.static(__dirname + '/public', { dotfiles: 'allow' } ));

//setup cross-origin-resource-sharing
const cors = require('cors');
app.use(cors());

//setup middleware
const body_parser = require('body-parser');
app.use(body_parser.json());

//setup mongodb and mongoose
const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL);

const database = mongoose.connection;
database.on('error', p_error => console.error(p_error));
database.once('open', () => console.log('mongoose connected to the mongodb database'));

//setup routes
const index_router = require('./routes/index');
app.use('/', index_router);
const reservation_router = require('./routes/reservation');
app.use('/reservations', reservation_router);
const tag_router = require('./routes/tag');
app.use('/tags', tag_router);

//start HTTP server - for renewing certificates
//app.listen(80, () => console.log('server running on port 80'));

//start HTTPS server
const https = require('https');
const fs = require('fs');
const options = {
    key:fs.readFileSync('etc/letsencrypt/live/vustjohns.tk/privkey.pem'),
    cert:fs.readFileSync('etc/letsencrypt/live/vustjohns.tk/fullchain.pem')
};
https.createServer(options, app).listen(process.env.PORT, () => console.log(`HTTPS listening on ${process.env.PORT}`));