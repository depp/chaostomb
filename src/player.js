'use strict';
var params = require('./params');
var mover = require('./mover');
var loader = require('./loader');
var text = require('./text');
var weapons = require('./weapons');

function Player(level, obj) {
	this.group = game.add.group();
	this.level = level;
	this.sprite = null;
	this.mover = null;
	this.fireDown = true;
	this.weapons = [];
	this.weapon = -1;
	this.wtext = null;
	this.wsprite = null;
	this.hearts = [];
	this.health = 0;
}

Player.prototype.spawn = function(obj) {
	var sprite = this.group.create(
		obj.x + obj.width / 2, obj.y + obj.height / 2);
	loader.setAnimations(sprite, 'player');
	sprite.anchor.setTo(0.5, 0.5);
	game.physics.arcade.enable(sprite);
	sprite.body.gravity.y = params.GRAVITY;
	sprite.body.collideWorldBounds = true;
	sprite.body.maxVelocity.set(params.MAX_VELOCITY, params.MAX_VELOCITY);
	sprite.play('walk');
	this.sprite = sprite;
	this.mover = new mover.Walker(sprite, params.PLAYER_STATS);
	var w;
	for (w in weapons) {
		this.addWeapon(w);
	}
	this.setHearts(7);
	this.setHealth(11);
};

Player.prototype.update = function() {
	if (!this.sprite) {
		return;
	}
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
	this.mover.update(xdrive, ydrive);

	if (fire && !this.fireDown) {
		var sprite = this.sprite;
		this.level.gShots.spawn(
			true, 'Bolt',
			sprite.x, sprite.y,
			this.mover.direction, 0);
	}
	this.fireDown = fire;
};

// Add a weapon to the player's inventory.
// Returns true if succesful, false otherwise.
Player.prototype.addWeapon = function(weapon) {
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
		if (!this.wtext) {
			this.wtext = text.create();
			this.wtext.text = info.name;
			this.wsprite = new Phaser.Image(game, 4, 4, this.wtext);
			this.level.gUi.add(this.wsprite);
		}
	} else {
		info.setIcon(sprite, false);
	}
	this.weapons.push({
		name: weapon,
		sprite: sprite
	});
};

Player.prototype.setHearts = function(count) {
	var i;
	var size = 48, margin = 4;
	if (count === this.hearts.length) {
		return;
	}
	for (i = this.hearts.length; i < count; i++) {
		var sprite = this.level.gUi.create(
			params.WIDTH - (size / 2 + margin + (margin + size) * i),
			size / 2 + margin,
			'hearts', 0);
		sprite.anchor.setTo(0.5, 0.5);
		this.hearts.push(sprite);
	}
	this.setHealth(this.health);
};

// Set the player's current health.
Player.prototype.setHealth = function(amt) {
	var i;
	var newHealth = Math.max(0, Math.min(this.hearts.length * 2, amt));
	for (i = 0; i < this.hearts.length; i++) {
		var heart = this.hearts[i];
		heart.frame = newHealth <= i * 2 ? 2 : (newHealth <= i * 2 + 1 ? 1 : 0);
	}
	this.health = newHealth;
};

// Get the current player position, for monster targeting purposes.
Player.prototype.getPosition = function(count) {
	return this.sprite.position;
};

module.exports = {
	Player: Player
};
