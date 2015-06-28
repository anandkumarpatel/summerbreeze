'use strict';
require('../lib/loadConfig.js');

// api server must be started to use this script
var async = require('async');
var R = require('../test/rooms-fixtures.js');
var Res = require('../test/reservations-fixtures.js');
var RC = Res.C;
var G = require('../test/guests-fixtures.js');
var createCount = require('callback-count');

var rooms = [];
var guests = [];

function logIfErr (save, cb) {
  return function (err, val) {
    if (err) {
      return console.error(err);
    }
    save.push(val._id);
    cb();
  };
}
async.series([
  function createRooms (cb) {
    var num = 30;
    var count = createCount(num, cb);
    for (var i = 0; i < num; i++) {
      R.createRandomRoom(i, logIfErr(rooms, count.next));
    }
  },
  function createGuests (cb) {
    var num = 30;
    var count = createCount(num, cb);
    for (var i = 0; i < num; i++) {
      G.createRandomGuest(logIfErr(guests, count.next));
    }
  },
  function createReservatons (cb) {
    var count = createCount(cb);
    // past
    Res.postReservation(
      Res.genResData([guests.pop()], [rooms.pop()], -5, -2, RC.status.checkOut),
      count.inc().next);
    Res.postReservation(
      Res.genResData([guests.pop()], [rooms.pop(), rooms.pop()], -5, -2, RC.status.checkOut),
      count.inc().next);
    // checking out today
    Res.postReservation(
      Res.genResData([guests.pop()], [rooms.pop()], -2, 0, RC.status.checkIn),
      count.inc().next);
    Res.postReservation(
      Res.genResData([guests.pop()], [rooms.pop(), rooms.pop()], -2, 0, RC.status.checkIn),
      count.inc().next);
    // stay over
    Res.postReservation(
      Res.genResData([guests.pop()], [rooms.pop()], -2, 2, RC.status.checkIn),
      count.inc().next);
    Res.postReservation(
      Res.genResData([guests.pop()], [rooms.pop(), rooms.pop()], 0, 5, RC.status.checkIn),
      count.inc().next);
    // checking in today
    Res.postReservation(
      Res.genResData([guests.pop()], [rooms.pop()], 0, 1, RC.status.notIn),
      count.inc().next);
    Res.postReservation(
      Res.genResData([guests.pop()], [rooms.pop()], 0, 5, RC.status.notIn),
      count.inc().next);
    Res.postReservation(
      Res.genResData([guests.pop()], [rooms.pop(), rooms.pop()], 0, 4, RC.status.notIn),
      count.inc().next);
    // in future with room
    Res.postReservation(
      Res.genResData([guests.pop()], [rooms.pop()], 2, 4, RC.status.notIn),
      count.inc().next);
    Res.postReservation(
      Res.genResData([guests.pop()], [rooms.pop(), rooms.pop()], 0, 5, RC.status.notIn),
      count.inc().next);
    // in future (no room)
    Res.postReservation(
      Res.genResData([guests.pop()], 1, 2, 3, RC.status.notIn),
      count.inc().next);
    Res.postReservation(
      Res.genResData([guests.pop()], 1, 2, 4, RC.status.notIn),
      count.inc().next);
    Res.postReservation(
      Res.genResData([guests.pop()], 2, 3, 4, RC.status.notIn),
      count.inc().next);
    Res.postReservation(
      Res.genResData([guests.pop()], 2, 1, 4, RC.status.notIn),
      count.inc().next);
    Res.postReservation(
      Res.genResData([guests.pop()], 1, 1, 2, RC.status.notIn),
      count.inc().next);
    Res.postReservation(
      Res.genResData([guests.pop()], 1, 1, 3, RC.status.notIn),
      count.inc().next);
    Res.postReservation(
      Res.genResData([guests.pop()], 1, 1, 4, RC.status.notIn),
      count.inc().next);
  }
], function (err) {
  console.log('done.');
  if (err) {
    console.error('error happened', err);
  }
});
