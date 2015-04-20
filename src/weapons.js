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
		cooldown: 0,
		fire: function(level) {
			var targets = [], view = game.camera.view;
			level.gMonsters.group.forEachAlive(function(monster) {
				var pos = monster.position;
				if (monster.name && view.contains(pos.x, pos.y)) {
					targets.push(monster);
				}
			});
			var target;
			if (targets.length > 1) {
				target = targets[Math.floor(Math.random() * targets.length)];
			} else if (targets.length > 0) {
				target = targets[0];
			} else {
				target = level.gPlayer.getSprite();
			}
			if (!target) {
				return;
			}
			game.sound.play('warp');
			level.gFx.emitSparks(target.x, target.y);
			var body = target.body;
			var range = new Phaser.Rectangle(
				view.x + body.halfWidth,
				view.y + body.halfHeight,
				view.width - body.width,
				view.height - body.height);
			var hitRect = new Phaser.Rectangle(0, 0, body.width, body.height);
			var i, x, y, margin = 32;
			for (i = 0; i < 15; i++) {
				x = range.x + Math.floor(Math.random() * range.width);
				y = range.y + Math.floor(Math.random() * range.height);
				hitRect.x = x - body.halfWidth;
				hitRect.y = y - body.halfHeight;
				if (!level.testTileRect(hitRect)) {
					target.x = x;
					target.y = y;
					level.gFx.emitSparks(x, y);
					break;
				}
			}
		}
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
