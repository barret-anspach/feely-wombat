'use strict';

angular.module('schyllingApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute'
])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/nav-bar', {
        templateUrl: 'views/nav-bar.html',
        controller: 'NavBarCtrl'
      })
      .when('/footer', {
        templateUrl: 'views/footer.html',
        controller: 'FooterCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  })

  .service('ParseService', [function() {
    var app_id = "vsph4BARvMHNuQJoRU1lDxhxg1otvLCa4ArSrERA";
    var js_key = "yITNrI3dpR8zFUGvRvrRzKp9RWZk3nf1KMILEn19";
    Parse.initialize(app_id, js_key);
}]);

