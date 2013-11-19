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

    .controller('MainCtrl', ['$scope', 'ParseService', function($scope, ParseService) {
        $scope.headline = "Artisan of Italy";

        $scope.strap = Parse.Object("Strap");
        $scope.strapCollection = Parse.Collection({model:$scope.strap});

        $scope.query = new Parse.Query()

//        $scope.collectionQuery = new Parse.Query("Strap");

        $scope.itemQuery.equalTo("ASIN", "B009PP1IYI");
        $scope.itemQuery.find({
            success: function(items) {
                console.log(items[0].attributes);
              angular.forEach(items, function(v, i){
                  $scope.items.push(v.id);
              })

            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });

    }]);