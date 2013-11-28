'use strict';

angular.module('schyllingApp')
  .directive('activeNav', function ($state) {
    return {
      restrict: 'EA',
      link: function postLink(scope, element, attrs) {
        console.log($state.current);
        element.addClass('active');
      }
    };
  });
