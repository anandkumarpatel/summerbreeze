'use strict';
var Reservations = require('../reservations/class.js');
var Rooms = require('../rooms/class.js');
var async = require('async');

function get(req, res, next) {
  var checkin = req.query.checkin;
  var checkout = req.query.checkout;

  async.parallel({
    reservations: Reservations.findAllInRange.bind(Reservations, checkin, checkout),
    rooms: Rooms.find
  }, filterAvalibleRooms);

  function filterAvalibleRooms(err, results) {
    if (err) { return next(err); }
    // reject if room is in reservation
    async.reject(results.rooms, reservationContainsRoom, sendRooms);

    function reservationContainsRoom (room, cb) {
      if (room.status === 'blocked') { cb(true); }
      // if room is in reservation.rooms, return true
      async.some(results.reservations, roomIsInReservation, cb);

      function roomIsInReservation (reservation, cb) {
        // does reservation contain this room?
        async.some(reservation.rooms, function(rRoom, cb) {
          cb(room._id === rRoom._id);
        }, cb);
      }
    }
  }

  function sendRooms(err, rooms) {
    if (err) { return next(err); }
    res.json(rooms);
  }
}


module.exports.get = get;
