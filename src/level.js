'use strict';
var fx = require('./fx');
var input = require('./input');
var monster = require('./monster');
var params = require('./params');
var props = require('./props');
var player = require('./player');
var shots = require('./shots');

// All other tiles in 1-64 are solid, but these kill you.
var OUCH_TILES = [
	// Water
	41, 49, 57,
	// Lava
	23, 24, 31, 32,
];

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

var haveCommonAssets = false;
function loadCommonAssets() {
	if (haveCommonAssets) {
		return;
	}
	haveCommonAssets = true;
	var x, s, uris, i;
	var images = PATH_MAP.images;
	for (x in images) {
		game.load.image(x, 'images/' + images[x]);
	}
	var spritesheets = PATH_MAP.spritesheets;
	for (x in spritesheets) {
		s = spritesheets[x];
		game.load.spritesheet(x, 'images/' + s.path, s.w, s.h);
	}
	var sfx = PATH_MAP.sfx;
	for (x in sfx) {
		s = sfx[x];
		uris = [];
		for (i = 0; i < s.length; i++) {
			uris.push('sfx/' + s[i]);
		}
		game.load.audio(x, uris);
	}
}

Level.prototype.preload = function() {
	loadCommonAssets();
	game.load.tilemap(
		this.gStartInfo.level,
		'levels/' + PATH_MAP.levels[this.gStartInfo.level],
		null,
		Phaser.Tilemap.TILED_JSON);
};

Level.prototype.create = function() {
	var i;

	game.renderer.renderSession.roundPixels = true;
	game.antialias = false;
	game.stage.smoothed = false;
	game.physics.startSystem(Phaser.Physics.ARCADE);

	var map = game.add.tilemap(this.gStartInfo.level);
	map.addTilesetImage('tiles', 'tiles');
	this.gTiles = map.createLayer('Main');
	this.gTiles.resizeWorld();
	var collide = [];
	for (i = 1; i <= 64; i++) {
		if (OUCH_TILES.indexOf(i) < 0) {
			collide.push(i);
		}
	}
	map.setCollision(collide, true, 'Main', true);

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

	var playerPos = new Phaser.Point(64, 64);
	var olayer = map.objects.Default;
	if (!olayer) {
		console.log('No "Default" object layer');
		return;
	}
	for (i = 0; i < olayer.length; i++) {
		var info = olayer[i];
		if (typeof info.gid == 'number') {
			this.gProps.spawn(info.gid - propGid, info);
			continue;
		}
		if (info.type in params.MONSTERS) {
			this.gMonsters.spawn(info);
			continue;
		}
		switch (info.type) {
		case 'Player':
			playerPos.set(info.x + info.width / 2, info.y + info.height / 2);
			break;
		default:
			console.error('Unknown object type: ' + info.type);
			break;
		}
	}
	if (!this.gProps.spawnPlayerFromDoor(this.gStartInfo.prevLevel)) {
		this.gPlayer.spawn(playerPos);
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

// Change the current level.
Level.prototype.changeLevel = function(target) {
	this.state.restart(true, false, {
		level: target
	});
};

module.exports.Level = Level;
