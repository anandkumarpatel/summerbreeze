'use strict';
var mongoose = require('mongoose');
var GuestsSchema = require('./mongo-schema.js');
var error = require('../../helpers/error.js');
var debug = require('auto-debug')();

GuestsSchema.statics.ensureGuestsExists = function (guests, cb) {
  debug();
  Guests.find({
    _id: {
      $in: guests
    }
  }, function(err, found) {
    if (err) {
      debug('error finding guest', guests);
      return cb(err);
    }
    if (found.length !== guests.length) {
      debug('guest was not found', found, guests);
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
