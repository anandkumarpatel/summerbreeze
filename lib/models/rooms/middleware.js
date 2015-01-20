'use strict';
var Rooms = require('./class.js');
var error = require('../../helpers/error.js');

/**
 * create a new room, use body
 */
function post(req, res, next) {
  var body = req.body;
  var room = new Rooms(body);
  room.save(function(err, newRoom) {
    if (err) {
      return next(err);
    }
    res.json(newRoom);
  });
}

/**
 * get room, query is search terms
 */
function get(req, res, next) {
  var query = req.query;
  Rooms.find(query, function(err, room) {
    if (err) {
      return next(err);
    }
    res.json(room);
  });
}


/**
 * delete room, params has id
 */
function del (req, res, next) {
  var id = req.params.id;
  Rooms.findByIdAndRemove(id, function(err) {
    if (err) {
      return next(err);
    }
    res.end();
  });
}

/**
 * update room, params has id, body is data
 */
function patch (req, res, next) {
  var id = req.params.id;
  var data = req.body;
  if (!data) {
    return next(error.Boom.badRequest('missing update data'));
  }
  Rooms.update({
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
