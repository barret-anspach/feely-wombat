'use strict';

angular.module('schyllingApp')

    .controller('MainCtrl', ['$scope', 'monocle', '$log', function($scope, monocle, $log) {
        $scope.headline = "Handmade.";
    }]);