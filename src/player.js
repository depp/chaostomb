'use strict';
var params = require('./params');
var walker = require('./walker');

function Player(level, obj) {
	this.level = level;
	var sprite = game.add.sprite(
		obj.x + obj.width / 2, obj.y + obj.height / 2, 'player');
	sprite.anchor.setTo(0.5, 0.5);
	game.physics.arcade.enable(sprite);
	sprite.body.gravity.y = params.GRAVITY;
	sprite.body.collideWorldBounds = true;
	sprite.body.maxVelocity.set(params.MAX_VELOCITY, params.MAX_VELOCITY);
	this.sprite = sprite;
	this.walker = new walker.Walker(sprite, params.PLAYER_STATS);
	this.fireDown = true;
}

Player.prototype = {
	update: function() {
		var input = this.level.gInput;
		var xdrive = 0, ydrive = 0, fire = false;
		if (input.left.isDown) {
			xdrive += -1;
		}
		if (input.right.isDown) {
			xdrive += +1;
		}
		if (input.up.isDown) {
			ydrive += -1;
		}
		if (input.down.isDown) {
			ydrive += +1;
		}
		if (input.fire.isDown) {
			fire = true;
		}

		game.physics.arcade.collide(this.sprite, this.level.gTiles);
		this.walker.update(xdrive, ydrive);

		if (fire && !this.fireDown) {
			var sprite = this.sprite;
			this.level.gShots.spawn(
				'Bolt',
				sprite.x, sprite.y, 1, 0);
		}
		this.fireDown = fire;
	},
};

module.exports = {
	Player: Player
};
