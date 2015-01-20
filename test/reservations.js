'use strict';
require('../lib/loadConfig.js');
var expect = require('code').expect;
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var it = lab.test;

var request = require('request');

var app = require('../lib/app.js');
var mongo = require('../lib/helpers/mongo.js');

var guests = require('./guests-fixtures.js');

function stripeTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  return new Date(date.getTime() + days*24*60*60*1000);
}
var C = process.env.C_RESERVATION;
var testReservationLength = 5;
var testRate = 123.41;

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

var testReservationData = {
  checkIn: stripeTime(new Date()).getTime(),
  checkOut: stripeTime(addDays(new Date(), testReservationLength)).getTime(),
  rate: testRate,
  paymentType: C.paymentType.cash,
  status: C.status.notIn,
  comment: 'late checking'
};

function postReservation (info, cb) {
  request({
    method: 'POST',
    url: 'http://localhost:' + process.env.PORT + '/Reservations',
    json: info
  }, cb);
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

describe('Reservations', function() {
  var ctx = {};
  beforeEach(function(done) {
    ctx = {};
    done();
  });
  beforeEach(function(done) {
    app.start(done);
  });
  beforeEach(function(done) {
    mongo.dropDatabase(done);
  });
  beforeEach(function(done) {
    guests.createBasicGuest(function(err, guests) {
      if (err) { return done(err); }
      ctx.guests = guests;
      done();
    });
  });
  afterEach(function(done) {
    app.stop(done);
  });
  describe('POST /Reservations', function() {
    describe('valid', function() {
      it('should create Reservation', function(done) {
        createBasicReservation(ctx.guests, done);
      });
    }); // valid
    describe('invalid', function() {
      ['checkIn', 'checkOut', 'rate', 'paymentType', 'status'].forEach(function(key) {
        it('should error if missing ' + key, function(done) {
          var info = JSON.parse(JSON.stringify(testReservationData));
          delete info[key];
          info.guests = [[ctx.guests._id]];
          postReservation(info, function(err, res, body) {
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
  }); // POST /Reservations
  describe('GET /Reservations', function() {
    describe('valid', function() {
      var r2 = {
        checkIn: stripeTime(new Date()).getTime(),
        checkOut: stripeTime(addDays(new Date(), testReservationLength)).getTime(),
        rate: testRate,
        paymentType: C.paymentType.creditCard,
        status: C.status.notIn,
        comment: 'dog'
      };
      var r3 = {
        checkIn: stripeTime(addDays(new Date(), 1)).getTime(),
        checkOut: stripeTime(addDays(new Date(), 6)).getTime(),
        rate: testRate,
        paymentType: C.paymentType.cash,
        status: C.status.canceled,
        comment: 'pet'
      };
      beforeEach(function(done) {
        createBasicReservation(ctx.guests, done);
      });
      beforeEach(function(done) {
        guests.createRandomGuest(function(err, guest) {
          if (err) { return done(err); }
          ctx.guests2 = guest;
          r2.guests = [guest._id];
          done();
        });
      });
      beforeEach(function(done) {
        guests.createRandomGuest(function(err, guest) {
          if (err) { return done(err); }
          ctx.guests3 = guest;
          r3.guests = [guest._id];
          done();
        });
      });
      beforeEach(function(done) {
        postReservation(r2, function(err, res, body) {
          if (err) { return done(err); }
          ctx.reservation2 = body;
          ctx.reservation2.guests = ctx.guests2;
          done();
        });
      });
      beforeEach(function(done) {
        postReservation(r3, function(err, body) {
          if (err) { return done(err); }
          ctx.reservation3 = body;
          ctx.reservation3.guests = ctx.guests3;
          done();
        });
      });
      it('should get Reservation from paymentType', function(done) {
        getReservation({
          paymentType: C.paymentType.creditCard
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          expect(body).to.have.length(1);
          expectArrayToContainReservation(body, ctx.reservation2);
          done();
        });
      });
      it('should get Reservations from status', function(done) {
        getReservation({
          status: C.status.notIn
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          expectArrayToContainReservation(body, testReservationData);
          expectArrayToContainReservation(body, ctx.reservation2);
          done();
        });
      });
      it('should get reservation buy guest');
      it('should get reservation buy room');
    }); // valid
  }); // GET /Reservations
  describe('DELETE /Reservation/:id', function() {
    describe('valid', function() {
      it('should delete Reservation', function(done) {
        createBasicReservation(ctx.guests, function(err, Reservation) {
          if (err) { return done(err); }
          deleteReservation(Reservation._id, function(err, res) {
            if (err) { return done(err); }
            expect(res.statusCode).to.equal(200);
            getReservation({number: testReservationData.number}, function(err, res, body) {
              if (err) { return done(err); }
              body = JSON.parse(body);
              expect(body).to.be.empty();
              done();
            });
          });
        });
      });
      it('should do nothing if no id found', function(done) {
        createBasicReservation(ctx.guests, function(err, Reservation) {
          if (err) { return done(err); }
          deleteReservation(Reservation._id, function(err, res) {
            if (err) { return done(err); }
            expect(res.statusCode).to.equal(200);
            deleteReservation(Reservation._id, function(err, res) {
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
        deleteReservation('', function(err, res) {
          if (err) { return done(err); }
          expect(res.statusCode).to.equal(404);
          done();
        });
      });
    }); // invalid
  }); // DELETE /Reservation/:id'
  describe('PATCH /Reservation/:id', function() {
    describe('valid', function() {
      var testVals = {
        'checkIn': new Date().getTime(),
        'checkOut': stripeTime(addDays(new Date(), 9)).getTime(),
        'rate': 5,
        'paymentType': C.paymentType.creditCard,
        'cardNumber': 2352463,
        'status': C.status.checkOut,
        'comment': 'something'
      };
      function testUpdates (key) {
        return function (done) {
          createBasicReservation(ctx.guests, function(err, Reservation) {
            if (err) { return done(err); }
            var update = {};
            update[key] = testVals[key];
            patchReservation(Reservation._id, update, function(err, res) {
              if (err) { return done(err); }
              expect(res.statusCode).to.equal(200);
              getReservation({_id: Reservation._id}, function(err, res, body) {
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
        createBasicReservation(ctx.guests, function(err, Reservation) {
          if (err) { return done(err); }
          patchReservation(Reservation._id, testVals, function(err, res) {
            if (err) { return done(err); }
            expect(res.statusCode).to.equal(200);
            getReservation({_id: Reservation._id}, function(err, res, body) {
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
  }); // PATCH /Reservation/:id
});