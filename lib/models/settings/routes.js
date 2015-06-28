'use strict';
var settings = require('./middleware.js');
module.exports = function addRoutes (app) {
  app.get('/settings', settings.get);
  app.patch('/settings', settings.patch);

  return app;
};
