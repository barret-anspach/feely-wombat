angular.module('schyllingApp')
    .controller('AppCtrl', ['$scope', '$state', function($scope, $state) {
        $scope.$state = $state;
    }])
