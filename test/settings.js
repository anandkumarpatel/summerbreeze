'use strict';
require('../lib/loadConfig.js');
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var after = lab.after;
var afterEach = lab.afterEach;
var before = lab.before;
var beforeEach = lab.beforeEach;
var Code = require('code');
var expect = Code.expect;
var request = require('request');

var app = require('../lib/app.js');
var mongo = require('../lib/helpers/mongo.js');
var Settings = require('../lib/models/settings/class.js');

function getSettings(cb) {
  request({
    method: 'GET',
    url: 'http://localhost:' + process.env.PORT + '/settings'
  }, cb);
}

function patchSettings(info, cb) {
  request({
    method: 'PATCH',
    url: 'http://localhost:' + process.env.PORT + '/settings',
    json: info
  }, cb);
}

describe('settings.js functional test', function () {
  beforeEach(app.start);
  beforeEach(mongo.dropDatabase);
  afterEach(app.stop);

  describe('GET /settings', function() {
    var testSettings = {
      taxRate: 13.41
    };
    beforeEach(function(done) {
      var settings = new Settings(testSettings);
      settings.save(done);
    });
    it('should return settings object', function(done) {
      getSettings(function (err, res, body) {
        if (err) { return done(err); }
        body = JSON.parse(body);
        expect(testSettings).to.deep.equal(body);
        done();
      });
    });
  });
  describe('PATCH /settings', function() {
    var testSettings = {
      taxRate: 11.11
    };
    var testUpdate = {
      taxRate: 77.77
    };
    beforeEach(function(done) {
      var guest = new Settings(testSettings);
      guest.save(done);
    });
    it('should update setting object', function(done) {
      patchSettings(testUpdate, function (err) {
        if (err) { return done(err); }
        getSettings(function (err, res, body) {
          body = JSON.parse(body);
          expect(testUpdate).to.deep.equal(body);
          done();
        });

      });
    });
  });
});