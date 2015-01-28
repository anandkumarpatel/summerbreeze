'use strict';
var mongoose = require('mongoose');
var GuestsSchema = require('./mongo-schema.js');
var error = require('../../helpers/error.js');

GuestsSchema.statics.ensureGuestsExists = function (guests, cb) {
  Guests.find({
    _id: {
      $in: guests
    }
  }, function(err, found) {
    if (err) { return cb(err); }
    if (found.length !== guests.length) {
      return cb(error.Boom.badRequest('guest not found', {
        asked: guests,
        found: found
      }));
    }
    cb();
  });
};

// must be called last
var Guests = module.exports = mongoose.model('Guests', GuestsSchema);
