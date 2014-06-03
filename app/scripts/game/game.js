/**
 * Created by Brian on 5/31/2014.
 */
'use strict';

angular.module('Game', ['Grid', 'Broadcaster'])
  .service('GameManager', function(GridService, Events, CraterModel, ExplosionModel, SoundManager) {

    var that = this;

    this.grid = [];
    this.tiles = [];
    this.craters = [];
    this.explosions = [];

    this.boardWidth = 600;   // Default width is 400 pixels
    this.boardColumns = 18;  // Default width of columns
    this.boardRows = 14;     // Default width of rows
    this.padding = 0;        // Space between cells?
    this.mineCount = 52;
    this.craterSize = (this.boardWidth - this.boardColumns * this.padding) / this.boardColumns * 2;
    this.explosionSize = this.craterSize * 4;
    this.craterVarience = this.craterSize * .5;

    this.setBoardWidth = function (tWidth) {
      console.log("Setting Board width: " + tWidth)
    };

    this.newGame = function () {
      // Create an empty gameboard or reset the gameboard
      GridService.buildEmptyGameBoard(this.boardColumns, this.boardRows, this.boardWidth, this.padding);
      this.grid = GridService.grid;
      this.tiles = GridService.tiles;
      GridService.populateMines(this.mineCount);

      // Init game state

      // Clear out any old sounds?
    };

    this.resetGame = function () {
     GridService.resetGame();
      this.grid = [];
      this.tiles = [];
      this.craters = [];
      this.explosions = [];
     this.newGame();
    };

    // Reveal a tile action
    this.revealTile = function (tileID) {

      // Call GridService to reveal tiles and update gameboard
      GridService.revealTile(tileID);

      // Check to see if that was the last move, if so end the game

    };

    this.rClickHandeler = function(tileID) {
      GridService.toggleFlag(tileID);
    };

    // Update the score
    this.updateScores = function () {

    };

    // Check if there are moves available
    this.movesAvailable = function () {

    };

    // Explosion event listener
    this.explosionListener = function (event, type, location) {
      // Create/trigger decal
      var size = Math.random() * (that.craterVarience) + that.craterSize;
      var rotation = Math.random() * 360;
      var position = {
        x: location.x - size/2 ,
        y: location.y - size/2
      };
      that.craters.push ( new CraterModel(position, size, rotation) );

      // Trigger sprite explosion graphic
      // Going crazy! Avoiding canvas, the easy way, and sticking all to CSS/Angular way of sprite animation!
      // TODO You know, I'd like to remove this from the array once the animation is finished... part of the directive?
      position = {
        x: location.x - that.explosionSize/2 ,
        y: location.y - that.explosionSize/2
      }
      that.explosions.push ( new ExplosionModel(position, that.explosionSize, rotation) );

    };
    Events.on('explosion', this.explosionListener );;

  })
  .factory('CraterModel', function() {
    // TODO just wrap this in a return if I don't end up adding methods.
    var crater = function(position, size, rotation) {
      this.size = size;
      this.rotation = rotation;
      this.x = position.x;
      this.y = position.y;
    };

    return crater;
  })
  .factory('ExplosionModel', function() {
    // TODO just wrap this in a return if I don't end up adding methods.
    var explosion = function(position, size, rotation) {
      this.size = size;
      this.rotation = rotation;
      this.x = position.x;
      this.y = position.y;
    };
    return explosion;
  })
  .service('SoundManager', function(Events, $window) {
    var that = this;
    this.soundsLoaded = false;

    if ( $window.isIE ) {
      createjs.Sound.registerPlugins ([ createjs.FlashPlugin ]);
    } else {
      createjs.Sound.registerPlugins ([ createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashPlugin ]);
    } // Endif.

    createjs.Sound.alternateExtensions = ["ogg"];

    // TODO: move to preloader section
    //createjs.Sound.addEventListener('fileload', createjs.proxy(this.loadComplete, this) );
    createjs.Sound.registerSound({id:"boom", src:"sounds/boom.mp3"});

    // Explosion event listener
    this.explosionListener = function (event, type, location) {
      createjs.Sound.play("boom");
    };

    Events.on('explosion', this.explosionListener );

  });