'use strict'
require('../lib/loadConfig.js')
require('../lib/models/reservations/mongo-schema.js')

var expect = require('code').expect
var request = require('request')
var chance = require('chance').Chance()

var C = process.env.C_RESERVATION
var testReservationLength = 5
var testRate = 123.41
var testTaxRate = 12.52

var testReservationData = {
  checkIn: stripeTime(new Date()).getTime(),
  checkOut: stripeTime(addDays(new Date(), testReservationLength)).getTime(),
  rate: testRate,
  taxRate: testTaxRate,
  status: C.status.notIn,
  roomsRequested: 1,
  comment: 'late checking'
}

function getTestData () {
  return JSON.parse(JSON.stringify(testReservationData))
}

function stripeTime (date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays (date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}
/**
 * create relative room
 * @param  {array} guests  guest array
 * @param  {array} rooms   array of rooms
 * @param  {int}   inDays  relative num days from today
 * @param  {int}   outDays relative num days from today
 * @param  {int}   status  reservation status
 * @return {object}        data to post with room
 */
function genResData (guests, rooms, inDays, outDays, status) {
  var today = stripeTime(new Date())
  var out = {
    checkIn: addDays(today, inDays).getTime(),
    checkOut: addDays(today, outDays).getTime(),
    guests: guests,
    rate: chance.floating({min: 0, max: 100, fixed: 2}),
    taxRate: chance.floating({min: 0, max: 10, fixed: 2}),
    paymentType: chance.integer({min: 1, max: 2}),
    status: status,
    roomsRequested: rooms.length || rooms,
    comment: chance.string({length: 10})
  }
  if (rooms.length) {
    out.rooms = rooms
  }
  return out
}

function expectReservationMatch (a, b) {
  expect(a.checkIn).to.equal(b.checkIn)
  expect(a.checkOut).to.equal(b.checkOut)
  expect(a.roomsRequested).to.equal(b.roomsRequested)
  expect(a.rate).to.equal(b.rate)
  expect(a.taxRate).to.equal(b.taxRate)
  expect(a.payments).to.deep.equal(b.payments)
  expect(a.status).to.equal(b.status)
  expect(a.comment).to.equal(b.comment)
  expect(a.guests).to.deep.contain(b.guests)
}

function expectArrayToContainReservation (array, a) {
  array.forEach(function (item) {
    if (item._id === a._id) {
      expectReservationMatch(item, a)
    }
  })
}

function postReservation (info, cb) {
  request({
    method: 'POST',
    url: 'http://localhost:' + process.env.PORT + '/Reservations',
    json: info
  }, function (err, res, body) {
    if (err) { return cb(err) }
    delete body.timeLastEdit
    cb(null, res, body)
  })
}

function createBasicReservation (guests, cb) {
  var data = getTestData()
  data.guests = [guests._id]
  postReservation(data, function (err, res, body) {
    if (err) { return cb(err) }
    expect(res.statusCode).to.equal(200)
    cb(null, body)
  })
}

function getReservation (query, cb) {
  request({
    method: 'GET',
    url: 'http://localhost:' + process.env.PORT + '/Reservations',
    qs: query
  }, cb)
}

function deleteReservation (id, cb) {
  request({
    method: 'DELETE',
    url: 'http://localhost:' + process.env.PORT + '/Reservations/' + id
  }, cb)
}

module.exports.stripeTime = stripeTime
module.exports.addDays = addDays
module.exports.expectReservationMatch = expectReservationMatch
module.exports.expectArrayToContainReservation = expectArrayToContainReservation
module.exports.postReservation = postReservation
module.exports.createBasicReservation = createBasicReservation
module.exports.getReservation = getReservation
module.exports.deleteReservation = deleteReservation
module.exports.genResData = genResData

module.exports.C = C
module.exports.testReservationLength = testReservationLength
module.exports.testRate = testRate
module.exports.testTaxRate = testTaxRate
module.exports.getTestData = getTestData
