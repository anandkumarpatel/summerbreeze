'use strict';
var mongoose = require('mongoose');
var ReservationsSchema = require('./mongo-schema.js');

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

var Reservations = module.exports = mongoose.model('Reservations', ReservationsSchema);