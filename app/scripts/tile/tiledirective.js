/**
 * Created by Brian on 5/31/2014.
 */
'use strict';

angular.module('Grid')
  .directive('tilegrid', function($parse) {
    return {
      restrict: 'EA',
      link: function (scope, element, attrs) {

        // TODO  Sloppy temporary solution to dynamic sizing and tile count... *sigh* sloppy seconds (see griddirective.js)
        element.css('width', scope.tile.size);
        element.css('height', scope.tile.size);
        //element.css('left', scope.tile.x);
        //element.css('top', scope.tile.y);

        scope.$watch(attrs.x, function (x) {
          element.css('left', x + 'px');
        });
        scope.$watch(attrs.y, function (y) {
          element.css('top', y + 'px');
        });
        scope.$watch(attrs.r, function (r) {
          var rotate = 'rotate(' + r + 'deg)';
          element.css({
              '-moz-transform': rotate,
              '-webkit-transform': rotate,
              '-o-transform': rotate,
              '-ms-transform': rotate}
          );
        });
      }
    };
  });
