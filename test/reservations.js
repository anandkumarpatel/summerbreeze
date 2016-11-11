'use strict'
require('../lib/loadConfig.js')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const describe = lab.describe
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach
const it = lab.test

const mongoose = require('mongoose')

const app = require('../lib/app.js')
const mongo = require('../lib/helpers/mongo.js')
const Reservations = require('../lib/models/reservations/class.js')
const guests = require('./guests-fixtures.js')
const rooms = require('./rooms-fixtures.js')

const R = require('./reservations-fixtures.js')

describe('Reservations', () => {
  var ctx = {}
  beforeEach((done) => {
    ctx = {}
    done()
  })
  beforeEach((done) => {
    app.start(done)
  })
  beforeEach((done) => {
    mongo.dropDatabase(done)
  })
  beforeEach((done) => {
    guests.createBasicGuest((err, guest) => {
      if (err) { return done(err) }
      ctx.guest = guest
      done()
    })
  })
  beforeEach((done) => {
    rooms.createBasicRoom((err, room) => {
      if (err) { return done(err) }
      ctx.room = room
      done()
    })
  })
  afterEach((done) => {
    app.stop(done)
  })

  describe('POST /Reservations', () => {
    describe('valid', () => {
      it('should create reservation without room', (done) => {
        const testData = R.getTestData()
        testData.guests = [ctx.guest._id]
        R.postReservation(testData, (err, res, outData) => {
          if (err) { return done(err) }
          expect(testData.checkIn).to.equal(outData.checkIn)
          expect(testData.checkOut).to.equal(outData.checkOut)
          expect(testData.roomsRequested).to.equal(outData.roomsRequested)
          expect(testData.rate).to.equal(outData.rate)
          expect(testData.taxRate).to.equal(outData.taxRate)
          expect([]).to.deep.equal(outData.payments)
          expect(testData.status).to.equal(outData.status)
          expect(testData.comment).to.equal(outData.comment)
          expect(testData.guests).to.deep.contain(outData.guests)
          done()
        })
      })

      it('should create reservation with room', (done) => {
        var data = R.getTestData()
        data.rooms = [ctx.room._id]
        data.guests = [ctx.guest._id]
        R.postReservation(data, done)
      })

      it('should accept single payment methods', (done) => {
        var data = R.getTestData()
        data.payments = [{
          paymentType: R.C.paymentType.cash,
          amount: 10
        }]
        data.guests = [ctx.guest._id]
        R.postReservation(data, (err, res, body) => {
          if (err) { return done(err) }
          expect(body.payments).to.deep.equal(data.payments)
          done()
        })
      })

      it('should accept multi payment methods', (done) => {
        var data = R.getTestData()
        data.payments = [{
          paymentType: R.C.paymentType.cash,
          amount: 10
        }, {
          paymentType: R.C.paymentType.creditCard,
          amount: 200,
          cardNumber: '123-123-123'
        }]
        data.guests = [ctx.guest._id]
        R.postReservation(data, (err, res, body) => {
          if (err) { return done(err) }
          expect(body.payments).to.deep.equal(data.payments)
          done()
        })
      })
    }) // valid
    describe('invalid', () => {
      describe('missing keys', () => {
        ['checkIn', 'checkOut', 'rate', 'taxRate', 'status', 'roomsRequested']
          .forEach((key) => {
            it('should error if missing ' + key, (done) => {
              var info = R.getTestData()
              delete info[key]
              info.guests = [ctx.guest._id]
              R.postReservation(info, (err, res, body) => {
                if (err) { return done(err) }
                expect(res.statusCode).to.equal(400)
                expect(body.name).to.equal('ValidationError')
                expect(body.errors[key]).to.exist()
                done()
              })
            })
          })
      })
      it('should error if checkIn after checkOut', (done) => {
        var data = R.getTestData()
        data.guests = [ctx.guest._id]
        data.checkIn = new Date('5/12/1016').getTime()
        data.checkOut = new Date('1/10/1016').getTime()

        R.postReservation(data, (err, res, body) => {
          if (err) { return done(err) }
          expect(res.statusCode).to.equal(400)
          expect(body.output.payload.message)
            .to.equal('checkOut date must be greater than checkIn date')
          Reservations.find({}, (err, body) => {
            if (err) { return done(err) }
            expect(body.length).to.equal(0)
            done()
          })
        })
      })
      it('should error if guest does not exist', (done) => {
        var data = R.getTestData()
        data.guests = [new mongoose.Types.ObjectId()]

        R.postReservation(data, (err, res, body) => {
          if (err) { return done(err) }
          expect(res.statusCode).to.equal(400)
          expect(body.output.payload.message).to.equal('guest not found')
          Reservations.find({}, (err, body) => {
            if (err) { return done(err) }
            expect(body.length).to.equal(0)
            done()
          })
        })
      })
      it('should error if guest invalid type', (done) => {
        var data = R.getTestData()
        data.guests = ['fake']

        R.postReservation(data, (err, res, body) => {
          if (err) { return done(err) }
          expect(res.statusCode).to.equal(400)
          expect(body.name).to.equal('CastError')
          expect(body.path).to.equal('guests')
          Reservations.find({}, (err, body) => {
            if (err) { return done(err) }
            expect(body.length).to.equal(0)
            done()
          })
        })
      })
      describe('room errors', () => {
        it('should error if no rooms left and no room specified', (done) => {
          R.createBasicReservation(ctx.guest, (err) => {
            if (err) { return done(err) }
            var data = R.getTestData()
            data.guests = [ctx.guest._id]
            R.postReservation(data, (err, res) => {
              if (err) { return done(err) }
              expect(res.statusCode).to.equal(409)
              Reservations.find({}, (err, body) => {
                if (err) { return done(err) }
                expect(body.length).to.equal(1)
                done()
              })
            })
          })
        })
        it('should error if rooms already reserved', (done) => {
          var data = R.getTestData()
          data.guests = [ctx.guest._id]
          data.rooms = [ctx.room._id]
          R.postReservation(data, (err) => {
            if (err) { return done(err) }
            R.postReservation(data, (err, res, body) => {
              if (err) { return done(err) }
              expect(res.statusCode).to.equal(409)
              expect(body.output.payload.message).to.equal('room already reserved')
              Reservations.find({}, (err, body) => {
                if (err) { return done(err) }
                expect(body.length).to.equal(1)
                done()
              })
            })
          })
        })
        it('should error if room does not exist', (done) => {
          var data = R.getTestData()
          data.guests = [ctx.guest._id]
          data.rooms = [new mongoose.Types.ObjectId()]

          R.postReservation(data, (err, res, body) => {
            if (err) { return done(err) }
            expect(res.statusCode).to.equal(400)
            expect(body.output.payload.message).to.equal('room not found')
            Reservations.find({}, (err, body) => {
              if (err) { return done(err) }
              expect(body.length).to.equal(0)
              done()
            })
          })
        })
        it('should error if room invalid type', (done) => {
          var data = R.getTestData()
          data.guests = [ctx.guest._id]
          data.rooms = ['fake']

          R.postReservation(data, (err, res, body) => {
            if (err) { return done(err) }
            expect(res.statusCode).to.equal(400)
            expect(body.name).to.equal('CastError')
            expect(body.path).to.equal('rooms')
            Reservations.find({}, (err, body) => {
              if (err) { return done(err) }
              expect(body.length).to.equal(0)
              done()
            })
          })
        })
      })
    }) // invalid
  }) // POST /Reservations
  describe('GET /Reservations', () => {
    describe('valid', () => {
      var r2 = {
        checkIn: R.stripeTime(new Date()).getTime(),
        checkOut: R.stripeTime(R.addDays(new Date(), R.testReservationLength)).getTime(),
        rate: R.testRate,
        taxRate: R.testTaxRate,
        paymentType: R.C.paymentType.creditCard,
        status: R.C.status.notIn,
        roomsRequested: 1,
        comment: 'dog'
      }
      var r3 = {
        checkIn: R.stripeTime(R.addDays(new Date(), 1)).getTime(),
        checkOut: R.stripeTime(R.addDays(new Date(), 6)).getTime(),
        rate: R.testRate,
        taxRate: R.testTaxRate,
        paymentType: R.C.paymentType.cash,
        status: R.C.status.canceled,
        roomsRequested: 1,
        comment: 'pet'
      }
      beforeEach((done) => {
        rooms.createRandomRoom(2, (err, room) => {
          if (err) { return done(err) }
          ctx.room2 = room
          r2.rooms = [room._id]
          done()
        })
      })
      beforeEach((done) => {
        rooms.createRandomRoom(3, (err, room) => {
          if (err) { return done(err) }
          ctx.room3 = room
          done()
        })
      })
      beforeEach((done) => {
        R.createBasicReservation(ctx.guest, done)
      })
      beforeEach((done) => {
        guests.createRandomGuest((err, guest) => {
          if (err) { return done(err) }
          ctx.guest2 = guest
          r2.guests = [guest._id]
          done()
        })
      })
      beforeEach((done) => {
        guests.createRandomGuest((err, guest) => {
          if (err) { return done(err) }
          ctx.guest3 = guest
          r3.guests = [guest._id]
          done()
        })
      })
      beforeEach((done) => {
        R.postReservation(r2, (err, res, body) => {
          if (err) { return done(err) }
          ctx.reservation2 = body
          ctx.reservation2.guests = ctx.guest2
          done()
        })
      })
      beforeEach((done) => {
        R.postReservation(r3, (err, body) => {
          if (err) { return done(err) }
          ctx.reservation3 = body
          ctx.reservation3.guests = ctx.guest3
          done()
        })
      })
      it('should get Reservations from status', (done) => {
        R.getReservation({
          status: R.C.status.notIn
        }, (err, res, body) => {
          if (err) { return done(err) }
          body = JSON.parse(body)
          expect(body).to.have.length(2)
          R.expectArrayToContainReservation(body, R.getTestData())
          R.expectArrayToContainReservation(body, ctx.reservation2)
          done()
        })
      })
      describe('reservation with guest', () => {
        it('should get reservation by guest', (done) => {
          R.getReservation({
            guests: ctx.guest2._id
          }, (err, res, body) => {
            if (err) { return done(err) }
            body = JSON.parse(body)
            expect(body).to.have.length(1)
            R.expectArrayToContainReservation(body, ctx.reservation2)
            done()
          })
        })
      })
      describe('reservation with room', () => {
        it('should get reservation by room', (done) => {
          R.getReservation({
            rooms: ctx.room2._id
          }, (err, res, body) => {
            if (err) { return done(err) }
            body = JSON.parse(body)
            expect(body).to.have.length(1)
            R.expectArrayToContainReservation(body, ctx.reservation2)
            done()
          })
        })
      })
    }) // valid
  }) // GET /Reservations
  describe('DELETE /Reservation/:id', () => {
    describe('valid', () => {
      it('should delete Reservation', (done) => {
        R.createBasicReservation(ctx.guest, (err, Reservation) => {
          if (err) { return done(err) }
          R.deleteReservation(Reservation._id, (err, res) => {
            if (err) { return done(err) }
            expect(res.statusCode).to.equal(200)
            R.getReservation({number: R.getTestData().number}, (err, res, body) => {
              if (err) { return done(err) }
              body = JSON.parse(body)
              expect(body).to.be.empty()
              done()
            })
          })
        })
      })
      it('should do nothing if no id found', (done) => {
        R.createBasicReservation(ctx.guest, (err, Reservation) => {
          if (err) { return done(err) }
          R.deleteReservation(Reservation._id, (err, res) => {
            if (err) { return done(err) }
            expect(res.statusCode).to.equal(200)
            R.deleteReservation(Reservation._id, (err, res) => {
              if (err) { return done(err) }
              expect(res.statusCode).to.equal(200)
              done()
            })
          })
        })
      })
    }) // valid
    describe('invalid', () => {
      it('should error if no id sent', (done) => {
        R.deleteReservation('', (err, res) => {
          if (err) { return done(err) }
          expect(res.statusCode).to.equal(404)
          done()
        })
      })
    }) // invalid
  }) // DELETE /Reservation/:id'
})
