'use strict';
var Reservations = require('../reservations/class.js');
var Rooms = require('../rooms/class.js');
var async = require('async');

function get(req, res, next) {
  var checkIn = req.query.checkIn;
  var checkOut = req.query.checkOut;

  async.parallel({
    reservations: Reservations.findAllInRange.bind(Reservations, checkIn, checkOut),
    rooms: Rooms.find.bind(Rooms)
  }, filterAvalibleRooms);

  function filterAvalibleRooms(err, results) {
    if (err) { return next(err); }
    var allRoomIds = results.rooms.map(function(room) {
      return room._id;
    });

    var out = allRoomIds.filter(function (roomId) {
      // need to return false when reserved Rooms Arrays containers room
      for (var i = results.reservations.length - 1; i >= 0; i--) {
        if (results.reservations[i].rooms.indexOf(roomId) !== -1) {
          return false;
        }
      }
      return true;
    });
    async.map(out, function(item, cb) {
      Rooms.findById(item, cb);
    }, function(err, avalibleRooms){
      if (err) { return next(err); }
      res.json(avalibleRooms);
    });
  }
}


module.exports.get = get;
