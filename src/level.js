'use strict';
var fx = require('./fx');
var input = require('./input');
var monster = require('./monster');
var params = require('./params');
var props = require('./props');
var player = require('./player');
var shots = require('./shots');
var music = require('./music');
var persist = require('./persist');

// All other tiles in 1-64 are solid, but these kill you.
var OUCH_TILES = [
	// Water
	41, 49, 57,
	// Lava
	23, 24, 31, 32,
];

function Level() {
	this.gLevelName = null;
	this.gState = null;
	this.gStartInfo = null;
	this.gInput = null;
	this.gPlayer = null;
	this.gTiles = null;
	this.gProps = null;
	this.gMonsters = null;
	this.gShots = null;
	this.gFx = null;
	this.gUi = null;
	this.gOuch = null;
	this.gPaused = false;
}

Level.prototype.init = function(startInfo) {
	this.gLevelName = startInfo.level;
	this.gState = startInfo.state || new persist.GameState();
	this.gInput = input.getKeys();
	this.gStartInfo = startInfo;
	this.gPaused = false;
};

Level.prototype.create = function() {
	var i;
	game.physics.startSystem(Phaser.Physics.ARCADE);

	var map = game.add.tilemap(this.gLevelName);
	music.play(map.properties.Music);
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
	this.gUi.fixedToCamera = true;
	this.gOuch = game.add.group();
	this.gOuch.enableBody = true;
	this.gOuch.physicsBodyType = Phaser.Physics.ARCADE;

	var playerPos = new Phaser.Point(64, 64);
	var olayer = map.objects.Default;
	if (!olayer) {
		console.error('No "Default" object layer');
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
		case 'Ouch':
			var ouch = this.gOuch.create(info.x, info.y);
			ouch.body.setSize(info.width, info.height);
			break;
		case 'Player':
			playerPos.set(info.x + info.width / 2, info.y + info.height / 2);
			break;
		default:
			console.error('Unknown object type: ' + info.type);
			break;
		}
	}
	switch (this.gStartInfo.source) {
	case 'door':
		this.gProps.spawnPlayerFromDoor(this.gStartInfo.sourceId);
		break;
	case 'save':
		this.gProps.spawnPlayerFromSavePoint(this.gStartInfo.sourceId);
		break;
	}
	this.gPlayer.spawn(playerPos);
};

/*
Level.prototype.render = function() {
	this.gPlayer.group.forEachAlive(game.debug.body, game.debug);
	this.gOuch.forEachAlive(game.debug.body, game.debug);
};
*/

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
		state: this.gState,
		level: target,
		source: 'door',
		sourceId: this.gStartInfo.level,
	});
};

module.exports.Level = Level;
