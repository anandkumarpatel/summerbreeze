'use strict';
var mongoose = require('mongoose');
var ReservationsSchema = require('./mongo-schema.js');
var error = require('../../helpers/error.js');
var Rooms = require('../rooms/class.js');
var Guests = require('../guests/class.js');

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
    self.validateReservation(function(err) {
      // if error, revert
      if (err) {
        return self.remove(function(removeErr) {
          error.logIfError(removeErr);
          cb(err);
        });
      }
      cb(null, newReservation);
    });
  });
};

ReservationsSchema.methods.validateReservation = function (cb) {
  var self = this;
  // ensure guest exists
  Guests.ensureGuestsExists(self.guests, function(err) {
    if (err) { return cb(err); }
    // if rooms, ensure it is avalible
    if (self.rooms.length > 0) {
      ensureRoomsNotTaken(self.rooms, self._id, cb);
    } else { // just do count of rooms
      ensureEmptyRoomsExists(self.checkIn, self.checkOut, self.roomsRequested, cb);
    }
  });
};

function ensureRoomsNotTaken(rooms, id, cb) {
  Rooms.ensureRoomsExists(rooms, function(err){
    if (err) { return cb(err); }
    Reservations.findAllWithRoomIds(rooms, function(err, reservations) {
      if (err) { return cb(err); }
      // if we are oldest reservation no need to revert (must b'e sorted accending)
      if (id.equals(reservations[0]._id)) { return cb(); }

      cb(error.Boom.conflict('room already reserved', reservations));
    });
  });
}

function ensureEmptyRoomsExists(checkIn, checkOut, roomsRequested, cb) {
  Reservations.findAllInRange(checkIn, checkOut, function(err, reservations) {
    if (err) { return cb(err); }
    Rooms.find({}, function(err, rooms) {
      if (err) { return cb(err); }
      // valid if we have more rooms then reservations (this already saved)

      var roomsRequested = reservations.reduce(function(previousValue, currentValue) {
        return previousValue + currentValue.roomsRequested;
      }, 0);

      if (rooms.length >= roomsRequested) { return cb(); }

      cb(error.Boom.conflict('no more rooms avalible', reservations));
    });
  });
}

var Reservations = module.exports = mongoose.model('Reservations', ReservationsSchema);