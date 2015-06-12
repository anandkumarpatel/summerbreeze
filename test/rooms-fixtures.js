'use strict';
require('../lib/loadConfig.js');
require('../lib/models/rooms/mongo-schema.js');
var expect = require('code').expect;
var chance = require('chance').Chance();
var request = require('request');
var C = process.env.C_ROOM;

var testRoom = {
  number: 1,
  smoking: false,
  beds: 1,
  status: C.status.avalible,
  comment: 'upstairs'
};

function getTestData() {
  return JSON.parse(JSON.stringify(testRoom));
}

function postRoom(info, cb) {
  request({
    method: 'POST',
    url: 'http://localhost:' + process.env.PORT + '/rooms',
    json: info
  }, cb);
}

function createBasicRoom(cb) {
  var data = getTestData();
  postRoom(data, function(err, res, body) {
    if (err) {
      return cb(err);
    }
    expect(res.statusCode).to.equal(200);
    expect(body).to.contain(data);
    cb(null, body);
  });
}

function createRandomRoom(number, cb) {
  var data = {
    number: number,
    smoking: chance.bool(),
    beds: chance.integer({min: 1, max: 2}),
    status: chance.integer({min: 1, max: 2}),
    comment: chance.string()
  };
  postRoom(data, function(err, res, body) {
    if (err) {
      return cb(err);
    }
    expect(res.statusCode).to.equal(200);
    expect(body).to.contain(data);
    cb(null, body);
  });
}

function getRoom(query, cb) {
  request({
    method: 'GET',
    url: 'http://localhost:' + process.env.PORT + '/rooms',
    qs: query
  }, cb);
}

function deleteRoom(id, cb) {
  request({
    method: 'DELETE',
    url: 'http://localhost:' + process.env.PORT + '/rooms/' + id,
  }, cb);
}

function patchRoom(id, info, cb) {
  request({
    method: 'PATCH',
    url: 'http://localhost:' + process.env.PORT + '/rooms/' + id,
    json: info
  }, cb);
}

module.exports.getTestData = getTestData;
module.exports.postRoom = postRoom;
module.exports.createBasicRoom = createBasicRoom;
module.exports.createRandomRoom = createRandomRoom;
module.exports.getRoom = getRoom;
module.exports.deleteRoom = deleteRoom;
module.exports.patchRoom = patchRoom;
module.exports.C = C;