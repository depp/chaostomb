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
// Ball

function Ball() {}
Ball.prototype = shotClass({
	frame: 4,
	speed: 700,
	size: 16,
	sound: 'dink',
});

////////////////////////////////////////////////////////////////////////
// Shots

var SHOTS = {
	Bolt: Bolt,
	Eye: Eye,
	Ball: Ball,
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
	obj.level = this.level;
	obj.sprite = sprite;
	obj.isPlayerShot = isPlayer;
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
