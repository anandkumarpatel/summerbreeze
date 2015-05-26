'use strict';
require('../lib/loadConfig.js');
var expect = require('code').expect;
var chance = require('chance').Chance();

var request = require('request');
var testGuest = {
  firstName: 'anand',
  lastName: 'patel',
  address: '1241 front beach road',
  dateOfBirth: new Date('05/10/1989').getTime(),
  idNumber: '474556356',
  comment: 'good guy'
};

function getTestData() {
  return JSON.parse(JSON.stringify(testGuest));
}

function postGuest (info, cb) {
  request({
    method: 'POST',
    url: 'http://localhost:' + process.env.PORT + '/guests',
    json: info
  }, cb);
}

function createBasicGuest (cb) {
  var data = getTestData();
  postGuest(data, function(err, res, body) {
    if (err) {
      return cb(err);
    }
    expect(res.statusCode).to.equal(200);
    expect(body).to.contain(data);
    cb(null, body);
  });
}

function createRandomGuest (cb) {
  var guest = {
    firstName: chance.last(),
    lastName: chance.last(),
    address: chance.address(),
    dateOfBirth: chance.birthday().getTime(),
    idNumber: chance.ssn({ dashes: false }),
    comment: chance.string()
  };
  postGuest(guest, function(err, res, body) {
    if (err) {
      return cb(err);
    }
    cb(null, body);
  });
}

function getGuest (query, cb) {
  request({
    method: 'GET',
    url: 'http://localhost:' + process.env.PORT + '/guests',
    qs: query
  }, cb);
}

function deleteGuest (id, cb) {
  request({
    method: 'DELETE',
    url: 'http://localhost:' + process.env.PORT + '/guests/'+id,
  }, cb);
}

function patchGuest (id, info, cb) {
  request({
    method: 'PATCH',
    url: 'http://localhost:' + process.env.PORT + '/guests/'+id,
    json: info
  }, cb);
}

module.exports.getTestData = getTestData;
module.exports.postGuest = postGuest;
module.exports.createBasicGuest = createBasicGuest;
module.exports.getGuest = getGuest;
module.exports.deleteGuest = deleteGuest;
module.exports.patchGuest = patchGuest;
module.exports.createRandomGuest = createRandomGuest;
