'use strict';

angular.module('schyllingApp')

    .controller('CatalogCtrl', ['$scope', 'ParseService', 'monocle', '$log', function($scope, ParseService, monocle, $log) {
        $scope.headline = "Handmade.";

//			You can do queries on any class you have set up on parse and in your monocle wrapper like this
        $scope.strapQuery = monocle.Strap.query();

//			HERE, I'M INSTANTIATING A NEW STRAP OBJECT -- WHICH IS WHAT YOUR VIEW WILL BE EDITING
        $scope.newStrap = new monocle.Strap();


//			These queries have to be .fetch() ed to get data from them  -- this fetch method returns a success and error
//			call back like so == also, the response to the query is always added to the query object as $scope.queryObject.items
//			So you can reference that in an ng repeat
        $scope.strapQuery.fetch().success(function(data){
//				process data with an angular.forEach --- or just leave it alone -- just remember that data.items is the list
//				of results from Parse
            console.log(data);
        }).error(function(err){
//				handle error
                console.log(err)
            });

//			To load a single document/object (ie strap) from your collection (ie Strap) initialize it by calling a
//          new monocle.ClassName(id):

        /*		$scope.strap = new monocle.Strap("D1ySwFXLmA");

         //			Then load that object like so -- very similarly to the way you .fetch() the query
         $scope.strap.load().success(function(data){
         console.log(data);
         }).error(function(err){
         console.log(err);
         });*/

        $scope.$log = $log;

        $scope.filter = "name";

    }]);