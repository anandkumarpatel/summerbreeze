'use strict';
var mongoose = require('mongoose');
var ReservationsSchema = require('./mongo-schema.js');
var error = require('../../helpers/error.js');
var Rooms = require('../rooms/class.js');

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
  // if rooms, ensure it is avalible
  if (self.rooms.length > 0) {
    Reservations.findAllWithRoomIds(self.rooms, function(err, reservations) {
      if (err) { return cb(err); }
      // if we are oldest reservation no need to revert (must be sorted accending)
      if (self._id.equals(reservations[0]._id)) { return cb(); }
      // we need to revert
      handleConflict('room already reserved', reservations);
    });
  } else { // just do count of rooms
    Reservations.findAllInRange(self.checkIn, self.checkOut, function(err, reservations) {
      if (err) { return cb(err); }
      Rooms.find({}, function(err, rooms) {
        if (err) { return cb(err); }
        // valid if we have more rooms then reservations
        if (rooms.length >= reservations.length) { return cb(); }
        // no room left, revert
        handleConflict('no more rooms avalible', reservations);
      });
    });
  }

  function handleConflict(message, data) {
    self.remove(function(err) {
      error.logIfError(err);
      cb(error.Boom.conflict(message, data));
    });
  }
};


var Reservations = module.exports = mongoose.model('Reservations', ReservationsSchema);