'use strict';
var mongoose = require('mongoose');
var ReservationsSchema = require('./mongo-schema.js');
var Reservations = module.exports = mongoose.model('Reservations', ReservationsSchema);
