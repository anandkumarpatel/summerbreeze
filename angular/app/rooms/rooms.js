'use strict';

angular.module('myApp.rooms', ['ngRoute', 'ngMaterial'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/rooms', {
    templateUrl: 'rooms/list.html',
    controller: 'RoomsCtrl'
  })
  .when('/rooms/:id', {
    templateUrl: 'rooms/edit.html',
    controller: 'RoomsIdCtrl'
  });
}])

.controller('RoomsCtrl', ['$scope', '$location', '$window', 'rooms',
  function($scope, $location, $window, rooms) {
    $scope.rooms = rooms.getAll();
    $scope.go = function (path) {
      $location.path('/rooms/'+path);
    };
    $scope.goBack = function() {
      $window.history.back();
    };
}])

.controller('RoomsIdCtrl',
  ['$scope', '$routeParams', '$window', '$mdDialog', 'rooms',
  function($scope, $routeParams, $window, $mdDialog, rooms) {
    $scope.room = angular.copy(rooms.getById($routeParams.id));

    function validate(ev) {
      if ($scope.roomForm.$valid) {
        return true;
      }
      return false;
    }

    $scope.goBack = function() {
      $window.history.back();
    };

    $scope.bedTypes = [1, 2];
    $scope.status = [1, 2];

    $scope.update = function(ev) {
      if (validate(ev)) {
        var confirm = $mdDialog.confirm()
        .title('update room?')
        .ok('yes')
        .cancel('go back')
        .targetEvent(ev);
        $mdDialog.show(confirm).then(function() {
          rooms.update($scope.room);
          $window.history.back();
        });
      }
    };
}])

.controller('RoomSelection',
  ['$scope', '$mdDialog', 'rooms', 'checkIn', 'checkOut',
  function($scope, $mdDialog, rooms, checkIn, checkOut) {
    $scope.rooms = rooms.getAvailable(checkIn, checkOut);

    $scope.save = function(room) {
      if ($scope.roomForm.$valid) {
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

.filter('f_bedTypes', function () {
  var types = {
    1: 'single',
    2: 'double'
  };
  return function (item) {
    return types[item];
  };
})

.filter('f_status', function () {
  var status = {
    1: 'available',
    2: 'dirty'
  };
  return function (item) {
    return status[item];
  };
})

.filter('f_smoking', function () {
  return function (item) {
    return item ? 'smoking' : 'non-smoking';
  };
})

.factory('rooms', function() {
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
    update: function(data) {
      Rs[data.number] = data;
    }
  };
});