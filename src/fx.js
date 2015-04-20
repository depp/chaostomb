'use strict';
var params = require('./params');

function Fx(level) {
	this.level = level;
	this.group = level.add.group();
	this.sparks = game.add.emitter();
	this.sparks.makeParticles('particles', 0);
	this.sparks.gravity = 1000;
	this.sparks.setYSpeed(-100, -300);
}

Fx.prototype.spawn = function(type, px, py) {
	var sprite;
	sprite = this.group.getFirstDead();
	if (sprite) {
		sprite.reset(px, py);
	} else {
		sprite = this.group.create(px, py, 'fx', 0);
		sprite.anchor.setTo(0.5, 0.5);
	}
	sprite.animations.add('run', [0, 1, 2, 3], 15, false, true);
	sprite.play('run', 15, false, true);
	game.sound.play('explosion_1');
};

Fx.prototype.update = function() {};

Fx.prototype.emitSparks = function(x, y) {
	console.log("EMIT");
	this.sparks.x = x;
	this.sparks.y = y;
	this.sparks.start(true, 500, null, 10);
};

module.exports = {
	Fx: Fx
};
