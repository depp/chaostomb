'use strict';
var params = require('./params');

function Shots(level) {
	this.level = level;
	this.group = level.add.group();
	this.group.enableBody = true;
	this.group.physicsBodyType = Phaser.Physics.ARCADE;
	this.objs = {};
	this.counter = 0;
}

function explosionPush(target, center, info) {
	info = info || {};
	var dx = target.x - center.x;
	var dy = target.y - center.y;
	var dd = Math.hypot(dx, dy);
	var radius = info.radius || 32;
	var maxpush = info.maxpush || 200;
	var minpush = info.minpush || 100;
	var a = radius - dd;
	if (a <= 0) {
		return null;
	}
	a = minpush + a * (maxpush - minpush) / radius;
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
	return {x: dx * a, y: dy * a};
}

Shots.prototype = {
	// type, position(x, y), direction(x, y)
	spawn: function(type, px, py, dx, dy) {
		var stats = params.SHOTS[type];
		if (!stats) {
			console.error('Unknown shot:', type);
			return;
		}
		var sprite, name;
		sprite = this.group.getFirstDead();
		if (sprite) {
			name = sprite.name;
			sprite.reset(px, py);
		} else {
			name = 'P' + this.counter;
			sprite = this.group.create(px, py, 'shots', 0);
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
	},

	update: function() {
		game.physics.arcade.overlap(
			this.group, this.level.gMonsters.group, this.monsterHit, null, this);
		this.group.forEachAlive(function(shot) {
			game.physics.arcade.overlap(
				shot, this.level.gTiles, this.tileHit, null, this);
		}, this);
	},

	// Callback when shot hits monster.
	monsterHit: function(shot, monster) {
		var cx = (monster.x + shot.x) / 2;
		var cy = (monster.y + shot.y) / 2;
		this.level.gFx.spawn('Boom', cx, cy);
		shot.kill();
		var push = explosionPush(monster, shot, {
			minpush: 500,
			maxpush: 700,
			kick: 16
		});
		if (push) {
			this.level.gMonsters.push(monster, push.x, push.y);
		}
	},

	// Callback when shot hits tile.
	tileHit: function(shot, tile) {
		this.level.gFx.spawn('Boom', shot.x, shot.y);
		shot.kill();
	},
};

module.exports = {
	Shots: Shots
};
