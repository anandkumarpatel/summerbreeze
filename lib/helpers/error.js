'use strict';
var Boom = require('boom');

function handleError(err, req, res, next) {
  console.log('handleError', err.stack);
  res.status(400).json(err);
}

module.exports.Boom = Boom;
module.exports.handleError = handleError;
