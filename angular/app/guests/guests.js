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

.controller('GuestsCtrl', ['$scope', '$location', '$window', 'guests',
  function($scope, $location, $window, guests) {
    $scope.guests = guests.getAll();
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
    $scope.guest = angular.copy(guests.getById($routeParams.id));

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
          guests.update($scope.guest);
          $window.history.back();
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
    $scope.guest = guest;

    if (!angular.isDefined($scope.guest)) {
      $scope.guest = {};
    }

    $scope.save = function() {
      if ($scope.guestForm.$valid) {
        commitGuest($scope.guest);
        $mdDialog.cancel();
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
    $scope.guests = guests.findByGuest(guest);

    $scope.select = function(guest) {
      if (angular.isDefined(guest)) {
        $mdDialog.hide(guest);
      }
    };

    $scope.cancel = function() {
      $mdDialog.cancel();
    };
}])

// TODO add State, City, Zip
.factory('guests', function() {
  var Gs = [{
    _id: 0,
    firstName: 'anand',
    lastName: 'patel',
    address: '1241 front beach road',
    dateOfBirth: new Date('9/5/1989'),
    idNumber: '474556356',
    comment: 'other guy'
  }, {
    _id: 1,
    firstName: 'other',
    lastName: 'man',
    address: '1241 plad',
    dateOfBirth: new Date('05/10/1959'),
    idNumber: '312342134',
    comment: 'bad guy'
  }, {
    _id: 2,
    firstName: 'who',
    lastName: 'dat',
    address: '42 front beach road',
    dateOfBirth: new Date('05/11/2010'),
    idNumber: '12341251',
    comment: 'good guy'
  }, {
    _id: 3,
    firstName: 'yo',
    lastName: 'da',
    address: '1241 asdf',
    dateOfBirth: new Date('4/2/2000'),
    idNumber: '1235125',
    comment: 'test guy'
  }];
  return {
    getAll: function() {
      return Gs;
    },
    findByGuest: function(guest) {
      return Gs;
    },
    getById: function(id) {
      return Gs[id];
    },
    update: function(guest) {
      Gs[guest._id] = guest;
    }
  };
});