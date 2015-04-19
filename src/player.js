'use strict';
var params = require('./params');
var mover = require('./mover');
var loader = require('./loader');
var weapons = require('./weapons');

////////////////////////////////////////////////////////////////////////
// Behavior

function Behavior(obj) {
	this.obj = obj;
	this.stuntime = 0;
}
Behavior.prototype.update = function() {
	var level = this.obj.player.level;
	var input = level.gInput;
	var xdrive = 0, ydrive = 0, fire = false;
	if (input.left !== 0) {
		xdrive += -1;
	}
	if (input.right !== 0) {
		xdrive += +1;
	}
	if (input.up !== 0) {
		ydrive += -1;
	}
	if (input.down !== 0) {
		ydrive += +1;
	}
	if (input.fire === 1) {
		fire = true;
	}
	if (fire) {
		var pos = this.sprite.position;
		level.gShots.spawn(
			true, 'Bolt',
			pos.x, pos.y,
			this.obj.mover.direction, 0);
	}
	if (this.stuntime > 0) {
		this.stuntime -= game.time.physicsElapsed;
	}
	this.obj.mover.update(xdrive, ydrive, this.stuntime > 0);
};
Behavior.prototype.stun = function() {
	this.stuntime = params.PLAYER_STUN_TIME;
};
Behavior.prototype.damage = function(amt) {
	if (typeof amt == 'undefined') {
		amt = 1;
	}
	var player = this.obj.player;
	player.setHealth(player.health - amt);
	if (player.health <= 0) {
		this.kill();
	}
};
Behavior.prototype.push = function(push) {
	var vel = this.obj.sprite.body.velocity;
	Phaser.Point.add(vel, push, vel);
};
Behavior.prototype.kill = function() {
	this.obj.behavior = new Die(this.obj);
};

////////////////////////////////////////////////////////////////////////
// Dead (note: no inheritance)

function Dead(obj) {
	obj.sprite.body.gravity.y = params.GRAVITY;
	this.obj = obj;
}
Dead.prototype.update = function() {
	this.obj.mover.update(0, 0, false);
};
Dead.prototype.stun = function() {};
Dead.prototype.damage = function(amt) {};
Dead.prototype.push = function(push) {};
Dead.prototype.kill = function() {};

////////////////////////////////////////////////////////////////////////
// Die

function Die(obj) {
	obj.sprite.body.gravity.y = params.GRAVITY;
	this.obj = obj;
	this.time = params.PLAYER_DEATH_TIME;
}
Die.prototype = Object.create(Dead.prototype);
Die.prototype.update = function() {
	this.obj.mover.update(0, 0, true);
	this.time -= game.time.physicsElapsed;
	if (this.time <= 0) {
		this.obj.sprite.body.enable = false;
		this.obj.mover = new mover.Corpse(this.obj.sprite);
		this.obj.behavior = new Dead(this.obj);
	}
};
Die.prototype.push = function(push) {
	var vel = this.obj.sprite.body.velocity;
	if (this.obj.health <= 0) {
		var d = vel.dot(push);
		if (d <= 0) {
			vel.setTo(push.x * 2, push.y * 2);
			return;
		}
	}
	vel.add(push.x * 2, push.y * 2);
};

////////////////////////////////////////////////////////////////////////
// Player

function Player(level, obj) {
	this.group = game.add.group();
	this.level = level;
	this.weapons = [];
	this.weapon = -1;
	this.hearts = [];
	this.health = 11;
	this.objs = {};
}

Player.prototype.spawn = function(info) {
	if ('Player' in this.objs) {
		console.error('Too many players');
		return;
	}
	var sprite = this.group.create(
		info.x + info.width / 2, info.y + info.height / 2);
	sprite.name = 'Player';
	loader.setAnimations(sprite, 'player');
	sprite.anchor.setTo(0.5, 0.5);
	game.physics.arcade.enable(sprite);
	sprite.body.gravity.y = params.GRAVITY;
	sprite.body.collideWorldBounds = true;
	sprite.body.maxVelocity.set(params.MAX_VELOCITY, params.MAX_VELOCITY);
	sprite.play('walk');
	var obj = {
		player: this,
		sprite: sprite,
		behavior: null,
		mover: new mover.Walker(sprite, params.PLAYER_STATS),
	};
	obj.behavior = new Behavior(obj);
	this.objs.Player = obj;

	var w;
	for (w in weapons) {
		this.addWeapon(w);
	}
	this.setHearts(7);
	this.setHealth(11);
};

Player.prototype.update = function() {
	game.physics.arcade.collide(this.group, this.level.gTiles);
	var name;
	for (name in this.objs) {
		this.objs[name].behavior.update();
	}
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
	} else {
		info.setIcon(sprite, false);
	}
	this.weapons.push({
		name: weapon,
		sprite: sprite
	});
};

// Set the number of hearts (equal to half health capacity).
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
	var obj = this.objs.Player;
	if (!obj) {
		return null;
	}
	return obj.sprite.position;
};

// Call a function on a player object.
Player.prototype.invoke = function(sprite, func, context) {
	var name = sprite.name;
	var obj = this.objs[name];
	if (!obj) {
		console.error('Not a player object:', sprite);
		return;
	}
	func.call(context, obj.behavior);
};

////////////////////////////////////////////////////////////////////////
// Exports

module.exports = {
	Player: Player
};
