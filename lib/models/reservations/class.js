'use strict';
var mongoose = require('mongoose');
var ReservationsSchema = require('./mongo-schema.js');
var error = require('../../helpers/error.js');
var Rooms = require('../rooms/class.js');
var Guests = require('../guests/class.js');
var debug = require('auto-debug')();

ReservationsSchema.statics.findAllInRange = function (checkIn, checkOut, cb) {
  debug();
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
  debug();
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
  debug();
  var self = this;
  self.save(function(err, newReservation) {
    if (err) {
      debug('error saving newReservation', self, err);
      return cb(err);
    }
    self.validateReservation(function(err) {
      // if error, revert
      if (err) {
        debug('error validating reservation', err);
        return self.remove(function(removeErr) {
          debug('error removing reservation', removeErr);
          cb(err);
        });
      }
      cb(null, newReservation);
    });
  });
};

ReservationsSchema.methods.validateReservation = function (cb) {
  debug();
  var self = this;
  // ensure guest exists
  Guests.ensureGuestsExists(self.guests, function(err) {
    if (err) {
      debug('error ensureGuestsExists', self.guests, err);
      return cb(err);
    }
    // if rooms, ensure it is available
    if (self.rooms.length > 0) {
      ensureRoomsNotTaken(self.rooms, self._id, cb);
    } else { // just do count of rooms
      ensureEmptyRoomsExists(self.checkIn, self.checkOut, self.roomsRequested, cb);
    }
  });
};

function ensureRoomsNotTaken(rooms, id, cb) {
  debug();
  Rooms.ensureRoomsExists(rooms, function(err){
    if (err) {
      debug('error ensureRoomsExists', rooms, err);
      return cb(err);
    }
    Reservations.findAllWithRoomIds(rooms, function(err, reservations) {
      if (err) {
        debug('error findAllWithRoomIds', rooms, err);
        return cb(err);
      }
      // if we are oldest reservation no need to revert (must be sorted ascending)
      if (id.equals(reservations[0]._id)) { return cb(); }

      cb(error.Boom.conflict('room already reserved', reservations));
    });
  });
}

function ensureEmptyRoomsExists(checkIn, checkOut, roomsRequested, cb) {
  debug();
  Reservations.findAllInRange(checkIn, checkOut, function(err, reservations) {
    if (err) {
      debug('error findAllInRange', checkIn, checkOut, err);
      return cb(err);
    }
    Rooms.find({}, function(err, rooms) {
      if (err) {
        debug('error find', err);
        return cb(err);
      }
      // valid if we have more rooms then reservations (this already saved)
      var roomsRequested = reservations.reduce(function(previousValue, currentValue) {
        return previousValue + currentValue.roomsRequested;
      }, 0);

      if (rooms.length >= roomsRequested) {
        debug('rooms are available');
        return cb();
      }

      cb(error.Boom.conflict('no more rooms available', reservations));
    });
  });
}

var Reservations = module.exports = mongoose.model('Reservations', ReservationsSchema);