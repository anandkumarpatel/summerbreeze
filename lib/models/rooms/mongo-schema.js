'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RoomsSchema = module.exports = new Schema({
    number: {
      index: { unique: true },
      unique: true,
      type: Number,
      required: true
    },
    smoking: {
      type: Boolean,
      required: true
    },
    beds: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    comment: {
      type: String
    },
});


// RoomsSchema.post('validate', function (doc) {
//   console.log('RoomsSchema %s has been validated (but not saved yet)', doc);
// });
// RoomsSchema.post('save', function (doc) {
//   console.log('RoomsSchema %s has been saved', doc);
// });
// RoomsSchema.post('remove', function (doc) {
//   console.log('RoomsSchema %s has been removed', doc);
// });
RoomsSchema.path('number').index({ unique: true });
