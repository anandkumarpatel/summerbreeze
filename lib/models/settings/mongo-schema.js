'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = new Schema({
    taxRate: {
      type: Number,
      default: 0
    }
});


// SettingsSchema.post('validate', function (doc) {
//   console.log('SettingsSchema %s has been validated (but not saved yet)', doc);
// });
// SettingsSchema.post('save', function (doc) {
//   console.log('SettingsSchema %s has been saved', doc);
// });
// SettingsSchema.post('remove', function (doc) {
//   console.log('SettingsSchema %s has been removed', doc);
// });
