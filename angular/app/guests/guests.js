'use strict';

angular.module('myApp.guests', ['ngRoute', 'ngMaterial'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/guests', {
    templateUrl: 'guests/guests.html',
    controller: 'GuestsCtrl'
  })
  .when('/guests/:id', {
    templateUrl: 'guests/guest_edit.html',
    controller: 'GuestsIdCtrl'
  });
}])

.controller('GuestsCtrl', ['$scope', '$location', 'guests', function($scope, $location, guests) {
    $scope.guests = guests.getAll();
    $scope.go = function (path) {
      $location.path('/guests/'+path);
    };
}])

.controller('GuestsIdCtrl',
  ['$scope', '$routeParams', '$location', '$mdDialog', 'guests',
  function($scope, $routeParams, $location, $mdDialog, guests) {
    $scope.guest = angular.copy(guests.getById($routeParams.id));

    $scope.save = function(guest) {
      guests.saveById(guest);
    };

    $scope.hide = function() {
      $mdDialog.hide();
    };
    $scope.cancel = function() {
      $mdDialog.cancel();
    };
    $scope.answer = function(answer) {
      $mdDialog.hide(answer);
    };
}])

.controller('GuestsNewCtrl',
  ['$scope', '$routeParams', '$location', '$mdDialog', 'guests',
  function($scope, $routeParams, $location, $mdDialog, guests) {
    $scope.guest = {};

    $scope.save = function(guest) {
      if ($scope.guestForm.$valid) {
        guests.saveById(guest);
        $mdDialog.hide(guest);
      }
    };
    $scope.hide = function() {
      $mdDialog.hide();
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
    getById: function(id) {
      return Gs[id];
    },
    saveById: function(data) {
      Gs[data._id] = data;
    }
  };
});