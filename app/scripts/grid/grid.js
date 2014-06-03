/**
 * Created by Brian on 5/31/2014.
 */
'use strict';

angular.module('Grid', ['Broadcaster', 'ngAnimate'])
  .provider('GridService', function () {

    var that = this;
    this.grid = [];
    this.tiles = [];

    this.gridCols = 0;
    this.gridRows = 0;
    this.boardWidth = 0;
    this.boardHeight = 0;

    // Going to keep an array of the mined tiles for faster updating the grid values
    var minedTiles = [];

    // Offset object for checking neighbors;
    this.offsets = {};

    this.firstclick = true;
    this.gameReady = false;



    this.$get = function (TileModel, GridModel, Events, Physics, GameTimer, $timeout) {

      this.buildEmptyGameBoard = function (tCols, tRows, tWidth, tPadding) {
        Physics.init();
        this.gridCols = tCols;
        this.gridRows = tRows;
        var tSize = (tWidth - tCols * tPadding) / tCols;
        var tSpaces = tCols * tRows;
        this.boardWidth = tSize * this.gridCols;
        this.boardHeight = tSize * this.gridRows;
        this.explosionRadius = tSize * 6;

        // Create the physics walls too
        Physics.createWalls(this.boardWidth, this.boardHeight);

        this.grid = [];
        for (var i = 0; i < tSpaces; i++) {
          var pos = {x: 0, y: 0};
          pos.x = (tSize + tPadding) * i;
          // Simple wrapping conditional
          if (pos.x >= tWidth) {
            var offset = Math.floor(pos.x / tWidth);
            pos.y = offset * (tSize + tPadding);
            pos.x = pos.x - (offset * tWidth);
          }
          this.grid[i] = new GridModel(i, pos, tSize);
          this.tiles[i] = new TileModel(i, pos, tSize);
          this.gridStackAdd(i ,i);
          Physics.createTile(that.tiles[i]);

        }

        // Initalize new offsets
        this.offsets = {
          NW: 0 - this.gridCols - 1,
          N:  0 - this.gridCols,
          NE: 0 - this.gridCols + 1,
          W:  0 - 1,
          E:  1,
          SW: 0 + this.gridCols - 1,
          S:  0 + this.gridCols,
          SE: 0 + this.gridCols + 1
        };

        this.gameReady = true;


      };

      this.resetGame = function () {
        this.gameReady = false;
        this.firstclick = true;
        // Go ahead and reveal all the tiles, makes it so they can't be clicked.
        this.tiles = [];
        this.grid = [];
        // kill the physics engine.
        Physics.halt();

      }

      this.populateMines = function (numOfMines) {

        minedTiles = []; // Reset the reference array
        while (numOfMines > 0) {
          var tPlace = Math.floor( Math.random() * that.tiles.length );
          if (!that.tiles[tPlace].isMined) {
            that.tiles[tPlace].isMined = true;
            minedTiles.push(tPlace);
            this.reportMine(tPlace);
            numOfMines--;
          }
        }

      };

      this.getNeighborhood = function (gID) {
        var neighbors = [];

        // Check to see if neighbor is already cached.
        if (this.grid[gID].neighbors != null) {
          return this.grid[gID].neighbors;
        }

        var tLoc = gID - Math.floor(gID / this.gridCols) * this.gridCols;

        for (var loc in this.offsets) {
          var offset = gID + this.offsets[loc];
          // Check east first
          if (offset < 0 || offset >= this.grid.length) {
            continue;
          } else if ((tLoc == 0) && (loc == 'W' || loc == 'NW' || loc == 'SW')) {
            continue;
          } else if ((tLoc == this.gridCols - 1 ) && (loc == 'E' || loc == 'NE' || loc == 'SE')) {
            continue;
          }
          neighbors.push(offset);
        }
        // Cache for later use
        this.grid[gID].neighbors = neighbors;
        return neighbors;
      };

      this.revealTile = function (tileID) {
        if (this.firstclick == true) {
          this.firstclick = false;
          if ( this.tiles[tileID].isMined ) {
            this.tiles[tileID].isMined = false;
            // NOTE: Below assumes "normal" starting position. Does not find actual grid space
            this.removeMine(tileID);
          }
        }
        // halt recursive reveals
        if (this.tiles[tileID].tileState != 'blank') { return;}
        if (this.tiles[tileID].isMined == true) {
          this.destroyTile(tileID);
        } else {
          this.clearTile(tileID);
        }
      };

      this.destroyTile = function (tileID) {
        // halt recursive explosions
        if (this.tiles[tileID].tileState == 'exploded') {return;}
        // Tile needs to update the grid information - where it is currently
        var gID = this.findTileGrid(tileID);
        this.removeMine(gID);
        // Time to handle the explosion.
        var explodingOrigin = {
          x: this.tiles[tileID].x + this.tiles[tileID].size/2,
          y: this.tiles[tileID].y + this.tiles[tileID].size/2
        };
        // Trigger a global event, for graphics, sound, etc...
        Events.emit('explosion', explodingOrigin);
        // Call the Physics engine to remove the file from the stage:
        Physics.destroyTile(this.tiles[tileID]);
        // Clear graphics
        this.tiles[tileID].tileState = 'exploded';

        // Destroy the neighbors too
        // TODO add in functionality for the grid to report multiple tiles.
        var neighbors = this.getNeighborhood(gID);
        for(var i = neighbors.length - 1; i >= 0; i--) {
          var cNeighbor = neighbors[i];
          // Now loop through the tiles living on this square
          var livingHere = this.grid[cNeighbor].livingHere;
          for(var j = livingHere.length - 1; j >= 0; j--) {
            // TODO, well I'll be trusting of this data. I should double check - who knows what physics might have happened
            var living = livingHere[j];
            // check to see if it is a mined tile, if so trigger a normal reveal tile.
            if (this.tiles[living].isMined == true) {
              //this.destroyTile(cNeighbor);
              this.destoryTimeout(living, 50*i);
            } else {
              // Call the Physics engine to remove the file from the stage:
              Physics.destroyTile(this.tiles[living]);
              this.tiles[living].tileState = 'exploded';
            }
          }
        }

        // Set up physics for tiles nearby
        Physics.activateTiles(this.tiles[tileID]);

      };

      this.clearTile = function (tileID) {
        // Tile needs to update the grid information - where it is currently

        var gID = this.findTileGrid(tileID);
        // set revealed state
        this.tiles[tileID].tileState = 'revealed';
        this.tiles[tileID].revealing = false;
        // Remove physics properties
        Physics.destroyTile(this.tiles[tileID]);

        // If empty, reveal everything nearby... well, hide any tile living on this grid square
        // TODO add in functionality for the grid to report multiple tiles.
        if (this.grid[gID].minesNearby == 0) {
          var neighbors = this.getNeighborhood(gID);
          for(var i = neighbors.length - 1; i >= 0; i--) {
             var cNeighbor = neighbors[i];

            // Now loop through the tiles living on this square
            var livingHere = this.grid[cNeighbor].livingHere;
            for(var j = livingHere.length - 1; j >= 0; j--) {
              // TODO, well I'll be trusting of this data. I should double check - who knows what physics might have happened
              var living = livingHere[j];

              if (this.tiles[living].tileState == 'blank' && !this.tiles[living].revealing) {
                // A little delay so that the tiles cascade reveal themselves.
                // Setting a flag to reduce the number of recursive timeout calls
                this.tiles[living].revealing = true;
                this.revealTimeout(living, 2*i);
              }
            }
          }
        }
      };

      this.revealTimeout = function (tileID, delay) {
        // TODO Angular $timeout REALLY sucks. Causes HUGE performance issues.
        /*
              AngularJS has a huge issue with staggering the reveal here. I used their $timeout and my game tick.
              In all cases, staggering this reveal causes a HUGE degradation in performance.
              I am removing it until I can satisfy the cause at the cost of a less slick interface.
              Staggered reveals are nicer. I'll keep explosions staggered.
         */

/*        that.revealTile(tileID);
        return;*/

        $timeout(function() {
          that.revealTile(tileID);
        }, delay);

/*      // Attempt to use the game timer, just in case $timeout was bad: No improvement
        var startTime = new Date();
        var nowTime = 0;

        function tick () {
          nowTime = new Date();
          if (nowTime - startTime > delay) {
            that.revealTile(tileID);
          } else {
            GameTimer( tick );
          }
        };
        if (nowTime ==0 ) { GameTimer( tick ); }
  */
      };

      this.destoryTimeout = function (tileID, delay) {
        // TODO Using AngularJS $timeout instead of SetTimeout - change to port to other frameworks
        $timeout(function() {
          that.destroyTile(tileID);
        }, delay);
      };

      this.findTileGrid = function (tileID) {

        var sizeOffset = this.tiles[tileID].size / 2 ;
        var centerX = this.tiles[tileID].x + sizeOffset;
        var centerY = this.tiles[tileID].y + sizeOffset;
        var myCol = Math.floor(centerX / this.boardWidth * this.gridCols);
        var myRow = Math.floor(centerY / this.boardHeight * this.gridRows);
        var myGrid = myRow * this.gridCols + myCol;


        // Errors
        if (myGrid < 0) {
          myGrid = 0;
        } else if (myGrid > this.grid.length) {
          myGrid = this.grid.length;
        }

        return myGrid;
      };

      this.reportMine = function (gID) {
        // Add itself
        this.grid[gID].addNearbyMine();
        // Now tell the neighboord.
        var neighbors = this.getNeighborhood(gID);
        for(var i = neighbors.length - 1; i >= 0; i--) {
          this.grid[neighbors[i]].addNearbyMine();
        }
      };

      this.removeMine = function (gID) {

        if (gID < 0) {
          console.warn("Tile out of grid:" + gID);
          gID = 0;
        } else if (gID > this.grid.length) {
          console.warn("Tile out of grid:" + gID);
          gID = this.grid.length;
        }

        this.grid[gID].removeNearbyMine();
        // Now tell the neighboord.
        var neighbors = this.getNeighborhood(gID);
        for(var i = neighbors.length - 1; i >= 0; i--) {
          this.grid[neighbors[i]].removeNearbyMine();
        }
      };

      this.toggleFlag = function (tileID) {
        if (this.tiles[tileID].tileState == 'blank') {
          this.tiles[tileID].tileState = 'flagged';
        } else if (this.tiles[tileID].tileState == 'flagged') {
          this.tiles[tileID].tileState = 'blank';
        }
      };

      this.gridStackRemove = function (gID, tID) {
        removeFromArray(this.grid[gID].livingHere, tID);

        function removeFromArray(arr, item) {
          for(var i = arr.length -1; i >= 0; i--) {
            if(arr[i] === item) {
              arr.splice(i, 1);
            }
          }
        }

      };



      this.gridStackAdd = function (gID, tID) {
        if ( typeof this.grid[gID].livingHere === undefined) {
          console.log("tile got blasted out of scope.  Grid: "+gID+"  Tile:"+tID);
          return;
        }
        this.grid[gID].livingHere.push(tID);
      };

      // Listeners

      this.tickListener = function () {
        var oldGrid, newGrid;

        // Let's loop through and update tile positions
        for(var i = that.tiles.length - 1; i >= 0; i--) {
          if ( that.tiles[i].physics.GetBody().IsActive() && that.tiles[i].physics.GetBody().GetType() == 2 ) {

            if ( that.tiles[i].tileState != 'revealed' || that.tiles[i].tileState != 'exploded' ) {
              // TODO investiate performacne here
              oldGrid = that.findTileGrid(i);
              // Update the tile position within it's own coordinates
              that.tiles[i].updatePhysics();
              newGrid = that.findTileGrid(i);

              // Update the tile count in each space
              if ( (oldGrid != newGrid)) {
                // pull out living status for grid
                that.gridStackRemove(oldGrid, i);
                that.gridStackAdd(newGrid, i);

                // add to stack on new space
                if ( that.tiles[i].isMined == true ) {
                  that.removeMine(oldGrid);
                  that.reportMine(newGrid);
                }
              }
            }

           }
        }

      };
      Events.on('gameTick', this.tickListener );


      return this;
    };

  })
  .factory('TileModel', function() {

    var Tile =  function(id, position, size) {
      // Probably overkill but thinking about adding methods to the tiles, so separating it out as a factory
      this.id = id;
      this.size = size;
      this.x = position.x;
      this.y = position.y;
      this.rotation = 0;
      this.isMined = false;
      this.tileState = 'blank';
      this.revealing = false;
      this.physics = null;
    };

    Tile.prototype.getPosition = function() {
      return {
        x: this.x,
        y: this.y
      };
    };

    Tile.prototype.updatePhysics = function() {
      // Update the positon from Physics...
      var SCALE = 25;
      this.x = this.physics.GetBody().GetPosition().x * SCALE - this.size/2;
      this.y = this.physics.GetBody().GetPosition().y * SCALE - this.size/2;
      this.rotation = this.physics.GetBody().GetAngle() * (180/Math.PI);
    };

    return Tile;

  })
  .factory('GridModel', function() {
    var gCell = function(id, position, size) {
      this.id = id;
      this.size = size;
      this.x = position.x;
      this.y = position.y;
      this.minesNearby = 0;
      this.neighbors = null;
      this.livingHere = [];
    };

    gCell.prototype.addNearbyMine = function() {
      this.minesNearby++;
    };

    gCell.prototype.removeNearbyMine = function() {
      this.minesNearby--;
      if (this.minesNearby < 0) {
        this.minesNearby = 0;
        console.warn('Issue with mine reporting, space less than zero mines');
      }
    };

    return gCell;
  })
  .service('Physics', function(Events, GameTimer) {

    var world = null;
    var destructionHeap = [];  // Box2DWeb won't destroy an object on a callback, so I'll clean up these after each tick.

    //Shortcut Variables
    var b2Vec2 = Box2D.Common.Math.b2Vec2
      , b2AABB = Box2D.Collision.b2AABB
      , b2BodyDef = Box2D.Dynamics.b2BodyDef
      , b2Body = Box2D.Dynamics.b2Body
      , b2FixtureDef = Box2D.Dynamics.b2FixtureDef
      , b2Fixture = Box2D.Dynamics.b2Fixture
      , b2World = Box2D.Dynamics.b2World
      , b2MassData = Box2D.Collision.Shapes.b2MassData
      , b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
      , b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
      , b2DebugDraw = Box2D.Dynamics.b2DebugDraw
      ;

    var SCALE = 25;


    /*
     * Converts from degrees to radians.
     */
    Math.radians = function(degrees) {
      return degrees * Math.PI / 180;
    };

    /*
     * Converts from radians to degrees.
     */
    Math.degrees = function(radians) {
      return radians * 180 / Math.PI;
    };

    /*
     * Normalize2
     * Returns the normal of the vector b.
     */
    function Normalize2(b) {
      return Math.sqrt(b.x * b.x + b.y * b.y);
    }

    this.init = function () {
      // Create the physics world
      world = new b2World(
        new b2Vec2(0, 15)    //gravity
        ,  true              //allow sleep
      );

/*
      //setup debug draw
      var debugDraw = new b2DebugDraw();
      debugDraw.SetSprite(document.getElementById("debugstage").getContext("2d"));
      debugDraw.SetDrawScale(SCALE);
      debugDraw.SetFillAlpha(0.1);
      debugDraw.SetLineThickness(0);
      debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
      world.SetDebugDraw(debugDraw);
*/


      // TODO move the game timer to the game controller?
      GameTimer(update); // Start the loop

    }

    // Why slow it down?
    //setTimeout(init, 6000);

    function update() {

      if (world === undefined || world === null) {
        console.log("Game world non-existant, kiling loop");
        return false;
      }

      world.Step(
          1 / 60   //frame-rate
        ,  10       //velocity iterations
        ,  10       //position iterations
      );
      world.DrawDebugData();
      world.ClearForces();

      // Loop through and destroy tiles
      //console.log( world.IsLocked() );
      for(var i = destructionHeap.length - 1; i >= 0; i--) {
        //world.DestroyBody(destructionHeap[i]);
        var tBody = destructionHeap[i];
        tBody.GetBody().SetType(0);
        world.DestroyBody( tBody.GetBody() );
        //tBody.GetBody().
      }
      destructionHeap = []; // Clear the array

      // For now, each tick send out an event to tell the rest of the game physics are updated
      Events.emit('gameTick');

      //that.stats.update();
      GameTimer(update);
    }

    this.halt = function() {
      world = null;
    }


    this.createTile = function (tile) {
      var width = tile.size / 2 / SCALE;
      var height = tile.size / 2 / SCALE;
      var locX = (tile.x + tile.size / 2) / SCALE;
      var locY = (tile.y + tile.size / 2) / SCALE;

      // Properties
      var fixDef = new b2FixtureDef;
      fixDef.density = 1.3;
      fixDef.friction = 0.8;
      fixDef.restitution = 0.4;

      //create ground
      var bodyDef = new b2BodyDef;
      bodyDef.type = b2Body.b2_staticBody;

      // positions the center of the object (not upper left!)
      bodyDef.position.x = locX;
      bodyDef.position.y = locY;

      fixDef.shape = new b2PolygonShape;

      // half width, half height. eg actual height here is 1 unit
      fixDef.shape.SetAsBox(width, height);
      fixDef.userData = {tileID : tile.id};
      //fixDef.shape = new b2CircleShape(width);
      tile.physics = world.CreateBody(bodyDef).CreateFixture(fixDef);

    };

    this.destroyTile = function (tile) {
      destructionHeap.push(tile.physics);
    };

    this.activateTiles = function (tile) {

      var locX = (tile.x + tile.size / 2) / SCALE;
      var locY = (tile.y + tile.size / 2) / SCALE;


      // Raycast Method
      var numRays = 32;
      var blastPower = 6;
      var blastRadius = tile.size *2.25/ SCALE;
      var center = new b2Vec2( locX , locY  - 0.01);
      for (var i = 0; i < numRays; i++) {
        var angle = Math.radians((i / numRays) * 360);

        var rayDir = new b2Vec2(Math.sin(angle), Math.cos(angle));
        var rayEnd = new b2Vec2(center.x + blastRadius * rayDir.x,
            center.y + blastRadius * rayDir.y);

        world.RayCast(function(raycast, point){
          var body = raycast.GetBody();
          if (body) {
            convertToDynamic(raycast);
            applyBlastImpulse(body, center, point, blastPower);
          }

        }, center, rayEnd);

      }

      function convertToDynamic(fixture) {
        var thisBody = fixture.GetBody();

        if ( fixture.m_userData != null && fixture.m_userData.isWall == true) { return true; }

        if (thisBody.GetType() == b2Body.b2_staticBody)
        {
          thisBody.SetType(2);
        }
      }

      function applyBlastImpulse(body, blastCenter, applyPoint, blastPower){
        //ignore any non-dynamic bodies
        if ( body.GetType() != b2Body.b2_dynamicBody )
          return;

        var blastDir = new b2Vec2(applyPoint.x - blastCenter.x,
            applyPoint.y - blastCenter.y);
        var distance = Normalize2(blastDir);

        //ignore bodies exactly at the blast point - blast direction is undefined
        if ( distance == 0 )
          return;

        var invDistance = 1 / distance;
        var impulseMag = blastPower * invDistance * invDistance;
        impulseMag = Math.min( impulseMag, 800);
        body.ApplyImpulse( new b2Vec2(impulseMag * blastDir.x, impulseMag * blastDir.y), applyPoint );
      }

    };

    this.createWalls = function (tWidth, tHeight) {

      // Properties
      var fixDef = new b2FixtureDef;
      var bodyDef = new b2BodyDef;
      fixDef.density = 1.0;
      fixDef.friction = 0.5;
      fixDef.restitution = 0.6;
      bodyDef.type = b2Body.b2_staticBody;

      // top wall
      var width = tWidth / 2 / SCALE;
      var height = 10 / 2 / SCALE;
      var locX = (tWidth / 2) / SCALE;
      var locY = (-5) / SCALE;
      fixDef.shape = new b2PolygonShape;
      bodyDef.position.x = locX;
      bodyDef.position.y = locY;
      fixDef.shape.SetAsBox(width, height);
      fixDef.userData = {isWall : true};
      world.CreateBody(bodyDef).CreateFixture(fixDef);

      // Floor
      width = tWidth / 2 / SCALE;
      locY = (tHeight + 5)  / SCALE;
      fixDef.shape = new b2PolygonShape;
      bodyDef.position.x = locX;
      bodyDef.position.y = locY;
      fixDef.shape.SetAsBox(width, height);
      fixDef.userData = {isWall : true};
      world.CreateBody(bodyDef).CreateFixture(fixDef);

      // left wall
      width = 10 / 2 / SCALE;
      height = tHeight / 2 / SCALE;
      locX = (-5) / SCALE;
      locY = (tHeight / 2) / SCALE;
      fixDef.shape = new b2PolygonShape;
      bodyDef.position.x = locX;
      bodyDef.position.y = locY;
      fixDef.shape.SetAsBox(width, height);
      fixDef.userData = {isWall : true};
      world.CreateBody(bodyDef).CreateFixture(fixDef);

      // right wall
      width = 10 / 2 / SCALE;
      height = tHeight / 2 / SCALE;
      locX = (tWidth + 5)  / SCALE;
      locY = (tHeight / 2) / SCALE;
      fixDef.shape = new b2PolygonShape;
      bodyDef.position.x = locX;
      bodyDef.position.y = locY;
      fixDef.shape.SetAsBox(width, height);
      fixDef.userData = {isWall : true};
      world.CreateBody(bodyDef).CreateFixture(fixDef);

    };

  })
  .factory('GameTimer', function($window, $rootScope) {
    var requestAnimationFrame = $window.requestAnimationFrame ||
      $window.mozRequestAnimationFrame ||
      $window.msRequestAnimationFrame ||
      $window.webkitRequestAnimationFrame;


    return function(tick) {
      requestAnimationFrame(function() {
        $rootScope.$apply(tick);
      });
    };
  });