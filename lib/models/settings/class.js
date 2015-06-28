'use strict';
var mongoose = require('mongoose');
var SettingsSchema = require('./mongo-schema.js');

// must be called last
module.exports = mongoose.model('Settings', SettingsSchema);
