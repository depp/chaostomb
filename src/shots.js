'use strict';
var params = require('./params');

////////////////////////////////////////////////////////////////////////
// Shot manager

function Shots(level) {
	this.level = level;
	// Monster shots always in front so player can dodge better.
	this.pgroup = level.add.group();
	this.pgroup.enableBody = true;
	this.pgroup.physicsBodyType = Phaser.Physics.ARCADE;
	this.mgroup = level.add.group();
	this.mgroup.enableBody = true;
	this.mgroup.physicsBodyType = Phaser.Physics.ARCADE;
	this.groups = [this.pgroup, this.mgroup];
	this.objs = {};
	this.counter = 0;
}

function explosionPush(target, center, info, fixed) {
	info = info || {};
	var dx = target.x - center.x;
	var dy = target.y - center.y;
	var a;
	var dd = Math.hypot(dx, dy);
	if (info.push) {
		a = info.push;
	} else {
		var maxpush = info.maxpush || 200;
		var minpush = info.minpush || 100;
		var radius = info.radius || 32;
		a = radius - dd;
		if (a <= 0) {
			return null;
		}
		a = minpush + a * (maxpush - minpush) / radius;
	}
	if (info.kick) {
		dy -= info.kick;
		dd = Math.hypot(dx, dy);
	}
	if (dd < 1) {
		dx = 0;
		dy = 1;
	} else {
		a /= dd;
	}
	return new Phaser.Point(dx * a, dy * a);
}

// type, position(x, y), direction(x, y)
Shots.prototype.spawn = function(isPlayer, type, px, py, dx, dy) {
	var group = isPlayer ? this.pgroup : this.mgroup;
	var stats = params.SHOTS[type];
	if (!stats) {
		console.error('Unknown shot:', type);
		return;
	}
	var sprite, name;
	sprite = group.getFirstDead();
	if (sprite) {
		name = sprite.name;
		sprite.reset(px, py);
		sprite.frame = stats.frame;
	} else {
		name = (isPlayer ? 'P' : 'M') + group.length;
		sprite = group.create(px, py, 'shots', stats.frame);
		sprite.name = name;
		sprite.anchor.setTo(0.5, 0.5);
		sprite.checkWorldBounds = true;
		sprite.outOfBoundsKill = true;
	}
	var dmag = Math.hypot(dx, dy);
	var dfac;
	if (Math.abs(dmag) < 0.1) {
		dx = 1;
		dy = 0;
		dfac = 1;
	} else {
		dfac = 1 / dmag;
	}
	dfac *= stats.speed;
	sprite.body.velocity.set(dx * dfac, dy * dfac);
	sprite.body.setSize(stats.size, stats.size);
	this.objs[name] = {
		sprite: sprite,
	};
};

Shots.prototype.update = function() {
	var i, group;
	game.physics.arcade.overlap(
		this.level.gMonsters.group, this.pgroup, this.monsterHit, null, this);
	game.physics.arcade.overlap(
		this.level.gPlayer.sprite, this.mgroup, this.playerHit, null, this);
	for (i = 0; i < this.groups.length; i++) {
		group = this.groups[i];
		group.forEachAlive(this.tileTest, this);
	}
};

// Callback when shot hits monster or player.
Shots.prototype.actorHit = function(target, shot, isPlayer) {
	var cx = (target.x + shot.x) / 2;
	var cy = (target.y + shot.y) / 2;
	this.level.gFx.spawn('Boom', cx, cy);
	var push = explosionPush(target, shot, {
		push: 300,
		kick: 16
	});
	if (isPlayer) {
		console.log("PLAYER HIT");
	} else {
		this.level.gMonsters.invoke(target, function(obj) {
			obj.damage(1);
			if (push) {
				obj.push(push);
			}
		});
	}
	shot.kill();
};

// Callback when shot hits player.
Shots.prototype.playerHit = function(player, shot) {
	this.actorHit(player, shot, true);
};

// Callback when shot hits monster.
Shots.prototype.monsterHit = function(monster, shot) {
	this.actorHit(monster, shot, false);
};

// Test hit against tiles.
Shots.prototype.tileTest = function(shot, tile) {
	game.physics.arcade.overlap(
		shot, this.level.gTiles, this.tileHit, null, this);
};

// Callback when shot hits tile.
Shots.prototype.tileHit = function(shot, tile) {
	this.level.gFx.spawn('Boom', shot.x, shot.y);
	shot.kill();
};

////////////////////////////////////////////////////////////////////////
// Exports

module.exports = {
	Shots: Shots
};
