'use strict';

angular.module('myApp.reservations', ['ngRoute'])

.constant("moment", moment)

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/reservations', {
    templateUrl: 'reservations/reservations.html',
    controller: 'ReservationsCtrl'
  }).when('/reservations/:id', {
    templateUrl: 'reservations/reservation_edit.html',
    controller: 'ReservationCtrl'
  }).when('/reservation/new', {
    templateUrl: 'reservations/reservation_edit.html',
    controller: 'ReservationCtrl'
  }).otherwise({redirectTo: '/main'});
}])

.controller('ReservationsCtrl', ['$scope', '$location', '$window', 'reservations',
  function($scope, $location, $window, reservations) {
    $scope.reservations = reservations.getAll();
    $scope.go = function (path) {
      $location.path('/reservations/'+path);
    };
    $scope.goBack = function() {
      $window.history.back();
    };
}])
// use this for both new and edit
.controller('ReservationCtrl',
  ['$scope', '$routeParams', '$location', '$mdDialog', '$window', 'reservations', 'moment',
  function($scope, $routeParams, $location, $mdDialog, $window, reservations, moment) {
    $scope.goBack = function() {
      $window.history.back();
    };

    $scope.isNewReservation = false;

    if ($routeParams.id) {
      $scope.reservation = angular.copy(reservations.getById($routeParams.id));
    } else {
      // if new set to array
      $scope.isNewReservation = true;
      $scope.reservation = {
        checkIn: new Date(moment().startOf('day').valueOf()),
        checkOut: null,
        rate: 0,
        paymentType: 1,
        status: 1,
        roomsRequested: 0,
        comment: '',
        guests: [],
        rooms: [],
        _id: Math.random()
      };
    }

    var d_inMaxDate = moment().startOf('day').add(10, 'year').subtract(1, 'day').format("YYYY-MM-DD");
    var d_outMinDate = moment().startOf('day').add(1, 'day').format("YYYY-MM-DD");

    $scope.inMinDate = $scope.isNewReservation ?
      moment().startOf('day').format("YYYY-MM-DD") :
      moment($scope.reservation.checkIn).startOf('day').format("YYYY-MM-DD");

    $scope.inMaxDate = d_inMaxDate;

    $scope.outMinDate = d_outMinDate;
    $scope.outMaxDate = moment().startOf('day').add(10, 'year').format("YYYY-MM-DD");
    $scope.daysStaying = 1;


    function validate(ev) {
      if ($scope.reservationForm.$valid) {
        if ($scope.reservation.rooms.length <= 0) {
          showAlert(ev, 'room');
          return false;
        }
        if ($scope.reservation.guests.length <= 0) {
          showAlert(ev, 'guest');
          return false;
        }
        return true;
      }
      showAlert(ev, 'check out date');
      return false;
    }

    $scope.hasCheckedIn = function() {
      return $scope.reservation.status > 1;
    };

    $scope.hasCheckedOut = function() {
      return $scope.reservation.status > 2;
    };

    $scope.isChecking = function() {
      return !$scope.isNewReservation && $scope.reservation.status == 1;
    };

    $scope.isCheckout = function() {
      return !$scope.isNewReservation && $scope.reservation.status == 2;
    };

    $scope.update = function(ev) {
      if (validate(ev)) {
        reservations.update(angular.copy($scope.reservation));
        $location.path('/main');
      }
    };

     $scope.checkIn = function(ev) {
      var confirm = $mdDialog.confirm()
        .title('Would you like to check in guest?')
        .ok('check in')
        .cancel('go back')
        .targetEvent(ev);
      $mdDialog.show(confirm).then(function() {
        reservations.checkIn($scope.reservation);
      });
    };

    $scope.checkOut = function(ev) {
      var confirm = $mdDialog.confirm()
        .title('Would you like to check out guest?')
        .ok('check out')
        .cancel('go back')
        .targetEvent(ev);
      $mdDialog.show(confirm).then(function() {
        reservations.checkOut($scope.reservation);
      });
    };

    $scope.cancel = function(ev) {
      var confirm = $mdDialog.confirm()
        .title('Would you like to cancel reservation?')
        .ok('yes')
        .cancel('no')
        .targetEvent(ev);
      $mdDialog.show(confirm).then(function() {
        reservations.cancel($scope.reservation);
      });
    };

    $scope.create = function(ev) {
      if (validate(ev)) {
        reservations.create(angular.copy($scope.reservation));
        $location.path('/main');
      }
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

    $scope.removeGuest = function(ev, guest) {
      var index = $scope.reservation.guests.indexOf(guest);
      $scope.reservation.guests.splice(index, 1);
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
        $scope.reservation.roomsRequested++;
        $scope.reservation.rooms.push(room);
      }, function() {
        $scope.room = 'no room';
      });
    };

    $scope.removeRoom = function(ev, room) {
      $scope.reservation.roomsRequested--;
      var index = $scope.reservation.rooms.indexOf(room);
      $scope.reservation.rooms.splice(index, 1);
    };
}])

.factory('reservations', ['guests', 'rooms', function(guests, rooms) {
  var today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  var Rs = [{
    checkIn: new Date('12/2/2015'),
    checkOut: new Date('12/6/2015'),
    rate: 123.123,
    paymentType: 1,
    status: 2,
    roomsRequested: 2,
    comment: 'late checking',
    guests: [guests.getById(0), guests.getById(1)],
    rooms: [rooms.getById(1), rooms.getById(0)],
    _id: 0
  }, {
    checkIn: new Date('1/2/1989'),
    checkOut: new Date('1/10/2016'),
    rate: 111.21,
    paymentType: 1,
    status: 2,
    roomsRequested: 1,
    comment: 'asdf checking',
    guests: [guests.getById(2)],
    rooms: [rooms.getById(2)],
    _id: 1
  }, {
    checkIn: new Date('1/1/1989'),
    checkOut: angular.copy(today),
    rate: 33.12,
    paymentType: 1,
    status: 2,
    roomsRequested: 2,
    comment: 'late adfs',
    guests: [guests.getById(3)],
    rooms: [rooms.getById(3)],
    _id: 2
  }, {
    checkIn: angular.copy(today),
    checkOut: new Date('1/9/2017'),
    rate: 12.3,
    paymentType: 1,
    status: 1,
    roomsRequested: 1,
    comment: 'laasdfking',
    guests: [guests.getById(0)],
    rooms: [rooms.getById(3)],
    _id: 3
  }];

  function updateState(reservation, newState) {
      reservation.status = newState;
      Rs[reservation._id].status = newState;
  }

  return {
    getAll: function() {
      return Rs;
    },
    getById: function(_id) {
      return Rs[_id];
    },
    create: function(data) {
      Rs.push(data);
    },
    checkIn: function(reservation) {
      updateState(reservation, 2);
    },
    checkOut: function(reservation) {
      updateState(reservation, 3);
    },
    cancel: function(reservation) {
      updateState(reservation, 4);
    },
    update: function(reservation) {
      Rs[reservation._id] = reservation;
    }
  };
}])

.filter('f_paymentType', function () {
  var paymentType = {
    1: 'credit card',
    2: 'cash'
  };
  return function (item) {
    return paymentType[item];
  };
})

.filter('f_status', function () {
  var status = {
    1: 'reserved',
    2: 'checked in',
    3: 'checked out',
    4: 'canceled'
  };
  return function (item) {
    return status[item];
  };
})

.filter('f_checkingOut', function () {
  return function(reservations) {
    var filtered = [];
    angular.forEach(reservations, function(reservation) {
      if(reservation.status === 2 &&
        stripTime(reservation.checkOut) === stripTime(new Date())) {
        filtered.push(reservation);
      }
    });
    return filtered;
  };
})

.filter('f_checkingIn', function () {
  return function(reservations) {
    var filtered = [];
    angular.forEach(reservations, function(reservation) {
      if(reservation.status === 1 &&
        stripTime(reservation.checkIn) === stripTime(new Date())) {
        filtered.push(reservation);
      }
    });
    return filtered;
  };
})

.filter('f_stayover', function () {
  return function(reservations) {
    var filtered = [];
    var today = new Date();
    angular.forEach(reservations, function(reservation) {
      if(reservation.status === 2 &&
        stripTime(reservation.checkIn) <= stripTime(new Date()) &&
        stripTime(reservation.checkOut) > stripTime(new Date())) {
        filtered.push(reservation);
      }
    });
    return filtered;
  };
});

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}