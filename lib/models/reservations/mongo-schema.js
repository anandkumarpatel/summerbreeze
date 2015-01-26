'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

process.env.C_RESERVATION = {
  paymentType:  {
    creditCard: 1,
    cash: 2
  },
  status: {
    notIn: 1,
    checkIn: 2,
    checkOut: 3,
    canceled: 4
  }
};

var ReservationsSchema = module.exports = new Schema({
    guests: [{ type: Schema.Types.ObjectId, ref: 'Guests' }],
    rooms: [{ type: Schema.Types.ObjectId, ref: 'Rooms' }],
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
    next(new Error('checkOut date must be greater than checkIn date'));
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