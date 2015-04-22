/* Copyright 2015 Dietrich Epp.

   This file is part of Chaos Tomb.  The Chaos Tomb source code is
   distributed under the terms of the 2-clause BSD license.
   See LICENSE.txt for details. */
'use strict';
var params = require('./params');

////////////////////////////////////////////////////////////////////////
// Shot

// needs level, sprite, isPlayerShot attributes
function Shot() {}
Shot.prototype.kill = function(tile) {
	var shot = this.sprite;
	delete this.level.gShots.objs[this.sprite.name];
	shot.kill();
};
Shot.prototype.hitTile = function(tile) {
	var shot = this.sprite;
	this.level.gFx.spawn('Boom', shot.x, shot.y);
	this.kill();
};
Shot.prototype.hitMonster = function(monster) {
	if (this.isPlayerShot) {
		this.hitActor(monster, this.level.gMonsters);
	}
};
Shot.prototype.hitPlayer = function(player) {
	if (!this.isPlayerShot) {
		this.hitActor(player, this.level.gPlayer);
	}
};
Shot.prototype.hitActor = function(target, team) {
	var shot = this.sprite;
	var cx = (target.x + shot.x) / 2;
	var cy = (target.y + shot.y) / 2;
	this.level.gFx.spawn('Boom', cx, cy);
	game.sound.play('hurt');
	var push = explosionPush(target, shot, {
		push: 300,
		kick: 16
	});
	team.invoke(target, function(obj) {
		obj.damage(1);
		if (push) {
				obj.push(push);
		}
	});
	shot.kill();
};
Shot.prototype.update = function() {};
// Shot.prototype.outOfBoundsKill = true;
Shot.prototype.bounce = 1.0;
Shot.prototype.gravity = 0.0;
Shot.prototype.maxTime = 3.0;

function shotClass(attr) {
	var proto = Object.create(Shot.prototype);
	var name;
	for (name in attr) {
		proto[name] = attr[name];
	}
	return proto;
}

////////////////////////////////////////////////////////////////////////
// Bolt

function Bolt() {}
Bolt.prototype = shotClass({
	frame: 0,
	speed: 900,
	size: 12,
	sound: 'shot_short',
});

////////////////////////////////////////////////////////////////////////
// Eye

function Eye() {}
Eye.prototype = shotClass({
	frame: 1,
	speed: 450,
	size: 12,
	sound: 'shot_2',
});

////////////////////////////////////////////////////////////////////////
// Fish

function Fish() {}
Fish.prototype = shotClass({
	frame: 5,
	speed: 800,
	size: 12,
	sound: 'fish',
	gravity: params.GRAVITY,
});

////////////////////////////////////////////////////////////////////////
// Potato

function decelX(body, accel) {
	var dv = accel * game.time.physicsElapsed;
	if (Math.abs(body.velocity.x) < dv) {
		body.velocity.x = 0;
	} else {
		body.velocity.x -= dv * Math.sign(body.velocity.x);
	}
}

function Potato() {
	this.bounces = 2;
}
Potato.prototype = shotClass({
	frame: 3,
	speed: 500,
	size: 12,
	sound: 'throw',
	gravity: params.GRAVITY,
	hitActor: function() {},
	hitTile: function() {
		if (this.bounces > 0) {
			game.sound.play('potato');
			this.bounces--;
		}
	},
	update: function() {
		var body = this.sprite.body;
		if (body.blocked.down) {
			decelX(body, 800);
		}
	},
	bounce: 0.5,
});

////////////////////////////////////////////////////////////////////////
// Ball

function Ball() {
	this.bounces = 3;
}
Ball.prototype = shotClass({
	frame: 4,
	speed: 700,
	size: 16,
	sound: 'dink',
// 	outOfBoundsKill: false,
	bounce: 1.0,
	hitTile: function(tile) {
		this.bounces--;
		game.sound.play('dink');
		if (this.bounces <= 0) {
			var shot = this.sprite;
			this.level.gFx.spawn('Boom', shot.x, shot.y);
			this.kill();
		}
	},
});

////////////////////////////////////////////////////////////////////////
// Shots

var SHOTS = {
	Bolt: Bolt,
	Eye: Eye,
	Ball: Ball,
	Fish: Fish,
	Potato: Potato,
};

////////////////////////////////////////////////////////////////////////
// Shot manager

function Shots(level) {
	this.level = level;
	// Monster shots always in front so player can dodge better.
	this.group = level.add.group();
	this.group.enableBody = true;
	this.group.physicsBodyType = Phaser.Physics.ARCADE;
	this.objs = {};
	this.counter = 0;
}

function explosionPush(target, center, info, fixed) {
	info = info || {};
	var dx = target.x - center.x;
	var dy = target.y - center.y;
	var a;
	var dd = Math.hypot(dx, dy);
	if (info.push) {
		a = info.push;
	} else {
		var maxpush = info.maxpush || 200;
		var minpush = info.minpush || 100;
		var radius = info.radius || 32;
		a = radius - dd;
		if (a <= 0) {
			return null;
		}
		a = minpush + a * (maxpush - minpush) / radius;
	}
	if (info.kick) {
		dy -= info.kick;
		dd = Math.hypot(dx, dy);
	}
	if (dd < 1) {
		dx = 0;
		dy = 1;
	} else {
		a /= dd;
	}
	return new Phaser.Point(dx * a, dy * a);
}

// type, position(x, y), direction(x, y)
Shots.prototype.spawn = function(isPlayer, type, px, py, dx, dy) {
	var Constructor = SHOTS[type];
	if (!Constructor) {
		console.error('Unknown shot:', type);
		return;
	}
	var sprite, name;
	var obj = new Constructor();
	sprite = this.group.getFirstDead();
	if (sprite) {
		name = sprite.name;
		sprite.reset(px, py);
		sprite.frame = obj.frame;
	} else {
		name = 'Shot ' + this.group.length;
		sprite = this.group.create(px, py, 'shots', obj.frame);
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
	dfac *= obj.speed;
	sprite.body.velocity.set(dx * dfac, dy * dfac);
	sprite.body.setSize(obj.size, obj.size);
	sprite.body.bounce.set(obj.bounce);
	sprite.body.gravity.y = obj.gravity;
	obj.level = this.level;
	obj.sprite = sprite;
	obj.isPlayerShot = isPlayer;
	obj.timeElapsed = 0;
	this.objs[name] = obj;
	if (obj.sound) {
		game.sound.play(obj.sound);
	}
};

Shots.prototype.update = function() {
	game.physics.arcade.overlap(
		this.level.gMonsters.group, this.group, this.hitMonster, null, this);
	game.physics.arcade.overlap(
		this.level.gPlayer.group, this.group, this.hitPlayer, null, this);
	game.physics.arcade.overlap(
		this.group, this.level.gTiles, this.tileHit, null, this);
	var name, obj, i;
	for (name in this.objs) {
		obj = this.objs[name];
		if (obj.sprite.exists) {
			obj.timeElapsed += game.time.physicsElapsed;
			if (obj.timeElapsed > obj.maxTime) {
				obj.sprite.kill();
			}
		}
		if (obj.sprite.exists) {
			obj.update();
		}
	}
};

// Callback when shot hits player.
Shots.prototype.hitPlayer = function(player, shot) {
	if (!player.name) {
		return;
	}
	this.invoke(shot, function(obj) { obj.hitPlayer(player); });
};

// Callback when shot hits monster.
Shots.prototype.hitMonster = function(monster, shot) {
	if (!monster.name) {
		return;
	}
	this.invoke(shot, function(obj) { obj.hitMonster(monster); });
};

// Callback when shot hits tile.
Shots.prototype.tileHit = function(shot, tile) {
	this.invoke(shot, function(obj) { obj.hitTile(tile); });
};

// Call a function on a shot object.
Shots.prototype.invoke = function(sprite, func, context) {
	if (!sprite.exists) {
		return;
	}
	var name = sprite.name;
	var obj = this.objs[name];
	if (!obj) {
		console.error('Not a shot:', sprite);
		return;
	}
	func.call(context, obj);
};

////////////////////////////////////////////////////////////////////////
// Exports

module.exports = {
	Shots: Shots
};
