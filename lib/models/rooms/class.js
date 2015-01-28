'use strict';
var mongoose = require('mongoose');
var RoomsSchema = require('./mongo-schema.js');
var error = require('../../helpers/error.js');

RoomsSchema.statics.ensureRoomsExists = function (rooms, cb) {
  Rooms.find({
    _id: {
      $in: rooms
    }
  }, function(err, found) {
    if (err) { return cb(err); }
    if (found.length !== rooms.length) {
      return cb(error.Boom.badRequest('room not found', {
        asked: rooms,
        found: found
      }));
    }
    cb();
  });
};
// must be called last
var Rooms = module.exports = mongoose.model('Rooms', RoomsSchema);
