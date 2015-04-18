'use strict';
var monster = require('./monster');
var params = require('./params');
var walker = require('./walker');

function Level() {
	this.gStartInfo = null;
	this.gInput = null;
	this.gPlayer = null;
	this.gWalker = null;
	this.gTiles = null;
	this.gMonsters = null;
}

Level.prototype = {
	init: function(startInfo) {
		this.gStartInfo = startInfo;
		if (!this.gInput) {
			var k = this.input.keyboard;
			this.gInput = {
				left: k.addKey(Phaser.Keyboard.LEFT),
				right: k.addKey(Phaser.Keyboard.RIGHT),
				up: k.addKey(Phaser.Keyboard.UP),
				down: k.addKey(Phaser.Keyboard.DOWN),
			};
		}
	},

	preload: function() {
		var x, s;
		var images = PATH_MAP.images;
		for (x in images) {
			game.load.image(x, 'images/' + images[x]);
		}
		var spritesheets = PATH_MAP.spritesheets;
		for (x in spritesheets) {
			s = spritesheets[x];
			game.load.spritesheet(x, 'images/' + s.path, s.w, s.h);
		}
		game.load.tilemap(
			this.gStartInfo.level,
			'levels/' + PATH_MAP.levels[this.gStartInfo.level],
			null,
			Phaser.Tilemap.TILED_JSON);
	},

	create: function() {
		var i;

		game.antialias = false;
		game.stage.smoothed = false;
		game.physics.startSystem(Phaser.Physics.ARCADE);

		var map = game.add.tilemap(this.gStartInfo.level);
		map.addTilesetImage('tiles', 'tiles');
		this.gTiles = map.createLayer('Main');
		this.gTiles.resizeWorld();
		map.setCollision([1], true, 'Main', true);

		this.gPlayer = null;
		this.gWalker = null;
		this.gMonsters = this.add.group();
		this.gMonsters.enableBody = true;
		this.gMonsters.physicsBodyType = Phaser.Physics.ARCADE;

		var olayer = map.objects.Default;
		for (i = 0; i < olayer.length; i++) {
			var obj = olayer[i];
			var func = this['spawn' + obj.type];
			if (func) {
				func.call(this, obj);
				continue;
			}
			if (obj.type in monster.TYPES) {
				monster.spawn(this.gMonsters, obj);
				continue;
			}
			console.error('Unknown object type: ' + obj.type);
		}
	},

	spawnPlayer: function(obj) {
		var player = game.add.sprite(obj.x, obj.y, 'player');
		game.physics.arcade.enable(player);
		player.body.gravity.y = params.GRAVITY;
		player.body.collideWorldBounds = true;
		player.body.maxVelocity.set(params.MAX_VELOCITY, params.MAX_VELOCITY);
		this.gPlayer = player;
		this.gWalker = new walker.Walker(player, params.PLAYER_STATS);
	},

	update: function() {
		if (this.gPlayer) {
			game.physics.arcade.collide(this.gPlayer, this.gTiles);
			this.gWalker.updatePlayer(this.gInput);
		}
	}
};

module.exports.Level = Level;
