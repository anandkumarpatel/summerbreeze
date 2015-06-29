'use strict';
var Settings = require('./class.js');
var error = require('../../helpers/error.js');

/**
 * get setting
 */
function get(req, res, next) {
  Settings.findOne(function(err, setting) {
    if (err) { return next(err); }

    res.json(setting || {});
  });
}

/**
 * update setting
 */
function patch (req, res, next) {
  var data = req.body;
  if (!data) {
    return next(error.Boom.badRequest('missing update data'));
  }
  Settings.findOneAndUpdate({}, data, function (err, update) {
    if (err) { return next(err); }

    if (!update) {
      var setting = new Settings(data);
      return setting.save(function(err) {
        if (err) { return next(err); }
        res.send(200);
      });
    }
    res.send(200);
  });
}

module.exports.get = get;
module.exports.patch = patch;
