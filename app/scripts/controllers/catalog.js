'use strict';

angular.module('schyllingApp')
    .controller('CatalogCtrl', ['$scope', '$modal', 'monocle', '$log', function($scope, $modal, monocle, $log) {
        $scope.$log = $log;
        $scope.filter = "name";

        $scope.setCurrentType = function(type){
            $scope.currentType = type;
        };

        $scope.setCurrentColor = function(color){
            $scope.currentColor = color;
        };

        $scope.setCurrentSize = function(size){
            $scope.currentSize = size;
        };

        $scope.setQuery = function(k, v){
            $scope.whereClause[k] = v;
            $scope.strapQuery = monocle.Strap.query($scope.whereClause).howMany(500);
            $scope.fetch();
        };

        $scope.fetch = function(){
            $scope.strapQuery.fetch().success(function(data){
                $scope.getOptions(data);
            });
        };

				$scope.inAvailableTypes = function(type){
					return _.contains($scope.availableTypes, type);
				};

        $scope.getOptions = function(data){
            $scope.availableTypes = _.uniq(_.pluck(data, 'type'));
            $scope.availableSizes = _.uniq(_.pluck(data, 'size'));
            $scope.availableColors = _.uniq(_.pluck(data, 'colorName'));
        };

        $scope.resetOptions = function(){
            $scope.initialize();
        };

        $scope.initialize = function (){
	          $scope.whereClause = {};
            $scope.currentType = null;
            $scope.currentColor = null;
            $scope.currentSize = null;

            $scope.strapQuery = monocle.Strap.query().howMany(500);

            $scope.strapQuery.fetch().success(function(data){
	            $scope.strapTypes = $scope.availableTypes = _.uniq(_.pluck(data, 'type')).sort();
	            $scope.strapColors = $scope.availableColors =  _.uniq(_.pluck(data, 'colorName')).sort();
	            $scope.strapSizes = $scope.availableSizes =  _.uniq(_.pluck(data, 'size')).sort();
            }).error(function(err){
                console.log(err);
            });
        };

        $scope.open = function (strap) {

            var modalInstance = $modal.open({
                templateUrl: '/views/dialogs/modal.html',
                controller: 'StrapViewerCtrl',
                resolve: {
                    strap: function() {
                        return strap;
                    }
                }
            });

            modalInstance.result.then(function () {
                console.log(strap);
            }, function () {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };

        $scope.initialize();

    }]);

