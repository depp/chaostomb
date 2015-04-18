'use strict';
var params = require('./params');
var walker = require('./walker');

function Monsters(level) {
	this.group = level.add.group();
	this.group.enableBody = true;
	this.group.physicsBodyType = Phaser.Physics.ARCADE;
	this.state = {};
	this.counter = 0;
}

Monsters.prototype = {
	spawn: function(obj) {
		var stats = params.MONSTERS[obj.type];
		var name = 'Monster ' + this.counter;
		this.counter++;
		var sprite = this.group.create(
			obj.x + obj.width / 2, obj.y + obj.height / 2, obj.type.toLowerCase());
		sprite.anchor.setTo(0.5, 0.5);
		sprite.name = name;
		sprite.body.collideWorldBounds = true;
		this.state[name] = {
			sprite: sprite,
			stats: stats,
			walker: new walker.Walker(sprite, stats.stats)
		};
	},

	update: function() {
		var name, state;
		for (name in this.state) {
			state = this.state[name];
			state.walker.update(1, 0);
		}
	}
};

module.exports = {
	Monsters: Monsters
};
