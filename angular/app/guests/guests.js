'use strict';

angular.module('myApp.guests', ['ngRoute', 'ngMaterial'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/guests', {
    templateUrl: 'guests/guests.html',
    controller: 'GuestsCtrl'
  })
  .when('/guests/:id', {
    templateUrl: 'guests/edit.html',
    controller: 'GuestsIdCtrl'
  });
}])

.controller('GuestsCtrl', ['$scope', '$location', '$window', '$mdDialog', 'guests',
  function($scope, $location, $window, $mdDialog, guests) {
    guests.getAll()
      .success(function(guests) {
        $scope.guests = guests;
      })
     .error(handleError($mdDialog));
    $scope.go = function (path) {
      $location.path('/guests/'+path);
    };
    $scope.goBack = function() {
      $window.history.back();
    };
}])

.controller('GuestsIdCtrl',
  ['$scope', '$routeParams', '$window', '$mdDialog', 'guests',
  function($scope, $routeParams, $window, $mdDialog, guests) {
    guests.getById($routeParams.id)
      .success(function(guests) {
        $scope.guest = guests[0];
      })
      .error(handleError($mdDialog));

    function validate(ev) {
      if ($scope.guestForm.$valid) {
        return true;
      }
      return false;
    }

    $scope.update = function(ev) {
      if (validate(ev)) {
        var confirm = $mdDialog.confirm()
        .title('update guest?')
        .ok('yes')
        .cancel('go back')
        .targetEvent(ev);
        $mdDialog.show(confirm).then(function() {
          guests.update($scope.guest)
            .success(function(guests) {
              $window.history.back();
            })
            .error(handleError($mdDialog));
        });
      }
    };

    $scope.goBack = function() {
      $window.history.back();
    };
}])

.controller('GuestsNewCtrl',
  ['$scope', '$routeParams', '$location', '$mdDialog', 'guests', 'guest','commitGuest',
  function($scope, $routeParams, $location, $mdDialog, guests, guest, commitGuest) {
    $scope.isNewGuest = false;

    if (!angular.isDefined(guest)) {
      $scope.guest = {};
      $scope.isNewGuest = true;
    } else {
      $scope.guest = angular.copy(guest);
    }


    function validate(ev) {
      if ($scope.guestForm.$valid) {
        return true;
      }
      return false;
    }


    $scope.save = function() {
      if ($scope.guestForm.$valid) {
        guests.create($scope.guest)
          .success(function(_guest) {
            angular.extend(guest, _guest);
            commitGuest(guest);
            $mdDialog.cancel();
          })
          .error(handleError($mdDialog));
      }
    };

    $scope.update = function(ev) {
      if (validate(ev)) {
        var confirm = $mdDialog.confirm()
        .title('update guest?')
        .ok('yes')
        .cancel('go back')
        .targetEvent(ev);
        $mdDialog.show(confirm).then(function() {
          guests.update($scope.guest)
            .success(function() {
              angular.extend(guest, $scope.guest);
              $mdDialog.cancel();
            })
            .error(handleError($mdDialog));
        });
      }
    };

    $scope.search = function(ev) {
      $mdDialog.show({
        controller: 'GuestsSearchCtrl',
        templateUrl: 'guests/dialog_list.html',
        targetEvent: ev,
        locals: { guest: $scope.guest},
      }).then(function(guest) {
        commitGuest(guest);
        $mdDialog.cancel();
      });
    };
}])

.controller('GuestsSearchCtrl',
  ['$scope', '$routeParams', '$location', '$mdDialog', 'guests', 'guest',
  function($scope, $routeParams, $location, $mdDialog, guests, guest) {
    guests.findByGuest(guest)
      .success(function(guests) {
        $scope.guests = guests;
      })
      .error(handleError($mdDialog));

    $scope.select = function(guest) {
      if (angular.isDefined(guest)) {
        $mdDialog.hide(guest);
      }
    };

    $scope.cancel = function() {
      $mdDialog.cancel();
    };
}])

.factory('guests', ['$http', function($http) {
  var urlBase = 'http://localhost:8080/guests/';
  function formatGuestOut (guest) {
    var out = angular.copy(guest);
    out.dateOfBirth = out.dateOfBirth.getTime();
    return out;
  }
  function formatGuestsIn (guests) {
    guests.forEach(function (guest, i) {
      guests[i].dateOfBirth = new Date(guest.dateOfBirth);
    });
    return guests;
  }
  return {
    getAll: function() {
      return $http.get(urlBase).success(function(guests) {
        formatGuestsIn(guests);
      });    },
    getById: function(id) {
      return $http.get(urlBase, { params: { _id: id }}).success(function(guests) {
        formatGuestsIn(guests);
      });
    },
    findByGuest: function(guest) {
      var or = [];
      if (guest._id) { or.push({_id: guest._id}); }
      if (guest.firstName) { or.push({firstName: guest.firstName}); }
      if (guest.lastName) { or.push({lastName: guest.lastName}); }
      if (guest.address) { or.push({address: guest.address}); }
      if (guest.dateOfBirth) { or.push({dateOfBirth: guest.dateOfBirth.getTime()}); }
      if (guest.idNumber) { or.push({idNumber: guest.idNumber}); }
      if (guest.comment) { or.push({comment: guest.comment}); }
      return $http.get(urlBase, {
        params: {
          $or: or
        }
      });
    },
    update: function(guest) {
      return $http.patch(urlBase+guest._id, formatGuestOut(guest));
    },
    create: function(guest) {
      return $http.post(urlBase, formatGuestOut(guest));
    }
  };
}]);

function handleError ($mdDialog) {
  return function (err) {
    var message = err && err.stack || 'something went wrong';
    $mdDialog.show($mdDialog.alert().title(message).ok('OK').targetEvent(null));
  };
}