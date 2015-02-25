'use strict';

angular.module('myApp.reservations', ['ngRoute'])

.constant("moment", moment)

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/reservations', {
    templateUrl: 'reservations/reservations.html',
    controller: 'ReservationsCtrl'
  }).when('/reservations/:id', {
    templateUrl: 'reservations/reservation_edit.html',
    controller: 'ReservationIdCtrl'
  }).when('/reservation/new', {
    templateUrl: 'reservations/reservation_edit.html',
    controller: 'ReservationNewCtrl'
  }).otherwise({redirectTo: '/reservation/new'});
}])

.controller('ReservationsCtrl', ['$scope', '$location', 'reservations', function($scope, $location, reservations) {
    $scope.reservations = reservations.getAll();
    $scope.go = function (path) {
      $location.path('/reservations/'+path);
    };
}])

.controller('ReservationIdCtrl',
  ['$scope', '$routeParams', '$location', 'reservations',
  function($scope, $routeParams, $location, reservations) {
    $scope.reservation = angular.copy(reservations.getById($routeParams.id));
    $scope.save = function(reservation) {
      reservations.saveById(reservation);
    };
}])

.controller('ReservationNewCtrl',
  ['$scope', '$routeParams', '$location', '$mdDialog', 'reservations', 'moment',
  function($scope, $routeParams, $location, $mdDialog, reservations, moment) {
    $scope.reservation = {
      checkIn: new Date(moment().startOf('day').valueOf()),
      checkOut: null,
      rate: 0,
      paymentType: 1,
      status: 2,
      roomsRequested: 1,
      comment: '',
      guests: [],
      rooms: [],
      _id: 0
    };
    function showAlert(ev, missing) {
      $mdDialog.show(
        $mdDialog.alert()
        .title('you forgot something')
        .content('please pick ' + missing + ' to continue')
        .ok('continue')
        .targetEvent(ev)
      );
    }

    $scope.save = function(ev) {
      if ($scope.reservationForm.$valid) {
        if ($scope.reservation.rooms.length <= 0) {
          return showAlert(ev, 'room');
        }
        if ($scope.reservation.guests.length <= 0) {
          return showAlert(ev, 'guest');
        }
        reservations.create(angular.copy($scope.reservation));
        $location.path('/');
      }
    };

    var d_inMaxDate = moment().startOf('day').add(1, 'year').subtract(1, 'day').format("YYYY-MM-DD");
    var d_outMinDate = moment().startOf('day').add(1, 'day').format("YYYY-MM-DD");

    $scope.inMinDate = moment().startOf('day').format("YYYY-MM-DD");
    $scope.inMaxDate = d_inMaxDate;

    $scope.outMinDate = d_outMinDate;
    $scope.outMaxDate = moment().startOf('day').add(1, 'year').format("YYYY-MM-DD");
    $scope.daysStaying = 1;

    function updateDays() {
      if (angular.isDate($scope.reservation.checkIn) &&
        angular.isDate($scope.reservation.checkOut)) {
        $scope.daysStaying = moment($scope.reservation.checkOut).startOf('day')
          .diff(moment($scope.reservation.checkIn).startOf('day'), 'days');
      }
    }

    $scope.inDateChange = function () {
      $scope.outMinDate = angular.isDate($scope.reservation.checkIn) ?
        moment($scope.reservation.checkIn).add(1, 'day').format("YYYY-MM-DD") :
        d_outMinDate;
      updateDays();
    };


    $scope.outDateChange = function () {
      $scope.inMaxDate = angular.isDate($scope.reservation.checkOut) ?
        moment($scope.reservation.checkOut).subtract(1, 'day').format("YYYY-MM-DD") :
        d_inMaxDate;
      updateDays();
    };

    $scope.paymentTypes = [
      {label: 'cash', value: 1},
      {label: 'credit', value: 2}];

    $scope.commitGuest = function (guest) {
      $scope.reservation.guests.push(guest);
    };

    $scope.addGuest = function(ev) {
      $mdDialog.show({
        controller: 'GuestsNewCtrl',
        templateUrl: 'guests/guest_edit.html',
        targetEvent: ev,
        locals: { guest: {}, commitGuest: $scope.commitGuest},
      });
    };

    $scope.updateGuest = function(ev, guest) {
      $mdDialog.show({
        controller: 'GuestsNewCtrl',
        templateUrl: 'guests/guest_edit.html',
        targetEvent: ev,
        locals: { guest: guest, commitGuest: $scope.commitGuest},
      })
      .then(function(guest) {
        $scope.reservation.guests.push(guest);
      });
    };

    $scope.selectRoom = function(ev) {
      if (!angular.isDate($scope.reservation.checkIn)) {
        return showAlert(ev, 'check in date');
      }
      if (!angular.isDate($scope.reservation.checkOut)) {
        return showAlert(ev, 'check out date');
      }
      $mdDialog.show({
        controller: 'RoomSelection',
        templateUrl: 'rooms/rooms.html',
        targetEvent: ev,
        locals: {
          checkIn: $scope.reservation.checkIn,
          checkOut: $scope.reservation.checkOut
         }
      })
      .then(function(room) {
        $scope.reservation.rooms.push(room);
      }, function() {
        $scope.room = 'no room';
      });
    };
}])

.factory('reservations', ['guests', 'rooms', function(guests, rooms) {
  var Rs = [{
    checkIn: new Date('12/2/2015'),
    checkOut: new Date('12/6/2015'),
    rate: 123.123,
    paymentType: 1,
    status: 2,
    roomsRequested: 1,
    comment: 'late checking',
    guests: [guests.getById(0), guests.getById(1)],
    rooms: [rooms.getById(1), rooms.getById(0)],
    _id: 0
  }, {
    checkIn: new Date('1/2/1989'),
    checkOut: new Date('1/10/1989'),
    rate: 111.21,
    paymentType: 1,
    status: 1,
    roomsRequested: 1,
    comment: 'asdf checking',
    guests: [guests.getById(2)],
    rooms: [rooms.getById(2)],
    _id: 1
  }, {
    checkIn: new Date('1/1/1989'),
    checkOut: new Date('1/11/1989'),
    rate: 33.12,
    paymentType: 1,
    status: 2,
    roomsRequested: 2,
    comment: 'late adfs',
    guests: [guests.getById(3)],
    rooms: [rooms.getById(3)],
    _id: 2
  }, {
    checkIn: new Date('1/5/1989'),
    checkOut: new Date('1/9/1989'),
    rate: 12.3,
    paymentType: 1,
    status: 4,
    roomsRequested: 1,
    comment: 'laasdfking',
    guests: [guests.getById(0)],
    rooms: [rooms.getById(3)],
    _id: 3
  }];

  return {
    getAll: function() {
      return Rs;
    },
    getById: function(id) {
      return Rs[id];
    },
    create: function(data) {
      Rs.push(data);
    }
  };
}]);