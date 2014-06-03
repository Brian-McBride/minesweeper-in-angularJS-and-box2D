/**
 * Created by Brian on 5/31/2014.
 */
'use strict';

angular.module('Grid')
  .directive('gamegrid', function() {
    return {
      restrict: 'EA',
      link: function (scope, element) {
        // TODO  Sloppy temporary solution to dynamic sizing and tile count. Do better!
        element.css('width', scope.cell.size);
        element.css('height', scope.cell.size);
        element.css('left', scope.cell.x);
        element.css('top', scope.cell.y);
      }
    };
  });
