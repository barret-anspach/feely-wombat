'use strict';

angular.module('schyllingApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'ui.router'
])
  .config(function ($stateProvider, $urlRouterProvider) {
    // The other states:
    $stateProvider
        .state('catalog', {
            url: '/catalog',
            templateUrl: 'views/catalog.html',
            controller: 'CatalogCtrl'
        })
        .state('main', {
            url: '/',
            templateUrl: 'views/main.html',
            controller: 'MainCtrl'
        })
        .state('footer', {
            url: '/footer',
            templateUrl: 'views/partials/footer.html',
            controller: 'FooterCtrl'
        })
        .state('admin', {
            url: '/admin',
            templateUrl: 'views/admin.html',
            controller: 'AdminCtrl'
        })
    // For any unmatched url, redirect to /
    $urlRouterProvider.otherwise("/");
  })

  .service('ParseService', [function() {
    var app_id = "vsph4BARvMHNuQJoRU1lDxhxg1otvLCa4ArSrERA";
    var js_key = "yITNrI3dpR8zFUGvRvrRzKp9RWZk3nf1KMILEn19";
    Parse.initialize(app_id, js_key);
}]);

