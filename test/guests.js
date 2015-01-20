'use strict';

var expect = require('code').expect;
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var it = lab.test;

var createCount = require('callback-count');

var app = require('../lib/app.js');
var mongo = require('../lib/helpers/mongo.js');

// fixtures
var f = require('./guests-fixtures.js');
var testGuest = f.testGuest;
var postGuest = f.postGuest;
var createBasicGuest = f.createBasicGuest;
var getGuest = f.getGuest;
var deleteGuest = f.deleteGuest;
var patchGuest = f.patchGuest;

describe('Guests', function() {
  beforeEach(function(done) {
    app.start(done);
  });
  beforeEach(function(done) {
    mongo.dropDatabase(done);
  });
  afterEach(function(done) {
    app.stop(done);
  });
  describe('POST /guests', function() {
    describe('valid', function() {
      it('should create guest', createBasicGuest);
      it('should create 2 guests with different name', function(done) {
        var count = createCount(2, done);
        var guest2 = JSON.parse(JSON.stringify(testGuest));
        guest2.firstName = 'nancy';
        createBasicGuest(count.next);
        postGuest(guest2, count.next);
      });
    }); // valid
    describe('invalid', function() {
      ['firstName','lastName','address','dateOfBirth','idNumber'].forEach(function(key) {
        it('should error if missing ' + key, function(done) {
          var info = JSON.parse(JSON.stringify(testGuest));
          delete info[key];
          postGuest(info, function(err, res, body) {
            if (err) {
              return done(err);
            }
            expect(res.statusCode).to.equal(400);
            expect(body.name).to.equal('ValidationError');
            expect(body.errors[key]).to.exist();
            done();
          });
        });
      });
    }); // invalid
  }); // POST /guests
  describe('GET /guests', function() {
    describe('valid', function() {
      var guest2 = {
        firstName: 'nancy',
        lastName: 'patel',
        address: '1241 some road',
        dateOfBirth: new Date('06/05/1990').getTime(),
        idNumber: '2523452345',
        comment: 'good girl'
      };
      var guest3 = {
        firstName: 'waldo',
        lastName: 'kumar',
        address: '1241 some road',
        dateOfBirth: new Date('01/01/2010').getTime(),
        idNumber: '534734577',
        comment: 'random'
      };
      beforeEach(createBasicGuest);
      beforeEach(function(done) {
        postGuest(guest2, done);
      });
      beforeEach(function(done) {
        postGuest(guest3, done);
      });
      it('should get guest from firstName', function(done) {
        getGuest({
          firstName: 'anand',
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          expect(body).to.have.length(1);
          expect(body[0]).to.deep.include(testGuest);
          done();
        });
      });
      it('should get guests from lastName', function(done) {
        getGuest({
          lastName: 'patel',
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          body = body.filter(function(item) {
            delete item.__v;
            delete item._id;
            return item;
          });
          expect(body).to.have.length(2);
          expect(body).to.deep.contain(testGuest);
          expect(body).to.deep.contain(guest2);
          done();
        });
      });
      it('should get guests from address', function(done) {
        getGuest({
          address: '1241 some road',
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          body = body.filter(function(item) {
            delete item.__v;
            delete item._id;
            return item;
          });
          expect(body).to.have.length(2);
          expect(body).to.deep.contain(guest2);
          expect(body).to.deep.contain(guest3);
          done();
        });
      });
      it('should get guests from dateOfBirth', function(done) {
        getGuest({
          dateOfBirth: new Date('06/05/1990').getTime(),
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          body = body.filter(function(item) {
            delete item.__v;
            delete item._id;
            return item;
          });
          expect(body).to.have.length(1);
          expect(body).to.deep.contain(guest2);
          done();
        });
      });
      it('should get guests from idNumber', function(done) {
        getGuest({
          idNumber: '534734577',
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          body = body.filter(function(item) {
            delete item.__v;
            delete item._id;
            return item;
          });
          expect(body).to.have.length(1);
          expect(body).to.deep.contain(guest3);
          done();
        });
      });
      it('should get guests from comment', function(done) {
        getGuest({
          comment: 'random'
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          body = body.filter(function(item) {
            delete item.__v;
            delete item._id;
            return item;
          });
          expect(body).to.have.length(1);
          expect(body).to.deep.contain(guest3);
          done();
        });
      });
      it('should get guests that match status and guests', function(done) {
        getGuest({
          lastName: 'patel',
          address: '1241 some road',
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          body = body.filter(function(item) {
            delete item.__v;
            delete item._id;
            return item;
          });
          expect(body).to.have.length(1);
          expect(body[0]).to.deep.equal(guest2);
          done();
        });
      });
      it('should get all guests if no query passed', function(done) {
        getGuest({}, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          body = body.filter(function(item) {
            delete item.__v;
            delete item._id;
            return item;
          });
          expect(body).to.have.length(3);
          expect(body).to.deep.contain(guest2);
          expect(body).to.deep.contain(guest3);
          expect(body).to.deep.contain(testGuest);
          done();
        });
      });
      it('should return empty if no match', function(done) {
        getGuest({
          guest: 3
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          expect(body).to.be.empty();
          done();
        });
      });

    }); // valid
  }); // GET /guests
  describe('DELETE /guest/:id', function() {
    describe('valid', function() {
      it('should delete guest', function(done) {
        createBasicGuest(function(err, guest) {
          if (err) { return done(err); }
          deleteGuest(guest._id, function(err, res) {
            if (err) { return done(err); }
            expect(res.statusCode).to.equal(200);
            getGuest({number: testGuest.number}, function(err, res, body) {
              if (err) { return done(err); }
              body = JSON.parse(body);
              expect(body).to.be.empty();
              done();
            });
          });
        });
      });
      it('should do nothing if no id found', function(done) {
        createBasicGuest(function(err, guest) {
          if (err) { return done(err); }
          deleteGuest(guest._id, function(err, res) {
            if (err) { return done(err); }
            expect(res.statusCode).to.equal(200);
            deleteGuest(guest._id, function(err, res) {
              if (err) { return done(err); }
              expect(res.statusCode).to.equal(200);
              done();
            });
          });
        });
      });
    }); // valid
    describe('invalid', function() {
      it('should error if no id sent', function(done) {
        deleteGuest('', function(err, res) {
          if (err) { return done(err); }
          expect(res.statusCode).to.equal(404);
          done();
        });
      });
    }); // invalid
  }); // DELETE /guest/:id'
  describe('PATCH /guest/:id', function() {
    describe('valid', function() {
      var testVals = {
        firstName: 'dnana',
        lastName: 'letap',
        address: '333 freemont st',
        dateOfBirth: new Date('12/12/1900').getTime(),
        idNumber: '3838383849',
        comment: 'interesting guy'
      };
      function testUpdates (key) {
        return function (done) {
          createBasicGuest(function(err, guest) {
            if (err) { return done(err); }
            var update = {};
            update[key] = testVals[key];
            patchGuest(guest._id, update, function(err, res) {
              if (err) { return done(err); }
              expect(res.statusCode).to.equal(200);
              getGuest({_id: guest._id}, function(err, res, body) {
                if (err) { return done(err); }
                body = JSON.parse(body);
                expect(body).to.have.length(1);
                expect(body[0][key]).to.equal(testVals[key]);
                done();
              });
            });
          });
        };
      }
      for (var item in testVals) {
        it('should update ' + item, testUpdates(item));
      }
      it('should update all', function(done) {
        createBasicGuest(function(err, guest) {
          if (err) { return done(err); }
          patchGuest(guest._id, testVals, function(err, res) {
            if (err) { return done(err); }
            expect(res.statusCode).to.equal(200);
            getGuest({_id: guest._id}, function(err, res, body) {
              if (err) { return done(err); }
              body = JSON.parse(body);
              expect(body).to.have.length(1);
              expect(body[0]).to.deep.include(testVals);
              done();
            });
          });
        });
      });
    }); // valid
  }); // PATCH /guest/:id
});