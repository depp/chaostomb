'use strict';
var params = require('./params');
var walker = require('./walker');
var loader = require('./loader');
var weapons = require('./weapons');

function Player(level, obj) {
	this.level = level;
	var sprite = game.add.sprite(64, 64);
	loader.setAnimations(sprite, 'player');
	sprite.anchor.setTo(0.5, 0.5);
	game.physics.arcade.enable(sprite);
	sprite.body.gravity.y = params.GRAVITY;
	sprite.body.collideWorldBounds = true;
	sprite.body.maxVelocity.set(params.MAX_VELOCITY, params.MAX_VELOCITY);
	sprite.play('walk');
	this.sprite = sprite;
	this.walker = new walker.Walker(sprite, params.PLAYER_STATS);
	this.fireDown = true;
	this.weapons = [];
	this.weapon = -1;
	this.hearts = [];
}

Player.prototype = {
	spawn: function(obj) {
		this.sprite.reset(obj.x + obj.width / 2, obj.y + obj.height / 2);
		var w;
		for (w in weapons) {
			this.addWeapon(w);
		}
		this.setHearts(7);
	},

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
				sprite.x, sprite.y, this.walker.direction, 0);
		}
		this.fireDown = fire;
	},

	// Add a weapon to the player's inventory.
	// Returns true if succesful, false otherwise.
	addWeapon: function(weapon) {
		var i;
		for (i = 0; i < this.weapons.length; i++) {
			if (this.weapons[i].name === weapon) {
				return false;
			}
		}
		var info = weapons[weapon];
		if (!info) {
			console.error('Unknown weapon:', weapon);
			return false;
		}
		var idx = this.weapons.length;
		var rowlength = 7;
		var x, y;
		x = idx % rowlength;
		y = Math.floor(idx / rowlength);
		var size = 48, margin = 4;
		var sprite = this.level.gUi.create(
			size / 2 + margin + (margin + size) * x,
			size / 2 + margin + (margin + size) * y,
			'icons', 0);
		sprite.anchor.setTo(0.5, 0.5);
		if (this.weapons.length === 0) {
			info.setIcon(sprite, true);
			this.weapon = 0;
		} else {
			info.setIcon(sprite, false);
		}
		this.weapons.push({
			name: weapon,
			sprite: sprite
		});
	},

	setHearts: function(count) {
		var i;
		var size = 48, margin = 4;
		for (i = this.hearts.length; i < count; i++) {
			var sprite = this.level.gUi.create(
				params.WIDTH - (size / 2 + margin + (margin + size) * i),
				size / 2 + margin,
				'hearts', 0);
			sprite.anchor.setTo(0.5, 0.5);
			this.hearts.push(sprite);
		}
	},
};

module.exports = {
	Player: Player
};
