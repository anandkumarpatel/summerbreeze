var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GuestsSchema = module.exports = new Schema({
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    dateOfBirth: {
      type: Number,
      required: true
    },
    idNumber: {
      type: String,
      required: true
    },
    comment: {
      type: String
    },
});


// GuestsSchema.post('validate', function (doc) {
//   console.log('GuestsSchema %s has been validated (but not saved yet)', doc);
// });
// GuestsSchema.post('save', function (doc) {
//   console.log('GuestsSchema %s has been saved', doc);
// });
// GuestsSchema.post('remove', function (doc) {
//   console.log('GuestsSchema %s has been removed', doc);
// });