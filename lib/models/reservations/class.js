'use strict';
var mongoose = require('mongoose');
var ReservationsSchema = require('./mongo-schema.js');
var error = require('../../helpers/error.js');

ReservationsSchema.statics.findAllInRange = function (checkIn, checkOut, cb) {
  this.find({
    checkIn: {
      $lt: checkOut
    },
    checkOut: {
      $gt: checkIn
    }
  }, cb);
};

ReservationsSchema.statics.findAllWithRoomIds = function (roomIds, cb) {
  this.find({
    rooms: {
      $elemMatch: {
        $in: roomIds
      }
    }
  }, {
    rooms: 1,
    timeLastEdit: 1
  },
  {
    checkIn: 1 // sort by accending out[0] = smallest number (oldest)
  }, cb);
};

ReservationsSchema.methods.makeReservation = function (cb) {
  var self = this;
  self.save(function(err, newReservation) {
    if (err) { return cb(err); }
    self.ensureRoomAvalibility(function(err) {
      cb(err, newReservation);
    });
  });
};

ReservationsSchema.methods.ensureRoomAvalibility = function (cb) {
  var self = this;
  // return early if no room assigned
  if (!self.rooms) { return cb(); }
  Reservations.findAllWithRoomIds(self.rooms, function(err, reservations) {
    if (err) { return cb(err); }
    // if we are oldest reservation no need to revert (must be sorted accending)
    if (self._id.equals(reservations[0]._id)) { return cb(); }
    // we need to revert
    Reservations.findByIdAndRemove(self._id, function(err) {
      error.logIfError(err);
      cb(error.Boom.conflict('room already reserved', reservations));
    });
  });
};


var Reservations = module.exports = mongoose.model('Reservations', ReservationsSchema);