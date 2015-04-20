'use strict';
var params = require('./params');
var mover = require('./mover');
var assets = require('./assets');
var weapons = require('./weapons');

////////////////////////////////////////////////////////////////////////
// Behavior

function Behavior(obj) {
	this.obj = obj;
	this.stuntime = 0;
}
Behavior.prototype.canInteract = true;
Behavior.prototype.update = function() {
	var level = this.obj.level;
	var player = level.gPlayer;
	var input = level.gInput;
	var xdrive = 0, ydrive = 0, interact = false;
	if (input.left !== 0) {
		xdrive += -1;
	}
	if (input.right !== 0) {
		xdrive += +1;
	}
	if (input.up !== 0) {
		ydrive += -1;
	}
	if (input.wprev === 1) {
		player.setWeapon(player.weapon - 1);
	}
	if (input.wnext === 1) {
		player.setWeapon(player.weapon + 1);
	}
	if (this.stuntime > 0) {
		this.stuntime -= game.time.physicsElapsed;
		// Hackish... wait until not stunned to process buttons.
		if (input.fire === 1) {
			input.fire = 0;
		}
		if (input.down === 1) {
			input.down = 0;
		}
	} else {
		if (input.fire !== 0) {
			var winfo = player.getWeaponInfo();
			if (winfo && winfo.fire) {
				if (input.fire === 1) {
					if (player.cooldown > 0) {
						game.sound.play('click');
					} else {
						player.cooldown = winfo.cooldown;
						winfo.fire(level);
					}
				}
			} else {
				if (input.fire === 1) {
					game.sound.play('click');
				}
			}
		}
		if (input.down === 1) {
			level.gProps.interact();
		}
		player.cooldown -= game.time.physicsElapsed;
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
		this.kill('damage');
	}
};
Behavior.prototype.push = function(push) {
	var vel = this.obj.sprite.body.velocity;
	Phaser.Point.add(vel, push, vel);
};
Behavior.prototype.kill = function(reason) {
	var i;
	var w = this.obj.player.weapons;
	for (i = 0; i < w.length; i++) {
		w[i].sprite.kill();
	}
	switch (reason) {
	case 'Water':
		this.obj.behavior = new Drown(this.obj);
		break;
	default:
		this.obj.behavior = new Die(this.obj);
		break;
	}
};

////////////////////////////////////////////////////////////////////////
// Dead (note: no inheritance)

function Dead(obj) {
	obj.mover = new mover.Corpse(obj.sprite);
	obj.sprite.body.gravity.y = params.GRAVITY;
	this.obj = obj;
}
Dead.prototype.canInteract = false;
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
		this.obj.level.lose('You died.');
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
// Drown

function Drown(obj) {
	obj.sprite.body.gravity.y = params.GRAVITY;
	this.obj = obj;
}
Drown.prototype = Object.create(Dead.prototype);
Drown.prototype.update = function() {
	this.obj.mover.update(0, 0, true);
	var body = this.obj.sprite.body;
	if (body.blocked.down) {
		body.collideWorldBounds = false;
		body.velocity.set(0, -params.DROWN_JUMP_SPEED);
		this.obj.level.lose('You drowned.');
		this.obj.behavior = new Dead(this.obj);
	}
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
	this.cooldown = 0;
}

Player.prototype.spawn = function(pos) {
	if ('Player' in this.objs) {
		return;
	}
	var sprite = this.group.create(pos.x, pos.y);
	this.level.camera.follow(sprite, Phaser.Camera.FOLLOW_PLATFORMER);
	sprite.name = 'Player';
	assets.setAnimations(sprite, 'player');
	sprite.anchor.setTo(0.5, 0.5);
	game.physics.arcade.enable(sprite);
	sprite.body.gravity.y = params.GRAVITY;
	sprite.body.collideWorldBounds = true;
	sprite.body.maxVelocity.set(params.MAX_VELOCITY, params.MAX_VELOCITY);
	sprite.play('walk');
	var obj = {
		level: this.level,
		player: this,
		sprite: sprite,
		behavior: null,
		mover: new mover.Walker(sprite, params.PLAYER_STATS),
	};
	obj.behavior = new Behavior(obj);
	this.objs.Player = obj;

	var st = this.level.gState, i;
	if (st.weapons.length !== 0) {
		for (i = 0; i < st.weapons.length; i++) {
			this.addWeapon(st.weapons[i], true);
		}
		this.setWeapon(st.currentWeapon, true);
	}
	this.setHearts(st.hearts, true);
	this.setHealth(st.health, true);
};

Player.prototype.update = function() {
	game.physics.arcade.collide(this.group, this.level.gTiles);
	game.physics.arcade.overlap(
		this.group, this.level.gOuch, this.playerOuch, null, this);
	var name;
	for (name in this.objs) {
		this.objs[name].behavior.update();
	}
};

// Handle an overlap between a player and an ouch region.
Player.prototype.playerOuch = function(player, ouch) {
	this.invoke(player, function(obj) { obj.kill(ouch.name); });
};

// Add a weapon to the player's inventory.
// Returns true if succesful, false otherwise.
Player.prototype.addWeapon = function(weapon, silent) {
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
		sprite.frame = info.getFrame(true);
		this.weapon = 0;
	} else {
		sprite.frame = info.getFrame(false);
	}
	this.weapons.push({
		name: weapon,
		info: info,
		sprite: sprite
	});
	if (!silent) {
		this.level.gState.weapons.push(weapon);
	}
};

// Set the current weapon.
Player.prototype.setWeapon = function(weapon, silent) {
	if (typeof weapon != 'number') {
		weapon = 0;
	}
	if (this.weapon < 0) {
		if (!silent) {
			game.sound.play('buzz');
		}
		return;
	}
	if (weapon < 0) {
		weapon = this.weapons.length - 1;
	} else if (weapon >= this.weapons.length) {
		weapon = 0;
	}
	if (!silent) {
		game.sound.play('clack');
	}
	if (this.weapon === weapon) {
		return;
	}
	var w = this.weapons[this.weapon];
	w.sprite.frame = w.info.getFrame(false);
	this.weapon = weapon;
	w = this.weapons[this.weapon];
	w.sprite.frame = w.info.getFrame(true);
	if (!silent) {
		this.level.gState.currentWeapon = weapon;
	}
};

// Get the name next available weapon for the player to pick up.
Player.prototype.getNextWeapon = function() {
	var w = this.weapons, s = {}, i, o = this.level.gState.weaponOrder;
	for (i = 0; i < w.length; i++) {
		s[w[i].name] = true;
	}
	for (i = 0; i < o.length; i++) {
		if (!s[o[i]]) {
			return o[i];
		}
	}
	console.error('No weapons left to pick up!');
	return null;
};

// Set the number of hearts (equal to half health capacity).
Player.prototype.setHearts = function(count, silent) {
	var i;
	var size = 48, margin = 4;
	if (count === this.hearts.length) {
		return;
	}
	for (i = this.hearts.length; i < count; i++) {
		var sprite = this.level.gUi.create(
			params.WIDTH - (size / 2 + margin + (margin + size) * i),
			size / 2 + margin,
			'hearts', 2);
		sprite.anchor.setTo(0.5, 0.5);
		this.hearts.push(sprite);
	}
	if (!silent) {
		this.level.gState.hearts = count;
	}
};

// Increase the number of hearts by one.
Player.prototype.addHeart = function(count) {
	var health = this.health;
	this.setHearts(this.hearts.length + 1);
	this.setHealth(health + 2);
};

// Set the player's current health.
Player.prototype.setHealth = function(amt, silent) {
	var i;
	var newHealth = Math.max(0, Math.min(this.hearts.length * 2, amt));
	for (i = 0; i < this.hearts.length; i++) {
		var heart = this.hearts[i];
		heart.frame = newHealth <= i * 2 ? 2 : (newHealth <= i * 2 + 1 ? 1 : 0);
	}
	this.health = newHealth;
	if (!silent) {
		this.level.gState.health = newHealth;
	}
};

// Heal the player to full health.
Player.prototype.healFull = function(amt) {
	this.setHealth(this.hearts.length * 2);
};

// Get the current weapon info.
Player.prototype.getWeaponInfo = function() {
	if (this.weapon < 0) {
		return null;
	}
	return this.weapons[this.weapon].info;
};

// Get the current player position, for monster targeting purposes.
Player.prototype.getTargetPosition = function() {
	var obj = this.objs.Player;
	if (!obj) {
		return null;
	}
	return obj.sprite.position;
};

// Get the current player sprite, for interaction purposes.
Player.prototype.getInteractSprite = function() {
	var obj = this.objs.Player;
	if (!obj || !obj.behavior.canInteract) {
		return null;
	}
	return obj.sprite;
};

// Get the real, actual player sprite.
Player.prototype.getSprite = function() {
	var obj = this.objs.Player;
	if (!obj) {
		return null;
	}
	return obj.sprite;
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
