'use strict';

var BOB_MAGNITUDE = 16;
var BOB_TIME = 1.0;
var LEVEL_EXIT_TIME = 0.5;
var LEVEL_ENTER_TIME = 0.5;


////////////////////////////////////////////////////////////////////////
// Door

function Door(level, sprite, info) {
	this.level = level;
	this.sprite = sprite;
	this.target = info.Target;
	if (!this.target) {
		console.error('Door has no target');
	} else {
		level.gProps.doors[this.target] = this;
	}
}
Door.prototype.markerOffset = 64;
Door.prototype.interact = function() {
	var target = this.target;
	if (!this.target) {
		game.sound.play('buzz');
		console.error('Door has no target');
		return;
	}
	var level = this.level;
	this.sprite.frame = 1;
	level.setPaused(true);
	level.gProps.setTarget(null);
	game.sound.play('door');
	var timer = game.time.create(true);
	timer.add(
		LEVEL_EXIT_TIME * 1000, function() {
			level.changeLevel(target);
		});
	timer.start();
};
Door.prototype.spawnPlayer = function() {
	this.level.gPlayer.spawn(this.sprite.position);
	this.level.setPaused(true);
	this.sprite.frame = 1;
	var timer = game.time.create(true);
	timer.add(
		LEVEL_ENTER_TIME * 1000, function() {
			this.sprite.frame = 0;
			this.level.setPaused(false);
		}, this);
	timer.start();
};

////////////////////////////////////////////////////////////////////////
// Chest

function Chest(level, sprite, info) {
	this.level = level;
	this.sprite = sprite;
	this.ident = info.Id;
	if (typeof this.ident == 'undefined') {
		console.error('Chest has no Id');
	} else {
		if (this.ident in level.gProps.chests) {
			console.error('Duplicate chest:', this.ident);
		} else {
			level.gProps.chests[this.ident] = this;
		}
		var chests = level.gState.chests[level.gLevelName];
		if (chests && (this.ident in chests)) {
			sprite.frame = 3;
			sprite.name = null;
		}
	}
}
Chest.prototype.markerOffset = 48;
Chest.prototype.interact = function() {
	this.sprite.name = null;
	var chests = this.level.gState.chests[this.level.gLevelName];
	if (!chests) {
		chests = {};
		this.level.gState.chests[this.level.gLevelName] = chests;
	}
	chests[this.ident] = 0;

	var level = this.level;
	this.sprite.frame = 3;
	level.setPaused(true);
	level.gProps.setTarget(null);
	var tsprite, tframe;
	if (true) {
		tsprite = 'hearts';
		tframe = 0;
	}
	var treasure = level.add.sprite(
		this.sprite.x,
		this.sprite.y - 24,
		tsprite,
		tframe);
	treasure.anchor.setTo(0.5, 0.5);
	var tpre = 0.25, tmove = 1.0;
	var tween = level.add.tween(treasure);
	tween.to(
		{y: this.sprite.y - 96}, tmove * 1000,
		Phaser.Easing.Sinusoidal.InOut,
		true, tpre * 1000, 0, false);
	game.sound.play('fanfare');
	tween.onComplete.addOnce(function() {
		level.setPaused(false);
		treasure.destroy();
	});
};

////////////////////////////////////////////////////////////////////////
// Save point

function SavePoint(level, sprite, info) {
	this.level = level;
	this.sprite = sprite;
	this.ident = info.Id;
	if (typeof this.ident == 'undefined') {
		console.error('Save point has no Id');
	} else if (this.ident in level.gProps.savePoints) {
		console.error('Duplicate save point:', this.ident);
	} else {
		level.gProps.savePoints[this.ident] = this;
	}
}
SavePoint.prototype.markerOffset = 48;
SavePoint.prototype.dead = false;
SavePoint.prototype.interact = function() {
	this.level.gPlayer.healFull();
	this.level.gState.save(this.level.gLevelName, this.ident);
};
SavePoint.prototype.spawnPlayer = function() {
	this.level.gPlayer.spawn(this.sprite.position);
};

////////////////////////////////////////////////////////////////////////
// Prop factories

var PROP_TYPES = {
	0: Door,
	2: Chest,
	4: SavePoint,
};

////////////////////////////////////////////////////////////////////////
// Prop manager

function Props(level) {
	this.level = level;
	this.group = level.add.group();
	this.objs = {};
	this.counter = 0;
	this.markerSprite = null;
	this.markerTarget = null;
	this.markerTween = null;
	this.doors = {};
	this.chests = {};
	this.savePoints = {};
}

// Spawn a prop from the map.
Props.prototype.spawn = function(index, info) {
	var Constructor = PROP_TYPES[index];
	var sprite = this.group.create(
		info.x + 32, info.y - 32,
		'props', index);
	sprite.anchor.set(0.5, 0.5);
	if (Constructor) {
		var name = 'Prop ' + this.counter;
		this.counter++;
		sprite.name = name;
		var obj = new Constructor(this.level, sprite, info.properties || {});
		game.physics.arcade.enable(sprite);
		this.objs[name] = obj;
	}
};

// Update all props.
Props.prototype.update = function(index, info) {
	var player = this.level.gPlayer.getInteractSprite();
	if (!player) {
		this.setTarget(null);
		return;
	}
	var best_dist = 32, best_sprite = null;
	this.group.forEachAlive(function(sprite) {
		if (!sprite.name) {
			return;
		}
		var u = player.position, v = sprite.position;
		var dist = Math.max(
			Math.abs(u.x - v.x),
			Math.abs(u.y - v.y));
		if (dist < best_dist) {
			best_dist = dist;
			best_sprite = sprite;
		}
	});
	this.setTarget(best_sprite);
};

// Set the interaction target.
Props.prototype.setTarget = function(sprite) {
	if (!sprite) {
		if (this.markerTarget) {
			this.markerSprite.kill();
			this.markerTarget = null;
			this.markerTween.stop();
			this.markerTween = null;
		}
		return;
	}
	var obj = this.objs[sprite.name];
	if (!obj) {
		console.error('Invalid interaction target:', sprite);
		return;
	}
	if (this.markerTarget === obj) {
		return;
	}
	this.markerTarget = obj;
	var tx = sprite.x;
	var ty0 = sprite.y - BOB_MAGNITUDE -obj.markerOffset;
	var ty1 = ty0 + BOB_MAGNITUDE * 2;
	if (!this.markerSprite) {
		this.markerSprite = this.group.create(tx, ty0, 'props', 6);
		this.markerSprite.anchor.setTo(0.5, 0.5);
	} else {
		this.markerSprite.reset(tx, ty0);
	}
	if (this.markerTween) {
		this.markerTween.stop();
		this.markerTween = null;
	}
	this.markerTween = game.add.tween(this.markerSprite);
	this.markerTween.to(
		{x: tx, y: ty1}, BOB_TIME * 500, Phaser.Easing.Sinusoidal.InOut,
		true, 0, -1, true);
};

// Try to interact with something, as the player.
Props.prototype.interact = function() {
	if (!this.markerTarget) {
		game.sound.play('buzz');
	} else {
		this.markerTarget.interact(this.level);
	}
};

// Spawn player from a door.
Props.prototype.spawnPlayerFromDoor = function(ident) {
	var obj = this.doors[ident];
	if (!obj) {
		console.error('Missing door:', ident);
	} else {
		obj.spawnPlayer();
	}
};

// Spawn player from a spawn point.
Props.prototype.spawnPlayerFromSpawnPoint = function(ident) {
	var obj = this.spawnPoints[ident];
	if (!obj) {
		console.error('Missing spawn point:', ident);
	} else {
		obj.spawnPlayer();
	}
};

////////////////////////////////////////////////////////////////////////
// Exports

module.exports = {
	Props: Props,
};
