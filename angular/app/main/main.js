'use strict';

angular.module('myApp.main', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/main', {
      templateUrl: 'main/main.html',
      controller: 'Main1Ctrl'
    });
}])
.controller('Main1Ctrl', ['$scope','$location', '$mdDialog', 'reservations',
  function($scope, $location, $mdDialog, reservations) {
    reservations.getAll() // TODO: getTodaysReservation();
      .success(function(reservations) {
        $scope.reservationList = reservations;
      })
     .error(function(err) {
        var message = err && err.stack || 'something went wrong';
        $mdDialog.show($mdDialog.alert().title(message).ok('OK').targetEvent(null));
      });
    $scope.kinds = [1,2,3,4];
    $scope.$location = $location;
    $scope.goRes = function (path) {
      $location.path('/reservations/'+path);
    };
    $scope.checkIn = function(ev, reservation) {
      var confirm = $mdDialog.confirm()
        .title('Would you like to check in guest?')
        .ok('check in')
        .cancel('cancel')
        .targetEvent(ev);
      $mdDialog.show(confirm).then(function() {
        reservations.checkIn(reservation);
      });
    };
    $scope.checkOut = function(ev, reservation) {
      var confirm = $mdDialog.confirm()
        .title('Would you like to check out guest?')
        .ok('check out')
        .cancel('cancel')
        .targetEvent(ev);
      $mdDialog.show(confirm).then(function() {
        reservations.checkOut(reservation);
      });
    };
    $scope.cancel = function(ev, reservation) {
      var confirm = $mdDialog.confirm()
        .title('Are you sure you want to cancel this reservation?')
        .ok('yes')
        .cancel('NO')
        .targetEvent(ev);
      $mdDialog.show(confirm).then(function() {
        reservations.checkOut(reservation);
      });
    };
}]);