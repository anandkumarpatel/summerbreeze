'use strict';
var Reservations = require('./class.js');
var error = require('../../helpers/error.js');
var debug = require('auto-debug')();
/**
 * create a new reservation, use body
 */
function post(req, res, next) {
  var body = req.body;
  if (typeof body.guests !== 'object' || body.guests.length === 0) {
    return next(error.Boom.badRequest('missing guests'));
  }

  body.timeLastEdit = new Date().getTime();
  var reservation = new Reservations(body);
  debug('reservation', reservation);
  reservation.makeReservation(function (err, newReservation) {
    if (err) {
      debug('err making reservation', err);
      return next(err);
    }
    res.json(newReservation);
  });
}

/**
 * get reservation, query is search terms
 */
function get(req, res, next) {
  var query = req.query;
  Reservations
    .find(query)
    .populate('guests')
    .populate('rooms')
    .exec(function(err, reservations) {
    if (err) {
      return next(err);
    }
    res.json(reservations);
  });
}

/**
 * delete reservation, params has id
 */
function del (req, res, next) {
  var id = req.params.id;
  Reservations.remove({_id: id}, function(err) {
    if (err) {
      return next(err);
    }
    res.end();
  });
}

/**
 * update reservation, params has id, body is data
 */
function patch (req, res, next) {
  var id = req.params.id;
  var data = req.body;
  if (!data) {
    return next(error.Boom.badRequest('missing update data'));
  }
  data.timeLastEdit = new Date().getTime();

  // reserve if room passed
  if (data.rooms && data.rooms.length !== 0) {
    return Reservations.findOne({
      _id: id
    }, function(err, reservation) {
      if (err) { return next(err); }
      reservation.set(data);
      reservation.makeReservation(respond);
    });
  }

  Reservations.update({
    _id: id,
    timeLastEdit: {
      $lt: data.timeLastEdit
    }
  }, data, respond);
  function respond (err, updated) {
    if (err) {
      return next(err);
    }
    // if nothing updated say so
    if (!updated) {
      return res.status(304).end();
    }
    res.status(200).end();
  }
}

module.exports.post = post;
module.exports.get = get;
module.exports.del = del;
module.exports.patch = patch;
