'use strict';
var Reservations = require('./class.js');
var error = require('../../helpers/error.js');

/**
 * create a new reservation, use body
 */
// need to validate future dates:
// require GuestSchema
function post(req, res, next) {
  var body = req.body;
  if (typeof body.guests !== 'object') {
    return next(error.Boom.badRequest('missing guests'));
  }
  var reservation = new Reservations(body);
  reservation.save(function(err, newReservation) {
    if (err) {
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
    .exec(function(err, reservation) {
    if (err) {
      return next(err);
    }
    res.json(reservation);
  });
}


/**
 * delete reservation, params has id
 */
function del (req, res, next) {
  var id = req.params.id;
  Reservations.findByIdAndRemove(id, function(err) {
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
  console.log('mwid', id);
  Reservations.update({
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
