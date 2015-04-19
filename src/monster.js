'use strict';
var params = require('./params');
var walker = require('./walker');
var loader = require('./loader');

function Monsters(level) {
	this.level = level;
	this.group = level.add.group();
	this.objs = {};
	this.counter = 0;
}

Monsters.prototype = {
	spawn: function(obj) {
		var stats = params.MONSTERS[obj.type];
		if (!stats) {
			console.error('Unknown monster:', obj.type);
			return;
		}
		var name = 'Monster ' + this.counter;
		this.counter++;
		var sprite = this.group.create(
			obj.x + obj.width / 2, obj.y + obj.height / 2);
		loader.setAnimations(sprite, obj.type.toLowerCase());
		sprite.anchor.setTo(0.5, 0.5);
		sprite.name = name;
		game.physics.arcade.enable(sprite);
		sprite.body.collideWorldBounds = true;
		sprite.body.gravity.y = params.GRAVITY;
		sprite.body.maxVelocity.set(params.MAX_VELOCITY, params.MAX_VELOCITY);
		this.objs[name] = {
			sprite: sprite,
			stats: stats,
			health: stats.health,
			walker: new walker.Walker(sprite, stats.stats),
			state: this.statePatrol,
			param: Math.random() > 0.5 ? 2 : 0,
			time: 0,
			stuntime: 0
		};
	},

	update: function() {
		game.physics.arcade.collide(this.group, this.level.gTiles);
		var name, obj;
		for (name in this.objs) {
			obj = this.objs[name];
			if (obj.state) {
				obj.state.call(this, obj);
			}
		}
	},

	statePatrol: function(obj) {
		if (obj.stuntime > 0) {
			obj.walker.update(0, 0, true);
			obj.stuntime -= game.time.physicsElapsed;
			return;
		}
		switch (obj.param) {
		case 0:
			obj.walker.update(-1, 0);
			if (obj.sprite.body.blocked.left) {
				obj.param = 1;
				obj.time = (Math.random() + 0.5) * obj.stats.ai.pausetime;
			}
			break;

		case 2:
			obj.walker.update(+1, 0);
			if (obj.sprite.body.blocked.right) {
				obj.param = 3;
				obj.time = (Math.random() + 0.5) * obj.stats.ai.pausetime;
			}
			break;

		case 1:
		case 3:
			obj.walker.update(0, 0);
			obj.time -= game.time.physicsElapsed;
			if (obj.time <= 0) {
				obj.param = (obj.param + 1) & 3;
			}
			break;
		}
	},

	stateDead: function(obj) {
		if (obj.time > 0) {
			obj.time -= game.time.physicsElapsed;
		}
		if (obj.time <= 0 && obj.sprite.body.blocked.down) {
			obj.state = null;
			obj.sprite.body.enable = false;
			obj.sprite.play('dead');
			return;
		}
		obj.walker.update(0, 0, true);
	},

	kill: function(obj) {
		obj.state = this.stateDead;
		obj.time = params.MONSTER_DEATH_TIME;
	},

	// Damage a monster.
	damage: function(sprite, amt) {
		var obj = this.find(sprite);
		if (!obj || obj.health <= 0) {
			return;
		}
		obj.health--;
		if (obj.health > 0) {
			obj.stuntime = params.MONSTER_STUN_TIME;
		} else {
			this.kill(obj);
		}
	},

	// Push a monster.
	push: function(sprite, push) {
		var obj = this.find(sprite);
		if (!obj) {
			return;
		}
		var vel = sprite.body.velocity;
		if (obj.health <= 0) {
			var d = vel.dot(push);
			if (d <= 0) {
				vel.setTo(push.x, push.y);
				return;
			}
		}
		Phaser.Point.add(vel, push, vel);
	},

	find: function(sprite) {
		var name = sprite.name;
		var obj = this.objs[name];
		if (!obj) {
			console.error('Not a monster:', sprite);
			return null;
		}
		return obj;
	}
};

module.exports = {
	Monsters: Monsters
};
