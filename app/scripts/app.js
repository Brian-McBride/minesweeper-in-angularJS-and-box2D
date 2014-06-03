'use strict';

var mineBoom = angular
  .module('minesweeperApp', [
    'ngCookies',
    'Game'
  ])
  .controller('GameController', function(GameManager) {
    //Grab an instance of the GameManager
    this.game = GameManager;

    this.newGame = function () {
      // Set game variables from CSS

      // Initalize a new game
      this.game.newGame();

    };

    this.newGame();
  })
  .service('preloader' , function() {

  });
