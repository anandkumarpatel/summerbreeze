'use strict';
var Settings = require('./class.js');
var error = require('../../helpers/error.js');

/**
 * get setting, query is search terms
 */
function get(req, res, next) {
  Settings.findOne(function(err, setting) {
    if (err) {
      return next(err);
    }
    res.json(setting);
  });
}

/**
 * update setting, params has id, body is data
 */
function patch (req, res, next) {
  var data = req.body;
  if (!data) {
    return next(error.Boom.badRequest('missing update data'));
  }
  Settings.findOneAndUpdate({}, data, function(err) {
    if (err) {
      return next(err);
    }
    res.end();
  });
}

module.exports.get = get;
module.exports.patch = patch;
