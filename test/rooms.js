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
var createCount = require('callback-count');

var app = require('../lib/app.js');
var mongo = require('../lib/helpers/mongo.js');

var testRoom = {
  number: 1,
  smoking: false,
  beds: 1,
  status: 'ok',
  comment: 'upstairs'
};

function postRoom (info, cb) {
  request({
    method: 'POST',
    url: 'http://localhost:' + process.env.PORT + '/rooms',
    json: info
  }, cb);
}

function createBasicRoom (cb) {
  postRoom(testRoom, function(err, res, body) {
    if (err) {
      return cb(err);
    }
    expect(res.statusCode).to.equal(200);
    expect(body).to.contain(testRoom);
    cb(null, body);
  });
}

function getRoom (query, cb) {
  request({
    method: 'GET',
    url: 'http://localhost:' + process.env.PORT + '/rooms',
    qs: query
  }, cb);
}

function deleteRoom (id, cb) {
  request({
    method: 'DELETE',
    url: 'http://localhost:' + process.env.PORT + '/rooms/'+id,
  }, cb);
}

function patchRoom (id, info, cb) {
  request({
    method: 'PATCH',
    url: 'http://localhost:' + process.env.PORT + '/rooms/'+id,
    json: info
  }, cb);
}

describe('Rooms', function() {
  beforeEach(function(done) {
    app.start(done);
  });
  beforeEach(function(done) {
    mongo.dropDatabase(done);
  });
  afterEach(function(done) {
    app.stop(done);
  });
  describe('POST /rooms', function() {
    describe('valid', function() {
      it('should create room', createBasicRoom);
      it('should create 2 rooms with different numbers', function(done) {
        var count = createCount(2, done);
        var room2 = JSON.parse(JSON.stringify(testRoom));
        room2.number = 2;
        createBasicRoom(count.next);
        postRoom(room2, count.next);
      });
    }); // valid
    describe('invalid', function() {
      it('should not allow room with same number', function(done) {
        createBasicRoom(function(err) {
          if (err) { return done(err); }
          postRoom(testRoom, function(err, res, body) {
            if (err) {
              return done(err);
            }
            expect(res.statusCode).to.equal(400);
            expect(body.code).to.equal(11000);
            done();
          });
        });
      });
      ['number', 'smoking', 'beds', 'status'].forEach(function(key) {
        it('should error if missing ' + key, function(done) {
          var info = JSON.parse(JSON.stringify(testRoom));
          delete info[key];
          postRoom(info, function(err, res, body) {
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
  }); // POST /rooms
  describe('GET /rooms', function() {
    describe('valid', function() {
      var room2 = {
        number: 2,
        smoking: true,
        beds: 2,
        status: 'ok',
        comment: 'upstairs'
      };
      var room10 = {
        number: 10,
        smoking: true,
        beds: 1,
        status: 'okish',
        comment: 'other'
      };
      beforeEach(createBasicRoom);
      beforeEach(function(done) {
        postRoom(room2, done);
      });
      beforeEach(function(done) {
        postRoom(room10, done);
      });
      it('should get room from number', function(done) {
        getRoom({
          number: 1
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          expect(body).to.have.length(1);
          expect(body[0]).to.deep.include(testRoom);
          done();
        });
      });
      it('should get rooms from smoking', function(done) {
        getRoom({
          smoking: true
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          body = body.filter(function(item) {
            delete item.__v;
            delete item._id;
            return item;
          });
          expect(body).to.have.length(2);
          expect(body).to.deep.contain(room2);
          expect(body).to.deep.contain(room10);
          done();
        });
      });
      it('should get rooms from status', function(done) {
        getRoom({
          status: 'ok'
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          body = body.filter(function(item) {
            delete item.__v;
            delete item._id;
            return item;
          });
          expect(body).to.have.length(2);
          expect(body).to.deep.contain(room2);
          expect(body).to.deep.contain(testRoom);
          done();
        });
      });
      it('should get rooms that match status and rooms', function(done) {
        getRoom({
          status: 'ok',
          beds: 2
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          body = body.filter(function(item) {
            delete item.__v;
            delete item._id;
            return item;
          });
          expect(body).to.have.length(1);
          expect(body[0]).to.deep.equal(room2);
          done();
        });
      });
      it('should get all rooms if no query passed', function(done) {
        getRoom({}, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          body = body.filter(function(item) {
            delete item.__v;
            delete item._id;
            return item;
          });
          expect(body).to.have.length(3);
          expect(body).to.deep.contain(room2);
          expect(body).to.deep.contain(room10);
          expect(body).to.deep.contain(testRoom);
          done();
        });
      });
      it('should return empty if no match', function(done) {
        getRoom({
          room: 3
        }, function(err, res, body) {
          if (err) { return done(err); }
          body = JSON.parse(body);
          expect(body).to.be.empty();
          done();
        });
      });

    }); // valid
  }); // GET /rooms
  describe('DELETE /room/:id', function() {
    describe('valid', function() {
      it('should delete room', function(done) {
        createBasicRoom(function(err, room) {
          if (err) { return done(err); }
          deleteRoom(room._id, function(err, res) {
            if (err) { return done(err); }
            expect(res.statusCode).to.equal(200);
            getRoom({number: testRoom.number}, function(err, res, body) {
              if (err) { return done(err); }
              body = JSON.parse(body);
              expect(body).to.be.empty();
              done();
            });
          });
        });
      });
      it('should do nothing if no id found', function(done) {
        createBasicRoom(function(err, room) {
          if (err) { return done(err); }
          deleteRoom(room._id, function(err, res) {
            if (err) { return done(err); }
            expect(res.statusCode).to.equal(200);
            deleteRoom(room._id, function(err, res) {
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
        deleteRoom('', function(err, res) {
          if (err) { return done(err); }
          expect(res.statusCode).to.equal(404);
          done();
        });
      });
    }); // invalid
  }); // DELETE /room/:id'
  describe('PATCH /room/:id', function() {
    describe('valid', function() {
      var testVals = {
        'number': 421 ,
        'smoking': true ,
        'beds': 5 ,
        'status': 'cool' ,
        'comment': 'something'
      };
      function testUpdates (key) {
        return function (done) {
          createBasicRoom(function(err, room) {
            if (err) { return done(err); }
            var update = {};
            update[key] = testVals[key];
            patchRoom(room._id, update, function(err, res) {
              if (err) { return done(err); }
              expect(res.statusCode).to.equal(200);
              getRoom({_id: room._id}, function(err, res, body) {
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
        createBasicRoom(function(err, room) {
          if (err) { return done(err); }
          patchRoom(room._id, testVals, function(err, res) {
            if (err) { return done(err); }
            expect(res.statusCode).to.equal(200);
            getRoom({_id: room._id}, function(err, res, body) {
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
  }); // PATCH /room/:id
});