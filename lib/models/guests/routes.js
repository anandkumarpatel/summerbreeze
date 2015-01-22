'use strict';
var guests = require('./middleware.js');
module.exports = function addRoutes (app) {
  app.get('/guests', guests.get);
  app.post('/guests', guests.post);
  app.delete('/guests/:id', guests.del);
  app.patch('/guests/:id', guests.patch);

  return app;
};
