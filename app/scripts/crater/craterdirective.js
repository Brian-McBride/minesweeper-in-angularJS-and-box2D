/**
 * Created by Brian on 5/30/2014.
 */
'use strict';

angular.module('Grid')
  .directive('crater', function() {
    return {
      restrict: 'EA',
      link: function (scope, element) {
        // TODO  Sloppy temporary solution to dynamic sizing and tile count. Do better!
        element.css('width', scope.crater.size);
        element.css('height', scope.crater.size);
        element.css('left', scope.crater.x);
        element.css('top', scope.crater.y);
        var r = 'rotate(' + scope.crater.rotation + 'deg)';
        element.css({
          '-moz-transform': r,
          '-webkit-transform': r,
          '-o-transform': r,
          '-ms-transform': r}
        );
      }
    };
  });