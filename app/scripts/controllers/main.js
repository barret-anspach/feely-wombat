'use strict';

angular.module('schyllingApp')
    .factory('Catalog', function() {

        var Catalog = Parse.Object.extend("Items", {
            // Instance methods
        }, {
            // Class methods
        }
        );

        // Title property
        Presentation.prototype.__defineGetter__("title", function() {
            return this.get("title");
        });
        Presentation.prototype.__defineSetter__("title", function(aValue) {
            return this.set("title", aValue);
        });

        return Presentation;
    })

    .controller('MainCtrl', ['$scope', 'ParseService', 'monocle', function($scope, ParseService, monocle) {
        $scope.headline = "Artisan of Italy";

//			You can do queries on any class you have set up on parse and in your monocle wrapper like this
			$scope.strapQuery = monocle.Strap.query();


//			These queries have to be .fetch() ed to get data from them  -- this fetch method returns a success and error
//			call back like so == also, the response to the query is always added to the query object as $scope.queryObject.items
//			So you can reference that in an ng repeat
			$scope.strapQuery.fetch().success(function(data){
//				process data with and angular.forEach --- or just leave it alone -- just remember that data.items is the list
//				of results from Parse
				console.log(data);
			}).error(function(err){
//						hadle error
						console.log(err)
					});

//			To load a single document/object (ie strap) from your collection (ie Strap) initialize it by calling a
//      new monocle.ClassName(id):

			$scope.strap = new monocle.Strap("pZYTheRo8t");

//			Then load that object like so -- very similarly to the way you .fetch() the query
			$scope.strap.load().success(function(data){
				console.log(data);
			}).error(function(err){
						console.log(err);
					});

//			Check out the ParseWrapper.coffee to see other available object or query methods...
//			For instance, you can save a strap by:

			$scope.strapNew = new monocle.Strap();

			$scope.strap.type = 'Plastic';
			$scope.strap.name = 'legos';


			$scope.saveStrap = function(strap){
				strap.specificsChanged = false;
				strap.save().success(function(data){
					console.log('saved strap successfully');
					$scope.message = "Saved Strap Successfully"
				})
			};





//

//        $scope.strap = Parse.Object("Strap");
//        $scope.strapCollection = Parse.Collection({model:$scope.strap});
//
//        $scope.query = new Parse.Query()
//
////        $scope.collectionQuery = new Parse.Query("Strap");
//
//        $scope.itemQuery.equalTo("ASIN", "B009PP1IYI");
//        $scope.itemQuery.find({
//            success: function(items) {
//                console.log(items[0].attributes);
//              angular.forEach(items, function(v, i){
//                  $scope.items.push(v.id);
//              })
//
//            },
//            error: function(error) {
//                alert("Error: " + error.code + " " + error.message);
//            }
//        });

    }]);