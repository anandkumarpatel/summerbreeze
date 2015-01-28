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
var R = require('./reservations-fixtures.js');
var G = require('./guests-fixtures.js');
var Room = require('./rooms-fixtures.js');

function getAvailablility(query, cb) {
  request({
    method: 'GET',
    url: 'http://localhost:' + process.env.PORT + '/availability',
    qs: query
  }, cb);
}

function createReservationForRange(ctx, name, checkIn, checkOut, cb) {
  var info = {
    checkIn: new Date('1/' + checkIn + '/2005').getTime(),
    checkOut: new Date('1/' + checkOut + '/2005').getTime(),
    rate: 100,
    paymentType: R.C.paymentType.cash,
    status: R.C.status.notIn,
    comment: 'late checking',
    roomsRequested: 1
  };
  G.createRandomGuest(function(err, guest) {
    if (err) {
      return cb(err);
    }
    info.guests = [guest._id];
    var testRoom = Room.getTestData();
    testRoom.number = checkIn + checkOut * 10;
    Room.postRoom(testRoom, function(err, res, room) {
      if (err) {
        return cb(err);
      }
      info.rooms = [room._id];
      R.postReservation(info, function(err, res, body) {
        if (err) {
          return cb(err);
        }
        ctx[name] = body;
        cb(null, body);
      });
    });
  });
}

function createReservationWith2Rooms(ctx, name, checkIn, checkOut, cb) {
  var info = {
    checkIn: new Date('1/' + checkIn + '/2005').getTime(),
    checkOut: new Date('1/' + checkOut + '/2005').getTime(),
    rate: 100,
    paymentType: R.C.paymentType.cash,
    status: R.C.status.notIn,
    comment: 'late checking',
    roomsRequested: 1
  };
  G.createRandomGuest(function(err, guest) {
    if (err) {
      return cb(err);
    }
    info.guests = [guest._id];
    var testRoom = Room.getTestData();
    testRoom.number = 1234;
    Room.postRoom(testRoom, function(err, res, room1) {
      if (err) {
        return cb(err);
      }
      testRoom.number = 4321;
      Room.postRoom(testRoom, function(err, res, room2) {
        if (err) {
          return cb(err);
        }
        info.rooms = [room1._id, room2._id];
        R.postReservation(info, function(err, res, body) {
          if (err) {
            return cb(err);
          }
          ctx[name] = body;
          cb(null, body);
        });
      });
    });
  });
}

describe('Availablility', function() {
  var ctx = {};
  beforeEach(function(done) {
    ctx = {};
    done();
  });
  beforeEach(app.start);
  beforeEach(mongo.dropDatabase);
  afterEach(app.stop);

  //test cases 15 rooms total
  // 1/1/2005 - 1/6/2005
  ///////////////
  //123456|
  //##----| 12
  //###---| 13
  //####--| 14 X
  //#####-| 15 X
  //######| 16 X
  //-##---| 23
  //-###--| 24 X
  //-####-| 25 X
  //-#####| 26 X
  //--##--| 34 X
  //--###-| 35 X
  //--####| 36 X
  //---##-| 45 X
  //---###| 46 X
  //----##| 56
  //--TTT-| test
  describe('long list of reservations', function() {
    function makeReservation(i, j) {
      return function(done) {
        createReservationForRange(ctx, 'r' + (i * 10 + j), i, j, done);
      };
    }
    for (var i = 1; i < 6; i++) {
      for (var j = i + 1; j < 7; j++) {
        beforeEach(makeReservation(i, j));
      }
    }

    it('should list all reservations', function(done) {
      R.getReservation(null, function(err, res, body) {
        if (err) {
          return done(err);
        }
        body = JSON.parse(body);
        expect(body.length).to.equal(15);
        done();
      });
    });
    it('should list only overlapping reservations 1/3-5/2015', function(done) {
      getAvailablility({
        checkIn: new Date('1/3/2005').getTime(),
        checkOut: new Date('1/5/2005').getTime()
      }, function(err, res, body) {
        if (err) {
          return done(err);
        }
        body = JSON.parse(body);
        expect(body.length).to.equal(4);
        expect(body).to.contain(ctx.r12.rooms[0]);
        expect(body).to.contain(ctx.r13.rooms[0]);
        expect(body).to.contain(ctx.r23.rooms[0]);
        expect(body).to.contain(ctx.r56.rooms[0]);
        done();
      });
    });
    it('should list return nothing if no rooms available', function(done) {
      getAvailablility({
        checkIn: new Date('1/1/2005').getTime(),
        checkOut: new Date('1/6/2005').getTime()
      }, function(err, res, body) {
        if (err) {
          return done(err);
        }
        body = JSON.parse(body);
        expect(body.length).to.equal(0);
        done();
      });
    });
    it('should list all rooms if available', function(done) {
      getAvailablility({
        checkIn: new Date('5/1/2005').getTime(),
        checkOut: new Date('5/6/2005').getTime()
      }, function(err, res, body) {
        if (err) {
          return done(err);
        }
        body = JSON.parse(body);
        expect(body.length).to.equal(15);
        done();
      });
    });
    it('should not show multiroom room', function(done) {
      createReservationWith2Rooms(ctx, 'rr16', 3, 5, function(err) {
        if (err) {
          return done(err);
        }
        getAvailablility({
          checkIn: new Date('1/3/2005').getTime(),
          checkOut: new Date('1/5/2005').getTime()
        }, function(err, res, body) {
          if (err) {
            return done(err);
          }
          body = JSON.parse(body);
          expect(body.length).to.equal(4);
          done();
        });
      });
    });
    it('should show multiroom room', function(done) {
      createReservationWith2Rooms(ctx, 'rr16', 1, 2, function(err) {
        if (err) {
          return done(err);
        }
        getAvailablility({
          checkIn: new Date('1/3/2005').getTime(),
          checkOut: new Date('1/5/2005').getTime()
        }, function(err, res, body) {
          if (err) {
            return done(err);
          }
          body = JSON.parse(body);
          expect(body.length).to.equal(6);
          done();
        });
      });
    });
  });
});