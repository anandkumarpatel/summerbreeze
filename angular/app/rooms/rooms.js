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
  })
  .when('/admin/room/create', {
    templateUrl: 'rooms/edit.html',
    controller: 'RoomsIdCtrl'
  });
}])

.controller('RoomsCtrl', ['$scope', '$location', '$window', '$mdDialog', 'rooms',
  function($scope, $location, $window, $mdDialog, rooms) {
    rooms.getAll()
      .success(function(rooms) {
        $scope.rooms = rooms;
      })
     .error(function(err) {
        var message = err && err.stack || 'something went wrong';
        $mdDialog.show($mdDialog.alert().title(message).ok('OK').targetEvent(null));
      });

    $scope.go = function (path) {
      $location.path('/rooms/'+path);
    };
    $scope.goBack = function() {
      $window.history.back();
    };
}])

.controller('RoomsIdCtrl',
  ['$scope', '$routeParams', '$window', '$mdDialog', '$location', 'rooms',
  function($scope, $routeParams, $window, $mdDialog, $location, rooms) {
    $scope.isNew = !$routeParams.id;

    if($scope.isNew) {
      $scope.room = {};
    } else {
     rooms.getById($routeParams.id)
      .success(function(room) {
        $scope.room = room[0];
      })
      .error(function(err) {
        handleError(null, err);
      });
    }

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

    $scope.update = function(ev) {
      if (!validate(ev)) {
        return $mdDialog.show($mdDialog.alert().title('missing something').ok('OK').targetEvent(ev));
      }
      var confirm = $mdDialog.confirm()
        .title('update room?')
        .ok('yes')
        .cancel('go back')
        .targetEvent(ev);
      $mdDialog.show(confirm).then(function() {
        if ($scope.isNew) {
          rooms.create($scope.room)
            .success(function(rooms) {
              $location.path('/rooms/');
            })
            .error(function(err) {
              handleError(ev, err);
            });
        } else {
          rooms.update($scope.room)
            .success(function(rooms) {
              $window.history.back();
            })
            .error(function(err) {
              handleError(ev, err);
            });
        }
      });
    };
}])

.controller('RoomSelection',
  ['$scope', '$mdDialog', 'rooms', 'checkIn', 'checkOut', 'currentRooms',
  function($scope, $mdDialog, rooms, checkIn, checkOut, currentRooms) {
    rooms.getAvailable(checkIn, checkOut)
      .success(function(rooms) {
        if (currentRooms.length === 0) {
          $scope.rooms = rooms;
          return;
        }
        // filter out currently selected rooms
        $scope.rooms = rooms.filter(function(aRoom) {
          return !currentRooms.some(function(cRoom, index, cb) {
            return cRoom._id === aRoom._id;
          });
        });
      })
      .error(function(err) {
        $scope.rooms = [];
      });

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

.factory('rooms', ['$http', function($http) {
  var urlBase = 'http://localhost:8080/rooms/';
  var availabilityBase = 'http://localhost:8080/availability/';

  return {
    getAll: function() {
      return $http.get(urlBase);
    },
    getAvailable: function(checkIn, checkOut) {
      return $http.get(availabilityBase, {
        params: {
          checkOut: checkOut.getTime(),
          checkIn: checkIn.getTime()
        }
      });
    },
    getById: function(id) {
      return $http.get(urlBase, {
        params: {
          _id: id
        }
      });
    },
    update: function(room) {
      return $http.patch(urlBase+room._id, room);
    },
    create: function(data) {
      return $http.post(urlBase, data);
    }
  };
}]);
