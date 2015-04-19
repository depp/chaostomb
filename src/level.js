'use strict';
var fx = require('./fx');
var input = require('./input');
var monster = require('./monster');
var params = require('./params');
var props = require('./props');
var player = require('./player');
var shots = require('./shots');

function Level() {
	this.gStartInfo = null;
	this.gInput = null;
	this.gPlayer = null;
	this.gTiles = null;
	this.gProps = null;
	this.gMonsters = null;
	this.gShots = null;
	this.gFx = null;
	this.gUi = null;
	this.gPaused = false;
}

Level.prototype.init = function(startInfo) {
	this.gInput = input.getKeys();
	this.gStartInfo = startInfo;
	this.gPaused = false;
};

Level.prototype.preload = function() {
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
};

Level.prototype.create = function() {
	var i;

	game.antialias = false;
	game.stage.smoothed = false;
	game.physics.startSystem(Phaser.Physics.ARCADE);

	var map = game.add.tilemap(this.gStartInfo.level);
	map.addTilesetImage('tiles', 'tiles');
	this.gTiles = map.createLayer('Main');
	this.gTiles.resizeWorld();
	map.setCollision([1], true, 'Main', true);

	var propsetIdx = map.getTilesetIndex('props');
	if (!propsetIdx) {
		console.error('No prop tileset');
		return;
	}
	var propGid = map.tilesets[propsetIdx].firstgid;

	this.gProps = new props.Props(this);
	this.gMonsters = new monster.Monsters(this);
	this.gPlayer = new player.Player(this);
	this.gShots = new shots.Shots(this);
	this.gFx = new fx.Fx(this);
	this.gUi = game.add.group();

	var olayer = map.objects.Default;
	for (i = 0; i < olayer.length; i++) {
		var info = olayer[i];
		if (typeof info.gid == 'number') {
			this.gProps.spawn(info.gid - propGid, info);
			continue;
		}
		var func = this['spawn' + info.type];
		if (func) {
			func.call(this, info);
			continue;
		}
		if (info.type in params.MONSTERS) {
			this.gMonsters.spawn(info);
			continue;
		}
		console.error('Unknown object type: ' + info.type);
	}
};

Level.prototype.spawnPlayer = function(obj) {
	this.gPlayer.spawn(obj);
};

Level.prototype.update = function() {
	input.update();
	if (!this.gPaused) {
		this.gProps.update();
		this.gPlayer.update();
		this.gMonsters.update();
		this.gShots.update();
		this.gFx.update();
	}
};

// Set whether level action is paused.
// Does not pause tweens.
Level.prototype.setPaused = function(flag) {
	flag = !!flag;
	if (flag == this.gPaused) {
		return;
	}
	game.physics.arcade.isPaused = flag;
	this.gPaused = flag;
};

module.exports.Level = Level;
