'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var error = require('../../helpers/error.js');

process.env.C_RESERVATION = {
  paymentType:  {
    creditCard: 1,
    cash: 2
  },
  status: {
    notIn: 1, // not here yet
    checkIn: 2, // guest has checked in
    checkOut: 3, // guest has checked out
    canceled: 4 // reservation was canceled
  }
};

var ReservationsSchema = module.exports = new Schema({
    guests: [{ type: Schema.Types.ObjectId, ref: 'Guests' }],
    rooms: [{ type: Schema.Types.ObjectId, ref: 'Rooms' }],
    roomsRequested: {
      type: Number,
      required: true
    },
    timeLastEdit: {
      type: Number,
      required: true
    },
    checkIn: {
      type: Number,
      required: true
    },
    checkOut: {
      type: Number,
      required: true
    },
    rate: {
      type: Number,
      required: true
    },
    // 1 credit card
    // 2 cash
    paymentType: {
      type: Number,
      required: true,
      less_than_or_equal_to: 2
    },
    cardNumber: {
      type: Number
    },
    // 1 not yet checked in
    // 2 checked in
    // 3 checked out
    // 4 canceled
    status: {
      type: Number,
      required: true,
      less_than_or_equal_to: 4
    },
    comment: {
      type: String
    }
});

ReservationsSchema.pre('validate', function (next) {
  if (this.checkIn > this.checkOut) {
    return next(error.Boom.badRequest('checkOut date must be greater than checkIn date'));
  }
  return next();
});

// ReservationsSchema.post('validate', function (doc) {
//   console.log('ReservationsSchema %s has been validated (but not saved yet)', doc);
// });
// ReservationsSchema.post('save', function (doc) {
//   console.log('ReservationsSchema %s has been saved', doc);
// });
// ReservationsSchema.post('remove', function (doc) {
//   console.log('ReservationsSchema %s has been removed', doc);
// });