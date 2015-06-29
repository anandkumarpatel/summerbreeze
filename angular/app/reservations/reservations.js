'use strict';
angular.module('myApp.reservations', ['ngRoute', 'angular-momentjs'])

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

.controller('ReservationsCtrl', ['$scope', '$location', '$window', '$mdDialog', 'reservations',
  function($scope, $location, $window, $mdDialog, reservations) {
    reservations.getAll()
      .success(function(reservations) {
        $scope.reservations = reservations;
      })
     .error(function(err) {
        var message = err && err.stack || 'something went wrong';
        $mdDialog.show($mdDialog.alert().title(message).ok('OK').targetEvent(null));
      });

    $scope.go = function (path) {
      $location.path('/reservations/'+path);
    };
    $scope.goBack = function() {
      $window.history.back();
    };
}])
// use this for both new and edit
.controller('ReservationCtrl',
  ['$scope', '$routeParams', '$location', '$mdDialog', '$window', '$moment', 'reservations', 'settings',
  function($scope, $routeParams, $location, $mdDialog, $window, $moment, reservations, settings) {
    $scope.goBack = function() {
      $window.history.back();
    };
    $scope.setting = {};

    $scope.isNewReservation = false;
    settings.get().success(function(setting) {
      if ($routeParams.id) {
        reservations.getById($routeParams.id)
          .success(function(reservations) {
            $scope.reservation = reservations[0];
            setupInDate();
          })
          .error(function(err) {
            handleError(null, err);
          });
      } else {
        // if new set to array
        $scope.isNewReservation = true;
        $scope.reservation = {
          checkIn: new Date($moment().startOf('day').valueOf()),
          checkOut: null,
          rate: 0,
          taxRate: setting.taxRate,
          paymentType: 1,
          status: 1,
          roomsRequested: 0,
          comment: '',
          guests: [],
          rooms: []
        };
        setupInDate();
      }
    });

    function handleError (ev, res) {
      if (!res.errors) { return; }

      var message = '';
      Object.keys(res.errors).forEach(function(item) {
        message += 'item:'+res.errors[item].message+'\n';
      });
      $mdDialog.show(
        $mdDialog.alert()
          .title(res.message)
          .content(message)
          .ok('OK')
          .targetEvent(ev)
      );
    }

    var d_inMaxDate = $moment().startOf('day').add(10, 'year').subtract(1, 'day').format("YYYY-MM-DD");
    var d_outMinDate = $moment().startOf('day').add(1, 'day').format("YYYY-MM-DD");
    function setupInDate () {
      $scope.inMinDate = $scope.isNewReservation ?
        $moment().startOf('day').format("YYYY-MM-DD") :
        $moment($scope.reservation.checkIn).startOf('day').format("YYYY-MM-DD");
    }

    $scope.inMaxDate = d_inMaxDate;

    $scope.outMinDate = d_outMinDate;
    $scope.outMaxDate = $moment().startOf('day').add(10, 'year').format("YYYY-MM-DD");
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
        var confirm = $mdDialog.confirm()
          .title('update reservation?')
          .ok(' yes ')
          .cancel('back')
          .targetEvent(ev);
          $mdDialog.show(confirm).then(function() {
            reservations.update($scope.reservation);
            $scope.goBack();
          });
      }
    };

     $scope.checkIn = function(ev) {
      var confirm = $mdDialog.confirm()
        .title('Would you like to check in guest?')
        .ok(' che ck in')
        .cancel('back')
        .targetEvent(ev);
      $mdDialog.show(confirm).then(function() {
        reservations.checkIn($scope.reservation);
      });
    };

    $scope.checkOut = function(ev) {
      var confirm = $mdDialog.confirm()
        .title('Would you like to check out guest?')
        .ok(' che ck out')
        .cancel('back')
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
        reservations.create($scope.reservation);
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
        $scope.daysStaying = $moment($scope.reservation.checkOut).startOf('day')
          .diff($moment($scope.reservation.checkIn).startOf('day'), 'days');
      }
    }

    $scope.inDateChange = function () {
      $scope.outMinDate = angular.isDate($scope.reservation.checkIn) ?
        $moment($scope.reservation.checkIn).add(1, 'day').format("YYYY-MM-DD") :
        d_outMinDate;
      updateDays();
    };


    $scope.outDateChange = function () {
      $scope.inMaxDate = angular.isDate($scope.reservation.checkOut) ?
        $moment($scope.reservation.checkOut).subtract(1, 'day').format("YYYY-MM-DD") :
        d_inMaxDate;
      updateDays();
    };

    $scope.paymentTypes = [
      {label: 'cash', value: 1},
      {label: 'credit', value: 2}];

    $scope.addGuest = function(ev) {
      $mdDialog.show({
        controller: 'GuestsNewCtrl',
        templateUrl: 'guests/dialog_edit.html',
        targetEvent: ev,
        locals: { commitGuest: $scope.reservation.guests},
      });
    };

    $scope.updateGuest = function(ev, guest) {
      $mdDialog.show({
        controller: 'GuestsUpdateCtrl',
        templateUrl: 'guests/dialog_edit.html',
        targetEvent: ev,
        locals: { guest: guest },
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
        templateUrl: 'rooms/dialog_list.html',
        targetEvent: ev,
        locals: {
          checkIn: $scope.reservation.checkIn,
          checkOut: $scope.reservation.checkOut,
          currentRooms: $scope.reservation.rooms
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

.factory('reservations', ['$http', function($http) {
  var urlBase = 'http://localhost:8080/reservations/';
  function formatReservationOut (reservation) {
    var out = angular.copy(reservation);
    out.checkIn = out.checkIn.getTime();
    out.checkOut = out.checkOut.getTime();
    function getId (item) {
      return item._id;
    }
    out.rooms = out.rooms.map(getId);
    out.guests = out.guests.map(getId);
    return out;
  }
  function formatReservationsIn (reservations) {
    reservations.forEach(function (reservation, i) {
      reservations[i].checkIn = new Date(reservation.checkIn);
      reservations[i].checkOut = new Date(reservation.checkOut);
      reservations[i].guests.forEach(function (guest) {
        guest.dateOfBirth = new Date(guest.dateOfBirth);
      });
    });
    return reservations;
  }
  var out = {
    getAll: function() {
      return $http.get(urlBase).success(function(reservations) {
        formatReservationsIn(reservations);
      });
    },
    getById: function(id) {
      return $http.get(urlBase, { params: { _id: id }}).success(function(reservation) {
        formatReservationsIn(reservation);
      });
    },
    create: function(reservation) {
      return $http.post(urlBase, formatReservationOut(reservation));
    },
    checkIn: function(reservation) {
      reservation.status = 2;
      return out.update(reservation);
    },
    checkOut: function(reservation) {
      reservation.status = 3;
      return out.update(reservation);
    },
    cancel: function(reservation) {
      reservation.status = 4;
      return out.update(reservation);
    },
    update: function(reservation) {
      return $http.patch(urlBase+reservation._id, formatReservationOut(reservation));
    }
  };
  return out;
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