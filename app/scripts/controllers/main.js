'use strict';

angular.module('schyllingApp')
//    .factory('Catalog', function() {
//
//        var Catalog = Parse.Object.extend("Items", {
//            // Instance methods
//        }, {
//            // Class methods
//        }
//        );
//
//        // Title property
//        Presentation.prototype.__defineGetter__("title", function() {
//            return this.get("title");
//        });
//        Presentation.prototype.__defineSetter__("title", function(aValue) {
//            return this.set("title", aValue);
//        });
//
//        return Presentation;
//    })

    .controller('MainCtrl', ['$scope', 'ParseService', 'monocle', function($scope, ParseService, monocle) {
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
	//						handle error
							console.log(err)
						});

//			To load a single document/object (ie strap) from your collection (ie Strap) initialize it by calling a
//      new monocle.ClassName(id):

/*			$scope.strap = new monocle.Strap("D1ySwFXLmA");

//			Then load that object like so -- very similarly to the way you .fetch() the query
			$scope.strap.load().success(function(data){
				console.log(data);
			}).error(function(err){
						console.log(err);
					});*/

//			Check out the ParseWrapper.coffee to see other available object or query methods...
//			For instance, you can save a strap by:


			$scope.save = function(strap){
//				THE THING TO REALIZE IS THAT THE WRAPPER TURNS EACH ITEM IN THE QUERY.ITEMS array into an instance of the RESOURCE
//				THIS MEANS THAT YOU CAN CALL ANY METHOD AVAILABLE ON THE RESOURCE CLASS TO THESE THINGS THAT YOUR ITERATING THROUGH
//			  IN YOUR NG-REPEAT
				strap.save().success(function(data){
					$scope.strapQuery.fetch();
					console.log('SUCCESSFULLY SAVED STRAP!');
				}).error(function(err){
							$scope.error = err;
							console.log(err);
				})
			};

			$scope.filter = "name";




			$scope.createStrap = function(){
//				SINCE THIS NEW STRAP IS AN INSTANCE OF A RESOURCE CLASS, YOU CAN CALL SAVE ON IT AS BEFORE
				console.log($scope.newStrap);
				$scope.newStrap.save().success(function(data){
					console.log('saved strap successfully');
					$scope.savedMessage = "Saved Strap Successfully";
//					CLEAR THE NEW STRAP TO BE A NEW INSTANCE OF THE STRAP RESOURCE
					$scope.newStrap = new monocle.Strap();
//					REFRESH THE LIST OF AVAILABLE STRAPS
					$scope.strapQuery.fetch();
				}).error(function(err){
//                      handle error
            console.log(err)
          });
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