'use strict';
var mongoose = require('mongoose');
var GuestsSchema = require('./mongo-schema.js');
var Guests = module.exports = mongoose.model('Guests', GuestsSchema);
