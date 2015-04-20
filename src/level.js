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
var menu = require('./menu');
var text = require('./text');

// All other tiles are solid.
var NONSOLID_TILES = (function() {
	var t = [
		// Water
		40, 48, 56,
		// Lava
		22, 23, 30, 31,
	];
	var i;
	var obj = {};
	for (i = 0; i < t.length; i++) {
		obj[t[i]] = true;
	}
	return obj;
})();

function Range(start, end) {
	this.start = start;
	this.end = end;
}

Range.prototype.contains = function(idx) {
	return idx >= this.start && idx < this.end;
};

function Level() {
	this.gLevelName = null;
	this.gState = null;
	this.gStartInfo = null;
	this.gInput = null;
	this.gPlayer = null;
	this.gTileMap = null;
	this.gTiles = null;
	this.gProps = null;
	this.gMonsters = null;
	this.gShots = null;
	this.gFx = null;
	this.gUi = null;
	this.gOuch = null;
	this.gPaused = false;
	this.gMenu = null;
}

Level.prototype.init = function(startInfo) {
	this.gLevelName = startInfo.level;
	this.gState = startInfo.state || new persist.GameState();
	this.gInput = input.getKeys();
	this.gStartInfo = startInfo;
	this.gPaused = false;
	this.gMenu = null;
	this.gAlertText = null;
	this.gAlertGroup = null;
	this.gAlertTween = null;
};

Level.prototype.getGidRange = function(name) {
	var idx = this.gTileMap.getTilesetIndex(name);
	if (idx === null) {
		// console.warn('No such tileset:', name);
		return new Range(0, 0);
	}
	var tileset = this.gTileMap.tilesets[idx];
	return new Range(
		tileset.firstgid,
		tileset.firstgid + tileset.rows * tileset.columns);
};

Level.prototype.create = function() {
	var i;
	game.physics.startSystem(Phaser.Physics.ARCADE);

	var map = game.add.tilemap(this.gLevelName);
	this.gTileMap = map;
	music.play(map.properties.Music);
	map.addTilesetImage('tiles', 'tiles');
	this.gTiles = map.createLayer('Main');
	this.gTiles.resizeWorld();
	this.gTileRange = this.getGidRange('tiles');
	var collide = [];
	for (i = this.gTileRange.start; i < this.gTileRange.end; i++) {
		if (!NONSOLID_TILES[i - this.gTileRange.start]) {
			collide.push(i);
		}
	}
	map.setCollision(collide, true, 'Main', true);

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

	var propRange = this.getGidRange('props');
	var monsterRange = this.getGidRange('monsters');
	var playerPos = new Phaser.Point(64, 64);
	var olayer = map.objects.Default;
	if (!olayer) {
		console.error('No "Default" object layer');
		return;
	}
	for (i = 0; i < olayer.length; i++) {
		var info = olayer[i];
		if (typeof info.gid == 'number') {
			if (propRange.contains(info.gid)) {
				this.gProps.spawn(info.gid - propRange.start, info);
			} else if (monsterRange.contains(info.gid)) {
				this.gMonsters.spawn(info.gid - monsterRange.start, info);
			} else {
				console.warn('Orphaned GID:', info.gid);
			}
			continue;
		}
		switch (info.type) {
		case 'Lava':
		case 'Water':
			var ouch = this.gOuch.create(info.x, info.y);
			ouch.body.setSize(info.width, info.height);
			ouch.name = info.type;
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

// Test if a tile exists at the given location.
Level.prototype.testTile = function(x, y) {
	var tile = this.gTileMap.getTileWorldXY(x, y);
	return !!tile;
};

// Test if a tile exists in the given rectangle.
Level.prototype.testTileRect = function(r) {
	var map = this.gTileMap;
	var tw = map.tileWidth, th = map.tileHeight;
	var x0 = Math.floor(r.x / tw), x1 = Math.ceil((r.x + r.width) / tw);
	var y0 = Math.floor(r.y / th), y1 = Math.ceil((r.y + r.height) / th);
	var x, y, t;
	for (y = y0; y <= y1; y++) {
		for (x = x0; x <= x1; x++) {
			t = map.getTile(x, y);
			if (t) {
				return true;
			}
		}
	}
	return false;
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
	if (this.gMenu) {
		this.gMenu.update();
	}
	if (!this.gPaused) {
		this.gProps.update();
		this.gPlayer.update();
		this.gMonsters.update();
		this.gShots.update();
		this.gFx.update();
	}
};

// Lose the game.
Level.prototype.lose = function(message) {
	if (this.gMenu) {
		return;
	}
	if (!message) {
		message = 'You died.';
	}
	this.gMenu = new menu.Menu([
		menu.itemSavedGame(),
		menu.itemExit(),
	], message);
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

// Present an alert.
Level.prototype.alert = function(message, noPause) {
	var tweenTime = 0.2, hangTime = 0.3;
	if (!this.gAlertText) {
		this.gAlertText = text.create();
		this.gAlertGroup = game.add.group();
		this.gUi.add(this.gAlertGroup);
		var back = this.gAlertGroup.create(0, 0, 'menu', 1);
		back.anchor.set(0.5, 0.5);
		var img = new Phaser.Image(game, 0, 2, this.gAlertText);
		this.gAlertGroup.add(img);
		this.gAlertGroup.x = params.WIDTH / 2;
		img.anchor.set(0.5, 0.5);
		this.gAlertTween = this.add.tween(this.gAlertGroup);
		this.gAlertTween.to(
			{y: params.HEIGHT * 3 / 4}, tweenTime * 1000,
			Phaser.Easing.Sinusoidal.Out,
			false, 0, 0, false);
	}
	if (!noPause) {
		this.setPaused(true);
	}
	this.gAlertText.text = message;
	this.gAlertGroup.y = params.HEIGHT + 32;
	this.gAlertGroup.visible = true;
	this.gAlertTween.start();
	var timer = game.time.create(true);
	timer.add((tweenTime + hangTime) * 1000, function() {
		this.gAlertGroup.visible = false;
		if (!noPause) {
			this.setPaused(false);
		}
	}, this);
	timer.start();
};

Level.prototype.findEmptySpace = function(width, height) {
	var view = game.camera.view;
	var range = new Phaser.Rectangle(
		view.x + width / 2,
		view.y + height / 2,
		view.width - width,
		view.height - height);
	var hitRect = new Phaser.Rectangle(0, 0, width, height);
	var i, x, y, margin = 32;
	for (i = 0; i < 15; i++) {
		x = range.x + Math.floor(Math.random() * range.width);
		y = range.y + Math.floor(Math.random() * range.height);
		hitRect.x = x - width / 2;
		hitRect.y = y - height / 2;
		if (!this.testTileRect(hitRect)) {
			return new Phaser.Point(x, y);
		}
	}
	return null;
};

module.exports.Level = Level;
