'use strict';
var fx = require('./fx');
var input = require('./input');
var monster = require('./monster');
var params = require('./params');
var player = require('./player');
var shots = require('./shots');

function Level() {
	this.gStartInfo = null;
	this.gInput = null;
	this.gPlayer = null;
	this.gTiles = null;
	this.gMonsters = null;
	this.gShots = null;
	this.gFx = null;
	this.gUi = null;
}

Level.prototype = {
	init: function(startInfo) {
		this.gInput = input.getKeys();
		this.gStartInfo = startInfo;
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

		this.gMonsters = new monster.Monsters(this);
		this.gPlayer = new player.Player(this);
		this.gShots = new shots.Shots(this);
		this.gFx = new fx.Fx(this);
		this.gUi = game.add.group();

		var olayer = map.objects.Default;
		for (i = 0; i < olayer.length; i++) {
			var obj = olayer[i];
			var func = this['spawn' + obj.type];
			if (func) {
				func.call(this, obj);
				continue;
			}
			if (obj.type in params.MONSTERS) {
				this.gMonsters.spawn(obj);
				continue;
			}
			console.error('Unknown object type: ' + obj.type);
		}
	},

	spawnPlayer: function(obj) {
		this.gPlayer.spawn(obj);
	},

	update: function() {
		input.update();
		if (this.gPlayer) {
			this.gPlayer.update();
		}
		this.gMonsters.update();
		this.gShots.update();
		this.gFx.update();
	}
};

module.exports.Level = Level;
