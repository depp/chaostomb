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
			sprite.x = px;
			sprite.y = py;
			sprite.revive();
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
			this.level.gMonsters.group, this.group, this.monsterHit, null, this);
	},

	// Callback when monster is hit by shot.
	monsterHit: function(monster, shot) {
		var cx = (monster.x + shot.x) / 2;
		var cy = (monster.y + shot.y) / 2;
		this.level.gFx.spawn('Boom', cx, cy);
		shot.kill();
	}
};

module.exports = {
	Shots: Shots
};
