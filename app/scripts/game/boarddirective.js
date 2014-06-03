/**
 * Created by Brian on 5/31/2014.
 */
angular.module('Game')
  .directive('gameboard', function () {

    return {
      restrict: 'EA',
      link: function (scope, element) {

        // TODO Convert this to a stage listener style event for dynamic resizing of the board
        var theGame = scope.ctrl.game;
        var tSize = (theGame.boardWidth - theGame.boardColumns * theGame.padding) / theGame.boardColumns;
        element.css('width', theGame.boardWidth);
        element.css('height', theGame.boardRows * tSize );
      }
    };

  })
  .directive('minesweeper', function () {

    return {
      restrict: 'EA',
      link: function (scope, element) {

        // TODO Convert better to the "angular" way.
        var theGame = scope.ctrl.game;
        var tSize = (theGame.boardWidth - theGame.boardColumns * theGame.padding) / theGame.boardColumns;
        var mainWidth = theGame.boardWidth + 40*2;
        var mainHeight = theGame.boardRows * tSize + 100 + 80;
        element.css('width', mainWidth);
        element.css('height', mainHeight);
        var backSize = (mainHeight *2) + "px " + mainWidth +"px";
        //element.css('background-size', backSize );
      }
    };

  });