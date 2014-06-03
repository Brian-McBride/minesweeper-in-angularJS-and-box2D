/**
 * Created by Brian on 5/31/2014.
 */
'use strict';

// From http://stackoverflow.com/a/15732476
angular.module('Grid')
  .directive('ngRightClick', function($parse) {
    return function(scope, element, attrs) {
      var fn = $parse(attrs.ngRightClick);
      element.bind('contextmenu', function(event) {
        scope.$apply(function() {
          event.preventDefault();
          fn(scope, {$event:event});
        });
      });
    }
  });