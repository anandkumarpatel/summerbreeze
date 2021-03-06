'use strict';
var Boom = require('boom');

function handleError(err, req, res, next) {
  log(err);
  var status = 400;
  var message = err;
  if (err.isBoom) {
    status = err.output.statusCode;
  }
  res.status(status).json(message);
}

function logIfError(err) {
  if (err) {
    log(err);
  }
}

function log(err) {
  console.error(err);
}

module.exports.Boom = Boom;
module.exports.handleError = handleError;
module.exports.logIfError = logIfError;
