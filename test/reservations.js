'use strict';
require('../lib/loadConfig.js');
var expect = require('code').expect;
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var it = lab.test;

var app = require('../lib/app.js');
var mongo = require('../lib/helpers/mongo.js');

var guests = require('./guests-fixtures.js');
var rooms = require('./rooms-fixtures.js');
var R = require('./reservations-fixtures.js');
var stripeTime = R.stripeTime;
var addDays = R.addDays;
var expectArrayToContainReservation = R.expectArrayToContainReservation;
var postReservation = R.postReservation;
var createBasicReservation = R.createBasicReservation;
var getReservation = R.getReservation;
var deleteReservation = R.deleteReservation;
var patchReservation = R.patchReservation;
var C = R.C;
var testReservationLength = R.testReservationLength;
var testRate = R.testRate;
function getTestData() {
  return JSON.parse(JSON.stringify(R.testReservationData));
}
var testReservationData = JSON.parse(JSON.stringify(R.testReservationData));

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
    guests.createBasicGuest(function(err, guest) {
      if (err) { return done(err); }
      ctx.guest = guest;
      done();
    });
  });
  beforeEach(function(done) {
    rooms.createBasicRoom(function(err, room) {
      if (err) { return done(err); }
      ctx.room = room;
      done();
    });
  });
  afterEach(function(done) {
    app.stop(done);
  });
  describe('POST /Reservations', function() {
    describe('valid', function() {
      it('should create reservation without room', function(done) {
        createBasicReservation(ctx.guest, done);
      });
      it('should create reservation with room', function(done) {
        var data = JSON.parse(JSON.stringify(R.testReservationData));
        data.rooms = [ctx.room._id];
        data.guests = [ctx.guest._id];
        postReservation(data, done);
      });
    }); // valid
    describe('invalid', function() {
      describe('missing keys', function() {
        ['checkIn', 'checkOut', 'rate', 'paymentType', 'status'].forEach(function(key) {
          it('should error if missing ' + key, function(done) {
            var info = JSON.parse(JSON.stringify(testReservationData));
            delete info[key];
            info.guests = [ctx.guest._id];
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
      });
      describe('no room', function() {
        it('should error if no rooms left and no room specified', function(done) {
          createBasicReservation(ctx.guest, function(err) {
            if (err) { return done(err); }
            var data = getTestData();
            data.guests = [ctx.guest._id];
            postReservation(data, function(err, res, body) {
              expect(res.statusCode).to.equal(409);
              expect(body.output.payload.message).to.equal('no more rooms avalible');
              done();
            });
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
        rooms.createRandomRoom(2, function(err, room) {
          if (err) { return done(err); }
          ctx.room2 = room;
          r2.rooms = [room._id];
          done();
        });
      });
      beforeEach(function(done) {
        rooms.createRandomRoom(3, function(err, room) {
          if (err) { return done(err); }
          ctx.room3 = room;
          done();
        });
      });
      beforeEach(function(done) {
        createBasicReservation(ctx.guest, done);
      });
      beforeEach(function(done) {
        guests.createRandomGuest(function(err, guest) {
          if (err) { return done(err); }
          ctx.guest2 = guest;
          r2.guests = [guest._id];
          done();
        });
      });
      beforeEach(function(done) {
        guests.createRandomGuest(function(err, guest) {
          if (err) { return done(err); }
          ctx.guest3 = guest;
          r3.guests = [guest._id];
          done();
        });
      });
      beforeEach(function(done) {
        postReservation(r2, function(err, res, body) {
          if (err) { return done(err); }
          ctx.reservation2 = body;
          ctx.reservation2.guests = ctx.guest2;
          done();
        });
      });
      beforeEach(function(done) {
        postReservation(r3, function(err, body) {
          if (err) { return done(err); }
          ctx.reservation3 = body;
          ctx.reservation3.guests = ctx.guest3;
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
          expect(body).to.have.length(2);
          expectArrayToContainReservation(body, testReservationData);
          expectArrayToContainReservation(body, ctx.reservation2);
          done();
        });
      });
      describe('room with guest', function() {
        it('should get reservation by guest', function(done) {
          getReservation({
            guests: ctx.guest2._id
          }, function(err, res, body) {
            if (err) { return done(err); }
            body = JSON.parse(body);
            expect(body).to.have.length(1);
            expectArrayToContainReservation(body, ctx.reservation2);
            done();
          });
        });
      });
      it('should get reservation by room');
    }); // valid
  }); // GET /Reservations
  describe('DELETE /Reservation/:id', function() {
    describe('valid', function() {
      it('should delete Reservation', function(done) {
        createBasicReservation(ctx.guest, function(err, Reservation) {
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
        createBasicReservation(ctx.guest, function(err, Reservation) {
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
          createBasicReservation(ctx.guest, function(err, Reservation) {
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
        createBasicReservation(ctx.guest, function(err, Reservation) {
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