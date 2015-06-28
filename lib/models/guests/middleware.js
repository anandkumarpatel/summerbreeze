'use strict';
var Guests = require('./class.js');
var error = require('../../helpers/error.js');

/**
 * create a new guest, use body
 */
function post(req, res, next) {
  var body = req.body;
  var guest = new Guests(body);
  guest.save(function(err, newRoom) {
    if (err) {
      return next(err);
    }
    res.json(newRoom);
  });
}

/**
 * get guest, query is search terms
 */
function get(req, res, next) {
  var query = req.query;
  if (query.$or) {
    query.$or = JSON.parse(query.$or);
  }
  Guests.find(query, function(err, guest) {
    if (err) {
      return next(err);
    }
    res.json(guest);
  });
}


/**
 * delete guest, params has id
 */
function del (req, res, next) {
  var id = req.params.id;
  Guests.remove({_id: id}, function(err) {
    if (err) {
      return next(err);
    }
    res.end();
  });
}

/**
 * update guest, params has id, body is data
 */
function patch (req, res, next) {
  var id = req.params.id;
  var data = req.body;
  if (!data) {
    return next(error.Boom.badRequest('missing update data'));
  }
  Guests.update({
    _id: id
  }, data, function(err) {
    if (err) {
      return next(err);
    }
    res.end();
  });
}

module.exports.post = post;
module.exports.get = get;
module.exports.del = del;
module.exports.patch = patch;
