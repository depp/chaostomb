'use strict';
var params = require('./params');

function Fx(level) {
	this.level = level;
	this.group = level.add.group();
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

module.exports = {
	Fx: Fx
};
