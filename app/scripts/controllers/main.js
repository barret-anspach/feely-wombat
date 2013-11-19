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
//        Catalog.prototype.__defineGetter__("productTitle", function() {
//            return this.get("title");
//        });
//        Catalog.prototype.__defineSetter__("productTitle", function(aValue) {
//            return this.set("title", aValue);
//        });
//
//        return Catalog;
//    })

    .controller('MainCtrl', ['$scope', 'ParseService', function($scope, ParseService) {
        $scope.headline = {
            title: "Artisan of Italy", subtitle: "Handmade Italian watch straps."
        };

        $scope.strap = Parse.Object("Strap");
        $scope.strapCollection = Parse.Collection({model:$scope.strap});

        $scope.itemQuery = new Parse.Query();

//        $scope.collectionQuery = new Parse.Query("Strap");

        $scope.itemQuery.equalTo("ASIN", "B009PP1IYI");
        $scope.itemQuery.find({
            success: function(items) {
                angular.forEach(items, function(v, i){
                    console.log(items[0].attributes);
                    $scope.items.push(v.id);
                })

            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });

    }]);