'use strict';

angular.module('schyllingApp')

    .controller('MainCtrl', ['$scope', 'ParseService', 'monocle', '$log', function($scope, ParseService, monocle, $log) {
        $scope.headline = "Handmade.";
    }]);