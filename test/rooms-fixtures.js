'use strict';
require('../lib/loadConfig.js');
var expect = require('code').expect;

var request = require('request');

var testRoom = {
  number: 1,
  smoking: false,
  beds: 1,
  status: 'ok',
  comment: 'upstairs'
};

function postRoom(info, cb) {
  request({
    method: 'POST',
    url: 'http://localhost:' + process.env.PORT + '/rooms',
    json: info
  }, cb);
}

function createBasicRoom(cb) {
  var data = JSON.parse(JSON.stringify(testRoom));
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

module.exports.testRoom = testRoom;
module.exports.postRoom = postRoom;
module.exports.createBasicRoom = createBasicRoom;
module.exports.getRoom = getRoom;
module.exports.deleteRoom = deleteRoom;
module.exports.patchRoom = patchRoom;