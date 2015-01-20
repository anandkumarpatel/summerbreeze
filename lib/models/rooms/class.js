'use strict';
var mongoose = require('mongoose');
var RoomsSchema = require('./mongo-schema.js');
var Rooms = module.exports = mongoose.model('Rooms', RoomsSchema);
