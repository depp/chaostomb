'use strict';
var params = require('./params');
var mover = require('./mover');
var assets = require('./assets');

function randAdjust() {
	return (Math.random() + 1) * (2 / 3);
}

var MONSTER_TYPES = {
	0: 'Eye',
};

////////////////////////////////////////////////////////////////////////
// Behavior

function Behavior(obj) {
	this.obj = obj;
}
Behavior.prototype.update = function() {
	this.obj.mover.update(0, 0, false);
};
Behavior.prototype.stun = function() {
	this.obj.behavior = new Stun(this.obj);
};
Behavior.prototype.damage = function(amt) {
	if (typeof amt == 'undefined') {
		amt = 1;
	}
	this.obj.health -= amt;
	if (this.obj.health > 0) {
		this.stun();
	} else {
		this.kill();
	}
};
Behavior.prototype.kill = function() {
	this.obj.behavior = new Die(this.obj);
};
Behavior.prototype.push = function(push) {
	var vel = this.obj.sprite.body.velocity;
	Phaser.Point.add(vel, push, vel);
};

////////////////////////////////////////////////////////////////////////
// Stun

function Stun(obj) {
	this.obj = obj;
	this.time = params.MONSTER_STUN_TIME;
	this.previous = obj.behavior;
}
Stun.prototype = Object.create(Behavior.prototype);
Stun.prototype.update = function() {
	this.obj.mover.update(0, 0, true);
	this.time -= game.time.physicsElapsed;
	if (this.time <= 0 && this.obj.sprite.body.blocked.down) {
		this.obj.behavior = this.previous;
	}
};
Stun.prototype.stun = function(obj) {
	this.time = params.MONSTER_STUN_TIME;
};

////////////////////////////////////////////////////////////////////////
// Die

function Die(obj) {
	obj.sprite.body.gravity.y = params.GRAVITY;
	this.obj = obj;
	this.time = params.MONSTER_DEATH_TIME;
}
Die.prototype = Object.create(Behavior.prototype);
Die.prototype.update = function() {
	this.obj.mover.update(0, 0, true);
	this.time -= game.time.physicsElapsed;
	if (this.time <= 0) {
		this.obj.sprite.body.enable = false;
		this.obj.mover = new mover.Corpse(this.obj.sprite);
		this.obj.behavior = new Behavior(this.obj);
	}
};
Die.prototype.stun = function() {};
Die.prototype.damage = function(amt) {};
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
Die.prototype.kill = function() {};

////////////////////////////////////////////////////////////////////////
// Patrol

function Patrol(obj) {
	this.obj = obj;
	this.state = Math.random() > 0.5 ? 2 : 0;
	this.time = 0;
	this.scantime = this.obj.stats.scaninterval * randAdjust();
}
Patrol.prototype = Object.create(Behavior.prototype);
Patrol.prototype.update = function() {
	var obj = this.obj;
	this.scantime -= game.time.physicsElapsed;
	if (this.scantime <= 0) {
		this.scantime = obj.stats.scaninterval * randAdjust();
		this.scan();
	}
	var pos = obj.sprite.position;
	var x = pos.x, y = pos.y + obj.stats.height / 2 + 16;
	var dx = obj.stats.width * 1.5;
	switch (this.state) {
	case 0:
		obj.mover.update(-1, 0);
		if (obj.sprite.body.blocked.left || !obj.level.testTile(x - dx, y)) {
			this.state = 1;
			this.time = randAdjust() * obj.stats.patrolpause;
		}
		break;

	case 2:
		obj.mover.update(+1, 0);
		if (obj.sprite.body.blocked.right || !obj.level.testTile(x + dx, y)) {
			this.state = 3;
			this.time = randAdjust() * obj.stats.patrolpause;
		}
		break;

	case 1:
	case 3:
		obj.mover.update(0, 0);
		this.time -= game.time.physicsElapsed;
		if (this.time <= 0) {
			this.state = (this.state + 1) & 3;
		}
		break;
	}
};
Patrol.prototype.scan = function() {
	var target = this.obj.level.gPlayer.getTargetPosition();
	var pos = this.obj.sprite.position;
	if (!target || pos.distance(target) > this.obj.stats.shotrange) {
		return;
	}
	this.obj.behavior = new Shoot(this.obj, target);
};

////////////////////////////////////////////////////////////////////////
// Shoot

function Shoot(obj, target) {
	this.obj = obj;
	this.time = obj.stats.shotdelay;
	this.count = obj.stats.shotcount;
	this.previous = obj.behavior;
	this.target = target;
}
Shoot.prototype = Object.create(Behavior.prototype);
Shoot.prototype.update = function() {
	this.obj.mover.update(0, 0);
	this.time -= game.time.physicsElapsed;
	if (this.time > 0) {
		return;
	}
	if (this.count <= 0) {
		this.obj.behavior = this.previous;
		return;
	}
	var target = this.obj.level.gPlayer.getTargetPosition();
	if (!target) {
		target = this.target;
	} else {
		this.target = target;
	}
	var pos = this.obj.sprite.position;
	this.obj.level.gShots.spawn(
		false, this.obj.stats.shot,
		pos.x, pos.y,
		target.x - pos.x, target.y - pos.y);
	this.count--;
	if (this.count <= 0) {
		this.time = this.obj.stats.shotrecover;
	} else {
		this.time = this.obj.stats.shotinterval;
	}
};

////////////////////////////////////////////////////////////////////////
// Monsters

function Monsters(level) {
	this.level = level;
	this.group = level.add.group();
	this.objs = {};
	this.counter = 0;
}

Monsters.prototype.spawn = function(gid, info) {
	var type = MONSTER_TYPES[gid];
	if (!type) {
		console.error('Unknown monster GID');
		return;
	}
	var stats = params.MONSTERS[type];
	if (!stats) {
		console.error('Unknown monster:', info.type);
		return;
	}
	var name = 'Monster ' + this.counter;
	this.counter++;
	var sprite = this.group.create(
		info.x + 32, info.y - stats.height / 2);
	assets.setAnimations(sprite, type.toLowerCase());
	sprite.anchor.setTo(0.5, 0.5);
	sprite.name = name;
	game.physics.arcade.enable(sprite);
	sprite.body.collideWorldBounds = true;
	sprite.body.gravity.y = params.GRAVITY;
	sprite.body.maxVelocity.set(params.MAX_VELOCITY, params.MAX_VELOCITY);
	var obj = {
		level: this.level,
		sprite: sprite,
		stats: stats,
		health: stats.health,
		behavior: null,
		mover: new mover.Walker(sprite, stats.stats),
	};
	obj.behavior = new Patrol(obj);
	this.objs[name] = obj;
};

Monsters.prototype.update = function() {
	game.physics.arcade.collide(this.group, this.level.gTiles);
	var name;
	for (name in this.objs) {
		this.objs[name].behavior.update();
	}
};

// Call a function on a monster object.
Monsters.prototype.invoke = function(sprite, func, context) {
	var name = sprite.name;
	var obj = this.objs[name];
	if (!obj) {
		console.error('Not a monster:', sprite);
		return;
	}
	func.call(context, obj.behavior);
};

////////////////////////////////////////////////////////////////////////
// Exports

module.exports = {
	Monsters: Monsters,
	MONSTER_TYPES: MONSTER_TYPES
};
