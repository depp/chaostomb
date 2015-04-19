'use strict';

function Props(level) {
	this.level = level;
	this.group = level.add.group();
	this.objs = {};
	this.counter = 0;
}

var PROP_TYPES = {
	Door: {
		index: 0,
	},
	Chest: {
		index: 2,
	},
	Save: {
		index: 4,
	},
	Default: {
		index: null
	},
};

Props.prototype.spawn = function(index, info) {
	var tname, type = PROP_TYPES.Default;
	for (tname in PROP_TYPES) {
		if (PROP_TYPES[tname].index === index) {
			type = PROP_TYPES[tname];
			break;
		}
	}
	var name = 'Prop ' + this.counter;
	this.counter++;
	var sprite = this.group.create(
		info.x + 32, info.y - 32,
		'props', index);
	sprite.anchor.set(0.5, 0.5);
};

module.exports = {
	Props: Props,
};
