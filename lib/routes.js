'use strict';
require('./loadConfig.js');
var express = require('express');
var app = express();
var morgan = require('morgan');
var error = require('./helpers/error.js');
var bodyParser = require('body-parser');

var rooms = require('./models/rooms/middleware.js');
var guests = require('./models/guests/middleware.js');
var reservations = require('./models/reservations/middleware.js');


app.use(morgan('short'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/rooms', rooms.get);
app.post('/rooms', rooms.post);
app.delete('/rooms/:id', rooms.del);
app.patch('/rooms/:id', rooms.patch);

app.get('/guests', guests.get);
app.post('/guests', guests.post);
app.delete('/guests/:id', guests.del);
app.patch('/guests/:id', guests.patch);


app.get('/reservations', reservations.get);
app.post('/reservations', reservations.post);
app.delete('/reservations/:id', reservations.del);
app.patch('/reservations/:id', reservations.patch);

app.use(error.handleError);
app.all('*', function (req, res) {
  res.json(404, { message: 'resource not found' });
});

module.exports = app;