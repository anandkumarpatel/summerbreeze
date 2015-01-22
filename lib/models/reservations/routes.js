'use strict';
var reservations = require('./middleware.js');
module.exports = function addRoutes (app) {
  app.get('/reservations', reservations.get);
  app.post('/reservations', reservations.post);
  app.delete('/reservations/:id', reservations.del);
  app.patch('/reservations/:id', reservations.patch);

  return app;
};
