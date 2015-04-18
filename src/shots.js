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
		var name = 'P' + this.counter;
		var sprite = this.group.create(px, py, 'shots', 0);
		sprite.anchor.setTo(0.5, 0.5);
		sprite.name = name;
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
		this.objs[name] = {
			sprite: sprite,
		};
	},

	update: function() {
	}
};

module.exports = {
	Shots: Shots
};
