angular.module('schyllingApp')

    .controller('StrapViewerCtrl', ['$scope', '$state', 'strap', '$modalInstance', function($scope, $state, strap, $modalInstance) {
        $scope.strap = strap;
//        $scope.selected = {
//            strap: $scope.strap
//        };

        $scope.ok = function () {
            $modalInstance.close($scope.strap);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }]);
