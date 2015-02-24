'use strict';

angular.module('myApp.rooms', ['ngRoute', 'ngMaterial'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/rooms', {
    templateUrl: 'rooms/rooms.html',
    controller: 'RoomsCtrl'
  })
  .when('/rooms/:id', {
    templateUrl: 'rooms/room_edit.html',
    controller: 'RoomsIdCtrl'
  });
}])

.controller('RoomsCtrl', ['$scope', '$location', 'rooms', function($scope, $location, rooms) {
    $scope.rooms = rooms.getAll();
    $scope.go = function (path) {
      $location.path('/rooms/'+path);
    };
}])

.controller('RoomsIdCtrl',
  ['$scope', '$routeParams', '$location', 'rooms',
  function($scope, $routeParams, $location, rooms) {
    $scope.room = rooms.getById($routeParams.id);
    $scope.beds = rooms.beds;
    $scope.status = rooms.status;

    $scope.save = function(room) {
      rooms.saveById(room);
    };
}])

.controller('RoomSelection',
  ['$scope', '$mdDialog', 'rooms', 'checkIn', 'checkOut',
  function($scope, $mdDialog, rooms, checkIn, checkOut) {
    $scope.rooms = rooms.getAvailable(checkIn, checkOut);

    $scope.save = function(room) {
      if ($scope.roomForm.$valid) {
        rooms.saveById(room);
        $mdDialog.hide(room);
      }
    };
    $scope.hide = function() {
      $mdDialog.hide();
    };
    $scope.cancel = function() {
      $mdDialog.cancel();
    };

}])

.factory('rooms', function() {
  var beds = [ 'single','double'];

  var status = ['avalible', 'dirty'];

  var Rs = [{
    number: 0,
    smoking: false,
    beds: 1,
    status: 1,
    comment: 'upstairs'
  }, {
    number: 1,
    smoking: false,
    beds: 1,
    status: 2,
    comment: 'upstairs'
  }, {
    number: 2,
    smoking: true,
    beds: 1,
    status: 1,
    comment: 'dirty'
  }, {
    number: 3,
    smoking: true,
    beds: 1,
    status: 2,
    comment: 'upstairs'
  }];
  return {
    getAll: function() {
      return Rs;
    },
    getAvailable: function(checkIn, checkOut) {
      return Rs;
    },
    getById: function(number) {
      return Rs[number];
    },
    saveById: function(data) {
      Rs[data.number] = data;
    },
    status: status,
    beds: beds
  };
});