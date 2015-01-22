'use strict';
var availability = require('./middleware.js');
module.exports = function addRoutes (app) {
  app.get('/availability', availability.get);

  return app;
};
