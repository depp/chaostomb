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
		};
	},

	update: function() {
		game.physics.arcade.collide(this.group, this.level.gTiles);
		var name, obj;
		for (name in this.objs) {
			obj = this.objs[name];
			obj.state.call(this, obj);
		}
	},

	statePatrol: function(obj) {
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
			obj.time -= game.time.physicsElapsed;
			if (obj.time <= 0) {
				obj.param = (obj.param + 1) & 3;
			}
			break;
		}
	},

	// Damage a monster.
	damage: function(sprite, amt) {

	},

	// Push a monster.
	push: function(sprite, dx, dy) {
		sprite.body.velocity.add(dx, dy);
	},
};

module.exports = {
	Monsters: Monsters
};
