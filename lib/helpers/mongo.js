'use strict';
var createCount = require('callback-count');
var mongoose = require('mongoose');
module.exports = {
  connect: function (cb) {
    if (mongoose.connection.readyState === 1) {
      cb();
    } else {
      mongoose.connect(process.env.MONGO);
      mongoose.connection.once('connected', cb);
    }
  },
  disconnect: function(cb) {
    mongoose.disconnect(cb);
  },
  dropDatabase: function(cb) {
    var collectionNames = Object.keys(mongoose.connection.collections);
    var count = createCount(collectionNames.length, cb);
    collectionNames.forEach(function (name) {
      mongoose.connection.collections[name].remove({}, count.next);
    });
  }
}