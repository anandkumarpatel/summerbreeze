'use strict';

angular.module('myApp.main', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/main', {
      templateUrl: 'main/main.html',
      controller: 'Main1Ctrl'
    });
}])
.controller('Main1Ctrl', ['$scope','$location', 'reservations', function($scope, $location, reservations) {
    $scope.reservationList = reservations.getAll(); // getTodaysReservation();
    $scope.reservations = reservations;
    $scope.kinds = [1,2,3,4];
    $scope.$location = $location;
    $scope.goRes = function (path) {
      $location.path('/reservations/'+path);
    };

}]);