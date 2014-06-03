/**
 * Created by Brian on 5/30/2014.
 */
'use strict';

angular.module('Grid')
  .directive('explosion', function($animate) {
    return {
      restrict: 'EA',
      link: function (scope, element, attrs) {
        // TODO  Sloppy temporary solution to dynamic sizing and tile count. Do better!
        // Since stage can change, must set CSS values in Javascript
        element.css('width', scope.explosion.size);
        element.css('height', scope.explosion.size);
        var adjustedWidth = scope.explosion.size * 15; // TOTO Get this from stylesheet later
        var backSize = adjustedWidth + "px " + scope.explosion.size +"px";
        var backPos = "-" + adjustedWidth + "px";
        element.css('background-size', backSize);
        // Location
        element.css('left', scope.explosion.x);
        element.css('top', scope.explosion.y);
        // Rotation
        var r = 'rotate(' + scope.explosion.rotation + 'deg)';
        element.css({
            '-moz-transform': r,
            '-webkit-transform': r,
            '-o-transform': r,
            '-ms-transform': r}
        );

        // Angular is lacking adding in @keyframes, so doing it with a jQuery library

        // var prefix = (function () { var styles = window.getComputedStyle(document.documentElement, ''), pre = (Array.prototype.slice .call(styles) .join('')  .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']) )[1], dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1]; return { dom: dom, lowercase: pre, css: '-' + pre + '-', js: pre[0].toUpperCase() + pre.substr(1) }; })();
        //Note the variable notation to be able to add vendor specific prefix

          $.keyframe.define({
            name: 'exploding',
            from: {
              'background-position': '0px'
            },
            to : {
              'background-position': backPos
            }
          });


      }
    };
  });