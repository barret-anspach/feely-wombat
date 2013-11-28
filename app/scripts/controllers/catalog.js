'use strict';

angular.module('schyllingApp')
    .controller('CatalogCtrl', ['$scope', '$modal', 'monocle', '$log', function($scope, $modal, monocle, $log) {
        $scope.$log = $log;
        $scope.filter = "name";

        $scope.whereClause = {};

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
            $scope.strapQuery = monocle.Strap.query($scope.whereClause);
            $scope.fetch();
        };

        $scope.fetch = function(){
            $scope.strapQuery.fetch().success(function(data){
                $scope.getOptions(data);
            });
        };

        $scope.getOptions = function(items){
            $scope.strapTypes = [];
            $scope.strapSizes = [];
            $scope.strapColors = [];

            angular.forEach(items, function(v, i){
                $scope.strapTypes.push(v.type);
                $scope.strapSizes.push(v.size);
                $scope.strapColors.push(v.colorName);
            });

            $scope.strapTypes = _.uniq($scope.strapTypes).sort();
            $scope.strapColors = _.uniq($scope.strapColors).sort();
            $scope.strapSizes = _.uniq($scope.strapSizes).sort();

            console.log($scope.strapTypes);
            console.log($scope.strapColors);
            console.log($scope.strapSizes);
//            console.log($scope.strapTypes);
        };

        $scope.resetOptions = function(){
            $scope.initialize();
        }

        $scope.initialize = function (){
            $scope.currentType = null;
            $scope.currentColor = null;
            $scope.currentSize = null;

            $scope.strapQuery = monocle.Strap.query();

//			HERE, I'M INSTANTIATING A NEW STRAP OBJECT -- WHICH IS WHAT YOUR VIEW WILL BE EDITING
//        $scope.newStrap = new monocle.Strap();
//
//			These queries have to be .fetch() ed to get data from them  -- this fetch method returns a success and error
//			call back like so == also, the response to the query is always added to the query object as $scope.queryObject.items
//			So you can reference that in an ng repeat
            $scope.strapQuery.fetch().success(function(data){
//				process data with an angular.forEach --- or just leave it alone -- just remember that data is the list
//				of results from Parse
                $scope.getOptions(data);

            }).error(function(err){
//				handle error
                    console.log(err)
                });
        };

//			You can do queries on any class you have set up on parse and in your monocle wrapper like this


//        $scope.queryOptions = monocle.Strap.query();


//			To load a single document/object (ie strap) from your collection (ie Strap) initialize it by calling a
//          new monocle.ClassName(id):
//
            /*		$scope.strap = new monocle.Strap("D1ySwFXLmA");

             //			Then load that object like so -- very similarly to the way you .fetch() the query
             $scope.strap.load().success(function(data){
             console.log(data);
             }).error(function(err){
             console.log(err);
             });*/

//            $scope.currentMaterial = 'Alligator';

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

