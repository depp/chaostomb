'use strict';
var params = require('./params');

function Weapon() {}

Weapon.prototype.getFrame = function(selected) {
	var icon = this.icon;
	var x = icon & 3, y = icon >> 2;
	if (selected) {
		x += 4;
	}
	return x + y * 8;
};

var WEAPONS = {
	Heart: {
		icon: 0,
		name: 'Power of Love',
	},
	Boot: {
		icon: 1,
		name: 'Fearsome Boot',
	},
	Doll: {
		icon: 2,
		name: 'Creepy Doll',
	},
	Fish: {
		icon: 3,
		name: 'Fish Schooler',
	},
	Teleport: {
		icon: 4,
		name: 'Transmat',
	},
	Wind: {
		icon: 5,
		name: 'Broken Wind',
	},
	Potato: {
		icon: 6,
		name: 'Potato',
	},
	Breakout: {
		icon: 7,
		name: 'Brick Breaker',
	},
	Billiards: {
		icon: 8,
		name: 'Pool Shark',
	},
	Artillery: {
		icon: 9,
		name: 'Heavy Cannon',
	},
	Math: {
		icon: 10,
		name: 'Arithmetical Emblem',
	},
	Snake: {
		icon: 11,
		name: 'King Cobra',
	},
	Gun: {
		icon: 12,
		name: 'Gun',
	},
	Sheep: {
		icon: 13,
		name: 'Baa Ram Ewe',
	},
	Type: {
		icon: 14,
		name: 'Key Pounder',
	},
	Shield: {
		icon: 15,
		name: 'Hexagonal Asset',
	},
};

(function() {
	var name, w, y, attr;
	for (name in WEAPONS) {
		w = WEAPONS[name];
		y = new Weapon();
		for (attr in w) {
			y[attr] = w[attr];
		}
		WEAPONS[name] = y;
	}
})();

module.exports = WEAPONS;
