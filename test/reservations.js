'use strict';
require('../lib/loadConfig.js');
var expect = require('code').expect;
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;
var it = lab.test;

var mongoose = require('mongoose');

var app = require('../lib/app.js');
var mongo = require('../lib/helpers/mongo.js');
var Reservations = require('../lib/models/reservations/class.js');
var guests = require('./guests-fixtures.js');
var rooms = require('./rooms-fixtures.js');

var R = require('./reservations-fixtures.js');

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
        R.createBasicReservation(ctx.guest, done);
      });
      it('should create reservation with room', function(done) {
        var data = R.getTestData();
        data.rooms = [ctx.room._id];
        data.guests = [ctx.guest._id];
        R.postReservation(data, done);
      });
    }); // valid
    describe('invalid', function() {
      describe('missing keys', function() {
        ['checkIn', 'checkOut', 'rate', 'paymentType', 'status', 'roomsRequested']
          .forEach(function(key) {
          it('should error if missing ' + key, function(done) {
            var info = R.getTestData();
            delete info[key];
            info.guests = [ctx.guest._id];
            R.postReservation(info, function(err, res, body) {
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
      it('should error if guest does not exist', function(done) {
        var data = R.getTestData();
        data.guests = [new mongoose.Types.ObjectId()];

        R.postReservation(data, function(err, res, body) {
          expect(res.statusCode).to.equal(400);
          expect(body.output.payload.message).to.equal('guest not found');
          Reservations.find({}, function(err, body) {
            if (err) { return done(err); }
            expect(body.length).to.equal(0);
            done();
          });
        });
      });
      it('should error if guest invalid type', function(done) {
        var data = R.getTestData();
        data.guests = ['fake'];

        R.postReservation(data, function(err, res, body) {
          expect(res.statusCode).to.equal(400);
          expect(body.name).to.equal('CastError');
          expect(body.path).to.equal('guests');
          Reservations.find({}, function(err, body) {
            if (err) { return done(err); }
            expect(body.length).to.equal(0);
            done();
          });
        });
      });
      describe('room errors', function() {
        it('should error if no rooms left and no room specified', function(done) {
          R.createBasicReservation(ctx.guest, function(err) {
            if (err) { return done(err); }
            var data = R.getTestData();
            data.guests = [ctx.guest._id];
            R.postReservation(data, function(err, res, body) {
              expect(res.statusCode).to.equal(409);
              expect(body.output.payload.message).to.equal('no more rooms avalible');
              Reservations.find({}, function(err, body) {
                if (err) { return done(err); }
                expect(body.length).to.equal(1);
                done();
              });
            });
          });
        });
        it('should error if rooms already reserved', function(done) {
          var data = R.getTestData();
          data.guests = [ctx.guest._id];
          data.rooms = [ctx.room._id];
          R.postReservation(data, function(err) {
            if (err) { return done(err); }
            R.postReservation(data, function(err, res, body) {
              expect(res.statusCode).to.equal(409);
              expect(body.output.payload.message).to.equal('room already reserved');
              Reservations.find({}, function(err, body) {
                if (err) { return done(err); }
                expect(body.length).to.equal(1);
                done();
              });
            });
          });
        });
        it('should error if room does not exist', function(done) {
          var data = R.getTestData();
          data.guests = [ctx.guest._id];
          data.rooms = [new mongoose.Types.ObjectId()];

          R.postReservation(data, function(err, res, body) {
            expect(res.statusCode).to.equal(400);
            expect(body.output.payload.message).to.equal('room not found');
            Reservations.find({}, function(err, body) {
              if (err) { return done(err); }
              expect(body.length).to.equal(0);
              done();
            });
          });
        });
        it('should error if room invalid type', function(done) {
          var data = R.getTestData();
          data.guests = [ctx.guest._id];
          data.rooms = ['fake'];

          R.postReservation(data, function(err, res, body) {
            expect(res.statusCode).to.equal(400);
            expect(body.name).to.equal('CastError');
            expect(body.path).to.equal('rooms');
            Reservations.find({}, function(err, body) {
              if (err) { return done(err); }
              expect(body.length).to.equal(0);
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
        checkIn: R.stripeTime(new Date()).getTime(),
        checkOut: R.stripeTime(R.addDays(new Date(), R.testReservationLength)).getTime(),
        rate: R.testRate,
        paymentType: R.C.paymentType.creditCard,
        status: R.C.status.notIn,
        roomsRequested: 1,
        comment: 'dog'
      };
      var r3 = {
        checkIn: R.stripeTime(R.addDays(new Date(), 1)).getTime(),
        checkOut: R.stripeTime(R.addDays(new Date(), 6)).getTime(),
        rate: R.testRate,
        paymentType: R.C.paymentType.cash,
        status: R.C.status.canceled,
        roomsRequested: 1,
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
        R.createBasicReservation(ctx.guest, done);
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
        R.postReservation(r2, function(err, res, body) {
          if (err) { return done(err); }
          ctx.reservation2 = body;
          ctx.reservation2.guests = ctx.guest2;
          done();
        });
      });
      beforeEach(function(done) {
        R.postReservation(r3, function(err, body) {
          if (err) { return done(err); }
          ctx.reservation3 = body;
          ctx.reservation3.guests = ctx.guest3;
          done();
        });
      });
      it('should get Reservation from paymentType', function(done) {
        R.getReservation({
          paymentType: R.C.paymentType.creditCard
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          expect(body).to.have.length(1);
          R.expectArrayToContainReservation(body, ctx.reservation2);
          done();
        });
      });
      it('should get Reservations from status', function(done) {
        R.getReservation({
          status: R.C.status.notIn
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          expect(body).to.have.length(2);
          R.expectArrayToContainReservation(body, R.getTestData());
          R.expectArrayToContainReservation(body, ctx.reservation2);
          done();
        });
      });
      describe('reservation with guest', function() {
        it('should get reservation by guest', function(done) {
          R.getReservation({
            guests: ctx.guest2._id
          }, function(err, res, body) {
            if (err) { return done(err); }
            body = JSON.parse(body);
            expect(body).to.have.length(1);
            R.expectArrayToContainReservation(body, ctx.reservation2);
            done();
          });
        });
      });
      describe('reservation with room', function() {
        it('should get reservation by room', function(done) {
          R.getReservation({
            rooms: ctx.room2._id
          }, function(err, res, body) {
            if (err) { return done(err); }
            body = JSON.parse(body);
            expect(body).to.have.length(1);
            R.expectArrayToContainReservation(body, ctx.reservation2);
            done();
          });
        });
      });
    }); // valid
  }); // GET /Reservations
  describe('DELETE /Reservation/:id', function() {
    describe('valid', function() {
      it('should delete Reservation', function(done) {
        R.createBasicReservation(ctx.guest, function(err, Reservation) {
          if (err) { return done(err); }
          R.deleteReservation(Reservation._id, function(err, res) {
            if (err) { return done(err); }
            expect(res.statusCode).to.equal(200);
            R.getReservation({number: R.getTestData().number}, function(err, res, body) {
              if (err) { return done(err); }
              body = JSON.parse(body);
              expect(body).to.be.empty();
              done();
            });
          });
        });
      });
      it('should do nothing if no id found', function(done) {
        R.createBasicReservation(ctx.guest, function(err, Reservation) {
          if (err) { return done(err); }
          R.deleteReservation(Reservation._id, function(err, res) {
            if (err) { return done(err); }
            expect(res.statusCode).to.equal(200);
            R.deleteReservation(Reservation._id, function(err, res) {
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
        R.deleteReservation('', function(err, res) {
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
        'checkOut': R.stripeTime(R.addDays(new Date(), 9)).getTime(),
        'rate': 5,
        'paymentType': R.C.paymentType.creditCard,
        'cardNumber': 2352463,
        'status': R.C.status.checkOut,
        'comment': 'something'
      };
      function testUpdates (key) {
        return function (done) {
          R.createBasicReservation(ctx.guest, function(err, Reservation) {
            if (err) { return done(err); }
            var update = {};
            update[key] = testVals[key];
            R.patchReservation(Reservation._id, update, function(err, res) {
              if (err) { return done(err); }
              expect(res.statusCode).to.equal(200);
              R.getReservation({_id: Reservation._id}, function(err, res, body) {
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
        R.createBasicReservation(ctx.guest, function(err, Reservation) {
          if (err) { return done(err); }
          R.patchReservation(Reservation._id, testVals, function(err, res) {
            if (err) { return done(err); }
            expect(res.statusCode).to.equal(200);
            R.getReservation({_id: Reservation._id}, function(err, res, body) {
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