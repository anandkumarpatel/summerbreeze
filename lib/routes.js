'use strict';
require('./loadConfig.js');
var express = require('express');
var app = express();
var morgan = require('morgan');
var error = require('./helpers/error.js');
var bodyParser = require('body-parser');

app.use(morgan('short'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

require('./models/rooms/routes.js')(app);
require('./models/guests/routes.js')(app);
require('./models/reservations/routes.js')(app);
require('./models/availability/routes.js')(app);


app.use(error.handleError);
app.all('*', function (req, res) {
  res.json(404, { message: 'resource not found' });
});

module.exports = app;