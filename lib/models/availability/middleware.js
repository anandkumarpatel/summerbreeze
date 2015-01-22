'use strict';
var Reservations = require('../reservations/class.js');
var Rooms = require('../rooms/class.js');
var async = require('async');

function get(req, res, next) {
  var checkIn = req.query.checkIn;
  var checkOut = req.query.checkOut;

  async.parallel({
    reservations: function(cb) {
      Reservations.findAllInRange(checkIn, checkOut, cb);
    },
    rooms: function(cb) {
      Rooms.find(cb);
    }
  }, filterAvalibleRooms);

  function filterAvalibleRooms(err, results) {
    if (err) { return next(err); }
    var allRoomIds = results.rooms.map(function(room) {
      return room._id;
    });

    var out = allRoomIds.filter(function (roomId) {
      // needs to return false wheh reservedRoomsArrays containers rroom
      for (var i = results.reservations.length - 1; i >= 0; i--) {
        if (results.reservations[i].rooms.indexOf(roomId) !== -1) {
          return false;
        }
      }
      return true;
    });

    res.json(out);
  }
}


module.exports.get = get;
