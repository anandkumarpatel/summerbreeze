'use strict';
require('../lib/loadConfig.js');
var expect = require('code').expect;
var request = require('request');

var C = process.env.C_RESERVATION;
var testReservationLength = 5;
var testRate = 123.41;

var testReservationData = {
  checkIn: stripeTime(new Date()).getTime(),
  checkOut: stripeTime(addDays(new Date(), testReservationLength)).getTime(),
  rate: testRate,
  paymentType: C.paymentType.cash,
  status: C.status.notIn,
  comment: 'late checking'
};

function stripeTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  return new Date(date.getTime() + days*24*60*60*1000);
}

function expectReservationMatch(a,b) {
  expect(a.checkIn).to.equal(b.checkIn);
  expect(a.checkOut).to.equal(b.checkOut);
  expect(a.rate).to.equal(b.rate);
  expect(a.paymentType).to.equal(b.paymentType);
  expect(a.status).to.equal(b.status);
  expect(a.comment).to.equal(b.comment);
  expect(a.guests).to.deep.contain(b.guests);
}

function expectArrayToContainReservation (array, a) {
  array.forEach(function(item) {
    if (item._id === a._id) {
      expectReservationMatch(item, a);
    }
  });
}


function postReservation (info, cb) {
  request({
    method: 'POST',
    url: 'http://localhost:' + process.env.PORT + '/Reservations',
    json: info
  }, function(err, res, body) {
    if (err) { return cb(err); }
    delete body.timeLastEdit;
    cb(null, res, body);
  });
}

function createBasicReservation (guests, cb) {
  testReservationData.guests = [guests._id];
  postReservation(testReservationData, function(err, res, body) {
    if (err) {
      return cb(err);
    }
    expect(res.statusCode).to.equal(200);
    expect(body).to.deep.contain(testReservationData);
    testReservationData = body;
    testReservationData.guests = guests;
    cb(null, body);
  });
}

function getReservation (query, cb) {
  request({
    method: 'GET',
    url: 'http://localhost:' + process.env.PORT + '/Reservations',
    qs: query
  }, cb);
}

function deleteReservation (id, cb) {
  request({
    method: 'DELETE',
    url: 'http://localhost:' + process.env.PORT + '/Reservations/'+id,
  }, cb);
}

function patchReservation (id, info, cb) {
  request({
    method: 'PATCH',
    url: 'http://localhost:' + process.env.PORT + '/Reservations/'+id,
    json: info
  }, cb);
}

module.exports.stripeTime = stripeTime;
module.exports.addDays = addDays;
module.exports.expectReservationMatch = expectReservationMatch;
module.exports.expectArrayToContainReservation = expectArrayToContainReservation;
module.exports.postReservation = postReservation;
module.exports.createBasicReservation = createBasicReservation;
module.exports.getReservation = getReservation;
module.exports.deleteReservation = deleteReservation;
module.exports.patchReservation = patchReservation;

module.exports.C = C;
module.exports.testReservationLength = testReservationLength;
module.exports.testRate = testRate;
module.exports.testReservationData = testReservationData;