'use strict';
var rooms = require('./middleware.js');
module.exports = function addRoutes (app) {
  app.get('/rooms', rooms.get);
  app.post('/rooms', rooms.post);
  app.delete('/rooms/:id', rooms.del);
  app.patch('/rooms/:id', rooms.patch);

  return app;
};
