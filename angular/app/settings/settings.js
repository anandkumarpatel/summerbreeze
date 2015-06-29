'use strict';

angular.module('myApp.settings', ['ngRoute', 'ngMaterial'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/settings', {
    templateUrl: 'settings/edit.html',
    controller: 'SettingsCtrl'
  });
}])

.controller('SettingsCtrl', ['$scope', '$location', '$window', '$mdDialog', 'settings',
  function($scope, $location, $window, $mdDialog, settings) {
    settings.get()
      .success(function(setting) {
        $scope.setting = setting;
      })
     .error(handleError($mdDialog));

    function validate(ev) {
      if ($scope.settingForm.$valid) {
        return true;
      }
      return false;
    }

    $scope.update = function(ev) {
      if (validate(ev)) {
        var confirm = $mdDialog.confirm()
        .title('update settings?')
        .ok('yes')
        .cancel('go back')
        .targetEvent(ev);
        $mdDialog.show(confirm).then(function() {
          settings.update($scope.setting)
            .success(function(settings) {
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

.factory('settings', ['$http', function($http) {
  var urlBase = 'http://localhost:8080/settings/';
  return {
    get: function() {
      return $http.get(urlBase);
    },
    update: function(setting) {
      return $http.patch(urlBase, setting);
    }
  };
}]);

function handleError ($mdDialog) {
  return function (err) {
    var message = err && err.stack || 'something went wrong';
    $mdDialog.show($mdDialog.alert().title(message).ok('OK').targetEvent(null));
  };
}