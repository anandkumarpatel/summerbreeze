'use strict';
var mongo = require('./helpers/mongo.js');
var routes = require('./routes.js');

var server = null;

module.exports = {
  start: function (cb) {
    mongo.connect(function(err) {
      if (err) { return cb(err); }
      server = routes.listen(process.env.PORT, cb);
    });
  },
  stop: function(cb) {
    server.close(function(err) {
      if (err) { return cb(err); }
      mongo.disconnect(cb);
    });
  }
};