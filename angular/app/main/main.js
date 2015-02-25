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
    $scope.reservations = reservations.getAll();
    $scope.$location = $location;
}]);